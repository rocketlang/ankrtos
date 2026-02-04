# ANKR Universe - AI Coding Ecosystem

## Where AI Writes Production Code for Bharat

---

# The Vision

> **"AI + Layman = Anyone Can Build Anything"**

ANKR isn't just using AI — we're building an ecosystem where **AI writes, tests, deploys, and evolves production software**. Every package, every product, every line of code in the ANKR Universe is generated, reviewed, and improved by AI coders under our IP.

---

# The AI Coding Stack

## 5 Layers of Intelligence

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 5: PRODUCTS                                               │
│  WowTruck, Fr8X, bani.ai, ComplyMitra, ankrBFC...               │
│  15+ production apps built by AI                                 │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 4: AI AGENTS                                              │
│  Tasher, VibeCoder, AnkrCode, Swayam                            │
│  Multi-agent swarms that code, test, deploy                     │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 3: MCP TOOLS (350+)                                       │
│  GST, Banking, Logistics, Government, Voice, Memory             │
│  Callable actions for any AI agent                              │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 2: PACKAGES (224)                                         │
│  @ankr/eon, @ankr/slm-router, @ankr/voice-ai, @ankr/gst...     │
│  Production-ready npm modules                                    │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 1: CORE INFRASTRUCTURE                                    │
│  EON Memory, SLM Router, AI Proxy, Embeddings                   │
│  The foundation everything runs on                               │
└─────────────────────────────────────────────────────────────────┘
```

---

# AI Coding Agents

## 1. TASHER — Manus-Style Agentic Coder

**What it does:** Autonomous task completion with 5 specialized sub-agents

```
┌─────────────────────────────────────────────────────────────────┐
│                        TASHER ORCHESTRATOR                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │ RESEARCH │ │CALCULATOR│ │ DOCUMENT │ │  COMMS   │ │ MEMORY ││
│  │  AGENT   │ │  AGENT   │ │  AGENT   │ │  AGENT   │ │ AGENT  ││
│  │          │ │          │ │          │ │          │ │        ││
│  │ Web/Code │ │ Math/    │ │ Generate │ │ Email/   │ │ EON    ││
│  │ Search   │ │ Finance  │ │ Reports  │ │ WhatsApp │ │ Store  ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Capabilities:**
- Breaks complex tasks into sub-tasks
- Delegates to specialized agents
- Maintains context across steps
- Self-corrects on errors
- Learns from completions (EON procedural memory)

**Example:**
```
User: "Build a GST calculator API with tests"

Tasher:
1. Research Agent → Finds GST rules, HSN codes
2. Document Agent → Generates API spec
3. [Writes code] → Creates Fastify endpoint
4. [Writes tests] → Creates Vitest test suite
5. Memory Agent → Stores pattern for future use
```

---

## 2. VIBECODER — Multi-Agent Swarm Coding

**What it does:** AI coding with specialized agent swarms for different tasks

```
┌─────────────────────────────────────────────────────────────────┐
│                      VIBECODER SWARM                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │  ARCHITECT      │    │  IMPLEMENTER    │                     │
│  │  Agent          │───▶│  Agent          │                     │
│  │                 │    │                 │                     │
│  │  Designs system │    │  Writes code    │                     │
│  │  Plans structure│    │  Creates files  │                     │
│  └─────────────────┘    └────────┬────────┘                     │
│                                  │                               │
│                                  ▼                               │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │  REVIEWER       │◀───│  TESTER         │                     │
│  │  Agent          │    │  Agent          │                     │
│  │                 │    │                 │                     │
│  │  Code review    │    │  Writes tests   │                     │
│  │  Security check │    │  Runs tests     │                     │
│  └─────────────────┘    └─────────────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Capabilities:**
- Multi-file project generation
- Parallel agent execution
- Built-in code review
- Test generation
- Security scanning

---

## 3. ANKRCODE — AI Coding for Bharat

**What it does:** Hindi/Hinglish voice-to-code generation

```
┌─────────────────────────────────────────────────────────────────┐
│                        ANKRCODE                                  │
│                 "भारत के लिए AI Coding"                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🎤 Voice Input (11 Languages)                                   │
│       ↓                                                          │
│  🧠 Intent Understanding                                         │
│       ↓                                                          │
│  💻 Code Generation                                              │
│       ↓                                                          │
│  ✅ Validation & Testing                                         │
│       ↓                                                          │
│  📦 Package/Deploy                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Example:**
```
User (Hindi): "एक API बनाओ जो customer का data लेकर database में save करे"

AnkrCode:
1. STT → Converts Hindi speech to text
2. Intent → Understands "Create customer save API"
3. Generate → Creates Fastify route with Prisma
4. Test → Generates test cases
5. Respond (Hindi TTS) → "API बन गया, /api/customers पर POST करो"
```

