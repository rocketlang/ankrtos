# ANKR AI Ecosystem - Complete Technical Specification

> **Date**: 18 January 2026
> **Status**: Production-Ready

---

## Overview: 5 Integrated Systems

| System | Version | Core Capabilities |
|--------|---------|-------------------|
| **AnkrCode** | v2.42.0 | 11 Core Tools + 71 CLI Commands + 260+ MCP |
| **VibeCoder** | v2.0.2 | 41 Code Generation Tools |
| **RocketLang** | v1.0.0 | 20 Business Types + 50+ Packages |
| **Swayam** | v1.0.0 | 13 Indian Languages + Voice AI |
| **Tasher** | v1.0.0 | 5 Agents + Manus-style Orchestration |

**Total Capabilities**: 340+ tools, 13 languages, 20 business verticals

---

## 1. AnkrCode v2.42.0

**Location**: `/root/ankrcode-project/packages/ankrcode-core/`

### 1.1 Core Tools (11)

| Tool | Purpose |
|------|---------|
| Read | Read file contents (images, PDFs, notebooks) |
| Write | Write content to files |
| Edit | String replacement editing |
| Glob | File pattern matching |
| Grep | Content search (ripgrep) |
| Bash | Shell command execution |
| Task | Sub-agent spawning (7 agent types) |
| TodoWrite | Task management |
| AskUserQuestion | Interactive prompts |
| WebFetch | Fetch & analyze web content |
| WebSearch | Multi-provider web search |

### 1.2 CLI Commands (71)

**Core**: chat, ask, tools, doctor, plugins, sessions, resume, config, run, history, search, completion, init, stats, export, diff, clean, info, update

**Context**: context, alias, snippet, prompt, backup, watch, hook, template

**Code**: gen, review, explain, refactor, doc, test, debug, lint, optimize

**Git**: commit, pr, changelog

**Project**: deps, security, upgrade, scaffold, api, bundle, i18n, env

**DevOps**: perf, db, deploy, mock, ci, k8s, docker, log, monitor, secret, audit, migrate, cache, queue, webhook, cron, proxy

**Advanced**: feature, trace, metric, schema, workflow, agent, browse

### 1.3 MCP Tools (260+)

| Category | Count | Examples |
|----------|-------|----------|
| Compliance | 54+ | gst_verify, tds_calculate, itr_file, pan_verify |
| ERP | 44+ | invoice_create, inventory_check, ledger_query |
| CRM | 30+ | lead_create, contact_add, deal_update |
| Banking | 28+ | upi_pay, emi_calculate, account_verify |
| Government | 22+ | aadhaar_verify, digilocker_fetch, vahan_api |
| Logistics | 35+ | shipment_track, route_optimize, pod_generate |
| EON Memory | 14+ | eon_remember, eon_recall, context_query |
| Messaging | 15+ | whatsapp_send, sms_send, email_send |
| Other | 18+ | Various utilities |

### 1.4 Agent Types (7)

| Agent | Model | Max Turns | Purpose |
|-------|-------|-----------|---------|
| explore | Haiku | 10 | Fast codebase exploration |
| plan | Sonnet | 15 | Implementation planning |
| code | Sonnet | 30 | Code generation/modification |
| review | Sonnet | 15 | Code review & bugs |
| security | Opus | 20 | Security analysis |
| bash | Haiku | 10 | Command execution |
| general | Sonnet | 50 | Full tool access |

### 1.5 Features

- **Browser/Computer Use** (v2.41): Playwright-based autonomous browsing
- **Workflow Engine** (v2.39): Multi-step task automation
- **Shell Completions** (v2.40): Bash, Zsh, Fish support
- **Plugin System**: Git, Docker built-in plugins
- **Swayam Integration**: Voice-first Hindi/English input
- **EON Memory**: Episodic + semantic + procedural memory
- **Offline Mode**: Local LLM support (Ollama)

---

## 2. VibeCoder v2.0.2

**Location**: `/root/ankr-labs-nx/packages/vibecoding-tools/`

### 2.1 Tool Categories (41 Total)

| Category | Count | Tools |
|----------|-------|-------|
| Vibe Analysis | 3 | vibe_analyze, vibe_score, vibe_compare |
| Code Generation | 3 | generate_component, generate_hook, generate_util |
| API Generation | 2 | generate_api_route, generate_crud_routes |
| Scaffold | 3 | scaffold_project, scaffold_project_smart, scaffold_module |
| Smart Generation | 4 | smart_component, smart_api, smart_refactor, smart_util |
| Enterprise | 8 | generate_auth_flow, generate_api_docs, generate_docker, generate_k8s, generate_ci_cd, generate_tests, generate_monitoring, generate_security |
| Validation | 3 | validate_code, security_scan, quality_check |
| Logistics | 2 | generate_shipment_ui, generate_tracking_api |
| Compliance | 2 | generate_gst_form, generate_invoice_template |
| CRM | 2 | generate_lead_form, generate_contact_ui |
| ERP | 2 | generate_inventory_ui, generate_order_flow |
| Domain | 7 | Various domain-specific generators |

