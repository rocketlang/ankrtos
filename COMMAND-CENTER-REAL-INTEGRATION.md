# Command Center - Real Service Integration

**CRITICAL:** Command Center must execute tasks to **100% completion**, not just simulate them.

## Current State vs Target State

### ❌ Current (Phase 2 - Mock Executors)
```typescript
class AIGuruExecutor {
  async execute(task: Task) {
    // Simulates work with sleep()
    await this.sleep(2000);
    return { mockResult: true };
  }
}
```

### ✅ Target (Phase 3 - Real Integration)
```typescript
class AIGuruExecutor {
  async execute(task: Task) {
    // ACTUALLY calls AIguru service
    const result = await axios.post('http://localhost:4100/generate', {
      domain: task.input.domain,
      fields: task.input.fields
    });

    // ACTUALLY writes files
    await fs.writeFile(result.filePath, result.content);

    // ACTUALLY runs prisma generate
    await exec('npx prisma generate');

    return result; // Real result, not mock
  }
}
```

---

## Real Service Integration Map

| Executor | Real Service | Port | API Endpoint | What It Does |
|----------|-------------|------|--------------|--------------|
| **AIGuruExecutor** | ankr-guru | 4100 | `/generate` | ACTUALLY generates Prisma schemas, GraphQL resolvers |
| **VibeCoderExecutor** | vibe-coder | 4101 | `/component` | ACTUALLY generates React components |
| **TaskerExecutor** | tasher | N/A | Local exec | ACTUALLY deploys with PM2, manages processes |
| **AGFLOWExecutor** | agflow-discovery | 4444 | `/discover` | ACTUALLY searches 860+ packages |
| **OpenClaudeExecutor** | openclaude-ide/ai-swarm | 5000 | `/orchestrate` | ACTUALLY uses multi-agent swarm |
| **AnkrUniverseExecutor** | ankr-universe | 4005 | `/tools/execute` | ACTUALLY executes MCP tools (755+) |
| **MCPExecutor** | ankr-mcp | 4444 | `/mcp/*` | ACTUALLY calls MCP tools |

---

## Phase 3 Implementation Plan

### Step 1: Real AIguru Integration

**File:** `src/executors/AIGuruExecutor.ts`

```typescript
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export class AIGuruExecutor extends BaseExecutor {
  name = 'aiguru';
  private apiUrl = process.env.AIGURU_URL || 'http://localhost:4100';

  async execute(task: Task): Promise<any> {
    this.start(task);

    try {
      if (task.name.toLowerCase().includes('domain')) {
        return await this.generateDomainReal(task);
      } else if (task.name.toLowerCase().includes('api')) {
        return await this.generateAPIReal(task);
      }
    } catch (error: any) {
      this.fail(task, error.message);
      throw error;
    }
  }

  /**
   * REAL domain generation using AIguru service
   */
  private async generateDomainReal(task: Task): Promise<any> {
    this.updateProgress(task, 20, 'Calling AIguru service...');

    // REAL API call to AIguru
    const response = await axios.post(`${this.apiUrl}/generate/domain`, {
      name: task.input.domainName,
      fields: task.input.fields || [],
      relations: task.input.relations || [],
    });

    this.updateProgress(task, 50, 'Writing Prisma schema...');

    // ACTUALLY write the file
    const filePath = response.data.filePath;
    await fs.writeFile(filePath, response.data.content, 'utf-8');

    this.updateProgress(task, 80, 'Running prisma generate...');

    // ACTUALLY run Prisma generate
    const { stdout } = await execAsync('npx prisma generate');
    this.addLog(task, 'info', stdout);

    this.complete(task, {
      domain: response.data.domain,
      file: filePath,
      fields: response.data.fields,
    });

    return response.data;
  }

  /**
   * REAL GraphQL generation using @ankr/backend-generator
   */
  private async generateAPIReal(task: Task): Promise<any> {
    this.updateProgress(task, 20, 'Reading Prisma schemas...');

    // REAL file system operations
    const schemaFiles = await this.findPrismaSchemas();

    this.updateProgress(task, 40, 'Calling backend-generator...');

    // REAL generation
    const { stdout } = await execAsync(
      `npx @ankr/backend-generator generate --schemas ${schemaFiles.join(' ')}`
    );

    this.updateProgress(task, 80, 'Compiling TypeScript...');

    // REAL compilation
    await execAsync('npm run build');

    this.complete(task, {
      queries: this.countQueries(stdout),
      mutations: this.countMutations(stdout),
    });

    return { success: true };
  }

  private async findPrismaSchemas(): Promise<string[]> {
    const { stdout } = await execAsync('find . -name "*.prisma"');
    return stdout.trim().split('\n');
  }
}
```

---

### Step 2: Real Tasher Integration

**File:** `src/executors/TaskerExecutor.ts`

