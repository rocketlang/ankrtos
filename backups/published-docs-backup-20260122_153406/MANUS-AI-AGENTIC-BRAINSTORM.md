# AnkrCode + RocketLang: Manus AI-Style Agentic Architecture

> **Date**: 18 January 2026
> **Status**: BRAINSTORM - Active Discussion
> **Previous Session**: Computer Use / Browser Mode created

---

## 1. What We Already Have

### 1.1 Computer Use / Browser Agent (ALREADY BUILT)

**Location**: `/root/ankrcode-project/packages/ankrcode-core/src/browser/`

```typescript
// Existing BrowserAgent with ReAct Loop
export class BrowserAgent extends EventEmitter {
  async browse(task: BrowseTask): Promise<BrowseResult> {
    // ReAct loop: Reason → Act → Observe
    for (let stepNum = 1; stepNum <= maxSteps; stepNum++) {
      const screenshot = await this.controller.screenshot();
      const pageState = await this.controller.getPageState();
      const analysis = await analyzeScreenshot(screenshot, pageState, task.goal, previousSteps);

      if (analysis.goalProgress === 'completed') break;

      // Execute suggested action...
    }
  }
}
```

**Capabilities**:
- Vision-based page analysis (sends page state to Claude)
- ReAct loop (Reason → Act → Observe)
- Click, type, scroll, navigate actions
- Goal completion detection
- Search box fallback strategy
- Headless Playwright/Puppeteer

### 1.2 AnkrCode CLI (16 Core Tools)

| Tool | Capability |
|------|------------|
| Read | Read files from filesystem |
| Write | Create/write files |
| Edit | String replacement edits |
| Glob | File pattern matching |
| Grep | Content search |
| Bash | Shell command execution |
| Task | Spawn sub-agents |
| TodoWrite | Task tracking |
| Browse | **Computer Use** |
| WebFetch | Fetch URLs |
| WebSearch | Multi-provider search |

### 1.3 RocketLang Composer (17 Templates)

```
User Intent → Template Matching → Package Selection → Code Generation
```

Templates: crud-api, realtime-api, auth-flow, dashboard-ui, etc.

### 1.4 Sandbox (Docker Isolation)

```
Generated Code → Docker Container → Auto Tests → Promotion
```

---

## 2. What Makes Manus AI Different

### 2.1 Manus AI Capabilities

| Capability | Description |
|------------|-------------|
| **Full Desktop Control** | Can control any application, not just browser |
| **Multi-Step Planning** | Decomposes complex tasks into steps autonomously |
| **Self-Healing** | Recovers from errors, tries alternative approaches |
| **Deep Web Navigation** | Can log in, fill forms, handle CAPTCHAs |
| **Code + Deploy** | Writes code AND deploys it |
| **File Management** | Downloads, uploads, organizes files |
| **API Integration** | Makes API calls, handles authentication |
| **Memory** | Remembers context across sessions |

### 2.2 Gap Analysis: AnkrCode vs Manus AI

| Feature | AnkrCode Today | Manus AI | Gap |
|---------|---------------|----------|-----|
| Browser Control | Basic (ReAct) | Advanced | Medium |
| Desktop Control | None | Full | Large |
| Multi-Step Planning | Manual | Autonomous | Large |
| Self-Healing | None | Yes | Large |
| Code Generation | Templates | Any code | Small |
| Deployment | Sandbox only | Full prod | Medium |
| Memory | EON (exists) | Built-in | Small |
| Voice Input | Swayam (exists) | None | Advantage |
| India Stack | 260+ tools | None | Advantage |

---

