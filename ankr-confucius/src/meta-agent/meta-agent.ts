/**
 * ANKR-EON Meta-Agent
 * Automatic agent synthesis, evaluation, and refinement
 * 
 * Implements the build-test-improve loop from Confucius SDK
 * to automatically optimize agent configurations.
 * 
 * @package ankr-eon
 * @author ANKR Labs
 */

import { v4 as uuid } from 'uuid';

// ============================================================================
// Types
// ============================================================================

export interface AgentConfig {
  id: string;
  name: string;
  version: string;
  domain: 'tms' | 'wms' | 'oms' | 'general';
  
  // Prompts
  prompts: {
    system: string;
    task_prefix?: string;
    task_suffix?: string;
    error_recovery?: string;
  };
  
  // Extensions to enable
  extensions: string[];
  
  // Memory settings
  memory: {
    compression_threshold_tokens: number;
    retention_window_scopes: number;
    load_domain_notes: boolean;
    load_hindsight_notes: boolean;
    max_loaded_notes: number;
  };
  
  // Tool policies
  tool_policies: ToolPolicy[];
  
  // Execution settings
  execution: {
    max_iterations: number;
    timeout_seconds: number;
    thinking_budget_tokens?: number;
    retry_on_error: boolean;
    max_retries: number;
  };
  
  // Metadata
  created_at: Date;
  updated_at: Date;
  generation: number;
  parent_config_id?: string;
}

export interface ToolPolicy {
  name: string;
  description?: string;
  
  // When to apply this policy
  conditions: {
    task_contains?: string[];
    domain?: string[];
    after_error_type?: string[];
    context_size_above?: number;
  };
  
  // Policy actions
  actions: {
    preferred_tools?: string[];
    avoided_tools?: string[];
    tool_order?: string[];
    retry_strategy?: 'immediate' | 'backoff' | 'skip';
    fallback_tool?: string;
  };
}

export interface Task {
  id: string;
  domain: string;
  description: string;
  expected_outcome?: string;
  validation_criteria?: string[];
  timeout_seconds?: number;
  parameters?: Record<string, any>;
}

export interface EvaluationResult {
  task_id: string;
  config_id: string;
  success: boolean;
  
  // Performance metrics
  turns: number;
  token_usage: number;
  duration_ms: number;
  
  // Quality metrics
  errors: ErrorInfo[];
  warnings: string[];
  
  // Trace for analysis
  trace: ExecutionTrace;
  
  // Validation results
  validation_passed: boolean;
  validation_details?: Record<string, boolean>;
}

export interface ErrorInfo {
  type: string;
  message: string;
  recoverable: boolean;
  recovery_attempted: boolean;
  recovery_succeeded: boolean;
}

export interface ExecutionTrace {
  events: TraceEvent[];
  summary: string;
  decision_points: DecisionPoint[];
}

export interface TraceEvent {
  timestamp: Date;
  type: 'llm_call' | 'tool_call' | 'action' | 'error' | 'recovery';
  data: Record<string, any>;
  duration_ms?: number;
}

export interface DecisionPoint {
  description: string;
  options_considered: string[];
  chosen_option: string;
  rationale?: string;
}

export interface LLMProvider {
  complete(prompt: string): Promise<string>;
}

export interface Evaluator {
  runTask(config: AgentConfig, task: Task): Promise<EvaluationResult>;
  validateOutcome(task: Task, trace: ExecutionTrace): Promise<{
    passed: boolean;
    details: Record<string, boolean>;
  }>;
}

// ============================================================================
// Scoring Functions
// ============================================================================

export interface ScoreWeights {
  success_rate: number;
  efficiency_turns: number;
  efficiency_tokens: number;
  error_recovery: number;
}

const DEFAULT_WEIGHTS: ScoreWeights = {
  success_rate: 0.5,
  efficiency_turns: 0.2,
  efficiency_tokens: 0.15,
  error_recovery: 0.15
};

