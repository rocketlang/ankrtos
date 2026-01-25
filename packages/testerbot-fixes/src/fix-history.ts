/**
 * Fix History Tracking
 * Track fix attempts over time for analytics and debugging
 */

import * as fs from 'fs';
import * as path from 'path';
import { AutoFixResult, FailureContext } from './types';

export interface FixHistoryEntry {
  timestamp: number;
  testId: string;
  testName: string;
  errorMessage: string;
  fixResults: AutoFixResult[];
  environmentContext: {
    app: string;
    environment: string;
  };
}

export interface FixStatistics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  successRate: number;
  averageDuration: number;
  fixBreakdown: Record<string, {
    fixId: string;
    fixName: string;
    attempts: number;
    successes: number;
    failures: number;
    successRate: number;
    averageDuration: number;
  }>;
  recentFailures: Array<{
    timestamp: number;
    testName: string;
    errorMessage: string;
    fixesAttempted: number;
  }>;
}

export class FixHistory {
  private historyFile: string;
  private history: FixHistoryEntry[] = [];

  constructor(historyDir: string = './test-results/fix-history') {
    if (!fs.existsSync(historyDir)) {
      fs.mkdirSync(historyDir, { recursive: true });
    }

    this.historyFile = path.join(historyDir, 'fix-history.json');
    this.loadHistory();
  }

  /**
   * Load history from disk
   */
  private loadHistory(): void {
    if (fs.existsSync(this.historyFile)) {
      try {
        const data = fs.readFileSync(this.historyFile, 'utf-8');
        this.history = JSON.parse(data);
      } catch (err) {
        console.warn('Failed to load fix history:', (err as Error).message);
        this.history = [];
      }
    }
  }

  /**
   * Save history to disk
   */
  private saveHistory(): void {
    try {
      fs.writeFileSync(this.historyFile, JSON.stringify(this.history, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Failed to save fix history:', (err as Error).message);
    }
  }

  /**
   * Add a fix attempt to history
   */
  addEntry(
    context: FailureContext,
    fixResults: AutoFixResult[]
  ): void {
    const entry: FixHistoryEntry = {
      timestamp: Date.now(),
      testId: context.testId,
      testName: context.testName,
      errorMessage: context.errorMessage,
      fixResults,
      environmentContext: {
        app: context.app,
        environment: context.environment
      }
    };

    this.history.push(entry);

    // Keep only last 1000 entries to prevent file from growing too large
    if (this.history.length > 1000) {
      this.history = this.history.slice(-1000);
    }

    this.saveHistory();
  }

  /**
   * Get all history entries
   */
  getAllEntries(): FixHistoryEntry[] {
    return [...this.history];
  }

  /**
   * Get history entries for a specific test
   */
  getEntriesForTest(testId: string): FixHistoryEntry[] {
    return this.history.filter(entry => entry.testId === testId);
  }

  /**
   * Get recent history entries
   */
  getRecentEntries(count: number = 10): FixHistoryEntry[] {
    return this.history.slice(-count).reverse();
  }

  /**
   * Get history entries within time range
   */
  getEntriesInRange(startTime: number, endTime: number): FixHistoryEntry[] {
    return this.history.filter(entry =>
      entry.timestamp >= startTime && entry.timestamp <= endTime
    );
  }

  /**
   * Calculate statistics from history
   */
  getStatistics(timeRangeMs?: number): FixStatistics {
    const now = Date.now();
    const startTime = timeRangeMs ? now - timeRangeMs : 0;

    const entries = this.history.filter(entry => entry.timestamp >= startTime);

    if (entries.length === 0) {
      return {
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        successRate: 0,
        averageDuration: 0,
        fixBreakdown: {},
        recentFailures: []
      };
    }

    let totalAttempts = 0;
    let successfulAttempts = 0;
    let failedAttempts = 0;
    let totalDuration = 0;
    const fixBreakdown: Record<string, {
      fixId: string;
      fixName: string;
      attempts: number;
      successes: number;
      failures: number;
      successRate: number;
      averageDuration: number;
      totalDuration: number;
    }> = {};

    for (const entry of entries) {
      for (const fixResult of entry.fixResults) {
        totalAttempts++;
        totalDuration += fixResult.duration;

        if (fixResult.success && fixResult.verified) {
          successfulAttempts++;
        } else {
          failedAttempts++;
        }

        if (!fixBreakdown[fixResult.fixId]) {
          fixBreakdown[fixResult.fixId] = {
            fixId: fixResult.fixId,
            fixName: fixResult.fixName,
            attempts: 0,
            successes: 0,
            failures: 0,
            successRate: 0,
            averageDuration: 0,
            totalDuration: 0
          };
        }

        fixBreakdown[fixResult.fixId].attempts++;
        fixBreakdown[fixResult.fixId].totalDuration += fixResult.duration;

        if (fixResult.success && fixResult.verified) {
          fixBreakdown[fixResult.fixId].successes++;
        } else {
          fixBreakdown[fixResult.fixId].failures++;
        }
      }
    }

    // Calculate success rates and average durations
    for (const fix of Object.values(fixBreakdown)) {
      fix.successRate = fix.attempts > 0 ? (fix.successes / fix.attempts) * 100 : 0;
      fix.averageDuration = fix.attempts > 0 ? fix.totalDuration / fix.attempts : 0;
      delete (fix as any).totalDuration; // Remove internal field
    }

    // Get recent failures
    const recentFailures = entries
      .filter(entry => entry.fixResults.every(f => !f.success || !f.verified))
      .slice(-10)
      .reverse()
      .map(entry => ({
        timestamp: entry.timestamp,
        testName: entry.testName,
        errorMessage: entry.errorMessage,
        fixesAttempted: entry.fixResults.length
      }));

    return {
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      successRate: totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0,
      averageDuration: totalAttempts > 0 ? totalDuration / totalAttempts : 0,
      fixBreakdown,
      recentFailures
    };
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.history = [];
    this.saveHistory();
  }

  /**
   * Clear history older than specified timestamp
   */
  clearOldHistory(olderThan: number): void {
    const cutoff = Date.now() - olderThan;
    this.history = this.history.filter(entry => entry.timestamp >= cutoff);
    this.saveHistory();
  }

  /**
   * Export history to JSON file
   */
  exportToFile(outputPath: string): void {
    const data = JSON.stringify(this.history, null, 2);
    fs.writeFileSync(outputPath, data, 'utf-8');
  }

  /**
   * Get fix success trend (daily breakdown)
   */
  getSuccessTrend(days: number = 7): Array<{
    date: string;
    totalAttempts: number;
    successes: number;
    failures: number;
    successRate: number;
  }> {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const trend: Array<{
      date: string;
      totalAttempts: number;
      successes: number;
      failures: number;
      successRate: number;
    }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = now - (i + 1) * oneDayMs;
      const dayEnd = now - i * oneDayMs;

      const dayEntries = this.history.filter(entry =>
        entry.timestamp >= dayStart && entry.timestamp < dayEnd
      );

      let totalAttempts = 0;
      let successes = 0;
      let failures = 0;

      for (const entry of dayEntries) {
        for (const fixResult of entry.fixResults) {
          totalAttempts++;
          if (fixResult.success && fixResult.verified) {
            successes++;
          } else {
            failures++;
          }
        }
      }

      trend.push({
        date: new Date(dayStart).toISOString().split('T')[0],
        totalAttempts,
        successes,
        failures,
        successRate: totalAttempts > 0 ? (successes / totalAttempts) * 100 : 0
      });
    }

    return trend;
  }
}
