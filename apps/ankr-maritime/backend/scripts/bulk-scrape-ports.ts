#!/usr/bin/env tsx
/**
 * Bulk Port Scraping Script - Week 3 Day 3
 * Scrapes real tariff data from multiple ports in parallel
 *
 * Usage:
 *   npm run scrape:all             # Scrape all active ports
 *   npm run scrape:ports INMUN INNSA SGSIN  # Scrape specific ports
 *   npm run scrape:priority 1      # Scrape priority 1 ports only
 */

import { PrismaClient } from '@prisma/client';
import { portScraperManager, PORT_SCRAPER_REGISTRY } from '../src/services/port-scrapers/index.js';

const prisma = new PrismaClient();

interface ScrapeOptions {
  ports?: string[]; // Specific port UNLOCODEs
  priority?: number; // Priority filter (1-10)
  parallel?: boolean; // Run in parallel
  maxConcurrent?: number; // Max concurrent scrapers
  delayMs?: number; // Delay between ports
  dryRun?: boolean; // Don't actually scrape, just preview
}

async function main() {
  console.log('🚀 Mari8X Bulk Port Scraping\n');

  const args = process.argv.slice(2);
  const command = args[0];

  let options: ScrapeOptions = {
    parallel: false,
    maxConcurrent: 5,
    delayMs: 30000, // 30 seconds
    dryRun: false,
  };

  let portsToScrape: string[] = [];

  // Parse command
  if (command === 'all') {
    // Scrape all active ports
    portsToScrape = PORT_SCRAPER_REGISTRY
      .filter(e => e.status === 'active')
      .map(e => e.unlocode);
    console.log(`📦 Mode: ALL ACTIVE PORTS (${portsToScrape.length} ports)\n`);
  } else if (command === 'priority') {
    // Scrape by priority
    const priority = parseInt(args[1] || '1');
    portsToScrape = PORT_SCRAPER_REGISTRY
      .filter(e => e.status === 'active' && e.priority <= priority)
      .map(e => e.unlocode);
    console.log(`📦 Mode: PRIORITY ${priority} (${portsToScrape.length} ports)\n`);
  } else if (command === 'ports') {
    // Scrape specific ports
    portsToScrape = args.slice(1).map(p => p.toUpperCase());
    console.log(`📦 Mode: SPECIFIC PORTS (${portsToScrape.length} ports)\n`);
  } else if (command === 'dry-run') {
    // Dry run - preview only
    options.dryRun = true;
    portsToScrape = PORT_SCRAPER_REGISTRY
      .filter(e => e.status === 'active')
      .map(e => e.unlocode)
      .slice(0, 3); // Only first 3 for preview
    console.log(`📦 Mode: DRY RUN (preview ${portsToScrape.length} ports)\n`);
  } else {
    console.log('Usage:');
    console.log('  npm run scrape:all                    # Scrape all active ports');
    console.log('  npm run scrape:ports INMUN INNSA      # Scrape specific ports');
    console.log('  npm run scrape:priority 1             # Scrape priority 1 ports');
    console.log('  npm run scrape:dry-run                # Preview what would be scraped');
    process.exit(0);
  }

  if (portsToScrape.length === 0) {
    console.log('❌ No ports to scrape');
    process.exit(1);
  }

  // Display ports to scrape
  console.log('📋 Ports to scrape:');
  for (const unlocode of portsToScrape) {
    const entry = PORT_SCRAPER_REGISTRY.find(e => e.unlocode === unlocode);
    if (entry) {
      console.log(`   ${entry.portName.padEnd(30)} (${unlocode}) - Priority ${entry.priority}`);
    } else {
      console.log(`   ${unlocode.padEnd(30)} - NOT IN REGISTRY`);
    }
  }
  console.log('');

  if (options.dryRun) {
    console.log('✅ Dry run complete (no scraping performed)');
    await prisma.$disconnect();
    process.exit(0);
  }

  // Get baseline stats
  const beforeStats = await getStats();
  console.log('📊 BEFORE SCRAPING:');
  console.log(`   Real Tariffs: ${beforeStats.realTariffs}`);
  console.log(`   Simulated Tariffs: ${beforeStats.simulatedTariffs}`);
  console.log(`   Real %: ${beforeStats.realPercent.toFixed(1)}%\n`);

  const startTime = Date.now();

  // Start scraping
  try {
    if (options.parallel) {
      await scrapeParallel(portsToScrape, options);
    } else {
      await scrapeSequential(portsToScrape, options);
    }
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }

  const totalTime = Date.now() - startTime;

  // Get final stats
  const afterStats = await getStats();
  console.log('\n📊 AFTER SCRAPING:');
  console.log(`   Real Tariffs: ${afterStats.realTariffs} (+${afterStats.realTariffs - beforeStats.realTariffs})`);
  console.log(`   Simulated Tariffs: ${afterStats.simulatedTariffs}`);
  console.log(`   Real %: ${afterStats.realPercent.toFixed(1)}%`);
  console.log(`   Total Time: ${(totalTime / 1000).toFixed(1)}s\n`);

  // Summary
  generateSummary(beforeStats, afterStats, portsToScrape.length, totalTime);

  await prisma.$disconnect();
  process.exit(0);
}

