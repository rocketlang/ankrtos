# ANKR Universe - Technical Architecture

> **World-Class System Design for India's Most Comprehensive AI Platform**

**Version:** 1.0.0
**Date:** 19 Jan 2026
**Classification:** Technical Specification

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Conversational Intelligence Engine](#conversational-intelligence-engine)
4. [SLM-First Routing Architecture](#slm-first-routing-architecture)
5. [MCP Tools Integration](#mcp-tools-integration)
6. [Memory & Learning System](#memory--learning-system)
7. [Real-time Communication](#real-time-communication)
8. [Data Architecture](#data-architecture)
9. [Security Architecture](#security-architecture)
10. [Deployment & Infrastructure](#deployment--infrastructure)
11. [Performance Engineering](#performance-engineering)
12. [Monitoring & Observability](#monitoring--observability)

---

## System Overview

### Master Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                 ANKR UNIVERSE                                        │
│                    "AI + Layman = Anyone Can Build Anything"                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ╔═════════════════════════════════════════════════════════════════════════════════╗│
│  ║                           CLIENT LAYER                                          ║│
│  ║  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ ║│
│  ║  │  Web App   │  │ Mobile App │  │   Voice    │  │    CLI     │  │ Embedded │ ║│
│  ║  │  React 19  │  │ React Native│  │ WebSocket │  │ AnkrCode   │  │   SDK    │ ║│
│  ║  │  Vite 6    │  │   Expo     │  │ 11 langs  │  │ Terminal   │  │  iframe  │ ║│
│  ║  │   :3500    │  │            │  │           │  │            │  │          │ ║│
│  ║  └────────────┘  └────────────┘  └────────────┘  └────────────┘  └──────────┘ ║│
│  ╚═════════════════════════════════════════════════════════════════════════════════╝│
│                                         │                                            │
│                         HTTPS / WSS / GraphQL / gRPC                                │
│                                         │                                            │
│  ╔═════════════════════════════════════════════════════════════════════════════════╗│
│  ║                          GATEWAY LAYER (Port 4500)                              ║│
│  ║  ┌─────────────────────────────────────────────────────────────────────────┐   ║│
│  ║  │                         FASTIFY + MERCURIUS                             │   ║│
│  ║  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │   ║│
│  ║  │  │  GraphQL │ │WebSocket │ │   REST   │ │  Health  │ │   Metrics    │  │   ║│
│  ║  │  │ /graphql │ │   /ws    │ │ /api/v1  │ │ /health  │ │  /metrics    │  │   ║│
│  ║  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │   ║│
│  ║  │  ┌───────────────────────────────────────────────────────────────────┐ │   ║│
│  ║  │  │ MIDDLEWARE: Auth │ RateLimit │ CORS │ Helmet │ Tracing │ i18n    │ │   ║│
│  ║  │  └───────────────────────────────────────────────────────────────────┘ │   ║│
│  ║  └─────────────────────────────────────────────────────────────────────────┘   ║│
│  ╚═════════════════════════════════════════════════════════════════════════════════╝│
│                                         │                                            │
│  ╔═════════════════════════════════════════════════════════════════════════════════╗│
│  ║                    CONVERSATIONAL INTELLIGENCE LAYER                            ║│
│  ║  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐  ║│
│  ║  │    Intent    │ │    Entity    │ │   Context    │ │       Persona        │  ║│
│  ║  │  Classifier  │ │  Extractor   │ │   Engine     │ │       Manager        │  ║│
│  ║  │              │ │              │ │              │ │                      │  ║│
│  ║  │ • 3-tier     │ │ • 20+ types  │ │ • 3-layer    │ │ • Swayam (Universal) │  ║│
│  ║  │ • 70+ patterns│ │ • Indian IDs│ │ • RAG        │ │ • ComplyMitra (Tax)  │  ║│
│  ║  │ • 8 domains  │ │ • Financial  │ │ • Compression│ │ • WowTruck (Logistics)│  ║│
│  ║  │ • Hindi/En   │ │ • Locations  │ │ • Snapshots  │ │ • FreightBox (Ship)  │  ║│
│  ║  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────────┘  ║│
│  ║  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐  ║│
│  ║  │   Session    │ │   Response   │ │    Agent     │ │     Multi-turn       │  ║│
│  ║  │   Manager    │ │  Generator   │ │ Orchestrator │ │      Tracker         │  ║│
│  ║  │              │ │              │ │              │ │                      │  ║│
│  ║  │ • Redis-backed│ │ • Streaming │ │ • Router     │ │ • State machine     │  ║│
│  ║  │ • 24h TTL    │ │ • Multilingual│ │ • Tool Agent│ │ • Turn counting     │  ║│
│  ║  │ • Device info│ │ • Follow-ups │ │ • Memory Agent│ │ • Context window   │  ║│
│  ║  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────────┘  ║│
│  ╚═════════════════════════════════════════════════════════════════════════════════╝│
│                                         │                                            │
│  ╔═════════════════════════════════════════════════════════════════════════════════╗│
│  ║                      SLM ROUTER (4-Tier Cascade)                                ║│
│  ║  ┌───────────────────────────────────────────────────────────────────────────┐ ║│
│  ║  │                                                                           │ ║│
│  ║  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐  │ ║│
│  ║  │  │   TIER 0    │   │   TIER 1    │   │   TIER 2    │   │   TIER 3    │  │ ║│
│  ║  │  │  EON Memory │ → │Deterministic│ → │  SLM Local  │ → │ LLM Cloud   │  │ ║│
│  ║  │  │             │   │             │   │             │   │             │  │ ║│
│  ║  │  │ • Cached    │   │ • Regex     │   │ • Ollama    │   │ • Claude    │  │ ║│
│  ║  │  │ • ~0ms      │   │ • Pattern   │   │ • Qwen 2.5  │   │ • GPT-4     │  │ ║│
│  ║  │  │ • FREE      │   │ • <10ms     │   │ • 1.5B      │   │ • Groq      │  │ ║│
│  ║  │  │ • 10% hit   │   │ • FREE      │   │ • 50-200ms  │   │ • 1-5s      │  │ ║│
│  ║  │  │             │   │ • 20% hit   │   │ • $0.0001   │   │ • $0.01+    │  │ ║│
│  ║  │  │             │   │             │   │ • 65% hit   │   │ • 5% hit    │  │ ║│
│  ║  │  └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘  │ ║│
│  ║  │                                                                           │ ║│
│  ║  │  TOTAL: 95% queries handled at <$0.0001 │ 93% cost savings vs pure LLM  │ ║│
│  ║  └───────────────────────────────────────────────────────────────────────────┘ ║│
│  ╚═════════════════════════════════════════════════════════════════════════════════╝│
│                                         │                                            │
│  ╔═════════════════════════════════════════════════════════════════════════════════╗│
│  ║                        MCP TOOLS LAYER (350+ Tools)                             ║│
│  ║  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐  ║│
│  ║  │   GST   │ │ Banking │ │Logistics│ │  Govt   │ │ ERP/CRM │ │   Voice     │  ║│
│  ║  │ 54 tools│ │ 28 tools│ │ 35 tools│ │ 22 tools│ │ 74 tools│ │  14 tools   │  ║│
│  ║  │         │ │         │ │         │ │         │ │         │ │             │  ║│
│  ║  │gst_calc │ │upi_pay  │ │track    │ │aadhaar  │ │invoice  │ │stt          │  ║│
│  ║  │einvoice │ │emi_calc │ │eway_bill│ │pan_verify│ │crm_lead│ │tts          │  ║│
│  ║  │hsn_lookup│ │loan    │ │route    │ │epf_check│ │stock   │ │translate    │  ║│
│  ║  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────────┘  ║│
│  ║                                                                                 ║│
│  ║  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐  ║│
│  ║  │ Memory  │ │   Doc   │ │ Search  │ │Analytics│ │Workflow │ │   Code      │  ║│
│  ║  │ 14 tools│ │ 18 tools│ │ 12 tools│ │ 8 tools │ │ 6 tools │ │  5 tools    │  ║│
│  ║  │         │ │         │ │         │ │         │ │         │ │             │  ║│
│  ║  │eon_store│ │ocr      │ │web_search│ │dashboard│ │trigger │ │sandbox_run │  ║│
│  ║  │eon_recall│ │pdf_gen │ │rag_query│ │metrics  │ │schedule│ │code_gen    │  ║│
│  ║  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────────┘  ║│
│  ╚═════════════════════════════════════════════════════════════════════════════════╝│
│                                         │                                            │
│  ╔═════════════════════════════════════════════════════════════════════════════════╗│
│  ║                           DATA & MEMORY LAYER                                   ║│
│  ║  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────────────────┐║│
│  ║  │   PostgreSQL     │ │      Redis       │ │          EON MEMORY              │║│
│  ║  │   + pgvector     │ │   Cache/Queue    │ │                                  │║│
│  ║  │                  │ │                  │ │  ┌──────────┐ ┌──────────────┐  │║│
│  ║  │ • Users          │ │ • Sessions       │ │  │ Episodic │ │   Semantic   │  │║│
│  ║  │ • Conversations  │ │ • Rate limits    │ │  │ "Events" │ │   "Facts"    │  │║│
│  ║  │ • Messages       │ │ • Tool queue     │ │  └──────────┘ └──────────────┘  │║│
│  ║  │ • Tool executions│ │ • Real-time      │ │        ┌──────────────┐         │║│
│  ║  │ • Memories (vec) │ │ • Pub/Sub        │ │        │  Procedural  │         │║│
│  ║  │ • Tools catalog  │ │                  │ │        │  "Patterns"  │         │║│
│  ║  │ • Packages       │ │                  │ │        └──────────────┘         │║│
│  ║  │ • Metrics        │ │                  │ │                                  │║│
│  ║  │                  │ │                  │ │  pgvector embeddings (1536)     │║│
│  ║  │     :5432        │ │     :6379        │ │           :4005                 │║│
│  ║  └──────────────────┘ └──────────────────┘ └──────────────────────────────────┘║│
│  ╚═════════════════════════════════════════════════════════════════════════════════╝│
│                                         │                                            │
│  ╔═════════════════════════════════════════════════════════════════════════════════╗│
│  ║                         OBSERVABILITY (PULSE)                                   ║│
│  ║  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────────────┐║│
│  ║  │   Metrics    │ │   Logging    │ │   Tracing    │ │    Cost Tracking       │║│
│  ║  │  Prometheus  │ │   Winston    │ │ OpenTelemetry│ │    Per-Request         │║│
│  ║  │    :9090     │ │   Loki       │ │    Jaeger    │ │    USD Breakdown       │║│
│  ║  │              │ │              │ │    :16686    │ │                        │║│
│  ║  │ • Latency    │ │ • Structured │ │ • Distributed│ │ • SLM tier costs      │║│
│  ║  │ • Throughput │ │ • Contextual │ │ • Request    │ │ • Tool execution      │║│
│  ║  │ • Errors     │ │ • Searchable │ │ • Dependency │ │ • Voice processing    │║│
│  ║  └──────────────┘ └──────────────┘ └──────────────┘ └────────────────────────┘║│
│  ╚═════════════════════════════════════════════════════════════════════════════════╝│
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Layers

### Layer 1: Client Layer

```typescript
// Technology Matrix

const CLIENT_STACK = {
  web: {
    framework: 'React 19',
    build: 'Vite 6',
    styling: 'TailwindCSS 4 + Shadcn/UI',
    state: 'Zustand 5 + Apollo Client 3.9',
    routing: 'React Router 7',
    realtime: 'WebSocket native + GraphQL Subscriptions',
    voice: 'Web Speech API + Sarvam STT/TTS',
    visualization: 'Three.js + React Three Fiber + Recharts',
    port: 3500,
  },
  mobile: {
    framework: 'React Native 0.73',
    navigation: 'React Navigation 7',
    state: 'Zustand + Apollo Client',
    voice: 'expo-speech + expo-av',
  },
  embedded: {
    sdk: '@ankr/universe-embed',
    format: 'iframe + postMessage',
    size: '< 50KB gzipped',
  },
};
```

#### Component Architecture

```
apps/web/src/
├── components/
│   ├── conversation/                 # Core chat interface
│   │   ├── ChatInterface.tsx         # Main container (450 lines)
│   │   ├── MessageBubble.tsx         # Message rendering with rich content
│   │   ├── VoiceInput.tsx            # Voice recording with waveform
│   │   ├── TextInput.tsx             # Text input with autocomplete
│   │   ├── ToolExecution.tsx         # Real-time tool progress
│   │   ├── MemoryPanel.tsx           # EON memory visualization
│   │   ├── RoutingIndicator.tsx      # SLM tier display
│   │   ├── EntityHighlight.tsx       # Extracted entity badges
│   │   └── FollowUpSuggestions.tsx   # AI-suggested next actions
│   │
│   ├── showcase/                     # Tool & package exploration
│   │   ├── ToolExplorer.tsx          # 350+ tools catalog
│   │   ├── ToolCard.tsx              # Individual tool card
│   │   ├── ToolPlayground.tsx        # Interactive tool testing
│   │   ├── ToolDocs.tsx              # Auto-generated documentation
│   │   ├── PackageCatalog.tsx        # 224 packages listing
│   │   ├── PackageCard.tsx           # Package with stats
│   │   ├── PackageDetails.tsx        # Full package view
│   │   ├── DemoGallery.tsx           # Interactive demos
│   │   └── DemoRunner.tsx            # Step-by-step demo execution
│   │
│   ├── pulse/                        # System monitoring
│   │   ├── PulseDashboard.tsx        # Main monitoring view
│   │   ├── SystemStatus.tsx          # Service health grid
│   │   ├── MetricsDisplay.tsx        # Real-time charts
│   │   ├── ActivityStream.tsx        # Live event feed
│   │   ├── CostTracker.tsx           # Cost breakdown
│   │   └── TierDistribution.tsx      # SLM usage pie chart
│   │
│   ├── memory/                       # Memory visualization
│   │   ├── MemoryGraph3D.tsx         # Three.js force graph
│   │   ├── MemoryTimeline.tsx        # Temporal view
│   │   ├── MemorySearch.tsx          # Semantic search
│   │   └── MemoryStats.tsx           # Statistics
│   │
│   └── shared/                       # Reusable components
│       ├── Layout.tsx
│       ├── Navigation.tsx
│       ├── ThemeProvider.tsx
│       ├── LanguageSelector.tsx
│       ├── PersonaSelector.tsx
│       └── LoadingStates.tsx
│
├── hooks/
│   ├── useConversation.ts            # Conversation state & actions
│   ├── useVoice.ts                   # Voice input/output
│   ├── useTools.ts                   # Tool execution
│   ├── useMemory.ts                  # EON memory operations
│   ├── useRealtime.ts                # WebSocket connection
│   └── useMetrics.ts                 # System metrics
│
├── stores/
│   ├── conversation.store.ts         # Chat state (Zustand)
│   ├── tools.store.ts                # Tool execution state
│   ├── ui.store.ts                   # UI preferences
│   └── metrics.store.ts              # Real-time metrics
│
├── lib/
│   ├── apollo.ts                     # GraphQL client config
│   ├── websocket.ts                  # WebSocket manager
│   ├── voice.ts                      # Voice processing
│   └── utils.ts                      # Utilities
│
└── pages/
    ├── Landing.tsx                   # Hero + quick demo
    ├── Chat.tsx                      # Main chat interface
    ├── Tools.tsx                     # Tool explorer
    ├── Packages.tsx                  # Package catalog
    ├── Demos.tsx                     # Demo gallery
    ├── Memory.tsx                    # Memory visualization
    └── Pulse.tsx                     # System monitoring
```

### Layer 2: Gateway Layer

#### Fastify Server Architecture

```typescript
// apps/gateway/src/main.ts

import Fastify from 'fastify';
import mercurius from 'mercurius';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import { schema, resolvers } from './schema';
import { buildContext } from './context';
import { registerWebSocketHandlers } from './websocket';

export async function createServer() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    },
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    trustProxy: true,
  });

  // ═══════════════════════════════════════════════════════════
  // SECURITY MIDDLEWARE
  // ═══════════════════════════════════════════════════════════

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'wss:', 'https://api.ankr.ai'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      },
    },
    crossOriginEmbedderPolicy: false, // For iframe embeds
  });

  await app.register(cors, {
    origin: [
      'http://localhost:3500',
      'https://universe.ankr.ai',
      'https://*.ankr.ai',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
  });

  // ═══════════════════════════════════════════════════════════
  // RATE LIMITING
  // ═══════════════════════════════════════════════════════════

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      return request.headers['x-api-key'] as string
        || request.ip;
    },
    errorResponseBuilder: (request, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Retry in ${context.ttl}ms`,
    }),
  });

  // ═══════════════════════════════════════════════════════════
  // AUTHENTICATION
  // ═══════════════════════════════════════════════════════════

  await app.register(jwt, {
    secret: process.env.JWT_SECRET!,
    sign: { expiresIn: '8h' },
    verify: { algorithms: ['HS256'] },
  });

  // Auth decorator
  app.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  // ═══════════════════════════════════════════════════════════
  // GRAPHQL (MERCURIUS)
  // ═══════════════════════════════════════════════════════════

  await app.register(mercurius, {
    schema,
    resolvers,
    subscription: {
      onConnect: async (data) => {
        // Verify token on subscription connect
        const token = data.payload?.token;
        if (token) {
          try {
            const decoded = app.jwt.verify(token);
            return { user: decoded };
          } catch {
            throw new Error('Invalid token');
          }
        }
        return {};
      },
    },
    context: buildContext,
    graphiql: process.env.NODE_ENV !== 'production',
    jit: 1, // JIT compilation for performance
    queryDepth: 10,
    errorFormatter: (error, context) => ({
      statusCode: error.statusCode || 500,
      response: {
        data: null,
        errors: [{
          message: error.message,
          extensions: {
            code: error.code || 'INTERNAL_ERROR',
            requestId: context.reply.request.id,
          },
        }],
      },
    }),
  });

  // ═══════════════════════════════════════════════════════════
  // WEBSOCKET
  // ═══════════════════════════════════════════════════════════

  await app.register(websocket, {
    options: {
      maxPayload: 1048576, // 1MB
      clientTracking: true,
    },
  });

  await registerWebSocketHandlers(app);

  // ═══════════════════════════════════════════════════════════
  // HEALTH CHECKS
  // ═══════════════════════════════════════════════════════════

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
  }));

  app.get('/ready', async () => {
    const checks = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkOllama(),
    ]);

    const allHealthy = checks.every(c => c.healthy);
    return {
      status: allHealthy ? 'ready' : 'degraded',
      checks,
    };
  });

  // ═══════════════════════════════════════════════════════════
  // METRICS ENDPOINT
  // ═══════════════════════════════════════════════════════════

  app.get('/metrics', async () => {
    return generatePrometheusMetrics();
  });

  return app;
}

