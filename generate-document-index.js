#!/usr/bin/env node

/**
 * Generate a searchable JSON index of all documents
 * This provides instant file-name search before hitting vector DB
 */

const fs = require('fs');
const path = require('path');

const DOCS_ROOT = '/root/ankr-universe-docs/project/documents';
const OUTPUT = '/var/www/ankr-interact/project/documents/docs-index.json';

console.log('📚 Generating document index...\n');

const index = [];
let fileCount = 0;

// Recursively scan directories
function scanDirectory(dir, project = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
            // Use directory name as project if at root level
            const isProject = path.dirname(fullPath) === DOCS_ROOT;
            scanDirectory(fullPath, isProject ? entry.name : project);
        } else if (entry.name.endsWith('.md') || entry.name.endsWith('.html')) {
            try {
                const stats = fs.statSync(fullPath);
                const relativePath = path.relative(DOCS_ROOT, fullPath);
                
                // Read first few lines for description
                const content = fs.readFileSync(fullPath, 'utf-8');
                const lines = content.split('\n').filter(l => l.trim());
                let title = entry.name.replace(/\.(md|html)$/, '');
                let description = '';
                
                // Extract title from markdown
                for (const line of lines.slice(0, 20)) {
                    if (line.startsWith('# ')) {
                        title = line.replace(/^#\s+/, '');
                        break;
                    }
                }
                
                // Extract description from first paragraph
                for (const line of lines.slice(0, 30)) {
                    if (line.length > 20 && !line.startsWith('#') && !line.startsWith('**')) {
                        description = line.substring(0, 200);
                        break;
                    }
                }
                
                index.push({
                    id: `${project}/${entry.name}`,
                    filename: entry.name,
                    title,
                    description,
                    project,
                    path: relativePath,
                    url: `/project/documents/${relativePath}`,
                    size: stats.size,
                    modified: stats.mtime.toISOString(),
                    type: entry.name.endsWith('.md') ? 'markdown' : 'html',
                });
                
                fileCount++;
            } catch (err) {
                console.error(`  ❌ Error processing ${fullPath}:`, err.message);
            }
        }
    }
}

// Scan all documents
scanDirectory(DOCS_ROOT);

// Sort by project, then filename
index.sort((a, b) => {
    if (a.project !== b.project) return a.project.localeCompare(b.project);
    return a.filename.localeCompare(b.filename);
});

// Write index
fs.writeFileSync(OUTPUT, JSON.stringify({
    generated: new Date().toISOString(),
    total: index.length,
    projects: [...new Set(index.map(d => d.project))].length,
    documents: index,
}, null, 2));

console.log(`✅ Index generated!`);
console.log(`   📄 ${fileCount} documents`);
console.log(`   📁 ${[...new Set(index.map(d => d.project))].length} projects`);
console.log(`   💾 Saved to: ${OUTPUT}`);
console.log('');

// Generate stats by project
const byProject = {};
index.forEach(doc => {
    if (!byProject[doc.project]) byProject[doc.project] = 0;
    byProject[doc.project]++;
});

console.log('📊 Documents by project:');
Object.entries(byProject)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([project, count]) => {
        console.log(`   ${project.padEnd(30)} ${count.toString().padStart(4)} docs`);
    });
