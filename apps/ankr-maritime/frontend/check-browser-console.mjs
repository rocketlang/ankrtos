import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const errors = [];
  const warnings = [];
  const logs = [];

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') errors.push(text);
    else if (msg.type() === 'warning') warnings.push(text);
    else logs.push(text);
  });

  page.on('pageerror', err => {
    errors.push(`PAGE ERROR: ${err.message}`);
  });

  console.log('Loading page...\n');
  await page.goto('http://localhost:3008', { waitUntil: 'networkidle' });
  await page.waitForTimeout(10000);

  console.log('━'.repeat(60));
  console.log(`❌ ERRORS (${errors.length}):`);
  errors.forEach((err, i) => console.log(`${i + 1}. ${err}`));

  console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
  warnings.forEach((warn, i) => console.log(`${i + 1}. ${warn}`));

  console.log(`\n📝 LOGS (showing last 10 of ${logs.length}):`);
  logs.slice(-10).forEach(log => console.log(`   ${log}`));
  console.log('━'.repeat(60));

  await browser.close();
})();
