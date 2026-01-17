# ankrBFC Differentiators

## Executive Summary

ankrBFC isn't just another banking CRM. It's a **Transaction Behavioral Intelligence** platform that learns from every interaction, predicts customer needs, and enables instant decisions while maintaining full regulatory compliance.

---

## What Makes ankrBFC Different

### 1. True CBS Integration (Not Mock)

**Goals101 Problem**: Demo-only, no real Core Banking System integration.

**ankrBFC Solution**: Production-ready CBS adapter pattern.

```typescript
// Flexible adapter pattern - swap implementations
interface CBSAdapter {
  getCustomer(cif: string): Promise<Customer>;
  getAccounts(cif: string): Promise<Account[]>;
  getTransactions(accountNo: string, from: Date, to: Date): Promise<Transaction[]>;
  postTransaction(txn: TransactionRequest): Promise<TransactionResult>;
}

// Implementations for major CBS platforms
class FinacleAdapter implements CBSAdapter { ... }
class FlexcubeAdapter implements CBSAdapter { ... }
class MockAdapter implements CBSAdapter { ... }  // For development
```

Benefits:
- Same codebase for demo and production
- Hot-swappable CBS backends
- Transaction sync with audit trail
- Real-time balance updates

---

### 2. Behavioral Episode Memory (EON-Powered)

**Goals101 Problem**: No learning from customer interactions.

**ankrBFC Solution**: Every interaction becomes a learning episode.

```
Episode: {
  state: "35yo, IT professional, income ₹50L, existing home loan ₹40L, 5yr customer",
  action: "applied_for_car_loan",
  outcome: "approved_₹8L_at_8.5%",
  success: true,
  embedding: vector(1536)  // For semantic search
}
```

**How It Powers Decisions**:

1. **Credit Decisioning**: "Find 100 similar past applications → What happened? → Apply weighted learning"
2. **Offer Propensity**: "Customers like X converted on home loan offers 72% of the time"
3. **Risk Scoring**: "This spending pattern preceded default in 15% of similar cases"

---

### 3. Life Event Detection

**Goals101 Problem**: No proactive opportunity detection.

**ankrBFC Solution**: AI-powered life event detection from transaction patterns.

| Life Event | Detection Signals | Triggered Actions |
|------------|-------------------|-------------------|
| **Marriage** | Jewelry purchases, wedding venue payments, travel bookings | Home loan offers, joint account, insurance |
| **Child Birth** | Hospital payments, baby product purchases | Education loan info, child insurance, SIP |
| **Job Change** | Salary source change, different timing | Updated income verification, loan offers |
| **Salary Increase** | >20% salary credit increase | Premium products, investment offers |
| **Relocation** | New city utility payments, rent changes | Address update, local branch intro |
| **Retirement** | Pension credits, PF settlement | Senior citizen accounts, annuity products |

```prisma
model LifeEvent {
  id           String   @id
  customerId   String
  eventType    LifeEventType  // MARRIAGE, CHILD_BIRTH, JOB_CHANGE, etc.
  confidence   Float          // AI confidence score
  source       String         // TRANSACTION, DOCUMENT, AI_INFERRED
  evidence     Json           // Supporting data
  triggeredOffers String[]    // Offers generated from this
}
```

---

### 4. Churn Prediction & Prevention

**Goals101 Problem**: Banks lose 10-15% customers annually with no warning.

**ankrBFC Solution**: Real-time churn scoring with early warning alerts.

**Churn Signals Tracked**:
- Declining balance trend
- Reduced transaction frequency
- Dormancy in secondary products
- Competitor product inquiries (from consent data)
- Unfavorable comparison communications
- Service complaint patterns

**Churn Risk Model**:
```
Customer Churn Score = f(
  balance_trend,
  transaction_frequency_change,
  product_usage_ratio,
  service_complaints,
  competitor_mentions,
  recent_negative_episodes
)
```

