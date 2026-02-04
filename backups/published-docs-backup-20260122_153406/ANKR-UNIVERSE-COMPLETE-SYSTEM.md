# ANKR Universe - Complete System Architecture
## Backend + Conversational Intelligence + User Frontend

**Version:** 1.0.0
**Date:** 19 Jan 2026
**Codename:** "ANKR Constellation"

---

## 🎯 Vision

> **A single conversational interface where users can experience the entire ANKR ecosystem - speak in any of 11 languages, see tools execute in real-time, watch AI learn, and build anything.**

---

## 🏗️ System Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                         ANKR UNIVERSE CONSTELLATION                             │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    🌐 USER INTERFACE LAYER                               │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │   │
│  │  │ Web App    │  │ Mobile     │  │ Voice      │  │ CLI (AnkrCode)     │ │   │
│  │  │ (React)    │  │ (RN/Expo)  │  │ (WebSocket)│  │ (Terminal)         │ │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                         │
│                                       ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    🚀 ANKR GATEWAY (Unified API)                         │   │
│  │                    Port: 4500 | GraphQL + REST + WebSocket              │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│   │
│  │  │ Auth/JWT    │ │ Rate Limit  │ │ Request ID  │ │ Multi-tenant        ││   │
│  │  │ + API Keys  │ │ + Throttle  │ │ + Tracing   │ │ + Org Context       ││   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                         │
│                                       ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    🧠 CONVERSATIONAL INTELLIGENCE LAYER                  │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│   │
│  │  │ Intent      │ │ Context     │ │ Persona     │ │ Agent               ││   │
│  │  │ Classifier  │ │ Engine      │ │ Manager     │ │ Orchestrator        ││   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘│   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│   │
│  │  │ Entity      │ │ Session     │ │ Response    │ │ Multi-turn          ││   │
│  │  │ Extractor   │ │ Manager     │ │ Generator   │ │ Tracker             ││   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                         │
│                                       ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    ⚡ ROUTING & EXECUTION LAYER                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐│   │
│  │  │                   SLM ROUTER (4-Tier Cascade)                       ││   │
│  │  │  Tier 0: EON Memory → Tier 1: Deterministic → Tier 2: SLM → Tier 3 ││   │
│  │  └─────────────────────────────────────────────────────────────────────┘│   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│   │
│  │  │ Tool        │ │ Workflow    │ │ Competition │ │ Team                ││   │
│  │  │ Executor    │ │ Engine      │ │ Mode        │ │ Mode                ││   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                         │
│                                       ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    🔧 MCP TOOLS LAYER (260+ Tools)                       │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐ │   │
│  │  │ GST/Tax │ │ Banking │ │Logistics│ │  Govt   │ │ ERP/CRM │ │ Voice │ │   │
│  │  │ 54 tools│ │ 28 tools│ │ 35 tools│ │ 22 tools│ │ 74 tools│ │14 tool│ │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────┘ │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                         │
│                                       ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    💾 DATA & MEMORY LAYER                                │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│   │
│  │  │ PostgreSQL  │ │ Redis       │ │ EON Memory  │ │ Knowledge Base      ││   │
│  │  │ + pgvector  │ │ Cache/Queue │ │ 3 Layers    │ │ + Embeddings        ││   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                         │
│                                       ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    📊 OBSERVABILITY LAYER (PULSE)                        │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│   │
│  │  │ Metrics     │ │ Logging     │ │ Tracing     │ │ Cost Tracking       ││   │
│  │  │ (Prometheus)│ │ (Winston)   │ │ (OpenTelm)  │ │ (Per-request)       ││   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
ankr-universe/
├── apps/
│   ├── gateway/                    # Unified API Gateway (Port 4500)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── schema/             # GraphQL Schema
│   │   │   │   ├── index.ts
│   │   │   │   ├── conversation.graphql
│   │   │   │   ├── tools.graphql
│   │   │   │   ├── memory.graphql
│   │   │   │   └── showcase.graphql
│   │   │   ├── resolvers/
│   │   │   │   ├── conversation.resolver.ts
│   │   │   │   ├── tools.resolver.ts
│   │   │   │   ├── memory.resolver.ts
│   │   │   │   ├── showcase.resolver.ts
│   │   │   │   └── subscription.resolver.ts
│   │   │   ├── services/
│   │   │   │   ├── conversation.service.ts
│   │   │   │   ├── orchestrator.service.ts
│   │   │   │   ├── tool-executor.service.ts
│   │   │   │   └── showcase.service.ts
│   │   │   ├── websocket/
│   │   │   │   ├── conversation.handler.ts
│   │   │   │   ├── voice.handler.ts
│   │   │   │   └── pulse.handler.ts
│   │   │   ├── plugins/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── rate-limit.ts
│   │   │   │   └── tracing.ts
│   │   │   └── middleware/
│   │   │       ├── context.ts
│   │   │       └── error-handler.ts
│   │   └── package.json
│   │
│   ├── web/                        # User Frontend (Port 3500)
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── components/
│   │   │   │   ├── conversation/
│   │   │   │   │   ├── ChatInterface.tsx
│   │   │   │   │   ├── MessageBubble.tsx
│   │   │   │   │   ├── VoiceInput.tsx
│   │   │   │   │   ├── ToolExecution.tsx
│   │   │   │   │   └── MemoryPanel.tsx
│   │   │   │   ├── showcase/
│   │   │   │   │   ├── ToolExplorer.tsx
│   │   │   │   │   ├── PackageCatalog.tsx
│   │   │   │   │   ├── ProductShowcase.tsx
│   │   │   │   │   └── DemoGallery.tsx
│   │   │   │   ├── pulse/
│   │   │   │   │   ├── SystemStatus.tsx
│   │   │   │   │   ├── MetricsDisplay.tsx
│   │   │   │   │   └── ActivityStream.tsx
│   │   │   │   └── shared/
│   │   │   │       ├── Layout.tsx
│   │   │   │       ├── Navigation.tsx
│   │   │   │       └── ThemeProvider.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useConversation.ts
│   │   │   │   ├── useVoice.ts
│   │   │   │   ├── useTools.ts
│   │   │   │   └── useRealtime.ts
│   │   │   ├── stores/
│   │   │   │   ├── conversation.store.ts
│   │   │   │   ├── tools.store.ts
│   │   │   │   └── ui.store.ts
│   │   │   └── lib/
│   │   │       ├── apollo.ts
│   │   │       ├── websocket.ts
│   │   │       └── voice.ts
│   │   └── package.json
│   │
│   └── mobile/                     # Mobile App (Expo)
│       └── ...
│
├── packages/
│   ├── conversation-engine/        # Conversational AI Core
│   │   ├── src/
│   │   │   ├── intent/
│   │   │   │   ├── classifier.ts
│   │   │   │   ├── patterns.ts
│   │   │   │   └── domains.ts
│   │   │   ├── context/
│   │   │   │   ├── engine.ts
│   │   │   │   ├── compressor.ts
│   │   │   │   └── assembler.ts
│   │   │   ├── entity/
│   │   │   │   ├── extractor.ts
│   │   │   │   └── validators.ts
│   │   │   ├── session/
│   │   │   │   ├── manager.ts
│   │   │   │   └── history.ts
│   │   │   ├── persona/
│   │   │   │   ├── manager.ts
│   │   │   │   └── definitions.ts
│   │   │   ├── response/
│   │   │   │   ├── generator.ts
│   │   │   │   └── formatter.ts
│   │   │   └── orchestrator/
│   │   │       ├── state-machine.ts
│   │   │       └── agents/
│   │   │           ├── router.agent.ts
│   │   │           ├── tool.agent.ts
│   │   │           ├── persona.agent.ts
│   │   │           └── memory.agent.ts
│   │   └── package.json
│   │
│   ├── showcase-core/              # Showcase Platform Core
│   │   ├── src/
│   │   │   ├── tools/
│   │   │   │   ├── registry.ts
│   │   │   │   ├── executor.ts
│   │   │   │   └── playground.ts
│   │   │   ├── packages/
│   │   │   │   ├── catalog.ts
│   │   │   │   └── docs.ts
│   │   │   ├── demos/
│   │   │   │   ├── manager.ts
│   │   │   │   └── flows.ts
│   │   │   └── metrics/
│   │   │       ├── collector.ts
│   │   │       └── reporter.ts
│   │   └── package.json
│   │
│   └── ui/                         # Shared UI Components
│       └── ...
│
├── prisma/
│   └── schema.prisma               # Database Schema
│
├── docker-compose.yml
├── package.json
└── turbo.json
```

---

## 🗄️ Database Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== USERS & AUTH ====================

model User {
  id            String   @id @default(cuid())
  email         String?  @unique
  phone         String?  @unique
  name          String?
  avatar        String?
  language      String   @default("en") // en, hi, ta, te, bn, mr, gu, kn, ml, pa, or
  timezone      String   @default("Asia/Kolkata")

  // Auth
  authProvider  String   @default("phone") // phone, google, email
  lastLoginAt   DateTime?

  // Preferences
  preferVoice   Boolean  @default(false)
  defaultPersona String  @default("swayam")

  // Relations
  sessions      Session[]
  conversations Conversation[]
  toolUsages    ToolUsage[]
  memories      Memory[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Session {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])

  token         String   @unique
  deviceInfo    Json?    // { type, os, browser, ip }

  expiresAt     DateTime
  lastActiveAt  DateTime @default(now())

  createdAt     DateTime @default(now())
}

// ==================== CONVERSATIONS ====================

model Conversation {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])

  title         String?  // Auto-generated from first message
  persona       String   @default("swayam")
  language      String   @default("en")

  // State
  status        ConversationStatus @default(ACTIVE)
  turnCount     Int      @default(0)

  // Metrics
  totalLatencyMs Int     @default(0)
  totalCostUsd   Float   @default(0)

  // Relations
  messages      Message[]
  toolExecutions ToolExecution[]

  // Timestamps
  startedAt     DateTime @default(now())
  endedAt       DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum ConversationStatus {
  ACTIVE
  PAUSED
  COMPLETED
  ARCHIVED
}

model Message {
  id              String   @id @default(cuid())
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id])

  role            MessageRole
  content         String
  contentType     String   @default("text") // text, voice, image, file

  // For voice messages
  audioUrl        String?
  transcription   String?

  // Intent & Entities
  intent          Json?    // { primary, domain, confidence }
  entities        Json?    // [{ type, value, normalized }]

  // Metadata
  latencyMs       Int?
  tier            String?  // deterministic, slm, llm
  model           String?  // qwen2.5, claude-3, etc.
  costUsd         Float?

  // For assistant messages
  toolsUsed       String[] // tool IDs

  createdAt       DateTime @default(now())
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
  TOOL
}

// ==================== TOOL EXECUTION ====================

model ToolExecution {
  id              String   @id @default(cuid())
  conversationId  String?
  conversation    Conversation? @relation(fields: [conversationId], references: [id])

  // Tool info
  toolId          String   // e.g., "gst_calculate"
  toolName        String
  category        String   // compliance, banking, logistics, etc.

  // Execution
  input           Json
  output          Json?
  status          ExecutionStatus @default(PENDING)
  error           String?

  // Routing
  tier            String   // deterministic, slm, llm
  routingReason   String?

  // Metrics
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  latencyMs       Int?
  costUsd         Float?

  createdAt       DateTime @default(now())
}

enum ExecutionStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}

model ToolUsage {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])

  toolId        String
  count         Int      @default(1)
  totalLatencyMs Int     @default(0)

  lastUsedAt    DateTime @default(now())

  @@unique([userId, toolId])
}

// ==================== MEMORY (EON) ====================

model Memory {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])

  type          MemoryType
  scope         String   @default("user") // user, org, global

  content       String
  embedding     Unsupported("vector(1536)")?

  // Metadata
  source        String?  // conversation, tool, manual
  sourceId      String?  // conversation ID, etc.
  confidence    Float    @default(1.0)

  // Lifecycle
  accessCount   Int      @default(0)
  lastAccessedAt DateTime?
  expiresAt     DateTime?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum MemoryType {
  EPISODIC     // Events, experiences
  SEMANTIC     // Facts, knowledge
  PROCEDURAL   // Skills, patterns
}

// ==================== SHOWCASE ====================

model Tool {
  id            String   @id // e.g., "gst_calculate"
  name          String
  description   String
  category      String
  subcategory   String?

  // Schema
  inputSchema   Json     // JSON Schema for parameters
  outputSchema  Json?

  // Examples
  examples      Json[]   // [{ input, output, description }]

  // Metadata
  languages     String[] // Supported languages
  isPublic      Boolean  @default(true)
  isFeatured    Boolean  @default(false)

  // Stats
  usageCount    Int      @default(0)
  avgLatencyMs  Int      @default(0)
  successRate   Float    @default(1.0)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Package {
  id            String   @id // e.g., "@ankr/eon"
  name          String
  version       String
  description   String

  category      String   // ai, auth, domain, ui, etc.

  // Docs
  readme        String?
  changelog     String?
  apiDocs       Json?

  // Stats
  downloads     Int      @default(0)
  stars         Int      @default(0)

  // Metadata
  repository    String?
  homepage      String?
  keywords      String[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Demo {
  id            String   @id @default(cuid())
  slug          String   @unique
  title         String
  description   String

  // Demo flow
  steps         Json[]   // [{ type, config, expectedOutput }]

  // Metadata
  category      String   // flagship, quick, advanced
  toolsUsed     String[]
  estimatedTime Int      // seconds

  // Stats
  runCount      Int      @default(0)
  completionRate Float   @default(0)

  isFeatured    Boolean  @default(false)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// ==================== METRICS ====================

model SystemMetric {
  id            String   @id @default(cuid())

  // Metric
  name          String   // queries_total, latency_avg, cost_total, etc.
  value         Float
  labels        Json?    // { tier: "slm", tool: "gst_calculate" }

  timestamp     DateTime @default(now())

  @@index([name, timestamp])
}

model DailyStats {
  id            String   @id @default(cuid())
  date          DateTime @db.Date

  // Queries
  totalQueries  Int      @default(0)
  slmQueries    Int      @default(0)
  llmQueries    Int      @default(0)

  // Latency
  avgLatencyMs  Int      @default(0)
  p95LatencyMs  Int      @default(0)

  // Cost
  totalCostUsd  Float    @default(0)
  savedCostUsd  Float    @default(0) // What it would have cost without SLM

  // Users
  activeUsers   Int      @default(0)
  newUsers      Int      @default(0)

  // Voice
  voiceQueries  Int      @default(0)
  languageBreakdown Json? // { hi: 500, en: 300, ta: 100 }

  createdAt     DateTime @default(now())

  @@unique([date])
}
```

