import { builder } from '../builder.js'

builder.prismaObject('VesselInspection', {
  fields: (t) => ({
    id: t.exposeID('id'),
    vesselId: t.exposeString('vesselId'),
    inspectionType: t.exposeString('inspectionType'),
    inspectorName: t.exposeString('inspectorName', { nullable: true }),
    inspectorOrg: t.exposeString('inspectorOrg', { nullable: true }),
    inspectionDate: t.expose('inspectionDate', { type: 'DateTime' }),
    portOfInspection: t.exposeString('portOfInspection', { nullable: true }),
    overallScore: t.exposeFloat('overallScore', { nullable: true }),
    grade: t.exposeString('grade', { nullable: true }),
    deficienciesFound: t.exposeInt('deficienciesFound'),
    observationsCount: t.exposeInt('observationsCount'),
    navigation: t.exposeInt('navigation'),
    safety: t.exposeInt('safety'),
    pollution: t.exposeInt('pollution'),
    structural: t.exposeInt('structural'),
    operational: t.exposeInt('operational'),
    documentation: t.exposeInt('documentation'),
    status: t.exposeString('status'),
    closedOutDate: t.expose('closedOutDate', { type: 'DateTime', nullable: true }),
    closedOutBy: t.exposeString('closedOutBy', { nullable: true }),
    detentionIssued: t.exposeBoolean('detentionIssued'),
    detentionDays: t.exposeInt('detentionDays'),
    reportUrl: t.exposeString('reportUrl', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    nextInspectionDue: t.expose('nextInspectionDue', { type: 'DateTime', nullable: true }),
    vessel: t.relation('vessel'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})

// === Custom summary types ===

const DeficiencyByCategory = builder.objectRef<{
  category: string
  total: number
}>('DeficiencyByCategory')

DeficiencyByCategory.implement({
  fields: (t) => ({
    category: t.exposeString('category'),
    total: t.exposeInt('total'),
  }),
})

const InspectionDashboard = builder.objectRef<{
  totalInspections: number
  passRate: number
  avgScore: number
  deficienciesByCategory: Array<{ category: string; total: number }>
  upcomingInspections: number
  detentionCount: number
}>('InspectionDashboard')

InspectionDashboard.implement({
  fields: (t) => ({
    totalInspections: t.exposeInt('totalInspections'),
    passRate: t.exposeFloat('passRate'),
    avgScore: t.exposeFloat('avgScore'),
    deficienciesByCategory: t.field({
      type: [DeficiencyByCategory],
      resolve: (parent) => parent.deficienciesByCategory,
    }),
    upcomingInspections: t.exposeInt('upcomingInspections'),
    detentionCount: t.exposeInt('detentionCount'),
  }),
})

// === Queries ===

builder.queryField('vesselInspections', (t) =>
  t.prismaField({
    type: ['VesselInspection'],
    args: {
      vesselId: t.arg.string(),
      inspectionType: t.arg.string(),
      status: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = {}
      if (args.vesselId) where.vesselId = args.vesselId
      if (args.inspectionType) where.inspectionType = args.inspectionType
      if (args.status) where.status = args.status
      return ctx.prisma.vesselInspection.findMany({
        ...query,
        where,
        orderBy: { inspectionDate: 'desc' },
      })
    },
  }),
)

builder.queryField('vesselInspection', (t) =>
  t.prismaField({
    type: 'VesselInspection',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.vesselInspection.findUnique({ ...query, where: { id: args.id } }),
  }),
)

builder.queryField('inspectionDashboard', (t) =>
  t.field({
    type: InspectionDashboard,
    args: { vesselId: t.arg.string() },
    resolve: async (_root, args, ctx) => {
      const where: Record<string, unknown> = {}
      if (args.vesselId) where.vesselId = args.vesselId

      const inspections = await ctx.prisma.vesselInspection.findMany({ where })

      const completed = inspections.filter((i) => i.status === 'completed' || i.status === 'closed_out')
      const passed = completed.filter((i) => {
        if (i.grade) return ['A', 'B', 'Pass'].includes(i.grade)
        if (i.overallScore != null) return i.overallScore >= 70
        return i.deficienciesFound === 0
      })

      const scores = completed.filter((i) => i.overallScore != null).map((i) => i.overallScore!)
      const avgScore = scores.length > 0
        ? scores.reduce((sum, s) => sum + s, 0) / scores.length
        : 0

      // Aggregate deficiencies by category
      const categories: Record<string, number> = {
        navigation: 0,
        safety: 0,
        pollution: 0,
        structural: 0,
        operational: 0,
        documentation: 0,
      }
      for (const i of inspections) {
        categories.navigation += i.navigation
        categories.safety += i.safety
        categories.pollution += i.pollution
        categories.structural += i.structural
        categories.operational += i.operational
        categories.documentation += i.documentation
      }

      const deficienciesByCategory = Object.entries(categories)
        .map(([category, total]) => ({ category, total }))
        .filter((d) => d.total > 0)
        .sort((a, b) => b.total - a.total)

      const now = new Date()
      const upcomingInspections = inspections.filter(
        (i) => i.status === 'scheduled' && i.inspectionDate > now,
      ).length

      const detentionCount = inspections.filter((i) => i.detentionIssued).length

      return {
        totalInspections: inspections.length,
        passRate: completed.length > 0
          ? Math.round((passed.length / completed.length) * 10000) / 100
          : 0,
        avgScore: Math.round(avgScore * 100) / 100,
        deficienciesByCategory,
        upcomingInspections,
        detentionCount,
      }
    },
  }),
)

// === Mutations ===

builder.mutationField('createVesselInspection', (t) =>
  t.prismaField({
    type: 'VesselInspection',
    args: {
      vesselId: t.arg.string({ required: true }),
      inspectionType: t.arg.string({ required: true }),
      inspectionDate: t.arg({ type: 'DateTime', required: true }),
      portOfInspection: t.arg.string(),
      inspectorName: t.arg.string(),
      inspectorOrg: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.vesselInspection.create({
        ...query,
        data: {
          vesselId: args.vesselId,
          inspectionType: args.inspectionType,
          inspectionDate: args.inspectionDate,
          portOfInspection: args.portOfInspection ?? undefined,
          inspectorName: args.inspectorName ?? undefined,
          inspectorOrg: args.inspectorOrg ?? undefined,
        },
      }),
  }),
)

builder.mutationField('completeInspection', (t) =>
  t.prismaField({
    type: 'VesselInspection',
    args: {
      id: t.arg.string({ required: true }),
      overallScore: t.arg.float(),
      grade: t.arg.string(),
      deficienciesFound: t.arg.int({ required: true }),
      observationsCount: t.arg.int({ required: true }),
      navigation: t.arg.int(),
      safety: t.arg.int(),
      pollution: t.arg.int(),
      structural: t.arg.int(),
      operational: t.arg.int(),
      documentation: t.arg.int(),
      reportUrl: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.vesselInspection.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'completed',
          overallScore: args.overallScore ?? undefined,
          grade: args.grade ?? undefined,
          deficienciesFound: args.deficienciesFound,
          observationsCount: args.observationsCount,
          navigation: args.navigation ?? 0,
          safety: args.safety ?? 0,
          pollution: args.pollution ?? 0,
          structural: args.structural ?? 0,
          operational: args.operational ?? 0,
          documentation: args.documentation ?? 0,
          reportUrl: args.reportUrl ?? undefined,
          detentionIssued: args.deficienciesFound > 10,
        },
      }),
  }),
)

builder.mutationField('closeOutInspection', (t) =>
  t.prismaField({
    type: 'VesselInspection',
    args: {
      id: t.arg.string({ required: true }),
      closedOutBy: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.vesselInspection.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'closed_out',
          closedOutDate: new Date(),
          closedOutBy: args.closedOutBy,
        },
      }),
  }),
)

builder.mutationField('scheduleNextInspection', (t) =>
  t.prismaField({
    type: 'VesselInspection',
    args: {
      id: t.arg.string({ required: true }),
      nextInspectionDue: t.arg({ type: 'DateTime', required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.vesselInspection.update({
        ...query,
        where: { id: args.id },
        data: {
          nextInspectionDue: args.nextInspectionDue,
        },
      }),
  }),
)
