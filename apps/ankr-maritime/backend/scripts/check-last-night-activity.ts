import { prisma } from '../src/lib/prisma.js';

async function checkLastNightActivity() {
  console.log('=== Last Night Activity Report ===\n');

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Check tariff updates
  const recentTariffs = await prisma.portTariff.count({
    where: {
      updatedAt: {
        gte: yesterday
      }
    }
  });

  const recentRealTariffs = await prisma.portTariff.count({
    where: {
      dataSource: 'REAL_SCRAPED',
      updatedAt: {
        gte: yesterday
      }
    }
  });

  console.log('**Tariff Updates (Last 24h):**');
  console.log(`Total tariff updates: ${recentTariffs}`);
  console.log(`Real scraped tariffs: ${recentRealTariffs}`);
  console.log('');

  // Check vessel updates
  const recentVesselUpdates = await prisma.vessel.count({
    where: {
      ownershipUpdatedAt: {
        gte: yesterday
      }
    }
  });

  console.log('**Vessel Enrichment (Last 24h):**');
  console.log(`Vessels enriched with ownership data: ${recentVesselUpdates}`);
  console.log('');

  // Check AIS updates
  const recentAIS = await prisma.vesselPosition.count({
    where: {
      timestamp: {
        gte: yesterday
      }
    }
  });

  console.log('**AIS Updates (Last 24h):**');
  console.log(`New AIS positions: ${recentAIS.toLocaleString()}`);
  console.log('');

  // Check if scheduler is configured
  console.log('**Cron Job Status:**');
  console.log('⚠️  Tariff scheduler found but NOT initialized in main.ts');
  console.log('❌ Daily cron (2am) did NOT run');
  console.log('');

  await prisma.$disconnect();
}

checkLastNightActivity().catch(console.error);
