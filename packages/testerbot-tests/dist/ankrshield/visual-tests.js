"use strict";
/**
 * ankrshield Visual Regression Tests
 * Screenshot comparison tests to detect UI changes
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
exports.ankrshieldVisualTests = void 0;
const testerbot_agents_1 = require("@ankr/testerbot-agents");
const path = __importStar(require("path"));
// Visual regression utility
const visualRegression = new testerbot_agents_1.VisualRegression({
    baselineDir: path.join(process.cwd(), 'test-results', 'visual-baselines'),
    diffDir: path.join(process.cwd(), 'test-results', 'visual-diffs'),
    threshold: 0.1,
    failureThreshold: 0.1
});
exports.ankrshieldVisualTests = [
    {
        id: 'ankrshield-visual-001',
        name: 'Landing page visual regression',
        description: 'Compare landing page screenshot against baseline',
        type: 'visual',
        app: 'ankrshield-web',
        tags: ['visual', 'ui', 'landing'],
        fn: async (agent) => {
            // Take screenshot
            const screenshotPath = await agent.takeVisualSnapshot('landing-page');
            // Check if baseline exists
            if (!visualRegression.hasBaseline('landing-page', 'web')) {
                // First run - save baseline
                visualRegression.saveBaseline('landing-page', screenshotPath, 'web');
                console.log('✓ Baseline created for landing page');
                return;
            }
            // Compare against baseline
            const result = await visualRegression.compare('landing-page', screenshotPath, 'web');
            if (!result.matches) {
                throw new Error(`Visual regression detected: ${result.diffPercentage.toFixed(2)}% of pixels changed ` +
                    `(${result.diffPixels} pixels). Diff image: ${result.diffImagePath}`);
            }
            console.log(`✓ Visual match: ${result.diffPercentage.toFixed(4)}% difference`);
        }
    },
    {
        id: 'ankrshield-visual-002',
        name: 'Dashboard visual regression',
        description: 'Compare dashboard screenshot against baseline',
        type: 'visual',
        app: 'ankrshield-web',
        tags: ['visual', 'ui', 'dashboard'],
        fn: async (agent) => {
            // Navigate to dashboard (if needed)
            await agent.navigate('/dashboard');
            await agent.wait(1000); // Wait for render
            // Take screenshot
            const screenshotPath = await agent.takeVisualSnapshot('dashboard');
            // Check if baseline exists
            if (!visualRegression.hasBaseline('dashboard', 'web')) {
                visualRegression.saveBaseline('dashboard', screenshotPath, 'web');
                console.log('✓ Baseline created for dashboard');
                return;
            }
            // Compare against baseline
            const result = await visualRegression.compare('dashboard', screenshotPath, 'web');
            if (!result.matches) {
                throw new Error(`Visual regression detected: ${result.diffPercentage.toFixed(2)}% of pixels changed ` +
                    `(${result.diffPixels} pixels). Diff image: ${result.diffImagePath}`);
            }
            console.log(`✓ Visual match: ${result.diffPercentage.toFixed(4)}% difference`);
        }
    },
    {
        id: 'ankrshield-visual-003',
        name: 'Button component visual regression',
        description: 'Compare button component screenshot against baseline',
        type: 'visual',
        app: 'ankrshield-web',
        tags: ['visual', 'ui', 'component'],
        fn: async (agent) => {
            // Find button element
            await agent.waitForElement('button.primary', 5000);
            // Take screenshot of specific element
            const screenshotPath = await agent.takeScreenshot('button-component');
            // Check if baseline exists
            if (!visualRegression.hasBaseline('button-component', 'web')) {
                visualRegression.saveBaseline('button-component', screenshotPath, 'web');
                console.log('✓ Baseline created for button component');
                return;
            }
            // Compare against baseline
            const result = await visualRegression.compare('button-component', screenshotPath, 'web');
            if (!result.matches) {
                throw new Error(`Visual regression detected: ${result.diffPercentage.toFixed(2)}% of pixels changed ` +
                    `(${result.diffPixels} pixels). Diff image: ${result.diffImagePath}`);
            }
            console.log(`✓ Visual match: ${result.diffPercentage.toFixed(4)}% difference`);
        }
    }
];
//# sourceMappingURL=visual-tests.js.map