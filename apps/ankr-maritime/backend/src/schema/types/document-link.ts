import { builder } from '../builder.js'

builder.prismaObject('DocumentLink', {
  fields: (t) => ({
    id: t.exposeID('id'),
    organizationId: t.exposeString('organizationId'),
    sourceDocType: t.exposeString('sourceDocType'),
    sourceDocId: t.exposeString('sourceDocId'),
    targetDocType: t.exposeString('targetDocType'),
    targetDocId: t.exposeString('targetDocId'),
    linkType: t.exposeString('linkType'),
    description: t.exposeString('description', { nullable: true }),
    createdBy: t.exposeString('createdBy', { nullable: true }),
    organization: t.relation('organization'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
})

// === Custom graph types ===

const DocumentGraphNode = builder.objectRef<{
  docType: string
  docId: string
  linkType: string
  description: string | null
  depth: number
}>('DocumentGraphNode')

DocumentGraphNode.implement({
  fields: (t) => ({
    docType: t.exposeString('docType'),
    docId: t.exposeString('docId'),
    linkType: t.exposeString('linkType'),
    description: t.exposeString('description', { nullable: true }),
    depth: t.exposeInt('depth'),
  }),
})

// === Queries ===

builder.queryField('documentLinks', (t) =>
  t.prismaField({
    type: ['DocumentLink'],
    args: {
      sourceDocType: t.arg.string(),
      sourceDocId: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() }
      if (args.sourceDocType) where.sourceDocType = args.sourceDocType
      if (args.sourceDocId) where.sourceDocId = args.sourceDocId
      return ctx.prisma.documentLink.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      })
    },
  }),
)

builder.queryField('relatedDocuments', (t) =>
  t.prismaField({
    type: ['DocumentLink'],
    args: {
      docType: t.arg.string({ required: true }),
      docId: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.documentLink.findMany({
        ...query,
        where: {
          ...ctx.orgFilter(),
          OR: [
            { sourceDocType: args.docType, sourceDocId: args.docId },
            { targetDocType: args.docType, targetDocId: args.docId },
          ],
        },
        orderBy: { createdAt: 'desc' },
      }),
  }),
)

builder.queryField('documentLinkGraph', (t) =>
  t.field({
    type: [DocumentGraphNode],
    args: {
      docType: t.arg.string({ required: true }),
      docId: t.arg.string({ required: true }),
      depth: t.arg.int(),
    },
    resolve: async (_root, args, ctx) => {
      const maxDepth = args.depth ?? 2
      const orgFilter = ctx.orgFilter()
      const visited = new Set<string>()
      const nodes: Array<{
        docType: string
        docId: string
        linkType: string
        description: string | null
        depth: number
      }> = []

      // BFS traversal
      let frontier = [{ docType: args.docType, docId: args.docId }]
      visited.add(`${args.docType}:${args.docId}`)

      for (let d = 1; d <= maxDepth && frontier.length > 0; d++) {
        const nextFrontier: Array<{ docType: string; docId: string }> = []

        for (const node of frontier) {
          const links = await ctx.prisma.documentLink.findMany({
            where: {
              ...orgFilter,
              OR: [
                { sourceDocType: node.docType, sourceDocId: node.docId },
                { targetDocType: node.docType, targetDocId: node.docId },
              ],
            },
          })

          for (const link of links) {
            // Determine the "other" end of the link
            const isSource = link.sourceDocType === node.docType && link.sourceDocId === node.docId
            const otherType = isSource ? link.targetDocType : link.sourceDocType
            const otherId = isSource ? link.targetDocId : link.sourceDocId
            const key = `${otherType}:${otherId}`

            if (!visited.has(key)) {
              visited.add(key)
              nodes.push({
                docType: otherType,
                docId: otherId,
                linkType: link.linkType,
                description: link.description,
                depth: d,
              })
              nextFrontier.push({ docType: otherType, docId: otherId })
            }
          }
        }

        frontier = nextFrontier
      }

      return nodes
    },
  }),
)

// === Mutations ===

builder.mutationField('createDocumentLink', (t) =>
  t.prismaField({
    type: 'DocumentLink',
    args: {
      sourceDocType: t.arg.string({ required: true }),
      sourceDocId: t.arg.string({ required: true }),
      targetDocType: t.arg.string({ required: true }),
      targetDocId: t.arg.string({ required: true }),
      linkType: t.arg.string({ required: true }),
      description: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.documentLink.create({
        ...query,
        data: {
          organizationId: ctx.orgId(),
          sourceDocType: args.sourceDocType,
          sourceDocId: args.sourceDocId,
          targetDocType: args.targetDocType,
          targetDocId: args.targetDocId,
          linkType: args.linkType,
          description: args.description ?? undefined,
        },
      }),
  }),
)

builder.mutationField('deleteDocumentLink', (t) =>
  t.prismaField({
    type: 'DocumentLink',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.documentLink.delete({ ...query, where: { id: args.id } }),
  }),
)
