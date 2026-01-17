/**
 * Credit decision domain types for ankrBFC
 */

import { z } from 'zod';

// Credit application status
export const CreditApplicationStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  PROCESSING: 'PROCESSING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  DISBURSED: 'DISBURSED',
  CANCELLED: 'CANCELLED',
} as const;
export type CreditApplicationStatus = (typeof CreditApplicationStatus)[keyof typeof CreditApplicationStatus];

// Loan types
export const LoanType = {
  HOME: 'HOME',
  PERSONAL: 'PERSONAL',
  CAR: 'CAR',
  EDUCATION: 'EDUCATION',
  BUSINESS: 'BUSINESS',
  GOLD: 'GOLD',
  LAP: 'LAP', // Loan Against Property
  OVERDRAFT: 'OVERDRAFT',
} as const;
export type LoanType = (typeof LoanType)[keyof typeof LoanType];

// Credit application
export interface CreditApplication {
  id: string;
  customerId: string;
  loanType: LoanType;

  // Request details
  requestedAmount: number;
  requestedTenureMonths: number;
  purpose: string;

  // Income details
  annualIncome: number;
  incomeType: 'SALARIED' | 'SELF_EMPLOYED' | 'BUSINESS';
  employerName?: string;
  yearsInCurrentJob?: number;

  // Existing obligations
  existingEmi: number;
  existingLoans: ExistingLoan[];

  // Collateral (for secured loans)
  collateral?: CollateralDetails;

  // Status
  status: CreditApplicationStatus;
  submittedAt?: Date;

  // Documents
  documentsSubmitted: string[];

  createdAt: Date;
  updatedAt: Date;
}

export interface ExistingLoan {
  lender: string;
  loanType: string;
  outstandingAmount: number;
  emi: number;
  tenureRemaining: number;
}

export interface CollateralDetails {
  type: 'PROPERTY' | 'VEHICLE' | 'GOLD' | 'FD' | 'OTHER';
  description: string;
  estimatedValue: number;
  ownershipStatus: 'OWNED' | 'COOWNED' | 'FAMILY';
}

// Credit decision from AI/rules engine
export interface CreditDecision {
  applicationId: string;
  customerId: string;

  // Decision
  approved: boolean;
  decisionAt: Date;

  // Approved terms (if approved)
  approvedAmount?: number;
  approvedTenure?: number;
  interestRate?: number;
  processingFee?: number;
  emi?: number;

  // Scoring
  riskScore: number;
  creditScore?: number;
  dti: number; // Debt-to-income ratio
  foir: number; // Fixed obligations to income ratio

  // Decision factors
  positiveFactors: DecisionFactor[];
  negativeFactors: DecisionFactor[];
  warnings: DecisionFactor[];

  // AI insights
  similarCases: SimilarCase[];
  patternMatch?: PatternMatch;
  aiConfidence: number;
  aiExplanation: string;

  // Model info
  modelVersion: string;
  decisionPath: string; // AUTO_APPROVED, MANUAL_REVIEW, AUTO_REJECTED

  // For audit
  decisionBy: 'SYSTEM' | 'MANUAL';
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface DecisionFactor {
  factor: string;
  weight: number;
  value: string;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  description: string;
}

export interface SimilarCase {
  episodeId: string;
  similarity: number;
  outcome: 'APPROVED' | 'REJECTED' | 'DEFAULT' | 'REPAID';
  loanType: LoanType;
  amount: number;
  context: string;
}

export interface PatternMatch {
  patternId: string;
  pattern: string;
  successRate: number;
  sampleSize: number;
  confidence: number;
}

// Credit eligibility check (quick pre-check)
export interface EligibilityCheck {
  customerId: string;
  loanType: LoanType;

  eligible: boolean;
  maxEligibleAmount: number;
  minAmount: number;
  suggestedTenure: number[];
  indicativeRate: number;

  ineligibilityReasons?: string[];
  conditions?: string[];

  checkedAt: Date;
  validUntil: Date;
}

// Zod schemas
export const CreditApplicationCreateSchema = z.object({
  customerId: z.string().uuid(),
  loanType: z.nativeEnum(LoanType),
  requestedAmount: z.number().positive(),
  requestedTenureMonths: z.number().int().min(6).max(360),
  purpose: z.string().min(10).max(500),
  annualIncome: z.number().positive(),
  incomeType: z.enum(['SALARIED', 'SELF_EMPLOYED', 'BUSINESS']),
  employerName: z.string().optional(),
  yearsInCurrentJob: z.number().min(0).optional(),
  existingEmi: z.number().min(0).default(0),
  existingLoans: z.array(z.object({
    lender: z.string(),
    loanType: z.string(),
    outstandingAmount: z.number(),
    emi: z.number(),
    tenureRemaining: z.number(),
  })).default([]),
  collateral: z.object({
    type: z.enum(['PROPERTY', 'VEHICLE', 'GOLD', 'FD', 'OTHER']),
    description: z.string(),
    estimatedValue: z.number().positive(),
    ownershipStatus: z.enum(['OWNED', 'COOWNED', 'FAMILY']),
  }).optional(),
});

export type CreditApplicationCreateInput = z.infer<typeof CreditApplicationCreateSchema>;

// Credit decision request
export interface CreditDecisionRequest {
  applicationId: string;
  customerId: string;
  application: CreditApplication;
  customerContext: string; // Summary of customer for AI
  similarCasesLimit?: number;
}

// Credit decision response
export interface CreditDecisionResponse {
  decision: CreditDecision;
  explanation: string;
  nextSteps: string[];
  requiredDocuments: string[];
}
