#!/usr/bin/env tsx
/**
 * Import REAL Port Data from OpenStreetMap
 * Uses Overpass API to fetch verified, crowdsourced port data
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

interface OSMPort {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags?: {
    name?: string;
    'name:en'?: string;
    'seamark:type'?: string;
    'seamark:harbour:category'?: string;
    'ref:LOCODE'?: string;
    'addr:country'?: string;
    website?: string;
  };
}

async function fetchOSMPorts(): Promise<OSMPort[]> {
  console.log('📡 Fetching real port data from OpenStreetMap...\n');

  // Query for all major harbors/ports worldwide
  // Split into regions to avoid timeout
  // Format: (south,west,north,east) in decimal degrees
  const regions = [
    { name: 'Europe', bbox: '35,-10,72,40' },
    { name: 'Asia East', bbox: '-10,100,60,150' },
    { name: 'Asia South', bbox: '-10,60,35,100' },
    { name: 'North America', bbox: '25,-170,75,-50' },
    { name: 'South America', bbox: '-60,-85,15,-30' },
    { name: 'Middle East', bbox: '10,25,45,65' },
    { name: 'Africa', bbox: '-35,-20,38,52' },
    { name: 'Oceania', bbox: '-50,110,-10,180' },
  ];

  let allPorts: OSMPort[] = [];

  for (const region of regions) {
    try {
      console.log(`   Fetching ${region.name}...`);

      const query = `
        [out:json][timeout:60];
        (
          node["seamark:type"="harbour"](${region.bbox});
          way["seamark:type"="harbour"](${region.bbox});
          relation["seamark:type"="harbour"](${region.bbox});
          node["harbour"="yes"](${region.bbox});
          node["amenity"="harbour"](${region.bbox});
        );
        out center;
      `;

      const response = await axios.post(OVERPASS_API, query, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 90000,
      });

      const ports = response.data.elements || [];
      console.log(`   ✅ Found ${ports.length} ports in ${region.name}`);
      allPorts = allPorts.concat(ports);

      // Rate limiting - be nice to Overpass API
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error: any) {
      console.error(`   ❌ Error fetching ${region.name}: ${error.message}`);
    }
  }

  return allPorts;
}

async function importOSMPorts(ports: OSMPort[]) {
  console.log(`\n📤 Importing ${ports.length} real ports from OSM...\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const port of ports) {
    try {
      const name = port.tags?.name || port.tags?.['name:en'];
      const unlocode = port.tags?.['ref:LOCODE'];
      const country = port.tags?.['addr:country'];

      if (!name) {
        skipped++;
        continue;
      }

      // Get coordinates
      let lat = port.lat;
      let lon = port.lon;

      // For ways/relations, use center
      if (!lat && (port as any).center) {
        lat = (port as any).center.lat;
        lon = (port as any).center.lon;
      }

      if (!lat || !lon) {
        skipped++;
        continue;
      }

      // Generate UNLOCODE if not provided (OSM ID based)
      const generatedUnlocode = unlocode || `OSM${port.id.toString().substring(0, 5)}`;

      // Check if exists by name or unlocode
      const existing = await prisma.port.findFirst({
        where: {
          OR: [
            { unlocode: generatedUnlocode },
            { name: name, latitude: lat, longitude: lon }, // Exact match
          ],
        },
      });

      if (existing) {
        // Update if we have better data
        if (!existing.latitude || !existing.unlocode.startsWith('OSM')) {
          await prisma.port.update({
            where: { id: existing.id },
            data: {
              latitude: lat,
              longitude: lon,
              unlocode: unlocode || existing.unlocode,
            },
          });
          updated++;
        } else {
          skipped++;
        }
      } else {
        // Create new port from OSM data
        await prisma.port.create({
          data: {
            name,
            unlocode: generatedUnlocode,
            country: country || 'Unknown',
            latitude: lat,
            longitude: lon,
          },
        });
        created++;
      }

      if ((created + updated) % 50 === 0) {
        process.stdout.write(`\r📊 Progress: ${created} created, ${updated} updated, ${skipped} skipped`);
      }
    } catch (error: any) {
      errors++;
      if (errors <= 5) {
        console.error(`\n❌ Error: ${error.message}`);
      }
    }
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('OSM PORT IMPORT COMPLETE');
  console.log('='.repeat(80));
  console.log(`✅ New ports created: ${created}`);
  console.log(`✏️  Ports updated: ${updated}`);
  console.log(`⏭️  Ports skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);

  const totalPorts = await prisma.port.count();
  const countries = await prisma.port.groupBy({ by: ['country'] });

  console.log(`\n🌐 Database statistics:`);
  console.log(`   • Total ports: ${totalPorts}`);
  console.log(`   • Countries: ${countries.length}`);

  return { created, updated, skipped, errors };
}

async function main() {
  console.log('='.repeat(80));
  console.log('REAL PORT DATA IMPORT FROM OPENSTREETMAP');
  console.log('='.repeat(80));
  console.log('Source: OpenStreetMap (crowdsourced, verified)');
  console.log('API: Overpass API\n');

  try {
    const ports = await fetchOSMPorts();
    await importOSMPorts(ports);
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