// Start server
const server = await createServer();
await server.listen({ port: 4500, host: '0.0.0.0' });
```

#### GraphQL Schema Design

```graphql
# apps/gateway/src/schema/schema.graphql

# ═══════════════════════════════════════════════════════════════════
# QUERY TYPE
# ═══════════════════════════════════════════════════════════════════

type Query {
  # ─────────────────────────────────────────────────────────────────
  # Conversations
  # ─────────────────────────────────────────────────────────────────
  conversation(id: ID!): Conversation
  conversations(
    first: Int = 10
    after: String
    status: ConversationStatus
  ): ConversationConnection!

  # ─────────────────────────────────────────────────────────────────
  # Tools (350+)
  # ─────────────────────────────────────────────────────────────────
  tools(
    category: String
    search: String
    featured: Boolean
    limit: Int = 50
  ): [Tool!]!

  tool(id: ID!): Tool

  toolCategories: [ToolCategory!]!

  # ─────────────────────────────────────────────────────────────────
  # Packages (224)
  # ─────────────────────────────────────────────────────────────────
  packages(
    category: String
    search: String
    limit: Int = 50
  ): [Package!]!

  package(id: ID!): Package

  packageCategories: [PackageCategory!]!

  # ─────────────────────────────────────────────────────────────────
  # Demos
  # ─────────────────────────────────────────────────────────────────
  demos(category: DemoCategory): [Demo!]!
  demo(slug: String!): Demo

  # ─────────────────────────────────────────────────────────────────
  # Memory (EON)
  # ─────────────────────────────────────────────────────────────────
  memories(
    type: MemoryType
    search: String
    limit: Int = 20
  ): [Memory!]!

  memoryStats: MemoryStats!

  # ─────────────────────────────────────────────────────────────────
  # System Status (Pulse)
  # ─────────────────────────────────────────────────────────────────
  systemStatus: SystemStatus!
  dailyStats(days: Int = 7): [DailyStats!]!
  tierDistribution: TierDistribution!

  # ─────────────────────────────────────────────────────────────────
  # User
  # ─────────────────────────────────────────────────────────────────
  me: User
}

