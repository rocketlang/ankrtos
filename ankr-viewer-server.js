#!/usr/bin/env node

/**
 * ANKR Viewer Server
 * Serves documentation from /root/ankr-universe-docs/ via REST API
 * Expected at https://ankr.in/api/
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const eonClient = require('./ankr-viewer-eon-client');
const { documentsHomePage, projectDetailPage, documentViewerPage } = require('./ankr-viewer-html');

const app = express();
const PORT = process.env.PORT || process.env.ANKR_VIEWER_PORT || 3080;
const DOCS_ROOT = process.env.DOCS_ROOT || '/root/ankr-universe-docs';

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', async (req, res) => {
  const eonHealthy = await eonClient.isHealthy().catch(() => false);
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    eon: { available: eonHealthy, url: eonClient.EON_BASE },
    searchMode: eonHealthy ? 'eon-hybrid' : 'regex-fallback',
  });
});

// List files in directory
app.get('/api/files', (req, res) => {
  try {
    const requestedPath = req.query.path || '';
    const fullPath = path.join(DOCS_ROOT, requestedPath);

    // Security: prevent directory traversal
    if (!fullPath.startsWith(DOCS_ROOT)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Path not found' });
    }

    const stats = fs.statSync(fullPath);

    if (!stats.isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory' });
    }

    const items = fs.readdirSync(fullPath).map(name => {
      const itemPath = path.join(fullPath, name);
      const itemStats = fs.statSync(itemPath);
      const relativePath = path.relative(DOCS_ROOT, itemPath);

      return {
        name,
        path: relativePath,
        type: itemStats.isDirectory() ? 'directory' : 'file',
        size: itemStats.size,
        modified: itemStats.mtime,
        extension: path.extname(name)
      };
    });

    // Sort: directories first, then files
    items.sort((a, b) => {
      if (a.type === 'directory' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });

    res.json(items);
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get file content with frontmatter
app.get('/api/file', (req, res) => {
  try {
    const requestedPath = req.query.path;
    if (!requestedPath) {
      return res.status(400).json({ error: 'Path parameter required' });
    }

    const fullPath = path.join(DOCS_ROOT, requestedPath);

    // Security: prevent directory traversal
    if (!fullPath.startsWith(DOCS_ROOT)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      return res.status(400).json({ error: 'Path is a directory' });
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const extension = path.extname(fullPath);

    // Parse frontmatter for markdown files
    if (extension === '.md' || extension === '.mdx') {
      const parsed = matter(content);
      res.json({
        content: parsed.content,
        frontmatter: parsed.data,
        type: 'markdown'
      });
    } else {
      res.json({
        content,
        type: extension.slice(1) || 'text'
      });
    }
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Raw file download
app.get('/api/file/raw', (req, res) => {
  try {
    const requestedPath = req.query.path;
    if (!requestedPath) {
      return res.status(400).json({ error: 'Path parameter required' });
    }

    const fullPath = path.join(DOCS_ROOT, requestedPath);

    if (!fullPath.startsWith(DOCS_ROOT)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(fullPath);
  } catch (error) {
    console.error('Error sending file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper: Regex-based search (fallback when eon is unavailable)
function regexSearch(query) {
  const results = [];
  const searchRegex = new RegExp(query, 'gi');
  const lowerQuery = query.toLowerCase();

  function searchDirectory(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        searchDirectory(fullPath);
      } else if (item.endsWith('.md') || item.endsWith('.mdx')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const parsed = matter(content);
          if (content.match(searchRegex)) {
            const relativePath = path.relative(DOCS_ROOT, fullPath);
            const lines = parsed.content.split('\n');
            const matchingLines = lines.filter(line => line.match(searchRegex));
            const excerpt = matchingLines.slice(0, 3).join(' ').slice(0, 200);

            let score = 10;
            const title = (parsed.data.title || item).toLowerCase();
            const fileName = item.toLowerCase();
            if (title.includes(lowerQuery)) score += 100;
            if (fileName.includes(lowerQuery)) score += 50;
            if (parsed.data.tags && parsed.data.tags.some(t => t.toLowerCase().includes(lowerQuery))) score += 30;
            if (parsed.data.category && parsed.data.category.toLowerCase().includes(lowerQuery)) score += 20;

            const parts = relativePath.split(path.sep);
            let project = '';
            if (parts[0] === 'project' && parts[1] === 'documents' && parts.length > 2) {
              project = parts[2];
            } else if (item.match(/^ANKR-(.+?)-(PROJECT|TODO)/)) {
              project = item.match(/^ANKR-(.+?)-(PROJECT|TODO)/)[1].toLowerCase();
            }

            results.push({
              path: relativePath,
              name: parsed.data.title || item,
              excerpt,
              category: parsed.data.category || path.dirname(relativePath),
              tags: parsed.data.tags || [],
              project,
              score,
              size: stats.size,
              modified: stats.mtime
            });
          }
        } catch (err) {
          // Skip files that can't be read
        }
      }
    }
  }

  searchDirectory(DOCS_ROOT);
  results.sort((a, b) => b.score - a.score);
  return results;
}

// Known product names for fuzzy title matching
const KNOWN_PRODUCTS = [
  'icd', 'wms', 'bfc', 'wowtruck', 'freightbox', 'fr8x', 'complymitra',
  'flowcanvas', 'bani', 'sunosunao', 'swayam', 'vyomo', 'everpure',
  'ankrshield', 'kinara', 'openclaude', 'opencode', 'rocketlang',
  'confucius', 'eon', 'universe', 'forge', 'scmbox', 'powererp',
];

function extractProjectFromTitle(title) {
  if (!title) return '';
  const lower = title.toLowerCase().replace(/[^\w\s-]/g, '');

  // 1. "ANKR-ICD-PROJECT-REPORT" → "icd"
  const dashMatch = title.match(/^ANKR-([A-Za-z][A-Za-z0-9]+?)-(PROJECT|TODO|INVESTOR|COMPLETE|SLIDES)/i);
  if (dashMatch) return dashMatch[1].toLowerCase();

  // 2. "ankrICD — *" or "ankrBFC - *"
  const camelMatch = title.match(/^ankr([A-Z][A-Za-z]+)/);
  if (camelMatch) return camelMatch[1].toLowerCase();

  // 3. "ANKR Universe - *" or "ANKR-UNIVERSE-*"
  const spaceMatch = title.match(/^ANKR[\s-]+([A-Za-z][A-Za-z]+)/i);
  if (spaceMatch) return spaceMatch[1].toLowerCase();

  // 4. Numbered prefix: "06-ANKRBFC" → "bfc"
  const numMatch = title.match(/^\d+-(?:ANKR)?([A-Za-z][A-Za-z]+)/i);
  if (numMatch) return numMatch[1].toLowerCase();

  // 5. Check for known product name anywhere in title
  for (const prod of KNOWN_PRODUCTS) {
    if (lower.includes(prod)) return prod;
  }

  // 6. "ProductName - Subtitle" pattern
  const subtitleMatch = title.match(/^([A-Za-z][A-Za-z0-9]+)\s*[-—:]/);
  if (subtitleMatch) {
    const name = subtitleMatch[1].toLowerCase();
    // Skip generic words
    if (!['user', 'the', 'how', 'what', 'guide', 'setup', 'readme', 'index', 'sprint', 'phase'].includes(name)) {
      return name;
    }
  }

  return '';
}

// Helper: Group search results by project
function groupByProject(results) {
  const grouped = {};
  for (const r of results) {
    const key = r.project || '_other';
    if (!grouped[key]) {
      grouped[key] = {
        project: key,
        title: key === '_other' ? 'Other Documents' : key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        count: 0,
        results: [],
      };
    }
    grouped[key].count++;
    if (grouped[key].results.length < 5) {
      grouped[key].results.push(r);
    }
  }
  return grouped;
}

// Search across documents — eon hybrid search first, regex fallback
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const project = req.query.project;
    const limit = parseInt(req.query.limit) || 50;

    if (!query) {
      return res.json({ results: [], grouped: {}, source: 'none', totalResults: 0 });
    }

    let results = null;
    let source = 'regex-fallback';

    // Try eon hybrid search first (BM25 + vector + RRF)
    try {
      const eonHealthy = await eonClient.isHealthy();
      if (eonHealthy) {
        const eonResults = await eonClient.search(query, {
          limit,
          carrierId: project || undefined,
          rerank: false,
          threshold: 0.15,
        });
        if (eonResults && eonResults.length > 0) {
          // Deduplicate by title (multiple chunks from same doc)
          const seen = new Set();
          const deduped = eonResults.filter(r => {
            const key = r.title || r.id;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

          results = deduped.map(r => {
            // Extract project from carrierId, path, or title
            let project = r.metadata?.carrierId || '';
            if (!project) {
              const spMatch = (r.sourcePath || '').match(/project\/documents\/([^/]+)/);
              if (spMatch) {
                project = spMatch[1];
              } else {
                project = extractProjectFromTitle(r.title || '');
              }
            }

            // Score: prefer rrfScore scaled, fallback to text/vector similarity
            const rrf = r.scores?.rrfScore || 0;
            const textSim = r.scores?.textSimilarity || 0;
            const vecSim = r.scores?.vectorSimilarity || 0;
            const bestScore = rrf > 0 ? Math.min(rrf * 10000, 100) : Math.max(textSim, vecSim) * 100;

            return {
              path: r.sourcePath || r.title || '',
              name: r.title || '',
              excerpt: (r.content || '').replace(/^---[\s\S]*?---\s*/, '').slice(0, 200),
              category: r.docType || 'documentation',
              tags: r.metadata?.tags?.length ? r.metadata.tags : [r.docType, r.section].filter(Boolean),
              project,
              score: Math.round(bestScore),
              similarity: vecSim > 0 ? Math.round(vecSim * 100) : undefined,
              size: 0,
              modified: null,
              section: r.section || '',
            };
          });
          source = 'eon-hybrid';
        }
      }
    } catch (eonErr) {
      console.warn('[Search] Eon failed, falling back to regex:', eonErr.message);
    }

    // Fallback to regex search
    if (!results) {
      results = regexSearch(query);
      source = 'regex-fallback';
    }

    results = results.slice(0, limit);
    const grouped = groupByProject(results);

    res.json({ results, grouped, source, totalResults: results.length });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get knowledge graph data
