# 🔄 Clear All Caches - Stale Content Fix

**Issue:** Sidebar not folding, 502 errors might be due to stale caches
**Date:** February 7, 2026

---

## Cache Layers in Mari8X

```
User Browser
    ↓ (Browser Cache, Service Worker)
Nginx/Reverse Proxy
    ↓ (Nginx Cache, Proxy Cache)
Vite Dev Server
    ↓ (Vite HMR Cache, Node Modules Cache)
Backend Server
    ↓ (GraphQL Cache, Memory Cache)
```

---

## 🧹 Clear All Caches - Complete Guide

### 1. Browser Cache (Client Side)

#### Hard Refresh:
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

#### Clear Service Worker:
```javascript
// In browser console (F12):
navigator.serviceWorker.getRegistrations()
  .then(registrations => {
    registrations.forEach(registration => registration.unregister());
    console.log('✅ Service workers cleared');
  });
```

#### Clear All Storage:
```javascript
// In browser console (F12):
localStorage.clear();
sessionStorage.clear();
indexedDB.databases().then(dbs => {
  dbs.forEach(db => indexedDB.deleteDatabase(db.name));
});
console.log('✅ All storage cleared');
location.reload();
```

#### Via DevTools:
1. F12 → Application tab
2. Clear storage section
3. Check all boxes
4. Click "Clear site data"

---

### 2. Vite Dev Server Cache

#### Restart Vite with Cache Clear:
```bash
cd /root/apps/ankr-maritime/frontend

# Stop current dev server
pkill -f "vite.*3008"

# Clear Vite cache
rm -rf node_modules/.vite
rm -rf .vite
rm -rf dist

# Restart
npm run dev
```

#### Force Vite to Rebuild:
```bash
# In frontend directory
npm run build && npm run dev
```

---

### 3. Nginx Cache (Production)

#### If using nginx on production:
```bash
# On production server
sudo rm -rf /var/cache/nginx/*
sudo systemctl reload nginx

# Or specific cache directory
sudo rm -rf /var/nginx/cache/*
sudo nginx -s reload
```

#### Check nginx config for caching:
```bash
grep -r "proxy_cache\|fastcgi_cache" /etc/nginx/
```

---

### 4. Backend Cache

#### Restart Backend:
```bash
cd /root/apps/ankr-maritime/backend

# Kill backend
pkill -f "tsx.*main.ts"

# Restart
npm exec tsx src/main.ts
```

#### Clear Node Modules Cache:
```bash
rm -rf node_modules/.cache
npm cache clean --force
```

---

### 5. Full Nuclear Option (Clear Everything)

```bash
#!/bin/bash
# Run this to clear ALL caches

echo "🧹 Clearing all caches..."

# 1. Kill servers
pkill -f "vite.*3008"
pkill -f "tsx.*main.ts"

# 2. Clear frontend cache
cd /root/apps/ankr-maritime/frontend
rm -rf node_modules/.vite .vite dist
echo "✅ Frontend cache cleared"

# 3. Clear backend cache
cd /root/apps/ankr-maritime/backend
rm -rf node_modules/.cache
echo "✅ Backend cache cleared"

# 4. Clear npm cache
npm cache clean --force
echo "✅ NPM cache cleared"

# 5. Restart servers
cd /root/apps/ankr-maritime/backend
npm exec tsx src/main.ts &
sleep 3

cd /root/apps/ankr-maritime/frontend
npm run dev &

echo "✅ Servers restarted"
echo ""
echo "Now clear browser cache:"
echo "  1. Open DevTools (F12)"
echo "  2. Right-click refresh button"
echo "  3. Select 'Empty Cache and Hard Reload'"
echo "  4. Or run in console: localStorage.clear(); location.reload();"
```

---

## 🎯 Quick Test: Is Cache the Problem?

### Test 1: Incognito Mode
```
Open http://localhost:3008 in incognito/private window
- If sidebar works → Browser cache issue
- If sidebar fails → Code issue
```

### Test 2: Different Browser
```
Try in different browser (Chrome → Firefox → Edge)
- If works in one → Browser-specific cache
- If fails in all → Server-side cache or code issue
```

### Test 3: Check Network Tab
```
1. F12 → Network tab
2. Check "Disable cache"
3. Reload page
4. Look for:
   - 304 (Not Modified) → Cache hit
   - 200 → Fresh load
```

---

## 🔍 Debugging Sidebar Toggle

### Add More Verbose Logging:

```typescript
// In Layout.tsx
const { sidebarOpen, toggleSidebar } = useUIStore();

// Add this effect
useEffect(() => {
  console.log('🔧 Sidebar state changed:', {
    sidebarOpen,
    width: sidebarOpen ? 'w-52 (208px)' : 'w-14 (56px)',
    localStorage: localStorage.getItem('mari8x-ui'),
    timestamp: new Date().toISOString()
  });
}, [sidebarOpen]);

// Wrap toggle with logging
const handleToggle = () => {
  console.log('🖱️ Toggle clicked, current state:', sidebarOpen);
  toggleSidebar();
  console.log('🖱️ After toggle, new state:', useUIStore.getState().sidebarOpen);
};

// Use handleToggle instead of toggleSidebar
<button onClick={handleToggle}>...</button>
```

---

## 🔧 Production-Specific Issues

### If issue only on mari8x.com:

#### 1. Check CDN Cache (if using Cloudflare, etc.)
```
Cloudflare: Purge Everything
AWS CloudFront: Create invalidation
Vercel: Redeploy
```

#### 2. Check Service Worker
```javascript
// Add to main.tsx or index.html
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
  });
}
```

#### 3. Add Cache-Busting
```html
<!-- In index.html -->
<link rel="stylesheet" href="/assets/main.css?v=20260207">
<script src="/assets/main.js?v=20260207"></script>
```

---

## 📊 Common Cache-Related Issues

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| Sidebar doesn't fold | Browser localStorage stale | `localStorage.clear()` |
| 502 on production | Nginx proxy cache | Clear nginx cache, reload |
| Changes not showing | Vite HMR cache | Restart Vite, clear `.vite/` |
| GraphQL errors | Backend cache | Restart backend |
| Old UI showing | Service Worker | Unregister service workers |

---

## ✅ Recommended Order

1. **Browser:** Hard refresh (Ctrl+Shift+R)
2. **localStorage:** `localStorage.clear(); location.reload()`
3. **Vite:** Restart dev server
4. **Incognito:** Test in private window
5. **Nuclear:** Clear everything and restart

---

**Save this script:**
```bash
# /root/apps/ankr-maritime/clear-all-caches.sh
#!/bin/bash
cd /root/apps/ankr-maritime/frontend
rm -rf node_modules/.vite .vite dist
cd /root/apps/ankr-maritime
echo "✅ Caches cleared. Now restart servers and hard refresh browser."
```

---

**Next:** After clearing caches, test sidebar toggle with DevTools console open
