/**
 * Message Normalizer Service
 * Converts channel-specific messages to universal format
 *
 * @package @ankr/universal-ai-assistant
 * @version 1.0.0
 */

export type Channel = 'email' | 'whatsapp' | 'slack' | 'teams' | 'webchat' | 'ticket' | 'sms';

export type ContentType = 'text' | 'image' | 'document' | 'voice' | 'video' | 'audio' | 'sticker';

export type MessageDirection = 'inbound' | 'outbound';

export interface NormalizedMessage {
  id: string;
  channel: Channel;
  channelMessageId: string;
  from: string;
  fromName?: string;
  to: string[];
  content: string;
  contentType: ContentType;
  mediaUrl?: string;
  mediaMetadata?: {
    filename?: string;
    mimeType?: string;
    size?: number;
    duration?: number; // For voice/video
    width?: number; // For images/video
    height?: number;
  };
  threadId?: string;
  direction: MessageDirection;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface EmailMessage {
  messageId: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    url: string;
    size: number;
    contentType: string;
  }>;
  inReplyTo?: string;
  references?: string[];
  receivedAt: Date;
}

export interface WhatsAppMessage {
  id: string;
  from: string; // Phone number
  to: string; // Business phone number
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'voice' | 'sticker';
  text?: {
    body: string;
  };
  image?: {
    id: string;
    url: string;
    mime_type: string;
    sha256: string;
    caption?: string;
  };
  document?: {
    id: string;
    url: string;
    filename: string;
    mime_type: string;
    sha256: string;
    caption?: string;
  };
  audio?: {
    id: string;
    url: string;
    mime_type: string;
  };
  voice?: {
    id: string;
    url: string;
    mime_type: string;
  };
  video?: {
    id: string;
    url: string;
    mime_type: string;
    caption?: string;
  };
  context?: {
    message_id: string; // Reply to message
  };
  timestamp: number;
}

export interface SlackMessage {
  ts: string; // Timestamp (unique ID)
  channel: string;
  user: string;
  text: string;
  thread_ts?: string;
  files?: Array<{
    id: string;
    name: string;
    url_private: string;
    mimetype: string;
    size: number;
  }>;
  blocks?: any[];
}

export interface TeamsMessage {
  id: string;
  from: {
    id: string;
    name: string;
  };
  conversation: {
    id: string;
  };
  text: string;
  attachments?: Array<{
    contentUrl: string;
    name: string;
    contentType: string;
  }>;
  replyToId?: string;
  timestamp: string;
}

export interface WebChatMessage {
  id: string;
  conversationId: string;
  from: string;
  text: string;
  attachments?: Array<{
    url: string;
    name: string;
    type: string;
  }>;
  timestamp: Date;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  from: {
    email: string;
    name?: string;
  };
  subject: string;
  body: string;
  bodyHtml?: string;
  attachments?: Array<{
    url: string;
    filename: string;
    contentType: string;
  }>;
  timestamp: Date;
}

export class MessageNormalizerService {
  /**
   * Normalize email message
   */
  normalizeEmail(email: EmailMessage): NormalizedMessage {
    // Determine content type based on attachments
    let contentType: ContentType = 'text';
    let mediaUrl: string | undefined;
    let mediaMetadata: any;

    if (email.attachments && email.attachments.length > 0) {
      const attachment = email.attachments[0];
      if (attachment.contentType.startsWith('image/')) {
        contentType = 'image';
        mediaUrl = attachment.url;
        mediaMetadata = {
          filename: attachment.filename,
          mimeType: attachment.contentType,
          size: attachment.size,
        };
      } else if (attachment.contentType.startsWith('application/')) {
        contentType = 'document';
        mediaUrl = attachment.url;
        mediaMetadata = {
          filename: attachment.filename,
          mimeType: attachment.contentType,
          size: attachment.size,
        };
      }
    }

    return {
      id: `email-${email.messageId}`,
      channel: 'email',
      channelMessageId: email.messageId,
      from: email.from,
      to: email.to,
      content: email.body,
      contentType,
      mediaUrl,
      mediaMetadata,
      direction: 'inbound',
      timestamp: email.receivedAt,
      metadata: {
        cc: email.cc || [],
        subject: email.subject,
        html: email.html,
        inReplyTo: email.inReplyTo,
        references: email.references,
        attachments: email.attachments || [],
      },
    };
  }