```typescript
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class TaskerExecutor extends BaseExecutor {
  name = 'tasher';

  async execute(task: Task): Promise<any> {
    this.start(task);

    try {
      if (task.name.toLowerCase().includes('deploy')) {
        return await this.deployAppReal(task);
      }
    } catch (error: any) {
      this.fail(task, error.message);
      throw error;
    }
  }

  private async deployAppReal(task: Task): Promise<any> {
    this.updateProgress(task, 20, 'Finding available port...');

    // REAL port allocation using @ankr/ports
    const { getNextAvailablePort } = await import('@ankr/ports');
    const backendPort = await getNextAvailablePort(4000);
    const frontendPort = await getNextAvailablePort(3000);

    this.updateProgress(task, 40, `Starting backend on port ${backendPort}...`);

    // REAL PM2 deployment
    const pm2Name = `${task.input.appName}-backend-${Date.now()}`;
    await execAsync(
      `pm2 start npm --name "${pm2Name}" -- run start -- --port ${backendPort}`
    );

    this.updateProgress(task, 70, `Starting frontend on port ${frontendPort}...`);

    await execAsync(
      `pm2 start npm --name "${task.input.appName}-frontend-${Date.now()}" -- run dev -- --port ${frontendPort}`
    );

    this.updateProgress(task, 95, 'Verifying services...');

    // REAL health check
    await this.waitForService(`http://localhost:${backendPort}/health`);
    await this.waitForService(`http://localhost:${frontendPort}`);

    this.complete(task, {
      backend: {
        port: backendPort,
        url: `http://localhost:${backendPort}`,
        graphqlUrl: `http://localhost:${backendPort}/graphql`,
        pm2Name,
      },
      frontend: {
        port: frontendPort,
        url: `http://localhost:${frontendPort}`,
      },
    });

    return { success: true };
  }

  private async waitForService(url: string, maxAttempts = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await axios.get(url, { timeout: 1000 });
        return;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    throw new Error(`Service at ${url} did not start`);
  }
}
```

---

### Step 3: Real AGFLOW Integration

**File:** `src/executors/AGFLOWExecutor.ts`

```typescript
import axios from 'axios';

export class AGFLOWExecutor extends BaseExecutor {
  name = 'agflow';
  private apiUrl = process.env.AGFLOW_URL || 'http://localhost:4444';

  async execute(task: Task): Promise<any> {
    this.start(task);

    try {
      this.updateProgress(task, 20, 'Calling AGFLOW discovery...');

      // REAL AGFLOW API call
      const response = await axios.post(`${this.apiUrl}/agflow/discover`, {
        query: task.description,
        limit: 20,
        includeInternal: true,
      });

      this.updateProgress(task, 80, `Found ${response.data.packages.length} packages`);

      this.complete(task, {
        packagesFound: response.data.packages.length,
        packages: response.data.packages,
      });

      return response.data;
    } catch (error: any) {
      this.fail(task, error.message);
      throw error;
    }
  }
}
```

---

### Step 4: Real OpenClaude (ai-swarm) Integration

**NEW Executor:** `src/executors/OpenClaudeExecutor.ts`

```typescript
import axios from 'axios';

export class OpenClaudeExecutor extends BaseExecutor {
  name = 'openclaude';
  private apiUrl = process.env.OPENCLAUDE_URL || 'http://localhost:5000';

