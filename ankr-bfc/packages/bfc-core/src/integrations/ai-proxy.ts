/**
 * BFC AI Proxy Integration
 *
 * Integrates with ANKR AI Proxy (port 4444) for:
 * - Credit decision AI
 * - Risk scoring
 * - Offer recommendations
 * - Life event detection
 * - Churn prediction
 */

// ============================================================================
// TYPES
// ============================================================================

export interface AiProxyConfig {
  baseUrl: string;           // http://localhost:4444
  defaultModel?: string;     // claude-3-sonnet, gpt-4, etc.
  timeout?: number;          // Request timeout in ms
  retries?: number;          // Number of retries
}

export interface CompletionRequest {
  model?: string;
  prompt?: string;
  messages?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
  context?: string;          // EON context to prepend
}

export interface CompletionResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latency: number;
}

// ============================================================================
// BFC AI CLIENT
// ============================================================================

/**
 * BFC AI Proxy Client
 *
 * Provides banking-specific AI operations using ANKR AI Proxy.
 *
 * Usage:
 * ```typescript
 * const ai = new BfcAiClient({ baseUrl: 'http://localhost:4444' });
 *
 * // Get credit decision
 * const decision = await ai.creditDecision({
 *   application: creditApplication,
 *   customerContext: 'Customer history from EON...',
 *   similarCases: [...],
 * });
 * ```
 */
export class BfcAiClient {
  private config: AiProxyConfig;

  constructor(config: AiProxyConfig) {
    this.config = {
      defaultModel: 'claude-3-sonnet',
      timeout: 30000,
      retries: 2,
      ...config,
    };
  }

