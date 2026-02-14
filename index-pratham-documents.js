#!/usr/bin/env node

/**
 * Index Pratham Documents into ankr_indexed_documents
 * Enables fast PageIndex search before falling back to vector
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DOCS_ROOT = '/root/ankr-universe-docs/project/documents/pratham-telehub';

const pool = new Pool({
  connectionString: 'postgresql://ankr:indrA@0612@localhost:5432/ankr_eon',
});

async function indexDocuments() {
  console.log('📚 Indexing Pratham Documents...\n');

  const client = await pool.connect();

  try {
    // Create tables if not exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS ankr_indexed_documents (
        id VARCHAR(32) PRIMARY KEY,
        file_path TEXT NOT NULL UNIQUE,
        title TEXT,
        content_hash VARCHAR(64) NOT NULL,
        file_size BIGINT NOT NULL,
        doc_type VARCHAR(20) NOT NULL,
        project VARCHAR(100),
        category VARCHAR(100),
        tags TEXT[],
        language VARCHAR(10),
        metadata JSONB,
        indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_documents_project ON ankr_indexed_documents(project);
      CREATE INDEX IF NOT EXISTS idx_documents_category ON ankr_indexed_documents(category);

      CREATE TABLE IF NOT EXISTS ankr_indexed_chunks (
        id VARCHAR(32) PRIMARY KEY,
        document_id VARCHAR(32) REFERENCES ankr_indexed_documents(id) ON DELETE CASCADE,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        content_hash VARCHAR(64) NOT NULL,
        chunk_type VARCHAR(20),
        metadata JSONB,
        indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_chunks_document ON ankr_indexed_chunks(document_id);
    `);

    console.log('✅ Tables ready\n');

    // Scan directory for markdown files
    const files = fs.readdirSync(DOCS_ROOT)
      .filter(f => f.endsWith('.md'))
      .map(f => path.join(DOCS_ROOT, f));

    console.log(`📄 Found ${files.length} markdown files\n`);

    let indexed = 0;
    let updated = 0;
    let errors = 0;

    for (const filePath of files) {
      try {
        const filename = path.basename(filePath);
        const stats = fs.statSync(filePath);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Generate hash
        const contentHash = crypto
          .createHash('sha256')
          .update(content)
          .digest('hex');

        // Extract title from first line or filename
        const lines = content.split('\n').filter(l => l.trim());
        let title = filename.replace(/\.md$/, '');
        for (const line of lines.slice(0, 10)) {
          if (line.startsWith('# ')) {
            title = line.replace(/^#\s+/, '');
            break;
          }
        }

        // Detect category
        let category = 'General';
        if (filename.includes('TRANSFORMATION')) category = 'Transformation';
        else if (filename.includes('TODO')) category = 'Planning';
        else if (filename.includes('PROJECT-REPORT')) category = 'Reports';
        else if (filename.includes('EMAIL')) category = 'Communication';
        else if (filename.includes('DEMO')) category = 'Demo';

        // Generate doc ID
        const docId = crypto
          .createHash('md5')
          .update(filePath)
          .digest('hex')
          .substring(0, 32);

        // Insert or update
        const result = await client.query(
          `INSERT INTO ankr_indexed_documents (
            id, file_path, title, content_hash, file_size, doc_type,
            project, category, language, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (file_path)
          DO UPDATE SET
            title = $3,
            content_hash = $4,
            file_size = $5,
            category = $8,
            metadata = $10,
            updated_at = NOW()
          RETURNING (xmax = 0) AS inserted`,
          [
            docId,
            filePath,
            title,
            contentHash,
            stats.size,
            'markdown',
            'pratham-telehub',
            category,
            'en',
            JSON.stringify({
              filename,
              lines: lines.length,
              url: `/project/documents/pratham-telehub/${filename}`,
            })
          ]
        );

        if (result.rows[0].inserted) {
          indexed++;
          console.log(`  ✅ ${filename}`);
        } else {
          updated++;
          console.log(`  🔄 ${filename} (updated)`);
        }

        // Create searchable chunks (every 1000 chars)
        const chunkSize = 1000;
        const chunks = [];
        for (let i = 0; i < content.length; i += chunkSize) {
          chunks.push(content.substring(i, i + chunkSize));
        }

        // Delete old chunks
        await client.query(
          'DELETE FROM ankr_indexed_chunks WHERE document_id = $1',
          [docId]
        );

        // Insert new chunks
        for (let i = 0; i < chunks.length; i++) {
          const chunkContent = chunks[i];
          const chunkHash = crypto
            .createHash('sha256')
            .update(chunkContent)
            .digest('hex');

          const chunkId = crypto
            .createHash('md5')
            .update(`${docId}-${i}`)
            .digest('hex')
            .substring(0, 32);

          await client.query(
            `INSERT INTO ankr_indexed_chunks (
              id, document_id, chunk_index, content, content_hash, chunk_type
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [chunkId, docId, i, chunkContent, chunkHash, 'text']
          );
        }

      } catch (err) {
        errors++;
        console.error(`  ❌ ${path.basename(filePath)}: ${err.message}`);
      }
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ Indexing Complete!');
    console.log('='.repeat(60));
    console.log(`   📄 Total files: ${files.length}`);
    console.log(`   ✅ Indexed: ${indexed}`);
    console.log(`   🔄 Updated: ${updated}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('');

    // Show stats
    const stats = await client.query(`
      SELECT
        category,
        COUNT(*) as count,
        SUM(file_size) as total_size
      FROM ankr_indexed_documents
      WHERE project = 'pratham-telehub'
      GROUP BY category
      ORDER BY count DESC
    `);

    console.log('📊 Documents by category:');
    stats.rows.forEach(row => {
      const sizeMB = (row.total_size / (1024 * 1024)).toFixed(2);
      console.log(`   ${row.category.padEnd(20)} ${row.count.toString().padStart(3)} docs  (${sizeMB} MB)`);
    });
    console.log('');

  } finally {
    client.release();
    await pool.end();
  }
}

indexDocuments().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
