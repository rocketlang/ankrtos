# Redirect Loop Fix - Feb 8, 2026

## Problem
`ERR_TOO_MANY_REDIRECTS` when accessing https://ankr.in/ncert/

## Root Causes Found

### 1. Nginx Path Mismatch
**Issue**: Nginx was stripping the `/ncert/` prefix when proxying
```nginx
# BEFORE (Wrong)
location /ncert/ {
    proxy_pass http://localhost:5174/;  # Strips /ncert/
}
```

**Fix**: Preserve the path in proxy_pass
```nginx
# AFTER (Correct)
location /ncert/ {
    proxy_pass http://localhost:5174/ncert/;  # Keeps /ncert/
}
```

### 2. React Router Missing Basename
**Issue**: BrowserRouter didn't know about the `/ncert/` base path
```tsx
// BEFORE (Wrong)
<BrowserRouter>
  <Routes>...</Routes>
</BrowserRouter>
```

**Fix**: Added basename prop
```tsx
// AFTER (Correct)
<BrowserRouter basename="/ncert">
  <Routes>...</Routes>
</BrowserRouter>
```

## Changes Applied

### Files Modified
1. `/etc/nginx/sites-enabled/ankr.in`
   - Changed: `proxy_pass http://localhost:5174/;`
   - To: `proxy_pass http://localhost:5174/ncert/;`

2. `/root/apps/ncert-intelligent-viewer/frontend/vite.config.ts`
   - Added: `base: '/ncert/'`

3. `/root/apps/ncert-intelligent-viewer/frontend/src/App.tsx`
   - Changed: `<BrowserRouter>`
   - To: `<BrowserRouter basename="/ncert">`

### Services Restarted
- ✅ Nginx reloaded: `sudo systemctl reload nginx`
- ✅ Vite dev server: HMR updated App.tsx automatically

## How It Works Now

**Request Flow**:
```
Browser: https://ankr.in/ncert/
   ↓
Nginx: Receives /ncert/
   ↓
Nginx: Proxies to http://localhost:5174/ncert/ (path preserved)
   ↓
Vite: Serves from base /ncert/ (matches!)
   ↓
React Router: Routes from basename /ncert (matches!)
   ↓
✅ Page loads successfully
```

## Testing

**Public URL**: https://ankr.in/ncert/
**Expected**:
- ✅ Landing page loads without redirects
- ✅ Stats show: 6 books, 99 chapters, 594 questions
- ✅ "Start Learning" button navigates to /ncert/books
- ✅ No 404 errors in console
- ✅ No redirect loops

**Asset Paths**:
All assets now correctly load from `/ncert/`:
- `/ncert/vite.svg`
- `/ncert/src/main.tsx`
- `/ncert/@vite/client`

## Status
✅ **FIXED** - Both Nginx and React Router now correctly handle the `/ncert/` base path.

Date: Feb 8, 2026, 12:57 PM
