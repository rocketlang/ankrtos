/**
 * ANKR-EON Note-Taking System
 * Persistent cross-session memory with hindsight notes
 * 
 * Inspired by Confucius SDK's note-taking agent that distills
 * execution trajectories into structured Markdown notes.
 * 
 * @package ankr-eon
 * @author ANKR Labs
 */

import { Pool } from 'pg';
import { v4 as uuid } from 'uuid';

// ============================================================================
// Types
// ============================================================================

export interface Note {
  id: string;
  path: string;
  title: string;
  content: string;
  tags: string[];
  linked_sessions: string[];
  domain?: string;
  created_at: Date;
  updated_at: Date;
}

export interface HindsightNote extends Note {
  error_type: string;
  error_message: string;
  stack_trace?: string;
  affected_components: string[];
  resolution: string | null;
  resolution_status: 'resolved' | 'workaround' | 'abandoned' | 'unknown';
  abandoned_reason?: string;
}

export interface StrategyNote extends Note {
  strategy_type: 'routing' | 'inventory' | 'dispatch' | 'general';
  success_rate?: number;
  applicable_conditions: string[];
}

export interface Trajectory {
  session_id: string;
  domain: string;
  task_description: string;
  events: TrajectoryEvent[];
  outcome: 'success' | 'failure' | 'partial';
  summary?: string;
}

export interface TrajectoryEvent {
  type: 'action' | 'error' | 'decision' | 'tool_call' | 'user_input' | 'llm_output';
  timestamp: Date;
  content: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface LLMProvider {
  complete(prompt: string): Promise<string>;
}

// ============================================================================
// Note Storage
// ============================================================================

export class NoteStorage {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async save(note: Note): Promise<Note> {
    const result = await this.pool.query<Note>(
      `INSERT INTO notes 
       (id, path, title, content, tags, linked_sessions, domain, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (path) DO UPDATE SET
         title = EXCLUDED.title,
         content = EXCLUDED.content,
         tags = EXCLUDED.tags,
         linked_sessions = array_cat(notes.linked_sessions, EXCLUDED.linked_sessions),
         updated_at = NOW()
       RETURNING *`,
      [
        note.id,
        note.path,
        note.title,
        note.content,
        note.tags,
        note.linked_sessions,
        note.domain || null,
        note.created_at,
        note.updated_at
      ]
    );
    return result.rows[0];
  }

  async saveHindsightNote(note: HindsightNote): Promise<HindsightNote> {
    const result = await this.pool.query<HindsightNote>(
      `INSERT INTO hindsight_notes 
       (id, path, title, content, tags, linked_sessions, domain,
        error_type, error_message, stack_trace, affected_components,
        resolution, resolution_status, abandoned_reason, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (path) DO UPDATE SET
         content = EXCLUDED.content,
         resolution = COALESCE(EXCLUDED.resolution, hindsight_notes.resolution),
         resolution_status = EXCLUDED.resolution_status,
         linked_sessions = array_cat(hindsight_notes.linked_sessions, EXCLUDED.linked_sessions),
         updated_at = NOW()
       RETURNING *`,
      [
        note.id,
        note.path,
        note.title,
        note.content,
        note.tags,
        note.linked_sessions,
        note.domain || null,
        note.error_type,
        note.error_message,
        note.stack_trace || null,
        note.affected_components,
        note.resolution,
        note.resolution_status,
        note.abandoned_reason || null,
        note.created_at,
        note.updated_at
      ]
    );
    return result.rows[0];
  }

  async getByPath(pathPrefix: string): Promise<Note[]> {
    const result = await this.pool.query<Note>(
      `SELECT * FROM notes WHERE path LIKE $1 ORDER BY updated_at DESC`,
      [`${pathPrefix}%`]
    );
    return result.rows;
  }

  async findByErrorType(errorType: string): Promise<HindsightNote[]> {
    const result = await this.pool.query<HindsightNote>(
      `SELECT * FROM hindsight_notes 
       WHERE error_type = $1 OR error_type LIKE $2
       ORDER BY 
         CASE resolution_status 
           WHEN 'resolved' THEN 1 
           WHEN 'workaround' THEN 2 
           ELSE 3 
         END,
         updated_at DESC
       LIMIT 10`,
      [errorType, `%${errorType}%`]
    );
    return result.rows;
  }

  async findByErrorMessage(messagePattern: string): Promise<HindsightNote[]> {
    const result = await this.pool.query<HindsightNote>(
      `SELECT * FROM hindsight_notes 
       WHERE error_message ILIKE $1
       ORDER BY updated_at DESC
       LIMIT 10`,
      [`%${messagePattern}%`]
    );
    return result.rows;
  }

