import { useEffect, useRef, useState } from 'react';
import { SharedText } from '../types';
import { formatRelative } from '../lib/format';

const MAX_LENGTH = 20000;
const TYPING_IDLE_MS = 1200;

interface Props {
  sharedText: SharedText;
  onChange: (content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

export default function SharedTextArea({ sharedText, onChange, onTypingStart, onTypingStop }: Props) {
  const [copied, setCopied] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const typingTimeout = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
    };
  }, []);

  const handleChange = (value: string) => {
    onChange(value);
    if (!autoSave) return;
    onTypingStart();
    if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
    typingTimeout.current = window.setTimeout(() => {
      onTypingStop();
    }, TYPING_IDLE_MS);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sharedText.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable — silently ignore, button just won't confirm
    }
  };

  return (
    <div className="glass-card p-4 sm:p-6 flex flex-col gap-3 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          📝 Shared Text
        </h2>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
              className="accent-brand-500"
            />
            Auto-sync
          </label>
          <button
            onClick={handleCopy}
            className="text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full bg-brand-500/10 text-brand-600
              dark:text-brand-300 hover:bg-brand-500/20 transition"
          >
            {copied ? '✓ Copied' : '⧉ Copy'}
          </button>
        </div>
      </div>

      <textarea
        value={sharedText.content}
        onChange={(e) => handleChange(e.target.value.slice(0, MAX_LENGTH))}
        placeholder="Type or paste anything here — everyone on this WiFi sees it live..."
        rows={10}
        className="w-full resize-y rounded-2xl px-4 py-3 bg-white/70 dark:bg-slate-800/60 border
          border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500
          text-base leading-relaxed font-mono scrollbar-thin"
      />

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          {sharedText.updatedByName
            ? `Last edited by ${sharedText.updatedByName} · ${formatRelative(sharedText.updatedAt)}`
            : 'No edits yet'}
        </span>
        <span>{sharedText.content.length} / {MAX_LENGTH}</span>
      </div>
    </div>
  );
}
