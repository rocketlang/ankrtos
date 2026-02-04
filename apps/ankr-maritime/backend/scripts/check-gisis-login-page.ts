/**
 * Check GISIS login page structure
 */

import { Builder, By } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

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
    console.log('\n📍 Navigating to GISIS...');
    await driver.get('https://gisis.imo.org/');
    await driver.sleep(3000);

    const url = await driver.getCurrentUrl();
    const title = await driver.getTitle();

    console.log(`\nCurrent URL: ${url}`);
    console.log(`Page Title: ${title}`);

    console.log('\n📋 Looking for form elements...\n');

    // Get all inputs
    const inputs = await driver.findElements(By.css('input'));
    console.log(`Found ${inputs.length} input fields:`);

    for (const input of inputs) {
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      const placeholder = await input.getAttribute('placeholder');

      if (type !== 'hidden') {
        console.log(`  - Type: ${type}, Name: ${name}, ID: ${id}, Placeholder: ${placeholder}`);
      }
    }

    // Get all buttons
    const buttons = await driver.findElements(By.css('button, input[type="submit"]'));
    console.log(`\nFound ${buttons.length} buttons:`);

    for (const button of buttons) {
      const type = await button.getAttribute('type');
      const value = await button.getAttribute('value');
      const text = await button.getText();
      const name = await button.getAttribute('name');

      console.log(`  - Type: ${type}, Name: ${name}, Value: ${value}, Text: ${text}`);
    }

    // Get all selects (dropdowns)
    const selects = await driver.findElements(By.css('select'));
    console.log(`\nFound ${selects.length} dropdowns:`);

    for (const select of selects) {
      const name = await select.getAttribute('name');
      const id = await select.getAttribute('id');
      console.log(`  - Name: ${name}, ID: ${id}`);

      const options = await select.findElements(By.css('option'));
      for (const option of options) {
        const text = await option.getText();
        console.log(`      Option: ${text}`);
      }
    }

    // Get page text sample
    const bodyText = await driver.findElement(By.css('body')).getText();
    console.log('\n📝 Page text sample (first 800 chars):');
    console.log(bodyText.substring(0, 800));

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    await driver.quit();
  }
}

main();
