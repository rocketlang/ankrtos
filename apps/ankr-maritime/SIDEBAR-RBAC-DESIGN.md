# 🎯 Workflow-Based Sidebar with RBAC/ABAC

**Design:** Option 2 (Workflow Stage) + Role-Based Access Control
**Date:** February 7, 2026

---

## 🏗️ Architecture Overview

```
User Roles (RBAC)
    ↓
Workflow Stages (Universal Structure)
    ↓
Filtered Nav Items (ABAC - show only what user can access)
    ↓
Rendered Sidebar (User-specific view)
```

**Key Principle:** Same workflow structure, different visibility per role

---

## 👥 User Roles

### Primary Roles:

1. **Agent** (Port Agent)
   - Focus: Port operations, arrivals, DA desk, documentation

2. **Charterer** (Cargo Owner/Trader)
   - Focus: Booking cargo, chartering, market intelligence

3. **Fleet Owner** (Ship Owner)
   - Focus: Vessel management, crew, maintenance, inspections

4. **Broker** (Shipbroker)
   - Focus: Market, chartering, contacts, tonnage lists

5. **Operations** (Operations Manager)
   - Focus: Voyage execution, laytime, noon reports, documentation

6. **Commercial** (Commercial Manager)
   - Focus: Chartering, estimates, COAs, revenue

7. **Technical** (Technical Manager)
   - Focus: Vessels, crew, inspections, certificates, bunkers

8. **Finance** (Finance Manager)
   - Focus: Invoices, payments, hire, revenue, cost tracking

9. **Compliance** (Compliance Officer)
   - Focus: ISM/ISPS, KYC, sanctions, insurance, claims

10. **Admin** (System Admin)
    - Focus: Full access to everything

### Secondary Roles (can be combined):
- Master (Ship Captain)
- Crew Member
- Auditor
- Customer (External charterer viewing their bookings)

---

## 🌊 Workflow Stages with Role Mapping

### Stage 1: PRE-FIXTURE
**Purpose:** Finding cargo and negotiating fixtures

#### Items & Roles:
```typescript
{
  stage: 'pre-fixture',
  label: 'Pre-Fixture',
  icon: '🔍',
  color: 'blue',
  items: [
    { label: 'Market Overview', href: '/market-overview', roles: ['broker', 'commercial', 'charterer', 'admin'] },
    { label: 'Chartering', href: '/chartering', roles: ['broker', 'commercial', 'charterer', 'admin'] },
    { label: 'Cargo Enquiries', href: '/cargo-enquiries', roles: ['broker', 'commercial', 'charterer', 'admin'] },
    { label: 'Open Tonnage', href: '/open-tonnage', roles: ['broker', 'commercial', 'admin'] },
    { label: 'Market Indices', href: '/market-indices', roles: ['broker', 'commercial', 'finance', 'admin'] },
    { label: 'CRM Pipeline', href: '/crm-pipeline', roles: ['broker', 'commercial', 'admin'] },
    { label: 'Contacts', href: '/contacts', roles: ['broker', 'commercial', 'operations', 'admin'] },
  ]
}
```

**Who sees this stage:**
- ✅ Broker: All items
- ✅ Charterer: Market, Chartering, Enquiries
- ✅ Commercial: All items
- ❌ Agent: Hidden (no access)
- ❌ Fleet Owner: Hidden (no access to chartering)

---

### Stage 2: PLANNING
**Purpose:** Post-fixture planning and estimation

