/**
 * Credit Decision Service
 * AI-powered credit decisioning with EON patterns
 */

import type { PrismaClient } from '@prisma/client';
import {
  getBfcEonClient,
  getBfcAiClient,
  getBfcCache,
  CircuitBreakers,
  retry,
  RetryPresets,
} from '@bfc/core';

export interface CreditApplication {
  customerId: string;
  loanType: 'HOME' | 'PERSONAL' | 'VEHICLE' | 'BUSINESS' | 'EDUCATION';
  requestedAmount: number;
  requestedTenure: number;
  purpose: string;
  annualIncome: number;
  existingEmi: number;
  employmentType: 'SALARIED' | 'SELF_EMPLOYED' | 'BUSINESS';
  employerName?: string;
  creditScore?: number;
}

export interface CreditDecision {
  applicationId: string;
  recommendation: 'APPROVE' | 'REJECT' | 'MANUAL_REVIEW';
  confidence: number;
  reasoning: string;
  suggestedTerms?: {
    amount: number;
    tenure: number;
    interestRate: number;
    emi: number;
  };
  riskFactors: string[];
  positiveFactors: string[];
  similarCases: Array<{
    outcome: string;
    similarity: number;
  }>;
}

export class CreditService {
  private aiCircuitBreaker = CircuitBreakers.forAiProxy();
  private eonCircuitBreaker = CircuitBreakers.forEon();

  constructor(private prisma: PrismaClient) {}

