# Phase 34: Port Agency Portal - MVP Implementation Plan
## Priority 1: Highest ROI Strategic Feature
**Created**: February 2, 2026 11:05 UTC

---

## 🎯 EXECUTIVE SUMMARY

**Market**: 5,000+ port agents globally
**Revenue**: $50/port call or $499/month subscription
**Time to Market**: 3-4 months (12-16 weeks)
**Target**: $25K MRR by month 6, $500K ARR by year 1

**Value Proposition**: Reduce PDA generation from 2-4 hours to 5 minutes (95% automation)

---

## 📋 PROBLEM STATEMENT

### Current Pain Points

**Port Agents Face**:
1. **Manual PDA Creation**: 2-4 hours per port call
2. **Tariff Data Entry**: Copy-paste from 800+ port authority websites
3. **Service Quotes**: Email/phone calls to pilots, tugs, mooring companies
4. **Calculation Errors**: Manual arithmetic mistakes (3-5% error rate)
5. **Invoice Processing**: Manual invoice entry, matching, variance analysis
6. **Multi-Currency**: Complex FX calculations across USD/EUR/INR/SGD/GBP/NOK/JPY

**Ship Owners/Operators Face**:
1. **PDA Delays**: Wait 1-2 days for PDA estimates
2. **Inaccurate Estimates**: 10-15% variance between PDA and FDA
3. **No Visibility**: Can't track service requests or actual costs real-time
4. **Settlement Delays**: FDA processing takes 1-2 weeks

---

## 🚀 SOLUTION OVERVIEW

### Core Modules (MVP)

**1. PDA Auto-Generation** (95% automation)
- Auto-fetch tariffs from 800+ ports
- Request quotes from vendors (pilot/tug/mooring)
- ML-powered cost prediction
- Generate PDA PDF in 5 minutes
- Email to owner for approval

**2. FDA Workflow**
- Invoice OCR (capture actual costs)
- PDA vs FDA variance analysis
- Auto-generate FDA with attachments
- Settlement tracking

**3. Service Request Management**
- Digital service booking
- Vendor quote comparison
- Real-time status tracking
- Rating & review system

**4. Multi-Currency Engine**
- Support 7 currencies: USD, EUR, INR, SGD, GBP, NOK, JPY
- Live FX rates (24h cache)
- Auto-conversion for reporting

---

## 🏗️ ARCHITECTURE

### Database Schema (9 New Tables)

