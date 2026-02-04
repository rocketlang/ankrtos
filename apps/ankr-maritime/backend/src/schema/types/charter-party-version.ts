import { builder } from '../builder.js'

// === Charter Party Version ===
builder.prismaObject('CharterPartyVersion', {
  fields: (t) => ({
    id: t.exposeID('id'),
    charterPartyId: t.exposeString('charterPartyId'),
    versionNumber: t.exposeInt('versionNumber'),
    content: t.exposeString('content'),
    changedBy: t.exposeString('changedBy'),
    changeReason: t.exposeString('changeReason', { nullable: true }),
    clausesChanged: t.exposeStringList('clausesChanged'),
    diffFromPrevious: t.expose('diffFromPrevious', { type: 'JSON', nullable: true }),
    status: t.exposeString('status'),
    charterParty: t.relation('charterParty'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
})

// === Custom comparison result ===
const ComparisonResult = builder.objectRef<{
  versionA: number
  versionB: number
  addedClauses: string[]
  removedClauses: string[]
  modifiedSections: string[]
}>('ComparisonResult')

ComparisonResult.implement({
  fields: (t) => ({
    versionA: t.exposeInt('versionA'),
    versionB: t.exposeInt('versionB'),
    addedClauses: t.exposeStringList('addedClauses'),
    removedClauses: t.exposeStringList('removedClauses'),
    modifiedSections: t.exposeStringList('modifiedSections'),
  }),
})

// === Queries ===

builder.queryField('charterPartyVersions', (t) =>
  t.prismaField({
    type: ['CharterPartyVersion'],
    args: { charterPartyId: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.charterPartyVersion.findMany({
        ...query,
        where: { charterPartyId: args.charterPartyId },
        orderBy: { versionNumber: 'desc' },
      }),
  }),
)

builder.queryField('charterPartyVersion', (t) =>
  t.prismaField({
    type: 'CharterPartyVersion',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.charterPartyVersion.findUnique({
        ...query,
        where: { id: args.id },
      }),
  }),
)

builder.queryField('compareCharterPartyVersions', (t) =>
  t.field({
    type: ComparisonResult,
    args: {
      versionAId: t.arg.string({ required: true }),
      versionBId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const [vA, vB] = await Promise.all([
        ctx.prisma.charterPartyVersion.findUniqueOrThrow({ where: { id: args.versionAId } }),
        ctx.prisma.charterPartyVersion.findUniqueOrThrow({ where: { id: args.versionBId } }),
      ])

      const clausesA = new Set(vA.clausesChanged)
      const clausesB = new Set(vB.clausesChanged)

      const addedClauses = vB.clausesChanged.filter((c) => !clausesA.has(c))
      const removedClauses = vA.clausesChanged.filter((c) => !clausesB.has(c))

      // Compute modified sections by comparing content sections
      const sectionsA = vA.content.split('\n\n').map((s) => s.trim()).filter(Boolean)
      const sectionsB = vB.content.split('\n\n').map((s) => s.trim()).filter(Boolean)
      const setA = new Set(sectionsA)
      const setB = new Set(sectionsB)
      const modifiedSections: string[] = []
      for (const section of sectionsB) {
        if (!setA.has(section)) {
          const preview = section.substring(0, 80)
          modifiedSections.push(preview)
        }
      }
      for (const section of sectionsA) {
        if (!setB.has(section)) {
          const preview = section.substring(0, 80)
          if (!modifiedSections.includes(preview)) modifiedSections.push(preview)
        }
      }

      return {
        versionA: vA.versionNumber,
        versionB: vB.versionNumber,
        addedClauses,
        removedClauses,
        modifiedSections,
      }
    },
  }),
)

// === Mutations ===

builder.mutationField('createCharterPartyVersion', (t) =>
  t.prismaField({
    type: 'CharterPartyVersion',
    args: {
      charterPartyId: t.arg.string({ required: true }),
      content: t.arg.string({ required: true }),
      changeReason: t.arg.string(),
      clausesChanged: t.arg.stringList({ required: false }),
    },
    resolve: async (query, _root, args, ctx) => {
      if (!ctx.user) throw new Error('Not authenticated')

      // Find the latest version to auto-increment
      const latest = await ctx.prisma.charterPartyVersion.findMany({
        where: { charterPartyId: args.charterPartyId },
        orderBy: { versionNumber: 'desc' },
        take: 1,
      })

      const nextVersion = (latest[0]?.versionNumber ?? 0) + 1

      // Compute diff from previous version
      let diffFromPrevious: Record<string, unknown> | null = null
      if (latest[0]) {
        const prevSections = latest[0].content.split('\n\n').map((s) => s.trim()).filter(Boolean)
        const newSections = args.content.split('\n\n').map((s) => s.trim()).filter(Boolean)
        const prevSet = new Set(prevSections)
        const newSet = new Set(newSections)

        const added = newSections.filter((s) => !prevSet.has(s)).map((s) => s.substring(0, 120))
        const removed = prevSections.filter((s) => !newSet.has(s)).map((s) => s.substring(0, 120))

        diffFromPrevious = {
          added,
          removed,
          modified: args.clausesChanged ?? [],
          prevLength: latest[0].content.length,
          newLength: args.content.length,
          sectionCountChange: newSections.length - prevSections.length,
        }

        // Mark previous version as superseded
        await ctx.prisma.charterPartyVersion.update({
          where: { id: latest[0].id },
          data: { status: 'superseded' },
        })
      }

      return ctx.prisma.charterPartyVersion.create({
        ...query,
        data: {
          charterPartyId: args.charterPartyId,
          versionNumber: nextVersion,
          content: args.content,
          changedBy: ctx.user.id,
          changeReason: args.changeReason ?? undefined,
          clausesChanged: args.clausesChanged ?? [],
          diffFromPrevious: diffFromPrevious ?? undefined,
        },
      })
    },
  }),
)
