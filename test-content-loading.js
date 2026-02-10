const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('🔍 Testing Chapter Content Loading...\n');

    // Navigate to book viewer
    await page.goto('http://localhost:5173/project/documents/platform/books/class-10-mathematics/ch1-real-numbers', {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    await page.waitForTimeout(2000);
    console.log('✅ Book viewer loaded');

    // Check Content tab
    const contentInfo = await page.evaluate(() => {
      const hasHeading = document.body.innerText.includes('Real Numbers');
      const hasMarkdownContent = document.body.innerText.includes('Introduction');
      const hasEuclidContent = document.body.innerText.includes('Euclid');
      const hasFundamentalTheorem = document.body.innerText.includes('Fundamental Theorem');
      const hasContentTab = document.body.innerText.includes('Content');

      return {
        hasHeading,
        hasMarkdownContent,
        hasEuclidContent,
        hasFundamentalTheorem,
        hasContentTab,
        bodyLength: document.body.innerText.length
      };
    });

    console.log('\n📄 Content Tab:');
    console.log('   Has chapter heading:', contentInfo.hasHeading ? '✅' : '❌');
    console.log('   Has markdown content:', contentInfo.hasMarkdownContent ? '✅' : '❌');
    console.log('   Has Euclid content:', contentInfo.hasEuclidContent ? '✅' : '❌');
    console.log('   Has Fundamental Theorem:', contentInfo.hasFundamentalTheorem ? '✅' : '❌');
    console.log('   Content tab exists:', contentInfo.hasContentTab ? '✅' : '❌');
    console.log('   Body text length:', contentInfo.bodyLength, 'chars');

    // Navigate to other chapters
    console.log('\n📚 Testing chapter navigation...');

    // Check sidebar for all 15 chapters
    const chaptersInfo = await page.evaluate(() => {
      const chapterLinks = Array.from(document.querySelectorAll('button')).filter(b =>
        b.textContent.match(/^\d+\./) && b.textContent.length > 5
      );
      return {
        chaptersInSidebar: chapterLinks.length,
        chapterTitles: chapterLinks.slice(0, 5).map(l => l.textContent.trim())
      };
    });

    console.log('   Chapters in sidebar:', chaptersInfo.chaptersInSidebar);
    console.log('   First 5 chapters:', chaptersInfo.chapterTitles);

    await page.screenshot({ path: '/tmp/book-viewer-content.png', fullPage: true });
    console.log('\n📸 Screenshot saved to /tmp/book-viewer-content.png');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