```prisma
// 1. Agent Appointments
model AgentAppointment {
  id              String   @id @default(cuid())
  organizationId  String
  vesselId        String
  portCode        String   // UNLOCODE (e.g., SGSIN, INMUN)
  eta             DateTime
  etb             DateTime?
  etd             DateTime?
  serviceType     String   // husbandry, cargo, crew_change, bunker
  status          String   // nominated, confirmed, services_requested, completed
  nominatedBy     String?  // Owner/operator company
  nominatedAt     DateTime?

  vessel          Vessel   @relation(fields: [vesselId], references: [id])
  organization    Organization @relation(fields: [organizationId], references: [id])
  pdas            PDA[]
  fdas            FDA[]
  serviceRequests ServiceRequest[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([portCode, eta])
  @@index([vesselId, status])
}

// 2. PDA (Proforma Disbursement Account)
model PDA {
  id                String   @id @default(cuid())
  appointmentId     String
  reference         String   @unique  // PDA-SGSIN-2026-001
  version           Int      @default(1)
  status            String   // draft, sent, approved, revised, cancelled

  // Port Details
  portCode          String
  portName          String
  arrivalDate       DateTime
  departureDate     DateTime?
  stayDuration      Float?   // hours

  // Vessel Details
  vesselId          String
  vesselName        String
  imo               String
  flag              String
  grt               Float?
  nrt               Float?
  loa               Float?
  beam              Float?
  draft             Float?

  // Financial
  baseCurrency      String   @default("USD")
  totalAmount       Float    // in base currency
  totalAmountLocal  Float?   // in port local currency
  localCurrency     String?
  fxRate            Float?   @default(1.0)

  // Line Items
  lineItems         PDALineItem[]

  // Metadata
  generatedBy       String?  // user_id or "AUTO"
  generatedAt       DateTime @default(now())
  sentAt            DateTime?
  approvedAt        DateTime?
  approvedBy        String?

  // ML Prediction
  confidenceScore   Float?   // 0.0-1.0
  predictionModel   String?  // model version

  // Relations
  appointment       AgentAppointment @relation(fields: [appointmentId], references: [id])
  vessel            Vessel   @relation(fields: [vesselId], references: [id])
  fda               FDA?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([portCode, arrivalDate])
  @@index([vesselId, status])
  @@index([reference])
}

// 3. PDA Line Items
model PDALineItem {
  id              String   @id @default(cuid())
  pdaId           String

  category        String   // port_dues, pilotage, towage, mooring, agency_fee, etc.
  description     String
  quantity        Float?   // e.g., GRT, hours, units
  unit            String?  // per_grt, per_hour, lumpsum
  unitPrice       Float?
  amount          Float
  currency        String   @default("USD")

  // Tariff Reference
  tariffId        String?  // Link to PortTariff if auto-fetched
  tariffSource    String?  // "port_authority", "vendor_quote", "historical", "ml_prediction"

  // Vendor Quote
  vendorId        String?
  vendorQuoteId   String?
  quoteValidUntil DateTime?

  // Prediction
  isPredicted     Boolean  @default(false)
  confidence      Float?   // 0.0-1.0

  pda             PDA      @relation(fields: [pdaId], references: [id], onDelete: Cascade)
  tariff          PortTariff? @relation(fields: [tariffId], references: [id])
  vendor          Company?    @relation(fields: [vendorId], references: [id])

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([pdaId, category])
}

// 4. FDA (Final Disbursement Account)
model FDA {
  id                String   @id @default(cuid())
  pdaId             String   @unique
  appointmentId     String
  reference         String   @unique  // FDA-SGSIN-2026-001

  // Financial
  baseCurrency      String   @default("USD")
  totalAmount       Float
  totalAmountLocal  Float?
  localCurrency     String?
  fxRate            Float?   @default(1.0)

  // Variance Analysis
  pdaTotal          Float    // Original PDA estimate
  variance          Float    // FDA - PDA
  variancePercent   Float    // (variance / PDA) * 100

  // Line Items
  lineItems         FDALineItem[]
  variances         FDAVariance[]

  // Status
  status            String   // draft, submitted, approved, settled
  submittedAt       DateTime?
  approvedAt        DateTime?
  settledAt         DateTime?

  // Payment
  paymentMethod     String?  // wire_transfer, check, account_credit
  paymentReference  String?

  // Relations
  pda               PDA      @relation(fields: [pdaId], references: [id])
  appointment       AgentAppointment @relation(fields: [appointmentId], references: [id])
  invoices          Invoice[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([appointmentId])
  @@index([reference])
}

// 5. FDA Line Items
model FDALineItem {
  id              String   @id @default(cuid())
  fdaId           String

  category        String
  description     String
  quantity        Float?
  unit            String?
  unitPrice       Float?
  amount          Float
  currency        String   @default("USD")

  // Actual Invoice Reference
  invoiceId       String?
  invoiceNumber   String?
  invoiceDate     DateTime?
  vendorId        String?

  // Variance from PDA
  pdaLineItemId   String?
  pdaAmount       Float?
  variance        Float?   // Actual - Estimated

  fda             FDA      @relation(fields: [fdaId], references: [id], onDelete: Cascade)
  invoice         Invoice? @relation(fields: [invoiceId], references: [id])

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([fdaId, category])
}

// 6. FDA Variance Analysis
model FDAVariance {
  id              String   @id @default(cuid())
  fdaId           String

  category        String
  pdaAmount       Float
  fdaAmount       Float
  variance        Float    // FDA - PDA
  variancePercent Float    // (variance / PDA) * 100
  reason          String?  // "rate_change", "additional_services", "currency_fluctuation", etc.
  notes           String?

  fda             FDA      @relation(fields: [fdaId], references: [id], onDelete: Cascade)

  createdAt       DateTime @default(now())

  @@index([fdaId])
}

// 7. Service Requests
model ServiceRequest {
  id              String   @id @default(cuid())
  appointmentId   String

  serviceType     String   // pilotage, towage, mooring, garbage, freshwater, provisions
  description     String
  requestedAt     DateTime @default(now())
  requiredBy      DateTime?

  // Status
  status          String   // pending, quoted, confirmed, completed, cancelled

  // Quotes
  quotes          VendorQuote[]
  selectedQuoteId String?

  // Completion
  completedAt     DateTime?
  actualCost      Float?
  currency        String?
  rating          Int?     // 1-5 stars
  review          String?

  // Relations
  appointment     AgentAppointment @relation(fields: [appointmentId], references: [id])

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([appointmentId, status])
}

// 8. Vendor Quotes
model VendorQuote {
  id                String   @id @default(cuid())
  serviceRequestId  String
  vendorId          String

  amount            Float
  currency          String   @default("USD")
  validUntil        DateTime
  description       String?
  terms             String?  // Payment terms, conditions

  // Status
  status            String   // pending, accepted, rejected, expired
  respondedAt       DateTime @default(now())

  // Relations
  serviceRequest    ServiceRequest @relation(fields: [serviceRequestId], references: [id])
  vendor            Company        @relation(fields: [vendorId], references: [id])

  createdAt         DateTime @default(now())

  @@index([serviceRequestId, status])
}

// 9. Port Services (Master Data)
model PortService {
  id          String   @id @default(cuid())
  portCode    String   // UNLOCODE
  serviceType String   // pilotage, towage, mooring, etc.
  vendorId    String

  isActive    Boolean  @default(true)
  priority    Int      @default(1)  // 1 = preferred vendor

  // Contact
  contactName  String?
  contactEmail String?
  contactPhone String?

  // Pricing (optional, for reference)
  baseRate     Float?
  currency     String?
  unit         String?
  notes        String?

  vendor       Company  @relation(fields: [vendorId], references: [id])

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([portCode, serviceType, vendorId])
  @@index([portCode, serviceType, isActive])
}
```

