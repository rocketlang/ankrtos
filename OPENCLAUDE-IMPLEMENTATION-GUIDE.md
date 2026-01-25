# OpenClaude Multi-Agent Implementation Guide

**Practical steps to integrate multi-agent orchestration into your existing OpenClaude IDE**

---

## Current Setup Analysis

Based on your existing OpenClaude codebase:

```
openclaude-ide/
├── packages/@openclaude/integration/
│   ├── src/
│   │   ├── browser/           # Frontend (Theia + React)
│   │   ├── common/            # Shared types
│   │   └── node/              # Backend (GraphQL client)
│   └── package.json           # v1.0.0
```

**What You Have:**
- ✅ Theia integration (9,700 LOC)
- ✅ GraphQL backend connection
- ✅ 15 AI-powered features
- ✅ Real-time collaboration
- ✅ 45+ React components

**What You Need:**
- 🔨 TeammateTool API wrapper
- 🔨 Agent orchestration layer
- 🔨 Task coordination system
- 🔨 Multi-agent UI components

---

## Phase 1: Foundation (Days 1-5)

### Day 1: TeammateTool Wrapper

**File:** `packages/@openclaude/integration/src/common/teammate-tool.ts`

```typescript
import { RPCProtocol } from '@theia/plugin-ext/lib/common/rpc-protocol';

export interface TeamConfig {
  name: string;
  description: string;
  coordinationStrategy: 'leader' | 'swarm' | 'pipeline';
  maxParallelism: number;
}

export interface AgentSpec {
  name: string;
  type: string;
  role: 'leader' | 'worker';
  capabilities: string[];
  model: 'sonnet' | 'haiku' | 'opus';
  blockedBy?: string[];
}

export interface Team {
  id: string;
  name: string;
  agents: Map<string, Agent>;
  status: 'active' | 'idle' | 'shutdown';

  spawn(spec: AgentSpec): Promise<Agent>;
  broadcast(message: any): Promise<void>;
  cleanup(): Promise<void>;
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'idle' | 'busy' | 'error';

  execute(task: string): Promise<any>;
  sendMessage(to: string, message: any): Promise<void>;
  shutdown(): Promise<void>;
}

/**
 * TeammateTool API - Wrapper for Claude Code's hidden multi-agent feature
 *
 * When TeammateTool becomes available (feature flags enabled),
 * this wrapper will use the real API. Until then, it simulates
 * the behavior using standard Theia plugin mechanisms.
 */
export class TeammateTool {
  private teams = new Map<string, Team>();
  private rpc?: RPCProtocol;

  constructor() {
    // Check if TeammateTool is available
    if (this.isTeammateTooAvailable()) {
      this.initializeRealAPI();
    } else {
      console.warn('[OpenClaude] TeammateTool not available, using simulation mode');
      this.initializeSimulation();
    }
  }

  private isTeammateTooAvailable(): boolean {
    // Check for TeammateTool availability
    // This will return true when Anthropic enables the feature flags
    return typeof (globalThis as any).TeammateTool !== 'undefined';
  }

  private initializeRealAPI(): void {
    // When available, use real TeammateTool API
    // For now, this is a placeholder
    console.log('[OpenClaude] Using real TeammateTool API');
  }

  private initializeSimulation(): void {
    // Simulate multi-agent behavior using:
    // - Parallel Claude API calls
    // - Task queue management
    // - Message passing between tasks
    console.log('[OpenClaude] Using simulated multi-agent system');
  }

  async spawnTeam(config: TeamConfig): Promise<Team> {
    const teamId = `team-${Date.now()}`;

    const team: Team = {
      id: teamId,
      name: config.name,
      agents: new Map(),
      status: 'active',

      spawn: async (spec: AgentSpec) => {
        return this.spawnAgent(teamId, spec);
      },

      broadcast: async (message: any) => {
        return this.broadcastToTeam(teamId, message);
      },

      cleanup: async () => {
        return this.shutdownTeam(teamId);
      }
    };

    this.teams.set(teamId, team);
    return team;
  }

  private async spawnAgent(teamId: string, spec: AgentSpec): Promise<Agent> {
    const team = this.teams.get(teamId);
    if (!team) throw new Error(`Team ${teamId} not found`);

    const agentId = `agent-${Date.now()}-${spec.name}`;

    const agent: Agent = {
      id: agentId,
      name: spec.name,
      type: spec.type,
      status: 'idle',

      execute: async (task: string) => {
        return this.executeAgentTask(agentId, task, spec.model);
      },

      sendMessage: async (to: string, message: any) => {
        return this.sendAgentMessage(agentId, to, message);
      },

      shutdown: async () => {
        return this.shutdownAgent(agentId);
      }
    };

    team.agents.set(agentId, agent);
    return agent;
  }

  private async executeAgentTask(
    agentId: string,
    task: string,
    model: string
  ): Promise<any> {
    // In simulation mode: Make direct Claude API call
    // In real mode: Use TeammateTool RPC

    // For now, delegate to your existing OpenClaude backend
    return this.callClaudeAPI(task, model);
  }

  private async callClaudeAPI(prompt: string, model: string): Promise<any> {
    // Use your existing GraphQL backend
    // This is where you'd integrate with your current
    // OpenClaudeBackendService

    throw new Error('Integrate with existing OpenClaude backend');
  }

  private async broadcastToTeam(teamId: string, message: any): Promise<void> {
    const team = this.teams.get(teamId);
    if (!team) return;

    // Send message to all agents in team
    const promises = Array.from(team.agents.values()).map(agent =>
      this.sendAgentMessage('system', agent.id, message)
    );

    await Promise.all(promises);
  }

  private async sendAgentMessage(
    from: string,
    to: string,
    message: any
  ): Promise<void> {
    // Message passing between agents
    // Could use Redis pub/sub or in-memory queue
    console.log(`[Message] ${from} -> ${to}:`, message);
  }

  private async shutdownAgent(agentId: string): Promise<void> {
    // Cleanup agent resources
    for (const [teamId, team] of this.teams.entries()) {
      if (team.agents.has(agentId)) {
        team.agents.delete(agentId);
        break;
      }
    }
  }

  private async shutdownTeam(teamId: string): Promise<void> {
    const team = this.teams.get(teamId);
    if (!team) return;

    // Shutdown all agents
    const shutdownPromises = Array.from(team.agents.keys()).map(agentId =>
      this.shutdownAgent(agentId)
    );

    await Promise.all(shutdownPromises);

    team.status = 'shutdown';
    this.teams.delete(teamId);
  }

  // Public API
  discoverTeams(): Team[] {
    return Array.from(this.teams.values());
  }

  getTeam(teamId: string): Team | undefined {
    return this.teams.get(teamId);
  }
}

// Singleton instance
export const teammateTool = new TeammateTool();
```

