import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Mari8X Frontend Testing
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'https://mari8x.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Main test project
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],

  // webServer disabled - testing against production mari8x.com
  // webServer: {
  //   command: 'echo "Frontend already running on port 3009"',
  //   url: 'http://localhost:3009',
  //   reuseExistingServer: true,
  //   timeout: 5000,
  // },
});
