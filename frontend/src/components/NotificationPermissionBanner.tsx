import { useEffect, useState } from 'react';
import {
  currentPermission,
  dismissPermissionPrompt,
  hasAskedForPermission,
  notificationsSupported,
  requestNotificationPermission,
} from '../lib/notifications';

export default function NotificationPermissionBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!notificationsSupported()) return;
    if (hasAskedForPermission()) return;
    if (currentPermission() !== 'default') return;
    // Small delay so it doesn't compete with the initial connect/join flow.
    const t = window.setTimeout(() => setVisible(true), 1500);
    return () => window.clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 glass-card px-4 py-3 flex items-center gap-3 max-w-sm w-[calc(100%-2rem)] animate-slide-up">
      <span className="text-xl shrink-0">🔔</span>
      <p className="text-xs flex-1">Get notified about new messages and files when this tab isn't active?</p>
      <div className="flex gap-1.5 shrink-0">
        <button
          onClick={async () => {
            await requestNotificationPermission();
            setVisible(false);
          }}
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-500 text-white hover:bg-brand-600 transition"
        >
          Enable
        </button>
        <button
          onClick={() => {
            dismissPermissionPrompt();
            setVisible(false);
          }}
          className="text-xs font-medium px-3 py-1.5 rounded-full bg-slate-200 dark:bg-slate-700 hover:opacity-80 transition"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
