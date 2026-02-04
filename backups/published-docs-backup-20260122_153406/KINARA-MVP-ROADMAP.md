# Kinara - MVP Roadmap

> Detailed timeline and milestones for Kinara MVP

---

## Tags
`Planning` `Releases` `Roadmap` `API` `Database` `AI/ML` `Frontend` `Backend`

---

## MVP Definition

### What's IN MVP

- Core API (auth, users, devices, readings, predictions)
- Sensor SDK (BLE + Apple HealthKit)
- Hot Flash Prediction model (cloud)
- Basic insights/analytics
- Multi-tenant architecture
- Developer documentation
- 3 pilot customers live

### What's NOT in MVP

- Edge ML (device-side inference)
- White-label app shell
- Advanced analytics dashboard
- Hardware reference designs (separate track)
- Ayurveda/nutrition modules
- Community features

---

## Timeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         MVP ROADMAP (24 WEEKS)                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PHASE 1: FOUNDATION                                                            │
│  ════════════════════                                                           │
│  Week 1-4                                                                       │
│  ┌─────┬─────┬─────┬─────┐                                                     │
│  │  1  │  2  │  3  │  4  │                                                     │
│  ├─────┴─────┴─────┴─────┤                                                     │
│  │ Setup │ Schema│ Core │ Auth │                                               │
│  │ Repo  │ Design│ API  │ Done │                                               │
│  └───────────────────────┘                                                     │
│                                                                                 │
│  PHASE 2: DATA PIPELINE                                                         │
│  ═══════════════════════                                                        │
│  Week 5-8                                                                       │
│  ┌─────┬─────┬─────┬─────┐                                                     │
│  │  5  │  6  │  7  │  8  │                                                     │
│  ├─────┴─────┴─────┴─────┤                                                     │
│  │Ingest│Query │Sensor│ SDK │                                                  │
│  │ API  │ API  │ SDK  │ v1  │                                                  │
│  └───────────────────────┘                                                     │
│                                                                                 │
│  PHASE 3: ML & ANALYTICS                                                        │
│  ════════════════════════                                                       │
│  Week 9-14                                                                      │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┐                                         │
│  │  9  │ 10  │ 11  │ 12  │ 13  │ 14  │                                         │
│  ├─────┴─────┴─────┴─────┴─────┴─────┤                                         │
│  │ ML Train │ ML Serve│ Insights │ Polish │                                    │
│  │ HotFlash │ Predict │ Analytics│  API   │                                    │
│  └───────────────────────────────────┘                                         │
│                                                                                 │
│  PHASE 4: INTEGRATION & POLISH                                                  │
│  ══════════════════════════════                                                 │
│  Week 15-18                                                                     │
│  ┌─────┬─────┬─────┬─────┐                                                     │
│  │ 15  │ 16  │ 17  │ 18  │                                                     │
│  ├─────┴─────┴─────┴─────┤                                                     │
│  │ Third │ WebSkt│ Docs │Testing│                                              │
│  │ Party │ Stream│Portal│ & QA │                                               │
│  └───────────────────────┘                                                     │
│                                                                                 │
│  PHASE 5: PILOT & LAUNCH                                                        │
│  ════════════════════════                                                       │
│  Week 19-24                                                                     │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┐                                         │
│  │ 19  │ 20  │ 21  │ 22  │ 23  │ 24  │                                         │
│  ├─────┴─────┴─────┴─────┴─────┴─────┤                                         │
│  │ Pilot 1│ Pilot 2│ Pilot 3│  GA   │                                          │
│  │Onboard │Onboard │Onboard │Launch │                                          │
│  └───────────────────────────────────┘                                         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation (Weeks 1-4)

### Week 1: Project Setup

| Task | Owner | Status |
|------|-------|--------|
| Initialize monorepo (pnpm workspaces) | Dev | ✅ |
| Setup TypeScript + ESLint + Prettier | Dev | ✅ |
| Create Docker Compose for local dev | Dev | 🔲 |
| Setup GitHub repo + CI/CD | Dev | 🔲 |
| Create project documentation structure | Dev | ✅ |
| Define coding standards | Dev | 🔲 |

**Deliverables:**
- Working development environment
- CI pipeline (lint, test, build)
- Documentation structure

### Week 2: Database Design

| Task | Owner | Status |
|------|-------|--------|
| Design PostgreSQL schema (tenants, users, devices) | Dev | 🔲 |
| Setup TimescaleDB for readings | Dev | 🔲 |
| Create Prisma/Drizzle models | Dev | 🔲 |
| Write migration scripts | Dev | 🔲 |
| Design data retention policies | Dev | 🔲 |
| Setup Redis for caching | Dev | 🔲 |

**Deliverables:**
- Complete database schema
- Migration system working
- Local DB running in Docker

### Week 3: Core API Structure

