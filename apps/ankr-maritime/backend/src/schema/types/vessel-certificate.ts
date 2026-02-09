import { builder } from '../builder.js'
import { prisma } from '../context.js'

// === VesselCertificate prismaObject ===

builder.prismaObject('VesselCertificate', {
  fields: (t) => ({
    id: t.exposeID('id'),
    vesselId: t.exposeString('vesselId'),
    name: t.string({
      // Alias for vessel name - convenience field
      resolve: async (parent) => {
        const vessel = await prisma.vessel.findUnique({
          where: { id: parent.vesselId },
          select: { name: true },
        });
        return vessel?.name || '';
      },
    }),
    certificateType: t.exposeString('certificateType'),
    certificateNumber: t.exposeString('certificateNumber', { nullable: true }),
    issuedBy: t.exposeString('issuedBy', { nullable: true }),
    issuedDate: t.expose('issuedDate', { type: 'DateTime', nullable: true }),
    expiryDate: t.expose('expiryDate', { type: 'DateTime', nullable: true }),
    lastSurveyDate: t.expose('lastSurveyDate', { type: 'DateTime', nullable: true }),
    nextSurveyDue: t.expose('nextSurveyDue', { type: 'DateTime', nullable: true }),
    status: t.exposeString('status'),
    documentUrl: t.exposeString('documentUrl', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    vessel: t.relation('vessel'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})

// === Queries ===

builder.queryField('vesselCertificates', (t) =>
  t.prismaField({
    type: ['VesselCertificate'],
    args: {
      vesselId: t.arg.string({ required: false }), // Made optional for dashboard
      certificateType: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = {}
      if (args.vesselId) {
        where.vesselId = args.vesselId
      } else if (ctx.user?.organizationId) {
        // If no vesselId, filter by organization
        where.vessel = { organizationId: ctx.user.organizationId }
      }
      if (args.certificateType) where.certificateType = args.certificateType
      return prisma.vesselCertificate.findMany({
        ...query,
        where,
        orderBy: { expiryDate: 'asc' },
      })
    },
  }),
)

builder.queryField('vesselCertificate', (t) =>
  t.prismaField({
    type: 'VesselCertificate',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args) =>
      prisma.vesselCertificate.findUnique({ ...query, where: { id: args.id } }),
  }),
)

// === Certificate Expiry Dashboard custom types ===

const CertificateExpiryItem = builder.objectRef<{
  id: string
  certificateType: string
  certificateNumber: string | null
  issuedBy: string | null
  expiryDate: string | null
  daysUntilExpiry: number | null
  status: string
  vesselId: string
  vesselName: string
}>('CertificateExpiryItem')

CertificateExpiryItem.implement({
  fields: (t) => ({
    id: t.exposeString('id'),
    certificateType: t.exposeString('certificateType'),
    certificateNumber: t.exposeString('certificateNumber', { nullable: true }),
    issuedBy: t.exposeString('issuedBy', { nullable: true }),
    expiryDate: t.exposeString('expiryDate', { nullable: true }),
    daysUntilExpiry: t.exposeInt('daysUntilExpiry', { nullable: true }),
    status: t.exposeString('status'),
    vesselId: t.exposeString('vesselId'),
    vesselName: t.exposeString('vesselName'),
  }),
})

const CertificateExpiryDashboardType = builder.objectRef<{
  valid: Array<{
    id: string
    certificateType: string
    certificateNumber: string | null
    issuedBy: string | null
    expiryDate: string | null
    daysUntilExpiry: number | null
    status: string
    vesselId: string
    vesselName: string
  }>
  expiringSoon: Array<{
    id: string
    certificateType: string
    certificateNumber: string | null
    issuedBy: string | null
    expiryDate: string | null
    daysUntilExpiry: number | null
    status: string
    vesselId: string
    vesselName: string
  }>
  expired: Array<{
    id: string
    certificateType: string
    certificateNumber: string | null
    issuedBy: string | null
    expiryDate: string | null
    daysUntilExpiry: number | null
    status: string
    vesselId: string
    vesselName: string
  }>
}>('CertificateExpiryDashboard')

CertificateExpiryDashboardType.implement({
  fields: (t) => ({
    valid: t.field({
      type: [CertificateExpiryItem],
      resolve: (parent) => parent.valid,
    }),
    expiringSoon: t.field({
      type: [CertificateExpiryItem],
      resolve: (parent) => parent.expiringSoon,
    }),
    expired: t.field({
      type: [CertificateExpiryItem],
      resolve: (parent) => parent.expired,
    }),
  }),
})

builder.queryField('certificateExpiryDashboard', (t) =>
  t.field({
    type: CertificateExpiryDashboardType,
    args: { vesselId: t.arg.string() },
    resolve: async (_root, args) => {
      const where: Record<string, unknown> = {}
      if (args.vesselId) where.vesselId = args.vesselId

      const certs = await prisma.vesselCertificate.findMany({
        where,
        include: { vessel: true },
        orderBy: { expiryDate: 'asc' },
      })

      const now = new Date()
      const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000

      const valid: typeof result.valid = []
      const expiringSoon: typeof result.expiringSoon = []
      const expired: typeof result.expired = []

      for (const cert of certs) {
        const daysUntilExpiry = cert.expiryDate
          ? Math.ceil((cert.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null

        const item = {
          id: cert.id,
          certificateType: cert.certificateType,
          certificateNumber: cert.certificateNumber,
          issuedBy: cert.issuedBy,
          expiryDate: cert.expiryDate ? cert.expiryDate.toISOString() : null,
          daysUntilExpiry,
          status: cert.status,
          vesselId: cert.vesselId,
          vesselName: cert.vessel.name,
        }

        if (cert.status === 'expired' || (daysUntilExpiry !== null && daysUntilExpiry < 0)) {
          expired.push(item)
        } else if (daysUntilExpiry !== null && cert.expiryDate && cert.expiryDate.getTime() - now.getTime() <= ninetyDaysMs) {
          expiringSoon.push(item)
        } else {
          valid.push(item)
        }
      }

      const result = { valid, expiringSoon, expired }
      return result
    },
  }),
)

// === Mutations ===

builder.mutationField('createVesselCertificate', (t) =>
  t.prismaField({
    type: 'VesselCertificate',
    args: {
      vesselId: t.arg.string({ required: true }),
      certificateType: t.arg.string({ required: true }),
      certificateNumber: t.arg.string(),
      issuedBy: t.arg.string(),
      issuedDate: t.arg({ type: 'DateTime' }),
      expiryDate: t.arg({ type: 'DateTime' }),
      lastSurveyDate: t.arg({ type: 'DateTime' }),
      nextSurveyDue: t.arg({ type: 'DateTime' }),
      documentUrl: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args) =>
      prisma.vesselCertificate.create({
        ...query,
        data: {
          vesselId: args.vesselId,
          certificateType: args.certificateType,
          certificateNumber: args.certificateNumber ?? undefined,
          issuedBy: args.issuedBy ?? undefined,
          issuedDate: args.issuedDate ?? undefined,
          expiryDate: args.expiryDate ?? undefined,
          lastSurveyDate: args.lastSurveyDate ?? undefined,
          nextSurveyDue: args.nextSurveyDue ?? undefined,
          documentUrl: args.documentUrl ?? undefined,
          notes: args.notes ?? undefined,
        },
      }),
  }),
)

builder.mutationField('updateVesselCertificate', (t) =>
  t.prismaField({
    type: 'VesselCertificate',
    args: {
      id: t.arg.string({ required: true }),
      certificateType: t.arg.string(),
      certificateNumber: t.arg.string(),
      issuedBy: t.arg.string(),
      issuedDate: t.arg({ type: 'DateTime' }),
      expiryDate: t.arg({ type: 'DateTime' }),
      lastSurveyDate: t.arg({ type: 'DateTime' }),
      nextSurveyDue: t.arg({ type: 'DateTime' }),
      status: t.arg.string(),
      documentUrl: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args) =>
      prisma.vesselCertificate.update({
        ...query,
        where: { id: args.id },
        data: {
          ...(args.certificateType && { certificateType: args.certificateType }),
          ...(args.certificateNumber !== undefined && args.certificateNumber !== null && { certificateNumber: args.certificateNumber }),
          ...(args.issuedBy !== undefined && args.issuedBy !== null && { issuedBy: args.issuedBy }),
          ...(args.issuedDate != null && { issuedDate: args.issuedDate }),
          ...(args.expiryDate != null && { expiryDate: args.expiryDate }),
          ...(args.lastSurveyDate != null && { lastSurveyDate: args.lastSurveyDate }),
          ...(args.nextSurveyDue != null && { nextSurveyDue: args.nextSurveyDue }),
          ...(args.status && { status: args.status }),
          ...(args.documentUrl !== undefined && args.documentUrl !== null && { documentUrl: args.documentUrl }),
          ...(args.notes !== undefined && args.notes !== null && { notes: args.notes }),
        },
      }),
  }),
)

builder.mutationField('renewVesselCertificate', (t) =>
  t.prismaField({
    type: 'VesselCertificate',
    args: {
      id: t.arg.string({ required: true }),
      newExpiryDate: t.arg({ type: 'DateTime', required: true }),
      newCertificateNumber: t.arg.string(),
      documentUrl: t.arg.string(),
    },
    resolve: (query, _root, args) =>
      prisma.vesselCertificate.update({
        ...query,
        where: { id: args.id },
        data: {
          expiryDate: args.newExpiryDate,
          status: 'valid',
          lastSurveyDate: new Date(),
          ...(args.newCertificateNumber && { certificateNumber: args.newCertificateNumber }),
          ...(args.documentUrl && { documentUrl: args.documentUrl }),
        },
      }),
  }),
)
