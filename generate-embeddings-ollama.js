#!/usr/bin/env node
/**
 * Generate embeddings for Pratham PDF using LOCAL Ollama
 * Fast, free, and stores directly in ANKR LMS database
 */

const { execSync } = require('child_process');
const { Pool } = require('pg');

const PRATHAM_PDF = '/root/ankr-labs-nx/node_modules/@ankr/interact/data/pdfs/6 Bookset QA - Comprehensive Book with First page (ISBN).pdf';
const DOCUMENT_ID = 'pratham-1769195982617-92x93sy70';
const OLLAMA_URL = 'http://localhost:11434';
const DATABASE_URL = 'postgresql://ankr:indrA@0612@localhost:5432/ankr_viewer';
const EMBEDDING_MODEL = 'nomic-embed-text'; // Free, fast, 768 dimensions

console.log('🎓 ANKR LMS - Pratham PDF Embedding Generation\n');
console.log('   Using: LOCAL Ollama (FREE & FAST!)');
console.log('   Model: nomic-embed-text (768d)');
console.log('   Database: ankr_viewer');
console.log('   Document: 268 pages\n');

// PostgreSQL connection
const pool = new Pool({
  connectionString: DATABASE_URL,
});

// Step 1: Check/Pull embedding model
async function ensureModel() {
  console.log('🔍 Checking Ollama model...');
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    const data = await response.json();
    const hasModel = data.models?.some(m => m.name.includes('nomic-embed'));

    if (!hasModel) {
      console.log('📥 Pulling nomic-embed-text model (one-time, ~274MB)...');
      execSync(`curl -s ${OLLAMA_URL}/api/pull -d '{"name":"${EMBEDDING_MODEL}"}' | tail -1`, {
        stdio: 'inherit'
      });
      console.log('✅ Model ready!\n');
    } else {
      console.log('✅ Model already available\n');
    }
  } catch (error) {
    console.error('❌ Ollama not available. Start it with: ollama serve');
    process.exit(1);
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
function chunkText(text, chunkSize = 1000, overlap = 100) {
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

// Step 4: Generate embedding using LOCAL Ollama
async function generateEmbedding(text) {
  const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      prompt: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.embedding;
}

// Step 5: Store embeddings in database
async function storeEmbedding(documentId, chunkIndex, content, embedding, metadata) {
  const id = `${documentId}-chunk-${chunkIndex}`;

  const meta = {
    documentId,
    chunkIndex,
    page: metadata.page,
    startChar: metadata.startChar,
    endChar: metadata.endChar,
    title: 'Pratham QA Book',
    source: 'pratham-pdf',
  };

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
  console.log('🧠 Generating embeddings with LOCAL Ollama...');
  console.log('   (This will take ~5-8 minutes for 268 pages)\n');

  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    try {
      // Generate embedding
      const embedding = await generateEmbedding(chunk.text);

      // Store in database
      await storeEmbedding(DOCUMENT_ID, i, chunk.text, embedding, chunk);

      successCount++;
      const progress = Math.round((successCount / chunks.length) * 100);
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const rate = successCount / elapsed;
      const remaining = Math.round((chunks.length - successCount) / rate);

      process.stdout.write(
        `\r   Progress: ${successCount}/${chunks.length} (${progress}%) - ${elapsed}s elapsed, ~${remaining}s remaining`
      );

    } catch (error) {
      failCount++;
      console.error(`\n⚠️  Chunk ${i} failed:`, error.message);
    }
  }

  console.log('\n');
  return { successCount, failCount, totalTime: Math.round((Date.now() - startTime) / 1000) };
}

// Step 7: Test semantic search
async function testSearch(query) {
  console.log('🧪 Testing semantic search...');
  console.log(`   Query: "${query}"\n`);

  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Find similar chunks using cosine similarity
    const result = await pool.query(
      `SELECT
         id,
         "documentId",
         content,
         1 - (embedding <=> $1::vector) as similarity
       FROM "SearchIndex"
       WHERE "documentId" = $2
       ORDER BY embedding <=> $1::vector
       LIMIT 5`,
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
      console.log('⚠️  No results found\n');
    }

  } catch (error) {
    console.error('❌ Search test failed:', error.message);
  }
}

// Main execution
(async () => {
  try {
    // Setup
    await ensureModel();

    // Extract and chunk
    const fullText = extractText();
    const chunks = chunkText(fullText);

    // Generate and store embeddings
    const { successCount, failCount, totalTime } = await processChunks(chunks);

    console.log('✅ Embedding generation complete!');
    console.log(`   - Success: ${successCount}/${chunks.length} chunks`);
    if (failCount > 0) {
      console.log(`   - Failed: ${failCount} chunks`);
    }
    console.log(`   - Total time: ${totalTime} seconds`);
    console.log(`   - Rate: ${(successCount / totalTime).toFixed(1)} chunks/sec\n`);

    console.log('🎉 Pratham PDF is now ready for AI Q&A!\n');

    // Test search
    await testSearch('What topics are covered in quantitative aptitude?');
    await testSearch('How to solve algebra problems?');

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
