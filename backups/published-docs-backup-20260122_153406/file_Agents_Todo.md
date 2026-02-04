# File Agents Implementation Todo

> Based on "Files Are All You Need" by Jerry Liu (LlamaIndex, Jan 2025)

## Overview

This document tracks the implementation of file-centric agent patterns in ankr-mcp, replacing 231+ MCP tools with skill files that agents read on-demand.

## Completed Tasks

### Phase 1: Skills Directory Structure

- [x] Create `/skills` directory structure
- [x] Create README.md with skill index
- [x] Create subdirectories: india/, logistics/, messaging/, payments/, global/

### Phase 2: India Skills

- [x] `india/gst.md` - GST filing, verification, E-way bills, E-invoices
- [x] `india/upi.md` - UPI payments via Razorpay/PayU
- [x] `india/ulip.md` - Vehicle tracking, E-way bills, Fastag
- [x] `india/aadhaar.md` - Aadhaar verification, eKYC
- [x] `india/digilocker.md` - Digital document verification

### Phase 3: Logistics Skills

- [x] `logistics/tracking.md` - Multi-carrier shipment tracking
- [x] `logistics/compliance.md` - HOS, DOT, FMCSA, Hazmat rules
- [x] `logistics/rag.md` - LogisticsRAG knowledge base

### Phase 4: Messaging Skills

- [x] `messaging/telegram.md` - Telegram Bot API (FREE)
- [x] `messaging/whatsapp.md` - WhatsApp Business API

### Phase 5: Global Skills

- [x] `global/http.md` - Generic HTTP requests

### Phase 6: Skill Loader

- [x] Create `src/tools/skills/loader.ts` with:
  - `listSkillCategories()` - List all categories
  - `listSkillsInCategory()` - List skills in a category
  - `listAllSkills()` - List all skills
  - `searchSkills()` - Search by keyword
  - `loadSkill()` - Load skill content
  - `loadSkillFromCategory()` - Load from specific category
  - MCP tools: `skill_list`, `skill_load`, `skill_search`

---

## Pending Tasks

### Phase 7: Integration

- [ ] Update `src/index.ts` to export skill loader
- [ ] Add skill tools to default tools setup
- [ ] Update package.json version
- [ ] Add skills to package.json files array

### Phase 8: File-Output Mode for RAG

- [ ] Modify `logistics_search` to output to file
- [ ] Modify `logistics_retrieve` to output to file
- [ ] Add `output_to_file` parameter to RAG tools
- [ ] Implement file-based context retrieval

### Phase 9: Context Persistence

- [ ] Create `context_store` tool
- [ ] Implement conversation file storage
- [ ] Add context search capability
- [ ] Integrate with EON episodic memory

### Phase 10: Minimal Tools Migration

- [ ] Identify core 5-10 tools to keep
- [ ] Deprecate redundant tool definitions
- [ ] Update documentation
- [ ] Create migration guide

### Phase 11: Testing

- [ ] Test skill loader functions
- [ ] Test MCP skill tools
- [ ] Benchmark context window savings
- [ ] Compare agent performance: tools vs skills

---

## Architecture

### Current (231+ Tools)

```
Agent Context Window
├── System prompt
├── 231 tool definitions (~50k tokens)
├── Conversation history
└── User query
```

### Target (Skills-Based)

```
Agent Context Window
├── System prompt
├── 5-10 core tools (~2k tokens)
├── Skill content (loaded on-demand, ~3k tokens each)
├── Conversation history
└── User query
```

### Token Savings

| Component | Before | After | Savings |
|-----------|--------|-------|---------|
| Tool definitions | ~50k | ~2k | 96% |
| Loaded skills | 0 | ~6k (2 skills) | - |
| **Total** | **~50k** | **~8k** | **84%** |

---

## Key Concepts from Blog Post

### 1. Files as Context Store

Files replace naive RAG:
- Agent reads skill files with `Read()` tool
- Can scan, scroll, search within files
- Natural interface for complex context

### 2. Files as Skills

Skills may replace MCP:
- Easier to define (just markdown)
- Don't bloat context window
- Agent can execute via code interpreter

### 3. Core Tools Only

Minimal tool set:
1. `http` - Generic API calls
2. `logistics_search` - RAG search
3. `logistics_retrieve` - RAG context
4. `bash` - CLI operations
5. `code_interpreter` - Execute code

---

## File Structure

```
ankr-mcp/
├── skills/
│   ├── README.md
│   ├── india/
│   │   ├── gst.md
│   │   ├── upi.md
│   │   ├── ulip.md
│   │   ├── aadhaar.md
│   │   └── digilocker.md
│   ├── logistics/
│   │   ├── tracking.md
│   │   ├── compliance.md
│   │   └── rag.md
│   ├── messaging/
│   │   ├── telegram.md
│   │   └── whatsapp.md
│   ├── payments/
│   │   └── (future: razorpay.md)
│   └── global/
│       ├── README.md
│       └── http.md
├── src/
│   └── tools/
│       └── skills/
│           └── loader.ts
└── file_Agents_Todo.md
```

---

## References

- [Files Are All You Need](https://www.llamaindex.ai/blog/files-are-all-you-need) - Jerry Liu, LlamaIndex
- [Claude Skills](https://www.anthropic.com/news/skills) - Anthropic
- [MCP Protocol](https://modelcontextprotocol.io) - Model Context Protocol

---

## Changelog

### 2026-01-18

- Created skills directory structure
- Implemented all India skills (5 files)
- Implemented all Logistics skills (3 files)
- Implemented all Messaging skills (2 files)
- Implemented Global HTTP skill
- Created skill loader utility with MCP tools
- Created this todo document

---

*Last updated: 2026-01-18*
