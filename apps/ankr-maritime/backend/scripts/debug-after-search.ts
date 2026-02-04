#!/usr/bin/env tsx
import 'dotenv/config';
import { Builder, By, Key } from 'selenium-webdriver';
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

    await driver.get('https://www.equasis.org/EquasisWeb/restricted/ShipInfo?fs=Search');
    await driver.sleep(3000);
    const search = await driver.findElement(By.id('P_ENTREE'));
    await search.sendKeys('9811000', Key.RETURN);
    
    console.log('\n⏱️  After 3 seconds:');
    await driver.sleep(3000);
    console.log('URL:', await driver.getCurrentUrl());
    let text = await driver.findElement(By.css('body')).getText();
    console.log('Contains "9811000"?', text.includes('9811000'));
    console.log('Contains "EVER GIVEN"?', text.includes('EVER GIVEN'));
    console.log('Contains "No ship"?', text.includes('No ship'));
    
    console.log('\n⏱️  After 5 more seconds:');
    await driver.sleep(5000);
    console.log('URL:', await driver.getCurrentUrl());
    text = await driver.findElement(By.css('body')).getText();
    console.log('Contains "9811000"?', text.includes('9811000'));
    console.log('Contains "EVER GIVEN"?', text.includes('EVER GIVEN'));
    console.log('Contains "No ship"?', text.includes('No ship'));
    
    console.log('\n📄 Page text (first 1000 chars):');
    console.log(text.substring(0, 1000));

  } finally {
    await driver.quit();
  }
}

debug().catch(console.error);