## 3. Proposed Architecture: ANKR Agentic System (AAS)

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ANKR AGENTIC SYSTEM (AAS)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        INPUT LAYER                                      │ │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              │ │
│  │   │ Natural  │  │  Voice   │  │ RocketLang│  │  API     │              │ │
│  │   │ Language │  │ (Swayam) │  │   DSL    │  │ Trigger  │              │ │
│  │   └──────────┘  └──────────┘  └──────────┘  └──────────┘              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      TASK DECOMPOSITION LAYER                           │ │
│  │   ┌──────────────────────────────────────────────────────────────┐     │ │
│  │   │  Goal → Plan → Steps → Actions → Verification               │     │ │
│  │   │  (Uses Claude/GPT-4 for planning)                            │     │ │
│  │   └──────────────────────────────────────────────────────────────┘     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      AGENT ORCHESTRATOR                                 │ │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │ │
│  │   │ Browser │  │  Code   │  │ Deploy  │  │  API    │  │ Memory  │    │ │
│  │   │  Agent  │  │  Agent  │  │  Agent  │  │  Agent  │  │  Agent  │    │ │
│  │   └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      EXECUTION ENVIRONMENT                              │ │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                   │ │
│  │   │   Browser   │  │   Sandbox   │  │    Cloud    │                   │ │
│  │   │ (Playwright)│  │  (Docker)   │  │  (Deploy)   │                   │ │
│  │   └─────────────┘  └─────────────┘  └─────────────┘                   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      MEMORY & LEARNING (EON)                            │ │
│  │   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐         │ │
│  │   │ Episodic  │  │ Semantic  │  │Procedural │  │  Success  │         │ │
│  │   │ (Sessions)│  │ (Facts)   │  │ (How-to)  │  │ Patterns  │         │ │
│  │   └───────────┘  └───────────┘  └───────────┘  └───────────┘         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Agent Types

```typescript
// Agent Type Definitions
interface AgentType {
  name: string;
  capabilities: string[];
  tools: string[];
}

const AGENT_TYPES: AgentType[] = [
  {
    name: 'BrowserAgent',
    capabilities: ['web_navigation', 'form_filling', 'data_extraction', 'screenshot'],
    tools: ['browse', 'click', 'type', 'scroll', 'screenshot', 'extract']
  },
  {
    name: 'CoderAgent',
    capabilities: ['code_generation', 'code_review', 'refactoring', 'testing'],
    tools: ['read', 'write', 'edit', 'glob', 'grep', 'bash']
  },
  {
    name: 'DeployAgent',
    capabilities: ['sandbox_deploy', 'production_deploy', 'rollback', 'monitoring'],
    tools: ['docker', 'kubernetes', 'vercel', 'railway']
  },
  {
    name: 'APIAgent',
    capabilities: ['api_calls', 'authentication', 'data_transformation'],
    tools: ['webfetch', 'mcp_tools']
  },
  {
    name: 'MemoryAgent',
    capabilities: ['remember', 'recall', 'pattern_match', 'learn'],
    tools: ['eon_remember', 'eon_recall', 'eon_search']
  }
];
```

---

## 4. Task Decomposition Engine

### 4.1 How Complex Tasks Get Broken Down

```
User: "Build me an e-commerce site with Razorpay payment"

┌───────────────────────────────────────────────────────────────┐
│                    TASK DECOMPOSITION                          │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  Goal: E-commerce site with Razorpay                          │
│                    │                                           │
│                    ▼                                           │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Phase 1: Research & Planning                              │ │
│  │  1.1 Check if Razorpay API docs available (BrowserAgent) │ │
│  │  1.2 Search for best React e-commerce templates          │ │
│  │  1.3 Identify required @ankr packages                    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                    │                                           │
│                    ▼                                           │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Phase 2: Code Generation                                  │ │
│  │  2.1 Generate backend API (RocketLang template)          │ │
│  │  2.2 Generate frontend UI (VibeCode tools)               │ │
│  │  2.3 Integrate @ankr/razorpay package                    │ │
│  │  2.4 Generate tests                                       │ │
│  └──────────────────────────────────────────────────────────┘ │
│                    │                                           │
│                    ▼                                           │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Phase 3: Testing & Deployment                             │ │
│  │  3.1 Deploy to sandbox (Docker)                          │ │
│  │  3.2 Run automated tests                                  │ │
│  │  3.3 Test payment flow (BrowserAgent)                    │ │
│  │  3.4 Promote to production if tests pass                 │ │
│  └──────────────────────────────────────────────────────────┘ │
│                    │                                           │
│                    ▼                                           │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Phase 4: Verification                                     │ │
│  │  4.1 Navigate to deployed site (BrowserAgent)            │ │
│  │  4.2 Test user flows                                      │ │
│  │  4.3 Report back to user                                  │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

### 4.2 Task Decomposer Implementation

```typescript
// Task Decomposition Engine
interface TaskPlan {
  goal: string;
  phases: Phase[];
  estimatedSteps: number;
  requiredAgents: string[];
  requiredPackages: string[];
}

