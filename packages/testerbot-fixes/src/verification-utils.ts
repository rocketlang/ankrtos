/**
 * Verification Utilities
 * Helper functions for verifying fix effectiveness
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface VerificationResult {
  verified: boolean;
  checks: VerificationCheck[];
  summary: string;
}

export interface VerificationCheck {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

/**
 * Verification utility class
 */
export class VerificationUtils {
  /**
   * Verify a service is running
   */
  static verifyServiceRunning(serviceName: string): VerificationResult {
    const checks: VerificationCheck[] = [];

    // Check 1: systemctl is-active
    try {
      const result = execSync(`systemctl is-active ${serviceName}`, { encoding: 'utf-8' });
      const isActive = result.trim() === 'active';
      checks.push({
        name: 'systemctl-check',
        passed: isActive,
        message: isActive ? 'Service is active' : 'Service is not active',
        details: { status: result.trim() }
      });
    } catch (err) {
      checks.push({
        name: 'systemctl-check',
        passed: false,
        message: 'Failed to check systemctl status',
        details: { error: (err as Error).message }
      });
    }

    // Check 2: Process is running
    try {
      const result = execSync(`pgrep -x ${serviceName} || pgrep ${serviceName}`, { encoding: 'utf-8' });
      const hasProcess = result.trim().length > 0;
      checks.push({
        name: 'process-check',
        passed: hasProcess,
        message: hasProcess ? `Process found (PID: ${result.trim()})` : 'Process not found',
        details: { pid: result.trim() }
      });
    } catch (err) {
      checks.push({
        name: 'process-check',
        passed: false,
        message: 'No process found',
        details: { error: (err as Error).message }
      });
    }

    const verified = checks.some(c => c.passed);
    return {
      verified,
      checks,
      summary: verified
        ? `${serviceName} is running (${checks.filter(c => c.passed).length}/${checks.length} checks passed)`
        : `${serviceName} is not running (0/${checks.length} checks passed)`
    };
  }

  /**
   * Verify a port is available (not in use)
   */
  static verifyPortFree(port: number): VerificationResult {
    const checks: VerificationCheck[] = [];

    // Check 1: lsof
    try {
      execSync(`lsof -ti :${port}`, { encoding: 'utf-8' });
      // If we get here, port is in use
      checks.push({
        name: 'lsof-check',
        passed: false,
        message: `Port ${port} is in use`,
        details: { port }
      });
    } catch (err) {
      // Error means port is free
      checks.push({
        name: 'lsof-check',
        passed: true,
        message: `Port ${port} is free`,
        details: { port }
      });
    }

    // Check 2: netstat
    try {
      const result = execSync(`netstat -tuln | grep :${port} || true`, { encoding: 'utf-8' });
      const inUse = result.includes(`:${port}`);
      checks.push({
        name: 'netstat-check',
        passed: !inUse,
        message: inUse ? `Port ${port} is in use` : `Port ${port} is free`,
        details: { port, output: result.trim() }
      });
    } catch (err) {
      // netstat might not be available
      checks.push({
        name: 'netstat-check',
        passed: true,
        message: 'netstat not available (assuming port free)',
        details: { error: (err as Error).message }
      });
    }

    const verified = checks.every(c => c.passed);
    return {
      verified,
      checks,
      summary: verified
        ? `Port ${port} is free (${checks.filter(c => c.passed).length}/${checks.length} checks passed)`
        : `Port ${port} is in use (${checks.filter(c => c.passed).length}/${checks.length} checks passed)`
    };
  }

  /**
   * Verify database connection
   */
  static verifyDatabaseConnection(
    host: string = 'localhost',
    port: number = 5432
  ): VerificationResult {
    const checks: VerificationCheck[] = [];

    // Check 1: pg_isready
    try {
      const result = execSync(`pg_isready -h ${host} -p ${port}`, { encoding: 'utf-8' });
      const accepting = result.includes('accepting connections');
      checks.push({
        name: 'pg_isready-check',
        passed: accepting,
        message: accepting ? 'PostgreSQL is accepting connections' : 'PostgreSQL is not ready',
        details: { host, port, output: result.trim() }
      });
    } catch (err) {
      checks.push({
        name: 'pg_isready-check',
        passed: false,
        message: 'pg_isready check failed',
        details: { error: (err as Error).message }
      });
    }

    // Check 2: Port listening
    try {
      const result = execSync(`netstat -tuln | grep ${port} || ss -tuln | grep ${port}`, { encoding: 'utf-8' });
      const listening = result.includes(`:${port}`);
      checks.push({
        name: 'port-listening-check',
        passed: listening,
        message: listening ? `Port ${port} is listening` : `Port ${port} is not listening`,
        details: { port, output: result.trim() }
      });
    } catch (err) {
      checks.push({
        name: 'port-listening-check',
        passed: false,
        message: 'Port check failed',
        details: { error: (err as Error).message }
      });
    }

    const verified = checks.some(c => c.passed);
    return {
      verified,
      checks,
      summary: verified
        ? `Database connection OK (${checks.filter(c => c.passed).length}/${checks.length} checks passed)`
        : `Database connection failed (0/${checks.length} checks passed)`
    };
  }

