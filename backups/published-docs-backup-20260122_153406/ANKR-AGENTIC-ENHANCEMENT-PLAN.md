# ANKR Agentic Enhancement Plan

> **Vision:** Unified agentic layer that leverages existing ANKR infrastructure to deliver autonomous, multi-step task execution with SLM-first efficiency.

## Executive Summary

ANKR Labs already has **significant agent infrastructure** across 10+ packages. This plan focuses on **integration and enhancement**, not rebuilding.

---

## Part 1: Existing Agent Infrastructure

### What We Already Have

| Package | Purpose | Maturity | Key Capability |
|---------|---------|----------|----------------|
| **ankr-agents** | Multi-agent competition | Production | Agent pools (A/B/C), evolution, judge scoring |
| **ankr-swarm** | Team orchestration | Production | 15+ personas, sequential execution |
| **ankr-orchestrator** | App builder | Production | Plan → Execute with topological sort |
| **workflow-engine** | DAG workflows | Production | Steps, conditions, parallel, human tasks |
| **ankr-executor** | Action bridge | Production | Intent → Action handler registry |
| **ankr-intent** | NLP parsing | Production | Multi-language, entity extraction |
| **ankr-skill-loader** | Skill injection | Production | Auto-detect, token budgeting |
| **ankr-eon** | Context engine | Production | 3-layer context, memory, RAG |
| **ankr-mcp** | Tool registry | Production | 267+ tools |
| **ankr-knowledge-base** | Code RAG | Production | 22K chunks, BM25 search |
| **ankr-slm-router** | SLM-first routing | Production | 4-tier cascade |

### Architectural Patterns Already Implemented

```
┌─────────────────────────────────────────────────────────────┐
│  PATTERN 1: Competition-Based Selection (ankr-agents)       │
│  ─────────────────────────────────────────────────────────  │
│  Task → [Agent A, Agent B, Agent C] → Judge → Winner        │
│  - Pools: Fast(Haiku), Balanced(Sonnet), Expert(Opus)       │
│  - Scoring: Quality(60) + Speed(20) + Cost(20)              │
│  - Evolution: Track & improve over time                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PATTERN 2: Team-Based Execution (ankr-swarm)               │
│  ─────────────────────────────────────────────────────────  │
│  Task → Architect → Developer → Reviewer → QA → Output      │
│  - 15+ pre-built personas                                   │
│  - Context passed between agents                            │
│  - Quality scoring per agent                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PATTERN 3: Workflow Execution (workflow-engine)            │
│  ─────────────────────────────────────────────────────────  │
│  YAML Workflow → DAG → Parallel/Sequential → Complete       │
│  - Step types: action, condition, parallel, loop, human     │
│  - Triggers: manual, cron, event, webhook                   │
│  - Retry with exponential backoff                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PATTERN 4: Intent → Action (ankr-intent + ankr-executor)   │
│  ─────────────────────────────────────────────────────────  │
│  "Track MH12AB1234" → {action: track_vehicle, vehicle: X}   │
│  → ActionExecutor → GraphQL/Tool → Result                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 2: The Gap Analysis

### What's Missing

| Gap | Current State | Needed |
|-----|---------------|--------|
| **SLM-First Agents** | Agents use LLM directly | Route through SLM first |
| **Unified Entry Point** | Multiple agent packages | Single `ankr-agent` facade |
| **Memory Integration** | EON exists but not wired | Agents should use EON automatically |
| **Knowledge Base** | KB exists but isolated | Inject code context into agents |
| **Skill Composition** | Skills are prompts only | Skills as executable workflows |
| **Learning Loop** | Evolution tracks stats | Agents should self-correct |
| **Cost Optimization** | LLM-first expensive | SLM handles 80%, LLM for complex |

### The Integration Problem

```
Current State:
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ ankr-agents  │     │ ankr-swarm   │     │  workflow-   │
│              │     │              │     │   engine     │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
                     NO UNIFIED LAYER
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
┌──────▼───────┐     ┌──────▼───────┐     ┌──────▼───────┐
│  ankr-eon    │     │  ankr-mcp    │     │ slm-router   │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## Part 3: Proposed Enhancements

### Enhancement 1: Unified Agent Facade

**Package:** `@ankr/agent` (new thin wrapper)

```typescript
import { Agent } from '@ankr/agent';

const agent = new Agent({
  mode: 'auto',           // auto | competition | team | workflow
  memory: true,           // Use EON
  knowledge: true,        // Use Knowledge Base
  slmFirst: true,         // Route through SLM before LLM
});

// Simple execution
const result = await agent.run("onboard transporter with GST 27AABCU9603R1ZM");

// Under the hood:
// 1. SLM Router classifies task
// 2. If simple → SLM handles directly
// 3. If complex → Routes to ankr-agents/swarm/workflow
// 4. EON stores result for learning
```

