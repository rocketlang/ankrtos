import { builder } from '../builder.js';

builder.prismaObject('AlertPreference', {
  fields: (t) => ({
    id: t.exposeID('id'),
    userId: t.exposeString('userId'),
    eventType: t.exposeString('eventType'),
    emailEnabled: t.exposeBoolean('emailEnabled'),
    whatsappEnabled: t.exposeBoolean('whatsappEnabled'),
    pushEnabled: t.exposeBoolean('pushEnabled'),
    phone: t.exposeString('phone', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

builder.prismaObject('AlertLog', {
  fields: (t) => ({
    id: t.exposeID('id'),
    userId: t.exposeString('userId', { nullable: true }),
    eventType: t.exposeString('eventType'),
    channel: t.exposeString('channel'),
    recipient: t.exposeString('recipient'),
    subject: t.exposeString('subject', { nullable: true }),
    message: t.exposeString('message'),
    status: t.exposeString('status'),
    entityType: t.exposeString('entityType', { nullable: true }),
    entityId: t.exposeString('entityId', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

// Queries
builder.queryField('alertPreferences', (t) =>
  t.prismaField({
    type: ['AlertPreference'],
    resolve: (query, _root, _args, ctx) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error('Authentication required');
      return ctx.prisma.alertPreference.findMany({ ...query, where: { userId }, orderBy: { eventType: 'asc' } });
    },
  }),
);

builder.queryField('alertLogs', (t) =>
  t.prismaField({
    type: ['AlertLog'],
    args: { eventType: t.arg.string(), channel: t.arg.string(), limit: t.arg.int() },
    resolve: (query, _root, args, ctx) => {
      const userId = ctx.user?.id;
      return ctx.prisma.alertLog.findMany({
        ...query,
        where: {
          ...(userId ? { userId } : {}),
          ...(args.eventType ? { eventType: args.eventType } : {}),
          ...(args.channel ? { channel: args.channel } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: args.limit ?? 50,
      });
    },
  }),
);

// Alert stats
const AlertStats = builder.objectRef<{
  totalSent: number;
  emailSent: number;
  whatsappSent: number;
  pushSent: number;
  failedCount: number;
}>('AlertStats');

AlertStats.implement({
  fields: (t) => ({
    totalSent: t.exposeInt('totalSent'),
    emailSent: t.exposeInt('emailSent'),
    whatsappSent: t.exposeInt('whatsappSent'),
    pushSent: t.exposeInt('pushSent'),
    failedCount: t.exposeInt('failedCount'),
  }),
});

builder.queryField('alertStats', (t) =>
  t.field({
    type: AlertStats,
    resolve: async (_root, _args, ctx) => {
      const userId = ctx.user?.id;
      const where = userId ? { userId } : {};
      const [totalSent, emailSent, whatsappSent, pushSent, failedCount] = await Promise.all([
        ctx.prisma.alertLog.count({ where: { ...where, status: 'sent' } }),
        ctx.prisma.alertLog.count({ where: { ...where, channel: 'email', status: 'sent' } }),
        ctx.prisma.alertLog.count({ where: { ...where, channel: 'whatsapp', status: 'sent' } }),
        ctx.prisma.alertLog.count({ where: { ...where, channel: 'push', status: 'sent' } }),
        ctx.prisma.alertLog.count({ where: { ...where, status: 'failed' } }),
      ]);
      return { totalSent, emailSent, whatsappSent, pushSent, failedCount };
    },
  }),
);

// Mutations
builder.mutationField('upsertAlertPreference', (t) =>
  t.prismaField({
    type: 'AlertPreference',
    args: {
      eventType: t.arg.string({ required: true }),
      emailEnabled: t.arg.boolean({ required: true }),
      whatsappEnabled: t.arg.boolean({ required: true }),
      pushEnabled: t.arg.boolean({ required: true }),
      phone: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error('Authentication required');
      return ctx.prisma.alertPreference.upsert({
        ...query,
        where: { userId_eventType: { userId, eventType: args.eventType } },
        update: {
          emailEnabled: args.emailEnabled,
          whatsappEnabled: args.whatsappEnabled,
          pushEnabled: args.pushEnabled,
          phone: args.phone ?? undefined,
        },
        create: {
          userId,
          eventType: args.eventType,
          emailEnabled: args.emailEnabled,
          whatsappEnabled: args.whatsappEnabled,
          pushEnabled: args.pushEnabled,
          phone: args.phone ?? undefined,
        },
      });
    },
  }),
);

// Send test alert (creates log entry simulating a sent alert)
builder.mutationField('sendTestAlert', (t) =>
  t.prismaField({
    type: 'AlertLog',
    args: {
      channel: t.arg.string({ required: true }),
      message: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) => {
      const userId = ctx.user?.id;
      const recipient = args.channel === 'email' ? (ctx.user?.email ?? 'test@ankr.in') : (ctx.user?.phone ?? '+919999999999');
      return ctx.prisma.alertLog.create({
        ...query,
        data: {
          userId: userId ?? undefined,
          eventType: 'test',
          channel: args.channel,
          recipient,
          subject: 'Test Alert — Mari8x',
          message: args.message,
          status: 'sent',
        },
      });
    },
  }),
);
