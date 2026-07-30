const PREF_KEY = 'wts_notifications_enabled';
const ASKED_KEY = 'wts_notification_permission_asked';

/** Whether the *browser* supports the Notification API at all. */
export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/** The user's own in-app preference — separate from the browser's permission grant. */
export function getNotificationPreference(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = localStorage.getItem(PREF_KEY);
  return raw === null ? true : raw === 'true';
}

export function setNotificationPreference(enabled: boolean) {
  try {
    localStorage.setItem(PREF_KEY, String(enabled));
  } catch {
    // storage unavailable — preference just won't persist across reloads
  }
}

/** Have we ever shown our own "enable notifications?" prompt before? We only ask once. */
export function hasAskedForPermission(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(ASKED_KEY) === 'true';
}

function markAsked() {
  try {
    localStorage.setItem(ASKED_KEY, 'true');
  } catch {
    // ignore
  }
}

/** Call when the user dismisses our own prompt without granting/denying via the browser. */
export function dismissPermissionPrompt() {
  markAsked();
}

export function currentPermission(): NotificationPermission | 'unsupported' {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.permission;
}

/** Requests browser permission. Marks "asked" regardless of the outcome so we never ask again. */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied';
  markAsked();
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export interface AppNotificationOptions {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
}

/**
 * Shows a real OS-level notification if: the browser supports it, permission
 * was granted, the user hasn't turned notifications off in-app, and the tab
 * is currently hidden/unfocused (no need to interrupt someone already looking
 * at the conversation). Clicking it focuses this tab.
 */
export function showAppNotification({ title, body, tag, icon }: AppNotificationOptions): void {
  if (!notificationsSupported()) return;
  if (Notification.permission !== 'granted') return;
  if (!getNotificationPreference()) return;
  if (document.visibilityState === 'visible' && document.hasFocus()) return;

  try {
    const notification = new Notification(title, {
      body,
      tag,
      icon: icon ?? '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // Some browsers (notably iOS Safari) throw if notifications aren't fully
    // supported in this context — fail silently, it's a non-critical feature.
  }
}

/** Updates the PWA app icon badge (installed app icon, taskbar, etc). No-op where unsupported. */
export function setAppBadge(count: number): void {
  const nav = navigator as Navigator & {
    setAppBadge?: (count?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  };
  if (count > 0) nav.setAppBadge?.(count).catch(() => {});
  else nav.clearAppBadge?.().catch(() => {});
}
