/** Per-version highlights — shown once after each update. Keep newest first. */
export const CHANGELOG: Record<string, string[]> = {
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
