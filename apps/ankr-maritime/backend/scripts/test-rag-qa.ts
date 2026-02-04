/**
 * Test RAG Q&A - Retrieval-Augmented Generation
 * Combines semantic search with LLM to answer questions with source citations
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { getCachedRAG, cacheRAG } from '../src/services/rag/cache';
import { rerankWithVoyage } from '../src/services/rag/reranker';
import { setOptimalProbes } from '../src/services/rag/vector-index';
import { hybridSearch } from '../src/services/rag/hybrid-search';

const prisma = new PrismaClient();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const LLM_MODEL = process.env.LLM_MODEL || 'qwen2.5:1.5b'; // Fast, lightweight model
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
const USE_VOYAGE = process.env.USE_VOYAGE_EMBEDDINGS === 'true' && VOYAGE_API_KEY;

interface RAGAnswer {
  question: string;
  answer: string;
  sources: Array<{
    documentId: string;
    title: string;
    excerpt: string;
    similarity: number;
  }>;
  confidence: 'high' | 'medium' | 'low';
  timestamp: Date;
}

/**
 * Generate query embedding using Voyage AI or Ollama
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  if (USE_VOYAGE) {
    // Use Voyage AI for production embeddings
    try {
      const response = await axios.post(
        'https://api.voyageai.com/v1/embeddings',
        {
          input: [query],
          model: 'voyage-code-2',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${VOYAGE_API_KEY}`,
          },
        }
      );
      return response.data.data[0].embedding;
    } catch (error: any) {
      console.error('Voyage AI error:', error.response?.data || error.message);
      throw error;
    }
  } else {
    // Use Ollama for dev embeddings
    try {
      const response = await axios.post(`${OLLAMA_URL}/api/embeddings`, {
        model: 'nomic-embed-text',
        prompt: query,
      });
      return response.data.embedding;
    } catch (error: any) {
      console.error('Ollama embedding error:', error.message);
      throw error;
    }
  }
}

/**
 * Retrieve relevant documents using hybrid search (BM25 + Vector) + reranking
 */
async function retrieveContext(question: string, limit: number = 3) {
  // Generate query embedding
  const queryEmbedding = await generateQueryEmbedding(question);

  // Retrieve more candidates for reranking (2x the limit)
  const candidateLimit = limit * 3; // More candidates for hybrid search

  // Perform hybrid search (BM25 + Vector with RRF)
  const candidates = await hybridSearch(question, queryEmbedding, {
    limit: candidateLimit,
  });

  console.log(`   Hybrid search returned ${candidates.length} candidates`);

  // Rerank candidates using Voyage AI rerank-2
  const reranked = await rerankWithVoyage(
    question,
    candidates.map(c => ({
      id: c.id,
      title: c.title,
      content: c.content,
      score: c.score,
      ...c,
    })),
    limit
  );

  return reranked;
}

/**
 * Generate answer using LLM with retrieved context
 */
async function generateAnswer(question: string, context: any[]): Promise<string> {
  // Format context for LLM
  const contextText = context
    .map((doc, idx) => {
      return `[Document ${idx + 1}: ${doc.title}]\n${doc.content}\n`;
    })
    .join('\n---\n\n');

  // Create prompt
  const prompt = `You are an expert maritime operations assistant. Answer the following question based ONLY on the provided documents. If the answer is not in the documents, say so clearly.

DOCUMENTS:
${contextText}

QUESTION: ${question}

INSTRUCTIONS:
1. Answer concisely and accurately based on the documents
2. Cite document numbers when referencing information (e.g., "According to Document 1...")
3. If multiple documents are relevant, synthesize the information
4. If the documents don't contain the answer, say "I cannot find this information in the available documents."

ANSWER:`;

  try {
    // Use AI Proxy for fast LLM responses (Groq, Claude, etc.)
    const AI_PROXY_URL = process.env.AI_PROXY_URL || 'http://localhost:4444';
    const response = await axios.post(
      `${AI_PROXY_URL}/api/ai/complete`,
      {
        prompt: prompt,
        strategy: 'free_first', // Use free providers first
        maxTokens: 200,
      },
      {
        timeout: 30000, // 30s timeout (AI proxy is fast with Groq/Claude)
      }
    );

    return response.data.content || response.data.response || '';
  } catch (error: any) {
    console.error('AI Proxy error:', error.message);
    throw error;
  }
}

/**
 * Determine confidence level based on similarity scores
 */
function calculateConfidence(sources: any[]): 'high' | 'medium' | 'low' {
  if (sources.length === 0) return 'low';

  const avgSimilarity = sources.reduce((sum, s) => sum + Number(s.similarity), 0) / sources.length;

  if (avgSimilarity >= 0.7) return 'high';
  if (avgSimilarity >= 0.5) return 'medium';
  return 'low';
}

/**
 * Main RAG Q&A function
 */
