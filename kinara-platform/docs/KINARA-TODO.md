# Kinara - Master Task List

> Complete technical TODO for building the Kinara platform

---

## Tags
`Tasks` `Sprint` `Planning` `API` `Database` `Authentication` `Testing` `Deployment` `AI/ML` `Frontend` `Backend`

---

## Status Legend

- 🔲 Not Started
- 🔄 In Progress
- ✅ Complete
- ⏸️ Blocked
- ❌ Cancelled

---

## Phase 1: Foundation (Weeks 1-4)

### 1.1 Project Setup

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Initialize pnpm monorepo | P0 | ✅ | `pnpm init` |
| Create workspace structure | P0 | ✅ | packages/, apps/, docs/ |
| Setup TypeScript config | P0 | 🔲 | Strict mode |
| Configure ESLint | P1 | 🔲 | Airbnb + custom rules |
| Configure Prettier | P1 | 🔲 | Consistent formatting |
| Setup Husky pre-commit hooks | P1 | 🔲 | Lint + test on commit |
| Create Docker Compose (dev) | P0 | 🔲 | Postgres, Redis, TimescaleDB |
| Setup GitHub Actions CI | P1 | 🔲 | Lint, test, build |
| Create .env.example | P0 | 🔲 | Document all env vars |
| Write CONTRIBUTING.md | P2 | 🔲 | Dev guidelines |

### 1.2 Database Design

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Design tenants table | P0 | 🔲 | Multi-tenant foundation |
| Design users table | P0 | 🔲 | End users of tenants |
| Design devices table | P0 | 🔲 | Device registry |
| Design api_keys table | P0 | 🔲 | Device auth |
| Design readings hypertable | P0 | 🔲 | TimescaleDB |
| Design events table | P0 | 🔲 | Hot flashes, symptoms |
| Design predictions table | P1 | 🔲 | ML outputs |
| Setup Prisma/Drizzle ORM | P0 | 🔲 | Schema management |
| Create initial migration | P0 | 🔲 | Base schema |
| Setup seed data script | P1 | 🔲 | Dev/test data |
| Configure TimescaleDB compression | P1 | 🔲 | 7-day policy |
| Create continuous aggregates | P1 | 🔲 | Hourly stats |
| Design retention policy | P1 | 🔲 | 2 years raw |
| Setup Redis schemas | P1 | 🔲 | Cache keys, sessions |

### 1.3 Core API Server

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Initialize Fastify app | P0 | 🔲 | TypeScript setup |
| Create plugin architecture | P0 | 🔲 | Modular design |
| Setup route autoload | P1 | 🔲 | File-based routing |
| Implement health check `/health` | P0 | 🔲 | DB, Redis status |
| Setup Zod validation | P0 | 🔲 | Request validation |
| Create error handling plugin | P0 | 🔲 | Consistent errors |
| Setup Pino logging | P0 | 🔲 | Structured logs |
| Add request ID tracking | P1 | 🔲 | Tracing |
| Setup Swagger/OpenAPI | P1 | 🔲 | Auto-generate docs |
| Create response helpers | P1 | 🔲 | Standard format |

### 1.4 Authentication

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Implement JWT generation | P0 | 🔲 | Access + refresh |
| Create login endpoint | P0 | 🔲 | Email/password |
| Implement token refresh | P0 | 🔲 | Rotation |
| Create logout endpoint | P1 | 🔲 | Revoke tokens |
| Build API key generation | P0 | 🔲 | For devices |
| Implement API key validation | P0 | 🔲 | Middleware |
| Add tenant context middleware | P0 | 🔲 | Extract tenant |
| Implement RBAC | P1 | 🔲 | Role-based access |
| Add rate limiting middleware | P1 | 🔲 | Per tenant/endpoint |
| Write auth unit tests | P1 | 🔲 | >90% coverage |
| Write auth integration tests | P1 | 🔲 | Full flow |

---

## Phase 2: Data Pipeline (Weeks 5-8)

### 2.1 Ingestion Service

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Create ingestion endpoint | P0 | 🔲 | POST /ingest/readings |
| Implement batch validation | P0 | 🔲 | Zod schema |
| Add reading type validation | P0 | 🔲 | Enum check |
| Implement value range checks | P0 | 🔲 | Per type |
| Build quality scoring | P1 | 🔲 | 0-1 score |
| Create normalization layer | P0 | 🔲 | Units, timestamps |
| Add timezone handling | P0 | 🔲 | Convert to UTC |
| Setup BullMQ queue | P0 | 🔲 | Async processing |
| Implement batch insert | P0 | 🔲 | Bulk to TimescaleDB |
| Add duplicate detection | P1 | 🔲 | Idempotency |
| Create ingestion metrics | P1 | 🔲 | Throughput, errors |
| Write ingestion tests | P1 | 🔲 | Load test 10K/sec |