---

## 🔌 GraphQL Schema

```graphql
# schema/index.graphql

# ==================== CONVERSATION ====================

type Query {
  # Conversations
  conversation(id: ID!): Conversation
  conversations(first: Int, after: String): ConversationConnection!

  # Tools
  tools(category: String, search: String): [Tool!]!
  tool(id: ID!): Tool
  toolCategories: [ToolCategory!]!

  # Packages
  packages(category: String, search: String): [Package!]!
  package(id: ID!): Package

  # Demos
  demos(category: String): [Demo!]!
  demo(slug: String!): Demo

  # Memory
  memories(type: MemoryType, search: String, limit: Int): [Memory!]!

  # Metrics
  systemStatus: SystemStatus!
  dailyStats(days: Int): [DailyStats!]!

  # User
  me: User
}

type Mutation {
  # Conversation
  startConversation(input: StartConversationInput!): Conversation!
  sendMessage(input: SendMessageInput!): SendMessageResult!
  endConversation(id: ID!): Conversation!

  # Tools
  executeTool(input: ExecuteToolInput!): ToolExecutionResult!

  # Demos
  runDemo(slug: String!): DemoRunResult!

  # Memory
  addMemory(input: AddMemoryInput!): Memory!

  # User
  updatePreferences(input: UpdatePreferencesInput!): User!
}

type Subscription {
  # Real-time conversation updates
  messageAdded(conversationId: ID!): Message!
  toolExecutionUpdated(conversationId: ID!): ToolExecution!

  # System-wide
  systemMetrics: SystemMetricUpdate!
  activityStream: ActivityEvent!
}

# ==================== TYPES ====================

type Conversation {
  id: ID!
  title: String
  persona: String!
  language: String!
  status: ConversationStatus!
  turnCount: Int!
  totalLatencyMs: Int!
  totalCostUsd: Float!
  messages: [Message!]!
  toolExecutions: [ToolExecution!]!
  startedAt: DateTime!
  endedAt: DateTime
}

type Message {
  id: ID!
  role: MessageRole!
  content: String!
  contentType: String!
  audioUrl: String
  transcription: String
  intent: IntentResult
  entities: [Entity!]
  latencyMs: Int
  tier: String
  model: String
  costUsd: Float
  toolsUsed: [String!]
  createdAt: DateTime!
}

type IntentResult {
  primary: String!
  domain: String!
  confidence: Float!
  voiceTriggers: [String!]
}

type Entity {
  type: String!
  value: String!
  normalized: String
  confidence: Float
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
  tier: String!
  routingReason: String
  latencyMs: Int
  costUsd: Float
  startedAt: DateTime!
  completedAt: DateTime
}

type Tool {
  id: ID!
  name: String!
  description: String!
  category: String!
  subcategory: String
  inputSchema: JSON!
  outputSchema: JSON
  examples: [ToolExample!]!
  languages: [String!]!
  isPublic: Boolean!
  isFeatured: Boolean!
  usageCount: Int!
  avgLatencyMs: Int!
  successRate: Float!
}

type ToolExample {
  description: String!
  input: JSON!
  output: JSON!
}

type ToolCategory {
  id: String!
  name: String!
  icon: String!
  toolCount: Int!
}

type Package {
  id: ID!
  name: String!
  version: String!
  description: String!
  category: String!
  readme: String
  apiDocs: JSON
  downloads: Int!
  stars: Int!
  repository: String
  homepage: String
  keywords: [String!]!
}

type Demo {
  id: ID!
  slug: String!
  title: String!
  description: String!
  steps: [DemoStep!]!
  category: String!
  toolsUsed: [String!]!
  estimatedTime: Int!
  runCount: Int!
  completionRate: Float!
  isFeatured: Boolean!
}

type DemoStep {
  type: String!       # input, tool, output, wait
  config: JSON!
  expectedOutput: JSON
}

type Memory {
  id: ID!
  type: MemoryType!
  scope: String!
  content: String!
  source: String
  confidence: Float!
  accessCount: Int!
  createdAt: DateTime!
}

type SystemStatus {
  overall: ServiceStatus!
  services: [ServiceInfo!]!
  metrics: SystemMetrics!
}

type ServiceInfo {
  name: String!
  status: ServiceStatus!
  latencyMs: Int
  uptime: Float
  port: Int
}

type SystemMetrics {
  totalQueries: Int!
  avgLatencyMs: Int!
  slmPercentage: Float!
  costSavings: Float!
  activeUsers: Int!
}

type DailyStats {
  date: DateTime!
  totalQueries: Int!
  slmQueries: Int!
  llmQueries: Int!
  avgLatencyMs: Int!
  totalCostUsd: Float!
  savedCostUsd: Float!
  activeUsers: Int!
  voiceQueries: Int!
  languageBreakdown: JSON
}

type ActivityEvent {
  id: ID!
  type: String!       # tool_execution, conversation, memory, etc.
  data: JSON!
  timestamp: DateTime!
}

# ==================== INPUTS ====================

input StartConversationInput {
  persona: String
  language: String
  initialMessage: String
}

input SendMessageInput {
  conversationId: ID!
  content: String!
  contentType: String        # text, voice
  audioData: String          # Base64 for voice
}

input ExecuteToolInput {
  toolId: String!
  parameters: JSON!
  conversationId: ID         # Optional, for tracking
}

input AddMemoryInput {
  type: MemoryType!
  content: String!
  scope: String
}

input UpdatePreferencesInput {
  language: String
  preferVoice: Boolean
  defaultPersona: String
}

# ==================== RESULTS ====================

type SendMessageResult {
  userMessage: Message!
  assistantMessage: Message!
  toolExecutions: [ToolExecution!]!
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
}

type DemoStepResult {
  stepIndex: Int!
  success: Boolean!
  output: JSON
  latencyMs: Int
}

# ==================== ENUMS ====================

enum ConversationStatus {
  ACTIVE
  PAUSED
  COMPLETED
  ARCHIVED
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
  TOOL
}

enum ExecutionStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}

enum MemoryType {
  EPISODIC
  SEMANTIC
  PROCEDURAL
}

enum ServiceStatus {
  HEALTHY
  DEGRADED
  DOWN
}

# ==================== SCALARS ====================

scalar DateTime
scalar JSON
```

