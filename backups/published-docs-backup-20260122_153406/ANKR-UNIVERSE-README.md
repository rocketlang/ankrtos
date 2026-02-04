# ANKR Universe

> **"AI + Layman = Anyone Can Build Anything"**

The unified showcase platform that demonstrates the complete ANKR ecosystem - 350+ MCP tools, 224 packages, intelligent agents, and 11 Indian languages, all working together through conversational intelligence.

---

## Table of Contents

- [Overview](#overview)
- [Live Products](#live-products)
- [AI & Agents](#ai--agents)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development](#development)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

ANKR Universe is a **world-class demonstration platform** that showcases the richness of the ANKR ecosystem. It provides:

- **Conversational Interface**: Natural language interaction with 350+ MCP tools
- **Intelligent Agents**: Tasher (agentic task completion), VibeCoder, AnkrCode
- **Voice AI**: 11 Indian language support via Swayam voice engine
- **Real-time Visualization**: See tools execute, memory learn, and costs track live
- **Interactive Demos**: Hands-on playgrounds for every tool and package
- **Production Apps**: WowTruck, FreightBox, ankrBFC, ComplyMitra, Saathi, bani.ai

### Key Metrics

| Metric | Value |
|--------|-------|
| MCP Tools | 350+ |
| NPM Packages | 224 (@ankr scope) |
| Languages | 11 Indian |
| Intelligent Agents | 5+ (Tasher, VibeCoder, AnkrCode, Swayam, etc.) |
| SLM Coverage | 70% (FREE) |
| Avg Latency | <500ms |
| Cost Savings | 93% vs pure LLM |

---

## Live Products

Production applications built on ANKR ecosystem:

| Product | Description | Status |
|---------|-------------|--------|
| **WowTruck** | Transport Management System (TMS) - fleet tracking, trip management, driver app | ✅ Live |
| **FreightBox** | NVOCC freight management - shipments, containers, port operations | ✅ Live |
| **ankrBFC** | Business Finance Center - invoice factoring, credit scoring, insurance | ✅ Live |
| **ComplyMitra** | GST compliance automation - returns, reconciliation, e-invoicing | ✅ Live |
| **Saathi** | AI assistant for trucking - voice-enabled, multilingual | ✅ Live |
| **bani.ai** | All-in-one AI bot platform - WhatsApp, Telegram, Web | ✅ Live |
| **Swayam** | Voice AI engine - 11 Indian languages, STT/TTS | ✅ Live |
| **Fr8X** | Freight exchange platform - load matching, rate discovery | 🚧 Beta |
| **EverPure** | Water quality monitoring - IoT sensors, analytics | 🚧 Beta |

---

## AI & Agents

### Tasher - Agentic Task Completion

**Tasher** (Tasker + Dasher) is our Manus AI-style autonomous task completion system:

```
User: "Create a GST-compliant invoice for Ramesh Enterprises, ₹50,000, send via WhatsApp"
                    ↓
         [Tasher Task Orchestrator]
                    ↓
    ┌──────────────────────────────────────┐
    │  5 Specialized Agents Working:       │
    │  1. Research Agent (verify GSTIN)    │
    │  2. Calculator Agent (compute GST)   │
    │  3. Document Agent (generate PDF)    │
    │  4. Communication Agent (WhatsApp)   │
    │  5. Memory Agent (store interaction) │
    └──────────────────────────────────────┘
                    ↓
         [Task Completed: 4.2 seconds]
```

### VibeCoder - AI-Powered Development

**VibeCoder** is the AI coding assistant with multi-agent swarm:
- **Code Generation**: Write code from natural language descriptions
- **Code Review**: Analyze and improve existing code
- **Refactoring**: Intelligent code restructuring
- **Test Generation**: Auto-generate test cases
- **Documentation**: Generate docs from code

### AnkrCode - AI Coding Assistant for Bharat

**AnkrCode** is the Indian-focused coding assistant:
- **Hindi Code Comments**: Write code with Hindi documentation
- **Hinglish Support**: Mix Hindi-English naturally
- **India-Specific APIs**: GST, UPI, Aadhaar integrations built-in
- **Regional Context**: Understand Indian business workflows

### Swayam - Voice AI Engine

**Swayam** is the all-in-one voice bot:
- **11 Indian Languages**: Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, English
- **STT/TTS**: Speech-to-text and text-to-speech
- **Wake Word**: "Hey Swayam" activation
- **Multi-turn Conversations**: Context-aware dialogues

### EON Memory System

Three-layer cognitive memory architecture:

| Layer | Purpose | Example |
|-------|---------|---------|
| **Episodic** | What happened | "User generated 5 invoices today" |
| **Semantic** | Facts & knowledge | "GST rate for HSN 8471 is 18%" |
| **Procedural** | Patterns & skills | "Invoice → WhatsApp workflow" |

---

## Features

### Conversational Intelligence

```
User: "50 हजार का invoice बनाकर Ramesh ji को WhatsApp करो"
                    ↓
         [Intent: invoice_generate]
         [Entities: amount=50000, person=Ramesh ji]
                    ↓
         [SLM Routing: Tier 2 - Local, 127ms, $0.0001]
                    ↓
         [Tools: gst_calc → einvoice → whatsapp_send]
                    ↓
Response: "Invoice INV-2026-001 generated and sent to Ramesh ji"
```

### 4-Tier SLM Routing

| Tier | Type | Latency | Cost | Coverage |
|------|------|---------|------|----------|
| 0 | EON Memory | ~0ms | FREE | 10% |
| 1 | Deterministic | <10ms | FREE | 20% |
| 2 | SLM (Local) | 50-200ms | $0.0001 | 65% |
| 3 | LLM (Claude) | 1-5s | $0.01+ | 5% |

### Voice Support (11 Languages)

- Hindi (हिंदी)
- English
- Tamil (தமிழ்)
- Telugu (తెలుగు)
- Bengali (বাংলা)
- Marathi (मराठी)
- Gujarati (ગુજરાતી)
- Kannada (ಕನ್ನಡ)
- Malayalam (മലയാളം)
- Punjabi (ਪੰਜਾਬੀ)
- Odia (ଓଡ଼ିଆ)

### EON Memory System

| Type | Purpose | Example |
|------|---------|---------|
| Episodic | What happened | "User generated 5 invoices today" |
| Semantic | Facts & knowledge | "GST rate for HSN 8471 is 18%" |
| Procedural | Patterns & skills | "Invoice → WhatsApp workflow" |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
│   Web App │ Mobile App │ Voice │ CLI (AnkrCode)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ANKR GATEWAY (4500)                          │
│              GraphQL + REST + WebSocket                         │
│         Auth │ Rate Limit │ Tracing │ Multi-tenant             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              CONVERSATIONAL INTELLIGENCE                         │
│   Intent Classifier → Entity Extractor → Context Engine         │
│   Persona Manager → Response Generator → Memory Agent           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 SLM ROUTER (4-Tier Cascade)                     │
│   EON Memory → Deterministic → SLM (Ollama) → LLM (Claude)     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MCP TOOLS (350+)                             │
│   GST(54) │ Banking(28) │ Logistics(35) │ ERP(44) │ Govt(22)  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│   PostgreSQL+pgvector │ Redis │ EON Memory │ Knowledge Base    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 16 with pgvector
- Redis 7+
- Ollama (for local SLM)

### Installation

```bash
# Clone the repository
git clone https://github.com/ankr/ankr-universe.git
cd ankr-universe

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start infrastructure with Docker
docker-compose up -d postgres redis ollama

# Pull SLM model
docker exec -it ankr-ollama ollama pull qwen2.5:1.5b

# Run database migrations
pnpm db:migrate

# Seed initial data
pnpm db:seed

# Start development servers
pnpm dev
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Web App | http://localhost:3500 | Main frontend |
| Gateway API | http://localhost:4500 | GraphQL + WS |
| GraphiQL | http://localhost:4500/graphiql | API explorer |
| Pulse | http://localhost:4006 | Metrics dashboard |

---

## Project Structure

```
ankr-universe/
├── apps/
│   ├── gateway/                 # Unified API Gateway
│   │   ├── src/
│   │   │   ├── schema/          # GraphQL schema
│   │   │   ├── resolvers/       # GraphQL resolvers
│   │   │   ├── services/        # Business logic
│   │   │   ├── websocket/       # WebSocket handlers
│   │   │   └── plugins/         # Fastify plugins
│   │   └── package.json
│   │
│   ├── web/                     # React frontend
│   │   ├── src/
│   │   │   ├── components/      # React components
│   │   │   ├── pages/           # Route pages
│   │   │   ├── hooks/           # Custom hooks
│   │   │   ├── stores/          # Zustand stores
│   │   │   └── lib/             # Utilities
│   │   └── package.json
│   │
│   └── mobile/                  # Expo mobile app
│
├── packages/
│   ├── conversation-engine/     # Conversational AI
│   │   ├── src/
│   │   │   ├── intent/          # Intent classification
│   │   │   ├── entity/          # Entity extraction
│   │   │   ├── context/         # Context management
│   │   │   ├── session/         # Session handling
│   │   │   ├── persona/         # Persona system
│   │   │   └── orchestrator/    # Agent orchestration
│   │   └── package.json
│   │
│   ├── showcase-core/           # Showcase logic
│   │   ├── src/
│   │   │   ├── tools/           # Tool registry
│   │   │   ├── packages/        # Package catalog
│   │   │   ├── demos/           # Demo flows
│   │   │   └── metrics/         # Analytics
│   │   └── package.json
│   │
│   └── ui/                      # Shared components
│
├── prisma/
│   └── schema.prisma            # Database schema
│
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## Development

### Commands

```bash
# Start all services in development
pnpm dev

# Start specific app
pnpm dev --filter=gateway
pnpm dev --filter=web

# Run tests
pnpm test

# Run linting
pnpm lint

# Build for production
pnpm build

# Database commands
pnpm db:migrate          # Run migrations
pnpm db:seed             # Seed data
pnpm db:studio           # Open Prisma Studio
pnpm db:reset            # Reset database
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://ankr:ankr_secret@localhost:5432/ankr_universe

# Redis
REDIS_URL=redis://localhost:6379

# AI Services
OLLAMA_URL=http://localhost:11434
AI_PROXY_URL=http://localhost:4444
EON_URL=http://localhost:4005

# API Keys
GROQ_API_KEY=your_key
ANTHROPIC_API_KEY=your_key

# Auth
JWT_SECRET=your_secret

# Ports
GATEWAY_PORT=4500
WEB_PORT=3500
```

### Adding a New Tool

1. Register in `packages/showcase-core/src/tools/registry.ts`:

```typescript
export const tools: Tool[] = [
  {
    id: 'my_new_tool',
    name: 'My New Tool',
    description: 'Description of what it does',
    category: 'compliance',
    inputSchema: {
      type: 'object',
      properties: {
        amount: { type: 'number' }
      },
      required: ['amount']
    },
    examples: [
      {
        description: 'Basic usage',
        input: { amount: 50000 },
        output: { result: 'success' }
      }
    ]
  }
];
```

2. Add intent pattern in `packages/conversation-engine/src/intent/patterns.ts`:

```typescript
export const patterns = {
  my_new_tool: {
    patterns: [
      /my\s+new\s+tool/i,
      /मेरा\s+नया\s+टूल/i
    ],
    keywords: ['new', 'tool', 'नया', 'टूल'],
    domain: 'compliance',
    priority: 80
  }
};
```

3. Create playground in `apps/web/src/components/showcase/playgrounds/`:

```tsx
export function MyNewToolPlayground() {
  // Implementation
}
```

---

## API Reference

### GraphQL Endpoint

```
POST http://localhost:4500/graphql
```

### Key Queries

```graphql
# Start a conversation
mutation StartConversation($input: StartConversationInput!) {
  startConversation(input: $input) {
    id
    persona
    language
  }
}

# Send a message
mutation SendMessage($input: SendMessageInput!) {
  sendMessage(input: $input) {
    userMessage { id content }
    assistantMessage { id content tier latencyMs }
    toolExecutions { toolId status output }
  }
}

# List tools
query Tools($category: String) {
  tools(category: $category) {
    id
    name
    description
    category
  }
}

# Execute tool directly
mutation ExecuteTool($input: ExecuteToolInput!) {
  executeTool(input: $input) {
    execution { id status output latencyMs }
  }
}
```

### WebSocket Protocol

```typescript
// Connect
ws.send({ type: 'connect', payload: { token: 'jwt...' } });

// Send message
ws.send({
  type: 'message:send',
  payload: {
    conversationId: 'conv_123',
    content: 'Calculate GST on 50000',
    contentType: 'text'
  }
});

// Listen for events
ws.on('message:received', (data) => { /* ... */ });
ws.on('tool:executing', (data) => { /* ... */ });
ws.on('tool:completed', (data) => { /* ... */ });
ws.on('memory:stored', (data) => { /* ... */ });
```

---

## Deployment

### Docker Deployment

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f gateway web
```

### Environment-Specific Configs

| Environment | Gateway | Web | Database |
|-------------|---------|-----|----------|
| Development | :4500 | :3500 | localhost:5432 |
| Staging | :4500 | :3500 | staging-db:5432 |
| Production | :4500 | :3500 | prod-db:5432 |

### Health Checks

```bash
# Gateway health
curl http://localhost:4500/health

# Database health
curl http://localhost:4500/ready

# WebSocket health
wscat -c ws://localhost:4500/ws -x '{"type":"ping"}'
```

---

## Related Documentation

| Document | Description |
|----------|-------------|
| [ANKR-UNIVERSE-VISION.md](./ANKR-UNIVERSE-VISION.md) | Product vision and strategy |
| [ANKR-UNIVERSE-ARCHITECTURE.md](./ANKR-UNIVERSE-ARCHITECTURE.md) | Technical architecture |
| [ANKR-UNIVERSE-API-SPEC.md](./ANKR-UNIVERSE-API-SPEC.md) | Complete API specification |
| [ANKR-UNIVERSE-SDK.md](./ANKR-UNIVERSE-SDK.md) | SDK documentation |
| [ANKR-UNIVERSE-ROADMAP.md](./ANKR-UNIVERSE-ROADMAP.md) | MVP roadmap |
| [ANKR-UNIVERSE-BUSINESS-MODEL.md](./ANKR-UNIVERSE-BUSINESS-MODEL.md) | Business model |
| [ANKR-UNIVERSE-TODO.md](./ANKR-UNIVERSE-TODO.md) | Task tracking |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Conventional commits
- 100% test coverage for core packages

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

## Support

- **Documentation**: [docs.ankr.universe](https://docs.ankr.universe)
- **Discord**: [ANKR Community](https://discord.gg/ankr)
- **Email**: support@ankr.ai

---

*Built with love in India for the world*
