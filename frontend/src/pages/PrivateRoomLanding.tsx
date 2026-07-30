import { FormEvent, ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { JoinConfig } from '../hooks/useSocketRoom';
import { useDisplayName } from '../hooks/useDisplayName';
import PrivateRoomSession from '../components/PrivateRoomSession';
import { useSEO } from '../hooks/useSEO';
import { SITE_URL } from '../lib/seoConfig';

type Tab = 'create' | 'join';

export default function PrivateRoomLanding() {
  const { displayName: storedName, setDisplayName } = useDisplayName();
  const [tab, setTab] = useState<Tab>('create');

  useSEO({
    title: 'Create or Join a Private Room — Password-Protected Text Sharing',
    description:
      'Create a password-protected private room or join an existing one with a Room ID. Works over the internet, not just local WiFi — no account required.',
    keywords: 'private room text sharing, password protected chat, room id join, secure text sharing',
    path: '/room',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Private Room', item: `${SITE_URL}/room` },
        ],
      },
    ],
  });

  const [name, setName] = useState(storedName ?? '');
  const [roomName, setRoomName] = useState('');
  const [password, setPassword] = useState('');

  const [joinName, setJoinName] = useState(storedName ?? '');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinPassword, setJoinPassword] = useState('');

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

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().slice(0, 30);
    if (!cleanName) return;
    setDisplayName(cleanName);
    setActiveConfig({
      displayName: cleanName,
      join: { mode: 'private', action: 'create', roomName: roomName.trim().slice(0, 60), password: password.trim() || undefined },
    });
  };

  const handleJoin = (e: FormEvent) => {
    e.preventDefault();
    const cleanName = joinName.trim().slice(0, 30);
    const cleanRoomId = joinRoomId.trim().toUpperCase();
    const cleanPassword = joinPassword.trim();
    if (!cleanName || !cleanRoomId || !cleanPassword) return;
    setDisplayName(cleanName);
    setActiveConfig({
      displayName: cleanName,
      join: { mode: 'private', action: 'join', roomId: cleanRoomId, password: cleanPassword },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="glass-card w-full max-w-md p-6 sm:p-8 animate-slide-up">
        <Link to="/" className="text-xs text-slate-400 hover:text-brand-500 transition">← Back home</Link>

        <div className="flex flex-col items-center text-center gap-2 my-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-700 flex items-center justify-center text-2xl shadow-lg shadow-fuchsia-500/30">
            🔒
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Private Room</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Create a password-protected room or join one with a Room ID.
          </p>
        </div>

        <div className="flex rounded-full bg-slate-200/60 dark:bg-slate-800/60 p-1 mb-6">
          <button
            onClick={() => setTab('create')}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
              tab === 'create' ? 'bg-white dark:bg-slate-700 shadow' : 'text-slate-500'
            }`}
          >
            Create Room
          </button>
          <button
            onClick={() => setTab('join')}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
              tab === 'join' ? 'bg-white dark:bg-slate-700 shadow' : 'text-slate-500'
            }`}
          >
            Join Room
          </button>
        </div>

        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <Field label="Your name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                placeholder="e.g. Priya"
                required
                className={inputClass}
              />
            </Field>
            <Field label="Room Name">
              <input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                maxLength={60}
                placeholder="e.g. Team Standup"
                className={inputClass}
              />
            </Field>
            <Field label="Room Password (optional — auto-generated if left blank)">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={64}
                placeholder="Leave blank to auto-generate"
                className={inputClass}
              />
            </Field>
            <button type="submit" className={submitClass}>Create Room</button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <Field label="Your name">
              <input
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                maxLength={30}
                placeholder="e.g. Priya"
                required
                className={inputClass}
              />
            </Field>
            <Field label="Room ID">
              <input
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                maxLength={12}
                placeholder="e.g. 8YH2KD"
                required
                className={`${inputClass} font-mono tracking-wider uppercase`}
              />
            </Field>
            <Field label="Room Password">
              <input
                type="password"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                maxLength={64}
                placeholder="Enter password"
                required
                className={inputClass}
              />
            </Field>
            <button type="submit" className={submitClass}>Join Room</button>
          </form>
        )}
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-xl px-4 py-3 bg-white/70 dark:bg-slate-800/70 border border-slate-200 ' +
  'dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base placeholder:text-slate-400';

const submitClass =
  'w-full rounded-xl py-3 font-semibold text-white bg-gradient-to-r from-fuchsia-500 to-purple-700 ' +
  'hover:from-fuchsia-600 hover:to-purple-800 active:scale-[0.98] transition shadow-lg shadow-fuchsia-500/30';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">{label}</label>
      {children}
    </div>
  );
}
