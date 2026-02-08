import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const allLogs = [];
  const errors = [];

  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    allLogs.push({ type, text, timestamp: Date.now() });
    if (type === 'error') errors.push(text);
  });

  page.on('pageerror', err => {
    const errorText = `PAGE ERROR: ${err.message}\nStack: ${err.stack}`;
    errors.push(errorText);
    allLogs.push({ type: 'pageerror', text: errorText, timestamp: Date.now() });
  });

  console.log('Loading page...\n');
  await page.goto('http://localhost:3008', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(15000);

  console.log('━'.repeat(80));
  console.log('📋 ALL CONSOLE LOGS (chronological)\n');

  allLogs.forEach((log, i) => {
    console.log(`${i + 1}. [${log.type}] ${log.text}`);
  });

  if (errors.length > 0) {
    console.log('\n━'.repeat(80));
    console.log(`❌ ERRORS (${errors.length}):\n`);
    errors.forEach((err, i) => console.log(`${i + 1}. ${err}\n`));
  } else {
    console.log('\n✅ No errors detected');
  }

  console.log('━'.repeat(80));

  await browser.close();
})();
