import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
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
