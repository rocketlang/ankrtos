# Port Agency Portal - GraphQL API Quick Start
**Version**: 1.0.0 | **Date**: February 2, 2026

---

## 🚀 ACCESS THE API

**GraphQL Playground**: http://localhost:4051/graphql
**Backend Port**: 4051
**Database**: PostgreSQL via PgBouncer (port 6432)

---

## 📋 AVAILABLE TYPES

### 1. PortAgentAppointment
Agent appointment for a port call

```graphql
type PortAgentAppointment {
  id: ID!
  organizationId: String!
  vesselId: String!
  portCode: String!              # UNLOCODE (e.g., SGSIN, INMUN)
  eta: DateTime!                 # Estimated Time of Arrival
  etb: DateTime                  # Estimated Time of Berthing
  etd: DateTime                  # Estimated Time of Departure
  serviceType: String!           # husbandry, cargo, crew_change, bunker
  status: String!                # nominated, confirmed, services_requested, completed
  nominatedBy: String
  nominatedAt: DateTime
  createdAt: DateTime!
  updatedAt: DateTime!

  # Relations
  organization: Organization!
  vessel: Vessel!
  pdas: [ProformaDisbursementAccount!]!
  fdas: [FinalDisbursementAccount!]!
  serviceRequests: [PortServiceRequest!]!
}
```

### 2. ProformaDisbursementAccount (PDA)
Estimated costs for port call

```graphql
type ProformaDisbursementAccount {
  id: ID!
  appointmentId: String!
  reference: String!             # PDA-SGSIN-2026-001
  version: Int!
  status: String!                # draft, sent, approved, revised, cancelled

  # Port Details
  portCode: String!
  portName: String!
  arrivalDate: DateTime!
  departureDate: DateTime
  stayDuration: Float            # hours

  # Vessel Details
  vesselId: String!
  vesselName: String!
  imo: String!
  flag: String
  grt: Float

  # Financial
  baseCurrency: String!
  totalAmount: Float!
  totalAmountLocal: Float
  localCurrency: String
  fxRate: Float!

  # ML Prediction
  confidenceScore: Float         # 0.0-1.0
  predictionModel: String

  # Relations
  appointment: PortAgentAppointment!
  vessel: Vessel!
  lineItems: [ProformaDisbursementLineItem!]!
  fda: FinalDisbursementAccount
}
```

### 3. FinalDisbursementAccount (FDA)
Actual costs with variance analysis

```graphql
type FinalDisbursementAccount {
  id: ID!
  pdaId: String!
  appointmentId: String!
  reference: String!             # FDA-SGSIN-2026-001

  # Financial
  baseCurrency: String!
  totalAmount: Float!
  totalAmountLocal: Float

  # Variance Analysis
  pdaTotal: Float!
  variance: Float!               # FDA - PDA
  variancePercent: Float!        # (variance / PDA) * 100

  # Status
  status: String!                # draft, submitted, approved, settled
  submittedAt: DateTime
  approvedAt: DateTime
  settledAt: DateTime

  # Payment
  paymentMethod: String
  paymentReference: String

  # Relations
  pda: ProformaDisbursementAccount!
  appointment: PortAgentAppointment!
  lineItems: [FinalDisbursementLineItem!]!
  variances: [FdaVarianceAnalysis!]!
}
```

---

## 🔍 QUERIES

### 1. Get Port Agent Appointments

```graphql
query GetAppointments {
  portAgentAppointments(
    portCode: "SGSIN"
    status: "nominated"
    limit: 10
  ) {
    id
    vesselId
    portCode
    eta
    etb
    etd
    serviceType
    status
    vessel {
      name
      imo
      flag
    }
    pdas {
      id
      reference
      totalAmount
      status
    }
  }
}
```

**Arguments**:
- `portCode` (String): Filter by port UNLOCODE
- `vesselId` (String): Filter by vessel ID
- `status` (String): Filter by status
- `limit` (Int): Max results (default: 50)

