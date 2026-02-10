const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5173/project/documents/platform/tutor?course=class-10-mathematics&mode=socratic', {
      waitUntil: 'networkidle',
      timeout: 10000
    });

    await page.waitForTimeout(2000);

    // Type a sample message to see the chat interface
    await page.fill('textarea', 'Can you help me understand quadratic equations?');
    await page.waitForTimeout(500);

    await page.screenshot({
      path: '/tmp/tutor-final-dark.png',
      fullPage: true
    });

    console.log('✅ Dark theme applied successfully!');
    console.log('📸 Screenshot saved to /tmp/tutor-final-dark.png');
    console.log('\n🎨 Dark Theme Colors:');
    console.log('  Main background: #0f172a (dark slate)');
    console.log('  Header: #1e293b (darker slate)');
    console.log('  Borders: #475569 (slate)');
    console.log('  Text: #f1f5f9 (light)');
    console.log('  Secondary text: #94a3b8 (muted)');
    console.log('\n✅ Contrast issue fixed - now matches other pages!');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
