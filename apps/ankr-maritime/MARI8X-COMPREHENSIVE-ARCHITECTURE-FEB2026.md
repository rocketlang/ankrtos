# Mari8X Comprehensive Technical Architecture
## Priority-Ordered Feature Deep Dive

**Version**: 1.0
**Date**: February 2, 2026
**Priority Order**: 1→2→3→4→5→6→7→8
**Status**: Strategic Planning & Architecture Design

---

# 🏆 Priority 1: Port Agency Portal

## Executive Summary

The Port Agency Portal is the **highest ROI feature** in the Mari8X ecosystem:
- **Market Size**: 5,000+ port agents globally
- **Pain Point**: Manual PDA/FDA in Excel/Word (2-4 hours per port call)
- **Solution**: 95% automation (5 minutes per port call)
- **Revenue**: $50/port call or $499/month subscription
- **Time to Market**: 3-4 months

---

## 1.1 PDA (Port Disbursement Account) Automation

### Current Pain Points (Manual Process)

1. **Agent receives vessel ETA**: Email/phone call from owner
2. **Gathers port tariffs**: Calls port authority, checks website PDFs
3. **Requests quotes**: Calls pilot, towage, mooring companies
4. **Creates PDA in Excel**: Manual data entry, formula errors common
5. **Emails PDA to owner**: Waits for approval (24-48 hours)
6. **Owner requests changes**: "Why is pilotage so high?" → Back to step 3
7. **Final PDA approved**: Agent arranges services
8. **Total Time**: **2-4 hours**

### Automated Solution Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Port Agency Portal - PDA Generator              │
└─────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   ┌────────┐       ┌─────────┐      ┌──────────┐
   │ Vessel │       │  Port   │      │ Service  │
   │  Data  │       │ Tariffs │      │ Providers│
   └────────┘       └─────────┘      └──────────┘
        │                 │                 │
        │                 │                 │
        ▼                 ▼                 ▼
   ┌──────────────────────────────────────────┐
   │         AI-Powered PDA Engine            │
   │  • Auto-populate from tariff database    │
   │  • Calculate vessel-specific charges     │
   │  • Get live quotes from suppliers        │
   │  • Apply discounts/volume rates          │
   │  • Multi-currency conversion             │
   │  • Tax calculations (GST, VAT, etc.)     │
   └──────────────────────────────────────────┘
                    │
                    ▼
   ┌──────────────────────────────────────────┐
   │         PDA Document (5 minutes)         │
   │  ✅ Auto-generated, ready for approval   │
   │  ✅ Owner receives instant notification  │
   │  ✅ Can approve/comment in 1 click       │
   └──────────────────────────────────────────┘
```

### Technical Implementation

#### Database Schema (PDA Module)

```typescript
// PDA Header
interface PDA {
  id: string;
  portCallId: string;  // Links to PortCall
  vesselId: string;
  portId: string;
  agentOrgId: string;
  ownerOrgId: string;

  // Metadata
  pdaNumber: string;  // Auto-generated: PDA-2026-INMUN-0001
  createdAt: Date;
  sentToOwnerAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;

  // Amounts
  estimatedTotal: number;
  currency: string;  // USD, EUR, INR, etc.
  exchangeRate?: number;
  baseCurrency?: string;  // Owner's preferred currency

  // Status
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'REVISED' | 'FUNDED';

  // Attachments
  attachments: PDAAttachment[];
}

// PDA Line Items
interface PDALineItem {
  id: string;
  pdaId: string;

  // Classification
  category: 'PORT_DUES' | 'PILOTAGE' | 'TOWAGE' | 'MOORING' |
            'FRESH_WATER' | 'GARBAGE' | 'CUSTOMS' | 'IMMIGRATION' |
            'HEALTH' | 'SECURITY' | 'AGENCY_FEE' | 'OTHER';

  description: string;

  // Calculation
  quantity?: number;
  unit?: string;  // GRT, LOA, NRT, trips, hours, etc.
  unitRate?: number;
  amount: number;

  // Source
  dataSource: 'TARIFF_DB' | 'SUPPLIER_QUOTE' | 'MANUAL' | 'AI_ESTIMATE';
  tariffId?: string;  // Links to PortTariff if from tariff DB
  quoteId?: string;   // Links to ServiceQuote if from supplier
  supplierId?: string;

  // Confidence (for AI estimates)
  confidence?: number;  // 0-1

  // Notes
  notes?: string;
  internalNotes?: string;  // Visible only to agent
}

// Service Quotes (for real-time pricing)
interface ServiceQuote {
  id: string;
  pdaId: string;
  serviceType: 'PILOTAGE' | 'TOWAGE' | 'MOORING' | 'BUNKER' | 'CHANDLERY' | 'OTHER';

  supplierId: string;
  supplierName: string;

  // Quote details
  quotedAmount: number;
  currency: string;
  validUntil: Date;

  // Terms
  paymentTerms?: string;
  cancellationPolicy?: string;

  // Status
  status: 'REQUESTED' | 'RECEIVED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

  requestedAt: Date;
  receivedAt?: Date;
  acceptedAt?: Date;
}
```

#### PDA Auto-Generation Algorithm

```typescript
class PDAGenerator {
  async generatePDA(portCallId: string): Promise<PDA> {
    // 1. Gather vessel & port call data
    const portCall = await this.getPortCall(portCallId);
    const vessel = await this.getVessel(portCall.vesselId);
    const port = await this.getPort(portCall.portId);

    // 2. Initialize PDA
    const pda: PDA = {
      id: generateId(),
      pdaNumber: this.generatePDANumber(port, portCall),
      portCallId,
      vesselId: vessel.id,
      portId: port.id,
      agentOrgId: portCall.agentId,
      ownerOrgId: vessel.ownerId,
      status: 'DRAFT',
      estimatedTotal: 0,
      currency: port.defaultCurrency || 'USD',
      createdAt: new Date(),
      attachments: [],
    };

    // 3. Calculate line items
    const lineItems: PDALineItem[] = [];

    // 3.1 Port Dues (from tariff DB)
    const portDues = await this.calculatePortDues(vessel, port);
    lineItems.push(portDues);

    // 3.2 Pilotage (from tariff DB + real-time quote)
    const pilotage = await this.calculatePilotage(vessel, port, portCall);
    lineItems.push(pilotage);

    // 3.3 Towage (from tariff DB + real-time quote)
    const towage = await this.calculateTowage(vessel, port, portCall);
    lineItems.push(towage);

    // 3.4 Mooring (from tariff DB)
    const mooring = await this.calculateMooring(vessel, port, portCall);
    lineItems.push(mooring);

    // 3.5 Fresh Water (from tariff DB)
    if (portCall.freshWaterRequired) {
      const water = await this.calculateFreshWater(
        portCall.freshWaterQuantity,
        port
      );
      lineItems.push(water);
    }

    // 3.6 Garbage Disposal (from tariff DB)
    if (portCall.garbageDisposal) {
      const garbage = await this.calculateGarbage(vessel, port);
      lineItems.push(garbage);
    }

    // 3.7 Customs, Immigration, Health (fixed fees or from tariff DB)
    lineItems.push(await this.calculateCustoms(vessel, port));
    lineItems.push(await this.calculateImmigration(vessel, port, portCall.crewCount));
    lineItems.push(await this.calculateHealth(vessel, port));

    // 3.8 Agency Fee (% of total or fixed)
    const agencyFee = await this.calculateAgencyFee(lineItems, port);
    lineItems.push(agencyFee);

    // 4. Apply discounts, surcharges, taxes
    const adjustedLineItems = await this.applyAdjustments(lineItems, vessel, port);

    // 5. Calculate total
    pda.estimatedTotal = adjustedLineItems.reduce((sum, item) => sum + item.amount, 0);

    // 6. Currency conversion if needed
    if (vessel.owner.preferredCurrency !== pda.currency) {
      const converted = await this.convertCurrency(
        pda.estimatedTotal,
        pda.currency,
        vessel.owner.preferredCurrency
      );
      pda.baseCurrency = vessel.owner.preferredCurrency;
      pda.exchangeRate = converted.rate;
    }

    // 7. Save PDA and line items
    await this.savePDA(pda, adjustedLineItems);

    // 8. Auto-notify owner
    await this.notifyOwner(pda);

    return pda;
  }

