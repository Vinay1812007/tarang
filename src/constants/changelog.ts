/** Per-version highlights — shown once after each update. Keep newest first. */
export const CHANGELOG: Record<string, string[]> = {
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
