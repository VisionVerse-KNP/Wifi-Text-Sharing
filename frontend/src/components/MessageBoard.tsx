import { ChangeEvent, DragEvent, Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { ChatMessage, FileAttachment, RoomUser, ToastItem } from '../types';
import MessageItem from './MessageItem';
import FileCard from './FileCard';
import FilePreviewModal from './FilePreviewModal';
import FileGalleryModal from './FileGalleryModal';
import UploadProgressList from './UploadProgressList';
import { UploadItem } from '../hooks/useFileUploads';
import { getBookmarks, toggleBookmark } from '../lib/bookmarks';
import TypingIndicator from './TypingIndicator';
import AdSlot from './ads/AdSlot';

const MAX_MESSAGE_LENGTH = 2000;
const TYPING_IDLE_MS = 1200;
const QUICK_EMOJIS = ['😀', '👍', '🎉', '❤️', '😂', '🔥', '🙏', '👏', '✅', '❓'];

type TimelineItem =
  | { type: 'message'; timestamp: number; data: ChatMessage }
  | { type: 'file'; timestamp: number; data: FileAttachment };

interface Props {
  messages: ChatMessage[];
  files: FileAttachment[];
  roomId: string;
  users: RoomUser[];
  selfId: string | null;
  typingNames: string[];
  uploads: UploadItem[];
  pushToast: (text: string, kind?: ToastItem['kind']) => void;
  onSend: (text: string, replyToId?: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
  onPin: (id: string) => void;
  onUploadFiles: (files: FileList | File[]) => void;
  onCancelUpload: (localId: string) => void;
  onDismissUpload: (localId: string) => void;
  onDeleteFile: (id: string) => void;
  onDownloadFile: (file: FileAttachment) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

export default function MessageBoard({
  messages,
  files,
  roomId,
  users,
  selfId,
  typingNames,
  uploads,
  pushToast,
  onSend,
  onEdit,
  onDelete,
  onReact,
  onPin,
  onUploadFiles,
  onCancelUpload,
  onDismissUpload,
  onDeleteFile,
  onDownloadFile,
  onTypingStart,
  onTypingStop,
}: Props) {
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => getBookmarks());
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimeout = useRef<number | null>(null);
  const hashJumpedRef = useRef(false);

  const colorFor = (userId: string) => users.find((u) => u.id === userId)?.color ?? '#94a3b8';

  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [
      ...messages.map((m): TimelineItem => ({ type: 'message', timestamp: m.timestamp, data: m })),
      ...files.map((f): TimelineItem => ({ type: 'file', timestamp: f.uploadedAt, data: f })),
    ];
    items.sort((a, b) => a.timestamp - b.timestamp);
    return items;
  }, [messages, files]);

  const pinnedMessages = useMemo(() => messages.filter((m) => m.pinned), [messages]);

  const filtered = useMemo(() => {
    let list = timeline;
    if (bookmarkedOnly) {
      list = list.filter((item) => item.type === 'message' && bookmarkedIds.has(item.data.id));
    }
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((item) =>
      item.type === 'message'
        ? item.data.text.toLowerCase().includes(q) || item.data.userName.toLowerCase().includes(q)
        : item.data.originalName.toLowerCase().includes(q) || item.data.uploaderName.toLowerCase().includes(q)
    );
  }, [timeline, search, bookmarkedOnly, bookmarkedIds]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [timeline.length]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [draft]);

  const jumpToMessage = (id: string) => {
    const el = document.getElementById(`message-${id}`);
    if (!el) {
      pushToast("That message isn't visible right now.", 'info');
      return;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedId(id);
    window.setTimeout(() => setHighlightedId((current) => (current === id ? null : current)), 1600);
  };

  // Deep-link support: opening a URL with #message-<id> scrolls to and highlights it once.
  useEffect(() => {
    if (hashJumpedRef.current || timeline.length === 0) return;
    const hash = window.location.hash;
    if (hash.startsWith('#message-')) {
      hashJumpedRef.current = true;
      const id = hash.replace('#message-', '');
      window.setTimeout(() => jumpToMessage(id), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeline.length]);

  const handleBookmarkToggle = (id: string) => {
    const next = toggleBookmark(id);
    setBookmarkedIds(new Set(next));
  };

  const handleForward = (text: string) => {
    handleDraftChange(text);
    pushToast('Message ready to forward — edit and send.', 'info');
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    onTypingStart();
    if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
    typingTimeout.current = window.setTimeout(onTypingStop, TYPING_IDLE_MS);
  };

  const submit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSend(trimmed, replyingTo?.id);
    setDraft('');
    setReplyingTo(null);
    onTypingStop();
    if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer.types.includes('Files')) return;
    dragCounter.current += 1;
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDraggingFile(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDraggingFile(false);
    if (e.dataTransfer.files.length > 0) onUploadFiles(e.dataTransfer.files);
  };

  const handleFilePicked = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) onUploadFiles(e.target.files);
    e.target.value = '';
  };

  return (
    <div
      className="glass-card p-4 sm:p-6 flex flex-col gap-3 h-[520px] sm:h-[600px] animate-fade-in relative"
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDraggingFile && (
        <div className="absolute inset-0 z-20 rounded-2xl border-2 border-dashed border-brand-500 bg-brand-500/10 backdrop-blur-sm flex flex-col items-center justify-center gap-2 pointer-events-none">
          <span className="text-3xl">📥</span>
          <p className="font-semibold text-brand-600 dark:text-brand-300">Drop to share this file</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFilePicked}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="font-semibold text-lg flex items-center gap-2">💬 Message Board</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setGalleryOpen(true)}
            className="text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full bg-brand-500/10 text-brand-600
              dark:text-brand-300 hover:bg-brand-500/20 transition flex items-center gap-1"
          >
            🗂️ Files{files.length > 0 ? ` (${files.length})` : ''}
          </button>
          <button
            onClick={() => setBookmarkedOnly((s) => !s)}
            className={`text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full transition flex items-center gap-1 ${
              bookmarkedOnly
                ? 'bg-brand-500 text-white'
                : 'bg-brand-500/10 text-brand-600 dark:text-brand-300 hover:bg-brand-500/20'
            }`}
          >
            🔖 {bookmarkedOnly ? 'Showing saved' : 'Saved'}
          </button>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages & files…"
            className="text-sm px-3 py-1.5 rounded-full bg-white/70 dark:bg-slate-800/60 border
              border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500
              w-40 sm:w-52"
          />
        </div>
      </div>

      {pinnedMessages.length > 0 && (
        <div className="flex flex-col gap-1 rounded-xl bg-brand-500/5 border border-brand-500/20 px-3 py-2">
          {pinnedMessages.map((m) => (
            <button
              key={m.id}
              onClick={() => jumpToMessage(m.id)}
              className="text-xs text-left truncate hover:underline flex items-center gap-1.5"
            >
              <span>📌</span>
              <span className="font-medium text-brand-600 dark:text-brand-300">{m.userName}:</span>
              <span className="text-slate-500 dark:text-slate-400 truncate">{m.text}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col gap-3 pr-1">
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 text-center mt-8">
            {bookmarkedOnly
              ? 'No saved messages yet.'
              : search
              ? 'Nothing matches your search.'
              : 'No messages yet — say hello 👋 or drop a file'}
          </p>
        )}
        {filtered.map((item, i) => (
          <Fragment key={`${item.type}-${item.data.id}`}>
            {item.type === 'message' ? (
              <MessageItem
                message={item.data}
                isOwn={item.data.userId === selfId}
                color={colorFor(item.data.userId)}
                selfId={selfId}
                isBookmarked={bookmarkedIds.has(item.data.id)}
                highlighted={highlightedId === item.data.id}
                pushToast={pushToast}
                onEdit={onEdit}
                onDelete={onDelete}
                onReply={setReplyingTo}
                onForward={handleForward}
                onPin={onPin}
                onBookmarkToggle={handleBookmarkToggle}
                onReact={onReact}
                onJumpTo={jumpToMessage}
              />
            ) : (
              <FileCard
                file={item.data}
                roomId={roomId}
                isOwn={item.data.uploaderId === selfId}
                color={colorFor(item.data.uploaderId)}
                onDelete={onDeleteFile}
                onDownload={onDownloadFile}
                onPreview={setPreviewFile}
              />
            )}
            {i > 0 && (i + 1) % 12 === 0 && (
              <AdSlot slot="in-feed-native" width={480} height={90} label="Native Ad Placeholder" />
            )}
          </Fragment>
        ))}
        <div ref={bottomRef} />
      </div>

      <TypingIndicator names={typingNames} />

      <UploadProgressList
        uploads={uploads}
        onCancel={onCancelUpload}
        onDismiss={onDismissUpload}
        onRetry={(file) => onUploadFiles([file])}
      />

      {replyingTo && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs">
          <div className="min-w-0 truncate">
            <span className="font-medium text-brand-600 dark:text-brand-300">Replying to {replyingTo.userName}</span>
            <span className="text-slate-500 dark:text-slate-400"> · {replyingTo.text}</span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            aria-label="Cancel reply"
            className="shrink-0 w-6 h-6 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>
      )}

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

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-10 h-10 shrink-0 rounded-full bg-white/70 dark:bg-slate-800/60 border
            border-slate-200 dark:border-slate-700 flex items-center justify-center text-lg hover:bg-white
            dark:hover:bg-slate-800 transition"
          aria-label="Attach a file"
        >
          📎
        </button>

        <div className="flex-1 flex flex-col">
          <textarea
            ref={textareaRef}
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
              border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm
              overflow-y-auto scrollbar-thin max-h-32"
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

      {galleryOpen && (
        <FileGalleryModal
          files={files}
          roomId={roomId}
          selfId={selfId}
          onClose={() => setGalleryOpen(false)}
          onPreview={(file) => setPreviewFile(file)}
          onDownload={onDownloadFile}
          onDelete={onDeleteFile}
        />
      )}

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          roomId={roomId}
          onClose={() => setPreviewFile(null)}
          onDownload={onDownloadFile}
        />
      )}
    </div>
  );
}
