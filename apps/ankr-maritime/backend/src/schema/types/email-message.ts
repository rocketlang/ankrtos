import { builder } from '../builder.js';

// === EmailMessage Prisma Object ===
builder.prismaObject('EmailMessage', {
  fields: (t) => ({
    id: t.exposeID('id'),
    messageId: t.exposeString('messageId', { nullable: true }),
    threadId: t.exposeString('threadId', { nullable: true }),
    folder: t.exposeString('folder'),
    direction: t.exposeString('direction'),
    fromAddress: t.exposeString('fromAddress'),
    fromName: t.exposeString('fromName', { nullable: true }),
    toAddresses: t.exposeStringList('toAddresses'),
    ccAddresses: t.exposeStringList('ccAddresses'),
    bccAddresses: t.exposeStringList('bccAddresses'),
    subject: t.exposeString('subject', { nullable: true }),
    bodyText: t.exposeString('bodyText', { nullable: true }),
    bodyHtml: t.exposeString('bodyHtml', { nullable: true }),
    snippet: t.exposeString('snippet', { nullable: true }),
    isRead: t.exposeBoolean('isRead'),
    isStarred: t.exposeBoolean('isStarred'),
    isDraft: t.exposeBoolean('isDraft'),
    hasAttachments: t.exposeBoolean('hasAttachments'),
    attachmentNames: t.exposeStringList('attachmentNames'),
    voyageId: t.exposeString('voyageId', { nullable: true }),
    charterId: t.exposeString('charterId', { nullable: true }),
    companyId: t.exposeString('companyId', { nullable: true }),
    contactId: t.exposeString('contactId', { nullable: true }),
    leadId: t.exposeString('leadId', { nullable: true }),
    linkedEntityType: t.exposeString('linkedEntityType', { nullable: true }),
    linkedEntityId: t.exposeString('linkedEntityId', { nullable: true }),
    aiSummary: t.exposeString('aiSummary', { nullable: true }),
    aiSentiment: t.exposeString('aiSentiment', { nullable: true }),
    aiCategory: t.exposeString('aiCategory', { nullable: true }),
    aiExtractedDates: t.expose('aiExtractedDates', { type: 'JSON', nullable: true }),
    aiPriority: t.exposeString('aiPriority', { nullable: true }),
    userId: t.exposeString('userId', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    receivedAt: t.expose('receivedAt', { type: 'DateTime', nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// === Queries ===

builder.queryField('emailMessages', (t) =>
  t.prismaField({
    type: ['EmailMessage'],
    args: {
      folder: t.arg.string(),
      direction: t.arg.string(),
      isRead: t.arg.boolean(),
      userId: t.arg.string(),
      voyageId: t.arg.string(),
      charterId: t.arg.string(),
      companyId: t.arg.string(),
      contactId: t.arg.string(),
      search: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };
      if (args.folder) where.folder = args.folder;
      if (args.direction) where.direction = args.direction;
      if (args.isRead !== undefined && args.isRead !== null) where.isRead = args.isRead;
      if (args.userId) where.userId = args.userId;
      if (args.voyageId) where.voyageId = args.voyageId;
      if (args.charterId) where.charterId = args.charterId;
      if (args.companyId) where.companyId = args.companyId;
      if (args.contactId) where.contactId = args.contactId;
      if (args.search) {
        where.OR = [
          { subject: { contains: args.search, mode: 'insensitive' } },
          { fromAddress: { contains: args.search, mode: 'insensitive' } },
        ];
      }
      return ctx.prisma.emailMessage.findMany({
        ...query,
        where,
        orderBy: { receivedAt: 'desc' },
      });
    },
  }),
);

builder.queryField('emailThread', (t) =>
  t.prismaField({
    type: ['EmailMessage'],
    args: {
      threadId: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.emailMessage.findMany({
        ...query,
        where: { threadId: args.threadId, ...ctx.orgFilter() },
        orderBy: { receivedAt: 'asc' },
      }),
  }),
);

// === InboxStats custom type ===

const FolderStats = builder.objectRef<{
  folder: string;
  unreadCount: number;
  totalCount: number;
  starredCount: number;
}>('FolderStats');

FolderStats.implement({
  fields: (t) => ({
    folder: t.exposeString('folder'),
    unreadCount: t.exposeInt('unreadCount'),
    totalCount: t.exposeInt('totalCount'),
    starredCount: t.exposeInt('starredCount'),
  }),
});

const InboxStats = builder.objectRef<{
  folders: Array<{ folder: string; unreadCount: number; totalCount: number; starredCount: number }>;
  totalUnread: number;
  totalMessages: number;
  totalStarred: number;
}>('InboxStats');

InboxStats.implement({
  fields: (t) => ({
    folders: t.field({ type: [FolderStats], resolve: (parent) => parent.folders }),
    totalUnread: t.exposeInt('totalUnread'),
    totalMessages: t.exposeInt('totalMessages'),
    totalStarred: t.exposeInt('totalStarred'),
  }),
});

builder.queryField('emailInboxStats', (t) =>
  t.field({
    type: InboxStats,
    resolve: async (_root, _args, ctx) => {
      const orgWhere = ctx.orgFilter();
      const messages = await ctx.prisma.emailMessage.findMany({
        where: orgWhere,
        select: { folder: true, isRead: true, isStarred: true },
      });

      const folderMap = new Map<string, { unreadCount: number; totalCount: number; starredCount: number }>();
      let totalUnread = 0;
      let totalStarred = 0;

      for (const msg of messages) {
        let stats = folderMap.get(msg.folder);
        if (!stats) {
          stats = { unreadCount: 0, totalCount: 0, starredCount: 0 };
          folderMap.set(msg.folder, stats);
        }
        stats.totalCount++;
        if (!msg.isRead) {
          stats.unreadCount++;
          totalUnread++;
        }
        if (msg.isStarred) {
          stats.starredCount++;
          totalStarred++;
        }
      }

      const folders = Array.from(folderMap.entries()).map(([folder, stats]) => ({
        folder,
        ...stats,
      }));

      return {
        folders,
        totalUnread,
        totalMessages: messages.length,
        totalStarred,
      };
    },
  }),
);

// === Mutations ===

builder.mutationField('createEmailMessage', (t) =>
  t.prismaField({
    type: 'EmailMessage',
    args: {
      folder: t.arg.string(),
      direction: t.arg.string({ required: true }),
      fromAddress: t.arg.string({ required: true }),
      fromName: t.arg.string(),
      toAddresses: t.arg.stringList({ required: true }),
      ccAddresses: t.arg.stringList(),
      bccAddresses: t.arg.stringList(),
      subject: t.arg.string(),
      bodyText: t.arg.string(),
      bodyHtml: t.arg.string(),
      threadId: t.arg.string(),
      voyageId: t.arg.string(),
      charterId: t.arg.string(),
      companyId: t.arg.string(),
      contactId: t.arg.string(),
      leadId: t.arg.string(),
      isDraft: t.arg.boolean(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      return ctx.prisma.emailMessage.create({
        ...query,
        data: {
          messageId: crypto.randomUUID(),
          folder: args.folder ?? (args.isDraft ? 'drafts' : 'sent'),
          direction: args.direction,
          fromAddress: args.fromAddress,
          fromName: args.fromName ?? undefined,
          toAddresses: args.toAddresses ?? [],
          ccAddresses: args.ccAddresses ?? [],
          bccAddresses: args.bccAddresses ?? [],
          subject: args.subject ?? undefined,
          bodyText: args.bodyText ?? undefined,
          bodyHtml: args.bodyHtml ?? undefined,
          threadId: args.threadId ?? undefined,
          voyageId: args.voyageId ?? undefined,
          charterId: args.charterId ?? undefined,
          companyId: args.companyId ?? undefined,
          contactId: args.contactId ?? undefined,
          leadId: args.leadId ?? undefined,
          isDraft: args.isDraft ?? false,
          isRead: true,
          isStarred: false,
          hasAttachments: false,
          receivedAt: new Date(),
          organizationId: orgId,
        },
      });
    },
  }),
);

builder.mutationField('markEmailRead', (t) =>
  t.prismaField({
    type: 'EmailMessage',
    args: {
      id: t.arg.string({ required: true }),
      isRead: t.arg.boolean({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.emailMessage.update({
        ...query,
        where: { id: args.id },
        data: { isRead: args.isRead },
      }),
  }),
);

builder.mutationField('starEmail', (t) =>
  t.prismaField({
    type: 'EmailMessage',
    args: {
      id: t.arg.string({ required: true }),
      isStarred: t.arg.boolean({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.emailMessage.update({
        ...query,
        where: { id: args.id },
        data: { isStarred: args.isStarred },
      }),
  }),
);

builder.mutationField('moveEmail', (t) =>
  t.prismaField({
    type: 'EmailMessage',
    args: {
      id: t.arg.string({ required: true }),
      folder: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.emailMessage.update({
        ...query,
        where: { id: args.id },
        data: { folder: args.folder },
      }),
  }),
);

builder.mutationField('linkEmailToEntity', (t) =>
  t.prismaField({
    type: 'EmailMessage',
    args: {
      id: t.arg.string({ required: true }),
      entityType: t.arg.string({ required: true }),
      entityId: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) => {
      const data: Record<string, unknown> = {
        linkedEntityType: args.entityType,
        linkedEntityId: args.entityId,
      };
      // Also set the typed FK field when applicable
      const typeMap: Record<string, string> = {
        voyage: 'voyageId',
        charter: 'charterId',
        company: 'companyId',
        contact: 'contactId',
        lead: 'leadId',
      };
      const fkField = typeMap[args.entityType.toLowerCase()];
      if (fkField) {
        data[fkField] = args.entityId;
      }
      return ctx.prisma.emailMessage.update({
        ...query,
        where: { id: args.id },
        data,
      });
    },
  }),
);

builder.mutationField('deleteEmail', (t) =>
  t.prismaField({
    type: 'EmailMessage',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const email = await ctx.prisma.emailMessage.findUnique({ where: { id: args.id } });
      if (!email) throw new Error('Email not found');

      if (email.folder === 'trash') {
        // Permanently delete if already in trash
        return ctx.prisma.emailMessage.delete({
          ...query,
          where: { id: args.id },
        });
      }

      // Move to trash
      return ctx.prisma.emailMessage.update({
        ...query,
        where: { id: args.id },
        data: { folder: 'trash' },
      });
    },
  }),
);

builder.mutationField('bulkMarkRead', (t) =>
  t.field({
    type: 'Int',
    args: {
      ids: t.arg.stringList({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const result = await ctx.prisma.emailMessage.updateMany({
        where: {
          id: { in: args.ids },
          ...ctx.orgFilter(),
        },
        data: { isRead: true },
      });
      return result.count;
    },
  }),
);
