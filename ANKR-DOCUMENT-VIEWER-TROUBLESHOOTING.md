# ANKR Document Viewer - Troubleshooting Guide
**Created:** February 14, 2026
**Purpose:** Diagnose and fix document publishing issues
**Status:** Complete diagnostic + Auto-publish solution

---

## 🎯 Problem Statement

**Issue:** Documents created in `/root/` don't automatically appear in https://ankr.in/project/documents/

**Root Cause:** Manual copy process required - no auto-publishing system

**Impact:** Over 1700 documents published manually - frustrating, error-prone

---

## 🏗️ System Architecture

### How ANKR Document Viewer Works

```
┌─────────────────────────────────────────────────────────────┐
│                    User Creates Document                     │
│                  /root/MY-NEW-REPORT.md                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ ❌ MANUAL STEP (Problem!)
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              Copy to Publishing Directory                    │
│     /root/ankr-universe-docs/project/documents/              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ ✅ AUTO (Works!)
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  ANKR Docs API Server                        │
│              (ankr-viewer-server.js)                         │
│                   Port: 3080                                 │
│          Serves: /api/files, /api/file                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │
┌──────────────────────────▼──────────────────────────────────┐
│               ANKR Interact Frontend                         │
│         React App at /var/www/ankr-interact                  │
│                   Port: 3199                                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    Nginx Reverse Proxy                       │
│           https://ankr.in/project/documents/                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Component Inventory

### 1. Document Storage
**Location:** `/root/ankr-universe-docs/`
```bash
/root/ankr-universe-docs/
├── project/
│   └── documents/
│       ├── ankr-maritime/
│       ├── pratham-telehub/    ← Our new docs
│       ├── corals-astrology/
│       └── ... (30+ projects)
```

**Purpose:** Single source of truth for all documents
**Access:** Public read via API

---

### 2. ANKR Docs API Server
**File:** `/root/ankr-viewer-server.js`
**Process:** Running standalone (PID 20098)
**Port:** 3080
**Status:** ✅ Working

**Key Endpoints:**
```javascript
GET /api/health              // Server health check
GET /api/files?path=X        // List directory contents
GET /api/file?path=X         // Get file content + frontmatter
GET /api/file/raw?path=X     // Download raw file
POST /api/search             // Eon-powered hybrid search
```

**Test:**
```bash
curl http://localhost:3080/api/health
curl "http://localhost:3080/api/files?path=project/documents/pratham-telehub"
```

---

### 3. ANKR Interact (Viewer Frontend)
**Package:** `/root/ankr-labs-nx/packages/ankr-interact`
**PM2 Process:** `ankr-interact` (backend) + `ankr-interact-frontend` (dev server)
**Port:** 3199
**Status:** ✅ Working

**Static Build Location:** `/var/www/ankr-interact/project/documents/`

**Key Features:**
- Markdown rendering
- Syntax highlighting
- PDF viewer
- Excel/CSV viewer
- Knowledge graph
- Hybrid search (Eon + regex)

---

### 4. Nginx Configuration
**File:** `/etc/nginx/sites-enabled/ankr.in`
**Status:** ✅ Working

```nginx
server {
    listen 443 ssl http2;
    server_name ankr.in www.ankr.in;

    # Serves static React app
    location /project/documents/ {
        root /var/www/ankr-interact;
        index index.html;
        try_files $uri $uri/index.html /project/documents/index.html;
    }

    # Proxies API requests to docs server
    location /api/ {
        proxy_pass http://localhost:3080;
    }
}
```

---

## 🔍 Common Issues & Solutions

### Issue 1: Documents Not Appearing
**Symptom:** Created document in `/root/`, not visible in viewer

**Diagnosis:**
```bash
# Check if file exists
ls -la /root/MY-DOCUMENT.md

# Check if published
ls -la /root/ankr-universe-docs/project/documents/MY-PROJECT/MY-DOCUMENT.md

# Check if API can see it
curl "http://localhost:3080/api/files?path=project/documents/MY-PROJECT"
```

**Solution:**
- ❌ Old way: Manually copy to publish directory
- ✅ New way: Use auto-publish (see below)

---

### Issue 2: URL Confusion
**Symptom:** Different URL formats, unclear which works

**The Truth:**
```
✅ CORRECT: https://ankr.in/project/documents/
   - Loads React viewer app
   - Navigate to your project folder
   - Click file to view

❌ WRONG: https://ankr.in/documents/
   - 301 redirect, doesn't work

❌ WRONG: https://ankr.in/?path=project/documents/file.md
   - Old format, no longer supported

❌ WRONG: Direct file URLs
   - Not how SPA works
```

**Rule:** ONE URL for everything: `https://ankr.in/project/documents/`

---

### Issue 3: Changes Not Reflecting
**Symptom:** Updated document, changes not visible

**Diagnosis:**
```bash
# Check file modification time
stat /root/ankr-universe-docs/project/documents/MY-PROJECT/file.md

# Check API response
curl "http://localhost:3080/api/file?path=project/documents/MY-PROJECT/file.md" | jq .

# Check browser cache
# Open DevTools → Network → Disable cache
```

