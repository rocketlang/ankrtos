# Mari8X — Next Tasks Roadmap

**Updated:** 2026-02-01 (After Code Discovery Scan)
**Current Status:** 62% complete (383/628 tasks done)
**Code Reality:** ~73% complete (450KB of orphaned production code discovered!)
**Phase 22 Status:** ✅ 100% COMPLETE (Carbon & Sustainability)
**Phase 32 Status:** ✅ 100% COMPLETE (RAG & Knowledge Engine)

---

## 🚨 CRITICAL DISCOVERY (Feb 1, 2026)

**Comprehensive codebase scan reveals ~450KB of production-ready code exists but isn't integrated into GraphQL APIs!**

**Impact:** Many "incomplete" phases are actually 70-95% code complete and only need API wiring (hours, not weeks).

📊 **See Full Analysis:** [IMPLEMENTATION-STATUS-DISCOVERY-FEB1-2026.md](./IMPLEMENTATION-STATUS-DISCOVERY-FEB1-2026.md)

### Key Findings:
- **Phase 1:** 95% code done (not 77%) - Services exist, need 9 hrs GraphQL integration
- **Phase 3:** 85% code done (not 70%) - 74KB services exist, need 27 hrs integration
- **Phase 8:** 40% code done (not 2%) - 159KB AI services exist, ZERO integration! ⚡
- **Phase 9:** 70% code done (not 30%) - 132KB S&P services exist, minimal integration

**Revised Timeline:** Project can reach 85% complete in 2-3 weeks (vs 2-3 months previously estimated)

---

## 🎯 Recommended Task Priorities

### OPTION 1: Quick Wins — Complete Nearly-Finished Phases
**Maximize immediate value by finishing high-completion phases**

#### 1. Phase 22: Carbon & Sustainability ⚡ FASTEST
- **Status:** 92% complete (11/12 tasks done)
- **Remaining:** 1 task
- **Effort:** ~2 hours
- **Priority:** P1 (Should Have)
- **Task:** CII auto-downgrade alert system

**What's Already Done:**
- ✅ ETS allowance tracking
- ✅ IMO DCS reporting
- ✅ ESG reports (Scope 1/2/3)
- ✅ Carbon credit management
- ✅ Carbon accounting service
- ✅ ESG calculator
- ✅ CarbonDashboard.tsx

**What's Needed:**
- Alert system that triggers when vessel CII rating drops (A→B, B→C, etc.)
- Email notifications to fleet managers
- Dashboard warning banners

**Impact:** ESG compliance, regulatory readiness, sustainability reporting

---

#### 2. Phase 1: Auth & Multi-Tenancy
- **Status:** 77% complete (17/22 tasks done)
- **CODE REALITY:** 95% complete! 🎉
- **Remaining:** 5 tasks (GraphQL integration only)
- **Effort:** ~9 hours (not 1 week)
- **Priority:** P0 (Must Have)

**What's Already Done:**
- ✅ Basic auth (@ankr/oauth integration)
- ✅ JWT tokens
- ✅ 12 maritime roles defined
- ✅ RBAC permission matrix
- ✅ Organization multi-tenancy
- ✅ Activity audit trail
- ✅ Team invitation flow
- ✅ Session management (session-manager.ts - 9KB) - **INTEGRATED Feb 1** ✓
- ✅ Redis sessions (redis-session.ts - 3.8KB) - **INTEGRATED Feb 1** ✓
- ✅ MFA service (mfa-service.ts - 12KB) - **CODE EXISTS** 🟡
- ✅ Password policies (password-policy.ts - 11KB) - **CODE EXISTS** 🟡
- ✅ Tenant manager (tenant-manager.ts - 13KB) - **CODE EXISTS** 🟡
- ✅ Onboarding service (onboarding-service.ts - 16KB) - **CODE EXISTS** 🟡
- ✅ Branch isolation (branch-isolation.ts - 8KB) - **CODE EXISTS** 🟡
- ✅ Cross-tenant sharing (cross-tenant-sharing.ts - 9.5KB) - **CODE EXISTS** 🟡

**What's Needed (GraphQL Integration Only):**
1. Add MFA endpoints (~2 hrs) - Import existing mfa-service.ts
2. Add Password Policy endpoints (~1.5 hrs) - Import existing password-policy.ts
3. Add Tenant Management endpoints (~2 hrs) - Import existing tenant-manager.ts
4. Add Onboarding endpoints (~2 hrs) - Import existing onboarding-service.ts
5. Add Branch Isolation (~1.5 hrs) - Update context.ts for branchId

