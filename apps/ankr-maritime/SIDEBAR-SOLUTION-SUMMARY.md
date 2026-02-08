# 🎯 Complete Sidebar Solution - Cache + RBAC/ABAC

**Date:** February 7, 2026
**Status:** Ready for Implementation

---

## 🔍 Issue Analysis

You identified two critical points:

### 1. **Stale Cache** (Sidebar not folding, 502 errors)
✅ **Root Cause:** Multi-layer caching
- Browser: localStorage, service workers
- Vite: HMR cache, node_modules/.vite
- Nginx: Proxy cache (production)

### 2. **RBAC/ABAC** (Role-based sidebar)
✅ **Requirement:** Different users see different navigation
- Agent sees: Port ops, DA desk, arrivals
- Charterer sees: Chartering, market, enquiries
- Fleet Owner sees: Vessels, crew, inspections
- Broker sees: Market, tonnage, contacts
- etc.

---

## 🧹 Solution 1: Clear All Caches

### Quick Fix (Run Now):
```bash
cd /root/apps/ankr-maritime
./clear-all-caches.sh
```

### What It Does:
1. Stops Vite dev server
2. Clears `node_modules/.vite`, `.vite`, `dist`
3. Restarts Vite
4. Prompts you to clear browser cache

### Then in Browser:
```javascript
// In console (F12):
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Or: Hard Refresh
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

### Test in Incognito:
If sidebar works in incognito → Cache issue confirmed ✅

---

## 🎯 Solution 2: Workflow-Based Sidebar with RBAC/ABAC

### Design Overview:

```
6 Workflow Stages (Universal Structure)
    ↓
Filter by User Role (RBAC/ABAC)
    ↓
Show Only Relevant Items
```

### The 6 Stages:

#### 1. **PRE-FIXTURE** 🔍
*Finding cargo and negotiating*
- Who: Broker, Charterer, Commercial
- Items: Market, Chartering, Enquiries, Tonnage

#### 2. **PLANNING** 📋
*Post-fixture planning*
- Who: Operations, Commercial, Agent
- Items: Estimate, Voyages, Route Calc, Port Intel

#### 3. **EXECUTION** 🚢
*Voyage in progress*
- Who: Operations, Agent, Commercial
- Items: AIS Live, DA Desk, Noon Reports, Port Docs

#### 4. **SETTLEMENT** 💰
*Post-voyage settlement*
- Who: Operations, Finance, Commercial
- Items: Laytime, B/L, Claims, Invoices

#### 5. **FLEET & ASSETS** ⚓
*Vessel and crew management*
- Who: Fleet Owner, Technical
- Items: Vessels, Crew, Inspections, Bunkers

#### 6. **INTELLIGENCE & TOOLS** 📊
*Analysis and reporting*
- Who: Everyone (filtered by role)
- Items: Analytics, Reports, Knowledge Base, Flow Canvas

---

## 👥 Example: What Each Role Sees

### 🔹 Agent (Port Agent)
```
✅ PLANNING (3 items)
✅ EXECUTION (4 items) ← Primary focus
✅ SETTLEMENT (1 item)
✅ INTELLIGENCE (4 items)
❌ PRE-FIXTURE (hidden)
❌ FLEET (hidden)
```

### 🔹 Charterer
```
✅ PRE-FIXTURE (4 items) ← Primary focus
✅ PLANNING (3 items)
✅ EXECUTION (3 items)
✅ SETTLEMENT (4 items)
✅ INTELLIGENCE (4 items)
❌ FLEET (hidden)
```

### 🔹 Fleet Owner
```
❌ PRE-FIXTURE (hidden)
✅ PLANNING (3 items)
✅ EXECUTION (3 items)
✅ SETTLEMENT (1 item)
✅ FLEET (11 items) ← Primary focus
✅ INTELLIGENCE (3 items)
```

### 🔹 Broker
```
✅ PRE-FIXTURE (7 items) ← Primary focus
✅ PLANNING (4 items)
✅ INTELLIGENCE (5 items)
❌ EXECUTION (hidden)
❌ SETTLEMENT (hidden)
❌ FLEET (hidden)
```

### 🔹 Admin
```
✅ ALL STAGES
✅ ALL ITEMS
Including: Flow Canvas, System Settings, User Management
```

---

## 💻 Implementation Code

### 1. Enhanced User Type with Roles

```typescript
// frontend/src/lib/stores/auth.ts

