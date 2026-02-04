/**
 * Debug GISIS scraper - test with single vessel
 */

import { IMOGISISScraper } from '../src/services/imo-gisis-scraper.js';

async function main() {
  const scraper = new IMOGISISScraper();

  try {
    // Test with a well-known vessel (Ever Given - Suez Canal incident)
    const testIMO = '9811000'; // EVER GIVEN

    console.log(`\n🔍 Testing IMO GISIS scraper with IMO: ${testIMO}`);
    console.log('This vessel definitely exists in IMO database\n');

    const result = await scraper.scrapeVesselData(testIMO);

    if (result) {
      console.log('\n✅ SUCCESS! Data retrieved:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('\n❌ FAILED: No data returned');
      console.log('Check screenshot at: /tmp/imo-gisis-9811000.png');
    }

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await scraper.close();
  }
}

main();
