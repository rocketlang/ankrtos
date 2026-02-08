import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const logs = [];
  page.on('console', msg => logs.push({ time: Date.now(), text: msg.text() }));

  console.log('Loading page...\n');
  await page.goto('http://localhost:3008', { timeout: 10000 }).catch(() => {});

  // Wait for map init logs
  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll('*')).some(() => true);
  }, { timeout: 5000 }).catch(() => {});

  // Check map status at different time intervals
  const checks = [];

  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(3000);

    const status = await page.evaluate(() => {
      const div700 = Array.from(document.querySelectorAll('[style*="700px"]'))[0];
      return {
        exists: !!div700,
        className: div700?.className || '',
        childCount: div700?.children.length || 0,
        hasLeafletClass: div700?.className.includes('leaflet') || false,
        leafletContainers: document.querySelectorAll('.leaflet-container').length,
      };
    });

    checks.push({ time: `T+${(i + 1) * 3}s`, ...status });
  }

  console.log('━'.repeat(80));
  console.log('⏱️  MAP STATUS OVER TIME\n');

  checks.forEach(check => {
    console.log(`${check.time}:`);
    console.log(`   700px div exists:      ${check.exists ? '✅' : '❌'}`);
    console.log(`   Children:              ${check.childCount}`);
    console.log(`   Has leaflet class:     ${check.hasLeafletClass ? '✅' : '❌'}`);
    console.log(`   .leaflet-container:    ${check.leafletContainers}`);
    console.log('');
  });

  // Show MAP INIT logs
  const mapLogs = logs.filter(log => log.text.includes('MAP INIT'));
  if (mapLogs.length > 0) {
    console.log('📝 MAP INIT Logs:');
    mapLogs.forEach(log => console.log(`   ${log.text}`));
  }

  console.log('━'.repeat(80));

  await browser.close();
})();