---

## 🔧 BACKEND SERVICES

### 1. PDA Auto-Generation Service

**File**: `/backend/src/services/pda-auto-generation.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { TariffService } from './tariff-service';
import { VendorQuoteService } from './vendor-quote-service';
import { MLPredictionService } from './ml-prediction-service';
import { CurrencyService } from './currency-service';

export class PDAAutoGenerationService {
  constructor(
    private prisma: PrismaClient,
    private tariffService: TariffService,
    private vendorQuoteService: VendorQuoteService,
    private mlService: MLPredictionService,
    private currencyService: CurrencyService
  ) {}

  async generatePDA(appointmentId: string): Promise<PDA> {
    // 1. Get appointment details
    const appointment = await this.prisma.agentAppointment.findUnique({
      where: { id: appointmentId },
      include: { vessel: true },
    });

    // 2. Fetch port tariffs
    const tariffs = await this.tariffService.fetchPortTariffs(appointment.portCode);

    // 3. Request vendor quotes
    const quotes = await this.vendorQuoteService.requestQuotes(appointmentId);

    // 4. ML prediction for missing items
    const predictions = await this.mlService.predictCosts(appointment, tariffs);

    // 5. Build PDA line items
    const lineItems = this.buildLineItems(tariffs, quotes, predictions);

    // 6. Calculate totals with FX
    const totals = await this.calculateTotals(lineItems, appointment.portCode);

    // 7. Create PDA
    const pda = await this.prisma.pDA.create({
      data: {
        appointmentId,
        reference: this.generateReference(appointment),
        portCode: appointment.portCode,
        vesselId: appointment.vesselId,
        // ... other fields
        totalAmount: totals.usd,
        totalAmountLocal: totals.local,
        lineItems: { create: lineItems },
        confidenceScore: this.calculateConfidence(lineItems),
      },
    });

    // 8. Generate PDF and email
    await this.sendPDAEmail(pda);

    return pda;
  }

  private buildLineItems(tariffs, quotes, predictions): PDALineItemInput[] {
    const items: PDALineItemInput[] = [];

    // Port dues (from tariff)
    const portDues = tariffs.find(t => t.chargeType === 'port_dues');
    if (portDues) {
      items.push({
        category: 'port_dues',
        description: 'Port Dues',
        amount: portDues.amount,
        tariffId: portDues.id,
        tariffSource: 'port_authority',
        isPredicted: false,
        confidence: 1.0,
      });
    }

    // Pilotage (from vendor quote or prediction)
    const pilotQuote = quotes.find(q => q.serviceType === 'pilotage');
    if (pilotQuote) {
      items.push({
        category: 'pilotage',
        description: 'Pilotage Services',
        amount: pilotQuote.amount,
        vendorQuoteId: pilotQuote.id,
        tariffSource: 'vendor_quote',
        isPredicted: false,
        confidence: 0.95,
      });
    } else {
      const prediction = predictions.pilotage;
      items.push({
        category: 'pilotage',
        description: 'Pilotage Services (Estimated)',
        amount: prediction.amount,
        tariffSource: 'ml_prediction',
        isPredicted: true,
        confidence: prediction.confidence,
      });
    }

    // Agency fee (lumpsum)
    items.push({
      category: 'agency_fee',
      description: 'Agency Fee',
      amount: 500,  // Standard fee
      unit: 'lumpsum',
      tariffSource: 'standard_rate',
      isPredicted: false,
      confidence: 1.0,
    });

    return items;
  }

  private async calculateTotals(lineItems, portCode) {
    const localCurrency = await this.currencyService.getPortCurrency(portCode);
    const usdTotal = lineItems.reduce((sum, item) => sum + item.amount, 0);

    const fxRate = await this.currencyService.getExchangeRate('USD', localCurrency);
    const localTotal = usdTotal * fxRate;

    return { usd: usdTotal, local: localTotal, currency: localCurrency, fxRate };
  }

  private calculateConfidence(lineItems): number {
    const avgConfidence = lineItems.reduce((sum, item) => sum + item.confidence, 0) / lineItems.length;
    return avgConfidence;
  }

  private generateReference(appointment): string {
    const date = new Date();
    const year = date.getFullYear();
    const seq = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return `PDA-${appointment.portCode}-${year}-${seq}`;
  }

  private async sendPDAEmail(pda: PDA) {
    // TODO: Generate PDF and email to owner
  }
}
```

