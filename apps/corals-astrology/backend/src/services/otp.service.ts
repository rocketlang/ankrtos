import { PrismaClient } from '@prisma/client';
import twilio from 'twilio';
import jwt from 'jsonwebtoken';

interface OTPConfig {
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioVerifyServiceSid?: string;
  twilioFromNumber?: string;
  twilioEnabled?: boolean;
  msg91AuthKey?: string;
  msg91SenderId?: string;
  msg91TemplateId?: string;
  jwtSecret: string;
  jwtExpiresIn?: string;
}

export class OTPService {
  private prisma: PrismaClient;
  private config: OTPConfig;
  private twilioClient?: any;

  constructor(prisma: PrismaClient, config: OTPConfig) {
    this.prisma = prisma;
    this.config = config;

    // Initialize Twilio if enabled
    if (config.twilioEnabled && config.twilioAccountSid && config.twilioAuthToken) {
      this.twilioClient = twilio(config.twilioAccountSid, config.twilioAuthToken);
      console.log('✅ Twilio OTP enabled');
    }
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOTP(identifier: string, type: 'phone' | 'email'): Promise<{ sent: boolean; message: string }> {
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await this.prisma.oTPVerification.upsert({
      where: {
        identifier_type: {
          identifier,
          type
        }
      },
      create: {
        identifier,
        otp,
        type,
        expiresAt,
        verified: false,
        attempts: 0
      },
      update: {
        otp,
        expiresAt,
        verified: false,
        attempts: 0
      }
    });

    if (type === 'phone') {
      await this.sendSMS(identifier, `Your CORALS Astrology OTP is ${otp}. Valid for 10 minutes.`);
    } else {
      await this.sendEmail(identifier, otp);
    }

    return { sent: true, message: `OTP sent to ${type}` };
  }

  private async sendSMS(phone: string, message: string): Promise<void> {
    if (!this.config.twilioEnabled || !this.twilioClient) {
      console.log(`📱 [DEV MODE] SMS to ${phone}: ${message}`);
      return;
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        to: phone,
        from: this.config.twilioFromNumber
      });

      console.log(`✅ SMS sent via Twilio!`);
      console.log(`   To: ${phone}`);
      console.log(`   SID: ${result.sid}`);
      console.log(`   Status: ${result.status}`);
    } catch (error: any) {
      console.error('❌ Twilio SMS error:', error.message);
      // Fallback to console in dev mode
      console.log(`📱 [FALLBACK] SMS to ${phone}: ${message}`);
    }
  }

  private async sendEmail(email: string, otp: string): Promise<void> {
    // TODO: Implement email sending
    console.log(`📧 Email to ${email}: Your CORALS Astrology OTP is ${otp}`);
  }

  async verifyOTP(identifier: string, otp: string, type: 'phone' | 'email'): Promise<{
    user: any;
    token: string;
  }> {
    // Get OTP record
    const otpRecord = await this.prisma.oTPVerification.findUnique({
      where: {
        identifier_type: {
          identifier,
          type
        }
      }
    });

    if (!otpRecord || otpRecord.verified) {
      throw new Error('OTP not found or already used');
    }

    if (otpRecord.expiresAt < new Date()) {
      throw new Error('OTP expired');
    }

    if (otpRecord.attempts >= 3) {
      throw new Error('Too many attempts');
    }

    if (otpRecord.otp !== otp) {
      await this.prisma.oTPVerification.update({
        where: {
          identifier_type: {
            identifier,
            type
          }
        },
        data: {
          attempts: otpRecord.attempts + 1
        }
      });
      throw new Error('Invalid OTP');
    }

    // Mark OTP as verified
    await this.prisma.oTPVerification.update({
      where: {
        identifier_type: {
          identifier,
          type
        }
      },
      data: {
        verified: true
      }
    });

    // Find or create user
    let user;
    if (type === 'phone') {
      user = await this.prisma.user.findUnique({ where: { phone: identifier } });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            phone: identifier,
            phoneVerified: true,
            provider: 'phone',
            firstName: 'User', // Default, can be updated later
            role: 'USER',
            isActive: true
          }
        });
      } else {
        user = await this.prisma.user.update({
          where: { phone: identifier },
          data: { phoneVerified: true, lastLoginAt: new Date() }
        });
      }
    } else {
      user = await this.prisma.user.findUnique({ where: { email: identifier } });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email: identifier,
            emailVerified: true,
            provider: 'email',
            firstName: 'User',
            role: 'USER',
            isActive: true
          }
        });
      } else {
        user = await this.prisma.user.update({
          where: { email: identifier },
          data: { emailVerified: true, lastLoginAt: new Date() }
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      this.config.jwtSecret,
      { expiresIn: this.config.jwtExpiresIn || '7d' }
    );

    return { user, token };
  }
}
