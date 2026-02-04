/**
 * Universal Messaging GraphQL API
 * Multi-channel messaging (Email, WhatsApp, Slack, Teams, WebChat, Tickets)
 *
 * @package @ankr/universal-ai-assistant
 * @version 1.0.0
 */

import { builder } from '../builder.js';
import { Context } from '../context.js';
import { channelRouterService } from '../../services/messaging/channel-router.service.js';
import { whatsappService } from '../../services/messaging/whatsapp.service.js';
import { messageNormalizerService } from '../../services/messaging/message-normalizer.service.js';

// ============================================================================
// Enums
// ============================================================================

const ChannelEnum = builder.enumType('Channel', {
  values: ['email', 'whatsapp', 'slack', 'teams', 'webchat', 'ticket', 'sms'] as const,
});

const ContentTypeEnum = builder.enumType('ContentType', {
  values: ['text', 'image', 'document', 'voice', 'video', 'audio', 'sticker'] as const,
});

const MessageDirectionEnum = builder.enumType('MessageDirection', {
  values: ['inbound', 'outbound'] as const,
});

const MessageStatusEnum = builder.enumType('MessageStatus', {
  values: ['received', 'sent', 'delivered', 'read', 'failed'] as const,
});

// ============================================================================
// Object Types
// ============================================================================

