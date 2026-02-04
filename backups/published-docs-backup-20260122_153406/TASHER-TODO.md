# Tasher Implementation TODO

> **Date**: 18 January 2026
> **Package**: @ankr/tasher
> **Status**: Skeleton Complete, Integration Pending
> **Goal**: Manus AI-style autonomous task execution

---

## Current Status

### Implemented (Skeleton)
- [x] BrowserAgent - Basic ReAct loop with Playwright
- [x] CoderAgent - Interface defined
- [x] DeployAgent - Interface defined
- [x] APIAgent - Interface defined
- [x] MemoryAgent - Interface defined
- [x] TaskDecomposer - Rule-based phase generation
- [x] StepExecutor - Basic execution loop
- [x] Checkpointer - Basic state saving
- [x] ErrorClassifier - Pattern matching
- [x] RecoveryPlanner - Basic strategies
- [x] Tasher orchestrator - Event-based coordination

### Missing (Critical)
- [ ] AI-powered analysis (uses heuristics, not Claude/GPT)
- [ ] VibeCoding Tools integration
- [ ] Sandbox2 integration
- [ ] EON memory integration
- [ ] Real CoderAgent implementation
- [ ] Real DeployAgent implementation

---

## Phase 1: AI Integration (Priority: P0)

### 1.1 BrowserAgent Vision API
**File**: `src/agents/browser-agent.ts`
**Status**: Uses simple heuristics, needs Claude Vision

- [ ] Add `analyzeWithVision()` using Claude Vision API
- [ ] Replace `analyzePageState()` heuristics with AI call
- [ ] Add screenshot-to-base64 for vision input
- [ ] Add multi-step reasoning output

```typescript
// TODO: Replace this
private async analyzePageState(...) {
  // Simple heuristic analysis - REPLACE WITH:
}

// WITH:
private async analyzeWithVision(screenshot: Buffer, pageState: PageState, goal: string) {
  const response = await claude.messages.create({
    model: 'claude-3-sonnet-20240229',
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/png', data: screenshot.toString('base64') } },
        { type: 'text', text: `Goal: ${goal}\nWhat element should I interact with next?` }
      ]
    }]
  });
}
```

### 1.2 TaskDecomposer AI Planning
**File**: `src/planner/task-decomposer.ts`
**Status**: Uses keyword matching, needs AI planning

- [ ] Add AI-powered goal analysis
- [ ] Generate phases using Claude/GPT
- [ ] Infer @ankr packages intelligently
- [ ] Estimate duration based on similar tasks

```typescript
// TODO: Replace rule-based with AI
async decompose(goal: TaskGoal): Promise<TaskPlan> {
  // Currently: keyword matching
  // Should: Call Claude with goal + context, get JSON plan
}
```

---

## Phase 2: Agent Implementations (Priority: P0)

### 2.1 CoderAgent
**File**: `src/agents/coder-agent.ts`
**Status**: Stub only

- [ ] Integrate `@ankr/vibecoding-tools` for code generation
- [ ] Implement `generate_schema` action
- [ ] Implement `generate_api` action (calls `generate_crud_routes`)
- [ ] Implement `generate_ui` action (calls `generate_component`)
- [ ] Implement `generate_tests` action
- [ ] Add file writing via Write tool pattern

```typescript
import { executeTool } from '@ankr/vibecoding-tools';

async execute(action: string, params: Record<string, unknown>): Promise<AgentResult> {
  switch (action) {
    case 'generate_api':
      return executeTool('generate_crud_routes', {
        resource: params.resource,
        framework: params.framework || 'fastify',
        vibe: 'modern'
      });
    // ...
  }
}
```

### 2.2 DeployAgent
**File**: `src/agents/deploy-agent.ts`
**Status**: Stub only

- [ ] Integrate `@ankr/sandbox2` for Docker deployment
- [ ] Implement `deploy_sandbox` action
- [ ] Implement `health_check` action
- [ ] Implement `promote` action (sandbox → production)
- [ ] Add deployment URL tracking

```typescript
import { runInSandbox, testInSandbox } from '@ankr/sandbox2';

async execute(action: string, params: Record<string, unknown>): Promise<AgentResult> {
  switch (action) {
    case 'deploy_sandbox':
      const result = await runInSandbox(params.sourceDir, params.appName);
      return { success: result.success, output: { url: result.url } };
    // ...
  }
}
```

### 2.3 MemoryAgent
**File**: `src/agents/memory-agent.ts`
**Status**: Stub only

- [ ] Integrate `@ankr/eon` for memory
- [ ] Implement `find_similar_goals` - search past successful patterns
- [ ] Implement `store_success` - save success patterns with embeddings
- [ ] Implement `store_failure` - track failure patterns
- [ ] Add goal embedding for similarity search

```typescript
import { remember, recall, search } from '@ankr/eon';

async execute(action: string, params: Record<string, unknown>): Promise<AgentResult> {
  switch (action) {
    case 'find_similar_goals':
      const patterns = await search({
        type: 'successful_pattern',
        similarity: { field: 'goalEmbedding', vector: await embed(params.goal) },
        limit: 5
      });
      return { success: true, output: { patterns } };
    // ...
  }
}
```

