# AnkrCode Ecosystem Architecture

> **Version:** 5.0 | **Last Updated:** January 2026
> **Author:** ANKR Labs AI Documentation System

---

## Overview

The AnkrCode ecosystem is a unified AI-powered development platform built on three pillars:
- **AnkrCode (ankr5 CLI)** - Command-line interface for AI operations
- **AI-Proxy** - Intelligent LLM gateway with frugal routing
- **Swayam** - Voice-first conversational interface (planned)

```
                    ┌──────────────────────────────────────────────┐
                    │           ANKR LABS ECOSYSTEM                 │
                    │        "सबके लिए AI" - AI for Everyone         │
                    └──────────────────────────────────────────────┘
                                         │
          ┌──────────────────────────────┼──────────────────────────────┐
          │                              │                              │
          ▼                              ▼                              ▼
   ┌─────────────┐              ┌─────────────┐              ┌─────────────┐
   │  AnkrCode   │              │   Swayam    │              │    BANI     │
   │  CLI (68+)  │              │  Voice AI   │              │ WhatsApp AI │
   └──────┬──────┘              └──────┬──────┘              └──────┬──────┘
          │                            │                            │
          └────────────────────────────┼────────────────────────────┘
                                       ▼
                    ┌──────────────────────────────────────────────┐
                    │              AI-PROXY @ 4444                  │
                    │    15 Providers | Frugal Routing | Skills     │
                    └──────────────────────────────────────────────┘
                                       │
          ┌────────────────────────────┼────────────────────────────┐
          ▼                            ▼                            ▼
   ┌─────────────┐              ┌─────────────┐              ┌─────────────┐
   │    Ralph    │              │  MCP Tools  │              │     EON     │
   │  24 Tools   │              │   255+      │              │   Memory    │
   └─────────────┘              └─────────────┘              └─────────────┘
```

---

## 1. AnkrCode (ankr5 CLI)

**Location:** `/root/ankr-labs-nx/.ankr/cli/`
**Binary:** `ankr5`
**Version:** 2.1.0

### Core Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `gateway` | - | Universal AI Gateway status |
| `ai` | - | AI completions with RAG & memory |
| `context` | `ctx` | RAG context building |
| `eon` | - | Memory system operations |
| `mcp` | - | 255+ MCP tools |
| `ralph` | `rw` | 24 AI dev automation tools |
| `ports` | - | Service port discovery |
| `doctor` | - | Health diagnostics |
| `rag` | - | RAG diagnostics |
| `proxy` | - | AI-Proxy info |

### Quick Examples

```bash
# Check all services
ankr5 gateway status

# AI query with RAG
ankr5 ai ask "how do I create an invoice?"

# Get service port
ankr5 ports get freightbox  # Returns: 4003

# Search memories
ankr5 eon search "authentication bug"

# List MCP tools
ankr5 mcp list --category compliance

# AI-powered commit
ankr5 ralph commit --all
```

---

## 2. Ralph Tools (24 AI Dev Automation Tools)

**Embedded in ankr5** with MCP fallback.

### Categories

| Category | Tools | Description |
|----------|-------|-------------|
| **Git** | commit, review, release | AI-powered git operations |
| **Code** | component, api, schema, refactor, docs, cleanup | Code generation |
| **Ops** | deploy, monitor, backup, migrate, seed, deps, debug | DevOps automation |
| **Search** | search, explore, fetch, parallel | Codebase exploration |
| **Quality** | test, audit, perf | Testing & security |
| **Convert** | convert, i18n | Code migration & i18n |

### Execution Flow

```
ankr5 ralph {tool} [args]
         │
         ▼
┌─────────────────────────────────┐
│  Try: ${FORGE_BIN}/ralph-{tool}.sh │
└─────────────────────────────────┘
         │
         │ (not found?)
         ▼
┌─────────────────────────────────┐
│  Fallback: MCP tool invocation  │
└─────────────────────────────────┘
```

### Key Ralph Tools

