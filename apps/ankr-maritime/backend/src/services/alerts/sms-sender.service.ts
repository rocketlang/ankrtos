/**
 * SMS Sender Service
 *
 * Handles SMS delivery for master alerts using Twilio.
 *
 * Features:
 * - SMS sending via Twilio API
 * - 160-character message optimization
 * - Delivery status webhooks
 * - Reply handling via webhook
 * - URL shortening for links
 */

import type { ComposedAlert } from './alert-orchestrator.service';

export interface SMSDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  deliveredAt?: Date;
}

export class SMSSenderService {
  private twilioAccountSid: string;
  private twilioAuthToken: string;
  private twilioPhoneNumber: string;
  private webhookUrl: string;

  constructor() {
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '';
    this.webhookUrl = process.env.TWILIO_WEBHOOK_URL || '';

    if (!this.twilioAccountSid || !this.twilioAuthToken) {
      console.warn('Twilio credentials not configured');
    }
  }

  /**
   * Send alert SMS to master
   */
  async sendAlert(alert: ComposedAlert, alertId: string): Promise<SMSDeliveryResult> {
    if (!alert.recipientPhone) {
      return {
        success: false,
        error: 'No recipient phone number'
      };
    }

    if (!this.twilioAccountSid || !this.twilioAuthToken) {
      return {
        success: false,
        error: 'Twilio not configured'
      };
    }

    try {
      // Render SMS message (optimized for 160 chars)
      const smsMessage = this.renderSMSMessage(alert, alertId);

      // Send SMS via Twilio REST API
      const response = await this.sendTwilioSMS(
        alert.recipientPhone,
        smsMessage,
        alertId
      );

      return {
        success: true,
        messageId: response.sid,
        deliveredAt: new Date()
      };
    } catch (error) {
      console.error('SMS send failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Render SMS message (optimized for 160 characters)
   */
  private renderSMSMessage(alert: ComposedAlert, alertId: string): string {
    const baseUrl = process.env.APP_URL || 'https://mari8x.com';
    const detailsUrl = `${baseUrl}/a/${alertId}`;

    // Different templates based on alert type
    switch (alert.alertType) {
      case 'ARRIVAL_200NM':
        return `Mari8X: ${alert.metadata.vessel} arriving ${alert.metadata.port} in ${alert.metadata.hoursToETA}h. Prepare docs. ${detailsUrl}`;

      case 'DOCUMENT_MISSING':
        return `URGENT: ${alert.metadata.missingCount} docs missing for ${alert.metadata.port}. ETA ${alert.metadata.hoursToETA}h. Reply READY when complete. ${detailsUrl}`;

      case 'DEADLINE_APPROACHING':
        return `DEADLINE: ${alert.metadata.documentType} due in ${alert.metadata.hoursRemaining}h. Submit now. ${detailsUrl}`;

      case 'CONGESTION_HIGH':
        return `Port alert: ${alert.metadata.port} HIGH congestion. ${alert.metadata.vesselsWaiting} vessels waiting. Plan delays. ${detailsUrl}`;

      case 'ETA_CHANGED':
        return `ETA updated: ${alert.metadata.direction} ${alert.metadata.hoursDifference}h. New ETA: ${this.formatDateShort(alert.metadata.currentETA)}. ${detailsUrl}`;

      case 'DA_COST_HIGH':
        return `Cost alert: ${alert.metadata.port} DA $${Math.round(alert.metadata.forecast / 1000)}K (+${alert.metadata.percentageAbove}%). ${detailsUrl}`;

      default:
        // Generic fallback
        const shortMessage = alert.message.substring(0, 100);
        return `Mari8X Alert: ${shortMessage}... ${detailsUrl}`;
    }
  }

  /**
   * Send SMS via Twilio REST API
   */
  private async sendTwilioSMS(
    to: string,
    message: string,
    alertId: string
  ): Promise<any> {
    // Format phone number (ensure E.164 format)
    const formattedTo = this.formatPhoneNumber(to);

    // Twilio API endpoint
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`;

    // Prepare form data
    const params = new URLSearchParams({
      From: this.twilioPhoneNumber,
      To: formattedTo,
      Body: message
    });

    // Add status callback if webhook URL configured
    if (this.webhookUrl) {
      params.append('StatusCallback', `${this.webhookUrl}/sms-status/${alertId}`);
    }

    // Make API request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(
          `${this.twilioAccountSid}:${this.twilioAuthToken}`
        ).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Twilio API error: ${error.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Format phone number to E.164 standard
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // If doesn't start with +, assume it needs country code
    if (!phone.startsWith('+')) {
      // Default to +1 for US/Canada if no country code
      if (cleaned.length === 10) {
        cleaned = '1' + cleaned;
      }
      return '+' + cleaned;
    }

    return phone;
  }

  /**
   * Format date for SMS (short format)
   */
  private formatDateShort(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  }

  /**
   * Verify Twilio configuration
   */
  async verify(): Promise<boolean> {
    if (!this.twilioAccountSid || !this.twilioAuthToken) {
      return false;
    }

    try {
      // Verify by fetching account details
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}.json`;

      const response = await fetch(url, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(
            `${this.twilioAccountSid}:${this.twilioAuthToken}`
          ).toString('base64')
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Twilio verification failed:', error);
      return false;
    }
  }
}

export const smsSenderService = new SMSSenderService();