---

### Day 2: Agent Orchestrator Service

**File:** `packages/@openclaude/integration/src/node/agent-orchestrator.ts`

```typescript
import { injectable } from '@theia/core/shared/inversify';
import { teammateTool, TeamConfig, AgentSpec, Team, Agent } from '../common/teammate-tool';

export interface OrchestrationResult {
  teamId: string;
  results: Map<string, any>;
  metrics: {
    totalTime: number;
    agentsUsed: number;
    tokensUsed: number;
  };
}

@injectable()
export class AgentOrchestrator {
  /**
   * Code Review Swarm - Multi-perspective PR review
   */
  async reviewPullRequest(prNumber: number, files: string[]): Promise<OrchestrationResult> {
    const startTime = Date.now();

    // Spawn review team
    const team = await teammateTool.spawnTeam({
      name: `pr-review-${prNumber}`,
      description: 'Multi-agent code review',
      coordinationStrategy: 'swarm',
      maxParallelism: 5
    });

    // Spawn specialized reviewers
    const securityAgent = await team.spawn({
      name: 'SecuritySentinel',
      type: 'security-reviewer',
      role: 'worker',
      capabilities: ['vulnerability-scan', 'auth-check', 'input-validation'],
      model: 'sonnet'
    });

    const performanceAgent = await team.spawn({
      name: 'PerformanceOracle',
      type: 'performance-reviewer',
      role: 'worker',
      capabilities: ['n-plus-one-detection', 'memory-leak-check', 'complexity-analysis'],
      model: 'sonnet'
    });

    const architectAgent = await team.spawn({
      name: 'ArchitectGuardian',
      type: 'architecture-reviewer',
      role: 'worker',
      capabilities: ['pattern-validation', 'solid-principles', 'layer-boundaries'],
      model: 'sonnet'
    });

    const testAgent = await team.spawn({
      name: 'TestCoverageAnalyst',
      type: 'test-reviewer',
      role: 'worker',
      capabilities: ['coverage-check', 'test-quality', 'edge-cases'],
      model: 'haiku' // Cheaper model for simpler task
    });

    const docAgent = await team.spawn({
      name: 'DocumentationScribe',
      type: 'documentation-reviewer',
      role: 'worker',
      capabilities: ['comment-check', 'api-docs', 'readme-validation'],
      model: 'haiku'
    });

    // Execute reviews in parallel
    const reviewPromises = [
      securityAgent.execute(`Review PR #${prNumber} for security issues:\n${files.join('\n')}`),
      performanceAgent.execute(`Analyze PR #${prNumber} for performance:\n${files.join('\n')}`),
      architectAgent.execute(`Check PR #${prNumber} architecture:\n${files.join('\n')}`),
      testAgent.execute(`Verify PR #${prNumber} test coverage:\n${files.join('\n')}`),
      docAgent.execute(`Review PR #${prNumber} documentation:\n${files.join('\n')}`)
    ];

    const results = await Promise.all(reviewPromises);

    // Collect results
    const resultMap = new Map<string, any>();
    resultMap.set('security', results[0]);
    resultMap.set('performance', results[1]);
    resultMap.set('architecture', results[2]);
    resultMap.set('testing', results[3]);
    resultMap.set('documentation', results[4]);

    // Cleanup
    await team.cleanup();

    return {
      teamId: team.id,
      results: resultMap,
      metrics: {
        totalTime: Date.now() - startTime,
        agentsUsed: 5,
        tokensUsed: 0 // TODO: Track from API calls
      }
    };
  }

  /**
   * Feature Development Team - Autonomous implementation
   */
  async implementFeature(description: string): Promise<OrchestrationResult> {
    const startTime = Date.now();

    const team = await teammateTool.spawnTeam({
      name: `feature-${Date.now()}`,
      description: 'Feature implementation team',
      coordinationStrategy: 'pipeline',
      maxParallelism: 3
    });

    // Phase 1: Architecture (blocking)
    const architect = await team.spawn({
      name: 'Architect',
      type: 'architect',
      role: 'leader',
      capabilities: ['system-design', 'spec-creation', 'interface-definition'],
      model: 'sonnet'
    });

    const architecturePlan = await architect.execute(
      `Design architecture for: ${description}`
    );

    // Phase 2: Parallel Implementation
    const backendDev = await team.spawn({
      name: 'BackendDev',
      type: 'backend-developer',
      role: 'worker',
      capabilities: ['api-implementation', 'database-schema', 'business-logic'],
      model: 'sonnet',
      blockedBy: ['Architect']
    });

    const frontendDev = await team.spawn({
      name: 'FrontendDev',
      type: 'frontend-developer',
      role: 'worker',
      capabilities: ['ui-components', 'state-management', 'responsive-layout'],
      model: 'sonnet',
      blockedBy: ['Architect']
    });

    const implementationPromises = [
      backendDev.execute(`Implement backend based on plan: ${JSON.stringify(architecturePlan)}`),
      frontendDev.execute(`Implement frontend based on plan: ${JSON.stringify(architecturePlan)}`)
    ];

    const implementations = await Promise.all(implementationPromises);

    // Phase 3: Testing
    const testEngineer = await team.spawn({
      name: 'TestEngineer',
      type: 'test-engineer',
      role: 'worker',
      capabilities: ['unit-tests', 'integration-tests', 'e2e-tests'],
      model: 'haiku',
      blockedBy: ['BackendDev', 'FrontendDev']
    });

    const tests = await testEngineer.execute(
      `Write tests for implementations: ${JSON.stringify(implementations)}`
    );

    const resultMap = new Map<string, any>();
    resultMap.set('architecture', architecturePlan);
    resultMap.set('backend', implementations[0]);
    resultMap.set('frontend', implementations[1]);
    resultMap.set('tests', tests);

    await team.cleanup();

    return {
      teamId: team.id,
      results: resultMap,
      metrics: {
        totalTime: Date.now() - startTime,
        agentsUsed: 4,
        tokensUsed: 0
      }
    };
  }

  /**
   * Testing QA Squad - Comprehensive testing
   */
  async runComprehensiveTests(targetFiles: string[]): Promise<OrchestrationResult> {
    const startTime = Date.now();

    const team = await teammateTool.spawnTeam({
      name: `qa-${Date.now()}`,
      description: 'QA testing squad',
      coordinationStrategy: 'swarm',
      maxParallelism: 4
    });

    // Create task queue
    const taskQueue = targetFiles.map(file => ({
      type: 'test-file',
      target: file,
      status: 'pending'
    }));

    // Spawn worker agents
    const workers = await Promise.all([
      team.spawn({
        name: 'UnitTester1',
        type: 'unit-test-generator',
        role: 'worker',
        capabilities: ['jest', 'vitest', 'coverage'],
        model: 'haiku'
      }),
      team.spawn({
        name: 'UnitTester2',
        type: 'unit-test-generator',
        role: 'worker',
        capabilities: ['jest', 'vitest', 'coverage'],
        model: 'haiku'
      }),
      team.spawn({
        name: 'IntegrationTester',
        type: 'integration-tester',
        role: 'worker',
        capabilities: ['api-testing', 'database-testing'],
        model: 'haiku'
      }),
      team.spawn({
        name: 'E2ETester',
        type: 'e2e-tester',
        role: 'worker',
        capabilities: ['playwright', 'cypress'],
        model: 'sonnet'
      })
    ]);

    // Workers claim tasks from queue (simulated self-organization)
    const testPromises = workers.map(worker =>
      this.runWorkerLoop(worker, taskQueue)
    );

    const workerResults = await Promise.all(testPromises);

    const resultMap = new Map<string, any>();
    workerResults.forEach((result, index) => {
      resultMap.set(`worker-${index}`, result);
    });

    await team.cleanup();

    return {
      teamId: team.id,
      results: resultMap,
      metrics: {
        totalTime: Date.now() - startTime,
        agentsUsed: workers.length,
        tokensUsed: 0
      }
    };
  }

  private async runWorkerLoop(worker: Agent, taskQueue: any[]): Promise<any> {
    const results = [];

    while (taskQueue.length > 0) {
      // Claim next available task
      const task = taskQueue.shift();
      if (!task) break;

      task.status = 'in_progress';

      try {
        const result = await worker.execute(
          `Generate tests for: ${task.target}`
        );

        task.status = 'completed';
        results.push({ task: task.target, result });
      } catch (error) {
        task.status = 'failed';
        results.push({ task: task.target, error });
      }
    }

    return results;
  }
}
```

---

### Day 3: GraphQL Schema Extensions

**File:** `backend/graphql/schema/multi-agent.graphql`

```graphql
# Team Management
type Team {
  id: ID!
  name: String!
  description: String
  status: TeamStatus!
  agents: [Agent!]!
  createdAt: DateTime!
  metrics: TeamMetrics
}

