#!/usr/bin/env tsx
import puppeteer from 'puppeteer';
import * as dotenv from 'dotenv';
dotenv.config();

const testIMO = '9348522';

async function debugTableCells() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    
    // Quick login and search
    await page.goto('https://gisis.imo.org/');
    await new Promise(r => setTimeout(r, 2000));
    
    await page.evaluate((username, password) => {
      const auth = document.querySelector('select') as HTMLSelectElement;
      if (auth) auth.selectedIndex = 1;
      const user = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (user) user.value = username;
    }, process.env.GISIS_USERNAME, process.env.GISIS_PASSWORD);
    
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
    
    await page.goto('https://gisis.imo.org/Public/SHIPS/Default.aspx');
    await new Promise(r => setTimeout(r, 2000));
    
    await page.evaluate((imo) => {
      const imoInput = Array.from(document.querySelectorAll('input[type="text"]'))[0] as HTMLInputElement;
      if (imoInput) imoInput.value = imo;
    }, testIMO);
    
    let searchBtn = await page.$('input[value="Search"]');
    if (searchBtn) await Promise.all([page.waitForNavigation().catch(() => {}), searchBtn.click()]);
    await new Promise(r => setTimeout(r, 3000));
    
    // Check all table cells
    const tableCells = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('td, th'));
      return cells.map((cell, i) => ({
        index: i,
        tag: cell.tagName,
        text: cell.textContent?.trim().substring(0, 60),
        hasOnclick: cell.hasAttribute('onclick'),
        onclick: cell.getAttribute('onclick'),
        cursor: window.getComputedStyle(cell).cursor,
      })).filter(c => c.text && c.text.length > 0);
    });
    
    console.log('\n=== ALL TABLE CELLS ===\n');
    tableCells.forEach(cell => {
      if (cell.text?.includes('GOLDEN') || cell.text?.includes('Singapore') || cell.text?.includes('Chemical')) {
        console.log(`>>> VESSEL ROW CELL <<<`);
      }
      console.log(`[${cell.index}] ${cell.tag} ${cell.hasOnclick ? '✓ onclick' : ''}`);
      console.log(`    Text: ${cell.text}`);
      console.log(`    Cursor: ${cell.cursor}`);
      if (cell.onclick) console.log(`    OnClick: ${cell.onclick.substring(0, 80)}`);
      console.log('');
    });
    
  } finally {
    await browser.close();
  }
}

debugTableCells().catch(console.error);
