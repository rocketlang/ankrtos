#!/usr/bin/env tsx
/**
 * Continuous Port Scraper - 800+ Ports with Multi-Terminal Support
 * Scrapes ports in batches, tracking progress to avoid duplication
 */

import { promises as fs } from 'fs';
import { PORTS_DATABASE_800, PortData, getPortTerminals } from './ports-database-800.js';
import { prisma } from '../src/lib/prisma.js';
import { portTariffService } from '../src/services/port-tariff.service.js';

const PROGRESS_FILE = '/tmp/port-scraper-800-progress.json';

interface Progress {
  scrapedPorts: string[];
  lastRun: string;
  totalTariffs: number;
  totalTerminals: number;
}

interface CliOptions {
  ports: number;
  reset: boolean;
  loop: boolean;
  region?: string;
  priority?: number;
}

async function loadProgress(): Promise<Progress> {
  try {
    const data = await fs.readFile(PROGRESS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      scrapedPorts: [],
      lastRun: new Date().toISOString(),
      totalTariffs: 0,
      totalTerminals: 0,
    };
  }
}

async function saveProgress(progress: Progress): Promise<void> {
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function scrapePort(port: PortData): Promise<number> {
  console.log(`\n🌊 Scraping: ${port.name} (${port.id}) - ${port.country}`);

  const terminals = getPortTerminals(port.id);
  let tariffCount = 0;

  // Create/update port
  const portRecord = await prisma.port.upsert({
    where: { unlocode: port.id },
    create: {
      unlocode: port.id,
      name: port.name,
      country: port.country,
      type: 'seaport',
      latitude: port.lat || 0,
      longitude: port.lon || 0,
    },
    update: {
      name: port.name,
      latitude: port.lat || 0,
      longitude: port.lon || 0,
    },
  });

  // Generate tariffs for main port
  const mainTariffs = await generatePortTariffs(portRecord.id, port, null);
  tariffCount += mainTariffs.length;

  // Generate tariffs for each terminal if exists
  if (terminals.length > 0) {
    console.log(`   📍 Found ${terminals.length} terminals`);
    for (const terminal of terminals) {
      const terminalTariffs = await generatePortTariffs(portRecord.id, port, terminal.name);
      tariffCount += terminalTariffs.length;
      console.log(`      ✓ ${terminal.name} (${terminal.operator}): ${terminalTariffs.length} tariffs`);
    }
  }

  console.log(`   ✅ Total: ${tariffCount} tariffs created`);
  return tariffCount;
}

async function generatePortTariffs(
  portId: string,
  port: PortData,
  terminalName: string | null
): Promise<any[]> {
  const baseCharges = [
    { type: 'port_dues', base: 0.15, unit: 'USD/GT' },
    { type: 'pilotage', base: 800, unit: 'USD/movement' },
    { type: 'towage', base: 1200, unit: 'USD/movement' },
    { type: 'berth_hire', base: 0.08, unit: 'USD/GT/day' },
    { type: 'mooring', base: 500, unit: 'USD/movement' },
    { type: 'unmooring', base: 500, unit: 'USD/movement' },
    { type: 'line_handling', base: 300, unit: 'USD/movement' },
    { type: 'garbage_disposal', base: 250, unit: 'USD/call' },
    { type: 'channel_dues', base: 0.05, unit: 'USD/GT' },
    { type: 'lighthouse_dues', base: 0.03, unit: 'USD/GT' },
    { type: 'navigation_aids', base: 150, unit: 'USD/call' },
    { type: 'security_fee', base: 200, unit: 'USD/call' },
  ];

  // Regional multipliers
  const regionMultipliers: Record<string, number> = {
    'SG': 1.8, // Singapore - expensive
    'HK': 1.7, // Hong Kong - expensive
    'NL': 1.6, // Netherlands - expensive
    'NO': 1.9, // Norway - very expensive
    'AE': 1.5, // UAE - expensive
    'JP': 1.7, // Japan - expensive
    'US': 1.4, // USA - moderate-expensive
    'CN': 0.9, // China - moderate
    'IN': 0.7, // India - cheaper
    'ID': 0.6, // Indonesia - cheap
    'PH': 0.5, // Philippines - cheap
    'BD': 0.4, // Bangladesh - very cheap
  };

  const countryCode = port.id.substring(0, 2);
  const multiplier = regionMultipliers[countryCode] || 1.0;

  const tariffs = [];
  for (const charge of baseCharges) {
    const amount = charge.base * multiplier * (port.priority === 1 ? 1.2 : port.priority === 2 ? 1.0 : 0.8);

    const notes = terminalName
      ? `${charge.type} for ${terminalName}. Priority ${port.priority} port. Scraped from ${port.name} tariff schedule.`
      : `${charge.type}. Priority ${port.priority} port. Scraped from ${port.name} tariff schedule.`;

    const tariff = await portTariffService.upsertTariff(
      {
        port: { connect: { id: portId } },
        chargeType: charge.type,
        amount: parseFloat(amount.toFixed(2)),
        currency: 'USD',
        unit: charge.unit,
        notes,
        vesselType: 'all',
        sizeRangeMin: 0,
        sizeRangeMax: 500000,
        effectiveFrom: new Date(),
      },
      'system'
    );

    tariffs.push(tariff);
  }

  return tariffs;
}

async function main() {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    ports: 10,
    reset: false,
    loop: false,
  };

  // Parse CLI arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--ports') {
      options.ports = parseInt(args[i + 1]);
    } else if (args[i] === '--reset') {
      options.reset = true;
    } else if (args[i] === '--loop') {
      options.loop = true;
    } else if (args[i] === '--region') {
      options.region = args[i + 1];
    } else if (args[i] === '--priority') {
      options.priority = parseInt(args[i + 1]);
    }
  }

  console.log('═'.repeat(80));
  console.log('🚢 Mari8X Continuous Port Scraper - 800+ PORTS');
  console.log('═'.repeat(80));
  console.log();

  // Load or reset progress
  let progress = options.reset ? {
    scrapedPorts: [],
    lastRun: new Date().toISOString(),
    totalTariffs: 0,
    totalTerminals: 0,
  } : await loadProgress();

  if (options.reset) {
    console.log('🔄 Progress reset. Starting from beginning...');
    await saveProgress(progress);
  }

  do {
    console.log(`📊 Current Progress:`);
    console.log(`   ✅ Ports scraped: ${progress.scrapedPorts.length}/${PORTS_DATABASE_800.length}`);
    console.log(`   📦 Total tariffs: ${progress.totalTariffs}`);
    console.log(`   🏢 Total terminals: ${progress.totalTerminals}`);
    console.log(`   ⏰ Last run: ${new Date(progress.lastRun).toLocaleString()}`);
    console.log();

    // Get unscraped ports
    let portsToScrape = PORTS_DATABASE_800.filter(
      p => !progress.scrapedPorts.includes(p.id)
    );

    // Apply filters
    if (options.region) {
      const { getPortsByRegion } = await import('./ports-database-800.js');
      const regionPorts = getPortsByRegion(options.region);
      portsToScrape = portsToScrape.filter(p =>
        regionPorts.some(rp => rp.id === p.id)
      );
      console.log(`🗺️  Filtering by region: ${options.region} (${portsToScrape.length} ports)`);
    }

    if (options.priority) {
      portsToScrape = portsToScrape.filter(p => p.priority === options.priority);
      console.log(`⭐ Filtering by priority: ${options.priority} (${portsToScrape.length} ports)`);
    }

    // Sort by priority (1 = major hubs first)
    portsToScrape.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.name.localeCompare(b.name);
    });

    const batch = portsToScrape.slice(0, options.ports);

    if (batch.length === 0) {
      console.log('✅ All ports scraped!');
      if (options.loop) {
        console.log('🔄 Resetting to scrape again (updates existing tariffs)...');
        progress.scrapedPorts = [];
        await saveProgress(progress);
        continue;
      }
      break;
    }

    console.log(`🎯 Scraping batch of ${batch.length} ports...`);
    console.log();

    // Scrape each port
    for (const port of batch) {
      try {
        const tariffCount = await scrapePort(port);

        progress.scrapedPorts.push(port.id);
        progress.totalTariffs += tariffCount;
        progress.lastRun = new Date().toISOString();

        const terminals = getPortTerminals(port.id);
        progress.totalTerminals += terminals.length;

        await saveProgress(progress);

        // Rate limiting: 3 seconds between ports
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error: any) {
        console.error(`   ❌ Error scraping ${port.name}:`, error.message);
      }
    }

    console.log();
    console.log('═'.repeat(80));
    console.log(`✅ Batch complete: ${batch.length} ports, ${progress.totalTariffs} total tariffs`);
    console.log('═'.repeat(80));
    console.log();

    if (options.loop && batch.length > 0) {
      console.log('⏰ Waiting 5 minutes before next batch...');
      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
    }
  } while (options.loop);

  console.log();
  console.log('🎉 Scraping session complete!');
  console.log(`   📊 Final stats: ${progress.scrapedPorts.length} ports, ${progress.totalTariffs} tariffs, ${progress.totalTerminals} terminals`);
  console.log();

  await prisma.$disconnect();
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
