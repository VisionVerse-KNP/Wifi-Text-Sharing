import { useCallback, useRef, useState } from 'react';
import { getServerUrl } from '../lib/serverUrl';
import { uploadFileWithProgress, UploadHandle } from '../lib/uploadFile';
import { formatFileSize, isLikelyBlocked, MAX_FILE_SIZE_BYTES } from '../lib/fileMeta';

export interface UploadItem {
  localId: string;
  file: File;
  progress: number;
  status: 'uploading' | 'error';
  error?: string;
}

interface Options {
  roomId: string | null;
  selfId: string | null;
  displayName: string | null;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

export function useFileUploads({ roomId, selfId, displayName, onError, onSuccess }: Options) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const handles = useRef<Map<string, UploadHandle>>(new Map());

  const uploadFiles = useCallback(
    (fileList: FileList | File[]) => {
      if (!roomId || !selfId || !displayName) return;
      const files = Array.from(fileList);

      files.forEach((file) => {
        if (isLikelyBlocked(file.name)) {
          onError?.(`"${file.name}" can't be shared — that file type isn't allowed.`);
          return;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          onError?.(`"${file.name}" is too large (max ${formatFileSize(MAX_FILE_SIZE_BYTES)}).`);
          return;
        }

        const localId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setUploads((prev) => [...prev, { localId, file, progress: 0, status: 'uploading' }]);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('uploaderId', selfId);
        formData.append('uploaderName', displayName);

        const handle = uploadFileWithProgress(`${getServerUrl()}/api/rooms/${roomId}/files`, formData, {
          onProgress: (percent) => {
            setUploads((prev) =>
              prev.map((u) => (u.localId === localId ? { ...u, progress: percent } : u))
            );
          },
          onSuccess: () => {
            // The server broadcasts a file:new socket event to everyone in the
            // room, including the uploader — that's what actually adds the
            // file card. Here we just clear the in-flight progress entry.
            handles.current.delete(localId);
            setUploads((prev) => prev.filter((u) => u.localId !== localId));
            onSuccess?.(`"${file.name}" uploaded successfully`);
          },
          onError: (message) => {
            handles.current.delete(localId);
            setUploads((prev) =>
              prev.map((u) => (u.localId === localId ? { ...u, status: 'error', error: message } : u))
            );
            onError?.(message);
          },
        });
        handles.current.set(localId, handle);
      });
    },
    [roomId, selfId, displayName, onError, onSuccess]
  );

  const cancelUpload = useCallback((localId: string) => {
    handles.current.get(localId)?.cancel();
    handles.current.delete(localId);
    setUploads((prev) => prev.filter((u) => u.localId !== localId));
  }, []);

  const dismissUpload = useCallback((localId: string) => {
    setUploads((prev) => prev.filter((u) => u.localId !== localId));
  }, []);

  return { uploads, uploadFiles, cancelUpload, dismissUpload };
}
