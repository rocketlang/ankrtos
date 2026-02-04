#!/usr/bin/env tsx
/**
 * Debug Equasis search results page
 */

import 'dotenv/config';
import { Builder, By, Key } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

async function debugResults() {
  console.log('🔍 Debugging Equasis Search Results\n');

  const options = new chrome.Options();
  options.addArguments('--headless=new');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    // Login
    console.log('1️⃣  Logging in...');
    await driver.get('https://www.equasis.org/');
    await driver.sleep(3000);

    const emailFields = await driver.findElements(By.name('j_email'));
    const passwordFields = await driver.findElements(By.name('j_password'));
    
    for (const field of emailFields) {
      if (await field.isDisplayed()) {
        await field.sendKeys(process.env.EQUASIS_USERNAME);
        break;
      }
    }
    for (const field of passwordFields) {
      if (await field.isDisplayed()) {
        await field.sendKeys(process.env.EQUASIS_PASSWORD);
        break;
      }
    }

    const submitButtons = await driver.findElements(By.name('submit'));
    for (const btn of submitButtons) {
      if (await btn.isDisplayed()) {
        await btn.click();
        break;
      }
    }

    await driver.sleep(5000);
    console.log('   ✅ Logged in\n');

    // Search for vessel
    console.log('2️⃣  Searching for IMO 9811000...');
    await driver.get('https://www.equasis.org/EquasisWeb/restricted/ShipInfo?fs=Search');
    await driver.sleep(3000);

    const searchField = await driver.findElement(By.id('P_ENTREE'));
    await searchField.clear();
    await searchField.sendKeys('9811000');
    await searchField.sendKeys(Key.RETURN);

    await driver.sleep(5000);

    const resultUrl = await driver.getCurrentUrl();
    console.log(`   Result URL: ${resultUrl}\n`);

    // Get full page text
    console.log('3️⃣  Full page content:');
    console.log('   ' + '='.repeat(70));
    const pageText = await driver.findElement(By.css('body')).getText();
    console.log(pageText);
    console.log('   ' + '='.repeat(70));

    // Save screenshot (if available)
    console.log('\n4️⃣  Page HTML (first 3000 chars):');
    const html = await driver.getPageSource();
    console.log(html.substring(0, 3000));

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await driver.quit();
    console.log('\n✅ Done');
  }
}

debugResults().catch(console.error);