enum TeamStatus {
  ACTIVE
  IDLE
  SHUTDOWN
}

type TeamMetrics {
  agentsActive: Int!
  tasksCompleted: Int!
  totalTokensUsed: Int!
  avgResponseTime: Float!
}

# Agent Management
type Agent {
  id: ID!
  name: String!
  type: String!
  role: AgentRole!
  status: AgentStatus!
  capabilities: [String!]!
  model: AIModel!
  metrics: AgentMetrics
}

enum AgentRole {
  LEADER
  WORKER
  SPECIALIST
}

enum AgentStatus {
  IDLE
  BUSY
  ERROR
  SHUTDOWN
}

enum AIModel {
  SONNET
  HAIKU
  OPUS
}

type AgentMetrics {
  tasksCompleted: Int!
  tasksFailed: Int!
  avgTaskDuration: Float!
  tokensUsed: Int!
  successRate: Float!
}

# Orchestration Results
type OrchestrationResult {
  teamId: ID!
  results: JSON!
  metrics: ResultMetrics!
}

type ResultMetrics {
  totalTime: Int!
  agentsUsed: Int!
  tokensUsed: Int!
  costEstimate: Float
}

# Inputs
input TeamConfigInput {
  name: String!
  description: String
  coordinationStrategy: CoordinationStrategy!
  maxParallelism: Int!
}

