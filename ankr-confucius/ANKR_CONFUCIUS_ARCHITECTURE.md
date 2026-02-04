# ANKR-EON Enhanced Architecture
## Inspired by Confucius Code Agent: A Practical Implementation for Logistics AI

**Version**: 1.0.0  
**Author**: ANKR Labs  
**Philosophy**: Made in India, Indic First, For the World  

---

## Executive Summary

This document outlines how ANKR Labs can integrate key architectural patterns from Meta/Harvard's Confucius Code Agent into the existing ankr-eon memory system and agent infrastructure. The goal is to enhance WowTruck 2.0 and related logistics agents with production-grade scaffolding that will outperform raw model capability improvements.

**Key Insight from Research**: Claude 4.5 Sonnet with strong scaffolding (52.7%) outperformed Claude 4.5 Opus with weaker scaffolding (52.0%). This validates ANKR's approach—invest in architecture, not just bigger models.

---

## 1. Core Architecture Mapping

### 1.1 Confucius SDK → ANKR-EON Mapping

| Confucius Component | ANKR-EON Equivalent | Enhancement Needed |
|---------------------|--------------------|--------------------|
| Agent Experience (AX) | ankr-eon episodic/semantic memory | Add hierarchical working memory |
| User Experience (UX) | WowTruck UI/SUNOKAHOBOLO voice | Add readable traces, streaming diffs |
| Developer Experience (DX) | LLMBox routing, MCP tools | Add observability, config debugging |
| Hierarchical Working Memory | PostgreSQL + pgvector | Add scope partitioning, compression |
| Note-Taking System | (New) | Implement persistent markdown notes |
| Extension System | Universal Agent Templates | Add typed callbacks, state management |
| Meta-Agent | (New) | Implement build-test-improve loop |

### 1.2 Three-Axis Design for Logistics

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANKR Agent Platform                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│  │     AX      │   │     UX      │   │     DX      │          │
│  │   Agent     │   │    User     │   │  Developer  │          │
│  │ Experience  │   │ Experience  │   │ Experience  │          │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘          │
│         │                 │                 │                  │
│         ▼                 ▼                 ▼                  │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│  │ What agent  │   │ What truck  │   │ What devs   │          │
│  │ sees:       │   │ drivers see:│   │ see:        │          │
│  │ • Memory    │   │ • Voice UI  │   │ • Traces    │          │
│  │ • Context   │   │ • Status    │   │ • Metrics   │          │
│  │ • Tools     │   │ • Actions   │   │ • Configs   │          │
│  └─────────────┘   └─────────────┘   └─────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Hierarchical Working Memory Implementation

### 2.1 Memory Architecture

The Confucius SDK maintains hierarchical working memory that partitions trajectories into scopes. For ANKR-EON, this translates to:

```typescript
// packages/ankr-eon/src/memory/hierarchical.ts

interface MemoryScope {
  id: string;
  type: 'session' | 'task' | 'subtask' | 'action';
  parent_id: string | null;
  created_at: Date;
  summary: string | null;
  compressed: boolean;
  artifacts: Artifact[];
  decisions: Decision[];
  errors: ErrorLog[];
  open_todos: Todo[];
}

interface HierarchicalMemory {
  scopes: Map<string, MemoryScope>;
  active_scope: string;
  compression_threshold: number; // tokens before triggering compression
  retention_window: number; // recent interactions to keep uncompressed
}
```

### 2.2 PostgreSQL Schema Extension

```sql
-- Add to ankr-eon schema

CREATE TABLE memory_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id),
    scope_type VARCHAR(20) NOT NULL,
    parent_scope_id UUID REFERENCES memory_scopes(id),
    summary TEXT,
    compressed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE scope_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope_id UUID REFERENCES memory_scopes(id),
    artifact_type VARCHAR(50) NOT NULL, -- 'patch', 'error_log', 'decision', 'todo'
    content JSONB NOT NULL,
    importance_score FLOAT DEFAULT 0.5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast hierarchical queries
CREATE INDEX idx_scopes_parent ON memory_scopes(parent_scope_id);
CREATE INDEX idx_scopes_session ON memory_scopes(session_id);
CREATE INDEX idx_artifacts_type ON scope_artifacts(artifact_type);
```

