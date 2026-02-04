# ANKR Swayam - Agent Skills

AI agent capabilities for the ANKR ecosystem. Built on the [Agent Skills](https://github.com/vercel-labs/agent-skills) format.

## Skills Included

### ANKR Skills (7)

| Skill | Purpose |
|-------|---------|
| `ankr-ports` | Service port discovery |
| `ankr-mcp` | 260+ MCP tool access |
| `ankr-eon` | EON Memory knowledge graph |
| `ankr-freightbox` | FreightBox NVOCC platform |
| `ankr-wowtruck` | WowTruck TMS platform |
| `ankr-db` | PostgreSQL database operations |
| `ankr-delegate` | GPT expert delegation |

### Vercel Skills (3)

| Skill | Purpose |
|-------|---------|
| `react-best-practices` | 45 React/Next.js performance rules |
| `web-design-guidelines` | 100+ UI/UX audit rules |
| `vercel-deploy` | Deploy to Vercel (no auth required) |

## Installation

### Quick Install

```bash
npm run install-skills
```

This copies all skills to `~/.claude/skills/`.

### Manual Install

```bash
cp -r skills/* ~/.claude/skills/
```

## Usage

Skills activate automatically when task matches triggers:

| Say | Activates |
|-----|-----------|
| "What port is FreightBox on?" | `ankr-ports` |
| "Remember that user prefers dark mode" | `ankr-eon` |
| "Track container MSCU1234567" | `ankr-freightbox` |
| "Get available drivers" | `ankr-wowtruck` |
| "Query the database for recent orders" | `ankr-db` |
| "Ask GPT to review this architecture" | `ankr-delegate` |
| "Deploy my app" | `vercel-deploy` |
| "Review this React component" | `react-best-practices` |

## Development

### Build AGENTS.md

```bash
npm run build
```

Compiles all skills into a unified `AGENTS.md` document.

### Validate Skills

```bash
npm run validate
```

Checks skill structure and metadata.

### Package Skills

```bash
npm run package
```

Creates zip packages in `dist/` for distribution.

## Skill Structure

```
skills/{skill-name}/
├── SKILL.md           # Skill definition (required)
├── scripts/           # Executable scripts
│   └── *.sh
└── references/        # Supporting documentation (optional)
```

### SKILL.md Format

```yaml
---
name: skill-name
description: Trigger phrases. Use when...
metadata:
  author: ankr
  version: "1.0.0"
---

# Skill Title

Description and usage instructions.
```

## Core Services

| Service | Port | Purpose |
|---------|------|---------|
| FreightBox | 4003 | NVOCC platform |
| WowTruck | 4000 | TMS platform |
| EON Memory | 4005 | Knowledge graph |
| AI Proxy | 4444 | LLM gateway |
| PostgreSQL | 5432 | Database |

## License

MIT
