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
      // Service starts at app launch: combined with the native permission
      // prompt in MainActivity and array-safe base64 metadata, this is every
      // empirically-working lever stacked together.
      foregroundService: 'always',
    },
  },
};

export default config;
