const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5173/project/documents/platform/tutor', {
      waitUntil: 'networkidle',
    });

    await page.waitForTimeout(3000);

    const inlineStyles = await page.evaluate(() => {
      const divsWithInlineStyle = Array.from(document.querySelectorAll('div[style]'))
        .filter(d => d.getAttribute('style').includes('display'))
        .slice(0, 5);

      return divsWithInlineStyle.map(d => ({
        style: d.getAttribute('style').substring(0, 150),
        computedBg: window.getComputedStyle(d).backgroundColor,
        isDarkBg: window.getComputedStyle(d).backgroundColor.includes('15, 23, 42') ||
                  window.getComputedStyle(d).backgroundColor.includes('30, 41, 59')
      }));
    });

    console.log('Divs with inline display styles:');
    inlineStyles.forEach((s, i) => {
      console.log(`\n${i + 1}.`);
      console.log('  Style attr:', s.style);
      console.log('  Computed bg:', s.computedBg);
      console.log('  Is dark?', s.isDarkBg ? '✅' : '❌');
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
