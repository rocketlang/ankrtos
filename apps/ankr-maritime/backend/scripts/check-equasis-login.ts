#!/usr/bin/env tsx
import puppeteer from 'puppeteer';

async function checkLogin() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  await page.goto('https://www.equasis.org/EquasisWeb/authen/HomePage', {
    waitUntil: 'networkidle2',
  });

  const formInfo = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    return {
      url: window.location.href,
      title: document.title,
      inputs: inputs.map(i => ({
        type: i.type,
        name: i.name,
        id: i.id,
        placeholder: i.placeholder,
      })),
    };
  });

  console.log('URL:', formInfo.url);
  console.log('Title:', formInfo.title);
  console.log('\nInput fields:');
  formInfo.inputs.forEach((inp, i) => {
    console.log(`  [${i}] type="${inp.type}" name="${inp.name}" id="${inp.id}" placeholder="${inp.placeholder}"`);
  });

  await browser.close();
}

checkLogin();
