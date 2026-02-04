import { builder } from '../builder.js';

builder.prismaObject('Notification', {
  fields: (t) => ({
    id: t.exposeID('id'),
    userId: t.exposeString('userId', { nullable: true }),
    type: t.exposeString('type'),
    title: t.exposeString('title'),
    message: t.exposeString('message'),
    entityType: t.exposeString('entityType', { nullable: true }),
    entityId: t.exposeString('entityId', { nullable: true }),
    read: t.exposeBoolean('read'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

builder.queryField('notifications', (t) =>
  t.prismaField({
    type: ['Notification'],
    args: { unreadOnly: t.arg.boolean() },
    resolve: (query, _root, args, ctx) => {
      const userId = ctx.user?.id;
      return ctx.prisma.notification.findMany({
        ...query,
        where: {
          OR: [{ userId }, { userId: null }],
          ...(args.unreadOnly ? { read: false } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    },
  }),
);

builder.queryField('unreadNotificationCount', (t) =>
  t.field({
    type: 'Int',
    resolve: async (_root, _args, ctx) => {
      const userId = ctx.user?.id;
      return ctx.prisma.notification.count({
        where: {
          OR: [{ userId }, { userId: null }],
          read: false,
        },
      });
    },
  }),
);

builder.mutationField('markNotificationRead', (t) =>
  t.prismaField({
    type: 'Notification',
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.notification.update({
        ...query,
        where: { id: args.id },
        data: { read: true },
      }),
  }),
);

builder.mutationField('markAllNotificationsRead', (t) =>
  t.field({
    type: 'Int',
    resolve: async (_root, _args, ctx) => {
      const userId = ctx.user?.id;
      const result = await ctx.prisma.notification.updateMany({
        where: {
          OR: [{ userId }, { userId: null }],
          read: false,
        },
        data: { read: true },
      });
      return result.count;
    },
  }),
);

// Helper: create notification (used by other mutations)
export async function createNotification(
  prisma: import('@prisma/client').PrismaClient,
  data: {
    userId?: string;
    type: string;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
  },
) {
  return prisma.notification.create({ data });
}