**Languages Supported:**
- Hindi (हिंदी)
- Hinglish (Mixed Hindi-English)
- Tamil (தமிழ்)
- Telugu (తెలుగు)
- Bengali (বাংলা)
- + 6 more Indian languages

---

## 4. SWAYAM — Voice AI Engine

**What it does:** Foundation for all voice-based coding and interactions

```
┌─────────────────────────────────────────────────────────────────┐
│                         SWAYAM                                   │
│              Voice AI Engine for 11 Languages                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │    STT      │  │   NLU       │  │    TTS      │              │
│  │             │  │             │  │             │              │
│  │ Speech to   │─▶│ Natural     │─▶│ Text to     │              │
│  │ Text        │  │ Language    │  │ Speech      │              │
│  │             │  │ Understand  │  │             │              │
│  │ 11 langs    │  │ Intent +    │  │ 11 langs    │              │
│  │ Whisper     │  │ Entity      │  │ Multiple    │              │
│  │ + Bhashini  │  │ Extraction  │  │ voices      │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│  Features:                                                       │
│  ✓ Code-switching (Hinglish support)                            │
│  ✓ Wake word detection ("Hey Swayam")                           │
│  ✓ Continuous listening mode                                     │
│  ✓ Voice cloning (with consent)                                 │
│  ✓ Emotion detection                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

# The Package Ecosystem

## 224 Production-Ready Packages

All packages are published to private npm registry (`localhost:4873`) and available for any project.

### AI/ML Packages (22)
```
@ankr/eon              - Memory system (episodic, semantic, procedural)
@ankr/slm-router       - SLM-first query routing (93% cost savings)
@ankr/ai-router        - Multi-provider LLM failover
@ankr/embeddings       - Vector embeddings (pgvector)
@ankr/ai-proxy         - Unified AI API gateway
@ankr/mcp-tools        - 350+ MCP tool implementations
@ankr/agent-core       - Base agent framework
@ankr/agent-swarm      - Multi-agent orchestration
```

### Voice Packages (12)
```
@ankr/voice-ai         - Complete voice AI stack
@ankr/stt              - Speech-to-text (11 languages)
@ankr/tts              - Text-to-speech (11 languages)
@ankr/wake-word        - Wake word detection
@ankr/vad              - Voice activity detection
@ankr/voice-clone      - Voice cloning (consent-based)
```

### Core/Infra Packages (28)
```
@ankr/iam              - Identity & Access Management
@ankr/oauth            - OAuth 2.0 (9 providers)
@ankr/security         - WAF, encryption, rate limiting
@ankr/config           - Centralized configuration
@ankr/entity           - Base entity patterns
@ankr/pubsub           - Event publishing
```

### Compliance Packages (18)
```
@ankr/gst              - GST calculation & filing
@ankr/eway             - E-Way bill generation
@ankr/einvoice         - E-Invoice (IRN generation)
@ankr/tds              - TDS calculation
@ankr/itr              - Income tax returns
@ankr/compliance-core  - Base compliance framework
```

### Logistics Packages (20)
```
@ankr/fleet            - Fleet management
@ankr/routing          - Route optimization
@ankr/tracking         - GPS tracking
@ankr/pod              - Proof of delivery
@ankr/eway-logistics   - E-Way for logistics
@ankr/ocean-tracker    - Container tracking
```

### Banking Packages (15)
```
@ankr/upi              - UPI payments
@ankr/razorpay         - Razorpay integration
@ankr/banking          - Core banking operations
@ankr/credit           - Credit decisioning
@ankr/insurance        - Insurance integrations
```

### Blockchain/DocChain Packages (8)
```
@ankr/docchain         - Document blockchain anchoring
@ankr/hash             - SHA-256 document hashing
@ankr/polygon          - Polygon network integration
@ankr/verify           - Instant document verification
@ankr/smart-contracts  - Escrow & milestone contracts
@ankr/consensus        - Multi-party signing
@ankr/audit-trail      - Immutable audit logs
@ankr/crypto-settle    - Crypto payment rails
```

---

# SLM-First Architecture

## 93% Cost Reduction Through Intelligent Routing

```
┌─────────────────────────────────────────────────────────────────┐
│                    SLM-FIRST ROUTING                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Query: "Create a function to calculate GST"                   │
│                          │                                       │
│                          ▼                                       │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  TIER 0: EON CACHE                                       │   │
│   │  "Have we done this before?"                             │   │
│   │  ─────────────────────────────────────────────────────   │   │
│   │  • Check procedural memory                               │   │
│   │  • Latency: ~0ms | Cost: FREE | Hit Rate: 10%           │   │
│   └─────────────────────────────────────────────────────────┘   │
│                          │ Miss                                  │
│                          ▼                                       │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  TIER 1: DETERMINISTIC                                   │   │
│   │  "Is this a known pattern?"                              │   │
│   │  ─────────────────────────────────────────────────────   │   │
│   │  • Regex patterns, templates                             │   │
│   │  • Latency: <10ms | Cost: FREE | Hit Rate: 20%          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                          │ Miss                                  │
│                          ▼                                       │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  TIER 2: LOCAL SLM (Ollama)                              │   │
│   │  "Can a small model handle this?"                        │   │
│   │  ─────────────────────────────────────────────────────   │   │
│   │  • Qwen 2.5 7B, Llama 3.2 8B                            │   │
│   │  • Latency: 50-200ms | Cost: $0.0001 | Hit Rate: 65%    │   │
│   └─────────────────────────────────────────────────────────┘   │
│                          │ Complex                               │
│                          ▼                                       │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  TIER 3: CLOUD LLM                                       │   │
│   │  "Use the big guns"                                      │   │
│   │  ─────────────────────────────────────────────────────   │   │
│   │  • Claude Opus/Sonnet, GPT-4                            │   │
│   │  • Latency: 1-5s | Cost: $0.01+ | Hit Rate: 5%          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Cost Comparison

