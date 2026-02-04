import { builder } from '../builder.js'
import { prisma } from '../context.js'

// === WeatherWorkingDay prismaObject ===

builder.prismaObject('WeatherWorkingDay', {
  fields: (t) => ({
    id: t.exposeID('id'),
    voyageId: t.exposeString('voyageId'),
    portCallId: t.exposeString('portCallId', { nullable: true }),
    portName: t.exposeString('portName'),
    date: t.expose('date', { type: 'DateTime' }),
    weatherCondition: t.exposeString('weatherCondition'),
    windSpeedKnots: t.exposeFloat('windSpeedKnots', { nullable: true }),
    waveHeightM: t.exposeFloat('waveHeightM', { nullable: true }),
    visibility: t.exposeString('visibility', { nullable: true }),
    isWorkingDay: t.exposeBoolean('isWorkingDay'),
    isWeatherDay: t.exposeBoolean('isWeatherDay'),
    hoursLost: t.exposeFloat('hoursLost'),
    deductionReason: t.exposeString('deductionReason', { nullable: true }),
    source: t.exposeString('source'),
    verifiedBy: t.exposeString('verifiedBy', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
})

// === Queries ===

builder.queryField('weatherWorkingDays', (t) =>
  t.prismaField({
    type: ['WeatherWorkingDay'],
    args: { voyageId: t.arg.string({ required: true }) },
    resolve: (query, _root, args) =>
      prisma.weatherWorkingDay.findMany({
        ...query,
        where: { voyageId: args.voyageId },
        orderBy: { date: 'asc' },
      }),
  }),
)

builder.queryField('weatherWorkingDay', (t) =>
  t.prismaField({
    type: 'WeatherWorkingDay',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args) =>
      prisma.weatherWorkingDay.findUnique({ ...query, where: { id: args.id } }),
  }),
)

// === Weather Day Summary custom types ===

const DeductionBreakdownItem = builder.objectRef<{
  reason: string
  hours: number
  count: number
}>('DeductionBreakdownItem')

DeductionBreakdownItem.implement({
  fields: (t) => ({
    reason: t.exposeString('reason'),
    hours: t.exposeFloat('hours'),
    count: t.exposeInt('count'),
  }),
})

const WeatherDaySummaryType = builder.objectRef<{
  totalDays: number
  workingDays: number
  weatherDays: number
  hoursLost: number
  deductionBreakdown: Array<{ reason: string; hours: number; count: number }>
}>('WeatherDaySummary')

WeatherDaySummaryType.implement({
  fields: (t) => ({
    totalDays: t.exposeInt('totalDays'),
    workingDays: t.exposeInt('workingDays'),
    weatherDays: t.exposeInt('weatherDays'),
    hoursLost: t.exposeFloat('hoursLost'),
    deductionBreakdown: t.field({
      type: [DeductionBreakdownItem],
      resolve: (parent) => parent.deductionBreakdown,
    }),
  }),
})

builder.queryField('weatherDaySummary', (t) =>
  t.field({
    type: WeatherDaySummaryType,
    args: { voyageId: t.arg.string({ required: true }) },
    resolve: async (_root, args) => {
      const days = await prisma.weatherWorkingDay.findMany({
        where: { voyageId: args.voyageId },
        orderBy: { date: 'asc' },
      })

      const totalDays = days.length
      const workingDays = days.filter((d) => d.isWorkingDay).length
      const weatherDays = days.filter((d) => d.isWeatherDay).length
      const hoursLost = days.reduce((sum, d) => sum + d.hoursLost, 0)

      // Build deduction breakdown by reason
      const breakdownMap = new Map<string, { hours: number; count: number }>()
      for (const d of days) {
        if (d.deductionReason && d.hoursLost > 0) {
          const existing = breakdownMap.get(d.deductionReason)
          if (existing) {
            existing.hours += d.hoursLost
            existing.count += 1
          } else {
            breakdownMap.set(d.deductionReason, { hours: d.hoursLost, count: 1 })
          }
        }
      }

      const deductionBreakdown = Array.from(breakdownMap.entries()).map(([reason, data]) => ({
        reason,
        hours: Math.round(data.hours * 100) / 100,
        count: data.count,
      }))

      return {
        totalDays,
        workingDays,
        weatherDays,
        hoursLost: Math.round(hoursLost * 100) / 100,
        deductionBreakdown,
      }
    },
  }),
)

// === Mutations ===

builder.mutationField('recordWeatherDay', (t) =>
  t.prismaField({
    type: 'WeatherWorkingDay',
    args: {
      voyageId: t.arg.string({ required: true }),
      portName: t.arg.string({ required: true }),
      date: t.arg({ type: 'DateTime', required: true }),
      weatherCondition: t.arg.string({ required: true }),
      windSpeedKnots: t.arg.float(),
      waveHeightM: t.arg.float(),
      isWorkingDay: t.arg.boolean({ required: true }),
      isWeatherDay: t.arg.boolean({ required: true }),
      hoursLost: t.arg.float(),
      deductionReason: t.arg.string(),
      source: t.arg.string(),
    },
    resolve: (query, _root, args) =>
      prisma.weatherWorkingDay.create({
        ...query,
        data: {
          voyageId: args.voyageId,
          portName: args.portName,
          date: args.date,
          weatherCondition: args.weatherCondition,
          windSpeedKnots: args.windSpeedKnots ?? undefined,
          waveHeightM: args.waveHeightM ?? undefined,
          isWorkingDay: args.isWorkingDay,
          isWeatherDay: args.isWeatherDay,
          hoursLost: args.hoursLost ?? 0,
          deductionReason: args.deductionReason ?? undefined,
          source: args.source ?? 'manual',
        },
      }),
  }),
)

builder.mutationField('verifyWeatherDay', (t) =>
  t.prismaField({
    type: 'WeatherWorkingDay',
    args: {
      id: t.arg.string({ required: true }),
      verifiedBy: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args) =>
      prisma.weatherWorkingDay.update({
        ...query,
        where: { id: args.id },
        data: { verifiedBy: args.verifiedBy },
      }),
  }),
)

builder.mutationField('deleteWeatherDay', (t) =>
  t.prismaField({
    type: 'WeatherWorkingDay',
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args) =>
      prisma.weatherWorkingDay.delete({ ...query, where: { id: args.id } }),
  }),
)
