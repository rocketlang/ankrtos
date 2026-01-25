/**
 * TesterBot Notification System
 * Send test results to Slack, Discord, and Email
 */

import { TestReport, TestResult, NotificationConfig } from './types';

export class Notifier {
  constructor(private config: NotificationConfig) {}

  /**
   * Send test report to all configured channels
   */
  async sendReport(report: TestReport): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.config.slack) {
      promises.push(this.sendToSlack(report));
    }

    if (this.config.discord) {
      promises.push(this.sendToDiscord(report));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send report to Slack
   */
  private async sendToSlack(report: TestReport): Promise<void> {
    if (!this.config.slack) return;

    const { total, passed, failed, skipped, duration } = report.summary;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    const status = failed === 0 ? ':white_check_mark:' : ':x:';
    const color = failed === 0 ? 'good' : 'danger';

    // Build list of failed tests
    const failedTests = report.tests
      .filter((r: TestResult) => r.status === 'fail')
      .slice(0, 10) // Limit to 10
      .map((r: TestResult) => `• ${r.testName}: ${r.error || 'Failed'}`)
      .join('\n');

    const message = {
      username: 'TesterBot',
      attachments: [
        {
          color: color,
          title: `${status} Test Results`,
          fields: [
            {
              title: 'Total Tests',
              value: total.toString(),
              short: true
            },
            {
              title: 'Passed',
              value: `${passed} (${passRate}%)`,
              short: true
            },
            {
              title: 'Failed',
              value: failed.toString(),
              short: true
            },
            {
              title: 'Duration',
              value: `${(duration / 1000).toFixed(1)}s`,
              short: true
            },
            {
              title: 'App',
              value: report.app || 'Unknown',
              short: true
            },
            {
              title: 'Environment',
              value: report.environment || process.env.CI ? 'CI' : 'Local',
              short: true
            }
          ],
          text: failedTests ? `*Failed Tests:*\n${failedTests}` : undefined,
          footer: 'TesterBot',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };

    try {
      const response = await fetch(this.config.slack, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
      throw error;
    }
  }

  /**
   * Send report to Discord
   */
  private async sendToDiscord(report: TestReport): Promise<void> {
    if (!this.config.discord) return;

    const { total, passed, failed, skipped, duration } = report.summary;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    const status = failed === 0 ? '✅' : '❌';
    const color = failed === 0 ? 0x00ff00 : 0xff0000;

    // Build list of failed tests
    const failedTests = report.tests
      .filter((r: TestResult) => r.status === 'fail')
      .slice(0, 10)
      .map((r: TestResult) => `• ${r.testName}: ${r.error || 'Failed'}`)
      .join('\n');

    const embed = {
      title: `${status} Test Results`,
      color: color,
      fields: [
        {
          name: 'Total Tests',
          value: total.toString(),
          inline: true
        },
        {
          name: 'Passed',
          value: `${passed} (${passRate}%)`,
          inline: true
        },
        {
          name: 'Failed',
          value: failed.toString(),
          inline: true
        },
        {
          name: 'Duration',
          value: `${(duration / 1000).toFixed(1)}s`,
          inline: true
        },
        {
          name: 'App',
          value: report.app || 'Unknown',
          inline: true
        },
        {
          name: 'Environment',
          value: report.environment || (process.env.CI ? 'CI' : 'Local'),
          inline: true
        }
      ],
      description: failedTests ? `**Failed Tests:**\n${failedTests}` : undefined,
      footer: {
        text: 'TesterBot'
      },
      timestamp: new Date().toISOString()
    };

    const message = {
      username: 'TesterBot',
      embeds: [embed]
    };

    try {
      const response = await fetch(this.config.discord, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
      throw error;
    }
  }
}

/**
 * Create notifier from environment variables
 */
export function createNotifierFromEnv(): Notifier | null {
  const config: NotificationConfig = {};

  // Slack configuration
  if (process.env.SLACK_WEBHOOK_URL) {
    config.slack = process.env.SLACK_WEBHOOK_URL;
  }

  // Discord configuration
  if (process.env.DISCORD_WEBHOOK_URL) {
    config.discord = process.env.DISCORD_WEBHOOK_URL;
  }

  // Return null if no notifications configured
  if (!config.slack && !config.discord) {
    return null;
  }

  return new Notifier(config);
}
