# OpenClaude Multi-Agent Quick Start

**Get started with multi-agent development in 5 minutes**

---

## Installation

```bash
cd openclaude-ide
npm install
npm run compile && npm run build:browser
cd examples/browser && npm run start
```

Access at: `http://localhost:3000`

---

## Quick Examples

### 1. Code Review Swarm (5 agents in parallel)

```typescript
// In OpenClaude IDE
openclaude.reviewPR({
  number: 123,
  files: ['src/auth.ts', 'src/user.ts']
})

// Behind the scenes:
// ├─ SecuritySentinel    → 🔍 Vulnerability scan
// ├─ PerformanceOracle   → ⚡ Performance analysis
// ├─ ArchitectGuardian   → 🏗️  Architecture review
// ├─ TestCoverageAnalyst → ✅ Test coverage check
// └─ DocumentationScribe → 📝 Documentation review

// Results in 30 seconds
```

**Use when:**
- Creating pull requests
- Code review needed
- Pre-merge quality check

---

### 2. Feature Implementation Team

```typescript
// Generate complete feature
openclaude.implementFeature({
  description: "Add OAuth2 authentication with Google & GitHub",
  stack: "react-node-postgres"
})

// Autonomous workflow:
// Phase 1: Architect designs system
// Phase 2: BackendDev + FrontendDev implement (parallel)
// Phase 3: TestEngineer writes tests
// Phase 4: Complete feature ready

// Delivered in hours, not days
```

**Use when:**
- Starting new features
- Rapid prototyping
- Proof of concepts

---

### 3. Comprehensive Testing

```typescript
// Auto-generate tests for changed files
openclaude.runTests({
  files: detectChangedFiles(),
  types: ['unit', 'integration', 'e2e']
})

// Self-organizing workers:
// - 2x UnitTestGenerators (parallel)
// - 1x IntegrationTester
// - 1x E2ETester
// - 1x QAWatcher (monitors)

// 85%+ coverage achieved
```

**Use when:**
- After code changes
- Pre-deployment
- Continuous integration

---

### 4. Codebase Understanding

```typescript
// Query massive codebase (1000+ files)
openclaude.ask({
  question: "How does authentication work in this codebase?",
  scope: "entire-project"
})

// Distributed knowledge:
// Each agent masters a domain
// Query routed to relevant experts
// Comprehensive answer synthesized

// Instant codebase expertise
```

**Use when:**
- Onboarding new developers
- Understanding legacy code
- Architectural decisions

---

## Common Commands

### Team Management

```typescript
// Create team
const team = await openclaude.spawnTeam({
  name: "my-team",
  coordinationStrategy: "swarm", // or "pipeline", "leader"
  maxParallelism: 5
})

// Spawn agent
const agent = await team.spawn({
  name: "SecurityAgent",
  type: "security-reviewer",
  model: "sonnet", // or "haiku", "opus"
  capabilities: ["vulnerability-scan", "auth-check"]
})

// Execute task
const result = await agent.execute("Review this code for security issues")

// Cleanup
await team.cleanup()
```

---

### Agent Communication

```typescript
// Direct message
await agent1.sendMessage(agent2.id, {
  type: "request",
  data: { question: "Did you find any issues?" }
})

// Broadcast to team
await team.broadcast({
  type: "status-update",
  data: { phase: "testing", progress: 0.75 }
})

// Subscribe to updates
team.on('agent-status-changed', (agent) => {
  console.log(`${agent.name} is now ${agent.status}`)
})
```

---

### Task Coordination

```typescript
// Create task with dependencies
const task1 = await openclaude.createTask({
  title: "Design API",
  type: "architecture"
})

const task2 = await openclaude.createTask({
  title: "Implement API",
  type: "implementation",
  blockedBy: [task1.id] // Can't start until task1 completes
})

// Workers claim tasks automatically
const worker = await team.spawn({
  name: "Worker1",
  type: "developer",
  model: "sonnet"
})

// Worker claims next available task
const task = await worker.claimTask()
const result = await worker.execute(task.description)
await worker.completeTask(task.id, result)
```

---

## UI Components

### Team Dashboard

```
View → OpenClaude → Team Dashboard

Shows:
- Active teams
- Agent status
- System metrics
- Cost tracking
```

### Agent Monitor

```
View → OpenClaude → Agent Monitor

Shows:
- Agent activity
- Current tasks
- Token usage
- Success rate
```

### Task Board

```
View → OpenClaude → Task Board

Shows:
- Pending tasks
- In-progress tasks
- Completed tasks
- Dependencies (graph)
```

---

## Configuration

### Model Selection

```typescript
// Cost vs. Quality tradeoff
{
  simple_tasks: "haiku",     // $0.25 / 1M tokens
  medium_tasks: "sonnet",    // $3.00 / 1M tokens
  complex_tasks: "opus"      // $15.00 / 1M tokens
}

// Example:
openclaude.configure({
  defaultModel: "sonnet",
  modelSelection: "auto", // Auto-select based on complexity
  budgets: {
    dailyTokenLimit: 10_000_000,
    costAlert: 50, // Alert at $50
    costStop: 100  // Stop at $100
  }
})
```

---

### Team Strategies

