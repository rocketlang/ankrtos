# ANKR Agent Skills

> Auto-generated from skill definitions. Do not edit directly.
> Last updated: 2026-01-16T06:24:07.928Z

## Overview

This document contains 10 skills for the ANKR ecosystem:
- 7 ANKR-specific skills
- 3 Vercel skills

## Skill Index

| Skill | Description |
|-------|-------------|
| `ankr-db` | ANKR database operations for PostgreSQL |
| `ankr-delegate` | Delegate tasks to GPT experts via Codex MCP |
| `ankr-eon` | EON Memory knowledge graph operations |
| `ankr-freightbox` | FreightBox NVOCC platform operations |
| `ankr-mcp` | Access 260+ MCP tools for ANKR operations |
| `ankr-ports` | Get service ports and URLs for ANKR ecosystem services |
| `ankr-wowtruck` | WowTruck TMS (Transport Management System) operations |
| `vercel-deploy` | Deploy applications and websites to Vercel |
| `vercel-react-best-practices` | React and Next |
| `web-design-guidelines` | Review UI code for Web Interface Guidelines compliance |

---

# ANKR Skills


## ankr-db

**Version:** 1.0.0 | **Author:** ankr

**Triggers:** ANKR database operations for PostgreSQL. Use for querying, data analysis, and database management. Triggers on "database", "query", "SQL", "PostgreSQL", "data".

# ANKR Database

PostgreSQL database operations for the ANKR ecosystem.

## Connection Info

- **Host**: localhost
- **Port**: 5432
- **User**: ankr
- **Password**: indrA@0612
- **Database**: ankr_eon

## Usage

### Read Queries
```bash
# Execute SELECT query
bash /mnt/skills/user/ankr-db/scripts/query.sh "SELECT * FROM users LIMIT 10"

# Query with parameters
bash /mnt/skills/user/ankr-db/scripts/query.sh "SELECT * FROM orders WHERE user_id = $1" "123"

# Export to CSV
bash /mnt/skills/user/ankr-db/scripts/query.sh "SELECT * FROM products" --format csv > products.csv
```

### Write Queries
```bash
# Execute INSERT/UPDATE/DELETE
bash /mnt/skills/user/ankr-db/scripts/execute.sh "UPDATE users SET status = 'active' WHERE id = $1" "123"

# Execute in transaction
bash /mnt/skills/user/ankr-db/scripts/transaction.sh << 'EOF'
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
EOF
```

### Schema Operations
```bash
# List tables
bash /mnt/skills/user/ankr-db/scripts/schema.sh tables

# Describe table
bash /mnt/skills/user/ankr-db/scripts/schema.sh describe users

# List indexes
bash /mnt/skills/user/ankr-db/scripts/schema.sh indexes users
```

## MCP Tools

```typescript
// Read query
await mcp__db__query({
  sql: "SELECT * FROM users WHERE status = $1",
  params: ["active"],
  limit: 100
});

// Write query
await mcp__db__execute({
  sql: "UPDATE users SET last_login = NOW() WHERE id = $1",
  params: ["123"]
});

// Transaction
await mcp__db__transaction({
  queries: [
    { sql: "UPDATE accounts SET balance = balance - $1 WHERE id = $2", params: [100, 1] },
    { sql: "UPDATE accounts SET balance = balance + $1 WHERE id = $2", params: [100, 2] }
  ]
});
```

## Common Queries

### User Operations
```sql
-- Get user by ID
SELECT * FROM users WHERE id = $1;

-- Get active users
SELECT * FROM users WHERE status = 'active' ORDER BY created_at DESC;

-- Count users by status
SELECT status, COUNT(*) FROM users GROUP BY status;
```

### Order Operations
```sql
-- Get recent orders
SELECT o.*, u.name as user_name
FROM orders o
JOIN users u ON o.user_id = u.id
ORDER BY o.created_at DESC
LIMIT 20;

-- Orders by date range
SELECT * FROM orders
WHERE created_at BETWEEN $1 AND $2;
```

### Analytics
```sql
-- Daily order count
SELECT DATE(created_at) as date, COUNT(*) as orders
FROM orders
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;
```

## Security

1. **Use parameterized queries** - Never concatenate user input
2. **Limit permissions** - Use read-only connections when possible
3. **Audit sensitive queries** - Log access to PII
4. **Validate input** - Sanitize before querying

## Best Practices

