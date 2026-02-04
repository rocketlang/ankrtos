# ankrBFC - Business Finance Cloud Platform

> **Transaction Behavioral Intelligence for Banks & Financial Institutions**

**Platform:** ankrBFC (Business Finance Cloud)
**Category:** Banking Technology / FinTech
**Status:** Production Ready
**Estimated Value:** $8-12M

---

## Executive Summary

ankrBFC is an enterprise-grade **Transaction Behavioral Intelligence (TBI)** platform designed for banks and financial institutions. It combines advanced behavioral analytics, AI-powered decision-making, real-time notifications, and comprehensive compliance capabilities.

---

## Platform Metrics

| Metric | Value |
|--------|-------|
| **GraphQL Schema** | 2,162+ lines |
| **Domain Services** | 14 services (5,717 LOC) |
| **Database Models** | 50+ Prisma models |
| **Frontend Pages** | 20+ React pages |
| **Mobile Apps** | 2 (Customer + Staff) |
| **Packages** | 5 shared libraries |

---

## Technology Stack

### Backend
- **Framework:** Fastify ^4.26.0
- **GraphQL:** Mercurius ^14.1.0
- **ORM:** Prisma ^5.22.0
- **Database:** PostgreSQL 16+ with pgvector
- **Cache:** Redis (ioredis ^5.3.0)
- **Auth:** Fastify JWT ^8.0.0

### Frontend
- **Framework:** React ^19.0.0 + Vite
- **Styling:** TailwindCSS ^3.4.1
- **GraphQL:** Apollo Client ^3.9.0
- **Charts:** Recharts ^2.10.0
- **Routing:** React Router ^7.0.0

### Mobile
- **Framework:** Expo ~50.0.0
- **Navigation:** Expo Router ~3.4.0
- **Secure Storage:** Expo Secure Store
- **Location:** Expo Location
- **Camera:** Expo Camera

---

## Applications

### bfc-api (GraphQL Backend)
- Port: 4020
- Security: Helmet, CORS, Rate Limiting (100 req/min)
- WebSocket Subscriptions for real-time updates
- Health Checks: `/health` and `/ready` endpoints

### bfc-web (Admin Dashboard)
- Port: 3020
- Customer 360° view interface
- Credit application review
- Compliance monitoring dashboard
- Agent & commission tracking

### bfc-customer-app (Mobile)
- Loan application tracking
- Offer discovery
- Document management
- Secure credential storage

### bfc-staff-app (Mobile)
- Field agent lead management
- Location tracking
- Commission tracking
- Offline-capable forms

---

## 14 Domain Services (5,717 LOC)

| Service | Lines | Purpose |
|---------|-------|---------|
| **claims.service.ts** | 745 | Insurance claim processing & fraud detection |
| **gamification.service.ts** | 621 | Points, badges, challenges, leaderboards |
| **agent.service.ts** | 606 | Agent management & commission tracking |
| **compliance.service.ts** | 525 | KYC, AML, tax, grievance tracking |
| **insurance.service.ts** | 458 | Policy management & premium calculations |
| **document.service.ts** | 462 | Document processing & OCR |
| **telematics.service.ts** | 438 | GPS/IoT event processing |
| **underwriting.service.ts** | 424 | Rules engine & auto-decisioning |
| **wellness.service.ts** | 483 | Health profile & wearable data |
| **renewal.service.ts** | 489 | Policy renewal & lapse revival |
| **credit.service.ts** | 139 | Credit application orchestration |
| **offer.service.ts** | 161 | Offer generation & personalization |
| **customer.service.ts** | 144 | Customer lifecycle & data sync |

---

## Database Schema (50+ Models)

### Customer Models
```prisma
Customer {
  id, externalId, cif
  KYC: PAN, Aadhaar hash, DoB, gender
  Scores: riskScore, trustScore, creditScore
  Segment: MASS, AFFLUENT, HNI, ULTRA_HNI
  lifetimeValue
  Churn: churnProbability, churnRiskLevel
  communicationPrefs (GDPR/DPDP consent)
}
```

### Episode Model (Behavioral Memory)
```prisma
CustomerEpisode {
  context, state, action, outcome, success
  module: LOAN, DEPOSIT, PAYMENT, CARD, INVESTMENT, INSURANCE, KYC
  channel: BRANCH, DIGITAL, MOBILE_APP, ATM, CALL_CENTER, WHATSAPP
  embedding: pgvector(1536)
  aiInsight
}
```

### Insurance Models
- InsurancePolicy (14 policy types)
- TelematicsEvent (12 event types)
- InsuranceClaim (13 claim types)

### Gamification Models
- GamificationProfile (5 tiers: BRONZE to DIAMOND)
- Challenge, Badge, PointsTransaction
- LeaderboardEntry, ChallengeParticipation

---

## GraphQL API (100+ Endpoints)