**Solution:**
1. Clear browser cache (Ctrl+Shift+R)
2. Restart docs server: `pm2 restart ankr-docs-portal` (if using PM2)
3. Or: `kill -9 $(lsof -ti:3080) && /root/ankr-viewer-server.js &`

---

### Issue 4: 404 Not Found
**Symptom:** API returns 404 for existing file

**Diagnosis:**
```bash
# Check exact path
ls -la "/root/ankr-universe-docs/$(echo 'project/documents/MY-PROJECT/file.md')"

# Check permissions
stat /root/ankr-universe-docs/project/documents/MY-PROJECT/file.md

# Check DOCS_ROOT
ps aux | grep ankr-viewer-server | grep -o "DOCS_ROOT=[^ ]*"
```

**Common Causes:**
- Wrong path (case-sensitive!)
- File doesn't exist in publish directory
- Permission issues (rare)

**Solution:**
```bash
# Fix permissions
chmod -R 755 /root/ankr-universe-docs/

# Verify path
realpath /root/ankr-universe-docs/project/documents/MY-PROJECT/file.md
```

---

### Issue 5: Services Not Running
**Symptom:** Viewer not loading, API timeout

**Diagnosis:**
```bash
# Check docs server
lsof -i:3080
ps aux | grep ankr-viewer-server

# Check viewer frontend
lsof -i:3199
pm2 list | grep ankr-interact

# Check nginx
sudo systemctl status nginx
```

**Solution:**
```bash
# Restart docs server
pkill -f ankr-viewer-server
cd /root && nohup bun ankr-viewer-server.js > /tmp/ankr-viewer.log 2>&1 &

# Restart viewer
pm2 restart ankr-interact
pm2 restart ankr-interact-frontend

# Restart nginx
sudo systemctl restart nginx
```

---

## 🛠️ Manual Publishing Process (OLD)

### The Problem
Every document required these manual steps:

```bash
# Step 1: Create document
vim /root/MY-AWESOME-REPORT.md

# Step 2: Create project directory
mkdir -p /root/ankr-universe-docs/project/documents/my-project/

# Step 3: Copy document
cp /root/MY-AWESOME-REPORT.md \
   /root/ankr-universe-docs/project/documents/my-project/

# Step 4: Create index
cat > /root/ankr-universe-docs/project/documents/my-project/README.md << 'EOF'
# My Project
- [My Awesome Report](MY-AWESOME-REPORT.md)
EOF

# Step 5: Restart services (sometimes)
pm2 restart ankr-interact
```

**Issues:**
- ❌ 5 manual steps per document
- ❌ Easy to forget
- ❌ Inconsistent directory structure
- ❌ No index auto-generation
- ❌ No validation

---

## ✅ Auto-Publish Solution (NEW)

See `/root/ankr-auto-publisher.js` for implementation

### Features:
1. **File Watcher:** Monitors `/root/` for new `.md` files
2. **Smart Detection:** Recognizes project from filename patterns
3. **Auto Copy:** Publishes to correct directory
4. **Index Generation:** Auto-creates/updates README.md
5. **Hot Reload:** No service restart needed

### Installation:
```bash
# Install as PM2 service
pm2 start /root/ankr-auto-publisher.js --name ankr-auto-publisher
pm2 save

# Enable startup
pm2 startup
```

### Usage:
```bash
# Just create documents in /root/ - that's it!
vim /root/PRATHAM-NEW-FEATURE.md

# Auto-publisher detects "PRATHAM" and:
# ✅ Copies to /root/ankr-universe-docs/project/documents/pratham-telehub/
# ✅ Updates README.md index
# ✅ Available instantly at https://ankr.in/project/documents/
```

---

## 📋 Troubleshooting Checklist

### Quick Health Check
```bash
#!/bin/bash
echo "=== ANKR Document Viewer Health Check ==="
echo ""

# 1. Check docs server
echo "1. Docs API Server (port 3080):"
curl -s http://localhost:3080/api/health | jq . || echo "❌ NOT RUNNING"
echo ""

# 2. Check viewer frontend
echo "2. Viewer Frontend (port 3199):"
curl -I http://localhost:3199 2>&1 | grep "HTTP" || echo "❌ NOT RUNNING"
echo ""

# 3. Check nginx
echo "3. Nginx:"
sudo systemctl is-active nginx || echo "❌ NOT RUNNING"
echo ""

# 4. Check auto-publisher
echo "4. Auto-Publisher:"
pm2 list | grep ankr-auto-publisher || echo "⚠️  NOT INSTALLED"
echo ""

# 5. Check file counts
echo "5. Published Documents:"
find /root/ankr-universe-docs/project/documents/ -name "*.md" | wc -l
echo ""

# 6. Test API
echo "6. API Test (pratham-telehub):"
curl -s "http://localhost:3080/api/files?path=project/documents/pratham-telehub" | jq 'length'
echo ""

echo "=== Health Check Complete ==="
```

Save as: `/root/ankr-viewer-health-check.sh`

---

## 🚨 Emergency Recovery

