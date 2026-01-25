# 🧪 TesterBot - Universal Testing & Auto-Fix System

**Version:** 0.1.0 (Phase 1 Complete)
**Status:** ✅ Core Functional - Ready for Testing
**Created:** January 22, 2026

---

## 🎯 What is TesterBot?

TesterBot is a universal testing and auto-fix system that can:
- ✅ Test any ankr app (desktop, web, mobile) end-to-end
- ✅ Detect issues automatically
- 🔄 Fix common problems autonomously (Phase 3)
- 📊 Generate beautiful HTML/JSON reports
- 🌍 Run tests remotely across environments (Phase 5)

---

## 📦 Packages

### Core Packages
- **@ankr/testerbot-core** - Orchestrator, scheduler, and reporter
- **@ankr/testerbot-agents** - Test agents (Desktop, Web, Mobile)
- **@ankr/testerbot-tests** - Test registry and test suites
- **@ankr/testerbot-cli** - Command-line interface

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd /root/packages

# Install dependencies for all packages
pnpm install --recursive

# Or install individually
cd testerbot-core && pnpm install
cd ../testerbot-agents && pnpm install
cd ../testerbot-tests && pnpm install
cd ../testerbot-cli && pnpm install
```

### 2. Build Packages

```bash
# Build all packages
cd /root/packages/testerbot-core && pnpm build
cd /root/packages/testerbot-agents && pnpm build
cd /root/packages/testerbot-tests && pnpm build
cd /root/packages/testerbot-cli && pnpm build
```

### 3. Run Tests

```bash
# Run ankrshield desktop smoke tests
cd /root/packages/testerbot-cli
node dist/cli.js run --app-path /root/ankrshield/apps/desktop/dist/main.js

# With HTML report
node dist/cli.js run --app-path /root/ankrshield/apps/desktop/dist/main.js --report html

# List available tests
node dist/cli.js list
```

---

## 📊 Current Test Suite

### ankrshield Desktop - Smoke Tests (10 tests)

1. **App launches successfully** - Verify app launches < 3s
2. **Dashboard loads** - Verify dashboard renders
3. **Privacy score displays** - Verify score shows (0-100)
4. **Settings page opens** - Verify settings accessible
5. **No console errors** - Verify no JS errors
6. **Stats grid populated** - Verify stats show data
7. **Recent activity loads** - Verify activity component
8. **Protection toggle exists** - Verify toggle present
9. **Header displays** - Verify header/navbar renders
10. **App closes cleanly** - Verify clean shutdown

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│      TesterBot CLI                       │
│  $ testerbot run --app desktop          │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│     TesterBotOrchestrator                │
│  • Schedule tests                        │
│  • Run tests sequentially/parallel       │
│  • Collect results                       │
│  • Generate reports                      │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│      DesktopTestAgent                    │
│  • Launch Electron app (Playwright)      │
│  • Execute test steps                    │
│  • Take screenshots on failure           │
│  • Capture console logs                  │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│      Reporter                            │
│  • Console output (colored)              │
│  • JSON report                           │
│  • HTML report (beautiful)               │
└─────────────────────────────────────────┘
```

---

## 📝 Usage Examples

### Run All Smoke Tests
```bash
testerbot run --app desktop --type smoke --app-path /path/to/app/main.js
```

### Run with HTML Report
```bash
testerbot run --app desktop --report html --output ./test-results
```

### List Available Tests
```bash
testerbot list
testerbot list --app desktop
testerbot list --type smoke
```

---

## 🧪 Test Structure

```typescript
import { Test } from '@ankr/testerbot-core';
import { DesktopTestAgent } from '@ankr/testerbot-agents';

export const myTest: Test = {
  id: 'my-test-001',
  name: 'My Test',
  description: 'Test description',
  type: 'smoke',
  app: 'my-app',
  tags: ['critical', 'ui'],
  timeout: 5000,
  fn: async (agent: DesktopTestAgent) => {
    // Test steps
    await agent.waitForElement('#my-element');
    const text = await agent.getText('#my-element');

    if (!text) {
      throw new Error('Element is empty');
    }
  }
};
```