  private async calculatePortDues(vessel: Vessel, port: Port): Promise<PDALineItem> {
    // Get tariff from database
    const tariff = await this.getTariff(port.id, 'PORT_DUES', vessel.grt);

    if (!tariff) {
      // Fallback: AI estimate based on similar ports
      return this.aiEstimatePortDues(vessel, port);
    }

    // Calculate based on tariff
    const amount = tariff.rate * vessel.grt;

    return {
      id: generateId(),
      category: 'PORT_DUES',
      description: `Port Dues (GRT: ${vessel.grt})`,
      quantity: vessel.grt,
      unit: 'GRT',
      unitRate: tariff.rate,
      amount,
      dataSource: 'TARIFF_DB',
      tariffId: tariff.id,
      confidence: 1.0,
    };
  }

  private async calculatePilotage(
    vessel: Vessel,
    port: Port,
    portCall: PortCall
  ): Promise<PDALineItem> {
    // Request real-time quote from pilot company
    const quote = await this.requestServiceQuote({
      serviceType: 'PILOTAGE',
      portId: port.id,
      vesselGRT: vessel.grt,
      vesselLOA: vessel.loa,
      vesselDraft: vessel.draft,
      movementType: portCall.movementType, // 'INBOUND' | 'OUTBOUND' | 'SHIFTING'
      berthingLocation: portCall.berth,
    });

    if (quote) {
      return {
        id: generateId(),
        category: 'PILOTAGE',
        description: `Pilotage - ${portCall.movementType}`,
        amount: quote.quotedAmount,
        dataSource: 'SUPPLIER_QUOTE',
        quoteId: quote.id,
        supplierId: quote.supplierId,
        confidence: 1.0,
        notes: `Quote valid until ${quote.validUntil}`,
      };
    }

    // Fallback: Use tariff DB or AI estimate
    return this.estimatePilotage(vessel, port, portCall);
  }
}
```

#### Real-Time Service Quotes Integration

```typescript
// Service Provider Integration
class ServiceQuoteManager {
  async requestQuote(request: QuoteRequest): Promise<ServiceQuote | null> {
    // 1. Find suppliers for this service at this port
    const suppliers = await this.findSuppliers(request.serviceType, request.portId);

    if (suppliers.length === 0) return null;

    // 2. Send quote request to suppliers (parallel)
    const quotePromises = suppliers.map(supplier =>
      this.sendQuoteRequest(supplier, request)
    );

    // 3. Wait for first response (or timeout after 30 seconds)
    const quote = await Promise.race([
      ...quotePromises,
      this.timeout(30000),
    ]);

    return quote;
  }

  private async sendQuoteRequest(
    supplier: ServiceProvider,
    request: QuoteRequest
  ): Promise<ServiceQuote> {
    // Integration methods (in priority order):

    // Method 1: API Integration (best)
    if (supplier.apiEndpoint) {
      return this.callSupplierAPI(supplier, request);
    }

    // Method 2: Email Integration
    if (supplier.quoteEmail) {
      return this.sendEmailQuoteRequest(supplier, request);
    }

    // Method 3: WhatsApp Integration (India)
    if (supplier.whatsappNumber) {
      return this.sendWhatsAppQuoteRequest(supplier, request);
    }

    // Method 4: Manual (agent portal notification)
    return this.createManualQuoteRequest(supplier, request);
  }
}
```

---

## 1.2 FDA (Final Disbursement Account) Automation

### Current Pain Points

1. **Agent collects invoices**: From 10-20 different suppliers (paper, email, WhatsApp)
2. **Manual entry in Excel**: Copy amounts from invoices to FDA
3. **Calculate variance**: Compare FDA to PDA (often 10-20% difference)
4. **Explain variances**: Write explanations for each major difference
5. **Attach all receipts**: Scan/PDF 20+ documents
6. **Email to owner**: Wait for payment (30-60 days typical)
7. **Disputes**: Owner questions 30% of items → back-and-forth emails
8. **Total Time**: **4-6 hours per FDA**

### Automated Solution

```typescript
// FDA Auto-Generation from Invoices
class FDAGenerator {
  async generateFDA(pdaId: string): Promise<FDA> {
    // 1. Get approved PDA
    const pda = await this.getPDA(pdaId);
    if (pda.status !== 'APPROVED') {
      throw new Error('PDA must be approved before creating FDA');
    }

    // 2. Gather all invoices
    const invoices = await this.getInvoices(pda.portCallId);

    // 3. OCR processing for uploaded invoice images
    const ocrResults = await this.processInvoiceOCR(invoices);

    // 4. Match invoices to PDA line items
    const matches = await this.matchInvoicesToPDA(ocrResults, pda);

    // 5. Calculate variances
    const variances = this.calculateVariances(matches);

    // 6. AI-generate variance explanations
    const explanations = await this.generateExplanations(variances);

    // 7. Create FDA
    const fda: FDA = {
      id: generateId(),
      pdaId: pda.id,
      fdaNumber: this.generateFDANumber(pda),
      status: 'DRAFT',
      totalActual: ocrResults.reduce((sum, inv) => sum + inv.amount, 0),
      totalEstimated: pda.estimatedTotal,
      variance: 0, // Calculated below
      variancePercentage: 0,
      lineItems: matches,
      explanations,
      createdAt: new Date(),
    };

    fda.variance = fda.totalActual - fda.totalEstimated;
    fda.variancePercentage = (fda.variance / fda.totalEstimated) * 100;

    // 8. Auto-flag high variances for review
    if (Math.abs(fda.variancePercentage) > 10) {
      fda.requiresReview = true;
      fda.reviewReason = `High variance: ${fda.variancePercentage.toFixed(1)}%`;
    }

    return fda;
  }

  // Invoice OCR with AI extraction
  async processInvoiceOCR(invoices: Invoice[]): Promise<OCRResult[]> {
    const results = await Promise.all(
      invoices.map(async (invoice) => {
        // Use Tesseract.js for OCR
        const text = await this.extractTextFromImage(invoice.imageUrl);

        // Use AI to extract structured data
        const structured = await this.extractInvoiceData(text);

        return {
          invoiceId: invoice.id,
          supplierName: structured.supplier,
          invoiceNumber: structured.invoiceNumber,
          invoiceDate: structured.date,
          amount: structured.totalAmount,
          currency: structured.currency,
          lineItems: structured.lineItems,
          confidence: structured.confidence,
        };
      })
    );

    return results;
  }

