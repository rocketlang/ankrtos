const { chromium } = require('playwright');

async function testDashboardProtection() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('\n🔒 Testing Dashboard Protection...\n');

  try {
    // Clear localStorage to ensure no auth token
    await page.goto('https://app.complymitra.in/login');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log('Step 1: Cleared all storage');

    // Try to access dashboard
    await page.goto('https://app.complymitra.in/dashboard', {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Wait for any redirects
    await page.waitForTimeout(3000);

    const finalUrl = page.url();
    console.log('Step 2: Navigated to /dashboard');
    console.log('Final URL:', finalUrl);

    if (finalUrl.includes('/login')) {
      console.log('✅ SUCCESS: Dashboard is protected - redirected to login');
    } else if (finalUrl.includes('/select-role')) {
      console.log('⚠️  PARTIAL: Redirected to role selector (needs auth check there too)');
    } else if (finalUrl.includes('/dashboard')) {
      console.log('❌ FAIL: Dashboard accessible without authentication!');
    } else {
      console.log('❓ UNKNOWN: Redirected to unexpected page:', finalUrl);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

testDashboardProtection();
