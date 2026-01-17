# ankrBFC - Transaction Behavioral Intelligence Platform

## Executive Summary

ankrBFC is a next-generation Banking Finance Customer (BFC) platform that leverages Transaction Behavioral Intelligence (TBI) to transform how banks understand, serve, and grow customer relationships. Built on ANKR infrastructure with deep Complymitra integration, ankrBFC delivers real-time insights, personalized recommendations, and regulatory compliance in a unified platform.

---

## 1. Business Problem

### Current State of Banking CRM

1. **Fragmented Data**: Customer data scattered across CBS, CRM, loan systems, card systems
2. **Reactive Approach**: Banks react to customer actions rather than anticipating needs
3. **Generic Offers**: Mass marketing with low conversion rates (typically 2-5%)
4. **Compliance Burden**: Manual compliance checks causing delays
5. **Siloed Channels**: No continuity between branch, app, and call center
6. **High Churn**: Banks lose 10-15% customers annually without early warning
7. **Slow Decisions**: Loan approvals taking days instead of minutes

### Goals101 Limitations (Competitive Analysis)

| Area | Goals101 Gap | ankrBFC Solution |
|------|--------------|------------------|
| **CBS Integration** | Mock/demo only | Real CBS adapter pattern |
| **Channel Tracking** | Single channel | True omni-channel with session continuity |
| **Consent Management** | Basic | DPDP/GDPR-compliant consent framework |
| **Life Event Detection** | None | AI-powered life event detection |
| **Churn Prediction** | None | Real-time churn scoring with alerts |
| **Document Vault** | None | Encrypted secure document storage |
| **Campaign Attribution** | Basic | Full attribution with A/B testing |
| **Compliance** | Minimal | Deep Complymitra integration |

---

## 2. Solution: ankrBFC Platform

### Core Philosophy

**"Every transaction tells a story. Every story reveals an opportunity."**

ankrBFC uses the ANKR EON memory system to capture and learn from every customer interaction, building a behavioral graph that:

- Predicts customer needs before they articulate them
- Scores risk in real-time from transaction patterns
- Personalizes offers with 60%+ relevance scores
- Enables <5 minute loan decisions
- Maintains full regulatory compliance

### Key Modules

#### 2.1 Customer 360

A unified view of the customer across all products, channels, and time:

```
┌────────────────────────────────────────────────────────────┐
│                     Customer 360                           │
├────────────────────────────────────────────────────────────┤
│  Identity │ Products │ Transactions │ Behavior │ Offers   │
├────────────────────────────────────────────────────────────┤
│  KYC      │ Savings  │ Deposits     │ Episodes │ Active   │
│  Documents│ Loans    │ Payments     │ Patterns │ History  │
│  Consents │ Cards    │ Investments  │ Life Evt │ Next     │
│  Comms    │ Insurance│ Transfers    │ Churn    │ Best     │
│  Prefs    │ FDs/RDs  │ EMIs         │ Risk     │ Action   │
└────────────────────────────────────────────────────────────┘
```

#### 2.2 Behavioral Episodes (EON-Powered)

Every customer interaction becomes a learning episode:

```typescript
Episode = {
  state: "35yo, income 50L, 2 existing loans, 5yr relationship",
  action: "applied_for_home_loan",
  outcome: "approved_at_7.5%",
  success: true,
  embedding: vector(1536) // For similarity search
}
```

These episodes power:
- Pattern matching for credit decisions
- Similar customer recommendations
- Propensity modeling
- Risk scoring

#### 2.3 Credit Decision Engine

AI-powered credit decisions using behavioral patterns:

```
Application → Pattern Match → Similar Cases → Risk Score → Decision
     ↓              ↓              ↓              ↓          ↓
  Context      Find 100s of    Weight by     Calculate    Auto-approve
  Features     similar past    recency &     probability  or escalate
               applications    similarity    of default
```

Target: <5 minutes for 80% of applications

#### 2.4 Next Best Action (NBA)

Real-time recommendations engine:

```
Customer Profile + Recent Behavior + Life Events + Eligibility
                            ↓
            AI Model (trained on behavioral patterns)
                            ↓
        Ranked Recommendations with Confidence Scores
                            ↓
         Show via: App Notification, SMS, Branch, Chatbot
```

#### 2.5 Compliance Engine (Complymitra)

Deep integration with Complymitra for:

