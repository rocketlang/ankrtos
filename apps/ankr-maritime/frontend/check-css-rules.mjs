import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3008', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(10000);

  const cssAnalysis = await page.evaluate(() => {
    // Check for Leaflet-specific CSS rules
    const stylesheets = Array.from(document.styleSheets);
    let leafletRules = [];

    stylesheets.forEach((sheet, i) => {
      try {
        const rules = Array.from(sheet.cssRules || sheet.rules || []);
        const leafletMatches = rules.filter(rule => {
          const ruleText = rule.cssText || '';
          return ruleText.includes('leaflet');
        });
        if (leafletMatches.length > 0) {
          leafletRules.push({
            sheetIndex: i,
            rulesFound: leafletMatches.length,
            sampleRules: leafletMatches.slice(0, 3).map(r => r.cssText?.substring(0, 100))
          });
        }
      } catch (e) {
        // Cross-origin or other errors - skip
      }
    });

    // Test if .leaflet-container class has styles
    const testDiv = document.createElement('div');
    testDiv.className = 'leaflet-container';
    document.body.appendChild(testDiv);
    const styles = window.getComputedStyle(testDiv);
    const leafletContainerStyles = {
      position: styles.position,
      cursor: styles.cursor,
      display: styles.display,
    };
    document.body.removeChild(testDiv);

    return {
      totalStylesheets: stylesheets.length,
      leafletRulesFound: leafletRules.length > 0,
      leafletRules,
      leafletContainerStyles,
    };
  });

  console.log('━'.repeat(80));
  console.log('🎨 CSS RULES ANALYSIS\n');
  console.log(`Total stylesheets:     ${cssAnalysis.totalStylesheets}`);
  console.log(`Leaflet rules found:   ${cssAnalysis.leafletRulesFound ? '✅' : '❌'}`);

  if (cssAnalysis.leafletRules.length > 0) {
    console.log(`\nLeaflet CSS in stylesheets:`);
    cssAnalysis.leafletRules.forEach(sheet => {
      console.log(`   Sheet ${sheet.sheetIndex}: ${sheet.rulesFound} rules`);
      sheet.sampleRules.forEach((rule, i) => {
        console.log(`      ${i + 1}. ${rule}...`);
      });
    });
  } else {
    console.log(`\n❌ No Leaflet CSS rules found in any stylesheet`);
  }

  console.log(`\n.leaflet-container computed styles:`);
  console.log(`   position: ${cssAnalysis.leafletContainerStyles.position}`);
  console.log(`   cursor:   ${cssAnalysis.leafletContainerStyles.cursor}`);
  console.log(`   display:  ${cssAnalysis.leafletContainerStyles.display}`);

  const hasValidStyles = cssAnalysis.leafletContainerStyles.position === 'relative' ||
                         cssAnalysis.leafletContainerStyles.cursor === 'grab';

  console.log(`\n${hasValidStyles ? '✅' : '❌'} Leaflet container styles ${hasValidStyles ? 'are' : 'are NOT'} properly applied`);

  console.log('━'.repeat(80));

  await browser.close();
})();
