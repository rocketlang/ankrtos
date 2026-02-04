/**
 * Test GISIS service with login
 */

import { getGISISService, closeGISISService } from '../src/services/gisis-owner-service.js';

async function main() {
  try {
    console.log('\n🚀 Testing GISIS service with login...\n');

    const gisisService = await getGISISService();
    console.log('✅ Service initialized');

    // Test with EVER GIVEN
    const testIMO = '9811000';
    console.log(`\n🔍 Testing with IMO: ${testIMO} (EVER GIVEN)`);

    const result = await gisisService.getVesselOwnerByIMO(testIMO);

    if (result) {
      console.log('\n✅ SUCCESS! Data retrieved:');
      console.log('==========================');
      console.log(`Vessel Name: ${result.name}`);
      console.log(`IMO Number: ${result.imoNumber}`);
      console.log(`Flag: ${result.flag}`);
      console.log(`Registered Owner: ${result.registeredOwner}`);
      console.log(`Operator: ${result.operator}`);
      console.log(`Technical Manager: ${result.technicalManager}`);
      console.log(`Type: ${result.type}`);
      console.log(`Gross Tonnage: ${result.grossTonnage}`);
      console.log('==========================\n');
    } else {
      console.log('\n❌ No data returned');
    }

    await closeGISISService();
    console.log('✅ Service closed');

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    await closeGISISService();
  }
}

main();