---

## 🔄 WebSocket Protocol

```typescript
// packages/conversation-engine/src/websocket/protocol.ts

// ==================== MESSAGE TYPES ====================

export enum WSMessageType {
  // Connection
  CONNECT = 'connect',
  CONNECTED = 'connected',
  DISCONNECT = 'disconnect',
  PING = 'ping',
  PONG = 'pong',
  ERROR = 'error',

  // Conversation
  CONVERSATION_START = 'conversation:start',
  CONVERSATION_STARTED = 'conversation:started',
  CONVERSATION_END = 'conversation:end',

  // Messages
  MESSAGE_SEND = 'message:send',
  MESSAGE_RECEIVED = 'message:received',
  MESSAGE_TYPING = 'message:typing',

  // Voice
  VOICE_START = 'voice:start',
  VOICE_AUDIO = 'voice:audio',
  VOICE_END = 'voice:end',
  VOICE_TRANSCRIPT = 'voice:transcript',
  VOICE_RESPONSE = 'voice:response',

  // Tools
  TOOL_EXECUTING = 'tool:executing',
  TOOL_PROGRESS = 'tool:progress',
  TOOL_COMPLETED = 'tool:completed',
  TOOL_FAILED = 'tool:failed',

  // Memory
  MEMORY_STORED = 'memory:stored',
  MEMORY_RECALLED = 'memory:recalled',

  // Routing
  ROUTING_DECISION = 'routing:decision',

  // Metrics
  METRICS_UPDATE = 'metrics:update',

  // Activity Stream
  ACTIVITY = 'activity',
}

// ==================== MESSAGE INTERFACES ====================

interface WSMessage<T = any> {
  type: WSMessageType;
  id?: string;           // For request-response correlation
  timestamp: number;
  payload: T;
}

// Connection
interface ConnectPayload {
  token: string;
  language?: string;
  persona?: string;
}

interface ConnectedPayload {
  sessionId: string;
  userId: string;
  capabilities: string[];
}

// Conversation
interface ConversationStartPayload {
  persona?: string;
  language?: string;
  context?: Record<string, any>;
}

interface MessageSendPayload {
  conversationId: string;
  content: string;
  contentType: 'text' | 'voice';
  audioData?: string;    // Base64 for voice
}

interface MessageReceivedPayload {
  conversationId: string;
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    intent?: IntentResult;
    entities?: Entity[];
    tier?: string;
    latencyMs?: number;
    costUsd?: number;
  };
}

// Voice
interface VoiceStartPayload {
  conversationId: string;
  language: string;
}

interface VoiceAudioPayload {
  conversationId: string;
  chunk: string;         // Base64 audio chunk
  isFinal: boolean;
}

interface VoiceTranscriptPayload {
  conversationId: string;
  transcript: string;
  isFinal: boolean;
  language: string;
  confidence: number;
}

interface VoiceResponsePayload {
  conversationId: string;
  text: string;
  audioUrl: string;
  language: string;
}

// Tools
interface ToolExecutingPayload {
  executionId: string;
  conversationId?: string;
  toolId: string;
  toolName: string;
  input: Record<string, any>;
  tier: string;
}

interface ToolProgressPayload {
  executionId: string;
  progress: number;      // 0-100
  message?: string;
}

interface ToolCompletedPayload {
  executionId: string;
  output: any;
  latencyMs: number;
  costUsd: number;
}

// Memory
interface MemoryStoredPayload {
  memoryId: string;
  type: 'episodic' | 'semantic' | 'procedural';
  content: string;
  source: string;
}

interface MemoryRecalledPayload {
  memories: Array<{
    id: string;
    type: string;
    content: string;
    relevance: number;
  }>;
  query: string;
}

// Routing
interface RoutingDecisionPayload {
  messageId: string;
  tier: 'eon' | 'deterministic' | 'slm' | 'llm';
  reason: string;
  confidence: number;
  alternativeTiers?: Array<{
    tier: string;
    confidence: number;
  }>;
}

// ==================== CLIENT USAGE ====================

/*
// Connect
ws.send({
  type: 'connect',
  payload: { token: 'jwt...' }
});

// Start conversation
ws.send({
  type: 'conversation:start',
  payload: { persona: 'swayam', language: 'hi' }
});

// Send message
ws.send({
  type: 'message:send',
  payload: {
    conversationId: 'conv_123',
    content: 'Generate GST invoice for 50000',
    contentType: 'text'
  }
});

// Send voice
ws.send({
  type: 'voice:audio',
  payload: {
    conversationId: 'conv_123',
    chunk: 'base64...',
    isFinal: false
  }
});

// Listen for events
ws.on('message:received', (msg) => { ... });
ws.on('tool:executing', (msg) => { ... });
ws.on('tool:progress', (msg) => { ... });
ws.on('tool:completed', (msg) => { ... });
ws.on('memory:stored', (msg) => { ... });
ws.on('routing:decision', (msg) => { ... });
*/
```