### 2.2 Query API

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Create readings query endpoint | P0 | 🔲 | GET /readings |
| Implement time range filter | P0 | 🔲 | start, end params |
| Add reading type filter | P0 | 🔲 | type param |
| Build user filter | P0 | 🔲 | user_id param |
| Implement aggregation | P0 | 🔲 | resolution param |
| Add pagination | P0 | 🔲 | limit, offset |
| Create latest readings endpoint | P0 | 🔲 | GET /readings/latest |
| Optimize with indexes | P1 | 🔲 | Query plan review |
| Add query caching | P1 | 🔲 | Redis |
| Implement result streaming | P2 | 🔲 | Large results |
| Write query tests | P1 | 🔲 | Performance tests |

### 2.3 Sensor SDK Core

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Create @kinara/sdk-core package | P0 | 🔲 | Shared logic |
| Design SDK interface | P0 | 🔲 | Public API |
| Implement HTTP client | P0 | 🔲 | Fetch wrapper |
| Add authentication handling | P0 | 🔲 | API key header |
| Build retry logic | P0 | 🔲 | Exponential backoff |
| Implement offline buffer | P0 | 🔲 | Local queue |
| Create sync manager | P0 | 🔲 | Background sync |
| Add batch upload | P0 | 🔲 | Configurable size |
| Implement compression | P1 | 🔲 | Gzip payload |
| Write SDK documentation | P0 | 🔲 | API reference |
| Create SDK tests | P1 | 🔲 | Unit + integration |

### 2.4 Mobile SDK (React Native)

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Create @kinara/react-native-sdk | P0 | 🔲 | RN package |
| Setup BLE library | P0 | 🔲 | react-native-ble-plx |
| Implement device scanning | P0 | 🔲 | Discover sensors |
| Build pairing flow | P0 | 🔲 | Connect to device |
| Create connection manager | P0 | 🔲 | Reconnect logic |
| Implement data streaming | P0 | 🔲 | Read characteristics |
| Add Apple HealthKit | P0 | 🔲 | iOS integration |
| Add Google Health Connect | P1 | 🔲 | Android integration |
| Build local SQLite storage | P0 | 🔲 | Offline data |
| Create React hooks | P1 | 🔲 | useKinara, useSensor |
| Write SDK example app | P0 | 🔲 | Demo all features |
| Write SDK docs | P0 | 🔲 | Integration guide |

---

## Phase 3: ML & Analytics (Weeks 9-14)

### 3.1 ML Data Pipeline

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Setup ML training environment | P0 | 🔲 | Python, PyTorch |
| Design training data schema | P0 | 🔲 | Features, labels |
| Create data export job | P0 | 🔲 | Training datasets |
| Build synthetic data generator | P1 | 🔲 | Augmentation |
| Implement feature engineering | P0 | 🔲 | Derived features |
| Create train/val/test split | P0 | 🔲 | Stratified |
| Write data quality checks | P1 | 🔲 | Validation |

### 3.2 Hot Flash Model

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Research model architectures | P0 | 🔲 | CNN, LSTM, Transformer |
| Implement model class | P0 | 🔲 | PyTorch |
| Create training script | P0 | 🔲 | With logging |
| Train initial model | P0 | 🔲 | Baseline |
| Implement evaluation metrics | P0 | 🔲 | Sensitivity, specificity |
| Tune hyperparameters | P1 | 🔲 | Grid search |
| Export to ONNX | P0 | 🔲 | For serving |
| Create model card | P1 | 🔲 | Documentation |
| Run bias analysis | P1 | 🔲 | Subgroup performance |

### 3.3 ML Service

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Create ML service (FastAPI) | P0 | 🔲 | Python service |
| Setup ONNX Runtime | P0 | 🔲 | Inference engine |
| Implement prediction endpoint | P0 | 🔲 | POST /predict |
| Build feature preprocessing | P0 | 🔲 | Match training |
| Add model versioning | P1 | 🔲 | Multiple models |
| Implement caching | P1 | 🔲 | Recent predictions |
| Add batch prediction | P1 | 🔲 | Multiple users |
| Create health endpoint | P0 | 🔲 | Model loaded check |
| Write inference tests | P1 | 🔲 | Latency, accuracy |

