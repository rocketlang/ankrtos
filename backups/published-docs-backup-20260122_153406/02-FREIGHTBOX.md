# FreightBox - Global Freight Management Platform

> **DCSA-Compliant Ocean, Air & Multimodal Freight Management**

**Platform:** FreightBox
**Category:** Freight Forwarding & Shipping
**Status:** MVP Complete (75% Frontend-Backend Alignment)
**Estimated Value:** $5-8M

---

## Executive Summary

FreightBox is an enterprise-grade, DCSA-compliant freight management platform supporting Ocean FCL/LCL, Air, Road, Rail, and Multimodal operations. Built on the proven ANKR Labs tech stack, it leverages 70%+ existing WowTruck packages while adding specialized freight-specific functionality.

---

## Platform Metrics

| Metric | Value |
|--------|-------|
| **Platform Modes** | Ocean FCL/LCL, Air, Road, Rail, Multimodal |
| **DCSA Compliance** | v3.0 Electronic Bill of Lading |
| **Document Types** | 37+ (eBL, AWB, Customs, Finance, etc.) |
| **Prisma Models** | 17 core models |
| **GraphQL Endpoints** | 65+ (35 queries, 30 mutations) |
| **Code Reuse** | 70% from WowTruck |
| **Time to Market** | 12 weeks to full production |

---

## Technology Stack

### Backend
- **Framework:** Fastify 4.29 (HTTP Server)
- **GraphQL:** Mercurius 13.3
- **ORM:** Prisma 5.7
- **Database:** PostgreSQL

### Frontend
- **Framework:** React 19 + TypeScript + Vite
- **Next.js:** 14 (App Router)
- **GraphQL Client:** Apollo Client
- **Styling:** Tailwind CSS + Shadcn/UI

### Integrations
- @ankr/twin (Digital Twin, Routes, eBL)
- @ankr/wire (Real-time Pub/Sub)
- @ankr/alerts (Notifications)
- @ankr/shell (UI Components)

---

## Core Services & Capabilities

### 1. Shipment Management
- **Multi-leg Support:** Ocean, Air, Road, Rail segments in single shipment
- **Real-time ETD/ETA:** Estimated and actual tracking for all legs
- **13-State Lifecycle:** DRAFT → BOOKED → CONFIRMED → IN_TRANSIT → DELIVERED
- **Event Timeline:** Comprehensive milestone tracking

### 2. Booking Management
- **Carrier Integration:** MSC, Maersk, CMA CGM, Emirates, etc.
- **Booking Workflow:** RECE → PENU → PENC → CONF → CMPL
- **EDI Support:** IFTMIN message generation
- **Cutoff Management:** SI Cutoff, VGM Cutoff tracking

### 3. Container Tracking
- **Multi-Source Tracking:** ShipsGo + GoComet aggregation
- **Container Validation:** ISO 6346 with carrier identification
- **10-State Lifecycle:** EMPTY_DEPOT to EMPTY_RETURN
- **VGM Management:** SM1/SM2 weighing methods
- **Bulk Tracking:** 100+ containers simultaneously

### 4. Electronic Bill of Lading (eBL)
- **DCSA v3.0 Compliance:** Full eBL standard implementation
- **Document Status:** DRAFT → PENDING → ISSUED → SURRENDERED → ACCOMPLISHED
- **Title Transfer Chain:** Blockchain-style hash verification
- **Endorsement Types:** BLANK, TO_ORDER, STRAIGHT
- **Multi-Platform:** DCSA native + WAVE BL platform

### 5. Document Management (37+ Types)
- **Ocean:** BOL, Sea Waybill, Shipping Instruction, Cargo Manifest
- **Air:** Master AWB, House AWB, Air Manifest, Cargo-IMP
- **Commercial:** Commercial Invoice, Packing List, Certificate of Origin
- **Customs:** Customs Declaration, eWay Bill, Hazmat Manifest
- **Finance:** Letter of Credit, Bank Draft, Invoice, Credit Note

### 6. Invoice & Payment
- **Invoice Types:** Freight, Demurrage, Detention, Customs, Handling, Storage
- **14 Charge Types:** Freight, BAF, CAF, THC, Documentation, etc.
- **Multi-Currency:** USD, INR, EUR, GBP, JPY
- **Payment Status:** DRAFT → SENT → PARTIALLY_PAID → PAID → OVERDUE

---

## Indian Government Integrations (APIBox)

### DigiLocker Integration
- Fetch KYC documents (Aadhaar, PAN, DL)
- Verify driver credentials
- Validate vehicle RC documents

### GSTN (GST Network)
- Validate GSTIN (15-character tax ID)
- Check GST compliance status
- Verify return filing (GSTR1, GSTR3B, GSTR9)

### Vahan (Vehicle Registration)
- Fetch vehicle details by registration number
- Verify fitness certificate validity
- Check national/state permit status

### eWay Bill System
- Generate eWay bills for goods movement
- Cancel eWay bills (24-hour window)
- Extend validity with remaining distance

---

## External Integrations

