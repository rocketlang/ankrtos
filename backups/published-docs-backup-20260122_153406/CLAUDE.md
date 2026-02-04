# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ANKR5 CLI - Your Universal Gateway

**IMPORTANT:** Use `ankr5` CLI for AI operations, port lookups, and system diagnostics.

```bash
# Location: .ankr/cli/
# Build: cd .ankr/cli && npm run build

# Quick commands:
ankr5 gateway status              # Check all services
ankr5 ports get freightbox        # Get port: 4003
ankr5 ports url freightbox        # Get URL: http://localhost:4003/graphql
ankr5 ai ask "your question"      # Quick AI query
ankr5 mcp list                    # List 255+ available tools
ankr5 eon search "query"          # Search memories
```

### When You Need Port/URL Information
Instead of hardcoding, use ankr5:
```bash
ankr5 ports get backend freightbox   # Returns: 4003
ankr5 ports url crm --graphql        # Returns: http://localhost:4010/graphql
ankr5 ports conn postgres            # Returns: postgresql://localhost:5432
```

## ANKR-CTL - Service Management (NO HARDCODING!)

**CRITICAL:** All services are managed via `ankr-ctl`. Never hardcode ports!

### Config Files (Single Source of Truth)
```
/root/.ankr/config/
├── ports.json       # All port assignments
└── services.json    # Service definitions (uses portPath, not numbers!)
```

### Commands
```bash
ankr-ctl status              # View all services
ankr-ctl start <service>     # Start a service
ankr-ctl stop <service>      # Stop a service
ankr-ctl restart <service>   # Restart a service
ankr-ctl health              # Health check all
ankr-ctl ports               # Show port allocations
ankr-ctl env                 # Show injected env vars
```

### Auto-Injected Environment Variables
All services started via ankr-ctl automatically receive:
- `AI_PROXY_URL=http://localhost:4444`
- `EON_URL=http://localhost:4005`
- `WOWTRUCK_URL=http://localhost:4000`
- `OLLAMA_URL=http://localhost:11434`
- And 20+ more - run `ankr-ctl env` to see all

### Database Configuration (VERIFIED 2026-01-20)

**Config File:** `/root/.ankr/config/databases.json`
**Full Docs:** `/root/.ankr/docs/ANKR-DATABASE.md`

| Database | Port | Tables | Apps |
|----------|------|--------|------|
| wowtruck | 5432 | 182 | wowtruck-backend |
| freightbox | 5432 | 39 | freightbox-backend |
| fr8x | 5432 | 87 | fr8x-backend |
| bfc | 5432 | 71 | bfc-api |
| ankr_eon | 5432 | 46 | ankr-eon, devbrain, sidecar |
| ankr_crm | 5432 | 54 | ankr-crm |
| compliance | 5434 | 90 | ankr-compliance (TimescaleDB) |
| odoo_freightbox | 5433 | 640 | odoo-freightbox |

**IMPORTANT:** FreightBox, Fr8X, and Odoo FreightBox are 3 SEPARATE apps!

**Connection URLs:**
```bash
# WowTruck (schema: wowtruck)
DATABASE_URL=postgresql://ankr:indrA@0612@localhost:5432/wowtruck?schema=wowtruck

# FreightBox
DATABASE_URL=postgresql://ankr:indrA@0612@localhost:5432/freightbox

# Fr8X
DATABASE_URL=postgresql://ankr:indrA@0612@localhost:5432/fr8x

# BFC (separate from WowTruck!)
DATABASE_URL=postgresql://ankr:indrA@0612@localhost:5432/bfc

# EON/DevBrain
DATABASE_URL=postgresql://ankr:indrA@0612@localhost:5432/ankr_eon

# Compliance (TimescaleDB)
DATABASE_URL=postgresql://ankr:ankrSecure2025@localhost:5434/compliance
```

**Backup:** Daily at 2 AM → `/root/ankr-backups/daily/`
**Recovery:** All Prisma apps can reinitialize with `npx prisma db push --force-reset`

### Reserved Ports (DO NOT USE!)
- **4002** - BitNinja
- **1167** - Backup service

