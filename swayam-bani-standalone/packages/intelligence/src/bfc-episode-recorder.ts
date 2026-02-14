/**
 * BFC Episode Recorder
 * Captures financial conversations and records behavioral episodes for ankrBFC
 *
 * Episodes follow the state → action → outcome pattern for behavioral intelligence
 */

import type { Intent, ExtractedEntities, Message, EntityType } from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// EPISODE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface FinancialEpisode {
  id: string;
  userId: string;
  sessionId: string;
  timestamp: Date;

  // State: User context at time of interaction
  state: EpisodeState;

  // Action: What the user wanted/did
  action: EpisodeAction;

  // Outcome: Result of the interaction
  outcome: EpisodeOutcome;

  // Metadata
  module: FinancialModule;
  language: string;
  confidence: number;
  rawMessages?: Message[];
}

export interface EpisodeState {
  // Demographics (from user profile or extracted)
  demographics?: {
    age?: number;
    employmentType?: string;
    annualIncome?: number;
    location?: string;
  };

  // Financial profile
  financial?: {
    creditScore?: number;
    existingProducts?: string[];
    monthlyExpenses?: number;
    savingsRate?: number;
  };

  // Context
  context: string; // Natural language description
  contextHi?: string; // Hindi version
}

export interface EpisodeAction {
  type: FinancialActionType;
  intent: string;
  entities: ExtractedEntities;

  // Action-specific details
  details: Record<string, any>;

  // Natural language description
  description: string;
  descriptionHi?: string;
}

export interface EpisodeOutcome {
  success: boolean;
  result?: string;
  resultHi?: string;

  // Outcome-specific details
  details?: Record<string, any>;

  // Follow-up actions suggested
  suggestedActions?: string[];

  // Sentiment (positive, neutral, negative)
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export type FinancialModule =
  | 'credit'        // Loans, credit eligibility
  | 'insurance'     // Insurance quotes, claims
  | 'investment'    // Portfolio, recommendations
  | 'savings'       // Goals, budgets
  | 'payments'      // Bill pay, transfers
  | 'rewards'       // Offers, gamification
  | 'account'       // Account linking, summary
  | 'advice';       // Financial tips

export type FinancialActionType =
  | 'inquiry'       // Asking about eligibility, quotes
  | 'application'   // Applying for loan, insurance
  | 'check'         // Checking status, score, balance
  | 'comparison'    // Comparing offers, products
  | 'redemption'    // Redeeming rewards, offers
  | 'setup'         // Setting goals, budgets
  | 'modification'  // Changing preferences
  | 'cancellation'; // Canceling, closing

// ═══════════════════════════════════════════════════════════════════════════════
// BFC INTENTS TO MODULE MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

const INTENT_MODULE_MAP: Record<string, FinancialModule> = {
  // Credit
  credit_eligibility_check: 'credit',
  loan_apply: 'credit',
  loan_status_check: 'credit',
  credit_score_check: 'credit',
  emi_calculate: 'credit',

  // Insurance
  insurance_quote_request: 'insurance',
  insurance_claim: 'insurance',

  // Investment
  investment_portfolio_view: 'investment',
  investment_recommend: 'investment',

  // Savings
  financial_goal_set: 'savings',
  financial_goal_progress: 'savings',
  spending_analysis: 'savings',
  budget_set: 'savings',

  // Payments
  upi_send: 'payments',
  bill_pay: 'payments',

  // Rewards
  offers_view: 'rewards',
  offer_apply: 'rewards',
  rewards_check: 'rewards',
  rewards_redeem: 'rewards',

  // Account
  account_link: 'account',
  account_summary: 'account',

  // Advice
  financial_advice: 'advice',
};

const INTENT_ACTION_TYPE_MAP: Record<string, FinancialActionType> = {
  credit_eligibility_check: 'inquiry',
  loan_apply: 'application',
  loan_status_check: 'check',
  credit_score_check: 'check',
  insurance_quote_request: 'inquiry',
  insurance_claim: 'application',
  investment_portfolio_view: 'check',
  investment_recommend: 'inquiry',
  financial_goal_set: 'setup',
  financial_goal_progress: 'check',
  spending_analysis: 'check',
  budget_set: 'setup',
  offers_view: 'inquiry',
  offer_apply: 'application',
  rewards_check: 'check',
  rewards_redeem: 'redemption',
  account_link: 'setup',
  account_summary: 'check',
  financial_advice: 'inquiry',
};

// ═══════════════════════════════════════════════════════════════════════════════
// EPISODE RECORDER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class BFCEpisodeRecorder {
  private bfcApiUrl: string;
  private eonApiUrl: string;
  private pendingEpisodes: FinancialEpisode[] = [];
  private batchSize: number = 10;
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  constructor(config?: {
    bfcApiUrl?: string;
    eonApiUrl?: string;
    batchSize?: number;
    flushInterval?: number;
  }) {
    this.bfcApiUrl = config?.bfcApiUrl || process.env.BFC_API_URL || 'http://localhost:4020';
    this.eonApiUrl = config?.eonApiUrl || process.env.EON_API_URL || 'http://localhost:4005';
    this.batchSize = config?.batchSize || 10;
    this.flushInterval = config?.flushInterval || 30000;

    // Start periodic flush
    this.startPeriodicFlush();
  }

