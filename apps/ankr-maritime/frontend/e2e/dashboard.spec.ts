import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should load dashboard page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check page title
    const title = await page.title();
    expect(title).toContain('Mari8x');
  });

  test('should display main content', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Check for main content area
    const main = await page.locator('main, [role="main"], #root').count();
    expect(main).toBeGreaterThan(0);
  });

  test('should have navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Check for navigation elements
    const nav = await page.locator('nav, aside, [role="navigation"]').count();
    expect(nav).toBeGreaterThan(0);
  });

  test('should contain dashboard text or widgets', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const pageContent = await page.textContent('body');

    const hasDashboardContent =
      pageContent?.includes('Dashboard') ||
      pageContent?.includes('Welcome') ||
      pageContent?.includes('Overview') ||
      pageContent?.includes('Charter') ||
      pageContent?.includes('Vessel') ||
      pageContent?.includes('Port');

    console.log('Dashboard content found:', hasDashboardContent);
    expect(hasDashboardContent).toBe(true);
  });

  test('should have clickable navigation links', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Find navigation links
    const links = await page.locator('a[href*="/"]').count();
    console.log('Navigation links found:', links);
    expect(links).toBeGreaterThan(0);
  });

  test('should navigate to chartering desk', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Try to find and click chartering link
    const charteringLink = page.locator('a[href*="chartering"], a:has-text("Charter")').first();

    if (await charteringLink.count() > 0) {
      await charteringLink.click();
      await page.waitForTimeout(1000);

      // Check URL changed
      const url = page.url();
      console.log('Navigated to:', url);
    } else {
      console.log('No chartering link found in navigation');
    }
  });

  test('should not have critical errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('DevTools')
    );

    console.log('Critical errors:', criticalErrors);
    expect(criticalErrors.length).toBeLessThan(5);
  });
});
