import { builder } from '../builder.js';

// ────────────────────────────────────────────────────────────
//  Carbon Credit — Prisma Object
// ────────────────────────────────────────────────────────────

builder.prismaObject('CarbonCredit', {
  fields: (t) => ({
    id: t.exposeID('id'),
    projectName: t.exposeString('projectName'),
    registry: t.exposeString('registry'),
    creditType: t.exposeString('creditType'),
    vintage: t.exposeInt('vintage'),
    quantity: t.exposeFloat('quantity'),
    pricePerTonne: t.exposeFloat('pricePerTonne'),
    totalCost: t.exposeFloat('totalCost'),
    currency: t.exposeString('currency'),
    status: t.exposeString('status'),
    retiredDate: t.expose('retiredDate', { type: 'DateTime', nullable: true }),
    retiredForVessel: t.exposeString('retiredForVessel', { nullable: true }),
    retiredForVoyage: t.exposeString('retiredForVoyage', { nullable: true }),
    serialNumbers: t.exposeString('serialNumbers', { nullable: true }),
    verificationStandard: t.exposeString('verificationStandard', { nullable: true }),
    projectCountry: t.exposeString('projectCountry', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// ────────────────────────────────────────────────────────────
//  Custom types for summary
// ────────────────────────────────────────────────────────────

const RegistryBreakdown = builder.objectRef<{
  registry: string;
  count: number;
  tonnes: number;
}>('CarbonCreditRegistryBreakdown');

RegistryBreakdown.implement({
  fields: (t) => ({
    registry: t.exposeString('registry'),
    count: t.exposeInt('count'),
    tonnes: t.exposeFloat('tonnes'),
  }),
});

const CarbonCreditSummary = builder.objectRef<{
  totalCredits: number;
  activeCredits: number;
  retiredCredits: number;
  totalCost: number;
  avgPricePerTonne: number;
  byRegistry: { registry: string; count: number; tonnes: number }[];
}>('CarbonCreditSummary');

CarbonCreditSummary.implement({
  fields: (t) => ({
    totalCredits: t.exposeInt('totalCredits'),
    activeCredits: t.exposeInt('activeCredits'),
    retiredCredits: t.exposeInt('retiredCredits'),
    totalCost: t.exposeFloat('totalCost'),
    avgPricePerTonne: t.exposeFloat('avgPricePerTonne'),
    byRegistry: t.field({
      type: [RegistryBreakdown],
      resolve: (parent) => parent.byRegistry,
    }),
  }),
});

// ────────────────────────────────────────────────────────────
//  Queries
// ────────────────────────────────────────────────────────────

builder.queryField('carbonCredits', (t) =>
  t.prismaField({
    type: ['CarbonCredit'],
    args: {
      status: t.arg.string(),
      registry: t.arg.string(),
      vintage: t.arg.int(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };
      if (args.status) where.status = args.status;
      if (args.registry) where.registry = args.registry;
      if (args.vintage != null) where.vintage = args.vintage;
      return ctx.prisma.carbonCredit.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  }),
);

builder.queryField('carbonCreditSummary', (t) =>
  t.field({
    type: CarbonCreditSummary,
    resolve: async (_root, _args, ctx) => {
      const credits = await ctx.prisma.carbonCredit.findMany({
        where: ctx.orgFilter(),
      });

      let activeCredits = 0;
      let retiredCredits = 0;
      let totalCost = 0;
      let totalTonnes = 0;
      const registryMap = new Map<string, { count: number; tonnes: number }>();

      for (const c of credits) {
        totalCost += c.totalCost;
        totalTonnes += c.quantity;

        if (c.status === 'active') {
          activeCredits += 1;
        } else if (c.status === 'retired') {
          retiredCredits += 1;
        }

        const existing = registryMap.get(c.registry);
        if (existing) {
          existing.count += 1;
          existing.tonnes += c.quantity;
        } else {
          registryMap.set(c.registry, { count: 1, tonnes: c.quantity });
        }
      }

      const byRegistry = Array.from(registryMap.entries())
        .map(([registry, data]) => ({ registry, count: data.count, tonnes: data.tonnes }))
        .sort((a, b) => b.tonnes - a.tonnes);

      return {
        totalCredits: credits.length,
        activeCredits,
        retiredCredits,
        totalCost,
        avgPricePerTonne: totalTonnes > 0 ? totalCost / totalTonnes : 0,
        byRegistry,
      };
    },
  }),
);

// ────────────────────────────────────────────────────────────
//  Mutations
// ────────────────────────────────────────────────────────────

builder.mutationField('purchaseCarbonCredit', (t) =>
  t.prismaField({
    type: 'CarbonCredit',
    args: {
      projectName: t.arg.string({ required: true }),
      registry: t.arg.string({ required: true }),
      creditType: t.arg.string({ required: true }),
      vintage: t.arg.int({ required: true }),
      quantity: t.arg.float({ required: true }),
      pricePerTonne: t.arg.float({ required: true }),
      currency: t.arg.string(),
      serialNumbers: t.arg.string(),
      verificationStandard: t.arg.string(),
      projectCountry: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      const totalCost = args.quantity * args.pricePerTonne;

      return ctx.prisma.carbonCredit.create({
        ...query,
        data: {
          projectName: args.projectName,
          registry: args.registry,
          creditType: args.creditType,
          vintage: args.vintage,
          quantity: args.quantity,
          pricePerTonne: args.pricePerTonne,
          totalCost,
          currency: args.currency ?? 'USD',
          status: 'active',
          serialNumbers: args.serialNumbers ?? undefined,
          verificationStandard: args.verificationStandard ?? undefined,
          projectCountry: args.projectCountry ?? undefined,
          notes: args.notes ?? undefined,
          organizationId: orgId,
        },
      });
    },
  }),
);

builder.mutationField('retireCarbonCredit', (t) =>
  t.prismaField({
    type: 'CarbonCredit',
    args: {
      id: t.arg.string({ required: true }),
      retiredForVessel: t.arg.string(),
      retiredForVoyage: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const existing = await ctx.prisma.carbonCredit.findUnique({
        where: { id: args.id },
      });
      if (!existing) throw new Error('Carbon credit not found');
      if (existing.status === 'retired') {
        throw new Error('Carbon credit is already retired');
      }
      if (existing.status !== 'active') {
        throw new Error(`Cannot retire credit with status "${existing.status}". Must be "active".`);
      }

      return ctx.prisma.carbonCredit.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'retired',
          retiredDate: new Date(),
          retiredForVessel: args.retiredForVessel ?? undefined,
          retiredForVoyage: args.retiredForVoyage ?? undefined,
        },
      });
    },
  }),
);