/**
 * Scrape ports sequentially (respectful, slower)
 */
async function scrapeSequential(ports: string[], options: ScrapeOptions): Promise<void> {
  console.log(`🔄 Scraping ${ports.length} ports SEQUENTIALLY\n`);
  console.log(`   Delay between ports: ${options.delayMs!  / 1000}s\n`);

  for (let i = 0; i < ports.length; i++) {
    const unlocode = ports[i];
    console.log(`\n[${ + 1}/${ports.length}] Scraping ${unlocode}...`);

    try {
      await portScraperManager.scrapePort(unlocode);
    } catch (error: any) {
      console.error(`❌ ${unlocode} failed: ${error.message}`);
    }

    // Delay between ports (except last one)
    if (i < ports.length - 1) {
      const delaySec = options.delayMs! / 1000;
      console.log(`⏳ Waiting ${delaySec}s before next port...`);
      await sleep(options.delayMs!);
    }
  }
}

/**
 * Scrape ports in parallel batches (faster, less respectful)
 */
async function scrapeParallel(ports: string[], options: ScrapeOptions): Promise<void> {
  console.log(`🔄 Scraping ${ports.length} ports IN PARALLEL\n`);
  console.log(`   Max concurrent: ${options.maxConcurrent}`);
  console.log(`   Delay between batches: ${options.delayMs! / 1000}s\n`);

  const maxConcurrent = options.maxConcurrent || 5;

  for (let i = 0; i < ports.length; i += maxConcurrent) {
    const batch = ports.slice(i, i + maxConcurrent);
    const batchNum = Math.floor(i / maxConcurrent) + 1;
    const totalBatches = Math.ceil(ports.length / maxConcurrent);

    console.log(`\n📦 Batch ${batchNum}/${totalBatches}: ${batch.join(', ')}`);

    const promises = batch.map(unlocode =>
      portScraperManager.scrapePort(unlocode).catch(error => {
        console.error(`❌ ${unlocode} failed: ${error.message}`);
      })
    );

    await Promise.all(promises);

    // Delay between batches (except last one)
    if (i + maxConcurrent < ports.length) {
      const delaySec = options.delayMs! / 1000;
      console.log(`⏳ Waiting ${delaySec}s before next batch...`);
      await sleep(options.delayMs!);
    }
  }
}

/**
 * Get current tariff statistics
 */
async function getStats(): Promise<{
  realTariffs: number;
  simulatedTariffs: number;
  totalTariffs: number;
  realPercent: number;
}> {
  const realTariffs = await prisma.portTariff.count({
    where: { dataSource: 'REAL_SCRAPED' }
  });

  const simulatedTariffs = await prisma.portTariff.count({
    where: { dataSource: 'SIMULATED' }
  });

  const totalTariffs = realTariffs + simulatedTariffs;
  const realPercent = totalTariffs > 0 ? (realTariffs / totalTariffs) * 100 : 0;

  return { realTariffs, simulatedTariffs, totalTariffs, realPercent };
}

/**
 * Generate summary report
 */
function generateSummary(
  before: Awaited<ReturnType<typeof getStats>>,
  after: Awaited<ReturnType<typeof getStats>>,
  portCount: number,
  totalTime: number
): void {
  console.log('='.repeat(60));
  console.log('\n📊 SCRAPING SUMMARY\n');

  const tariffsAdded = after.realTariffs - before.realTariffs;
  const percentChange = after.realPercent - before.realPercent;
  const avgTimePerPort = totalTime / portCount;
  const tariffsPerSecond = tariffsAdded / (totalTime / 1000);

  console.log(`Ports Scraped:       ${portCount}`);
  console.log(`Real Tariffs Added:  ${tariffsAdded}`);
  console.log(`Real % Change:       ${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}%`);
  console.log(`Total Time:          ${(totalTime / 1000).toFixed(1)}s`);
  console.log(`Avg Time per Port:   ${(avgTimePerPort / 1000).toFixed(1)}s`);
  console.log(`Tariffs per Second:  ${tariffsPerSecond.toFixed(2)}`);

  console.log('\n' + '='.repeat(60));

  if (tariffsAdded === 0) {
    console.log('\n⚠️  No new tariffs added. Possible reasons:');
    console.log('   - No changes detected (SHA-256 hashing)');
    console.log('   - Scraping failed (check errors above)');
    console.log('   - Ports already have real data');
  } else if (tariffsAdded < portCount * 3) {
    console.log('\n⚠️  Low tariff count per port (<3 per port average)');
    console.log('   - Check scraper implementations');
    console.log('   - Verify port website URLs');
    console.log('   - Review extraction patterns');
  } else {
    console.log('\n✅ Scraping successful!');
    console.log(`   - ${tariffsAdded} new real tariffs added`);
    console.log(`   - ${after.realPercent.toFixed(1)}% of tariffs now real`);
    console.log(`   - ${after.realTariffs}/${after.totalTariffs} total`);
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);