---

## 🎨 FRONTEND COMPONENTS

### Port Agency Dashboard

**File**: `/frontend/src/pages/PortAgencyDashboard.tsx`

**Features**:
- List of appointments (upcoming, in-progress, completed)
- PDA generation button
- FDA creation button
- Service request management
- Variance analysis charts

---

## 📅 IMPLEMENTATION TIMELINE (12 Weeks)

### Week 1-2: Database & Core Schema
- [x] Design Prisma schema (9 tables)
- [ ] Create migration files
- [ ] Seed test data (10 appointments, 5 PDAs)
- [ ] Test relationships and indexes

### Week 3-4: PDA Auto-Generation
- [ ] Build TariffService (fetch from existing port_tariffs)
- [ ] Build VendorQuoteService (email/API integration)
- [ ] Build MLPredictionService (simple regression model)
- [ ] Build PDAAutoGenerationService
- [ ] Unit tests (80% coverage)

### Week 5: Multi-Currency Engine
- [ ] Build CurrencyService (live FX rates)
- [ ] Integrate exchangerate-api.com
- [ ] Redis caching (24h TTL)
- [ ] Currency conversion logic
- [ ] Test with 7 currencies

### Week 6-7: FDA Workflow
- [ ] Invoice OCR service (Tesseract.js)
- [ ] FDA line item matching
- [ ] Variance analysis calculator
- [ ] FDA PDF generation
- [ ] Settlement tracking

