/**
 * Test GISIS login with Playwright
 */

import { getGISISPlaywrightService, closeGISISPlaywrightService } from '../src/services/gisis-playwright-service.js';

async function main() {
  try {
    console.log('\n🚀 Testing GISIS with Playwright...\n');

    const service = await getGISISPlaywrightService();
    console.log('✅ Service initialized');

    // Test with EVER GIVEN (IMO 9811000)
    console.log('\n🔍 Testing with IMO: 9811000 (EVER GIVEN)\n');

    const data = await service.getVesselOwnerByIMO('9811000');

    if (data) {
      console.log('\n✅✅✅ SUCCESS! Data retrieved:\n');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('\n❌ No data retrieved');
    }

    await closeGISISPlaywrightService();
    console.log('\n✅ Service closed');

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
