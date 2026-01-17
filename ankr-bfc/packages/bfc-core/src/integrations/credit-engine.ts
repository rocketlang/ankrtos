/**
 * AI Credit Decision Engine - BFC Platform
 *
 * Intelligent credit decisioning with pattern matching and AI
 */

import { AIProxyClient } from './ai-proxy';
import { EonClient } from './eon';
import { CircuitBreaker, CircuitBreakerPresets } from '../reliability/circuit-breaker';
import { retry, RetryPresets } from '../reliability/retry';
import { logger } from '../observability/logger';

// =============================================================================
// TYPES
// =============================================================================

export interface CreditApplication {
  applicationId: string;
  customerId: string;
  productType: 'HOME_LOAN' | 'PERSONAL_LOAN' | 'CAR_LOAN' | 'BUSINESS_LOAN' | 'CREDIT_CARD' | 'OVERDRAFT';

  // Applicant details
  applicant: {
    name: string;
    age: number;
    gender?: string;
    occupation: string;
    employmentType: 'SALARIED' | 'SELF_EMPLOYED' | 'BUSINESS' | 'RETIRED' | 'OTHER';
    employer?: string;
    designation?: string;
    yearsEmployed?: number;
    residenceType: 'OWNED' | 'RENTED' | 'FAMILY' | 'COMPANY_PROVIDED';
    yearsAtResidence?: number;
    maritalStatus?: string;
    dependents?: number;
  };

  // Financial details
  financial: {
    monthlyIncome: number;
    additionalIncome?: number;
    existingEmi?: number;
    existingLoans?: { type: string; outstanding: number; emi: number }[];
    bankBalance?: number;
    investments?: number;
    assets?: number;
    liabilities?: number;
  };

  // Loan request
  request: {
    amount: number;
    tenure: number; // months
    purpose?: string;
  };

  // Scores
  bureauScore?: number;
  internalRiskScore?: number;
  trustScore?: number;

  // Documents
  documentsProvided?: string[];

  // Metadata
  channel: string;
  branchCode?: string;
  submittedAt: Date;
}

export interface CreditDecision {
  applicationId: string;
  decision: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW' | 'CONDITIONAL_APPROVAL';

  // Approval details
  approvedAmount?: number;
  approvedTenure?: number;
  interestRate?: number;
  processingFee?: number;
  emiAmount?: number;

  // Conditions (for conditional approval)
  conditions?: string[];

  // Rejection reasons
  rejectionReasons?: string[];

  // Risk assessment
  riskGrade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  riskScore: number; // 0-100
  defaultProbability: number; // 0-1

  // Policy checks
  policyChecks: PolicyCheck[];

  // AI insights
  aiConfidence: number;
  aiReasoning: string;
  similarCases?: SimilarCase[];

  // Processing
  processingTime: number; // ms
  decidedAt: Date;
  decidedBy: 'AI' | 'RULES' | 'MANUAL';
  requiresApproval?: string; // Role that needs to approve
}

export interface PolicyCheck {
  policy: string;
  passed: boolean;
  value?: number | string;
  threshold?: number | string;
  message?: string;
}

export interface SimilarCase {
  customerId: string;
  similarity: number;
  outcome: 'APPROVED' | 'REJECTED' | 'DEFAULT' | 'PERFORMING';
  amount: number;
  tenure: number;
  interestRate?: number;
  currentStatus?: string;
}

export interface CreditPolicy {
  productType: string;
  minAge: number;
  maxAge: number;
  minIncome: number;
  maxLoanAmount: number;
  maxLtv?: number; // Loan to Value
  maxFoir: number; // Fixed Obligations to Income Ratio
  minBureauScore: number;
  minTenure: number;
  maxTenure: number;
  baseRate: number;
  riskPremium: Record<string, number>; // By risk grade
  requiredDocuments: string[];
}

// =============================================================================
// CREDIT POLICIES
// =============================================================================

