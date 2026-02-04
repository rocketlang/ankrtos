import { builder } from '../builder.js';

// === PrismaObject: CounterpartyRiskScore ===
builder.prismaObject('CounterpartyRiskScore', {
  fields: (t) => ({
    id: t.exposeID('id'),
    companyId: t.exposeString('companyId'),
    companyName: t.exposeString('companyName'),
    overallScore: t.exposeFloat('overallScore'),
    riskCategory: t.exposeString('riskCategory'),
    financialScore: t.exposeFloat('financialScore', { nullable: true }),
    complianceScore: t.exposeFloat('complianceScore', { nullable: true }),
    operationalScore: t.exposeFloat('operationalScore', { nullable: true }),
    reputationScore: t.exposeFloat('reputationScore', { nullable: true }),
    sanctionRisk: t.exposeBoolean('sanctionRisk'),
    pepExposure: t.exposeBoolean('pepExposure'),
    adverseMedia: t.exposeBoolean('adverseMedia'),
    countryRisk: t.exposeString('countryRisk', { nullable: true }),
    lastScreeningDate: t.expose('lastScreeningDate', { type: 'DateTime', nullable: true }),
    lastScreeningId: t.exposeString('lastScreeningId', { nullable: true }),
    creditLimit: t.exposeFloat('creditLimit', { nullable: true }),
    paymentHistory: t.exposeString('paymentHistory', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    validUntil: t.expose('validUntil', { type: 'DateTime', nullable: true }),
    organizationId: t.exposeString('organizationId'),
    organization: t.relation('organization'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// === Custom Objects ===

const RiskDistribution = builder.objectRef<{
  category: string;
  count: number;
  avgScore: number;
}>('RiskDistribution');

RiskDistribution.implement({
  fields: (t) => ({
    category: t.exposeString('category'),
    count: t.exposeInt('count'),
    avgScore: t.exposeFloat('avgScore'),
  }),
});

const ComplianceOverview = builder.objectRef<{
  totalScreenings: number;
  pendingScreenings: number;
  matchCount: number;
  escalatedCount: number;
  clearRate: number;
  riskDistribution: { category: string; count: number; avgScore: number }[];
  uboVerifiedRate: number;
}>('ComplianceOverview');

ComplianceOverview.implement({
  fields: (t) => ({
    totalScreenings: t.exposeInt('totalScreenings'),
    pendingScreenings: t.exposeInt('pendingScreenings'),
    matchCount: t.exposeInt('matchCount'),
    escalatedCount: t.exposeInt('escalatedCount'),
    clearRate: t.exposeFloat('clearRate'),
    riskDistribution: t.field({
      type: [RiskDistribution],
      resolve: (parent) => parent.riskDistribution,
    }),
    uboVerifiedRate: t.exposeFloat('uboVerifiedRate'),
  }),
});

// === Helper: calculate weighted overall score and risk category ===

function calculateRiskScore(scores: {
  financialScore?: number | null;
  complianceScore?: number | null;
  operationalScore?: number | null;
  reputationScore?: number | null;
}): { overallScore: number; riskCategory: string } {
  const financial = scores.financialScore ?? 50;
  const compliance = scores.complianceScore ?? 50;
  const operational = scores.operationalScore ?? 50;
  const reputation = scores.reputationScore ?? 50;

  // Weighted average: financial 25%, compliance 30%, operational 20%, reputation 25%
  const overallScore =
    financial * 0.25 + compliance * 0.3 + operational * 0.2 + reputation * 0.25;

  let riskCategory: string;
  if (overallScore < 25) riskCategory = 'critical';
  else if (overallScore < 45) riskCategory = 'high';
  else if (overallScore < 65) riskCategory = 'medium';
  else riskCategory = 'low';

  return { overallScore: Math.round(overallScore * 100) / 100, riskCategory };
}

// === Queries ===

builder.queryField('counterpartyRisks', (t) =>
  t.prismaField({
    type: ['CounterpartyRiskScore'],
    args: {
      riskCategory: t.arg.string(),
      companyId: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.counterpartyRiskScore.findMany({
        ...query,
        where: {
          ...ctx.orgFilter(),
          ...(args.riskCategory ? { riskCategory: args.riskCategory } : {}),
          ...(args.companyId ? { companyId: args.companyId } : {}),
        },
        orderBy: { overallScore: 'desc' },
      }),
  }),
);

builder.queryField('counterpartyRisk', (t) =>
  t.prismaField({
    type: 'CounterpartyRiskScore',
    nullable: true,
    args: { companyId: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.counterpartyRiskScore.findUnique({
        ...query,
        where: {
          companyId_organizationId: {
            companyId: args.companyId,
            organizationId: ctx.orgId(),
          },
        },
      }),
  }),
);

builder.queryField('complianceOverview', (t) =>
  t.field({
    type: ComplianceOverview,
    resolve: async (_root, _args, ctx) => {
      const orgWhere = ctx.orgFilter();

      // Screening counts
      const [totalScreenings, pendingScreenings, matchCount, escalatedCount, clearCount] =
        await Promise.all([
          ctx.prisma.sanctionScreening.count({ where: orgWhere }),
          ctx.prisma.sanctionScreening.count({ where: { ...orgWhere, status: 'pending' } }),
          ctx.prisma.sanctionScreening.count({
            where: { ...orgWhere, status: { in: ['match', 'possible_match'] } },
          }),
          ctx.prisma.sanctionScreening.count({ where: { ...orgWhere, status: 'escalated' } }),
          ctx.prisma.sanctionScreening.count({ where: { ...orgWhere, status: 'clear' } }),
        ]);

      const clearRate = totalScreenings > 0 ? (clearCount / totalScreenings) * 100 : 0;

      // Risk distribution: group counterparty risk scores by category
      const riskScores = await ctx.prisma.counterpartyRiskScore.findMany({
        where: orgWhere,
        select: { riskCategory: true, overallScore: true },
      });

      const categoryMap = new Map<string, { count: number; totalScore: number }>();
      for (const rs of riskScores) {
        const entry = categoryMap.get(rs.riskCategory) ?? { count: 0, totalScore: 0 };
        entry.count += 1;
        entry.totalScore += rs.overallScore;
        categoryMap.set(rs.riskCategory, entry);
      }

      const riskDistribution = Array.from(categoryMap.entries()).map(
        ([category, { count, totalScore }]) => ({
          category,
          count,
          avgScore: Math.round((totalScore / count) * 100) / 100,
        }),
      );

      // UBO verified rate
      const [totalUbos, verifiedUbos] = await Promise.all([
        ctx.prisma.ultimateBeneficialOwner.count({ where: orgWhere }),
        ctx.prisma.ultimateBeneficialOwner.count({
          where: { ...orgWhere, verificationStatus: 'verified' },
        }),
      ]);

      const uboVerifiedRate = totalUbos > 0 ? (verifiedUbos / totalUbos) * 100 : 0;

      return {
        totalScreenings,
        pendingScreenings,
        matchCount,
        escalatedCount,
        clearRate: Math.round(clearRate * 100) / 100,
        riskDistribution,
        uboVerifiedRate: Math.round(uboVerifiedRate * 100) / 100,
      };
    },
  }),
);

// === Mutations ===

builder.mutationField('createCounterpartyRisk', (t) =>
  t.prismaField({
    type: 'CounterpartyRiskScore',
    args: {
      companyId: t.arg.string({ required: true }),
      companyName: t.arg.string({ required: true }),
      financialScore: t.arg.float(),
      complianceScore: t.arg.float(),
      operationalScore: t.arg.float(),
      reputationScore: t.arg.float(),
      sanctionRisk: t.arg.boolean(),
      pepExposure: t.arg.boolean(),
      countryRisk: t.arg.string(),
      creditLimit: t.arg.float(),
      paymentHistory: t.arg.string(),
      notes: t.arg.string(),
      validUntil: t.arg({ type: 'DateTime' }),
    },
    resolve: (query, _root, args, ctx) => {
      const { overallScore, riskCategory } = calculateRiskScore({
        financialScore: args.financialScore,
        complianceScore: args.complianceScore,
        operationalScore: args.operationalScore,
        reputationScore: args.reputationScore,
      });

      return ctx.prisma.counterpartyRiskScore.create({
        ...query,
        data: {
          companyId: args.companyId,
          companyName: args.companyName,
          overallScore,
          riskCategory,
          financialScore: args.financialScore ?? undefined,
          complianceScore: args.complianceScore ?? undefined,
          operationalScore: args.operationalScore ?? undefined,
          reputationScore: args.reputationScore ?? undefined,
          sanctionRisk: args.sanctionRisk ?? false,
          pepExposure: args.pepExposure ?? false,
          countryRisk: args.countryRisk ?? undefined,
          creditLimit: args.creditLimit ?? undefined,
          paymentHistory: args.paymentHistory ?? undefined,
          notes: args.notes ?? undefined,
          validUntil: args.validUntil ?? undefined,
          organizationId: ctx.orgId(),
        },
      });
    },
  }),
);

builder.mutationField('updateCounterpartyRisk', (t) =>
  t.prismaField({
    type: 'CounterpartyRiskScore',
    args: {
      id: t.arg.string({ required: true }),
      financialScore: t.arg.float(),
      complianceScore: t.arg.float(),
      operationalScore: t.arg.float(),
      reputationScore: t.arg.float(),
      sanctionRisk: t.arg.boolean(),
      pepExposure: t.arg.boolean(),
      countryRisk: t.arg.string(),
      creditLimit: t.arg.float(),
      paymentHistory: t.arg.string(),
      notes: t.arg.string(),
      validUntil: t.arg({ type: 'DateTime' }),
    },
    resolve: async (query, _root, args, ctx) => {
      // Fetch current record to merge scores for recalculation
      const existing = await ctx.prisma.counterpartyRiskScore.findUniqueOrThrow({
        where: { id: args.id },
      });

      const financialScore = args.financialScore ?? existing.financialScore;
      const complianceScore = args.complianceScore ?? existing.complianceScore;
      const operationalScore = args.operationalScore ?? existing.operationalScore;
      const reputationScore = args.reputationScore ?? existing.reputationScore;

      const { overallScore, riskCategory } = calculateRiskScore({
        financialScore,
        complianceScore,
        operationalScore,
        reputationScore,
      });

      return ctx.prisma.counterpartyRiskScore.update({
        ...query,
        where: { id: args.id },
        data: {
          overallScore,
          riskCategory,
          financialScore: financialScore ?? undefined,
          complianceScore: complianceScore ?? undefined,
          operationalScore: operationalScore ?? undefined,
          reputationScore: reputationScore ?? undefined,
          ...(args.sanctionRisk !== null && args.sanctionRisk !== undefined
            ? { sanctionRisk: args.sanctionRisk }
            : {}),
          ...(args.pepExposure !== null && args.pepExposure !== undefined
            ? { pepExposure: args.pepExposure }
            : {}),
          countryRisk: args.countryRisk ?? undefined,
          creditLimit: args.creditLimit ?? undefined,
          paymentHistory: args.paymentHistory ?? undefined,
          notes: args.notes ?? undefined,
          validUntil: args.validUntil ?? undefined,
        },
      });
    },
  }),
);
