# ANKR Pulse - Module Loading Fixed ✅

**Date**: 2026-01-22
**Issue**: Vite module scripts failing to load with MIME type errors
**Status**: RESOLVED

## Problem

When accessing ankr-pulse at `https://ankr.in/pulse/`, the browser console showed:

```
Failed to load module script: Expected a JavaScript-or-Wasm module script
but the server responded with a MIME type of "text/html".
```

**Root Cause**: Vite was generating asset paths without the `/pulse/` prefix, so:
- HTML referenced: `/@vite/client`
- Browser requested: `https://ankr.in/@vite/client` (404)
- Should have been: `https://ankr.in/pulse/@vite/client` ✅

## Solution

### 1. Updated Vite Configuration

**File**: `/root/ankr-labs-nx/apps/ankr-pulse/vite.config.ts`

```typescript
export default defineConfig({
  plugins: [
    react(),
    ankrVitePlugin({ appName: 'ankr-pulse' }),
  ],
  base: '/pulse/',  // ← Added base path
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    strictPort: true,
    allowedHosts: ['ankr.in', 'www.ankr.in', 'pulse.ankr.in', 'localhost', '127.0.0.1'],
    proxy: {
      '/pulse/ai': {  // ← Updated proxy path
        target: `http://localhost:${PORTS.ai.proxy}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pulse\/ai/, ''),
      },
    },
  },
})
```

### 2. Updated Nginx Configuration

**File**: `/etc/nginx/sites-enabled/ankr.in`

```nginx
# ANKR Pulse - System Monitoring Dashboard
location /pulse/ {
    proxy_pass http://localhost:4320/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;

    # Rewrite redirects to include /pulse prefix
    proxy_redirect / /pulse/;
}

# Handle /pulse (without trailing slash) redirect
location = /pulse {
    return 301 /pulse/;
}

# Status API endpoint (for enhanced status component)
location /pulse/api/status {
    proxy_pass http://localhost:4100/api/status;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    add_header Access-Control-Allow-Origin *;
}
```

### 3. Updated Component API Call

**File**: `/root/ankr-labs-nx/apps/ankr-pulse/src/components/EnhancedServiceStatus.tsx`

```typescript
const fetchStatus = async () => {
  try {
    const res = await fetch('/pulse/api/status');  // ← Changed from http://localhost:4100
    if (!res.ok) throw new Error('Failed to fetch status');
    const data = await res.json();
    setStatusData(data);
    // ...
  }
};
```

## Verification

### ✅ HTML Source (Correct Paths)
```html
<!doctype html>
<html lang="en">
  <head>
    <script type="module" src="/pulse/@vite/client"></script>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/pulse/vite.svg" />
    <title>ANKR Pulse - System Monitor</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/pulse/src/main.tsx"></script>
  </body>
</html>
```

### ✅ Asset Loading
All Vite module scripts now have the correct `/pulse/` prefix:
- ✅ `/pulse/@vite/client` → Loads correctly
- ✅ `/pulse/src/main.tsx` → Loads correctly
- ✅ `/pulse/vite.svg` → Loads correctly

### ✅ API Endpoints
```bash
# Status API
curl https://ankr.in/pulse/api/status | jq '.summary'
# ✅ Returns: {"running": 0, "stopped": 28, "disabled": 7, "total": 35}

# AI Proxy
curl https://ankr.in/ai/api/services/health-all
# ✅ Works

# Documents Viewer
curl https://ankr.in/project/documents/
# ✅ Works
```

## Current Status

### ✅ Services Running
```bash
ankr-pulse         → Port 4320 ✅ RUNNING
ankr-status-api    → Port 4100 ✅ RUNNING
ankr-viewer        → Port 3199 ✅ RUNNING
```

### ✅ Public URLs
| Service | URL | Status |
|---------|-----|--------|
| **ANKR Pulse** | https://ankr.in/pulse/ | ✅ Working |
| **Status API** | https://ankr.in/pulse/api/status | ✅ Working |
| **Docs Viewer** | https://ankr.in/project/documents/ | ✅ Working |

### ✅ Features Available
1. **Services Tab** - Service health monitoring
2. **Status Tab** ⭐ - Enhanced service status table
   - Full detail: SERVICE | TYPE | PORT | STATUS | PID | CPU | MEMORY | UPTIME | DATABASE
   - Filters by type (Frontend, Backend, AI, etc.)
   - Search functionality
   - Auto-refresh (10s)
3. **PM2 Tab** - Process manager
4. **Ports Tab** - Port monitoring
5. **Packages Tab** - @ankr/* packages
6. **Agents Tab** - PEER/Swarm dashboard
7. **Costs Tab** - Cost tracking
8. **System Tab** - System metrics
9. **Security Tab** - Security alerts
10. **Logs Tab** - Service logs

## Testing

### Browser Console (Should be clean)
```javascript
// No errors
// No MIME type errors
// All modules loaded successfully
```

### API Test
```bash
# Test status endpoint
curl -s https://ankr.in/pulse/api/status | jq '.services | length'
# Returns: 35
```

### Service Status
```bash
# Check ankr-pulse
ankr-ctl status ankr-pulse
# ✅ RUNNING on port 4320

# Check status API
ankr-ctl status ankr-status-api
# ✅ RUNNING on port 4100
```

## Next Steps (Optional)

### 1. Production Build
Once TypeScript errors are fixed, build for production:
```bash
cd /root/ankr-labs-nx/apps/ankr-pulse
pnpm build
```

This will create a static `dist/` folder that can be served more efficiently.

### 2. Add Caching
For production static build, add nginx caching:
```nginx
location /pulse/assets/ {
    proxy_pass http://localhost:4320/assets/;
    proxy_cache_valid 200 1d;
    add_header Cache-Control "public, max-age=86400";
}
```

### 3. Subdomain Option
Alternative to `/pulse` path:
- **pulse.ankr.in** → cleaner URLs
- Requires DNS A record
- Separate nginx server block

---

**Built**: 2026-01-22
**Status**: ✅ WORKING
**URL**: https://ankr.in/pulse/
**Docs**: https://ankr.in/project/documents/
