# AICode & VibeCode Discovery Document

> **Date**: 18th January 2026
> **Version**: 1.0.0
> **Author**: ANKR Labs
> **Status**: Active Development

---

## Executive Summary

This document provides a comprehensive discovery and analysis of the **AICode (AnkrCode)** and **VibeCode (Vibecoding Tools)** projects - two interconnected AI-powered development tools being built at ANKR Labs.

| Project | Purpose | Version | Status |
|---------|---------|---------|--------|
| **AnkrCode** | Claude Code-equivalent AI coding assistant for India | v2.42.0 | Near Production |
| **Vibecoding Tools** | AI-powered code generation & scaffolding MCP tools | v1.1.0 | Active Development |
| **Vibe Demo Apps** | Reference implementations (API + React) | v1.0.0 | Complete |
| **RocketLang** | Indic-first DSL for code-switching developers | v0.1.0 | Parser Complete |

---

## Part 1: AnkrCode CLI

### 1.1 Overview

AnkrCode is a **world-class AI coding assistant** designed specifically for Indian developers. It provides Claude Code-equivalent capabilities while adding:

- **Indic-first experience** (11 Indian languages)
- **Voice-enabled coding** ("Bolo aur Banao")
- **RocketLang DSL** for natural code-switching
- **260+ India-specific MCP tools** (GST, Banking, Government APIs)
- **ANKR-first architecture** (local packages before external APIs)

### 1.2 Repository Details

| Metric | Value |
|--------|-------|
| **Location** | `/root/ankrcode-project/` |
| **Version** | 2.42.0 |
| **TypeScript Files** | 136 |
| **Lines of Code** | 54,268 |
| **Packages** | 2 (ankrcode-core, rocketlang) |

### 1.3 Core Tools (16 Claude Code Equivalent)

| Tool | Purpose | Parity |
|------|---------|--------|
| `Read` | Read files from filesystem | 100% |
| `Write` | Write/create files | 100% |
| `Edit` | String replacement edits | 100% |
| `Glob` | File pattern matching (fast-glob) | 100% |
| `Grep` | Content search (ripgrep) | 100% |
| `Bash` | Execute shell commands | 95% |
| `Task` | Spawn sub-agents | 90% |
| `TodoWrite` | Task tracking & progress | 100% |
| `AskUserQuestion` | Interactive prompts | 100% |
| `WebFetch` | Fetch URLs, HTML to markdown | 100% |
| `WebSearch` | Multi-provider web search | 100% |
| `EnterPlanMode` | Enter planning mode | 100% |
| `ExitPlanMode` | Exit planning mode | 100% |
| `Skill` | Invoke skills/commands | 80% |
| `NotebookEdit` | Jupyter notebook editing | 100% |
| `NotebookRead` | Read Jupyter notebooks | 100% |

### 1.4 Extended Capabilities (Beyond Claude Code)

| Feature | Description | Status |
|---------|-------------|--------|
| **Browser Automation** | Puppeteer-based computer use | v2.41+ |
| **Autonomous Agents** | Long-running background agents | v2.39+ |
| **Workflow Engine** | YAML-based automation | v2.39+ |
| **Shell Completions** | Bash/Zsh/Fish autocomplete | v2.40+ |
| **Plugin System** | Git, Docker built-in plugins | v2.38+ |
| **Voice Input** | Swayam STT integration | v2.38+ |
| **MCP Discovery** | Auto-discover 260+ tools | v2.38+ |

