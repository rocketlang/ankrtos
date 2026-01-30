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
const { execSync } = require('child_process');
const eonClient = require('./ankr-viewer-eon-client');
const { getRegistry, getCategories, getCategoryOrder } = require('./ankr-product-registry');
const access = require('./ankr-viewer-access');
const { documentsHomePage, projectDetailPage, documentViewerPage, knowledgeGraphPage, prathamShowcasePage, freightboxShowcasePage } = require('./ankr-viewer-html');

const autoDiscoveredFiles = new Map(); // virtual path → absolute path

const app = express();
const PORT = process.env.PORT || process.env.ANKR_VIEWER_PORT || 3080;
const DOCS_ROOT = process.env.DOCS_ROOT || '/root/ankr-universe-docs';

// Pratham QA Book (268 pages, chunked & vectorized)
const PRATHAM_BOOK_PDF = '/root/ankr-labs-nx/packages/ankr-interact/data/pdfs/6 Bookset QA - Comprehensive Book with First page (ISBN).pdf';
const PRATHAM_BOOK_ID = 'pratham-1769195982617-92x93sy70';

// Cache for extracted PDF text
let _prathamBookTextCache = null;
function getPrathamBookText() {
  if (_prathamBookTextCache) return _prathamBookTextCache;
  try {
    _prathamBookTextCache = execSync(`pdftotext "${PRATHAM_BOOK_PDF}" -`, { maxBuffer: 50 * 1024 * 1024, encoding: 'utf-8' });
    return _prathamBookTextCache;
  } catch (e) {
    console.error('Failed to extract PDF text:', e.message);
    return null;
  }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => { req.isAdmin = access.isAdmin(req); next(); });

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

// Raw file download (access-controlled)
app.get('/api/file/raw', (req, res) => {
  try {
    const requestedPath = req.query.path;
    if (!requestedPath) {
      return res.status(400).json({ error: 'Path parameter required' });
    }

    // Handle auto-discovered files
    if (requestedPath.startsWith('_auto/')) {
      const absPath = autoDiscoveredFiles.get(requestedPath);
      if (!absPath || !fs.existsSync(absPath)) {
        return res.status(404).json({ error: 'File not found' });
      }
      return res.sendFile(absPath);
    }

    const fullPath = path.join(DOCS_ROOT, requestedPath);

    if (!fullPath.startsWith(DOCS_ROOT)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Access control: hidden docs return 404 for public
    if (!req.isAdmin && access.isHidden(requestedPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Access control: download-blocked docs return 403 for public
    if (!req.isAdmin && !access.isDownloadable(requestedPath)) {
      return res.status(403).json({ error: 'Download not permitted for this document' });
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

    // Inject project-level results: match query against project names
    try {
      const projData = (await selfFetch('/api/projects')) || {};
      const allProjects = projData.projects || projData || [];
      const lq = query.toLowerCase();
      for (const p of allProjects) {
        const titleMatch = (p.title || '').toLowerCase().includes(lq);
        const idMatch = (p.id || '').toLowerCase().includes(lq);
        const tagMatch = (p.tags || []).some(t => t.toLowerCase().includes(lq));
        if (titleMatch || idMatch || tagMatch) {
          // Add the project itself as a top result
          const alreadyHas = results.some(r => r.project === p.id && r.score >= 200);
          if (!alreadyHas) {
            results.unshift({
              path: `project/documents/${p.id}`,
              name: p.title || p.id,
              excerpt: p.description || '',
              category: p.category || 'project',
              tags: p.tags || [],
              project: p.id,
              score: 300,
              size: 0,
              modified: null,
              _isProject: true,
            });
          }
        }
      }
    } catch (e) { /* project injection is best-effort */ }

    // Access control: filter hidden docs from search results
    results = access.filterSearchResults(results, req.isAdmin);
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

            // Extract markdown links and wikilinks for link edges
            const mdLinkRe = /\[([^\]]*)\]\(([^)]+)\)/g;
            const wikiLinkRe = /\[\[([^\]]+)\]\]/g;
            let m;
            while ((m = mdLinkRe.exec(content)) !== null) {
              const target = m[2].replace(/^\.?\/?/, '').replace(/\.md$/, '');
              if (!target.startsWith('http') && target.length > 0) {
                edges.push({ source: nodeId, target: target + '.md', type: 'links-to' });
              }
            }
            while ((m = wikiLinkRe.exec(content)) !== null) {
              const target = m[1].replace(/\.md$/, '');
              edges.push({ source: nodeId, target: target + '.md', type: 'links-to' });
            }
          } catch (err) {
            // Skip
          }
        }
      }
    }

    scanDirectory(DOCS_ROOT);

    // Post-process: filter link edges to valid targets, compute connections
    const nodeIds = new Set(nodes.map(n => n.id));
    const validEdges = edges.filter(e => {
      if (e.type === 'links-to') return nodeIds.has(e.target);
      return true;
    });

    // Compute connection count per node
    const connCount = {};
    for (const e of validEdges) {
      if (e.type === 'links-to') {
        connCount[e.source] = (connCount[e.source] || 0) + 1;
        connCount[e.target] = (connCount[e.target] || 0) + 1;
      }
    }
    for (const n of nodes) {
      n.connections = connCount[n.id] || 0;
      if (n.type === 'document') {
        n.size = 8 + Math.min(n.connections * 3, 20);
      }
    }

    res.json({ nodes, edges: validEdges });
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

// ── AI Proxy Helper + Document Reader ──
const AI_PROXY_URL = process.env.AI_PROXY_URL || 'http://localhost:4444';

async function callAI(systemPrompt, userPrompt, options = {}) {
  const maxTokens = options.maxTokens || 800;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const http = require('http');
    const url = new URL(AI_PROXY_URL + '/v1/chat/completions');
    const body = JSON.stringify({
      model: options.model || 'auto',
      messages: [
        { role: 'system', content: systemPrompt },
        ...(options.history || []),
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: options.temperature || 0.3,
    });
    return await new Promise((resolve, reject) => {
      const req = (url.protocol === 'https:' ? require('https') : http).request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        signal: controller.signal,
      }, (resp) => {
        let data = '';
        resp.on('data', c => data += c);
        resp.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed.choices?.[0]?.message?.content || '');
          } catch (e) {
            reject(new Error('Invalid AI response'));
          }
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  } finally {
    clearTimeout(timeout);
  }
}