export const creditPolicies: Record<string, CreditPolicy> = {
  HOME_LOAN: {
    productType: 'HOME_LOAN',
    minAge: 21,
    maxAge: 65,
    minIncome: 25000,
    maxLoanAmount: 50000000, // 5 crore
    maxLtv: 0.8, // 80%
    maxFoir: 0.6, // 60%
    minBureauScore: 650,
    minTenure: 12,
    maxTenure: 360, // 30 years
    baseRate: 8.5,
    riskPremium: { A: 0, B: 0.25, C: 0.5, D: 1, E: 1.5, F: 2 },
    requiredDocuments: ['PAN', 'AADHAAR', 'SALARY_SLIP', 'BANK_STATEMENT', 'PROPERTY_DOCS'],
  },
  PERSONAL_LOAN: {
    productType: 'PERSONAL_LOAN',
    minAge: 21,
    maxAge: 60,
    minIncome: 20000,
    maxLoanAmount: 2500000, // 25 lakh
    maxFoir: 0.5, // 50%
    minBureauScore: 700,
    minTenure: 6,
    maxTenure: 60, // 5 years
    baseRate: 12,
    riskPremium: { A: 0, B: 0.5, C: 1, D: 2, E: 3, F: 4 },
    requiredDocuments: ['PAN', 'AADHAAR', 'SALARY_SLIP', 'BANK_STATEMENT'],
  },
  CAR_LOAN: {
    productType: 'CAR_LOAN',
    minAge: 21,
    maxAge: 65,
    minIncome: 25000,
    maxLoanAmount: 10000000, // 1 crore
    maxLtv: 0.85, // 85%
    maxFoir: 0.55,
    minBureauScore: 675,
    minTenure: 12,
    maxTenure: 84, // 7 years
    baseRate: 9,
    riskPremium: { A: 0, B: 0.5, C: 1, D: 1.5, E: 2, F: 2.5 },
    requiredDocuments: ['PAN', 'AADHAAR', 'SALARY_SLIP', 'BANK_STATEMENT'],
  },
  BUSINESS_LOAN: {
    productType: 'BUSINESS_LOAN',
    minAge: 25,
    maxAge: 65,
    minIncome: 50000,
    maxLoanAmount: 50000000, // 5 crore
    maxFoir: 0.65,
    minBureauScore: 680,
    minTenure: 12,
    maxTenure: 120, // 10 years
    baseRate: 14,
    riskPremium: { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5 },
    requiredDocuments: ['PAN', 'GSTIN', 'ITR', 'BANK_STATEMENT', 'BUSINESS_PROOF'],
  },
  CREDIT_CARD: {
    productType: 'CREDIT_CARD',
    minAge: 21,
    maxAge: 60,
    minIncome: 15000,
    maxLoanAmount: 500000, // 5 lakh limit
    maxFoir: 0.4,
    minBureauScore: 700,
    minTenure: 0,
    maxTenure: 0,
    baseRate: 42, // Annual rate for revolving
    riskPremium: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 },
    requiredDocuments: ['PAN', 'SALARY_SLIP'],
  },
  OVERDRAFT: {
    productType: 'OVERDRAFT',
    minAge: 21,
    maxAge: 65,
    minIncome: 30000,
    maxLoanAmount: 2000000, // 20 lakh
    maxFoir: 0.5,
    minBureauScore: 720,
    minTenure: 0,
    maxTenure: 12,
    baseRate: 15,
    riskPremium: { A: 0, B: 0.5, C: 1, D: 1.5, E: 2, F: 3 },
    requiredDocuments: ['PAN', 'BANK_STATEMENT'],
  },
};

// =============================================================================
// CREDIT ENGINE
// =============================================================================

export class CreditEngine {
  private aiProxy: AIProxyClient;
  private eon: EonClient;
  private circuitBreaker: CircuitBreaker;

  constructor() {
    this.aiProxy = new AIProxyClient();
    this.eon = new EonClient();
    this.circuitBreaker = new CircuitBreaker(CircuitBreakerPresets.ai);
  }

