#!/usr/bin/env bun

/**
 * Store PageIndex structure for schoolbook in document_indexes table
 */

const { Pool } = require('pg');
const fs = require('fs');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: 'postgresql://ankr:indrA@0612@localhost:5432/ankr_eon',
});

async function storePageIndex() {
  const structureFile = '/root/ankr-labs-nx/packages/ankr-pageindex-vendor/results/6 Bookset QA - Comprehensive Book with First page (ISBN)_structure.json';

  console.log('📖 Storing PageIndex for Schoolbook...\n');

  // Read structure file
  const structureData = JSON.parse(fs.readFileSync(structureFile, 'utf8'));

  const documentId = 'pratham-schoolbook-bookset-qa-comprehensive';
  const pdfPath = '/root/pdfs-pratham/6 Bookset QA - Comprehensive Book with First page (ISBN).pdf';

  // Get PDF stats
  const pdfStats = fs.statSync(pdfPath);

  // Create metadata
  const metadata = {
    source: 'pratham-schoolbook',
    project: 'pratham-telehub',
    pdf_path: pdfPath,
    file_size: pdfStats.size,
    total_pages: 268,
    total_chapters: structureData.structure.length,
    chapters: structureData.structure.map(ch => ({
      title: ch.title,
      pages: `${ch.start_index}-${ch.end_index}`,
      node_id: ch.node_id,
    })),
    indexed_at: new Date().toISOString(),
    indexing_method: 'pageindex_python',
  };

  console.log(`Document ID: ${documentId}`);
  console.log(`PDF: ${structureData.doc_name}`);
  console.log(`Chapters: ${structureData.structure.length}`);
  console.log(`File Size: ${(pdfStats.size / 1024 / 1024).toFixed(2)} MB\n`);

  // Check if document_indexes table exists
  const tableCheck = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'document_indexes'
    );
  `);

  if (!tableCheck.rows[0].exists) {
    console.log('Creating document_indexes table...');
    await pool.query(`
      CREATE TABLE document_indexes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id VARCHAR(255) NOT NULL UNIQUE,
        index_type VARCHAR(50) DEFAULT 'pageindex_tree',
        index_data JSONB NOT NULL,
        metadata JSONB,
        version VARCHAR(20) DEFAULT '1.0',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_document_indexes_doc_id ON document_indexes(document_id);
      CREATE INDEX idx_document_indexes_type ON document_indexes(index_type);
    `);
    console.log('✅ Table created\n');
  }

  // Insert or update PageIndex
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
      metadata = EXCLUDED.metadata,
      updated_at = NOW();
  `, [
    documentId,
    'pageindex_tree',
    structureData,
    metadata,
    '1.0',
  ]);

  console.log('✅ PageIndex stored successfully!\n');

  // Also add to ankr_indexed_documents for hybrid search
  const docIdHash = crypto.createHash('md5').update(pdfPath).digest('hex').substring(0, 32);
  const contentHash = crypto.createHash('sha256').update(fs.readFileSync(pdfPath)).digest('hex');

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
      updated_at = NOW();
  `, [
    docIdHash,
    pdfPath,
    '6 Bookset QA - Comprehensive Book (Pratham Schoolbook)',
    contentHash,
    pdfStats.size,
    'pdf',
    'pratham-telehub',
    'education',
    ['schoolbook', 'mathematics', 'quantitative-aptitude', 'pratham'],
    'en',
    {
      has_pageindex: true,
      pageindex_document_id: documentId,
      total_pages: 268,
      total_chapters: structureData.structure.length,
      isbn: 'Pratham Bookset QA',
    },
  ]);

  console.log('✅ Added to ankr_indexed_documents for hybrid search\n');

  // Display chapter summary
  console.log('📚 Chapter Breakdown:');
  console.log('─'.repeat(80));
  structureData.structure.forEach((ch, idx) => {
    console.log(`${String(idx + 1).padStart(2)}. ${ch.title.padEnd(35)} Pages ${ch.start_index}-${ch.end_index} (Node: ${ch.node_id})`);
  });
  console.log('─'.repeat(80));

  await pool.end();

  console.log('\n✨ PageIndex Ready for Queries!\n');
  console.log('Try searching: "What is compound interest formula?"');
  console.log('Or: "Explain the BODMAS rule"');
  console.log('Or: "How to calculate LCM and HCF?"');
}

storePageIndex().catch(console.error);