| Scenario | Without SLM | With ANKR | Savings |
|----------|-------------|-----------|---------|
| 10K queries/day | $200/day | $14/day | 93% |
| 50K queries/day | $1,000/day | $70/day | 93% |
| 100K queries/day | $2,000/day | $140/day | 93% |
| **Monthly (50K/day)** | **$30,000** | **$2,100** | **$27,900** |

---

# EON Memory System

## AI That Remembers and Learns

```
┌─────────────────────────────────────────────────────────────────┐
│                      EON MEMORY                                  │
│              Episodic-Oriented Network                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  EPISODIC MEMORY                                         │   │
│  │  "What happened"                                         │   │
│  │  ─────────────────────────────────────────────────────   │   │
│  │  • User created invoice #1234 for Ramesh ji              │   │
│  │  • Last query was about GST calculation                  │   │
│  │  • Session started 10 minutes ago                        │   │
│  │  Storage: PostgreSQL | Retention: 90 days                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  SEMANTIC MEMORY                                         │   │
│  │  "What we know"                                          │   │
│  │  ─────────────────────────────────────────────────────   │   │
│  │  • GST rate for HSN 8471 is 18%                         │   │
│  │  • Ramesh ji = Customer CUST-00123                      │   │
│  │  • User prefers Hindi responses                          │   │
│  │  Storage: pgvector | Retrieval: Hybrid search           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  PROCEDURAL MEMORY                                       │   │
│  │  "How to do things"                                      │   │
│  │  ─────────────────────────────────────────────────────   │   │
│  │  • Invoice creation → WhatsApp send workflow            │   │
│  │  • GST calculation usually followed by e-invoice        │   │
│  │  • User prefers detailed code comments                   │   │
│  │  Storage: Pattern store | Learning: Auto-extracted      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Memory in Action

```
Query 1: "Calculate GST for ₹50,000 at 18%"
→ Result: ₹9,000 GST
→ EON stores: User asked about GST calculation

Query 2: "Send this to Ramesh ji"
→ EON recalls: "Ramesh ji = Customer CUST-00123"
→ EON recalls: "Last calculation was ₹9,000 GST"
→ Action: Sends invoice to Ramesh ji via WhatsApp