  async findByComponent(component: string): Promise<HindsightNote[]> {
    const result = await this.pool.query<HindsightNote>(
      `SELECT * FROM hindsight_notes 
       WHERE $1 = ANY(affected_components)
       ORDER BY updated_at DESC
       LIMIT 20`,
      [component]
    );
    return result.rows;
  }

  async semanticSearch(
    query: string,
    options: { limit?: number; domain?: string }
  ): Promise<Note[]> {
    // This assumes you have pgvector set up with embeddings
    // For now, fall back to text search
    const result = await this.pool.query<Note>(
      `SELECT * FROM notes 
       WHERE 
         (to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', $1))
         ${options.domain ? 'AND domain = $3' : ''}
       ORDER BY ts_rank(to_tsvector('english', title || ' ' || content), plainto_tsquery('english', $1)) DESC
       LIMIT $2`,
      options.domain 
        ? [query, options.limit || 10, options.domain]
        : [query, options.limit || 10]
    );
    return result.rows;
  }

  async getByTags(tags: string[]): Promise<Note[]> {
    const result = await this.pool.query<Note>(
      `SELECT * FROM notes 
       WHERE tags && $1
       ORDER BY array_length(tags & $1, 1) DESC, updated_at DESC
       LIMIT 20`,
      [tags]
    );
    return result.rows;
  }

  async getRecentNotes(domain?: string, limit: number = 20): Promise<Note[]> {
    const result = await this.pool.query<Note>(
      `SELECT * FROM notes 
       ${domain ? 'WHERE domain = $2' : ''}
       ORDER BY updated_at DESC
       LIMIT $1`,
      domain ? [limit, domain] : [limit]
    );
    return result.rows;
  }

  async delete(noteId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM notes WHERE id = $1',
      [noteId]
    );
    return (result.rowCount ?? 0) > 0;
  }
}

// ============================================================================
// Note-Taking Agent
// ============================================================================

export class NoteTakingAgent {
  private llm: LLMProvider;
  private storage: NoteStorage;

  constructor(llm: LLMProvider, storage: NoteStorage) {
    this.llm = llm;
    this.storage = storage;
  }

  /**
   * Distill a session trajectory into persistent notes
   */
  async distillSession(trajectory: Trajectory): Promise<Note[]> {
    const notes: Note[] = [];

    // Extract strategy notes if successful
    if (trajectory.outcome === 'success' || trajectory.outcome === 'partial') {
      const strategyNote = await this.extractStrategies(trajectory);
      if (strategyNote) {
        notes.push(await this.storage.save(strategyNote));
      }
    }

    // Generate hindsight notes for all errors
    const errorEvents = trajectory.events.filter(e => e.type === 'error');
    for (const errorEvent of errorEvents) {
      const hindsightNote = await this.createHindsightNote(errorEvent, trajectory);
      if (hindsightNote) {
        notes.push(await this.storage.saveHindsightNote(hindsightNote));
      }
    }

    // Generate domain-specific insights
    const domainNote = await this.extractDomainInsights(trajectory);
    if (domainNote) {
      notes.push(await this.storage.save(domainNote));
    }

    return notes;
  }

  /**
   * Extract successful strategies from a trajectory
   */
  private async extractStrategies(trajectory: Trajectory): Promise<StrategyNote | null> {
    const prompt = `Analyze this successful task execution and extract reusable strategies.

TASK: ${trajectory.task_description}
DOMAIN: ${trajectory.domain}
OUTCOME: ${trajectory.outcome}

EVENTS:
${trajectory.events.map(e => `[${e.type}] ${JSON.stringify(e.content)}`).join('\n').substring(0, 5000)}

Extract strategies that can be reused in similar future tasks.
Return JSON:
{
  "has_reusable_strategy": true/false,
  "strategy_type": "routing|inventory|dispatch|general",
  "title": "Brief strategy title",
  "content": "Detailed markdown explanation of the strategy, including:\n- When to apply\n- Key steps\n- Why it works\n- Variations to consider",
  "applicable_conditions": ["condition1", "condition2"],
  "tags": ["tag1", "tag2"]
}

If no meaningful reusable strategy exists, set has_reusable_strategy to false.
Return ONLY valid JSON.`;

    const response = await this.llm.complete(prompt);
    
    try {
      const parsed = JSON.parse(response);
      if (!parsed.has_reusable_strategy) return null;

      return {
        id: uuid(),
        path: `domain/${trajectory.domain}/strategies/${parsed.strategy_type}/${Date.now()}.md`,
        title: parsed.title,
        content: parsed.content,
        tags: parsed.tags || [],
        linked_sessions: [trajectory.session_id],
        domain: trajectory.domain,
        strategy_type: parsed.strategy_type,
        applicable_conditions: parsed.applicable_conditions || [],
        created_at: new Date(),
        updated_at: new Date()
      };
    } catch {
      return null;
    }
  }

