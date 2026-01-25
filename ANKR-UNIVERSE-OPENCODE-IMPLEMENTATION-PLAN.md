# ANKR Universe × OpenCode IDE - Implementation Plan

**Project:** OpenCode IDE Integration into ANKR Universe
**Duration:** 4 weeks
**Team Size:** 1-2 developers
**Start Date:** TBD
**Status:** Planning

---

## Executive Summary

This plan outlines the integration of OpenCode (OSS AI coding assistant, MIT license) into ANKR Universe as a developer-facing IDE. The IDE will provide interactive exploration of 755 ANKR tools, live execution with cost transparency, multi-language support, and voice-to-code capabilities.

**Key Value Propositions:**
- **For Developers:** Discover, test, and integrate 755 ANKR tools from IDE
- **For ANKR:** Developer onboarding funnel (try → integrate → pay)
- **For Users:** Code in Hindi/regional languages with voice support

---

## Strategic Fit

### Why OpenCode?
1. **OSS Foundation** - MIT license, no vendor lock-in
2. **MCP Native** - Already supports Model Context Protocol
3. **Plugin Architecture** - Easy to extend with ANKR-specific features
4. **Production Ready** - Used by developers globally
5. **Web + TUI** - Flexible deployment options

### Integration Points

```
┌─────────────────────────────────────────────────────────┐
│  ANKR Universe (Existing)                               │
│  ├── Gateway (Fastify + GraphQL)     ✅                 │
│  ├── Tool Registry (755 tools)       ✅                 │
│  ├── Orchestration (Planner/Runner)  ✅                 │
│  ├── EON Memory                       ✅                 │
│  ├── BANI Voice                       ✅                 │
│  └── SLM Router                       ✅                 │
└─────────────────────────────────────────────────────────┘
                    ↓ NEW INTEGRATION
┌─────────────────────────────────────────────────────────┐
│  OpenCode IDE (NEW)                                     │
│  ├── Headless Server (port 7777)     🆕                 │
│  ├── ANKR Plugin Bridge               🆕                 │
│  ├── GraphQL IDE Schema               🆕                 │
│  └── IDE Frontend (React)             🆕                 │
└─────────────────────────────────────────────────────────┘
```

---

## Week-by-Week Breakdown

### **Week 1: Core Integration & Spike**

#### Days 1-2: OpenCode Server Setup
**Tasks:**
- [ ] Add OpenCode dependencies to gateway
- [ ] Create `@ankr-universe/opencode-bridge` package
- [ ] Start OpenCode in headless mode
- [ ] Connect via SDK client
- [ ] Test basic session creation

**Deliverable:** OpenCode server running and accessible via API

#### Days 3-4: Plugin Bridge (Spike with 1 Tool)
**Tasks:**
- [ ] Implement ANKR plugin scaffolding
- [ ] Convert 1 tool manifest → OpenCode tool definition
- [ ] Test tool execution through plugin
- [ ] Verify cost tracking works
- [ ] Add basic logging

**Deliverable:** GST Calculator tool executable via OpenCode

#### Day 5: GraphQL Schema Design
**Tasks:**
- [ ] Design IDE-specific GraphQL schema
- [ ] Add queries (ideToolCatalog, ideToolDocs)
- [ ] Add mutations (ideCreateSession, ideSendMessage)
- [ ] Add subscriptions (ideExecutionStream)
- [ ] Document schema

**Deliverable:** GraphQL schema file ready for implementation

---

### **Week 2: Full Integration & UI Foundation**

#### Days 6-7: Complete Plugin Bridge
**Tasks:**
- [ ] Implement tool manifest → OpenCode converter
- [ ] Add all 755 tools to registry
- [ ] Implement hooks:
  - `tool.execute.before` (validation)
  - `tool.execute.after` (EON logging)
  - `chat.params` (SLM routing)
  - `permission.ask` (auto-approve safe tools)
- [ ] Test with 10 representative tools

**Deliverable:** All 755 tools accessible via OpenCode

#### Days 8-9: GraphQL Resolvers
**Tasks:**
- [ ] Implement IDE query resolvers
- [ ] Implement IDE mutation resolvers
- [ ] Implement IDE subscription resolvers
- [ ] Add OpencodeService to gateway context
- [ ] Test all endpoints with GraphQL Playground

**Deliverable:** Functional GraphQL API for IDE

