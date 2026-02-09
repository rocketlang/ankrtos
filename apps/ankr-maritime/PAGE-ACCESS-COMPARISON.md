# Page Access Comparison: Admin vs Demo Login

## Quick Reference

| Login Type | Email | Password | Pages Visible | Use Case |
|------------|-------|----------|---------------|----------|
| 👑 **Admin** | admin@ankr.in | admin123 | **153 pages** | Full operational access, all features |
| 👁️ **Demo** | demo@mari8x.com | demo123 | **~20 pages** | Safe demonstration, read-only views |

---

## Detailed Page Access Matrix

### ✅ Pages Visible to BOTH Admin & Demo

| Page | Path | Category |
|------|------|----------|
| Dashboard | `/` | Core |
| Analytics | `/analytics` | Intelligence |
| Reports | `/reports` | Intelligence |
| Mari8x LLM | `/mari8x-llm` | Intelligence |
| Knowledge Base | `/knowledge-base` | Intelligence |
| Advanced Search | `/advanced-search` | Intelligence |
| Documents (DMS) | `/documents` | Documents |
| Alerts | `/alerts` | Notifications |
| Activity | `/activity` | Notifications |
| Mentions | `/mentions` | Notifications |
| Features | `/features` | Intelligence |
| Market Overview | `/market-overview` | Pre-Fixture |
| Vessels | `/vessels` | Fleet & Assets |
| Vessel Positions | `/vessel-positions` | Fleet & Assets |
| Ports | `/ports` | Ports & Routes |
| Port Map | `/port-map` | Ports & Routes |

**Total: ~16 pages available to demo users**

---

### 🔒 Pages Visible ONLY to Admin (Hidden from Demo)

#### Pre-Fixture & Commercial (6 pages)
- Chartering - `/chartering`
- Cargo Enquiries - `/cargo-enquiries`
- Open Tonnage - `/open-tonnage`
- Market Indices - `/market-indices`
- CRM Pipeline - `/crm-pipeline`
- Contacts - `/contacts`

#### Planning (7 pages)
- Voyage Estimate - `/voyage-estimate`
- Voyages - `/voyages`
- Route Calculator - `/route-calculator`
- Port Intelligence - `/port-intelligence`
- Weather Warranty - `/weather-warranty`
- Cargo Compatibility - `/cargo-compatibility`
- Agent Directory - `/agent-directory`

#### Execution & Operations (8 pages)
- AIS Live - `/ais/live`
- DA Desk - `/da-desk`
- Port Documents - `/port-documents`
- Noon Reports - `/noon-reports`
- Noon Reports (Auto) - `/noon-reports-enhanced`
- SOF Manager - `/sof-manager`
- Delay Alerts - `/delay-alerts`
- Critical Path - `/critical-path`
- Agent Portal - `/agent-portal`

#### Settlement & Documentation (8 pages)
- Laytime - `/laytime`
- Bills of Lading - `/bills-of-lading`
- eBL Chain - `/ebl-chain`
- Claims - `/claims`
- Claim Packages - `/claim-packages`
- Invoices - `/invoices`
- FDA Disputes - `/fda-disputes`
- Hire Payments - `/hire-payments`

#### Fleet & Assets (14 pages)
- Vessel Portal - `/vessel-portal`
- Fleet Portal - `/fleet-portal`
- Vessel History - `/vessel-history`
- Vessel Certificates - `/vessel-certificates`
- Vessel Inspections - `/vessel-inspections`
- Crew - `/crew`
- Team - `/team`
- Bunkers - `/bunkers`
- Bunker Management - `/bunker-management`
- Bunker Disputes - `/bunker-disputes`
- Emissions - `/emissions`
- Carbon Dashboard - `/carbon`
- Fleet Performance - `/fleet/performance`
- Weather Routing - `/weather-routing`

#### Commercial Contracts (6 pages)
- Time Charters - `/time-charters`
- COA Management - `/coa`
- V/E History - `/ve-history`
- Cost Benchmarks - `/cost-benchmarks`
- Revenue Analytics - `/revenue-analytics`
- Owner ROI Dashboard - `/owner-roi-dashboard`

#### Ports & Routes (8 pages)
- Fleet Routes - `/fleet-routes`
- Port Congestion - `/port-congestion`
- Port Restrictions - `/port-restrictions`
- Port Tariffs - `/port-tariffs`
- ECA Zones - `/eca-zones`
- High Risk Areas - `/high-risk-areas`
- Geofencing - `/geofencing`
- World Port Index - `/world-port-index`

#### Finance (9 pages)
- Cash to Master - `/cash-to-master`
- FX Dashboard - `/fx-dashboard`
- Letters of Credit - `/letters-of-credit`
- Trade Payments - `/trade-payments`
- Freight Derivatives - `/freight-derivatives`
- Bank Reconciliation - `/bank-reconciliation`
- Cost Optimization - `/cost-optimization`
- Tariff Management - `/tariff-management`

#### Compliance & Risk (6 pages)
- ISM/ISPS Compliance - `/compliance`
- KYC - `/kyc`
- Insurance Policies - `/insurance`
- Sanctions Screening - `/sanctions`

#### Documents (Advanced) (3 pages)
- Document Templates - `/document-templates`
- Document Links - `/document-links`

#### S&P Operations (5 pages)
- S&P Desk - `/snp-desk`
- Sale Listings - `/sale-listings`
- SNP Deals - `/snp-deals`
- SNP Valuation - `/snp-valuation`
- Closing Tracker - `/closing-tracker`

#### Intelligence (Advanced) (4 pages)
- Operations KPI - `/operations-kpi`
- AI Engine - `/ai-engine`
- Flow Canvas - `/flow-canvas`

