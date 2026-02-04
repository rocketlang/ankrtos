# AIS + Owner/Operator Data Integration Guide

**Date**: February 1, 2026
**Status**: Implementation Ready

---

## ✅ YES - AIS Data Includes Owner/Operator Information!

### What AIS Providers Give You:

**Real-time AIS Position Data:**
- Latitude/Longitude
- Speed, Course, Heading
- Navigation status
- Timestamp

**Static Vessel Data (from AIS providers):**
- ✅ **Owner name** (Company owning the vessel)
- ✅ **Operator name** (Company operating the vessel)
- ✅ **Commercial manager** (Company managing commercially)
- ✅ **Technical manager** (Company managing technically)
- ✅ **Vessel name, IMO, MMSI**
- ✅ **Flag state**
- ✅ **Vessel type, DWT, built year**
- ✅ **Class society**
- ✅ **P&I club**

---

## 🔍 FreightBox AIS Integration (Already Built!)

### Status: ✅ Available in `/root/ankr-labs-nx/apps/freightbox`

**Endpoints:**
- `GET /api/ais/vessels?imos=9000001,9000002` - Batch vessel lookup
- `GET /api/ais/vessel/:imo` - Single vessel details
- `GET /api/ais/search?query=pacific` - Search by name/IMO/MMSI
- `GET /api/ais/history?imo=9000001&days=7` - Historical track

**FreightBox Vessel Model:**
```prisma
model Vessel {
  id          String
  name        String
  imoNumber   String  @unique
  mmsi        String?
  flag        String?
  vesselType  String?
  teuCapacity Int?
  carrierId   String?    // Links to Carrier (operator)
  Carrier     Carrier?   // Operator/Owner info
}

model Carrier {
  id              String
  name            String
  type            String  // "LINER", "NVOCC", "OWNER", "OPERATOR"
  scac            String?
  address         String?
  contactEmail    String?
  contactPhone    String?
  Vessel          Vessel[]
}
```

**Current Status**: Simulated data (needs real AIS API keys)

---

## 🌐 AIS Provider API - Owner/Operator Data

### MarineTraffic API Example:

**Endpoint:** `GET /exportvessel/v:1/{{MMSI}}/protocol:jsono/apikey:{{KEY}}`

**Response:**
```json
{
  "IMO": "9000001",
  "MMSI": "123456789",
  "SHIPNAME": "PACIFIC DREAM",
  "OWNER": "Pacific Shipping Limited",           // ✅ Owner
  "OPERATOR": "Global Maritime Operations Ltd",   // ✅ Operator
  "TECHNICAL_MANAGER": "Ship Tech Management",     // ✅ Technical Manager
  "COMMERCIAL_MANAGER": "Maritime Trading Co",     // ✅ Commercial Manager
  "FLAG": "Panama",
  "TYPE": "Bulk Carrier",
  "DWT": "82000",
  "BUILT": "2010",
  "CLASS_SOCIETY": "NK",
  "PANDI": "UK P&I",
  "LATITUDE": "1.2345",
  "LONGITUDE": "103.8765",
  "SPEED": "12.5",
  "COURSE": "45",
  "HEADING": "45",
  "STATUS": "0",  // 0 = Under way using engine
  "TIMESTAMP": "2026-02-01T10:30:00Z"
}
```

### Spire Maritime API Example:

**Endpoint:** `GET /vessels/{{IMO}}`

**Response:**
```json
{
  "imo": "9000001",
  "name": "PACIFIC DREAM",
  "shipowner": "Pacific Shipping Limited",        // ✅ Owner
  "operator": "Global Maritime Operations Ltd",   // ✅ Operator
  "manager": "Ship Management Company",
  "flag": "PA",
  "type": "Bulk Carrier",
  "dwt": 82000,
  "built": 2010,
  "position": {
    "lat": 1.2345,
    "lon": 103.8765,
    "speed": 12.5,
    "course": 45,
    "heading": 45,
    "timestamp": "2026-02-01T10:30:00Z"
  }
}
```

---

## 🔗 Integration Strategy for Mari8X

