import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist-renderer',
    emptyOutDir: true,
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000,
  },
  server: { port: 5173, strictPort: true },
});
