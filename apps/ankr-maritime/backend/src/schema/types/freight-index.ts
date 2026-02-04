import { builder } from '../builder.js'

builder.prismaObject('FreightIndex', {
  fields: (t) => ({
    id: t.exposeID('id'),
    indexName: t.exposeString('indexName'),
    date: t.expose('date', { type: 'DateTime' }),
    value: t.exposeFloat('value'),
    change: t.exposeFloat('change'),
    changePct: t.exposeFloat('changePct'),
    source: t.exposeString('source'),
    notes: t.exposeString('notes', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
})

// === Queries ===

builder.queryField('freightIndices', (t) =>
  t.prismaField({
    type: ['FreightIndex'],
    args: {
      indexName: t.arg.string({ required: true }),
      startDate: t.arg({ type: 'DateTime' }),
      endDate: t.arg({ type: 'DateTime' }),
      limit: t.arg.int(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { indexName: args.indexName }
      if (args.startDate || args.endDate) {
        const dateFilter: Record<string, unknown> = {}
        if (args.startDate) dateFilter.gte = args.startDate
        if (args.endDate) dateFilter.lte = args.endDate
        where.date = dateFilter
      }
      return ctx.prisma.freightIndex.findMany({
        ...query,
        where,
        orderBy: { date: 'desc' },
        ...(args.limit ? { take: args.limit } : {}),
      })
    },
  }),
)

builder.queryField('latestFreightIndices', (t) =>
  t.prismaField({
    type: ['FreightIndex'],
    resolve: async (query, _root, _args, ctx) => {
      // Get distinct index names then fetch the latest entry for each
      const names = await ctx.prisma.freightIndex.findMany({
        select: { indexName: true },
        distinct: ['indexName'],
      })

      const results = await Promise.all(
        names.map((n) =>
          ctx.prisma.freightIndex.findFirst({
            ...query,
            where: { indexName: n.indexName },
            orderBy: { date: 'desc' },
          }),
        ),
      )

      return results.filter(Boolean) as NonNullable<(typeof results)[number]>[]
    },
  }),
)

builder.queryField('freightIndexNames', (t) =>
  t.field({
    type: ['String'],
    resolve: async (_root, _args, ctx) => {
      const rows = await ctx.prisma.freightIndex.findMany({
        select: { indexName: true },
        distinct: ['indexName'],
        orderBy: { indexName: 'asc' },
      })
      return rows.map((r) => r.indexName)
    },
  }),
)

// === Mutations ===

builder.mutationField('recordFreightIndex', (t) =>
  t.prismaField({
    type: 'FreightIndex',
    args: {
      indexName: t.arg.string({ required: true }),
      date: t.arg({ type: 'DateTime', required: true }),
      value: t.arg.float({ required: true }),
      source: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      // Fetch previous entry to calculate change
      const previous = await ctx.prisma.freightIndex.findFirst({
        where: {
          indexName: args.indexName,
          date: { lt: args.date },
        },
        orderBy: { date: 'desc' },
      })

      const change = previous ? args.value - previous.value : 0
      const changePct = previous && previous.value !== 0
        ? ((args.value - previous.value) / previous.value) * 100
        : 0

      return ctx.prisma.freightIndex.create({
        ...query,
        data: {
          indexName: args.indexName,
          date: args.date,
          value: args.value,
          change: Math.round(change * 100) / 100,
          changePct: Math.round(changePct * 100) / 100,
          source: args.source ?? 'baltic_exchange',
          notes: args.notes ?? undefined,
        },
      })
    },
  }),
)
