import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@bfc.in');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('should display dashboard metrics', async ({ page }) => {
    // Check for stat cards
    await expect(page.getByText(/total customers/i)).toBeVisible();
    await expect(page.getByText(/active loans/i)).toBeVisible();
    await expect(page.getByText(/pending kyc/i)).toBeVisible();
  });

  test('should display recent activity', async ({ page }) => {
    await expect(page.getByText(/recent activity/i)).toBeVisible();
  });

  test('should navigate to customers page', async ({ page }) => {
    await page.getByRole('link', { name: /customers/i }).click();
    await expect(page).toHaveURL(/customers/);
    await expect(page.getByRole('heading', { name: /customers/i })).toBeVisible();
  });

  test('should navigate to credit decisions page', async ({ page }) => {
    await page.getByRole('link', { name: /credit/i }).click();
    await expect(page).toHaveURL(/credit/);
  });

  test('should open notification panel', async ({ page }) => {
    await page.getByRole('button', { name: /notifications/i }).click();
    await expect(page.getByText(/no new notifications|notifications/i)).toBeVisible();
  });
});
