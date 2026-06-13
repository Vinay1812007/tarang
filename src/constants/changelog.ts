/** Per-version highlights — shown once after each update. Keep newest first. */
export const CHANGELOG: Record<string, string[]> = {
  '1.12.0': [
    '🔔 Rebuilt the playback notification from scratch — VinaX\'s own native media service',
    '🎛 Lockscreen + Bluetooth/headset controls, Play/Pause/Prev/Next/Stop',
    '📱 Works across Android 8, 12, and 13+',
  ],
  '1.11.0': [
    '🔔 Playback notification fix for Xiaomi/HyperOS devices (main-thread media updates)',
    '🎨 New look: deep violet-black surfaces with a hot crimson accent, lyric-forward player',
    '🌐 Language selection in Settings rebuilt — all languages, clean layout',
    '🛟 The app now tells you on-screen if the notification bridge misbehaves',
  ],
  '1.10.2': [
    '🔔 Rebuilt the Android build pipeline for reliable playback notifications',
    '🧪 Deeper notification diagnostics in Settings',
  ],
  '1.10.1': [
    '🔔 Notification now always shows song title, artist, and artwork',
    '🛠 Hardened the native media layer against artwork download failures',
  ],
  '1.10.0': [
    '🏠 Home feed now scrolls forever — endless picks across your languages',
    '🔔 Playback notification reliability pass for Android',
    '🌗 Light theme fully reworked — clean, readable, instant switching',
    '🧭 Smoother scrolling and pages always open at the top',
    '🎓 New user tour + this What’s New screen',
  ],
};

export function notesFor(version: string): string[] {
  return CHANGELOG[version] ?? ['Performance improvements and bug fixes.'];
}
