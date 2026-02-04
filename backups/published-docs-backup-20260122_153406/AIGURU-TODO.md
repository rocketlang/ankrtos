# AIGuru - Enterprise AI Orchestration Platform
## Project TODO & Roadmap

**Last Updated:** 2026-01-19
**Status:** Active Development
**Version:** 1.0.0-alpha

---

## Executive Summary

AIGuru is ANKR's enterprise AI orchestration platform - a **Manus AI alternative** built for the Indian market with Hindi/Indic language support, cost-optimized inference, and deep integration with 210+ prebuilt enterprise packages.

### Core Differentiators

1. **@ankr/packages** - 210+ prebuilt enterprise packages (credit-engine, telematics, fraud-detection, etc.)
2. **4-Tier SLM Router** - EON Memory → Deterministic → Local SLM → LLM Fallback
3. **Swayam Voice Layer** - Native Hindi/Indic voice understanding
4. **RocketLang DSL** - Domain-specific routing and code-switching
5. **VibeCoder** - 34 MCP tools for contextual code generation

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              AIGURU ORCHESTRATION LAYER                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   SWAYAM    │───▶│ ROCKETLANG  │───▶│ SLM ROUTER  │───▶│   TASHER    │         │
│  │   Voice     │    │    DSL      │    │  (4-Tier)   │    │Orchestrator │         │
│  │ Hindi/Indic │    │Code-Switch  │    │ Cost-Opt    │    │Multi-Agent  │         │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘         │
│        │                  │                  │                  │                  │
│        └──────────────────┴──────────────────┴──────────────────┘                  │
│                                      │                                             │
│                           ┌──────────┴──────────┐                                  │
│                           ▼                     ▼                                  │
│                    ┌─────────────┐       ┌─────────────┐                          │
│                    │  VIBECODER  │       │  MCP TOOLS  │                          │
│                    │  34 Tools   │       │   258+      │                          │
│                    │Code Generate│       │Integrations │                          │
│                    └─────────────┘       └─────────────┘                          │
│                           │                     │                                  │
│                           └──────────┬──────────┘                                  │
│                                      ▼                                             │
│  ┌──────────────────────────────────────────────────────────────────────────────┐ │
│  │                        @ankr/packages (210+ Enterprise Packages)              │ │
│  ├──────────────────────────────────────────────────────────────────────────────┤ │
│  │ credit-engine │ telematics-scoring │ fraud-detection │ underwriting          │ │
│  │ compliance    │ wellness-scoring   │ driver-risk     │ gamification          │ │
│  │ audit-logger  │ data-masking       │ encryption      │ rate-limiter          │ │
│  │ churn-predict │ financial-health   │ document-proc   │ notifications         │ │
│  │ renewal-eng   │ spending-categoriz │ resilience      │ + 190 more...         │ │
│  └──────────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                             │
│                                      ▼                                             │
│  ┌──────────────────────────────────────────────────────────────────────────────┐ │
│  │                              EON MEMORY SYSTEM                                │ │
│  │    Episodic │ Semantic │ Procedural │ @ankr/indexer │ pgvector │ Hybrid RAG  │ │
│  └──────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Swayam Voice Layer
**Package:** `ankr-labs-nx/packages/bani/src/intent/swayam-intent.ts`
**Status:** MVP Complete

| Feature | Status | Priority |
|---------|--------|----------|
| Hindi intent parsing | ✅ Done | P0 |
| Cultural greetings (Namaste, etc.) | ✅ Done | P0 |
| Mixed language (Hinglish) | 🔄 In Progress | P1 |
| Multi-dialect support (Tamil, Telugu, etc.) | ⏳ Planned | P2 |
| Voice-to-action mapping | 🔄 In Progress | P1 |
| Streaming voice processing | ⏳ Planned | P2 |

### 2. RocketLang DSL
**Package:** `ankr-labs-nx/packages/rocketlang`
**Status:** Design Phase

| Feature | Status | Priority |
|---------|--------|----------|
| Complexity routing (simple/medium/complex) | ✅ Done | P0 |
| Hindi-English code-switching | 🔄 In Progress | P1 |
| Domain-specific grammar rules | ⏳ Planned | P2 |
| Custom DSL parser | ⏳ Planned | P2 |
| Intent-to-route mapping | 🔄 In Progress | P1 |

### 3. SLM Router (4-Tier)
**Package:** `ankr-labs-nx/packages/ankr-mcp/src/slm-router.ts`
**Status:** Production Ready

| Tier | Description | Status |
|------|-------------|--------|
| Tier 1: EON Memory | Cached responses, learned patterns | ✅ Production |
| Tier 2: Deterministic | Pattern matching, rule-based | ✅ Production |
| Tier 3: Local SLM | Ollama qwen2.5, llama3.2 | ✅ Production |
| Tier 4: LLM Fallback | Claude, GPT-4 via AI Proxy | ✅ Production |

**Cost Optimization:** 70-80% queries resolved at Tier 1-3 (free)