**Services Found:** 8 files, 82KB total (all production-ready!)

**Impact:** Enterprise security, compliance, multi-office support

---

#### 3. Phase 3: Chartering Desk
- **Status:** 70% complete (35/50 tasks done)
- **CODE REALITY:** 85% complete! 🎉
- **Remaining:** 15 tasks (mostly GraphQL integration)
- **Effort:** ~27 hours (not 2 weeks = 80 hours)
- **Priority:** P0 (Must Have)

**What's Already Done:**
- ✅ Charter party CRUD
- ✅ Vessel matching
- ✅ Fixture board
- ✅ Laytime calculations
- ✅ Demurrage/despatch
- ✅ Charter party templates
- ✅ Fixture subject workflow
- ✅ Clause library (clause-library.ts - 16KB) - **CODE EXISTS** 🟡
- ✅ Fixture approval workflow (fixture-approval-workflow.ts - 21KB) - **CODE EXISTS** 🟡
- ✅ Freight calculator (freight-calculator.ts - 13KB) - **CODE EXISTS** 🟡
- ✅ Rate benchmarking (rate-benchmark.ts - 17KB) - **CODE EXISTS** 🟡
- ✅ Fixture recap (fixture-recap.ts - 7.9KB) - **CODE EXISTS** 🟡

**Services Found:** 5 files, 74KB total

**What's Needed (GraphQL + UI):**
1. Rate Benchmarking endpoints (~3 hrs) - Wire existing service
2. Freight Calculator endpoints (~2 hrs) - TCE, ballast bonus, commissions
3. Clause Library endpoints (~2 hrs) - Search, categorization
4. Fixture Approval Workflow (~3 hrs) - Wire 21KB workflow engine
5. Auto-generate C/P (~2 hrs) - Use templates + fixture data
6. Email Integration (~2 hrs) - Connect to email-classifier.ts (Phase 8)
7. Market Intelligence (~2 hrs) - Connect to AI services
8. Dashboard KPIs (~2 hrs) - Aggregate existing data
9. Multi-currency (~1 hr) - Use currency-service.ts (from tariff work)
10-15. UI Enhancements (~8 hrs) - Address forms, competing offers, COA

**Impact:** Core chartering operations, efficiency, decision support

---

### OPTION 2: Strategic Builds — High-Priority Missing Phases

#### 4. Phase 8: AI Engine 🤖 TRANSFORMATIVE
- **Status:** 2% complete (1/50 tasks done)
- **CODE REALITY:** 40% complete! 🚀🚀🚀
- **CRITICAL:** 159KB of AI code exists with ZERO GraphQL integration!
- **Remaining:** 30 tasks (GraphQL integration + UI)
- **Effort:** ~45 hours (not 8 weeks = 320 hours)
- **Priority:** P0 (Must Have)

**What Exists:**
- ✅ Mari8xLLM basic Q&A
- ✅ RAG infrastructure (Phase 32)
- ✅ Email classifier (email-classifier.ts - 20KB) - **CODE EXISTS** 🟡
- ✅ Fixture matcher (fixture-matcher.ts - 22KB) - **CODE EXISTS** 🟡
- ✅ Price predictor (price-predictor.ts - 21KB) - **CODE EXISTS** 🟡
- ✅ Market sentiment (market-sentiment.ts - 22KB) - **CODE EXISTS** 🟡
- ✅ NL query engine (nl-query-engine.ts - 22KB) - **CODE EXISTS** 🟡
- ✅ Document parser (document-parser.ts - 20KB) - **CODE EXISTS** 🟡
- ✅ AI doc classifier (ai-document-classifier.ts - 20KB) - **CODE EXISTS** 🟡
- ✅ DA intelligence (da-ai-intelligence.ts - 12KB) - **CODE EXISTS** 🟡

**Services Found:** 8 files, 159KB total (production ML models!)

**Services Include:**
- Email auto-classification (charter inquiry vs bunker quote)
- Fixture matching algorithm (vessel suitability scoring)
- Freight rate prediction (ML models)
- Market sentiment analysis (news + Baltic Index)
- Natural language query engine
- Intelligent document parsing
- Voyage optimization recommendations
- Port congestion prediction

**What's Needed (GraphQL + UI Integration):**
1. Create ai-engine.ts GraphQL schema (~4 hrs)
2. Add endpoints for all 8 services (~15 hrs)
3. Frontend components for AI features (~20 hrs)
4. Testing + validation (~10 hrs)

