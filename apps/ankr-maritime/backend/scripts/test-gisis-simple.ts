#!/usr/bin/env tsx
import puppeteer from 'puppeteer';
import * as dotenv from 'dotenv';
dotenv.config();

const testIMO = '9348522';

async function testSimple() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    
    // Login
    await page.goto('https://gisis.imo.org/');
    await new Promise(r => setTimeout(r, 2000));
    
    await page.evaluate((username) => {
      const auth = document.querySelector('select') as HTMLSelectElement;
      if (auth) auth.selectedIndex = 1;
      const user = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (user) user.value = username;
    }, process.env.GISIS_USERNAME);
    
    let btn1 = await page.$('input[name*="btnStep1"]');
    if (btn1) await Promise.all([page.waitForNavigation().catch(() => {}), btn1.click()]);
    await new Promise(r => setTimeout(r, 2000));
    
    await page.evaluate((password) => {
      const pass = document.querySelector('input[type="password"]') as HTMLInputElement;
      if (pass) pass.value = password;
    }, process.env.GISIS_PASSWORD);
    
    let btn2 = await page.$('input[name*="btnStep2"]');
    if (btn2) await Promise.all([page.waitForNavigation().catch(() => {}), btn2.click()]);
    await new Promise(r => setTimeout(r, 3000));
    
    console.log('✅ Logged in');
    
    // Navigate to details page
    const url = `https://gisis.imo.org/Public/SHIPS/ShipDetails.aspx?IMONumber=${testIMO}`;
    console.log(`\n📍 Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 3000));
    
    console.log(`\n📍 Current URL: ${page.url()}`);
    
    // Get page text directly (no page.evaluate)
    const content = await page.content();
    const hasOwner = content.includes('Registered owner') || content.includes('GC MARITIME');
    const hasGoldenCurl = content.includes('GOLDEN CURL');
    
    console.log(`\n✓ Page contains "GOLDEN CURL": ${hasGoldenCurl}`);
    console.log(`✓ Page contains "Registered owner": ${hasOwner}`);
    
    if (hasOwner) {
      // Extract using simpler method
      const textContent = await page.evaluate(() => document.body.innerText);
      const lines = textContent.split('\n').filter(l => l.trim());
      
      console.log('\n📄 Page content (key lines):');
      lines.forEach((line, i) => {
        if (line.includes('owner') || line.includes('Owner') ||
            line.includes('GC MARITIME') || line.includes('GOLDEN CURL') ||
            line.includes('IMO') || line.includes('Singapore')) {
          console.log(`  [${i}] ${line.trim()}`);
        }
      });
      
      // Find owner line
      const ownerLine = lines.find(l => l.includes('Registered owner'));
      if (ownerLine) {
        console.log(`\n🎉 SUCCESS!`);
        console.log(`Owner line: ${ownerLine}`);
      }
    } else {
      console.log('\n⚠️ Ownership data not found on page');
      console.log('First 500 chars of page:');
      console.log(content.substring(0, 500));
    }
    
  } finally {
    await browser.close();
  }
}

testSimple().catch(console.error);
