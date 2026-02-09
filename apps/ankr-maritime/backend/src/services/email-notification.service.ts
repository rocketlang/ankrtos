/**
 * Email Notification Service - PDA/FDA Email Automation
 * Priority 1: Port Agency Portal
 *
 * Features:
 * - Send PDA to owner for approval
 * - Send FDA variance alerts
 * - Send service request quotes
 * - Email templates with branding
 * - Queue-based delivery with retry
 */

import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../lib/db.js';


export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface PDAApprovalEmailData {
  pdaReference: string;
  vesselName: string;
  portName: string;
  arrivalDate: Date;
  totalAmount: number;
  currency: string;
  lineItems: Array<{
    category: string;
    description: string;
    amount: number;
  }>;
  approvalLink: string;
  confidenceScore?: number;
}

export interface FDAVarianceEmailData {
  fdaReference: string;
  pdaReference: string;
  vesselName: string;
  portName: string;
  pdaTotal: number;
  fdaTotal: number;
  variance: number;
  variancePercent: number;
  significantVariances: Array<{
    category: string;
    pdaAmount: number;
    fdaAmount: number;
    variance: number;
    reason?: string;
  }>;
  reviewLink: string;
}

export interface ServiceQuoteEmailData {
  serviceType: string;
  vesselName: string;
  portName: string;
  quotes: Array<{
    vendorName: string;
    amount: number;
    currency: string;
    validUntil: Date;
    description: string;
  }>;
  selectQuoteLink: string;
}

export class EmailNotificationService {
  private prisma: PrismaClient;
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  private fromName: string;
  private baseUrl: string;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient();
    this.fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@mari8x.com';
    this.fromName = process.env.SMTP_FROM_NAME || 'Mari8X Port Agency Portal';
    this.baseUrl = process.env.APP_BASE_URL || 'http://localhost:5176';

