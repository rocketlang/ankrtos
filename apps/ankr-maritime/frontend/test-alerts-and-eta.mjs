import { chromium } from 'playwright';

async function testAlertsAndETA() {
  console.log('🧪 Testing Vessel Alerts & ETA Predictions...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1400 }
  });
  const page = await context.newPage();

  // Monitor console and GraphQL requests
  const consoleLogs = [];
  const graphqlRequests = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error' || text.includes('Error')) {
      console.log(`❌ ${text}`);
    }
  });

  page.on('request', request => {
    if (request.url().includes('graphql')) {
      try {
        const postData = request.postData();
        if (postData) {
          const body = JSON.parse(postData);
          if (body.operationName) {
            graphqlRequests.push(body.operationName);
          }
        }
      } catch (e) {}
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('graphql')) {
      try {
        const json = await response.json();

        // Check for alerts queries
        if (json.data?.vesselAlerts) {
          console.log(`\n⚠️ Vessel Alerts Query:`);
          console.log(`   Status: ${response.status()}`);
          console.log(`   Alerts Found: ${json.data.vesselAlerts.length}`);
          if (json.data.vesselAlerts.length > 0) {
            const alert = json.data.vesselAlerts[0];
            console.log(`   Sample Alert:`);
            console.log(`     - Type: ${alert.type}`);
            console.log(`     - Severity: ${alert.severity}`);
            console.log(`     - Message: ${alert.message}`);
          }
        }

        if (json.data?.alertStats) {
          console.log(`\n📊 Alert Statistics:`);
          const stats = json.data.alertStats;
          console.log(`   Total: ${stats.total}`);
          console.log(`   Unread: ${stats.unread}`);
          console.log(`   Critical: ${stats.critical}`);
          console.log(`   Warning: ${stats.warning}`);
          console.log(`   Info: ${stats.info}`);
        }

        // Check for ETA queries
        if (json.data?.calculateETA) {
          console.log(`\n🎯 Calculate ETA Query:`);
          console.log(`   Status: ${response.status()}`);
          const eta = json.data.calculateETA;
          console.log(`   Vessel: ${eta.vesselName} (${eta.mmsi})`);
          console.log(`   ETA: ${new Date(eta.estimatedArrival).toLocaleString()}`);
          console.log(`   Distance: ${eta.distanceRemaining.toFixed(0)} nm`);
          console.log(`   Speed: ${eta.averageSpeed.toFixed(1)} kn`);
          console.log(`   Confidence: ${(eta.confidence * 100).toFixed(0)}%`);
          console.log(`   Method: ${eta.method}`);
        }

        if (json.data?.predictNextPort) {
          console.log(`\n🚢 Predict Next Port Query:`);
          console.log(`   Status: ${response.status()}`);
          const eta = json.data.predictNextPort;
          if (eta) {
            console.log(`   Vessel: ${eta.vesselName} (${eta.mmsi})`);
            console.log(`   Next Port: ${eta.destination.port || 'Unknown'}`);
            console.log(`   ETA: ${new Date(eta.estimatedArrival).toLocaleString()}`);
            console.log(`   Distance: ${eta.distanceRemaining.toFixed(0)} nm`);
            console.log(`   Confidence: ${(eta.confidence * 100).toFixed(0)}%`);
          } else {
            console.log(`   No prediction available`);
          }
        }

        if (json.errors) {
          console.log('❌ GraphQL Errors:');
          json.errors.forEach(err => console.log(`   - ${err.message}`));
        }
      } catch (e) {}
    }
  });

  try {
    // Login
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3008/login');
    await page.fill('input[type="email"]', 'admin@ankr.in');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('✅ Logged in\n');

    // Test 1: Vessel Alerts Page
    console.log('='.repeat(60));
    console.log('TEST 1: Vessel Alerts Page');
    console.log('='.repeat(60));
    await page.goto('http://localhost:3008/ais/alerts');
    await page.waitForTimeout(3000);

    const alertsHeading = await page.textContent('h1').catch(() => null);
    console.log(`\n📄 Page Heading: ${alertsHeading}`);

    await page.screenshot({
      path: '/root/apps/ankr-maritime/test-alerts-page.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: test-alerts-page.png\n');

    // Test 2: Vessel Journey Tracker with ETA
    console.log('='.repeat(60));
    console.log('TEST 2: Vessel Journey with ETA Prediction');
    console.log('='.repeat(60));
    await page.goto('http://localhost:3008/ais/vessel-journey');
    await page.waitForTimeout(2000);

    // Enter MMSI and search
    console.log('\n🔍 Searching for vessel 477995900...');
    await page.fill('input[placeholder*="477995900"]', '477995900');
    await page.click('button:has-text("Track Vessel")');
    await page.waitForTimeout(5000);

    // Check if ETA widget is visible
    const hasETA = await page.locator('text=ETA Prediction').count() > 0;
    console.log(`\n🎯 ETA Widget Present: ${hasETA ? '✅ Yes' : '❌ No'}`);

    await page.screenshot({
      path: '/root/apps/ankr-maritime/test-vessel-journey-eta.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: test-vessel-journey-eta.png\n');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`\n📡 GraphQL Queries Made:`);
    const uniqueQueries = [...new Set(graphqlRequests)];
    uniqueQueries.forEach(q => console.log(`   - ${q}`));

    console.log(`\n✅ Tests Complete!`);
    console.log(`\n📸 Screenshots:`);
    console.log(`   1. test-alerts-page.png`);
    console.log(`   2. test-vessel-journey-eta.png`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({
      path: '/root/apps/ankr-maritime/test-error.png',
      fullPage: true
    });
  } finally {
    await browser.close();
  }
}

testAlertsAndETA();
