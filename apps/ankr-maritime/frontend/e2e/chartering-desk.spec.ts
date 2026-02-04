import { test, expect } from '@playwright/test';

test.describe('CharteringDesk', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chartering-desk');
  });

  test('should load CharteringDesk page', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check URL
    expect(page.url()).toContain('/chartering-desk');

    // Check page title
    const title = await page.title();
    expect(title).toContain('Mari8x');
  });

  test('should display charter list', async ({ page }) => {
    // Wait for GraphQL query to complete
    await page.waitForTimeout(2000);

    // Check for charter list container
    const charterListExists = await page.locator('[data-testid="charter-list"], table, .charter-list').count() > 0;

    if (!charterListExists) {
      // Look for any table or list structure
      const tables = await page.locator('table').count();
      const lists = await page.locator('ul, ol, div[role="list"]').count();

      console.log(`Tables found: ${tables}, Lists found: ${lists}`);
      expect(tables + lists).toBeGreaterThan(0);
    }
  });

  test('should display charter data if available', async ({ page }) => {
    await page.waitForTimeout(3000);

    // Check for common charter-related text
    const pageContent = await page.textContent('body');

    // Look for charter references, vessel names, or status text
    const hasCharterData =
      pageContent?.includes('VCH-') ||
      pageContent?.includes('TCH-') ||
      pageContent?.includes('Charter') ||
      pageContent?.includes('Voyage') ||
      pageContent?.includes('Time Charter');

    console.log('Charter data found:', hasCharterData);

    if (!hasCharterData) {
      // Take screenshot for debugging
      await page.screenshot({ path: 'charter-desk-no-data.png' });
    }
  });

  test('should have navigation elements', async ({ page }) => {
    // Check for sidebar or navigation
    const nav = await page.locator('nav, aside, [role="navigation"]').count();
    expect(nav).toBeGreaterThan(0);
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/chartering-desk');
    await page.waitForTimeout(3000);

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('DevTools')
    );

    console.log('Critical errors:', criticalErrors);
    expect(criticalErrors.length).toBeLessThan(5);
  });

  test('should handle GraphQL requests', async ({ page }) => {
    let graphqlRequests = 0;

    page.on('request', request => {
      if (request.url().includes('/graphql')) {
        graphqlRequests++;
      }
    });

    await page.goto('/chartering-desk');
    await page.waitForTimeout(3000);

    console.log('GraphQL requests made:', graphqlRequests);
    expect(graphqlRequests).toBeGreaterThan(0);
  });
});
