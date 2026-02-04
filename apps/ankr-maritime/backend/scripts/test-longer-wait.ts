/**
 * Test with much longer waits to see if login actually works
 */

import 'dotenv/config';
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const options = new chrome.Options();
  options.addArguments('--headless');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    console.log('\n🚀 Testing GISIS with longer waits...\n');

    await driver.get('https://gisis.imo.org/');
    console.log('📍 Step 1: Loaded GISIS homepage');
    await sleep(5000);

    // Select authority
    await driver.executeScript(`
      const dropdown = document.getElementById('ctl00_cpMain_ddlAuthorityType');
      const options = dropdown.options;
      for (let i = 0; i < options.length; i++) {
        if (options[i].text.includes('Public User')) {
          dropdown.selectedIndex = i;
          dropdown.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        }
      }
    `);
    console.log('✅ Authority selected: Public User');
    await sleep(2000);

    // Enter username
    const username = process.env.GISIS_EMAIL || '';
    await driver.executeScript(`
      const input = document.getElementById('ctl00_cpMain_txtUsername');
      input.removeAttribute('maxlength');
    `);

    const usernameInput = await driver.findElement(By.id('ctl00_cpMain_txtUsername'));
    await usernameInput.click();
    await sleep(500);
    await usernameInput.clear();
    await sleep(500);

    // Type slowly
    for (const char of username) {
      await usernameInput.sendKeys(char);
      await sleep(100);
    }

    console.log(`✅ Username entered: ${username}`);
    await sleep(2000);

    // Trigger postback
    console.log('🎯 Triggering postback...');
    await driver.executeScript(`
      WebForm_DoPostBackWithOptions(new WebForm_PostBackOptions("ctl00$cpMain$btnStep1", "", true, "", "", false, false));
    `);

    console.log('⏳ Waiting 20 seconds for response...');
    await sleep(20000);

    const url = await driver.getCurrentUrl();
    console.log(`\n📍 URL after 20s: ${url}`);

    // Check for password field with longer timeout
    console.log('\n🔍 Looking for password field (30 second timeout)...');
    try {
      const passwordInput = await driver.wait(
        until.elementLocated(By.css('input[type="password"]')),
        30000
      );
      console.log('✅✅✅ PASSWORD FIELD FOUND!');

      // Enter password
      const password = process.env.GISIS_PASSWORD || '';
      console.log('🔐 Entering password...');
      await passwordInput.clear();
      await sleep(500);

      for (const char of password) {
        await passwordInput.sendKeys(char);
        await sleep(50);
      }

      await sleep(1000);
      console.log('✅ Password entered');

      // Submit login
      console.log('🎯 Submitting login...');
      const loginButton = await driver.findElement(By.css('input[name*="btnStep2"]'));
      await loginButton.click();

      console.log('⏳ Waiting 20 seconds for login completion...');
      await sleep(20000);

      const finalUrl = await driver.getCurrentUrl();
      console.log(`\n📍 Final URL: ${finalUrl}`);

      if (finalUrl.includes('gisis.imo.org/Public')) {
        console.log('✅✅✅ LOGIN SUCCESS!');

        // Try to fetch vessel data
        console.log('\n🔍 Testing vessel data fetch...');
        await driver.get('https://gisis.imo.org/Public/SHIPS/ShipDetails.aspx?IMONumber=9811000');
        await sleep(5000);

        const pageText = await driver.findElement(By.css('body')).getText();
        if (pageText.includes('Ship Particulars') || pageText.includes('EVER GIVEN')) {
          console.log('✅✅✅ VESSEL DATA ACCESSIBLE!');
          console.log('\nSample data:');
          console.log(pageText.substring(0, 500));
        }
      } else {
        console.log('❌ Login failed - wrong URL');
        const pageText = await driver.findElement(By.css('body')).getText();
        console.log('Page text:', pageText.substring(0, 500));
      }

    } catch (error: any) {
      console.log('❌ Password field not found after 30 seconds');
      console.log(`Error: ${error.message}`);

      // Get current page state
      const currentUrl = await driver.getCurrentUrl();
      const pageText = await driver.findElement(By.css('body')).getText();

      console.log(`\n📍 Current URL: ${currentUrl}`);
      console.log('\n📝 Page text (first 800 chars):');
      console.log(pageText.substring(0, 800));

      // Check if there's an error message
      if (pageText.includes('invalid') || pageText.includes('incorrect') || pageText.includes('not found')) {
        console.log('\n⚠️  Error message detected in page');
      }
    }

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await driver.quit();
  }
}

main();
