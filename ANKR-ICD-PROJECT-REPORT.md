# ankrICD — Complete Project Report

## Executive Summary

**ankrICD** (`@ankr/dodd-icd`) is a comprehensive ICD (Inland Container Depot) and CFS (Container Freight Station) management platform built as part of the ANKR Universe ecosystem. It covers the full lifecycle of container operations — gate entry, yard placement, rail/road/waterfront transport, stuffing/destuffing, customs clearance, billing, and equipment management — with a real-time GraphQL API, Next.js dashboard, and Expo mobile app.

| Metric | Value |
|--------|-------|
| Package | `@ankr/dodd-icd` |
| Location | `/root/ankr-packages/@ankr/dodd-icd` |
| LOC | ~27,000+ |
| Engines | 15 domain engines/managers |
| Type Definitions | 85+ types across 8 files |
| Event Types | 170+ (ICDEventBus) |
| Feature Flags | 64 toggles |
| Prisma Models | 55+ (2,872-line schema) |
| GraphQL | 97 queries, 80+ mutations, 11 subscriptions |
| Unit Tests | 194 passing |
| Dashboard | Next.js 15, 48 files, 6 pages |
| Mobile | Expo SDK 52, 31 files, 3 tab modules |
| Build Output | ESM ~290 KB, CJS ~291 KB, DTS ~137 KB |
| Completed Phases | 1–6.5 (48 tasks) |
| Planned Phases | 7–23 (419 tasks) |
| Total Phases | 23 |

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Next.js 15       │  │  Expo SDK 52      │               │
│  │  Dashboard        │  │  Mobile App       │               │
│  │  (port 3070)      │  │  (Gate/Yard/Equip) │              │
│  │  Apollo Client    │  │  Apollo Client     │              │
│  │  6 pages          │  │  3 tabs + details  │              │
│  └────────┬─────────┘  └────────┬──────────┘               │
│           │ HTTP + WS            │ HTTP + WS                │
└───────────┼──────────────────────┼──────────────────────────┘
            │                      │
┌───────────┼──────────────────────┼──────────────────────────┐
│           ▼                      ▼                          │
│  ┌──────────────────────────────────────────┐               │
│  │         Fastify + Mercurius              │               │
│  │         GraphQL Server (port 4070)       │               │
│  │  ┌────────────┐  ┌─────────────────┐     │               │
│  │  │ 97 Queries │  │ 80+ Mutations   │     │               │
│  │  └────────────┘  └─────────────────┘     │               │
│  │  ┌────────────────┐  ┌────────────┐      │               │
│  │  │ 11 Subscriptions│  │ JWT Auth   │     │               │
│  │  │ (WebSocket)     │  │ RBAC (5)   │     │               │
│  │  └────────────────┘  └────────────┘      │               │
│  └──────────────────┬───────────────────────┘               │
│                     │                                        │
│  ┌──────────────────▼───────────────────────┐               │
│  │           DOMAIN ENGINES                  │               │
│  │                                           │               │
│  │  Container  │  Yard      │  Gate          │               │
│  │  Rail       │  Road      │  Waterfront    │               │
│  │  Equipment  │  Billing   │  Customs       │               │
│  │  Analytics  │  Operations│  Documentation │               │
│  │  Hardware   │  IoT       │  Facility      │               │
│  └──────────────────┬───────────────────────┘               │
│                     │                                        │
│  ┌──────────────────▼───────────────────────┐               │
│  │         ICDEventBus (170+ events)         │               │
│  │         PubSub Bridge (40+ mappings)      │               │
│  └──────────────────┬───────────────────────┘               │
│                     │                                        │
│  ┌──────────────────▼───────────────────────┐               │
│  │         REPOSITORY LAYER                  │               │
│  │  6 domain repos │ BaseRepository          │               │
│  │  ITenantRepository │ Pagination helpers   │               │
│  └──────────────────┬───────────────────────┘               │
│                     │                                        │
│  ┌──────────────────▼───────────────────────┐               │
│  │     PostgreSQL + Prisma ORM               │               │
│  │     55+ models │ pgcrypto │ PostGIS       │               │
│  └──────────────────────────────────────────┘               │
│                   SERVER LAYER                               │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Core Library** | TypeScript, tsup (ESM + CJS + DTS) |
| **API Server** | Fastify 5, Mercurius (GraphQL), graphql-ws |
| **Database** | PostgreSQL, Prisma ORM, pgcrypto, PostGIS |
| **Auth** | JWT (HMAC-SHA256), RBAC (5 roles) |
| **Dashboard** | Next.js 15, React 19, Tailwind CSS 4, Apollo Client 3 |
| **Mobile** | Expo SDK 52, React Native 0.76, Expo Router 4, Apollo Client |
| **Events** | ICDEventBus (custom, 170+ typed events) |
| **Subscriptions** | Mercurius PubSub over WebSocket |
| **Testing** | Vitest, 194 tests |