### 1.5 Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           AnkrCode CLI v2.42                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      INPUT LAYER                                    │ │
│  │  ┌──────────┐  ┌──────────────┐  ┌─────────────┐  ┌─────────────┐ │ │
│  │  │ Keyboard │  │ Voice Input  │  │ RocketLang  │  │ File Input  │ │ │
│  │  │  (i18n)  │  │   (Swayam)   │  │  .rocket    │  │   stdin     │ │ │
│  │  └──────────┘  └──────────────┘  └─────────────┘  └─────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                   CONVERSATION MANAGER                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │ │
│  │  │ Execute Mode │  │  Plan Mode   │  │   Context Manager        │ │ │
│  │  │  (default)   │  │  (planning)  │  │   (history + memory)     │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      TOOL EXECUTOR                                  │ │
│  │  ┌─────────────────────────────────────────────────────────────┐  │ │
│  │  │                   CORE TOOLS (16)                            │  │ │
│  │  │  Read │ Write │ Edit │ Glob │ Grep │ Bash │ Task │ Web...  │  │ │
│  │  └─────────────────────────────────────────────────────────────┘  │ │
│  │  ┌─────────────────────────────────────────────────────────────┐  │ │
│  │  │                   MCP TOOLS (260+)                           │  │ │
│  │  │  GST │ TDS │ Banking │ Logistics │ Government │ EON...     │  │ │
│  │  └─────────────────────────────────────────────────────────────┘  │ │
│  │  ┌─────────────────────────────────────────────────────────────┐  │ │
│  │  │                   AGENT SPAWNER                              │  │ │
│  │  │  Explore │ Plan │ Code │ Review │ Security │ Bash          │  │ │
│  │  └─────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      ADAPTER LAYER (ANKR-First)                     │ │
│  │  Priority 1: Packages    Priority 2: Services    Priority 3: APIs  │ │
│  │  ┌───────────┐          ┌───────────┐           ┌───────────┐     │ │
│  │  │ @ankr/eon │          │ AI Proxy  │           │  Claude   │     │ │
│  │  │ @ankr/mcp │          │ EON :4005 │           │   GPT     │     │ │
│  │  │ @ankr/i18n│          │ MCP :4445 │           │   Groq    │     │ │
│  │  └───────────┘          └───────────┘           └───────────┘     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.6 Exported Modules (index.ts)

```typescript
// Core Exports from ankrcode-core v2.42.0
export * from './types.js';
export { registry, registerTool, getTool, getAllTools, executor, executeTool } from './tools/index.js';
export { ConversationManager } from './conversation/manager.js';
export { loadConfig, getConfig, getSettings, getProjectRules } from './config/index.js';
export { SwayamAdapter, createSwayamAdapter } from './swayam/index.js';
export { AIRouterAdapter, getAIRouterAdapter } from './ai/router-adapter.js';
export { OfflineAdapter, getOfflineAdapter } from './ai/offline-adapter.js';
export { EONAdapter, getEONAdapter, remember, recall } from './memory/eon-adapter.js';
export { MCPAdapter, getMCPAdapter, registerMCPToolsToRegistry } from './mcp/adapter.js';
export { VoiceAdapter, getVoiceAdapter, parseVoiceCommand } from './voice/adapter.js';
export { createUnifiedAdapter, detectANKRPackages, checkAllServices } from './adapters/index.js';
export { runDiagnostics, formatDiagnostics, printDiagnostics, getDoctorCommand } from './startup/index.js';
export { MCPDiscovery, discoverMCPTools, CORE_TOOLS } from './mcp/discovery.js';
export { pluginManager, loadPlugin, gitPlugin, dockerPlugin } from './plugins/index.js';
export { runWorkflow, loadWorkflow, saveWorkflow, listWorkflows } from './workflow/index.js';
export { agentManager, spawnAgent, stopAgent, listAgents, getAgentTypes } from './agents/index.js';
export { getBashCompletion, getZshCompletion, getFishCompletion, installCompletion } from './completions/index.js';
export { browse, BrowserAgent, BrowserController, analyzeScreenshot } from './browser/index.js';
```

### 1.7 Language Support

| Language | Native Script | Transliteration | Voice | Status |
|----------|---------------|-----------------|-------|--------|
| Hindi | हिन्दी | ✅ | ✅ | Full |
| Tamil | தமிழ் | ✅ | ✅ | Full |
| Telugu | తెలుగు | ✅ | ✅ | Full |
| Kannada | ಕನ್ನಡ | ✅ | ✅ | Full |
| Marathi | मराठी | ✅ | ✅ | Full |
| Bengali | বাংলা | ✅ | ✅ | Full |
| Gujarati | ગુજરાતી | ✅ | ✅ | Full |
| Malayalam | മലയാളം | ✅ | ✅ | Full |
| Punjabi | ਪੰਜਾਬੀ | ✅ | ✅ | Full |
| Odia | ଓଡ଼ିଆ | ✅ | ✅ | Full |
| English | English | - | ✅ | Full |

