#!/usr/bin/env bun

/**
 * ANKR Auto-Publisher
 * Automatically publishes documents from /root/ to ANKR Document Viewer
 *
 * Features:
 * - Watches /root/ for new .md files
 * - Smart project detection from filename patterns
 * - Auto-creates project directories
 * - Generates/updates README.md indexes
 * - Real-time publishing (no restart needed)
 *
 * Usage:
 *   pm2 start /root/ankr-auto-publisher.js --name ankr-auto-publisher
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

// Configuration
const WATCH_DIR = '/root';
const PUBLISH_ROOT = '/root/ankr-universe-docs/project/documents';
const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/ankr-labs-nx/**',
  '**/ankr-universe-docs/**',
  '**/.ankr/**',
  '**/backups/**',
  '**/apps/**',
  '**/packages/**',
  '**/*.log',
  '**/*.tmp',
  '**/pratham-telehub-poc/**'
];

// Project name patterns (filename → project directory)
const PROJECT_PATTERNS = [
  { pattern: /^PRATHAM-/i, project: 'pratham-telehub', category: 'Pratham Education' },
  { pattern: /^ANKR-MARITIME-/i, project: 'ankr-maritime', category: 'ANKR Maritime' },
  { pattern: /^ANKR-LMS-/i, project: 'ankr-learning', category: 'ANKR LMS' },
  { pattern: /^ANKR-INTERACT-/i, project: 'ankr-learning', category: 'ANKR Interact' },
  { pattern: /^VYOMO-/i, project: 'vyomo-analytics', category: 'Vyomo Analytics' },
  { pattern: /^COMPLYMITRA-/i, project: 'complymitra', category: 'ComplyMitra' },
  { pattern: /^FREIGHTBOX-/i, project: 'freightbox', category: 'FreightBox' },
  { pattern: /^MARITIME-/i, project: 'ankr-maritime', category: 'Maritime' },
  { pattern: /^CORALS-/i, project: 'corals-astrology', category: 'Corals Astrology' },
  { pattern: /^WAREXAI-/i, project: 'warexai', category: 'WarexAI' },
  { pattern: /^DODD-/i, project: 'dodd-icd', category: 'DODD ICD' },
  { pattern: /^EDIBOX-/i, project: 'edibox', category: 'EdiBox' },
  { pattern: /^AGFLOW-/i, project: 'agflow', category: 'AgFlow' },
  { pattern: /^ANKR-/i, project: 'ankr-universe', category: 'ANKR Platform' },
  { pattern: /^GURUJI-/i, project: 'ankr-universe', category: 'GuruJi Reports' },
  { pattern: /^SESSION-/i, project: 'ankr-universe', category: 'Session Reports' },
  { pattern: /^COMPASS-/i, project: 'ankr-universe', category: 'COMPASS' }
];

// Document categories for smart indexing
const DOCUMENT_TYPES = {
  'TODO': { icon: '📋', description: 'Task lists and roadmaps' },
  'REPORT': { icon: '📊', description: 'Project reports' },
  'GUIDE': { icon: '📖', description: 'Implementation guides' },
  'COMPLETE': { icon: '✅', description: 'Completion reports' },
  'ANALYSIS': { icon: '🔍', description: 'Technical analysis' },
  'SUMMARY': { icon: '📝', description: 'Project summaries' },
  'PLAN': { icon: '🎯', description: 'Planning documents' },
  'STATUS': { icon: '📍', description: 'Status updates' }
};

// Stats tracking
const stats = {
  published: 0,
  updated: 0,
  errors: 0,
  startTime: new Date()
};

/**
 * Detect project from filename
 */
function detectProject(filename) {
  for (const { pattern, project, category } of PROJECT_PATTERNS) {
    if (pattern.test(filename)) {
      return { project, category };
    }
  }

  // Default: extract first word as project name
  const match = filename.match(/^([A-Z]+)-/);
  if (match) {
    const projectName = match[1].toLowerCase();
    return {
      project: projectName,
      category: match[1]
    };
  }

  // Fallback: misc
  return { project: 'misc', category: 'Miscellaneous' };
}

