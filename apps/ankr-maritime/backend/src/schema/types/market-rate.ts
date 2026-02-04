import { builder } from '../builder.js'

builder.prismaObject('MarketRate', {
  fields: (t) => ({
    id: t.exposeID('id'),
    route: t.exposeString('route'),
    vesselType: t.exposeString('vesselType'),
    rateType: t.exposeString('rateType'),
    rate: t.exposeFloat('rate'),
    rateUnit: t.exposeString('rateUnit'),
    dwtMin: t.exposeInt('dwtMin', { nullable: true }),
    dwtMax: t.exposeInt('dwtMax', { nullable: true }),
    duration: t.exposeString('duration', { nullable: true }),
    effectiveDate: t.expose('effectiveDate', { type: 'DateTime' }),
    expiryDate: t.expose('expiryDate', { type: 'DateTime', nullable: true }),
    source: t.exposeString('source'),
    region: t.exposeString('region', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
})

// === Custom summary type ===

const MarketRateSummary = builder.objectRef<{
  vesselType: string
  spotAvg: number
  tcAvg: number
  routeCount: number
  lastUpdated: Date | null
}>('MarketRateSummary')

MarketRateSummary.implement({
  fields: (t) => ({
    vesselType: t.exposeString('vesselType'),
    spotAvg: t.exposeFloat('spotAvg'),
    tcAvg: t.exposeFloat('tcAvg'),
    routeCount: t.exposeInt('routeCount'),
    lastUpdated: t.expose('lastUpdated', { type: 'DateTime', nullable: true }),
  }),
})

// === Queries ===

builder.queryField('marketRates', (t) =>
  t.prismaField({
    type: ['MarketRate'],
    args: {
      vesselType: t.arg.string(),
      rateType: t.arg.string(),
      route: t.arg.string(),
      region: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = {}
      if (args.vesselType) where.vesselType = args.vesselType
      if (args.rateType) where.rateType = args.rateType
      if (args.route) where.route = { contains: args.route, mode: 'insensitive' }
      if (args.region) where.region = args.region
      return ctx.prisma.marketRate.findMany({
        ...query,
        where,
        orderBy: { effectiveDate: 'desc' },
      })
    },
  }),
)

builder.queryField('marketRate', (t) =>
  t.prismaField({
    type: 'MarketRate',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.marketRate.findUnique({ ...query, where: { id: args.id } }),
  }),
)

builder.queryField('marketRateSummary', (t) =>
  t.field({
    type: MarketRateSummary,
    args: { vesselType: t.arg.string({ required: true }) },
    resolve: async (_root, args, ctx) => {
      const rates = await ctx.prisma.marketRate.findMany({
        where: { vesselType: args.vesselType },
      })

      const spotRates = rates.filter((r) => r.rateType === 'spot')
      const tcRates = rates.filter((r) => r.rateType === 'time_charter')
      const routes = new Set(rates.map((r) => r.route))

      const spotAvg = spotRates.length > 0
        ? spotRates.reduce((sum, r) => sum + r.rate, 0) / spotRates.length
        : 0
      const tcAvg = tcRates.length > 0
        ? tcRates.reduce((sum, r) => sum + r.rate, 0) / tcRates.length
        : 0

      let lastUpdated: Date | null = null
      for (const r of rates) {
        if (!lastUpdated || r.effectiveDate > lastUpdated) {
          lastUpdated = r.effectiveDate
        }
      }

      return {
        vesselType: args.vesselType,
        spotAvg: Math.round(spotAvg * 100) / 100,
        tcAvg: Math.round(tcAvg * 100) / 100,
        routeCount: routes.size,
        lastUpdated,
      }
    },
  }),
)

// === Mutations ===

builder.mutationField('createMarketRate', (t) =>
  t.prismaField({
    type: 'MarketRate',
    args: {
      route: t.arg.string({ required: true }),
      vesselType: t.arg.string({ required: true }),
      rateType: t.arg.string({ required: true }),
      rate: t.arg.float({ required: true }),
      rateUnit: t.arg.string(),
      dwtMin: t.arg.int(),
      dwtMax: t.arg.int(),
      duration: t.arg.string(),
      effectiveDate: t.arg({ type: 'DateTime', required: true }),
      expiryDate: t.arg({ type: 'DateTime' }),
      source: t.arg.string(),
      region: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.marketRate.create({
        ...query,
        data: {
          route: args.route,
          vesselType: args.vesselType,
          rateType: args.rateType,
          rate: args.rate,
          rateUnit: args.rateUnit ?? 'usd_per_day',
          dwtMin: args.dwtMin ?? undefined,
          dwtMax: args.dwtMax ?? undefined,
          duration: args.duration ?? undefined,
          effectiveDate: args.effectiveDate,
          expiryDate: args.expiryDate ?? undefined,
          source: args.source ?? 'market',
          region: args.region ?? undefined,
          notes: args.notes ?? undefined,
        },
      }),
  }),
)

builder.mutationField('updateMarketRate', (t) =>
  t.prismaField({
    type: 'MarketRate',
    args: {
      id: t.arg.string({ required: true }),
      route: t.arg.string(),
      vesselType: t.arg.string(),
      rateType: t.arg.string(),
      rate: t.arg.float(),
      rateUnit: t.arg.string(),
      dwtMin: t.arg.int(),
      dwtMax: t.arg.int(),
      duration: t.arg.string(),
      effectiveDate: t.arg({ type: 'DateTime' }),
      expiryDate: t.arg({ type: 'DateTime' }),
      source: t.arg.string(),
      region: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.marketRate.update({
        ...query,
        where: { id: args.id },
        data: {
          ...(args.route && { route: args.route }),
          ...(args.vesselType && { vesselType: args.vesselType }),
          ...(args.rateType && { rateType: args.rateType }),
          ...(args.rate != null && { rate: args.rate }),
          ...(args.rateUnit && { rateUnit: args.rateUnit }),
          ...(args.dwtMin != null && { dwtMin: args.dwtMin }),
          ...(args.dwtMax != null && { dwtMax: args.dwtMax }),
          ...(args.duration && { duration: args.duration }),
          ...(args.effectiveDate && { effectiveDate: args.effectiveDate }),
          ...(args.expiryDate && { expiryDate: args.expiryDate }),
          ...(args.source && { source: args.source }),
          ...(args.region && { region: args.region }),
          ...(args.notes && { notes: args.notes }),
        },
      }),
  }),
)
