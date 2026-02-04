# WowTruck TMS - Transport Management System

> **India's Most Comprehensive Fleet & Freight Management Platform**

**Platform:** WowTruck 2.0
**Category:** Logistics & Transportation Technology
**Status:** Production Ready
**Estimated Value:** $8-12M

---

## Executive Summary

WowTruck is a fully-featured, enterprise-grade Transport Management System (TMS) built specifically for Indian logistics operations. The platform is production-ready with **142 database models**, **~80 services**, **50+ API endpoints**, and comprehensive support for real-time tracking, compliance, and financial management.

---

## Platform Metrics

| Metric | Value |
|--------|-------|
| **Total Lines of Code** | 128,572+ |
| **Backend TypeScript** | 61,042 lines across 81 files |
| **Frontend TSX** | 67,530 lines across 129 components |
| **Database Models** | 142 entities |
| **GraphQL Resolvers** | 17,039 lines |
| **Business Services** | 32,234 lines across 27 services |
| **API Routes** | 2,345 lines across 10 route files |
| **Frontend Pages** | 53 distinct pages |

---

## Technology Stack

### Backend
- **Framework:** Fastify 4.x HTTP server
- **GraphQL:** Mercurius GraphQL server
- **ORM:** Prisma 5.22
- **Database:** PostgreSQL 15+
- **Cache:** Redis
- **Real-time:** WebSocket

### Frontend
- **Framework:** React 18.2 with Vite
- **State:** Apollo Client, Zustand
- **Styling:** TailwindCSS + Framer Motion
- **Maps:** Leaflet for GPS tracking

### Mobile
- **Framework:** React Native with Expo
- **Features:** PWA-capable driver app with offline mode

---

## Core Services & Capabilities

### 1. Order & Trip Management
- Order lifecycle management (11 states: Draft → Completed)
- Automated trip creation and assignment
- Status workflow enforcement with validation rules
- Container management and logistics planning
- Multi-pickup/delivery support
- Priority-based processing

### 2. Fleet & Vehicle Management
- Real-time vehicle tracking with GPS
- Maintenance log tracking
- Fuel consumption monitoring
- Driver-vehicle assignments
- Certification expiry monitoring (RC, Insurance, Fitness, Permit, PUC)
- Reputation scoring system

### 3. Real-Time GPS Tracking & Geofencing
- Sub-meter accuracy GPS tracking
- Configurable geofence types (polygon, circle, route buffer)
- Alert triggers on entry, exit, dwell
- Speed monitoring and overspeed alerts
- Route deviation detection
- Historical data for compliance and analytics

### 4. Financial Management & Accounting
- **Double-Entry Bookkeeping:** Complete chart of accounts
- **GST Compliance:** CGST/SGST/IGST calculations
- **E-Invoice Generation:** GST-compliant invoicing
- **Bank Reconciliation:** Automated statement matching
- **TDS Certificate Generation:** Tax compliance
- **Multi-Currency Support:** Exchange rate handling

### 5. Communication & CRM
- WhatsApp Business API integration
- Email inbox processing
- Lead management and scoring
- Two-way messaging platform
- Multi-language support

### 6. Document Management & OCR
- AI-powered document extraction
- Optical Character Recognition for LR/POD
- Blockchain-based document verification (DocChain)
- PDF generation for invoices and reports

### 7. Route Optimization & Dynamic Pricing
- Multi-stop route optimization
- Traffic-aware ETA calculation
- Fuel-cost optimization
- Demand-based pricing
- Competitor price monitoring
- Surge pricing during peak demand

---

## Unique Innovations

### Dynamic Pricing Engine (17 Factors)
```
Final Rate = BaseRate × SurgeMultiplier × SeasonalFactor × FuelSurcharge × RoutePremium
           + UrgencyPremium + HandlingCharges + TollEstimate + Insurance + GST
```

**Features:**
- 5-level surge multiplier system (1.0x - 1.8x)
- Indian festival calendar integration (15+ festivals)
- Real-time diesel price linkage
- Route difficulty premium (mountain, border, metro congestion)

### Route Optimization with HOS Compliance
- TSP Algorithm with 2-Opt Improvement
- Indian Driver Hours of Service compliance
- Automatic rest stop planning
- Traffic time adjustment multipliers

### Auto-Quote Engine
- Sub-1-second quote generation
- Multi-vehicle recommendations (3-5 alternatives)
- Volume tier discounts (5-15% based on trips)
- WhatsApp + Hindi language support
- Negotiation handler (accepts counter-offers within 10%)

---

## Database Schema Highlights

### Core Entities (142 Models)