enum CoordinationStrategy {
  LEADER
  SWARM
  PIPELINE
  COUNCIL
}

input AgentSpecInput {
  name: String!
  type: String!
  role: AgentRole!
  capabilities: [String!]!
  model: AIModel!
  blockedBy: [String!]
}

# Mutations
extend type Mutation {
  # Code Review
  reviewPullRequest(
    prNumber: Int!
    files: [String!]!
  ): OrchestrationResult!

  # Feature Development
  implementFeature(
    description: String!
  ): OrchestrationResult!

  # Comprehensive Testing
  runComprehensiveTests(
    targetFiles: [String!]!
  ): OrchestrationResult!

  # Team Management
  spawnTeam(config: TeamConfigInput!): Team!
  shutdownTeam(teamId: ID!): Boolean!

  # Agent Management
  spawnAgent(teamId: ID!, spec: AgentSpecInput!): Agent!
  shutdownAgent(agentId: ID!): Boolean!
}

# Queries
extend type Query {
  # Team queries
  teams(status: TeamStatus): [Team!]!
  team(id: ID!): Team

  # Agent queries
  agents(teamId: ID, status: AgentStatus): [Agent!]!
  agent(id: ID!): Agent

  # System metrics
  systemMetrics: SystemMetrics!
}

type SystemMetrics {
  activeTeams: Int!
  activeAgents: Int!
  totalTasksCompleted: Int!
  avgResponseTime: Float!
  totalTokensUsed: Int!
  estimatedCost: Float!
}

