import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')) as {
  version: string;
};

/** Emits dist/version.json so installed apps can detect site updates. */
function versionManifest(): Plugin {
  return {
    name: 'vinax-version-manifest',
    closeBundle() {
      const out = path.resolve(__dirname, 'dist/version.json');
      fs.writeFileSync(
        out,
        JSON.stringify({
          version: pkg.version,
          apk: 'https://github.com/Vinay1812007/VinaX/releases/latest/download/vinax.apk',
        }),
      );
    },
  };
}

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [react(), versionManifest()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  build: {
    // Deterrence note: disabling source maps + minification is cosmetic
    // obfuscation only. There are no secrets in this client and we never
    // claim client-side secrecy.
    sourcemap: false,
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          data: ['@tanstack/react-query', 'zustand'],
        },
      },
    },
  },
  server: { port: 5173 },
});
