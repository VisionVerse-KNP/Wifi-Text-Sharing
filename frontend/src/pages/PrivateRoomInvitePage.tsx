import { FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { JoinConfig } from '../hooks/useSocketRoom';
import { useDisplayName } from '../hooks/useDisplayName';
import PrivateRoomSession from '../components/PrivateRoomSession';

export default function PrivateRoomInvitePage() {
  const { roomId = '' } = useParams();
  const { displayName: storedName, setDisplayName } = useDisplayName();
  const [name, setName] = useState(storedName ?? '');
  const [password, setPassword] = useState('');
  const [activeConfig, setActiveConfig] = useState<{ displayName: string; join: JoinConfig } | null>(null);

  if (activeConfig) {
    return (
      <PrivateRoomSession
        displayName={activeConfig.displayName}
        joinConfig={activeConfig.join}
        onExit={() => setActiveConfig(null)}
      />
    );
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().slice(0, 30);
    const cleanPassword = password.trim();
    if (!cleanName || !cleanPassword) return;
    setDisplayName(cleanName);
    setActiveConfig({
      displayName: cleanName,
      join: { mode: 'private', action: 'join', roomId: roomId.toUpperCase(), password: cleanPassword },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card w-full max-w-md p-8 animate-slide-up">
        <Link to="/" className="text-xs text-slate-400 hover:text-brand-500 transition">← Back home</Link>

        <div className="flex flex-col items-center text-center gap-2 my-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-700 flex items-center justify-center text-2xl shadow-lg shadow-fuchsia-500/30">
            🔒
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Join Private Room</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            You've been invited to room{' '}
            <span className="font-mono font-bold tracking-wider text-slate-700 dark:text-slate-200">
              {roomId.toUpperCase()}
            </span>
            . Enter your name and the room password to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">Your name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              required
              placeholder="e.g. Priya"
              className="w-full rounded-xl px-4 py-3 bg-white/70 dark:bg-slate-800/70 border border-slate-200
                dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">Room password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={64}
              required
              placeholder="Enter password"
              className="w-full rounded-xl px-4 py-3 bg-white/70 dark:bg-slate-800/70 border border-slate-200
                dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl py-3 font-semibold text-white bg-gradient-to-r from-fuchsia-500 to-purple-700
              hover:from-fuchsia-600 hover:to-purple-800 active:scale-[0.98] transition shadow-lg shadow-fuchsia-500/30"
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
}
