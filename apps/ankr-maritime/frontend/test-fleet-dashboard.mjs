import { chromium } from 'playwright';

async function testFleetDashboard() {
  console.log('📊 Testing Fleet Dashboard...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1400 }
  });
  const page = await context.newPage();

  // Monitor console and network
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error' || text.includes('Error')) {
      console.log(`❌ ${text}`);
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('graphql') && url.includes('fleetDashboard')) {
      console.log(`\n📡 Fleet Dashboard Query: ${response.status()}`);
      try {
        const json = await response.json();
        if (json.data?.fleetDashboard) {
          const stats = json.data.fleetDashboard.stats;
          const vessels = json.data.fleetDashboard.vessels;
          console.log(`\n📊 Fleet Statistics:`);
          console.log(`   Total Vessels: ${stats.totalVessels}`);
          console.log(`   Live Tracking: ${stats.liveTracking} (${stats.coveragePercentage.toFixed(1)}%)`);
          console.log(`   At Port: ${stats.atPort}`);
          console.log(`   In Transit: ${stats.inTransit}`);
          console.log(`   Unknown: ${stats.unknown}`);
          console.log(`   Avg Quality: ${(stats.averageQuality * 100).toFixed(1)}%`);
          console.log(`   Needs Attention: ${stats.vesselsNeedingAttention}`);
          console.log(`\n📋 Vessels Loaded: ${vessels.length}`);
          if (vessels.length > 0) {
            console.log(`\n📝 Sample Vessels:`);
            vessels.slice(0, 5).forEach((v, i) => {
              console.log(`   ${i + 1}. ${v.name || 'Unknown'} (${v.mmsi}) - ${v.status} - ${(v.quality * 100).toFixed(0)}%`);
            });
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

    // Navigate to fleet dashboard
    console.log('📍 Opening Fleet Dashboard...');
    await page.goto('http://localhost:3008/ais/fleet-dashboard');
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({
      path: '/root/apps/ankr-maritime/fleet-dashboard-initial.png',
      fullPage: true
    });
    console.log('📸 Initial screenshot saved\n');

    // Wait for data to load
    console.log('⏳ Waiting for fleet data to load...');
    await page.waitForTimeout(25000); // Fleet dashboard can take time to query all vessels

    // Take final screenshot
    await page.screenshot({
      path: '/root/apps/ankr-maritime/fleet-dashboard-loaded.png',
      fullPage: true
    });
    console.log('\n📸 Final screenshot saved\n');

    // Check what's on the page
    const headings = await page.$$eval('h1, h2', els => els.map(el => el.textContent));
    console.log('📋 Headings Found:');
    headings.forEach((h, i) => console.log(`   ${i + 1}. ${h}`));

    // Check for stats cards
    const statsCards = await page.$$eval('[class*="grid"]', els => els.length);
    console.log(`\n📊 Grid Sections: ${statsCards}`);

    // Check for table
    const hasTable = await page.$('table');
    console.log(`📋 Vessel Table: ${hasTable ? '✅ Found' : '❌ Not found'}`);

    if (hasTable) {
      const rows = await page.$$eval('tbody tr', els => els.length);
      console.log(`   Vessel Rows: ${rows}`);
    }

    // Get page text summary
    const bodyText = await page.$eval('body', el => el.innerText).catch(() => '');
    const relevantLines = bodyText.split('\n')
      .filter(line =>
        line.includes('Total') ||
        line.includes('Live') ||
        line.includes('Quality') ||
        line.includes('Vessels') ||
        line.includes('%')
      )
      .slice(0, 15);

    if (relevantLines.length > 0) {
      console.log('\n📊 Dashboard Content:');
      console.log('═'.repeat(60));
      relevantLines.forEach(line => console.log(line));
      console.log('═'.repeat(60));
    }

    console.log('\n✅ Fleet Dashboard Test Complete!');
    console.log('\n📸 Screenshots:');
    console.log('   1. fleet-dashboard-initial.png');
    console.log('   2. fleet-dashboard-loaded.png');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({
      path: '/root/apps/ankr-maritime/fleet-dashboard-error.png',
      fullPage: true
    });
  } finally {
    await browser.close();
  }
}

testFleetDashboard();
