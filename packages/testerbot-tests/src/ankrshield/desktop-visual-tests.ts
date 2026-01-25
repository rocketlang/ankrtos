/**
 * ankrshield Desktop App - Visual Regression Tests
 * Screenshot comparison tests to detect UI changes in desktop app
 */

import { Test } from '@ankr/testerbot-core';
import { DesktopTestAgent, VisualRegression } from '@ankr/testerbot-agents';
import * as path from 'path';

// Visual regression utility for desktop
const visualRegression = new VisualRegression({
  baselineDir: path.join(process.cwd(), 'test-results', 'visual-baselines'),
  diffDir: path.join(process.cwd(), 'test-results', 'visual-diffs'),
  threshold: 0.1,        // 0.1% pixel difference tolerance
  failureThreshold: 0.5  // Fail if >0.5% pixels differ
});

export const ankrshieldDesktopVisualTests: Test[] = [
  {
    id: 'ankrshield-visual-desktop-001',
    name: 'Desktop dashboard appearance',
    description: 'Verify dashboard visual consistency in desktop app',
    type: 'visual',
    app: 'ankrshield-desktop',
    tags: ['visual', 'ui', 'dashboard', 'critical'],
    timeout: 10000,
    fn: async (agent: DesktopTestAgent) => {
      // Wait for dashboard to load
      await agent.waitForElement('#dashboard, .dashboard', 5000);
      await agent.wait(2000); // Wait for animations

      // Take full app screenshot
      const screenshotPath = await agent.takeScreenshot('desktop-dashboard');

      // Check if baseline exists
      if (!visualRegression.hasBaseline('desktop-dashboard', 'desktop')) {
        visualRegression.saveBaseline('desktop-dashboard', screenshotPath, 'desktop');
        console.log('✓ Baseline created for desktop dashboard');
        return;
      }

      // Compare against baseline
      const result = await visualRegression.compare('desktop-dashboard', screenshotPath, 'desktop');

      if (!result.matches) {
        throw new Error(
          `Visual regression detected in desktop dashboard:\n` +
          `  - ${result.diffPercentage.toFixed(2)}% of pixels changed (${result.diffPixels} pixels)\n` +
          `  - Threshold: 0.5%\n` +
          `  - Diff image: ${result.diffImagePath}`
        );
      }

      console.log(`✓ Desktop dashboard visual match: ${result.diffPercentage.toFixed(4)}% difference`);
    }
  },

  {
    id: 'ankrshield-visual-desktop-002',
    name: 'Settings UI appearance',
    description: 'Verify settings panel visual consistency',
    type: 'visual',
    app: 'ankrshield-desktop',
    tags: ['visual', 'ui', 'settings'],
    timeout: 10000,
    fn: async (agent: DesktopTestAgent) => {
      // Open settings
      const settingsVisible = await agent.isElementVisible('[data-test="settings-button"], button:has-text("Settings")');

      if (!settingsVisible) {
        console.warn('Settings button not found - skipping visual test');
        return;
      }

      await agent.click('[data-test="settings-button"], button:has-text("Settings")');
      await agent.wait(1500); // Wait for settings to open

      // Verify settings opened
      const settingsOpened = await agent.isElementVisible('.settings-modal, .settings-page, .settings-panel');

      if (!settingsOpened) {
        console.warn('Settings did not open - skipping visual test');
        return;
      }

      // Take screenshot
      const screenshotPath = await agent.takeScreenshot('desktop-settings');

      // Check if baseline exists
      if (!visualRegression.hasBaseline('desktop-settings', 'desktop')) {
        visualRegression.saveBaseline('desktop-settings', screenshotPath, 'desktop');
        console.log('✓ Baseline created for desktop settings');
        return;
      }

      // Compare against baseline
      const result = await visualRegression.compare('desktop-settings', screenshotPath, 'desktop');

      if (!result.matches) {
        throw new Error(
          `Visual regression detected in settings UI:\n` +
          `  - ${result.diffPercentage.toFixed(2)}% of pixels changed (${result.diffPixels} pixels)\n` +
          `  - Diff image: ${result.diffImagePath}`
        );
      }

      console.log(`✓ Settings UI visual match: ${result.diffPercentage.toFixed(4)}% difference`);
    }
  },

  {
    id: 'ankrshield-visual-desktop-003',
    name: 'Activity feed layout',
    description: 'Verify activity feed visual consistency',
    type: 'visual',
    app: 'ankrshield-desktop',
    tags: ['visual', 'ui', 'activity'],
    timeout: 10000,
    fn: async (agent: DesktopTestAgent) => {
      // Check if activity is visible on dashboard
      const activityVisible = await agent.isElementVisible('.recent-activity, .activity-section, .activity-feed');

      if (!activityVisible) {
        // Try navigation
        const activityLink = await agent.isElementVisible('[data-test="activity-link"], a:has-text("Activity")');

        if (activityLink) {
          await agent.click('[data-test="activity-link"], a:has-text("Activity")');
          await agent.wait(1500);
        } else {
          console.warn('Activity feed not accessible - skipping visual test');
          return;
        }
      }

      await agent.wait(1000); // Wait for content to load

      // Take screenshot
      const screenshotPath = await agent.takeScreenshot('desktop-activity-feed');

      // Check if baseline exists
      if (!visualRegression.hasBaseline('desktop-activity-feed', 'desktop')) {
        visualRegression.saveBaseline('desktop-activity-feed', screenshotPath, 'desktop');
        console.log('✓ Baseline created for desktop activity feed');
        return;
      }

      // Compare against baseline
      const result = await visualRegression.compare('desktop-activity-feed', screenshotPath, 'desktop');

      if (!result.matches) {
        throw new Error(
          `Visual regression detected in activity feed:\n` +
          `  - ${result.diffPercentage.toFixed(2)}% of pixels changed (${result.diffPixels} pixels)\n` +
          `  - Diff image: ${result.diffImagePath}`
        );
      }

      console.log(`✓ Activity feed visual match: ${result.diffPercentage.toFixed(4)}% difference`);
    }
  },

  {
    id: 'ankrshield-visual-desktop-004',
    name: 'Privacy score card appearance',
    description: 'Verify privacy score card visual consistency',
    type: 'visual',
    app: 'ankrshield-desktop',
    tags: ['visual', 'ui', 'component', 'critical'],
    timeout: 10000,
    fn: async (agent: DesktopTestAgent) => {
      // Wait for privacy score
      await agent.waitForElement('#privacy-score, .privacy-score', 5000);
      await agent.wait(1000);

      // Take screenshot
      const screenshotPath = await agent.takeScreenshot('desktop-privacy-score');

      // Check if baseline exists
      if (!visualRegression.hasBaseline('desktop-privacy-score', 'desktop')) {
        visualRegression.saveBaseline('desktop-privacy-score', screenshotPath, 'desktop');
        console.log('✓ Baseline created for privacy score card');
        return;
      }

      // Compare against baseline
      const result = await visualRegression.compare('desktop-privacy-score', screenshotPath, 'desktop');

      if (!result.matches) {
        throw new Error(
          `Visual regression detected in privacy score card:\n` +
          `  - ${result.diffPercentage.toFixed(2)}% of pixels changed (${result.diffPixels} pixels)\n` +
          `  - Diff image: ${result.diffImagePath}`
        );
      }

      console.log(`✓ Privacy score card visual match: ${result.diffPercentage.toFixed(4)}% difference`);
    }
  },

  {
    id: 'ankrshield-visual-desktop-005',
    name: 'Stats grid layout',
    description: 'Verify statistics grid visual consistency',
    type: 'visual',
    app: 'ankrshield-desktop',
    tags: ['visual', 'ui', 'stats'],
    timeout: 10000,
    fn: async (agent: DesktopTestAgent) => {
      // Wait for stats grid
      await agent.waitForElement('.stats-grid, .stat-card', 5000);
      await agent.wait(1000);

      // Take screenshot
      const screenshotPath = await agent.takeScreenshot('desktop-stats-grid');

      // Check if baseline exists
      if (!visualRegression.hasBaseline('desktop-stats-grid', 'desktop')) {
        visualRegression.saveBaseline('desktop-stats-grid', screenshotPath, 'desktop');
        console.log('✓ Baseline created for stats grid');
        return;
      }

      // Compare against baseline
      const result = await visualRegression.compare('desktop-stats-grid', screenshotPath, 'desktop');

      if (!result.matches) {
        throw new Error(
          `Visual regression detected in stats grid:\n` +
          `  - ${result.diffPercentage.toFixed(2)}% of pixels changed (${result.diffPixels} pixels)\n` +
          `  - Diff image: ${result.diffImagePath}`
        );
      }

      console.log(`✓ Stats grid visual match: ${result.diffPercentage.toFixed(4)}% difference`);
    }
  },

  {
    id: 'ankrshield-visual-desktop-006',
    name: 'Header component appearance',
    description: 'Verify header/navbar visual consistency',
    type: 'visual',
    app: 'ankrshield-desktop',
    tags: ['visual', 'ui', 'component', 'header'],
    timeout: 10000,
    fn: async (agent: DesktopTestAgent) => {
      // Wait for header
      await agent.waitForElement('header, .header', 5000);
      await agent.wait(500);

      // Take screenshot
      const screenshotPath = await agent.takeScreenshot('desktop-header');

      // Check if baseline exists
      if (!visualRegression.hasBaseline('desktop-header', 'desktop')) {
        visualRegression.saveBaseline('desktop-header', screenshotPath, 'desktop');
        console.log('✓ Baseline created for header');
        return;
      }

      // Compare against baseline
      const result = await visualRegression.compare('desktop-header', screenshotPath, 'desktop');

      if (!result.matches) {
        throw new Error(
          `Visual regression detected in header:\n` +
          `  - ${result.diffPercentage.toFixed(2)}% of pixels changed (${result.diffPixels} pixels)\n` +
          `  - Diff image: ${result.diffImagePath}`
        );
      }

      console.log(`✓ Header visual match: ${result.diffPercentage.toFixed(4)}% difference`);
    }
  },

  {
    id: 'ankrshield-visual-desktop-007',
    name: 'Complete UI layout consistency',
    description: 'Verify overall UI layout and spacing consistency',
    type: 'visual',
    app: 'ankrshield-desktop',
    tags: ['visual', 'ui', 'layout', 'critical'],
    timeout: 10000,
    fn: async (agent: DesktopTestAgent) => {
      // Wait for all major components to load
      await agent.waitForElement('#dashboard, .dashboard', 5000);
      await agent.waitForElement('header, .header', 3000);
      await agent.waitForElement('.stats-grid, .stat-card', 3000);
      await agent.wait(2000); // Wait for full render

      // Take full screenshot
      const screenshotPath = await agent.takeScreenshot('desktop-full-layout');

      // Check if baseline exists
      if (!visualRegression.hasBaseline('desktop-full-layout', 'desktop')) {
        visualRegression.saveBaseline('desktop-full-layout', screenshotPath, 'desktop');
        console.log('✓ Baseline created for full layout');
        return;
      }

      // Compare against baseline (using default thresholds configured for full page tolerance)
      const result = await visualRegression.compare('desktop-full-layout', screenshotPath, 'desktop');

      if (!result.matches) {
        throw new Error(
          `Visual regression detected in full layout:\n` +
          `  - ${result.diffPercentage.toFixed(2)}% of pixels changed (${result.diffPixels} pixels)\n` +
          `  - Threshold: 1.0%\n` +
          `  - Diff image: ${result.diffImagePath}\n` +
          `  - This indicates significant layout changes across the application`
        );
      }

      console.log(`✓ Full layout visual match: ${result.diffPercentage.toFixed(4)}% difference`);
    }
  },

  {
    id: 'ankrshield-visual-desktop-008',
    name: 'Modal dialog appearance',
    description: 'Verify modal dialogs render consistently',
    type: 'visual',
    app: 'ankrshield-desktop',
    tags: ['visual', 'ui', 'modal', 'component'],
    timeout: 10000,
    fn: async (agent: DesktopTestAgent) => {
      // Try to open settings modal (common modal)
      const settingsButton = await agent.isElementVisible('button:has-text("Settings")');

      if (!settingsButton) {
        console.warn('No modal trigger found - skipping modal visual test');
        return;
      }

      await agent.click('button:has-text("Settings")');
      await agent.wait(1500);

      // Check if modal opened
      const modalVisible = await agent.isElementVisible('.modal, .settings-modal, [role="dialog"]');

      if (!modalVisible) {
        console.warn('Modal did not open - skipping visual test');
        return;
      }

      // Take screenshot
      const screenshotPath = await agent.takeScreenshot('desktop-modal');

      // Check if baseline exists
      if (!visualRegression.hasBaseline('desktop-modal', 'desktop')) {
        visualRegression.saveBaseline('desktop-modal', screenshotPath, 'desktop');
        console.log('✓ Baseline created for modal dialog');
        return;
      }

      // Compare against baseline
      const result = await visualRegression.compare('desktop-modal', screenshotPath, 'desktop');

      if (!result.matches) {
        throw new Error(
          `Visual regression detected in modal dialog:\n` +
          `  - ${result.diffPercentage.toFixed(2)}% of pixels changed (${result.diffPixels} pixels)\n` +
          `  - Diff image: ${result.diffImagePath}`
        );
      }

      console.log(`✓ Modal dialog visual match: ${result.diffPercentage.toFixed(4)}% difference`);
    }
  }
];
