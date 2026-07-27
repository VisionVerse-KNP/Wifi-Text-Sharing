import { ConnectionStatus } from '../types';

const CONFIG: Record<ConnectionStatus, { label: string; dot: string; text: string }> = {
  connected: { label: 'Connected', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  reconnecting: { label: 'Reconnecting…', dot: 'bg-amber-500 animate-pulse', text: 'text-amber-600 dark:text-amber-400' },
  offline: { label: 'Offline', dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
};

export default function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const cfg = CONFIG[status];
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 dark:bg-slate-800/50 border border-white/40 dark:border-slate-700/50 text-xs sm:text-sm font-medium">
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      <span className={cfg.text}>{cfg.label}</span>
    </div>
  );
}