**Intervention Triggers**:
- Score > 0.7: Immediate RM alert
- Score > 0.5: Retention offer queue
- Score > 0.3: Proactive outreach campaign

---

### 5. DPDP + GDPR Consent Management

**Goals101 Problem**: Basic consent, not regulatory-compliant.

**ankrBFC Solution**: Purpose-specific consent with full audit trail.

```prisma
enum ConsentType {
  MARKETING_EMAIL
  MARKETING_SMS
  MARKETING_PUSH
  MARKETING_WHATSAPP
  MARKETING_CALL
  DATA_SHARING
  CREDIT_BUREAU
  CROSS_SELL
  THIRD_PARTY
  ANALYTICS
  AA_CONSENT  // Account Aggregator
}

model CustomerConsent {
  id           String      @id
  customerId   String
  consentType  ConsentType
  purpose      String      // Human-readable
  status       Boolean
  givenAt      DateTime?
  revokedAt    DateTime?
  expiresAt    DateTime?
  ipAddress    String?     // For audit
  channel      Channel?    // Where consent was given
  documentId   String?     // Signed consent document
}
```

**DPDP Compliance Features**:
- Purpose limitation (consent tied to specific use)
- Granular consent (not blanket permissions)
- Easy revocation (single API call)
- Expiry handling (auto-expire, renewal prompts)
- Data principal rights (access, correct, erase)
- Breach notification (integrated with Alert system)

---

### 6. Omni-Channel Session Continuity

**Goals101 Problem**: Siloed channels, customer repeats themselves.

**ankrBFC Solution**: Single session across all channels.

**Scenario**:
1. Customer starts loan application on mobile app
2. Has questions, calls customer service
3. Agent sees exact application state, no repeat
4. Customer visits branch to submit documents
5. Branch staff continues from same point
6. Loan approved, notification on mobile

```prisma
model OmniChannelSession {
  id              String   @id
  customerId      String
  sessionToken    String   @unique
  currentChannel  Channel  // MOBILE_APP, CALL_CENTER, BRANCH
  previousChannel Channel?
  journeyType     String?  // LOAN_APPLICATION, SUPPORT
  currentStep     String?
  completedSteps  String[]
  context         Json     // Carries data across channels
  isActive        Boolean
}
```

**API Example**:
```graphql
query continueSession($sessionToken: String!, $channel: Channel!) {
  continueSession(sessionToken: $sessionToken, channel: $channel) {
    journeyType
    currentStep
    completedSteps
    context  # Full application state
    suggestedNextActions
  }
}
```

---

### 7. Secure Document Vault

**Goals101 Problem**: No secure document storage.

**ankrBFC Solution**: Encrypted vault with verification tracking.

```prisma
model CustomerDocument {
  id                 String       @id
  customerId         String
  documentType       DocumentType // PAN, AADHAAR, SALARY_SLIP, etc.
  documentNumber     String?      // Encrypted
  storageUrl         String       // S3/secure path
  encryptionKey      String?      // Key reference
  isVerified         Boolean
  verificationMethod String?      // DIGILOCKER, MANUAL, API
  verifiedAt         DateTime?
  expiresAt          DateTime?    // For passport, DL, etc.
}
```

**Features**:
- AES-256 encryption at rest
- Separate encryption keys per document
- DigiLocker integration for instant verification
- Expiry tracking with renewal alerts
- Version history for re-submissions

---

### 8. Campaign Attribution & A/B Testing

**Goals101 Problem**: No attribution, no learning from campaigns.

**ankrBFC Solution**: Full funnel tracking with experiment support.

```
Campaign Created → Target Segment → Offer Generated → Shown → Clicked → Converted
       ↓                ↓                ↓             ↓         ↓          ↓
   CampaignId    Participation      CustomerOffer   shownAt  clickedAt  convertedAt
                    records           created
```

