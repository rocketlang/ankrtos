import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  // Capture ALL console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  const errors = [];
  page.on('pageerror', err => {
    errors.push(`${err.name}: ${err.message}\n${err.stack}`);
  });

  console.log('📡 Loading page...\n');
  await page.goto('http://localhost:3008', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(20000);

  // Scroll to map section
  await page.evaluate(() => {
    const mapHeading = Array.from(document.querySelectorAll('h3')).find(h =>
      h.textContent.includes('Global AIS Map')
    );
    if (mapHeading) {
      mapHeading.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }).catch(() => {});

  await page.waitForTimeout(5000);

  // Detailed DOM inspection
  const domInfo = await page.evaluate(() => {
    // Find the map section
    const allH3s = Array.from(document.querySelectorAll('h3')).map(h => h.textContent.trim());
    const mapHeading = Array.from(document.querySelectorAll('h3')).find(h =>
      h.textContent.includes('Global AIS Map')
    );

    let mapSectionInfo = null;
    if (mapHeading) {
      const mapContainer = mapHeading.closest('div');
      mapSectionInfo = {
        foundHeading: true,
        headingText: mapHeading.textContent,
        containerHTML: mapContainer ? mapContainer.innerHTML.substring(0, 500) : null,
        hasMapDiv: !!mapContainer?.querySelector('[style*="height: 700px"]'),
        hasLeafletContainer: !!document.querySelector('.leaflet-container'),
        allDivsWithHeight700: document.querySelectorAll('[style*="height: 700px"]').length,
      };
    }

    // Check for React errors
    const reactRoots = document.querySelectorAll('#root, [data-reactroot]');
    const hasReactError = document.body.innerText.toLowerCase().includes('error');

    // Check component structure
    const mainDiv = document.querySelector('div[class*="min-h-screen"]');

    return {
      allH3s,
      mapSectionInfo,
      reactRoots: reactRoots.length,
      hasReactError,
      bodyLength: document.body.innerText.length,
      hasMainContainer: !!mainDiv,
      leafletScriptLoaded: !!window.L,
      apolloClientExists: !!window.__APOLLO_CLIENT__,
    };
  });

  // Print results
  console.log('━'.repeat(80));
  console.log('🔍 DETAILED MAP DEBUG');
  console.log('━'.repeat(80));

  console.log('\n📋 Page Structure:');
  console.log(`   React roots:          ${domInfo.reactRoots}`);
  console.log(`   Main container:       ${domInfo.hasMainContainer ? '✅' : '❌'}`);
  console.log(`   Body length:          ${domInfo.bodyLength} chars`);
  console.log(`   Leaflet loaded:       ${domInfo.leafletScriptLoaded ? '✅' : '❌'}`);
  console.log(`   Apollo client:        ${domInfo.apolloClientExists ? '✅' : '❌'}`);

  console.log(`\n📝 H3 Headings (${domInfo.allH3s.length}):`);
  domInfo.allH3s.forEach((h, i) => console.log(`   ${i + 1}. ${h}`));

  if (domInfo.mapSectionInfo) {
    console.log('\n🗺️  Map Section:');
    console.log(`   Heading found:        ✅ "${domInfo.mapSectionInfo.headingText}"`);
    console.log(`   Has 700px div:        ${domInfo.mapSectionInfo.hasMapDiv ? '✅' : '❌'}`);
    console.log(`   Leaflet container:    ${domInfo.mapSectionInfo.hasLeafletContainer ? '✅' : '❌'}`);
    console.log(`   Divs with 700px:      ${domInfo.mapSectionInfo.allDivsWithHeight700}`);
  } else {
    console.log('\n🗺️  Map Section: ❌ Not found');
  }

  // Show relevant console logs
  const mapLogs = consoleLogs.filter(log =>
    log.text.includes('MAP') ||
    log.text.includes('Leaflet') ||
    log.text.includes('vessel') ||
    log.text.includes('GraphQL')
  );

  if (mapLogs.length > 0) {
    console.log(`\n📝 Map-related Console Logs (${mapLogs.length}):`);
    mapLogs.forEach((log, i) => {
      console.log(`   ${i + 1}. [${log.type}] ${log.text}`);
    });
  }

  if (errors.length > 0) {
    console.log(`\n❌ Page Errors (${errors.length}):`);
    errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
  }

  // Show last 10 console logs
  console.log(`\n📋 Last 10 Console Logs:`);
  consoleLogs.slice(-10).forEach((log, i) => {
    console.log(`   ${consoleLogs.length - 10 + i + 1}. [${log.type}] ${log.text}`);
  });

  console.log('━'.repeat(80));

  await browser.close();
})();
