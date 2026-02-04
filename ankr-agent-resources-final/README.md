# ANKR Agent Resources

Claude Code skills, commands, and sub-agents for ANKR Labs logistics platform.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🚀 Quick Install

```bash
# Install all ANKR skills
uvx skill-add ankr-labs/ankr-tms-dev
uvx skill-add ankr-labs/ankr-eon-memory
uvx skill-add ankr-labs/ankr-voice-hindi
uvx skill-add ankr-labs/ankr-llmbox
uvx skill-add ankr-labs/ankr-logistics-rag

# Or via Claude Code plugin
/plugin marketplace add ankr-labs/agent-resources
/plugin install ankr-skills@ankr-agent-resources
```

## 📦 What's Included

### Skills

| Skill | Description |
|-------|-------------|
| **ankr-tms-dev** | NestJS/Nx monorepo development patterns for TMS/WMS/OMS |
| **ankr-eon-memory** | Self-evolving memory system with pgvector |
| **ankr-voice-hindi** | SUNOKAHOBOLO multilingual voice AI (Hindi/Tamil/Telugu) |
| **ankr-llmbox** | Multi-provider LLM routing with free-tier priority |
| **ankr-logistics-rag** | RAG for logistics data retrieval |

### Commands

| Command | Description |
|---------|-------------|
| `/ankr-deploy` | Deploy modules to staging/production |
| `/ankr-generate` | Generate module boilerplate |

### Sub-Agents

| Agent | Description |
|-------|-------------|
| **ankr-tms-dispatcher** | Shipment routing and carrier assignment |
| **ankr-customer-care** | Multilingual customer support |

## 🏗️ Architecture

```
ANKR Labs Stack
├── Frontend (React)
├── Backend (NestJS + Fastify)
├── Database (PostgreSQL + pgvector + TimescaleDB)
├── AI Layer
│   ├── LLMBox (Multi-provider routing)
│   ├── ankr-eon (Self-evolving memory)
│   ├── ankr-rag (Retrieval augmented generation)
│   └── SUNOKAHOBOLO (Multilingual voice)
└── Modules
    ├── TMS (Transportation Management)
    ├── WMS (Warehouse Management)
    └── OMS (Order Management)
```

## 🎯 Use Cases

### 1. Development
```
"Create a new shipment tracking module following ANKR patterns"
→ Uses ankr-tms-dev skill for NestJS boilerplate
```

### 2. Voice Commands (Hindi)
```
"मुझे मुंबई के delayed shipments बताओ"
→ Uses ankr-voice-hindi + ankr-logistics-rag
```

### 3. Cost-Optimized AI
```
"Suggest optimal route from Chennai to Delhi"
→ Uses ankr-llmbox (routes to free Groq/LongCat)
```

### 4. Learning from Experience
```
"Why did last week's Mumbai routes fail?"
→ Uses ankr-eon-memory to query past episodes
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Monorepo | Nx + pnpm |
| Backend | NestJS + Fastify |
| Database | PostgreSQL + pgvector |
| ORM | Prisma |
| Validation | Zod |
| LLM | LLMBox (Groq → Ollama → LongCat → DeepSeek) |
| Voice | SUNOKAHOBOLO (Whisper + Chatterbox) |

## 📁 Repository Structure

```
ankr-agent-resources/
├── .claude/
│   ├── skills/
│   │   ├── ankr-tms-dev/
│   │   │   └── SKILL.md
│   │   ├── ankr-eon-memory/
│   │   │   └── SKILL.md
│   │   ├── ankr-voice-hindi/
│   │   │   └── SKILL.md
│   │   ├── ankr-llmbox/
│   │   │   └── SKILL.md
│   │   └── ankr-logistics-rag/
│   │       └── SKILL.md
│   ├── commands/
│   │   ├── ankr-deploy.md
│   │   └── ankr-generate.md
│   └── agents/
│       ├── ankr-tms-dispatcher.md
│       └── ankr-customer-care.md
├── README.md
├── LICENSE
└── marketplace.json
```

## 🔧 Local Development

```bash
# Clone the repo
git clone https://github.com/ankr-labs/agent-resources.git

# Copy skills to your project
cp -r agent-resources/.claude/skills/* your-project/.claude/skills/

# Or symlink for development
ln -s $(pwd)/agent-resources/.claude/skills ~/.claude/skills
```

## 🌐 Integration Methods

### Method 1: Claude Code Plugin (Recommended)
```bash
/plugin marketplace add ankr-labs/agent-resources
```

### Method 2: Direct skill-add
```bash
pip install agent-resources
skill-add ankr-labs/ankr-tms-dev
```

### Method 3: Manual Copy
Copy `.claude/` folder to your project root.

### Method 4: API System Prompt
Inject skill content directly into API system prompts.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your skill/command/agent
4. Test with Claude Code
5. Submit a PR

### Skill Template

```markdown
---
name: your-skill-name
description: "Clear description of what it does and when to use it"
---

# Your Skill Name

## Overview
What this skill does.

## When to Use
Trigger conditions.

## Instructions
Step-by-step guidance for Claude.

## Examples
Code examples and patterns.
```

## 📄 License

MIT License - see [LICENSE](LICENSE)

## 🙏 Acknowledgments

- [Anthropic Skills](https://github.com/anthropics/skills) - Official skill examples
- [VoltAgent/awesome-claude-skills](https://github.com/VoltAgent/awesome-claude-skills) - Community skills
- [kasperjunge/agent-resources-project](https://github.com/kasperjunge/agent-resources-project) - skill-add CLI

---

**Built with ❤️ by ANKR Labs**

*"AI-first 100% | Common Man Solutions"*

Jai Guru Ji 🙏
