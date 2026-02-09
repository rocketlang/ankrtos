/**
 * Hybrid Search Service
 * Combines BM25 full-text search with vector similarity using RRF
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

export interface SearchResult {
  id: string;
  documentId: string;
  title: string;
  content: string;
  docType: string;
  score: number;
  method: 'vector' | 'fulltext' | 'hybrid';
  vectorScore?: number;
  fulltextScore?: number;
  [key: string]: any;
}

/**
 * Reciprocal Rank Fusion (RRF)
 * Combines rankings from multiple search methods
 */
function reciprocalRankFusion(
  results: Map<string, SearchResult[]>,
  k: number = 60
): SearchResult[] {
  const scores = new Map<string, { score: number; doc: SearchResult }>();

  // Process each search method's results
  for (const [method, docs] of results.entries()) {
    docs.forEach((doc, rank) => {
      const rrfScore = 1 / (k + rank + 1);

      if (scores.has(doc.id)) {
        // Document appears in multiple methods - boost it
        const existing = scores.get(doc.id)!;
        existing.score += rrfScore;
        existing.doc.method = 'hybrid';
      } else {
        scores.set(doc.id, {
          score: rrfScore,
          doc: { ...doc, method },
        });
      }
    });
  }

  // Sort by RRF score
  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .map(({ score, doc }) => ({
      ...doc,
      score,
    }));
}

/**
 * Full-text search using PostgreSQL tsvector (BM25-like)
 */
async function fulltextSearch(
  query: string,
  limit: number = 20,
  orgId?: string
): Promise<SearchResult[]> {
  try {
    // Parse query to tsquery format
    const tsquery = query
      .split(/\s+/)
      .filter(w => w.length > 0)
      .map(w => `${w}:*`)
      .join(' & ');

    let results: any[];

    if (orgId) {
      results = await prisma.$queryRaw<any[]>`
        SELECT
          id,
          "documentId",
          title,
          content,
          "docType",
          "vesselNames",
          "portNames",
          "cargoTypes",
          ts_rank_cd("contentTsv", to_tsquery('english', ${tsquery})) as rank
        FROM maritime_documents
        WHERE "contentTsv" @@ to_tsquery('english', ${tsquery})
          AND "organizationId" = ${orgId}
        ORDER BY rank DESC
        LIMIT ${limit}
      `;
    } else {
      results = await prisma.$queryRaw<any[]>`
        SELECT
          id,
          "documentId",
          title,
          content,
          "docType",
          "vesselNames",
          "portNames",
          "cargoTypes",
          ts_rank_cd("contentTsv", to_tsquery('english', ${tsquery})) as rank
        FROM maritime_documents
        WHERE "contentTsv" @@ to_tsquery('english', ${tsquery})
        ORDER BY rank DESC
        LIMIT ${limit}
      `;
    }

    return results.map(r => ({
      id: r.id,
      documentId: r.documentId,
      title: r.title,
      content: r.content,
      docType: r.docType,
      score: Number(r.rank),
      method: 'fulltext' as const,
      fulltextScore: Number(r.rank),
      vesselNames: r.vesselNames,
      portNames: r.portNames,
      cargoTypes: r.cargoTypes,
    }));
  } catch (error: any) {
    console.error('Full-text search error:', error.message);
    return [];
  }
}

/**
 * Vector similarity search
 */
async function vectorSearch(
  queryEmbedding: number[],
  limit: number = 20,
  orgId?: string
): Promise<SearchResult[]> {
  try {
    let results: any[];

    if (orgId) {
      results = await prisma.$queryRaw<any[]>`
        SELECT
          id,
          "documentId",
          title,
          content,
          "docType",
          "vesselNames",
          "portNames",
          "cargoTypes",
          1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
        FROM maritime_documents
        WHERE embedding IS NOT NULL
          AND "organizationId" = ${orgId}
        ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
        LIMIT ${limit}
      `;
    } else {
      results = await prisma.$queryRaw<any[]>`
        SELECT
          id,
          "documentId",
          title,
          content,
          "docType",
          "vesselNames",
          "portNames",
          "cargoTypes",
          1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
        FROM maritime_documents
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
        LIMIT ${limit}
      `;
    }

    return results.map(r => ({
      id: r.id,
      documentId: r.documentId,
      title: r.title,
      content: r.content,
      docType: r.docType,
      score: Number(r.similarity),
      method: 'vector' as const,
      vectorScore: Number(r.similarity),
      vesselNames: r.vesselNames,
      portNames: r.portNames,
      cargoTypes: r.cargoTypes,
    }));
  } catch (error: any) {
    console.error('Vector search error:', error.message);
    return [];
  }
}

/**
 * Hybrid search combining BM25 and vector similarity
 */
export async function hybridSearch(
  query: string,
  queryEmbedding: number[],
  options: {
    limit?: number;
    candidateLimit?: number;
    orgId?: string;
    weights?: { fulltext: number; vector: number };
  } = {}
): Promise<SearchResult[]> {
  const {
    limit = 10,
    candidateLimit = 20,
    orgId,
    weights = { fulltext: 0.5, vector: 0.5 },
  } = options;

  console.log(`🔍 Hybrid search: "${query}"`);

  // Run both searches in parallel
  const [fulltextResults, vectorResults] = await Promise.all([
    fulltextSearch(query, candidateLimit, orgId),
    vectorSearch(queryEmbedding, candidateLimit, orgId),
  ]);

  console.log(`   Full-text: ${fulltextResults.length} results`);
  console.log(`   Vector: ${vectorResults.length} results`);

  if (fulltextResults.length === 0 && vectorResults.length === 0) {
    return [];
  }

  // If only one method returned results, use it
  if (fulltextResults.length === 0) {
    console.log(`   Using vector-only results`);
    return vectorResults.slice(0, limit);
  }
  if (vectorResults.length === 0) {
    console.log(`   Using full-text-only results`);
    return fulltextResults.slice(0, limit);
  }

  // Combine using RRF
  const resultsMap = new Map<string, SearchResult[]>();
  resultsMap.set('fulltext', fulltextResults);
  resultsMap.set('vector', vectorResults);

  const combined = reciprocalRankFusion(resultsMap);

  console.log(`   Hybrid: ${combined.length} merged results`);
  console.log(`   Top result: ${combined[0]?.method} (${(combined[0]?.score * 100).toFixed(1)}% RRF)`);

  return combined.slice(0, limit);
}

/**
 * Search with automatic method selection
 */
export async function smartSearch(
  query: string,
  queryEmbedding: number[],
  options: {
    limit?: number;
    method?: 'hybrid' | 'vector' | 'fulltext';
    orgId?: string;
  } = {}
): Promise<SearchResult[]> {
  const { limit = 10, method = 'hybrid', orgId } = options;

  switch (method) {
    case 'fulltext':
      return fulltextSearch(query, limit, orgId);
    case 'vector':
      return vectorSearch(queryEmbedding, limit, orgId);
    case 'hybrid':
    default:
      return hybridSearch(query, queryEmbedding, { limit, orgId });
  }
}

export default {
  hybridSearch,
  smartSearch,
  fulltextSearch,
  vectorSearch,
};
