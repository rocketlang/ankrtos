import { chromium } from 'playwright';

(async () => {
  console.log('🌐 Opening browser...\n');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  // Capture errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));

  console.log('📡 Loading http://localhost:3008...');
  try {
    await page.goto('http://localhost:3008', { timeout: 10000 }); // Just wait for page load
  } catch (e) {
    console.log('⚠️ Page load timeout, checking anyway...\n');
  }

  console.log('⏳ Waiting 20 seconds for map to render...\n');
  await page.waitForTimeout(20000);

  // Check map status
  const mapStatus = await page.evaluate(() => {
    // Check Leaflet
    const leafletContainer = document.querySelector('.leaflet-container');
    const tiles = document.querySelectorAll('.leaflet-tile');
    const markers = document.querySelectorAll('.leaflet-marker-icon');
    const circles = document.querySelectorAll('.leaflet-interactive[fill-color]');

    // Check page content
    const bodyText = document.body.innerText;
    const hasContent = bodyText.length > 100;

    // Get map dimensions
    let mapDimensions = null;
    if (leafletContainer) {
      const rect = leafletContainer.getBoundingClientRect();
      mapDimensions = {
        width: rect.width,
        height: rect.height,
        visible: rect.height > 0 && rect.width > 0,
      };
    }

    return {
      hasLeaflet: !!leafletContainer,
      mapDimensions,
      tileCount: tiles.length,
      markerCount: markers.length,
      circleCount: circles.length,
      hasContent,
      bodyLength: bodyText.length,
    };
  });

  // Print results
  console.log('━'.repeat(80));
  console.log('📊 MAP TEST RESULTS');
  console.log('━'.repeat(80));
  console.log(`\n📄 Page Content:`);
  console.log(`   Body Length:          ${mapStatus.bodyLength} chars`);
  console.log(`   Has Content:          ${mapStatus.hasContent ? '✅' : '❌'}`);

  console.log(`\n🗺️  Map Component:`);
  console.log(`   Leaflet Container:    ${mapStatus.hasLeaflet ? '✅' : '❌'}`);

  if (mapStatus.mapDimensions) {
    console.log(`   Map Dimensions:       ${mapStatus.mapDimensions.width}x${mapStatus.mapDimensions.height}`);
    console.log(`   Map Visible:          ${mapStatus.mapDimensions.visible ? '✅' : '❌'}`);
  }

  console.log(`\n🗺️  Map Content:`);
  console.log(`   Map Tiles:            ${mapStatus.tileCount} ${mapStatus.tileCount > 0 ? '✅' : '❌'}`);
  console.log(`   Ship Markers:         ${mapStatus.markerCount} ${mapStatus.markerCount > 0 ? '✅' : '⚠️'}`);
  console.log(`   Heatmap Circles:      ${mapStatus.circleCount}`);

  if (errors.length > 0) {
    console.log(`\n❌ Console Errors (${errors.length}):`);
    errors.slice(0, 5).forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
    if (errors.length > 5) console.log(`   ... and ${errors.length - 5} more`);
  } else {
    console.log(`\n✅ No console errors!`);
  }

  console.log('━'.repeat(80));

  // Final verdict
  const isWorking = mapStatus.hasLeaflet && mapStatus.tileCount > 0 && mapStatus.hasContent;
  const hasMarkers = mapStatus.markerCount > 0;

  if (isWorking && hasMarkers) {
    console.log('\n✅ SUCCESS! Map is fully working with vessels visible!');
  } else if (isWorking && !hasMarkers) {
    console.log('\n⚠️  Map loads but no markers visible (checking data or timing)');
  } else if (mapStatus.hasContent && !mapStatus.hasLeaflet) {
    console.log('\n⚠️  Page loads but map component not initialized');
  } else {
    console.log('\n❌ Page or map not loading properly');
  }

  console.log('━'.repeat(80));

  await browser.close();
})();
