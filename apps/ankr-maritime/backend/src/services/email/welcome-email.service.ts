/**
 * Welcome Email Automation Service
 * Sends onboarding emails to new users
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  companyName: string;
  role: string;
  setupComplete: boolean;
}

export class WelcomeEmailService {
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
    const template = this.getEmailTemplate(data);
    
    // TODO: Integrate with email service (@ankr/email or SendGrid)
    console.log('📧 Sending welcome email to:', data.userEmail);
    
    await this.logEmail(data.userEmail, 'welcome', template.subject);
  }

  private getEmailTemplate(data: WelcomeEmailData): { subject: string; html: string } {
    const subject = `Welcome to Mari8X, ${data.userName}! 🚢`;
    const html = `Welcome email HTML content for ${data.companyName}`;
    return { subject, html };
  }

  private async logEmail(email: string, type: string, subject: string): Promise<void> {
    console.log('📝 Logged email:', { email, type, subject });
  }
}

export const welcomeEmailService = new WelcomeEmailService();
