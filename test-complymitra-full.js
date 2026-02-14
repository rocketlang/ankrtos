/**
 * ComplyMitra Full Test Suite with Puppeteer
 * Tests demo login, dashboard, and all major features
 */

const puppeteer = require('puppeteer');

// Test configuration
const BASE_URL = 'https://app.complymitra.in';
const HEADLESS = true; // Must be true on server without X
const SLOW_MO = 0; // No slowdown in headless mode

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, status, details = '') {
  const symbol = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '⋯';
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
  log(`${symbol} ${name}${details ? ': ' + details : ''}`, color);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  log('\n🔍 ComplyMitra Full Test Suite\n', 'cyan');
  log('='.repeat(60), 'cyan');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: [],
  };

  let browser;
  let page;

  try {
    // Launch browser
    log('\n📦 Launching browser...', 'blue');
    browser = await puppeteer.launch({
      headless: HEADLESS,
      slowMo: SLOW_MO,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
      ],
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Collect console messages and errors
    const consoleMessages = [];
    const pageErrors = [];
    const failedRequests = [];

    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      consoleMessages.push({ type, text });

      if (type === 'error') {
        log(`  ⚠️  Console error: ${text}`, 'red');
      }
    });

    page.on('pageerror', error => {
      pageErrors.push(error.message);
      log(`  ⚠️  Page error: ${error.message}`, 'red');
    });

    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        failure: request.failure().errorText,
      });
    });

    // Test 1: Load login page
    log('\n📄 Test 1: Loading login page...', 'blue');
    results.total++;
    try {
      const response = await page.goto(BASE_URL, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      if (response.ok()) {
        logTest('Login page loads', 'pass', `Status: ${response.status()}`);
        results.passed++;
      } else {
        logTest('Login page loads', 'fail', `Status: ${response.status()}`);
        results.failed++;
        results.errors.push(`Login page returned ${response.status()}`);
      }
    } catch (error) {
      logTest('Login page loads', 'fail', error.message);
      results.failed++;
      results.errors.push(error.message);
    }

    // Test 2: Check page title
    log('\n📝 Test 2: Checking page title...', 'blue');
    results.total++;
    try {
      const title = await page.title();
      log(`  Title: "${title}"`);

      if (title && title.length > 0) {
        logTest('Page has title', 'pass', title);
        results.passed++;
      } else {
        logTest('Page has title', 'fail', 'No title found');
        results.failed++;
      }
    } catch (error) {
      logTest('Page has title', 'fail', error.message);
      results.failed++;
    }

    // Test 3: Check for login form elements
    log('\n🔐 Test 3: Checking login page elements...', 'blue');

    // Email input
    results.total++;
    try {
      const emailInput = await page.$('input[type="email"]');
      if (emailInput) {
        logTest('Email input exists', 'pass');
        results.passed++;
      } else {
        logTest('Email input exists', 'fail', 'Not found');
        results.failed++;
        results.errors.push('Email input not found');
      }
    } catch (error) {
      logTest('Email input exists', 'fail', error.message);
      results.failed++;
    }

    // Demo login button
    results.total++;
    try {
      const demoButton = await page.$('button:has-text("Demo Login")') ||
                         await page.$('button:has-text("🎭")') ||
                         await page.evaluate(() => {
                           const buttons = Array.from(document.querySelectorAll('button'));
                           return buttons.find(b => b.textContent.includes('Demo Login') || b.textContent.includes('🎭'));
                         });

      if (demoButton) {
        logTest('Demo login button exists', 'pass');
        results.passed++;
      } else {
        logTest('Demo login button exists', 'fail', 'Not found');
        results.failed++;
        results.errors.push('Demo login button not found');
      }
    } catch (error) {
      logTest('Demo login button exists', 'fail', error.message);
      results.failed++;
    }

    // Demo account info box
    results.total++;
    try {
      const infoBox = await page.evaluate(() => {
        const text = document.body.textContent;
        return text.includes('demo@complymitra.in') && text.includes('123456');
      });

      if (infoBox) {
        logTest('Demo account info visible', 'pass');
        results.passed++;
      } else {
        logTest('Demo account info visible', 'fail', 'Not found');
        results.failed++;
      }
    } catch (error) {
      logTest('Demo account info visible', 'fail', error.message);
      results.failed++;
    }

    // Test 4: Test demo login functionality
    log('\n🎭 Test 4: Testing demo login...', 'blue');
    results.total++;
    try {
      // Find and click demo button
      const demoButtonClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const demoButton = buttons.find(b =>
          b.textContent.includes('Demo Login') ||
          b.textContent.includes('🎭') ||
          b.textContent.includes('Instant Access')
        );

        if (demoButton) {
          demoButton.click();
          return true;
        }
        return false;
      });

      if (!demoButtonClicked) {
        logTest('Click demo button', 'fail', 'Button not found or not clickable');
        results.failed++;
        results.errors.push('Could not click demo button');
      } else {
        log('  Clicked demo login button...');

        // Wait for navigation or dashboard
        try {
          await Promise.race([
            page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
            sleep(5000), // Wait at least 5 seconds
          ]);

          const currentUrl = page.url();
          log(`  Current URL: ${currentUrl}`);

          if (currentUrl.includes('/dashboard') || currentUrl !== BASE_URL) {
            logTest('Demo login redirects', 'pass', currentUrl);
            results.passed++;
          } else {
            logTest('Demo login redirects', 'fail', 'No redirect occurred');
            results.failed++;
            results.errors.push('Demo login did not redirect');
          }
        } catch (navError) {
          log(`  Navigation: ${navError.message}`);
          const currentUrl = page.url();

          if (currentUrl.includes('/dashboard')) {
            logTest('Demo login redirects', 'pass', currentUrl);
            results.passed++;
          } else {
            logTest('Demo login redirects', 'fail', navError.message);
            results.failed++;
          }
        }
      }
    } catch (error) {
      logTest('Demo login functionality', 'fail', error.message);
      results.failed++;
      results.errors.push(error.message);
    }

    // Test 5: Check dashboard loads
    log('\n📊 Test 5: Checking dashboard...', 'blue');
    await sleep(2000);

    const dashboardUrl = page.url();
    log(`  Current URL: ${dashboardUrl}`);

    // Check if on dashboard
    results.total++;
    if (dashboardUrl.includes('/dashboard')) {
      logTest('On dashboard page', 'pass');
      results.passed++;
    } else {
      logTest('On dashboard page', 'fail', `Still on: ${dashboardUrl}`);
      results.failed++;
      results.errors.push('Not redirected to dashboard');
    }

    // Check for auth token
    results.total++;
    const hasAuthToken = await page.evaluate(() => {
      return !!localStorage.getItem('auth_token');
    });

    if (hasAuthToken) {
      logTest('Auth token stored', 'pass');
      results.passed++;
    } else {
      logTest('Auth token stored', 'fail', 'Token not found in localStorage');
      results.failed++;
      results.errors.push('Auth token not stored');
    }

    // Check for dashboard content
    results.total++;
    const dashboardContent = await page.evaluate(() => {
      const body = document.body.textContent || '';
      return {
        hasContent: body.length > 100,
        hasError: body.toLowerCase().includes('error'),
        bodyLength: body.length,
      };
    });

    if (dashboardContent.hasContent) {
      logTest('Dashboard has content', 'pass', `${dashboardContent.bodyLength} chars`);
      results.passed++;
    } else {
      logTest('Dashboard has content', 'fail', 'Page seems empty');
      results.failed++;
    }

    // Test 6: Check for JavaScript errors
    log('\n🐛 Test 6: Checking for errors...', 'blue');
    results.total++;

    if (pageErrors.length === 0) {
      logTest('No JavaScript errors', 'pass');
      results.passed++;
    } else {
      logTest('No JavaScript errors', 'fail', `${pageErrors.length} errors found`);
      results.failed++;
      pageErrors.forEach(err => {
        log(`    - ${err}`, 'red');
      });
    }

    // Test 7: Check failed requests
    results.total++;
    if (failedRequests.length === 0) {
      logTest('No failed requests', 'pass');
      results.passed++;
    } else {
      logTest('No failed requests', 'fail', `${failedRequests.length} failed`);
      results.failed++;
      failedRequests.forEach(req => {
        log(`    - ${req.url}: ${req.failure}`, 'red');
      });
    }

    // Take screenshot
    log('\n📸 Taking screenshot...', 'blue');
    await page.screenshot({
      path: '/root/complymitra-test-screenshot.png',
      fullPage: true,
    });
    log('  Saved: /root/complymitra-test-screenshot.png', 'green');

    // Summary
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 Test Summary', 'cyan');
    log('='.repeat(60), 'cyan');
    log(`Total Tests: ${results.total}`, 'bright');
    log(`Passed: ${results.passed}`, 'green');
    log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
    log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, 'cyan');

    if (results.errors.length > 0) {
      log('\n❌ Errors Found:', 'red');
      results.errors.forEach((err, i) => {
        log(`  ${i + 1}. ${err}`, 'red');
      });
    }

    if (results.failed === 0) {
      log('\n✅ All tests passed! ComplyMitra is working correctly.', 'green');
    } else {
      log('\n⚠️  Some tests failed. Check errors above.', 'yellow');
    }

    log('\n' + '='.repeat(60) + '\n', 'cyan');

  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
  } finally {
    if (browser) {
      if (HEADLESS) {
        await browser.close();
      } else {
        log('\n👀 Browser window left open for inspection', 'yellow');
        log('Press Ctrl+C to close when done\n', 'yellow');
      }
    }
  }
}

// Run tests
runTests().catch(console.error);
