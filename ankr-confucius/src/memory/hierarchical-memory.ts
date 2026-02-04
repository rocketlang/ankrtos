/**
 * ANKR-EON Hierarchical Working Memory
 * Inspired by Confucius SDK's context management
 * 
 * @package ankr-eon
 * @author ANKR Labs
 */

import { Pool } from 'pg';
import { v4 as uuid } from 'uuid';

// ============================================================================
// Types
// ============================================================================

export type ScopeType = 'session' | 'task' | 'subtask' | 'action';

export interface MemoryScope {
  id: string;
  session_id: string;
  scope_type: ScopeType;
  parent_scope_id: string | null;
  summary: string | null;
  compressed: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Artifact {
  id: string;
  scope_id: string;
  artifact_type: 'decision' | 'error' | 'todo' | 'patch' | 'action_result';
  content: Record<string, any>;
  importance_score: number;
  created_at: Date;
}

export interface Decision {
  description: string;
  rationale: string;
  alternatives_considered?: string[];
  timestamp: Date;
}

export interface ErrorLog {
  error_type: string;
  message: string;
  stack?: string;
  resolution?: string;
  resolved: boolean;
  components: string[];
}

export interface Todo {
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'completed' | 'abandoned';
  dependencies?: string[];
}

export interface CompressionResult {
  goals: string[];
  key_decisions: Decision[];
  errors_encountered: ErrorLog[];
  open_todos: Todo[];
  compressed_token_count: number;
}

export interface MemoryConfig {
  compression_threshold_tokens: number;
  retention_window_scopes: number;
  max_artifacts_per_scope: number;
  auto_compress: boolean;
}

// ============================================================================
// LLM Provider Interface (for compression)
// ============================================================================

export interface LLMProvider {
  complete(prompt: string): Promise<string>;
  estimateTokens(text: string): number;
}

// ============================================================================
// Hierarchical Memory Manager
// ============================================================================

export class HierarchicalMemoryManager {
  private pool: Pool;
  private config: MemoryConfig;
  private llm: LLMProvider;

  constructor(pool: Pool, llm: LLMProvider, config?: Partial<MemoryConfig>) {
    this.pool = pool;
    this.llm = llm;
    this.config = {
      compression_threshold_tokens: 50000,
      retention_window_scopes: 5,
      max_artifacts_per_scope: 100,
      auto_compress: true,
      ...config
    };
  }

  // --------------------------------------------------------------------------
  // Scope Management
  // --------------------------------------------------------------------------

  async createScope(
    sessionId: string,
    scopeType: ScopeType,
    parentScopeId?: string
  ): Promise<MemoryScope> {
    const id = uuid();
    
    const result = await this.pool.query<MemoryScope>(
      `INSERT INTO memory_scopes 
       (id, session_id, scope_type, parent_scope_id, compressed, created_at, updated_at)
       VALUES ($1, $2, $3, $4, false, NOW(), NOW())
       RETURNING *`,
      [id, sessionId, scopeType, parentScopeId || null]
    );

    return result.rows[0];
  }

  async getScope(scopeId: string): Promise<MemoryScope | null> {
    const result = await this.pool.query<MemoryScope>(
      'SELECT * FROM memory_scopes WHERE id = $1',
      [scopeId]
    );
    return result.rows[0] || null;
  }

  async getScopeHierarchy(scopeId: string): Promise<MemoryScope[]> {
    // Get all ancestors up to session root
    const result = await this.pool.query<MemoryScope>(
      `WITH RECURSIVE scope_tree AS (
         SELECT * FROM memory_scopes WHERE id = $1
         UNION ALL
         SELECT ms.* FROM memory_scopes ms
         INNER JOIN scope_tree st ON ms.id = st.parent_scope_id
       )
       SELECT * FROM scope_tree ORDER BY created_at ASC`,
      [scopeId]
    );
    return result.rows;
  }

  async getChildScopes(scopeId: string): Promise<MemoryScope[]> {
    const result = await this.pool.query<MemoryScope>(
      `SELECT * FROM memory_scopes 
       WHERE parent_scope_id = $1 
       ORDER BY created_at ASC`,
      [scopeId]
    );
    return result.rows;
  }

  async updateScope(
    scopeId: string,
    updates: Partial<Pick<MemoryScope, 'summary' | 'compressed'>>
  ): Promise<MemoryScope> {
    const setClauses: string[] = ['updated_at = NOW()'];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.summary !== undefined) {
      setClauses.push(`summary = $${paramIndex++}`);
      values.push(updates.summary);
    }
    if (updates.compressed !== undefined) {
      setClauses.push(`compressed = $${paramIndex++}`);
      values.push(updates.compressed);
    }

    values.push(scopeId);

