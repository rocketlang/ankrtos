import { PrismaClient } from '@prisma/client';
import { LogisticsRAG, HybridSearch, RAGRetriever } from '@ankr/eon';
import { getProcessor } from './document-processors/index.js';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

export interface SearchOptions {
  limit?: number;
  docTypes?: string[];
  vesselId?: string;
  voyageId?: string;
  charterId?: string;
  minImportance?: number;
  rerank?: boolean;
  rerankProvider?: 'voyage' | 'cohere' | 'jina' | 'local';
}

export interface AskOptions {
  limit?: number;
  docTypes?: string[];
  context?: string;
}

export interface SearchResult {
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
}

export interface RAGAnswer {
  answer: string;
  sources: SourceDocument[];
  confidence: number;
  timestamp: Date;
  followUpSuggestions: string[];
}

export interface SourceDocument {
  documentId: string;
  title: string;
  excerpt: string;
  page?: number;
  relevanceScore: number;
}

export interface ProcessingJob {
  jobId: string;
  status: string;
  progress: number;
  chunksCreated: number;
  error?: string;
}

export class MaritimeRAG {
  private logisticsRAG: LogisticsRAG;
  private hybridSearch: HybridSearch;
  private ragRetriever: RAGRetriever;

  constructor() {
    // Initialize @ankr/eon components
    this.logisticsRAG = new LogisticsRAG({
      embeddingProvider: 'voyage',
      embeddingModel: 'voyage-code-2',
      embeddingDimension: 1536,
      apiKey: process.env.VOYAGE_API_KEY,
    });

    this.hybridSearch = new HybridSearch({
      vectorWeight: 0.7,
      textWeight: 0.3,
      rrfK: 60,
    });

    this.ragRetriever = new RAGRetriever({
      cacheEnabled: true,
      cacheTTL: 3600,
      rerankProvider: 'voyage',
    });
  }

