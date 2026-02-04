#!/usr/bin/env tsx
/**
 * Enrich Vessels with Ownership Data from Equasis
 *
 * Usage:
 *   tsx scripts/enrich-vessel-ownership.ts [limit]
 *
 * Example:
 *   tsx scripts/enrich-vessel-ownership.ts 10  # Enrich 10 vessels
 *   tsx scripts/enrich-vessel-ownership.ts     # Enrich 20 vessels (default)
 *
 * IMPORTANT:
 * - Slow scraping: 10 seconds between requests
 * - Daily limit: 50 vessels max
 * - 7 year cache (won't re-scrape same vessel for 7 years)
 * - Re-check on use: Only re-scrape when vessel actively used in system
 */

import { equasisScraper } from '../src/services/equasis-scraper.js';
import { prisma } from '../src/lib/prisma.js';

async function main() {
  const limit = parseInt(process.argv[2]) || 20;

  console.log('═'.repeat(80));
  console.log('🏢 Equasis Vessel Ownership Enrichment');
  console.log('═'.repeat(80));
  console.log();
  console.log(`⚙️  Settings:`);
  console.log(`   Limit: ${limit} vessels`);
  console.log(`   Rate limit: 10 seconds between requests`);
  console.log(`   Daily max: 50 vessels`);
  console.log(`   Cache: 7 years (re-check on active use)`);
  console.log();

  try {
    // Initialize scraper and login
    await equasisScraper.init();

    // Get count of vessels needing enrichment
    const needsEnrichment = await prisma.vessel.count({
      where: {
        OR: [
          { registeredOwner: null },
          { ownershipUpdatedAt: null },
          {
            ownershipUpdatedAt: {
              lt: new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000),
            },
          },
        ],
        imo: { not: '0' },
        mmsi: { not: null },
      },
    });

    console.log(`📊 Vessels needing ownership data: ${needsEnrichment}`);
    console.log();

    if (needsEnrichment === 0) {
      console.log('✅ All vessels are up to date!');
      return;
    }

    // Run enrichment
    await equasisScraper.autoEnrichNewVessels(limit);

    // Show final stats
    const stats = equasisScraper.getStats();
    console.log();
    console.log('📊 Final Statistics:');
    console.log(`   Requests today: ${stats.requestsToday}`);
    console.log(`   Remaining today: ${stats.remainingToday}`);

    // Show sample of enriched vessels
    const enriched = await prisma.vessel.findMany({
      where: {
        registeredOwner: { not: null },
      },
      select: {
        name: true,
        imo: true,
        registeredOwner: true,
        shipManager: true,
        ownershipUpdatedAt: true,
      },
      take: 5,
      orderBy: { ownershipUpdatedAt: 'desc' },
    });

    if (enriched.length > 0) {
      console.log();
      console.log('📋 Sample of enriched vessels:');
      enriched.forEach(v => {
        console.log(`   ${v.name} (IMO: ${v.imo})`);
        console.log(`      Owner: ${v.registeredOwner || 'N/A'}`);
        console.log(`      Manager: ${v.shipManager || 'N/A'}`);
        console.log();
      });
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await equasisScraper.close();
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('✅ Enrichment complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
