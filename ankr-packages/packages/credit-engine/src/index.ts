/**
 * @ankr/credit-engine
 * AI-Powered Credit Decision Engine
 * Policy-based scoring, risk assessment, EMI calculations
 */

// Types
export type ProductType =
  | 'HOME_LOAN'
  | 'PERSONAL_LOAN'
  | 'CAR_LOAN'
  | 'BUSINESS_LOAN'
  | 'CREDIT_CARD'
  | 'OVERDRAFT';

export type EmploymentType =
  | 'SALARIED'
  | 'SELF_EMPLOYED'
  | 'BUSINESS'
  | 'RETIRED'
  | 'OTHER';

export type ResidenceType =
  | 'OWNED'
  | 'RENTED'
  | 'FAMILY'
  | 'COMPANY_PROVIDED';

export type RiskGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type DecisionType =
  | 'APPROVED'
  | 'REJECTED'
  | 'MANUAL_REVIEW'
  | 'CONDITIONAL_APPROVAL';

export type DecidedBy = 'AI' | 'RULES' | 'MANUAL';

export interface CreditApplication {
  applicationId: string;
  customerId: string;
  productType: ProductType;

  applicant: {
    name: string;
    age: number;
    gender?: string;
    occupation: string;
    employmentType: EmploymentType;
    employer?: string;
    designation?: string;
    yearsEmployed?: number;
    residenceType: ResidenceType;
    yearsAtResidence?: number;
    maritalStatus?: string;
    dependents?: number;
  };

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

  request: {
    amount: number;
    tenure: number;
    purpose?: string;
  };

  bureauScore?: number;
  internalRiskScore?: number;
  trustScore?: number;
  documentsProvided?: string[];
  channel: string;
  branchCode?: string;
  submittedAt: Date;
}

export interface CreditDecision {
  applicationId: string;
  decision: DecisionType;
  approvedAmount?: number;
  approvedTenure?: number;
  interestRate?: number;
  processingFee?: number;
  emiAmount?: number;
  conditions?: string[];
  rejectionReasons?: string[];
  riskGrade: RiskGrade;
  riskScore: number;
  defaultProbability: number;
  policyChecks: PolicyCheck[];
  aiConfidence: number;
  aiReasoning: string;
  similarCases?: SimilarCase[];
  processingTime: number;
  decidedAt: Date;
  decidedBy: DecidedBy;
  requiresApproval?: string;
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
  maxLtv?: number;
  maxFoir: number;
  minBureauScore: number;
  minTenure: number;
  maxTenure: number;
  baseRate: number;
  riskPremium: Record<string, number>;
  requiredDocuments: string[];
}

export interface RiskAssessment {
  riskScore: number;
  riskGrade: RiskGrade;
  defaultProbability: number;
}

// AI Provider Interface
export interface AIProvider {
  getDecision(
    application: CreditApplication,
    policyChecks: PolicyCheck[],
    similarCases: SimilarCase[]
  ): Promise<{ decision: string; reasoning: string; confidence: number }>;
}

// Similar Case Provider Interface
export interface SimilarCaseProvider {
  findSimilarCases(application: CreditApplication): Promise<SimilarCase[]>;
}

