#!/usr/bin/env bun

/**
 * ANKR Publish - Universal Document Publishing System
 *
 * Auto-detects, indexes, and deploys documents with:
 * - File Index (metadata)
 * - Vector Embeddings (semantic search)
 * - PageIndex (large PDFs)
 * - Nginx configuration
 * - Service restart
 * - Cache clearing
 *
 * Usage:
 *   ankr-publish /path/to/document.pdf
 *   ankr-publish /path/to/project-directory
 *   ankr-publish --project pratham-telehub
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn, execSync } = require('child_process');

const pool = new Pool({
  connectionString: 'postgresql://ankr:indrA@0612@localhost:5432/ankr_eon',
});

// Configuration
const CONFIG = {
  smallFileThreshold: 100, // pages - below this use File Index + Vector
  largeFileThreshold: 100, // pages - above this use PageIndex
  chunkSize: 1000, // characters per chunk for vector embeddings
  autoEmbed: true, // automatically generate embeddings
  autoPageIndex: true, // automatically create PageIndex for large files
  aiProxyUrl: 'http://localhost:4444',
  services: {
    hybridSearch: 'ankr-hybrid-search',
    aiProxy: 'ai-proxy',
  },
};

// Color output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${'='.repeat(80)}`, 'blue');
  log(`STEP ${step}: ${message}`, 'bright');
  log('='.repeat(80), 'blue');
}

/**
 * Get PDF page count
 */
function getPdfPageCount(pdfPath) {
  try {
    const output = execSync(`pdfinfo "${pdfPath}" | grep Pages`).toString();
    const match = output.match(/Pages:\s+(\d+)/);
    return match ? parseInt(match[1]) : 0;
  } catch (error) {
    log(`⚠️  Could not get page count for ${pdfPath}`, 'yellow');
    return 0;
  }
}

/**
 * Extract text from PDF
 */
function extractPdfText(pdfPath) {
  try {
    return execSync(`pdftotext "${pdfPath}" -`).toString();
  } catch (error) {
    log(`⚠️  Could not extract text from ${pdfPath}`, 'yellow');
    return '';
  }
}

/**
 * Extract metadata from file
 */
function extractMetadata(filePath) {
  const stats = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath, ext);

  const metadata = {
    path: filePath,
    filename: basename,
    extension: ext,
    size: stats.size,
    doc_type: ext.replace('.', ''),
    category: 'general',
    tags: [],
    language: 'en',
  };

  // Infer category and tags from filename
  const lower = basename.toLowerCase();
  if (lower.includes('pratham') || lower.includes('schoolbook')) {
    metadata.category = 'education';
    metadata.tags.push('pratham', 'schoolbook');
    metadata.project = 'pratham-telehub';
  } else if (lower.includes('ankr') || lower.includes('docs')) {
    metadata.category = 'documentation';
    metadata.tags.push('ankr-docs');
    metadata.project = 'ankr-docs';
  } else if (lower.includes('lab')) {
    metadata.project = 'ankr-labs';
  }

  // Get PDF-specific metadata
  if (ext === '.pdf') {
    metadata.pages = getPdfPageCount(filePath);
  }

  return metadata;
}

/**
 * Chunk text for embeddings
 */
function chunkText(text, chunkSize = CONFIG.chunkSize) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // Try to break at sentence boundary
    if (end < text.length) {
      const nextPeriod = text.indexOf('.', end);
      const nextNewline = text.indexOf('\n', end);
      const boundary = Math.min(
        nextPeriod === -1 ? Infinity : nextPeriod,
        nextNewline === -1 ? Infinity : nextNewline
      );
      if (boundary !== Infinity && boundary < end + 200) {
        end = boundary + 1;
      }
    }

    chunks.push(text.substring(start, end).trim());
    start = end;
  }

  return chunks.filter(c => c.length > 50); // Filter out tiny chunks
}

/**
 * Generate embedding via AI Proxy
 */