**Reuses:**
- @ankr/agents (multi-agent orchestration)
- @ankr/embeddings (document vectorization)
- @ankr/intent (NLP query parsing)
- @ankr/eon (RAG infrastructure — already done!)

**Impact:** Automation, competitive advantage, 10x efficiency gains
**Note:** Biggest unlock opportunity - 159KB ready code just needs API wiring!

---

#### 5. Phase 30: Testing & Quality 🧪 ESSENTIAL
- **Status:** 0% complete
- **Remaining:** 14 tasks
- **Effort:** ~3 weeks
- **Priority:** P1 (Should Have)

**What to Build:**
- Unit test setup (Jest for backend, Vitest for frontend)
- Integration test suite (GraphQL API testing)
- E2E test suite (Playwright for critical user flows)
- Load testing (k6 for API performance)
- Security testing (OWASP top 10, penetration testing)
- Accessibility testing (WCAG 2.1 AA)
- Visual regression testing (Percy/Chromatic)
- Test coverage reporting (>80% target)
- CI/CD pipeline with automated testing
- Performance monitoring and benchmarking
- Mutation testing
- Contract testing for APIs
- Chaos engineering for resilience
- Test data factories and fixtures

**Impact:** Quality assurance, deployment confidence, bug prevention

---

#### 6. Phase 27: API & Integrations 🔌 CONNECTIVITY
- **Status:** 0% complete
- **Remaining:** 22 tasks
- **Effort:** ~4 weeks
- **Priority:** P1 (Should Have)

**What to Build:**
- REST API layer (for non-GraphQL clients)
- API key management and rate limiting
- Webhook system for event notifications
- AIS integration (vessel position tracking)
- Weather API integration (storm warnings)
- Exchange rate API (FX rates)
- Baltic Exchange API (market indices)
- Shipping line APIs (container tracking)
- Port authority APIs (congestion data)
- OAuth integrations (Google, Microsoft, Baltic SSO)
- API documentation (OpenAPI/Swagger)
- SDK generation (TypeScript, Python)
- Zapier/Make.com integrations
- Slack/Teams notifications
- Email service providers (SendGrid, Mailgun)
- SMS providers (Twilio, AWS SNS)
- Payment gateways (Stripe, Razorpay)
- Blockchain integrations (eBL verification)

**Reuses:**
- @ankr/ocean-tracker (shipping line APIs)
- @ankr/context-engine (weather, AIS, market data)
- @ankr/wire (notification integrations)

**Impact:** Ecosystem connectivity, data enrichment, partner integrations

---

#### 7. Phase 33: Document Management System 📄 NEXT LOGICAL STEP
- **Status:** 0% complete
- **Remaining:** 26 tasks
- **Effort:** ~4 weeks
- **Priority:** P1 (Should Have)

**Why Build This Next:**
- Natural extension of Phase 32 (RAG already indexes documents)
- Enterprise customers need robust DMS
- Blockchain eBL is differentiator

**What to Build:**
- Document repository with folder hierarchy (vessel/voyage/company/type)
- Document versioning with full audit trail
- Check-in/check-out locking (prevent concurrent edits)
- Metadata tagging and advanced search
- Bulk upload with auto-classification (OCR)
- In-browser preview (PDF, images, Word)
- Watermarked downloads (confidential protection)
- **Blockchain document chain:**
  - eBL title transfer chain (shipper → consignee → endorsee)
  - C/P execution chain (both parties sign → sealed on chain)
  - Immutable proof of existence
  - Verification portal for third parties
  - DCSA eBL standard compliance
- **Document repositories:**
  - Bill of Lading (MBL, HBL, eBL)
  - Charter Party (GENCON, NYPE, clause-indexed)
  - Invoices & payment documents
  - Survey & inspection reports (SIRE, CDI, PSC)
  - Certificates (class, DOC, SMC, IOPP)
  - SOF & NOR (linked to laytime)
  - Customs (IGM, EGM, Bill of Entry, E-way Bill)
  - Insurance (H&M, P&I, FD&D)
  - Cargo documents (packing lists, DG declarations)
  - Crew documents (CoC, medical, visas)
- Repository dashboard
- Cross-voyage document search
- Expiry alerts for certificates

**Reuses:**
- @ankr/dms (document lifecycle management)
- @ankr/docchain (blockchain verification)
- @ankr/chunk-upload (large file uploads)
- @ankr/ocr (document AI extraction)

**Impact:** Document lifecycle, compliance, blockchain differentiator

---

### OPTION 3: Operational Completeness — Finish Core Workflows