  /**
   * Create a hindsight note from an error event
   */
  private async createHindsightNote(
    errorEvent: TrajectoryEvent,
    trajectory: Trajectory
  ): Promise<HindsightNote | null> {
    // Find resolution if any
    const errorIndex = trajectory.events.indexOf(errorEvent);
    const subsequentEvents = trajectory.events.slice(errorIndex + 1);
    const wasResolved = trajectory.outcome === 'success';

    const prompt = `Analyze this error and create a hindsight note for future reference.

ERROR EVENT:
${JSON.stringify(errorEvent.content, null, 2)}

CONTEXT (events before error):
${trajectory.events.slice(Math.max(0, errorIndex - 5), errorIndex)
  .map(e => `[${e.type}] ${JSON.stringify(e.content)}`).join('\n')}

EVENTS AFTER ERROR:
${subsequentEvents.slice(0, 10)
  .map(e => `[${e.type}] ${JSON.stringify(e.content)}`).join('\n')}

TASK OUTCOME: ${trajectory.outcome}

Create a hindsight note with:
{
  "error_type": "Classification of the error (e.g., 'ValidationError', 'TimeoutError', 'RouteNotFound')",
  "error_message": "Core error message",
  "affected_components": ["component1", "component2"],
  "root_cause": "Why this happened",
  "resolution": "How it was fixed (if applicable)" or null,
  "resolution_status": "resolved|workaround|abandoned|unknown",
  "prevention_tips": "How to avoid this in future",
  "recovery_steps": "What to try if this happens again",
  "tags": ["tag1", "tag2"]
}

Return ONLY valid JSON.`;

    const response = await this.llm.complete(prompt);

    try {
      const parsed = JSON.parse(response);
      const sanitizedErrorType = parsed.error_type
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .substring(0, 50);

      return {
        id: uuid(),
        path: `hindsight/failures/by_error_type/${sanitizedErrorType}/${Date.now()}.md`,
        title: `Failure: ${parsed.error_message.substring(0, 100)}`,
        content: `# ${parsed.error_type}

## Error Message
${parsed.error_message}

## Root Cause
${parsed.root_cause}

## Affected Components
${parsed.affected_components.map((c: string) => `- ${c}`).join('\n')}

## Resolution
**Status**: ${parsed.resolution_status}
${parsed.resolution ? `\n${parsed.resolution}` : 'No resolution found.'}

## Prevention Tips
${parsed.prevention_tips}

## Recovery Steps
${parsed.recovery_steps}
`,
        tags: ['failure', parsed.error_type, ...parsed.tags],
        linked_sessions: [trajectory.session_id],
        domain: trajectory.domain,
        error_type: parsed.error_type,
        error_message: parsed.error_message,
        stack_trace: errorEvent.content.stack,
        affected_components: parsed.affected_components,
        resolution: parsed.resolution,
        resolution_status: parsed.resolution_status,
        created_at: new Date(),
        updated_at: new Date()
      };
    } catch {
      return null;
    }
  }

  /**
   * Extract domain-specific insights
   */
  private async extractDomainInsights(trajectory: Trajectory): Promise<Note | null> {
    const prompt = `Extract domain-specific insights from this ${trajectory.domain} task execution.

TASK: ${trajectory.task_description}
DOMAIN: ${trajectory.domain}
OUTCOME: ${trajectory.outcome}

KEY EVENTS:
${trajectory.events
  .filter(e => e.type === 'decision' || e.type === 'action')
  .slice(0, 20)
  .map(e => `[${e.type}] ${JSON.stringify(e.content)}`).join('\n')}

Look for:
- Domain conventions discovered
- Business rules observed
- Patterns specific to ${trajectory.domain}
- Integration points used

Return JSON:
{
  "has_insights": true/false,
  "title": "Insight title",
  "content": "Detailed markdown of the insights",
  "tags": ["tag1", "tag2"]
}

Return ONLY valid JSON.`;

    const response = await this.llm.complete(prompt);

    try {
      const parsed = JSON.parse(response);
      if (!parsed.has_insights) return null;

      return {
        id: uuid(),
        path: `domain/${trajectory.domain}/insights/${Date.now()}.md`,
        title: parsed.title,
        content: parsed.content,
        tags: ['insight', trajectory.domain, ...parsed.tags],
        linked_sessions: [trajectory.session_id],
        domain: trajectory.domain,
        created_at: new Date(),
        updated_at: new Date()
      };
    } catch {
      return null;
    }
  }
}

