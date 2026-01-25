/**
 * ServiceCrashedFix - Fixes crashed service errors
 */

import { BaseFix, FailureContext } from '../index';

export class ServiceCrashedFix extends BaseFix {
  id = 'fix-service-crashed';
  name = 'Fix crashed services';
  description = 'Restart crashed services (Redis, PostgreSQL, nginx, etc.)';
  category = 'service';
  tags = ['service', 'redis', 'nginx', 'systemd'];
  priority = 85;

  /**
   * Check if this fix applies to the given failure
   */
  canFix(context: FailureContext): boolean {
    return this.errorMatchesAny(context, [
      /redis.*not.*running/i,
      /redis.*connection.*refused/i,
      /ECONNREFUSED.*6379/i,
      /nginx.*not.*running/i,
      /nginx.*failed/i,
      /service.*crashed/i,
      /service.*not.*running/i,
      /service.*failed/i,
      /systemd.*failed/i
    ]);
  }

  /**
   * Apply the fix
   */
  protected async doApply(context: FailureContext): Promise<void> {
    console.log('   🔧 Attempting to fix crashed service...');

    // Detect which service crashed
    const service = this.detectService(context.errorMessage);

    if (!service) {
      console.log('   ⚠️  Could not determine which service crashed');
      throw new Error('Unable to determine which service to restart');
    }

    console.log(`   📍 Detected service: ${service}`);

    // Step 1: Check service status
    console.log(`   📊 Checking ${service} status...`);
    try {
      const status = await this.executeCommand(
        'check-service-status',
        `Check ${service} service status`,
        `systemctl is-active ${service} || service ${service} status`
      );

      if (status.includes('active') || status.includes('running')) {
        console.log(`   ℹ️  ${service} is running, attempting restart anyway...`);
      }
    } catch (err) {
      console.log(`   ⚠️  ${service} appears to be stopped or crashed`);
    }

    // Step 2: Check logs for crash reason (informational)
    try {
      console.log(`   📋 Checking ${service} logs...`);
      const logs = await this.executeCommand(
        'check-logs',
        `Check ${service} logs`,
        `journalctl -u ${service} -n 20 --no-pager || tail -20 /var/log/${service}/*.log`
      );

      // Log summary (don't fail if logs can't be read)
      if (logs.includes('error') || logs.includes('failed')) {
        console.log(`   ⚠️  Found errors in ${service} logs`);
      }
    } catch (err) {
      // Log reading is optional
      this.logAction('check-logs', 'Could not read service logs', false);
    }

    // Step 3: Restart the service
    console.log(`   🔄 Restarting ${service}...`);
    try {
      await this.executeCommand(
        'restart-service',
        `Restart ${service} service`,
        `sudo systemctl restart ${service} || sudo service ${service} restart`
      );
    } catch (err) {
      // Try alternative restart methods
      try {
        await this.executeCommand(
          'restart-service-alt',
          `Restart ${service} (alternative method)`,
          await this.getAlternativeRestartCommand(service)
        );
      } catch (altErr) {
        throw new Error(`Failed to restart ${service}: ${(altErr as Error).message}`);
      }
    }

    // Step 4: Wait for service to start
    console.log(`   ⏳ Waiting for ${service} to be ready...`);
    await this.sleep(2000);

    // Step 5: Verify service is running
    console.log(`   ✓ Verifying ${service} is running...`);
    await this.executeCommand(
      'verify-service',
      `Verify ${service} is running`,
      `systemctl is-active ${service} || service ${service} status | grep -i running`
    );

    console.log('   ✅ Service restart fix completed');
  }

  /**
   * Verify the fix worked
   */
  async verify(context: FailureContext): Promise<boolean> {
    const service = this.detectService(context.errorMessage);

    if (!service) {
      return false;
    }

    try {
      const { execSync } = require('child_process');

      // Check if service is active
      try {
        const result = execSync(`systemctl is-active ${service}`, { encoding: 'utf-8' });
        if (result.trim() === 'active') {
          this.logAction('verify-service', `${service} is active`, true);
          return true;
        }
      } catch (err) {
        // Try alternative check
      }

      // Alternative: Check if service process is running
      try {
        const result = execSync(`pgrep -x ${service} || pgrep ${service}`, { encoding: 'utf-8' });
        if (result.trim()) {
          this.logAction('verify-service', `${service} process is running`, true);
          return true;
        }
      } catch (err) {
        // Service not running
      }

      this.logAction('verify-service', `${service} is not running`, false);
      return false;

    } catch (err) {
      this.logAction('verify-service', 'Verification error', false, undefined, (err as Error).message);
      return false;
    }
  }

  /**
   * Rollback the fix
   */
  async rollback(context: FailureContext): Promise<void> {
    // Restarting a service is generally safe and doesn't need rollback
    // If it was running before, it's running now
    // If it wasn't running before, we've helped by starting it
    this.logAction('rollback', 'No rollback necessary for service restart', true);
  }

  /**
   * Detect which service crashed from error message
   */
  private detectService(errorMessage: string): string | null {
    const services = [
      'redis',
      'redis-server',
      'postgresql',
      'postgres',
      'nginx',
      'apache2',
      'httpd',
      'mongodb',
      'mongod',
      'mysql',
      'mysqld',
      'rabbitmq',
      'rabbitmq-server',
      'memcached',
      'elasticsearch'
    ];

    for (const service of services) {
      if (new RegExp(service, 'i').test(errorMessage)) {
        return service;
      }
    }

    // Check for port numbers to infer service
    if (errorMessage.includes('6379')) {
      return 'redis';
    }
    if (errorMessage.includes('5432')) {
      return 'postgresql';
    }
    if (errorMessage.includes('27017')) {
      return 'mongodb';
    }
    if (errorMessage.includes('3306')) {
      return 'mysql';
    }
    if (errorMessage.includes('5672')) {
      return 'rabbitmq';
    }

    return null;
  }

  /**
   * Get alternative restart command for specific services
   */
  private async getAlternativeRestartCommand(service: string): Promise<string> {
    const commands: Record<string, string> = {
      'redis': 'redis-cli shutdown && redis-server --daemonize yes',
      'redis-server': 'redis-cli shutdown && redis-server --daemonize yes',
      'postgresql': 'pg_ctl restart -D /var/lib/postgresql/data',
      'postgres': 'pg_ctl restart -D /var/lib/postgresql/data',
      'nginx': '/etc/init.d/nginx restart',
      'mongodb': 'mongod --fork --logpath /var/log/mongodb/mongod.log',
      'mongod': 'mongod --fork --logpath /var/log/mongodb/mongod.log'
    };

    return commands[service] || `/etc/init.d/${service} restart`;
  }

  /**
   * Helper: Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