  /**
   * Process credit application with AI
   */
  async processApplication(application: CreditApplication): Promise<CreditDecision> {
    const cache = getBfcCache();
    const applicationId = `APP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Check cache for recent decision on same customer/amount
    const cacheKey = `${application.customerId}:${application.loanType}:${application.requestedAmount}`;
    const cached = await cache.getCreditDecision(cacheKey);
    if (cached) {
      return { ...cached, applicationId };
    }

    // Get customer context
    const customer = await this.prisma.customer.findUnique({
      where: { id: application.customerId },
      include: {
        products: true,
        episodes: {
          where: { module: 'LOAN' },
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Calculate risk score
    const riskScore = this.calculateRiskScore(application, customer);

    // Find similar cases from EON
    const similarCases = await this.findSimilarCases(application, customer);

    // Build context for AI
    const customerContext = await this.buildCustomerContext(application, customer);

    // Get AI decision with circuit breaker and retry
    const aiDecision = await retry(
      () => this.aiCircuitBreaker.execute(() => this.getAiDecision(application, customerContext, similarCases, riskScore)),
      RetryPresets.aiProxy()
    );

    // Calculate EMI if approved
    let suggestedTerms = aiDecision.suggestedTerms;
    if (aiDecision.recommendation === 'APPROVE' && suggestedTerms) {
      suggestedTerms.emi = this.calculateEmi(
        suggestedTerms.amount,
        suggestedTerms.interestRate,
        suggestedTerms.tenure
      );
    }

    // Store application in database
    await this.prisma.creditApplication.create({
      data: {
        id: applicationId,
        customerId: application.customerId,
        loanType: application.loanType,
        requestedAmount: application.requestedAmount,
        requestedTenure: application.requestedTenure,
        purpose: application.purpose,
        annualIncome: application.annualIncome,
        existingEmi: application.existingEmi,
        employmentType: application.employmentType,
        status: aiDecision.recommendation === 'APPROVE' ? 'APPROVED' :
                aiDecision.recommendation === 'REJECT' ? 'REJECTED' : 'PENDING_REVIEW',
        decisionReason: aiDecision.reasoning,
        riskScore,
        approvedAmount: suggestedTerms?.amount,
        approvedTenure: suggestedTerms?.tenure,
        interestRate: suggestedTerms?.interestRate,
      },
    });

    // Record episode
    const eon = getBfcEonClient();
    await eon.recordEpisode({
      customerId: application.customerId,
      state: `income:${application.annualIncome},existing_emi:${application.existingEmi},risk:${riskScore.toFixed(2)}`,
      action: `${application.loanType.toLowerCase()}_application_${application.requestedAmount}`,
      outcome: `${aiDecision.recommendation.toLowerCase()}_confidence:${aiDecision.confidence.toFixed(2)}`,
      success: aiDecision.recommendation === 'APPROVE',
      module: 'LOAN',
      channel: 'DIGITAL',
      riskImpact: aiDecision.recommendation === 'APPROVE' ? 0.1 : -0.1,
      metadata: {
        applicationId,
        loanType: application.loanType,
        amount: application.requestedAmount,
        decision: aiDecision.recommendation,
      },
    });

    const decision: CreditDecision = {
      applicationId,
      ...aiDecision,
      suggestedTerms,
      similarCases: similarCases.map((c) => ({
        outcome: c.episode.outcome,
        similarity: c.similarity,
      })),
    };

    // Cache the decision
    await cache.setCreditDecision(cacheKey, decision);

    return decision;
  }

  /**
   * Get application status
   */
  async getApplicationStatus(applicationId: string) {
    return this.prisma.creditApplication.findUnique({
      where: { id: applicationId },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Calculate risk score based on application and customer history
   */
  private calculateRiskScore(application: CreditApplication, customer: any): number {
    let score = 0.5; // Base score

    // Debt-to-income ratio
    const dti = (application.existingEmi * 12) / application.annualIncome;
    if (dti > 0.5) score += 0.2;
    else if (dti > 0.3) score += 0.1;
    else score -= 0.1;

    // Credit score impact
    if (application.creditScore) {
      if (application.creditScore > 750) score -= 0.15;
      else if (application.creditScore > 700) score -= 0.05;
      else if (application.creditScore < 650) score += 0.15;
    }

    // Customer history
    const loanEpisodes = customer.episodes || [];
    const successfulLoans = loanEpisodes.filter((e: any) => e.success).length;
    const failedLoans = loanEpisodes.filter((e: any) => !e.success).length;

    if (successfulLoans > 2) score -= 0.1;
    if (failedLoans > 0) score += 0.15;

    // Employment type
    if (application.employmentType === 'SALARIED') score -= 0.05;
    else if (application.employmentType === 'SELF_EMPLOYED') score += 0.05;

    // Existing customer trust score
    score = score * (1 - customer.trustScore * 0.2);

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Find similar cases from EON
   */
  private async findSimilarCases(application: CreditApplication, customer: any) {
    const eon = getBfcEonClient();

    const query = `${application.loanType} loan, income ${application.annualIncome}, amount ${application.requestedAmount}, segment ${customer.segment || 'unknown'}`;

    return retry(
      () => this.eonCircuitBreaker.execute(() =>
        eon.findSimilarCases({
          query,
          module: 'LOAN',
          limit: 10,
        })
      ),
      RetryPresets.standard()
    );
  }

  /**
   * Build customer context for AI
   */
  private async buildCustomerContext(application: CreditApplication, customer: any): Promise<string> {
    const eon = getBfcEonClient();

    const context = await eon.buildCreditContext({
      customerId: customer.id,
      applicationSummary: `${application.loanType} loan application for ₹${application.requestedAmount.toLocaleString()}`,
      includeHistory: true,
      maxTokens: 2000,
    });

    return `
Customer Profile:
- Name: ${customer.firstName} ${customer.lastName}
- Segment: ${customer.segment || 'Unknown'}
- Risk Score: ${customer.riskScore}
- Trust Score: ${customer.trustScore}
- Products: ${customer.products?.length || 0}
- Tenure: ${this.calculateTenure(customer.createdAt)} months

Behavioral Context:
${context}
`;
  }

  /**
   * Get AI decision
   */
  private async getAiDecision(
    application: CreditApplication,
    customerContext: string,
    similarCases: any[],
    riskScore: number
  ) {
    const ai = getBfcAiClient();

    return ai.creditDecision({
      application: {
        customerId: application.customerId,
        loanType: application.loanType,
        requestedAmount: application.requestedAmount,
        requestedTenure: application.requestedTenure,
        purpose: application.purpose,
        annualIncome: application.annualIncome,
        existingEmi: application.existingEmi,
      },
      customerContext,
      similarCases: similarCases.map((c) => ({
        outcome: c.episode.outcome,
        similarity: c.similarity,
      })),
      riskScore,
      creditScore: application.creditScore,
    });
  }

  /**
   * Calculate EMI
   */
  private calculateEmi(principal: number, annualRate: number, tenureMonths: number): number {
    const monthlyRate = annualRate / 12 / 100;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) /
                (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    return Math.round(emi);
  }

  /**
   * Calculate tenure in months
   */
  private calculateTenure(createdAt: Date): number {
    const now = new Date();
    const created = new Date(createdAt);
    return Math.max(0,
      (now.getFullYear() - created.getFullYear()) * 12 +
      (now.getMonth() - created.getMonth())
    );
  }
}
