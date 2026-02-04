/**
 * ANKR Viewer - HTML Templates
 * Server-rendered HTML pages for document browsing, searching, and viewing.
 * Used by ankr-viewer-server.js
 */

// Shared head with Tailwind CDN, Inter font, minimal custom CSS
function htmlHead(title, extra = '') {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} - ANKR Docs</title>
<script src="https://cdn.tailwindcss.com"></script>
<script>tailwind.config={darkMode:'class',theme:{extend:{colors:{brand:'#7c3aed',surface:'#0f0f14',card:'#16161d',border:'#23232d'}}}}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
*{font-family:'Inter',system-ui,sans-serif}
code,pre{font-family:'JetBrains Mono','Fira Code',monospace}
body{background:#0a0a0f;color:#e4e4e7;overflow-x:hidden}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#333;border-radius:3px}
.glass{background:rgba(22,22,29,0.8);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.06)}
.search-glow:focus{box-shadow:0 0 0 2px rgba(124,58,237,0.4)}
.fade-in{animation:fadeIn .2s ease-out}
@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.doc-content h1{font-size:1.875rem;font-weight:700;margin:1.5rem 0 1rem;color:#f4f4f5}
.doc-content h2{font-size:1.5rem;font-weight:600;margin:1.5rem 0 .75rem;color:#e4e4e7;border-bottom:1px solid #23232d;padding-bottom:.5rem}
.doc-content h3{font-size:1.25rem;font-weight:600;margin:1.25rem 0 .5rem;color:#d4d4d8}
.doc-content h4{font-size:1.1rem;font-weight:600;margin:1rem 0 .5rem;color:#a1a1aa}
.doc-content p{margin:.75rem 0;line-height:1.75;color:#a1a1aa}
.doc-content ul,.doc-content ol{margin:.5rem 0;padding-left:1.5rem;color:#a1a1aa}
.doc-content li{margin:.25rem 0;line-height:1.7}
.doc-content code{background:#1e1e28;padding:2px 6px;border-radius:4px;font-size:.875rem;color:#c084fc}
.doc-content pre{background:#111118;border:1px solid #23232d;border-radius:8px;padding:1rem;overflow-x:auto;margin:1rem 0;font-size:.8125rem;line-height:1.6}
.doc-content pre code{background:none;padding:0;color:#d4d4d8}
.doc-content blockquote{border-left:3px solid #7c3aed;padding:.5rem 1rem;margin:1rem 0;background:#12121a;border-radius:0 6px 6px 0;color:#a1a1aa}
.doc-content table{display:block;width:100%;border-collapse:collapse;margin:1rem 0;font-size:.875rem;overflow-x:auto;-webkit-overflow-scrolling:touch}
.doc-content th{background:#16161d;padding:.5rem .75rem;text-align:left;border:1px solid #23232d;font-weight:600;color:#d4d4d8}
.doc-content td{padding:.5rem .75rem;border:1px solid #23232d;color:#a1a1aa}
.doc-content a{color:#a78bfa;text-decoration:underline;text-underline-offset:2px;word-break:break-word;overflow-wrap:break-word}
.doc-content a:hover{color:#c4b5fd}
.doc-content hr{border:none;border-top:1px solid #23232d;margin:1.5rem 0}
.doc-content img{max-width:100%;border-radius:8px;margin:1rem 0}
.highlight{background:rgba(124,58,237,0.15);padding:0 2px;border-radius:2px}
.doc-content{overflow-wrap:break-word;word-wrap:break-word}

/* Callout blocks */
.callout{border-radius:8px;padding:12px 16px;margin:1rem 0;border-left:4px solid;display:flex;gap:10px;align-items:flex-start}
.callout-icon{flex-shrink:0;margin-top:2px}
.callout-note{background:#1e293b;border-color:#3b82f6;color:#93c5fd}
.callout-warning{background:#2d1f0e;border-color:#f59e0b;color:#fcd34d}
.callout-tip{background:#0f2d1e;border-color:#22c55e;color:#86efac}
.callout-important{background:#2d0f1e;border-color:#ef4444;color:#fca5a5}

/* Code copy button */
.code-block-wrapper{position:relative}
.code-copy-btn{position:absolute;top:8px;right:8px;padding:4px 8px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);border-radius:6px;color:#aaa;font-size:11px;cursor:pointer;opacity:0;transition:opacity .2s}
.code-block-wrapper:hover .code-copy-btn{opacity:1}
.code-copy-btn:hover{background:rgba(255,255,255,0.2);color:#fff}
.code-lang-badge{position:absolute;top:8px;left:12px;font-size:10px;color:#666;text-transform:uppercase;letter-spacing:.5px}

/* Flashcard flip */
.flashcard{perspective:1000px;cursor:pointer}
.flashcard-inner{position:relative;width:100%;min-height:160px;transition:transform .5s;transform-style:preserve-3d}
.flashcard.flipped .flashcard-inner{transform:rotateY(180deg)}
.flashcard-front,.flashcard-back{position:absolute;width:100%;min-height:160px;backface-visibility:hidden;border-radius:12px;padding:20px;display:flex;align-items:center;justify-content:center;text-align:center}
.flashcard-front{background:#1a1a2e;border:1px solid #2d2d44}
.flashcard-back{background:#1e293b;border:1px solid #334155;transform:rotateY(180deg);color:#93c5fd}

/* Mind map tree */
.mindmap-node{padding:4px 0;cursor:pointer}
.mindmap-toggle{display:inline-block;width:16px;text-align:center;color:#666;cursor:pointer}
.mindmap-label{margin-left:4px}
.mindmap-children{margin-left:20px;border-left:1px solid #2d2d44;padding-left:8px}

/* Light theme overrides */
html.light body{background:#fafafa;color:#1a1a2e}
html.light .glass{background:rgba(255,255,255,0.9);border-color:rgba(0,0,0,0.08)}
html.light .doc-content p{color:#374151}
html.light .doc-content h1{color:#111827}
html.light .doc-content h2{color:#1f2937;border-color:#e5e7eb}
html.light .doc-content h3{color:#374151}
html.light .doc-content h4{color:#4b5563}
html.light .doc-content code{background:#f3f4f6;color:#7c3aed}
html.light .doc-content pre{background:#f8f9fa;border-color:#e5e7eb}
html.light .doc-content pre code{color:#374151}
html.light .doc-content blockquote{background:#f0f0ff;border-color:#7c3aed;color:#4b5563}
html.light .doc-content a{color:#7c3aed}
html.light .doc-content th{background:#f3f4f6;color:#374151;border-color:#e5e7eb}
html.light .doc-content td{color:#4b5563;border-color:#e5e7eb}
html.light .doc-content ul,html.light .doc-content ol,html.light .doc-content li{color:#4b5563}
html.light nav.sticky{background:rgba(255,255,255,0.9);border-color:#e5e7eb}
html.light .callout-note{background:#eff6ff;color:#1e40af}
html.light .callout-warning{background:#fffbeb;color:#92400e}
html.light .callout-tip{background:#f0fdf4;color:#166534}
html.light .callout-important{background:#fef2f2;color:#991b1b}
html.light footer{border-color:#e5e7eb;color:#9ca3af}

/* Light theme: general page overrides */
html.light .text-white{color:#111827!important}
html.light .text-gray-200{color:#374151!important}
html.light .text-gray-300{color:#4b5563!important}
html.light .text-gray-400{color:#6b7280!important}
html.light .text-gray-500{color:#9ca3af!important}
html.light .text-gray-600{color:#d1d5db!important}
html.light .bg-card,html.light .bg-surface{background:#fff!important}
html.light .border-border{border-color:#e5e7eb!important}
html.light .bg-surface\/50{background:rgba(255,255,255,0.5)!important}
html.light input,html.light select,html.light textarea{background:#f9fafb!important;border-color:#d1d5db!important;color:#111827!important}
html.light input::placeholder{color:#9ca3af!important}
html.light kbd{background:#e5e7eb!important;color:#6b7280!important}
html.light .bg-white\/5,html.light .bg-white\/\[0\.02\],html.light .bg-white\/\[0\.03\],html.light .bg-white\/\[0\.04\]{background:rgba(0,0,0,0.03)!important}
html.light .bg-white\/10,html.light .bg-white\/15{background:rgba(0,0,0,0.06)!important}
html.light .border-white\/5,html.light .border-white\/10,html.light .border-white\/15{border-color:rgba(0,0,0,0.08)!important}
html.light .divide-white\/5>*+*{border-color:rgba(0,0,0,0.06)!important}
html.light .hover\:bg-white\/\[0\.04\]:hover{background:rgba(0,0,0,0.04)!important}
html.light .hover\:bg-white\/\[0\.03\]:hover{background:rgba(0,0,0,0.03)!important}
html.light .hover\:bg-white\/10:hover{background:rgba(0,0,0,0.06)!important}
html.light .hover\:text-white:hover{color:#111827!important}
html.light .hover\:text-gray-300:hover{color:#374151!important}
html.light .shadow-2xl{box-shadow:0 25px 50px -12px rgba(0,0,0,0.15)!important}
html.light #search-modal{background:rgba(0,0,0,0.3)!important}
html.light .bg-black\/70{background:rgba(0,0,0,0.3)!important}
</style>
<script>(function(){var t=localStorage.getItem('ankr-theme')||'dark';document.documentElement.className=t;})()</script>
${extra}
</head>`;
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Navigation bar
function navbar(active = '') {
  return `
<nav class="sticky top-0 z-50 glass border-b border-border">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
    <a href="/project/documents/" class="flex items-center gap-2 text-lg font-bold text-white hover:text-brand transition-colors">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
      ANKR Docs
    </a>
    <div class="flex items-center gap-4">
      <button onclick="document.getElementById('search-modal').classList.remove('hidden');document.getElementById('search-input').focus()" class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-400 transition-colors cursor-pointer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <span class="hidden sm:inline">Search docs...</span>
        <kbd class="hidden sm:inline px-1.5 py-0.5 text-[10px] bg-white/10 rounded ml-2">Ctrl+K</kbd>
      </button>
      <button onclick="toggleTheme()" class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors" title="Toggle theme">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
      <a href="/api/health" target="_blank" class="text-xs text-gray-500 hover:text-gray-400">API</a>
    </div>
  </div>
</nav>`;
}

// Search modal (shared across pages)
function searchModal() {
  return `
<div id="search-modal" class="hidden fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4" onclick="if(event.target===this)this.classList.add('hidden')">
  <div class="glass rounded-2xl w-full max-w-2xl shadow-2xl border border-white/10 overflow-hidden fade-in" onclick="event.stopPropagation()">
    <div class="p-4 flex items-center gap-3 border-b border-white/10">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <input id="search-input" type="text" placeholder="Search all documents..." autocomplete="off"
        class="flex-1 bg-transparent outline-none text-lg placeholder:text-gray-600 search-glow rounded px-1"
        oninput="debounceSearch(this.value)">
      <div id="search-spinner" class="hidden w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
      <kbd class="px-2 py-1 bg-white/10 rounded text-xs text-gray-500 cursor-pointer" onclick="document.getElementById('search-modal').classList.add('hidden')">ESC</kbd>
    </div>
    <div id="search-results" class="max-h-[60vh] overflow-y-auto">
      <div class="p-8 text-center text-gray-600">
        <p class="text-sm">Type to search across all ANKR documentation</p>
        <p class="text-xs mt-1 text-gray-700">Powered by eon hybrid search (BM25 + vector + RRF)</p>
      </div>
    </div>
    <div id="search-footer" class="p-2.5 border-t border-white/10 flex items-center justify-between text-xs text-gray-600 px-4">
      <span>Navigate: <kbd class="px-1 py-0.5 bg-white/5 rounded">Tab</kbd> <kbd class="px-1 py-0.5 bg-white/5 rounded">Enter</kbd></span>
      <span id="search-source"></span>
    </div>
  </div>
</div>

<script>
function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/\\x3c/g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
let searchTimer;
function debounceSearch(q) {
  clearTimeout(searchTimer);
  if (q.length < 2) {
    document.getElementById('search-results').innerHTML = '<div class="p-8 text-center text-gray-600"><p class="text-sm">Type to search across all ANKR documentation</p></div>';
    document.getElementById('search-source').textContent = '';
    return;
  }
  document.getElementById('search-spinner').classList.remove('hidden');
  searchTimer = setTimeout(() => doSearch(q), 250);
}

async function doSearch(q) {
  try {
    const resp = await fetch('/api/search?q=' + encodeURIComponent(q) + '&limit=30');
    const data = await resp.json();
    renderSearchResults(data, q);
  } catch(e) {
    document.getElementById('search-results').innerHTML = '<div class="p-6 text-center text-red-400">Search failed</div>';
  } finally {
    document.getElementById('search-spinner').classList.add('hidden');
  }
}

function renderSearchResults(data, query) {
  const el = document.getElementById('search-results');
  const src = document.getElementById('search-source');

  if (!data.results || data.results.length === 0) {
    el.innerHTML = '<div class="p-8 text-center text-gray-500"><p class="text-lg mb-1">No results found</p><p class="text-sm text-gray-600">Try different keywords</p></div>';
    src.textContent = '';
    return;
  }

  const srcBadge = data.source === 'eon-hybrid'
    ? '<span class="text-emerald-400 flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> AI Search</span>'
    : '<span class="text-amber-400">Regex</span>';
  src.innerHTML = data.totalResults + ' results &middot; ' + srcBadge;

  let html = '';
  const grouped = data.grouped && Object.keys(data.grouped).length > 0 ? data.grouped : null;

  if (grouped) {
    for (const [key, group] of Object.entries(grouped)) {
      html += '<div class="border-b border-white/5">';
      html += '<div class="px-4 py-2 bg-white/[0.02] flex items-center gap-2 text-sm">';
      html += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>';
      html += '<span class="font-medium text-amber-200">' + esc(group.title) + '</span>';
      html += '<span class="text-xs text-gray-500">(' + group.count + ')</span>';
      html += '</div>';
      for (const doc of group.results) {
        html += searchResultItem(doc, query);
      }
      if (group.count > group.results.length) {
        html += '<div class="px-4 py-2 pl-11 text-xs text-gray-600">+' + (group.count - group.results.length) + ' more</div>';
      }
      html += '</div>';
    }
  } else {
    for (const doc of data.results.slice(0, 20)) {
      html += searchResultItem(doc, query);
    }
  }
  el.innerHTML = html;
}

function searchResultItem(doc, query) {
  const isProject = doc._isProject || (doc.path.startsWith('project/documents/') && doc.path.split('/').length === 3);
  const href = isProject ? '/' + doc.path : '/view/' + encodeURIComponent(doc.path);
  const icon = isProject
    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" class="mt-0.5 flex-shrink-0"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'
    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" class="mt-0.5 flex-shrink-0"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>';
  const excerpt = (doc.excerpt || '').slice(0, 140);
  const similarity = doc.similarity ? '<span class="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full">' + doc.similarity + '%</span>' : '';
  const score = doc.score ? '<span class="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded-full">score ' + doc.score + '</span>' : '';
  const tags = (doc.tags || []).slice(0, 2).map(t => '<span class="text-[10px] px-1.5 py-0.5 bg-cyan-500/15 text-cyan-400 rounded-full">' + esc(t) + '</span>').join('');
  const projectBadge = isProject ? '<span class="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full">Project</span>' : '';

  return '<a href="' + href + '" class="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors">'
    + icon
    + '<div class="flex-1 min-w-0">'
    + '<div class="font-medium text-sm text-gray-200 truncate">' + esc(doc.name) + '</div>'
    + (excerpt ? '<div class="text-xs text-gray-500 mt-0.5 line-clamp-1">' + esc(excerpt) + '</div>' : '')
    + '<div class="flex items-center gap-1.5 mt-1 flex-wrap">' + projectBadge + tags + similarity + score + '</div>'
    + '</div></a>';
}

// Global keyboard shortcut
document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const modal = document.getElementById('search-modal');
    modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden')) {
      document.getElementById('search-input').focus();
    }
  }
  if (e.key === 'Escape') {
    document.getElementById('search-modal').classList.add('hidden');
  }
});

// Global theme toggle (available on all pages via searchModal)
function toggleTheme() {
  var next = document.documentElement.className === 'light' ? 'dark' : 'light';
  document.documentElement.className = next;
  localStorage.setItem('ankr-theme', next);
}
</script>`;
}

// ============================================
// PAGE: Documents Home (/project/documents/)
// ============================================
function documentsHomePage(projects, categories, categoryOrder) {
  categories = categories || {};
  categoryOrder = categoryOrder || [];

  const featured = projects.filter(p => p.featured);
  const totalDocs = projects.reduce((s,p) => s + (p.fileCount || 0), 0);
  const totalProducts = projects.length;

  // Group non-featured by category
  const grouped = {};
  for (const p of projects) {
    if (p.featured) continue;
    const cat = p.category || 'infra';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  }

  // Build category sections in order
  const usedCats = categoryOrder.filter(c => grouped[c] && grouped[c].length > 0);
  // Add any categories not in the predefined order
  for (const c of Object.keys(grouped)) {
    if (!usedCats.includes(c)) usedCats.push(c);
  }

  // Build category tab buttons
  const tabButtons = usedCats.map(c => {
    const meta = categories[c] || {};
    const label = meta.label || c.charAt(0).toUpperCase() + c.slice(1);
    const count = (grouped[c] || []).length + (c === usedCats[0] ? 0 : 0); // just category count
    return `<button onclick="filterCat('${esc(c)}')" data-cat="${esc(c)}" class="cat-tab px-3 py-1.5 text-xs font-medium rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all whitespace-nowrap">${esc(label)} <span class="text-gray-600">${(grouped[c]||[]).length}</span></button>`;
  }).join('\n      ');

  // Build category sections HTML
  let categorySections = '';
  for (const cat of usedCats) {
    const meta = categories[cat] || {};
    const label = meta.label || cat.charAt(0).toUpperCase() + cat.slice(1);
    const color = meta.color || 'gray';
    const items = grouped[cat] || [];

    categorySections += `
    <div class="cat-section mb-10" data-category="${esc(cat)}">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-1 h-5 rounded-full bg-${esc(color)}-500"></div>
        <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wider">${esc(label)}</h2>
        <span class="text-xs text-gray-600">${items.length} product${items.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${items.map(p => projectCard(p, false)).join('')}
      </div>
    </div>`;
  }

  // Status legend
  const statusCounts = {};
  for (const p of projects) {
    const s = p.status || 'unknown';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }

  return htmlHead('ANKR Documentation Portal') + `
<body class="min-h-screen">
${navbar('docs')}
${searchModal()}

<main class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
  <!-- Hero -->
  <div class="text-center mb-10">
    <h1 class="text-3xl sm:text-4xl font-bold text-white mb-3">ANKR Product Ecosystem</h1>
    <p class="text-gray-400 mb-6 max-w-2xl mx-auto">Browse documentation, architecture, progress, and investor materials across all ANKR products — from live platforms to projects in development.</p>
    <div class="max-w-xl mx-auto">
      <div class="relative">
        <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input id="hero-search" type="text" placeholder="Search all documents..." autocomplete="off"
          class="w-full pl-12 pr-4 py-3.5 bg-card border border-border rounded-xl text-base placeholder:text-gray-600 outline-none search-glow transition-all focus:border-brand/50"
          onfocus="document.getElementById('search-modal').classList.remove('hidden');document.getElementById('search-input').focus();this.blur()">
      </div>
    </div>
  </div>

  <!-- Stats bar -->
  <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-4 text-sm text-gray-500">
    <span><strong class="text-gray-300">${totalProducts}</strong> products</span>
    <span><strong class="text-gray-300">${totalDocs}</strong> documents</span>
    <span><strong class="text-gray-300">${usedCats.length}</strong> categories</span>
    <span id="eon-badge"></span>
  </div>

  <!-- Status legend -->
  <div class="flex flex-wrap items-center justify-center gap-3 mb-8 text-xs text-gray-500">
    ${statusCounts.live ? `<span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Live (${statusCounts.live})</span>` : ''}
    ${statusCounts.beta ? `<span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-500"></span> Beta (${statusCounts.beta})</span>` : ''}
    ${statusCounts.development ? `<span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-500"></span> In Development (${statusCounts.development})</span>` : ''}
    ${statusCounts.poc ? `<span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-cyan-500"></span> POC (${statusCounts.poc})</span>` : ''}
    ${statusCounts.planned ? `<span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-gray-500"></span> Planned (${statusCounts.planned})</span>` : ''}
  </div>

  ${featured.length > 0 ? `
  <!-- Featured / Flagship Products -->
  <div class="mb-10">
    <div class="flex items-center gap-3 mb-4">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">Flagship Products</h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      ${featured.map(p => projectCard(p, true)).join('')}
    </div>
  </div>` : ''}

  <!-- Pratham AI Showcase Banner -->
  <a href="/project/documents/pratham/_showcase" class="block mb-10 rounded-2xl overflow-hidden bg-gradient-to-r from-brand/10 via-amber-500/5 to-emerald-500/10 border border-brand/20 hover:border-brand/40 transition-all group">
    <div class="flex flex-col sm:flex-row items-center gap-4 p-5">
      <div class="w-12 h-12 rounded-xl bg-brand/20 flex items-center justify-center flex-shrink-0">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4v2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h2V6a4 4 0 0 1 4-4z"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/></svg>
      </div>
      <div class="flex-1 text-center sm:text-left">
        <div class="font-bold text-white text-lg group-hover:text-brand transition-colors">Pratham QA Book \u00D7 ANKR AI Tutor</div>
        <div class="text-sm text-gray-400">268-page textbook chunked, vectorized & ready for 8 AI modes \u2014 Summary, Quiz, Fermi, Socratic & more</div>
      </div>
      <div class="flex items-center gap-3 flex-shrink-0">
        <div class="hidden sm:flex gap-2 text-xs">
          <span class="px-2 py-1 bg-brand/20 text-brand rounded-full">RAG</span>
          <span class="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full">Live Demo</span>
          <span class="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">8 AI Modes</span>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" class="group-hover:translate-x-1 transition-transform"><path d="m9 18 6-6-6-6"/></svg>
      </div>
    </div>
  </a>

  <!-- FreightBox Showcase Banner -->
  <a href="/project/documents/freightbox/_showcase" class="block mb-10 rounded-2xl overflow-hidden bg-gradient-to-r from-blue-500/10 via-emerald-500/5 to-amber-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all group">
    <div class="flex flex-col sm:flex-row items-center gap-4 p-5">
      <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-blue-700/20 flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">FB</div>
      <div class="flex-1 text-center sm:text-left">
        <div class="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">FreightBox \u2014 Multimodal Freight Management</div>
        <div class="text-sm text-gray-400">10 modules, 37 doc types, 5 products \u2014 vs CargoWise competitive dashboard, FR8X Exchange & more</div>
      </div>
      <div class="flex items-center gap-3 flex-shrink-0">
        <div class="hidden sm:flex gap-2 text-xs">
          <span class="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">GraphQL</span>
          <span class="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">5 Products</span>
          <span class="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full">AI-Powered</span>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" class="group-hover:translate-x-1 transition-transform"><path d="m9 18 6-6-6-6"/></svg>
      </div>
    </div>
  </a>

  <!-- WareXAI Showcase Banner -->
  <a href="/project/documents/warexai/_showcase" class="block mb-10 rounded-2xl overflow-hidden bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-emerald-500/10 border border-cyan-500/20 hover:border-cyan-500/40 transition-all group">
    <div class="flex flex-col sm:flex-row items-center gap-4 p-5">
      <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/20 flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">WX</div>
      <div class="flex-1 text-center sm:text-left">
        <div class="font-bold text-white text-lg group-hover:text-cyan-400 transition-colors">WareXAI \u2014 AI-Powered Warehouse Management</div>
        <div class="text-sm text-gray-400">80+ modules, 90 models, AI analytics, multi-warehouse networks, mobile workforce & Indian compliance</div>
      </div>
      <div class="flex items-center gap-3 flex-shrink-0">
        <div class="hidden sm:flex gap-2 text-xs">
          <span class="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-full">80+ Modules</span>
          <span class="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">AI-Powered</span>
          <span class="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">GST Native</span>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" class="group-hover:translate-x-1 transition-transform"><path d="m9 18 6-6-6-6"/></svg>
      </div>
    </div>
  </a>

  <!-- SunoSunao Showcase Banner -->
  <a href="/project/documents/sunosunao/_showcase" class="block mb-10 rounded-2xl overflow-hidden bg-gradient-to-r from-rose-500/10 via-orange-500/5 to-amber-500/10 border border-rose-500/20 hover:border-rose-500/40 transition-all group">
    <div class="flex flex-col sm:flex-row items-center gap-4 p-5">
      <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/30 to-orange-600/20 flex items-center justify-center flex-shrink-0 text-2xl">\u{1F3A4}</div>
      <div class="flex-1 text-center sm:text-left">
        <div class="font-bold text-white text-lg group-hover:text-rose-400 transition-colors">SunoSunao \u2014 Voice & Media Platform</div>
        <div class="text-sm text-gray-400">Voice legacy, podcasts, voicebook & social listening \u2014 AI transcription, 103 languages, voice cloning</div>
      </div>
      <div class="flex items-center gap-3 flex-shrink-0">
        <div class="hidden sm:flex gap-2 text-xs">
          <span class="px-2 py-1 bg-rose-500/20 text-rose-400 rounded-full">Voice AI</span>
          <span class="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full">103 Languages</span>
          <span class="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full">Voice Cloning</span>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" class="group-hover:translate-x-1 transition-transform"><path d="m9 18 6-6-6-6"/></svg>
      </div>
    </div>
  </a>

  <!-- Category Filter Tabs -->
  <div class="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
    <button onclick="filterCat('all')" data-cat="all" class="cat-tab active px-3 py-1.5 text-xs font-medium rounded-full border border-brand/50 text-brand transition-all whitespace-nowrap">All Products <span class="text-brand/60">${projects.length - featured.length}</span></button>
    ${tabButtons}
  </div>

  <!-- Category Grouped Sections -->
  <div id="category-sections">
    ${categorySections}
  </div>
</main>

<footer class="border-t border-border mt-16 py-6 text-center text-xs text-gray-600">
  ANKR Labs &middot; Product Ecosystem Portal &middot; Powered by eon hybrid search
</footer>

<script>
// EON badge
fetch('/api/health').then(r=>r.json()).then(d=>{
  const badge = document.getElementById('eon-badge');
  if(d.eon && d.eon.available) {
    badge.innerHTML='<span class="flex items-center gap-1 text-emerald-400"><span class="w-2 h-2 bg-emerald-400 rounded-full"></span> AI Search</span>';
  } else {
    badge.innerHTML='<span class="text-amber-400">Regex mode</span>';
  }
});

// Desktop: show Ctrl+K hint in hero search
if (window.matchMedia('(min-width:640px)').matches) {
  var hs = document.getElementById('hero-search');
  if (hs) hs.placeholder = 'Search all documents... (Ctrl+K)';
}

// Category filter
function filterCat(cat) {
  document.querySelectorAll('.cat-tab').forEach(t => {
    t.classList.remove('active');
    t.classList.remove('border-brand/50', 'text-brand');
    t.classList.add('border-white/10', 'text-gray-400');
  });
  const active = document.querySelector('.cat-tab[data-cat="'+cat+'"]');
  if (active) {
    active.classList.add('active', 'border-brand/50', 'text-brand');
    active.classList.remove('border-white/10', 'text-gray-400');
  }
  document.querySelectorAll('.cat-section').forEach(s => {
    if (cat === 'all') {
      s.style.display = '';
    } else {
      s.style.display = s.dataset.category === cat ? '' : 'none';
    }
  });
}
</script>
</body></html>`;
}

// Status badge helper
function statusBadge(status) {
  const map = {
    live:        { color: 'emerald', label: 'Live' },
    beta:        { color: 'blue',    label: 'Beta' },
    development: { color: 'amber',   label: 'In Dev' },
    poc:         { color: 'cyan',    label: 'POC' },
    planned:     { color: 'gray',    label: 'Planned' },
  };
  const s = map[status] || map.planned;
  return `<span class="flex items-center gap-1 text-[10px] text-${s.color}-400"><span class="w-1.5 h-1.5 rounded-full bg-${s.color}-500"></span>${s.label}</span>`;
}

function projectCard(p, featured) {
  const border = featured ? 'border-brand/30 hover:border-brand/50' : 'border-border hover:border-white/15';
  const statsHtml = p.stats && Object.keys(p.stats).length > 0
    ? '<div class="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-gray-500">'
      + Object.entries(p.stats).slice(0, 4).map(([k,v]) => `<span><strong class="text-gray-400">${esc(String(v))}</strong> ${esc(k.replace(/([A-Z])/g, ' $1').toLowerCase())}</span>`).join('')
      + '</div>'
    : '';
  const tagsHtml = (p.tags || []).slice(0, 5).map(t =>
    `<span class="text-[10px] px-1.5 py-0.5 bg-white/5 text-gray-500 rounded-full">${esc(t)}</span>`
  ).join('');

  const href = '/project/documents/' + p.id;
  const hasCode = p.codePaths && p.codePaths.length > 0;
  const hasDocs = (p.fileCount || 0) > 0;

  return `
<a href="${href}" class="block glass rounded-xl p-5 ${border} transition-all hover:bg-white/[0.02] group">
  <div class="flex items-start justify-between mb-2">
    <div class="flex items-center gap-2 min-w-0">
      ${featured ? '<svg class="flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' : ''}
      <h3 class="font-semibold text-white group-hover:text-brand transition-colors truncate">${esc(p.title)}</h3>
    </div>
    <div class="flex items-center gap-2 flex-shrink-0 ml-2">
      ${statusBadge(p.status || 'planned')}
    </div>
  </div>
  ${p.description ? `<p class="text-sm text-gray-400 line-clamp-2 mb-2">${esc(p.description)}</p>` : ''}
  ${statsHtml}
  <div class="flex items-center justify-between mt-3">
    <div class="flex flex-wrap gap-1">${tagsHtml}</div>
    <div class="flex items-center gap-2 text-[10px] text-gray-600 flex-shrink-0">
      ${hasDocs ? `<span class="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>${p.fileCount}</span>` : ''}
      ${hasCode ? `<span class="flex items-center gap-1 text-brand/50"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>${p.codePaths.length}</span>` : ''}
    </div>
  </div>
</a>`;
}

// ============================================
// PAGE: Project Detail (/project/documents/:id)
// ============================================
function projectDetailPage(project, relatedProjects, isAdmin) {
  const statsHtml = project.stats && Object.keys(project.stats).length > 0
    ? Object.entries(project.stats).map(([k,v]) =>
        `<div class="glass rounded-lg p-3 text-center">
          <div class="text-xl font-bold text-white">${esc(String(v))}</div>
          <div class="text-xs text-gray-500 mt-1">${esc(k.replace(/([A-Z])/g, ' $1').trim())}</div>
        </div>`
      ).join('')
    : '';

  const filesHtml = (project.files || []).map(f => {
    const dl = f.downloadable !== false;
    const hidden = f.isHidden || false;

    // Download icon or lock icon
    const dlIcon = dl
      ? `<a href="/api/file/raw?path=${encodeURIComponent(f.path)}" download onclick="event.stopPropagation()" class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-white" title="Download">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </a>`
      : `<span class="flex-shrink-0 text-gray-700" title="Download restricted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </span>`;

    // Admin: eye toggle + download toggle
    const adminIcons = isAdmin ? `
      <button onclick="event.preventDefault();event.stopPropagation();toggleFileHide('${esc(f.path)}',this)" class="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors ${hidden ? 'text-red-400' : 'text-emerald-400'}" title="${hidden ? 'Hidden - click to show' : 'Visible - click to hide'}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${hidden ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>' : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'}</svg>
      </button>
      <button onclick="event.preventDefault();event.stopPropagation();toggleFileDl('${esc(f.path)}',this)" class="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors ${dl ? 'text-emerald-400' : 'text-red-400'}" title="${dl ? 'Download allowed - click to block' : 'Download blocked - click to allow'}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${dl ? '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>' : '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'}</svg>
      </button>` : '';

    return `
    <a href="/view/${encodeURIComponent(f.path)}" class="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.04] transition-colors group ${hidden ? 'opacity-50' : ''}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" class="flex-shrink-0"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
      <div class="flex-1 min-w-0">
        <div class="font-medium text-sm text-gray-200 group-hover:text-white truncate">${esc(f.title || f.name)}</div>
        <div class="text-xs text-gray-600">${f.size ? (f.size / 1024).toFixed(1) + ' KB' : ''} ${f.category ? '&middot; ' + esc(f.category) : ''}${f.source === 'auto' ? ' &middot; <span class="text-amber-500">from source</span>' : ''}</div>
      </div>
      ${adminIcons}
      ${dlIcon}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"><path d="m9 18 6-6-6-6"/></svg>
    </a>`;
  }).join('');

  const tagsHtml = (project.tags || []).map(t =>
    `<span class="text-xs px-2 py-1 bg-white/5 text-gray-400 rounded-full">${esc(t)}</span>`
  ).join('');

  const relatedHtml = (relatedProjects || []).filter(r => r.id !== project.id).slice(0, 4).map(r => `
    <a href="/project/documents/${esc(r.id)}" class="glass rounded-lg p-3 hover:bg-white/[0.03] transition-colors block">
      <div class="font-medium text-sm text-gray-300">${esc(r.title)}</div>
      <div class="text-xs text-gray-600 mt-1">${r.fileCount || 0} docs</div>
    </a>
  `).join('');

  return htmlHead(project.title) + `
<body class="min-h-screen">
${navbar()}
${searchModal()}

<main class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
  <!-- Breadcrumb -->
  <nav class="flex items-center gap-2 text-sm text-gray-500 mb-6">
    <a href="/project/documents/" class="hover:text-gray-300 transition-colors">Docs</a>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
    <span class="text-gray-300">${esc(project.title)}</span>
  </nav>

  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center gap-3 mb-2">
      ${project.featured ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' : ''}
      <h1 class="text-2xl sm:text-3xl font-bold text-white">${esc(project.title)}</h1>
    </div>
    ${project.description ? `<p class="text-gray-400 max-w-2xl mb-3">${esc(project.description)}</p>` : ''}
    <div class="flex flex-wrap gap-2">${tagsHtml}</div>
  </div>

  ${project.id === 'pratham' ? `
  <!-- Showcase Banner -->
  <a href="/project/documents/pratham/_showcase" class="block mb-8 p-4 rounded-xl bg-gradient-to-r from-brand/20 to-amber-500/10 border border-brand/30 hover:border-brand/50 transition-all group">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-lg bg-brand/30 flex items-center justify-center flex-shrink-0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4v2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h2V6a4 4 0 0 1 4-4z"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/></svg>
      </div>
      <div>
        <div class="font-semibold text-white group-hover:text-brand transition-colors">AI Tutor Showcase</div>
        <div class="text-sm text-gray-400">Try 8 AI modes live — Summary, Quiz, Fermi, Socratic & more</div>
      </div>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" class="ml-auto flex-shrink-0 group-hover:translate-x-1 transition-transform"><path d="m9 18 6-6-6-6"/></svg>
    </div>
  </a>` : ''}

  ${project.id === 'freightbox' ? `
  <!-- FreightBox Showcase Banner -->
  <a href="/project/documents/freightbox/_showcase" class="block mb-8 p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-emerald-500/10 border border-blue-500/30 hover:border-blue-500/50 transition-all group">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/30 to-blue-700/20 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">FB</div>
      <div>
        <div class="font-semibold text-white group-hover:text-blue-400 transition-colors">FreightBox Platform Showcase</div>
        <div class="text-sm text-gray-400">10 modules, vs CargoWise dashboard, FR8X Exchange, pricing & more</div>
      </div>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" class="ml-auto flex-shrink-0 group-hover:translate-x-1 transition-transform"><path d="m9 18 6-6-6-6"/></svg>
    </div>
  </a>` : ''}

  ${project.id === 'warexai' ? `
  <!-- WareXAI Showcase Banner -->
  <a href="/project/documents/warexai/_showcase" class="block mb-8 p-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 hover:border-cyan-500/50 transition-all group">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-600/20 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">WX</div>
      <div>
        <div class="font-semibold text-white group-hover:text-cyan-400 transition-colors">WareXAI Platform Showcase</div>
        <div class="text-sm text-gray-400">80+ modules, AI analytics, mobile workforce, Indian compliance</div>
      </div>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" class="ml-auto flex-shrink-0 group-hover:translate-x-1 transition-transform"><path d="m9 18 6-6-6-6"/></svg>
    </div>
  </a>` : ''}

  ${project.id === 'sunosunao' ? `
  <!-- SunoSunao Showcase Banner -->
  <a href="/project/documents/sunosunao/_showcase" class="block mb-8 p-4 rounded-xl bg-gradient-to-r from-rose-500/20 to-orange-500/10 border border-rose-500/30 hover:border-rose-500/50 transition-all group">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500/30 to-orange-600/20 flex items-center justify-center flex-shrink-0 text-xl">\u{1F3A4}</div>
      <div>
        <div class="font-semibold text-white group-hover:text-rose-400 transition-colors">SunoSunao Platform Showcase</div>
        <div class="text-sm text-gray-400">Voice legacy, 103 languages, AI transcription, voice cloning & more</div>
      </div>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" class="ml-auto flex-shrink-0 group-hover:translate-x-1 transition-transform"><path d="m9 18 6-6-6-6"/></svg>
    </div>
  </a>` : ''}

  ${statsHtml ? `
  <!-- Stats Grid -->
  <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
    ${statsHtml}
  </div>` : ''}

  <!-- Files -->
  <div class="mb-10">
    <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Documents (${(project.files || []).length})</h2>
    <div class="glass rounded-xl divide-y divide-white/5 overflow-hidden">
      ${filesHtml || '<div class="p-6 text-center text-gray-600">No documents yet</div>'}
    </div>
  </div>

  ${relatedHtml ? `
  <!-- Related Projects -->
  <div>
    <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Related Projects</h2>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">${relatedHtml}</div>
  </div>` : ''}
</main>

<footer class="border-t border-border mt-16 py-6 text-center text-xs text-gray-600">
  ANKR Labs &middot; Documentation Portal
</footer>

${isAdmin ? `<script>
function getAdminKey() {
  return new URLSearchParams(window.location.search).get('_admin') || '';
}
function toggleFileHide(filePath, btn) {
  const key = getAdminKey();
  if (!key) return alert('Admin key required (?_admin=key)');
  const isHidden = btn.classList.contains('text-red-400');
  fetch('/api/admin/hide', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-ankr-admin': key },
    body: JSON.stringify({ path: filePath, hidden: !isHidden })
  }).then(r => r.json()).then(d => {
    if (d.success) {
      const row = btn.closest('a');
      if (d.hidden) { btn.classList.replace('text-emerald-400','text-red-400'); row.classList.add('opacity-50'); }
      else { btn.classList.replace('text-red-400','text-emerald-400'); row.classList.remove('opacity-50'); }
    }
  });
}
function toggleFileDl(filePath, btn) {
  const key = getAdminKey();
  if (!key) return alert('Admin key required (?_admin=key)');
  const isAllowed = btn.classList.contains('text-emerald-400');
  fetch('/api/admin/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-ankr-admin': key },
    body: JSON.stringify({ path: filePath, downloadable: !isAllowed })
  }).then(r => r.json()).then(d => {
    if (d.success) {
      if (d.downloadable) btn.classList.replace('text-red-400','text-emerald-400');
      else btn.classList.replace('text-emerald-400','text-red-400');
    }
  });
}
</script>` : ''}
</body></html>`;
}

// ============================================
// PAGE: Document Viewer (/view/:path)
// ============================================
function documentViewerPage(doc, relatedDocs) {
  const relatedHtml = (relatedDocs || []).map(r => `
    <a href="/view/${encodeURIComponent(r.path)}" class="block p-2.5 rounded-lg hover:bg-white/[0.04] transition-colors">
      <div class="text-sm font-medium text-gray-300 line-clamp-2">${esc(r.name)}</div>
      ${r.similarity ? '<div class="text-xs text-emerald-400 mt-1">' + r.similarity + '% similar</div>' : ''}
    </a>
  `).join('');

  const frontmatterHtml = doc.frontmatter && Object.keys(doc.frontmatter).length > 0
    ? '<div class="glass rounded-lg p-4 mb-6 text-sm">'
      + '<div class="text-xs text-gray-500 uppercase tracking-wider mb-2">Metadata</div>'
      + Object.entries(doc.frontmatter).filter(([k]) => !['title','content'].includes(k)).slice(0, 8).map(([k,v]) =>
          `<div class="flex flex-col sm:flex-row items-start gap-1 sm:gap-2 py-1"><span class="text-gray-500 text-xs sm:min-w-[80px]">${esc(k)}:</span><span class="text-gray-300 break-all">${esc(Array.isArray(v) ? v.join(', ') : String(v))}</span></div>`
        ).join('')
      + '</div>'
    : '';

  const canDownload = doc.downloadable !== false;
  const downloadBtn = canDownload
    ? `<a href="/api/file/raw?path=${encodeURIComponent(doc.path)}" download class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-400 hover:text-white transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Download
      </a>`
    : `<span class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-600 cursor-not-allowed" title="Download restricted">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Restricted
      </span>`;

  // Admin bar: visibility + download controls
  const adminBar = doc.isAdmin ? `
    <div class="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
      <span class="text-amber-400 font-semibold">ADMIN</span>
      <button onclick="toggleHide()" id="hide-btn" class="px-2 py-1 rounded ${doc.isHidden ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'} hover:opacity-80 transition-opacity">
        ${doc.isHidden ? 'Hidden from public' : 'Visible to public'}
      </button>
      <button onclick="toggleDownload()" id="dl-btn" class="px-2 py-1 rounded ${canDownload ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'} hover:opacity-80 transition-opacity">
        ${canDownload ? 'Download allowed' : 'Download blocked'}
      </button>
    </div>` : '';

  const extraHead = `
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism-tomorrow.min.css">
<script src="https://cdn.jsdelivr.net/npm/prismjs@1/prism.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/prismjs@1/plugins/autoloader/prism-autoloader.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>`;

  return htmlHead(doc.title || 'Document', extraHead) + `
<body class="min-h-screen">
<!-- Reading progress bar -->
<div id="reading-progress" class="fixed top-14 left-0 h-0.5 bg-brand z-50 transition-all" style="width:0%"></div>

${navbar()}
${searchModal()}

<main class="max-w-7xl mx-auto px-4 sm:px-6 py-8" id="main-content">
  <!-- Breadcrumb + Actions -->
  <div class="flex items-center justify-between mb-6 flex-wrap gap-2">
    <nav class="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
      <a href="/project/documents/" class="hover:text-gray-300 transition-colors">Docs</a>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
      <span class="text-gray-300 truncate">${esc(doc.title || doc.fileName)}</span>
    </nav>
    <div class="flex items-center gap-2">
      <!-- Bookmark star -->
      <button id="bookmark-btn" onclick="toggleBookmark()" class="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-400 hover:text-amber-400 transition-colors" title="Bookmark (b)">
        <svg id="bookmark-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
      <!-- Focus mode -->
      <button onclick="toggleFocusMode()" class="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-400 hover:text-white transition-colors" title="Focus mode (f)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
      </button>
      <!-- Theme toggle -->
      <button onclick="toggleTheme()" class="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-400 hover:text-white transition-colors" title="Theme (t)">
        <svg id="theme-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
      <!-- AI Panel toggle -->
      <button onclick="toggleAIPanel()" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand/20 hover:bg-brand/30 border border-brand/30 text-sm text-brand hover:text-white transition-colors" title="AI Assistant (a)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4v2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h2V6a4 4 0 0 1 4-4z"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/></svg>
        AI
      </button>
      ${downloadBtn}
    </div>
  </div>

  ${adminBar}

  <div class="flex gap-8">
    <!-- Main Content -->
    <article id="article-content" class="flex-1 min-w-0 max-w-full overflow-hidden">
      ${frontmatterHtml}
      <div id="doc-content" class="doc-content"></div>
    </article>

    <!-- Sidebar -->
    <aside id="doc-sidebar" class="hidden lg:block w-64 flex-shrink-0">
      <div class="sticky top-20">
        <!-- Table of Contents -->
        <div class="mb-6">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">On this page</h3>
          <nav id="toc" class="text-sm space-y-1 max-h-[40vh] overflow-y-auto"></nav>
        </div>

        ${relatedHtml ? `
        <div class="mb-6">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Related</h3>
          <div class="space-y-1">${relatedHtml}</div>
        </div>` : ''}

        <!-- Backlinks section -->
        <div id="backlinks-section" class="mb-6">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Linked from</h3>
          <div id="backlinks-list" class="text-sm space-y-1">
            <span class="text-xs text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    </aside>
  </div>
</main>

<!-- AI Panel (fixed right) -->
<div id="ai-panel" class="hidden fixed right-0 top-14 bottom-0 w-96 max-w-full z-40 border-l border-border flex flex-col" style="background:var(--ai-bg,#0f0f14)">
  <!-- AI Header -->
  <div class="flex items-center justify-between px-4 py-3 border-b border-border">
    <div class="flex items-center gap-2">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4v2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h2V6a4 4 0 0 1 4-4z"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/></svg>
      <span class="font-semibold text-sm">AI Assistant</span>
    </div>
    <button onclick="toggleAIPanel()" class="p-1 hover:bg-white/10 rounded transition-colors">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>

  <!-- AI Tabs -->
  <div class="flex overflow-x-auto border-b border-border text-xs">
    <button onclick="switchAITab('chat')" class="ai-tab px-3 py-2 whitespace-nowrap border-b-2 border-brand text-brand" data-tab="chat">Chat</button>
    <button onclick="switchAITab('summary')" class="ai-tab px-3 py-2 whitespace-nowrap border-b-2 border-transparent text-gray-500 hover:text-gray-300" data-tab="summary">Summary</button>
    <button onclick="switchAITab('keypoints')" class="ai-tab px-3 py-2 whitespace-nowrap border-b-2 border-transparent text-gray-500 hover:text-gray-300" data-tab="keypoints">Key Points</button>
    <button onclick="switchAITab('quiz')" class="ai-tab px-3 py-2 whitespace-nowrap border-b-2 border-transparent text-gray-500 hover:text-gray-300" data-tab="quiz">Quiz</button>
    <button onclick="switchAITab('flashcards')" class="ai-tab px-3 py-2 whitespace-nowrap border-b-2 border-transparent text-gray-500 hover:text-gray-300" data-tab="flashcards">Flashcards</button>
    <button onclick="switchAITab('mindmap')" class="ai-tab px-3 py-2 whitespace-nowrap border-b-2 border-transparent text-gray-500 hover:text-gray-300" data-tab="mindmap">Mind Map</button>
    <button onclick="switchAITab('fermi')" class="ai-tab px-3 py-2 whitespace-nowrap border-b-2 border-transparent text-amber-500/60 hover:text-amber-400" data-tab="fermi">Fermi</button>
    <button onclick="switchAITab('socratic')" class="ai-tab px-3 py-2 whitespace-nowrap border-b-2 border-transparent text-emerald-500/60 hover:text-emerald-400" data-tab="socratic">Socratic</button>
  </div>

  <!-- Tab Content -->
  <div class="flex-1 overflow-y-auto p-4" id="ai-tab-content">
    <!-- Chat tab (default) -->
    <div id="ai-content-chat">
      <div id="chat-messages" class="space-y-3 mb-4">
        <div class="text-sm text-gray-500 text-center py-8">Ask me anything about this document</div>
      </div>
    </div>
    <div id="ai-content-summary" class="hidden"><div class="text-center py-8"><button onclick="generateSummary()" class="px-4 py-2 bg-brand/20 hover:bg-brand/30 text-brand rounded-lg text-sm transition-colors">Generate Summary</button></div></div>
    <div id="ai-content-keypoints" class="hidden"><div class="text-center py-8"><button onclick="generateKeypoints()" class="px-4 py-2 bg-brand/20 hover:bg-brand/30 text-brand rounded-lg text-sm transition-colors">Extract Key Points</button></div></div>
    <div id="ai-content-quiz" class="hidden"><div class="text-center py-8"><button onclick="generateQuiz()" class="px-4 py-2 bg-brand/20 hover:bg-brand/30 text-brand rounded-lg text-sm transition-colors">Generate Quiz</button></div></div>
    <div id="ai-content-flashcards" class="hidden"><div class="text-center py-8"><button onclick="generateFlashcards()" class="px-4 py-2 bg-brand/20 hover:bg-brand/30 text-brand rounded-lg text-sm transition-colors">Generate Flashcards</button></div></div>
    <div id="ai-content-mindmap" class="hidden"><div class="text-center py-8"><button onclick="generateMindmap()" class="px-4 py-2 bg-brand/20 hover:bg-brand/30 text-brand rounded-lg text-sm transition-colors">Generate Mind Map</button></div></div>
    <div id="ai-content-fermi" class="hidden"><div class="text-center py-8"><button onclick="generateFermi()" class="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm transition-colors">Generate Fermi Exercise</button></div></div>
    <div id="ai-content-socratic" class="hidden">
      <div id="socratic-messages" class="space-y-3 mb-4">
        <div class="text-sm text-emerald-400/70 text-center py-8">Ask a question — I'll guide you to the answer</div>
      </div>
    </div>
  </div>

  <!-- Chat input (visible only on chat tab) -->
  <div id="chat-input-bar" class="border-t border-border p-3">
    <div class="flex gap-2">
      <input id="chat-input" type="text" placeholder="Ask about this document..." class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand/50 transition-colors" onkeydown="if(event.key==='Enter')sendChat()">
      <button onclick="currentAITab==='socratic'?sendSocratic():sendChat()" class="px-3 py-2 bg-brand hover:bg-brand/80 text-white rounded-lg text-sm transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </div>
  </div>
</div>

<!-- Keyboard shortcuts help modal -->
<div id="shortcuts-modal" class="hidden fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4" onclick="if(event.target===this)this.classList.add('hidden')">
  <div class="glass rounded-2xl w-full max-w-md shadow-2xl border border-white/10 overflow-hidden p-6 fade-in">
    <h2 class="text-lg font-bold text-white mb-4">Keyboard Shortcuts</h2>
    <div class="space-y-2 text-sm">
      <div class="flex justify-between"><span class="text-gray-400">Scroll down / up</span><span class="text-gray-300"><kbd class="px-1.5 py-0.5 bg-white/10 rounded text-xs">j</kbd> / <kbd class="px-1.5 py-0.5 bg-white/10 rounded text-xs">k</kbd></span></div>
      <div class="flex justify-between"><span class="text-gray-400">Toggle bookmark</span><kbd class="px-1.5 py-0.5 bg-white/10 rounded text-xs text-gray-300">b</kbd></div>
      <div class="flex justify-between"><span class="text-gray-400">Focus mode</span><kbd class="px-1.5 py-0.5 bg-white/10 rounded text-xs text-gray-300">f</kbd></div>
      <div class="flex justify-between"><span class="text-gray-400">Theme toggle</span><kbd class="px-1.5 py-0.5 bg-white/10 rounded text-xs text-gray-300">t</kbd></div>
      <div class="flex justify-between"><span class="text-gray-400">AI panel</span><kbd class="px-1.5 py-0.5 bg-white/10 rounded text-xs text-gray-300">a</kbd></div>
      <div class="flex justify-between"><span class="text-gray-400">Search</span><span class="text-gray-300"><kbd class="px-1.5 py-0.5 bg-white/10 rounded text-xs">Ctrl</kbd>+<kbd class="px-1.5 py-0.5 bg-white/10 rounded text-xs">K</kbd></span></div>
      <div class="flex justify-between"><span class="text-gray-400">Show shortcuts</span><kbd class="px-1.5 py-0.5 bg-white/10 rounded text-xs text-gray-300">?</kbd></div>
    </div>
    <button onclick="document.getElementById('shortcuts-modal').classList.add('hidden')" class="mt-6 w-full py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm text-gray-300 transition-colors">Close</button>
  </div>
</div>

<footer class="border-t border-border mt-16 py-6 text-center text-xs text-gray-600">
  ANKR Labs &middot; Documentation Portal
</footer>

<script>
const DOC_PATH = ${JSON.stringify(doc.path || '')};
const DOC_TITLE = ${JSON.stringify(doc.title || doc.fileName || '')};
const rawContent = ${JSON.stringify(doc.content || '')};
const contentEl = document.getElementById('doc-content');
const tocEl = document.getElementById('toc');

// ── Markdown Rendering ──
if (typeof marked !== 'undefined') {
  marked.setOptions({ gfm: true, breaks: false, headerIds: true });
  contentEl.innerHTML = marked.parse(rawContent);
} else {
  contentEl.innerHTML = '<pre style="white-space:pre-wrap">' + rawContent.replace(/</g,'&lt;') + '</pre>';
}

// ── Post-render: Callout blocks ──
contentEl.querySelectorAll('blockquote').forEach(bq => {
  const html = bq.innerHTML;
  const calloutMatch = html.match(/^\\s*<p>\\s*\\[!(NOTE|WARNING|TIP|IMPORTANT)\\]/i);
  if (calloutMatch) {
    const type = calloutMatch[1].toLowerCase();
    const icons = { note: '\u2139\uFE0F', warning: '\u26A0\uFE0F', tip: '\uD83D\uDCA1', important: '\u2757' };
    const div = document.createElement('div');
    div.className = 'callout callout-' + type;
    div.innerHTML = '<span class="callout-icon">' + (icons[type]||'') + '</span><div>' + html.replace(calloutMatch[0], '<p>') + '</div>';
    bq.replaceWith(div);
  }
});

// ── Post-render: Code blocks with copy + lang badge ──
contentEl.querySelectorAll('pre').forEach(pre => {
  const wrapper = document.createElement('div');
  wrapper.className = 'code-block-wrapper';
  const code = pre.querySelector('code');
  const lang = code ? (code.className.match(/language-(\\w+)/)||[])[1] || '' : '';
  pre.parentNode.insertBefore(wrapper, pre);
  wrapper.appendChild(pre);
  if (lang) {
    const badge = document.createElement('span');
    badge.className = 'code-lang-badge';
    badge.textContent = lang;
    wrapper.appendChild(badge);
  }
  const btn = document.createElement('button');
  btn.className = 'code-copy-btn';
  btn.textContent = 'Copy';
  btn.onclick = function() {
    navigator.clipboard.writeText(pre.textContent).then(() => { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy', 1500); });
  };
  wrapper.appendChild(btn);
});

// ── Post-render: Mermaid diagrams ──
if (typeof mermaid !== 'undefined') {
  mermaid.initialize({ startOnLoad: false, theme: 'dark' });
  contentEl.querySelectorAll('code.language-mermaid').forEach((code, i) => {
    const pre = code.parentElement;
    const div = document.createElement('div');
    div.className = 'mermaid';
    div.textContent = code.textContent;
    pre.replaceWith(div);
  });
  mermaid.run();
}

// ── Post-render: Prism syntax highlighting ──
if (typeof Prism !== 'undefined') {
  Prism.highlightAllUnder(contentEl);
}

// ── Build TOC ──
const headings = contentEl.querySelectorAll('h1, h2, h3');
headings.forEach((h, i) => {
  const id = 'heading-' + i;
  h.id = id;
  const level = parseInt(h.tagName[1]);
  const indent = level === 1 ? '' : level === 2 ? 'pl-2' : 'pl-4';
  const weight = level === 1 ? 'font-medium text-gray-300' : level === 2 ? 'text-gray-400' : 'text-gray-500';
  const a = document.createElement('a');
  a.href = '#' + id;
  a.className = indent + ' ' + weight + ' block py-0.5 hover:text-white transition-colors truncate';
  a.textContent = h.textContent;
  tocEl.appendChild(a);
});

// ── Reading Progress Bar ──
window.addEventListener('scroll', function() {
  const h = document.documentElement.scrollHeight - window.innerHeight;
  const pct = h > 0 ? Math.min((window.scrollY / h) * 100, 100) : 0;
  document.getElementById('reading-progress').style.width = pct + '%';
});

// ── Bookmark ──
let isBookmarked = false;
(function checkBookmark() {
  fetch('/api/bookmarks').then(r=>r.json()).then(bm => {
    isBookmarked = bm.some(b => b.path === DOC_PATH);
    updateBookmarkIcon();
  }).catch(()=>{});
})();
function updateBookmarkIcon() {
  const icon = document.getElementById('bookmark-icon');
  const btn = document.getElementById('bookmark-btn');
  if (isBookmarked) {
    icon.setAttribute('fill', '#f59e0b');
    icon.setAttribute('stroke', '#f59e0b');
    btn.classList.add('text-amber-400');
  } else {
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    btn.classList.remove('text-amber-400');
  }
}
function toggleBookmark() {
  if (isBookmarked) {
    fetch('/api/bookmarks?path=' + encodeURIComponent(DOC_PATH), { method: 'DELETE' }).then(() => {
      isBookmarked = false; updateBookmarkIcon();
    });
  } else {
    fetch('/api/bookmarks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: DOC_PATH, name: DOC_TITLE }) }).then(() => {
      isBookmarked = true; updateBookmarkIcon();
    });
  }
}

// ── Focus Mode ──
let focusMode = false;
function toggleFocusMode() {
  focusMode = !focusMode;
  const sidebar = document.getElementById('doc-sidebar');
  const article = document.getElementById('article-content');
  const nav = document.querySelector('nav.sticky');
  const main = document.getElementById('main-content');
  if (focusMode) {
    if (sidebar) sidebar.style.display = 'none';
    if (nav) nav.style.display = 'none';
    main.style.maxWidth = '900px';
    article.style.fontSize = '1.05rem';
    document.getElementById('reading-progress').style.top = '0';
  } else {
    if (sidebar) sidebar.style.display = '';
    if (nav) nav.style.display = '';
    main.style.maxWidth = '';
    article.style.fontSize = '';
    document.getElementById('reading-progress').style.top = '3.5rem';
  }
}

// ── Theme Toggle ──
function toggleTheme() {
  const html = document.documentElement;
  const current = html.className === 'light' ? 'light' : 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  html.className = next;
  localStorage.setItem('ankr-theme', next);
}

// ── AI Panel ──
let aiPanelOpen = false;
let currentAITab = 'chat';
const chatHistory = [];

function toggleAIPanel() {
  aiPanelOpen = !aiPanelOpen;
  const panel = document.getElementById('ai-panel');
  const main = document.getElementById('main-content');
  if (aiPanelOpen) {
    panel.classList.remove('hidden');
    main.style.marginRight = '24rem';
  } else {
    panel.classList.add('hidden');
    main.style.marginRight = '';
  }
}

function switchAITab(tab) {
  currentAITab = tab;
  document.querySelectorAll('.ai-tab').forEach(t => {
    t.classList.remove('border-brand', 'text-brand', 'border-amber-500', 'text-amber-400', 'border-emerald-500', 'text-emerald-400');
    t.classList.add('border-transparent', 'text-gray-500');
  });
  const active = document.querySelector('.ai-tab[data-tab="'+tab+'"]');
  if (active) {
    if (tab === 'fermi') { active.classList.add('border-amber-500', 'text-amber-400'); }
    else if (tab === 'socratic') { active.classList.add('border-emerald-500', 'text-emerald-400'); }
    else { active.classList.add('border-brand', 'text-brand'); }
    active.classList.remove('border-transparent', 'text-gray-500');
  }
  document.querySelectorAll('[id^="ai-content-"]').forEach(el => el.classList.add('hidden'));
  const content = document.getElementById('ai-content-' + tab);
  if (content) content.classList.remove('hidden');
  document.getElementById('chat-input-bar').style.display = (tab === 'chat' || tab === 'socratic') ? '' : 'none';
  // Update input placeholder for socratic vs chat
  var chatInput = document.getElementById('chat-input');
  if (tab === 'socratic') {
    chatInput.placeholder = 'Ask a question — Socratic mode...';
    chatInput.onkeydown = function(event) { if(event.key==='Enter') sendSocratic(); };
  } else {
    chatInput.placeholder = 'Ask about this document...';
    chatInput.onkeydown = function(event) { if(event.key==='Enter') sendChat(); };
  }
}

function aiLoading(container) {
  container.innerHTML = '<div class="flex items-center gap-2 py-4 justify-center"><div class="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin"></div><span class="text-sm text-gray-500">Thinking...</span></div>';
}

// ── Chat ──
async function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  const messagesEl = document.getElementById('chat-messages');
  messagesEl.innerHTML += '<div class="flex justify-end"><div class="bg-brand/20 text-brand rounded-lg px-3 py-2 text-sm max-w-[80%]">' + escHtml(msg) + '</div></div>';
  messagesEl.innerHTML += '<div id="chat-loading" class="flex items-center gap-2"><div class="w-3 h-3 border-2 border-brand border-t-transparent rounded-full animate-spin"></div><span class="text-xs text-gray-500">Thinking...</span></div>';
  messagesEl.scrollTop = messagesEl.scrollHeight;
  chatHistory.push({ role: 'user', content: msg });
  try {
    const resp = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: DOC_PATH, message: msg, history: chatHistory.slice(-10) }) });
    const data = await resp.json();
    const reply = data.reply || data.error || 'No response';
    chatHistory.push({ role: 'assistant', content: reply });
    const loading = document.getElementById('chat-loading');
    if (loading) loading.remove();
    const rendered = typeof marked !== 'undefined' ? marked.parse(reply) : escHtml(reply);
    messagesEl.innerHTML += '<div class="bg-white/5 rounded-lg px-3 py-2 text-sm doc-content">' + rendered + '</div>';
    messagesEl.scrollTop = messagesEl.scrollHeight;
  } catch(e) {
    const loading = document.getElementById('chat-loading');
    if (loading) loading.remove();
    messagesEl.innerHTML += '<div class="text-red-400 text-sm">Error: ' + escHtml(e.message) + '</div>';
  }
}

// ── Summary ──
async function generateSummary() {
  const el = document.getElementById('ai-content-summary');
  aiLoading(el);
  try {
    const resp = await fetch('/api/ai/summarize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: DOC_PATH }) });
    const data = await resp.json();
    const rendered = typeof marked !== 'undefined' ? marked.parse(data.summary || 'No summary generated') : escHtml(data.summary || '');
    el.innerHTML = '<div class="doc-content text-sm">' + rendered + '</div>';
  } catch(e) { el.innerHTML = '<div class="text-red-400 text-sm">Error generating summary</div>'; }
}

// ── Key Points ──
async function generateKeypoints() {
  const el = document.getElementById('ai-content-keypoints');
  aiLoading(el);
  try {
    const resp = await fetch('/api/ai/keypoints', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: DOC_PATH }) });
    const data = await resp.json();
    const rendered = typeof marked !== 'undefined' ? marked.parse(data.keypoints || 'No key points extracted') : escHtml(data.keypoints || '');
    el.innerHTML = '<div class="doc-content text-sm">' + rendered + '</div>';
  } catch(e) { el.innerHTML = '<div class="text-red-400 text-sm">Error extracting key points</div>'; }
}

// ── Quiz ──
let quizScore = 0;
let quizTotal = 0;
async function generateQuiz() {
  const el = document.getElementById('ai-content-quiz');
  aiLoading(el);
  quizScore = 0; quizTotal = 0;
  try {
    const resp = await fetch('/api/ai/quiz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: DOC_PATH, count: 5 }) });
    const data = await resp.json();
    const questions = data.questions || [];
    if (questions.length === 0) { el.innerHTML = '<div class="text-gray-500 text-sm">Could not generate quiz</div>'; return; }
    quizTotal = questions.length;
    let html = '<div id="quiz-score" class="text-sm text-gray-400 mb-3">Score: 0/' + quizTotal + '</div>';
    questions.forEach((q, qi) => {
      html += '<div class="mb-4 p-3 rounded-lg bg-white/5 border border-white/5">';
      html += '<div class="font-medium text-sm mb-2 text-gray-200">' + (qi+1) + '. ' + escHtml(q.question) + '</div>';
      const opts = q.options || {};
      for (const [key, val] of Object.entries(opts)) {
        html += '<button onclick="checkQuizAnswer(this,\\'' + key + '\\',\\'' + (q.answer||'').replace(/'/g,"\\\\'") + '\\','+qi+')" class="block w-full text-left px-3 py-1.5 rounded text-sm my-1 bg-white/5 hover:bg-white/10 text-gray-300 transition-colors quiz-opt-'+qi+'" data-key="'+key+'">';
        html += '<span class="font-medium text-brand mr-2">' + key.toUpperCase() + '.</span>' + escHtml(val);
        html += '</button>';
      }
      html += '<div id="quiz-explanation-'+qi+'" class="hidden text-xs text-gray-500 mt-2 p-2 bg-white/[0.02] rounded"></div>';
      html += '</div>';
    });
    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<div class="text-red-400 text-sm">Error generating quiz</div>'; }
}
function checkQuizAnswer(btn, selected, correct, qi) {
  const allOpts = document.querySelectorAll('.quiz-opt-' + qi);
  allOpts.forEach(o => {
    o.disabled = true;
    o.style.pointerEvents = 'none';
    if (o.dataset.key === correct) { o.classList.add('bg-emerald-500/20'); o.classList.remove('bg-white/5'); }
    else if (o === btn && selected !== correct) { o.classList.add('bg-red-500/20'); o.classList.remove('bg-white/5'); }
  });
  if (selected === correct) quizScore++;
  document.getElementById('quiz-score').textContent = 'Score: ' + quizScore + '/' + quizTotal;
  const expl = document.getElementById('quiz-explanation-' + qi);
  if (expl) { expl.classList.remove('hidden'); expl.textContent = selected === correct ? 'Correct!' : 'Incorrect. The answer is ' + correct.toUpperCase() + '.'; }
}

// ── Flashcards ──
let flashcards = [];
let currentCard = 0;
async function generateFlashcards() {
  const el = document.getElementById('ai-content-flashcards');
  aiLoading(el);
  try {
    const resp = await fetch('/api/ai/flashcards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: DOC_PATH, count: 8 }) });
    const data = await resp.json();
    flashcards = data.flashcards || [];
    if (flashcards.length === 0) { el.innerHTML = '<div class="text-gray-500 text-sm">Could not generate flashcards</div>'; return; }
    currentCard = 0;
    renderFlashcard(el);
  } catch(e) { el.innerHTML = '<div class="text-red-400 text-sm">Error generating flashcards</div>'; }
}
function renderFlashcard(el) {
  if (!el) el = document.getElementById('ai-content-flashcards');
  const card = flashcards[currentCard];
  el.innerHTML = '<div class="text-xs text-gray-500 mb-2 text-center">' + (currentCard+1) + ' / ' + flashcards.length + '</div>'
    + '<div class="flashcard" onclick="this.classList.toggle(\\\'flipped\\\')">'
    + '<div class="flashcard-inner">'
    + '<div class="flashcard-front"><div class="text-sm text-gray-200">' + escHtml(card.front) + '</div></div>'
    + '<div class="flashcard-back"><div class="text-sm">' + escHtml(card.back) + '</div></div>'
    + '</div></div>'
    + '<div class="flex justify-center gap-3 mt-4">'
    + '<button onclick="prevFlashcard()" class="px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded text-sm text-gray-300 transition-colors">&larr; Prev</button>'
    + '<button onclick="nextFlashcard()" class="px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded text-sm text-gray-300 transition-colors">Next &rarr;</button>'
    + '</div>'
    + '<div class="text-xs text-gray-600 text-center mt-2">Click card to flip</div>';
}
function nextFlashcard() { currentCard = (currentCard + 1) % flashcards.length; renderFlashcard(); }
function prevFlashcard() { currentCard = (currentCard - 1 + flashcards.length) % flashcards.length; renderFlashcard(); }

// ── Mind Map ──
async function generateMindmap() {
  const el = document.getElementById('ai-content-mindmap');
  aiLoading(el);
  try {
    const resp = await fetch('/api/ai/mindmap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: DOC_PATH }) });
    const data = await resp.json();
    if (!data.mindmap) { el.innerHTML = '<div class="text-gray-500 text-sm">Could not generate mind map</div>'; return; }
    el.innerHTML = '<div class="text-sm">' + renderMindmapNode(data.mindmap, 0) + '</div>';
  } catch(e) { el.innerHTML = '<div class="text-red-400 text-sm">Error generating mind map</div>'; }
}
function renderMindmapNode(node, depth) {
  if (!node) return '';
  const hasChildren = node.children && node.children.length > 0;
  const colors = ['text-brand', 'text-emerald-400', 'text-amber-400', 'text-cyan-400', 'text-pink-400'];
  const color = colors[depth % colors.length];
  let html = '<div class="mindmap-node">';
  html += '<span class="mindmap-toggle" onclick="this.parentElement.querySelector(\\'.mindmap-children\\')&&this.parentElement.querySelector(\\'.mindmap-children\\').classList.toggle(\\'.hidden\\')">' + (hasChildren ? '\u25BC' : '\u2022') + '</span>';
  html += '<span class="mindmap-label ' + color + ' font-medium">' + escHtml(node.label) + '</span>';
  if (hasChildren) {
    html += '<div class="mindmap-children">';
    for (const child of node.children) {
      html += renderMindmapNode(child, depth + 1);
    }
    html += '</div>';
  }
  html += '</div>';
  return html;
}

// ── Fermi Estimation ──
async function generateFermi() {
  const el = document.getElementById('ai-content-fermi');
  aiLoading(el);
  try {
    const resp = await fetch('/api/ai/fermi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: DOC_PATH }) });
    const data = await resp.json();
    const fermi = data.fermi;
    if (!fermi) { el.innerHTML = '<div class="text-gray-500 text-sm">' + (data.raw ? '<div class="doc-content text-sm">' + (typeof marked !== 'undefined' ? marked.parse(data.raw) : escHtml(data.raw)) + '</div>' : 'Could not generate Fermi exercise') + '</div>'; return; }
    let html = '<div class="space-y-3">';
    html += '<div class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"><div class="font-semibold text-amber-300 text-sm mb-1">Fermi Question</div><div class="text-sm text-gray-200">' + escHtml(fermi.question) + '</div></div>';
    html += '<div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-3 mb-1">Estimation Steps</div>';
    (fermi.steps || []).forEach(function(s, i) {
      html += '<details class="group"><summary class="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors">';
      html += '<span class="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-bold">' + (i+1) + '</span>';
      html += '<span class="text-gray-200">' + escHtml(s.step) + '</span>';
      html += '<svg class="ml-auto w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>';
      html += '</summary>';
      html += '<div class="ml-7 mt-1 mb-2 text-xs space-y-1">';
      if (s.estimate) html += '<div class="text-amber-300 font-medium">Estimate: ' + escHtml(s.estimate) + '</div>';
      if (s.reasoning) html += '<div class="text-gray-400">' + escHtml(s.reasoning) + '</div>';
      html += '</div></details>';
    });
    if (fermi.finalAnswer) {
      html += '<div class="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mt-2"><div class="text-xs font-semibold text-emerald-400 mb-1">Final Answer</div><div class="text-sm text-gray-200">' + escHtml(fermi.finalAnswer) + '</div></div>';
    }
    if (fermi.realWorldConnection) {
      html += '<div class="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mt-2"><div class="text-xs font-semibold text-blue-400 mb-1">Real-World Connection</div><div class="text-sm text-gray-300">' + escHtml(fermi.realWorldConnection) + '</div></div>';
    }
    html += '</div>';
    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<div class="text-red-400 text-sm">Error generating Fermi exercise</div>'; }
}

// ── Socratic Dialog ──
const socraticHistory = [];
async function sendSocratic() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  const messagesEl = document.getElementById('socratic-messages');
  messagesEl.innerHTML += '<div class="flex justify-end"><div class="bg-emerald-500/20 text-emerald-300 rounded-lg px-3 py-2 text-sm max-w-[80%]">' + escHtml(msg) + '</div></div>';
  messagesEl.innerHTML += '<div id="socratic-loading" class="flex items-center gap-2"><div class="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div><span class="text-xs text-gray-500">Thinking...</span></div>';
  messagesEl.scrollTop = messagesEl.scrollHeight;
  socraticHistory.push({ role: 'user', content: msg });
  try {
    const resp = await fetch('/api/ai/socratic', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: DOC_PATH, message: msg, history: socraticHistory.slice(-10) }) });
    const data = await resp.json();
    const reply = data.reply || data.error || 'No response';
    socraticHistory.push({ role: 'assistant', content: reply });
    const loading = document.getElementById('socratic-loading');
    if (loading) loading.remove();
    const rendered = typeof marked !== 'undefined' ? marked.parse(reply) : escHtml(reply);
    messagesEl.innerHTML += '<div class="bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-2 text-sm doc-content">' + rendered + '</div>';
    messagesEl.scrollTop = messagesEl.scrollHeight;
  } catch(e) {
    const loading = document.getElementById('socratic-loading');
    if (loading) loading.remove();
    messagesEl.innerHTML += '<div class="text-red-400 text-sm">Error: ' + escHtml(e.message) + '</div>';
  }
}

// ── Backlinks ──
(function loadBacklinks() {
  fetch('/api/backlinks?path=' + encodeURIComponent(DOC_PATH)).then(r=>r.json()).then(data => {
    const el = document.getElementById('backlinks-list');
    if (!data.backlinks || data.backlinks.length === 0) {
      el.innerHTML = '<span class="text-xs text-gray-600">No backlinks found</span>';
      return;
    }
    el.innerHTML = data.backlinks.map(bl =>
      '<a href="/view/' + encodeURIComponent(bl.path) + '" class="block p-2 rounded hover:bg-white/[0.04] transition-colors">'
      + '<div class="text-sm text-gray-300 font-medium truncate">' + escHtml(bl.title) + '</div>'
      + '<div class="text-xs text-gray-600 truncate">' + escHtml(bl.excerpt) + '</div>'
      + '</a>'
    ).join('');
  }).catch(()=>{
    document.getElementById('backlinks-list').innerHTML = '<span class="text-xs text-gray-600">Could not load</span>';
  });
})();

// ── Keyboard Shortcuts ──
document.addEventListener('keydown', function(e) {
  // Skip if in input or textarea
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
  // Ctrl+K already handled by search modal
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') return;
  switch(e.key) {
    case 'j': window.scrollBy(0, 100); e.preventDefault(); break;
    case 'k': window.scrollBy(0, -100); e.preventDefault(); break;
    case 'b': toggleBookmark(); e.preventDefault(); break;
    case 'f': toggleFocusMode(); e.preventDefault(); break;
    case 't': toggleTheme(); e.preventDefault(); break;
    case 'a': toggleAIPanel(); e.preventDefault(); break;
    case '?': document.getElementById('shortcuts-modal').classList.toggle('hidden'); e.preventDefault(); break;
  }
});

// ── HTML escape helper ──
function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Admin toggle functions ──
function getAdminKey() {
  return new URLSearchParams(window.location.search).get('_admin') || '';
}
function toggleHide() {
  const key = getAdminKey();
  if (!key) return alert('Admin key required (?_admin=key)');
  const btn = document.getElementById('hide-btn');
  const isCurrentlyHidden = btn.textContent.trim().startsWith('Hidden');
  fetch('/api/admin/hide', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-ankr-admin': key },
    body: JSON.stringify({ path: DOC_PATH, hidden: !isCurrentlyHidden })
  }).then(r => r.json()).then(d => {
    if (d.success) {
      btn.textContent = d.hidden ? 'Hidden from public' : 'Visible to public';
      btn.className = 'px-2 py-1 rounded hover:opacity-80 transition-opacity ' + (d.hidden ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400');
    }
  });
}
function toggleDownload() {
  const key = getAdminKey();
  if (!key) return alert('Admin key required (?_admin=key)');
  const btn = document.getElementById('dl-btn');
  const isCurrentlyAllowed = btn.textContent.trim().startsWith('Download allowed');
  fetch('/api/admin/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-ankr-admin': key },
    body: JSON.stringify({ path: DOC_PATH, downloadable: !isCurrentlyAllowed })
  }).then(r => r.json()).then(d => {
    if (d.success) {
      btn.textContent = d.downloadable ? 'Download allowed' : 'Download blocked';
      btn.className = 'px-2 py-1 rounded hover:opacity-80 transition-opacity ' + (d.downloadable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400');
    }
  });
}

// ── Track recent file ──
fetch('/api/recent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: DOC_PATH, name: DOC_TITLE }) }).catch(()=>{});
</script>
</body></html>`;
}

// ============================================
// PAGE: Pratham Showcase (/project/documents/pratham/_showcase)
// ============================================
function prathamShowcasePage(files, book) {
  files = files || [];
  book = book || {};
  const fileCount = files.length;

  const docOptions = files.map(f =>
    `<option value="${esc(f.path)}">${esc(f.title)}</option>`
  ).join('');

  const docGrid = files.map(f => `
    <a href="/view/${encodeURIComponent(f.path)}" class="glass rounded-lg p-4 hover:bg-white/[0.03] border border-border hover:border-white/15 transition-all block">
      <div class="flex items-start gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" class="flex-shrink-0 mt-0.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
        <div class="min-w-0">
          <div class="text-sm font-medium text-gray-200 truncate">${esc(f.title)}</div>
          <div class="text-xs text-gray-600 mt-1">${f.size ? (f.size / 1024).toFixed(1) + ' KB' : ''}</div>
        </div>
      </div>
    </a>
  `).join('');

  return htmlHead('Pratham QA Book \u00D7 ANKR AI Tutor') + `
<body class="min-h-screen">
${navbar()}
${searchModal()}

<main class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
  <!-- Hero Section: Book Focus -->
  <div class="mb-12">
    <div class="glass rounded-2xl border border-brand/20 overflow-hidden">
      <div class="flex flex-col md:flex-row">
        <!-- Book Cover -->
        <div class="md:w-64 flex-shrink-0 bg-gradient-to-br from-brand/10 to-amber-500/10 flex items-center justify-center p-8">
          ${book.thumbnailUrl
            ? `<img src="${esc(book.thumbnailUrl)}" alt="Book Cover" class="w-44 rounded-lg shadow-2xl border border-white/10" onerror="this.parentElement.innerHTML='<div class=\\'w-44 h-56 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-6xl\\'>\\uD83D\\uDCD8</div>'">`
            : '<div class="w-44 h-56 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-6xl">\\uD83D\\uDCD8</div>'}
        </div>
        <!-- Book Details -->
        <div class="flex-1 p-6 sm:p-8">
          <div class="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full mb-3">Chunked &amp; Vectorized \u2022 RAG-Ready</div>
          <h1 class="text-2xl sm:text-3xl font-bold text-white mb-2">${esc(book.title || 'Quantitative Aptitude')}</h1>
          <p class="text-gray-400 mb-4">${esc(book.subtitle || 'For Undergraduate Entrance Exams')}</p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div><div class="text-xl font-bold text-white">${book.pages || 268}</div><div class="text-gray-500 text-xs">Pages</div></div>
            <div><div class="text-xl font-bold text-white">~${book.wordCount ? Math.round(book.wordCount / 1000) + 'K' : '85K'}</div><div class="text-gray-500 text-xs">Words</div></div>
            <div><div class="text-xl font-bold text-white">16</div><div class="text-gray-500 text-xs">Chapters</div></div>
            <div><div class="text-xl font-bold text-white">8</div><div class="text-gray-500 text-xs">AI Modes</div></div>
          </div>
          <div class="flex flex-wrap gap-3 text-xs text-gray-400">
            <span class="bg-white/5 px-2.5 py-1 rounded-full">ISBN: ${esc(book.isbn || '978-81-19992-59-1')}</span>
            <span class="bg-white/5 px-2.5 py-1 rounded-full">${esc(book.publisher || 'PRATHAM Test Prep')}</span>
            <span class="bg-white/5 px-2.5 py-1 rounded-full">${book.editions || 17} Editions (${esc(book.editionRange || '2009\u20132025')})</span>
            <span class="bg-white/5 px-2.5 py-1 rounded-full">${esc(book.sizeMB || '4.8')} MB PDF</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- RAG Pipeline Visualization -->
  <div class="mb-10">
    <h2 class="text-lg font-bold text-white mb-4">RAG Pipeline: How the Book Was Processed</h2>
    <div class="glass rounded-xl p-5 border border-white/10">
      <div class="flex flex-wrap items-center justify-center gap-2 text-sm">
        <div class="bg-blue-500/15 text-blue-400 px-4 py-2.5 rounded-lg font-medium text-center">
          <div class="text-lg mb-0.5">\uD83D\uDCD6</div>PDF Upload<div class="text-[10px] text-blue-400/60 mt-0.5">${book.pages || 268} pages</div>
        </div>
        <svg width="24" height="16" viewBox="0 0 24 16" fill="none" class="text-gray-600 flex-shrink-0"><path d="M2 8h18m0 0l-4-4m4 4l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="bg-purple-500/15 text-purple-400 px-4 py-2.5 rounded-lg font-medium text-center">
          <div class="text-lg mb-0.5">\u2702\uFE0F</div>Text Chunking<div class="text-[10px] text-purple-400/60 mt-0.5">${book.chunking ? book.chunking.chunkSize : 2000} chars / ${book.chunking ? book.chunking.overlap : 200} overlap</div>
        </div>
        <svg width="24" height="16" viewBox="0 0 24 16" fill="none" class="text-gray-600 flex-shrink-0"><path d="M2 8h18m0 0l-4-4m4 4l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="bg-amber-500/15 text-amber-400 px-4 py-2.5 rounded-lg font-medium text-center">
          <div class="text-lg mb-0.5">\uD83E\uDDE0</div>Embeddings<div class="text-[10px] text-amber-400/60 mt-0.5">${esc((book.chunking && book.chunking.model) || 'nomic-embed-text')}</div>
        </div>
        <svg width="24" height="16" viewBox="0 0 24 16" fill="none" class="text-gray-600 flex-shrink-0"><path d="M2 8h18m0 0l-4-4m4 4l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="bg-emerald-500/15 text-emerald-400 px-4 py-2.5 rounded-lg font-medium text-center">
          <div class="text-lg mb-0.5">\uD83D\uDDC4\uFE0F</div>pgvector Store<div class="text-[10px] text-emerald-400/60 mt-0.5">PostgreSQL + vector</div>
        </div>
        <svg width="24" height="16" viewBox="0 0 24 16" fill="none" class="text-gray-600 flex-shrink-0"><path d="M2 8h18m0 0l-4-4m4 4l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="bg-brand/15 text-brand px-4 py-2.5 rounded-lg font-medium text-center">
          <div class="text-lg mb-0.5">\uD83E\uDD16</div>AI Tutor<div class="text-[10px] text-brand/60 mt-0.5">8 modes ready</div>
        </div>
      </div>
    </div>
  </div>

  <!-- BOOK INTELLIGENCE: AI-extracted analytics the publisher never computed -->
  <div class="mb-10">
    <h2 class="text-lg font-bold text-white mb-1 flex items-center gap-2">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
      Book Intelligence \u2014 AI-Extracted Analytics
    </h2>
    <p class="text-xs text-gray-500 mb-4">Our AI read every page. Here's what it discovered \u2014 insights the publisher may never have quantified.</p>

    <!-- Key metrics row -->
    ${book.analytics ? `<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      <div class="glass rounded-xl p-4 border border-amber-500/20 text-center">
        <div class="text-2xl font-bold text-amber-400">${book.analytics.formulaCount.toLocaleString()}</div>
        <div class="text-[10px] text-gray-500 mt-1">Formulas &amp; Equations</div>
      </div>
      <div class="glass rounded-xl p-4 border border-purple-500/20 text-center">
        <div class="text-2xl font-bold text-purple-400">${book.analytics.exampleCount}</div>
        <div class="text-[10px] text-gray-500 mt-1">Worked Examples</div>
      </div>
      <div class="glass rounded-xl p-4 border border-emerald-500/20 text-center">
        <div class="text-2xl font-bold text-emerald-400">${book.analytics.solutionCount}</div>
        <div class="text-[10px] text-gray-500 mt-1">Full Solutions</div>
      </div>
      <div class="glass rounded-xl p-4 border border-cyan-500/20 text-center">
        <div class="text-2xl font-bold text-cyan-400">${book.analytics.edgeTips}</div>
        <div class="text-[10px] text-gray-500 mt-1">PRATHAM EDGE Tips</div>
      </div>
      <div class="glass rounded-xl p-4 border border-pink-500/20 text-center">
        <div class="text-2xl font-bold text-pink-400">${book.analytics.shortcutCount}</div>
        <div class="text-[10px] text-gray-500 mt-1">Shortcuts &amp; Tricks</div>
      </div>
      <div class="glass rounded-xl p-4 border border-blue-500/20 text-center">
        <div class="text-2xl font-bold text-blue-400">${book.analytics.chapterCount}</div>
        <div class="text-[10px] text-gray-500 mt-1">Chapters Detected</div>
      </div>
    </div>` : ''}

    <!-- Topic density heatmap -->
    ${book.analytics ? `<div class="glass rounded-xl p-5 border border-white/10 mb-6">
      <h3 class="text-sm font-semibold text-white mb-3">Topic Coverage Density</h3>
      <p class="text-[10px] text-gray-600 mb-3">Bar width = relative keyword density across the full ${(book.wordCount / 1000).toFixed(0)}K-word text. Wider = more coverage.</p>
      <div class="space-y-2">
        ${book.analytics.topicDistribution.slice(0, 12).map((t, i) => {
          const pct = Math.max(8, Math.round((t.mentions / book.analytics.maxMentions) * 100));
          const colors = ['bg-amber-500', 'bg-purple-500', 'bg-emerald-500', 'bg-blue-500', 'bg-pink-500', 'bg-cyan-500', 'bg-red-500', 'bg-orange-500', 'bg-violet-500', 'bg-teal-500', 'bg-lime-500', 'bg-rose-500'];
          return `<div class="flex items-center gap-2">
            <div class="w-28 sm:w-36 text-xs text-gray-400 text-right flex-shrink-0 truncate">${esc(t.name)}</div>
            <div class="flex-1 bg-white/5 rounded-full h-5 overflow-hidden">
              <div class="${colors[i % colors.length]}/30 h-full rounded-full flex items-center pl-2 transition-all" style="width:${pct}%">
                <span class="text-[10px] text-gray-300 font-medium">${t.mentions}</span>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}

    <!-- Cross-chapter connections -->
    ${book.analytics ? `<div class="glass rounded-xl p-5 border border-brand/20 mb-6">
      <h3 class="text-sm font-semibold text-white mb-1">Cross-Chapter Connections</h3>
      <p class="text-[10px] text-gray-600 mb-3">AI-discovered concept bridges between chapters. A student mastering one topic gains an advantage in the connected topic.</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        ${book.analytics.crossChapterConnections.map(c => {
          const color = c.strength === 'strong' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5';
          const dot = c.strength === 'strong' ? 'bg-emerald-500' : 'bg-amber-500';
          return `<div class="rounded-lg p-3 border ${color}">
            <div class="flex items-center gap-1.5 mb-1">
              <span class="w-1.5 h-1.5 rounded-full ${dot} flex-shrink-0"></span>
              <span class="text-xs font-medium text-gray-200">${esc(c.from)}</span>
              <svg width="12" height="8" viewBox="0 0 12 8" class="text-gray-600 flex-shrink-0"><path d="M1 4h9m0 0L7.5 1.5M10 4L7.5 6.5" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
              <span class="text-xs font-medium text-gray-200">${esc(c.to)}</span>
            </div>
            <div class="text-[10px] text-gray-500 ml-3">${esc(c.concept)}</div>
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}

    <!-- AI insight callout -->
    <div class="glass rounded-xl p-5 border border-amber-500/30 bg-amber-500/5">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-lg">&#x1F4A1;</div>
        <div>
          <div class="text-sm font-semibold text-amber-300 mb-1">AI Insight: The Hidden Study Path</div>
          <div class="text-xs text-gray-400 leading-relaxed">Chapters 3\u20135 (Percentage, Profit &amp; Loss, Interest) share 60%+ of their vocabulary. A student who masters Percentage first will find the next two chapters dramatically easier. Similarly, Chapters 18\u201319 (P&amp;C \u2192 Probability) are so tightly coupled that studying them together saves ~30% of learning time. The book's 82 PRATHAM EDGE tips are the highest-density learning shortcuts \u2014 just 4% of the content, but they encode decades of exam-solving patterns.</div>
        </div>
      </div>
    </div>
  </div>

  <!-- CONTENT INTEGRITY BADGE -->
  <div class="mb-10">
    <div class="glass rounded-2xl p-6 border border-emerald-500/20 bg-emerald-500/[0.03]">
      <div class="flex items-start gap-4">
        <div class="w-16 h-16 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M9 12l2 2 4-4"/><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/></svg>
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <h2 class="text-lg font-bold text-white">Content Integrity Guarantee</h2>
            <span class="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold rounded-full uppercase tracking-wider">Verified</span>
          </div>
          <p class="text-sm text-gray-300 mb-3">Every AI response from this platform is <strong class="text-white">grounded exclusively in your book's content</strong>. Our AI never fabricates answers, never pulls from external sources, and never adds information not present in the original ${book.pages || 268}-page textbook.</p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
              <span class="text-xs text-gray-300">Zero hallucination policy</span>
            </div>
            <div class="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
              <span class="text-xs text-gray-300">No external knowledge used</span>
            </div>
            <div class="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
              <span class="text-xs text-gray-300">All answers cite your content</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- PUBLISHER CONTENT QUALITY REPORT -->
  ${book.analytics ? `<div class="mb-10">
    <h2 class="text-lg font-bold text-white mb-1 flex items-center gap-2">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
      Publisher Content Quality Report
    </h2>
    <p class="text-xs text-gray-500 mb-4">AI-computed metrics that quantify the pedagogical density of your textbook — data no publisher has computed before.</p>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      <div class="glass rounded-xl p-4 border border-blue-500/20">
        <div class="text-3xl font-bold text-blue-400">${book.analytics.exampleToPageRatio}</div>
        <div class="text-xs text-gray-500 mt-1">Examples per Page</div>
        <div class="text-[10px] text-gray-600 mt-0.5">${book.analytics.exampleCount} examples across ${book.pages || 268} pages</div>
      </div>
      <div class="glass rounded-xl p-4 border border-amber-500/20">
        <div class="text-3xl font-bold text-amber-400">${book.analytics.formulaToPageRatio}</div>
        <div class="text-xs text-gray-500 mt-1">Formulas per Page</div>
        <div class="text-[10px] text-gray-600 mt-0.5">${book.analytics.formulaCount.toLocaleString()} formulas across ${book.pages || 268} pages</div>
      </div>
      <div class="glass rounded-xl p-4 border border-emerald-500/20">
        <div class="text-3xl font-bold text-emerald-400">${book.analytics.contentDensity}%</div>
        <div class="text-xs text-gray-500 mt-1">Content Density</div>
        <div class="text-[10px] text-gray-600 mt-0.5">Non-empty lines as % of total content</div>
      </div>
      <div class="glass rounded-xl p-4 border border-purple-500/20">
        <div class="text-3xl font-bold text-purple-400">${book.analytics.solutionCount}</div>
        <div class="text-xs text-gray-500 mt-1">Step-by-Step Solutions</div>
        <div class="text-[10px] text-gray-600 mt-0.5">Full worked-out solutions detected</div>
      </div>
    </div>

    <!-- Per-topic example density -->
    <div class="glass rounded-xl p-5 border border-white/10">
      <h3 class="text-sm font-semibold text-white mb-1">Examples per Topic — Where Your Book Teaches Hardest</h3>
      <p class="text-[10px] text-gray-600 mb-3">AI counted worked examples near each topic's keywords. Higher = more practice material for that concept.</p>
      <div class="space-y-2">
        ${(function() {
          const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500', 'bg-red-500', 'bg-orange-500'];
          const items = (book.analytics.topicExampleDensity || []).slice(0, 8);
          const maxEx = items[0] ? items[0].examples : 1;
          return items.map(function(t, i) {
            var pct = Math.max(8, Math.round((t.examples / (maxEx || 1)) * 100));
            return '<div class="flex items-center gap-2"><div class="w-32 sm:w-40 text-xs text-gray-400 text-right flex-shrink-0 truncate">' + esc(t.name) + '</div><div class="flex-1 bg-white/5 rounded-full h-5 overflow-hidden"><div class="' + colors[i % colors.length] + '/30 h-full rounded-full flex items-center pl-2 transition-all" style="width:' + pct + '%"><span class="text-[10px] text-gray-300 font-medium">' + t.examples + '</span></div></div></div>';
          }).join('');
        })()}
      </div>
    </div>
  </div>` : ''}

  <!-- PRATHAM EDGE TIP CATALOGUE -->
  ${book.analytics && book.analytics.edgeTipExtracts && book.analytics.edgeTipExtracts.length > 0 ? `<div class="mb-10">
    <h2 class="text-lg font-bold text-white mb-1 flex items-center gap-2">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      PRATHAM EDGE Tips — Your Signature Pedagogy
    </h2>
    <p class="text-xs text-gray-500 mb-4">These ${book.analytics.edgeTips} proprietary tips are what make your book unique. AI extracted them verbatim — here are actual examples from the textbook.</p>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      ${book.analytics.edgeTipExtracts.slice(0, 10).map(function(tip, i) {
        var display = tip.length > 200 ? tip.slice(0, 200) + '...' : tip;
        return '<div class="glass rounded-lg p-4 border border-amber-500/15 hover:border-amber-500/30 transition-colors"><div class="flex items-start gap-2"><div class="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5"><span class="text-amber-400 text-[10px] font-bold">' + (i + 1) + '</span></div><div class="text-xs text-gray-300 leading-relaxed">' + esc(display) + '</div></div></div>';
      }).join('')}
    </div>
    ${book.analytics.edgeTipExtracts.length > 10 ? '<div class="mt-3 text-center"><span class="text-xs text-gray-500">Showing 10 of ' + book.analytics.edgeTipExtracts.length + ' extracted tips</span><span class="text-xs text-amber-500/60 ml-2">\u2022 ' + book.analytics.edgeTips + ' total PRATHAM EDGE mentions in the book</span></div>' : ''}
  </div>` : ''}

  <!-- WHAT THIS MEANS FOR THE PUBLISHER -->
  <div class="mb-10">
    <div class="glass rounded-2xl p-6 border border-brand/20 bg-brand/[0.03]">
      <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
        What This Means For PRATHAM
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center text-brand text-sm">1</div>
            <h3 class="text-sm font-semibold text-white">One Book, Infinite Products</h3>
          </div>
          <p class="text-xs text-gray-400 leading-relaxed ml-10">Your ${book.pages || 268}-page textbook isn't just a PDF anymore. It becomes a quiz engine (generates ${book.analytics ? book.analytics.exampleCount + '+' : '300+'} questions), a flashcard deck, a mind-map generator, a Socratic tutor, and a Fermi estimation trainer. One upload, 8 AI products.</p>
        </div>
        <div>
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center text-brand text-sm">2</div>
            <h3 class="text-sm font-semibold text-white">Your IP Stays Protected</h3>
          </div>
          <p class="text-xs text-gray-400 leading-relaxed ml-10">The AI never exposes raw content — it synthesizes answers grounded in your material. Students get the learning, you retain the IP. No copy-paste, no piracy, no content leakage. Every answer cites "from your textbook."</p>
        </div>
        <div>
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center text-brand text-sm">3</div>
            <h3 class="text-sm font-semibold text-white">Scale to Thousands of Books</h3>
          </div>
          <p class="text-xs text-gray-400 leading-relaxed ml-10">This exact pipeline works for any PDF. Upload your entire catalogue — each book gets its own AI tutor, quiz engine, and analytics dashboard. The same 8 AI modes adapt automatically to any subject, any level.</p>
        </div>
        <div>
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center text-brand text-sm">4</div>
            <h3 class="text-sm font-semibold text-white">Insights You've Never Had</h3>
          </div>
          <p class="text-xs text-gray-400 leading-relaxed ml-10">17 editions, and you've never known that your book has ${book.analytics ? book.analytics.formulaCount.toLocaleString() : '1,700+'} formulas, ${book.analytics ? book.analytics.shortcutCount : '360+'} shortcuts, and that Chapters 3-5 share 60% vocabulary. Now you do — for every book in your catalogue.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- INTERACTIVE AI DEMO: Try it live on the real book -->
  <div class="glass rounded-2xl p-6 mb-10 border border-brand/20">
    <h2 class="text-lg font-bold text-white mb-1 flex items-center gap-2">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4v2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h2V6a4 4 0 0 1 4-4z"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/></svg>
      Try It Live \u2014 8 AI Modes on the Real Book
    </h2>
    <p class="text-xs text-gray-500 mb-4">Every response is generated live from the ${book.pages || 268}-page vectorized textbook. Not canned \u2014 real AI, real content.</p>
    <input type="hidden" id="showcase-doc" value="${esc(book.path || '_book/pratham-qa')}">

    <!-- Tab bar -->
    <div class="flex flex-wrap gap-1.5 mb-4 p-1.5 bg-white/[0.02] rounded-xl border border-white/5">
      <button onclick="showcaseTab(this,'summary')" class="sc-tab sc-tab-active px-3 py-2 rounded-lg text-xs font-medium transition-all">Summary</button>
      <button onclick="showcaseTab(this,'keypoints')" class="sc-tab px-3 py-2 rounded-lg text-xs font-medium transition-all">Key Points</button>
      <button onclick="showcaseTab(this,'quiz')" class="sc-tab px-3 py-2 rounded-lg text-xs font-medium transition-all">Quiz</button>
      <button onclick="showcaseTab(this,'flashcards')" class="sc-tab px-3 py-2 rounded-lg text-xs font-medium transition-all">Flashcards</button>
      <button onclick="showcaseTab(this,'mindmap')" class="sc-tab px-3 py-2 rounded-lg text-xs font-medium transition-all">Mind Map</button>
      <button onclick="showcaseTab(this,'fermi')" class="sc-tab px-3 py-2 rounded-lg text-xs font-medium transition-all">Fermi</button>
      <button onclick="showcaseTab(this,'socratic')" class="sc-tab px-3 py-2 rounded-lg text-xs font-medium transition-all">Socratic</button>
      <button onclick="showcaseTab(this,'chat')" class="sc-tab px-3 py-2 rounded-lg text-xs font-medium transition-all">Chat</button>
      <button onclick="showcaseTab(this,'study-guide')" class="sc-tab px-3 py-2 rounded-lg text-xs font-medium transition-all">Study Guide</button>
    </div>

    <!-- Mode description + suggested prompts -->
    <div id="showcase-mode-info" class="mb-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
      <div id="showcase-mode-desc" class="text-xs text-gray-400">Select a mode to generate AI content from the full QA textbook.</div>
      <div id="showcase-mode-prompts" class="flex flex-wrap gap-2 mt-2"></div>
    </div>

    <!-- Input area for conversational modes -->
    <div id="showcase-socratic-input" class="hidden mb-4">
      <div class="flex gap-2">
        <input id="showcase-socratic-msg" type="text" placeholder="e.g. How do I find the HCF of two numbers?" class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50 transition-colors" onkeydown="if(event.key==='Enter')showcaseSocratic()">
        <button onclick="showcaseSocratic()" class="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm transition-colors">Send</button>
      </div>
    </div>
    <div id="showcase-chat-input" class="hidden mb-4">
      <div class="flex gap-2">
        <input id="showcase-chat-msg" type="text" placeholder="e.g. Explain the compound interest shortcut..." class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand/50 transition-colors" onkeydown="if(event.key==='Enter')showcaseChat()">
        <button onclick="showcaseChat()" class="px-3 py-2 bg-brand hover:bg-brand/80 text-white rounded-lg text-sm transition-colors">Send</button>
      </div>
    </div>

    <!-- Results area -->
    <div id="showcase-results" class="min-h-[120px] max-h-[500px] overflow-y-auto rounded-lg bg-white/[0.02] border border-white/5 p-4">
      <div class="text-sm text-gray-600 text-center py-8">Select an AI mode above, then click a suggested prompt or type your own</div>
    </div>
    <div id="showcase-footer" class="text-[10px] text-gray-700 mt-2 text-center">Powered by RAG: PDF \u2192 chunks \u2192 vector embeddings \u2192 AI inference \u2022 Response generated live from ${(book.wordCount / 1000).toFixed(0)}K words</div>
  </div>

  <!-- What's Inside the Book -->
  <div class="mb-10">
    <h2 class="text-lg font-bold text-white mb-4">What's Inside the Book</h2>
    <div class="glass rounded-xl p-5 border border-white/10">
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
        <div class="text-center p-3 rounded-lg bg-white/[0.03]">
          <div class="text-2xl font-bold text-white">~${book.wordCount ? Math.round(book.wordCount / 1000) + 'K' : '85K'}</div>
          <div class="text-xs text-gray-500">Words Extracted</div>
        </div>
        <div class="text-center p-3 rounded-lg bg-white/[0.03]">
          <div class="text-2xl font-bold text-white">${(book.chapters || []).length || 16}</div>
          <div class="text-xs text-gray-500">Chapters Detected</div>
        </div>
        <div class="text-center p-3 rounded-lg bg-white/[0.03]">
          <div class="text-2xl font-bold text-white">${book.pages || 268}</div>
          <div class="text-xs text-gray-500">Pages Processed</div>
        </div>
      </div>
      ${(book.chapters || []).length > 0 ? `
      <details class="group mb-4">
        <summary class="cursor-pointer text-sm text-brand hover:text-brand/80 transition-colors font-medium">View ${(book.chapters || []).length} chapter headings \u25BE</summary>
        <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          ${(book.chapters || []).map((ch, i) => `
            <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] text-sm">
              <span class="flex-shrink-0 w-6 h-6 rounded bg-brand/20 text-brand text-xs flex items-center justify-center font-bold">${i + 1}</span>
              <span class="text-gray-300">${esc(ch)}</span>
            </div>
          `).join('')}
        </div>
      </details>` : ''}
      ${book.bookSample ? `
      <div class="mt-4">
        <div class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Content Preview</div>
        <div class="bg-white/[0.02] border border-white/5 rounded-lg p-4 text-sm text-gray-400 leading-relaxed font-mono max-h-32 overflow-hidden relative">
          ${esc(book.bookSample)}
          <div class="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#0a0a0f] to-transparent"></div>
        </div>
        <a href="/view/_book/pratham-qa" class="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-brand/20 hover:bg-brand/30 text-brand rounded-lg text-sm transition-colors font-medium">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          Open in AI Viewer
        </a>
      </div>` : ''}
    </div>
  </div>

  <!-- READ THE BOOK: Real-time book viewer -->
  ${book.hasPdf ? `<div class="mb-10">
    <h2 class="text-lg font-bold text-white mb-1 flex items-center gap-2">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
      Read the Book
    </h2>
    <p class="text-xs text-gray-500 mb-4">Browse the actual ${book.pages || 268}-page textbook in real-time. Switch between PDF view and extracted text view.</p>

    <div class="glass rounded-2xl border border-blue-500/20 overflow-hidden">
      <!-- Reader tab bar -->
      <div class="flex border-b border-white/10 bg-white/[0.02]">
        <button onclick="switchBookTab('pdf')" id="bookTabPdf" class="flex-1 px-4 py-3 text-sm font-medium text-brand border-b-2 border-brand transition-colors">PDF Viewer</button>
        <button onclick="switchBookTab('text')" id="bookTabText" class="flex-1 px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-300 transition-colors">Extracted Text</button>
      </div>

      <!-- PDF Viewer -->
      <div id="bookViewPdf" class="relative" style="height:600px">
        <iframe src="/api/pratham/book.pdf" class="w-full h-full border-0" title="Pratham QA Book PDF"></iframe>
      </div>

      <!-- Text Viewer (paginated) -->
      <div id="bookViewText" class="hidden">
        <div class="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/5">
          <button onclick="bookTextPrev()" id="bookTextPrevBtn" class="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" disabled>&larr; Previous</button>
          <span id="bookTextPageInfo" class="text-xs text-gray-500">Page 1</span>
          <button onclick="bookTextNext()" id="bookTextNextBtn" class="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-300 transition-colors">&rarr; Next</button>
        </div>
        <div id="bookTextContent" class="p-5 text-sm text-gray-300 leading-relaxed font-mono whitespace-pre-wrap max-h-[550px] overflow-y-auto">Loading...</div>
      </div>
    </div>
  </div>` : ''}

  <!-- 8 AI Learning Modes — Same Problem, 8 Approaches -->
  <div class="mb-10">
    <h2 class="text-lg font-bold text-white mb-2">8 AI Learning Modes</h2>
    <div class="glass rounded-lg p-4 border border-amber-500/20 mb-4">
      <div class="text-xs font-medium text-amber-400 uppercase tracking-wider mb-1">One Problem, Eight Approaches</div>
      <div class="text-sm text-gray-300">A sum of Rs 10,000 is invested at 10% per annum compound interest for 3 years. Find the amount.</div>
      <div class="text-xs text-gray-500 mt-1">See how each AI mode helps a student master this concept differently.</div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- 1. Summary -->
      <div class="glass rounded-xl p-4 border border-brand/20">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-7 h-7 rounded-lg bg-brand/20 flex items-center justify-center text-brand text-xs font-bold">1</div>
          <h3 class="font-semibold text-white text-sm">Summary</h3>
        </div>
        <p class="text-xs text-gray-500 mb-2">Condenses the chapter into key takeaways.</p>
        <div class="bg-white/[0.03] rounded-lg p-3 text-xs text-gray-300 leading-relaxed">Compound Interest compounds on previously accumulated interest. For P=10,000, R=10%, T=3: A = P(1+R/100)^T = 10,000 \u00D7 1.331 = Rs 13,310. CI = Rs 3,310.</div>
      </div>
      <!-- 2. Key Points -->
      <div class="glass rounded-xl p-4 border border-blue-500/20">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">2</div>
          <h3 class="font-semibold text-white text-sm">Key Points</h3>
        </div>
        <p class="text-xs text-gray-500 mb-2">Extracts the essential rules and formulas.</p>
        <div class="bg-white/[0.03] rounded-lg p-3 text-xs text-gray-300 leading-relaxed">1. CI formula: A = P(1 + R/100)^T<br>2. Year 1: 10,000 \u2192 11,000 (+1,000)<br>3. Year 2: 11,000 \u2192 12,100 (+1,100)<br>4. Year 3: 12,100 \u2192 13,310 (+1,210)<br>5. CI &gt; SI because interest earns interest</div>
      </div>
      <!-- 3. Quiz -->
      <div class="glass rounded-xl p-4 border border-purple-500/20">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold">3</div>
          <h3 class="font-semibold text-white text-sm">Quiz</h3>
        </div>
        <p class="text-xs text-gray-500 mb-2">Tests understanding with MCQs.</p>
        <div class="bg-white/[0.03] rounded-lg p-3 text-xs space-y-1">
          <div class="text-purple-300 font-medium">Q: CI on Rs 10,000 at 10% for 3 years is:</div>
          <div class="text-gray-400 ml-2">A. Rs 3,000 &nbsp; B. Rs 3,100 &nbsp; <span class="text-emerald-400 font-medium">C. Rs 3,310 \u2713</span> &nbsp; D. Rs 3,500</div>
          <div class="text-gray-600 text-[10px] mt-1">Explanation: A=10000\u00D7(1.1)^3=13310, CI=3310</div>
        </div>
      </div>
      <!-- 4. Flashcards -->
      <div class="glass rounded-xl p-4 border border-cyan-500/20">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold">4</div>
          <h3 class="font-semibold text-white text-sm">Flashcards</h3>
        </div>
        <p class="text-xs text-gray-500 mb-2">Rapid recall with front/back cards.</p>
        <div class="bg-white/[0.03] rounded-lg p-3 text-xs space-y-1.5">
          <div class="text-cyan-300 font-medium">Front: (1.1)^3 = ?</div>
          <div class="text-gray-400">Back: 1.331 \u2014 memorize this for 10% CI over 3 years. Amount = Principal \u00D7 1.331</div>
          <div class="text-gray-600 text-[10px]">Category: Compound Interest \u00B7 Difficulty: Medium</div>
        </div>
      </div>
      <!-- 5. Mind Map -->
      <div class="glass rounded-xl p-4 border border-pink-500/20">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-7 h-7 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 text-xs font-bold">5</div>
          <h3 class="font-semibold text-white text-sm">Mind Map</h3>
        </div>
        <p class="text-xs text-gray-500 mb-2">Visual hierarchy for connected concepts.</p>
        <div class="bg-white/[0.03] rounded-lg p-3 text-xs text-gray-300 font-mono leading-relaxed">\u2514\u2500 Interest<br>&nbsp; \u251C\u2500 Simple: SI = PRT/100<br>&nbsp; \u2514\u2500 Compound<br>&nbsp;&nbsp;&nbsp; \u251C\u2500 Formula: A=P(1+R/100)^T<br>&nbsp;&nbsp;&nbsp; \u251C\u2500 Year-by-year growth<br>&nbsp;&nbsp;&nbsp; \u2514\u2500 CI = A \u2212 P = 3,310</div>
      </div>
      <!-- 6. Fermi Estimation -->
      <div class="glass rounded-xl p-4 border border-amber-500/20">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">6</div>
          <h3 class="font-semibold text-white text-sm">Fermi Estimation</h3>
        </div>
        <p class="text-xs text-gray-500 mb-2">Real-world intuition from the same concept.</p>
        <div class="bg-white/[0.03] rounded-lg p-3 text-xs space-y-1">
          <div class="text-amber-300 font-medium">Q: If all 10 lakh CAT aspirants invest Rs 10,000 at 10% CI for 3 years, how much total interest is earned?</div>
          <div class="text-gray-400">Step 1: Each earns Rs 3,310 CI<br>Step 2: 10,00,000 \u00D7 3,310 = Rs 331 crore<br>Step 3: That's roughly the GDP of a small town!</div>
        </div>
      </div>
      <!-- 7. Socratic Dialog -->
      <div class="glass rounded-xl p-4 border border-emerald-500/20">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">7</div>
          <h3 class="font-semibold text-white text-sm">Socratic Dialog</h3>
        </div>
        <p class="text-xs text-gray-500 mb-2">Guides discovery \u2014 never gives answers directly.</p>
        <div class="bg-white/[0.03] rounded-lg p-3 text-xs space-y-1.5">
          <div class="text-emerald-300">Student: "How do I solve this CI problem?"</div>
          <div class="text-gray-400">AI: "After year 1, you have Rs 11,000. Now in year 2, what base do you calculate 10% on?"</div>
          <div class="text-emerald-300">Student: "On 11,000... so 1,100?"</div>
          <div class="text-gray-400">AI: "Yes! So after year 2 you have 12,100. Can you do year 3 the same way?"</div>
        </div>
      </div>
      <!-- 8. Chat -->
      <div class="glass rounded-xl p-4 border border-gray-500/20">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-7 h-7 rounded-lg bg-gray-500/20 flex items-center justify-center text-gray-300 text-xs font-bold">8</div>
          <h3 class="font-semibold text-white text-sm">Chat</h3>
        </div>
        <p class="text-xs text-gray-500 mb-2">Free-form Q&A grounded in the textbook.</p>
        <div class="bg-white/[0.03] rounded-lg p-3 text-xs space-y-1.5">
          <div class="text-gray-300">Q: "Why is CI more than SI for the same problem?"</div>
          <div class="text-gray-400">A: "SI on Rs 10,000 at 10% for 3 yrs = Rs 3,000. CI = Rs 3,310. The extra Rs 310 comes from earning interest on previous years' interest \u2014 that's the compounding effect."</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Book Topics (what's inside the QA book) -->
  <div class="mb-10">
    <h2 class="text-lg font-bold text-white mb-4">Topics Covered in the Book</h2>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      ${['Number System', 'HCF & LCM', 'Percentages', 'Profit & Loss', 'Simple & Compound Interest', 'Ratio & Proportion', 'Time & Work', 'Speed, Time & Distance', 'Algebra', 'Linear Equations', 'Quadratic Equations', 'Progressions (AP/GP)', 'Permutation & Combination', 'Probability', 'Geometry & Mensuration', 'Data Interpretation'].map(topic => `
        <div class="glass rounded-lg px-4 py-3 border border-white/5 hover:border-brand/20 transition-colors">
          <div class="text-sm text-gray-200">${topic}</div>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- Also: Supplementary Documents -->
  <div class="mb-10">
    <h2 class="text-lg font-bold text-white mb-2">Supplementary Documents</h2>
    <p class="text-xs text-gray-500 mb-4">${fileCount} Pratham project documents (demos, proposals, guides)</p>
    <details class="group">
      <summary class="cursor-pointer text-sm text-brand hover:text-brand/80 transition-colors mb-3">Show ${fileCount} documents \u25BE</summary>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
        ${docGrid || '<div class="col-span-full text-center text-gray-600 py-8">No documents found</div>'}
      </div>
    </details>
  </div>
</main>

<footer class="border-t border-border mt-16 py-6 text-center text-xs text-gray-600">
  ANKR Labs &middot; Pratham Test Prep QA Book \u00D7 AI Tutor Showcase
</footer>

<style>
.sc-tab { color: #666; background: transparent; }
.sc-tab:hover { color: #aaa; background: rgba(255,255,255,0.03); }
.sc-tab-active { color: #c4b5fd !important; background: rgba(124,58,237,0.15) !important; }
.sc-prompt-btn { cursor: pointer; transition: all 0.15s; }
.sc-prompt-btn:hover { background: rgba(124,58,237,0.2); border-color: rgba(124,58,237,0.4); }
</style>
<script>
var showcaseSocraticHistory = [];
var showcaseChatHistory = [];
var currentMode = 'summary';

var MODE_INFO = {
  summary: { desc: 'Generates a concise summary of the full textbook or any chapter.', prompts: ['Summarize the full book', 'Summarize the Interest chapter', 'Key themes across all 20 chapters'] },
  keypoints: { desc: 'Extracts 8\u201312 key takeaways as a structured list.', prompts: ['Key points from the book', 'Most important formulas', 'Critical exam shortcuts'] },
  quiz: { desc: 'Generates MCQ questions with explanations. Tests real understanding.', prompts: ['5 questions on Percentage', '5 questions across all topics', '5 hard questions on P&C'] },
  flashcards: { desc: 'Creates recall cards with category and difficulty tags.', prompts: ['8 flashcards on Interest', '8 formula flashcards', '8 cards on Number System'] },
  mindmap: { desc: 'Builds a hierarchical topic tree for visual study.', prompts: ['Mind map of the full book', 'Map for Algebra topics', 'Map connecting all 20 chapters'] },
  fermi: { desc: 'Creates a real-world estimation problem using concepts from the book.', prompts: ['Fermi problem on Interest', 'Estimation exercise on Probability', 'Real-world Speed & Distance'] },
  socratic: { desc: 'Guides you to the answer through questions. Never tells you directly.', prompts: ['How do I solve partnership problems?', 'Why is CI > SI for same rate?', 'When do I use P&C vs Probability?'] },
  chat: { desc: 'Ask anything about the textbook. AI retrieves relevant sections and answers.', prompts: ['What shortcuts does the book teach for %?', 'Compare all PRATHAM EDGE tips', 'How many types of problems are in Ch.1?'] },
  'study-guide': { desc: 'Generates a full study guide with objectives, key concepts, formulas, and review questions.', prompts: ['Study guide for Interest chapter', 'Full book study plan', 'Study guide for Probability'] },
};

function getSelectedDoc() {
  var sel = document.getElementById('showcase-doc');
  if (!sel || !sel.value) { alert('No document configured'); return null; }
  return sel.value;
}

function showcaseLoading() {
  document.getElementById('showcase-results').innerHTML = '<div class="flex flex-col items-center gap-2 py-8"><div class="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div><span class="text-sm text-gray-500">AI is reading the book and generating response...</span><span class="text-[10px] text-gray-700">Processing ~105K words via RAG pipeline</span></div>';
}

function showcaseTab(btn, mode) {
  currentMode = mode;
  // Update tab styling
  document.querySelectorAll('.sc-tab').forEach(function(t) { t.classList.remove('sc-tab-active'); });
  btn.classList.add('sc-tab-active');
  // Update mode info
  var info = MODE_INFO[mode] || {};
  document.getElementById('showcase-mode-desc').textContent = info.desc || '';
  // Render suggested prompts
  var promptsHtml = (info.prompts || []).map(function(p) {
    return '<button class="sc-prompt-btn px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-gray-400 hover:text-brand" onclick="runPrompt(\\'' + p.replace(/'/g, "\\\\'") + '\\')">' + p + '</button>';
  }).join('');
  document.getElementById('showcase-mode-prompts').innerHTML = promptsHtml;
  // Show/hide input areas
  document.getElementById('showcase-socratic-input').classList.add('hidden');
  document.getElementById('showcase-chat-input').classList.add('hidden');
  if (mode === 'socratic') { document.getElementById('showcase-socratic-input').classList.remove('hidden'); showcaseSocraticHistory = []; }
  if (mode === 'chat') { document.getElementById('showcase-chat-input').classList.remove('hidden'); showcaseChatHistory = []; }
  // Reset results
  document.getElementById('showcase-results').innerHTML = '<div class="text-sm text-gray-600 text-center py-8">Click a suggested prompt above, or use the buttons in the tab bar</div>';
}

function runPrompt(prompt) {
  if (currentMode === 'socratic') {
    document.getElementById('showcase-socratic-msg').value = prompt;
    showcaseSocratic();
  } else if (currentMode === 'chat') {
    document.getElementById('showcase-chat-msg').value = prompt;
    showcaseChat();
  } else {
    showcaseAction(currentMode);
  }
}

function showcaseAction(mode) {
  var docPath = getSelectedDoc();
  if (!docPath) return;
  document.getElementById('showcase-socratic-input').classList.add('hidden');
  document.getElementById('showcase-chat-input').classList.add('hidden');
  if (mode === 'socratic') { document.getElementById('showcase-socratic-input').classList.remove('hidden'); showcaseSocraticHistory = []; document.getElementById('showcase-results').innerHTML = '<div class="text-sm text-emerald-400/70 text-center py-8">Ask a question below \u2014 the Socratic tutor will guide you to discover the answer yourself</div>'; return; }
  if (mode === 'chat') { document.getElementById('showcase-chat-input').classList.remove('hidden'); showcaseChatHistory = []; document.getElementById('showcase-results').innerHTML = '<div class="text-sm text-gray-500 text-center py-8">Ask anything about the textbook \u2014 percentages, algebra, probability, and more</div>'; return; }
  showcaseLoading();
  var apiMode = mode === 'summary' ? 'summarize' : mode;
  var endpoint = '/api/ai/' + apiMode;
  var body = { path: docPath };
  if (mode === 'quiz') body.count = 5;
  if (mode === 'flashcards') body.count = 8;
  fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(function(r) { return r.json(); })
    .then(function(data) { renderShowcaseResult(mode, data); })
    .catch(function(e) { document.getElementById('showcase-results').innerHTML = '<div class="text-red-400 text-sm text-center py-4">Error: ' + e.message + '</div>'; });
}

function renderShowcaseResult(mode, data) {
  var el = document.getElementById('showcase-results');
  if (mode === 'summary' || mode === 'summarize') {
    var text = data.summary || 'No summary generated';
    el.innerHTML = '<div class="doc-content text-sm">' + simpleMarkdown(text) + '</div>';
  } else if (mode === 'keypoints') {
    var text = data.keypoints || 'No key points extracted';
    el.innerHTML = '<div class="doc-content text-sm">' + simpleMarkdown(text) + '</div>';
  } else if (mode === 'quiz') {
    renderShowcaseQuiz(data.questions || [], el);
  } else if (mode === 'flashcards') {
    renderShowcaseFlashcards(data.flashcards || [], el);
  } else if (mode === 'mindmap') {
    if (data.mindmap) { el.innerHTML = '<div class="text-sm">' + renderShowcaseMindmap(data.mindmap, 0) + '</div>'; }
    else { el.innerHTML = '<div class="text-gray-500 text-sm">Could not generate mind map</div>'; }
  } else if (mode === 'fermi') {
    renderShowcaseFermi(data.fermi || data, el);
  } else if (mode === 'study-guide') {
    var text = data.studyGuide || 'No study guide generated';
    el.innerHTML = '<div class="doc-content text-sm space-y-1">' + simpleMarkdown(text) + '</div>';
  } else {
    el.innerHTML = '<div class="text-gray-500 text-sm">' + JSON.stringify(data).slice(0, 500) + '</div>';
  }
}

function simpleMarkdown(text) {
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
    .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^\\d+\\. (.+)$/gm, '<li>$1</li>')
    .replace(/\\n/g, '<br>');
}

function escShowcase(s) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; }

var showcaseQuizScore = 0;
function renderShowcaseQuiz(questions, el) {
  if (questions.length === 0) { el.innerHTML = '<div class="text-gray-500 text-sm">Could not generate quiz</div>'; return; }
  showcaseQuizScore = 0;
  var html = '<div id="sq-score" class="text-sm text-gray-400 mb-3">Score: 0/' + questions.length + '</div>';
  questions.forEach(function(q, qi) {
    html += '<div class="mb-3 p-3 rounded-lg bg-white/5 border border-white/5">';
    html += '<div class="font-medium text-sm mb-2 text-gray-200">' + (qi+1) + '. ' + escShowcase(q.question) + '</div>';
    var opts = q.options || {};
    for (var key in opts) {
      html += '<button onclick="checkShowcaseQuiz(this,\\''+key+'\\',\\''+((q.answer||'').replace(/'/g,"\\\\'"))+'\\','+qi+')" class="block w-full text-left px-3 py-1.5 rounded text-sm my-1 bg-white/5 hover:bg-white/10 text-gray-300 transition-colors sq-opt-'+qi+'" data-key="'+key+'">';
      html += '<span class="font-medium text-brand mr-2">' + key.toUpperCase() + '.</span>' + escShowcase(opts[key]);
      html += '</button>';
    }
    html += '<div id="sq-expl-'+qi+'" class="hidden text-xs text-gray-500 mt-2 p-2 bg-white/[0.02] rounded"></div>';
    html += '</div>';
  });
  el.innerHTML = html;
}
function checkShowcaseQuiz(btn, selected, correct, qi) {
  document.querySelectorAll('.sq-opt-' + qi).forEach(function(o) {
    o.disabled = true; o.style.pointerEvents = 'none';
    if (o.dataset.key === correct) { o.classList.add('bg-emerald-500/20'); o.classList.remove('bg-white/5'); }
    else if (o === btn && selected !== correct) { o.classList.add('bg-red-500/20'); o.classList.remove('bg-white/5'); }
  });
  if (selected === correct) showcaseQuizScore++;
  var scoreEl = document.getElementById('sq-score');
  if (scoreEl) scoreEl.textContent = 'Score: ' + showcaseQuizScore + '/' + document.querySelectorAll('[id^="sq-expl-"]').length;
  var expl = document.getElementById('sq-expl-' + qi);
  if (expl) { expl.classList.remove('hidden'); expl.textContent = selected === correct ? 'Correct!' : 'Incorrect. The answer is ' + correct.toUpperCase() + '.'; }
}

var showcaseCards = [], showcaseCardIdx = 0;
function renderShowcaseFlashcards(cards, el) {
  if (cards.length === 0) { el.innerHTML = '<div class="text-gray-500 text-sm">Could not generate flashcards</div>'; return; }
  showcaseCards = cards; showcaseCardIdx = 0;
  renderOneShowcaseCard(el);
}
function renderOneShowcaseCard(el) {
  if (!el) el = document.getElementById('showcase-results');
  var card = showcaseCards[showcaseCardIdx];
  el.innerHTML = '<div class="text-xs text-gray-500 mb-2 text-center">' + (showcaseCardIdx+1) + ' / ' + showcaseCards.length + '</div>'
    + '<div class="flashcard" onclick="this.classList.toggle(\\'flipped\\')">'
    + '<div class="flashcard-inner">'
    + '<div class="flashcard-front"><div class="text-sm text-gray-200">' + escShowcase(card.front) + '</div></div>'
    + '<div class="flashcard-back"><div class="text-sm">' + escShowcase(card.back) + '</div></div>'
    + '</div></div>'
    + '<div class="flex justify-center gap-3 mt-4">'
    + '<button onclick="showcaseCardIdx=(showcaseCardIdx-1+showcaseCards.length)%showcaseCards.length;renderOneShowcaseCard()" class="px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded text-sm text-gray-300 transition-colors">&larr; Prev</button>'
    + '<button onclick="showcaseCardIdx=(showcaseCardIdx+1)%showcaseCards.length;renderOneShowcaseCard()" class="px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded text-sm text-gray-300 transition-colors">Next &rarr;</button>'
    + '</div>'
    + '<div class="text-xs text-gray-600 text-center mt-2">Click card to flip</div>';
}

function renderShowcaseMindmap(node, depth) {
  if (!node) return '';
  var hasChildren = node.children && node.children.length > 0;
  var colors = ['text-brand', 'text-emerald-400', 'text-amber-400', 'text-cyan-400', 'text-pink-400'];
  var color = colors[depth % colors.length];
  var html = '<div class="mindmap-node">';
  html += '<span class="mindmap-toggle">' + (hasChildren ? '\\u25BC' : '\\u2022') + '</span>';
  html += '<span class="mindmap-label ' + color + ' font-medium">' + escShowcase(node.label) + '</span>';
  if (hasChildren) {
    html += '<div class="mindmap-children">';
    for (var i = 0; i < node.children.length; i++) { html += renderShowcaseMindmap(node.children[i], depth + 1); }
    html += '</div>';
  }
  html += '</div>';
  return html;
}

function renderShowcaseFermi(fermi, el) {
  if (!fermi || !fermi.question) { el.innerHTML = '<div class="text-gray-500 text-sm">Could not generate Fermi exercise</div>'; return; }
  var html = '<div class="space-y-3">';
  html += '<div class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"><div class="font-semibold text-amber-300 text-sm mb-1">Fermi Question</div><div class="text-sm text-gray-200">' + escShowcase(fermi.question) + '</div></div>';
  html += '<div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-3 mb-1">Estimation Steps</div>';
  (fermi.steps || []).forEach(function(s, i) {
    html += '<details class="group"><summary class="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors">';
    html += '<span class="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-bold">' + (i+1) + '</span>';
    html += '<span class="text-gray-200">' + escShowcase(s.step) + '</span></summary>';
    html += '<div class="ml-7 mt-1 mb-2 text-xs space-y-1">';
    if (s.estimate) html += '<div class="text-amber-300 font-medium">Estimate: ' + escShowcase(s.estimate) + '</div>';
    if (s.reasoning) html += '<div class="text-gray-400">' + escShowcase(s.reasoning) + '</div>';
    html += '</div></details>';
  });
  if (fermi.finalAnswer) html += '<div class="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mt-2"><div class="text-xs font-semibold text-emerald-400 mb-1">Final Answer</div><div class="text-sm text-gray-200">' + escShowcase(fermi.finalAnswer) + '</div></div>';
  if (fermi.realWorldConnection) html += '<div class="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mt-2"><div class="text-xs font-semibold text-blue-400 mb-1">Real-World Connection</div><div class="text-sm text-gray-300">' + escShowcase(fermi.realWorldConnection) + '</div></div>';
  html += '</div>';
  el.innerHTML = html;
}

function showcaseSocratic() {
  var input = document.getElementById('showcase-socratic-msg');
  var msg = input.value.trim();
  if (!msg) return;
  var docPath = getSelectedDoc();
  if (!docPath) return;
  input.value = '';
  var el = document.getElementById('showcase-results');
  el.innerHTML += '<div class="flex justify-end mb-2"><div class="bg-emerald-500/20 text-emerald-300 rounded-lg px-3 py-2 text-sm max-w-[80%]">' + escShowcase(msg) + '</div></div>';
  el.innerHTML += '<div id="sc-load" class="flex items-center gap-2 mb-2"><div class="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div><span class="text-xs text-gray-500">Thinking...</span></div>';
  el.scrollTop = el.scrollHeight;
  showcaseSocraticHistory.push({ role: 'user', content: msg });
  fetch('/api/ai/socratic', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: docPath, message: msg, history: showcaseSocraticHistory.slice(-10) }) })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var reply = data.reply || data.error || 'No response';
      showcaseSocraticHistory.push({ role: 'assistant', content: reply });
      var loading = document.getElementById('sc-load');
      if (loading) loading.remove();
      el.innerHTML += '<div class="bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-2 text-sm mb-2">' + simpleMarkdown(reply) + '</div>';
      el.scrollTop = el.scrollHeight;
    })
    .catch(function(e) {
      var loading = document.getElementById('sc-load');
      if (loading) loading.remove();
      el.innerHTML += '<div class="text-red-400 text-sm mb-2">Error: ' + e.message + '</div>';
    });
}

function showcaseChat() {
  var input = document.getElementById('showcase-chat-msg');
  var msg = input.value.trim();
  if (!msg) return;
  var docPath = getSelectedDoc();
  if (!docPath) return;
  input.value = '';
  var el = document.getElementById('showcase-results');
  el.innerHTML += '<div class="flex justify-end mb-2"><div class="bg-brand/20 text-brand rounded-lg px-3 py-2 text-sm max-w-[80%]">' + escShowcase(msg) + '</div></div>';
  el.innerHTML += '<div id="sc-chat-load" class="flex items-center gap-2 mb-2"><div class="w-3 h-3 border-2 border-brand border-t-transparent rounded-full animate-spin"></div><span class="text-xs text-gray-500">Thinking...</span></div>';
  el.scrollTop = el.scrollHeight;
  showcaseChatHistory.push({ role: 'user', content: msg });
  fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: docPath, message: msg, history: showcaseChatHistory.slice(-10) }) })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var reply = data.reply || data.error || 'No response';
      showcaseChatHistory.push({ role: 'assistant', content: reply });
      var loading = document.getElementById('sc-chat-load');
      if (loading) loading.remove();
      el.innerHTML += '<div class="bg-white/5 rounded-lg px-3 py-2 text-sm mb-2">' + simpleMarkdown(reply) + '</div>';
      el.scrollTop = el.scrollHeight;
    })
    .catch(function(e) {
      var loading = document.getElementById('sc-chat-load');
      if (loading) loading.remove();
      el.innerHTML += '<div class="text-red-400 text-sm mb-2">Error: ' + e.message + '</div>';
    });
}

// ── Book Reader Functions ──
var bookTextPage = 1;
var bookTextTotalPages = 1;

function switchBookTab(tab) {
  var pdfBtn = document.getElementById('bookTabPdf');
  var textBtn = document.getElementById('bookTabText');
  var pdfView = document.getElementById('bookViewPdf');
  var textView = document.getElementById('bookViewText');
  if (!pdfBtn || !textBtn) return;

  if (tab === 'pdf') {
    pdfBtn.className = 'flex-1 px-4 py-3 text-sm font-medium text-brand border-b-2 border-brand transition-colors';
    textBtn.className = 'flex-1 px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-300 transition-colors';
    pdfView.classList.remove('hidden');
    textView.classList.add('hidden');
  } else {
    textBtn.className = 'flex-1 px-4 py-3 text-sm font-medium text-brand border-b-2 border-brand transition-colors';
    pdfBtn.className = 'flex-1 px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-300 transition-colors';
    textView.classList.remove('hidden');
    pdfView.classList.add('hidden');
    loadBookTextPage(bookTextPage);
  }
}

function loadBookTextPage(page) {
  var content = document.getElementById('bookTextContent');
  var info = document.getElementById('bookTextPageInfo');
  var prevBtn = document.getElementById('bookTextPrevBtn');
  var nextBtn = document.getElementById('bookTextNextBtn');
  if (!content) return;
  content.innerHTML = '<div class="text-gray-500 text-center py-8">Loading page ' + page + '...</div>';
  fetch('/api/pratham/book-text?page=' + page + '&pageSize=3000')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      bookTextPage = data.page;
      bookTextTotalPages = data.totalPages;
      content.textContent = data.content;
      content.scrollTop = 0;
      info.textContent = 'Page ' + data.page + ' of ' + data.totalPages + ' (' + Math.round(data.totalChars / 1000) + 'K chars total)';
      prevBtn.disabled = !data.hasPrev;
      nextBtn.disabled = !data.hasNext;
    })
    .catch(function(e) { content.innerHTML = '<div class="text-red-400 text-center py-8">Error loading text: ' + e.message + '</div>'; });
}

function bookTextPrev() {
  if (bookTextPage > 1) loadBookTextPage(bookTextPage - 1);
}

function bookTextNext() {
  if (bookTextPage < bookTextTotalPages) loadBookTextPage(bookTextPage + 1);
}
</script>
</body></html>`;
}

// ============================================
// PAGE: Knowledge Graph (/project/documents/_graph)
// ============================================
function knowledgeGraphPage(graphData) {
  const nodes = graphData.nodes || [];
  const edges = graphData.edges || [];

  return htmlHead('Knowledge Graph') + `
<body class="min-h-screen">
${navbar('graph')}
${searchModal()}

<div class="flex h-[calc(100vh-3.5rem)]">
  <!-- Left sidebar -->
  <div class="w-72 border-r border-border flex flex-col bg-surface/50">
    <div class="p-4 border-b border-border">
      <h2 class="text-sm font-semibold text-white mb-3">Knowledge Graph</h2>
      <input id="graph-search" type="text" placeholder="Filter nodes..." class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand/50 transition-colors" oninput="filterGraph(this.value)">
    </div>
    <div class="p-4 border-b border-border text-xs text-gray-500">
      <div class="flex items-center gap-2 mb-1"><span class="w-3 h-3 rounded-full bg-amber-500"></span> Folder</div>
      <div class="flex items-center gap-2 mb-1"><span class="w-3 h-3 rounded-full bg-blue-500"></span> Document</div>
      <div class="flex items-center gap-2 mb-1"><span class="w-3 h-3 rounded bg-gray-700" style="width:20px;height:2px"></span> Contains (dashed)</div>
      <div class="flex items-center gap-2"><span class="w-3 h-3 rounded bg-purple-500" style="width:20px;height:2px"></span> Links to (solid)</div>
      <div class="mt-2 text-gray-600">${nodes.length} nodes &middot; ${edges.length} edges</div>
    </div>
    <div id="node-info" class="p-4 flex-1 overflow-y-auto">
      <p class="text-xs text-gray-600">Click a node to view details</p>
    </div>
  </div>

  <!-- Graph canvas -->
  <div id="graph-container" class="flex-1"></div>
</div>

<script src="https://cdn.jsdelivr.net/npm/vis-network@9/standalone/umd/vis-network.min.js"></script>
<script>
const graphNodes = ${JSON.stringify(nodes)};
const graphEdges = ${JSON.stringify(edges)};

// Build vis-network datasets
const visNodes = new vis.DataSet(graphNodes.map(n => ({
  id: n.id,
  label: n.label.length > 25 ? n.label.slice(0, 22) + '...' : n.label,
  title: n.label + (n.connections ? ' (' + n.connections + ' links)' : ''),
  color: n.type === 'category' ? { background: '#f59e0b', border: '#d97706' } : { background: '#3b82f6', border: '#2563eb' },
  size: n.size || 10,
  font: { color: '#e4e4e7', size: n.type === 'category' ? 12 : 10 },
  shape: n.type === 'category' ? 'dot' : 'dot',
  _type: n.type,
  _fullLabel: n.label,
  _category: n.category || '',
  _connections: n.connections || 0,
})));

const visEdges = new vis.DataSet(graphEdges.map((e, i) => ({
  id: 'e' + i,
  from: e.source,
  to: e.target,
  dashes: e.type === 'contains',
  color: e.type === 'links-to' ? { color: '#a855f7', opacity: 0.7 } : { color: '#333', opacity: 0.3 },
  arrows: e.type === 'links-to' ? { to: { enabled: true, scaleFactor: 0.5 } } : {},
  width: e.type === 'links-to' ? 1.5 : 0.5,
})));

const container = document.getElementById('graph-container');
const network = new vis.Network(container, { nodes: visNodes, edges: visEdges }, {
  physics: {
    forceAtlas2Based: { gravitationalConstant: -30, centralGravity: 0.005, springLength: 100, springConstant: 0.08 },
    solver: 'forceAtlas2Based',
    stabilization: { iterations: 150 },
  },
  interaction: { hover: true, tooltipDelay: 200, zoomView: true },
  layout: { improvedLayout: true },
});

// Click handler: show info + navigate on double-click
network.on('click', function(params) {
  if (params.nodes.length > 0) {
    const nodeId = params.nodes[0];
    const node = visNodes.get(nodeId);
    const infoEl = document.getElementById('node-info');
    infoEl.innerHTML = '<div class="mb-3"><div class="text-sm font-semibold text-white mb-1">' + escG(node._fullLabel) + '</div>'
      + '<div class="text-xs text-gray-500 mb-1">Type: ' + (node._type === 'category' ? 'Folder' : 'Document') + '</div>'
      + (node._connections > 0 ? '<div class="text-xs text-purple-400 mb-1">' + node._connections + ' link connections</div>' : '')
      + '<div class="text-xs text-gray-600 break-all">' + escG(nodeId) + '</div>'
      + '</div>'
      + (node._type === 'document' ? '<a href="/view/' + encodeURIComponent(nodeId) + '" class="block px-3 py-2 bg-brand/20 hover:bg-brand/30 text-brand text-sm rounded-lg text-center transition-colors">Open Document</a>' : '');
  }
});

network.on('doubleClick', function(params) {
  if (params.nodes.length > 0) {
    const nodeId = params.nodes[0];
    const node = visNodes.get(nodeId);
    if (node._type === 'document') {
      window.location.href = '/view/' + encodeURIComponent(nodeId);
    }
  }
});

function filterGraph(query) {
  const q = query.toLowerCase();
  visNodes.forEach(n => {
    const match = !q || n._fullLabel.toLowerCase().includes(q) || n.id.toLowerCase().includes(q);
    visNodes.update({ id: n.id, hidden: !match });
  });
}

function escG(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
</script>
</body></html>`;
}

// ============================================
// PAGE: FreightBox Showcase (/project/documents/freightbox/_showcase)
// ============================================
function freightboxShowcasePage(files, platform) {
  files = files || [];
  platform = platform || {};
  const fileCount = files.length;
  const p = platform;

  const docGrid = files.map(f => `
    <a href="/view/${encodeURIComponent(f.path)}" class="glass rounded-lg p-4 hover:bg-white/[0.03] border border-border hover:border-white/15 transition-all block">
      <div class="flex items-start gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" class="flex-shrink-0 mt-0.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
        <div class="min-w-0">
          <div class="text-sm font-medium text-gray-200 truncate">${esc(f.title)}</div>
          <div class="text-xs text-gray-600 mt-1">${f.size ? (f.size / 1024).toFixed(1) + ' KB' : ''}</div>
        </div>
      </div>
    </a>
  `).join('');

  // Icons for products
  const productIcons = {
    ship: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 1v4"/></svg>',
    truck: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>',
    warehouse: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35z"/><path d="M6 18h12"/><path d="M6 14h12"/></svg>',
    money: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    users: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  };

  // Colors for products
  const productColors = ['blue', 'emerald', 'amber', 'pink', 'purple'];

  // Module content for interactive tabs
  const moduleContent = {
    'Operations': { desc: 'End-to-end shipment lifecycle management across all freight modes.', features: ['Multi-modal booking (Ocean FCL/LCL, Air, Road, Rail)', 'Container management with type/size/status tracking', 'Shipment milestones with automated status updates', 'Carrier allocation and vessel scheduling', 'Port pair and route management'] },
    'Documentation': { desc: '37 document types with automated generation, e-signatures, and blockchain eBL.', features: ['Bill of Lading (MBL, HBL, electronic eBL)', 'Commercial Invoice, Packing List, Certificate of Origin', 'Customs declarations, shipping instructions', 'DCSA-compliant electronic Bill of Lading', 'Document chain verification with blockchain'] },
    'Finance': { desc: 'Full financial lifecycle from quotation to reconciliation.', features: ['Multi-currency quotations and invoicing', 'GST/Tax compliant (GSTN, E-Invoice IRN/IRP, E-Way Bill)', 'Credit management with configurable limits', 'Bank reconciliation with AI matching', 'Accounts receivable/payable with aging reports'] },
    'Tracking & Visibility': { desc: 'Real-time container, vessel, and shipment tracking.', features: ['Live container tracking with carrier integration', 'Vessel AIS tracking and port ETA predictions', 'Milestone-based shipment visibility', 'Customer portal with self-service tracking', 'Automated exception alerts and notifications'] },
    'Marketplace': { desc: 'Built-in freight exchange with bidding, RFQ, and dynamic pricing.', features: ['6 order types: Market, Limit, Auction, RFQ, Standing, Tender', 'Vendor network with scoring and ranking', 'Dynamic pricing engine with market factors', 'Contract management and rate benchmarking', 'Carrier connectivity and capacity matching'] },
    'APIBox Integrations': { desc: 'Pre-built connectors for Indian and global logistics systems.', features: ['GSTN, E-Invoice (IRN/IRP), E-Way Bill APIs', 'DigiLocker, Vahan vehicle verification', 'Carrier EDI and booking APIs', 'Payment gateway integrations (Razorpay, UPI)', 'WhatsApp Business API for notifications'] },
    'Analytics': { desc: 'Business intelligence with real-time dashboards and AI insights.', features: ['Shipment volume and revenue analytics', 'Carrier performance scorecards', 'Route profitability analysis', 'Customer churn prediction', 'AI-powered demand forecasting'] },
    'Customer Portal': { desc: 'Unified portal for shippers, consignees, and customs brokers.', features: ['Self-service booking and tracking', 'Document upload and verification', 'Invoice and payment management', 'Communication hub with chat and email', 'Mobile-responsive design'] },
    'User & Org Management': { desc: 'Multi-tenant architecture with fine-grained access control.', features: ['Role-based access control (RBAC)', 'Multi-organization support', 'Team management with department hierarchy', 'Audit trail and activity logging', 'SSO and OAuth integration'] },
    'Technical Platform': { desc: 'Modern cloud-native architecture built for scale.', features: ['GraphQL API with 100+ operations', 'Real-time subscriptions via WebSocket', 'PostgreSQL with Prisma ORM', 'Redis caching and job queues', 'Docker/K8s deployment ready'] },
  };

  const categories = p.categories || [];
  const exchange = p.exchange || {};
  const pricing = p.pricing || {};
  const products = p.products || [];
  const advantages = p.advantages || [];
  const moduleAreas = p.moduleAreas || [];

  // Build competitive bars HTML
  const competitiveBars = categories.map(c => {
    const fbColor = c.fb >= c.cw ? (c.fb > c.cw + 10 ? 'bg-emerald-500' : 'bg-emerald-400') : (c.fb >= c.cw - 10 ? 'bg-amber-400' : 'bg-red-400');
    const fbLabel = c.fb > c.cw + 10 ? 'EXCEEDS' : (c.fb >= c.cw - 10 ? '' : 'GAP');
    return `<div class="flex items-center gap-3 py-2">
      <div class="w-40 sm:w-48 text-xs text-gray-400 text-right flex-shrink-0 truncate">${esc(c.name)}</div>
      <div class="flex-1 space-y-1">
        <div class="flex items-center gap-2">
          <div class="flex-1 bg-white/5 rounded-full h-4 overflow-hidden">
            <div class="${fbColor}/70 h-full rounded-full flex items-center justify-end pr-2 transition-all" style="width:${Math.min(c.fb, 120) / 1.2}%">
              <span class="text-[9px] text-white font-bold">${c.fb}%</span>
            </div>
          </div>
          <span class="text-[9px] w-12 text-gray-500 fb-bar-label" data-mode="ecosystem">FB</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex-1 bg-white/5 rounded-full h-4 overflow-hidden">
            <div class="bg-blue-500/70 h-full rounded-full flex items-center justify-end pr-2 transition-all" style="width:${Math.min(c.cw, 100)}%">
              <span class="text-[9px] text-white font-bold">${c.cw}%</span>
            </div>
          </div>
          <span class="text-[9px] w-12 text-gray-500">CW</span>
        </div>
      </div>
      ${fbLabel ? `<span class="text-[9px] px-1.5 py-0.5 rounded-full ${fbLabel === 'EXCEEDS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'} font-bold flex-shrink-0">${fbLabel}</span>` : '<span class="w-16"></span>'}
    </div>`;
  }).join('');

  // Module tabs HTML
  const moduleTabs = moduleAreas.map((m, i) => {
    const active = i === 0 ? 'fb-tab-active' : '';
    return `<button onclick="fbShowcaseTab(this,'${esc(m)}')" class="fb-tab ${active} px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap">${esc(m)}</button>`;
  }).join('');

  const moduleContentHtml = moduleAreas.map((m, i) => {
    const mc = moduleContent[m] || { desc: '', features: [] };
    const display = i === 0 ? '' : 'hidden';
    return `<div id="fb-module-${i}" class="fb-module-panel ${display}">
      <div class="p-5">
        <h3 class="text-base font-bold text-white mb-2">${esc(m)}</h3>
        <p class="text-sm text-gray-400 mb-4">${esc(mc.desc)}</p>
        <div class="space-y-2">
          ${mc.features.map(f => `<div class="flex items-start gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" class="flex-shrink-0 mt-0.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
            <span class="text-sm text-gray-300">${esc(f)}</span>
          </div>`).join('')}
        </div>
      </div>
    </div>`;
  }).join('');

  // Product cards
  const productCards = products.map((prod, i) => {
    const color = productColors[i % productColors.length];
    const icon = productIcons[prod.icon] || productIcons.ship;
    return `<div class="glass rounded-xl p-5 border border-${color}-500/20 hover:border-${color}-500/40 transition-all cursor-pointer group" onclick="document.getElementById('section-modules').scrollIntoView({behavior:'smooth'})">
      <div class="w-10 h-10 rounded-lg bg-${color}-500/20 flex items-center justify-center text-${color}-400 mb-3 group-hover:scale-110 transition-transform">${icon}</div>
      <h3 class="text-sm font-bold text-white mb-1">${esc(prod.name)}</h3>
      <p class="text-xs text-gray-500">${esc(prod.desc)}</p>
    </div>`;
  }).join('');

  // Advantage cards
  const advantageCards = advantages.map((a, i) => {
    const colors = ['brand', 'emerald', 'amber', 'blue', 'pink', 'cyan'];
    const color = colors[i % colors.length];
    const icons = [
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4c0 1.95-2 4-4 6-2-2-4-4.05-4-6a4 4 0 0 1 4-4z"/><circle cx="12" cy="14" r="3"/><path d="M17.5 17.5L22 22"/><path d="M6.5 17.5L2 22"/></svg>',
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 0 0-8 0v2"/><path d="M12 14v2"/></svg>',
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    ];
    return `<div class="glass rounded-xl p-5 border border-${color}/20">
      <div class="w-10 h-10 rounded-lg bg-${color}/20 flex items-center justify-center text-${color} mb-3">${icons[i] || icons[0]}</div>
      <h3 class="text-sm font-bold text-white mb-1">${esc(a.title)}</h3>
      <p class="text-xs text-gray-500 leading-relaxed">${esc(a.desc)}</p>
    </div>`;
  }).join('');

  // Exchange stats
  const exchangeStats = [
    { label: 'Match Rate', value: exchange.matchRate || '>95%', color: 'emerald' },
    { label: 'Fill Rate', value: exchange.fillRate || '>85%', color: 'blue' },
    { label: 'Empty Miles', value: exchange.emptyMiles || '<15%', color: 'amber' },
    { label: 'Time to Match', value: exchange.timeToMatch || '<30 min', color: 'purple' },
    { label: 'Price Spread', value: exchange.priceSpread || '<5%', color: 'pink' },
    { label: 'Order Types', value: String(exchange.orderTypes || 6), color: 'cyan' },
  ];

  // Pricing columns
  const pricingTiers = [
    { name: 'Free', price: (pricing.free || {}).price || '$0', shipments: (pricing.free || {}).shipments || 10, users: (pricing.free || {}).users || 1, docTypes: (pricing.free || {}).docTypes || 5, color: 'gray', cta: 'Start Free' },
    { name: 'Pro', price: (pricing.pro || {}).price || '$99/mo', shipments: (pricing.pro || {}).shipments || 100, users: (pricing.pro || {}).users || 5, docTypes: (pricing.pro || {}).docTypes || 37, color: 'brand', cta: 'Get Pro', featured: true },
    { name: 'Enterprise', price: (pricing.enterprise || {}).price || 'Custom', shipments: (pricing.enterprise || {}).shipments || 'Unlimited', users: (pricing.enterprise || {}).users || 'Unlimited', docTypes: (pricing.enterprise || {}).docTypes || 37, color: 'amber', cta: 'Contact Sales' },
  ];

  return htmlHead('FreightBox Showcase — ANKR Logistics') + `
<body class="min-h-screen">
${navbar()}
${searchModal()}

<main class="max-w-6xl mx-auto px-4 sm:px-6 py-8">

  <!-- SECTION A: Hero -->
  <div class="mb-12">
    <div class="glass rounded-2xl border border-blue-500/20 overflow-hidden">
      <div class="p-8 sm:p-10 bg-gradient-to-br from-blue-500/5 via-transparent to-emerald-500/5">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">FB</div>
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-white">${esc(p.name || 'FreightBox')}</h1>
            <p class="text-sm text-gray-400">${esc(p.tagline || 'Multimodal Freight Management')}</p>
          </div>
        </div>
        <p class="text-lg text-blue-300 font-medium mb-6">Any Size. Any Mode. Anywhere.</p>
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <div><div class="text-2xl font-bold text-white">${p.modules || 10}</div><div class="text-gray-500 text-xs">Modules</div></div>
          <div><div class="text-2xl font-bold text-white">${p.docTypes || 37}</div><div class="text-gray-500 text-xs">Doc Types</div></div>
          <div><div class="text-2xl font-bold text-white">${p.freightModes || 6}</div><div class="text-gray-500 text-xs">Freight Modes</div></div>
          <div><div class="text-2xl font-bold text-white">${(p.products || []).length || 5}</div><div class="text-gray-500 text-xs">Products</div></div>
          <div><div class="text-2xl font-bold text-white">${p.graphqlOps || '100'}+</div><div class="text-gray-500 text-xs">GraphQL Ops</div></div>
        </div>
        <div class="flex flex-wrap gap-2 text-xs">
          <span class="bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full">DCSA Compliant</span>
          <span class="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full">GraphQL API</span>
          <span class="bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-full">Real-time</span>
          <span class="bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full">AI-Powered</span>
          <span class="bg-pink-500/20 text-pink-300 px-2.5 py-1 rounded-full">India Compliance</span>
          <span class="bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-full">Blockchain eBL</span>
        </div>
      </div>
    </div>
  </div>

  <!-- SECTION B: Platform Architecture Pipeline -->
  <div class="mb-10">
    <h2 class="text-lg font-bold text-white mb-4">Freight Lifecycle Pipeline</h2>
    <div class="glass rounded-xl p-5 border border-white/10">
      <div class="flex flex-wrap items-center justify-center gap-2 text-sm">
        <div class="bg-blue-500/15 text-blue-400 px-4 py-2.5 rounded-lg font-medium text-center">
          <div class="text-lg mb-0.5">&#x1F4E6;</div>Shipper<div class="text-[10px] text-blue-400/60 mt-0.5">RFQ / Booking</div>
        </div>
        <svg width="24" height="16" viewBox="0 0 24 16" fill="none" class="text-gray-600 flex-shrink-0"><path d="M2 8h18m0 0l-4-4m4 4l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="bg-purple-500/15 text-purple-400 px-4 py-2.5 rounded-lg font-medium text-center">
          <div class="text-lg mb-0.5">&#x1F4CB;</div>Booking<div class="text-[10px] text-purple-400/60 mt-0.5">Rate + Allocation</div>
        </div>
        <svg width="24" height="16" viewBox="0 0 24 16" fill="none" class="text-gray-600 flex-shrink-0"><path d="M2 8h18m0 0l-4-4m4 4l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="bg-amber-500/15 text-amber-400 px-4 py-2.5 rounded-lg font-medium text-center">
          <div class="text-lg mb-0.5">&#x1F4E6;</div>Container<div class="text-[10px] text-amber-400/60 mt-0.5">Stuffing / CFS</div>
        </div>
        <svg width="24" height="16" viewBox="0 0 24 16" fill="none" class="text-gray-600 flex-shrink-0"><path d="M2 8h18m0 0l-4-4m4 4l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="bg-emerald-500/15 text-emerald-400 px-4 py-2.5 rounded-lg font-medium text-center">
          <div class="text-lg mb-0.5">&#x1F6A2;</div>Tracking<div class="text-[10px] text-emerald-400/60 mt-0.5">Live AIS + ETA</div>
        </div>
        <svg width="24" height="16" viewBox="0 0 24 16" fill="none" class="text-gray-600 flex-shrink-0"><path d="M2 8h18m0 0l-4-4m4 4l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="bg-cyan-500/15 text-cyan-400 px-4 py-2.5 rounded-lg font-medium text-center">
          <div class="text-lg mb-0.5">&#x1F4C4;</div>Documents<div class="text-[10px] text-cyan-400/60 mt-0.5">37 doc types + eBL</div>
        </div>
        <svg width="24" height="16" viewBox="0 0 24 16" fill="none" class="text-gray-600 flex-shrink-0"><path d="M2 8h18m0 0l-4-4m4 4l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="bg-pink-500/15 text-pink-400 px-4 py-2.5 rounded-lg font-medium text-center">
          <div class="text-lg mb-0.5">&#x1F4B0;</div>Finance<div class="text-[10px] text-pink-400/60 mt-0.5">Invoice + GST</div>
        </div>
        <svg width="24" height="16" viewBox="0 0 24 16" fill="none" class="text-gray-600 flex-shrink-0"><path d="M2 8h18m0 0l-4-4m4 4l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="bg-brand/15 text-brand px-4 py-2.5 rounded-lg font-medium text-center">
          <div class="text-lg mb-0.5">&#x2705;</div>Delivery<div class="text-[10px] text-brand/60 mt-0.5">POD + Settlement</div>
        </div>
      </div>
    </div>
  </div>

  <!-- SECTION C: 5 Products in Suite -->
  <div class="mb-10">
    <h2 class="text-lg font-bold text-white mb-4">5 Products in the FreightBox Suite</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      ${productCards}
    </div>
  </div>

  <!-- SECTION D: 10 Module Deep-Dive (Interactive Tabs) -->
  <div class="mb-10" id="section-modules">
    <h2 class="text-lg font-bold text-white mb-4">10-Module Deep Dive</h2>
    <div class="glass rounded-xl border border-white/10 overflow-hidden">
      <div class="flex flex-nowrap gap-1 p-2 overflow-x-auto bg-white/[0.02] border-b border-white/5">
        ${moduleTabs}
      </div>
      <div id="fb-module-content">
        ${moduleContentHtml}
      </div>
    </div>
  </div>

  <!-- SECTION E: vs CargoWise — Competitive Dashboard -->
  <div class="mb-10">
    <h2 class="text-lg font-bold text-white mb-2">FreightBox vs CargoWise</h2>
    <p class="text-xs text-gray-500 mb-4">Side-by-side comparison across 11 capability categories. Toggle between standalone FreightBox and full ANKR Ecosystem scores.</p>
    <div class="glass rounded-xl border border-white/10 overflow-hidden">
      <div class="flex items-center justify-between px-5 py-3 bg-white/[0.02] border-b border-white/5">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-500/70"></span>
            <span class="text-xs text-gray-400">FreightBox</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-blue-500/70"></span>
            <span class="text-xs text-gray-400">CargoWise</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="fbToggleEcosystem(false)" id="fb-toggle-standalone" class="px-3 py-1 rounded-lg text-[10px] font-medium bg-white/5 text-gray-400 transition-all hover:bg-white/10">Standalone (${(p.standalone || {}).score || 47}%)</button>
          <button onclick="fbToggleEcosystem(true)" id="fb-toggle-ecosystem" class="px-3 py-1 rounded-lg text-[10px] font-medium bg-brand/20 text-brand transition-all">Ecosystem (${(p.ecosystem || {}).score || 92}%)</button>
        </div>
      </div>
      <div class="px-5 py-4 space-y-1" id="fb-competitive-bars">
        ${competitiveBars}
      </div>
      <div class="px-5 py-3 bg-white/[0.02] border-t border-white/5">
        <div class="flex items-center gap-3 text-xs">
          <span class="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">5 categories EXCEED CargoWise</span>
          <span class="text-gray-600">CRM at 120% — far beyond CW's 60%</span>
        </div>
      </div>
    </div>
  </div>

  <!-- SECTION F: FR8X Exchange — The Marketplace Engine -->
  <div class="mb-10">
    <h2 class="text-lg font-bold text-white mb-2">FR8X Exchange — The Marketplace Engine</h2>
    <p class="text-xs text-gray-500 mb-4">A built-in freight exchange with dynamic pricing, multi-order-type matching, and liquidity flywheel.</p>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      ${exchangeStats.map(s => `
        <div class="glass rounded-xl p-4 border border-${s.color}-500/20 text-center">
          <div class="text-2xl font-bold text-${s.color}-400">${esc(String(s.value))}</div>
          <div class="text-[10px] text-gray-500 mt-1">${esc(s.label)}</div>
        </div>
      `).join('')}
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <!-- 6 Order Types -->
      <div class="glass rounded-xl p-5 border border-white/10">
        <h3 class="text-sm font-bold text-white mb-3">6 Order Types</h3>
        <div class="grid grid-cols-2 gap-2">
          ${['Market Order', 'Limit Order', 'Auction', 'RFQ', 'Standing Order', 'Tender'].map((ot, i) => {
            const orderColors = ['blue', 'purple', 'amber', 'emerald', 'pink', 'cyan'];
            return `<div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-${orderColors[i]}-500/10 border border-${orderColors[i]}-500/20">
              <span class="w-2 h-2 rounded-full bg-${orderColors[i]}-400"></span>
              <span class="text-xs text-gray-300">${ot}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
      <!-- Liquidity Flywheel -->
      <div class="glass rounded-xl p-5 border border-brand/20">
        <h3 class="text-sm font-bold text-white mb-3">Liquidity Flywheel</h3>
        <div class="space-y-2 text-xs text-gray-400">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-[10px]">1</div>
            <span>More Shippers &rarr; More Loads posted</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-[10px]">2</div>
            <span>More Loads &rarr; Carriers join for demand</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-[10px]">3</div>
            <span>More Carriers &rarr; Better rates &amp; match</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-[10px]">4</div>
            <span>Better rates &rarr; More Shippers join</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 font-bold text-[10px]">5</div>
            <span>Cycle accelerates &rarr; Network effects compound</span>
          </div>
        </div>
      </div>
    </div>
    <!-- Dynamic Pricing -->
    <div class="glass rounded-xl p-5 border border-amber-500/20">
      <h3 class="text-sm font-bold text-white mb-2">Dynamic Pricing Formula</h3>
      <div class="bg-white/[0.02] rounded-lg p-4 font-mono text-sm text-amber-300 overflow-x-auto">
        Price = BaseRate &times; DemandMultiplier &times; SeasonalFactor &times; (1 + FuelSurcharge) &times; CarrierScore
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3 text-[10px]">
        <div class="text-center"><span class="text-gray-400">BaseRate</span><br><span class="text-amber-300">Market average</span></div>
        <div class="text-center"><span class="text-gray-400">Demand</span><br><span class="text-amber-300">Supply/demand ratio</span></div>
        <div class="text-center"><span class="text-gray-400">Seasonal</span><br><span class="text-amber-300">Peak/off-peak</span></div>
        <div class="text-center"><span class="text-gray-400">Fuel</span><br><span class="text-amber-300">Real-time index</span></div>
        <div class="text-center"><span class="text-gray-400">Carrier</span><br><span class="text-amber-300">Performance score</span></div>
      </div>
    </div>
  </div>

  <!-- SECTION G: 6 Unique Advantages over CargoWise -->
  <div class="mb-10">
    <h2 class="text-lg font-bold text-white mb-4">6 Advantages Over CargoWise</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      ${advantageCards}
    </div>
  </div>

  <!-- SECTION H: Pricing Tiers -->
  <div class="mb-10">
    <h2 class="text-lg font-bold text-white mb-2">Pricing</h2>
    <p class="text-xs text-gray-500 mb-4">Start free, scale as you grow.</p>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      ${pricingTiers.map(t => `
        <div class="glass rounded-xl p-6 border ${t.featured ? 'border-brand/40 ring-1 ring-brand/20' : 'border-white/10'}">
          ${t.featured ? '<div class="text-[10px] font-bold text-brand uppercase tracking-wider mb-2">Most Popular</div>' : ''}
          <h3 class="text-lg font-bold text-white">${esc(t.name)}</h3>
          <div class="text-3xl font-bold text-white mt-2 mb-4">${esc(String(t.price))}</div>
          <div class="space-y-3 text-sm text-gray-400 mb-6">
            <div class="flex items-center justify-between">
              <span>Shipments/mo</span>
              <span class="text-white font-medium">${esc(String(t.shipments))}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Users</span>
              <span class="text-white font-medium">${esc(String(t.users))}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Document Types</span>
              <span class="text-white font-medium">${t.docTypes}</span>
            </div>
          </div>
          <button class="w-full py-2.5 rounded-lg text-sm font-medium transition-all ${t.featured ? 'bg-brand hover:bg-brand/80 text-white' : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'}">${esc(t.cta)}</button>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- SECTION I: Documentation Index -->
  <div class="mb-10">
    <h2 class="text-lg font-bold text-white mb-2">FreightBox Documentation</h2>
    <p class="text-xs text-gray-500 mb-4">${fileCount} project documents — architecture, gap analysis, exchange design, roadmaps</p>
    <details class="group" open>
      <summary class="cursor-pointer text-sm text-brand hover:text-brand/80 transition-colors mb-3 font-medium">Show ${fileCount} documents &#x25BE;</summary>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
        ${docGrid || '<div class="col-span-full text-center text-gray-600 py-8">No documents found</div>'}
      </div>
    </details>
  </div>

</main>

<footer class="border-t border-border mt-16 py-6 text-center text-xs text-gray-600">
  ANKR Labs &middot; FreightBox Multimodal Freight Management Showcase
</footer>

<style>
.fb-tab { color: #666; background: transparent; }
.fb-tab:hover { color: #aaa; background: rgba(255,255,255,0.03); }
.fb-tab-active { color: #93c5fd !important; background: rgba(59,130,246,0.15) !important; }
</style>
<script>
// Module tab switching
var fbModuleAreas = ${JSON.stringify(moduleAreas)};
function fbShowcaseTab(btn, moduleName) {
  // Update tab styling
  document.querySelectorAll('.fb-tab').forEach(function(t) { t.classList.remove('fb-tab-active'); });
  btn.classList.add('fb-tab-active');
  // Show correct panel
  var idx = fbModuleAreas.indexOf(moduleName);
  document.querySelectorAll('.fb-module-panel').forEach(function(p, i) {
    if (i === idx) p.classList.remove('hidden');
    else p.classList.add('hidden');
  });
}

// Competitive chart toggle (ecosystem vs standalone)
var fbStandaloneScores = ${JSON.stringify((p.categories || []).map(c => {
  // Standalone scores: reduce ecosystem-boosted categories
  const standaloneMultiplier = { 'Warehouse (WMS)': 0.33, 'Transport (TMS)': 0.42, 'Financial': 0.45, 'CRM': 0.33 };
  const mult = standaloneMultiplier[c.name] || 0.67;
  return { name: c.name, fb: Math.round(c.fb * mult), cw: c.cw };
}))};
var fbEcosystemScores = ${JSON.stringify(categories)};
var fbIsEcosystem = true;

function fbToggleEcosystem(show) {
  fbIsEcosystem = show;
  var scores = show ? fbEcosystemScores : fbStandaloneScores;
  var bars = document.getElementById('fb-competitive-bars');
  if (!bars) return;
  // Rebuild bars
  var html = '';
  scores.forEach(function(c) {
    var fbColor = c.fb >= c.cw ? (c.fb > c.cw + 10 ? 'bg-emerald-500' : 'bg-emerald-400') : (c.fb >= c.cw - 10 ? 'bg-amber-400' : 'bg-red-400');
    var fbLabel = c.fb > c.cw + 10 ? 'EXCEEDS' : (c.fb >= c.cw - 10 ? '' : 'GAP');
    html += '<div class="flex items-center gap-3 py-2">';
    html += '<div class="w-40 sm:w-48 text-xs text-gray-400 text-right flex-shrink-0 truncate">' + c.name + '</div>';
    html += '<div class="flex-1 space-y-1">';
    html += '<div class="flex items-center gap-2"><div class="flex-1 bg-white/5 rounded-full h-4 overflow-hidden"><div class="' + fbColor + '/70 h-full rounded-full flex items-center justify-end pr-2 transition-all" style="width:' + Math.min(c.fb, 120) / 1.2 + '%"><span class="text-[9px] text-white font-bold">' + c.fb + '%</span></div></div><span class="text-[9px] w-12 text-gray-500">FB</span></div>';
    html += '<div class="flex items-center gap-2"><div class="flex-1 bg-white/5 rounded-full h-4 overflow-hidden"><div class="bg-blue-500/70 h-full rounded-full flex items-center justify-end pr-2 transition-all" style="width:' + Math.min(c.cw, 100) + '%"><span class="text-[9px] text-white font-bold">' + c.cw + '%</span></div></div><span class="text-[9px] w-12 text-gray-500">CW</span></div>';
    html += '</div>';
    if (fbLabel) {
      html += '<span class="text-[9px] px-1.5 py-0.5 rounded-full ' + (fbLabel === 'EXCEEDS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400') + ' font-bold flex-shrink-0">' + fbLabel + '</span>';
    } else {
      html += '<span class="w-16"></span>';
    }
    html += '</div>';
  });
  bars.innerHTML = html;
  // Update toggle styling
  var btnStandalone = document.getElementById('fb-toggle-standalone');
  var btnEcosystem = document.getElementById('fb-toggle-ecosystem');
  if (show) {
    btnEcosystem.className = 'px-3 py-1 rounded-lg text-[10px] font-medium bg-brand/20 text-brand transition-all';
    btnStandalone.className = 'px-3 py-1 rounded-lg text-[10px] font-medium bg-white/5 text-gray-400 transition-all hover:bg-white/10';
  } else {
    btnStandalone.className = 'px-3 py-1 rounded-lg text-[10px] font-medium bg-brand/20 text-brand transition-all';
    btnEcosystem.className = 'px-3 py-1 rounded-lg text-[10px] font-medium bg-white/5 text-gray-400 transition-all hover:bg-white/10';
  }
}
</script>
</body></html>`;
}

/* ═══════════════════════════════════════════════════════════════
   WareXAI Showcase Page
   ═══════════════════════════════════════════════════════════════ */
function warexaiShowcasePage(files, platform) {
  files = files || [];
  platform = platform || {};
  const p = platform;

  const docGrid = files.map(f => `
    <a href="/view/${encodeURIComponent(f.path)}" class="glass rounded-lg p-4 hover:bg-white/[0.03] border border-border hover:border-white/15 transition-all block">
      <div class="flex items-start gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" class="flex-shrink-0 mt-0.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
        <div class="min-w-0">
          <div class="text-sm font-medium text-gray-200 truncate">${esc(f.title)}</div>
          <div class="text-xs text-gray-600 mt-1">${f.size ? (f.size / 1024).toFixed(1) + ' KB' : ''}</div>
        </div>
      </div>
    </a>
  `).join('');

  const tracks = p.tracks || [];
  const modules = p.modules || [];
  const techStack = p.techStack || [];

  // Feature track cards
  const trackCards = tracks.map((t, i) => {
    const colors = ['blue', 'emerald', 'amber', 'purple'];
    const c = colors[i % colors.length];
    return `<div class="glass rounded-xl p-6 border border-${c}-500/20 hover:border-${c}-500/40 transition-all">
      <div class="w-10 h-10 rounded-lg bg-${c}-500/20 flex items-center justify-center text-${c}-400 mb-3 text-xl">${esc(t.icon)}</div>
      <h3 class="text-base font-bold text-white mb-2">${esc(t.title)}</h3>
      <ul class="space-y-1">
        ${t.features.map(f => `<li class="text-sm text-gray-400 flex items-start gap-2"><span class="text-${c}-400 mt-0.5">&bull;</span>${esc(f)}</li>`).join('')}
      </ul>
    </div>`;
  }).join('');

  // Module category groups
  const moduleHtml = modules.map(cat => {
    const pills = cat.items.map(m => `
      <a href="https://warexai.com${esc(m.href)}" target="_blank" class="flex items-center gap-2 px-3 py-2 bg-white/[0.02] border border-white/5 rounded-lg hover:border-white/15 hover:bg-white/[0.04] transition-all text-sm text-gray-300 hover:text-white">
        <span class="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white ${esc(m.color)}">${esc(m.icon)}</span>
        ${esc(m.title)}
      </a>
    `).join('');
    return `<div class="mb-8">
      <h4 class="text-xs uppercase tracking-widest text-gray-500 mb-3">${esc(cat.category)}</h4>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">${pills}</div>
    </div>`;
  }).join('');

  // Tech stack badges
  const techBadges = techStack.map(t =>
    `<span class="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300">${esc(t)}</span>`
  ).join('');

  // Stats
  const stats = p.stats || {};

  return `${htmlHead('WareXAI - AI-Powered WMS', '<style>.wx-gradient{background:linear-gradient(135deg,rgba(59,130,246,.08),transparent 60%,rgba(6,182,212,.06))}</style>')}
<body>
${navbar('warexai')}

<!-- Hero -->
<section class="wx-gradient">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12">
    <div class="flex items-center gap-3 mb-6">
      <a href="/project/documents/" class="text-gray-500 hover:text-gray-400 text-sm transition-colors">&larr; All Projects</a>
    </div>
    <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
      <div class="flex-1">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <span class="text-white font-bold text-2xl">W</span>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-white">WareXAI</h1>
            <p class="text-gray-500 text-sm">AI-Powered Enterprise Warehouse Management</p>
          </div>
        </div>
        <p class="text-gray-400 leading-relaxed max-w-2xl mb-6">
          End-to-end WMS with real-time inventory tracking, bin-level management,
          picking &amp; packing workflows, 3PL billing, and full Indian compliance
          &mdash; GST, E-Way Bill, E-Invoice, FSSAI, and bonded warehouse support.
        </p>
        <div class="flex flex-wrap gap-3">
          <a href="https://warexai.com/login" target="_blank" class="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
            Start Free Demo
          </a>
          <a href="https://warexai.com/dashboard" target="_blank" class="px-5 py-2.5 bg-white/5 border border-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">
            Explore Dashboard
          </a>
        </div>
      </div>
      <!-- Stats panel -->
      <div class="glass rounded-xl p-5 border border-border min-w-[240px]">
        <div class="grid grid-cols-2 gap-4">
          <div class="text-center"><div class="text-2xl font-bold text-white">${stats.prismaModels || 90}+</div><div class="text-xs text-gray-500">Models</div></div>
          <div class="text-center"><div class="text-2xl font-bold text-blue-400">${stats.graphqlOps || 200}+</div><div class="text-xs text-gray-500">APIs</div></div>
          <div class="text-center"><div class="text-2xl font-bold text-cyan-400">${stats.frontendPages || 80}+</div><div class="text-xs text-gray-500">Pages</div></div>
          <div class="text-center"><div class="text-2xl font-bold text-emerald-400">${stats.mobileScreens || 10}+</div><div class="text-xs text-gray-500">Mobile</div></div>
        </div>
        <div class="mt-4 pt-3 border-t border-white/5 text-center">
          <a href="https://warexai.com" target="_blank" class="text-blue-400 text-xs hover:text-blue-300 transition-colors">warexai.com &nearr;</a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Feature Tracks -->
<section class="max-w-6xl mx-auto px-4 sm:px-6 py-12">
  <h2 class="text-xl font-bold text-white mb-2">Four Capability Tracks</h2>
  <p class="text-gray-500 text-sm mb-8">From AI-powered forecasting to GST-compliant billing, WareXAI covers every aspect of modern warehouse operations.</p>
  <div class="grid md:grid-cols-2 gap-4">
    ${trackCards}
  </div>
</section>

<!-- Module Showcase -->
<section class="max-w-6xl mx-auto px-4 sm:px-6 py-12">
  <h2 class="text-xl font-bold text-white mb-2">80+ WMS Modules</h2>
  <p class="text-gray-500 text-sm mb-8">Every module from receiving docks to shipping lanes, slotting optimization to drone inventory.</p>
  ${moduleHtml}
</section>

<!-- Tech Stack -->
<section class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
  <h2 class="text-sm uppercase tracking-widest text-gray-500 mb-4 text-center">Built With</h2>
  <div class="flex flex-wrap justify-center gap-3">
    ${techBadges}
  </div>
</section>

<!-- Documents -->
<section class="max-w-6xl mx-auto px-4 sm:px-6 py-12">
  <h2 class="text-xl font-bold text-white mb-6">Project Documents</h2>
  <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
    ${docGrid || '<p class="text-gray-600 col-span-3">No documents found.</p>'}
  </div>
</section>

<!-- CTA -->
<section class="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
  <h2 class="text-2xl font-bold text-white mb-3">Ready to transform your warehouse?</h2>
  <p class="text-gray-500 text-sm mb-6">Start a free demo with pre-loaded Indian warehouse data.</p>
  <a href="https://warexai.com/login" target="_blank" class="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-600/20">
    Start Free Demo
  </a>
</section>

<footer class="border-t border-border">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-gray-600">
    WareXAI v1.0 &middot; <a href="https://warexai.com" class="hover:text-gray-400">warexai.com</a> &middot; ANKR Labs
  </div>
</footer>
<script>function toggleTheme(){var h=document.documentElement;h.className=h.className==='dark'?'light':'dark';localStorage.setItem('ankr-theme',h.className)}</script>
</body></html>`;
}

/* ═══════════════════════════════════════════════════════════════
   SunoSunao Showcase Page
   ═══════════════════════════════════════════════════════════════ */
function sunosunaoShowcasePage(files, platform) {
  files = files || [];
  platform = platform || {};
  const p = platform;
  const stats = p.stats || {};

  const docGrid = files.map(f => `
    <a href="/view/${encodeURIComponent(f.path)}" class="glass rounded-lg p-4 hover:bg-white/[0.03] border border-border hover:border-white/15 transition-all block">
      <div class="flex items-start gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2" class="flex-shrink-0 mt-0.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
        <div class="min-w-0">
          <div class="text-sm font-medium text-gray-200 truncate">${esc(f.title)}</div>
          <div class="text-xs text-gray-600 mt-1">${f.size ? (f.size / 1024).toFixed(1) + ' KB' : ''}</div>
        </div>
      </div>
    </a>
  `).join('');

  const features = p.features || [];
  const featureCards = features.map((feat, i) => {
    const colors = ['rose', 'orange', 'amber', 'pink', 'red', 'fuchsia'];
    const c = colors[i % colors.length];
    return `<div class="glass rounded-xl p-6 border border-${c}-500/20 hover:border-${c}-500/40 transition-all">
      <div class="w-10 h-10 rounded-lg bg-${c}-500/20 flex items-center justify-center text-${c}-400 mb-3 text-xl">${esc(feat.icon)}</div>
      <h3 class="text-base font-bold text-white mb-2">${esc(feat.title)}</h3>
      <ul class="space-y-1">
        ${feat.items.map(item => `<li class="text-sm text-gray-400 flex items-start gap-2"><span class="text-${c}-400 mt-0.5">&bull;</span>${esc(item)}</li>`).join('')}
      </ul>
    </div>`;
  }).join('');

  const voiceProviders = p.voiceProviders || [];
  const providerRows = voiceProviders.map(vp => `
    <tr class="border-b border-white/5">
      <td class="py-3 px-4 text-sm font-medium text-white">${esc(vp.name)}</td>
      <td class="py-3 px-4 text-sm text-gray-400">${esc(vp.languages)}</td>
      <td class="py-3 px-4 text-sm text-gray-400">${esc(vp.useCase)}</td>
      <td class="py-3 px-4 text-sm ${vp.cost === 'Free' ? 'text-emerald-400' : 'text-amber-400'}">${esc(vp.cost)}</td>
    </tr>
  `).join('');

  const tiers = p.tiers || [];
  const tierCards = tiers.map((tier, i) => {
    const isPopular = i === 2;
    return `<div class="glass rounded-xl p-6 border ${isPopular ? 'border-rose-500/40 ring-1 ring-rose-500/20' : 'border-white/10'} relative">
      ${isPopular ? '<div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-rose-500 text-white text-xs rounded-full font-medium">Popular</div>' : ''}
      <div class="text-sm font-bold text-white mb-1">${esc(tier.name)}</div>
      <div class="text-2xl font-bold text-rose-400 mb-3">${esc(tier.price)}</div>
      <ul class="space-y-2 text-sm text-gray-400">
        ${tier.features.map(f => `<li class="flex items-start gap-2"><span class="text-emerald-400">&#10003;</span>${esc(f)}</li>`).join('')}
      </ul>
    </div>`;
  }).join('');

  const techStack = p.techStack || [];
  const techBadges = techStack.map(t =>
    `<span class="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300">${esc(t)}</span>`
  ).join('');

  const useCases = p.useCases || [];
  const useCaseHtml = useCases.map(uc => `
    <div class="glass rounded-lg p-4 border border-white/5">
      <div class="text-lg mb-2">${esc(uc.icon)}</div>
      <div class="text-sm font-semibold text-white mb-1">${esc(uc.title)}</div>
      <div class="text-xs text-gray-500">${esc(uc.desc)}</div>
    </div>
  `).join('');

  return `${htmlHead('SunoSunao - Voice & Media Platform', '<style>.ss-gradient{background:linear-gradient(135deg,rgba(244,63,94,.08),transparent 60%,rgba(249,115,22,.06))}</style>')}
<body>
${navbar('sunosunao')}

<!-- Hero -->
<section class="ss-gradient">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12">
    <div class="flex items-center gap-3 mb-6">
      <a href="/project/documents/sunosunao" class="text-sm text-gray-500 hover:text-gray-300 transition-colors">&larr; Back to docs</a>
    </div>
    <div class="flex flex-col md:flex-row md:items-start gap-8">
      <div class="flex-1">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/30 to-orange-600/20 flex items-center justify-center text-3xl">\u{1F3A4}</div>
          <div>
            <h1 class="text-3xl font-bold text-white">SunoSunao</h1>
            <p class="text-rose-400 text-sm font-medium">\u0938\u0941\u0928\u094B \u0938\u0941\u0928\u093E\u0913 &mdash; Hear & Share</p>
          </div>
        </div>
        <p class="text-gray-400 text-lg leading-relaxed mb-6">${esc(p.tagline || 'Voice-first media platform with audio content, podcasts, voicebook, and social listening powered by AI transcription and recommendation.')}</p>
        <div class="flex flex-wrap gap-3">
          <span class="px-3 py-1.5 bg-rose-500/20 text-rose-400 rounded-full text-xs font-medium">Voice Legacy</span>
          <span class="px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium">103 Languages</span>
          <span class="px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">Voice Cloning</span>
          <span class="px-3 py-1.5 bg-pink-500/20 text-pink-400 rounded-full text-xs font-medium">6 Voice Providers</span>
        </div>
      </div>
      <div class="glass rounded-xl p-5 min-w-[220px]">
        <div class="text-xs text-gray-500 uppercase tracking-widest mb-3">Platform Stats</div>
        <div class="grid grid-cols-2 gap-4">
          <div class="text-center"><div class="text-2xl font-bold text-white">${stats.languages || 103}</div><div class="text-xs text-gray-500">Languages</div></div>
          <div class="text-center"><div class="text-2xl font-bold text-rose-400">${stats.voiceProviders || 6}</div><div class="text-xs text-gray-500">Voice Engines</div></div>
          <div class="text-center"><div class="text-2xl font-bold text-orange-400">${stats.prismaModels || 13}</div><div class="text-xs text-gray-500">Models</div></div>
          <div class="text-center"><div class="text-2xl font-bold text-amber-400">${stats.triggerTypes || 4}</div><div class="text-xs text-gray-500">Triggers</div></div>
        </div>
        <div class="mt-4 pt-3 border-t border-white/5 text-center">
          <span class="text-rose-400 text-xs">sunosunao.ankr.in</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Core Features -->
<section class="max-w-6xl mx-auto px-4 sm:px-6 py-12">
  <h2 class="text-xl font-bold text-white mb-2">Core Capabilities</h2>
  <p class="text-gray-500 text-sm mb-8">From voice recording to AI-powered delivery triggers, SunoSunao preserves voices across time and generations.</p>
  <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
    ${featureCards}
  </div>
</section>

<!-- Voice Engine -->
${voiceProviders.length ? `
<section class="max-w-6xl mx-auto px-4 sm:px-6 py-12">
  <h2 class="text-xl font-bold text-white mb-2">Voice Engine \u2014 6 Providers</h2>
  <p class="text-gray-500 text-sm mb-6">Multi-provider voice stack with Indian language specialization and free fallbacks.</p>
  <div class="glass rounded-xl overflow-hidden border border-white/10">
    <table class="w-full text-left">
      <thead><tr class="bg-white/[0.03]">
        <th class="py-3 px-4 text-xs uppercase tracking-wider text-gray-500">Provider</th>
        <th class="py-3 px-4 text-xs uppercase tracking-wider text-gray-500">Languages</th>
        <th class="py-3 px-4 text-xs uppercase tracking-wider text-gray-500">Use Case</th>
        <th class="py-3 px-4 text-xs uppercase tracking-wider text-gray-500">Cost</th>
      </tr></thead>
      <tbody>${providerRows}</tbody>
    </table>
  </div>
</section>` : ''}

<!-- Use Cases -->
${useCases.length ? `
<section class="max-w-6xl mx-auto px-4 sm:px-6 py-12">
  <h2 class="text-xl font-bold text-white mb-2">Who Uses SunoSunao</h2>
  <p class="text-gray-500 text-sm mb-6">Voice messages that transcend time &mdash; from grandparents to terminal patients to emigrant families.</p>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
    ${useCaseHtml}
  </div>
</section>` : ''}

<!-- Subscription Tiers -->
${tiers.length ? `
<section class="max-w-6xl mx-auto px-4 sm:px-6 py-12">
  <h2 class="text-xl font-bold text-white mb-2">Subscription Plans</h2>
  <p class="text-gray-500 text-sm mb-6">From free voice capsules to lifetime storage with unlimited cloning.</p>
  <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
    ${tierCards}
  </div>
</section>` : ''}

<!-- Tech Stack -->
<section class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
  <h2 class="text-sm uppercase tracking-widest text-gray-500 mb-4 text-center">Built With</h2>
  <div class="flex flex-wrap justify-center gap-3">
    ${techBadges}
  </div>
</section>

<!-- Documents -->
<section class="max-w-6xl mx-auto px-4 sm:px-6 py-12">
  <h2 class="text-xl font-bold text-white mb-6">Project Documents</h2>
  <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
    ${docGrid || '<p class="text-gray-600 col-span-3">No documents found.</p>'}
  </div>
</section>

<!-- CTA -->
<section class="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
  <h2 class="text-2xl font-bold text-white mb-3">Preserve Your Voice for Future Generations</h2>
  <p class="text-gray-500 text-sm mb-6">Record voice messages today. Deliver them tomorrow, on a birthday, or after you're gone.</p>
  <a href="/project/documents/sunosunao" class="inline-block px-8 py-3 bg-gradient-to-r from-rose-600 to-orange-600 text-white rounded-xl font-semibold hover:from-rose-700 hover:to-orange-700 transition-all shadow-lg shadow-rose-600/20">
    Explore Documentation
  </a>
</section>

<footer class="border-t border-border">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-gray-600">
    SunoSunao &middot; \u0938\u0941\u0928\u094B \u0938\u0941\u0928\u093E\u0913 &middot; ANKR Labs
  </div>
</footer>
<script>function toggleTheme(){var h=document.documentElement;h.className=h.className==='dark'?'light':'dark';localStorage.setItem('ankr-theme',h.className)}</script>
</body></html>`;
}

module.exports = { documentsHomePage, projectDetailPage, documentViewerPage, knowledgeGraphPage, prathamShowcasePage, freightboxShowcasePage, warexaiShowcasePage, sunosunaoShowcasePage, esc };
