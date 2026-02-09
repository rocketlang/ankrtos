import { test as setup } from '@playwright/test';

/**
 * Authentication setup for tests
 * This runs before all tests to establish authentication
 */
setup('authenticate', async ({ page }) => {
  await page.goto('/login');

  // Wait for login page to load
  await page.waitForLoadState('networkidle');

  // Check if we're already authenticated (redirected to dashboard)
  if (page.url().includes('/login')) {
    // Try to find login form elements
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');

    if (await emailInput.count() > 0) {
      // Fill login form with correct mari8x.com credentials
      await emailInput.fill('admin@ankr.in');
      await passwordInput.fill('admin123');
      await loginButton.click();

      // Wait for navigation
      await page.waitForTimeout(2000);
    } else {
      console.log('No login form found, may already be authenticated');
    }
  }

  // Store authentication state
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