1. **Index frequently queried columns**
2. **Use EXPLAIN ANALYZE for slow queries**
3. **Batch large operations**
4. **Use connection pooling**
5. **Handle NULL values explicitly**

---

## ankr-delegate

**Version:** 1.0.0 | **Author:** ankr

**Triggers:** Delegate tasks to GPT experts via Codex MCP. Use for architecture decisions, code review, security analysis, plan validation. Triggers on "ask GPT", "review", "analyze", "architecture", "security".

# GPT Expert Delegation

Delegate complex tasks to specialized GPT experts via Codex MCP.

## Available Experts

| Expert | Specialty | Trigger Signals |
|--------|-----------|-----------------|
| **Architect** | System design, tradeoffs | "how should I structure", "tradeoffs", 2+ failed fixes |
| **Plan Reviewer** | Plan validation | "review this plan", "validate approach" |
| **Scope Analyst** | Requirements analysis | "what am I missing", vague requirements |
| **Code Reviewer** | Code quality, bugs | "review this code", "find issues" |
| **Security Analyst** | Vulnerabilities | "is this secure", "security review" |
| **Judge** | Meta-review synthesis | After multiple expert reviews |

## Usage

### Automatic Delegation
The system proactively delegates when trigger signals match. No manual intervention needed.

### Explicit Delegation
```bash
# Delegate to specific expert
bash /mnt/skills/user/ankr-delegate/scripts/delegate.sh architect \
  "Analyze tradeoffs between Redis and in-memory caching for session storage"

# Delegate with code context
bash /mnt/skills/user/ankr-delegate/scripts/delegate.sh code-reviewer \
  --files "src/auth.ts,src/session.ts" \
  "Review authentication flow for security issues"
```

## Delegation Format (7 Sections)

Every delegation MUST include:

```markdown
1. TASK: [One sentence - atomic, specific goal]

2. EXPECTED OUTCOME: [What success looks like]

3. CONTEXT:
   - Current state: [what exists now]
   - Relevant code: [paths or snippets]
   - Background: [why this is needed]

4. CONSTRAINTS:
   - Technical: [versions, dependencies]
   - Patterns: [existing conventions]
   - Limitations: [what cannot change]

5. MUST DO:
   - [Requirement 1]
   - [Requirement 2]

6. MUST NOT DO:
   - [Forbidden action 1]
   - [Forbidden action 2]

7. OUTPUT FORMAT:
   - [How to structure response]
```

## Operating Modes

| Mode | Sandbox | Use When |
|------|---------|----------|
| **Advisory** | `read-only` | Analysis, recommendations |
| **Implementation** | `workspace-write` | Making changes, fixing |

## MCP Integration

```typescript
// Delegate to expert
await mcp__codex__codex({
  prompt: "[7-section delegation prompt]",
  "developer-instructions": "[expert system prompt]",
  sandbox: "read-only", // or "workspace-write"
  cwd: "/path/to/project"
});
```

## Expert Selection Guide

| Situation | Expert |
|-----------|--------|
| Database schema design | Architect |
| API architecture | Architect |
| After 2+ failed fixes | Architect |
| Before starting work | Plan Reviewer |
| Vague requirements | Scope Analyst |
| Pre-merge review | Code Reviewer |
| Auth/security changes | Security Analyst |
| Multiple expert reviews | Judge |

## Best Practices

1. **Include full context** - Each call is stateless
2. **Be specific** - Vague prompts get vague results
3. **Verify implementation** - Check expert's work
4. **Synthesize results** - Don't show raw output
5. **Reserve for high-value tasks** - Don't spam experts

---

## ankr-eon

**Version:** 1.0.0 | **Author:** ankr

**Triggers:** EON Memory knowledge graph operations. Use for storing, retrieving, and relating information across conversations. Triggers on "remember", "recall", "store", "knowledge graph", "memory".

# EON Memory

Persistent knowledge graph for storing and retrieving information across conversations and sessions.

## Service Info

- **Port**: 4005
- **URL**: http://localhost:4005
- **Database**: ankr_eon (PostgreSQL)

## Core Operations

### Remember (Store)
```bash
bash /mnt/skills/user/ankr-eon/scripts/remember.sh "<content>" [--tags "tag1,tag2"] [--entity "EntityName"]
```

### Recall (Retrieve)
```bash
bash /mnt/skills/user/ankr-eon/scripts/recall.sh "<query>" [--limit 10] [--tags "tag1"]
```

