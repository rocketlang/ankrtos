#!/usr/bin/env tsx
/**
 * INGEST GFW SATELLITE AIS DATA
 * Fetches satellite AIS from Global Fishing Watch and persists to TimescaleDB
 *
 * Usage:
 *   npx tsx src/scripts/ingest-gfw-satellite-ais.ts
 *   npx tsx src/scripts/ingest-gfw-satellite-ais.ts --hours 48
 *   npx tsx src/scripts/ingest-gfw-satellite-ais.ts --region "Arabian Sea"
 */

import { GFWDataIngestionService, COVERAGE_REGIONS } from '../services/gfw-data-ingestion.js';

async function main() {
  const args = process.argv.slice(2);
  const hoursArg = args.find(arg => arg.startsWith('--hours'));
  const regionArg = args.find(arg => arg.startsWith('--region'));

  const hoursBack = hoursArg ? parseInt(hoursArg.split('=')[1]) : 24;
  const regionName = regionArg ? regionArg.split('=')[1].replace(/"/g, '') : null;

  console.log('🛰️  GFW Satellite AIS Ingestion');
  console.log('━'.repeat(60));
  console.log(`Hours back: ${hoursBack}`);
  if (regionName) {
    console.log(`Region: ${regionName}`);
  } else {
    console.log('Region: ALL REGIONS');
  }
  console.log('━'.repeat(60));
  console.log('');

  const service = new GFWDataIngestionService();

  if (regionName) {
    // Ingest single region
    const region = COVERAGE_REGIONS.find(r => r.name === regionName);
    if (!region) {
      console.error(`❌ Region "${regionName}" not found`);
      console.log('\nAvailable regions:');
      COVERAGE_REGIONS.forEach(r => console.log(`  - ${r.name}`));
      process.exit(1);
    }

    const result = await service.ingestRegion(region, hoursBack);
    console.log('\n✅ Ingestion complete!');
    console.log(`Region: ${result.region}`);
    console.log(`Vessels found: ${result.vesselsFound}`);
    console.log(`New vessels: ${result.newVesselsCreated}`);
    console.log(`Positions: ${result.positionsIngested}`);
    console.log(`Errors: ${result.errors}`);
  } else {
    // Ingest all regions
    const results = await service.ingestAllRegions(hoursBack);
    console.log('\n✅ Full ingestion complete!');
    console.log(`Total vessels: ${results.totalVessels}`);
    console.log(`New vessels: ${results.totalNewVessels}`);
    console.log(`Total positions: ${results.totalPositions}`);
    console.log(`Errors: ${results.totalErrors}`);
  }
}

main().catch(error => {
  console.error('❌ Ingestion failed:', error);
  process.exit(1);
});