  // AI-powered variance explanation
  async generateExplanations(variances: Variance[]): Promise<string[]> {
    const prompt = `
You are a port agency expert. Explain these variances between PDA (estimate) and FDA (actual):

${variances.map(v => `
- ${v.description}:
  Estimated: ${v.estimated}
  Actual: ${v.actual}
  Variance: ${v.difference} (${v.percentage}%)
`).join('\n')}

Generate brief, professional explanations for each variance.
Focus on common reasons: weather delays, additional services, rate changes, etc.
    `;

    const response = await this.callAI(prompt);
    return response.explanations;
  }
}
```

### Invoice OCR & AI Extraction Example

```typescript
// Input: Scanned invoice image
// Output: Structured data

interface InvoiceExtractionResult {
  supplier: string;           // "Mumbai Port Trust"
  invoiceNumber: string;      // "MPT/2026/0123"
  invoiceDate: Date;          // 2026-02-01
  totalAmount: number;        // 15750.50
  currency: string;           // "INR"
  lineItems: Array<{
    description: string;      // "Port Dues - MV OCEAN PRIDE"
    quantity?: number;        // 12500 (GRT)
    rate?: number;           // 1.26 per GRT
    amount: number;          // 15750.00
  }>;
  taxAmount?: number;         // GST 18%
  confidence: number;         // 0.95
}

// Implementation using @ankr/eon AI
async extractInvoiceData(ocrText: string): Promise<InvoiceExtractionResult> {
  const prompt = `
Extract structured invoice data from this OCR text:

${ocrText}

Return JSON with: supplier, invoiceNumber, invoiceDate, totalAmount, currency, lineItems[], taxAmount
  `;

  const result = await eonProxy.chat({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    responseFormat: { type: 'json_object' },
  });

  const parsed = JSON.parse(result.choices[0].message.content);

  // Validate and assign confidence
  const confidence = this.validateExtraction(parsed, ocrText);

  return { ...parsed, confidence };
}
```

---

## 1.3 Service Request Management

### Workflow Architecture

```
Owner/Charterer                Agent                    Suppliers
      │                         │                          │
      ├─ Request Services ──────>│                          │
      │  (Pilotage, Bunker,     │                          │
      │   Fresh Water, etc.)    │                          │
      │                         │                          │
      │                         ├─ Create Service Req ────>│
      │                         │                          │
      │                         │<── Send Quotes ──────────┤
      │                         │                          │
      │<─ Present Options ──────┤                          │
      │  (3 quotes compared)    │                          │
      │                         │                          │
      ├─ Approve Supplier ──────>│                          │
      │                         │                          │
      │                         ├─ Confirm Booking ────────>│
      │                         │                          │
      │                         │<── Confirmation ─────────┤
      │                         │                          │
      │<─ Notify Scheduled ─────┤                          │
      │                         │                          │
      │                         │<── Service Completed ────┤
      │                         │                          │
      │<─ Invoice Added to FDA ─┤                          │
```

### Implementation

```typescript
interface ServiceRequest {
  id: string;
  portCallId: string;
  requestedBy: 'OWNER' | 'CHARTERER' | 'AGENT' | 'MASTER';
  requestorId: string;

  serviceType: 'PILOTAGE' | 'TOWAGE' | 'MOORING' | 'BUNKER' |
               'FRESH_WATER' | 'CHANDLERY' | 'WASTE_DISPOSAL' |
               'CUSTOMS' | 'REPAIRS' | 'SURVEYS' | 'OTHER';

  // Service details
  description: string;
  quantity?: number;
  unit?: string;
  preferredTiming?: Date;
  specialRequirements?: string;

  // Quote comparison
  quotes: ServiceQuote[];
  selectedQuoteId?: string;

  // Execution
  supplierId?: string;
  scheduledTime?: Date;
  completedTime?: Date;
  completionNotes?: string;

  // Invoicing
  invoiceId?: string;
  invoicedAmount?: number;

  // Status tracking
  status: 'REQUESTED' | 'QUOTES_RECEIVED' | 'APPROVED' |
          'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' |
          'CANCELLED' | 'DISPUTED';

  // Audit trail
  createdAt: Date;
  quotesReceivedAt?: Date;
  approvedAt?: Date;
  completedAt?: Date;

  // Attachments
  attachments: Document[];
}

// Service Request Workflow Engine
class ServiceRequestWorkflow {
  async createRequest(request: Partial<ServiceRequest>): Promise<ServiceRequest> {
    // 1. Create request
    const sr: ServiceRequest = {
      id: generateId(),
      status: 'REQUESTED',
      quotes: [],
      createdAt: new Date(),
      ...request,
    } as ServiceRequest;

    await this.saveServiceRequest(sr);

    // 2. Auto-send to preferred suppliers (in parallel)
    const suppliers = await this.getPreferredSuppliers(
      sr.serviceType,
      sr.portCallId
    );

    await Promise.all(
      suppliers.map(supplier =>
        this.requestQuote(sr.id, supplier.id)
      )
    );

    // 3. Notify requester
    await this.notify({
      userId: sr.requestorId,
      type: 'SERVICE_REQUEST_CREATED',
      message: `Service request #${sr.id} created. Awaiting quotes from ${suppliers.length} suppliers.`,
    });

    // 4. Set reminder (if no quotes after 2 hours, escalate)
    await this.scheduleReminder(sr.id, 2 * 60 * 60 * 1000);

    return sr;
  }

  async receiveQuote(serviceRequestId: string, quote: ServiceQuote): Promise<void> {
    // 1. Add quote to service request
    const sr = await this.getServiceRequest(serviceRequestId);
    sr.quotes.push(quote);
    sr.quotesReceivedAt = new Date();
    await this.saveServiceRequest(sr);

    // 2. Notify requester with comparison
    await this.notifyQuoteReceived(sr);

    // 3. If 3+ quotes received, auto-rank by price
    if (sr.quotes.length >= 3) {
      sr.quotes.sort((a, b) => a.quotedAmount - b.quotedAmount);
      await this.saveServiceRequest(sr);

      // Recommend best quote
      await this.recommendBestQuote(sr);
    }
  }

  async approveQuote(
    serviceRequestId: string,
    quoteId: string,
    approvedBy: string
  ): Promise<void> {
    // 1. Update service request
    const sr = await this.getServiceRequest(serviceRequestId);
    sr.selectedQuoteId = quoteId;
    sr.status = 'APPROVED';
    sr.approvedAt = new Date();

    const quote = sr.quotes.find(q => q.id === quoteId);
    sr.supplierId = quote.supplierId;

    await this.saveServiceRequest(sr);

    // 2. Confirm booking with supplier
    await this.confirmBooking(sr, quote);

    // 3. Add to PDA/FDA (if not already included)
    await this.addToDisburseAccount(sr, quote);

    // 4. Schedule service (if timing specified)
    if (sr.preferredTiming) {
      await this.scheduleService(sr);
    }

    // 5. Notify all parties
    await this.notifyServiceApproved(sr, quote);
  }
}
```

---

## 1.4 Multi-Currency & Tax Engine

### Requirements

- Support 20+ currencies (USD, EUR, GBP, INR, SGD, AED, etc.)
- Live FX rates (updated every 15 minutes)
- Tax calculations: GST (India), VAT (EU), Sales Tax (US)
- Multi-currency invoicing
- Exchange gain/loss tracking
- Compliance with local tax laws

### Implementation

```typescript
class CurrencyService {
  private cache: Map<string, ExchangeRate> = new Map();
  private cacheExpiry = 15 * 60 * 1000; // 15 minutes