### For Apps - Use @ankr/ports Package
```typescript
import { getPort, getUrl } from '@ankr/ports';

const port = getPort('backend.wowtruck');     // 4000
const url = getUrl('backend.wowtruck');       // http://localhost:4000
const graphql = getUrl('backend.freightbox', '/graphql');
```

## MCP Tools Available (255+)

The ANKR ecosystem has 255+ MCP tools that AI can invoke. Key categories:

| Category | Tools | Examples |
|----------|-------|----------|
| **Ports** | 4 | `ankr_get_port`, `ankr_get_url`, `ankr_list_services` |
| **Compliance** | 54 | `gst_verify`, `tds_calculate`, `itr_file` |
| **ERP** | 44 | `invoice_create`, `inventory_check` |
| **CRM** | 30 | `lead_create`, `contact_add` |
| **Banking** | 28 | `upi_pay`, `emi_calculate` |
| **Government** | 22 | `aadhaar_verify`, `digilocker_fetch` |
| **Logistics** | 35 | `shipment_track`, `route_optimize` |
| **EON** | 14 | `eon_remember`, `eon_recall`, `eon_context_query` |

### MCP Tool Invocation Pattern
When asked to perform an action that matches an MCP tool, consider:
```typescript
// Tool: ankr_get_port
// Input: { category: "backend", service: "freightbox" }
// Output: { port: 4003, url: "http://localhost:4003" }
```

### Using MCP Servers with Claude Code

MCP servers are configured in `.mcp.json`. To enable:

1. **Build the MCP packages:**
```bash
cd packages/mcp-tools && npm run build
cd packages/ankr-eon && npm run build
```

2. **The .mcp.json file defines available servers:**
```json
{
  "mcpServers": {
    "ankr-eon": { "command": "node", "args": ["packages/ankr-eon/dist/mcp/server.js"] },
    "ankr-mcp-tools": { "command": "node", "args": ["packages/mcp-tools/dist/server.js"] }
  }
}
```

3. **Claude Code will have access to tools like:**
   - `ankr_get_port` - Get service port
   - `eon_remember` - Store memory
   - `eon_recall` - Search memories
   - `gst_validate` - Validate GST number

## Project Overview

ANKR Labs Nx Monorepo - an enterprise platform with AI capabilities, logistics/TMS systems, and voice AI. The monorepo contains ~121 packages under `packages/`, ~30 apps under `apps/`, and shared libraries under `libs/`.

## Build Commands

```bash
# Install dependencies
pnpm install

# CRITICAL: Generate Prisma client before builds
npx prisma generate --schema=apps/wowtruck/backend/prisma/schema.prisma

# Build specific package
npx nx build <project-name>

# Build multiple packages
NX_DAEMON=false npx nx run-many --target=build --projects=@ankr/oauth,@ankr/iam,@ankr/security

# Run tests
npx nx test <project-name>

# Lint
npx nx lint <project-name>

# Type check
npx nx typecheck <project-name>

# View project graph
npx nx graph
```

## CRITICAL: Port Configuration

**SINGLE SOURCE OF TRUTH:** `config/ports.config.ts`

**NEVER hardcode ports.** Always import from `@ankr/config`:

```typescript
import { PORTS, getBackendUrl, getAppPort } from '@ankr/config';

// Direct port access
const port = PORTS.backend.freightbox; // 4003

// URL generation
const graphqlUrl = getBackendUrl('freightbox', '/graphql'); // http://localhost:4003/graphql

// App-specific port
const myPort = getAppPort('freightbox-backend'); // 4003
```

### Port Assignments (Reference)

| Service | Port | Path |
|---------|------|------|
| WowTruck Backend | 4000 | `backend.wowtruck` |
| FreightBox Backend | 4003 | `backend.freightbox` |
| CRM Backend | 4010 | `backend.crm` |
| AI Proxy | 4444 | `ai.proxy` |
| EON Memory | 4005 | `backend.eon` |
| Fr8X Backend | 4050 | `backend.fr8x` |
| EverPure Backend | 4006 | `backend.everpure` |
| Compliance API | 4001 | `backend.compliance` |
| WowTruck Frontend | 3002 | `frontend.wowtruck` |
| FreightBox Frontend | 3001 | `frontend.freightbox` |
| Fr8X Frontend | 3006 | `frontend.fr8x` |