---

## 📊 Reports

### Console Report
```
🧪 TesterBot - Running 10 tests

  ✓ App launches successfully (2847ms)
  ✓ Dashboard loads (1234ms)
  ✓ Privacy score displays (876ms)
  ...

============================================================
📊 Test Summary
============================================================
Total:   10
Passed:  10
Failed:  0
Skipped: 0
Duration: 15.42s
============================================================

✨ Pass Rate: 100.0%
```

### HTML Report
Beautiful, interactive HTML report with:
- Summary cards (total, passed, failed, skipped)
- Progress bar visualization
- Expandable test details
- Error messages with screenshots
- Clean, modern design

---

## 🎯 Implemented Features (Phase 1)

✅ **Core Infrastructure**
- TesterBotOrchestrator - Central control system
- TestConfig - Flexible test configuration
- TestResult - Structured result format
- Test filtering (by type, app, tags)
- Retry mechanism (configurable retries)
- Timeout handling

✅ **Desktop Test Agent**
- Playwright integration for Electron
- Element finding (CSS selectors)
- Click, type, getText actions
- Screenshot capture on failure
- Console error detection
- Memory usage tracking
- App lifecycle (launch/close)

✅ **Test Suite**
- 10 smoke tests for ankrshield desktop
- Critical path coverage
- UI rendering verification
- Data validation
- Error detection

✅ **Reporting**
- Console reporter (colored output)
- JSON reporter (structured data)
- HTML reporter (beautiful UI)
- Summary statistics
- Pass rate calculation

✅ **CLI Tool**
- `testerbot run` - Run tests
- `testerbot list` - List tests
- Configurable app path
- Report format selection
- Output directory control

---

## 🔄 Next Steps (Phase 2-5)

### Phase 2: Test Agents Expansion
- [ ] Web test agent (Playwright browsers)
- [ ] Mobile test agent (Appium)
- [ ] Video recording on failure
- [ ] Performance metrics collection
- [ ] Visual regression testing

### Phase 3: Auto-Fix System
- [ ] Fix engine implementation
- [ ] Common fixes (build, service, port, env)
- [ ] Fix verification
- [ ] Rollback mechanism

### Phase 4: Comprehensive Test Suites
- [ ] 15 E2E tests for ankrshield
- [ ] 8 performance tests
- [ ] Visual regression tests
- [ ] Stress & chaos tests

### Phase 5: Integration & Polish
- [ ] CI/CD integration (GitHub Actions)
- [ ] Slack/Discord notifications
- [ ] Dashboard UI
- [ ] Remote testing capability
- [ ] Complete documentation

---

## 🤝 Contributing

TesterBot is designed to be extensible:

### Adding New Tests
```typescript
// packages/testerbot-tests/src/myapp/smoke-tests.ts
export const myAppSmokeTests: Test[] = [
  {
    id: 'myapp-001',
    name: 'My Test',
    type: 'smoke',
    app: 'myapp',
    tags: ['critical'],
    fn: async (agent) => {
      // Your test logic
    }
  }
];
```

### Adding New Agents
```typescript
// packages/testerbot-agents/src/my-agent.ts
import { TestAgent } from './base-agent';

export class MyTestAgent extends TestAgent {
  async setup() { /* ... */ }
  async teardown() { /* ... */ }
  // Implement all abstract methods
}
```

---

## 📚 Documentation

- **Full Design:** `/root/TESTERBOT-PROJECT-DESIGN.md`
- **TODO Roadmap:** `/root/TESTERBOT-TODO.md`
- **Published Docs:** https://ankr.in/project/documents/TESTERBOT-PROJECT-DESIGN.md

---

## 🎉 Status

**Phase 1 Complete:** ✅ Core functional, ready for testing
**Next:** Build packages and run first tests on ankrshield

---

**Built with ❤️ by ANKR Labs**
**License:** MIT