async function generateEmbedding(text) {
  try {
    const response = await fetch(`${CONFIG.aiProxyUrl}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation Embed($text: String!) {
          embed(text: $text) {
            embedding
          }
        }`,
        variables: { text },
      }),
    });

    const data = await response.json();
    return data.data?.embed?.embedding || null;
  } catch (error) {
    log(`⚠️  Embedding failed: ${error.message}`, 'yellow');
    return null;
  }
}

/**
 * Add document to file index
 */
async function addToFileIndex(metadata) {
  const docId = crypto.createHash('md5').update(metadata.path).digest('hex').substring(0, 32);
  const contentHash = crypto.createHash('sha256')
    .update(fs.readFileSync(metadata.path))
    .digest('hex');

  await pool.query(`
    INSERT INTO ankr_indexed_documents (
      id,
      file_path,
      title,
      content_hash,
      file_size,
      doc_type,
      project,
      category,
      tags,
      language,
      metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (file_path) DO UPDATE SET
      title = EXCLUDED.title,
      metadata = EXCLUDED.metadata,
      updated_at = NOW()
    RETURNING id;
  `, [
    docId,
    metadata.path,
    metadata.filename,
    contentHash,
    metadata.size,
    metadata.doc_type,
    metadata.project || 'default',
    metadata.category,
    metadata.tags,
    metadata.language,
    { pages: metadata.pages },
  ]);

  log(`✅ Added to file index: ${docId}`, 'green');
  return docId;
}

/**
 * Add chunks with embeddings
 */
async function addChunksWithEmbeddings(documentId, chunks, metadata) {
  log(`\n📦 Processing ${chunks.length} chunks for embeddings...`);

  let embedded = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkId = crypto.createHash('md5')
      .update(`${documentId}-${i}`)
      .digest('hex')
      .substring(0, 32);

    // Generate embedding
    const embedding = CONFIG.autoEmbed ? await generateEmbedding(chunk) : null;

    if (embedding) {
      embedded++;
      process.stdout.write(`\r   Embedded ${embedded}/${chunks.length} chunks...`);
    }

    // Store chunk
    await pool.query(`
      INSERT INTO ankr_indexed_chunks (
        id,
        document_id,
        chunk_index,
        content,
        content_hash,
        chunk_type,
        metadata,
        embedding,
        total_chunks,
        start_pos,
        end_pos
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        content = EXCLUDED.content,
        embedding = EXCLUDED.embedding;
    `, [
      chunkId,
      documentId,
      i,
      chunk,
      crypto.createHash('sha256').update(chunk).digest('hex'),
      'text',
      { source: metadata.filename },
      embedding ? `[${embedding.join(',')}]` : null,
      chunks.length,
      i * CONFIG.chunkSize,
      (i + 1) * CONFIG.chunkSize,
    ]);

    // Rate limit to avoid overwhelming AI proxy
    if (embedding) await new Promise(r => setTimeout(r, 100));
  }

  console.log(''); // newline after progress
  log(`✅ Stored ${chunks.length} chunks (${embedded} with embeddings)`, 'green');
}

/**
 * Create PageIndex for large PDF
 */
async function createPageIndex(metadata) {
  log(`\n📚 Creating PageIndex for large PDF (${metadata.pages} pages)...`);

  const pythonPath = '/usr/bin/python3';
  const pageindexScript = '/root/ankr-labs-nx/packages/ankr-pageindex-vendor/pageindex.py';

  return new Promise((resolve, reject) => {
    const proc = spawn(pythonPath, [
      pageindexScript,
      '--pdf_path', metadata.path,
      '--max-pages-per-node', '10',
      '--max-tokens-per-node', '20000',
    ]);

    let output = '';
    proc.stdout.on('data', data => {
      output += data.toString();
      process.stdout.write('.');
    });

    proc.stderr.on('data', data => {
      process.stderr.write(data);
    });

    proc.on('close', code => {
      console.log(''); // newline after dots
      if (code === 0) {
        log('✅ PageIndex created successfully', 'green');
        resolve(output);
      } else {
        reject(new Error(`PageIndex failed with code ${code}`));
      }
    });
  });
}