Query 3: (Next week) "Same invoice to Ramesh ji"
→ EON recalls: "Last invoice to Ramesh ji was ₹50,000 + GST"
→ EON recalls: "User prefers WhatsApp"
→ Action: Creates and sends invoice automatically
```

---

# MCP Tools (350+)

## Model Context Protocol - Actions AI Can Take

```
┌─────────────────────────────────────────────────────────────────┐
│                      350+ MCP TOOLS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📊 GST & COMPLIANCE (54 tools)                                 │
│  ────────────────────────────────────────────────────────────   │
│  gst_calculate, gst_verify, einvoice_generate, eway_create,    │
│  tds_calculate, itr_file, hsn_lookup, gstr1_file, gstr3b_file  │
│                                                                  │
│  🏦 BANKING (28 tools)                                          │
│  ────────────────────────────────────────────────────────────   │
│  upi_pay, upi_collect, emi_calculate, loan_apply,              │
│  credit_check, insurance_quote, bank_statement_analyze         │
│                                                                  │
│  🚚 LOGISTICS (35 tools)                                        │
│  ────────────────────────────────────────────────────────────   │
│  shipment_create, shipment_track, route_optimize,              │
│  eway_generate, fleet_status, driver_assign, pod_upload        │
│                                                                  │
│  🏛️ GOVERNMENT (22 tools)                                       │
│  ────────────────────────────────────────────────────────────   │
│  aadhaar_verify, pan_verify, digilocker_fetch, epf_status,     │
│  pm_scheme_check, passport_status, driving_license_verify      │
│                                                                  │
│  📦 ERP (44 tools)                                              │
│  ────────────────────────────────────────────────────────────   │
│  invoice_create, inventory_check, purchase_order,              │
│  sales_order, ledger_entry, stock_transfer, bom_create         │
│                                                                  │
│  👥 CRM (30 tools)                                              │
│  ────────────────────────────────────────────────────────────   │
│  lead_create, contact_add, opportunity_update,                 │
│  pipeline_view, activity_log, email_send, call_log             │
│                                                                  │
│  🎤 VOICE (14 tools)                                            │
│  ────────────────────────────────────────────────────────────   │
│  stt_transcribe, tts_speak, translate, language_detect,        │
│  voice_clone, wake_word_detect, emotion_detect                 │
│                                                                  │
│  🧠 MEMORY (14 tools)                                           │
│  ────────────────────────────────────────────────────────────   │
│  eon_remember, eon_recall, eon_forget, context_query,          │
│  pattern_learn, preference_store, history_search               │
│                                                                  │
│  🔗 BLOCKCHAIN/DOCCHAIN (18 tools)                              │
│  ────────────────────────────────────────────────────────────   │
│  docchain_anchor, docchain_verify, hash_document,              │
│  smart_contract_deploy, escrow_create, escrow_release,         │
│  consensus_sign, audit_trail_query, crypto_settle              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Tool Invocation Example

```typescript
// AI Agent can invoke any tool
const result = await mcp.invoke('gst_calculate', {
  amount: 50000,
  rate: 18,
  type: 'CGST_SGST'
});

// Result
{
  base_amount: 50000,
  cgst: 4500,
  sgst: 4500,
  total_gst: 9000,
  total_amount: 59000,
  hsn_applicable: true
}
```

---

# Production Workflow

## How AI Builds Software at ANKR

