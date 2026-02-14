# ANKR Interact - UI Features Guide

**Date:** 2026-02-14
**App URL:** https://ankr.in/interact/

---

## 🎯 **Focus Mode** (Fullscreen Viewer)

The feature you're looking for is called **Focus Mode**!

### How to Use:
1. **Open any document** in ANKR Interact
2. **Click the `🎯 Focus` button** in the top-right header
3. **Enjoy distraction-free reading!**

### What Happens:
✅ Both sidebars automatically collapse
✅ Top toolbar auto-hides after 2 seconds
✅ Toolbar re-appears when mouse hovers near top
✅ Button changes to `👁️ Reading` when active
✅ Click again to exit Focus Mode

**Keyboard shortcut:** _Coming soon - could add Cmd+Shift+F_

---

## 🔍 **Ctrl+K Command Palette** (Omnisearch)

### How to Use:
1. **Press `Ctrl+K`** (Windows/Linux) or `Cmd+K` (Mac)
2. **Start typing** to search
3. **Arrow keys** to navigate results
4. **Enter** to open document

### Alternative:
- Click the **"Ctrl K"** button in the header (next to search box)

### What It Searches:
- 📄 **1,708 documents** indexed
- 🔍 **File names, titles, headings, tags, content**
- 🤖 **Hybrid search** (File Index + Vector AI search)
- ⚡ **Fuzzy matching** with typo tolerance

### Performance:
- **File Index:** 6-15ms (instant!)
- **Semantic AI:** 100-500ms
- **Fuzzy search:** ~543ms

---

## 📂 **Collapsible Sidebars**

### Left Sidebar (File Browser)
**Toggle:**
- Click `◀` button inside sidebar to collapse
- Click `▶` button on left edge to expand
- Auto-collapses when you select a file ✨ **NEW!**

**Keyboard shortcut:** Mobile hamburger menu (☰) on mobile

### Right Sidebar (Projects)
**Toggle:**
- Click collapse button in projects sidebar
- Auto-collapses when you select a file
- State saved to localStorage (remembers your preference)

### Auto-Collapse Behavior ✨ **UPDATED!**
Now when you click any file from either sidebar:
- ✅ Both sidebars automatically collapse
- ✅ Gives you fullscreen viewer immediately
- ✅ Works on desktop + mobile
- ✅ Re-open sidebars anytime with expand buttons

---

## 🎨 **Auto-Hiding Top Toolbar**

### In Focus Mode:
- Toolbar hides after **2 seconds** of inactivity
- Move mouse to **top 50px** of screen to reveal
- Smooth slide-up/down animation

### Always Visible:
- In normal mode, toolbar stays visible
- Click 🎯 to enter Focus Mode for auto-hide

---

## 📊 **Header Features**

### Top Bar Layout (Left to Right):

| Section | Features |
|---------|----------|
| **Left** | Logo, Doc count, Tier badge |
| **Center** | Search box, Ctrl+K button |
| **Right** | View modes (📄 Docs / 📊 Graph / 🗂 DB) |
| **Right** | 🎯 **Focus Mode** ← *This is what you want!* |
| **Right** | Feature toggles (🤖 AI, 🔗 Links, 👥 Collab) |
| **Right** | Study tools (🎯 Quiz, 🗂 Flashcards, 🧠 Mind Map) |
| **Right** | Utilities (📁 Import, 📅 Daily, 🎤 Voice, 📤 Publish) |

---

## ⌨️ **Keyboard Shortcuts**

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `Cmd+K` | Open Command Palette (Omnisearch) |
| `Ctrl+P` / `Cmd+P` | Also opens Command Palette |
| `Esc` | Close Command Palette |
| `↑` `↓` | Navigate search results |
| `Enter` | Open selected file |
| `Ctrl+P` | Print current document |

---

## 🚀 **Quick Workflows**

### 1. **Distraction-Free Reading**
```
1. Click any document
2. Click 🎯 Focus button
3. Read with no sidebars, auto-hiding toolbar
4. Move mouse to top if you need toolbar
```

### 2. **Fast Document Search**
```
1. Press Ctrl+K
2. Type: "pratham"
3. See 42 results instantly (15ms)
4. Press Enter
5. Both sidebars auto-collapse
6. Document opens fullscreen
```

### 3. **Browse Projects**
```
1. Right sidebar shows all projects
2. Click project to expand
3. Click any file
4. Sidebars auto-collapse
5. Document opens fullscreen
```

---

## 💡 **Tips & Tricks**

### Auto-Collapse on File Selection ✨
**NEW:** Selecting any file now automatically collapses both sidebars, giving you instant fullscreen reading mode!

To re-open sidebars:
- Click `▶` button on left edge (file browser)
- Click expand button on right edge (projects)

### Persistent Preferences
Your sidebar states are saved:
- `localStorage` remembers if you had them open/closed
- Reopens in same state next visit

### Mobile-Optimized
- Sidebars overlay on mobile (don't push content)
- Auto-collapse after selecting file
- Hamburger menu (☰) to toggle

---

## 🎯 **What Changed Today**

### Before:
- Left sidebar only auto-closed on mobile
- Right sidebar auto-closed both sidebars
- Inconsistent behavior

### After:
✅ **Consistent auto-collapse:** Selecting a file from ANY sidebar now collapses BOTH sidebars
✅ **Works on desktop + mobile:** No more size checks
✅ **Instant fullscreen viewer:** No manual clicking needed

---

## 🧪 **Testing the New Features**

### Test 1: Auto-Collapse from Left Sidebar
```
1. Open https://ankr.in/interact/
2. Left sidebar should be visible
3. Click any file in left sidebar
4. ✅ Both sidebars should collapse instantly
5. ✅ Document opens fullscreen
```

### Test 2: Auto-Collapse from Right Sidebar
```
1. Right sidebar shows projects
2. Expand a project
3. Click any file
4. ✅ Both sidebars should collapse
5. ✅ Document opens fullscreen
```

### Test 3: Focus Mode
```
1. Open any document
2. Click 🎯 Focus button in header
3. ✅ Both sidebars collapse
4. ✅ Wait 2 seconds → toolbar hides
5. ✅ Move mouse to top → toolbar shows
6. Click 👁️ Reading button to exit
```

### Test 4: Ctrl+K Omnisearch
```
1. Press Ctrl+K (or click "Ctrl K" button)
2. ✅ Command Palette opens
3. Type "pratham"
4. ✅ See ~42 results in <20ms
5. Press Enter
6. ✅ Document opens, sidebars collapse
```

---

## 📝 **Summary**

**You asked for:**
- ✅ Collapsing sidebars → **Already exists, now improved!**
- ✅ Fullscreen viewer when file selected → **Auto-collapse now works consistently**
- ✅ Folding top bars → **Focus Mode auto-hides toolbar**
- ✅ Where is Ctrl+K → **Keyboard shortcut + button in header**

**The main feature you want is:**
### 🎯 **Focus Mode**
Click the Focus button (🎯) in the top-right header when viewing any document!

---

**Try it now:** https://ankr.in/interact/ → Open a file → Click 🎯 Focus

---

**Jai Guru Ji** 🙏

**ANKR Labs**
February 14, 2026
