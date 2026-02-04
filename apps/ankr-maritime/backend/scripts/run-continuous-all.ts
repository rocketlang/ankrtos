#!/usr/bin/env tsx
/**
 * Master Continuous Service Runner
 * Runs BOTH port scraper AND AISstream simultaneously
 *
 * Usage:
 *   tsx scripts/run-continuous-all.ts
 */

import { aisStreamService } from '../src/services/aisstream-service.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function main() {
  console.log('═'.repeat(80));
  console.log('🚀 Mari8X Continuous Services - Starting...');
  console.log('═'.repeat(80));
  console.log();

  // Start AISstream in background
  console.log('🌊 Starting AISstream.io connection...');
  try {
    await aisStreamService.connect({
      // Start with specific regions (less data)
      boundingBoxes: [
        [[22.0, 113.0], [23.0, 115.0]], // Hong Kong/Shenzhen
        [[1.0, 103.0], [2.0, 104.5]],   // Singapore
        [[33.0, -119.0], [34.0, -117.0]], // Los Angeles
      ],
      messageTypes: ['PositionReport', 'ShipStaticData']
    });

    console.log('✅ AISstream connected and streaming!');
    console.log();
  } catch (error: any) {
    console.error('❌ AISstream failed:', error.message);
    console.log('⚠️  Continuing without AIS...');
  }

  // Start port scraper loop
  console.log('🔄 Starting continuous port scraper...');
  console.log();

  // Run port scraper every 5 minutes
  let iteration = 1;
  while (true) {
    console.log('─'.repeat(80));
    console.log(`🔄 Port Scraper Iteration #${iteration}`);
    console.log(`⏰ ${new Date().toLocaleString()}`);
    console.log('─'.repeat(80));
    console.log();

    try {
      const { stdout, stderr } = await execAsync(
        'npx tsx scripts/scrape-ports-continuous.ts --ports 10',
        { cwd: '/root/apps/ankr-maritime/backend' }
      );
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error: any) {
      console.error('❌ Port scraper error:', error.message);
    }

    // Show AIS stats
    const aisStats = aisStreamService.getStats();
    console.log();
    console.log('📊 AIS Stats:');
    console.log(`   Connected: ${aisStats.connected ? '✅ Yes' : '❌ No'}`);
    console.log(`   Messages: ${aisStats.messageCount}`);
    console.log(`   Last message: ${aisStats.lastMessageTime?.toLocaleString() || 'Never'}`);
    console.log();

    // Wait 5 minutes before next iteration
    console.log('⏰ Next port scrape in 5 minutes...');
    console.log();
    await delay(5 * 60 * 1000);

    iteration++;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log();
  console.log('🛑 Shutting down...');
  aisStreamService.disconnect();
  process.exit(0);
});

main().catch(error => {
  console.error('💥 Fatal error:', error);
  aisStreamService.disconnect();
  process.exit(1);
});