  /**
   * Normalize WhatsApp message
   */
  normalizeWhatsApp(msg: WhatsAppMessage, businessPhone: string): NormalizedMessage {
    let content = '';
    let contentType: ContentType = 'text';
    let mediaUrl: string | undefined;
    let mediaMetadata: any;

    switch (msg.type) {
      case 'text':
        content = msg.text?.body || '';
        contentType = 'text';
        break;

      case 'image':
        content = msg.image?.caption || '[Image]';
        contentType = 'image';
        mediaUrl = msg.image?.url;
        mediaMetadata = {
          mimeType: msg.image?.mime_type,
        };
        break;

      case 'document':
        content = msg.document?.caption || '[Document]';
        contentType = 'document';
        mediaUrl = msg.document?.url;
        mediaMetadata = {
          filename: msg.document?.filename,
          mimeType: msg.document?.mime_type,
        };
        break;

      case 'audio':
      case 'voice':
        content = '[Voice message]';
        contentType = 'voice';
        mediaUrl = msg.audio?.url || msg.voice?.url;
        mediaMetadata = {
          mimeType: msg.audio?.mime_type || msg.voice?.mime_type,
        };
        break;

      case 'video':
        content = msg.video?.caption || '[Video]';
        contentType = 'video';
        mediaUrl = msg.video?.url;
        mediaMetadata = {
          mimeType: msg.video?.mime_type,
        };
        break;

      case 'sticker':
        content = '[Sticker]';
        contentType = 'sticker';
        break;
    }

    return {
      id: `whatsapp-${msg.id}`,
      channel: 'whatsapp',
      channelMessageId: msg.id,
      from: msg.from,
      to: [businessPhone],
      content,
      contentType,
      mediaUrl,
      mediaMetadata,
      threadId: msg.context?.message_id ? `whatsapp-thread-${msg.from}` : undefined,
      direction: 'inbound',
      timestamp: new Date(msg.timestamp * 1000),
      metadata: {
        type: msg.type,
        context: msg.context,
        rawMessage: msg,
      },
    };
  }

  /**
   * Normalize Slack message
   */
  normalizeSlack(msg: SlackMessage, botUserId: string): NormalizedMessage {
    let contentType: ContentType = 'text';
    let mediaUrl: string | undefined;
    let mediaMetadata: any;

    if (msg.files && msg.files.length > 0) {
      const file = msg.files[0];
      if (file.mimetype.startsWith('image/')) {
        contentType = 'image';
      } else {
        contentType = 'document';
      }
      mediaUrl = file.url_private;
      mediaMetadata = {
        filename: file.name,
        mimeType: file.mimetype,
        size: file.size,
      };
    }

    return {
      id: `slack-${msg.ts}`,
      channel: 'slack',
      channelMessageId: msg.ts,
      from: msg.user,
      to: [botUserId],
      content: msg.text,
      contentType,
      mediaUrl,
      mediaMetadata,
      threadId: msg.thread_ts ? `slack-thread-${msg.thread_ts}` : undefined,
      direction: 'inbound',
      timestamp: new Date(parseFloat(msg.ts) * 1000),
      metadata: {
        channel: msg.channel,
        files: msg.files,
        blocks: msg.blocks,
      },
    };
  }

  /**
   * Normalize Teams message
   */
  normalizeTeams(msg: TeamsMessage, botId: string): NormalizedMessage {
    let contentType: ContentType = 'text';
    let mediaUrl: string | undefined;
    let mediaMetadata: any;

    if (msg.attachments && msg.attachments.length > 0) {
      const attachment = msg.attachments[0];
      contentType = attachment.contentType.startsWith('image/') ? 'image' : 'document';
      mediaUrl = attachment.contentUrl;
      mediaMetadata = {
        filename: attachment.name,
        mimeType: attachment.contentType,
      };
    }

    return {
      id: `teams-${msg.id}`,
      channel: 'teams',
      channelMessageId: msg.id,
      from: msg.from.id,
      fromName: msg.from.name,
      to: [botId],
      content: msg.text,
      contentType,
      mediaUrl,
      mediaMetadata,
      threadId: msg.replyToId ? `teams-thread-${msg.replyToId}` : undefined,
      direction: 'inbound',
      timestamp: new Date(msg.timestamp),
      metadata: {
        conversationId: msg.conversation.id,
        fromName: msg.from.name,
      },
    };
  }

