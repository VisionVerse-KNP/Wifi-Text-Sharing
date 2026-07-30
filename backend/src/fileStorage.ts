import fs from 'fs';
import path from 'path';
import { FileCategory } from './types';

/**
 * All uploaded files live under backend/uploads/<roomId>/<uuid><ext>, one
 * subfolder per room. Filenames on disk are never the user's original
 * filename (that's only ever used in the Content-Disposition header when
 * downloading) — this avoids path traversal and collisions entirely.
 */
export const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

export const MAX_FILE_SIZE_BYTES = (Number(process.env.FILE_MAX_SIZE_MB) || 50) * 1024 * 1024;
export const MAX_FILES_PER_ROOM = 300;
export const MAX_ROOM_STORAGE_BYTES = 1024 * 1024 * 1024; // 1 GB / room

// Extensions that could execute code if double-clicked or run by the OS —
// blocked unconditionally regardless of claimed MIME type.
export const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.com', '.msi', '.msp', '.scr', '.ps1', '.psm1',
  '.vbs', '.vbe', '.js.exe', '.jar', '.app', '.apk', '.dll', '.sh', '.bin',
  '.deb', '.rpm', '.dmg', '.pkg', '.run', '.gadget', '.msc', '.cpl', '.reg',
  '.lnk', '.ws', '.wsf', '.wsh', '.hta', '.jse', '.scf', '.action', '.workflow',
]);

const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/x-icon',
  // PDF
  'application/pdf',
  // Word / Excel / PowerPoint
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  'application/rtf',
  // Archives
  'application/zip', 'application/x-zip-compressed', 'application/x-7z-compressed',
  'application/x-rar-compressed', 'application/vnd.rar', 'application/gzip', 'application/x-tar',
  // Text / data
  'text/plain', 'text/markdown', 'text/csv', 'application/json', 'application/xml', 'text/xml',
  'text/html', 'text/css', 'application/javascript', 'text/javascript', 'application/x-yaml', 'text/yaml',
  // Audio
  'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm', 'audio/aac', 'audio/flac',
  'audio/mp4', 'audio/x-m4a',
  // Video
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
]);

// Fallback allowlist by extension for when browsers send a generic
// application/octet-stream MIME type (common for Office/archive formats).
const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico',
  '.pdf',
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp', '.rtf',
  '.zip', '.7z', '.rar', '.gz', '.tar', '.tgz',
  '.txt', '.md', '.csv', '.json', '.xml', '.html', '.css', '.js', '.ts', '.jsx', '.tsx',
  '.py', '.rb', '.java', '.c', '.cpp', '.go', '.rs', '.php', '.sql', '.yaml', '.yml', '.log',
  '.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac',
  '.mp4', '.webm', '.mov', '.avi', '.mkv',
]);

const CATEGORY_BY_EXTENSION: Record<string, FileCategory> = {
  '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.gif': 'image', '.webp': 'image',
  '.svg': 'image', '.bmp': 'image', '.ico': 'image',
  '.mp4': 'video', '.webm': 'video', '.mov': 'video', '.avi': 'video', '.mkv': 'video', '.ogv': 'video',
  '.mp3': 'audio', '.wav': 'audio', '.ogg': 'audio', '.m4a': 'audio', '.aac': 'audio', '.flac': 'audio',
  '.pdf': 'pdf',
  '.doc': 'document', '.docx': 'document', '.odt': 'document', '.rtf': 'document',
  '.xls': 'spreadsheet', '.xlsx': 'spreadsheet', '.csv': 'spreadsheet', '.ods': 'spreadsheet',
  '.ppt': 'presentation', '.pptx': 'presentation', '.odp': 'presentation',
  '.zip': 'archive', '.7z': 'archive', '.rar': 'archive', '.gz': 'archive', '.tar': 'archive', '.tgz': 'archive',
  '.js': 'code', '.ts': 'code', '.jsx': 'code', '.tsx': 'code', '.py': 'code', '.rb': 'code',
  '.java': 'code', '.c': 'code', '.cpp': 'code', '.go': 'code', '.rs': 'code', '.php': 'code', '.sql': 'code',
  '.txt': 'text', '.md': 'text', '.json': 'text', '.xml': 'text', '.html': 'text', '.css': 'text',
  '.yaml': 'text', '.yml': 'text', '.log': 'text',
};

export function sanitizeFilename(name: string): string {
  const base = path.basename(name).replace(/[\\/]/g, '');
  const cleaned = base.replace(/[^a-zA-Z0-9 ._\-()[\]]/g, '_').trim();
  const withoutLeadingDots = cleaned.replace(/^\.+/, '') || 'file';
  return withoutLeadingDots.slice(0, 180);
}

export function sanitizeRoomId(roomId: string): string {
  // Room IDs used as Socket.IO/store keys can contain dots (LAN subnet ids
  // like "v4-192.168.1") or colons (IPv6 ids) — replace anything unsafe for
  // a filesystem path instead of stripping, so different rooms never
  // collide onto the same folder.
  return (roomId || '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60) || '_';
}

export function isExtensionBlocked(ext: string): boolean {
  return BLOCKED_EXTENSIONS.has(ext.toLowerCase());
}

export function isAllowedFile(mimeType: string, ext: string): boolean {
  const lowerExt = ext.toLowerCase();
  if (ALLOWED_MIME_TYPES.has(mimeType)) return true;
  return ALLOWED_EXTENSIONS.has(lowerExt);
}

export function categorize(ext: string): FileCategory {
  return CATEGORY_BY_EXTENSION[ext.toLowerCase()] ?? 'other';
}

export function roomDir(roomId: string): string {
  return path.join(UPLOAD_ROOT, sanitizeRoomId(roomId));
}

export function ensureRoomDir(roomId: string): string {
  const dir = roomDir(roomId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function filePath(roomId: string, storedName: string): string {
  return path.join(roomDir(roomId), storedName);
}

/** Deletes a single stored file, silently ignoring "already gone". */
export function deleteStoredFile(roomId: string, storedName: string): void {
  fs.rm(filePath(roomId, storedName), { force: true }, () => {
    // Best-effort cleanup — nothing else to do if this fails.
  });
}

/** Deletes an entire room's upload directory (room deleted / board cleared). */
export function deleteRoomFiles(roomId: string): void {
  fs.rm(roomDir(roomId), { recursive: true, force: true }, () => {
    // Best-effort cleanup.
  });
}
