#!/usr/bin/env bun

/**
 * Update ANKR Viewer to use Hybrid Search API
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Updating Viewer with Hybrid Search Integration\n');

// 1. Create search proxy config for viewer
const searchConfig = `
// Hybrid Search API Configuration
export const SEARCH_API = {
  baseUrl: 'http://localhost:4446',
  endpoints: {
    search: '/search',
    health: '/health',
  },
  timeout: 30000,
};

export async function hybridSearch(query, options = {}) {
  const { project, limit = 10 } = options;
  
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
  });
  
  if (project) {
    params.append('project', project);
  }
  
  const response = await fetch(\`\${SEARCH_API.baseUrl}\${SEARCH_API.endpoints.search}?\${params}\`);
  
  if (!response.ok) {
    throw new Error(\`Search failed: \${response.statusText}\`);
  }
  
  return await response.json();
}
`;

fs.writeFileSync('/var/www/ankr-interact/project/documents/search-config.js', searchConfig);
console.log('✅ Created search-config.js\n');

// 2. Create simple search UI
const searchUI = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ANKR Hybrid Search</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a1a;
            color: #e0e0e0;
            padding: 0;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        .header h1 {
            color: white;
            font-size: 2em;
            margin-bottom: 20px;
        }
        .search-box {
            max-width: 800px;
            margin: 0 auto;
        }
        .search-input-wrapper {
            position: relative;
            margin-bottom: 15px;
        }
        .search-input {
            width: 100%;
            padding: 16px 50px 16px 20px;
            font-size: 1.1em;
            border: none;
            border-radius: 8px;
            background: white;
            color: #333;
        }
        .search-button {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: #667eea;
            color: white;
            border: none;
            padding: 8px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
        }
        .search-button:hover {
            background: #764ba2;
        }
        .filters {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .filter-select {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            background: rgba(255,255,255,0.2);
            color: white;
            cursor: pointer;
        }
        .container {
            max-width: 1200px;
            margin: 40px auto;
            padding: 0 40px;
        }
        .stats {
            background: #2a2a2a;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            display: flex;
            gap: 40px;
        }
        .stat {
            flex: 1;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        .stat-label {
            color: #888;
            margin-top: 5px;
        }
        .results {
            display: grid;
            gap: 20px;
        }
        .result-card {
            background: #2a2a2a;
            border-radius: 12px;
            padding: 24px;
            border-left: 4px solid #667eea;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .result-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(102, 126, 234, 0.3);
        }
        .result-title {
            font-size: 1.3em;
            color: #667eea;
            margin-bottom: 10px;
            text-decoration: none;
            display: block;
        }
        .result-title:hover {
            color: #8b9aff;
        }
        .result-meta {
            display: flex;
            gap: 15px;
            color: #888;
            font-size: 0.9em;
            margin-bottom: 10px;
        }
        .result-snippet {
            color: #ccc;
            line-height: 1.6;
        }
        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: 600;
        }
        .badge-file { background: #10b981; color: white; }
        .badge-vector { background: #f59e0b; color: white; }
        .loading {
            text-align: center;
            padding: 60px;
            color: #666;
        }
        .spinner {
            display: inline-block;
            width: 40px;
            height: 40px;
            border: 4px solid #333;
            border-top-color: #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="search-box">
            <h1>🔍 ANKR Hybrid Search</h1>
            <div class="search-input-wrapper">
                <input 
                    type="text" 
                    class="search-input" 
                    id="searchInput"
                    placeholder="Search 3,319 documents..."
                    autofocus
                >
                <button class="search-button" onclick="performSearch()">Search</button>
            </div>
            <div class="filters">
                <select class="filter-select" id="projectFilter">
                    <option value="">All Projects</option>
                    <option value="pratham-telehub">Pratham TeleHub</option>
                    <option value="ankr-docs">ANKR Docs</option>
                    <option value="ankr-labs">ANKR Labs</option>
                </select>
                <select class="filter-select" id="limitFilter">
                    <option value="10">10 results</option>
                    <option value="25">25 results</option>
                    <option value="50">50 results</option>
                </select>
            </div>
        </div>
    </div>

    <div class="container">
        <div id="stats" style="display: none;"></div>
        <div id="results"></div>
    </div>

    <script>
        const searchInput = document.getElementById('searchInput');
        const resultsDiv = document.getElementById('results');
        const statsDiv = document.getElementById('stats');

        // Search on Enter key
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });

        async function performSearch() {
            const query = searchInput.value.trim();
            if (!query) return;

            const project = document.getElementById('projectFilter').value;
            const limit = document.getElementById('limitFilter').value;

            // Show loading
            resultsDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Searching...</p></div>';
            statsDiv.style.display = 'none';

            try {
                const params = new URLSearchParams({
                    q: query,
                    limit: limit
                });
                if (project) params.append('project', project);

                const response = await fetch('http://localhost:4446/search?' + params);
                const data = await response.json();

                displayResults(data);
            } catch (error) {
                resultsDiv.innerHTML = '<div class="loading"><p style="color: #ef4444;">Error: ' + error.message + '</p></div>';
            }
        }

        function displayResults(data) {
            // Show stats
            statsDiv.style.display = 'flex';
            statsDiv.innerHTML = \`
                <div class="stat">
                    <div class="stat-value">\${data.total}</div>
                    <div class="stat-label">Results Found</div>
                </div>
                <div class="stat">
                    <div class="stat-value">\${data.elapsed_ms}ms</div>
                    <div class="stat-label">Search Time</div>
                </div>
                <div class="stat">
                    <div class="stat-value">\${data.tiers_used ? data.tiers_used.join(' + ') : 'N/A'}</div>
                    <div class="stat-label">Search Tiers</div>
                </div>
            \`;

            // Show results
            if (data.results.length === 0) {
                resultsDiv.innerHTML = '<div class="loading"><p>No results found</p></div>';
                return;
            }

            resultsDiv.innerHTML = data.results.map(result => \`
                <div class="result-card">
                    <a href="\${result.url}" class="result-title" target="_blank">
                        \${result.title || 'Untitled'}
                    </a>
                    <div class="result-meta">
                        <span>📁 \${result.project}</span>
                        <span>📂 \${result.category || 'General'}</span>
                        <span>📏 \${(result.size / 1024).toFixed(1)} KB</span>
                        <span class="badge \${result.source === 'file_index' ? 'badge-file' : 'badge-vector'}">
                            \${result.source === 'file_index' ? '⚡ File Index' : '🎯 Vector Search'}
                        </span>
                    </div>
                    \${result.snippet ? \`<div class="result-snippet">\${result.snippet}</div>\` : ''}
                </div>
            \`).join('');
        }

        // Auto-focus search on load
        setTimeout(() => searchInput.focus(), 100);
    </script>
</body>
</html>
`;

fs.writeFileSync('/var/www/ankr-interact/project/documents/search.html', searchUI);
console.log('✅ Created search.html\n');

console.log('='.repeat(60));
console.log('✅ Viewer Integration Complete!');
console.log('='.repeat(60));
console.log('');
console.log('🌐 Access the new search:');
console.log('   https://ankr.in/project/documents/search.html');
console.log('');
console.log('📊 Features:');
console.log('   • Searches 3,319 documents');
console.log('   • File Index (17ms) + Vector Search');
console.log('   • Filter by project');
console.log('   • Shows search tier used');
console.log('');