export function calculateScore(
  results: EvaluationResult[],
  weights: ScoreWeights = DEFAULT_WEIGHTS
): number {
  if (results.length === 0) return 0;

  // Success rate
  const successRate = results.filter(r => r.success).length / results.length;

  // Turn efficiency (lower is better, normalized to 0-1)
  const avgTurns = results.reduce((a, r) => a + r.turns, 0) / results.length;
  const turnEfficiency = Math.max(0, 1 - avgTurns / 100);

  // Token efficiency (lower is better, normalized to 0-1)
  const avgTokens = results.reduce((a, r) => a + r.token_usage, 0) / results.length;
  const tokenEfficiency = Math.max(0, 1 - avgTokens / 100000);

  // Error recovery rate
  const recoveryAttempts = results.flatMap(r => r.errors.filter(e => e.recovery_attempted));
  const recoveryRate = recoveryAttempts.length > 0
    ? recoveryAttempts.filter(e => e.recovery_succeeded).length / recoveryAttempts.length
    : 1; // No errors means perfect recovery

  return (
    successRate * weights.success_rate +
    turnEfficiency * weights.efficiency_turns +
    tokenEfficiency * weights.efficiency_tokens +
    recoveryRate * weights.error_recovery
  );
}

// ============================================================================
// Meta-Agent Implementation
// ============================================================================

export class MetaAgent {
  private llm: LLMProvider;
  private evaluator: Evaluator;
  private configHistory: AgentConfig[] = [];
  private resultHistory: Map<string, EvaluationResult[]> = new Map();

  constructor(llm: LLMProvider, evaluator: Evaluator) {
    this.llm = llm;
    this.evaluator = evaluator;
  }

  /**
   * Main optimization loop: Build -> Test -> Improve
   */
  async optimizeConfig(
    baseConfig: AgentConfig,
    testTasks: Task[],
    options: {
      iterations?: number;
      targetScore?: number;
      weights?: ScoreWeights;
      earlyStopPatience?: number;
    } = {}
  ): Promise<{
    bestConfig: AgentConfig;
    bestScore: number;
    allResults: Map<string, EvaluationResult[]>;
    iterations: number;
  }> {
    const iterations = options.iterations ?? 5;
    const targetScore = options.targetScore ?? 0.95;
    const weights = options.weights ?? DEFAULT_WEIGHTS;
    const patience = options.earlyStopPatience ?? 2;

    let currentConfig = { ...baseConfig, id: uuid(), generation: 0 };
    let bestScore = 0;
    let bestConfig = currentConfig;
    let noImprovementCount = 0;

    console.log(`[META-AGENT] Starting optimization with ${testTasks.length} tasks`);

    for (let i = 0; i < iterations; i++) {
      console.log(`\n[META-AGENT] Iteration ${i + 1}/${iterations}`);

      // EVALUATE: Run all test tasks with current config
      const results = await this.evaluateConfig(currentConfig, testTasks);
      this.resultHistory.set(currentConfig.id, results);
      this.configHistory.push(currentConfig);

      const score = calculateScore(results, weights);
      console.log(`[META-AGENT] Score: ${(score * 100).toFixed(2)}%`);
      console.log(`[META-AGENT] Success rate: ${(results.filter(r => r.success).length / results.length * 100).toFixed(1)}%`);

      // Check if this is the best so far
      if (score > bestScore) {
        bestScore = score;
        bestConfig = { ...currentConfig };
        noImprovementCount = 0;
        console.log(`[META-AGENT] New best score!`);
      } else {
        noImprovementCount++;
      }

      // Check early stopping conditions
      if (score >= targetScore) {
        console.log(`[META-AGENT] Target score reached!`);
        break;
      }

      if (noImprovementCount >= patience) {
        console.log(`[META-AGENT] No improvement for ${patience} iterations, stopping.`);
        break;
      }

      // ANALYZE: Find failures and propose improvements
      const failures = results.filter(r => !r.success);
      if (failures.length > 0) {
        console.log(`[META-AGENT] Analyzing ${failures.length} failures...`);
        currentConfig = await this.proposeImprovements(
          currentConfig,
          failures,
          results
        );
        currentConfig.generation = i + 1;
      } else {
        // All succeeded, try to improve efficiency
        console.log(`[META-AGENT] All tasks succeeded, optimizing efficiency...`);
        currentConfig = await this.optimizeEfficiency(currentConfig, results);
        currentConfig.generation = i + 1;
      }
    }

    return {
      bestConfig,
      bestScore,
      allResults: this.resultHistory,
      iterations: this.configHistory.length
    };
  }

