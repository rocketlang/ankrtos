import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3008', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(15000);

  const check = await page.evaluate(() => {
    // Search for Fun Facts
    const allText = document.body.innerText;
    const hasFunFactsText = allText.includes('AIS Data at Scale');

    // Search for map
    const mapDiv = document.getElementById('ais-map-container');
    const leafletContainer = document.querySelector('.leaflet-container');

    // Get all divs with bg-gradient
    const gradientDivs = document.querySelectorAll('[class*="bg-gradient"]');

    return {
      hasFunFactsText,
      mapDivExists: !!mapDiv,
      leafletExists: !!leafletContainer,
      gradientDivsCount: gradientDivs.length,
      bodyHasContent: allText.length > 5000,
    };
  });

  console.log('Fun Facts text present:', check.hasFunFactsText ? '✅' : '❌');
  console.log('Map div exists:', check.mapDivExists ? '✅' : '❌');
  console.log('Leaflet container:', check.leafletExists ? '✅' : '❌');
  console.log('Gradient divs found:', check.gradientDivsCount);
  console.log('Page has content:', check.bodyHasContent ? '✅' : '❌');

  await browser.close();
})();