### 4. Tasher Orchestrator
**Package:** `ankr-labs-nx/packages/tasher/src/orchestrator/tasher.ts`
**Status:** Beta

| Agent | Capability | Status |
|-------|------------|--------|
| Browser Agent | Web scraping, data extraction | ✅ Done |
| Coder Agent | Code generation, debugging | ✅ Done |
| Deploy Agent | CI/CD, deployment automation | 🔄 In Progress |
| API Agent | REST/GraphQL interactions | ✅ Done |
| Memory Agent | EON memory operations | ✅ Done |
| File Agent | File system operations | ✅ Done |

### 5. VibeCoder
**Package:** `ankr-labs-nx/packages/tasher/src/mcp/vibecoder-server.ts`
**Status:** Production Ready

**34 MCP Tools Available:**
- `vibe_analyze_code`, `vibe_generate_component`, `vibe_refactor`
- `vibe_generate_test`, `vibe_fix_bugs`, `vibe_optimize_performance`
- `vibe_generate_api`, `vibe_generate_schema`, `vibe_document`
- And 25 more...

---

## @ankr/packages - The Core Differentiator

### Enterprise Packages (19 Production-Ready)

| Package | Description | Lines |
|---------|-------------|-------|
| `@ankr/credit-engine` | AI-powered credit decisions, scoring, EMI | 691 |
| `@ankr/telematics-scoring` | Vehicle telematics & driving behavior | 671 |
| `@ankr/fraud-detection` | Real-time fraud detection, velocity checks | ~600 |
| `@ankr/underwriting` | Insurance/credit underwriting engine | ~550 |
| `@ankr/compliance-engine` | IRDAI, RBI, SEBI, GST, AML/CFT | ~500 |
| `@ankr/wellness-scoring` | Health tracking, preventive care | ~500 |
| `@ankr/driver-risk-score` | Unified driver risk scoring | ~450 |
| `@ankr/gamification` | Points, badges, tiers, streaks, challenges | ~500 |
| `@ankr/document-processor` | OCR, data extraction, template matching | ~450 |
| `@ankr/audit-logger` | Compliance-ready audit with tamper detection | ~400 |
| `@ankr/financial-health` | 7-component financial wellness scoring | ~400 |
| `@ankr/churn-predictor` | AI-powered customer churn prediction | ~350 |
| `@ankr/notifications` | Multi-channel (Push, Email, SMS, WhatsApp) | ~400 |
| `@ankr/data-masking` | PII protection, Indian identity masking | ~350 |
| `@ankr/encryption` | AES-256-GCM, field-level encryption | ~300 |
| `@ankr/rate-limiter` | Multiple algorithm rate limiting | ~300 |
| `@ankr/resilience` | Circuit breaker, retry, graceful shutdown | ~350 |
| `@ankr/renewal-engine` | Policy/loan/subscription renewal | ~400 |
| `@ankr/spending-categorizer` | AI transaction categorization with Hindi | ~400 |

### Labs Packages (192+)

Key packages in `ankr-labs-nx/packages/`:

| Category | Packages |
|----------|----------|
| **AI/ML** | `ankr-eon`, `ankr-embeddings`, `ankr-ai-sdk`, `ankr-rag`, `ankr-intelligence` |
| **Auth** | `ankr-iam`, `ankr-oauth`, `ankr-auth-gateway`, `ankr-otp-auth` |
| **Code Gen** | `ankr-codegen`, `ankr-backend-generator`, `ankr-frontend-generator` |
| **Agents** | `ankr-agents`, `tasher`, `bani`, `ankr-orchestrator` |
| **MCP** | `ankr-mcp`, `mcp-tools`, `vibecoder-server` |
| **Domain** | `ankr-domain`, `ankr-entity`, `ankr-factory` |
| **Messaging** | `ankr-messaging`, `ankr-messaging-free`, `ankr-notifications` |
| **Knowledge** | `@ankr/indexer`, `ankr-knowledge-base`, `ankr-eon-rag` |

---

## TODO: Phase 1 - Core Integration (Q1 2026)

### Week 1-2: Foundation

- [ ] **T1.1** Integrate Swayam with Tasher orchestrator
  - Connect voice intents to agent dispatch
  - Map Hindi commands to agent actions

- [ ] **T1.2** Complete SLM Router MCP integration
  - Add `slm_route` tool to main MCP registry
  - Implement cost tracking dashboard

- [ ] **T1.3** Deploy @ankr/indexer to production
  - Index all project documentation
  - Index compliance/SOP documents
  - Enable knowledge retrieval in agents

### Week 3-4: Agent Enhancement

- [ ] **T1.4** Add domain-aware agents to Tasher
  - Credit Agent (uses @ankr/credit-engine)
  - Compliance Agent (uses @ankr/compliance-engine)
  - Insurance Agent (uses @ankr/underwriting)

- [ ] **T1.5** Implement VibeCoder improvements
  - Add package discovery (knows about @ankr/packages)
  - Context-aware code generation using indexed knowledge
  - Style-aware generation (matches project conventions)

