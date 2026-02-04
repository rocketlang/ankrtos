import { builder } from '../builder.js';

// ─── PrismaObjects ───────────────────────────────────────────────────────────

builder.prismaObject('VaRSnapshot', {
  fields: (t) => ({
    id: t.exposeID('id'),
    snapshotDate: t.expose('snapshotDate', { type: 'DateTime' }),
    portfolioValue: t.exposeFloat('portfolioValue'),
    varOneDay95: t.exposeFloat('varOneDay95'),
    varOneDay99: t.exposeFloat('varOneDay99'),
    varTenDay95: t.exposeFloat('varTenDay95'),
    varTenDay99: t.exposeFloat('varTenDay99'),
    cvar95: t.exposeFloat('cvar95', { nullable: true }),
    maxDrawdown: t.exposeFloat('maxDrawdown', { nullable: true }),
    sharpeRatio: t.exposeFloat('sharpeRatio', { nullable: true }),
    positionCount: t.exposeInt('positionCount'),
    totalExposure: t.exposeFloat('totalExposure'),
    methodology: t.exposeString('methodology'),
    confidenceLevel: t.exposeFloat('confidenceLevel'),
    lookbackDays: t.exposeInt('lookbackDays'),
    notes: t.exposeString('notes', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

builder.prismaObject('BacktestResult', {
  fields: (t) => ({
    id: t.exposeID('id'),
    strategyName: t.exposeString('strategyName'),
    description: t.exposeString('description', { nullable: true }),
    route: t.exposeString('route'),
    periodStart: t.expose('periodStart', { type: 'DateTime' }),
    periodEnd: t.expose('periodEnd', { type: 'DateTime' }),
    entryRule: t.exposeString('entryRule'),
    exitRule: t.exposeString('exitRule'),
    trades: t.exposeInt('trades'),
    winRate: t.exposeFloat('winRate', { nullable: true }),
    avgReturn: t.exposeFloat('avgReturn', { nullable: true }),
    totalReturn: t.exposeFloat('totalReturn', { nullable: true }),
    maxDrawdown: t.exposeFloat('maxDrawdown', { nullable: true }),
    sharpeRatio: t.exposeFloat('sharpeRatio', { nullable: true }),
    sortinoRatio: t.exposeFloat('sortinoRatio', { nullable: true }),
    profitFactor: t.exposeFloat('profitFactor', { nullable: true }),
    avgHoldingDays: t.exposeFloat('avgHoldingDays', { nullable: true }),
    parameters: t.expose('parameters', { type: 'JSON', nullable: true }),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

// ─── Queries ─────────────────────────────────────────────────────────────────

builder.queryField('varSnapshots', (t) =>
  t.prismaField({
    type: ['VaRSnapshot'],
    args: {
      limit: t.arg.int(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.vaRSnapshot.findMany({
        ...query,
        where: ctx.orgFilter(),
        orderBy: { snapshotDate: 'desc' },
        take: args.limit ?? 30,
      }),
  }),
);

builder.queryField('latestVaR', (t) =>
  t.prismaField({
    type: 'VaRSnapshot',
    nullable: true,
    resolve: (query, _root, _args, ctx) =>
      ctx.prisma.vaRSnapshot.findFirst({
        ...query,
        where: ctx.orgFilter(),
        orderBy: { snapshotDate: 'desc' },
      }),
  }),
);

builder.queryField('backtestResults', (t) =>
  t.prismaField({
    type: ['BacktestResult'],
    args: {
      route: t.arg.string(),
      strategyName: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };
      if (args.route) where.route = args.route;
      if (args.strategyName) where.strategyName = args.strategyName;
      return ctx.prisma.backtestResult.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  }),
);

// ─── Mutations ───────────────────────────────────────────────────────────────

builder.mutationField('createVaRSnapshot', (t) =>
  t.prismaField({
    type: 'VaRSnapshot',
    args: {
      portfolioValue: t.arg.float({ required: true }),
      varOneDay95: t.arg.float({ required: true }),
      varOneDay99: t.arg.float({ required: true }),
      varTenDay95: t.arg.float({ required: true }),
      varTenDay99: t.arg.float({ required: true }),
      cvar95: t.arg.float(),
      maxDrawdown: t.arg.float(),
      sharpeRatio: t.arg.float(),
      positionCount: t.arg.int(),
      totalExposure: t.arg.float(),
      methodology: t.arg.string(),
      lookbackDays: t.arg.int(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.vaRSnapshot.create({
        ...query,
        data: {
          portfolioValue: args.portfolioValue,
          varOneDay95: args.varOneDay95,
          varOneDay99: args.varOneDay99,
          varTenDay95: args.varTenDay95,
          varTenDay99: args.varTenDay99,
          cvar95: args.cvar95 ?? undefined,
          maxDrawdown: args.maxDrawdown ?? undefined,
          sharpeRatio: args.sharpeRatio ?? undefined,
          positionCount: args.positionCount ?? 0,
          totalExposure: args.totalExposure ?? 0,
          methodology: args.methodology ?? 'historical',
          lookbackDays: args.lookbackDays ?? 252,
          notes: args.notes ?? undefined,
          organizationId: ctx.orgId(),
        },
      }),
  }),
);

builder.mutationField('createBacktestResult', (t) =>
  t.prismaField({
    type: 'BacktestResult',
    args: {
      strategyName: t.arg.string({ required: true }),
      route: t.arg.string({ required: true }),
      periodStart: t.arg({ type: 'DateTime', required: true }),
      periodEnd: t.arg({ type: 'DateTime', required: true }),
      entryRule: t.arg.string({ required: true }),
      exitRule: t.arg.string({ required: true }),
      description: t.arg.string(),
      trades: t.arg.int(),
      winRate: t.arg.float(),
      avgReturn: t.arg.float(),
      totalReturn: t.arg.float(),
      maxDrawdown: t.arg.float(),
      sharpeRatio: t.arg.float(),
      sortinoRatio: t.arg.float(),
      profitFactor: t.arg.float(),
      avgHoldingDays: t.arg.float(),
      parameters: t.arg({ type: 'JSON' }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.backtestResult.create({
        ...query,
        data: {
          strategyName: args.strategyName,
          route: args.route,
          periodStart: args.periodStart,
          periodEnd: args.periodEnd,
          entryRule: args.entryRule,
          exitRule: args.exitRule,
          description: args.description ?? undefined,
          trades: args.trades ?? 0,
          winRate: args.winRate ?? undefined,
          avgReturn: args.avgReturn ?? undefined,
          totalReturn: args.totalReturn ?? undefined,
          maxDrawdown: args.maxDrawdown ?? undefined,
          sharpeRatio: args.sharpeRatio ?? undefined,
          sortinoRatio: args.sortinoRatio ?? undefined,
          profitFactor: args.profitFactor ?? undefined,
          avgHoldingDays: args.avgHoldingDays ?? undefined,
          parameters: args.parameters ?? undefined,
          organizationId: ctx.orgId(),
        },
      }),
  }),
);