**Implementation:** Thin facade over existing packages, not new agent code.

### Enhancement 2: SLM-First Agent Loop

**Modify:** `ankr-agents/AgentExecutor.ts`

```typescript
// Current: Direct LLM call
const response = await this.llm.complete(task);

// Enhanced: SLM-first with fallback
const slmResult = await slmRouter.route(task.prompt);

if (slmResult.tier <= 2 && slmResult.confidence > 0.8) {
  // SLM handled it
  return slmResult;
}

// Escalate to LLM with enriched context
const context = await this.buildContext(task);
const response = await this.llm.complete(task, { context });
```

**Benefit:** 80% cost reduction for simple sub-tasks within agent loops.

### Enhancement 3: Memory-Augmented Agents

**Modify:** `ankr-agents/AgentExecutor.ts` + `ankr-swarm/UniversalAgent.ts`

```typescript
class MemoryAugmentedAgent {
  private eon: EON;
  private kb: KnowledgeBase;

  async execute(task: Task): Promise<Result> {
    // 1. Recall similar past tasks
    const memories = await this.eon.recall({
      query: task.description,
      type: 'agent_task',
      limit: 3,
    });

    // 2. Get relevant code context
    const codeContext = this.kb.query(task.description, { limit: 2 });

    // 3. Execute with enriched context
    const result = await this.agent.execute(task, {
      memories,
      codeContext,
    });

    // 4. Store result for future recall
    await this.eon.remember({
      type: 'agent_task',
      content: `${task.description} → ${result.summary}`,
      metadata: { task, result },
    });

    return result;
  }
}
```

### Enhancement 4: Executable Skills

**Package:** `@ankr/skills` (enhance ankr-skill-loader)

```yaml
# skills/onboard-transporter.skill.yaml
name: onboard_transporter
description: Onboard a new transporter with verification
triggers:
  - "onboard transporter"
  - "add new vendor"
  - "register transporter"

inputs:
  - name: gstin
    type: string
    extract: "GST number pattern"

steps:
  - id: verify_gst
    tool: gst_verify
    input: "{{gstin}}"
    output: gst_details

  - id: check_mca
    tool: mca_company_search
    input: "{{gst_details.legal_name}}"
    output: mca_details
    requires: [verify_gst]

  - id: verify_bank
    tool: bank_verify
    input: "{{mca_details.registered_address}}"
    output: bank_details
    requires: [check_mca]
    condition: "{{mca_details.status == 'ACTIVE'}}"

  - id: create_vendor
    tool: erp_vendor_create
    input:
      name: "{{gst_details.legal_name}}"
      gstin: "{{gstin}}"
      pan: "{{gst_details.pan}}"
      bank: "{{bank_details}}"
    requires: [verify_bank]

  - id: notify
    tool: whatsapp_send
    input:
      to: "{{gst_details.phone}}"
      template: "vendor_welcome"
    requires: [create_vendor]

output:
  vendor_id: "{{create_vendor.id}}"
  message: "Transporter {{gst_details.legal_name}} onboarded successfully"
```

**Runtime:** Uses `workflow-engine` for execution, `ankr-mcp` for tools.

### Enhancement 5: Self-Correcting Loop

**Add to:** `ankr-agents/AgentExecutor.ts`

```typescript
async executeWithRetry(task: Task, maxAttempts = 3): Promise<Result> {
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < maxAttempts) {
    try {
      const result = await this.execute(task);

      // Validate result
      const validation = await this.validate(result);
      if (validation.passed) {
        // Store successful approach for learning
        await this.eon.remember({
          type: 'successful_approach',
          content: `Task: ${task.description}\nApproach: ${result.approach}`,
          importance: 0.9,
        });
        return result;
      }

      // Self-correct based on validation feedback
      task = this.adjustTask(task, validation.feedback);
      lastError = new Error(validation.feedback);

    } catch (error) {
      lastError = error;

      // Learn from failure
      const recovery = await this.suggestRecovery(task, error);
      if (recovery) {
        task = recovery.adjustedTask;
      }
    }

    attempt++;
  }

  throw lastError;
}
```

---

## Part 4: Implementation Roadmap

### Phase 1: Integration (Week 1-2)

| Task | Package | Effort |
|------|---------|--------|
| Create `@ankr/agent` facade | New | 2 days |
| Wire EON into AgentExecutor | ankr-agents | 1 day |
| Wire KB into AgentExecutor | ankr-agents | 1 day |
| Add SLM-first routing | ankr-agents | 2 days |
| Wire EON into UniversalAgent | ankr-swarm | 1 day |

### Phase 2: Executable Skills (Week 3-4)

