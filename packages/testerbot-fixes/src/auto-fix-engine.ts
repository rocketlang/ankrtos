/**
 * TesterBot Auto-Fix Engine
 *
 * Manages automatic fixing of test failures
 */

import { Fix, AutoFixResult, FailureContext, FixRegistryEntry, FixState } from './types';
import { FixHistory } from './fix-history';

export interface AutoFixEngineConfig {
  maxFixAttempts?: number;      // Max fixes to attempt per failure (default: 3)
  verifyAfterFix?: boolean;     // Verify fix before considering success (default: true)
  rollbackOnFailure?: boolean;  // Rollback if verification fails (default: true)
  timeout?: number;             // Max time per fix attempt in ms (default: 60000)
  trackHistory?: boolean;       // Track fix history (default: true)
  historyDir?: string;          // History directory (default: './test-results/fix-history')
}

export class AutoFixEngine {
  private fixes: Map<string, FixRegistryEntry> = new Map();
  private stateHistory: Map<string, FixState[]> = new Map();
  private config: Required<AutoFixEngineConfig>;
  private fixHistory?: FixHistory;

  constructor(config: AutoFixEngineConfig = {}) {
    this.config = {
      maxFixAttempts: config.maxFixAttempts ?? 3,
      verifyAfterFix: config.verifyAfterFix ?? true,
      rollbackOnFailure: config.rollbackOnFailure ?? true,
      timeout: config.timeout ?? 60000,
      trackHistory: config.trackHistory ?? true,
      historyDir: config.historyDir ?? './test-results/fix-history'
    };

    // Initialize fix history if tracking is enabled
    if (this.config.trackHistory) {
      this.fixHistory = new FixHistory(this.config.historyDir);
      console.log(`✓ Fix history tracking enabled (${this.config.historyDir})`);
    }
  }

  /**
   * Register a fix
   */
  registerFix(fix: Fix): void {
    if (this.fixes.has(fix.id)) {
      console.warn(`Fix ${fix.id} is already registered. Overwriting.`);
    }

    this.fixes.set(fix.id, {
      fix,
      metadata: {
        registeredAt: Date.now(),
        timesApplied: 0,
        timesSucceeded: 0,
        timesFailed: 0,
        averageDuration: 0
      }
    });

    console.log(`✓ Registered fix: ${fix.id} (${fix.name})`);
  }

  /**
   * Register multiple fixes at once
   */
  registerFixes(fixes: Fix[]): void {
    fixes.forEach(fix => this.registerFix(fix));
  }

  /**
   * Get a fix by ID
   */
  getFix(fixId: string): Fix | undefined {
    return this.fixes.get(fixId)?.fix;
  }