---

## 🧠 Conversational Intelligence Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     CONVERSATIONAL INTELLIGENCE FLOW                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  User Input (Voice/Text)                                                      │
│       │                                                                       │
│       ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ 1. INPUT PROCESSING                                                      │ │
│  │    ├─ Voice → STT (Sarvam/Whisper) → Text                               │ │
│  │    ├─ Language Detection (Hindi/English/Tamil/...)                       │ │
│  │    └─ Code-switching normalization                                       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│       │                                                                       │
│       ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ 2. INTENT CLASSIFICATION (3-tier)                                        │ │
│  │    ├─ Tier 1: Pattern Matching (70+ patterns, 100% confidence)          │ │
│  │    ├─ Tier 2: Keyword Matching (domain keywords, 70% threshold)         │ │
│  │    └─ Tier 3: AI Classification (Groq/Claude for ambiguous)             │ │
│  │                                                                          │ │
│  │    Output: { primary: "gst_calculate", domain: "compliance", conf: 0.95}│ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│       │                                                                       │
│       ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ 3. ENTITY EXTRACTION (20+ entity types)                                  │ │
│  │    ├─ Indian IDs: GSTIN, PAN, Aadhaar, CIN, TAN                         │ │
│  │    ├─ Financial: Amount (₹, lakh, crore), percentages                   │ │
│  │    ├─ Location: Pincode, city, state                                    │ │
│  │    ├─ Vehicle: Registration numbers                                     │ │
│  │    ├─ Contact: Phone, email                                             │ │
│  │    └─ Temporal: Dates (multiple formats), relative dates                │ │
│  │                                                                          │ │
│  │    Output: [{ type: "amount", value: "50000", normalized: 50000 }]      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│       │                                                                       │
│       ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ 4. CONTEXT ASSEMBLY (Three-Layer)                                        │ │
│  │    ├─ Identity Layer: User profile, preferences, language               │ │
│  │    ├─ Knowledge Layer: RAG retrieval, relevant docs                     │ │
│  │    └─ Transient Layer: Session facts, recent messages, entities         │ │
│  │                                                                          │ │
│  │    Token Budget: 4000 tokens (Identity: 500, Knowledge: 2000, Trans: 1500)│ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│       │                                                                       │
│       ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ 5. SLM ROUTING (4-Tier Cascade)                                          │ │
│  │                                                                          │ │
│  │    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────┐ │ │
│  │    │ Tier 0: EON │ →  │ Tier 1:     │ →  │ Tier 2: SLM │ →  │ Tier 3: │ │ │
│  │    │ Memory      │    │ Deterministic│    │ (Qwen 2.5)  │    │ LLM     │ │ │
│  │    │ (Cached)    │    │ (Regex)     │    │ (Local)     │    │ (Claude)│ │ │
│  │    │ ~0ms, FREE  │    │ <10ms, FREE │    │ 50-200ms    │    │ 1-5s    │ │ │
│  │    │ 10% hit     │    │ 20% hit     │    │ 65% hit     │    │ 5% hit  │ │ │
│  │    └─────────────┘    └─────────────┘    └─────────────┘    └─────────┘ │ │
│  │                                                                          │ │
│  │    Decision: Route to SLM (confidence: 0.85, reason: "GST calculation") │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│       │                                                                       │
│       ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ 6. TOOL EXECUTION                                                        │ │
│  │    ├─ Tool Selection: gst_calculate                                     │ │
│  │    ├─ Parameter Mapping: { amount: 50000, hsn: "8471" }                 │ │
│  │    ├─ Execution: MCP tool invocation                                    │ │
│  │    └─ Result: { cgst: 4500, sgst: 4500, total: 59000 }                  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│       │                                                                       │
│       ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ 7. RESPONSE GENERATION                                                   │ │
│  │    ├─ Format: Based on user language and persona                        │ │
│  │    ├─ Voice: TTS if voice mode (Sarvam for Hindi)                       │ │
│  │    └─ Follow-up: Suggest related actions                                │ │
│  │                                                                          │ │
│  │    Response: "₹50,000 पर GST: CGST ₹4,500 + SGST ₹4,500 = कुल ₹59,000   │ │
│  │               क्या मैं invoice generate करूं?"                            │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│       │                                                                       │
│       ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ 8. MEMORY UPDATE (EON)                                                   │ │
│  │    ├─ Episodic: "User calculated GST for ₹50,000"                       │ │
│  │    ├─ Semantic: "User's preferred HSN: 8471 (Computers)"                │ │
│  │    └─ Procedural: "GST calculation → Invoice offer" pattern             │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 User Frontend Components

