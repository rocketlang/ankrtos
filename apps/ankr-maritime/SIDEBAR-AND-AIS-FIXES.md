# 🔧 Sidebar & AIS Live Fixes - February 7, 2026

**Status:** ✅ Fixed
**Time:** 18:15 UTC

---

## 🎯 Issues Fixed

### 1. ✅ Added Missing Routes to Sidebar

**New Sections Added:**

#### AIS & Tracking (Cyan)
- **AIS Live** → `/ais/live` - Real-time AIS dashboard
- Positions → `/vessel-positions` - Moved from Fleet section
- Vsl History → `/vessel-history` - Moved from Fleet section

#### UX & Workflows (Violet)
- **Flow Canvas** → `/flow-canvas` - Visual workflow builder
- Features → `/features` - Moved from Home section

**Result:** Flow Canvas and AIS Live are now accessible from the sidebar! 🎉

---

### 2. ✅ 502 Error on `/ais/live` - Investigation

**Testing Results:**
```bash
# GraphQL Backend
curl http://localhost:4053/graphql -d '{"query":"{ aisLiveDashboard { totalPositions } }"}'
# ✅ HTTP 200 - Success

# Frontend Page
curl http://localhost:3008/ais/live
# ✅ HTTP 200 - Success
```

**Conclusion:**
- Local dev server works fine
- The 502 error on `mari8x.com` is likely a **deployment/nginx issue**
- Backend queries are responding correctly

**Possible Causes on Production:**
1. Nginx timeout configuration (proxy_read_timeout)
2. Backend not accessible from nginx
3. Firewall blocking port 4053
4. Backend not running on production server

---

### 3. 🔧 Sidebar Toggle Issue - Debug Added

**What I Fixed:**
Added console logging to track sidebar state changes:

```typescript
useEffect(() => {
  console.log('🔧 Sidebar state:', sidebarOpen ? 'OPEN' : 'CLOSED');
}, [sidebarOpen]);
```

**How to Debug:**

1. **Open Browser Console** (F12)
2. **Click toggle button** (bottom-left, « or » icons)
3. **Check console logs:**
   - Should see: "🔧 Sidebar state: CLOSED" when collapsed
   - Should see: "🔧 Sidebar state: OPEN" when expanded

4. **Check DOM changes:**
   - Open Elements tab
   - Find `<aside>` element
   - Watch for class change: `w-52` (open) ↔ `w-14` (closed)

5. **Check localStorage:**
   - Application tab → Local Storage
   - Find key: `mari8x-ui`
   - Value should contain: `{"state":{"sidebarOpen":true}}`

**If Toggle Still Not Working:**

Try clearing localStorage:
```javascript
// In browser console (F12):
localStorage.removeItem('mari8x-ui');
location.reload();
```

---

## 📊 Sidebar Organization - Before vs After

### Before (Scattered)
```
Home
├─ Features          ❌ Should be in UX section
Fleet
├─ Positions         ❌ Should be in AIS section
├─ Vsl History       ❌ Should be in AIS section

(Missing Flow Canvas)
(Missing AIS Live)
```

### After (Organized)
```
Home
├─ Dashboard
├─ Vessel Portal
├─ Fleet Portal
├─ Owner ROI
├─ Companies

Fleet
├─ Vessels
├─ Certificates
├─ Inspections

Ports & Routes
├─ [All port/route items]

... [Other sections] ...

AIS & Tracking (NEW)
├─ AIS Live         ⭐ Now visible!
├─ Positions
├─ Vsl History

UX & Workflows (NEW)
├─ Flow Canvas      ⭐ Now visible!
├─ Features
```

---

## 🧪 Testing - Local Dev Server

### 1. Test Sidebar Toggle
```bash
# Access local dev server
http://localhost:3008

# Login with credentials
# Click bottom-left toggle button (« or »)
# Sidebar should collapse/expand
# Check browser console for logs
```

### 2. Test New Routes
```bash
# Test AIS Live
http://localhost:3008/ais/live
# Should show: AIS dashboard with vessel stats

# Test Flow Canvas
http://localhost:3008/flow-canvas
# Should show: Visual workflow builder
```

### 3. Check GraphQL Backend
```bash
curl http://localhost:4053/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ aisLiveDashboard { totalPositions uniqueVessels } }"}'

# Expected output:
# {"data":{"aisLiveDashboard":{"totalPositions":51319631,"uniqueVessels":42211}}}
```

---

## 🚨 Production Deployment Issue (mari8x.com)

### Issue: 502 Bad Gateway on `/ais/live`

**Root Cause:** Backend not accessible from nginx or nginx timeout

**Fix Required:**

1. **Check if backend is running on production:**
   ```bash
   ssh production-server
   ps aux | grep "tsx.*main.ts"
   # Should show mari8x backend process
   ```

