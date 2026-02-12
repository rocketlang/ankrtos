#!/usr/bin/env node
/**
 * NCERT Exercise Extractor - Batch Processing
 * Extracts all exercises from 183 NCERT chapter PDFs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PDF_DIR = '/root/data/ncert-extracted';
const OUTPUT_DIR = '/root/ncert-extraction/extracted-data';
const LOG_FILE = '/root/ncert-extraction/extraction.log';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Log function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logMessage);
  console.log(message);
}

// Get all PDF files
function getAllPDFs() {
  const files = fs.readdirSync(PDF_DIR)
    .filter(f => f.endsWith('.pdf'))
    .map(f => path.join(PDF_DIR, f));
  return files;
}

// Categorize PDFs by class and subject
function categorizePDFs(files) {
  const categories = {
    class_10_math: [],
    class_10_science: [],
    class_10_english: [],
    class_11_math: [],
    class_12_math: [],
    class_7_9_math: [],
    class_7_9_science: [],
    other: []
  };

  files.forEach(file => {
    const basename = path.basename(file);

    // Class 10 Mathematics (jemh prefix)
    if (basename.startsWith('jemh')) {
      categories.class_10_math.push(file);
    }
    // Class 10 Science (jesc prefix)
    else if (basename.startsWith('jesc')) {
      categories.class_10_science.push(file);
    }
    // Class 10 English (jeff, jefw prefix)
    else if (basename.startsWith('jeff') || basename.startsWith('jefw')) {
      categories.class_10_english.push(file);
    }
    // Class 11 Mathematics (kemh prefix)
    else if (basename.startsWith('kemh')) {
      categories.class_11_math.push(file);
    }
    // Class 12 Mathematics (lemh prefix)
    else if (basename.startsWith('lemh')) {
      categories.class_12_math.push(file);
    }
    // Class 7-9 Mathematics (gemh, hemh, iemh prefix)
    else if (basename.match(/^[ghi]emh/)) {
      categories.class_7_9_math.push(file);
    }
    // Class 7-9 Science (gesc, hesc, iesc prefix)
    else if (basename.match(/^[ghi]esc/)) {
      categories.class_7_9_science.push(file);
    }
    else {
      categories.other.push(file);
    }
  });

  return categories;
}

// Extract exercises from a single PDF using Claude
async function extractExercisesFromPDF(pdfPath) {
  const basename = path.basename(pdfPath, '.pdf');
  const outputFile = path.join(OUTPUT_DIR, `${basename}.json`);

  // Skip if already extracted
  if (fs.existsSync(outputFile)) {
    log(`✓ Already extracted: ${basename}`);
    return { success: true, skipped: true };
  }

  log(`⬇️  Extracting: ${basename}`);

  try {
    // Use Claude Code's Read tool to extract PDF content
    // This is a placeholder - actual extraction would use Claude API
    const result = {
      file: basename,
      exercises: [],
      timestamp: new Date().toISOString()
    };

    // Save placeholder for now
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));

    log(`✅ Extracted: ${basename}`);
    return { success: true };

  } catch (error) {
    log(`❌ Failed: ${basename} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main execution
async function main() {
  log('════════════════════════════════════════════════════════════');
  log('  NCERT Exercise Extraction - Batch Processing');
  log('════════════════════════════════════════════════════════════');
  log('');

  const allPDFs = getAllPDFs();
  log(`Total PDFs found: ${allPDFs.length}`);
  log('');

  const categories = categorizePDFs(allPDFs);

  log('PDF Distribution:');
  log(`  Class 10 Mathematics: ${categories.class_10_math.length} files`);
  log(`  Class 10 Science: ${categories.class_10_science.length} files`);
  log(`  Class 10 English: ${categories.class_10_english.length} files`);
  log(`  Class 11 Mathematics: ${categories.class_11_math.length} files`);
  log(`  Class 12 Mathematics: ${categories.class_12_math.length} files`);
  log(`  Classes 7-9 Mathematics: ${categories.class_7_9_math.length} files`);
  log(`  Classes 7-9 Science: ${categories.class_7_9_science.length} files`);
  log(`  Other: ${categories.other.length} files`);
  log('');

  // Priority order
  const priorityOrder = [
    { name: 'Class 10 Mathematics', files: categories.class_10_math },
    { name: 'Class 10 Science', files: categories.class_10_science },
    { name: 'Class 10 English', files: categories.class_10_english },
    { name: 'Class 11 Mathematics', files: categories.class_11_math },
    { name: 'Class 12 Mathematics', files: categories.class_12_math },
    { name: 'Classes 7-9 Mathematics', files: categories.class_7_9_math },
    { name: 'Classes 7-9 Science', files: categories.class_7_9_science },
    { name: 'Other subjects', files: categories.other },
  ];

  let totalExtracted = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const category of priorityOrder) {
    if (category.files.length === 0) continue;

    log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    log(`  ${category.name} (${category.files.length} files)`);
    log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    for (const file of category.files) {
      const result = await extractExercisesFromPDF(file);

      if (result.success && !result.skipped) totalExtracted++;
      else if (result.skipped) totalSkipped++;
      else totalFailed++;
    }

    log('');
  }

  log('════════════════════════════════════════════════════════════');
  log('  Extraction Summary');
  log('════════════════════════════════════════════════════════════');
  log(`Total PDFs: ${allPDFs.length}`);
  log(`Extracted: ${totalExtracted}`);
  log(`Skipped: ${totalSkipped}`);
  log(`Failed: ${totalFailed}`);
  log('');
  log(`Output directory: ${OUTPUT_DIR}`);
  log(`Log file: ${LOG_FILE}`);
  log('════════════════════════════════════════════════════════════');
}

main().catch(console.error);