/**
 * Store PageIndex in database
 */
async function storePageIndex(metadata, structureFile) {
  if (!fs.existsSync(structureFile)) {
    log(`⚠️  PageIndex structure file not found: ${structureFile}`, 'yellow');
    return;
  }

  const structure = JSON.parse(fs.readFileSync(structureFile, 'utf8'));
  const documentId = `pageindex-${crypto.createHash('md5').update(metadata.path).digest('hex')}`;

  await pool.query(`
    INSERT INTO document_indexes (
      document_id,
      index_type,
      index_data,
      metadata,
      version
    ) VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (document_id) DO UPDATE SET
      index_data = EXCLUDED.index_data,
      updated_at = NOW();
  `, [
    documentId,
    'pageindex_tree',
    structure,
    {
      source: metadata.filename,
      project: metadata.project,
      total_pages: metadata.pages,
      total_chapters: structure.structure?.length || 0,
    },
    '1.0',
  ]);

  log(`✅ PageIndex stored in database: ${documentId}`, 'green');
}

/**
 * Restart services
 */
function restartServices() {
  log('\n🔄 Restarting services...');

  try {
    execSync('pm2 restart ankr-hybrid-search', { stdio: 'inherit' });
    log('✅ ankr-hybrid-search restarted', 'green');
  } catch (error) {
    log('⚠️  Could not restart ankr-hybrid-search', 'yellow');
  }
}

/**
 * Clear Cloudflare cache
 */
function clearCloudflareCache() {
  log('\n🌐 Clearing Cloudflare cache...');
  log('⚠️  Cloudflare cache clearing not yet implemented', 'yellow');
  log('   Manual: Cloudflare Dashboard > Caching > Purge Everything', 'yellow');
}

/**
 * Verify deployment
 */
async function verifyDeployment(metadata) {
  logStep('VERIFY', 'Testing Hybrid Search API');

  try {
    const response = await fetch(`http://localhost:4446/search?q=${encodeURIComponent(metadata.filename)}&limit=1`);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      log(`✅ Document is searchable!`, 'green');
      log(`   Query: "${metadata.filename}"`, 'blue');
      log(`   Found: ${data.results[0].title}`, 'blue');
      log(`   Latency: ${data.elapsed_ms}ms`, 'blue');
    } else {
      log(`⚠️  Document not found in search results yet`, 'yellow');
      log(`   Try restarting services or wait a few seconds`, 'yellow');
    }
  } catch (error) {
    log(`⚠️  Could not verify deployment: ${error.message}`, 'yellow');
  }
}

/**
 * Publish a single document
 */
