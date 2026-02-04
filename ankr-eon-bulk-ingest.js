#!/usr/bin/env node
/**
 * Bulk ingest all repository docs into ANKR EON.
 * Reuses ankr-viewer-eon-client.js for the eon REST API.
 * Usage: node ankr-eon-bulk-ingest.js [--all | --dir /path]
 */

const fs = require('fs');
const path = require('path');
const eonClient = require('./ankr-viewer-eon-client');

const SKIP_FILES = new Set([
  'LICENSE.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md',
  'SECURITY.md', 'PULL_REQUEST_TEMPLATE.md', 'ISSUE_TEMPLATE.md',
]);

const REPO_DIRS = [
  { dir: '/root/ankr-universe-docs', carrierId: 'ankr-docs', docType: 'documentation' },
  { dir: '/root/ankr-packages/@ankr', carrierId: 'ankr-packages', docType: 'package-readme' },
  { dir: '/root/ankr-packages/@ankrshield', carrierId: 'ankrshield', docType: 'package-readme' },
  { dir: '/root/ankr-packages/@fr8x', carrierId: 'fr8x', docType: 'package-readme' },
  { dir: '/root/ankr-packages/@vyomo', carrierId: 'vyomo', docType: 'package-readme' },
  { dir: '/root/ankr-packages/@wowtruck', carrierId: 'wowtruck', docType: 'package-readme' },
  { dir: '/root/ankr-packages/@bfc', carrierId: 'bfc', docType: 'package-readme' },
  { dir: '/root/ankr-packages/@everpure', carrierId: 'everpure', docType: 'package-readme' },
  { dir: '/root/ankr-packages/@freightbox', carrierId: 'freightbox', docType: 'package-readme' },
  { dir: '/root/ankr-packages/@powererp', carrierId: 'powererp', docType: 'package-readme' },
  { dir: '/root/ankr-packages/@ankr-ui', carrierId: 'ankr-ui', docType: 'package-readme' },
  { dir: '/root/ankr-packages/@ankrcrm', carrierId: 'ankrcrm', docType: 'package-readme' },
  { dir: '/root/ankr-packages/@ankrshield-ui', carrierId: 'ankrshield-ui', docType: 'package-readme' },
  { dir: '/root/ankr-packages/@fr8x-ui', carrierId: 'fr8x-ui', docType: 'package-readme' },
  { dir: '/root/ankr-packages/@vyomo-ui', carrierId: 'vyomo-ui', docType: 'package-readme' },
  { dir: '/root/ankr-universe', carrierId: 'ankr-universe', docType: 'documentation' },
  { dir: '/root/swayam', carrierId: 'swayam', docType: 'documentation' },
  { dir: '/root/kinara-platform', carrierId: 'kinara', docType: 'documentation' },
  { dir: '/root/power-erp', carrierId: 'power-erp', docType: 'documentation' },
  { dir: '/root/ankr-nexus-ui', carrierId: 'ankr-nexus-ui', docType: 'documentation' },
  { dir: '/root/ankr-ai-gateway', carrierId: 'ankr-ai-gateway', docType: 'documentation' },
  { dir: '/root/bani-repo', carrierId: 'bani', docType: 'documentation' },
  { dir: '/root/ankr-confucius', carrierId: 'confucius', docType: 'documentation' },
  { dir: '/root/ankr-skill-loader', carrierId: 'ankr-skill-loader', docType: 'documentation' },
  // Large repos — only ingest top-level docs, not deeply nested
  { dir: '/root/rocketlang', carrierId: 'rocketlang', docType: 'documentation', maxDepth: 2 },
  { dir: '/root/ankr-labs-nx', carrierId: 'ankr-labs', docType: 'documentation', maxDepth: 2 },
];

function scanDir(dir, maxDepth = 10, currentDepth = 0) {
  const files = [];
  if (currentDepth > maxDepth) return files;
  if (!fs.existsSync(dir)) return files;

  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      if (item === 'node_modules' || item === '.git' || item === 'dist' || item === '.next') continue;
      const fp = path.join(dir, item);
      try {
        const stats = fs.statSync(fp);
        if (stats.isDirectory()) {
          files.push(...scanDir(fp, maxDepth, currentDepth + 1));
        } else if (item.endsWith('.md') && !item.startsWith('.') && !SKIP_FILES.has(item)) {
          // Skip tiny files (<100 bytes) and huge files (>200KB)
          if (stats.size >= 100 && stats.size <= 200000) {
            files.push(fp);
          }
        }
      } catch (e) {
        // skip inaccessible files
      }
    }
  } catch (e) {
    // skip inaccessible dirs
  }
  return files;
}

