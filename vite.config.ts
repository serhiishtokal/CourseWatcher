import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: path.join(rootDir, 'web'),
  plugins: [react()],
  resolve: {
    alias: {
      '@contracts': path.join(rootDir, 'src', 'shared', 'contracts'),
      '@web': path.join(rootDir, 'web', 'src'),
    },
  },
  server: {
    fs: {
      allow: [rootDir],
    },
  },
  build: {
    outDir: path.join(rootDir, 'dist', 'web'),
    emptyOutDir: false,
  },
});
