/**
 * ANKR-EON Extension System
 * Modular tool integration with typed callbacks
 * 
 * Extensions define tool-use behavior, parsing, prompt shaping,
 * and interaction policies through typed callbacks.
 * 
 * @package ankr-eon
 * @author ANKR Labs
 */

import { v4 as uuid } from 'uuid';

// ============================================================================
// Core Types
// ============================================================================

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
}

export interface LLMOutput {
  text: string;
  tokens_used: number;
  finish_reason: string;
  raw_response?: any;
}

export interface Action {
  type: string;
  data: Record<string, any>;
  extension?: string;
}

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  requestContinuation?: boolean;
}

export interface RunContext {
  session_id: string;
  io: IOInterface;
  sessionStorage: Map<string, any>;
  hierarchicalMemory: any; // HierarchicalMemoryManager
  artifactStore: ArtifactStore;
  noteStorage: any; // NoteStorage
}

export interface IOInterface {
  send(message: string): Promise<void>;
  receive(): Promise<string>;
  sendStructured(data: Record<string, any>): Promise<void>;
}

export interface ArtifactStore {
  save(key: string, value: any): Promise<void>;
  get(key: string): Promise<any>;
  list(prefix?: string): Promise<string[]>;
  delete(key: string): Promise<boolean>;
}

// ============================================================================
// Extension Interface
// ============================================================================

export interface ExtensionCallbacks {
  /**
   * Called before messages are sent to the LLM
   * Use to inject context, modify prompts, or filter messages
   */
  on_input_messages?: (messages: Message[], context: RunContext) => Promise<Message[]>;

  /**
   * Called when plain text output is received from LLM
   */
  on_plain_text?: (text: string, context: RunContext) => Promise<void>;

  /**
   * Called when a specific tag is found in LLM output
   * Returns actions to execute
   */
  on_tag?: (tag: string, content: string, context: RunContext) => Promise<Action[]>;

  /**
   * Called after LLM completes generation
   * Use for logging, post-processing, or triggering side effects
   */
  on_llm_output?: (output: LLMOutput, context: RunContext) => Promise<void>;

  /**
   * Called when an action is about to be executed
   * Can modify or block actions
   */
  on_before_action?: (action: Action, context: RunContext) => Promise<Action | null>;

  /**
   * Called after an action completes
   */
  on_after_action?: (
    action: Action,
    result: ActionResult,
    context: RunContext
  ) => Promise<void>;
}

export interface Extension {
  name: string;
  version: string;
  description?: string;
  dependencies?: string[];
  callbacks: ExtensionCallbacks;
  state: Map<string, any>;

  /**
   * Initialize the extension with context
   */
  initialize(context: RunContext): Promise<void>;

  /**
   * Execute an action specific to this extension
   */
  executeAction?(action: Action, context: RunContext): Promise<ActionResult>;

  /**
   * Clean up resources
   */
  cleanup(): Promise<void>;

  /**
   * Get extension status for debugging
   */
  getStatus?(): Record<string, any>;
}

// ============================================================================
// Base Extension Class
// ============================================================================

export abstract class BaseExtension implements Extension {
  abstract name: string;
  abstract version: string;
  description?: string;
  dependencies?: string[];
  callbacks: ExtensionCallbacks = {};
  state: Map<string, any> = new Map();

  async initialize(context: RunContext): Promise<void> {
    // Override in subclass if needed
  }

  async cleanup(): Promise<void> {
    this.state.clear();
  }

  getStatus(): Record<string, any> {
    return {
      name: this.name,
      version: this.version,
      stateKeys: Array.from(this.state.keys())
    };
  }

  // Helper methods for subclasses
  protected setState(key: string, value: any): void {
    this.state.set(key, value);
  }

  protected getState<T>(key: string, defaultValue?: T): T | undefined {
    return this.state.get(key) ?? defaultValue;
  }
}

