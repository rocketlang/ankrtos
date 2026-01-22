/**
 * TesterBot Reporter - Generate test reports in various formats
 */

import { TestReport } from './types';
import * as fs from 'fs';
import * as path from 'path';

export class Reporter {
  /**
   * Generate JSON report
   */
  static toJSON(report: TestReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Save JSON report to file
   */
  static saveJSON(report: TestReport, outputDir: string): string {
    const filename = `test-report-${Date.now()}.json`;
    const filepath = path.join(outputDir, filename);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(filepath, this.toJSON(report));

    return filepath;
  }

  /**
   * Generate HTML report
   */
  static toHTML(report: TestReport): string {
    const passRate = ((report.summary.passed / report.summary.total) * 100).toFixed(1);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TesterBot Report - ${report.app}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header {
      background: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 { color: #333; margin-bottom: 10px; }
    .meta { color: #666; font-size: 14px; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary-card h3 { font-size: 14px; color: #666; margin-bottom: 5px; }
    .summary-card .value { font-size: 32px; font-weight: bold; }
    .summary-card.total .value { color: #333; }
    .summary-card.passed .value { color: #28a745; }
    .summary-card.failed .value { color: #dc3545; }
    .summary-card.skipped .value { color: #ffc107; }
    .summary-card.duration .value { font-size: 24px; }
    .tests {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .test {
      padding: 15px 20px;
      border-bottom: 1px solid #eee;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .test:last-child { border-bottom: none; }
    .test.pass { border-left: 4px solid #28a745; }
    .test.fail { border-left: 4px solid #dc3545; background: #fff5f5; }
    .test.skip { border-left: 4px solid #ffc107; }
    .test-name { font-weight: 500; flex: 1; }
    .test-duration { color: #666; font-size: 14px; margin-left: 10px; }
    .test-status {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .test-status.pass { background: #d4edda; color: #155724; }
    .test-status.fail { background: #f8d7da; color: #721c24; }
    .test-status.skip { background: #fff3cd; color: #856404; }
    .error {
      margin-top: 10px;
      padding: 10px;
      background: #f8d7da;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      color: #721c24;
    }
    .progress-bar {
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 20px;
    }
    .progress-fill {
      height: 100%;
      background: #28a745;
      transition: width 0.3s;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧪 TesterBot Report</h1>
      <div class="meta">
        <strong>${report.app}</strong> • ${report.environment} •
        ${new Date(report.timestamp).toLocaleString()}
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${passRate}%"></div>
      </div>
    </div>

    <div class="summary">
      <div class="summary-card total">
        <h3>Total Tests</h3>
        <div class="value">${report.summary.total}</div>
      </div>
      <div class="summary-card passed">
        <h3>Passed</h3>
        <div class="value">${report.summary.passed}</div>
      </div>
      <div class="summary-card failed">
        <h3>Failed</h3>
        <div class="value">${report.summary.failed}</div>
      </div>
      <div class="summary-card skipped">
        <h3>Skipped</h3>
        <div class="value">${report.summary.skipped}</div>
      </div>
      <div class="summary-card duration">
        <h3>Duration</h3>
        <div class="value">${(report.summary.duration / 1000).toFixed(1)}s</div>
      </div>
    </div>

    <div class="tests">
      ${report.tests.map(test => `
        <div class="test ${test.status}">
          <div style="flex: 1;">
            <div class="test-name">${test.testName}</div>
            ${test.error ? `
              <div class="error">${test.error.message}</div>
              ${test.error.video ? `
                <div style="margin-top: 10px;">
                  <details>
                    <summary style="cursor: pointer; color: #3498db;">📹 View Video Recording</summary>
                    <video controls style="max-width: 800px; margin-top: 10px; border-radius: 4px;">
                      <source src="${test.error.video}" type="video/webm">
                      <source src="${test.error.video}" type="video/mp4">
                      Your browser does not support video playback.
                    </video>
                  </details>
                </div>
              ` : ''}
              ${test.error.screenshot ? `
                <div style="margin-top: 10px;">
                  <details>
                    <summary style="cursor: pointer; color: #3498db;">📸 View Screenshot</summary>
                    <img src="${test.error.screenshot}" style="max-width: 800px; margin-top: 10px; border-radius: 4px;" />
                  </details>
                </div>
              ` : ''}
            ` : ''}
          </div>
          <div class="test-duration">${test.duration}ms</div>
          <div class="test-status ${test.status}">${test.status}</div>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;

    return html;
  }

  /**
   * Save HTML report to file
   */
  static saveHTML(report: TestReport, outputDir: string): string {
    const filename = `test-report-${Date.now()}.html`;
    const filepath = path.join(outputDir, filename);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(filepath, this.toHTML(report));

    return filepath;
  }

  /**
   * Print summary to console
   */
  static printSummary(report: TestReport): void {
    const green = '\x1b[32m';
    const red = '\x1b[31m';
    const yellow = '\x1b[33m';
    const reset = '\x1b[0m';

    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log(`Total:   ${report.summary.total}`);
    console.log(`${green}Passed:  ${report.summary.passed}${reset}`);
    console.log(`${red}Failed:  ${report.summary.failed}${reset}`);
    console.log(`${yellow}Skipped: ${report.summary.skipped}${reset}`);
    console.log(`Duration: ${(report.summary.duration / 1000).toFixed(2)}s`);
    console.log('='.repeat(60) + '\n');

    const passRate = ((report.summary.passed / report.summary.total) * 100).toFixed(1);
    console.log(`✨ Pass Rate: ${passRate}%\n`);
  }
}
