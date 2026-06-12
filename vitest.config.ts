import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        '.next/**',
        'app/**',        // Next.js App Router files (SSR, not directly testable in Vitest)
        'public/**',
        'vitest.config.ts',
        'next.config.ts',
      ],
    },
  },
  resolve: {
    alias: {
      // Match the "@/*" path alias from tsconfig.json
      '@': path.resolve(__dirname, '.'),
    },
  },
});
