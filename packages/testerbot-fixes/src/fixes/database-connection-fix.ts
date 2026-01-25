/**
 * DatabaseConnectionFix - Fixes database connection issues
 */

import { BaseFix, FailureContext } from '../index';

export class DatabaseConnectionFix extends BaseFix {
  id = 'fix-database-connection';
  name = 'Fix database connection failures';
  description = 'Restart PostgreSQL service and verify connection';
  category = 'database';
  tags = ['database', 'postgresql', 'connection'];
  priority = 90;

  /**
   * Check if this fix applies to the given failure
   */
  canFix(context: FailureContext): boolean {
    return this.errorMatchesAny(context, [
      /database.*connection.*failed/i,
      /could not connect to.*database/i,
      /ECONNREFUSED.*5432/i,
      /postgres.*not.*running/i,
      /connection.*refused.*postgres/i,
      /cannot connect to.*postgresql/i,
      /database.*not.*reachable/i,
      /timeout.*connecting.*database/i
    ]);
  }

  /**
   * Apply the fix
   */
  protected async doApply(context: FailureContext): Promise<void> {
    console.log('   🗄️  Attempting to fix database connection...');

    // Step 1: Check PostgreSQL status
    console.log('   📊 Checking PostgreSQL status...');
    try {
      const status = await this.executeCommand(
        'check-postgres-status',
        'Check PostgreSQL service status',
        'systemctl is-active postgresql || service postgresql status'
      );

      if (status.includes('active') || status.includes('running')) {
        console.log('   ℹ️  PostgreSQL is running, attempting restart anyway...');
      }
    } catch (err) {
      console.log('   ⚠️  PostgreSQL appears to be stopped');
    }

    // Step 2: Restart PostgreSQL
    console.log('   🔄 Restarting PostgreSQL...');
    try {
      await this.executeCommand(
        'restart-postgres',
        'Restart PostgreSQL service',
        'sudo systemctl restart postgresql || sudo service postgresql restart'
      );
    } catch (err) {
      // Try alternative restart commands
      try {
        await this.executeCommand(
          'restart-postgres-alt',
          'Restart PostgreSQL (alternative method)',
          'pg_ctl restart -D /var/lib/postgresql/data || sudo /etc/init.d/postgresql restart'
        );
      } catch (altErr) {
        this.logAction('restart-postgres', 'All restart methods failed', false, undefined, (altErr as Error).message);
        throw new Error('Failed to restart PostgreSQL service');
      }
    }

    // Step 3: Wait for PostgreSQL to start
    console.log('   ⏳ Waiting for PostgreSQL to be ready...');
    await this.sleep(3000);

    // Step 4: Test connection
    console.log('   🔌 Testing database connection...');
    await this.executeCommand(
      'test-connection',
      'Test PostgreSQL connection',
      'pg_isready -h localhost || psql -h localhost -U postgres -c "SELECT 1" > /dev/null 2>&1'
    );

    console.log('   ✅ Database connection fix completed');
  }

  /**
   * Verify the fix worked
   */
  async verify(context: FailureContext): Promise<boolean> {
    // Test if PostgreSQL is accepting connections
    try {
      const { execSync } = require('child_process');

      // Method 1: pg_isready
      try {
        execSync('pg_isready -h localhost', { encoding: 'utf-8' });
        this.logAction('verify-connection', 'PostgreSQL is accepting connections (pg_isready)', true);
        return true;
      } catch (err) {
        // Try method 2
      }

      // Method 2: Check if port 5432 is listening
      try {
        const result = execSync('netstat -tuln | grep 5432 || ss -tuln | grep 5432', { encoding: 'utf-8' });
        if (result.includes('5432')) {
          this.logAction('verify-connection', 'PostgreSQL port 5432 is listening', true);
          return true;
        }
      } catch (err) {
        // Port not listening
      }

      this.logAction('verify-connection', 'PostgreSQL connection test failed', false);
      return false;

    } catch (err) {
      this.logAction('verify-connection', 'Verification error', false, undefined, (err as Error).message);
      return false;
    }
  }

  /**
   * Rollback the fix
   */
  async rollback(context: FailureContext): Promise<void> {
    // Restarting PostgreSQL is generally safe and doesn't need rollback
    // If it was running before, it's running now
    // If it wasn't running before, we've helped by starting it
    this.logAction('rollback', 'No rollback necessary for database service restart', true);
  }

  /**
   * Helper: Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
