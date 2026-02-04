# ankrBFC + Swayam Integration Todo List

**Version:** 1.0.0
**Last Updated:** January 2026
**Author:** ANKR Labs

---

## Executive Summary

This document outlines the completed enhancements, pending recommendations, and enterprise features for the ankrBFC (Banking Finance Customer) platform integrated with Swayam (Voice-First AI Assistant).

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    CONSUMER ↔ BUSINESS FLOW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   SWAYAM (B2C)                        ankrBFC (B2B)            │
│   ────────────                        ─────────────             │
│   • Voice AI in 11 languages          • Bank/Insurer Dashboard │
│   • Financial intents capture         • Risk Signals API       │
│   • Episode recording                 • Lead Generation        │
│   • Gamification engine               • Churn Prediction       │
│   • Setu AA integration               • Market Intelligence    │
│                                                                 │
│            ↓ Behavioral Data (Anonymized) ↓                    │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │              ANKR INTELLIGENCE CORE                      │  │
│   │   EON Memory │ AI Proxy │ pgvector │ Complymitra        │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Completed Enhancements

### 1. Financial Intent Classification

**File:** `/root/swayam/packages/intelligence/src/intent-classifier.ts`

| Status | Intent | Domain | Hindi Support | Tools |
|--------|--------|--------|---------------|-------|
| ✅ | `credit_eligibility_check` | banking | "मुझे लोन मिल सकता है?" | bfc_credit_check |
| ✅ | `loan_apply` | banking | "होम लोन चाहिए" | bfc_loan_apply |
| ✅ | `loan_status_check` | banking | "लोन का स्टेटस" | bfc_loan_status |
| ✅ | `credit_score_check` | banking | "मेरा सिबिल स्कोर" | bfc_credit_score |
| ✅ | `insurance_quote_request` | banking | "बीमा कोटेशन" | bfc_insurance_quote |
| ✅ | `insurance_claim` | banking | "क्लेम दर्ज" | bfc_insurance_claim |
| ✅ | `investment_portfolio_view` | banking | "मेरा निवेश पोर्टफोलियो" | bfc_portfolio_view |
| ✅ | `investment_recommend` | banking | "कहां निवेश करूं" | bfc_investment_recommend |
| ✅ | `financial_goal_set` | banking | "शादी के लिए बचत" | bfc_goal_create |
| ✅ | `financial_goal_progress` | banking | "लक्ष्य कहां तक" | bfc_goal_progress |
| ✅ | `offers_view` | banking | "मेरे ऑफर दिखाओ" | bfc_offers_list |
| ✅ | `offer_apply` | banking | "यह ऑफर लूंगा" | bfc_offer_apply |
| ✅ | `rewards_check` | banking | "मेरे पॉइंट्स" | bfc_rewards_balance |
| ✅ | `rewards_redeem` | banking | "पॉइंट्स रिडीम" | bfc_rewards_redeem |
| ✅ | `spending_analysis` | banking | "खर्च कहां हो रहा" | bfc_spending_analysis |
| ✅ | `budget_set` | banking | "बजट सेट करो" | bfc_budget_create |
| ✅ | `financial_advice` | banking | "पैसों की सलाह" | bfc_financial_advice |
| ✅ | `account_link` | banking | "बैंक अकाउंट जोड़ो" | setu_aa_consent |
| ✅ | `account_summary` | banking | "सभी खातों का बैलेंस" | bfc_account_summary |

**Total: 22 new financial intents added**

---

### 2. Financial Entity Extraction

**File:** `/root/swayam/packages/intelligence/src/entity-extractor.ts`