---

## Part 2: RocketLang DSL

### 2.1 Overview

RocketLang is an **intent specification language** that maps natural Indic speech patterns (especially code-switching Indian English) to tool invocations.

### 2.2 Repository Details

| Metric | Value |
|--------|-------|
| **Location** | `/root/ankrcode-project/packages/rocketlang/` |
| **Version** | 0.1.0 |
| **Modules** | 13 directories |

### 2.3 Package Structure

```
rocketlang/src/
├── cli/              # CLI interface
├── codegen/          # Code generation from AST
├── compiler/         # Full compilation pipeline
├── grammar/          # PEG grammar definitions
├── index.ts          # Main exports
├── modules/          # Built-in modules
├── normalizer/       # Code-switching normalization
├── parser/           # PEG parser implementation
├── repl/             # Interactive REPL
├── runtime/          # Execution runtime
├── __tests__/        # Test suite
└── types/            # Type definitions
```

### 2.4 Code-Switching Examples

```javascript
// RocketLang understands natural code-switching

// Example 1: Hindi + English
"ek function banao jo array ko reverse kare"
// → { tool: 'Task', type: 'code', prompt: 'Create a function that reverses an array' }

// Example 2: Pure Hindi verb
"पढ़ो src/index.ts"
// → { tool: 'Read', path: 'src/index.ts' }

// Example 3: Mixed
"git commit करो message='fixed bug'"
// → { tool: 'Bash', command: 'git commit -m "fixed bug"' }
```

### 2.5 Supported Verbs

| Hindi | Transliterated | English | Tool |
|-------|----------------|---------|------|
| पढ़ो | padho | read | Read |
| लिखो | likho | write | Write |
| बदलो | badlo | change/edit | Edit |
| खोजो | khojo | search | Grep |
| बनाओ | banao | create | Task |
| हटाओ | hatao | delete | Bash |
| चलाओ | chalao | run | Bash |
| दिखाओ | dikhao | show | Read |

---

## Part 3: Vibecoding Tools

### 3.1 Overview

`@ankr/vibecoding-tools` provides MCP tools for **AI-powered code generation, scaffolding, and style analysis** with a focus on "vibe" - the aesthetic and stylistic qualities of code.

### 3.2 Repository Details

| Metric | Value |
|--------|-------|
| **Location** | `/root/ankr-labs-nx/packages/vibecoding-tools/` |
| **Version** | 1.1.0 |
| **TypeScript Files** | 10 |
| **Lines of Code** | 2,655 |
| **Total Tools** | 11 |

### 3.3 Tool Categories

#### Vibe Analysis (3 tools)

| Tool | Description |
|------|-------------|
| `vibe_analyze` | Analyze code to determine its vibe/style and provide improvement suggestions |
| `vibe_score` | Get a quick vibe score for code (0-100) |
| `vibe_compare` | Compare vibes of two code snippets |

#### Code Generation (3 tools)

| Tool | Description |
|------|-------------|
| `generate_component` | Generate a frontend component (React, Vue, Svelte) with specified vibe |
| `generate_hook` | Generate a custom React hook with specified vibe |
| `generate_util` | Generate a utility function with specified vibe |

#### API Generation (2 tools)

| Tool | Description |
|------|-------------|
| `generate_api_route` | Generate an API route/endpoint for various frameworks |
| `generate_crud_routes` | Generate full CRUD routes for a resource |

#### Scaffolding (3 tools)

| Tool | Description |
|------|-------------|
| `scaffold_project` | Scaffold a new project with specified type and vibe |
| `scaffold_project_smart` | AI-powered scaffolding with RAG context |
| `scaffold_module` | Scaffold a feature module (component + hook + tests) |

### 3.4 Vibe Styles

| Vibe | Emoji | Description |
|------|-------|-------------|
| minimal | 🎯 | Clean and simple, no unnecessary abstractions |
| modern | 🚀 | Contemporary patterns with hooks, functional, TypeScript |
| enterprise | 🏢 | Well-documented, SOLID principles, comprehensive |
| startup | ⚡ | Ship-fast mentality, pragmatic choices |
| aesthetic | ✨ | Beautiful, well-formatted, pleasure to read |
| brutalist | 🪨 | Raw and minimal, no frameworks, vanilla |
| cozy | 🏡 | Familiar patterns, readable, maintainable |
| chaotic | 🌀 | Experimental, unconventional |
| zen | ☯️ | Balanced, harmonious, purposeful |

