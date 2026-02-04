/**
 * Channel Router Service
 * Routes messages across channels with unified AI processing
 *
 * @package @ankr/universal-ai-assistant
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { messageNormalizerService, NormalizedMessage, Channel } from './message-normalizer.service.js';
import { responseDrafterService, ResponseStyle } from '../email-organizer/response-drafter.service.js';
import { contextRetrievalService } from '../email-organizer/context-retrieval.service.js';
import { emailSenderService } from '../email-organizer/email-sender.service.js';
import { whatsappService } from './whatsapp.service.js';

const prisma = new PrismaClient();

export interface ChannelRouterConfig {
  autoRespond: boolean; // Auto-respond to messages
  responseStyle: ResponseStyle; // Default response style
  channels: {
    email: boolean;
    whatsapp: boolean;
    slack: boolean;
    teams: boolean;
    webchat: boolean;
    ticket: boolean;
  };
}

export interface ProcessResult {
  success: boolean;
  messageId: string;
  threadId: string;
  aiResponse?: {
    generated: boolean;
    sent: boolean;
    draftId?: string;
    error?: string;
  };
}

export class ChannelRouterService {
  /**
   * Process incoming message from any channel
   */
  async processIncomingMessage(
    message: NormalizedMessage,
    userId: string,
    organizationId: string,
    config?: Partial<ChannelRouterConfig>
  ): Promise<ProcessResult> {
    const startTime = Date.now();

    try {
      // 1. Find or create thread
      const threadId = await this.findOrCreateThread(message, userId, organizationId);

      // 2. Save message to database
      const savedMessage = await this.saveMessage(message, threadId, userId, organizationId);

      console.log(`📨 Message received from ${message.channel}: ${message.from}`);

      // 3. Determine if auto-response needed
      const shouldAutoRespond = config?.autoRespond !== false;

      let aiResponse;
      if (shouldAutoRespond) {
        // 4. Generate AI response
        aiResponse = await this.generateAndSendResponse(
          message,
          threadId,
          userId,
          organizationId,
          config?.responseStyle || 'query_reply'
        );
      }

      const processingTime = Date.now() - startTime;
      console.log(`✅ Message processed in ${processingTime}ms`);

      return {
        success: true,
        messageId: savedMessage.id,
        threadId,
        aiResponse,
      };
    } catch (error: any) {
      console.error('Failed to process message:', error);
      throw error;
    }
  }

  /**
   * Find or create universal thread
   */
  private async findOrCreateThread(
    message: NormalizedMessage,
    userId: string,
    organizationId: string
  ): Promise<string> {
    const participantId = message.from;
    const participantName = message.fromName || message.from;

    // Try to find existing thread
    let thread = await prisma.universalThread.findFirst({
      where: {
        channel: message.channel,
        participantId,
        organizationId,
      },
    });

    if (!thread) {
      // Create new thread
      thread = await prisma.universalThread.create({
        data: {
          channel: message.channel,
          participantId,
          participantName,
          subject: message.metadata?.subject || `${message.channel} conversation`,
          userId,
          organizationId,
          messageCount: 1,
          lastMessageAt: message.timestamp,
        },
      });

      console.log(`📝 New thread created: ${thread.id}`);
    } else {
      // Update thread
      await prisma.universalThread.update({
        where: { id: thread.id },
        data: {
          messageCount: { increment: 1 },
          lastMessageAt: message.timestamp,
          isRead: false, // Mark as unread when new message arrives
        },
      });
    }

    return thread.id;
  }

  /**
   * Save message to database
   */
  private async saveMessage(
    message: NormalizedMessage,
    threadId: string,
    userId: string,
    organizationId: string
  ): Promise<any> {
    return await prisma.message.create({
      data: {
        id: message.id,
        channel: message.channel,
        channelMessageId: message.channelMessageId,
        threadId,
        userId,
        organizationId,
        from: message.from,
        fromName: message.fromName,
        to: message.to,
        content: message.content,
        contentType: message.contentType,
        mediaUrl: message.mediaUrl,
        mediaMetadata: message.mediaMetadata as any,
        direction: message.direction,
        status: 'received',
        receivedAt: message.timestamp,
        metadata: message.metadata as any,
      },
    });
  }

  /**
   * Generate and send AI response
   */
  private async generateAndSendResponse(
    incomingMessage: NormalizedMessage,
    threadId: string,
    userId: string,
    organizationId: string,
    style: ResponseStyle
  ): Promise<{
    generated: boolean;
    sent: boolean;
    draftId?: string;
    error?: string;
  }> {
    try {
      // 1. Retrieve context (documents, knowledge, history)
      const context = await contextRetrievalService.retrieveSmartContext(
        {
          threadId,
          subject: incomingMessage.metadata?.subject || `${incomingMessage.channel} message`,
          body: incomingMessage.content,
          from: incomingMessage.from,
          to: incomingMessage.to,
          category: this.detectCategory(incomingMessage.content),
          urgency: this.detectUrgency(incomingMessage.content),
        },
        userId,
        organizationId
      );

      // 2. Generate AI response
      const draft = await responseDrafterService.generateResponse(
        {
          originalEmail: {
            threadId,
            subject: incomingMessage.metadata?.subject || 'Message',
            body: incomingMessage.content,
            from: incomingMessage.from,
            to: incomingMessage.to,
            category: this.detectCategory(incomingMessage.content),
            urgency: this.detectUrgency(incomingMessage.content),
          },
          threadHistory: context.threadHistory,
          relevantDocuments: context.relevantDocuments,
          companyKnowledge: context.companyKnowledge,
          userPreferences: context.userPreferences,
        },
        style,
        userId,
        organizationId
      );

      console.log(`🤖 AI response generated (${style}): ${draft.id}`);

      // 3. Format response for target channel
      const formattedResponse = this.formatResponseForChannel(
        draft.body,
        incomingMessage.channel,
        context.userPreferences?.signature
      );

      // 4. Send response via appropriate channel
      const sent = await this.sendResponse(
        incomingMessage.channel,
        incomingMessage.from,
        draft.subject,
        formattedResponse,
        incomingMessage.channelMessageId
      );

      if (sent) {
        // Save sent message to thread
        await this.saveMessage(
          {
            id: `${incomingMessage.channel}-response-${Date.now()}`,
            channel: incomingMessage.channel,
            channelMessageId: `sent-${Date.now()}`,
            from: incomingMessage.to[0],
            to: [incomingMessage.from],
            content: formattedResponse,
            contentType: 'text',
            direction: 'outbound',
            timestamp: new Date(),
            metadata: { draftId: draft.id },
          },
          threadId,
          userId,
          organizationId
        );

        // Mark draft as sent
        await responseDrafterService.markDraftAsSent(draft.id!, userId);
      }

      return {
        generated: true,
        sent,
        draftId: draft.id,
      };
    } catch (error: any) {
      console.error('Failed to generate/send AI response:', error);
      return {
        generated: false,
        sent: false,
        error: error.message,
      };
    }
  }

  /**
   * Format response for specific channel
   */
  private formatResponseForChannel(
    response: string,
    channel: Channel,
    signature?: string
  ): string {
    let formatted = response;

    switch (channel) {
      case 'email':
        // Email supports HTML, keep as is
        if (signature) {
          formatted += `\n\n${signature}`;
        }
        break;

      case 'whatsapp':
        // WhatsApp: plain text, limited markdown
        formatted = whatsappService.formatResponse(formatted);
        if (signature) {
          formatted += `\n\n${signature}`;
        }
        break;

      case 'slack':
        // Slack: markdown format
        formatted = this.formatSlackMessage(formatted);
        break;

      case 'teams':
        // Teams: markdown format
        formatted = this.formatTeamsMessage(formatted);
        break;

      case 'webchat':
        // Web chat: markdown or HTML
        formatted = this.formatWebChatMessage(formatted);
        break;

      case 'ticket':
        // Ticket: markdown format
        formatted = this.formatTicketMessage(formatted);
        if (signature) {
          formatted += `\n\n---\n${signature}`;
        }
        break;
    }

    return formatted;
  }

  /**
   * Send response via appropriate channel
   */
  private async sendResponse(
    channel: Channel,
    to: string,
    subject: string,
    body: string,
    replyToMessageId?: string
  ): Promise<boolean> {
    try {
      switch (channel) {
        case 'email':
          // Email sending already implemented
          const emailResult = await emailSenderService.sendEmail(
            {
              to: [to],
              subject: `Re: ${subject}`,
              body,
              inReplyTo: replyToMessageId,
            },
            'system'
          );
          return emailResult.success;

        case 'whatsapp':
          // WhatsApp sending
          const whatsappResult = await whatsappService.sendTextMessage(
            to,
            body,
            replyToMessageId
          );
          return whatsappResult.success;

        case 'slack':
          // TODO: Implement Slack sending
          console.warn('Slack sending not yet implemented');
          return false;

        case 'teams':
          // TODO: Implement Teams sending
          console.warn('Teams sending not yet implemented');
          return false;

        case 'webchat':
          // TODO: Implement web chat sending
          console.warn('Web chat sending not yet implemented');
          return false;

        case 'ticket':
          // TODO: Implement ticket reply
          console.warn('Ticket reply not yet implemented');
          return false;

        default:
          console.error(`Unsupported channel: ${channel}`);
          return false;
      }
    } catch (error) {
      console.error(`Failed to send ${channel} message:`, error);
      return false;
    }
  }

  /**
   * Format message for Slack
   */
  private formatSlackMessage(text: string): string {
    // Slack markdown: *bold*, _italic_, ~strike~, `code`, ```code block```
    return text;
  }

  /**
   * Format message for Teams
   */
  private formatTeamsMessage(text: string): string {
    // Teams markdown similar to Slack
    return text;
  }

  /**
   * Format message for web chat
   */
  private formatWebChatMessage(text: string): string {
    // Web chat can support HTML or markdown
    return text;
  }

  /**
   * Format message for ticketing systems
   */
  private formatTicketMessage(text: string): string {
    // Tickets usually support markdown
    return text;
  }

  /**
   * Detect message category
   */
  private detectCategory(content: string): string {
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('vessel') || lowerContent.includes('ship')) {
      return 'vessel_inquiry';
    }
    if (lowerContent.includes('port') || lowerContent.includes('berth')) {
      return 'port_inquiry';
    }
    if (lowerContent.includes('document') || lowerContent.includes('clearance')) {
      return 'documentation';
    }
    if (lowerContent.includes('quote') || lowerContent.includes('price') || lowerContent.includes('rate')) {
      return 'freight_quote';
    }

    return 'general';
  }

  /**
   * Detect message urgency
   */
  private detectUrgency(content: string): string {
    const lowerContent = content.toLowerCase();

    if (
      lowerContent.includes('urgent') ||
      lowerContent.includes('asap') ||
      lowerContent.includes('emergency') ||
      lowerContent.includes('critical')
    ) {
      return 'critical';
    }

    if (
      lowerContent.includes('important') ||
      lowerContent.includes('priority') ||
      lowerContent.includes('soon')
    ) {
      return 'high';
    }

    return 'medium';
  }

  /**
   * Get thread history (last N messages)
   */
  async getThreadHistory(threadId: string, limit: number = 10): Promise<NormalizedMessage[]> {
    const messages = await prisma.message.findMany({
      where: { threadId },
      orderBy: { receivedAt: 'desc' },
      take: limit,
    });

    return messages.map((msg) => ({
      id: msg.id,
      channel: msg.channel as Channel,
      channelMessageId: msg.channelMessageId,
      from: msg.from,
      fromName: msg.fromName || undefined,
      to: msg.to,
      content: msg.content,
      contentType: msg.contentType as any,
      mediaUrl: msg.mediaUrl || undefined,
      mediaMetadata: msg.mediaMetadata as any,
      threadId: msg.threadId!,
      direction: msg.direction as any,
      timestamp: msg.receivedAt,
      metadata: msg.metadata as any,
    }));
  }

  /**
   * Mark thread as read
   */
  async markThreadAsRead(threadId: string, userId: string): Promise<void> {
    await prisma.universalThread.update({
      where: { id: threadId, userId },
      data: { isRead: true },
    });
  }

  /**
   * Get channel statistics
   */
  async getChannelStats(organizationId: string): Promise<Record<Channel, number>> {
    const stats = await prisma.message.groupBy({
      by: ['channel'],
      where: { organizationId },
      _count: { id: true },
    });

    const channelStats: any = {
      email: 0,
      whatsapp: 0,
      slack: 0,
      teams: 0,
      webchat: 0,
      ticket: 0,
      sms: 0,
    };

    stats.forEach((stat) => {
      channelStats[stat.channel] = stat._count.id;
    });

    return channelStats;
  }
}

export const channelRouterService = new ChannelRouterService();