async function askRAG(question: string): Promise<RAGAnswer> {
  console.log(`\n🤔 Question: "${question}"\n`);

  // Check cache first
  const cached = await getCachedRAG(question, { limit: 3 }, 'test-org');
  if (cached) {
    console.log('✨ Using cached answer\n');
    return cached;
  }

  // 1. Retrieve relevant context
  console.log('🔍 Retrieving relevant documents...');
  const contextDocs = await retrieveContext(question, 3);
  console.log(`   Found ${contextDocs.length} relevant documents\n`);

  // Show retrieved sources with rerank scores and search method
  contextDocs.forEach((doc, idx) => {
    console.log(`   ${idx + 1}. ${doc.title}`);

    // Show search method
    const methodEmoji = {
      hybrid: '🔀',
      vector: '🎯',
      fulltext: '📝',
    };
    const emoji = methodEmoji[doc.method as keyof typeof methodEmoji] || '';
    console.log(`      Method: ${emoji} ${doc.method || 'unknown'}`);

    if (doc.rerankScore !== undefined && doc.originalScore !== undefined) {
      console.log(`      Original: ${(Number(doc.originalScore) * 100).toFixed(2)}% → Reranked: ${(Number(doc.rerankScore) * 100).toFixed(2)}%`);
    } else {
      console.log(`      Similarity: ${(Number(doc.similarity || doc.score) * 100).toFixed(2)}%`);
    }
    console.log(`      Type: ${doc.docType}`);
  });

  // 2. Generate answer using LLM
  console.log('\n🧠 Generating answer with LLM...');
  const answer = await generateAnswer(question, contextDocs);

  // 3. Format sources
  const sources = contextDocs.map((doc) => ({
    documentId: doc.documentId,
    title: doc.title,
    excerpt: doc.content.substring(0, 200) + '...',
    similarity: Number(doc.rerankScore || doc.score || doc.similarity || 0),
  }));

  // 4. Calculate confidence
  const confidence = calculateConfidence(sources);

  const result = {
    question,
    answer,
    sources,
    confidence,
    timestamp: new Date(),
  };

  // Cache the result
  await cacheRAG(question, { limit: 3 }, 'test-org', result);

  return result;
}

/**
 * Format and display RAG answer
 */
function displayAnswer(result: RAGAnswer) {
  console.log('\n========================================');
  console.log('💬 RAG ANSWER');
  console.log('========================================\n');
  console.log(`Q: ${result.question}\n`);
  console.log(`A: ${result.answer}\n`);
  console.log('📚 Sources:');
  result.sources.forEach((source, idx) => {
    const stars = '⭐'.repeat(Math.ceil(source.similarity * 5));
    console.log(`\n   ${idx + 1}. ${source.title}`);
    console.log(`      Relevance: ${(source.similarity * 100).toFixed(1)}% ${stars}`);
    console.log(`      Excerpt: ${source.excerpt}`);
  });

  const confidenceEmoji = {
    high: '⭐⭐⭐⭐⭐',
    medium: '⭐⭐⭐',
    low: '⭐',
  };

  console.log(`\n📊 Confidence: ${result.confidence.toUpperCase()} ${confidenceEmoji[result.confidence]}`);
  console.log(`⏰ Timestamp: ${result.timestamp.toISOString()}\n`);
  console.log('========================================\n');
}

/**
 * Main test function
 */
async function main() {
  console.log('🚀 Testing RAG Q&A System');
  console.log('========================================\n');
  console.log(`Using LLM: ${LLM_MODEL}`);

  // Set optimal IVFFlat probes for vector search
  await setOptimalProbes();
  console.log(`Ollama URL: ${OLLAMA_URL}\n`);

  try {
    // Check Ollama is available
    console.log('Checking Ollama connection...');
    const modelsResponse = await axios.get(`${OLLAMA_URL}/api/tags`);
    const availableModels = modelsResponse.data.models.map((m: any) => m.name);
    console.log(`✅ Connected to Ollama`);
    console.log(`   Available models: ${availableModels.join(', ')}\n`);

    if (!availableModels.includes(LLM_MODEL)) {
      console.log(`⚠️  Model ${LLM_MODEL} not found. Available models:`);
      console.log(`   ${availableModels.join(', ')}`);
      console.log(`\nPlease pull the model or use an available one.`);
      console.log(`Example: docker exec mari8x-ollama ollama pull ${LLM_MODEL}\n`);
      return;
    }

    // Test 1: Demurrage rate question
    console.log('\n========== Test 1: Demurrage Rate ==========');
    const result1 = await askRAG('What is the demurrage rate and how is it calculated?');
    displayAnswer(result1);

    // Test 2: Laytime question
    console.log('\n========== Test 2: Laytime Terms ==========');
    const result2 = await askRAG('How many hours of laytime are allowed and what does SHINC mean?');
    displayAnswer(result2);

    // Test 3: Vessel details
    console.log('\n========== Test 3: Vessel Information ==========');
    const result3 = await askRAG('Tell me about the vessel Ocean Star - its specifications and flag');
    displayAnswer(result3);

    // Test 4: Freight payment
    console.log('\n========== Test 4: Freight Payment ==========');
    const result4 = await askRAG('What are the freight payment terms?');
    displayAnswer(result4);

    // Test 5: Out of scope question (should say "not in documents")
    console.log('\n========== Test 5: Out of Scope ==========');
    const result5 = await askRAG('What is the weather forecast for next week?');
    displayAnswer(result5);

    console.log('\n========================================');
    console.log('✅ RAG Q&A Tests Complete!');
    console.log('========================================\n');
    console.log('Next steps:');
    console.log('  1. Implement GraphQL API for RAG queries');
    console.log('  2. Upgrade SwayamBot to use RAG');
    console.log('  3. Build frontend search UI');
    console.log('  4. Add more documents for richer context\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
