# ankrICD — Master TODO

## Project Overview

**ankrICD** is a world-class ICD (Inland Container Depot) and CFS (Container Freight Station) management system with integrated Rail, Road, Waterfront, Yard, Equipment, Billing, Customs, Analytics, Operations, Documentation, Hardware, and IoT management.

**Status:** Phase 1–6 complete · Phase 7–23 planned
**Location:** `/root/ankr-packages/@ankr/dodd-icd`
**Registry:** `@ankr/dodd-icd`
**LOC:** ~27,000+ (core library + dashboard + mobile)

---

## Completed Phases (1–6)

### Phase 1: Core Foundation ✅

- [x] Package structure and build setup (tsup ESM+CJS+DTS)
- [x] Core Type Definitions (85+ types across 8 files)
- [x] ICDEventBus (170+ event types, wildcard pattern matching)
- [x] Feature Flags (64 toggles)
- [x] Configuration Presets (8 presets)

### Phase 2: Core Engines ✅

- [x] Facility Manager (`facility/facility-manager.ts`)
- [x] Container Engine (`containers/container-engine.ts`)
- [x] Yard Engine (`yard/yard-engine.ts`)
- [x] Gate Engine (`gate/gate-engine.ts`)

### Phase 3: Multimodal Transport ✅

- [x] Rail Terminal Engine (`rail/rail-engine.ts`)
- [x] Road Transport Engine (`road/road-engine.ts`)
- [x] Waterfront Engine (`waterfront/waterfront-engine.ts`)

### Phase 4: Equipment Management ✅

- [x] Equipment Engine (`equipment/equipment-engine.ts`)

### Phase 5: Billing & Customs ✅

- [x] Billing Engine (`billing/billing-engine.ts`)
- [x] Customs Engine (`customs/customs-engine.ts`)

### Phase 6.1: Analytics, Operations, Documentation, Hardware, IoT ✅

- [x] Analytics Engine (KPIs, dwell time, scorecard, dashboard)
- [x] Operations Engine (stuffing, destuffing, LCL, FCL, cross-dock, inspection)
- [x] Documentation Engine (B/L, D/O, EDI, manifests)
- [x] Hardware Manager (RFID, OCR, weighbridge)
- [x] IoT Manager (sensors, reefer monitoring, GPS tracking)

### Phase 6.2: Database & Repository Layer ✅

- [x] Prisma schema (55+ models, 2872 lines, PostgreSQL + pgcrypto + PostGIS)
- [x] PrismaClient singleton with get/set/disconnect
- [x] Repository interfaces (IRepository, ITenantRepository)
- [x] Base repository with pagination helpers
- [x] 6 domain repositories (container, gate, rail, billing, customs, facility)
- [x] Repository registry with lazy loading

### Phase 6.3: Subscriptions & Auth ✅

- [x] 11 GraphQL subscription topics with PubSub constants
- [x] 11 subscription resolvers with facilityId filtering
- [x] EventBus → Mercurius PubSub bridge (40+ event mappings)
- [x] JWT auth (HMAC-SHA256 sign/verify, no external deps)
- [x] RBAC with 5 roles (admin, operator, viewer, customs_officer, billing_clerk)
- [x] Fastify auth plugin with Bearer token extraction
- [x] Permission guards (requireAuth, requireRole, requireFacilityAccess)

### Phase 6.4: Frontend Dashboard (Next.js) ✅

- [x] Next.js 15 dashboard at `dashboard/` (48 files, port 3070)
- [x] Apollo Client with HTTP + WebSocket split link
- [x] Operations Dashboard — KPI cards, module summaries, scorecard
- [x] Container Tracker — paginated table, search, live subscription
- [x] Yard Visualizer — 2D block grid color-coded by utilization
- [x] Gate Monitor — lane status indicators, live transaction queue
- [x] Billing view — invoices + customers tabbed tables
- [x] Customs view — BOE + shipping bills tabbed tables
- [x] RBAC-aware UI, facility context, tenant header injection

### Phase 6.5: Mobile Apps (Expo) ✅

- [x] Gate kiosk mode (truck check-in/out, active transactions, live subscription)
- [x] Yard operations (container search, list with status/holds/location)
- [x] Equipment checklists (fleet list, detail with status update mutations)
- [x] Offline-first sync (AsyncStorage queue, replay on reconnect)
- [x] Apollo Client with HTTP + WS split link
- [x] Auth context with JWT decode and RBAC
- [x] 5 shared components (StatusBadge, StatCard, LiveDot, OfflineBanner, ScanButton)