---

### 2. Get Proforma Disbursement Accounts

```graphql
query GetPDAs {
  proformaDisbursementAccounts(
    appointmentId: "appt_123"
    status: "approved"
    limit: 10
  ) {
    id
    reference
    version
    status
    portCode
    portName
    arrivalDate
    departureDate
    vesselName
    imo
    baseCurrency
    totalAmount
    totalAmountLocal
    localCurrency
    fxRate
    confidenceScore
    lineItems {
      id
      category
      description
      quantity
      unit
      unitPrice
      amount
      currency
      isPredicted
      confidence
    }
  }
}
```

**Arguments**:
- `appointmentId` (String): Filter by appointment
- `portCode` (String): Filter by port
- `status` (String): Filter by status
- `limit` (Int): Max results (default: 50)

---

### 3. Get Final Disbursement Accounts

```graphql
query GetFDAs {
  finalDisbursementAccounts(
    appointmentId: "appt_123"
    status: "approved"
    limit: 10
  ) {
    id
    reference
    pdaId
    baseCurrency
    totalAmount
    pdaTotal
    variance
    variancePercent
    status
    submittedAt
    approvedAt
    lineItems {
      id
      category
      description
      amount
      pdaAmount
      variance
      invoiceNumber
      invoiceDate
    }
    variances {
      category
      pdaAmount
      fdaAmount
      variance
      variancePercent
      reason
      notes
    }
  }
}
```

**Arguments**:
- `appointmentId` (String): Filter by appointment
- `status` (String): Filter by status
- `limit` (Int): Max results (default: 50)

---

### 4. Get Service Requests

```graphql
query GetServiceRequests {
  portServiceRequests(
    appointmentId: "appt_123"
    status: "pending"
  ) {
    id
    serviceType
    description
    requestedAt
    requiredBy
    status
    quotes {
      id
      vendorId
      amount
      currency
      validUntil
      status
      vendor {
        name
        contactEmail
      }
    }
    selectedQuoteId
    actualCost
    rating
    review
  }
}
```

**Arguments**:
- `appointmentId` (String, required): Appointment ID
- `status` (String): Filter by status

---

## ✏️ MUTATIONS

### 1. Create Port Agent Appointment

```graphql
mutation CreateAppointment {
  createPortAgentAppointment(
    vesselId: "vessel_clxxx123"
    portCode: "SGSIN"
    eta: "2026-03-15T08:00:00Z"
    etb: "2026-03-15T10:00:00Z"
    etd: "2026-03-16T18:00:00Z"
    serviceType: "husbandry"
  ) {
    id
    reference
    status
    portCode
    eta
    vessel {
      name
      imo
    }
  }
}
```

**Arguments**:
- `vesselId` (String, required): Vessel ID
- `portCode` (String, required): Port UNLOCODE
- `eta` (DateTime, required): Estimated arrival
- `etb` (DateTime): Estimated berthing
- `etd` (DateTime): Estimated departure
- `serviceType` (String, required): Service type

**Service Types**:
- `husbandry`: General port services
- `cargo`: Cargo operations
- `crew_change`: Crew change services
- `bunker`: Bunkering operations

---

### 2. Update Appointment Status

```graphql
mutation UpdateAppointmentStatus {
  updatePortAgentAppointmentStatus(
    id: "appt_123"
    status: "confirmed"
  ) {
    id
    status
    updatedAt
  }
}
```

**Arguments**:
- `id` (String, required): Appointment ID
- `status` (String, required): New status

**Valid Statuses**:
- `nominated`: Initial state
- `confirmed`: Agent confirmed
- `services_requested`: Services booked
- `completed`: Port call finished

---

## 🧪 EXAMPLE WORKFLOWS

### Workflow 1: Create Appointment → Generate PDA