### Carrier EDI Integration
| Carrier | Code | Protocol | Messages |
|---------|------|----------|----------|
| MSC | MSCU | EDI | IFTMIN, IFTMBC, COPARN, VERMAS |
| Maersk | MAEU | EDI + API | IFTMIN, IFTMBC, COPARN |
| CMA CGM | CMAU | EDI | IFTMIN, IFTMBC, COPARN |
| Emirates SkyCargo | EK | Cargo-IMP | FWB, FHL, FSU |

### Tracking Platforms
- **ShipsGo:** Container tracking, vessel position, transit time
- **GoComet:** Unified visibility, exception management, ETA prediction

---

## Database Schema

### Core Models (17 Prisma Models)

| Model | Purpose |
|-------|---------|
| **Shipment** | Ocean, Air, Multimodal freight |
| **Booking** | Carrier booking requests |
| **Container** | Physical container tracking |
| **FreightDocument** | eBL, AWB, SI, Customs docs |
| **TransportLeg** | Individual transport segments |
| **Party** | Shipper, Consignee, Banks, Agents |
| **Location** | Ports, Airports, Warehouses, ICDs |
| **Vessel** | Ship details + AIS position |
| **TitleTransfer** | eBL title chain entries |

### Key Enums (16 Defined)
- FreightMode (6 modes)
- ShipmentStatus (13 states)
- BookingStatus (7 states)
- DocumentType (37 types)
- ContainerStatus (10 states)

---

## API Architecture

### GraphQL Queries (35+)
```graphql
# Shipments
query shipment(id: ID!): Shipment
query shipments(status, mode, limit): [Shipment!]!

# Containers
query container(number: String!): Container
query validateContainer(number): ContainerValidation!

# Routes (@ankr/twin)
query calculateSeaRoute(input): SeaRoute!
query compareRoutes(input): RouteComparison!
```

### GraphQL Mutations (30+)
```graphql
# eBL Operations
mutation issueEBL(input): Document!
mutation transferTitle(input): Document!
mutation surrenderEBL(documentId, remarks): Document!

# EDI
mutation processEDI(message): EDIResult!
mutation generateBookingEDI(bookingId): EDIResult!
```

### Real-time Subscriptions
```graphql
subscription shipmentUpdated(id): ShipmentUpdate!
subscription containerMoved(number): ContainerEvent!
subscription vesselPositionUpdated(imo): VesselPosition!
```

---

## Competitive Advantages

| Aspect | FreightBox | CargoWise | Project44 |
|--------|-----------|----------|----------|
| **Architecture** | Microservices + GraphQL | Monolithic | Microservices |
| **India Compliance** | Native (GST, eWay Bill) | Limited | Limited |
| **Cost Structure** | 70% code reuse | Ground-up | Enterprise pricing |
| **eBL Support** | DCSA v3.0 + WAVE | Limited | None |
| **Implementation** | 12 weeks | 2-3 years | Variable |

---

## Market Opportunity

| Metric | Size | Growth |
|--------|------|--------|
| **Ocean Freight (India)** | $8.2B | 12% CAGR |
| **Air Cargo (India)** | $2.1B | 8% CAGR |
| **NVOCC Market** | $1.2B | 18% CAGR |
| **Digital Penetration** | ~15% | 25% CAGR |

### TAM/SAM/SOM
- **TAM:** $55B (Total India Freight)
- **SAM:** $1.2B (NVOCC + Digital)
- **SOM:** $36-60M (5-year target, 3-5% penetration)

---

## Revenue Model

### NVOCC SaaS (Primary)
| Tier | Monthly | Shipments | Features |
|------|---------|-----------|----------|
| **Starter** | $999 | 100 | Basic tracking |
| **Professional** | $4,999 | 1,000 | eBL, Invoicing, EDI |
| **Enterprise** | $19,999 | Unlimited | API, Custom integrations |

### Transaction Fees
- **eWay Bill Generation:** $0.50/bill
- **Document Verification:** $1.00/document
- **EDI Processing:** $0.75/message
- **Container Tracking:** $0.25/container/month

---

## Financial Projections (3-Year)

### Conservative Scenario
| Year | Customers | MRR | ARR |
|------|-----------|-----|-----|
| Year 1 | 25 | $125K | $1.5M |
| Year 2 | 100 | $450K | $5.4M |
| Year 3 | 250 | $1.0M | $12M |

### Unit Economics
- **CAC:** $5K-8K
- **LTV:** $80K-150K
- **LTV/CAC Ratio:** 10-25x
- **Payback Period:** 6-9 months
- **Gross Margin:** 75-80%

---

## Target Customers

- **Domestic NVOCCs:** 200-500 companies
- **Freight Forwarders:** 1000+ companies
- **Customs House Agents:** 500+ companies
- **Third-party Logistics (3PL):** 300+ companies

---

## Investment Highlights

1. **DCSA Compliance:** Industry-standard eBL implementation
2. **India-First:** GST, eWay Bill, DigiLocker native
3. **Cost Efficiency:** 70% code reuse from WowTruck
4. **Fast Time-to-Market:** 12 weeks to production
5. **Multi-Modal:** Ocean, Air, Road, Rail, Multimodal

---

*Document Classification: Investor Confidential*
*Last Updated: 19 Jan 2026*
*Source: /root/ankr-labs-nx/apps/freightbox/*
