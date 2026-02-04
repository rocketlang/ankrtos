import { builder } from '../builder.js';

builder.prismaObject('ActivityLog', {
  fields: (t) => ({
    id: t.exposeID('id'),
    userId: t.exposeString('userId', { nullable: true }),
    userName: t.exposeString('userName', { nullable: true }),
    action: t.exposeString('action'),
    entityType: t.exposeString('entityType'),
    entityId: t.exposeString('entityId'),
    details: t.exposeString('details', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

builder.queryField('activityLogs', (t) =>
  t.prismaField({
    type: ['ActivityLog'],
    args: {
      entityType: t.arg.string(),
      entityId: t.arg.string(),
      limit: t.arg.int(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.activityLog.findMany({
        ...query,
        where: {
          ...(args.entityType ? { entityType: args.entityType } : {}),
          ...(args.entityId ? { entityId: args.entityId } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: args.limit ?? 50,
      }),
  }),
);

builder.mutationField('logActivity', (t) =>
  t.prismaField({
    type: 'ActivityLog',
    args: {
      userId: t.arg.string(),
      userName: t.arg.string(),
      action: t.arg.string({ required: true }),
      entityType: t.arg.string({ required: true }),
      entityId: t.arg.string({ required: true }),
      details: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.activityLog.create({
        ...query,
        data: {
          userId: args.userId ?? undefined,
          userName: args.userName ?? undefined,
          action: args.action,
          entityType: args.entityType,
          entityId: args.entityId,
          details: args.details ?? undefined,
        },
      }),
  }),
);