### Chat Interface

```tsx
// apps/web/src/components/conversation/ChatInterface.tsx

import { useState, useRef, useEffect } from 'react';
import { useConversation } from '@/hooks/useConversation';
import { useVoice } from '@/hooks/useVoice';
import { MessageBubble } from './MessageBubble';
import { VoiceInput } from './VoiceInput';
import { ToolExecution } from './ToolExecution';
import { MemoryPanel } from './MemoryPanel';
import { RoutingIndicator } from './RoutingIndicator';

interface ChatInterfaceProps {
  persona?: string;
  showTools?: boolean;
  showMemory?: boolean;
}

export function ChatInterface({
  persona = 'swayam',
  showTools = true,
  showMemory = true
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const {
    conversation,
    messages,
    toolExecutions,
    isLoading,
    sendMessage,
    startConversation,
  } = useConversation({ persona });

  const {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    language,
    setLanguage,
  } = useVoice();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && !transcript) return;

    const content = transcript || input;
    setInput('');

    await sendMessage({
      content,
      contentType: isVoiceMode ? 'voice' : 'text',
    });
  };

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Persona Header */}
        <div className="border-b p-4 flex items-center gap-3">
          <PersonaAvatar persona={persona} />
          <div>
            <h2 className="font-semibold">{getPersonaName(persona)}</h2>
            <p className="text-sm text-gray-500">{getPersonaDescription(persona)}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSelector value={language} onChange={setLanguage} />
            <VoiceModeToggle value={isVoiceMode} onChange={setIsVoiceMode} />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              showMetrics={showTools}
            />
          ))}

          {/* Active Tool Executions */}
          {toolExecutions
            .filter(e => e.status === 'RUNNING')
            .map((execution) => (
              <ToolExecution key={execution.id} execution={execution} />
            ))}

          {/* Typing Indicator */}
          {isLoading && <TypingIndicator persona={persona} />}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          {isVoiceMode ? (
            <VoiceInput
              isRecording={isRecording}
              transcript={transcript}
              language={language}
              onStart={startRecording}
              onStop={stopRecording}
              onSend={handleSend}
            />
          ) : (
            <TextInput
              value={input}
              onChange={setInput}
              onSend={handleSend}
              isLoading={isLoading}
              placeholder={getPlaceholder(language)}
            />
          )}

          {/* Quick Actions */}
          <QuickActions onSelect={(action) => setInput(action)} />
        </div>
      </div>

      {/* Side Panels */}
      {(showTools || showMemory) && (
        <div className="w-80 border-l flex flex-col">
          {showTools && (
            <div className="flex-1 border-b">
              <ToolsPanel executions={toolExecutions} />
            </div>
          )}
          {showMemory && (
            <div className="flex-1">
              <MemoryPanel conversationId={conversation?.id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Message Bubble with rich rendering
function MessageBubble({ message, showMetrics }: { message: Message; showMetrics: boolean }) {
  return (
    <div className={cn(
      'flex gap-3',
      message.role === 'user' ? 'justify-end' : 'justify-start'
    )}>
      {message.role === 'assistant' && <PersonaAvatar size="sm" />}

      <div className={cn(
        'max-w-[70%] rounded-2xl px-4 py-2',
        message.role === 'user'
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-900'
      )}>
        {/* Content */}
        <div className="whitespace-pre-wrap">{message.content}</div>

        {/* Intent Badge */}
        {message.intent && (
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" size="sm">
              {message.intent.domain} / {message.intent.primary}
            </Badge>
            <span className="text-xs opacity-70">
              {(message.intent.confidence * 100).toFixed(0)}%
            </span>
          </div>
        )}

        {/* Entities */}
        {message.entities?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.entities.map((entity, i) => (
              <Badge key={i} variant="secondary" size="sm">
                {entity.type}: {entity.value}
              </Badge>
            ))}
          </div>
        )}

        {/* Metrics */}
        {showMetrics && message.role === 'assistant' && (
          <div className="mt-2 flex items-center gap-3 text-xs opacity-70">
            <span className="flex items-center gap-1">
              <TierIcon tier={message.tier} />
              {message.tier}
            </span>
            <span>{message.latencyMs}ms</span>
            <span>${message.costUsd?.toFixed(4)}</span>
          </div>
        )}
      </div>

      {message.role === 'user' && <UserAvatar size="sm" />}
    </div>
  );
}

// Voice Input Component
function VoiceInput({
  isRecording,
  transcript,
  language,
  onStart,
  onStop,
  onSend
}: VoiceInputProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Waveform */}
      <div className="w-full h-16 bg-gray-100 rounded-lg flex items-center justify-center">
        {isRecording ? (
          <Waveform className="w-full h-full" />
        ) : (
          <span className="text-gray-400">
            {language === 'hi' ? 'बोलने के लिए टैप करें' : 'Tap to speak'}
          </span>
        )}
      </div>

      {/* Transcript */}
      {transcript && (
        <div className="w-full p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Transcript:</p>
          <p className="font-medium">{transcript}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={isRecording ? onStop : onStart}
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center',
            isRecording
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-blue-500 text-white'
          )}
        >
          {isRecording ? <StopIcon /> : <MicIcon />}
        </button>

        {transcript && (
          <button
            onClick={onSend}
            className="px-6 py-3 bg-green-500 text-white rounded-full"
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}

// Tool Execution Component
function ToolExecution({ execution }: { execution: ToolExecutionType }) {
  return (
    <div className="bg-gray-50 border rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center',
          execution.status === 'RUNNING' && 'bg-blue-100 text-blue-600 animate-spin',
          execution.status === 'COMPLETED' && 'bg-green-100 text-green-600',
          execution.status === 'FAILED' && 'bg-red-100 text-red-600',
        )}>
          <ToolIcon toolId={execution.toolId} />
        </div>

        <div className="flex-1">
          <div className="font-medium">{execution.toolName}</div>
          <div className="text-sm text-gray-500">{execution.category}</div>
        </div>

        <div className="text-right">
          <Badge variant={getTierVariant(execution.tier)}>
            {execution.tier}
          </Badge>
          {execution.latencyMs && (
            <div className="text-xs text-gray-500 mt-1">
              {execution.latencyMs}ms
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {execution.status === 'RUNNING' && (
        <div className="mt-3">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${execution.progress || 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Output */}
      {execution.status === 'COMPLETED' && execution.output && (
        <div className="mt-3 p-3 bg-white rounded border">
          <pre className="text-sm overflow-auto">
            {JSON.stringify(execution.output, null, 2)}
          </pre>
        </div>
      )}

      {/* Error */}
      {execution.status === 'FAILED' && execution.error && (
        <div className="mt-3 p-3 bg-red-50 text-red-700 rounded">
          {execution.error}
        </div>
      )}
    </div>
  );
}
```

