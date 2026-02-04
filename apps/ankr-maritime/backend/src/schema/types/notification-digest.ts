import { builder } from '../builder.js';

// === NotificationDigest Prisma Object ===
builder.prismaObject('NotificationDigest', {
  fields: (t) => ({
    id: t.exposeID('id'),
    userId: t.exposeString('userId'),
    digestType: t.exposeString('digestType'),
    period: t.exposeString('period'),
    status: t.exposeString('status'),
    channel: t.exposeString('channel'),
    totalEvents: t.exposeInt('totalEvents'),
    categories: t.expose('categories', { type: 'JSON', nullable: true }),
    highlights: t.expose('highlights', { type: 'JSON', nullable: true }),
    htmlContent: t.exposeString('htmlContent', { nullable: true }),
    textContent: t.exposeString('textContent', { nullable: true }),
    sentAt: t.expose('sentAt', { type: 'DateTime', nullable: true }),
    deliveredAt: t.expose('deliveredAt', { type: 'DateTime', nullable: true }),
    openedAt: t.expose('openedAt', { type: 'DateTime', nullable: true }),
    errorMessage: t.exposeString('errorMessage', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// === Queries ===

builder.queryField('notificationDigests', (t) =>
  t.prismaField({
    type: ['NotificationDigest'],
    args: {
      userId: t.arg.string(),
      digestType: t.arg.string(),
      status: t.arg.string(),
      channel: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };
      if (args.userId) where.userId = args.userId;
      if (args.digestType) where.digestType = args.digestType;
      if (args.status) where.status = args.status;
      if (args.channel) where.channel = args.channel;
      return ctx.prisma.notificationDigest.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  }),
);

builder.queryField('latestDigest', (t) =>
  t.prismaField({
    type: 'NotificationDigest',
    nullable: true,
    args: {
      userId: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.notificationDigest.findFirst({
        ...query,
        where: { userId: args.userId, ...ctx.orgFilter() },
        orderBy: { createdAt: 'desc' },
      }),
  }),
);

// === DigestPreference custom type ===

const DigestPreference = builder.objectRef<{
  userId: string;
  digestType: string;
  channel: string;
  isEnabled: boolean;
}>('DigestPreference');

DigestPreference.implement({
  fields: (t) => ({
    userId: t.exposeString('userId'),
    digestType: t.exposeString('digestType'),
    channel: t.exposeString('channel'),
    isEnabled: t.exposeBoolean('isEnabled'),
  }),
});

// === Mutations ===

builder.mutationField('generateDigest', (t) =>
  t.prismaField({
    type: 'NotificationDigest',
    args: {
      userId: t.arg.string({ required: true }),
      digestType: t.arg.string({ required: true }),
      period: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      return ctx.prisma.notificationDigest.create({
        ...query,
        data: {
          userId: args.userId,
          digestType: args.digestType,
          period: args.period,
          status: 'pending',
          channel: 'email',
          totalEvents: 0,
          organizationId: orgId,
        },
      });
    },
  }),
);

builder.mutationField('sendDigest', (t) =>
  t.prismaField({
    type: 'NotificationDigest',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const digest = await ctx.prisma.notificationDigest.findUnique({ where: { id: args.id } });
      if (!digest) throw new Error('Digest not found');
      if (digest.status === 'sent') throw new Error('Digest has already been sent');

      return ctx.prisma.notificationDigest.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });
    },
  }),
);

builder.mutationField('updateDigestPreference', (t) =>
  t.field({
    type: DigestPreference,
    args: {
      userId: t.arg.string({ required: true }),
      digestType: t.arg.string({ required: true }),
      channel: t.arg.string({ required: true }),
      isEnabled: t.arg.boolean({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      // Upsert the preference — store as a digest record with a special status
      // If disabled, remove any pending digests for this user/type/channel combination
      if (!args.isEnabled) {
        await ctx.prisma.notificationDigest.deleteMany({
          where: {
            userId: args.userId,
            digestType: args.digestType,
            channel: args.channel,
            status: 'pending',
            ...ctx.orgFilter(),
          },
        });
      }

      return {
        userId: args.userId,
        digestType: args.digestType,
        channel: args.channel,
        isEnabled: args.isEnabled,
      };
    },
  }),
);
