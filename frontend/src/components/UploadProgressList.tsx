import { UploadItem } from '../hooks/useFileUploads';
import { formatFileSize, iconForCategory, categorize } from '../lib/fileMeta';

interface Props {
  uploads: UploadItem[];
  onCancel: (localId: string) => void;
  onDismiss: (localId: string) => void;
  onRetry: (file: File) => void;
}

export default function UploadProgressList({ uploads, onCancel, onDismiss, onRetry }: Props) {
  if (uploads.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mb-1" aria-live="polite">
      {uploads.map((u) => (
        <div
          key={u.localId}
          className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
        >
          <span className="text-lg shrink-0" aria-hidden>
            {iconForCategory(categorize(u.file.name))}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{u.file.name}</p>
            {u.status === 'uploading' ? (
              <div className="mt-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-brand-500 transition-all duration-150"
                  style={{ width: `${u.progress}%` }}
                />
              </div>
            ) : (
              <p className="text-red-500 mt-0.5">{u.error ?? 'Upload failed.'}</p>
            )}
          </div>
          {u.status === 'uploading' ? (
            <>
              <span className="text-slate-400 shrink-0">{u.progress}%</span>
              <button
                onClick={() => onCancel(u.localId)}
                aria-label={`Cancel upload of ${u.file.name}`}
                className="shrink-0 w-6 h-6 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition"
              >
                ✕
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onRetry(u.file)}
                className="text-brand-600 dark:text-brand-300 font-medium hover:underline"
              >
                Retry
              </button>
              <button
                onClick={() => onDismiss(u.localId)}
                aria-label="Dismiss"
                className="w-6 h-6 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
