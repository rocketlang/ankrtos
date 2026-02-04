import { builder } from '../builder.js'
import { calculateOffHireDuration, calculateOffHireDeduction } from '../../services/off-hire-calculator.js'

builder.prismaObject('OffHireEvent', {
  fields: (t) => ({
    id: t.exposeID('id'),
    timeCharterId: t.exposeString('timeCharterId'),
    vesselId: t.exposeString('vesselId'),
    offHireType: t.exposeString('offHireType'),
    startDate: t.expose('startDate', { type: 'DateTime' }),
    endDate: t.expose('endDate', { type: 'DateTime', nullable: true }),
    durationHours: t.exposeFloat('durationHours'),
    durationDays: t.exposeFloat('durationDays'),
    dailyRate: t.exposeFloat('dailyRate'),
    deductionAmount: t.exposeFloat('deductionAmount'),
    description: t.exposeString('description', { nullable: true }),
    location: t.exposeString('location', { nullable: true }),
    equipmentAffected: t.exposeString('equipmentAffected', { nullable: true }),
    sparePartsNeeded: t.exposeString('sparePartsNeeded', { nullable: true }),
    repairCost: t.exposeFloat('repairCost', { nullable: true }),
    status: t.exposeString('status'),
    resolvedDate: t.expose('resolvedDate', { type: 'DateTime', nullable: true }),
    resolvedBy: t.exposeString('resolvedBy', { nullable: true }),
    disputeNotes: t.exposeString('disputeNotes', { nullable: true }),
    surveyorReport: t.exposeString('surveyorReport', { nullable: true }),
    classNotification: t.exposeString('classNotification', { nullable: true }),
    timeCharter: t.relation('timeCharter'),
    vessel: t.relation('vessel'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})

// === Custom summary types ===

const OffHireByType = builder.objectRef<{
  type: string
  count: number
  days: number
  amount: number
}>('OffHireByType')

OffHireByType.implement({
  fields: (t) => ({
    type: t.exposeString('type'),
    count: t.exposeInt('count'),
    days: t.exposeFloat('days'),
    amount: t.exposeFloat('amount'),
  }),
})

const OffHireSummary = builder.objectRef<{
  totalEvents: number
  totalDays: number
  totalDeduction: number
  byType: Array<{ type: string; count: number; days: number; amount: number }>
}>('OffHireSummary')

OffHireSummary.implement({
  fields: (t) => ({
    totalEvents: t.exposeInt('totalEvents'),
    totalDays: t.exposeFloat('totalDays'),
    totalDeduction: t.exposeFloat('totalDeduction'),
    byType: t.field({
      type: [OffHireByType],
      resolve: (parent) => parent.byType,
    }),
  }),
})

// === Queries ===

builder.queryField('offHireEvents', (t) =>
  t.prismaField({
    type: ['OffHireEvent'],
    args: {
      timeCharterId: t.arg.string(),
      vesselId: t.arg.string(),
      status: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = {}
      if (args.timeCharterId) where.timeCharterId = args.timeCharterId
      if (args.vesselId) where.vesselId = args.vesselId
      if (args.status) where.status = args.status
      return ctx.prisma.offHireEvent.findMany({
        ...query,
        where,
        orderBy: { startDate: 'desc' },
      })
    },
  }),
)

builder.queryField('offHireEvent', (t) =>
  t.prismaField({
    type: 'OffHireEvent',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.offHireEvent.findUnique({ ...query, where: { id: args.id } }),
  }),
)

builder.queryField('offHireSummary', (t) =>
  t.field({
    type: OffHireSummary,
    args: { timeCharterId: t.arg.string({ required: true }) },
    resolve: async (_root, args, ctx) => {
      const events = await ctx.prisma.offHireEvent.findMany({
        where: { timeCharterId: args.timeCharterId },
      })

      const typeMap = new Map<string, { count: number; days: number; amount: number }>()
      let totalDays = 0
      let totalDeduction = 0

      for (const e of events) {
        totalDays += e.durationDays
        totalDeduction += e.deductionAmount

        const existing = typeMap.get(e.offHireType) ?? { count: 0, days: 0, amount: 0 }
        existing.count++
        existing.days += e.durationDays
        existing.amount += e.deductionAmount
        typeMap.set(e.offHireType, existing)
      }

      const byType = Array.from(typeMap.entries()).map(([type, data]) => ({
        type,
        count: data.count,
        days: Math.round(data.days * 100) / 100,
        amount: Math.round(data.amount * 100) / 100,
      }))

      return {
        totalEvents: events.length,
        totalDays: Math.round(totalDays * 100) / 100,
        totalDeduction: Math.round(totalDeduction * 100) / 100,
        byType,
      }
    },
  }),
)

// === Mutations ===

builder.mutationField('createOffHireEvent', (t) =>
  t.prismaField({
    type: 'OffHireEvent',
    args: {
      timeCharterId: t.arg.string({ required: true }),
      vesselId: t.arg.string({ required: true }),
      offHireType: t.arg.string({ required: true }),
      startDate: t.arg({ type: 'DateTime', required: true }),
      dailyRate: t.arg.float({ required: true }),
      description: t.arg.string(),
      location: t.arg.string(),
      equipmentAffected: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.offHireEvent.create({
        ...query,
        data: {
          timeCharterId: args.timeCharterId,
          vesselId: args.vesselId,
          offHireType: args.offHireType,
          startDate: args.startDate,
          dailyRate: args.dailyRate,
          description: args.description ?? undefined,
          location: args.location ?? undefined,
          equipmentAffected: args.equipmentAffected ?? undefined,
        },
      }),
  }),
)

builder.mutationField('resolveOffHireEvent', (t) =>
  t.prismaField({
    type: 'OffHireEvent',
    args: {
      id: t.arg.string({ required: true }),
      endDate: t.arg({ type: 'DateTime', required: true }),
      resolvedBy: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const event = await ctx.prisma.offHireEvent.findUniqueOrThrow({
        where: { id: args.id },
      })

      const duration = calculateOffHireDuration(event.startDate, args.endDate)
      const deduction = calculateOffHireDeduction(duration.days, event.dailyRate, event.offHireType)

      return ctx.prisma.offHireEvent.update({
        ...query,
        where: { id: args.id },
        data: {
          endDate: args.endDate,
          durationHours: duration.hours,
          durationDays: duration.days,
          deductionAmount: deduction.deduction,
          resolvedDate: new Date(),
          resolvedBy: args.resolvedBy ?? undefined,
          status: 'resolved',
        },
      })
    },
  }),
)

builder.mutationField('disputeOffHireEvent', (t) =>
  t.prismaField({
    type: 'OffHireEvent',
    args: {
      id: t.arg.string({ required: true }),
      disputeNotes: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.offHireEvent.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'disputed',
          disputeNotes: args.disputeNotes,
        },
      }),
  }),
)
