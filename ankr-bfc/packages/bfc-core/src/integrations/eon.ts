/**
 * BFC EON Integration
 *
 * Integrates with @ankr/eon for:
 * - Episode memory (customer behavioral patterns)
 * - Vector search (similar cases)
 * - Context assembly (for AI decisions)
 */

// ============================================================================
// TYPES FOR BFC EPISODES
// ============================================================================

export interface BfcEpisode {
  id?: string;
  customerId: string;

  // State-Action-Outcome pattern
  state: string;           // Customer context
  action: string;          // What happened
  outcome: string;         // Result
  success: boolean;

  // BFC-specific
  module: BfcEpisodeModule;
  subModule?: string;
  channel: string;

  // Scoring
  riskImpact?: number;     // -1 to 1, impact on risk
  trustImpact?: number;    // -1 to 1, impact on trust

  // Metadata
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

export type BfcEpisodeModule =
  | 'LOAN'
  | 'DEPOSIT'
  | 'PAYMENT'
  | 'CARD'
  | 'INVESTMENT'
  | 'INSURANCE'
  | 'SUPPORT'
  | 'KYC'
  | 'ONBOARDING'
  | 'COMPLIANCE';

// ============================================================================
// EON CLIENT WRAPPER FOR BFC
// ============================================================================

export interface EonClientConfig {
  mode: 'embedded' | 'service';
  databaseUrl?: string;
  serviceUrl?: string;  // http://localhost:4005 for EON service
}

/**
 * BFC EON Client
 *
 * Provides type-safe wrappers around @ankr/eon for banking use cases.
 *
 * Usage:
 * ```typescript
 * const eon = new BfcEonClient({ mode: 'service', serviceUrl: 'http://localhost:4005' });
 *
 * // Record a credit application episode
 * await eon.recordEpisode({
 *   customerId: 'cust-123',
 *   state: 'age 35, income 50L, existing loans 2',
 *   action: 'applied_for_home_loan',
 *   outcome: 'approved_at_8.5%',
 *   success: true,
 *   module: 'LOAN',
 *   channel: 'DIGITAL',
 * });
 *
 * // Find similar cases for credit decisioning
 * const similar = await eon.findSimilarCases({
 *   query: 'age 35, income 50L, home loan application',
 *   module: 'LOAN',
 *   limit: 20,
 *   successOnly: false,  // Include failures to learn
 * });
 * ```
 */
export class BfcEonClient {
  private config: EonClientConfig;
  private eonInstance: any = null;

  constructor(config: EonClientConfig) {
    this.config = config;
  }

  /**
   * Initialize EON connection
   */
  async initialize(): Promise<void> {
    if (this.config.mode === 'embedded') {
      // Lazy import @ankr/eon
      const { EON } = await import('@ankr/eon');
      this.eonInstance = new EON({
        mode: 'embedded',
        databaseUrl: this.config.databaseUrl!,
      });
    }
    // Service mode uses HTTP calls
  }

