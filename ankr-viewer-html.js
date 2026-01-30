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
            <div><div class="text-xl font-bold text-white">${book.editions || 17}</div><div class="text-gray-500 text-xs">Editions (${esc(book.editionRange || '2009\u20132025')})</div></div>
            <div><div class="text-xl font-bold text-white">8</div><div class="text-gray-500 text-xs">AI Modes</div></div>
            <div><div class="text-xl font-bold text-amber-400">72.8%</div><div class="text-gray-500 text-xs">Cost Savings vs Fermi.ai</div></div>
          </div>
          <div class="flex flex-wrap gap-3 text-xs text-gray-400">
            <span class="bg-white/5 px-2.5 py-1 rounded-full">ISBN: ${esc(book.isbn || '978-81-19992-59-1')}</span>
            <span class="bg-white/5 px-2.5 py-1 rounded-full">${esc(book.publisher || 'PRATHAM Test Prep')}</span>
            <span class="bg-white/5 px-2.5 py-1 rounded-full">${esc(book.price || '\u20B93,950')}</span>
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

  <!-- Live AI Demo Section (Book-Focused) -->
  <div class="glass rounded-2xl p-6 mb-10 border border-brand/20">
    <h2 class="text-lg font-bold text-white mb-1 flex items-center gap-2">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4v2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h2V6a4 4 0 0 1 4-4z"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/></svg>
      Live AI Demo \u2014 Quantitative Aptitude Book
    </h2>
    <p class="text-xs text-gray-500 mb-4">All 8 AI modes running on the ${book.pages || 268}-page vectorized textbook. Try each mode below.</p>
    <input type="hidden" id="showcase-doc" value="${esc(book.path || '_book/pratham-qa')}">
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
      <button onclick="showcaseAction('summary')" class="px-3 py-2 bg-brand/20 hover:bg-brand/30 text-brand rounded-lg text-sm transition-colors font-medium">Summary</button>
      <button onclick="showcaseAction('keypoints')" class="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition-colors font-medium">Key Points</button>
      <button onclick="showcaseAction('quiz')" class="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm transition-colors font-medium">Quiz Me</button>
      <button onclick="showcaseAction('flashcards')" class="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm transition-colors font-medium">Flashcards</button>
      <button onclick="showcaseAction('mindmap')" class="px-3 py-2 bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 rounded-lg text-sm transition-colors font-medium">Mind Map</button>
      <button onclick="showcaseAction('fermi')" class="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm transition-colors font-medium">Fermi Estimation</button>
      <button onclick="showcaseAction('socratic')" class="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm transition-colors font-medium">Socratic Dialog</button>
      <button onclick="showcaseAction('chat')" class="px-3 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded-lg text-sm transition-colors font-medium">Chat</button>
    </div>
    <!-- Socratic input (shown only for socratic mode) -->
    <div id="showcase-socratic-input" class="hidden mb-4">
      <div class="flex gap-2">
        <input id="showcase-socratic-msg" type="text" placeholder="e.g. How do I find the HCF of two numbers?" class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50 transition-colors" onkeydown="if(event.key==='Enter')showcaseSocratic()">
        <button onclick="showcaseSocratic()" class="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm transition-colors">Send</button>
      </div>
    </div>
    <!-- Chat input (shown only for chat mode) -->
    <div id="showcase-chat-input" class="hidden mb-4">
      <div class="flex gap-2">
        <input id="showcase-chat-msg" type="text" placeholder="e.g. Explain compound interest formula..." class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand/50 transition-colors" onkeydown="if(event.key==='Enter')showcaseChat()">
        <button onclick="showcaseChat()" class="px-3 py-2 bg-brand hover:bg-brand/80 text-white rounded-lg text-sm transition-colors">Send</button>
      </div>
    </div>
    <div id="showcase-results" class="min-h-[100px] max-h-[400px] overflow-y-auto rounded-lg bg-white/[0.02] border border-white/5 p-4">
      <div class="text-sm text-gray-600 text-center py-4">Click any AI mode above to demo it on the QA textbook</div>
    </div>
  </div>

  <!-- Fermi vs ANKR Comparison -->
  <div class="mb-10">
    <h2 class="text-lg font-bold text-white mb-4">Fermi.ai vs ANKR AI Tutor</h2>
    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th class="text-left p-3 bg-white/5 border border-white/10 text-gray-400 font-medium">Feature</th>
            <th class="text-left p-3 bg-white/5 border border-white/10 text-gray-400 font-medium">Fermi.ai</th>
            <th class="text-left p-3 bg-brand/10 border border-brand/20 text-brand font-medium">ANKR AI Tutor</th>
          </tr>
        </thead>
        <tbody>
          <tr><td class="p-3 border border-white/10 text-gray-300">Cost</td><td class="p-3 border border-white/10 text-gray-400">$8/student/month</td><td class="p-3 border border-brand/10 text-emerald-400">$2.18/student/month (72.8% less)</td></tr>
          <tr><td class="p-3 border border-white/10 text-gray-300">Devices</td><td class="p-3 border border-white/10 text-gray-400">Web browser</td><td class="p-3 border border-brand/10 text-gray-200">Web + Mobile + Offline</td></tr>
          <tr><td class="p-3 border border-white/10 text-gray-300">Languages</td><td class="p-3 border border-white/10 text-gray-400">English only</td><td class="p-3 border border-brand/10 text-gray-200">Hindi + 10 Indian languages</td></tr>
          <tr><td class="p-3 border border-white/10 text-gray-300">AI Modes</td><td class="p-3 border border-white/10 text-gray-400">3 (Summary, Quiz, Chat)</td><td class="p-3 border border-brand/10 text-gray-200">8 modes (+ Fermi, Socratic, Flashcards, Mind Map, Key Points)</td></tr>
          <tr><td class="p-3 border border-white/10 text-gray-300">Custom Content</td><td class="p-3 border border-white/10 text-gray-400">Limited PDF upload</td><td class="p-3 border border-brand/10 text-gray-200">Full PDF chunking + vector embeddings + RAG</td></tr>
          <tr><td class="p-3 border border-white/10 text-gray-300">Book Support</td><td class="p-3 border border-white/10 text-gray-400">No textbook ingestion</td><td class="p-3 border border-brand/10 text-gray-200">${book.pages || 268}-page PDF \u2192 chunked \u2192 vectorized \u2192 8 AI modes</td></tr>
          <tr><td class="p-3 border border-white/10 text-gray-300">Analytics</td><td class="p-3 border border-white/10 text-gray-400">Basic</td><td class="p-3 border border-brand/10 text-gray-200">Teacher dashboard + student progress tracking</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Pedagogical Approach Cards (Math-focused) -->
  <div class="mb-10">
    <h2 class="text-lg font-bold text-white mb-4">Pedagogical Approaches</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="glass rounded-xl p-5 border border-brand/20">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center text-brand text-sm font-bold">E</div>
          <h3 class="font-semibold text-white">Explain Mode</h3>
        </div>
        <p class="text-sm text-gray-400 mb-3">Direct step-by-step explanations for quantitative aptitude concepts.</p>
        <div class="bg-white/[0.03] rounded-lg p-3 text-xs space-y-2">
          <div class="text-brand">Student: "How do I find LCM of 12 and 18?"</div>
          <div class="text-gray-300">AI: "Step 1: Prime factorize \u2014 12 = 2\u00B2\u00D73, 18 = 2\u00D73\u00B2. Step 2: Take highest power of each: 2\u00B2\u00D73\u00B2 = 36. LCM = 36."</div>
        </div>
      </div>
      <div class="glass rounded-xl p-5 border border-emerald-500/20">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold">S</div>
          <h3 class="font-semibold text-white">Socratic Mode</h3>
        </div>
        <p class="text-sm text-gray-400 mb-3">Guided discovery through probing questions \u2014 never gives direct answers.</p>
        <div class="bg-white/[0.03] rounded-lg p-3 text-xs space-y-2">
          <div class="text-emerald-400">Student: "What is probability?"</div>
          <div class="text-gray-300">AI: "When you flip a coin, how many possible outcomes are there? And how many of those are \u2018heads\u2019? What ratio does that give you?"</div>
        </div>
      </div>
      <div class="glass rounded-xl p-5 border border-amber-500/20">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm font-bold">F</div>
          <h3 class="font-semibold text-white">Fermi Mode</h3>
        </div>
        <p class="text-sm text-gray-400 mb-3">Real-world estimation exercises that build quantitative intuition.</p>
        <div class="bg-white/[0.03] rounded-lg p-3 text-xs space-y-2">
          <div class="text-amber-400">Exercise: "How many math problems can a student solve in one year?"</div>
          <div class="text-gray-300">Step 1: Study days \u2248 300. Step 2: Problems/day \u2248 20. Step 3: Total \u2248 6,000 problems/year.</div>
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

