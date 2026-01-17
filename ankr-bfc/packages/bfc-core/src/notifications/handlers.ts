/**
 * Notification Channel Handlers - BFC Platform
 */

import { Notification, NotificationChannel } from './types';
import { NotificationHandler } from './service';

/**
 * Push Notification Handler (Firebase/APNS)
 */
export class PushNotificationHandler implements NotificationHandler {
  channel = NotificationChannel.PUSH;

  async send(notification: Notification): Promise<boolean> {
    // In production, integrate with Firebase Cloud Messaging or APNS
    console.log(`[PUSH] Sending to ${notification.recipientId}:`, notification.title);

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate 95% success rate
        resolve(Math.random() > 0.05);
      }, 100);
    });
  }
}

/**
 * In-App Notification Handler (WebSocket/SSE)
 */
export class InAppNotificationHandler implements NotificationHandler {
  channel = NotificationChannel.IN_APP;
  private connections: Map<string, WebSocket> = new Map();

  registerConnection(userId: string, ws: WebSocket): void {
    this.connections.set(userId, ws);
  }

  removeConnection(userId: string): void {
    this.connections.delete(userId);
  }

  async send(notification: Notification): Promise<boolean> {
    const ws = this.connections.get(notification.recipientId);

    if (!ws) {
      // Store for later delivery when user connects
      console.log(`[IN_APP] User ${notification.recipientId} not connected, queuing`);
      return true; // Consider successful, will be delivered on reconnect
    }

    try {
      ws.send(
        JSON.stringify({
          type: 'notification',
          payload: {
            id: notification.id,
            title: notification.title,
            body: notification.body,
            category: notification.category,
            priority: notification.priority,
            data: notification.data,
            actions: notification.actions,
            createdAt: notification.createdAt,
          },
        })
      );
      return true;
    } catch (error) {
      console.error(`[IN_APP] Failed to send to ${notification.recipientId}:`, error);
      return false;
    }
  }
}

/**
 * Email Notification Handler
 */
export class EmailNotificationHandler implements NotificationHandler {
  channel = NotificationChannel.EMAIL;