| Compliance Area | Capability |
|-----------------|------------|
| **KYC** | Aadhaar, PAN, DigiLocker verification |
| **AML** | Transaction monitoring, suspicious pattern detection |
| **RBI** | Master directions compliance, reporting |
| **PCI-DSS** | Card data security |
| **GST** | Banking service GST calculations |
| **TDS** | Interest TDS computation |
| **DPDP** | Indian data protection compliance |
| **GDPR** | EU data protection (for NRI customers) |

---

## 3. Technical Architecture

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTENDS                                   │
├───────────────┬─────────────────────────────────┬───────────────┤
│   bfc-web     │      bfc-customer-app           │  bfc-staff-app│
│   Dashboard   │      (Expo Mobile)              │  (Expo Mobile)│
│   React/Vite  │                                 │               │
├───────────────┴─────────────────────────────────┴───────────────┤
│                     BFC-API (GraphQL)                           │
│                     Port: 4020                                  │
├─────────────────────────────────────────────────────────────────┤
│     Services Layer                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │Customer │ │Credit   │ │Risk     │ │Offers   │ │Compliance│  │
│  │360      │ │Decision │ │Scoring  │ │Engine   │ │Bridge    │  │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬─────┘  │
│       └───────────┴──────────┴──────────┴───────────┘          │
│                            │                                    │
├────────────────────────────┼────────────────────────────────────┤
│                    ANKR CORE                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │EON Memory   │  │AI Proxy     │  │PostgreSQL + pgvector    │ │
│  │Port: 4005   │  │Port: 4444   │  │                         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                    EXTERNAL INTEGRATIONS                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │Complymitra  │  │CBS Adapter  │  │Credit Bureaus           │ │
│  │Port: 4015   │  │Bank's Core  │  │CIBIL, Experian, etc     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Technology Stack

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| **Runtime** | Node.js | 20.x LTS | Async performance, ANKR standard |
| **API** | Fastify + Mercurius | 4.x | High performance GraphQL |
| **Database** | PostgreSQL + pgvector | 16.x | Vector similarity search |
| **ORM** | Prisma | 5.x | Type-safe, migrations |
| **Cache** | Redis | 7.x | Session, rate limiting |
| **Web** | React 19 + Vite | Latest | ANKR standard |
| **Mobile** | Expo Router | 3.x | Cross-platform, ANKR standard |
| **AI** | AI Proxy | - | Multi-provider LLM gateway |
| **Memory** | EON | - | Behavioral graph |
| **Compliance** | Complymitra | - | Regulatory automation |

### 3.3 Data Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Channel │ --> │ API     │ --> │ Service │ --> │ Database│
│ Event   │     │ Gateway │     │ Layer   │     │ + EON   │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
     │               │               │               │
     ▼               ▼               ▼               ▼
  Validate      Authenticate    Episode        Pattern
  & Enrich      & Authorize     Recording      Learning
                                    │
                                    ▼
                              ┌─────────────┐
                              │ AI Analysis │
                              │ - Risk      │
                              │ - NBA       │
                              │ - Insights  │
                              └─────────────┘