| Task | Owner | Status |
|------|-------|--------|
| Setup Fastify server | Dev | 🔲 |
| Implement health check endpoint | Dev | 🔲 |
| Create route structure | Dev | 🔲 |
| Setup Zod validation | Dev | 🔲 |
| Implement error handling | Dev | 🔲 |
| Setup logging (Pino) | Dev | 🔲 |

**Deliverables:**
- Running API server
- Basic routing structure
- Request validation working

### Week 4: Authentication

| Task | Owner | Status |
|------|-------|--------|
| Implement JWT authentication | Dev | 🔲 |
| Create API key system for devices | Dev | 🔲 |
| Build tenant management endpoints | Dev | 🔲 |
| Implement RBAC basics | Dev | 🔲 |
| Add rate limiting | Dev | 🔲 |
| Write auth tests | Dev | 🔲 |

**Deliverables:**
- Complete auth system
- API key generation
- Rate limiting working

---

## Phase 2: Data Pipeline (Weeks 5-8)

### Week 5: Ingestion API

| Task | Owner | Status |
|------|-------|--------|
| Create readings ingestion endpoint | Dev | 🔲 |
| Implement batch ingestion | Dev | 🔲 |
| Add data validation | Dev | 🔲 |
| Build normalization layer | Dev | 🔲 |
| Setup async job queue (BullMQ) | Dev | 🔲 |
| Write ingestion tests | Dev | 🔲 |

**Deliverables:**
- Working ingestion API
- Batch processing (1000+ readings)
- Quality scoring

### Week 6: Query API

| Task | Owner | Status |
|------|-------|--------|
| Implement readings query endpoint | Dev | 🔲 |
| Add time-range filtering | Dev | 🔲 |
| Build aggregation queries | Dev | 🔲 |
| Create latest readings endpoint | Dev | 🔲 |
| Add pagination | Dev | 🔲 |
| Optimize query performance | Dev | 🔲 |

**Deliverables:**
- Full query API
- Aggregations (hourly, daily)
- Sub-100ms query latency

### Week 7: Sensor SDK (Core)

| Task | Owner | Status |
|------|-------|--------|
| Design SDK architecture | Dev | 🔲 |
| Create @kinara/sdk-core package | Dev | 🔲 |
| Implement HTTP client | Dev | 🔲 |
| Add offline buffering | Dev | 🔲 |
| Build sync manager | Dev | 🔲 |
| Write SDK documentation | Dev | 🔲 |

**Deliverables:**
- Core SDK package
- HTTP client working
- Offline support

### Week 8: Mobile SDK (React Native)

| Task | Owner | Status |
|------|-------|--------|
| Create @kinara/react-native-sdk | Dev | 🔲 |
| Implement BLE scanning | Dev | 🔲 |
| Build device pairing flow | Dev | 🔲 |
| Add data streaming | Dev | 🔲 |
| Integrate HealthKit (iOS) | Dev | 🔲 |
| Create sample app | Dev | 🔲 |

**Deliverables:**
- React Native SDK v0.1
- BLE connectivity working
- Sample app demonstrating features

---

## Phase 3: ML & Analytics (Weeks 9-14)

### Week 9-10: ML Model Training

| Task | Owner | Status |
|------|-------|--------|
| Setup ML training environment | Dev | 🔲 |
| Prepare training dataset | Dev | 🔲 |
| Implement hot flash model | Dev | 🔲 |
| Train and validate model | Dev | 🔲 |
| Export to ONNX format | Dev | 🔲 |
| Document model performance | Dev | 🔲 |

**Deliverables:**
- Trained hot flash prediction model
- ONNX export
- Model card with metrics

### Week 11-12: ML Serving

| Task | Owner | Status |
|------|-------|--------|
| Setup ML service (Python/FastAPI) | Dev | 🔲 |
| Integrate ONNX Runtime | Dev | 🔲 |
| Create prediction API | Dev | 🔲 |
| Implement feature preprocessing | Dev | 🔲 |
| Add model versioning | Dev | 🔲 |
| Write prediction tests | Dev | 🔲 |

**Deliverables:**
- ML service running
- Prediction API working
- <100ms inference latency

### Week 13-14: Insights & Analytics

| Task | Owner | Status |
|------|-------|--------|
| Design insights data model | Dev | 🔲 |
| Implement aggregation jobs | Dev | 🔲 |
| Create insights API endpoints | Dev | 🔲 |
| Build trigger analysis | Dev | 🔲 |
| Add trend calculations | Dev | 🔲 |
| Generate sample reports | Dev | 🔲 |

**Deliverables:**
- Insights API
- Hot flash pattern analysis
- Trigger correlation

---

## Phase 4: Integration & Polish (Weeks 15-18)

### Week 15: Third-Party Integrations

| Task | Owner | Status |
|------|-------|--------|
| Google Health Connect integration | Dev | 🔲 |
| Oura Ring API connector | Dev | 🔲 |
| Webhook system | Dev | 🔲 |
| Event notification service | Dev | 🔲 |

