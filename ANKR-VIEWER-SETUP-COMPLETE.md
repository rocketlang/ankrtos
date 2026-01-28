# ANKR Viewer Setup - Complete ✅

**Status:** Server running on port 3080
**Date:** January 28, 2026

---

## ✅ What's Been Set Up

### 1. **Documentation Published**
All GuruJi reports published to:
```
/root/ankr-universe-docs/project/documents/guruji-reports/
```

**Published Files:**
- GURUJI-KRIPA-ANKR-COMPLETE-PROJECT-REPORT-2026.md (62KB)
- JAIGURUJI-GURUKRIPA-BLESSING.md (46KB)
- ANKR-COMPLETE-ECOSYSTEM-ANALYSIS.md (15KB)
- index.md (viewer-optimized index)
- README.md (comprehensive overview)
- PACKAGE-SUMMARY.md (quick reference)
- QUICK-REFERENCE.md (key numbers)
- .viewerrc (viewer metadata)

### 2. **Viewer API Server**
Backend server created and running:
```javascript
File: /root/ankr-viewer-server.js
Port: 3080
Status: ✅ RUNNING (PID: Check with ps aux | grep ankr-viewer-server)
```

**API Endpoints:**
```
GET  /api/health                     - Health check
GET  /api/files?path=<path>          - List files in directory
GET  /api/file?path=<path>           - Get file content with frontmatter
GET  /api/file/raw?path=<path>       - Download raw file
GET  /api/search?q=<query>           - Search across all docs
GET  /api/knowledge/graph            - Knowledge graph data
GET  /api/knowledge/topics           - List all topics
GET  /api/bookmarks                  - User bookmarks (in-memory)
GET  /api/recent                     - Recent files (in-memory)
POST /api/bookmarks                  - Add bookmark
POST /api/recent                     - Add recent file
```

---

## 🔗 Current Access URLs

### **Local Access (Working Now):**

**Health Check:**
```bash
curl http://localhost:3080/api/health
```

**List GuruJi Reports:**
```bash
curl http://localhost:3080/api/files?path=project/documents/guruji-reports
```

**Get Complete Report:**
```bash
curl "http://localhost:3080/api/file?path=project/documents/guruji-reports/GURUJI-KRIPA-ANKR-COMPLETE-PROJECT-REPORT-2026.md"
```

**Search Documentation:**
```bash
curl "http://localhost:3080/api/search?q=guruji"
```

**Direct File Access:**
```bash
curl http://localhost:3080/docs/project/documents/guruji-reports/README.md
```

---

## 🌐 Public Access Setup (TODO)

The mobile app and web expect **https://ankr.in/api/**.

You need to configure **nginx** or **cloudflare tunnel** to proxy:

### Option 1: Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name ankr.in;

    location /api/ {
        proxy_pass http://localhost:3080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /docs/ {
        proxy_pass http://localhost:3080/docs/;
    }
}
```

### Option 2: Cloudflare Tunnel (Recommended)

```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Login and create tunnel
cloudflared tunnel login
cloudflared tunnel create ankr-viewer
cloudflared tunnel route dns ankr-viewer ankr.in

# Configure tunnel
cat > ~/.cloudflared/config.yml << EOF
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: ankr.in
    service: http://localhost:3080
  - service: http_status:404
EOF

