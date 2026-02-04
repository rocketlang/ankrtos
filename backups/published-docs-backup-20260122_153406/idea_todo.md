# ANKR LABS - Product Ideation & Strategy Document
**Owner:** Anil
**Created:** 2026-01-16
**Status:** Active Development
**Version:** 2.0

---

## Executive Summary

This document tracks all product ideas, commercialization strategies, and development priorities across the ANKR Labs ecosystem. The portfolio spans **40+ products** across logistics, compliance, voice AI, ERP, e-commerce, and developer tools.

**Total Addressable Market (TAM):** 500Cr - 1000Cr+

---

## Master Ideation Tracker

### Tier 1: Production Ready / High Priority

| ID | Product | Stage | Status | Revenue Potential | Next Action |
|----|---------|-------|--------|-------------------|-------------|
| 01 | **ComplyMitra** | MVP Ready | 🟡 Active | 50Cr+ | Stabilize DB schema, launch pilot |
| 02 | **WowTruck 2.0** | Production | 🟢 Live | 100Cr+ | Mobile app completion |
| 03 | **Fr8X** | Beta | 🟡 Active | 200Cr+ | Partnership pilots |
| 04 | **TrackBox v4** | Production | 🟢 Live | 30Cr+ | Cost analytics release |
| 05 | **Swayam/BANI** | Production | 🟢 Live | 50Cr+ | Enterprise integrations |
| 06 | **EverPure** | Production | 🟢 Live | 10Cr+ | B2B wholesale module |
| 07 | **DODD ERP** | Building | 🟡 Active | 100Cr+ | Core modules completion |

### Tier 2: High Impact / Feasible

| ID | Product | Stage | Status | Revenue Potential | Next Action |
|----|---------|-------|--------|-------------------|-------------|
| 08 | **ANKR-EON** | Building | 🟡 Active | 50Cr+ | Decision logging MVP |
| 09 | **AI Ops Manager** | Concept | 🔵 Planned | 80Cr+ | Pick vertical (cold chain) |
| 10 | **ComplyMitra Logistics** | Concept | 🔵 Planned | 30Cr+ | E-way bill automation |
| 11 | **Power ERP** | Active | 🟡 Active | 50Cr+ | Multi-tenant release |
| 12 | **FreightBox** | Production | 🟢 Live | 40Cr+ | Customs automation |

### Tier 3: Strategic / Long-term

| ID | Product | Stage | Status | Revenue Potential | Next Action |
|----|---------|-------|--------|-------------------|-------------|
| 13 | **Smart City AI** | Concept | 🔵 Planned | 500Cr+ | Govt relationship building |
| 14 | **Pratham (EdTech)** | Concept | 🔵 Planned | 100Cr+ | Market research |
| 15 | **Kuber (Finance AI)** | Concept | 🔵 Planned | 50Cr+ | User persona research |
| 16 | **Healthcare Admin AI** | Concept | 🔵 Planned | 80Cr+ | Domain expert interviews |
| 17 | **CodeRocket** | Active | 🟡 Active | 30Cr+ | RocketLang completion |

**Legend:** 🟢 Live | 🟡 Active Dev | 🔵 Planned | 🔴 Blocked

---

## SECTION 1: ComplyMitra Deep Dive

### Current State (ankr-compliance)
**Codebase:** `/home/ankr2/ankr-compliance`
**Status:** 12 sprints complete, 25K+ LOC, production-deployed

#### What's Built
- ✅ 38 YAML compliance rules (GST, TDS, MCA, EPF, ESI, PT, LWF, FEMA, EHS)
- ✅ Rule applicability engine (entity type, turnover, employees)
- ✅ Calendar generation (62+ items per company)
- ✅ 10+ filing wizards (GST, TDS, ITR, EPF, MCA, FEMA, EHS)
- ✅ AI engine for autonomous govt portal monitoring
- ✅ 59+ GraphQL endpoints
- ✅ 50+ Prisma models
- ✅ React dashboard with compliance score
- ✅ Mobile app structure (Expo)
- ✅ Professional marketplace (CA, CS, Lawyers)
- ✅ Multi-tenant RBAC