    const result = await this.pool.query<MemoryScope>(
      `UPDATE memory_scopes SET ${setClauses.join(', ')} 
       WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // --------------------------------------------------------------------------
  // Artifact Management
  // --------------------------------------------------------------------------

  async recordArtifact(
    scopeId: string,
    artifact: Omit<Artifact, 'id' | 'scope_id' | 'created_at'>
  ): Promise<Artifact> {
    const id = uuid();

    // Check artifact limit
    const countResult = await this.pool.query<{ count: string }>(
      'SELECT COUNT(*) FROM scope_artifacts WHERE scope_id = $1',
      [scopeId]
    );
    
    if (parseInt(countResult.rows[0].count) >= this.config.max_artifacts_per_scope) {
      // Remove lowest importance artifacts
      await this.pool.query(
        `DELETE FROM scope_artifacts 
         WHERE id IN (
           SELECT id FROM scope_artifacts 
           WHERE scope_id = $1 
           ORDER BY importance_score ASC 
           LIMIT 10
         )`,
        [scopeId]
      );
    }

    const result = await this.pool.query<Artifact>(
      `INSERT INTO scope_artifacts 
       (id, scope_id, artifact_type, content, importance_score, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [id, scopeId, artifact.artifact_type, artifact.content, artifact.importance_score]
    );

    // Auto-compress if needed
    if (this.config.auto_compress) {
      await this.checkAndCompress(scopeId);
    }

    return result.rows[0];
  }

  async getArtifacts(scopeId: string, type?: Artifact['artifact_type']): Promise<Artifact[]> {
    let query = 'SELECT * FROM scope_artifacts WHERE scope_id = $1';
    const params: any[] = [scopeId];

    if (type) {
      query += ' AND artifact_type = $2';
      params.push(type);
    }

    query += ' ORDER BY importance_score DESC, created_at DESC';

    const result = await this.pool.query<Artifact>(query, params);
    return result.rows;
  }

  async getScopeWithArtifacts(scopeId: string): Promise<{
    scope: MemoryScope;
    artifacts: Artifact[];
  } | null> {
    const scope = await this.getScope(scopeId);
    if (!scope) return null;

    const artifacts = await this.getArtifacts(scopeId);
    return { scope, artifacts };
  }

  // --------------------------------------------------------------------------
  // Context Building
  // --------------------------------------------------------------------------

  async buildContext(
    currentScopeId: string,
    options?: {
      includeCompressed?: boolean;
      maxTokens?: number;
    }
  ): Promise<string> {
    const includeCompressed = options?.includeCompressed ?? true;
    const maxTokens = options?.maxTokens ?? this.config.compression_threshold_tokens;

    // Get scope hierarchy
    const hierarchy = await this.getScopeHierarchy(currentScopeId);
    
    const contextParts: string[] = [];
    let totalTokens = 0;

    for (const scope of hierarchy) {
      if (scope.compressed && !includeCompressed) continue;

      let scopeContext: string;

      if (scope.compressed && scope.summary) {
        // Use compressed summary
        scopeContext = `## Scope: ${scope.scope_type} (compressed)\n${scope.summary}`;
      } else {
        // Build from artifacts
        const artifacts = await this.getArtifacts(scope.id);
        scopeContext = this.formatScopeContext(scope, artifacts);
      }

      const tokens = this.llm.estimateTokens(scopeContext);
      
      if (totalTokens + tokens > maxTokens) {
        // Would exceed limit, stop here
        break;
      }

      contextParts.push(scopeContext);
      totalTokens += tokens;
    }

    return contextParts.join('\n\n---\n\n');
  }

  private formatScopeContext(scope: MemoryScope, artifacts: Artifact[]): string {
    const parts: string[] = [
      `## Scope: ${scope.scope_type}`,
      `Created: ${scope.created_at.toISOString()}`
    ];

    // Group artifacts by type
    const grouped = artifacts.reduce((acc, art) => {
      if (!acc[art.artifact_type]) acc[art.artifact_type] = [];
      acc[art.artifact_type].push(art);
      return acc;
    }, {} as Record<string, Artifact[]>);

    for (const [type, arts] of Object.entries(grouped)) {
      parts.push(`\n### ${type.toUpperCase()}`);
      for (const art of arts) {
        parts.push(JSON.stringify(art.content, null, 2));
      }
    }

    return parts.join('\n');
  }

  // --------------------------------------------------------------------------
  // Compression
  // --------------------------------------------------------------------------

  async checkAndCompress(scopeId: string): Promise<boolean> {
    const scope = await this.getScope(scopeId);
    if (!scope || scope.compressed) return false;

    const artifacts = await this.getArtifacts(scopeId);
    const context = this.formatScopeContext(scope, artifacts);
    const tokens = this.llm.estimateTokens(context);

    if (tokens < this.config.compression_threshold_tokens / 2) {
      return false; // Not worth compressing yet
    }

    // Find older sibling scopes to compress
    const siblingScopes = await this.pool.query<MemoryScope>(
      `SELECT * FROM memory_scopes 
       WHERE parent_scope_id = $1 
       AND compressed = false 
       AND id != $2
       ORDER BY created_at ASC`,
      [scope.parent_scope_id, scopeId]
    );

    // Compress all but the most recent retention_window scopes
    const toCompress = siblingScopes.rows.slice(
      0, 
      Math.max(0, siblingScopes.rows.length - this.config.retention_window_scopes)
    );

    for (const oldScope of toCompress) {
      await this.compressScope(oldScope.id);
    }

    return toCompress.length > 0;
  }

