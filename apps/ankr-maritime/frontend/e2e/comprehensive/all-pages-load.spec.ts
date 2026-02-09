import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// All routes from App.tsx
const routes = [
  // Public routes
  { path: '/', name: 'Landing Page', auth: false },
  { path: '/login', name: 'Login', auth: false },
  { path: '/home', name: 'Home/Landing', auth: false },
  { path: '/mari8x', name: 'Mari8x Landing', auth: false },
  { path: '/mari8x-technical', name: 'Technical Docs', auth: false },
  { path: '/technical', name: 'Technical (alias)', auth: false },

  // Protected routes - Fleet
  { path: '/dashboard', name: 'Dashboard', auth: true },
  { path: '/vessels', name: 'Vessels', auth: true },
  { path: '/vessel-positions', name: 'Vessel Positions', auth: true },
  { path: '/vessel-history', name: 'Vessel History', auth: true },
  { path: '/vessel-certificates', name: 'Vessel Certificates', auth: true },
  { path: '/vessel-inspections', name: 'Vessel Inspections', auth: true },

  // Ports & Routes
  { path: '/ports', name: 'Ports', auth: true },
  { path: '/port-map', name: 'Port Map', auth: true },
  { path: '/route-calculator', name: 'Route Calculator', auth: true },
  { path: '/fleet-routes', name: 'Fleet Routes', auth: true },
  { path: '/port-intelligence', name: 'Port Intelligence', auth: true },
  { path: '/port-congestion', name: 'Port Congestion', auth: true },
  { path: '/port-restrictions', name: 'Port Restrictions', auth: true },
  { path: '/port-tariffs', name: 'Port Tariffs', auth: true },
  { path: '/eca-zones', name: 'ECA Zones', auth: true },
  { path: '/high-risk-areas', name: 'High Risk Areas', auth: true },
  { path: '/geofencing', name: 'Geofencing', auth: true },
  { path: '/world-port-index', name: 'World Port Index', auth: true },

  // Commercial
  { path: '/chartering', name: 'Chartering', auth: true },
  { path: '/chartering-desk', name: 'Chartering Desk', auth: true },
  { path: '/time-charters', name: 'Time Charters', auth: true },
  { path: '/coa', name: 'COA Management', auth: true },
  { path: '/cargo-enquiries', name: 'Cargo Enquiries', auth: true },
  { path: '/cargo-compatibility', name: 'Cargo Compatibility', auth: true },
  { path: '/open-tonnage', name: 'Open Tonnage', auth: true },
  { path: '/voyage-estimate', name: 'Voyage Estimate', auth: true },
  { path: '/ve-history', name: 'VE History', auth: true },

  // Voyage Operations
  { path: '/voyages', name: 'Voyages', auth: true },
  { path: '/da-desk', name: 'DA Desk', auth: true },
  { path: '/port-documents', name: 'Port Documents', auth: true },
  { path: '/laytime', name: 'Laytime', auth: true },
  { path: '/noon-reports', name: 'Noon Reports', auth: true },
  { path: '/noon-reports-enhanced', name: 'Noon Reports Enhanced', auth: true },
  { path: '/critical-path', name: 'Critical Path', auth: true },
  { path: '/weather-warranty', name: 'Weather Warranty', auth: true },
  { path: '/sof-manager', name: 'SOF Manager', auth: true },
  { path: '/delay-alerts', name: 'Delay Alerts', auth: true },

  // Cargo & Docs (DMS)
  { path: '/bills-of-lading', name: 'Bills of Lading', auth: true },
  { path: '/ebl-chain', name: 'eBL Chain', auth: true },
  { path: '/documents', name: 'DMS (Document Vault)', auth: true },
  { path: '/document-templates', name: 'Document Templates', auth: true },
  { path: '/document-links', name: 'Document Links', auth: true },

  // Bunkers & Emissions
  { path: '/bunkers', name: 'Bunkers', auth: true },
  { path: '/bunker-management', name: 'Bunker Management', auth: true },
  { path: '/bunker-disputes', name: 'Bunker Disputes', auth: true },
  { path: '/emissions', name: 'Emissions', auth: true },
  { path: '/carbon', name: 'Carbon Dashboard', auth: true },

  // Finance
  { path: '/invoices', name: 'Invoices', auth: true },
  { path: '/hire-payments', name: 'Hire Payments', auth: true },
  { path: '/cash-to-master', name: 'Cash to Master', auth: true },
  { path: '/cost-benchmarks', name: 'Cost Benchmarks', auth: true },
  { path: '/revenue-analytics', name: 'Revenue Analytics', auth: true },
  { path: '/fx-dashboard', name: 'FX Dashboard', auth: true },
  { path: '/letters-of-credit', name: 'Letters of Credit', auth: true },
  { path: '/trade-payments', name: 'Trade Payments', auth: true },
  { path: '/freight-derivatives', name: 'Freight Derivatives', auth: true },

  // Claims & Compliance
  { path: '/claims', name: 'Claims', auth: true },
  { path: '/claim-packages', name: 'Claim Packages', auth: true },
  { path: '/compliance', name: 'Compliance', auth: true },
  { path: '/kyc', name: 'KYC', auth: true },
  { path: '/insurance', name: 'Insurance Policies', auth: true },
  { path: '/sanctions', name: 'Sanctions Screening', auth: true },
  { path: '/fda-disputes', name: 'FDA Dispute Resolution', auth: true },
  { path: '/cost-optimization', name: 'Cost Optimization', auth: true },
  { path: '/bank-reconciliation', name: 'Bank Reconciliation', auth: true },
  { path: '/protecting-agents', name: 'Protecting Agents', auth: true },
  { path: '/tariff-management', name: 'Tariff Management', auth: true },

  // CRM & Contacts
  { path: '/contacts', name: 'Contacts', auth: true },
  { path: '/crm-pipeline', name: 'CRM Pipeline', auth: true },
  { path: '/customer-insights', name: 'Customer Insights', auth: true },
  { path: '/agent-directory', name: 'Agent Directory', auth: true },
  { path: '/agent-portal', name: 'Agent Portal', auth: true },
  { path: '/agent-appointments', name: 'Agent Appointments', auth: true },
  { path: '/agent/dashboard', name: 'Agent Dashboard', auth: true },
  { path: '/vendor-management', name: 'Vendor Management', auth: true },
  { path: '/port-agency-portal', name: 'Port Agency Portal', auth: true },

  // People & Team
  { path: '/crew', name: 'Crew', auth: true },
  { path: '/team', name: 'Team Management', auth: true },
  { path: '/permissions', name: 'Permissions', auth: true },
  { path: '/hr', name: 'HR Dashboard', auth: true },
  { path: '/attendance', name: 'Attendance & Leave', auth: true },

  // Companies
  { path: '/companies', name: 'Companies', auth: true },

  // Analytics & AI
  { path: '/reports', name: 'Reports', auth: true },
  { path: '/analytics', name: 'Analytics', auth: true },
  { path: '/operations-kpi', name: 'Operations KPI', auth: true },
  { path: '/market-indices', name: 'Market Indices', auth: true },
  { path: '/market-overview', name: 'Market Overview', auth: true },
  { path: '/mari8x-llm', name: 'Mari8x LLM', auth: true },
  { path: '/ai-engine', name: 'AI Dashboard', auth: true },

  // Knowledge & RAG
  { path: '/advanced-search', name: 'Advanced Search', auth: true },
  { path: '/knowledge-base', name: 'Knowledge Base', auth: true },

  // Notifications
  { path: '/alerts', name: 'Alerts', auth: true },
  { path: '/activity', name: 'Activity Feed', auth: true },
  { path: '/expiry-tracker', name: 'Expiry Tracker', auth: true },
  { path: '/mentions', name: 'Mentions Inbox', auth: true },
  { path: '/approvals', name: 'Approval Workflows', auth: true },

  // Communications
  { path: '/email-inbox', name: 'Email Inbox', auth: true },
  { path: '/notification-center', name: 'Notification Center', auth: true },

  // Platform Info
  { path: '/features', name: 'Features', auth: true },
  { path: '/pricing', name: 'Pricing', auth: true },
  { path: '/payment', name: 'Payment', auth: true },
  { path: '/subscription-success', name: 'Subscription Success', auth: true },
  { path: '/subscription-management', name: 'Subscription Management', auth: true },

  // Beta Program
  { path: '/beta/signup', name: 'Beta Signup', auth: false },
  { path: '/beta/onboarding', name: 'Beta Onboarding', auth: true },
  { path: '/admin/beta', name: 'Beta Dashboard', auth: true },
  { path: '/admin/beta/feedback', name: 'Beta Feedback', auth: true },
  { path: '/admin/beta/analytics', name: 'Beta Analytics', auth: true },
  { path: '/admin/beta/success', name: 'Beta Success', auth: true },

  // Training
  { path: '/training', name: 'Training Center', auth: true },

  // Beta Features
  { path: '/beta/knowledge-base', name: 'Beta Knowledge Base', auth: true },

  // AIS & Tracking
  { path: '/ais/live', name: 'AIS Live', auth: true },
  { path: '/ais/hybrid-map', name: 'AIS Hybrid Map', auth: true },
  { path: '/ais/gfw-events', name: 'GFW Events', auth: true },
  { path: '/ais/vessel-journey', name: 'Vessel Journey', auth: true },
  { path: '/ais/fleet-dashboard', name: 'AIS Fleet Dashboard', auth: true },
  { path: '/ais/alerts', name: 'AIS Vessel Alerts', auth: true },
  { path: '/ais/geofencing', name: 'AIS Geofencing', auth: true },
  { path: '/fleet/performance', name: 'Fleet Performance', auth: true },

  // Weather
  { path: '/weather-routing', name: 'Weather Routing', auth: true },

  // Portals
  { path: '/vessel-portal', name: 'Vessel Portal', auth: true },
  { path: '/fleet-portal', name: 'Fleet Portal', auth: true },
  { path: '/owner-roi-dashboard', name: 'Owner ROI Dashboard', auth: true },

  // S&P (Ship Sale & Purchase)
  { path: '/sale-listings', name: 'Sale Listings', auth: true },
  { path: '/snp-desk', name: 'S&P Desk', auth: true },
  { path: '/snp-deals', name: 'S&P Deal Room', auth: true },
  { path: '/snp-valuation', name: 'S&P Valuation', auth: true },
  { path: '/closing-tracker', name: 'Closing Tracker', auth: true },

  // Workflows
  { path: '/flow-canvas', name: 'Flow Canvas', auth: true },
];