  /**
   * Normalize web chat message
   */
  normalizeWebChat(msg: WebChatMessage): NormalizedMessage {
    let contentType: ContentType = 'text';
    let mediaUrl: string | undefined;
    let mediaMetadata: any;

    if (msg.attachments && msg.attachments.length > 0) {
      const attachment = msg.attachments[0];
      contentType = attachment.type.startsWith('image/') ? 'image' : 'document';
      mediaUrl = attachment.url;
      mediaMetadata = {
        filename: attachment.name,
        mimeType: attachment.type,
      };
    }

    return {
      id: `webchat-${msg.id}`,
      channel: 'webchat',
      channelMessageId: msg.id,
      from: msg.from,
      to: ['webchat-bot'],
      content: msg.text,
      contentType,
      mediaUrl,
      mediaMetadata,
      threadId: `webchat-thread-${msg.conversationId}`,
      direction: 'inbound',
      timestamp: msg.timestamp,
      metadata: {
        conversationId: msg.conversationId,
      },
    };
  }

  /**
   * Normalize ticket message
   */
  normalizeTicket(msg: TicketMessage): NormalizedMessage {
    let contentType: ContentType = 'text';
    let mediaUrl: string | undefined;
    let mediaMetadata: any;

    if (msg.attachments && msg.attachments.length > 0) {
      const attachment = msg.attachments[0];
      contentType = attachment.contentType.startsWith('image/') ? 'image' : 'document';
      mediaUrl = attachment.url;
      mediaMetadata = {
        filename: attachment.filename,
        mimeType: attachment.contentType,
      };
    }

    return {
      id: `ticket-${msg.id}`,
      channel: 'ticket',
      channelMessageId: msg.id,
      from: msg.from.email,
      fromName: msg.from.name,
      to: ['support'],
      content: msg.body,
      contentType,
      mediaUrl,
      mediaMetadata,
      threadId: `ticket-thread-${msg.ticketId}`,
      direction: 'inbound',
      timestamp: msg.timestamp,
      metadata: {
        ticketId: msg.ticketId,
        subject: msg.subject,
        bodyHtml: msg.bodyHtml,
        fromName: msg.from.name,
      },
    };
  }

  /**
   * Normalize any message based on channel
   */
  normalize(message: any, channel: Channel, context?: any): NormalizedMessage {
    switch (channel) {
      case 'email':
        return this.normalizeEmail(message as EmailMessage);
      case 'whatsapp':
        return this.normalizeWhatsApp(message as WhatsAppMessage, context?.businessPhone || '');
      case 'slack':
        return this.normalizeSlack(message as SlackMessage, context?.botUserId || '');
      case 'teams':
        return this.normalizeTeams(message as TeamsMessage, context?.botId || '');
      case 'webchat':
        return this.normalizeWebChat(message as WebChatMessage);
      case 'ticket':
        return this.normalizeTicket(message as TicketMessage);
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  /**
   * Generate thread ID based on channel and participants
   */
  generateThreadId(channel: Channel, from: string, to?: string): string {
    switch (channel) {
      case 'email':
        return `email-thread-${from}-${to || 'unknown'}`;
      case 'whatsapp':
        return `whatsapp-thread-${from}`;
      case 'slack':
        return `slack-thread-${from}`;
      case 'teams':
        return `teams-thread-${from}`;
      case 'webchat':
        return `webchat-thread-${from}`;
      case 'ticket':
        return `ticket-thread-${to || from}`;
      default:
        return `${channel}-thread-${from}`;
    }
  }

  /**
   * Extract participant identifier (email, phone, username)
   */
  extractParticipantId(message: NormalizedMessage): string {
    return message.from;
  }

  /**
   * Extract participant name if available
   */
  extractParticipantName(message: NormalizedMessage): string | undefined {
    return message.fromName || message.metadata?.fromName;
  }

  /**
   * Check if message is a reply/continuation
   */
  isReply(message: NormalizedMessage): boolean {
    return !!message.threadId || !!message.metadata?.inReplyTo || !!message.metadata?.context;
  }

  /**
   * Extract text content (strip media placeholders if needed)
   */
  extractTextContent(message: NormalizedMessage): string {
    if (message.contentType === 'text') {
      return message.content;
    }

    // For media messages, include caption/description
    return message.content.replace(/^\[.*?\]\s*/, ''); // Remove [Image], [Video], etc.
  }
}

export const messageNormalizerService = new MessageNormalizerService();
