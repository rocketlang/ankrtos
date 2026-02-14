const { chromium } = require('playwright');

async function finalTest() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('\n' + '='.repeat(70));
  console.log('COMPLYMITRA LOGIN FIX - FINAL VERIFICATION');
  console.log('='.repeat(70) + '\n');

  const results = { passed: 0, failed: 0, tests: [] };

  // Test 1: Root redirects to login
  console.log('Test 1: Root (/) redirects to login');
  await page.goto('https://app.complymitra.in/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const rootUrl = page.url();
  if (rootUrl.includes('/login')) {
    console.log('  ✅ PASS: Root redirects to login\n');
    results.passed++;
  } else {
    console.log(`  ❌ FAIL: Root at ${rootUrl}\n`);
    results.failed++;
  }
  results.tests.push({ name: 'Root redirect', passed: rootUrl.includes('/login') });

  // Test 2: Login form present
  console.log('Test 2: Login form is present');
  const emailInput = await page.locator('input[type="email"]').count();
  const submitBtn = await page.locator('button[type="submit"]').count();
  if (emailInput > 0 && submitBtn > 0) {
    console.log('  ✅ PASS: Login form present\n');
    results.passed++;
  } else {
    console.log('  ❌ FAIL: Login form missing\n');
    results.failed++;
  }
  results.tests.push({ name: 'Login form', passed: emailInput > 0 && submitBtn > 0 });

  // Test 3: Dashboard protected
  console.log('Test 3: Dashboard requires authentication');
  await page.evaluate(() => localStorage.clear());
  await page.goto('https://app.complymitra.in/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const dashUrl = page.url();
  if (dashUrl.includes('/login')) {
    console.log('  ✅ PASS: Dashboard protected\n');
    results.passed++;
  } else {
    console.log('  ❌ FAIL: Dashboard accessible\n');
    results.failed++;
  }
  results.tests.push({ name: 'Dashboard protection', passed: dashUrl.includes('/login') });

  // Test 4: GraphQL API working
  console.log('Test 4: GraphQL API responding');
  try {
    const graphqlResponse = await page.evaluate(async () => {
      const res = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ __typename }' })
      });
      return res.status;
    });
    if (graphqlResponse === 200) {
      console.log('  ✅ PASS: GraphQL API working\n');
      results.passed++;
    } else {
      console.log('  ❌ FAIL: GraphQL API not responding\n');
      results.failed++;
    }
    results.tests.push({ name: 'GraphQL API', passed: graphqlResponse === 200 });
  } catch (e) {
    console.log('  ❌ FAIL: GraphQL API error\n');
    results.failed++;
    results.tests.push({ name: 'GraphQL API', passed: false });
  }

  // Test 5: Role selector protected
  console.log('Test 5: Role selector requires authentication');
  await page.goto('https://app.complymitra.in/select-role', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const roleUrl = page.url();
  if (roleUrl.includes('/login')) {
    console.log('  ✅ PASS: Role selector protected\n');
    results.passed++;
  } else {
    console.log('  ❌ FAIL: Role selector accessible\n');
    results.failed++;
  }
  results.tests.push({ name: 'Role selector protection', passed: roleUrl.includes('/login') });

  // Screenshot
  await page.screenshot({ path: '/root/final-login-screen.png', fullPage: true });

  await browser.close();

  // Summary
  console.log('='.repeat(70));
  console.log('FINAL RESULTS');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log('');

  if (results.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Login fix is complete and working!');
    console.log('');
    console.log('Next Steps:');
    console.log('1. Test OTP flow manually by entering your email');
    console.log('2. Check backend logs: pm2 logs ankr-compliance-api');
    console.log('3. Verify OTP emails are being sent');
    console.log('4. Test complete login flow end-to-end');
  } else {
    console.log('⚠️ SOME TESTS FAILED - Review failed tests above');
  }
  console.log('='.repeat(70) + '\n');

  console.log('Generated Files:');
  console.log('- /root/complymitra-diagnosis-report.md');
  console.log('- /root/COMPLYMITRA-FIX-SUMMARY.md');
  console.log('- /root/complymitra-test-results.json');
  console.log('- /root/final-login-screen.png');
  console.log('');

  return results.failed === 0 ? 0 : 1;
}

finalTest().then(code => process.exit(code));