### 2.4 APIAgent
**File**: `src/agents/api-agent.ts`
**Status**: Stub only

- [ ] Integrate `@ankr/mcp-tools` for MCP tool execution
- [ ] Implement `graphql` action for GraphQL queries
- [ ] Implement `rest` action for REST API calls
- [ ] Implement `mcp` action for MCP tool invocation
- [ ] Add authentication handling (OAuth, API keys)

---

## Phase 3: Enhanced BrowserAgent (Priority: P1)

### 3.1 Multi-Tab Support
**File**: `src/agents/browser-agent.ts`

- [ ] Add `tabs: Map<string, Page>` for tab management
- [ ] Implement `openTab(name, url)` method
- [ ] Implement `switchTab(name)` method
- [ ] Implement `closeTab(name)` method
- [ ] Add cross-tab data extraction

### 3.2 Session Persistence
- [ ] Add cookie saving/loading
- [ ] Add localStorage persistence
- [ ] Support login session reuse
- [ ] Add session expiry handling

### 3.3 Form Handling
- [ ] Add dropdown selection support
- [ ] Add checkbox/radio handling
- [ ] Add file upload support
- [ ] Add CAPTCHA detection (alert user)

---

## Phase 4: RocketLang Integration (Priority: P1)

### 4.1 Agentic Mode in Composer
**File**: New integration module

- [ ] Add complexity detection in `@ankr/rocketlang-composer`
- [ ] Route complex intents to Tasher
- [ ] Pass composition plan to TaskDecomposer
- [ ] Return Tasher results to composer

```typescript
// In rocketlang-composer
async function processRocketLangIntent(input: string) {
  const intent = await parseRocketLang(input);

  if (intent.complexity === 'complex') {
    const tasher = getTasker();
    return tasher.execute({
      description: intent.goal,
      complexity: 'complex',
      requiredCapabilities: intent.features
    });
  }

  return executeComposition(intent); // Simple path
}
```

---

## Phase 5: Testing & Validation (Priority: P1)

### 5.1 Unit Tests
- [ ] BrowserAgent tests (mock Playwright)
- [ ] TaskDecomposer tests
- [ ] ErrorClassifier tests
- [ ] RecoveryPlanner tests
- [ ] Checkpointer tests

### 5.2 Integration Tests
- [ ] Full task execution flow
- [ ] Agent coordination tests
- [ ] Recovery scenario tests
- [ ] Checkpoint/resume tests

### 5.3 End-to-End Demo
- [ ] "Build a todo app with auth" demo
- [ ] "Build e-commerce with Razorpay" demo
- [ ] Record demo video
- [ ] Measure tokens, time, success rate

---

## Phase 6: Production Readiness (Priority: P2)

### 6.1 Error Handling
- [ ] Add comprehensive error boundaries
- [ ] Implement graceful degradation
- [ ] Add human escalation flow
- [ ] Add task abortion handling

### 6.2 Observability
- [ ] Add structured logging
- [ ] Add metrics (steps, duration, tokens)
- [ ] Integrate with @ankr/pulse
- [ ] Add progress events for UI

### 6.3 Security
- [ ] Sandbox file system access
- [ ] Limit network access
- [ ] Add resource limits (tokens, time)
- [ ] Audit sensitive operations

---

## Files to Modify

| File | Priority | Changes |
|------|----------|---------|
| `src/agents/browser-agent.ts` | P0 | Add Vision API |
| `src/agents/coder-agent.ts` | P0 | Integrate vibecoding-tools |
| `src/agents/deploy-agent.ts` | P0 | Integrate sandbox2 |
| `src/agents/memory-agent.ts` | P0 | Integrate EON |
| `src/agents/api-agent.ts` | P0 | Integrate MCP tools |
| `src/planner/task-decomposer.ts` | P0 | Add AI planning |
| `src/orchestrator/tasher.ts` | P1 | Add progress events |
| `package.json` | P0 | Add peer dependencies |

---

## Dependencies to Add

```json
{
  "peerDependencies": {
    "@ankr/vibecoding-tools": ">=1.0.0",
    "@ankr/sandbox2": ">=1.0.0",
    "@ankr/eon": ">=3.0.0",
    "@ankr/ai-router": ">=2.0.0",
    "@ankr/mcp-tools": ">=1.0.0"
  }
}
```

---

## Success Criteria

1. **Demo 1**: `tasher.execute({ description: "Build a todo app" })`
   - Generates working React + Fastify app
   - Deploys to sandbox
   - Returns accessible URL

2. **Demo 2**: `tasher.execute({ description: "E-commerce with Razorpay" })`
   - Uses @ankr/eshop, @ankr/razorpay packages
   - Handles complex multi-step generation
   - Self-heals from errors

3. **Metrics**:
   - Task success rate > 80%
   - Average completion time < 5 minutes
   - Token usage optimized (< 50k per task)

---

## Immediate Next Steps

1. [ ] Implement CoderAgent with vibecoding-tools
2. [ ] Implement DeployAgent with sandbox2
3. [ ] Add AI to TaskDecomposer
4. [ ] Run first end-to-end test
5. [ ] Document findings

---

*Created: 18 January 2026*
*Last Updated: 18 January 2026*