# ═══════════════════════════════════════════════════════════════════
# MUTATION TYPE
# ═══════════════════════════════════════════════════════════════════

type Mutation {
  # ─────────────────────────────────────────────────────────────────
  # Conversation
  # ─────────────────────────────────────────────────────────────────
  startConversation(input: StartConversationInput!): Conversation!
  sendMessage(input: SendMessageInput!): SendMessageResult!
  endConversation(id: ID!): Conversation!

  # ─────────────────────────────────────────────────────────────────
  # Tools
  # ─────────────────────────────────────────────────────────────────
  executeTool(input: ExecuteToolInput!): ToolExecutionResult!

  # ─────────────────────────────────────────────────────────────────
  # Demos
  # ─────────────────────────────────────────────────────────────────
  runDemo(slug: String!): DemoRunResult!

  # ─────────────────────────────────────────────────────────────────
  # Memory
  # ─────────────────────────────────────────────────────────────────
  addMemory(input: AddMemoryInput!): Memory!
  deleteMemory(id: ID!): Boolean!

  # ─────────────────────────────────────────────────────────────────
  # User
  # ─────────────────────────────────────────────────────────────────
  updatePreferences(input: UpdatePreferencesInput!): User!
}

# ═══════════════════════════════════════════════════════════════════
# SUBSCRIPTION TYPE
# ═══════════════════════════════════════════════════════════════════

type Subscription {
  # Conversation events
  messageAdded(conversationId: ID!): Message!
  toolExecutionUpdated(conversationId: ID!): ToolExecution!
  routingDecision(conversationId: ID!): RoutingDecision!

  # Memory events
  memoryStored(userId: ID!): Memory!
  memoryRecalled(userId: ID!): MemoryRecallEvent!

  # System events
  systemMetrics: SystemMetricUpdate!
  activityStream: ActivityEvent!
}

# ═══════════════════════════════════════════════════════════════════
# CORE TYPES
# ═══════════════════════════════════════════════════════════════════

type Conversation {
  id: ID!
  title: String
  persona: Persona!
  language: Language!
  status: ConversationStatus!
  turnCount: Int!

  # Metrics
  totalLatencyMs: Int!
  totalCostUsd: Float!

  # Relations
  messages(first: Int, after: String): MessageConnection!
  toolExecutions: [ToolExecution!]!

  # Timestamps
  startedAt: DateTime!
  endedAt: DateTime
  createdAt: DateTime!
}

type Message {
  id: ID!
  role: MessageRole!
  content: String!
  contentType: ContentType!

  # Voice
  audioUrl: String
  transcription: String

  # NLU Results
  intent: IntentResult
  entities: [Entity!]

  # Routing Info
  tier: RoutingTier
  model: String
  latencyMs: Int
  costUsd: Float

  # Tools
  toolsUsed: [String!]

  createdAt: DateTime!
}

type IntentResult {
  primary: String!
  domain: IntentDomain!
  confidence: Float!
  alternatives: [IntentAlternative!]
}

type Entity {
  type: EntityType!
  value: String!
  normalized: String
  confidence: Float!
  startIndex: Int
  endIndex: Int
}

type ToolExecution {
  id: ID!
  toolId: String!
  toolName: String!
  category: String!

  input: JSON!
  output: JSON
  status: ExecutionStatus!
  error: String

  tier: RoutingTier!
  routingReason: String

  startedAt: DateTime!
  completedAt: DateTime
  latencyMs: Int
  costUsd: Float
}

type Tool {
  id: ID!
  name: String!
  description: String!
  category: ToolCategory!
  subcategory: String

  # Schema
  inputSchema: JSON!
  outputSchema: JSON

  # Examples
  examples: [ToolExample!]!

  # Metadata
  languages: [Language!]!
  isPublic: Boolean!
  isFeatured: Boolean!

  # Stats
  usageCount: Int!
  avgLatencyMs: Int!
  successRate: Float!
}

type Package {
  id: ID!
  name: String!
  version: String!
  description: String!
  category: PackageCategory!

  # Documentation
  readme: String
  changelog: String
  apiDocs: JSON

  # Stats
  downloads: Int!
  stars: Int!

  # Links
  repository: String
  homepage: String
  keywords: [String!]!

  # Dependencies
  dependencies: [String!]
  peerDependencies: [String!]
}

type Memory {
  id: ID!
  type: MemoryType!
  scope: MemoryScope!
  content: String!

  source: String
  sourceId: String
  confidence: Float!

  accessCount: Int!
  lastAccessedAt: DateTime
  expiresAt: DateTime

  createdAt: DateTime!
}

type SystemStatus {
  overall: ServiceStatus!
  services: [ServiceInfo!]!
  metrics: LiveMetrics!
}

type LiveMetrics {
  totalQueriesToday: Int!
  avgLatencyMs: Int!
  slmPercentage: Float!
  costSavingsPercent: Float!
  activeUsers: Int!
  activeConversations: Int!
}

# ═══════════════════════════════════════════════════════════════════
# ENUMS
# ═══════════════════════════════════════════════════════════════════