  /**
   * Evaluate a config against test tasks
   */
  private async evaluateConfig(
    config: AgentConfig,
    tasks: Task[]
  ): Promise<EvaluationResult[]> {
    const results: EvaluationResult[] = [];

    for (const task of tasks) {
      try {
        const result = await this.evaluator.runTask(config, task);
        results.push(result);
      } catch (error: any) {
        // Task execution failed entirely
        results.push({
          task_id: task.id,
          config_id: config.id,
          success: false,
          turns: 0,
          token_usage: 0,
          duration_ms: 0,
          errors: [{
            type: 'ExecutionError',
            message: error.message,
            recoverable: false,
            recovery_attempted: false,
            recovery_succeeded: false
          }],
          warnings: [],
          trace: { events: [], summary: 'Execution failed', decision_points: [] },
          validation_passed: false
        });
      }
    }

    return results;
  }

  /**
   * Analyze failures and propose config improvements
   */
  private async proposeImprovements(
    config: AgentConfig,
    failures: EvaluationResult[],
    allResults: EvaluationResult[]
  ): Promise<AgentConfig> {
    const prompt = `You are a meta-agent optimizing an AI agent configuration for logistics tasks.

CURRENT CONFIG:
${JSON.stringify(config, null, 2)}

FAILURES (${failures.length} out of ${allResults.length} tasks):
${failures.map(f => `
Task: ${f.task_id}
Errors: ${f.errors.map(e => `${e.type}: ${e.message}`).join(', ')}
Turns used: ${f.turns}
Tokens used: ${f.token_usage}
Trace summary: ${f.trace.summary}
Decision points: ${f.trace.decision_points.map(d => d.description).join('; ')}
`).join('\n---\n')}

SUCCESSFUL TASKS PATTERNS:
${allResults.filter(r => r.success).slice(0, 3).map(r => `
Task: ${r.task_id}
Turns: ${r.turns}, Tokens: ${r.token_usage}
`).join('\n')}

Analyze the failures and propose SPECIFIC improvements to the configuration.
Focus on:
1. System prompt modifications (be specific about what to add/change)
2. Tool policy adjustments (add new policies or modify existing ones)
3. Memory settings optimization
4. Extension changes (add/remove/reorder)
5. Execution settings tuning

Return a valid JSON object with the improved configuration.
Maintain the same structure as the input config.
Include a "changes_made" field explaining what you changed and why.

Return ONLY valid JSON, no markdown.`;

    const response = await this.llm.complete(prompt);
    
    try {
      const improved = JSON.parse(response);
      
      // Preserve some fields
      improved.id = uuid();
      improved.parent_config_id = config.id;
      improved.updated_at = new Date();
      
      console.log(`[META-AGENT] Changes: ${improved.changes_made || 'Not specified'}`);
      
      return improved;
    } catch {
      console.error('[META-AGENT] Failed to parse improvement suggestions');
      // Return config with minor random perturbation
      return this.perturbConfig(config);
    }
  }

  /**
   * Optimize efficiency when all tasks succeed
   */
  private async optimizeEfficiency(
    config: AgentConfig,
    results: EvaluationResult[]
  ): Promise<AgentConfig> {
    const avgTurns = results.reduce((a, r) => a + r.turns, 0) / results.length;
    const avgTokens = results.reduce((a, r) => a + r.token_usage, 0) / results.length;

    const prompt = `You are a meta-agent optimizing an AI agent for EFFICIENCY.
All tasks are succeeding, but we want to reduce turns and token usage.

CURRENT CONFIG:
${JSON.stringify(config, null, 2)}

CURRENT PERFORMANCE:
- Average turns: ${avgTurns.toFixed(1)}
- Average tokens: ${avgTokens.toFixed(0)}

EXECUTION TRACES (sample):
${results.slice(0, 3).map(r => `
Task: ${r.task_id}
Turns: ${r.turns}, Tokens: ${r.token_usage}
Decision points: ${r.trace.decision_points.length}
`).join('\n')}

Propose changes to reduce turns and token usage WITHOUT sacrificing success rate.
Consider:
1. More concise system prompts
2. Better tool policies to avoid unnecessary tool calls
3. Adjusted compression thresholds
4. Optimized thinking budgets

Return the optimized config as valid JSON only.`;

    const response = await this.llm.complete(prompt);
    
    try {
      const optimized = JSON.parse(response);
      optimized.id = uuid();
      optimized.parent_config_id = config.id;
      optimized.updated_at = new Date();
      return optimized;
    } catch {
      return this.perturbConfig(config);
    }
  }

