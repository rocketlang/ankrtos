#!/usr/bin/env tsx
/**
 * Test Equasis with proper search page
 */

import puppeteer from 'puppeteer';

async function main() {
  console.log('Testing Equasis Proper Search Flow');
  console.log('='.repeat(60));

  const testIMO = '9348522'; // GOLDEN CURL

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    // Login
    console.log('1. Logging in...');
    await page.goto('https://www.equasis.org/EquasisWeb/public/HomePage', {
      waitUntil: 'networkidle2',
    });

    await page.evaluate((email: string, pass: string) => {
      const emailInput = document.querySelector('input[name="j_email"]') as HTMLInputElement;
      const passInput = document.querySelector('input[name="j_password"]') as HTMLInputElement;
      if (emailInput) emailInput.value = email;
      if (passInput) passInput.value = pass;
    }, process.env.EQUASIS_USERNAME || '', process.env.EQUASIS_PASSWORD || '');

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button[type="submit"]'))
          .find(b => b.textContent?.includes('Login'));
        if (btn) (btn as HTMLElement).click();
      }),
    ]);

    console.log('✅ Logged in');
    await new Promise(r => setTimeout(r, 2000));

    // Navigate to search page
    console.log('2. Navigating to search page...');
    await page.goto('https://www.equasis.org/EquasisWeb/restricted/Search?fs=ShipSubcription', {
      waitUntil: 'networkidle2',
    });

    await new Promise(r => setTimeout(r, 2000));
    console.log('✅ On search page');

    // Fill search form and submit
    console.log('3. Searching for IMO...');

    const searchResult = await page.evaluate((imo: string) => {
      // Find IMO input field
      const imoInput = document.querySelector('input[name="P_IMO"]') as HTMLInputElement ||
                       document.querySelector('input[placeholder*="IMO"]') as HTMLInputElement ||
                       document.querySelector('input[type="text"]') as HTMLInputElement;

      if (imoInput) {
        imoInput.value = imo;
        imoInput.focus();

        // Find and click search button
        const searchBtn = Array.from(document.querySelectorAll('button, input[type="submit"]'))
          .find(btn => btn.textContent?.includes('Search') || btn.textContent?.includes('search'));

        if (searchBtn) {
          (searchBtn as HTMLElement).click();
          return { filled: true, clicked: true };
        }
        return { filled: true, clicked: false };
      }
      return { filled: false, clicked: false };
    }, testIMO);

    console.log(`   Form filled: ${searchResult.filled ? '✅' : '❌'}`);
    console.log(`   Search clicked: ${searchResult.clicked ? '✅' : '❌'}`);

    if (!searchResult.filled) {
      // Take screenshot to see what's on the page
      await page.screenshot({ path: '/tmp/equasis-search-page.png' });
      console.log('❌ Could not find IMO input. Screenshot saved.');

      // Show form fields available
      const formInfo = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        return inputs.map(inp => ({
          name: inp.getAttribute('name'),
          type: inp.type,
          placeholder: inp.placeholder,
        })).slice(0, 10);
      });

      console.log('\nAvailable form fields:');
      formInfo.forEach(f => console.log(`   - ${f.name || 'no-name'} (${f.type}) ${f.placeholder || ''}`));

      await browser.close();
      return;
    }

    // Wait for navigation to results
    console.log('4. Waiting for results...');
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    } catch (e) {
      console.log('   (No navigation detected, may be AJAX)');
    }

    await new Promise(r => setTimeout(r, 3000));

    // Analyze the page
    const pageInfo = await page.evaluate(() => {
      const title = document.title;
      const bodyText = document.body.textContent || '';

      const hasShipName = bodyText.includes('GOLDEN CURL');
      const hasOwnerInfo = bodyText.includes('Registered owner') || bodyText.includes('owner');
      const hasManagerInfo = bodyText.includes('Ship manager') || bodyText.includes('manager');

      const rows = Array.from(document.querySelectorAll('tr'));
      const rowTexts = rows.slice(0, 40).map(r => r.textContent?.trim());

      return {
        title,
        hasShipName,
        hasOwnerInfo,
        hasManagerInfo,
        rowCount: rows.length,
        rowTexts,
      };
    });

    console.log('\n5. Results:');
    console.log(`   Page title: ${pageInfo.title}`);
    console.log(`   Has ship name: ${pageInfo.hasShipName ? '✅' : '❌'}`);
    console.log(`   Has owner info: ${pageInfo.hasOwnerInfo ? '✅' : '❌'}`);
    console.log(`   Has manager info: ${pageInfo.hasManagerInfo ? '✅' : '❌'}`);
    console.log(`   Table rows: ${pageInfo.rowCount}`);

    if (pageInfo.rowCount > 0) {
      console.log('\n6. Table Rows (first 40):');
      pageInfo.rowTexts.forEach((text, idx) => {
        if (text && text.length > 5) {
          console.log(`   [${idx}] ${text.substring(0, 120)}`);
        }
      });
    }

    await page.screenshot({ path: '/tmp/equasis-results.png', fullPage: true });
    console.log('\n✅ Screenshot saved to /tmp/equasis-results.png');

    const currentUrl = page.url();
    console.log(`\nFinal URL: ${currentUrl}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/equasis-error.png' });
    console.log('Error screenshot saved');
  } finally {
    await browser.close();
  }
}

main();
