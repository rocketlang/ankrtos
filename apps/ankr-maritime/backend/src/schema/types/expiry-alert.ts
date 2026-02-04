import { builder } from '../builder.js'

// ── Prisma Object ────────────────────────────────────────────

builder.prismaObject('ExpiryAlert', {
  fields: (t) => ({
    id: t.exposeID('id'),
    organizationId: t.exposeString('organizationId'),
    entityType: t.exposeString('entityType'),
    entityId: t.exposeString('entityId'),
    entityName: t.exposeString('entityName'),
    vesselId: t.exposeString('vesselId', { nullable: true }),
    crewMemberId: t.exposeString('crewMemberId', { nullable: true }),
    expiryDate: t.expose('expiryDate', { type: 'DateTime' }),
    alertDaysBefore: t.exposeIntList('alertDaysBefore'),
    lastAlertSent: t.expose('lastAlertSent', { type: 'DateTime', nullable: true }),
    status: t.exposeString('status'),
    renewedDate: t.expose('renewedDate', { type: 'DateTime', nullable: true }),
    renewedBy: t.exposeString('renewedBy', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})

// ── Custom Types for Summary ─────────────────────────────────

const EntityTypeCount = builder.objectRef<{
  type: string
  count: number
}>('EntityTypeCount')

EntityTypeCount.implement({
  fields: (t) => ({
    type: t.exposeString('type'),
    count: t.exposeInt('count'),
  }),
})

const ExpiryAlertSummary = builder.objectRef<{
  totalActive: number
  expiredCount: number
  expiringIn30: number
  expiringIn60: number
  expiringIn90: number
  byEntityType: { type: string; count: number }[]
}>('ExpiryAlertSummary')

ExpiryAlertSummary.implement({
  fields: (t) => ({
    totalActive: t.exposeInt('totalActive'),
    expiredCount: t.exposeInt('expiredCount'),
    expiringIn30: t.exposeInt('expiringIn30'),
    expiringIn60: t.exposeInt('expiringIn60'),
    expiringIn90: t.exposeInt('expiringIn90'),
    byEntityType: t.field({
      type: [EntityTypeCount],
      resolve: (parent) => parent.byEntityType,
    }),
  }),
})

// ── Input Type for Bulk Create ───────────────────────────────

const BulkExpiryAlertInput = builder.inputType('BulkExpiryAlertInput', {
  fields: (t) => ({
    entityType: t.string({ required: true }),
    entityId: t.string({ required: true }),
    entityName: t.string({ required: true }),
    expiryDate: t.field({ type: 'DateTime', required: true }),
  }),
})

// ── Queries ──────────────────────────────────────────────────

builder.queryField('expiryAlerts', (t) =>
  t.prismaField({
    type: ['ExpiryAlert'],
    args: {
      entityType: t.arg.string({ required: false }),
      status: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.expiryAlert.findMany({
        ...query,
        where: {
          ...ctx.orgFilter(),
          ...(args.entityType && { entityType: args.entityType }),
          ...(args.status && { status: args.status }),
        },
        orderBy: { expiryDate: 'asc' },
      }),
  }),
)

builder.queryField('upcomingExpiries', (t) =>
  t.prismaField({
    type: ['ExpiryAlert'],
    args: {
      days: t.arg.int({ required: false, defaultValue: 90 }),
    },
    resolve: (query, _root, args, ctx) => {
      const now = new Date()
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() + (args.days ?? 90))
      return ctx.prisma.expiryAlert.findMany({
        ...query,
        where: {
          ...ctx.orgFilter(),
          status: 'active',
          expiryDate: { gte: now, lte: cutoff },
        },
        orderBy: { expiryDate: 'asc' },
      })
    },
  }),
)

builder.queryField('expiredItems', (t) =>
  t.prismaField({
    type: ['ExpiryAlert'],
    resolve: (query, _root, _args, ctx) =>
      ctx.prisma.expiryAlert.findMany({
        ...query,
        where: {
          ...ctx.orgFilter(),
          status: 'active',
          expiryDate: { lt: new Date() },
        },
        orderBy: { expiryDate: 'asc' },
      }),
  }),
)

builder.queryField('expiryAlertSummary', (t) =>
  t.field({
    type: ExpiryAlertSummary,
    resolve: async (_root, _args, ctx) => {
      const orgFilter = ctx.orgFilter()
      const now = new Date()
      const in30 = new Date()
      in30.setDate(in30.getDate() + 30)
      const in60 = new Date()
      in60.setDate(in60.getDate() + 60)
      const in90 = new Date()
      in90.setDate(in90.getDate() + 90)

      const activeWhere = { ...orgFilter, status: 'active' as const }

      const [totalActive, expiredCount, expiringIn30, expiringIn60, expiringIn90, allActive] =
        await Promise.all([
          ctx.prisma.expiryAlert.count({ where: activeWhere }),
          ctx.prisma.expiryAlert.count({
            where: { ...activeWhere, expiryDate: { lt: now } },
          }),
          ctx.prisma.expiryAlert.count({
            where: { ...activeWhere, expiryDate: { gte: now, lte: in30 } },
          }),
          ctx.prisma.expiryAlert.count({
            where: { ...activeWhere, expiryDate: { gte: now, lte: in60 } },
          }),
          ctx.prisma.expiryAlert.count({
            where: { ...activeWhere, expiryDate: { gte: now, lte: in90 } },
          }),
          ctx.prisma.expiryAlert.findMany({
            where: activeWhere,
            select: { entityType: true },
          }),
        ])

      // Group by entityType
      const typeMap = new Map<string, number>()
      for (const alert of allActive) {
        typeMap.set(alert.entityType, (typeMap.get(alert.entityType) ?? 0) + 1)
      }
      const byEntityType = Array.from(typeMap.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)

      return {
        totalActive,
        expiredCount,
        expiringIn30,
        expiringIn60,
        expiringIn90,
        byEntityType,
      }
    },
  }),
)

// ── Mutations ────────────────────────────────────────────────

builder.mutationField('createExpiryAlert', (t) =>
  t.prismaField({
    type: 'ExpiryAlert',
    args: {
      entityType: t.arg.string({ required: true }),
      entityId: t.arg.string({ required: true }),
      entityName: t.arg.string({ required: true }),
      vesselId: t.arg.string(),
      crewMemberId: t.arg.string(),
      expiryDate: t.arg({ type: 'DateTime', required: true }),
      alertDaysBefore: t.arg.intList({ required: false }),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId()
      return ctx.prisma.expiryAlert.create({
        ...query,
        data: {
          organizationId: orgId,
          entityType: args.entityType,
          entityId: args.entityId,
          entityName: args.entityName,
          vesselId: args.vesselId ?? undefined,
          crewMemberId: args.crewMemberId ?? undefined,
          expiryDate: args.expiryDate,
          alertDaysBefore: args.alertDaysBefore ?? [90, 60, 30, 14, 7],
          notes: args.notes ?? undefined,
        },
      })
    },
  }),
)

builder.mutationField('renewExpiryAlert', (t) =>
  t.prismaField({
    type: 'ExpiryAlert',
    args: {
      id: t.arg.string({ required: true }),
      renewedDate: t.arg({ type: 'DateTime', required: true }),
    },
    resolve: (query, _root, args, ctx) => {
      const userName = ctx.user?.name ?? 'Unknown'
      return ctx.prisma.expiryAlert.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'renewed',
          renewedDate: args.renewedDate,
          renewedBy: userName,
        },
      })
    },
  }),
)

builder.mutationField('dismissExpiryAlert', (t) =>
  t.prismaField({
    type: 'ExpiryAlert',
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.expiryAlert.update({
        ...query,
        where: { id: args.id },
        data: { status: 'dismissed' },
      }),
  }),
)

builder.mutationField('bulkCreateExpiryAlerts', (t) =>
  t.field({
    type: 'Int',
    args: {
      alerts: t.arg({ type: [BulkExpiryAlertInput], required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const orgId = ctx.orgId()
      const result = await ctx.prisma.expiryAlert.createMany({
        data: args.alerts.map((a) => ({
          organizationId: orgId,
          entityType: a.entityType,
          entityId: a.entityId,
          entityName: a.entityName,
          expiryDate: a.expiryDate,
        })),
      })
      return result.count
    },
  }),
)
