#!/usr/bin/env tsx
/**
 * Test Equasis with well-known vessel IMOs
 */

import 'dotenv/config';
import { EquasisService } from '../src/services/equasis-service.js';

const KNOWN_VESSELS = [
  { imo: '9321483', name: 'Ever Given (Suez Canal blocker)' },
  { imo: '9395044', name: 'CMA CGM Antoine De Saint Exupery' },
  { imo: '9641932', name: 'MSC Gülsün' },
  { imo: '9839950', name: 'MSC Tessa' },
];

async function testKnownVessels() {
  console.log('🔍 Testing Equasis with Well-Known Vessels\n');

  const service = new EquasisService();

  try {
    await service.initialize();
    const loginSuccess = await service.login();

    if (!loginSuccess) {
      console.log('❌ Login failed\n');
      return;
    }

    console.log('✅ Logged in successfully\n');
    console.log('Testing known vessels...\n');
    console.log('='.repeat(70));

    for (const vessel of KNOWN_VESSELS) {
      console.log(`\n🚢 Searching: ${vessel.name} (IMO ${vessel.imo})`);
      console.log('-'.repeat(70));

      try {
        const data = await service.getVesselOwnerByIMO(vessel.imo);

        if (data && (data.name || data.registeredOwner)) {
          console.log('✅ FOUND!');
          console.log(`   Name: ${data.name}`);
          console.log(`   IMO: ${data.imoNumber}`);
          console.log(`   Flag: ${data.flag}`);
          console.log(`   Type: ${data.type}`);
          console.log(`   Owner: ${data.registeredOwner}`);
          console.log(`   Operator: ${data.operator}`);
          console.log(`   Manager: ${data.shipManager}`);
          console.log('\n   🎉 DATA EXTRACTION WORKING!');
          break; // Found one, that's enough
        } else {
          console.log('⚠️  Found but no data extracted');
        }
      } catch (error: any) {
        console.log(`❌ Error: ${error.message}`);
      }

      await service['sleep'](2000); // Rate limiting
    }

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
  } finally {
    await service.close();
  }
}

testKnownVessels().catch(console.error);
