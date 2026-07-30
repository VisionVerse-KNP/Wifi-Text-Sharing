import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocketRoom, JoinConfig } from '../hooks/useSocketRoom';
import { useFileUploads } from '../hooks/useFileUploads';
import { useTheme } from '../hooks/useTheme';
import ConnectionBadge from './ConnectionBadge';
import ThemeToggle from './ThemeToggle';
import ToastStack from './ToastStack';
import QRPanel from './QRPanel';
import SharedTextArea from './SharedTextArea';
import MessageBoard from './MessageBoard';
import RoomInfoPanel from './RoomInfoPanel';
import NotificationSettingsButton from './NotificationSettingsButton';
import NotificationPermissionBanner from './NotificationPermissionBanner';
import AdSlot from './ads/AdSlot';

interface Props {
  displayName: string;
  joinConfig: JoinConfig;
  onExit: () => void;
}

export default function PrivateRoomSession({ displayName, joinConfig, onExit }: Props) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [ackDeleted, setAckDeleted] = useState(false);

  const {
    status,
    users,
    messages,
    files,
    sharedText,
    typingUsers,
    toasts,
    selfId,
    roomId,
    roomMeta,
    joined,
    joinError,
    roomDeleted,
    createdPassword,
    updateSharedText,
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    togglePinMessage,
    deleteFile,
    startTyping,
    stopTyping,
    deleteRoom,
    leaveRoom,
    pushToast,
  } = useSocketRoom(displayName, joinConfig);

  const { uploads, uploadFiles, cancelUpload, dismissUpload } = useFileUploads({
    roomId,
    selfId,
    displayName,
    onError: (message) => pushToast(message, 'error'),
    onSuccess: (message) => pushToast(message, 'info'),
  });

  if (joinError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card w-full max-w-md p-8 text-center animate-slide-up">
          <div className="text-4xl mb-3">🚫</div>
          <h1 className="text-xl font-bold mb-2">Couldn't join room</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{joinError}</p>
          <button
            onClick={onExit}
            className="rounded-xl px-5 py-2.5 font-semibold text-white bg-gradient-to-r from-brand-500 to-brand-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (roomDeleted && !ackDeleted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card w-full max-w-md p-8 text-center animate-slide-up">
          <div className="text-4xl mb-3">🗑️</div>
          <h1 className="text-xl font-bold mb-2">Room deleted</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {roomDeleted} deleted this room. Everyone has been disconnected.
          </p>
          <button
            onClick={() => {
              setAckDeleted(true);
              navigate('/room');
            }}
            className="rounded-xl px-5 py-2.5 font-semibold text-white bg-gradient-to-r from-brand-500 to-brand-700"
          >
            Back to Private Rooms
          </button>
        </div>
      </div>
    );
  }

  if (!joined || !roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card w-full max-w-md p-8 text-center animate-slide-up">
          <div className="w-10 h-10 mx-auto mb-4 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Connecting to room…</p>
        </div>
      </div>
    );
  }

  const typingNames = Object.values(typingUsers);

  return (
    <div className="min-h-screen pb-24">
      <ToastStack toasts={toasts} />

      <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/40 dark:bg-slate-950/40 border-b border-white/30 dark:border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl shrink-0">🔒</span>
            <div className="min-w-0">
              <h1 className="font-bold text-base sm:text-lg leading-tight truncate">
                {roomMeta.roomName ?? 'Private Room'}
              </h1>
              <p className="text-[11px] text-slate-400 leading-tight hidden sm:block">
                Room ID: {roomId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <ConnectionBadge status={status} />
            <QRPanel />
            <NotificationSettingsButton />
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_1fr_280px] gap-6">
        <SharedTextArea
          sharedText={sharedText}
          onChange={updateSharedText}
          onTypingStart={startTyping}
          onTypingStop={stopTyping}
        />

        <MessageBoard
          messages={messages}
          files={files}
          roomId={roomId ?? ''}
          users={users}
          selfId={selfId}
          typingNames={typingNames}
          uploads={uploads}
          pushToast={pushToast}
          onSend={sendMessage}
          onEdit={editMessage}
          onDelete={deleteMessage}
          onReact={reactToMessage}
          onPin={togglePinMessage}
          onUploadFiles={uploadFiles}
          onCancelUpload={cancelUpload}
          onDismissUpload={dismissUpload}
          onDeleteFile={deleteFile}
          onDownloadFile={(file) => pushToast(`Downloading ${file.originalName}…`, 'info')}
          onTypingStart={startTyping}
          onTypingStop={stopTyping}
        />

        <div className="space-y-6">
          <RoomInfoPanel
            roomId={roomId}
            meta={roomMeta}
            users={users}
            selfId={selfId}
            createdPassword={createdPassword}
            onDeleteRoom={deleteRoom}
            onLeaveRoom={() => {
              leaveRoom();
              onExit();
            }}
          />
          <AdSlot slot="right-sidebar" width={280} height={280} label="Native Ad Placeholder" />
        </div>
      </main>

      <NotificationPermissionBanner />
    </div>
  );
}
