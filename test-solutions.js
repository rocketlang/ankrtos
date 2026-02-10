const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('🔍 Testing Exercise Solutions...\n');

    // Go directly to book viewer
    await page.goto('http://localhost:5173/project/documents/platform/books/class-10-mathematics/ch1-real-numbers', {
      waitUntil: 'networkidle',
      timeout: 10000
    });

    await page.waitForTimeout(2000);
    console.log('✅ Book viewer loaded');

    // Click Exercises tab
    const exercisesTab = await page.$('button:has-text("Exercises")');
    if (exercisesTab) {
      await exercisesTab.click();
      console.log('✅ Clicked Exercises tab');
      await page.waitForTimeout(1000);

      // Check for exercises
      const exercisesInfo = await page.evaluate(() => {
        const exerciseDivs = Array.from(document.querySelectorAll('div')).filter(d =>
          d.textContent.includes('Exercise ') && d.textContent.includes('.')
        );

        const showSolutionButtons = Array.from(document.querySelectorAll('button')).filter(b =>
          b.textContent.includes('Show Solution')
        );

        return {
          exerciseCount: exerciseDivs.length,
          solutionButtonCount: showSolutionButtons.length,
          hasHints: document.body.innerText.includes('Show Hints'),
          hasExerciseText: document.body.innerText.includes('Exercise 1.1')
        };
      });

      console.log('\n📝 Exercises:');
      console.log('   Found exercises:', exercisesInfo.exerciseCount);
      console.log('   "Show Solution" buttons:', exercisesInfo.solutionButtonCount);
      console.log('   Has hints:', exercisesInfo.hasHints ? '✅' : '❌');
      console.log('   Exercise 1.1:', exercisesInfo.hasExerciseText ? '✅' : '❌');

      if (exercisesInfo.solutionButtonCount > 0) {
        // Click first "Show Solution" button
        await page.click('button:has-text("Show Solution")');
        await page.waitForTimeout(1000);

        const solutionShown = await page.evaluate(() => {
          return document.body.innerText.includes('Solution:') ||
                 document.body.innerText.includes('HCF');
        });

        console.log('   Solution revealed:', solutionShown ? '✅' : '❌');
      }

      await page.screenshot({ path: '/tmp/exercises-solutions.png', fullPage: true });
      console.log('\n📸 Screenshot saved to /tmp/exercises-solutions.png');

    } else {
      console.log('❌ Exercises tab not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
