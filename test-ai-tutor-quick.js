#!/usr/bin/env node
/**
 * Quick AI Tutor Test - Just one question
 */

const { Pool } = require('pg');

const OLLAMA_URL = 'http://localhost:11434';
const AI_PROXY_URL = 'http://localhost:4444';
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

async function searchRelevantContent(query, limit = 3) {
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
     LIMIT $3`,
    [JSON.stringify(embedding), DOCUMENT_ID, limit]
  );

  return result.rows.map(row => {
    const content = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
    return {
      text: content.text || content,
      page: content.metadata?.page || '?',
      similarity: row.similarity,
    };
  });
}

async function generateAIResponse(query, context) {
  const contextText = context.map((c, i) =>
    `[Page ${c.page}] ${c.text.substring(0, 400)}...`
  ).join('\n\n');

  const systemPrompt = `You are a helpful AI tutor for the Pratham Quantitative Aptitude textbook. Keep answers concise and cite page numbers.`;

  const prompt = `Textbook context:\n${contextText}\n\nStudent: ${query}\n\nTutor:`;

  try {
    // Try AI Proxy GraphQL
    const response = await fetch(`${AI_PROXY_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation Complete($input: CompleteInput!) {
          complete(input: $input) { text model provider }
        }`,
        variables: {
          input: {
            prompt: prompt,
            systemPrompt: systemPrompt,
            strategy: 'fast',
            maxTokens: 300,
            temperature: 0.7
          }
        }
      }),
    });

    const data = await response.json();
    if (data.data?.complete?.text) {
      return { text: data.data.complete.text, method: 'AI Proxy GraphQL' };
    }
    throw new Error('No AI Proxy response');

  } catch (error) {
    // Fallback to Ollama
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:1.5b',
        prompt: `${systemPrompt}\n\n${prompt}`,
        stream: false,
        options: { num_predict: 300 }
      }),
    });

    const data = await response.json();
    return { text: data.response || 'No response', method: 'Ollama Direct' };
  }
}

async function quickTest() {
  console.log('🎓 Quick AI Tutor Test\n');

  const question = "What is the book about and what topics does it cover?";

  console.log(`Question: "${question}"\n`);

  // Search
  console.log('🔍 Searching textbook...');
  const startSearch = Date.now();
  const context = await searchRelevantContent(question, 3);
  const searchTime = Date.now() - startSearch;

  console.log(`✅ Found ${context.length} sections (${searchTime}ms)`);
  context.forEach((c, i) => {
    console.log(`   ${i+1}. Page ${c.page} (${(c.similarity*100).toFixed(1)}% match)`);
  });

  // Generate response
  console.log('\n🤖 Generating AI response...');
  const startAI = Date.now();
  const { text, method } = await generateAIResponse(question, context);
  const aiTime = Date.now() - startAI;

  console.log(`✅ Response generated via ${method} (${aiTime}ms)\n`);

  console.log('💬 AI Tutor Answer:');
  console.log('─'.repeat(70));
  console.log(text);
  console.log('─'.repeat(70));

  console.log(`\n⏱️  Total: ${searchTime + aiTime}ms (Search: ${searchTime}ms, AI: ${aiTime}ms)`);
  console.log('\n✅ Test Complete!\n');

  await pool.end();
}

quickTest().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