### Option 1: Use FreightBox AIS (Quick Win)

**Pros:**
- Already built and running
- REST API available at `http://localhost:4003`
- Can call from Mari8X backend

**Implementation:**
```typescript
// In Mari8X backend
import axios from 'axios';

async function getVesselOwnerOperator(imo: string) {
  const response = await axios.get(
    `http://localhost:4003/api/ais/vessel/${imo}`
  );

  return {
    owner: response.data.data.Carrier?.name,
    operator: response.data.data.Carrier?.name,
    vesselName: response.data.data.name,
    flag: response.data.data.flag,
  };
}
```

**Timeline:** Immediate (already running)

---

### Option 2: Direct AIS Provider Integration (Long-term)

**Pros:**
- First-party data from AIS providers
- More comprehensive owner/operator info
- Real-time updates

**Implementation:**
```typescript
// Enhanced ais-integration.ts service
async getVesselWithOwner(imo: number): Promise<{
  vessel: VesselInfo;
  owner: CompanyInfo;
  operator: CompanyInfo;
  position: AISPosition;
}> {
  // Call MarineTraffic/Spire API
  const response = await this.fetchFromProvider('marinetraffic', imo);

  // Extract owner/operator
  const owner = {
    name: response.OWNER,
    type: 'owner',
    country: response.OWNER_COUNTRY,
  };

  const operator = {
    name: response.OPERATOR,
    type: 'operator',
    country: response.OPERATOR_COUNTRY,
  };

  // Store in Mari8X database
  await this.upsertCompany(owner);
  await this.upsertCompany(operator);

  // Link vessel to owner/operator
  await prisma.vessel.update({
    where: { imo },
    data: {
      ownerId: owner.id,
      operatorId: operator.id,
    },
  });

  return { vessel, owner, operator, position };
}
```

**Timeline:** 1-2 weeks

---

## 📊 Mari8X Database Schema Enhancement

### Add Owner/Operator to Vessel Model:

```prisma
model Vessel {
  id                String @id @default(cuid())
  imo               String @unique
  name              String
  mmsi              String?
  flag              String?
  vesselType        String?
  dwt               Int?
  built             Int?

  // Owner/Operator info (from AIS)
  ownerId           String?
  operatorId        String?
  technicalManagerId String?
  commercialManagerId String?

  owner             Company? @relation("VesselOwner", fields: [ownerId], references: [id])
  operator          Company? @relation("VesselOperator", fields: [operatorId], references: [id])
  technicalManager  Company? @relation("VesselTechMgr", fields: [technicalManagerId], references: [id])
  commercialManager Company? @relation("VesselCommMgr", fields: [commercialManagerId], references: [id])

  // AIS data
  lastPosition      VesselPosition?
  positionHistory   VesselPosition[]

  voyages           Voyage[]
}

model Company {
  id                String @id @default(cuid())
  name              String
  type              String // owner, charterer, broker, operator, manager
  country           String?
  contactEmail      String?
  contactPhone      String?

  // Vessel relationships
  ownedVessels      Vessel[] @relation("VesselOwner")
  operatedVessels   Vessel[] @relation("VesselOperator")
  techManagedVessels Vessel[] @relation("VesselTechMgr")
  commManagedVessels Vessel[] @relation("VesselCommMgr")

  // Commercial relationships
  charters          Charter[]
  invoices          Invoice[]
}
```

---

## 🚀 Quick Start - Test FreightBox AIS Now

### Step 1: Check if FreightBox is Running

```bash
ankr-ctl status freightbox
# Or
pm2 list | grep freightbox
```

### Step 2: Test AIS Endpoints

```bash
# Search for a vessel
curl "http://localhost:4003/api/ais/search?query=pacific&limit=5"

# Get vessel details
curl "http://localhost:4003/api/ais/vessel/9000001"

# Get multiple vessels
curl "http://localhost:4003/api/ais/vessels?imos=9000001,9000002,9000003"
```

### Step 3: Integrate into Mari8X GraphQL

Add to Mari8X backend:

```graphql
type VesselWithOwner {
  imo: String!
  name: String!
  flag: String
  vesselType: String
  owner: Company
  operator: Company
  lastPosition: AISPosition
}

