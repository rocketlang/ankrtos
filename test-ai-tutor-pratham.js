#!/usr/bin/env node
/**
 * Test AI Tutor with Pratham PDF Content
 * This simulates what happens when a student asks questions
 */

const { Pool } = require('pg');

const OLLAMA_URL = 'http://localhost:11434';
const AI_PROXY_URL = 'http://localhost:4444';
const DATABASE_URL = 'postgresql://ankr:indrA@0612@localhost:5432/ankr_viewer';
const DOCUMENT_ID = 'pratham-1769195982617-92x93sy70';

const pool = new Pool({ connectionString: DATABASE_URL });

// Generate embedding for query
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

// Search for relevant content
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

// Generate AI response using context
async function generateAIResponse(query, context) {
  const contextText = context.map((c, i) =>
    `[Source ${i + 1}, Page ${c.page}, ${(c.similarity * 100).toFixed(1)}% match]\n${c.text.substring(0, 300)}...`
  ).join('\n\n---\n\n');

  const systemPrompt = `You are an AI tutor helping students learn from the Pratham Quantitative Aptitude textbook.
Always cite page numbers when answering. Be helpful, clear, and use simple language.`;

  const prompt = `Context from textbook:
${contextText}

Student Question: ${query}

Based on the context above, provide a clear answer with page citations.`;

  try {
    // Try AI Proxy GraphQL
    const response = await fetch(`${AI_PROXY_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          mutation Complete($input: CompleteInput!) {
            complete(input: $input) {
              text
              model
              provider
            }
          }
        `,
        variables: {
          input: {
            prompt: prompt,
            systemPrompt: systemPrompt,
            strategy: 'fast',
            maxTokens: 500,
            temperature: 0.7
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Proxy GraphQL error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.data?.complete?.text) {
      return data.data.complete.text;
    }
    throw new Error('No response from AI Proxy');

  } catch (error) {
    console.log('   ⚠️  AI Proxy failed, using Ollama direct...');

    // Fallback to Ollama direct
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:1.5b',
        prompt: `${systemPrompt}\n\n${prompt}`,
        stream: false,
      }),
    });

    const data = await response.json();
    return data.response || 'No response generated';
  }
}

// Main test function
async function testAITutor() {
  console.log('🎓 Testing AI Tutor with Pratham Content\n');
  console.log('═'.repeat(70));

  const testQuestions = [
    {
      q: "What topics are covered in the quantitative aptitude book?",
      expectation: "Should list math topics like algebra, probability, etc."
    },
    {
      q: "How do I solve algebra problems step by step?",
      expectation: "Should explain algebra problem-solving methods"
    },
    {
      q: "Explain the concept of probability with an example",
      expectation: "Should explain probability from the textbook"
    },
    {
      q: "What is the difference between HCF and LCM?",
      expectation: "Should explain HCF vs LCM"
    },
    {
      q: "Give me tips for solving quantitative aptitude questions quickly",
      expectation: "Should provide study tips from the book"
    }
  ];

  for (let i = 0; i < testQuestions.length; i++) {
    const { q, expectation } = testQuestions[i];

    console.log(`\n\n📝 Test ${i + 1}/${testQuestions.length}`);
    console.log('─'.repeat(70));
    console.log(`Question: "${q}"`);
    console.log(`Expected: ${expectation}`);
    console.log();

    try {
      // Step 1: Search for relevant content
      console.log('🔍 Searching textbook...');
      const startSearch = Date.now();
      const context = await searchRelevantContent(q, 3);
      const searchTime = Date.now() - startSearch;
      console.log(`✅ Found ${context.length} relevant sections (${searchTime}ms)`);

      // Show context sources
      context.forEach((c, idx) => {
        console.log(`   ${idx + 1}. Page ${c.page} (${(c.similarity * 100).toFixed(1)}% match)`);
      });

      // Step 2: Generate AI response
      console.log('\n🤖 Generating AI response...');
      const startAI = Date.now();
      const answer = await generateAIResponse(q, context);
      const aiTime = Date.now() - startAI;
      console.log(`✅ Response generated (${aiTime}ms)`);

      // Show answer
      console.log('\n💬 AI Tutor Answer:');
      console.log('─'.repeat(70));
      console.log(answer.substring(0, 500) + (answer.length > 500 ? '...' : ''));
      console.log('─'.repeat(70));

      // Show performance
      console.log(`\n⏱️  Total time: ${searchTime + aiTime}ms (Search: ${searchTime}ms, AI: ${aiTime}ms)`);

      // Wait between tests
      if (i < testQuestions.length - 1) {
        console.log('\n⏳ Waiting 2 seconds before next test...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.error(`\n❌ Test failed:`, error.message);
    }
  }

  console.log('\n\n═'.repeat(70));
  console.log('✅ AI Tutor Testing Complete!\n');

  await pool.end();
}

// Run tests
testAITutor().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
