#!/usr/bin/env node
/**
 * Generate embeddings for Pratham PDF using AI Proxy + Voyage AI
 * Stores in ANKR LMS database (ankr_viewer) SearchIndex table
 */

const { execSync } = require('child_process');
const { Pool } = require('pg');

const PRATHAM_PDF = '/root/ankr-labs-nx/node_modules/@ankr/interact/data/pdfs/6 Bookset QA - Comprehensive Book with First page (ISBN).pdf';
const DOCUMENT_ID = 'pratham-1769195982617-92x93sy70';
const AI_PROXY_URL = 'http://localhost:4444';
const DATABASE_URL = 'postgresql://ankr:indrA@0612@localhost:5432/ankr_viewer';

console.log('🎓 ANKR LMS - Pratham PDF Embedding Generation\n');
console.log('   Using: AI Proxy + Voyage AI');
console.log('   Database: ankr_viewer');
console.log('   Document: 268 pages\n');

// PostgreSQL connection
const pool = new Pool({
  connectionString: DATABASE_URL,
});

// Step 1: Enable pgvector extension
async function enablePgVector() {
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector');
    console.log('✅ pgvector extension enabled\n');
  } catch (error) {
    console.warn('⚠️  pgvector extension not available (continuing without it)');
    console.warn('   Note: Install pgvector for better performance: apt install postgresql-pgvector\n');
  }
}

// Step 2: Extract text from PDF
function extractText() {
  console.log('📄 Extracting text from PDF...');
  try {
    const text = execSync(`pdftotext "${PRATHAM_PDF}" -`, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
    });
    console.log(`✅ Extracted ${text.length} characters\n`);
    return text;
  } catch (error) {
    console.error('❌ Failed to extract PDF text:', error.message);
    process.exit(1);
  }
}

// Step 3: Chunk text
function chunkText(text, chunkSize = 1500, overlap = 150) {
  console.log('✂️  Chunking text...');
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();

    if (chunk.length > 50) {
      chunks.push({
        text: chunk,
        startChar: start,
        endChar: end,
        page: Math.floor(start / (text.length / 268)) + 1,
      });
    }

    start += chunkSize - overlap;
  }

  console.log(`✅ Created ${chunks.length} chunks\n`);
  return chunks;
}

// Step 4: Generate embedding using AI Proxy + Voyage
async function generateEmbedding(text) {
  try {
    const response = await fetch(`${AI_PROXY_URL}/api/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model: 'voyage',  // Use Voyage AI for embeddings
        provider: 'voyage',
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Proxy error: ${response.statusText}`);
    }

    const data = await response.json();

    // Handle different response formats
    if (data.embedding) {
      return data.embedding;
    } else if (data.embeddings && data.embeddings[0]) {
      return data.embeddings[0];
    } else if (data.data && data.data[0] && data.data[0].embedding) {
      return data.data[0].embedding;
    } else {
      throw new Error('Unexpected embedding response format');
    }
  } catch (error) {
    // Fallback to OpenAI if Voyage fails
    console.warn(`   ⚠️  Voyage AI failed, trying OpenAI fallback...`);
    return await generateEmbeddingOpenAI(text);
  }
}

