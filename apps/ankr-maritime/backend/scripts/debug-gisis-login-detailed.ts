/**
 * Debug GISIS login step by step
 */

import { Builder, By, until } from 'selenium-webdriver';
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
    console.log('\n🚀 Starting GISIS login debug...\n');

    console.log('📍 Step 1: Navigate to GISIS');
    await driver.get('https://gisis.imo.org/');
    await driver.sleep(3000);

    let url = await driver.getCurrentUrl();
    console.log(`Current URL: ${url}`);

    let title = await driver.getTitle();
    console.log(`Page Title: ${title}`);

    // Take screenshot
    await driver.takeScreenshot().then((data) => {
      import('fs').then(fs => {
        fs.writeFileSync('/tmp/gisis-step1.png', data, 'base64');
        console.log('📸 Screenshot saved: /tmp/gisis-step1.png');
      });
    });

    console.log('\n📍 Step 2: Look for authority dropdown');
    try {
      const dropdown = await driver.wait(
        until.elementLocated(By.css('select[id*="ddlAuth"]')),
        10000
      );
      console.log('✅ Found authority dropdown');

      const options = await dropdown.findElements(By.css('option'));
      console.log(`Found ${options.length} options`);

      for (const option of options) {
        const text = await option.getText();
        console.log(`  - ${text}`);
        if (text.includes('Public User')) {
          console.log('  ✅ Clicking "Public User"');
          await option.click();
          break;
        }
      }

      await driver.sleep(2000);

    } catch (error: any) {
      console.log('❌ Authority dropdown not found:', error.message);

      // Get page HTML
      const html = await driver.findElement(By.css('body')).getText();
      console.log('\nPage text sample:');
      console.log(html.substring(0, 500));
    }

    console.log('\n📍 Step 3: Enter username');
    try {
      const usernameInput = await driver.findElement(By.css('input[type="text"]'));
      await usernameInput.clear();
      await usernameInput.sendKeys(process.env.GISIS_USERNAME || '');
      console.log(`✅ Entered username: ${process.env.GISIS_USERNAME}`);
    } catch (error: any) {
      console.log('❌ Username input not found:', error.message);
    }

    console.log('\n📍 Step 4: Click Next button');
    try {
      const nextButton = await driver.findElement(By.css('input[name*="btnStep1"]'));
      await nextButton.click();
      console.log('✅ Clicked Next button');
      await driver.sleep(3000);

      url = await driver.getCurrentUrl();
      console.log(`Current URL after Next: ${url}`);

      await driver.takeScreenshot().then((data) => {
        require('fs').writeFileSync('/tmp/gisis-step2.png', data, 'base64');
        console.log('📸 Screenshot saved: /tmp/gisis-step2.png');
      });

    } catch (error: any) {
      console.log('❌ Next button not found:', error.message);
    }

    console.log('\n📍 Step 5: Enter password');
    try {
      const passwordInput = await driver.wait(
        until.elementLocated(By.css('input[type="password"]')),
        10000
      );
      await passwordInput.clear();
      await passwordInput.sendKeys(process.env.GISIS_PASSWORD || '');
      console.log('✅ Entered password');
    } catch (error: any) {
      console.log('❌ Password input not found:', error.message);
    }

    console.log('\n📍 Step 6: Click Login button');
    try {
      const loginButton = await driver.findElement(By.css('input[name*="btnStep2"]'));
      await loginButton.click();
      console.log('✅ Clicked Login button');
      await driver.sleep(3000);

      url = await driver.getCurrentUrl();
      console.log(`Current URL after Login: ${url}`);

      await driver.takeScreenshot().then((data) => {
        require('fs').writeFileSync('/tmp/gisis-step3.png', data, 'base64');
        console.log('📸 Screenshot saved: /tmp/gisis-step3.png');
      });

      // Check if logged in
      const loggedIn = url.includes('gisis.imo.org/Public');
      console.log(`\nLogged in: ${loggedIn ? '✅ YES' : '❌ NO'}`);

      if (loggedIn) {
        console.log('\n✅ Login successful!');

        // Get page text
        const bodyText = await driver.findElement(By.css('body')).getText();
        console.log('\nLogged in page text sample:');
        console.log(bodyText.substring(0, 500));
      }

    } catch (error: any) {
      console.log('❌ Login button not found:', error.message);
    }

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await driver.quit();
    console.log('\n✅ Browser closed');
  }
}

main();
