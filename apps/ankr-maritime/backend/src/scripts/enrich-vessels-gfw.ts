#!/usr/bin/env tsx
/**
 * ENRICH VESSELS WITH GFW DATA
 * Use Global Fishing Watch to fill in missing vessel details (name, flag, IMO, type)
 */

import 'dotenv/config';
import { enrichAllVessels, GlobalFishingWatchClient } from '../services/global-fishing-watch-ais-fixed.js';
import { prisma } from '../lib/prisma.js';

async function showStatus() {
  const total = await prisma.vessel.count();
  const withNames = await prisma.vessel.count({ where: { name: { not: null } } });
  const withFlags = await prisma.vessel.count({ where: { flag: { not: null } } });
  const withIMO = await prisma.vessel.count({ where: { imo: { not: null } } });

  console.log('📊 Current Vessel Database Status:');
  console.log('━'.repeat(60));
  console.log(`Total vessels: ${total}`);
  console.log(`With names: ${withNames} (${((withNames/total)*100).toFixed(1)}%)`);
  console.log(`With flags: ${withFlags} (${((withFlags/total)*100).toFixed(1)}%)`);
  console.log(`With IMO: ${withIMO} (${((withIMO/total)*100).toFixed(1)}%)`);
  console.log('━'.repeat(60));
}

async function testSingleVessel() {
  console.log('\n🧪 Testing GFW Enrichment with Sample Vessel...\n');

  const client = new GlobalFishingWatchClient();

  // Test with Hong Kong vessel MMSI
  const mmsi = '477995900';
  console.log(`Searching GFW for MMSI: ${mmsi}`);

  const gfwData = await client.searchVessel(mmsi);

  if (gfwData) {
    console.log('\n✅ Found GFW data:');
    console.log(JSON.stringify(gfwData, null, 2));
  } else {
    console.log('\n❌ No GFW data found for this vessel');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';

  console.log('🛰️  GFW Vessel Enrichment Tool\n');

  switch (command) {
    case 'status':
      await showStatus();
      break;

    case 'test':
      await testSingleVessel();
      break;

    case 'enrich':
      const limit = parseInt(args[1]) || 10;
      console.log(`\n📝 Enriching up to ${limit} vessels...\n`);
      await showStatus();
      console.log('\n🔄 Starting enrichment...\n');
      const results = await enrichAllVessels(limit);
      console.log('\n✅ Enrichment complete!\n');
      await showStatus();
      break;

    default:
      console.log('Usage:');
      console.log('  npx tsx enrich-vessels-gfw.ts status          Show vessel database status');
      console.log('  npx tsx enrich-vessels-gfw.ts test            Test GFW API with sample vessel');
      console.log('  npx tsx enrich-vessels-gfw.ts enrich [limit]  Enrich vessels (default: 10)');
  }
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