function classifyDoc(fileName) {
  if (/PROJECT-REPORT/i.test(fileName)) return 'project-report';
  if (/TODO/i.test(fileName)) return 'todo';
  if (/INVESTOR/i.test(fileName)) return 'investor-slides';
  if (/ARCHITECTURE/i.test(fileName)) return 'architecture';
  if (/API/i.test(fileName)) return 'api-docs';
  if (/SETUP|INSTALL/i.test(fileName)) return 'setup-guide';
  if (fileName === 'README.md') return 'readme';
  if (fileName === 'index.md') return 'index';
  return 'documentation';
}

function extractTitle(content, fileName) {
  // Try frontmatter title
  const fmMatch = content.match(/^---\n[\s\S]*?title:\s*["']?(.+?)["']?\s*\n[\s\S]*?---/);
  if (fmMatch) return fmMatch[1];
  // Try first heading
  const h1Match = content.match(/^#\s+(.+)/m);
  if (h1Match) return h1Match[1].replace(/[*_`]/g, '');
  return fileName.replace('.md', '');
}

function extractTags(content, fileName, carrierId) {
  const tags = [carrierId];
  // From frontmatter
  const tagMatch = content.match(/tags:\s*\[(.*?)\]/);
  if (tagMatch) {
    tagMatch[1].split(',').map(t => t.trim().replace(/['"]/g, '')).filter(Boolean).forEach(t => tags.push(t));
  }
  // From filename
  const docType = classifyDoc(fileName);
  if (docType !== 'documentation') tags.push(docType);
  return [...new Set(tags.filter(Boolean))];
}

async function main() {
  console.log('=== ANKR EON Bulk Document Ingest ===\n');

  // Check eon health
  const healthy = await eonClient.isHealthy();
  if (!healthy) {
    console.error('Eon not available at', eonClient.EON_BASE);
    process.exit(1);
  }
  console.log('Eon healthy at', eonClient.EON_BASE);

  // Get initial stats
  const initialStats = await eonClient.getStats();
  console.log(`Before: ${initialStats?.totalDocuments || 0} docs, ${initialStats?.totalChunks || 0} chunks\n`);

  let totalIngested = 0;
  let totalErrors = 0;
  let totalSkipped = 0;

  // Check if user passed --dir
  const dirArg = process.argv.indexOf('--dir');
  const dirs = dirArg >= 0 ? [{ dir: process.argv[dirArg + 1], carrierId: path.basename(process.argv[dirArg + 1]), docType: 'documentation' }] : REPO_DIRS;

  for (const repo of dirs) {
    if (!fs.existsSync(repo.dir)) {
      console.log(`SKIP ${repo.dir} (not found)`);
      continue;
    }

    const files = scanDir(repo.dir, repo.maxDepth || 10);
    if (files.length === 0) {
      continue;
    }

    console.log(`\n--- ${repo.carrierId} (${files.length} docs from ${repo.dir}) ---`);

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const fileName = path.basename(file);
        const title = extractTitle(content, fileName);
        const docType = classifyDoc(fileName) || repo.docType;
        const tags = extractTags(content, fileName, repo.carrierId);

        const result = await eonClient.ingest({
          title,
          content: content.slice(0, 15000), // limit to 15KB for faster embedding
          docType,
          tags,
          carrierId: repo.carrierId,
        });

        if (result) {
          totalIngested++;
          if (totalIngested % 25 === 0) {
            process.stdout.write(`  [${totalIngested}] `);
          }
        } else {
          totalErrors++;
        }
      } catch (err) {
        totalErrors++;
      }
    }

    console.log(`  ${repo.carrierId}: ingested from ${files.length} files`);
  }

  // Get final stats
  const finalStats = await eonClient.getStats();
  console.log('\n=== Bulk Ingest Complete ===');
  console.log(`Ingested: ${totalIngested}`);
  console.log(`Errors: ${totalErrors}`);
  console.log(`After: ${finalStats?.totalDocuments || '?'} docs, ${finalStats?.totalChunks || '?'} chunks`);
  console.log(`Doc types:`, JSON.stringify(finalStats?.byDocType || {}, null, 2));
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
