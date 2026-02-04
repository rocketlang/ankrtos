# ComplyMitra - AI-Powered Compliance Automation

> **Intelligent Compliance Management for Indian Businesses**

**Platform:** ComplyMitra (Ankr Compliance)
**Category:** RegTech / Compliance Automation
**Status:** 100% MVP Complete (12/12 Sprints)
**Estimated Value:** $4-6M

---

## Executive Summary

ComplyMitra is an enterprise-grade, comprehensive SaaS compliance management platform built for Indian businesses. It automates compliance tracking, connects businesses with professional service providers, and manages regulatory deadlines across federal and state governments.

---

## Platform Metrics

| Metric | Value |
|--------|-------|
| **Compliance Rules** | 38+ in YAML format (5,704 lines) |
| **GraphQL APIs** | 59+ fully typed and validated |
| **Database Models** | 50+ Prisma models |
| **React Components** | 50+ web UI components |
| **Test Cases** | 100+ across modules |
| **Development Sprints** | 12 complete (100% MVP) |
| **Lines of Code** | ~25,000 LOC |

---

## Technology Stack

### Backend
- **Framework:** Fastify 4.x
- **GraphQL:** Pothos + Mercurius
- **ORM:** Prisma 5.x
- **Database:** PostgreSQL 16
- **Cache:** Redis 7.x
- **Queue:** BullMQ

### Frontend
- **Framework:** React 18 + Vite
- **Styling:** TailwindCSS
- **GraphQL Client:** Apollo Client
- **Mobile:** Expo + React Native

---

## Compliance Rules Coverage (38 Rules)

### GST (7 Rules)
- GSTR-1: Monthly/Quarterly outward supplies return
- GSTR-3B: Monthly/Quarterly summary return
- GSTR-9: Annual return
- GSTR-9C: Reconciliation statement (CA-certified)
- CMP-08: Composition scheme quarterly statement

### Income Tax (7 Rules)
- ITR-6: Corporate tax returns
- ITR-5: LLP tax returns
- Tax Audit (Form 3CA/3CB/3CD)
- Advance Tax Q1-Q4

### TDS (6 Rules)
- Form 24Q: TDS on salaries (quarterly)
- Form 26Q: TDS on non-salary payments
- Form 27Q: TDS on NRI payments
- Form 27EQ: TCS returns
- Form 16/16A: TDS certificates
- TDS Payment: Monthly deposits

### MCA/ROC (10 Rules)
- AOC-4/AOC-4 XBRL: Financial statements
- MGT-7/MGT-7A: Annual returns
- DIR-3: Director KYC update
- ADT-1: Auditor appointment
- AGM, Board meetings
- Form 11, Form 8: LLP returns

### EPF (3 Rules)
- Monthly contribution payment
- ECR: Electronic Challan cum Return
- Form 3A/6A: Annual return

### ESI (4 Rules)
- Monthly contribution payment
- Monthly return
- Half-yearly return
- Annual return

---

## Core Services & APIs

### Company Management (42+ APIs)
```graphql
query company(id): Company
query companies(filter, pagination): [Company]
mutation createCompany(input): Company
mutation addGstRegistration(): Registration
mutation addEpfRegistration(): Registration
mutation addEsiRegistration(): Registration
```

### Calendar Management (15+ APIs)
```graphql
query companyCalendar(companyId, dateRange): Calendar
query applicableRules(companyId): [Rule]
mutation markComplianceComplete(id): Compliance
query getUpcomingDueItems(companyId): [DueItem]
```

### AI & Intelligence (8+ APIs)
```graphql
mutation analyzeTaxNotice(document): Analysis
query complianceChat(question): Answer
mutation generateCompleteCode(): Code
query suggestActions(): [Action]
```

---

## Rule Engine Capabilities

### Recursive Condition Evaluation
```yaml
rule: gstr-1
applicability:
  conditions:
    - type: AND
      rules:
        - field: turnover
          operator: gte
          value: 4000000  # ₹40 Lakh threshold
        - field: gst_registered
          operator: eq
          value: true
        - type: OR
          rules:
            - field: entity_type
              operator: in
              values: [pvt_ltd, llp, partnership]
```

### 13 Comparison Operators
- eq, ne, gt, gte, lt, lte
- in, notIn, contains, exists
- startsWith, endsWith, regex

