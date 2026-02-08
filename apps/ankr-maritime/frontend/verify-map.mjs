import { chromium } from 'playwright';

(async () => {
  console.log('🌐 Opening browser...\n');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  // Capture console logs
  const logs = [];
  page.on('console', msg => logs.push(msg.text()));

  console.log('📡 Loading http://localhost:3008...');
  await page.goto('http://localhost:3008', { waitUntil: 'networkidle', timeout: 30000 });

  console.log('⏳ Waiting 15 seconds for full load...\n');
  await page.waitForTimeout(15000);

  // Scroll to map section
  await page.evaluate(() => {
    const heading = Array.from(document.querySelectorAll('h3')).find(h =>
      h.textContent.includes('Global AIS Map')
    );
    if (heading) {
      heading.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  await page.waitForTimeout(3000);

  // Check map status
  const mapStatus = await page.evaluate(() => {
    // Find map section
    const mapHeading = Array.from(document.querySelectorAll('h3')).find(h =>
      h.textContent.includes('Global AIS Map')
    );

    // Check Leaflet
    const leafletContainer = document.querySelector('.leaflet-container');
    const tiles = document.querySelectorAll('.leaflet-tile');
    const markers = document.querySelectorAll('.leaflet-marker-icon');

    // Check buttons
    const buttons = Array.from(document.querySelectorAll('button'));
    const shipsBtn = buttons.find(b => b.textContent.includes('Ships'));
    const heatmapBtn = buttons.find(b => b.textContent.includes('Heatmap'));

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
      foundHeading: !!mapHeading,
      hasLeaflet: !!leafletContainer,
      mapDimensions,
      tileCount: tiles.length,
      markerCount: markers.length,
      shipsButton: shipsBtn?.textContent || null,
      heatmapButton: heatmapBtn?.textContent || null,
    };
  });

  // Take screenshot
  await page.screenshot({
    path: '/tmp/mari8x-browser-test.png',
    fullPage: true
  });

  // Print results
  console.log('━'.repeat(80));
  console.log('📊 MARI8X MAP TEST RESULTS');
  console.log('━'.repeat(80));
  console.log(`\n🗺️  Map Section:`);
  console.log(`   Heading Found:        ${mapStatus.foundHeading ? '✅' : '❌'}`);
  console.log(`   Leaflet Container:    ${mapStatus.hasLeaflet ? '✅' : '❌'}`);

  if (mapStatus.mapDimensions) {
    console.log(`   Map Dimensions:       ${mapStatus.mapDimensions.width}x${mapStatus.mapDimensions.height}`);
    console.log(`   Map Visible:          ${mapStatus.mapDimensions.visible ? '✅' : '❌'}`);
  }

  console.log(`\n🗺️  Map Content:`);
  console.log(`   Map Tiles:            ${mapStatus.tileCount} ${mapStatus.tileCount > 0 ? '✅' : '❌'}`);
  console.log(`   Ship Markers:         ${mapStatus.markerCount} ${mapStatus.markerCount > 0 ? '✅' : '⚠️'}`);

  console.log(`\n🎛️  Controls:`);
  console.log(`   Ships Button:         ${mapStatus.shipsButton || '❌ Not found'}`);
  console.log(`   Heatmap Button:       ${mapStatus.heatmapButton || '❌ Not found'}`);

  // Check console logs for initialization
  const mapInitLogs = logs.filter(log => log.includes('MAP INIT') || log.includes('MARKER EFFECT'));
  if (mapInitLogs.length > 0) {
    console.log(`\n📝 Console Logs (${mapInitLogs.length} relevant):`);
    mapInitLogs.slice(-5).forEach(log => console.log(`   ${log}`));
  }

  console.log(`\n📸 Screenshot saved: /tmp/mari8x-browser-test.png`);
  console.log('━'.repeat(80));

  // Final verdict
  const isWorking = mapStatus.hasLeaflet && mapStatus.tileCount > 0;
  const hasMarkers = mapStatus.markerCount > 0;

  if (isWorking && hasMarkers) {
    console.log('\n✅ SUCCESS! Map is fully working with vessels visible!');
  } else if (isWorking && !hasMarkers) {
    console.log('\n⚠️  Map loads but no markers visible (may need more time or region has no vessels)');
  } else {
    console.log('\n❌ Map not loading properly');
  }

  console.log('━'.repeat(80));

  await browser.close();
})();