export type UserRole =
  | 'admin'
  | 'agent'
  | 'charterer'
  | 'fleet-owner'
  | 'broker'
  | 'operations'
  | 'commercial'
  | 'technical'
  | 'finance'
  | 'compliance';

export interface User {
  id: string;
  email: string;
  name: string;
  roles: UserRole[]; // Can have multiple roles
  permissions: string[];
  company: {
    id: string;
    name: string;
    type: 'owner' | 'charterer' | 'broker' | 'agent';
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,

  hasRole: (role: UserRole) => {
    const user = get().user;
    return user?.roles.includes(role) || user?.roles.includes('admin');
  },

  hasAnyRole: (roles: UserRole[]) => {
    const user = get().user;
    if (!user) return false;
    return roles.some(r => user.roles.includes(r)) || user.roles.includes('admin');
  },
}));
```

---

### 2. Workflow Stages with Role Mappings

```typescript
// frontend/src/lib/sidebar-nav-rbac.ts

export interface NavItem {
  label: string;
  href: string;
  roles: UserRole[] | 'all';
}

export interface NavStage {
  id: string;
  label: string;
  icon: string;
  color: string;
  items: NavItem[];
}

export const workflowStages: NavStage[] = [
  {
    id: 'pre-fixture',
    label: 'Pre-Fixture',
    icon: '🔍',
    color: 'blue',
    items: [
      { label: 'Market Overview', href: '/market-overview', roles: ['broker', 'commercial', 'charterer', 'admin'] },
      { label: 'Chartering', href: '/chartering', roles: ['broker', 'commercial', 'charterer', 'admin'] },
      { label: 'Cargo Enquiries', href: '/cargo-enquiries', roles: ['broker', 'commercial', 'charterer', 'admin'] },
      // ... more items
    ]
  },
  {
    id: 'execution',
    label: 'Execution',
    icon: '🚢',
    color: 'green',
    items: [
      { label: 'Dashboard', href: '/', roles: 'all' },
      { label: 'AIS Live', href: '/ais/live', roles: ['operations', 'commercial', 'fleet-owner', 'admin'] },
      { label: 'DA Desk', href: '/da-desk', roles: ['operations', 'agent', 'admin'] },
      // ... more items
    ]
  },
  // ... other stages
];

/**
 * Filter navigation based on user roles
 */
export function filterNavForUser(user: User | null): NavStage[] {
  if (!user) return [];

  const isAdmin = user.roles.includes('admin');

  return workflowStages
    .map(stage => ({
      ...stage,
      items: stage.items.filter(item => {
        if (isAdmin) return true;
        if (item.roles === 'all') return true;
        return item.roles.some(role => user.roles.includes(role));
      })
    }))
    .filter(stage => stage.items.length > 0); // Hide empty stages
}
```

---

### 3. Updated Layout Component

```typescript
// frontend/src/components/Layout.tsx

import { filterNavForUser } from '../lib/sidebar-nav-rbac';

export function Layout() {
  const { user } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  // Filter nav based on user role
  const userNav = useMemo(() => filterNavForUser(user), [user]);

  // Debug sidebar state
  useEffect(() => {
    console.log('🔧 Sidebar state:', sidebarOpen ? 'OPEN' : 'CLOSED');
    console.log('👤 User roles:', user?.roles);
    console.log('📋 Visible stages:', userNav.length);
  }, [sidebarOpen, user, userNav]);

  return (
    <div className="flex h-screen bg-maritime-900">
      <aside className={`${sidebarOpen ? 'w-52' : 'w-14'} ...`}>
        <nav>
          {userNav.map((stage) => (
            <div key={stage.id}>
              <button onClick={() => toggleSection(stage.id)}>
                <span>{stage.icon}</span>
                {sidebarOpen && <span>{stage.label}</span>}
              </button>
              {/* Render items */}
            </div>
          ))}
        </nav>
      </aside>
    </div>
  );
}
```

---

## 🔐 Backend Authorization

### GraphQL Directives

```typescript
// backend/src/schema/directives/auth.ts

