import { builder } from '../builder.js';

builder.prismaObject('Document', {
  fields: (t) => ({
    id: t.exposeID('id'),
    title: t.exposeString('title'),
    category: t.exposeString('category'),
    subcategory: t.exposeString('subcategory', { nullable: true }),
    fileName: t.exposeString('fileName'),
    fileSize: t.exposeInt('fileSize'),
    mimeType: t.exposeString('mimeType'),
    folderId: t.string({
      nullable: true,
      // Folder ID for document organization (maps to category or custom folder)
      resolve: (parent) => parent.category || null,
    }),
    fileHash: t.string({
      nullable: true,
      // SHA256 hash for duplicate detection - computed if needed
      resolve: (parent) => {
        // Return a simple hash based on filename + fileSize as placeholder
        // In production, this should be actual file content hash
        return `${parent.fileName}_${parent.fileSize}`;
      },
    }),
    entityType: t.exposeString('entityType', { nullable: true }),
    entityId: t.exposeString('entityId', { nullable: true }),
    voyageId: t.exposeString('voyageId', { nullable: true }),
    vesselId: t.exposeString('vesselId', { nullable: true }),
    uploadedBy: t.exposeString('uploadedBy', { nullable: true }),
    tags: t.exposeStringList('tags'),
    notes: t.exposeString('notes', { nullable: true }),
    status: t.exposeString('status'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// Queries
builder.queryField('documents', (t) =>
  t.prismaField({
    type: ['Document'],
    args: {
      category: t.arg.string(),
      folderId: t.arg.string(), // Alias for category filter
      entityType: t.arg.string(),
      entityId: t.arg.string(),
      search: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.user?.organizationId;
      // folderId maps to category for now
      const categoryFilter = args.folderId || args.category;

      return ctx.prisma.document.findMany({
        ...query,
        where: {
          ...(orgId ? { organizationId: orgId } : {}),
          status: 'active',
          ...(categoryFilter ? { category: categoryFilter } : {}),
          ...(args.entityType ? { entityType: args.entityType } : {}),
          ...(args.entityId ? { entityId: args.entityId } : {}),
          ...(args.search ? { OR: [
            { title: { contains: args.search, mode: 'insensitive' } },
            { fileName: { contains: args.search, mode: 'insensitive' } },
            { tags: { has: args.search } },
          ] } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });
    },
  }),
);

// Summary by category
const DocCategoryStat = builder.objectRef<{ category: string; count: number }>('DocCategoryStat');
DocCategoryStat.implement({
  fields: (t) => ({
    category: t.exposeString('category'),
    count: t.exposeInt('count'),
  }),
});

const DocumentSummary = builder.objectRef<{
  totalDocuments: number;
  totalSize: number;
  categories: Array<{ category: string; count: number }>;
}>('DocumentSummary');

DocumentSummary.implement({
  fields: (t) => ({
    totalDocuments: t.exposeInt('totalDocuments'),
    totalSize: t.exposeInt('totalSize'),
    categories: t.field({ type: [DocCategoryStat], resolve: (parent) => parent.categories }),
  }),
});

builder.queryField('documentSummary', (t) =>
  t.field({
    type: DocumentSummary,
    resolve: async (_root, _args, ctx) => {
      const orgId = ctx.user?.organizationId;
      const where = { ...(orgId ? { organizationId: orgId } : {}), status: 'active' as const };
      const docs = await ctx.prisma.document.findMany({ where, select: { category: true, fileSize: true } });
      const catMap = new Map<string, number>();
      let totalSize = 0;
      for (const d of docs) {
        catMap.set(d.category, (catMap.get(d.category) ?? 0) + 1);
        totalSize += d.fileSize;
      }
      const categories = Array.from(catMap.entries()).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
      return { totalDocuments: docs.length, totalSize, categories };
    },
  }),
);

// Mutations
builder.mutationField('createDocument', (t) =>
  t.prismaField({
    type: 'Document',
    args: {
      title: t.arg.string({ required: true }),
      category: t.arg.string({ required: true }),
      subcategory: t.arg.string(),
      fileName: t.arg.string({ required: true }),
      fileSize: t.arg.int(),
      mimeType: t.arg.string(),
      entityType: t.arg.string(),
      entityId: t.arg.string(),
      voyageId: t.arg.string(),
      vesselId: t.arg.string(),
      tags: t.arg.stringList(),
      notes: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const orgId = ctx.user?.organizationId;
      if (!orgId) throw new Error('Authentication required');

      // Create document
      const document = await ctx.prisma.document.create({
        ...query,
        data: {
          title: args.title,
          category: args.category,
          subcategory: args.subcategory ?? undefined,
          fileName: args.fileName,
          fileSize: args.fileSize ?? 0,
          mimeType: args.mimeType ?? 'application/pdf',
          entityType: args.entityType ?? undefined,
          entityId: args.entityId ?? undefined,
          voyageId: args.voyageId ?? undefined,
          vesselId: args.vesselId ?? undefined,
          uploadedBy: ctx.user?.name ?? undefined,
          tags: args.tags ?? [],
          notes: args.notes ?? undefined,
          organizationId: orgId,
        },
      });

      // Auto-trigger document processing (embedding + extraction) in background
      // Don't await - let it run async
      import('../services/queue/document-queue.js').then(({ queueDocumentProcessing }) => {
        queueDocumentProcessing(document.id, orgId, 'full').catch((err) => {
          console.error(`Failed to queue document ${document.id}:`, err);
        });
      });

      return document;
    },
  }),
);

builder.mutationField('archiveDocument', (t) =>
  t.prismaField({
    type: 'Document',
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.document.update({ ...query, where: { id: args.id }, data: { status: 'archived' } }),
  }),
);
