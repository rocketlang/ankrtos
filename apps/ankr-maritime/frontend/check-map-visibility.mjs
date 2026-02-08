import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 3000 } });

  await page.goto('http://localhost:3008', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(15000);

  const visibility = await page.evaluate(() => {
    // Find the map heading
    const heading = Array.from(document.querySelectorAll('h3')).find(h =>
      h.textContent.includes('Global AIS Map')
    );

    if (!heading) return { found: false };

    const container = heading.closest('[class*="space-y"]');
    const style = window.getComputedStyle(container || heading);

    return {
      found: true,
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      height: style.height,
      position: style.position,
      zIndex: style.zIndex,
      top: style.top,
      transform: style.transform,
    };
  });

  console.log('Map Component Visibility:');
  console.log(JSON.stringify(visibility, null, 2));

  await browser.close();
})();