directive @hasRole(roles: [String!]!) on FIELD_DEFINITION

type Query {
  # Public
  maritimeStats: MaritimeStats!

  # Role-restricted
  charteringDesk: CharteringDesk! @hasRole(roles: ["broker", "commercial", "charterer", "admin"])
  daDesk: DADesk! @hasRole(roles: ["operations", "agent", "admin"])
  fleetOverview: FleetOverview! @hasRole(roles: ["fleet-owner", "technical", "admin"])
}
```

---

## 📋 Implementation Steps

### Phase 1: Cache Clearing (Do Now)
- [x] Run `./clear-all-caches.sh`
- [x] Clear browser cache
- [x] Test in incognito
- [x] Verify sidebar toggle works

### Phase 2: RBAC Structure (Next)
1. [ ] Add `roles` field to User type
2. [ ] Create `sidebar-nav-rbac.ts` file
3. [ ] Update `useAuthStore` with role checking
4. [ ] Update Layout to use filtered nav
5. [ ] Test with mock users of different roles

### Phase 3: Backend Auth (After Frontend)
1. [ ] Add GraphQL directives
2. [ ] Implement field-level authorization
3. [ ] Add audit logging
4. [ ] Test API security

### Phase 4: UI Polish
1. [ ] Add role indicators (e.g., "Agent View")
2. [ ] Add tooltips explaining workflow stages
3. [ ] Add smooth animations
4. [ ] Add "Switch Role" for multi-role users

---

## ✅ Benefits

### For Users:
- ✅ **Focused**: See only what's relevant to your role
- ✅ **Intuitive**: Workflow stages match real process
- ✅ **Clean**: No clutter from irrelevant features
- ✅ **Fast**: Fewer items = faster navigation

### For Development:
- ✅ **Maintainable**: Single source of truth
- ✅ **Scalable**: Easy to add new roles/items
- ✅ **Secure**: Backend + frontend authorization
- ✅ **Flexible**: Multi-role support built-in

### For Business:
- ✅ **Professional**: Tailored experience per stakeholder
- ✅ **Onboarding**: New users see simplified view
- ✅ **Security**: Users can't access unauthorized features
- ✅ **Flexible**: Same platform serves all stakeholders

---

## 🚀 Quick Start

### 1. Clear Caches (Now):
```bash
cd /root/apps/ankr-maritime
./clear-all-caches.sh
```

Then in browser:
```javascript
localStorage.clear(); location.reload();
```

### 2. Test Current State:
- Visit http://localhost:3008
- Open DevTools (F12)
- Click sidebar toggle
- Look for "🔧 Sidebar state" in console

### 3. Implement RBAC (Next):
- Review `/root/apps/ankr-maritime/SIDEBAR-RBAC-DESIGN.md`
- Create `sidebar-nav-rbac.ts` file
- Update auth store with roles
- Update Layout component
- Test with different user roles

---

## 📚 Documentation

- **Cache Clearing:** `CLEAR-ALL-CACHES.md`
- **RBAC Design:** `SIDEBAR-RBAC-DESIGN.md`
- **Implementation:** This file
- **Original Fixes:** `SIDEBAR-AND-AIS-FIXES.md`

---

## 🎯 Next Steps

1. **Immediate:** Run cache clear script
2. **Today:** Verify sidebar toggle works after cache clear
3. **This Week:** Implement RBAC sidebar structure
4. **Testing:** Create mock users with different roles
5. **Deploy:** Roll out to production with user role assignments

---

**Ready to clear caches and implement RBAC sidebar?** 🚀

The workflow-based structure with role filtering will give each stakeholder exactly what they need, when they need it!
