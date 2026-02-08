#!/usr/bin/env tsx
/**
 * TEST GFW VESSEL POSITIONS
 */

import 'dotenv/config';

const GFW_API_KEY = process.env.GFW_API_KEY!;
const headers = {
  'Authorization': `Bearer ${GFW_API_KEY}`,
  'Accept': 'application/json',
};

async function test(name: string, url: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(name);
  console.log('='.repeat(60));
  console.log(`URL: ${url}\n`);

  try {
    const response = await fetch(url, { headers });
    console.log(`Status: ${response.status} ${response.statusText}`);

    const text = await response.text();

    if (response.ok) {
      const data = JSON.parse(text);
      console.log('✅ SUCCESS!\n');

      if (data.entries?.length > 0) {
        console.log(`Found ${data.entries.length} entries`);
        console.log('\nSample entry:');
        console.log(JSON.stringify(data.entries[0], null, 2));
      } else if (data.total !== undefined) {
        console.log(`Total: ${data.total}`);
      } else {
        console.log('Response keys:', Object.keys(data).join(', '));
      }

      return data;
    } else {
      console.log('❌ FAILED\n');
      console.log(text.substring(0, 500));
      return null;
    }
  } catch (error) {
    console.log('❌ ERROR\n');
    console.log(error);
    return null;
  }
}

async function main() {
  console.log('🔍 GFW VESSEL POSITIONS TESTING\n');

  // Step 1: Find datasets related to vessel tracks/positions
  console.log('Step 1: Search for position-related datasets...');
  const datasets = await test(
    'Search Datasets - "track"',
    'https://gateway.api.globalfishingwatch.org/v3/datasets?limit=20&query=track'
  );

  if (datasets?.entries) {
    console.log('\n📋 Available track datasets:');
    datasets.entries.slice(0, 10).forEach((d: any) => {
      console.log(`  - ${d.id}`);
      if (d.name) console.log(`    Name: ${d.name}`);
    });
  }

  // Step 2: Search for AIS datasets
  const aisDatasets = await test(
    'Search Datasets - "AIS"',
    'https://gateway.api.globalfishingwatch.org/v3/datasets?limit=20&query=ais'
  );

  if (aisDatasets?.entries) {
    console.log('\n📋 Available AIS datasets:');
    aisDatasets.entries.slice(0, 10).forEach((d: any) => {
      console.log(`  - ${d.id}`);
      if (d.name) console.log(`    Name: ${d.name}`);
    });
  }

  // Step 3: Try vessel tracks endpoint with known vessel ID
  const vesselId = '8d37902d0-02c9-45a3-cd2e-e9e8341317ae'; // From previous test

  await test(
    'Vessel Tracks - Specific Vessel',
    `https://gateway.api.globalfishingwatch.org/v3/vessels/${vesselId}/tracks?datasets[0]=public-global-tracks:latest&start-date=2024-01-01&end-date=2024-12-31`
  );

  // Step 4: Try events endpoint
  await test(
    'Events API - Global',
    `https://gateway.api.globalfishingwatch.org/v3/events?datasets[0]=public-global-fishing-events:latest&start-date=2024-01-01&end-date=2024-01-31&limit=10`
  );

  // Step 5: Try 4Wings API (heatmap/aggregated data)
  await test(
    '4Wings Report - Arabia Sea',
    'https://gateway.api.globalfishingwatch.org/v3/4wings/report?datasets[0]=public-global-fishing-effort:latest&date-range[0]=2024-01-01&date-range[1]=2024-01-31&format=json&spatial-resolution=low&temporal-resolution=monthly'
  );

  console.log('\n' + '='.repeat(60));
  console.log('🎯 TESTING COMPLETE');
  console.log('='.repeat(60));
}

main();
