import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  console.log('📸 Loading page and taking screenshot...\n');
  await page.goto('http://localhost:3008', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(15000);

  // Scroll to map
  await page.evaluate(() => {
    const heading = Array.from(document.querySelectorAll('h3')).find(h =>
      h.textContent.includes('Global AIS Map')
    );
    if (heading) {
      heading.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  await page.waitForTimeout(2000);

  await page.screenshot({
    path: '/tmp/mari8x-map-working.png',
    fullPage: false
  });

  console.log('✅ Screenshot saved to: /tmp/mari8x-map-working.png');
  console.log('\nYou can view it with: imgcat /tmp/mari8x-map-working.png');

  await browser.close();
})();