---

## Domain Engines (15)

### 1. Facility Manager (`facility/facility-manager.ts`)

Manages ICD/CFS facility configuration, zones, blocks, and operational settings.

- Facility CRUD (create, update, activate, deactivate)
- Zone management (import, export, reefer, hazmat, empty, CFS, bonded)
- Block/bay/row/tier configuration
- Operating hours and shift schedules
- Multi-tenant support (tenantId + facilityId scoping)

### 2. Container Engine (`containers/container-engine.ts`)

Full container lifecycle from gate-in to gate-out.

- Container registration (ISO 6346 compliant numbering)
- Container types: 20ft, 40ft, 40ft HC, reefer, flat rack, open top, tank
- Status tracking: gate-in, yard, on-rail, on-vessel, customs-hold, released, gate-out
- Hold management (customs hold, shipping line hold, payment hold)
- Container movement history (full audit trail)
- Container search by number, B/L, customer

### 3. Yard Engine (`yard/yard-engine.ts`)

Yard placement and utilization management.

- Container placement (block-bay-row-tier addressing)
- Yard utilization tracking (percentage per block/zone)
- Container move orders (yard-to-yard, yard-to-gate, yard-to-rail)
- Zone-wise container counts
- Reefer plug management (reefer slot allocation)
- Yard capacity alerts

### 4. Gate Engine (`gate/gate-engine.ts`)

Gate-in and gate-out transaction processing.

- Gate lane management (import, export, empty lanes)
- Gate-in workflow: truck arrival → document check → weighment → yard assignment
- Gate-out workflow: release order verification → weighment → exit
- Vehicle/driver registration
- Document verification (D/O, gate pass, e-way bill)
- Gate turnaround time tracking
- Live gate transaction queue

### 5. Rail Terminal Engine (`rail/rail-engine.ts`)

Rail operations for rail-connected ICDs.

- Rake management (arrival, loading, unloading, departure)
- Wagon tracking (container-to-wagon mapping)
- Rail siding management (track allocation)
- CONCOR/RLDA reporting integration
- Rake schedule management
- Container loading sequence planning
- Rail customs clearance coordination

### 6. Road Transport Engine (`road/road-engine.ts`)

Road movement management between ICD, port, and customer locations.

- Trip management (ICD-to-port, port-to-ICD, door delivery)
- Vehicle tracking (GPS integration)
- Driver management and assignment
- Route optimization
- Transport document generation
- Freight calculation

### 7. Waterfront Engine (`waterfront/waterfront-engine.ts`)

CFS and port-side waterfront operations.

- Vessel/voyage management
- Berth allocation and scheduling
- Container discharge and loading plans
- Vessel turnaround tracking
- Port-to-CFS movement coordination
- Shipping line coordination

### 8. Equipment Engine (`equipment/equipment-engine.ts`)

Equipment fleet management for yard operations.

- Equipment registry (RTG cranes, reach stackers, forklifts, trailer trucks)
- Equipment status tracking (operational, maintenance, breakdown)
- Assignment to operations
- Utilization tracking
- Maintenance scheduling
- Fuel/battery monitoring

### 9. Billing Engine (`billing/billing-engine.ts`)