const UniversalThreadType = builder.objectRef<any>('UniversalThread').implement({
  fields: (t) => ({
    id: t.exposeString('id'),
    channel: t.field({ type: ChannelEnum, resolve: (parent) => parent.channel }),
    participantId: t.exposeString('participantId'),
    participantName: t.exposeString('participantName', { nullable: true }),
    subject: t.exposeString('subject', { nullable: true }),
    messageCount: t.exposeInt('messageCount'),
    isRead: t.exposeBoolean('isRead'),
    isStarred: t.exposeBoolean('isStarred'),
    isPinned: t.exposeBoolean('isPinned'),
    labels: t.stringList({ resolve: (parent) => parent.labels || [] }),
    lastMessageAt: t.expose('lastMessageAt', { type: 'DateTime' }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

const MessageType = builder.objectRef<any>('Message').implement({
  fields: (t) => ({
    id: t.exposeString('id'),
    channel: t.field({ type: ChannelEnum, resolve: (parent) => parent.channel }),
    channelMessageId: t.exposeString('channelMessageId'),
    threadId: t.exposeString('threadId'),
    from: t.exposeString('from'),
    fromName: t.exposeString('fromName', { nullable: true }),
    to: t.stringList({ resolve: (parent) => parent.to }),
    content: t.exposeString('content'),
    contentType: t.field({ type: ContentTypeEnum, resolve: (parent) => parent.contentType }),
    mediaUrl: t.exposeString('mediaUrl', { nullable: true }),
    mediaMetadata: t.field({ type: 'JSON', nullable: true, resolve: (parent) => parent.mediaMetadata }),
    direction: t.field({ type: MessageDirectionEnum, resolve: (parent) => parent.direction }),
    status: t.field({ type: MessageStatusEnum, resolve: (parent) => parent.status }),
    aiGenerated: t.exposeBoolean('aiGenerated'),
    receivedAt: t.expose('receivedAt', { type: 'DateTime' }),
    metadata: t.field({ type: 'JSON', nullable: true, resolve: (parent) => parent.metadata }),
  }),
});

const ChannelStatsType = builder.objectRef<any>('ChannelStats').implement({
  fields: (t) => ({
    email: t.exposeInt('email'),
    whatsapp: t.exposeInt('whatsapp'),
    slack: t.exposeInt('slack'),
    teams: t.exposeInt('teams'),
    webchat: t.exposeInt('webchat'),
    ticket: t.exposeInt('ticket'),
    sms: t.exposeInt('sms'),
  }),
});

// ============================================================================
// Input Types
// ============================================================================

const SendWhatsAppMessageInput = builder.inputType('SendWhatsAppMessageInput', {
  fields: (t) => ({
    to: t.string({ required: true }), // Phone number with country code
    text: t.string({ required: true }),
    replyToMessageId: t.string(),
  }),
});

const ThreadFilterInput = builder.inputType('ThreadFilterInput', {
  fields: (t) => ({
    channel: t.field({ type: ChannelEnum }),
    isRead: t.boolean(),
    isStarred: t.boolean(),
    labels: t.stringList(),
  }),
});

// ============================================================================
// Queries
// ============================================================================

builder.queryField('universalThreads', (t) =>
  t.field({
    type: [UniversalThreadType],
    description: 'Get threads from all channels',
    args: {
      filters: t.arg({ type: ThreadFilterInput }),
      limit: t.arg.int({ defaultValue: 50 }),
      offset: t.arg.int({ defaultValue: 0 }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      const where: any = {
        userId: ctx.userId,
      };

      if (args.filters) {
        if (args.filters.channel) where.channel = args.filters.channel;
        if (args.filters.isRead !== undefined) where.isRead = args.filters.isRead;
        if (args.filters.isStarred !== undefined) where.isStarred = args.filters.isStarred;
        if (args.filters.labels && args.filters.labels.length > 0) {
          where.labels = { hasSome: args.filters.labels };
        }
      }

      return await ctx.prisma.universalThread.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        take: args.limit,
        skip: args.offset,
      });
    },
  })
);

builder.queryField('universalThread', (t) =>
  t.field({
    type: UniversalThreadType,
    nullable: true,
    description: 'Get single thread',
    args: {
      threadId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      return await ctx.prisma.universalThread.findUnique({
        where: {
          id: args.threadId,
          userId: ctx.userId,
        },
      });
    },
  })
);

builder.queryField('threadMessages', (t) =>
  t.field({
    type: [MessageType],
    description: 'Get messages for a thread',
    args: {
      threadId: t.arg.string({ required: true }),
      limit: t.arg.int({ defaultValue: 50 }),
      offset: t.arg.int({ defaultValue: 0 }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      // Verify thread belongs to user
      const thread = await ctx.prisma.universalThread.findUnique({
        where: { id: args.threadId, userId: ctx.userId },
      });

      if (!thread) {
        throw new Error('Thread not found');
      }

      return await ctx.prisma.message.findMany({
        where: { threadId: args.threadId },
        orderBy: { receivedAt: 'desc' },
        take: args.limit,
        skip: args.offset,
      });
    },
  })
);

builder.queryField('channelStats', (t) =>
  t.field({
    type: ChannelStatsType,
    description: 'Get message count by channel',
    resolve: async (_root, _args, ctx: Context) => {
      if (!ctx.userId || !ctx.organizationId) {
        throw new Error('Not authenticated');
      }

      return await channelRouterService.getChannelStats(ctx.organizationId);
    },
  })
);

builder.queryField('whatsappBusinessInfo', (t) =>
  t.field({
    type: 'JSON',
    nullable: true,
    description: 'Get WhatsApp Business Account info',
    resolve: async (_root, _args, ctx: Context) => {
      if (!ctx.userId || ctx.role !== 'admin') {
        throw new Error('Admin access required');
      }

      return await whatsappService.getBusinessAccountInfo();
    },
  })
);

// ============================================================================
// Mutations
// ============================================================================

builder.mutationField('sendWhatsAppMessage', (t) =>
  t.field({
    type: 'Boolean',
    description: 'Send WhatsApp message',
    args: {
      input: t.arg({ type: SendWhatsAppMessageInput, required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      const result = await whatsappService.sendTextMessage(
        args.input.to,
        args.input.text,
        args.input.replyToMessageId
      );

      return result.success;
    },
  })
);

builder.mutationField('markThreadAsRead', (t) =>
  t.boolean({
    description: 'Mark thread as read',
    args: {
      threadId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      await channelRouterService.markThreadAsRead(args.threadId, ctx.userId);
      return true;
    },
  })
);

builder.mutationField('toggleThreadStar', (t) =>
  t.boolean({
    description: 'Star/unstar thread',
    args: {
      threadId: t.arg.string({ required: true }),
      starred: t.arg.boolean({ required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      await ctx.prisma.universalThread.update({
        where: { id: args.threadId, userId: ctx.userId },
        data: { isStarred: args.starred },
      });

      return true;
    },
  })
);

builder.mutationField('addThreadLabels', (t) =>
  t.boolean({
    description: 'Add labels to thread',
    args: {
      threadId: t.arg.string({ required: true }),
      labels: t.arg.stringList({ required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      const thread = await ctx.prisma.universalThread.findUnique({
        where: { id: args.threadId, userId: ctx.userId },
      });

      if (!thread) throw new Error('Thread not found');

      const currentLabels = thread.labels || [];
      const newLabels = [...new Set([...currentLabels, ...args.labels])];

      await ctx.prisma.universalThread.update({
        where: { id: args.threadId },
        data: { labels: newLabels },
      });

      return true;
    },
  })
);

builder.mutationField('testWhatsAppConnection', (t) =>
  t.boolean({
    description: 'Test WhatsApp connection',
    resolve: async (_root, _args, ctx: Context) => {
      if (!ctx.userId || ctx.role !== 'admin') {
        throw new Error('Admin access required');
      }

      const result = await whatsappService.testConnection();
      return result.success;
    },
  })
);

builder.mutationField('enableChannel', (t) =>
  t.boolean({
    description: 'Enable/disable channel for organization',
    args: {
      channel: t.arg({ type: ChannelEnum, required: true }),
      enabled: t.arg.boolean({ required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId || !ctx.organizationId || ctx.role !== 'admin') {
        throw new Error('Admin access required');
      }

      const updateData: any = {};
      updateData[`${args.channel}Enabled`] = args.enabled;

      await ctx.prisma.organization.update({
        where: { id: ctx.organizationId },
        data: updateData,
      });

      return true;
    },
  })
);
