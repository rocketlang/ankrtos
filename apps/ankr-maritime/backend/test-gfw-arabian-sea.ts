#!/usr/bin/env tsx
/**
 * TEST ARABIAN SEA WITH GLOBAL FISHING WATCH API
 * NOW THAT WE HAVE THE API KEY!
 */

const GFW_API_KEY = process.env.GFW_API_KEY || "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtpZEtleSJ9.eyJkYXRhIjp7Im5hbWUiOiJNYXJpOFhPU1JNIiwidXNlcklkIjo1NTk3OCwiYXBwbGljYXRpb25OYW1lIjoiTWFyaThYT1NSTSIsImlkIjo0NDMzLCJ0eXBlIjoidXNlci1hcHBsaWNhdGlvbiJ9LCJpYXQiOjE3NzA1NjM5NjIsImV4cCI6MjA4NTkyMzk2MiwiYXVkIjoiZ2Z3IiwiaXNzIjoiZ2Z3In0.KJTVIvw0Hg0e52e4uzwG7_BPXuADZdUP6aV5jnVHO-u6YTkIxW7Orlw5e0mYs0w_r3k2DS8KKRj97_11Ga0TYSHZ8cT6U_5bdrisVFEjnOlG3nWpfupo2otYdBSuKYW2mm7C9qJppARIV08PLRqWCMNnIdfzofUqqk4KM_cRn91GnpiYDCslzvg-vNR9L3yOAH8MAPlV7c9lap3gtUWF2AWNJvMfKbm-Dgf2guIbbO5cgs9N0BqANLytQZ4Doh3pIxQ3dEaB8fBnm2Zx2tuD1oe7SCEo7bsd3U5xBgAl6dHNRXEtwlzS7H7pwCOQosgXsyLe76yTVMfFEXfPgIEsMCmuW6406NNYHm2EtRwspzlulcxCfha90wXdzYmpbE_MUYktXfefVO2AxonvveeZUB2bcuUr5b1HrXjydGcT9Iakw_9AuKLpRfcYFkQI0hGyfFgWmEvjNI5m7m4nWORGOA-hCzRJ-0a8nTYS7otEo7TYXtoam-6--JEfMXqqcUEV";

async function testGFWAPI() {
  console.log('🌊 Testing Global Fishing Watch API for Arabian Sea...\n');

  // Arabian Sea bounds
  const bounds = {
    west: 50,
    south: 5,
    east: 75,
    north: 25
  };

  // Try 4Wings API (heatmap/aggregated data)
  const date = new Date().toISOString().split('T')[0];

  const url = `https://gateway.api.globalfishingwatch.org/v3/4wings/tile/heatmap?datasets=public-global-all-vessels:latest&date=${date}&format=json&temporal-aggregation=true&spatial-resolution=low`;

  console.log('API URL:', url);

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${GFW_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    console.log('Status:', response.status, response.statusText);

    const text = await response.text();
    console.log('Response preview:', text.substring(0, 500));

    if (response.ok) {
      console.log('\n✅ GFW API IS WORKING!');
      const data = JSON.parse(text);
      console.log('Data keys:', Object.keys(data));
    } else {
      console.log('\n⚠️  API error:', text);
    }

  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

testGFWAPI();
