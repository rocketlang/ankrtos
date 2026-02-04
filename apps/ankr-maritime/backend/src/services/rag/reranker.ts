/**
 * RAG Reranker Service
 * Improves search quality by reranking results using cross-encoder models
 */

import axios from 'axios';

const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
const ENABLE_RERANK = process.env.ENABLE_RERANK !== 'false';

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
  [key: string]: any;
}

export interface RerankResult extends SearchResult {
  originalScore: number;
  rerankScore: number;
}

/**
 * Rerank search results using Voyage AI rerank-2
 */
export async function rerankWithVoyage(
  query: string,
  results: SearchResult[],
  topK: number = 5
): Promise<RerankResult[]> {
  if (!ENABLE_RERANK || !VOYAGE_API_KEY) {
    console.log('⚠️  Reranking disabled or no API key, returning original results');
    return results.slice(0, topK).map(r => ({
      ...r,
      originalScore: r.score,
      rerankScore: r.score,
    }));
  }

  if (results.length === 0) {
    return [];
  }

  try {
    console.log(`🔄 Reranking ${results.length} results with Voyage AI...`);

    // Prepare documents for reranking
    const documents = results.map(r => r.content);

    const response = await axios.post(
      'https://api.voyageai.com/v1/rerank',
      {
        query,
        documents,
        model: 'rerank-2',
        top_k: topK,
        return_documents: false, // We already have the documents
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${VOYAGE_API_KEY}`,
        },
        timeout: 10000, // 10s timeout
      }
    );

    // Check if we got valid results
    if (!response.data || !response.data.data) {
      console.error('Invalid rerank response:', response.data);
      throw new Error('Invalid rerank response format');
    }

    // Map reranked results - Voyage AI uses 'data' not 'results'
    const reranked: RerankResult[] = response.data.data.map((r: any) => {
      const original = results[r.index];
      return {
        ...original,
        originalScore: original.score,
        rerankScore: r.relevance_score,
        score: r.relevance_score, // Update score to rerank score
      };
    });

    console.log(`✅ Reranked to top ${reranked.length} results`);
    if (reranked.length > 0) {
      console.log(`   Score improvement: ${reranked[0].originalScore.toFixed(3)} → ${reranked[0].rerankScore.toFixed(3)}`);
    }

    return reranked;
  } catch (error: any) {
    console.error('Reranking error:', error.response?.data || error.message);
    console.log('⚠️  Falling back to original results');

    // Fallback to original results
    return results.slice(0, topK).map(r => ({
      ...r,
      originalScore: r.score,
      rerankScore: r.score,
    }));
  }
}

/**
 * Rerank using AI Proxy (supports multiple reranking providers)
 */
export async function rerankWithAIProxy(
  query: string,
  results: SearchResult[],
  topK: number = 5
): Promise<RerankResult[]> {
  if (!ENABLE_RERANK) {
    return results.slice(0, topK).map(r => ({
      ...r,
      originalScore: r.score,
      rerankScore: r.score,
    }));
  }

  if (results.length === 0) {
    return [];
  }

  try {
    const AI_PROXY_URL = process.env.AI_PROXY_URL || 'http://localhost:4444';

    console.log(`🔄 Reranking ${results.length} results with AI Proxy...`);

    // Use AI proxy's reranking endpoint if available
    const response = await axios.post(
      `${AI_PROXY_URL}/api/ai/rerank`,
      {
        query,
        documents: results.map(r => ({
          id: r.id,
          text: r.content,
        })),
        topK,
      },
      {
        timeout: 10000,
      }
    );

    const reranked: RerankResult[] = response.data.results.map((r: any) => {
      const original = results.find(res => res.id === r.id)!;
      return {
        ...original,
        originalScore: original.score,
        rerankScore: r.score,
        score: r.score,
      };
    });

    console.log(`✅ Reranked to top ${reranked.length} results`);
    return reranked;
  } catch (error: any) {
    // If AI proxy doesn't support reranking, fall back to Voyage AI
    if (error.response?.status === 404) {
      console.log('⚠️  AI Proxy reranking not available, using Voyage AI');
      return rerankWithVoyage(query, results, topK);
    }

    console.error('Reranking error:', error.message);
    console.log('⚠️  Falling back to original results');

    return results.slice(0, topK).map(r => ({
      ...r,
      originalScore: r.score,
      rerankScore: r.score,
    }));
  }
}

/**
 * Simple scoring-based reranking (fallback when no API available)
 */
export function rerankByScore(
  results: SearchResult[],
  topK: number = 5
): RerankResult[] {
  // Sort by score and take top K
  const sorted = [...results]
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return sorted.map(r => ({
    ...r,
    originalScore: r.score,
    rerankScore: r.score,
  }));
}

/**
 * Auto-select best reranking strategy
 */
export async function rerank(
  query: string,
  results: SearchResult[],
  topK: number = 5,
  strategy: 'voyage' | 'proxy' | 'score' = 'voyage'
): Promise<RerankResult[]> {
  switch (strategy) {
    case 'voyage':
      return rerankWithVoyage(query, results, topK);
    case 'proxy':
      return rerankWithAIProxy(query, results, topK);
    case 'score':
      return rerankByScore(results, topK);
    default:
      return rerankWithVoyage(query, results, topK);
  }
}

export default {
  rerank,
  rerankWithVoyage,
  rerankWithAIProxy,
  rerankByScore,
};