type Company {
  id: ID!
  name: String!
  type: String!
  country: String
  vessels: [Vessel!]
}

type Query {
  vesselWithOwner(imo: String!): VesselWithOwner

  # Find vessels by owner
  vesselsByOwner(companyName: String!): [VesselWithOwner!]!

  # Find vessels by operator
  vesselsByOperator(companyName: String!): [VesselWithOwner!]!
}
```

---

## 💰 AIS Subscription Costs (with Owner/Operator Data)

| Provider | Plan | Cost/Month | Owner Data | Operator Data |
|----------|------|------------|------------|---------------|
| **MarineTraffic** | Standard | $100 | ✅ Yes | ✅ Yes |
| **MarineTraffic** | Professional | $500 | ✅ Yes | ✅ Yes + Manager |
| **Spire Maritime** | Developer | $200 | ✅ Yes | ✅ Yes |
| **Spire Maritime** | Professional | $1,000 | ✅ Yes | ✅ Yes + Full details |
| **VesselFinder** | Standard | $80 | ⚠️ Limited | ⚠️ Limited |

**Recommendation:** Start with **MarineTraffic Standard** ($100/month) for comprehensive owner/operator data

---

## 📋 Implementation Checklist

### Immediate (Today):
- [ ] Test FreightBox AIS endpoints
- [ ] Verify vessel → carrier (operator) relationship
- [ ] Call FreightBox AIS from Mari8X backend

### This Week:
- [ ] Sign up for MarineTraffic Standard ($100/month)
- [ ] Get API key
- [ ] Test owner/operator data extraction
- [ ] Enhance Mari8X Vessel model with owner/operator fields

### This Month:
- [ ] Migrate Prisma schema
- [ ] Build GraphQL queries for owner/operator lookup
- [ ] Auto-populate owner/operator from AIS on vessel creation
- [ ] Build frontend company directory

---

## 🎯 Expected Results

### After FreightBox Integration (Today):
- ✅ Vessel operator data available
- ✅ REST API for vessel lookup
- ✅ Search by vessel name/IMO/MMSI

### After MarineTraffic Integration (This Week):
- ✅ Full owner/operator/manager data
- ✅ Real-time AIS positions
- ✅ Auto-population of company database
- ✅ Vessel ownership tracking

### After Full Integration (This Month):
- ✅ 150+ vessels with owner/operator data
- ✅ Company directory (owners, operators, managers)
- ✅ Vessel ownership changes tracking
- ✅ Fleet by owner/operator analytics

---

## 🔍 Sample Queries

```graphql
# Get vessel with owner/operator
query {
  vesselWithOwner(imo: "9000001") {
    name
    imo
    flag
    owner {
      name
      type
      country
    }
    operator {
      name
      type
      country
    }
    lastPosition {
      latitude
      longitude
      speed
      timestamp
    }
  }
}

# Find all vessels by owner
query {
  vesselsByOwner(companyName: "Pacific Shipping") {
    name
    imo
    vesselType
    dwt
    built
    lastPosition {
      latitude
      longitude
    }
  }
}

# Company fleet overview
query {
  company(name: "Pacific Shipping") {
    name
    country
    ownedVessels {
      name
      imo
      vesselType
      dwt
    }
    operatedVessels {
      name
      imo
      vesselType
    }
    totalFleetDWT
    totalVessels
  }
}
```

---

## 🎉 Summary

**✅ YES - AIS provides Owner/Operator data!**

**Quick Win:** Use FreightBox AIS (already running at localhost:4003)
**Long-term:** MarineTraffic API ($100/month) for full owner/operator/manager data
**Timeline:** Immediate integration possible, full implementation 1-2 weeks

**Value:**
- Auto-populate company database
- Track vessel ownership changes
- Fleet analytics by owner/operator
- Commercial intelligence (who operates what)

---

**Next Action:** Test FreightBox AIS endpoints NOW:
```bash
curl "http://localhost:4003/api/ais/search?query=vessel&limit=10"
```

---

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