```bash
# AI-powered commit with conventional message
ankr5 ralph commit --all

# Code review with security analysis
ankr5 ralph review --pr 123

# Python to TypeScript conversion
ankr5 ralph convert --from py2ts --input src/

# Generate React component
ankr5 ralph component UserProfile --tests --storybook

# Security audit
ankr5 ralph audit --owasp --secrets
```

---

## 3. AI-Proxy (The Brain)

**Location:** `/root/ankr-labs-nx/apps/ai-proxy/`
**Port:** 4444

### 15 LLM Providers

| Tier | Providers | Cost/1K tokens |
|------|-----------|----------------|
| **Free** | Groq, Together, Ollama, Cerebras, SambaNova, Cohere, LongCat | $0 |
| **Budget** | DeepSeek, Kimi, Fireworks, Mistral | $0.10-0.30 |
| **Premium** | Anthropic, OpenAI, OpenRouter, Gemini | $2-15 |

### Frugal Routing Strategy

**Default:** `free_first`

```
Groq → DeepSeek → Fireworks → Together → OpenRouter → OpenAI
```

### Cost Optimization Patterns

| Pattern | Savings | How It Works |
|---------|---------|--------------|
| **Context Compression** | 70-80% | Summarize memories before injection |
| **Adaptive RAG** | Variable | Skip RAG for simple queries |
| **Prediction Logging** | Ongoing | Learn optimal routing from usage |

### Endpoints

```bash
# GraphQL
POST /graphql
  - complete(prompt, options)
  - embed(text)
  - storeMemory(content)
  - analytics(days)

# REST
POST /api/ai/complete           # Basic completion
POST /api/ai/complete-context   # With RAG/skills
POST /api/ai/embed              # Embeddings
GET  /api/ai/analytics?days=7   # Cost analytics
```

---

## 4. Package Awareness System

AnkrCode knows about all 182+ @ankr/* packages through a 3-tier system:

### Tier 1: Hardcoded Registry

**File:** `packages/ankr-mcp/src/tools/all-tools.ts`

255+ tools categorized:
- Compliance (54): GST, TDS, ITR, MCA
- ERP (44): Invoice, Inventory, Purchase
- CRM (30): Lead, Contact, Opportunity
- Banking (28): UPI, NEFT, IMPS, EMI
- Government (22): Aadhaar, DigiLocker, PAN
- Logistics (35): Shipment, Route, GPS
- EON (14): Memory operations
- Ralph (24): Dev automation

### Tier 2: Product-Skill Mapping

**File:** `packages/ankr-mcp/src/tools/skills.ts`

```typescript
const PRODUCT_SKILLS = {
  'swayam': ['ankr-intent-router', 'ankr-mcp-tools', 'ankr-llmbox'],
  'wowtruck': ['ankr-intent-router', 'ankr-mcp-tools', 'ankr-voice-hindi', 'ankr-eon-memory'],
  'ankr-internal': ['ankr-intent-router', 'ankr-mcp-tools', 'ankr-tms-dev', 'ankr-eon-memory', 'ankr-llmbox'],
};
```

### Tier 3: Auto-Detection

**File:** `packages/@ankr/skill-loader/src/index.ts`

```typescript
const SKILL_TRIGGERS = {
  'ankr-tms-dev': ['module', 'service', 'controller', 'nestjs', 'shipment'],
  'ankr-eon-memory': ['memory', 'episode', 'semantic', 'remember'],
  'ankr-voice-hindi': ['voice', 'hindi', 'tamil', 'telugu', 'speak'],
};
```

---

## 5. Skills System

**Location:** `.claude/skills/`

Skills are domain knowledge files injected into AI prompts.

### Available Skills

| Skill | Purpose |
|-------|---------|
| `ankr-intent-router` | Natural language → intent classification |
| `ankr-mcp-tools` | Tool catalog (255+ tools) |
| `ankr-eon-memory` | Memory system patterns |
| `ankr-tms-dev` | TMS development patterns |
| `ankr-voice-hindi` | Hindi/multilingual support |
| `ankr-llmbox` | LLM provider routing |
| `ankr-logistics-rag` | Logistics knowledge base |

### Skill Injection Flow

```
User: "commit kar do"
         │
         ▼
┌─────────────────────────────────────┐
│  AI-Proxy receives request          │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Auto-detect: 'ankr-intent-router'  │
│             + 'ankr-mcp-tools'      │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Load: .claude/skills/*/SKILL.md    │
│  Inject into system prompt          │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  LLM understands:                   │
│  Intent = git_commit                │
│  Tool = ralph.commit                │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Execute: ankr5 ralph commit        │
└─────────────────────────────────────┘
```

---

## 6. EON Memory System

**Port:** 4005
**Database:** PostgreSQL + pgvector

### Memory Types

| Type | Description | Example |
|------|-------------|---------|
| `fact` | Static knowledge | "User prefers dark mode" |
| `episode` | Event records | "On Jan 15, fixed auth bug in user.ts" |
| `procedure` | How-to knowledge | "To deploy: npm run build && pm2 restart" |
| `knowledge` | Domain knowledge | "React 19 uses use() hook" |

### Commands

```bash
# Search memories
ankr5 eon search "authentication"

