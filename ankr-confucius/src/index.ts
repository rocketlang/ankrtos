/**
 * ANKR-EON Enhanced Architecture
 * Inspired by Confucius Code Agent from Meta/Harvard
 * 
 * A production-grade agent scaffolding system for logistics AI
 * 
 * @package @ankr/eon-confucius
 * @author ANKR Labs
 * @philosophy Made in India, Indic First, For the World
 */

// ============================================================================
// Core Components
// ============================================================================

// Orchestrator - Main entry point
export { 
  ANKROrchestrator, 
  createOrchestrator,
  type Task,
  type OrchestratorResult,
  type OrchestratorConfig,
  type LLMProvider
} from './orchestrator';

// ============================================================================
// Memory System
// ============================================================================

export {
  HierarchicalMemoryManager,
  SCHEMA_SQL as MEMORY_SCHEMA_SQL,
  type MemoryScope,
  type Artifact,
  type Decision,
  type ErrorLog,
  type Todo,
  type CompressionResult,
  type MemoryConfig,
  type ScopeType
} from './memory/hierarchical-memory';

// ============================================================================
// Note-Taking System
// ============================================================================

export {
  NoteTakingAgent,
  NoteStorage,
  NoteLoader,
  NOTES_SCHEMA_SQL,
  type Note,
  type HindsightNote,
  type StrategyNote,
  type Trajectory,
  type TrajectoryEvent
} from './notes/note-taking-agent';

// ============================================================================
// Extension System
// ============================================================================

export {
  ExtensionRegistry,
  BaseExtension,
  createLogisticsExtensionRegistry,
  // Built-in extensions
  RouteOptimizationExtension,
  InventoryExtension,
  VoiceExtension,
  DriverCommunicationExtension,
  ObservabilityExtension,
  // Types
  type Extension,
  type ExtensionCallbacks,
  type RunContext,
  type Message,
  type Action,
  type ActionResult,
  type IOInterface,
  type ArtifactStore,
  type LLMOutput
} from './extensions/extension-system';

// ============================================================================
// Meta-Agent System
// ============================================================================

export {
  MetaAgent,
  MockEvaluator,
  calculateScore,
  generateTestTasks,
  type AgentConfig,
  type ToolPolicy,
  type EvaluationResult,
  type ExecutionTrace,
  type TraceEvent,
  type DecisionPoint,
  type Evaluator,
  type ScoreWeights
} from './meta-agent/meta-agent';

// ============================================================================
// Combined Schema SQL
// ============================================================================

import { SCHEMA_SQL as MEMORY_SQL } from './memory/hierarchical-memory';
import { NOTES_SCHEMA_SQL } from './notes/note-taking-agent';

export const FULL_SCHEMA_SQL = `
-- ANKR-EON Database Schema
-- Generated for Confucius-inspired architecture

-- =============================================
-- Memory System Tables
-- =============================================

${MEMORY_SQL}

-- =============================================
-- Note-Taking System Tables
-- =============================================

${NOTES_SCHEMA_SQL}

-- =============================================
-- Session Tracking
-- =============================================

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(50),
    task_description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'timeout')),
    config_id UUID,
    iterations INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    result JSONB
);

CREATE INDEX IF NOT EXISTS idx_sessions_domain ON sessions(domain);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at DESC);

-- =============================================
-- Agent Configurations
-- =============================================

CREATE TABLE IF NOT EXISTS agent_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    version VARCHAR(50) NOT NULL,
    domain VARCHAR(50) NOT NULL,
    config JSONB NOT NULL,
    generation INTEGER DEFAULT 0,
    parent_config_id UUID REFERENCES agent_configs(id),
    score FLOAT,
    active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_configs_domain ON agent_configs(domain);
CREATE INDEX IF NOT EXISTS idx_configs_active ON agent_configs(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_configs_score ON agent_configs(score DESC);

-- =============================================
-- Evaluation Results
-- =============================================

CREATE TABLE IF NOT EXISTS evaluation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID REFERENCES agent_configs(id),
    task_id VARCHAR(100) NOT NULL,
    success BOOLEAN NOT NULL,
    turns INTEGER,
    token_usage INTEGER,
    duration_ms INTEGER,
    errors JSONB DEFAULT '[]',
    trace JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eval_config ON evaluation_results(config_id);
CREATE INDEX IF NOT EXISTS idx_eval_success ON evaluation_results(success);
`;

// ============================================================================
// Version Info
// ============================================================================

export const VERSION = '1.0.0';
export const ARCHITECTURE = 'confucius-inspired';
export const PHILOSOPHY = 'Made in India, Indic First, For the World';
