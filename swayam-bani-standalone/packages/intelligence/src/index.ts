/**
 * @ankr/intelligence - SWAYAM Conversational AI
 *
 * AI that understands, plans, and executes tasks autonomously
 *
 * Features:
 * - Intent Classification (Hindi + English)
 * - Entity Extraction (Indian formats: GSTIN, PAN, Aadhaar, etc.)
 * - TODO Planning with templates and AI generation
 * - Package Discovery from Verdaccio
 * - Progress tracking and callbacks
 *
 * @author ANKR Labs
 * @version 1.0.0
 */

// Main orchestrator
export { ConversationAI, conversationAI } from './conversation-ai';

// Intent classification
export { IntentClassifier, intentClassifier } from './intent-classifier';

// Entity extraction
export { EntityExtractor, entityExtractor } from './entity-extractor';

// TODO planning
export { TodoPlanner, todoPlanner } from './todo-planner';

// Package discovery
export { PackageDiscovery, packageDiscovery } from './package-discovery';

// BFC Episode Recording (ankrBFC Integration)
export {
  BFCEpisodeRecorder,
  bfcEpisodeRecorder,
  isBFCIntent,
  getBFCModule,
  getBFCIntents,
  type FinancialEpisode,
  type EpisodeState,
  type EpisodeAction,
  type EpisodeOutcome,
  type FinancialModule,
  type FinancialActionType,
} from './bfc-episode-recorder';

// BFC Gamification (ankrBFC Integration)
export {
  BFCGamificationEngine,
  bfcGamificationEngine,
  BADGE_DEFINITIONS,
  XP_REWARDS,
  XP_LEVELS,
  TIER_THRESHOLDS,
  type UserGamificationProfile,
  type Badge,
  type Achievement,
  type Challenge,
  type GamificationReward,
  type UserTier,
} from './bfc-gamification';

// Types
export * from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK START FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

import { conversationAI } from './conversation-ai';

/**
 * Quick analyze - analyze text and get structured result
 */
export async function analyze(text: string, sessionId?: string) {
  return conversationAI.analyze(text, sessionId || `session_${Date.now()}`);
}

/**
 * Quick intent - just get the intent
 */
export async function getIntent(text: string) {
  const { intent } = await conversationAI.analyze(text, `temp_${Date.now()}`);
  return intent;
}

/**
 * Quick entities - just extract entities
 */
export async function getEntities(text: string) {
  const { entities } = await conversationAI.analyze(text, `temp_${Date.now()}`);
  return entities;
}

/**
 * Quick plan - generate a TODO plan
 */
export async function createPlan(text: string) {
  const analysis = await conversationAI.analyze(text, `plan_${Date.now()}`);
  return analysis.suggestedPlan;
}

/**
 * Initialize the system
 */
export async function initialize() {
  return conversationAI.initialize();
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default conversationAI;
