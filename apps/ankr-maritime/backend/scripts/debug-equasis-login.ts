#!/usr/bin/env tsx
/**
 * Debug Equasis login flow in detail
 */

import 'dotenv/config';
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

async function debugLogin() {
  console.log('🔍 Debugging Equasis Login Flow\n');

  const options = new chrome.Options();
  options.addArguments('--headless=new');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    console.log('1️⃣  Loading Equasis homepage...');
    await driver.get('https://www.equasis.org/');
    await driver.sleep(3000);
    
    console.log(`   URL: ${await driver.getCurrentUrl()}\n`);

    // Find all j_email fields
    console.log('2️⃣  Finding email input fields...');
    const emailFields = await driver.findElements(By.name('j_email'));
    console.log(`   Found ${emailFields.length} email fields\n`);

    for (let i = 0; i < emailFields.length; i++) {
      const field = emailFields[i];
      const isDisplayed = await field.isDisplayed();
      const id = await field.getAttribute('id');
      const className = await field.getAttribute('class');
      console.log(`   Field ${i + 1}: id="${id}" class="${className}" visible=${isDisplayed}`);
    }

    // Find visible email field
    console.log('\n3️⃣  Using VISIBLE email field...');
    let visibleEmailField = null;
    let visiblePasswordField = null;
    
    for (const field of emailFields) {
      if (await field.isDisplayed()) {
        visibleEmailField = field;
        const id = await field.getAttribute('id');
        console.log(`   Using email field with id="${id}"`);
        break;
      }
    }

    if (!visibleEmailField) {
      console.log('   ❌ No visible email field found!');
      return;
    }

    // Find corresponding password field
    console.log('\n4️⃣  Finding password field...');
    const passwordFields = await driver.findElements(By.name('j_password'));
    console.log(`   Found ${passwordFields.length} password fields\n`);

    for (const field of passwordFields) {
      if (await field.isDisplayed()) {
        visiblePasswordField = field;
        const id = await field.getAttribute('id');
        console.log(`   Using password field with id="${id}"`);
        break;
      }
    }

    if (!visiblePasswordField) {
      console.log('   ❌ No visible password field found!');
      return;
    }

    // Enter credentials
    console.log('\n5️⃣  Entering credentials...');
    const username = process.env.EQUASIS_USERNAME || '';
    const password = process.env.EQUASIS_PASSWORD || '';
    
    await visibleEmailField.clear();
    await visibleEmailField.sendKeys(username);
    console.log(`   Email entered: ${username}`);
    
    await visiblePasswordField.clear();
    await visiblePasswordField.sendKeys(password);
    console.log('   Password entered: [hidden]');

    // Find submit button
    console.log('\n6️⃣  Finding submit button...');
    const submitButtons = await driver.findElements(By.name('submit'));
    console.log(`   Found ${submitButtons.length} submit buttons\n`);

    let visibleSubmit = null;
    for (const btn of submitButtons) {
      if (await btn.isDisplayed()) {
        visibleSubmit = btn;
        const value = await btn.getAttribute('value');
        const type = await btn.getAttribute('type');
        console.log(`   Using submit button: type="${type}" value="${value}"`);
        break;
      }
    }

    if (!visibleSubmit) {
      console.log('   ❌ No visible submit button found!');
      console.log('   Trying Enter key on password field instead...');
      await visiblePasswordField.sendKeys('\n');
    } else {
      console.log('\n7️⃣  Clicking submit button...');
      await visibleSubmit.click();
    }

    // Wait for response
    console.log('\n8️⃣  Waiting for response...');
    await driver.sleep(5000);

    const finalUrl = await driver.getCurrentUrl();
    console.log(`   Final URL: ${finalUrl}`);

    // Check for success indicators
    const pageText = await driver.findElement(By.css('body')).getText();
    
    if (finalUrl.includes('restricted') || finalUrl.includes('Restricted')) {
      console.log('\n✅ SUCCESS! Logged into restricted area');
    } else if (pageText.includes('Welcome') && pageText.includes('Search')) {
      console.log('\n✅ SUCCESS! Login appears successful');
    } else if (pageText.toLowerCase().includes('invalid') || pageText.toLowerCase().includes('error')) {
      console.log('\n❌ FAILED! Login error detected');
      console.log(`\n   Page text sample:\n${pageText.substring(0, 500)}`);
    } else {
      console.log('\n⚠️  UNCERTAIN - Check page text:');
      console.log(`\n${pageText.substring(0, 500)}`);
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await driver.quit();
    console.log('\n✅ Done');
  }
}

debugLogin().catch(console.error);