### 2.2 Vibe Styles (9)

minimal, modern, enterprise, startup, aesthetic, brutalist, cozy, chaotic, zen

### 2.3 Supported Frameworks

**Frontend**: React, Vue, Svelte
**Backend**: Express, Fastify, Hono, Elysia, Next.js

### 2.4 Integrations

- ankr5 CLI (port management)
- EON memory (pattern learning)
- RAG (codebase context)
- OAuth (auth generation)
- Pulse (monitoring)

---

## 3. RocketLang v1.0.0

**Location**: `/root/ankr-labs-nx/packages/rocketlang/`

### 3.1 Business Types (20)

| ID | Name (Hindi) | Required Features |
|----|--------------|-------------------|
| retail_shop | दुकान/किराना | pos, inventory, billing, gst |
| ecommerce | ऑनलाइन स्टोर | catalog, cart, payments, shipping |
| restaurant | ढाबा/होटल | menu, orders, kitchen_display |
| logistics | ट्रांसपोर्ट | tracking, fleet, drivers |
| service_business | सर्विस | appointments, customers |
| wholesale | थोक | orders, inventory, credit |
| manufacturing | फैक्ट्री | bom, production, quality |
| professional | CA/वकील | appointments, documents |
| education | कोचिंग | students, courses, attendance |
| healthcare | क्लिनिक | patients, prescriptions |
| real_estate | प्रॉपर्टी | listings, leads |
| agriculture | कृषि/मंडी | produce, pricing |
| hospitality | होटल | rooms, bookings |
| finance | लोन/बीमा | applications, kyc |
| media | मीडिया | projects, clients |
| ngo | एनजीओ | donors, campaigns |
| government | सरकारी | tenders, compliance |
| freelancer | फ्रीलांसर | projects, invoicing |
| event | इवेंट | events, vendors |
| fitness | जिम | members, schedules |

### 3.2 Package Index (50+)

**Auth**: @ankr/oauth, @ankr/iam
**Compliance**: @ankr/gst-utils, @ankr/compliance-gst, @ankr/compliance-itr
**Government**: @ankr/gov-aadhaar, @ankr/gov-ulip, @ankr/gov-schemes
**Logistics**: @ankr/tms, @ankr/gps-server
**CRM/ERP**: @ankr/crm, @ankr/erp, @ankr/inventory, @ankr/pos
**Payments**: @ankr/upi, @ankr/razorpay
**Communication**: @ankr/whatsapp, @ankr/sms, @ankr/email
**AI**: @ankr/eon, @ankr/ai-router, @ankr/document-ai

### 3.3 Templates (7 Live)

retail-pos, ecommerce-basic, restaurant-pos, logistics-fleet, service-booking, healthcare-clinic, education-coaching

### 3.4 Language Support

- Hindi (Devanagari + Roman)
- English
- Tamil
- Telugu
- Hinglish (code-mixed)

### 3.5 Verb Mappings

```
बनाओ/banao → create
पढ़ो/padho → read
लिखो/likho → write
खोजो/khojo → search
चलाओ/chalao → run
```

---

## 4. Swayam Voice AI v1.0.0

**Location**: `/root/swayam/`
**Live**: https://swayam.digimitra.guru

### 4.1 Languages (13)

| Language | Script | STT | TTS |
|----------|--------|-----|-----|
| Hindi | Devanagari | Sarvam | 30 voices |
| English | Latin | Sarvam | Yes |
| Bengali | Bengali | Sarvam | Yes |
| Tamil | Tamil | Sarvam | Yes |
| Telugu | Telugu | Sarvam | Yes |
| Marathi | Devanagari | Sarvam | Yes |
| Gujarati | Gujarati | Sarvam | Yes |
| Kannada | Kannada | Sarvam | Yes |
| Malayalam | Malayalam | Sarvam | Yes |
| Punjabi | Gurmukhi | Sarvam | Yes |
| Odia | Odia | Sarvam | Yes |
| Assamese | Bengali | Sarvam | Yes |
| Urdu | Arabic | Sarvam | Yes |

### 4.2 Voice Providers

| Provider | Type | Features |
|----------|------|----------|
| Sarvam AI | STT/TTS | 30 Hindi voices, Indian languages native |
| Whisper | STT | 100+ global languages fallback |
| XTTS/Coqui | TTS | Voice cloning capability |

### 4.3 LLM Providers (15+)

Groq (free), Gemini (free), Claude, OpenAI, DeepSeek, and more via AI Proxy

### 4.4 Personas

