#!/usr/bin/env tsx
/**
 * Scrape Phase 1 Ports (8 ports)
 * Simple script to scrape all 8 Phase 1 ports
 */

import { portScraperManager } from '../src/services/port-scrapers/index.js';

async function main() {
  console.log('🚢 Scraping Phase 1 Ports');
  console.log('=========================\n');

  const phase1Ports = [
    'INMUN',   // Mumbai
    'INKDL',   // Kandla
    'INMUN1',  // Mundra
    'LKCMB',   // Colombo
    'AEJEA',   // Jebel Ali
    'SAJED',   // Jeddah
    'AEFJR',   // Fujairah
  ];

  let totalImported = 0;

  for (const unlocode of phase1Ports) {
    try {
      await portScraperManager.scrapePort(unlocode);

      // Delay between ports
      if (phase1Ports.indexOf(unlocode) < phase1Ports.length - 1) {
        console.log('⏳ Waiting 10s before next port...\n');
        await sleep(10000);
      }
    } catch (error) {
      console.error(`Error scraping ${unlocode}:`, error);
    }
  }

  console.log('\n✅ Phase 1 scraping complete!');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);
