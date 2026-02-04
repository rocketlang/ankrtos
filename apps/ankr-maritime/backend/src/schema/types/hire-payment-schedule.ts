import { builder } from '../builder.js'

builder.prismaObject('HirePaymentSchedule', {
  fields: (t) => ({
    id: t.exposeID('id'),
    timeCharterId: t.exposeString('timeCharterId'),
    organizationId: t.exposeString('organizationId'),
    periodNumber: t.exposeInt('periodNumber'),
    periodStart: t.expose('periodStart', { type: 'DateTime' }),
    periodEnd: t.expose('periodEnd', { type: 'DateTime' }),
    daysInPeriod: t.exposeFloat('daysInPeriod'),
    dailyRate: t.exposeFloat('dailyRate'),
    grossHire: t.exposeFloat('grossHire'),
    offHireDeduction: t.exposeFloat('offHireDeduction'),
    bunkerAdjustment: t.exposeFloat('bunkerAdjustment'),
    addressCommission: t.exposeFloat('addressCommission'),
    brokerCommission: t.exposeFloat('brokerCommission'),
    otherDeductions: t.exposeFloat('otherDeductions'),
    otherDeductionNotes: t.exposeString('otherDeductionNotes', { nullable: true }),
    netHire: t.exposeFloat('netHire'),
    invoiceNumber: t.exposeString('invoiceNumber', { nullable: true }),
    invoiceDate: t.expose('invoiceDate', { type: 'DateTime', nullable: true }),
    dueDate: t.expose('dueDate', { type: 'DateTime', nullable: true }),
    paidDate: t.expose('paidDate', { type: 'DateTime', nullable: true }),
    paidAmount: t.exposeFloat('paidAmount', { nullable: true }),
    status: t.exposeString('status'),
    notes: t.exposeString('notes', { nullable: true }),
    timeCharter: t.relation('timeCharter'),
    organization: t.relation('organization'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})

// === Custom summary type ===

const HirePaymentSummary = builder.objectRef<{
  totalGrossHire: number
  totalDeductions: number
  totalNetHire: number
  paidAmount: number
  outstandingAmount: number
  overdueCount: number
}>('HirePaymentSummary')

HirePaymentSummary.implement({
  fields: (t) => ({
    totalGrossHire: t.exposeFloat('totalGrossHire'),
    totalDeductions: t.exposeFloat('totalDeductions'),
    totalNetHire: t.exposeFloat('totalNetHire'),
    paidAmount: t.exposeFloat('paidAmount'),
    outstandingAmount: t.exposeFloat('outstandingAmount'),
    overdueCount: t.exposeInt('overdueCount'),
  }),
})

// === Queries ===

builder.queryField('hirePaymentSchedules', (t) =>
  t.prismaField({
    type: ['HirePaymentSchedule'],
    args: {
      timeCharterId: t.arg.string({ required: true }),
      status: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { timeCharterId: args.timeCharterId }
      if (args.status) where.status = args.status
      return ctx.prisma.hirePaymentSchedule.findMany({
        ...query,
        where,
        orderBy: { periodNumber: 'asc' },
      })
    },
  }),
)

builder.queryField('hirePaymentSchedule', (t) =>
  t.prismaField({
    type: 'HirePaymentSchedule',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.hirePaymentSchedule.findUnique({ ...query, where: { id: args.id } }),
  }),
)

builder.queryField('hirePaymentSummary', (t) =>
  t.field({
    type: HirePaymentSummary,
    args: { timeCharterId: t.arg.string({ required: true }) },
    resolve: async (_root, args, ctx) => {
      const schedules = await ctx.prisma.hirePaymentSchedule.findMany({
        where: { timeCharterId: args.timeCharterId },
      })

      let totalGrossHire = 0
      let totalDeductions = 0
      let totalNetHire = 0
      let paidAmount = 0
      let overdueCount = 0
      const now = new Date()

      for (const s of schedules) {
        totalGrossHire += s.grossHire
        totalDeductions += s.offHireDeduction + s.bunkerAdjustment + s.addressCommission + s.brokerCommission + s.otherDeductions
        totalNetHire += s.netHire
        paidAmount += s.paidAmount ?? 0
        if (s.status === 'overdue' || (s.status === 'invoiced' && s.dueDate && s.dueDate < now)) {
          overdueCount++
        }
      }

      return {
        totalGrossHire: Math.round(totalGrossHire * 100) / 100,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
        totalNetHire: Math.round(totalNetHire * 100) / 100,
        paidAmount: Math.round(paidAmount * 100) / 100,
        outstandingAmount: Math.round((totalNetHire - paidAmount) * 100) / 100,
        overdueCount,
      }
    },
  }),
)

// === Mutations ===

builder.mutationField('generateHireSchedule', (t) =>
  t.field({
    type: ['HirePaymentSchedule'],
    args: {
      timeCharterId: t.arg.string({ required: true }),
      periodDays: t.arg.int({ required: true }),
      dailyRate: t.arg.float({ required: true }),
      addressCommPct: t.arg.float(),
      brokerCommPct: t.arg.float(),
    },
    resolve: async (_root, args, ctx) => {
      const orgId = ctx.orgId()
      const tc = await ctx.prisma.timeCharter.findUniqueOrThrow({
        where: { id: args.timeCharterId },
      })

      if (!tc.deliveryDate || !tc.redeliveryDate) {
        throw new Error('TimeCharter must have both deliveryDate and redeliveryDate to generate schedule')
      }

      const addrPct = (args.addressCommPct ?? 3.75) / 100
      const brokerPct = (args.brokerCommPct ?? 1.25) / 100

      const entries: Array<{
        timeCharterId: string
        organizationId: string
        periodNumber: number
        periodStart: Date
        periodEnd: Date
        daysInPeriod: number
        dailyRate: number
        grossHire: number
        addressCommission: number
        brokerCommission: number
        netHire: number
      }> = []

      let periodStart = new Date(tc.deliveryDate)
      const redeliveryDate = new Date(tc.redeliveryDate)
      let periodNumber = 1

      while (periodStart < redeliveryDate) {
        const periodEnd = new Date(periodStart)
        periodEnd.setDate(periodEnd.getDate() + args.periodDays)
        // Clamp to redelivery date
        const actualEnd = periodEnd > redeliveryDate ? redeliveryDate : periodEnd
        const daysInPeriod = (actualEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
        const grossHire = daysInPeriod * args.dailyRate
        const addressCommission = Math.round(grossHire * addrPct * 100) / 100
        const brokerCommission = Math.round(grossHire * brokerPct * 100) / 100
        const netHire = Math.round((grossHire - addressCommission - brokerCommission) * 100) / 100

        entries.push({
          timeCharterId: args.timeCharterId,
          organizationId: orgId,
          periodNumber,
          periodStart: new Date(periodStart),
          periodEnd: actualEnd,
          daysInPeriod: Math.round(daysInPeriod * 100) / 100,
          dailyRate: args.dailyRate,
          grossHire: Math.round(grossHire * 100) / 100,
          addressCommission,
          brokerCommission,
          netHire,
        })

        periodStart = new Date(actualEnd)
        periodNumber++
      }

      // Bulk create
      await ctx.prisma.hirePaymentSchedule.createMany({ data: entries })

      return ctx.prisma.hirePaymentSchedule.findMany({
        where: { timeCharterId: args.timeCharterId },
        orderBy: { periodNumber: 'asc' },
      })
    },
  }),
)

builder.mutationField('invoiceHirePayment', (t) =>
  t.prismaField({
    type: 'HirePaymentSchedule',
    args: {
      id: t.arg.string({ required: true }),
      invoiceNumber: t.arg.string({ required: true }),
      dueDate: t.arg({ type: 'DateTime', required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.hirePaymentSchedule.update({
        ...query,
        where: { id: args.id },
        data: {
          invoiceNumber: args.invoiceNumber,
          invoiceDate: new Date(),
          dueDate: args.dueDate,
          status: 'invoiced',
        },
      }),
  }),
)

builder.mutationField('recordHirePayment', (t) =>
  t.prismaField({
    type: 'HirePaymentSchedule',
    args: {
      id: t.arg.string({ required: true }),
      paidAmount: t.arg.float({ required: true }),
      paidDate: t.arg({ type: 'DateTime', required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.hirePaymentSchedule.update({
        ...query,
        where: { id: args.id },
        data: {
          paidAmount: args.paidAmount,
          paidDate: args.paidDate,
          status: 'paid',
        },
      }),
  }),
)

builder.mutationField('disputeHirePayment', (t) =>
  t.prismaField({
    type: 'HirePaymentSchedule',
    args: {
      id: t.arg.string({ required: true }),
      notes: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.hirePaymentSchedule.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'disputed',
          notes: args.notes,
        },
      }),
  }),
)