### 2.3 Context Compression (Architect Agent)

When context approaches limits, trigger the Architect agent to compress:

```typescript
// packages/ankr-eon/src/agents/architect.ts

interface CompressionResult {
  goals: string[];
  key_decisions: Decision[];
  errors_encountered: ErrorLog[];
  open_todos: Todo[];
  compressed_token_count: number;
}

async function compressScope(
  scope: MemoryScope,
  llm: LLMProvider
): Promise<CompressionResult> {
  const prompt = `
You are the Architect agent. Compress this execution history into a structured summary.

SCOPE CONTENT:
${JSON.stringify(scope)}

Extract and return JSON with:
1. goals: High-level objectives being pursued
2. key_decisions: Important choices made and rationale
3. errors_encountered: Failures with resolution status
4. open_todos: Incomplete tasks requiring attention

Keep essential context for future reasoning. Discard verbose logs.
`;

  const result = await llm.complete(prompt);
  return JSON.parse(result);
}
```

---

## 3. Persistent Note-Taking System

### 3.1 Note Structure

The Confucius SDK uses a dedicated agent to write structured Markdown notes. For ANKR:

```
/notes/
├── sessions/
│   └── {session_id}/
│       ├── project/
│       │   └── architecture.md
│       ├── research/
│       │   └── findings.md
│       └── solutions/
│           └── bug_fix.md
├── hindsight/
│   ├── failures/
│   │   ├── by_error_type/
│   │   └── by_component/
│   └── successes/
│       └── strategies/
└── domain/
    ├── tms/
    │   └── routing_patterns.md
    ├── wms/
    │   └── inventory_rules.md
    └── oms/
        └── order_lifecycle.md
```

### 3.2 Note-Taking Agent

```typescript
// packages/ankr-eon/src/agents/note-taker.ts

interface Note {
  id: string;
  path: string;
  title: string;
  content: string;
  tags: string[];
  linked_sessions: string[];
  created_at: Date;
  updated_at: Date;
}

interface HindsightNote extends Note {
  error_type: string;
  error_message: string;
  stack_trace?: string;
  affected_components: string[];
  resolution: string | null;
  abandoned_reason?: string;
}

class NoteTakingAgent {
  constructor(
    private llm: LLMProvider,
    private storage: NoteStorage
  ) {}

  async distillSession(sessionId: string, trajectory: Trajectory): Promise<Note[]> {
    const notes: Note[] = [];

    // Generate strategy notes
    const strategyNote = await this.extractStrategies(trajectory);
    if (strategyNote) notes.push(strategyNote);

    // Generate hindsight notes for failures
    const failures = trajectory.events.filter(e => e.type === 'error');
    for (const failure of failures) {
      const hindsightNote = await this.createHindsightNote(failure, trajectory);
      notes.push(hindsightNote);
    }

    // Store all notes
    for (const note of notes) {
      await this.storage.save(note);
    }

    return notes;
  }

  private async createHindsightNote(
    failure: ErrorEvent,
    trajectory: Trajectory
  ): Promise<HindsightNote> {
    const prompt = `
Analyze this failure and create a hindsight note for future reference.

ERROR:
${JSON.stringify(failure)}

CONTEXT:
${trajectory.summary}

Create a note with:
1. What went wrong (error classification)
2. Why it happened (root cause)
3. How it was resolved (if applicable)
4. What to try if this happens again
`;

    const analysis = await this.llm.complete(prompt);
    return {
      id: generateId(),
      path: `hindsight/failures/by_error_type/${failure.type}.md`,
      title: `Failure: ${failure.message.substring(0, 50)}`,
      content: analysis,
      tags: ['failure', failure.type, ...failure.components],
      linked_sessions: [trajectory.sessionId],
      error_type: failure.type,
      error_message: failure.message,
      stack_trace: failure.stack,
      affected_components: failure.components,
      resolution: failure.resolution || null,
      created_at: new Date(),
      updated_at: new Date()
    };
  }
}
```