  /**
   * List all registered fixes
   */
  listFixes(): Fix[] {
    return Array.from(this.fixes.values())
      .map(entry => entry.fix)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Find applicable fixes for a failure
   */
  findApplicableFixes(context: FailureContext): Fix[] {
    return this.listFixes().filter(fix => {
      try {
        return fix.canFix(context);
      } catch (err) {
        console.error(`Error checking if fix ${fix.id} can fix failure:`, err);
        return false;
      }
    });
  }

  /**
   * Attempt to fix a test failure
   * Returns list of fix results (may attempt multiple fixes)
   */
  async attemptFix(context: FailureContext): Promise<AutoFixResult[]> {
    console.log(`\n🔧 Auto-Fix: Attempting to fix failure in test ${context.testId}`);
    console.log(`   Error: ${context.errorMessage}`);

    const applicableFixes = this.findApplicableFixes(context);

    if (applicableFixes.length === 0) {
      console.log(`   No applicable fixes found for this failure.`);
      return [];
    }

    console.log(`   Found ${applicableFixes.length} applicable fixes`);

    const results: AutoFixResult[] = [];
    let attemptCount = 0;

    for (const fix of applicableFixes) {
      if (attemptCount >= this.config.maxFixAttempts) {
        console.log(`   Max fix attempts (${this.config.maxFixAttempts}) reached.`);
        break;
      }

      attemptCount++;
      console.log(`\n   Attempting fix ${attemptCount}/${this.config.maxFixAttempts}: ${fix.name}`);

      const result = await this.applyFix(fix, context);
      results.push(result);

      // Update metadata
      this.updateMetadata(fix.id, result);

      if (result.success && result.verified) {
        console.log(`   ✅ Fix succeeded and verified!`);
        break;
      } else if (result.success && !this.config.verifyAfterFix) {
        console.log(`   ✅ Fix applied (verification skipped)`);
        break;
      } else {
        console.log(`   ❌ Fix failed or verification failed`);
      }
    }

    // Track fix attempts in history
    if (this.fixHistory && results.length > 0) {
      this.fixHistory.addEntry(context, results);
    }

    return results;
  }

  /**
   * Apply a single fix
   */
  private async applyFix(fix: Fix, context: FailureContext): Promise<AutoFixResult> {
    const startTime = Date.now();
    let state: FixState | undefined;

    try {
      // Save state if supported
      if (fix.saveState) {
        console.log(`   💾 Saving state for potential rollback...`);
        state = await this.withTimeout(
          fix.saveState(context),
          this.config.timeout,
          'saveState timeout'
        );

        if (state) {
          this.saveStateHistory(context.testId, state);
        }
      }

      // Apply the fix
      console.log(`   🔨 Applying fix...`);
      const result = await this.withTimeout(
        fix.apply(context),
        this.config.timeout,
        'Fix apply timeout'
      );

      result.duration = Date.now() - startTime;

      // Verify the fix if enabled
      if (this.config.verifyAfterFix && result.success) {
        console.log(`   ✓ Verifying fix...`);
        try {
          const verified = await this.withTimeout(
            fix.verify(context),
            this.config.timeout,
            'Fix verify timeout'
          );

          result.verified = verified;

          if (!verified) {
            result.verificationDetails = 'Verification failed - test still failing';

            // Rollback if enabled
            if (this.config.rollbackOnFailure && state) {
              console.log(`   ↩️  Verification failed, rolling back...`);
              await this.rollbackFix(fix, context, state);
              result.verificationDetails += ' (rolled back)';
            }
          } else {
            result.verificationDetails = 'Verification passed - test now passing';
          }
        } catch (verifyErr) {
          result.verified = false;
          result.verificationDetails = `Verification error: ${(verifyErr as Error).message}`;

          // Rollback on verification error if enabled
          if (this.config.rollbackOnFailure && state) {
            console.log(`   ↩️  Verification error, rolling back...`);
            await this.rollbackFix(fix, context, state);
          }
        }
      } else {
        result.verified = false;
        result.verificationDetails = 'Verification skipped';
      }

      return result;

    } catch (err) {
      const duration = Date.now() - startTime;
      console.error(`   ❌ Fix error:`, (err as Error).message);

      // Rollback on error if we saved state
      if (state && this.config.rollbackOnFailure) {
        console.log(`   ↩️  Fix error, rolling back...`);
        await this.rollbackFix(fix, context, state);
      }

      return {
        fixId: fix.id,
        fixName: fix.name,
        success: false,
        applied: false,
        verified: false,
        duration,
        actions: [],
        error: (err as Error).message,
        rollbackAvailable: !!state
      };
    }
  }

  /**
   * Rollback a fix
   */
  private async rollbackFix(fix: Fix, context: FailureContext, state?: FixState): Promise<void> {
    try {
      if (fix.restoreState && state) {
        await fix.restoreState(state);
      } else if (fix.rollback) {
        await fix.rollback(context);
      } else {
        console.warn(`   ⚠️  No rollback method available for fix ${fix.id}`);
      }
    } catch (rollbackErr) {
      console.error(`   ❌ Rollback error:`, (rollbackErr as Error).message);
    }
  }

  /**
   * Update fix metadata
   */
  private updateMetadata(fixId: string, result: AutoFixResult): void {
    const entry = this.fixes.get(fixId);
    if (!entry) return;

    entry.metadata.timesApplied++;

    if (result.success && result.verified) {
      entry.metadata.timesSucceeded++;
    } else {
      entry.metadata.timesFailed++;
    }

    // Update average duration
    const totalAttempts = entry.metadata.timesApplied;
    const previousTotal = entry.metadata.averageDuration * (totalAttempts - 1);
    entry.metadata.averageDuration = (previousTotal + result.duration) / totalAttempts;
  }

  /**
   * Save state to history
   */
  private saveStateHistory(testId: string, state: FixState): void {
    if (!this.stateHistory.has(testId)) {
      this.stateHistory.set(testId, []);
    }
    this.stateHistory.get(testId)!.push(state);
  }

  /**
   * Get state history for a test
   */
  getStateHistory(testId: string): FixState[] {
    return this.stateHistory.get(testId) || [];
  }

  /**
   * Clear state history
   */
  clearStateHistory(testId?: string): void {
    if (testId) {
      this.stateHistory.delete(testId);
    } else {
      this.stateHistory.clear();
    }
  }

  /**
   * Get fix statistics
   */
  getStatistics(): {
    totalFixes: number;
    fixStats: Array<{
      id: string;
      name: string;
      timesApplied: number;
      successRate: number;
      averageDuration: number;
    }>;
  } {
    const fixStats = Array.from(this.fixes.values()).map(entry => ({
      id: entry.fix.id,
      name: entry.fix.name,
      timesApplied: entry.metadata.timesApplied,
      successRate: entry.metadata.timesApplied > 0
        ? (entry.metadata.timesSucceeded / entry.metadata.timesApplied) * 100
        : 0,
      averageDuration: entry.metadata.averageDuration
    }));

    return {
      totalFixes: this.fixes.size,
      fixStats
    };
  }

  /**
   * Wrap a promise with timeout
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
      )
    ]);
  }

  /**
   * Clear all registered fixes (useful for testing)
   */
  clearFixes(): void {
    this.fixes.clear();
    console.log('Cleared all registered fixes');
  }

  /**
   * Get the fix history instance
   */
  getFixHistory(): FixHistory | undefined {
    return this.fixHistory;
  }

  /**
   * Get fix history statistics
   */
  getHistoryStatistics(timeRangeMs?: number) {
    if (!this.fixHistory) {
      console.warn('Fix history tracking is not enabled');
      return null;
    }
    return this.fixHistory.getStatistics(timeRangeMs);
  }

  /**
   * Get fix success trend
   */
  getSuccessTrend(days: number = 7) {
    if (!this.fixHistory) {
      console.warn('Fix history tracking is not enabled');
      return [];
    }
    return this.fixHistory.getSuccessTrend(days);
  }

  /**
   * Generate a detailed verification report for a fix result
   */
  generateVerificationReport(result: AutoFixResult): string {
    const lines: string[] = [];

    lines.push('');
    lines.push('═══════════════════════════════════════════════════════');
    lines.push('🔍 Fix Verification Report');
    lines.push('═══════════════════════════════════════════════════════');
    lines.push('');

    lines.push(`Fix ID: ${result.fixId}`);
    lines.push(`Fix Name: ${result.fixName}`);
    lines.push(`Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
    lines.push(`Applied: ${result.applied ? 'Yes' : 'No'}`);
    lines.push(`Verified: ${result.verified ? 'Yes' : 'No'}`);
    lines.push(`Duration: ${result.duration}ms`);
    lines.push('');

    if (result.actions.length > 0) {
      lines.push('Actions Taken:');
      result.actions.forEach((action, index) => {
        const icon = action.success ? '✅' : '❌';
        lines.push(`  ${index + 1}. ${icon} ${action.description}`);
        if (action.command) {
          lines.push(`     Command: ${action.command}`);
        }
        if (action.output && action.success) {
          lines.push(`     Output: ${action.output.substring(0, 100)}...`);
        }
        if (action.error) {
          lines.push(`     Error: ${action.error}`);
        }
      });
      lines.push('');
    }

    if (result.verificationDetails) {
      lines.push('Verification Details:');
      lines.push(`  ${result.verificationDetails}`);
      lines.push('');
    }

    if (result.error) {
      lines.push('Error:');
      lines.push(`  ${result.error}`);
      lines.push('');
    }

    lines.push('Rollback Available: ' + (result.rollbackAvailable ? 'Yes' : 'No'));
    lines.push('');
    lines.push('═══════════════════════════════════════════════════════');

    return lines.join('\n');
  }

  /**
   * Generate a summary report for multiple fix attempts
   */
  generateFixSummary(results: AutoFixResult[]): string {
    const lines: string[] = [];

    lines.push('');
    lines.push('═══════════════════════════════════════════════════════');
    lines.push('📊 Auto-Fix Summary');
    lines.push('═══════════════════════════════════════════════════════');
    lines.push('');

    const totalAttempts = results.length;
    const successful = results.filter(r => r.success && r.verified).length;
    const failed = results.filter(r => !r.success || !r.verified).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    lines.push(`Total Fix Attempts: ${totalAttempts}`);
    lines.push(`Successful: ${successful}`);
    lines.push(`Failed: ${failed}`);
    lines.push(`Success Rate: ${totalAttempts > 0 ? ((successful / totalAttempts) * 100).toFixed(1) : 0}%`);
    lines.push(`Total Duration: ${totalDuration}ms`);
    lines.push('');

    if (results.length > 0) {
      lines.push('Fix Attempts:');
      results.forEach((result, index) => {
        const status = result.success && result.verified ? '✅' : '❌';
        lines.push(`  ${index + 1}. ${status} ${result.fixName} (${result.duration}ms)`);
        if (result.error) {
          lines.push(`     Error: ${result.error}`);
        }
      });
      lines.push('');
    }

    lines.push('═══════════════════════════════════════════════════════');

    return lines.join('\n');
  }
}