// ============================================================================
// Extension Registry
// ============================================================================

export class ExtensionRegistry {
  private extensions: Map<string, Extension> = new Map();
  private executionOrder: string[] = [];
  private initialized: boolean = false;

  /**
   * Register an extension
   */
  register(extension: Extension, order?: number): this {
    if (this.extensions.has(extension.name)) {
      throw new Error(`Extension ${extension.name} is already registered`);
    }

    // Check dependencies
    if (extension.dependencies) {
      for (const dep of extension.dependencies) {
        if (!this.extensions.has(dep)) {
          throw new Error(
            `Extension ${extension.name} depends on ${dep} which is not registered`
          );
        }
      }
    }

    this.extensions.set(extension.name, extension);

    if (order !== undefined && order >= 0) {
      this.executionOrder.splice(
        Math.min(order, this.executionOrder.length),
        0,
        extension.name
      );
    } else {
      this.executionOrder.push(extension.name);
    }

    return this;
  }

  /**
   * Unregister an extension
   */
  unregister(name: string): boolean {
    // Check if other extensions depend on this
    for (const [extName, ext] of this.extensions) {
      if (ext.dependencies?.includes(name)) {
        throw new Error(
          `Cannot unregister ${name}: ${extName} depends on it`
        );
      }
    }

    const removed = this.extensions.delete(name);
    if (removed) {
      this.executionOrder = this.executionOrder.filter(n => n !== name);
    }
    return removed;
  }

  /**
   * Initialize all extensions
   */
  async initialize(context: RunContext): Promise<void> {
    for (const name of this.executionOrder) {
      const ext = this.extensions.get(name)!;
      await ext.initialize(context);
    }
    this.initialized = true;
  }

  /**
   * Execute callbacks across all extensions
   */
  async executeCallbacks(
    callbackType: keyof ExtensionCallbacks,
    ...args: any[]
  ): Promise<any[]> {
    const results: any[] = [];

    for (const name of this.executionOrder) {
      const ext = this.extensions.get(name)!;
      const callback = ext.callbacks[callbackType];

      if (callback) {
        try {
          const result = await (callback as Function)(...args);
          if (result !== undefined) {
            results.push(result);
          }
        } catch (error) {
          console.error(`Error in ${name}.${callbackType}:`, error);
          // Continue with other extensions
        }
      }
    }

    return results;
  }

  /**
   * Execute action through appropriate extension
   */
  async executeAction(action: Action, context: RunContext): Promise<ActionResult> {
    // Run before_action callbacks
    let processedAction: Action | null = action;
    for (const name of this.executionOrder) {
      const ext = this.extensions.get(name)!;
      if (ext.callbacks.on_before_action) {
        processedAction = await ext.callbacks.on_before_action(processedAction!, context);
        if (!processedAction) {
          return { success: false, error: `Action blocked by ${name}` };
        }
      }
    }

    // Find and execute action
    let result: ActionResult;
    const targetExtension = processedAction!.extension
      ? this.extensions.get(processedAction!.extension)
      : this.findExtensionForAction(processedAction!);

    if (targetExtension?.executeAction) {
      result = await targetExtension.executeAction(processedAction!, context);
    } else {
      result = { success: false, error: `No handler for action type: ${processedAction!.type}` };
    }

    // Run after_action callbacks
    for (const name of this.executionOrder) {
      const ext = this.extensions.get(name)!;
      if (ext.callbacks.on_after_action) {
        await ext.callbacks.on_after_action(processedAction!, result, context);
      }
    }

    return result;
  }

  private findExtensionForAction(action: Action): Extension | undefined {
    // Try to match action type to extension
    for (const ext of this.extensions.values()) {
      if (ext.executeAction) {
        // Extension has action handler, it might handle this type
        return ext;
      }
    }
    return undefined;
  }

  /**
   * Get all registered extensions
   */
  getExtensions(): Extension[] {
    return this.executionOrder.map(name => this.extensions.get(name)!);
  }