#### Critical Gaps to Address
| Gap | Priority | Effort | Impact |
|-----|----------|--------|--------|
| ComplianceScore table persistence | P0 | 2 days | High - enables trending |
| ComplianceAlert table & triggers | P0 | 3 days | High - proactive notifications |
| GSTIN live verification (Sandbox.co.in) | P0 | 3 days | High - trust factor |
| FilingRecord complete tracking | P1 | 2 days | Medium - audit trail |
| Mobile GraphQL integration | P1 | 5 days | High - user adoption |
| Push notifications (mobile/WhatsApp) | P1 | 3 days | High - engagement |
| Govt portal automation (GSTIN login) | P2 | 10 days | Very High - automation |

#### Enhancement Roadmap

**Phase 1: Foundation (Week 1-2)**
```
[ ] Complete FilingRecord table & queries
[ ] Create ComplianceScore table with daily calculation job
[ ] Create ComplianceAlert table with triggering logic
[ ] Add score trending (30/60/90-day comparison)
[ ] Write 20+ integration tests
```

**Phase 2: Intelligence (Week 3-4)**
```
[ ] Deploy AI engine autonomous monitoring
[ ] Implement rule change auto-approval workflow
[ ] Add predictive non-compliance scoring
[ ] Build compliance trend analysis
[ ] Create board-ready executive summaries
```

**Phase 3: Integration (Week 5-6)**
```
[ ] GSTIN live verification (Sandbox.co.in API)
[ ] PAN validation (Income Tax API)
[ ] CIN lookup (MCA21 API)
[ ] Complete Expo mobile app
[ ] Add push notifications (Firebase)
```

**Phase 4: Scale (Week 7-8)**
```
[ ] Multi-company bulk operations
[ ] Custom compliance frameworks
[ ] DPDP Act implementation
[ ] Vendor compliance module
[ ] White-label SaaS support
```

#### Commercialization Strategy

**Revenue Model:**
| Model | Target | Pricing | ACV |
|-------|--------|---------|-----|
| SaaS Subscription | SMBs | 999-4999/month | 12K-60K/yr |
| Filing Service Fees | All | 100-500/filing | Variable |
| CA Marketplace Commission | Professionals | 10-15% | Variable |
| Enterprise License | Large corps | Custom | 5L-25L/yr |

**GTM Strategy:**
1. **Channel 1:** CA/Accountant partnership network (10K CAs = 1L companies)
2. **Channel 2:** WhatsApp-first onboarding (low friction)
3. **Channel 3:** GST software integration (Tally, Zoho)
4. **Channel 4:** Industry association partnerships (FICCI, CII)

**Defensibility:**
- Regulatory data moat (38+ rules with daily updates)
- AI-powered rule change detection (competitors manual)
- Institutional memory (why decisions were made)
- Professional network effects (CA marketplace)

---

## SECTION 2: New Product Ideas (Beyond Listed)

### A. Logistics Intelligence Suite

#### A1. ComplyMitra for Logistics
**Problem:** Freight companies struggle with GST on services, E-way bills, IEC compliance
**Solution:** Specialized compliance module for logistics industry

**Features:**
- [ ] E-way bill auto-generation from trip data (WowTruck integration)
- [ ] GST reconciliation for freight services
- [ ] IEC code validation for international shipments
- [ ] DGFT compliance for export incentives
- [ ] Multi-state IGST handling
- [ ] Transporter ID management

**Integration:** WowTruck → ComplyMitra Logistics → Auto E-way bill
**Revenue:** 5K/month × 10K logistics companies = 50Cr/year

---

