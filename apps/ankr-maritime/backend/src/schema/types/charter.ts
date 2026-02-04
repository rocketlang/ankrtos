import { builder } from '../builder.js';

builder.prismaObject('Charter', {
  fields: (t) => ({
    id: t.exposeID('id'),
    reference: t.exposeString('reference'),
    type: t.exposeString('type'),
    status: t.exposeString('status'),
    vesselId: t.exposeString('vesselId', { nullable: true }),
    chartererId: t.exposeString('chartererId', { nullable: true }),
    brokerId: t.exposeString('brokerId', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    laycanStart: t.expose('laycanStart', { type: 'DateTime', nullable: true }),
    laycanEnd: t.expose('laycanEnd', { type: 'DateTime', nullable: true }),
    fixtureDate: t.expose('fixtureDate', { type: 'DateTime', nullable: true }),
    freightRate: t.exposeFloat('freightRate', { nullable: true }),
    freightUnit: t.exposeString('freightUnit', { nullable: true }),
    currency: t.exposeString('currency'),
    notes: t.exposeString('notes', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.queryField('charters', (t) =>
  t.prismaField({
    type: ['Charter'],
    resolve: (query, _root, _args, ctx) =>
      ctx.prisma.charter.findMany({ ...query, where: ctx.orgFilter(), orderBy: { createdAt: 'desc' } }),
  }),
);

builder.queryField('charter', (t) =>
  t.prismaField({
    type: 'Charter',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.charter.findUnique({ ...query, where: { id: args.id } }),
  }),
);

// Create charter mutation
builder.mutationField('createCharter', (t) =>
  t.prismaField({
    type: 'Charter',
    args: {
      reference: t.arg.string({ required: true }),
      type: t.arg.string({ required: true }),
      vesselId: t.arg.string(),
      chartererId: t.arg.string(),
      brokerId: t.arg.string(),
      freightRate: t.arg.float(),
      freightUnit: t.arg.string(),
      currency: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.user?.organizationId;
      if (!orgId) throw new Error('Not authenticated');
      return ctx.prisma.charter.create({
        ...query,
        data: {
          reference: args.reference,
          type: args.type,
          vesselId: args.vesselId ?? undefined,
          chartererId: args.chartererId ?? undefined,
          brokerId: args.brokerId ?? undefined,
          freightRate: args.freightRate ?? undefined,
          freightUnit: args.freightUnit ?? undefined,
          currency: args.currency ?? 'USD',
          notes: args.notes ?? undefined,
          organizationId: orgId,
        },
      });
    },
  }),
);

// Charter status state machine
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['on_subs'],
  on_subs: ['fixed', 'cancelled'],
  fixed: ['executed', 'cancelled'],
  executed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

builder.mutationField('transitionCharterStatus', (t) =>
  t.prismaField({
    type: 'Charter',
    args: {
      id: t.arg.string({ required: true }),
      status: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const charter = await ctx.prisma.charter.findUnique({ where: { id: args.id } });
      if (!charter) throw new Error('Charter not found');

      const allowed = VALID_TRANSITIONS[charter.status] ?? [];
      if (!allowed.includes(args.status)) {
        throw new Error(
          `Cannot transition from "${charter.status}" to "${args.status}". Allowed: ${allowed.join(', ') || 'none'}`,
        );
      }

      const data: Record<string, unknown> = { status: args.status };
      if (args.status === 'fixed') {
        data.fixtureDate = new Date();
      }

      return ctx.prisma.charter.update({
        ...query,
        where: { id: args.id },
        data,
      });
    },
  }),
);

