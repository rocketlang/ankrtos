#!/usr/bin/env tsx
import { prisma } from '../src/lib/prisma.js';

async function checkRecentPositions() {
  console.log('🔍 Checking recent AIS positions for Priority 1 fields...\n');

  // Get latest 10 positions
  const recent = await prisma.vesselPosition.findMany({
    take: 10,
    orderBy: { timestamp: 'desc' },
    select: {
      timestamp: true,
      vessel: { select: { name: true } },
      draught: true,
      navigationStatus: true,
      rateOfTurn: true,
      positionAccuracy: true,
      maneuverIndicator: true,
      raimFlag: true,
      timestampSeconds: true,
      dimensionToBow: true,
      dimensionToStern: true,
    }
  });

  console.log('Most Recent Positions (last 10):');
  console.log('═'.repeat(80));

  for (const pos of recent) {
    console.log(`${pos.vessel.name} @ ${pos.timestamp.toISOString()}`);
    console.log(`  draught: ${pos.draught}, navStatus: ${pos.navigationStatus}, ROT: ${pos.rateOfTurn}`);
    console.log(`  accuracy: ${pos.positionAccuracy}, maneuver: ${pos.maneuverIndicator}, raim: ${pos.raimFlag}`);
    console.log(`  timestamp: ${pos.timestampSeconds}, bow: ${pos.dimensionToBow}, stern: ${pos.dimensionToStern}`);
    console.log('');
  }

  // Count non-null Priority 1 fields in recent data (last hour)
  const recentCount = await prisma.vesselPosition.count({
    where: {
      timestamp: {
        gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
      }
    }
  });

  const withDraught = await prisma.vesselPosition.count({
    where: {
      timestamp: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      draught: { not: null }
    }
  });

  const withNavStatus = await prisma.vesselPosition.count({
    where: {
      timestamp: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      navigationStatus: { not: null }
    }
  });

  const withRateOfTurn = await prisma.vesselPosition.count({
    where: {
      timestamp: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      rateOfTurn: { not: null }
    }
  });

  console.log('═'.repeat(80));
  console.log(`📊 Last Hour Statistics (${recentCount} positions):`);
  console.log(`  With Draught: ${withDraught} (${((withDraught/recentCount)*100).toFixed(1)}%)`);
  console.log(`  With Nav Status: ${withNavStatus} (${((withNavStatus/recentCount)*100).toFixed(1)}%)`);
  console.log(`  With Rate of Turn: ${withRateOfTurn} (${((withRateOfTurn/recentCount)*100).toFixed(1)}%)`);

  await prisma.$disconnect();
}

checkRecentPositions().catch(console.error);