// Test results storage
const testResults: any[] = [];

test.describe('Comprehensive Page Load Tests', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test.beforeAll(() => {
    console.log(`\n${'='.repeat(80)}`);
    console.log('MARI8X COMPREHENSIVE PAGE LOAD TEST');
    console.log(`Testing ${routes.length} routes`);
    console.log(`${'='.repeat(80)}\n`);
  });

  for (const route of routes) {
    test(`${route.name} (${route.path})`, async ({ page }) => {
      const startTime = Date.now();
      let status = 'PASS';
      let error = null;
      let consoleErrors: string[] = [];
      let hasContent = false;

      try {
        // Track console errors
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            const text = msg.text();
            // Filter out known non-critical errors
            if (
              !text.includes('ERR_BLOCKED_BY_CLIENT') &&
              !text.includes('cloudflareinsights') &&
              !text.includes('Apollo DevTools')
            ) {
              consoleErrors.push(text);
            }
          }
        });

        // Navigate to page
        const response = await page.goto(`https://mari8x.com${route.path}`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });

        // Check HTTP status
        const httpStatus = response?.status();
        if (httpStatus && httpStatus >= 400) {
          status = 'FAIL';
          error = `HTTP ${httpStatus}`;
        }

        // Wait a bit for React to render
        await page.waitForTimeout(2000);

        // Check if page has content (not blank)
        const bodyText = await page.locator('body').innerText();
        hasContent = bodyText.trim().length > 0;

        if (!hasContent) {
          status = 'FAIL';
          error = 'Blank page (no content)';
        }

        // Check for React root element
        const rootElement = await page.locator('#root').count();
        if (rootElement === 0) {
          status = 'WARN';
          error = 'No #root element found';
        }

        // Take screenshot
        const screenshotPath = `playwright-results/screenshots/${route.path.replace(/\//g, '_') || 'home'}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });

        // Check for GraphQL errors
        if (consoleErrors.some((e) => e.includes('GraphQL error'))) {
          status = 'WARN';
          error = 'GraphQL errors in console';
        }

        const loadTime = Date.now() - startTime;

        // Store result
        testResults.push({
          path: route.path,
          name: route.name,
          status,
          loadTime,
          httpStatus,
          hasContent,
          consoleErrors: consoleErrors.length,
          error,
        });

        console.log(`  ${status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌'} ${route.name.padEnd(40)} ${loadTime}ms`);

        // Assert based on status
        if (status === 'FAIL') {
          expect(hasContent, `Page "${route.name}" should have content`).toBe(true);
        }
      } catch (err: any) {
        status = 'FAIL';
        error = err.message;
        const loadTime = Date.now() - startTime;

        testResults.push({
          path: route.path,
          name: route.name,
          status: 'FAIL',
          loadTime,
          error: err.message,
          hasContent: false,
          consoleErrors: consoleErrors.length,
        });

        console.log(`  ❌ ${route.name.padEnd(40)} FAILED: ${err.message}`);
        throw err;
      }
    });
  }

  test.afterAll(() => {
    // Generate report
    const passed = testResults.filter((r) => r.status === 'PASS').length;
    const warned = testResults.filter((r) => r.status === 'WARN').length;
    const failed = testResults.filter((r) => r.status === 'FAIL').length;
    const total = testResults.length;

    const reportPath = 'playwright-results/test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));

    const markdownReport = generateMarkdownReport(testResults);
    fs.writeFileSync('playwright-results/TEST-REPORT.md', markdownReport);

    console.log(`\n${'='.repeat(80)}`);
    console.log('TEST SUMMARY');
    console.log(`${'='.repeat(80)}`);
    console.log(`✅ Passed: ${passed}/${total} (${((passed / total) * 100).toFixed(1)}%)`);
    console.log(`⚠️  Warnings: ${warned}/${total}`);
    console.log(`❌ Failed: ${failed}/${total}`);
    console.log(`\nDetailed report: playwright-results/TEST-REPORT.md`);
    console.log(`JSON report: ${reportPath}`);
    console.log(`${'='.repeat(80)}\n`);
  });
});