| Status | Entity Type | Examples | Normalized Output |
|--------|-------------|----------|-------------------|
| ✅ | `loan_type` | "home loan", "होम लोन" | HOME_LOAN, CAR_LOAN, PERSONAL_LOAN |
| ✅ | `insurance_type` | "health insurance", "हेल्थ बीमा" | HEALTH_INSURANCE, LIFE_INSURANCE |
| ✅ | `employment_type` | "salaried", "व्यापारी" | SALARIED, SELF_EMPLOYED, BUSINESS |
| ✅ | `goal_type` | "retirement", "शादी" | RETIREMENT, WEDDING, HOME_PURCHASE |
| ✅ | `tenure` | "5 years", "36 महीने" | 5_YEARS, 36_MONTHS |
| ✅ | `age` | "35 साल का", "age 40" | 35, 40 |
| ✅ | `annual_income` | "5 LPA", "50k monthly" | 500000, 600000 |
| ✅ | `credit_score` | "CIBIL 750", "सिबिल 720" | 750, 720 |
| ✅ | `investment_type` | "SIP", "म्यूचुअल फंड" | SIP, MUTUAL_FUND, FD, PPF |
| ✅ | `bank_name` | "SBI", "एचडीएफसी" | SBI, HDFC, ICICI, AXIS |

**Total: 11 new financial entity types**

---

### 3. BFC Episode Recorder

**File:** `/root/swayam/packages/intelligence/src/bfc-episode-recorder.ts`

```typescript
// Episode Structure: State → Action → Outcome
interface FinancialEpisode {
  state: {
    demographics: { age, employment, income, location },
    financial: { creditScore, existingProducts },
    context: "35 years old, salaried, income ₹8L"
  },
  action: {
    type: 'inquiry' | 'application' | 'check',
    intent: 'credit_eligibility_check',
    description: "Checked loan eligibility for home loan of ₹50L"
  },
  outcome: {
    success: true,
    result: "Eligible for 7.5% interest rate",
    sentiment: 'positive'
  },
  module: 'credit' | 'insurance' | 'investment' | 'savings'
}
```

**Features:**
- ✅ Records all BFC-relevant conversations
- ✅ Batches episodes (10 at a time or every 30s)
- ✅ Sends to ankrBFC API for pattern learning
- ✅ Stores in EON Memory for similarity search
- ✅ Hindi + English descriptions

---

### 4. BFC Gamification Engine

**File:** `/root/swayam/packages/intelligence/src/bfc-gamification.ts`

#### XP & Level System
| Level Range | Tier | XP Required |
|-------------|------|-------------|
| 1-4 | Bronze | 0 - 1,000 |
| 5-9 | Silver | 1,000 - 4,500 |
| 10-14 | Gold | 4,500 - 10,500 |
| 15-19 | Platinum | 10,500 - 19,000 |
| 20+ | Diamond | 19,000+ |

#### Badges (20+ Defined)
| Category | Badge | Rarity | Trigger |
|----------|-------|--------|---------|
| Savings | Goal Setter | Common | Set first savings goal |
| Savings | Saver Bronze | Common | Save ₹10,000 |
| Savings | Saver Gold | Epic | Save ₹10,00,000 |
| Budgeting | Budget Master | Epic | 30 days within budget |
| Investing | SIP Starter | Rare | Start first SIP |
| Credit | Credit Elite | Legendary | 800+ CIBIL score |
| Streak | Centurion | Epic | 100 day streak |
| Streak | Financial Warrior | Legendary | 365 day streak |

#### XP Rewards
| Action | XP |
|--------|-----|
| Daily login | 5 |
| Check balance | 2 |
| Set savings goal | 25 |
| Achieve goal | 100 |
| Start SIP | 50 |
| Link account (AA) | 40 |
| Refer friend | 100 |

---

### 5. Setu Account Aggregator Integration

