import { defineConfig } from 'vite';

// Relative base so the build works on GitHub Pages under /six-string-museum/.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: { three: ['three'] },
      },
    },
  },
});