### Week 8-9: GraphQL API
- [ ] Mutations: createPDA, generatePDA, createFDA, requestService
- [ ] Queries: pdas, fdas, appointments, serviceRequests, variances
- [ ] Subscriptions: pdaStatusChanged, serviceCompleted
- [ ] Authorization (role-based: agent, owner, vendor)

### Week 10-11: Frontend UI
- [ ] Port Agency Dashboard
- [ ] Appointment List/Detail
- [ ] PDA Generation Wizard
- [ ] FDA Entry Form
- [ ] Service Request Manager
- [ ] Variance Report

### Week 12: Beta Testing
- [ ] Onboard 10 beta agents
- [ ] Gather feedback
- [ ] Bug fixes
- [ ] Performance optimization

---

## 🧪 TESTING STRATEGY

### Unit Tests
- PDA line item calculations
- Currency conversions
- ML prediction accuracy
- Variance analysis

### Integration Tests
- Full PDA generation flow
- FDA creation with invoices
- Service request workflow
- Email notifications

### E2E Tests
- Agent creates appointment → Auto-generates PDA → Receives email
- Owner approves PDA → Agent books services → Vendor confirms
- Services completed → Agent creates FDA → Owner reviews variance

---

## 📊 SUCCESS METRICS

### Performance
- PDA generation: <5 minutes (target: 95% automation)
- Prediction accuracy: >92% (within 10% of actual)
- Auto-import rate: >85% (without manual intervention)

### Business
- Agent adoption: 50+ agents in 3 months
- Revenue: $25K MRR by month 6
- Cost savings: 2-4 hours → 5 minutes per PDA
- Variance reduction: 15% → 5% (PDA vs FDA)

### User Satisfaction
- Agent NPS: >50
- Owner satisfaction: >80%
- Support tickets: <5% of appointments

---

## 💰 REVENUE MODEL

### Pricing Options

**Option A: Per Port Call**
- $50 per PDA generation
- $25 per FDA processing
- Target: 500 port calls/month = $37.5K MRR

**Option B: Subscription**
- $499/month (unlimited port calls)
- Target: 50 agents x $499 = $25K MRR

**Option C: Freemium**
- Free: 5 port calls/month
- Pro: $299/month (unlimited)
- Enterprise: $999/month (multi-user, white-label)

**Recommended**: Start with Option B (subscription), add Option A for low-volume agents

---

## 🚀 GO-TO-MARKET STRATEGY

### Beta Phase (Month 1-3)
- Onboard 10 beta agents (free)
- Gather feedback and testimonials
- Refine product based on usage
- Build case studies

### Launch Phase (Month 4-6)
- Public launch with pricing
- Target: 50 paying agents
- Content marketing (blog posts, webinars)
- Agent referral program

### Growth Phase (Month 7-12)
- Target: 200+ agents
- Enterprise sales (large agencies)
- International expansion
- API for ERP integration

---

## 🎯 NEXT ACTIONS

**Immediate (This Week)**:
1. [ ] Review and approve this implementation plan
2. [ ] Create Prisma migration for 9 new tables
3. [ ] Start Week 1-2 tasks (database schema)

**Short-term (This Month)**:
1. [ ] Build PDA auto-generation service (Week 3-4)
2. [ ] Integrate multi-currency engine (Week 5)
3. [ ] Build FDA workflow (Week 6-7)

**Long-term (Next 3 Months)**:
1. [ ] Complete MVP (Week 1-12)
2. [ ] Beta testing with 10 agents
3. [ ] Public launch

---

**Created By**: Claude Sonnet 4.5 <noreply@anthropic.com>
**Date**: February 2, 2026
**Purpose**: MVP implementation plan for Port Agency Portal (Priority 1)
**Target**: Production-ready in 3-4 months, $25K MRR by month 6
