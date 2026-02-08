import { chromium } from 'playwright';

async function viewVesselJourney() {
  console.log('🌐 Opening Vessel Journey Tracker...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1200 }
  });
  const page = await context.newPage();

  try {
    // Navigate to login page
    console.log('📍 Step 1: Logging in...');
    await page.goto('http://localhost:3008/login', {
      waitUntil: 'networkidle',
      timeout: 10000
    });

    // Fill login form
    await page.fill('input[type="email"]', 'admin@ankr.in');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForURL('**/', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000);

    console.log('✅ Logged in successfully');

    // Navigate to vessel journey page
    console.log('\n📍 Step 2: Navigating to Vessel Journey Tracker...');
    await page.goto('http://localhost:3008/ais/vessel-journey', {
      waitUntil: 'networkidle',
      timeout: 10000
    });

    // Wait for page to render
    await page.waitForTimeout(3000);

    // Take screenshot
    const screenshotPath = '/root/apps/ankr-maritime/vessel-journey-logged-in.png';
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    console.log(`\n📸 Screenshot saved: ${screenshotPath}`);

    // Get page info
    const title = await page.title();
    console.log(`\n📄 Page Title: ${title}`);

    // Check for the main heading
    const heading = await page.$$eval('h1, h2', els => els.map(el => el.textContent)).catch(() => []);
    console.log(`\n📋 Headings Found:`);
    heading.forEach((h, i) => console.log(`   ${i + 1}. ${h}`));

    // Check for search form
    const inputs = await page.$$eval('input', els => els.map(el => ({
      type: el.type,
      placeholder: el.placeholder,
      value: el.value
    }))).catch(() => []);

    console.log(`\n🔍 Form Inputs Found:`);
    inputs.forEach((input, i) => {
      if (input.placeholder || input.type === 'text') {
        console.log(`   ${i + 1}. Type: ${input.type}, Placeholder: "${input.placeholder}"`);
      }
    });

    // Get visible text content
    const bodyText = await page.$eval('body', el => el.innerText).catch(() => '');
    const preview = bodyText.substring(0, 800);
    console.log(`\n📝 Page Content Preview:`);
    console.log('═'.repeat(60));
    console.log(preview);
    console.log('═'.repeat(60));

    // Check for map
    const hasMap = await page.$('.leaflet-container, #map, [class*="map"]');
    console.log(`\n🗺️  Map Container: ${hasMap ? '✅ Found' : '❌ Not found'}`);

    console.log('\n✅ Page loaded and screenshot captured!');
    console.log(`\n🎯 View screenshot: /root/apps/ankr-maritime/vessel-journey-logged-in.png`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);

    // Take error screenshot
    try {
      await page.screenshot({
        path: '/root/apps/ankr-maritime/vessel-journey-error.png',
        fullPage: true
      });
      console.log('📸 Error screenshot saved: /root/apps/ankr-maritime/vessel-journey-error.png');
    } catch (e) {}
  } finally {
    await browser.close();
  }
}

viewVesselJourney();