### Relate (Link Entities)
```bash
bash /mnt/skills/user/ankr-eon/scripts/relate.sh "<entity1>" "<relationship>" "<entity2>"
```

### Search
```bash
bash /mnt/skills/user/ankr-eon/scripts/search.sh "<query>" [--semantic] [--exact]
```

### Forget
```bash
bash /mnt/skills/user/ankr-eon/scripts/forget.sh "<memory-id>"
```

## MCP Tools

Prefer MCP tools when available:

```typescript
// Store memory
await mcp__eon__remember({
  content: "User prefers dark mode",
  tags: ["preferences", "ui"],
  entity: "UserSettings"
});

// Recall memory
await mcp__eon__recall({
  query: "user preferences",
  limit: 5
});

// Create relationship
await mcp__eon__relate({
  from: "User",
  relationship: "PREFERS",
  to: "DarkMode"
});
```

## Data Model

```
Entity {
  id: string
  name: string
  type: string
  properties: Record<string, any>
}

Memory {
  id: string
  content: string
  embedding: vector
  tags: string[]
  entities: Entity[]
  created_at: timestamp
}

Relationship {
  from: Entity
  type: string
  to: Entity
  properties: Record<string, any>
}
```

## Use Cases

| Scenario | Operation |
|----------|-----------|
| Store user preference | `remember` with entity |
| Find past decisions | `recall` with semantic search |
| Link related concepts | `relate` entities |
| Remove outdated info | `forget` by ID |
| Build knowledge graph | Combine operations |

## Best Practices

1. **Tag consistently** - Use standard tag taxonomy
2. **Create entities** - Structure important concepts as entities
3. **Build relationships** - Connect related information
4. **Semantic search** - Use for fuzzy matching
5. **Prune regularly** - Remove outdated memories

---

## ankr-freightbox

**Version:** 1.0.0 | **Author:** ankr

**Triggers:** FreightBox NVOCC platform operations. Use for shipping, booking, container tracking, BL management, and freight operations. Triggers on "shipping", "freight", "container", "BL", "booking", "NVOCC".

# FreightBox

NVOCC (Non-Vessel Operating Common Carrier) platform for freight and shipping operations.

## Service Info

- **Port**: 4003
- **URL**: http://localhost:4003
- **API Base**: http://localhost:4003/api/v1

## Core Operations

### Bookings
```bash
# Create booking
bash /mnt/skills/user/ankr-freightbox/scripts/booking.sh create \
  --origin "INMAA" --destination "USLAX" \
  --cargo-type "FCL" --containers 2

# Get booking
bash /mnt/skills/user/ankr-freightbox/scripts/booking.sh get <booking-id>

# List bookings
bash /mnt/skills/user/ankr-freightbox/scripts/booking.sh list --status "confirmed"
```

### Container Tracking
```bash
# Track container
bash /mnt/skills/user/ankr-freightbox/scripts/container.sh track <container-number>

# Get container history
bash /mnt/skills/user/ankr-freightbox/scripts/container.sh history <container-number>
```

### Bill of Lading (BL)
```bash
# Generate BL
bash /mnt/skills/user/ankr-freightbox/scripts/bl.sh generate <booking-id>

# Get BL
bash /mnt/skills/user/ankr-freightbox/scripts/bl.sh get <bl-number>

# Release BL
bash /mnt/skills/user/ankr-freightbox/scripts/bl.sh release <bl-number>
```

### Rates & Quotes
```bash
# Get rate
bash /mnt/skills/user/ankr-freightbox/scripts/rates.sh get \
  --origin "INMAA" --destination "USLAX" --cargo-type "FCL"

# Create quote
bash /mnt/skills/user/ankr-freightbox/scripts/rates.sh quote \
  --customer "CUST001" --validity 30
```

## MCP Tools

```typescript
// Track shipment
await mcp__freightbox__shipment_track({
  shipmentId: "SHP001"
});

// Create booking
await mcp__freightbox__booking_create({
  origin: "INMAA",
  destination: "USLAX",
  cargoType: "FCL",
  containers: 2
});

// Get rates
await mcp__freightbox__rates_get({
  origin: "INMAA",
  destination: "USLAX"
});
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/bookings` | POST | Create booking |
| `/bookings/:id` | GET | Get booking |
| `/containers/:number/track` | GET | Track container |
| `/bl/:number` | GET | Get BL |
| `/rates` | POST | Get rates |

