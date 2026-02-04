import { builder } from '../builder.js';
import maritimeRAG from '../../services/rag/maritime-rag.js';

// === Phase 32: RAG & Knowledge Engine Types ===

// RetrievalMethod enum (for PageIndex router)
const RetrievalMethod = builder.enumType('RetrievalMethod', {
  values: ['AUTO', 'HYBRID', 'PAGEINDEX'] as const,
});

// QueryComplexity enum
const QueryComplexity = builder.enumType('QueryComplexity', {
  values: ['SIMPLE', 'COMPLEX'] as const,
});

// EntityExtraction type
const EntityExtraction = builder.objectRef<{
  vesselNames: string[];
  portNames: string[];
  cargoTypes: string[];
  parties: string[];
}>('EntityExtraction');

EntityExtraction.implement({
  fields: (t) => ({
    vesselNames: t.exposeStringList('vesselNames'),
    portNames: t.exposeStringList('portNames'),
    cargoTypes: t.exposeStringList('cargoTypes'),
    parties: t.exposeStringList('parties'),
  }),
});

// SearchResult type
const SearchResult = builder.objectRef<{
  id: string;
  documentId: string;
  title: string;
  content: string;
  excerpt: string;
  score: number;
  metadata: any;
  entities: {
    vesselNames: string[];
    portNames: string[];
    cargoTypes: string[];
    parties: string[];
  };
  createdAt: Date;
}>('SearchResult');

SearchResult.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    documentId: t.exposeString('documentId'),
    title: t.exposeString('title'),
    content: t.exposeString('content'),
    excerpt: t.exposeString('excerpt'),
    score: t.exposeFloat('score'),
    metadata: t.field({
      type: 'JSON',
      resolve: (parent) => parent.metadata,
    }),
    entities: t.field({
      type: EntityExtraction,
      resolve: (parent) => parent.entities,
    }),
    createdAt: t.field({
      type: 'DateTime',
      resolve: (parent) => parent.createdAt,
    }),
  }),
});

// SourceDocument type
const SourceDocument = builder.objectRef<{
  documentId: string;
  title: string;
  excerpt: string;
  page?: number;
  relevanceScore: number;
}>('SourceDocument');

SourceDocument.implement({
  fields: (t) => ({
    documentId: t.exposeID('documentId'),
    title: t.exposeString('title'),
    excerpt: t.exposeString('excerpt'),
    page: t.exposeInt('page', { nullable: true }),
    relevanceScore: t.exposeFloat('relevanceScore'),
  }),
});

// RAGAnswer type
const RAGAnswer = builder.objectRef<{
  answer: string;
  sources: {
    documentId: string;
    title: string;
    excerpt: string;
    page?: number;
    relevanceScore: number;
  }[];
  confidence: number;
  timestamp: Date;
  followUpSuggestions: string[];
  // Router metadata (optional)
  method?: 'HYBRID' | 'PAGEINDEX';
  complexity?: 'SIMPLE' | 'COMPLEX';
  latency?: number;
  fromCache?: boolean;
}>('RAGAnswer');

RAGAnswer.implement({
  fields: (t) => ({
    answer: t.exposeString('answer'),
    sources: t.field({
      type: [SourceDocument],
      resolve: (parent) => parent.sources,
    }),
    confidence: t.exposeFloat('confidence'),
    timestamp: t.field({
      type: 'DateTime',
      resolve: (parent) => parent.timestamp,
    }),
    followUpSuggestions: t.exposeStringList('followUpSuggestions'),
    // Router metadata
    method: t.field({
      type: RetrievalMethod,
      nullable: true,
      resolve: (parent) => parent.method,
    }),
    complexity: t.field({
      type: QueryComplexity,
      nullable: true,
      resolve: (parent) => parent.complexity,
    }),
    latency: t.exposeFloat('latency', { nullable: true }),
    fromCache: t.exposeBoolean('fromCache', { nullable: true }),
  }),
});

// QueryStat type
const QueryStat = builder.objectRef<{
  query: string;
  count: number;
  avgResponseTime: number;
}>('QueryStat');

QueryStat.implement({
  fields: (t) => ({
    query: t.exposeString('query'),
    count: t.exposeInt('count'),
    avgResponseTime: t.exposeFloat('avgResponseTime'),
  }),
});

// SearchAnalytics type
const SearchAnalytics = builder.objectRef<{
  totalSearches: number;
  avgResponseTime: number;
  topQueries: { query: string; count: number; avgResponseTime: number }[];
  avgResultsCount: number;
}>('SearchAnalytics');

SearchAnalytics.implement({
  fields: (t) => ({
    totalSearches: t.exposeInt('totalSearches'),
    avgResponseTime: t.exposeFloat('avgResponseTime'),
    topQueries: t.field({
      type: [QueryStat],
      resolve: (parent) => parent.topQueries,
    }),
    avgResultsCount: t.exposeFloat('avgResultsCount'),
  }),
});

// DocumentProcessingStatus type
const DocumentProcessingStatus = builder.objectRef<{
  jobId: string;
  status: string;
  progress: number;
  chunksCreated: number;
  error?: string;
}>('DocumentProcessingStatus');

DocumentProcessingStatus.implement({
  fields: (t) => ({
    jobId: t.exposeID('jobId'),
    status: t.exposeString('status'),
    progress: t.exposeFloat('progress'),
    chunksCreated: t.exposeInt('chunksCreated'),
    error: t.exposeString('error', { nullable: true }),
  }),
});

// BatchProcessingResult type
const BatchProcessingResult = builder.objectRef<{
  jobIds: string[];
  totalDocuments: number;
  status: string;
}>('BatchProcessingResult');