#### Day 10: Frontend Scaffold
**Tasks:**
- [ ] Create `/apps/web/src/pages/IDE.tsx`
- [ ] Add route to router
- [ ] Create basic layout (3-column)
- [ ] Set up Apollo GraphQL queries
- [ ] Test data fetching

**Deliverable:** Basic IDE page loading

---

### **Week 3: Feature Development & Polish**

#### Days 11-12: Tool Explorer Component
**Tasks:**
- [ ] Build tool search with fuzzy matching
- [ ] Add category filters (GST, Banking, Logistics, etc.)
- [ ] Display tool cards with metadata
- [ ] Show cost/latency badges
- [ ] Implement tool detail modal
- [ ] Add "Try it" button

**Deliverable:** Functional tool browser

#### Days 13-14: Code Editor Integration
**Tasks:**
- [ ] Integrate Monaco Editor
- [ ] Add syntax highlighting for TypeScript
- [ ] Add tool auto-completion
- [ ] Implement "Execute" button
- [ ] Show execution progress
- [ ] Display results in output panel

**Deliverable:** Working code editor with execution

#### Day 15: Cost Tracker & Metrics
**Tasks:**
- [ ] Create CostTracker component
- [ ] Display SLM vs LLM breakdown
- [ ] Show savings calculation
- [ ] Add cost chart (Recharts)
- [ ] Real-time updates via subscription

**Deliverable:** Cost transparency UI

---

### **Week 4: ANKR Enhancements & Launch**

#### Days 16-17: Voice Integration (BANI)
**Tasks:**
- [ ] Add voice recording component
- [ ] Integrate BANI STT API
- [ ] Convert voice → code intent
- [ ] Insert code into editor
- [ ] Test with Hindi voice input
- [ ] Add language selector (11 languages)

**Deliverable:** Voice-to-code working

#### Day 18: Memory Integration (EON)
**Tasks:**
- [ ] Implement EON memory hook
- [ ] Remember frequently used tools
- [ ] Auto-suggest based on patterns
- [ ] Show "Recently Used" section
- [ ] Add snippet saving

**Deliverable:** Smart memory features

#### Day 19: Testing & Bug Fixes
**Tasks:**
- [ ] Write unit tests for plugin bridge
- [ ] Write integration tests for GraphQL
- [ ] E2E test for tool execution flow
- [ ] Fix critical bugs
- [ ] Performance optimization

**Deliverable:** Stable, tested codebase

#### Day 20: Documentation & Deployment
**Tasks:**
- [ ] Write IDE user guide
- [ ] Document plugin architecture
- [ ] Create demo video (5 min)
- [ ] Update service manager script
- [ ] Deploy to staging
- [ ] Final QA

**Deliverable:** Production-ready IDE

---

## Technical Architecture

### Package Structure

```
ankr-universe/
├── apps/
│   ├── gateway/
│   │   └── src/
│   │       ├── services/
│   │       │   └── opencode.service.ts        🆕
│   │       ├── resolvers/
│   │       │   └── ide.resolver.ts            🆕
│   │       └── schema/
│   │           └── ide.ts                     🆕
│   │
│   └── web/
│       └── src/
│           ├── pages/
│           │   └── IDE.tsx                    🆕
│           └── components/
│               ├── MonacoEditor.tsx           🆕
│               ├── ToolExplorer.tsx           🆕
│               ├── ExecutionViewer.tsx        🆕
│               └── CostTracker.tsx            🆕
│
└── packages/
    ├── integrations/
    │   └── opencode-bridge/                   🆕
    │       ├── src/
    │       │   ├── index.ts
    │       │   ├── plugin.ts
    │       │   ├── converter.ts
    │       │   ├── hooks/
    │       │   │   ├── tool-execution.ts
    │       │   │   ├── cost-tracking.ts
    │       │   │   ├── memory.ts
    │       │   │   └── voice.ts
    │       │   └── types.ts
    │       ├── package.json
    │       └── tsconfig.json
    │
    └── db/
        └── prisma/
            └── schema.prisma                   (add IDESession, IDESnippet models)
```

### New Dependencies

```json
{
  "dependencies": {
    "@opencode-ai/sdk": "^1.1.34",
    "@opencode-ai/plugin": "^1.1.34",
    "monaco-editor": "^0.45.0",
    "@monaco-editor/react": "^4.6.0",
    "recharts": "^2.10.0"
  }
}
```