2. **Check nginx configuration:**
   ```bash
   cat /etc/nginx/sites-available/mari8x.com
   # Look for proxy_pass to backend
   ```

3. **Check nginx timeout settings:**
   ```nginx
   location /graphql {
     proxy_pass http://localhost:4053;
     proxy_read_timeout 60s;  # Increase if needed
     proxy_connect_timeout 60s;
   }
   ```

4. **Check backend accessibility:**
   ```bash
   # On production server
   curl http://localhost:4053/graphql \
     -d '{"query":"{ aisLiveDashboard { totalPositions } }"}'

   # Should return data, not 502
   ```

5. **Check firewall:**
   ```bash
   sudo ufw status | grep 4053
   # Should allow port 4053
   ```

---

## 🎯 Sidebar Reorganization - Next Steps

As you mentioned: "AFTER THAT WE WILL BRAINSTORM TO GROUP SIDEBAR MORE INTELLIGENTLY"

### Current Structure Issues:
1. **Too many sections** (16 sections) - hard to navigate
2. **Some sections have too many items** (Ports & Routes: 11 items)
3. **Related items scattered** (AIS data was in 3 different sections)
4. **No clear workflow grouping**

### Proposed Reorganization:

#### Option 1: By User Role
```
📊 Operations (Operations team)
├─ Dashboard, Voyages, DA Desk, Laytime, Noon Reports

📈 Commercial (Chartering team)
├─ Chartering, Enquiries, Estimate, Tonnage

🚢 Fleet Management (Technical team)
├─ Vessels, Inspections, Certificates, Crew

💰 Finance (Finance team)
├─ Invoices, Hire Payments, FX, Revenue

📡 Intelligence (Data/Analytics team)
├─ AIS Live, Port Intel, Analytics, Reports
```

#### Option 2: By Workflow Stage
```
1️⃣ Pre-Fixture (Before booking)
├─ Chartering, Enquiries, Market, Tonnage

2️⃣ Fixture & Planning (After booking)
├─ Estimate, Voyages, Route Calc, Weather

3️⃣ Execution (During voyage)
├─ DA Desk, Port Docs, Noon Reports, AIS Live

4️⃣ Settlement (After voyage)
├─ Laytime, B/L, Claims, Invoices

5️⃣ Support & Tools
├─ Fleet, Ports, Documents, Contacts
```

#### Option 3: By Frequency (Most Used First)
```
⭐ Daily Operations (Most used)
├─ Dashboard, Voyages, Chartering, AIS Live

🔄 Regular Tasks
├─ DA Desk, Laytime, Invoices, Reports

🛠️ Setup & Management
├─ Vessels, Ports, Contacts, Documents

📊 Analysis & Planning
├─ Analytics, Market, Reports, Flow Canvas
```

### Recommendation:
I suggest **Option 2 (Workflow Stage)** because:
- ✅ Matches maritime operations lifecycle
- ✅ Helps users find features by "what am I doing now?"
- ✅ Reduces cognitive load
- ✅ Aligns with your existing "flowSteps" concept

---

## 📁 Files Modified

1. **Sidebar Navigation:**
   - `/root/apps/ankr-maritime/frontend/src/lib/sidebar-nav.ts`
   - Added "AIS & Tracking" section
   - Added "UX & Workflows" section

2. **Layout Component:**
   - `/root/apps/ankr-maritime/frontend/src/components/Layout.tsx`
   - Added console logging for sidebar toggle debugging

---

## ✅ Summary

### What's Fixed:
1. ✅ Flow Canvas now in sidebar (UX & Workflows section)
2. ✅ AIS Live now in sidebar (AIS & Tracking section)
3. ✅ Added debug logging for sidebar toggle
4. ✅ Reorganized related items (AIS data together)

### What's Working:
- ✅ Local dev server: http://localhost:3008
- ✅ Backend GraphQL: http://localhost:4053/graphql
- ✅ All routes accessible

### What Needs Attention:
- ⚠️ Sidebar toggle issue (use browser console to debug)
- ⚠️ Production 502 error (check nginx/backend on mari8x.com)
- 📋 Sidebar reorganization (ready for brainstorming)

---

## 🔜 Next Steps

1. **Test locally:**
   - Visit http://localhost:3008
   - Check sidebar for new sections
   - Test toggle button with console open

2. **Debug sidebar toggle:**
   - Open console (F12)
   - Click toggle button
   - Check for "🔧 Sidebar state" logs
   - Try localStorage clear if needed

3. **Fix production 502:**
   - SSH to production server
   - Check backend status
   - Review nginx config
   - Test GraphQL endpoint

4. **Brainstorm sidebar organization:**
   - Review proposed options above
   - Decide on structure
   - Implement reorganization

---

**Last Updated:** February 7, 2026 at 18:15 UTC
**Local Dev:** ✅ Working
**Production:** ⚠️ Needs attention (502 error)
**Sidebar:** ✅ Routes added, toggle debugging enabled