interface Phase {
  name: string;
  steps: Step[];
  dependencies: string[];
  canParallelize: boolean;
}

interface Step {
  id: string;
  description: string;
  agent: string;
  action: string;
  params: Record<string, any>;
  verifyWith?: string;
  rollbackAction?: string;
}

async function decomposeTask(userGoal: string): Promise<TaskPlan> {
  // Use Claude to decompose the task
  const systemPrompt = `You are a task planner for an AI coding assistant.
Break down the user's goal into executable phases and steps.
Each step must use one of these agents: BrowserAgent, CoderAgent, DeployAgent, APIAgent, MemoryAgent.

Respond with JSON only.`;

  const response = await claude.complete({
    systemPrompt,
    userMessage: `Goal: "${userGoal}"

Available @ankr packages: oauth, iam, eshop, gst, invoice, upi, razorpay, whatsapp, etc.
Available templates: crud-api, realtime-api, dashboard-ui, auth-flow, etc.

Create a detailed execution plan.`
  });

  return JSON.parse(response);
}
```

---

## 5. Enhanced Browser Agent (Computer Vision)

### 5.1 Current vs Proposed

| Current | Proposed Enhancement |
|---------|---------------------|
| Page state analysis only | Full screenshot analysis with vision API |
| Basic click/type actions | Complex form handling, CAPTCHAs |
| Single tab | Multi-tab orchestration |
| No login persistence | Session/cookie management |
| Headless only | Optional visible mode for debugging |

### 5.2 Vision API Integration

```typescript
// Enhanced Vision Analysis
async function analyzeWithVision(
  screenshot: Buffer,
  pageState: PageState,
  goal: string,
  context: string[]
): Promise<VisionAnalysis> {

  // Option 1: Claude Vision (claude-3-sonnet/opus with vision)
  const response = await claude.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: screenshot.toString('base64')
          }
        },
        {
          type: 'text',
          text: `Goal: ${goal}

Current URL: ${pageState.url}
Previous actions: ${context.join(', ')}

What element should I click/interact with next to achieve the goal?
Describe the element's position and appearance if you can see it.

Respond with:
{
  "element_description": "the blue 'Login' button in top right",
  "action": "click",
  "coordinates": { "x": 1150, "y": 50 },  // if you can estimate
  "reasoning": "why this is the next step"
}`
        }
      ]
    }]
  });

  return parseVisionResponse(response);
}
```

### 5.3 Multi-Tab Orchestration

```typescript
// Multi-tab browser control
class EnhancedBrowserAgent extends BrowserAgent {
  private tabs: Map<string, Page> = new Map();

  async openTab(name: string, url?: string): Promise<void> {
    const page = await this.browser.newPage();
    if (url) await page.goto(url);
    this.tabs.set(name, page);
  }

  async switchTab(name: string): Promise<void> {
    const page = this.tabs.get(name);
    if (page) await page.bringToFront();
  }

  async orchestrateMultiTab(task: MultiTabTask): Promise<void> {
    // Example: Open docs in one tab, code in another
    await this.openTab('docs', 'https://docs.razorpay.com');
    await this.openTab('code', 'https://github.com/...');

    // Cross-reference information
    await this.switchTab('docs');
    const apiKey = await this.extractText('.api-key-section');

    await this.switchTab('code');
    await this.type('.env-input', `RAZORPAY_KEY=${apiKey}`);
  }
}
```

---

## 6. Self-Healing & Error Recovery

### 6.1 Recovery Strategies

```typescript
// Self-healing execution
async function executeWithRecovery(
  step: Step,
  maxRetries: number = 3
): Promise<StepResult> {

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await executeStep(step);
      if (result.success) return result;

      // Step failed, try recovery
      const recovery = await planRecovery(step, result.error);

      if (recovery.strategy === 'retry_with_modification') {
        step.params = recovery.modifiedParams;
        continue;
      }

      if (recovery.strategy === 'alternative_approach') {
        return executeWithRecovery(recovery.alternativeStep, maxRetries - 1);
      }

      if (recovery.strategy === 'skip_and_continue') {
        return { success: true, skipped: true, reason: recovery.reason };
      }

    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);

      // Wait before retry with exponential backoff
      await sleep(1000 * Math.pow(2, attempt));
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}

