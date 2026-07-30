import { useState } from 'react';
import {
  currentPermission,
  getNotificationPreference,
  notificationsSupported,
  requestNotificationPermission,
  setNotificationPreference,
} from '../lib/notifications';

export default function NotificationSettingsButton() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(() => getNotificationPreference());
  const [permission, setPermission] = useState(() => currentPermission());

  if (!notificationsSupported()) return null;

  const toggle = async () => {
    if (!enabled && permission === 'default') {
      const result = await requestNotificationPermission();
      setPermission(result);
      if (result !== 'granted') return;
    }
    const next = !enabled;
    setEnabled(next);
    setNotificationPreference(next);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        aria-label="Notification settings"
        className="w-9 h-9 rounded-full bg-white/50 dark:bg-slate-800/50 border border-white/40
          dark:border-slate-700/50 flex items-center justify-center hover:bg-white/80 dark:hover:bg-slate-800/80
          transition text-lg"
      >
        {enabled && permission === 'granted' ? '🔔' : '🔕'}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-64 glass-card p-4 z-40 animate-pop-in text-sm"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-semibold">Desktop notifications</span>
            <button
              onClick={toggle}
              role="switch"
              aria-checked={enabled && permission === 'granted'}
              className={`w-10 h-6 rounded-full relative transition shrink-0 ${
                enabled && permission === 'granted' ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  enabled && permission === 'granted' ? 'translate-x-[18px]' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {permission === 'denied' ? (
            <p className="text-xs text-slate-400">
              Notifications are blocked in your browser settings for this site. Update your browser's site
              permissions to re-enable.
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Get notified about new messages and files when this tab isn't active.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
