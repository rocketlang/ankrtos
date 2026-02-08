import { chromium } from 'playwright';

async function testVesselTracking() {
  console.log('🚢 Testing Vessel Journey Tracker...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1400 }
  });
  const page = await context.newPage();

  try {
    // Login
    console.log('📍 Step 1: Logging in...');
    await page.goto('http://localhost:3008/login');
    await page.fill('input[type="email"]', 'admin@ankr.in');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('✅ Logged in');

    // Navigate to vessel journey
    console.log('\n📍 Step 2: Opening Vessel Journey Tracker...');
    await page.goto('http://localhost:3008/ais/vessel-journey');
    await page.waitForTimeout(2000);
    console.log('✅ Page loaded');

    // Take screenshot of initial state
    await page.screenshot({
      path: '/root/apps/ankr-maritime/step1-initial-page.png',
      fullPage: true
    });
    console.log('📸 Screenshot 1: Initial page saved');

    // Fill in the form
    console.log('\n📍 Step 3: Entering vessel MMSI...');
    const mmsiInput = await page.$('input[placeholder*="477995900" i], input[type="text"]:not([placeholder*="Search"])');
    if (mmsiInput) {
      await mmsiInput.fill('477995900');
      console.log('✅ Entered MMSI: 477995900');

      // Select 30 days
      const daysSelect = await page.$('select');
      if (daysSelect) {
        await daysSelect.selectOption('30');
        console.log('✅ Selected: Last 30 days');
      }

      // Take screenshot before clicking
      await page.screenshot({
        path: '/root/apps/ankr-maritime/step2-form-filled.png',
        fullPage: true
      });
      console.log('📸 Screenshot 2: Form filled');

      // Click track vessel button
      console.log('\n📍 Step 4: Clicking "Track Vessel"...');
      const trackButton = await page.$('button:has-text("Track Vessel")');
      if (trackButton) {
        await trackButton.click();
        console.log('✅ Clicked Track Vessel button');

        // Wait for GraphQL query to complete (this might take time)
        console.log('\n⏳ Waiting for vessel data to load...');
        console.log('   (This may take 10-20 seconds due to GFW API calls)');

        // Wait for either loading state or data to appear
        await page.waitForTimeout(15000);

        // Take screenshot of results
        await page.screenshot({
          path: '/root/apps/ankr-maritime/step3-tracking-results.png',
          fullPage: true
        });
        console.log('📸 Screenshot 3: Tracking results');

        // Check what appeared
        const statusCard = await page.$('text=/Current Status/i');
        const mapContainer = await page.$('.leaflet-container');
        const statsCards = await page.$$('text=/Port Stops|AIS Gaps|Duration|Segments/i');

        console.log('\n📊 Results Found:');
        console.log(`   Status Card: ${statusCard ? '✅' : '❌'}`);
        console.log(`   Map: ${mapContainer ? '✅' : '❌'}`);
        console.log(`   Statistics: ${statsCards.length > 0 ? '✅ (' + statsCards.length + ' cards)' : '❌'}`);

        // Get any visible text that looks like results
        const bodyText = await page.$eval('body', el => el.innerText).catch(() => '');

        // Look for status indicators
        if (bodyText.includes('LIVE_AIS') || bodyText.includes('AT_PORT') || bodyText.includes('IN_TRANSIT')) {
          console.log('\n✅ Vessel tracking data loaded!');

          if (bodyText.includes('LIVE_AIS')) console.log('   📡 Status: LIVE_AIS detected');
          if (bodyText.includes('AT_PORT')) console.log('   ⚓ Status: AT_PORT detected');
          if (bodyText.includes('IN_TRANSIT')) console.log('   🌊 Status: IN_TRANSIT detected');
        }

        // Check for loading or error messages
        if (bodyText.includes('Loading') || bodyText.includes('loading')) {
          console.log('\n⏳ Still loading...');
        }
        if (bodyText.includes('Error') || bodyText.includes('error')) {
          console.log('\n⚠️  Error detected in response');
        }

        // Show a preview of the results
        const relevantText = bodyText.split('\n')
          .filter(line =>
            line.includes('Status') ||
            line.includes('Port') ||
            line.includes('Quality') ||
            line.includes('Position') ||
            line.includes('MMSI') ||
            line.includes('Journey') ||
            line.includes('Vessel')
          )
          .slice(0, 20)
          .join('\n');

        if (relevantText) {
          console.log('\n📋 Results Preview:');
          console.log('═'.repeat(60));
          console.log(relevantText);
          console.log('═'.repeat(60));
        }

      } else {
        console.log('❌ Track Vessel button not found');
      }

    } else {
      console.log('❌ MMSI input not found');
    }

    console.log('\n✅ TEST COMPLETE!');
    console.log('\n📸 Screenshots saved:');
    console.log('   1. step1-initial-page.png - Initial tracker page');
    console.log('   2. step2-form-filled.png - Form filled with MMSI');
    console.log('   3. step3-tracking-results.png - Tracking results');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({
      path: '/root/apps/ankr-maritime/error-screenshot.png',
      fullPage: true
    });
  } finally {
    await browser.close();
  }
}

testVesselTracking();
