import { builder } from '../builder.js'

// ── Prisma Object ────────────────────────────────────────────

builder.prismaObject('MentionNotification', {
  fields: (t) => ({
    id: t.exposeID('id'),
    organizationId: t.exposeString('organizationId'),
    mentionedUserId: t.exposeString('mentionedUserId'),
    mentionedBy: t.exposeString('mentionedBy'),
    entityType: t.exposeString('entityType'),
    entityId: t.exposeString('entityId'),
    context: t.exposeString('context'),
    fieldName: t.exposeString('fieldName', { nullable: true }),
    read: t.exposeBoolean('read'),
    readAt: t.expose('readAt', { type: 'DateTime', nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
})

// ── Queries ──────────────────────────────────────────────────

builder.queryField('myMentions', (t) =>
  t.prismaField({
    type: ['MentionNotification'],
    args: {
      read: t.arg.boolean({ required: false }),
    },
    resolve: (query, _root, args, ctx) => {
      const userId = ctx.user?.id
      if (!userId) throw new Error('Authentication required')
      return ctx.prisma.mentionNotification.findMany({
        ...query,
        where: {
          mentionedUserId: userId,
          ...(args.read != null && { read: args.read }),
        },
        orderBy: { createdAt: 'desc' },
      })
    },
  }),
)

builder.queryField('unreadMentionCount', (t) =>
  t.field({
    type: 'Int',
    resolve: async (_root, _args, ctx) => {
      const userId = ctx.user?.id
      if (!userId) throw new Error('Authentication required')
      return ctx.prisma.mentionNotification.count({
        where: { mentionedUserId: userId, read: false },
      })
    },
  }),
)

builder.queryField('mentionsForEntity', (t) =>
  t.prismaField({
    type: ['MentionNotification'],
    args: {
      entityType: t.arg.string({ required: true }),
      entityId: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.user?.organizationId
      return ctx.prisma.mentionNotification.findMany({
        ...query,
        where: {
          entityType: args.entityType,
          entityId: args.entityId,
          ...(orgId && { organizationId: orgId }),
        },
        orderBy: { createdAt: 'desc' },
      })
    },
  }),
)

// ── Mutations ────────────────────────────────────────────────

builder.mutationField('createMention', (t) =>
  t.prismaField({
    type: 'MentionNotification',
    args: {
      mentionedUserId: t.arg.string({ required: true }),
      entityType: t.arg.string({ required: true }),
      entityId: t.arg.string({ required: true }),
      context: t.arg.string({ required: true }),
      fieldName: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId()
      const mentionedBy = ctx.user?.name ?? 'Unknown'
      return ctx.prisma.mentionNotification.create({
        ...query,
        data: {
          organizationId: orgId,
          mentionedUserId: args.mentionedUserId,
          mentionedBy,
          entityType: args.entityType,
          entityId: args.entityId,
          context: args.context,
          fieldName: args.fieldName ?? undefined,
        },
      })
    },
  }),
)

builder.mutationField('markMentionRead', (t) =>
  t.prismaField({
    type: 'MentionNotification',
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.mentionNotification.update({
        ...query,
        where: { id: args.id },
        data: {
          read: true,
          readAt: new Date(),
        },
      }),
  }),
)

builder.mutationField('markAllMentionsRead', (t) =>
  t.field({
    type: 'Int',
    resolve: async (_root, _args, ctx) => {
      const userId = ctx.user?.id
      if (!userId) throw new Error('Authentication required')
      const result = await ctx.prisma.mentionNotification.updateMany({
        where: { mentionedUserId: userId, read: false },
        data: { read: true, readAt: new Date() },
      })
      return result.count
    },
  }),
)