  async getExchangeRate(from: string, to: string): Promise<number> {
    if (from === to) return 1.0;

    const cacheKey = `${from}_${to}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.rate;
    }

    // Fetch live rate
    const rate = await this.fetchLiveRate(from, to);
    this.cache.set(cacheKey, { rate, timestamp: Date.now() });

    return rate;
  }

  async convert(
    amount: number,
    from: string,
    to: string
  ): Promise<{ amount: number; rate: number }> {
    const rate = await this.getExchangeRate(from, to);
    return {
      amount: amount * rate,
      rate,
    };
  }

  private async fetchLiveRate(from: string, to: string): Promise<number> {
    // Use multiple providers with fallback
    const providers = [
      () => this.fetchFromExchangeRateAPI(from, to),
      () => this.fetchFromCurrencyLayer(from, to),
      () => this.fetchFromOpenExchangeRates(from, to),
    ];

    for (const provider of providers) {
      try {
        return await provider();
      } catch (error) {
        console.error('FX provider failed:', error);
      }
    }

    throw new Error(`Failed to fetch exchange rate for ${from}/${to}`);
  }
}

class TaxCalculator {
  async calculateTax(
    amount: number,
    portCountry: string,
    serviceCategory: string
  ): Promise<TaxBreakdown> {
    // Tax rules by country
    const rules: Record<string, TaxRule> = {
      'IN': { // India
        name: 'GST',
        rate: 0.18, // 18%
        applicableTo: ['SERVICES', 'GOODS'],
        exemptions: ['EXPORTS'], // Export services exempt
      },
      'SG': { // Singapore
        name: 'GST',
        rate: 0.08, // 8%
        applicableTo: ['SERVICES', 'GOODS'],
        exemptions: [],
      },
      'AE': { // UAE
        name: 'VAT',
        rate: 0.05, // 5%
        applicableTo: ['SERVICES', 'GOODS'],
        exemptions: ['FREE_ZONES'],
      },
      'GB': { // UK
        name: 'VAT',
        rate: 0.20, // 20%
        applicableTo: ['SERVICES', 'GOODS'],
        exemptions: ['EXPORTS'],
      },
    };

    const rule = rules[portCountry];
    if (!rule) {
      return { taxAmount: 0, taxName: 'N/A', taxRate: 0, total: amount };
    }

    // Check exemptions
    if (rule.exemptions.includes(serviceCategory)) {
      return { taxAmount: 0, taxName: rule.name, taxRate: 0, total: amount };
    }

    const taxAmount = amount * rule.rate;
    const total = amount + taxAmount;

    return {
      taxAmount,
      taxName: rule.name,
      taxRate: rule.rate,
      total,
    };
  }
}
```

---

## 1.5 GraphQL API for Port Agency Portal

```typescript
// PDA Mutations
builder.mutationField('generatePDA', (t) =>
  t.field({
    type: PDAType,
    args: {
      portCallId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const generator = new PDAGenerator(ctx.prisma);
      return await generator.generatePDA(args.portCallId);
    },
  })
);

builder.mutationField('sendPDAToOwner', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      pdaId: t.arg.string({ required: true }),
      message: t.arg.string(),
    },
    resolve: async (_root, args, ctx) => {
      const pda = await ctx.prisma.pDA.update({
        where: { id: args.pdaId },
        data: {
          status: 'SENT',
          sentToOwnerAt: new Date(),
        },
      });

      await sendEmail({
        to: pda.owner.email,
        subject: `PDA for ${pda.vessel.name} - ${pda.port.name}`,
        body: renderPDAEmail(pda, args.message),
        attachments: [generatePDAPDF(pda)],
      });

      return true;
    },
  })
);

builder.mutationField('approvePDA', (t) =>
  t.field({
    type: PDAType,
    args: {
      pdaId: t.arg.string({ required: true }),
      comments: t.arg.string(),
    },
    resolve: async (_root, args, ctx) => {
      return await ctx.prisma.pDA.update({
        where: { id: args.pdaId },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: ctx.user.id,
          approvalComments: args.comments,
        },
      });
    },
  })
);

// FDA Mutations
builder.mutationField('generateFDA', (t) =>
  t.field({
    type: FDAType,
    args: {
      pdaId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const generator = new FDAGenerator(ctx.prisma);
      return await generator.generateFDA(args.pdaId);
    },
  })
);

builder.mutationField('uploadInvoiceToFDA', (t) =>
  t.field({
    type: 'Invoice',
    args: {
      fdaId: t.arg.string({ required: true }),
      file: t.arg({ type: 'Upload', required: true }),
      category: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      // 1. Upload file to MinIO
      const fileUrl = await uploadToMinIO(args.file);

      // 2. OCR processing
      const ocrResult = await processInvoiceOCR(fileUrl);

      // 3. Save invoice
      const invoice = await ctx.prisma.invoice.create({
        data: {
          fdaId: args.fdaId,
          category: args.category,
          fileUrl,
          supplierName: ocrResult.supplier,
          invoiceNumber: ocrResult.invoiceNumber,
          amount: ocrResult.totalAmount,
          currency: ocrResult.currency,
          extractedData: ocrResult,
          confidence: ocrResult.confidence,
        },
      });

      // 4. Auto-match to PDA line item
      await autoMatchInvoiceToPDA(invoice);

      return invoice;
    },
  })
);
```

---

## 1.6 Port Agency Portal - MVP Roadmap

### Month 1: Core PDA Automation
- **Week 1-2**: Database schema, PDA data model
- **Week 3**: PDA auto-generation algorithm
- **Week 4**: Tariff database integration (100 ports)

### Month 2: FDA & Invoice Processing
- **Week 1-2**: FDA module, variance calculation
- **Week 3**: Invoice OCR with Tesseract.js
- **Week 4**: AI invoice extraction with @ankr/eon

### Month 3: Service Requests & Quotes
- **Week 1-2**: Service request workflow
- **Week 3**: Supplier quote integration (API, email, WhatsApp)
- **Week 4**: Quote comparison & approval UI

### Month 4: Polish & Launch
- **Week 1**: Multi-currency & tax engine
- **Week 2**: PDF generation (PDA/FDA)
- **Week 3**: Email notifications & approvals
- **Week 4**: Beta testing with 10 agents

### Success Metrics (Post-Launch)
- PDA generation time: **2 hours → 5 minutes** (95% reduction)
- FDA processing time: **4 hours → 15 minutes** (93% reduction)
- Invoice matching accuracy: **>90%** (OCR + AI)
- Owner satisfaction: **4.5/5 stars**
- Agent adoption: **50 agents in Month 1**

---

# 🏆 Priority 2: Ship Agents App (Mobile)

## Executive Summary

The **Ship Agents App** is the **GAME CHANGER** for port agency operations:
- **First-of-its-kind**: No competitor has a mobile-first agent app
- **Target Users**: 5,000+ port agents worldwide
- **Platform**: React Native (iOS + Android)
- **Key Features**: Offline-first, voice input, photo OCR, geolocation
- **Time to Market**: 4-5 months

---

## 2.1 Offline-First Architecture

### Challenge
Ships and ports often have poor/no internet connectivity. Agents need to work seamlessly offline and sync when connection is restored.

### Solution: IndexedDB + Delta Sync

```
┌──────────────────────────────────────────────────┐
│            Ship Agents Mobile App                │
└──────────────────────────────────────────────────┘
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
   ┌──────────┐          ┌──────────┐
   │ Online   │          │ Offline  │
   │  Mode    │          │   Mode   │
   └──────────┘          └──────────┘
         │                     │
         │                     ▼
         │            ┌─────────────────┐
         │            │  Local Storage  │
         │            │  (IndexedDB)    │
         │            │                 │
         │            │  • Port Calls   │
         │            │  • PDA Items    │
         │            │  • Documents    │
         │            │  • Messages     │
         │            └─────────────────┘
         │                     │
         ▼                     ▼
   ┌──────────────────────────────────┐
   │      Background Sync             │
   │  • Upload pending changes        │
   │  • Download latest updates       │
   │  • Conflict resolution           │
   └──────────────────────────────────┘
```

### Implementation

```typescript
// Offline Storage Layer
class OfflineStorage {
  private db: IDBDatabase;

  async init() {
    this.db = await openDB('mari8x-agent', 3, {
      upgrade(db) {
        // Port calls
        if (!db.objectStoreNames.contains('portCalls')) {
          const portCallStore = db.createObjectStore('portCalls', { keyPath: 'id' });
          portCallStore.createIndex('syncStatus', 'syncStatus');
          portCallStore.createIndex('lastModified', 'lastModified');
        }

        // PDA items (pending upload)
        if (!db.objectStoreNames.contains('pdaItems')) {
          const pdaStore = db.createObjectStore('pdaItems', { keyPath: 'tempId' });
          pdaStore.createIndex('portCallId', 'portCallId');
          pdaStore.createIndex('syncStatus', 'syncStatus');
        }

        // Documents (pending upload)
        if (!db.objectStoreNames.contains('documents')) {
          const docStore = db.createObjectStore('documents', { keyPath: 'tempId' });
          docStore.createIndex('portCallId', 'portCallId');
          docStore.createIndex('uploadStatus', 'uploadStatus');
        }

        // Messages/chat
        if (!db.objectStoreNames.contains('messages')) {
          const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
          msgStore.createIndex('portCallId', 'portCallId');
          msgStore.createIndex('timestamp', 'timestamp');
        }
      },
    });
  }

  // Save port call (works offline)
  async savePortCall(portCall: PortCall) {
    const tx = this.db.transaction('portCalls', 'readwrite');
    await tx.store.put({
      ...portCall,
      syncStatus: navigator.onLine ? 'SYNCED' : 'PENDING',
      lastModified: Date.now(),
    });
  }

  // Add PDA item (works offline)
  async addPDAItem(item: PDALineItem) {
    const tx = this.db.transaction('pdaItems', 'readwrite');
    await tx.store.add({
      tempId: generateTempId(), // Client-side ID
      ...item,
      syncStatus: 'PENDING',
      createdAt: Date.now(),
    });

    // Trigger background sync if online
    if (navigator.onLine) {
      this.triggerBackgroundSync();
    }
  }

  // Upload document (works offline - queued)
  async uploadDocument(file: File, portCallId: string, category: string) {
    // Convert to base64 for local storage
    const base64 = await this.fileToBase64(file);

    const tx = this.db.transaction('documents', 'readwrite');
    await tx.store.add({
      tempId: generateTempId(),
      portCallId,
      category,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      base64Data: base64,
      uploadStatus: 'PENDING',
      createdAt: Date.now(),
    });

    // Trigger background upload if online
    if (navigator.onLine) {
      this.triggerBackgroundUpload();
    }
  }
}

// Background Sync Manager
class BackgroundSyncManager {
  async sync() {
    if (!navigator.onLine) return;

    console.log('[Sync] Starting background sync...');

    // 1. Upload pending PDA items
    await this.uploadPendingPDAItems();

    // 2. Upload pending documents
    await this.uploadPendingDocuments();

    // 3. Upload pending messages
    await this.uploadPendingMessages();

    // 4. Download latest updates
    await this.downloadLatestUpdates();

    console.log('[Sync] Background sync complete');
  }

  private async uploadPendingPDAItems() {
    const storage = new OfflineStorage();
    await storage.init();

    const tx = storage.db.transaction('pdaItems', 'readonly');
    const index = tx.store.index('syncStatus');
    const pendingItems = await index.getAll('PENDING');

    for (const item of pendingItems) {
      try {
        // Upload to server
        const response = await api.post('/pda-items', item);

        // Update local record with server ID
        const updateTx = storage.db.transaction('pdaItems', 'readwrite');
        await updateTx.store.delete(item.tempId);
        await updateTx.store.put({
          ...item,
          id: response.data.id, // Server-assigned ID
          syncStatus: 'SYNCED',
        });

        console.log(`[Sync] Uploaded PDA item ${item.tempId}`);
      } catch (error) {
        console.error(`[Sync] Failed to upload PDA item ${item.tempId}:`, error);
        // Mark as failed (will retry next sync)
        const updateTx = storage.db.transaction('pdaItems', 'readwrite');
        await updateTx.store.put({
          ...item,
          syncStatus: 'FAILED',
          lastError: error.message,
        });
      }
    }
  }

  private async uploadPendingDocuments() {
    const storage = new OfflineStorage();
    await storage.init();

    const tx = storage.db.transaction('documents', 'readonly');
    const index = tx.store.index('uploadStatus');
    const pendingDocs = await index.getAll('PENDING');

    for (const doc of pendingDocs) {
      try {
        // Convert base64 back to blob
        const blob = this.base64ToBlob(doc.base64Data, doc.mimeType);

        // Upload to server
        const formData = new FormData();
        formData.append('file', blob, doc.fileName);
        formData.append('portCallId', doc.portCallId);
        formData.append('category', doc.category);

        const response = await api.post('/documents/upload', formData);

        // Update local record
        const updateTx = storage.db.transaction('documents', 'readwrite');
        await updateTx.store.delete(doc.tempId);
        await updateTx.store.put({
          ...doc,
          id: response.data.id,
          uploadStatus: 'UPLOADED',
          url: response.data.url,
        });

        console.log(`[Sync] Uploaded document ${doc.tempId}`);
      } catch (error) {
        console.error(`[Sync] Failed to upload document ${doc.tempId}:`, error);
      }
    }
  }

  private async downloadLatestUpdates() {
    // Get last sync timestamp
    const lastSync = localStorage.getItem('lastSyncTimestamp');

    // Fetch updates since last sync
    const response = await api.get(`/sync/updates?since=${lastSync}`);

    const storage = new OfflineStorage();
    await storage.init();

    // Update local storage with server changes
    for (const update of response.data.updates) {
      if (update.type === 'PORT_CALL') {
        await storage.savePortCall(update.data);
      }
      // Handle other update types...
    }

    // Update last sync timestamp
    localStorage.setItem('lastSyncTimestamp', Date.now().toString());
  }
}

// Auto-sync when connection restored
window.addEventListener('online', () => {
  const syncManager = new BackgroundSyncManager();
  syncManager.sync();
});

// Periodic sync (every 5 minutes when online)
setInterval(() => {
  if (navigator.onLine) {
    const syncManager = new BackgroundSyncManager();
    syncManager.sync();
  }
}, 5 * 60 * 1000);
```

---

## 2.2 Voice Input for PDA Entries

### Use Case
Agent boards vessel, inspects, and verbally logs PDA items:
- "Add pilotage rupees fifty thousand"
- "Add fresh water one hundred metric tons at rupees two thousand per ton"
- "Add mooring charges rupees twenty five thousand"

### Implementation

```typescript
// Voice Recognition Service
class VoiceInputService {
  private recognition: any; // SpeechRecognition API

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition ||
                              (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-IN'; // Indian English
  }

  async startListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      this.recognition.onerror = (event: any) => {
        reject(event.error);
      };

      this.recognition.start();
    });
  }

  async parsePDACommand(transcript: string): Promise<PDALineItem> {
    // Use AI to parse voice command
    const prompt = `
Parse this voice command into a PDA line item:

"${transcript}"

Extract:
- category (e.g., PILOTAGE, MOORING, FRESH_WATER)
- description
- amount (number only)
- currency (INR, USD, etc.)
- quantity (if mentioned)
- unit (if mentioned)

Return JSON.
    `;

    const response = await eonProxy.chat({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      responseFormat: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0].message.content);

    return {
      id: generateTempId(),
      category: parsed.category,
      description: parsed.description,
      amount: parsed.amount,
      currency: parsed.currency,
      quantity: parsed.quantity,
      unit: parsed.unit,
      dataSource: 'VOICE_INPUT',
      confidence: 0.9,
    };
  }
}

// React Component
function VoicePDAInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedItem, setParsedItem] = useState<PDALineItem | null>(null);

  const voiceService = new VoiceInputService();

  const handleVoiceInput = async () => {
    setIsListening(true);

    try {
      // Listen for voice command
      const transcript = await voiceService.startListening();
      setTranscript(transcript);

      // Parse command
      const item = await voiceService.parsePDACommand(transcript);
      setParsedItem(item);

      // Show confirmation dialog
      Alert.alert(
        'Confirm PDA Item',
        `Add ${item.description} for ${item.currency} ${item.amount}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: () => {
              // Add to PDA
              addPDAItem(item);
              setTranscript('');
              setParsedItem(null);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', `Voice recognition failed: ${error.message}`);
    } finally {
      setIsListening(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title={isListening ? 'Listening...' : 'Add PDA Item (Voice)'}
        onPress={handleVoiceInput}
        disabled={isListening}
      />

      {transcript && (
        <View style={styles.transcript}>
          <Text>You said: "{transcript}"</Text>
        </View>
      )}

      {parsedItem && (
        <View style={styles.parsedItem}>
          <Text>Parsed Item:</Text>
          <Text>Category: {parsedItem.category}</Text>
          <Text>Description: {parsedItem.description}</Text>
          <Text>Amount: {parsedItem.currency} {parsedItem.amount}</Text>
        </View>
      )}
    </View>
  );
}
```

---

## 2.3 Photo OCR for Invoices

### Use Case
Agent receives paper invoice from supplier. Instead of manual entry:
1. Open app
2. Tap "Scan Invoice"
3. Take photo
4. App auto-extracts amount, supplier, invoice number
5. Confirm and upload to FDA

### Implementation

```typescript
// Invoice Scanner Component
import { Camera } from 'expo-camera';
import Tesseract from 'tesseract.js';

function InvoiceScanner() {
  const [hasPermission, setHasPermission] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const captureInvoice = async (camera: Camera) => {
    const photo = await camera.takePictureAsync();
    setCapturedImage(photo.uri);

    // Process OCR
    await processInvoiceOCR(photo.uri);
  };

  const processInvoiceOCR = async (imageUri: string) => {
    setIsProcessing(true);

    try {
      // Step 1: OCR with Tesseract.js
      const { data: { text } } = await Tesseract.recognize(
        imageUri,
        'eng',
        {
          logger: (m) => console.log(m),
        }
      );

      console.log('[OCR] Extracted text:', text);

      // Step 2: AI extraction with @ankr/eon
      const extracted = await extractInvoiceData(text);

      setOcrResult(extracted);

      // Step 3: Show confirmation dialog
      Alert.alert(
        'Invoice Scanned',
        `Supplier: ${extracted.supplier}\nAmount: ${extracted.currency} ${extracted.amount}\n\nIs this correct?`,
        [
          {
            text: 'Edit',
            onPress: () => showEditDialog(extracted),
          },
          {
            text: 'Confirm',
            onPress: () => uploadInvoice(extracted, imageUri),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', `OCR failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadInvoice = async (extracted: any, imageUri: string) => {
    const storage = new OfflineStorage();
    await storage.init();

    // Upload to local storage (will sync when online)
    await storage.uploadDocument(
      imageUri,
      currentPortCallId,
      extracted.category || 'OTHER'
    );

    // Create FDA line item
    await storage.addFDAItem({
      category: extracted.category,
      description: extracted.description,
      amount: extracted.amount,
      currency: extracted.currency,
      supplierId: extracted.supplierId,
      invoiceNumber: extracted.invoiceNumber,
      invoiceDate: extracted.date,
      dataSource: 'INVOICE_OCR',
      confidence: extracted.confidence,
    });

    Alert.alert('Success', 'Invoice uploaded and added to FDA');
  };

  if (!hasPermission) {
    return <Text>No camera permission</Text>;
  }

  return (
    <View style={styles.container}>
      {!capturedImage ? (
        <Camera style={styles.camera} type={Camera.Constants.Type.back}>
          {({ camera }) => (
            <View style={styles.buttonContainer}>
              <Button title="Capture Invoice" onPress={() => captureInvoice(camera)} />
            </View>
          )}
        </Camera>
      ) : (
        <View>
          <Image source={{ uri: capturedImage }} style={styles.preview} />
          {isProcessing && <ActivityIndicator size="large" />}
          {ocrResult && (
            <View style={styles.result}>
              <Text>Supplier: {ocrResult.supplier}</Text>
              <Text>Invoice #: {ocrResult.invoiceNumber}</Text>
              <Text>Amount: {ocrResult.currency} {ocrResult.amount}</Text>
              <Text>Confidence: {(ocrResult.confidence * 100).toFixed(0)}%</Text>
            </View>
          )}
          <Button title="Scan Another" onPress={() => setCapturedImage(null)} />
        </View>
      )}
    </View>
  );
}
```

---

## 2.4 GPS Geolocation Features

### Features

1. **Nearby Services**: Show bunker suppliers, chandlers within 10km
2. **Agent Check-in**: GPS timestamp when agent boards vessel
3. **Route to Port**: Google Maps integration
4. **Geofenced Notifications**: Alert when vessel enters port area

### Implementation

```typescript
// Geolocation Service
import * as Location from 'expo-location';

class GeolocationService {
  async getCurrentPosition(): Promise<{ lat: number; lon: number }> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    const location = await Location.getCurrentPositionAsync({});
    return {
      lat: location.coords.latitude,
      lon: location.coords.longitude,
    };
  }

  async findNearbyServices(
    serviceType: 'BUNKER' | 'CHANDLER' | 'REPAIR' | 'PILOT',
    radius: number = 10000 // 10km in meters
  ): Promise<Service[]> {
    const position = await this.getCurrentPosition();

    // Query backend for nearby services
    const response = await api.get('/services/nearby', {
      params: {
        lat: position.lat,
        lon: position.lon,
        type: serviceType,
        radius,
      },
    });

    return response.data.services;
  }

  async checkInToVessel(vesselId: string, portCallId: string): Promise<void> {
    const position = await this.getCurrentPosition();

    await api.post('/port-calls/check-in', {
      portCallId,
      vesselId,
      latitude: position.lat,
      longitude: position.lon,
      timestamp: new Date().toISOString(),
    });

    // Local notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Checked In',
        body: 'You have checked in to the vessel',
      },
      trigger: null,
    });
  }

  // Geofence monitoring
  async startGeofenceMonitoring(portCall: PortCall): Promise<void> {
    // Define geofence around port
    const geofence = {
      identifier: `port-${portCall.portId}`,
      latitude: portCall.port.latitude,
      longitude: portCall.port.longitude,
      radius: 5000, // 5km
    };

    await Location.startGeofencingAsync('PORT_ARRIVAL', [geofence]);
  }
}

// Nearby Services Component
function NearbyServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const geoService = new GeolocationService();

  const loadNearbyBunkerSuppliers = async () => {
    setLoading(true);
    const nearby = await geoService.findNearbyServices('BUNKER', 10000);
    setServices(nearby);
    setLoading(false);
  };

  useEffect(() => {
    loadNearbyBunkerSuppliers();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Nearby Bunker Suppliers</Text>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={services}
          renderItem={({ item }) => (
            <View style={styles.serviceCard}>
              <Text style={styles.serviceName}>{item.name}</Text>
              <Text>{item.distance.toFixed(1)} km away</Text>
              <Text>{item.phone}</Text>
              <Button
                title="Get Directions"
                onPress={() => openMaps(item.latitude, item.longitude)}
              />
              <Button
                title="Request Quote"
                onPress={() => requestQuote(item.id)}
              />
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
}

// Open Google Maps
function openMaps(lat: number, lon: number) {
  const scheme = Platform.select({
    ios: 'maps:0,0?q=',
    android: 'geo:0,0?q=',
  });
  const url = `${scheme}${lat},${lon}`;
  Linking.openURL(url);
}
```

---

## 2.5 Ship Agents App - Complete Tech Stack

### Frontend (React Native + Expo)
```json
{
  "dependencies": {
    "react-native": "^0.73.0",
    "expo": "^50.0.0",
    "expo-camera": "^14.0.0",
    "expo-location": "^16.0.0",
    "expo-notifications": "^0.26.0",
    "react-navigation": "^6.0.0",
    "@apollo/client": "^3.8.0",
    "tesseract.js": "^5.0.0",
    "idb": "^8.0.0",
    "react-native-voice": "^3.2.4"
  }
}
```

### Backend Integration
```typescript
// GraphQL Queries for Mobile
const GET_PORT_CALLS = gql`
  query GetMyPortCalls($agentId: String!) {
    portCalls(agentId: $agentId, status: ACTIVE) {
      id
      vessel { id name imo }
      port { id name country latitude longitude }
      eta
      etd
      status
      pda { id status estimatedTotal }
      fda { id status totalActual }
    }
  }
`;

const ADD_PDA_ITEM = gql`
  mutation AddPDAItem($input: PDAItemInput!) {
    addPDAItem(input: $input) {
      id
      category
      description
      amount
      currency
    }
  }
`;

const UPLOAD_INVOICE = gql`
  mutation UploadInvoice($file: Upload!, $pdaId: String!, $category: String!) {
    uploadInvoiceToFDA(file: $file, pdaId: $pdaId, category: $category) {
      id
      supplierName
      amount
      currency
      confidence
    }
  }
`;
```

---

## 2.6 Ship Agents App - 5-Month Roadmap

### Month 1: Core App Framework
- React Native + Expo setup
- Navigation structure
- Login & authentication
- Port call list view
- Offline storage (IndexedDB)

### Month 2: PDA Module
- PDA item entry form
- Voice input integration
- Quick add buttons (common charges)
- PDA summary view
- Send to owner functionality

### Month 3: FDA & Invoice Scanner
- Invoice camera capture
- OCR processing (Tesseract.js)
- AI extraction (@ankr/eon)
- FDA line item creation
- Photo gallery & management

### Month 4: Geolocation & Services
- GPS tracking
- Nearby services map
- Agent check-in/check-out
- Geofence notifications
- Service quote requests

### Month 5: Polish & Testing
- Offline sync refinement
- Performance optimization
- iOS/Android testing
- Beta launch (50 agents)
- App Store / Play Store submission

---

# 🏆 Priority 3: Email Intelligence Engine

## Executive Summary

**90% of maritime business happens via email**. Brokers, operators, agents, and charterers receive thousands of emails daily. The Email Intelligence Engine automates:

- **Email Classification**: 13 maritime-specific categories
- **Entity Extraction**: Vessels, ports, cargo, dates, rates
- **Smart Actions**: Auto-create port calls, voyages, charters
- **Universal Connectors**: MS 365, Google, IMAP/SMTP

---

## 3.1 Email Classification (13 Categories)

### Categories

1. **FIXTURE_OFFER**: Charter party offers, COA proposals
2. **POSITION_LIST**: Open tonnage, vessel availability
3. **CARGO_ENQUIRY**: Cargo seeking vessel, freight quotes
4. **PORT_CALL**: ETA/ETD updates, port operations
5. **PDA_FDA**: Port disbursement accounts
6. **BUNKER_QUOTE**: Bunker prices, delivery schedules
7. **LAYTIME_SOF**: Laytime calculations, statements of facts
8. **INVOICE**: Payment requests, invoices
9. **CLAIMS**: Demurrage claims, cargo claims
10. **COMPLIANCE**: Vetting reports, PSC inspections
11. **OPERATIONS**: Voyage instructions, weather routing
12. **CONTRACT**: Charter party agreements, amendments
13. **OTHER**: General correspondence

### Implementation

```typescript
// Email Classification Service
class EmailClassificationService {
  async classifyEmail(email: Email): Promise<EmailClassification> {
    // Use AI to classify email
    const prompt = `
Classify this maritime email into one of these categories:
FIXTURE_OFFER, POSITION_LIST, CARGO_ENQUIRY, PORT_CALL, PDA_FDA,
BUNKER_QUOTE, LAYTIME_SOF, INVOICE, CLAIMS, COMPLIANCE, OPERATIONS,
CONTRACT, OTHER

Email:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.body.substring(0, 1000)}

Return JSON: { category: string, confidence: number, reason: string }
    `;

    const response = await eonProxy.chat({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      responseFormat: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content);

    return {
      emailId: email.id,
      category: result.category,
      confidence: result.confidence,
      reason: result.reason,
      classifiedAt: new Date(),
    };
  }
}
```

---

## 3.2 Entity Extraction

### Entities to Extract

- **Vessels**: Names, IMO numbers
- **Ports**: Port names, UNLOCODE
- **Cargo**: Type, quantity, description
- **Dates**: ETA, ETD, laycan, cancelling
- **Rates**: Freight rates, hire rates
- **Companies**: Charterers, owners, operators
- **People**: Contacts, signatories

### Implementation

```typescript
class EntityExtractionService {
  async extractEntities(email: Email): Promise<ExtractedEntities> {
    const prompt = `
Extract maritime entities from this email:

${email.body}

Extract:
- vessels (array of {name, imo?})
- ports (array of {name, unlocode?})
- cargo (array of {type, quantity?, unit?})
- dates (array of {type, date}) where type is ETA, ETD, LAYCAN_START, LAYCAN_END, etc.
- rates (array of {type, amount, currency, unit}) where type is FREIGHT, HIRE, etc.
- companies (array of {name, role}) where role is CHARTERER, OWNER, etc.

Return JSON.
    `;

    const response = await eonProxy.chat({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      responseFormat: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content);
  }
}
```

---

## 3.3 Smart Actions & Workflows

### Auto-Create Port Call

```typescript
// When email is classified as PORT_CALL with high confidence
async function autoCreatePortCall(email: Email, entities: ExtractedEntities) {
  if (!entities.vessels?.length || !entities.ports?.length) {
    return null; // Missing required entities
  }

  // Find or create vessel
  const vessel = await findOrCreateVessel(entities.vessels[0]);

  // Find port
  const port = await findPort(entities.ports[0]);

  // Extract ETA/ETD
  const eta = entities.dates.find(d => d.type === 'ETA')?.date;
  const etd = entities.dates.find(d => d.type === 'ETD')?.date;

  // Create port call
  const portCall = await prisma.portCall.create({
    data: {
      vesselId: vessel.id,
      portId: port.id,
      eta: eta ? new Date(eta) : null,
      etd: etd ? new Date(etd) : null,
      status: 'SCHEDULED',
      sourceEmailId: email.id,
      createdBy: 'EMAIL_INTELLIGENCE',
    },
  });

  // Notify agent
  await notify({
    userId: getAssignedAgent(port.id),
    type: 'PORT_CALL_CREATED',
    message: `New port call created from email: ${vessel.name} to ${port.name}`,
    link: `/port-calls/${portCall.id}`,
  });

  return portCall;
}
```

---

## 3.4 Universal Email Connectors

### Microsoft 365 (Graph API)

```typescript
class Office365Connector {
  private accessToken: string;

  async connect(credentials: Office365Credentials): Promise<void> {
    // OAuth 2.0 flow
    const response = await axios.post(
      'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token',
      {
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        grant_type: 'authorization_code',
        code: credentials.authCode,
        redirect_uri: credentials.redirectUri,
        scope: 'https://graph.microsoft.com/Mail.Read',
      }
    );

    this.accessToken = response.data.access_token;
  }

  async fetchEmails(folderId: string = 'inbox', limit: number = 50): Promise<Email[]> {
    const response = await axios.get(
      `https://graph.microsoft.com/v1.0/me/mailFolders/${folderId}/messages`,
      {
        headers: { Authorization: `Bearer ${this.accessToken}` },
        params: {
          $top: limit,
          $select: 'id,subject,from,receivedDateTime,bodyPreview,body',
          $orderby: 'receivedDateTime desc',
        },
      }
    );

    return response.data.value.map(this.mapToEmail);
  }

  async sendEmail(email: OutgoingEmail): Promise<void> {
    await axios.post(
      'https://graph.microsoft.com/v1.0/me/sendMail',
      {
        message: {
          subject: email.subject,
          body: {
            contentType: 'HTML',
            content: email.body,
          },
          toRecipients: email.to.map(addr => ({
            emailAddress: { address: addr },
          })),
        },
      },
      {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      }
    );
  }
}
```

### Google (Gmail API)

```typescript
class GmailConnector {
  private gmail: any; // google.gmail

  async connect(credentials: GoogleCredentials): Promise<void> {
    const auth = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri
    );

    auth.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
    });

    this.gmail = google.gmail({ version: 'v1', auth });
  }

  async fetchEmails(limit: number = 50): Promise<Email[]> {
    const response = await this.gmail.users.messages.list({
      userId: 'me',
      maxResults: limit,
      labelIds: ['INBOX'],
    });

    const emails = await Promise.all(
      response.data.messages.map(async (msg: any) => {
        const detail = await this.gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full',
        });

        return this.mapToEmail(detail.data);
      })
    );

    return emails;
  }
}
```

### IMAP (Universal)

```typescript
import Imap from 'imap';

class IMAPConnector {
  private imap: Imap;

  async connect(config: IMAPConfig): Promise<void> {
    this.imap = new Imap({
      user: config.email,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.tls,
    });

    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => resolve());
      this.imap.once('error', reject);
      this.imap.connect();
    });
  }

  async fetchEmails(folderName: string = 'INBOX', limit: number = 50): Promise<Email[]> {
    return new Promise((resolve, reject) => {
      this.imap.openBox(folderName, true, (err, box) => {
        if (err) return reject(err);

        const fetch = this.imap.seq.fetch(`1:${Math.min(limit, box.messages.total)}`, {
          bodies: ['HEADER', 'TEXT'],
          struct: true,
        });

        const emails: Email[] = [];

        fetch.on('message', (msg, seqno) => {
          const email: Partial<Email> = { id: seqno.toString() };

          msg.on('body', (stream, info) => {
            let buffer = '';
            stream.on('data', chunk => { buffer += chunk.toString('utf8'); });
            stream.once('end', () => {
              if (info.which === 'HEADER') {
                const header = Imap.parseHeader(buffer);
                email.from = header.from?.[0];
                email.subject = header.subject?.[0];
                email.date = new Date(header.date?.[0]);
              } else {
                email.body = buffer;
              }
            });
          });

          msg.once('end', () => {
            emails.push(email as Email);
          });
        });

        fetch.once('end', () => {
          resolve(emails);
        });
      });
    });
  }
}
```

---

## 3.5 Email Intelligence Workflow

```
┌─────────────────────────────────────────────┐
│      Email Sources (Office 365, Gmail,     │
│      IMAP) - Fetch every 5 minutes          │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│   Email Classification (AI)                 │
│   • Determine category (13 types)           │
│   • Assign confidence score                 │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│   Entity Extraction (AI)                    │
│   • Extract vessels, ports, cargo, dates    │
│   • Extract rates, companies, people        │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│   Smart Actions (Conditional)               │
│   • Auto-create port calls (if PORT_CALL)   │
│   • Auto-create voyages (if FIXTURE_OFFER)  │
│   • Auto-create invoices (if INVOICE)       │
│   • Assign to user (based on category)      │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│   Notification & Routing                    │
│   • Notify assigned user                    │
│   • Add to relevant workspace               │
│   • Suggest next actions                    │
└─────────────────────────────────────────────┘
```

---

**(Continues with Priority 4: Load Matching Algorithm, Priority 5: Built-in CRM/ERP, Priority 6: Routing Engine V2, Priority 7: Mobile Strategy, Priority 8: RAG Enhancement...)**

**Total Document Length**: 80,000+ characters (will continue in next message due to length)

---

**Co-Authored-By**: Claude Sonnet 4.5 <noreply@anthropic.com>
**Status**: Part 1 of 2 (Priorities 1-3 Complete)
**Next**: Priorities 4-8 Deep Dive
