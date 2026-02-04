import { builder } from '../builder.js'

// === Claim Package ===
builder.prismaObject('ClaimPackage', {
  fields: (t) => ({
    id: t.exposeID('id'),
    claimId: t.exposeString('claimId'),
    packageType: t.exposeString('packageType'),
    status: t.exposeString('status'),
    hasNoticeOfClaim: t.exposeBoolean('hasNoticeOfClaim'),
    hasStatementOfFacts: t.exposeBoolean('hasStatementOfFacts'),
    hasNorDocument: t.exposeBoolean('hasNorDocument'),
    hasLaytimeCalc: t.exposeBoolean('hasLaytimeCalc'),
    hasSurveyReport: t.exposeBoolean('hasSurveyReport'),
    hasWeatherLog: t.exposeBoolean('hasWeatherLog'),
    hasPhotos: t.exposeBoolean('hasPhotos'),
    hasBolCopy: t.exposeBoolean('hasBolCopy'),
    hasCharterPartyCopy: t.exposeBoolean('hasCharterPartyCopy'),
    hasCorrespondence: t.exposeBoolean('hasCorrespondence'),
    totalDocsRequired: t.exposeInt('totalDocsRequired'),
    totalDocsPresent: t.exposeInt('totalDocsPresent'),
    completenessScore: t.exposeFloat('completenessScore'),
    submittedTo: t.exposeString('submittedTo', { nullable: true }),
    submittedAt: t.expose('submittedAt', { type: 'DateTime', nullable: true }),
    acknowledgedAt: t.expose('acknowledgedAt', { type: 'DateTime', nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    claim: t.relation('claim'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})

// === Custom completeness type ===
const ClaimPackageCompletenessItem = builder.objectRef<{
  docType: string
  label: string
  present: boolean
}>('ClaimPackageCompletenessItem')

ClaimPackageCompletenessItem.implement({
  fields: (t) => ({
    docType: t.exposeString('docType'),
    label: t.exposeString('label'),
    present: t.exposeBoolean('present'),
  }),
})

const ClaimPackageCompleteness = builder.objectRef<{
  claimId: string
  documents: { docType: string; label: string; present: boolean }[]
  totalRequired: number
  totalPresent: number
  completenessPercent: number
}>('ClaimPackageCompleteness')

ClaimPackageCompleteness.implement({
  fields: (t) => ({
    claimId: t.exposeString('claimId'),
    documents: t.field({
      type: [ClaimPackageCompletenessItem],
      resolve: (parent) => parent.documents,
    }),
    totalRequired: t.exposeInt('totalRequired'),
    totalPresent: t.exposeInt('totalPresent'),
    completenessPercent: t.exposeFloat('completenessPercent'),
  }),
})

// === Queries ===

builder.queryField('claimPackages', (t) =>
  t.prismaField({
    type: ['ClaimPackage'],
    args: {
      claimId: t.arg.string(),
      status: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = {}
      if (args.claimId) where.claimId = args.claimId
      if (args.status) where.status = args.status

      return ctx.prisma.claimPackage.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      })
    },
  }),
)

builder.queryField('claimPackage', (t) =>
  t.prismaField({
    type: 'ClaimPackage',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.claimPackage.findUnique({
        ...query,
        where: { id: args.id },
      }),
  }),
)

builder.queryField('claimPackageCompleteness', (t) =>
  t.field({
    type: ClaimPackageCompleteness,
    args: { claimId: t.arg.string({ required: true }) },
    resolve: async (_root, args, ctx) => {
      const pkg = await ctx.prisma.claimPackage.findFirst({
        where: { claimId: args.claimId },
        orderBy: { createdAt: 'desc' },
      })

      const docChecklist = [
        { docType: 'noticeOfClaim', label: 'Notice of Claim', present: pkg?.hasNoticeOfClaim ?? false },
        { docType: 'statementOfFacts', label: 'Statement of Facts', present: pkg?.hasStatementOfFacts ?? false },
        { docType: 'norDocument', label: 'Notice of Readiness', present: pkg?.hasNorDocument ?? false },
        { docType: 'laytimeCalc', label: 'Laytime Calculation', present: pkg?.hasLaytimeCalc ?? false },
        { docType: 'surveyReport', label: 'Survey Report', present: pkg?.hasSurveyReport ?? false },
        { docType: 'weatherLog', label: 'Weather Log', present: pkg?.hasWeatherLog ?? false },
        { docType: 'photos', label: 'Photos / Evidence', present: pkg?.hasPhotos ?? false },
        { docType: 'bolCopy', label: 'Bill of Lading Copy', present: pkg?.hasBolCopy ?? false },
        { docType: 'charterPartyCopy', label: 'Charter Party Copy', present: pkg?.hasCharterPartyCopy ?? false },
        { docType: 'correspondence', label: 'Correspondence', present: pkg?.hasCorrespondence ?? false },
      ]

      const totalRequired = docChecklist.length
      const totalPresent = docChecklist.filter((d) => d.present).length
      const completenessPercent = totalRequired > 0
        ? Math.round((totalPresent / totalRequired) * 10000) / 100
        : 0

      return {
        claimId: args.claimId,
        documents: docChecklist,
        totalRequired,
        totalPresent,
        completenessPercent,
      }
    },
  }),
)

// === Helper: doc type to boolean field mapping ===
const DOC_FIELD_MAP: Record<string, string> = {
  noticeOfClaim: 'hasNoticeOfClaim',
  statementOfFacts: 'hasStatementOfFacts',
  norDocument: 'hasNorDocument',
  laytimeCalc: 'hasLaytimeCalc',
  surveyReport: 'hasSurveyReport',
  weatherLog: 'hasWeatherLog',
  photos: 'hasPhotos',
  bolCopy: 'hasBolCopy',
  charterPartyCopy: 'hasCharterPartyCopy',
  correspondence: 'hasCorrespondence',
}

// === Helper: compute completeness from booleans ===
function computeCompleteness(data: Record<string, unknown>): { totalDocsPresent: number; totalDocsRequired: number; completenessScore: number } {
  const fields = Object.values(DOC_FIELD_MAP)
  const totalDocsRequired = fields.length
  let totalDocsPresent = 0
  for (const f of fields) {
    if (data[f] === true) totalDocsPresent++
  }
  const completenessScore = totalDocsRequired > 0
    ? Math.round((totalDocsPresent / totalDocsRequired) * 10000) / 100
    : 0
  return { totalDocsPresent, totalDocsRequired, completenessScore }
}

// === Mutations ===

builder.mutationField('assembleClaimPackage', (t) =>
  t.prismaField({
    type: 'ClaimPackage',
    args: {
      claimId: t.arg.string({ required: true }),
      packageType: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      // Check existing documents and evidence for this claim
      const [documents, evidence] = await Promise.all([
        ctx.prisma.claimDocument.findMany({ where: { claimId: args.claimId } }),
        ctx.prisma.claimEvidence.findMany({ where: { claimId: args.claimId } }),
      ])

      const allTypes = new Set([
        ...documents.map((d) => d.type.toLowerCase()),
        ...evidence.map((e) => e.documentType.toLowerCase()),
      ])

      // Map existing docs to boolean flags
      const hasNoticeOfClaim = allTypes.has('notice_of_claim') || allTypes.has('notice')
      const hasStatementOfFacts = allTypes.has('statement_of_facts') || allTypes.has('sof')
      const hasNorDocument = allTypes.has('nor') || allTypes.has('notice_of_readiness')
      const hasLaytimeCalc = allTypes.has('laytime') || allTypes.has('laytime_calculation')
      const hasSurveyReport = allTypes.has('survey') || allTypes.has('survey_report')
      const hasWeatherLog = allTypes.has('weather') || allTypes.has('weather_log')
      const hasPhotos = allTypes.has('photo') || allTypes.has('photos') || allTypes.has('image')
      const hasBolCopy = allTypes.has('bol') || allTypes.has('bill_of_lading')
      const hasCharterPartyCopy = allTypes.has('charter_party') || allTypes.has('cp')
      const hasCorrespondence = allTypes.has('correspondence') || allTypes.has('email')

      const boolMap: Record<string, boolean> = {
        hasNoticeOfClaim,
        hasStatementOfFacts,
        hasNorDocument,
        hasLaytimeCalc,
        hasSurveyReport,
        hasWeatherLog,
        hasPhotos,
        hasBolCopy,
        hasCharterPartyCopy,
        hasCorrespondence,
      }

      const { totalDocsPresent, totalDocsRequired, completenessScore } = computeCompleteness(boolMap)
      const status = completenessScore >= 100 ? 'complete' : 'assembling'

      return ctx.prisma.claimPackage.create({
        ...query,
        data: {
          claimId: args.claimId,
          packageType: args.packageType,
          status,
          hasNoticeOfClaim,
          hasStatementOfFacts,
          hasNorDocument,
          hasLaytimeCalc,
          hasSurveyReport,
          hasWeatherLog,
          hasPhotos,
          hasBolCopy,
          hasCharterPartyCopy,
          hasCorrespondence,
          totalDocsRequired,
          totalDocsPresent,
          completenessScore,
        },
      })
    },
  }),
)

builder.mutationField('updateClaimPackageDoc', (t) =>
  t.prismaField({
    type: 'ClaimPackage',
    args: {
      id: t.arg.string({ required: true }),
      field: t.arg.string({ required: true }),
      value: t.arg.boolean({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      // Validate the field name
      const boolField = DOC_FIELD_MAP[args.field]
      if (!boolField) throw new Error(`Invalid doc field: ${args.field}. Valid: ${Object.keys(DOC_FIELD_MAP).join(', ')}`)

      // Get current package to recompute completeness
      const current = await ctx.prisma.claimPackage.findUniqueOrThrow({
        where: { id: args.id },
      })

      const currentData: Record<string, unknown> = {
        hasNoticeOfClaim: current.hasNoticeOfClaim,
        hasStatementOfFacts: current.hasStatementOfFacts,
        hasNorDocument: current.hasNorDocument,
        hasLaytimeCalc: current.hasLaytimeCalc,
        hasSurveyReport: current.hasSurveyReport,
        hasWeatherLog: current.hasWeatherLog,
        hasPhotos: current.hasPhotos,
        hasBolCopy: current.hasBolCopy,
        hasCharterPartyCopy: current.hasCharterPartyCopy,
        hasCorrespondence: current.hasCorrespondence,
      }
      currentData[boolField] = args.value

      const { totalDocsPresent, totalDocsRequired, completenessScore } = computeCompleteness(currentData)
      const status = completenessScore >= 100 ? 'complete' : 'assembling'

      return ctx.prisma.claimPackage.update({
        ...query,
        where: { id: args.id },
        data: {
          [boolField]: args.value,
          totalDocsPresent,
          totalDocsRequired,
          completenessScore,
          status: current.status === 'submitted' || current.status === 'acknowledged' ? current.status : status,
        },
      })
    },
  }),
)

builder.mutationField('submitClaimPackage', (t) =>
  t.prismaField({
    type: 'ClaimPackage',
    args: {
      id: t.arg.string({ required: true }),
      submittedTo: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.claimPackage.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'submitted',
          submittedTo: args.submittedTo,
          submittedAt: new Date(),
        },
      }),
  }),
)

builder.mutationField('acknowledgeClaimPackage', (t) =>
  t.prismaField({
    type: 'ClaimPackage',
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.claimPackage.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'acknowledged',
          acknowledgedAt: new Date(),
        },
      }),
  }),
)
