#!/usr/bin/env tsx

/**
 * TEST ARABIAN SEA COVERAGE RIGHT NOW
 * No registration, no API keys, works immediately!
 */

import { getVesselFinderPublicData } from './src/services/vesselfinder-free';

async function main() {
  console.log('🚢 Testing Arabian Sea Coverage...\n');

  const arabianSea = {
    north: 25,
    south: 5,
    east: 75,
    west: 50
  };

  const vessels = await getVesselFinderPublicData(arabianSea);

  if (vessels.length === 0) {
    console.log('⚠️  No vessels found. Trying larger area (entire Indian Ocean)...\n');

    const indianOcean = {
      north: 30,
      south: -30,
      east: 100,
      west: 30
    };

    const moreVessels = await getVesselFinderPublicData(indianOcean);
    console.log(`✅ Indian Ocean: ${moreVessels.length} vessels found!`);
  } else {
    console.log(`
✅ SUCCESS! Arabian Sea is now visible!

Found ${vessels.length} vessels:
${vessels.map((v, i) =>
  `${i + 1}. ${v.name} (MMSI: ${v.mmsi})
   Position: ${v.lat.toFixed(4)}°N, ${v.lon.toFixed(4)}°E
   Speed: ${v.speed} knots, Course: ${v.course}°
   `
).join('\n')}
    `);
  }
}

main().catch(console.error);
