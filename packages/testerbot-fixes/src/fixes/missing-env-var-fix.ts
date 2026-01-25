/**
 * MissingEnvVarFix - Fixes missing environment variable errors
 */

import { BaseFix, FailureContext, FixState } from '../index';
import * as fs from 'fs';
import * as path from 'path';

export class MissingEnvVarFix extends BaseFix {
  id = 'fix-missing-env-var';
  name = 'Fix missing environment variables';
  description = 'Add missing environment variables with default values';
  category = 'environment';
  tags = ['env', 'environment', 'configuration'];
  priority = 60;

  private envFilePath = '.env';
  private envBackupPath = '.env.backup';

  /**
   * Check if this fix applies to the given failure
   */
  canFix(context: FailureContext): boolean {
    return this.errorMatchesAny(context, [
      /environment.*variable.*not.*set/i,
      /missing.*environment.*variable/i,
      /undefined.*environment.*variable/i,
      /required.*env.*var/i,
      /process\.env\.\w+.*undefined/i,
      /env\.\w+.*is.*not.*defined/i,
      /.*_URL.*is.*not.*defined/i,
      /.*_KEY.*is.*not.*defined/i
    ]);
  }

  /**
   * Apply the fix
   */
  protected async doApply(context: FailureContext): Promise<void> {
    console.log('   🔧 Attempting to fix missing environment variable...');

    // Extract variable name from error message
    const varName = this.extractEnvVarName(context.errorMessage);

    if (!varName) {
      console.log('   ⚠️  Could not extract environment variable name from error');
      throw new Error('Unable to determine which environment variable is missing');
    }

    console.log(`   📍 Missing variable: ${varName}`);

    // Step 1: Check if .env file exists
    const envPath = path.resolve(this.envFilePath);
    const envExists = fs.existsSync(envPath);

    if (!envExists) {
      console.log('   📝 Creating .env file...');
      this.logAction('create-env', 'Creating .env file', true);
    }

    // Step 2: Determine default value
    const defaultValue = this.getDefaultValue(varName);
    console.log(`   💡 Using default value: ${defaultValue}`);

    // Step 3: Backup existing .env
    if (envExists) {
      console.log('   💾 Backing up .env file...');
      try {
        fs.copyFileSync(envPath, this.envBackupPath);
        this.logAction('backup-env', 'Backed up .env file', true);
      } catch (err) {
        this.logAction('backup-env', 'Backup failed', false, undefined, (err as Error).message);
      }
    }

    // Step 4: Add variable to .env
    console.log(`   ✍️  Adding ${varName} to .env...`);
    try {
      const envContent = envExists ? fs.readFileSync(envPath, 'utf-8') : '';
      const newLine = `${varName}=${defaultValue}\n`;

      // Check if variable already exists
      if (envContent.includes(`${varName}=`)) {
        // Variable exists but might be empty - replace it
        const updatedContent = envContent.replace(
          new RegExp(`^${varName}=.*$`, 'm'),
          `${varName}=${defaultValue}`
        );
        fs.writeFileSync(envPath, updatedContent);
        this.logAction('update-env-var', `Updated ${varName} in .env`, true);
      } else {
        // Variable doesn't exist - append it
        fs.appendFileSync(envPath, newLine);
        this.logAction('add-env-var', `Added ${varName} to .env`, true);
      }
    } catch (err) {
      throw new Error(`Failed to update .env file: ${(err as Error).message}`);
    }

    console.log('   ✅ Environment variable fix completed');
  }

  /**
   * Verify the fix worked
   */
  async verify(context: FailureContext): Promise<boolean> {
    const varName = this.extractEnvVarName(context.errorMessage);

    if (!varName) {
      return false;
    }

    try {
      // Check if .env file exists and contains the variable
      const envPath = path.resolve(this.envFilePath);

      if (!fs.existsSync(envPath)) {
        this.logAction('verify-env', '.env file not found', false);
        return false;
      }

      const envContent = fs.readFileSync(envPath, 'utf-8');
      const hasVar = new RegExp(`^${varName}=.+$`, 'm').test(envContent);

      if (hasVar) {
        this.logAction('verify-env', `${varName} is now defined in .env`, true);
        return true;
      } else {
        this.logAction('verify-env', `${varName} not found in .env`, false);
        return false;
      }
    } catch (err) {
      this.logAction('verify-env', 'Verification error', false, undefined, (err as Error).message);
      return false;
    }
  }