ICD/CFS tariff and invoice management.

- Tariff master (service-wise charges)
- Invoice generation (storage, handling, transport, customs)
- Customer account management
- Payment receipt tracking
- Credit/debit notes
- Outstanding dues tracking
- Revenue analytics

### 10. Customs Engine (`customs/customs-engine.ts`)

Indian customs clearance operations.

- Bill of Entry (BOE) processing (import)
- Shipping Bill processing (export)
- Customs examination workflow
- Duty calculation and payment tracking
- Let Export Order (LEO) processing
- Out of Charge (OOC) issuance
- ICEGATE message integration
- Customs officer assignment

### 11. Analytics Engine (`analytics/analytics-engine.ts`)

Operational KPIs and business intelligence.

- Terminal KPIs (throughput, dwell time, gate turnaround)
- Performance scorecard
- Dashboard summary data
- Trend analysis
- Utilization reports
- Revenue analytics

### 12. Operations Engine (`operations/operations-engine.ts`)

CFS cargo handling operations.

- Stuffing (consolidation of LCL cargo into FCL containers)
- Destuffing (deconsolidation of FCL into LCL)
- Cross-docking
- Cargo inspection coordination
- Tally operations
- Operation scheduling and tracking

### 13. Documentation Engine (`documentation/documentation-engine.ts`)

Shipping document management.

- Bill of Lading (B/L) management
- Delivery Order (D/O) processing
- Cargo manifest generation
- EDI message handling
- Document templates
- Document verification

### 14. Hardware Manager (`hardware/hardware-manager.ts`)

Physical device integration.

- RFID reader integration
- OCR (container number recognition)
- Weighbridge integration
- CCTV integration
- Barrier/boom gate control
- Printer integration (labels, gate passes)

### 15. IoT Manager (`iot/iot-manager.ts`)

Sensor and monitoring integration.

- Reefer temperature monitoring
- GPS tracking (vehicles, equipment)
- Environmental sensors (temperature, humidity)
- Sensor alert management
- Data ingestion pipeline
- Real-time sensor feeds

---

## Type System (85+ Types)

### Type Files

| File | Types | Description |
|------|-------|-------------|
| `types/common.ts` | ~15 | Shared types (ID, Timestamp, Money, Address, Coordinates) |
| `types/container.ts` | ~12 | Container, ContainerType, ContainerStatus, Hold |
| `types/yard.ts` | ~10 | YardBlock, YardSlot, YardZone, YardPosition |
| `types/gate.ts` | ~10 | GateTransaction, GateLane, GateStatus |
| `types/transport.ts` | ~12 | Rake, Wagon, Trip, Vessel, Voyage, Berth |
| `types/equipment.ts` | ~8 | Equipment, EquipmentType, MaintenanceRecord |
| `types/billing.ts` | ~10 | Invoice, Tariff, Payment, Customer |
| `types/customs.ts` | ~8 | BillOfEntry, ShippingBill, CustomsExam |

---

## Event System (170+ Events)

The `ICDEventBus` provides typed, pub-sub event handling across all engines.

### Event Categories

| Category | Events | Examples |
|----------|--------|---------|
| container.* | ~25 | registered, statusChanged, moved, holdPlaced, holdReleased |
| gate.* | ~15 | transactionStarted, gateInCompleted, gateOutCompleted |
| yard.* | ~12 | containerPlaced, containerMoved, capacityAlert |
| rail.* | ~15 | rakeArrived, loadingStarted, rakeDispatched |
| road.* | ~10 | tripStarted, tripCompleted, vehicleTracked |
| waterfront.* | ~12 | vesselArrived, dischargStarted, loadingCompleted |
| equipment.* | ~12 | assigned, statusChanged, maintenanceAlert |
| billing.* | ~10 | invoiceGenerated, paymentReceived, overdueAlert |
| customs.* | ~12 | boeFilied, examScheduled, outOfCharge |
| operations.* | ~10 | stuffingStarted, destuffingCompleted, crossDockStarted |
| iot.* | ~10 | sensorReading, reeferAlarm, gpsUpdate |
| hardware.* | ~8 | rfidRead, ocrScanned, weighmentCompleted |
| analytics.* | ~5 | kpiUpdated, scorecardGenerated |
| facility.* | ~8 | created, updated, zoneChanged |
| documentation.* | ~6 | blIssued, doGenerated, manifestCreated |

