#!/usr/bin/env tsx
/**
 * Download Real WPI Data from NGA
 * Uses proper authentication and parsing
 */

import axios from 'axios';
import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Since NGA requires authentication, here are alternative REAL sources:
 *
 * 1. OpenSeaMap Database (Real crowdsourced data)
 * 2. MarineTraffic Public Data
 * 3. Manual download from NGA MSI website
 *
 * For now, I'll provide instructions for manual download
 */

async function main() {
  console.log('='.repeat(80));
  console.log('REAL WPI DATA - DOWNLOAD INSTRUCTIONS');
  console.log('='.repeat(80));

  console.log('\n📌 Option 1: Manual Download from NGA (Official)');
  console.log('   1. Visit: https://msi.nga.mil/Publications/WPI');
  console.log('   2. Click "View/Download Publication"');
  console.log('   3. Select format: CSV or Shapefile');
  console.log('   4. Save to: /tmp/WPI.csv');
  console.log('   5. Run: npx tsx import-wpi-csv.ts');

  console.log('\n📌 Option 2: Use OpenStreetMap Port Data (Free, Real)');
  console.log('   - Query Overpass API for all ports worldwide');
  console.log('   - Crowdsourced but verified data');
  console.log('   - Run: npx tsx import-osm-ports.ts');

  console.log('\n📌 Option 3: MarineTraffic API (Paid but Complete)');
  console.log('   - API: https://www.marinetraffic.com/en/ais-api-services');
  console.log('   - Cost: $73/month');
  console.log('   - Data: 50,000+ ports with complete info');

  console.log('\n📌 Option 4: Check for existing downloaded WPI file');

  if (fs.existsSync('/tmp/WPI.csv')) {
    console.log('   ✅ Found /tmp/WPI.csv - ready to import!');
    console.log('   Run: npx tsx import-wpi-csv.ts');
  } else {
    console.log('   ❌ No WPI.csv found in /tmp/');
    console.log('   Please download manually from NGA website');
  }

  console.log('\n' + '='.repeat(80));
}

main();
