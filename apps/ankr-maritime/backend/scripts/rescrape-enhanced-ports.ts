#!/usr/bin/env tsx
/**
 * Re-scrape ports with enhanced terminal/berth specific tariffs
 * Delete existing real tariffs and re-import
 */

import { prisma } from '../src/lib/prisma.js';
import { portScraperManager } from '../src/services/port-scrapers/index.js';

async function main() {
  console.log('🔄 Re-scraping Enhanced Ports');
  console.log('==============================\n');

  const portsToRescrape = [
    { unlocode: 'INMUN', name: 'Mumbai Port Trust' },
    { unlocode: 'INNSA', name: 'JNPT (Nhava Sheva)' },
  ];

  for (const portInfo of portsToRescrape) {
    console.log(`\n📍 Processing ${portInfo.name} (${portInfo.unlocode})...`);

    // Find port in database
    const port = await prisma.port.findFirst({
      where: { unlocode: portInfo.unlocode }
    });

    if (!port) {
      console.log(`⚠️  Port not found in database`);
      continue;
    }

    // Delete existing REAL_SCRAPED tariffs
    const deleted = await prisma.portTariff.deleteMany({
      where: {
        portId: port.id,
        dataSource: 'REAL_SCRAPED'
      }
    });

    console.log(`🗑️  Deleted ${deleted.count} old tariffs`);

    // Re-scrape with new data
    await portScraperManager.scrapePort(portInfo.unlocode);

    // Wait between ports
    if (portsToRescrape.indexOf(portInfo) < portsToRescrape.length - 1) {
      console.log('\n⏳ Waiting 10s before next port...');
      await sleep(10000);
    }
  }

  console.log('\n\n📊 Final Summary:');
  console.log('=================');

  for (const portInfo of portsToRescrape) {
    const port = await prisma.port.findFirst({
      where: { unlocode: portInfo.unlocode }
    });

    if (port) {
      const count = await prisma.portTariff.count({
        where: {
          portId: port.id,
          dataSource: 'REAL_SCRAPED'
        }
      });

      console.log(`  ${portInfo.name}: ${count} tariffs`);
    }
  }

  await prisma.$disconnect();
  console.log('\n✅ Re-scraping complete!');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);
