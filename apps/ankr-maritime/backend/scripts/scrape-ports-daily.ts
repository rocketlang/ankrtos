#!/usr/bin/env tsx
/**
 * Daily Port Tariff Scraper
 * Run via cron: 0 2 * * * (2 AM daily)
 *
 * Usage:
 *   tsx scripts/scrape-ports-daily.ts
 *   tsx scripts/scrape-ports-daily.ts --target 15 (custom daily target)
 */

import { portTariffScraperService } from '../src/services/port-tariff-scraper.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Mari8X Port Tariff Scraper - Daily Batch');
  console.log('='.repeat(60));
  console.log();

  // Parse CLI args
  const args = process.argv.slice(2);
  const targetIndex = args.indexOf('--target');
  const dailyTarget = targetIndex >= 0 ? parseInt(args[targetIndex + 1]) : 10;

  console.log(`Daily Target: ${dailyTarget} ports`);
  console.log(`Started: ${new Date().toLocaleString()}`);
  console.log();

  // Get current progress
  const progress = await portTariffScraperService.getProgress();
  console.log('Current Progress:');
  console.log(`  Total Ports: ${progress.totalPorts}`);
  console.log(`  Scraped: ${progress.scrapedPorts} (${progress.percentComplete.toFixed(1)}%)`);
  console.log(`  Failed: ${progress.failedPorts}`);
  console.log(`  Pending: ${progress.pendingPorts}`);
  console.log(`  ETA: ${progress.estimatedDaysRemaining} days`);
  console.log();

  // Run daily batch
  console.log('Running scraping batch...');
  console.log('-'.repeat(60));

  const result = await portTariffScraperService.runDailyBatch();

  console.log();
  console.log('Batch Results:');
  console.log(`  Jobs Completed: ${result.jobsCompleted}`);
  console.log(`  Jobs Failed: ${result.jobsFailed}`);
  console.log(`  Total Tariffs Extracted: ${result.totalTariffsExtracted}`);
  console.log(`  Next Batch: ${result.nextBatchAt.toLocaleString()}`);
  console.log();

  // Updated progress
  const updatedProgress = await portTariffScraperService.getProgress();
  console.log('Updated Progress:');
  console.log(`  Scraped: ${updatedProgress.scrapedPorts} (+${updatedProgress.scrapedPorts - progress.scrapedPorts})`);
  console.log(`  Completion: ${updatedProgress.percentComplete.toFixed(1)}%`);
  console.log(`  ETA: ${updatedProgress.estimatedDaysRemaining} days`);
  console.log();

  console.log('='.repeat(60));
  console.log('Scraping batch completed successfully!');
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error running scraping batch:', error);
    process.exit(1);
  });
