/**
 * HybridSearch Service v2
 * Implements Reciprocal Rank Fusion (RRF) combining vector + full-text search
 * 
 * @package @anthropic/ankr-eon
 * @author ANKR Labs
 */

import { Pool, PoolClient } from 'pg';

// ============================================================================
// Types
// ============================================================================

export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch?(texts: string[]): Promise<number[][]>;
  model: string;
  dimensions: number;
}

export interface HybridSearchOptions {
  limit?: number;
  vectorWeight?: number;
  textWeight?: number;
  rrfK?: number;
  similarityThreshold?: number;
  filters?: SearchFilters;
  includeMetadata?: boolean;
}

export interface SearchFilters {
  docType?: string;
  sourceType?: string;
  topics?: string[];
  minImportance?: number;
}

export interface SearchResult {
  id: string;
  title: string | null;
  section: string | null;
  content: string;
  sourcePath: string;
  sourceType: string;
  docType: string | null;
  chunkIndex: number;
  keywords: string[];
  topics: string[];
  scores: {
    vectorRank: number | null;
    textRank: number | null;
    vectorSimilarity: number;
    textSimilarity: number;
    rrfScore: number;
  };
}

export interface SearchStats {
  tableName: string;
  totalRows: number;
  rowsWithEmbedding: number;
  rowsWithTsvector: number;
  totalSize: string;
}

// ============================================================================
// Default Embedding Provider (uses your existing ai-proxy)
// ============================================================================

export class AIProxyEmbeddingProvider implements EmbeddingProvider {
  private baseUrl: string;
  public model: string;
  public dimensions: number;

  constructor(options: {
    baseUrl?: string;
    model?: string;
    dimensions?: number;
  } = {}) {
    this.baseUrl = options.baseUrl || process.env.AI_PROXY_URL || 'http://localhost:3040';
    this.model = options.model || 'voyage-code-2';
    this.dimensions = options.dimensions || 1024; // voyage-code-2 default
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/v1/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Embedding failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await fetch(`${this.baseUrl}/v1/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
    });

    if (!response.ok) {
      throw new Error(`Batch embedding failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.map((d: any) => d.embedding);
  }
}

// ============================================================================
// Hybrid Search Service
// ============================================================================

export class HybridSearchService {
  private pool: Pool;
  private embeddingProvider: EmbeddingProvider;
  private defaultOptions: HybridSearchOptions = {
    limit: 10,
    vectorWeight: 0.5,
    textWeight: 0.5,
    rrfK: 60,
    similarityThreshold: 0.3,
    includeMetadata: true,
  };

  constructor(pool: Pool, embeddingProvider?: EmbeddingProvider) {
    this.pool = pool;
    this.embeddingProvider = embeddingProvider || new AIProxyEmbeddingProvider();
  }

  /**
   * Hybrid search combining vector similarity and full-text search with RRF
   */
  async search(
    query: string,
    options: HybridSearchOptions = {}
  ): Promise<SearchResult[]> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();

    // Generate embedding for query
    const embedding = await this.embeddingProvider.embed(query);
    const embeddingStr = `[${embedding.join(',')}]`;

    const client = await this.pool.connect();
    try {
      // Use the PostgreSQL function for RRF fusion
      const result = await client.query(
        `SELECT * FROM hybrid_search_rrf($1, $2::vector, $3, $4, $5, $6, $7)`,
        [
          query,
          embeddingStr,
          opts.limit,
          opts.vectorWeight,
          opts.textWeight,
          opts.rrfK,
          opts.similarityThreshold,
        ]
      );

      const latencyMs = Date.now() - startTime;
      console.log(`[HybridSearch] Query: "${query.slice(0, 50)}..." | Results: ${result.rows.length} | Latency: ${latencyMs}ms`);

      return result.rows.map(this.mapResultRow);
    } finally {
      client.release();
    }
  }

  /**
   * Vector-only search (for comparison/fallback)
   */
  async vectorSearch(
    query: string,
    options: Pick<HybridSearchOptions, 'limit' | 'similarityThreshold'> = {}
  ): Promise<SearchResult[]> {
    const { limit = 10, similarityThreshold = 0.3 } = options;

    const embedding = await this.embeddingProvider.embed(query);
    const embeddingStr = `[${embedding.join(',')}]`;

    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM vector_search($1::vector, $2, $3)`,
        [embeddingStr, limit, similarityThreshold]
      );

      return result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        section: null,
        content: row.content,
        sourcePath: row.source_path,
        sourceType: '',
        docType: null,
        chunkIndex: 0,
        keywords: [],
        topics: [],
        scores: {
          vectorRank: null,
          textRank: null,
          vectorSimilarity: row.similarity,
          textSimilarity: 0,
          rrfScore: row.similarity,
        },
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Full-text only search (for comparison/fallback)
   */
  async textSearch(
    query: string,
    options: Pick<HybridSearchOptions, 'limit'> = {}
  ): Promise<(SearchResult & { headline: string })[]> {
    const { limit = 10 } = options;

    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM text_search($1, $2)`,
        [query, limit]
      );

