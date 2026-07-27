import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { ChatMessage, RoomUser } from '../types';
import MessageItem from './MessageItem';
import TypingIndicator from './TypingIndicator';
import AdSlot from './ads/AdSlot';

const MAX_MESSAGE_LENGTH = 2000;
const TYPING_IDLE_MS = 1200;
const QUICK_EMOJIS = ['😀', '👍', '🎉', '❤️', '😂', '🔥', '🙏', '👏', '✅', '❓'];

interface Props {
  messages: ChatMessage[];
  users: RoomUser[];
  selfId: string | null;
  typingNames: string[];
  onSend: (text: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

export default function MessageBoard({
  messages,
  users,
  selfId,
  typingNames,
  onSend,
  onEdit,
  onDelete,
  onTypingStart,
  onTypingStop,
}: Props) {
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimeout = useRef<number | null>(null);

  const colorFor = (userId: string) => users.find((u) => u.id === userId)?.color ?? '#94a3b8';

  const filtered = useMemo(() => {
    if (!search.trim()) return messages;
    const q = search.toLowerCase();
    return messages.filter(
      (m) => m.text.toLowerCase().includes(q) || m.userName.toLowerCase().includes(q)
    );
  }, [messages, search]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const handleDraftChange = (value: string) => {
    setDraft(value);
    onTypingStart();
    if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
    typingTimeout.current = window.setTimeout(onTypingStop, TYPING_IDLE_MS);
  };

  const submit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setDraft('');
    onTypingStop();
    if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
  };

  return (
    <div className="glass-card p-4 sm:p-6 flex flex-col gap-3 h-[520px] sm:h-[600px] animate-fade-in">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="font-semibold text-lg flex items-center gap-2">💬 Message Board</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search messages…"
          className="text-sm px-3 py-1.5 rounded-full bg-white/70 dark:bg-slate-800/60 border
            border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500
            w-40 sm:w-52"
        />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col gap-3 pr-1">
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 text-center mt-8">
            {search ? 'No messages match your search.' : 'No messages yet — say hello 👋'}
          </p>
        )}
        {filtered.map((m, i) => (
          <Fragment key={m.id}>
            <MessageItem
              message={m}
              isOwn={m.userId === selfId}
              color={colorFor(m.userId)}
              onEdit={onEdit}
              onDelete={onDelete}
            />
            {i > 0 && (i + 1) % 12 === 0 && (
              <AdSlot slot="in-feed-native" width={480} height={90} label="Native Ad Placeholder" />
            )}
          </Fragment>
        ))}
        <div ref={bottomRef} />
      </div>

      <TypingIndicator names={typingNames} />

      <div className="relative flex items-end gap-2">
        {showEmoji && (
          <div className="absolute bottom-14 left-0 glass-card p-2 flex flex-wrap gap-1 w-56 animate-pop-in z-10">
            {QUICK_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => {
                  handleDraftChange(draft + e);
                  setShowEmoji(false);
                }}
                className="text-xl p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition"
              >
                {e}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setShowEmoji((s) => !s)}
          className="w-10 h-10 shrink-0 rounded-full bg-white/70 dark:bg-slate-800/60 border
            border-slate-200 dark:border-slate-700 flex items-center justify-center text-lg hover:bg-white
            dark:hover:bg-slate-800 transition"
          aria-label="Insert emoji"
        >
          🙂
        </button>

        <div className="flex-1 flex flex-col">
          <textarea
            value={draft}
            onChange={(e) => handleDraftChange(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="w-full resize-none rounded-2xl px-4 py-2.5 bg-white/70 dark:bg-slate-800/60 border
              border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          />
          <span className="text-[11px] text-slate-400 mt-0.5 self-end">
            {draft.length}/{MAX_MESSAGE_LENGTH}
          </span>
        </div>

        <button
          onClick={submit}
          disabled={!draft.trim()}
          className="w-10 h-10 shrink-0 rounded-full bg-brand-500 disabled:bg-slate-300
            dark:disabled:bg-slate-700 text-white flex items-center justify-center hover:bg-brand-600
            transition active:scale-95"
          aria-label="Send message"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