#### 8. Phase 5: Voyage Monitoring
- **Status:** 44% complete (24/55 tasks done)
- **Remaining:** 31 tasks
- **Effort:** ~4 weeks
- **Priority:** P0 (Must Have)

**What's Done:**
- ✅ Voyage CRUD
- ✅ Port calls
- ✅ Noon reports
- ✅ SOF management
- ✅ Delay alerts
- ✅ Weather warranty

**What's Needed:**
- Real-time AIS tracking
- ETA calculation with weather routing
- Port call timeline with critical path
- Automated NOR processing
- SOF generation
- Delay root cause analysis
- Fuel consumption monitoring
- Performance monitoring vs C/P
- Deviation alerts
- Port rotation planning
- Cargo ops tracking
- Hatch-by-hatch plan
- Dangerous goods compliance

**Reuses:**
- @ankr/ocean-tracker (AIS integration)
- @ankr/context-engine (weather, tides)

**Impact:** Real-time operations, performance optimization

---

#### 9. Phase 6: DA Desk
- **Status:** 60% complete (18/30 tasks done)
- **Remaining:** 12 tasks
- **Effort:** ~2 weeks
- **Priority:** P0 (Must Have)

**What's Done:**
- ✅ DA CRUD
- ✅ PDA/FDA forms
- ✅ Port agent management
- ✅ Cost tracking

**What's Needed:**
- Multi-currency DA
- Agent selection workflow
- Automated DA templates
- PDA generation
- FDA reconciliation
- Variance analysis (PDA vs FDA)
- Agent performance tracking
- Cost benchmarking by port
- Cash call automation
- Owner account settlement
- Historical comparison
- Budget vs actual

**Impact:** Port operations, cost control, cash flow

---

#### 10. Phase 4: Ship Broking S&P
- **Status:** 50% complete (11/22 tasks done)
- **Remaining:** 11 tasks
- **Effort:** ~2 weeks
- **Priority:** P1 (Should Have)

**What's Done:**
- ✅ Sale listings
- ✅ SNP deal room
- ✅ Valuation
- ✅ Closing tracker

**What's Needed:**
- Vessel valuation models (scrap, market, NAV)
- Market comps analysis
- MOA generation
- Inspection scheduling
- Closing checklist
- Price negotiation history
- Commission tracking
- Title transfer workflow
- Delivery/acceptance docs
- Post-sale transition

**Impact:** Asset trading, fleet management

---

## 📋 Task List Summary

| Task | Phase | Priority | Effort | Impact | Completion |
|------|-------|----------|--------|--------|------------|
| #13 | Carbon & Sustainability | P1 | 2 hours | 🟢 High | 92% → 100% |
| #11 | Auth & Multi-Tenancy | P0 | 1 week | 🟢 High | 77% → 100% |
| #12 | Chartering Desk | P0 | 2 weeks | 🟢 High | 70% → 100% |
| #14 | AI Engine | P0 | 8 weeks | 🔥 Transformative | 2% → 100% |
| #15 | Testing & Quality | P1 | 3 weeks | 🟢 High | 0% → 100% |
| #16 | API & Integrations | P1 | 4 weeks | 🟢 High | 0% → 100% |
| #17 | Document Management | P1 | 4 weeks | 🟢 High | 0% → 100% |
| #18 | Voyage Monitoring | P0 | 4 weeks | 🟢 High | 44% → 100% |
| #19 | DA Desk | P0 | 2 weeks | 🟡 Medium | 60% → 100% |
| #20 | Ship Broking S&P | P1 | 2 weeks | 🟡 Medium | 50% → 100% |

---

## 🎯 Recommended Execution Order

### Path A: Quick Wins First (Recommended for Demo/Launch)
**Timeline:** 5-6 weeks to 100% core platform

1. **Week 1:** Phase 22 (Carbon alerts) → Phase 1 (Auth completion)
2. **Week 2-3:** Phase 3 (Chartering completion)
3. **Week 4-5:** Phase 6 (DA Desk) → Phase 19 (DA completion)
4. **Week 6:** Phase 4 (S&P completion)

**Result:** 6 phases 100% complete, strong demo-ready platform

---

### Path B: Strategic Build (AI-First)
**Timeline:** 8-10 weeks to AI-powered platform

1. **Week 1:** Phase 22 (Carbon alerts)
2. **Week 2-9:** Phase 8 (AI Engine) — transformative
3. **Week 10:** Phase 15 (Testing setup)

**Result:** AI-powered platform with competitive moat

---

