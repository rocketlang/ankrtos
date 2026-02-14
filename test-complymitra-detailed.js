/**
 * Detailed Playwright Test for ComplyMitra App
 * Focus: Understanding what's rendering and why no login form
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function detailedTest() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('\n=== Detailed App Analysis ===\n');

  // Navigate to app
  await page.goto('https://app.complymitra.in', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await page.waitForTimeout(3000);

  // Extract ALL text content
  const allText = await page.evaluate(() => {
    return {
      bodyText: document.body.innerText,
      html: document.body.innerHTML.substring(0, 5000), // First 5000 chars
      url: window.location.href,
      localStorage: { ...localStorage },
      sessionStorage: { ...sessionStorage },
      cookies: document.cookie
    };
  });

  console.log('Current URL:', allText.url);
  console.log('\n--- Page Text Content (first 1000 chars) ---');
  console.log(allText.bodyText.substring(0, 1000));

  console.log('\n--- LocalStorage ---');
  console.log(JSON.stringify(allText.localStorage, null, 2));

  console.log('\n--- SessionStorage ---');
  console.log(JSON.stringify(allText.sessionStorage, null, 2));

  console.log('\n--- Cookies ---');
  console.log(allText.cookies || 'No cookies');

  // Check for React Router routes
  console.log('\n--- Checking React Router ---');
  const reactInfo = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      rootHTML: root ? root.innerHTML.substring(0, 2000) : 'No root element',
      hasReactRoot: !!root,
      dataAttributes: root ? [...root.attributes].map(a => `${a.name}=${a.value}`) : []
    };
  });

  console.log('React Root Info:', reactInfo);

  // Try different routes
  const routesToTest = [
    '/login',
    '/auth/login',
    '/signin',
    '/dashboard',
    '/'
  ];

  console.log('\n--- Testing Different Routes ---');
  for (const route of routesToTest) {
    try {
      await page.goto(`https://app.complymitra.in${route}`, {
        waitUntil: 'networkidle',
        timeout: 10000
      });
      await page.waitForTimeout(2000);

      const routeInfo = await page.evaluate(() => ({
        url: window.location.href,
        title: document.title,
        hasInputs: document.querySelectorAll('input').length,
        hasForm: document.querySelectorAll('form').length,
        bodyClasses: document.body.className,
        mainContent: document.body.innerText.substring(0, 500)
      }));

      console.log(`\n${route}:`);
      console.log(`  URL: ${routeInfo.url}`);
      console.log(`  Inputs: ${routeInfo.hasInputs}, Forms: ${routeInfo.hasForm}`);
      console.log(`  Content: ${routeInfo.mainContent.substring(0, 200)}...`);

      if (routeInfo.hasInputs > 0) {
        await page.screenshot({
          path: `/root/complymitra-route-${route.replace(/\//g, '_')}.png`,
          fullPage: true
        });
        console.log(`  ✓ Screenshot saved (has inputs!)`);
      }
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message}`);
    }
  }

  // Check network requests during load
  console.log('\n--- Network Analysis ---');
  const networkLog = [];
  page.on('response', response => {
    const url = response.url();
    if (url.includes('graphql') || url.includes('api') || url.includes('auth')) {
      networkLog.push({
        url,
        status: response.status(),
        contentType: response.headers()['content-type']
      });
    }
  });

  await page.goto('https://app.complymitra.in', {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  await page.waitForTimeout(3000);

  console.log('API/GraphQL requests:');
  networkLog.forEach(req => {
    console.log(`  ${req.status} - ${req.url}`);
  });

  // Check for error messages or blank state
  console.log('\n--- Checking for Errors ---');
  const errorCheck = await page.evaluate(() => {
    const bodyText = document.body.innerText.toLowerCase();
    return {
      hasError: bodyText.includes('error'),
      hasBlank: bodyText.trim().length < 50,
      hasLoading: bodyText.includes('loading') || bodyText.includes('load'),
      hasFailed: bodyText.includes('failed') || bodyText.includes('fail'),
      totalTextLength: bodyText.length,
      visibleElements: document.querySelectorAll('*:not(script):not(style)').length
    };
  });

  console.log('Error indicators:', errorCheck);

  // Save comprehensive report
  const report = {
    timestamp: new Date().toISOString(),
    summary: 'App loads but shows no login form',
    findings: {
      allText,
      reactInfo,
      errorCheck,
      networkLog: networkLog.slice(0, 10)
    }
  };

  fs.writeFileSync('/root/complymitra-detailed-report.json', JSON.stringify(report, null, 2));
  console.log('\n✓ Detailed report saved to /root/complymitra-detailed-report.json');

  await browser.close();
}

detailedTest()
  .then(() => {
    console.log('\n✓ Detailed analysis complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n✗ Analysis failed:', error);
    process.exit(1);
  });
