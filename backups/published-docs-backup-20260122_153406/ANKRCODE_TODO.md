# AnkrCode TODO & Implementation Tracker

> **Last Updated**: 2026-01-16
> **Version**: 2.1.0-dev

## Quick Links

- [Implementation Status](#implementation-status)
- [Priority Tasks](#priority-tasks)
- [Claude Reference](#claude-reference)

---

## Implementation Status

### Core Components

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| CLI Entry | ✅ Done | `src/cli/index.ts` | Commander.js |
| Tool Registry | ✅ Done | `src/tools/registry.ts` | Dynamic registration |
| Tool Executor | ✅ Done | `src/tools/executor.ts` | Async execution |
| Conversation Manager | ✅ Done | `src/conversation/manager.ts` | Message handling |
| i18n (11 languages) | ✅ Done | `src/i18n/index.ts` | Hindi, Tamil, Telugu, etc. |

### Tool Implementation

| Tool | Status | Location | Claude Code Parity |
|------|--------|----------|-------------------|
| Read | ✅ Done | `src/tools/core/file.ts` | 100% |
| Write | ✅ Done | `src/tools/core/file.ts` | 100% |
| Edit | ✅ Done | `src/tools/core/file.ts` | 100% |
| Glob | ✅ Done | `src/tools/core/search.ts` | 100% |
| Grep | ✅ Done | `src/tools/core/search.ts` | 100% |
| Bash | ✅ Done | `src/tools/core/bash.ts` | 90% |
| Task | ✅ Done | `src/tools/core/task.ts` | 80% |
| TodoWrite | ✅ Done | `src/tools/core/interactive.ts` | 100% |
| AskUserQuestion | ✅ Done | `src/tools/core/interactive.ts` | 100% |
| WebFetch | ✅ Done | `src/tools/core/web.ts` | 80% |
| WebSearch | ⚠️ Basic | `src/tools/core/web.ts` | 60% |
| EnterPlanMode | ✅ Done | `src/tools/core/plan.ts` | 100% |
| ExitPlanMode | ✅ Done | `src/tools/core/plan.ts` | 100% |
| Skill | ⚠️ Basic | `src/tools/core/skill.ts` | 70% |
| NotebookEdit | ❌ TODO | - | 0% |

### Adapters

| Adapter | Status | Location | Fallback Chain |
|---------|--------|----------|----------------|
| AI Router | ✅ Done | `src/ai/router-adapter.ts` | AI Proxy → Direct API |
| Offline Mode | ✅ Done | `src/ai/offline-adapter.ts` | Local-only |
| EON Memory | ⚠️ Basic | `src/memory/eon-adapter.ts` | Package → Service → InMemory |
| MCP Tools | ⚠️ Basic | `src/mcp/adapter.ts` | Package → Server → Core |
| Voice/Swayam | ⚠️ Basic | `src/voice/adapter.ts` | Swayam → Web Speech |
| **Unified Adapter** | ✅ Done | `src/adapters/unified.ts` | Full ANKR-first fallback |
| **Startup Diagnostics** | ✅ Done | `src/startup/diagnostics.ts` | Health checks |
| **MCP Discovery** | ✅ Done | `src/mcp/discovery.ts` | Auto-discover tools |

### RocketLang DSL

| Feature | Status | Location |
|---------|--------|----------|
| PEG Parser | ✅ Done | `packages/rocketlang/src/parser/` |
| Hindi Verbs | ✅ Done | Normalizer |
| Code-switching | ✅ Done | Normalizer |
| Tamil/Telugu | ⚠️ Basic | Partial support |
| Compiler | ❌ TODO | Generate tool calls |

---

## Priority Tasks

### ✅ P0: Critical (COMPLETED)

#### 1. Unified Adapter with Full Fallback Chain ✅
**File**: `src/adapters/unified.ts`

```typescript
// ANKR-first architecture implemented
import { createUnifiedAdapter } from './adapters/unified';

const adapters = await createUnifiedAdapter();
// → Uses: packages → services → proxy → direct APIs
```

**Completed**:
- [x] Create `src/adapters/unified.ts`
- [x] Implement package detection at startup
- [x] Add health checks for all services
- [x] Create graceful degradation logic
- [x] Export from main index.ts

#### 2. Startup Diagnostics ✅
**File**: `src/startup/diagnostics.ts`

```bash
$ ankrcode doctor
╭─────────────────────────────────────────╮
│        AnkrCode Health Check            │
├─────────────────────────────────────────┤
│ ANKR Packages:                          │
│   ✅ @ankr/eon (2.0.0)                  │
│   ...                                   │
│ Mode: ANKR-First + AI Proxy             │
╰─────────────────────────────────────────╯
```

**Completed**:
- [x] Create diagnostics module
- [x] Add `ankrcode doctor` command
- [x] Display package versions
- [x] Check service health with latency
- [x] Recommend fixes for issues

#### 3. MCP Tool Auto-Discovery ✅
**File**: `src/mcp/discovery.ts`

```typescript
import { discoverMCPTools } from './mcp/discovery';

const result = await discoverMCPTools();
// → { tools: [...], categories: [...], source: 'package', duration: 42 }
```

**Completed**:
- [x] Scan @ankr/mcp-tools for available tools
- [x] Create tool wrappers with proper schemas
- [x] Implement lazy loading for performance
- [x] Add tool categories (Compliance, Banking, etc.)
- [x] Cache tool definitions

### 🟡 P1: Important (Next Week)

#### 4. NotebookEdit Tool
**File**: `src/tools/core/notebook.ts` (NEW)

Implement Jupyter notebook editing support:
- [ ] Parse .ipynb JSON structure
- [ ] Edit cell contents
- [ ] Insert/delete cells
- [ ] Handle cell outputs

#### 5. Enhanced WebSearch
**File**: `src/tools/core/web.ts`

- [ ] Integrate with SearXNG or similar
- [ ] Add domain filtering
- [ ] Improve result formatting
- [ ] Add caching

#### 6. Voice Pipeline Improvements
**File**: `src/voice/adapter.ts`

- [ ] Real-time streaming transcription
- [ ] Better language detection
- [ ] Interrupt handling
- [ ] TTS feedback

### 🟢 P2: Nice to Have (Month)

#### 7. Monorepo Integration
- [ ] Move packages to `ankr-labs-nx/packages/`
- [ ] Configure Nx build targets
- [ ] Set up workspace dependencies

#### 8. Plugin System
- [ ] Define plugin interface
- [ ] Create plugin loader
- [ ] Example plugins (git, docker)

#### 9. Conversation Persistence
- [ ] Save conversations to EON
- [ ] Resume sessions
- [ ] Search history

---

## Claude Reference

### What is AnkrCode?

AnkrCode is an AI coding assistant CLI built for Indian developers with:
- **Indic-first**: 11 Indian languages (Hindi, Tamil, Telugu, Kannada, etc.)
- **Voice-enabled**: Speak commands naturally
- **RocketLang DSL**: Mix Hindi/English naturally
- **260+ Domain Tools**: GST, Banking, Logistics, Government
- **ANKR Integration**: Leverages ANKR ecosystem

### CLI Commands

```bash
ankrcode chat              # Interactive chat
ankrcode chat --lang ta    # Tamil mode
ankrcode ask "question"    # Single question
ankrcode tools             # List tools
ankrcode tools --category compliance  # Filter by category
ankrcode doctor            # Health check
ankrcode run script.rocket # Run RocketLang
ankrcode config            # Configuration
```

### RocketLang Syntax

```rocketlang
# Hindi commands
पढ़ो "file.ts"              # Read file
लिखो "content" में "file"   # Write file
बनाओ function for login    # Create function
खोजो "TODO" in src/        # Search

# Code-switching
ek API banao for users     # Create an API
database mein check karo   # Check database
commit karo "fixed bug"    # Git commit

# Bash escape
$ npm install
$ git status
```

### Tool Usage

| Tool | Hindi | Romanized | Example |
|------|-------|-----------|---------|
| Read | पढ़ो | padho | `पढ़ो "config.ts"` |
| Write | लिखो | likho | `likho "hello" in file.txt` |
| Edit | बदलो | badlo | `badlo "old" → "new" in file` |
| Search | खोजो | khojo | `khojo "error" in logs/` |
| Create | बनाओ | banao | `banao function for auth` |
| Delete | मिटाओ | mitao | `mitao "temp.txt"` |
| Run | चलाओ | chalao | `chalao "npm test"` |
| Show | दिखाओ | dikhao | `dikhao git status` |

### MCP Tool Categories

```typescript
// 255+ tools organized by domain
const categories = {
  compliance: 54,  // GST, TDS, ITR
  banking: 28,     // UPI, NEFT, EMI
  logistics: 35,   // Shipment, Route
  government: 22,  // Aadhaar, DigiLocker
  memory: 14,      // EON recall/remember
  erp: 44,         // Invoice, Inventory
  crm: 30,         // Lead, Contact
  other: 28,
};
```

### Architecture

```
┌─────────────────────────────────────────┐
│              AnkrCode CLI               │
├─────────────────────────────────────────┤
│ Priority 1: @ankr/* packages            │
│   @ankr/eon, @ankr/mcp-tools            │
├─────────────────────────────────────────┤
│ Priority 2: ANKR Services               │
│   EON :4005, MCP :4006, Swayam :7777    │
├─────────────────────────────────────────┤
│ Priority 3: AI Proxy :4444              │
│   Routes to best LLM, caches, fallback  │
├─────────────────────────────────────────┤
│ Priority 4: Direct LLM APIs             │
│   Claude, OpenAI, Groq (fallback only)  │
└─────────────────────────────────────────┘
```

### For AI Assistants Working on AnkrCode

1. **ANKR-first**: Always try `@ankr/*` packages before external dependencies
2. **Graceful degradation**: Every adapter needs fallback chain
3. **i18n required**: User-facing strings must use `t(lang, key)`
4. **Code-switching**: Support mixed Hindi-English input
5. **Port conventions**: Use `ankr5 ports get <service>`

### Environment Variables

```bash
ANTHROPIC_API_KEY=sk-...
AI_PROXY_URL=http://localhost:4444
EON_URL=http://localhost:4005
MCP_URL=http://localhost:4006
ANKRCODE_LANG=hi
ANKRCODE_VOICE=true
```

### Project Structure

```
ankrcode-project/
├── packages/
│   ├── ankrcode-core/        # Main CLI
│   │   └── src/
│   │       ├── cli/          # Entry point
│   │       ├── tools/        # 14 core tools
│   │       ├── adapters/     # Unified adapter (NEW)
│   │       ├── ai/           # LLM adapters
│   │       ├── mcp/          # MCP integration
│   │       ├── memory/       # EON adapter
│   │       ├── voice/        # Swayam integration
│   │       ├── i18n/         # 11 languages
│   │       ├── config/       # Configuration
│   │       └── swayam/       # Personality
│   └── rocketlang/           # DSL parser
└── docs/
```

---

## Changelog

### 2026-01-16
- Added implementation status tracking
- Created priority task list
- Added Claude reference section
- Defined unified adapter requirements

### Previous
- Initial TODO structure
- Basic tool inventory
