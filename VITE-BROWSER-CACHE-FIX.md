# 🔧 Vite Browser Cache Issue - Fix Required

## Problem

The browser is trying to load OLD Vite dependency modules that no longer exist:
- Browser cache: `v=e134c508` (old version)
- Current Vite: `v=8ad1c65b` (new version after restart)

Vite re-generates dependency hashes on each restart, causing browser cache mismatches.

## Error Messages

```
NS_ERROR_CORRUPTED_CONTENT
Loading module from "https://ankr.in/project/documents/node_modules/.vite/deps/react.js?v=e134c508" 
was blocked because of a disallowed MIME type ("text/html")
```

## Root Cause

1. Browser cached the initial HTML with version `v=e134c508`
2. Vite restarted and rebuilt deps with new version `v=8ad1c65b`
3. Browser tries to load old version modules (404 → served as HTML)
4. MIME type error occurs (expecting JavaScript, got HTML error page)

## Solution

### Immediate Fix (User Action Required)

**HARD REFRESH the browser:**

**Windows/Linux:** `Ctrl + Shift + R`  
**Mac:** `Cmd + Shift + R`

OR

**Clear browser cache:**
1. Open DevTools (F12)
2. Right-click reload button
3. Select "Empty Cache and Hard Reload"

### Verify Fix

After hard refresh, you should see:
```javascript
// Browser console - no errors
[vite] connected.
```

### Prevent Future Issues

**Option 1: Disable Vite dependency optimization (faster, less stable)**
```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    force: false,  // Don't force re-optimization
  },
});
```

**Option 2: Build production version (stable, no hash changes)**
```bash
cd /root/ankr-labs-nx/packages/ankr-interact
npm run build
# Serve from dist/ instead of dev server
```

**Option 3: Lock dependency hash (Vite 5.1+)**
```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    entries: [],  // Explicit entries prevent re-optimization
  },
});
```

## Current Status

✅ Vite server: Working correctly (port 5173)  
✅ nginx proxy: Fixed and working  
✅ Dependencies: Pre-optimized (v=8ad1c65b)  
❌ Browser cache: Contains old version (v=e134c508)

**Action Required:** User must hard refresh browser

## Testing After Fix

```bash
# 1. Check current version in HTML
curl -s "https://ankr.in/project/documents/src/client/main.tsx" | head -1

# 2. Should see version like: v=8ad1c65b (current)

# 3. Test React module loads
curl -I "https://ankr.in/project/documents/node_modules/.vite/deps/react.js?v=8ad1c65b"
# Should return: HTTP/2 200
```

## Why This Happens

**Vite Development Mode:**
- Re-optimizes dependencies when config changes
- Re-optimizes on server restart
- Generates new content hashes each time
- Browser cache becomes stale immediately

**Production Mode:**
- Dependencies bundled into static files
- Hashes based on content (stable)
- No re-optimization
- Cache-friendly

## Recommendation

For production deployment, use:
```bash
npm run build
# Deploy dist/ directory via nginx static files
# No Vite dev server, no hash changes
```
