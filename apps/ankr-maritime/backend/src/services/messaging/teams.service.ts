/**
 * Microsoft Teams Bot Service
 * Send and receive Teams messages via Bot Framework
 *
 * @package @ankr/universal-ai-assistant
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { messageNormalizerService, NormalizedMessage } from './message-normalizer.service.js';

const prisma = new PrismaClient();

export interface TeamsConfig {
  appId: string; // Microsoft App ID
  appPassword: string; // Microsoft App Password
  tenantId?: string; // Azure AD Tenant ID
  botId?: string; // Bot ID
}

export interface SendTeamsMessageOptions {
  conversationId: string;
  text: string;
  replyToId?: string;
  attachments?: any[]; // Adaptive Cards
}

export interface TeamsActivity {
  type: string; // 'message', 'conversationUpdate', etc.
  id: string;
  timestamp: string;
  channelId: string;
  from: {
    id: string;
    name?: string;
  };
  conversation: {
    id: string;
    conversationType?: string;
    name?: string;
  };
  recipient: {
    id: string;
    name?: string;
  };
  text?: string;
  textFormat?: string; // 'plain', 'markdown', 'xml'
  attachments?: any[];
  replyToId?: string;
  serviceUrl: string;
}

export class TeamsService {
  private config: TeamsConfig;
  private accessToken?: string;
  private tokenExpiry?: number;

  constructor(config?: TeamsConfig) {
    this.config = config || {
      appId: process.env.TEAMS_APP_ID || '',
      appPassword: process.env.TEAMS_APP_PASSWORD || '',
      tenantId: process.env.TEAMS_TENANT_ID || '',
      botId: process.env.TEAMS_BOT_ID || '',
    };
  }

  /**
   * Get access token from Microsoft Bot Framework
   */
  private async getAccessToken(): Promise<string> {
    try {
      // Check if we have a valid cached token
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      // Get new token
      const tokenUrl = 'https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token';

      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.appId,
        client_secret: this.config.appPassword,
        scope: 'https://api.botframework.com/.default',
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        throw new Error(`Failed to get Teams access token: ${response.statusText}`);
      }

      const data = await response.json();

      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // Expire 1 min early

      return this.accessToken;
    } catch (error: any) {
      console.error('Failed to get Teams access token:', error);
      throw error;
    }
  }

  /**
   * Send Teams message
   */
  async sendMessage(
    activity: TeamsActivity,
    options: SendTeamsMessageOptions
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const token = await this.getAccessToken();

      const payload: any = {
        type: 'message',
        from: {
          id: this.config.botId,
          name: 'Mari8X Assistant',
        },
        conversation: {
          id: options.conversationId,
        },
        text: options.text,
        textFormat: 'markdown',
      };

      if (options.replyToId) {
        payload.replyToId = options.replyToId;
      }

      if (options.attachments) {
        payload.attachments = options.attachments;
      }

      // Send to Bot Framework Connector API
      const url = `${activity.serviceUrl}/v3/conversations/${options.conversationId}/activities`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Teams API error:', error);
        return {
          success: false,
          error: `Failed to send Teams message: ${response.statusText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        id: data.id,
      };
    } catch (error: any) {
      console.error('Teams send error:', error);
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
    activity: TeamsActivity,
    conversationId: string,
    text: string,
    replyToId?: string
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    return await this.sendMessage(activity, {
      conversationId,
      text,
      replyToId,
    });
  }

  /**
   * Send adaptive card message
   */
  async sendAdaptiveCard(
    activity: TeamsActivity,
    conversationId: string,
    card: any,
    fallbackText?: string
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    return await this.sendMessage(activity, {
      conversationId,
      text: fallbackText || 'Message from Mari8X',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: card,
        },
      ],
    });
  }

  /**
   * Process incoming activity
   */
  async processActivity(activity: TeamsActivity): Promise<NormalizedMessage | null> {
    try {
      // Ignore bot messages (avoid loops)
      if (activity.from.id === this.config.botId) {
        return null;
      }

      // Only process message activities
      if (activity.type !== 'message' || !activity.text) {
        return null;
      }

      // Normalize message
      const normalized = messageNormalizerService.normalizeTeams(
        {
          id: activity.id,
          from: activity.from,
          conversation: activity.conversation,
          text: activity.text,
          attachments: activity.attachments,
          replyToId: activity.replyToId,
          timestamp: activity.timestamp,
        },
        this.config.botId || ''
      );

      return normalized;
    } catch (error) {
      console.error('Error processing Teams activity:', error);
      return null;
    }
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(
    activity: TeamsActivity,
    conversationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.getAccessToken();

      const payload = {
        type: 'typing',
        from: {
          id: this.config.botId,
          name: 'Mari8X Assistant',
        },
        conversation: {
          id: conversationId,
        },
      };

      const url = `${activity.serviceUrl}/v3/conversations/${conversationId}/activities`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to send typing indicator: ${response.statusText}`,
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Teams typing indicator error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update message
   */
  async updateMessage(
    activity: TeamsActivity,
    conversationId: string,
    activityId: string,
    text: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.getAccessToken();

      const payload = {
        type: 'message',
        text,
        textFormat: 'markdown',
      };

      const url = `${activity.serviceUrl}/v3/conversations/${conversationId}/activities/${activityId}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to update message: ${response.statusText}`,
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Teams update error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete message
   */
  async deleteMessage(
    activity: TeamsActivity,
    conversationId: string,
    activityId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.getAccessToken();

      const url = `${activity.serviceUrl}/v3/conversations/${conversationId}/activities/${activityId}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to delete message: ${response.statusText}`,
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Teams delete error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Format AI response for Teams (markdown)
   */
  formatResponse(response: string): string {
    // Teams supports markdown format
    // **bold**, *italic*, [link](url), `code`, ```code block```

    let formatted = response;

    // Convert HTML to markdown
    formatted = formatted.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
    formatted = formatted.replace(/<b>(.*?)<\/b>/g, '**$1**');
    formatted = formatted.replace(/<em>(.*?)<\/em>/g, '*$1*');
    formatted = formatted.replace(/<i>(.*?)<\/i>/g, '*$1*');
    formatted = formatted.replace(/<code>(.*?)<\/code>/g, '`$1`');

    // Remove other HTML tags
    formatted = formatted.replace(/<[^>]*>/g, '');

    return formatted;
  }

  /**
   * Create Adaptive Card for rich formatting
   */
  createAdaptiveCard(title: string, message: string, facts?: Array<{ title: string; value: string }>): any {
    const card: any = {
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
      type: 'AdaptiveCard',
      version: '1.4',
      body: [
        {
          type: 'TextBlock',
          text: title,
          weight: 'Bolder',
          size: 'Medium',
          wrap: true,
        },
        {
          type: 'TextBlock',
          text: message,
          wrap: true,
        },
      ],
    };

    if (facts && facts.length > 0) {
      card.body.push({
        type: 'FactSet',
        facts: facts,
      });
    }

    return card;
  }

  /**
   * Test Teams connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.getAccessToken();

      if (!token) {
        return {
          success: false,
          error: 'Failed to get access token',
        };
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
      const token = await this.getAccessToken();

      const response = await fetch('https://api.botframework.com/v3/botframework/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to get Teams bot info:', error);
      return null;
    }
  }
}

export const teamsService = new TeamsService();
