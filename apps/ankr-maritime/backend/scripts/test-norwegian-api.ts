#!/usr/bin/env tsx
/**
 * Test Norwegian Maritime API integration
 */

import { norwegianMaritimeAPI } from '../src/services/norwegian-maritime-api.js';

async function testNorwegianAPI() {
  console.log('🇳🇴 Testing Norwegian Maritime API...\n');

  // Test IMO numbers (Norwegian-flagged vessels)
  const testIMOs = [
    '9348522', // GOLDEN CURL (from user's Equasis test)
    '9921958', // HARO (from AIS logs)
    '9999999', // Invalid IMO (should return null)
  ];

  for (const imo of testIMOs) {
    console.log(`\n━━━ Testing IMO: ${imo} ━━━`);

    try {
      const data = await norwegianMaritimeAPI.fetchVesselData(imo);

      if (data) {
        console.log('✅ Data retrieved:');
        console.log(`  Name:              ${data.name || 'N/A'}`);
        console.log(`  IMO:               ${data.imo}`);
        console.log(`  MMSI:              ${data.mmsi || 'N/A'}`);
        console.log(`  Flag:              ${data.flag || 'N/A'}`);
        console.log(`  Type:              ${data.shipType || 'N/A'}`);
        console.log(`  Gross Tonnage:     ${data.grossTonnage || 'N/A'}`);
        console.log(`  Deadweight:        ${data.deadweight || 'N/A'}`);
        console.log(`  LOA:               ${data.lengthOverall || 'N/A'}m`);
        console.log(`  Beam:              ${data.breadth || 'N/A'}m`);
        console.log(`  Year Built:        ${data.yearBuilt || 'N/A'}`);
        console.log(`  📋 Ownership:`);
        console.log(`  Registered Owner:  ${data.registeredOwner || 'N/A'}`);
        console.log(`  Technical Manager: ${data.technicalManager || 'N/A'}`);
        console.log(`  Operator:          ${data.operator || 'N/A'}`);
        console.log(`  Owner Country:     ${data.ownerCountry || 'N/A'}`);
        console.log(`  🇳🇴 Norwegian Data:`);
        console.log(`  Reg Number:        ${data.norwegianRegNumber || 'N/A'}`);
        console.log(`  Home Port:         ${data.homePort || 'N/A'}`);
        console.log(`  Class:             ${data.classificationSociety || 'N/A'}`);

        // Show raw API response structure
        if (data.raw) {
          console.log(`\n  📦 Raw API Response Keys:`);
          console.log(`  ${Object.keys(data.raw).join(', ')}`);
        }
      } else {
        console.log('⚠️  No data found (vessel not in Norwegian registry)');
      }

    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n\n✅ Norwegian API test complete!');
}

testNorwegianAPI().catch(console.error);
