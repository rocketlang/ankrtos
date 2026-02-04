import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'Integration & Unit Tests',
    include: ['src/__tests__/**/*.test.ts', '!src/__tests__/e2e/**/*.test.ts'],
    globals: true,
    environment: 'node',
    testTimeout: 10000,
    hookTimeout: 10000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/__tests__/**',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/main.ts',
      ],
    },
  },
});