#### A2. Predictive Fleet Maintenance
**Problem:** Breakdowns cost 5-10L per incident, preventive maintenance is guesswork
**Solution:** ML model combining TrackBox telemetry + ANKR-EON precedent search

**Features:**
- [ ] Vibration pattern analysis from GPS data
- [ ] Historical failure correlation
- [ ] Predictive maintenance scheduling
- [ ] Auto-create work orders in WowTruck
- [ ] ROI dashboard (breakdowns prevented)

**Data Source:** TrackBox (5 years of trip data)
**Revenue:** 2K/month × 50K vehicles = 100Cr/year

---

#### A3. Lane Intelligence Platform
**Problem:** Shippers/carriers lack market rate visibility
**Solution:** Aggregate Fr8X quotes + TrackBox actual costs

**Features:**
- [ ] Real-time lane rate index (Mumbai-Delhi, Chennai-Bangalore, etc.)
- [ ] Seasonality analysis (festival, harvest seasons)
- [ ] Route profitability scoring
- [ ] Competitor rate benchmarking
- [ ] API for rate providers (Insurance, Banking)

**Moat:** Only platform with both quote data (Fr8X) AND actual cost data (TrackBox)
**Revenue:** API access 50K/month × 500 companies = 30Cr/year

---

#### A4. Driver Trust Score
**Problem:** Hiring drivers is risky, no standardized reputation system
**Solution:** Portable driver reputation across ecosystem

**Features:**
- [ ] On-time delivery rate
- [ ] Safety score (harsh braking, overspeeding)
- [ ] Damage incidents
- [ ] Client ratings
- [ ] Document verification status
- [ ] Cross-platform portability (WowTruck ↔ Fr8X)

**Integration:** TrackBox behavior data + WowTruck trip outcomes
**Revenue:** Freemium for drivers, premium for fleet operators

---

### B. Voice-First Enterprise Suite

#### B1. Voice-First ERP (DODD + Swayam)
**Problem:** Blue-collar workers can't use complex ERP interfaces
**Solution:** Voice commands for common ERP operations

**Use Cases:**
```
"Create invoice for Sharma ji, 50,000 rupees" → Auto-posts to ledger
"What's pending today?" → Spoken task list
"Mark order 4532 as shipped" → Updates order status
"Monthly P&L batao" → Spoken financial summary
"Add 100 units of SKU-789 to inventory" → Stock update
```

**Languages:** Hindi, English, Tamil, Telugu, Marathi (via BANI)
**Integration:** DODD/Power-ERP → Swayam WebSocket → Voice I/O
**Revenue:** 2K-5K/month × 100K micro-businesses = 200-500Cr potential

---

#### B2. Voice Dispatch System
**Problem:** Dispatchers juggle phones, WhatsApp, systems simultaneously
**Solution:** Voice-controlled dispatch interface

**Commands:**
```
"Assign trip 4521 to Raju" → Driver assignment
"What's the status of vehicle MH-04-AB-1234?" → Live tracking
"Alert: Delay on Pune route" → Push to stakeholders
"Find available truck near Nagpur" → Capacity search
```

**Integration:** WowTruck dispatch → Swayam → Voice + Push notifications
**Revenue:** Premium WowTruck tier: 10K/month × 5K dispatchers = 50Cr/year

---

#### B3. Voice Compliance Assistant
**Problem:** SMB owners don't understand compliance jargon
**Solution:** WhatsApp/Voice bot that explains compliance in simple language

**Interactions:**
```
User: "GST date kab hai?"
Bot: "Aapka GSTR-3B 20 January tak file karna hai. Penalty 50/day hogi late ke liye."

User: "EPF amount kitna hai?"
Bot: "December ke liye EPF contribution 45,000 hai. 15 January deadline hai."

User: "TDS kaise file karu?"
Bot: "Main aapko step-by-step guide bhejta hun WhatsApp par."
```

**Integration:** ComplyMitra rules → BANI voice → WhatsApp API
**Revenue:** Freemium (basic queries) + Premium (filing assistance)

