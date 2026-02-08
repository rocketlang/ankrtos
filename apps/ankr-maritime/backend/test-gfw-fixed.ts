#!/usr/bin/env tsx
/**
 * TEST GLOBAL FISHING WATCH API - FIXED VERSION
 * Using correct API endpoints
 */

const GFW_API_KEY = process.env.GFW_API_KEY || "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtpZEtleSJ9.eyJkYXRhIjp7Im5hbWUiOiJNYXJpOFhPU1JNIiwidXNlcklkIjo1NTk3OCwiYXBwbGljYXRpb25OYW1lIjoiTWFyaThYT1NSTSIsImlkIjo0NDMzLCJ0eXBlIjoidXNlci1hcHBsaWNhdGlvbiJ9LCJpYXQiOjE3NzA1NjM5NjIsImV4cCI6MjA4NTkyMzk2MiwiYXVkIjoiZ2Z3IiwiaXNzIjoiZ2Z3In0.KJTVIvw0Hg0e52e4uzwG7_BPXuADZdUP6aV5jnVHO-u6YTkIxW7Orlw5e0mYs0w_r3k2DS8KKRj97_11Ga0TYSHZ8cT6U_5bdrisVFEjnOlG3nWpfupo2otYdBSuKYW2mm7C9qJppARIV08PLRqWCMNnIdfzofUqqk4KM_cRn91GnpiYDCslzvg-vNR9L3yOAH8MAPlV7c9lap3gtUWF2AWNJvMfKbm-Dgf2guIbbO5cgs9N0BqANLytQZ4Doh3pIxQ3dEaB8fBnm2Zx2tuD1oe7SCEo7bsd3U5xBgAl6dHNRXEtwlzS7H7pwCOQosgXsyLe76yTVMfFEXfPgIEsMCmuW6406NNYHm2EtRwspzlulcxCfha90wXdzYmpbE_MUYktXfefVO2AxonvveeZUB2bcuUr5b1HrXjydGcT9Iakw_9AuKLpRfcYFkQI0hGyfFgWmEvjNI5m7m4nWORGOA-hCzRJ-0a8nTYS7otEo7TYXtoam-6--JEfMXqqcUEV";

async function testGFWAPI() {
  console.log('🌊 Testing Global Fishing Watch API...\n');

  const headers = {
    'Authorization': `Bearer ${GFW_API_KEY}`,
    'Accept': 'application/json'
  };

  // Test 1: Events API (best for vessel positions)
  console.log('Test 1: Events API (vessel positions)');
  console.log('━'.repeat(60));

  const arabianSeaBounds = 'bbox=50,5,75,25'; // west,south,east,north
  const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const endDate = new Date().toISOString();

  const eventsUrl = `https://gateway.api.globalfishingwatch.org/v3/events?datasets=public-global-all-vessels:latest&start-date=${startDate}&end-date=${endDate}&${arabianSeaBounds}`;

  try {
    const response = await fetch(eventsUrl, { headers });
    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Events API working!`);
      console.log(`Total entries: ${data.entries?.length || 0}`);
      if (data.entries?.length > 0) {
        console.log('Sample vessel:', {
          mmsi: data.entries[0].mmsi,
          shipname: data.entries[0].shipname,
          lat: data.entries[0].position?.lat,
          lon: data.entries[0].position?.lon
        });
      }
    } else {
      const error = await response.text();
      console.log(`⚠️  Error:`, error.substring(0, 300));
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }

  console.log('\n');

  // Test 2: Vessels Search API
  console.log('Test 2: Vessels Search API');
  console.log('━'.repeat(60));

  const searchUrl = `https://gateway.api.globalfishingwatch.org/v3/vessels/search?query=india&datasets=public-global-all-vessels:latest&limit=5`;

  try {
    const response = await fetch(searchUrl, { headers });
    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Search API working!`);
      console.log(`Total results: ${data.entries?.length || 0}`);
      if (data.entries?.length > 0) {
        data.entries.slice(0, 3).forEach((v: any, i: number) => {
          console.log(`  ${i + 1}. ${v.shipname} (${v.mmsi}) - ${v.flag}`);
        });
      }
    } else {
      const error = await response.text();
      console.log(`⚠️  Error:`, error.substring(0, 300));
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }

  console.log('\n');

  // Test 3: Try v2 4Wings API
  console.log('Test 3: 4Wings API (v2)');
  console.log('━'.repeat(60));

  const date = new Date().toISOString().split('T')[0];
  const fourWingsUrl = `https://gateway.api.globalfishingwatch.org/v2/4wings/tile/heatmap?datasets=public-global-all-vessels:latest&date=${date}&format=json`;

  try {
    const response = await fetch(fourWingsUrl, { headers });
    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ 4Wings API working!`);
      console.log(`Data keys:`, Object.keys(data).join(', '));
    } else {
      const error = await response.text();
      console.log(`⚠️  Error:`, error.substring(0, 300));
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }

  console.log('\n' + '━'.repeat(60));
  console.log('🎯 GFW API Key Test Complete!');
}

testGFWAPI();