## Port Codes

Common port codes used in FreightBox:

| Code | Port |
|------|------|
| INMAA | Chennai, India |
| INBOM | Mumbai, India |
| USLAX | Los Angeles, USA |
| SGSIN | Singapore |
| CNSHA | Shanghai, China |

## Best Practices

1. **Validate port codes** - Use UNLOCODE format
2. **Check container format** - Must match ISO 6346
3. **Handle async operations** - Tracking updates are async
4. **Use webhooks** - Subscribe to status updates

---

## ankr-mcp

**Version:** 1.0.0 | **Author:** ankr

**Triggers:** Access 260+ MCP tools for ANKR operations. Use when needing to perform operations that might have an MCP tool available - memory operations, validation, tracking, database queries, AI proxy calls.

# ANKR MCP Tools

Access the ANKR MCP ecosystem with 260+ specialized tools. Before implementing functionality manually, check if an MCP tool exists.

## Tool Categories

### Memory Operations (EON)
| Tool | Purpose |
|------|---------|
| `eon_remember` | Store information in knowledge graph |
| `eon_recall` | Retrieve stored information |
| `eon_forget` | Remove information |
| `eon_search` | Search across memories |
| `eon_relate` | Create relationships between entities |

### Validation
| Tool | Purpose |
|------|---------|
| `gst_validate` | Validate GST numbers |
| `pan_validate` | Validate PAN numbers |
| `ifsc_validate` | Validate IFSC codes |
| `iec_validate` | Validate IEC codes |

### Shipment Operations
| Tool | Purpose |
|------|---------|
| `shipment_track` | Track shipment status |
| `shipment_create` | Create new shipment |
| `shipment_update` | Update shipment details |
| `container_track` | Track container |

### Port Operations
| Tool | Purpose |
|------|---------|
| `ankr_get_port` | Get service port |
| `ankr_get_url` | Get service URL |
| `ankr_health_check` | Check service health |

### Database
| Tool | Purpose |
|------|---------|
| `db_query` | Execute read query |
| `db_execute` | Execute write query |
| `db_transaction` | Execute in transaction |

### AI Proxy
| Tool | Purpose |
|------|---------|
| `ai_complete` | Get LLM completion |
| `ai_embed` | Generate embeddings |
| `ai_analyze` | Analyze content |

## Usage Pattern

```typescript
// Always check for MCP tool first
const result = await mcp__ankr__tool_name({
  param1: "value1",
  param2: "value2"
});
```

## Discovery

```bash
# List available tools
bash /mnt/skills/user/ankr-mcp/scripts/list-tools.sh

# Search for tools
bash /mnt/skills/user/ankr-mcp/scripts/search-tools.sh "shipment"

# Get tool schema
bash /mnt/skills/user/ankr-mcp/scripts/tool-schema.sh eon_remember
```

## Best Practices

1. **Check before implementing** - Search for existing MCP tools before writing code
2. **Use appropriate tool** - Match operation to specialized tool
3. **Handle errors** - MCP tools return structured errors
4. **Batch when possible** - Some tools support batch operations

---

## ankr-ports

**Version:** 1.0.0 | **Author:** ankr

**Triggers:** Get service ports and URLs for ANKR ecosystem services. Use when needing port numbers, service URLs, or configuring connections. Triggers on "get port", "what port", "service URL", "connect to".

# ANKR Ports

Discover and manage service ports across the ANKR ecosystem. Never hardcode ports - always use this skill or `ankr5` CLI.

## Core Services

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| AI Proxy | 4444 | http://localhost:4444 | LLM gateway |
| EON Memory | 4005 | http://localhost:4005 | Knowledge graph |
| FreightBox | 4003 | http://localhost:4003 | NVOCC platform |
| WowTruck | 4000 | http://localhost:4000 | TMS platform |

## Usage

```bash
# Get port for a service
bash /mnt/skills/user/ankr-ports/scripts/get-port.sh <service-name>

# Get full URL for a service
bash /mnt/skills/user/ankr-ports/scripts/get-url.sh <service-name>

# List all services
bash /mnt/skills/user/ankr-ports/scripts/list-services.sh
```

**Examples:**

```bash
# Get FreightBox port
bash /mnt/skills/user/ankr-ports/scripts/get-port.sh freightbox
# Output: 4003

# Get EON Memory URL
bash /mnt/skills/user/ankr-ports/scripts/get-url.sh eon
# Output: http://localhost:4005
```

