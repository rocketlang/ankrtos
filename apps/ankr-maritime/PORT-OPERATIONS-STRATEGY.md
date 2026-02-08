# Port Operations & Gate-In Integration Strategy

## ✅ Current Open-Source Mapping Stack (Confirmed)

### Maps Technology (100% Free & Open Source):
- **Leaflet 1.9.4** - Interactive maps library (MIT License)
- **OpenStreetMap** - Base map tiles (ODbL License)
- **OpenSeaMap** - Nautical charts overlay (CC-BY-SA)
- **CartoDB Dark Tiles** - Dark theme tiles (BSD License)

### Current Implementation:
```typescript
// Already using across multiple components:
- VesselPortal.tsx ✓
- FleetRouteVisualizer.tsx ✓
- FleetPortal.tsx ✓
- PortCongestionDashboard.tsx ✓
- OpenSeaPortsMap.tsx ✓
- LiveShipsMap.tsx ✓
```

**Total Cost: $0/month** (vs Mapbox: ~$500/month for similar usage)

---

## 🚢 Port Operations Integration Strategy

### Phase 1: Gate-In/Gate-Out Foundation (Immediate)

#### A. Vessel Arrival Management
**Current Mari8X Capabilities:**
- Real-time AIS tracking (52M+ positions)
- Port congestion monitoring
- ETA predictions
- Port intelligence

**New: Gate-In Module**
```typescript
interface GateInEvent {
  eventId: string;
  vesselId: string;
  portUnlocode: string;
  gateInTime: Date;
  cargoType: 'BULK_DRY' | 'BULK_LIQUID' | 'CONTAINER' | 'RORO' | 'GENERAL';
  operationType: 'LOADING' | 'DISCHARGE';

  // Bulk-specific
  bulkDetails?: {
    commodity: string; // Iron Ore, Coal, Grain, etc.
    quantity: number;  // MT
    holds: string[];   // Which holds
    surveyorName?: string;
    draftSurvey?: boolean;
  };

  // Tank/Liquid-specific
  tankDetails?: {
    product: string;   // Crude, CPP, LNG, etc.
    quantity: number;  // BBL or MT
    tanks: string[];   // Which tanks
    temperature?: number;
    api?: number;
    sulphur?: number;
  };

  // Documents
  documents: {
    billOfLading?: string;
    cargoManifest?: string;
    dangerousGoodsDeclaration?: string;
    portClearance?: string;
  };

  // Port agent
  agentId: string;
  terminalId?: string;
  berthId?: string;
}
```

#### B. Database Schema Addition
```prisma
model GateInEvent {
  id            String   @id @default(uuid())
  vesselId      String
  vessel        Vessel   @relation(fields: [vesselId], references: [id])

  portUnlocode  String
  port          Port     @relation(fields: [portUnlocode], references: [unlocode])

  gateInTime    DateTime
  gateOutTime   DateTime?

  cargoType     CargoType
  operationType OperationType

  // Bulk cargo fields
  bulkCommodity    String?
  bulkQuantityMT   Float?
  bulkHolds        String[]
  draftSurveyDone  Boolean @default(false)

  // Tank cargo fields
  tankProduct      String?
  tankQuantityBBL  Float?
  tankQuantityMT   Float?
  tanks            String[]
  temperature      Float?
  apiGravity       Float?
  sulphurContent   Float?

  // Operations
  agentId          String
  agent            PortAgent @relation(fields: [agentId], references: [id])
  terminalId       String?
  berthId          String?

  // Documents
  documents        Json

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([vesselId])
  @@index([portUnlocode])
  @@index([gateInTime])
}

model Terminal {
  id           String  @id @default(uuid())
  portUnlocode String
  port         Port    @relation(fields: [portUnlocode], references: [unlocode])

  name         String
  terminalCode String

  // Capabilities
  bulkHandling     Boolean @default(false)
  liquidHandling   Boolean @default(false)
  containerHandling Boolean @default(false)

  // Capacity
  maxVessels       Int?
  berths           Berth[]

  // Equipment
  cranes           Int?
  conveyors        Boolean @default(false)
  pipelines        Boolean @default(false)

  createdAt    DateTime @default(now())

  @@unique([portUnlocode, terminalCode])
}

model Berth {
  id          String   @id @default(uuid())
  terminalId  String
  terminal    Terminal @relation(fields: [terminalId], references: [id])

  berthCode   String
  berthName   String

  maxLOA      Float?   // meters
  maxBeam     Float?   // meters
  maxDraft    Float?   // meters

  currentVessel  String?  // vesselId if occupied

  createdAt   DateTime @default(now())

  @@unique([terminalId, berthCode])
}
```

