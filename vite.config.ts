import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // the project lives in a OneDrive-synced folder, where native file events are sometimes missed
    watch: { usePolling: true, interval: 300 },
  },
  build: {
    // three.js alone is ~670 kB minified (~170 kB gzipped); that is expected
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // keep the big 3D libraries in their own long-cacheable chunks
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
});
