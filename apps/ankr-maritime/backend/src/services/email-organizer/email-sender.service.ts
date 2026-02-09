/**
 * Email Sender Service
 * SMTP integration for sending AI-generated responses
 *
 * @package @ankr/email-assistant
 * @version 1.0.0
 */

import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

export interface EmailOptions {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  replyTo?: string;
  inReplyTo?: string;
  references?: string[];
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  sentAt: Date;
}

export class EmailSenderService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@mari8x.com';
    this.fromName = process.env.SMTP_FROM_NAME || 'Mari8X Email Assistant';

    // Create SMTP transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    // Verify connection on initialization
    this.verifyConnection();
  }

  /**
   * Verify SMTP connection
   */
  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP server connection verified');
    } catch (error) {
      console.error('❌ SMTP server connection failed:', error);
      console.warn('Email sending will be disabled');
    }
  }

  /**
   * Send email using SMTP
   */
  async sendEmail(options: EmailOptions, userId: string): Promise<SendResult> {
    const startTime = Date.now();

    try {
      // Validate recipients
      if (!options.to || options.to.length === 0) {
        throw new Error('No recipients specified');
      }

      // Convert plain text to HTML if not provided
      const htmlBody = options.html || this.textToHtml(options.body);

      // Build email message
      const message = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: options.to.join(', '),
        cc: options.cc?.join(', '),
        bcc: options.bcc?.join(', '),
        subject: options.subject,
        text: options.body,
        html: htmlBody,
        attachments: options.attachments,
        replyTo: options.replyTo,
        inReplyTo: options.inReplyTo,
        references: options.references?.join(' '),
      };

      // Send email
      const info = await this.transporter.sendMail(message);

      const sendTime = Date.now() - startTime;
      console.log(`✅ Email sent in ${sendTime}ms:`, {
        messageId: info.messageId,
        to: options.to,
        subject: options.subject,
      });

      // Log to database
      await this.logSentEmail(userId, options, info.messageId, true);

      return {
        success: true,
        messageId: info.messageId,
        sentAt: new Date(),
      };
    } catch (error: any) {
      console.error('❌ Failed to send email:', error);

      // Log failure to database
      await this.logSentEmail(userId, options, undefined, false, error.message);

      return {
        success: false,
        error: error.message,
        sentAt: new Date(),
      };
    }
  }

  /**
   * Send AI-generated response
   */
  async sendAIResponse(
    draftId: string,
    userId: string,
    organizationId: string
  ): Promise<SendResult> {
    try {
      // Get draft from database
      const draft = await prisma.responseDraft.findUnique({
        where: { id: draftId },
      });

      if (!draft) {
        throw new Error('Draft not found');
      }

      if (draft.userId !== userId) {
        throw new Error('Unauthorized: draft belongs to different user');
      }

      // Get original email to reply to
      const originalEmail = await prisma.emailMessage.findUnique({
        where: { id: draft.emailId },
      });

      if (!originalEmail) {
        throw new Error('Original email not found');
      }

      // Build email options
      const options: EmailOptions = {
        to: [originalEmail.from], // Reply to sender
        subject: draft.subject,
        body: draft.body,
        inReplyTo: originalEmail.messageId || undefined,
        references: originalEmail.references
          ? [originalEmail.messageId!, ...originalEmail.references]
          : originalEmail.messageId
          ? [originalEmail.messageId]
          : undefined,
      };

      // Send email
      const result = await this.sendEmail(options, userId);

      if (result.success) {
        // Update draft status
        await prisma.responseDraft.update({
          where: { id: draftId },
          data: {
            status: 'sent',
            sentAt: new Date(),
          },
        });

        // Create sent message record
        await this.createSentMessageRecord(
          originalEmail.threadId!,
          userId,
          organizationId,
          options,
          result.messageId!
        );
      }

      return result;
    } catch (error: any) {
      console.error('Failed to send AI response:', error);
      return {
        success: false,
        error: error.message,
        sentAt: new Date(),
      };
    }
  }

  /**
   * Send bulk emails (for notifications, digests, etc.)
   */
  async sendBulkEmails(
    emails: EmailOptions[],
    userId: string
  ): Promise<Array<SendResult>> {
    const results: SendResult[] = [];

    // Send in batches of 10 to avoid overwhelming SMTP server
    const batchSize = 10;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map((email) => this.sendEmail(email, userId))
      );

      results.push(...batchResults);

      // Small delay between batches
      if (i + batchSize < emails.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(`📧 Bulk send complete: ${successCount}/${emails.length} successful`);

    return results;
  }

  /**
   * Send notification email
   */
  async sendNotification(
    to: string[],
    subject: string,
    body: string,
    userId: string
  ): Promise<SendResult> {
    return await this.sendEmail(
      {
        to,
        subject,
        body,
      },
      userId
    );
  }

  /**
   * Convert plain text to HTML
   */
  private textToHtml(text: string): string {
    // Convert newlines to <br>
    let html = text
      .split('\n')
      .map((line) => line.trim())
      .join('<br>\n');

    // Convert URLs to links
    html = html.replace(
      /https?:\/\/[^\s<]+/g,
      (url) => `<a href="${url}">${url}</a>`
    );

    // Wrap in basic HTML structure
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    a {
      color: #3B82F6;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .signature {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      color: #6B7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  ${html}
  <div class="signature">
    <p>
      Sent with <a href="https://mari8x.com">Mari8X Email Assistant</a><br>
      Powered by AI
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Log sent email to database
   */
  private async logSentEmail(
    userId: string,
    options: EmailOptions,
    messageId: string | undefined,
    success: boolean,
    error?: string
  ): Promise<void> {
    try {
      await prisma.emailSentLog.create({
        data: {
          userId,
          to: options.to,
          cc: options.cc || [],
          bcc: options.bcc || [],
          subject: options.subject,
          body: options.body,
          messageId,
          success,
          error,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to log sent email:', error);
    }
  }

  /**
   * Create sent message record in thread
   */
  private async createSentMessageRecord(
    threadId: string,
    userId: string,
    organizationId: string,
    options: EmailOptions,
    messageId: string
  ): Promise<void> {
    try {
      await prisma.emailMessage.create({
        data: {
          id: `sent-${Date.now()}`,
          threadId,
          userId,
          organizationId,
          messageId,
          from: this.fromEmail,
          to: options.to,
          cc: options.cc || [],
          bcc: options.bcc || [],
          subject: options.subject,
          body: options.body,
          inReplyTo: options.inReplyTo || null,
          references: options.references || [],
          receivedAt: new Date(),
          isRead: true,
          direction: 'outbound',
        },
      });

      // Update thread message count
      await prisma.emailThread.update({
        where: { id: threadId },
        data: {
          messageCount: {
            increment: 1,
          },
          lastMessageAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to create sent message record:', error);
    }
  }

  /**
   * Test SMTP configuration
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.transporter.verify();
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(to: string, userId: string): Promise<SendResult> {
    return await this.sendEmail(
      {
        to: [to],
        subject: 'Mari8X Email Assistant - Test Email',
        body: `This is a test email from Mari8X Email Assistant.

If you received this email, your SMTP configuration is working correctly.

Test sent at: ${new Date().toISOString()}

Best regards,
Mari8X Team`,
      },
      userId
    );
  }
}

export const emailSenderService = new EmailSenderService();
