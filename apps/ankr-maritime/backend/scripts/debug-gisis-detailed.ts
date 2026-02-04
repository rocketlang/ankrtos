/**
 * Debug GISIS scraper with detailed logging
 */

import puppeteer from 'puppeteer';

async function main() {
  let browser = null;

  try {
    console.log('\n🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const testIMO = '9811000'; // EVER GIVEN
    const searchUrl = 'https://gisis.imo.org/Public/SHIPS/Default.aspx';

    console.log(`\n📍 Navigating to: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    console.log('✅ Page loaded');

    // Take screenshot of initial page
    await page.screenshot({ path: '/tmp/gisis-step1-initial.png' });
    console.log('📸 Screenshot saved: /tmp/gisis-step1-initial.png');

    // Get page title
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);

    // Check for IMO input field
    console.log('\n🔍 Looking for IMO input field...');
    const imoInputExists = await page.evaluate(() => {
      const input = document.querySelector('input[name*="IMO"]');
      return {
        exists: !!input,
        selector: input ? input.getAttribute('name') : null,
        id: input ? (input as HTMLElement).id : null,
      };
    });

    console.log('IMO Input Field:', JSON.stringify(imoInputExists, null, 2));

    // List all input fields on the page
    console.log('\n📋 All input fields on page:');
    const allInputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input')).map((input) => ({
        type: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
      }));
    });
    console.log(JSON.stringify(allInputs, null, 2));

    // Try to find search button
    console.log('\n🔍 Looking for search button...');
    const searchButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('input[type="submit"], button[type="submit"], button'));
      return buttons.map((btn) => ({
        type: (btn as HTMLButtonElement).type,
        value: (btn as HTMLInputElement).value,
        text: btn.textContent?.trim(),
        id: (btn as HTMLElement).id,
        name: (btn as HTMLElement).getAttribute('name'),
      }));
    });
    console.log('Search buttons:', JSON.stringify(searchButton, null, 2));

    // Get page text sample
    const bodyText = await page.evaluate(() => document.body.textContent?.substring(0, 1000));
    console.log('\n📝 Page text sample:');
    console.log(bodyText);

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n✅ Browser closed');
    }
  }
}

main();