  /**
   * Record a financial episode from conversation
   */
  async recordEpisode(params: {
    userId: string;
    sessionId: string;
    intent: Intent;
    entities: ExtractedEntities;
    messages: Message[];
    userProfile?: Record<string, any>;
    outcome: {
      success: boolean;
      result?: string;
      resultHi?: string;
      details?: Record<string, any>;
    };
    language?: string;
  }): Promise<FinancialEpisode | null> {
    const { userId, sessionId, intent, entities, messages, userProfile, outcome, language = 'en' } = params;

    // Only record BFC-relevant intents
    const module = INTENT_MODULE_MAP[intent.primary];
    if (!module) {
      return null;
    }

    const actionType = INTENT_ACTION_TYPE_MAP[intent.primary] || 'inquiry';

    // Build episode
    const episode: FinancialEpisode = {
      id: this.generateEpisodeId(),
      userId,
      sessionId,
      timestamp: new Date(),

      state: this.buildState(entities, userProfile, messages),
      action: this.buildAction(intent, entities, actionType, messages),
      outcome: this.buildOutcome(outcome),

      module,
      language,
      confidence: intent.confidence,
      rawMessages: messages.slice(-5), // Keep last 5 messages
    };

    // Add to pending queue
    this.pendingEpisodes.push(episode);

    // Flush if batch size reached
    if (this.pendingEpisodes.length >= this.batchSize) {
      await this.flush();
    }

    return episode;
  }

  /**
   * Build episode state from extracted entities and user profile
   */
  private buildState(
    entities: ExtractedEntities,
    userProfile?: Record<string, any>,
    messages?: Message[]
  ): EpisodeState {
    const demographics: EpisodeState['demographics'] = {};
    const financial: EpisodeState['financial'] = {};

    // Extract from entities
    if (entities.age) {
      const age = this.getEntityValue(entities.age);
      demographics.age = parseInt(age) || undefined;
    }

    if (entities.employment_type) {
      demographics.employmentType = this.getEntityValue(entities.employment_type);
    }

    if (entities.annual_income) {
      const income = this.getEntityValue(entities.annual_income);
      demographics.annualIncome = parseInt(income) || undefined;
    }

    if (entities.location) {
      demographics.location = this.getEntityValue(entities.location);
    }

    if (entities.credit_score) {
      const score = this.getEntityValue(entities.credit_score);
      financial.creditScore = parseInt(score) || undefined;
    }

    // Merge with user profile
    if (userProfile) {
      if (userProfile.age && !demographics.age) demographics.age = userProfile.age;
      if (userProfile.employment && !demographics.employmentType) demographics.employmentType = userProfile.employment;
      if (userProfile.income && !demographics.annualIncome) demographics.annualIncome = userProfile.income;
      if (userProfile.creditScore && !financial.creditScore) financial.creditScore = userProfile.creditScore;
      if (userProfile.products) financial.existingProducts = userProfile.products;
    }

    // Build context description
    const contextParts: string[] = [];
    if (demographics.age) contextParts.push(`${demographics.age} years old`);
    if (demographics.employmentType) contextParts.push(demographics.employmentType.toLowerCase());
    if (demographics.annualIncome) contextParts.push(`income ₹${this.formatAmount(demographics.annualIncome)}`);
    if (financial.creditScore) contextParts.push(`CIBIL ${financial.creditScore}`);

    return {
      demographics: Object.keys(demographics).length > 0 ? demographics : undefined,
      financial: Object.keys(financial).length > 0 ? financial : undefined,
      context: contextParts.length > 0 ? contextParts.join(', ') : 'Unknown profile',
    };
  }