// ============================================================================
// Note Loader (for session initialization)
// ============================================================================

export class NoteLoader {
  private storage: NoteStorage;

  constructor(storage: NoteStorage) {
    this.storage = storage;
  }

  /**
   * Load relevant notes for a new session
   */
  async loadForSession(context: {
    domain?: string;
    taskDescription?: string;
    recentErrors?: Array<{ type: string; message: string }>;
  }): Promise<{
    domainNotes: Note[];
    hindsightNotes: HindsightNote[];
    relatedNotes: Note[];
  }> {
    const result = {
      domainNotes: [] as Note[],
      hindsightNotes: [] as HindsightNote[],
      relatedNotes: [] as Note[]
    };

    // Load domain-specific notes
    if (context.domain) {
      result.domainNotes = await this.storage.getByPath(`domain/${context.domain}/`);
    }

    // Load relevant hindsight notes based on recent errors
    if (context.recentErrors?.length) {
      for (const error of context.recentErrors.slice(0, 5)) {
        const relatedErrors = await this.storage.findByErrorType(error.type);
        result.hindsightNotes.push(...relatedErrors);
      }
      // Deduplicate
      result.hindsightNotes = [...new Map(
        result.hindsightNotes.map(n => [n.id, n])
      ).values()];
    }

    // Semantic search for related notes
    if (context.taskDescription) {
      result.relatedNotes = await this.storage.semanticSearch(
        context.taskDescription,
        { limit: 10, domain: context.domain }
      );
    }

    return result;
  }

  /**
   * Format loaded notes for context injection
   */
  formatNotesForContext(notes: {
    domainNotes: Note[];
    hindsightNotes: HindsightNote[];
    relatedNotes: Note[];
  }): string {
    const sections: string[] = [];

    if (notes.domainNotes.length > 0) {
      sections.push('## Domain Knowledge\n' + 
        notes.domainNotes.map(n => `### ${n.title}\n${n.content}`).join('\n\n'));
    }

    if (notes.hindsightNotes.length > 0) {
      sections.push('## Known Issues & Resolutions\n' +
        notes.hindsightNotes.map(n => 
          `### ${n.error_type}: ${n.title}\n` +
          `**Status**: ${n.resolution_status}\n` +
          `${n.resolution ? `**Resolution**: ${n.resolution}` : ''}`
        ).join('\n\n'));
    }

    if (notes.relatedNotes.length > 0) {
      sections.push('## Related Past Experiences\n' +
        notes.relatedNotes.map(n => `### ${n.title}\n${n.content.substring(0, 500)}...`).join('\n\n'));
    }

    return sections.join('\n\n---\n\n');
  }
}

// ============================================================================
// SQL Schema
// ============================================================================

export const NOTES_SCHEMA_SQL = `
-- General Notes
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path VARCHAR(500) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    linked_sessions UUID[] DEFAULT '{}',
    domain VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hindsight Notes (specialized for errors/failures)
CREATE TABLE IF NOT EXISTS hindsight_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path VARCHAR(500) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    linked_sessions UUID[] DEFAULT '{}',
    domain VARCHAR(50),
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    affected_components TEXT[] DEFAULT '{}',
    resolution TEXT,
    resolution_status VARCHAR(20) DEFAULT 'unknown' 
        CHECK (resolution_status IN ('resolved', 'workaround', 'abandoned', 'unknown')),
    abandoned_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_notes_path ON notes(path);
CREATE INDEX IF NOT EXISTS idx_notes_domain ON notes(domain);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_notes_sessions ON notes USING GIN(linked_sessions);
CREATE INDEX IF NOT EXISTS idx_notes_fulltext ON notes USING GIN(to_tsvector('english', title || ' ' || content));

CREATE INDEX IF NOT EXISTS idx_hindsight_error_type ON hindsight_notes(error_type);
CREATE INDEX IF NOT EXISTS idx_hindsight_components ON hindsight_notes USING GIN(affected_components);
CREATE INDEX IF NOT EXISTS idx_hindsight_status ON hindsight_notes(resolution_status);
CREATE INDEX IF NOT EXISTS idx_hindsight_domain ON hindsight_notes(domain);
`;

export default NoteTakingAgent;