// AI-powered recovery planning
async function planRecovery(
  failedStep: Step,
  error: string
): Promise<RecoveryPlan> {

  const response = await claude.complete({
    systemPrompt: 'You are an error recovery planner.',
    userMessage: `Step failed: ${JSON.stringify(failedStep)}
Error: ${error}

Suggest a recovery strategy:
1. retry_with_modification - same step with adjusted params
2. alternative_approach - different way to achieve same goal
3. skip_and_continue - mark as optional and proceed
4. abort - critical failure, cannot continue

Respond with JSON.`
  });

  return JSON.parse(response);
}
```

### 6.2 Checkpoint & Rollback

```typescript
// Checkpoint system for long-running tasks
class TaskCheckpointer {
  private checkpoints: Map<string, Checkpoint> = new Map();

  async saveCheckpoint(taskId: string, state: TaskState): Promise<void> {
    const checkpoint: Checkpoint = {
      id: `${taskId}_${Date.now()}`,
      taskId,
      state,
      timestamp: new Date(),
      filesCreated: state.filesCreated,
      dbChanges: state.dbChanges,
    };

    this.checkpoints.set(checkpoint.id, checkpoint);
    await EON.remember(`checkpoint:${checkpoint.id}`, checkpoint);
  }

  async rollbackTo(checkpointId: string): Promise<void> {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) throw new Error('Checkpoint not found');

    // Rollback files
    for (const file of checkpoint.filesCreated) {
      await fs.remove(file);
    }

    // Rollback DB changes (if tracked)
    for (const change of checkpoint.dbChanges) {
      await db.rollback(change);
    }
  }
}
```

---

## 7. Integration Points

### 7.1 RocketLang Composer Integration

```typescript
// RocketLang now triggers agentic workflows
import { TaskDecomposer } from '@ankr/agentic';

async function processRocketLangIntent(input: string): Promise<void> {
  // Parse intent
  const intent = await parseRocketLang(input);

  if (intent.complexity === 'simple') {
    // Direct execution (existing flow)
    return executeComposition(intent);
  }

  if (intent.complexity === 'complex') {
    // Agentic execution
    const plan = await TaskDecomposer.decompose(intent.goal);
    return executeAgenticPlan(plan);
  }
}

// Example:
// Simple: "banao invoice" → Direct template execution
// Complex: "e-commerce site with Razorpay and WhatsApp notifications" → Agentic
```

### 7.2 EON Memory Integration

```typescript
// Learn from successful executions
async function learnFromSuccess(
  goal: string,
  plan: TaskPlan,
  result: ExecutionResult
): Promise<void> {

  // Store successful pattern
  await EON.remember({
    type: 'successful_pattern',
    goal: goal,
    goalEmbedding: await embed(goal),
    plan: plan,
    duration: result.duration,
    packagesUsed: result.packagesUsed,
    stepsExecuted: result.steps.length,
    timestamp: new Date()
  });

  // If similar goal in future, retrieve this pattern
}

