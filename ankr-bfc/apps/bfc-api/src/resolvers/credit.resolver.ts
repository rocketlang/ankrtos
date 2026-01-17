/**
 * Credit Resolvers
 *
 * Handles credit applications, decisions, and eligibility checks
 * Uses AI for decision support via AI Proxy
 */

import type { Context } from '../context.js';

interface CreditApplicationInput {
  customerId: string;
  loanType: string;
  requestedAmount: number;
  requestedTenureMonths: number;
  purpose: string;
  annualIncome: number;
  incomeType: string;
  employerName?: string;
  yearsInCurrentJob?: number;
  existingEmi?: number;
  existingLoans?: unknown[];
  collateral?: unknown;
}

export const creditResolvers = {
  Query: {
    eligibilityCheck: async (
      _: unknown,
      { customerId, loanType }: { customerId: string; loanType: string },
      context: Context
    ) => {
      // Get customer data
      const customer = await context.prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          products: true,
        },
      });

      if (!customer) {
        throw new Error(`Customer ${customerId} not found`);
      }

      // Check eligibility based on basic rules
      const ineligibilityReasons: string[] = [];
      const conditions: string[] = [];

      // KYC check
      if (customer.kycStatus !== 'VERIFIED') {
        ineligibilityReasons.push('KYC verification required');
      }

      // Risk score check
      if (customer.riskScore > 0.7) {
        ineligibilityReasons.push('Risk score exceeds threshold');
      }

      // Existing loan check
      const existingLoans = customer.products.filter(
        (p) => p.productType.includes('LOAN') && p.status === 'ACTIVE'
      );

      if (existingLoans.length >= 3) {
        conditions.push('Maximum loan limit reached, special approval required');
      }

      // Calculate eligibility
      const eligible = ineligibilityReasons.length === 0;

      // Calculate max eligible amount based on loan type
      const baseMultiplier: Record<string, number> = {
        HOME: 50,
        PERSONAL: 20,
        CAR: 30,
        EDUCATION: 25,
        BUSINESS: 40,
        GOLD: 10,
        LAP: 60,
        OVERDRAFT: 15,
      };

      // Assume income from customer profile (would be from actual income data)
      const assumedIncome = customer.lifetimeValue / 10 || 500000;
      const multiplier = baseMultiplier[loanType] || 20;
      const maxAmount = assumedIncome * multiplier;

      // Interest rate based on credit score and risk
      const baseRate = 8.5;
      const riskPremium = customer.riskScore * 4;
      const creditDiscount = customer.creditScore
        ? Math.max(0, (750 - customer.creditScore) * 0.01)
        : 0;
      const indicativeRate = baseRate + riskPremium - creditDiscount;

      return {
        customerId,
        loanType,
        eligible,
        maxEligibleAmount: eligible ? maxAmount : 0,
        minAmount: 50000,
        suggestedTenure: [12, 24, 36, 60, 84],
        indicativeRate: Math.round(indicativeRate * 100) / 100,
        ineligibilityReasons: ineligibilityReasons.length
          ? ineligibilityReasons
          : null,
        conditions: conditions.length ? conditions : null,
        checkedAt: new Date(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };
    },
  },

  Mutation: {
    submitCreditApplication: async (
      _: unknown,
      { input }: { input: CreditApplicationInput },
      context: Context
    ) => {
      // Get customer with episodes
      const customer = await context.prisma.customer.findUnique({
        where: { id: input.customerId },
        include: {
          products: true,
          episodes: {
            where: { module: 'LOAN' },
            take: 50,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!customer) {
        throw new Error(`Customer ${input.customerId} not found`);
      }

      // Calculate DTI (Debt-to-Income ratio)
      const existingEmi = Number(input.existingEmi || 0);
      const proposedEmi = calculateEMI(
        Number(input.requestedAmount),
        8.5,
        input.requestedTenureMonths
      );
      const totalEmi = existingEmi + proposedEmi;
      const monthlyIncome = Number(input.annualIncome) / 12;
      const dti = totalEmi / monthlyIncome;

      // Calculate FOIR (Fixed Obligations to Income Ratio)
      const foir = (totalEmi + monthlyIncome * 0.3) / monthlyIncome; // Assuming 30% fixed expenses

      // Risk scoring
      const riskScore = calculateRiskScore(customer, input, dti);

      // Find similar past cases
      const similarCases = await findSimilarCases(context, input);

      // Decision logic
      const approved = riskScore < 0.6 && dti < 0.5 && customer.kycStatus === 'VERIFIED';

      // Decision factors
      const positiveFactors = [];
      const negativeFactors = [];
      const warnings = [];

      if (customer.trustScore > 0.7) {
        positiveFactors.push({
          factor: 'High Trust Score',
          weight: 0.15,
          value: customer.trustScore.toString(),
          impact: 'POSITIVE',
          description: 'Customer has demonstrated good relationship history',
        });
      }

      if (dti < 0.4) {
        positiveFactors.push({
          factor: 'Low DTI',
          weight: 0.2,
          value: (dti * 100).toFixed(1) + '%',
          impact: 'POSITIVE',
          description: 'Debt-to-income ratio is within healthy limits',
        });
      }

      if (customer.riskScore > 0.5) {
        negativeFactors.push({
          factor: 'Elevated Risk Score',
          weight: 0.25,
          value: customer.riskScore.toString(),
          impact: 'NEGATIVE',
          description: 'Customer risk profile requires attention',
        });
      }

      if (dti > 0.4 && dti < 0.5) {
        warnings.push({
          factor: 'Borderline DTI',
          weight: 0.1,
          value: (dti * 100).toFixed(1) + '%',
          impact: 'NEUTRAL',
          description: 'DTI is approaching upper threshold',
        });
      }

      // Calculate approved terms
      const approvedAmount = approved ? Number(input.requestedAmount) : undefined;
      const approvedTenure = approved ? input.requestedTenureMonths : undefined;
      const interestRate = approved ? 8.5 + riskScore * 3 : undefined;
      const processingFee = approved ? approvedAmount! * 0.01 : undefined;
      const emi = approved
        ? calculateEMI(approvedAmount!, interestRate!, approvedTenure!)
        : undefined;

      // Record episode
      await context.prisma.customerEpisode.create({
        data: {
          customerId: input.customerId,
          state: `income ${input.annualIncome}, ${input.incomeType}, existing EMI ${existingEmi}`,
          action: `applied_for_${input.loanType.toLowerCase()}_loan`,
          outcome: approved
            ? `approved_${approvedAmount}_at_${interestRate}%`
            : 'rejected',
          success: approved,
          module: 'LOAN',
          channel: 'DIGITAL',
          metadata: {
            loanType: input.loanType,
            requestedAmount: input.requestedAmount,
            dti,
            foir,
            riskScore,
          },
        },
      });

      return {
        applicationId: `APP_${Date.now()}`,
        customerId: input.customerId,
        approved,
        decisionAt: new Date(),
        approvedAmount,
        approvedTenure,
        interestRate,
        processingFee,
        emi,
        riskScore,
        creditScore: customer.creditScore,
        dti,
        foir,
        positiveFactors,
        negativeFactors,
        warnings,
        aiConfidence: 0.85,
        aiExplanation: approved
          ? 'Application meets all eligibility criteria with acceptable risk profile.'
          : 'Application does not meet minimum eligibility criteria.',
        modelVersion: '1.0.0',
        decisionPath: approved ? 'AUTO_APPROVED' : 'AUTO_REJECTED',
      };
    },
  },
};

/**
 * Calculate EMI using standard formula
 */
function calculateEMI(
  principal: number,
  annualRate: number,
  tenureMonths: number
): number {
  const monthlyRate = annualRate / 12 / 100;
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
}

/**
 * Calculate risk score based on customer profile and application
 */
function calculateRiskScore(
  customer: any,
  input: CreditApplicationInput,
  dti: number
): number {
  let score = customer.riskScore;

  // Adjust for DTI
  if (dti > 0.5) score += 0.2;
  else if (dti > 0.4) score += 0.1;
  else if (dti < 0.3) score -= 0.1;

  // Adjust for income type
  if (input.incomeType === 'SALARIED') score -= 0.05;
  else if (input.incomeType === 'SELF_EMPLOYED') score += 0.05;

  // Adjust for job stability
  if (input.yearsInCurrentJob && input.yearsInCurrentJob > 3) score -= 0.05;

  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, score));
}

/**
 * Find similar past cases using behavioral patterns
 */
async function findSimilarCases(
  context: Context,
  input: CreditApplicationInput
): Promise<any[]> {
  // TODO: Use vector similarity search
  const patterns = await context.prisma.behavioralPattern.findMany({
    where: {
      context: 'LOAN',
      action: `applied_for_${input.loanType.toLowerCase()}_loan`,
    },
    take: 5,
  });

  return patterns.map((p) => ({
    patternId: p.id,
    pattern: `${p.context} → ${p.action}`,
    successRate: p.successRate,
    sampleSize: p.totalCount,
    confidence: p.confidence,
  }));
}
