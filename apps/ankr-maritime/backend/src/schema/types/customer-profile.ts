import { builder } from '../builder.js';

// ─── PrismaObject ────────────────────────────────────────────────────────────

builder.prismaObject('CustomerProfile', {
  fields: (t) => ({
    id: t.exposeID('id'),
    companyId: t.exposeString('companyId'),
    companyName: t.exposeString('companyName'),
    customerSince: t.expose('customerSince', { type: 'DateTime', nullable: true }),
    totalFixtures: t.exposeInt('totalFixtures'),
    totalRevenue: t.exposeFloat('totalRevenue'),
    avgFixtureValue: t.exposeFloat('avgFixtureValue'),
    preferredRoutes: t.exposeStringList('preferredRoutes'),
    preferredVessels: t.exposeStringList('preferredVessels'),
    preferredCargoes: t.exposeStringList('preferredCargoes'),
    avgPaymentDays: t.exposeFloat('avgPaymentDays', { nullable: true }),
    outstandingAmount: t.exposeFloat('outstandingAmount'),
    creditRating: t.exposeString('creditRating', { nullable: true }),
    relationshipScore: t.exposeFloat('relationshipScore', { nullable: true }),
    lastFixtureDate: t.expose('lastFixtureDate', { type: 'DateTime', nullable: true }),
    lastContactDate: t.expose('lastContactDate', { type: 'DateTime', nullable: true }),
    riskFlags: t.exposeStringList('riskFlags'),
    tags: t.exposeStringList('tags'),
    notes: t.exposeString('notes', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// ─── Queries ─────────────────────────────────────────────────────────────────

builder.queryField('customerProfiles', (t) =>
  t.prismaField({
    type: ['CustomerProfile'],
    args: {
      creditRating: t.arg.string(),
      minRevenue: t.arg.float(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };

      if (args.creditRating) where.creditRating = args.creditRating;
      if (args.minRevenue != null) where.totalRevenue = { gte: args.minRevenue };

      return ctx.prisma.customerProfile.findMany({
        ...query,
        where,
        orderBy: { totalRevenue: 'desc' },
      });
    },
  }),
);

builder.queryField('customerProfile', (t) =>
  t.prismaField({
    type: 'CustomerProfile',
    nullable: true,
    args: { companyId: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.customerProfile.findUnique({
        ...query,
        where: { companyId: args.companyId },
      }),
  }),
);

// ─── Mutations ───────────────────────────────────────────────────────────────

builder.mutationField('createOrUpdateCustomerProfile', (t) =>
  t.prismaField({
    type: 'CustomerProfile',
    args: {
      companyId: t.arg.string({ required: true }),
      companyName: t.arg.string({ required: true }),
      customerSince: t.arg({ type: 'DateTime' }),
      preferredRoutes: t.arg.stringList(),
      preferredVessels: t.arg.stringList(),
      preferredCargoes: t.arg.stringList(),
      creditRating: t.arg.string(),
      relationshipScore: t.arg.float(),
      riskFlags: t.arg.stringList(),
      tags: t.arg.stringList(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      const data = {
        companyName: args.companyName,
        customerSince: args.customerSince ?? undefined,
        preferredRoutes: args.preferredRoutes ?? undefined,
        preferredVessels: args.preferredVessels ?? undefined,
        preferredCargoes: args.preferredCargoes ?? undefined,
        creditRating: args.creditRating ?? undefined,
        relationshipScore: args.relationshipScore ?? undefined,
        riskFlags: args.riskFlags ?? undefined,
        tags: args.tags ?? undefined,
        notes: args.notes ?? undefined,
      };

      return ctx.prisma.customerProfile.upsert({
        ...query,
        where: {
          companyId_organizationId: {
            companyId: args.companyId,
            organizationId: orgId,
          },
        },
        create: {
          companyId: args.companyId,
          organizationId: orgId,
          ...data,
        },
        update: data,
      });
    },
  }),
);

builder.mutationField('refreshCustomerProfile', (t) =>
  t.prismaField({
    type: 'CustomerProfile',
    args: { companyId: t.arg.string({ required: true }) },
    resolve: async (query, _root, args, ctx) => {
      const orgId = ctx.orgId();

      // Fetch all data in parallel
      const [charters, payments, lastLog] = await Promise.all([
        ctx.prisma.charter.findMany({
          where: {
            organizationId: orgId,
            chartererId: args.companyId,
          },
          select: { freightRate: true, fixtureDate: true },
          orderBy: { fixtureDate: 'desc' },
        }),
        ctx.prisma.tradePayment.findMany({
          where: {
            organizationId: orgId,
            status: 'paid',
            paidDate: { not: null },
          },
          select: { paidDate: true, createdAt: true },
        }),
        ctx.prisma.communicationLog.findFirst({
          where: {
            organizationId: orgId,
            companyId: args.companyId,
          },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
      ]);

      // Calculate metrics
      const totalFixtures = charters.length;
      let totalRevenue = 0;
      for (const c of charters) {
        totalRevenue += c.freightRate ?? 0;
      }
      const avgFixtureValue = totalFixtures > 0 ? totalRevenue / totalFixtures : 0;

      // Average payment days
      let totalPaymentDays = 0;
      let paidCount = 0;
      for (const p of payments) {
        if (p.paidDate) {
          const days = Math.ceil(
            (p.paidDate.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24),
          );
          totalPaymentDays += days;
          paidCount++;
        }
      }
      const avgPaymentDays = paidCount > 0 ? totalPaymentDays / paidCount : null;

      // Last fixture date
      const lastFixtureDate = charters.length > 0 ? charters[0].fixtureDate : null;

      // Last contact date
      const lastContactDate = lastLog?.createdAt ?? null;

      return ctx.prisma.customerProfile.upsert({
        ...query,
        where: {
          companyId_organizationId: {
            companyId: args.companyId,
            organizationId: orgId,
          },
        },
        create: {
          companyId: args.companyId,
          companyName: args.companyId, // Will be updated on next full upsert
          organizationId: orgId,
          totalFixtures,
          totalRevenue,
          avgFixtureValue,
          avgPaymentDays,
          lastFixtureDate,
          lastContactDate,
        },
        update: {
          totalFixtures,
          totalRevenue,
          avgFixtureValue,
          avgPaymentDays,
          lastFixtureDate,
          lastContactDate,
        },
      });
    },
  }),
);

builder.mutationField('updateCreditRating', (t) =>
  t.prismaField({
    type: 'CustomerProfile',
    args: {
      companyId: t.arg.string({ required: true }),
      creditRating: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.customerProfile.update({
        ...query,
        where: { companyId: args.companyId },
        data: { creditRating: args.creditRating },
      }),
  }),
);