enum Persona {
  SWAYAM          # Universal AI Assistant
  COMPLYMITRA     # Compliance Expert (GST, TDS, ITR)
  WOWTRUCK        # Logistics Assistant
  FREIGHTBOX      # Shipping AI
  CUSTOM          # User-defined persona
}

enum Language {
  EN  # English
  HI  # Hindi
  TA  # Tamil
  TE  # Telugu
  BN  # Bengali
  MR  # Marathi
  GU  # Gujarati
  KN  # Kannada
  ML  # Malayalam
  PA  # Punjabi
  OR  # Odia
}

enum RoutingTier {
  EON             # Tier 0: Memory cache
  DETERMINISTIC   # Tier 1: Pattern/Regex
  SLM             # Tier 2: Local Ollama
  LLM             # Tier 3: Cloud LLM
}

enum IntentDomain {
  COMPLIANCE      # GST, TDS, ITR, E-Way Bill
  BANKING         # UPI, Loans, EMI, Insurance
  LOGISTICS       # Tracking, Routes, Fleet
  GOVERNMENT      # Aadhaar, PAN, EPF, DigiLocker
  ERP             # Invoicing, Inventory, Accounting
  CRM             # Leads, Contacts, Opportunities
  GENERAL         # Weather, Search, Calculator
  META            # Help, Greetings
}

enum MemoryType {
  EPISODIC        # Events, experiences
  SEMANTIC        # Facts, knowledge
  PROCEDURAL      # Patterns, skills
}

enum ExecutionStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}

# ═══════════════════════════════════════════════════════════════════
# INPUT TYPES
# ═══════════════════════════════════════════════════════════════════

input StartConversationInput {
  persona: Persona
  language: Language
  initialMessage: String
  context: JSON
}

input SendMessageInput {
  conversationId: ID!
  content: String!
  contentType: ContentType = TEXT
  audioData: String  # Base64 for voice
}

input ExecuteToolInput {
  toolId: String!
  parameters: JSON!
  conversationId: ID  # Optional, for tracking
}

input AddMemoryInput {
  type: MemoryType!
  content: String!
  scope: MemoryScope = USER
  expiresAt: DateTime
}

# ═══════════════════════════════════════════════════════════════════
# RESULT TYPES
# ═══════════════════════════════════════════════════════════════════

type SendMessageResult {
  userMessage: Message!
  assistantMessage: Message!
  toolExecutions: [ToolExecution!]!
  routing: RoutingDecision!
  memoriesStored: [Memory!]
}

type RoutingDecision {
  tier: RoutingTier!
  reason: String!
  confidence: Float!
  latencyMs: Int!
  costUsd: Float!
  alternatives: [TierAlternative!]
}

type ToolExecutionResult {
  execution: ToolExecution!
  output: JSON
}

type DemoRunResult {
  demo: Demo!
  results: [DemoStepResult!]!
  totalLatencyMs: Int!
  totalCostUsd: Float!
  success: Boolean!
}
```

---

## Conversational Intelligence Engine

### Intent Classification System

```typescript
// packages/conversation-engine/src/intent/classifier.ts

export class IntentClassifier {
  private patterns: IntentPatternRegistry;
  private keywords: KeywordRegistry;
  private aiClassifier: AIClassifier;
  private cache: LRUCache<string, IntentResult>;

  constructor(config: ClassifierConfig) {
    this.patterns = new IntentPatternRegistry(INTENT_PATTERNS);
    this.keywords = new KeywordRegistry(INTENT_KEYWORDS);
    this.aiClassifier = new AIClassifier(config.aiProxy);
    this.cache = new LRUCache({ max: 1000, ttl: 1000 * 60 * 5 }); // 5 min
  }

