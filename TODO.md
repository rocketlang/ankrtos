# ankrICD - Detailed Project TODO

## Project Overview

**ankrICD** is a world-class ICD (Inland Container Depot) and CFS (Container Freight Station) management system with integrated Rail, Road, Waterfront, Yard, and Equipment management.

**Status:** Phase 6.5 - Mobile Apps (final phase)
**Location:** `/root/ankr-packages/@ankr/dodd-icd`

---

## Completed Items

### Phase 1: Core Foundation

- [x] Package structure and build setup
- [x] Core Type Definitions (85+ types across 8 files)
- [x] ICDEventBus (170+ event types)
- [x] Feature Flags (64 toggles)
- [x] Configuration Presets (8 presets)

### Phase 2: Core Engines

- [x] Facility Manager (`facility/facility-manager.ts`)
- [x] Container Engine (`containers/container-engine.ts`)
- [x] Yard Engine (`yard/yard-engine.ts`)
- [x] Gate Engine (`gate/gate-engine.ts`)

### Phase 3: Multimodal Transport

- [x] Rail Terminal Engine (`rail/rail-engine.ts`)
- [x] Road Transport Engine (`road/road-engine.ts`)
- [x] Waterfront Engine (`waterfront/waterfront-engine.ts`)

### Phase 4: Equipment Management

- [x] Equipment Engine (`equipment/equipment-engine.ts`)

### Phase 5: Billing & Customs

- [x] Billing Engine (`billing/billing-engine.ts`)
- [x] Customs Engine (`customs/customs-engine.ts`)

### Phase 6.1: Analytics, Operations, Documentation, Hardware, IoT

- [x] Analytics Engine (KPIs, dwell time, scorecard, dashboard)
- [x] Operations Engine (stuffing, destuffing, LCL, FCL, cross-dock, inspection)
- [x] Documentation Engine (B/L, D/O, EDI, manifests)
- [x] Hardware Manager (RFID, OCR, weighbridge)
- [x] IoT Manager (sensors, reefer monitoring, GPS tracking)

### Phase 6.2: Database & Repository Layer

- [x] Prisma schema (55+ models, 2872 lines, PostgreSQL + pgcrypto + PostGIS)
- [x] PrismaClient singleton with get/set/disconnect
- [x] Repository interfaces (IRepository, ITenantRepository)
- [x] Base repository with pagination helpers
- [x] 6 domain repositories (container, gate, rail, billing, customs, facility)
- [x] Repository registry with lazy loading

### Phase 6.3: Subscriptions & Auth

- [x] 11 GraphQL subscription topics with PubSub constants
- [x] 11 subscription resolvers with facilityId filtering
- [x] EventBus → Mercurius PubSub bridge (40+ event mappings)
- [x] JWT auth (HMAC-SHA256 sign/verify, no external deps)
- [x] RBAC with 5 roles (admin, operator, viewer, customs_officer, billing_clerk)
- [x] Fastify auth plugin with Bearer token extraction
- [x] Permission guards (requireAuth, requireRole, requireFacilityAccess)

### Phase 6.4: Frontend Dashboard (Next.js)

- [x] Next.js 15 dashboard at `dashboard/` (48 files, port 3070)
- [x] Apollo Client with HTTP + WebSocket split link
- [x] Operations Dashboard (home) — KPI cards, module summaries, scorecard
- [x] Container Tracker — paginated table, search, live subscription
- [x] Yard Visualizer — 2D block grid color-coded by utilization
- [x] Gate Monitor — lane status indicators, live transaction queue
- [x] Billing view — invoices + customers tabbed tables
- [x] Customs view — BOE + shipping bills tabbed tables
- [x] RBAC-aware UI, facility context, tenant header injection

---

## Build Output

- ESM: ~290 KB | CJS: ~291 KB | DTS: ~137 KB
- 15 engines/managers, 170+ event types, 85+ type definitions
- 55+ Prisma models, 97 GraphQL queries, 80+ mutations, 11 subscriptions
- 194 unit tests passing
- Next.js dashboard: 6 pages, 102 KB shared JS

---

## TODO: Phase 6.5 - Mobile Apps (Expo)

### 6.5 Mobile Apps
- [ ] Gate kiosk mode (truck check-in/out, appointment lookup)
- [ ] Yard operations (container location, move orders)
- [ ] Equipment checklists (pre-shift inspections, maintenance)
- [ ] Offline-first sync (local storage + background sync)
