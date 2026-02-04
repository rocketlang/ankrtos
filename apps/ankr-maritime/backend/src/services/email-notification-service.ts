/**
 * Email Notification Service
 * Phase 33: Task #63 - Email Notification Templates
 *
 * HTML email templates for:
 * - Certificate expiry alerts
 * - Document sharing
 * - Workflow approvals
 * - Mentions and notifications
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailNotification {
  to: string | string[];
  subject: string;
  template: 'certificate_expiry' | 'document_shared' | 'workflow_approval' | 'mention' | 'document_digest';
  data: Record<string, any>;
  priority?: 'urgent' | 'high' | 'normal' | 'low';
}

class EmailNotificationService {
  private transporter: Transporter | null = null;
  private readonly FROM_EMAIL = process.env.SMTP_FROM_EMAIL || 'noreply@mari8x.com';
  private readonly FROM_NAME = process.env.SMTP_FROM_NAME || 'Mari8X Platform';

  constructor() {
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    }
  }

  /**
   * Send email notification
   */
  async send(notification: EmailNotification): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Email transporter not configured');
      return false;
    }

    try {
      const template = this.getTemplate(notification.template, notification.data);

      const recipients = Array.isArray(notification.to) ? notification.to.join(', ') : notification.to;

      await this.transporter.sendMail({
        from: `"${this.FROM_NAME}" <${this.FROM_EMAIL}>`,
        to: recipients,
        subject: notification.subject || template.subject,
        text: template.text,
        html: template.html,
        priority: notification.priority === 'urgent' ? 'high' : 'normal',
      });

      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  /**
   * Get email template
   */
  private getTemplate(templateName: string, data: Record<string, any>): EmailTemplate {
    switch (templateName) {
      case 'certificate_expiry':
        return this.certificateExpiryTemplate(data);
      case 'document_shared':
        return this.documentSharedTemplate(data);
      case 'workflow_approval':
        return this.workflowApprovalTemplate(data);
      case 'mention':
        return this.mentionTemplate(data);
      case 'document_digest':
        return this.documentDigestTemplate(data);
      default:
        throw new Error(`Unknown template: ${templateName}`);
    }
  }

  /**
   * Certificate expiry alert template
   */
  private certificateExpiryTemplate(data: {
    certificateType: string;
    vesselName?: string;
    expiryDate: string;
    daysUntil: number;
    severity: string;
  }): EmailTemplate {
    const urgentStyle = data.severity === 'urgent' || data.severity === 'critical'
      ? 'background-color: #dc2626; color: white;'
      : 'background-color: #f59e0b; color: white;';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate Expiry Alert</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Certificate Expiring</h1>
  </div>

  <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
    <div style="padding: 20px; ${urgentStyle} border-radius: 8px; margin-bottom: 20px; text-align: center;">
      <h2 style="margin: 0; font-size: 24px;">${data.daysUntil} Days Until Expiry</h2>
    </div>

    <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="color: #1f2937; margin-top: 0;">Certificate Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Type:</td>
          <td style="padding: 8px 0;">${data.certificateType}</td>
        </tr>
        ${data.vesselName ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Vessel:</td>
          <td style="padding: 8px 0;">${data.vesselName}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Expiry Date:</td>
          <td style="padding: 8px 0; color: #dc2626; font-weight: bold;">${data.expiryDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Severity:</td>
          <td style="padding: 8px 0; text-transform: capitalize;">${data.severity}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.APP_URL}/compliance/certificates"
         style="display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        View Certificate
      </a>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
      <p>This is an automated notification from Mari8X Platform</p>
      <p>&copy; 2026 Mari8X. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
Certificate Expiry Alert

${data.daysUntil} days until expiry

Certificate Details:
Type: ${data.certificateType}
${data.vesselName ? `Vessel: ${data.vesselName}` : ''}
Expiry Date: ${data.expiryDate}
Severity: ${data.severity}

Please take immediate action to renew this certificate.

View certificate: ${process.env.APP_URL}/compliance/certificates
    `.trim();

    return {
      subject: `🚨 Certificate Expiring in ${data.daysUntil} Days - ${data.certificateType}`,
      html,
      text,
    };
  }

  /**
   * Document shared template
   */
  private documentSharedTemplate(data: {
    documentTitle: string;
    sharedBy: string;
    message?: string;
    documentId: string;
  }): EmailTemplate {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📄 Document Shared</h1>
  </div>

  <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px; color: #1f2937;">${data.sharedBy} has shared a document with you:</p>

    <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <h3 style="margin: 0 0 10px 0; color: #1f2937;">${data.documentTitle}</h3>
      ${data.message ? `<p style="margin: 0; color: #6b7280;">${data.message}</p>` : ''}
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.APP_URL}/documents/${data.documentId}"
         style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Open Document
      </a>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
      <p>This is an automated notification from Mari8X Platform</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
Document Shared

${data.sharedBy} has shared a document with you:

${data.documentTitle}
${data.message ? `\nMessage: ${data.message}` : ''}

Open document: ${process.env.APP_URL}/documents/${data.documentId}
    `.trim();

    return {
      subject: `${data.sharedBy} shared "${data.documentTitle}" with you`,
      html,
      text,
    };
  }

  /**
   * Workflow approval template
   */
  private workflowApprovalTemplate(data: {
    workflowName: string;
    documentTitle: string;
    stepName: string;
    dueDate?: string;
    workflowId: string;
  }): EmailTemplate {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✓ Approval Required</h1>
  </div>

  <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px; color: #1f2937;">A document requires your approval:</p>

    <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; color: #1f2937;">${data.documentTitle}</h3>
      <table style="width: 100%;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Workflow:</td>
          <td style="padding: 8px 0;">${data.workflowName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Step:</td>
          <td style="padding: 8px 0;">${data.stepName}</td>
        </tr>
        ${data.dueDate ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Due Date:</td>
          <td style="padding: 8px 0; color: #dc2626; font-weight: bold;">${data.dueDate}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.APP_URL}/workflows/${data.workflowId}"
         style="display: inline-block; background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
        Approve
      </a>
      <a href="${process.env.APP_URL}/workflows/${data.workflowId}"
         style="display: inline-block; background-color: #6b7280; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        View Details
      </a>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
      <p>This is an automated notification from Mari8X Platform</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
Approval Required

A document requires your approval:

Document: ${data.documentTitle}
Workflow: ${data.workflowName}
Step: ${data.stepName}
${data.dueDate ? `Due Date: ${data.dueDate}` : ''}

Review and approve: ${process.env.APP_URL}/workflows/${data.workflowId}
    `.trim();

    return {
      subject: `Approval Required: ${data.documentTitle}`,
      html,
      text,
    };
  }

  /**
   * Mention notification template
   */
  private mentionTemplate(data: {
    mentionedBy: string;
    documentTitle: string;
    comment: string;
    documentId: string;
  }): EmailTemplate {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">@ You Were Mentioned</h1>
  </div>

  <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px; color: #1f2937;"><strong>${data.mentionedBy}</strong> mentioned you in a comment:</p>

    <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280;">On: ${data.documentTitle}</p>
      <p style="margin: 0; color: #1f2937; font-style: italic;">"${data.comment}"</p>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.APP_URL}/documents/${data.documentId}#comments"
         style="display: inline-block; background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        View Comment
      </a>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
      <p>This is an automated notification from Mari8X Platform</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
You Were Mentioned

${data.mentionedBy} mentioned you in a comment on "${data.documentTitle}":

"${data.comment}"

View comment: ${process.env.APP_URL}/documents/${data.documentId}#comments
    `.trim();

    return {
      subject: `${data.mentionedBy} mentioned you in "${data.documentTitle}"`,
      html,
      text,
    };
  }

  /**
   * Daily document digest template
   */
  private documentDigestTemplate(data: {
    userName: string;
    newDocuments: number;
    pendingApprovals: number;
    expiringCertificates: number;
    organizationId: string;
  }): EmailTemplate {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📊 Daily Digest</h1>
    <p style="color: #e9d5ff; margin: 10px 0 0 0;">Your Mari8X summary for today</p>
  </div>

  <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px; color: #1f2937;">Hello ${data.userName},</p>
    <p style="color: #6b7280;">Here's what's happening with your documents:</p>

    <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <div style="display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #e5e7eb;">
        <span style="color: #6b7280;">New Documents</span>
        <span style="color: #1f2937; font-weight: bold; font-size: 20px;">${data.newDocuments}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #e5e7eb;">
        <span style="color: #6b7280;">Pending Approvals</span>
        <span style="color: #f59e0b; font-weight: bold; font-size: 20px;">${data.pendingApprovals}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 15px 0;">
        <span style="color: #6b7280;">Expiring Certificates</span>
        <span style="color: #dc2626; font-weight: bold; font-size: 20px;">${data.expiringCertificates}</span>
      </div>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.APP_URL}/dashboard"
         style="display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Go to Dashboard
      </a>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
      <p>This is your daily digest from Mari8X Platform</p>
      <p><a href="${process.env.APP_URL}/settings/notifications" style="color: #8b5cf6;">Manage email preferences</a></p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
Daily Digest

Hello ${data.userName},

Here's your Mari8X summary for today:

New Documents: ${data.newDocuments}
Pending Approvals: ${data.pendingApprovals}
Expiring Certificates: ${data.expiringCertificates}

Go to dashboard: ${process.env.APP_URL}/dashboard
    `.trim();

    return {
      subject: `📊 Your Daily Mari8X Digest`,
      html,
      text,
    };
  }
}

export const emailNotificationService = new EmailNotificationService();