## CLI Alternative

If `ankr5` CLI is available:

```bash
ankr5 ports get freightbox    # Returns: 4003
ankr5 ports url freightbox    # Returns: http://localhost:4003
ankr5 ports list              # Lists all services
```

## Best Practices

1. **NEVER hardcode ports** - Always use this skill or ankr5 CLI
2. **Use environment variables** - Export PORT_* variables when needed
3. **Health checks** - Verify service is running before connecting
4. **Fallback handling** - Handle connection failures gracefully

---

## ankr-wowtruck

**Version:** 1.0.0 | **Author:** ankr

**Triggers:** WowTruck TMS (Transport Management System) operations. Use for fleet management, trip planning, driver assignment, and logistics. Triggers on "truck", "fleet", "driver", "trip", "transport", "logistics", "TMS".

# WowTruck

Transport Management System (TMS) for fleet and logistics operations.

## Service Info

- **Port**: 4000
- **URL**: http://localhost:4000
- **API Base**: http://localhost:4000/api/v1

## Core Operations

### Fleet Management
```bash
# List vehicles
bash /mnt/skills/user/ankr-wowtruck/scripts/fleet.sh list [--status "active"]

# Get vehicle
bash /mnt/skills/user/ankr-wowtruck/scripts/fleet.sh get <vehicle-id>

# Update vehicle status
bash /mnt/skills/user/ankr-wowtruck/scripts/fleet.sh status <vehicle-id> "available"
```

### Trip Management
```bash
# Create trip
bash /mnt/skills/user/ankr-wowtruck/scripts/trip.sh create \
  --origin "Chennai" --destination "Bangalore" \
  --vehicle "TN01AB1234" --driver "DRV001"

# Get trip status
bash /mnt/skills/user/ankr-wowtruck/scripts/trip.sh status <trip-id>

# Update trip
bash /mnt/skills/user/ankr-wowtruck/scripts/trip.sh update <trip-id> --status "in_transit"
```

### Driver Management
```bash
# List drivers
bash /mnt/skills/user/ankr-wowtruck/scripts/driver.sh list [--available]

# Assign driver
bash /mnt/skills/user/ankr-wowtruck/scripts/driver.sh assign <driver-id> <trip-id>

# Get driver location
bash /mnt/skills/user/ankr-wowtruck/scripts/driver.sh location <driver-id>
```

### Route Planning
```bash
# Plan route
bash /mnt/skills/user/ankr-wowtruck/scripts/route.sh plan \
  --origin "13.0827,80.2707" --destination "12.9716,77.5946" \
  --waypoints "12.5,78.0"

# Optimize routes
bash /mnt/skills/user/ankr-wowtruck/scripts/route.sh optimize --trips "TRIP001,TRIP002,TRIP003"
```

## MCP Tools

```typescript
// Create trip
await mcp__wowtruck__trip_create({
  origin: "Chennai",
  destination: "Bangalore",
  vehicleId: "TN01AB1234",
  driverId: "DRV001"
});

// Track vehicle
await mcp__wowtruck__vehicle_track({
  vehicleId: "TN01AB1234"
});

// Assign driver
await mcp__wowtruck__driver_assign({
  driverId: "DRV001",
  tripId: "TRIP001"
});
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/vehicles` | GET/POST | Fleet operations |
| `/trips` | GET/POST | Trip management |
| `/drivers` | GET/POST | Driver management |
| `/routes/plan` | POST | Route planning |
| `/routes/optimize` | POST | Route optimization |

## Data Model

```
Vehicle {
  id: string
  registrationNumber: string
  type: "truck" | "trailer" | "container"
  capacity: number
  status: "available" | "in_transit" | "maintenance"
  currentLocation: GeoPoint
}

Trip {
  id: string
  origin: Location
  destination: Location
  vehicle: Vehicle
  driver: Driver
  status: "planned" | "in_transit" | "completed"
  eta: timestamp
}

Driver {
  id: string
  name: string
  license: string
  status: "available" | "on_trip" | "off_duty"
  currentLocation: GeoPoint
}
```

## Best Practices

1. **Check availability** - Verify vehicle/driver before assignment
2. **Track in real-time** - Use GPS tracking for live updates
3. **Optimize routes** - Batch nearby deliveries
4. **Handle delays** - Update ETA proactively
5. **Document handoffs** - Record pickup/delivery proof

---

# Vercel Skills