```
┌─────────────────────────────────────────────────────────────────┐
│                   AI-FIRST DEVELOPMENT FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. REQUIREMENT (Natural Language)                              │
│     "Build a GST invoice API with WhatsApp notifications"       │
│                          │                                       │
│                          ▼                                       │
│  2. DECOMPOSITION (Tasher Architect)                            │
│     ┌─────────────────────────────────────────────────────┐     │
│     │ Task 1: Create Prisma schema for Invoice            │     │
│     │ Task 2: Build Fastify API endpoint                  │     │
│     │ Task 3: Integrate @ankr/gst for calculations        │     │
│     │ Task 4: Add WhatsApp notification via @ankr/comms   │     │
│     │ Task 5: Write tests with Vitest                     │     │
│     │ Task 6: Generate API documentation                  │     │
│     └─────────────────────────────────────────────────────┘     │
│                          │                                       │
│                          ▼                                       │
│  3. PARALLEL EXECUTION (VibeCoder Swarm)                        │
│     ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                │
│     │Schema  │ │ API    │ │ Tests  │ │ Docs   │                │
│     │Agent   │ │ Agent  │ │ Agent  │ │ Agent  │                │
│     └────────┘ └────────┘ └────────┘ └────────┘                │
│                          │                                       │
│                          ▼                                       │
│  4. REVIEW & SECURITY (Reviewer Agent)                          │
│     ✓ Code style check                                          │
│     ✓ Security scan (OWASP)                                     │
│     ✓ Performance review                                        │
│     ✓ Test coverage check                                       │
│                          │                                       │
│                          ▼                                       │
│  5. INTEGRATION (CI/CD Pipeline)                                │
│     ✓ Build package                                             │
│     ✓ Run tests                                                 │
│     ✓ Publish to registry                                       │
│     ✓ Deploy to staging                                         │
│                          │                                       │
│                          ▼                                       │
│  6. LEARNING (EON Memory)                                       │
│     Store pattern: "GST API + WhatsApp = this workflow"         │
│     Next time: 70% faster with cached procedure                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

# Live Products Built by AI

## 15+ Applications in Production

| Product | What It Does | AI Contribution |
|---------|--------------|-----------------|
| **WowTruck** | Transport Management System | 90% AI-generated code |
| **Fr8X** | Freight Exchange Platform | 85% AI-generated code |
| **bani.ai** | Multilingual AI Bot | 95% AI-generated code |
| **ComplyMitra** | GST Compliance Automation | 88% AI-generated code |
| **ankrBFC** | Business Finance Platform | 82% AI-generated code |
| **Swayam** | Voice AI Engine | 80% AI-generated code |
| **SunoSunao** | Voice Legacy Platform | 90% AI-generated code |
| **FlowCanvas** | Visual Workflow Builder | 85% AI-generated code |
| **EverPure** | Water Quality IoT | 75% AI-generated code |
| **Saathi** | Trucking Assistant | 92% AI-generated code |

### Total Codebase

| Metric | Value |
|--------|-------|
| Total Lines of Code | 500,000+ |
| AI-Generated | 85%+ |
| Human Review | 100% |
| Test Coverage | 70%+ |
| Production Uptime | 99.9% |

---

# Intellectual Property

## 65+ Patentable Innovations

### AI/Coding IP (HIGH Patentability)

1. **SLM-First 4-Tier Cascade Routing**
   - Novel approach to query routing for cost optimization
   - 93% cost reduction vs pure LLM

2. **EON 3-Layer Memory Architecture**
   - Episodic + Semantic + Procedural memory for AI
   - Auto-embedding and retrieval

3. **Domain Definition Language (DDL)**
   - Unified code generation from natural language
   - Cross-language, cross-framework output

4. **11-Language Voice-to-Code Pipeline**
   - Hindi/Hinglish voice → working code
   - First of its kind for Indian languages

5. **Multi-Agent Swarm Orchestration**
   - Parallel agent execution with conflict resolution
   - Self-organizing task distribution

6. **Creep-Crawl Learning Pipeline**
   - Incremental learning from user interactions
   - Pattern extraction without fine-tuning

### Trade Secrets

- Prompt engineering templates (500+)
- Cost optimization formulas
- Domain-specific fine-tuning data
- Agent coordination protocols

---

# The Developer Experience

## Building with ANKR

```bash
# Install ANKR CLI
npm install -g @ankr/cli

# Create new project with AI
ankr create my-app --template=fastify-graphql

# Generate code with natural language
ankr generate "Add user authentication with OTP"

# Run AI code review
ankr review src/

# Deploy to ANKR Cloud
ankr deploy --env=production
```

### Voice-First Development

```bash
# Start voice coding mode
ankr voice

# Speak in Hindi
"एक API बनाओ जो user का name और email लेकर database में save करे"

# AI generates:
# - Prisma schema
# - Fastify route
# - Validation with Zod
# - Test cases
```

---

# Why This Matters

## The Impact

### For Developers
- 10x faster development with AI agents
- 93% lower AI costs with SLM routing
- Voice coding in native language
- Pre-built 224 packages

### For Businesses
- Build apps without engineers
- Voice-first for non-technical users
- 11 languages for pan-India reach
- Production-ready compliance

### For India
- Democratize software development
- 900M non-English speakers can build
- Local AI = data sovereignty
- Jobs in AI-native development

---

# The Vision

> **"By 2030, every Indian business will have AI-generated software tailored to their needs, built in their language, at 1/10th the cost."**

ANKR is building the infrastructure to make this possible.

---

*Document Created: 19 Jan 2026*
*ANKR Labs - AI Coding Ecosystem*
