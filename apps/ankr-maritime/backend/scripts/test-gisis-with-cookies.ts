#!/usr/bin/env tsx
import puppeteer from 'puppeteer';
import * as dotenv from 'dotenv';
dotenv.config();

const testIMO = '9348522';

async function testWithCookies() {
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
    
    console.log('✅ Logged in to:', page.url());
    
    // Check cookies
    const cookies = await page.cookies();
    console.log(`\n🍪 Cookies set: ${cookies.length}`);
    cookies.forEach(c => console.log(`  - ${c.name} (domain: ${c.domain})`));
    
    // Navigate to Ship Search page first to establish session in GISIS
    console.log('\n📍 First navigating to Ship Search to establish session...');
    await page.goto('https://gisis.imo.org/Public/SHIPS/Default.aspx', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    console.log(`  Current URL: ${page.url()}`);
    
    // NOW try direct URL to details
    const url = `https://gisis.imo.org/Public/SHIPS/ShipDetails.aspx?IMONumber=${testIMO}`;
    console.log(`\n📍 Now navigating to details: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 3000));
    
    console.log(`\n📍 Final URL: ${page.url()}`);
    
    const content = await page.content();
    const hasOwner = content.includes('Registered owner') || content.includes('GC MARITIME');
    const hasGoldenCurl = content.includes('GOLDEN CURL');
    
    console.log(`\n✓ Page contains "GOLDEN CURL": ${hasGoldenCurl}`);
    console.log(`✓ Page contains "Registered owner": ${hasOwner}`);
    
    if (hasOwner) {
      const textContent = await page.evaluate(() => document.body.innerText);
      const lines = textContent.split('\n').filter(l => l.trim());
      
      const ownerLine = lines.find(l => l.includes('Registered owner'));
      console.log(`\n🎉 SUCCESS! Owner: ${ownerLine}`);
    }
    
  } finally {
    await browser.close();
  }
}

testWithCookies().catch(console.error);