#### C. GraphQL Schema
```typescript
type GateInEvent {
  id: ID!
  vessel: Vessel!
  port: Port!

  gateInTime: DateTime!
  gateOutTime: DateTime

  cargoType: CargoType!
  operationType: OperationType!

  # Bulk-specific
  bulkDetails: BulkCargoDetails

  # Tank-specific
  tankDetails: TankCargoDetails

  agent: PortAgent!
  terminal: Terminal
  berth: Berth

  documents: JSON!
  status: GateStatus!
}

type BulkCargoDetails {
  commodity: String!
  quantityMT: Float!
  holds: [String!]!
  draftSurveyDone: Boolean!
  surveyor: String
}

type TankCargoDetails {
  product: String!
  quantityBBL: Float
  quantityMT: Float
  tanks: [String!]!
  temperature: Float
  apiGravity: Float
  sulphurContent: Float
}

enum CargoType {
  BULK_DRY
  BULK_LIQUID
  CONTAINER
  RORO
  GENERAL
}

enum OperationType {
  LOADING
  DISCHARGE
}

enum GateStatus {
  ARRIVED
  BERTHED
  OPERATIONS_STARTED
  OPERATIONS_COMPLETED
  DEPARTED
}

# Mutations
type Mutation {
  createGateInEvent(input: GateInInput!): GateInEvent!
  updateGateStatus(eventId: ID!, status: GateStatus!): GateInEvent!
  recordGateOut(eventId: ID!, gateOutTime: DateTime!): GateInEvent!
}

# Queries
type Query {
  gateInEvents(portUnlocode: String, dateFrom: DateTime, dateTo: DateTime): [GateInEvent!]!
  activeVesselsInPort(portUnlocode: String!): [GateInEvent!]!
  terminalUtilization(terminalId: ID!): TerminalUtilization!
}
```

---

### Phase 2: Bulk Cargo Operations (3-6 months)

#### Features:
1. **Loading/Discharge Planning**
   - Stowage plans (which holds for which cargo)
   - Loading sequences
   - Ballast calculations
   - Stability monitoring

2. **Draft Survey Integration**
   - Pre-loading drafts
   - Post-loading drafts
   - Displacement calculations
   - Cargo quantity verification

3. **Commodity Tracking**
   - Iron ore, coal, grain, fertilizer, etc.
   - Quality specifications (moisture, impurities)
   - Certificate of Quality (CoQ) uploads
   - Sampling results

4. **Shipper/Receiver Management**
   - Shipper details
   - Consignee details
   - Notify parties
   - Letter of Credit tracking

#### UI Components:
- **Gate-In Dashboard**: Real-time vessel arrivals per port
- **Bulk Operations Board**: Kanban-style (Arrived → Berthed → Loading → Completed)
- **Draft Survey Calculator**: Automated displacement calculations
- **Hold Plan Visualizer**: Visual stowage planning

---

### Phase 3: Tank/Liquid Cargo Operations (6-12 months)

#### Features:
1. **Tank Management**
   - Tank configurations per vessel
   - Segregation requirements
   - Heating requirements
   - Inerting/gas-freeing tracking

