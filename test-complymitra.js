/**
 * Playwright Test for ComplyMitra Sites
 * Tests: Landing page, app login, and GraphQL connectivity
 */

const { chromium } = require('playwright');
const fs = require('fs');

const RESULTS_FILE = '/root/complymitra-test-results.json';

async function testComplyMitra() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  // Test 1: Landing Page (complymitra.in)
  console.log('\n=== Testing complymitra.in (Landing Page) ===');
  try {
    const landingResponse = await page.goto('https://complymitra.in', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    const landingStatus = landingResponse.status();
    const landingTitle = await page.title();
    const landingContent = await page.content();

    results.tests.push({
      name: 'Landing Page',
      url: 'https://complymitra.in',
      status: landingStatus,
      title: landingTitle,
      passed: landingStatus === 200,
      screenshot: '/root/complymitra-landing.png',
      errors: []
    });

    await page.screenshot({ path: '/root/complymitra-landing.png', fullPage: true });
    console.log(`✓ Status: ${landingStatus}`);
    console.log(`✓ Title: ${landingTitle}`);
  } catch (error) {
    console.error(`✗ Landing page error: ${error.message}`);
    results.tests.push({
      name: 'Landing Page',
      url: 'https://complymitra.in',
      passed: false,
      errors: [error.message]
    });
  }

  // Test 2: App Page (app.complymitra.in)
  console.log('\n=== Testing app.complymitra.in (Main App) ===');

  // Capture console logs and errors
  const consoleLogs = [];
  const jsErrors = [];

  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  page.on('pageerror', error => {
    jsErrors.push({
      message: error.message,
      stack: error.stack
    });
  });

  // Capture network requests
  const networkRequests = [];
  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType()
    });
  });

  const networkResponses = [];
  page.on('response', response => {
    networkResponses.push({
      url: response.url(),
      status: response.status(),
      statusText: response.statusText()
    });
  });

  try {
    const appResponse = await page.goto('https://app.complymitra.in', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    const appStatus = appResponse.status();
    const appTitle = await page.title();

    console.log(`✓ Status: ${appStatus}`);
    console.log(`✓ Title: ${appTitle}`);

    // Wait for React to render
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: '/root/complymitra-app-initial.png', fullPage: true });

    // Check for login form elements
    console.log('\n--- Checking Login Form ---');
    const loginElements = {
      emailInput: await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').count(),
      passwordInput: await page.locator('input[type="password"], input[name="password"]').count(),
      loginButton: await page.locator('button:has-text("Login"), button:has-text("Sign In"), button[type="submit"]').count(),
      anyInputs: await page.locator('input').count(),
      anyButtons: await page.locator('button').count()
    };

    console.log('Form elements found:', loginElements);

    // Get page text content
    const bodyText = await page.locator('body').textContent();
    console.log('Page contains "login":', bodyText.toLowerCase().includes('login'));
    console.log('Page contains "error":', bodyText.toLowerCase().includes('error'));

    // Check GraphQL endpoint
    console.log('\n--- Testing GraphQL Endpoint ---');
    const graphqlTest = await page.evaluate(async () => {
      try {
        const response = await fetch('/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: '{ __typename }'
          })
        });
        return {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          body: await response.text()
        };
      } catch (error) {
        return { error: error.message };
      }
    });

    console.log('GraphQL test:', graphqlTest);

    // Try to find and click login button if it exists
    if (loginElements.loginButton > 0) {
      console.log('\n--- Attempting Login Test ---');
      try {
        // Fill in dummy credentials
        if (loginElements.emailInput > 0) {
          await page.locator('input[type="email"], input[name="email"]').first().fill('test@example.com');
        }
        if (loginElements.passwordInput > 0) {
          await page.locator('input[type="password"]').first().fill('testpassword');
        }

        await page.screenshot({ path: '/root/complymitra-app-filled.png', fullPage: true });

        // Click login
        await page.locator('button:has-text("Login"), button:has-text("Sign In"), button[type="submit"]').first().click();
        await page.waitForTimeout(3000);

        await page.screenshot({ path: '/root/complymitra-app-after-login.png', fullPage: true });
      } catch (loginError) {
        console.error('Login test error:', loginError.message);
      }
    }

    results.tests.push({
      name: 'App Page',
      url: 'https://app.complymitra.in',
      status: appStatus,
      title: appTitle,
      passed: appStatus === 200,
      loginElements,
      graphqlTest,
      consoleLogs: consoleLogs.slice(0, 20), // First 20 logs
      jsErrors,
      networkFailures: networkResponses.filter(r => r.status >= 400),
      screenshots: [
        '/root/complymitra-app-initial.png',
        '/root/complymitra-app-filled.png',
        '/root/complymitra-app-after-login.png'
      ]
    });

  } catch (error) {
    console.error(`✗ App page error: ${error.message}`);
    results.tests.push({
      name: 'App Page',
      url: 'https://app.complymitra.in',
      passed: false,
      errors: [error.message],
      consoleLogs,
      jsErrors
    });
  }

  // Test 3: Direct GraphQL Health Check
  console.log('\n=== Testing GraphQL API Directly ===');
  try {
    const healthResponse = await page.goto('http://localhost:4001/health', {
      waitUntil: 'networkidle',
      timeout: 5000
    });
    const healthData = await healthResponse.json();
    console.log('GraphQL API Health:', healthData);

    results.tests.push({
      name: 'GraphQL API Health',
      url: 'http://localhost:4001/health',
      passed: healthResponse.status() === 200,
      data: healthData
    });
  } catch (error) {
    console.error('GraphQL health check failed:', error.message);
    results.tests.push({
      name: 'GraphQL API Health',
      passed: false,
      errors: [error.message]
    });
  }

  // Save results
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
  console.log(`\n✓ Results saved to ${RESULTS_FILE}`);

  await browser.close();

  // Print summary
  console.log('\n=== SUMMARY ===');
  console.log(`Total tests: ${results.tests.length}`);
  console.log(`Passed: ${results.tests.filter(t => t.passed).length}`);
  console.log(`Failed: ${results.tests.filter(t => !t.passed).length}`);

  return results;
}

// Run tests
testComplyMitra()
  .then(results => {
    console.log('\n✓ All tests completed');
    process.exit(results.tests.every(t => t.passed) ? 0 : 1);
  })
  .catch(error => {
    console.error('\n✗ Test suite failed:', error);
    process.exit(1);
  });
