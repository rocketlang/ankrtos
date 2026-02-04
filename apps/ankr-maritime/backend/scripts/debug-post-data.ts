/**
 * Debug what form data is being POSTed
 */

import 'dotenv/config';
import { Builder, By } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { writeFileSync } from 'fs';

async function main() {
  const options = new chrome.Options();
  options.addArguments('--headless');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  // Enable network tracking
  await driver.manage().logs();

  try {
    console.log('\n🔍 Checking form POST data...\n');

    await driver.get('https://gisis.imo.org/');
    await driver.sleep(3000);

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

    console.log('✅ Authority selected');
    await driver.sleep(1000);

    // Enter username using sendKeys (not JavaScript)
    const usernameInput = await driver.findElement(By.id('ctl00_cpMain_txtUsername'));

    // Remove maxlength
    await driver.executeScript(`
      document.getElementById('ctl00_cpMain_txtUsername').removeAttribute('maxlength');
    `);

    await usernameInput.click();
    await driver.sleep(500);

    await usernameInput.clear();
    await driver.sleep(500);

    // Type character by character
    const username = process.env.GISIS_USERNAME || '';
    for (const char of username) {
      await usernameInput.sendKeys(char);
      await driver.sleep(100);
    }

    console.log(`✅ Username typed: ${username}`);
    await driver.sleep(1000);

    // Check what the form data will be
    const formData = await driver.executeScript(`
      const form = document.getElementById('aspnetForm');
      const formData = new FormData(form);
      const data = {};
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          data[key] = value.substring(0, 100); // Truncate long values
        }
      }
      return data;
    `);

    console.log('\n📦 Form data that will be POSTed:');
    console.log(JSON.stringify(formData, null, 2));

    // Check username field specifically
    const usernameFieldValue = await driver.executeScript(`
      return document.getElementById('ctl00_cpMain_txtUsername').value;
    `);
    console.log(`\n🔍 Username field value: "${usernameFieldValue}"`);

    // Check authority field
    const authorityValue = await driver.executeScript(`
      return document.getElementById('ctl00_cpMain_ddlAuthorityType').value;
    `);
    console.log(`🔍 Authority field value: "${authorityValue}"`);

    // Try manual form submission to see POST data
    console.log('\n🎯 Attempting manual form submission...');

    // Get form action before submit
    const formAction = await driver.executeScript(`
      return document.getElementById('aspnetForm').action;
    `);
    console.log(`Form will POST to: ${formAction}`);

    // Submit via JavaScript
    await driver.executeScript(`
      // Manually validate first
      if (typeof Page_ClientValidate === 'function') {
        const isValid = Page_ClientValidate('');
        console.log('Validation result:', isValid);
      }

      // Submit the form
      document.getElementById('aspnetForm').submit();
    `);

    await driver.sleep(5000);

    // Check result
    const urlAfter = await driver.getCurrentUrl();
    console.log(`\n📍 URL after submission: ${urlAfter}`);

    // Check for password field
    try {
      await driver.findElement(By.css('input[type="password"]'));
      console.log('✅ Password field found!');
    } catch {
      console.log('❌ Password field NOT found');

      // Get error message if any
      const pageText = await driver.findElement(By.css('body')).getText();
      if (pageText.includes('invalid') || pageText.includes('incorrect') || pageText.includes('not found')) {
        console.log('\n⚠️  Error message found:');
        const lines = pageText.split('\n');
        for (const line of lines) {
          if (line.includes('invalid') || line.includes('incorrect') || line.includes('not found')) {
            console.log(`   ${line}`);
          }
        }
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
