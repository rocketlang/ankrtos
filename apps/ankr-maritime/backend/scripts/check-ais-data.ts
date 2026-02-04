/**
 * Check AIS position data for route engine
 */

import { prisma } from '../src/lib/prisma.js';

async function main() {
  console.log('🛰️  Checking AIS Data for Route Engine\n');

  // Count total positions
  const totalPositions = await prisma.vesselPosition.count();
  console.log(`Total AIS positions: ${totalPositions.toLocaleString()}`);

  // Count vessels with positions
  const vesselsWithPositions = await prisma.vessel.count({
    where: {
      positions: {
        some: {}
      }
    }
  });
  console.log(`Vessels with AIS data: ${vesselsWithPositions.toLocaleString()}`);

  // Get recent positions
  const recent = await prisma.vesselPosition.findMany({
    take: 10,
    orderBy: { timestamp: 'desc' },
    include: {
      vessel: {
        select: {
          name: true,
          imo: true,
          type: true
        }
      }
    }
  });

  console.log('\n📍 Recent AIS Positions:');
  recent.forEach((p, i) => {
    console.log(`${i + 1}. ${p.vessel.name} (${p.vessel.imo})`);
    console.log(`   Position: ${p.latitude.toFixed(4)}°, ${p.longitude.toFixed(4)}°`);
    console.log(`   Speed: ${p.speed} knots | Course: ${p.course}°`);
    console.log(`   Status: ${p.navigationStatus || 'Unknown'}`);
    console.log(`   Time: ${p.timestamp.toISOString()}`);
    console.log('');
  });

  // Count positions by navigation status
  const statuses = await prisma.$queryRaw<Array<{ navigationStatus: string; count: bigint }>>`
    SELECT "navigationStatus", COUNT(*) as count
    FROM "VesselPosition"
    WHERE "navigationStatus" IS NOT NULL
    GROUP BY "navigationStatus"
    ORDER BY count DESC
    LIMIT 10
  `;

  console.log('📊 Vessels by Navigation Status:');
  statuses.forEach(s => {
    console.log(`   ${s.navigationStatus}: ${Number(s.count).toLocaleString()}`);
  });

  await prisma.$disconnect();
}

main();
