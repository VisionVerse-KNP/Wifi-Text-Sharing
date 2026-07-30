import { useMemo, useState } from 'react';
import { FileAttachment, FileCategory } from '../types';
import { formatFileSize, iconForCategory } from '../lib/fileMeta';
import { formatTime } from '../lib/format';
import { fileDownloadUrl, fileViewUrl } from '../lib/fileUrls';

interface Props {
  files: FileAttachment[];
  roomId: string;
  selfId: string | null;
  onClose: () => void;
  onPreview: (file: FileAttachment) => void;
  onDownload: (file: FileAttachment) => void;
  onDelete: (id: string) => void;
}

type FilterBucket = 'all' | 'image' | 'video' | 'audio' | 'document' | 'other';
type SortMode = 'latest' | 'oldest' | 'size' | 'type';

const FILTERS: { key: FilterBucket; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: '🗂️' },
  { key: 'image', label: 'Images', icon: '🖼️' },
  { key: 'document', label: 'Documents', icon: '📄' },
  { key: 'video', label: 'Videos', icon: '🎬' },
  { key: 'audio', label: 'Audio', icon: '🎵' },
  { key: 'other', label: 'Others', icon: '📎' },
];

const DOCUMENT_CATEGORIES: FileCategory[] = ['pdf', 'document', 'spreadsheet', 'presentation', 'code', 'text'];

function bucketOf(category: FileCategory): FilterBucket {
  if (category === 'image') return 'image';
  if (category === 'video') return 'video';
  if (category === 'audio') return 'audio';
  if (DOCUMENT_CATEGORIES.includes(category)) return 'document';
  return 'other';
}

export default function FileGalleryModal({ files, roomId, selfId, onClose, onPreview, onDownload, onDelete }: Props) {
  const [filter, setFilter] = useState<FilterBucket>('all');
  const [sort, setSort] = useState<SortMode>('latest');
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    let list = files;
    if (filter !== 'all') list = list.filter((f) => bucketOf(f.category) === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (f) => f.originalName.toLowerCase().includes(q) || f.uploaderName.toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    switch (sort) {
      case 'latest':
        sorted.sort((a, b) => b.uploadedAt - a.uploadedAt);
        break;
      case 'oldest':
        sorted.sort((a, b) => a.uploadedAt - b.uploadedAt);
        break;
      case 'size':
        sorted.sort((a, b) => b.size - a.size);
        break;
      case 'type':
        sorted.sort((a, b) => a.category.localeCompare(b.category) || a.originalName.localeCompare(b.originalName));
        break;
    }
    return sorted;
  }, [files, filter, search, sort]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-3xl max-h-[85vh] flex flex-col p-5 sm:p-6 animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">🗂️ Shared Files ({files.length})</h3>
          <button
            onClick={onClose}
            aria-label="Close file gallery"
            className="shrink-0 w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename or uploader…"
            className="flex-1 text-sm px-3 py-1.5 rounded-full bg-white/70 dark:bg-slate-800/60 border
              border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="text-sm px-3 py-1.5 rounded-full bg-white/70 dark:bg-slate-800/60 border
              border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="latest">Latest first</option>
            <option value="oldest">Oldest first</option>
            <option value="size">Largest first</option>
            <option value="type">File type</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition ${
                filter === f.key
                  ? 'bg-brand-500 text-white'
                  : 'bg-white/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {visible.length === 0 ? (
            <p className="text-sm text-slate-400 text-center mt-10">No files match.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {visible.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                >
                  <button
                    onClick={() => onPreview(file)}
                    className="shrink-0 w-11 h-11 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xl"
                    aria-label={`Preview ${file.originalName}`}
                  >
                    {file.category === 'image' ? (
                      <img src={fileViewUrl(roomId, file.id)} alt="" loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      iconForCategory(file.category)
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => onPreview(file)}
                      className="text-sm font-medium truncate block text-left hover:underline w-full"
                      title={file.originalName}
                    >
                      {file.originalName}
                    </button>
                    <p className="text-xs text-slate-400">
                      {formatFileSize(file.size)} · {file.uploaderName} · {formatTime(file.uploadedAt)}
                    </p>
                  </div>
                  <a
                    href={fileDownloadUrl(roomId, file.id)}
                    download={file.originalName}
                    onClick={() => onDownload(file)}
                    aria-label={`Download ${file.originalName}`}
                    className="shrink-0 w-8 h-8 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300 hover:bg-brand-500/20 flex items-center justify-center transition"
                  >
                    ⬇
                  </a>
                  {file.uploaderId === selfId && (
                    <button
                      onClick={() => onDelete(file.id)}
                      aria-label={`Delete ${file.originalName}`}
                      className="shrink-0 w-8 h-8 rounded-full hover:bg-red-500/10 text-red-500 flex items-center justify-center transition"
                    >
                      🗑
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
