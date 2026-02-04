import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'E2E Tests',
    include: ['src/__tests__/e2e/**/*.e2e.test.ts'],
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    setupFiles: ['./src/__tests__/setup-e2e.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/__tests__/**',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
      ],
    },
  },
});