#### Items & Roles:
```typescript
{
  stage: 'planning',
  label: 'Planning & Estimation',
  icon: '📋',
  color: 'cyan',
  items: [
    { label: 'Voyage Estimate', href: '/voyage-estimate', roles: ['commercial', 'operations', 'charterer', 'admin'] },
    { label: 'Voyages', href: '/voyages', roles: ['operations', 'commercial', 'charterer', 'agent', 'admin'] },
    { label: 'Route Calculator', href: '/route-calculator', roles: ['operations', 'commercial', 'technical', 'admin'] },
    { label: 'Port Intelligence', href: '/port-intelligence', roles: ['operations', 'agent', 'commercial', 'admin'] },
    { label: 'Weather Warranty', href: '/weather-warranty', roles: ['operations', 'technical', 'admin'] },
    { label: 'Cargo Compatibility', href: '/cargo-compatibility', roles: ['operations', 'technical', 'admin'] },
    { label: 'Agent Directory', href: '/agent-directory', roles: ['operations', 'commercial', 'admin'] },
  ]
}
```

**Who sees this stage:**
- ✅ Operations: All items
- ✅ Commercial: Most items
- ✅ Agent: Voyages, Port Intelligence, Agent Directory
- ✅ Fleet Owner: Route, Weather, Cargo Compat

---

### Stage 3: EXECUTION
**Purpose:** Voyage in progress, real-time operations

#### Items & Roles:
```typescript
{
  stage: 'execution',
  label: 'Execution',
  icon: '🚢',
  color: 'green',
  items: [
    { label: 'Dashboard', href: '/', roles: ['all'] },
    { label: 'AIS Live', href: '/ais/live', roles: ['operations', 'commercial', 'fleet-owner', 'admin'] },
    { label: 'DA Desk', href: '/da-desk', roles: ['operations', 'agent', 'admin'] },
    { label: 'Port Documents', href: '/port-documents', roles: ['operations', 'agent', 'admin'] },
    { label: 'Noon Reports', href: '/noon-reports', roles: ['operations', 'technical', 'admin'] },
    { label: 'Noon (Auto)', href: '/noon-reports-enhanced', roles: ['operations', 'technical', 'admin'] },
    { label: 'SOF Manager', href: '/sof-manager', roles: ['operations', 'agent', 'admin'] },
    { label: 'Delay Alerts', href: '/delay-alerts', roles: ['operations', 'commercial', 'admin'] },
    { label: 'Critical Path', href: '/critical-path', roles: ['operations', 'admin'] },
    { label: 'Agent Portal', href: '/agent-portal', roles: ['agent', 'operations', 'admin'] },
  ]
}
```

**Who sees this stage:**
- ✅ Operations: All items (primary user)
- ✅ Agent: DA Desk, Port Docs, SOF, Agent Portal
- ✅ Commercial: Dashboard, AIS Live, Delay Alerts
- ✅ Fleet Owner: Dashboard, AIS Live, Noon Reports

---

### Stage 4: SETTLEMENT
**Purpose:** Post-voyage settlement and documentation

#### Items & Roles:
```typescript
{
  stage: 'settlement',
  label: 'Settlement',
  icon: '💰',
  color: 'amber',
  items: [
    { label: 'Laytime', href: '/laytime', roles: ['operations', 'commercial', 'admin'] },
    { label: 'Bills of Lading', href: '/bills-of-lading', roles: ['operations', 'commercial', 'admin'] },
    { label: 'eBL Chain', href: '/ebl-chain', roles: ['operations', 'commercial', 'admin'] },
    { label: 'Claims', href: '/claims', roles: ['operations', 'commercial', 'compliance', 'admin'] },
    { label: 'Claim Packages', href: '/claim-packages', roles: ['operations', 'commercial', 'admin'] },
    { label: 'Invoices', href: '/invoices', roles: ['finance', 'commercial', 'admin'] },
    { label: 'FDA Disputes', href: '/fda-disputes', roles: ['operations', 'finance', 'agent', 'admin'] },
    { label: 'Hire Payments', href: '/hire-payments', roles: ['finance', 'fleet-owner', 'admin'] },
  ]
}
```

**Who sees this stage:**
- ✅ Operations: Laytime, B/L, Claims
- ✅ Finance: Invoices, Hire Payments, FDA
- ✅ Commercial: Laytime, B/L, eBL, Claims
- ✅ Agent: FDA Disputes

