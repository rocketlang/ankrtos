#!/usr/bin/env tsx
import 'dotenv/config';
import { Builder, By } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

async function test() {
  const options = new chrome.Options();
  options.addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage');
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

  try {
    // Login
    await driver.get('https://www.equasis.org/');
    await driver.sleep(3000);
    
    const emailFields = await driver.findElements(By.name('j_email'));
    const passwordFields = await driver.findElements(By.name('j_password'));
    for (const f of emailFields) if (await f.isDisplayed()) { await f.sendKeys(process.env.EQUASIS_USERNAME); break; }
    for (const f of passwordFields) if (await f.isDisplayed()) { await f.sendKeys(process.env.EQUASIS_PASSWORD); break; }
    const submitBtns = await driver.findElements(By.name('submit'));
    for (const b of submitBtns) if (await b.isDisplayed()) { await b.click(); break; }
    await driver.sleep(5000);

    console.log('✅ Logged in');
    
    await driver.get('https://www.equasis.org/EquasisWeb/restricted/ShipInfo?fs=Search');
    await driver.sleep(3000);
    
    const searchBox = await driver.findElement(By.id('P_ENTREE'));
    await searchBox.clear();
    await searchBox.sendKeys('9811000');
    console.log('✅ Entered IMO\n');
    
    // Use JavaScript to trigger the search
    console.log('🔍 Triggering search via JavaScript...');
    await driver.executeScript(`
      // Find the form and submit it
      var form = document.getElementById('P_ENTREE').closest('form');
      if (form) {
        form.submit();
      } else {
        // Or trigger any search function that might exist
        if (typeof recherche !== 'undefined') {
          recherche();
        } else if (typeof search !== 'undefined') {
          search();
        }
      }
    `);
    
    console.log('⏱️  Waiting 8 seconds...\n');
    await driver.sleep(8000);
    
    const url = await driver.getCurrentUrl();
    const text = await driver.findElement(By.css('body')).getText();
    
    console.log(`📍 URL: ${url}`);
    console.log(`✓ Has "EVER GIVEN": ${text.includes('EVER GIVEN')}`);
    console.log(`✓ Has "9811000": ${text.includes('9811000')}`);
    
    if (text.includes('EVER GIVEN')) {
      console.log('\n🎉🎉🎉 SUCCESS! VESSEL FOUND! 🎉🎉🎉\n');
      // Click on the vessel
      try {
        const vesselLink = await driver.findElement(By.linkText('9811000'));
        await vesselLink.click();
        await driver.sleep(3000);
        
        const detailText = await driver.findElement(By.css('body')).getText();
        console.log('\n📄 Vessel Detail Page:');
        console.log('='.repeat(60));
        console.log(detailText.substring(0, 2000));
      } catch (e) {
        console.log('\n⚠️  Could not click vessel link');
      }
    } else {
      console.log('\n❌ Not found. Page text:');
      console.log(text.substring(0, 1000));
    }

  } finally {
    await driver.quit();
  }
}

test().catch(console.error);