**File:** `/root/ankr-bfc/TECHNICAL-DESIGN.md` (Appendix C)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SETU AA INTEGRATION FLOW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Swayam      AA SDK       Setu AA       FIP (Bank)            │
│     │           │            │              │                   │
│     │──Create───►│            │              │                   │
│     │  Consent   │───Request──►│              │                   │
│     │           │            │──Redirect─────►│                   │
│     │           │            │◄──Approve──────│                   │
│     │           │◄───Active───│              │                   │
│     │◄──Data────│            │              │                   │
│     │           │            │              │                   │
│   Store locally (encrypted)                                     │
│   Only patterns sent to ankrBFC                                 │
└─────────────────────────────────────────────────────────────────┘
```

**FI Types Supported:**
- ✅ DEPOSIT (Savings, Current accounts)
- ✅ CREDIT_CARD (Statements, dues)
- ✅ TERM_DEPOSIT (FDs)
- ✅ RECURRING_DEPOSIT (RDs)
- ✅ MUTUAL_FUNDS (via RTAs)
- ✅ INSURANCE_POLICIES (via IIB)

**Implementation Status:**
| Component | Status |
|-----------|--------|
| OAuth Token Management | ✅ Documented |
| Consent Flow | ✅ Documented |
| Data Fetch & Decryption | ✅ Documented |
| Transaction Categorization | ✅ Documented |
| Webhook Handlers | ✅ Documented |
| Sandbox Test Cases | ✅ Documented |

---

## Pending Recommendations

### Phase 1: Core Features (Next 2 Weeks)

| # | Feature | Priority | Effort | Files to Create/Modify |
|---|---------|----------|--------|------------------------|
| 1 | Implement Setu AA Client | P0 | Medium | `packages/bfc-core/src/integrations/setu-aa.ts` |
| 2 | Create BFC Tools for MCP | P0 | Medium | `packages/bfc-core/src/tools/` |
| 3 | Connect Episode Recorder to Live API | P1 | Small | Update `bfc-episode-recorder.ts` |
| 4 | Add Gamification GraphQL Resolvers | P1 | Medium | `apps/bfc-api/src/resolvers/gamification.resolver.ts` |
| 5 | Build Rewards Redemption Flow | P1 | Medium | New screens + API |

### Phase 2: Enhancement (Weeks 3-4)

| # | Feature | Priority | Effort |
|---|---------|----------|--------|
| 6 | AI-powered Spending Categorization | P1 | Medium |
| 7 | Churn Prediction Model | P2 | Large |
| 8 | Credit Decision Engine | P1 | Large |
| 9 | Insurance Gap Analysis | P2 | Medium |
| 10 | Investment Risk Profiler | P2 | Medium |

### Phase 3: Enterprise (Month 2+)

| # | Feature | Priority | Effort |
|---|---------|----------|--------|
| 11 | White-label SDK for Banks | P2 | Large |
| 12 | Multi-tenant Architecture | P1 | Large |
| 13 | SOC 2 Compliance | P1 | Large |
| 14 | Real-time Risk Signals API | P1 | Medium |
| 15 | Market Intelligence Dashboard | P2 | Large |

---

## Enterprise Features Roadmap

### For Banks (ankrBFC B2B)

#### 1. Risk Signals API
```graphql
type Query {
  # Real-time risk assessment for a customer
  getRiskSignals(customerId: ID!, bankId: ID!): RiskSignals
}

type RiskSignals {
  creditRisk: Float          # 0-1 score
  churnProbability: Float    # 0-1 score
  fraudRisk: Float           # 0-1 score
  signals: [RiskSignal]      # Detailed signals
  lastUpdated: DateTime
}

type RiskSignal {
  type: String               # "INCOME_DROP", "SPENDING_SPIKE", etc.
  severity: String           # "LOW", "MEDIUM", "HIGH"
  description: String
  confidence: Float
}
```

#### 2. Lead Generation API
```graphql
type Query {
  # Get qualified leads who opted in
  getLeads(bankId: ID!, productType: String!, limit: Int): [Lead]
}

type Lead {
  anonymousId: String        # Not PII
  segment: String            # "young_professional", "family", etc.
  intent: String             # "HOME_LOAN", "HEALTH_INSURANCE"
  confidenceScore: Float
  estimatedValue: Float      # Potential loan amount
  consentGiven: Boolean
  contactToken: String       # One-time token to reach customer
}
```

#### 3. Churn Prediction
```graphql
type Subscription {
  # Real-time churn alerts
  onChurnAlert(bankId: ID!): ChurnAlert
}

