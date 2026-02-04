import { test, expect } from '@playwright/test';

test.describe('Simple Frontend Test', () => {
  test('check what is actually displayed on root', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/root-page.png', fullPage: true });

    // Get all text content
    const bodyText = await page.textContent('body');
    console.log('=== PAGE CONTENT ===');
    console.log(bodyText);

    // Get current URL
    console.log('=== CURRENT URL ===');
    console.log(page.url());

    // Check for common elements
    const hasLogin = bodyText?.toLowerCase().includes('login');
    const hasEmail = await page.locator('input[type="email"]').count();
    const hasPassword = await page.locator('input[type="password"]').count();

    console.log('=== DETECTION ===');
    console.log('Has "login" text:', hasLogin);
    console.log('Has email input:', hasEmail);
    console.log('Has password input:', hasPassword);
  });

  test('check chartering-desk page', async ({ page }) => {
    await page.goto('/chartering-desk');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/chartering-desk-page.png', fullPage: true });

    const bodyText = await page.textContent('body');
    console.log('=== CHARTERING DESK URL ===');
    console.log(page.url());
    console.log('=== CHARTERING DESK CONTENT (first 500 chars) ===');
    console.log(bodyText?.substring(0, 500));
  });
});