---

## Build Output (Current)

| Artifact | Size |
|---|---|
| ESM bundle | ~290 KB |
| CJS bundle | ~291 KB |
| DTS types | ~137 KB |
| Next.js dashboard | 6 pages, 102 KB shared JS |
| Expo mobile | 31 files, 1.51 MB web bundle |

- 15 engines/managers, 170+ event types, 85+ type definitions
- 55+ Prisma models, 97 GraphQL queries, 80+ mutations, 11 subscriptions
- 194 unit tests passing

---

## New Phases (7–23) — Gap Analysis vs ankrWMS

> Identified by comparing ankrICD against ankrWMS (27,774 LOC, 475 tasks, 17 phases).
> Adapted for ICD/CFS domain: containers, customs bonding, multimodal transport, hazmat (IMO/IMDG).

---

### Phase 7: 3D Visualization & Digital Twin 🔴 HIGH

> Priority: HIGH — Key differentiator for modern ICD operations

#### 7.1 Isometric Yard View (2.5D Canvas)

- [ ] Canvas-based isometric yard renderer
- [ ] Container stack rendering (multi-tier, 4-5 high)
- [ ] Color coding by container status (loaded, empty, hazmat, reefer, oversize)
- [ ] Block/bay/row/tier grid overlay
- [ ] Zoom, pan, rotate controls
- [ ] Click-to-inspect container detail popover
- [ ] Mobile-responsive touch gestures

#### 7.2 Full 3D View (Three.js WebGL)

