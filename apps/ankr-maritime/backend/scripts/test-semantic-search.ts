/**
 * Test Semantic Search with Vector Similarity
 * Tests cosine similarity search using pgvector
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

/**
 * Generate query embedding using Ollama
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
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

/**
 * Perform semantic search
 */
async function semanticSearch(query: string, limit: number = 5) {
  console.log(`\n🔍 Searching for: "${query}"\n`);

  // 1. Generate query embedding
  console.log('Generating query embedding...');
  const queryEmbedding = await generateQueryEmbedding(query);
  console.log(`✅ Generated ${queryEmbedding.length}-dim vector\n`);

  // 2. Perform vector similarity search (cosine distance)
  const results = await prisma.$queryRaw<any[]>`
    SELECT
      id,
      title,
      "docType",
      substring(content, 1, 200) as excerpt,
      1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
    FROM maritime_documents
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
    LIMIT ${limit}
  `;

  return results;
}

/**
 * Test hybrid search (text + vector)
 */
async function hybridSearch(query: string, limit: number = 5) {
  console.log(`\n🔍 Hybrid Search: "${query}"\n`);

  // 1. Generate query embedding
  const queryEmbedding = await generateQueryEmbedding(query);

  // 2. Reciprocal Rank Fusion (RRF) combining text and vector search
  const results = await prisma.$queryRaw<any[]>`
    WITH text_search AS (
      SELECT
        id,
        ts_rank("contentTsv", to_tsquery('english', ${query})) as text_score,
        ROW_NUMBER() OVER (ORDER BY ts_rank("contentTsv", to_tsquery('english', ${query})) DESC) as text_rank
      FROM maritime_documents
      WHERE "contentTsv" @@ to_tsquery('english', ${query})
    ),
    vector_search AS (
      SELECT
        id,
        1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as vector_score,
        ROW_NUMBER() OVER (ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as vector_rank
      FROM maritime_documents
      WHERE embedding IS NOT NULL
    )
    SELECT
      md.id,
      md.title,
      md."docType",
      substring(md.content, 1, 200) as excerpt,
      COALESCE(ts.text_score, 0) as text_score,
      COALESCE(vs.vector_score, 0) as vector_score,
      (COALESCE(1.0 / (ts.text_rank + 60), 0) + COALESCE(1.0 / (vs.vector_rank + 60), 0)) as rrf_score
    FROM maritime_documents md
    LEFT JOIN text_search ts ON md.id = ts.id
    LEFT JOIN vector_search vs ON md.id = vs.id
    WHERE ts.id IS NOT NULL OR vs.id IS NOT NULL
    ORDER BY rrf_score DESC
    LIMIT ${limit}
  `;

  return results;
}

/**
 * Main test function
 */
async function main() {
  console.log('🧪 Testing Semantic Search with pgvector\n');
  console.log('========================================');

  try {
    // Check if embeddings exist
    const docCount = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count, COUNT(embedding) as with_embeddings
      FROM maritime_documents
    `;

    console.log(`📊 Documents indexed: ${docCount[0].count}`);
    console.log(`📊 Documents with embeddings: ${docCount[0].with_embeddings}\n`);

    if (docCount[0].with_embeddings === '0') {
      console.log('❌ No embeddings found. Run generate-embeddings.ts first.');
      return;
    }

    // Test 1: Semantic search for demurrage
    console.log('\n========== Test 1: Semantic Search ==========');
    const test1Results = await semanticSearch('What is the demurrage rate?');

    console.log('Results:');
    test1Results.forEach((result, idx) => {
      console.log(`\n${idx + 1}. ${result.title}`);
      console.log(`   Type: ${result.docType}`);
      console.log(`   Similarity: ${(Number(result.similarity) * 100).toFixed(2)}%`);
      console.log(`   Excerpt: ${result.excerpt}...`);
    });

    // Test 2: Semantic search for laytime
    console.log('\n\n========== Test 2: Laytime Calculation ==========');
    const test2Results = await semanticSearch('How is laytime calculated in charter parties?');

    console.log('Results:');
    test2Results.forEach((result, idx) => {
      console.log(`\n${idx + 1}. ${result.title}`);
      console.log(`   Similarity: ${(Number(result.similarity) * 100).toFixed(2)}%`);
    });

    // Test 3: Semantic search for vessel details
    console.log('\n\n========== Test 3: Vessel Information ==========');
    const test3Results = await semanticSearch('Tell me about the vessel Ocean Star');

    console.log('Results:');
    test3Results.forEach((result, idx) => {
      console.log(`\n${idx + 1}. ${result.title}`);
      console.log(`   Similarity: ${(Number(result.similarity) * 100).toFixed(2)}%`);
    });

    // Test 4: Hybrid search
    console.log('\n\n========== Test 4: Hybrid Search (RRF) ==========');
    const test4Results = await hybridSearch('freight');

    console.log('Results:');
    test4Results.forEach((result, idx) => {
      console.log(`\n${idx + 1}. ${result.title}`);
      console.log(`   Text Score: ${Number(result.text_score).toFixed(4)}`);
      console.log(`   Vector Score: ${(Number(result.vector_score) * 100).toFixed(2)}%`);
      console.log(`   RRF Score: ${Number(result.rrf_score).toFixed(4)}`);
    });

    console.log('\n\n========================================');
    console.log('✅ Semantic Search Tests Complete!');
    console.log('========================================\n');
    console.log('Next steps:');
    console.log('  1. Add more documents for richer search');
    console.log('  2. Implement RAG Q&A with source citations');
    console.log('  3. Build frontend search UI\n');

  } catch (error) {
    console.error('❌ Error:', error);
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
