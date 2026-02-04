#!/usr/bin/env tsx
/**
 * Test fixed Equasis scraper with proper form handling
 */

import puppeteer from 'puppeteer';
import * as dotenv from 'dotenv';
dotenv.config();

const testIMO = '9348522'; // GOLDEN CURL
const scratchpad = '/tmp/claude-0/-root/938eda87-060f-4a53-bcaf-27cf6d148166/scratchpad';

async function testEquasisFixed() {
  console.log('🌊 TESTING FIXED EQUASIS SCRAPER');
  console.log('═'.repeat(70));
  console.log(`Test Vessel: IMO ${testIMO} (GOLDEN CURL)`);
  console.log('═'.repeat(70));

  const username = process.env.EQUASIS_USERNAME;
  const password = process.env.EQUASIS_PASSWORD;

  if (!username || !password) {
    console.log('❌ Equasis credentials not found in .env');
    return;
  }

  console.log(`\n✅ Credentials found: ${username}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // === STEP 1: Login ===
    console.log('\n📝 STEP 1: Logging in to Equasis...');
    await page.goto('https://www.equasis.org/EquasisWeb/authen/HomePage', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await page.type('input[name="j_email"]', username);
    await page.type('input[name="j_password"]', password);
    await page.click('input[name="_action_submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });

    const loginSuccess = page.url().includes('restricted');
    console.log(`  Login: ${loginSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);

    if (!loginSuccess) {
      console.log('  Current URL:', page.url());
      return;
    }

    // === STEP 2: Navigate to Advanced Search ===
    console.log('\n📝 STEP 2: Navigating to Ship Search...');
    const searchUrl = 'https://www.equasis.org/EquasisWeb/restricted/ShipAdvanced?fs=HomePage';
    await page.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    console.log(`  Current URL: ${page.url()}`);

    // Take screenshot of search form
    await page.screenshot({ path: `${scratchpad}/equasis-search-before.png`, fullPage: true });
    console.log(`  Screenshot: ${scratchpad}/equasis-search-before.png`);

    // === STEP 3: Analyze the search form ===
    console.log('\n📝 STEP 3: Analyzing search form...');
    const formInfo = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
      const submitButtons = Array.from(document.querySelectorAll('input[type="submit"], button[type="submit"]'));

      return {
        inputs: inputs.map(i => ({
          tag: i.tagName,
          type: (i as HTMLInputElement).type,
          name: (i as HTMLInputElement).name || '',
          id: i.id || '',
          placeholder: (i as HTMLInputElement).placeholder || '',
          value: (i as HTMLInputElement).value || '',
        })),
        submitButtons: submitButtons.map(b => ({
          tag: b.tagName,
          type: (b as HTMLInputElement).type,
          name: (b as HTMLInputElement).name || '',
          text: b.textContent?.trim() || '',
        })),
      };
    });

    console.log(`  Found ${formInfo.inputs.length} form fields:`);
    formInfo.inputs.forEach((inp, i) => {
      if (inp.type !== 'hidden') {
        console.log(`    [${i}] ${inp.tag} type="${inp.type}" name="${inp.name}" id="${inp.id}" placeholder="${inp.placeholder}"`);
      }
    });

    console.log(`\n  Found ${formInfo.submitButtons.length} submit buttons:`);
    formInfo.submitButtons.forEach((btn, i) => {
      console.log(`    [${i}] ${btn.tag} name="${btn.name}" text="${btn.text}"`);
    });

    // === STEP 4: Fill in IMO number ===
    console.log('\n📝 STEP 4: Entering IMO number...');

    // Try multiple strategies to enter IMO
    const imoEntered = await page.evaluate((imo: string) => {
      // Strategy 1: Find input with name containing "IMO" or "P_IMO"
      let imoInput = document.querySelector('input[name*="IMO"]') as HTMLInputElement;
      if (imoInput) {
        imoInput.value = imo;
        imoInput.dispatchEvent(new Event('input', { bubbles: true }));
        imoInput.dispatchEvent(new Event('change', { bubbles: true }));
        return `✅ Found input with name="${imoInput.name}"`;
      }

      // Strategy 2: Find input with ID containing "IMO"
      imoInput = document.querySelector('input[id*="IMO"]') as HTMLInputElement;
      if (imoInput) {
        imoInput.value = imo;
        imoInput.dispatchEvent(new Event('input', { bubbles: true }));
        return `✅ Found input with id="${imoInput.id}"`;
      }

      // Strategy 3: Find first text input (might be the IMO field)
      imoInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (imoInput) {
        imoInput.value = imo;
        imoInput.dispatchEvent(new Event('input', { bubbles: true }));
        return `✅ Found first text input with name="${imoInput.name}"`;
      }

      return '❌ No suitable input found';
    }, testIMO);

    console.log(`  ${imoEntered}`);

    // Take screenshot after filling
    await page.screenshot({ path: `${scratchpad}/equasis-search-filled.png`, fullPage: true });
    console.log(`  Screenshot: ${scratchpad}/equasis-search-filled.png`);

    // === STEP 5: Submit the search ===
    console.log('\n📝 STEP 5: Submitting search...');

    await page.evaluate(() => {
      // Try to find and click submit button
      const submitBtn = document.querySelector('input[type="submit"], button[type="submit"]') as HTMLElement;
      if (submitBtn) {
        submitBtn.click();
      }
    });

    // Wait for navigation or results
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {
      console.log('  No navigation detected, checking for results...');
    });

    console.log(`  Result URL: ${page.url()}`);

    // Take screenshot of results
    await page.screenshot({ path: `${scratchpad}/equasis-results.png`, fullPage: true });
    console.log(`  Screenshot: ${scratchpad}/equasis-results.png`);

    // === STEP 6: Extract vessel data ===
    console.log('\n📝 STEP 6: Extracting vessel data...');

    const vesselData = await page.evaluate(() => {
      const data: any = {};

      // Helper to get text from table rows
      const getTableValue = (labelText: string): string | null => {
        const rows = Array.from(document.querySelectorAll('tr, td, th'));
        const label = rows.find(el => el.textContent?.toLowerCase().includes(labelText.toLowerCase()));
        if (label) {
          const nextSibling = label.nextElementSibling;
          if (nextSibling) return nextSibling.textContent?.trim() || null;

          const parent = label.parentElement;
          if (parent) {
            const cells = Array.from(parent.querySelectorAll('td'));
            if (cells.length >= 2) return cells[1].textContent?.trim() || null;
          }
        }
        return null;
      };

      // Extract basic info
      data.name = getTableValue('name') || getTableValue('ship name');
      data.imo = getTableValue('imo');
      data.flag = getTableValue('flag');
      data.shipType = getTableValue('type') || getTableValue('ship type');
      data.grossTonnage = getTableValue('gross tonnage') || getTableValue('gt');
      data.deadweight = getTableValue('deadweight') || getTableValue('dwt');

      // Extract ownership - THIS IS THE GOAL!
      data.registeredOwner = getTableValue('registered owner') || getTableValue('owner');
      data.operator = getTableValue('operator') || getTableValue('doc company');
      data.technicalManager = getTableValue('technical manager') || getTableValue('manager');
      data.shipManager = getTableValue('ship manager');

      // Get page text to check what's available
      data.pageText = document.body.textContent?.substring(0, 500);

      return data;
    });

    console.log('\n═'.repeat(70));
    console.log('📊 EXTRACTED DATA:');
    console.log('═'.repeat(70));
    console.log(`  Name:              ${vesselData.name || 'N/A'}`);
    console.log(`  IMO:               ${vesselData.imo || 'N/A'}`);
    console.log(`  Flag:              ${vesselData.flag || 'N/A'}`);
    console.log(`  Ship Type:         ${vesselData.shipType || 'N/A'}`);
    console.log(`  Gross Tonnage:     ${vesselData.grossTonnage || 'N/A'}`);
    console.log(`  Deadweight:        ${vesselData.deadweight || 'N/A'}`);

    console.log('\n🏢 OWNERSHIP DATA (MOMENT OF TRUTH!):');
    console.log(`  ⭐ Registered Owner:  ${vesselData.registeredOwner || '❌ NOT FOUND'}`);
    console.log(`  ⭐ Operator:          ${vesselData.operator || '❌ NOT FOUND'}`);
    console.log(`  ⭐ Technical Manager: ${vesselData.technicalManager || '❌ NOT FOUND'}`);
    console.log(`  ⭐ Ship Manager:      ${vesselData.shipManager || '❌ NOT FOUND'}`);

    console.log('\n📄 Page sample:');
    console.log(vesselData.pageText);

    const hasOwnership = !!(vesselData.registeredOwner || vesselData.operator || vesselData.technicalManager);

    console.log('\n═'.repeat(70));
    if (hasOwnership) {
      console.log('🎉 SUCCESS! We got OWNERSHIP DATA from Equasis!');
    } else {
      console.log('⚠️  Data extracted but ownership fields empty');
      console.log('   Check screenshots to see what\'s on the page');
    }
    console.log('═'.repeat(70));

  } catch (error: any) {
    console.log('\n❌ ERROR:', error.message);
    console.log(error.stack);
  } finally {
    await browser.close();
  }
}

testEquasisFixed();
