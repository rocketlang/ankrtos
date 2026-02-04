#!/usr/bin/env tsx
/**
 * Test Equasis Search Flow
 * Uses search form instead of direct URL navigation
 */

import puppeteer from 'puppeteer';

async function main() {
  console.log('Testing Equasis Search Flow');
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

    const username = process.env.EQUASIS_USERNAME || '';
    const password = process.env.EQUASIS_PASSWORD || '';

    await page.evaluate((email: string) => {
      const input = document.querySelector('input[name="j_email"]') as HTMLInputElement;
      if (input) input.value = email;
    }, username);

    await page.evaluate((pass: string) => {
      const input = document.querySelector('input[name="j_password"]') as HTMLInputElement;
      if (input) input.value = pass;
    }, password);

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

    // Use search form
    console.log('2. Searching for IMO via search form...');

    // Type in search box
    await page.type('input[placeholder*="IMO"]', testIMO);
    await new Promise(r => setTimeout(r, 1000));

    // Click search button or press Enter
    await page.keyboard.press('Enter');

    console.log('3. Waiting for results...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));

    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);

    // Check if we got to ship info page
    const shipData = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      const hasShipInfo = bodyText.includes('GOLDEN CURL') ||
                          bodyText.includes('Registered owner') ||
                          bodyText.includes('Ship manager');

      // Try to extract table rows
      const rows = Array.from(document.querySelectorAll('tr'));
      const rowTexts = rows.slice(0, 30).map(r => r.textContent?.trim().substring(0, 100));

      return {
        hasShipInfo,
        rowCount: rows.length,
        rowSamples: rowTexts,
      };
    });

    console.log('\n4. Page Analysis:');
    console.log(`   Has ship info: ${shipData.hasShipInfo ? '✅' : '❌'}`);
    console.log(`   Table rows found: ${shipData.rowCount}`);

    if (shipData.rowCount > 0) {
      console.log('\n5. Table Row Samples:');
      shipData.rowSamples.forEach((text, idx) => {
        if (text) console.log(`   ${idx}: ${text}`);
      });
    }

    // Save screenshot
    await page.screenshot({ path: '/tmp/equasis-search-result.png', fullPage: true });
    console.log('\n✅ Screenshot saved to /tmp/equasis-search-result.png');

    // Keep browser open for 30 seconds to inspect
    console.log('\nBrowser will stay open for 30 seconds for manual inspection...');
    await new Promise(r => setTimeout(r, 30000));

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal:', error);
    process.exit(1);
  });
