#!/usr/bin/env tsx
/**
 * Debug Equasis ship search page
 */

import 'dotenv/config';
import { Builder, By } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

async function debugSearchPage() {
  console.log('🔍 Debugging Equasis Ship Search Page\n');

  const options = new chrome.Options();
  options.addArguments('--headless=new');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    // Login first
    console.log('1️⃣  Logging in...');
    await driver.get('https://www.equasis.org/');
    await driver.sleep(3000);

    const emailFields = await driver.findElements(By.name('j_email'));
    const passwordFields = await driver.findElements(By.name('j_password'));
    
    let visibleEmail = null, visiblePassword = null;
    for (const field of emailFields) {
      if (await field.isDisplayed()) {
        visibleEmail = field;
        break;
      }
    }
    for (const field of passwordFields) {
      if (await field.isDisplayed()) {
        visiblePassword = field;
        break;
      }
    }

    await visibleEmail.sendKeys(process.env.EQUASIS_USERNAME);
    await visiblePassword.sendKeys(process.env.EQUASIS_PASSWORD);

    const submitButtons = await driver.findElements(By.name('submit'));
    for (const btn of submitButtons) {
      if (await btn.isDisplayed()) {
        await btn.click();
        break;
      }
    }

    await driver.sleep(5000);
    console.log('   ✅ Logged in\n');

    // Navigate to ship search
    console.log('2️⃣  Navigating to ship search...');
    await driver.get('https://www.equasis.org/EquasisWeb/restricted/ShipInfo?fs=Search');
    await driver.sleep(3000);

    const searchUrl = await driver.getCurrentUrl();
    console.log(`   URL: ${searchUrl}\n`);

    // Get page text
    const pageText = await driver.findElement(By.css('body')).getText();
    console.log('3️⃣  Page content (first 1000 chars):');
    console.log('   ' + '='.repeat(60));
    console.log(pageText.substring(0, 1000));
    console.log('   ' + '='.repeat(60));

    // Find all input fields
    console.log('\n4️⃣  Finding all input fields...');
    const inputs = await driver.findElements(By.tagName('input'));
    console.log(`   Found ${inputs.length} input fields:\n`);

    for (let i = 0; i < inputs.length; i++) {
      try {
        const input = inputs[i];
        const id = await input.getAttribute('id');
        const name = await input.getAttribute('name');
        const type = await input.getAttribute('type');
        const placeholder = await input.getAttribute('placeholder');
        const isVisible = await input.isDisplayed();
        
        console.log(`   ${i + 1}. type="${type}" id="${id}" name="${name}" placeholder="${placeholder}" visible=${isVisible}`);
      } catch {
        // Skip
      }
    }

    // Try to find IMO-related input
    console.log('\n5️⃣  Looking for IMO field specifically...');
    const imoSelectors = [
      { name: 'By.id("P_IMO")', selector: By.id('P_IMO') },
      { name: 'By.name("P_IMO")', selector: By.name('P_IMO') },
      { name: 'By.css("[placeholder*=IMO]")', selector: By.css('input[placeholder*="IMO"]') },
      { name: 'By.css("[name*=IMO]")', selector: By.css('input[name*="IMO"]') },
    ];

    for (const { name, selector } of imoSelectors) {
      try {
        const field = await driver.findElement(selector);
        const isVisible = await field.isDisplayed();
        console.log(`   ✅ ${name} - FOUND (visible=${isVisible})`);
      } catch {
        console.log(`   ❌ ${name} - NOT FOUND`);
      }
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await driver.quit();
    console.log('\n✅ Done');
  }
}

debugSearchPage().catch(console.error);