---

### C. Vertical ERP Solutions

#### C1. Cold Chain DODD
**Problem:** Cold chain needs temperature compliance + FSSAI
**Solution:** DODD variant with cold chain specifics

**Features:**
- [ ] Temperature monitoring integration (IoT sensors)
- [ ] Cold storage slot management
- [ ] FSSAI compliance tracking
- [ ] Batch traceability (farm to fork)
- [ ] Automated temperature alerts
- [ ] Regulatory reports

**Integration:** TrackBox reefer monitoring + DODD inventory
**Revenue:** 10K/month × 5K cold chain companies = 50Cr/year

---

#### C2. Pharma DODD
**Problem:** Pharma needs batch/serial tracking, GST reverse charge, drug license compliance
**Solution:** DODD with pharma-specific modules

**Features:**
- [ ] Batch/Lot tracking (mandatory)
- [ ] Drug license management
- [ ] Controlled substance tracking
- [ ] Expiry management with auto-FIFO
- [ ] GST reverse charge for B2B
- [ ] CDSCO compliance

**Regulatory:** Drug License, GST, Schedule H compliance
**Revenue:** 15K/month × 10K pharma distributors = 150Cr/year

---

#### C3. Manufacturing DODD
**Problem:** Factories need production planning + compliance (Factory Act, pollution)
**Solution:** DODD with MRP/production modules

**Features:**
- [ ] BOM (Bill of Materials) management
- [ ] Work order scheduling
- [ ] Machine maintenance tracking
- [ ] Factory Act compliance
- [ ] PCB (Pollution Control Board) submissions
- [ ] Labour law dashboards

**Integration:** Power-ERP manufacturing + ComplyMitra EHS
**Revenue:** 20K/month × 50K factories = 1000Cr market

---

### D. Financial Intelligence

#### D1. Logistics Invoice Financing
**Problem:** Truckers wait 60-90 days for payment, cash flow crunch
**Solution:** Invoice factoring with risk scoring from ecosystem data

**How it works:**
1. Transporter completes trip in WowTruck
2. Invoice generated with POD
3. Risk score calculated (payment history, route reliability, client credit)
4. Instant financing at 1.5-2% discount
5. Collection handled by platform

**Data Advantage:**
- Trip completion rate (TrackBox)
- Client payment history (WowTruck)
- Driver reliability (ANKR-EON)

**Revenue:** 2% commission on 500Cr annual financing = 10Cr/year
**Scale:** Grow to 5000Cr = 100Cr/year

---

#### D2. Fleet Insurance Intelligence
**Problem:** Fleet insurance is expensive, no usage-based pricing
**Solution:** Telematics-based insurance scoring

**Features:**
- [ ] Driver behavior scoring (TrackBox data)
- [ ] Route risk assessment
- [ ] Real-time premium adjustment
- [ ] Claim automation with GPS proof
- [ ] Insurance marketplace

**Partnership:** Insurance companies pay for risk data
**Revenue:** 500/vehicle/year × 500K vehicles = 25Cr/year

---

#### D3. Kuber - SMB Financial Guardian
**Problem:** Small business owners are financially blind
**Solution:** AI that monitors cash flow and alerts proactively

**Features:**
- [ ] Bank account aggregation (via Account Aggregator)
- [ ] Cash flow prediction (7/30/90 days)
- [ ] GST liability forecasting
- [ ] Expense anomaly detection
- [ ] Investment suggestions
- [ ] Tax planning assistant

**Integration:** DODD accounting → Kuber analysis → Alerts
**Revenue:** Freemium + Premium (999/month) × 100K users = 12Cr/year

---

### E. Platform & Infrastructure

#### E1. ANKR-EON as Platform
**Problem:** Every product needs decision memory, but building separately
**Solution:** EON as shared infrastructure across all products