    // Configure SMTP transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          }
        : undefined,
    });
  }

  /**
   * Send PDA approval email to vessel owner
   */
  async sendPDAApprovalEmail(
    data: PDAApprovalEmailData,
    ownerEmail: string
  ): Promise<void> {
    const subject = `PDA Approval Required: ${data.vesselName} at ${data.portName}`;

    const html = this.generatePDAApprovalHTML(data);
    const text = this.generatePDAApprovalText(data);

    await this.sendEmail({
      to: ownerEmail,
      subject,
      html,
      text,
    });

    console.log(`✅ Sent PDA approval email for ${data.pdaReference} to ${ownerEmail}`);
  }

  /**
   * Send FDA variance alert email
   */
  async sendFDAVarianceEmail(
    data: FDAVarianceEmailData,
    ownerEmail: string
  ): Promise<void> {
    const varianceType = data.variance > 0 ? 'Higher' : 'Lower';
    const subject = `FDA Variance Alert: ${data.vesselName} - ${varianceType} by ${Math.abs(data.variancePercent).toFixed(1)}%`;

    const html = this.generateFDAVarianceHTML(data);
    const text = this.generateFDAVarianceText(data);

    await this.sendEmail({
      to: ownerEmail,
      subject,
      html,
      text,
    });

    console.log(`✅ Sent FDA variance email for ${data.fdaReference} to ${ownerEmail}`);
  }

  /**
   * Send service quote comparison email
   */
  async sendServiceQuotesEmail(
    data: ServiceQuoteEmailData,
    recipientEmail: string
  ): Promise<void> {
    const subject = `Service Quotes Received: ${data.serviceType} for ${data.vesselName}`;

    const html = this.generateServiceQuotesHTML(data);
    const text = this.generateServiceQuotesText(data);

    await this.sendEmail({
      to: recipientEmail,
      subject,
      html,
      text,
    });

    console.log(`✅ Sent service quotes email to ${recipientEmail}`);
  }

  /**
   * Generic email sender with error handling
   */
  private async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHTML(options.html),
        attachments: options.attachments,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      // TODO: Queue for retry with BullMQ
      throw error;
    }
  }

  /**
   * Generate PDA approval email HTML
   */
  private generatePDAApprovalHTML(data: PDAApprovalEmailData): string {
    const confidenceBadge = data.confidenceScore
      ? `<span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
           ML Confidence: ${(data.confidenceScore * 100).toFixed(1)}%
         </span>`
      : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .footer { background: #374151; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .line-items { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .line-items th { background: #e5e7eb; padding: 10px; text-align: left; }
    .line-items td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
    .total { font-size: 20px; font-weight: bold; color: #1e40af; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">⚓ PDA Approval Required</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">${data.pdaReference}</p>
    </div>

    <div class="content">
      <p>Dear Vessel Owner,</p>

      <p>A Proforma Disbursement Account (PDA) has been generated for your vessel <strong>${data.vesselName}</strong> at <strong>${data.portName}</strong>.</p>

      <div style="background: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p><strong>Vessel:</strong> ${data.vesselName}</p>
        <p><strong>Port:</strong> ${data.portName}</p>
        <p><strong>Arrival Date:</strong> ${data.arrivalDate.toLocaleDateString()}</p>
        <p><strong>PDA Reference:</strong> ${data.pdaReference}</p>
        ${confidenceBadge}
      </div>

      <h3>Line Items:</h3>
      <table class="line-items">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${data.lineItems
            .map(
              (item) => `
            <tr>
              <td>${item.description}</td>
              <td style="text-align: right;">${data.currency} ${item.amount.toFixed(2)}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <div class="total">
        Total: ${data.currency} ${data.totalAmount.toFixed(2)}
      </div>

      <p>Please review and approve this PDA to proceed with the port call arrangements.</p>

      <a href="${data.approvalLink}" class="button">Review & Approve PDA</a>

      <p style="color: #6b7280; font-size: 14px;">
        This PDA was ${data.confidenceScore ? 'auto-generated with ML prediction' : 'generated based on port tariffs'}.
        Please verify all charges before approval.
      </p>
    </div>

    <div class="footer">
      <p>Mari8X Port Agency Portal</p>
      <p>Automated Port Call Management</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate PDA approval plain text
   */
  private generatePDAApprovalText(data: PDAApprovalEmailData): string {
    return `
PDA APPROVAL REQUIRED
${data.pdaReference}

Dear Vessel Owner,

A Proforma Disbursement Account (PDA) has been generated for your vessel ${data.vesselName} at ${data.portName}.

Vessel: ${data.vesselName}
Port: ${data.portName}
Arrival Date: ${data.arrivalDate.toLocaleDateString()}
PDA Reference: ${data.pdaReference}
${data.confidenceScore ? `ML Confidence: ${(data.confidenceScore * 100).toFixed(1)}%` : ''}

LINE ITEMS:
${data.lineItems.map((item) => `${item.description}: ${data.currency} ${item.amount.toFixed(2)}`).join('\n')}

TOTAL: ${data.currency} ${data.totalAmount.toFixed(2)}

Please review and approve this PDA:
${data.approvalLink}

---
Mari8X Port Agency Portal
Automated Port Call Management
    `;
  }

  /**
   * Generate FDA variance email HTML
   */
  private generateFDAVarianceHTML(data: FDAVarianceEmailData): string {
    const varianceColor = data.variance > 0 ? '#ef4444' : '#10b981';
    const varianceSymbol = data.variance > 0 ? '▲' : '▼';

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .footer { background: #374151; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; }
    .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .variance-summary { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${varianceColor}; }
    .variance-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .variance-table th { background: #e5e7eb; padding: 10px; text-align: left; }
    .variance-table td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">⚠️ FDA Variance Alert</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">${data.fdaReference}</p>
    </div>

    <div class="content">
      <p>Dear Vessel Owner,</p>

      <p>The Final Disbursement Account (FDA) for <strong>${data.vesselName}</strong> at <strong>${data.portName}</strong> shows a variance from the original PDA estimate.</p>

      <div class="variance-summary">
        <h3 style="margin-top: 0;">Variance Summary</h3>
        <p><strong>PDA Total:</strong> ${data.pdaTotal.toFixed(2)}</p>
        <p><strong>FDA Total:</strong> ${data.fdaTotal.toFixed(2)}</p>
        <p style="font-size: 20px; color: ${varianceColor};">
          <strong>Variance:</strong> ${varianceSymbol} ${Math.abs(data.variance).toFixed(2)} (${Math.abs(data.variancePercent).toFixed(1)}%)
        </p>
      </div>

      ${
        data.significantVariances.length > 0
          ? `
      <h3>Significant Variances (>5%):</h3>
      <table class="variance-table">
        <thead>
          <tr>
            <th>Category</th>
            <th style="text-align: right;">PDA</th>
            <th style="text-align: right;">FDA</th>
            <th style="text-align: right;">Variance</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          ${data.significantVariances
            .map(
              (v) => `
            <tr>
              <td>${v.category}</td>
              <td style="text-align: right;">${v.pdaAmount.toFixed(2)}</td>
              <td style="text-align: right;">${v.fdaAmount.toFixed(2)}</td>
              <td style="text-align: right; color: ${v.variance > 0 ? '#ef4444' : '#10b981'};">
                ${v.variance > 0 ? '+' : ''}${v.variance.toFixed(2)}
              </td>
              <td style="font-size: 12px;">${v.reason || 'N/A'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      `
          : ''
      }

      <p>Please review the FDA and variance details.</p>

      <a href="${data.reviewLink}" class="button">Review FDA Details</a>
    </div>

    <div class="footer">
      <p>Mari8X Port Agency Portal</p>
      <p>Automated Port Call Management</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate FDA variance plain text
   */
  private generateFDAVarianceText(data: FDAVarianceEmailData): string {
    return `
FDA VARIANCE ALERT
${data.fdaReference}

Dear Vessel Owner,

The Final Disbursement Account (FDA) for ${data.vesselName} at ${data.portName} shows a variance from the original PDA estimate.

VARIANCE SUMMARY:
PDA Total: ${data.pdaTotal.toFixed(2)}
FDA Total: ${data.fdaTotal.toFixed(2)}
Variance: ${data.variance > 0 ? '+' : ''}${data.variance.toFixed(2)} (${data.variancePercent.toFixed(1)}%)

SIGNIFICANT VARIANCES:
${data.significantVariances.map((v) => `${v.category}: ${v.variance > 0 ? '+' : ''}${v.variance.toFixed(2)} (${v.reason || 'N/A'})`).join('\n')}

Review FDA Details:
${data.reviewLink}

---
Mari8X Port Agency Portal
Automated Port Call Management
    `;
  }

  /**
   * Generate service quotes email HTML
   */
  private generateServiceQuotesHTML(data: ServiceQuoteEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .footer { background: #374151; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .quote-card { background: white; padding: 15px; border-radius: 6px; margin: 10px 0; border-left: 4px solid #10b981; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">💼 Service Quotes Received</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">${data.serviceType}</p>
    </div>

    <div class="content">
      <p>Dear Customer,</p>

      <p>We have received <strong>${data.quotes.length} quotes</strong> for <strong>${data.serviceType}</strong> service for <strong>${data.vesselName}</strong> at <strong>${data.portName}</strong>.</p>

      ${data.quotes
        .map(
          (quote, index) => `
      <div class="quote-card">
        <h4 style="margin: 0 0 10px 0;">Quote ${index + 1}: ${quote.vendorName}</h4>
        <p><strong>Amount:</strong> ${quote.currency} ${quote.amount.toFixed(2)}</p>
        <p><strong>Valid Until:</strong> ${quote.validUntil.toLocaleDateString()}</p>
        <p style="font-size: 14px; color: #6b7280;">${quote.description}</p>
      </div>
      `
        )
        .join('')}

      <p>Please review and select the best quote for your needs.</p>

      <a href="${data.selectQuoteLink}" class="button">Select Quote</a>
    </div>

    <div class="footer">
      <p>Mari8X Port Agency Portal</p>
      <p>Automated Port Call Management</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate service quotes plain text
   */
  private generateServiceQuotesText(data: ServiceQuoteEmailData): string {
    return `
SERVICE QUOTES RECEIVED
${data.serviceType}

Dear Customer,

We have received ${data.quotes.length} quotes for ${data.serviceType} service for ${data.vesselName} at ${data.portName}.

QUOTES:
${data.quotes.map((quote, index) => `
Quote ${index + 1}: ${quote.vendorName}
Amount: ${quote.currency} ${quote.amount.toFixed(2)}
Valid Until: ${quote.validUntil.toLocaleDateString()}
${quote.description}
`).join('\n')}

Select Quote:
${data.selectQuoteLink}

---
Mari8X Port Agency Portal
Automated Port Call Management
    `;
  }

  /**
   * Strip HTML tags for plain text version
   */
  private stripHTML(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service is configured correctly');
      return true;
    } catch (error) {
      console.error('❌ Email service configuration error:', error);
      return false;
    }
  }
}

// Singleton instance
let emailService: EmailNotificationService | null = null;

export function getEmailNotificationService(): EmailNotificationService {
  if (!emailService) {
    emailService = new EmailNotificationService();
  }
  return emailService;
}