  /**
   * Record a behavioral episode
   */
  async recordEpisode(episode: BfcEpisode): Promise<string> {
    const content = this.formatEpisodeContent(episode);

    if (this.config.mode === 'service') {
      const response = await fetch(`${this.config.serviceUrl}/api/memory/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          userId: episode.customerId,
          metadata: {
            module: episode.module,
            subModule: episode.subModule,
            channel: episode.channel,
            success: episode.success,
            riskImpact: episode.riskImpact,
            trustImpact: episode.trustImpact,
            ...episode.metadata,
          },
        }),
      });

      const result = await response.json();
      return result.id;
    }

    // Embedded mode
    const result = await this.eonInstance.memory.store({
      content,
      userId: episode.customerId,
      metadata: {
        module: episode.module,
        subModule: episode.subModule,
        channel: episode.channel,
        success: episode.success,
        riskImpact: episode.riskImpact,
        trustImpact: episode.trustImpact,
        ...episode.metadata,
      },
    });

    return result.id;
  }

  /**
   * Find similar cases using vector search
   */
  async findSimilarCases(options: {
    query: string;
    module?: BfcEpisodeModule;
    limit?: number;
    successOnly?: boolean;
  }): Promise<Array<{
    episode: BfcEpisode;
    similarity: number;
  }>> {
    const { query, module, limit = 10, successOnly = false } = options;

    if (this.config.mode === 'service') {
      const params = new URLSearchParams({
        query,
        limit: limit.toString(),
        ...(module && { filter: JSON.stringify({ module }) }),
        ...(successOnly && { filter: JSON.stringify({ success: true }) }),
      });

      const response = await fetch(
        `${this.config.serviceUrl}/api/memory/search?${params}`
      );
      const results = await response.json();

      return results.map((r: any) => ({
        episode: this.parseEpisodeContent(r.content, r.metadata),
        similarity: r.score,
      }));
    }

    // Embedded mode
    const results = await this.eonInstance.memory.search(query);

    return results.map((r: any) => ({
      episode: this.parseEpisodeContent(r.content, r.metadata),
      similarity: r.score,
    }));
  }

  /**
   * Build context for AI credit decisions
   */
  async buildCreditContext(options: {
    customerId: string;
    applicationSummary: string;
    includeHistory?: boolean;
    maxTokens?: number;
  }): Promise<string> {
    const { customerId, applicationSummary, includeHistory = true, maxTokens = 4000 } = options;

    if (this.config.mode === 'service') {
      const response = await fetch(`${this.config.serviceUrl}/api/context/assemble`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: applicationSummary,
          strategy: 'hybrid',
          userId: customerId,
          tokenBudget: maxTokens,
          includeHistory,
          filters: { module: 'LOAN' },
        }),
      });

      const result = await response.json();
      return result.context;
    }

    // Embedded mode
    const context = await this.eonInstance.context.assemble({
      query: applicationSummary,
      strategy: 'hybrid',
      userId: customerId,
      tokenBudget: maxTokens,
    });

    return context.assembled;
  }

  /**
   * Get customer's episode history
   */
  async getCustomerHistory(
    customerId: string,
    options?: {
      module?: BfcEpisodeModule;
      limit?: number;
      from?: Date;
      to?: Date;
    }
  ): Promise<BfcEpisode[]> {
    if (this.config.mode === 'service') {
      const params = new URLSearchParams({
        userId: customerId,
        limit: (options?.limit || 50).toString(),
        ...(options?.module && { filter: JSON.stringify({ module: options.module }) }),
      });

      const response = await fetch(
        `${this.config.serviceUrl}/api/events/timeline/customer/${customerId}?${params}`
      );
      const results = await response.json();

      return results.map((r: any) => this.parseEpisodeContent(r.content, r.metadata));
    }

    // Embedded mode
    const results = await this.eonInstance.events.timeline('customer', customerId);
    return results.map((r: any) => this.parseEpisodeContent(r.content, r.metadata));
  }

  /**
   * Calculate pattern success rate
   */
  async getPatternSuccessRate(options: {
    context: string;
    action: string;
    module: BfcEpisodeModule;
  }): Promise<{
    successRate: number;
    sampleSize: number;
    confidence: number;
  }> {
    const similar = await this.findSimilarCases({
      query: `${options.context} ${options.action}`,
      module: options.module,
      limit: 100,
    });

    const sampleSize = similar.length;
    if (sampleSize === 0) {
      return { successRate: 0.5, sampleSize: 0, confidence: 0 };
    }

    const successCount = similar.filter(s => s.episode.success).length;
    const successRate = successCount / sampleSize;

    // Confidence increases with sample size (Wilson score interval approximation)
    const z = 1.96; // 95% confidence
    const p = successRate;
    const n = sampleSize;
    const confidence = Math.min(1, (n * p * (1 - p)) / (z * z * n));

    return { successRate, sampleSize, confidence };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private formatEpisodeContent(episode: BfcEpisode): string {
    return `[${episode.module}] ${episode.state} → ${episode.action} → ${episode.outcome} (${episode.success ? 'SUCCESS' : 'FAILURE'})`;
  }

  private parseEpisodeContent(content: string, metadata: any): BfcEpisode {
    // Parse the formatted content back to episode
    const match = content.match(/\[(\w+)\] (.+) → (.+) → (.+) \((SUCCESS|FAILURE)\)/);

    if (match) {
      return {
        module: match[1] as BfcEpisodeModule,
        state: match[2],
        action: match[3],
        outcome: match[4],
        success: match[5] === 'SUCCESS',
        customerId: metadata?.userId || '',
        channel: metadata?.channel || 'UNKNOWN',
        subModule: metadata?.subModule,
        riskImpact: metadata?.riskImpact,
        trustImpact: metadata?.trustImpact,
        metadata: metadata,
      };
    }

    // Fallback for non-standard format
    return {
      module: metadata?.module || 'SUPPORT',
      state: content,
      action: 'unknown',
      outcome: 'unknown',
      success: metadata?.success || false,
      customerId: metadata?.userId || '',
      channel: metadata?.channel || 'UNKNOWN',
      metadata,
    };
  }
}

// ============================================================================
// FACTORY
// ============================================================================

let defaultClient: BfcEonClient | null = null;

export function createBfcEonClient(config: EonClientConfig): BfcEonClient {
  return new BfcEonClient(config);
}

export function getBfcEonClient(): BfcEonClient {
  if (!defaultClient) {
    defaultClient = new BfcEonClient({
      mode: 'service',
      serviceUrl: process.env.EON_URL || 'http://localhost:4005',
    });
  }
  return defaultClient;
}
