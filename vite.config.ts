import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, isPreview }) => ({
  plugins: [react()],
  // GitHub Pages serves the site from /FlexyJaw/ (mirrored by `vite preview`); the dev server stays at the root
  base: command === 'build' || isPreview ? '/FlexyJaw/' : '/',
  server: {
    // the project lives in a OneDrive-synced folder, where native file events are sometimes missed
    watch: { usePolling: true, interval: 300 },
  },
  build: {
    // GitHub Pages publishes the docs/ folder of main
    outDir: 'docs',
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
}));
