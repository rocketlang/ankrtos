#!/usr/bin/env tsx
/**
 * Analyze AIS position data to find actual voyages
 * This will help us understand what data we have and extract routes directly from positions
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

async function main() {
  console.log('🔍 Analyzing AIS position data for voyage detection...\n');

  // Get total position count
  const totalPositions = await prisma.vesselPosition.count();
  console.log(`Total AIS positions: ${totalPositions.toLocaleString()}\n`);

  // Get vessels with significant position data
  const vesselsWithData = await prisma.$queryRaw<Array<{ vesselId: string; count: number; minTime: Date; maxTime: Date }>>`
    SELECT
      "vesselId",
      COUNT(*)::int as count,
      MIN(timestamp) as "minTime",
      MAX(timestamp) as "maxTime"
    FROM vessel_positions
    GROUP BY "vesselId"
    HAVING COUNT(*) > 100
    ORDER BY COUNT(*) DESC
    LIMIT 10
  `;

  console.log(`Top 10 vessels by AIS position count:`);
  console.log('─'.repeat(100));

  for (const vessel of vesselsWithData) {
    const vesselInfo = await prisma.vessel.findUnique({
      where: { id: vessel.vesselId },
      select: { name: true, type: true, imo: true },
    });

    const days = Math.floor((vessel.maxTime.getTime() - vessel.minTime.getTime()) / (1000 * 60 * 60 * 24));

    console.log(`\n${vesselInfo?.name || 'Unknown'} (${vesselInfo?.type || 'unknown'})`);
    console.log(`  IMO: ${vesselInfo?.imo || 'N/A'}`);
    console.log(`  Positions: ${vessel.count.toLocaleString()}`);
    console.log(`  Date range: ${vessel.minTime.toISOString().split('T')[0]} to ${vessel.maxTime.toISOString().split('T')[0]} (${days} days)`);

    // Sample positions to check for port proximity data
    const samplePositions = await prisma.vesselPosition.findMany({
      where: { vesselId: vessel.vesselId },
      orderBy: { timestamp: 'asc' },
      take: 5,
      select: {
        timestamp: true,
        latitude: true,
        longitude: true,
        speed: true,
        navigationStatus: true,
        destination: true,
      },
    });

    console.log(`  Sample positions:`);
    for (const pos of samplePositions) {
      console.log(`    ${pos.timestamp.toISOString()}: (${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)}) @ ${pos.speed?.toFixed(1) || 'N/A'} kts, nav:${pos.navigationStatus || 'N/A'}, dest: ${pos.destination || 'N/A'}`);
    }

    // Check for movement patterns (underway vs at anchor)
    const movementStats = await prisma.$queryRaw<Array<{ status: number | null; count: number }>>`
      SELECT
        "navigationStatus" as status,
        COUNT(*)::int as count
      FROM vessel_positions
      WHERE "vesselId" = ${vessel.vesselId}
      GROUP BY "navigationStatus"
      ORDER BY count DESC
    `;

    console.log(`  Navigation status distribution:`);
    for (const stat of movementStats) {
      const statusName = stat.status === 0 ? 'Underway' :
                        stat.status === 1 ? 'At anchor' :
                        stat.status === 5 ? 'Moored' :
                        stat.status === null ? 'Unknown' :
                        `Status ${stat.status}`;
      console.log(`    ${statusName}: ${stat.count.toLocaleString()}`);
    }
  }

  console.log('\n\n📊 Summary:');
  console.log('─'.repeat(100));
  console.log(`\nWe have ${totalPositions.toLocaleString()} AIS positions from ${vesselsWithData.length} vessels with >100 positions each.`);
  console.log('\nNext steps:');
  console.log('1. Modify route extractor to work directly from AIS position data');
  console.log('2. Detect voyages by analyzing position gaps and port proximity');
  console.log('3. Extract routes without relying on the voyages table\n');

  await prisma.$disconnect();
}

main().catch(console.error);
