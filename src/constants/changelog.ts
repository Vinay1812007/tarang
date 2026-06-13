/** Per-version highlights — shown once after each update. Keep newest first. */
export const CHANGELOG: Record<string, string[]> = {
  '1.16.2': [
    '🖼 Share-as-image now embeds real album art (via a CORS-safe image proxy)',
  ],
  '1.16.1': [
    '🖼 Fixed “Share as image” — now works reliably on web and Android',
    '🔍 Search box and tabs stay pinned while results scroll',
    '🎙 Voice search shows a clear listening animation',
  ],
  '1.16.0': [
    '✨ New Aurora look — living ambient background + 4 new accent themes (Sunset, Aurora, Mono…)',
    '🚗 Drive Mode — huge, simple controls for the road',
    '⏯ Resume playback — long tracks pick up where you left off',
    '🔥 Listening streaks, 📊 on-screen visualizer, double-tap artwork to favorite',
    '🪶 Density & haptics controls, Recently Added shelf, refined glass surfaces',
  ],
  '1.15.0': [
    '💾 Save albums & playlists and follow artists — all in your Library',
    '🙈 “Not interested” on any song to tune your recommendations',
    '📚 New “Saved & Following” shelf in Library',
  ],
  '1.14.0': [
    '🎚 Crossfade — songs blend smoothly into each other (toggle in Settings)',
    '😴 Sleep timer now fades out gently instead of cutting off',
    '🖼 Share any song as a beautiful image card',
    '📅 VinaX Daily — a fresh personalized mix every morning, on Home',
  ],
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