**Use Cases by Product:**
| Product | EON Usage |
|---------|-----------|
| ComplyMitra | "Have we filed this before? What was the penalty?" |
| WowTruck | "Has this shipper defaulted before?" |
| Fr8X | "What rate did we quote last time for this lane?" |
| DODD | "Why did we choose this vendor over others?" |

**Technical:**
- Episodic memory: What happened when
- Semantic memory: Facts & relationships
- Procedural memory: How to do things

**Revenue:** Platform fee: 0.5% of transactions touched by EON
**Scale:** 1000Cr transactions × 0.5% = 5Cr/year

---

#### E2. AI Gateway as Service
**Problem:** Every product needs LLM access, costs are unpredictable
**Solution:** Centralized AI router with cost management

**Features:**
- [ ] Multi-provider routing (Anthropic, OpenAI, Groq, Gemini)
- [ ] Automatic failover
- [ ] Cost optimization (route to cheapest for non-critical)
- [ ] Rate limiting per tenant
- [ ] Usage analytics
- [ ] Prompt caching

**Internal Use:** All ANKR products route through AI Gateway
**External Revenue:** API access for external developers

---

#### E3. White-Label SaaS Platform
**Problem:** CA firms want their own branded compliance tool
**Solution:** ComplyMitra white-label with custom theming

**Features:**
- [ ] Custom domain (compliance.cafirm.com)
- [ ] Branded emails
- [ ] Custom logo/colors
- [ ] Sub-accounts for CA's clients
- [ ] Revenue share model

**Revenue:** 25K/month base + 20% revenue share
**Target:** 1000 CA firms × 25K = 30Cr/year base

---

### F. Smart City & GovTech

#### F1. Traffic Intelligence Platform
**Problem:** Cities have CCTV but no actionable insights
**Solution:** AI-powered traffic analysis from existing cameras

**Features:**
- [ ] Vehicle counting and classification
- [ ] Congestion prediction (30 min ahead)
- [ ] Accident detection and alerts
- [ ] Illegal parking identification
- [ ] Traffic signal optimization suggestions

**Data Source:** Municipal CCTV feeds + Google Maps API
**Revenue:** Govt contracts: 1Cr/city × 100 cities = 100Cr potential

---

#### F2. Public Grievance AI
**Problem:** Citizen complaints take weeks to resolve
**Solution:** AI triage and routing for municipal complaints

**Features:**
- [ ] WhatsApp/Voice complaint intake
- [ ] Auto-categorization (water, electricity, roads, sanitation)
- [ ] Priority scoring
- [ ] Department routing
- [ ] Status tracking
- [ ] Citizen feedback loop

**Integration:** Swayam voice → Grievance classification → Dept routing
**Revenue:** SaaS to municipalities: 5L/month × 500 municipalities = 30Cr/year

---

### G. Education & Skilling

#### G1. Pratham - Personalized Learning OS
**Problem:** One-size-fits-all education fails
**Solution:** AI that adapts to individual learning patterns

**Features:**
- [ ] Weakness detection from test performance
- [ ] Custom question generation
- [ ] Adaptive difficulty
- [ ] Regional language support (via BANI)
- [ ] Exam board alignment (CBSE, ICSE, State)
- [ ] Parent dashboard

**Differentiation:** Voice-first (Swayam) + Regional languages
**Revenue:** B2C: 200/month × 1M students = 24Cr/year
**B2B:** School licenses: 50K/year × 10K schools = 50Cr/year

---

#### G2. Driver Skilling Platform
**Problem:** Driver shortage + no standardized training
**Solution:** Mobile-first driver training with certification

**Features:**
- [ ] Video lessons (regional languages)
- [ ] Quiz assessments
- [ ] Driving simulation (basic)
- [ ] Certification (industry recognized)
- [ ] Job placement (Fr8X/WowTruck integration)

**Partnership:** Logistics companies sponsor training
**Revenue:** 500/driver × 1M drivers/year = 50Cr/year