app.get('/api/knowledge/graph', (req, res) => {
  try {
    const nodes = [];
    const edges = [];
    const nodeMap = new Map();

    function scanDirectory(dir, category = 'root') {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        const relativePath = path.relative(DOCS_ROOT, fullPath);

        if (stats.isDirectory()) {
          const nodeId = relativePath;
          if (!nodeMap.has(nodeId)) {
            nodes.push({
              id: nodeId,
              label: item,
              type: 'category',
              size: 20
            });
            nodeMap.set(nodeId, true);
          }

          // Edge from parent
          const parentPath = path.dirname(relativePath);
          if (parentPath !== '.') {
            edges.push({
              source: parentPath,
              target: nodeId,
              type: 'contains'
            });
          }

          scanDirectory(fullPath, item);
        } else if (item.endsWith('.md')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const parsed = matter(content);

            const nodeId = relativePath;
            nodes.push({
              id: nodeId,
              label: parsed.data.title || item.replace('.md', ''),
              type: 'document',
              size: 10,
              category: parsed.data.category || category
            });

            // Edge to parent directory
            const parentPath = path.dirname(relativePath);
            edges.push({
              source: parentPath,
              target: nodeId,
              type: 'contains'
            });
          } catch (err) {
            // Skip
          }
        }
      }
    }

    scanDirectory(DOCS_ROOT);

    res.json({ nodes, edges });
  } catch (error) {
    console.error('Error generating graph:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get topics
app.get('/api/knowledge/topics', (req, res) => {
  try {
    const topics = new Set();

    function scanForTopics(dir) {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          scanForTopics(fullPath);
        } else if (item.endsWith('.md')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const parsed = matter(content);

            if (parsed.data.category) {
              topics.add(parsed.data.category);
            }

            if (parsed.data.tags) {
              parsed.data.tags.forEach(tag => topics.add(tag));
            }
          } catch (err) {
            // Skip
          }
        }
      }
    }

    scanForTopics(DOCS_ROOT);
    res.json(Array.from(topics).sort());
  } catch (error) {
    console.error('Error getting topics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bookmarks (in-memory for now)
const bookmarks = [];

app.get('/api/bookmarks', (req, res) => {
  res.json(bookmarks);
});

app.post('/api/bookmarks', (req, res) => {
  const { path, name } = req.body;
  const bookmark = { id: Date.now().toString(), path, name, timestamp: new Date() };
  bookmarks.push(bookmark);
  res.json(bookmark);
});

app.delete('/api/bookmarks', (req, res) => {
  const path = req.query.path;
  const index = bookmarks.findIndex(b => b.path === path);
  if (index !== -1) {
    bookmarks.splice(index, 1);
  }
  res.json({ success: true });
});

// Recent files (in-memory for now)
const recentFiles = [];

app.get('/api/recent', (req, res) => {
  res.json(recentFiles.slice(0, 20));
});

app.post('/api/recent', (req, res) => {
  const { path, name } = req.body;

  // Remove if already exists
  const index = recentFiles.findIndex(f => f.path === path);
  if (index !== -1) {
    recentFiles.splice(index, 1);
  }

  // Add to front
  recentFiles.unshift({ path, name, timestamp: new Date() });

  // Keep only 50 most recent
  if (recentFiles.length > 50) {
    recentFiles.length = 50;
  }

  res.json({ success: true });
});

// List all projects with metadata from .viewerrc
app.get('/api/projects', (req, res) => {
  try {
    const projects = [];
    const projectDirs = [
      path.join(DOCS_ROOT, 'project', 'documents'),
      DOCS_ROOT // Also scan root-level project files
    ];

    // Scan project/documents/ for directories with .viewerrc
    const docsDir = path.join(DOCS_ROOT, 'project', 'documents');
    if (fs.existsSync(docsDir)) {
      const items = fs.readdirSync(docsDir);
      for (const item of items) {
        const fullPath = path.join(docsDir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          const viewerrc = path.join(fullPath, '.viewerrc');
          const indexMd = path.join(fullPath, 'index.md');
          const relativePath = path.relative(DOCS_ROOT, fullPath);

          const project = {
            id: item,
            path: relativePath,
            title: item,
            description: '',
            category: 'Project',
            featured: false,
            priority: 99,
            tags: [],
            stats: {},
            files: [],
            fileCount: 0
          };

          // Load .viewerrc metadata
          if (fs.existsSync(viewerrc)) {
            try {
              const meta = JSON.parse(fs.readFileSync(viewerrc, 'utf-8'));
              Object.assign(project, {
                title: meta.title || item,
                description: meta.description || '',
                category: meta.category || 'Project',
                featured: meta.featured || false,
                priority: meta.priority || 99,
                tags: meta.tags || [],
                stats: meta.stats || {},
                author: meta.author || '',
                lastUpdated: meta.lastUpdated || '',
                modules: meta.modules || [],
                product: meta.product || ''
              });
            } catch (e) {
              // Skip invalid .viewerrc
            }
          }

          // Load index.md frontmatter as fallback
          if (fs.existsSync(indexMd) && !project.description) {
            try {
              const content = fs.readFileSync(indexMd, 'utf-8');
              const parsed = matter(content);
              if (parsed.data.title) project.title = parsed.data.title;
              if (parsed.data.description) project.description = parsed.data.description;
              if (parsed.data.tags) project.tags = parsed.data.tags;
            } catch (e) {
              // Skip
            }
          }

          // List files in this project
          try {
            const projectFiles = fs.readdirSync(fullPath)
              .filter(f => f.endsWith('.md') && f !== 'index.md')
              .map(f => {
                const filePath = path.join(fullPath, f);
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                const parsed = matter(fileContent);
                return {
                  name: f,
                  path: path.relative(DOCS_ROOT, filePath),
                  title: parsed.data.title || f.replace('.md', ''),
                  size: fs.statSync(filePath).size,
                  category: parsed.data.category || project.category
                };
              });
            project.files = projectFiles;
            project.fileCount = projectFiles.length;
            if (!project.stats.documents) project.stats.documents = projectFiles.length;
          } catch (e) {
            // Skip
          }

          projects.push(project);
        }
      }
    }

    // Also find root-level project report/todo files (ANKR-*-PROJECT-REPORT.md, ANKR-*-TODO.md)
    try {
      const rootFiles = fs.readdirSync(DOCS_ROOT);
      const projectReports = {};

      for (const file of rootFiles) {
        const match = file.match(/^ANKR-(.+?)-(PROJECT-REPORT|TODO)\.md$/);
        if (match) {
          const projectKey = match[1].toLowerCase();
          if (!projectReports[projectKey]) {
            projectReports[projectKey] = { reports: [], todos: [] };
          }
          const filePath = path.join(DOCS_ROOT, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const parsed = matter(content);

          const fileInfo = {
            name: file,
            path: file,
            title: parsed.data.title || file.replace('.md', ''),
            size: fs.statSync(filePath).size,
            type: match[2] === 'TODO' ? 'todo' : 'report'
          };

          if (match[2] === 'TODO') {
            projectReports[projectKey].todos.push(fileInfo);
          } else {
            projectReports[projectKey].reports.push(fileInfo);
          }
        }
      }

      // Add root-level projects that aren't already in project/documents/
      for (const [key, data] of Object.entries(projectReports)) {
        const exists = projects.some(p => p.id === key || p.id === `dodd-${key}`);
        if (!exists) {
          const allFiles = [...data.reports, ...data.todos];
          projects.push({
            id: key,
            path: '',
            title: `ANKR ${key.toUpperCase()}`,
            description: `Project reports and TODO for ANKR ${key.toUpperCase()}`,
            category: 'Product Documentation',
            featured: false,
            priority: 50,
            tags: [key],
            stats: {},
            files: allFiles,
            fileCount: allFiles.length
          });
        }
      }
    } catch (e) {
      // Skip
    }

    // Also discover ALL top-level subdirectories in docs root as projects
    // (ankrshield, openclaude, investor-apps, ai-swarm, etc.)
    try {
      const rootItems = fs.readdirSync(DOCS_ROOT);
      for (const item of rootItems) {
        const fullPath = path.join(DOCS_ROOT, item);
        if (!fs.statSync(fullPath).isDirectory()) continue;
        if (item === 'project' || item.startsWith('.')) continue; // skip project/ dir and hidden

        const existingById = projects.some(p => p.id === item);
        if (existingById) continue;

        // Count .md files in this directory (recursive)
        let fileCount = 0;
        const files = [];
        function countMd(dir) {
          try {
            for (const f of fs.readdirSync(dir)) {
              const fp = path.join(dir, f);
              const st = fs.statSync(fp);
              if (st.isDirectory()) { countMd(fp); continue; }
              if (!f.endsWith('.md') || f.startsWith('.')) continue;
              fileCount++;
              if (files.length < 20) {
                try {
                  const content = fs.readFileSync(fp, 'utf-8');
                  const parsed = matter(content);
                  files.push({
                    name: f,
                    path: path.relative(DOCS_ROOT, fp),
                    title: parsed.data.title || f.replace('.md', ''),
                    size: st.size,
                    category: parsed.data.category || item,
                  });
                } catch(e) {
                  files.push({ name: f, path: path.relative(DOCS_ROOT, fp), title: f.replace('.md', ''), size: st.size, category: item });
                }
              }
            }
          } catch(e) {}
        }
        countMd(fullPath);

        if (fileCount === 0) continue; // skip empty dirs

        // Check for .viewerrc or index.md
        const viewerrc = path.join(fullPath, '.viewerrc');
        const indexMd = path.join(fullPath, 'index.md');
        let title = item.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        let description = '';
        let tags = [item];
        let meta = {};

        if (fs.existsSync(viewerrc)) {
          try { meta = JSON.parse(fs.readFileSync(viewerrc, 'utf-8')); } catch(e) {}
        }
        if (fs.existsSync(indexMd)) {
          try {
            const parsed = matter(fs.readFileSync(indexMd, 'utf-8'));
            if (parsed.data.title) title = parsed.data.title;
            if (parsed.data.description) description = parsed.data.description;
            if (parsed.data.tags) tags = parsed.data.tags;
          } catch(e) {}
        }

        projects.push({
          id: item,
          path: item,
          title: meta.title || title,
          description: meta.description || description || `${fileCount} documents in ${item}`,
          category: meta.category || 'Documentation',
          featured: meta.featured || false,
          priority: meta.priority || 70,
          tags: meta.tags || tags,
          stats: meta.stats && meta.stats.documents ? meta.stats : { documents: fileCount },
          files,
          fileCount,
        });
      }
    } catch(e) {}

    // Sort by priority (lower = higher priority), then featured first
    projects.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (a.priority || 99) - (b.priority || 99);
    });

    res.json(projects);
  } catch (error) {
    console.error('Error listing projects:', error);
    res.status(500).json({ error: error.message });
  }
});

// Related documents via eon semantic similarity
app.get('/api/search/related', async (req, res) => {
  try {
    const docPath = req.query.path;
    const limit = parseInt(req.query.limit) || 5;
    if (!docPath) return res.json([]);

    const fullPath = path.join(DOCS_ROOT, docPath);
    if (!fullPath.startsWith(DOCS_ROOT) || !fs.existsSync(fullPath)) {
      return res.json([]);
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const parsed = matter(content);
    const searchQuery = (parsed.data.title || '') + ' ' + parsed.content.slice(0, 500);

    const eonHealthy = await eonClient.isHealthy();
    if (eonHealthy) {
      const results = await eonClient.search(searchQuery, { limit: limit + 5 });
      if (results) {
        // Deduplicate and filter out self
        const seen = new Set();
        const baseName = path.basename(docPath, '.md');
        const filtered = results
          .filter(r => {
            const key = r.title || r.id;
            if (seen.has(key)) return false;
            seen.add(key);
            const rPath = r.sourcePath || r.title || '';
            const rTitle = r.title || '';
            // Filter out self by path, title, or basename match
            if (rPath === docPath) return false;
            if (rTitle === parsed.data.title) return false;
            if (rTitle.replace(/\s+/g, '-') === baseName || baseName.includes(rTitle.replace(/\s+/g, '-'))) return false;
            return true;
          })
          .slice(0, limit)
          .map(r => ({
            path: r.sourcePath || r.title || '',
            name: r.title || '',
            excerpt: (r.content || '').replace(/^---[\s\S]*?---\s*/, '').slice(0, 150),
            score: Math.round((r.scores?.rrfScore || 0) * 10000),
            similarity: r.scores?.vectorSimilarity > 0 ? Math.round(r.scores.vectorSimilarity * 100) : undefined,
          }));
        return res.json({ results: filtered });
      }
    }
    res.json([]);
  } catch (error) {
    console.error('Error getting related docs:', error);
    res.json([]);
  }
});

// Per-project document listing via eon
app.get('/api/projects/:project/docs', async (req, res) => {
  try {
    const project = req.params.project;
    const limit = parseInt(req.query.limit) || 30;

    const eonHealthy = await eonClient.isHealthy();
    if (eonHealthy) {
      const results = await eonClient.search('*', { carrierId: project, limit });
      if (results && results.length > 0) {
        // Deduplicate by title
        const seen = new Set();
        const deduped = results.filter(r => {
          const key = r.title || r.id;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        return res.json({
          project,
          source: 'eon',
          docs: deduped.map(r => ({
            path: r.sourcePath || r.title || '',
            name: r.title || '',
            docType: r.docType || 'documentation',
            tags: r.metadata?.tags?.length ? r.metadata.tags : [r.docType].filter(Boolean),
          })),
        });
      }
    }

    // Fallback: scan project directory
    const projectDir = path.join(DOCS_ROOT, 'project', 'documents', project);
    if (fs.existsSync(projectDir)) {
      const files = fs.readdirSync(projectDir)
        .filter(f => f.endsWith('.md') && f !== 'index.md')
        .map(f => {
          const fp = path.join(projectDir, f);
          const content = fs.readFileSync(fp, 'utf-8');
          const parsed = matter(content);
          return {
            path: path.relative(DOCS_ROOT, fp),
            name: parsed.data.title || f.replace('.md', ''),
            docType: 'documentation',
            tags: parsed.data.tags || [],
          };
        });
      return res.json({ project, source: 'filesystem', docs: files });
    }

    res.json({ project, source: 'none', docs: [] });
  } catch (error) {
    console.error('Error listing project docs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reingest documents into eon (called by publish scripts)
app.post('/api/eon/reingest', async (req, res) => {
  try {
    const eonHealthy = await eonClient.isHealthy();
    if (!eonHealthy) {
      return res.status(503).json({ error: 'Eon not available' });
    }

    const { files, project } = req.body || {};
    let count = 0;
    let errors = 0;

    function scanDir(dir) {
      const result = [];
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fp = path.join(dir, item);
        const stats = fs.statSync(fp);
        if (stats.isDirectory()) {
          result.push(...scanDir(fp));
        } else if (item.endsWith('.md') && !item.startsWith('.')) {
          result.push(fp);
        }
      }
      return result;
    }

    let targetFiles;
    if (files && files.length > 0) {
      targetFiles = files.map(f => path.join(DOCS_ROOT, f)).filter(f => fs.existsSync(f));
    } else if (project) {
      const projectDir = path.join(DOCS_ROOT, 'project', 'documents', project);
      targetFiles = fs.existsSync(projectDir) ? scanDir(projectDir) : [];
    } else {
      targetFiles = scanDir(DOCS_ROOT);
    }

    for (const file of targetFiles) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const parsed = matter(content);
        const fileName = path.basename(file);
        const relativePath = path.relative(DOCS_ROOT, file);

        let docType = 'documentation';
        if (fileName.match(/PROJECT-REPORT/i)) docType = 'project-report';
        else if (fileName.match(/TODO/i)) docType = 'todo';
        else if (fileName.match(/INVESTOR/i)) docType = 'investor-slides';
        else if (fileName === 'index.md') docType = 'index';

        let carrierId = '';
        const parts = relativePath.split(path.sep);
        if (parts[0] === 'project' && parts[1] === 'documents' && parts.length > 2) {
          carrierId = parts[2];
        } else {
          const ankrMatch = fileName.match(/^ANKR-(.+?)-(PROJECT|TODO|INVESTOR)/i);
          if (ankrMatch) carrierId = ankrMatch[1].toLowerCase();
        }

        await eonClient.ingest({
          title: parsed.data.title || fileName.replace('.md', ''),
          content: content.slice(0, 50000),
          docType,
          tags: parsed.data.tags || [docType, carrierId].filter(Boolean),
          carrierId: carrierId || undefined,
        });
        count++;
      } catch (err) {
        errors++;
      }
    }

    res.json({ success: true, ingested: count, errors, total: targetFiles.length });
  } catch (error) {
    console.error('Error reingesting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eon knowledge base stats
app.get('/api/eon/stats', async (req, res) => {
  try {
    const stats = await eonClient.getStats();
    res.json(stats || { error: 'Eon not available' });
  } catch (error) {
    res.json({ error: 'Eon not available' });
  }
});

// Helper: find a markdown file by its title (for eon search results that return titles, not paths)
const _titleCache = new Map(); // title -> filePath, cached for 60s
let _titleCacheTime = 0;
function findDocByTitle(root, targetTitle) {
  // Rebuild cache every 60s
  if (Date.now() - _titleCacheTime > 60000) {
    _titleCache.clear();
    _titleCacheTime = Date.now();
    function scan(dir) {
      try {
        for (const item of fs.readdirSync(dir)) {
          const fp = path.join(dir, item);
          const st = fs.statSync(fp);
          if (st.isDirectory()) { scan(fp); continue; }
          if (!item.endsWith('.md')) continue;
          try {
            const content = fs.readFileSync(fp, 'utf-8');
            const parsed = matter(content);
            const title = (parsed.data.title || item.replace('.md', '')).toLowerCase();
            _titleCache.set(title, fp);
            // Also index by normalized title (strip special chars)
            _titleCache.set(title.replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim(), fp);
            // Also index by filename without extension
            _titleCache.set(item.replace('.md', '').toLowerCase(), fp);
          } catch(e) {}
        }
      } catch(e) {}
    }
    scan(root);
  }
  // Try exact match first, then normalized
  if (_titleCache.has(targetTitle)) return _titleCache.get(targetTitle);
  // Normalize: strip emojis, special chars, extra spaces
  const normalized = targetTitle.replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim();
  if (_titleCache.has(normalized)) return _titleCache.get(normalized);
  // Partial match: find title containing the search term
  for (const [key, val] of _titleCache) {
    if (key.includes(targetTitle) || targetTitle.includes(key)) return val;
  }
  return null;
}

// ============================================
// HTML PAGES — Document Portal
// ============================================

// Redirect root to docs portal
app.get('/', (req, res) => res.redirect('/project/documents/'));

// Internal helper: fetch JSON from own API
function selfFetch(apiPath) {
  return new Promise((resolve) => {
    const http = require('http');
    http.get(`http://localhost:${PORT}${apiPath}`, (resp) => {
      let body = '';
      resp.on('data', c => body += c);
      resp.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { resolve(null); } });
    }).on('error', () => resolve(null));
  });
}

// Documents Home: /project/documents/
app.get('/project/documents/', async (req, res) => {
  try {
    const projects = (await selfFetch('/api/projects')) || [];
    res.send(documentsHomePage(projects));
  } catch (err) {
    res.send(documentsHomePage([]));
  }
});

// Project Detail: /project/documents/:id
app.get('/project/documents/:id', async (req, res) => {
  try {
    const projects = (await selfFetch('/api/projects')) || [];
    const project = projects.find(p => p.id === req.params.id);
    if (!project) {
      return res.status(404).send(`<html><body style="background:#0a0a0f;color:#fff;font-family:sans-serif;padding:4rem;text-align:center"><h1>Project not found</h1><a href="/project/documents/" style="color:#7c3aed">Back to docs</a></body></html>`);
    }
    res.send(projectDetailPage(project, projects.slice(0, 6)));
  } catch (err) {
    res.status(500).send('Error loading project');
  }
});

// Document Viewer: /view/...
// Use middleware-style to capture any path including slashes
app.use('/view', async (req, res, next) => {
  if (req.method !== 'GET') return next();
  try {
    const docPath = decodeURIComponent(req.path.startsWith('/') ? req.path.slice(1) : req.path);
    if (!docPath) return next();
    const fullPath = path.join(DOCS_ROOT, docPath);

    if (!fullPath.startsWith(DOCS_ROOT)) {
      return res.status(403).send('Forbidden');
    }

    // Resolve file: try direct path, .md extension, or title-based search
    let resolvedPath = fullPath;
    if (!fs.existsSync(resolvedPath) && !path.extname(resolvedPath)) {
      resolvedPath = fullPath + '.md';
    }
    // If still not found, search by title across all .md files
    if (!fs.existsSync(resolvedPath)) {
      const target = docPath.toLowerCase().replace(/\.md$/, '');
      resolvedPath = findDocByTitle(DOCS_ROOT, target);
    }
    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      return res.status(404).send(`<html><body style="background:#0a0a0f;color:#fff;font-family:sans-serif;padding:4rem;text-align:center"><h1>Document not found</h1><p style="color:#666">${docPath.replace(/</g,'&lt;')}</p><a href="/project/documents/" style="color:#7c3aed">Back to docs</a></body></html>`);
    }

    const content = fs.readFileSync(resolvedPath, 'utf-8');
    const parsed = matter(content);
    const fileName = path.basename(resolvedPath);

    const doc = {
      title: parsed.data.title || fileName.replace('.md', ''),
      content: parsed.content,
      frontmatter: parsed.data,
      fileName,
      path: docPath,
    };

    // Fetch related docs
    let relatedDocs = [];
    try {
      const relData = await selfFetch(`/api/search/related?path=${encodeURIComponent(docPath)}&limit=5`);
      relatedDocs = relData?.results || [];
    } catch(e) {}

    res.send(documentViewerPage(doc, relatedDocs));
  } catch (err) {
    console.error('Error rendering doc:', err);
    res.status(500).send('Error loading document');
  }
});

// Static file serving for direct access
app.use('/docs', express.static(DOCS_ROOT));

// Auto-ingest all docs into eon on startup
async function autoIngestDocs() {
  try {
    const eonHealthy = await eonClient.isHealthy();
    if (!eonHealthy) {
      console.log('[AutoIngest] Eon not available, skipping auto-ingest');
      return;
    }
    console.log('[AutoIngest] Starting bulk ingest of docs into eon...');

    function scanDir(dir) {
      const files = [];
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fp = path.join(dir, item);
        const stats = fs.statSync(fp);
        if (stats.isDirectory()) {
          files.push(...scanDir(fp));
        } else if (item.endsWith('.md') && !item.startsWith('.')) {
          files.push(fp);
        }
      }
      return files;
    }

    const files = scanDir(DOCS_ROOT);
    let count = 0;

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const parsed = matter(content);
        const fileName = path.basename(file);
        const relativePath = path.relative(DOCS_ROOT, file);

        let docType = 'documentation';
        if (fileName.match(/PROJECT-REPORT/i)) docType = 'project-report';
        else if (fileName.match(/TODO/i)) docType = 'todo';
        else if (fileName.match(/INVESTOR/i)) docType = 'investor-slides';
        else if (fileName === 'index.md') docType = 'index';

        let carrierId = '';
        const parts = relativePath.split(path.sep);
        if (parts[0] === 'project' && parts[1] === 'documents' && parts.length > 2) {
          carrierId = parts[2];
        } else {
          const ankrMatch = fileName.match(/^ANKR-(.+?)-(PROJECT|TODO|INVESTOR)/i);
          if (ankrMatch) carrierId = ankrMatch[1].toLowerCase();
        }

        await eonClient.ingest({
          title: parsed.data.title || fileName.replace('.md', ''),
          content: content.slice(0, 50000),
          docType,
          tags: parsed.data.tags || [docType, carrierId].filter(Boolean),
          carrierId: carrierId || undefined,
        });
        count++;
      } catch (err) {
        // Skip files that fail to ingest
      }
    }
    console.log(`[AutoIngest] Ingested ${count}/${files.length} docs into eon`);
  } catch (err) {
    console.warn('[AutoIngest] Failed:', err.message);
  }
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('ANKR Viewer Server Started');
  console.log(`Port: ${PORT}`);
  console.log(`Docs Root: ${DOCS_ROOT}`);
  console.log(`API URL: http://localhost:${PORT}/api`);
  console.log(`Docs URL: http://localhost:${PORT}/docs`);
  console.log('');
  console.log('Ready to serve documentation!');

  // Auto-ingest docs into eon after 5s startup delay
  setTimeout(autoIngestDocs, 5000);
});