  /**
   * Verify file exists and has content
   */
  static verifyFileExists(filePath: string, options?: {
    checkContent?: boolean;
    minSize?: number;
    mustContain?: string[];
  }): VerificationResult {
    const checks: VerificationCheck[] = [];

    // Check 1: File exists
    const exists = fs.existsSync(filePath);
    checks.push({
      name: 'file-exists',
      passed: exists,
      message: exists ? 'File exists' : 'File does not exist',
      details: { filePath }
    });

    if (!exists) {
      return {
        verified: false,
        checks,
        summary: `File ${filePath} does not exist`
      };
    }

    // Check 2: File size
    if (options?.minSize !== undefined) {
      const stats = fs.statSync(filePath);
      const sizeOk = stats.size >= options.minSize;
      checks.push({
        name: 'file-size',
        passed: sizeOk,
        message: sizeOk
          ? `File size OK (${stats.size} bytes)`
          : `File too small (${stats.size} < ${options.minSize} bytes)`,
        details: { size: stats.size, minSize: options.minSize }
      });
    }

    // Check 3: File content
    if (options?.checkContent || options?.mustContain) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');

        if (options.mustContain) {
          for (const searchTerm of options.mustContain) {
            const contains = content.includes(searchTerm);
            checks.push({
              name: `contains-${searchTerm}`,
              passed: contains,
              message: contains
                ? `File contains "${searchTerm}"`
                : `File does not contain "${searchTerm}"`,
              details: { searchTerm }
            });
          }
        }
      } catch (err) {
        checks.push({
          name: 'read-content',
          passed: false,
          message: 'Failed to read file content',
          details: { error: (err as Error).message }
        });
      }
    }

    const verified = checks.every(c => c.passed);
    return {
      verified,
      checks,
      summary: verified
        ? `File ${filePath} verified (${checks.length}/${checks.length} checks passed)`
        : `File ${filePath} verification failed (${checks.filter(c => c.passed).length}/${checks.length} checks passed)`
    };
  }

  /**
   * Verify directory has content
   */
  static verifyDirectoryHasContent(dirPath: string, minFiles: number = 1): VerificationResult {
    const checks: VerificationCheck[] = [];

    // Check 1: Directory exists
    const exists = fs.existsSync(dirPath);
    checks.push({
      name: 'dir-exists',
      passed: exists,
      message: exists ? 'Directory exists' : 'Directory does not exist',
      details: { dirPath }
    });

    if (!exists) {
      return {
        verified: false,
        checks,
        summary: `Directory ${dirPath} does not exist`
      };
    }

    // Check 2: Directory has content
    const files = fs.readdirSync(dirPath);
    const hasContent = files.length >= minFiles;
    checks.push({
      name: 'has-content',
      passed: hasContent,
      message: hasContent
        ? `Directory has ${files.length} items (>= ${minFiles})`
        : `Directory has ${files.length} items (< ${minFiles})`,
      details: { count: files.length, minFiles }
    });

    const verified = checks.every(c => c.passed);
    return {
      verified,
      checks,
      summary: verified
        ? `Directory ${dirPath} verified (${files.length} items)`
        : `Directory ${dirPath} has insufficient content`
    };
  }

  /**
   * Verify environment variable is set
   */
  static verifyEnvVar(varName: string, options?: {
    mustMatch?: string | RegExp;
    mustNotBeEmpty?: boolean;
  }): VerificationResult {
    const checks: VerificationCheck[] = [];

    // Check 1: Variable exists
    const value = process.env[varName];
    const exists = value !== undefined;
    checks.push({
      name: 'var-exists',
      passed: exists,
      message: exists ? `${varName} is set` : `${varName} is not set`,
      details: { varName, exists }
    });

    if (!exists) {
      return {
        verified: false,
        checks,
        summary: `Environment variable ${varName} is not set`
      };
    }

    // Check 2: Not empty
    if (options?.mustNotBeEmpty !== false) {
      const notEmpty = value!.length > 0;
      checks.push({
        name: 'not-empty',
        passed: notEmpty,
        message: notEmpty ? 'Value is not empty' : 'Value is empty',
        details: { length: value!.length }
      });
    }

    // Check 3: Matches pattern
    if (options?.mustMatch) {
      const pattern = typeof options.mustMatch === 'string'
        ? new RegExp(options.mustMatch)
        : options.mustMatch;
      const matches = pattern.test(value!);
      checks.push({
        name: 'matches-pattern',
        passed: matches,
        message: matches ? 'Value matches pattern' : 'Value does not match pattern',
        details: { pattern: pattern.source }
      });
    }

    const verified = checks.every(c => c.passed);
    return {
      verified,
      checks,
      summary: verified
        ? `Environment variable ${varName} verified`
        : `Environment variable ${varName} verification failed`
    };
  }

  /**
   * Run multiple verifications and combine results
   */
  static combineVerifications(verifications: VerificationResult[]): VerificationResult {
    const allChecks = verifications.flatMap(v => v.checks);
    const allVerified = verifications.every(v => v.verified);

    return {
      verified: allVerified,
      checks: allChecks,
      summary: allVerified
        ? `All verifications passed (${allChecks.filter(c => c.passed).length}/${allChecks.length} checks)`
        : `Some verifications failed (${allChecks.filter(c => c.passed).length}/${allChecks.length} checks passed)`
    };
  }
}
