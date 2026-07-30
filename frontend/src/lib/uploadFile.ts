import { FileAttachment } from '../types';

export interface UploadHandle {
  cancel: () => void;
}

export interface UploadCallbacks {
  onProgress: (percent: number) => void;
  onSuccess: (attachment: FileAttachment) => void;
  onError: (message: string) => void;
}

export function uploadFileWithProgress(
  url: string,
  formData: FormData,
  { onProgress, onSuccess, onError }: UploadCallbacks
): UploadHandle {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', url, true);

  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      onProgress(Math.round((event.loaded / event.total) * 100));
    }
  };

  xhr.onload = () => {
    let body: unknown = null;
    try {
      body = JSON.parse(xhr.responseText);
    } catch {
      // non-JSON response, fall through to status-based handling below
    }
    if (xhr.status >= 200 && xhr.status < 300) {
      onSuccess(body as FileAttachment);
    } else {
      const message =
        body && typeof body === 'object' && 'error' in body
          ? String((body as { error: unknown }).error)
          : 'Upload failed.';
      onError(message);
    }
  };

  xhr.onerror = () => onError('Network error during upload.');
  xhr.onabort = () => onError('Upload cancelled.');

  xhr.send(formData);

  return {
    cancel: () => xhr.abort(),
  };
}
