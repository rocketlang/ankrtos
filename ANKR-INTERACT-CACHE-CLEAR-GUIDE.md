# How to Clear Browser Cache and See Changes

## 🔴 **Problem**
- Sidebars not auto-collapsing when you click files
- Ctrl+K still opening Google bar
- Changes not appearing

## ✅ **Solution: Force Hard Refresh**

### **Method 1: Hard Refresh (Recommended)**

#### Windows/Linux:
```
Ctrl + Shift + R
```
or
```
Ctrl + F5
```

#### Mac:
```
Cmd + Shift + R
```

### **Method 2: Clear Cache Completely**

#### Chrome/Edge:
1. Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
2. Select "Cached images and files"
3. Time range: "Last hour" or "All time"
4. Click "Clear data"
5. Refresh the page: `Ctrl+Shift+R`

#### Firefox:
1. Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
2. Select "Cache"
3. Click "Clear Now"
4. Refresh: `Ctrl+Shift+R`

### **Method 3: Incognito/Private Window**

1. Open incognito/private window
2. Go to: https://ankr.in/interact/
3. Test the features (no cache!)

---

## 🧪 **After Clearing Cache, Test:**

### 1. **Ctrl+K Should Open Command Palette (Not Google Bar)**
```
1. Press Ctrl+K (or Cmd+K on Mac)
2. ✅ Should see ANKR search modal, NOT browser address bar
3. Type "pratham"
4. See search results
```

### 2. **Sidebars Should Auto-Collapse**
```
1. Open https://ankr.in/interact/
2. Left sidebar should be visible (file browser)
3. Click ANY file in the sidebar
4. ✅ BOTH sidebars should collapse instantly
5. ✅ Document opens in fullscreen
```

### 3. **Ctrl+K Button Should Be Visible**
```
1. Look at top header
2. Next to search box
3. ✅ Should see blue button with 🔍 icon
4. Desktop: Shows "Ctrl K"
5. Mobile: Shows "Search"
```

---

## 🔍 **Still Not Working?**

### Check Console for Errors:
1. Press `F12` to open DevTools
2. Click "Console" tab
3. Look for red errors
4. Take screenshot and share

### Verify URL:
Make sure you're at:
```
https://ankr.in/interact/
```

NOT:
```
https://ankr.in/project/documents/
```

### Check Service Status:
```bash
pm2 list | grep ankr-interact
```

Should show:
```
ankr-interact          - ONLINE (port 3199)
ankr-interact-frontend - ONLINE (Vite dev server)
```

---

## 🎯 **Expected Behavior After Cache Clear**

### Ctrl+K:
- ✅ Opens ANKR command palette
- ✅ Does NOT open Google/browser search
- ✅ Shows blue button in header

### Auto-Collapse:
- ✅ Click file in left sidebar → both sidebars collapse
- ✅ Click file in right sidebar → both sidebars collapse
- ✅ Search result click → both sidebars collapse
- ✅ Document opens fullscreen

### Focus Mode:
- ✅ Click 🎯 button → sidebars collapse + toolbar auto-hides
- ✅ Shows as 👁️ Reading when active

---

**Try the hard refresh now: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)**

Then test clicking a file - both sidebars should collapse instantly!
