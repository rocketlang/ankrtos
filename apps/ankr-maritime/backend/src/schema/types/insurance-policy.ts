import { builder } from '../builder.js'
import { prisma } from '../context.js'

// === InsurancePolicy prismaObject ===

builder.prismaObject('InsurancePolicy', {
  fields: (t) => ({
    id: t.exposeID('id'),
    organizationId: t.exposeString('organizationId'),
    vesselId: t.exposeString('vesselId', { nullable: true }),
    policyType: t.exposeString('policyType'),
    policyNumber: t.exposeString('policyNumber', { nullable: true }),
    insurer: t.exposeString('insurer'),
    broker: t.exposeString('broker', { nullable: true }),
    insuredValue: t.exposeFloat('insuredValue'),
    deductible: t.exposeFloat('deductible'),
    premiumAnnual: t.exposeFloat('premiumAnnual'),
    currency: t.exposeString('currency'),
    inceptionDate: t.expose('inceptionDate', { type: 'DateTime' }),
    expiryDate: t.expose('expiryDate', { type: 'DateTime' }),
    status: t.exposeString('status'),
    coverageDetails: t.exposeString('coverageDetails', { nullable: true }),
    exclusions: t.exposeString('exclusions', { nullable: true }),
    renewalReminder: t.exposeBoolean('renewalReminder'),
    notes: t.exposeString('notes', { nullable: true }),
    organization: t.relation('organization'),
    vessel: t.relation('vessel', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})

// === Queries ===

builder.queryField('insurancePolicies', (t) =>
  t.prismaField({
    type: ['InsurancePolicy'],
    args: {
      organizationId: t.arg.string(),
      vesselId: t.arg.string(),
      policyType: t.arg.string(),
      status: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = {}
      if (args.organizationId) {
        where.organizationId = args.organizationId
      } else {
        const orgFilter = ctx.orgFilter()
        if (orgFilter.organizationId) where.organizationId = orgFilter.organizationId
      }
      if (args.vesselId) where.vesselId = args.vesselId
      if (args.policyType) where.policyType = args.policyType
      if (args.status) where.status = args.status
      return prisma.insurancePolicy.findMany({
        ...query,
        where,
        orderBy: { expiryDate: 'asc' },
      })
    },
  }),
)

builder.queryField('insurancePolicy', (t) =>
  t.prismaField({
    type: 'InsurancePolicy',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args) =>
      prisma.insurancePolicy.findUnique({ ...query, where: { id: args.id } }),
  }),
)

// === Insurance Summary custom types ===

const InsuranceSummaryByType = builder.objectRef<{
  type: string
  count: number
  totalValue: number
}>('InsuranceSummaryByType')

InsuranceSummaryByType.implement({
  fields: (t) => ({
    type: t.exposeString('type'),
    count: t.exposeInt('count'),
    totalValue: t.exposeFloat('totalValue'),
  }),
})

const InsuranceSummaryType = builder.objectRef<{
  totalPolicies: number
  totalInsuredValue: number
  totalAnnualPremium: number
  byType: Array<{ type: string; count: number; totalValue: number }>
  expiringIn90Days: number
}>('InsuranceSummary')

InsuranceSummaryType.implement({
  fields: (t) => ({
    totalPolicies: t.exposeInt('totalPolicies'),
    totalInsuredValue: t.exposeFloat('totalInsuredValue'),
    totalAnnualPremium: t.exposeFloat('totalAnnualPremium'),
    byType: t.field({
      type: [InsuranceSummaryByType],
      resolve: (parent) => parent.byType,
    }),
    expiringIn90Days: t.exposeInt('expiringIn90Days'),
  }),
})

builder.queryField('insuranceSummary', (t) =>
  t.field({
    type: InsuranceSummaryType,
    resolve: async (_root, _args, ctx) => {
      const orgFilter = ctx.orgFilter()
      const policies = await prisma.insurancePolicy.findMany({
        where: {
          ...orgFilter,
          status: { not: 'cancelled' },
        },
      })

      const totalPolicies = policies.length
      const totalInsuredValue = policies.reduce((sum, p) => sum + p.insuredValue, 0)
      const totalAnnualPremium = policies.reduce((sum, p) => sum + p.premiumAnnual, 0)

      // Group by type
      const typeMap = new Map<string, { count: number; totalValue: number }>()
      for (const p of policies) {
        const existing = typeMap.get(p.policyType)
        if (existing) {
          existing.count += 1
          existing.totalValue += p.insuredValue
        } else {
          typeMap.set(p.policyType, { count: 1, totalValue: p.insuredValue })
        }
      }
      const byType = Array.from(typeMap.entries()).map(([type, data]) => ({
        type,
        count: data.count,
        totalValue: Math.round(data.totalValue * 100) / 100,
      }))

      // Count policies expiring within 90 days
      const now = new Date()
      const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
      const expiringIn90Days = policies.filter(
        (p) => p.status === 'active' && p.expiryDate >= now && p.expiryDate <= ninetyDaysFromNow,
      ).length

      return {
        totalPolicies,
        totalInsuredValue: Math.round(totalInsuredValue * 100) / 100,
        totalAnnualPremium: Math.round(totalAnnualPremium * 100) / 100,
        byType,
        expiringIn90Days,
      }
    },
  }),
)

// === Mutations ===

builder.mutationField('createInsurancePolicy', (t) =>
  t.prismaField({
    type: 'InsurancePolicy',
    args: {
      vesselId: t.arg.string(),
      policyType: t.arg.string({ required: true }),
      policyNumber: t.arg.string(),
      insurer: t.arg.string({ required: true }),
      broker: t.arg.string(),
      insuredValue: t.arg.float({ required: true }),
      deductible: t.arg.float(),
      premiumAnnual: t.arg.float({ required: true }),
      currency: t.arg.string(),
      inceptionDate: t.arg({ type: 'DateTime', required: true }),
      expiryDate: t.arg({ type: 'DateTime', required: true }),
      coverageDetails: t.arg.string(),
      exclusions: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      prisma.insurancePolicy.create({
        ...query,
        data: {
          organizationId: ctx.orgId(),
          vesselId: args.vesselId ?? undefined,
          policyType: args.policyType,
          policyNumber: args.policyNumber ?? undefined,
          insurer: args.insurer,
          broker: args.broker ?? undefined,
          insuredValue: args.insuredValue,
          deductible: args.deductible ?? 0,
          premiumAnnual: args.premiumAnnual,
          currency: args.currency ?? 'USD',
          inceptionDate: args.inceptionDate,
          expiryDate: args.expiryDate,
          coverageDetails: args.coverageDetails ?? undefined,
          exclusions: args.exclusions ?? undefined,
          notes: args.notes ?? undefined,
        },
      }),
  }),
)

builder.mutationField('updateInsurancePolicy', (t) =>
  t.prismaField({
    type: 'InsurancePolicy',
    args: {
      id: t.arg.string({ required: true }),
      policyType: t.arg.string(),
      policyNumber: t.arg.string(),
      insurer: t.arg.string(),
      broker: t.arg.string(),
      insuredValue: t.arg.float(),
      deductible: t.arg.float(),
      premiumAnnual: t.arg.float(),
      currency: t.arg.string(),
      inceptionDate: t.arg({ type: 'DateTime' }),
      expiryDate: t.arg({ type: 'DateTime' }),
      status: t.arg.string(),
      coverageDetails: t.arg.string(),
      exclusions: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args) =>
      prisma.insurancePolicy.update({
        ...query,
        where: { id: args.id },
        data: {
          ...(args.policyType && { policyType: args.policyType }),
          ...(args.policyNumber !== undefined && args.policyNumber !== null && { policyNumber: args.policyNumber }),
          ...(args.insurer && { insurer: args.insurer }),
          ...(args.broker !== undefined && args.broker !== null && { broker: args.broker }),
          ...(args.insuredValue != null && { insuredValue: args.insuredValue }),
          ...(args.deductible != null && { deductible: args.deductible }),
          ...(args.premiumAnnual != null && { premiumAnnual: args.premiumAnnual }),
          ...(args.currency && { currency: args.currency }),
          ...(args.inceptionDate != null && { inceptionDate: args.inceptionDate }),
          ...(args.expiryDate != null && { expiryDate: args.expiryDate }),
          ...(args.status && { status: args.status }),
          ...(args.coverageDetails !== undefined && args.coverageDetails !== null && { coverageDetails: args.coverageDetails }),
          ...(args.exclusions !== undefined && args.exclusions !== null && { exclusions: args.exclusions }),
          ...(args.notes !== undefined && args.notes !== null && { notes: args.notes }),
        },
      }),
  }),
)

builder.mutationField('renewInsurancePolicy', (t) =>
  t.prismaField({
    type: 'InsurancePolicy',
    args: {
      id: t.arg.string({ required: true }),
      newInceptionDate: t.arg({ type: 'DateTime', required: true }),
      newExpiryDate: t.arg({ type: 'DateTime', required: true }),
      newPremiumAnnual: t.arg.float(),
      newPolicyNumber: t.arg.string(),
    },
    resolve: (query, _root, args) =>
      prisma.insurancePolicy.update({
        ...query,
        where: { id: args.id },
        data: {
          inceptionDate: args.newInceptionDate,
          expiryDate: args.newExpiryDate,
          status: 'active',
          ...(args.newPremiumAnnual != null && { premiumAnnual: args.newPremiumAnnual }),
          ...(args.newPolicyNumber && { policyNumber: args.newPolicyNumber }),
        },
      }),
  }),
)