  /**
   * Process credit application
   */
  @retry(RetryPresets.critical)
  async processApplication(application: CreditApplication): Promise<CreditDecision> {
    const startTime = Date.now();
    logger.info('Processing credit application', {
      applicationId: application.applicationId,
      productType: application.productType,
    });

    try {
      // 1. Get policy for product type
      const policy = creditPolicies[application.productType];
      if (!policy) {
        throw new Error(`No policy found for product type: ${application.productType}`);
      }

      // 2. Run policy checks
      const policyChecks = this.runPolicyChecks(application, policy);

      // 3. Calculate risk score
      const riskAssessment = this.calculateRiskScore(application, policyChecks);

      // 4. Find similar cases from EON memory
      const similarCases = await this.findSimilarCases(application);

      // 5. Get AI decision if policy checks pass
      let aiDecision: { decision: string; reasoning: string; confidence: number } | null = null;

      if (!policyChecks.some((p) => !p.passed && p.policy.startsWith('HARD_'))) {
        aiDecision = await this.getAIDecision(application, policyChecks, similarCases);
      }

      // 6. Make final decision
      const decision = this.makeFinalDecision(
        application,
        policy,
        policyChecks,
        riskAssessment,
        aiDecision,
        similarCases
      );

      decision.processingTime = Date.now() - startTime;

      // 7. Store episode in EON
      await this.storeDecisionEpisode(application, decision);

      logger.info('Credit decision made', {
        applicationId: application.applicationId,
        decision: decision.decision,
        riskGrade: decision.riskGrade,
        processingTime: decision.processingTime,
      });

      return decision;
    } catch (error) {
      logger.error('Credit processing failed', { error, applicationId: application.applicationId });

      // Return manual review decision on error
      return {
        applicationId: application.applicationId,
        decision: 'MANUAL_REVIEW',
        riskGrade: 'D',
        riskScore: 50,
        defaultProbability: 0.1,
        policyChecks: [],
        aiConfidence: 0,
        aiReasoning: 'System error - manual review required',
        processingTime: Date.now() - startTime,
        decidedAt: new Date(),
        decidedBy: 'RULES',
        requiresApproval: 'BRANCH_MANAGER',
      };
    }
  }

