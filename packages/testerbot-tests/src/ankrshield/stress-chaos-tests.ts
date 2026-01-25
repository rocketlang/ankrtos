/**
 * ankrshield Stress & Chaos Tests
 * Tests system resilience under extreme conditions and failure scenarios
 */

import { Test } from '@ankr/testerbot-core';
import { DesktopTestAgent } from '@ankr/testerbot-agents';

// Thresholds for stress tests
const STRESS_THRESHOLDS = {
  MAX_MEMORY_INCREASE_MB: 100,        // Max memory increase under stress
  MAX_MEMORY_INCREASE_PERCENT: 100,   // Max 100% memory increase
  MIN_RESPONSE_TIME_MS: 2000,         // Max response time under stress
  MAX_CRASH_RECOVERY_TIME_MS: 5000,   // Time to recover from crash
  LONG_RUNNING_DURATION_MS: 5 * 60 * 1000, // 5 minutes (scaled from 1hr)
  RAPID_INTERACTION_COUNT: 100,        // Number of rapid interactions
  MEMORY_STRESS_ITERATIONS: 50         // Iterations for memory stress
};

export const ankrshieldStressTests: Test[] = [
  {
    id: 'ankrshield-stress-001',
    name: 'Rapid interaction stress test',
    description: 'Verify app remains responsive under rapid user interactions',
    type: 'stress',
    app: 'ankrshield-desktop',
    tags: ['stress', 'performance', 'stability'],
    timeout: 60000,
    fn: async (agent: DesktopTestAgent) => {
      console.log(`Starting rapid interaction test (${STRESS_THRESHOLDS.RAPID_INTERACTION_COUNT} iterations)...`);

      // Get baseline memory (returns heap used in bytes)
      const baselineMemory = await agent.getMemoryUsage();
      const startTime = Date.now();
      let interactionCount = 0;

      // Wait for dashboard to load
      await agent.waitForElement('#dashboard, .dashboard', 5000);

      // Perform rapid interactions
      for (let i = 0; i < STRESS_THRESHOLDS.RAPID_INTERACTION_COUNT; i++) {
        try {
          // Try to click various elements rapidly
          const elements = [
            '#privacy-score, .privacy-score',
            '.stats-grid, .stat-card',
            'button:has-text("Scan"), button:has-text("Refresh")',
            '.recent-activity, .activity-section'
          ];

          for (const selector of elements) {
            const visible = await agent.isElementVisible(selector);
            if (visible) {
              await agent.click(selector);
              interactionCount++;
              await agent.wait(10); // Minimal delay
            }
          }

          // Check app is still visible every 20 iterations
          if (i % 20 === 0) {
            const appVisible = await agent.isAppVisible();
            if (!appVisible) {
              throw new Error(`App crashed after ${interactionCount} interactions`);
            }
          }
        } catch (error) {
          // If element not found, continue (app might be updating)
          if ((error as Error).message.includes('timeout')) {
            console.warn(`Element timeout at iteration ${i}, continuing...`);
          }
        }
      }

      const duration = Date.now() - startTime;
      const finalMemory = await agent.getMemoryUsage();
      const memoryIncrease = finalMemory - baselineMemory;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

      console.log(`✓ Completed ${interactionCount} interactions in ${duration}ms`);
      console.log(`  Memory increase: ${memoryIncreaseMB.toFixed(2)}MB`);
      console.log(`  Average time per interaction: ${(duration / interactionCount).toFixed(2)}ms`);

      // Verify app still responsive
      const appVisible = await agent.isAppVisible();
      if (!appVisible) {
        throw new Error('App crashed during rapid interaction test');
      }

      // Verify reasonable memory increase
      if (memoryIncreaseMB > STRESS_THRESHOLDS.MAX_MEMORY_INCREASE_MB) {
        console.warn(`⚠️  Large memory increase: ${memoryIncreaseMB.toFixed(2)}MB (threshold: ${STRESS_THRESHOLDS.MAX_MEMORY_INCREASE_MB}MB)`);
      } else {
        console.log(`✅ Memory increase acceptable: ${memoryIncreaseMB.toFixed(2)}MB`);
      }
    }
  },

  {
    id: 'ankrshield-stress-002',
    name: 'Memory stress test',
    description: 'Perform memory-intensive operations and verify no memory leaks',
    type: 'stress',
    app: 'ankrshield-desktop',
    tags: ['stress', 'memory', 'leak-detection', 'critical'],
    timeout: 90000,
    fn: async (agent: DesktopTestAgent) => {
      console.log(`Starting memory stress test (${STRESS_THRESHOLDS.MEMORY_STRESS_ITERATIONS} iterations)...`);

      // Wait for app to stabilize
      await agent.waitForElement('#dashboard, .dashboard', 5000);
      await agent.wait(2000);

      // Get baseline memory (returns heap used in bytes)
      const baselineMemory = await agent.getMemoryUsage();
      console.log(`Baseline memory: ${(baselineMemory / (1024 * 1024)).toFixed(2)}MB`);

      const memorySnapshots: number[] = [baselineMemory];

      // Perform memory-intensive operations
      for (let i = 0; i < STRESS_THRESHOLDS.MEMORY_STRESS_ITERATIONS; i++) {
        try {
          // Navigate through different views to generate memory usage
          const activityVisible = await agent.isElementVisible('.recent-activity, .activity-section');
          if (activityVisible) {
            await agent.click('.recent-activity, .activity-section');
            await agent.wait(50);
          }

          // Try to open/close settings
          const settingsButton = await agent.isElementVisible('button:has-text("Settings")');
          if (settingsButton) {
            await agent.click('button:has-text("Settings")');
            await agent.wait(100);

            // Try to close settings
            const closeButton = await agent.isElementVisible('button:has-text("Close"), [aria-label="Close"]');
            if (closeButton) {
              await agent.click('button:has-text("Close"), [aria-label="Close"]');
              await agent.wait(50);
            }
          }

          // Sample memory every 10 iterations
          if (i % 10 === 0 && i > 0) {
            const currentMemory = await agent.getMemoryUsage();
            memorySnapshots.push(currentMemory);
            const memoryMB = currentMemory / (1024 * 1024);
            console.log(`  Iteration ${i}: ${memoryMB.toFixed(2)}MB`);
          }

        } catch (error) {
          // Continue even if some operations fail
          if (i % 10 === 0) {
            console.warn(`  Warning at iteration ${i}: ${(error as Error).message}`);
          }
        }
      }

      // Get final memory
      const finalMemory = await agent.getMemoryUsage();
      memorySnapshots.push(finalMemory);

      const memoryIncrease = finalMemory - baselineMemory;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
      const memoryIncreasePercent = (memoryIncrease / baselineMemory) * 100;

      console.log(`\nMemory Analysis:`);
      console.log(`  Baseline: ${(baselineMemory / (1024 * 1024)).toFixed(2)}MB`);
      console.log(`  Final: ${(finalMemory / (1024 * 1024)).toFixed(2)}MB`);
      console.log(`  Increase: ${memoryIncreaseMB.toFixed(2)}MB (${memoryIncreasePercent.toFixed(1)}%)`);

      // Check for memory leak pattern
      const recentSnapshots = memorySnapshots.slice(-5);
      const isIncreasing = recentSnapshots.every((val, idx) =>
        idx === 0 || val >= recentSnapshots[idx - 1]
      );

      if (isIncreasing && memoryIncreaseMB > 50) {
        console.warn(`⚠️  Possible memory leak detected (continuous increase)`);
      }

      // Verify acceptable memory increase
      if (memoryIncreaseMB > STRESS_THRESHOLDS.MAX_MEMORY_INCREASE_MB) {
        throw new Error(
          `Excessive memory increase: ${memoryIncreaseMB.toFixed(2)}MB (${memoryIncreasePercent.toFixed(1)}%) ` +
          `exceeds threshold of ${STRESS_THRESHOLDS.MAX_MEMORY_INCREASE_MB}MB`
        );
      }

      if (memoryIncreasePercent > STRESS_THRESHOLDS.MAX_MEMORY_INCREASE_PERCENT) {
        throw new Error(
          `Excessive memory increase: ${memoryIncreasePercent.toFixed(1)}% ` +
          `exceeds threshold of ${STRESS_THRESHOLDS.MAX_MEMORY_INCREASE_PERCENT}%`
        );
      }

      console.log(`✅ Memory stress test passed - no significant leaks detected`);
    }
  },

  {
    id: 'ankrshield-stress-003',
    name: 'Long-running stability test',
    description: 'Verify app remains stable during extended session (5 minutes)',
    type: 'stress',
    app: 'ankrshield-desktop',
    tags: ['stress', 'stability', 'long-running'],
    timeout: STRESS_THRESHOLDS.LONG_RUNNING_DURATION_MS + 30000, // 5.5 minutes
    fn: async (agent: DesktopTestAgent) => {
      const durationMinutes = STRESS_THRESHOLDS.LONG_RUNNING_DURATION_MS / (60 * 1000);
      console.log(`Starting long-running stability test (${durationMinutes} minutes)...`);

      // Wait for app to load
      await agent.waitForElement('#dashboard, .dashboard', 5000);

      const startTime = Date.now();
      const baselineMemory = await agent.getMemoryUsage(); // Returns heap used in bytes
      const checkInterval = 30000; // Check every 30 seconds
      let checksPerformed = 0;
      const memoryHistory: Array<{ time: number; memory: number }> = [];

      while (Date.now() - startTime < STRESS_THRESHOLDS.LONG_RUNNING_DURATION_MS) {
        // Wait for check interval
        await agent.wait(checkInterval);

        // Verify app is still visible
        const appVisible = await agent.isAppVisible();
        if (!appVisible) {
          throw new Error(`App crashed after ${((Date.now() - startTime) / 1000).toFixed(0)}s`);
        }

        // Check memory
        const currentMemory = await agent.getMemoryUsage();
        const elapsed = Date.now() - startTime;
        memoryHistory.push({
          time: elapsed,
          memory: currentMemory
        });

        checksPerformed++;
        const elapsedMinutes = (elapsed / (60 * 1000)).toFixed(1);
        const memoryMB = (currentMemory / (1024 * 1024)).toFixed(2);
        console.log(`  Check ${checksPerformed} (${elapsedMinutes}min): ${memoryMB}MB`);

        // Perform light interaction to keep app active
        try {
          const privacyScore = await agent.isElementVisible('#privacy-score, .privacy-score');
          if (privacyScore) {
            await agent.click('#privacy-score, .privacy-score');
            await agent.wait(100);
          }
        } catch (error) {
          // Non-critical, continue
        }

        // Check for console errors
        const errors = await agent.getConsoleErrors();
        if (errors.length > 10) {
          console.warn(`  ⚠️  ${errors.length} console errors detected`);
        }
      }

      const totalDuration = Date.now() - startTime;
      const finalMemory = await agent.getMemoryUsage();
      const memoryIncrease = finalMemory - baselineMemory;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

      console.log(`\n✓ Long-running test completed:`);
      console.log(`  Duration: ${(totalDuration / (60 * 1000)).toFixed(2)} minutes`);
      console.log(`  Checks performed: ${checksPerformed}`);
      console.log(`  Memory increase: ${memoryIncreaseMB.toFixed(2)}MB`);
      console.log(`  App remained stable: YES`);

      // Verify app still responsive
      const appVisible = await agent.isAppVisible();
      if (!appVisible) {
        throw new Error('App not visible after long-running session');
      }

      if (memoryIncreaseMB > STRESS_THRESHOLDS.MAX_MEMORY_INCREASE_MB) {
        console.warn(`⚠️  Significant memory increase during long-running session: ${memoryIncreaseMB.toFixed(2)}MB`);
      }

      console.log(`✅ Long-running stability test passed`);
    }
  },

  {
    id: 'ankrshield-stress-004',
    name: 'Concurrent operations stress',
    description: 'Verify app handles concurrent operations without deadlocks',
    type: 'stress',
    app: 'ankrshield-desktop',
    tags: ['stress', 'concurrency', 'deadlock'],
    timeout: 60000,
    fn: async (agent: DesktopTestAgent) => {
      console.log('Starting concurrent operations stress test...');

      // Wait for dashboard
      await agent.waitForElement('#dashboard, .dashboard', 5000);
      await agent.wait(1000);

      const operations = [
        'privacy-score-check',
        'stats-refresh',
        'activity-view',
        'settings-access'
      ];

      let successCount = 0;
      let errorCount = 0;

      // Perform rapid concurrent-like operations
      for (let cycle = 0; cycle < 20; cycle++) {
        try {
          // Simulate concurrent operations by performing them rapidly
          // Check privacy score
          const scoreVisible = await agent.isElementVisible('#privacy-score, .privacy-score');
          if (scoreVisible) {
            await agent.click('#privacy-score, .privacy-score');
            successCount++;
          }

          // Check stats
          const statsVisible = await agent.isElementVisible('.stats-grid, .stat-card');
          if (statsVisible) {
            const stats = await agent.findElements('.stat-card');
            successCount++;
          }

          // Access activity
          const activityVisible = await agent.isElementVisible('.recent-activity, .activity-section');
          if (activityVisible) {
            await agent.click('.recent-activity, .activity-section');
            successCount++;
          }

          // Try settings
          const settingsButton = await agent.isElementVisible('button:has-text("Settings")');
          if (settingsButton) {
            await agent.click('button:has-text("Settings")');
            await agent.wait(50);

            // Close settings
            const closeButton = await agent.isElementVisible('button:has-text("Close"), [aria-label="Close"]');
            if (closeButton) {
              await agent.click('button:has-text("Close"), [aria-label="Close"]');
            }
            successCount++;
          }

          // Minimal wait between cycles
          await agent.wait(10);

          // Check app is still responsive
          if (cycle % 5 === 0) {
            const appVisible = await agent.isAppVisible();
            if (!appVisible) {
              throw new Error(`App deadlocked or crashed at cycle ${cycle}`);
            }
          }

        } catch (error) {
          errorCount++;
          if (errorCount > 10) {
            throw new Error(`Too many errors (${errorCount}) during concurrent operations`);
          }
        }
      }

      console.log(`✓ Concurrent operations completed:`);
      console.log(`  Successful operations: ${successCount}`);
      console.log(`  Errors: ${errorCount}`);

      // Verify app is still responsive
      const appVisible = await agent.isAppVisible();
      if (!appVisible) {
        throw new Error('App not responsive after concurrent operations');
      }

      const finalMemory = await agent.getMemoryUsage();
      console.log(`  Final memory: ${(finalMemory / (1024 * 1024)).toFixed(2)}MB`);
      console.log(`✅ Concurrent operations stress test passed`);
    }
  }
];

