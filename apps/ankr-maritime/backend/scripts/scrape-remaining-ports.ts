#!/usr/bin/env tsx
/**
 * Scrape Remaining Ports - Kandla, Mundra, JNPT
 */

import { portScraperManager } from '../src/services/port-scrapers/index.js';

async function main() {
  console.log('🚢 Scraping Remaining Ports');
  console.log('============================\n');

  const remainingPorts = [
    'INKDL',   // Kandla
    'INMUN1',  // Mundra
    'INNSA',   // JNPT
  ];

  for (const unlocode of remainingPorts) {
    try {
      await portScraperManager.scrapePort(unlocode);

      // Delay between ports
      if (remainingPorts.indexOf(unlocode) < remainingPorts.length - 1) {
        console.log('⏳ Waiting 10s before next port...\n');
        await sleep(10000);
      }
    } catch (error) {
      console.error(`Error scraping ${unlocode}:`, error);
    }
  }

  console.log('\n✅ Remaining ports scraping complete!');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);