// Default Credit Policies
export const DEFAULT_CREDIT_POLICIES: Record<ProductType, CreditPolicy> = {
  HOME_LOAN: {
    productType: 'HOME_LOAN',
    minAge: 21,
    maxAge: 65,
    minIncome: 25000,
    maxLoanAmount: 50000000,
    maxLtv: 0.8,
    maxFoir: 0.6,
    minBureauScore: 650,
    minTenure: 12,
    maxTenure: 360,
    baseRate: 8.5,
    riskPremium: { A: 0, B: 0.25, C: 0.5, D: 1, E: 1.5, F: 2 },
    requiredDocuments: ['PAN', 'AADHAAR', 'SALARY_SLIP', 'BANK_STATEMENT', 'PROPERTY_DOCS'],
  },
  PERSONAL_LOAN: {
    productType: 'PERSONAL_LOAN',
    minAge: 21,
    maxAge: 60,
    minIncome: 20000,
    maxLoanAmount: 2500000,
    maxFoir: 0.5,
    minBureauScore: 700,
    minTenure: 6,
    maxTenure: 60,
    baseRate: 12,
    riskPremium: { A: 0, B: 0.5, C: 1, D: 2, E: 3, F: 4 },
    requiredDocuments: ['PAN', 'AADHAAR', 'SALARY_SLIP', 'BANK_STATEMENT'],
  },
  CAR_LOAN: {
    productType: 'CAR_LOAN',
    minAge: 21,
    maxAge: 65,
    minIncome: 25000,
    maxLoanAmount: 10000000,
    maxLtv: 0.85,
    maxFoir: 0.55,
    minBureauScore: 675,
    minTenure: 12,
    maxTenure: 84,
    baseRate: 9,
    riskPremium: { A: 0, B: 0.5, C: 1, D: 1.5, E: 2, F: 2.5 },
    requiredDocuments: ['PAN', 'AADHAAR', 'SALARY_SLIP', 'BANK_STATEMENT'],
  },
  BUSINESS_LOAN: {
    productType: 'BUSINESS_LOAN',
    minAge: 25,
    maxAge: 65,
    minIncome: 50000,
    maxLoanAmount: 50000000,
    maxFoir: 0.65,
    minBureauScore: 680,
    minTenure: 12,
    maxTenure: 120,
    baseRate: 14,
    riskPremium: { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5 },
    requiredDocuments: ['PAN', 'GSTIN', 'ITR', 'BANK_STATEMENT', 'BUSINESS_PROOF'],
  },
  CREDIT_CARD: {
    productType: 'CREDIT_CARD',
    minAge: 21,
    maxAge: 60,
    minIncome: 15000,
    maxLoanAmount: 500000,
    maxFoir: 0.4,
    minBureauScore: 700,
    minTenure: 0,
    maxTenure: 0,
    baseRate: 42,
    riskPremium: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 },
    requiredDocuments: ['PAN', 'SALARY_SLIP'],
  },
  OVERDRAFT: {
    productType: 'OVERDRAFT',
    minAge: 21,
    maxAge: 65,
    minIncome: 30000,
    maxLoanAmount: 2000000,
    maxFoir: 0.5,
    minBureauScore: 720,
    minTenure: 0,
    maxTenure: 12,
    baseRate: 15,
    riskPremium: { A: 0, B: 0.5, C: 1, D: 1.5, E: 2, F: 3 },
    requiredDocuments: ['PAN', 'BANK_STATEMENT'],
  },
};

// Main Credit Engine
export class CreditEngine {
  private policies: Record<string, CreditPolicy>;
  private aiProvider?: AIProvider;
  private similarCaseProvider?: SimilarCaseProvider;

  constructor(options?: {
    policies?: Record<string, CreditPolicy>;
    aiProvider?: AIProvider;
    similarCaseProvider?: SimilarCaseProvider;
  }) {
    this.policies = options?.policies || DEFAULT_CREDIT_POLICIES;
    this.aiProvider = options?.aiProvider;
    this.similarCaseProvider = options?.similarCaseProvider;
  }