BatchProcessingResult.implement({
  fields: (t) => ({
    jobIds: t.exposeStringList('jobIds'),
    totalDocuments: t.exposeInt('totalDocuments'),
    status: t.exposeString('status'),
  }),
});

// ===== QUERIES =====

builder.queryField('searchDocuments', (t) =>
  t.field({
    type: [SearchResult],
    args: {
      query: t.arg.string({ required: true }),
      limit: t.arg.int({ defaultValue: 10 }),
      docTypes: t.arg.stringList(),
      vesselId: t.arg.string(),
      voyageId: t.arg.string(),
      minImportance: t.arg.float(),
      rerank: t.arg.boolean({ defaultValue: false }),
    },
    resolve: async (_root, args, ctx) => {
      const user = ctx.request.user;
      if (!user) throw new Error('Not authenticated');

      const results = await maritimeRAG.search(
        args.query,
        {
          limit: args.limit,
          docTypes: args.docTypes || undefined,
          vesselId: args.vesselId || undefined,
          voyageId: args.voyageId || undefined,
          minImportance: args.minImportance || undefined,
          rerank: args.rerank,
        },
        user.organizationId
      );

      return results;
    },
  })
);

builder.queryField('askMari8xRAG', (t) =>
  t.field({
    type: RAGAnswer,
    args: {
      question: t.arg.string({ required: true }),
      limit: t.arg.int({ defaultValue: 5 }),
      docTypes: t.arg.stringList(),
      method: t.arg({ type: RetrievalMethod, required: false }), // NEW: Allow method override
    },
    resolve: async (_root, args, ctx) => {
      const user = ctx.request.user;
      if (!user) throw new Error('Not authenticated');

      const answer = await maritimeRAG.ask(
        args.question,
        {
          limit: args.limit,
          docTypes: args.docTypes || undefined,
          method: args.method?.toLowerCase() as 'auto' | 'hybrid' | 'pageindex' | undefined,
        },
        user.organizationId
      );

      return answer;
    },
  })
);

builder.queryField('searchAnalytics', (t) =>
  t.field({
    type: SearchAnalytics,
    args: {
      dateFrom: t.arg({ type: 'DateTime', required: false }),
      dateTo: t.arg({ type: 'DateTime', required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const user = ctx.request.user;
      if (!user) throw new Error('Not authenticated');

      // Check admin role
      if (user.role !== 'admin') {
        throw new Error('Unauthorized: admin role required');
      }

      const dateFrom = args.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dateTo = args.dateTo || new Date();

      // Get analytics
      const totalSearches = await ctx.prisma.searchQuery.count({
        where: {
          organizationId: user.organizationId,
          createdAt: { gte: dateFrom, lte: dateTo },
        },
      });

      const avgResponse = await ctx.prisma.searchQuery.aggregate({
        where: {
          organizationId: user.organizationId,
          createdAt: { gte: dateFrom, lte: dateTo },
        },
        _avg: {
          responseTime: true,
          resultsCount: true,
        },
      });

      const queryStats = await ctx.prisma.$queryRaw<any[]>`
        SELECT
          query,
          COUNT(*)::int as count,
          AVG(response_time)::float as avg_response_time
        FROM search_queries
        WHERE organization_id = ${user.organizationId}
          AND created_at >= ${dateFrom}
          AND created_at <= ${dateTo}
        GROUP BY query
        ORDER BY count DESC
        LIMIT 10
      `;

      return {
        totalSearches,
        avgResponseTime: avgResponse._avg.responseTime || 0,
        avgResultsCount: avgResponse._avg.resultsCount || 0,
        topQueries: queryStats.map((s: any) => ({
          query: s.query,
          count: s.count,
          avgResponseTime: s.avg_response_time,
        })),
      };
    },
  })
);

builder.queryField('processingJobStatus', (t) =>
  t.field({
    type: DocumentProcessingStatus,
    nullable: true,
    args: {
      jobId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = ctx.request.user;
      if (!user) throw new Error('Not authenticated');

      const status = await maritimeRAG.getJobStatus(args.jobId as string);
      return status;
    },
  })
);

// ===== MUTATIONS =====

builder.mutationField('ingestDocument', (t) =>
  t.field({
    type: DocumentProcessingStatus,
    args: {
      documentId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = ctx.request.user;
      if (!user) throw new Error('Not authenticated');

      // Verify document belongs to user's organization
      const document = await ctx.prisma.document.findFirst({
        where: {
          id: args.documentId as string,
          organizationId: user.organizationId,
        },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      const job = await maritimeRAG.ingestDocument(args.documentId as string, user.organizationId);
      return job;
    },
  })
);

builder.mutationField('reindexAllDocuments', (t) =>
  t.field({
    type: BatchProcessingResult,
    resolve: async (_root, _args, ctx) => {
      const user = ctx.request.user;
      if (!user) throw new Error('Not authenticated');

      // Check admin role
      if (user.role !== 'admin') {
        throw new Error('Unauthorized: admin role required');
      }

      // Get all active documents
      const documents = await ctx.prisma.document.findMany({
        where: {
          organizationId: user.organizationId,
          status: 'active',
        },
        select: { id: true },
      });

      // Create ingestion jobs
      const jobIds: string[] = [];
      for (const doc of documents) {
        const job = await maritimeRAG.ingestDocument(doc.id, user.organizationId);
        jobIds.push(job.jobId);
      }

      return {
        jobIds,
        totalDocuments: documents.length,
        status: 'processing',
      };
    },
  })
);
