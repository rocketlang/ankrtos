const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });

  // Listen for page errors
  page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message);
  });

  try {
    console.log('🔍 Navigating to courses page...');
    await page.goto('http://localhost:5173/project/documents/platform/courses', {
      waitUntil: 'networkidle',
      timeout: 10000
    });

    console.log('✅ Courses page loaded');

    // Wait for courses to load
    await page.waitForSelector('.grid', { timeout: 5000 });

    // Get all course cards
    const courses = await page.$$eval('[class*="bg-gray-900"][class*="border-2"]', cards =>
      cards.slice(0, 3).map(card => ({
        title: card.querySelector('h3')?.textContent || 'Unknown',
        hasButton: !!card.querySelector('button')
      }))
    );

    console.log(`\n📚 Found ${courses.length} courses to test:\n`);
    courses.forEach((c, i) => console.log(`   ${i+1}. ${c.title}`));

    // Test first course
    console.log('\n🧪 Testing first course click...');
    const firstCourse = await page.$('[class*="bg-gray-900"][class*="border-2"]');

    if (firstCourse) {
      // Get the course title and ID before clicking
      const courseInfo = await firstCourse.evaluate(card => ({
        title: card.querySelector('h3')?.textContent || 'Unknown',
        hasOnClick: card.onclick !== null,
        className: card.className
      }));
      console.log(`   Course:`, courseInfo);

      // Listen for navigation
      const navigationPromise = page.waitForNavigation({ timeout: 5000 }).catch(() => null);

      await firstCourse.click();
      await navigationPromise;

      // Wait a bit for navigation
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      console.log(`   Current URL: ${currentUrl}`);

      // Check what's on the page
      const pageContent = await page.evaluate(() => {
        return {
          hasLoadingSpinner: !!document.querySelector('[class*="animate-spin"]'),
          hasDashboardHeading: document.body.innerText.includes('Dashboard'),
          hasCourseDetail: document.body.innerText.includes('Back to Courses'),
          hasLearningModes: document.body.innerText.includes('Learning Modes'),
          hasModules: document.body.innerText.includes('Modules'),
          pageText: document.body.innerText.substring(0, 500)
        };
      });

      console.log('\n📄 Page content:');
      console.log('   - Loading spinner:', pageContent.hasLoadingSpinner);
      console.log('   - Dashboard page:', pageContent.hasDashboardHeading);
      console.log('   - Course detail:', pageContent.hasCourseDetail);
      console.log('   - Learning modes:', pageContent.hasLearningModes);
      console.log('   - Modules section:', pageContent.hasModules);
      console.log('\n   Page text preview:\n   ', pageContent.pageText.replace(/\n/g, '\n    '));

      // Take a screenshot
      await page.screenshot({ path: '/tmp/course-detail-test.png', fullPage: true });
      console.log('\n📸 Screenshot saved to /tmp/course-detail-test.png');

    } else {
      console.log('❌ No course card found!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: '/tmp/test-error.png', fullPage: true });
    console.log('📸 Error screenshot saved to /tmp/test-error.png');
  } finally {
    await browser.close();
  }
})();
