import { test, expect } from '@playwright/test';

// Quick smoke test for critical pages
const criticalPages = [
  { path: '/login', name: 'Login', expectContent: 'Sign In' },
  { path: '/dashboard', name: 'Dashboard', expectContent: 'Dashboard' },
  { path: '/documents', name: 'DMS', expectContent: 'Document' },
  { path: '/knowledge-base', name: 'Knowledge Base', expectContent: 'Knowledge Base' },
  { path: '/vessels', name: 'Vessels', expectContent: 'Vessels' },
  { path: '/voyages', name: 'Voyages', expectContent: 'Voyage' },
  { path: '/coa', name: 'COA', expectContent: 'Contract' },
  { path: '/hr', name: 'HR', expectContent: 'HR' },
  { path: '/snp-desk', name: 'S&P Desk', expectContent: 'S&P' },
];

test.describe('Quick Smoke Test - Critical Pages', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  for (const page of criticalPages) {
    test(`${page.name} loads correctly`, async ({ page: pw }) => {
      await pw.goto(`https://mari8x.com${page.path}`, {
        waitUntil: 'networkidle',
        timeout: 15000,
      });

      await pw.waitForTimeout(2000);

      // Check page has content
      const bodyText = await pw.locator('body').innerText();
      expect(bodyText.length).toBeGreaterThan(0);

      // Check for expected content (if applicable)
      if (page.expectContent && page.path !== '/login') {
        const hasExpectedContent = bodyText.includes(page.expectContent);
        expect(hasExpectedContent, `Page should contain "${page.expectContent}"`).toBe(true);
      }

      console.log(`✅ ${page.name} - OK`);
    });
  }
});