# Store a memory
ankr5 eon store "User prefers TypeScript over JavaScript" --type fact

# Get stats
ankr5 eon stats
```

---

## 7. Self-Awareness (CLAUDE.md)

**File:** `/root/ankr-labs-nx/CLAUDE.md`

This file makes Claude Code (and AnkrCode) self-aware of:
- Available CLI commands
- MCP tools catalog
- Port configuration
- Build commands
- Architecture overview
- Common issues & solutions

### Key Sections

1. **ankr5 CLI commands** - Quick reference
2. **MCP Tools (255+)** - Categories and examples
3. **Port Configuration** - Single source of truth
4. **Build Commands** - pnpm, nx, prisma
5. **Tech Stack** - React, Fastify, PostgreSQL, etc.

---

## 8. Swayam Integration (Planned)

**Status:** Documented, not yet built

### Vision

| Component | Role |
|-----------|------|
| **Swayam** | Conversational UI (voice/chat) |
| **ankr5** | Execution layer (internal) |
| **AI-Proxy** | Shared brain |
| **EON** | Shared memory |

### Planned Flow

```
User (voice): "commit kar do"
         │
         ▼
┌─────────────────────────────┐
│  Swayam (Voice Interface)   │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  AI-Proxy (Intent Router)   │
│  Intent: git_commit         │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  ankr5 ralph commit         │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Swayam: "Done! Committed   │
│  with message: Fix auth..."  │
└─────────────────────────────┘
```

---

## 9. Key File Paths

| Component | Path |
|-----------|------|
| ankr5 CLI | `.ankr/cli/` |
| Ralph commands | `.ankr/cli/src/commands/ralph.ts` |
| AI-Proxy | `apps/ai-proxy/src/server.ts` |
| MCP Tools | `packages/ankr-mcp/src/tools/all-tools.ts` |
| Skills | `.claude/skills/*/SKILL.md` |
| Skill Loader | `packages/@ankr/skill-loader/src/index.ts` |
| Port Config | `config/ports.config.ts` |
| Self-Awareness | `CLAUDE.md` |

---

## 10. Quick Start

```bash
# 1. Build CLI
cd .ankr/cli && npm run build

# 2. Check system status
ankr5 gateway status

# 3. AI query
ankr5 ai ask "how do I track a shipment?"

# 4. Use Ralph tools
ankr5 ralph commit --all

# 5. Search memories
ankr5 eon search "deployment steps"
```

---

## Summary

| Metric | Value |
|--------|-------|
| **@ankr/* packages** | 182+ |
| **MCP tools** | 255+ |
| **LLM providers** | 15 |
| **Ralph tools** | 24 |
| **Applications** | 30+ |
| **Languages** | 11 Indic |

---

*Generated by ANKR Labs Documentation System*
*https://ankrlabs.org*