  /**
   * Ingest a document into the RAG system
   */
  async ingestDocument(documentId: string, orgId: string): Promise<ProcessingJob> {
    // Create processing job
    const job = await prisma.documentProcessingJob.create({
      data: {
        documentId,
        status: 'pending',
        jobType: 'embedding',
        progress: 0,
        chunksCreated: 0,
        startedAt: new Date(),
      },
    });

    // Process asynchronously (don't block)
    this._processDocument(job.id, documentId, orgId).catch((err) => {
      console.error(`[MaritimeRAG] Error processing document ${documentId}:`, err);
      prisma.documentProcessingJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          error: err.message,
          completedAt: new Date(),
        },
      });
    });

    return {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      chunksCreated: job.chunksCreated,
    };
  }

  /**
   * Search maritime documents with semantic + text hybrid search
   */
  async search(
    query: string,
    options: SearchOptions,
    orgId: string
  ): Promise<SearchResult[]> {
    const startTime = Date.now();

    // Build filter conditions
    const filters: any = { organizationId: orgId };
    if (options.docTypes && options.docTypes.length > 0) {
      filters.docType = { in: options.docTypes };
    }
    if (options.vesselId) filters.vesselId = options.vesselId;
    if (options.voyageId) filters.voyageId = options.voyageId;
    if (options.charterId) filters.charterId = options.charterId;
    if (options.minImportance !== undefined) {
      filters.importance = { gte: options.minImportance };
    }

    // Generate embedding for query
    const embedding = await this.logisticsRAG.embed(query);

    // Perform hybrid search using raw SQL for performance
    const limit = options.limit || 10;
    const results = await prisma.$queryRaw<any[]>`
      WITH vector_search AS (
        SELECT
          id,
          documentId,
          title,
          content,
          docType,
          vesselNames,
          portNames,
          cargoTypes,
          parties,
          createdAt,
          1 - (embedding <=> ${embedding}::vector) AS vector_score
        FROM maritime_documents
        WHERE organizationId = ${orgId}
          ${options.docTypes ? prisma.$queryRaw`AND docType = ANY(${options.docTypes}::text[])` : prisma.$queryRaw``}
          ${options.vesselId ? prisma.$queryRaw`AND vesselId = ${options.vesselId}` : prisma.$queryRaw``}
          ${options.voyageId ? prisma.$queryRaw`AND voyageId = ${options.voyageId}` : prisma.$queryRaw``}
        ORDER BY embedding <=> ${embedding}::vector
        LIMIT ${limit * 2}
      ),
      text_search AS (
        SELECT
          id,
          ts_rank(contentTsv, plainto_tsquery('english', ${query})) AS text_score
        FROM maritime_documents
        WHERE organizationId = ${orgId}
          AND contentTsv @@ plainto_tsquery('english', ${query})
          ${options.docTypes ? prisma.$queryRaw`AND docType = ANY(${options.docTypes}::text[])` : prisma.$queryRaw``}
        LIMIT ${limit * 2}
      )
      SELECT
        v.id,
        v.documentId,
        v.title,
        v.content,
        v.docType,
        v.vesselNames,
        v.portNames,
        v.cargoTypes,
        v.parties,
        v.createdAt,
        v.vector_score,
        COALESCE(t.text_score, 0) AS text_score,
        (0.7 * v.vector_score + 0.3 * COALESCE(t.text_score, 0)) AS combined_score
      FROM vector_search v
      LEFT JOIN text_search t ON v.id = t.id
      ORDER BY combined_score DESC
      LIMIT ${limit}
    `;

    // Optionally rerank results
    let finalResults = results;
    if (options.rerank && results.length > 0) {
      const rerankProvider = options.rerankProvider || 'voyage';
      const reranked = await this.ragRetriever.rerank(
        query,
        results.map((r) => r.content),
        rerankProvider
      );

      // Map reranked scores back to results
      finalResults = reranked.map((item, idx) => ({
        ...results[item.index],
        score: item.score,
      }));
    }

    // Log search query for analytics
    const responseTime = Date.now() - startTime;
    await this._logSearch(null, query, orgId, results.length, responseTime);

    // Transform to SearchResult format
    return finalResults.map((r) => ({
      id: r.id,
      documentId: r.documentId,
      title: r.title,
      content: r.content,
      excerpt: this._createExcerpt(r.content, query),
      score: options.rerank ? r.score : r.combined_score,
      metadata: { docType: r.docType },
      entities: {
        vesselNames: r.vesselNames || [],
        portNames: r.portNames || [],
        cargoTypes: r.cargoTypes || [],
        parties: r.parties || [],
      },
      createdAt: r.createdAt,
    }));
  }

  /**
   * Ask a question and get RAG-powered answer with sources
   */
  async ask(question: string, options: AskOptions, orgId: string): Promise<RAGAnswer> {
    // Search for relevant documents
    const searchResults = await this.search(
      question,
      {
        limit: options.limit || 5,
        docTypes: options.docTypes,
        rerank: true,
        rerankProvider: 'voyage',
      },
      orgId
    );

    if (searchResults.length === 0) {
      return {
        answer: "I couldn't find any relevant information in the knowledge base to answer this question.",
        sources: [],
        confidence: 0,
        timestamp: new Date(),
        followUpSuggestions: [],
      };
    }

    // Build context from search results
    const context = searchResults
      .map((r, idx) => `[Source ${idx + 1}] ${r.title}\n${r.content}`)
      .join('\n\n');

    // Generate answer using RAG retriever
    const ragAnswer = await this.ragRetriever.retrieve(question, context, {
      temperature: 0.3,
      maxTokens: 500,
      contextPrefix: options.context,
    });

    // Calculate confidence based on relevance scores
    const avgScore = searchResults.reduce((sum, r) => sum + r.score, 0) / searchResults.length;
    const confidence = Math.min(avgScore * 100, 99);

    // Generate follow-up suggestions
    const followUpSuggestions = this._generateFollowUps(question, searchResults);

    return {
      answer: ragAnswer,
      sources: searchResults.map((r) => ({
        documentId: r.documentId,
        title: r.title,
        excerpt: r.excerpt,
        relevanceScore: r.score,
      })),
      confidence,
      timestamp: new Date(),
      followUpSuggestions,
    };
  }

  /**
   * Get processing job status
   */
  async getJobStatus(jobId: string): Promise<ProcessingJob | null> {
    const job = await prisma.documentProcessingJob.findUnique({
      where: { id: jobId },
    });

    if (!job) return null;

    return {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      chunksCreated: job.chunksCreated,
      error: job.error || undefined,
    };
  }

  /**
   * Internal: Process document and create chunks
   */
  private async _processDocument(jobId: string, documentId: string, orgId: string) {
    // Update job status
    await prisma.documentProcessingJob.update({
      where: { id: jobId },
      data: { status: 'processing', progress: 10 },
    });

    // Fetch document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    // Classify document type (if not already set)
    const classifier = getProcessor('classifier');
    const classification = await classifier.process(document);
    const docType = classification.docType || document.category;

    // Get appropriate processor
    const processor = getProcessor(docType);

    // Extract entities and metadata
    await prisma.documentProcessingJob.update({
      where: { id: jobId },
      data: { progress: 30 },
    });

    const extracted = await processor.process(document);

    // Chunk document content
    const chunks = await this._chunkDocument(document, extracted);

    await prisma.documentProcessingJob.update({
      where: { id: jobId },
      data: { progress: 50 },
    });

    // Generate embeddings for each chunk
    let chunksCreated = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await this.logisticsRAG.embed(chunk.content);

      await prisma.maritimeDocument.create({
        data: {
          documentId: document.id,
          title: `${document.title} - Part ${i + 1}`,
          content: chunk.content,
          section: chunk.section,
          chunkIndex: i,
          docType,
          embedding: JSON.stringify(embedding),
          vesselId: extracted.vesselId || document.vesselId,
          voyageId: extracted.voyageId || document.voyageId,
          charterId: extracted.charterId,
          companyId: extracted.companyId,
          vesselNames: extracted.vesselNames || [],
          portNames: extracted.portNames || [],
          cargoTypes: extracted.cargoTypes || [],
          parties: extracted.parties || [],
          tags: [...(document.tags || []), ...(extracted.tags || [])],
          importance: extracted.importance || 0.5,
          organizationId: orgId,
        },
      });

      chunksCreated++;
      const progress = 50 + ((i + 1) / chunks.length) * 50;
      await prisma.documentProcessingJob.update({
        where: { id: jobId },
        data: { progress, chunksCreated },
      });
    }

    // Mark job as completed
    await prisma.documentProcessingJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Chunk document into smaller pieces for embedding
   */
  private async _chunkDocument(document: any, extracted: any): Promise<any[]> {
    // Simple chunking strategy: split by paragraphs with overlap
    const content = extracted.fullText || document.notes || '';
    const maxChunkSize = 1000; // characters
    const overlap = 200;

    const chunks: any[] = [];
    let start = 0;

    while (start < content.length) {
      const end = Math.min(start + maxChunkSize, content.length);
      const chunkContent = content.slice(start, end);

      chunks.push({
        content: chunkContent,
        section: extracted.section,
      });

      start += maxChunkSize - overlap;
    }

    return chunks.length > 0 ? chunks : [{ content, section: null }];
  }

  /**
   * Create excerpt with highlighted query terms
   */
  private _createExcerpt(content: string, query: string, maxLength: number = 200): string {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    const idx = contentLower.indexOf(queryLower);

    if (idx === -1) {
      // Query not found, return beginning
      return content.slice(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    // Extract context around query
    const start = Math.max(0, idx - 50);
    const end = Math.min(content.length, idx + query.length + 150);
    let excerpt = content.slice(start, end);

    if (start > 0) excerpt = '...' + excerpt;
    if (end < content.length) excerpt = excerpt + '...';

    return excerpt;
  }

  /**
   * Generate follow-up question suggestions
   */
  private _generateFollowUps(question: string, results: SearchResult[]): string[] {
    const suggestions: string[] = [];
    const questionLower = question.toLowerCase();

    // Suggest related topics based on entities found
    const allVessels = new Set<string>();
    const allPorts = new Set<string>();

    results.forEach((r) => {
      r.entities.vesselNames.forEach((v) => allVessels.add(v));
      r.entities.portNames.forEach((p) => allPorts.add(p));
    });

    if (allVessels.size > 0 && !questionLower.includes('vessel')) {
      const vessel = Array.from(allVessels)[0];
      suggestions.push(`Tell me more about ${vessel}`);
    }

    if (allPorts.size > 0 && !questionLower.includes('port')) {
      const port = Array.from(allPorts)[0];
      suggestions.push(`What are the requirements for ${port}?`);
    }

    // Generic follow-ups
    if (questionLower.includes('what is') || questionLower.includes('define')) {
      suggestions.push('Can you give an example?');
    } else if (questionLower.includes('how')) {
      suggestions.push('What are the key steps?');
    }

    return suggestions.slice(0, 3);
  }

  /**
   * Log search query for analytics
   */
  private async _logSearch(
    userId: string | null,
    query: string,
    orgId: string,
    resultsCount: number,
    responseTime: number
  ): Promise<void> {
    try {
      await prisma.searchQuery.create({
        data: {
          userId,
          organizationId: orgId,
          query,
          queryType: 'semantic',
          resultsCount,
          responseTime,
        },
      });
    } catch (err) {
      console.error('[MaritimeRAG] Failed to log search:', err);
    }
  }
}

export const maritimeRAG = new MaritimeRAG();