**Master Data:**
- User, Branch, Role (RBAC)
- Customer, Contract, Lead
- Vehicle, Driver, VehicleType
- Warehouse, WarehouseZone
- Port, ShippingLine, Container

**Transactional:**
- Order, OrderDocument, OrderStatusHistory
- Trip, TripPosition, TripEvent
- Invoice, InvoiceItem, Payment, PaymentBatch
- Rate, PriceQuote, SurgePricing
- Geofence, Alert, DashboardWidget

**Financial:**
- Account, JournalEntry, JournalLine
- Budget, CostCenter, ProfitCenter
- TDSCertificate, GSTReturn, BankReconciliation

**HR & Operations:**
- HrmsEmployee, HrmsDepartment
- HrmsLeaveRequest, HrmsAttendance, HrmsPayslip

---

## Frontend Features (53 Pages)

### Operations Dashboard
- CommandCenter - Unified operations with real-time updates
- Trips, Orders, Vehicles, Drivers management
- GPSTracking - Live vehicle tracking with map
- FleetAnalytics - Performance metrics and KPIs

### Financial Module
- Invoices, Payments, Accounting
- BankReconciliation, EInvoice, RatingsSettlements

### Customer Engagement
- Customers, Leads, Quotes, RFQ, CRM
- WhatsAppInbox, EmailInbox

### Advanced Features
- FlowCanvas - Workflow builder and automation
- RouteCalculator - Multi-stop route optimization
- AutoQuote - Automated quotation engine
- DynamicPricing - Price optimization

### Intelligence
- ANKRIntelligenceDashboard - AI-powered insights
- PulseDashboard - Real-time metrics
- RealtimeDashboard - Live operational view

---

## API Architecture

### GraphQL Endpoints (200+)

**Order Management:**
```graphql
query orders(status, customerId, limit): [Order!]!
mutation createOrder(input): Order!
mutation updateOrderStatus(id, status): Order!
```

**Fleet & Tracking:**
```graphql
query vehicles(status, type): [Vehicle!]!
query getVehiclePosition(vehicleId): VehiclePosition
subscription vehicleLocationUpdated(vehicleId): VehiclePosition!
```

**Financial:**
```graphql
query trialBalance(periodId): TrialBalance!
query profitAndLoss(startDate, endDate): PnL!
mutation createInvoice(orderId): Invoice!
```

---

## Integrations

1. **WhatsApp Business API** - Driver notifications, customer updates
2. **Banking Systems** - Real-time reconciliation, payment instructions
3. **GST/E-Invoice System** - Compliance reporting
4. **Document OCR (Vision AI)** - LR/POD extraction
5. **ULIP (India Unified Logistics)** - Vehicle info, Fastag, E-way bills
6. **Route Optimization APIs** - OSRM/Google Maps integration
7. **Blockchain/DocChain** - Document immutability

---

## Competitive Advantages

| Feature | WowTruck | Porter | Rivigo | BlackBuck |
|---------|----------|--------|--------|-----------|
| Dynamic Pricing | 17 factors | Basic | Static | Manual |
| Festival Calendar | 15+ festivals | No | No | No |
| HOS Compliance | Automatic | Manual | Manual | No |
| WhatsApp Quotes | Native | No | No | No |
| Hindi Support | Full | No | No | No |
| Double-Entry Accounting | Yes | No | No | No |

---

## Market Opportunity

- **TAM:** $50B Indian logistics market
- **SAM:** $15B road freight segment
- **SOM:** $500M tech-enabled freight
- **Growth:** 12% CAGR

---

## Investment Highlights

1. **Production Ready:** 128,000+ lines of code, 142 database models
2. **India-Optimized:** Festival pricing, GST compliance, Hindi support
3. **Enterprise Features:** Double-entry accounting, multi-branch support
4. **AI/ML Ready:** ML endpoints for routing, pricing, demand forecasting
5. **Scalable:** Supports 10 to 1000+ vehicles

---

## Revenue Model

- **Subscription:** $500-5,000 per month per operator
- **Transaction Fees:** 2-5% on managed GMV
- **Premium Services:** Advanced analytics, driver safety, fuel optimization
- **API Marketplace:** Third-party integrations

---

## Go-to-Market

- **Immediate Deployment:** Cloud-based, no installation
- **Quick Onboarding:** 1-2 weeks implementation
- **ROI:** 3-6 months payback period
- **Target:** Fleet operators with 10-1000 vehicles

---

*Document Classification: Investor Confidential*
*Last Updated: 19 Jan 2026*
*Source: /root/ankr-labs-nx/apps/wowtruck/*