### 3.4 Insights & Analytics

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Design insights data model | P0 | 🔲 | Aggregated metrics |
| Create aggregation jobs | P0 | 🔲 | Daily, weekly |
| Implement insights endpoint | P0 | 🔲 | GET /insights |
| Build hot flash analysis | P0 | 🔲 | Frequency, patterns |
| Create trigger correlation | P0 | 🔲 | Statistical analysis |
| Add trend detection | P1 | 🔲 | Week-over-week |
| Build recommendations | P1 | 🔲 | Based on patterns |
| Create report generation | P1 | 🔲 | PDF export |
| Write analytics tests | P1 | 🔲 | Accuracy checks |

---

## Phase 4: Integration & Polish (Weeks 15-18)

### 4.1 Third-Party Integrations

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Create integration framework | P0 | 🔲 | Plugin architecture |
| Implement Oura API connector | P1 | 🔲 | Ring data |
| Implement Fitbit connector | P2 | 🔲 | Watch data |
| Build webhook system | P0 | 🔲 | Outbound events |
| Add webhook retry logic | P1 | 🔲 | Failed deliveries |
| Create webhook management API | P1 | 🔲 | CRUD webhooks |
| Implement event system | P0 | 🔲 | Internal events |
| Write integration tests | P1 | 🔲 | Mock external APIs |

### 4.2 Real-time Features

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Setup WebSocket server | P0 | 🔲 | Fastify WebSocket |
| Implement authentication | P0 | 🔲 | JWT in WS |
| Create subscription system | P0 | 🔲 | Subscribe to user |
| Build reading stream | P0 | 🔲 | Live readings |
| Add prediction stream | P0 | 🔲 | Live predictions |
| Implement Redis Pub/Sub | P1 | 🔲 | Multi-instance |
| Add connection management | P1 | 🔲 | Heartbeat, cleanup |
| Write WebSocket tests | P1 | 🔲 | Connection, message |

### 4.3 Documentation

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Setup docs site (Docusaurus) | P0 | 🔲 | Static site |
| Write API reference | P0 | 🔲 | All endpoints |
| Create SDK quickstart | P0 | 🔲 | 5-min guide |
| Write integration guides | P0 | 🔲 | Step-by-step |
| Add code examples | P0 | 🔲 | JS, Python, cURL |
| Create architecture docs | P1 | 🔲 | System design |
| Build API playground | P2 | 🔲 | Interactive |
| Write FAQ | P1 | 🔲 | Common questions |
| Review and edit all docs | P1 | 🔲 | Consistency |

### 4.4 Testing & QA

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Achieve 80% unit test coverage | P0 | 🔲 | All packages |
| Write integration tests | P0 | 🔲 | API flows |
| Create E2E tests | P1 | 🔲 | Full user journey |
| Perform load testing | P0 | 🔲 | 1000 concurrent |
| Run security audit | P0 | 🔲 | OWASP checks |
| Test on multiple devices | P1 | 🔲 | iOS, Android |
| Fix critical bugs | P0 | 🔲 | Priority order |
| Document known issues | P1 | 🔲 | README |

---

## Phase 5: Pilot & Launch (Weeks 19-24)

### 5.1 Production Infrastructure

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Setup Railway/Fly.io | P0 | 🔲 | API hosting |
| Configure Neon/Supabase | P0 | 🔲 | Managed Postgres |
| Setup Upstash Redis | P0 | 🔲 | Managed Redis |
| Configure Cloudflare | P0 | 🔲 | CDN, DNS |
| Setup monitoring (Grafana) | P0 | 🔲 | Dashboards |
| Configure alerting | P0 | 🔲 | PagerDuty/email |
| Setup log aggregation | P1 | 🔲 | Centralized logs |
| Create backup strategy | P0 | 🔲 | Daily backups |
| Configure auto-scaling | P1 | 🔲 | Based on load |
| Setup staging environment | P0 | 🔲 | Pre-prod |

