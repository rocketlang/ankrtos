#!/usr/bin/env tsx
/**
 * Run Real Port Tariff Scrapers
 * Scrapes actual tariff data from port authority websites
 */

import { portScraperManager } from '../src/services/port-scrapers/index.js';

async function main() {
  console.log('🚢 Mari8X Real Port Tariff Scraper');
  console.log('===================================\n');

  try {
    // Show current stats
    console.log('📊 Current Statistics:');
    const stats = await portScraperManager.getStats();
    console.log(`Total scrapers registered: ${stats.totalScrapers}`);
    console.log(`Active scrapers: ${stats.activeScrapers}`);
    console.log(`Real tariffs in DB: ${stats.realTariffs}`);
    console.log(`Simulated tariffs in DB: ${stats.simulatedTariffs}`);
    console.log('');

    console.log('Registered ports:');
    stats.registeredPorts.forEach((p: any) => {
      const badge = p.status === 'active' ? '✅' : '⏸️ ';
      console.log(`  ${badge} ${p.name} (${p.unlocode}) - Priority ${p.priority}`);
    });
    console.log('');

    // Scrape Phase 1 ports
    console.log('🚀 Starting Phase 1: First 2 ports (Singapore, Mumbai)');
    console.log('Each port will have 30s delay for respectful scraping\n');

    const phase1Ports = ['SGSIN', 'INMUN'];

    for (const unlocode of phase1Ports) {
      await portScraperManager.scrapePort(unlocode);

      if (phase1Ports.indexOf(unlocode) < phase1Ports.length - 1) {
        console.log('⏳ Waiting 30s before next port...\n');
        await sleep(30000);
      }
    }

    // Show updated stats
    console.log('\n📊 Updated Statistics:');
    const newStats = await portScraperManager.getStats();
    console.log(`Real tariffs: ${stats.realTariffs} → ${newStats.realTariffs} (+${newStats.realTariffs - stats.realTariffs})`);
    console.log(`Simulated tariffs: ${stats.simulatedTariffs} (unchanged)`);

    console.log('\n✅ Real port scraping complete!');
    console.log('\n💡 Next steps:');
    console.log('  1. Check frontend - real tariffs should have ✅ badge');
    console.log('  2. Simulated tariffs should have 🔴 badge');
    console.log('  3. Add remaining 6 ports from Phase 1');
    console.log('  4. Start adding 10 new ports per day');

  } catch (error) {
    console.error('❌ Error running scrapers:', error);
    process.exit(1);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main();