  /**
   * Random perturbation for exploration
   */
  private perturbConfig(config: AgentConfig): AgentConfig {
    const perturbed = JSON.parse(JSON.stringify(config));
    perturbed.id = uuid();
    perturbed.parent_config_id = config.id;
    perturbed.updated_at = new Date();

    // Random perturbations
    const perturbations = [
      () => { perturbed.memory.compression_threshold_tokens *= (0.8 + Math.random() * 0.4); },
      () => { perturbed.memory.retention_window_scopes = Math.max(1, perturbed.memory.retention_window_scopes + Math.round(Math.random() * 2 - 1)); },
      () => { perturbed.execution.max_iterations = Math.max(10, perturbed.execution.max_iterations + Math.round(Math.random() * 20 - 10)); },
      () => { perturbed.memory.max_loaded_notes = Math.max(5, perturbed.memory.max_loaded_notes + Math.round(Math.random() * 10 - 5)); }
    ];

    // Apply 1-2 random perturbations
    const numPerturbations = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numPerturbations; i++) {
      const idx = Math.floor(Math.random() * perturbations.length);
      perturbations[idx]();
    }

    return perturbed;
  }

  /**
   * Generate a domain-specific agent config
   */
  async generateDomainConfig(
    domain: 'tms' | 'wms' | 'oms',
    baseConfig?: Partial<AgentConfig>
  ): Promise<AgentConfig> {
    const domainPrompts: Record<string, string> = {
      tms: `You are an AI agent specialized in Transportation Management System (TMS) operations for Indian logistics.
Your capabilities include:
- Route optimization considering Indian road conditions, traffic patterns, and toll routes
- Fleet management and vehicle assignment
- Driver communication in Hindi, Tamil, and Telugu
- Real-time tracking and ETA updates
- Cost optimization for fuel, tolls, and time
- Compliance with Indian transport regulations

Always prioritize safety, cost-efficiency, and timely delivery.`,

      wms: `You are an AI agent specialized in Warehouse Management System (WMS) operations.
Your capabilities include:
- Inventory tracking and stock level management
- Order picking optimization
- Storage location assignment
- Inbound/outbound logistics coordination
- Quality control checkpoints
- FIFO/LIFO management

Prioritize accuracy, space utilization, and picking efficiency.`,

      oms: `You are an AI agent specialized in Order Management System (OMS) operations.
Your capabilities include:
- Order lifecycle management
- Multi-channel order aggregation
- Order validation and fraud detection
- Fulfillment routing decisions
- Customer communication
- Returns and refunds processing

Prioritize order accuracy, customer satisfaction, and fulfillment speed.`
    };

    const domainExtensions: Record<string, string[]> = {
      tms: ['route_optimization', 'driver_communication', 'voice_interface', 'observability'],
      wms: ['inventory_management', 'observability'],
      oms: ['inventory_management', 'driver_communication', 'observability']
    };

    const domainPolicies: Record<string, ToolPolicy[]> = {
      tms: [
        {
          name: 'route_first',
          conditions: { task_contains: ['route', 'delivery', 'dispatch'] },
          actions: { preferred_tools: ['route_optimization', 'driver_communication'] }
        },
        {
          name: 'driver_error_recovery',
          conditions: { after_error_type: ['DriverUnreachable', 'CommunicationFailed'] },
          actions: { retry_strategy: 'backoff', fallback_tool: 'voice_interface' }
        }
      ],
      wms: [
        {
          name: 'inventory_check_first',
          conditions: { task_contains: ['stock', 'inventory', 'pick'] },
          actions: { preferred_tools: ['inventory_management'] }
        }
      ],
      oms: [
        {
          name: 'validate_then_fulfill',
          conditions: { task_contains: ['order', 'fulfill'] },
          actions: { tool_order: ['inventory_management', 'route_optimization'] }
        }
      ]
    };

    return {
      id: uuid(),
      name: `${domain.toUpperCase()} Agent`,
      version: '1.0.0',
      domain,
      prompts: {
        system: domainPrompts[domain],
        error_recovery: `An error occurred. Analyze the error, check relevant notes for similar past issues, and attempt recovery.`
      },
      extensions: domainExtensions[domain],
      memory: {
        compression_threshold_tokens: 50000,
        retention_window_scopes: 5,
        load_domain_notes: true,
        load_hindsight_notes: true,
        max_loaded_notes: 20
      },
      tool_policies: domainPolicies[domain],
      execution: {
        max_iterations: 50,
        timeout_seconds: 300,
        retry_on_error: true,
        max_retries: 3
      },
      created_at: new Date(),
      updated_at: new Date(),
      generation: 0,
      ...baseConfig
    };
  }

  /**
   * Get optimization history
   */
  getHistory(): {
    configs: AgentConfig[];
    results: Map<string, EvaluationResult[]>;
  } {
    return {
      configs: [...this.configHistory],
      results: new Map(this.resultHistory)
    };
  }

  /**
   * Export best config for production use
   */
  exportConfig(config: AgentConfig): string {
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import a config
   */
  importConfig(json: string): AgentConfig {
    return JSON.parse(json);
  }
}