### 3.5 Supported Frameworks

**Frontend:**
- React, Vue, Svelte, Solid

**Backend:**
- Express, Fastify, Hono, Elysia

**Full-stack:**
- Next.js, Nuxt

### 3.6 ankr5 Integration

```typescript
// From src/integrations/ankr5.ts
export const ankr5Status = {
  available: boolean,
  path: string,
  version: string,
  capabilities: [
    'dynamic-ports',
    'rag-context',
    'eon-memory',
    'mcp-tools',
    'ai-completion'
  ]
};
```

### 3.7 Usage Examples

```typescript
import { executeTool, getAllTools } from '@ankr/vibecoding-tools';

// Analyze code vibe
const result = await executeTool('vibe_analyze', {
  code: `export const Button = ({ onClick }) => <button onClick={onClick}>Click</button>`,
  targetVibe: 'modern'
});
// → { overallVibe: 'minimal', score: 75, suggestions: [...] }

// Generate a component
const component = await executeTool('generate_component', {
  name: 'UserProfile',
  framework: 'react',
  vibe: 'modern',
  props: JSON.stringify({ user: 'User', onEdit: '() => void' }),
  features: 'state,effect'
});

// Scaffold a project
const project = await executeTool('scaffold_project', {
  name: 'my-app',
  type: 'react-app',
  vibe: 'startup'
});
```

---

## Part 4: Vibe Demo Applications

### 4.1 vibe-api-server

| Metric | Value |
|--------|-------|
| **Location** | `/root/vibe-api-server/` |
| **Framework** | Fastify |
| **Port** | 3000 |
| **Features** | User CRUD, CORS, Health checks |

```typescript
// Main endpoints
GET  /           → API info
GET  /health     → Health check
GET  /users      → List users
POST /users      → Create user
GET  /users/:id  → Get user
PUT  /users/:id  → Update user
DELETE /users/:id → Delete user
```

### 4.2 vibe-react-app

| Metric | Value |
|--------|-------|
| **Location** | `/root/vibe-react-app/` |
| **Framework** | React + Vite |
| **Port** | 5173/5180 |
| **Features** | User management UI |

```typescript
// Components
<App>
  ├── User List
  ├── Add User Form
  └── Delete User Button
</App>
```

---

## Part 5: ANKR Ecosystem Integration

### 5.1 Monorepo Overview

| Metric | Value |
|--------|-------|
| **Location** | `/root/ankr-labs-nx/` |
| **Packages** | 185 |
| **Applications** | 39 |
| **Package Manager** | pnpm |
| **Build System** | Nx |

### 5.2 Key Packages Used

| Package | Version | Purpose |
|---------|---------|---------|
| `@ankr/mcp-tools` | 1.0.1 | 255+ MCP business tools |
| `@ankr/ai-router` | 2.0.1 | Multi-LLM provider routing |
| `@ankr/eon` | 3.x | Episodic/semantic memory |
| `@ankr/config` | 1.x | Port & URL configuration |
| `@ankr/i18n` | 1.x | Internationalization |
| `@ankr/oauth` | 1.x | OAuth 2.0 (9 providers) |
| `@ankr/pulse` | 1.x | Observability & monitoring |

### 5.3 MCP Tools Categories (255+)

| Category | Count | Examples |
|----------|-------|----------|
| Compliance | 54 | `gst_verify`, `tds_calculate`, `itr_file`, `mca_search` |
| ERP | 44 | `invoice_create`, `inventory_check`, `order_process` |
| Logistics | 35 | `shipment_track`, `route_optimize`, `freight_calculate` |
| CRM | 30 | `lead_create`, `contact_add`, `deal_update` |
| Banking | 28 | `upi_pay`, `emi_calculate`, `bank_verify` |
| Government | 22 | `aadhaar_verify`, `digilocker_fetch`, `pan_validate` |
| EON Memory | 14 | `eon_remember`, `eon_recall`, `eon_context_query` |
| Ports | 4 | `ankr_get_port`, `ankr_get_url`, `ankr_list_services` |

