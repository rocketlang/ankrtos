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
body{background:#0a0a0f;color:#e4e4e7}
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
.doc-content table{width:100%;border-collapse:collapse;margin:1rem 0;font-size:.875rem}
.doc-content th{background:#16161d;padding:.5rem .75rem;text-align:left;border:1px solid #23232d;font-weight:600;color:#d4d4d8}
.doc-content td{padding:.5rem .75rem;border:1px solid #23232d;color:#a1a1aa}
.doc-content a{color:#a78bfa;text-decoration:underline;text-underline-offset:2px}
.doc-content a:hover{color:#c4b5fd}
.doc-content hr{border:none;border-top:1px solid #23232d;margin:1.5rem 0}
.doc-content img{max-width:100%;border-radius:8px;margin:1rem 0}
.highlight{background:rgba(124,58,237,0.15);padding:0 2px;border-radius:2px}
</style>
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
        Search docs...
        <kbd class="hidden sm:inline px-1.5 py-0.5 text-[10px] bg-white/10 rounded ml-2">Ctrl+K</kbd>
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
  const href = doc.path.endsWith('.md') ? '/view/' + encodeURIComponent(doc.path) : '/view/' + encodeURIComponent(doc.path);
  const excerpt = (doc.excerpt || '').slice(0, 140);
  const similarity = doc.similarity ? '<span class="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full">' + doc.similarity + '%</span>' : '';
  const score = doc.score ? '<span class="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded-full">score ' + doc.score + '</span>' : '';
  const tags = (doc.tags || []).slice(0, 2).map(t => '<span class="text-[10px] px-1.5 py-0.5 bg-cyan-500/15 text-cyan-400 rounded-full">' + esc(t) + '</span>').join('');

  return '<a href="' + href + '" class="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors">'
    + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" class="mt-0.5 flex-shrink-0"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>'
    + '<div class="flex-1 min-w-0">'
    + '<div class="font-medium text-sm text-gray-200 truncate">' + esc(doc.name) + '</div>'
    + (excerpt ? '<div class="text-xs text-gray-500 mt-0.5 line-clamp-1">' + esc(excerpt) + '</div>' : '')
    + '<div class="flex items-center gap-1.5 mt-1 flex-wrap">' + tags + similarity + score + '</div>'
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
</script>`;
}

// ============================================
// PAGE: Documents Home (/project/documents/)
// ============================================
function documentsHomePage(projects) {
  const featured = projects.filter(p => p.featured);
  const rest = projects.filter(p => !p.featured);

  let projectCards = '';
  for (const p of featured) {
    projectCards += projectCard(p, true);
  }
  for (const p of rest) {
    projectCards += projectCard(p, false);
  }

  return htmlHead('Documents') + `
<body class="min-h-screen">
${navbar('docs')}
${searchModal()}

<main class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
  <!-- Hero / Search -->
  <div class="text-center mb-10">
    <h1 class="text-3xl sm:text-4xl font-bold text-white mb-3">ANKR Documentation</h1>
    <p class="text-gray-400 mb-6 max-w-xl mx-auto">Browse project reports, architecture docs, TODOs, and investor materials across the ANKR ecosystem.</p>
    <div class="max-w-xl mx-auto">
      <div class="relative">
        <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input id="hero-search" type="text" placeholder="Search all documents... (Ctrl+K)" autocomplete="off"
          class="w-full pl-12 pr-4 py-3.5 bg-card border border-border rounded-xl text-base placeholder:text-gray-600 outline-none search-glow transition-all focus:border-brand/50"
          onfocus="document.getElementById('search-modal').classList.remove('hidden');document.getElementById('search-input').focus();this.blur()">
      </div>
    </div>
  </div>

  <!-- Stats bar -->
  <div class="flex items-center justify-center gap-6 mb-8 text-sm text-gray-500">
    <span><strong class="text-gray-300">${projects.length}</strong> projects</span>
    <span><strong class="text-gray-300">${projects.reduce((s,p) => s + (p.fileCount || 0), 0)}</strong> documents</span>
    <span id="eon-badge"></span>
  </div>

  ${featured.length > 0 ? `
  <!-- Featured Projects -->
  <div class="mb-8">
    <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      Featured
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      ${featured.map(p => projectCard(p, true)).join('')}
    </div>
  </div>` : ''}

  <!-- All Projects -->
  <div>
    <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">All Projects</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      ${rest.map(p => projectCard(p, false)).join('')}
    </div>
  </div>
</main>

<footer class="border-t border-border mt-16 py-6 text-center text-xs text-gray-600">
  ANKR Labs &middot; Documentation Portal &middot; Powered by eon hybrid search
</footer>

<script>
fetch('/api/health').then(r=>r.json()).then(d=>{
  const badge = document.getElementById('eon-badge');
  if(d.eon && d.eon.available) {
    badge.innerHTML='<span class="flex items-center gap-1 text-emerald-400"><span class="w-2 h-2 bg-emerald-400 rounded-full"></span> AI Search Active</span>';
  } else {
    badge.innerHTML='<span class="text-amber-400">Regex mode</span>';
  }
});
</script>
</body></html>`;
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

  const href = p.path ? '/project/documents/' + p.id : '/project/documents/' + p.id;

  return `
<a href="${href}" class="block glass rounded-xl p-5 ${border} transition-all hover:bg-white/[0.02] group">
  <div class="flex items-start justify-between mb-2">
    <div class="flex items-center gap-2">
      ${featured ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' : ''}
      <h3 class="font-semibold text-white group-hover:text-brand transition-colors">${esc(p.title)}</h3>
    </div>
    <span class="text-xs text-gray-600">${p.fileCount || 0} docs</span>
  </div>
  ${p.description ? `<p class="text-sm text-gray-400 line-clamp-2 mb-2">${esc(p.description)}</p>` : ''}
  ${statsHtml}
  <div class="flex flex-wrap gap-1 mt-3">${tagsHtml}</div>
</a>`;
}

// ============================================
// PAGE: Project Detail (/project/documents/:id)
// ============================================
function projectDetailPage(project, relatedProjects) {
  const statsHtml = project.stats && Object.keys(project.stats).length > 0
    ? Object.entries(project.stats).map(([k,v]) =>
        `<div class="glass rounded-lg p-3 text-center">
          <div class="text-xl font-bold text-white">${esc(String(v))}</div>
          <div class="text-xs text-gray-500 mt-1">${esc(k.replace(/([A-Z])/g, ' $1').trim())}</div>
        </div>`
      ).join('')
    : '';

  const filesHtml = (project.files || []).map(f => `
    <a href="/view/${encodeURIComponent(f.path)}" class="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.04] transition-colors group">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" class="flex-shrink-0"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
      <div class="flex-1 min-w-0">
        <div class="font-medium text-sm text-gray-200 group-hover:text-white truncate">${esc(f.title || f.name)}</div>
        <div class="text-xs text-gray-600">${f.size ? (f.size / 1024).toFixed(1) + ' KB' : ''} ${f.category ? '&middot; ' + esc(f.category) : ''}</div>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"><path d="m9 18 6-6-6-6"/></svg>
    </a>
  `).join('');

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
          `<div class="flex items-start gap-2 py-1"><span class="text-gray-500 min-w-[80px]">${esc(k)}:</span><span class="text-gray-300">${esc(Array.isArray(v) ? v.join(', ') : String(v))}</span></div>`
        ).join('')
      + '</div>'
    : '';

  return htmlHead(doc.title || 'Document', '<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>') + `
<body class="min-h-screen">
${navbar()}
${searchModal()}

<main class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
  <!-- Breadcrumb -->
  <nav class="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
    <a href="/project/documents/" class="hover:text-gray-300 transition-colors">Docs</a>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
    <span class="text-gray-300 truncate">${esc(doc.title || doc.fileName)}</span>
  </nav>

  <div class="flex gap-8">
    <!-- Main Content -->
    <article class="flex-1 min-w-0">
      ${frontmatterHtml}
      <div id="doc-content" class="doc-content"></div>
    </article>

    <!-- Sidebar -->
    <aside class="hidden lg:block w-64 flex-shrink-0">
      <div class="sticky top-20">
        <!-- Table of Contents -->
        <div class="mb-6">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">On this page</h3>
          <nav id="toc" class="text-sm space-y-1 max-h-[40vh] overflow-y-auto"></nav>
        </div>

        ${relatedHtml ? `
        <div>
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Related</h3>
          <div class="space-y-1">${relatedHtml}</div>
        </div>` : ''}
      </div>
    </aside>
  </div>
</main>

<footer class="border-t border-border mt-16 py-6 text-center text-xs text-gray-600">
  ANKR Labs &middot; Documentation Portal
</footer>

<script>
const rawContent = ${JSON.stringify(doc.content || '')};
const contentEl = document.getElementById('doc-content');
const tocEl = document.getElementById('toc');

// Render markdown
if (typeof marked !== 'undefined') {
  marked.setOptions({
    gfm: true,
    breaks: false,
    headerIds: true,
  });
  contentEl.innerHTML = marked.parse(rawContent);
} else {
  // Fallback: basic rendering
  contentEl.innerHTML = '<pre style="white-space:pre-wrap">' + rawContent.replace(/</g,'&lt;') + '</pre>';
}

// Build TOC from rendered headings
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
</script>
</body></html>`;
}

module.exports = { documentsHomePage, projectDetailPage, documentViewerPage, esc };