```

---

## 4. Compliance Framework

### 4.1 DPDP Act 2023 (India) Compliance

The Digital Personal Data Protection Act requires:

| Requirement | ankrBFC Implementation |
|-------------|------------------------|
| **Notice & Consent** | CustomerConsent table with explicit consent tracking |
| **Purpose Limitation** | Consent tied to specific purposes (ConsentType enum) |
| **Data Minimization** | Only required fields, encryption for sensitive data |
| **Retention Limits** | Automated data lifecycle management |
| **Data Principal Rights** | API endpoints for access, correction, erasure |
| **Grievance Redressal** | Support module integration |
| **Cross-Border Transfer** | Complymitra integration for transfer checks |
| **Breach Notification** | Alert system with compliance escalation |

### 4.2 GDPR Compliance (for NRI customers)

| GDPR Article | ankrBFC Implementation |
|--------------|------------------------|
| **Art. 6 - Lawful Basis** | Consent management with purpose specification |
| **Art. 7 - Consent** | Explicit, withdrawable consent with audit trail |
| **Art. 13/14 - Information** | Transparent privacy notices at consent points |
| **Art. 15 - Access** | Customer data export API |
| **Art. 16 - Rectification** | Update customer data via API |
| **Art. 17 - Erasure** | Soft delete with compliance hold support |
| **Art. 20 - Portability** | JSON/CSV data export |
| **Art. 25 - Privacy by Design** | Encryption, pseudonymization, access controls |
| **Art. 30 - Records** | CbsSyncLog for all processing activities |
| **Art. 32 - Security** | Encryption at rest and in transit |
| **Art. 35 - DPIA** | Pre-built DPIA templates for new features |

### 4.3 RBI Compliance

| Regulation | ankrBFC Implementation |
|------------|------------------------|
| **KYC Master Direction** | Complymitra KYC integration, document verification |
| **Data Localization** | Indian data centers, no cross-border by default |
| **Loan Pricing** | Transparent interest rate display, no hidden charges |
| **Fair Practices Code** | Offer terms clearly defined in CustomerOffer |
| **AML/CFT** | Transaction monitoring, suspicious activity alerts |
| **Cyber Security** | Audit logging, encryption, access controls |

### 4.4 PCI-DSS Compliance

| Requirement | ankrBFC Implementation |
|-------------|------------------------|
| **Secure Network** | TLS everywhere, network segmentation |
| **Cardholder Data** | No PAN storage, tokenization via CBS |
| **Vulnerability Mgmt** | Regular scanning, patch management |
| **Access Control** | Role-based access, MFA for staff |
| **Monitoring** | Alert system, audit logs |
| **Security Policy** | Documented and enforced |

---

## 5. Implementation Roadmap

### Phase 1: Foundation (Current)

- [x] Project structure and workspace
- [x] Database schema with pgvector
- [x] Enhanced schema beyond Goals101
- [ ] bfc-core shared package
- [ ] bfc-api with GraphQL
- [ ] Customer 360 service
- [ ] Episode recording system
- [ ] CBS adapter pattern

### Phase 2: Intelligence

- [ ] EON integration for behavioral memory
- [ ] AI Proxy integration for decisions
- [ ] Credit decision engine
- [ ] Risk scoring service
- [ ] Pattern learning from episodes

### Phase 3: Engagement

- [ ] Offer recommendation engine
- [ ] Next Best Action system
- [ ] Campaign management
- [ ] Multi-channel communication
- [ ] A/B testing framework

### Phase 4: Frontends

- [ ] bfc-web admin dashboard
- [ ] bfc-customer-app mobile
- [ ] bfc-staff-app mobile
- [ ] Omni-channel session continuity

### Phase 5: Compliance Deep-Dive

- [ ] Complymitra full integration
- [ ] DPDP consent workflows
- [ ] GDPR data subject requests
- [ ] Automated compliance reporting
- [ ] Audit trail and evidence

---

## 6. Success Metrics

| Metric | Current (Industry) | ankrBFC Target |
|--------|-------------------|----------------|
| **Offer Conversion** | 2-5% | 15-25% |
| **Loan Decision Time** | 3-7 days | <5 minutes (80%) |
| **Customer Churn** | 10-15% | <5% |
| **Cross-sell Ratio** | 1.2 | 2.5+ |
| **NPS** | 20-30 | 50+ |
| **Compliance Violations** | Monthly | Zero |

---

## 7. Team & Ownership

| Role | Responsibility |
|------|----------------|
| **Platform Owner** | ANKR Labs |
| **Compliance** | Complymitra team |
| **AI/ML** | ANKR AI team |
| **CBS Integration** | Bank-specific adapter development |

---

## 8. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **CBS Integration Delays** | Mock CBS for development, adapter pattern |
| **AI Model Accuracy** | Human-in-loop for high-value decisions |
| **Regulatory Changes** | Modular compliance engine, quick updates |
| **Data Privacy Breach** | Encryption, access controls, monitoring |
| **Scalability** | Postgres read replicas, Redis caching |

---

## Appendix A: Port Allocation

| Service | Port | Description |
|---------|------|-------------|
| bfc-api | 4020 | Main GraphQL API |
| bfc-web | 3020 | Admin dashboard |
| bfc-customer-app | 8081 | Customer Expo dev |
| bfc-staff-app | 8082 | Staff Expo dev |

## Appendix B: Environment Variables

```env
# Database
DATABASE_URL=postgresql://ankr:indrA@0612@localhost:5432/ankr_bfc

# ANKR Services
EON_URL=http://localhost:4005
AI_PROXY_URL=http://localhost:4444
COMPLYMITRA_URL=http://localhost:4015

# Security
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-encryption-key

# CBS Integration
CBS_ADAPTER_TYPE=mock # or 'finacle', 'flexcube', etc.
CBS_API_URL=https://cbs.bank.com/api
CBS_API_KEY=your-cbs-key
```

---

*Document Version: 1.0*
*Last Updated: January 2026*
*Classification: Internal*
