import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  console.log('📸 Loading page...');
  await page.goto('http://localhost:3008', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(15000);

  // Scroll to find Fun Facts and Map
  await page.evaluate(() => {
    window.scrollTo(0, 2000); // Scroll down
  });
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: '/tmp/mari8x-scrolled.png',
    fullPage: false
  });

  // Check what sections exist
  const sections = await page.evaluate(() => {
    const allH3s = Array.from(document.querySelectorAll('h3')).map(h => ({
      text: h.textContent.trim(),
      visible: h.offsetParent !== null
    }));

    const hasFunFacts = document.body.innerText.includes('Fun Facts');
    const hasGlobalMap = document.body.innerText.includes('Global AIS Map');

    return { allH3s, hasFunFacts, hasGlobalMap };
  });

  console.log('\n📋 Page Sections:');
  console.log(`Fun Facts present: ${sections.hasFunFacts ? '✅' : '❌'}`);
  console.log(`Global AIS Map present: ${sections.hasGlobalMap ? '✅' : '❌'}`);
  console.log(`\nAll H3 headings (${sections.allH3s.length}):`);
  sections.allH3s.forEach((h, i) => {
    console.log(`   ${i + 1}. ${h.text} ${h.visible ? '👁️' : '🚫'}`);
  });

  console.log(`\n✅ Screenshot saved: /tmp/mari8x-scrolled.png`);

  await browser.close();
})();
