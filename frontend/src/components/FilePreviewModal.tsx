import { useEffect, useState } from 'react';
import { FileAttachment } from '../types';
import { formatFileSize, iconForCategory } from '../lib/fileMeta';
import { formatTime } from '../lib/format';
import { fileDownloadUrl, fileViewUrl } from '../lib/fileUrls';

interface Props {
  file: FileAttachment;
  roomId: string;
  onClose: () => void;
  onDownload: (file: FileAttachment) => void;
}

const MAX_TEXT_PREVIEW_BYTES = 2 * 1024 * 1024; // 2MB — bigger than that, just offer download

function TextPreview({ file, url }: { file: FileAttachment; url: string }) {
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'error'; content: string }>({
    status: 'loading',
    content: '',
  });

  useEffect(() => {
    if (file.size > MAX_TEXT_PREVIEW_BYTES) {
      setState({ status: 'error', content: '' });
      return;
    }
    let cancelled = false;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load preview');
        return res.text();
      })
      .then((text) => {
        if (cancelled) return;
        const ext = file.originalName.split('.').pop()?.toLowerCase();
        if (ext === 'json') {
          try {
            text = JSON.stringify(JSON.parse(text), null, 2);
          } catch {
            // not valid JSON — show as-is
          }
        }
        setState({ status: 'ready', content: text });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', content: '' });
      });
    return () => {
      cancelled = true;
    };
  }, [url, file]);

  if (file.size > MAX_TEXT_PREVIEW_BYTES) {
    return <p className="text-sm text-slate-400 py-8 text-center">File is too large to preview — download it instead.</p>;
  }
  if (state.status === 'loading') {
    return (
      <div className="py-12 flex justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (state.status === 'error') {
    return <p className="text-sm text-red-400 py-8 text-center">Couldn't load a preview for this file.</p>;
  }

  const ext = file.originalName.split('.').pop()?.toLowerCase();
  if (ext === 'csv') {
    const rows = state.content.trim().split('\n').slice(0, 200).map((line) => line.split(','));
    return (
      <div className="overflow-auto max-h-[65vh] rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="text-xs w-full border-collapse">
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i === 0 ? 'bg-slate-100 dark:bg-slate-800 font-semibold' : ''}>
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-1.5 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <pre className="whitespace-pre-wrap break-words text-xs font-mono overflow-auto max-h-[65vh] p-4 bg-slate-900 text-slate-100 rounded-xl">
      {state.content}
    </pre>
  );
}

export default function FilePreviewModal({ file, roomId, onClose, onDownload }: Props) {
  const viewUrl = fileViewUrl(roomId, file.id);
  const downloadUrl = fileDownloadUrl(roomId, file.id);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  let body: JSX.Element;
  switch (file.category) {
    case 'image':
      body = (
        <img
          src={viewUrl}
          alt={file.originalName}
          className="max-h-[70vh] max-w-full mx-auto object-contain rounded-xl"
        />
      );
      break;
    case 'video':
      body = (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video src={viewUrl} controls className="max-h-[70vh] w-full rounded-xl bg-black" />
      );
      break;
    case 'audio':
      body = (
        <div className="flex flex-col items-center gap-4 py-8">
          <span className="text-6xl">🎵</span>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio src={viewUrl} controls className="w-full max-w-sm" />
        </div>
      );
      break;
    case 'pdf':
      body = (
        <iframe
          src={viewUrl}
          title={file.originalName}
          className="w-full h-[70vh] rounded-xl border border-slate-200 dark:border-slate-700"
        />
      );
      break;
    case 'text':
    case 'code':
      body = <TextPreview file={file} url={viewUrl} />;
      break;
    default:
      body = (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <span className="text-6xl">{iconForCategory(file.category)}</span>
          <p className="text-sm text-slate-400 max-w-xs">
            Preview isn't available for this file type — download it to open it on your device.
          </p>
        </div>
      );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-3xl max-h-[90vh] overflow-auto p-5 sm:p-6 animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="font-semibold text-base truncate" title={file.originalName}>
              {iconForCategory(file.category)} {file.originalName}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatFileSize(file.size)} · Shared by {file.uploaderName} · {formatTime(file.uploadedAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="shrink-0 w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {body}

        <div className="flex justify-end mt-5">
          <a
            href={downloadUrl}
            download={file.originalName}
            onClick={() => onDownload(file)}
            className="px-4 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-brand-500 to-brand-700 hover:opacity-90 transition"
          >
            ⬇ Download
          </a>
        </div>
      </div>
    </div>
  );
}
