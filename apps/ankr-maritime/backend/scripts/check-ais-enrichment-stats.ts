#!/usr/bin/env tsx
import { prisma } from '../src/lib/prisma.js';

async function checkStats() {
  console.log('📊 AIS & Enrichment Status\n');

  // Total vessels in database
  const totalVessels = await prisma.vessel.count();
  console.log('Total Vessels in Database:', totalVessels.toLocaleString());

  // Vessels with AIS positions
  const vesselsWithAIS = await prisma.vessel.count({
    where: {
      positions: {
        some: {}
      }
    }
  });
  console.log('Vessels with AIS Positions:', vesselsWithAIS.toLocaleString());

  // Total AIS positions tracked
  const totalPositions = await prisma.vesselPosition.count();
  console.log('Total AIS Position Records:', totalPositions.toLocaleString());

  console.log('\n🏢 Vessel Enrichment Status\n');

  // Vessels with owner/operator data (enriched)
  const enrichedVessels = await prisma.vessel.count({
    where: {
      OR: [
        { registeredOwner: { not: null } },
        { operator: { not: null } },
        { shipManager: { not: null } }
      ]
    }
  });
  console.log('Enriched Vessels (with ownership data):', enrichedVessels.toLocaleString());

  // Vessels needing enrichment
  const needsEnrichment = totalVessels - enrichedVessels;
  console.log('Vessels Needing Enrichment:', needsEnrichment.toLocaleString());

  // Enrichment percentage
  const enrichmentRate = ((enrichedVessels / totalVessels) * 100).toFixed(2);
  console.log('Enrichment Rate:', enrichmentRate + '%');

  console.log('\n📈 Recent AIS Activity (Last 24 Hours)\n');

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentPositions = await prisma.vesselPosition.count({
    where: {
      timestamp: { gte: oneDayAgo }
    }
  });
  console.log('AIS Positions (Last 24h):', recentPositions.toLocaleString());

  const activeVessels = await prisma.vessel.count({
    where: {
      positions: {
        some: {
          timestamp: { gte: oneDayAgo }
        }
      }
    }
  });
  console.log('Active Vessels (Last 24h):', activeVessels.toLocaleString());

  console.log('\n🎯 Priority 1 Field Coverage\n');

  // Vessels with Priority 1 AIS fields
  const withDraught = await prisma.vesselPosition.count({
    where: { draught: { not: null } }
  });

  const withNavStatus = await prisma.vesselPosition.count({
    where: { navigationStatus: { not: null } }
  });

  const withRateOfTurn = await prisma.vesselPosition.count({
    where: { rateOfTurn: { not: null } }
  });

  console.log('Positions with Draught:', withDraught.toLocaleString());
  console.log('Positions with Navigation Status:', withNavStatus.toLocaleString());
  console.log('Positions with Rate of Turn:', withRateOfTurn.toLocaleString());

  console.log('\n═══════════════════════════════════════\n');
  console.log('SUMMARY:');
  console.log(`  📍 Tracking: ${vesselsWithAIS.toLocaleString()}/${totalVessels.toLocaleString()} vessels (${((vesselsWithAIS / totalVessels) * 100).toFixed(1)}%)`);
  console.log(`  🏢 Enriched: ${enrichedVessels.toLocaleString()}/${totalVessels.toLocaleString()} vessels (${enrichmentRate}%)`);
  console.log(`  📊 Total Positions: ${totalPositions.toLocaleString()}`);
  console.log(`  ⚡ Active (24h): ${activeVessels.toLocaleString()} vessels`);

  await prisma.$disconnect();
}

checkStats().catch(console.error);
