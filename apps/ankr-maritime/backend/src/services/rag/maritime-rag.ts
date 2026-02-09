import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';

// import { maritimeRouter } from './pageindex-router.js'; // Temporarily disabled for testing

// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface SearchOptions {
  limit?: number;
  minScore?: number;
  docTypes?: string[];
  vesselId?: string;
  voyageId?: string;
  rerank?: boolean;
  method?: 'auto' | 'hybrid' | 'pageindex'; // NEW: Router method selection
}

export interface SearchResult {
  id: string;
  documentId: string;
  title: string;
  content: string;
  excerpt: string;
  score: number;
  metadata: {
    docType: string;
    vesselId?: string;
    voyageId?: string;
    vesselNames?: string[];
    portNames?: string[];
    cargoTypes?: string[];
    parties?: string[];
    tags?: string[];
  };
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
  // Router metadata (optional)
  method?: 'HYBRID' | 'PAGEINDEX';
  complexity?: 'SIMPLE' | 'COMPLEX';
  latency?: number;
  fromCache?: boolean;
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
  documentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  chunksCreated: number;
  error?: string;
}

// ============================================================================
// Maritime RAG Service
// ============================================================================

export class MaritimeRAGService {
  /**
   * Ingest a document into the RAG system
   */
  async ingestDocument(
    documentId: string,
    organizationId: string
  ): Promise<ProcessingJob> {
    // Get document from database
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        organizationId,
      },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Create processing job
    const job = await prisma.documentProcessingJob.create({
      data: {
        documentId,
        jobType: 'embedding',
        status: 'pending',
        progress: 0,
        chunksCreated: 0,
        startedAt: new Date(),
      },
    });

    // Process document asynchronously
    this.processDocumentAsync(documentId, organizationId, job.id).catch(
      (error) => {
        console.error(`Failed to process document ${documentId}:`, error);
      }
    );

