#!/usr/bin/env tsx
/**
 * Test Equasis Public Ship Search (NO LOGIN NEEDED!)
 */

import 'dotenv/config';
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

async function testPublicSearch() {
  console.log('🔍 Testing Equasis PUBLIC Ship Search (No Login)\n');

  const options = new chrome.Options();
  options.addArguments('--headless=new');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    // Navigate to Equasis
    console.log('1️⃣  Loading Equasis...');
    await driver.get('https://www.equasis.org/');
    await driver.sleep(3000);

    // Look for "Ship" or "Search" link in navigation
    console.log('\n2️⃣  Looking for ship search option...');
    
    // Try different link text variations
    const searchTerms = ['Ship', 'Search', 'Vessel', 'Search Ship', 'Ship Search'];
    
    for (const term of searchTerms) {
      try {
        const link = await driver.findElement(By.partialLinkText(term));
        const linkText = await link.getText();
        const href = await link.getAttribute('href');
        console.log(`   Found: "${linkText}" → ${href}`);
        
        console.log(`\n3️⃣  Clicking "${linkText}"...`);
        await link.click();
        await driver.sleep(3000);
        
        const newUrl = await driver.getCurrentUrl();
        console.log(`   New URL: ${newUrl}`);
        
        // Look for IMO search field
        console.log('\n4️⃣  Looking for IMO search field...');
        const inputs = await driver.findElements(By.tagName('input'));
        
        for (const input of inputs) {
          const id = await input.getAttribute('id');
          const name = await input.getAttribute('name');
          const placeholder = await input.getAttribute('placeholder');
          
          if (id || name || placeholder) {
            console.log(`   Found input: id="${id}" name="${name}" placeholder="${placeholder}"`);
            
            // If this looks like IMO field, try searching
            if ((id && id.includes('IMO')) || (name && name.includes('IMO')) || (placeholder && placeholder.includes('IMO'))) {
              console.log(`\n5️⃣  Testing search with IMO 9811000...`);
              await input.clear();
              await input.sendKeys('9811000');
              await driver.sleep(1000);
              
              // Look for search/submit button
              const buttons = await driver.findElements(By.tagName('button'));
              const submits = await driver.findElements(By.css('input[type="submit"]'));
              
              const allButtons = [...buttons, ...submits];
              for (const btn of allButtons) {
                const btnText = await btn.getText();
                const btnValue = await btn.getAttribute('value');
                if (btnText.includes('Search') || btnValue?.includes('Search') || btnValue?.includes('search')) {
                  console.log(`   Clicking "${btnText || btnValue}"...`);
                  await btn.click();
                  await driver.sleep(5000);
                  
                  const resultUrl = await driver.getCurrentUrl();
                  console.log(`   Result URL: ${resultUrl}`);
                  
                  const pageText = await driver.findElement(By.css('body')).getText();
                  console.log(`\n6️⃣  Page content (first 500 chars):`);
                  console.log(pageText.substring(0, 500));
                  
                  if (pageText.includes('MSC') || pageText.includes('Owner') || pageText.includes('Operator')) {
                    console.log(`\n✅ SUCCESS! Vessel data found without login!`);
                  } else if (pageText.includes('login') || pageText.includes('Login')) {
                    console.log(`\n❌ Login required for vessel details`);
                  }
                  
                  break;
                }
              }
              break;
            }
          }
        }
        
        break;
      } catch {
        // Try next term
      }
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await driver.quit();
    console.log('\n✅ Done');
  }
}

testPublicSearch().catch(console.error);