type ChurnAlert {
  customerId: ID
  probability: Float
  triggers: [String]         # "SALARY_STOPPED", "COMPETITOR_APP"
  recommendedAction: String
  urgency: String
}
```

#### 4. Market Intelligence Dashboard
- Anonymized spending trends by segment
- Product adoption rates
- Competitor usage patterns
- Seasonal demand forecasting

---

### For Swayam (B2C)

#### 1. Financial Health Score
```typescript
interface FinancialHealthScore {
  overall: number;           // 0-100
  components: {
    savingsRate: number;     // % of income saved
    debtToIncome: number;    // DTI ratio
    emergencyFund: number;   // Months of expenses covered
    insuranceCoverage: number; // Adequacy score
    investmentDiversity: number; // Portfolio diversification
  };
  recommendations: string[];
  improvementPlan: FinancialGoal[];
}
```

#### 2. AI Financial Coach
```typescript
// Proactive advice based on spending patterns
interface CoachAdvice {
  type: 'savings' | 'spending' | 'investment' | 'insurance';
  trigger: string;           // What triggered this advice
  advice: string;
  adviceHi: string;
  actionable: boolean;
  action?: {
    intent: string;          // Intent to trigger if user accepts
    entities: Record<string, any>;
  };
}
```

#### 3. Bill Reminders & Auto-pay
- Utility bill tracking
- Credit card due date alerts
- EMI reminders
- Insurance renewal alerts
- SIP date notifications

#### 4. Family Finance Mode
- Add family members
- Shared goals
- Spending visibility (with consent)
- Family financial health score

---

## Security & Compliance Checklist

| Requirement | Status | Notes |
|-------------|--------|-------|
| Data Encryption at Rest | ⬜ Pending | AES-256 |
| Data Encryption in Transit | ✅ Done | TLS 1.3 |
| PII Masking | ⬜ Pending | On all logs |
| Consent Management | ✅ Designed | Setu AA + custom |
| GDPR Compliance | ⬜ Pending | For EU users |
| DPDP Act Compliance | ⬜ Pending | India's data protection |
| SOC 2 Type II | ⬜ Planned | Month 6 |
| ISO 27001 | ⬜ Planned | Month 9 |
| RBI AA Guidelines | ✅ Following | Via Setu |
| IRDAI IIB Guidelines | ⬜ Pending | For insurance data |

---

## Technical Debt & Improvements

| Item | Priority | Notes |
|------|----------|-------|
| Add unit tests for intent classifier | P1 | Test Hindi patterns |
| Add unit tests for entity extractor | P1 | Test amount normalization |
| Add integration tests for episode recorder | P2 | Mock BFC API |
| Performance optimize intent matching | P2 | Consider Trie structure |
| Add caching for gamification profiles | P2 | Redis cache |
| Implement rate limiting | P1 | Per-user limits |
| Add observability (Prometheus metrics) | P1 | For all services |
| Set up error tracking (Sentry) | P1 | For debugging |

---

## File Structure Reference

```
/root/swayam/packages/intelligence/src/
├── intent-classifier.ts      # 22 new BFC intents ✅
├── entity-extractor.ts       # 11 new financial entities ✅
├── bfc-episode-recorder.ts   # Episode recording ✅
├── bfc-gamification.ts       # Gamification engine ✅
├── types.ts                  # Updated with new types ✅
└── index.ts                  # Updated exports ✅

/root/ankr-bfc/
├── TECHNICAL-DESIGN.md       # Setu AA guide added ✅
├── apps/bfc-api/             # API server
├── apps/bfc-web/             # Admin dashboard
└── packages/bfc-core/        # Shared logic
```

---

## Quick Start Commands

```bash
# Build Swayam intelligence package
cd /root/swayam/packages/intelligence
pnpm build

# Start BFC API
cd /root/ankr-bfc
pnpm dev

# Run tests
pnpm test

# Check Setu sandbox
curl -X POST https://aa-sandbox.setu.co/consents \
  -H "Authorization: Bearer $SETU_TOKEN" \
  -d '{"Customer": {"id": "9999999999@setu"}, ...}'
```

---

## Contact & Support

- **Technical Questions:** ANKR Labs Engineering
- **Setu Integration:** Setu Developer Portal (https://docs.setu.co)
- **Complymitra:** Complymitra API Docs

---

*Made with ♥ in India*
*ANKR Labs - Jai Guru Ji*
