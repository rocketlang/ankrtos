/**
 * SWAYAM Conversational AI
 * Main orchestrator for understanding, planning, and executing tasks
 */

import type {
  Message,
  ConversationContext,
  ConversationAnalysis,
  Intent,
  ExtractedEntities,
  TodoPlan,
  TodoItem,
  ProgressEvent,
  ProgressCallback,
  PackageInfo
} from './types';

import { IntentClassifier, intentClassifier } from './intent-classifier';
import { EntityExtractor, entityExtractor } from './entity-extractor';
import { TodoPlanner, todoPlanner } from './todo-planner';
import { PackageDiscovery, packageDiscovery } from './package-discovery';

// ═══════════════════════════════════════════════════════════════════════════════
// CONVERSATION AI CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class ConversationAI {
  private intentClassifier: IntentClassifier;
  private entityExtractor: EntityExtractor;
  private todoPlanner: TodoPlanner;
  private packageDiscovery: PackageDiscovery;
  private aiProxyUrl: string;
  private progressCallbacks: ProgressCallback[] = [];
  private initialized: boolean = false;

  // Active contexts by session ID
  private contexts: Map<string, ConversationContext> = new Map();

  constructor(config?: {
    aiProxyUrl?: string;
    verdaccioUrl?: string;
  }) {
    this.aiProxyUrl = config?.aiProxyUrl || process.env.AI_PROXY_URL || 'http://localhost:4444';

    this.intentClassifier = new IntentClassifier({ aiProxyUrl: this.aiProxyUrl });
    this.entityExtractor = new EntityExtractor({ aiProxyUrl: this.aiProxyUrl });
    this.todoPlanner = new TodoPlanner({ aiProxyUrl: this.aiProxyUrl });
    this.packageDiscovery = new PackageDiscovery({ verdaccioUrl: config?.verdaccioUrl });
  }

  /**
   * Initialize the system (index packages, etc.)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🚀 Initializing SWAYAM Conversational AI...');

    // Index all packages
    await this.packageDiscovery.indexAllPackages();

    this.initialized = true;
    console.log('✅ SWAYAM Conversational AI ready!');
    console.log(`   📦 ${this.packageDiscovery.getPackageCount()} packages indexed`);
  }

  /**
   * Analyze a conversation and return structured analysis
   */
  async analyze(
    text: string,
    sessionId: string,
    context?: Partial<ConversationContext>
  ): Promise<ConversationAnalysis> {
    // Ensure initialized
    if (!this.initialized) {
      await this.initialize();
    }

    // Get or create context
    let ctx = this.contexts.get(sessionId);
    if (!ctx) {
      ctx = {
        sessionId,
        persona: context?.persona || 'swayam',
        language: context?.language || 'hi',
        messages: [],
        activeAgents: [],
        extractedEntities: {}
      };
      this.contexts.set(sessionId, ctx);
    }

    // Add message to context
    ctx.messages.push({
      role: 'user',
      content: text,
      timestamp: new Date()
    });

    // 1. Classify intent
    const intent = await this.intentClassifier.classify(text, ctx.messages);

    // 2. Extract entities
    const entities = await this.entityExtractor.extract(text, ctx.messages);

    // Merge with previously extracted entities
    ctx.extractedEntities = { ...ctx.extractedEntities, ...entities };

    // 3. Get required tools for this intent
    const toolsNeeded = this.intentClassifier.getToolsForIntent(intent.primary);

    // 4. Find available packages for required tools
    const packagesAvailable = this.packageDiscovery.getPackagesForTools(toolsNeeded);

    // 5. Check for missing tools
    const availableTools = new Set(packagesAvailable.flatMap(p => p.tools || []));
    const toolsMissing = toolsNeeded.filter(t => !availableTools.has(t));

    // 6. Generate suggested plan (if high confidence)
    let suggestedPlan: TodoPlan | undefined;
    if (intent.confidence > 0.6) {
      suggestedPlan = await this.todoPlanner.createPlan(intent, ctx.extractedEntities, ctx.messages);
      ctx.currentPlan = suggestedPlan;
    }

    // 7. Determine if confirmation is needed
    const requiresConfirmation = intent.confidence < 0.8 ||
      this.intentClassifier.getRequiredEntities(intent.primary).some(e => !entities[e]);

    // 8. Generate follow-up questions if needed
    const followUpQuestions = this.generateFollowUpQuestions(intent, entities);

    return {
      intent,
      entities: ctx.extractedEntities,
      suggestedPlan,
      toolsNeeded,
      toolsMissing,
      packagesAvailable,
      confidence: intent.confidence,
      requiresConfirmation,
      followUpQuestions
    };
  }

  /**
   * Generate follow-up questions for missing information
   */
  private generateFollowUpQuestions(intent: Intent, entities: ExtractedEntities): string[] {
    const questions: string[] = [];
    const requiredEntities = this.intentClassifier.getRequiredEntities(intent.primary);

    for (const entityType of requiredEntities) {
      if (!entities[entityType]) {
        switch (entityType) {
          case 'gstin':
            questions.push('GSTIN number क्या है? / What is the GSTIN number?');
            break;
          case 'pan':
            questions.push('PAN number क्या है? / What is the PAN number?');
            break;
          case 'amount':
            questions.push('Amount कितना है? / What is the amount?');
            break;
          case 'vehicle':
            questions.push('Vehicle number क्या है? / What is the vehicle number?');
            break;
          case 'aadhaar':
            questions.push('Aadhaar number क्या है? / What is the Aadhaar number?');
            break;
          default:
            questions.push(`Please provide ${entityType}`);
        }
      }
    }

    return questions;
  }

  /**
   * Execute a plan
   */
  async executePlan(
    plan: TodoPlan,
    toolExecutor: (toolName: string, params: Record<string, any>) => Promise<any>
  ): Promise<TodoPlan> {
    plan.status = 'executing';
    this.emitProgress({
      type: 'plan_created',
      planId: plan.id,
      message: `Starting plan: ${plan.title}`,
      messageHi: `Plan शुरू: ${plan.titleHi}`,
      progress: 0,
      timestamp: new Date()
    });

    // Execute tasks in dependency order
    while (true) {
      const executableTasks = this.todoPlanner.getExecutableTasks(plan);

      if (executableTasks.length === 0) {
        // Check if all done or blocked
        const pending = plan.items.filter(t => t.status === 'pending');
        if (pending.length === 0) break;

        // All remaining tasks are blocked
        console.warn('Some tasks are blocked by dependencies');
        break;
      }

      // Execute tasks (could parallelize independent tasks)
      for (const task of executableTasks) {
        plan = await this.executeTask(plan, task, toolExecutor);
      }
    }

    // Final status
    const allCompleted = plan.items.every(t => t.status === 'completed');
    plan.status = allCompleted ? 'completed' : 'failed';
    plan.progress = 100;

    this.emitProgress({
      type: 'plan_completed',
      planId: plan.id,
      message: allCompleted ? 'Plan completed successfully' : 'Plan completed with some failures',
      messageHi: allCompleted ? 'Plan सफलतापूर्वक पूरा' : 'Plan कुछ failures के साथ पूरा',
      progress: 100,
      timestamp: new Date()
    });

    return plan;
  }

  /**
   * Execute a single task
   */
  private async executeTask(
    plan: TodoPlan,
    task: TodoItem,
    toolExecutor: (toolName: string, params: Record<string, any>) => Promise<any>
  ): Promise<TodoPlan> {
    // Mark as in progress
    plan = this.todoPlanner.updateTaskStatus(plan, task.id, 'in_progress');

    this.emitProgress({
      type: 'task_started',
      planId: plan.id,
      taskId: task.id,
      message: `Starting: ${task.title}`,
      messageHi: `शुरू: ${task.titleHi}`,
      progress: plan.progress,
      timestamp: new Date()
    });

    try {
      // Execute each tool
      const results: any[] = [];

      // Flatten entities for tool execution (extract values from structured entities)
      const flatParams: Record<string, any> = {};

      for (const [key, entity] of Object.entries(plan.entities)) {
        // Handle arrays of entities (take first one)
        const singleEntity = Array.isArray(entity) ? entity[0] : entity;

        if (singleEntity && typeof singleEntity === 'object') {
          // Cast to access properties safely
          const entityObj = singleEntity as { value?: string; normalizedValue?: string };
          if (entityObj.value !== undefined) {
            flatParams[key] = entityObj.value;
          } else if (entityObj.normalizedValue !== undefined) {
            flatParams[key] = entityObj.normalizedValue;
          } else {
            flatParams[key] = singleEntity;
          }
        } else {
          flatParams[key] = singleEntity;
        }
      }

      // Add default period if not present (for GST returns)
      if (!flatParams.period) {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        flatParams.period = `${month}${year}`;  // e.g., "012026" for Jan 2026
      }

      for (const toolName of task.tools) {
        this.emitProgress({
          type: 'tool_executed',
          planId: plan.id,
          taskId: task.id,
          message: `Executing tool: ${toolName}`,
          messageHi: `Tool चला रहा: ${toolName}`,
          progress: plan.progress,
          timestamp: new Date()
        });

        const result = await toolExecutor(toolName, flatParams);
        results.push({ tool: toolName, result });
      }

      // Mark as completed
      plan = this.todoPlanner.updateTaskStatus(plan, task.id, 'completed', results);

      this.emitProgress({
        type: 'task_completed',
        planId: plan.id,
        taskId: task.id,
        message: `Completed: ${task.title}`,
        messageHi: `पूरा: ${task.titleHi}`,
        progress: plan.progress,
        data: results,
        timestamp: new Date()
      });
    } catch (error) {
      // Mark as blocked
      plan = this.todoPlanner.updateTaskStatus(plan, task.id, 'blocked');
      plan.items.find(t => t.id === task.id)!.error = (error as Error).message;

      this.emitProgress({
        type: 'task_failed',
        planId: plan.id,
        taskId: task.id,
        message: `Failed: ${task.title} - ${(error as Error).message}`,
        messageHi: `विफल: ${task.titleHi}`,
        progress: plan.progress,
        timestamp: new Date()
      });
    }

    return plan;
  }

  /**
   * Register progress callback
   */
  onProgress(callback: ProgressCallback): void {
    this.progressCallbacks.push(callback);
  }

  /**
   * Emit progress event
   */
  private emitProgress(event: ProgressEvent): void {
    for (const callback of this.progressCallbacks) {
      try {
        callback(event);
      } catch (error) {
        console.error('Progress callback error:', error);
      }
    }
  }

  /**
   * Get conversation context
   */
  getContext(sessionId: string): ConversationContext | undefined {
    return this.contexts.get(sessionId);
  }

  /**
   * Clear conversation context
   */
  clearContext(sessionId: string): void {
    this.contexts.delete(sessionId);
  }

  /**
   * Generate a response message based on analysis
   */
  async generateResponse(analysis: ConversationAnalysis, language: string = 'hi'): Promise<string> {
    const isHindi = language === 'hi';

    // If requires confirmation, show plan and ask
    if (analysis.requiresConfirmation && analysis.followUpQuestions && analysis.followUpQuestions.length > 0) {
      return analysis.followUpQuestions.join('\n');
    }

    if (analysis.suggestedPlan) {
      const plan = analysis.suggestedPlan;
      const taskList = plan.items
        .map((t, i) => `${i + 1}. ${isHindi ? t.titleHi : t.title}`)
        .join('\n');

      if (isHindi) {
        return `🎯 समझ गया! ${plan.titleHi}

📋 TODO List:
${taskList}

▶️ शुरू करूं? (हां/नहीं)`;
      } else {
        return `🎯 Got it! ${plan.title}

📋 TODO List:
${taskList}

▶️ Should I start? (yes/no)`;
      }
    }

    // Low confidence response
    if (analysis.confidence < 0.5) {
      return isHindi
        ? '🤔 माफ कीजिए, मैं समझ नहीं पाया। क्या आप दोबारा बता सकते हैं?'
        : '🤔 Sorry, I didn\'t understand. Could you please rephrase?';
    }

    return isHindi
      ? `✅ ${analysis.intent.primary} के लिए तैयार हूं।`
      : `✅ Ready for ${analysis.intent.primary}.`;
  }

  /**
   * Get package discovery instance
   */
  getPackageDiscovery(): PackageDiscovery {
    return this.packageDiscovery;
  }

  /**
   * Get summary of capabilities
   */
  getCapabilitySummary(): {
    packages: number;
    intents: number;
    tools: number;
    domains: string[];
  } {
    const summary = this.packageDiscovery.getSummary();
    return {
      packages: summary.total,
      intents: 30, // Approximate from intent patterns
      tools: 213,  // Known MCP tools
      domains: Object.keys(summary.byDomain)
    };
  }
}

// Export singleton instance
export const conversationAI = new ConversationAI();
