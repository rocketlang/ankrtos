// mfa-service.ts — Multi-Factor Authentication Service (TOTP + SMS)

import * as otplib from 'otplib';
const { authenticator } = otplib;
import QRCode from 'qrcode';
import { PrismaClient } from '@prisma/client';
// import { sendSMS } from '@ankr/wire'; // Temporarily disabled for testing

const prisma = new PrismaClient();

interface MFASetupResult {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

interface SMSVerificationResult {
  success: boolean;
  remainingAttempts?: number;
  lockedUntil?: Date;
}

export class MFAService {
  /**
   * Generate TOTP secret and QR code for user setup
   */
  async setupTOTP(userId: string, email: string): Promise<MFASetupResult> {
    // Generate secret
    const secret = authenticator.generateSecret();

    // Generate QR code
    const otpauth = authenticator.keyuri(email, 'Mari8X', secret);
    const qrCode = await QRCode.toDataURL(otpauth);

    // Generate backup codes (10 codes)
    const backupCodes = this.generateBackupCodes(10);

    // Hash backup codes for storage
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(async (code) => {
        const bcrypt = await import('bcryptjs');
        return bcrypt.hash(code, 10);
      })
    );

    // Store MFA setup (not enabled yet)
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: secret,
        mfaBackupCodes: hashedBackupCodes,
        mfaEnabled: false, // Will be enabled after verification
      },
    });

    return {
      secret,
      qrCode,
      backupCodes, // Show to user once, they must save them
    };
  }

  /**
   * Verify TOTP token and enable MFA
   */
  async verifyAndEnableTOTP(userId: string, token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true },
    });

    if (!user || !user.mfaSecret) {
      throw new Error('MFA not set up for this user');
    }

    // Verify token
    const isValid = authenticator.verify({
      token,
      secret: user.mfaSecret,
    });

    if (!isValid) return false;

    // Enable MFA
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaMethod: 'totp',
      },
    });

    // Create security alert
    await prisma.alert.create({
      data: {
        organizationId: user.organizationId,
        type: 'mfa_enabled',
        severity: 'low',
        title: 'MFA Enabled',
        message: 'Two-factor authentication has been enabled for your account',
        metadata: { userId, method: 'totp' },
        relatedEntityType: 'user',
        relatedEntityId: userId,
        status: 'active',
      },
    });

    return true;
  }

  /**
   * Verify TOTP token during login
   */
  async verifyTOTP(userId: string, token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true, mfaEnabled: true, mfaBackupCodes: true },
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new Error('MFA not enabled for this user');
    }

    // Try regular TOTP verification
    const isValidTOTP = authenticator.verify({
      token,
      secret: user.mfaSecret,
    });

    if (isValidTOTP) {
      // Reset failed MFA attempts on successful verification
      await prisma.user.update({
        where: { id: userId },
        data: { failedMfaAttempts: 0 },
      });
      return true;
    }

    // Try backup code verification
    if (user.mfaBackupCodes && user.mfaBackupCodes.length > 0) {
      const backupCodes = user.mfaBackupCodes as string[];
      const bcrypt = await import('bcryptjs');

      for (let i = 0; i < backupCodes.length; i++) {
        const matches = await bcrypt.compare(token, backupCodes[i]);
        if (matches) {
          // Remove used backup code
          const updatedCodes = [...backupCodes];
          updatedCodes.splice(i, 1);

          await prisma.user.update({
            where: { id: userId },
            data: {
              mfaBackupCodes: updatedCodes,
              failedMfaAttempts: 0,
            },
          });

          // Alert if running low on backup codes
          if (updatedCodes.length <= 2) {
            await prisma.alert.create({
              data: {
                organizationId: user.organizationId,
                type: 'mfa_backup_low',
                severity: 'medium',
                title: 'Low Backup Codes',
                message: `Only ${updatedCodes.length} backup codes remaining. Generate new codes soon.`,
                metadata: { userId, remainingCodes: updatedCodes.length },
                relatedEntityType: 'user',
                relatedEntityId: userId,
                status: 'active',
              },
            });
          }

          return true;
        }
      }
    }

    // Record failed MFA attempt
    await this.recordFailedMFAAttempt(userId);

    return false;
  }

  /**
   * Setup SMS MFA
   */
  async setupSMS(userId: string, phoneNumber: string): Promise<void> {
    // Validate phone number format (E.164)
    if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
      throw new Error('Invalid phone number format. Must be E.164 format (e.g., +1234567890)');
    }

    // Generate verification code
    const code = this.generateSMSCode();

    // Store code with expiry (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaPhoneNumber: phoneNumber,
        mfaSmsCode: code,
        mfaSmsCodeExpiresAt: expiresAt,
      },
    });

    // Send SMS
    // await sendSMS({
    //   to: phoneNumber,
    //   message: `Your Mari8X verification code is: ${code}\n\nThis code expires in 5 minutes.`,
    // });
    console.log(`[MFA] SMS code for ${phoneNumber}: ${code} (expires in 5 minutes)`);
  }

  /**
   * Verify SMS code and enable MFA
   */
  async verifyAndEnableSMS(userId: string, code: string): Promise<SMSVerificationResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        mfaSmsCode: true,
        mfaSmsCodeExpiresAt: true,
        mfaPhoneNumber: true,
        failedMfaAttempts: true,
      },
    });

    if (!user) throw new Error('User not found');

    // Check if code expired
    if (!user.mfaSmsCodeExpiresAt || user.mfaSmsCodeExpiresAt < new Date()) {
      return { success: false, remainingAttempts: 0 };
    }

    // Verify code
    if (user.mfaSmsCode !== code) {
      const attempts = (user.failedMfaAttempts || 0) + 1;

      // Lock after 3 failed attempts
      if (attempts >= 3) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        await prisma.user.update({
          where: { id: userId },
          data: {
            failedMfaAttempts: attempts,
            lockedUntil: lockUntil,
          },
        });

        return { success: false, remainingAttempts: 0, lockedUntil: lockUntil };
      }

      await prisma.user.update({
        where: { id: userId },
        data: { failedMfaAttempts: attempts },
      });

      return { success: false, remainingAttempts: 3 - attempts };
    }

    // Enable MFA
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaMethod: 'sms',
        failedMfaAttempts: 0,
        mfaSmsCode: null,
        mfaSmsCodeExpiresAt: null,
      },
    });

    return { success: true };
  }

  /**
   * Send SMS code for login
   */
  async sendLoginSMS(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaPhoneNumber: true, mfaEnabled: true, mfaMethod: true },
    });

    if (!user || !user.mfaEnabled || user.mfaMethod !== 'sms' || !user.mfaPhoneNumber) {
      throw new Error('SMS MFA not enabled for this user');
    }

    // Generate code
    const code = this.generateSMSCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaSmsCode: code,
        mfaSmsCodeExpiresAt: expiresAt,
      },
    });

    // Send SMS
    // await sendSMS({
    //   to: user.mfaPhoneNumber,
    //   message: `Your Mari8X login code is: ${code}\n\nThis code expires in 5 minutes.`,
    // });
    console.log(`[MFA] SMS code for user ${userId}: ${code} (expires in 5 minutes)`);
  }

  /**
   * Verify SMS code during login
   */
  async verifySMS(userId: string, code: string): Promise<SMSVerificationResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        mfaSmsCode: true,
        mfaSmsCodeExpiresAt: true,
        failedMfaAttempts: true,
      },
    });

    if (!user) throw new Error('User not found');

    // Check if code expired
    if (!user.mfaSmsCodeExpiresAt || user.mfaSmsCodeExpiresAt < new Date()) {
      return { success: false, remainingAttempts: 0 };
    }

    // Verify code
    if (user.mfaSmsCode !== code) {
      await this.recordFailedMFAAttempt(userId);
      const attempts = (user.failedMfaAttempts || 0) + 1;
      return { success: false, remainingAttempts: Math.max(0, 3 - attempts) };
    }

    // Success - clear code and reset attempts
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaSmsCode: null,
        mfaSmsCodeExpiresAt: null,
        failedMfaAttempts: 0,
      },
    });

    return { success: true };
  }

  /**
   * Disable MFA
   */
  async disableMFA(userId: string, password: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) throw new Error('User not found');

    // Verify password before disabling MFA
    const bcrypt = await import('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaMethod: null,
        mfaSecret: null,
        mfaBackupCodes: null,
        mfaPhoneNumber: null,
      },
    });

    // Create security alert
    await prisma.alert.create({
      data: {
        organizationId: user.organizationId,
        type: 'mfa_disabled',
        severity: 'high',
        title: 'MFA Disabled',
        message: 'Two-factor authentication has been disabled for your account',
        metadata: { userId },
        relatedEntityType: 'user',
        relatedEntityId: userId,
        status: 'active',
      },
    });
  }

  /**
   * Generate new backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const backupCodes = this.generateBackupCodes(10);

    const bcrypt = await import('bcryptjs');
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => bcrypt.hash(code, 10))
    );

    await prisma.user.update({
      where: { id: userId },
      data: { mfaBackupCodes: hashedBackupCodes },
    });

    return backupCodes;
  }

  /**
   * Check if MFA is required for user role
   */
  isMFARequired(role: string): boolean {
    // MFA mandatory for admin roles (SOC2 compliance)
    const adminRoles = ['super_admin', 'company_admin', 'finance_manager', 'compliance_officer'];
    return adminRoles.includes(role);
  }

  /**
   * Private: Generate backup codes
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Private: Generate 6-digit SMS code
   */
  private generateSMSCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Private: Record failed MFA attempt
   */
  private async recordFailedMFAAttempt(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { failedMfaAttempts: true },
    });

    const attempts = (user?.failedMfaAttempts || 0) + 1;

    await prisma.user.update({
      where: { id: userId },
      data: { failedMfaAttempts: attempts },
    });
  }
}

export const mfaService = new MFAService();