### 3.3 Note Retrieval for New Sessions

```typescript
// Pre-populate memory with relevant notes at session start

async function loadRelevantNotes(
  context: SessionContext,
  noteStorage: NoteStorage
): Promise<Note[]> {
  const notes: Note[] = [];

  // Load domain-specific notes
  if (context.domain === 'tms') {
    notes.push(...await noteStorage.getByPath('domain/tms/'));
  }

  // Load relevant hindsight notes based on similar past errors
  if (context.recentErrors?.length) {
    for (const error of context.recentErrors) {
      const related = await noteStorage.findByErrorType(error.type);
      notes.push(...related);
    }
  }

  // Load notes from similar past sessions (semantic search)
  const similarNotes = await noteStorage.semanticSearch(
    context.taskDescription,
    { limit: 10 }
  );
  notes.push(...similarNotes);

  return deduplicateNotes(notes);
}
```

---

## 4. Extension System (Tool Modules)

### 4.1 Extension Interface

```typescript
// packages/ankr-eon/src/extensions/base.ts

interface ExtensionCallbacks {
  on_input_messages?: (messages: Message[], context: RunContext) => Message[];
  on_plain_text?: (text: string, context: RunContext) => void;
  on_tag?: (tag: string, content: string, context: RunContext) => Action[];
  on_llm_output?: (output: LLMOutput, context: RunContext) => void;
}

interface Extension {
  name: string;
  version: string;
  callbacks: ExtensionCallbacks;
  state: Map<string, any>;
  
  initialize(context: RunContext): Promise<void>;
  cleanup(): Promise<void>;
}

interface RunContext {
  io: IOInterface;
  sessionStorage: Map<string, any>;
  hierarchicalMemory: HierarchicalMemory;
  artifactStore: ArtifactStore;
  noteStorage: NoteStorage;
}
```

### 4.2 Logistics-Specific Extensions

```typescript
// packages/ankr-eon/src/extensions/logistics/

// Route Optimization Extension
class RouteOptimizationExtension implements Extension {
  name = 'route_optimization';
  version = '1.0.0';
  state = new Map();

  callbacks: ExtensionCallbacks = {
    on_tag: async (tag, content, context) => {
      if (tag === 'optimize_route') {
        const params = JSON.parse(content);
        const optimizedRoute = await this.optimize(params);
        return [{
          type: 'route_result',
          data: optimizedRoute
        }];
      }
      return [];
    }
  };

  private async optimize(params: RouteParams): Promise<Route> {
    // Integration with existing WowTruck routing
  }
}

// Inventory Management Extension
class InventoryExtension implements Extension {
  name = 'inventory_management';
  version = '1.0.0';
  state = new Map();

  callbacks: ExtensionCallbacks = {
    on_tag: async (tag, content, context) => {
      if (tag === 'check_inventory') {
        const { sku, warehouse } = JSON.parse(content);
        const stock = await this.checkStock(sku, warehouse);
        return [{
          type: 'inventory_result',
          data: stock
        }];
      }
      return [];
    }
  };
}

// Voice Interface Extension (SUNOKAHOBOLO)
class VoiceExtension implements Extension {
  name = 'voice_interface';
  version = '1.0.0';
  state = new Map();
  
  supportedLanguages = ['hi', 'ta', 'te', 'en'];

  callbacks: ExtensionCallbacks = {
    on_llm_output: async (output, context) => {
      if (context.sessionStorage.get('voice_enabled')) {
        await this.speakResponse(output.text, context);
      }
    }
  };

  private async speakResponse(text: string, context: RunContext) {
    const lang = context.sessionStorage.get('language') || 'hi';
    // TTS integration
  }
}
```

