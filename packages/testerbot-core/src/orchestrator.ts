/**
 * TesterBot Orchestrator - Central control system
 */

import { TestConfig, TestReport, TestResult, Test, TestStatus, FixResult } from './types';

export class TesterBotOrchestrator {
  private tests: Map<string, Test> = new Map();
  private results: TestResult[] = [];
  private autoFixEngine: any;  // Optional AutoFixEngine instance

  constructor(private config: TestConfig, autoFixEngine?: any) {
    this.autoFixEngine = autoFixEngine;
  }

  /**
   * Register a test
   */
  registerTest(test: Test): void {
    this.tests.set(test.id, test);
  }

  /**
   * Register multiple tests
   */
  registerTests(tests: Test[]): void {
    tests.forEach(test => this.registerTest(test));
  }

  /**
   * Run all registered tests
   */
  async runTests(agent: any): Promise<TestReport> {
    const startTime = Date.now();
    this.results = [];

    console.log(`\n🧪 TesterBot - Running ${this.tests.size} tests\n`);

    // Filter tests by config
    const testsToRun = this.filterTests();

    // Run tests sequentially (parallel option TODO)
    for (const test of testsToRun) {
      const result = await this.runSingleTest(test, agent);
      this.results.push(result);

      // Print result
      this.printTestResult(result);
    }

    const duration = Date.now() - startTime;

    // Generate report
    return this.generateReport(duration);
  }

  /**
   * Run a single test
   */
  private async runSingleTest(test: Test, agent: any): Promise<TestResult> {
    const startTime = Date.now();
    const timestamp = new Date();

    let status: TestStatus = 'pass';
    let error: TestResult['error'];
    let screenshots: string[] = [];
    let videos: string[] = [];
    let retryCount = 0;
    let fixResults: FixResult[] | undefined;

    const maxRetries = test.retries ?? this.config.retries ?? 0;

    // Retry loop
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        retryCount = attempt;

        // Start video recording
        try {
          await agent.startVideoRecording?.(test.id);
        } catch (videoErr) {
          // Ignore video recording start errors
        }

        // Run test function
        await Promise.race([
          test.fn(agent),
          this.timeout(test.timeout ?? this.config.timeout ?? 30000)
        ]);

        status = 'pass';

        // Stop video recording (don't save on success)
        try {
          await agent.stopVideoRecording?.(false);
        } catch (videoErr) {
          // Ignore video recording errors
        }

        break; // Success, exit retry loop

      } catch (err) {
        status = 'fail';
        error = {
          message: (err as Error).message,
          stack: (err as Error).stack
        };

        // Stop video recording and save on failure
        try {
          const videoPath = await agent.stopVideoRecording?.(true);
          if (videoPath) {
            videos.push(videoPath);
            error.video = videoPath;
          }
        } catch (videoErr) {
          // Ignore video recording errors
        }

        // Take screenshot on failure
        try {
          const screenshot = await agent.takeScreenshot?.();
          if (screenshot) {
            screenshots.push(screenshot);
            error.screenshot = screenshot;
          }
        } catch (screenshotErr) {
          // Ignore screenshot errors
        }

        // If we have retries left, continue
        if (attempt < maxRetries) {
          console.log(`  ↻ Retrying (${attempt + 1}/${maxRetries})...`);
          await this.sleep(1000); // Wait 1s before retry
        }
      }
    }

    // Attempt auto-fix if test failed and auto-fix is enabled
    if (status === 'fail' && this.config.autoFix && this.autoFixEngine && error) {
      try {
        const failureContext = {
          testId: test.id,
          testName: test.name,
          errorMessage: error.message,
          errorStack: error.stack,
          app: test.app,
          environment: this.config.environments[0] || 'unknown',
          timestamp: Date.now(),
          retryCount
        };

        const autoFixResults = await this.autoFixEngine.attemptFix(failureContext);

        // Convert AutoFixResult[] to FixResult[]
        if (autoFixResults && autoFixResults.length > 0) {
          fixResults = autoFixResults.map((afr: any) => ({
            issueType: afr.fixId,
            fixName: afr.fixName,
            success: afr.success && afr.verified,
            actions: afr.actions.map((a: any) => a.description),
            error: afr.error,
            timestamp: new Date()
          }));

          // If any fix succeeded and was verified, re-run the test
          const successfulFix = autoFixResults.find((r: any) => r.success && r.verified);
          if (successfulFix) {
            console.log(`  ↻ Re-running test after successful fix...`);

            try {
              await Promise.race([
                test.fn(agent),
                this.timeout(test.timeout ?? this.config.timeout ?? 30000)
              ]);

              status = 'pass';
              error = undefined;
              console.log(`  ✅ Test passed after auto-fix!`);
            } catch (rerunErr) {
              console.log(`  ❌ Test still failing after fix`);
            }
          }
        }
      } catch (fixErr) {
        console.error(`  Auto-fix error:`, (fixErr as Error).message);
      }
    }

    const duration = Date.now() - startTime;

    // Collect performance metrics
    let metrics;
    try {
      metrics = await agent.getPerformanceMetrics?.();
    } catch (metricsErr) {
      // Ignore metrics collection errors
    }

    return {
      testId: test.id,
      testName: test.name,
      status,
      duration,
      timestamp,
      error,
      screenshots,
      videos,
      metrics,
      fixResults,
      retryCount
    };
  }

  /**
   * Filter tests based on config
   */
  private filterTests(): Test[] {
    const allTests = Array.from(this.tests.values());

    return allTests.filter(test => {
      // Filter by test type
      if (this.config.testTypes.length > 0 && !this.config.testTypes.includes(test.type)) {
        return false;
      }

      // Filter by app
      if (this.config.apps.length > 0 && !this.config.apps.includes(test.app)) {
        return false;
      }

      // Filter by tags
      if (this.config.tags && this.config.tags.length > 0) {
        const hasTag = this.config.tags.some(tag => test.tags.includes(tag));
        if (!hasTag) return false;
      }

      return true;
    });
  }

  /**
   * Generate test report
   */
  private generateReport(duration: number): TestReport {
    const summary = {
      total: this.results.length,
      passed: this.results.filter(r => r.status === 'pass').length,
      failed: this.results.filter(r => r.status === 'fail').length,
      skipped: this.results.filter(r => r.status === 'skip').length,
      duration
    };

    return {
      timestamp: new Date(),
      environment: this.config.environments[0] || 'unknown',
      app: this.config.apps[0] || 'unknown',
      summary,
      tests: this.results
    };
  }

  /**
   * Print test result to console
   */
  private printTestResult(result: TestResult): void {
    const icon = result.status === 'pass' ? '✓' : '✗';
    const color = result.status === 'pass' ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(`  ${color}${icon}${reset} ${result.testName} (${result.duration}ms)`);

    if (result.error) {
      console.log(`    ${result.error.message}`);
    }

    if (result.retryCount && result.retryCount > 0) {
      console.log(`    Passed after ${result.retryCount} ${result.retryCount === 1 ? 'retry' : 'retries'}`);
    }
  }

  /**
   * Timeout helper
   */
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Test timeout after ${ms}ms`)), ms);
    });
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
