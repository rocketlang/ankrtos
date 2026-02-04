#!/usr/bin/env tsx
/**
 * Equasis Scraper Debug Script
 * Tests scraper and shows actual page content
 */

import { equasisScraper } from '../src/services/equasis-scraper.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Equasis Scraper Debug Test');
  console.log('='.repeat(60));
  console.log();

  const testIMO = '9348522'; // Known vessel for testing

  console.log(`Testing with IMO: ${testIMO}`);
  console.log('Starting scraper...');
  console.log();

  try {
    const result = await equasisScraper.scrapeVessel(testIMO);

    console.log('='.repeat(60));
    console.log('RESULT:');
    console.log('='.repeat(60));
    console.log(JSON.stringify(result, null, 2));
    console.log();

    if (result?.registeredOwner) {
      console.log('✅ SUCCESS! Owner data extracted:');
      console.log(`   Registered Owner: ${result.registeredOwner}`);
      console.log(`   Ship Manager: ${result.shipManager || 'N/A'}`);
      console.log(`   Operator: ${result.operator || 'N/A'}`);
    } else {
      console.log('❌ FAILED! No owner data extracted');
      console.log('');
      console.log('Next steps:');
      console.log('1. Check if login succeeded');
      console.log('2. Verify page structure');
      console.log('3. Update selectors in equasis-scraper.ts');
    }

  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log();
  console.log('='.repeat(60));
  console.log('Test complete');
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
