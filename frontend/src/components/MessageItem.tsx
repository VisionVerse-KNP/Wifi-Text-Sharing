import { useEffect, useState } from 'react';
import { ChatMessage, LinkPreview, ToastItem } from '../types';
import { formatTime, renderLiteMarkdown, initialsFromName } from '../lib/format';
import { extractFirstUrl, fetchLinkPreview } from '../lib/linkPreview';
import LinkPreviewCard from './LinkPreviewCard';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🙏', '🔥'];

interface Props {
  message: ChatMessage;
  isOwn: boolean;
  color: string;
  selfId: string | null;
  isBookmarked: boolean;
  highlighted: boolean;
  pushToast: (text: string, kind?: ToastItem['kind']) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onReply: (message: ChatMessage) => void;
  onForward: (text: string) => void;
  onPin: (id: string) => void;
  onBookmarkToggle: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
  onJumpTo: (id: string) => void;
}

export default function MessageItem({
  message,
  isOwn,
  color,
  selfId,
  isBookmarked,
  highlighted,
  pushToast,
  onEdit,
  onDelete,
  onReply,
  onForward,
  onPin,
  onBookmarkToggle,
  onReact,
  onJumpTo,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.text);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [preview, setPreview] = useState<LinkPreview | null>(null);

  useEffect(() => {
    const url = extractFirstUrl(message.text);
    if (!url) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    fetchLinkPreview(url).then((data) => {
      if (!cancelled) setPreview(data);
    });
    return () => {
      cancelled = true;
    };
  }, [message.text]);

  const saveEdit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== message.text) onEdit(message.id, trimmed);
    setEditing(false);
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      pushToast('Message copied!', 'info');
    } catch {
      pushToast("Couldn't copy — try selecting the text manually.", 'error');
    }
  };

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#message-${message.id}`;
    try {
      await navigator.clipboard.writeText(url);
      pushToast('Message link copied!', 'info');
    } catch {
      pushToast("Couldn't copy the link.", 'error');
    }
  };

  const reactionEntries = Object.entries(message.reactions).filter(([, users]) => users.length > 0);

  return (
    <div
      id={`message-${message.id}`}
      className={`flex gap-2.5 animate-slide-up rounded-xl transition-colors ${isOwn ? 'flex-row-reverse' : ''} ${
        highlighted ? 'bg-brand-500/10 ring-2 ring-brand-500/40' : ''
      }`}
    >
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
          {message.pinned && <span title="Pinned">📌</span>}
        </div>

        {message.replyTo && (
          <button
            onClick={() => onJumpTo(message.replyTo!.id)}
            className="mb-1 max-w-full text-left text-xs px-2.5 py-1.5 rounded-lg border-l-2 border-brand-500
              bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition truncate"
          >
            <span className="font-medium text-brand-600 dark:text-brand-300">{message.replyTo.userName}</span>
            <span className="text-slate-500 dark:text-slate-400"> · {message.replyTo.text}</span>
          </button>
        )}

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
              isOwn ? 'bg-brand-500 text-white rounded-tr-sm' : 'bg-white/80 dark:bg-slate-800/80 rounded-tl-sm'
            }`}
            dangerouslySetInnerHTML={{ __html: renderLiteMarkdown(message.text) }}
          />
        )}

        {preview && <LinkPreviewCard preview={preview} />}

        {reactionEntries.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {reactionEntries.map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => onReact(message.id, emoji)}
                className={`text-xs px-2 py-0.5 rounded-full border transition ${
                  selfId && users.includes(selfId)
                    ? 'bg-brand-500/20 border-brand-500 text-brand-600 dark:text-brand-300'
                    : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}
              >
                {emoji} {users.length}
              </button>
            ))}
          </div>
        )}

        {!editing && (
          <div className="relative flex flex-wrap gap-2.5 mt-1 text-[11px] text-slate-400">
            <button onClick={() => onReply(message)} className="hover:text-brand-500 transition" title="Reply">
              ↩ Reply
            </button>
            <button onClick={copyText} className="hover:text-brand-500 transition" title="Copy message text">
              ⧉ Copy
            </button>
            <button onClick={() => onForward(message.text)} className="hover:text-brand-500 transition" title="Forward">
              ➦ Forward
            </button>
            <button onClick={() => onPin(message.id)} className="hover:text-brand-500 transition" title={message.pinned ? 'Unpin' : 'Pin'}>
              📌 {message.pinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              onClick={() => onBookmarkToggle(message.id)}
              className="hover:text-brand-500 transition"
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            >
              {isBookmarked ? '🔖 Saved' : '🔖 Save'}
            </button>
            <button onClick={copyLink} className="hover:text-brand-500 transition" title="Copy link to message">
              🔗 Link
            </button>
            <button
              onClick={() => setShowReactionPicker((s) => !s)}
              className="hover:text-brand-500 transition"
              title="React"
            >
              🙂 React
            </button>
            {isOwn && (
              <>
                <button onClick={() => setEditing(true)} className="hover:text-brand-500 transition">
                  ✎ Edit
                </button>
                <button onClick={() => onDelete(message.id)} className="hover:text-red-500 transition">
                  🗑 Delete
                </button>
              </>
            )}

            {showReactionPicker && (
              <div className="absolute bottom-6 left-0 glass-card p-1.5 flex gap-1 z-10 animate-pop-in">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact(message.id, emoji);
                      setShowReactionPicker(false);
                    }}
                    className="text-base p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
