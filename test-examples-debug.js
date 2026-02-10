const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('Browser:', msg.text()));

  try {
    await page.goto('http://localhost:5173/project/documents/platform/courses/class-10-mathematics', {
      waitUntil: 'networkidle',
      timeout: 10000
    });

    console.log('1. Page loaded');
    await page.waitForTimeout(2000);

    // Find module button
    const moduleButton = await page.$('button:has(h3:text("Real Numbers"))');
    console.log('2. Module button found:', !!moduleButton);

    if (moduleButton) {
      await moduleButton.click();
      console.log('3. Clicked module button');
      await page.waitForTimeout(3000); // Wait longer for API calls

      // Check what's in the expanded section
      const content = await page.evaluate(() => {
        const body = document.body.innerText;
        return {
          hasExamplesWord: body.includes('Examples'),
          hasExercisesWord: body.includes('Exercises'),
          hasLessonsWord: body.includes('Lessons'),
          allButtons: Array.from(document.querySelectorAll('button')).map(b => b.textContent.substring(0, 50)),
        };
      });

      console.log('4. Content check:', content);
      console.log('5. All buttons:', content.allButtons.filter(t => t.includes('Example') || t.includes('Exercise') || t.includes('Lesson')));
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