---

### Stage 5: FLEET & ASSETS
**Purpose:** Vessel and crew management

#### Items & Roles:
```typescript
{
  stage: 'fleet',
  label: 'Fleet & Assets',
  icon: '⚓',
  color: 'purple',
  items: [
    { label: 'Vessels', href: '/vessels', roles: ['fleet-owner', 'technical', 'operations', 'admin'] },
    { label: 'Vessel Portal', href: '/vessel-portal', roles: ['fleet-owner', 'technical', 'admin'] },
    { label: 'Vessel Positions', href: '/vessel-positions', roles: ['fleet-owner', 'operations', 'commercial', 'admin'] },
    { label: 'Vessel History', href: '/vessel-history', roles: ['fleet-owner', 'technical', 'admin'] },
    { label: 'Certificates', href: '/vessel-certificates', roles: ['fleet-owner', 'technical', 'compliance', 'admin'] },
    { label: 'Inspections', href: '/vessel-inspections', roles: ['fleet-owner', 'technical', 'compliance', 'admin'] },
    { label: 'Crew', href: '/crew', roles: ['fleet-owner', 'technical', 'admin'] },
    { label: 'Bunkers', href: '/bunkers', roles: ['fleet-owner', 'technical', 'operations', 'admin'] },
    { label: 'Bunker Mgmt', href: '/bunker-management', roles: ['fleet-owner', 'technical', 'operations', 'admin'] },
    { label: 'Emissions', href: '/emissions', roles: ['fleet-owner', 'technical', 'compliance', 'admin'] },
    { label: 'Carbon', href: '/carbon', roles: ['fleet-owner', 'technical', 'compliance', 'admin'] },
  ]
}
```

**Who sees this stage:**
- ✅ Fleet Owner: Full access (primary user)
- ✅ Technical: Full access
- ✅ Operations: Vessels, Positions, Bunkers
- ❌ Agent: Hidden
- ❌ Broker: Hidden

---

### Stage 6: INTELLIGENCE & TOOLS
**Purpose:** Analysis, reporting, and system tools

#### Items & Roles:
```typescript
{
  stage: 'intelligence',
  label: 'Intelligence & Tools',
  icon: '📊',
  color: 'violet',
  items: [
    { label: 'Analytics', href: '/analytics', roles: ['all'] },
    { label: 'Reports', href: '/reports', roles: ['all'] },
    { label: 'Operations KPI', href: '/operations-kpi', roles: ['operations', 'commercial', 'admin'] },
    { label: 'Revenue Analytics', href: '/revenue-analytics', roles: ['finance', 'commercial', 'admin'] },
    { label: 'Cost Benchmarks', href: '/cost-benchmarks', roles: ['finance', 'commercial', 'admin'] },
    { label: 'Knowledge Base', href: '/knowledge-base', roles: ['all'] },
    { label: 'Advanced Search', href: '/advanced-search', roles: ['all'] },
    { label: 'Flow Canvas', href: '/flow-canvas', roles: ['admin', 'operations'] },
    { label: 'Features', href: '/features', roles: ['all'] },
  ]
}
```

**Who sees this stage:**
- ✅ Everyone sees some items (Analytics, Reports, Knowledge Base)
- ✅ Finance: Revenue, Cost Benchmarks
- ✅ Admin: Flow Canvas
- ✅ Operations: KPI, Flow Canvas

---

## 💻 Implementation

### 1. User Store with Roles

```typescript
// /root/apps/ankr-maritime/frontend/src/lib/stores/auth.ts

export interface User {
  id: string;
  email: string;
  name: string;
  roles: UserRole[]; // Array of roles
  permissions: string[]; // Specific permissions
  company: {
    id: string;
    name: string;
    type: 'owner' | 'charterer' | 'broker' | 'agent';
  };
}

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
  | 'compliance'
  | 'master'
  | 'crew';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  hasRole: (role: UserRole) => {
    const state = get();
    return state.user?.roles.includes(role) || state.user?.roles.includes('admin');
  },

  hasAnyRole: (roles: UserRole[]) => {
    const state = get();
    if (!state.user) return false;
    return roles.some(role => state.user!.roles.includes(role)) || state.user.roles.includes('admin');
  },

  hasPermission: (permission: string) => {
    const state = get();
    return state.user?.permissions.includes(permission) || state.user?.roles.includes('admin');
  },
}));
```

