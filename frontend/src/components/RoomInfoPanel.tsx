import { useState } from 'react';
import { RoomMeta, RoomUser } from '../types';
import { copyToClipboard } from '../lib/clipboard';
import OnlineUsers from './OnlineUsers';

interface Props {
  roomId: string;
  meta: RoomMeta;
  users: RoomUser[];
  selfId: string | null;
  createdPassword: string | null;
  onDeleteRoom: () => void;
  onLeaveRoom: () => void;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle');
  return (
    <button
      onClick={async () => {
        const ok = await copyToClipboard(value);
        setState(ok ? 'copied' : 'error');
        window.setTimeout(() => setState('idle'), 1500);
      }}
      className={`text-xs font-semibold px-2.5 py-1 rounded-full transition shrink-0 ${
        state === 'error'
          ? 'bg-red-500/10 text-red-600 dark:text-red-400'
          : 'bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20'
      }`}
    >
      {state === 'copied' ? '✓ Copied' : state === 'error' ? '✕ Copy failed' : label}
    </button>
  );
}

export default function RoomInfoPanel({ roomId, meta, users, selfId, createdPassword, onDeleteRoom, onLeaveRoom }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isOwner = meta.ownerId === selfId;
  const inviteUrl = `${window.location.origin}/room/${roomId}`;

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg truncate">{meta.roomName ?? 'Private Room'}</h2>
        <span
          className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400"
          title="Password protected"
        >
          🔒 Locked
        </span>
      </div>

      <dl className="space-y-2.5 text-sm">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-slate-400">Room ID</dt>
          <dd className="flex items-center gap-2">
            <span className="font-mono font-bold tracking-wider">{roomId}</span>
            <CopyButton value={roomId} label="Copy ID" />
          </dd>
        </div>

        {createdPassword && (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-slate-400">Password</dt>
            <dd className="flex items-center gap-2">
              <span className="font-mono font-bold tracking-wider">{createdPassword}</span>
              <CopyButton value={createdPassword} label="Copy Password" />
            </dd>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <dt className="text-slate-400">Owner</dt>
          <dd className="font-medium truncate max-w-[60%]">
            {meta.ownerName} {isOwner && <span className="text-slate-400">(you)</span>}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-2">
          <dt className="text-slate-400">Members</dt>
          <dd>
            <OnlineUsers users={users} selfId={selfId} />
          </dd>
        </div>
      </dl>

      <div className="flex items-center gap-2">
        <input
          readOnly
          value={inviteUrl}
          className="flex-1 min-w-0 rounded-lg px-3 py-2 text-xs bg-white/70 dark:bg-slate-800/70 border
            border-slate-200 dark:border-slate-700 truncate"
        />
        <CopyButton value={inviteUrl} label="Copy Link" />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <button
          onClick={onLeaveRoom}
          className="w-full rounded-xl py-2.5 text-sm font-semibold bg-slate-200 dark:bg-slate-700
            hover:bg-slate-300 dark:hover:bg-slate-600 transition"
        >
          Leave Room
        </button>
        {isOwner && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full rounded-xl py-2.5 text-sm font-semibold bg-red-500/10 text-red-600
              dark:text-red-400 hover:bg-red-500/20 transition"
          >
            Delete Room (Owner Only)
          </button>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-fade-in">
          <div className="glass-card w-full max-w-sm p-6 animate-pop-in">
            <h3 className="font-semibold text-lg mb-2">Delete this room?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Everyone in the room will be disconnected and all messages will be lost. This can't be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 rounded-full text-sm font-medium bg-slate-200 dark:bg-slate-700
                  hover:bg-slate-300 dark:hover:bg-slate-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteRoom();
                  setConfirmDelete(false);
                }}
                className="px-4 py-2 rounded-full text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition"
              >
                Delete room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