  /**
   * Build episode action from intent and entities
   */
  private buildAction(
    intent: Intent,
    entities: ExtractedEntities,
    actionType: FinancialActionType,
    messages: Message[]
  ): EpisodeAction {
    const details: Record<string, any> = {};

    // Extract relevant entity values
    const entityTypes: EntityType[] = [
      'loan_type', 'insurance_type', 'investment_type', 'goal_type',
      'amount', 'tenure', 'bank_name'
    ];

    for (const type of entityTypes) {
      if (entities[type]) {
        details[type] = this.getEntityValue(entities[type]);
      }
    }

    // Get the last user message for description
    const lastUserMessage = messages
      .filter(m => m.role === 'user')
      .pop()?.content || '';

    // Build natural language description
    const description = this.buildActionDescription(intent.primary, details);

    return {
      type: actionType,
      intent: intent.primary,
      entities,
      details,
      description,
    };
  }

  /**
   * Build natural language action description
   */
  private buildActionDescription(intent: string, details: Record<string, any>): string {
    const parts: string[] = [];

    switch (intent) {
      case 'credit_eligibility_check':
        parts.push('Checked loan eligibility');
        if (details.loan_type) parts.push(`for ${details.loan_type.toLowerCase().replace('_', ' ')}`);
        if (details.amount) parts.push(`of ₹${this.formatAmount(details.amount)}`);
        break;

      case 'loan_apply':
        parts.push('Applied for loan');
        if (details.loan_type) parts.push(`(${details.loan_type.toLowerCase().replace('_', ' ')})`);
        if (details.amount) parts.push(`amount ₹${this.formatAmount(details.amount)}`);
        if (details.tenure) parts.push(`tenure ${details.tenure}`);
        break;

      case 'insurance_quote_request':
        parts.push('Requested insurance quote');
        if (details.insurance_type) parts.push(`for ${details.insurance_type.toLowerCase().replace('_', ' ')}`);
        break;

      case 'investment_recommend':
        parts.push('Sought investment recommendations');
        if (details.amount) parts.push(`for ₹${this.formatAmount(details.amount)}`);
        if (details.investment_type) parts.push(`interested in ${details.investment_type}`);
        break;

      case 'financial_goal_set':
        parts.push('Set financial goal');
        if (details.goal_type) parts.push(`for ${details.goal_type.toLowerCase().replace('_', ' ')}`);
        if (details.amount) parts.push(`target ₹${this.formatAmount(details.amount)}`);
        break;

      case 'offers_view':
        parts.push('Viewed available offers');
        break;

      case 'rewards_redeem':
        parts.push('Redeemed reward points');
        break;

      case 'account_link':
        parts.push('Linked bank account');
        if (details.bank_name) parts.push(`(${details.bank_name})`);
        break;

      default:
        parts.push(`Performed ${intent.replace(/_/g, ' ')}`);
    }

    return parts.join(' ');
  }

  /**
   * Build episode outcome
   */
  private buildOutcome(outcome: {
    success: boolean;
    result?: string;
    resultHi?: string;
    details?: Record<string, any>;
  }): EpisodeOutcome {
    return {
      success: outcome.success,
      result: outcome.result,
      resultHi: outcome.resultHi,
      details: outcome.details,
      sentiment: outcome.success ? 'positive' : 'negative',
      suggestedActions: outcome.details?.suggestedActions,
    };
  }

  /**
   * Flush pending episodes to BFC API and EON
   */
  async flush(): Promise<void> {
    if (this.pendingEpisodes.length === 0) return;

    const episodes = [...this.pendingEpisodes];
    this.pendingEpisodes = [];

    try {
      // Send to BFC API
      await this.sendToBFC(episodes);

      // Store in EON memory for pattern learning
      await this.storeInEON(episodes);

      console.log(`[BFC] Flushed ${episodes.length} episodes`);
    } catch (error) {
      console.error('[BFC] Failed to flush episodes:', error);
      // Re-queue failed episodes
      this.pendingEpisodes = [...episodes, ...this.pendingEpisodes];
    }
  }