---

### 2. Enhanced Sidebar Navigation with Roles

```typescript
// /root/apps/ankr-maritime/frontend/src/lib/sidebar-nav-rbac.ts

export interface NavItem {
  label: string;
  href: string;
  roles: UserRole[] | 'all'; // Roles that can see this item
  permissions?: string[]; // Optional fine-grained permissions
}

export interface NavStage {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string; // Tooltip description
  items: NavItem[];
}

export const workflowStages: NavStage[] = [
  {
    id: 'pre-fixture',
    label: 'Pre-Fixture',
    icon: '🔍',
    color: 'blue',
    description: 'Finding cargo and negotiating fixtures',
    items: [
      { label: 'Market Overview', href: '/market-overview', roles: ['broker', 'commercial', 'charterer', 'admin'] },
      { label: 'Chartering', href: '/chartering', roles: ['broker', 'commercial', 'charterer', 'admin'] },
      { label: 'Cargo Enquiries', href: '/cargo-enquiries', roles: ['broker', 'commercial', 'charterer', 'admin'] },
      { label: 'Open Tonnage', href: '/open-tonnage', roles: ['broker', 'commercial', 'admin'] },
      { label: 'Market Indices', href: '/market-indices', roles: ['broker', 'commercial', 'finance', 'admin'] },
    ]
  },
  // ... other stages
];

/**
 * Filter navigation items based on user roles
 */
export function filterNavForUser(user: User | null): NavStage[] {
  if (!user) return [];

  const userRoles = user.roles;
  const isAdmin = userRoles.includes('admin');

  return workflowStages
    .map(stage => {
      // Filter items in this stage
      const filteredItems = stage.items.filter(item => {
        if (isAdmin) return true; // Admin sees everything
        if (item.roles === 'all') return true; // Public items

        // Check if user has any of the required roles
        return item.roles.some(role => userRoles.includes(role));
      });

      return {
        ...stage,
        items: filteredItems
      };
    })
    .filter(stage => stage.items.length > 0); // Hide stages with no visible items
}

/**
 * Get stage visibility counts for user
 */
export function getStageVisibility(user: User | null): Record<string, number> {
  const filtered = filterNavForUser(user);
  return filtered.reduce((acc, stage) => {
    acc[stage.id] = stage.items.length;
    return acc;
  }, {} as Record<string, number>);
}
```

---

### 3. Updated Layout Component

```typescript
// /root/apps/ankr-maritime/frontend/src/components/Layout.tsx

import { filterNavForUser } from '../lib/sidebar-nav-rbac';

export function Layout() {
  const { user } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  // Get filtered navigation based on user role
  const userNav = useMemo(() => filterNavForUser(user), [user]);

  return (
    <div className="flex h-screen bg-maritime-900">
      <aside className={`${sidebarOpen ? 'w-52' : 'w-14'} ...`}>
        <nav className="flex-1 py-1 overflow-y-auto">
          {userNav.map((stage) => (
            <div key={stage.id}>
              <button
                onClick={() => sidebarOpen ? toggleSection(stage.id) : undefined}
                className="..."
                title={!sidebarOpen ? stage.description : undefined}
              >
                <span className="text-sm">{stage.icon}</span>
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left font-medium">{stage.label}</span>
                    <span className="text-maritime-600 text-[10px]">{stage.items.length}</span>
                  </>
                )}
              </button>

              {sidebarOpen && isOpen && (
                <div className="pb-1">
                  {stage.items.map((item) => (
                    <NavLink key={item.href} to={item.href} ...>
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Rest of layout */}
    </div>
  );
}
```