### 5.2 Pilot Onboarding

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Pilot 1: Agreement | P0 | 🔲 | Legal sign-off |
| Pilot 1: Technical setup | P0 | 🔲 | Integration |
| Pilot 1: Testing | P0 | 🔲 | Validate flow |
| Pilot 1: Go-live | P0 | 🔲 | Production |
| Pilot 1: Monitoring | P0 | 🔲 | First 2 weeks |
| Pilot 2: Repeat | P0 | 🔲 | Second customer |
| Pilot 3: Repeat | P0 | 🔲 | Third customer |
| Gather feedback | P0 | 🔲 | NPS, interviews |
| Address critical feedback | P0 | 🔲 | Bug fixes |

### 5.3 Launch Prep

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Finalize pricing page | P0 | 🔲 | Website |
| Create marketing site | P1 | 🔲 | Landing page |
| Setup billing (Stripe) | P1 | 🔲 | Payment |
| Write launch blog post | P1 | 🔲 | Announcement |
| Prepare launch email | P1 | 🔲 | To prospects |
| Create demo video | P2 | 🔲 | Product tour |
| Setup support channel | P0 | 🔲 | Email/chat |
| Train on support | P0 | 🔲 | FAQ ready |
| GA Launch | P0 | 🔲 | Public! |

---

## Backlog (Post-MVP)

### Future Sensors

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| GSR/EDA sensor support | P2 | 🔲 | Stress detection |
| Thermal camera integration | P3 | 🔲 | FLIR Lepton |
| CGM integration | P3 | 🔲 | Libre, Dexcom |
| Blood pressure integration | P2 | 🔲 | Omron |
| Smart scale integration | P2 | 🔲 | Withings |

### Future Features

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Edge ML (on-device) | P1 | 🔲 | TFLite |
| White-label app shell | P1 | 🔲 | RN template |
| Ayurveda assessment | P2 | 🔲 | Prakriti quiz |
| Nutrition module | P2 | 🔲 | Meal planning |
| Mind-body content | P2 | 🔲 | Meditation |
| Community features | P3 | 🔲 | Peer support |
| Telemedicine integration | P2 | 🔲 | Video calls |
| Admin dashboard | P1 | 🔲 | Tenant self-serve |

### Future Integrations

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| FHIR export | P2 | 🔲 | Healthcare |
| Smart home (AC/fan) | P3 | 🔲 | Matter protocol |
| WhatsApp bot | P2 | 🔲 | Tier 2/3 access |
| Voice assistant | P3 | 🔲 | Alexa/Google |
| EMR integration | P2 | 🔲 | Hospital systems |

---

## Current Sprint

### Sprint 1: Foundation (Week 1-2)

**Goal:** Development environment + database schema ready

| Task | Assignee | Status | Due |
|------|----------|--------|-----|
| Monorepo setup | You | ✅ | Done |
| Documentation structure | You | ✅ | Done |
| Docker Compose | You | 🔲 | End of Week |
| Database schema | You | 🔲 | Week 2 |
| CI/CD pipeline | You | 🔲 | Week 2 |

**Blockers:** None

**Notes:** Focus on solid foundation before building features.

---

## Completed Tasks ✅

| Task | Completed | Sprint |
|------|-----------|--------|
| Create project documentation structure | Jan 2025 | 1 |
| Initialize monorepo | Jan 2025 | 1 |
| Define MVP scope | Jan 2025 | 0 |
| Create KINARA-README.md | Jan 2025 | 1 |
| Create KINARA-ARCHITECTURE.md | Jan 2025 | 1 |
| Create KINARA-API-SPEC.md | Jan 2025 | 1 |
| Create KINARA-DATA-MODELS.md | Jan 2025 | 1 |
| Create KINARA-HARDWARE.md | Jan 2025 | 1 |
| Create KINARA-ML-MODELS.md | Jan 2025 | 1 |
| Create KINARA-BUSINESS-MODEL.md | Jan 2025 | 1 |
| Create KINARA-MVP-ROADMAP.md | Jan 2025 | 1 |
| Create KINARA-TODO.md | Jan 2025 | 1 |

---

## Notes & Decisions

### Technical Decisions

| Decision | Date | Rationale |
|----------|------|-----------|
| Use Fastify over Express | Jan 2025 | 2-3x faster, better TS |
| Use TimescaleDB over InfluxDB | Jan 2025 | SQL compatibility |
| Use ONNX for ML | Jan 2025 | Portability, performance |
| Use pnpm workspaces | Jan 2025 | Simpler than Nx |

### Parking Lot

- [ ] Consider Deno for edge functions
- [ ] Evaluate Turso for edge database
- [ ] Research federated learning approach
- [ ] Explore FHIR compliance requirements

---

*Updated: January 2025*
