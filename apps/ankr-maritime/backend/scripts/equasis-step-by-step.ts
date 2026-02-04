#!/usr/bin/env tsx
/**
 * Equasis Step-by-Step with Screenshots
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';

async function main() {
  console.log('Equasis Step-by-Step Debug');
  console.log('='.repeat(60));

  const testIMO = '9348522';
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    // Step 1: Login
    console.log('Step 1: Login');
    await page.goto('https://www.equasis.org/EquasisWeb/public/HomePage', {
      waitUntil: 'networkidle2',
    });

    await page.evaluate((u: string, p: string) => {
      const e = document.querySelector('input[name="j_email"]') as HTMLInputElement;
      const pw = document.querySelector('input[name="j_password"]') as HTMLInputElement;
      if (e) e.value = u;
      if (pw) pw.value = p;
    }, process.env.EQUASIS_USERNAME || '', process.env.EQUASIS_PASSWORD || '');

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button[type="submit"]'))
          .find(b => b.textContent?.includes('Login'));
        if (btn) (btn as HTMLElement).click();
      }),
    ]);

    await page.screenshot({ path: '/tmp/eq-1-logged-in.png' });
    console.log('✅ Step 1 done, screenshot: /tmp/eq-1-logged-in.png');

    // Step 2: Navigate to search page
    console.log('\nStep 2: Navigate to search');
    await page.goto('https://www.equasis.org/EquasisWeb/restricted/Search?fs=ShipSubcription', {
      waitUntil: 'networkidle2',
    });

    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: '/tmp/eq-2-search-page.png' });
    console.log('✅ Step 2 done, screenshot: /tmp/eq-2-search-page.png');

    // Step 3: Analyze form
    console.log('\nStep 3: Analyzing form');
    const formInfo = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));

      return {
        inputs: inputs.map(inp => ({
          name: inp.name,
          id: inp.id,
          type: inp.type,
          placeholder: inp.placeholder,
          value: inp.value,
        })).slice(0, 15),
        buttons: buttons.map(btn => ({
          text: btn.textContent?.trim().substring(0, 50),
          type: btn.getAttribute('type'),
        })).slice(0, 10),
      };
    });

    console.log('Form inputs:');
    formInfo.inputs.forEach((inp, idx) => {
      console.log(`  ${idx}. name="${inp.name}" id="${inp.id}" type="${inp.type}" placeholder="${inp.placeholder}"`);
    });

    console.log('\nButtons:');
    formInfo.buttons.forEach((btn, idx) => {
      console.log(`  ${idx}. "${btn.text}" type="${btn.type}"`);
    });

    // Step 4: Fill form
    console.log('\nStep 4: Filling IMO');

    // Try multiple approaches to fill the form
    const filled = await page.evaluate((imo: string) => {
      // Approach 1: Find by name
      let input = document.querySelector('input[name="P_IMO"]') as HTMLInputElement;

      // Approach 2: Find by placeholder
      if (!input) {
        input = Array.from(document.querySelectorAll('input'))
          .find(inp => inp.placeholder?.toLowerCase().includes('imo')) as HTMLInputElement;
      }

      // Approach 3: Find first visible text input
      if (!input) {
        input = Array.from(document.querySelectorAll('input[type="text"]'))
          .find(inp => inp.offsetParent !== null) as HTMLInputElement;
      }

      if (input) {
        input.value = imo;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return { found: true, name: input.name, id: input.id };
      }

      return { found: false, name: '', id: '' };
    }, testIMO);

    console.log(`   Filled: ${filled.found ? '✅' : '❌'} (name="${filled.name}", id="${filled.id}")`);

    await page.screenshot({ path: '/tmp/eq-3-form-filled.png' });
    console.log('✅ Step 3 done, screenshot: /tmp/eq-3-form-filled.png');

    // Step 5: Submit
    console.log('\nStep 5: Submitting search');

    // Just press Enter - most reliable
    await page.keyboard.press('Enter');
    console.log('   Pressed Enter');

    // Wait a bit
    await new Promise(r => setTimeout(r, 8000));

    await page.screenshot({ path: '/tmp/eq-4-after-submit.png' });
    console.log('✅ Step 4 done, screenshot: /tmp/eq-4-after-submit.png');

    // Step 6: Analyze results
    console.log('\nStep 6: Analyzing results');
    const results = await page.evaluate(() => {
      const title = document.title;
      const url = window.location.href;
      const bodyText = document.body.textContent || '';

      const allRows = Array.from(document.querySelectorAll('tr'));
      const rowsText = allRows.map(r => r.textContent?.trim().substring(0, 150));

      return {
        title,
        url,
        hasGoldenCurl: bodyText.includes('GOLDEN CURL'),
        hasResults: bodyText.includes('Results list'),
        rowCount: allRows.length,
        rows: rowsText,
      };
    });

    console.log(`   Title: ${results.title}`);
    console.log(`   URL: ${results.url}`);
    console.log(`   Has "GOLDEN CURL": ${results.hasGoldenCurl ? '✅' : '❌'}`);
    console.log(`   Has "Results list": ${results.hasResults ? '✅' : '❌'}`);
    console.log(`   Rows: ${results.rowCount}`);

    if (results.rowCount > 0) {
      console.log('\n   Row contents:');
      results.rows.forEach((text, idx) => {
        if (text && text.length > 10) {
          console.log(`     [${idx}] ${text}`);
        }
      });
    }

    // Save final HTML
    const html = await page.content();
    await fs.writeFile('/tmp/eq-final.html', html);
    console.log('\n✅ Full HTML saved to /tmp/eq-final.html');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/eq-error.png' });
  } finally {
    await browser.close();
  }

  console.log('\n' + '='.repeat(60));
  console.log('Check screenshots in /tmp/eq-*.png');
}

main();
