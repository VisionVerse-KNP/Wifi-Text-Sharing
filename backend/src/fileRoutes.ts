import { Router, Request } from 'express';
import { Server } from 'socket.io';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import rateLimit from 'express-rate-limit';
import * as store from './roomStore';
import * as fileStorage from './fileStorage';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  FileAttachment,
} from './types';

type IOServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const MAX_UPLOADER_NAME_LENGTH = 30;
const MAX_ROOM_ID_LENGTH = 60;

class UploadRejected extends Error {}

function sanitizeUploaderName(name: unknown): string {
  const raw = typeof name === 'string' ? name : 'Guest';
  return raw.replace(/\s+/g, ' ').trim().slice(0, MAX_UPLOADER_NAME_LENGTH) || 'Guest';
}

/**
 * The raw room id (as sent by the client / used as the Socket.IO room name
 * and roomStore Map key) is NOT the same string used for the on-disk
 * folder — LAN room ids can contain dots/colons that need sanitizing for
 * the filesystem. Every handler below is careful to use `roomId` (raw) for
 * store/io operations and `fileStorage.sanitizeRoomId(roomId)` only when
 * touching disk.
 */
function rawRoomId(req: Request): string {
  return (req.params.roomId || '').slice(0, MAX_ROOM_ID_LENGTH);
}

const storage = multer.diskStorage({
  destination: (req: Request, _file, cb) => {
    const roomId = rawRoomId(req);
    if (!roomId) {
      cb(new UploadRejected('Invalid room.'), '');
      return;
    }
    try {
      cb(null, fileStorage.ensureRoomDir(roomId));
    } catch (err) {
      cb(err as Error, '');
    }
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(fileStorage.sanitizeFilename(file.originalname));
    cb(null, `${randomUUID()}${ext}`);
  },
});

function fileFilter(req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
  const roomId = rawRoomId(req);
  if (!roomId) return cb(new UploadRejected('Invalid room.'));

  const existing = store.getRoomFiles(roomId);
  if (existing.length >= fileStorage.MAX_FILES_PER_ROOM) {
    return cb(new UploadRejected('This room has reached its shared-file limit.'));
  }
  const totalBytes = existing.reduce((sum, f) => sum + f.size, 0);
  if (totalBytes >= fileStorage.MAX_ROOM_STORAGE_BYTES) {
    return cb(new UploadRejected('This room has reached its storage limit.'));
  }

  const ext = path.extname(file.originalname);
  if (fileStorage.isExtensionBlocked(ext)) {
    return cb(new UploadRejected('This file type is not allowed for security reasons.'));
  }
  if (!fileStorage.isAllowedFile(file.mimetype, ext)) {
    return cb(new UploadRejected('Unsupported file type.'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: fileStorage.MAX_FILE_SIZE_BYTES, files: 1 },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many uploads. Please wait a moment and try again.' },
});

function contentDisposition(type: 'attachment' | 'inline', originalName: string): string {
  const asciiFallback = originalName.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, "'");
  return `${type}; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(originalName)}`;
}

export function createFileRouter(io: IOServer): Router {
  const router = Router();

  router.post('/rooms/:roomId/files', uploadLimiter, (req, res) => {
    upload.single('file')(req, res, (err) => {
      if (err instanceof UploadRejected) {
        res.status(400).json({ error: err.message });
        return;
      }
      if (err instanceof multer.MulterError) {
        const message =
          err.code === 'LIMIT_FILE_SIZE'
            ? `File is too large. Max size is ${Math.round(fileStorage.MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB.`
            : 'Upload failed.';
        res.status(413).json({ error: message });
        return;
      }
      if (err) {
        res.status(400).json({ error: 'Upload failed.' });
        return;
      }

      const roomId = rawRoomId(req);
      if (!req.file || !roomId) {
        res.status(400).json({ error: 'Missing file or room.' });
        return;
      }

      const originalName = fileStorage.sanitizeFilename(req.file.originalname);
      const ext = path.extname(originalName);
      const attachment: FileAttachment = {
        id: randomUUID(),
        uploaderId: typeof req.body.uploaderId === 'string' ? req.body.uploaderId.slice(0, 64) : '',
        uploaderName: sanitizeUploaderName(req.body.uploaderName),
        originalName,
        storedName: req.file.filename,
        mimeType: req.file.mimetype || 'application/octet-stream',
        size: req.file.size,
        category: fileStorage.categorize(ext),
        uploadedAt: Date.now(),
      };

      // roomId here MUST be the raw id: it's both the roomStore Map key and
      // the Socket.IO room name that clients joined via socket.join(roomId).
      store.addFileRecord(roomId, attachment);
      io.to(roomId).emit('file:new', attachment);
      res.status(201).json(attachment);
    });
  });

  router.get('/rooms/:roomId/files/:fileId/download', (req, res) => {
    serveFile(req, res, 'attachment');
  });

  router.get('/rooms/:roomId/files/:fileId/view', (req, res) => {
    serveFile(req, res, 'inline');
  });

  function serveFile(req: Request, res: import('express').Response, disposition: 'attachment' | 'inline') {
    const roomId = rawRoomId(req);
    const record = store.getRoomFiles(roomId).find((f) => f.id === req.params.fileId);
    if (!record) {
      res.status(404).json({ error: 'File not found.' });
      return;
    }

    const absolutePath = fileStorage.filePath(roomId, record.storedName);
    res.set('Content-Disposition', contentDisposition(disposition, record.originalName));
    res.set('Content-Type', record.mimeType);
    res.set('X-Content-Type-Options', 'nosniff');
    res.sendFile(absolutePath, (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({ error: 'File not found.' });
      }
    });
  }

  return router;
}