  /**
   * Get specific extension
   */
  getExtension(name: string): Extension | undefined {
    return this.extensions.get(name);
  }

  /**
   * Cleanup all extensions
   */
  async cleanup(): Promise<void> {
    for (const name of [...this.executionOrder].reverse()) {
      const ext = this.extensions.get(name)!;
      await ext.cleanup();
    }
    this.initialized = false;
  }

  /**
   * Get registry status
   */
  getStatus(): Record<string, any> {
    return {
      initialized: this.initialized,
      extensionCount: this.extensions.size,
      executionOrder: this.executionOrder,
      extensions: this.getExtensions().map(e => e.getStatus?.() || { name: e.name })
    };
  }
}

// ============================================================================
// Built-in Extensions for ANKR Logistics
// ============================================================================

/**
 * Route Optimization Extension for WowTruck
 */
export class RouteOptimizationExtension extends BaseExtension {
  name = 'route_optimization';
  version = '1.0.0';
  description = 'Optimizes delivery routes for WowTruck TMS';

  callbacks: ExtensionCallbacks = {
    on_tag: async (tag, content, context) => {
      if (tag === 'optimize_route' || tag === 'route') {
        try {
          const params = JSON.parse(content);
          return [{
            type: 'route_optimization',
            data: params,
            extension: this.name
          }];
        } catch {
          return [];
        }
      }
      return [];
    }
  };

  async executeAction(action: Action, context: RunContext): Promise<ActionResult> {
    if (action.type !== 'route_optimization') {
      return { success: false, error: 'Unknown action type' };
    }

    const { origin, destination, waypoints, constraints } = action.data;

    // Simulate route optimization (replace with actual WowTruck integration)
    const optimizedRoute = {
      route_id: uuid(),
      origin,
      destination,
      waypoints: waypoints || [],
      total_distance_km: Math.random() * 500 + 50,
      estimated_duration_minutes: Math.random() * 600 + 30,
      optimized: true,
      optimization_score: Math.random() * 0.3 + 0.7
    };

    // Store in session
    context.sessionStorage.set('last_route', optimizedRoute);

    return {
      success: true,
      data: optimizedRoute,
      requestContinuation: false
    };
  }
}

/**
 * Inventory Management Extension
 */
export class InventoryExtension extends BaseExtension {
  name = 'inventory_management';
  version = '1.0.0';
  description = 'Inventory checking and management for WMS';

  callbacks: ExtensionCallbacks = {
    on_tag: async (tag, content, context) => {
      if (tag === 'check_inventory' || tag === 'inventory') {
        try {
          const params = JSON.parse(content);
          return [{
            type: 'inventory_check',
            data: params,
            extension: this.name
          }];
        } catch {
          return [];
        }
      }
      return [];
    }
  };

  async executeAction(action: Action, context: RunContext): Promise<ActionResult> {
    if (action.type === 'inventory_check') {
      const { sku, warehouse } = action.data;

      // Simulate inventory lookup (replace with actual WMS integration)
      const stock = {
        sku,
        warehouse,
        quantity: Math.floor(Math.random() * 1000),
        reserved: Math.floor(Math.random() * 100),
        available: 0,
        last_updated: new Date().toISOString()
      };
      stock.available = stock.quantity - stock.reserved;

      return { success: true, data: stock };
    }

    return { success: false, error: 'Unknown action type' };
  }
}

/**
 * Voice Interface Extension (SUNOKAHOBOLO)
 */
export class VoiceExtension extends BaseExtension {
  name = 'voice_interface';
  version = '1.0.0';
  description = 'Multilingual voice interface for SUNOKAHOBOLO';

  private supportedLanguages = ['hi', 'ta', 'te', 'en'];

  async initialize(context: RunContext): Promise<void> {
    const lang = context.sessionStorage.get('language') || 'hi';
    this.setState('current_language', lang);
    this.setState('voice_enabled', context.sessionStorage.get('voice_enabled') ?? false);
  }

