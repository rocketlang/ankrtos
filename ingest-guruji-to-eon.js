#!/usr/bin/env node
/**
 * Ingest GuruJi Documentation into ANKR EON Memory System
 * With embeddings for semantic search and AI context
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Get EON port dynamically via ankr-ctl
function getEonPort() {
  try {
    const result = execSync('bash /root/ankr-ctl.sh ports | grep ankr-eon', { encoding: 'utf-8' });
    const match = result.match(/(\d+)/);
    return match ? parseInt(match[1]) : 4005;
  } catch (err) {
    console.warn('⚠️  Could not get port from ankr-ctl, using default 4005');
    return 4005;
  }
}

const EON_PORT = getEonPort();
const EON_URL = `http://localhost:${EON_PORT}`;
const DOCS_BASE_DIR = '/root/ankr-universe-docs';
const CHUNK_SIZE = 1500; // characters per chunk
const TWO_DAYS_AGO = Date.now() - (2 * 24 * 60 * 60 * 1000);

console.log('🙏 === Jai GuruJi - Ingesting Documentation into EON === 🙏\n');
console.log(`📍 EON URL: ${EON_URL}`);
console.log(`📁 Base Dir: ${DOCS_BASE_DIR}`);
console.log(`📅 Looking for docs created in last 2 days\n`);

// Calculate file hash
function calculateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Split content into chunks
function chunkContent(content, maxSize = CHUNK_SIZE) {
  const chunks = [];
  const lines = content.split('\n');
  let currentChunk = '';
  let currentLine = 1;
  let chunkStartLine = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (currentChunk.length + line.length > maxSize && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        startLine: chunkStartLine,
        endLine: currentLine - 1
      });
      currentChunk = '';
      chunkStartLine = currentLine;
    }

    currentChunk += line + '\n';
    currentLine++;
  }

  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      startLine: chunkStartLine,
      endLine: currentLine - 1
    });
  }

  return chunks;
}

// Extract metadata from frontmatter
function extractMetadata(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return { title: null, topics: [], keywords: [] };

  const frontmatter = frontmatterMatch[1];
  const titleMatch = frontmatter.match(/title:\s*["']?(.+?)["']?\n/);
  const tagsMatch = frontmatter.match(/tags:\s*\[(.*?)\]/);

  return {
    title: titleMatch ? titleMatch[1] : null,
    topics: tagsMatch ? tagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, '')) : [],
    keywords: []
  };
}

// Generate embedding via AI Proxy
async function generateEmbedding(text) {
  try {
    const AI_PROXY_PORT = execSync('bash /root/ankr-ctl.sh ports | grep ai-proxy', { encoding: 'utf-8' }).match(/(\d+)/)?.[1] || 4444;
    const response = await fetch(`http://localhost:${AI_PROXY_PORT}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model: 'text-embedding-3-small'
      })
    });

    if (!response.ok) {
      throw new Error(`Embedding API returned ${response.status}`);
    }

    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.warn(`⚠️  Embedding failed: ${error.message}, using null`);
    return null;
  }
}

// Check if document already exists in EON
async function checkDuplicate(filePath, fileHash, prisma) {
  try {
    const relativePath = path.relative(DOCS_BASE_DIR, filePath);
    const existing = await prisma.knowledge_sources.findFirst({
      where: {
        OR: [
          { source_path: relativePath },
          { source_hash: fileHash }
        ]
      }
    });

    if (existing) {
      console.log(`   ⚠️  Already exists: ${existing.source_path} (${existing.chunk_count} chunks)`);
      return true;
    }
    return false;
  } catch (error) {
    console.warn(`   ⚠️  Could not check duplicate: ${error.message}`);
    return false;
  }
}

// Find all markdown files created in last N days
function findRecentDocs(baseDir, daysAgo = 2) {
  const cutoffTime = Date.now() - (daysAgo * 24 * 60 * 60 * 1000);
  const results = [];

  function scan(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        scan(fullPath);
      } else if (item.endsWith('.md') && !item.startsWith('.')) {
        const mtime = stats.mtimeMs;
        if (mtime >= cutoffTime) {
          results.push({
            path: fullPath,
            mtime,
            size: stats.size
          });
        }
      }
    }
  }

  scan(baseDir);
  return results.sort((a, b) => b.mtime - a.mtime); // newest first
}

// Ingest single document
async function ingestDocument(filePath, prisma) {
  const fileName = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileHash = calculateHash(content);
  const fileSize = fs.statSync(filePath).size;
  const metadata = extractMetadata(content);
  const relativePath = path.relative(DOCS_BASE_DIR, filePath);

  console.log(`\n📄 Processing: ${relativePath}`);
  console.log(`   Size: ${(fileSize / 1024).toFixed(1)} KB`);
  console.log(`   Hash: ${fileHash.substring(0, 12)}...`);

  // Check for duplicates
  if (await checkDuplicate(filePath, fileHash, prisma)) {
    return { skipped: true };
  }

  const chunks = chunkContent(content);
  console.log(`   Chunks: ${chunks.length}`);

  // Determine source type from path
  const sourceType = relativePath.includes('guruji-reports') ? 'guruji_report' : 'ankr_documentation';

  // Register source
  const sourceData = {
    source_type: sourceType,
    source_path: relativePath,
    source_hash: fileHash,
    file_size: fileSize,
    chunk_count: chunks.length,
    status: 'processing'
  };

  try {
    // Store chunks in EON
    const insertedChunks = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Generate embedding
      const embedding = await generateEmbedding(chunk.content);

      const chunkData = {
        source_type: sourceType,
        source_path: relativePath,
        source_hash: fileHash,
        source_url: `https://ankr.in/project/documents/guruji-reports/${fileName}`,
        title: metadata.title || fileName.replace('.md', ''),
        section: null,
        content: chunk.content,
        content_type: 'markdown',
        chunk_index: i,
        total_chunks: chunks.length,
        chunk_start_line: chunk.startLine,
        chunk_end_line: chunk.endLine,
        doc_type: 'guruji_documentation',
        language: 'en',
        topics: metadata.topics,
        keywords: metadata.keywords,
        embedding_model: 'text-embedding-3-small',
        embedding_generated_at: new Date().toISOString(),
        file_size: fileSize,
        embedding: embedding
      };

      insertedChunks.push(chunkData);
      process.stdout.write(`   Chunk ${i + 1}/${chunks.length} ✓ `);
    }

    // Insert via EON GraphQL API
    const mutation = `
      mutation IngestGuruJiDocumentation($chunks: [KnowledgeChunkInput!]!, $source: KnowledgeSourceInput!) {
        ingestKnowledge(chunks: $chunks, source: $source) {
          chunksInserted
          sourceId
        }
      }
    `;

    const response = await fetch(`${EON_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: mutation,
        variables: {
          chunks: insertedChunks,
          source: sourceData
        }
      })
    });

    if (!response.ok) {
      // Fallback: Direct database insert
      console.log('\n   ⚠️  GraphQL failed, using direct database insert...');

      // Insert source
      await prisma.knowledge_sources.upsert({
        where: { source_path: sourceData.source_path },
        update: {
          source_hash: sourceData.source_hash,
          file_size: sourceData.file_size,
          chunk_count: sourceData.chunk_count,
          status: 'completed',
          last_ingested_at: new Date(),
          updated_at: new Date()
        },
        create: {
          ...sourceData,
          status: 'completed',
          last_ingested_at: new Date()
        }
      });

      // Insert chunks (without embeddings for now if vector extension not available)
      for (const chunkData of insertedChunks) {
        await prisma.eon_knowledge.create({
          data: {
            source_type: chunkData.source_type,
            source_path: chunkData.source_path,
            source_hash: chunkData.source_hash,
            source_url: chunkData.source_url,
            title: chunkData.title,
            content: chunkData.content,
            content_type: chunkData.content_type,
            chunk_index: chunkData.chunk_index,
            total_chunks: chunkData.total_chunks,
            chunk_start_line: chunkData.chunk_start_line,
            chunk_end_line: chunkData.chunk_end_line,
            doc_type: chunkData.doc_type,
            language: chunkData.language,
            topics: chunkData.topics,
            keywords: chunkData.keywords,
            embedding_model: chunkData.embedding_model,
            embedding_generated_at: new Date(),
            file_size: chunkData.file_size
          }
        });
      }

      console.log(`\n   ✅ Inserted ${insertedChunks.length} chunks via Prisma`);
    } else {
      const result = await response.json();
      console.log(`\n   ✅ Inserted ${result.data?.ingestKnowledge?.chunksInserted || insertedChunks.length} chunks via GraphQL`);
    }

    return { skipped: false, chunks: insertedChunks.length };

  } catch (error) {
    console.error(`\n   ❌ Error: ${error.message}`);
    throw error;
  }
}

// Main execution
async function main() {
  let prisma;

  try {
    // Check EON health
    const healthCheck = await fetch(`${EON_URL}/health`).catch(() => null);
    if (!healthCheck || !healthCheck.ok) {
      console.error('❌ EON service not available. Start it with: bash /root/ankr-ctl.sh start ankr-eon');
      process.exit(1);
    }

    console.log('✅ EON service is running\n');

    // Initialize Prisma for duplicate checking
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://ankr:indrA@0612@localhost:5432/ankr_eon'
        }
      }
    });

    console.log('=' .repeat(80));

    // Find all markdown files created in last 2 days
    const recentDocs = findRecentDocs(DOCS_BASE_DIR, 2);
    console.log(`\n📚 Found ${recentDocs.length} documents created in last 2 days\n`);

    if (recentDocs.length === 0) {
      console.log('⚠️  No recent documents found. Exiting.');
      return;
    }

    // Show files to be processed
    console.log('📋 Files to process:');
    for (const doc of recentDocs) {
      const relativePath = path.relative(DOCS_BASE_DIR, doc.path);
      const date = new Date(doc.mtime).toISOString().split('T')[0];
      console.log(`   - ${relativePath} (${(doc.size / 1024).toFixed(1)} KB, ${date})`);
    }
    console.log('');

    // Ingest each file
    let processed = 0;
    let skipped = 0;
    let totalChunks = 0;

    for (const doc of recentDocs) {
      const result = await ingestDocument(doc.path, prisma);
      if (result.skipped) {
        skipped++;
      } else {
        processed++;
        totalChunks += result.chunks || 0;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Documentation ingestion complete!');
    console.log('\n📊 Summary:');
    console.log(`   Total files found: ${recentDocs.length}`);
    console.log(`   Processed: ${processed}`);
    console.log(`   Skipped (duplicates): ${skipped}`);
    console.log(`   Total chunks created: ${totalChunks}`);
    console.log(`   Location: ${DOCS_BASE_DIR}`);
    console.log(`   EON URL: ${EON_URL}`);
    console.log('\n🔍 You can now search this documentation via:');
    console.log('   - EON GraphQL API: /graphql');
    console.log('   - ankr5 eon search "query"');
    console.log('   - Any AI agent with EON memory access');
    console.log('\n🙏 Jai GuruJi - Knowledge Now Embedded in EON 🙏\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

// Run
main().catch(console.error);