2. **Product Specifications**
   - Crude oil grades
   - CPP (Clean Petroleum Products): Gasoline, Diesel, Jet Fuel
   - LNG/LPG
   - Chemicals
   - Vegetable oils

3. **Quality Control**
   - API gravity
   - Sulphur content
   - Water content
   - Temperature monitoring
   - Certificate of Quality

4. **Custody Transfer**
   - Shore tank readings
   - Ship tank readings
   - VEF (Vacuum Equivalent Factor)
   - Bill of Lading quantities
   - Outturn reports

5. **Safety & Compliance**
   - ISGOTT guidelines
   - Tank cleaning certificates
   - Gas-free certificates
   - Bunker Delivery Notes (BDN)

---

## 🎯 Integration with Existing Mari8X Features

### Synergies:

| Existing Feature | Port Operations Enhancement |
|------------------|----------------------------|
| **AIS Tracking** | Auto-trigger gate-in when vessel enters port zone |
| **Port Congestion** | Show berth availability in real-time |
| **Port Agent Portal** | Add gate-in/gate-out reporting module |
| **Document Vault** | Store B/L, cargo manifests, CoQ |
| **Laytime Calculator** | Start laytime clock on gate-in (NOR tendered) |
| **DA Desk** | Link demurrage to actual berthing delays |
| **Voyage Estimates** | Update actuals from gate-in data |
| **Claims Module** | Link cargo claims to gate-in documentation |
| **Compliance** | Auto-check ISPS, customs clearance |

---

## 📊 Sample Workflows

### Bulk Dry Cargo (Iron Ore):
```
1. Vessel ETA detected (AIS) → Port agent notified
2. Agent creates Gate-In event → Select cargo type: BULK_DRY
3. Enter commodity: Iron Ore, Quantity: 75,000 MT
4. Assign terminal/berth
5. Upload B/L, cargo manifest
6. Vessel arrives → Status: ARRIVED
7. Berth available → Status: BERTHED
8. Pre-discharge draft survey → Record drafts (fwd/mid/aft)
9. Discharge starts → Status: OPERATIONS_STARTED
10. Monitor discharge rate (MT/hour)
11. Post-discharge draft survey → Calculate outturn
12. Compare B/L vs outturn → Flag shortages/overages
13. Operations complete → Status: OPERATIONS_COMPLETED
14. Vessel departs → Gate-Out recorded
15. Generate Statement of Facts (SOF)
16. Calculate laytime/demurrage
```

### Tank Cargo (Crude Oil):
```
1. Vessel ETA detected → Port agent notified
2. Create Gate-In: BULK_LIQUID → Crude Oil
3. Enter quantity: 1,000,000 BBL
4. Assign tanks: 1C, 2C, 3C, 4C, 5C, 6C
5. Upload B/L with quality specs (API 32.5°, Sulphur 1.2%)
6. Vessel arrives → Pre-loading inspection
7. Tank soundings taken (shore tanks)
8. Loading starts → Monitor flow rates
9. Temperature monitoring (crude typically 60-80°F)
10. Final shore tank soundings
11. Calculate VEF (Volume Equivalent Factor)
12. B/L quantity issued
13. Vessel departs
14. Discharge port receives quantity data
15. Outturn comparison
```

---

## 🚀 Implementation Roadmap

### Sprint 1-2 (Weeks 1-4): Foundation
- [ ] Add Gate-In database schema (Prisma migration)
- [ ] Create GraphQL resolvers
- [ ] Build basic Gate-In form (frontend)
- [ ] Test with dry bulk cargo

### Sprint 3-4 (Weeks 5-8): Bulk Operations
- [ ] Draft survey calculator
- [ ] Hold plan visualizer
- [ ] Gate-In dashboard (port-level view)
- [ ] Integration with Port Agent Portal

### Sprint 5-6 (Weeks 9-12): Tank Operations
- [ ] Tank management UI
- [ ] Product specifications database
- [ ] Custody transfer calculations
- [ ] Quality control tracking