      return result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        section: null,
        content: row.content,
        sourcePath: row.source_path,
        sourceType: '',
        docType: null,
        chunkIndex: 0,
        keywords: [],
        topics: [],
        headline: row.headline,
        scores: {
          vectorRank: null,
          textRank: null,
          vectorSimilarity: 0,
          textSimilarity: row.similarity,
          rrfScore: row.similarity,
        },
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Search with custom SQL filters (advanced)
   */
  async searchWithFilters(
    query: string,
    options: HybridSearchOptions = {}
  ): Promise<SearchResult[]> {
    const opts = { ...this.defaultOptions, ...options };
    const { filters } = opts;

    if (!filters || Object.keys(filters).length === 0) {
      return this.search(query, options);
    }

    const embedding = await this.embeddingProvider.embed(query);
    const embeddingStr = `[${embedding.join(',')}]`;

    const client = await this.pool.connect();
    try {
      // Build dynamic query with filters
      let filterClauses: string[] = [];
      let params: any[] = [query, embeddingStr, opts.limit];
      let paramIndex = 4;

      if (filters.docType) {
        filterClauses.push(`doc_type = $${paramIndex++}`);
        params.push(filters.docType);
      }

      if (filters.sourceType) {
        filterClauses.push(`source_type = $${paramIndex++}`);
        params.push(filters.sourceType);
      }

      if (filters.topics && filters.topics.length > 0) {
        filterClauses.push(`topics && $${paramIndex++}`);
        params.push(filters.topics);
      }

      if (filters.minImportance !== undefined) {
        filterClauses.push(`importance >= $${paramIndex++}`);
        params.push(filters.minImportance);
      }

      const whereClause = filterClauses.length > 0 
        ? `WHERE ${filterClauses.join(' AND ')}` 
        : '';

      const sql = `
        WITH filtered AS (
          SELECT * FROM eon_knowledge ${whereClause}
        ),
        vector_results AS (
          SELECT 
            id,
            ROW_NUMBER() OVER (ORDER BY embedding <=> $2::vector) AS rank,
            1 - (embedding <=> $2::vector) AS similarity
          FROM filtered
          WHERE embedding IS NOT NULL
          ORDER BY embedding <=> $2::vector
          LIMIT $3 * 3
        ),
        text_results AS (
          SELECT 
            id,
            ROW_NUMBER() OVER (ORDER BY ts_rank_cd(content_tsv, websearch_to_tsquery('english', $1)) DESC) AS rank,
            ts_rank_cd(content_tsv, websearch_to_tsquery('english', $1)) AS similarity
          FROM filtered
          WHERE content_tsv @@ websearch_to_tsquery('english', $1)
          LIMIT $3 * 3
        ),
        combined AS (
          SELECT 
            COALESCE(vr.id, tr.id) AS id,
            vr.rank AS v_rank,
            tr.rank AS t_rank,
            COALESCE(vr.similarity, 0) AS v_sim,
            COALESCE(tr.similarity, 0) AS t_sim,
            (COALESCE(0.5 / (60 + vr.rank), 0) + COALESCE(0.5 / (60 + tr.rank), 0)) AS rrf
          FROM vector_results vr
          FULL OUTER JOIN text_results tr ON vr.id = tr.id
        )
        SELECT 
          f.id, f.title, f.section, f.content, f.source_path, f.source_type,
          f.doc_type, f.chunk_index, f.keywords, f.topics,
          c.v_rank::INT AS vector_rank, c.t_rank::INT AS text_rank,
          c.v_sim::FLOAT AS vector_similarity, c.t_sim::FLOAT AS text_similarity,
          c.rrf::FLOAT AS rrf_score
        FROM combined c
        JOIN filtered f ON f.id = c.id
        WHERE c.v_sim >= ${opts.similarityThreshold} OR c.t_sim > 0
        ORDER BY c.rrf DESC
        LIMIT $3
      `;

      const result = await client.query(sql, params);
      return result.rows.map(this.mapResultRow);
    } finally {
      client.release();
    }
  }

  /**
   * Get search statistics
   */
  async getStats(): Promise<SearchStats[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM eon_search_stats');
      return result.rows.map((row) => ({
        tableName: row.table_name,
        totalRows: parseInt(row.total_rows),
        rowsWithEmbedding: parseInt(row.rows_with_embedding),
        rowsWithTsvector: parseInt(row.rows_with_tsvector),
        totalSize: row.total_size,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Compare search methods (for benchmarking)
   */
  async compareSearchMethods(query: string, limit: number = 5): Promise<{
    hybrid: SearchResult[];
    vector: SearchResult[];
    text: (SearchResult & { headline: string })[];
    timing: {
      hybridMs: number;
      vectorMs: number;
      textMs: number;
    };
  }> {
    const start1 = Date.now();
    const hybrid = await this.search(query, { limit });
    const hybridMs = Date.now() - start1;

    const start2 = Date.now();
    const vector = await this.vectorSearch(query, { limit });
    const vectorMs = Date.now() - start2;

    const start3 = Date.now();
    const text = await this.textSearch(query, { limit });
    const textMs = Date.now() - start3;

    return {
      hybrid,
      vector,
      text,
      timing: { hybridMs, vectorMs, textMs },
    };
  }

  /**
   * Map database row to SearchResult
   */
  private mapResultRow(row: any): SearchResult {
    return {
      id: row.id,
      title: row.title,
      section: row.section,
      content: row.content,
      sourcePath: row.source_path,
      sourceType: row.source_type,
      docType: row.doc_type,
      chunkIndex: row.chunk_index,
      keywords: row.keywords || [],
      topics: row.topics || [],
      scores: {
        vectorRank: row.vector_rank,
        textRank: row.text_rank,
        vectorSimilarity: parseFloat(row.vector_similarity) || 0,
        textSimilarity: parseFloat(row.text_similarity) || 0,
        rrfScore: parseFloat(row.rrf_score) || 0,
      },
    };
  }
}

// ============================================================================
// Factory function
// ============================================================================

export function createHybridSearchService(
  pool: Pool,
  embeddingProvider?: EmbeddingProvider
): HybridSearchService {
  return new HybridSearchService(pool, embeddingProvider);
}

// ============================================================================
// Export default
// ============================================================================

export default HybridSearchService;
