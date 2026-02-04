#!/usr/bin/env tsx
/**
 * Equasis Fresh Scrape Test (bypasses cache)
 * WARNING: Uses 1 request from daily limit (50/day)
 */

import { prisma } from '../src/lib/prisma.js';
import { equasisScraper } from '../src/services/equasis-scraper.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Equasis FRESH Scrape Test (Bypasses Cache)');
  console.log('='.repeat(60));
  console.log();

  const testIMO = '9348522';

  console.log(`⚠️  WARNING: This will use 1 request from daily limit (50/day)`);
  console.log(`Testing with IMO: ${testIMO}`);
  console.log();

  try {
    // Clear cache for this vessel
    console.log('1. Clearing cache...');
    await prisma.vesselOwnershipCache.deleteMany({
      where: { imo: testIMO }
    });
    console.log('   ✅ Cache cleared');
    console.log();

    // Force fresh scrape
    console.log('2. Starting fresh scrape...');
    console.log('   (This may take 10-15 seconds)');
    console.log();

    const result = await equasisScraper.scrapeVessel(testIMO);

    console.log('='.repeat(60));
    console.log('RESULT:');
    console.log('='.repeat(60));
    console.log(JSON.stringify(result, null, 2));
    console.log();

    // Check what we got
    if (result?.registeredOwner) {
      console.log('✅ SUCCESS! Owner data extracted:');
      console.log(`   Registered Owner: ${result.registeredOwner}`);
      console.log(`   Ship Manager: ${result.shipManager || 'N/A'}`);
      console.log(`   Operator: ${result.operator || 'N/A'}`);
      console.log();
      console.log('🎉 Equasis extraction is WORKING!');
    } else {
      console.log('❌ FAILED! No owner data extracted');
      console.log();
      console.log('Possible issues:');
      console.log('1. Page structure changed');
      console.log('2. Selectors need updating');
      console.log('3. Login failed');
      console.log('4. IMO not found on Equasis');
      console.log();
      console.log('Check browser screenshot if available');
    }

  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    if (error.message.includes('Daily limit')) {
      console.log('');
      console.log('⚠️  Daily limit reached. Wait until tomorrow or increase MAX_REQUESTS_PER_DAY');
    }
  }

  console.log();
  console.log('='.repeat(60));
  console.log('Test complete');
  console.log('='.repeat(60));

  await prisma.$disconnect();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
