const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Capture console errors
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  try {
    await page.goto('http://localhost:5173/project/documents/platform/courses/class-10-mathematics', {
      waitUntil: 'networkidle',
    });

    await page.waitForTimeout(2000);

    //Get module info before clicking
    const modulesInfo = await page.evaluate(() => {
      const modules = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Real Numbers'));
      return modules.map(m => ({
        text: m.textContent.substring(0, 50),
        hasOnClick: m.onclick !== null,
        disabled: m.disabled
      }));
    });

    console.log('Modules found:', modulesInfo);

    // Try clicking
    const clicked = await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Real Numbers'));
      if (button) {
        button.click();
        return true;
      }
      return false;
    });

    console.log('Click success:', clicked);

    await page.waitForTimeout(3000);

    // Check if anything changed
    const afterClick = await page.evaluate(() => {
      return {
        bodyLength: document.body.innerText.length,
        hasExpandedContent: document.body.innerText.includes('Examples') || document.body.innerText.includes('Exercises'),
        errorDivs: Array.from(document.querySelectorAll('[class*="error"]')).length
      };
    });

    console.log('After click:', afterClick);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
