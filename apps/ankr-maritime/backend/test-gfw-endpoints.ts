#!/usr/bin/env tsx
/**
 * DEBUG GFW API - Test different endpoints and dataset IDs
 */

import 'dotenv/config';

const GFW_API_KEY = process.env.GFW_API_KEY!;

if (!GFW_API_KEY) {
  console.error('❌ GFW_API_KEY not found in environment!');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${GFW_API_KEY}`,
  'Accept': 'application/json',
};

async function testEndpoint(name: string, url: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${name}`);
  console.log(`URL: ${url}`);
  console.log('='.repeat(60));

  try {
    const response = await fetch(url, { headers });
    const status = `${response.status} ${response.statusText}`;
    console.log(`Status: ${status}`);

    const text = await response.text();

    if (response.ok) {
      try {
        const data = JSON.parse(text);
        console.log('✅ SUCCESS!');
        console.log('Response keys:', Object.keys(data).join(', '));

        if (data.entries?.length > 0) {
          console.log(`Found ${data.entries.length} entries`);
          console.log('Sample entry:', JSON.stringify(data.entries[0], null, 2));
        } else if (data.total !== undefined) {
          console.log(`Total: ${data.total}`);
        }

        return { success: true, data };
      } catch (e) {
        console.log('✅ SUCCESS (non-JSON response)');
        console.log('Response:', text.substring(0, 200));
        return { success: true, data: text };
      }
    } else {
      console.log('❌ FAILED');
      console.log('Error:', text.substring(0, 500));
      return { success: false, error: text };
    }
  } catch (error) {
    console.log('❌ REQUEST FAILED');
    console.log('Error:', error);
    return { success: false, error };
  }
}

async function main() {
  console.log('🔍 GFW API ENDPOINT TESTING\n');

  // Test 1: Datasets list
  await testEndpoint(
    'Datasets List',
    'https://gateway.api.globalfishingwatch.org/v3/datasets?limit=10&offset=0'
  );

  // Test 2: Vessel search (basic)
  await testEndpoint(
    'Vessel Search - Simple',
    'https://gateway.api.globalfishingwatch.org/v3/vessels/search?query=india&limit=5&offset=0&datasets[0]=public-global-vessel-identity:latest'
  );

  // Test 3: Vessel search by MMSI
  await testEndpoint(
    'Vessel Search - MMSI',
    'https://gateway.api.globalfishingwatch.org/v3/vessels/search?query=477995900&datasets[0]=public-global-vessel-identity:latest'
  );

  // Test 4: Try v2 datasets endpoint
  await testEndpoint(
    'Datasets List v2',
    'https://gateway.api.globalfishingwatch.org/v2/datasets?limit=10&offset=0'
  );

  // Test 5: User info
  await testEndpoint(
    'User Info',
    'https://gateway.api.globalfishingwatch.org/v3/user'
  );

  // Test 6: Vessel info endpoint (if we have a vessel ID)
  await testEndpoint(
    'Test Vessel Info',
    'https://gateway.api.globalfishingwatch.org/v3/vessels/8c7304226-6c71-edbe-0b63-c246734b3c01'
  );

  console.log('\n' + '='.repeat(60));
  console.log('🎯 TESTING COMPLETE');
  console.log('='.repeat(60));
}

main();