### 4.3 Extension Registry

```typescript
// packages/ankr-eon/src/extensions/registry.ts

class ExtensionRegistry {
  private extensions: Map<string, Extension> = new Map();
  private executionOrder: string[] = [];

  register(extension: Extension, order?: number) {
    this.extensions.set(extension.name, extension);
    if (order !== undefined) {
      this.executionOrder.splice(order, 0, extension.name);
    } else {
      this.executionOrder.push(extension.name);
    }
  }

  async executeCallbacks(
    callbackType: keyof ExtensionCallbacks,
    ...args: any[]
  ): Promise<any[]> {
    const results = [];
    for (const name of this.executionOrder) {
      const ext = this.extensions.get(name);
      const callback = ext?.callbacks[callbackType];
      if (callback) {
        const result = await callback(...args);
        if (result) results.push(result);
      }
    }
    return results.flat();
  }
}
```

---

## 5. Meta-Agent for Automatic Configuration

### 5.1 Build-Test-Improve Loop

```typescript
// packages/ankr-eon/src/meta-agent/optimizer.ts

interface AgentConfig {
  prompts: Map<string, string>;
  extensions: string[];
  memorySettings: MemoryConfig;
  toolPolicies: ToolPolicy[];
}

interface EvaluationResult {
  taskId: string;
  success: boolean;
  turns: number;
  tokenUsage: number;
  errors: string[];
  trace: ExecutionTrace;
}

class MetaAgent {
  constructor(
    private llm: LLMProvider,
    private evaluator: Evaluator
  ) {}

  async optimizeConfig(
    baseConfig: AgentConfig,
    testTasks: Task[],
    iterations: number = 5
  ): Promise<AgentConfig> {
    let currentConfig = { ...baseConfig };
    let bestScore = 0;
    let bestConfig = currentConfig;

    for (let i = 0; i < iterations; i++) {
      // Run evaluation
      const results = await this.evaluateConfig(currentConfig, testTasks);
      const score = this.calculateScore(results);

      if (score > bestScore) {
        bestScore = score;
        bestConfig = { ...currentConfig };
      }

      // Analyze failures and propose improvements
      const failures = results.filter(r => !r.success);
      if (failures.length > 0) {
        currentConfig = await this.proposeImprovements(
          currentConfig,
          failures
        );
      }

      console.log(`Iteration ${i + 1}: Score = ${score}`);
    }

    return bestConfig;
  }

  private async proposeImprovements(
    config: AgentConfig,
    failures: EvaluationResult[]
  ): Promise<AgentConfig> {
    const prompt = `
You are a meta-agent optimizing an AI agent configuration.

CURRENT CONFIG:
${JSON.stringify(config, null, 2)}

FAILURES:
${failures.map(f => `Task: ${f.taskId}
Errors: ${f.errors.join(', ')}
Trace: ${JSON.stringify(f.trace)}`).join('\n\n')}

Analyze the failures and propose specific improvements to:
1. Prompts (be specific about which prompt and what change)
2. Extension ordering or parameters
3. Memory settings (compression thresholds, retention)
4. Tool policies (when to use which tool)

Return JSON with the improved configuration.
`;

    const response = await this.llm.complete(prompt);
    return JSON.parse(response);
  }

  private calculateScore(results: EvaluationResult[]): number {
    const successRate = results.filter(r => r.success).length / results.length;
    const avgTurns = results.reduce((a, r) => a + r.turns, 0) / results.length;
    const avgTokens = results.reduce((a, r) => a + r.tokenUsage, 0) / results.length;

    // Weighted score: prioritize success, then efficiency
    return (successRate * 0.6) + 
           ((1 - avgTurns / 100) * 0.2) + 
           ((1 - avgTokens / 100000) * 0.2);
  }
}
```

### 5.2 Task-Specific Agent Generation