  private smtpConfig: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };

  constructor(config?: Partial<EmailNotificationHandler['smtpConfig']>) {
    this.smtpConfig = {
      host: config?.host ?? process.env.SMTP_HOST ?? 'smtp.gmail.com',
      port: config?.port ?? parseInt(process.env.SMTP_PORT ?? '587'),
      user: config?.user ?? process.env.SMTP_USER ?? '',
      pass: config?.pass ?? process.env.SMTP_PASS ?? '',
      from: config?.from ?? process.env.SMTP_FROM ?? 'noreply@bfc.in',
    };
  }

  async send(notification: Notification): Promise<boolean> {
    console.log(`[EMAIL] Sending to ${notification.recipientId}:`, notification.title);

    // In production, use nodemailer or AWS SES
    // const transporter = nodemailer.createTransport({
    //   host: this.smtpConfig.host,
    //   port: this.smtpConfig.port,
    //   secure: this.smtpConfig.port === 465,
    //   auth: { user: this.smtpConfig.user, pass: this.smtpConfig.pass },
    // });
    //
    // await transporter.sendMail({
    //   from: this.smtpConfig.from,
    //   to: recipientEmail,
    //   subject: notification.title,
    //   html: this.buildEmailHtml(notification),
    // });

    return true;
  }

  private buildEmailHtml(notification: Notification): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e293b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8fafc; }
          .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; }
          .footer { padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>BFC</h1>
          </div>
          <div class="content">
            <h2>${notification.title}</h2>
            <p>${notification.body}</p>
            ${notification.actionUrl ? `<a href="${notification.actionUrl}" class="button">View Details</a>` : ''}
          </div>
          <div class="footer">
            <p>Banking Finance Customer Platform</p>
            <p>This is an automated message. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

/**
 * SMS Notification Handler
 */
export class SMSNotificationHandler implements NotificationHandler {
  channel = NotificationChannel.SMS;

  private provider: 'twilio' | 'aws_sns' | 'msg91';
  private config: Record<string, string>;

  constructor(provider: 'twilio' | 'aws_sns' | 'msg91' = 'msg91') {
    this.provider = provider;
    this.config = {
      accountSid: process.env.SMS_ACCOUNT_SID ?? '',
      authToken: process.env.SMS_AUTH_TOKEN ?? '',
      from: process.env.SMS_FROM ?? '',
    };
  }

  async send(notification: Notification): Promise<boolean> {
    console.log(`[SMS] Sending to ${notification.recipientId}:`, notification.title);

    // Truncate for SMS (160 chars for single SMS)
    const message = this.formatSMSMessage(notification);

    // In production, use Twilio, AWS SNS, or MSG91
    // switch (this.provider) {
    //   case 'twilio':
    //     const twilio = require('twilio')(this.config.accountSid, this.config.authToken);
    //     await twilio.messages.create({
    //       body: message,
    //       from: this.config.from,
    //       to: recipientPhone,
    //     });
    //     break;
    //   case 'msg91':
    //     // MSG91 API call
    //     break;
    // }

    return true;
  }

  private formatSMSMessage(notification: Notification): string {
    const prefix = `[BFC] `;
    const maxLength = 160 - prefix.length;

    let message = `${notification.title}: ${notification.body}`;
    if (message.length > maxLength) {
      message = message.substring(0, maxLength - 3) + '...';
    }

    return prefix + message;
  }
}

/**
 * WhatsApp Notification Handler
 */
export class WhatsAppNotificationHandler implements NotificationHandler {
  channel = NotificationChannel.WHATSAPP;

  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL ?? 'https://graph.facebook.com/v17.0';
    this.apiKey = process.env.WHATSAPP_API_KEY ?? '';
  }

  async send(notification: Notification): Promise<boolean> {
    console.log(`[WHATSAPP] Sending to ${notification.recipientId}:`, notification.title);

    // In production, use WhatsApp Business API
    // const response = await fetch(`${this.apiUrl}/messages`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     messaging_product: 'whatsapp',
    //     to: recipientPhone,
    //     type: 'template',
    //     template: {
    //       name: 'notification_template',
    //       language: { code: 'en' },
    //       components: [
    //         {
    //           type: 'body',
    //           parameters: [
    //             { type: 'text', text: notification.title },
    //             { type: 'text', text: notification.body },
    //           ],
    //         },
    //       ],
    //     },
    //   }),
    // });

    return true;
  }
}

/**
 * Webhook Notification Handler
 */
export class WebhookNotificationHandler implements NotificationHandler {
  channel = NotificationChannel.WEBHOOK;

  private endpoints: Map<string, string> = new Map();

  registerEndpoint(userId: string, webhookUrl: string): void {
    this.endpoints.set(userId, webhookUrl);
  }

  async send(notification: Notification): Promise<boolean> {
    const webhookUrl = this.endpoints.get(notification.recipientId);

    if (!webhookUrl) {
      console.log(`[WEBHOOK] No endpoint registered for ${notification.recipientId}`);
      return false;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-BFC-Signature': this.generateSignature(notification),
        },
        body: JSON.stringify({
          event: 'notification',
          timestamp: new Date().toISOString(),
          data: {
            id: notification.id,
            category: notification.category,
            priority: notification.priority,
            title: notification.title,
            body: notification.body,
            data: notification.data,
          },
        }),
      });

      return response.ok;
    } catch (error) {
      console.error(`[WEBHOOK] Failed to send to ${webhookUrl}:`, error);
      return false;
    }
  }

  private generateSignature(notification: Notification): string {
    // In production, use HMAC with shared secret
    const crypto = require('crypto');
    const secret = process.env.WEBHOOK_SECRET ?? 'bfc-secret';
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(notification))
      .digest('hex');
  }
}

/**
 * Create default handlers
 */
export function createDefaultHandlers(): NotificationHandler[] {
  return [
    new PushNotificationHandler(),
    new InAppNotificationHandler(),
    new EmailNotificationHandler(),
    new SMSNotificationHandler(),
    new WhatsAppNotificationHandler(),
    new WebhookNotificationHandler(),
  ];
}
