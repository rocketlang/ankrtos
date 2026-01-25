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

    ${(() => {
      const testsWithFixes = report.tests.filter(t => t.fixResults && t.fixResults.length > 0);
      if (testsWithFixes.length === 0) return '';

      const totalFixAttempts = testsWithFixes.reduce((sum, t) => sum + (t.fixResults?.length || 0), 0);
      const successfulFixes = testsWithFixes.reduce((sum, t) =>
        sum + (t.fixResults?.filter(f => f.success).length || 0), 0);
      const testsAutoFixed = testsWithFixes.filter(t =>
        t.status === 'pass' && t.fixResults?.some(f => f.success)).length;

      return `
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="margin: 0 0 15px 0; color: #333; font-size: 20px;">🔧 Auto-Fix Summary</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
            <div>
              <div style="font-size: 13px; color: #666; margin-bottom: 3px;">Tests with Fixes</div>
              <div style="font-size: 24px; font-weight: bold; color: #3498db;">${testsWithFixes.length}</div>
            </div>
            <div>
              <div style="font-size: 13px; color: #666; margin-bottom: 3px;">Fix Attempts</div>
              <div style="font-size: 24px; font-weight: bold; color: #333;">${totalFixAttempts}</div>
            </div>
            <div>
              <div style="font-size: 13px; color: #666; margin-bottom: 3px;">Successful</div>
              <div style="font-size: 24px; font-weight: bold; color: #27ae60;">${successfulFixes}</div>
            </div>
            <div>
              <div style="font-size: 13px; color: #666; margin-bottom: 3px;">Tests Auto-Fixed</div>
              <div style="font-size: 24px; font-weight: bold; color: #27ae60;">${testsAutoFixed}</div>
            </div>
            <div>
              <div style="font-size: 13px; color: #666; margin-bottom: 3px;">Success Rate</div>
              <div style="font-size: 24px; font-weight: bold; color: ${successfulFixes / totalFixAttempts >= 0.5 ? '#27ae60' : '#e74c3c'};">
                ${totalFixAttempts > 0 ? ((successfulFixes / totalFixAttempts) * 100).toFixed(0) : 0}%
              </div>
            </div>
          </div>
        </div>
      `;
    })()}

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
            ${test.metrics && (test.metrics.startupTime || test.metrics.memoryUsage || test.metrics.networkLatency) ? `
              <div style="margin-top: 10px;">
                <details>
                  <summary style="cursor: pointer; color: #3498db;">📊 Performance Metrics</summary>
                  <div style="margin-top: 10px; font-size: 14px; color: #555;">
                    ${test.metrics.startupTime ? `<div>⏱️ Startup Time: ${test.metrics.startupTime}ms</div>` : ''}
                    ${test.metrics.memoryUsage ? `<div>💾 Memory Usage: ${(test.metrics.memoryUsage / 1024 / 1024).toFixed(2)} MB</div>` : ''}
                    ${test.metrics.networkLatency ? `<div>🌐 Network Latency: ${test.metrics.networkLatency}ms</div>` : ''}
                    ${test.metrics.cpuUsage ? `<div>⚙️ CPU Usage: ${test.metrics.cpuUsage.toFixed(1)}%</div>` : ''}
                    ${test.metrics.fps ? `<div>🎬 FPS: ${test.metrics.fps}</div>` : ''}
                  </div>
                </details>
              </div>
            ` : ''}
            ${test.visualComparison ? `
              <div style="margin-top: 10px;">
                <details ${!test.visualComparison.matches ? 'open' : ''}>
                  <summary style="cursor: pointer; color: ${test.visualComparison.matches ? '#3498db' : '#e74c3c'};">
                    🎨 Visual Comparison ${test.visualComparison.matches ? '✓' : '✗'}
                  </summary>
                  <div style="margin-top: 10px; font-size: 14px;">
                    <div style="color: ${test.visualComparison.matches ? '#27ae60' : '#e74c3c'};">
                      Match: ${test.visualComparison.matches ? 'Yes' : 'No'}
                      (${test.visualComparison.diffPercentage.toFixed(4)}% difference)
                    </div>
                    <div style="color: #555;">Different Pixels: ${test.visualComparison.diffPixels.toLocaleString()}</div>
                    ${test.visualComparison.diffImagePath ? `
                      <div style="margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                        <div>
                          <div style="font-weight: bold; margin-bottom: 5px;">Baseline</div>
                          <img src="${test.visualComparison.baselinePath}" style="width: 100%; border: 2px solid #3498db; border-radius: 4px;" />
                        </div>
                        <div>
                          <div style="font-weight: bold; margin-bottom: 5px;">Current</div>
                          <img src="${test.visualComparison.currentPath}" style="width: 100%; border: 2px solid #f39c12; border-radius: 4px;" />
                        </div>
                        <div>
                          <div style="font-weight: bold; margin-bottom: 5px;">Diff</div>
                          <img src="${test.visualComparison.diffImagePath}" style="width: 100%; border: 2px solid #e74c3c; border-radius: 4px;" />
                        </div>
                      </div>
                    ` : ''}
                  </div>
                </details>
              </div>
            ` : ''}
            ${test.fixResults && test.fixResults.length > 0 ? `
              <div style="margin-top: 10px;">
                <details open>
                  <summary style="cursor: pointer; color: ${test.fixResults.some(f => f.success) ? '#27ae60' : '#e74c3c'};">
                    🔧 Auto-Fix Attempted (${test.fixResults.filter(f => f.success).length}/${test.fixResults.length} successful)
                  </summary>
                  <div style="margin-top: 10px;">
                    ${test.fixResults.map((fix, index) => `
                      <div style="margin-bottom: 15px; padding: 10px; background: ${fix.success ? '#f0fff4' : '#fff5f5'}; border-left: 4px solid ${fix.success ? '#27ae60' : '#e74c3c'}; border-radius: 4px;">
                        <div style="font-weight: bold; margin-bottom: 5px;">
                          ${index + 1}. ${fix.success ? '✅' : '❌'} ${fix.fixName}
                        </div>
                        <div style="font-size: 13px; color: #666; margin-bottom: 5px;">
                          <strong>Type:</strong> ${fix.issueType}
                        </div>
                        <div style="font-size: 13px; color: #666; margin-bottom: 5px;">
                          <strong>Time:</strong> ${new Date(fix.timestamp).toLocaleTimeString()}
                        </div>
                        ${fix.actions && fix.actions.length > 0 ? `
                          <div style="margin-top: 8px;">
                            <div style="font-size: 13px; font-weight: 600; margin-bottom: 4px;">Actions Taken:</div>
                            <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #555;">
                              ${fix.actions.map(action => `<li>${action}</li>`).join('')}
                            </ul>
                          </div>
                        ` : ''}
                        ${fix.error ? `
                          <div style="margin-top: 8px; padding: 6px; background: #ffe6e6; border-radius: 3px;">
                            <div style="font-size: 12px; color: #c00;"><strong>Error:</strong> ${fix.error}</div>
                          </div>
                        ` : ''}
                      </div>
                    `).join('')}
                  </div>
                </details>
              </div>
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