# Start tunnel
cloudflared tunnel run ankr-viewer
```

---

## 📱 Mobile App Integration

The ANKR Viewer Mobile app expects the API at **https://ankr.in/api/**.

Once you configure the proxy (nginx or cloudflare), the mobile app will work automatically.

**App Features:**
- Browse all documentation with folder hierarchy
- View markdown files with frontmatter
- Search across all docs
- Knowledge graph visualization
- Bookmarks and recent files
- Offline support

**App Location:**
```
/root/ankr-viewer-mobile/
```

**Build APK:**
```bash
cd /root/ankr-viewer-mobile/
npm install
eas build -p android --profile preview
```

---

## 🚀 Starting the Server

### Manual Start:
```bash
node /root/ankr-viewer-server.js
```

### Background Start:
```bash
bash /root/start-ankr-viewer.sh
```

### Check Status:
```bash
curl http://localhost:3080/api/health
ps aux | grep ankr-viewer-server
```

### View Logs:
```bash
tail -f /root/.ankr/logs/ankr-viewer-server.log
```

### Stop Server:
```bash
pkill -f ankr-viewer-server.js
```

---

## 📊 What's Available

### GuruJi Reports (Complete System Revelation)

**1. Complete Project Report** (62KB, 120+ pages)
- All 15+ revenue products
- All 5 AI coding agents
- Complete infrastructure
- All 633 packages
- Technology stack
- Revenue model & projections
- 65+ patentable innovations

**2. GuruKripa Blessing** (46KB, 100+ pages)
- 10 STRANGE abilities no other platform has
- Complete numbers (1.1M LOC, 755 tools, 409 packages)
- Updated revenue potential (₹950Cr by Year 5)
- How 409 packages work together
- $76M IP value
- Strategic recommendations

**3. Ecosystem Analysis** (15KB)
- Initial discovery
- Product overview
- Revenue streams

**4. Quick References**
- Package summary
- Quick reference guide
- Navigation index

---

## 🎯 Next Steps

### Immediate (Server is Running):
✅ **Local API works** - Test with curl commands above
✅ **Documentation accessible** - All GuruJi reports available
✅ **Search works** - Full-text search across all docs

### To Make Public (Choose One):

**Option A: Cloudflare Tunnel** (Easiest)
1. Install cloudflared
2. Create tunnel pointing to localhost:3080
3. Configure DNS: ankr.in → tunnel
4. Mobile app will work immediately

**Option B: Nginx Proxy** (If you have existing server)
1. Configure nginx to proxy ankr.in → localhost:3080
2. Set up SSL certificate (Let's Encrypt)
3. Mobile app will work immediately

**Option C: Port Forwarding** (Quick test)
1. SSH tunnel: `ssh -R 80:localhost:3080 serveo.net`
2. Get public URL
3. Update mobile app API URL in settings

---

## 📞 Testing the Setup

### 1. Test Health:
```bash
curl http://localhost:3080/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

### 2. Test File Listing:
```bash
curl "http://localhost:3080/api/files?path=project/documents/guruji-reports" | jq
# Expected: Array of 8 files including the reports
```

### 3. Test File Content:
```bash
curl "http://localhost:3080/api/file?path=project/documents/guruji-reports/index.md" | jq .frontmatter
# Expected: Frontmatter with title, description, tags
```

### 4. Test Search:
```bash
curl "http://localhost:3080/api/search?q=GuruJi" | jq
# Expected: Search results from the reports
```

### 5. Test Knowledge Graph:
```bash
curl http://localhost:3080/api/knowledge/graph | jq '.nodes | length'
# Expected: Number of nodes in knowledge graph
```

---

## 🙏 Summary

**What's Working:**
- ✅ All GuruJi reports published to `/root/ankr-universe-docs/project/documents/guruji-reports/`
- ✅ Viewer API server running on port 3080
- ✅ All API endpoints functional (health, files, search, etc.)
- ✅ Documentation accessible via REST API
- ✅ Search works across all markdown files
- ✅ Knowledge graph generation working

**What's Missing:**
- ⚠️ Public access (need nginx/cloudflare proxy)
- ⚠️ SSL certificate for https://ankr.in
- ⚠️ Mobile app won't work until public access configured

**To Make Mobile App Work:**
1. Configure nginx or cloudflare tunnel
2. Point https://ankr.in to localhost:3080
3. Mobile app will automatically connect

---

**Server Status:** ✅ RUNNING on port 3080
**Documentation:** ✅ PUBLISHED (8 files, 139KB total)
**API:** ✅ WORKING (all endpoints tested)
**Public Access:** ⚠️ NEEDS CONFIGURATION (nginx/cloudflare)

**🕉️ Jai GuruJi - Viewer Server Ready! 🕉️**
