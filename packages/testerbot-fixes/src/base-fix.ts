/**
 * Base Fix Class - Helper for implementing fixes
 */

import { Fix, AutoFixResult, FailureContext, FixAction, FixState } from './types';

export abstract class BaseFix implements Fix {
  abstract id: string;
  abstract name: string;
  abstract description: string;
  abstract category: string;
  abstract tags: string[];
  abstract priority: number;

  protected actions: FixAction[] = [];

  /**
   * Check if this fix applies to the given failure
   */
  abstract canFix(context: FailureContext): boolean;

  /**
   * Apply the fix - must be implemented by subclass
   */
  protected abstract doApply(context: FailureContext): Promise<void>;

  /**
   * Verify the fix worked - must be implemented by subclass
   */
  abstract verify(context: FailureContext): Promise<boolean>;

  /**
   * Rollback the fix - must be implemented by subclass
   */
  abstract rollback(context: FailureContext): Promise<void>;

  /**
   * Apply implementation - wraps doApply with error handling and tracking
   */
  async apply(context: FailureContext): Promise<AutoFixResult> {
    this.actions = [];
    const startTime = Date.now();

    try {
      await this.doApply(context);

      return {
        fixId: this.id,
        fixName: this.name,
        success: true,
        applied: true,
        verified: false,  // Will be set by AutoFixEngine
        duration: Date.now() - startTime,
        actions: this.actions,
        rollbackAvailable: true
      };
    } catch (err) {
      return {
        fixId: this.id,
        fixName: this.name,
        success: false,
        applied: false,
        verified: false,
        duration: Date.now() - startTime,
        actions: this.actions,
        error: (err as Error).message,
        rollbackAvailable: false
      };
    }
  }

  /**
   * Helper: Execute a shell command and track it as an action
   */
  protected async executeCommand(
    type: string,
    description: string,
    command: string
  ): Promise<string> {
    const action: FixAction = {
      type,
      description,
      command,
      timestamp: Date.now(),
      success: false
    };

    try {
      // Use Node.js exec to run command
      const { execSync } = require('child_process');
      const output = execSync(command, { encoding: 'utf-8', timeout: 30000 });

      action.success = true;
      action.output = output;
      this.actions.push(action);

      return output;
    } catch (err) {
      action.success = false;
      action.error = (err as Error).message;
      this.actions.push(action);

      throw err;
    }
  }

  /**
   * Helper: Log an action without executing a command
   */
  protected logAction(
    type: string,
    description: string,
    success: boolean,
    output?: string,
    error?: string
  ): void {
    this.actions.push({
      type,
      description,
      timestamp: Date.now(),
      success,
      output,
      error
    });
  }

  /**
   * Helper: Check if error message matches a pattern
   */
  protected errorMatches(context: FailureContext, pattern: string | RegExp): boolean {
    if (typeof pattern === 'string') {
      return context.errorMessage.toLowerCase().includes(pattern.toLowerCase());
    }
    return pattern.test(context.errorMessage);
  }

  /**
   * Helper: Check if error matches any of several patterns
   */
  protected errorMatchesAny(context: FailureContext, patterns: Array<string | RegExp>): boolean {
    return patterns.some(pattern => this.errorMatches(context, pattern));
  }

  /**
   * Optional: Save state before applying fix
   */
  async saveState?(context: FailureContext): Promise<FixState>;

  /**
   * Optional: Restore state (rollback)
   */
  async restoreState?(state: FixState): Promise<void>;
}
