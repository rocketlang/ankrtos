#!/usr/bin/env node

/**
 * NCERT Content Extraction Pipeline
 *
 * Full pipeline to extract NCERT textbook content and populate database
 *
 * Usage:
 *   node pipeline.js <bookId>
 *   node pipeline.js class-10-mathematics
 *   node pipeline.js --all
 */

const path = require('path');
const { downloadPDF, downloadAll, NCERT_BOOKS } = require('./pdf-downloader');
const { parseNCERTBook } = require('./pdf-parser');
const { importFromJSON, verifyImport } = require('./db-importer');
const fs = require('fs');

async function processSingleBook(bookId) {
  console.log('\n' + '='.repeat(60));
  console.log(`  NCERT EXTRACTION PIPELINE: ${bookId}`);
  console.log('='.repeat(60) + '\n');

  const book = NCERT_BOOKS[bookId];
  if (!book) {
    console.error(`❌ Unknown book: ${bookId}`);
    console.log('\nAvailable books:');
    Object.keys(NCERT_BOOKS).forEach(id => {
      console.log(`  - ${id}`);
    });
    process.exit(1);
  }

  try {
    // Step 1: Download PDF
    console.log('📥 STEP 1: Download PDF');
    const pdfPath = await downloadPDF(bookId);

    // Step 2: Parse PDF
    console.log('\n📄 STEP 2: Parse PDF');
    const extracted = await parseNCERTBook(pdfPath);

    // Step 3: Save extracted data
    console.log('\n💾 STEP 3: Save extracted data');
    const jsonPath = path.join(__dirname, 'extracted', `${bookId}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(extracted, null, 2));
    console.log(`   Saved to: ${jsonPath}`);

    // Step 4: Import to database
    console.log('\n📥 STEP 4: Import to database');
    const importResult = await importFromJSON(jsonPath, bookId);

    // Step 5: Verify
    console.log('\n🔍 STEP 5: Verify import');
    const verification = await verifyImport(bookId);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('  ✅ PIPELINE COMPLETE');
    console.log('='.repeat(60));
    console.log(`\n📚 ${book.title}`);
    console.log(`   Chapters: ${verification.chapter_count}`);
    console.log(`   Examples: ${verification.example_count}`);
    console.log(`   Exercises: ${verification.exercise_count}`);
    console.log(`   Total words: ${verification.total_words}`);
    console.log('');

    return {
      success: true,
      bookId,
      verification
    };

  } catch (error) {
    console.error('\n❌ Pipeline failed:', error.message);
    console.error(error.stack);
    return {
      success: false,
      bookId,
      error: error.message
    };
  }
}

async function processAllBooks() {
  console.log('\n' + '='.repeat(60));
  console.log('  NCERT BULK EXTRACTION PIPELINE');
  console.log('='.repeat(60) + '\n');

  const results = [];

  for (const bookId of Object.keys(NCERT_BOOKS)) {
    const result = await processSingleBook(bookId);
    results.push(result);
    console.log('\n' + '-'.repeat(60) + '\n');
  }

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('  📊 FINAL SUMMARY');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n✅ Successful: ${successful.length}`);
  successful.forEach(r => {
    console.log(`   - ${r.bookId}: ${r.verification.chapter_count} chapters, ${r.verification.exercise_count} exercises`);
  });

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`);
    failed.forEach(r => {
      console.log(`   - ${r.bookId}: ${r.error}`);
    });
  }

  console.log('');
}

// CLI
if (require.main === module) {
  const arg = process.argv[2];

  if (!arg) {
    console.log('NCERT Content Extraction Pipeline\n');
    console.log('Usage:');
    console.log('  node pipeline.js <bookId>       Process single book');
    console.log('  node pipeline.js --all          Process all books');
    console.log('\nAvailable books:');
    Object.entries(NCERT_BOOKS).forEach(([id, book]) => {
      console.log(`  - ${id.padEnd(25)} ${book.title}`);
    });
    process.exit(0);
  }

  if (arg === '--all') {
    processAllBooks().catch(console.error);
  } else {
    processSingleBook(arg).catch(console.error);
  }
}

module.exports = { processSingleBook, processAllBooks };