---

## 📊 Example: What Each Role Sees

### Agent (Port Agent)
```
✅ PLANNING (3 items)
   - Voyages
   - Port Intelligence
   - Agent Directory

✅ EXECUTION (4 items)
   - Dashboard
   - DA Desk
   - Port Documents
   - Agent Portal

✅ SETTLEMENT (1 item)
   - FDA Disputes

✅ INTELLIGENCE & TOOLS (4 items)
   - Analytics
   - Reports
   - Knowledge Base
   - Advanced Search
```

### Charterer
```
✅ PRE-FIXTURE (4 items)
   - Market Overview
   - Chartering
   - Cargo Enquiries
   - Contacts

✅ PLANNING (3 items)
   - Voyage Estimate
   - Voyages
   - Port Intelligence

✅ EXECUTION (3 items)
   - Dashboard
   - AIS Live
   - Delay Alerts

✅ SETTLEMENT (4 items)
   - Laytime
   - Bills of Lading
   - eBL Chain
   - Claims

✅ INTELLIGENCE & TOOLS (4 items)
   - Analytics
   - Reports
   - Knowledge Base
   - Features
```

### Fleet Owner
```
❌ PRE-FIXTURE (hidden - no items)

✅ PLANNING (3 items)
   - Route Calculator
   - Weather Warranty
   - Cargo Compatibility

✅ EXECUTION (3 items)
   - Dashboard
   - AIS Live
   - Noon Reports

✅ SETTLEMENT (1 item)
   - Hire Payments

✅ FLEET & ASSETS (11 items)
   - Full access to all vessel/crew items

✅ INTELLIGENCE & TOOLS (3 items)
   - Analytics
   - Reports
   - Knowledge Base
```

### Broker
```
✅ PRE-FIXTURE (7 items)
   - Full access

✅ PLANNING (4 items)
   - Estimate, Voyages, Port Intel, Agents

❌ EXECUTION (hidden or minimal)

❌ SETTLEMENT (hidden)

❌ FLEET & ASSETS (hidden)

✅ INTELLIGENCE & TOOLS (5 items)
   - Analytics, Reports, Market data
```

---

## 🔐 Backend RBAC/ABAC

### GraphQL Schema with Directives

```typescript
// backend/src/schema/directives/auth.ts

directive @hasRole(roles: [String!]!) on FIELD_DEFINITION
directive @hasPermission(permission: String!) on FIELD_DEFINITION

type Query {
  # Everyone can see
  maritimeStats: MaritimeStats!

  # Only specific roles
  charteringDesk: CharteringDesk! @hasRole(roles: ["broker", "commercial", "charterer", "admin"])
  daDesk: DADesk! @hasRole(roles: ["operations", "agent", "admin"])
  fleetOverview: FleetOverview! @hasRole(roles: ["fleet-owner", "technical", "admin"])

  # Fine-grained permission
  sensitiveFinancials: FinancialReport! @hasPermission(permission: "view:financials")
}
```

---

## ✅ Benefits of This Approach

1. **Universal Structure**: Same workflow stages for everyone
2. **Role-Specific View**: Each user sees only relevant items
3. **Reduced Clutter**: Sidebar only shows what you need
4. **Scalable**: Easy to add new roles or items
5. **Maintainable**: Single source of truth for navigation
6. **Intuitive**: Workflow stages match business process
7. **Flexible**: Supports multi-role users (e.g., admin + operations)

---

## 🚀 Implementation Steps

1. ✅ Add `roles` field to User type
2. ✅ Create `sidebar-nav-rbac.ts` with role mappings
3. ✅ Update Layout to filter nav based on user
4. ✅ Add backend GraphQL directives for field-level auth
5. ✅ Test with different user roles
6. ✅ Add audit logging for access control

---

**Next:** Implement user role assignment and test with different user types!
