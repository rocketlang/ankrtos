# TesterBot Phase 2 - Test Agents Expansion

**Started:** January 22, 2026
**Duration:** Week 3-4 (Days 11-20)
**Goal:** Add Web & Mobile agents, Performance monitoring, Visual regression

---

## 🎯 Phase 2 Objectives

1. **Web Test Agent** - Playwright for browsers (Chrome, Firefox, Safari)
2. **Mobile Test Agent** - Appium for iOS/Android
3. **Screenshot & Video** - Enhanced capture on failures
4. **Performance Monitoring** - Startup, memory, CPU, network metrics
5. **Visual Regression** - Baseline comparison and diff generation

---

## 📅 Implementation Plan

### Day 11-12: Web Test Agent ✅ (Starting Now)
- [x] Create WebTestAgent class
- [x] Support Chromium, Firefox, WebKit
- [x] All browser interactions (click, type, navigate)
- [x] Screenshot and console log capture
- [ ] Write 5 web smoke tests for ankrshield landing
- [ ] Test on real website

### Day 13-14: Mobile Test Agent
- [ ] Install Appium dependencies
- [ ] Create MobileTestAgent class
- [ ] iOS simulator support
- [ ] Android emulator support
- [ ] Mobile gestures (tap, swipe)
- [ ] Write 3 mobile smoke tests
- [ ] Test on real mobile apps

### Day 15-16: Enhanced Capture
- [ ] Implement video recording (Playwright API)
- [ ] Automatic recording on test start
- [ ] Save video on failure
- [ ] Embed videos in HTML reports
- [ ] Optimize video file sizes

### Day 17-18: Performance Monitoring
- [ ] Add PerformanceMonitor class
- [ ] Collect startup time metrics
- [ ] Track memory usage over time
- [ ] Monitor CPU usage
- [ ] Network latency measurement
- [ ] Add performance assertions
- [ ] Performance graphs in reports

### Day 19-20: Visual Regression
- [ ] Install pixelmatch library
- [ ] Create VisualTester class
- [ ] Baseline screenshot capture
- [ ] Image comparison logic
- [ ] Diff image generation
- [ ] Threshold configuration
- [ ] Baseline management CLI
- [ ] Visual regression in reports

---

## 🏗️ Architecture Updates

### New Agents
```
testerbot-agents/
├── base-agent.ts          ✅ (Phase 1)
├── desktop-agent.ts       ✅ (Phase 1)
├── web-agent.ts           🔄 (Phase 2 - Starting)
├── mobile-agent.ts        ⏳ (Phase 2 - Day 13-14)
└── index.ts               🔄 (Update exports)
```

### New Utilities
```
testerbot-core/
├── performance-monitor.ts ⏳ (Phase 2 - Day 17-18)
├── visual-tester.ts       ⏳ (Phase 2 - Day 19-20)
└── video-recorder.ts      ⏳ (Phase 2 - Day 15-16)
```

### New Tests
```
testerbot-tests/
├── ankrshield/
│   ├── smoke-tests.ts        ✅ (Phase 1 - Desktop)
│   ├── web-smoke-tests.ts    ⏳ (Phase 2 - Day 11-12)
│   ├── mobile-smoke-tests.ts ⏳ (Phase 2 - Day 13-14)
│   ├── performance-tests.ts  ⏳ (Phase 2 - Day 17-18)
│   └── visual-tests.ts       ⏳ (Phase 2 - Day 19-20)
└── index.ts                  🔄 (Update exports)
```

---

## 📦 Dependencies to Add

### Web Testing
```json
{
  "playwright": "^1.40.0" // Already installed
}
```

### Mobile Testing
```json
{
  "appium": "^2.4.0",
  "appium-xcuitest-driver": "^5.0.0",
  "appium-uiautomator2-driver": "^2.40.0"
}
```

### Visual Regression
```json
{
  "pixelmatch": "^5.3.0",
  "@types/pixelmatch": "^5.2.6",
  "pngjs": "^7.0.0"
}
```

---

## 🧪 New Test Suites

### Web Smoke Tests (5 tests)
1. Landing page loads
2. Navigation works
3. Forms submit
4. Images load
5. Links are valid

### Mobile Smoke Tests (3 tests)
1. App launches
2. Home screen renders
3. Navigation works

### Performance Tests (8 tests)
1. Startup time < 3s
2. Memory usage < 150MB
3. CPU usage < 5%
4. Bundle size < 200KB
5. First paint < 1s
6. Time to interactive < 3s
7. Network latency < 200ms
8. No memory leaks

### Visual Regression Tests (5 tests)
1. Dashboard screenshot matches baseline
2. Settings UI matches baseline
3. Dark mode appearance
4. Responsive design (mobile/tablet/desktop)
5. Component library matches

---

## 📊 Success Metrics

**Phase 2 Complete When:**
- [x] Web agent functional
- [ ] Mobile agent functional
- [ ] 5 web tests passing
- [ ] 3 mobile tests passing
- [ ] Video recording works
- [ ] Performance metrics collected
- [ ] Visual regression tested
- [ ] All documented

---

## 🚀 Let's Start!

**Current Focus:** Day 11-12 - Web Test Agent

Starting implementation now...