```typescript
// SWARM: All agents work in parallel on separate tasks
{
  coordinationStrategy: "swarm",
  useCase: "Code review, testing, parallel work"
}

// PIPELINE: Sequential workflow with handoffs
{
  coordinationStrategy: "pipeline",
  useCase: "Feature development, staged processes"
}

// LEADER: One agent coordinates others
{
  coordinationStrategy: "leader",
  useCase: "Complex orchestration, decision-making"
}

// COUNCIL: Multiple agents propose, best picked
{
  coordinationStrategy: "council",
  useCase: "Architecture decisions, research"
}
```

---

## Best Practices

### ✅ Do

1. **Use appropriate models**
   - Haiku for simple tasks (tests, documentation)
   - Sonnet for most tasks (reviews, implementation)
   - Opus for complex architecture

2. **Set clear task descriptions**
   ```typescript
   // Good
   "Review auth.ts for SQL injection vulnerabilities"

   // Bad
   "Check the code"
   ```

3. **Monitor costs**
   ```typescript
   const metrics = await openclaude.getMetrics()
   console.log(`Cost today: $${metrics.costToday}`)
   ```

4. **Cleanup teams**
   ```typescript
   try {
     const result = await team.execute()
   } finally {
     await team.cleanup() // Always cleanup
   }
   ```

---

### ❌ Don't

1. **Don't spawn unlimited agents**
   ```typescript
   // Bad: Can spawn 1000s of agents
   files.forEach(file => team.spawn(...))

   // Good: Limit parallelism
   team = spawnTeam({ maxParallelism: 5 })
   ```

2. **Don't ignore errors**
   ```typescript
   // Bad
   await agent.execute(task)

   // Good
   try {
     const result = await agent.execute(task)
   } catch (error) {
     console.error(`Agent failed:`, error)
     await agent.shutdown()
   }
   ```

3. **Don't forget dependencies**
   ```typescript
   // Bad: Frontend starts before backend designed
   team.spawn("FrontendDev", { blockedBy: [] })

   // Good: Frontend waits for backend
   team.spawn("FrontendDev", { blockedBy: ["BackendDev"] })
   ```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+T` | Show Team Dashboard |
| `Ctrl+Shift+R` | Review Current File |
| `Ctrl+Shift+G` | Generate Tests |
| `Ctrl+Shift+A` | Ask Codebase Question |
| `Ctrl+Shift+F` | Implement Feature |

---

## Debugging

### Check Team Status

```typescript
const team = openclaude.getTeam(teamId)
console.log({
  status: team.status,
  agents: team.agents.length,
  activeAgents: team.agents.filter(a => a.status === 'busy').length
})
```

### View Agent Logs

```typescript
const agent = openclaude.getAgent(agentId)
const logs = await agent.getLogs()
console.log(logs)
```

### Monitor System Health

```typescript
const metrics = await openclaude.systemMetrics()
console.log({
  activeTeams: metrics.activeTeams,
  activeAgents: metrics.activeAgents,
  avgResponseTime: metrics.avgResponseTime,
  tokensUsed: metrics.totalTokensUsed,
  estimatedCost: metrics.estimatedCost
})
```

---

## Troubleshooting

### Team Won't Start

```typescript
// Check feature availability
if (!openclaude.isMultiAgentAvailable()) {
  console.error('Multi-agent features not available yet')
  console.log('Using simulation mode')
}
```

### Agent Hangs

```typescript
// Set timeout
const agent = await team.spawn({
  name: "Worker",
  type: "developer",
  model: "sonnet",
  timeout: 60000 // 60 seconds
})

// Manual shutdown if needed
await agent.shutdown()
```

### High Costs

```typescript
// Check token usage
const breakdown = await openclaude.getCostBreakdown()
console.log({
  byAgent: breakdown.byAgent,
  byTeam: breakdown.byTeam,
  suggestions: breakdown.optimizations
})

// Optimize: Switch to cheaper models
openclaude.configure({
  defaultModel: "haiku", // Cheaper
  autoOptimize: true
})
```

---

## Examples Repository

More examples at: `openclaude-ide/examples/multi-agent/`

```bash
examples/multi-agent/
├── code-review-swarm.ts     # Complete PR review example
├── feature-factory.ts       # Autonomous feature implementation
├── test-squadron.ts         # Comprehensive testing
├── knowledge-council.ts     # Codebase Q&A
├── self-healing.ts          # Production monitoring
└── project-scaffold.ts      # Project generation
```

---

## Support

**Documentation:**
- Full Architecture: `OPENCLAUDE-MULTI-AGENT-ARCHITECTURE.md`
- Implementation Guide: `OPENCLAUDE-IMPLEMENTATION-GUIDE.md`
- Vision Summary: `OPENCLAUDE-VISION-SUMMARY.md`

**Community:**
- GitHub Issues: github.com/ankr-in/openclaude-ide/issues
- Discord: discord.gg/openclaude
- Documentation: docs.openclaude.ankr.in

**Contact:**
- Email: openclaude@ankr.in
- Website: openclaude.ankr.in

---

## Next Steps

1. ✅ Read this quick start
2. ✅ Review architecture documentation
3. ✅ Try basic examples
4. ✅ Build your first team
5. ✅ Join the community

**Happy multi-agent development! 🚀**
