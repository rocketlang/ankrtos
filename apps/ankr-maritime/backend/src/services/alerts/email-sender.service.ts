/**
 * Email Sender Service
 *
 * Handles email delivery for master alerts using Nodemailer.
 *
 * Features:
 * - HTML email rendering from templates
 * - Tracking pixel for read receipts
 * - Reply-to handling for two-way communication
 * - Retry logic for failed deliveries
 * - Delivery status tracking
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { ComposedAlert } from './alert-orchestrator.service';

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  deliveredAt?: Date;
}

export class EmailSenderService {
  private transporter: Transporter;
  private fromAddress: string;
  private replyToAddress: string;

  constructor() {
    // Initialize Nodemailer with SMTP configuration
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    this.fromAddress = process.env.SMTP_FROM || 'alerts@mari8x.com';
    this.replyToAddress = process.env.SMTP_REPLY_TO || 'support@mari8x.com';
  }

  /**
   * Send alert email to master
   */
  async sendAlert(alert: ComposedAlert, alertId: string): Promise<EmailDeliveryResult> {
    if (!alert.recipientEmail) {
      return {
        success: false,
        error: 'No recipient email address'
      };
    }

    try {
      // Render HTML email from template
      const htmlContent = this.renderEmailTemplate(alert, alertId);

      // Send email
      const info = await this.transporter.sendMail({
        from: {
          name: 'Mari8X Alerts',
          address: this.fromAddress
        },
        to: alert.recipientEmail,
        replyTo: this.replyToAddress,
        subject: alert.title,
        text: this.renderPlainText(alert),
        html: htmlContent,
        headers: {
          // Custom headers for tracking
          'X-Alert-ID': alertId,
          'X-Arrival-ID': alert.arrivalId,
          'X-Alert-Type': alert.alertType
        }
      });

      return {
        success: true,
        messageId: info.messageId,
        deliveredAt: new Date()
      };
    } catch (error) {
      console.error('Email send failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Render HTML email template
   */
  private renderEmailTemplate(alert: ComposedAlert, alertId: string): string {
    // Read template file
    const templatePath = join(__dirname, '../../templates/email/master-arrival-alert.html');
    let template: string;

    try {
      template = readFileSync(templatePath, 'utf-8');
    } catch (error) {
      // Fallback to inline template if file doesn't exist
      template = this.getInlineTemplate();
    }

    // Replace template variables
    const html = template
      .replace(/{{ALERT_TITLE}}/g, this.escapeHtml(alert.title))
      .replace(/{{ALERT_MESSAGE}}/g, this.formatMessageAsHtml(alert.message))
      .replace(/{{ALERT_PRIORITY}}/g, alert.priority)
      .replace(/{{PRIORITY_COLOR}}/g, this.getPriorityColor(alert.priority))
      .replace(/{{ALERT_ID}}/g, alertId)
      .replace(/{{TRACKING_PIXEL}}/g, this.getTrackingPixel(alertId))
      .replace(/{{CURRENT_YEAR}}/g, new Date().getFullYear().toString());

    return html;
  }

  /**
   * Get inline HTML template (fallback)
   */
  private getInlineTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ALERT_TITLE}}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: {{PRIORITY_COLOR}}; color: #fff; padding: 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .message { white-space: pre-wrap; font-size: 14px; line-height: 1.8; }
    .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; margin: 10px 0; }
    .priority-CRITICAL { background: #dc2626; color: #fff; }
    .priority-HIGH { background: #ea580c; color: #fff; }
    .priority-MEDIUM { background: #f59e0b; color: #fff; }
    .priority-LOW { background: #6b7280; color: #fff; }
    .cta { text-align: center; margin: 30px 0; }
    .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚢 Mari8X Alert</h1>
    </div>
    <div class="content">
      <span class="priority-badge priority-{{ALERT_PRIORITY}}">{{ALERT_PRIORITY}} PRIORITY</span>
      <h2>{{ALERT_TITLE}}</h2>
      <div class="message">{{ALERT_MESSAGE}}</div>
      <div class="cta">
        <p><strong>To acknowledge this alert, reply to this email with:</strong></p>
        <p style="font-size: 18px; font-weight: bold;">READY</p>
        <p style="font-size: 12px; color: #6b7280;">Or reply DELAY if ETA has changed</p>
      </div>
    </div>
    <div class="footer">
      <p>Mari8X Maritime Intelligence Platform</p>
      <p>&copy; {{CURRENT_YEAR}} Mari8X. All rights reserved.</p>
      <p style="font-size: 10px; margin-top: 10px;">Alert ID: {{ALERT_ID}}</p>
    </div>
  </div>
  {{TRACKING_PIXEL}}
</body>
</html>
    `.trim();
  }

  /**
   * Render plain text version of email
   */
  private renderPlainText(alert: ComposedAlert): string {
    return `
${alert.title}

Priority: ${alert.priority}

${alert.message}

---

To acknowledge this alert, reply with: READY
To report a delay, reply with: DELAY

---

Mari8X Maritime Intelligence Platform
${new Date().getFullYear()}
    `.trim();
  }

  /**
   * Format message as HTML (preserve line breaks, convert emojis)
   */
  private formatMessageAsHtml(message: string): string {
    return this.escapeHtml(message).replace(/\n/g, '<br>');
  }

  /**
   * Get priority color for header
   */
  private getPriorityColor(priority: string): string {
    switch (priority) {
      case 'CRITICAL':
        return '#dc2626';
      case 'HIGH':
        return '#ea580c';
      case 'MEDIUM':
        return '#f59e0b';
      case 'LOW':
        return '#6b7280';
      default:
        return '#2563eb';
    }
  }

  /**
   * Get tracking pixel URL for read receipts
   */
  private getTrackingPixel(alertId: string): string {
    const baseUrl = process.env.APP_URL || 'https://mari8x.com';
    return `<img src="${baseUrl}/api/track/email/${alertId}" width="1" height="1" style="display:none;" alt="" />`;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Verify transporter configuration
   */
  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email transporter verification failed:', error);
      return false;
    }
  }
}

export const emailSenderService = new EmailSenderService();