---

## SECTION 3: Commercialization Matrix

### Revenue Model Comparison

| Product | Model | ACV Range | Sales Cycle | CAC | LTV | LTV:CAC |
|---------|-------|-----------|-------------|-----|-----|---------|
| ComplyMitra | SaaS + Filing | 12K-60K | 2-4 weeks | 3K | 150K | 50:1 |
| WowTruck | SaaS + Transaction | 60K-300K | 1-3 months | 20K | 500K | 25:1 |
| Fr8X | Marketplace | 100K-1000K | 3-6 months | 50K | 2000K | 40:1 |
| TrackBox | SaaS | 24K-120K | 2-4 weeks | 5K | 200K | 40:1 |
| DODD ERP | License + SaaS | 120K-600K | 2-6 months | 30K | 800K | 27:1 |
| EverPure | E-commerce | Variable | Instant | 200 | 5K | 25:1 |
| Voice AI (B2B) | API + SaaS | 60K-300K | 1-3 months | 15K | 400K | 27:1 |

### Pricing Strategy by Segment

**SMB (< 5Cr turnover):**
- Freemium entry, paid at 999-2999/month
- WhatsApp-first onboarding
- Self-serve with chat support

**Mid-Market (5-100Cr turnover):**
- 5K-25K/month
- Dedicated onboarding
- Phone + email support

**Enterprise (> 100Cr turnover):**
- Custom pricing (5L-50L/year)
- On-premise option
- Dedicated success manager
- SLA guarantees

### GTM Channel Strategy

| Channel | Products | Investment | Expected CAC |
|---------|----------|------------|--------------|
| CA Network | ComplyMitra | Low | 2K |
| Industry Events | WowTruck, Fr8X | Medium | 30K |
| WhatsApp Marketing | All SMB products | Low | 500 |
| LinkedIn Outbound | Enterprise products | Medium | 15K |
| Govt Tenders | Smart City, GovTech | High | 100K |
| Referral Program | All | Low | 1K |

---

## SECTION 4: Competitive Advantage Analysis

### Unique Moats

| Moat Type | Description | Products Benefiting |
|-----------|-------------|---------------------|
| **Data Network Effect** | More users = better rates/predictions | Fr8X, TrackBox, Lane Intelligence |
| **Regulatory Knowledge** | 38+ rules, daily govt monitoring | ComplyMitra |
| **Voice AI (11 languages)** | No competitor has this | All products |
| **Integrated Stack** | Ops + ERP + Compliance together | All products |
| **Institutional Memory** | ANKR-EON captures "why" decisions | All products |
| **Geographic Data** | 5 years of Indian logistics data | TrackBox, WowTruck |

### Competitive Landscape

| Competitor | Domain | Our Advantage |
|------------|--------|---------------|
| ClearTax | GST Compliance | Full compliance (not just GST), AI monitoring |
| Zoho Books | Accounting | Voice-first, logistics-native |
| Blackbuck | Logistics | Integrated compliance + ERP |
| Rivigo | Freight | Multi-modal + marketplace |
| Tally | Accounting | Modern stack, cloud-native |
| SAP | ERP | 10x cheaper, India-first |

---

## SECTION 5: Scoring & Prioritization

### Evaluation Criteria (Score 1-5)

| Criteria | ComplyMitra | AI Ops | EON | WowTruck | Fr8X | DODD |
|----------|-------------|--------|-----|----------|------|------|
| Market Size | 5 | 4 | 3 | 5 | 5 | 4 |
| Pain Intensity | 5 | 4 | 3 | 5 | 4 | 4 |
| Willingness to Pay | 4 | 5 | 4 | 5 | 4 | 4 |
| Technical Feasibility | 4 | 3 | 4 | 5 | 4 | 4 |
| Time to Revenue | 4 | 3 | 3 | 5 | 3 | 3 |
| Defensibility | 4 | 4 | 5 | 4 | 4 | 3 |
| Domain Expertise | 4 | 5 | 5 | 5 | 5 | 4 |
| Synergy Potential | 5 | 4 | 5 | 5 | 5 | 5 |
| **TOTAL** | **35** | **32** | **32** | **39** | **34** | **31** |