### Features

- Wildcard pattern matching (`container.*`, `*.statusChanged`)
- Typed event payloads (TypeScript generics)
- Async event handlers
- Event history (optional persistence)
- Facility-scoped events

---

## Database Schema (Prisma)

**55+ models** across 2,872 lines of Prisma schema.

### Key Models

| Model | Description |
|-------|-------------|
| Tenant | Multi-tenant root |
| Facility | ICD/CFS facility |
| Container | Core container entity |
| YardBlock, YardSlot | Yard structure |
| GateTransaction | Gate in/out records |
| GateLane | Gate lane config |
| Rake, Wagon | Rail entities |
| Vessel, Voyage, Berth | Waterfront entities |
| Trip, Vehicle, Driver | Road transport |
| Equipment | Fleet equipment |
| Invoice, Payment, Tariff | Billing |
| BillOfEntry, ShippingBill | Customs |
| Sensor, SensorReading | IoT |
| RFIDTag, WeighmentRecord | Hardware |

### Database Features

- **pgcrypto**: Field-level encryption for sensitive data
- **PostGIS**: Spatial queries for yard positioning and GPS tracking
- Multi-tenant isolation (tenantId on all models)
- Soft deletes (deletedAt)
- Audit fields (createdAt, updatedAt, createdBy, updatedBy)
- Pagination support (cursor-based + offset)

---

## GraphQL API

### Server

- **Fastify 5** with Mercurius GraphQL plugin
- **Port:** 4070
- **WebSocket:** graphql-ws for subscriptions
- **Auth:** JWT Bearer token, RBAC middleware

### Query Stats

| Type | Count | Examples |
|------|-------|---------|
| Queries | 97 | containers, gateTransactions, rakes, invoices, facilities |
| Mutations | 80+ | registerContainer, startGateIn, createInvoice, scheduleRake |
| Subscriptions | 11 | containerStatusChanged, gateTransactionUpdated, equipmentAlert |

### RBAC Roles

| Role | Permissions |
|------|-------------|
| admin | Full access to all operations |
| operator | CRUD on containers, gate, yard, equipment, operations |
| viewer | Read-only access to all modules |
| customs_officer | Customs module full access, read-only on others |
| billing_clerk | Billing module full access, read-only on others |

---

## Frontend Dashboard (Next.js 15)

**Location:** `dashboard/` | **Port:** 3070 | **Files:** 48

### Pages

| Page | Route | Description |
|------|-------|-------------|
| Operations Dashboard | `/` | 8 KPI cards, 6 module summaries, performance scorecard |
| Container Tracker | `/containers` | Paginated table, search, status filter, live subscription |
| Yard Visualizer | `/yard` | 2D CSS grid, block utilization color coding (green→red) |
| Gate Monitor | `/gate` | Lane status indicators, live transaction queue |
| Billing | `/billing` | Invoices + customers tabbed tables |
| Customs | `/customs` | BOE + shipping bills tabbed tables |

### Frontend Stack

- Next.js 15 App Router
- React 19
- Tailwind CSS 4 (brand color palette)
- Apollo Client 3.x (HTTP + WebSocket split link)
- shadcn/ui components (New York style)
- Lucide React icons
- RBAC-aware UI (role-based visibility)
- Facility context (multi-facility support)
- Tenant header injection

### Shared Components

- `StatCard` — KPI card with variants (default, success, warning, danger, info)
- `DataTable<T>` — Generic sortable table with pagination
- `StatusBadge` — Color-coded status for 14+ states
- `LiveDot` — Animated green pulse for live indicators
- `SearchInput` — Debounced search (400ms)
- `EmptyState` — Placeholder for empty data

---

## Mobile App (Expo)