  /**
   * AI-powered credit decision
   */
  async creditDecision(input: {
    application: {
      customerId: string;
      loanType: string;
      requestedAmount: number;
      requestedTenure: number;
      purpose: string;
      annualIncome: number;
      existingEmi: number;
    };
    customerContext: string;        // From EON
    similarCases: Array<{
      outcome: string;
      similarity: number;
    }>;
    riskScore: number;
    creditScore?: number;
  }): Promise<{
    recommendation: 'APPROVE' | 'REJECT' | 'MANUAL_REVIEW';
    confidence: number;
    reasoning: string;
    suggestedTerms?: {
      amount: number;
      tenure: number;
      interestRate: number;
    };
    riskFactors: string[];
    positiveFactors: string[];
  }> {
    const prompt = this.buildCreditDecisionPrompt(input);

    const response = await this.complete({
      messages: [
        {
          role: 'system',
          content: CREDIT_DECISION_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,  // More deterministic for credit decisions
      maxTokens: 1000,
    });

    return this.parseCreditDecisionResponse(response.content);
  }

  /**
   * AI-powered churn prediction
   */
  async predictChurn(input: {
    customerId: string;
    customerContext: string;
    recentEpisodes: Array<{
      action: string;
      outcome: string;
      success: boolean;
    }>;
    productUsage: {
      activeProducts: number;
      dormantProducts: number;
      recentTransactions: number;
    };
  }): Promise<{
    churnProbability: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    factors: Array<{
      factor: string;
      impact: number;
      description: string;
    }>;
    suggestedActions: string[];
  }> {
    const prompt = this.buildChurnPredictionPrompt(input);

    const response = await this.complete({
      messages: [
        {
          role: 'system',
          content: CHURN_PREDICTION_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      maxTokens: 800,
    });

    return this.parseChurnPredictionResponse(response.content);
  }

  /**
   * AI-powered life event detection
   */
  async detectLifeEvents(input: {
    customerId: string;
    recentTransactions: Array<{
      category: string;
      amount: number;
      merchant?: string;
    }>;
    demographicChanges?: Record<string, unknown>;
  }): Promise<Array<{
    eventType: string;
    confidence: number;
    evidence: string[];
    suggestedOffers: string[];
  }>> {
    const prompt = this.buildLifeEventPrompt(input);

    const response = await this.complete({
      messages: [
        {
          role: 'system',
          content: LIFE_EVENT_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
      maxTokens: 600,
    });

    return this.parseLifeEventResponse(response.content);
  }

  /**
   * Generate personalized offer recommendations
   */
  async recommendOffers(input: {
    customerId: string;
    customerContext: string;
    eligibleProducts: string[];
    recentInteractions: string[];
    lifeEvents?: string[];
  }): Promise<Array<{
    offerType: string;
    title: string;
    description: string;
    confidence: number;
    reasoning: string;
  }>> {
    const prompt = this.buildOfferRecommendationPrompt(input);

    const response = await this.complete({
      messages: [
        {
          role: 'system',
          content: OFFER_RECOMMENDATION_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      maxTokens: 800,
    });

    return this.parseOfferRecommendationResponse(response.content);
  }

  /**
   * Raw completion call to AI Proxy
   */
  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now();

    const body = {
      model: request.model || this.config.defaultModel,
      messages: request.messages || [{ role: 'user', content: request.prompt! }],
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2000,
    };

    const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeout!),
    });

    if (!response.ok) {
      throw new Error(`AI Proxy error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    return {
      content: result.choices[0].message.content,
      model: result.model,
      usage: {
        promptTokens: result.usage?.prompt_tokens || 0,
        completionTokens: result.usage?.completion_tokens || 0,
        totalTokens: result.usage?.total_tokens || 0,
      },
      latency: Date.now() - startTime,
    };
  }

  // ============================================================================
  // PROMPT BUILDERS
  // ============================================================================

  private buildCreditDecisionPrompt(input: any): string {
    return `
## Credit Application

**Customer ID:** ${input.application.customerId}
**Loan Type:** ${input.application.loanType}
**Requested Amount:** ₹${input.application.requestedAmount.toLocaleString()}
**Requested Tenure:** ${input.application.requestedTenure} months
**Purpose:** ${input.application.purpose}
**Annual Income:** ₹${input.application.annualIncome.toLocaleString()}
**Existing EMI:** ₹${input.application.existingEmi.toLocaleString()}

## Customer Context
${input.customerContext}

## Risk Assessment
**Risk Score:** ${input.riskScore.toFixed(2)}
**Credit Score:** ${input.creditScore || 'Not available'}

## Similar Past Cases
${input.similarCases.map((c: any, i: number) => `${i + 1}. ${c.outcome} (${(c.similarity * 100).toFixed(0)}% similar)`).join('\n')}

Analyze this application and provide your recommendation in JSON format.
`;
  }

  private buildChurnPredictionPrompt(input: any): string {
    return `
## Customer Analysis for Churn Prediction

**Customer ID:** ${input.customerId}

## Customer Context
${input.customerContext}

## Recent Activity
${input.recentEpisodes.map((e: any) => `- ${e.action}: ${e.outcome} (${e.success ? 'Success' : 'Failure'})`).join('\n')}

## Product Usage
- Active Products: ${input.productUsage.activeProducts}
- Dormant Products: ${input.productUsage.dormantProducts}
- Recent Transactions: ${input.productUsage.recentTransactions}

Analyze churn risk and provide response in JSON format.
`;
  }

  private buildLifeEventPrompt(input: any): string {
    return `
## Transaction Pattern Analysis

**Customer ID:** ${input.customerId}

## Recent Transactions
${input.recentTransactions.map((t: any) => `- ${t.category}: ₹${t.amount}${t.merchant ? ` at ${t.merchant}` : ''}`).join('\n')}

Detect any life events from these patterns. Respond in JSON format.
`;
  }

  private buildOfferRecommendationPrompt(input: any): string {
    return `
## Offer Recommendation Request

**Customer ID:** ${input.customerId}

## Customer Context
${input.customerContext}

## Eligible Products
${input.eligibleProducts.join(', ')}

## Recent Interactions
${input.recentInteractions.join('\n')}

${input.lifeEvents?.length ? `## Detected Life Events\n${input.lifeEvents.join(', ')}` : ''}

Recommend personalized offers. Respond in JSON format.
`;
  }

  // ============================================================================
  // RESPONSE PARSERS
  // ============================================================================

  private parseCreditDecisionResponse(content: string): any {
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
    } catch {
      // Fallback
    }

    return {
      recommendation: 'MANUAL_REVIEW',
      confidence: 0.5,
      reasoning: content,
      riskFactors: [],
      positiveFactors: [],
    };
  }

  private parseChurnPredictionResponse(content: string): any {
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
    } catch {
      // Fallback
    }

    return {
      churnProbability: 0.5,
      riskLevel: 'MEDIUM',
      factors: [],
      suggestedActions: [],
    };
  }

  private parseLifeEventResponse(content: string): any[] {
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
    } catch {
      // Fallback
    }
    return [];
  }

  private parseOfferRecommendationResponse(content: string): any[] {
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
    } catch {
      // Fallback
    }
    return [];
  }
}

// ============================================================================
// SYSTEM PROMPTS
// ============================================================================

const CREDIT_DECISION_SYSTEM_PROMPT = `You are a senior credit analyst AI for a bank. Your job is to analyze loan applications and provide recommendations.

You must respond in valid JSON format with this structure:
{
  "recommendation": "APPROVE" | "REJECT" | "MANUAL_REVIEW",
  "confidence": 0.0-1.0,
  "reasoning": "explanation",
  "suggestedTerms": { "amount": number, "tenure": number, "interestRate": number } (only if APPROVE),
  "riskFactors": ["factor1", "factor2"],
  "positiveFactors": ["factor1", "factor2"]
}

Consider:
- Debt-to-income ratio (should be < 50%)
- Credit history from similar cases
- Risk score and credit score
- Purpose of loan
- Income stability`;

const CHURN_PREDICTION_SYSTEM_PROMPT = `You are a customer analytics AI. Analyze customer behavior to predict churn risk.

Respond in JSON format:
{
  "churnProbability": 0.0-1.0,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "factors": [{"factor": "name", "impact": -1 to 1, "description": "explanation"}],
  "suggestedActions": ["action1", "action2"]
}

Look for:
- Declining engagement
- Product dormancy
- Negative interactions
- Competitor behavior signals`;

const LIFE_EVENT_SYSTEM_PROMPT = `You are a life event detection AI. Analyze transaction patterns to detect life events.

Respond in JSON array format:
[{
  "eventType": "MARRIAGE" | "CHILD_BIRTH" | "JOB_CHANGE" | "SALARY_INCREASE" | "HOME_PURCHASE" | "RELOCATION",
  "confidence": 0.0-1.0,
  "evidence": ["evidence1", "evidence2"],
  "suggestedOffers": ["offer1", "offer2"]
}]

Look for spending patterns indicating:
- Wedding (jewelry, venue, travel)
- Baby (hospital, baby products)
- Job change (salary timing change)
- Home purchase (furniture, appliances)`;

const OFFER_RECOMMENDATION_SYSTEM_PROMPT = `You are a banking offer recommendation AI. Suggest personalized offers based on customer profile.

Respond in JSON array format:
[{
  "offerType": "HOME_LOAN" | "PERSONAL_LOAN" | "CREDIT_CARD" | "FD" | "INSURANCE" | etc,
  "title": "Offer title",
  "description": "Brief description",
  "confidence": 0.0-1.0,
  "reasoning": "Why this offer"
}]

Consider:
- Customer eligibility
- Recent life events
- Interaction history
- Cross-sell opportunities`;

// ============================================================================
// FACTORY
// ============================================================================

let defaultAiClient: BfcAiClient | null = null;

export function createBfcAiClient(config: AiProxyConfig): BfcAiClient {
  return new BfcAiClient(config);
}

export function getBfcAiClient(): BfcAiClient {
  if (!defaultAiClient) {
    defaultAiClient = new BfcAiClient({
      baseUrl: process.env.AI_PROXY_URL || 'http://localhost:4444',
    });
  }
  return defaultAiClient;
}