async function publishDocument(filePath) {
  logStep(1, `Analyzing: ${filePath}`);

  // Extract metadata
  const metadata = extractMetadata(filePath);
  log(`📄 File: ${metadata.filename}${metadata.extension}`);
  log(`📊 Size: ${(metadata.size / 1024 / 1024).toFixed(2)} MB`);
  log(`📁 Project: ${metadata.project || 'default'}`);
  log(`🏷️  Category: ${metadata.category}`);
  if (metadata.pages) log(`📖 Pages: ${metadata.pages}`);

  // Decide indexing strategy
  const strategy = metadata.pages > CONFIG.largeFileThreshold ? 'pageindex' : 'fileindex+vector';
  log(`\n🎯 Strategy: ${strategy.toUpperCase()}`, 'bright');

  logStep(2, 'Adding to File Index');
  const documentId = await addToFileIndex(metadata);

  if (strategy === 'fileindex+vector') {
    // Small/medium files: File Index + Vector Embeddings
    logStep(3, 'Extracting Text and Creating Chunks');

    let text = '';
    if (metadata.doc_type === 'pdf') {
      text = extractPdfText(filePath);
    } else if (metadata.doc_type === 'md' || metadata.doc_type === 'txt') {
      text = fs.readFileSync(filePath, 'utf8');
    }

    if (text) {
      const chunks = chunkText(text);
      log(`✅ Created ${chunks.length} chunks`);

      logStep(4, 'Generating Embeddings and Storing Chunks');
      await addChunksWithEmbeddings(documentId, chunks, metadata);
    } else {
      log('⚠️  No text content extracted, skipping embeddings', 'yellow');
    }

  } else if (strategy === 'pageindex') {
    // Large files: PageIndex
    logStep(3, 'Creating PageIndex (Tree-based RAG)');

    await createPageIndex(metadata);

    // Find and store the structure file
    const resultsDir = '/root/ankr-labs-nx/packages/ankr-pageindex-vendor/results';
    const structureFile = path.join(resultsDir, `${metadata.filename}_structure.json`);

    logStep(4, 'Storing PageIndex in Database');
    await storePageIndex(metadata, structureFile);
  }

  logStep(5, 'Restarting Services');
  restartServices();

  logStep(6, 'Verification');
  await verifyDeployment(metadata);

  log('\n' + '='.repeat(80), 'green');
  log('✨ PUBLISH COMPLETE!', 'green');
  log('='.repeat(80), 'green');
  log(`\n🔍 Search at: https://ankr.in/project/documents/search.html`);
  log(`📊 Query: "${metadata.filename}"\n`);
}

/**
 * Publish a directory
 */
async function publishDirectory(dirPath, options = {}) {
  log(`\n📁 Publishing directory: ${dirPath}\n`);

  const files = fs.readdirSync(dirPath, { recursive: true })
    .filter(f => {
      const fullPath = path.join(dirPath, f);
      const ext = path.extname(f).toLowerCase();
      return fs.statSync(fullPath).isFile() &&
             ['.pdf', '.md', '.txt'].includes(ext);
    });

  log(`Found ${files.length} documents\n`);

  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(dirPath, files[i]);
    log(`\n[${ i + 1}/${files.length}] Publishing: ${files[i]}`, 'bright');
    log('─'.repeat(80));

    try {
      await publishDocument(filePath);
    } catch (error) {
      log(`\n❌ Error publishing ${files[i]}: ${error.message}`, 'red');
    }

    if (i < files.length - 1) {
      log('\n⏳ Waiting 2 seconds before next file...');
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  log('\n' + '='.repeat(80), 'green');
  log(`✨ DIRECTORY PUBLISH COMPLETE! (${files.length} files)`, 'green');
  log('='.repeat(80), 'green');
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                        ANKR PUBLISH - v1.0                                  ║
║                   Universal Document Publishing System                      ║
╚════════════════════════════════════════════════════════════════════════════╝

Usage:
  ankr-publish <file-path>              Publish a single document
  ankr-publish <directory-path>         Publish all documents in directory
  ankr-publish --project <name> <path>  Publish with project override

Features:
  ✅ Auto-detects file type (PDF, MD, TXT)
  ✅ Smart indexing strategy:
     • Small files (<100 pages): File Index + Vector Embeddings
     • Large files (>100 pages): PageIndex (tree-based RAG)
  ✅ Automatic embedding generation via AI Proxy
  ✅ Service restart (ankr-hybrid-search)
  ✅ Deployment verification
  ✅ Searchable via https://ankr.in/project/documents/search.html

Examples:
  ankr-publish /path/to/document.pdf
  ankr-publish /root/pdfs-pratham/
  ankr-publish --project pratham-telehub /path/to/schoolbook.pdf
    `);
    process.exit(0);
  }

  const inputPath = args[0];

  if (!fs.existsSync(inputPath)) {
    log(`❌ Error: Path not found: ${inputPath}`, 'red');
    process.exit(1);
  }

  const stats = fs.statSync(inputPath);

  try {
    if (stats.isFile()) {
      await publishDocument(inputPath);
    } else if (stats.isDirectory()) {
      await publishDirectory(inputPath);
    }
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
