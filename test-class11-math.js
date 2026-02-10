const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('🧪 Testing Class 11 Mathematics\n');

    // Test 1: Course page
    console.log('Test 1: Loading course page...');
    await page.goto('http://localhost:5173/project/documents/platform/courses/class-11-mathematics', {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    await page.waitForTimeout(2000);

    const courseInfo = await page.evaluate(() => {
      return {
        hasTitle: document.body.innerText.includes('Mathematics'),
        hasChapters: document.body.innerText.includes('SETS') || document.body.innerText.includes('chapter'),
        bodyLength: document.body.innerText.length
      };
    });

    console.log('   Course title present:', courseInfo.hasTitle ? '✅' : '❌');
    console.log('   Chapters visible:', courseInfo.hasChapters ? '✅' : '❌');
    console.log('   Page content length:', courseInfo.bodyLength, 'chars');

    // Test 2: Book viewer with SETS chapter
    console.log('\nTest 2: Loading SETS chapter in book viewer...');
    await page.goto('http://localhost:5173/project/documents/platform/books/class-11-mathematics/ch1-sets', {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    await page.waitForTimeout(2000);

    const chapterInfo = await page.evaluate(() => {
      return {
        hasChapterTitle: document.body.innerText.includes('SETS') || document.body.innerText.includes('Sets'),
        hasContent: document.body.innerText.length > 1000,
        hasExamples: document.body.innerText.includes('Example') || document.body.innerText.includes('💡'),
        hasSidebar: document.body.innerText.includes('chapters') || document.querySelectorAll('button').length > 10,
        contentLength: document.body.innerText.length
      };
    });

    console.log('   Chapter title:', chapterInfo.hasChapterTitle ? '✅' : '❌');
    console.log('   Has content:', chapterInfo.hasContent ? '✅' : '❌');
    console.log('   Has examples:', chapterInfo.hasExamples ? '✅' : '❌');
    console.log('   Has sidebar:', chapterInfo.hasSidebar ? '✅' : '❌');
    console.log('   Content length:', chapterInfo.contentLength, 'chars');

    // Test 3: Check examples tab
    console.log('\nTest 3: Checking Examples tab...');

    const examplesVisible = await page.evaluate(() => {
      // Click Examples tab if it exists
      const examplesTab = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent.includes('Examples') || b.textContent.includes('💡')
      );

      if (examplesTab) {
        examplesTab.click();
        return true;
      }
      return false;
    });

    if (examplesVisible) {
      await page.waitForTimeout(1000);

      const examplesContent = await page.evaluate(() => {
        return {
          hasExampleCards: document.body.innerText.includes('Example') && document.body.innerText.includes('Solution'),
          exampleCount: (document.body.innerText.match(/Example \d+/g) || []).length
        };
      });

      console.log('   Examples tab clicked: ✅');
      console.log('   Example cards visible:', examplesContent.hasExampleCards ? '✅' : '❌');
      console.log('   Example count:', examplesContent.exampleCount);
    } else {
      console.log('   Examples tab not found: ⚠️');
    }

    // Screenshot
    await page.screenshot({ path: '/tmp/class11-math-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved to /tmp/class11-math-test.png');

    console.log('\n✅ Class 11 Mathematics test complete');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
