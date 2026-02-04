#!/usr/bin/env tsx
import 'dotenv/config';
import { Builder, By } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

async function debug() {
  const options = new chrome.Options();
  options.addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage');
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

  try {
    await driver.get('https://www.equasis.org/');
    await driver.sleep(3000);
    
    const emailFields = await driver.findElements(By.name('j_email'));
    const passwordFields = await driver.findElements(By.name('j_password'));
    for (const f of emailFields) if (await f.isDisplayed()) { await f.sendKeys(process.env.EQUASIS_USERNAME); break; }
    for (const f of passwordFields) if (await f.isDisplayed()) { await f.sendKeys(process.env.EQUASIS_PASSWORD); break; }
    const submitBtns = await driver.findElements(By.name('submit'));
    for (const b of submitBtns) if (await b.isDisplayed()) { await b.click(); break; }
    await driver.sleep(5000);

    console.log('✅ Logged in\n');
    await driver.get('https://www.equasis.org/EquasisWeb/restricted/ShipInfo?fs=Search');
    await driver.sleep(3000);
    
    // Check the Ship checkbox first
    try {
      const checkbox = await driver.findElement(By.id('checkbox-ship'));
      const isChecked = await checkbox.isSelected();
      console.log(`Ship checkbox checked: ${isChecked}`);
      if (!isChecked) {
        await checkbox.click();
        console.log('✅ Checked Ship checkbox');
        await driver.sleep(1000);
      }
    } catch (e) {
      console.log('⚠️  Ship checkbox not found');
    }
    
    // Enter IMO
    const search = await driver.findElement(By.id('P_ENTREE'));
    await search.clear();
    await search.sendKeys('9811000');
    console.log('✅ Entered IMO 9811000');
    
    // Find and click submit button instead of pressing Enter
    try {
      // Look for submit/search button near the P_ENTREE field
      const buttons = await driver.findElements(By.css('button, input[type="submit"], input[type="button"]'));
      console.log(`\nFound ${buttons.length} buttons`);
      
      let submitted = false;
      for (const btn of buttons) {
        const text = await btn.getText();
        const value = await btn.getAttribute('value');
        const type = await btn.getAttribute('type');
        const onclick = await btn.getAttribute('onclick');
        
        if ((text && text.toLowerCase().includes('search')) || 
            (value && value.toLowerCase().includes('search')) ||
            (onclick && onclick.includes('recherche'))) {
          console.log(`\nClicking button: text="${text}" value="${value}" type="${type}"`);
          await btn.click();
          submitted = true;
          break;
        }
      }
      
      if (!submitted) {
        console.log('\n⚠️  No search button found, pressing Enter');
        await search.sendKeys('\n');
      }
    } catch (e) {
      console.log('\nError finding button, pressing Enter');
      await search.sendKeys('\n');
    }
    
    console.log('\n⏱️  Waiting 8 seconds for results...');
    await driver.sleep(8000);
    
    const url = await driver.getCurrentUrl();
    const text = await driver.findElement(By.css('body')).getText();
    
    console.log(`\n📍 Final URL: ${url}`);
    console.log(`✓ Contains "9811000": ${text.includes('9811000')}`);
    console.log(`✓ Contains "EVER GIVEN": ${text.includes('EVER GIVEN')}`);
    console.log(`✓ Contains "Panama": ${text.includes('Panama')}`);
    console.log(`✗ Contains "No ship": ${text.includes('No ship')}`);
    
    if (text.includes('EVER GIVEN')) {
      console.log('\n🎉 SUCCESS! Vessel found!');
    } else {
      console.log('\n📄 Page text (first 1500 chars):');
      console.log(text.substring(0, 1500));
    }

  } finally {
    await driver.quit();
  }
}

debug().catch(console.error);
