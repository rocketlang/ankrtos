// password-policy.ts — SOC2-Compliant Password Policy Service

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
  preventUserInfo: boolean; // prevent username, email in password
  maxAge: number; // days until password expires
  preventReuse: number; // number of previous passwords to check
  lockoutAttempts: number;
  lockoutDuration: number; // minutes
}

// SOC2-compliant default policy
const DEFAULT_POLICY: PasswordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfo: true,
  maxAge: 90, // 90 days
  preventReuse: 10, // last 10 passwords
  lockoutAttempts: 5,
  lockoutDuration: 30, // 30 minutes
};

// Common weak passwords (top 100 from breach databases)
const COMMON_PASSWORDS = new Set([
  'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
  'monkey', '1234567', 'letmein', 'trustno1', 'dragon', 'baseball',
  'iloveyou', 'master', 'sunshine', 'ashley', 'bailey', 'passw0rd',
  'shadow', '123123', '654321', 'superman', 'qazwsx', 'michael',
  'football', 'welcome', 'jesus', 'ninja', 'mustang', 'password1',
  'admin', 'Admin123', 'root', 'toor', 'pass', 'test', 'guest',
  'shipping', 'maritime', 'vessel', 'cargo', 'freight', 'charter',
  // Add more maritime-specific weak passwords
]);

export class PasswordPolicyService {
  private policy: PasswordPolicy;

  constructor(customPolicy?: Partial<PasswordPolicy>) {
    this.policy = { ...DEFAULT_POLICY, ...customPolicy };
  }

  /**
   * Validate password against policy
   */
  async validatePassword(
    password: string,
    username?: string,
    email?: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Length check
    if (password.length < this.policy.minLength) {
      errors.push(`Password must be at least ${this.policy.minLength} characters long`);
    }

    // Uppercase check
    if (this.policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Lowercase check
    if (this.policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Number check
    if (this.policy.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Special character check
    if (this.policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*...)');
    }

    // Common password check
    if (this.policy.preventCommonPasswords) {
      const lowerPassword = password.toLowerCase();
      if (COMMON_PASSWORDS.has(lowerPassword)) {
        errors.push('This password is too common. Please choose a stronger password');
      }

      // Check for simple patterns
      if (/^(.)\1+$/.test(password)) {
        errors.push('Password cannot be all the same character');
      }
      if (/^(012|123|234|345|456|567|678|789|890)+$/.test(password)) {
        errors.push('Password cannot be sequential numbers');
      }
      if (/^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+$/i.test(password)) {
        errors.push('Password cannot be sequential letters');
      }
    }

    // User info check
    if (this.policy.preventUserInfo && (username || email)) {
      const lowerPassword = password.toLowerCase();
      if (username && lowerPassword.includes(username.toLowerCase())) {
        errors.push('Password cannot contain your username');
      }
      if (email) {
        const emailParts = email.toLowerCase().split('@');
        if (emailParts[0] && lowerPassword.includes(emailParts[0])) {
          errors.push('Password cannot contain your email address');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if password has been used recently
   */
  async checkPasswordReuse(userId: string, newPassword: string): Promise<boolean> {
    if (this.policy.preventReuse === 0) return true;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHistory: true },
    });

    if (!user || !user.passwordHistory) return true;

    const history = user.passwordHistory as string[];
    const recentPasswords = history.slice(-this.policy.preventReuse);

    for (const oldPasswordHash of recentPasswords) {
      const matches = await bcrypt.compare(newPassword, oldPasswordHash);
      if (matches) {
        return false; // Password was used recently
      }
    }

    return true;
  }

  /**
   * Hash password and update user
   */
  async setPassword(userId: string, newPassword: string, username?: string, email?: string): Promise<void> {
    // Validate password
    const validation = await this.validatePassword(newPassword, username, email);
    if (!validation.valid) {
      throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
    }

    // Check reuse
    const canUse = await this.checkPasswordReuse(userId, newPassword);
    if (!canUse) {
      throw new Error(
        `Password was used recently. Please choose a password you haven't used in the last ${this.policy.preventReuse} changes.`
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Get current password history
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true, passwordHistory: true },
    });

    if (!user) throw new Error('User not found');

    // Update password history (add current password to history)
    const history = (user.passwordHistory as string[]) || [];
    if (user.password) {
      history.push(user.password);
    }

    // Keep only last N passwords
    const updatedHistory = history.slice(-this.policy.preventReuse);

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordHistory: updatedHistory,
        passwordChangedAt: new Date(),
        passwordExpiresAt: new Date(Date.now() + this.policy.maxAge * 24 * 60 * 60 * 1000),
        failedLoginAttempts: 0, // Reset on successful password change
        lockedUntil: null,
      },
    });
  }

  /**
   * Check if password has expired
   */
  async isPasswordExpired(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordExpiresAt: true },
    });

    if (!user || !user.passwordExpiresAt) return false;

    return user.passwordExpiresAt < new Date();
  }

  /**
   * Record failed login attempt
   */
  async recordFailedLogin(userId: string): Promise<{ locked: boolean; remainingAttempts: number }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true, lockedUntil: true },
    });

    if (!user) throw new Error('User not found');

    const attempts = (user.failedLoginAttempts || 0) + 1;

    // Check if should be locked
    if (attempts >= this.policy.lockoutAttempts) {
      const lockUntil = new Date(Date.now() + this.policy.lockoutDuration * 60 * 1000);

      await prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil: lockUntil,
        },
      });

      // Create security alert
      await prisma.alert.create({
        data: {
          organizationId: user.organizationId,
          type: 'account_locked',
          severity: 'high',
          title: 'Account Locked',
          message: `User account locked due to ${attempts} failed login attempts`,
          metadata: { userId, attempts, lockUntil },
          relatedEntityType: 'user',
          relatedEntityId: userId,
          status: 'active',
        },
      });

      return { locked: true, remainingAttempts: 0 };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: attempts },
    });

    return {
      locked: false,
      remainingAttempts: this.policy.lockoutAttempts - attempts,
    };
  }

  /**
   * Check if account is locked
   */
  async isAccountLocked(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lockedUntil: true },
    });

    if (!user || !user.lockedUntil) return false;

    // Check if lock has expired
    if (user.lockedUntil < new Date()) {
      // Unlock account
      await prisma.user.update({
        where: { id: userId },
        data: {
          lockedUntil: null,
          failedLoginAttempts: 0,
        },
      });
      return false;
    }

    return true;
  }

  /**
   * Reset failed login attempts (on successful login)
   */
  async resetFailedAttempts(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
      },
    });
  }

  /**
   * Get password strength score (0-100)
   */
  getPasswordStrength(password: string): number {
    let score = 0;

    // Length score (max 40 points)
    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
    if (password.length >= 20) score += 10;

    // Complexity score (max 40 points)
    if (/[a-z]/.test(password)) score += 10; // lowercase
    if (/[A-Z]/.test(password)) score += 10; // uppercase
    if (/[0-9]/.test(password)) score += 10; // numbers
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 10; // special

    // Uniqueness score (max 20 points)
    const uniqueChars = new Set(password).size;
    const uniqueRatio = uniqueChars / password.length;
    score += Math.round(uniqueRatio * 20);

    return Math.min(score, 100);
  }

  /**
   * Get policy information for display
   */
  getPolicy(): PasswordPolicy {
    return { ...this.policy };
  }
}

export const passwordPolicy = new PasswordPolicyService();