### When Writing Code

1. **Backend apps:** Use `getAppPort()` or `PORTS.backend.X`
2. **Frontend apps:** Use `getBackendUrl()` for API URLs
3. **GraphQL URLs:** Use `URLS.X.graphql()` or `getBackendUrl(X, '/graphql')`
4. **WebSocket URLs:** Use `getBackendWsUrl()` or `URLS.X.ws()`

### Adding New Ports

1. Add to `config/ports.config.ts`
2. Add app mapping to `libs/ankr-config/src/lib/runtime.ts`
3. Use via `@ankr/config` imports

## Key Applications

- **apps/wowtruck/** - TMS (Transport Management System) with backend (port 4000) and frontend (port 3002)
- **apps/freightbox/** - NVOCC freight management with backend (port 4003) and frontend (port 3001)
- **apps/fr8x/** - Freight exchange platform with backend (port 4050) and frontend (port 3006)
- **apps/driver-app/** - Expo React Native mobile app for drivers
- **apps/ankr-pulse/** - Observability and monitoring dashboard
- **apps/ankr-omega/** - AI builder interface with widgets
- **apps/sunokahobolo/** - Voice AI system (Hindi/multilingual)

## Core Packages (@ankr/*)

| Package | Purpose |
|---------|---------|
| @ankr/iam | Identity & Access Management (RBAC, MFA) |
| @ankr/oauth | OAuth 2.0 authentication (9 providers) |
| @ankr/eon | Memory & learning system (episodic/semantic/procedural) |
| @ankr/ai-router | Multi-provider LLM router with failover |
| @ankr/voice-ai | Multilingual voice recognition (Hindi support) |
| @ankr/embeddings | Vector embeddings service (pgvector) |
| @ankr/pulse | Service monitoring & control |
| @ankr/security | WAF, encryption, rate limiting |
| @ankr/entity | Base entity pattern for Prisma |

## Architecture

Three-layer system:
1. **ANKR Command Center** - User-facing AI builder interface (React + Vite + Apollo)
2. **ANKR Pulse** - Admin observability dashboard (real-time WebSocket updates)
3. **ANKR Wire** - Auto-wiring connection layer (service discovery, health checks)

## Tech Stack

- **Frontend**: React 19, Vite, Apollo Client, Tailwind, Shadcn/ui, Zustand
- **Backend**: Fastify, Mercurius (GraphQL), Socket.io
- **Database**: PostgreSQL with pgvector extension, TimescaleDB, Redis
- **ORM**: Prisma 5.22
- **Mobile**: Expo Router, React Native
- **AI**: Anthropic, OpenAI integrations

## Database

| Database | Port | Purpose |
|----------|------|---------|
| Local PostgreSQL | 5432 | Primary development |
| Docker TimescaleDB | 5433 | Time-series metrics |

Default credentials: `ankr / indrA@0612` on database `ankr_eon`

## Local Package Registry

Verdaccio runs on `http://localhost:4873` for @ankr/* packages.

```bash
# Install from local registry
npm install @ankr/package-name --registry http://localhost:4873

# Search packages
npm search @ankr --registry http://localhost:4873
```

## Common Issues

**"Module has no exported member 'PrismaClient'"**
```bash
npx prisma generate --schema=apps/wowtruck/backend/prisma/schema.prisma
```

**"Cannot find module '@ankr/xxx'"**
Check `tsconfig.base.json` has the path mapping for the package.

**Vite CommonJS errors**
```bash
find apps -name "vite.config.js" -type f -delete
rm -rf node_modules/.cache .nx/cache
```

## Path Mappings

Package imports are resolved via `tsconfig.base.json` paths. Each package's tsconfig.json must extend from the base:
```json
{
  "extends": "../../tsconfig.base.json"
}
```

## PM2 Process Management

```bash
# Start all services
./start-ankr.sh

# Check status
./status-ankr.sh

# Stop all
./stop-ankr.sh
```

## Key Directories

- `packages/` - 121 publishable @ankr/* packages
- `apps/` - 30 applications (frontends, backends, mobile)
- `libs/` - Shared internal libraries
- `prisma/` - Database schema and migrations
- `docs/` - Project documentation
