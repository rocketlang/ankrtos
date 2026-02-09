#!/usr/bin/env tsx
/**
 * Import Real WPI Data from Downloaded CSV
 * Expects manually downloaded WPI.csv from NGA MSI website
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

interface WPIRecord {
  'Index No': string;
  'Region Name': string;
  'Main Port Name': string;
  'Alternate Port Name'?: string;
  'UN/LOCODE': string;
  'Country': string;
  'World Water Body': string;
  'Latitude': string;
  'Longitude': string;
  'Harbor Size': string;
  'Harbor Type': string;
  'Shelter Afforded': string;
  'Entrance Restriction - Tide': string;
  'Entrance Restriction - Heavy Swell': string;
  'Entrance Restriction - Ice': string;
  'Entrance Restriction - Other': string;
  'Overhead Limits': string;
  'Channel Depth': string;
  'Anchorage Depth': string;
  'Cargo Pier Depth': string;
  'Oil Terminal Depth': string;
  'Tide Range': string;
  'Max Vessel Size': string;
  'Good Holding Ground': string;
  'Turning Area': string;
  'Port Security': string;
}

function parseCoordinate(coord: string): number | null {
  if (!coord) return null;

  // Parse formats like: 1°17'00"N or 103°51'00"E
  const match = coord.match(/(\d+)°(\d+)'(\d+)"([NSEW])/);
  if (!match) return null;

  const [, degrees, minutes, seconds, direction] = match;
  let decimal = parseInt(degrees) + parseInt(minutes) / 60 + parseInt(seconds) / 3600;

  if (direction === 'S' || direction === 'W') {
    decimal = -decimal;
  }

  return decimal;
}

async function importWPI(csvPath: string) {
  console.log('='.repeat(80));
  console.log('IMPORTING REAL WPI DATA FROM NGA');
  console.log('='.repeat(80));
  console.log(`Source: ${csvPath}\n`);

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    console.log('\n📥 Please download WPI data:');
    console.log('   1. Visit: https://msi.nga.mil/Publications/WPI');
    console.log('   2. Download CSV format');
    console.log(`   3. Save to: ${csvPath}`);
    console.log('   4. Run this script again\n');
    return;
  }

  const results: any[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        console.log(`📊 Total records in CSV: ${results.length}\n`);

        let created = 0;
        let updated = 0;
        let skipped = 0;
        let errors = 0;

        for (const record of results) {
          try {
            const portName = record['Main Port Name'] || record['Port Name'];
            const unlocode = record['UN/LOCODE'] || record['LOCODE'];
            const country = record['Country'];
            const latitude = parseCoordinate(record['Latitude']);
            const longitude = parseCoordinate(record['Longitude']);

            if (!unlocode || !portName) {
              skipped++;
              continue;
            }

            // Check if port exists
            const existing = await prisma.port.findUnique({
              where: { unlocode },
            });

            if (existing) {
              // Update with richer WPI data
              await prisma.port.update({
                where: { id: existing.id },
                data: {
                  name: portName,
                  country: country || existing.country,
                  latitude: latitude || existing.latitude,
                  longitude: longitude || existing.longitude,
                },
              });
              updated++;
            } else {
              // Create new port with WPI data
              await prisma.port.create({
                data: {
                  name: portName,
                  unlocode,
                  country,
                  latitude,
                  longitude,
                },
              });
              created++;
            }

            if ((created + updated) % 100 === 0) {
              process.stdout.write(`\r📊 Progress: ${created} created, ${updated} updated, ${skipped} skipped`);
            }
          } catch (error: any) {
            errors++;
            if (errors <= 5) {
              console.error(`\n❌ Error importing: ${error.message}`);
            }
          }
        }

        console.log('\n\n' + '='.repeat(80));
        console.log('IMPORT COMPLETE');
        console.log('='.repeat(80));
        console.log(`✅ New ports created: ${created}`);
        console.log(`✏️  Ports updated: ${updated}`);
        console.log(`⏭️  Ports skipped: ${skipped}`);
        console.log(`❌ Errors: ${errors}`);

        const totalPorts = await prisma.port.count();
        console.log(`\n🌐 Total ports in database: ${totalPorts}`);

        resolve({ created, updated, skipped, errors });
      })
      .on('error', reject);
  });
}

async function main() {
  const csvPath = process.argv[2] || '/tmp/WPI.csv';

  try {
    await importWPI(csvPath);
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