```typescript
// Generate specialized agents for different logistics domains

async function generateDomainAgent(
  domain: 'tms' | 'wms' | 'oms',
  metaAgent: MetaAgent,
  baseConfig: AgentConfig
): Promise<AgentConfig> {
  const domainTasks = await loadDomainTestTasks(domain);
  
  // Customize base config for domain
  const domainConfig: AgentConfig = {
    ...baseConfig,
    prompts: new Map([
      ...baseConfig.prompts,
      ['system', getDomainSystemPrompt(domain)]
    ]),
    extensions: [
      ...baseConfig.extensions,
      ...getDomainExtensions(domain)
    ]
  };

  // Optimize for domain-specific tasks
  return metaAgent.optimizeConfig(domainConfig, domainTasks, 10);
}
```

---

## 6. Unified Orchestrator

### 6.1 Main Execution Loop

```typescript
// packages/ankr-eon/src/orchestrator/main.ts

class ANKROrchestrator {
  constructor(
    private llm: LLMProvider,
    private extensionRegistry: ExtensionRegistry,
    private memory: HierarchicalMemory,
    private noteStorage: NoteStorage
  ) {}

  async run(task: Task, context: RunContext): Promise<OrchestratorResult> {
    // Initialize scope for this task
    const taskScope = await this.memory.createScope('task', task.id);
    
    // Load relevant notes
    const notes = await loadRelevantNotes(
      { domain: task.domain, taskDescription: task.description },
      this.noteStorage
    );
    context.sessionStorage.set('loaded_notes', notes);

    let iteration = 0;
    const maxIterations = 100;

    while (iteration < maxIterations) {
      // Build context with memory compression if needed
      const contextMessages = await this.buildContext(taskScope, context);

      // Pre-process through extensions
      const processedMessages = await this.extensionRegistry.executeCallbacks(
        'on_input_messages',
        contextMessages,
        context
      );

      // Call LLM
      const llmOutput = await this.llm.complete(processedMessages);

      // Post-process through extensions
      await this.extensionRegistry.executeCallbacks(
        'on_llm_output',
        llmOutput,
        context
      );

      // Parse and execute actions
      const actions = await this.parseActions(llmOutput);
      
      if (actions.length === 0) {
        // No more actions = task complete
        break;
      }

      for (const action of actions) {
        const result = await this.executeAction(action, context);
        await this.memory.recordArtifact(taskScope.id, {
          type: 'action_result',
          action: action,
          result: result
        });

        // Check for continuation signal from extensions
        if (result.requestContinuation) {
          continue;
        }
      }

      // Check context size and compress if needed
      if (await this.shouldCompress(taskScope)) {
        await this.compressOlderScopes(taskScope);
      }

      iteration++;
    }

    // Generate session notes asynchronously
    this.generateSessionNotes(taskScope, context).catch(console.error);

    return {
      success: true,
      iterations: iteration,
      artifacts: await this.memory.getArtifacts(taskScope.id)
    };
  }

  private async shouldCompress(scope: MemoryScope): Promise<boolean> {
    const tokenCount = await this.estimateTokens(scope);
    return tokenCount > this.memory.compression_threshold;
  }

  private async compressOlderScopes(currentScope: MemoryScope): Promise<void> {
    const olderScopes = await this.memory.getScopesOlderThan(
      currentScope.id,
      this.memory.retention_window
    );

    for (const scope of olderScopes) {
      if (!scope.compressed) {
        const compressed = await compressScope(scope, this.llm);
        await this.memory.updateScope(scope.id, {
          summary: JSON.stringify(compressed),
          compressed: true
        });
      }
    }
  }
}
```

---

## 7. Integration with Existing ANKR Systems

### 7.1 WowTruck 2.0 Integration

