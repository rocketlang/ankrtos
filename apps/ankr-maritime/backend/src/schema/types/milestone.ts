import { builder } from '../builder.js';

builder.prismaObject('VoyageMilestone', {
  fields: (t) => ({
    id: t.exposeID('id'),
    voyageId: t.exposeString('voyageId'),
    portId: t.exposeString('portId', { nullable: true }),
    type: t.exposeString('type'),
    planned: t.expose('planned', { type: 'DateTime', nullable: true }),
    actual: t.expose('actual', { type: 'DateTime', nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.queryField('voyageMilestones', (t) =>
  t.prismaField({
    type: ['VoyageMilestone'],
    args: { voyageId: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.voyageMilestone.findMany({
        ...query,
        where: { voyageId: args.voyageId },
        orderBy: { createdAt: 'asc' },
      }),
  }),
);

builder.mutationField('addMilestone', (t) =>
  t.prismaField({
    type: 'VoyageMilestone',
    args: {
      voyageId: t.arg.string({ required: true }),
      portId: t.arg.string(),
      type: t.arg.string({ required: true }),
      planned: t.arg({ type: 'DateTime' }),
      actual: t.arg({ type: 'DateTime' }),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.voyageMilestone.create({
        ...query,
        data: {
          voyageId: args.voyageId,
          portId: args.portId ?? undefined,
          type: args.type,
          planned: args.planned ?? undefined,
          actual: args.actual ?? undefined,
          notes: args.notes ?? undefined,
        },
      }),
  }),
);

builder.mutationField('updateMilestone', (t) =>
  t.prismaField({
    type: 'VoyageMilestone',
    args: {
      id: t.arg.string({ required: true }),
      actual: t.arg({ type: 'DateTime' }),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.voyageMilestone.update({
        ...query,
        where: { id: args.id },
        data: {
          actual: args.actual ?? undefined,
          notes: args.notes ?? undefined,
        },
      }),
  }),
);
