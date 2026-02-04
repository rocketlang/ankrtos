#!/usr/bin/env tsx
import puppeteer from 'puppeteer';
import * as dotenv from 'dotenv';
dotenv.config();

const testIMO = '9348522';

async function testCorrectURL() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    
    // Quick login
    console.log('🔐 Logging in...');
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
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('✅ Logged in\n');
    
    // THE CORRECT URL!
    const url = `https://gisis.imo.org/Public/SHIPS/ShipDetails.aspx?IMONumber=${testIMO}`;
    console.log(`🔍 Navigating to: ${url}\n`);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    
    // Extract vessel data
    const data = await page.evaluate(() => {
      const text = document.body.textContent || '';
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      
      const getData = (label: string) => {
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(label.toLowerCase())) {
            const parts = lines[i].split(':');
            if (parts.length > 1) return parts.slice(1).join(':').trim();
            if (i + 1 < lines.length) return lines[i + 1];
          }
        }
        return null;
      };
      
      return {
        name: getData('Name:') || getData('Ship name:'),
        imo: getData('IMO Number:'),
        callSign: getData('Call sign:'),
        flag: getData('Flag:'),
        mmsi: getData('MMSI:'),
        type: getData('Type:'),
        built: getData('Date of build:'),
        grossTonnage: getData('Gross tonnage:'),
        owner: getData('Registered owner:'),
        operator: getData('Operator:'),
        technicalManager: getData('Technical manager:'),
        docCompany: getData('DOC company:') || getData('Company responsible for DOC:'),
      };
    });
    
    console.log('═'.repeat(70));
    console.log('📊 VESSEL DATA EXTRACTED:');
    console.log('═'.repeat(70));
    console.log(`  Name:              ${data.name}`);
    console.log(`  IMO Number:        ${data.imo}`);
    console.log(`  Call Sign:         ${data.callSign}`);
    console.log(`  Flag:              ${data.flag}`);
    console.log(`  MMSI:              ${data.mmsi}`);
    console.log(`  Type:              ${data.type}`);
    console.log(`  Built:             ${data.built}`);
    console.log(`  Gross Tonnage:     ${data.grossTonnage}`);
    console.log('');
    console.log('🏢 OWNERSHIP DATA:');
    console.log('═'.repeat(70));
    console.log(`  ⭐ Registered Owner:  ${data.owner || '❌ NOT FOUND'}`);
    console.log(`  ⭐ Operator:          ${data.operator || '❌ NOT FOUND'}`);
    console.log(`  ⭐ Technical Manager: ${data.technicalManager || '❌ NOT FOUND'}`);
    console.log(`  ⭐ DOC Company:       ${data.docCompany || '❌ NOT FOUND'}`);
    console.log('═'.repeat(70));
    
    if (data.owner) {
      console.log('\n🎉 SUCCESS! VESSEL OWNERSHIP DATA EXTRACTED FROM IMO GISIS!');
      console.log('✅ WORKFLOW UNLOCKED: AIS → IMO → Owner → Load Matching');
    } else {
      console.log('\n⚠️  Page loaded but ownership field not found');
    }
    
  } finally {
    await browser.close();
  }
}

testCorrectURL().catch(console.error);
