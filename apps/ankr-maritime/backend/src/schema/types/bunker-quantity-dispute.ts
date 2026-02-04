import { builder } from '../builder.js'

// === Bunker Quantity Dispute ===
builder.prismaObject('BunkerQuantityDispute', {
  fields: (t) => ({
    id: t.exposeID('id'),
    organizationId: t.exposeString('organizationId'),
    vesselId: t.exposeString('vesselId'),
    voyageId: t.exposeString('voyageId', { nullable: true }),
    portName: t.exposeString('portName'),
    fuelType: t.exposeString('fuelType'),
    deliveredQtyMt: t.exposeFloat('deliveredQtyMt'),
    claimedQtyMt: t.exposeFloat('claimedQtyMt'),
    discrepancyMt: t.exposeFloat('discrepancyMt'),
    discrepancyPct: t.exposeFloat('discrepancyPct'),
    unitPrice: t.exposeFloat('unitPrice'),
    disputeValueUsd: t.exposeFloat('disputeValueUsd'),
    supplierName: t.exposeString('supplierName', { nullable: true }),
    status: t.exposeString('status'),
    resolution: t.exposeString('resolution', { nullable: true }),
    creditAmount: t.exposeFloat('creditAmount', { nullable: true }),
    surveyorReport: t.exposeString('surveyorReport', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    organization: t.relation('organization'),
    vessel: t.relation('vessel'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})

// === Custom summary type ===
const BunkerDisputeSummaryType = builder.objectRef<{
  totalOpen: number
  totalSettled: number
  totalDisputeValue: number
  avgDiscrepancyPct: number
}>('BunkerDisputeSummary')

BunkerDisputeSummaryType.implement({
  fields: (t) => ({
    totalOpen: t.exposeInt('totalOpen'),
    totalSettled: t.exposeInt('totalSettled'),
    totalDisputeValue: t.exposeFloat('totalDisputeValue'),
    avgDiscrepancyPct: t.exposeFloat('avgDiscrepancyPct'),
  }),
})

// === Queries ===

builder.queryField('bunkerQuantityDisputes', (t) =>
  t.prismaField({
    type: ['BunkerQuantityDispute'],
    args: {
      status: t.arg.string(),
      vesselId: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = {}
      if (args.status) where.status = args.status
      if (args.vesselId) where.vesselId = args.vesselId
      const orgId = ctx.user?.organizationId
      if (orgId) where.organizationId = orgId

      return ctx.prisma.bunkerQuantityDispute.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      })
    },
  }),
)

builder.queryField('bunkerQuantityDispute', (t) =>
  t.prismaField({
    type: 'BunkerQuantityDispute',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.bunkerQuantityDispute.findUnique({
        ...query,
        where: { id: args.id },
      }),
  }),
)

builder.queryField('bunkerDisputeSummary', (t) =>
  t.field({
    type: BunkerDisputeSummaryType,
    resolve: async (_root, _args, ctx) => {
      const orgId = ctx.user?.organizationId
      const disputes = await ctx.prisma.bunkerQuantityDispute.findMany({
        where: orgId ? { organizationId: orgId } : {},
      })

      let totalOpen = 0
      let totalSettled = 0
      let totalDisputeValue = 0
      let totalPct = 0

      for (const d of disputes) {
        totalDisputeValue += d.disputeValueUsd
        totalPct += Math.abs(d.discrepancyPct)
        if (['open', 'investigation', 'negotiation'].includes(d.status)) totalOpen++
        if (['settled', 'closed'].includes(d.status)) totalSettled++
      }

      return {
        totalOpen,
        totalSettled,
        totalDisputeValue: Math.round(totalDisputeValue * 100) / 100,
        avgDiscrepancyPct: disputes.length > 0
          ? Math.round((totalPct / disputes.length) * 100) / 100
          : 0,
      }
    },
  }),
)

// === Mutations ===

builder.mutationField('createBunkerQuantityDispute', (t) =>
  t.prismaField({
    type: 'BunkerQuantityDispute',
    args: {
      vesselId: t.arg.string({ required: true }),
      voyageId: t.arg.string(),
      portName: t.arg.string({ required: true }),
      fuelType: t.arg.string({ required: true }),
      deliveredQtyMt: t.arg.float({ required: true }),
      claimedQtyMt: t.arg.float({ required: true }),
      unitPrice: t.arg.float({ required: true }),
      supplierName: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId()

      // Auto-calculate discrepancy values
      const discrepancyMt = args.deliveredQtyMt - args.claimedQtyMt
      const discrepancyPct = args.deliveredQtyMt !== 0
        ? Math.round(((discrepancyMt / args.deliveredQtyMt) * 100) * 100) / 100
        : 0
      const disputeValueUsd = Math.round(Math.abs(discrepancyMt) * args.unitPrice * 100) / 100

      return ctx.prisma.bunkerQuantityDispute.create({
        ...query,
        data: {
          organizationId: orgId,
          vesselId: args.vesselId,
          voyageId: args.voyageId ?? undefined,
          portName: args.portName,
          fuelType: args.fuelType,
          deliveredQtyMt: args.deliveredQtyMt,
          claimedQtyMt: args.claimedQtyMt,
          discrepancyMt,
          discrepancyPct,
          unitPrice: args.unitPrice,
          disputeValueUsd,
          supplierName: args.supplierName ?? undefined,
        },
      })
    },
  }),
)

builder.mutationField('updateDisputeStatus', (t) =>
  t.prismaField({
    type: 'BunkerQuantityDispute',
    args: {
      id: t.arg.string({ required: true }),
      status: t.arg.string({ required: true }),
      resolution: t.arg.string(),
      creditAmount: t.arg.float(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const data: Record<string, unknown> = { status: args.status }
      if (args.resolution) data.resolution = args.resolution
      if (args.creditAmount != null) data.creditAmount = args.creditAmount
      if (args.notes) data.notes = args.notes

      return ctx.prisma.bunkerQuantityDispute.update({
        ...query,
        where: { id: args.id },
        data,
      })
    },
  }),
)

builder.mutationField('closeDispute', (t) =>
  t.prismaField({
    type: 'BunkerQuantityDispute',
    args: {
      id: t.arg.string({ required: true }),
      resolution: t.arg.string({ required: true }),
      creditAmount: t.arg.float(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.bunkerQuantityDispute.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'closed',
          resolution: args.resolution,
          creditAmount: args.creditAmount ?? undefined,
        },
      }),
  }),
)