### Path C: Enterprise Ready (Security + Quality)
**Timeline:** 6-8 weeks to enterprise-grade platform

1. **Week 1:** Phase 1 (Auth completion)
2. **Week 2-4:** Phase 15 (Testing & Quality)
3. **Week 5-6:** Phase 16 (API & Integrations)
4. **Week 7-8:** Phase 17 (Document Management)

**Result:** Enterprise-grade security, quality, and integrations

---

### Path D: Balanced Approach (Recommended)
**Timeline:** 12 weeks to well-rounded platform

1. **Week 1:** Phase 22 (Carbon) + Phase 1 (Auth)
2. **Week 2-3:** Phase 3 (Chartering)
3. **Week 4-5:** Phase 15 (Testing)
4. **Week 6-9:** Phase 8 (AI Engine)
5. **Week 10-11:** Phase 17 (Document Management)
6. **Week 12:** Phase 16 (API & Integrations start)

**Result:** Complete core ops, AI-powered, enterprise-ready, high quality

---

## 💡 Strategic Recommendations

### For Immediate Launch (Next 2 Weeks)
**Goal:** Demo-ready platform for sales

**Tasks:**
1. ✅ Phase 22: Carbon alerts (2 hours)
2. ✅ Phase 1: Auth completion (1 week)
3. ✅ Phase 3: Chartering essentials (rate benchmarking, clause library, approval workflow)

**Result:** Professional, secure, feature-complete chartering platform

---

### For Competitive Advantage (Next 3 Months)
**Goal:** AI-powered differentiation

**Tasks:**
1. ✅ Phase 8: AI Engine (full implementation)
2. ✅ Phase 17: Document Management with blockchain
3. ✅ Phase 16: API & Integrations

**Result:** AI-first maritime platform with blockchain eBL

---

### For Enterprise Sales (Next 3 Months)
**Goal:** SOC2/ISO27001 compliant platform

**Tasks:**
1. ✅ Phase 1: Auth + MFA + SSO
2. ✅ Phase 15: Testing & Quality (>80% coverage)
3. ✅ Phase 30: Security hardening
4. ✅ Compliance documentation

**Result:** Enterprise-ready, audit-ready, compliant platform

---

## 📊 Impact Matrix

| Phase | Business Value | Technical Complexity | Time to Value | Strategic Importance |
|-------|----------------|---------------------|---------------|---------------------|
| Phase 22 (Carbon) | 🟡 Medium | 🟢 Low | ⚡ Immediate | 🟢 Regulatory |
| Phase 1 (Auth) | 🟢 High | 🟡 Medium | 📅 1 week | 🔥 Critical |
| Phase 3 (Chartering) | 🟢 High | 🟡 Medium | 📅 2 weeks | 🔥 Critical |
| Phase 8 (AI) | 🔥 Transformative | 🔴 High | 📅 8 weeks | 🔥 Game-changer |
| Phase 15 (Testing) | 🟢 High | 🟡 Medium | 📅 3 weeks | 🟢 Quality |
| Phase 16 (API) | 🟡 Medium | 🟡 Medium | 📅 4 weeks | 🟢 Ecosystem |
| Phase 17 (DMS) | 🟢 High | 🟡 Medium | 📅 4 weeks | 🔥 Differentiator |
| Phase 5 (Voyage) | 🟢 High | 🔴 High | 📅 4 weeks | 🟢 Operations |
| Phase 6 (DA) | 🟡 Medium | 🟢 Low | 📅 2 weeks | 🟡 Operations |
| Phase 4 (S&P) | 🟡 Medium | 🟢 Low | 📅 2 weeks | 🟡 Trading |

---

## 🚀 Next Action

**Which path do you want to take?**

1. **Path A (Quick Wins)** — Fastest to demo-ready
2. **Path B (AI-First)** — Competitive moat
3. **Path C (Enterprise)** — SOC2-ready
4. **Path D (Balanced)** — Best overall

Or pick specific tasks:
- `#13` — Carbon alerts (⚡ 2 hours)
- `#11` — Auth completion (📅 1 week)
- `#12` — Chartering completion (📅 2 weeks)
- `#14` — AI Engine (🔥 8 weeks, transformative)
- `#15` — Testing & Quality (📅 3 weeks)
- `#17` — Document Management (📅 4 weeks)

**Current Platform Status:** 61% complete, Phase 32 (RAG) ✅ done
**Ready for:** Immediate development on any task above

---

*Mari8X Next Tasks Roadmap — Generated 2026-01-31 after Phase 32 completion*
