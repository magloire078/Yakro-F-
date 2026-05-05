/**
 * Thin wrapper around the Web Notifications API. Centralises the SSR/feature
 * detection so callers don't have to repeat `typeof window` checks.
 */

export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getBrowserNotificationPermission(): NotificationPermission | null {
  if (!isBrowserNotificationSupported()) return null;
  return Notification.permission;
}

/**
 * Politely asks the user for permission to send OS-level notifications.
 * Safe to call multiple times — the browser remembers the answer and will
 * not re-prompt once the user has decided.
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | null> {
  if (!isBrowserNotificationSupported()) return null;
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch (err) {
    console.warn('Notification permission request failed:', err);
    return Notification.permission;
  }
}

/**
 * Fires an OS-level notification when permission has been granted. Returns
 * `false` when permission is missing so callers can fall back to in-app UI.
 */
export function fireBrowserNotification(
  title: string,
  options?: NotificationOptions,
): boolean {
  if (!isBrowserNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;
  try {
    new Notification(title, options);
    return true;
  } catch (err) {
    console.warn('Notification dispatch failed:', err);
    return false;
  }
}