<script>
var showcaseSocraticHistory = [];
var showcaseChatHistory = [];

function getSelectedDoc() {
  var sel = document.getElementById('showcase-doc');
  if (!sel || !sel.value) { alert('No document configured'); return null; }
  return sel.value;
}

function showcaseLoading() {
  document.getElementById('showcase-results').innerHTML = '<div class="flex items-center gap-2 py-8 justify-center"><div class="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin"></div><span class="text-sm text-gray-500">AI is thinking...</span></div>';
}

function showcaseAction(mode) {
  var docPath = getSelectedDoc();
  if (!docPath) return;
  document.getElementById('showcase-socratic-input').classList.add('hidden');
  document.getElementById('showcase-chat-input').classList.add('hidden');
  if (mode === 'socratic') { document.getElementById('showcase-socratic-input').classList.remove('hidden'); showcaseSocraticHistory = []; document.getElementById('showcase-results').innerHTML = '<div class="text-sm text-emerald-400/70 text-center py-8">Ask a Quantitative Aptitude question below \u2014 the Socratic tutor will guide you to discover the answer</div>'; return; }
  if (mode === 'chat') { document.getElementById('showcase-chat-input').classList.remove('hidden'); showcaseChatHistory = []; document.getElementById('showcase-results').innerHTML = '<div class="text-sm text-gray-500 text-center py-8">Ask any question about the QA textbook \u2014 percentages, algebra, probability, and more</div>'; return; }
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

module.exports = { documentsHomePage, projectDetailPage, documentViewerPage, knowledgeGraphPage, prathamShowcasePage, esc };
