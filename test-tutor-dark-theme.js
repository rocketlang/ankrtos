const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5173/project/documents/platform/tutor?course=class-6-english&mode=socratic', {
      waitUntil: 'networkidle',
      timeout: 10000
    });

    console.log('✅ Tutor page loaded');
    await page.waitForTimeout(2000);

    // Check background colors
    const colors = await page.evaluate(() => {
      const mainDiv = document.querySelector('div[style*="display: flex"]');
      const header = document.querySelector('h2');
      const textarea = document.querySelector('textarea');

      return {
        mainBackground: mainDiv ? window.getComputedStyle(mainDiv).backgroundColor : 'not found',
        headerColor: header ? window.getComputedStyle(header).color : 'not found',
        textareaBackground: textarea ? window.getComputedStyle(textarea).backgroundColor : 'not found',
        textareaColor: textarea ? window.getComputedStyle(textarea).color : 'not found'
      };
    });

    console.log('\n🎨 Color Analysis:');
    console.log('Main background:', colors.mainBackground);
    console.log('Header text:', colors.headerColor);
    console.log('Textarea background:', colors.textareaBackground);
    console.log('Textarea text:', colors.textareaColor);

    // Check if it's dark theme (dark background = low RGB values)
    const isDark = colors.mainBackground.includes('15, 23, 42') || // #0f172a
                   colors.mainBackground.includes('30, 41, 59');    // #1e293b

    console.log('\n' + (isDark ? '✅ DARK THEME APPLIED' : '❌ STILL LIGHT THEME'));

    await page.screenshot({ path: '/tmp/tutor-dark-theme.png', fullPage: true });
    console.log('\n📸 Screenshot saved to /tmp/tutor-dark-theme.png');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
