# Demo Login & Role-Based Access Control Setup

## Overview

Implemented a comprehensive role-based access control (RBAC) system with two distinct login types:

1. **Admin Login** - Full access to all 153 pages
2. **Demo Login** - Limited access to ~20 safe demonstration pages

## Login Credentials

### Admin (Full Access)
```
Email: admin@ankr.in
Password: admin123
Role: admin
Access: All 153 pages across all modules
```

### Demo (Limited Access)
```
Email: demo@mari8x.com
Password: demo123
Role: viewer
Access: ~20 demonstration pages (see below)
```

## Demo User Access - Pages Visible

The demo user (viewer role) can access the following pages:

### Core Navigation (Available to All)
- **Dashboard** - `/`
- **Analytics** - `/analytics`
- **Reports** - `/reports`
- **Mari8xLLM** - `/mari8x-llm`
- **Knowledge Base** - `/knowledge-base`
- **Advanced Search** - `/advanced-search`
- **Documents (DMS)** - `/documents`
- **Alerts** - `/alerts`
- **Activity** - `/activity`
- **Mentions** - `/mentions`
- **Features** - `/features`

### Market & Intelligence
- **Market Overview** - `/market-overview`

### Fleet & Vessels (Read-Only View)
- **Vessels** - `/vessels`
- **Vessel Positions** - `/vessel-positions`

### Ports & Routes (Read-Only View)
- **Ports** - `/ports`
- **Port Map** - `/port-map`

## Admin User Access - Pages Hidden from Demo

The admin user has access to **all pages**, including critical operational pages that are hidden from demo users:

### Commercial Operations (Admin Only)
- Chartering, Time Charters, COA Management
- Cargo Enquiries, Cargo Compatibility
- Voyage Estimates, Voyage Estimate History
- Open Tonnage

### Financial Operations (Admin Only)
- Invoices, Hire Payments, Cash to Master
- FX Dashboard, Letters of Credit, Trade Payments
- Freight Derivatives, Bank Reconciliation
- Cost Benchmarks, Revenue Analytics

### Voyage Operations (Admin Only)
- Voyages, DA Desk, Port Documents
- Laytime, Noon Reports, SOF Manager
- Critical Path, Weather Warranty, Delay Alerts

### Compliance & Risk (Admin Only)
- ISM/ISPS Compliance, KYC
- Insurance Policies, Sanctions Screening
- Claims, Claim Packages

### Ship Sale & Purchase (Admin Only)
- S&P Desk, Sale Listings, SNP Deals
- SNP Valuation, Closing Tracker

### Fleet Management (Admin Only - Full Access)
- Vessel Portal, Fleet Portal
- Vessel History, Vessel Certificates, Vessel Inspections
- Crew Management, Team Management
- Bunkers, Bunker Management, Bunker Disputes
- Emissions, Carbon Dashboard

### Ports & Routes (Admin Only - Advanced Features)
- Fleet Routes, Route Calculator
- Port Intelligence, Port Congestion
- Port Restrictions, Port Tariffs
- ECA Zones, High Risk Areas, Geofencing

### People & HR (Admin Only)
- HR Dashboard, Attendance & Leave
- Permissions, Team Management

### Contacts & CRM (Admin Only)
- Contacts, CRM Pipeline, Customer Insights
- Agent Directory, Agent Portal, Agent Appointments
- Vendor Management

### Advanced Analytics (Admin Only)
- Operations KPI, Market Indices
- Owner ROI Dashboard, AI Engine

### AIS & Tracking (Admin Only)
- AIS Live, Fleet Dashboard, Hybrid AIS Map
- GFW Events Map, Vessel Journey Tracker
- Vessel Alerts, Geofencing

### Document Management (Admin Only - Advanced)
- Document Templates, Document Links
- Bills of Lading, eBL Chain

### Notifications & Workflow (Admin Only - Some Features)
- Expiry Tracker, Approval Workflows

### Company Management (Admin Only)
- Companies, Cost Optimization
- Tariff Management, Protecting Agents

## Implementation Details

### Backend Changes

1. **Database Schema**
   - User model has `role` field: admin, manager, operator, viewer
   - Demo user created with role: `viewer`

2. **Seed Script** (`backend/prisma/seed.ts`)
   - Added demo user creation
   - Email: demo@mari8x.com
   - Role: viewer

3. **Standalone Script** (`backend/scripts/create-demo-user.ts`)
   - Quick script to create/update demo user
   - Run: `npx tsx scripts/create-demo-user.ts`

### Frontend Changes

1. **RBAC Type System** (`frontend/src/lib/sidebar-nav-rbac.ts`)
   - Added `viewer` to UserRole type
   - Updated workflowStages navigation with role-based access
   - Added viewer role to safe pages only

