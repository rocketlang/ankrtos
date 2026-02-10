const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5173/project/documents/platform/courses/class-10-mathematics', {
      waitUntil: 'networkidle',
      timeout: 10000
    });

    await page.waitForTimeout(2000);

    // Get the actual HTML structure
    const structure = await page.evaluate(() => {
      return {
        h1Text: document.querySelector('h1')?.textContent,
        h2Texts: Array.from(document.querySelectorAll('h2')).map(h => h.textContent),
        learningModeCards: Array.from(document.querySelectorAll('[class*="gradient"]')).slice(0, 5).map(card => ({
          text: card.textContent.substring(0, 100),
          className: card.className,
          hasClick: card.onclick !== null
        })),
        url: window.location.href
      };
    });

    console.log('📊 Page Structure:');
    console.log('URL:', structure.url);
    console.log('H1:', structure.h1Text);
    console.log('H2 headings:', structure.h2Texts);
    console.log('\n🎴 Learning Mode Cards:');
    structure.learningModeCards.forEach((card, i) => {
      console.log(`\nCard ${i + 1}:`);
      console.log('  Text:', card.text);
      console.log('  Has onclick:', card.hasClick);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
