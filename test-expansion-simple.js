const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5173/project/documents/platform/courses/class-10-mathematics', {
      waitUntil: 'networkidle',
    });

    console.log('1. Page loaded');
    await page.waitForTimeout(2000);

    // Check initial state
    const before = await page.evaluate(() => {
      const modules = Array.from(document.querySelectorAll('[class*="bg-gray-900"][class*="border-2"]'));
      return {
        totalModules: modules.length,
        blueBorders: modules.filter(m => m.className.includes('border-blue-500')).length,
        grayBorders: modules.filter(m => m.className.includes('border-gray-800')).length
      };
    });

    console.log('2. Before click:', before);

    // Click first module
    await page.click('button:has(h3:text("Real Numbers"))');
    console.log('3. Clicked module');
    await page.waitForTimeout(2000);

    // Check after state
    const after = await page.evaluate(() => {
      const modules = Array.from(document.querySelectorAll('[class*="bg-gray-900"][class*="border-2"]'));
      const expanded = modules.filter(m => m.className.includes('border-blue-500'));

      let tabsContent = '';
      if (expanded.length > 0) {
        tabsContent = expanded[0].innerHTML.substring(0, 500);
      }

      return {
        totalModules: modules.length,
        blueBorders: expanded.length,
        grayBorders: modules.filter(m => m.className.includes('border-gray-800')).length,
        hasTabsDiv: expanded[0]?.innerHTML.includes('Content Navigation Tabs') || false,
        hasExamplesButton: expanded[0]?.innerHTML.includes('Examples') || false
      };
    });

    console.log('4. After click:', after);

    if (after.blueBorders > 0) {
      console.log('✅ Module is expanding (border changed to blue)');
    } else {
      console.log('❌ Module is NOT expanding (border still gray)');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
