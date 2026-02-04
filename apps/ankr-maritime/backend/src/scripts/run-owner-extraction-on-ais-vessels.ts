#!/usr/bin/env tsx
/**
 * Extract vessel owner data for all AIS-tracked vessels
 * Runs ethically with rate limiting (10 second delay between requests)
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface VesselOwnerData {
  vesselId: string;
  imo: string;
  vesselName: string;
  ownerName?: string;
  ownerCompany?: string;
  ownerAddress?: string;
  flag?: string;
  extractedAt: Date;
  success: boolean;
  error?: string;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function extractOwnerForVessel(vessel: any): Promise<VesselOwnerData> {
  console.log(`\n[${new Date().toISOString()}] Processing: ${vessel.name} (IMO: ${vessel.imo})`);

  try {
    // Call the GISIS owner service
    const result = execSync(
      `cd /root/apps/ankr-maritime/backend && npx tsx -e "
        import { GISISOwnerService } from './src/services/gisis-owner-service.js';
        const service = new GISISOwnerService();
        service.extractOwnerData('${vessel.imo}').then(data => {
          console.log(JSON.stringify(data));
          process.exit(0);
        }).catch(err => {
          console.error(JSON.stringify({ error: err.message }));
          process.exit(1);
        });
      "`,
      { encoding: 'utf-8', timeout: 30000 }
    );

    const ownerData = JSON.parse(result.trim());

    console.log(`✅ Success: ${ownerData.ownerName || 'Owner extracted'}`);

    return {
      vesselId: vessel.id,
      imo: vessel.imo,
      vesselName: vessel.name,
      ownerName: ownerData.ownerName,
      ownerCompany: ownerData.companyName,
      ownerAddress: ownerData.address,
      flag: ownerData.flag,
      extractedAt: new Date(),
      success: true,
    };
  } catch (error: any) {
    console.error(`❌ Failed: ${error.message}`);

    return {
      vesselId: vessel.id,
      imo: vessel.imo,
      vesselName: vessel.name,
      extractedAt: new Date(),
      success: false,
      error: error.message,
    };
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('AIS VESSEL OWNER EXTRACTION - Ethical Rate-Limited Batch Process');
  console.log('='.repeat(80));
  console.log(`Started at: ${new Date().toISOString()}\n`);

  // Get all vessels with valid IMO numbers that have recent AIS positions
  const vessels = await prisma.vessel.findMany({
    where: {
      imo: {
        not: null,
        not: '',
      },
      positions: {
        some: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      },
    },
    select: {
      id: true,
      imo: true,
      name: true,
      mmsi: true,
      type: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  console.log(`Found ${vessels.length} AIS-tracked vessels with valid IMO numbers\n`);

  if (vessels.length === 0) {
    console.log('No vessels to process. Exiting.');
    await prisma.$disconnect();
    return;
  }

  const results: VesselOwnerData[] = [];
  let successCount = 0;
  let failureCount = 0;

  // Process each vessel with 10-second delay (ethical rate limiting)
  for (let i = 0; i < vessels.length; i++) {
    const vessel = vessels[i];
    console.log(`\n--- Progress: ${i + 1}/${vessels.length} ---`);

    const result = await extractOwnerForVessel(vessel);
    results.push(result);

    if (result.success) {
      successCount++;

      // Update vessel record with owner data
      try {
        await prisma.vessel.update({
          where: { id: vessel.id },
          data: {
            owner: result.ownerName || result.ownerCompany,
            flag: result.flag || undefined,
          },
        });
        console.log(`📝 Database updated for ${vessel.name}`);
      } catch (dbError: any) {
        console.error(`⚠️  Database update failed: ${dbError.message}`);
      }
    } else {
      failureCount++;
    }

    // Rate limiting: 10 seconds between requests (ethical scraping)
    if (i < vessels.length - 1) {
      console.log(`⏳ Waiting 10 seconds before next request (ethical rate limit)...`);
      await sleep(10000);
    }
  }

  // Generate report
  console.log('\n' + '='.repeat(80));
  console.log('EXTRACTION COMPLETE - SUMMARY REPORT');
  console.log('='.repeat(80));
  console.log(`Total Vessels Processed: ${vessels.length}`);
  console.log(`Successful Extractions:  ${successCount} (${((successCount / vessels.length) * 100).toFixed(1)}%)`);
  console.log(`Failed Extractions:      ${failureCount} (${((failureCount / vessels.length) * 100).toFixed(1)}%)`);
  console.log(`\nCompleted at: ${new Date().toISOString()}`);
  console.log(`Total Duration: ${((vessels.length * 10) / 60).toFixed(1)} minutes (approx)`);

  // Save detailed results to JSON
  const reportPath = path.join(__dirname, '../AIS-OWNER-EXTRACTION-RESULTS.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      totalVessels: vessels.length,
      successful: successCount,
      failed: failureCount,
      successRate: `${((successCount / vessels.length) * 100).toFixed(1)}%`,
    },
    results,
  }, null, 2));

  console.log(`\n📄 Detailed results saved to: ${reportPath}`);

  // Generate markdown report
  const mdReport = generateMarkdownReport(results, successCount, failureCount);
  const mdPath = path.join(__dirname, '../AIS-OWNER-EXTRACTION-REPORT.md');
  fs.writeFileSync(mdPath, mdReport);
  console.log(`📄 Markdown report saved to: ${mdPath}`);

  await prisma.$disconnect();
}

function generateMarkdownReport(results: VesselOwnerData[], successCount: number, failureCount: number): string {
  const total = results.length;

  return `# AIS Vessel Owner Extraction Report

**Generated:** ${new Date().toISOString()}

## Executive Summary

| Metric | Value |
|--------|-------|
| Total Vessels Processed | ${total} |
| Successful Extractions | ${successCount} (${((successCount / total) * 100).toFixed(1)}%) |
| Failed Extractions | ${failureCount} (${((failureCount / total) * 100).toFixed(1)}%) |
| Average Time per Vessel | 10 seconds (rate limited) |
| Total Duration | ${((total * 10) / 60).toFixed(1)} minutes |

## Successful Extractions

${results.filter(r => r.success).map((r, i) => `
### ${i + 1}. ${r.vesselName}

- **IMO:** ${r.imo}
- **Owner:** ${r.ownerName || 'N/A'}
- **Company:** ${r.ownerCompany || 'N/A'}
- **Flag:** ${r.flag || 'N/A'}
- **Extracted At:** ${r.extractedAt.toISOString()}
`).join('\n')}

## Failed Extractions

${results.filter(r => !r.success).length > 0 ? results.filter(r => !r.success).map((r, i) => `
### ${i + 1}. ${r.vesselName}

- **IMO:** ${r.imo}
- **Error:** ${r.error || 'Unknown error'}
- **Attempted At:** ${r.extractedAt.toISOString()}
`).join('\n') : '_No failures_'}

## Next Steps

1. ✅ Owner data has been automatically updated in the database
2. 🔄 Failed extractions can be retried manually or investigated
3. 📊 Use this data for load matching and broker outreach
4. 🎯 ${successCount} vessels now have complete owner information for immediate contact

---

*Generated by Mari8X Owner Extraction Service*
*Ethical rate limiting: 10 seconds between requests*
`;
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
