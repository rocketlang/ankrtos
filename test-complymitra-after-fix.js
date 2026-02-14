/**
 * Post-Fix Verification Test for ComplyMitra
 * Tests that login page is now showing
 */

const { chromium } = require('playwright');

async function verifyFix() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('\n🔍 Testing ComplyMitra Fix...\n');

  try {
    // Test 1: App should redirect to /login
    console.log('Test 1: Checking redirect to login...');
    await page.goto('https://app.complymitra.in', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`  Current URL: ${currentUrl}`);

    if (currentUrl.includes('/login')) {
      console.log('  ✅ PASS: Redirected to login page');
    } else {
      console.log('  ❌ FAIL: Did not redirect to login (at: ' + currentUrl + ')');
    }

    // Test 2: Check for login form elements
    console.log('\nTest 2: Checking for login form...');
    const loginElements = {
      emailInput: await page.locator('input[type="email"]').count(),
      submitButton: await page.locator('button[type="submit"]').count(),
      loginHeading: await page.locator('text=/sign in/i').count(),
    };

    console.log('  Email inputs:', loginElements.emailInput);
    console.log('  Submit buttons:', loginElements.submitButton);
    console.log('  Login heading:', loginElements.loginHeading);

    if (loginElements.emailInput > 0 && loginElements.submitButton > 0) {
      console.log('  ✅ PASS: Login form is present');
    } else {
      console.log('  ❌ FAIL: Login form is missing');
    }

    // Test 3: Check page content
    console.log('\nTest 3: Checking page content...');
    const bodyText = await page.locator('body').textContent();
    const hasLoginText = bodyText.toLowerCase().includes('sign in');
    const hasOtpText = bodyText.toLowerCase().includes('one-time password') || bodyText.toLowerCase().includes('otp');

    console.log('  Has "sign in":', hasLoginText);
    console.log('  Has OTP text:', hasOtpText);

    if (hasLoginText) {
      console.log('  ✅ PASS: Login content detected');
    } else {
      console.log('  ❌ FAIL: Login content missing');
    }

    // Test 4: Screenshot
    console.log('\nTest 4: Taking screenshot...');
    await page.screenshot({
      path: '/root/complymitra-after-fix.png',
      fullPage: true
    });
    console.log('  ✅ Screenshot saved: /root/complymitra-after-fix.png');

    // Test 5: Try to access dashboard without auth
    console.log('\nTest 5: Checking auth protection on /dashboard...');
    await page.goto('https://app.complymitra.in/dashboard', {
      waitUntil: 'networkidle',
      timeout: 10000
    });
    await page.waitForTimeout(2000);

    const dashboardUrl = page.url();
    if (dashboardUrl.includes('/login')) {
      console.log('  ✅ PASS: Dashboard redirected to login (auth protected)');
    } else if (dashboardUrl.includes('/dashboard')) {
      console.log('  ❌ FAIL: Dashboard accessible without auth!');
    } else {
      console.log(`  ⚠️  WARN: Unexpected redirect to ${dashboardUrl}`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION SUMMARY');
    console.log('='.repeat(60));

    const allPassed =
      currentUrl.includes('/login') &&
      loginElements.emailInput > 0 &&
      loginElements.submitButton > 0 &&
      hasLoginText;

    if (allPassed) {
      console.log('✅ ALL TESTS PASSED - Fix is working!');
      console.log('\nNext steps:');
      console.log('1. Test OTP flow manually');
      console.log('2. Verify email delivery');
      console.log('3. Check backend logs for OTP generation');
    } else {
      console.log('❌ SOME TESTS FAILED - Need to investigate');
      console.log('\nCheck:');
      console.log('- Browser cache cleared?');
      console.log('- Build deployed correctly?');
      console.log('- Nginx config correct?');
    }

    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

verifyFix()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
