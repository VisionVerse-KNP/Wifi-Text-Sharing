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
import NotificationSettingsButton from '../components/NotificationSettingsButton';
import NotificationPermissionBanner from '../components/NotificationPermissionBanner';
import AdSlot from '../components/ads/AdSlot';
import { useDisplayName } from '../hooks/useDisplayName';
import { useTheme } from '../hooks/useTheme';
import { useRoom } from '../hooks/useRoom';
import { useFileUploads } from '../hooks/useFileUploads';
import SEO from '../components/SEO';
import { SITE_URL } from '../lib/seoConfig';

const WIFI_KEYWORDS = [
  'local wifi share',
  'local wifi text share',
  'wifi share',
  'wifi sharing',
  'wi-fi share',
  'wi-fi sharing',
  'share wifi',
  'wifi share app',
  'wifi text share',
  'wifi file share',
  'wifi file sharing',
  'share files over wifi',
  'share text over wifi',
  'local wifi chat',
  'local wifi sharing',
  'lan text sharing',
  'lan file sharing',
  'lan sharing app',
  'join wifi room',
  'wifi network messaging',
  'wifi file transfer',
  'share files on network',
  'free wifi file sharing',
  'no login file sharing',
];

const WIFI_BREADCRUMB_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
    { '@type': 'ListItem', position: 2, name: 'Local WiFi Network', item: `${SITE_URL}/wifi` },
  ],
};

export default function LanRoomPage() {
  const { displayName, setDisplayName } = useDisplayName();
  const { theme, toggleTheme } = useTheme();
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

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
    updateSharedText,
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    togglePinMessage,
    deleteFile,
    startTyping,
    stopTyping,
    clearBoard,
    pushToast,
  } = useRoom(displayName);

  const { uploads, uploadFiles, cancelUpload, dismissUpload } = useFileUploads({
    roomId,
    selfId,
    displayName,
    onError: (message) => pushToast(message, 'error'),
    onSuccess: (message) => pushToast(message, 'info'),
  });

  if (!displayName) {
    return <NameGate onSubmit={setDisplayName} />;
  }

  const typingNames = Object.values(typingUsers);

  return (
    <div className="min-h-screen pb-24">
      <SEO
        title="WiFi Share — Join Local WiFi Text & File Sharing On Your Network"
        description="WiFi share made simple: join the shared board for everyone currently on your WiFi network. No login, no room code — real-time text and file sharing that syncs instantly."
        keywords={WIFI_KEYWORDS}
        path="/wifi"
        jsonLd={[WIFI_BREADCRUMB_JSON_LD]}
      />

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
              <h1 className="font-bold text-base sm:text-lg leading-tight">WiFi Text & File Share</h1>
              <p className="text-[11px] text-slate-400 leading-tight hidden sm:block">
                Real-time WiFi sharing — text &amp; files, live for everyone on this network
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <ConnectionBadge status={status} />
            <OnlineUsers users={users} selfId={selfId} />
            <QRPanel />
            <NotificationSettingsButton />
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>
      </header>

      <main className="max-w-4xl xl:max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 xl:grid-cols-[160px_minmax(0,1fr)_160px] gap-6">
        <aside className="hidden xl:flex justify-center">
          <AdSlot slot="left-sidebar" width={160} height={600} className="sticky top-24" />
        </aside>

        <div className="flex flex-col gap-6 min-w-0">
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
        </div>

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

      <NotificationPermissionBanner />
    </div>
  );
}
