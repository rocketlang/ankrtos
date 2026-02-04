import { prisma } from '../src/lib/prisma.js';

async function checkAISAndGISIS() {
  console.log('=== AIS & IMO GISIS Enrichment Status ===\n');

  // 1. Check AIS vessel positions
  const aisPositions = await prisma.vesselPosition.count();
  const uniqueVesselsWithAIS = await prisma.vesselPosition.groupBy({
    by: ['vesselId'],
    _count: true
  });

  const aisFromRealTime = await prisma.vesselPosition.count({
    where: {
      OR: [
        { source: 'ais_terrestrial' },
        { source: 'ais_satellite' },
        { source: 'spire' }
      ]
    }
  });

  console.log('**AIS Data:**');
  console.log(`Total AIS position records: ${aisPositions.toLocaleString()}`);
  console.log(`Unique vessels with AIS data: ${uniqueVesselsWithAIS.length.toLocaleString()}`);
  console.log(`Real-time AIS positions: ${aisFromRealTime.toLocaleString()}`);
  console.log('');

  // 2. Check vessels with IMO numbers
  const totalVessels = await prisma.vessel.count();
  const vesselsWithIMO = await prisma.vessel.count({
    where: {
      imo: { not: '' }
    }
  });

  console.log('**Vessel Registry:**');
  console.log(`Total vessels in database: ${totalVessels.toLocaleString()}`);
  console.log(`Vessels with IMO numbers: ${vesselsWithIMO.toLocaleString()}`);
  console.log('');

  // 3. Check Equasis enrichment (ownership data)
  const vesselsWithOwner = await prisma.vessel.count({
    where: {
      AND: [
        { imo: { not: '' } },
        { OR: [
          { registeredOwner: { not: null } },
          { shipManager: { not: null } },
          { operator: { not: null } }
        ]}
      ]
    }
  });

  const vesselsWithFlag = await prisma.vessel.count({
    where: {
      AND: [
        { imo: { not: '' } },
        { flag: { not: '' } }
      ]
    }
  });

  const vesselsWithYearBuilt = await prisma.vessel.count({
    where: {
      AND: [
        { imo: { not: '' } },
        { yearBuilt: { not: null } }
      ]
    }
  });

  console.log('**Equasis Enrichment (ownership data from Equasis scraper):**');
  console.log(`Vessels with owner/operator data: ${vesselsWithOwner.toLocaleString()} (${((vesselsWithOwner/vesselsWithIMO)*100).toFixed(1)}%)`);
  console.log(`Vessels with flag data: ${vesselsWithFlag.toLocaleString()} (${((vesselsWithFlag/vesselsWithIMO)*100).toFixed(1)}%)`);
  console.log(`Vessels with year built data: ${vesselsWithYearBuilt.toLocaleString()} (${((vesselsWithYearBuilt/vesselsWithIMO)*100).toFixed(1)}%)`);
  console.log('');

  // 4. Check recent AIS updates
  const recentAIS = await prisma.vesselPosition.count({
    where: {
      timestamp: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    }
  });

  console.log('**Recent Activity:**');
  console.log(`AIS positions in last 24h: ${recentAIS.toLocaleString()}`);
  console.log('');

  // 5. Sample of vessels with full enrichment
  const fullyEnrichedVessels = await prisma.vessel.findMany({
    where: {
      AND: [
        { imo: { not: '' } },
        { registeredOwner: { not: null } },
        { flag: { not: null } },
        { yearBuilt: { not: null } }
      ]
    },
    take: 5,
    select: {
      name: true,
      imo: true,
      registeredOwner: true,
      shipManager: true,
      operator: true,
      flag: true,
      yearBuilt: true,
      type: true,
      ownershipUpdatedAt: true
    }
  });

  if (fullyEnrichedVessels.length > 0) {
    console.log('**Sample Fully Enriched Vessels (via Equasis):**');
    fullyEnrichedVessels.forEach((v, i) => {
      console.log(`${i+1}. ${v.name} (IMO: ${v.imo})`);
      console.log(`   Owner: ${v.registeredOwner}`);
      console.log(`   Manager: ${v.shipManager || 'N/A'}`);
      console.log(`   Operator: ${v.operator || 'N/A'}`);
      console.log(`   Flag: ${v.flag}, Year: ${v.yearBuilt}, Type: ${v.type}`);
      console.log(`   Last Updated: ${v.ownershipUpdatedAt ? v.ownershipUpdatedAt.toISOString().split('T')[0] : 'Never'}`);
      console.log('');
    });
  }

  await prisma.$disconnect();
}

checkAISAndGISIS().catch(console.error);
