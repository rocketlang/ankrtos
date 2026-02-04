#!/usr/bin/env tsx
/**
 * Debug Equasis Vessel Page - See what data is available
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

async function main() {
  const imo = '9696565'; // STI FINCHLEY

  console.log(`🔍 Debugging Equasis vessel page for IMO ${imo}...`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ],
  });

  const page = await browser.newPage();

  try {
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });

    await page.setViewport({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    // Login first
    console.log('🔐 Logging in...');
    await page.goto('https://www.equasis.org/EquasisWeb/public/HomePage', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await page.evaluate((username, password) => {
      const emailInput = document.querySelector('input[name="j_email"]') as HTMLInputElement;
      const passwordInput = document.querySelector('input[name="j_password"]') as HTMLInputElement;
      if (emailInput) emailInput.value = username;
      if (passwordInput) passwordInput.value = password;
    }, process.env.EQUASIS_USERNAME || '', process.env.EQUASIS_PASSWORD || '');

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.evaluate(() => {
        const loginButton = Array.from(document.querySelectorAll('button[type="submit"]'))
          .find(btn => btn.textContent?.includes('Login'));
        if (loginButton) (loginButton as HTMLElement).click();
      }),
    ]);

    console.log('✅ Logged in');

    // Navigate to vessel page
    console.log(`📄 Loading vessel page...`);
    const searchUrl = `https://www.equasis.org/EquasisWeb/restricted/ShipInfo?fs=HomePage&P_IMO=${imo}`;

    await page.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Save HTML
    const html = await page.content();
    fs.writeFileSync('/tmp/equasis-vessel.html', html);
    console.log('💾 Saved page HTML to /tmp/equasis-vessel.html');

    // Take screenshot
    await page.screenshot({ path: '/tmp/equasis-vessel.png', fullPage: true });
    console.log('📸 Saved screenshot to /tmp/equasis-vessel.png');

    // Try to extract text content
    const pageText = await page.evaluate(() => document.body.textContent);
    fs.writeFileSync('/tmp/equasis-vessel-text.txt', pageText || '');
    console.log('📝 Saved page text to /tmp/equasis-vessel-text.txt');

    // Look for owner mentions
    const hasOwner = pageText?.toLowerCase().includes('owner');
    const hasManager = pageText?.toLowerCase().includes('manager');

    console.log(`\n🔍 Search results:`);
    console.log(`   Contains "owner": ${hasOwner}`);
    console.log(`   Contains "manager": ${hasManager}`);

    if (hasOwner || hasManager) {
      // Extract lines containing owner/manager
      const lines = pageText?.split('\n').filter(line =>
        line.toLowerCase().includes('owner') || line.toLowerCase().includes('manager')
      ).slice(0, 10);

      console.log('\n📋 Relevant lines:');
      lines?.forEach(line => console.log(`   ${line.trim()}`));
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('👋 Browser closed');
  }
}

main();