```typescript
// apps/wowtruck/src/agents/dispatcher.ts

import { ANKROrchestrator } from '@ankr/eon';
import { RouteOptimizationExtension, VoiceExtension } from '@ankr/eon/extensions';

const dispatcherOrchestrator = new ANKROrchestrator(
  llmProvider,
  new ExtensionRegistry()
    .register(new RouteOptimizationExtension())
    .register(new VoiceExtension())
    .register(new DriverCommunicationExtension()),
  new HierarchicalMemory(postgresPool),
  new NoteStorage(postgresPool)
);

// Handle dispatch requests
async function handleDispatchRequest(request: DispatchRequest) {
  const task: Task = {
    id: generateId(),
    domain: 'tms',
    description: `Dispatch vehicle for ${request.pickup} to ${request.delivery}`,
    parameters: request
  };

  const result = await dispatcherOrchestrator.run(task, {
    io: wowtruckIO,
    sessionStorage: new Map([
      ['voice_enabled', request.voiceEnabled],
      ['language', request.language || 'hi']
    ]),
    hierarchicalMemory: memory,
    artifactStore: artifacts,
    noteStorage: notes
  });

  return result;
}
```

### 7.2 LLMBox Integration

```typescript
// packages/llmbox/src/router/enhanced.ts

// Use meta-agent optimized routing
class EnhancedLLMRouter {
  private routingConfig: AgentConfig;

  async initialize() {
    // Load optimized routing config
    this.routingConfig = await loadOptimizedConfig('llm_routing');
  }

  async route(request: LLMRequest): Promise<LLMProvider> {
    // Use learned tool policies from meta-agent
    const policy = this.routingConfig.toolPolicies.find(
      p => p.matches(request)
    );

    if (policy) {
      return this.providers.get(policy.preferredProvider);
    }

    // Fallback to cost-based routing
    return this.selectByPricePerformance(request);
  }
}
```

---

## 8. Performance Expectations

Based on Confucius SDK research results:

| Metric | Without Enhancement | With Enhancement | Expected Improvement |
|--------|---------------------|------------------|---------------------|
| Task Success Rate | Baseline | +7-10% | From scaffolding |
| Token Usage | 104k avg | 93k avg | ~10% reduction |
| Average Turns | 64 | 61 | ~5% reduction |
| Cross-session Learning | None | Active | Hindsight notes |
| Tool Success Rate | 44% | 51.6% | +17% from routing |

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Implement hierarchical memory schema in PostgreSQL
- [ ] Build basic scope management in ankr-eon
- [ ] Create Architect agent for compression

### Phase 2: Note-Taking (Weeks 3-4)
- [ ] Implement NoteTakingAgent
- [ ] Build note storage and retrieval
- [ ] Create hindsight note templates for logistics

### Phase 3: Extensions (Weeks 5-6)
- [ ] Define Extension interface
- [ ] Port existing tools to extension format
- [ ] Build logistics-specific extensions

### Phase 4: Meta-Agent (Weeks 7-8)
- [ ] Implement build-test-improve loop
- [ ] Create evaluation harness for logistics tasks
- [ ] Generate optimized configs for TMS/WMS/OMS

### Phase 5: Integration (Weeks 9-10)
- [ ] Integrate with WowTruck 2.0
- [ ] Connect to SUNOKAHOBOLO voice
- [ ] Deploy and monitor

---

## 10. Cost Optimization Strategies

Aligned with ANKR's "common man solutions" philosophy:

1. **Tiered LLM Usage**: Use smaller models for routine tasks, larger for complex reasoning
2. **Aggressive Caching**: Cache successful strategies in notes
3. **Compression First**: Keep context lean through hierarchical memory
4. **Batch Processing**: Group similar tasks for efficient execution
5. **Free Tier Maximization**: Route to free providers where quality permits

---

## Conclusion

By implementing the Confucius SDK patterns within ANKR-EON, we can achieve:

- **Better performance from existing models** through superior scaffolding
- **Cross-session learning** from hindsight notes
- **Domain specialization** via meta-agent optimization
- **Scalable architecture** for industrial logistics workloads

The key insight remains: invest in the system around the model, not just the model itself.

---

**Jai Guru Ji** 🙏

*ANKR Labs - Making AI accessible for the common man*
