const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('Loading rules page...');
  await page.goto('https://app.complymitra.in/rules', {
    waitUntil: 'networkidle0',
    timeout: 30000
  });

  // Wait for content to load
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Take screenshot
  await page.screenshot({
    path: '/root/rules-page-screenshot.png',
    fullPage: true
  });

  // Get some stats
  const stats = await page.evaluate(() => {
    const title = document.querySelector('h1')?.textContent || 'No title';
    const rulesCount = document.querySelectorAll('.cursor-pointer').length;
    const bodyText = document.body.textContent || '';
    return {
      title,
      rulesCount,
      hasLoadingText: bodyText.includes('Loading rules'),
      bodyLength: bodyText.length
    };
  });

  console.log('Stats:', JSON.stringify(stats, null, 2));

  await browser.close();
})();
