#!/usr/bin/env node
/**
 * Test Pratham PDF semantic search quality
 */

const { Pool } = require('pg');

const OLLAMA_URL = 'http://localhost:11434';
const DATABASE_URL = 'postgresql://ankr:indrA@0612@localhost:5432/ankr_viewer';
const DOCUMENT_ID = 'pratham-1769195982617-92x93sy70';

const pool = new Pool({ connectionString: DATABASE_URL });

async function generateEmbedding(text) {
  const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'nomic-embed-text',
      prompt: text,
    }),
  });
  const data = await response.json();
  return data.embedding;
}

async function searchPratham(query) {
  const embedding = await generateEmbedding(query);

  const result = await pool.query(
    `SELECT
       id,
       "documentId",
       content,
       1 - (embedding::vector <=> $1::vector) as similarity
     FROM "SearchIndex"
     WHERE "documentId" = $2
     ORDER BY embedding::vector <=> $1::vector
     LIMIT 5`,
    [JSON.stringify(embedding), DOCUMENT_ID]
  );

  return result.rows;
}

async function runTests() {
  console.log('🧪 Testing Pratham PDF Semantic Search\n');

  const testQueries = [
    'What topics are covered in quantitative aptitude?',
    'How do I solve algebra problems?',
    'What is the Pythagorean theorem?',
    'Explain probability concepts',
    'What are arithmetic progressions?'
  ];

  for (const query of testQueries) {
    console.log(`\n📝 Query: "${query}"`);
    console.log('─'.repeat(60));

    const results = await searchPratham(query);

    results.forEach((row, idx) => {
      const content = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
      const text = content.text || content;
      const page = content.metadata?.page || '?';
      const similarity = (row.similarity * 100).toFixed(1);

      console.log(`\n${idx + 1}. Page ${page} (${similarity}% match)`);
      console.log(`   ${text.slice(0, 150).replace(/\n/g, ' ')}...`);
    });

    console.log('\n');
  }

  console.log('✅ All tests complete!\n');
  await pool.end();
}

runTests().catch(console.error);