  /**
   * Rollback the fix
   */
  async rollback(context: FailureContext): Promise<void> {
    // Restore .env backup if it exists
    const backupPath = path.resolve(this.envBackupPath);

    if (fs.existsSync(backupPath)) {
      try {
        const envPath = path.resolve(this.envFilePath);
        fs.copyFileSync(backupPath, envPath);
        fs.unlinkSync(backupPath);
        this.logAction('rollback-env', 'Restored .env from backup', true);
      } catch (err) {
        this.logAction('rollback-env', 'Rollback failed', false, undefined, (err as Error).message);
      }
    } else {
      this.logAction('rollback-env', 'No backup to restore', false);
    }
  }

  /**
   * Save state before applying fix
   */
  async saveState(context: FailureContext): Promise<FixState> {
    const envPath = path.resolve(this.envFilePath);
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    return {
      timestamp: Date.now(),
      description: 'Saved .env state',
      data: {
        envContent,
        envExists: fs.existsSync(envPath)
      }
    };
  }

  /**
   * Restore state (rollback)
   */
  async restoreState(state: FixState): Promise<void> {
    const envPath = path.resolve(this.envFilePath);

    try {
      if (state.data.envExists) {
        fs.writeFileSync(envPath, state.data.envContent);
        this.logAction('restore-state', 'Restored .env from saved state', true);
      } else {
        // .env didn't exist before, remove it
        if (fs.existsSync(envPath)) {
          fs.unlinkSync(envPath);
        }
        this.logAction('restore-state', 'Removed .env (did not exist before fix)', true);
      }
    } catch (err) {
      this.logAction('restore-state', 'State restoration failed', false, undefined, (err as Error).message);
    }
  }

  /**
   * Extract environment variable name from error message
   */
  private extractEnvVarName(errorMessage: string): string | null {
    // Try common patterns
    const patterns = [
      /environment variable ['"]?(\w+)['"]?/i,
      /env var ['"]?(\w+)['"]?/i,
      /process\.env\.(\w+)/i,
      /env\.(\w+)/i,
      /['"](\w+_(?:URL|KEY|SECRET|TOKEN|API|DATABASE|HOST|PORT))['"].*undefined/i,
      /(\w+_(?:URL|KEY|SECRET|TOKEN|API|DATABASE|HOST|PORT)).*not.*defined/i
    ];

    for (const pattern of patterns) {
      const match = errorMessage.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Get default value for common environment variables
   */
  private getDefaultValue(varName: string): string {
    const defaults: Record<string, string> = {
      // Database
      'DATABASE_URL': 'postgresql://localhost:5432/testdb',
      'DB_HOST': 'localhost',
      'DB_PORT': '5432',
      'DB_NAME': 'testdb',
      'DB_USER': 'postgres',
      'DB_PASSWORD': 'password',

      // Redis
      'REDIS_URL': 'redis://localhost:6379',
      'REDIS_HOST': 'localhost',
      'REDIS_PORT': '6379',

      // Node
      'NODE_ENV': 'development',
      'PORT': '3000',

      // API Keys (use placeholder)
      'API_KEY': 'your-api-key-here',
      'API_SECRET': 'your-api-secret-here',
      'API_TOKEN': 'your-api-token-here',

      // URLs
      'API_URL': 'http://localhost:3000/api',
      'BASE_URL': 'http://localhost:3000'
    };

    // Check exact match
    if (defaults[varName]) {
      return defaults[varName];
    }

    // Check suffix patterns
    if (varName.endsWith('_URL')) {
      return 'http://localhost:3000';
    }
    if (varName.endsWith('_PORT')) {
      return '3000';
    }
    if (varName.endsWith('_HOST')) {
      return 'localhost';
    }
    if (varName.endsWith('_KEY') || varName.endsWith('_SECRET') || varName.endsWith('_TOKEN')) {
      return 'placeholder-replace-me';
    }

    // Default fallback
    return 'default-value';
  }
}
