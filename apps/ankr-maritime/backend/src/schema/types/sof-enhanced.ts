import { builder } from '../builder.js'
import { prisma } from '../context.js'

// === Enhanced SOF Queries & Sign-Off Mutations ===
// Note: The base StatementOfFactEntry prismaObject and sofEntries query
// are defined in laytime.ts. This file adds sign-off and dispute features.

// === SOF Sign-Off Status custom type ===

const SofSignOffStatusType = builder.objectRef<{
  totalEntries: number
  vesselSignedCount: number
  agentSignedCount: number
  terminalSignedCount: number
  fullySignedCount: number
  disputedCount: number
}>('SofSignOffStatus')

SofSignOffStatusType.implement({
  fields: (t) => ({
    totalEntries: t.exposeInt('totalEntries'),
    vesselSignedCount: t.exposeInt('vesselSignedCount'),
    agentSignedCount: t.exposeInt('agentSignedCount'),
    terminalSignedCount: t.exposeInt('terminalSignedCount'),
    fullySignedCount: t.exposeInt('fullySignedCount'),
    disputedCount: t.exposeInt('disputedCount'),
  }),
})

builder.queryField('sofSignOffStatus', (t) =>
  t.field({
    type: SofSignOffStatusType,
    args: { laytimeCalculationId: t.arg.string({ required: true }) },
    resolve: async (_root, args) => {
      const entries = await prisma.statementOfFactEntry.findMany({
        where: { laytimeCalculationId: args.laytimeCalculationId },
      })

      const totalEntries = entries.length
      const vesselSignedCount = entries.filter((e) => e.vesselSignOff).length
      const agentSignedCount = entries.filter((e) => e.agentSignOff).length
      const terminalSignedCount = entries.filter((e) => e.terminalSignOff).length
      const fullySignedCount = entries.filter(
        (e) => e.vesselSignOff && e.agentSignOff && e.terminalSignOff,
      ).length
      const disputedCount = entries.filter((e) => e.disputed).length

      return {
        totalEntries,
        vesselSignedCount,
        agentSignedCount,
        terminalSignedCount,
        fullySignedCount,
        disputedCount,
      }
    },
  }),
)

// === Sign-Off Mutations ===

builder.mutationField('vesselSignSof', (t) =>
  t.prismaField({
    type: 'StatementOfFactEntry',
    args: {
      entryId: t.arg.string({ required: true }),
      signedBy: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args) =>
      prisma.statementOfFactEntry.update({
        ...query,
        where: { id: args.entryId },
        data: {
          vesselSignOff: true,
          vesselSignedBy: args.signedBy,
          vesselSignedAt: new Date(),
        },
      }),
  }),
)

builder.mutationField('agentSignSof', (t) =>
  t.prismaField({
    type: 'StatementOfFactEntry',
    args: {
      entryId: t.arg.string({ required: true }),
      signedBy: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args) =>
      prisma.statementOfFactEntry.update({
        ...query,
        where: { id: args.entryId },
        data: {
          agentSignOff: true,
          agentSignedBy: args.signedBy,
          agentSignedAt: new Date(),
        },
      }),
  }),
)

builder.mutationField('terminalSignSof', (t) =>
  t.prismaField({
    type: 'StatementOfFactEntry',
    args: {
      entryId: t.arg.string({ required: true }),
      signedBy: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args) =>
      prisma.statementOfFactEntry.update({
        ...query,
        where: { id: args.entryId },
        data: {
          terminalSignOff: true,
          terminalSignedBy: args.signedBy,
          terminalSignedAt: new Date(),
        },
      }),
  }),
)

builder.mutationField('disputeSofEntry', (t) =>
  t.prismaField({
    type: 'StatementOfFactEntry',
    args: {
      entryId: t.arg.string({ required: true }),
      disputeNotes: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args) =>
      prisma.statementOfFactEntry.update({
        ...query,
        where: { id: args.entryId },
        data: {
          disputed: true,
          disputeNotes: args.disputeNotes,
        },
      }),
  }),
)

builder.mutationField('addSofAttachment', (t) =>
  t.prismaField({
    type: 'StatementOfFactEntry',
    args: {
      entryId: t.arg.string({ required: true }),
      attachmentUrl: t.arg.string({ required: true }),
      attachmentType: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args) =>
      prisma.statementOfFactEntry.update({
        ...query,
        where: { id: args.entryId },
        data: {
          attachmentUrl: args.attachmentUrl,
          attachmentType: args.attachmentType,
        },
      }),
  }),
)
