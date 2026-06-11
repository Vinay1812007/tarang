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
      // Start the native media service at app launch instead of first play —
      // more reliable startForeground timing on Android 14/15 and the
      // notification appears as soon as metadata + playing state arrive.
      foregroundService: 'always',
    },
  },
};

export default config;