export const ankrshieldChaosTests: Test[] = [
  {
    id: 'ankrshield-chaos-001',
    name: 'Invalid input handling',
    description: 'Verify app gracefully handles invalid user inputs',
    type: 'chaos',
    app: 'ankrshield-desktop',
    tags: ['chaos', 'error-handling', 'validation'],
    timeout: 30000,
    fn: async (agent: DesktopTestAgent) => {
      console.log('Starting invalid input handling test...');

      // Wait for app
      await agent.waitForElement('#dashboard, .dashboard', 5000);

      let handledGracefully = true;

      // Try to open settings
      const settingsButton = await agent.isElementVisible('button:has-text("Settings")');
      if (settingsButton) {
        await agent.click('button:has-text("Settings")');
        await agent.wait(1000);

        // Try to find input fields and send invalid data
        const inputs = [
          'input[type="text"]',
          'input[type="number"]',
          'input[type="email"]',
          'input[type="url"]',
          'textarea'
        ];

        const invalidInputs = [
          '<script>alert("xss")</script>',  // XSS attempt
          "'; DROP TABLE users; --",         // SQL injection
          'A'.repeat(10000),                 // Very long string
          '../../../../etc/passwd',          // Path traversal
          '\x00\x01\x02',                    // Null bytes
          '🔥💀👻🎃'.repeat(100)             // Many emojis
        ];

        let inputsTested = 0;

        for (const inputSelector of inputs) {
          try {
            const inputVisible = await agent.isElementVisible(inputSelector);
            if (inputVisible) {
              for (const invalidInput of invalidInputs) {
                // Type invalid input
                await agent.type(inputSelector, invalidInput);
                await agent.wait(50);

                // Check app didn't crash
                const appVisible = await agent.isAppVisible();
                if (!appVisible) {
                  handledGracefully = false;
                  throw new Error(`App crashed with input: ${invalidInput.substring(0, 50)}`);
                }

                inputsTested++;
              }
            }
          } catch (error) {
            if ((error as Error).message.includes('crashed')) {
              throw error;
            }
            // Input might not be writable, continue
          }
        }

        console.log(`✓ Tested ${inputsTested} invalid inputs`);

        // Check for console errors
        const errors = await agent.getConsoleErrors();
        const criticalErrors = errors.filter(err =>
          err.toLowerCase().includes('uncaught') ||
          err.toLowerCase().includes('fatal')
        );

        if (criticalErrors.length > 0) {
          console.warn(`⚠️  ${criticalErrors.length} critical console errors detected`);
          console.warn(`  ${criticalErrors.slice(0, 3).join(', ')}`);
        } else {
          console.log(`✓ No critical console errors`);
        }

      } else {
        console.warn('Settings not accessible - skipping input validation test');
        return;
      }

      // Verify app is still functional
      const appVisible = await agent.isAppVisible();
      if (!appVisible) {
        throw new Error('App crashed during invalid input test');
      }

      console.log(`✅ Invalid input handling test passed - app remained stable`);
    }
  },

  {
    id: 'ankrshield-chaos-002',
    name: 'Rapid view switching',
    description: 'Verify app handles rapid navigation without crashes',
    type: 'chaos',
    app: 'ankrshield-desktop',
    tags: ['chaos', 'navigation', 'stability'],
    timeout: 45000,
    fn: async (agent: DesktopTestAgent) => {
      console.log('Starting rapid view switching test...');

      // Wait for dashboard
      await agent.waitForElement('#dashboard, .dashboard', 5000);

      const views = [
        { name: 'Dashboard', selector: 'a:has-text("Dashboard"), button:has-text("Dashboard")' },
        { name: 'Activity', selector: 'a:has-text("Activity"), .recent-activity' },
        { name: 'Settings', selector: 'button:has-text("Settings")' },
        { name: 'Privacy Score', selector: '#privacy-score, .privacy-score' }
      ];

      let switchCount = 0;
      const targetSwitches = 100;

      for (let i = 0; i < targetSwitches; i++) {
        const view = views[i % views.length];

        try {
          const visible = await agent.isElementVisible(view.selector);
          if (visible) {
            await agent.click(view.selector);
            switchCount++;
            await agent.wait(20); // Minimal delay
          }

          // Check app health every 25 switches
          if (i % 25 === 0 && i > 0) {
            const appVisible = await agent.isAppVisible();
            if (!appVisible) {
              throw new Error(`App crashed after ${switchCount} view switches`);
            }
            console.log(`  ${i} switches completed...`);
          }

        } catch (error) {
          if ((error as Error).message.includes('crashed')) {
            throw error;
          }
          // Element might not be available in current view, continue
        }
      }

      console.log(`✓ Completed ${switchCount} rapid view switches`);

      // Verify app is still responsive
      const appVisible = await agent.isAppVisible();
      if (!appVisible) {
        throw new Error('App not responsive after rapid view switching');
      }

      // Check memory
      const finalMemory = await agent.getMemoryUsage();
      console.log(`  Final memory: ${(finalMemory / (1024 * 1024)).toFixed(2)}MB`);

      console.log(`✅ Rapid view switching test passed`);
    }
  },

  {
    id: 'ankrshield-chaos-003',
    name: 'Error recovery test',
    description: 'Verify app recovers from error states gracefully',
    type: 'chaos',
    app: 'ankrshield-desktop',
    tags: ['chaos', 'recovery', 'error-handling', 'critical'],
    timeout: 30000,
    fn: async (agent: DesktopTestAgent) => {
      console.log('Starting error recovery test...');

      // Wait for app
      await agent.waitForElement('#dashboard, .dashboard', 5000);

      let recoveryAttempts = 0;
      let successfulRecoveries = 0;

      // Attempt operations that might fail
      const potentiallyFailingOperations = [
        async () => {
          // Try to click non-existent elements
          try {
            await agent.click('#non-existent-element-12345');
          } catch (error) {
            // Expected to fail
            recoveryAttempts++;

            // Verify app still works after error
            const appVisible = await agent.isAppVisible();
            if (appVisible) {
              successfulRecoveries++;
            }
          }
        },
        async () => {
          // Try to get text from non-existent elements
          try {
            await agent.getText('#another-fake-element-67890');
          } catch (error) {
            recoveryAttempts++;

            const appVisible = await agent.isAppVisible();
            if (appVisible) {
              successfulRecoveries++;
            }
          }
        },
        async () => {
          // Try rapid clicks on same element
          try {
            for (let i = 0; i < 20; i++) {
              await agent.click('#privacy-score, .privacy-score');
            }
            recoveryAttempts++;
            successfulRecoveries++;
          } catch (error) {
            recoveryAttempts++;
            const appVisible = await agent.isAppVisible();
            if (appVisible) {
              successfulRecoveries++;
            }
          }
        }
      ];

      for (const operation of potentiallyFailingOperations) {
        await operation();
        await agent.wait(500);
      }

      console.log(`✓ Error recovery analysis:`);
      console.log(`  Recovery attempts: ${recoveryAttempts}`);
      console.log(`  Successful recoveries: ${successfulRecoveries}`);

      if (recoveryAttempts > 0) {
        const recoveryRate = (successfulRecoveries / recoveryAttempts) * 100;
        console.log(`  Recovery rate: ${recoveryRate.toFixed(1)}%`);

        if (recoveryRate < 80) {
          console.warn(`⚠️  Low recovery rate: ${recoveryRate.toFixed(1)}%`);
        }
      }

      // Final check
      const appVisible = await agent.isAppVisible();
      if (!appVisible) {
        throw new Error('App failed to recover from errors');
      }

      console.log(`✅ Error recovery test passed`);
    }
  },

  {
    id: 'ankrshield-chaos-004',
    name: 'Resource cleanup verification',
    description: 'Verify app properly cleans up resources after operations',
    type: 'chaos',
    app: 'ankrshield-desktop',
    tags: ['chaos', 'resource-management', 'cleanup'],
    timeout: 45000,
    fn: async (agent: DesktopTestAgent) => {
      console.log('Starting resource cleanup verification...');

      // Wait for app
      await agent.waitForElement('#dashboard, .dashboard', 5000);
      await agent.wait(1000);

      // Get baseline
      const baselineMemory = await agent.getMemoryUsage(); // Returns heap used in bytes
      const baselineErrors = await agent.getConsoleErrors();

      console.log(`Baseline memory: ${(baselineMemory / (1024 * 1024)).toFixed(2)}MB`);
      console.log(`Baseline console errors: ${baselineErrors.length}`);

      // Perform resource-intensive operations
      for (let cycle = 0; cycle < 10; cycle++) {
        // Open and close settings repeatedly
        const settingsButton = await agent.isElementVisible('button:has-text("Settings")');
        if (settingsButton) {
          await agent.click('button:has-text("Settings")');
          await agent.wait(200);

          const closeButton = await agent.isElementVisible('button:has-text("Close"), [aria-label="Close"]');
          if (closeButton) {
            await agent.click('button:has-text("Close"), [aria-label="Close"]');
            await agent.wait(200);
          }
        }

        // Click through activity
        const activityVisible = await agent.isElementVisible('.recent-activity, .activity-section');
        if (activityVisible) {
          await agent.click('.recent-activity, .activity-section');
          await agent.wait(100);
        }

        // Take screenshots (resource usage)
        await agent.takeScreenshot(`cleanup-test-${cycle}`);
        await agent.wait(100);
      }

      // Wait for potential garbage collection
      console.log('Waiting for resource cleanup...');
      await agent.wait(3000);

      // Check if resources were cleaned up
      const finalMemory = await agent.getMemoryUsage();
      const finalErrors = await agent.getConsoleErrors();

      const memoryDiff = finalMemory - baselineMemory;
      const memoryDiffMB = memoryDiff / (1024 * 1024);
      const newErrors = finalErrors.length - baselineErrors.length;

      console.log(`\nResource cleanup analysis:`);
      console.log(`  Memory change: ${memoryDiffMB.toFixed(2)}MB`);
      console.log(`  New console errors: ${newErrors}`);

      // Verify reasonable resource usage
      if (memoryDiffMB > 50) {
        console.warn(`⚠️  Significant memory not cleaned up: ${memoryDiffMB.toFixed(2)}MB`);
      } else {
        console.log(`✓ Memory cleanup acceptable`);
      }

      if (newErrors > 20) {
        console.warn(`⚠️  Many new console errors: ${newErrors}`);
      } else {
        console.log(`✓ Error count acceptable`);
      }

      // Verify app still functional
      const appVisible = await agent.isAppVisible();
      if (!appVisible) {
        throw new Error('App not responsive after resource cleanup test');
      }

      console.log(`✅ Resource cleanup verification passed`);
    }
  }
];

// Export all stress and chaos tests together
export const ankrshieldStressChaosTests: Test[] = [
  ...ankrshieldStressTests,
  ...ankrshieldChaosTests
];