### Database Schema Extensions

```prisma
model IDESession {
  id          String   @id @default(cuid())
  userId      String
  projectName String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  totalCost   Float    @default(0)
  slmCalls    Int      @default(0)
  llmCalls    Int      @default(0)

  messages    IDEMessage[]
  snippets    IDESnippet[]

  @@index([userId])
}

model IDEMessage {
  id        String   @id @default(cuid())
  sessionId String
  role      String   // 'user' | 'assistant' | 'system'
  content   String   @db.Text
  createdAt DateTime @default(now())

  session   IDESession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
}

model IDESnippet {
  id        String   @id @default(cuid())
  sessionId String
  code      String   @db.Text
  language  String
  toolId    String?
  createdAt DateTime @default(now())

  session   IDESession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
}
```

---

## Key Components

### 1. OpencodeService (Backend)

```typescript
// apps/gateway/src/services/opencode.service.ts
export class OpencodeService {
  private server: ChildProcess;
  private client: ReturnType<typeof createOpencodeClient>;

  async start(): Promise<void>
  async stop(): Promise<void>
  async createSession(projectPath: string): Promise<Session>
  async sendMessage(sessionID: string, message: string): Promise<MessageResult>
  async executeToolDirect(toolId: string, inputs: any): Promise<ExecutionResult>
}
```

### 2. ANKR Plugin (Bridge)

```typescript
// packages/integrations/opencode-bridge/src/plugin.ts
export const ankrPlugin: Plugin = async (input: PluginInput): Promise<Hooks> => {
  return {
    // Convert 755 ANKR tools → OpenCode tools
    tool: convertAllTools(),

    // Route execution through ANKR orchestration
    'tool.execute.before': validateAndEstimateCost,
    'tool.execute.after': logToEONAndTrackCost,

    // Use SLM-first routing
    'chat.params': applySLMRouting,

    // Auto-approve safe operations
    'permission.ask': autoApproveReadOnly,

    // Multi-language support
    'experimental.chat.messages.transform': translateIfNeeded
  };
};
```

### 3. IDE Resolvers (GraphQL)

```typescript
// apps/gateway/src/resolvers/ide.resolver.ts
export const ideResolvers = {
  Query: {
    ideToolCatalog: (_, { category, search }) => toolRegistry.search(...),
    ideToolDocs: (_, { toolId }) => toolRegistry.getDocumentation(toolId)
  },

  Mutation: {
    ideCreateSession: async (_, { projectName }, ctx) => {
      const session = await ctx.opencodeService.createSession(projectName);
      return ctx.prisma.ideSession.create({ data: session });
    },

    ideSendMessage: async (_, { sessionID, message }, ctx) => {
      return ctx.opencodeService.sendMessage(sessionID, message);
    },

    ideExecuteTool: async (_, { toolId, inputs }, ctx) => {
      return ctx.runner.execute({ toolId, inputs });
    }
  },

  Subscription: {
    ideExecutionStream: {
      subscribe: (_, { sessionID }, ctx) => {
        return ctx.pubsub.asyncIterator(`IDE_EXECUTION_${sessionID}`);
      }
    }
  }
};
```

### 4. Frontend IDE Page

```tsx
// apps/web/src/pages/IDE.tsx
export default function IDEPage() {
  const [sessionID, setSessionID] = useState<string | null>(null);

  return (
    <div className="flex h-screen">
      {/* Left: Tool Explorer */}
      <ToolExplorer onToolSelect={insertToolExample} />

      {/* Center: Monaco Editor */}
      <div className="flex-1 flex flex-col">
        <MonacoEditor onExecute={executeCode} />
        <ExecutionViewer sessionID={sessionID} />
      </div>

      {/* Right: Cost Tracker */}
      <CostTracker sessionID={sessionID} />
    </div>
  );
}
```

---

## Testing Strategy

### Unit Tests (80+ coverage)
- [ ] Tool manifest converter
- [ ] Plugin hooks
- [ ] GraphQL resolvers
- [ ] OpencodeService methods

### Integration Tests
- [ ] OpenCode server startup/shutdown
- [ ] Tool execution end-to-end
- [ ] GraphQL API workflows
- [ ] WebSocket subscriptions

