#!/usr/bin/env tsx
/**
 * Enhanced Master Continuous Service Runner
 * Runs port scraper + AISstream with configurable trade areas
 *
 * Usage:
 *   tsx scripts/run-continuous-all-enhanced.ts --preset user_specified --ports 20
 *   tsx scripts/run-continuous-all-enhanced.ts --preset asia_pacific --region south_china_sea
 */

import { aisStreamService } from '../src/services/aisstream-service.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { AIS_PRESETS } from './configure-ais-trade-areas.js';

const execAsync = promisify(exec);

interface CliOptions {
  aisPreset: keyof typeof AIS_PRESETS;
  portsPerBatch: number;
  portRegion?: string;
  portPriority?: number;
  scrapeInterval: number; // minutes
}

async function main() {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    aisPreset: 'user_specified', // Default to user's areas
    portsPerBatch: 10,
    scrapeInterval: 5,
  };

  // Parse CLI arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--preset') {
      options.aisPreset = args[i + 1] as keyof typeof AIS_PRESETS;
    } else if (args[i] === '--ports') {
      options.portsPerBatch = parseInt(args[i + 1]);
    } else if (args[i] === '--region') {
      options.portRegion = args[i + 1];
    } else if (args[i] === '--priority') {
      options.portPriority = parseInt(args[i + 1]);
    } else if (args[i] === '--interval') {
      options.scrapeInterval = parseInt(args[i + 1]);
    }
  }

  console.log('═'.repeat(80));
  console.log('🚀 Mari8X Enhanced Continuous Services - Starting...');
  console.log('═'.repeat(80));
  console.log();

  const aisConfig = AIS_PRESETS[options.aisPreset];
  console.log(`📍 AIS Configuration: ${aisConfig.name}`);
  console.log(`   Tracking ${aisConfig.boundingBoxes.length} geographic areas`);
  console.log();

  // Start AISstream in background
  console.log('🌊 Starting AISstream.io connection...');
  try {
    await aisStreamService.connect({
      boundingBoxes: aisConfig.boundingBoxes,
      messageTypes: ['PositionReport', 'ShipStaticData'],
    });

    console.log('✅ AISstream connected and streaming!');
    console.log();
  } catch (error: any) {
    console.error('❌ AISstream failed:', error.message);
    console.log('⚠️  Continuing without AIS...');
  }

  // Build port scraper command
  let scrapeCommand = `npx tsx scripts/scrape-ports-800-continuous.ts --ports ${options.portsPerBatch}`;
  if (options.portRegion) {
    scrapeCommand += ` --region ${options.portRegion}`;
  }
  if (options.portPriority) {
    scrapeCommand += ` --priority ${options.portPriority}`;
  }

  console.log('🔄 Starting continuous port scraper...');
  console.log(`   Command: ${scrapeCommand}`);
  console.log(`   Interval: ${options.scrapeInterval} minutes`);
  console.log();

  // Run port scraper loop
  let iteration = 1;
  while (true) {
    console.log('─'.repeat(80));
    console.log(`🔄 Scraper Iteration #${iteration}`);
    console.log(`⏰ ${new Date().toLocaleString()}`);
    console.log('─'.repeat(80));
    console.log();

    try {
      const { stdout, stderr } = await execAsync(scrapeCommand, {
        cwd: '/root/apps/ankr-maritime/backend',
      });
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
    console.log(`   Messages: ${aisStats.messageCount.toLocaleString()}`);
    console.log(
      `   Last message: ${aisStats.lastMessageTime?.toLocaleString() || 'Never'}`
    );
    console.log(
      `   Rate: ${aisStats.messagesPerMinute || 0} messages/minute`
    );
    console.log();

    // Wait before next iteration
    console.log(`⏰ Next scrape in ${options.scrapeInterval} minutes...`);
    console.log();
    await delay(options.scrapeInterval * 60 * 1000);

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