**A/B Testing Flow**:
```typescript
// Create experiment variants
campaign.variants = [
  { id: 'A', offerType: 'DISCOUNT', weight: 50 },
  { id: 'B', offerType: 'CASHBACK', weight: 50 }
];

// Track performance
variantA: { shown: 1000, converted: 150 }  // 15%
variantB: { shown: 1000, converted: 220 }  // 22%

// Auto-optimize: Shift traffic to winner
```

---

### 9. Next Best Action Engine

**Goals101 Problem**: Static rules, not learning.

**ankrBFC Solution**: AI-powered, real-time recommendations.

```prisma
model NextBestAction {
  id              String   @id
  customerId      String   @unique
  recommendations Json     // [{action, confidence, reason, offerCode}]
  modelVersion    String?
  calculatedAt    DateTime
  expiresAt       DateTime
  triggerReason   String?  // What triggered recalculation
}
```

**Example Recommendations**:
```json
{
  "recommendations": [
    {
      "action": "OFFER_HOME_LOAN",
      "confidence": 0.85,
      "reason": "Similar customers with 50L+ income converted 72%",
      "offerCode": "HL2024Q1",
      "priority": 1
    },
    {
      "action": "SUGGEST_SIP",
      "confidence": 0.72,
      "reason": "High savings balance, no investments",
      "offerCode": "SIP500",
      "priority": 2
    }
  ]
}
```

**Trigger Events**:
- Transaction above threshold
- Life event detected
- Product milestone (1yr anniversary)
- Churn risk increase
- Competitor offer response

---

### 10. Alert & Fraud Intelligence

**Goals101 Problem**: No fraud detection or alerting.

**ankrBFC Solution**: Multi-layer alert system.

```prisma
enum AlertType {
  FRAUD_SUSPECTED       // Unusual transaction pattern
  AML_FLAG             // Money laundering signals
  UNUSUAL_ACTIVITY     // Deviation from normal behavior
  HIGH_VALUE_TRANSACTION // Above threshold alerts
  CHURN_RISK           // Customer may leave
  COMPLIANCE_BREACH    // Regulatory issue
  DOCUMENT_EXPIRY      // KYC document expiring
  NPA_WARNING          // Loan turning bad
}
```

**Integration Points**:
- Real-time transaction monitoring
- EON pattern matching for anomalies
- Complymitra AML rules engine
- SMS/Email alerts to staff
- Auto-escalation workflows

---

## Comparison Matrix

| Feature | Goals101 | ankrBFC |
|---------|----------|---------|
| CBS Integration | Mock only | Production adapters |
| Behavioral Learning | ❌ | EON-powered episodes |
| Life Event Detection | ❌ | AI-powered |
| Churn Prediction | ❌ | Real-time scoring |
| DPDP Compliance | ❌ | Full support |
| GDPR Compliance | Basic | Full support |
| Consent Management | Basic | Purpose-specific |
| Omni-Channel Sessions | ❌ | Full continuity |
| Document Vault | ❌ | Encrypted storage |
| Campaign Attribution | Basic | Full funnel + A/B |
| Next Best Action | Static rules | AI-powered |
| Fraud Detection | ❌ | Multi-layer alerts |
| Credit Decisioning | Manual | <5 min AI-assisted |
| Vector Search | ❌ | pgvector integration |
| RBI Compliance | Basic | Complymitra integrated |

---

## Why Banks Choose ankrBFC

1. **Speed to Market**: 3-month implementation vs 12+ months for custom
2. **ANKR Ecosystem**: Proven infrastructure (AI Proxy, EON, Complymitra)
3. **Compliance First**: Built-in regulatory support
4. **AI-Native**: Not bolted-on AI, but AI-first design
5. **Real CBS Support**: Not demo-ware, production-ready
6. **Indian Context**: Built for RBI regulations, Indian banking
7. **Flexible Deployment**: Cloud, on-premise, or hybrid

---

*The difference isn't features. It's the philosophy.*

*Goals101 = CRM with some AI.*
*ankrBFC = AI with banking context.*