#### Notifications (Advanced) (2 pages)
- Expiry Tracker - `/expiry-tracker`
- Approval Workflows - `/approvals`

#### People & HR (7 pages)
- Customer Insights - `/customer-insights`
- Vendor Management - `/vendor-management`
- Agent Appointments - `/agent-appointments`
- Permissions - `/permissions`
- HR Dashboard - `/hr`
- Attendance & Leave - `/attendance`

#### Company Management (4 pages)
- Companies - `/companies`
- Protecting Agents - `/protecting-agents`

#### AIS & Tracking (8 pages)
- Fleet Dashboard - `/ais/fleet-dashboard`
- Vessel Alerts - `/ais/alerts`
- AIS Geofencing - `/ais/geofencing`
- Hybrid AIS Map - `/ais/hybrid-map`
- GFW Events Map - `/ais/gfw-events`
- Vessel Journey - `/ais/vessel-journey`

**Total: ~137 pages visible only to admin**

---

## Navigation Stages Comparison

### Demo User Sees (5 stages with items):
1. **Execution** (1 item: Dashboard)
2. **Fleet & Assets** (2 items: Vessels, Positions)
3. **Ports & Routes** (2 items: Ports, Port Map)
4. **Documents** (1 item: DMS)
5. **Intelligence** (6 items: Analytics, Reports, Mari8xLLM, Knowledge, Search, Features)
6. **Notifications** (3 items: Alerts, Activity, Mentions)
7. **Pre-Fixture** (1 item: Market Overview)

**Total: 7 stages, ~16 items**

### Admin User Sees (All 15 stages):
1. Pre-Fixture (7 items)
2. Planning (8 items)
3. Execution (9 items)
4. Settlement (8 items)
5. Fleet & Assets (14 items)
6. Commercial (6 items)
7. Ports & Routes (11 items)
8. Finance (9 items)
9. Compliance (6 items)
10. Documents (3 items)
11. S&P (5 items)
12. Intelligence (11 items)
13. Notifications (5 items)
14. People (7 items)
15. Company (4 items)

**Total: 15 stages, ~153 items**

---

## Role-Based Access Summary

### Demo User (Viewer Role)
- ✅ **Can access**: Public information, dashboards, read-only views
- ✅ **Can view**: Vessels, ports, market overview, analytics
- ✅ **Can use**: Knowledge base, document search, reports
- ❌ **Cannot access**: Financial data, commercial operations, HR
- ❌ **Cannot access**: Claims, compliance, S&P operations
- ❌ **Cannot access**: Operational tools (DA Desk, Laytime, Bunkers)

### Admin User (Admin Role)
- ✅ **Full access to everything**
- ✅ **All 153 pages visible**
- ✅ **All operational features enabled**
- ✅ **Complete system control**

---

## Login Page Features

The updated login page at https://mari8x.com/login now includes:

1. **Quick Login Buttons**
   - 👑 Admin - Full Access button
   - 👁️ Demo - Limited Access button
   - One-click credential filling

2. **Visual Distinction**
   - Blue icon for Admin (full access)
   - Green icon for Demo (limited access)
   - Clear labels showing access level

3. **Manual Entry**
   - Email and password fields still available
   - Works for any user in the system

---

## Testing Checklist

### ✅ Test Demo Login
1. Visit https://mari8x.com/login
2. Click "👁️ Demo - Limited Access"
3. Click "Sign In"
4. Verify sidebar shows only ~16 pages
5. Verify stages like "Finance", "S&P", "HR" are hidden
6. Try accessing /invoices directly → should show page but may have data restrictions

### ✅ Test Admin Login
1. Visit https://mari8x.com/login
2. Click "👑 Admin - Full Access"
3. Click "Sign In"
4. Verify sidebar shows all ~153 pages
5. Verify all 15 stages are visible
6. Verify all operational features work

### ✅ Test Role Switching
1. Log in as demo
2. Note limited sidebar
3. Log out
4. Log in as admin
5. Verify expanded sidebar
6. Confirm different user experience

---

## Implementation Status

| Component | Status | Details |
|-----------|--------|---------|
| Backend - Demo User | ✅ Complete | Created in database with viewer role |
| Backend - Seed Script | ✅ Complete | Auto-creates demo user on fresh db |
| Frontend - RBAC System | ✅ Complete | Role-based filtering active |
| Frontend - Login UI | ✅ Complete | Quick login buttons added |
| Frontend - Auth Store | ✅ Complete | Viewer role mapping configured |
| Frontend - Navigation | ✅ Complete | Auto-filters based on user role |
| Documentation | ✅ Complete | This file + RBAC setup guide |

---

## Next Steps (Optional Enhancements)

1. **Backend Route Protection**
   - Add GraphQL resolver-level authorization
   - Return 403 errors for unauthorized queries
   - Implement field-level security

2. **Additional Demo Restrictions**
   - Read-only mode enforcement
   - Data filtering (show only demo/sample data)
   - Rate limiting for demo accounts

3. **More User Roles**
   - Create role for "charterer" (commercial focus)
   - Create role for "agent" (port operations focus)
   - Create role for "technical" (vessel maintenance focus)

4. **Analytics Dashboard**
   - Track demo user engagement
   - Monitor which pages demo users visit most
   - A/B test different demo page combinations

---

## Support

For issues or questions:
- Check `/root/apps/ankr-maritime/DEMO-LOGIN-RBAC-SETUP.md` for detailed setup
- Run verification: `cd backend && npx tsx scripts/verify-users.ts`
- Re-create demo user: `cd backend && npx tsx scripts/create-demo-user.ts`
