import { Capacitor } from '@capacitor/core';

export const isNativePlatform = (): boolean => Capacitor.isNativePlatform();
export const isAndroid = (): boolean => Capacitor.getPlatform() === 'android';

let permissionAsked = false;

/**
 * Android 13+ requires POST_NOTIFICATIONS for the media playback notification
 * to be visible. We ask once, on app open, via the LocalNotifications plugin
 * (its permission maps to the system notification permission). Denial is
 * fine — playback still works, only the notification is hidden.
 */
export async function requestNotificationPermissionOnce(): Promise<void> {
  if (!isNativePlatform() || permissionAsked) return;
  permissionAsked = true;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const status = await LocalNotifications.checkPermissions();
    if (status.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }
  } catch {
    // Plugin unavailable (web/dev) — ignore.
  }
}

/** Light haptic tick on key interactions (native only, fire-and-forget). */
export function haptic(style: 'light' | 'medium' = 'light'): void {
  if (!isNativePlatform()) return;
  void (async () => {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: style === 'light' ? ImpactStyle.Light : ImpactStyle.Medium });
    } catch {
      /* ignore */
    }
  })();
}
