const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('🔍 Testing Book Viewer...\n');

    // Go to course detail page
    await page.goto('http://localhost:5173/project/documents/platform/courses/class-10-mathematics', {
      waitUntil: 'networkidle',
      timeout: 10000
    });

    console.log('✅ Course page loaded');
    await page.waitForTimeout(2000);

    // Check for "Read Full Textbook" button
    const hasReadBookButton = await page.evaluate(() => {
      return document.body.innerText.includes('Read Full Textbook');
    });

    console.log('📖 "Read Full Textbook" button:', hasReadBookButton ? '✅ Found' : '❌ Not found');

    if (hasReadBookButton) {
      // Click the button
      await page.click('button:has-text("Read Full Textbook")');
      await page.waitForTimeout(3000);

      const bookViewerInfo = await page.evaluate(() => {
        return {
          url: window.location.href,
          hasSidebar: document.body.innerText.includes('Search chapters'),
          hasChaptersList: document.body.innerText.includes('Real Numbers') ||
                          document.body.innerText.includes('Polynomials'),
          hasTabs: document.body.innerText.includes('Examples') &&
                   document.body.innerText.includes('Exercises'),
          hasContent: document.body.innerText.includes('Chapter ')
        };
      });

      console.log('\n📚 Book Viewer:');
      console.log('   URL:', bookViewerInfo.url);
      console.log('   Sidebar with search:', bookViewerInfo.hasSidebar ? '✅' : '❌');
      console.log('   Chapters list:', bookViewerInfo.hasChaptersList ? '✅' : '❌');
      console.log('   Content tabs:', bookViewerInfo.hasTabs ? '✅' : '❌');
      console.log('   Chapter content:', bookViewerInfo.hasContent ? '✅' : '❌');

      await page.screenshot({ path: '/tmp/book-viewer.png', fullPage: true });
      console.log('\n📸 Screenshot saved to /tmp/book-viewer.png');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
