const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('🔍 Testing Examples and Exercises in Course Detail...\n');

    // Go to Class 10 Mathematics
    await page.goto('http://localhost:5173/project/documents/platform/courses/class-10-mathematics', {
      waitUntil: 'networkidle',
      timeout: 10000
    });

    await page.waitForTimeout(2000);

    console.log('📚 Course page loaded');

    // Find and click first module to expand it
    console.log('\n🧪 Expanding first module...');
    const firstModuleButton = await page.$('button:has(div:text("📖"))');

    if (firstModuleButton) {
      await firstModuleButton.click();
      await page.waitForTimeout(2000);

      // Check for tabs
      const tabs = await page.evaluate(() => {
        const tabButtons = Array.from(document.querySelectorAll('button'))
          .filter(btn => btn.textContent.includes('Examples') || btn.textContent.includes('Exercises') || btn.textContent.includes('Lessons'));
        return tabButtons.map(btn => btn.textContent.trim());
      });

      console.log('   Found tabs:', tabs);

      // Click Examples tab
      console.log('\n📚 Testing Examples tab...');
      await page.evaluate(() => {
        const examplesBtn = Array.from(document.querySelectorAll('button'))
          .find(btn => btn.textContent.includes('Examples'));
        if (examplesBtn) examplesBtn.click();
      });

      await page.waitForTimeout(1000);

      const examplesInfo = await page.evaluate(() => {
        const exampleDivs = Array.from(document.querySelectorAll('[class*="border-l-4"][class*="border-blue"]'));
        return {
          count: exampleDivs.length,
          firstTitle: exampleDivs[0]?.textContent.includes('Example') ?
            exampleDivs[0].querySelector('h4')?.textContent : null
        };
      });

      console.log('   Examples found:', examplesInfo.count);
      if (examplesInfo.firstTitle) {
        console.log('   First example:', examplesInfo.firstTitle);
      }

      // Click Exercises tab
      console.log('\n✏️  Testing Exercises tab...');
      await page.evaluate(() => {
        const exercisesBtn = Array.from(document.querySelectorAll('button'))
          .find(btn => btn.textContent.includes('Exercises'));
        if (exercisesBtn) exercisesBtn.click();
      });

      await page.waitForTimeout(1000);

      const exercisesInfo = await page.evaluate(() => {
        const exerciseDivs = Array.from(document.querySelectorAll('[class*="border-l-4"][class*="border-green"]'));
        return {
          count: exerciseDivs.length,
          firstTitle: exerciseDivs[0]?.textContent.includes('Exercise') ?
            exerciseDivs[0].querySelector('h4')?.textContent : null,
          hasHints: exerciseDivs[0]?.textContent.includes('Show Hints'),
          hasTryButton: exerciseDivs[0]?.textContent.includes('Try This Exercise')
        };
      });

      console.log('   Exercises found:', exercisesInfo.count);
      if (exercisesInfo.firstTitle) {
        console.log('   First exercise:', exercisesInfo.firstTitle);
      }
      console.log('   Has hints:', exercisesInfo.hasHints ? '✅' : '❌');
      console.log('   Has try button:', exercisesInfo.hasTryButton ? '✅' : '❌');

      // Take screenshot
      await page.screenshot({ path: '/tmp/examples-exercises.png', fullPage: true });
      console.log('\n📸 Screenshot saved to /tmp/examples-exercises.png');

      console.log('\n✅ Test completed successfully!');
    } else {
      console.log('❌ Could not find module button');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
