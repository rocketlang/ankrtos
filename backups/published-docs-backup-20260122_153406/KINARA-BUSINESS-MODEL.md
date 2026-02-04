# Kinara - Business Model

> Revenue model and pricing for the Kinara platform

---

## Tags
`Business` `Pricing` `Customers` `Revenue` `Planning`

---

## Business Model Overview

Kinara is a **B2B Technology Platform** providing infrastructure for women's health solutions.

```
┌─────────────────────────────────────────────────────────────────┐
│                    BUSINESS MODEL CANVAS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  VALUE PROPOSITION                                              │
│  ═══════════════════                                            │
│  "Enable any company to add women's health capabilities         │
│   without building the tech from scratch"                       │
│                                                                 │
│  • Plug-and-play sensor integration                             │
│  • Pre-trained ML models                                        │
│  • DPDP-compliant data infrastructure                           │
│  • White-label components                                       │
│  • Hardware reference designs                                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CUSTOMER SEGMENTS                                              │
│  ═══════════════════                                            │
│                                                                 │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│  │ Healthcare│ │  Wellness │ │ Corporate │ │  Hardware │       │
│  │ Providers │ │   Brands  │ │  Wellness │ │    OEMs   │       │
│  │           │ │           │ │           │ │           │       │
│  │ Hospitals │ │ Gynoveda  │ │ Employee  │ │  Noise    │       │
│  │ Clinics   │ │ Kapiva    │ │ Benefits  │ │  Boat     │       │
│  │ Diagnostic│ │ Startups  │ │ Platforms │ │  New Cos  │       │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
│                                                                 │
│  + Insurance (Future) + Pharma (Future)                         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  REVENUE STREAMS                                                │
│  ═══════════════                                                │
│                                                                 │
│  1. Platform SaaS (Monthly/Annual)      │  60%                  │
│  2. Usage-Based (API calls, storage)    │  15%                  │
│  3. Licensing (SDKs, ML models)         │  15%                  │
│  4. Hardware Royalties                  │   5%                  │
│  5. Professional Services               │   5%                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pricing Tiers

### Platform Subscription

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRICING TIERS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  STARTER                               ₹25,000/month     │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │  For: Early-stage startups, pilots                       │   │
│  │                                                          │   │
│  │  ✓ 1,000 active users                                    │   │
│  │  ✓ 50,000 API calls/month                                │   │
│  │  ✓ 5GB data storage                                      │   │
│  │  ✓ Basic sensor SDK (BLE)                                │   │
│  │  ✓ Hot flash prediction API                              │   │
│  │  ✓ Email support                                         │   │
│  │                                                          │   │
│  │  Overage: ₹25/1000 users, ₹0.10/1000 API calls           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  GROWTH                                ₹75,000/month     │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │  For: Growing companies, multiple products               │   │
│  │                                                          │   │
│  │  ✓ 10,000 active users                                   │   │
│  │  ✓ 500,000 API calls/month                               │   │
│  │  ✓ 50GB data storage                                     │   │
│  │  ✓ Full sensor SDK (BLE + HealthKit + Health Connect)    │   │
│  │  ✓ All ML models (hot flash, sleep, triggers)            │   │
│  │  ✓ Insights & Analytics API                              │   │
│  │  ✓ White-label UI components                             │   │
│  │  ✓ Priority email + chat support                         │   │
│  │  ✓ Monthly review call                                   │   │
│  │                                                          │   │
│  │  Overage: ₹20/1000 users, ₹0.08/1000 API calls           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ENTERPRISE                            Custom Pricing    │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │  For: Large organizations, custom requirements           │   │
│  │                                                          │   │
│  │  ✓ Unlimited users                                       │   │
│  │  ✓ Unlimited API calls                                   │   │
│  │  ✓ Unlimited storage                                     │   │
│  │  ✓ All features in Growth +                              │   │
│  │  ✓ Custom ML model training                              │   │
│  │  ✓ On-premise deployment option                          │   │
│  │  ✓ Dedicated account manager                             │   │
│  │  ✓ SLA guarantee (99.9% uptime)                          │   │
│  │  ✓ Security audit & compliance reports                   │   │
│  │  ✓ Custom integrations                                   │   │
│  │                                                          │   │
│  │  Starting: ₹3,00,000/month                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Usage-Based Pricing

| Resource | Included (Growth) | Overage Rate |
|----------|-------------------|--------------|
| API Calls | 500K/month | ₹0.08/1000 |
| Data Storage | 50GB | ₹50/GB/month |
| ML Predictions | 100K/month | ₹0.50/1000 |
| Real-time Connections | 1,000 | ₹5/1000/month |
| Data Export | 10GB/month | ₹100/GB |

### Licensing (One-Time + Annual)

| License | One-Time | Annual Renewal | Notes |
|---------|----------|----------------|-------|
| Mobile SDK | ₹2,00,000 | ₹50,000 | React Native / Native |
| Embedded SDK | ₹3,00,000 | ₹75,000 | C/Zephyr for devices |
| Edge ML Models | ₹5,00,000 | ₹1,00,000 | TFLite models |
| White-Label App | ₹15,00,000 | ₹3,00,000 | Full branded app |
| Content Library | ₹1,00,000 | ₹25,000 | 100+ articles |

### Hardware Partner Program

| Component | Fee |
|-----------|-----|
| Certification | ₹50,000 (one-time) |
| Annual Partner Fee | ₹1,00,000/year |
| Per-Device Royalty | ₹50-100/unit |
| Reference Design License | ₹5,00,000 |

---

## Customer Economics

### Unit Economics (Per Customer)

```
┌─────────────────────────────────────────────────────────────────┐
│                   UNIT ECONOMICS                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GROWTH TIER CUSTOMER (Typical)                                 │
│  ════════════════════════════════                               │
│                                                                 │
│  Revenue:                                                       │
│  ├── Platform fee          ₹75,000/month                        │
│  ├── Usage overage         ₹15,000/month (avg)                  │
│  ├── SDK license (amort)   ₹8,333/month                         │
│  └── Total MRR             ₹98,333/month                        │
│                                                                 │
│  Costs:                                                         │
│  ├── Infrastructure        ₹8,000/month (~8%)                   │
│  ├── Support allocation    ₹5,000/month (~5%)                   │
│  └── Total COGS            ₹13,000/month                        │
│                                                                 │
│  Gross Margin:             ₹85,333/month (87%)                  │
│                                                                 │
│  Customer Acquisition:                                          │
│  ├── Sales cycle           3-6 months                           │
│  ├── CAC                   ₹2,50,000                            │
│  └── Payback period        3 months                             │
│                                                                 │
│  Lifetime Value:                                                │
│  ├── Avg lifetime          36 months                            │
│  ├── LTV                   ₹30,72,000                           │
│  └── LTV:CAC ratio         12.3x                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Customer Segmentation Value