  async execute(task: Task): Promise<any> {
    this.start(task);

    try {
      this.updateProgress(task, 10, 'Spawning ai-swarm agents...');

      // REAL ai-swarm orchestration
      const response = await axios.post(`${this.apiUrl}/orchestrate`, {
        task: task.description,
        agents: ['architect', 'senior_dev', 'reviewer'],
        isolateGitWorktrees: true,
      });

      const sessionId = response.data.sessionId;

      // Poll for progress
      while (true) {
        const status = await axios.get(`${this.apiUrl}/session/${sessionId}`);

        this.updateProgress(
          task,
          status.data.progress,
          `${status.data.currentAgent}: ${status.data.currentTask}`
        );

        if (status.data.status === 'completed') {
          this.complete(task, status.data.result);
          return status.data.result;
        } else if (status.data.status === 'failed') {
          throw new Error(status.data.error);
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error: any) {
      this.fail(task, error.message);
      throw error;
    }
  }
}
```

---

### Step 5: Real ankr-universe Integration

**NEW Executor:** `src/executors/AnkrUniverseExecutor.ts`

```typescript
import axios from 'axios';

export class AnkrUniverseExecutor extends BaseExecutor {
  name = 'ankr-universe';
  private apiUrl = process.env.ANKR_UNIVERSE_URL || 'http://localhost:4005';

  async execute(task: Task): Promise<any> {
    this.start(task);

    try {
      this.updateProgress(task, 20, 'Selecting MCP tools...');

      // REAL MCP tool selection from 755+ tools
      const tools = await this.selectMCPTools(task.description);

      this.updateProgress(task, 40, `Executing ${tools.length} MCP tools...`);

      // REAL tool execution via ankr-universe
      const response = await axios.post(`${this.apiUrl}/tools/execute`, {
        tools: tools.map((t) => ({
          name: t,
          input: task.input,
        })),
        workflow: 'sequential',
      });

      // Monitor execution
      const executionId = response.data.executionId;

      while (true) {
        const status = await axios.get(`${this.apiUrl}/tools/status/${executionId}`);

        this.updateProgress(
          task,
          (status.data.completedTools / status.data.totalTools) * 100,
          `Completed ${status.data.completedTools}/${status.data.totalTools} tools`
        );

        if (status.data.status === 'completed') {
          this.complete(task, status.data.results);
          return status.data.results;
        } else if (status.data.status === 'failed') {
          throw new Error(status.data.error);
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error: any) {
      this.fail(task, error.message);
      throw error;
    }
  }

  private async selectMCPTools(description: string): Promise<string[]> {
    const response = await axios.post(`${this.apiUrl}/tools/select`, {
      query: description,
      limit: 10,
    });
    return response.data.tools;
  }
}
```

---

## Updated PlanBuilder - Smart Routing

**File:** `src/services/PlanBuilder.ts`

```typescript
private async analyzeTasks(
  userRequest: string,
  requirements?: BuildRequest['requirements']
): Promise<Task[]> {
  const tasks: Task[] = [];
  const lowerRequest = userRequest.toLowerCase();

  // Complex multi-agent tasks → OpenClaude (ai-swarm)
  if (
    lowerRequest.includes('refactor') ||
    lowerRequest.includes('redesign') ||
    lowerRequest.includes('complex')
  ) {
    tasks.push(
      this.createTask({
        name: 'Orchestrate with ai-swarm',
        description: userRequest,
        executor: 'openclaude', // Use multi-agent swarm
      })
    );
  }

  // MCP tool execution → ankr-universe
  else if (
    lowerRequest.includes('verify') ||
    lowerRequest.includes('validate') ||
    lowerRequest.includes('check')
  ) {
    tasks.push(
      this.createTask({
        name: 'Execute MCP tools',
        description: userRequest,
        executor: 'ankr-universe', // Use 755+ MCP tools
      })
    );
  }

  // Standard app generation → AIguru + VibeCoder + Tasher
  else {
    // ... existing logic ...
  }

  return tasks;
}
```

---

## Environment Variables

**File:** `apps/command-center-backend/.env`

```bash
PORT=4200

# Real service URLs
AIGURU_URL=http://localhost:4100
VIBECODER_URL=http://localhost:4101
AGFLOW_URL=http://localhost:4444
OPENCLAUDE_URL=http://localhost:5000
ANKR_UNIVERSE_URL=http://localhost:4005

# MCP Registry
MCP_REGISTRY_URL=http://localhost:4444/mcp

NODE_ENV=production
```

---

## Integration Checklist

### Phase 3A: Core Services (Week 1)
- [ ] AIguru integration (domain + API generation)
- [ ] Tasher integration (PM2 deployment)
- [ ] AGFLOW integration (package discovery)
- [ ] Test: "Build me a CRM" → Working CRM

### Phase 3B: Advanced Services (Week 2)
- [ ] OpenClaude (ai-swarm) integration
- [ ] ankr-universe integration (755+ MCP tools)
- [ ] VibeCoder integration (component generation)
- [ ] Test: "Refactor auth system" → ai-swarm does it

### Phase 3C: Polish (Week 3)
- [ ] Error recovery (task retry logic)
- [ ] Progress streaming (SSE or WebSocket)
- [ ] Cost tracking (actual API costs)
- [ ] Test: All executors working end-to-end

---

## Success Criteria

**"Build me a CRM" Test:**

1. User types: "Build me a CRM with contacts and leads"
2. Command Center:
   - ✅ ACTUALLY calls AIguru → generates Contact.prisma, Lead.prisma
   - ✅ ACTUALLY runs `npx prisma generate`
   - ✅ ACTUALLY generates GraphQL resolvers
   - ✅ ACTUALLY generates React components (ContactForm, LeadList)
   - ✅ ACTUALLY deploys with PM2 on ports 4099 (backend), 3099 (frontend)
   - ✅ ACTUALLY health checks both services
3. User clicks http://localhost:3099
4. **WORKING CRM OPENS** with functional contact/lead management

**NOT simulation. NOT mock. REAL execution to 100% completion.** ✅

---

## Next Steps

1. **Create package `@ankr/executor-factory`** - Real executor implementations
2. **Update PlanBuilder** - Smart routing to appropriate executors
3. **Add health checks** - Verify all services are running before execution
4. **Add rollback logic** - If task fails, undo previous tasks
5. **Add cost tracking** - Real API costs, not estimates

---

**Current Status:**
- ✅ Phase 1: UI Foundation (Complete)
- ✅ Phase 2: Backend + Mock Executors (Complete)
- 🔄 **Phase 3: Real Service Integration (THIS DOCUMENT)**

**Timeline:**
- Phase 3A: 1 week
- Phase 3B: 1 week
- Phase 3C: 1 week
- **Total: 3 weeks to production-ready**
