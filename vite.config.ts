import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
    // Ensure assets are properly handled for Chrome extension
    assetsDir: 'assets',
    copyPublicDir: true,
  },
  // Configure for Chrome extension environment
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Ensure proper base path for extension
  base: './',
});