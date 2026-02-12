# ANKR LMS 403 Fix - Document Viewer

**Date:** 2026-02-12 18:30 IST
**Issue:** https://ankrlms.ankr.in/project/documents/ returning 403 Forbidden
**Status:** ✅ RESOLVED

## Problem Analysis

### What Broke
- Site was working earlier when Vite dev server was running
- Vite dev server got killed (OOM - exit code 137)
- Nginx was configured to serve static files from `/root/ankr-labs-nx/packages/ankr-interact/dist/client/`
- That directory was empty (no production build had been run)
- Result: **403 Forbidden error**

### Root Cause
**Configuration Mismatch:**
- Service running in **DEV mode** (`npm run dev` → Vite dev server)
- Nginx configured for **PRODUCTION mode** (serving static files)
- Static build never completed → empty dist/client/ directory

## Solution Applied

### 1. Updated Nginx Config
**File:** `/etc/nginx/sites-available/ankrlms.ankr.in`

**Before (Line 70-75):**
```nginx
# Serve production build (static files)
location /project/documents/ {
    alias /root/ankr-labs-nx/packages/ankr-interact/dist/client/;
    try_files $uri $uri/ /index.html;
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
}
```

**After:**
```nginx
# Proxy to Vite dev server (development mode)
location /project/documents/ {
    proxy_pass http://localhost:5174/project/documents/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

### 2. Restarted Service
```bash
pm2 restart ankr-interact
```

### 3. Reloaded Nginx
```bash
nginx -t && systemctl reload nginx
```

## Verification

```bash
curl -I https://ankrlms.ankr.in/project/documents/
# HTTP/2 200 ✅
```

## Service Details

**PM2 Service:** `ankr-interact` (ID: 23)
**Command:** `npm run dev` (runs both server and Vite client)
**Ports:**
- Backend: 3199 (GraphQL API)
- Frontend: 5174 (Vite dev server)

**Vite Output:**
```
➜  Local:   http://localhost:5174/project/documents/
```

## Important Notes

1. **Dev vs Production:**
   - Currently running in **development mode** with Vite
   - For production, need to:
     - Run `npm run build:client` to generate static files
     - Switch nginx back to serving from `dist/client/`

2. **Backend Issues:**
   - Backend server has ESM import error: `@ankr/publish` module
   - Frontend works independently (Vite serves the SPA)
   - Backend errors don't affect document viewer functionality

3. **Port Discovery:**
   - Initial assumption: Port 5173
   - Actual port: 5174 (found in PM2 logs)
   - Nginx updated accordingly

## Future Improvements

1. **Add Health Check:**
   - Monitor Vite dev server port
   - Auto-restart on crashes

2. **Production Build:**
   - Set up proper build pipeline
   - Generate static files for production
   - Reduce memory usage (avoid OOM kills)

3. **Fix Backend:**
   - Resolve `@ankr/publish` import error
   - Enable full backend functionality

## Related Files

- Nginx config: `/etc/nginx/sites-available/ankrlms.ankr.in`
- Service path: `/root/ankr-labs-nx/packages/ankr-interact`
- PM2 logs: `/root/.pm2/logs/ankr-interact-*.log`

---

**Result:** Site now accessible at https://ankrlms.ankr.in/project/documents/ ✅
