const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5173/project/documents/platform/tutor', {
      waitUntil: 'networkidle',
    });

    await page.waitForTimeout(2000);

    const structure = await page.evaluate(() => {
      const root = document.getElementById('root');
      const allDivs = Array.from(document.querySelectorAll('div')).slice(0, 10);

      return {
        rootBg: root ? window.getComputedStyle(root).backgroundColor : 'not found',
        bodyBg: window.getComputedStyle(document.body).backgroundColor,
        firstDivsBg: allDivs.map(d => ({
          class: d.className,
          bg: window.getComputedStyle(d).backgroundColor
        }))
      };
    });

    console.log('Root background:', structure.rootBg);
    console.log('Body background:', structure.bodyBg);
    console.log('\nFirst 10 divs:');
    structure.firstDivsBg.forEach((d, i) => {
      console.log(`${i + 1}. ${d.bg} - ${d.class.substring(0, 50)}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