  /**
   * 3-Tier Intent Classification
   *
   * Tier 1: Pattern Matching (70+ regex patterns)
   *         - Exact matches: 100% confidence
   *         - Priority-based ordering
   *
   * Tier 2: Keyword Matching
   *         - Domain-specific keywords
   *         - Confidence based on overlap score
   *
   * Tier 3: AI Classification (Groq/Claude)
   *         - Context-aware
   *         - Multi-intent detection
   */
  async classify(
    text: string,
    language: Language,
    history: Message[] = []
  ): Promise<IntentResult> {
    const normalizedText = this.normalize(text, language);

    // Check cache
    const cacheKey = `${normalizedText}:${language}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    // Tier 1: Pattern Matching
    const patternMatch = this.patterns.match(normalizedText, language);
    if (patternMatch && patternMatch.confidence >= 0.9) {
      this.cache.set(cacheKey, patternMatch);
      return patternMatch;
    }

    // Tier 2: Keyword Matching
    const keywordMatch = this.keywords.match(normalizedText, language);
    if (keywordMatch && keywordMatch.confidence >= 0.7) {
      this.cache.set(cacheKey, keywordMatch);
      return keywordMatch;
    }

    // Tier 3: AI Classification
    const aiResult = await this.aiClassifier.classify(
      normalizedText,
      language,
      history,
      patternMatch, // Pass partial match as hint
      keywordMatch
    );

    this.cache.set(cacheKey, aiResult);
    return aiResult;
  }

  private normalize(text: string, language: Language): string {
    // Handle code-switching (Hindi-English mix)
    let normalized = text.toLowerCase().trim();

    // Normalize Hindi numerals to Arabic
    normalized = normalized.replace(/[०-९]/g, (d) =>
      String.fromCharCode(d.charCodeAt(0) - 0x0966 + 48)
    );

    // Normalize currency symbols
    normalized = normalized.replace(/₹|rs\.?|inr/gi, 'rupees ');

    // Remove extra whitespace
    normalized = normalized.replace(/\s+/g, ' ');

    return normalized;
  }
}

// Intent Patterns (70+ across 8 domains)
export const INTENT_PATTERNS: Record<string, IntentPattern> = {
  // ═══════════════════════════════════════════════════════════════
  // COMPLIANCE DOMAIN (8 intents)
  // ═══════════════════════════════════════════════════════════════

  gst_calculate: {
    patterns: [
      /(?:calculate|compute|find|what is|kitna)\s+(?:the\s+)?gst/i,
      /gst\s+(?:on|for|of)\s+/i,
      /(?:कैलकुलेट|गणना|बताओ)\s+(?:करो|करें)?\s*gst/i,
      /gst\s+(?:कितना|kitna)/i,
    ],
    keywords: ['gst', 'tax', 'calculate', 'जीएसटी', 'टैक्स', 'कैलकुलेट'],
    domain: 'compliance',
    priority: 90,
    examples: [
      'Calculate GST on 50000',
      'GST kitna hoga 1 lakh pe',
      '₹50,000 पर GST बताओ',
    ],
  },

  einvoice_generate: {
    patterns: [
      /(?:generate|create|make|बनाओ)\s+(?:an?\s+)?(?:e-?invoice|इनवॉइस)/i,
      /e-?invoice\s+(?:generate|create|बनाओ)/i,
    ],
    keywords: ['einvoice', 'e-invoice', 'irn', 'इनवॉइस'],
    domain: 'compliance',
    priority: 85,
  },

  eway_bill: {
    patterns: [
      /(?:generate|create|check)\s+(?:e-?way\s*bill|ईवे\s*बिल)/i,
      /e-?way\s*bill\s+(?:for|बनाओ)/i,
    ],
    keywords: ['eway', 'e-way', 'ewb', 'ईवे', 'बिल'],
    domain: 'compliance',
    priority: 85,
  },

  hsn_lookup: {
    patterns: [
      /(?:find|search|what is|lookup)\s+hsn/i,
      /hsn\s+(?:code|for|of)/i,
      /hsn\s+(?:बताओ|खोजो)/i,
    ],
    keywords: ['hsn', 'code', 'lookup', 'एचएसएन'],
    domain: 'compliance',
    priority: 80,
  },

  tds_calculate: {
    patterns: [
      /(?:calculate|compute)\s+tds/i,
      /tds\s+(?:on|for|rate)/i,
      /tds\s+(?:कितना|कैलकुलेट)/i,
    ],
    keywords: ['tds', 'tax deducted', 'टीडीएस'],
    domain: 'compliance',
    priority: 85,
  },

  // ═══════════════════════════════════════════════════════════════
  // BANKING DOMAIN (21 intents)
  // ═══════════════════════════════════════════════════════════════

  credit_eligibility: {
    patterns: [
      /(?:check|am i|kya main)\s+(?:eligible|qualify)/i,
      /loan\s+eligibility/i,
      /(?:क्या|kya)\s+(?:मुझे|mujhe)\s+loan\s+(?:मिल|mil)/i,
      /credit\s+(?:score|limit|check)/i,
    ],
    keywords: ['loan', 'credit', 'eligible', 'eligibility', 'लोन', 'क्रेडिट'],
    domain: 'banking',
    priority: 85,
  },

  upi_payment: {
    patterns: [
      /(?:pay|send|transfer)\s+(?:via\s+)?upi/i,
      /upi\s+(?:payment|transfer|भेजो)/i,
      /(?:पेमेंट|payment)\s+(?:करो|karo)/i,
    ],
    keywords: ['upi', 'pay', 'payment', 'transfer', 'पेमेंट', 'भेजो'],
    domain: 'banking',
    priority: 80,
  },

  emi_calculate: {
    patterns: [
      /(?:calculate|what is|kitni)\s+emi/i,
      /emi\s+(?:for|on|calculator)/i,
      /emi\s+(?:कितनी|बताओ)/i,
    ],
    keywords: ['emi', 'installment', 'monthly', 'ईएमआई'],
    domain: 'banking',
    priority: 80,
  },

  // ═══════════════════════════════════════════════════════════════
  // LOGISTICS DOMAIN (4 intents)
  // ═══════════════════════════════════════════════════════════════

  track_vehicle: {
    patterns: [
      /(?:track|locate|find|where is)\s+(?:truck|vehicle|गाड़ी)/i,
      /(?:truck|vehicle)\s+(?:location|status|कहां)/i,
      /(?:ट्रक|गाड़ी)\s+(?:कहां|ट्रैक)/i,
      /[A-Z]{2}[-\s]?\d{1,2}[-\s]?[A-Z]{1,3}[-\s]?\d{4}/i, // Vehicle number
    ],
    keywords: ['track', 'locate', 'vehicle', 'truck', 'ट्रैक', 'लोकेशन', 'गाड़ी'],
    domain: 'logistics',
    priority: 85,
  },

  route_calculate: {
    patterns: [
      /(?:calculate|find|show)\s+route/i,
      /(?:distance|time)\s+(?:from|to|between)/i,
      /(?:रूट|दूरी)\s+(?:बताओ|निकालो)/i,
    ],
    keywords: ['route', 'distance', 'navigation', 'रूट', 'दूरी'],
    domain: 'logistics',
    priority: 80,
  },

  // ═══════════════════════════════════════════════════════════════
  // GOVERNMENT DOMAIN (4 intents)
  // ═══════════════════════════════════════════════════════════════

  aadhaar_verify: {
    patterns: [
      /(?:verify|validate|check)\s+aadhaar/i,
      /aadhaar\s+(?:verification|valid)/i,
      /आधार\s+(?:वेरिफाई|चेक)/i,
    ],
    keywords: ['aadhaar', 'aadhar', 'uid', 'आधार'],
    domain: 'government',
    priority: 85,
  },

  pan_verify: {
    patterns: [
      /(?:verify|validate|check)\s+pan/i,
      /pan\s+(?:card|verification|number)/i,
      /पैन\s+(?:वेरिफाई|चेक)/i,
    ],
    keywords: ['pan', 'pancard', 'पैन'],
    domain: 'government',
    priority: 85,
  },

  // ... 60+ more patterns across all domains
};
```

### Entity Extraction System

```typescript
// packages/conversation-engine/src/entity/extractor.ts

export class EntityExtractor {
  private extractors: Map<EntityType, EntityPattern>;
  private validators: Map<EntityType, Validator>;

  constructor() {
    this.extractors = new Map(Object.entries(ENTITY_PATTERNS));
    this.validators = new Map(Object.entries(ENTITY_VALIDATORS));
  }

  async extract(text: string, domain?: IntentDomain): Promise<Entity[]> {
    const entities: Entity[] = [];

    // Run all extractors
    for (const [type, pattern] of this.extractors) {
      const matches = this.extractType(text, type, pattern);
      entities.push(...matches);
    }

    // Validate and normalize
    const validated = entities.map(entity => {
      const validator = this.validators.get(entity.type);
      const isValid = validator ? validator(entity.value) : true;

      return {
        ...entity,
        normalized: this.normalize(entity),
        confidence: isValid ? entity.confidence : entity.confidence * 0.5,
        valid: isValid,
      };
    });

    // Remove duplicates and low-confidence
    return this.deduplicate(validated.filter(e => e.confidence >= 0.5));
  }

  private extractType(
    text: string,
    type: EntityType,
    pattern: EntityPattern
  ): Entity[] {
    const entities: Entity[] = [];
    let match: RegExpExecArray | null;

    while ((match = pattern.regex.exec(text)) !== null) {
      entities.push({
        type,
        value: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        confidence: 1.0,
      });
    }

    return entities;
  }

  private normalize(entity: Entity): string {
    const normalizer = ENTITY_NORMALIZERS[entity.type];
    return normalizer ? normalizer(entity.value) : entity.value;
  }
}

// Entity Patterns (20+ types)
export const ENTITY_PATTERNS: Record<EntityType, EntityPattern> = {
  // ═══════════════════════════════════════════════════════════════
  // INDIAN IDENTIFIERS
  // ═══════════════════════════════════════════════════════════════

  gstin: {
    regex: /\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}\b/gi,
    description: 'GST Identification Number',
    examples: ['27AAPFU0939F1ZV', '07AAACN2082J1ZK'],
  },

  pan: {
    regex: /\b[A-Z]{3}[ABCFGHLJPTK][A-Z]\d{4}[A-Z]\b/gi,
    description: 'Permanent Account Number',
    examples: ['BNZPM2501F', 'ALWPG5809L'],
  },

  aadhaar: {
    regex: /\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b/g,
    description: 'Aadhaar Number',
    examples: ['2345 6789 0123', '234567890123'],
  },

  cin: {
    regex: /\b[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}\b/gi,
    description: 'Company Identification Number',
    examples: ['U74999MH2018PTC123456'],
  },

  tan: {
    regex: /\b[A-Z]{4}\d{5}[A-Z]\b/gi,
    description: 'Tax Deduction Account Number',
    examples: ['DELM12345F'],
  },

  // ═══════════════════════════════════════════════════════════════
  // FINANCIAL
  // ═══════════════════════════════════════════════════════════════

  amount: {
    regex: /(?:₹|rs\.?|inr\.?)\s*(\d+(?:,\d{2,3})*(?:\.\d{1,2})?)|(\d+(?:,\d{2,3})*(?:\.\d{1,2})?)\s*(?:rupees?|रुपये|lakh|लाख|crore|करोड़|thousand|हजार)/gi,
    description: 'Indian currency amount',
    examples: ['₹50,000', 'Rs. 1,00,000', '5 lakh rupees', '50 हजार'],
  },

  percentage: {
    regex: /\b(\d+(?:\.\d+)?)\s*(?:%|percent|प्रतिशत)\b/gi,
    description: 'Percentage value',
    examples: ['18%', '5.5 percent', '12 प्रतिशत'],
  },

  // ═══════════════════════════════════════════════════════════════
  // VEHICLE & LOGISTICS
  // ═══════════════════════════════════════════════════════════════

  vehicle_number: {
    regex: /\b[A-Z]{2}[-\s]?\d{1,2}[-\s]?[A-Z]{1,3}[-\s]?\d{4}\b/gi,
    description: 'Indian vehicle registration number',
    examples: ['MH-12-AB-1234', 'DL 01 CA 1234', 'KA01AB1234'],
  },

  container: {
    regex: /\b[A-Z]{4}\d{7}\b/gi,
    description: 'Shipping container number',
    examples: ['MSCU1234567', 'TRIU7654321'],
  },

  eway_bill: {
    regex: /\b\d{12}\b/g,
    description: 'E-Way Bill number',
    examples: ['123456789012'],
  },

  // ═══════════════════════════════════════════════════════════════
  // LOCATION
  // ═══════════════════════════════════════════════════════════════

  pincode: {
    regex: /\b[1-9]\d{5}\b/g,
    description: 'Indian postal code',
    examples: ['400001', '110001', '560001'],
  },

  indian_city: {
    regex: new RegExp(INDIAN_CITIES.join('|'), 'gi'),
    description: 'Indian city name',
    examples: ['Mumbai', 'Delhi', 'Bangalore', 'मुंबई'],
  },

  indian_state: {
    regex: new RegExp(INDIAN_STATES.join('|'), 'gi'),
    description: 'Indian state name',
    examples: ['Maharashtra', 'Karnataka', 'महाराष्ट्र'],
  },

  // ═══════════════════════════════════════════════════════════════
  // CONTACT
  // ═══════════════════════════════════════════════════════════════

  phone: {
    regex: /\b(?:\+91[-\s]?)?[6-9]\d{9}\b/g,
    description: 'Indian phone number',
    examples: ['+91 9876543210', '9876543210', '+91-98765-43210'],
  },

  email: {
    regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    description: 'Email address',
    examples: ['user@example.com'],
  },

  // ═══════════════════════════════════════════════════════════════
  // TEMPORAL
  // ═══════════════════════════════════════════════════════════════

  date: {
    regex: /\b(?:\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/gi,
    description: 'Date in various formats',
    examples: ['15/01/2026', '2026-01-15', 'January 15, 2026'],
  },

  relative_date: {
    regex: /\b(?:today|tomorrow|yesterday|next\s+(?:week|month|year)|last\s+(?:week|month|year)|आज|कल|परसों)\b/gi,
    description: 'Relative date reference',
    examples: ['today', 'tomorrow', 'next week', 'आज', 'कल'],
  },

  // ... more entity types
};

// Entity Normalizers
export const ENTITY_NORMALIZERS: Record<EntityType, (value: string) => string> = {
  amount: (value) => {
    // Parse Indian amount formats
    let normalized = value.toLowerCase()
      .replace(/[₹,\s]/g, '')
      .replace(/rs\.?|inr\.?|rupees?|रुपये/gi, '');

    // Handle lakh/crore
    if (/lakh|लाख/i.test(value)) {
      const num = parseFloat(normalized.replace(/lakh|लाख/gi, ''));
      return String(num * 100000);
    }
    if (/crore|करोड़/i.test(value)) {
      const num = parseFloat(normalized.replace(/crore|करोड़/gi, ''));
      return String(num * 10000000);
    }
    if (/thousand|हजार/i.test(value)) {
      const num = parseFloat(normalized.replace(/thousand|हजार/gi, ''));
      return String(num * 1000);
    }

    return normalized;
  },

  vehicle_number: (value) => {
    return value.toUpperCase().replace(/[-\s]/g, '-');
  },

  phone: (value) => {
    return value.replace(/[-\s+]/g, '');
  },

  gstin: (value) => value.toUpperCase(),
  pan: (value) => value.toUpperCase(),
  aadhaar: (value) => value.replace(/\s/g, ''),
};

// Entity Validators
export const ENTITY_VALIDATORS: Record<EntityType, (value: string) => boolean> = {
  gstin: (value) => {
    // GSTIN checksum validation
    const gstin = value.toUpperCase();
    if (!/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/.test(gstin)) {
      return false;
    }
    // State code validation (01-37)
    const stateCode = parseInt(gstin.substring(0, 2));
    return stateCode >= 1 && stateCode <= 37;
  },

  pan: (value) => {
    // PAN format validation
    return /^[A-Z]{3}[ABCFGHLJPTK][A-Z]\d{4}[A-Z]$/.test(value.toUpperCase());
  },

  aadhaar: (value) => {
    // Verhoeff algorithm for Aadhaar
    const digits = value.replace(/\s/g, '');
    if (!/^\d{12}$/.test(digits)) return false;
    // First digit cannot be 0 or 1
    return digits[0] !== '0' && digits[0] !== '1';
  },

  pincode: (value) => {
    // First digit: 1-9, valid Indian pincodes
    const pin = parseInt(value);
    return pin >= 110001 && pin <= 855117;
  },

  phone: (value) => {
    const phone = value.replace(/[-\s+]/g, '');
    // Indian mobile: starts with 6-9, 10 digits
    return /^(?:91)?[6-9]\d{9}$/.test(phone);
  },
};
```

---

## SLM-First Routing Architecture

### 4-Tier Cascade Router

```typescript
// packages/slm-router/src/router.ts

export class SLMRouter {
  private eon: EONMemoryClient;
  private deterministic: DeterministicHandler;
  private ollama: OllamaClient;
  private aiProxy: AIProxyClient;
  private metrics: MetricsCollector;

  constructor(config: SLMRouterConfig) {
    this.eon = new EONMemoryClient(config.eonUrl);
    this.deterministic = new DeterministicHandler(DETERMINISTIC_PATTERNS);
    this.ollama = new OllamaClient({
      host: config.ollamaUrl,
      model: 'qwen2.5:1.5b',
    });
    this.aiProxy = new AIProxyClient(config.aiProxyUrl);
    this.metrics = new MetricsCollector();
  }

  /**
   * Route query through 4-tier cascade:
   *
   * Tier 0: EON Memory (cached results)
   *         - ~0ms latency
   *         - FREE
   *         - 10% hit rate
   *
   * Tier 1: Deterministic (regex/pattern)
   *         - <10ms latency
   *         - FREE
   *         - 20% hit rate
   *
   * Tier 2: SLM (Local Ollama)
   *         - 50-200ms latency
   *         - $0.0001/query
   *         - 65% hit rate
   *
   * Tier 3: LLM (Cloud - Claude/GPT)
   *         - 1-5s latency
   *         - $0.01-0.05/query
   *         - 5% fallback
   */
  async route(params: RouteParams): Promise<RouteResult> {
    const startTime = Date.now();
    const { query, intent, entities, context, language, userId } = params;

    // ═══════════════════════════════════════════════════════════════
    // TIER 0: EON MEMORY CACHE
    // ═══════════════════════════════════════════════════════════════
    const eonResult = await this.tryEONCache(query, intent, userId);
    if (eonResult) {
      this.metrics.record('tier', 'eon');
      return this.buildResult('eon', eonResult, startTime, 0);
    }

    // ═══════════════════════════════════════════════════════════════
    // TIER 1: DETERMINISTIC HANDLING
    // ═══════════════════════════════════════════════════════════════
    const deterministicResult = this.deterministic.handle(query, intent, entities);
    if (deterministicResult) {
      this.metrics.record('tier', 'deterministic');
      return this.buildResult('deterministic', deterministicResult, startTime, 0);
    }

    // ═══════════════════════════════════════════════════════════════
    // TIER 2: SLM (LOCAL OLLAMA)
    // ═══════════════════════════════════════════════════════════════
    const slmResult = await this.tryLocalSLM(query, intent, context, language);
    if (slmResult && slmResult.confidence >= 0.7) {
      this.metrics.record('tier', 'slm');

      // Cache successful SLM response in EON
      await this.cacheInEON(query, intent, slmResult, userId);

      return this.buildResult('slm', slmResult, startTime, 0.0001);
    }

    // ═══════════════════════════════════════════════════════════════
    // TIER 3: LLM FALLBACK (CLOUD)
    // ═══════════════════════════════════════════════════════════════
    const llmResult = await this.llmFallback(query, intent, context, language);
    this.metrics.record('tier', 'llm');

    // Cache LLM response for future
    await this.cacheInEON(query, intent, llmResult, userId);

    return this.buildResult('llm', llmResult, startTime, llmResult.costUsd);
  }

  private async tryEONCache(
    query: string,
    intent: IntentResult,
    userId: string
  ): Promise<CacheResult | null> {
    try {
      // Semantic search in EON memory
      const memories = await this.eon.search({
        query,
        userId,
        type: 'procedural', // Look for patterns
        limit: 3,
        minScore: 0.92, // High threshold for cache hit
      });

      if (memories.length > 0 && memories[0].score >= 0.92) {
        const cached = memories[0];
        return {
          response: cached.metadata.response,
          tools: cached.metadata.tools,
          source: 'eon_cache',
          memoryId: cached.id,
        };
      }

      return null;
    } catch (error) {
      // EON failure should not block the pipeline
      console.warn('EON cache lookup failed:', error);
      return null;
    }
  }

  private async tryLocalSLM(
    query: string,
    intent: IntentResult,
    context: AssembledContext,
    language: Language
  ): Promise<SLMResult | null> {
    try {
      const prompt = this.buildSLMPrompt(query, intent, context, language);

      const response = await this.ollama.generate({
        model: 'qwen2.5:1.5b',
        prompt,
        options: {
          temperature: 0.3, // Low for consistency
          top_p: 0.9,
          num_predict: 512,
          stop: ['</response>', '\n\nUser:', '\n\nHuman:'],
        },
      });

      // Parse structured response
      const parsed = this.parseSLMResponse(response.response);

      return {
        response: parsed.text,
        tools: parsed.tools || [],
        confidence: parsed.confidence || 0.8,
        latencyMs: Math.round(response.total_duration / 1_000_000),
        model: 'qwen2.5:1.5b',
      };
    } catch (error) {
      console.warn('Local SLM failed:', error);
      return null;
    }
  }

  private buildSLMPrompt(
    query: string,
    intent: IntentResult,
    context: AssembledContext,
    language: Language
  ): string {
    const persona = context.identity?.defaultPersona || 'swayam';
    const langInstruction = language === 'hi'
      ? 'Respond in Hindi. Use simple language.'
      : 'Respond in English.';

    return `<system>
You are ${PERSONA_PROMPTS[persona]}.
${langInstruction}

User Context:
- Name: ${context.identity?.name || 'User'}
- Language: ${language}
- Recent topics: ${context.transient?.topics?.join(', ') || 'None'}

Intent: ${intent.primary} (${intent.domain})
Entities: ${JSON.stringify(context.transient?.entities || [])}

Available Tools: ${this.getAvailableTools(intent.domain).join(', ')}
</system>

<user>
${query}
</user>

<response>
Respond with JSON:
{
  "text": "your response",
  "tools": ["tool_id_if_needed"],
  "confidence": 0.0-1.0
}
</response>`;
  }

  private async llmFallback(
    query: string,
    intent: IntentResult,
    context: AssembledContext,
    language: Language
  ): Promise<LLMResult> {
    const messages = this.buildLLMMessages(query, intent, context, language);

    const response = await this.aiProxy.chat({
      model: 'claude-3-sonnet', // or 'gpt-4' based on routing rules
      messages,
      temperature: 0.3,
      max_tokens: 1024,
    });

    return {
      response: response.content,
      tools: this.extractTools(response.content),
      model: response.model,
      latencyMs: response.latencyMs,
      costUsd: response.costUsd,
    };
  }

  private buildResult(
    tier: RoutingTier,
    result: any,
    startTime: number,
    costUsd: number
  ): RouteResult {
    return {
      tier,
      response: result.response,
      toolsToExecute: result.tools || [],
      latencyMs: Date.now() - startTime,
      costUsd,
      model: result.model,
      source: result.source || tier,
      confidence: result.confidence || 1.0,
    };
  }

  private async cacheInEON(
    query: string,
    intent: IntentResult,
    result: any,
    userId: string
  ): Promise<void> {
    try {
      await this.eon.store({
        userId,
        type: 'procedural',
        content: `Query: ${query}\nIntent: ${intent.primary}`,
        metadata: {
          response: result.response,
          tools: result.tools,
          intent: intent.primary,
          domain: intent.domain,
        },
        ttl: 7 * 24 * 60 * 60, // 7 days
      });
    } catch (error) {
      console.warn('Failed to cache in EON:', error);
    }
  }
}

// Deterministic patterns for Tier 1
const DETERMINISTIC_PATTERNS = {
  // Simple calculations
  gst_calculate_simple: {
    pattern: /gst\s+(?:on|for)\s+(?:₹|rs\.?)?(\d+(?:,\d+)*)/i,
    handler: (match: RegExpMatchArray) => {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      const gst = amount * 0.18;
      return {
        response: `GST (18%) on ₹${amount.toLocaleString('en-IN')}: ₹${gst.toLocaleString('en-IN')}\nTotal: ₹${(amount + gst).toLocaleString('en-IN')}`,
        tools: [],
      };
    },
  },

  // Greetings
  greeting: {
    pattern: /^(?:hi|hello|hey|namaste|नमस्ते|हाय)\s*[!.]*$/i,
    handler: () => ({
      response: 'नमस्ते! मैं आपकी कैसे मदद कर सकता हूं? (Hello! How can I help you?)',
      tools: [],
    }),
  },

  // Help
  help: {
    pattern: /^(?:help|मदद|sahayata|सहायता)\s*[!?]*$/i,
    handler: () => ({
      response: 'I can help you with:\n• GST calculations\n• Invoice generation\n• Vehicle tracking\n• Credit eligibility\n• And 350+ more tools!\n\nJust tell me what you need.',
      tools: [],
    }),
  },
};
```

---

## MCP Tools Integration

### Tool Registry & Executor

```typescript
// packages/showcase-core/src/tools/registry.ts

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private categories: Map<string, ToolCategory> = new Map();
  private mcpClient: MCPClient;

  constructor(mcpConfig: MCPConfig) {
    this.mcpClient = new MCPClient(mcpConfig);
    this.loadTools();
  }

  private async loadTools(): Promise<void> {
    // Load all 350+ tools from @powerpbox/mcp
    const mcpTools = await this.mcpClient.listTools();

    for (const tool of mcpTools) {
      this.tools.set(tool.id, {
        id: tool.id,
        name: tool.name,
        description: tool.description,
        category: this.categorize(tool),
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
        examples: tool.examples || [],
        languages: tool.languages || ['en', 'hi'],
        isPublic: true,
        isFeatured: FEATURED_TOOLS.includes(tool.id),
      });

      // Update category counts
      const cat = this.categories.get(tool.category) || { count: 0, tools: [] };
      cat.count++;
      cat.tools.push(tool.id);
      this.categories.set(tool.category, cat);
    }
  }

  async execute(params: ExecuteParams): Promise<ExecutionResult> {
    const { toolId, parameters, userId, conversationId } = params;

    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new ToolNotFoundError(toolId);
    }

    // Validate parameters
    const validation = this.validateParams(tool, parameters);
    if (!validation.valid) {
      throw new ValidationError(validation.errors);
    }

    // Execute via MCP
    const startTime = Date.now();

    try {
      const result = await this.mcpClient.executeTool(toolId, parameters);

      return {
        success: true,
        output: result,
        latencyMs: Date.now() - startTime,
        toolId,
        toolName: tool.name,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        latencyMs: Date.now() - startTime,
        toolId,
        toolName: tool.name,
      };
    }
  }

  getByCategory(category: string): Tool[] {
    const cat = this.categories.get(category);
    if (!cat) return [];
    return cat.tools.map(id => this.tools.get(id)!);
  }

  search(query: string): Tool[] {
    const queryLower = query.toLowerCase();
    return Array.from(this.tools.values()).filter(tool =>
      tool.name.toLowerCase().includes(queryLower) ||
      tool.description.toLowerCase().includes(queryLower) ||
      tool.id.includes(queryLower)
    );
  }
}

// Tool Categories (350+ tools across 10 categories)
export const TOOL_CATEGORIES: ToolCategoryConfig[] = [
  {
    id: 'compliance',
    name: 'GST & Compliance',
    icon: 'FileText',
    description: 'GST, TDS, ITR, E-Way Bill, E-Invoice tools',
    count: 54,
  },
  {
    id: 'banking',
    name: 'Banking & Finance',
    icon: 'CreditCard',
    description: 'UPI, EMI, Loans, Credit, Insurance tools',
    count: 28,
  },
  {
    id: 'logistics',
    name: 'Logistics & Tracking',
    icon: 'Truck',
    description: 'Vehicle tracking, Routes, E-Way Bills, Fleet tools',
    count: 35,
  },
  {
    id: 'government',
    name: 'Government APIs',
    icon: 'Building',
    description: 'Aadhaar, PAN, DigiLocker, EPF, PM Schemes',
    count: 22,
  },
  {
    id: 'erp',
    name: 'ERP & Inventory',
    icon: 'Package',
    description: 'Invoicing, Stock, Purchase Orders, Accounting',
    count: 44,
  },
  {
    id: 'crm',
    name: 'CRM & Sales',
    icon: 'Users',
    description: 'Leads, Contacts, Opportunities, Pipeline',
    count: 30,
  },
  {
    id: 'voice',
    name: 'Voice & Language',
    icon: 'Mic',
    description: 'STT, TTS, Translation, Language detection',
    count: 14,
  },
  {
    id: 'memory',
    name: 'Memory & Context',
    icon: 'Brain',
    description: 'EON memory operations, Context management',
    count: 14,
  },
  {
    id: 'document',
    name: 'Document Processing',
    icon: 'FileSearch',
    description: 'OCR, PDF generation, Template filling',
    count: 18,
  },
  {
    id: 'search',
    name: 'Search & Knowledge',
    icon: 'Search',
    description: 'Web search, RAG queries, Knowledge base',
    count: 12,
  },
];

// Featured tools for homepage
export const FEATURED_TOOLS = [
  'gst_calculate',
  'einvoice_generate',
  'eway_bill_generate',
  'track_vehicle',
  'whatsapp_send',
  'credit_eligibility_check',
  'aadhaar_verify',
  'upi_create_payment',
];
```

---

## Memory & Learning System

### EON Memory Architecture

```typescript
// packages/eon/src/memory.ts

/**
 * EON Memory - Three-Layer Context Engineering
 *
 * Layer 1: EPISODIC MEMORY
 *          - Events and experiences
 *          - "What happened"
 *          - Time-ordered
 *          - Auto-decays
 *
 * Layer 2: SEMANTIC MEMORY
 *          - Facts and knowledge
 *          - "What we know"
 *          - Entity relationships
 *          - Persistent
 *
 * Layer 3: PROCEDURAL MEMORY
 *          - Patterns and skills
 *          - "How to do things"
 *          - Workflow learning
 *          - Optimizes over time
 */

export class EONMemory {
  private db: PrismaClient;
  private embeddings: EmbeddingService;
  private cache: LRUCache<string, Memory[]>;

  constructor(config: EONConfig) {
    this.db = new PrismaClient();
    this.embeddings = new EmbeddingService(config.embeddingModel);
    this.cache = new LRUCache({ max: 1000, ttl: 1000 * 60 * 5 });
  }

  // ═══════════════════════════════════════════════════════════════
  // STORE OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  async store(params: StoreParams): Promise<Memory> {
    const { userId, type, content, scope = 'user', metadata, ttl } = params;

    // Generate embedding for semantic search
    const embedding = await this.embeddings.embed(content);

    // Calculate expiry
    const expiresAt = ttl
      ? new Date(Date.now() + ttl * 1000)
      : type === 'episodic'
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        : null; // No expiry for semantic/procedural

    const memory = await this.db.memory.create({
      data: {
        userId,
        type,
        scope,
        content,
        embedding,
        metadata: metadata || {},
        confidence: 1.0,
        expiresAt,
      },
    });

    // Invalidate cache
    this.cache.delete(`${userId}:${type}`);

    return memory;
  }

  async storeEpisodic(
    userId: string,
    event: string,
    context?: Record<string, any>
  ): Promise<Memory> {
    return this.store({
      userId,
      type: 'episodic',
      content: event,
      metadata: {
        timestamp: new Date().toISOString(),
        ...context,
      },
    });
  }

  async storeSemantic(
    userId: string,
    fact: string,
    source?: string
  ): Promise<Memory> {
    // Check for duplicate facts
    const existing = await this.search({
      userId,
      query: fact,
      type: 'semantic',
      limit: 1,
      minScore: 0.95,
    });

    if (existing.length > 0) {
      // Update confidence of existing fact
      await this.db.memory.update({
        where: { id: existing[0].id },
        data: {
          accessCount: { increment: 1 },
          confidence: Math.min(existing[0].confidence + 0.1, 1.0),
        },
      });
      return existing[0];
    }

    return this.store({
      userId,
      type: 'semantic',
      content: fact,
      metadata: { source },
    });
  }

  async storeProcedural(
    userId: string,
    pattern: string,
    workflow: Record<string, any>
  ): Promise<Memory> {
    return this.store({
      userId,
      type: 'procedural',
      content: pattern,
      metadata: workflow,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // RETRIEVAL OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  async search(params: SearchParams): Promise<MemoryWithScore[]> {
    const { userId, query, type, limit = 10, minScore = 0.7 } = params;

    // Check cache
    const cacheKey = `${userId}:${type}:${query}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    // Generate query embedding
    const queryEmbedding = await this.embeddings.embed(query);

    // Semantic search with pgvector
    const results = await this.db.$queryRaw<MemoryWithScore[]>`
      SELECT
        m.*,
        1 - (m.embedding <=> ${queryEmbedding}::vector) as score
      FROM memories m
      WHERE m.user_id = ${userId}
        ${type ? Prisma.sql`AND m.type = ${type}` : Prisma.empty}
        AND (m.expires_at IS NULL OR m.expires_at > NOW())
        AND 1 - (m.embedding <=> ${queryEmbedding}::vector) >= ${minScore}
      ORDER BY score DESC
      LIMIT ${limit}
    `;

    // Update access counts
    const ids = results.map(r => r.id);
    await this.db.memory.updateMany({
      where: { id: { in: ids } },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    });

    this.cache.set(cacheKey, results);
    return results;
  }

