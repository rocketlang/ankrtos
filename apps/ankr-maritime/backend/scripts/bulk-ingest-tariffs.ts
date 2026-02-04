#!/usr/bin/env tsx
/**
 * Bulk Tariff Ingestion Script
 * Week 2 - Day 5: Bulk Processing
 *
 * Usage:
 *   npm run ingest:all
 *   npm run ingest:ports -- SGSIN INMUN
 *   npm run ingest:priority -- 1
 */

import { PrismaClient } from '@prisma/client';
import { getTariffIngestionService } from '../src/services/tariff-ingestion.service.js';
import fs from 'fs';

const prisma = new PrismaClient();
const ingestionService = getTariffIngestionService();

const PORT_PRIORITIES = {
  1: ['SGSIN', 'AEJEA', 'NLRTM'],
  2: ['INMUN', 'INNSA', 'USNYC'],
  3: ['CNSHA', 'GBLON', 'JPYOK'],
  4: ['NOKRS'],
};

async function main() {
  console.log('🚀 Mari8X Bulk Tariff Ingestion\n');
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    let portsToIngest: Array<{portId: string, pdfPath: string}> = [];

    if (command === 'all') {
      portsToIngest = [
        { portId: 'SGSIN', pdfPath: getPDFPath('SGSIN') },
        { portId: 'INMUN', pdfPath: getPDFPath('INMUN') },
        { portId: 'AEJEA', pdfPath: getPDFPath('AEJEA') },
      ];
    } else if (command === 'ports') {
      const portIds = args.slice(1);
      portsToIngest = portIds.map(id => ({
        portId: id.toUpperCase(),
        pdfPath: getPDFPath(id.toUpperCase())
      }));
    } else {
      console.log('Usage:');
      console.log('  npm run ingest:all');
      console.log('  npm run ingest:ports -- SGSIN INMUN');
      process.exit(0);
    }

    console.log(`📦 Ingesting ${portsToIngest.length} ports\n`);

    const results = await ingestionService.ingestBulk(portsToIngest, {
      parallel: true,
      maxConcurrent: 5,
      delayMs: 30000,
    });

    generateReport(results);

    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      console.log('\n❌ Failed ingestions:');
      failed.forEach(r => console.log(`   ${r.portId}: ${r.errors.join(', ')}`));
    }

    await prisma.$disconnect();
    process.exit(failed.length > 0 ? 1 : 0);
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

function getPDFPath(portId: string): string {
  const paths = [
    `/root/apps/ankr-maritime/test-documents/${portId}-tariff.pdf`,
    `/root/apps/ankr-maritime/tariff-pdfs/${portId}.pdf`,
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return paths[0];
}

function generateReport(results: any[]): void {
  console.log('\n📊 INGESTION SUMMARY');
  console.log('='.repeat(60));

  const total = results.length;
  const successful = results.filter(r => r.success).length;
  const totalImported = results.reduce((s, r) => s + r.tariffsImported, 0);
  const totalExtracted = results.reduce((s, r) => s + r.tariffsExtracted, 0);

  console.log(`\nPorts:        ${total} total, ${successful} successful`);
  console.log(`Tariffs:      ${totalExtracted} extracted, ${totalImported} imported`);
  console.log('\n' + '='.repeat(60));

  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    console.log(`  ${status} ${r.portId}: ${r.tariffsImported}/${r.tariffsExtracted}`);
  });
}

main();
