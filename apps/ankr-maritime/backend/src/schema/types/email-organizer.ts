/**
 * Email Organizer GraphQL API
 * Folders, threading, summaries, and notifications
 *
 * @package @ankr/email-organizer
 * @version 1.0.0
 */

import { builder } from '../builder.js';
import { Context } from '../context.js';
import {
  emailFolderService,
  emailThreadingService,
  emailSummaryService,
} from '../../services/email-organizer/index.js';

// ============================================================================
// Object Types
// ============================================================================

const EmailFolderType = builder.prismaObject('EmailFolder', {
  fields: (t) => ({
    id: t.exposeID('id'),
    userId: t.exposeString('userId'),
    organizationId: t.exposeString('organizationId'),
    name: t.exposeString('name'),
    type: t.exposeString('type'),
    icon: t.string({ nullable: true, resolve: (parent) => parent.icon }),
    color: t.string({ nullable: true, resolve: (parent) => parent.color }),
    position: t.exposeInt('position'),
    parentId: t.string({ nullable: true, resolve: (parent) => parent.parentId }),
    unreadCount: t.exposeInt('unreadCount'),
    totalCount: t.exposeInt('totalCount'),
    parent: t.relation('parent', { nullable: true }),
    children: t.relation('children'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

const EmailThreadType = builder.prismaObject('EmailThread', {
  fields: (t) => ({
    id: t.exposeID('id'),
    userId: t.exposeString('userId'),
    organizationId: t.exposeString('organizationId'),
    subject: t.exposeString('subject'),
    participants: t.stringList({ resolve: (parent) => parent.participants }),
    messageCount: t.exposeInt('messageCount'),
    unreadCount: t.exposeInt('unreadCount'),
    firstMessageId: t.string({ nullable: true, resolve: (parent) => parent.firstMessageId }),
    latestMessageId: t.string({ nullable: true, resolve: (parent) => parent.latestMessageId }),
    category: t.string({ nullable: true, resolve: (parent) => parent.category }),
    urgency: t.string({ nullable: true, resolve: (parent) => parent.urgency }),
    urgencyScore: t.int({ nullable: true, resolve: (parent) => parent.urgencyScore }),
    actionable: t.string({ nullable: true, resolve: (parent) => parent.actionable }),
    labels: t.stringList({ resolve: (parent) => parent.labels }),
    isStarred: t.exposeBoolean('isStarred'),
    isArchived: t.exposeBoolean('isArchived'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

const EmailSummaryType = builder.objectRef<{
  summary: string;
  keyPoints: string[];
  action: string;
  confidence: number;
}>('EmailSummary').implement({
  fields: (t) => ({
    summary: t.exposeString('summary'),
    keyPoints: t.stringList({ resolve: (parent) => parent.keyPoints }),
    action: t.exposeString('action'),
    confidence: t.exposeFloat('confidence'),
  }),
});

const EmailIndicatorsType = builder.objectRef<{
  total: number;
  byFolder: Record<string, number>;
  byUrgency: Record<string, number>;
  starred: number;
  requiresResponse: number;
  requiresApproval: number;
  overdue: number;
}>('EmailIndicators').implement({
  fields: (t) => ({
    total: t.exposeInt('total'),
    byFolder: t.field({
      type: 'JSON',
      resolve: (parent) => parent.byFolder,
    }),
    byUrgency: t.field({
      type: 'JSON',
      resolve: (parent) => parent.byUrgency,
    }),
    starred: t.exposeInt('starred'),
    requiresResponse: t.exposeInt('requiresResponse'),
    requiresApproval: t.exposeInt('requiresApproval'),
    overdue: t.exposeInt('overdue'),
  }),
});

const ResponseDraftType = builder.prismaObject('ResponseDraft', {
  fields: (t) => ({
    id: t.exposeID('id'),
    emailId: t.exposeString('emailId'),
    userId: t.exposeString('userId'),
    organizationId: t.exposeString('organizationId'),
    style: t.exposeString('style'),
    subject: t.exposeString('subject'),
    body: t.exposeString('body'),
    contextDocs: t.field({ type: 'JSON', nullable: true, resolve: (parent) => parent.contextDocs }),
    contextKnowledge: t.field({ type: 'JSON', nullable: true, resolve: (parent) => parent.contextKnowledge }),
    threadHistory: t.field({ type: 'JSON', nullable: true, resolve: (parent) => parent.threadHistory }),
    status: t.exposeString('status'),
    confidence: t.float({ nullable: true, resolve: (parent) => parent.confidence }),
    sentAt: t.expose('sentAt', { type: 'DateTime', nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// ============================================================================
// Input Types
// ============================================================================

const CreateFolderInput = builder.inputType('CreateFolderInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    type: t.string({ required: true }),
    icon: t.string(),
    color: t.string(),
    parentId: t.string(),
    position: t.int(),
  }),
});

const UpdateFolderInput = builder.inputType('UpdateFolderInput', {
  fields: (t) => ({
    name: t.string(),
    icon: t.string(),
    color: t.string(),
    parentId: t.string(),
    position: t.int(),
  }),
});

const ThreadFilterInput = builder.inputType('ThreadFilterInput', {
  fields: (t) => ({
    category: t.string(),
    urgency: t.string(),
    isStarred: t.boolean(),
    isArchived: t.boolean(),
    limit: t.int(),
    offset: t.int(),
  }),
});

const EmailSummaryInput = builder.inputType('EmailSummaryInput', {
  fields: (t) => ({
    subject: t.string({ required: true }),
    body: t.string({ required: true }),
    from: t.string({ required: true }),
    category: t.string(),
    urgency: t.string(),
    entities: t.field({ type: 'JSON' }),
  }),
});

// ============================================================================
// Queries
// ============================================================================

builder.queryField('emailFolders', (t) =>
  t.field({
    type: [EmailFolderType],
    description: 'Get all folders for current user',
    resolve: async (_root, _args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');
      return await emailFolderService.getUserFolders(ctx.userId);
    },
  })
);

builder.queryField('emailFolderTree', (t) =>
  t.field({
    type: [EmailFolderType],
    description: 'Get folder tree (hierarchical structure)',
    resolve: async (_root, _args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');
      return await emailFolderService.getFolderTree(ctx.userId);
    },
  })
);

builder.queryField('emailFolder', (t) =>
  t.prismaField({
    type: 'EmailFolder',
    nullable: true,
    description: 'Get folder by ID',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');
      return await ctx.prisma.emailFolder.findFirst({
        ...query,
        where: {
          id: args.id,
          userId: ctx.userId,
        },
      });
    },
  })
);

builder.queryField('emailThreads', (t) =>
  t.field({
    type: [EmailThreadType],
    description: 'Get email threads with filters',
    args: {
      filter: t.arg({ type: ThreadFilterInput }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      const filter = args.filter || {};
      return await emailThreadingService.getThreads(ctx.userId, {
        category: filter.category || undefined,
        urgency: filter.urgency || undefined,
        isStarred: filter.isStarred !== null ? filter.isStarred : undefined,
        isArchived: filter.isArchived !== null ? filter.isArchived : undefined,
        limit: filter.limit || 50,
        offset: filter.offset || 0,
      });
    },
  })
);

builder.queryField('emailThread', (t) =>
  t.field({
    type: 'JSON',
    description: 'Get thread with messages',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');
      return await emailThreadingService.getThread(args.id, ctx.userId);
    },
  })
);

builder.queryField('emailIndicators', (t) =>
  t.field({
    type: EmailIndicatorsType,
    description: 'Get real-time email indicators',
    resolve: async (_root, _args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      // TODO: Implement actual counts from EmailMessage
      // For now, return mock data
      return {
        total: 0,
        byFolder: {},
        byUrgency: {},
        starred: 0,
        requiresResponse: 0,
        requiresApproval: 0,
        overdue: 0,
      };
    },
  })
);

// ============================================================================
// Mutations
// ============================================================================

builder.mutationField('initializeEmailFolders', (t) =>
  t.field({
    type: 'Boolean',
    description: 'Initialize system folders for user',
    resolve: async (_root, _args, ctx: Context) => {
      if (!ctx.userId || !ctx.organizationId) {
        throw new Error('Not authenticated');
      }

      await emailFolderService.initializeSystemFolders(ctx.userId, ctx.organizationId);
      return true;
    },
  })
);

builder.mutationField('createEmailFolder', (t) =>
  t.field({
    type: EmailFolderType,
    description: 'Create a custom folder',
    args: {
      input: t.arg({ type: CreateFolderInput, required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId || !ctx.organizationId) {
        throw new Error('Not authenticated');
      }

      return await emailFolderService.createFolder({
        userId: ctx.userId,
        organizationId: ctx.organizationId,
        name: args.input.name,
        type: args.input.type as any,
        icon: args.input.icon,
        color: args.input.color,
        parentId: args.input.parentId,
        position: args.input.position,
      });
    },
  })
);

builder.mutationField('updateEmailFolder', (t) =>
  t.field({
    type: EmailFolderType,
    description: 'Update a folder',
    args: {
      id: t.arg.string({ required: true }),
      input: t.arg({ type: UpdateFolderInput, required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      return await emailFolderService.updateFolder(args.id, ctx.userId, {
        name: args.input.name,
        icon: args.input.icon,
        color: args.input.color,
        parentId: args.input.parentId,
        position: args.input.position,
      });
    },
  })
);

builder.mutationField('deleteEmailFolder', (t) =>
  t.field({
    type: 'Boolean',
    description: 'Delete a folder',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      await emailFolderService.deleteFolder(args.id, ctx.userId);
      return true;
    },
  })
);

builder.mutationField('moveEmailToFolder', (t) =>
  t.field({
    type: 'Boolean',
    description: 'Move email to a folder',
    args: {
      emailId: t.arg.string({ required: true }),
      folderId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      await emailFolderService.moveEmailToFolder(args.emailId, args.folderId, ctx.userId);
      return true;
    },
  })
);

builder.mutationField('markEmailThreadAsRead', (t) =>
  t.field({
    type: 'Boolean',
    description: 'Mark thread as read/unread',
    args: {
      threadId: t.arg.string({ required: true }),
      read: t.arg.boolean({ required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      await emailThreadingService.markThreadAsRead(args.threadId, ctx.userId, args.read);
      return true;
    },
  })
);

builder.mutationField('toggleEmailThreadStar', (t) =>
  t.field({
    type: EmailThreadType,
    description: 'Star/unstar a thread',
    args: {
      threadId: t.arg.string({ required: true }),
      starred: t.arg.boolean(),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      return await emailThreadingService.toggleThreadStar(
        args.threadId,
        ctx.userId,
        args.starred !== null ? args.starred : undefined
      );
    },
  })
);

builder.mutationField('archiveThread', (t) =>
  t.field({
    type: EmailThreadType,
    description: 'Archive/unarchive a thread',
    args: {
      threadId: t.arg.string({ required: true }),
      archived: t.arg.boolean({ required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      return await emailThreadingService.archiveThread(args.threadId, ctx.userId, args.archived);
    },
  })
);

builder.mutationField('addEmailThreadLabels', (t) =>
  t.field({
    type: EmailThreadType,
    description: 'Add labels to a thread',
    args: {
      threadId: t.arg.string({ required: true }),
      labels: t.arg.stringList({ required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      return await emailThreadingService.addThreadLabels(args.threadId, ctx.userId, args.labels);
    },
  })
);

builder.mutationField('removeThreadLabels', (t) =>
  t.field({
    type: EmailThreadType,
    description: 'Remove labels from a thread',
    args: {
      threadId: t.arg.string({ required: true }),
      labels: t.arg.stringList({ required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      return await emailThreadingService.removeThreadLabels(args.threadId, ctx.userId, args.labels);
    },
  })
);

builder.mutationField('generateEmailSummary', (t) =>
  t.field({
    type: EmailSummaryType,
    description: 'Generate AI summary for an email',
    args: {
      input: t.arg({ type: EmailSummaryInput, required: true }),
    },
    resolve: async (_root, args) => {
      return await emailSummaryService.generateSummary({
        subject: args.input.subject,
        body: args.input.body,
        from: args.input.from,
        category: args.input.category,
        urgency: args.input.urgency,
        entities: args.input.entities,
      });
    },
  })
);

builder.mutationField('extractActionItems', (t) =>
  t.stringList({
    description: 'Extract action items from email',
    args: {
      input: t.arg({ type: EmailSummaryInput, required: true }),
    },
    resolve: async (_root, args) => {
      return await emailSummaryService.extractActionItems({
        subject: args.input.subject,
        body: args.input.body,
        from: args.input.from,
        category: args.input.category,
        urgency: args.input.urgency,
        entities: args.input.entities,
      });
    },
  })
);

builder.mutationField('detectEmailSentiment', (t) =>
  t.field({
    type: 'JSON',
    description: 'Detect sentiment from email',
    args: {
      input: t.arg({ type: EmailSummaryInput, required: true }),
    },
    resolve: async (_root, args) => {
      return await emailSummaryService.detectSentiment({
        subject: args.input.subject,
        body: args.input.body,
        from: args.input.from,
        category: args.input.category,
        urgency: args.input.urgency,
        entities: args.input.entities,
      });
    },
  })
);