| Task | Package | Effort |
|------|---------|--------|
| Skill YAML schema | ankr-skill-loader | 1 day |
| Skill → Workflow compiler | New | 3 days |
| 10 pre-built skills | skills/ | 2 days |
| Voice trigger integration | ankr-voice | 1 day |

### Phase 3: Self-Correction (Week 5-6)

| Task | Package | Effort |
|------|---------|--------|
| Result validation framework | ankr-agents | 2 days |
| Self-correction loop | ankr-agents | 2 days |
| Recovery suggestion | ankr-agents | 2 days |
| Learning storage in EON | ankr-eon | 1 day |

### Phase 4: Optimization (Week 7-8)

| Task | Package | Effort |
|------|---------|--------|
| Cost tracking dashboard | ankr-pulse | 2 days |
| SLM vs LLM analytics | analytics | 2 days |
| Agent performance leaderboard | ankr-agents | 1 day |
| Auto-tuning confidence thresholds | ankr-slm-router | 2 days |

---

## Part 5: Architecture After Enhancement

```
┌─────────────────────────────────────────────────────────────┐
│                      USER REQUEST                           │
│              "Onboard transporter Sharma Logistics"         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     @ankr/agent (Facade)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. Parse intent (ankr-intent)                       │  │
│  │  2. Check for matching skill (ankr-skill-loader)     │  │
│  │  3. Route through SLM first (ankr-slm-router)        │  │
│  │  4. Escalate if needed (ankr-agents/swarm/workflow)  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   SLM Route     │ │  Skill Execute  │ │  Agent Execute  │
│   (Simple)      │ │  (Workflow)     │ │  (Complex)      │
│                 │ │                 │ │                 │
│ Tier 1: Regex   │ │ YAML → DAG     │ │ Competition or  │
│ Tier 2: Ollama  │ │ workflow-engine │ │ Team mode       │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    SHARED SERVICES                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   EON       │  │  Knowledge  │  │    MCP      │         │
│  │   Memory    │  │    Base     │  │   Tools     │         │
│  │             │  │   (Code)    │  │   (267+)    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                       RESULT                                │
│  - Stored in EON for future recall                         │
│  - Tracked for agent evolution                             │
│  - Cost/latency logged to Pulse                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 6: Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| LLM API cost per task | $0.05 | $0.01 (80% reduction) |
| Simple task latency | 3-5s | <1s (SLM direct) |
| Complex task success rate | 75% | 90% (self-correction) |
| Agent reuse (skill hits) | 0% | 60% |
| Memory recall accuracy | N/A | 80% |

---

## Part 7: Files to Modify

### Existing Files

```
packages/ankr-agents/src/AgentExecutor.ts      # Add SLM-first, EON, KB
packages/ankr-agents/src/TaskChain.ts          # Add memory context
packages/ankr-swarm/src/UniversalAgent.ts      # Add EON integration
packages/ankr-swarm/src/SwarmOrchestrator.ts   # Add skill detection
packages/ankr-skill-loader/src/index.ts        # Add executable skills
packages/workflow-engine/src/index.ts          # Add skill-to-workflow
packages/ankr-slm-router/src/router/index.ts   # Add agent escalation
```

### New Files

```
packages/ankr-agent/                           # New facade package
  src/index.ts                                 # Unified API
  src/AgentFacade.ts                          # Routes to appropriate system
  src/SkillExecutor.ts                        # Runs YAML skills
  src/types.ts                                # Shared types

skills/                                        # Skill definitions
  onboard-transporter.skill.yaml
  file-gst-return.skill.yaml
  create-invoice.skill.yaml
  track-shipment.skill.yaml
  process-payment.skill.yaml
```

---

## Appendix: Existing Package Locations

```
/root/ankr-labs-nx/packages/ankr-agents/        # Multi-agent framework
/root/ankr-labs-nx/packages/ankr-swarm/         # Team orchestration
/root/ankr-labs-nx/packages/ankr-orchestrator/  # App builder
/root/ankr-labs-nx/packages/workflow-engine/    # DAG workflows
/root/ankr-labs-nx/packages/ankr-executor/      # Action bridge
/root/ankr-labs-nx/packages/ankr-intent/        # NLP parsing
/root/ankr-labs-nx/packages/ankr-skill-loader/  # Skill injection
/root/ankr-labs-nx/packages/ankr-eon/           # Context engine
/root/ankr-labs-nx/packages/ankr-mcp/           # 267+ tools
/root/ankr-labs-nx/packages/ankr-knowledge-base/ # Code RAG
/root/ankr-labs-nx/packages/ankr-slm-router/    # SLM routing
```

---

*Document created: 2026-01-18*
*Author: ANKR Labs + Claude Opus 4.5*
