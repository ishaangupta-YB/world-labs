import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  publicDir: false,
  server: {
    open: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ancient: resolve(__dirname, 'ancient.html'),
        cooper: resolve(__dirname, 'cooper-station.html'),
        dis1: resolve(__dirname, 'dis1.html'),
        mountain: resolve(__dirname, 'mountain.html'),
        rome: resolve(__dirname, 'rome.html'),
        temple: resolve(__dirname, 'temple.html'),
      },
      output: {
        manualChunks: {
          rapier: ['@dimforge/rapier3d-compat'],
          three: ['three'],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d-compat'],
  },
}); 