### Smart Due Date Calculation
- **6 Base Types:** MONTH_END, QUARTER_END, FY_END, FIXED_DATE, HALF_YEAR_END, PERIOD_END
- **Holiday Adjustment:** 28 state calendars
- **Financial Year Awareness:** April-March handling
- **Extension Management:** Track extended due dates

---

## Portal Integrations

### Government Portals
- **GST Portal** (gst.gov.in)
- **Income Tax e-Filing** (incometax.gov.in)
- **MCA Portal** (mca.gov.in)
- **EPFO Unified Portal** (epfindia.gov.in)
- **ESIC Portal** (esic.in)
- **TRACES Portal** (tdscpc.gov.in)

### Portal Autopilot Features
- Auto-fill return forms using company data
- Digital signature integration
- One-click filing capability
- Filing status tracking
- Document management

---

## Marketplace Features

### Professional Services
- **CA/CS/Lawyer Discovery:** Search and filter professionals
- **Engagement Booking:** Direct booking with escrow payment
- **Smart Matching:** AI-powered professional matching
- **Reviews & Ratings:** Quality assurance

### Marketplace APIs
```graphql
query searchProfessionals(filters): [Professional]
mutation createEngagement(input): Engagement
query getProfessionalReviews(): [Review]
```

---

## AI-Powered Features

### Tax Notice Analyzer
- Document upload (PDF/Image)
- Optical Character Recognition (OCR)
- AI analysis using Claude
- Identify: Notice type, amount, deadline, action required
- Suggest next steps, recommend professional

### Compliance Chatbot
- Natural language questions
- Instant answers about rules
- Portal guidance
- Integration with rule library

### Smart Matching Engine
- Match based on industry sector, compliance needs
- Geographic location, professional expertise
- Rating & reviews, availability

---

## Frontend Features (50+ Components)

### Company Management
- Company registration wizard
- Multi-address support
- Registration tracking (GST, EPF, ESI, PT, LWF)
- Personnel management (Directors, Partners)

### Compliance Calendar
- **Multiple Views:** Month, Week, Day, Quarter, List
- **Filters:** Category, Status, Date range, Assignee
- **Actions:** Mark complete, Extend deadline, Assign professional
- **Export:** Excel, PDF, iCalendar

### Dashboard & Analytics
- Compliance health score
- Upcoming deadlines widget
- Filing history
- Risk alerts

---

## Database Schema

### Core Models (50+ Tables)

**Company Models:**
- Company, CompanyAddress, CompanyPersonnel
- CompanyTurnover, CompanyStateEmployees

**Registration Models:**
- GstRegistration, EpfRegistration, EsiRegistration
- PtRegistration, LwfRegistration

**Compliance Models:**
- ComplianceRule, ComplianceCalendar
- DueDateExtension, CalendarNotification

**Marketplace Models:**
- Professional, Service, Engagement
- Review, Rating, Message

---

## Notification System

### Multi-Channel Notifications
- Email, SMS (Twilio), WhatsApp Business
- Push notifications (Firebase)
- In-app notifications

### Triggers
- Due date approaching (7, 14, 30 days before)
- Due date reached
- Overdue by X days
- Filing status updates

---

## Competitive Advantages

| Feature | ComplyMitra | ClearTax | Zoho |
|---------|-------------|----------|------|
| Auto-Detection | 38 rules | Manual | Manual |
| Holiday Adjustment | 28 states | No | No |
| YAML Rules | Declarative | No | No |
| Rule Engine | Recursive | No | No |
| AI Analysis | Yes | Limited | No |
| Marketplace | Native | No | Limited |

---

## Market Opportunity

- **TAM:** 6.3 Million+ registered businesses in India
- **SAM:** ~3 million MSMEs requiring compliance
- **Revenue Model:** B2B SaaS (₹500-5000/month) + Marketplace commission (10-15%)

---

## Investment Highlights

1. **Complete MVP:** 100% feature-complete (12 sprints delivered)
2. **38 Compliance Rules:** Comprehensive India coverage
3. **AI-Powered:** Notice analysis, chatbot, smart matching
4. **Marketplace:** Integrated professional services
5. **Multi-Platform:** Web + Mobile (iOS/Android)

---

*Document Classification: Investor Confidential*
*Last Updated: 19 Jan 2026*
*Source: /root/ankr-compliance/*
