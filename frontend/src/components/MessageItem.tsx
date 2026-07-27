import { useState } from 'react';
import { ChatMessage } from '../types';
import { formatTime, renderLiteMarkdown, initialsFromName } from '../lib/format';

interface Props {
  message: ChatMessage;
  isOwn: boolean;
  color: string;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

export default function MessageItem({ message, isOwn, color, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.text);

  const saveEdit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== message.text) onEdit(message.id, trimmed);
    setEditing(false);
  };

  return (
    <div className={`flex gap-2.5 animate-slide-up ${isOwn ? 'flex-row-reverse' : ''}`}>
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
        style={{ backgroundColor: color }}
      >
        {initialsFromName(message.userName)}
      </span>

      <div className={`max-w-[80%] sm:max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-0.5 text-xs text-slate-400">
          {!isOwn && <span className="font-medium text-slate-500 dark:text-slate-300">{message.userName}</span>}
          <span>{formatTime(message.timestamp)}</span>
          {message.edited && <span className="italic">(edited)</span>}
        </div>

        {editing ? (
          <div className="w-full flex flex-col gap-1.5">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              className="w-full rounded-xl px-3 py-2 bg-white/80 dark:bg-slate-800/80 border
                border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
            <div className="flex gap-2 text-xs">
              <button onClick={saveEdit} className="px-2.5 py-1 rounded-full bg-brand-500 text-white font-medium">
                Save
              </button>
              <button
                onClick={() => {
                  setDraft(message.text);
                  setEditing(false);
                }}
                className="px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-700 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
              isOwn
                ? 'bg-brand-500 text-white rounded-tr-sm'
                : 'bg-white/80 dark:bg-slate-800/80 rounded-tl-sm'
            }`}
            dangerouslySetInnerHTML={{ __html: renderLiteMarkdown(message.text) }}
          />
        )}

        {isOwn && !editing && (
          <div className="flex gap-3 mt-1 text-[11px] text-slate-400">
            <button onClick={() => setEditing(true)} className="hover:text-brand-500 transition">
              Edit
            </button>
            <button onClick={() => onDelete(message.id)} className="hover:text-red-500 transition">
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