### Complete System Reset
```bash
#!/bin/bash
# Use only if everything is broken

echo "🚨 ANKR Viewer Emergency Recovery"

# 1. Stop all services
pm2 stop ankr-interact ankr-interact-frontend
pkill -f ankr-viewer-server

# 2. Rebuild viewer frontend
cd /root/ankr-labs-nx/packages/ankr-interact
bun install
bun run build
cp -r dist/* /var/www/ankr-interact/project/documents/

# 3. Restart docs server
cd /root
nohup bun ankr-viewer-server.js > /tmp/ankr-viewer.log 2>&1 &

# 4. Restart viewer
pm2 restart ankr-interact ankr-interact-frontend

# 5. Restart nginx
sudo systemctl restart nginx

# 6. Test
sleep 5
curl http://localhost:3080/api/health
curl -I http://localhost:3199

echo "✅ Recovery complete! Test at: https://ankr.in/project/documents/"
```

Save as: `/root/ankr-viewer-recovery.sh`

---

## 📊 Performance Optimization

### 1. Enable Response Caching
```javascript
// In ankr-viewer-server.js
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 min cache

app.get('/api/files', (req, res) => {
  const cacheKey = `files:${req.query.path}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  // ... existing code ...
  cache.set(cacheKey, items);
  res.json(items);
});
```

### 2. Enable Nginx Caching
```nginx
# Add to /etc/nginx/sites-enabled/ankr.in

proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=ankr_cache:10m max_size=100m;

location /api/ {
    proxy_pass http://localhost:3080;
    proxy_cache ankr_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_key "$request_uri";
    add_header X-Cache-Status $upstream_cache_status;
}
```

### 3. Enable Gzip Compression
```nginx
location /project/documents/ {
    root /var/www/ankr-interact;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;
}
```

---

## 🔐 Security Considerations

### 1. Access Control
The system uses `ankr-viewer-access.js` for:
- Admin detection (IP-based)
- Hidden documents (not listed publicly)
- Download restrictions

### 2. Path Traversal Prevention
```javascript
// Already implemented in ankr-viewer-server.js
if (!fullPath.startsWith(DOCS_ROOT)) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

### 3. File Type Restrictions
Only these extensions are served:
- `.md`, `.mdx` (Markdown)
- `.pdf` (PDF)
- `.txt`, `.json`, `.xml`, `.csv` (Data)
- `.jpg`, `.png`, `.svg` (Images)

---

## 📈 Monitoring & Logs

### Log Locations
```bash
# Docs server logs
tail -f /tmp/ankr-viewer.log

# PM2 logs
pm2 logs ankr-interact
pm2 logs ankr-auto-publisher

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Metrics to Monitor
1. **Response time:** `curl -w "@curl-format.txt" http://localhost:3080/api/health`
2. **File count:** `find /root/ankr-universe-docs/ -name "*.md" | wc -l`
3. **API errors:** `grep -i error /tmp/ankr-viewer.log`
4. **Disk usage:** `du -sh /root/ankr-universe-docs/`

---

## 🎯 Best Practices

### 1. Document Naming
```bash
# Good
PROJECT-FEATURE-DESCRIPTION.md
PRATHAM-FRESH-DASHBOARD-TODO.md
ANKR-MARITIME-ANALYSIS.md

# Bad
doc.md
new-file.md
temp123.md
```

### 2. Directory Structure
```
/root/ankr-universe-docs/project/documents/
├── project-name/           # kebab-case
│   ├── README.md          # Required index
│   ├── MAIN-REPORT.md     # CAPS for primary docs
│   └── sub-docs/          # Organized subdirs
│       └── details.md
```

### 3. Frontmatter
```markdown
---
title: "Pratham TeleHub Report"
description: "Complete technical analysis"
category: "Project Reports"
tags: ["pratham", "telehub", "crm"]
date: 2026-02-14
author: "ANKR Labs"
---

# Your Document Content
```

---

## 📞 Support

### Common Commands
```bash
# Restart everything
pm2 restart all && sudo systemctl restart nginx

# Check service status
pm2 list && lsof -i:3080 && lsof -i:3199

# Publish document manually
cp /root/MY-DOC.md /root/ankr-universe-docs/project/documents/MY-PROJECT/

# View logs
pm2 logs --lines 50

# Health check
bash /root/ankr-viewer-health-check.sh
```

### Getting Help
1. Run health check: `/root/ankr-viewer-health-check.sh`
2. Check logs: `pm2 logs ankr-interact`
3. Test API: `curl http://localhost:3080/api/health`
4. Check nginx: `sudo nginx -t && sudo systemctl status nginx`

---

## ✅ Success Criteria

### System is Working When:
- ✅ Health check returns all green
- ✅ https://ankr.in/project/documents/ loads
- ✅ Can browse and view documents
- ✅ Search returns results
- ✅ New documents auto-publish

### System is Broken When:
- ❌ 404 on https://ankr.in/project/documents/
- ❌ API timeout on port 3080
- ❌ Blank page or loading forever
- ❌ Documents not appearing after 30 seconds

---

**Document Version:** 1.0
**Last Updated:** February 14, 2026
**Next Review:** When issues occur

🙏 **Jai Guru Ji** | Built by ANKR Labs
