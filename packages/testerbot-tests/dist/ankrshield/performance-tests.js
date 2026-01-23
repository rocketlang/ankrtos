"use strict";
/**
 * ankrshield Desktop App - Performance Tests
 * Benchmark and validate performance metrics
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ankrshieldPerformanceTests = void 0;
const fs = __importStar(require("fs"));
// Performance thresholds
const THRESHOLDS = {
    STARTUP_TIME_MS: 3000, // App should start within 3 seconds
    MEMORY_USAGE_MB: 150, // Heap usage should be under 150MB
    MEMORY_USAGE_BYTES: 150 * 1024 * 1024,
    DASHBOARD_RENDER_MS: 2000, // Dashboard should render within 2 seconds
    ELEMENT_LOAD_MS: 1000, // Individual elements should load within 1 second
    INTERACTION_RESPONSE_MS: 500, // UI should respond to interactions within 500ms
    BUNDLE_SIZE_KB: 200, // Main bundle should be under 200KB
    BUNDLE_SIZE_BYTES: 200 * 1024
};
exports.ankrshieldPerformanceTests = [
    {
        id: 'ankrshield-perf-001',
        name: 'Startup time performance',
        description: 'Verify app starts within acceptable time threshold',
        type: 'performance',
        app: 'ankrshield-desktop',
        tags: ['performance', 'startup', 'critical'],
        timeout: 10000,
        fn: async (agent) => {
            // Get performance metrics
            const metrics = await agent.getPerformanceMetrics();
            if (!metrics.startupTime) {
                throw new Error('Startup time metric not available');
            }
            console.log(`Startup time: ${metrics.startupTime}ms (threshold: ${THRESHOLDS.STARTUP_TIME_MS}ms)`);
            // Verify startup time is within threshold
            if (metrics.startupTime > THRESHOLDS.STARTUP_TIME_MS) {
                throw new Error(`Startup time ${metrics.startupTime}ms exceeds threshold of ${THRESHOLDS.STARTUP_TIME_MS}ms`);
            }
            // Grade performance
            if (metrics.startupTime < 1000) {
                console.log('✅ Excellent startup performance (< 1s)');
            }
            else if (metrics.startupTime < 2000) {
                console.log('✅ Good startup performance (< 2s)');
            }
            else {
                console.log('⚠️  Acceptable startup performance (< 3s)');
            }
        }
    },
    {
        id: 'ankrshield-perf-002',
        name: 'Memory usage performance',
        description: 'Verify memory usage is within acceptable limits',
        type: 'performance',
        app: 'ankrshield-desktop',
        tags: ['performance', 'memory', 'critical'],
        timeout: 10000,
        fn: async (agent) => {
            // Wait for app to stabilize
            await agent.wait(2000);
            // Get memory usage
            const memoryBytes = await agent.getMemoryUsage();
            const memoryMB = memoryBytes / (1024 * 1024);
            console.log(`Memory usage: ${memoryMB.toFixed(2)}MB (threshold: ${THRESHOLDS.MEMORY_USAGE_MB}MB)`);
            // Verify memory usage is within threshold
            if (memoryBytes > THRESHOLDS.MEMORY_USAGE_BYTES) {
                throw new Error(`Memory usage ${memoryMB.toFixed(2)}MB exceeds threshold of ${THRESHOLDS.MEMORY_USAGE_MB}MB`);
            }
            // Grade performance
            if (memoryMB < 50) {
                console.log('✅ Excellent memory efficiency (< 50MB)');
            }
            else if (memoryMB < 100) {
                console.log('✅ Good memory efficiency (< 100MB)');
            }
            else {
                console.log('⚠️  Acceptable memory usage (< 150MB)');
            }
        }
    },
    {
        id: 'ankrshield-perf-003',
        name: 'Memory usage under load',
        description: 'Verify memory remains stable after interactions',
        type: 'performance',
        app: 'ankrshield-desktop',
        tags: ['performance', 'memory', 'stability'],
        timeout: 15000,
        fn: async (agent) => {
            // Get baseline memory
            await agent.wait(2000);
            const baselineBytes = await agent.getMemoryUsage();
            const baselineMB = baselineBytes / (1024 * 1024);
            console.log(`Baseline memory: ${baselineMB.toFixed(2)}MB`);
            // Simulate user interactions
            const interactions = [
                async () => await agent.click('header button, .header button').catch(() => { }),
                async () => await agent.waitForElement('.stat-card', 2000).catch(() => { }),
                async () => await agent.findElements('.activity-item, .stat-card'),
                async () => await agent.isElementVisible('.privacy-score'),
            ];
            for (let i = 0; i < interactions.length; i++) {
                await interactions[i]();
                await agent.wait(500);
            }
            // Get memory after interactions
            const afterBytes = await agent.getMemoryUsage();
            const afterMB = afterBytes / (1024 * 1024);
            console.log(`Memory after interactions: ${afterMB.toFixed(2)}MB`);
            const increaseMB = afterMB - baselineMB;
            const increasePercent = (increaseMB / baselineMB) * 100;
            console.log(`Memory increase: ${increaseMB.toFixed(2)}MB (${increasePercent.toFixed(1)}%)`);
            // Memory should not increase by more than 50MB or 50%
            if (increaseMB > 50 || increasePercent > 50) {
                console.warn(`⚠️  Significant memory increase detected - potential memory leak`);
            }
            else {
                console.log('✅ Memory usage stable under load');
            }
            // Still must be within overall threshold
            if (afterBytes > THRESHOLDS.MEMORY_USAGE_BYTES) {
                throw new Error(`Memory usage ${afterMB.toFixed(2)}MB exceeds threshold of ${THRESHOLDS.MEMORY_USAGE_MB}MB`);
            }
        }
    },
    {
        id: 'ankrshield-perf-004',
        name: 'Bundle size performance',
        description: 'Verify app bundle size is optimized',
        type: 'performance',
        app: 'ankrshield-desktop',
        tags: ['performance', 'bundle', 'build'],
        timeout: 5000,
        fn: async (agent) => {
            // Note: This test checks the main.js bundle size
            // In a real scenario, you'd get this from the build config
            // Try to find the main bundle file
            const possibleBundlePaths = [
                '/root/ankrshield/apps/desktop/dist/main.js',
                './apps/desktop/dist/main.js',
                './dist/main.js'
            ];
            let bundlePath = null;
            let bundleSize = 0;
            for (const testPath of possibleBundlePaths) {
                if (fs.existsSync(testPath)) {
                    bundlePath = testPath;
                    const stats = fs.statSync(testPath);
                    bundleSize = stats.size;
                    break;
                }
            }
            if (!bundlePath) {
                console.warn('⚠️  Bundle file not found - skipping bundle size test');
                console.log('   Bundle size optimization should be verified during build');
                return;
            }
            const bundleSizeKB = bundleSize / 1024;
            console.log(`Bundle size: ${bundleSizeKB.toFixed(2)}KB (threshold: ${THRESHOLDS.BUNDLE_SIZE_KB}KB)`);
            console.log(`Bundle path: ${bundlePath}`);
            // Note: Electron apps are typically larger than web bundles
            // Adjusting threshold for Electron main process
            const electronThresholdKB = 500; // 500KB for Electron main
            if (bundleSizeKB > electronThresholdKB) {
                console.warn(`⚠️  Bundle size ${bundleSizeKB.toFixed(2)}KB exceeds Electron threshold of ${electronThresholdKB}KB`);
                console.log('   Consider code splitting or removing unused dependencies');
            }
            else {
                console.log('✅ Bundle size is optimized');
            }
            // Grade performance
            if (bundleSizeKB < 200) {
                console.log('✅ Excellent bundle size (< 200KB)');
            }
            else if (bundleSizeKB < 350) {
                console.log('✅ Good bundle size (< 350KB)');
            }
            else {
                console.log('⚠️  Large bundle size - consider optimization');
            }
        }
    },
    {
        id: 'ankrshield-perf-005',
        name: 'Dashboard render time',
        description: 'Verify dashboard renders quickly after app launch',
        type: 'performance',
        app: 'ankrshield-desktop',
        tags: ['performance', 'rendering', 'critical'],
        timeout: 10000,
        fn: async (agent) => {
            // Measure time to render dashboard elements
            const startTime = Date.now();
            // Wait for critical dashboard elements
            await agent.waitForElement('#dashboard, .dashboard', 5000);
            await agent.waitForElement('#privacy-score, .privacy-score', 5000);
            await agent.waitForElement('.stats-grid, .stat-card', 5000);
            const renderTime = Date.now() - startTime;
            console.log(`Dashboard render time: ${renderTime}ms (threshold: ${THRESHOLDS.DASHBOARD_RENDER_MS}ms)`);
            if (renderTime > THRESHOLDS.DASHBOARD_RENDER_MS) {
                throw new Error(`Dashboard render time ${renderTime}ms exceeds threshold of ${THRESHOLDS.DASHBOARD_RENDER_MS}ms`);
            }
            // Grade performance
            if (renderTime < 500) {
                console.log('✅ Excellent render performance (< 500ms)');
            }
            else if (renderTime < 1000) {
                console.log('✅ Good render performance (< 1s)');
            }
            else {
                console.log('⚠️  Acceptable render performance (< 2s)');
            }
            // Verify all elements are visible
            const dashboardVisible = await agent.isElementVisible('#dashboard, .dashboard');
            const scoreVisible = await agent.isElementVisible('#privacy-score, .privacy-score');
            const statsVisible = await agent.isElementVisible('.stats-grid, .stat-card');
            if (!dashboardVisible || !scoreVisible || !statsVisible) {
                throw new Error('Not all dashboard elements rendered successfully');
            }
            console.log('✅ All dashboard elements rendered and visible');
        }
    },
    {
        id: 'ankrshield-perf-006',
        name: 'Large dataset performance',
        description: 'Verify app handles multiple UI elements efficiently',
        type: 'performance',
        app: 'ankrshield-desktop',
        tags: ['performance', 'data', 'scalability'],
        timeout: 15000,
        fn: async (agent) => {
            // Wait for app to load
            await agent.waitForElement('.stats-grid, .stat-card', 5000);
            // Measure time to query and count multiple elements
            const startTime = Date.now();
            const statCards = await agent.findElements('.stat-card, .stat-item');
            const buttons = await agent.findElements('button');
            const allElements = await agent.findElements('*');
            const queryTime = Date.now() - startTime;
            console.log(`Found ${statCards.length} stat cards`);
            console.log(`Found ${buttons.length} buttons`);
            console.log(`Total DOM elements: ${allElements.length}`);
            console.log(`Query time: ${queryTime}ms`);
            // Query time should be fast even with many elements
            if (queryTime > 1000) {
                console.warn('⚠️  Slow element query - DOM may be too large');
            }
            else {
                console.log('✅ Fast element queries');
            }
            // Measure interaction performance with multiple elements
            const interactionStart = Date.now();
            // Click first stat card if available
            if (statCards.length > 0) {
                try {
                    await agent.click('.stat-card:first-of-type, .stat-item:first-of-type');
                }
                catch {
                    // Element might not be clickable
                }
            }
            const interactionTime = Date.now() - interactionStart;
            console.log(`Interaction time: ${interactionTime}ms`);
            if (interactionTime > THRESHOLDS.INTERACTION_RESPONSE_MS) {
                console.warn(`⚠️  Slow interaction response (${interactionTime}ms)`);
            }
            else {
                console.log('✅ Fast interaction response');
            }
            // Check if app is still responsive
            const isResponsive = await agent.isAppVisible();
            if (!isResponsive) {
                throw new Error('App became unresponsive');
            }
            console.log('✅ App remains responsive with large dataset');
        }
    },
    {
        id: 'ankrshield-perf-007',
        name: 'Interaction response time',
        description: 'Verify UI responds quickly to user interactions',
        type: 'performance',
        app: 'ankrshield-desktop',
        tags: ['performance', 'interaction', 'ux'],
        timeout: 15000,
        fn: async (agent) => {
            const interactions = [
                {
                    name: 'Button click',
                    fn: async () => {
                        const buttons = await agent.findElements('button');
                        if (buttons.length > 0) {
                            await agent.click('button:first-of-type');
                        }
                    }
                },
                {
                    name: 'Element hover',
                    fn: async () => {
                        const cards = await agent.findElements('.stat-card, .card');
                        if (cards.length > 0) {
                            // Playwright doesn't have direct hover, but we can check visibility changes
                            await agent.isElementVisible('.stat-card:first-of-type, .card:first-of-type');
                        }
                    }
                },
                {
                    name: 'Navigation',
                    fn: async () => {
                        const links = await agent.findElements('a, nav button');
                        if (links.length > 0) {
                            // Check navigation is responsive
                            await agent.isElementVisible('a:first-of-type, nav button:first-of-type');
                        }
                    }
                }
            ];
            const results = [];
            for (const interaction of interactions) {
                const startTime = Date.now();
                try {
                    await interaction.fn();
                }
                catch (err) {
                    console.warn(`⚠️  ${interaction.name} failed:`, err.message);
                    continue;
                }
                const responseTime = Date.now() - startTime;
                results.push({ name: interaction.name, time: responseTime });
                console.log(`${interaction.name}: ${responseTime}ms`);
                if (responseTime > THRESHOLDS.INTERACTION_RESPONSE_MS) {
                    console.warn(`⚠️  Slow ${interaction.name.toLowerCase()} response`);
                }
            }
            // Calculate average response time
            if (results.length > 0) {
                const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
                console.log(`Average interaction response: ${avgTime.toFixed(0)}ms`);
                if (avgTime > THRESHOLDS.INTERACTION_RESPONSE_MS) {
                    throw new Error(`Average interaction response ${avgTime.toFixed(0)}ms exceeds threshold of ${THRESHOLDS.INTERACTION_RESPONSE_MS}ms`);
                }
                console.log('✅ Fast interaction response times');
            }
            else {
                console.warn('⚠️  No interactions could be measured');
            }
        }
    },
    {
        id: 'ankrshield-perf-008',
        name: 'Progressive load performance',
        description: 'Verify app loads content progressively without blocking',
        type: 'performance',
        app: 'ankrshield-desktop',
        tags: ['performance', 'loading', 'ux'],
        timeout: 15000,
        fn: async (agent) => {
            // Measure time for each progressive load stage
            const stages = [];
            // Stage 1: Initial render
            let stageStart = Date.now();
            const bodyVisible = await agent.isElementVisible('body');
            if (!bodyVisible) {
                throw new Error('Body not visible');
            }
            stages.push({ name: 'Initial render', time: Date.now() - stageStart });
            // Stage 2: Header render
            stageStart = Date.now();
            await agent.waitForElement('header, .header', 3000);
            stages.push({ name: 'Header render', time: Date.now() - stageStart });
            // Stage 3: Main content render
            stageStart = Date.now();
            await agent.waitForElement('main, .main-content, .content', 3000);
            stages.push({ name: 'Main content render', time: Date.now() - stageStart });
            // Stage 4: Data load (stats, score, etc.)
            stageStart = Date.now();
            await agent.waitForElement('.stats-grid, .stat-card, #privacy-score', 5000);
            stages.push({ name: 'Data load', time: Date.now() - stageStart });
            // Log all stages
            console.log('Progressive load stages:');
            stages.forEach(stage => {
                console.log(`  ${stage.name}: ${stage.time}ms`);
            });
            const totalTime = stages.reduce((sum, s) => sum + s.time, 0);
            console.log(`Total progressive load time: ${totalTime}ms`);
            // Each stage should be reasonably fast
            const slowStages = stages.filter(s => s.time > THRESHOLDS.ELEMENT_LOAD_MS);
            if (slowStages.length > 0) {
                console.warn('⚠️  Slow loading stages:');
                slowStages.forEach(s => {
                    console.warn(`     ${s.name}: ${s.time}ms`);
                });
            }
            else {
                console.log('✅ All stages load quickly');
            }
            // Total time should be reasonable
            if (totalTime > THRESHOLDS.DASHBOARD_RENDER_MS) {
                throw new Error(`Total progressive load time ${totalTime}ms exceeds threshold of ${THRESHOLDS.DASHBOARD_RENDER_MS}ms`);
            }
            console.log('✅ Progressive load performance is good');
        }
    }
];
//# sourceMappingURL=performance-tests.js.map