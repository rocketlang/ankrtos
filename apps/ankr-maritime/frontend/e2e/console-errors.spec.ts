import { test } from '@playwright/test';

test('capture all console output', async ({ page }) => {
  const logs: { type: string; text: string }[] = [];

  page.on('console', (msg) => {
    logs.push({ type: msg.type(), text: msg.text() });
  });

  page.on('pageerror', (error) => {
    logs.push({ type: 'pageerror', text: error.message });
  });

  await page.goto('/');
  await page.waitForTimeout(5000);

  console.log('=== ALL CONSOLE OUTPUT ===');
  logs.forEach((log) => {
    console.log(`[${log.type.toUpperCase()}] ${log.text}`);
  });

  console.log(`\\n=== TOTAL LOGS: ${logs.length} ===`);
});