  callbacks: ExtensionCallbacks = {
    on_llm_output: async (output, context) => {
      if (!this.getState('voice_enabled')) return;

      const lang = this.getState('current_language') || 'hi';
      // Trigger TTS (implement actual TTS integration)
      console.log(`[VOICE] Speaking in ${lang}: ${output.text.substring(0, 100)}...`);
    },

    on_input_messages: async (messages, context) => {
      const lang = this.getState<string>('current_language');
      
      // Add language context to system message
      if (lang && lang !== 'en') {
        const systemMsg = messages.find(m => m.role === 'system');
        if (systemMsg) {
          systemMsg.content += `\n\nIMPORTANT: Respond in ${this.getLanguageName(lang)} language when appropriate for user communication.`;
        }
      }

      return messages;
    }
  };

  private getLanguageName(code: string): string {
    const names: Record<string, string> = {
      'hi': 'Hindi',
      'ta': 'Tamil',
      'te': 'Telugu',
      'en': 'English'
    };
    return names[code] || code;
  }
}

/**
 * Driver Communication Extension
 */
export class DriverCommunicationExtension extends BaseExtension {
  name = 'driver_communication';
  version = '1.0.0';
  description = 'Manages communication with truck drivers';

  callbacks: ExtensionCallbacks = {
    on_tag: async (tag, content, context) => {
      if (tag === 'notify_driver' || tag === 'driver_message') {
        try {
          const params = JSON.parse(content);
          return [{
            type: 'driver_notification',
            data: params,
            extension: this.name
          }];
        } catch {
          return [];
        }
      }
      return [];
    }
  };

  async executeAction(action: Action, context: RunContext): Promise<ActionResult> {
    if (action.type === 'driver_notification') {
      const { driver_id, message, priority, channel } = action.data;

      // Simulate driver notification (replace with actual integration)
      const notification = {
        notification_id: uuid(),
        driver_id,
        message,
        priority: priority || 'normal',
        channel: channel || 'sms',
        sent_at: new Date().toISOString(),
        status: 'sent'
      };

      return { success: true, data: notification };
    }

    return { success: false, error: 'Unknown action type' };
  }
}

/**
 * Logging and Observability Extension
 */
export class ObservabilityExtension extends BaseExtension {
  name = 'observability';
  version = '1.0.0';
  description = 'Logging and metrics collection for DX';
  
  private metrics: {
    llm_calls: number;
    actions_executed: number;
    errors: number;
    total_tokens: number;
  } = {
    llm_calls: 0,
    actions_executed: 0,
    errors: 0,
    total_tokens: 0
  };

  callbacks: ExtensionCallbacks = {
    on_llm_output: async (output, context) => {
      this.metrics.llm_calls++;
      this.metrics.total_tokens += output.tokens_used;
    },

    on_after_action: async (action, result, context) => {
      this.metrics.actions_executed++;
      if (!result.success) {
        this.metrics.errors++;
      }

      // Log action execution
      console.log(`[ACTION] ${action.type}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    }
  };

  getStatus(): Record<string, any> {
    return {
      ...super.getStatus(),
      metrics: { ...this.metrics }
    };
  }

  getMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      llm_calls: 0,
      actions_executed: 0,
      errors: 0,
      total_tokens: 0
    };
  }
}

// ============================================================================
// Extension Factory
// ============================================================================

export function createLogisticsExtensionRegistry(): ExtensionRegistry {
  const registry = new ExtensionRegistry();

  // Register in execution order
  registry
    .register(new ObservabilityExtension(), 0)  // First: capture everything
    .register(new VoiceExtension())
    .register(new RouteOptimizationExtension())
    .register(new InventoryExtension())
    .register(new DriverCommunicationExtension());

  return registry;
}

export default ExtensionRegistry;