function readDocContent(docPath) {
  // Special: Pratham QA book (vectorized PDF)
  if (docPath === '_book/pratham-qa') {
    return getPrathamBookText();
  }
  // Try direct path
  let fullPath = path.join(DOCS_ROOT, docPath);
  if (fs.existsSync(fullPath) && !fs.statSync(fullPath).isDirectory()) {
    return fs.readFileSync(fullPath, 'utf-8');
  }
  // Try adding .md extension
  if (!path.extname(fullPath)) {
    fullPath = fullPath + '.md';
    if (fs.existsSync(fullPath)) return fs.readFileSync(fullPath, 'utf-8');
  }
  // Try auto-discovered files
  if (docPath.startsWith('_auto/')) {
    const absPath = autoDiscoveredFiles.get(docPath);
    if (absPath && fs.existsSync(absPath)) return fs.readFileSync(absPath, 'utf-8');
  }
  // Try title-based lookup
  const resolved = findDocByTitle(DOCS_ROOT, docPath.toLowerCase().replace(/\.md$/, ''));
  if (resolved && fs.existsSync(resolved)) return fs.readFileSync(resolved, 'utf-8');
  return null;
}

// ── Dual-format input helper (ankr.in: {path}, ankrlms: {content, documentName}, chat: {context, messages}) ──
function resolveAIInput(body) {
  if (body.path) return readDocContent(body.path);
  if (body.content) return body.content;
  if (body.context) return body.context;
  return null;
}

// Helper: parse key points string into array
function parseKeyPointsArray(raw) {
  if (!raw) return [];
  // Split on numbered items (1. ... 2. ...) or bullet points (- ...)
  const lines = raw.split('\n').filter(l => l.trim());
  return lines
    .map(l => l.replace(/^\s*(\d+[\.\)]\s*|[-*]\s*)/, '').trim())
    .filter(l => l.length > 0);
}

// Helper: add ids and levels to mindmap tree for ankrlms format
function addIdsAndLevels(node, level, prefix) {
  if (!node) return node;
  level = level || 0;
  prefix = prefix || 'node';
  const enriched = { id: prefix, label: node.label, level, children: [] };
  if (node.children && node.children.length > 0) {
    enriched.children = node.children.map((child, i) =>
      addIdsAndLevels(child, level + 1, prefix + '-' + i)
    );
  }
  return enriched;
}

// ── AI Endpoints ──