/**
 * Detect document type from filename
 */
function detectDocumentType(filename) {
  for (const [type, info] of Object.entries(DOCUMENT_TYPES)) {
    if (filename.toUpperCase().includes(type)) {
      return { type, ...info };
    }
  }
  return { type: 'DOC', icon: '📄', description: 'Documentation' };
}

/**
 * Generate or update README.md index
 */
function updateProjectIndex(projectDir, projectName, category) {
  const readmePath = path.join(projectDir, 'README.md');
  const files = fs.readdirSync(projectDir)
    .filter(f => f.endsWith('.md') && f !== 'README.md' && f !== 'index.md')
    .sort((a, b) => {
      // Sort by modification time, newest first
      const statA = fs.statSync(path.join(projectDir, a));
      const statB = fs.statSync(path.join(projectDir, b));
      return statB.mtime - statA.mtime;
    });

  if (files.length === 0) {
    // No files, don't create README
    return;
  }

  // Group files by type
  const grouped = {};
  files.forEach(file => {
    const docType = detectDocumentType(file);
    if (!grouped[docType.type]) {
      grouped[docType.type] = {
        ...docType,
        files: []
      };
    }
    grouped[docType.type].files.push(file);
  });

  // Generate README content
  const title = category || projectName.split('-').map(w =>
    w.charAt(0).toUpperCase() + w.slice(1)
  ).join(' ');

  let content = `# ${title} - Documentation\n\n`;
  content += `**Project:** ${projectName}\n`;
  content += `**Category:** ${category}\n`;
  content += `**Last Updated:** ${new Date().toISOString().split('T')[0]}\n`;
  content += `**Total Documents:** ${files.length}\n\n`;
  content += `---\n\n`;

  // Add quick links section
  content += `## 📚 All Documents\n\n`;

  // Sort groups by priority
  const priorityOrder = ['TODO', 'REPORT', 'GUIDE', 'COMPLETE', 'ANALYSIS', 'SUMMARY', 'PLAN', 'STATUS'];
  const sortedGroups = Object.entries(grouped).sort((a, b) => {
    const aIndex = priorityOrder.indexOf(a[0]);
    const bIndex = priorityOrder.indexOf(b[0]);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  sortedGroups.forEach(([type, info]) => {
    content += `### ${info.icon} ${type.charAt(0) + type.slice(1).toLowerCase()}\n`;
    content += `*${info.description}*\n\n`;

    info.files.forEach(file => {
      const displayName = file
        .replace(/\.md$/, '')
        .replace(/-/g, ' ')
        .replace(/_/g, ' ');

      // Get file stats
      const filePath = path.join(projectDir, file);
      const stats = fs.statSync(filePath);
      const date = stats.mtime.toISOString().split('T')[0];
      const sizeKB = Math.round(stats.size / 1024);

      content += `- **[${displayName}](${file})** `;
      content += `<sub>(${sizeKB} KB • ${date})</sub>\n`;
    });
    content += `\n`;
  });

  content += `---\n\n`;
  content += `**Auto-generated by ANKR Auto-Publisher**\n`;
  content += `**View online:** https://ankr.in/project/documents/${projectName}/\n`;
  content += `\n🙏 **Jai Guru Ji** | Built by ANKR Labs\n`;

  fs.writeFileSync(readmePath, content);

  // Also create index.md as symlink
  const indexPath = path.join(projectDir, 'index.md');
  if (fs.existsSync(indexPath)) {
    fs.unlinkSync(indexPath);
  }
  fs.copyFileSync(readmePath, indexPath);

  console.log(`  📝 Updated index: ${projectName}/README.md`);
}

/**
 * Publish a document
 */
function publishDocument(filePath) {
  try {
    const filename = path.basename(filePath);

    // Skip if not markdown
    if (!filename.endsWith('.md')) {
      return;
    }

    // Skip temporary files
    if (filename.startsWith('.') || filename.includes('~')) {
      return;
    }

    // Detect project
    const { project, category } = detectProject(filename);

    console.log(`\n📄 Publishing: ${filename}`);
    console.log(`  → Project: ${project}`);
    console.log(`  → Category: ${category}`);

    // Create project directory if needed
    const projectDir = path.join(PUBLISH_ROOT, project);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
      console.log(`  📁 Created directory: ${project}/`);
    }

    // Copy file
    const destPath = path.join(projectDir, filename);
    const isUpdate = fs.existsSync(destPath);

    fs.copyFileSync(filePath, destPath);

    if (isUpdate) {
      stats.updated++;
      console.log(`  ✅ Updated: ${project}/${filename}`);
    } else {
      stats.published++;
      console.log(`  ✅ Published: ${project}/${filename}`);
    }

    // Update project index
    updateProjectIndex(projectDir, project, category);

    // Log success
    const url = `https://ankr.in/project/documents/${project}/${filename}`;
    console.log(`  🌐 URL: ${url}`);

  } catch (error) {
    stats.errors++;
    console.error(`  ❌ Error publishing ${path.basename(filePath)}:`, error.message);
  }
}

/**
 * Initial scan of existing files
 */
function initialScan() {
  console.log('🔍 Scanning /root/ for markdown files...\n');

  const files = fs.readdirSync(WATCH_DIR)
    .filter(f => f.endsWith('.md'))
    .filter(f => !f.startsWith('.'))
    .filter(f => {
      const fullPath = path.join(WATCH_DIR, f);
      const stat = fs.statSync(fullPath);
      return stat.isFile();
    });

  console.log(`Found ${files.length} markdown files`);

  files.forEach(file => {
    const filePath = path.join(WATCH_DIR, file);
    publishDocument(filePath);
  });

  console.log(`\n✅ Initial scan complete!`);
  printStats();
}

/**
 * Print statistics
 */
function printStats() {
  const uptime = Math.round((Date.now() - stats.startTime) / 1000);
  console.log('\n' + '='.repeat(60));
  console.log('📊 Auto-Publisher Statistics');
  console.log('='.repeat(60));
  console.log(`📤 Published: ${stats.published} new documents`);
  console.log(`🔄 Updated:   ${stats.updated} existing documents`);
  console.log(`❌ Errors:    ${stats.errors} failed operations`);
  console.log(`⏱️  Uptime:    ${uptime} seconds`);
  console.log('='.repeat(60) + '\n');
}

/**
 * Main function
 */
function main() {
  console.log('🚀 ANKR Auto-Publisher Starting...\n');
  console.log('Configuration:');
  console.log(`  Watch Directory: ${WATCH_DIR}`);
  console.log(`  Publish Root:    ${PUBLISH_ROOT}`);
  console.log(`  Patterns:        ${PROJECT_PATTERNS.length} projects`);
  console.log('');

  // Verify directories exist
  if (!fs.existsSync(PUBLISH_ROOT)) {
    console.error(`❌ Publish root does not exist: ${PUBLISH_ROOT}`);
    process.exit(1);
  }

  // Initial scan
  initialScan();

  // Watch for new/changed files
  console.log(`\n👀 Watching ${WATCH_DIR} for changes...\n`);

  const watcher = chokidar.watch(`${WATCH_DIR}/*.md`, {
    ignored: IGNORE_PATTERNS,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  });

  watcher
    .on('add', filePath => {
      console.log(`\n🆕 New file detected: ${path.basename(filePath)}`);
      publishDocument(filePath);
    })
    .on('change', filePath => {
      console.log(`\n📝 File changed: ${path.basename(filePath)}`);
      publishDocument(filePath);
    })
    .on('error', error => {
      console.error('❌ Watcher error:', error);
    });

  // Stats every 5 minutes
  setInterval(() => {
    if (stats.published > 0 || stats.updated > 0 || stats.errors > 0) {
      printStats();
    }
  }, 5 * 60 * 1000);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down Auto-Publisher...');
    printStats();
    watcher.close();
    process.exit(0);
  });

  console.log('✅ Auto-Publisher is running!');
  console.log('   Press Ctrl+C to stop\n');
}

// Run
main();
