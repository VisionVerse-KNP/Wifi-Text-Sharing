import { useState } from 'react';
import { RoomUser } from '../types';
import { initialsFromName } from '../lib/format';

export default function OnlineUsers({ users, selfId }: { users: RoomUser[]; selfId: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 dark:bg-slate-800/50
          border border-white/40 dark:border-slate-700/50 text-xs sm:text-sm font-medium hover:bg-white/80
          dark:hover:bg-slate-800/80 transition"
      >
        <span className="flex -space-x-2">
          {users.slice(0, 3).map((u) => (
            <span
              key={u.id}
              className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: u.color }}
            >
              {initialsFromName(u.name)}
            </span>
          ))}
        </span>
        <span>{users.length} online</span>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-56 glass-card p-3 z-40 animate-slide-up max-h-72 overflow-y-auto scrollbar-thin"
          onMouseLeave={() => setOpen(false)}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2 px-1">
            Online now
          </p>
          <ul className="space-y-1.5">
            {users.map((u) => (
              <li key={u.id} className="flex items-center gap-2 px-1 py-1 rounded-lg text-sm">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: u.color }}
                >
                  {initialsFromName(u.name)}
                </span>
                <span className="truncate">
                  {u.name} {u.id === selfId && <span className="text-slate-400">(you)</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
