/**
 * ANKR Viewer - Access Control Module
 * Manages document visibility (hide/show) and download permissions.
 * State persisted in .access.json alongside docs.
 */

const fs = require('fs');
const path = require('path');

const DOCS_ROOT = process.env.DOCS_ROOT || '/root/ankr-universe-docs';
const ACCESS_FILE = path.join(DOCS_ROOT, '.access.json');
const ADMIN_KEY = process.env.ANKR_ADMIN_KEY || 'ankr-admin-2026';

// In-memory cache
let accessConfig = { hidden: {}, noDownload: {} };

// Load on startup
function load() {
  try {
    if (fs.existsSync(ACCESS_FILE)) {
      accessConfig = JSON.parse(fs.readFileSync(ACCESS_FILE, 'utf-8'));
      if (!accessConfig.hidden) accessConfig.hidden = {};
      if (!accessConfig.noDownload) accessConfig.noDownload = {};
    }
  } catch (e) {
    console.error('[Access] Failed to load .access.json:', e.message);
    accessConfig = { hidden: {}, noDownload: {} };
  }
}
load();

function save() {
  try {
    fs.writeFileSync(ACCESS_FILE, JSON.stringify(accessConfig, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Access] Failed to save .access.json:', e.message);
  }
}

// ── Auth ──

function isAdmin(req) {
  const key = req.headers['x-ankr-admin'] || req.query._admin;
  return key === ADMIN_KEY;
}

// ── Visibility ──

function isHidden(relativePath) {
  if (!relativePath) return false;
  const norm = relativePath.replace(/\\/g, '/');
  return !!accessConfig.hidden[norm];
}

function setHidden(relativePath, hidden) {
  const norm = relativePath.replace(/\\/g, '/');
  if (hidden) {
    accessConfig.hidden[norm] = { by: 'admin', at: new Date().toISOString() };
  } else {
    delete accessConfig.hidden[norm];
  }
  save();
}

// ── Download ──

function isDownloadable(relativePath) {
  if (!relativePath) return true;
  const norm = relativePath.replace(/\\/g, '/');
  return !accessConfig.noDownload[norm];
}

function setDownloadable(relativePath, downloadable) {
  const norm = relativePath.replace(/\\/g, '/');
  if (!downloadable) {
    accessConfig.noDownload[norm] = { by: 'admin', at: new Date().toISOString() };
  } else {
    delete accessConfig.noDownload[norm];
  }
  save();
}

// ── Filtering ──

function filterFiles(files, isAdm) {
  if (isAdm) return files;
  return (files || []).filter(f => {
    const p = f.path || '';
    return !isHidden(p);
  });
}

function filterSearchResults(results, isAdm) {
  if (isAdm) return results;
  const hiddenPaths = Object.keys(accessConfig.hidden || {});
  if (hiddenPaths.length === 0) return results;

  // Build lookup sets for fast matching
  const hiddenFull = new Set(hiddenPaths.map(p => p.replace(/\\/g, '/')));
  const hiddenBasenames = new Set(hiddenPaths.map(p => {
    const base = p.replace(/\\/g, '/').split('/').pop() || '';
    return base.replace(/\.md$/i, '').toUpperCase();
  }));

  return (results || []).filter(r => {
    const p = (r.path || r.metadata?.path || '').replace(/\\/g, '/');
    // Direct full-path match
    if (hiddenFull.has(p)) return false;
    // With .md extension
    if (hiddenFull.has(p + '.md')) return false;
    // Check if any hidden path ends with this result path
    if (p && hiddenPaths.some(h => h.replace(/\\/g, '/').endsWith(p))) return false;
    if (p && hiddenPaths.some(h => h.replace(/\\/g, '/').endsWith(p + '.md'))) return false;
    // Basename match (search results often only have title as path)
    const basename = (p.split('/').pop() || '').replace(/\.md$/i, '').toUpperCase();
    if (basename && hiddenBasenames.has(basename)) return false;
    // Also check name/title fields
    const name = ((r.name || r.title || '')).replace(/\.md$/i, '').toUpperCase();
    if (name && hiddenBasenames.has(name)) return false;
    return true;
  });
}

// ── Full config ──

function getAccessConfig() {
  return { ...accessConfig };
}

function getHiddenPaths() {
  return Object.keys(accessConfig.hidden || {});
}

function getNoDownloadPaths() {
  return Object.keys(accessConfig.noDownload || {});
}

module.exports = {
  isAdmin,
  isHidden,
  isDownloadable,
  setHidden,
  setDownloadable,
  filterFiles,
  filterSearchResults,
  getAccessConfig,
  getHiddenPaths,
  getNoDownloadPaths,
};