### 5.4 Service Architecture

| Service | Port | Purpose |
|---------|------|---------|
| AI Proxy | 4444 | Multi-LLM gateway |
| EON Memory | 4005 | Knowledge graph |
| MCP Server | 4445 | MCP tool server |
| Swayam | 4443 | Voice AI |
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Caching |
| Verdaccio | 4873 | Package registry |

---

## Part 6: Current Development Status

### 6.1 AnkrCode Status

| Component | Status | Notes |
|-----------|--------|-------|
| CLI Entry | ✅ Complete | Commander.js |
| Tool Registry | ✅ Complete | Dynamic registration |
| Tool Executor | ✅ Complete | Async execution |
| Conversation Manager | ✅ Complete | Message handling |
| i18n (11 languages) | ✅ Complete | Full Indic support |
| AI Router Adapter | ✅ Complete | 15+ LLM providers |
| EON Memory Adapter | ✅ Complete | Fallback chain |
| MCP Discovery | ✅ Complete | Auto-discover 260+ tools |
| Voice Adapter | ✅ Complete | Swayam integration |
| Unified Adapter | ✅ Complete | ANKR-first architecture |
| Plugin System | ✅ Complete | Git, Docker plugins |
| Workflow Engine | ✅ Complete | YAML automation |
| Agent Spawner | ✅ Complete | Background agents |
| Browser Automation | ✅ Complete | Computer use |
| Shell Completions | ✅ Complete | Bash/Zsh/Fish |
| RocketLang Parser | ✅ Complete | PEG-based |
| RocketLang Compiler | ⚠️ In Progress | Code generation |

### 6.2 Vibecoding Tools Status

| Phase | Status | Tools |
|-------|--------|-------|
| v1.0 Core Tools | ✅ Complete | 10 tools |
| v1.1 Smart Scaffold | ✅ Complete | +1 tool |
| Phase 1: ANKR Integration | ⚠️ Partial | ankr5 detected |
| Phase 2: AI-Powered | ❌ Not Started | RAG, EON |
| Phase 3: Enterprise | ❌ Not Started | Templates |
| Phase 4: Validation | ❌ Not Started | TypeScript check |
| Phase 5: MCP Orchestration | ❌ Not Started | Domain tools |

### 6.3 Known Issues

| Issue | Impact | Priority |
|-------|--------|----------|
| ankr5 not in PATH globally | Medium | P1 |
| Hardcoded port 3000 in scaffold | Low | P2 |
| No RAG context in generation | Medium | P1 |
| No EON memory integration | Medium | P1 |
| No generated code validation | Medium | P2 |

---

## Part 7: Upgrade Roadmap

### 7.1 Vibecoding Tools v2.0 Roadmap

```
Week 1: ANKR Integration
├── Add ankr5 to PATH
├── Integrate @ankr/config for ports
├── Fix hardcoded ports
└── Add service discovery

Week 2: AI-Powered Generation
├── RAG context building
├── EON memory integration
├── Smart scaffold with context
└── Pattern learning

Week 3: Enterprise Templates
├── enterprise-api template
├── enterprise-frontend template
├── Auth flow generation
└── Logging/metrics setup

Week 4: Validation & Quality
├── TypeScript validation
├── ESLint checking
├── Security scanning
└── Auto-test generation

Week 5: MCP Orchestration
├── Multi-tool orchestration
├── Domain-specific generators
└── 255+ tool integration
```

### 7.2 Tool Count Progression

| Phase | New Tools | Total |
|-------|-----------|-------|
| Current v1.1 | - | 11 |
| Phase 1 | +2 | 13 |
| Phase 2 | +4 | 17 |
| Phase 3 | +8 | 25 |
| Phase 4 | +3 | 28 |
| Phase 5 | +7 | **35** |

### 7.3 AnkrCode v3.0 Roadmap

| Feature | Status | Target |
|---------|--------|--------|
| Monorepo integration | Pending | v2.45 |
| RocketLang compiler | In Progress | v2.45 |
| Enterprise plugins | Planned | v3.0 |
| Team collaboration | Planned | v3.0 |
| Cloud sync | Planned | v3.0 |

---

## Part 8: Differentiation from Claude Code

