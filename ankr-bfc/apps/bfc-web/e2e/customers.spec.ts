import { test, expect } from '@playwright/test';

test.describe('Customers', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@bfc.in');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.goto('/customers');
  });

  test('should display customer list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /customers/i })).toBeVisible();
    // Check for table or list
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should search for customers', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('Rahul');
    await searchInput.press('Enter');

    // Should filter results
    await expect(page.getByText(/Rahul/i)).toBeVisible();
  });

  test('should filter by segment', async ({ page }) => {
    // Click segment filter
    await page.getByRole('combobox', { name: /segment/i }).click();
    await page.getByRole('option', { name: /premium/i }).click();

    // Should show filtered results
    await expect(page.getByText(/premium/i)).toBeVisible();
  });

  test('should open customer 360 view', async ({ page }) => {
    // Click on first customer row
    await page.getByRole('row').nth(1).click();

    // Should navigate to customer detail
    await expect(page).toHaveURL(/customers\/[a-zA-Z0-9-]+/);
    await expect(page.getByText(/customer 360|profile/i)).toBeVisible();
  });

  test('should display customer risk score', async ({ page }) => {
    // Click on first customer
    await page.getByRole('row').nth(1).click();

    // Should show risk indicators
    await expect(page.getByText(/risk score/i)).toBeVisible();
    await expect(page.getByText(/trust score/i)).toBeVisible();
  });
});
