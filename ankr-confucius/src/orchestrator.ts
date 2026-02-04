/**
 * ANKR-EON Unified Orchestrator
 * Main execution loop integrating all components
 * 
 * Inspired by Confucius SDK's orchestrator architecture
 * 
 * @package ankr-eon
 * @author ANKR Labs
 */

import { v4 as uuid } from 'uuid';
import { Pool } from 'pg';

import HierarchicalMemoryManager, { MemoryScope, Artifact } from './memory/hierarchical-memory';
import NoteTakingAgent, { NoteStorage, NoteLoader, Trajectory, TrajectoryEvent } from './notes/note-taking-agent';
import ExtensionRegistry, { 
  RunContext, 
  Message, 
  Action, 
  ActionResult,
  IOInterface,
  ArtifactStore,
  createLogisticsExtensionRegistry
} from './extensions/extension-system';
import { AgentConfig } from './meta-agent/meta-agent';

// ============================================================================
// Types
// ============================================================================

export interface Task {
  id: string;
  domain: string;
  description: string;
  parameters?: Record<string, any>;
  timeout_ms?: number;
}

export interface OrchestratorResult {
  task_id: string;
  success: boolean;
  iterations: number;
  total_tokens: number;
  duration_ms: number;
  artifacts: Artifact[];
  final_output?: string;
  error?: string;
}

export interface OrchestratorConfig {
  max_iterations: number;
  compression_check_interval: number;
  generate_notes: boolean;
  verbose: boolean;
}

export interface LLMProvider {
  complete(messages: Message[]): Promise<{
    text: string;
    tokens_used: number;
    finish_reason: string;
  }>;
  estimateTokens(text: string): number;
}

// ============================================================================
// Simple Artifact Store Implementation
// ============================================================================

class SimpleArtifactStore implements ArtifactStore {
  private store: Map<string, any> = new Map();

  async save(key: string, value: any): Promise<void> {
    this.store.set(key, value);
  }

  async get(key: string): Promise<any> {
    return this.store.get(key);
  }

  async list(prefix?: string): Promise<string[]> {
    const keys = Array.from(this.store.keys());
    if (prefix) {
      return keys.filter(k => k.startsWith(prefix));
    }
    return keys;
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }
}

// ============================================================================
// Console IO Implementation
// ============================================================================

class ConsoleIO implements IOInterface {
  async send(message: string): Promise<void> {
    console.log(`[AGENT OUTPUT] ${message}`);
  }

  async receive(): Promise<string> {
    // In production, this would wait for user input
    return '';
  }

  async sendStructured(data: Record<string, any>): Promise<void> {
    console.log(`[STRUCTURED] ${JSON.stringify(data)}`);
  }
}

// ============================================================================
// Main Orchestrator
// ============================================================================

export class ANKROrchestrator {
  private llm: LLMProvider;
  private extensionRegistry: ExtensionRegistry;
  private memory: HierarchicalMemoryManager;
  private noteStorage: NoteStorage;
  private noteLoader: NoteLoader;
  private noteTakingAgent: NoteTakingAgent;
  private config: OrchestratorConfig;
  private agentConfig?: AgentConfig;

  constructor(
    pool: Pool,
    llm: LLMProvider,
    options: {
      extensionRegistry?: ExtensionRegistry;
      config?: Partial<OrchestratorConfig>;
      agentConfig?: AgentConfig;
    } = {}
  ) {
    this.llm = llm;
    this.extensionRegistry = options.extensionRegistry || createLogisticsExtensionRegistry();
    this.memory = new HierarchicalMemoryManager(pool, {
      complete: async (prompt: string) => {
        const result = await llm.complete([{ role: 'user', content: prompt }]);
        return result.text;
      },
      estimateTokens: llm.estimateTokens.bind(llm)
    });
    this.noteStorage = new NoteStorage(pool);
    this.noteLoader = new NoteLoader(this.noteStorage);
    this.noteTakingAgent = new NoteTakingAgent(
      {
        complete: async (prompt: string) => {
          const result = await llm.complete([{ role: 'user', content: prompt }]);
          return result.text;
        }
      },
      this.noteStorage
    );
    this.config = {
      max_iterations: 100,
      compression_check_interval: 10,
      generate_notes: true,
      verbose: false,
      ...options.config
    };
    this.agentConfig = options.agentConfig;
  }

