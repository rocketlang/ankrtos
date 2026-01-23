#!/usr/bin/env node

/**
 * TesterBot CLI - Run tests from command line
 */

import { Command } from 'commander';
import { TesterBotOrchestrator, TestConfig, Reporter, createNotifierFromEnv } from '@ankr/testerbot-core';
import { DesktopTestAgent, WebTestAgent, MobileTestAgent } from '@ankr/testerbot-agents';
import { ankrshieldSmokeTests, ankrshieldWebSmokeTests, ankrshieldMobileSmokeTests, ankrshieldVisualTests, ankrshieldDesktopVisualTests, ankrshieldE2ETests, ankrshieldPerformanceTests, ankrshieldStressTests, ankrshieldChaosTests, ankrshieldStressChaosTests } from '@ankr/testerbot-tests';
import { AutoFixEngine, ALL_FIXES } from '@ankr/testerbot-fixes';
import * as path from 'path';
import * as fs from 'fs';

const program = new Command();

program
  .name('testerbot')
  .description('Universal testing and auto-fix system for ankr apps')
  .version('0.1.0');

program
  .command('run')
  .description('Run tests')
  .option('-a, --app <app>', 'App to test (desktop, web, mobile)', 'desktop')
  .option('-t, --type <type>', 'Test type (smoke, e2e, performance, visual, stress, chaos)', 'smoke')
  .option('--app-path <path>', 'Path to app executable or URL')
  .option('--platform <platform>', 'Mobile platform (iOS, Android)', 'iOS')
  .option('--device <device>', 'Device name (for mobile)', 'iPhone 15')
  .option('--bundle-id <id>', 'Bundle ID or package name (for mobile)')
  .option('--report <format>', 'Report format (console, json, html)', 'console')
  .option('--output <dir>', 'Output directory for reports', './test-results')
  .option('--auto-fix', 'Enable automatic fixing of test failures', false)
  .option('--max-fix-attempts <n>', 'Maximum fix attempts per failure', '3')
  .option('--notify', 'Send notifications (requires env vars)', false)
  .action(async (options) => {
    console.log('\n🧪 TesterBot - Universal Testing System\n');

    // Determine app path
    let appPath = options.appPath;

    if (!appPath && options.app === 'desktop') {
      // Try to find ankrshield desktop app
      const possiblePaths = [
        '/root/ankrshield/apps/desktop/dist/main.js',
        './apps/desktop/dist/main.js',
        './dist/main.js'
      ];

      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          appPath = p;
          break;
        }
      }

      if (!appPath) {
        console.error('❌ Could not find app. Please specify --app-path');
        console.error('   Example: testerbot run --app-path /path/to/app/main.js');
        process.exit(1);
      }
    }

    console.log(`📱 App: ${options.app}`);
    console.log(`📊 Type: ${options.type}`);
    console.log(`📂 Path: ${appPath}`);
    console.log(`🔧 Auto-fix: ${options.autoFix ? 'enabled' : 'disabled'}\n`);

    // Create auto-fix engine if enabled
    let autoFixEngine;
    if (options.autoFix) {
      autoFixEngine = new AutoFixEngine({
        maxFixAttempts: parseInt(options.maxFixAttempts),
        verifyAfterFix: true,
        rollbackOnFailure: true,
        timeout: 60000
      });

      // Register all fixes
      autoFixEngine.registerFixes(ALL_FIXES);
      console.log(`✓ Registered ${ALL_FIXES.length} auto-fixes\n`);
    }

    // Create test configuration
    // Map generic app names to specific app IDs
    const appId = options.app === 'desktop' ? 'ankrshield-desktop' :
                  options.app === 'web' ? 'ankrshield-web' :
                  options.app === 'mobile' ? 'ankrshield-mobile' :
                  options.app;

    const config: TestConfig = {
      apps: [appId],
      environments: ['dev'],
      testTypes: [options.type as any],
      timeout: 30000,
      retries: 1,
      autoFix: options.autoFix
    };

    // Create orchestrator
    const orchestrator = new TesterBotOrchestrator(config, autoFixEngine);

    // Register tests and create agent based on app type
    let agent: any;

    if (options.app === 'desktop' || options.app === 'ankrshield-desktop') {
      // Register tests based on type
      if (options.type === 'e2e') {
        orchestrator.registerTests(ankrshieldE2ETests);
      } else if (options.type === 'visual') {
        orchestrator.registerTests(ankrshieldDesktopVisualTests);
      } else if (options.type === 'performance' || options.type === 'perf') {
        orchestrator.registerTests(ankrshieldPerformanceTests);
      } else if (options.type === 'stress') {
        orchestrator.registerTests(ankrshieldStressTests);
      } else if (options.type === 'chaos') {
        orchestrator.registerTests(ankrshieldChaosTests);
      } else if (options.type === 'stress-chaos' || options.type === 'resilience') {
        orchestrator.registerTests(ankrshieldStressChaosTests);
      } else {
        orchestrator.registerTests(ankrshieldSmokeTests); // Default to smoke
      }

      agent = new DesktopTestAgent({
        appPath: appPath!,
        screenshotsDir: path.join(options.output, 'screenshots')
      });
    } else if (options.app === 'web' || options.app === 'ankrshield-web') {
      orchestrator.registerTests(ankrshieldWebSmokeTests);

      // Use app-path as base URL for web
      const baseUrl = appPath || options.appPath || 'http://localhost:3000';
      agent = new WebTestAgent({
        baseUrl,
        browserType: 'chromium',
        headless: true,
        screenshotsDir: path.join(options.output, 'screenshots')
      });
    } else if (options.app === 'mobile' || options.app === 'ankrshield-mobile') {
      orchestrator.registerTests(ankrshieldMobileSmokeTests);

      const platform = options.platform === 'Android' ? 'Android' : 'iOS';
      agent = new MobileTestAgent({
        platform,
        deviceName: options.device,
        appPath: appPath || options.appPath,
        bundleId: options.bundleId,
        screenshotsDir: path.join(options.output, 'screenshots'),
        useSimulator: true
      });

      console.log(`📱 Platform: ${platform}`);
      console.log(`📱 Device: ${options.device}`);
      if (options.bundleId) {
        console.log(`📦 Bundle ID: ${options.bundleId}`);
      }
    } else {
      console.error(`❌ No tests registered for app: ${options.app}`);
      process.exit(1);
    }

    try {
      // Run tests
      const report = await orchestrator.runTests(agent);

      // Clean up
      await agent.teardown();

      // Generate report
      if (options.report === 'console') {
        Reporter.printSummary(report);
      }

      if (options.report === 'json' || options.report === 'all') {
        const jsonPath = Reporter.saveJSON(report, options.output);
        console.log(`\n📄 JSON Report: ${jsonPath}`);
      }

      if (options.report === 'html' || options.report === 'all') {
        const htmlPath = Reporter.saveHTML(report, options.output);
        console.log(`\n📄 HTML Report: ${htmlPath}`);
        console.log(`   Open: file://${path.resolve(htmlPath)}\n`);
      }

      // Send notifications if enabled
      if (options.notify) {
        const notifier = createNotifierFromEnv();
        if (notifier) {
          try {
            console.log('\n📢 Sending notifications...');
            await notifier.sendReport(report);
            console.log('✓ Notifications sent\n');
          } catch (error) {
            console.error('❌ Failed to send notifications:', (error as Error).message);
          }
        } else {
          console.warn('⚠️  No notification channels configured (set SLACK_WEBHOOK_URL, DISCORD_WEBHOOK_URL, or EMAIL_* env vars)\n');
        }
      }

      // Exit with error code if tests failed
      if (report.summary.failed > 0) {
        process.exit(1);
      }

    } catch (error) {
      console.error('\n❌ Error running tests:', (error as Error).message);
      await agent.teardown();
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List available tests')
  .option('-a, --app <app>', 'Filter by app')
  .option('-t, --type <type>', 'Filter by type')
  .action((options) => {
    console.log('\n📋 Available Tests:\n');

    const allTests = [
      ...ankrshieldSmokeTests,
      ...ankrshieldWebSmokeTests,
      ...ankrshieldMobileSmokeTests,
      ...ankrshieldVisualTests,
      ...ankrshieldDesktopVisualTests,
      ...ankrshieldE2ETests,
      ...ankrshieldPerformanceTests,
      ...ankrshieldStressChaosTests
    ];

    allTests.forEach(test => {
      if (options.app && test.app !== options.app) return;
      if (options.type && test.type !== options.type) return;

      console.log(`  ${test.id}: ${test.name}`);
      console.log(`    Type: ${test.type} | App: ${test.app}`);
      console.log(`    Tags: ${test.tags.join(', ')}`);
      if (test.description) {
        console.log(`    ${test.description}`);
      }
      console.log('');
    });
  });

program
  .command('fixes')
  .description('List available auto-fixes')
  .action(() => {
    console.log('\n🔧 Available Auto-Fixes:\n');

    ALL_FIXES.forEach(fix => {
      console.log(`  ${fix.id}:`);
      console.log(`    Name: ${fix.name}`);
      console.log(`    Description: ${fix.description}`);
      console.log(`    Category: ${fix.category}`);
      console.log(`    Priority: ${fix.priority}`);
      console.log(`    Tags: ${fix.tags.join(', ')}`);
      console.log('');
    });

    console.log(`Total: ${ALL_FIXES.length} fixes registered\n`);
  });

program
  .command('fix-stats')
  .description('Show auto-fix statistics from history')
  .option('--days <n>', 'Show stats for last N days', '7')
  .option('--history-dir <dir>', 'Fix history directory', './test-results/fix-history')
  .action((options) => {
    console.log('\n📊 Auto-Fix Statistics\n');

    const { FixHistory } = require('@ankr/testerbot-fixes');

    try {
      const history = new FixHistory(options.historyDir);
      const days = parseInt(options.days);
      const timeRangeMs = days * 24 * 60 * 60 * 1000;

      const stats = history.getStatistics(timeRangeMs);

      if (stats.totalAttempts === 0) {
        console.log('  No fix history found. Run tests with --auto-fix to generate history.\n');
        return;
      }

      // Overall statistics
      console.log('═══════════════════════════════════════════════════');
      console.log(`Overall Stats (Last ${days} days)`);
      console.log('═══════════════════════════════════════════════════');
      console.log(`  Total Fix Attempts:     ${stats.totalAttempts}`);
      console.log(`  Successful Fixes:       ${stats.successfulAttempts} ✅`);
      console.log(`  Failed Fixes:           ${stats.failedAttempts} ❌`);
      console.log(`  Success Rate:           ${stats.successRate.toFixed(1)}%`);
      console.log(`  Average Duration:       ${stats.averageDuration.toFixed(0)}ms`);
      console.log('');

      // Per-fix breakdown
      console.log('═══════════════════════════════════════════════════');
      console.log('Fix Breakdown');
      console.log('═══════════════════════════════════════════════════');

      const fixStats = Object.values(stats.fixBreakdown).sort((a: any, b: any) =>
        b.attempts - a.attempts
      );

      fixStats.forEach((fix: any) => {
        console.log(`  ${fix.fixName}:`);
        console.log(`    Attempts:         ${fix.attempts}`);
        console.log(`    Successes:        ${fix.successes}`);
        console.log(`    Failures:         ${fix.failures}`);
        console.log(`    Success Rate:     ${fix.successRate.toFixed(1)}%`);
        console.log(`    Avg Duration:     ${fix.averageDuration.toFixed(0)}ms`);
        console.log('');
      });

      // Recent failures
      if (stats.recentFailures.length > 0) {
        console.log('═══════════════════════════════════════════════════');
        console.log('Recent Failures');
        console.log('═══════════════════════════════════════════════════');

        stats.recentFailures.forEach((failure: any, index: number) => {
          const date = new Date(failure.timestamp).toLocaleString();
          console.log(`  ${index + 1}. ${failure.testName}`);
          console.log(`     Time:    ${date}`);
          console.log(`     Error:   ${failure.errorMessage.substring(0, 80)}...`);
          console.log(`     Fixes:   ${failure.fixesAttempted} attempted`);
          console.log('');
        });
      }

      // Success trend
      const trend = history.getSuccessTrend(Math.min(days, 7));
      console.log('═══════════════════════════════════════════════════');
      console.log('Success Trend (Last 7 Days)');
      console.log('═══════════════════════════════════════════════════');

      trend.forEach((day: any) => {
        if (day.totalAttempts > 0) {
          const bar = '█'.repeat(Math.floor(day.successRate / 10));
          console.log(`  ${day.date}:  ${bar} ${day.successRate.toFixed(0)}% (${day.successes}/${day.totalAttempts})`);
        }
      });
      console.log('');

    } catch (error) {
      console.error('❌ Error reading fix history:', (error as Error).message);
      console.error('   Make sure you have run tests with --auto-fix enabled.\n');
      process.exit(1);
    }
  });

program.parse();