2. **Auth Store** (`frontend/src/lib/stores/auth.ts`)
   - Updated role migration to support viewer role
   - Maps legacy "viewer" role to UserRole array

3. **Login Page** (`frontend/src/pages/Login.tsx`)
   - Added quick login buttons for both admin and demo
   - Visual distinction between full access and limited access

4. **Layout Component** (`frontend/src/components/Layout.tsx`)
   - Already uses `filterNavForUser()` from RBAC system
   - Automatically filters navigation based on user roles
   - No additional changes needed

## How It Works

1. **User Logs In**
   - Login mutation returns user object with `role` field
   - Auth store migrates role to `roles` array (e.g., "viewer" → ["viewer"])

2. **Navigation Filtering**
   - Layout component calls `filterNavForUser(user)`
   - Function checks each nav item's required roles
   - Items where user lacks required role are filtered out
   - Entire nav stages are hidden if no items are visible

3. **Role Hierarchy**
   - **Admin** - Sees everything (automatic bypass)
   - **Viewer** - Only sees items explicitly marked with `'viewer'` role or `'all'`
   - **Other Roles** - See items matching their specific role permissions

4. **Stage Visibility**
   - Navigation stages (Pre-Fixture, Planning, Execution, etc.) are only shown if user has access to at least one item in that stage
   - Empty stages are automatically hidden

## Testing

### Test Demo Login
1. Visit https://mari8x.com/login
2. Click "👁️ Demo - Limited Access" button
3. Click "Sign In"
4. Verify only ~20 pages are visible in sidebar
5. Critical pages (Finance, S&P, HR, etc.) should be hidden

### Test Admin Login
1. Visit https://mari8x.com/login
2. Click "👑 Admin - Full Access" button
3. Click "Sign In"
4. Verify all 153 pages are visible in sidebar
5. All nav stages should be populated

### Test Role Switching
1. Log in as demo user
2. Note limited sidebar options
3. Log out
4. Log in as admin user
5. Verify expanded sidebar options

## Security Considerations

1. **Frontend Filtering Only (Current)**
   - Navigation is filtered on frontend based on role
   - Pages are still accessible via direct URL if user knows the path
   - Suitable for demonstration purposes

2. **Recommended Backend Protection** (Future Enhancement)
   - Add GraphQL field-level authorization
   - Implement route-level guards in backend
   - Return 403 Forbidden for unauthorized access
   - Add role checks in resolvers

## Extending the System

### Adding New Pages to Demo Access

To add a page to demo user access, edit `frontend/src/lib/sidebar-nav-rbac.ts`:

```typescript
// Example: Add "Chartering" page to demo access
{
  label: 'Chartering',
  href: '/chartering',
  roles: ['broker', 'commercial', 'charterer', 'viewer', 'admin'], // Added 'viewer'
}
```

### Creating New Roles

1. Add role to type in `sidebar-nav-rbac.ts`:
   ```typescript
   export type UserRole =
     | 'admin'
     | 'viewer'
     | 'your-new-role'; // Add here
   ```

2. Add role mapping in `auth.ts`:
   ```typescript
   const roleMap: Record<string, UserRole> = {
     admin: 'admin',
     viewer: 'viewer',
     'your-new-role': 'your-new-role', // Add here
   };
   ```

3. Update workflowStages items with new role:
   ```typescript
   {
     label: 'Some Page',
     href: '/some-page',
     roles: ['admin', 'your-new-role'], // Add to relevant pages
   }
   ```

4. Create user with new role in database:
   ```sql
   INSERT INTO users (email, name, password_hash, role, organization_id)
   VALUES ('user@example.com', 'User Name', '$hash', 'your-new-role', 'org-id');
   ```

## Files Changed

### Backend
- ✅ `backend/prisma/seed.ts` - Added demo user creation
- ✅ `backend/scripts/create-demo-user.ts` - Standalone demo user script

### Frontend
- ✅ `frontend/src/lib/sidebar-nav-rbac.ts` - Added viewer role, configured page access
- ✅ `frontend/src/lib/stores/auth.ts` - Added viewer role mapping
- ✅ `frontend/src/pages/Login.tsx` - Added quick login buttons

### Documentation
- ✅ `DEMO-LOGIN-RBAC-SETUP.md` - This file

## Summary

✅ **Demo user created** with limited access to ~20 safe pages
✅ **Admin user maintained** with full access to all 153 pages
✅ **RBAC system active** - navigation automatically filtered by role
✅ **Login page updated** - quick buttons for both login types
✅ **No backend API changes needed** - frontend filtering sufficient for demo

The system is now ready for demonstration with two distinct user experiences.
