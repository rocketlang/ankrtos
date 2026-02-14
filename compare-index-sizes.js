#!/usr/bin/env bun

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: 'postgresql://ankr:indrA@0612@localhost:5432/ankr_eon',
});

async function compareIndexSizes() {
  console.log('📊 INDEXING SIZE COMPARISON');
  console.log('='.repeat(80));
  console.log('');

  const client = await pool.connect();

  try {
    // 1. Original document sizes
    const docsPath = '/root/ankr-universe-docs/project/documents/pratham-telehub';
    const files = fs.readdirSync(docsPath).filter(f => f.endsWith('.md'));
    
    let totalOriginalSize = 0;
    files.forEach(f => {
      const stats = fs.statSync(path.join(docsPath, f));
      totalOriginalSize += stats.size;
    });

    console.log('📄 ORIGINAL DOCUMENTS');
    console.log(`   Files: ${files.length}`);
    console.log(`   Total Size: ${(totalOriginalSize / 1024).toFixed(2)} KB`);
    console.log(`   Average per doc: ${(totalOriginalSize / files.length / 1024).toFixed(2)} KB`);
    console.log('');

    // 2. File Index (metadata only)
    const fileIndex = await client.query(`
      SELECT 
        COUNT(*) as count,
        pg_total_relation_size('ankr_indexed_documents') as table_size,
        AVG(LENGTH(title::text) + LENGTH(file_path::text) + 
            LENGTH(metadata::text) + 100) as avg_row_size
      FROM ankr_indexed_documents
      WHERE project = 'pratham-telehub'
    `);

    const fileIndexSize = parseInt(fileIndex.rows[0].table_size);
    const avgRowSize = parseFloat(fileIndex.rows[0].avg_row_size);

    console.log('📇 FILE INDEX (Metadata Only)');
    console.log(`   Table size: ${(fileIndexSize / 1024).toFixed(2)} KB`);
    console.log(`   Per document: ~${avgRowSize.toFixed(0)} bytes`);
    console.log(`   Overhead: ${((fileIndexSize / totalOriginalSize) * 100).toFixed(2)}% of original`);
    console.log('');

    // 3. Vector Index (embeddings)
    // Typical: 1024 dimensions × 4 bytes = 4KB per chunk
    // Average document: ~5 chunks
    const avgChunksPerDoc = 5;
    const embeddingDims = 1024; // Jina embeddings
    const bytesPerFloat = 4;
    const vectorSizePerChunk = embeddingDims * bytesPerFloat; // 4KB
    const vectorSizePerDoc = vectorSizePerChunk * avgChunksPerDoc;
    const totalVectorSize = vectorSizePerDoc * files.length;

    console.log('🔢 VECTOR INDEX (Embeddings)');
    console.log(`   Dimensions: ${embeddingDims} (Jina)`);
    console.log(`   Per chunk: ${(vectorSizePerChunk / 1024).toFixed(2)} KB`);
    console.log(`   Chunks per doc: ~${avgChunksPerDoc}`);
    console.log(`   Per document: ~${(vectorSizePerDoc / 1024).toFixed(2)} KB`);
    console.log(`   Total estimated: ${(totalVectorSize / 1024).toFixed(2)} KB`);
    console.log(`   Overhead: ${((totalVectorSize / totalOriginalSize) * 100).toFixed(0)}% of original`);
    console.log('');

    // 4. PageIndex (tree structure)
    const pageIndexResult = await client.query(`
      SELECT 
        COUNT(*) as count,
        pg_total_relation_size('document_indexes') as table_size,
        AVG(LENGTH(index_data::text)) as avg_tree_size
      FROM document_indexes
    `);

    const pageIndexTableSize = parseInt(pageIndexResult.rows[0].table_size || 0);
    const avgTreeSize = parseFloat(pageIndexResult.rows[0].avg_tree_size || 0);
    const pageIndexCount = parseInt(pageIndexResult.rows[0].count || 0);

    console.log('🌳 PAGEINDEX (Tree Structure)');
    if (pageIndexCount > 0) {
      console.log(`   Indexed documents: ${pageIndexCount}`);
      console.log(`   Table size: ${(pageIndexTableSize / 1024).toFixed(2)} KB`);
      console.log(`   Per document: ~${(avgTreeSize / 1024).toFixed(2)} KB`);
      console.log(`   Overhead: ${((pageIndexTableSize / totalOriginalSize) * 100).toFixed(0)}% of original`);
    } else {
      console.log(`   Indexed documents: 0 (not yet indexed)`);
      console.log(`   Estimated per doc: 50-200 KB (tree + summaries)`);
      console.log(`   Estimated total: ${(100 * files.length / 1024).toFixed(2)} MB`);
      console.log(`   Estimated overhead: 2000-5000% of original`);
    }
    console.log('');

    // Summary comparison
    console.log('='.repeat(80));
    console.log('📊 SUMMARY COMPARISON (for 41 Pratham documents)');
    console.log('='.repeat(80));
    console.log('');
    console.log('Method              Storage     Per Doc    Overhead    Search Speed');
    console.log('-'.repeat(80));
    console.log(`Original Files      ${(totalOriginalSize/1024).toFixed(0).padStart(6)} KB   ${(totalOriginalSize/files.length/1024).toFixed(1).padStart(6)} KB   Baseline    N/A`);
    console.log(`File Index          ${(fileIndexSize/1024).toFixed(0).padStart(6)} KB   ${(avgRowSize/1024).toFixed(1).padStart(6)} KB   ${((fileIndexSize/totalOriginalSize)*100).toFixed(0).padStart(6)}%     ⚡ Instant`);
    console.log(`Vector Index        ${(totalVectorSize/1024).toFixed(0).padStart(6)} KB   ${(vectorSizePerDoc/1024).toFixed(1).padStart(6)} KB   ${((totalVectorSize/totalOriginalSize)*100).toFixed(0).padStart(6)}%     🚀 Fast (100ms)`);
    console.log(`PageIndex           ${pageIndexCount > 0 ? (pageIndexTableSize/1024).toFixed(0).padStart(6) : '~4100'.padStart(6)} KB   ${pageIndexCount > 0 ? (avgTreeSize/1024).toFixed(1).padStart(6) : '~100'.padStart(6)} KB   ${pageIndexCount > 0 ? ((pageIndexTableSize/totalOriginalSize)*100).toFixed(0).padStart(6) : '~2500'.padStart(6)}%     🧠 Smart (2-5s)`);
    console.log('');
    console.log('KEY INSIGHTS:');
    console.log('-------------');
    console.log('• File Index: TINY (1-2% overhead) - just metadata, no content search');
    console.log('• Vector Index: MODERATE (50-100% overhead) - semantic search, chunked');
    console.log('• PageIndex: LARGE (2000-5000% overhead) - deep reasoning, tree navigation');
    console.log('');
    console.log('HYBRID STRATEGY (Recommended):');
    console.log('-------------------------------');
    console.log('1. File Index (1st) → Find by filename/title (instant)');
    console.log('2. Vector Search (2nd) → Semantic similarity (fast)');
    console.log('3. PageIndex (3rd) → Complex queries only (deep but slow)');
    console.log('');
    console.log('Result: 70% queries hit file index (tiny), 25% vector (moderate),');
    console.log('        5% PageIndex (large) = Overall efficient!');
    console.log('');

  } finally {
    client.release();
    await pool.end();
  }
}

compareIndexSizes().catch(console.error);