  /**
   * Run policy checks
   */
  private runPolicyChecks(application: CreditApplication, policy: CreditPolicy): PolicyCheck[] {
    const checks: PolicyCheck[] = [];
    const { applicant, financial, request } = application;

    // Age check (HARD)
    checks.push({
      policy: 'HARD_AGE_MIN',
      passed: applicant.age >= policy.minAge,
      value: applicant.age,
      threshold: policy.minAge,
      message: `Minimum age requirement: ${policy.minAge}`,
    });

    checks.push({
      policy: 'HARD_AGE_MAX',
      passed: applicant.age <= policy.maxAge,
      value: applicant.age,
      threshold: policy.maxAge,
      message: `Maximum age at maturity: ${policy.maxAge}`,
    });

    // Income check (HARD)
    const totalIncome = financial.monthlyIncome + (financial.additionalIncome || 0);
    checks.push({
      policy: 'HARD_MIN_INCOME',
      passed: totalIncome >= policy.minIncome,
      value: totalIncome,
      threshold: policy.minIncome,
      message: `Minimum income requirement: ₹${policy.minIncome}`,
    });

    // Amount check (HARD)
    checks.push({
      policy: 'HARD_MAX_AMOUNT',
      passed: request.amount <= policy.maxLoanAmount,
      value: request.amount,
      threshold: policy.maxLoanAmount,
      message: `Maximum loan amount: ₹${policy.maxLoanAmount}`,
    });

    // Bureau score check (SOFT - can be overridden)
    const bureauScore = application.bureauScore || 0;
    checks.push({
      policy: 'SOFT_BUREAU_SCORE',
      passed: bureauScore >= policy.minBureauScore,
      value: bureauScore,
      threshold: policy.minBureauScore,
      message: `Minimum bureau score: ${policy.minBureauScore}`,
    });

    // FOIR check (Fixed Obligations to Income Ratio)
    const existingEmi = financial.existingEmi || 0;
    const proposedEmi = this.calculateEmi(request.amount, policy.baseRate + 1, request.tenure);
    const totalObligations = existingEmi + proposedEmi;
    const foir = totalObligations / totalIncome;

    checks.push({
      policy: 'SOFT_FOIR',
      passed: foir <= policy.maxFoir,
      value: Math.round(foir * 100) / 100,
      threshold: policy.maxFoir,
      message: `FOIR limit: ${policy.maxFoir * 100}%`,
    });

    // Tenure check
    if (request.tenure > 0) {
      checks.push({
        policy: 'HARD_TENURE_MIN',
        passed: request.tenure >= policy.minTenure,
        value: request.tenure,
        threshold: policy.minTenure,
        message: `Minimum tenure: ${policy.minTenure} months`,
      });

      checks.push({
        policy: 'HARD_TENURE_MAX',
        passed: request.tenure <= policy.maxTenure,
        value: request.tenure,
        threshold: policy.maxTenure,
        message: `Maximum tenure: ${policy.maxTenure} months`,
      });
    }

    // Employment check
    checks.push({
      policy: 'SOFT_EMPLOYMENT',
      passed: ['SALARIED', 'SELF_EMPLOYED', 'BUSINESS'].includes(applicant.employmentType),
      value: applicant.employmentType,
      message: 'Stable employment required',
    });

    // Years employed (SOFT)
    if (applicant.yearsEmployed !== undefined) {
      checks.push({
        policy: 'SOFT_YEARS_EMPLOYED',
        passed: applicant.yearsEmployed >= 1,
        value: applicant.yearsEmployed,
        threshold: 1,
        message: 'Minimum 1 year employment required',
      });
    }

    return checks;
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(
    application: CreditApplication,
    policyChecks: PolicyCheck[]
  ): { riskScore: number; riskGrade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; defaultProbability: number } {
    let score = 100;

    // Bureau score impact (40%)
    const bureauScore = application.bureauScore || 650;
    if (bureauScore >= 800) score -= 0;
    else if (bureauScore >= 750) score -= 5;
    else if (bureauScore >= 700) score -= 10;
    else if (bureauScore >= 650) score -= 20;
    else if (bureauScore >= 600) score -= 30;
    else score -= 40;

    // FOIR impact (20%)
    const foirCheck = policyChecks.find((p) => p.policy === 'SOFT_FOIR');
    if (foirCheck) {
      const foir = foirCheck.value as number;
      if (foir > 0.6) score -= 20;
      else if (foir > 0.5) score -= 10;
      else if (foir > 0.4) score -= 5;
    }

    // Employment stability (15%)
    const { applicant } = application;
    if (applicant.employmentType === 'SALARIED') score -= 0;
    else if (applicant.employmentType === 'BUSINESS') score -= 5;
    else if (applicant.employmentType === 'SELF_EMPLOYED') score -= 8;
    else score -= 15;

    if ((applicant.yearsEmployed || 0) < 2) score -= 5;

    // Internal scores (15%)
    if (application.internalRiskScore) {
      score -= (1 - application.internalRiskScore) * 15;
    }
    if (application.trustScore) {
      score += (application.trustScore - 0.5) * 10;
    }

    // Policy failures (10%)
    const softFailures = policyChecks.filter((p) => !p.passed && p.policy.startsWith('SOFT_')).length;
    score -= softFailures * 5;

    // Normalize score
    const riskScore = Math.max(0, Math.min(100, score));

    // Determine grade
    let riskGrade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
    if (riskScore >= 85) riskGrade = 'A';
    else if (riskScore >= 70) riskGrade = 'B';
    else if (riskScore >= 55) riskGrade = 'C';
    else if (riskScore >= 40) riskGrade = 'D';
    else if (riskScore >= 25) riskGrade = 'E';
    else riskGrade = 'F';

    // Default probability (simplified logistic)
    const defaultProbability = 1 / (1 + Math.exp((riskScore - 50) / 15));

    return { riskScore, riskGrade, defaultProbability };
  }

  /**
   * Find similar cases from EON memory
   */
  private async findSimilarCases(application: CreditApplication): Promise<SimilarCase[]> {
    try {
      const query = `${application.productType} application: age ${application.applicant.age}, income ${application.financial.monthlyIncome}, amount ${application.request.amount}, bureau ${application.bureauScore || 'unknown'}`;

      const memories = await this.eon.recall({
        query,
        limit: 5,
        filters: {
          module: 'LOAN',
        },
      });

      return memories.map((m) => ({
        customerId: m.metadata?.customerId as string || 'unknown',
        similarity: m.relevanceScore || 0.5,
        outcome: m.metadata?.outcome as SimilarCase['outcome'] || 'PERFORMING',
        amount: m.metadata?.amount as number || 0,
        tenure: m.metadata?.tenure as number || 0,
        interestRate: m.metadata?.rate as number,
        currentStatus: m.metadata?.status as string,
      }));
    } catch (error) {
      logger.warn('Failed to fetch similar cases', { error });
      return [];
    }
  }

  /**
   * Get AI decision
   */
  private async getAIDecision(
    application: CreditApplication,
    policyChecks: PolicyCheck[],
    similarCases: SimilarCase[]
  ): Promise<{ decision: string; reasoning: string; confidence: number }> {
    return this.circuitBreaker.execute(async () => {
      const prompt = this.buildAIPrompt(application, policyChecks, similarCases);

      const response = await this.aiProxy.complete({
        model: 'claude-3-sonnet',
        prompt,
        systemPrompt: `You are a credit analyst AI for a bank. Analyze the loan application and provide a decision.
Your response must be JSON with: {"decision": "APPROVE|REJECT|REVIEW", "reasoning": "...", "confidence": 0.0-1.0}
Be conservative - recommend REVIEW if uncertain. Consider:
- Policy check results
- Similar historical cases and their outcomes
- Risk factors
- Ability to repay`,
        maxTokens: 500,
      });

      try {
        const result = JSON.parse(response.content);
        return {
          decision: result.decision,
          reasoning: result.reasoning,
          confidence: result.confidence,
        };
      } catch {
        return {
          decision: 'REVIEW',
          reasoning: 'AI response parsing failed',
          confidence: 0,
        };
      }
    });
  }

  /**
   * Build AI prompt
   */
  private buildAIPrompt(
    application: CreditApplication,
    policyChecks: PolicyCheck[],
    similarCases: SimilarCase[]
  ): string {
    const { applicant, financial, request } = application;

    return `
LOAN APPLICATION ANALYSIS

Applicant Profile:
- Age: ${applicant.age}, ${applicant.gender || 'Unknown gender'}
- Occupation: ${applicant.occupation} (${applicant.employmentType})
- Employer: ${applicant.employer || 'N/A'}
- Years Employed: ${applicant.yearsEmployed || 'N/A'}
- Residence: ${applicant.residenceType}

Financial Profile:
- Monthly Income: ₹${financial.monthlyIncome.toLocaleString()}
- Additional Income: ₹${(financial.additionalIncome || 0).toLocaleString()}
- Existing EMIs: ₹${(financial.existingEmi || 0).toLocaleString()}
- Bureau Score: ${application.bureauScore || 'Not available'}

Loan Request:
- Product: ${application.productType}
- Amount: ₹${request.amount.toLocaleString()}
- Tenure: ${request.tenure} months
- Purpose: ${request.purpose || 'Not specified'}

Policy Check Results:
${policyChecks.map((p) => `- ${p.policy}: ${p.passed ? 'PASS' : 'FAIL'} (${p.value} vs ${p.threshold || 'N/A'})`).join('\n')}

Similar Historical Cases:
${similarCases.length > 0 ? similarCases.map((c) => `- Similarity: ${(c.similarity * 100).toFixed(0)}%, Outcome: ${c.outcome}, Amount: ₹${c.amount.toLocaleString()}`).join('\n') : 'No similar cases found'}

Provide your decision as JSON.`;
  }

  /**
   * Make final decision
   */
  private makeFinalDecision(
    application: CreditApplication,
    policy: CreditPolicy,
    policyChecks: PolicyCheck[],
    riskAssessment: { riskScore: number; riskGrade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; defaultProbability: number },
    aiDecision: { decision: string; reasoning: string; confidence: number } | null,
    similarCases: SimilarCase[]
  ): CreditDecision {
    const { request, financial } = application;

    // Check for hard policy failures
    const hardFailures = policyChecks.filter((p) => !p.passed && p.policy.startsWith('HARD_'));

    if (hardFailures.length > 0) {
      return {
        applicationId: application.applicationId,
        decision: 'REJECTED',
        riskGrade: riskAssessment.riskGrade,
        riskScore: riskAssessment.riskScore,
        defaultProbability: riskAssessment.defaultProbability,
        policyChecks,
        rejectionReasons: hardFailures.map((f) => f.message || f.policy),
        aiConfidence: 0,
        aiReasoning: 'Rejected due to policy violations',
        decidedAt: new Date(),
        decidedBy: 'RULES',
        processingTime: 0,
      };
    }

    // Calculate approved amount and rate
    const interestRate = policy.baseRate + (policy.riskPremium[riskAssessment.riskGrade] || 0);
    const maxEmi = (financial.monthlyIncome * policy.maxFoir) - (financial.existingEmi || 0);
    const maxAmountByFoir = this.calculateMaxLoanAmount(maxEmi, interestRate, request.tenure);
    const approvedAmount = Math.min(request.amount, maxAmountByFoir, policy.maxLoanAmount);
    const emiAmount = this.calculateEmi(approvedAmount, interestRate, request.tenure);

    // Determine decision
    let decision: CreditDecision['decision'];
    let conditions: string[] = [];
    let requiresApproval: string | undefined;

    if (riskAssessment.riskGrade === 'A' || riskAssessment.riskGrade === 'B') {
      if (aiDecision?.decision === 'APPROVE' && aiDecision.confidence > 0.7) {
        decision = 'APPROVED';
      } else if (aiDecision?.decision === 'REVIEW') {
        decision = 'MANUAL_REVIEW';
        requiresApproval = 'MANAGER';
      } else {
        decision = 'APPROVED';
      }
    } else if (riskAssessment.riskGrade === 'C' || riskAssessment.riskGrade === 'D') {
      if (aiDecision?.decision === 'APPROVE' && aiDecision.confidence > 0.8) {
        decision = 'CONDITIONAL_APPROVAL';
        conditions = ['Additional income proof required', 'Guarantor required for higher amounts'];
      } else {
        decision = 'MANUAL_REVIEW';
        requiresApproval = 'BRANCH_MANAGER';
      }
    } else {
      decision = 'REJECTED';
    }

    // Reduce amount if conditional
    const finalAmount = decision === 'CONDITIONAL_APPROVAL' ? Math.min(approvedAmount, request.amount * 0.8) : approvedAmount;

    return {
      applicationId: application.applicationId,
      decision,
      approvedAmount: decision !== 'REJECTED' ? finalAmount : undefined,
      approvedTenure: decision !== 'REJECTED' ? request.tenure : undefined,
      interestRate: decision !== 'REJECTED' ? interestRate : undefined,
      processingFee: decision !== 'REJECTED' ? finalAmount * 0.01 : undefined, // 1%
      emiAmount: decision !== 'REJECTED' ? this.calculateEmi(finalAmount, interestRate, request.tenure) : undefined,
      conditions: conditions.length > 0 ? conditions : undefined,
      rejectionReasons: decision === 'REJECTED' ? ['Risk grade too low', aiDecision?.reasoning || ''] : undefined,
      riskGrade: riskAssessment.riskGrade,
      riskScore: riskAssessment.riskScore,
      defaultProbability: riskAssessment.defaultProbability,
      policyChecks,
      aiConfidence: aiDecision?.confidence || 0,
      aiReasoning: aiDecision?.reasoning || 'AI analysis not available',
      similarCases: similarCases.length > 0 ? similarCases : undefined,
      decidedAt: new Date(),
      decidedBy: aiDecision ? 'AI' : 'RULES',
      requiresApproval,
      processingTime: 0,
    };
  }

  /**
   * Store decision episode in EON
   */
  private async storeDecisionEpisode(application: CreditApplication, decision: CreditDecision): Promise<void> {
    try {
      await this.eon.remember({
        content: `Credit decision for ${application.productType}: ${decision.decision} - ${decision.aiReasoning}`,
        metadata: {
          module: 'LOAN',
          customerId: application.customerId,
          applicationId: application.applicationId,
          productType: application.productType,
          amount: application.request.amount,
          tenure: application.request.tenure,
          decision: decision.decision,
          outcome: decision.decision === 'APPROVED' ? 'APPROVED' : decision.decision === 'REJECTED' ? 'REJECTED' : 'PENDING',
          riskGrade: decision.riskGrade,
          rate: decision.interestRate,
          bureauScore: application.bureauScore,
          income: application.financial.monthlyIncome,
        },
      });
    } catch (error) {
      logger.warn('Failed to store decision episode', { error });
    }
  }

  /**
   * Calculate EMI
   */
  private calculateEmi(principal: number, annualRate: number, tenureMonths: number): number {
    const monthlyRate = annualRate / 12 / 100;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    return Math.round(emi);
  }

  /**
   * Calculate max loan amount from EMI
   */
  private calculateMaxLoanAmount(maxEmi: number, annualRate: number, tenureMonths: number): number {
    const monthlyRate = annualRate / 12 / 100;
    const principal = (maxEmi * (Math.pow(1 + monthlyRate, tenureMonths) - 1)) /
      (monthlyRate * Math.pow(1 + monthlyRate, tenureMonths));
    return Math.round(principal);
  }
}

// Export singleton
export const creditEngine = new CreditEngine();
