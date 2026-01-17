# BFC Project Wiki

## Table of Contents
1. [Introduction](#introduction)
2. [Core Modules](#core-modules)
3. [User Journeys](#user-journeys)
4. [Feature Reference](#feature-reference)
5. [Integration Points](#integration-points)
6. [Glossary](#glossary)

---

## Introduction

### What is BFC?

**Banking Finance Customer (BFC)** is a Transaction Behavioral Intelligence (TBI) platform designed for banks and financial institutions. It helps banks understand customer behavior, make intelligent credit decisions, deliver personalized offers, and maintain regulatory compliance.

### Key Value Propositions

| For Banks | For Customers |
|-----------|---------------|
| 360° customer view | Personalized offers |
| AI-powered credit decisions | Faster loan approvals |
| Reduced NPA risk | Better financial products |
| Compliance automation | Seamless KYC |
| Operational efficiency | Multi-channel experience |

### Target Users

| User Type | Description | Primary App |
|-----------|-------------|-------------|
| **Bank Admin** | Manages platform, users, campaigns | bfc-web |
| **Branch Manager** | Approvals, branch operations | bfc-web |
| **Relationship Manager** | Customer management | bfc-web / bfc-staff-app |
| **Field Agent** | KYC verification, collections | bfc-staff-app |
| **Customer** | Banking services | bfc-customer-app |

---

## Core Modules

### 1. Customer 360

The unified view of a customer across all touchpoints and products.

**Components:**
- **Profile Management** - Demographics, KYC status, contact info
- **Product Portfolio** - All active products (loans, accounts, cards)
- **Behavioral Episodes** - Historical interactions and outcomes
- **Risk Scoring** - Real-time risk and trust scores
- **Life Events** - Detected life events (marriage, job change, etc.)
- **Churn Prediction** - Probability of customer leaving

**Data Sources:**
```
┌─────────────────────────────────────────────────────────────┐
│                     Customer 360 View                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CBS Data ──────┐                                          │
│                 │                                          │
│  Transactions ──┼──> Customer    ┌─> Risk Score            │
│                 │    Profile     │                         │
│  KYC Documents ─┤               ├─> Trust Score            │
│                 │               │                         │
│  Behavioral ────┤               └─> Segment               │
│  Episodes       │                                          │
│                 │                                          │
│  External ──────┘                                          │
│  (Bureau, AML)                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Credit Decisioning

AI-powered loan approval system with <5 minute decisions.

**Decision Flow:**
1. **Application Capture** - Collect applicant and loan details
2. **Policy Checks** - Validate against product policies
3. **Risk Assessment** - Calculate risk grade (A-F)
4. **Pattern Matching** - Find similar historical cases from EON
5. **AI Analysis** - Claude-based decision recommendation
6. **Final Decision** - Approve/Reject/Review with terms

**Supported Products:**
- Home Loan
- Personal Loan
- Car Loan
- Business Loan
- Credit Card
- Overdraft

**Decision Outcomes:**
| Outcome | Description | Next Step |
|---------|-------------|-----------|
| APPROVED | Auto-approved | Disbursement |
| CONDITIONAL_APPROVAL | Approved with conditions | Fulfill conditions |
| MANUAL_REVIEW | Needs human review | Sent to approver |
| REJECTED | Does not meet criteria | Rejection letter |

### 3. Offer Engine

Personalized product recommendations based on customer behavior.

**How It Works:**
```
Customer     ──> Behavioral   ──> Eligibility ──> Relevance  ──> Offers
Profile          Analysis         Check           Scoring        Ranked
```

**Offer Types:**
- Cross-sell (new products)
- Up-sell (upgrade existing)
- Retention (prevent churn)
- Reactivation (dormant customers)

**Offer Lifecycle:**
```
GENERATED → QUEUED → SHOWN → CLICKED → CONVERTED
                              ↓
                          REJECTED / EXPIRED
```

### 4. Notification System

Multi-channel communication with role-based access control.

**Channels:**
| Channel | Use Cases | Delivery |
|---------|-----------|----------|
| Push | Alerts, offers | Firebase/APNS |
| In-App | Real-time updates | WebSocket |
| Email | Statements, KYC | SMTP/SES |
| SMS | OTP, reminders | MSG91/Twilio |
| WhatsApp | Premium support | Business API |
| Webhook | System integration | HTTP POST |

**Access Control:**
- **RBAC** - Role-based permissions (who can send what)
- **ABAC** - Attribute-based policies (when, where, to whom)

### 5. Compliance Module

Regulatory compliance automation.

**KYC Services:**
- PAN verification
- Aadhaar eKYC (with OTP)
- GSTIN validation
- Bank account verification (penny drop)
- DigiLocker integration

**AML Services:**
- Watchlist screening (OFAC, UN, RBI)
- PEP (Politically Exposed Person) check
- Transaction monitoring
- STR/CTR reporting

**Tax Services:**
- TDS calculation (all sections)
- GST calculation (CGST, SGST, IGST)
- Form 26AS generation

### 6. Analytics & Reporting

Business intelligence and operational reporting.

**Dashboards:**
- Executive summary
- Customer acquisition funnel
- Credit performance
- Campaign ROI
- Compliance status
- Risk heatmaps

**Reports:**
| Report | Frequency | Audience |
|--------|-----------|----------|
| Daily Operations | Daily | Branch Manager |
| Credit Portfolio | Weekly | Credit Head |
| AML Summary | Weekly | Compliance Officer |
| NPA Monitoring | Monthly | Risk Committee |
| Regulatory | As required | Regulator |

---

## User Journeys

### Customer Onboarding

```
1. Download App
      │
2. Phone Verification (OTP)
      │
3. Basic KYC
   ├── PAN Entry
   ├── Aadhaar eKYC
   └── Photo Capture
      │
4. Bank Account Linking
      │
5. Product Selection
      │
6. Credit Check (if applicable)
      │
7. Account Activation
```

### Loan Application (Customer)

```
1. Check Eligibility
      │
2. Select Product & Amount
      │
3. Upload Documents
      │
4. Review Terms
      │
5. Submit Application
      │
6. Await Decision (<5 min)
      │
7. Accept Offer / Reject
      │
8. e-Sign Agreement
      │
9. Disbursement
```

### Field Verification (Staff)

```
1. Receive Assignment
      │
2. View Customer Details
      │
3. Navigate to Location
      │
4. Verify Documents
   ├── Scan Aadhaar
   ├── Scan Address Proof
   └── Capture Photo
      │
5. Record Observations
      │
6. Submit Verification
      │
7. Auto-update KYC Status
```

---

## Feature Reference

### Customer Features

| Feature | Description | Status |
|---------|-------------|--------|
| Account Overview | View balances, recent transactions | ✅ |
| Offers | Personalized product offers | ✅ |
| Loan Application | Apply for loans in-app | ✅ |
| KYC Update | Update documents | ✅ |
| Support Chat | AI-powered support | 🔜 |
| Rewards | Loyalty points | 🔜 |

### Staff Features

| Feature | Description | Status |
|---------|-------------|--------|
| Customer Lookup | Search and view customers | ✅ |
| Quick KYC | Scan and verify documents | ✅ |
| Field Operations | Visit management | ✅ |
| Approvals | Approve pending requests | ✅ |
| Reports | Operational reports | ✅ |

### Admin Features

| Feature | Description | Status |
|---------|-------------|--------|
| Dashboard | KPIs and metrics | ✅ |
| Customer Management | Full customer 360 | ✅ |
| Campaign Management | Create and manage campaigns | ✅ |
| Credit Management | Monitor credit decisions | ✅ |
| Compliance | AML alerts, KYC status | ✅ |
| User Management | Staff and role management | ✅ |
| Settings | System configuration | ✅ |

---

## Integration Points

### Core Banking System (CBS)

```
BFC ←→ CBS Adapter ←→ Finacle / Flexcube / TCS BaNCS
         │
         ├── Customer Sync
         ├── Account Sync
         ├── Transaction Fetch
         └── Product Booking
```

**Supported CBS:**
- Infosys Finacle
- Oracle Flexcube
- TCS BaNCS
- Custom (via adapter)

### ANKR Services

| Service | Purpose | Integration |
|---------|---------|-------------|
| AI Proxy | LLM gateway | REST API |
| EON Memory | Behavioral memory | REST API |
| Complymitra | Compliance | REST API |

### External Services

| Service | Purpose |
|---------|---------|
| Credit Bureau (CIBIL, Experian) | Credit scores |
| DigiLocker | eKYC documents |
| NPCI (UPI) | Payments |
| GSTN | GST validation |
| UIDAI | Aadhaar verification |

---

## Glossary

| Term | Definition |
|------|------------|
| **ABAC** | Attribute-Based Access Control |
| **AML** | Anti-Money Laundering |
| **CBS** | Core Banking System |
| **CIF** | Customer Information File |
| **CTR** | Cash Transaction Report |
| **DPD** | Days Past Due |
| **EMI** | Equated Monthly Installment |
| **EON** | ANKR's behavioral memory system |
| **FOIR** | Fixed Obligations to Income Ratio |
| **GSTIN** | GST Identification Number |
| **KYC** | Know Your Customer |
| **LTV** | Loan to Value ratio |
| **NPA** | Non-Performing Asset |
| **PEP** | Politically Exposed Person |
| **RBAC** | Role-Based Access Control |
| **STR** | Suspicious Transaction Report |
| **TBI** | Transaction Behavioral Intelligence |
| **TDS** | Tax Deducted at Source |
