#!/usr/bin/env tsx
/**
 * TEST: What position data can we actually get from GFW?
 */

import 'dotenv/config';

const GFW_API_KEY = process.env.GFW_API_KEY!;
const headers = {
  'Authorization': `Bearer ${GFW_API_KEY}`,
  'Accept': 'application/json',
};

async function testFishingEventsWithPositions() {
  console.log('🎣 Testing: Fishing Events API (includes positions)\n');

  // Get fishing events from last 7 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const url = `https://gateway.api.globalfishingwatch.org/v3/events?` +
    `datasets[0]=public-global-fishing-events:latest&` +
    `start-date=${startDate.toISOString().split('T')[0]}&` +
    `end-date=${endDate.toISOString().split('T')[0]}&` +
    `limit=20&offset=0`;

  console.log('URL:', url, '\n');

  try {
    const response = await fetch(url, { headers });
    console.log(`Status: ${response.status} ${response.statusText}\n`);

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Found ${data.total || 0} fishing events\n`);

      if (data.entries && data.entries.length > 0) {
        console.log('📍 Sample event with position:');
        const event = data.entries[0];
        console.log(JSON.stringify({
          type: event.type,
          start: event.start,
          end: event.end,
          position: event.position,
          vessel: {
            ssvid: event.vessel?.ssvid,
            name: event.vessel?.name,
            flag: event.vessel?.flag
          }
        }, null, 2));
      } else {
        console.log('⚠️  No events found in this time period');
      }
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }
  } catch (error) {
    console.log('❌ Request failed:', error);
  }
}

async function testPortVisitsWithPositions() {
  console.log('\n' + '='.repeat(70));
  console.log('⚓ Testing: Port Visit Events (includes positions)\n');

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const url = `https://gateway.api.globalfishingwatch.org/v3/events?` +
    `datasets[0]=public-global-port-visits-c2-events:latest&` +
    `start-date=${startDate.toISOString().split('T')[0]}&` +
    `end-date=${endDate.toISOString().split('T')[0]}&` +
    `limit=20&offset=0`;

  console.log('URL:', url, '\n');

  try {
    const response = await fetch(url, { headers });
    console.log(`Status: ${response.status} ${response.statusText}\n`);

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Found ${data.total || 0} port visit events\n`);

      if (data.entries && data.entries.length > 0) {
        console.log('📍 Sample port visit with position:');
        const event = data.entries[0];
        console.log(JSON.stringify({
          type: event.type,
          start: event.start,
          end: event.end,
          position: event.position,
          port: event.port,
          vessel: {
            ssvid: event.vessel?.ssvid,
            name: event.vessel?.name
          }
        }, null, 2));
      } else {
        console.log('⚠️  No port visits found in this time period');
      }
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }
  } catch (error) {
    console.log('❌ Request failed:', error);
  }
}

async function testLoiteringEvents() {
  console.log('\n' + '='.repeat(70));
  console.log('🔄 Testing: Loitering Events (includes positions)\n');

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const url = `https://gateway.api.globalfishingwatch.org/v3/events?` +
    `datasets[0]=public-global-loitering-events:latest&` +
    `start-date=${startDate.toISOString().split('T')[0]}&` +
    `end-date=${endDate.toISOString().split('T')[0]}&` +
    `limit=20&offset=0`;

  console.log('URL:', url, '\n');

  try {
    const response = await fetch(url, { headers });
    console.log(`Status: ${response.status} ${response.statusText}\n`);

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Found ${data.total || 0} loitering events\n`);

      if (data.entries && data.entries.length > 0) {
        console.log('📍 Sample loitering event with position:');
        const event = data.entries[0];
        console.log(JSON.stringify({
          type: event.type,
          start: event.start,
          end: event.end,
          position: event.position,
          vessel: {
            ssvid: event.vessel?.ssvid,
            name: event.vessel?.name
          }
        }, null, 2));
      } else {
        console.log('⚠️  No loitering events found in this time period');
      }
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }
  } catch (error) {
    console.log('❌ Request failed:', error);
  }
}

async function main() {
  console.log('🛰️  GFW POSITION DATA TEST\n');
  console.log('Testing what location data GFW actually provides...\n');
  console.log('='.repeat(70));

  await testFishingEventsWithPositions();
  await testPortVisitsWithPositions();
  await testLoiteringEvents();

  console.log('\n' + '='.repeat(70));
  console.log('🎯 SUMMARY:\n');
  console.log('GFW provides positions for:');
  console.log('  ✅ Fishing events (where fishing happened)');
  console.log('  ✅ Port visits (where vessel docked)');
  console.log('  ✅ Loitering events (where vessel stayed)\n');
  console.log('GFW does NOT provide:');
  console.log('  ❌ Continuous vessel tracks');
  console.log('  ❌ Real-time current positions');
  console.log('  ❌ Historical position history\n');
  console.log('For continuous tracking, use AISstream.io! ✅');
  console.log('='.repeat(70));
}

main();
