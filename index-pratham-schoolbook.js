#!/usr/bin/env bun

/**
 * Index Pratham Schoolbook PDF with PageIndex
 * 268 pages - perfect for tree-based navigation
 */

const { Pool } = require('pg');
const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

const pool = new Pool({
  connectionString: 'postgresql://ankr:indrA@0612@localhost:5432/ankr_eon',
});

const PDF_PATH = '/root/ankr-labs-nx/packages/ankr-interact/data/pdfs/6 Bookset QA - Comprehensive Book with First page (ISBN).pdf';
const PYTHON_PATH = '/root/ankr-labs-nx/packages/ankr-pageindex-vendor/.venv/bin/python';
const PAGEINDEX_SCRIPT = '/root/ankr-labs-nx/packages/ankr-pageindex-vendor/run_pageindex.py';

async function indexSchoolbook() {
  console.log('📚 Indexing Pratham Schoolbook with PageIndex');
  console.log('='.repeat(80));
  console.log('');

  // Check if PDF exists
  if (!fs.existsSync(PDF_PATH)) {
    console.error(`❌ PDF not found: ${PDF_PATH}`);
    process.exit(1);
  }

  const stats = fs.statSync(PDF_PATH);
  console.log(`✅ PDF found: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log('');

  // Check Python environment
  if (!fs.existsSync(PYTHON_PATH)) {
    console.log('⚠️  PageIndex Python not found. Setting up...');
    console.log('');
    
    // Use simpler approach: just store PDF metadata
    console.log('📝 Creating basic index without tree structure...');
    const client = await pool.connect();
    
    try {
      await client.query(`
        INSERT INTO document_indexes (document_id, index_type, index_data, metadata, version)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (document_id) 
        DO UPDATE SET
          index_data = $3,
          metadata = $4,
          updated_at = NOW()
      `, [
        'pratham-bookset-001',
        'pageindex_pending',
        JSON.stringify({
          status: 'pending',
          message: 'PageIndex Python environment not set up',
          pdf_path: PDF_PATH,
          pages: 268,
          size_mb: (stats.size / (1024 * 1024)).toFixed(2)
        }),
        JSON.stringify({
          title: '6 Bookset QA - Comprehensive Book',
          type: 'educational',
          pages: 268,
          organization: 'pratham',
          created_at: new Date()
        }),
        '1.0'
      ]);
      
      console.log('✅ Basic index created');
      console.log('');
      console.log('⚠️  To enable full PageIndex:');
      console.log('   1. Set up Python environment:');
      console.log('      cd /root/ankr-labs-nx/packages/ankr-pageindex-vendor');
      console.log('      python3 -m venv .venv');
      console.log('      source .venv/bin/activate');
      console.log('      pip install -r requirements.txt');
      console.log('');
      console.log('   2. Re-run this script');
      
    } finally {
      client.release();
      await pool.end();
    }
    
    return;
  }

  console.log('✅ Python environment found');
  console.log('');
  console.log('🌳 Running PageIndex (this may take 5-10 minutes for 268 pages)...');
  console.log('');

  // Run PageIndex Python script
  const outputPath = '/tmp/pratham-bookset-structure.json';
  
  const pageindexProcess = spawn(PYTHON_PATH, [
    PAGEINDEX_SCRIPT,
    '--pdf', PDF_PATH,
    '--output', outputPath,
    '--max-pages-per-node', '10',
    '--max-tokens-per-node', '20000'
  ]);

  let stdout = '';
  let stderr = '';

  pageindexProcess.stdout.on('data', (data) => {
    stdout += data;
    process.stdout.write(data);
  });

  pageindexProcess.stderr.on('data', (data) => {
    stderr += data;
    process.stderr.write(data);
  });

  await new Promise((resolve, reject) => {
    pageindexProcess.on('close', async (code) => {
      if (code !== 0) {
        console.error(`\n❌ PageIndex failed with code ${code}`);
        console.error(stderr);
        reject(new Error(`PageIndex failed: ${stderr}`));
        return;
      }

      console.log('\n✅ PageIndex tree structure generated!');
      console.log('');

      // Load tree structure
      if (!fs.existsSync(outputPath)) {
        reject(new Error('Output file not found'));
        return;
      }

      const treeStructure = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      console.log(`📊 Tree structure: ${JSON.stringify(treeStructure).length} bytes`);
      console.log('');

      // Store in database
      const client = await pool.connect();
      
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS document_indexes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            document_id VARCHAR(255) NOT NULL UNIQUE,
            index_type VARCHAR(50) DEFAULT 'pageindex_tree',
            index_data JSONB NOT NULL,
            metadata JSONB,
            version VARCHAR(20) DEFAULT '1.0',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_document_indexes_doc_id ON document_indexes(document_id);
        `);

        const result = await client.query(
          `INSERT INTO document_indexes (document_id, index_type, index_data, metadata, version)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (document_id)
           DO UPDATE SET
             index_data = $3,
             metadata = $4,
             updated_at = NOW()
           RETURNING id`,
          [
            'pratham-bookset-001',
            'pageindex_tree',
            JSON.stringify(treeStructure),
            JSON.stringify({
              title: '6 Bookset QA - Comprehensive Book',
              type: 'educational',
              pages: 268,
              organization: 'pratham',
              pdf_path: PDF_PATH,
              indexed_at: new Date(),
            }),
            '1.0'
          ]
        );

        console.log('✅ Tree structure stored in database');
        console.log(`   ID: ${result.rows[0].id}`);
        console.log('');

        console.log('='.repeat(80));
        console.log('🎉 SCHOOLBOOK INDEXED SUCCESSFULLY!');
        console.log('='.repeat(80));
        console.log('');
        console.log('Document: pratham-bookset-001');
        console.log('Pages: 268');
        console.log('Index Type: PageIndex Tree Navigation');
        console.log('Storage: ~100-200 KB (tree structure)');
        console.log('');
        console.log('🔍 Test it:');
        console.log('   Query: "What is the formula for compound interest?"');
        console.log('   PageIndex will navigate through chapters to find exact page');
        console.log('');

      } finally {
        client.release();
        await pool.end();
      }

      resolve();
    });
  });
}

indexSchoolbook().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
