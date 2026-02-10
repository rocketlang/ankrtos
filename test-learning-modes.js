const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });

  try {
    console.log('🔍 Testing course detail and learning modes...\n');

    // Go directly to a course detail page
    await page.goto('http://localhost:5173/project/documents/platform/courses/class-10-mathematics', {
      waitUntil: 'networkidle',
      timeout: 10000
    });

    await page.waitForTimeout(2000);

    // Check page content
    const courseDetail = await page.evaluate(() => {
      return {
        title: document.querySelector('h1')?.textContent || 'No title',
        hasBackButton: document.body.innerText.includes('Back to Courses'),
        hasLearningModes: document.body.innerText.includes('Learning Modes'),
        hasSocratic: document.body.innerText.includes('Socratic Dialogue'),
        hasFermi: document.body.innerText.includes('Fermi Questions'),
        hasMCQ: document.body.innerText.includes('MCQ Quizzes'),
        hasModules: document.body.innerText.includes('Module') || document.body.innerText.includes('Chapter'),
      };
    });

    console.log('📚 Course Detail Page:');
    console.log('   Title:', courseDetail.title);
    console.log('   Back button:', courseDetail.hasBackButton ? '✅' : '❌');
    console.log('   Learning Modes section:', courseDetail.hasLearningModes ? '✅' : '❌');
    console.log('   - Socratic:', courseDetail.hasSocratic ? '✅' : '❌');
    console.log('   - Fermi:', courseDetail.hasFermi ? '✅' : '❌');
    console.log('   - MCQ:', courseDetail.hasMCQ ? '✅' : '❌');
    console.log('   Modules/Chapters:', courseDetail.hasModules ? '✅' : '❌');

    // Test Socratic mode click
    console.log('\n🧪 Testing Socratic Dialogue click...');
    const socraticCard = await page.$('div:has-text("Socratic Dialogue")');
    if (socraticCard) {
      await socraticCard.click();
      await page.waitForTimeout(2000);
      const socraticUrl = page.url();
      console.log('   URL after click:', socraticUrl);
      console.log('   Contains "tutor":', socraticUrl.includes('tutor') ? '✅' : '❌');

      // Go back
      await page.goBack();
      await page.waitForTimeout(1000);
    }

    // Test Fermi mode click
    console.log('\n🧪 Testing Fermi Questions click...');
    const fermiCard = await page.$('div:has-text("Fermi Questions")');
    if (fermiCard) {
      await fermiCard.click();
      await page.waitForTimeout(2000);
      const fermiUrl = page.url();
      console.log('   URL after click:', fermiUrl);
      console.log('   Contains "assessment":', fermiUrl.includes('assessment') ? '✅' : '❌');
      console.log('   Contains "fermi":', fermiUrl.includes('fermi') ? '✅' : '❌');

      // Go back
      await page.goBack();
      await page.waitForTimeout(1000);
    }

    // Test MCQ click
    console.log('\n🧪 Testing MCQ Quizzes click...');
    const mcqCard = await page.$('div:has-text("MCQ Quizzes")');
    if (mcqCard) {
      const isDisabled = await mcqCard.evaluate(el =>
        el.className.includes('cursor-not-allowed')
      );
      console.log('   MCQ card disabled:', isDisabled ? 'Yes (no quizzes)' : 'No');

      if (!isDisabled) {
        await mcqCard.click();
        await page.waitForTimeout(2000);
        const mcqUrl = page.url();
        console.log('   URL after click:', mcqUrl);
        console.log('   Contains "assessment":', mcqUrl.includes('assessment') ? '✅' : '❌');
      }
    }

    // Test module expansion
    console.log('\n🧪 Testing module expansion...');
    const moduleButtons = await page.$$('button:has(div:text("📖"))');
    console.log(`   Found ${moduleButtons.length} modules/chapters`);

    if (moduleButtons.length > 0) {
      const firstModule = moduleButtons[0];
      await firstModule.click();
      await page.waitForTimeout(1000);

      const hasLessons = await page.evaluate(() => {
        return document.body.innerText.includes('Watch Now') ||
               document.body.innerText.includes('Rewatch');
      });
      console.log('   Module expanded with lessons:', hasLessons ? '✅' : '❌');
    }

    await page.screenshot({ path: '/tmp/course-detail-full.png', fullPage: true });
    console.log('\n📸 Screenshot saved to /tmp/course-detail-full.png');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: '/tmp/test-error-modes.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