| Feature | Claude Code | AnkrCode |
|---------|-------------|----------|
| **Primary Language** | English | Indic (11 languages) |
| **Input Modes** | Text | Text + Voice + RocketLang DSL |
| **Target User** | Professional devs | Common man + devs |
| **Domain Tools** | Generic (16) | Generic + India-specific (276+) |
| **Memory** | Session-based | EON (persistent knowledge graph) |
| **LLM Provider** | Claude only | 15+ providers (ai-router) |
| **Personality** | Professional | Swayam (friendly, encouraging) |
| **Offline Mode** | No | Yes (Ollama, local models) |
| **Cost** | Premium | Free tier + premium |
| **Cultural Context** | Western | Indian (festivals, business) |

---

## Part 9: Quick Start Guide

### 9.1 AnkrCode

```bash
# Navigate to project
cd /root/ankrcode-project

# Install dependencies
pnpm install

# Build
cd packages/ankrcode-core && pnpm build

# Run doctor to check services
node dist/cli/index.js doctor

# Start interactive chat
node dist/cli/index.js chat --lang hi
```

### 9.2 Vibecoding Tools

```bash
# Navigate to package
cd /root/ankr-labs-nx/packages/vibecoding-tools

# Build
pnpm build

# Test a tool
node -e "
import('@ankr/vibecoding-tools').then(v => {
  console.log('Tools:', v.getAllTools().map(t => t.name));
});
"
```

### 9.3 Vibe Demo Apps

```bash
# Start API
cd /root/vibe-api-server && npm start

# Start React (in another terminal)
cd /root/vibe-react-app && npm run dev

# Access
# API: http://localhost:3000
# Web: http://localhost:5173
```

---

## Part 10: File Inventory

### 10.1 AnkrCode Key Files

```
/root/ankrcode-project/
├── packages/
│   ├── ankrcode-core/
│   │   └── src/
│   │       ├── index.ts              # Main exports
│   │       ├── types.ts              # Type definitions
│   │       ├── tools/                # Core tools (16)
│   │       │   ├── core/
│   │       │   │   ├── file.ts       # Read/Write/Edit
│   │       │   │   ├── search.ts     # Glob/Grep
│   │       │   │   ├── bash.ts       # Shell execution
│   │       │   │   ├── task.ts       # Agent spawning
│   │       │   │   ├── web.ts        # WebFetch/WebSearch
│   │       │   │   ├── notebook.ts   # Jupyter support
│   │       │   │   ├── interactive.ts # Todo/AskUser
│   │       │   │   ├── plan.ts       # Plan mode
│   │       │   │   └── skill.ts      # Skill invocation
│   │       │   └── index.ts
│   │       ├── adapters/             # Unified adapters
│   │       ├── agents/               # Autonomous agents
│   │       ├── ai/                   # AI router adapters
│   │       ├── browser/              # Computer use
│   │       ├── completions/          # Shell completions
│   │       ├── config/               # Configuration
│   │       ├── conversation/         # Conversation manager
│   │       ├── mcp/                  # MCP integration
│   │       ├── memory/               # EON adapter
│   │       ├── plugins/              # Plugin system
│   │       ├── startup/              # Diagnostics
│   │       ├── swayam/               # Voice integration
│   │       ├── voice/                # Voice adapter
│   │       └── workflow/             # Workflow engine
│   └── rocketlang/
│       └── src/
│           ├── grammar/              # PEG grammar
│           ├── parser/               # Parser impl
│           ├── normalizer/           # Code-switching
│           ├── compiler/             # AST → Code
│           └── runtime/              # Execution
├── docs/
│   ├── ankrcode-architecture.md
│   └── ankrcode-tools-spec.md
├── ANKRCODE-COMPLETE-SPEC.md
├── ANKRCODE-ECOSYSTEM.md
├── ANKRCODE-PROJECT-REPORT.md
├── ANKRCODE_TODO.md
├── NEXT-STEPS.md
└── ROADMAP.md
```

### 10.2 Vibecoding Key Files

