#!/usr/bin/env tsx
/**
 * Check AIS data availability for route extraction
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

async function main() {
  console.log('🔍 Checking AIS data for route extraction...\n');

  // Check voyages
  const voyages = await prisma.voyage.findMany({
    where: {
      status: 'completed',
    },
    include: {
      departurePort: true,
      arrivalPort: true,
      vessel: true,
    },
    take: 5,
  });

  console.log(`Found ${voyages.length} completed voyages\n`);

  for (const voyage of voyages) {
    console.log(`Voyage: ${voyage.id}`);
    console.log(`  Vessel: ${voyage.vessel.name} (${voyage.vessel.type})`);
    console.log(`  Route: ${voyage.departurePort?.name} → ${voyage.arrivalPort?.name}`);
    console.log(`  Departure: ${voyage.departureTime}`);
    console.log(`  Arrival: ${voyage.arrivalTime}`);

    if (voyage.departureTime && voyage.arrivalTime) {
      // Check AIS positions for this vessel during this voyage
      const positions = await prisma.vesselPosition.count({
        where: {
          vesselId: voyage.vesselId,
          timestamp: {
            gte: voyage.departureTime,
            lte: voyage.arrivalTime,
          },
        },
      });

      console.log(`  AIS positions: ${positions}`);

      if (positions > 0) {
        // Get position details
        const samplePositions = await prisma.vesselPosition.findMany({
          where: {
            vesselId: voyage.vesselId,
            timestamp: {
              gte: voyage.departureTime,
              lte: voyage.arrivalTime,
            },
          },
          orderBy: { timestamp: 'asc' },
          take: 3,
        });

        console.log(`  Sample positions:`);
        for (const pos of samplePositions) {
          console.log(`    ${pos.timestamp}: (${pos.latitude}, ${pos.longitude}) @ ${pos.speedOverGround || 'N/A'} knots`);
        }
      }
    }
    console.log();
  }

  // Check total AIS positions
  const totalPositions = await prisma.vesselPosition.count();
  console.log(`\nTotal AIS positions in database: ${totalPositions.toLocaleString()}`);

  // Check vessels with positions
  const vesselsWithPositions = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT vessel_id) as count
    FROM vessel_positions
  `;
  console.log(`Vessels with AIS data: ${(vesselsWithPositions as any)[0]?.count || 0}`);

  // Check position date range
  const dateRange = await prisma.$queryRaw`
    SELECT
      MIN(timestamp) as earliest,
      MAX(timestamp) as latest
    FROM vessel_positions
  `;
  console.log(`AIS date range: ${(dateRange as any)[0]?.earliest} to ${(dateRange as any)[0]?.latest}`);

  await prisma.$disconnect();
}

main().catch(console.error);