  /**
   * Main execution loop
   */
  async run(task: Task): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const sessionId = uuid();
    let totalTokens = 0;
    let finalOutput: string | undefined;
    let error: string | undefined;

    // Track trajectory for note generation
    const trajectory: Trajectory = {
      session_id: sessionId,
      domain: task.domain,
      task_description: task.description,
      events: [],
      outcome: 'failure'
    };

    try {
      // Initialize context
      const context = await this.initializeContext(sessionId, task);

      // Create session and task scopes
      const sessionScope = await this.memory.createScope(sessionId, 'session');
      const taskScope = await this.memory.createScope(sessionId, 'task', sessionScope.id);

      // Load relevant notes
      const notes = await this.noteLoader.loadForSession({
        domain: task.domain,
        taskDescription: task.description
      });
      context.sessionStorage.set('loaded_notes', notes);

      // Build initial system message
      const systemMessage = this.buildSystemMessage(task, notes);

      // Initialize extensions
      await this.extensionRegistry.initialize(context);

      let iteration = 0;
      let completed = false;
      const messages: Message[] = [
        { role: 'system', content: systemMessage },
        { role: 'user', content: task.description }
      ];

      // Main loop
      while (iteration < this.config.max_iterations && !completed) {
        iteration++;

        if (this.config.verbose) {
          console.log(`\n[ITERATION ${iteration}]`);
        }

        // Pre-process messages through extensions
        const processedResults = await this.extensionRegistry.executeCallbacks(
          'on_input_messages',
          messages,
          context
        );
        const finalMessages: Message[] = processedResults.length > 0 
          ? (processedResults[processedResults.length - 1] as Message[])
          : messages;

        // Call LLM
        const llmResult = await this.llm.complete(finalMessages);
        totalTokens += llmResult.tokens_used;

        // Track event
        trajectory.events.push({
          type: 'llm_output',
          timestamp: new Date(),
          content: { text: llmResult.text.substring(0, 500) }
        });

        // Post-process through extensions
        await this.extensionRegistry.executeCallbacks(
          'on_llm_output',
          {
            text: llmResult.text,
            tokens_used: llmResult.tokens_used,
            finish_reason: llmResult.finish_reason
          },
          context
        );

        // Parse actions from LLM output
        const actions = await this.parseActions(llmResult.text, context);

        if (actions.length === 0) {
          // No actions = task complete
          completed = true;
          finalOutput = llmResult.text;
          trajectory.outcome = 'success';
          break;
        }

        // Execute actions
        for (const action of actions) {
          const result = await this.executeAction(action, context);

          // Record artifact
          await this.memory.recordArtifact(taskScope.id, {
            artifact_type: 'action_result',
            content: { action, result },
            importance_score: result.success ? 0.5 : 0.8
          });

          // Track event
          trajectory.events.push({
            type: 'action',
            timestamp: new Date(),
            content: { action: action.type, success: result.success }
          });

          // Add result to messages
          messages.push({
            role: 'assistant',
            content: llmResult.text
          });
          messages.push({
            role: 'user',
            content: `Action result: ${JSON.stringify(result)}`
          });

          // Handle errors
          if (!result.success) {
            trajectory.events.push({
              type: 'error',
              timestamp: new Date(),
              content: { 
                type: 'ActionError',
                message: result.error || 'Unknown error',
                components: [action.type]
              }
            });
          }
        }

        // Check for compression
        if (iteration % this.config.compression_check_interval === 0) {
          await this.memory.checkAndCompress(taskScope.id);
        }

        // Check timeout
        if (task.timeout_ms && Date.now() - startTime > task.timeout_ms) {
          error = 'Task timeout';
          trajectory.outcome = 'failure';
          break;
        }
      }

      if (iteration >= this.config.max_iterations) {
        error = 'Max iterations reached';
        trajectory.outcome = 'partial';
      }

      // Get artifacts
      const artifacts = await this.memory.getArtifacts(taskScope.id);

      // Generate notes asynchronously
      if (this.config.generate_notes) {
        this.generateNotes(trajectory).catch(err => {
          console.error('[NOTE GENERATION ERROR]', err);
        });
      }

      // Cleanup
      await this.extensionRegistry.cleanup();

      return {
        task_id: task.id,
        success: trajectory.outcome === 'success',
        iterations: iteration,
        total_tokens: totalTokens,
        duration_ms: Date.now() - startTime,
        artifacts,
        final_output: finalOutput,
        error
      };

    } catch (err: any) {
      trajectory.outcome = 'failure';
      trajectory.events.push({
        type: 'error',
        timestamp: new Date(),
        content: { type: 'SystemError', message: err.message }
      });

      // Still try to generate notes
      if (this.config.generate_notes) {
        this.generateNotes(trajectory).catch(() => {});
      }

      return {
        task_id: task.id,
        success: false,
        iterations: 0,
        total_tokens: totalTokens,
        duration_ms: Date.now() - startTime,
        artifacts: [],
        error: err.message
      };
    }
  }

  /**
   * Initialize run context
   */
  private async initializeContext(sessionId: string, task: Task): Promise<RunContext> {
    return {
      session_id: sessionId,
      io: new ConsoleIO(),
      sessionStorage: new Map<string, any>([
        ['task', task],
        ['domain', task.domain]
      ]),
      hierarchicalMemory: this.memory,
      artifactStore: new SimpleArtifactStore(),
      noteStorage: this.noteStorage
    };
  }

  /**
   * Build system message with context
   */
  private buildSystemMessage(
    task: Task,
    notes: Awaited<ReturnType<NoteLoader['loadForSession']>>
  ): string {
    const parts: string[] = [];

    // Base system prompt
    if (this.agentConfig?.prompts.system) {
      parts.push(this.agentConfig.prompts.system);
    } else {
      parts.push(`You are an AI agent for ANKR Labs logistics operations.
Domain: ${task.domain.toUpperCase()}

You can perform actions by outputting XML-style tags:
<action_name>{"param": "value"}</action_name>

Available actions:
- <optimize_route>{"origin": "...", "destination": "...", "waypoints": [...]}</optimize_route>
- <check_inventory>{"sku": "...", "warehouse": "..."}</check_inventory>
- <notify_driver>{"driver_id": "...", "message": "...", "priority": "normal|high"}</notify_driver>

When you have completed the task, respond without any action tags.`);
    }

    // Add loaded notes context
    const notesContext = this.noteLoader.formatNotesForContext(notes);
    if (notesContext) {
      parts.push('\n---\nRELEVANT KNOWLEDGE FROM PAST SESSIONS:\n' + notesContext);
    }

    // Add task prefix if configured
    if (this.agentConfig?.prompts.task_prefix) {
      parts.push('\n---\n' + this.agentConfig.prompts.task_prefix);
    }

    return parts.join('\n');
  }

  /**
   * Parse actions from LLM output
   */
  private async parseActions(text: string, context: RunContext): Promise<Action[]> {
    const actions: Action[] = [];

    // Parse XML-style tags
    const tagPattern = /<(\w+)>([\s\S]*?)<\/\1>/g;
    let match;

    while ((match = tagPattern.exec(text)) !== null) {
      const [, tag, content] = match;

      // Let extensions handle tag parsing
      const extensionResults = await this.extensionRegistry.executeCallbacks(
        'on_tag',
        tag,
        content,
        context
      );

      // Flatten the results - each result is an Action[]
      for (const result of extensionResults) {
        if (Array.isArray(result)) {
          actions.push(...result);
        }
      }
    }

    return actions;
  }

  /**
   * Execute an action
   */
  private async executeAction(action: Action, context: RunContext): Promise<ActionResult> {
    try {
      return await this.extensionRegistry.executeAction(action, context);
    } catch (err: any) {
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Generate notes from trajectory (async, non-blocking)
   */
  private async generateNotes(trajectory: Trajectory): Promise<void> {
    try {
      const notes = await this.noteTakingAgent.distillSession(trajectory);
      if (this.config.verbose && notes.length > 0) {
        console.log(`[NOTES] Generated ${notes.length} notes from session`);
      }
    } catch (err) {
      console.error('[NOTE GENERATION ERROR]', err);
    }
  }

  /**
   * Get orchestrator statistics
   */
  getStats(): Record<string, any> {
    return {
      registry: this.extensionRegistry.getStatus()
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createOrchestrator(
  pool: Pool,
  llm: LLMProvider,
  options?: {
    config?: Partial<OrchestratorConfig>;
    agentConfig?: AgentConfig;
  }
): ANKROrchestrator {
  return new ANKROrchestrator(pool, llm, options);
}

export default ANKROrchestrator;