---

## 🖥️ Showcase Pages

### Landing Page with Live Demo

```tsx
// apps/web/src/pages/Landing/HeroSection.tsx

export function HeroSection() {
  const [demoInput, setDemoInput] = useState('');
  const [demoResult, setDemoResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { metrics } = useSystemMetrics();

  const runQuickDemo = async () => {
    setIsProcessing(true);
    const result = await executeQuickDemo(demoInput);
    setDemoResult(result);
    setIsProcessing(false);
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-20">
        {/* Hero Text */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            AI + Layman = <br />
            <span className="text-blue-400">Anyone Can Build Anything</span>
          </h1>

          <p className="text-xl text-gray-300 mb-8">
            260+ AI Tools. 121 Packages. 11 Languages. All Working Together.
          </p>

          {/* Live Metrics Ticker */}
          <div className="flex justify-center gap-8 mb-12">
            <MetricBadge
              value={metrics.totalQueries.toLocaleString()}
              label="Queries Today"
            />
            <MetricBadge
              value={`${metrics.avgLatencyMs}ms`}
              label="Avg Latency"
            />
            <MetricBadge
              value={`${metrics.slmPercentage}%`}
              label="Local (Free)"
            />
            <MetricBadge
              value={`${metrics.costSavings}%`}
              label="Cost Saved"
            />
          </div>
        </div>

        {/* Interactive Demo */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700">
            <div className="text-center mb-4">
              <span className="text-gray-400">Try it now - </span>
              <span className="text-blue-400">बोलो या लिखो, हम समझ जाएंगे</span>
            </div>

            {/* Input */}
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                placeholder="e.g., Calculate GST on ₹1,00,000"
                className="flex-1 bg-slate-700 rounded-xl px-4 py-3 text-white placeholder-gray-400"
              />
              <button
                onClick={() => setDemoInput('')}
                className="px-4 py-3 bg-slate-700 rounded-xl"
              >
                <MicIcon className="w-5 h-5" />
              </button>
              <button
                onClick={runQuickDemo}
                disabled={!demoInput || isProcessing}
                className="px-6 py-3 bg-blue-500 rounded-xl font-medium disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Try It'}
              </button>
            </div>

            {/* Quick Examples */}
            <div className="flex flex-wrap gap-2 mb-4">
              {quickExamples.map((example) => (
                <button
                  key={example}
                  onClick={() => setDemoInput(example)}
                  className="px-3 py-1 bg-slate-700 rounded-full text-sm hover:bg-slate-600"
                >
                  {example}
                </button>
              ))}
            </div>

            {/* Result */}
            {demoResult && (
              <DemoResultDisplay result={demoResult} />
            )}
          </div>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
          <QuickAccessCard
            icon={<CodeIcon />}
            title="AnkrCode"
            description="CLI for India"
            href="/tools"
          />
          <QuickAccessCard
            icon={<MicIcon />}
            title="Swayam"
            description="Voice AI"
            href="/voice"
          />
          <QuickAccessCard
            icon={<BrainIcon />}
            title="EON Memory"
            description="AI that learns"
            href="/memory"
          />
          <QuickAccessCard
            icon={<PackageIcon />}
            title="121 Packages"
            description="Build anything"
            href="/packages"
          />
        </div>
      </div>
    </section>
  );
}

// Demo Result Display
function DemoResultDisplay({ result }: { result: DemoResult }) {
  return (
    <div className="bg-slate-900 rounded-xl p-4 space-y-3">
      {/* Routing Decision */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-400">Routed to:</span>
        <Badge variant={getTierVariant(result.tier)}>{result.tier}</Badge>
        <span className="text-gray-400">in {result.latencyMs}ms</span>
        <span className="text-gray-400">for ${result.costUsd.toFixed(4)}</span>
      </div>

      {/* Tools Used */}
      {result.toolsUsed.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Tools:</span>
          {result.toolsUsed.map((tool) => (
            <Badge key={tool} variant="outline">{tool}</Badge>
          ))}
        </div>
      )}

      {/* Response */}
      <div className="p-3 bg-slate-800 rounded-lg">
        <p className="text-white">{result.response}</p>
      </div>

      {/* Memory Stored */}
      {result.memoryStored && (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <CheckIcon className="w-4 h-4" />
          <span>Memory updated: {result.memoryStored}</span>
        </div>
      )}
    </div>
  );
}
```

