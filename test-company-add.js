const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Capture console errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  console.log('Loading /company/add page...');
  await page.goto('https://app.complymitra.in/company/add', {
    waitUntil: 'networkidle0',
    timeout: 30000
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Take screenshot
  await page.screenshot({
    path: '/root/company-add-screenshot.png',
    fullPage: false
  });

  // Check content
  const content = await page.evaluate(() => {
    return {
      title: document.querySelector('h1, h2')?.textContent || 'No title',
      hasForm: !!document.querySelector('form'),
      hasInputs: document.querySelectorAll('input').length,
      bodyLength: document.body.textContent?.length || 0
    };
  });

  console.log('Content:', JSON.stringify(content, null, 2));
  console.log('Errors:', errors.length > 0 ? errors : 'None');

  await browser.close();
})();