  /**
   * Send episodes to BFC API
   */
  private async sendToBFC(episodes: FinancialEpisode[]): Promise<void> {
    try {
      const response = await fetch(`${this.bfcApiUrl}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation RecordEpisodes($episodes: [EpisodeInput!]!) {
              recordEpisodes(episodes: $episodes) {
                count
                success
              }
            }
          `,
          variables: {
            episodes: episodes.map(ep => ({
              userId: ep.userId,
              sessionId: ep.sessionId,
              state: JSON.stringify(ep.state),
              action: ep.action.description,
              outcome: ep.outcome.result || (ep.outcome.success ? 'success' : 'failed'),
              success: ep.outcome.success,
              module: ep.module,
              metadata: {
                intent: ep.action.intent,
                entities: ep.action.details,
                language: ep.language,
                confidence: ep.confidence,
              },
            })),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`BFC API returned ${response.status}`);
      }
    } catch (error) {
      // Log but don't fail - episodes are already in EON
      console.error('[BFC] API send failed:', error);
    }
  }

  /**
   * Store episodes in EON memory for pattern learning
   */
  private async storeInEON(episodes: FinancialEpisode[]): Promise<void> {
    for (const episode of episodes) {
      try {
        // Build memory content
        const content = [
          `Financial Episode [${episode.module}]:`,
          `State: ${episode.state.context}`,
          `Action: ${episode.action.description}`,
          `Outcome: ${episode.outcome.result || (episode.outcome.success ? 'success' : 'failed')}`,
        ].join('\n');

        // Store in EON
        await fetch(`${this.eonApiUrl}/api/memory/remember`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            userId: episode.userId,
            namespace: 'bfc_episodes',
            metadata: {
              module: episode.module,
              intent: episode.action.intent,
              success: episode.outcome.success,
              entities: episode.action.details,
              timestamp: episode.timestamp.toISOString(),
            },
          }),
        });
      } catch (error) {
        console.error('[EON] Memory store failed:', error);
      }
    }
  }

  /**
   * Get similar past episodes for a user
   */
  async getSimilarEpisodes(params: {
    userId: string;
    query: string;
    module?: FinancialModule;
    limit?: number;
  }): Promise<any[]> {
    const { userId, query, module, limit = 5 } = params;

    try {
      const response = await fetch(`${this.eonApiUrl}/api/memory/recall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          userId,
          namespace: 'bfc_episodes',
          limit,
          filter: module ? { module } : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json() as { memories?: any[] };
        return data.memories || [];
      }
    } catch (error) {
      console.error('[EON] Recall failed:', error);
    }

    return [];
  }

  /**
   * Helper: Get normalized entity value
   */
  private getEntityValue(entity: any): string {
    if (Array.isArray(entity)) {
      return entity[0]?.normalizedValue || entity[0]?.value || '';
    }
    return entity?.normalizedValue || entity?.value || '';
  }

  /**
   * Helper: Format amount in Indian notation
   */
  private formatAmount(amount: number): string {
    if (amount >= 10000000) {
      return `${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `${(amount / 100000).toFixed(2)} L`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toString();
  }

  /**
   * Helper: Generate episode ID
   */
  private generateEpisodeId(): string {
    return `ep_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Start periodic flush timer
   */
  private startPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
  }

  /**
   * Stop recorder and flush remaining
   */
  async stop(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
  }
}

// Export singleton instance
export const bfcEpisodeRecorder = new BFCEpisodeRecorder();

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if an intent should be recorded as BFC episode
 */
export function isBFCIntent(intent: Intent): boolean {
  return intent.primary in INTENT_MODULE_MAP;
}

/**
 * Get the BFC module for an intent
 */
export function getBFCModule(intent: Intent): FinancialModule | null {
  return INTENT_MODULE_MAP[intent.primary] || null;
}

/**
 * Get all BFC intent names
 */
export function getBFCIntents(): string[] {
  return Object.keys(INTENT_MODULE_MAP);
}