| Segment | Avg ACV | Sales Cycle | LTV | Support Need |
|---------|---------|-------------|-----|--------------|
| Healthcare | ₹25-50L | 6-12 months | High | Medium |
| Wellness Brands | ₹10-25L | 3-6 months | Medium | Low |
| Corporate | ₹30-75L | 6-9 months | High | High |
| Hardware OEMs | ₹15-30L | 3-6 months | Medium | Medium |

---

## Revenue Projections

### 5-Year Financial Model

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         5-YEAR REVENUE PROJECTIONS                               │
├────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┬────────┤
│                │  Year 1  │  Year 2  │  Year 3  │  Year 4  │  Year 5  │ Notes  │
├────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┼────────┤
│ CUSTOMERS      │          │          │          │          │          │        │
│ Healthcare     │        3 │       12 │       30 │       60 │      100 │        │
│ Wellness       │        5 │       20 │       50 │      100 │      180 │        │
│ Corporate      │        2 │        8 │       25 │       50 │       80 │        │
│ Hardware OEMs  │        1 │        5 │       15 │       30 │       50 │        │
│ Insurance/Phar │        - │        2 │        5 │       12 │       25 │        │
│ Total          │       11 │       47 │      125 │      252 │      435 │        │
├────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┼────────┤
│ REVENUE (₹L)   │          │          │          │          │          │        │
│ Platform SaaS  │       36 │      180 │      600 │    1,500 │    3,200 │ 60%    │
│ Usage-Based    │        6 │       45 │      180 │      500 │    1,100 │ 15%    │
│ Licensing      │       25 │      100 │      300 │      700 │    1,200 │ 15%    │
│ Hardware       │        3 │       25 │      100 │      400 │    1,000 │  5%    │
│ Services       │       10 │       50 │      120 │      300 │      500 │  5%    │
├────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┼────────┤
│ TOTAL REVENUE  │       80 │      400 │    1,300 │    3,400 │    7,000 │        │
│ Growth %       │        - │     400% │     225% │     162% │     106% │        │
├────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┼────────┤
│ COSTS (₹L)     │          │          │          │          │          │        │
│ Team           │       80 │      220 │      450 │      850 │    1,400 │        │
│ Infrastructure │       12 │       40 │      100 │      250 │      500 │        │
│ Sales/Mktg     │       25 │      100 │      250 │      500 │      900 │        │
│ R&D/Hardware   │       30 │       60 │      100 │      150 │      250 │        │
│ Other          │       13 │       30 │      100 │      200 │      350 │        │
├────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┼────────┤
│ TOTAL COSTS    │      160 │      450 │    1,000 │    1,950 │    3,400 │        │
├────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┼────────┤
│ EBITDA         │      -80 │      -50 │      300 │    1,450 │    3,600 │        │
│ EBITDA %       │    -100% │     -13% │      23% │      43% │      51% │        │
├────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┼────────┤
│ End Users      │   10,000 │   80,000 │  300,000 │  800,000 │1,500,000 │ via B2B│
└────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┴────────┘
```

### Revenue Mix Evolution

```
Year 1                          Year 5
┌─────────────────────┐        ┌─────────────────────┐
│ Platform     45%    │        │ Platform     46%    │
│ Licensing    31%    │   →    │ Usage        16%    │
│ Services     13%    │        │ Licensing    17%    │
│ Usage         8%    │        │ Hardware     14%    │
│ Hardware      3%    │        │ Services      7%    │
└─────────────────────┘        └─────────────────────┘
```

---

## Go-To-Market Strategy

### Sales Motion

```
┌─────────────────────────────────────────────────────────────────┐
│                    SALES FUNNEL                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AWARENESS                                                      │
│  ───────────                                                    │
│  • Content marketing (blog, case studies)                       │
│  • Conference speaking (healthcare IT, FemTech)                 │
│  • Developer community (docs, tutorials)                        │
│  • LinkedIn thought leadership                                  │
│           │                                                     │
│           ▼                                                     │
│  INTEREST                                                       │
│  ─────────                                                      │
│  • Free tier / sandbox access                                   │
│  • Technical webinars                                           │
│  • ROI calculator                                               │
│  • Demo requests                                                │
│           │                                                     │
│           ▼                                                     │
│  EVALUATION                                                     │
│  ───────────                                                    │
│  • POC / Pilot (3-month, subsidized)                            │
│  • Technical deep-dive                                          │
│  • Reference calls                                              │
│  • Security review                                              │
│           │                                                     │
│           ▼                                                     │
│  DECISION                                                       │
│  ─────────                                                      │
│  • Proposal / Pricing                                           │
│  • Contract negotiation                                         │
│  • Procurement process                                          │
│           │                                                     │
│           ▼                                                     │
│  ONBOARDING                                                     │
│  ───────────                                                    │
│  • Technical integration                                        │
│  • Training                                                     │
│  • Go-live support                                              │
│           │                                                     │
│           ▼                                                     │
│  EXPANSION                                                      │
│  ──────────                                                     │
│  • Upsell (higher tier, more features)                          │
│  • Cross-sell (additional modules)                              │
│  • Referrals                                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Customer Acquisition Channels

