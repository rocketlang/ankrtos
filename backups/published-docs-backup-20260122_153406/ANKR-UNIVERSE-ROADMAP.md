# ANKR Universe - MVP Roadmap

> **Implementation Plan & Timeline**

**Version:** 1.0.0
**Date:** 19 Jan 2026
**Duration:** 12 Weeks (Q1-Q2 2026)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Phase Overview](#phase-overview)
3. [Detailed Sprint Plan](#detailed-sprint-plan)
4. [Technical Milestones](#technical-milestones)
5. [Resource Requirements](#resource-requirements)
6. [Risk Mitigation](#risk-mitigation)
7. [Success Metrics](#success-metrics)

---

## Executive Summary

### MVP Goal

Launch ANKR Universe as a **world-class showcase platform** demonstrating:
- Conversational AI with 350+ tools
- Voice support in 11 Indian languages
- SLM-first routing with 93% cost savings
- EON memory visualization
- Interactive tool playgrounds

### Timeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            12-WEEK ROADMAP                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Week 1-2     │  Week 3-4     │  Week 5-6     │  Week 7-8     │  Week 9-12 │
│  ─────────    │  ─────────    │  ─────────    │  ─────────    │  ───────── │
│  FOUNDATION   │  BACKEND      │  CONV. AI     │  FRONTEND     │  POLISH    │
│               │               │               │               │  & LAUNCH  │
│  • Setup      │  • Gateway    │  • Intent     │  • Chat UI    │            │
│  • Database   │  • GraphQL    │  • Entity     │  • Showcase   │  • Testing │
│  • Docker     │  • WebSocket  │  • Context    │  • Pulse      │  • Perf    │
│  • Auth       │  • Services   │  • SLM Router │  • Voice      │  • Deploy  │
│               │               │               │               │  • Launch  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase Overview

### Phase 1: Foundation (Week 1-2)

**Objective:** Set up infrastructure and development environment

| Deliverable | Description | Owner | Status |
|-------------|-------------|-------|--------|
| Monorepo setup | Turborepo + TypeScript + ESLint | DevOps | Pending |
| Database schema | Prisma + PostgreSQL + pgvector | Backend | Pending |
| Docker compose | All services containerized | DevOps | Pending |
| Auth system | JWT + Phone OTP | Backend | Pending |
| CI/CD pipeline | GitHub Actions | DevOps | Pending |

**Exit Criteria:**
- [ ] `pnpm dev` starts all services
- [ ] Database migrations run successfully
- [ ] Auth flow works end-to-end
- [ ] Docker compose up brings entire stack

---

### Phase 2: Backend Services (Week 3-4)

**Objective:** Build the API gateway and core services

| Deliverable | Description | Owner | Status |
|-------------|-------------|-------|--------|
| Gateway API | Fastify + Mercurius GraphQL | Backend | Pending |
| GraphQL schema | Full SDL with 50+ types | Backend | Pending |
| WebSocket server | Real-time communication | Backend | Pending |
| Tool registry | 350+ tools indexed | Backend | Pending |
| Package catalog | 224 packages indexed | Backend | Pending |

**Exit Criteria:**
- [ ] GraphQL queries/mutations work
- [ ] WebSocket connects and maintains
- [ ] Tools can be listed and searched
- [ ] Packages can be browsed

---

### Phase 3: Conversational Intelligence (Week 5-6)

**Objective:** Implement NLU and routing layers

| Deliverable | Description | Owner | Status |
|-------------|-------------|-------|--------|
| Intent classifier | 3-tier classification (70+ intents) | AI | Pending |
| Entity extractor | 20+ entity types | AI | Pending |
| Context engine | 3-layer assembly | AI | Pending |
| SLM router | 4-tier cascade | AI | Pending |
| Response generator | Multilingual responses | AI | Pending |

**Exit Criteria:**
- [ ] Intent accuracy > 92%
- [ ] Entity extraction works for Indian IDs
- [ ] SLM handles > 70% queries
- [ ] Response time < 500ms (SLM tier)

---

### Phase 4: Frontend Development (Week 7-8)

**Objective:** Build the user interface

| Deliverable | Description | Owner | Status |
|-------------|-------------|-------|--------|
| Chat interface | Conversation UI with voice | Frontend | Pending |
| Tool explorer | 350+ tools with playgrounds | Frontend | Pending |
| Package catalog | 224 packages with docs | Frontend | Pending |
| Pulse dashboard | Real-time metrics | Frontend | Pending |
| Landing page | Hero + quick demo | Frontend | Pending |

**Exit Criteria:**
- [ ] Chat works with text and voice
- [ ] Tools can be tried interactively
- [ ] Packages show README + API docs
- [ ] Metrics update in real-time

---

### Phase 5: Polish & Launch (Week 9-12)

**Objective:** Testing, optimization, and deployment

| Deliverable | Description | Owner | Status |
|-------------|-------------|-------|--------|
| Testing | Unit, integration, E2E | QA | Pending |
| Performance | Optimize latency, bundle | DevOps | Pending |
| Security audit | Vulnerability scan | Security | Pending |
| Documentation | API docs, user guides | Docs | Pending |
| Production deploy | K8s + CDN + monitoring | DevOps | Pending |
| Launch | Marketing + PR | Marketing | Pending |

**Exit Criteria:**
- [ ] All tests pass
- [ ] Lighthouse score > 90
- [ ] No critical vulnerabilities
- [ ] Production stable for 48h

---

## Detailed Sprint Plan

### Sprint 1 (Week 1)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SPRINT 1: Project Setup                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Day 1-2: Monorepo Setup                                                    │
│  ├── Initialize Turborepo                                                   │
│  ├── Configure TypeScript (base + app configs)                              │
│  ├── Set up ESLint + Prettier                                               │
│  ├── Configure Husky pre-commit                                             │
│  └── Create package structure                                               │
│                                                                              │
│  Day 3-4: Database & Docker                                                 │
│  ├── Design Prisma schema (all models)                                      │
│  ├── Set up PostgreSQL with pgvector                                        │
│  ├── Create docker-compose.yml                                              │
│  ├── Configure Redis                                                        │
│  └── Set up Ollama container                                                │
│                                                                              │
│  Day 5: Environment & Config                                                │
│  ├── Create .env.example                                                    │
│  ├── Set up config package                                                  │
│  ├── Configure ports                                                        │
│  └── Write seed scripts                                                     │
│                                                                              │
│  Deliverables:                                                               │
│  ✅ Monorepo with apps/ and packages/                                       │
│  ✅ Docker compose with all services                                        │
│  ✅ Database schema (Prisma)                                                │
│  ✅ Development environment working                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Sprint 2 (Week 2)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SPRINT 2: Authentication & CI/CD                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Day 1-2: Authentication                                                    │
│  ├── Implement JWT plugin (Fastify)                                         │
│  ├── Create OTP service (SMS integration)                                   │
│  ├── Build auth resolvers (login, verify, refresh)                          │
│  ├── Add API key support                                                    │
│  └── Test auth flow                                                         │
│                                                                              │
│  Day 3-4: CI/CD Pipeline                                                    │
│  ├── Create GitHub Actions workflow                                         │
│  ├── Set up build job                                                       │
│  ├── Set up test job                                                        │
│  ├── Set up deploy job (staging)                                            │
│  └── Configure secrets                                                      │
│                                                                              │
│  Day 5: Health & Metrics                                                    │
│  ├── Implement /health endpoint                                             │
│  ├── Implement /ready endpoint                                              │
│  ├── Implement /metrics endpoint                                            │
│  └── Set up basic logging                                                   │
│                                                                              │
│  Deliverables:                                                               │
│  ✅ Phone OTP login working                                                 │
│  ✅ JWT authentication                                                      │
│  ✅ CI/CD pipeline running                                                  │
│  ✅ Health checks implemented                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Sprint 3 (Week 3)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SPRINT 3: Gateway & GraphQL                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Day 1-2: Fastify Server                                                    │
│  ├── Set up Fastify with plugins                                            │
│  ├── Configure CORS, Helmet, Rate Limiting                                  │
│  ├── Integrate Mercurius                                                    │
│  ├── Set up context builder                                                 │
│  └── Configure error handling                                               │
│                                                                              │
│  Day 3-4: GraphQL Schema                                                    │
│  ├── Define core types (User, Conversation, Message)                        │
│  ├── Define tool types (Tool, ToolExecution)                                │
│  ├── Define memory types (Memory, MemoryStats)                              │
│  ├── Define input types                                                     │
│  └── Define subscriptions                                                   │
│                                                                              │
│  Day 5: Core Resolvers                                                      │
│  ├── User resolvers                                                         │
│  ├── Conversation resolvers (CRUD)                                          │
│  ├── Message resolvers                                                      │
│  └── Basic queries working                                                  │
│                                                                              │
│  Deliverables:                                                               │
│  ✅ Gateway running on :4500                                                │
│  ✅ GraphQL schema defined                                                  │
│  ✅ Basic CRUD operations working                                           │
│  ✅ GraphiQL accessible                                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Sprint 4 (Week 4)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SPRINT 4: WebSocket & Services                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Day 1-2: WebSocket Server                                                  │
│  ├── Set up @fastify/websocket                                              │
│  ├── Implement connection handler                                           │
│  ├── Implement message types                                                │
│  ├── Add heartbeat/ping-pong                                                │
│  └── Handle reconnection                                                    │
│                                                                              │
│  Day 3-4: Core Services                                                     │
│  ├── ConversationService                                                    │
│  ├── ToolExecutorService                                                    │
│  ├── ShowcaseService (tools, packages)                                      │
│  ├── MetricsService                                                         │
│  └── Service dependency injection                                           │
│                                                                              │
│  Day 5: Tool & Package Registry                                             │
│  ├── Index 350+ tools from MCP                                              │
│  ├── Index 224 packages                                                     │
│  ├── Implement search                                                       │
│  └── Implement categories                                                   │
│                                                                              │
│  Deliverables:                                                               │
│  ✅ WebSocket connects and communicates                                     │
│  ✅ Services layer complete                                                 │
│  ✅ 350+ tools indexed and searchable                                       │
│  ✅ 224 packages cataloged                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Sprint 5 (Week 5)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SPRINT 5: Intent & Entity                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Day 1-2: Intent Classifier                                                 │
│  ├── Port IntentClassifier from Swayam                                      │
│  ├── Add 70+ intent patterns                                                │
│  ├── Implement keyword matching                                             │
│  ├── Integrate AI classification (Groq)                                     │
│  └── Add caching                                                            │
│                                                                              │
│  Day 3-4: Entity Extractor                                                  │
│  ├── Port EntityExtractor from Swayam                                       │
│  ├── Add Indian ID patterns (GSTIN, PAN, Aadhaar)                           │
│  ├── Add financial patterns (amount, percentage)                            │
│  ├── Add location patterns (pincode, city)                                  │
│  ├── Add vehicle patterns                                                   │
│  └── Implement validators                                                   │
│                                                                              │
│  Day 5: Testing & Validation                                                │
│  ├── Write unit tests for classifier                                        │
│  ├── Write unit tests for extractor                                         │
│  ├── Test with Hindi input                                                  │
│  └── Test code-switching                                                    │
│                                                                              │
│  Deliverables:                                                               │
│  ✅ Intent classification > 92% accuracy                                    │
│  ✅ Entity extraction for 20+ types                                         │
│  ✅ Hindi/English support                                                   │
│  ✅ Unit tests passing                                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Sprint 6 (Week 6)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SPRINT 6: Context & SLM Router                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Day 1-2: Context Engine                                                    │
│  ├── Implement 3-layer context assembly                                     │
│  ├── Build Identity Layer                                                   │
│  ├── Build Knowledge Layer (RAG)                                            │
│  ├── Build Transient Layer                                                  │
│  └── Add token budget management                                            │
│                                                                              │
│  Day 3-4: SLM Router                                                        │
│  ├── Integrate @ankr/slm-router                                             │
│  ├── Configure Tier 0 (EON cache)                                           │
│  ├── Configure Tier 1 (Deterministic)                                       │
│  ├── Configure Tier 2 (Ollama SLM)                                          │
│  ├── Configure Tier 3 (LLM fallback)                                        │
│  └── Add routing metrics                                                    │
│                                                                              │
│  Day 5: Integration Testing                                                 │
│  ├── Test full conversation flow                                            │
│  ├── Verify tier distribution                                               │
│  ├── Measure latencies                                                      │
│  └── Test edge cases                                                        │
│                                                                              │
│  Deliverables:                                                               │
│  ✅ Context assembly working                                                │
│  ✅ SLM router handling > 70% queries                                       │
│  ✅ End-to-end latency < 500ms (SLM)                                        │
│  ✅ Cost tracking implemented                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Sprint 7 (Week 7)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SPRINT 7: Frontend Setup & Chat UI                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Day 1-2: Frontend Setup                                                    │
│  ├── Initialize React 19 + Vite                                             │
│  ├── Configure TailwindCSS 4                                                │
│  ├── Install Shadcn/UI                                                      │
│  ├── Set up React Router 7                                                  │
│  ├── Configure Apollo Client                                                │
│  └── Set up Zustand stores                                                  │
│                                                                              │
│  Day 3-4: Chat Interface                                                    │
│  ├── Build ChatInterface component                                          │
│  ├── Build MessageBubble component                                          │
│  ├── Build TextInput component                                              │
│  ├── Build ToolExecution component                                          │
│  ├── Implement useConversation hook                                         │
│  └── Connect to GraphQL                                                     │
│                                                                              │
│  Day 5: Real-time Updates                                                   │
│  ├── Connect WebSocket                                                      │
│  ├── Handle message events                                                  │
│  ├── Handle tool execution events                                           │
│  └── Handle routing events                                                  │
│                                                                              │
│  Deliverables:                                                               │
│  ✅ Frontend running on :3500                                               │
│  ✅ Chat interface working                                                  │
│  ✅ Real-time updates                                                       │
│  ✅ Tool execution visualization                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Sprint 8 (Week 8)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SPRINT 8: Voice & Showcase                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Day 1-2: Voice Input                                                       │
│  ├── Integrate Web Speech API                                               │
│  ├── Build VoiceInput component                                             │
│  ├── Add waveform visualization                                             │
│  ├── Implement language selector (11 langs)                                 │
│  └── Connect to backend voice handler                                       │
│                                                                              │
│  Day 3-4: Showcase Pages                                                    │
│  ├── Build ToolExplorer page                                                │
│  ├── Build ToolPlayground component                                         │
│  ├── Build PackageCatalog page                                              │
│  ├── Build DemoGallery page                                                 │
│  └── Implement search functionality                                         │
│                                                                              │
│  Day 5: Pulse Dashboard                                                     │
│  ├── Build PulseDashboard page                                              │
│  ├── Build SystemStatus component                                           │
│  ├── Build MetricsDisplay (Recharts)                                        │
│  ├── Build ActivityStream                                                   │
│  └── Connect to metrics subscription                                        │
│                                                                              │
│  Deliverables:                                                               │
│  ✅ Voice input working in 11 languages                                     │
│  ✅ Tool explorer with playgrounds                                          │
│  ✅ Package catalog                                                         │
│  ✅ Live metrics dashboard                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Sprint 9-10 (Week 9-10)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SPRINT 9-10: Landing Page & Memory Visualization                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Week 9 Day 1-3: Landing Page                                               │
│  ├── Build HeroSection component                                            │
│  ├── Build MetricsTicker component                                          │
│  ├── Build QuickDemo component                                              │
│  ├── Build QuickAccessCards                                                 │
│  ├── Add animations (Framer Motion)                                         │
│  └── Responsive design                                                      │
│                                                                              │
│  Week 9 Day 4-5: Memory Visualization                                       │
│  ├── Set up Three.js / React Three Fiber                                    │
│  ├── Build MemoryGraph3D component                                          │
│  ├── Implement force-directed layout                                        │
│  ├── Add memory type coloring                                               │
│  └── Build MemoryStream component                                           │
│                                                                              │
│  Week 10: Testing                                                           │
│  ├── Set up Vitest for frontend                                             │
│  ├── Set up Jest for backend                                                │
│  ├── Write unit tests (70% coverage)                                        │
│  ├── Write integration tests                                                │
│  ├── Set up Playwright for E2E                                              │
│  └── Write critical path E2E tests                                          │
│                                                                              │
│  Deliverables:                                                               │
│  ✅ Landing page complete                                                   │
│  ✅ 3D memory visualization                                                 │
│  ✅ Test coverage > 70%                                                     │
│  ✅ E2E tests passing                                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Sprint 11-12 (Week 11-12)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SPRINT 11-12: Polish & Launch                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Week 11: Performance & Security                                            │
│  ├── Performance profiling                                                  │
│  ├── Bundle optimization                                                    │
│  ├── Lazy loading implementation                                            │
│  ├── Security audit                                                         │
│  ├── Penetration testing                                                    │
│  └── Fix vulnerabilities                                                    │
│                                                                              │
│  Week 12 Day 1-3: Documentation                                             │
│  ├── Write API documentation                                                │
│  ├── Write user guides                                                      │
│  ├── Create SDK documentation                                               │
│  ├── Record demo videos                                                     │
│  └── Prepare launch materials                                               │
│                                                                              │
│  Week 12 Day 4-5: Production Deploy & Launch                                │
│  ├── Set up production K8s                                                  │
│  ├── Configure CDN (Cloudflare)                                             │
│  ├── Set up monitoring (Grafana)                                            │
│  ├── Final smoke testing                                                    │
│  ├── Launch announcement                                                    │
│  └── Monitor launch                                                         │
│                                                                              │
│  Deliverables:                                                               │
│  ✅ Lighthouse score > 90                                                   │
│  ✅ No critical vulnerabilities                                             │
│  ✅ Documentation complete                                                  │
│  ✅ Production deployed                                                     │
│  ✅ LAUNCHED! 🚀                                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technical Milestones

| Week | Milestone | Success Criteria |
|------|-----------|------------------|
| 2 | Dev Environment | `pnpm dev` works |
| 4 | API Complete | All GraphQL operations working |
| 6 | AI Pipeline | Intent → Entity → Context → Route → Execute |
| 8 | Frontend MVP | Chat + Voice + Tools + Packages |
| 10 | Feature Complete | All features implemented |
| 12 | Launch | Production deployed, stable |

---

## Resource Requirements

### Team

| Role | Count | Responsibility |
|------|-------|----------------|
| Tech Lead | 1 | Architecture, code review |
| Backend Engineer | 2 | Gateway, services, AI pipeline |
| Frontend Engineer | 2 | React, voice, visualization |
| AI/ML Engineer | 1 | NLU, SLM routing, EON |
| DevOps Engineer | 1 | CI/CD, infrastructure, monitoring |
| QA Engineer | 1 | Testing, automation |

### Infrastructure

| Resource | Specification | Cost/Month |
|----------|---------------|------------|
| PostgreSQL | 4 vCPU, 16GB RAM, 500GB SSD | $150 |
| Redis | 2 vCPU, 8GB RAM | $50 |
| Ollama (GPU) | T4 GPU, 16GB VRAM | $300 |
| Gateway | 4 vCPU, 8GB RAM × 3 replicas | $200 |
| Web | 2 vCPU, 4GB RAM × 3 replicas | $100 |
| CDN | Cloudflare Pro | $25 |
| Monitoring | Grafana Cloud | $50 |
| **Total** | | **$875/month** |

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| SLM quality insufficient | Medium | High | Have LLM fallback, fine-tune model |
| Voice accuracy low | Medium | Medium | Multiple STT providers, training data |
| Performance issues | Low | High | Early profiling, caching strategy |
| Integration failures | Medium | Medium | Mock services, contract testing |
| Scope creep | High | Medium | Strict MVP scope, backlog parking |

---

## Success Metrics

### MVP Launch Criteria

| Metric | Target |
|--------|--------|
| Tools integrated | 350+ |
| Languages supported | 11 |
| Intent accuracy | > 92% |
| SLM tier coverage | > 70% |
| Avg latency (SLM) | < 500ms |
| Uptime | > 99% |
| Test coverage | > 70% |
| Lighthouse score | > 90 |

### Post-Launch (30 days)

| Metric | Target |
|--------|--------|
| Daily Active Users | 500+ |
| Conversations/day | 1000+ |
| Demo completion rate | > 60% |
| Voice usage rate | > 40% |
| NPS score | > 50 |

---

*Roadmap Version: 1.0.0 | Last Updated: 19 Jan 2026*