  /**
   * Process credit application
   */
  async processApplication(application: CreditApplication): Promise<CreditDecision> {
    const startTime = Date.now();

    try {
      // 1. Get policy for product type
      const policy = this.policies[application.productType];
      if (!policy) {
        throw new Error(`No policy found for product type: ${application.productType}`);
      }

      // 2. Run policy checks
      const policyChecks = this.runPolicyChecks(application, policy);

      // 3. Calculate risk score
      const riskAssessment = this.calculateRiskScore(application, policyChecks);

      // 4. Find similar cases
      const similarCases = this.similarCaseProvider
        ? await this.similarCaseProvider.findSimilarCases(application)
        : [];

      // 5. Get AI decision if policy checks pass and AI provider exists
      let aiDecision: { decision: string; reasoning: string; confidence: number } | null = null;

      const hasHardFailures = policyChecks.some(p => !p.passed && p.policy.startsWith('HARD_'));
      if (!hasHardFailures && this.aiProvider) {
        try {
          aiDecision = await this.aiProvider.getDecision(application, policyChecks, similarCases);
        } catch {
          aiDecision = null;
        }
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

      return decision;
    } catch (error) {
      return {
        applicationId: application.applicationId,
        decision: 'MANUAL_REVIEW',
        riskGrade: 'D',
        riskScore: 50,
        defaultProbability: 0.1,
        policyChecks: [],
        aiConfidence: 0,
        aiReasoning: `System error - ${error instanceof Error ? error.message : 'unknown'}`,
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
  runPolicyChecks(application: CreditApplication, policy: CreditPolicy): PolicyCheck[] {
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
      message: `Minimum income requirement: ${policy.minIncome}`,
    });

    // Amount check (HARD)
    checks.push({
      policy: 'HARD_MAX_AMOUNT',
      passed: request.amount <= policy.maxLoanAmount,
      value: request.amount,
      threshold: policy.maxLoanAmount,
      message: `Maximum loan amount: ${policy.maxLoanAmount}`,
    });

    // Bureau score check (SOFT)
    const bureauScore = application.bureauScore || 0;
    checks.push({
      policy: 'SOFT_BUREAU_SCORE',
      passed: bureauScore >= policy.minBureauScore,
      value: bureauScore,
      threshold: policy.minBureauScore,
      message: `Minimum bureau score: ${policy.minBureauScore}`,
    });

    // FOIR check
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

    // Years employed
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
  calculateRiskScore(application: CreditApplication, policyChecks: PolicyCheck[]): RiskAssessment {
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
    const foirCheck = policyChecks.find(p => p.policy === 'SOFT_FOIR');
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
    const softFailures = policyChecks.filter(p => !p.passed && p.policy.startsWith('SOFT_')).length;
    score -= softFailures * 5;

    // Normalize
    const riskScore = Math.max(0, Math.min(100, score));

    // Determine grade
    let riskGrade: RiskGrade;
    if (riskScore >= 85) riskGrade = 'A';
    else if (riskScore >= 70) riskGrade = 'B';
    else if (riskScore >= 55) riskGrade = 'C';
    else if (riskScore >= 40) riskGrade = 'D';
    else if (riskScore >= 25) riskGrade = 'E';
    else riskGrade = 'F';

    // Default probability
    const defaultProbability = 1 / (1 + Math.exp((riskScore - 50) / 15));

    return { riskScore, riskGrade, defaultProbability };
  }

  /**
   * Make final decision
   */
  private makeFinalDecision(
    application: CreditApplication,
    policy: CreditPolicy,
    policyChecks: PolicyCheck[],
    riskAssessment: RiskAssessment,
    aiDecision: { decision: string; reasoning: string; confidence: number } | null,
    similarCases: SimilarCase[]
  ): CreditDecision {
    const { request, financial } = application;

    // Check for hard policy failures
    const hardFailures = policyChecks.filter(p => !p.passed && p.policy.startsWith('HARD_'));

    if (hardFailures.length > 0) {
      return {
        applicationId: application.applicationId,
        decision: 'REJECTED',
        riskGrade: riskAssessment.riskGrade,
        riskScore: riskAssessment.riskScore,
        defaultProbability: riskAssessment.defaultProbability,
        policyChecks,
        rejectionReasons: hardFailures.map(f => f.message || f.policy),
        aiConfidence: 0,
        aiReasoning: 'Rejected due to policy violations',
        decidedAt: new Date(),
        decidedBy: 'RULES',
        processingTime: 0,
      };
    }

    // Calculate approved amount and rate
    const interestRate = policy.baseRate + (policy.riskPremium[riskAssessment.riskGrade] || 0);
    const totalIncome = financial.monthlyIncome + (financial.additionalIncome || 0);
    const maxEmi = (totalIncome * policy.maxFoir) - (financial.existingEmi || 0);
    const maxAmountByFoir = this.calculateMaxLoanAmount(maxEmi, interestRate, request.tenure);
    const approvedAmount = Math.min(request.amount, maxAmountByFoir, policy.maxLoanAmount);

    // Determine decision
    let decision: DecisionType;
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
    const finalAmount = decision === 'CONDITIONAL_APPROVAL'
      ? Math.min(approvedAmount, request.amount * 0.8)
      : approvedAmount;

    return {
      applicationId: application.applicationId,
      decision,
      approvedAmount: decision !== 'REJECTED' ? finalAmount : undefined,
      approvedTenure: decision !== 'REJECTED' ? request.tenure : undefined,
      interestRate: decision !== 'REJECTED' ? interestRate : undefined,
      processingFee: decision !== 'REJECTED' ? finalAmount * 0.01 : undefined,
      emiAmount: decision !== 'REJECTED' ? this.calculateEmi(finalAmount, interestRate, request.tenure) : undefined,
      conditions: conditions.length > 0 ? conditions : undefined,
      rejectionReasons: decision === 'REJECTED'
        ? ['Risk grade too low', aiDecision?.reasoning || '']
        : undefined,
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
   * Calculate EMI
   */
  calculateEmi(principal: number, annualRate: number, tenureMonths: number): number {
    if (tenureMonths === 0) return 0;
    const monthlyRate = annualRate / 12 / 100;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    return Math.round(emi);
  }

  /**
   * Calculate max loan amount from EMI
   */
  calculateMaxLoanAmount(maxEmi: number, annualRate: number, tenureMonths: number): number {
    if (tenureMonths === 0 || maxEmi <= 0) return 0;
    const monthlyRate = annualRate / 12 / 100;
    const principal = (maxEmi * (Math.pow(1 + monthlyRate, tenureMonths) - 1)) /
      (monthlyRate * Math.pow(1 + monthlyRate, tenureMonths));
    return Math.round(principal);
  }

  /**
   * Get policy for product type
   */
  getPolicy(productType: ProductType): CreditPolicy | undefined {
    return this.policies[productType];
  }

  /**
   * Get all policies
   */
  getAllPolicies(): Record<string, CreditPolicy> {
    return { ...this.policies };
  }

  /**
   * Update policy
   */
  updatePolicy(productType: string, policy: CreditPolicy): void {
    this.policies[productType] = policy;
  }
}

// Utility Functions
export function calculateFOIR(
  monthlyIncome: number,
  existingEmi: number,
  proposedEmi: number
): number {
  return (existingEmi + proposedEmi) / monthlyIncome;
}

export function calculateLTV(loanAmount: number, propertyValue: number): number {
  return loanAmount / propertyValue;
}

export function calculateDBR(
  monthlyIncome: number,
  totalDebt: number
): number {
  return totalDebt / (monthlyIncome * 12);
}

export function gradeToScore(grade: RiskGrade): number {
  const mapping: Record<RiskGrade, number> = {
    A: 90, B: 75, C: 60, D: 45, E: 30, F: 15,
  };
  return mapping[grade];
}

export function scoreToGrade(score: number): RiskGrade {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  if (score >= 25) return 'E';
  return 'F';
}

// Factory function
export function createCreditEngine(options?: {
  policies?: Record<string, CreditPolicy>;
  aiProvider?: AIProvider;
  similarCaseProvider?: SimilarCaseProvider;
}): CreditEngine {
  return new CreditEngine(options);
}
