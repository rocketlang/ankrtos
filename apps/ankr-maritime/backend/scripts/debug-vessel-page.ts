#!/usr/bin/env tsx
import 'dotenv/config';
import { Builder, By, Key } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

async function debug() {
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

    // Search
    await driver.get('https://www.equasis.org/EquasisWeb/restricted/ShipInfo?fs=Search');
    await driver.sleep(3000);
    const search = await driver.findElement(By.id('P_ENTREE'));
    await search.sendKeys('9321483', Key.RETURN);
    await driver.sleep(5000);

    console.log('\n📄 VESSEL DETAILS PAGE:\n' + '='.repeat(80));
    const text = await driver.findElement(By.css('body')).getText();
    console.log(text.substring(0, 4000));
    console.log('='.repeat(80));

  } finally {
    await driver.quit();
  }
}

debug().catch(console.error);