// Retrieve similar patterns
async function findSimilarPatterns(goal: string): Promise<Pattern[]> {
  return EON.search({
    type: 'successful_pattern',
    similarity: { field: 'goalEmbedding', vector: await embed(goal) },
    limit: 5
  });
}
```

---

## 8. Implementation Roadmap

### Phase 1: Enhanced Browser Agent (Week 1-2)

- [ ] Add Claude Vision API integration to vision.ts
- [ ] Multi-tab support in BrowserAgent
- [ ] Session/cookie persistence
- [ ] Form handling improvements (dropdowns, checkboxes, etc.)
- [ ] CAPTCHA detection (alert user if encountered)

### Phase 2: Task Decomposition (Week 3-4)

- [ ] Create TaskDecomposer class
- [ ] Integration with existing tool registry
- [ ] Step dependency resolution
- [ ] Parallel step execution where possible
- [ ] Progress reporting

### Phase 3: Self-Healing (Week 5-6)

- [ ] Error classification system
- [ ] Recovery strategy planner
- [ ] Checkpoint/rollback system
- [ ] Retry with exponential backoff
- [ ] Human escalation when stuck

### Phase 4: Full Integration (Week 7-8)

- [ ] RocketLang agentic mode
- [ ] EON pattern learning
- [ ] End-to-end demo: "Build e-commerce site"
- [ ] Performance optimization
- [ ] Documentation

---

## 9. Example End-to-End Flow

### User Request
```
"Bhai mujhe ek food delivery app chahiye. Swiggy jaisa.
 Users order kar sake, restaurant accept kare, delivery boy track kare."
```

### System Response

```
🧠 Task Analysis:
━━━━━━━━━━━━━━━━━
Goal: Food delivery app like Swiggy
Complexity: HIGH (multi-role, real-time, location-based)

📋 Execution Plan:
━━━━━━━━━━━━━━━━━
Phase 1: Research (BrowserAgent)
  • Check Swiggy's UI patterns
  • Research food delivery architecture
  • Find @ankr packages for geolocation

Phase 2: Architecture (CoderAgent)
  • Design database schema (users, restaurants, orders, delivery)
  • Select tech stack (React Native, Fastify, PostgreSQL)
  • Identify @ankr packages needed

Phase 3: Code Generation (CoderAgent + RocketLang)
  • Generate backend API using crud-api template
  • Generate customer app (React Native)
  • Generate restaurant app
  • Generate delivery app
  • Integrate @ankr/maps, @ankr/notifications

Phase 4: Deployment (DeployAgent)
  • Deploy to sandbox
  • Run integration tests
  • Test with BrowserAgent

Phase 5: Demo (BrowserAgent)
  • Create test order
  • Accept as restaurant
  • Track delivery
  • Complete order flow

Estimated time: 15 minutes
Packages: @ankr/oauth, @ankr/maps, @ankr/notifications, @ankr/payments

🚀 Proceed? [Yes / Modify Plan / Cancel]
```

---

## 10. Differentiation from Manus AI

### What We Have That Manus Doesn't

| Feature | AnkrCode | Manus AI |
|---------|----------|----------|
| India Stack Integration | 260+ GST/UPI/Aadhaar tools | None |
| Hindi/Indic Voice Input | Swayam | None |
| RocketLang DSL | Code-switching friendly | None |
| Pre-built Package Ecosystem | 220+ @ankr packages | None |
| EON Memory System | Episodic + Semantic | Basic |
| Enterprise Compliance | GST, TDS, MCA built-in | None |

### What We Need from Manus

| Feature | Status | Priority |
|---------|--------|----------|
| Vision-based browser control | 🟡 Partial | P1 |
| Multi-step task planning | 🔴 Missing | P1 |
| Self-healing execution | 🔴 Missing | P1 |
| Desktop app control | 🔴 Missing | P2 |
| Full production deploy | 🟡 Sandbox only | P2 |

---

## 11. Open Questions

1. **Desktop Control**: Do we need it, or is browser + CLI enough for India use cases?

2. **Paid APIs**: Claude Vision API costs money. How to handle for free tier users?

3. **Security**: Agentic systems can be dangerous. How to sandbox properly?

4. **Rate Limits**: If agent makes 100 API calls, who pays?

5. **Human in the Loop**: When should we stop and ask user for confirmation?

---

## 12. Next Steps (Immediate)

1. **Upgrade vision.ts** - Add Claude Vision API support
2. **Create TaskDecomposer** - Start with simple 3-step tasks
3. **Add checkpointing** - For long-running tasks
4. **Demo**: Build one complex app end-to-end with agent
5. **Measure**: Time, tokens, success rate

---

*Document created: 18 January 2026*
*Status: BRAINSTORM - Ready for discussion*
