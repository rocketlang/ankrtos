import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));

  await page.goto('http://localhost:3008', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(15000);

  const analysis = await page.evaluate(() => {
    // Find map heading
    const mapHeading = Array.from(document.querySelectorAll('h3')).find(h =>
      h.textContent.includes('Global AIS Map')
    );

    if (!mapHeading) return { found: false };

    // Get the map section container
    const mapSection = mapHeading.parentElement?.parentElement;

    // Look for divs with specific height
    const allMapDivs = Array.from(document.querySelectorAll('[style*="height"]')).map(div => ({
      tag: div.tagName,
      height: div.style.height,
      width: div.style.width,
      className: div.className,
      hasLeafletClass: div.className.includes('leaflet'),
      childCount: div.children.length,
      id: div.id,
    }));

    // Check for ref callback
    const divsIn700 = Array.from(document.querySelectorAll('[style*="700px"]'));

    // Check inside map section
    let mapContainerDiv = null;
    if (mapSection) {
      const targetDiv = mapSection.querySelector('[style*="700px"]');
      if (targetDiv) {
        mapContainerDiv = {
          exists: true,
          height: targetDiv.style.height,
          className: targetDiv.className,
          hasLeafletClass: targetDiv.className.includes('leaflet'),
          innerHTML: targetDiv.innerHTML.substring(0, 200),
          childElements: targetDiv.children.length,
        };
      }
    }

    return {
      found: true,
      allMapDivs: allMapDivs.filter(d => d.height === '700px'),
      divsIn700Count: divsIn700.length,
      mapContainerDiv,
      leafletContainers: document.querySelectorAll('.leaflet-container').length,
    };
  });

  console.log('━'.repeat(80));
  console.log('🔍 MAP DIV ANALYSIS\n');

  if (!analysis.found) {
    console.log('❌ Map heading not found');
  } else {
    console.log(`📊 Summary:`);
    console.log(`   Divs with 700px height: ${analysis.divsIn700Count}`);
    console.log(`   Leaflet containers:     ${analysis.leafletContainers}`);

    if (analysis.mapContainerDiv) {
      console.log(`\n🗺️  Map Container Div:`);
      console.log(`   Exists:           ✅`);
      console.log(`   Height:           ${analysis.mapContainerDiv.height}`);
      console.log(`   Class:            "${analysis.mapContainerDiv.className}"`);
      console.log(`   Has Leaflet class: ${analysis.mapContainerDiv.hasLeafletClass ? '✅' : '❌'}`);
      console.log(`   Child elements:    ${analysis.mapContainerDiv.childElements}`);
      console.log(`   Inner HTML (200c): ${analysis.mapContainerDiv.innerHTML}`);
    } else {
      console.log(`\n🗺️  Map Container Div: ❌ Not found`);
    }

    if (analysis.allMapDivs.length > 0) {
      console.log(`\n📋 All 700px height divs (${analysis.allMapDivs.length}):`);
      analysis.allMapDivs.forEach((div, i) => {
        console.log(`   ${i + 1}. ${div.tag} - class: "${div.className}", leaflet: ${div.hasLeafletClass ? '✅' : '❌'}, children: ${div.childCount}`);
      });
    }
  }

  const mapLogs = logs.filter(log => log.includes('MAP'));
  if (mapLogs.length > 0) {
    console.log(`\n📝 Map Logs (${mapLogs.length}):`);
    mapLogs.forEach(log => console.log(`   ${log}`));
  }

  console.log('━'.repeat(80));

  await browser.close();
})();
