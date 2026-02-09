/**
 * Slack Bot Service
 * Send and receive Slack messages via Slack Bot API
 *
 * @package @ankr/universal-ai-assistant
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { messageNormalizerService, NormalizedMessage } from './message-normalizer.service.js';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

export interface SlackConfig {
  botToken: string; // Slack Bot User OAuth Token (xoxb-)
  appToken: string; // Slack App-Level Token (xapp-)
  signingSecret: string; // For webhook verification
  botUserId?: string; // Slack Bot User ID
}

export interface SendSlackMessageOptions {
  channel: string; // Channel ID or user ID
  text: string;
  thread_ts?: string; // Reply in thread
  blocks?: any[]; // Slack Block Kit blocks
  attachments?: any[];
}

export interface SlackEvent {
  type: string;
  user?: string;
  text?: string;
  ts?: string;
  channel?: string;
  thread_ts?: string;
  files?: any[];
  blocks?: any[];
}

export interface SlackWebhookPayload {
  token: string;
  team_id: string;
  event: SlackEvent;
  type: string;
  event_id: string;
  event_time: number;
  challenge?: string; // For URL verification
}

export class SlackService {
  private config: SlackConfig;
  private apiUrl: string = 'https://slack.com/api';

  constructor(config?: SlackConfig) {
    this.config = config || {
      botToken: process.env.SLACK_BOT_TOKEN || '',
      appToken: process.env.SLACK_APP_TOKEN || '',
      signingSecret: process.env.SLACK_SIGNING_SECRET || '',
      botUserId: process.env.SLACK_BOT_USER_ID || '',
    };
  }

  /**
   * Send Slack message
   */
  async sendMessage(
    options: SendSlackMessageOptions
  ): Promise<{ success: boolean; ts?: string; error?: string }> {
    try {
      const payload: any = {
        channel: options.channel,
        text: options.text,
      };

      if (options.thread_ts) {
        payload.thread_ts = options.thread_ts;
      }

      if (options.blocks) {
        payload.blocks = options.blocks;
      }

      if (options.attachments) {
        payload.attachments = options.attachments;
      }

      const response = await fetch(`${this.apiUrl}/chat.postMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.botToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.ok) {
        console.error('Slack API error:', data.error);
        return {
          success: false,
          error: data.error || 'Failed to send Slack message',
        };
      }

      return {
        success: true,
        ts: data.ts, // Message timestamp (unique ID)
      };
    } catch (error: any) {
      console.error('Slack send error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send text message
   */
  async sendTextMessage(
    channel: string,
    text: string,
    thread_ts?: string
  ): Promise<{ success: boolean; ts?: string; error?: string }> {
    return await this.sendMessage({
      channel,
      text,
      thread_ts,
    });
  }

  /**
   * Send rich message with blocks
   */
  async sendRichMessage(
    channel: string,
    text: string,
    blocks: any[],
    thread_ts?: string
  ): Promise<{ success: boolean; ts?: string; error?: string }> {
    return await this.sendMessage({
      channel,
      text,
      blocks,
      thread_ts,
    });
  }

  /**
   * Upload file to Slack
   */
  async uploadFile(
    channel: string,
    fileUrl: string,
    filename: string,
    title?: string,
    initialComment?: string
  ): Promise<{ success: boolean; file?: any; error?: string }> {
    try {
      // Download file
      const fileResponse = await fetch(fileUrl);
      const fileBuffer = await fileResponse.buffer();

      // Upload to Slack
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      formData.append('channels', channel);
      formData.append('file', fileBuffer, filename);

      if (title) {
        formData.append('title', title);
      }

      if (initialComment) {
        formData.append('initial_comment', initialComment);
      }

      const response = await fetch(`${this.apiUrl}/files.upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.botToken}`,
          ...formData.getHeaders(),
        },
        body: formData as any,
      });

      const data = await response.json();

      if (!data.ok) {
        console.error('Slack file upload error:', data.error);
        return {
          success: false,
          error: data.error || 'Failed to upload file',
        };
      }

      return {
        success: true,
        file: data.file,
      };
    } catch (error: any) {
      console.error('Slack file upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify webhook (for URL verification challenge)
   */
  verifyWebhook(payload: SlackWebhookPayload): string | null {
    if (payload.type === 'url_verification' && payload.challenge) {
      console.log('✅ Slack webhook verified');
      return payload.challenge;
    }
    return null;
  }

  /**
   * Process incoming webhook event
   */
  async processWebhook(payload: SlackWebhookPayload): Promise<NormalizedMessage | null> {
    try {
      // Ignore bot messages (avoid loops)
      if (payload.event.user === this.config.botUserId) {
        return null;
      }

      // Only process message events
      if (payload.event.type !== 'message' || !payload.event.text) {
        return null;
      }

      // Normalize message
      const normalized = messageNormalizerService.normalizeSlack(
        {
          ts: payload.event.ts!,
          channel: payload.event.channel!,
          user: payload.event.user!,
          text: payload.event.text,
          thread_ts: payload.event.thread_ts,
          files: payload.event.files,
          blocks: payload.event.blocks,
        },
        this.config.botUserId || ''
      );

      return normalized;
    } catch (error) {
      console.error('Error processing Slack webhook:', error);
      return null;
    }
  }

  /**
   * Get user info
   */
  async getUserInfo(userId: string): Promise<{ name?: string; email?: string; avatar?: string } | null> {
    try {
      const response = await fetch(`${this.apiUrl}/users.info?user=${userId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.botToken}`,
        },
      });

      const data = await response.json();

      if (!data.ok || !data.user) {
        return null;
      }

      return {
        name: data.user.real_name || data.user.name,
        email: data.user.profile?.email,
        avatar: data.user.profile?.image_192,
      };
    } catch (error) {
      console.error('Failed to get Slack user info:', error);
      return null;
    }
  }

  /**
   * Get channel info
   */
  async getChannelInfo(channelId: string): Promise<{ name?: string; topic?: string } | null> {
    try {
      const response = await fetch(`${this.apiUrl}/conversations.info?channel=${channelId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.botToken}`,
        },
      });

      const data = await response.json();

      if (!data.ok || !data.channel) {
        return null;
      }

      return {
        name: data.channel.name,
        topic: data.channel.topic?.value,
      };
    } catch (error) {
      console.error('Failed to get Slack channel info:', error);
      return null;
    }
  }

  /**
   * Update message
   */
  async updateMessage(
    channel: string,
    ts: string,
    text: string,
    blocks?: any[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const payload: any = {
        channel,
        ts,
        text,
      };

      if (blocks) {
        payload.blocks = blocks;
      }

      const response = await fetch(`${this.apiUrl}/chat.update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.botToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.ok) {
        return {
          success: false,
          error: data.error || 'Failed to update message',
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Slack update error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete message
   */
  async deleteMessage(channel: string, ts: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/chat.delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.botToken}`,
        },
        body: JSON.stringify({ channel, ts }),
      });

      const data = await response.json();

      if (!data.ok) {
        return {
          success: false,
          error: data.error || 'Failed to delete message',
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Slack delete error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Add reaction to message
   */
  async addReaction(
    channel: string,
    timestamp: string,
    emoji: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/reactions.add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.botToken}`,
        },
        body: JSON.stringify({
          channel,
          timestamp,
          name: emoji.replace(/:/g, ''), // Remove colons from emoji name
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        return {
          success: false,
          error: data.error || 'Failed to add reaction',
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Slack reaction error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Format AI response for Slack (markdown)
   */
  formatResponse(response: string): string {
    // Slack uses mrkdwn format:
    // *bold*, _italic_, ~strike~, `code`, ```code block```
    // Links: <url|text>

    let formatted = response;

    // Convert HTML to Slack markdown
    formatted = formatted.replace(/<strong>(.*?)<\/strong>/g, '*$1*');
    formatted = formatted.replace(/<b>(.*?)<\/b>/g, '*$1*');
    formatted = formatted.replace(/<em>(.*?)<\/em>/g, '_$1_');
    formatted = formatted.replace(/<i>(.*?)<\/i>/g, '_$1_');
    formatted = formatted.replace(/<code>(.*?)<\/code>/g, '`$1`');

    // Remove other HTML tags
    formatted = formatted.replace(/<[^>]*>/g, '');

    return formatted;
  }

  /**
   * Create Slack blocks for rich formatting
   */
  createBlocks(message: string): any[] {
    const blocks: any[] = [];

    // Split into paragraphs
    const paragraphs = message.split('\n\n');

    for (const paragraph of paragraphs) {
      if (paragraph.trim()) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: this.formatResponse(paragraph),
          },
        });
      }
    }

    return blocks;
  }

  /**
   * Test Slack connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/auth.test`, {
        headers: {
          'Authorization': `Bearer ${this.config.botToken}`,
        },
      });

      const data = await response.json();

      if (!data.ok) {
        return {
          success: false,
          error: 'Invalid Slack credentials',
        };
      }

      // Store bot user ID
      if (data.user_id) {
        this.config.botUserId = data.user_id;
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get bot info
   */
  async getBotInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/auth.test`, {
        headers: {
          'Authorization': `Bearer ${this.config.botToken}`,
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to get bot info:', error);
      return null;
    }
  }
}

export const slackService = new SlackService();
