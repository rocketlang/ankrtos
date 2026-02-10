const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5173/project/documents/platform/courses/class-10-mathematics', {
      waitUntil: 'networkidle',
    });

    await page.waitForTimeout(2000);

    // Click first module
    const moduleButton = await page.$('button:has(h3:text("Real Numbers"))');
    if (moduleButton) {
      await moduleButton.click();
      await page.waitForTimeout(3000);

      // Get the HTML of the expanded section
      const html = await page.evaluate(() => {
        const expanded = document.querySelector('[class*="border-t"][class*="border-gray-800"][class*="bg-gray-900"]');
        return expanded ? expanded.outerHTML.substring(0, 1000) : 'NOT FOUND';
      });

      console.log('Expanded section HTML:');
      console.log(html);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