## vercel-deploy

**Version:** 1.0.0 | **Author:** vercel

**Triggers:** Deploy applications and websites to Vercel. Use this skill when the user requests deployment actions such as "Deploy my app", "Deploy this to production", "Create a preview deployment", "Deploy and give me the link", or "Push this live". No authentication required - returns preview URL and claimable deployment link.

# Vercel Deploy

Deploy any project to Vercel instantly. No authentication required.

## How It Works

1. Packages your project into a tarball (excludes `node_modules` and `.git`)
2. Auto-detects framework from `package.json`
3. Uploads to deployment service
4. Returns **Preview URL** (live site) and **Claim URL** (transfer to your Vercel account)

## Usage

```bash
bash /mnt/skills/user/vercel-deploy/scripts/deploy.sh [path]
```

**Arguments:**
- `path` - Directory to deploy, or a `.tgz` file (defaults to current directory)

**Examples:**

```bash
# Deploy current directory
bash /mnt/skills/user/vercel-deploy/scripts/deploy.sh

# Deploy specific project
bash /mnt/skills/user/vercel-deploy/scripts/deploy.sh /path/to/project

# Deploy existing tarball
bash /mnt/skills/user/vercel-deploy/scripts/deploy.sh /path/to/project.tgz
```

## Output

```
Preparing deployment...
Detected framework: nextjs
Creating deployment package...
Deploying...
✓ Deployment successful!

Preview URL: https://skill-deploy-abc123.vercel.app
Claim URL:   https://vercel.com/claim-deployment?code=...
```

The script also outputs JSON to stdout for programmatic use:

```json
{
  "previewUrl": "https://skill-deploy-abc123.vercel.app",
  "claimUrl": "https://vercel.com/claim-deployment?code=...",
  "deploymentId": "dpl_...",
  "projectId": "prj_..."
}
```

## Framework Detection

The script auto-detects frameworks from `package.json`. Supported frameworks include:

- **React**: Next.js, Gatsby, Create React App, Remix, React Router
- **Vue**: Nuxt, Vitepress, Vuepress, Gridsome
- **Svelte**: SvelteKit, Svelte, Sapper
- **Other Frontend**: Astro, Solid Start, Angular, Ember, Preact, Docusaurus
- **Backend**: Express, Hono, Fastify, NestJS, Elysia, h3, Nitro
- **Build Tools**: Vite, Parcel
- **And more**: Blitz, Hydrogen, RedwoodJS, Storybook, Sanity, etc.

For static HTML projects (no `package.json`), framework is set to `null`.

## Static HTML Projects

For projects without a `package.json`:
- If there's a single `.html` file not named `index.html`, it gets renamed automatically
- This ensures the page is served at the root URL (`/`)

## Present Results to User

Always show both URLs:

```
✓ Deployment successful!

Preview URL: https://skill-deploy-abc123.vercel.app
Claim URL:   https://vercel.com/claim-deployment?code=...

View your site at the Preview URL.
To transfer this deployment to your Vercel account, visit the Claim URL.
```

## Troubleshooting

### Network Egress Error

If deployment fails due to network restrictions (common on claude.ai), tell the user:

```
Deployment failed due to network restrictions. To fix this:

1. Go to https://claude.ai/admin-settings/capabilities
2. Add *.vercel.com to the allowed domains
3. Try deploying again
```

---

## vercel-react-best-practices

**Version:** 1.0.0 | **Author:** vercel

**Triggers:** React and Next.js performance optimization guidelines from Vercel Engineering. This skill should be used when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance patterns. Triggers on tasks involving React components, Next.js pages, data fetching, bundle optimization, or performance improvements.

# Vercel React Best Practices

Comprehensive performance optimization guide for React and Next.js applications, maintained by Vercel. Contains 45 rules across 8 categories, prioritized by impact to guide automated refactoring and code generation.

## When to Apply

Reference these guidelines when:
- Writing new React components or Next.js pages
- Implementing data fetching (client or server-side)
- Reviewing code for performance issues
- Refactoring existing React/Next.js code
- Optimizing bundle size or load times

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Eliminating Waterfalls | CRITICAL | `async-` |
| 2 | Bundle Size Optimization | CRITICAL | `bundle-` |
| 3 | Server-Side Performance | HIGH | `server-` |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | `client-` |
| 5 | Re-render Optimization | MEDIUM | `rerender-` |
| 6 | Rendering Performance | MEDIUM | `rendering-` |
| 7 | JavaScript Performance | LOW-MEDIUM | `js-` |
| 8 | Advanced Patterns | LOW | `advanced-` |

