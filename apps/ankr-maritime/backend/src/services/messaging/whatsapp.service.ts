/**
 * WhatsApp Business API Service
 * Send and receive WhatsApp messages
 *
 * @package @ankr/universal-ai-assistant
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { messageNormalizerService, NormalizedMessage } from './message-normalizer.service.js';

const prisma = new PrismaClient();

export interface WhatsAppConfig {
  phoneNumberId: string; // WhatsApp Business Phone Number ID
  accessToken: string; // WhatsApp Business API access token
  webhookVerifyToken: string; // For webhook verification
  apiVersion: string; // e.g., 'v18.0'
}

export interface SendMessageOptions {
  to: string; // Phone number with country code (e.g., 14155552671)
  type: 'text' | 'image' | 'document' | 'template';
  text?: {
    body: string;
    preview_url?: boolean;
  };
  image?: {
    link: string;
    caption?: string;
  };
  document?: {
    link: string;
    filename: string;
    caption?: string;
  };
  template?: {
    name: string;
    language: string;
    components?: any[];
  };
  context?: {
    message_id: string; // Reply to message
  };
}

export interface WebhookMessage {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          image?: any;
          document?: any;
          audio?: any;
          voice?: any;
          video?: any;
          sticker?: any;
          context?: { message_id: string };
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export class WhatsAppService {
  private config: WhatsAppConfig;
  private apiUrl: string;

  constructor(config?: WhatsAppConfig) {
    this.config = config || {
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'mari8x_verify_token',
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
    };

    this.apiUrl = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`;
  }

  /**
   * Send WhatsApp message
   */
  async sendMessage(options: SendMessageOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: options.to,
        type: options.type,
      };

      // Add message content based on type
      switch (options.type) {
        case 'text':
          payload.text = options.text;
          break;
        case 'image':
          payload.image = options.image;
          break;
        case 'document':
          payload.document = options.document;
          break;
        case 'template':
          payload.template = options.template;
          break;
      }

      // Add context if replying
      if (options.context) {
        payload.context = options.context;
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('WhatsApp API error:', data);
        return {
          success: false,
          error: data.error?.message || 'Failed to send WhatsApp message',
        };
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id,
      };
    } catch (error: any) {
      console.error('WhatsApp send error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send text message
   */
  async sendTextMessage(to: string, text: string, replyToMessageId?: string): Promise<any> {
    return await this.sendMessage({
      to,
      type: 'text',
      text: {
        body: text,
        preview_url: true, // Enable URL previews
      },
      context: replyToMessageId ? { message_id: replyToMessageId } : undefined,
    });
  }

  /**
   * Send image message
   */
  async sendImageMessage(to: string, imageUrl: string, caption?: string): Promise<any> {
    return await this.sendMessage({
      to,
      type: 'image',
      image: {
        link: imageUrl,
        caption,
      },
    });
  }

  /**
   * Send document message
   */
  async sendDocumentMessage(to: string, documentUrl: string, filename: string, caption?: string): Promise<any> {
    return await this.sendMessage({
      to,
      type: 'document',
      document: {
        link: documentUrl,
        filename,
        caption,
      },
    });
  }

  /**
   * Send template message (for initial contact)
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    language: string = 'en',
    components?: any[]
  ): Promise<any> {
    return await this.sendMessage({
      to,
      type: 'template',
      template: {
        name: templateName,
        language,
        components,
      },
    });
  }

  /**
   * Verify webhook (for initial setup)
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.config.webhookVerifyToken) {
      console.log('✅ WhatsApp webhook verified');
      return challenge;
    } else {
      console.error('❌ WhatsApp webhook verification failed');
      return null;
    }
  }

  /**
   * Process incoming webhook
   */
  async processWebhook(payload: WebhookMessage): Promise<NormalizedMessage[]> {
    const normalizedMessages: NormalizedMessage[] = [];

    try {
      if (payload.object !== 'whatsapp_business_account') {
        return normalizedMessages;
      }

      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field !== 'messages') {
            continue;
          }

          const { value } = change;

          // Process incoming messages
          if (value.messages) {
            for (const message of value.messages) {
              const normalized = messageNormalizerService.normalizeWhatsApp(
                message as any,
                value.metadata.display_phone_number
              );

              normalizedMessages.push(normalized);

              // Mark as read
              await this.markAsRead(message.id);
            }
          }

          // Process status updates (delivered, read, etc.)
          if (value.statuses) {
            for (const status of value.statuses) {
              await this.updateMessageStatus(status.id, status.status);
            }
          }
        }
      }

      return normalizedMessages;
    } catch (error) {
      console.error('Error processing WhatsApp webhook:', error);
      return normalizedMessages;
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      await fetch(`https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        }),
      });
    } catch (error) {
      console.error('Failed to mark WhatsApp message as read:', error);
    }
  }

  /**
   * Update message delivery status in database
   */
  async updateMessageStatus(messageId: string, status: string): Promise<void> {
    try {
      await prisma.message.updateMany({
        where: {
          channelMessageId: messageId,
          channel: 'whatsapp',
        },
        data: {
          status,
        },
      });
    } catch (error) {
      console.error('Failed to update message status:', error);
    }
  }

  /**
   * Download media from WhatsApp
   */
  async downloadMedia(mediaId: string): Promise<{ url: string; mimeType: string } | null> {
    try {
      // Get media URL
      const mediaInfoResponse = await fetch(
        `https://graph.facebook.com/${this.config.apiVersion}/${mediaId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
          },
        }
      );

      const mediaInfo = await mediaInfoResponse.json();

      if (!mediaInfo.url) {
        return null;
      }

      return {
        url: mediaInfo.url,
        mimeType: mediaInfo.mime_type,
      };
    } catch (error) {
      console.error('Failed to download WhatsApp media:', error);
      return null;
    }
  }

  /**
   * Get WhatsApp profile info
   */
  async getProfileInfo(phoneNumber: string): Promise<{ name?: string; about?: string } | null> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.config.apiVersion}/${phoneNumber}/whatsapp_business_profile`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
          },
        }
      );

      const data = await response.json();

      return {
        name: data.data?.[0]?.profile?.name,
        about: data.data?.[0]?.profile?.about,
      };
    } catch (error) {
      console.error('Failed to get WhatsApp profile:', error);
      return null;
    }
  }

  /**
   * Format AI response for WhatsApp
   * (Converts HTML/Markdown to WhatsApp-compatible format)
   */
  formatResponse(response: string): string {
    // WhatsApp supports limited formatting:
    // *bold*, _italic_, ~strikethrough~, ```monospace```

    let formatted = response;

    // Remove HTML tags
    formatted = formatted.replace(/<[^>]*>/g, '');

    // Convert markdown bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '*$1*');

    // Convert markdown italic
    formatted = formatted.replace(/_(.*?)_/g, '_$1_');

    // Keep it concise for WhatsApp (max 4096 chars)
    if (formatted.length > 4096) {
      formatted = formatted.substring(0, 4093) + '...';
    }

    return formatted;
  }

  /**
   * Create template (admin function)
   */
  async createTemplate(
    name: string,
    language: string,
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION',
    components: any[]
  ): Promise<any> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.config.apiVersion}/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.accessToken}`,
          },
          body: JSON.stringify({
            name,
            language,
            category,
            components,
          }),
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Failed to create WhatsApp template:', error);
      return null;
    }
  }

  /**
   * Test WhatsApp connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        return {
          success: false,
          error: 'Invalid WhatsApp credentials',
        };
      }

      const data = await response.json();

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get WhatsApp Business Account info
   */
  async getBusinessAccountInfo(): Promise<any> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}?fields=verified_name,code_verification_status,display_phone_number,quality_rating`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
          },
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Failed to get business account info:', error);
      return null;
    }
  }
}

export const whatsappService = new WhatsAppService();
