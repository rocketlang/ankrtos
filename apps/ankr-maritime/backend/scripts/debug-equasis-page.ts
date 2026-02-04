#!/usr/bin/env tsx
/**
 * Debug Equasis page structure
 */

import 'dotenv/config';
import { Builder, By } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

async function debugEquasisPage() {
  console.log('🔍 Debugging Equasis Page Structure\n');

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
    console.log('1️⃣  Loading https://www.equasis.org/...');
    await driver.get('https://www.equasis.org/');
    await driver.sleep(3000);

    // Get current URL
    const url = await driver.getCurrentUrl();
    console.log(`   Current URL: ${url}\n`);

    // Get page title
    const title = await driver.getTitle();
    console.log(`   Page Title: ${title}\n`);

    // Get all links on the page
    console.log('2️⃣  Finding all links...');
    const links = await driver.findElements(By.tagName('a'));
    console.log(`   Found ${links.length} links:\n`);

    for (let i = 0; i < Math.min(links.length, 20); i++) {
      try {
        const text = await links[i].getText();
        const href = await links[i].getAttribute('href');
        if (text.trim()) {
          console.log(`   - "${text}" → ${href}`);
        }
      } catch {
        // Skip if can't get text
      }
    }

    // Look for login-related elements
    console.log('\n3️⃣  Looking for login elements...');

    // Try to find login link
    try {
      const loginLinks = await driver.findElements(By.xpath("//*[contains(text(), 'Login') or contains(text(), 'log in') or contains(text(), 'Sign in')]"));
      console.log(`   Found ${loginLinks.length} login-related links`);
      for (const link of loginLinks) {
        const text = await link.getText();
        const tag = await link.getTagName();
        console.log(`   - <${tag}> ${text}`);
      }
    } catch (err) {
      console.log('   No login links found');
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await driver.quit();
    console.log('\n✅ Done');
  }
}

debugEquasisPage().catch(console.error);