---

## 🔧 Backend Services

### Conversation Service

```typescript
// apps/gateway/src/services/conversation.service.ts

import { PrismaClient } from '@prisma/client';
import { IntentClassifier } from '@ankr/conversation-engine';
import { EntityExtractor } from '@ankr/conversation-engine';
import { ContextEngine } from '@ankr/conversation-engine';
import { SLMRouter } from '@ankr/slm-router';
import { ToolExecutor } from './tool-executor.service';
import { EONMemory } from '@ankr/eon';

export class ConversationService {
  private prisma: PrismaClient;
  private intentClassifier: IntentClassifier;
  private entityExtractor: EntityExtractor;
  private contextEngine: ContextEngine;
  private slmRouter: SLMRouter;
  private toolExecutor: ToolExecutor;
  private eonMemory: EONMemory;

  constructor(deps: ConversationServiceDeps) {
    this.prisma = deps.prisma;
    this.intentClassifier = new IntentClassifier();
    this.entityExtractor = new EntityExtractor();
    this.contextEngine = new ContextEngine(deps.eonMemory);
    this.slmRouter = new SLMRouter(deps.slmConfig);
    this.toolExecutor = deps.toolExecutor;
    this.eonMemory = deps.eonMemory;
  }

  async startConversation(
    userId: string,
    input: StartConversationInput
  ): Promise<Conversation> {
    const conversation = await this.prisma.conversation.create({
      data: {
        userId,
        persona: input.persona || 'swayam',
        language: input.language || 'en',
        status: 'ACTIVE',
      },
    });

    // Add system message with persona context
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'SYSTEM',
        content: getPersonaSystemPrompt(input.persona, input.language),
      },
    });

    // Process initial message if provided
    if (input.initialMessage) {
      await this.processMessage(conversation.id, userId, {
        content: input.initialMessage,
        contentType: 'text',
      });
    }

    return conversation;
  }

  async processMessage(
    conversationId: string,
    userId: string,
    input: SendMessageInput
  ): Promise<SendMessageResult> {
    const startTime = Date.now();

    // Get conversation
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });

    if (!conversation) throw new Error('Conversation not found');

    // 1. Save user message
    const userMessage = await this.prisma.message.create({
      data: {
        conversationId,
        role: 'USER',
        content: input.content,
        contentType: input.contentType,
      },
    });

    // 2. Classify intent
    const intent = await this.intentClassifier.classify(
      input.content,
      conversation.language,
      conversation.messages.map(m => ({ role: m.role, content: m.content }))
    );

    // 3. Extract entities
    const entities = await this.entityExtractor.extract(
      input.content,
      intent.domain
    );

    // Update user message with intent & entities
    await this.prisma.message.update({
      where: { id: userMessage.id },
      data: {
        intent: intent as any,
        entities: entities as any,
      },
    });

    // 4. Assemble context
    const context = await this.contextEngine.assemble(userId, {
      conversationId,
      recentMessages: conversation.messages,
      intent,
      entities,
      tokenBudget: 4000,
    });

    // 5. Route through SLM cascade
    const routingResult = await this.slmRouter.route({
      query: input.content,
      intent,
      entities,
      context,
      language: conversation.language,
    });

    // 6. Execute tools if needed
    const toolExecutions: ToolExecution[] = [];

    if (routingResult.toolsToExecute?.length > 0) {
      for (const toolCall of routingResult.toolsToExecute) {
        const execution = await this.toolExecutor.execute({
          conversationId,
          toolId: toolCall.toolId,
          parameters: toolCall.parameters,
          tier: routingResult.tier,
        });
        toolExecutions.push(execution);
      }
    }

    // 7. Generate response
    const response = await this.generateResponse({
      query: input.content,
      intent,
      entities,
      context,
      toolResults: toolExecutions.map(e => ({
        toolId: e.toolId,
        output: e.output,
      })),
      persona: conversation.persona,
      language: conversation.language,
      routingResult,
    });

    const latencyMs = Date.now() - startTime;

    // 8. Save assistant message
    const assistantMessage = await this.prisma.message.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: response.text,
        intent: intent as any,
        latencyMs,
        tier: routingResult.tier,
        model: routingResult.model,
        costUsd: routingResult.costUsd + toolExecutions.reduce((sum, e) => sum + (e.costUsd || 0), 0),
        toolsUsed: toolExecutions.map(e => e.toolId),
      },
    });

    // 9. Update conversation metrics
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        turnCount: { increment: 1 },
        totalLatencyMs: { increment: latencyMs },
        totalCostUsd: { increment: routingResult.costUsd },
      },
    });

    // 10. Update memory
    await this.updateMemory(userId, {
      conversationId,
      userMessage: input.content,
      assistantMessage: response.text,
      intent,
      entities,
      toolResults: toolExecutions,
    });

    return {
      userMessage,
      assistantMessage,
      toolExecutions,
    };
  }

  private async generateResponse(params: GenerateResponseParams): Promise<GeneratedResponse> {
    const { persona, language, routingResult, toolResults, query, context } = params;

    // If SLM handled it, response is already in routingResult
    if (routingResult.response) {
      return {
        text: routingResult.response,
        followUpSuggestions: routingResult.suggestions,
      };
    }

    // Otherwise, generate with LLM
    const prompt = buildResponsePrompt({
      persona,
      language,
      query,
      context,
      toolResults,
    });

    const response = await this.slmRouter.llmFallback(prompt);

    return {
      text: response.text,
      followUpSuggestions: response.suggestions,
    };
  }

  private async updateMemory(userId: string, params: UpdateMemoryParams) {
    const { conversationId, userMessage, assistantMessage, intent, entities, toolResults } = params;

    // Episodic: What happened
    await this.eonMemory.store({
      userId,
      type: 'episodic',
      content: `User asked: "${userMessage}". Assistant responded with ${intent.primary} result.`,
      source: 'conversation',
      sourceId: conversationId,
    });

    // Semantic: Facts learned
    for (const entity of entities) {
      if (entity.type === 'person' || entity.type === 'company') {
        await this.eonMemory.store({
          userId,
          type: 'semantic',
          content: `${entity.type}: ${entity.value} (normalized: ${entity.normalized})`,
          source: 'entity_extraction',
        });
      }
    }

    // Procedural: Patterns observed
    if (toolResults.length > 0) {
      const toolSequence = toolResults.map(t => t.toolId).join(' → ');
      await this.eonMemory.store({
        userId,
        type: 'procedural',
        content: `Intent "${intent.primary}" typically uses: ${toolSequence}`,
        source: 'tool_execution',
      });
    }
  }
}
```

