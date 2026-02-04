import { builder } from '../builder.js'
import { prisma } from '../context.js'

// === PortCostBenchmark prismaObject ===

builder.prismaObject('PortCostBenchmark', {
  fields: (t) => ({
    id: t.exposeID('id'),
    portId: t.exposeString('portId'),
    portName: t.exposeString('portName'),
    vesselType: t.exposeString('vesselType'),
    dwtRange: t.exposeString('dwtRange'),
    costCategory: t.exposeString('costCategory'),
    avgCostUsd: t.exposeFloat('avgCostUsd'),
    minCostUsd: t.exposeFloat('minCostUsd'),
    maxCostUsd: t.exposeFloat('maxCostUsd'),
    medianCostUsd: t.exposeFloat('medianCostUsd'),
    sampleSize: t.exposeInt('sampleSize'),
    periodStart: t.expose('periodStart', { type: 'DateTime' }),
    periodEnd: t.expose('periodEnd', { type: 'DateTime' }),
    currency: t.exposeString('currency'),
    trend: t.exposeString('trend'),
    trendPct: t.exposeFloat('trendPct'),
    notes: t.exposeString('notes', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})

// === Queries ===

builder.queryField('portCostBenchmarks', (t) =>
  t.prismaField({
    type: ['PortCostBenchmark'],
    args: {
      portId: t.arg.string(),
      vesselType: t.arg.string(),
      costCategory: t.arg.string(),
    },
    resolve: (query, _root, args) => {
      const where: Record<string, unknown> = {}
      if (args.portId) where.portId = args.portId
      if (args.vesselType) where.vesselType = args.vesselType
      if (args.costCategory) where.costCategory = args.costCategory
      return prisma.portCostBenchmark.findMany({
        ...query,
        where,
        orderBy: { portName: 'asc' },
      })
    },
  }),
)

builder.queryField('portCostBenchmark', (t) =>
  t.prismaField({
    type: 'PortCostBenchmark',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args) =>
      prisma.portCostBenchmark.findUnique({ ...query, where: { id: args.id } }),
  }),
)

// === Port Cost Comparison custom type ===

const PortCostComparisonEntry = builder.objectRef<{
  portId: string
  portName: string
  costCategory: string
  avgCostUsd: number
  minCostUsd: number
  maxCostUsd: number
  medianCostUsd: number
  sampleSize: number
  trend: string
  trendPct: number
}>('PortCostComparisonEntry')

PortCostComparisonEntry.implement({
  fields: (t) => ({
    portId: t.exposeString('portId'),
    portName: t.exposeString('portName'),
    costCategory: t.exposeString('costCategory'),
    avgCostUsd: t.exposeFloat('avgCostUsd'),
    minCostUsd: t.exposeFloat('minCostUsd'),
    maxCostUsd: t.exposeFloat('maxCostUsd'),
    medianCostUsd: t.exposeFloat('medianCostUsd'),
    sampleSize: t.exposeInt('sampleSize'),
    trend: t.exposeString('trend'),
    trendPct: t.exposeFloat('trendPct'),
  }),
})

builder.queryField('portCostComparison', (t) =>
  t.field({
    type: [PortCostComparisonEntry],
    args: {
      portIds: t.arg.stringList({ required: true }),
      vesselType: t.arg.string({ required: true }),
      dwtRange: t.arg.string({ required: true }),
    },
    resolve: async (_root, args) => {
      const benchmarks = await prisma.portCostBenchmark.findMany({
        where: {
          portId: { in: args.portIds },
          vesselType: args.vesselType,
          dwtRange: args.dwtRange,
        },
        orderBy: [{ portName: 'asc' }, { costCategory: 'asc' }],
      })
      return benchmarks.map((b) => ({
        portId: b.portId,
        portName: b.portName,
        costCategory: b.costCategory,
        avgCostUsd: b.avgCostUsd,
        minCostUsd: b.minCostUsd,
        maxCostUsd: b.maxCostUsd,
        medianCostUsd: b.medianCostUsd,
        sampleSize: b.sampleSize,
        trend: b.trend,
        trendPct: b.trendPct,
      }))
    },
  }),
)

// === Mutations ===

builder.mutationField('createPortCostBenchmark', (t) =>
  t.prismaField({
    type: 'PortCostBenchmark',
    args: {
      portId: t.arg.string({ required: true }),
      portName: t.arg.string({ required: true }),
      vesselType: t.arg.string({ required: true }),
      dwtRange: t.arg.string({ required: true }),
      costCategory: t.arg.string({ required: true }),
      avgCostUsd: t.arg.float({ required: true }),
      minCostUsd: t.arg.float(),
      maxCostUsd: t.arg.float(),
      medianCostUsd: t.arg.float(),
      sampleSize: t.arg.int(),
      periodStart: t.arg({ type: 'DateTime', required: true }),
      periodEnd: t.arg({ type: 'DateTime', required: true }),
      currency: t.arg.string(),
      trend: t.arg.string(),
      trendPct: t.arg.float(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args) =>
      prisma.portCostBenchmark.create({
        ...query,
        data: {
          portId: args.portId,
          portName: args.portName,
          vesselType: args.vesselType,
          dwtRange: args.dwtRange,
          costCategory: args.costCategory,
          avgCostUsd: args.avgCostUsd,
          minCostUsd: args.minCostUsd ?? 0,
          maxCostUsd: args.maxCostUsd ?? 0,
          medianCostUsd: args.medianCostUsd ?? 0,
          sampleSize: args.sampleSize ?? 0,
          periodStart: args.periodStart,
          periodEnd: args.periodEnd,
          currency: args.currency ?? 'USD',
          trend: args.trend ?? 'stable',
          trendPct: args.trendPct ?? 0,
          notes: args.notes ?? undefined,
        },
      }),
  }),
)

builder.mutationField('updatePortCostBenchmark', (t) =>
  t.prismaField({
    type: 'PortCostBenchmark',
    args: {
      id: t.arg.string({ required: true }),
      avgCostUsd: t.arg.float(),
      minCostUsd: t.arg.float(),
      maxCostUsd: t.arg.float(),
      medianCostUsd: t.arg.float(),
      sampleSize: t.arg.int(),
      periodStart: t.arg({ type: 'DateTime' }),
      periodEnd: t.arg({ type: 'DateTime' }),
      trend: t.arg.string(),
      trendPct: t.arg.float(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args) =>
      prisma.portCostBenchmark.update({
        ...query,
        where: { id: args.id },
        data: {
          ...(args.avgCostUsd != null && { avgCostUsd: args.avgCostUsd }),
          ...(args.minCostUsd != null && { minCostUsd: args.minCostUsd }),
          ...(args.maxCostUsd != null && { maxCostUsd: args.maxCostUsd }),
          ...(args.medianCostUsd != null && { medianCostUsd: args.medianCostUsd }),
          ...(args.sampleSize != null && { sampleSize: args.sampleSize }),
          ...(args.periodStart != null && { periodStart: args.periodStart }),
          ...(args.periodEnd != null && { periodEnd: args.periodEnd }),
          ...(args.trend && { trend: args.trend }),
          ...(args.trendPct != null && { trendPct: args.trendPct }),
          ...(args.notes !== undefined && args.notes !== null && { notes: args.notes }),
        },
      }),
  }),
)
