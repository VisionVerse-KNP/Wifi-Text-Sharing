import { FileAttachment } from '../types';
import { formatFileSize, iconForCategory } from '../lib/fileMeta';
import { formatTime } from '../lib/format';
import { fileDownloadUrl, fileViewUrl } from '../lib/fileUrls';

interface Props {
  file: FileAttachment;
  isOwn: boolean;
  roomId: string;
  color: string;
  onDelete: (id: string) => void;
  onDownload: (file: FileAttachment) => void;
  onPreview: (file: FileAttachment) => void;
}

export default function FileCard({ file, isOwn, roomId, color, onDelete, onDownload, onPreview }: Props) {
  const downloadUrl = fileDownloadUrl(roomId, file.id);
  const isImage = file.category === 'image';

  return (
    <div className={`flex gap-2.5 min-w-0 animate-slide-up ${isOwn ? 'flex-row-reverse' : ''}`}>
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 overflow-hidden"
        style={{ backgroundColor: color }}
      >
        {isImage ? (
          <img src={fileViewUrl(roomId, file.id)} alt="" loading="lazy" className="w-full h-full object-cover" />
        ) : (
          iconForCategory(file.category)
        )}
      </span>

      <div className={`min-w-0 max-w-[85%] sm:max-w-[75%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-0.5 text-xs text-slate-400">
          {!isOwn && <span className="font-medium text-slate-500 dark:text-slate-300">{file.uploaderName}</span>}
          <span>{formatTime(file.uploadedAt)}</span>
        </div>

        {isImage ? (
          <button
            onClick={() => onPreview(file)}
            className="block rounded-2xl overflow-hidden max-w-[220px] border border-slate-200 dark:border-slate-700 hover:opacity-90 transition"
            aria-label={`View ${file.originalName}`}
          >
            <img src={fileViewUrl(roomId, file.id)} alt={file.originalName} loading="lazy" className="w-full max-h-56 object-cover" />
          </button>
        ) : (
          <button
            onClick={() => onPreview(file)}
            className={`w-full sm:min-w-[260px] px-4 py-3 rounded-2xl text-sm flex items-center gap-3 text-left transition ${
              isOwn
                ? 'bg-brand-500 text-white rounded-tr-sm hover:bg-brand-600'
                : 'bg-white/80 dark:bg-slate-800/80 rounded-tl-sm hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <span className="text-2xl shrink-0" aria-hidden>
              {iconForCategory(file.category)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-medium truncate block" title={file.originalName}>
                {file.originalName}
              </span>
              <span className={`text-xs block ${isOwn ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                {formatFileSize(file.size)}
              </span>
            </span>
          </button>
        )}

        <div className="flex gap-3 mt-1 text-[11px] text-slate-400">
          <a href={downloadUrl} download={file.originalName} onClick={() => onDownload(file)} className="hover:text-brand-500 transition">
            Download
          </a>
          {isOwn && (
            <button onClick={() => onDelete(file.id)} className="hover:text-red-500 transition">
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
