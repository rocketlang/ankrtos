/**
 * Check username field attributes
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
    await driver.get('https://gisis.imo.org/');
    await driver.sleep(3000);

    const usernameInput = await driver.findElement(By.id('ctl00_cpMain_txtUsername'));

    const maxLength = await usernameInput.getAttribute('maxlength');
    const size = await usernameInput.getAttribute('size');
    const type = await usernameInput.getAttribute('type');
    const className = await usernameInput.getAttribute('class');
    const style = await usernameInput.getAttribute('style');

    console.log('\n📋 Username Field Attributes:');
    console.log(`Type: ${type}`);
    console.log(`MaxLength: ${maxLength}`);
    console.log(`Size: ${size}`);
    console.log(`Class: ${className}`);
    console.log(`Style: ${style}`);

    // Get HTML
    const html = await driver.executeScript(
      'return document.getElementById("ctl00_cpMain_txtUsername").outerHTML;'
    );
    console.log('\n🔍 Full HTML:');
    console.log(html);

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await driver.quit();
  }
}

main();