### E2E Tests (Playwright)
- [ ] Create IDE session
- [ ] Search for tool
- [ ] Execute tool from playground
- [ ] View cost breakdown
- [ ] Save snippet

---

## Performance Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| IDE page load | < 2s | Good UX |
| Tool search | < 300ms | Real-time feel |
| Tool execution | < 5s | Depends on tool |
| Cost calculation | < 100ms | Instant feedback |
| WebSocket latency | < 50ms | Real-time updates |

---

## Monitoring & Observability

### Metrics to Track
- IDE session creation rate
- Tool execution success/failure rate
- Average cost per session
- SLM vs LLM routing distribution
- Most used tools (top 10)
- User retention (daily active)

### Alerts
- OpenCode server down
- High error rate (> 5%)
- Cost anomaly (> 2x expected)
- Latency spike (> 10s)

---

## Rollout Plan

### Phase 1: Internal Alpha (Week 1-2)
- Deploy to staging
- Test with ANKR team (5 people)
- Gather feedback
- Fix critical bugs

### Phase 2: Closed Beta (Week 3)
- Invite 20 external developers
- Monitor usage closely
- Iterate based on feedback
- Add missing features

### Phase 3: Public Launch (Week 4)
- Deploy to production
- Announce on social media
- Write blog post
- Monitor analytics

---

## Success Metrics (3 months post-launch)

| Metric | Target | Stretch |
|--------|--------|---------|
| IDE sessions created | 500+ | 1000+ |
| Tools executed | 2000+ | 5000+ |
| Developers retained (D7) | 30% | 50% |
| Conversion to paid | 5% | 10% |
| Average cost savings shown | ₹100+ | ₹500+ |

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| OpenCode performance issues | High | Medium | Load test early, optimize |
| Tool execution security | Critical | Low | Sandbox, rate limiting |
| Cost tracking inaccurate | High | Medium | Extensive testing |
| Poor UX adoption | High | Medium | User testing, iteration |
| OpenCode project abandoned | High | Low | OSS fallback, MIT license |

---

## Budget

### Development Cost
- 1 Senior Developer × 4 weeks = **₹160,000**
- 1 Junior Developer × 2 weeks = **₹30,000**
- **Total Development:** ₹190,000

### Infrastructure (per month)
- OpenCode server (2GB RAM) = ₹1,500
- PostgreSQL storage = ₹500
- CDN for IDE assets = ₹300
- **Total Monthly:** ₹2,300

### External Services (per month)
- BANI STT/TTS = ₹2,000
- Groq/OpenAI fallback = ₹1,000
- **Total Monthly:** ₹3,000

**Total First Year Cost:** ₹190,000 + (₹5,300 × 12) = **₹253,600**

---

## Dependencies

### Critical Path
1. OpenCode server must be stable
2. Tool Registry must have all 755 manifests
3. Orchestration layer (Planner/Runner) must be functional
4. GraphQL API must be performant

### External Dependencies
- OpenCode project (OSS, active)
- BANI API (for voice)
- EON memory (for smart features)
- SLM Router (for cost optimization)

---

## Team Roles

### Senior Developer (Fullstack)
- OpenCode integration
- Plugin bridge development
- GraphQL schema & resolvers
- Frontend architecture

### Junior Developer (Frontend)
- UI components
- Monaco Editor integration
- Testing
- Documentation

### DevOps (Part-time)
- Deployment automation
- Monitoring setup
- Performance tuning

---

## Next Steps (Immediate)

1. **Approval** - Get stakeholder sign-off on plan
2. **Spike** - 2-day spike to validate OpenCode integration
3. **Kickoff** - Schedule Week 1 start date
4. **Dependencies** - Ensure Tool Registry has manifests ready
5. **Design** - Finalize UI mockups with designer

---

## Appendix

### Useful Links
- OpenCode GitHub: https://github.com/opencode-ai/opencode
- ANKR Universe TODO: `/root/ankr-universe/COMPREHENSIVE-TODO-V2.md`
- Integration Design: `/root/ANKR-UNIVERSE-OPENCODE-INTEGRATION.md`

### Related Documents
- ANKR Universe Architecture
- Tool Registry Specification
- Orchestration Layer Design
- GraphQL API Documentation

---

**Plan Version:** 1.0
**Last Updated:** 2026-01-24
**Owner:** ANKR Universe Team
