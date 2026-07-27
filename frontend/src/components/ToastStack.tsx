import { ToastItem } from '../types';

const ICONS: Record<ToastItem['kind'], string> = {
  join: '👋',
  leave: '🚪',
  info: '💬',
  error: '⚠️',
};

export default function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-xs sm:max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="glass-card px-4 py-3 flex items-center gap-2.5 text-sm font-medium animate-pop-in shadow-lg"
        >
          <span>{ICONS[t.kind]}</span>
          <span className="truncate">{t.text}</span>
        </div>
      ))}
    </div>
  );
}