// ============================================================================
// Test Task Generator
// ============================================================================

export function generateTestTasks(domain: 'tms' | 'wms' | 'oms', count: number = 10): Task[] {
  const generators: Record<string, () => Task> = {
    tms: () => ({
      id: uuid(),
      domain: 'tms',
      description: [
        'Optimize route from Mumbai to Pune with 3 delivery stops',
        'Dispatch available vehicle for urgent shipment to Delhi',
        'Calculate ETA for truck ID T-1234 currently at Jaipur',
        'Find alternative route avoiding NH48 toll plaza',
        'Assign driver for overnight haul to Chennai',
        'Update customer on delayed delivery for order ORD-5678',
        'Plan multi-stop route for 5 pickups in Bangalore',
        'Calculate fuel cost estimate for Mumbai-Kolkata route',
        'Notify driver about route change due to road closure',
        'Optimize fleet assignment for next day deliveries'
      ][Math.floor(Math.random() * 10)],
      validation_criteria: ['route_generated', 'cost_calculated', 'eta_provided']
    }),
    
    wms: () => ({
      id: uuid(),
      domain: 'wms',
      description: [
        'Check stock level for SKU-12345 across all warehouses',
        'Generate picking list for order batch B-100',
        'Find optimal storage location for incoming shipment',
        'Calculate reorder point for fast-moving items',
        'Perform cycle count for Zone A',
        'Process return for damaged goods RMA-789',
        'Optimize pick path for 20-item order',
        'Update inventory after receiving PO-456',
        'Generate inventory aging report',
        'Reserve stock for priority order'
      ][Math.floor(Math.random() * 10)],
      validation_criteria: ['inventory_checked', 'location_assigned']
    }),
    
    oms: () => ({
      id: uuid(),
      domain: 'oms',
      description: [
        'Process new order from e-commerce channel',
        'Validate payment and fraud check for order ORD-999',
        'Split order for multi-warehouse fulfillment',
        'Handle customer cancellation request',
        'Process partial refund for returned items',
        'Update order status to shipped',
        'Aggregate orders from multiple channels',
        'Handle backorder situation for out-of-stock item',
        'Generate invoice for completed order',
        'Process exchange request'
      ][Math.floor(Math.random() * 10)],
      validation_criteria: ['order_validated', 'status_updated']
    })
  };

  const tasks: Task[] = [];
  for (let i = 0; i < count; i++) {
    tasks.push(generators[domain]());
  }
  return tasks;
}

// ============================================================================
// Mock Evaluator (for testing)
// ============================================================================

export class MockEvaluator implements Evaluator {
  private successRate: number;

  constructor(successRate: number = 0.7) {
    this.successRate = successRate;
  }

  async runTask(config: AgentConfig, task: Task): Promise<EvaluationResult> {
    const success = Math.random() < this.successRate;
    const turns = Math.floor(Math.random() * 50) + 10;
    const tokens = Math.floor(Math.random() * 50000) + 10000;

    return {
      task_id: task.id,
      config_id: config.id,
      success,
      turns,
      token_usage: tokens,
      duration_ms: turns * 500,
      errors: success ? [] : [{
        type: ['ValidationError', 'TimeoutError', 'ToolError'][Math.floor(Math.random() * 3)],
        message: 'Mock error for testing',
        recoverable: Math.random() > 0.5,
        recovery_attempted: true,
        recovery_succeeded: success
      }],
      warnings: [],
      trace: {
        events: [],
        summary: success ? 'Task completed successfully' : 'Task failed',
        decision_points: [
          { description: 'Tool selection', options_considered: ['A', 'B'], chosen_option: 'A' }
        ]
      },
      validation_passed: success
    };
  }

  async validateOutcome(task: Task, trace: ExecutionTrace): Promise<{
    passed: boolean;
    details: Record<string, boolean>;
  }> {
    return {
      passed: trace.summary.includes('successfully'),
      details: {}
    };
  }
}

export default MetaAgent;
