/**
 * Debug what happens after WebForms postback
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

  try {
    console.log('\n🔍 Debugging postback result...\n');

    await driver.get('https://gisis.imo.org/');
    await driver.sleep(3000);

    // Select authority
    await driver.executeScript(`
      const dropdown = document.getElementById('ctl00_cpMain_ddlAuthorityType');
      const options = dropdown.options;
      for (let i = 0; i < options.length; i++) {
        if (options[i].text.includes('Public User')) {
          dropdown.selectedIndex = i;
          break;
        }
      }
    `);

    console.log('✅ Authority selected');
    await driver.sleep(1000);

    // Enter username
    await driver.executeScript(`
      const input = document.getElementById('ctl00_cpMain_txtUsername');
      input.removeAttribute('maxlength');
      input.value = '${process.env.GISIS_USERNAME}';
      input.focus();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.blur();
    `);

    console.log(`✅ Username entered: ${process.env.GISIS_USERNAME}`);
    await driver.sleep(1000);

    // Verify validation
    const isValid = await driver.executeScript(`
      return typeof Page_ClientValidate === 'function' ? Page_ClientValidate('') : null;
    `);
    console.log(`Validation result: ${isValid}`);

    // Take screenshot before postback
    const screenshotBefore = await driver.takeScreenshot();
    writeFileSync('/tmp/gisis-before-postback.png', screenshotBefore, 'base64');
    console.log('📸 Screenshot saved: /tmp/gisis-before-postback.png');

    // Trigger postback
    console.log('\n🎯 Triggering WebForms postback...');
    await driver.executeScript(`
      WebForm_DoPostBackWithOptions(new WebForm_PostBackOptions("ctl00$cpMain$btnStep1", "", true, "", "", false, false));
    `);

    await driver.sleep(5000);

    // Check URL
    const urlAfter = await driver.getCurrentUrl();
    console.log(`\nURL after postback: ${urlAfter}`);

    // Take screenshot after postback
    const screenshotAfter = await driver.takeScreenshot();
    writeFileSync('/tmp/gisis-after-postback.png', screenshotAfter, 'base64');
    console.log('📸 Screenshot saved: /tmp/gisis-after-postback.png');

    // Get page text
    const pageText = await driver.findElement(By.css('body')).getText();
    console.log('\n📝 Page text after postback:');
    console.log(pageText.substring(0, 800));

    // Check for password field
    try {
      await driver.findElement(By.css('input[type="password"]'));
      console.log('\n✅ Password field found!');
    } catch {
      console.log('\n❌ Password field NOT found');
    }

    // Check if still showing username error
    if (pageText.includes('Please enter your username')) {
      console.log('\n❌ Still showing username error');
    }

    // Check for any new errors
    if (pageText.includes('invalid') || pageText.includes('incorrect')) {
      console.log('\n⚠️  Found error message in page');
    }

    // Get form state
    const formState = await driver.executeScript(`
      return {
        usernameValue: document.getElementById('ctl00_cpMain_txtUsername')?.value,
        authorityValue: document.getElementById('ctl00_cpMain_ddlAuthorityType')?.value,
        hasPasswordField: document.querySelector('input[type="password"]') !== null
      };
    `);

    console.log('\n📊 Form state:');
    console.log(JSON.stringify(formState, null, 2));

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    await driver.quit();
  }
}

main();
