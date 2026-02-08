import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:3008', { waitUntil: 'networkidle' });
  await page.waitForTimeout(15000);

  const content = await page.evaluate(() => {
    const body = document.body.innerText;

    // Check for key sections
    const hasAIS = body.includes('AIS');
    const hasGlobalMap = body.includes('Global') && body.includes('Map');
    const hasMaritimeStats = body.includes('Maritime');
    const hasFunFacts = body.includes('Fun Facts');

    // Get all h3 headings
    const h3s = Array.from(document.querySelectorAll('h3')).map(h => h.textContent.trim());

    // Check for React errors
    const hasError = body.includes('Error') || body.includes('error');

    // Check component count
    const componentDivs = document.querySelectorAll('[class*="space-y"]').length;

    return {
      hasAIS,
      hasGlobalMap,
      hasMaritimeStats,
      hasFunFacts,
      h3Headings: h3s,
      hasError,
      componentDivs,
      bodyLength: body.length,
    };
  });

  console.log('📄 Page Content Analysis:');
  console.log('━'.repeat(60));
  console.log(`AIS text present:        ${content.hasAIS ? '✅' : '❌'}`);
  console.log(`Global Map text:         ${content.hasGlobalMap ? '✅' : '❌'}`);
  console.log(`Maritime Stats:          ${content.hasMaritimeStats ? '✅' : '❌'}`);
  console.log(`Fun Facts:               ${content.hasFunFacts ? '✅' : '❌'}`);
  console.log(`Has errors:              ${content.hasError ? '⚠️' : '✅ No'}`);
  console.log(`Component divs:          ${content.componentDivs}`);
  console.log(`Page body length:        ${content.bodyLength} chars`);

  console.log(`\n📋 H3 Headings found (${content.h3Headings.length}):`);
  content.h3Headings.slice(0, 10).forEach(h => console.log(`   - ${h}`));
  if (content.h3Headings.length > 10) {
    console.log(`   ... and ${content.h3Headings.length - 10} more`);
  }

  await browser.close();
})();