### Priority Stack Rank

1. **WowTruck 2.0** - Already live, highest score, direct revenue
2. **ComplyMitra** - Highest untapped potential, quick to market
3. **Fr8X** - Large TAM, network effects
4. **EON** - Platform play, benefits all products
5. **AI Ops Manager** - High enterprise value
6. **DODD** - Long-term ERP play

---

## SECTION 6: Weekly Review & Tracking

### Review Checklist (Every Monday)

- [ ] Update product stages in tracker
- [ ] Log customer conversations and insights
- [ ] Review competitive landscape changes
- [ ] Update priority based on new data
- [ ] Identify blockers for top 3 ideas
- [ ] Track revenue/pipeline metrics
- [ ] Plan week's development focus

### Key Metrics to Track

| Metric | Current | Target (Q1) | Target (Q2) |
|--------|---------|-------------|-------------|
| ComplyMitra Pilots | 0 | 10 | 50 |
| WowTruck MAU | TBD | +20% | +50% |
| Fr8X Registered Carriers | TBD | 500 | 2000 |
| Monthly Recurring Revenue | TBD | 5L | 20L |
| CA Partners | 0 | 50 | 200 |

---

## SECTION 7: Brainstorming Log

### 2026-01-16 (Initial Deep Dive)
- Comprehensive ecosystem analysis completed
- Identified 40+ products across portfolio
- ComplyMitra: Production-ready with critical gaps (DB schema, Govt APIs)
- New synergy ideas: ComplyMitra Logistics, Voice-First ERP, Lane Intelligence
- Prioritized WowTruck, ComplyMitra, Fr8X as top 3

### Ideas for Next Session
- [ ] Deep dive: ComplyMitra pilot customer profile
- [ ] Deep dive: Fr8X partnership model
- [ ] Technical: ANKR-EON architecture finalization
- [ ] Commercial: Invoice financing NBFC partnership

---

## SECTION 8: Quick Capture

| Date | Raw Idea | Domain | Priority | Status |
|------|----------|--------|----------|--------|
| 2026-01-16 | E-way bill automation for logistics | ComplyMitra | P0 | Planned |
| 2026-01-16 | Voice dispatch for WowTruck | Voice AI | P1 | Planned |
| 2026-01-16 | Lane rate API for insurance | TrackBox | P2 | Concept |
| 2026-01-16 | Driver trust score (cross-platform) | Platform | P1 | Concept |
| 2026-01-16 | Cold Chain DODD variant | ERP | P2 | Concept |
| | | | | |

---

## SECTION 9: Resources & Links

### Internal Documentation
- `/home/ankr2/ankr-compliance/CLAUDE.md` - ComplyMitra dev guide
- `/home/ankr2/ankr-compliance/docs/` - Compliance framework docs
- `/home/ankr2/fr8x/ankr-labs-nx/` - Main monorepo
- `/home/ankr2/dodd/` - ERP documentation

### External References
- [ ] GST Portal APIs: https://services.gst.gov.in
- [ ] MCA21 APIs: https://www.mca.gov.in
- [ ] EPFO APIs: https://www.epfindia.gov.in
- [ ] Sandbox.co.in (Verification APIs)
- [ ] Sarvam AI (Voice): https://sarvam.ai

### Competitor Analysis
- [ ] ClearTax: https://cleartax.in
- [ ] Zoho Books: https://zoho.com/books
- [ ] Blackbuck: https://blackbuck.com
- [ ] Freight Tiger: https://freighttiger.com

---

*Last Updated: 2026-01-16*
*Next Review: 2026-01-23*
