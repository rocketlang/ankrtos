#!/usr/bin/env node
/**
 * PDF Processing Script for Pratham Educational Content
 * Extracts text, metadata, generates thumbnails, and prepares for ANKR LMS
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SOURCE_DIR = '/root/pdfs-pratham';
const DEST_BASE = '/root/ankr-labs-nx/node_modules/@ankr/interact/data';
const PDFS_DIR = path.join(DEST_BASE, 'pdfs');
const THUMBNAILS_DIR = path.join(DEST_BASE, 'thumbnails');
const METADATA_DIR = path.join(DEST_BASE, 'metadata');

// Ensure directories exist
[PDFS_DIR, THUMBNAILS_DIR, METADATA_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

console.log('🚀 Processing Pratham Educational PDFs\n');

// Get all PDF files
const pdfFiles = fs.readdirSync(SOURCE_DIR)
  .filter(f => f.toLowerCase().endsWith('.pdf'));

console.log(`📚 Found ${pdfFiles.length} PDF files to process\n`);

let processed = 0;
let failed = 0;

for (const filename of pdfFiles) {
  try {
    const sourcePath = path.join(SOURCE_DIR, filename);
    const baseName = path.basename(filename, '.pdf');
    const destPath = path.join(PDFS_DIR, filename);
    const thumbnailPath = path.join(THUMBNAILS_DIR, `${baseName}.jpg`);
    const metadataPath = path.join(METADATA_DIR, `${baseName}.json`);

    console.log(`\n📖 Processing: ${filename}`);

    // Copy PDF to destination
    fs.copyFileSync(sourcePath, destPath);
    console.log('  ✅ Copied to data directory');

    // Extract PDF metadata using pdfinfo (if available)
    let metadata = {
      filename: filename,
      title: baseName,
      pages: 0,
      size: fs.statSync(sourcePath).size,
      uploadDate: new Date().toISOString(),
      isbn: extractISBN(baseName),
    };

    try {
      const pdfInfo = execSync(`pdfinfo "${sourcePath}"`, { encoding: 'utf-8' });
      const lines = pdfInfo.split('\n');

      for (const line of lines) {
        if (line.startsWith('Pages:')) {
          metadata.pages = parseInt(line.split(':')[1].trim());
        } else if (line.startsWith('Title:')) {
          const title = line.split(':')[1].trim();
          if (title && title !== '') metadata.title = title;
        } else if (line.startsWith('Author:')) {
          metadata.author = line.split(':')[1].trim();
        }
      }
      console.log(`  ✅ Extracted metadata (${metadata.pages} pages)`);
    } catch (e) {
      console.log('  ⚠️  pdfinfo not available, using basic metadata');
    }

    // Generate thumbnail (first page)
    try {
      execSync(
        `convert -density 150 "${sourcePath}[0]" -quality 85 -resize 300x "${thumbnailPath}"`,
        { stdio: 'pipe' }
      );
      console.log('  ✅ Generated thumbnail');
    } catch (e) {
      console.log('  ⚠️  ImageMagick not available for thumbnails');
    }

    // Extract text (first 500 words for search index)
    try {
      const text = execSync(`pdftotext -l 5 "${sourcePath}" -`, { encoding: 'utf-8' });
      metadata.preview = text.split(/\s+/).slice(0, 500).join(' ');
      console.log('  ✅ Extracted text preview');
    } catch (e) {
      console.log('  ⚠️  pdftotext not available for text extraction');
    }

    // Save metadata
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log('  ✅ Saved metadata');

    processed++;

  } catch (error) {
    console.error(`  ❌ Failed: ${error.message}`);
    failed++;
  }
}

// Summary
console.log('\n' + '='.repeat(70));
console.log('📊 PROCESSING SUMMARY');
console.log('='.repeat(70));
console.log(`Total PDFs:        ${pdfFiles.length}`);
console.log(`Successfully:      ${processed}`);
console.log(`Failed:            ${failed}`);
console.log('─'.repeat(70));
console.log(`Success rate:      ${((processed / pdfFiles.length) * 100).toFixed(1)}%`);
console.log('='.repeat(70));

console.log('\n✅ Processing complete!');
console.log('\nNext steps:');
console.log('  1. Review metadata: ls -lh ' + METADATA_DIR);
console.log('  2. Check thumbnails: ls -lh ' + THUMBNAILS_DIR);
console.log('  3. Import to LMS: node /root/import-pdfs-to-ankr-lms.js');

// Helper function to extract ISBN from filename
function extractISBN(text) {
  const isbnMatch = text.match(/ISBN[:\s-]*(\d{10}|\d{13})/i);
  if (isbnMatch) return isbnMatch[1];

  const numMatch = text.match(/(\d{10,13})/);
  if (numMatch) return numMatch[1];

  return null;
}
