import { chromium } from 'playwright';

async function debugVesselTracking() {
  console.log('🔍 Debugging Vessel Journey Tracker...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1400 }
  });
  const page = await context.newPage();

  // Collect console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error' || text.includes('Error') || text.includes('Failed')) {
      console.log(`❌ Console Error: ${text}`);
    }
  });

  // Collect network errors
  page.on('requestfailed', request => {
    console.log(`❌ Request Failed: ${request.url()}`);
    console.log(`   Failure: ${request.failure().errorText}`);
  });

  // Monitor GraphQL requests
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('graphql')) {
      console.log(`\n📡 GraphQL Request: ${response.status()}`);
      try {
        const json = await response.json();
        if (json.errors) {
          console.log('❌ GraphQL Errors:');
          json.errors.forEach(err => console.log(`   - ${err.message}`));
        }
        if (json.data) {
          const keys = Object.keys(json.data);
          console.log(`✅ GraphQL Data received: ${keys.join(', ')}`);
          // Show vessel data if present
          if (json.data.vesselStatus) {
            console.log(`   Status: ${json.data.vesselStatus.status}`);
            console.log(`   Source: ${json.data.vesselStatus.source}`);
            console.log(`   Quality: ${json.data.vesselStatus.quality}`);
          }
          if (json.data.vesselJourney) {
            const journey = json.data.vesselJourney;
            console.log(`   Vessel: ${journey.vesselName || journey.vesselMmsi}`);
            console.log(`   Segments: ${journey.segments?.length || 0}`);
            console.log(`   Port Visits: ${journey.portVisits?.length || 0}`);
          }
        }
      } catch (e) {
        // Not JSON or already consumed
      }
    }
  });

  try {
    // Login
    console.log('📍 Logging in...');
    await page.goto('http://localhost:3008/login');
    await page.fill('input[type="email"]', 'admin@ankr.in');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Navigate to vessel journey
    console.log('\n📍 Opening Vessel Journey Tracker...');
    await page.goto('http://localhost:3008/ais/vessel-journey');
    await page.waitForTimeout(2000);

    // Fill form and submit
    console.log('\n📍 Submitting tracking request...');
    const mmsiInput = await page.$('input[placeholder*="477995900" i], input[type="text"]:not([placeholder*="Search"])');
    if (mmsiInput) {
      await mmsiInput.fill('477995900');
      const trackButton = await page.$('button:has-text("Track Vessel")');
      if (trackButton) {
        await trackButton.click();
        console.log('✅ Form submitted, waiting for response...\n');

        // Wait longer for response
        await page.waitForTimeout(25000);

        // Check console logs
        console.log('\n📋 Console Logs:');
        console.log('═'.repeat(60));
        consoleLogs.slice(-20).forEach(log => console.log(log));
        console.log('═'.repeat(60));

        // Take final screenshot
        await page.screenshot({
          path: '/root/apps/ankr-maritime/debug-final.png',
          fullPage: true
        });
        console.log('\n📸 Final screenshot: debug-final.png');
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

debugVesselTracking();
