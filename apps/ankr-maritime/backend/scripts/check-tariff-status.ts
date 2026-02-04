#!/usr/bin/env tsx
/**
 * Check Tariff Status - Review all scraped data
 */

import { prisma } from '../src/lib/prisma.js';

async function main() {
  // Count real vs simulated tariffs
  const realTariffs = await prisma.portTariff.count({
    where: { dataSource: 'REAL_SCRAPED' }
  });

  const simulatedTariffs = await prisma.portTariff.count({
    where: { dataSource: 'SIMULATED' }
  });

  console.log('📊 Tariff Data Summary');
  console.log('======================');
  console.log(`✅ Real Scraped Tariffs: ${realTariffs}`);
  console.log(`🔴 Simulated Tariffs: ${simulatedTariffs}`);
  console.log(`📈 Total Tariffs: ${realTariffs + simulatedTariffs}\n`);

  // Get real tariffs by port
  const realByPort = await prisma.portTariff.groupBy({
    by: ['portId'],
    where: { dataSource: 'REAL_SCRAPED' },
    _count: true
  });

  console.log('🚢 Real Tariffs by Port:');
  console.log('========================');

  for (const item of realByPort) {
    const port = await prisma.port.findUnique({
      where: { id: item.portId }
    });
    console.log(`  ${port?.name} (${port?.unlocode}): ${item._count} tariffs`);
  }

  console.log('\n📋 Sample Real Tariff Details:');
  console.log('===============================');

  // Get sample tariffs from each scraped port
  const scrapedPorts = ['INMUN', 'INKDL', 'INMUN1', 'INNSA', 'LKCMB', 'AEJEA', 'SAJED', 'AEFJR'];

  for (const unlocode of scrapedPorts) {
    const port = await prisma.port.findFirst({ where: { unlocode } });
    if (!port) continue;

    const tariffs = await prisma.portTariff.findMany({
      where: {
        portId: port.id,
        dataSource: 'REAL_SCRAPED'
      },
      take: 3,
      orderBy: { chargeType: 'asc' }
    });

    if (tariffs.length > 0) {
      console.log(`\n${port.name} (${unlocode}):`);
      for (const t of tariffs) {
        const sizeInfo = t.sizeRangeMin || t.sizeRangeMax
          ? ` [${t.sizeRangeMin || '0'}-${t.sizeRangeMax || '∞'} GRT]`
          : '';
        console.log(`  • ${t.chargeType}: ${t.currency} ${t.amount} per ${t.unit}${sizeInfo}`);
      }
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
