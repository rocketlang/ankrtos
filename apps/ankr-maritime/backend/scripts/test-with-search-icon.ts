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

    console.log('✅ Logged in\n');
    
    // Go to search page
    await driver.get('https://www.equasis.org/EquasisWeb/restricted/ShipInfo?fs=Search');
    await driver.sleep(3000);
    
    // Enter IMO
    const searchBox = await driver.findElement(By.id('P_ENTREE'));
    await searchBox.clear();
    await searchBox.sendKeys('9811000');
    console.log('✅ Entered IMO 9811000\n');
    
    // Find and click the lens/search icon button
    console.log('🔍 Looking for search icon button...');
    
    // Try different selectors for search icon
    const iconSelectors = [
      By.css('button[type="button"] i.fa-search'),
      By.css('button i.fa-search'),
      By.css('i.fa-search'),
      By.css('.fa-search'),
      By.css('button[onclick*="recherche"]'),
      By.css('button[onclick*="search"]'),
      By.xpath('//button[contains(@onclick, "recherche") or contains(@onclick, "search")]'),
      By.xpath('//i[contains(@class, "search")]'),
      By.xpath('//button[.//i[contains(@class, "search")]]'),
    ];
    
    let searchButton = null;
    for (const selector of iconSelectors) {
      try {
        searchButton = await driver.findElement(selector);
        if (await searchButton.isDisplayed()) {
          const tagName = await searchButton.getTagName();
          const className = await searchButton.getAttribute('class');
          console.log(`Found: <${tagName} class="${className}">`);
          break;
        }
      } catch {
        // Try next
      }
    }
    
    if (searchButton) {
      // If we found an icon, get its parent button
      const tagName = await searchButton.getTagName();
      if (tagName === 'i') {
        console.log('Icon found, getting parent button...');
        searchButton = await searchButton.findElement(By.xpath('..'));
      }
      
      console.log('✅ Clicking search icon button\n');
      await searchButton.click();
    } else {
      console.log('⚠️  Search icon not found, trying form submit\n');
      await searchBox.submit();
    }
    
    // Wait for results
    console.log('⏱️  Waiting for results...');
    await driver.sleep(8000);
    
    const url = await driver.getCurrentUrl();
    const text = await driver.findElement(By.css('body')).getText();
    
    console.log(`\n📍 URL: ${url}`);
    console.log(`✓ Contains "9811000": ${text.includes('9811000')}`);
    console.log(`✓ Contains "EVER GIVEN": ${text.includes('EVER GIVEN')}`);
    console.log(`✓ Contains "Panama": ${text.includes('Panama')}`);
    
    if (text.includes('EVER GIVEN')) {
      console.log('\n🎉 SUCCESS! Vessel found!\n');
      console.log('Result preview:');
      console.log(text.substring(text.indexOf('9811000'), text.indexOf('9811000') + 200));
    } else {
      console.log('\n❌ Vessel not found');
      console.log('\nPage text (first 1000 chars):');
      console.log(text.substring(0, 1000));
    }

  } finally {
    await driver.quit();
  }
}

test().catch(console.error);