### Sprint 7-8 (Weeks 13-16): Advanced Features
- [ ] Auto gate-in triggers (AIS-based)
- [ ] Berth scheduling optimization
- [ ] Real-time terminal utilization
- [ ] Mobile app for surveyors (draft readings)

---

## 💰 Business Model

### Revenue Opportunities:

1. **Per-Gate-In Transaction**: $5-10 per vessel movement
2. **Terminal Subscription**: $500-1500/month per terminal
3. **Port Authority Package**: $5K-15K/month for full port coverage
4. **Surveyor Mobile App**: $50/month per user
5. **API Access**: $1000+/month for cargo owners/charterers

### Market Size:
- **Major ports**: 50-100 vessel movements/day
- **Mid-size ports**: 10-30 movements/day
- **Small ports**: 1-5 movements/day

**Example: Port of Singapore**
- 130,000 vessel calls/year
- At $5/gate-in = $650K/year from ONE port
- 50 major ports globally = $32M+ addressable market

---

## 🎯 Next Steps

### Immediate Actions:
1. **User Research**: Interview 3-5 port agents about gate-in workflows
2. **Data Collection**: Gather sample B/Ls, draft surveys, stowage plans
3. **Technical Spike**: Prototype gate-in form with bulk cargo fields
4. **Partner Outreach**: Approach 1-2 terminals for pilot program

### Questions to Validate:
- Do port agents want this in Mari8X or separate system?
- What's the priority: bulk dry vs tank cargo?
- Which ports to target first (India? Singapore? Rotterdam?)
- Integration with existing port community systems (PCS)?

---

## 🔧 Technical Considerations

### OSS Stack (Maintaining Free/Frugal):
- **Maps**: ✅ Already OSS (Leaflet + OSM + OpenSeaMap)
- **Database**: ✅ PostgreSQL + TimescaleDB (OSS)
- **Backend**: ✅ Node.js + GraphQL (OSS)
- **Frontend**: ✅ React + Vite (OSS)
- **Mobile**: Consider **React Native** or **Flutter** (both OSS)

### Additional OSS Libraries Needed:
- **PDF Generation**: `pdfkit` or `puppeteer` (for SOF, gate-in reports)
- **Barcode/QR**: `qrcode` (for gate passes)
- **Geofencing**: `turf.js` (auto-detect port entry/exit)
- **Tank Calculations**: Custom (or find maritime-specific OSS)

---

## 🌊 Competitive Advantage

**Why Mari8X Port Ops Will Win:**
1. **Already tracking vessels globally** (52M+ positions) → context-rich gate-in
2. **Port congestion data** → berth availability prediction
3. **Port agent network** → built-in user base
4. **Open-source commitment** → lower costs = competitive pricing
5. **Maritime-native** → not a generic logistics system adapted to shipping

**Competitors:**
- Portbase (Netherlands) - €€€ enterprise pricing
- Navis N4 (Cargotec) - $$$ container-focused
- PortXchange - $$ berthing optimization
- **Mari8X advantage**: Full-stack maritime platform, frugal OSS approach

---

## 📝 Summary

**Current State:**
- ✅ 100% OSS mapping stack (Leaflet + OSM + OpenSeaMap)
- ✅ Port intelligence & congestion monitoring
- ✅ Port agent portal foundation

**Proposed Addition:**
- 🚢 Gate-In/Gate-Out system for bulk & tank cargo
- 📦 Terminal & berth management
- 📊 Draft surveys & custody transfer
- 📱 Mobile app for surveyors

**Strategic Fit:**
- Natural extension of existing vessel tracking
- High revenue potential ($5-10 per gate-in)
- Massive addressable market (global ports)
- OSS approach = competitive moat

**Recommendation:**
✅ **Proceed with Phase 1 (Gate-In Foundation)**
- Low technical risk (database + forms)
- High user value (port agents already in system)
- Fast time-to-market (4-6 weeks)
- Validates market demand before heavy investment
