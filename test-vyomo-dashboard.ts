/**
 * Vyomo Dashboard Feature Testing with Puppeteer
 * Tests all pages and identifies broken functionality
 */

import puppeteer from 'puppeteer'

const VYOMO_URL = 'http://localhost:3011/dashboard' // Vyomo frontend
const TEST_RESULTS: any[] = []

interface TestResult {
  page: string
  route: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  errors: string[]
  warnings: string[]
  screenshots?: string
}

async function testPage(browser: puppeteer.Browser, name: string, route: string): Promise<TestResult> {
  const result: TestResult = {
    page: name,
    route,
    status: 'PASS',
    errors: [],
    warnings: []
  }

  const page = await browser.newPage()

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      result.errors.push(`Console Error: ${msg.text()}`)
    }
  })

  // Capture page errors
  page.on('pageerror', error => {
    result.errors.push(`Page Error: ${error.message}`)
  })

  // Capture failed requests
  page.on('requestfailed', request => {
    result.errors.push(`Request Failed: ${request.url()} - ${request.failure()?.errorText}`)
  })

  try {
    console.log(`\n🔍 Testing: ${name} (${route})`)

    // Navigate to page
    const response = await page.goto(`${VYOMO_URL}${route}`, {
      waitUntil: 'networkidle0',
      timeout: 10000
    })

    if (!response || response.status() !== 200) {
      result.errors.push(`Failed to load: Status ${response?.status()}`)
      result.status = 'FAIL'
    }

    // Wait for React to render
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Check for error messages in the DOM
    const errorElements = await page.$$('[class*="error"], [class*="Error"]')
    if (errorElements.length > 0) {
      for (const el of errorElements) {
        const text = await page.evaluate(e => e.textContent, el)
        if (text && text.trim()) {
          result.warnings.push(`Error element found: ${text.substring(0, 100)}`)
        }
      }
    }

    // Check for loading states that never resolve
    const loadingElements = await page.$$('[class*="loading"], [class*="Loading"]')
    if (loadingElements.length > 0) {
      result.warnings.push(`Page still in loading state`)
    }

    // Check for empty data states
    const emptyText = await page.evaluate(() => {
      const body = document.body.textContent || ''
      return {
        hasNoData: body.includes('No data') || body.includes('no data'),
        hasError: body.includes('Error') || body.includes('error'),
        hasLoading: body.includes('Loading') || body.includes('loading')
      }
    })

    if (emptyText.hasNoData) {
      result.warnings.push('Page shows "No data" message')
    }
    if (emptyText.hasError) {
      result.warnings.push('Page shows error message')
    }

    // Take screenshot
    const screenshotPath = `/tmp/vyomo-${name.replace(/\s+/g, '-')}.png`
    await page.screenshot({ path: screenshotPath, fullPage: true })
    result.screenshots = screenshotPath

    // Check specific features per page
    await testPageSpecificFeatures(page, name, result)

  } catch (error: any) {
    result.errors.push(`Test Error: ${error.message}`)
    result.status = 'FAIL'
  } finally {
    await page.close()
  }

  // Determine final status
  if (result.errors.length > 0) {
    result.status = 'FAIL'
  } else if (result.warnings.length > 0) {
    result.status = 'WARNING'
  }

  return result
}

async function testPageSpecificFeatures(
  page: puppeteer.Page,
  pageName: string,
  result: TestResult
): Promise<void> {
  switch (pageName) {
    case 'Dashboard':
      // Check for market status
      const hasMarketStatus = await page.$('[class*="market-status"], [class*="Market"]')
      if (!hasMarketStatus) {
        result.warnings.push('Market status widget not found')
      }

      // Check for NIFTY/BANKNIFTY prices
      const priceElements = await page.$$('[class*="price"], [class*="metric"]')
      if (priceElements.length === 0) {
        result.warnings.push('No price/metric elements found')
      }
      break

    case 'Live Chart':
      // Check for chart container
      const chartContainer = await page.$('[class*="chart"], canvas')
      if (!chartContainer) {
        result.errors.push('Chart container not found')
      }
      break

    case 'Option Chain':
      // Check for option chain table
      const optionTable = await page.$('table, [role="table"]')
      if (!optionTable) {
        result.warnings.push('Option chain table not found')
      }

      // Check for strike prices
      const hasStrikes = await page.evaluate(() => {
        return document.body.textContent?.includes('Strike') ||
               document.body.textContent?.includes('CE') ||
               document.body.textContent?.includes('PE')
      })
      if (!hasStrikes) {
        result.warnings.push('No strike price data visible')
      }
      break

    case 'Anomaly Detection':
      // Check for anomaly feed
      const anomalyFeed = await page.$('[class*="anomaly"], [class*="feed"]')
      if (!anomalyFeed) {
        result.warnings.push('Anomaly feed not found')
      }

      // Check for charts
      const charts = await page.$$('canvas')
      if (charts.length === 0) {
        result.warnings.push('No charts found on anomaly dashboard')
      }
      break

    case 'Iron Condor':
      // Check for setup parameters
      const hasInputs = await page.$$('input, select')
      if (hasInputs.length === 0) {
        result.warnings.push('No input fields found')
      }

      // Check for error message about backend
      const bodyText = await page.evaluate(() => document.body.textContent || '')
      if (bodyText.includes('Error')) {
        result.errors.push('Page shows error message')
      }
      break

    case 'Auto Trading':
      // Check for trading controls
      const hasButtons = await page.$$('button')
      if (hasButtons.length === 0) {
        result.warnings.push('No buttons/controls found')
      }
      break

    case 'Adaptive AI':
      // Check for AI recommendations
      const hasRecommendations = await page.evaluate(() => {
        const text = document.body.textContent || ''
        return text.includes('BUY') || text.includes('SELL') || text.includes('HOLD')
      })
      if (!hasRecommendations) {
        result.warnings.push('No AI recommendations visible')
      }
      break
  }
}

