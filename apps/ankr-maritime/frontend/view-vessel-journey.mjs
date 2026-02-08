import { chromium } from 'playwright';

async function viewVesselJourney() {
  console.log('🌐 Opening Vessel Journey Tracker...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Navigate to the vessel journey page
    console.log('📍 Navigating to: http://localhost:3008/ais/vessel-journey');
    await page.goto('http://localhost:3008/ais/vessel-journey', {
      waitUntil: 'networkidle',
      timeout: 10000
    });

    // Wait a bit for React to render
    await page.waitForTimeout(2000);

    // Take screenshot
    const screenshotPath = '/root/apps/ankr-maritime/vessel-journey-page.png';
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    console.log(`\n📸 Screenshot saved: ${screenshotPath}`);

    // Get page title and content
    const title = await page.title();
    console.log(`\n📄 Page Title: ${title}`);

    // Check if the search form is present
    const hasSearchForm = await page.$('input[placeholder*="MMSI" i], input[type="text"]');
    console.log(`\n🔍 Search Form: ${hasSearchForm ? '✅ Found' : '❌ Not found'}`);

    // Check for main heading
    const heading = await page.$eval('h1', el => el.textContent).catch(() => null);
    if (heading) {
      console.log(`\n📋 Main Heading: "${heading}"`);
    }

    // Get all visible text content (first 500 chars)
    const bodyText = await page.$eval('body', el => el.innerText.substring(0, 500)).catch(() => '');
    console.log(`\n📝 Page Content Preview:`);
    console.log('─'.repeat(60));
    console.log(bodyText);
    console.log('─'.repeat(60));

    console.log('\n✅ Page loaded successfully!');
    console.log(`\n🎯 To view the screenshot, open: ${screenshotPath}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

viewVesselJourney();
