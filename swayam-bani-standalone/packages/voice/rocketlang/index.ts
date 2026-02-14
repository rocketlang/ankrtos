/**
 * RocketLang Integration for Swayam
 *
 * "Bolo Ho Jaayega" - Just say it, it happens!
 *
 * Two approaches available:
 *
 * 1. AGENT (Recommended) - Simple, AI-first approach
 *    Single file, ~500 lines, uses AI for understanding
 *
 * 2. LEGACY - Complex modular approach
 *    Multiple files, grammar-based parsing
 *
 * @author ANKR Labs
 */

// =============================================================================
// THE DREAM: UNIFIED AGENT (Recommended)
// =============================================================================

export {
  agent,
  agent as default,
  TOOLS,
  getContext,
  understand,
  execute,
  type Tool,
  type Context,
  type Result,
  type Intent,
  type Language,
} from './agent.js';

// =============================================================================
// LEGACY: MODULAR APPROACH (For backwards compatibility)
// =============================================================================

// Core executor
export {
  RocketLangExecutor,
  getRocketLangExecutor,
  registerSwayamTools,
  type ExecutionResult,
  type ResponseFormat,
} from './executor.js';

// Context management (pronouns, history)
export {
  ContextManager,
  getContextManager,
  type CommandContext,
  type ResolvedText,
} from './context.js';

// Smart suggestions
export {
  findSimilarFiles,
  suggestForError,
  formatSuggestionsForVoice,
  type Suggestion,
  type SuggestionResult,
} from './suggestions.js';

// Extended tools
export {
  registerExtendedTools,
  pushUndoAction,
  popUndoAction,
} from './tools-extended.js';

// Package awareness
export {
  PackageAwareness,
  getPackageAwareness,
  ANKR_PACKAGES,
  type PackageCapability,
  type CodePattern,
} from './package-awareness.js';

// Code generation
export {
  CodeGenerator,
  getCodeGenerator,
  type CodeGenerationResult,
  type GenerationContext,
} from './code-generator.js';