# Subscriptions
extend type Subscription {
  teamStatusChanged(teamId: ID!): Team!
  agentStatusChanged(agentId: ID!): Agent!
  orchestrationProgress(teamId: ID!): OrchestrationProgress!
}

type OrchestrationProgress {
  teamId: ID!
  status: String!
  progress: Float! # 0.0 to 1.0
  currentStep: String
  agentUpdates: [AgentUpdate!]!
}

type AgentUpdate {
  agentId: ID!
  agentName: String!
  status: AgentStatus!
  currentTask: String
  progress: Float
}
```

---

### Day 4-5: UI Components

**File:** `packages/@openclaude/integration/src/browser/multi-agent/team-dashboard-widget.tsx`

```typescript
import * as React from 'react';
import { injectable } from '@theia/core/shared/inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { Message } from '@theia/core/lib/browser';

interface TeamDashboardState {
  teams: Team[];
  selectedTeam?: Team;
  metrics: SystemMetrics | null;
}

@injectable()
export class TeamDashboardWidget extends ReactWidget {
  static readonly ID = 'openclaude-team-dashboard';
  static readonly LABEL = 'Team Dashboard';

  protected state: TeamDashboardState = {
    teams: [],
    metrics: null
  };

  constructor() {
    super();
    this.id = TeamDashboardWidget.ID;
    this.title.label = TeamDashboardWidget.LABEL;
    this.title.caption = TeamDashboardWidget.LABEL;
    this.title.closable = true;
    this.title.iconClass = 'fa fa-users';

    this.loadTeams();
    this.loadMetrics();
  }

  protected async loadTeams(): Promise<void> {
    // Query teams from GraphQL backend
    const teams = await this.queryTeams();
    this.setState({ teams });
  }

  protected async loadMetrics(): Promise<void> {
    // Query system metrics
    const metrics = await this.queryMetrics();
    this.setState({ metrics });
  }