```
/root/ankr-labs-nx/packages/vibecoding-tools/
├── src/
│   ├── index.ts                      # Main exports
│   ├── types.ts                      # Type definitions
│   ├── server.ts                     # MCP server
│   ├── tools/
│   │   ├── index.ts                  # All tools export
│   │   ├── vibe-analyze.ts           # Vibe analysis tools
│   │   ├── code-generate.ts          # Code generation
│   │   ├── api-generate.ts           # API generation
│   │   └── scaffold.ts               # Project scaffolding
│   └── integrations/
│       ├── index.ts                  # Integration exports
│       └── ankr5.ts                  # ankr5 CLI integration
├── dist/                             # Built output
├── README.md
├── vibe_todo.md
├── ENTERPRISE-UPGRADE-PLAN.md
└── ANKR5-INTEGRATION-GAPS.md
```

---

## Part 11: Dependencies

### 11.1 AnkrCode Dependencies

```json
{
  "dependencies": {
    "@ankr/ai-router": "file:../../../ankr-labs-nx/packages/ai-router",
    "@ankr/config": "file:../../../ankr-labs-nx/libs/ankr-config",
    "@ankr/i18n": "file:../../../ankr-labs-nx/packages/ankr-i18n",
    "@ankr/mcp-tools": "file:../../../ankr-labs-nx/packages/mcp-tools",
    "commander": "^12.x",
    "chalk": "^5.x",
    "ora": "^8.x",
    "inquirer": "^9.x",
    "fast-glob": "^3.x",
    "puppeteer": "^22.x"
  }
}
```

### 11.2 Vibecoding Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0"
  },
  "peerDependencies": {
    "@ankr/config": ">=1.0.0",
    "@ankr/ai-router": ">=2.0.0",
    "@ankr/eon": ">=3.0.0"
  }
}
```

---

## Part 12: Metrics & Statistics

### 12.1 Code Metrics

| Project | Files | Lines | Languages |
|---------|-------|-------|-----------|
| AnkrCode Core | 136 | 54,268 | TypeScript |
| RocketLang | ~30 | ~5,000 | TypeScript |
| Vibecoding Tools | 10 | 2,655 | TypeScript |
| Vibe API Server | 5 | ~300 | TypeScript |
| Vibe React App | 6 | ~400 | TypeScript/TSX |
| **Total** | **~187** | **~62,623** | TypeScript |

### 12.2 Tool Metrics

| Category | Count |
|----------|-------|
| AnkrCode Core Tools | 16 |
| Vibecoding Tools | 11 |
| MCP Domain Tools | 255+ |
| RocketLang Verbs | 8+ |
| **Total Available** | **290+** |

---

## Part 13: Contact & Resources

### 13.1 Repository Links

| Project | Location |
|---------|----------|
| AnkrCode | `/root/ankrcode-project/` |
| Vibecoding | `/root/ankr-labs-nx/packages/vibecoding-tools/` |
| ANKR Monorepo | `/root/ankr-labs-nx/` |
| Vibe API | `/root/vibe-api-server/` |
| Vibe React | `/root/vibe-react-app/` |

### 13.2 Documentation

| Document | Path |
|----------|------|
| AnkrCode Spec | `/root/ankrcode-project/ANKRCODE-COMPLETE-SPEC.md` |
| Architecture | `/root/ankrcode-project/docs/ankrcode-architecture.md` |
| Tools Spec | `/root/ankrcode-project/docs/ankrcode-tools-spec.md` |
| Ecosystem | `/root/ankrcode-project/ANKRCODE-ECOSYSTEM.md` |
| Vibe TODO | `/root/ankr-labs-nx/packages/vibecoding-tools/vibe_todo.md` |
| Enterprise Plan | `/root/ankr-labs-nx/packages/vibecoding-tools/ENTERPRISE-UPGRADE-PLAN.md` |

---

## Appendix A: Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-18 | 1.0.0 | Initial discovery document |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **AnkrCode** | AI coding assistant CLI for India |
| **Vibecoding** | AI-powered code generation with style awareness |
| **RocketLang** | Indic-first DSL for code-switching |
| **Vibe** | Aesthetic/stylistic quality of code |
| **MCP** | Model Context Protocol |
| **EON** | Episodic/Semantic memory system |
| **ANKR-First** | Architecture prioritizing local packages |

---

*Document Generated: 18th January 2026*
*ANKR Labs - Building AI for Bharat*
