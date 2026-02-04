#!/usr/bin/env node
// wrap-pages-i18n.js — Auto-wrap pages with useTranslation hook

const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '../frontend/src/pages');

// Helper: Check if file already has useTranslation
function hasI18n(content) {
  return content.includes('useTranslation') || content.includes("from 'react-i18next'");
}

// Helper: Add useTranslation hook to component
function addI18nToPage(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  if (hasI18n(content)) {
    return { skipped: true, reason: 'Already has i18n' };
  }

  let modified = content;

  // Add import
  if (!modified.includes("from 'react-i18next'")) {
    const importMatch = modified.match(/import .+ from ['"]react['"]/);
    if (importMatch) {
      const insertPos = modified.indexOf(importMatch[0]) + importMatch[0].length;
      modified = modified.slice(0, insertPos) + "\nimport { useTranslation } from 'react-i18next';" + modified.slice(insertPos);
    }
  }

  // Add hook to component
  const componentMatch = modified.match(/export default function (\w+)\(\) \{/);
  if (componentMatch) {
    const hookLine = "\n  const { t } = useTranslation(['common', 'maritime']);";
    const insertPos = modified.indexOf(componentMatch[0]) + componentMatch[0].length;
    modified = modified.slice(0, insertPos) + hookLine + modified.slice(insertPos);
  }

  // Write back
  fs.writeFileSync(filePath, modified, 'utf-8');
  return { skipped: false };
}

// Main
function wrapAllPages() {
  const files = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.tsx'));

  let processed = 0;
  let skipped = 0;

  console.log(`🔧 Wrapping ${files.length} pages with i18n...\n`);

  for (const file of files) {
    const filePath = path.join(PAGES_DIR, file);
    const result = addI18nToPage(filePath);

    if (result.skipped) {
      console.log(`⏭️  ${file} - ${result.reason}`);
      skipped++;
    } else {
      console.log(`✅ ${file} - Added useTranslation hook`);
      processed++;
    }
  }

  console.log(`\n✅ Complete!`);
  console.log(`   Processed: ${processed}`);
  console.log(`   Skipped: ${skipped}`);
}

if (require.main === module) {
  wrapAllPages();
}

module.exports = { wrapAllPages };
