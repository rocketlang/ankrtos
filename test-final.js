const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Track navigation
  let lastNavigation = null;
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      lastNavigation = frame.url();
    }
  });

  try {
    console.log('🔍 Testing Class 10 Mathematics course...\n');

    await page.goto('http://localhost:5173/project/documents/platform/courses/class-10-mathematics', {
      waitUntil: 'networkidle',
      timeout: 10000
    });

    await page.waitForTimeout(2000);

    const pageInfo = await page.evaluate(() => {
      const learningModes = Array.from(document.querySelectorAll('[class*="from-purple-900"], [class*="from-green-900"], [class*="from-orange-900"]'))
        .filter(el => el.textContent.includes('Socratic') || el.textContent.includes('Fermi') || el.textContent.includes('MCQ'));

      return {
        courseTitle: document.querySelector('h1')?.textContent,
        hasLearningModes: document.body.innerText.includes('Learning Modes'),
        modesCount: learningModes.length,
        modes: learningModes.map(el => ({
          name: el.textContent.includes('Socratic') ? 'Socratic' :
                el.textContent.includes('Fermi') ? 'Fermi' :
                el.textContent.includes('MCQ') ? 'MCQ' : 'Unknown',
          text: el.textContent.substring(0, 50)
        }))
      };
    });

    console.log('📚 Course Page:');
    console.log('   Course:', pageInfo.courseTitle);
    console.log('   Learning Modes:', pageInfo.hasLearningModes ? '✅' : '❌');
    console.log('   Found', pageInfo.modesCount, 'mode cards');

    // Test Socratic click using JavaScript click
    console.log('\n🧪 Test 1: Socratic Dialogue');
    await page.evaluate(() => {
      const socratic = Array.from(document.querySelectorAll('[class*="from-purple"]'))
        .find(el => el.textContent.includes('Socratic'));
      if (socratic) socratic.click();
    });

    await page.waitForTimeout(2000);
    const url1 = page.url();
    console.log('   Result URL:', url1);
    console.log('   Has "tutor":', url1.includes('tutor') ? '✅' : '❌');
    console.log('   Has "socratic":', url1.includes('socratic') ? '✅' : '❌');

    // Go back
    await page.goBack();
    await page.waitForTimeout(1000);

    // Test Fermi click
    console.log('\n🧪 Test 2: Fermi Questions');
    await page.evaluate(() => {
      const fermi = Array.from(document.querySelectorAll('[class*="from-green"]'))
        .find(el => el.textContent.includes('Fermi'));
      if (fermi) fermi.click();
    });

    await page.waitForTimeout(2000);
    const url2 = page.url();
    console.log('   Result URL:', url2);
    console.log('   Has "assessment":', url2.includes('assessment') ? '✅' : '❌');
    console.log('   Has "fermi":', url2.includes('fermi') ? '✅' : '❌');

    // Go back
    await page.goBack();
    await page.waitForTimeout(1000);

    // Test MCQ click
    console.log('\n🧪 Test 3: MCQ Quizzes');
    const mcqInfo = await page.evaluate(() => {
      const mcq = Array.from(document.querySelectorAll('[class*="from-orange"]'))
        .find(el => el.textContent.includes('MCQ'));

      const isDisabled = mcq && mcq.className.includes('cursor-not-allowed');
      const quizText = mcq ? mcq.textContent : '';

      if (mcq && !isDisabled) mcq.click();

      return {
        found: !!mcq,
        disabled: isDisabled,
        text: quizText.substring(0, 100)
      };
    });

    console.log('   Card found:', mcqInfo.found ? '✅' : '❌');
    console.log('   Disabled:', mcqInfo.disabled ? 'Yes' : 'No');
    console.log('   Text:', mcqInfo.text);

    if (!mcqInfo.disabled) {
      await page.waitForTimeout(2000);
      const url3 = page.url();
      console.log('   Result URL:', url3);
      console.log('   Has "assessment":', url3.includes('assessment') ? '✅' : '❌');
    }

    console.log('\n✅ All tests completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
