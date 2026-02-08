#!/usr/bin/env tsx
/**
 * GFW API - WORKING VERSION
 */

import 'dotenv/config';

const GFW_API_KEY = process.env.GFW_API_KEY!;
const headers = {
  'Authorization': `Bearer ${GFW_API_KEY}`,
  'Accept': 'application/json',
};

async function test(name: string, url: string) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(name);
  console.log('='.repeat(70));

  try {
    const response = await fetch(url, { headers });
    console.log(`Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Error:', error.substring(0, 300));
      return null;
    }

    const data = await response.json();
    console.log('✅ SUCCESS!\n');

    if (data.entries) {
      console.log(`📊 Found ${data.entries.length} entries (total: ${data.total || data.entries.length})`);
      if (data.entries.length > 0) {
        console.log('\n🔍 Sample entry:');
        console.log(JSON.stringify(data.entries[0], null, 2));
      }
    } else {
      console.log('Response keys:', Object.keys(data).join(', '));
      console.log('Data:', JSON.stringify(data, null, 2).substring(0, 500));
    }

    return data;
  } catch (error) {
    console.log('❌ Request failed:', error);
    return null;
  }
}

async function main() {
  console.log('🛰️  GFW API - WORKING TESTS\n');

  // Test 1: List available datasets (with offset!)
  await test(
    '1. List AIS/Track Datasets',
    'https://gateway.api.globalfishingwatch.org/v3/datasets?limit=50&offset=0'
  );

  // Test 2: Search for a specific vessel by MMSI
  const mmsi = '477995900'; // Hong Kong vessel
  const vesselData = await test(
    '2. Search Vessel by MMSI',
    `https://gateway.api.globalfishingwatch.org/v3/vessels/search?query=${mmsi}&datasets[0]=public-global-vessel-identity:latest`
  );

  let vesselId = null;
  if (vesselData?.entries?.[0]?.selfReportedInfo?.[0]?.id) {
    vesselId = vesselData.entries[0].selfReportedInfo[0].id;
    console.log(`\n✅ Got vessel ID: ${vesselId}`);
  }

  // Test 3: Get vessel info with dataset
  if (vesselId) {
    await test(
      '3. Get Vessel Info',
      `https://gateway.api.globalfishingwatch.org/v3/vessels/${vesselId}?datasets[0]=public-global-vessel-identity:latest`
    );
  }

  // Test 4: Events API (with offset!)
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const startDate = yesterday.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];

  await test(
    '4. Events API - Last 24h',
    `https://gateway.api.globalfishingwatch.org/v3/events?datasets[0]=public-global-fishing-events:latest&start-date=${startDate}&end-date=${endDate}&limit=10&offset=0`
  );

  // Test 5: Try to get vessel tracks (if endpoint exists)
  if (vesselId) {
    await test(
      '5. Vessel Tracks (last 30 days)',
      `https://gateway.api.globalfishingwatch.org/v3/vessels/${vesselId}/events?datasets[0]=public-global-fishing-events:latest&start-date=2024-01-01&end-date=2024-01-31&limit=10&offset=0`
    );
  }

  // Test 6: 4Wings report (smaller date range)
  await test(
    '6. 4Wings Report - Last 7 days',
    `https://gateway.api.globalfishingwatch.org/v3/4wings/report?datasets[0]=public-global-fishing-effort:latest&date-range[0]=${startDate}&date-range[1]=${endDate}&format=json&spatial-resolution=low&temporal-resolution=daily`
  );

  console.log('\n' + '='.repeat(70));
  console.log('🎯 TESTS COMPLETE');
  console.log('='.repeat(70));
}

main();