// Fallback: OpenAI embeddings
async function generateEmbeddingOpenAI(text) {
  const response = await fetch(`${AI_PROXY_URL}/api/embed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model: 'text-embedding-3-small',
      provider: 'openai',
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embedding failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.embedding) {
    return data.embedding;
  } else if (data.data && data.data[0] && data.data[0].embedding) {
    return data.data[0].embedding;
  } else {
    throw new Error('OpenAI embedding response invalid');
  }
}

// Step 5: Store embeddings in database
async function storeEmbedding(documentId, chunkIndex, content, embedding, metadata) {
  const id = `${documentId}-chunk-${chunkIndex}`;

  // Create metadata JSON
  const meta = {
    documentId,
    chunkIndex,
    page: metadata.page,
    startChar: metadata.startChar,
    endChar: metadata.endChar,
    title: 'Pratham QA Book',
    source: 'pratham-pdf',
  };

  // Store in SearchIndex table
  await pool.query(
    `INSERT INTO "SearchIndex" (id, "documentId", content, embedding, "updatedAt")
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (id) DO UPDATE
     SET content = $3, embedding = $4, "updatedAt" = NOW()`,
    [id, documentId, JSON.stringify({ text: content, metadata: meta }), embedding]
  );
}

// Step 6: Process all chunks
async function processChunks(chunks) {
  console.log('🧠 Generating embeddings using AI Proxy + Voyage AI...');
  console.log('   (This will take ~10-15 minutes for 268 pages)\n');

  let successCount = 0;
  let failCount = 0;
  const batchSize = 5; // Process 5 at a time

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, Math.min(i + batchSize, chunks.length));

    try {
      // Generate embeddings in parallel for batch
      const embeddings = await Promise.all(
        batch.map(chunk => generateEmbedding(chunk.text))
      );

      // Store all in database
      await Promise.all(
        batch.map((chunk, idx) =>
          storeEmbedding(DOCUMENT_ID, i + idx, chunk.text, embeddings[idx], chunk)
        )
      );

      successCount += batch.length;
      const progress = Math.round((successCount / chunks.length) * 100);
      process.stdout.write(`\r   Progress: ${successCount}/${chunks.length} chunks (${progress}%)`);

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      failCount += batch.length;
      console.error(`\n⚠️  Batch ${Math.floor(i / batchSize)} failed:`, error.message);
    }
  }

  console.log('\n');
  return { successCount, failCount };
}

// Step 7: Test semantic search
async function testSearch(query) {
  console.log('🧪 Testing semantic search...');
  console.log(`   Query: "${query}"\n`);

  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Find similar chunks using cosine similarity
    // Note: This is a simple implementation. For production, use pgvector operators
    const result = await pool.query(
      `SELECT
         id,
         "documentId",
         content,
         (1 - (embedding <=> $1::vector)) as similarity
       FROM "SearchIndex"
       WHERE "documentId" = $2
       ORDER BY embedding <=> $1::vector
       LIMIT 3`,
      [JSON.stringify(queryEmbedding), DOCUMENT_ID]
    );

    if (result.rows.length > 0) {
      console.log('✅ Semantic search working!');
      console.log(`   Found ${result.rows.length} relevant sections\n`);

      result.rows.forEach((row, idx) => {
        const content = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
        const text = content.text || content;
        const page = content.metadata?.page || '?';
        const similarity = (row.similarity * 100).toFixed(1);

        console.log(`   ${idx + 1}. Page ${page} (${similarity}% match)`);
        console.log(`      ${text.slice(0, 120)}...\n`);
      });
    } else {
      console.log('⚠️  No results found (but embeddings are stored)\n');
    }

  } catch (error) {
    console.error('❌ Search test failed:', error.message);
    console.log('   Note: Make sure pgvector extension is installed\n');
  }
}

// Main execution
(async () => {
  try {
    // Setup
    await enablePgVector();

    // Extract and chunk
    const fullText = extractText();
    const chunks = chunkText(fullText);

    // Generate and store embeddings
    const { successCount, failCount } = await processChunks(chunks);

    console.log('✅ Embedding generation complete!');
    console.log(`   - Success: ${successCount}/${chunks.length} chunks`);
    if (failCount > 0) {
      console.log(`   - Failed: ${failCount} chunks`);
    }
    console.log('\n🎉 Pratham PDF is now ready for AI Q&A!\n');

    // Test search
    await testSearch('What topics are covered in quantitative aptitude?');

    // Next steps
    console.log('🎯 Next steps:');
    console.log('   1. Test AI Tutor: https://ankrlms.ankr.in/platform/ai-tutor');
    console.log('   2. Ask questions about Pratham content');
    console.log('   3. The AI will search these embeddings for answers');
    console.log('   4. Create demo accounts for Ankit & Pranav\n');

    await pool.end();

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    await pool.end();
    process.exit(1);
  }
})();