**Deliverables:**
- Health Connect working
- Webhook delivery
- Event notifications

### Week 16: Real-time Features

| Task | Owner | Status |
|------|-------|--------|
| Implement WebSocket server | Dev | 🔲 |
| Build real-time streaming | Dev | 🔲 |
| Add live prediction updates | Dev | 🔲 |
| Create connection management | Dev | 🔲 |

**Deliverables:**
- WebSocket API
- Real-time readings stream
- Live predictions

### Week 17: Documentation Portal

| Task | Owner | Status |
|------|-------|--------|
| Setup documentation site | Dev | 🔲 |
| Write API reference | Dev | 🔲 |
| Create SDK guides | Dev | 🔲 |
| Add code examples | Dev | 🔲 |
| Build interactive API explorer | Dev | 🔲 |

**Deliverables:**
- docs.kinara.health live
- Complete API docs
- SDK quickstart guides

### Week 18: Testing & QA

| Task | Owner | Status |
|------|-------|--------|
| Complete unit test coverage (>80%) | Dev | 🔲 |
| Integration tests | Dev | 🔲 |
| Load testing | Dev | 🔲 |
| Security review | Dev | 🔲 |
| Bug fixes | Dev | 🔲 |

**Deliverables:**
- Test coverage >80%
- Load test results
- Security audit passed

---

## Phase 5: Pilot & Launch (Weeks 19-24)

### Week 19-20: Pilot Customer 1

| Task | Owner | Status |
|------|-------|--------|
| Finalize pilot agreement | Founder | 🔲 |
| Technical onboarding | Dev | 🔲 |
| Integration support | Dev | 🔲 |
| Monitor and debug | Dev | 🔲 |
| Gather feedback | Founder | 🔲 |

**Milestone:** First customer live with real users

### Week 21-22: Pilot Customers 2 & 3

| Task | Owner | Status |
|------|-------|--------|
| Onboard pilot 2 | Dev | 🔲 |
| Onboard pilot 3 | Dev | 🔲 |
| Address feedback from pilot 1 | Dev | 🔲 |
| Performance optimization | Dev | 🔲 |

**Milestone:** 3 customers live

### Week 23-24: GA Launch

| Task | Owner | Status |
|------|-------|--------|
| Production infrastructure setup | Dev | 🔲 |
| Monitoring & alerting | Dev | 🔲 |
| Launch marketing | Founder | 🔲 |
| Pricing page live | Founder | 🔲 |
| Support process ready | Founder | 🔲 |

**Milestone:** General Availability Launch

---

## Milestone Summary

| Milestone | Week | Key Deliverable |
|-----------|------|-----------------|
| M1: Foundation Complete | 4 | Auth + API structure |
| M2: Data Pipeline | 8 | Ingestion + SDK v0.1 |
| M3: ML Working | 12 | Hot flash predictions |
| M4: Integration Ready | 16 | Third-party + WebSocket |
| M5: Docs Complete | 18 | Documentation portal |
| M6: First Pilot Live | 20 | Customer 1 in production |
| M7: MVP GA | 24 | Public launch |

---

## Resource Allocation

### Team (MVP Phase)

| Role | Allocation | Focus |
|------|------------|-------|
| You (Founder/Dev) | 100% | Architecture, core dev, sales |
| Claude (AI Pair) | As needed | Code, docs, problem-solving |
| Advisor (Gynaecologist) | 5% | Content review, clinical input |

### Post-MVP Hiring (If funded)

| Role | When | Priority |
|------|------|----------|
| Full-stack Developer | Month 8 | High |
| DevOps/Infra | Month 10 | Medium |
| Sales/BD | Month 10 | High |
| ML Engineer | Month 12 | Medium |

---

## Dependencies & Risks

### Critical Dependencies

| Dependency | Risk | Mitigation |
|------------|------|------------|
| BLE library compatibility | Medium | Test early on multiple devices |
| ML model accuracy | Medium | Start training early, iterate |
| Pilot customer commitment | High | Multiple in pipeline |
| Third-party API stability | Low | Abstract integrations |

### Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Scope creep | High | Medium | Strict MVP definition |
| Technical blockers | Medium | High | Prototype early |
| Pilot delays | Medium | High | 5 prospects for 3 pilots |
| Solo developer burnout | Medium | High | Realistic timelines |

---

## Success Criteria

### MVP Success = All True

- [ ] 3+ customers live in production
- [ ] 1,000+ end users generating data
- [ ] Hot flash prediction working (>75% accuracy)
- [ ] API uptime >99%
- [ ] NPS >0 from pilot customers
- [ ] ₹3L+ MRR committed

---

## Post-MVP Priorities

1. **Edge ML** - On-device prediction
2. **White-label App** - Faster customer deployment
3. **Hardware Kit** - Reference design production
4. **Ayurveda Module** - India differentiation
5. **Analytics Dashboard** - Customer self-serve

---

*Ship fast, learn faster*