  async compressScope(scopeId: string): Promise<CompressionResult> {
    const scope = await this.getScope(scopeId);
    if (!scope) throw new Error(`Scope not found: ${scopeId}`);
    if (scope.compressed) {
      return JSON.parse(scope.summary || '{}');
    }

    const artifacts = await this.getArtifacts(scopeId);
    const context = this.formatScopeContext(scope, artifacts);

    const prompt = `You are the Architect agent for ANKR-EON memory system.
Compress this execution history into a structured summary that preserves essential information for future reasoning.

SCOPE CONTENT:
${context}

Extract and return a JSON object with:
{
  "goals": ["High-level objectives being pursued"],
  "key_decisions": [{"description": "...", "rationale": "...", "timestamp": "..."}],
  "errors_encountered": [{"error_type": "...", "message": "...", "resolved": true/false, "resolution": "..."}],
  "open_todos": [{"description": "...", "priority": "high/medium/low", "status": "open/completed"}],
  "compressed_token_count": <estimated tokens in this summary>
}

Keep essential context for future reasoning. Discard verbose logs and intermediate steps.
Return ONLY valid JSON, no markdown formatting.`;

    const response = await this.llm.complete(prompt);
    
    let result: CompressionResult;
    try {
      result = JSON.parse(response);
    } catch {
      // If parsing fails, create minimal compression
      result = {
        goals: ['Unable to parse - see original artifacts'],
        key_decisions: [],
        errors_encountered: [],
        open_todos: [],
        compressed_token_count: this.llm.estimateTokens(response)
      };
    }

    // Update scope with compressed summary
    await this.updateScope(scopeId, {
      summary: JSON.stringify(result),
      compressed: true
    });

    return result;
  }

  // --------------------------------------------------------------------------
  // Session Management
  // --------------------------------------------------------------------------

  async getSessionScopes(sessionId: string): Promise<MemoryScope[]> {
    const result = await this.pool.query<MemoryScope>(
      `SELECT * FROM memory_scopes 
       WHERE session_id = $1 
       ORDER BY created_at ASC`,
      [sessionId]
    );
    return result.rows;
  }

  async getSessionStats(sessionId: string): Promise<{
    total_scopes: number;
    compressed_scopes: number;
    total_artifacts: number;
    estimated_tokens: number;
  }> {
    const scopeResult = await this.pool.query<{
      total: string;
      compressed: string;
    }>(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE compressed = true) as compressed
       FROM memory_scopes WHERE session_id = $1`,
      [sessionId]
    );

    const artifactResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count 
       FROM scope_artifacts sa
       JOIN memory_scopes ms ON sa.scope_id = ms.id
       WHERE ms.session_id = $1`,
      [sessionId]
    );

    // Estimate tokens (rough calculation)
    const context = await this.buildContext(sessionId, { maxTokens: Infinity });
    const estimatedTokens = this.llm.estimateTokens(context);

    return {
      total_scopes: parseInt(scopeResult.rows[0].total),
      compressed_scopes: parseInt(scopeResult.rows[0].compressed),
      total_artifacts: parseInt(artifactResult.rows[0].count),
      estimated_tokens: estimatedTokens
    };
  }
}

// ============================================================================
// SQL Schema (for reference)
// ============================================================================

export const SCHEMA_SQL = `
-- Hierarchical Memory Scopes
CREATE TABLE IF NOT EXISTS memory_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    scope_type VARCHAR(20) NOT NULL CHECK (scope_type IN ('session', 'task', 'subtask', 'action')),
    parent_scope_id UUID REFERENCES memory_scopes(id) ON DELETE CASCADE,
    summary TEXT,
    compressed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scope Artifacts
CREATE TABLE IF NOT EXISTS scope_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope_id UUID NOT NULL REFERENCES memory_scopes(id) ON DELETE CASCADE,
    artifact_type VARCHAR(50) NOT NULL CHECK (artifact_type IN ('decision', 'error', 'todo', 'patch', 'action_result')),
    content JSONB NOT NULL,
    importance_score FLOAT DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_memory_scopes_session ON memory_scopes(session_id);
CREATE INDEX IF NOT EXISTS idx_memory_scopes_parent ON memory_scopes(parent_scope_id);
CREATE INDEX IF NOT EXISTS idx_memory_scopes_type ON memory_scopes(scope_type);
CREATE INDEX IF NOT EXISTS idx_scope_artifacts_scope ON scope_artifacts(scope_id);
CREATE INDEX IF NOT EXISTS idx_scope_artifacts_type ON scope_artifacts(artifact_type);
CREATE INDEX IF NOT EXISTS idx_scope_artifacts_importance ON scope_artifacts(importance_score DESC);
`;

export default HierarchicalMemoryManager;
