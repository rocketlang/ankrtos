/**
 * PortInUseFix - Fixes "port already in use" errors
 */

import { BaseFix, FailureContext, FixState } from '../index';

export class PortInUseFix extends BaseFix {
  id = 'fix-port-in-use';
  name = 'Fix port already in use';
  description = 'Find and kill process using the required port';
  category = 'network';
  tags = ['port', 'network', 'eaddrinuse'];
  priority = 75;

  private killedProcesses: Array<{ port: number; pid: number }> = [];

  /**
   * Check if this fix applies to the given failure
   */
  canFix(context: FailureContext): boolean {
    return this.errorMatchesAny(context, [
      /port.*already.*in.*use/i,
      /EADDRINUSE/i,
      /address.*already.*in.*use/i,
      /bind.*EADDRINUSE/i,
      /listen.*EADDRINUSE/i
    ]);
  }

  /**
   * Apply the fix
   */
  protected async doApply(context: FailureContext): Promise<void> {
    console.log('   🔌 Attempting to fix port-in-use error...');

    // Extract port number from error message
    const port = this.extractPort(context.errorMessage);

    if (!port) {
      console.log('   ⚠️  Could not extract port number from error');
      throw new Error('Unable to determine which port is in use');
    }

    console.log(`   📍 Port ${port} is in use`);

    // Step 1: Find process using the port
    console.log(`   🔍 Finding process using port ${port}...`);
    let pid: number | null = null;

    try {
      const output = await this.executeCommand(
        'find-process',
        `Find process using port ${port}`,
        `lsof -ti :${port} || fuser ${port}/tcp 2>/dev/null || netstat -tlnp 2>/dev/null | grep :${port} | awk '{print $7}' | cut -d/ -f1`
      );

      // Extract PID from output
      const pidMatch = output.trim().match(/\d+/);
      if (pidMatch) {
        pid = parseInt(pidMatch[0]);
        console.log(`   📌 Found process: PID ${pid}`);
      }
    } catch (err) {
      console.log('   ⚠️  Could not find process using port (may require sudo)');
    }

    if (!pid) {
      throw new Error(`Could not find process using port ${port}`);
    }

    // Step 2: Get process info before killing
    try {
      const processInfo = await this.executeCommand(
        'get-process-info',
        `Get info for PID ${pid}`,
        `ps -p ${pid} -o comm= || echo "unknown"`
      );
      console.log(`   ℹ️  Process: ${processInfo.trim()}`);
    } catch (err) {
      // Non-critical
    }

    // Step 3: Kill the process
    console.log(`   💀 Killing process ${pid}...`);
    try {
      await this.executeCommand(
        'kill-process',
        `Kill process ${pid} using port ${port}`,
        `kill ${pid} || sudo kill ${pid}`
      );

      // Track killed process for potential rollback
      this.killedProcesses.push({ port, pid });
    } catch (err) {
      // Try forceful kill
      try {
        await this.executeCommand(
          'force-kill-process',
          `Force kill process ${pid}`,
          `kill -9 ${pid} || sudo kill -9 ${pid}`
        );
        this.killedProcesses.push({ port, pid });
      } catch (forceErr) {
        throw new Error(`Failed to kill process ${pid}: ${(forceErr as Error).message}`);
      }
    }

    // Step 4: Wait a moment for port to be released
    console.log('   ⏳ Waiting for port to be released...');
    await this.sleep(1000);

    // Step 5: Verify port is now free
    console.log(`   ✓ Verifying port ${port} is free...`);
    await this.executeCommand(
      'verify-port-free',
      `Verify port ${port} is free`,
      `! (lsof -ti :${port} || fuser ${port}/tcp 2>/dev/null)`
    );

    console.log('   ✅ Port-in-use fix completed');
  }

  /**
   * Verify the fix worked
   */
  async verify(context: FailureContext): Promise<boolean> {
    const port = this.extractPort(context.errorMessage);

    if (!port) {
      return false;
    }

    try {
      const { execSync } = require('child_process');

      // Check if port is free
      try {
        execSync(`lsof -ti :${port}`, { encoding: 'utf-8' });
        // If we get here, port is still in use
        this.logAction('verify-port-free', `Port ${port} is still in use`, false);
        return false;
      } catch (err) {
        // Error means no process found - port is free!
        this.logAction('verify-port-free', `Port ${port} is now free`, true);
        return true;
      }
    } catch (err) {
      this.logAction('verify-port-free', 'Verification error', false, undefined, (err as Error).message);
      return false;
    }
  }

  /**
   * Rollback the fix
   */
  async rollback(context: FailureContext): Promise<void> {
    // We killed processes - can't easily restart them
    // Log warning that processes were killed
    if (this.killedProcesses.length > 0) {
      const killed = this.killedProcesses.map(p => `PID ${p.pid} (port ${p.port})`).join(', ');
      this.logAction(
        'rollback-warning',
        `Warning: Killed processes cannot be automatically restarted: ${killed}`,
        false
      );
    }
  }

  /**
   * Save state before applying fix
   */
  async saveState(context: FailureContext): Promise<FixState> {
    const port = this.extractPort(context.errorMessage);

    return {
      timestamp: Date.now(),
      description: `Port ${port} in use`,
      data: {
        port,
        killedProcesses: this.killedProcesses
      }
    };
  }

  /**
   * Extract port number from error message
   */
  private extractPort(errorMessage: string): number | null {
    // Try common patterns
    const patterns = [
      /:(\d+)/,                    // :3000
      /port\s+(\d+)/i,             // port 3000
      /EADDRINUSE.*:(\d+)/i,       // EADDRINUSE :3000
      /address.*:(\d+)/i           // address already in use :3000
    ];

    for (const pattern of patterns) {
      const match = errorMessage.match(pattern);
      if (match && match[1]) {
        const port = parseInt(match[1]);
        if (port > 0 && port < 65536) {
          return port;
        }
      }
    }

    return null;
  }

  /**
   * Helper: Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