**Location:** `mobile/` | **Files:** 31 | **SDK:** Expo 52

### Modules

| Tab | Features |
|-----|----------|
| Gate Kiosk | Truck check-in/out, active transactions, live subscription, camera scan |
| Yard Operations | Container search by number, list with status/holds/location |
| Equipment | Fleet list, status updates, maintenance scheduling |

### Mobile Stack

- Expo SDK 52 (managed workflow)
- React Native 0.76
- Expo Router 4 (file-based routing)
- Apollo Client 3.x (HTTP + WS split link)
- AsyncStorage (auth token, facility selection, offline queue)
- expo-camera (barcode/QR scanning)
- expo-network (online/offline detection)

### Offline-First Sync

- Failed mutations queued in AsyncStorage
- Automatic replay on network reconnect
- `useOffline()` hook: `{ isOnline, queueLength, syncNow }`
- `<OfflineBanner />` shows offline/pending-sync status

### Shared Components

- `StatusBadge` — React Native status badge (14 colors)
- `StatCard` — KPI card
- `LiveDot` — Animated opacity pulse
- `OfflineBanner` — Red (offline) / yellow (pending sync)
- `ScanButton` — Camera scan trigger

---

## Feature Flags (64 Toggles)

Feature flags enable/disable functionality at the facility level.

### Categories

| Category | Flags | Examples |
|----------|-------|---------|
| Container | ~8 | hazmatSupport, reeferMonitoring, oversizeHandling |
| Yard | ~6 | autoPlacement, reeferPlugManagement, stackOptimization |
| Gate | ~6 | rfidAutoRead, ocrEnabled, weighbridgeIntegration |
| Rail | ~5 | rakeScheduling, wagonTracking, railCustomsClearance |
| Road | ~4 | gpsTracking, routeOptimization, driverManagement |
| Waterfront | ~5 | vesselScheduling, berthAllocation, dischargeePlanning |
| Equipment | ~5 | maintenanceAlerts, fuelTracking, utilizationMonitoring |
| Billing | ~5 | autoInvoicing, onlinePayment, tariffManagement |
| Customs | ~6 | icegateIntegration, examWorkflow, bondManagement |
| Operations | ~5 | stuffingScheduling, crossDocking, tallyAutomation |
| IoT | ~4 | sensorMonitoring, reeferAlarms, gpsTracking |
| Hardware | ~5 | rfidPortals, ocrGates, weighbridgeAuto |

---

## Configuration Presets (8)

Pre-configured settings for common ICD/CFS deployment scenarios.

| Preset | Description |
|--------|-------------|
| `small-icd` | Small dry port (< 500 TEU/month) |
| `medium-icd` | Mid-size ICD with rail siding |
| `large-icd` | Large ICD with multiple rail sidings |
| `cfs-basic` | Basic CFS near port |
| `cfs-full` | Full-featured CFS with stuffing/destuffing |
| `rail-terminal` | Rail-focused terminal (CONCOR-style) |
| `bonded-warehouse` | Customs-bonded facility |
| `multimodal-hub` | Full multimodal hub (rail + road + waterfront) |

---

## Test Coverage

| Suite | Tests | Status |
|-------|-------|--------|
| Container Engine | ~35 | Passing |
| Gate Engine | ~30 | Passing |
| Yard Engine | ~25 | Passing |
| Rail Engine | ~25 | Passing |
| Road Engine | ~15 | Passing |
| Waterfront Engine | ~15 | Passing |
| Equipment Engine | ~15 | Passing |
| Billing Engine | ~10 | Passing |
| Customs Engine | ~10 | Passing |
| EventBus | ~8 | Passing |
| Feature Flags | ~6 | Passing |
| **Total** | **194** | **All passing** |

---

## Roadmap (Phases 7–23)

### HIGH Priority

