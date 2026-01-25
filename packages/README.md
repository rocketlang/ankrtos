# TesterBot 🤖

**Universal Testing and Auto-Fix System for ankr Applications**

[![Tests](https://github.com/ankr/testerbot/workflows/TesterBot%20Tests/badge.svg)](https://github.com/ankr/testerbot/actions)
[![npm version](https://badge.fury.io/js/%40ankr%2Ftesterbot-cli.svg)](https://www.npmjs.com/package/@ankr/testerbot-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TesterBot is a comprehensive testing framework that provides end-to-end, performance, visual regression, and resilience testing across desktop, web, and mobile platforms. It includes an intelligent auto-fix system that can automatically resolve common failures.

## 🌟 Features

- **70 Comprehensive Tests**
  - 23 Smoke Tests (Desktop, Web, Mobile)
  - 15 End-to-End Tests
  - 8 Performance Tests with benchmarking
  - 16 Visual Regression Tests
  - 8 Stress & Chaos Tests

- **Multi-Platform Support**
  - Desktop apps (Electron via Playwright)
  - Web apps (Chromium, Firefox, WebKit)
  - Mobile apps (iOS, Android via Appium)

- **Intelligent Auto-Fix System**
  - 5 Built-in Fixes (Build, Database, Port, Env Var, Service)
  - Automatic verification and rollback
  - Fix history tracking and statistics

- **Rich Reporting**
  - HTML reports with screenshots and videos
  - JSON reports for CI/CD integration
  - Console output with colored formatting
  - Test metrics and performance data

- **CI/CD Integration**
  - GitHub Actions workflows
  - Scheduled nightly runs
  - PR comment integration
  - Visual baseline caching

- **Notifications**
  - Slack integration
  - Discord webhooks
  - Email summaries

## 📦 Installation

```bash
# Install globally
npm install -g @ankr/testerbot-cli

# Or install in your project
pnpm add -D @ankr/testerbot-cli @ankr/testerbot-core @ankr/testerbot-agents @ankr/testerbot-tests
```

## 🚀 Quick Start

```bash
# Run smoke tests on desktop app
testerbot run --app desktop --type smoke

# Run E2E tests with HTML report
testerbot run --app desktop --type e2e --report html

# Run with auto-fix enabled
testerbot run --app desktop --type smoke --auto-fix

# List all available tests
testerbot list

# List tests by type
testerbot list -t performance

# Run tests on specific app
testerbot run --app-path /path/to/app --type smoke
```

## 📚 Test Types

### Smoke Tests
Fast validation of basic functionality. Run these first to catch critical issues.

```bash
testerbot run --app desktop --type smoke      # Desktop smoke tests (10)
testerbot run --app web --type smoke          # Web smoke tests (7)
testerbot run --app mobile --type smoke       # Mobile smoke tests (6)
```

### E2E Tests
Complete user workflow validation from start to finish.

```bash
testerbot run --app desktop --type e2e        # 15 E2E tests
```

**Example E2E Tests:**
- Complete privacy scan workflow
- Protection toggle workflow
- Activity feed navigation
- Settings access and configuration
- Data export functionality

### Performance Tests
Benchmark application performance with strict thresholds.

```bash
testerbot run --app desktop --type performance
```

**Thresholds:**
- Startup time: < 3s
- Memory usage: < 150MB
- Render time: < 2s
- Interaction response: < 500ms

### Visual Regression Tests
Pixel-perfect screenshot comparison to detect UI changes.

```bash
testerbot run --app desktop --type visual     # Desktop visual tests (8)
testerbot run --app web --type visual         # Web visual tests (8)
```

**Visual Tests:**
- Dashboard appearance
- Dark mode consistency
- Responsive layouts (mobile, tablet)
- Component styling
- Modal dialogs

**Thresholds:**
- Pixel difference: 0.1%
- Failure threshold: 0.5%

### Stress & Chaos Tests
Resilience testing under extreme conditions and failure scenarios.

```bash
testerbot run --app desktop --type stress     # Stress tests (4)
testerbot run --app desktop --type chaos      # Chaos tests (4)
testerbot run --app desktop --type resilience # Both (8)
```

**Stress Tests:**
- Rapid interaction (100 clicks)
- Memory stress with leak detection
- Long-running stability (5 minutes)
- Concurrent operations

**Chaos Tests:**
- Invalid input handling (XSS, SQL injection)
- Rapid view switching
- Error recovery
- Resource cleanup verification

## 🔧 Auto-Fix System

TesterBot includes an intelligent auto-fix engine that can automatically resolve common failures.

### Enable Auto-Fix

```bash
# Run with auto-fix enabled
testerbot run --app desktop --type smoke --auto-fix

# Set maximum fix attempts
testerbot run --auto-fix --max-fix-attempts 3
```

### Available Fixes

```bash
# List all available fixes
testerbot fixes
```

**Built-in Fixes:**
1. **build-failed**: Clear node_modules and rebuild
2. **database-connection-failed**: Restart PostgreSQL service
3. **port-already-in-use**: Kill process on port
4. **missing-env-var**: Add default environment variables
5. **service-crashed**: Restart crashed services

### Fix Statistics

```bash
# View fix statistics (last 7 days)
testerbot fix-stats

# View stats for custom time range
testerbot fix-stats --days 30
```

**Statistics Include:**
- Overall success rate
- Per-fix breakdown
- Recent failures
- Success trend chart

## 📊 Reports

### Console Report (Default)

```bash
testerbot run --app desktop --type smoke
```

Output:
```
🧪 TesterBot - Universal Testing System

📱 App: desktop
📊 Type: smoke
🔧 Auto-fix: disabled

✓ app-launches (1.2s)
✓ dashboard-loads (0.8s)
✗ settings-opens (2.1s)
  Error: Element not found: button[Settings]
  Screenshot: ./test-results/screenshots/settings-opens-failed.png

════════════════════════════════════════
Summary
════════════════════════════════════════
Total:    10
Passed:   9 ✅
Failed:   1 ❌
Skipped:  0
Duration: 12.3s
Success:  90.0%
```

### JSON Report

```bash
testerbot run --app desktop --type smoke --report json --output ./results
```

Output: `./results/testerbot-report-{timestamp}.json`

### HTML Report

```bash
testerbot run --app desktop --type smoke --report html --output ./results
```

Output: `./results/testerbot-report-{timestamp}.html`

**HTML Report Features:**
- Pass/fail indicators with colors
- Embedded screenshots
- Video playback (on failure)
- Performance metrics
- Auto-fix summary
- Expandable error details

## 🎨 Visual Regression Testing

### First Run (Create Baselines)

```bash
testerbot run --app desktop --type visual
```

Output:
```
✓ Baseline created for desktop dashboard
✓ Baseline created for desktop settings
...
```

Baselines saved to: `./test-results/visual-baselines/desktop/`

### Subsequent Runs (Compare)

```bash
testerbot run --app desktop --type visual
```

Output:
```
✓ Desktop dashboard visual match: 0.0023% difference
✓ Settings UI visual match: 0.0045% difference
❌ Activity feed layout

Error:
Visual regression detected in activity feed:
  - 1.25% of pixels changed (1,250 pixels)
  - Threshold: 0.5%
  - Diff image: ./test-results/visual-diffs/desktop-activity-feed-diff.png
```

### Update Baselines

When UI changes are intentional:

```bash
# Delete old baselines
rm -rf ./test-results/visual-baselines/

# Re-run tests to create new baselines
testerbot run --app desktop --type visual
```

## ⚙️ Configuration

### Environment Variables

```bash
# Slack notifications
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
export SLACK_CHANNEL=#testing
export SLACK_USERNAME=TesterBot

# Discord notifications
export DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
export DISCORD_USERNAME=TesterBot

# Email notifications
export EMAIL_FROM=testerbot@company.com
export EMAIL_TO=team@company.com,qa@company.com
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_SECURE=true
export SMTP_USER=your-email@gmail.com
export SMTP_PASS=your-app-password
```

### CLI Options

```bash
Options:
  -a, --app <app>              App to test (desktop, web, mobile)
  -t, --type <type>            Test type (smoke, e2e, performance, visual, stress, chaos)
  --app-path <path>            Path to app executable or URL
  --platform <platform>        Mobile platform (iOS, Android)
  --device <device>            Device name (for mobile)
  --bundle-id <id>             Bundle ID or package name (for mobile)
  --report <format>            Report format (console, json, html)
  --output <dir>               Output directory for reports (default: ./test-results)
  --auto-fix                   Enable automatic fixing of test failures
  --max-fix-attempts <n>       Maximum fix attempts per failure (default: 3)
  -h, --help                   Display help
```

## 🔄 CI/CD Integration

### GitHub Actions

TesterBot includes a complete GitHub Actions workflow:

```yaml
# .github/workflows/test.yml
name: TesterBot Tests

on:
  push:
    branches: [ main, master, develop ]
  pull_request:
    branches: [ main, master, develop ]
  schedule:
    - cron: '0 2 * * *'  # Nightly at 2 AM UTC
```

**Features:**
- Parallel test execution (smoke, e2e, performance, visual)
- Test result artifacts
- Screenshot uploads on failure
- Visual baseline caching
- PR comment integration
- Scheduled nightly runs

### PR Comments

TesterBot automatically comments on PRs with test results:

```
## ✅ TesterBot Test Results

| Metric | Value |
|--------|-------|
| Total Tests | 70 |
| Passed | ✅ 68 |
| Failed | ❌ 2 |
| Pass Rate | 97.1% |

⚠️ Some tests failed. Please review the test artifacts.
```

## 📱 Platform-Specific Testing

### Desktop Apps (Electron)

```bash
testerbot run --app desktop --app-path /path/to/app/main.js
```

**Requirements:**
- Electron app with main.js entry point
- Playwright installed

### Web Apps

```bash
testerbot run --app web --app-path http://localhost:3000
```

**Requirements:**
- Running web server
- Playwright browsers installed

### Mobile Apps

```bash
# iOS
testerbot run --app mobile --platform iOS --device "iPhone 15" --bundle-id com.example.app

# Android
testerbot run --app mobile --platform Android --device "Pixel 6" --bundle-id com.example.app
```

**Requirements:**
- Appium server running
- iOS Simulator or Android Emulator
- WebdriverIO installed

## 🧪 Writing Custom Tests

### Test Structure

```typescript
import { Test } from '@ankr/testerbot-core';
import { DesktopTestAgent } from '@ankr/testerbot-agents';

export const myCustomTests: Test[] = [
  {
    id: 'my-test-001',
    name: 'My custom test',
    description: 'Description of what this test does',
    type: 'smoke',  // or 'e2e', 'performance', 'visual', 'stress', 'chaos'
    app: 'my-app',
    tags: ['custom', 'important'],
    timeout: 10000,
    fn: async (agent: DesktopTestAgent) => {
      // Wait for element
      await agent.waitForElement('#my-element', 5000);

      // Click element
      await agent.click('#my-element');

      // Type text
      await agent.type('input[name="username"]', 'testuser');

      // Get text
      const text = await agent.getText('.result');

      // Assertions
      if (!text.includes('Success')) {
        throw new Error('Expected success message');
      }

      // Take screenshot
      await agent.takeScreenshot('my-test-success');
    }
  }
];
```

### Register Custom Tests

```typescript
import { TesterBotOrchestrator } from '@ankr/testerbot-core';
import { myCustomTests } from './my-tests';

const orchestrator = new TesterBotOrchestrator(config);
orchestrator.registerTests(myCustomTests);

await orchestrator.runTests(agent);
```

## 🛠️ API Reference

### Test Agent Methods

#### DesktopTestAgent

```typescript
// Element interactions
await agent.waitForElement(selector: string, timeout?: number)
await agent.click(selector: string)
await agent.type(selector: string, text: string)
await agent.getText(selector: string): Promise<string>
await agent.isElementVisible(selector: string): Promise<boolean>
await agent.findElements(selector: string): Promise<ElementHandle[]>

// App state
await agent.isAppVisible(): Promise<boolean>
await agent.getConsoleErrors(): Promise<string[]>

// Performance
await agent.getMemoryUsage(): Promise<number>
await agent.getPerformanceMetrics(): Promise<PerformanceMetrics>

// Screenshots
await agent.takeScreenshot(name: string): Promise<string>
await agent.takeVisualSnapshot(name: string): Promise<string>

// Utilities
await agent.wait(ms: number): Promise<void>
```

#### WebTestAgent

```typescript
// All DesktopTestAgent methods, plus:

await agent.navigate(url: string)
await agent.setViewport(width: number, height: number)
await agent.getCookies(): Promise<Cookie[]>
await agent.setCookie(cookie: Cookie)
```

#### MobileTestAgent

```typescript
// All basic methods, plus:

await agent.swipe(direction: 'up' | 'down' | 'left' | 'right')
await agent.longPress(selector: string)
await agent.rotate(orientation: 'portrait' | 'landscape')
await agent.hideKeyboard()
```

### Auto-Fix API

```typescript
import { AutoFixEngine, Fix } from '@ankr/testerbot-fixes';

// Create fix engine
const fixEngine = new AutoFixEngine({
  maxFixAttempts: 3,
  verifyAfterFix: true,
  rollbackOnFailure: true,
  timeout: 60000
});

// Register fixes
fixEngine.registerFixes(ALL_FIXES);

// Attempt to fix a failure
const result = await fixEngine.attemptFix(testResult, testAgent);

if (result.success) {
  console.log('Fixed!', result.actions);
} else {
  console.log('Fix failed:', result.error);
}
```

### Custom Fix

```typescript
const myCustomFix: Fix = {
  id: 'my-fix-001',
  name: 'My Custom Fix',
  description: 'Fixes a specific issue',
  category: 'custom',
  priority: 5,
  tags: ['custom'],

  canFix: (testResult) => {
    return testResult.error?.message.includes('MY_ERROR');
  },

  fix: async (testResult, agent) => {
    // Perform fix actions
    const actions: string[] = [];

    // Example: restart service
    const { execSync } = require('child_process');
    execSync('systemctl restart my-service');
    actions.push('Restarted my-service');

    return { actions, state: {} };
  },

  verify: async (testResult, agent) => {
    // Verify fix worked
    return { success: true };
  }
};

fixEngine.registerFix(myCustomFix);
```

## 📈 Performance Benchmarks

TesterBot includes comprehensive performance testing with strict thresholds:

| Metric | Threshold | Grading |
|--------|-----------|---------|
| Startup Time | < 3s | Excellent: <1s, Good: <2s, Acceptable: <3s |
| Memory Usage | < 150MB | Excellent: <75MB, Good: <100MB, Acceptable: <150MB |
| Render Time | < 2s | Excellent: <500ms, Good: <1s, Acceptable: <2s |
| Interaction Response | < 500ms | Excellent: <100ms, Good: <250ms, Acceptable: <500ms |

## 🐛 Troubleshooting

### Tests Not Finding Elements

```bash
# Increase timeout
testerbot run --app desktop --type smoke

# In test code:
await agent.waitForElement('#my-element', 10000);  // 10 second timeout
```

### App Not Launching

```bash
# Verify app path
testerbot run --app-path /absolute/path/to/app/main.js
```

### Visual Tests Always Failing

```bash
# Delete baselines and recreate
rm -rf ./test-results/visual-baselines/
testerbot run --app desktop --type visual
```

### Memory Issues

```bash
# Run with increased heap
NODE_OPTIONS="--max-old-space-size=4096" testerbot run
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone repository
git clone https://github.com/ankr/testerbot.git
cd testerbot

# Install dependencies
pnpm install

# Build all packages
pnpm -r build

# Run tests
pnpm test

# Link CLI for local development
cd packages/testerbot-cli
npm link
```

## 📄 License

MIT © ankr

## 🙏 Acknowledgments

- Built with [Playwright](https://playwright.dev/) for desktop and web testing
- Mobile testing powered by [Appium](https://appium.io/)
- Visual regression using [pixelmatch](https://github.com/mapbox/pixelmatch)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/ankr/testerbot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ankr/testerbot/discussions)
- **Email**: support@ankr.com

---

**Made with ❤️ by the ankr team**
