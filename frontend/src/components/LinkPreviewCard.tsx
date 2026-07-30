import { LinkPreview } from '../types';

export default function LinkPreviewCard({ preview }: { preview: LinkPreview }) {
  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1.5 flex gap-3 rounded-xl border border-slate-200 dark:border-slate-700
        bg-white/60 dark:bg-slate-800/60 overflow-hidden hover:bg-white dark:hover:bg-slate-800 transition max-w-sm"
    >
      {preview.image && (
        <img
          src={preview.image}
          alt=""
          loading="lazy"
          className="w-20 h-20 object-cover shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
      <div className="min-w-0 py-2 pr-3 flex flex-col justify-center">
        <p className="text-[10px] uppercase tracking-wide text-slate-400 truncate">{preview.domain}</p>
        {preview.title && <p className="text-sm font-semibold truncate">{preview.title}</p>}
        {preview.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{preview.description}</p>
        )}
      </div>
    </a>
  );
}