  async recall(userId: string, context: string): Promise<AssembledContext> {
    // Parallel retrieval from all memory types
    const [episodic, semantic, procedural] = await Promise.all([
      this.search({
        userId,
        query: context,
        type: 'episodic',
        limit: 5,
        minScore: 0.6,
      }),
      this.search({
        userId,
        query: context,
        type: 'semantic',
        limit: 10,
        minScore: 0.7,
      }),
      this.search({
        userId,
        query: context,
        type: 'procedural',
        limit: 3,
        minScore: 0.8,
      }),
    ]);

    return {
      episodic: episodic.map(m => ({
        content: m.content,
        timestamp: m.metadata.timestamp,
        relevance: m.score,
      })),
      semantic: semantic.map(m => ({
        fact: m.content,
        source: m.metadata.source,
        confidence: m.confidence,
        relevance: m.score,
      })),
      procedural: procedural.map(m => ({
        pattern: m.content,
        workflow: m.metadata,
        relevance: m.score,
      })),
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // LEARNING & OPTIMIZATION
  // ═══════════════════════════════════════════════════════════════

  async learn(params: LearnParams): Promise<void> {
    const { userId, interaction, feedback } = params;

    // Store interaction as episodic memory
    await this.storeEpisodic(userId, `User: ${interaction.query}`, {
      intent: interaction.intent,
      response: interaction.response,
      tools: interaction.toolsUsed,
      satisfied: feedback?.satisfied,
    });

    // Extract and store semantic facts
    if (interaction.entities) {
      for (const entity of interaction.entities) {
        if (entity.type === 'person' || entity.type === 'company') {
          await this.storeSemantic(
            userId,
            `${entity.type}: ${entity.value} (normalized: ${entity.normalized})`,
            'entity_extraction'
          );
        }
      }
    }

    // Learn procedural patterns
    if (interaction.toolsUsed?.length > 0) {
      const pattern = `Intent "${interaction.intent}" → Tools: ${interaction.toolsUsed.join(' → ')}`;
      await this.storeProcedural(userId, pattern, {
        intent: interaction.intent,
        tools: interaction.toolsUsed,
        successCount: feedback?.satisfied ? 1 : 0,
      });
    }
  }

  async forget(params: ForgetParams): Promise<void> {
    const { userId, type, olderThan, lowConfidence } = params;

    // Smart forgetting based on criteria
    await this.db.memory.deleteMany({
      where: {
        userId,
        type,
        OR: [
          olderThan ? { createdAt: { lt: olderThan } } : {},
          lowConfidence ? { confidence: { lt: lowConfidence } } : {},
          { expiresAt: { lt: new Date() } },
        ],
      },
    });

    // Clear cache
    this.cache.clear();
  }
}
```

---

## Port Configuration

```typescript
// packages/config/src/ports.ts

export const PORTS = {
  // ═══════════════════════════════════════════════════════════════
  // ANKR UNIVERSE
  // ═══════════════════════════════════════════════════════════════
  universe: {
    gateway: 4500,      // Main API Gateway
    web: 3500,          // Web Frontend
    pulse: 4506,        // Metrics Dashboard
  },

  // ═══════════════════════════════════════════════════════════════
  // AI SERVICES
  // ═══════════════════════════════════════════════════════════════
  ai: {
    proxy: 4444,        // AI Proxy (existing)
    slmRouter: 4447,    // SLM Router
    eon: 4005,          // EON Memory (existing)
    ollama: 11434,      // Local SLM
  },

  // ═══════════════════════════════════════════════════════════════
  // EXISTING PRODUCTS
  // ═══════════════════════════════════════════════════════════════
  wowtruck: {
    api: 4000,
    web: 3002,
  },
  bfc: {
    api: 4020,
    web: 3020,
  },
  swayam: {
    ws: 7777,
  },

  // ═══════════════════════════════════════════════════════════════
  // INFRASTRUCTURE
  // ═══════════════════════════════════════════════════════════════
  infra: {
    postgres: 5432,
    redis: 6379,
    verdaccio: 4873,
  },

  // ═══════════════════════════════════════════════════════════════
  // OBSERVABILITY
  // ═══════════════════════════════════════════════════════════════
  observability: {
    prometheus: 9090,
    grafana: 3000,
    jaeger: 16686,
  },
};
```

---

## Performance Targets

| Metric | Target | P50 | P95 | P99 |
|--------|--------|-----|-----|-----|
| Intent Classification | <50ms | 15ms | 40ms | 80ms |
| Entity Extraction | <30ms | 10ms | 25ms | 50ms |
| EON Memory Lookup | <20ms | 5ms | 15ms | 30ms |
| SLM Inference | <200ms | 80ms | 150ms | 250ms |
| LLM Fallback | <3000ms | 1000ms | 2500ms | 4000ms |
| Tool Execution | <500ms | 100ms | 400ms | 800ms |
| WebSocket Latency | <50ms | 10ms | 30ms | 60ms |
| End-to-End (SLM) | <500ms | 150ms | 350ms | 600ms |
| End-to-End (LLM) | <5000ms | 1500ms | 4000ms | 6000ms |

---

## Related Documents

| Document | Description |
|----------|-------------|
| [ANKR-UNIVERSE-API-SPEC.md](./ANKR-UNIVERSE-API-SPEC.md) | Complete API specification |
| [ANKR-UNIVERSE-SDK.md](./ANKR-UNIVERSE-SDK.md) | SDK documentation |
| [ANKR-UNIVERSE-DATA-MODELS.md](./ANKR-UNIVERSE-DATA-MODELS.md) | Database schemas |
| [ANKR-UNIVERSE-ROADMAP.md](./ANKR-UNIVERSE-ROADMAP.md) | Implementation roadmap |

---

*Architecture Version: 1.0.0 | Last Updated: 19 Jan 2026*
