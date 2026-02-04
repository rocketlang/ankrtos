#!/usr/bin/env tsx
/**
 * Test IMO GISIS with working public user credentials
 * Login: capt.anil.sharma@powerpbox.org / powerpbox / indrA@0612
 */

import puppeteer from 'puppeteer';
import * as dotenv from 'dotenv';
dotenv.config();

const testIMO = '9348522'; // GOLDEN CURL
const scratchpad = '/tmp/claude-0/-root/938eda87-060f-4a53-bcaf-27cf6d148166/scratchpad';

async function testGISISWithCredentials() {
  console.log('🌊 TESTING IMO GISIS WITH WORKING CREDENTIALS');
  console.log('═'.repeat(70));
  console.log(`Email: ${process.env.GISIS_EMAIL}`);
  console.log(`Username: ${process.env.GISIS_USERNAME}`);
  console.log(`Test Vessel: IMO ${testIMO} (GOLDEN CURL)`);
  console.log('═'.repeat(70));

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // === STEP 1: Navigate to GISIS ===
    console.log('\n📝 STEP 1: Navigating to IMO GISIS...');
    await page.goto('https://gisis.imo.org/', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    console.log(`  Current URL: ${page.url()}`);
    await page.screenshot({ path: `${scratchpad}/gisis-1-home.png`, fullPage: true });

    // === STEP 2: Find and click Login ===
    console.log('\n📝 STEP 2: Looking for login link...');

    // Try different login link selectors
    const loginClicked = await page.evaluate(() => {
      // Look for login link/button
      const loginLinks = Array.from(document.querySelectorAll('a, button'));
      const loginLink = loginLinks.find(el =>
        el.textContent?.toLowerCase().includes('login') ||
        el.textContent?.toLowerCase().includes('sign in')
      );

      if (loginLink) {
        (loginLink as HTMLElement).click();
        return true;
      }
      return false;
    });

    if (loginClicked) {
      console.log('  ✅ Clicked login link');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    } else {
      console.log('  ℹ️  No login link found, checking if already on login page');
    }

    await page.screenshot({ path: `${scratchpad}/gisis-2-login-page.png`, fullPage: true });
    console.log(`  Current URL: ${page.url()}`);

    // === STEP 3: Fill in login form (Authority + Username) ===
    console.log('\n📝 STEP 3: Filling in login form...');

    // Analyze form fields
    const formInfo = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, select'));
      return inputs.map((el: any) => ({
        type: el.type || el.tagName,
        name: el.name,
        id: el.id,
        placeholder: el.placeholder || '',
      }));
    });

    console.log('  Form fields found:');
    formInfo.forEach((f, i) => {
      if (f.type !== 'hidden') {
        console.log(`    [${i}] type=${f.type} name="${f.name}" id="${f.id}" placeholder="${f.placeholder}"`);
      }
    });

    // First, select authority if dropdown exists
    const authoritySelected = await page.evaluate(() => {
      const authoritySelect = document.querySelector('select[id*="ddlAuth"]') as HTMLSelectElement ||
                              document.querySelector('select') as HTMLSelectElement;

      if (authoritySelect && authoritySelect.options.length > 1) {
        // Select the first non-empty option (skip "-- Please select --")
        for (let i = 1; i < authoritySelect.options.length; i++) {
          if (authoritySelect.options[i].value) {
            authoritySelect.selectedIndex = i;
            authoritySelect.dispatchEvent(new Event('change', { bubbles: true }));
            return `✅ Selected authority: ${authoritySelect.options[i].text}`;
          }
        }
      }
      return '⚠️ No authority dropdown found or no options available';
    });

    console.log(`  ${authoritySelected}`);

    // Wait for form to update after authority selection
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Try to find and fill username/email field
    const usernameEntered = await page.evaluate((username: string) => {
      const usernameInput =
        document.querySelector('input[name*="Username"]') as HTMLInputElement ||
        document.querySelector('input[name="username"]') as HTMLInputElement ||
        document.querySelector('input[name="email"]') as HTMLInputElement ||
        document.querySelector('input[type="text"]') as HTMLInputElement ||
        document.querySelector('input[id*="user"]') as HTMLInputElement ||
        document.querySelector('input[id*="login"]') as HTMLInputElement;

      if (usernameInput) {
        usernameInput.value = username;
        usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
        usernameInput.dispatchEvent(new Event('change', { bubbles: true }));
        return `✅ Entered username in: ${usernameInput.name || usernameInput.id || 'first text input'}`;
      }
      return '❌ No username field found';
    }, process.env.GISIS_USERNAME!);

    console.log(`  ${usernameEntered}`);

    await page.screenshot({ path: `${scratchpad}/gisis-3-username-filled.png`, fullPage: true });

    // === STEP 4: Submit username (to get password field) ===
    console.log('\n📝 STEP 4: Submitting username...');

    try {
      // Use Puppeteer's native click instead of evaluate for ASP.NET forms
      // Try multiple button selectors
      let submitBtn = await page.$('input[name*="btnNext"]');
      if (!submitBtn) submitBtn = await page.$('input[name*="btnStep1"]');
      if (!submitBtn) submitBtn = await page.$('button:has-text("Next")');

      if (submitBtn) {
        console.log('  ✅ Found submit button, clicking...');
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {
            console.log('  No navigation after click');
          }),
          submitBtn.click(),
        ]);
      } else {
        console.log('  ❌ Submit button not found');
      }
    } catch (e: any) {
      console.log(`  ⚠️ Click error: ${e.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for form to update

    console.log(`  Current URL: ${page.url()}`);
    await page.screenshot({ path: `${scratchpad}/gisis-4-after-username.png`, fullPage: true });

    // === STEP 5: Fill in PASSWORD (Step 2 of 2) ===
    console.log('\n📝 STEP 5: Filling in password (Step 2/2)...');

    // Check if password field now exists
    const passwordFormInfo = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.map(i => ({
        type: i.type,
        name: i.name,
        id: i.id,
      }));
    });

    console.log('  Form fields after username submit:');
    passwordFormInfo.forEach((f, i) => {
      if (f.type !== 'hidden') {
        console.log(`    [${i}] type=${f.type} name="${f.name}" id="${f.id}"`);
      }
    });

    const passwordEntered = await page.evaluate((password: string) => {
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

      if (passwordInput) {
        passwordInput.value = password;
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
        passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
        return `✅ Entered password in: ${passwordInput.name || passwordInput.id || 'password field'}`;
      }
      return '❌ No password field found';
    }, process.env.GISIS_PASSWORD!);

    console.log(`  ${passwordEntered}`);

    await page.screenshot({ path: `${scratchpad}/gisis-5-password-filled.png`, fullPage: true });

    // === STEP 6: Submit password (final login) ===
    console.log('\n📝 STEP 6: Submitting password (final login)...');

    await page.evaluate(() => {
      const submitBtn =
        document.querySelector('input[name*="btnLogin"]') as HTMLElement ||
        document.querySelector('input[name*="btnStep2"]') as HTMLElement ||
        document.querySelector('button[type="submit"]') as HTMLElement ||
        document.querySelector('input[type="submit"]') as HTMLElement ||
        Array.from(document.querySelectorAll('button, input')).find(el =>
          el.textContent?.toLowerCase().includes('log') ||
          el.textContent?.toLowerCase().includes('sign')
        ) as HTMLElement;

      if (submitBtn) {
        submitBtn.click();
      }
    });

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {
      console.log('  No navigation detected');
    });

    console.log(`  Current URL: ${page.url()}`);
    await page.screenshot({ path: `${scratchpad}/gisis-6-after-login.png`, fullPage: true });

    // === STEP 7: Check if login succeeded ===
    const loginSuccess = !page.url().includes('login') && !page.url().includes('signin');
    console.log(`  Login: ${loginSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);

    if (!loginSuccess) {
      console.log('\n  Checking page for error messages...');
      const pageText = await page.evaluate(() => document.body.textContent?.substring(0, 500));
      console.log(`  Page text: ${pageText}`);
      return;
    }

    // === STEP 8: Navigate to Ship and Company Particulars ===
    console.log('\n📝 STEP 8: Navigating to Ship and Company Particulars...');

    // Try to find "Ship and Company Particulars" link
    const shipSearchFound = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const shipLink = links.find(a =>
        a.textContent?.includes('Ship and Company') ||
        a.textContent?.includes('Particulars')
      );

      if (shipLink) {
        (shipLink as HTMLElement).click();
        return true;
      }
      return false;
    });

    if (shipSearchFound) {
      console.log('  ✅ Found Ship and Company Particulars link, clicked');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    } else {
      // Try direct URL to ship search page
      console.log('  Trying direct URL to ship search...');
      await page.goto('https://gisis.imo.org/Public/SHIPS/Default.aspx', {
        waitUntil: 'networkidle2',
        timeout: 15000,
      });
    }

    console.log(`  Current URL: ${page.url()}`);

    // Wait for search form to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.screenshot({ path: `${scratchpad}/gisis-8-ship-search.png`, fullPage: true });

    // === STEP 9: Search for vessel ===
    console.log('\n📝 STEP 9: Searching for vessel...');

    // Analyze all input fields on the page
    const searchFormInfo = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.map(i => ({
        type: i.type,
        name: i.name,
        id: i.id,
        placeholder: i.placeholder || '',
      }));
    });

    console.log('  Search form fields found:');
    searchFormInfo.forEach((f, i) => {
      if (f.type !== 'hidden' && f.type !== 'checkbox') {
        console.log(`    [${i}] type=${f.type} name="${f.name}" id="${f.id}" placeholder="${f.placeholder}"`);
      }
    });

    // Fill in IMO number
    const imoEntered = await page.evaluate((imo: string) => {
      // Try multiple selectors for IMO input
      const imoInput =
        document.querySelector('input[name*="IMONumber"]') as HTMLInputElement ||
        document.querySelector('input[name*="IMO"]') as HTMLInputElement ||
        document.querySelector('input[id*="IMO"]') as HTMLInputElement ||
        document.querySelector('input[id*="imo"]') as HTMLInputElement ||
        document.querySelector('input[placeholder*="IMO"]') as HTMLInputElement ||
        // Try getting the first text input in the Ships section
        Array.from(document.querySelectorAll('input[type="text"]'))[0] as HTMLInputElement;

      if (imoInput) {
        imoInput.value = imo;
        imoInput.dispatchEvent(new Event('input', { bubbles: true }));
        imoInput.dispatchEvent(new Event('change', { bubbles: true }));
        return `✅ Entered IMO in: ${imoInput.name || imoInput.id || 'first text input'}`;
      }
      return '❌ No IMO input found';
    }, testIMO);

    console.log(`  ${imoEntered}`);

    await page.screenshot({ path: `${scratchpad}/gisis-9-imo-entered.png`, fullPage: true });

    // Click search button
    console.log('  Clicking search button...');

    try {
      const searchBtn = await page.$('input[value="Search"]') ||
                       await page.$('button:has-text("Search")') ||
                       await page.$('input[type="submit"]');

      if (searchBtn) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
          searchBtn.click(),
        ]);
        console.log('  ✅ Search submitted');
      } else {
        console.log('  ❌ Search button not found');
      }
    } catch (e: any) {
      console.log(`  ⚠️ Search click error: ${e.message}`);
    }

    console.log(`  Results URL: ${page.url()}`);
    await page.screenshot({ path: `${scratchpad}/gisis-10-results.png`, fullPage: true });

    // === STEP 10: Click on vessel name to view details ===
    console.log('\n📝 STEP 10: Clicking on vessel to view details...');

    // First check what links are available
    const availableLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).map(a => a.textContent?.trim()).filter(t => t);
    });

    console.log(`  Available links on results page: ${availableLinks.slice(0, 10).join(', ')}`);

    try {
      // User confirmed: entire row (Name, Flag, Type) is clickable
      // Wait for table to fully render
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Find the actual results data table (not the search form)
      const resultsTableDebug = await page.evaluate(() => {
        // Find table where GOLDEN CURL appears in a TD cell (not in form inputs)
        const tables = Array.from(document.querySelectorAll('table'));
        const resultsTable = tables.find(t => {
          const dataCells = Array.from(t.querySelectorAll('td'));
          return dataCells.some(td =>
            td.textContent?.toUpperCase().includes('GOLDEN CURL')
          );
        });

        if (resultsTable) {
          const rows = Array.from(resultsTable.querySelectorAll('tr'));
          return {
            found: true,
            rows: rows.map(row => ({
              text: row.textContent?.trim().substring(0, 120),
              cells: Array.from(row.querySelectorAll('td, th')).map(td => td.textContent?.trim()),
            })),
          };
        }
        return { found: false, rows: [] };
      });

      console.log(`  Ship Results table found: ${resultsTableDebug.found}`);
      if (resultsTableDebug.found) {
        console.log('  Rows in Ship Results table:');
        resultsTableDebug.rows.forEach((row, i) => {
          if (row.cells.length > 0) {
            console.log(`    Row ${i}: ${row.cells.join(' | ')}`);
          }
        });
      }

      // Approach 1: Click on table cell or row
      console.log('  Looking for GOLDEN CURL row...');

      const rowClicked = await page.evaluate(() => {
        // Find table where GOLDEN CURL appears in TD cells (not form inputs)
        const tables = Array.from(document.querySelectorAll('table'));
        const resultsTable = tables.find(t => {
          const dataCells = Array.from(t.querySelectorAll('td'));
          return dataCells.some(td =>
            td.textContent?.toUpperCase().includes('GOLDEN CURL')
          );
        });

        if (!resultsTable) {
          return '❌ Results table with GOLDEN CURL in TD not found';
        }

        // Find the row with GOLDEN CURL
        const rows = Array.from(resultsTable.querySelectorAll('tr'));
        for (const row of rows) {
          const text = row.textContent || '';
          const cells = Array.from(row.querySelectorAll('td'));

          // Skip header rows
          if (cells.length < 2) continue;

          // Check if this is the GOLDEN CURL row
          const hasVesselName = text.toUpperCase().includes('GOLDEN CURL');
          const hasFlag = text.includes('Singapore');

          if (hasVesselName && hasFlag) {
            // Found the vessel row! Try to click it
            const firstCell = cells[0];
            const link = firstCell.querySelector('a');

            if (link) {
              (link as HTMLElement).click();
              return `✅ Clicked link in Name cell: ${link.textContent?.trim()}`;
            } else {
              // Try clicking the cell directly
              (firstCell as HTMLElement).click();
              return `✅ Clicked Name cell directly: ${firstCell.textContent?.trim()}`;
            }
          }
        }
        return '❌ GOLDEN CURL row not found in results table';
      });

      if (rowClicked) {
        console.log(`  ✅ ${rowClicked}`);
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {
            console.log('  Navigation timeout, but page may have loaded');
          }),
          new Promise(resolve => setTimeout(resolve, 3000)),
        ]);
      } else {
        console.log('  ⚠️ Could not find clickable row');
      }
    } catch (e: any) {
      console.log(`  ⚠️ Click error: ${e.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for details to load

    console.log(`  Details URL: ${page.url()}`);
    await page.screenshot({ path: `${scratchpad}/gisis-11-vessel-details.png`, fullPage: true });

    // === STEP 11: Extract vessel data from details page ===
    console.log('\n📝 STEP 11: Extracting vessel data from details page...');

    const vesselData = await page.evaluate(() => {
      const data: any = {};

      try {
        const pageText = document.body.textContent || '';

        // Helper function to extract value after a label
        const extractValue = (label: string): string | null => {
          const lines = pageText.split('\n').map(l => l.trim()).filter(l => l);
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(label.toLowerCase())) {
              // Check if value is on same line
              const parts = lines[i].split(':');
              if (parts.length > 1) {
                return parts.slice(1).join(':').trim();
              }
              // Check next line
              if (i + 1 < lines.length) {
                return lines[i + 1];
              }
            }
          }
          return null;
        };

        // Extract basic ship particulars
        data.name = extractValue('Name:') || extractValue('Ship name:');
        data.imo = extractValue('IMO Number:') || extractValue('IMO:');
        data.callSign = extractValue('Call sign:');
        data.flag = extractValue('Flag:');
        data.mmsi = extractValue('MMSI:');
        data.type = extractValue('Type:');
        data.buildDate = extractValue('Date of build:');
        data.grossTonnage = extractValue('Gross tonnage:');

        // Extract ownership data - THE GOAL!
        data.owner = extractValue('Registered owner:');
        data.operator = extractValue('Operator:') || extractValue('Ship operator:');
        data.technicalManager = extractValue('Technical manager:');
        data.shipManager = extractValue('Ship manager:');
        data.docCompany = extractValue('DOC company:') || extractValue('Company responsible for DOC:');
        data.ismManager = extractValue('ISM manager:') || extractValue('Company:');

        // Check if we're on the details page
        data.isDetailsPage = pageText.includes('Ship Particulars') ||
                            pageText.includes('Companies') ||
                            pageText.includes('Registered owner');

        // Get page text sample
        data.pageText = pageText.substring(0, 2000);

      } catch (err: any) {
        data.error = err.message;
      }

      return data;
    });

    console.log('\n═'.repeat(70));
    console.log('📊 EXTRACTED DATA:');
    console.log('═'.repeat(70));
    console.log(`  Page Type:         ${vesselData.isDetailsPage ? '✅ Details Page' : '⚠️ Results Page'}`);
    console.log(`  Name:              ${vesselData.name || 'N/A'}`);
    console.log(`  IMO:               ${vesselData.imo || 'N/A'}`);
    console.log(`  Call Sign:         ${vesselData.callSign || 'N/A'}`);
    console.log(`  MMSI:              ${vesselData.mmsi || 'N/A'}`);
    console.log(`  Flag:              ${vesselData.flag || 'N/A'}`);
    console.log(`  Type:              ${vesselData.type || 'N/A'}`);
    console.log(`  Built:             ${vesselData.buildDate || 'N/A'}`);
    console.log(`  Gross Tonnage:     ${vesselData.grossTonnage || 'N/A'}`);

    console.log('\n🏢 OWNERSHIP DATA (MOMENT OF TRUTH!):');
    console.log(`  ⭐ Registered Owner:  ${vesselData.owner || '❌ NOT FOUND'}`);
    console.log(`  ⭐ Operator:          ${vesselData.operator || '❌ NOT FOUND'}`);
    console.log(`  ⭐ Technical Manager: ${vesselData.technicalManager || '❌ NOT FOUND'}`);
    console.log(`  ⭐ Ship Manager:      ${vesselData.shipManager || '❌ NOT FOUND'}`);
    console.log(`  ⭐ DOC Company:       ${vesselData.docCompany || '❌ NOT FOUND'}`);
    console.log(`  ⭐ ISM Manager:       ${vesselData.ismManager || '❌ NOT FOUND'}`);

    console.log('\n📄 Page sample (first 500 chars):');
    console.log(vesselData.pageText?.substring(0, 500));

    const hasOwnership = !!(
      vesselData.owner ||
      vesselData.operator ||
      vesselData.technicalManager ||
      vesselData.docCompany ||
      vesselData.ismManager
    );

    console.log('\n═'.repeat(70));
    if (hasOwnership) {
      console.log('🎉 SUCCESS! We got OWNERSHIP DATA from IMO GISIS!');
      console.log('✅ WORKFLOW UNLOCKED: AIS → Owner/Operator → Load Matching');
    } else {
      console.log('⚠️  Data extracted but ownership fields empty');
      console.log('   Check screenshots in:', scratchpad);
    }
    console.log('═'.repeat(70));

    console.log('\n📸 Screenshots saved:');
    console.log(`   1. ${scratchpad}/gisis-1-home.png`);
    console.log(`   2. ${scratchpad}/gisis-2-login-page.png`);
    console.log(`   3. ${scratchpad}/gisis-3-username-filled.png`);
    console.log(`   4. ${scratchpad}/gisis-4-after-username.png`);
    console.log(`   5. ${scratchpad}/gisis-5-password-filled.png`);
    console.log(`   6. ${scratchpad}/gisis-6-after-login.png`);
    console.log(`   7. ${scratchpad}/gisis-8-ship-search.png`);
    console.log(`   8. ${scratchpad}/gisis-9-imo-entered.png`);
    console.log(`   9. ${scratchpad}/gisis-10-results.png`);
    console.log(`  10. ${scratchpad}/gisis-11-vessel-details.png`);

  } catch (error: any) {
    console.log('\n❌ ERROR:', error.message);
    console.log(error.stack);
  } finally {
    await browser.close();
  }
}

testGISISWithCredentials().catch(console.error);
