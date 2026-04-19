import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@contracts': path.join(rootDir, 'src', 'shared', 'contracts'),
      '@web': path.join(rootDir, 'web', 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: path.join(rootDir, 'web', 'src', 'test', 'setup.ts'),
    include: [
      'tests/**/*.test.ts',
      'web/src/**/*.test.ts',
      'web/src/**/*.test.tsx',
    ],
  },
});
