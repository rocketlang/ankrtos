#!/usr/bin/env tsx
import puppeteer from 'puppeteer';
import * as dotenv from 'dotenv';
dotenv.config();

const testIMO = '9348522';

async function debugLinks() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    
    // Login and search (abbreviated version)
    await page.goto('https://gisis.imo.org/');
    await new Promise(r => setTimeout(r, 2000));
    
    //  Fill authority + username
    await page.evaluate((username) => {
      const auth = document.querySelector('select') as HTMLSelectElement;
      if (auth) auth.selectedIndex = 1;
      const user = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (user) user.value = username;
    }, process.env.GISIS_USERNAME);
    
    // Submit username
    const btn1 = await page.$('input[name*="btnStep1"]');
    if (btn1) await Promise.all([page.waitForNavigation().catch(() => {}), btn1.click()]);
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Fill password
    await page.evaluate((password) => {
      const pass = document.querySelector('input[type="password"]') as HTMLInputElement;
      if (pass) pass.value = password;
    }, process.env.GISIS_PASSWORD);
    
    // Submit password
    const btn2 = await page.$('input[name*="btnStep2"]');
    if (btn2) await Promise.all([page.waitForNavigation().catch(() => {}), btn2.click()]);
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Navigate to Ship Search
    await page.goto('https://gisis.imo.org/Public/SHIPS/Default.aspx');
    await new Promise(r => setTimeout(r, 2000));
    
    // Enter IMO and search
    await page.evaluate((imo) => {
      const imoInput = Array.from(document.querySelectorAll('input[type="text"]'))[0] as HTMLInputElement;
      if (imoInput) imoInput.value = imo;
    }, testIMO);
    
    const searchBtn = await page.$('input[value="Search"]');
    if (searchBtn) await Promise.all([page.waitForNavigation().catch(() => {}), searchBtn.click()]);
    
    await new Promise(r => setTimeout(r, 3000));
    
    // NOW - Debug all clickable elements
    const allClickables = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a, [onclick], td[onclick]'));
      return links.map((el, i) => ({
        index: i,
        tag: el.tagName,
        text: el.textContent?.trim().substring(0, 80),
        href: (el as HTMLAnchorElement).href || null,
        onclick: el.hasAttribute('onclick'),
        class: el.className,
      })).slice(0, 30); // First 30 clickable elements
    });
    
    console.log('\n=== ALL CLICKABLE ELEMENTS ON RESULTS PAGE ===\n');
    allClickables.forEach(el => {
      console.log(`[${el.index}] ${el.tag} ${el.onclick ? '(onclick)' : ''}`);
      console.log(`    Text: ${el.text}`);
      if (el.href) console.log(`    Href: ${el.href}`);
      if (el.class) console.log(`    Class: ${el.class}`);
      console.log('');
    });
    
  } finally {
    await browser.close();
  }
}

debugLinks().catch(console.error);