- [ ] Three.js scene setup with warehouse/yard meshes
- [ ] 3D container models with realistic textures (20ft, 40ft, 40ft HC, reefer)
- [ ] Equipment models (RTG crane, reach stacker, trailer chassis, forklift)
- [ ] Yard layout from facility schema (blocks, lanes, rail sidings, berths)
- [ ] Real-time container position updates via WebSocket
- [ ] Camera presets (bird's eye, gate view, rail siding, berth view)
- [ ] Performance LOD (level-of-detail) for 5000+ container yards

#### 7.3 Heat Maps & Overlays

- [ ] Occupancy heat map (block utilization %, green→yellow→red)
- [ ] Dwell time heat map (aging containers highlighted)
- [ ] Reefer temperature heat map (alarm zones)
- [ ] Traffic density overlay (vehicle/equipment movement frequency)
- [ ] Customs hold overlay (bonded vs cleared containers)

#### 7.4 Digital Twin Engine

- [ ] Real-time yard twin (virtual replica synced via ICDEventBus)
- [ ] Entity tracking (containers, vehicles, equipment as twin entities)
- [ ] Space management (blocks, bays, rows, tiers, rail tracks, berths)
- [ ] State machine (container states: gate-in → yard → rail/vessel → gate-out)
- [ ] Event sourcing (full audit trail of all entity state changes)
- [ ] Predictive analytics (forecast yard congestion, berth occupancy)
- [ ] What-if simulation (test yard layout changes before applying)
- [ ] Capacity planning simulation (model peak season scenarios)

#### 7.5 Dashboard Integration

- [ ] 3D view page in Next.js dashboard (`dashboard/app/twin/page.tsx`)
- [ ] View toggle (2D grid / 2.5D isometric / 3D)
- [ ] Real-time WebSocket feed for live positions
- [ ] Overlay control panel (heat maps, labels, filters)
- [ ] Screenshot/export capability
- [ ] Mobile 3D viewer (simplified WebGL in Expo)

**Estimated tasks:** 35
**Dependencies:** @ankr/twin, Three.js, Canvas API

---

### Phase 8: Hotspot & Congestion Management 🔴 HIGH

#### 8.1 Congestion Detection Engine

- [ ] Real-time congestion detection service (`congestion/congestion-engine.ts`)
- [ ] Zone-level congestion scoring (equipment density, container throughput)
- [ ] Gate congestion tracking (queue length, average wait time)
- [ ] Rail siding bottleneck detection (rake dwell, loading/unloading delays)
- [ ] Berth congestion tracking (vessel turnaround time)
- [ ] Configurable alert thresholds per zone type
- [ ] ICDEventBus integration (`congestion.*` events)

#### 8.2 Hotspot Visualization

- [ ] Hotspot overlay on 2D yard grid (dashboard)
- [ ] Hotspot overlay on 3D digital twin
- [ ] Time-based analysis (hotspots by hour, shift, day-of-week)
- [ ] Historical congestion trend charts
- [ ] Congestion prediction (ML-based, next 4/8/24 hours)

#### 8.3 Traffic Control

- [ ] Equipment routing suggestions (avoid congested zones)
- [ ] Gate lane balancing (distribute incoming trucks across lanes)
- [ ] Task throttling (limit concurrent operations per zone)
- [ ] Priority queue management (customs-cleared containers first)
- [ ] Automated alerts to supervisors on threshold breach

#### 8.4 Prisma & GraphQL

- [ ] Prisma models: CongestionZone, CongestionReading, CongestionAlert
- [ ] Queries: getCongestionMap, getCongestionHistory, getHotspots
- [ ] Mutations: setCongestionThreshold, acknowledgeCongestionAlert
- [ ] Subscription: congestionAlertTriggered
- [ ] Dashboard congestion page (`dashboard/app/congestion/page.tsx`)

**Estimated tasks:** 25
**Dependencies:** PostGIS (spatial queries), time-series data

---

### Phase 9: Advanced Yard Management 🔴 HIGH

#### 9.1 Dock/Gate Scheduling

- [ ] Appointment booking system (truck arrival slots)
- [ ] Dock/gate availability calendar view
- [ ] Appointment conflict detection and resolution
- [ ] Gate-to-operation assignment (which gate for which operation)
- [ ] SMS/WhatsApp notification to drivers on slot confirmation
- [ ] No-show and late arrival handling

#### 9.2 Trailer & Chassis Management

- [ ] Trailer parking slot tracking in yard
- [ ] Chassis pool management (20ft, 40ft, specialized)
- [ ] Trailer check-in/check-out workflow
- [ ] Trailer location tracking (GPS + manual update)
- [ ] Chassis assignment to containers for road transport

#### 9.3 Container Stacking Optimization

- [ ] AI-driven stacking recommendations (minimize re-handles)
- [ ] Segregation rules (hazmat, reefer, oversize, empty, export, import)
- [ ] Weight-based stacking (heavy on bottom)
- [ ] Departure-date stacking (earliest departure on top/outside)
- [ ] Container shuffle/restow planning
- [ ] Stacking efficiency KPI tracking

#### 9.4 Empty Container Management

- [ ] Empty container depot operations
- [ ] Empty allotment booking (shipping line → exporter)
- [ ] Empty survey/inspection on receipt
- [ ] Empty pre-trip inspection (reefer)
- [ ] Empty release workflow (DO-based)
- [ ] Shipping line empty stock reconciliation

#### 9.5 Yard Map Editor

- [ ] Visual drag-drop yard layout editor
- [ ] Block/bay/row/tier configuration
- [ ] Zone type assignment (import, export, reefer, hazmat, empty, CFS)
- [ ] Rail siding placement on yard map
- [ ] Gate/lane placement on yard map
- [ ] Save/version yard layouts

**Estimated tasks:** 35
**Dependencies:** Phase 7 (3D views), Phase 8 (hotspots)

---

### Phase 10: ERP Integration 🟡 MEDIUM

#### 10.1 ERP Connection Framework

- [ ] ERP connection abstraction layer (`erp/erp-connector.ts`)
- [ ] Configuration schema (endpoint, auth, sync interval)
- [ ] Tally connector (TDL/ODBC)
- [ ] SAP connector (RFC/BAPI, optional)
- [ ] ANKR ERP connector (GraphQL native)
- [ ] Connection health monitoring and retry logic

#### 10.2 Master Data Sync

- [ ] Customer master sync (importers, exporters, CHAs, shipping lines)
- [ ] Vessel/voyage master sync
- [ ] Commodity/HSN code master sync
- [ ] Tariff rate master sync
- [ ] Sync scheduling (cron-based, configurable intervals)
- [ ] Sync status dashboard with last-sync timestamps
- [ ] Manual sync trigger

#### 10.3 Transaction Sync

- [ ] Invoice posting to ERP (ICD charges, CFS charges)
- [ ] Receipt posting to ERP (payment receipts)
- [ ] Goods receipt note (GRN) for container cargo
- [ ] Inventory adjustment posting (survey damages, shortages)
- [ ] Credit/debit note sync
- [ ] ERP sync audit log

#### 10.4 Financial Integration

- [ ] Tally XML export format generation
- [ ] SAP IDoc format generation (optional)
- [ ] Bank reconciliation data exchange
- [ ] Outstanding receivables sync
- [ ] ERP integration dashboard page

**Estimated tasks:** 26
**Dependencies:** @ankr/erp-* packages

---

### Phase 11: CRM Integration 🟡 MEDIUM

#### 11.1 Customer 360 View

- [ ] Unified customer profile (importer, exporter, CHA, shipping line)
- [ ] Container history per customer (volume, revenue, dwell patterns)
- [ ] Payment history and outstanding dues
- [ ] Service level tracking (gate turnaround, delivery SLA)
- [ ] Customer rating/scoring

#### 11.2 Customer Portal

- [ ] Self-service web portal for customers (`portal/`)
- [ ] Container tracking by B/L number or container number
- [ ] Invoice and payment history
- [ ] Delivery order request workflow
- [ ] Document download (B/L, D/O, gate pass, weighment slip)
- [ ] Complaint/ticket submission

#### 11.3 SLA Management

- [ ] SLA definition per customer/contract
- [ ] SLA compliance monitoring (delivery time, gate turnaround)
- [ ] SLA breach alerts and escalation
- [ ] SLA reporting dashboard

#### 11.4 3PL Customer Billing

- [ ] Storage billing (per TEU/day, per ground slot/day)
- [ ] Handling billing (lift-on/lift-off, stuffing, destuffing)
- [ ] Transportation billing (rail/road movement charges)
- [ ] Monthly consolidated invoice generation
- [ ] Customer billing dashboard
- [ ] Tariff schedule management

#### 11.5 CRM Sync

- [ ] ANKR CRM connector (GraphQL)
- [ ] Lead/opportunity tracking for new ICD customers
- [ ] Contact management and communication log
- [ ] Campaign management (trade promotions, volume discounts)

**Estimated tasks:** 28
**Dependencies:** @ankr/crm-* packages

---

### Phase 12: Custom Bond & Bonded Warehouse 🔴 HIGH

> Critical for ICD operations — containers under customs bond

#### 12.1 Bond Management

- [ ] Bond registration and tracking (`bond/bond-engine.ts`)
- [ ] Bond types (private bonded, public bonded, special bonded)
- [ ] Bond license details (validity, renewal tracking)
- [ ] Bond amount management (utilized vs available)
- [ ] Bond renewal workflow with alerts
- [ ] Multi-bond support per facility

#### 12.2 Bonded Container Operations

- [ ] Bond-in workflow (container placed under bond)
- [ ] Bond-out workflow (container released from bond)
- [ ] Bond period tracking (days under bond, maximum allowed)
- [ ] Bond extension request workflow
- [ ] Bonded inventory register (customs requirement)
- [ ] Daily bond stock statement generation

#### 12.3 Customs Integration for Bonded Ops

- [ ] ICEGATE integration for bond operations
- [ ] Ex-bond Bill of Entry processing
- [ ] In-bond Bill of Entry processing
- [ ] Bond cancellation/transfer workflow
- [ ] Customs examination scheduling for bonded cargo
- [ ] Bonded cargo insurance tracking

#### 12.4 Prisma & GraphQL

- [ ] Prisma models: Bond, BondedContainer, BondMovement, BondStatement
- [ ] Queries: getBonds, getBondedContainers, getBondStatement
- [ ] Mutations: registerBond, bondIn, bondOut, extendBond, cancelBond
- [ ] Subscription: bondStatusChanged
- [ ] Dashboard bond management page

**Estimated tasks:** 25
**Dependencies:** Phase 5 (Customs Engine)

---

### Phase 13: Advanced Inspections & QC 🟡 MEDIUM

#### 13.1 Container Survey & Inspection

- [ ] Container survey engine (`inspection/inspection-engine.ts`)
- [ ] Pre-stuffing survey (export containers)
- [ ] De-stuffing survey (import containers)
- [ ] Empty container survey (return to depot)
- [ ] Reefer pre-trip inspection (PTI)
- [ ] Damage assessment with photo capture
- [ ] Survey report generation (PDF)

#### 13.2 Customs Examination

- [ ] First-check examination workflow
- [ ] Second-check (percentage) examination workflow
- [ ] Examination officer assignment
- [ ] Sample drawing and lab test tracking
- [ ] Examination report and findings entry
- [ ] Re-examination workflow
- [ ] VACIS/X-ray scanner integration

#### 13.3 Cargo Inspection & QC

- [ ] Cargo quality check templates (by commodity)
- [ ] Weight verification (tare, gross, net) — SOLAS VGM compliance
- [ ] Dimension verification
- [ ] Temperature verification (reefer cargo)
- [ ] Fumigation tracking and certificates
- [ ] Phytosanitary inspection tracking
- [ ] QC hold/release workflow

#### 13.4 Inspection Dashboard

- [ ] Inspection queue management
- [ ] Inspection calendar/scheduling
- [ ] Inspection results summary
- [ ] Inspection analytics (pass/fail rates, common defects)
- [ ] Mobile inspection form (Expo app extension)

**Estimated tasks:** 28
**Dependencies:** Phase 6.5 (Mobile for photo capture)

---

### Phase 14: Labor Management & Cost Allocation 🟡 MEDIUM

#### 14.1 Workforce Management

- [ ] Worker/staff registry with roles and shifts
- [ ] Shift management (day, night, rotating)
- [ ] Clock in/out tracking (biometric/RFID)
- [ ] Task assignment to workers/gangs
- [ ] Gang management (stuffing/destuffing gangs)
- [ ] Overtime tracking and calculation

#### 14.2 Productivity Tracking

- [ ] Units handled per worker per shift (TEU/hour)
- [ ] Container moves per equipment operator per shift
- [ ] Gate transactions per officer per shift
- [ ] Accuracy tracking (error rate)
- [ ] Productivity leaderboard
- [ ] Incentive calculation

#### 14.3 Cost Allocation

- [ ] Labor cost rates per role/shift
- [ ] Equipment cost rates (per hour/per move)
- [ ] Cost allocation to containers (handling cost per TEU)
- [ ] Cost allocation to customers (per operation)
- [ ] Cost center management (gate, yard, rail, CFS, bonded)
- [ ] Budget vs actual tracking

#### 14.4 Cost Reports

- [ ] Daily labor cost report
- [ ] Equipment utilization cost report
- [ ] Customer-wise cost analysis
- [ ] Operation-wise cost breakdown
- [ ] Cost KPI dashboard
- [ ] Cost optimization recommendations

**Estimated tasks:** 26
**Dependencies:** Phase 4 (Equipment), Phase 5 (Billing)

---

### Phase 15: Advanced Equipment & MHE 🟡 MEDIUM

#### 15.1 Equipment Telematics

- [ ] GPS tracking integration (live equipment positions)
- [ ] Speed monitoring and geo-fencing
- [ ] Fuel/battery level monitoring
- [ ] Engine hours tracking
- [ ] Idle time detection
- [ ] Telematics dashboard (map view)

#### 15.2 Operator Certification

- [ ] Operator license registry (forklift, crane, reach stacker)
- [ ] License expiry alerts (30/15/7 day warnings)
- [ ] Training records management
- [ ] Certification status check before task assignment
- [ ] Certification compliance report

#### 15.3 Safety & Impact Detection

- [ ] Impact sensor integration (collision detection)
- [ ] Impact event logging and alerting
- [ ] Pre-shift safety inspection checklists (digital forms)
- [ ] Safety incident reporting
- [ ] Near-miss reporting
- [ ] Safety KPI dashboard

#### 15.4 Charging & Battery Management (Electric MHE)

- [ ] Charging dock management (slots, availability)
- [ ] Battery swap tracking
- [ ] Charging schedule optimization
- [ ] Battery health monitoring
- [ ] Charging cost tracking
- [ ] Electric vs diesel MHE comparison reports

#### 15.5 Maintenance Enhancement

- [ ] Preventive maintenance calendar
- [ ] Maintenance work order management
- [ ] Spare parts inventory tracking
- [ ] Vendor management for equipment servicing
- [ ] Maintenance cost analysis
- [ ] Equipment lifecycle management (depreciation, replacement)

**Estimated tasks:** 30
**Dependencies:** Phase 4 (Equipment Engine)

---

### Phase 16: Advanced EDI & Integration 🟡 MEDIUM

#### 16.1 EDI Framework

- [ ] X12 EDI parser/generator framework (`edi/edi-engine.ts`)
- [ ] EDIFACT parser/generator (UN/EDIFACT standard)
- [ ] ANSI X12 support for ICD-relevant transactions
- [ ] Trading partner configuration (ISA/GS qualifiers)
- [ ] EDI validation and schema checking
- [ ] EDI transaction dashboard

#### 16.2 Inbound EDI

- [ ] COPARN (Container pre-announcement) parser
- [ ] BAPLIE (Bayplan) parser for vessel stowage
- [ ] IFTMIN (Booking confirmation) parser
- [ ] CUSCAR (Customs cargo report) parser
- [ ] EDI 856 (ASN) parser — container arrival notice
- [ ] EDI 940 (Warehouse order) parser — delivery instructions
- [ ] Auto-create operations from EDI messages

#### 16.3 Outbound EDI

- [ ] COARRI (Container discharge/load report) generator
- [ ] CODECO (Gate in/out report) generator
- [ ] IFTSTA (Status update) generator
- [ ] EDI 945 (Shipping advice) generator
- [ ] EDI 944 (Receipt advice) generator
- [ ] EDI 997 (Acknowledgment) generator

#### 16.4 EDI Transport

- [ ] SFTP transport (file-based EDI)
- [ ] AS2 transport (secure EDI)
- [ ] HTTP/API transport
- [ ] EDI polling service (receive inbound)
- [ ] EDI send queue and retry logic
- [ ] EDI error alerting

**Estimated tasks:** 28
**Dependencies:** Phase 6.1 (Documentation Engine)

---

### Phase 17: E-Way Bill, E-Invoice & GST Compliance 🔴 HIGH

> Critical for India ICD operations — mandatory government compliance

#### 17.1 E-Way Bill

- [ ] Auto-generate E-Way Bill on dispatch (>₹50,000 threshold)
- [ ] E-Way Bill validation before gate-out
- [ ] E-Way Bill extension (validity extension for delays)
- [ ] Multi-invoice consolidation on single E-Way Bill
- [ ] NIC E-Way Bill API integration
- [ ] E-Way Bill cancellation (within 24 hours)
- [ ] Part-B update for transporter change

#### 17.2 E-Invoice

- [ ] E-Invoice generation (IRN via NIC/GSP)
- [ ] QR code generation for invoices
- [ ] E-Invoice cancellation (within 24 hours)
- [ ] E-Invoice for debit/credit notes
- [ ] GSP integration (ClearTax, Masters India, etc.)

#### 17.3 GST Returns

- [ ] GSTR-1 data export (outward supplies)
- [ ] GSTR-2A reconciliation (inward supplies matching)
- [ ] GSTR-3B summary generation
- [ ] HSN-wise summary reports
- [ ] Multi-GSTIN support (for multi-facility operations)
- [ ] ITC (Input Tax Credit) tracking
- [ ] GST compliance dashboard

#### 17.4 Other Compliance

- [ ] TDS deduction and filing support
- [ ] PAN verification for customers
- [ ] FEMA compliance for bonded cargo
- [ ] RBI compliance for forex transactions (CFS)
- [ ] Customs duty payment tracking (ICEGATE)

**Estimated tasks:** 25
**Dependencies:** Phase 5 (Billing), Phase 12 (Bonded)

---

### Phase 18: AI/ML Features 🟡 MEDIUM

#### 18.1 Yard Optimization AI

- [ ] AI-driven container placement recommendations
- [ ] Minimize re-handle predictions (stack planning)
- [ ] Berth-to-yard routing optimization
- [ ] Rail siding loading sequence optimization
- [ ] Gate lane allocation optimization (peak hours)

#### 18.2 Demand Forecasting

- [ ] Container volume forecast (import/export by week)
- [ ] Yard occupancy prediction (next 7/14/30 days)
- [ ] Equipment demand forecasting
- [ ] Staffing requirement prediction
- [ ] Seasonal pattern detection

#### 18.3 Anomaly Detection

- [ ] Unusual dwell time alerts (containers stuck too long)
- [ ] Abnormal gate patterns (unusual timing, frequency)
- [ ] Equipment anomaly detection (unusual movement patterns)
- [ ] Revenue anomaly detection (billing discrepancies)
- [ ] Customs clearance delay patterns

#### 18.4 AI Assistant

- [ ] Natural language queries ("How many reefer containers in yard?")
- [ ] Voice command support (Hindi/English bilingual)
- [ ] @ankr/ai-router integration for LLM access
- [ ] @ankr/eon integration for knowledge/memory
- [ ] Chat widget in dashboard and mobile

**Estimated tasks:** 22
**Dependencies:** @ankr/ai-router, @ankr/eon, pgvector

---

### Phase 19: Voice-Directed Operations 🟢 LOW

#### 19.1 Voice Engine

- [ ] STT/TTS integration via @ankr/voice-ai
- [ ] Hindi + English bilingual support
- [ ] Voice command grammar for ICD operations
- [ ] Noise cancellation for yard environment
- [ ] Headset/wearable device support

#### 19.2 Voice Workflows

- [ ] Voice-directed container tallying
- [ ] Voice-directed stuffing/destuffing
- [ ] Voice-directed gate operations
- [ ] Voice confirmation flows (verify container number, seal number)
- [ ] Voice-based inspection reporting

**Estimated tasks:** 12
**Dependencies:** @ankr/voice-ai, Phase 18 (AI)

---

### Phase 20: Drone Operations 🟢 LOW

#### 20.1 Drone Fleet Management

- [ ] Drone registration with specs (payload, flight time, sensors)
- [ ] Drone status tracking (idle, flying, charging, maintenance)
- [ ] Charging dock management
- [ ] Drone operator certification tracking

#### 20.2 Drone Missions

- [ ] Yard inventory count via drone (RFID/camera-based)
- [ ] Flight path planning for container blocks
- [ ] No-fly zone management (near rail tracks, cranes)
- [ ] Container number OCR from aerial photography
- [ ] Mission results processing and inventory reconciliation
- [ ] Live mission tracking on yard map

#### 20.3 Safety & Compliance

- [ ] Worker/equipment proximity alerts during flight
- [ ] Emergency landing protocols
- [ ] Flight log auditing
- [ ] DGCA compliance (India indoor drone operations)

**Estimated tasks:** 16
**Dependencies:** Phase 7 (3D View), Phase 6.1 (Hardware)

---

### Phase 21: Advanced RFID & Barcode 🟡 MEDIUM

#### 21.1 RFID Enhancement

- [ ] UHF RFID portal gates (auto-read at gate entry/exit)
- [ ] RFID tag encoding (container-level, seal-level)
- [ ] RFID-based container tracking (walk-through inventory)
- [ ] RFID yard inventory scan (drive-through with handheld)
- [ ] RFID read subscriptions (real-time via ICDEventBus)
- [ ] RFID tag lifecycle management

#### 21.2 Barcode & Label Enhancement

- [ ] GS1-128 barcode parser and validator
- [ ] Label template designer (drag-drop)
- [ ] Zebra ZPL label printing integration
- [ ] Label types: container, gate pass, weighment slip, D/O, B/L
- [ ] QR code generation for document verification
- [ ] Barcode scan validation in mobile app

#### 21.3 OCR Enhancement

- [ ] Container number OCR accuracy improvement
- [ ] ISO 6346 container code validation
- [ ] Seal number OCR
- [ ] Vehicle registration OCR (gate automation)
- [ ] Document OCR (B/L, commercial invoice)

**Estimated tasks:** 20
**Dependencies:** Phase 6.1 (Hardware Manager)

---

### Phase 22: Cycle Counting & Inventory Reconciliation 🟡 MEDIUM

#### 22.1 Physical Counting

- [ ] Scheduled cycle counting (daily/weekly/monthly)
- [ ] Zone-based counting (count one block at a time)
- [ ] Blind counting mode (counter doesn't see expected values)
- [ ] Mobile counting app (scan containers, mark present/absent)
- [ ] Photo evidence for discrepancies
- [ ] Count completion tracking

#### 22.2 Reconciliation

- [ ] Variance detection (system vs physical count)
- [ ] Auto-classification (missing, found, misplaced, extra)
- [ ] Adjustment workflow with approval
- [ ] Customs notification for bonded container discrepancies
- [ ] Shipping line notification for container discrepancies

#### 22.3 Reporting

- [ ] Count accuracy KPI (target: 99.5%+)
- [ ] Discrepancy trend analysis
- [ ] Zone-wise accuracy reports
- [ ] Monthly reconciliation summary
- [ ] Audit-ready count history

**Estimated tasks:** 18
**Dependencies:** Phase 2 (Container Engine), Phase 12 (Bonded)

---

### Phase 23: Advanced Reporting & Analytics 🟡 MEDIUM

#### 23.1 Operational Reports

- [ ] Container dwell time report (by customer, shipping line, commodity)
- [ ] Gate turnaround time report
- [ ] Rail rake turnaround report
- [ ] Vessel turnaround report (CFS)
- [ ] Stuffing/destuffing throughput report
- [ ] Equipment utilization report
- [ ] Daily operations summary (auto-generated)

#### 23.2 Financial Reports

- [ ] Revenue report (by service type, customer, period)
- [ ] Outstanding receivables aging report
- [ ] Customer-wise revenue analysis
- [ ] Cost center-wise P&L
- [ ] Budget vs actual tracking
- [ ] Tariff comparison report

#### 23.3 Compliance Reports

- [ ] Customs bond stock statement
- [ ] Daily gate register (customs requirement)
- [ ] Container movement register
- [ ] Hazmat container register
- [ ] Reefer temperature log report
- [ ] CONCOR/RLDA statutory reports (for rail ICDs)

#### 23.4 Executive Dashboard & MIS

- [ ] MIS dashboard (executive summary with trends)
- [ ] Custom report builder (drag-drop fields, filters)
- [ ] Scheduled report emails (PDF/Excel)
- [ ] Export formats: PDF, Excel, CSV
- [ ] Report template management
- [ ] Year-on-year comparison charts
- [ ] Benchmark vs industry standards

**Estimated tasks:** 30
**Dependencies:** Phase 6.1 (Analytics Engine)

---

## Summary

| Phase | Name | Tasks | Priority | Status |
|-------|------|-------|----------|--------|
| 1 | Core Foundation | 5 | — | ✅ Complete |
| 2 | Core Engines | 4 | — | ✅ Complete |
| 3 | Multimodal Transport | 3 | — | ✅ Complete |
| 4 | Equipment Management | 1 | — | ✅ Complete |
| 5 | Billing & Customs | 2 | — | ✅ Complete |
| 6.1 | Analytics/Ops/Docs/HW/IoT | 5 | — | ✅ Complete |
| 6.2 | Database & Repository | 6 | — | ✅ Complete |
| 6.3 | Subscriptions & Auth | 7 | — | ✅ Complete |
| 6.4 | Dashboard (Next.js) | 8 | — | ✅ Complete |
| 6.5 | Mobile (Expo) | 7 | — | ✅ Complete |
| **7** | **3D Visualization & Digital Twin** | **35** | 🔴 HIGH | 🔲 Planned |
| **8** | **Hotspot & Congestion Mgmt** | **25** | 🔴 HIGH | 🔲 Planned |
| **9** | **Advanced Yard Management** | **35** | 🔴 HIGH | 🔲 Planned |
| **10** | **ERP Integration** | **26** | 🟡 MED | 🔲 Planned |
| **11** | **CRM Integration** | **28** | 🟡 MED | 🔲 Planned |
| **12** | **Custom Bond & Bonded WH** | **25** | 🔴 HIGH | 🔲 Planned |
| **13** | **Advanced Inspections & QC** | **28** | 🟡 MED | 🔲 Planned |
| **14** | **Labor Mgmt & Cost Allocation** | **26** | 🟡 MED | 🔲 Planned |
| **15** | **Advanced Equipment & MHE** | **30** | 🟡 MED | 🔲 Planned |
| **16** | **Advanced EDI & Integration** | **28** | 🟡 MED | 🔲 Planned |
| **17** | **E-Way Bill / E-Invoice / GST** | **25** | 🔴 HIGH | 🔲 Planned |
| **18** | **AI/ML Features** | **22** | 🟡 MED | 🔲 Planned |
| **19** | **Voice-Directed Operations** | **12** | 🟢 LOW | 🔲 Planned |
| **20** | **Drone Operations** | **16** | 🟢 LOW | 🔲 Planned |
| **21** | **Advanced RFID & Barcode** | **20** | 🟡 MED | 🔲 Planned |
| **22** | **Cycle Counting & Reconciliation** | **18** | 🟡 MED | 🔲 Planned |
| **23** | **Advanced Reporting & Analytics** | **30** | 🟡 MED | 🔲 Planned |

**Completed:** 48 tasks (Phases 1–6.5)
**Planned:** ~419 tasks (Phases 7–23)
**Total:** ~467 tasks across 23 phases

---

## Implementation Priority Order

1. **Phase 12** — Custom Bond & Bonded Warehouse (ICD-critical, no WMS equivalent)
2. **Phase 17** — E-Way Bill / E-Invoice / GST (mandatory compliance)
3. **Phase 7** — 3D Visualization & Digital Twin (key differentiator)
4. **Phase 8** — Hotspot & Congestion Management
5. **Phase 9** — Advanced Yard Management
6. **Phase 13** — Advanced Inspections & QC
7. **Phase 22** — Cycle Counting & Reconciliation
8. **Phase 10** — ERP Integration
9. **Phase 11** — CRM Integration
10. **Phase 14** — Labor Management & Cost Allocation
11. **Phase 15** — Advanced Equipment & MHE
12. **Phase 16** — Advanced EDI & Integration
13. **Phase 21** — Advanced RFID & Barcode
14. **Phase 23** — Advanced Reporting & Analytics
15. **Phase 18** — AI/ML Features
16. **Phase 19** — Voice-Directed Operations
17. **Phase 20** — Drone Operations
