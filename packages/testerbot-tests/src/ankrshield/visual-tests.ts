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
  },

  {
    id: 'ankrshield-visual-004',
    name: 'Dark mode appearance',
    description: 'Verify dark mode visual consistency',
    type: 'visual',
    app: 'ankrshield-web',
    tags: ['visual', 'ui', 'dark-mode', 'theme'],
    fn: async (agent: WebTestAgent) => {
      // Try to enable dark mode
      const darkModeToggle = await agent.isElementVisible('[data-theme-toggle], button:has-text("Dark"), .theme-toggle');

      if (darkModeToggle) {
        await agent.click('[data-theme-toggle], button:has-text("Dark"), .theme-toggle');
        await agent.wait(1000); // Wait for theme transition
      } else {
        console.warn('Dark mode toggle not found - skipping dark mode test');
        return;
      }

      // Take screenshot
      const screenshotPath = await agent.takeVisualSnapshot('dark-mode');

      // Check if baseline exists
      if (!visualRegression.hasBaseline('dark-mode', 'web')) {
        visualRegression.saveBaseline('dark-mode', screenshotPath, 'web');
        console.log('✓ Baseline created for dark mode');
        return;
      }

      // Compare against baseline
      const result = await visualRegression.compare('dark-mode', screenshotPath, 'web');

      if (!result.matches) {
        throw new Error(
          `Visual regression detected in dark mode:\n` +
          `  - ${result.diffPercentage.toFixed(2)}% of pixels changed (${result.diffPixels} pixels)\n` +
          `  - Diff image: ${result.diffImagePath}`
        );
      }

      console.log(`✓ Dark mode visual match: ${result.diffPercentage.toFixed(4)}% difference`);
    }
  },

  {
    id: 'ankrshield-visual-005',
    name: 'Mobile responsive layout',
    description: 'Verify mobile responsive design consistency',
    type: 'visual',
    app: 'ankrshield-web',
    tags: ['visual', 'ui', 'responsive', 'mobile'],
    fn: async (agent: WebTestAgent) => {
      // Set mobile viewport
      await agent.setViewport(375, 667); // iPhone SE size
      await agent.wait(1000); // Wait for responsive layout

      // Take screenshot
      const screenshotPath = await agent.takeVisualSnapshot('mobile-responsive');

      // Check if baseline exists
      if (!visualRegression.hasBaseline('mobile-responsive', 'web')) {
        visualRegression.saveBaseline('mobile-responsive', screenshotPath, 'web');
        console.log('✓ Baseline created for mobile responsive layout');
        return;
      }

      // Compare against baseline
      const result = await visualRegression.compare('mobile-responsive', screenshotPath, 'web');

      if (!result.matches) {
        throw new Error(
          `Visual regression detected in mobile layout:\n` +
          `  - ${result.diffPercentage.toFixed(2)}% of pixels changed (${result.diffPixels} pixels)\n` +
          `  - Diff image: ${result.diffImagePath}`
        );
      }

      console.log(`✓ Mobile layout visual match: ${result.diffPercentage.toFixed(4)}% difference`);

      // Reset viewport
      await agent.setViewport(1280, 720);
    }
  },

  {
    id: 'ankrshield-visual-006',
    name: 'Tablet responsive layout',
    description: 'Verify tablet responsive design consistency',
    type: 'visual',
    app: 'ankrshield-web',
    tags: ['visual', 'ui', 'responsive', 'tablet'],
    fn: async (agent: WebTestAgent) => {
      // Set tablet viewport
      await agent.setViewport(768, 1024); // iPad size
      await agent.wait(1000); // Wait for responsive layout

      // Take screenshot
      const screenshotPath = await agent.takeVisualSnapshot('tablet-responsive');

      // Check if baseline exists
      if (!visualRegression.hasBaseline('tablet-responsive', 'web')) {
        visualRegression.saveBaseline('tablet-responsive', screenshotPath, 'web');
        console.log('✓ Baseline created for tablet responsive layout');
        return;
      }

      // Compare against baseline
      const result = await visualRegression.compare('tablet-responsive', screenshotPath, 'web');

      if (!result.matches) {
        throw new Error(
          `Visual regression detected in tablet layout:\n` +
          `  - ${result.diffPercentage.toFixed(2)}% of pixels changed (${result.diffPixels} pixels)\n` +
          `  - Diff image: ${result.diffImagePath}`
        );
      }

      console.log(`✓ Tablet layout visual match: ${result.diffPercentage.toFixed(4)}% difference`);

      // Reset viewport
      await agent.setViewport(1280, 720);
    }
  },

  {
    id: 'ankrshield-visual-007',
    name: 'Settings page appearance',
    description: 'Verify settings page visual consistency',
    type: 'visual',
    app: 'ankrshield-web',
    tags: ['visual', 'ui', 'settings'],
    fn: async (agent: WebTestAgent) => {
      // Navigate to settings
      try {
        await agent.navigate('/settings');
      } catch {
        // Try clicking settings link
        const settingsLink = await agent.isElementVisible('a[href="/settings"], a:has-text("Settings")');
        if (settingsLink) {
          await agent.click('a[href="/settings"], a:has-text("Settings")');
        }
      }

      await agent.wait(1500);

      // Take screenshot
      const screenshotPath = await agent.takeVisualSnapshot('settings-page');

      // Check if baseline exists
      if (!visualRegression.hasBaseline('settings-page', 'web')) {
        visualRegression.saveBaseline('settings-page', screenshotPath, 'web');
        console.log('✓ Baseline created for settings page');
        return;
      }

      // Compare against baseline
      const result = await visualRegression.compare('settings-page', screenshotPath, 'web');

      if (!result.matches) {
        throw new Error(
          `Visual regression detected in settings page:\n` +
          `  - ${result.diffPercentage.toFixed(2)}% of pixels changed (${result.diffPixels} pixels)\n` +
          `  - Diff image: ${result.diffImagePath}`
        );
      }

      console.log(`✓ Settings page visual match: ${result.diffPercentage.toFixed(4)}% difference`);
    }
  },

  {
    id: 'ankrshield-visual-008',
    name: 'Form elements appearance',
    description: 'Verify form input and control visual consistency',
    type: 'visual',
    app: 'ankrshield-web',
    tags: ['visual', 'ui', 'forms', 'component'],
    fn: async (agent: WebTestAgent) => {
      // Navigate to page with forms (settings or similar)
      try {
        await agent.navigate('/settings');
      } catch {
        // Stay on current page
      }

      await agent.wait(1000);

      // Check if forms exist
      const formsExist = await agent.isElementVisible('input, select, textarea, button');

      if (!formsExist) {
        console.warn('No form elements found - skipping form visual test');
        return;
      }

      // Take screenshot
      const screenshotPath = await agent.takeVisualSnapshot('form-elements');

      // Check if baseline exists
      if (!visualRegression.hasBaseline('form-elements', 'web')) {
        visualRegression.saveBaseline('form-elements', screenshotPath, 'web');
        console.log('✓ Baseline created for form elements');
        return;
      }

      // Compare against baseline
      const result = await visualRegression.compare('form-elements', screenshotPath, 'web');

      if (!result.matches) {
        throw new Error(
          `Visual regression detected in form elements:\n` +
          `  - ${result.diffPercentage.toFixed(2)}% of pixels changed (${result.diffPixels} pixels)\n` +
          `  - Diff image: ${result.diffImagePath}`
        );
      }

      console.log(`✓ Form elements visual match: ${result.diffPercentage.toFixed(4)}% difference`);
    }
  }
];
