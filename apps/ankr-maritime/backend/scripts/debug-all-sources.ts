#!/usr/bin/env tsx
/**
 * Comprehensive debugging for all vessel ownership sources
 */

import puppeteer from 'puppeteer';
import axios from 'axios';

const testIMO = '9348522'; // GOLDEN CURL
const scratchpad = '/tmp/claude-0/-root/938eda87-060f-4a53-bcaf-27cf6d148166/scratchpad';

console.log('🔍 DEBUGGING ALL VESSEL OWNERSHIP SOURCES');
console.log('═'.repeat(70));
console.log(`Test Vessel: IMO ${testIMO} (GOLDEN CURL)`);
console.log('═'.repeat(70));

// === TEST 1: Norwegian API ===
async function testNorwegianAPI() {
  console.log('\n📍 TEST 1: Norwegian Maritime Authority API');
  console.log('─'.repeat(70));

  const urls = [
    `https://www.sdir.no/api/vessel/${testIMO}`,
    `https://www.sdir.no/en/shipping/vessels/${testIMO}`,
    `https://www.sdir.no/globalassets/global/api/vessel/${testIMO}`,
    `https://api.sdir.no/vessel/${testIMO}`,
  ];

  for (const url of urls) {
    try {
      console.log(`\nTrying: ${url}`);
      const response = await axios.get(url, {
        timeout: 5000,
        headers: { 'User-Agent': 'Mari8X/1.0' },
        validateStatus: () => true, // Accept any status
      });

      console.log(`  Status: ${response.status}`);
      console.log(`  Content-Type: ${response.headers['content-type']}`);

      if (response.status === 200) {
        if (typeof response.data === 'object') {
          console.log(`  ✅ JSON Response! Keys: ${Object.keys(response.data).join(', ')}`);
          console.log(`  Data:`, JSON.stringify(response.data, null, 2).substring(0, 500));
        } else {
          console.log(`  Response (first 200 chars): ${String(response.data).substring(0, 200)}`);
        }
      }
    } catch (error: any) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
}

// === TEST 2: IMO GISIS ===
async function testIMOGISIS() {
  console.log('\n\n📍 TEST 2: IMO GISIS Website');
  console.log('─'.repeat(70));

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Test different GISIS URLs
    const urls = [
      'https://gisis.imo.org/Public/SHIPS/Default.aspx',
      'https://gisis.imo.org/Public/SHIPS/Search.aspx',
      'https://webaccounts.imo.org/Public/Default.aspx',
    ];

    for (const url of urls) {
      try {
        console.log(`\nNavigating to: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

        const title = await page.title();
        console.log(`  Page Title: ${title}`);

        const pageUrl = page.url();
        console.log(`  Current URL: ${pageUrl}`);

        // Check for input fields
        const inputs = await page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('input'));
          return inputs.map(i => ({
            type: i.type,
            name: i.name,
            id: i.id,
            placeholder: i.placeholder,
          })).slice(0, 10);
        });

        console.log(`  Input fields found: ${inputs.length}`);
        inputs.forEach((inp, i) => {
          console.log(`    [${i}] type=${inp.type} name="${inp.name}" id="${inp.id}" placeholder="${inp.placeholder}"`);
        });

        // Save screenshot
        const screenshotPath = `${scratchpad}/gisis-${url.split('/').pop()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`  Screenshot: ${screenshotPath}`);

        // Check page text
        const pageText = await page.evaluate(() => document.body.textContent);
        console.log(`  Page text sample: ${pageText?.substring(0, 200)}`);

      } catch (error: any) {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }

  } finally {
    await browser.close();
  }
}

// === TEST 3: Equasis ===
async function testEquasis() {
  console.log('\n\n📍 TEST 3: Equasis (User has working account)');
  console.log('─'.repeat(70));

  console.log('Equasis credentials needed from .env:');
  console.log(`  EQUASIS_USERNAME: ${process.env.EQUASIS_USERNAME || 'NOT SET'}`);
  console.log(`  EQUASIS_PASSWORD: ${process.env.EQUASIS_PASSWORD ? '***SET***' : 'NOT SET'}`);

  if (!process.env.EQUASIS_USERNAME || !process.env.EQUASIS_PASSWORD) {
    console.log('\n⚠️  Equasis credentials not in .env - skipping detailed test');
    console.log('  User confirmed manual search works for IMO 9348522');
    return;
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    console.log('\nNavigating to Equasis login...');
    await page.goto('https://www.equasis.org/EquasisWeb/authen/HomePage', {
      waitUntil: 'networkidle2',
      timeout: 15000,
    });

    // Try to login
    console.log('Attempting login...');
    await page.type('input[name="j_email"]', process.env.EQUASIS_USERNAME!);
    await page.type('input[name="j_password"]', process.env.EQUASIS_PASSWORD!);
    await page.click('input[name="_action_submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });

    const loginSuccess = page.url().includes('restricted');
    console.log(`  Login: ${loginSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);

    if (loginSuccess) {
      console.log('\n  Testing search page...');
      await page.goto('https://www.equasis.org/EquasisWeb/restricted/Search?fs=ShipSubcription', {
        waitUntil: 'networkidle2',
      });

      // Analyze search form
      const searchForm = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input, select'));
        const form = document.querySelector('form');
        return {
          formAction: form?.getAttribute('action'),
          formMethod: form?.getAttribute('method'),
          inputs: inputs.map(i => ({
            tag: i.tagName,
            type: (i as HTMLInputElement).type,
            name: (i as HTMLInputElement).name,
            id: i.id,
            placeholder: (i as HTMLInputElement).placeholder,
            value: (i as HTMLInputElement).value,
          })).slice(0, 20),
        };
      });

      console.log('\n  Search Form Analysis:');
      console.log(`    Action: ${searchForm.formAction}`);
      console.log(`    Method: ${searchForm.formMethod}`);
      console.log(`    Input fields (${searchForm.inputs.length}):`);
      searchForm.inputs.forEach((inp, i) => {
        console.log(`      [${i}] ${inp.tag} type=${inp.type} name="${inp.name}" id="${inp.id}"`);
      });

      // Save screenshot
      const screenshotPath = `${scratchpad}/equasis-search-form.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`\n  Screenshot: ${screenshotPath}`);
    }

  } finally {
    await browser.close();
  }
}

// === RUN ALL TESTS ===
async function runAllTests() {
  try {
    await testNorwegianAPI();
    await testIMOGISIS();
    await testEquasis();

    console.log('\n\n' + '═'.repeat(70));
    console.log('🎯 DEBUGGING COMPLETE');
    console.log('═'.repeat(70));
    console.log('\nNext Steps:');
    console.log('  1. Review screenshots in:', scratchpad);
    console.log('  2. Check which source has most promise');
    console.log('  3. Fix the most viable option first');

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
  }
}

runAllTests();
