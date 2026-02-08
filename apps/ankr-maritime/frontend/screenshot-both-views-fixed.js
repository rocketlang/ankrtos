const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  console.log('📡 Loading mari8x.com...');
  await page.goto('https://mari8x.com', { waitUntil: 'networkidle', timeout: 60000 });
  
  console.log('⏳ Waiting for initial load...');
  await page.waitForTimeout(12000);
  
  // Screenshot 1: Ships View (default)
  console.log('\n📸 SHIPS VIEW...');
  await page.screenshot({ 
    path: '/tmp/mari8x-ships-view.png', 
    fullPage: true 
  });
  console.log('  ✅ /tmp/mari8x-ships-view.png');
  
  // Click Heatmap button
  console.log('\n🔄 Switching to heatmap...');
  try {
    // Try to find and click the heatmap button
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await button.textContent();
      if (text && text.includes('Heatmap')) {
        await button.click();
        console.log('  ✅ Clicked Heatmap button');
        break;
      }
    }
  } catch (error) {
    console.log('  ⚠️  Using fallback click method');
    await page.click('text=Heatmap');
  }
  
  // Wait for heatmap to render
  await page.waitForTimeout(10000);
  
  // Screenshot 2: Heatmap View
  console.log('\n📸 HEATMAP VIEW...');
  await page.screenshot({ 
    path: '/tmp/mari8x-heatmap-view.png', 
    fullPage: true 
  });
  console.log('  ✅ /tmp/mari8x-heatmap-view.png');
  
  // Get map element stats
  const mapStats = await page.evaluate(() => {
    return {
      markers: document.querySelectorAll('.leaflet-marker-icon').length,
      circles: document.querySelectorAll('circle').length,
      paths: document.querySelectorAll('path').length,
      tiles: document.querySelectorAll('.leaflet-tile').length,
    };
  });
  
  console.log('\n📊 Map Statistics:');
  console.log(`  🚢 Ship markers: ${mapStats.markers}`);
  console.log(`  🔥 Heat circles: ${mapStats.circles}`);
  console.log(`  🗺️  Map tiles: ${mapStats.tiles}`);
  
  await browser.close();
  
  console.log('\n✅ COMPLETE!');
  console.log('━'.repeat(60));
  console.log('📁 Screenshots saved:');
  console.log('  1. /tmp/mari8x-ships-view.png (Ships view)');
  console.log('  2. /tmp/mari8x-heatmap-view.png (Heatmap view)');
  console.log('━'.repeat(60));
})();
