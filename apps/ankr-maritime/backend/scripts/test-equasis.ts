#!/usr/bin/env tsx
/**
 * Test Equasis Login and Vessel Lookup
 */

import 'dotenv/config';
import { EquasisService } from '../src/services/equasis-service.js';

async function testEquasis() {
  console.log('🔍 Testing Equasis Integration');
  console.log('==========================================\n');

  const service = new EquasisService();

  try {
    // Initialize browser
    console.log('1️⃣  Initializing browser...');
    await service.initialize();
    console.log('   ✅ Browser initialized\n');

    // Test login
    console.log('2️⃣  Testing login...');
    console.log(`   Username: ${process.env.EQUASIS_USERNAME}`);
    console.log('   Password: [hidden]\n');

    const loginSuccess = await service.login();

    if (loginSuccess) {
      console.log('   ✅ LOGIN SUCCESSFUL!\n');

      // Test vessel lookup
      console.log('3️⃣  Testing vessel lookup...');
      console.log('   Searching for IMO 9811000 (MSC ANNA)...\n');

      const vesselData = await service.getVesselOwnerByIMO('9811000');

      if (vesselData) {
        console.log('   ✅ VESSEL DATA RETRIEVED!\n');
        console.log('   📊 Vessel Details:');
        console.log('   ═'.repeat(40));
        console.log(`   Name: ${vesselData.name}`);
        console.log(`   IMO: ${vesselData.imoNumber}`);
        console.log(`   Flag: ${vesselData.flag}`);
        console.log(`   Type: ${vesselData.type}`);
        console.log(`   Call Sign: ${vesselData.callSign}`);
        console.log(`   MMSI: ${vesselData.mmsi}`);
        console.log(`   Built: ${vesselData.buildDate}`);
        console.log(`   Gross Tonnage: ${vesselData.grossTonnage}`);
        console.log(`   Deadweight: ${vesselData.deadweight}`);
        console.log('');
        console.log('   🏢 Ownership Data:');
        console.log('   ═'.repeat(40));
        console.log(`   Registered Owner: ${vesselData.registeredOwner}`);
        console.log(`   Operator: ${vesselData.operator}`);
        console.log(`   Ship Manager: ${vesselData.shipManager}`);
        console.log(`   DOC Company: ${vesselData.docCompany}`);
        console.log('');

        console.log('🎉 EQUASIS INTEGRATION SUCCESS!');
        console.log('   Ready to enrich 16,535 vessels\n');
      } else {
        console.log('   ⚠️  No vessel data found (vessel may not exist in Equasis)');
      }

    } else {
      console.log('   ❌ LOGIN FAILED\n');
      console.log('   Possible issues:');
      console.log('   1. Incorrect credentials');
      console.log('   2. Equasis website structure changed');
      console.log('   3. Account locked or requires verification\n');
      console.log('   💡 Check credentials in .env file:');
      console.log('      EQUASIS_USERNAME=capt.anil.sharma@powerpbox.org');
      console.log('      EQUASIS_PASSWORD=your_password\n');
    }

  } catch (error: any) {
    console.error('   ❌ ERROR:', error.message);
    console.error('\n   Stack trace:', error.stack);
  } finally {
    console.log('4️⃣  Cleaning up...');
    await service.close();
    console.log('   ✅ Browser closed\n');
  }

  console.log('==========================================');
  console.log('Test complete!');
}

// Run test
testEquasis().catch(console.error);