async function runTests() {
  console.log('🚀 Starting Vyomo Dashboard Tests...\n')

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const pages = [
    { name: 'Dashboard', route: '/' },
    { name: 'Anomaly Detection', route: '/anomaly' },
    { name: 'Live Chart', route: '/live' },
    { name: 'Option Chain', route: '/chain' },
    { name: 'Analytics', route: '/analytics' },
    { name: 'Alerts', route: '/alerts' },
    { name: 'Iron Condor', route: '/iron-condor' },
    { name: 'Intraday Signals', route: '/intraday' },
    { name: 'Stock Screener', route: '/screener' },
    { name: 'Adaptive AI', route: '/adaptive-ai' },
    { name: 'Auto Trading', route: '/auto-trading' },
    { name: 'Risk Management', route: '/risk-management' },
    { name: 'Broker Integration', route: '/broker-management' },
    { name: 'Index Divergence', route: '/divergence' },
    { name: 'Performance Tracker', route: '/tracker' },
    { name: 'Backtesting', route: '/backtesting' },
    { name: 'Advanced Charts', route: '/charts' },
    { name: 'Glossary', route: '/glossary' },
    { name: 'Admin Panel', route: '/admin' }
  ]

  const results: TestResult[] = []

  for (const pageInfo of pages) {
    const result = await testPage(browser, pageInfo.name, pageInfo.route)
    results.push(result)
  }

  await browser.close()

  // Print Results
  console.log('\n\n' + '='.repeat(80))
  console.log('📊 TEST RESULTS SUMMARY')
  console.log('='.repeat(80) + '\n')

  let passCount = 0
  let failCount = 0
  let warnCount = 0

  for (const result of results) {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'
    console.log(`${icon} ${result.page.padEnd(25)} ${result.route}`)

    if (result.status === 'PASS') passCount++
    else if (result.status === 'FAIL') failCount++
    else warnCount++

    if (result.errors.length > 0) {
      result.errors.forEach(err => console.log(`   ❌ ${err}`))
    }
    if (result.warnings.length > 0) {
      result.warnings.forEach(warn => console.log(`   ⚠️  ${warn}`))
    }
    console.log()
  }

  console.log('='.repeat(80))
  console.log(`✅ PASS: ${passCount} | ⚠️  WARNING: ${warnCount} | ❌ FAIL: ${failCount}`)
  console.log('='.repeat(80))

  // Generate detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed: passCount,
      warnings: warnCount,
      failed: failCount
    },
    results
  }

  const reportPath = '/root/vyomo-test-report.json'
  await require('fs').promises.writeFile(reportPath, JSON.stringify(report, null, 2))
  console.log(`\n📄 Detailed report saved to: ${reportPath}`)

  // Print issues that need fixing
  console.log('\n\n' + '='.repeat(80))
  console.log('🔧 ISSUES TO FIX')
  console.log('='.repeat(80) + '\n')

  const failedPages = results.filter(r => r.status === 'FAIL')
  const warningPages = results.filter(r => r.status === 'WARNING')

  if (failedPages.length > 0) {
    console.log('❌ CRITICAL FAILURES:\n')
    failedPages.forEach(page => {
      console.log(`   ${page.page}:`)
      page.errors.forEach(err => console.log(`      - ${err}`))
    })
  }

  if (warningPages.length > 0) {
    console.log('\n⚠️  WARNINGS (Missing Data/Features):\n')
    warningPages.forEach(page => {
      console.log(`   ${page.page}:`)
      page.warnings.forEach(warn => console.log(`      - ${warn}`))
    })
  }

  console.log('\n' + '='.repeat(80))

  process.exit(failCount > 0 ? 1 : 0)
}

runTests().catch(error => {
  console.error('Test suite failed:', error)
  process.exit(1)
})
