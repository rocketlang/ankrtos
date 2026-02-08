import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const logs = [];
  page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));

  await page.goto('http://localhost:3008', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(15000);

  const queryData = await page.evaluate(() => {
    // Find the button text
    const buttons = Array.from(document.querySelectorAll('button'));
    const shipsBtn = buttons.find(b => b.textContent?.includes('Ships'));
    const heatmapBtn = buttons.find(b => b.textContent?.includes('Heatmap'));

    // Check for leaflet markers
    const markers = document.querySelectorAll('.leaflet-marker-icon').length;
    const circles = document.querySelectorAll('.leaflet-interactive').length;

    return {
      shipsButtonText: shipsBtn?.textContent?.trim() || 'NOT FOUND',
      heatmapButtonText: heatmapBtn?.textContent?.trim() || 'NOT FOUND',
      markersOnMap: markers,
      circlesOnMap: circles,
    };
  });

  console.log('━'.repeat(80));
  console.log('🔍 QUERY DATA CHECK\n');
  console.log(`Ships Button:    ${queryData.shipsButtonText}`);
  console.log(`Heatmap Button:  ${queryData.heatmapButtonText}`);
  console.log(`Markers on map:  ${queryData.markersOnMap}`);
  console.log(`Circles on map:  ${queryData.circlesOnMap}`);

  const errors = logs.filter(l => l.type === 'error');
  if (errors.length > 0) {
    console.log(`\n❌ Console Errors:`);
    errors.forEach(e => console.log(`   ${e.text}`));
  }

  console.log('━'.repeat(80));

  await browser.close();
})();