| Phase | Name | Tasks | Description |
|-------|------|-------|-------------|
| 7 | 3D Visualization & Digital Twin | 35 | Three.js 3D yard, isometric view, heat maps, digital twin engine |
| 8 | Hotspot & Congestion Management | 25 | Real-time congestion detection, hotspot visualization, traffic control |
| 9 | Advanced Yard Management | 35 | Dock scheduling, chassis management, stacking optimization, yard editor |
| 12 | Custom Bond & Bonded Warehouse | 25 | Bond management, bonded ops, ICEGATE integration |
| 17 | E-Way Bill / E-Invoice / GST | 25 | NIC API integration, IRN generation, GSTR returns |

### MEDIUM Priority

| Phase | Name | Tasks | Description |
|-------|------|-------|-------------|
| 10 | ERP Integration | 26 | Tally/SAP/ANKR ERP connectors, master sync, transaction sync |
| 11 | CRM Integration | 28 | Customer portal, SLA management, 3PL billing |
| 13 | Advanced Inspections & QC | 28 | Container survey, customs examination, cargo QC, SOLAS VGM |
| 14 | Labor Management & Cost | 26 | Workforce management, productivity tracking, cost allocation |
| 15 | Advanced Equipment & MHE | 30 | Telematics, operator certification, safety, charging management |
| 16 | Advanced EDI | 28 | COPARN, BAPLIE, CODECO, COARRI, X12, EDIFACT, AS2 transport |
| 18 | AI/ML Features | 22 | Yard optimization AI, demand forecasting, anomaly detection |
| 21 | Advanced RFID & Barcode | 20 | RFID portals, label designer, OCR enhancement |
| 22 | Cycle Counting | 18 | Physical counting, reconciliation, variance analysis |
| 23 | Advanced Reporting | 30 | Operational/financial/compliance reports, MIS dashboard |

### LOW Priority

| Phase | Name | Tasks | Description |
|-------|------|-------|-------------|
| 19 | Voice-Directed Operations | 12 | STT/TTS, voice-directed tallying and gate ops |
| 20 | Drone Operations | 16 | Drone fleet, yard inventory counting, aerial OCR |

**Total planned:** 419 tasks across 17 new phases

---

## ANKR Package Dependencies

ankrICD integrates with the broader ANKR ecosystem:

| Package | Purpose |
|---------|---------|
| `@ankr/twin` | Digital twin rendering engine |
| `@ankr/ai-router` | AI/LLM routing for natural language queries |
| `@ankr/eon` | Knowledge base and memory for AI assistant |
| `@ankr/voice-ai` | Speech-to-text / text-to-speech |
| `@ankr/einvoice` | E-Invoice IRN generation |
| `@ankr/erp-*` | ERP integration packages |
| `@ankr/crm-*` | CRM integration packages |
| `@ankr/wire` | Real-time event streaming |

---

## Deployment

### Development

```bash
# Core library
cd /root/ankr-packages/@ankr/dodd-icd
pnpm build              # ESM + CJS + DTS via tsup

# API server
pnpm dev:server         # Fastify + Mercurius on port 4070

# Dashboard
cd dashboard
npm run dev             # Next.js on port 3070

# Mobile
cd mobile
npx expo start --web    # Expo on port 8081
npx expo start --android
npx expo start --ios
```

### Production

```bash
# Build all
pnpm build              # Core library
cd dashboard && npm run build    # Next.js static export
cd mobile && npx expo export --platform web  # Expo web export

# Run
node dist/server.js     # API server
npx next start          # Dashboard
```

---

## Project Statistics

| Metric | Value |
|--------|-------|
| Total files | 200+ |
| Core library files | ~60 |
| Dashboard files | 48 |
| Mobile files | 31 |
| Prisma schema | 2,872 lines |
| GraphQL operations | 188 (97Q + 80M + 11S) |
| Unit tests | 194 |
| Event types | 170+ |
| Feature flags | 64 |
| Config presets | 8 |
| RBAC roles | 5 |
| Domain engines | 15 |
| Completed phases | 10 (1–6.5) |
| Planned phases | 17 (7–23) |
| Total tasks | 467 |
| Completion | 10.3% (48/467) |

---

*Generated: January 2026*
*Package: @ankr/dodd-icd v1.0.0*
*Part of ANKR Universe — Jai Guruji, Guru Kripa*