### Customer Queries
```graphql
customer(id: ID!): Customer
customerByPhone(phone: String!): Customer
customer360(id: ID!): Customer360
customers(pagination, segment): CustomerConnection!
```

### Credit Operations
```graphql
eligibilityCheck(customerId, loanType): EligibilityCheck!
mutation submitCreditApplication(input): CreditDecision!
```

### Insurance Operations
```graphql
calculatePremium(policyId: ID!): PremiumCalculation!
drivingScore(policyId, days): DrivingScore!
claimFraudAnalysis(claimId): FraudAnalysis!
mutation fileClaim(input): InsuranceClaim!
mutation recordTelematicsEvent(input): TelematicsEvent!
```

### Gamification
```graphql
gamificationProfile(customerId): GamificationProfile
leaderboard(type, customerId, limit): [LeaderboardEntry!]!
mutation awardPoints(customerId, points, type): PointsTransaction!
mutation joinChallenge(customerId, challengeId): ChallengeParticipation!
```

### Subscriptions
```graphql
subscription customerRiskUpdated(customerId): Customer!
subscription newOfferGenerated(customerId): CustomerOffer!
subscription creditDecisionMade(applicationId): CreditDecision!
```

---

## Integrations

### Credit Engine (768 lines)
**Intelligent Credit Decisioning Pipeline:**
1. **Policy Checks:** Age, income, loan amount, bureau score, FOIR
2. **Risk Assessment:** Multi-factor scoring, risk grade (A-F)
3. **Similar Case Matching:** EON vector search
4. **AI Decision:** Claude 3 Sonnet via AI Proxy
5. **Final Decision:** Policy compliance, risk-based matrix

**Credit Policies:**
- HOME_LOAN: ₹5 crore max, 30 years, 8.5% base
- PERSONAL_LOAN: ₹25 lakh max, 5 years, 12% base
- CAR_LOAN: ₹1 crore max, 7 years, 9% base
- BUSINESS_LOAN: ₹5 crore max, 10 years, 14% base
- CREDIT_CARD: ₹5 lakh limit, 42% annual

### Complymitra Integration (663 lines)
- PAN validation
- Aadhaar verification with OTP
- GSTIN business verification
- Bank account verification (penny drop)
- AML screening (OFAC, UN, EU, RBI watchlists)
- TDS calculation by section
- GST calculation with HSN/SAC codes

### AI Proxy Integration (534 lines)
- **Credit Decision Intelligence:** AI-powered recommendations
- **Churn Prediction:** Activity analysis, risk factors
- **Life Event Detection:** Transaction pattern analysis
- **Offer Recommendation:** Cross-sell opportunities

### EON Integration
- Behavioral episode storage
- Vector search for similar cases
- Pattern recognition for decisioning

---

## Real-Time Features (WebSocket)

### Message Types (17 enums)
- Connection: CONNECT, DISCONNECT, PING, PONG
- Notifications: NOTIFICATION, NOTIFICATION_READ
- Presence: PRESENCE_UPDATE, PRESENCE_QUERY
- Data: CUSTOMER_UPDATE, APPLICATION_UPDATE, TASK_UPDATE
- Approval: APPROVAL_REQUEST, APPROVAL_RESPONSE

### Broadcasting Options
- Channel-based filtering
- Role-based filtering (RBAC)
- User ID filtering
- Branch code filtering
- Device type filtering

---

## Security & Compliance

### Authentication
- JWT tokens with RBAC
- ABAC for fine-grained permissions
- Multi-role support (OFFICER, MANAGER, ADMIN)

### Data Protection
- AES-256-GCM encryption at rest
- TLS/SSL in transit
- PII masking (DPDP/GDPR)
- Aadhaar hash storage

### Compliance Features
- KYC verification
- AML screening
- STR/CTR reporting
- Solvency ratio monitoring

---

## Business Capabilities

### Customer Intelligence
- 360° unified view
- Risk & trust scoring
- Segment classification
- Lifetime value calculation
- Churn prediction
- Life event detection

### Credit Management
- Policy-based rule engine
- AI-powered recommendations
- Risk-adjusted pricing
- Automated approvals
- Default probability estimation

### Insurance Management
- 14 policy types
- Behavior-based discounts
- Real-time telematics
- Fraud detection

### Gamification
- 5-tier system (Bronze → Diamond)
- Challenge participation
- Badge achievements
- Leaderboard rankings

---

## Investment Highlights

1. **Transaction Behavioral Intelligence:** Unique customer insight platform
2. **AI-Powered Decisioning:** Claude 3 integration for credit/churn/offers
3. **Real-Time:** WebSocket subscriptions for live updates
4. **Multi-Channel:** Web + 2 mobile apps + API
5. **Compliance Ready:** KYC, AML, DPDP built-in
6. **Gamification:** Native loyalty and engagement

---

*Document Classification: Investor Confidential*
*Last Updated: 19 Jan 2026*
*Source: /root/ankr-bfc/*
