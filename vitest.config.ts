import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 10000,
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 16,
        minThreads: 4,
      },
    },
    fileParallelism: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/examples/**',
      ],
    },
    include: ['tests/**/*.test.ts'],
  },
});
