import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.tarang.music',
  appName: 'VinaX',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    MediaSession: {
      // Empirical finding on Android 14/15 devices: starting the media
      // service lazily at first play never comes up, while starting it at
      // app launch works reliably. Keep it always-on; we prefill it with
      // the current song so it is never a blank notification for long.
      foregroundService: 'always',
    },
  },
};

export default config;