| Persona | Domain | Tools |
|---------|--------|-------|
| Swayam | Universal AI | 350+ |
| ComplyMitra | Compliance | 145+ |
| WowTruck | Logistics | 40+ |
| FreightBox | Shipping | 20+ |

### 4.5 WebSocket Protocol

```javascript
ws.send({
  type: 'join',
  sessionId: 'session_123',
  language: 'hi',
  persona: 'swayam'
});

// Voice: { type: 'audio', data: base64 }
// Text: { type: 'text', text: 'Python सिखाओ' }
// Code: { type: 'execute', code: '...', language: 'python' }
```

---

## 5. Tasher v1.0.0 (Manus-style)

**Location**: `/root/ankr-labs-nx/packages/tasher/`

### 5.1 Agents (5)

| Agent | Purpose | Integration |
|-------|---------|-------------|
| BrowserAgent | Web research (ReAct loop) | Playwright |
| CoderAgent | Code generation | VibeCoder |
| DeployAgent | Sandbox/production deploy | @ankr/sandbox2 |
| APIAgent | External API, MCP calls | MCP tools |
| MemoryAgent | Pattern learning | @ankr/eon |

### 5.2 Architecture

```
User Input
    ↓
TaskDecomposer (Plan phases & steps)
    ↓
StepExecutor (Execute with agents)
    ↓
Checkpointer (Save progress)
    ↓
RecoveryPlanner (Handle errors)
    ↓
MemoryAgent (Learn patterns)
```

### 5.3 Recovery Strategies

1. retry_same
2. retry_with_modification
3. alternative_approach
4. skip_and_continue
5. human_escalation
6. abort

### 5.4 Task Flow Example

```typescript
const result = await tasher.execute({
  description: "Build food delivery app like Swiggy",
  complexity: 'complex',
});

// Phase 1: Research (BrowserAgent)
// Phase 2: Architecture (CoderAgent)
// Phase 3: Code Generation (CoderAgent + VibeCoder)
// Phase 4: Deployment (DeployAgent + Sandbox2)
// Phase 5: Testing (BrowserAgent)
// Output: { success: true, url: 'https://app.sandbox.ankr.in' }
```

---

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INPUT                                   │
│        Voice (Swayam) / Text (Hindi/English) / CLI (AnkrCode)       │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
        ┌───────────────────────▼───────────────────────┐
        │              ROCKETLANG                        │
        │   Intent Classification + Package Selection    │
        │   20 Business Types + 50+ @ankr Packages       │
        └───────────────────────┬───────────────────────┘
                                │
        ┌───────────────────────▼───────────────────────┐
        │              TASHER ORCHESTRATOR               │
        │   Task Decomposition + Agent Coordination      │
        │   5 Agents + Self-Healing + Checkpoints        │
        └───────────────────────┬───────────────────────┘
                                │
    ┌───────────────────────────┼───────────────────────────┐
    │                           │                           │
    ▼                           ▼                           ▼
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│ BrowserAgent│         │ CoderAgent  │         │ DeployAgent │
│ (Research)  │         │ (VibeCoder) │         │ (Sandbox2)  │
│ Playwright  │         │ 41 Tools    │         │ Docker      │
└─────────────┘         └─────────────┘         └─────────────┘
                                │
        ┌───────────────────────▼───────────────────────┐
        │              ANKRCODE CORE                     │
        │   11 Tools + 71 Commands + 260+ MCP           │
        │   Read, Write, Edit, Glob, Grep, Bash...      │
        └───────────────────────┬───────────────────────┘
                                │
        ┌───────────────────────▼───────────────────────┐
        │              EON MEMORY v3.2.0                 │
        │   Episodic + Semantic + Procedural Memory      │
        │   Pattern Learning + Context Retrieval         │
        └───────────────────────┬───────────────────────┘
                                │
                                ▼
                    WORKING DEPLOYED APP
```

---

## Comparison: ANKR vs Manus AI

| Feature | Manus AI | ANKR Tasher |
|---------|----------|-------------|
| Languages | English only | 13 Indian + English |
| Voice | None | Swayam (30+ voices) |
| Domain Tools | Generic | 260+ India-specific |
| Code Gen | Generic | VibeCoder (41 tools, 9 vibes) |
| Memory | Basic | EON (3-layer + RAG) |
| Packages | None | 50+ @ankr packages |
| Business Types | None | 20 Indian verticals |
| Compliance | None | GST, TDS, ITR, MCA |
| Cost | $200/mo | Free tier + local |

---

## Metrics

| Metric | Value |
|--------|-------|
| Total Tools | 342+ |
| MCP Tools | 260+ |
| CLI Commands | 71 |
| VibeCoder Tools | 41 |
| Business Types | 20 |
| Languages | 13 |
| @ankr Packages | 50+ |
| Templates | 7 (13 planned) |
| Agents | 5 |

---

*Last Updated: 18 January 2026*
