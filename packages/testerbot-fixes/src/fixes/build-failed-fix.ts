/**
 * BuildFailedFix - Fixes build failures by clearing cache and reinstalling
 */

import { BaseFix, FailureContext } from '../index';

export class BuildFailedFix extends BaseFix {
  id = 'fix-build-failed';
  name = 'Fix build failures';
  description = 'Clear node_modules, reinstall dependencies, and rebuild project';
  category = 'build';
  tags = ['build', 'dependencies', 'compile'];
  priority = 80;

  /**
   * Check if this fix applies to the given failure
   */
  canFix(context: FailureContext): boolean {
    return this.errorMatchesAny(context, [
      /build failed/i,
      /compilation failed/i,
      /cannot find module/i,
      /module not found/i,
      /could not resolve/i,
      /ENOENT.*node_modules/i,
      /typescript.*error/i,
      /tsc.*failed/i
    ]);
  }

  /**
   * Apply the fix
   */
  protected async doApply(context: FailureContext): Promise<void> {
    console.log('   📦 Attempting to fix build failure...');

    // Step 1: Clear node_modules
    try {
      console.log('   🗑️  Removing node_modules...');
      await this.executeCommand(
        'clear-node-modules',
        'Remove node_modules directory',
        'rm -rf node_modules'
      );
    } catch (err) {
      // If node_modules doesn't exist, that's fine
      this.logAction('clear-node-modules', 'node_modules not found (skipped)', true);
    }

    // Step 2: Clear pnpm cache (optional, helps with corrupted cache)
    try {
      console.log('   🧹 Clearing pnpm cache...');
      await this.executeCommand(
        'clear-cache',
        'Clear pnpm store cache',
        'pnpm store prune'
      );
    } catch (err) {
      // Cache clear failure is not critical
      this.logAction('clear-cache', 'Cache clear failed (non-critical)', false);
    }

    // Step 3: Install dependencies
    console.log('   📥 Installing dependencies...');
    await this.executeCommand(
      'install-dependencies',
      'Install dependencies with pnpm',
      'pnpm install --prefer-offline'
    );

    // Step 4: Build project
    console.log('   🔨 Building project...');
    await this.executeCommand(
      'build-project',
      'Build project with pnpm build',
      'pnpm build'
    );

    console.log('   ✅ Build fix completed');
  }

  /**
   * Verify the fix worked
   */
  async verify(context: FailureContext): Promise<boolean> {
    // Verification happens by re-running the test in the orchestrator
    // Here we just check if node_modules exists and has content
    try {
      const { execSync } = require('child_process');
      const result = execSync('ls node_modules | wc -l', { encoding: 'utf-8' });
      const count = parseInt(result.trim());

      if (count > 0) {
        this.logAction('verify-modules', `Found ${count} modules installed`, true);
        return true;
      } else {
        this.logAction('verify-modules', 'node_modules is empty', false);
        return false;
      }
    } catch (err) {
      this.logAction('verify-modules', 'Verification failed', false, undefined, (err as Error).message);
      return false;
    }
  }

  /**
   * Rollback the fix (not applicable for build fixes)
   */
  async rollback(context: FailureContext): Promise<void> {
    // Build fixes don't need rollback - they're idempotent
    // Worst case: we reinstalled dependencies
    this.logAction('rollback', 'No rollback necessary for build fix', true);
  }
}