  protected async queryTeams(): Promise<Team[]> {
    // TODO: Integrate with GraphQL backend
    return [];
  }

  protected async queryMetrics(): Promise<SystemMetrics> {
    // TODO: Integrate with GraphQL backend
    return {
      activeTeams: 0,
      activeAgents: 0,
      totalTasksCompleted: 0,
      avgResponseTime: 0,
      totalTokensUsed: 0,
      estimatedCost: 0
    };
  }

  protected setState(partial: Partial<TeamDashboardState>): void {
    this.state = { ...this.state, ...partial };
    this.update();
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.loadTeams();
    this.loadMetrics();
  }

  protected render(): React.ReactNode {
    return (
      <div className="openclaude-team-dashboard">
        <div className="dashboard-header">
          <h2>Multi-Agent Teams</h2>
          <button onClick={() => this.createNewTeam()}>
            <i className="fa fa-plus" /> New Team
          </button>
        </div>

        <div className="system-metrics">
          {this.renderSystemMetrics()}
        </div>

        <div className="teams-list">
          {this.state.teams.map(team => this.renderTeamCard(team))}
        </div>

        {this.state.selectedTeam && (
          <div className="team-details">
            {this.renderTeamDetails(this.state.selectedTeam)}
          </div>
        )}
      </div>
    );
  }

  protected renderSystemMetrics(): React.ReactNode {
    const { metrics } = this.state;
    if (!metrics) return <div>Loading metrics...</div>;

    return (
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-value">{metrics.activeTeams}</div>
          <div className="metric-label">Active Teams</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{metrics.activeAgents}</div>
          <div className="metric-label">Active Agents</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{metrics.totalTasksCompleted}</div>
          <div className="metric-label">Tasks Completed</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {metrics.avgResponseTime.toFixed(2)}s
          </div>
          <div className="metric-label">Avg Response Time</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {(metrics.totalTokensUsed / 1000).toFixed(1)}K
          </div>
          <div className="metric-label">Tokens Used</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            ${metrics.estimatedCost.toFixed(2)}
          </div>
          <div className="metric-label">Estimated Cost</div>
        </div>
      </div>
    );
  }

