import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3008', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(10000);

  const cssInfo = await page.evaluate(() => {
    // Check for Leaflet CSS
    const stylesheets = Array.from(document.styleSheets);
    const leafletCss = stylesheets.find(sheet => {
      try {
        return sheet.href && sheet.href.includes('leaflet');
      } catch (e) {
        return false;
      }
    });

    // Check if Leaflet class styles exist
    const testDiv = document.createElement('div');
    testDiv.className = 'leaflet-container';
    document.body.appendChild(testDiv);
    const computedStyle = window.getComputedStyle(testDiv);
    const hasLeafletStyles = computedStyle.position !== '' && computedStyle.position !== 'static';
    document.body.removeChild(testDiv);

    // Check window.L
    const leafletLoaded = !!window.L;
    const leafletVersion = window.L ? window.L.version : null;

    // List all stylesheets
    const allStylesheets = stylesheets.map(sheet => {
      try {
        return sheet.href || '<inline>';
      } catch (e) {
        return '<error accessing>';
      }
    });

    return {
      leafletCssLoaded: !!leafletCss,
      leafletCssHref: leafletCss ? leafletCss.href : null,
      hasLeafletStyles,
      leafletLoaded,
      leafletVersion,
      totalStylesheets: stylesheets.length,
      allStylesheets,
    };
  });

  console.log('━'.repeat(80));
  console.log('🎨 LEAFLET CSS CHECK\n');
  console.log(`Leaflet JS loaded:    ${cssInfo.leafletLoaded ? '✅' : '❌'}`);
  console.log(`Leaflet version:      ${cssInfo.leafletVersion || 'N/A'}`);
  console.log(`Leaflet CSS loaded:   ${cssInfo.leafletCssLoaded ? '✅' : '❌'}`);
  if (cssInfo.leafletCssHref) {
    console.log(`Leaflet CSS path:     ${cssInfo.leafletCssHref}`);
  }
  console.log(`Leaflet styles work:  ${cssInfo.hasLeafletStyles ? '✅' : '❌'}`);
  console.log(`\nTotal stylesheets: ${cssInfo.totalStylesheets}`);
  console.log(`\nAll stylesheets:`);
  cssInfo.allStylesheets.forEach((href, i) => {
    const display = href.length > 80 ? href.substring(0, 77) + '...' : href;
    console.log(`   ${i + 1}. ${display}`);
  });
  console.log('━'.repeat(80));

  await browser.close();
})();
