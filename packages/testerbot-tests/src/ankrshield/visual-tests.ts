/**
 * ankrshield Visual Regression Tests
 * Screenshot comparison tests to detect UI changes
 */

import { Test } from '@ankr/testerbot-core';
import { WebTestAgent, VisualRegression } from '@ankr/testerbot-agents';
import * as path from 'path';

// Visual regression utility
const visualRegression = new VisualRegression({
  baselineDir: path.join(process.cwd(), 'test-results', 'visual-baselines'),
  diffDir: path.join(process.cwd(), 'test-results', 'visual-diffs'),
  threshold: 0.1,
  failureThreshold: 0.1
});

export const ankrshieldVisualTests: Test[] = [
  {
    id: 'ankrshield-visual-001',
    name: 'Landing page visual regression',
    description: 'Compare landing page screenshot against baseline',
    type: 'visual',
    app: 'ankrshield-web',
    tags: ['visual', 'ui', 'landing'],
    fn: async (agent: WebTestAgent) => {
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
        throw new Error(
          `Visual regression detected: ${result.diffPercentage.toFixed(2)}% of pixels changed ` +
          `(${result.diffPixels} pixels). Diff image: ${result.diffImagePath}`
        );
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
    fn: async (agent: WebTestAgent) => {
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
        throw new Error(
          `Visual regression detected: ${result.diffPercentage.toFixed(2)}% of pixels changed ` +
          `(${result.diffPixels} pixels). Diff image: ${result.diffImagePath}`
        );
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
    fn: async (agent: WebTestAgent) => {
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
        throw new Error(
          `Visual regression detected: ${result.diffPercentage.toFixed(2)}% of pixels changed ` +
          `(${result.diffPixels} pixels). Diff image: ${result.diffImagePath}`
        );
      }

      console.log(`✓ Visual match: ${result.diffPercentage.toFixed(4)}% difference`);
    }
  }
];