  protected renderTeamCard(team: Team): React.ReactNode {
    return (
      <div
        key={team.id}
        className={`team-card ${this.state.selectedTeam?.id === team.id ? 'selected' : ''}`}
        onClick={() => this.selectTeam(team)}
      >
        <div className="team-header">
          <h3>{team.name}</h3>
          <span className={`status-badge ${team.status.toLowerCase()}`}>
            {team.status}
          </span>
        </div>
        <div className="team-stats">
          <div className="stat">
            <i className="fa fa-robot" />
            <span>{team.agents.length} agents</span>
          </div>
          {team.metrics && (
            <>
              <div className="stat">
                <i className="fa fa-check" />
                <span>{team.metrics.tasksCompleted} tasks</span>
              </div>
              <div className="stat">
                <i className="fa fa-clock" />
                <span>{team.metrics.avgResponseTime.toFixed(1)}s avg</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  protected renderTeamDetails(team: Team): React.ReactNode {
    return (
      <div className="team-details-panel">
        <div className="panel-header">
          <h3>{team.name}</h3>
          <div className="panel-actions">
            <button onClick={() => this.shutdownTeam(team.id)}>
              <i className="fa fa-power-off" /> Shutdown
            </button>
          </div>
        </div>

        <div className="agents-section">
          <h4>Active Agents</h4>
          <div className="agents-grid">
            {team.agents.map(agent => this.renderAgentCard(agent))}
          </div>
        </div>

        {team.metrics && (
          <div className="metrics-section">
            <h4>Team Metrics</h4>
            {this.renderTeamMetrics(team.metrics)}
          </div>
        )}
      </div>
    );
  }

  protected renderAgentCard(agent: Agent): React.ReactNode {
    return (
      <div key={agent.id} className="agent-card">
        <div className="agent-header">
          <div className="agent-icon">
            <i className="fa fa-robot" />
          </div>
          <div className="agent-info">
            <div className="agent-name">{agent.name}</div>
            <div className="agent-type">{agent.type}</div>
          </div>
          <span className={`status-indicator ${agent.status.toLowerCase()}`} />
        </div>

        <div className="agent-details">
          <div className="detail-row">
            <span className="label">Role:</span>
            <span className="value">{agent.role}</span>
          </div>
          <div className="detail-row">
            <span className="label">Model:</span>
            <span className="value">{agent.model}</span>
          </div>
        </div>

        <div className="agent-capabilities">
          {agent.capabilities.map(cap => (
            <span key={cap} className="capability-badge">{cap}</span>
          ))}
        </div>

        {agent.metrics && (
          <div className="agent-metrics">
            <div className="mini-stat">
              <i className="fa fa-check" />
              {agent.metrics.tasksCompleted} tasks
            </div>
            <div className="mini-stat">
              <i className="fa fa-chart-line" />
              {(agent.metrics.successRate * 100).toFixed(0)}% success
            </div>
          </div>
        )}
      </div>
    );
  }

  protected renderTeamMetrics(metrics: TeamMetrics): React.ReactNode {
    return (
      <div className="metrics-details">
        <div className="metric-row">
          <span className="metric-label">Active Agents:</span>
          <span className="metric-value">{metrics.agentsActive}</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Tasks Completed:</span>
          <span className="metric-value">{metrics.tasksCompleted}</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Tokens Used:</span>
          <span className="metric-value">
            {(metrics.totalTokensUsed / 1000).toFixed(1)}K
          </span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Avg Response Time:</span>
          <span className="metric-value">
            {metrics.avgResponseTime.toFixed(2)}s
          </span>
        </div>
      </div>
    );
  }

  protected selectTeam(team: Team): void {
    this.setState({ selectedTeam: team });
  }

  protected async createNewTeam(): Promise<void> {
    // TODO: Show create team dialog
    console.log('Create new team');
  }

  protected async shutdownTeam(teamId: string): Promise<void> {
    // TODO: Confirm and shutdown team
    console.log('Shutdown team:', teamId);
  }
}
```

---

## Integration Checklist

### ✅ Backend (GraphQL Server)
- [ ] Add `multi-agent.graphql` schema
- [ ] Implement `AgentOrchestrator` resolvers
- [ ] Add TeammateTool wrapper
- [ ] Configure Redis/message queue for agent communication
- [ ] Add cost tracking and token budgeting

### ✅ Frontend (Theia Extension)
- [ ] Register `TeamDashboardWidget`
- [ ] Add menu items and commands
- [ ] Integrate with existing OpenClaude backend
- [ ] Add GraphQL subscriptions for real-time updates
- [ ] Style multi-agent components

### ✅ Testing
- [ ] Unit tests for `TeammateTool` wrapper
- [ ] Integration tests for `AgentOrchestrator`
- [ ] E2E tests for multi-agent workflows
- [ ] Performance tests (parallel execution)
- [ ] Cost estimation tests

### ✅ Documentation
- [ ] API reference for multi-agent features
- [ ] User guide with examples
- [ ] Video tutorial (creating first team)
- [ ] Architecture documentation

---

## Next Steps

1. **Immediate:** Clone this architecture into `openclaude-ide/`
2. **Week 1:** Implement TeammateTool wrapper (simulation mode)
3. **Week 2:** Add AgentOrchestrator service
4. **Week 3:** Build Team Dashboard widget
5. **Week 4:** Integration testing and refinement

**When TeammateTool becomes available:**
- Update `TeammateTool.isTeammateTooAvailable()` detection
- Implement `TeammateTool.initializeRealAPI()`
- Switch from simulation to real multi-agent execution
- Deploy to production

---

## Resources

- **Current OpenClaude:** `/root/openclaude-ide/`
- **Architecture Doc:** `/root/OPENCLAUDE-MULTI-AGENT-ARCHITECTURE.md`
- **TeammateTool Gist:** https://gist.github.com/kieranklaassen/...
- **Claude Code API:** https://code.claude.com/docs/

**Questions? Issues?**
Open an issue at: github.com/ankr-in/openclaude-ide/issues

🚀 **Ready to build the future!**