---

## 📊 Port Configuration

```typescript
// packages/config/src/ports.ts

export const PORTS = {
  // Core Services
  gateway: 4500,           // Unified API Gateway

  // Frontend
  web: 3500,               // User Frontend
  admin: 3501,             // Admin Dashboard

  // AI Services
  aiProxy: 4444,           // AI Proxy (existing)
  slmRouter: 4447,         // SLM Router
  eon: 4005,               // EON Memory (existing)

  // Existing Products
  wowtruck: {
    api: 4000,
    web: 3002,
  },
  bfc: {
    api: 4020,
    web: 3020,
  },

  // Voice
  swayam: 7777,            // Swayam WebSocket (existing)

  // Infrastructure
  postgres: 5432,
  redis: 6379,
  ollama: 11434,           // Local SLM
  verdaccio: 4873,         // Package registry

  // Observability
  pulse: 4006,             // Real-time metrics WebSocket
  prometheus: 9090,
  grafana: 3000,
};
```

---

## 🚀 Docker Compose

```yaml
# docker-compose.yml

version: '3.8'

services:
  # ==================== DATABASES ====================
  postgres:
    image: pgvector/pgvector:pg16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: ankr
      POSTGRES_PASSWORD: ankr_secret
      POSTGRES_DB: ankr_universe
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ankr"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  # ==================== AI SERVICES ====================
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - capabilities: [gpu]
    # Pull qwen2.5:1.5b on startup
    entrypoint: ["/bin/sh", "-c", "ollama serve & sleep 5 && ollama pull qwen2.5:1.5b && tail -f /dev/null"]

  # ==================== CORE SERVICES ====================
  gateway:
    build:
      context: .
      dockerfile: apps/gateway/Dockerfile
    ports:
      - "4500:4500"
    environment:
      DATABASE_URL: postgresql://ankr:ankr_secret@postgres:5432/ankr_universe
      REDIS_URL: redis://redis:6379
      OLLAMA_URL: http://ollama:11434
      AI_PROXY_URL: http://ai-proxy:4444
      EON_URL: http://eon:4005
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      ollama:
        condition: service_started

  ai-proxy:
    build:
      context: .
      dockerfile: apps/ai-proxy/Dockerfile
    ports:
      - "4444:4444"
    environment:
      GROQ_API_KEY: ${GROQ_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}

  eon:
    build:
      context: .
      dockerfile: packages/ankr-eon/Dockerfile
    ports:
      - "4005:4005"
    environment:
      DATABASE_URL: postgresql://ankr:ankr_secret@postgres:5432/ankr_universe
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy

  # ==================== FRONTEND ====================
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "3500:3500"
    environment:
      VITE_API_URL: http://gateway:4500
      VITE_WS_URL: ws://gateway:4500

  # ==================== OBSERVABILITY ====================
  pulse:
    build:
      context: .
      dockerfile: packages/ankr-pulse/Dockerfile
    ports:
      - "4006:4006"
    environment:
      DATABASE_URL: postgresql://ankr:ankr_secret@postgres:5432/ankr_universe
      REDIS_URL: redis://redis:6379

volumes:
  postgres_data:
  redis_data:
  ollama_data:
```

---

## 📋 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Set up monorepo structure
- [ ] Create database schema (Prisma)
- [ ] Build GraphQL schema
- [ ] Implement authentication
- [ ] Set up WebSocket server

### Phase 2: Conversational Engine (Week 3-4)
- [ ] Port IntentClassifier from existing code
- [ ] Port EntityExtractor from existing code
- [ ] Build ContextEngine with three-layer assembly
- [ ] Integrate SLM Router
- [ ] Implement ConversationService

### Phase 3: Frontend Core (Week 5-6)
- [ ] Build ChatInterface component
- [ ] Implement VoiceInput with Web Speech API
- [ ] Create ToolExecution visualization
- [ ] Build MemoryPanel
- [ ] Implement real-time updates (WebSocket)

### Phase 4: Showcase Features (Week 7-8)
- [ ] Build Tool Explorer with playgrounds
- [ ] Create Package Catalog
- [ ] Build Demo Gallery with flows
- [ ] Implement Pulse dashboard
- [ ] Create landing page with live demo

### Phase 5: Polish & Launch (Week 9-10)
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Error handling & recovery
- [ ] Documentation
- [ ] Deploy to production

---

## 🎯 Success Metrics

| Metric | Target |
|--------|--------|
| Conversation completion rate | > 85% |
| Voice recognition accuracy | > 90% |
| Intent classification accuracy | > 92% |
| SLM handling percentage | > 70% |
| Average response latency | < 500ms |
| Tool execution success rate | > 95% |
| User session duration | > 8 minutes |
| Demo completion rate | > 70% |

---

## Summary

This complete system design brings together:

1. **Unified Backend Gateway** - Single GraphQL + WebSocket API
2. **Conversational Intelligence** - Intent → Entity → Context → Route → Execute → Respond
3. **4-Tier SLM Routing** - EON → Deterministic → SLM → LLM (70% free)
4. **260+ MCP Tools** - All accessible via natural language
5. **11 Language Support** - Voice-first, India-optimized
6. **Memory System** - EON with 3 memory types
7. **Real-time Visualization** - See everything happening live
8. **Showcase Platform** - Tools, Packages, Demos, Products

**The result:** A platform where anyone can speak in Hindi (or 10 other languages), ask for anything, and watch the ANKR ecosystem work together to deliver results.