    return {
      jobId: job.id,
      documentId,
      status: 'pending',
      progress: 0,
      chunksCreated: 0,
    };
  }

  /**
   * Search documents using semantic search
   */
  async search(
    query: string,
    options: SearchOptions,
    organizationId: string
  ): Promise<SearchResult[]> {
    const startTime = Date.now();

    // Build where clause with filters
    const where: any = {
      organizationId,
    };

    if (options.docTypes && options.docTypes.length > 0) {
      where.docType = { in: options.docTypes };
    }

    if (options.vesselId) {
      where.vesselId = options.vesselId;
    }

    if (options.voyageId) {
      where.voyageId = options.voyageId;
    }

    // For MVP: Simple text search (will be upgraded to vector search)
    // In production: Use @ankr/eon LogisticsRAG with pgvector
    const documents = await prisma.maritimeDocument.findMany({
      where: {
        ...where,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { tags: { has: query.toLowerCase() } },
        ],
      },
      take: options.limit || 10,
      orderBy: {
        importance: 'desc',
      },
    });

    const responseTime = Date.now() - startTime;

    // Log search query
    await prisma.searchQuery.create({
      data: {
        query,
        queryType: 'semantic',
        resultsCount: documents.length,
        responseTime,
        organizationId,
      },
    });

    // Transform to search results
    return documents.map((doc) => ({
      id: doc.id,
      documentId: doc.documentId,
      title: doc.title,
      content: doc.content,
      excerpt: this.createExcerpt(doc.content, query, 200),
      score: this.calculateRelevanceScore(doc, query),
      metadata: {
        docType: doc.docType,
        vesselId: doc.vesselId || undefined,
        voyageId: doc.voyageId || undefined,
        vesselNames: doc.vesselNames,
        portNames: doc.portNames,
        cargoTypes: doc.cargoTypes,
        parties: doc.parties,
        tags: doc.tags,
      },
      entities: {
        vesselNames: doc.vesselNames,
        portNames: doc.portNames,
        cargoTypes: doc.cargoTypes,
        parties: doc.parties,
      },
      createdAt: doc.createdAt,
    }));
  }

  /**
   * Ask a question using RAG (Retrieval-Augmented Generation)
   */
  async ask(
    question: string,
    options: SearchOptions,
    organizationId: string
  ): Promise<RAGAnswer> {
    const startTime = Date.now();

    // ROUTER INTEGRATION: Use PageIndex router if enabled and method specified
    if (options.method && options.method !== 'hybrid') {
      try {
        const routerAnswer = await maritimeRouter.ask(
          question,
          options,
          organizationId
        );

        // Add latency if not set
        if (!routerAnswer.latency) {
          routerAnswer.latency = Date.now() - startTime;
        }

        return routerAnswer;
      } catch (error) {
        console.error('Router failed, falling back to standard RAG:', error);
        // Continue with standard RAG below
      }
    }

    // STANDARD RAG FLOW
    // 1. Search for relevant documents
    const searchResults = await this.search(question, options, organizationId);

    if (searchResults.length === 0) {
      return {
        answer:
          "I couldn't find any relevant documents to answer your question. Please try rephrasing or adding more context.",
        sources: [],
        confidence: 0,
        timestamp: new Date(),
        followUpSuggestions: [
          'Can you provide more details about what you are looking for?',
          'Try searching for specific vessel names, ports, or charter parties',
        ],
      };
    }

    // 2. Build context from top results
    const topResults = searchResults.slice(0, 3);
    const context = topResults
      .map((result, index) => {
        return `Document ${index + 1}: ${result.title}\n${result.excerpt}\n`;
      })
      .join('\n---\n\n');

    // 3. Generate answer (MVP: Template-based, Production: Use LLM)
    const answer = this.generateAnswer(question, topResults);

    // 4. Extract sources
    const sources: SourceDocument[] = topResults.map((result) => ({
      documentId: result.documentId,
      title: result.title,
      excerpt: result.excerpt,
      relevanceScore: result.score,
    }));

    // 5. Calculate confidence based on relevance scores
    const avgScore =
      topResults.reduce((sum, r) => sum + r.score, 0) / topResults.length;
    const confidence = Math.min(avgScore * 100, 95); // Cap at 95%

    // 6. Generate follow-up suggestions
    const followUpSuggestions = this.generateFollowUpSuggestions(
      question,
      topResults
    );

    return {
      answer,
      sources,
      confidence,
      timestamp: new Date(),
      followUpSuggestions,
      // Add metadata for standard RAG
      method: 'HYBRID',
      complexity: 'SIMPLE',
      latency: Date.now() - startTime,
      fromCache: false,
    };
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<ProcessingJob> {
    const job = await prisma.documentProcessingJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return {
      jobId: job.id,
      documentId: job.documentId,
      status: job.status as any,
      progress: job.progress,
      chunksCreated: job.chunksCreated,
      error: job.error || undefined,
    };
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(
    organizationId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    totalSearches: number;
    avgResponseTime: number;
    topQueries: Array<{ query: string; count: number }>;
    avgResultsCount: number;
  }> {
    const where: any = { organizationId };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const queries = await prisma.searchQuery.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalSearches = queries.length;
    const avgResponseTime =
      queries.reduce((sum, q) => sum + q.responseTime, 0) / totalSearches || 0;
    const avgResultsCount =
      queries.reduce((sum, q) => sum + q.resultsCount, 0) / totalSearches || 0;

    // Count query frequencies
    const queryCounts = new Map<string, number>();
    queries.forEach((q) => {
      queryCounts.set(q.query, (queryCounts.get(q.query) || 0) + 1);
    });

    const topQueries = Array.from(queryCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalSearches,
      avgResponseTime,
      topQueries,
      avgResultsCount,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Process document asynchronously
   */
  private async processDocumentAsync(
    documentId: string,
    organizationId: string,
    jobId: string
  ): Promise<void> {
    try {
      await prisma.documentProcessingJob.update({
        where: { id: jobId },
        data: {
          status: 'processing',
          progress: 10,
        },
      });

      // Get document
      const document = await prisma.document.findFirst({
        where: { id: documentId, organizationId },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Classify document type
      const docType = this.classifyDocumentType(document.category);

      // Extract content (MVP: use title + notes, Production: parse PDF/DOCX)
      const content = `${document.title}\n\n${document.notes || ''}`;

      await prisma.documentProcessingJob.update({
        where: { id: jobId },
        data: { progress: 30 },
      });

      // Extract entities
      const entities = this.extractEntities(content);

      await prisma.documentProcessingJob.update({
        where: { id: jobId },
        data: { progress: 60 },
      });

      // Create maritime document chunk
      await prisma.maritimeDocument.create({
        data: {
          documentId,
          title: document.title,
          content,
          docType,
          vesselId: document.vesselId || undefined,
          voyageId: document.voyageId || undefined,
          vesselNames: entities.vesselNames,
          portNames: entities.portNames,
          cargoTypes: entities.cargoTypes,
          parties: entities.parties,
          tags: document.tags,
          importance: this.calculateImportance(document),
          organizationId,
        },
      });

      await prisma.documentProcessingJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          progress: 100,
          chunksCreated: 1,
          completedAt: new Date(),
        },
      });
    } catch (error: any) {
      await prisma.documentProcessingJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error: error.message,
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  /**
   * Classify document type
   */
  private classifyDocumentType(category: string): string {
    const mapping: Record<string, string> = {
      charter_party: 'charter_party',
      bol: 'bol',
      correspondence: 'email',
      report: 'market_report',
      certificate: 'compliance',
      survey: 'compliance',
      insurance: 'compliance',
      invoice: 'invoice',
    };

    return mapping[category] || 'general';
  }

  /**
   * Extract entities from text
   */
  private extractEntities(text: string): {
    vesselNames: string[];
    portNames: string[];
    cargoTypes: string[];
    parties: string[];
  } {
    // MVP: Simple keyword matching
    // Production: Use NLP library or LLM for entity extraction

    const vesselNames: string[] = [];
    const portNames: string[] = [];
    const cargoTypes: string[] = [];
    const parties: string[] = [];

    // Vessel name patterns (MV, M/V, SS, etc.)
    const vesselRegex = /(?:M\/V|MV|SS|MS)\s+([A-Z][A-Za-z\s]+)/g;
    let match;
    while ((match = vesselRegex.exec(text)) !== null) {
      vesselNames.push(match[1].trim());
    }

    // Common port codes
    const portCodes = [
      'SGSIN',
      'USNYC',
      'CNSHA',
      'NLRTM',
      'HKHKG',
      'AEJEA',
      'BRRIO',
    ];
    portCodes.forEach((code) => {
      if (text.includes(code)) {
        portNames.push(code);
      }
    });

    // Common cargo types
    const cargoKeywords = [
      'steel coils',
      'containers',
      'grain',
      'coal',
      'iron ore',
      'crude oil',
      'lng',
      'lpg',
    ];
    cargoKeywords.forEach((cargo) => {
      if (text.toLowerCase().includes(cargo)) {
        cargoTypes.push(cargo);
      }
    });

    return {
      vesselNames: [...new Set(vesselNames)],
      portNames: [...new Set(portNames)],
      cargoTypes: [...new Set(cargoTypes)],
      parties: [...new Set(parties)],
    };
  }

  /**
   * Calculate document importance score
   */
  private calculateImportance(document: any): number {
    let score = 0.5; // Base score

    // Charter parties are high importance
    if (document.category === 'charter_party') score += 0.3;

    // BOLs are high importance
    if (document.category === 'bol') score += 0.25;

    // Recent documents are more important
    const ageInDays =
      (Date.now() - new Date(document.createdAt).getTime()) /
      (1000 * 60 * 60 * 24);
    if (ageInDays < 7) score += 0.2;
    else if (ageInDays < 30) score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Create excerpt with highlighted query terms
   */
  private createExcerpt(
    content: string,
    query: string,
    maxLength: number
  ): string {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();

    // Find first occurrence of query
    const index = contentLower.indexOf(queryLower);

    if (index === -1) {
      // Query not found, return beginning
      return content.substring(0, maxLength) + '...';
    }

    // Extract context around query
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + query.length + 150);

    let excerpt = content.substring(start, end);

    if (start > 0) excerpt = '...' + excerpt;
    if (end < content.length) excerpt = excerpt + '...';

    return excerpt;
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevanceScore(doc: any, query: string): number {
    let score = 0;

    const queryLower = query.toLowerCase();
    const titleLower = doc.title.toLowerCase();
    const contentLower = doc.content.toLowerCase();

    // Title match = highest score
    if (titleLower.includes(queryLower)) {
      score += 0.5;
    }

    // Content match
    const occurrences = (contentLower.match(new RegExp(queryLower, 'g')) || [])
      .length;
    score += Math.min(occurrences * 0.1, 0.3);

    // Tag match
    if (doc.tags.some((tag: string) => tag.toLowerCase().includes(queryLower))) {
      score += 0.2;
    }

    // Importance bonus
    score += doc.importance * 0.2;

    return Math.min(score, 1.0);
  }

  /**
   * Generate answer from search results (MVP template-based)
   */
  private generateAnswer(question: string, results: SearchResult[]): string {
    if (results.length === 0) {
      return "I couldn't find relevant information to answer your question.";
    }

    const topResult = results[0];

    // Extract question type
    const questionLower = question.toLowerCase();

    if (questionLower.includes('what is') || questionLower.includes('define')) {
      return `Based on the document "${topResult.title}", ${topResult.excerpt}`;
    }

    if (questionLower.includes('how to') || questionLower.includes('how do')) {
      return `According to "${topResult.title}": ${topResult.excerpt}`;
    }

    if (questionLower.includes('when') || questionLower.includes('date')) {
      return `Based on the available documents: ${topResult.excerpt}`;
    }

    if (questionLower.includes('where')) {
      const ports = topResult.entities.portNames;
      if (ports.length > 0) {
        return `The relevant ports mentioned are: ${ports.join(', ')}. ${topResult.excerpt}`;
      }
    }

    // Default answer
    return `Based on "${topResult.title}": ${topResult.excerpt}`;
  }

  /**
   * Generate follow-up suggestions
   */
  private generateFollowUpSuggestions(
    question: string,
    results: SearchResult[]
  ): string[] {
    const suggestions: string[] = [];

    if (results.length === 0) {
      return suggestions;
    }

    const topResult = results[0];

    // Add suggestions based on entities found
    if (topResult.entities.vesselNames.length > 0) {
      suggestions.push(
        `Tell me more about ${topResult.entities.vesselNames[0]}`
      );
    }

    if (topResult.entities.portNames.length > 0) {
      suggestions.push(
        `What are the port restrictions at ${topResult.entities.portNames[0]}?`
      );
    }

    if (topResult.metadata.docType === 'charter_party') {
      suggestions.push('What are the laytime terms in this charter party?');
      suggestions.push('Show me the freight rate calculation');
    }

    if (topResult.metadata.docType === 'bol') {
      suggestions.push('What is the cargo description?');
      suggestions.push('Who is the consignee?');
    }

    return suggestions.slice(0, 3);
  }
}

export default new MaritimeRAGService();