## Quick Reference

### 1. Eliminating Waterfalls (CRITICAL)

- `async-defer-await` - Move await into branches where actually used
- `async-parallel` - Use Promise.all() for independent operations
- `async-dependencies` - Use better-all for partial dependencies
- `async-api-routes` - Start promises early, await late in API routes
- `async-suspense-boundaries` - Use Suspense to stream content

### 2. Bundle Size Optimization (CRITICAL)

- `bundle-barrel-imports` - Import directly, avoid barrel files
- `bundle-dynamic-imports` - Use next/dynamic for heavy components
- `bundle-defer-third-party` - Load analytics/logging after hydration
- `bundle-conditional` - Load modules only when feature is activated
- `bundle-preload` - Preload on hover/focus for perceived speed

### 3. Server-Side Performance (HIGH)

- `server-cache-react` - Use React.cache() for per-request deduplication
- `server-cache-lru` - Use LRU cache for cross-request caching
- `server-serialization` - Minimize data passed to client components
- `server-parallel-fetching` - Restructure components to parallelize fetches
- `server-after-nonblocking` - Use after() for non-blocking operations

### 4. Client-Side Data Fetching (MEDIUM-HIGH)

- `client-swr-dedup` - Use SWR for automatic request deduplication
- `client-event-listeners` - Deduplicate global event listeners

### 5. Re-render Optimization (MEDIUM)

- `rerender-defer-reads` - Don't subscribe to state only used in callbacks
- `rerender-memo` - Extract expensive work into memoized components
- `rerender-dependencies` - Use primitive dependencies in effects
- `rerender-derived-state` - Subscribe to derived booleans, not raw values
- `rerender-functional-setstate` - Use functional setState for stable callbacks
- `rerender-lazy-state-init` - Pass function to useState for expensive values
- `rerender-transitions` - Use startTransition for non-urgent updates

### 6. Rendering Performance (MEDIUM)

- `rendering-animate-svg-wrapper` - Animate div wrapper, not SVG element
- `rendering-content-visibility` - Use content-visibility for long lists
- `rendering-hoist-jsx` - Extract static JSX outside components
- `rendering-svg-precision` - Reduce SVG coordinate precision
- `rendering-hydration-no-flicker` - Use inline script for client-only data
- `rendering-activity` - Use Activity component for show/hide
- `rendering-conditional-render` - Use ternary, not && for conditionals

### 7. JavaScript Performance (LOW-MEDIUM)

- `js-batch-dom-css` - Group CSS changes via classes or cssText
- `js-index-maps` - Build Map for repeated lookups
- `js-cache-property-access` - Cache object properties in loops
- `js-cache-function-results` - Cache function results in module-level Map
- `js-cache-storage` - Cache localStorage/sessionStorage reads
- `js-combine-iterations` - Combine multiple filter/map into one loop
- `js-length-check-first` - Check array length before expensive comparison
- `js-early-exit` - Return early from functions
- `js-hoist-regexp` - Hoist RegExp creation outside loops
- `js-min-max-loop` - Use loop for min/max instead of sort
- `js-set-map-lookups` - Use Set/Map for O(1) lookups
- `js-tosorted-immutable` - Use toSorted() for immutability

### 8. Advanced Patterns (LOW)

- `advanced-event-handler-refs` - Store event handlers in refs
- `advanced-use-latest` - useLatest for stable callback refs

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/async-parallel.md
rules/bundle-barrel-imports.md
rules/_sections.md
```

Each rule file contains:
- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Additional context and references

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`

---

## web-design-guidelines

**Version:** 1.0.0 | **Author:** vercel

**Triggers:** Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

## How It Works

1. Fetch the latest guidelines from the source URL below
2. Read the specified files (or prompt user for files/pattern)
3. Check against all rules in the fetched guidelines
4. Output findings in the terse `file:line` format

## Guidelines Source

Fetch fresh guidelines before each review:

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

Use WebFetch to retrieve the latest rules. The fetched content contains all the rules and output format instructions.

## Usage

When a user provides a file or pattern argument:
1. Fetch guidelines from the source URL above
2. Read the specified files
3. Apply all rules from the fetched guidelines
4. Output findings using the format specified in the guidelines

If no files specified, ask the user which files to review.

---