app.post('/api/ai/summarize', async (req, res) => {
  try {
    const content = resolveAIInput(req.body);
    if (!content) return res.status(404).json({ error: 'Document not found or no content provided' });
    const truncated = content.slice(0, 8000);
    const result = await callAI(
      'You are a concise document summarizer. Provide a 3-5 bullet point summary of the key points. Use markdown bullet points.\n\nCRITICAL RULES:\n- ONLY use information explicitly stated in the document provided below.\n- Do NOT add external facts, examples, or knowledge from outside this document.\n- If the document is too short or unclear to summarize, say "The provided content does not contain enough information to generate a meaningful summary."\n- When possible, reference specific sections, chapters, or topics from the document.',
      `Summarize this document:\n\n${truncated}`,
      { maxTokens: 500 }
    );
    res.json({ summary: result });
  } catch (e) {
    console.error('[AI Summarize]', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const content = resolveAIInput(req.body);
    if (!content) return res.status(404).json({ error: 'Document not found or no content provided' });
    const truncated = content.slice(0, 6000);
    // ankr.in format: {message, history}; ankrlms format: {messages[]}
    let message = req.body.message || '';
    let history = (req.body.history || []).slice(-10);
    // ankrlms sends {messages: [{role, content}]} — extract last user message
    if (!message && req.body.messages && req.body.messages.length > 0) {
      const msgs = req.body.messages;
      // Find last user message
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'user') { message = msgs[i].content; break; }
      }
      // Convert messages array to history (all except last user message)
      history = msgs.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
    }
    const result = await callAI(
      `You are a helpful assistant answering questions STRICTLY about the document provided below. You must follow these rules:\n\n1. ONLY use information explicitly stated in the document. Never supplement with outside knowledge.\n2. If the question asks about something NOT covered in the document, respond: "This topic is not covered in this document. I can only answer questions based on the content provided."\n3. When quoting or referencing information, indicate which part of the document it comes from (e.g., "According to the section on..." or "The chapter on... states...").\n4. Do NOT guess, speculate, or fill in gaps with external information.\n5. Be concise and direct.\n\nDocument content:\n${truncated}`,
      message,
      { maxTokens: 800, history }
    );
    res.json({ reply: result, response: result });
  } catch (e) {
    console.error('[AI Chat]', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/ai/quiz', async (req, res) => {
  try {
    const content = resolveAIInput(req.body);
    if (!content) return res.status(404).json({ error: 'Document not found or no content provided' });
    const truncated = content.slice(0, 8000);
    const count = req.body.count || 5;
    const result = await callAI(
      `You generate multiple-choice quiz questions from documents. Return ONLY a valid JSON array of objects, no markdown fences. Each object: {"question":"...","options":{"a":"...","b":"...","c":"...","d":"..."},"answer":"a","explanation":"...","difficulty":"medium"}\n\nCRITICAL RULES:\n- Every question MUST be answerable solely from the document content provided below.\n- Do NOT create questions about topics, facts, or formulas not explicitly present in the document.\n- Explanations must reference concepts found in the document.\n- Wrong answer options should be plausible but clearly incorrect based on the document content.\n- If the document does not have enough content for ${count} questions, generate fewer rather than inventing questions about external topics.`,
      `Generate ${count} multiple-choice questions STRICTLY from this document content (do not use external knowledge):\n\n${truncated}`,
      { maxTokens: 2000, temperature: 0.5 }
    );
    try {
      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const questions = JSON.parse(cleaned);
      // Enrich with ankrlms-compatible fields
      const enriched = questions.map(q => {
        const opts = q.options || {};
        const keys = Object.keys(opts).sort();
        const optionsArray = keys.map(k => opts[k]);
        const correctIndex = keys.indexOf((q.answer || '').toLowerCase());
        return {
          ...q,
          optionsArray,
          correctIndex: correctIndex >= 0 ? correctIndex : 0,
          difficulty: q.difficulty || 'medium',
        };
      });
      res.json({ questions: enriched });
    } catch {
      res.json({ questions: [], raw: result });
    }
  } catch (e) {
    console.error('[AI Quiz]', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/ai/flashcards', async (req, res) => {
  try {
    const content = resolveAIInput(req.body);
    if (!content) return res.status(404).json({ error: 'Document not found or no content provided' });
    const truncated = content.slice(0, 8000);
    const count = req.body.count || 8;
    const result = await callAI(
      `You generate flashcards from documents. Return ONLY a valid JSON array of objects, no markdown fences. Each object: {"front":"question or term","back":"answer or definition","category":"topic category","difficulty":"easy|medium|hard"}\n\nCRITICAL RULES:\n- Every flashcard MUST be based on content explicitly found in the document below.\n- The "back" answer must be verifiable from the document text.\n- Do NOT create flashcards about topics, formulas, or facts not present in the document.\n- Use the document's own terminology and notation.\n- If the document has fewer concepts than requested, generate fewer flashcards rather than inventing content.`,
      `Generate ${count} flashcards STRICTLY from this document content (do not use external knowledge):\n\n${truncated}`,
      { maxTokens: 1500, temperature: 0.4 }
    );
    try {
      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const flashcards = JSON.parse(cleaned);
      // Ensure category and difficulty fields exist
      const enriched = flashcards.map(c => ({
        front: c.front,
        back: c.back,
        category: c.category || 'General',
        difficulty: c.difficulty || 'medium',
      }));
      res.json({ flashcards: enriched });
    } catch {
      res.json({ flashcards: [], raw: result });
    }
  } catch (e) {
    console.error('[AI Flashcards]', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/ai/keypoints', async (req, res) => {
  try {
    const content = resolveAIInput(req.body);
    if (!content) return res.status(404).json({ error: 'Document not found or no content provided' });
    const truncated = content.slice(0, 8000);
    const result = await callAI(
      'You extract key takeaways from documents. Provide 8-12 key points as a numbered list using markdown. Each point should be concise (1-2 sentences).\n\nCRITICAL RULES:\n- ONLY extract points that are explicitly stated or directly implied by the document content.\n- Do NOT add external knowledge, common sense additions, or facts not in the document.\n- Each point should be traceable to specific content in the document.\n- If the document has fewer than 8 key points, extract what is available rather than inventing additional points.',
      `Extract the key takeaways STRICTLY from this document (do not add external knowledge):\n\n${truncated}`,
      { maxTokens: 600 }
    );
    res.json({ keypoints: result, keyPoints: parseKeyPointsArray(result) });
  } catch (e) {
    console.error('[AI Keypoints]', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/ai/mindmap', async (req, res) => {
  try {
    const content = resolveAIInput(req.body);
    if (!content) return res.status(404).json({ error: 'Document not found or no content provided' });
    const truncated = content.slice(0, 8000);
    const result = await callAI(
      `You create hierarchical mind maps from documents. Return ONLY a valid JSON object, no markdown fences. Format: {"label":"Root Topic","children":[{"label":"Subtopic","children":[{"label":"Detail"}]}]}. Use 2-4 top-level children, each with 1-3 sub-children.\n\nCRITICAL RULES:\n- The mind map MUST only contain topics, subtopics, and details explicitly found in the document.\n- Do NOT add categories, topics, or details from external knowledge.\n- Labels should use the document's own terminology and section names where possible.\n- If the document covers fewer topics, create a smaller map rather than inventing branches.`,
      `Create a mind map STRICTLY from this document content (do not add external topics):\n\n${truncated}`,
      { maxTokens: 1500, temperature: 0.4 }
    );
    try {
      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const mindmap = JSON.parse(cleaned);
      res.json({ mindmap, mindMap: addIdsAndLevels(mindmap) });
    } catch {
      res.json({ mindmap: null, mindMap: null, raw: result });
    }
  } catch (e) {
    console.error('[AI Mindmap]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Fermi Estimation Endpoint ──
app.post('/api/ai/fermi', async (req, res) => {
  try {
    const content = resolveAIInput(req.body);
    if (!content) return res.status(404).json({ error: 'Document not found or no content provided' });
    const truncated = content.slice(0, 8000);
    const result = await callAI(
      'You are a Fermi estimation tutor. Given the document content, create a Fermi estimation exercise related to a real-world topic from the document. Break the estimation into 4-6 logical steps. Return ONLY valid JSON: {"question":"...","steps":[{"step":"...","estimate":"...","reasoning":"..."}],"finalAnswer":"...","realWorldConnection":"..."}\n\nCRITICAL RULES:\n- The Fermi question MUST be rooted in a concept, formula, or topic explicitly covered in the document.\n- Steps should demonstrate application of methods or formulas found in the document.\n- The realWorldConnection must tie back to the document content.\n- Do NOT create exercises about topics not covered in the document.\n- Clearly state which document concept is being applied in each step.',
      `Create a Fermi estimation exercise grounded in the concepts from this document (use only topics covered in the document):\n\n${truncated}`,
      { maxTokens: 1500, temperature: 0.5 }
    );
    try {
      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const fermi = JSON.parse(cleaned);
      res.json({ fermi });
    } catch {
      res.json({ fermi: null, raw: result });
    }
  } catch (e) {
    console.error('[AI Fermi]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Socratic Dialog Endpoint ──
app.post('/api/ai/socratic', async (req, res) => {
  try {
    const content = resolveAIInput(req.body);
    if (!content) return res.status(404).json({ error: 'Document not found or no content provided' });
    const truncated = content.slice(0, 6000);
    const message = req.body.message || '';
    const history = (req.body.history || []).slice(-10);
    const result = await callAI(
      `You are a Socratic tutor. NEVER give direct answers. Ask probing questions that guide the student to discover the answer. Ask one question at a time. If the student seems stuck after 3 exchanges, give a gentle hint framed as a question. Always encourage thinking.\n\nCRITICAL RULES:\n- ONLY ask questions about concepts, formulas, and topics found in the document below.\n- Guide the student toward answers that exist in the document content.\n- If the student asks about a topic NOT in the document, say: "That topic isn't covered in this material. Let me guide you through something that is — " and redirect to a relevant document topic.\n- Reference specific sections or examples from the document when hinting.\n- Do NOT introduce external concepts, theorems, or methods not present in the document.\n\nDocument content:\n${truncated}`,
      message,
      { maxTokens: 600, history }
    );
    res.json({ reply: result });
  } catch (e) {
    console.error('[AI Socratic]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Study Guide Endpoint ──
app.post('/api/ai/study-guide', async (req, res) => {
  try {
    const content = resolveAIInput(req.body);
    if (!content) return res.status(404).json({ error: 'Document not found or no content provided' });
    const truncated = content.slice(0, 8000);
    const result = await callAI(
      `You create structured study guides from documents. Generate a comprehensive study guide in markdown with these sections:
## Learning Objectives
(3-5 bullet points of what the student should learn)

## Key Concepts
(Core concepts with brief explanations)

## Important Formulas & Rules
(If applicable, list key formulas or rules)

## Review Questions
(5 open-ended review questions)

## Summary
(2-3 sentence summary of the material)

CRITICAL RULES:
- EVERY section must be based ONLY on content explicitly found in the document below.
- Learning Objectives must reflect what the document actually teaches, not what you think it should teach.
- Key Concepts must come from the document text — do NOT add external definitions or concepts.
- Formulas & Rules must appear in the document. Do NOT add formulas from external knowledge even if they seem relevant.
- Review Questions must be answerable from the document content alone.
- If the document does not contain formulas, omit that section rather than adding external formulas.
- Use the document's own terminology and notation.`,
      `Create a study guide STRICTLY from this document content (do not add external knowledge or formulas):\n\n${truncated}`,
      { maxTokens: 1500 }
    );
    res.json({ studyGuide: result });
  } catch (e) {
    console.error('[AI Study Guide]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Backlinks Endpoint ──
app.get('/api/backlinks', (req, res) => {
  try {
    const targetPath = req.query.path || '';
    if (!targetPath) return res.json({ backlinks: [], count: 0 });

    const backlinks = [];
    const targetBasename = path.basename(targetPath, '.md').toLowerCase();
    const targetNormalized = targetPath.replace(/\.md$/, '').toLowerCase();

    function scanForBacklinks(dir) {
      let items;
      try { items = fs.readdirSync(dir); } catch { return; }
      for (const item of items) {
        const fullPath = path.join(dir, item);
        let st;
        try { st = fs.statSync(fullPath); } catch { continue; }
        if (st.isDirectory()) { scanForBacklinks(fullPath); continue; }
        if (!item.endsWith('.md')) continue;
        const relativePath = path.relative(DOCS_ROOT, fullPath);
        // Skip self
        if (relativePath === targetPath || relativePath === targetPath + '.md') continue;
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const parsed = matter(content);
          // Check markdown links [text](target) and wikilinks [[target]]
          const mdLinkRe = /\[([^\]]*)\]\(([^)]+)\)/g;
          const wikiLinkRe = /\[\[([^\]]+)\]\]/g;
          let found = false;
          let match;
          while ((match = mdLinkRe.exec(content)) !== null) {
            const linkTarget = match[2].replace(/\.md$/, '').toLowerCase();
            if (linkTarget.includes(targetBasename) || linkTarget.includes(targetNormalized)) {
              found = true;
              break;
            }
          }
          if (!found) {
            while ((match = wikiLinkRe.exec(content)) !== null) {
              const linkTarget = match[1].replace(/\.md$/, '').toLowerCase();
              if (linkTarget.includes(targetBasename) || linkTarget.includes(targetNormalized)) {
                found = true;
                break;
              }
            }
          }
          if (found) {
            const title = parsed.data.title || item.replace('.md', '');
            const excerpt = parsed.content.replace(/^#.+\n/, '').slice(0, 120).trim();
            backlinks.push({ path: relativePath, title, excerpt });
          }
        } catch { /* skip */ }
      }
    }

    scanForBacklinks(DOCS_ROOT);
    res.json({ backlinks, count: backlinks.length });
  } catch (e) {
    console.error('[Backlinks]', e.message);
    res.json({ backlinks: [], count: 0 });
  }
});

// ── Auto-discovery: scan codePaths for high-value docs ──
function autoDiscoverFromCodePaths(registry, existingWithFiles) {
  const SKIP_DIRS = new Set(['node_modules', '.next', 'build', 'dist', '.git', '.cache', '.turbo', 'coverage', '__pycache__', '.output']);
  const HIGH_VALUE_PATTERNS = [
    /^README\.md$/i,
    /ARCHITECTURE/i,
    /API[-_]?SPEC/i,
    /VISION/i,
    /BUSINESS[-_]?MODEL/i,
    /SLIDES/i,
    /SDK/i,
    /HARDWARE/i,
    /TODO/i,
    /ROADMAP/i,
    /MVP/i,
    /BUDGET/i,
    /SETUP/i,
    /DATA[-_]?MODEL/i,
    /DESIGN/i,
    /CHANGELOG/i,
    /CONTRIBUTING/i,
    /MIGRATION/i,
    /DEPLOYMENT/i,
    /GETTING[-_]?STARTED/i,
    /OVERVIEW/i,
    /GUIDE/i,
    /PROJECT[-_]?REPORT/i,
    /IMPLEMENTATION/i,
  ];
  const SERVICE_README_RE = /\/services?[-_][^/]+\/README\.md$/;

  const result = {}; // productId → [fileObjects]
  autoDiscoveredFiles.clear();

  for (const product of registry) {
    if (!product.codePaths || product.codePaths.length === 0) continue;
    // Skip products that already have curated files from passes 1-3
    if (existingWithFiles.has(product.id)) continue;

    const files = [];
    const seenNames = new Set();

    for (const codePath of product.codePaths) {
      const absBase = path.resolve('/root', codePath.replace(/\/$/, ''));
      if (!fs.existsSync(absBase)) continue;

      function scan(dir, depth) {
        if (depth > 6) return;
        let entries;
        try { entries = fs.readdirSync(dir); } catch { return; }
        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          let st;
          try { st = fs.statSync(fullPath); } catch { continue; }

          if (st.isDirectory()) {
            if (SKIP_DIRS.has(entry)) continue;
            scan(fullPath, depth + 1);
            continue;
          }

          if (!entry.endsWith('.md')) continue;
          if (st.size < 1024) continue; // skip stubs < 1KB
          if (files.length >= 25) return; // cap per product
          if (seenNames.has(entry.toLowerCase())) continue;

          // Skip service-level monorepo READMEs
          const relToBase = path.relative(absBase, fullPath);
          if (SERVICE_README_RE.test('/' + relToBase)) continue;

          // Include if: in /docs/ subdir, or top-level README, or matches high-value pattern
          const inDocsDir = relToBase.includes('/docs/') || relToBase.includes('\\docs\\') || relToBase.startsWith('docs/') || relToBase.startsWith('docs\\');
          const isTopReadme = relToBase === 'README.md';
          const isHighValue = HIGH_VALUE_PATTERNS.some(re => re.test(entry));

          if (!inDocsDir && !isTopReadme && !isHighValue) continue;

          seenNames.add(entry.toLowerCase());

          // Read title from frontmatter
          let title = entry.replace('.md', '');
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const parsed = matter(content);
            if (parsed.data.title) title = parsed.data.title;
          } catch {}

          const virtualPath = `_auto/${product.id}/${entry}`;
          autoDiscoveredFiles.set(virtualPath, fullPath);

          files.push({
            name: entry,
            path: virtualPath,
            title,
            size: st.size,
            category: product.category || 'documentation',
            source: 'auto',
          });
        }
      }
      scan(absBase, 0);
    }

    if (files.length > 0) {
      result[product.id] = files;
    }
  }
  return result;
}

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

    // ── Pass 3.5: Auto-discover docs from codePaths ──
    try {
      const registry = getRegistry();
      const existingWithFiles = new Set(
        projects.filter(p => (p.files || []).length > 0).map(p => p.id)
      );
      const autoFiles = autoDiscoverFromCodePaths(registry, existingWithFiles);
      for (const [productId, files] of Object.entries(autoFiles)) {
        const existing = projects.find(p => p.id === productId);
        if (existing) {
          // Product exists from passes 1-3 but with 0 files — append
          existing.files = (existing.files || []).concat(files);
          existing.fileCount = existing.files.length;
          existing.hasAutoDiscoveredDocs = true;
        } else {
          // Not yet in projects list — will be added by Pass 4
          // Store temporarily so Pass 4 can pick them up
          const regEntry = registry.find(r => r.id === productId);
          if (regEntry) {
            projects.push({
              id: productId,
              path: '',
              title: regEntry.title || productId,
              description: regEntry.description || '',
              category: regEntry.category || 'infra',
              status: regEntry.status || 'planned',
              featured: regEntry.featured || false,
              priority: regEntry.priority || 99,
              tags: regEntry.tags || [],
              stats: regEntry.stats || {},
              files,
              fileCount: files.length,
              codePaths: regEntry.codePaths || [],
              hasAutoDiscoveredDocs: true,
            });
          }
        }
      }
    } catch (e) {
      console.error('Auto-discovery error:', e.message);
    }

    // ── Pass 4: Merge product registry ──
    // Registry defines ALL known products with rich metadata.
    // - If a product was already discovered in passes 1-3, merge registry metadata on top
    // - If a product was NOT discovered, add it with fileCount 0 (still shows in the portal)
    try {
      const registry = getRegistry();
      for (const reg of registry) {
        const existing = projects.find(p => p.id === reg.id);
        if (existing) {
          // Merge: registry metadata wins (better titles, descriptions, categories)
          existing.title = reg.title || existing.title;
          existing.description = reg.description || existing.description;
          existing.category = reg.category || existing.category;
          existing.status = reg.status || existing.status;
          existing.featured = reg.featured != null ? reg.featured : existing.featured;
          existing.priority = reg.priority != null ? reg.priority : existing.priority;
          existing.tags = reg.tags && reg.tags.length ? reg.tags : existing.tags;
          if (reg.stats && Object.keys(reg.stats).length) {
            existing.stats = { ...existing.stats, ...reg.stats };
          }
          existing.codePaths = reg.codePaths || [];
        } else {
          // New product from registry — no docs discovered yet
          projects.push({
            id: reg.id,
            path: '',
            title: reg.title,
            description: reg.description || '',
            category: reg.category || 'infra',
            status: reg.status || 'planned',
            featured: reg.featured || false,
            priority: reg.priority || 99,
            tags: reg.tags || [],
            stats: reg.stats || {},
            files: [],
            fileCount: 0,
            codePaths: reg.codePaths || [],
          });
        }
      }
    } catch (e) {
      console.error('Registry merge error:', e.message);
    }

    // Sort by priority (lower = higher priority), then featured first
    projects.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (a.priority || 99) - (b.priority || 99);
    });

    // Access control: filter hidden files from project listings for public users
    if (!req.isAdmin) {
      for (const p of projects) {
        p.files = access.filterFiles(p.files || [], false);
        p.fileCount = p.files.length;
      }
    }

    // Attach category metadata for frontend grouping
    const categories = getCategories();
    const categoryOrder = getCategoryOrder();

    res.json({ projects, categories, categoryOrder, isAdmin: req.isAdmin });
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
function selfFetch(apiPath, headers) {
  return new Promise((resolve) => {
    const http = require('http');
    const opts = { hostname: 'localhost', port: PORT, path: apiPath, headers: headers || {} };
    http.get(opts, (resp) => {
      let body = '';
      resp.on('data', c => body += c);
      resp.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { resolve(null); } });
    }).on('error', () => resolve(null));
  });
}

// ── Admin API Endpoints ──

// Get full access config
app.get('/api/admin/access', (req, res) => {
  if (!req.isAdmin) return res.status(401).json({ error: 'Unauthorized' });
  res.json(access.getAccessConfig());
});

// Toggle document visibility
app.post('/api/admin/hide', (req, res) => {
  if (!req.isAdmin) return res.status(401).json({ error: 'Unauthorized' });
  const { path: docPath, hidden } = req.body || {};
  if (!docPath) return res.status(400).json({ error: 'path required' });
  access.setHidden(docPath, hidden !== false);
  res.json({ success: true, path: docPath, hidden: access.isHidden(docPath) });
});

// Toggle document download permission
app.post('/api/admin/download', (req, res) => {
  if (!req.isAdmin) return res.status(401).json({ error: 'Unauthorized' });
  const { path: docPath, downloadable } = req.body || {};
  if (!docPath) return res.status(400).json({ error: 'path required' });
  access.setDownloadable(docPath, downloadable !== false);
  res.json({ success: true, path: docPath, downloadable: access.isDownloadable(docPath) });
});

// Bulk operations
app.post('/api/admin/bulk', (req, res) => {
  if (!req.isAdmin) return res.status(401).json({ error: 'Unauthorized' });
  const { paths, action } = req.body || {};
  if (!paths || !Array.isArray(paths) || !action) {
    return res.status(400).json({ error: 'paths (array) and action (hide|show|block-download|allow-download) required' });
  }
  let count = 0;
  for (const p of paths) {
    if (action === 'hide') { access.setHidden(p, true); count++; }
    else if (action === 'show') { access.setHidden(p, false); count++; }
    else if (action === 'block-download') { access.setDownloadable(p, false); count++; }
    else if (action === 'allow-download') { access.setDownloadable(p, true); count++; }
  }
  res.json({ success: true, action, count });
});

// Knowledge Graph Page: /project/documents/_graph
app.get('/project/documents/_graph', async (req, res) => {
  try {
    const graphData = await selfFetch('/api/knowledge/graph');
    res.send(knowledgeGraphPage(graphData || { nodes: [], edges: [] }));
  } catch (err) {
    res.status(500).send('Error loading graph');
  }
});

// Documents Home: /project/documents/
app.get('/project/documents/', async (req, res) => {
  try {
    const data = (await selfFetch('/api/projects')) || {};
    const projects = data.projects || data || [];
    const categories = data.categories || {};
    const categoryOrder = data.categoryOrder || [];
    res.send(documentsHomePage(projects, categories, categoryOrder));
  } catch (err) {
    res.send(documentsHomePage([], {}, []));
  }
});

// Helper: extract chapter headings from book text
function extractChapterHeadings(text) {
  if (!text) return [];
  const chapters = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(chapter|CHAPTER)\s*[-:]?\s*\d+/i.test(trimmed) ||
        /^\d+[\.\)]\s+[A-Z]/.test(trimmed) && trimmed.length < 80) {
      const clean = trimmed.replace(/^(chapter|CHAPTER)\s*[-:]?\s*/i, '').trim();
      if (clean.length > 2 && clean.length < 80 && !chapters.includes(clean)) {
        chapters.push(clean);
      }
    }
  }
  return chapters.slice(0, 30);
}

// Cache for book analytics
let _bookAnalyticsCache = null;
function getBookAnalytics(text) {
  if (_bookAnalyticsCache) return _bookAnalyticsCache;
  if (!text) return null;
  const lines = text.split('\n');
  // Formula-like lines (variable = expression)
  const formulaLines = lines.filter(l => /[a-zA-Z]\s*=\s*[a-zA-Z0-9(]/.test(l) && l.length < 200);
  // Examples & problems
  const exampleCount = (text.match(/(?:Example|EXAMPLE|Ex\.|Q\.|Ques|Question|problem)\s*[\d.:)]/gi) || []).length;
  // PRATHAM EDGE tips (signature pedagogical feature)
  const edgeTips = (text.match(/PRATHAM EDGE/g) || []).length;
  // Solutions
  const solutionCount = (text.match(/(?:Sol|Solution|Ans|Answer)\s*[.:)]/gi) || []).length;
  // Shortcut/trick mentions
  const shortcutCount = (text.match(/(?:shortcut|trick|quick|technique|tip|edge|hack)/gi) || []).length;
  // Unique chapter markers
  const chapterNums = new Set((text.match(/CHAPTER\s+(\d+)/g) || []).map(m => m.replace('CHAPTER ', '')));
  // Topic distribution: approximate by counting keyword density per topic
  const topics = [
    { name: 'Number System', keywords: ['number system', 'digit', 'divisib', 'factor', 'prime', 'hcf', 'lcm', 'remainder'] },
    { name: 'Averages', keywords: ['average', 'mean', 'weighted average'] },
    { name: 'Percentage', keywords: ['percent', '%', 'per cent'] },
    { name: 'Profit & Loss', keywords: ['profit', 'loss', 'cost price', 'selling price', 'markup', 'discount'] },
    { name: 'Interest', keywords: ['interest', 'compound interest', 'simple interest', 'principal', 'amount'] },
    { name: 'Ratio & Proportion', keywords: ['ratio', 'proportion', 'varies'] },
    { name: 'Partnership', keywords: ['partnership', 'partner', 'investment share'] },
    { name: 'Mixtures', keywords: ['mixture', 'alligation', 'allegation'] },
    { name: 'Equations', keywords: ['equation', 'quadratic', 'linear equation', 'root', 'polynomial'] },
    { name: 'Speed & Distance', keywords: ['speed', 'distance', 'train', 'boat', 'stream', 'race'] },
    { name: 'Time & Work', keywords: ['time and work', 'pipe', 'cistern', 'efficiency'] },
    { name: 'Clocks & Calendars', keywords: ['clock', 'calendar', 'day of week', 'leap year'] },
    { name: 'Mensuration', keywords: ['mensuration', 'area', 'volume', 'surface area', 'perimeter', 'cylinder', 'cone', 'sphere'] },
    { name: 'Geometry', keywords: ['geometry', 'triangle', 'circle', 'angle', 'polygon', 'coordinate'] },
    { name: 'Trigonometry', keywords: ['trigonometry', 'sin', 'cos', 'tan', 'trigonometric'] },
    { name: 'Heights & Distances', keywords: ['height', 'elevation', 'depression', 'tower', 'shadow'] },
    { name: 'Progressions', keywords: ['progression', 'arithmetic progression', 'geometric progression', 'ap', 'gp', 'series'] },
    { name: 'P & C', keywords: ['permutation', 'combination', 'factorial', 'arrangement', 'selection'] },
    { name: 'Probability', keywords: ['probability', 'event', 'odds', 'dice', 'card', 'coin'] },
    { name: 'Data Interpretation', keywords: ['data interpretation', 'bar graph', 'pie chart', 'table', 'line graph', 'caselets'] },
  ];
  const lowerText = text.toLowerCase();
  const topicDist = topics.map(t => {
    let count = 0;
    for (const kw of t.keywords) {
      const re = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      count += (lowerText.match(re) || []).length;
    }
    return { name: t.name, mentions: count };
  }).sort((a, b) => b.mentions - a.mentions);
  const maxMentions = topicDist[0]?.mentions || 1;

  // Cross-chapter connections (topics that share keywords with multiple chapters)
  const connections = [];
  const topicKeyMap = {};
  for (const t of topics) {
    topicKeyMap[t.name] = t.keywords;
  }
  // Find shared concepts between specific topics
  const sharedConcepts = [
    { from: 'Percentage', to: 'Profit & Loss', concept: 'Cost price markup uses percentage directly', strength: 'strong' },
    { from: 'Percentage', to: 'Interest', concept: 'Interest rates are percentage-based calculations', strength: 'strong' },
    { from: 'Ratio & Proportion', to: 'Partnership', concept: 'Partnership splits use ratio of investments', strength: 'strong' },
    { from: 'Ratio & Proportion', to: 'Mixtures', concept: 'Alligation is ratio-based weighted mixing', strength: 'strong' },
    { from: 'Equations', to: 'Speed & Distance', concept: 'Relative speed problems become linear equations', strength: 'medium' },
    { from: 'Equations', to: 'Time & Work', concept: 'Work-rate problems reduce to equation solving', strength: 'medium' },
    { from: 'Number System', to: 'P & C', concept: 'Counting principles build on number theory', strength: 'medium' },
    { from: 'P & C', to: 'Probability', concept: 'Probability uses permutation/combination for counting outcomes', strength: 'strong' },
    { from: 'Geometry', to: 'Mensuration', concept: 'Area/volume formulas derive from geometric shapes', strength: 'strong' },
    { from: 'Trigonometry', to: 'Heights & Distances', concept: 'H&D problems are applied trigonometry', strength: 'strong' },
    { from: 'Progressions', to: 'Interest', concept: 'CI forms a geometric progression, SI forms arithmetic', strength: 'medium' },
    { from: 'Percentage', to: 'Data Interpretation', concept: 'DI questions require percentage calculations throughout', strength: 'strong' },
  ];

  // Extract actual PRATHAM EDGE tip text snippets
  const edgeTipExtracts = [];
  const edgeRegex = /PRATHAM EDGE[:\s\-]*([^\n]+(?:\n(?!PRATHAM EDGE)[^\n]{5,}){0,3})/gi;
  let edgeMatch;
  while ((edgeMatch = edgeRegex.exec(text)) !== null && edgeTipExtracts.length < 20) {
    const snippet = edgeMatch[1].replace(/\n/g, ' ').trim();
    if (snippet.length > 15 && snippet.length < 500) {
      edgeTipExtracts.push(snippet);
    }
  }

  // Per-topic example density (how many examples per topic keyword cluster)
  const topicExampleDensity = topics.slice(0, 10).map(t => {
    // Scan for Example/Q. near topic keywords
    let nearExamples = 0;
    for (const kw of t.keywords) {
      const kwRe = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      let kwMatch;
      while ((kwMatch = kwRe.exec(lowerText)) !== null) {
        // Check if "Example" or "Q." appears within 500 chars of this keyword
        const nearby = text.slice(Math.max(0, kwMatch.index - 250), kwMatch.index + 250).toLowerCase();
        if (/example|ex\.|q\.|ques|problem/i.test(nearby)) nearExamples++;
      }
    }
    return { name: t.name, examples: nearExamples };
  }).sort((a, b) => b.examples - a.examples);

  // Content quality metrics for publisher
  const totalLines = lines.length;
  const nonEmptyLines = lines.filter(l => l.trim().length > 0).length;
  const contentDensity = Math.round((nonEmptyLines / totalLines) * 100);
  const exampleToPageRatio = (exampleCount / 268).toFixed(1);
  const formulaToPageRatio = (formulaLines.length / 268).toFixed(1);

  _bookAnalyticsCache = {
    formulaCount: formulaLines.length,
    exampleCount,
    edgeTips,
    solutionCount,
    shortcutCount,
    chapterCount: chapterNums.size,
    topicDistribution: topicDist,
    maxMentions,
    crossChapterConnections: sharedConcepts,
    edgeTipExtracts,
    topicExampleDensity,
    contentDensity,
    exampleToPageRatio,
    formulaToPageRatio,
  };
  return _bookAnalyticsCache;
}

// Pratham Showcase: /project/documents/pratham/_showcase
app.get('/project/documents/pratham/_showcase', (req, res) => {
  try {
    const prathamDir = path.join(DOCS_ROOT, 'project', 'documents', 'pratham');
    const files = [];
    if (fs.existsSync(prathamDir)) {
      for (const f of fs.readdirSync(prathamDir)) {
        if (!f.endsWith('.md') || f === 'index.md' || f.startsWith('.')) continue;
        const fp = path.join(prathamDir, f);
        const st = fs.statSync(fp);
        let title = f.replace('.md', '');
        try {
          const content = fs.readFileSync(fp, 'utf-8');
          const parsed = matter(content);
          if (parsed.data.title) title = parsed.data.title;
        } catch (e) {}
        files.push({
          name: f,
          path: 'project/documents/pratham/' + f,
          title,
          size: st.size,
        });
      }
    }

    // Extract book content for preview
    const bookText = getPrathamBookText();
    const bookSample = bookText ? bookText.slice(0, 3000) : '';
    const chapters = bookText ? extractChapterHeadings(bookText) : [];
    const wordCount = bookText ? bookText.split(/\s+/).filter(w => w.length > 0).length : 0;
    const analytics = bookText ? getBookAnalytics(bookText) : null;

    // Book metadata for the 268-page QA textbook
    const book = {
      id: PRATHAM_BOOK_ID,
      title: 'Comprehensive Book on Quantitative Aptitude',
      subtitle: 'For Undergraduate Entrance Exams',
      isbn: '978-81-19992-59-1',
      pages: 268,
      editions: 17,
      editionRange: '2009\u20132025',
      publisher: 'PRATHAM Test Prep',
      publisherFull: 'PRATHAM Test Prep, a unit of International Institute of Financial Markets Limited',
      address: 'HS 13, 2nd Floor, Kailash Colony Main Market, Delhi 110048',
      sizeMB: '4.8',
      path: '_book/pratham-qa',
      thumbnailUrl: '/ankr-interact/data/thumbnails/6 Bookset QA - Comprehensive Book with First page (ISBN).jpg',
      chunking: { chunkSize: 2000, overlap: 200, model: 'nomic-embed-text' },
      wordCount,
      bookSample: bookSample.slice(0, 500),
      chapters,
      analytics,
      hasPdf: fs.existsSync(PRATHAM_BOOK_PDF),
    };
    res.send(prathamShowcasePage(files, book));
  } catch (err) {
    console.error('Error rendering Pratham showcase:', err);
    res.status(500).send('Error loading showcase');
  }
});

// Serve Pratham QA Book PDF for inline viewing
app.get('/api/pratham/book.pdf', (req, res) => {
  if (!fs.existsSync(PRATHAM_BOOK_PDF)) {
    return res.status(404).json({ error: 'PDF not found' });
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="Pratham-QA-Comprehensive-Book.pdf"');
  res.sendFile(PRATHAM_BOOK_PDF);
});

// Serve paginated text content (for in-page reader)
app.get('/api/pratham/book-text', (req, res) => {
  const text = getPrathamBookText();
  if (!text) return res.status(404).json({ error: 'Could not extract text' });
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 3000;
  const start = (page - 1) * pageSize;
  const chunk = text.slice(start, start + pageSize);
  const totalPages = Math.ceil(text.length / pageSize);
  res.json({
    page,
    totalPages,
    totalChars: text.length,
    content: chunk,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  });
});

// FreightBox Showcase: /project/documents/freightbox/_showcase
app.get('/project/documents/freightbox/_showcase', (req, res) => {
  try {
    const fbDir = path.join(DOCS_ROOT, 'project', 'documents', 'freightbox');
    const files = [];
    if (fs.existsSync(fbDir)) {
      for (const f of fs.readdirSync(fbDir)) {
        if (!f.endsWith('.md') || f === 'index.md' || f.startsWith('.')) continue;
        const fp = path.join(fbDir, f);
        const st = fs.statSync(fp);
        let title = f.replace('.md', '');
        try {
          const content = fs.readFileSync(fp, 'utf-8');
          const parsed = matter(content);
          if (parsed.data.title) title = parsed.data.title;
        } catch (e) {}
        files.push({
          name: f,
          path: 'project/documents/freightbox/' + f,
          title,
          size: st.size,
        });
      }
    }

    const platform = {
      name: 'FreightBox',
      tagline: 'Multimodal Freight Management — Ocean, Air, Road, Rail',
      modules: 10,
      docTypes: 37,
      graphqlOps: 100,
      freightModes: 6,
      customerSegments: 6,
      cargoTiers: 5,
      standalone: { score: 47, cargowise: 88 },
      ecosystem:  { score: 92, cargowise: 88 },
      categories: [
        { name: 'Freight Forwarding', fb: 70, cw: 95 },
        { name: 'Customs & Compliance', fb: 30, cw: 95 },
        { name: 'Warehouse (WMS)', fb: 90, cw: 90 },
        { name: 'Transport (TMS)', fb: 95, cw: 85 },
        { name: 'Financial', fb: 98, cw: 90 },
        { name: 'Rate Management', fb: 70, cw: 85 },
        { name: 'Visibility & Tracking', fb: 90, cw: 80 },
        { name: 'Carrier Connectivity', fb: 20, cw: 90 },
        { name: 'Documents', fb: 95, cw: 85 },
        { name: 'Reporting & Analytics', fb: 85, cw: 85 },
        { name: 'CRM', fb: 120, cw: 60 },
      ],
      exchange: {
        matchRate: '>95%',
        fillRate: '>85%',
        emptyMiles: '<15%',
        timeToMatch: '<30 min',
        priceSpread: '<5%',
        orderTypes: 6,
      },
      pricing: {
        free: { price: '$0', shipments: 10, users: 1, docTypes: 5 },
        pro:  { price: '$99/mo', shipments: 100, users: 5, docTypes: 37 },
        enterprise: { price: 'Custom', shipments: 'Unlimited', users: 'Unlimited', docTypes: 37 },
      },
      products: [
        { id: 'fr8x', name: 'Fr8X', desc: 'Freight Exchange (Ocean/Air)', icon: 'ship' },
        { id: 'fr8xtms', name: 'Fr8XTMS', desc: 'Transport Management (Road/Rail)', icon: 'truck' },
        { id: 'fr8xwms', name: 'Fr8XWMS', desc: 'Warehouse Management', icon: 'warehouse' },
        { id: 'fr8xerp', name: 'Fr8XERP', desc: 'Finance & Accounting', icon: 'money' },
        { id: 'fr8xcrm', name: 'Fr8XCRM', desc: 'Sales & Support CRM', icon: 'users' },
      ],
      moduleAreas: [
        'Operations', 'Documentation', 'Finance', 'Tracking & Visibility',
        'Marketplace', 'APIBox Integrations', 'Analytics', 'Customer Portal',
        'User & Org Management', 'Technical Platform'
      ],
      advantages: [
        { title: 'Modern Tech Stack', desc: 'GraphQL, real-time subscriptions, mobile-first, cloud-native vs legacy SOAP' },
        { title: 'AI/ML Built-In', desc: 'Sales coach, OCR extraction, route optimization, bank reconciliation AI' },
        { title: 'Blockchain eBL', desc: 'DCSA-compliant electronic Bill of Lading with document chain verification' },
        { title: 'India Compliance', desc: 'GSTN, E-Invoice IRN/IRP, E-Way Bill, TDS, DigiLocker, Vahan, Schedule III' },
        { title: 'Built-in Marketplace', desc: 'Vendor network, bidding/RFQ, contract management, carrier scoring' },
        { title: 'Unified CX', desc: 'Single portal, omnichannel comms, WhatsApp, mobile apps for all stakeholders' },
      ],
    };

    res.send(freightboxShowcasePage(files, platform));
  } catch (err) {
    console.error('Error rendering FreightBox showcase:', err);
    res.status(500).send('Error loading FreightBox showcase');
  }
});

// Project Detail: /project/documents/:id
app.get('/project/documents/:id', async (req, res) => {
  try {
    const adminHeader = req.isAdmin ? { 'x-ankr-admin': process.env.ANKR_ADMIN_KEY || 'ankr-admin-2026' } : {};
    const data = (await selfFetch('/api/projects', adminHeader)) || {};
    const projects = data.projects || data || [];
    const project = projects.find(p => p.id === req.params.id);
    if (!project) {
      return res.status(404).send(`<html><body style="background:#0a0a0f;color:#fff;font-family:sans-serif;padding:4rem;text-align:center"><h1>Project not found</h1><a href="/project/documents/" style="color:#7c3aed">Back to docs</a></body></html>`);
    }
    // Annotate files with access info for admin UI
    if (req.isAdmin) {
      for (const f of (project.files || [])) {
        f.isHidden = access.isHidden(f.path);
        f.downloadable = access.isDownloadable(f.path);
      }
    } else {
      for (const f of (project.files || [])) {
        f.downloadable = access.isDownloadable(f.path);
      }
    }
    res.send(projectDetailPage(project, projects.slice(0, 6), req.isAdmin));
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

    // Handle auto-discovered files from codePaths
    if (docPath.startsWith('_auto/')) {
      const absPath = autoDiscoveredFiles.get(docPath);
      if (!absPath || !fs.existsSync(absPath)) {
        return res.status(404).send(`<html><body style="background:#0a0a0f;color:#fff;font-family:sans-serif;padding:4rem;text-align:center"><h1>Document not found</h1><p style="color:#666">${docPath.replace(/</g,'&lt;')}</p><a href="/project/documents/" style="color:#7c3aed">Back to docs</a></body></html>`);
      }
      const content = fs.readFileSync(absPath, 'utf-8');
      const parsed = matter(content);
      const fileName = path.basename(absPath);
      const doc = {
        title: parsed.data.title || fileName.replace('.md', ''),
        content: parsed.content,
        frontmatter: parsed.data,
        fileName,
        path: docPath,
        downloadable: false,
        isAdmin: req.isAdmin,
        isHidden: false,
      };
      let relatedDocs = [];
      try {
        const relData = await selfFetch(`/api/search/related?path=${encodeURIComponent(docPath)}&limit=5`);
        relatedDocs = relData?.results || [];
      } catch(e) {}
      return res.send(documentViewerPage(doc, relatedDocs));
    }

    // Special: Pratham QA book (virtual document — viewable, not downloadable)
    if (docPath === '_book/pratham-qa') {
      const bookText = getPrathamBookText();
      if (!bookText) {
        return res.status(404).send(`<html><body style="background:#0a0a0f;color:#fff;font-family:sans-serif;padding:4rem;text-align:center"><h1>Book content unavailable</h1><p style="color:#666">Could not extract PDF text</p><a href="/project/documents/pratham/_showcase" style="color:#7c3aed">Back to Pratham Showcase</a></body></html>`);
      }
      const doc = {
        title: 'Comprehensive Book on Quantitative Aptitude',
        content: bookText,
        frontmatter: { title: 'Comprehensive Book on Quantitative Aptitude', subtitle: 'For Undergraduate Entrance Exams', publisher: 'PRATHAM Test Prep', isbn: '978-81-19992-59-1', pages: 268 },
        fileName: 'pratham-qa-book.pdf',
        path: '_book/pratham-qa',
        downloadable: false,
        isAdmin: req.isAdmin,
        isHidden: false,
      };
      let relatedDocs = [];
      try {
        const relData = await selfFetch(`/api/search/related?path=${encodeURIComponent(docPath)}&limit=5`);
        relatedDocs = relData?.results || [];
      } catch(e) {}
      return res.send(documentViewerPage(doc, relatedDocs));
    }

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

    // Access control: hidden docs return 404 for public users
    const relPath = path.relative(DOCS_ROOT, resolvedPath);
    if (!req.isAdmin && access.isHidden(relPath)) {
      return res.status(404).send(`<html><body style="background:#0a0a0f;color:#fff;font-family:sans-serif;padding:4rem;text-align:center"><h1>Document not found</h1><p style="color:#666">${docPath.replace(/</g,'&lt;')}</p><a href="/project/documents/" style="color:#7c3aed">Back to docs</a></body></html>`);
    }

    const content = fs.readFileSync(resolvedPath, 'utf-8');
    const parsed = matter(content);
    const fileName = path.basename(resolvedPath);

    const downloadable = req.isAdmin || access.isDownloadable(relPath);

    const doc = {
      title: parsed.data.title || fileName.replace('.md', ''),
      content: parsed.content,
      frontmatter: parsed.data,
      fileName,
      path: docPath,
      downloadable,
      isAdmin: req.isAdmin,
      isHidden: access.isHidden(relPath),
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
app.use('/ankr-interact/data', express.static('/root/ankr-labs-nx/packages/ankr-interact/data'));

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
