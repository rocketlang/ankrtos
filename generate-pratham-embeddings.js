#!/usr/bin/env node
/**
 * Generate embeddings for Pratham PDF
 * This enables semantic search and AI Q&A
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PRATHAM_PDF = '/root/ankr-labs-nx/node_modules/@ankr/interact/data/pdfs/6 Bookset QA - Comprehensive Book with First page (ISBN).pdf';
const DOCUMENT_ID = 'pratham-1769195982617-92x93sy70';
const EON_URL = 'http://localhost:4005';
const AI_PROXY_URL = 'http://localhost:4444';

console.log('🎓 Generating embeddings for Pratham PDF...\n');

// Step 1: Extract full text from PDF
console.log('📄 Step 1: Extracting text from PDF (268 pages)...');
let fullText = '';
try {
  fullText = execSync(`pdftotext "${PRATHAM_PDF}" -`, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
  console.log(`✅ Extracted ${fullText.length} characters\n`);
} catch (error) {
  console.error('❌ Failed to extract PDF text:', error.message);
  process.exit(1);
}

// Step 2: Chunk the text into manageable pieces (for better embeddings)
console.log('✂️  Step 2: Chunking text into sections...');
const CHUNK_SIZE = 2000; // characters per chunk
const CHUNK_OVERLAP = 200; // overlap between chunks

function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);

    // Only add non-empty chunks
    if (chunk.trim().length > 50) {
      chunks.push({
        text: chunk.trim(),
        startChar: start,
        endChar: end,
        page: Math.floor(start / (text.length / 268)) + 1, // Approximate page
      });
    }

    start += chunkSize - overlap;
  }

  return chunks;
}

const chunks = chunkText(fullText);
console.log(`✅ Created ${chunks.length} chunks\n`);

// Step 3: Generate embeddings and store in EON
console.log('🧠 Step 3: Generating embeddings and storing in EON...');
console.log('   (This will take ~5-10 minutes for 268 pages)\n');

async function generateEmbeddings() {
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    try {
      // Call EON to store with embeddings
      const response = await fetch(`${EON_URL}/api/memory/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: chunk.text,
          type: 'semantic',
          category: 'education',
          entityId: DOCUMENT_ID,
          entityType: 'document',
          tags: ['pratham', 'education', 'qa-book'],
          metadata: {
            documentId: DOCUMENT_ID,
            title: 'Pratham QA Book',
            chunkIndex: i,
            totalChunks: chunks.length,
            page: chunk.page,
            startChar: chunk.startChar,
            endChar: chunk.endChar,
            source: 'pratham-pdf',
          },
        }),
      });

      if (response.ok) {
        successCount++;
        process.stdout.write(`\r   Progress: ${successCount}/${chunks.length} chunks (${Math.round(successCount/chunks.length*100)}%)`);
      } else {
        failCount++;
        console.error(`\n⚠️  Failed chunk ${i}:`, await response.text());
      }

      // Rate limit: 10 requests per second
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      failCount++;
      console.error(`\n❌ Error processing chunk ${i}:`, error.message);
    }
  }

  console.log('\n');
  return { successCount, failCount };
}

// Run the embedding generation
(async () => {
  try {
    const { successCount, failCount } = await generateEmbeddings();

    console.log('\n✅ Embedding generation complete!');
    console.log(`   - Success: ${successCount}/${chunks.length} chunks`);
    if (failCount > 0) {
      console.log(`   - Failed: ${failCount} chunks`);
    }
    console.log('\n🎉 Pratham PDF is now ready for AI Q&A!\n');

    // Test semantic search
    console.log('🧪 Testing semantic search...');
    const testQuery = 'What are the main topics covered in this book?';
    console.log(`   Query: "${testQuery}"\n`);

    const searchResponse = await fetch(`${EON_URL}/api/memory/search?q=${encodeURIComponent(testQuery)}&limit=3&entityId=${DOCUMENT_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (searchResponse.ok) {
      const results = await searchResponse.json();
      console.log('✅ Semantic search working!');
      console.log(`   Found ${results.results?.length || 0} relevant sections\n`);

      if (results.results && results.results.length > 0) {
        console.log('📝 Top result preview:');
        const topResult = results.results[0];
        console.log(`   Page ${topResult.metadata?.page || '?'}: ${topResult.content.slice(0, 150)}...\n`);
      }
    } else {
      console.log('⚠️  Semantic search test failed (but embeddings are stored)\n');
    }

    console.log('🎯 Next steps:');
    console.log('   1. Test AI Tutor: https://ankrlms.ankr.in/platform/ai-tutor');
    console.log('   2. Ask questions about Pratham content');
    console.log('   3. Create demo accounts for stakeholders');
    console.log('   4. Schedule demo call with Ankit & Pranav\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
})();