| Channel | Investment | Expected Customers Y1 | CAC |
|---------|------------|----------------------|-----|
| Direct Sales | ₹25L | 5 | ₹5L |
| Partnerships | ₹10L | 3 | ₹3.3L |
| Inbound (Content) | ₹10L | 2 | ₹5L |
| Events/Conferences | ₹5L | 1 | ₹5L |

---

## Competitive Pricing Analysis

```
┌─────────────────────────────────────────────────────────────────┐
│                 COMPETITIVE PRICING                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  COMPETITOR          │  PRICING MODEL    │  COMPARABLE COST     │
│  ════════════════════│══════════════════│═════════════════════ │
│  Build In-House      │  Team + Infra    │  ₹1-2 Cr/year        │
│  (3-person team)     │                  │  + 12-18 month delay │
│                      │                  │                      │
│  Global Platform     │  Enterprise only │  ₹50L-1Cr/year       │
│  (Elektra, etc.)     │                  │  + US-centric        │
│                      │                  │                      │
│  Generic Health API  │  Per-user/call   │  ₹20-40L/year        │
│  (not specialized)   │                  │  + no menopause ML   │
│                      │                  │                      │
│  KINARA              │  Tiered SaaS     │  ₹9-36L/year         │
│                      │                  │  + India-optimized   │
│                      │                  │  + Full stack        │
│                                                                 │
│  VALUE PROPOSITION: 50-70% cost savings vs alternatives         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Financial Milestones

### Path to Profitability

| Milestone | Target | Revenue | Team Size |
|-----------|--------|---------|-----------|
| MVP Launch | Month 6 | - | 4 |
| First Paying Customer | Month 8 | ₹3L MRR | 5 |
| 10 Customers | Month 15 | ₹15L MRR | 10 |
| Break-Even | Month 24 | ₹40L MRR | 18 |
| Profitability | Month 30 | ₹80L MRR | 25 |

### Funding Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    FUNDING ROADMAP                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CURRENT: BOOTSTRAPPED                                          │
│  ═════════════════════                                          │
│  • Personal investment: Up to ₹10L                              │
│  • Timeline: Months 1-12                                        │
│  • Goal: MVP + 5 paying customers                               │
│                                                                 │
│  IF NEEDED: SEED ROUND                                          │
│  ══════════════════════                                         │
│  • Amount: ₹2-4 Cr                                              │
│  • Timeline: Month 12-15                                        │
│  • Use: Team expansion, sales, hardware                         │
│  • Target investors:                                            │
│    - HealthQuad, Stellaris (Healthcare)                         │
│    - Kalaari (FemTech - invested in Mylo)                       │
│    - Fireside, DSG (Consumer)                                   │
│    - Aavishkaar (Impact)                                        │
│                                                                 │
│  OPTIONAL: SERIES A                                             │
│  ═══════════════════                                            │
│  • Amount: ₹20-40 Cr                                            │
│  • Timeline: Month 24-30                                        │
│  • Use: Scale, international, M&A                               │
│  • Only if: Large opportunity validated                         │
│                                                                 │
│  PREFERENCE: Stay bootstrapped as long as possible              │
│  • Better economics                                             │
│  • Full control                                                 │
│  • Sustainable growth                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Metrics to Track

### North Star Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| End User Lives Improved | Users with measurable symptom reduction | 100K by Year 3 |
| Platform MRR | Monthly recurring revenue | ₹1Cr by Month 30 |
| NRR | Net Revenue Retention | >120% |

### Operational Metrics

| Category | Metric | Target |
|----------|--------|--------|
| **Growth** | MRR Growth Rate | >15%/month early |
| **Growth** | New Customers/Quarter | 5+ |
| **Retention** | Logo Churn | <5%/year |
| **Retention** | Net Revenue Retention | >120% |
| **Efficiency** | CAC Payback | <6 months |
| **Efficiency** | LTV:CAC | >5x |
| **Product** | API Uptime | 99.9% |
| **Product** | NPS | >50 |

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Slow enterprise sales | High | High | Focus on SMB, self-serve |
| Competition from global players | Medium | High | India specialization, pricing |
| Regulatory changes | Low | Medium | Compliance-first design |
| Key customer concentration | Medium | Medium | Diversify customer base |
| Technical challenges | Medium | Medium | Proven tech stack |

---

## Summary

- **Model**: B2B SaaS platform with usage and licensing
- **Target**: ₹7Cr ARR by Year 5
- **Path**: Bootstrap → Optional Seed → Profitability
- **Advantage**: India-first, frugal, full-stack, specialized

---

*Building sustainable business, improving women's lives*
