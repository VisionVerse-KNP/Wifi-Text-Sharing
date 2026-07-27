import { useState } from 'react';
import { Link } from 'react-router-dom';
import NameGate from '../components/NameGate';
import ConnectionBadge from '../components/ConnectionBadge';
import OnlineUsers from '../components/OnlineUsers';
import ThemeToggle from '../components/ThemeToggle';
import QRPanel from '../components/QRPanel';
import ToastStack from '../components/ToastStack';
import SharedTextArea from '../components/SharedTextArea';
import MessageBoard from '../components/MessageBoard';
import ConfirmModal from '../components/ConfirmModal';
import FabClearBoard from '../components/FabClearBoard';
import AdSlot from '../components/ads/AdSlot';
import { useDisplayName } from '../hooks/useDisplayName';
import { useTheme } from '../hooks/useTheme';
import { useRoom } from '../hooks/useRoom';

export default function LanRoomPage() {
  const { displayName, setDisplayName } = useDisplayName();
  const { theme, toggleTheme } = useTheme();
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const {
    status,
    users,
    messages,
    sharedText,
    typingUsers,
    toasts,
    selfId,
    updateSharedText,
    sendMessage,
    editMessage,
    deleteMessage,
    startTyping,
    stopTyping,
    clearBoard,
  } = useRoom(displayName);

  if (!displayName) {
    return <NameGate onSubmit={setDisplayName} />;
  }

  const typingNames = Object.values(typingUsers);

  return (
    <div className="min-h-screen pb-24">
      <ToastStack toasts={toasts} />

      {/* Desktop header banner */}
      <div className="hidden md:flex justify-center px-4 pt-2">
        <AdSlot slot="header-banner" width={970} height={90} />
      </div>
      <div className="flex md:hidden justify-center px-3 pt-2">
        <AdSlot slot="mobile-top-banner" width={320} height={100} />
      </div>

      <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/40 dark:bg-slate-950/40 border-b border-white/30 dark:border-slate-800/50 mt-2">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-2xl" aria-label="WiFi Text Share home">📶</Link>
            <div>
              <h1 className="font-bold text-base sm:text-lg leading-tight">WiFi Text Share</h1>
              <p className="text-[11px] text-slate-400 leading-tight hidden sm:block">
                Live for everyone on this network
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <ConnectionBadge status={status} />
            <OnlineUsers users={users} selfId={selfId} />
            <QRPanel />
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 xl:grid-cols-[160px_1fr_1fr_160px] gap-6">
        <aside className="hidden xl:flex justify-center">
          <AdSlot slot="left-sidebar" width={160} height={600} className="sticky top-24" />
        </aside>

        <SharedTextArea
          sharedText={sharedText}
          onChange={updateSharedText}
          onTypingStart={startTyping}
          onTypingStop={stopTyping}
        />

        <MessageBoard
          messages={messages}
          users={users}
          selfId={selfId}
          typingNames={typingNames}
          onSend={sendMessage}
          onEdit={editMessage}
          onDelete={deleteMessage}
          onTypingStart={startTyping}
          onTypingStop={stopTyping}
        />

        <aside className="hidden xl:flex justify-center">
          <AdSlot slot="right-sidebar" width={160} height={600} className="sticky top-24" />
        </aside>
      </main>

      <div className="flex md:hidden justify-center px-3 pb-4">
        <AdSlot slot="mobile-mid-banner" width={300} height={250} />
      </div>
      <div className="hidden md:flex justify-center px-4 pb-6">
        <AdSlot slot="bottom-banner" width={970} height={250} />
      </div>
      <div className="md:hidden">
        <AdSlot slot="mobile-sticky-bottom" width={320} height={50} sticky />
      </div>

      <FabClearBoard onClick={() => setConfirmClearOpen(true)} />

      <ConfirmModal
        open={confirmClearOpen}
        title="Clear the whole board?"
        description="This deletes the shared text and every message for everyone connected. This can't be undone."
        confirmLabel="Clear everything"
        onConfirm={() => {
          clearBoard();
          setConfirmClearOpen(false);
        }}
        onCancel={() => setConfirmClearOpen(false)}
      />
    </div>
  );
}