- [ ] **T1.6** RocketLang DSL v1
  - Define grammar for complexity routing
  - Implement basic Hindi-English switching
  - Add test suite

### Week 5-6: MCP Expansion

- [ ] **T1.7** Create MCP tools for enterprise packages
  - `credit_score_calculate` → @ankr/credit-engine
  - `fraud_check` → @ankr/fraud-detection
  - `wellness_score` → @ankr/wellness-scoring
  - `document_extract` → @ankr/document-processor

- [ ] **T1.8** Logistics domain tools
  - `shipment_track`, `route_optimize` (existing)
  - `driver_risk_score` → @ankr/driver-risk-score
  - `telematics_analyze` → @ankr/telematics-scoring

---

## TODO: Phase 2 - Enterprise Features (Q2 2026)

### Compliance & Security

- [ ] **T2.1** Audit trail for all AI operations
  - Use @ankr/audit-logger for tamper-proof logging
  - SOC2/ISO27001 compliance

- [ ] **T2.2** PII handling in AI context
  - Automatic masking via @ankr/data-masking
  - Encryption at rest via @ankr/encryption

- [ ] **T2.3** Rate limiting for AI endpoints
  - Token-based limits via @ankr/rate-limiter
  - Cost controls per tenant

### Multi-Tenancy

- [ ] **T2.4** Tenant isolation in EON
  - Separate vector namespaces per tenant
  - Memory isolation

- [ ] **T2.5** Custom package deployment per tenant
  - Allow tenants to add custom @ankr packages
  - Package versioning and rollback

### Voice Expansion

- [ ] **T2.6** Multi-language Swayam
  - Add Tamil, Telugu, Kannada support
  - Regional accent handling

- [ ] **T2.7** Real-time voice streaming
  - WebSocket-based voice processing
  - Sub-second latency

---

## TODO: Phase 3 - Domain Templates (Q3 2026)

### Industry Templates

- [ ] **T3.1** Logistics Template
  - TMS, Fleet Management, Driver Apps
  - Integrates: telematics, driver-risk, compliance

- [ ] **T3.2** Insurance Template
  - Policy issuance, claims, renewals
  - Integrates: underwriting, credit-engine, fraud-detection

- [ ] **T3.3** Banking/Fintech Template
  - Account management, lending, payments
  - Integrates: credit-engine, fraud-detection, financial-health

- [ ] **T3.4** Healthcare Template
  - Patient management, wellness tracking
  - Integrates: wellness-scoring, compliance, notifications

### AIGuru Domain Factory Integration

- [ ] **T3.5** Domain-to-Package mapping
  - Auto-inject relevant @ankr packages based on domain
  - Generate integration code

- [ ] **T3.6** One-click deployment
  - From domain definition to running app
  - Include CI/CD pipeline generation

---

## Key Metrics to Track

| Metric | Target | Current |
|--------|--------|---------|
| Query resolution at Tier 1-3 | 80% | 70% |
| Average response time (SLM) | <500ms | 650ms |
| Knowledge base coverage | 90% | 40% |
| Hindi intent accuracy | 95% | 85% |
| Agent task success rate | 90% | 75% |
| MCP tool coverage | 300+ | 258 |

---

## Dependencies

### External Services
- **PostgreSQL + pgvector** - EON memory storage
- **Redis** - Caching, sessions
- **Ollama** - Local SLM inference
- **AI Proxy (port 4444)** - LLM gateway

### Internal Packages (Required)
- `@ankr/eon` - Memory system
- `@ankr/mcp` - Tool registry
- `@ankr/ai-router` - LLM routing
- `@ankr/indexer` - Document indexing

---

## Team & Ownership

| Component | Owner | Status |
|-----------|-------|--------|
| Swayam Voice | Voice Team | Active |
| SLM Router | Platform Team | Stable |
| Tasher | Agent Team | Active |
| VibeCoder | Dev Tools Team | Stable |
| @ankr/packages | Core Team | Active |
| EON Memory | Platform Team | Stable |
| @ankr/indexer | Platform Team | New |

---

## How to Contribute

1. Pick a TODO item from Phase 1
2. Create branch: `feat/aiguru-<task-id>`
3. Implement with tests
4. Update this TODO on completion
5. Submit PR with demo video for UI changes

---

## Quick Start

```bash
# Start core services
./start-ankr.sh

# Index project knowledge
npx ankr-indexer index ./docs ./packages --project aiguru

# Test SLM Router
ankr5 mcp call slm_route --query "Calculate credit score for customer"

# Test VibeCoder
ankr5 mcp call vibe_generate_component --name UserProfile --type form
```

---

## References

- [ANKR-AIguru Project Doc](./ANKR-Aiguru-PROJECT-DOC.md)
- [MCP Tool Registry](./packages/ankr-mcp/README.md)
- [EON Memory System](./packages/ankr-eon/README.md)
- [@ankr/indexer](./packages/ankr-indexer/README.md)
- [Enterprise Packages](../ankr-packages/README.md)

---

*This document is maintained by the AIGuru team. For updates, run `ankr5 docs publish AIGURU-TODO.md`*
