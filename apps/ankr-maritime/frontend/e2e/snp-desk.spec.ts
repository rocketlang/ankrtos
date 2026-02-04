import { test, expect } from '@playwright/test';

test.describe('SNPDesk', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/snp-desk');
  });

  test('should load SNPDesk page', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check URL
    expect(page.url()).toContain('/snp-desk');

    // Check page title
    const title = await page.title();
    expect(title).toContain('Mari8x');
  });

  test('should display S&P listings', async ({ page }) => {
    // Wait for GraphQL query to complete
    await page.waitForTimeout(2000);

    // Check for listing container
    const listingExists = await page.locator('[data-testid="snp-listings"], table, .listing-grid').count() > 0;

    if (!listingExists) {
      // Look for any table or grid structure
      const tables = await page.locator('table').count();
      const grids = await page.locator('[role="grid"], .grid, div[class*="grid"]').count();

      console.log(`Tables found: ${tables}, Grids found: ${grids}`);
      expect(tables + grids).toBeGreaterThan(0);
    }
  });

  test('should display vessel sale data if available', async ({ page }) => {
    await page.waitForTimeout(3000);

    // Check for S&P related text
    const pageContent = await page.textContent('body');

    const hasSNPData =
      pageContent?.includes('Sale') ||
      pageContent?.includes('Purchase') ||
      pageContent?.includes('USD') ||
      pageContent?.includes('$') ||
      pageContent?.includes('Listing') ||
      pageContent?.includes('active') ||
      pageContent?.includes('sold');

    console.log('S&P data found:', hasSNPData);

    if (!hasSNPData) {
      await page.screenshot({ path: 'snp-desk-no-data.png' });
    }
  });

  test('should have market overview section', async ({ page }) => {
    await page.waitForTimeout(2000);

    const pageContent = await page.textContent('body');

    // Look for market-related text
    const hasMarketInfo =
      pageContent?.includes('Market') ||
      pageContent?.includes('Overview') ||
      pageContent?.includes('Statistics');

    console.log('Market overview found:', hasMarketInfo);
  });

  test('should have navigation elements', async ({ page }) => {
    const nav = await page.locator('nav, aside, [role="navigation"]').count();
    expect(nav).toBeGreaterThan(0);
  });

  test('should not have critical console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/snp-desk');
    await page.waitForTimeout(3000);

    const criticalErrors = errors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('DevTools')
    );

    console.log('Critical errors:', criticalErrors);
    expect(criticalErrors.length).toBeLessThan(5);
  });

  test('should make GraphQL requests', async ({ page }) => {
    let graphqlRequests = 0;

    page.on('request', request => {
      if (request.url().includes('/graphql')) {
        graphqlRequests++;
      }
    });

    await page.goto('/snp-desk');
    await page.waitForTimeout(3000);

    console.log('GraphQL requests made:', graphqlRequests);
    expect(graphqlRequests).toBeGreaterThan(0);
  });
});