```graphql
# Step 1: Create appointment
mutation {
  createPortAgentAppointment(
    vesselId: "vessel_abc123"
    portCode: "INMUN"
    eta: "2026-03-20T06:00:00Z"
    serviceType: "husbandry"
  ) {
    id
    reference
  }
}

# Step 2: Query appointment with PDAs (auto-generated)
query {
  portAgentAppointments(limit: 1) {
    id
    pdas {
      id
      reference
      totalAmount
      lineItems {
        category
        description
        amount
        isPredicted
        confidence
      }
    }
  }
}
```

---

### Workflow 2: Complete Port Call → Create FDA

```graphql
# Step 1: Get PDA details
query {
  proformaDisbursementAccounts(appointmentId: "appt_123") {
    id
    reference
    totalAmount
    lineItems {
      category
      amount
    }
  }
}

# Step 2: Create FDA (to be implemented)
# mutation {
#   createFDAFromPDA(pdaId: "pda_123", actualCosts: [...]) {
#     id
#     reference
#     variance
#     variancePercent
#   }
# }
```

---

## 📊 SAMPLE DATA STRUCTURE

### PDA Line Item Categories
```
- port_dues
- pilotage
- towage
- mooring
- unmooring
- berth_hire
- agency_fee
- garbage_disposal
- freshwater
- documentation
- customs_clearance
```

### Charge Units
```
- per_grt: Per Gross Registered Tonnage
- per_nrt: Per Net Registered Tonnage
- per_hour: Per hour
- per_day: Per day
- lumpsum: Fixed amount
- per_movement: Per ship movement
```

### Supported Currencies
```
- USD: US Dollar
- EUR: Euro
- SGD: Singapore Dollar
- INR: Indian Rupee
- GBP: British Pound
- NOK: Norwegian Krone
- JPY: Japanese Yen
```

---

## 🔐 AUTHENTICATION

**Current**: Using organization-scoped filtering
**Future**: Token-based authentication required

```typescript
// Context structure (from ctx.user)
{
  id: string,
  email: string,
  organizationId: string,
  role: string
}
```

---

## ⚠️ IMPORTANT NOTES

1. **Organization Isolation**: All appointments are scoped to `organizationId`
2. **No Delete**: Use status updates instead of deleting records
3. **Versioning**: PDAs support versioning (create new version if changes needed)
4. **Multi-Currency**: FX rates cached for 24 hours
5. **ML Predictions**: Confidence score 0.8+ = auto-import, <0.8 = human review

---

## 🐛 TROUBLESHOOTING

### Backend Not Running
```bash
cd /root/apps/ankr-maritime/backend
npm run dev
```

### GraphQL Playground Not Loading
```bash
# Check if port 4051 is available
netstat -tlnp | grep 4051

# Or use ss
ss -tlnp | grep 4051
```

### No Data Returned
```bash
# Check database
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.portAgentAppointment.count().then(c => console.log('Count:', c));
"
```

---

## 📚 RESOURCES

- **Implementation Plan**: `PHASE-34-PORT-AGENCY-MVP.md`
- **Status Report**: `PRIORITY1-PORT-AGENCY-KICKOFF-COMPLETE.md`
- **Database Schema**: `prisma/schema.prisma` (line 4820+)
- **GraphQL Types**: `src/schema/types/port-agency-portal.ts`

---

## 🎯 NEXT FEATURES (Coming Soon)

### Week 1:
- [ ] Auto-generate PDA mutation
- [ ] Submit PDA for approval mutation
- [ ] Create FDA from PDA mutation
- [ ] Service request mutations
- [ ] Vendor quote mutations

### Week 2:
- [ ] Multi-currency FX rate caching
- [ ] ML cost prediction service
- [ ] Tariff auto-fetching (800+ ports)
- [ ] Email notifications

---

**Status**: ✅ API Ready for Testing
**Next**: Create seed data for 10 sample appointments

**Last Updated**: February 2, 2026
