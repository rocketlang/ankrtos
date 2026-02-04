#!/usr/bin/env tsx
import puppeteer from 'puppeteer';
import * as dotenv from 'dotenv';
dotenv.config();

const testIMO = '9348522';

async function testDirectURL() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    
    // Quick login
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
    
    console.log('✅ Logged in successfully\n');
    
    // Try different URL patterns for ship details
    const urlPatterns = [
      `https://gisis.imo.org/Public/SHIPS/ShipInfo.aspx?IMO=${testIMO}`,
      `https://gisis.imo.org/Public/SHIPS/ShipParticulars.aspx?IMO=${testIMO}`,
      `https://gisis.imo.org/Public/SHIPS/VesselDetail.aspx?IMO=${testIMO}`,
      `https://gisis.imo.org/Public/SHIPS/Ship.aspx?IMO=${testIMO}`,
      `https://gisis.imo.org/Public/SHIPS/Details.aspx?IMO=${testIMO}`,
    ];
    
    for (const url of urlPatterns) {
      console.log(`Trying: ${url}`);
      const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 }).catch(() => null);
      
      if (response && response.status() === 200) {
        await new Promise(r => setTimeout(r, 2000));
        
        const pageText = await page.evaluate(() => document.body.textContent);
        const hasOwner = pageText?.includes('Registered owner') || pageText?.includes('GC MARITIME');
        const hasVessel = pageText?.includes('GOLDEN CURL');
        
        console.log(`  Status: ${response.status()}`);
        console.log(`  Has Vessel Info: ${hasVessel}`);
        console.log(`  Has Owner Info: ${hasOwner}`);
        
        if (hasOwner) {
          console.log(`\n🎉 SUCCESS! Found ownership data at: ${url}\n`);
          
          // Extract ownership
          const data = await page.evaluate(() => {
            const text = document.body.textContent || '';
            const lines = text.split('\n').map(l => l.trim()).filter(l => l);
            const getData = (label: string) => {
              for (let i = 0; i < lines.length; i++) {
                if (lines[i].toLowerCase().includes(label.toLowerCase())) {
                  const parts = lines[i].split(':');
                  if (parts.length > 1) return parts[1].trim();
                  if (i + 1 < lines.length) return lines[i + 1];
                }
              }
              return null;
            };
            
            return {
              owner: getData('Registered owner'),
              imo: getData('IMO Number'),
              name: getData('Name'),
            };
          });
          
          console.log(`Owner: ${data.owner}`);
          console.log(`IMO: ${data.imo}`);
          console.log(`Name: ${data.name}`);
          break;
        }
      } else {
        console.log(`  Status: ${response?.status() || 'Failed'}\n`);
      }
    }
    
  } finally {
    await browser.close();
  }
}

testDirectURL().catch(console.error);