function generateMarkdownReport(results: any[]): string {
  const passed = results.filter((r) => r.status === 'PASS');
  const warned = results.filter((r) => r.status === 'WARN');
  const failed = results.filter((r) => r.status === 'FAIL');

  let report = `# Mari8x Comprehensive Page Load Test Report\n\n`;
  report += `**Date**: ${new Date().toISOString()}\n`;
  report += `**Total Pages**: ${results.length}\n\n`;

  report += `## Summary\n\n`;
  report += `| Status | Count | Percentage |\n`;
  report += `|--------|-------|------------|\n`;
  report += `| ✅ Passed | ${passed.length} | ${((passed.length / results.length) * 100).toFixed(1)}% |\n`;
  report += `| ⚠️ Warnings | ${warned.length} | ${((warned.length / results.length) * 100).toFixed(1)}% |\n`;
  report += `| ❌ Failed | ${failed.length} | ${((failed.length / results.length) * 100).toFixed(1)}% |\n\n`;

  if (failed.length > 0) {
    report += `## ❌ Failed Pages (${failed.length})\n\n`;
    report += `| Page | Path | Error | Load Time |\n`;
    report += `|------|------|-------|----------|\n`;
    for (const r of failed) {
      report += `| ${r.name} | ${r.path} | ${r.error || 'Unknown'} | ${r.loadTime}ms |\n`;
    }
    report += `\n`;
  }

  if (warned.length > 0) {
    report += `## ⚠️ Pages with Warnings (${warned.length})\n\n`;
    report += `| Page | Path | Warning | Load Time |\n`;
    report += `|------|--------|---------|----------|\n`;
    for (const r of warned) {
      report += `| ${r.name} | ${r.path} | ${r.error || 'Unknown'} | ${r.loadTime}ms |\n`;
    }
    report += `\n`;
  }

  report += `## ✅ Passed Pages (${passed.length})\n\n`;
  report += `| Page | Path | Load Time | Console Errors |\n`;
  report += `|------|------|-----------|----------------|\n`;
  for (const r of passed) {
    report += `| ${r.name} | ${r.path} | ${r.loadTime}ms | ${r.consoleErrors} |\n`;
  }

  return report;
}
