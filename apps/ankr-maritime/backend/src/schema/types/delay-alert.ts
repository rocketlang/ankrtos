import { builder } from '../builder.js';

builder.prismaObject('DelayAlert', {
  fields: (t) => ({
    id: t.exposeID('id'),
    voyageId: t.exposeString('voyageId'),
    portCallId: t.exposeString('portCallId', { nullable: true }),
    type: t.exposeString('type'),
    severity: t.exposeString('severity'),
    rootCause: t.exposeString('rootCause', { nullable: true }),
    description: t.exposeString('description'),
    delayHours: t.exposeFloat('delayHours', { nullable: true }),
    eta: t.expose('eta', { type: 'DateTime', nullable: true }),
    resolvedAt: t.expose('resolvedAt', { type: 'DateTime', nullable: true }),
    resolvedBy: t.exposeString('resolvedBy', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    voyage: t.relation('voyage'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// === Queries ===

builder.queryField('delayAlerts', (t) =>
  t.prismaField({
    type: ['DelayAlert'],
    args: {
      voyageId: t.arg.string(),
      severity: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = {};
      if (args.voyageId) where.voyageId = args.voyageId;
      if (args.severity) where.severity = args.severity;
      return ctx.prisma.delayAlert.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  }),
);

builder.queryField('activeDelayAlerts', (t) =>
  t.prismaField({
    type: ['DelayAlert'],
    resolve: (query, _root, _args, ctx) =>
      ctx.prisma.delayAlert.findMany({
        ...query,
        where: { resolvedAt: null },
        orderBy: { createdAt: 'desc' },
      }),
  }),
);

// === Mutations ===

builder.mutationField('createDelayAlert', (t) =>
  t.prismaField({
    type: 'DelayAlert',
    args: {
      voyageId: t.arg.string({ required: true }),
      type: t.arg.string({ required: true }),
      severity: t.arg.string(),
      description: t.arg.string({ required: true }),
      delayHours: t.arg.float(),
      rootCause: t.arg.string(),
      eta: t.arg({ type: 'DateTime' }),
      portCallId: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.delayAlert.create({
        ...query,
        data: {
          voyageId: args.voyageId,
          type: args.type,
          severity: args.severity ?? 'warning',
          description: args.description,
          delayHours: args.delayHours ?? undefined,
          rootCause: args.rootCause ?? undefined,
          eta: args.eta ?? undefined,
          portCallId: args.portCallId ?? undefined,
          notes: args.notes ?? undefined,
        },
      }),
  }),
);

builder.mutationField('resolveDelayAlert', (t) =>
  t.prismaField({
    type: 'DelayAlert',
    args: {
      id: t.arg.string({ required: true }),
      resolvedBy: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const data: Record<string, unknown> = { resolvedAt: new Date() };
      if (args.resolvedBy) data.resolvedBy = args.resolvedBy;
      if (args.notes) data.notes = args.notes;
      return ctx.prisma.delayAlert.update({
        ...query,
        where: { id: args.id },
        data,
      });
    },
  }),
);

builder.mutationField('updateDelayAlert', (t) =>
  t.prismaField({
    type: 'DelayAlert',
    args: {
      id: t.arg.string({ required: true }),
      severity: t.arg.string(),
      description: t.arg.string(),
      delayHours: t.arg.float(),
      eta: t.arg({ type: 'DateTime' }),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const data: Record<string, unknown> = {};
      if (args.severity) data.severity = args.severity;
      if (args.description) data.description = args.description;
      if (args.delayHours != null) data.delayHours = args.delayHours;
      if (args.eta) data.eta = args.eta;
      if (args.notes) data.notes = args.notes;
      return ctx.prisma.delayAlert.update({
        ...query,
        where: { id: args.id },
        data,
      });
    },
  }),
);
