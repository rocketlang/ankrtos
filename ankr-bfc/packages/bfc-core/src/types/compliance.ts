/**
 * Compliance domain types for ankrBFC
 * Covers DPDP, GDPR, RBI, AML, and other regulatory requirements
 */

import { z } from 'zod';

// Consent types
export const ConsentType = {
  MARKETING_EMAIL: 'MARKETING_EMAIL',
  MARKETING_SMS: 'MARKETING_SMS',
  MARKETING_PUSH: 'MARKETING_PUSH',
  MARKETING_WHATSAPP: 'MARKETING_WHATSAPP',
  MARKETING_CALL: 'MARKETING_CALL',
  DATA_SHARING: 'DATA_SHARING',
  CREDIT_BUREAU: 'CREDIT_BUREAU',
  CROSS_SELL: 'CROSS_SELL',
  THIRD_PARTY: 'THIRD_PARTY',
  ANALYTICS: 'ANALYTICS',
  AA_CONSENT: 'AA_CONSENT',
} as const;
export type ConsentType = (typeof ConsentType)[keyof typeof ConsentType];

// Consent record
export interface CustomerConsent {
  id: string;
  customerId: string;
  consentType: ConsentType;
  purpose: string;
  status: boolean;
  givenAt?: Date;
  revokedAt?: Date;
  expiresAt?: Date;
  ipAddress?: string;
  channel?: string;
  documentId?: string;
  metadata?: Record<string, unknown>;
}

// Consent update request
export interface ConsentUpdateRequest {
  customerId: string;
  consentType: ConsentType;
  granted: boolean;
  purpose: string;
  ipAddress?: string;
  channel?: string;
  source?: string;
}

// DPDP Data Principal Rights
export const DataPrincipalRight = {
  ACCESS: 'ACCESS',           // Right to access personal data
  CORRECTION: 'CORRECTION',   // Right to correct inaccurate data
  ERASURE: 'ERASURE',         // Right to be forgotten
  GRIEVANCE: 'GRIEVANCE',     // Right to raise grievance
  NOMINATION: 'NOMINATION',   // Right to nominate
} as const;
export type DataPrincipalRight = (typeof DataPrincipalRight)[keyof typeof DataPrincipalRight];

// Data Subject Request (DPDP/GDPR)
export interface DataSubjectRequest {
  id: string;
  customerId: string;
  requestType: DataPrincipalRight;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

  // Request details
  requestedAt: Date;
  acknowledgedAt?: Date;
  completedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;

  // Response
  responseData?: Record<string, unknown>;
  responseDocumentUrl?: string;

  // Tracking
  assignedTo?: string;
  notes?: string;
}

// KYC verification types
export const KycDocumentType = {
  PAN: 'PAN',
  AADHAAR: 'AADHAAR',
  PASSPORT: 'PASSPORT',
  DRIVING_LICENSE: 'DRIVING_LICENSE',
  VOTER_ID: 'VOTER_ID',
  BANK_STATEMENT: 'BANK_STATEMENT',
  SALARY_SLIP: 'SALARY_SLIP',
  ITR: 'ITR',
  FORM_16: 'FORM_16',
} as const;
export type KycDocumentType = (typeof KycDocumentType)[keyof typeof KycDocumentType];

export const KycVerificationMethod = {
  DIGILOCKER: 'DIGILOCKER',
  OCR: 'OCR',
  MANUAL: 'MANUAL',
  API: 'API',
  CKYC: 'CKYC',
} as const;
export type KycVerificationMethod = (typeof KycVerificationMethod)[keyof typeof KycVerificationMethod];

// KYC verification result
export interface KycVerificationResult {
  documentType: KycDocumentType;
  verified: boolean;
  verificationMethod: KycVerificationMethod;
  verifiedAt?: Date;

  // Extracted data
  extractedData?: {
    name?: string;
    dob?: string;
    address?: string;
    documentNumber?: string;
    validUntil?: string;
  };

  // Matching
  nameMatchScore?: number;
  dobMatch?: boolean;
  photoMatchScore?: number;

  // Issues
  issues?: string[];
  rejectionReason?: string;
}

// AML types
export const AmlAlertType = {
  LARGE_TRANSACTION: 'LARGE_TRANSACTION',
  UNUSUAL_PATTERN: 'UNUSUAL_PATTERN',
  RAPID_MOVEMENT: 'RAPID_MOVEMENT',
  STRUCTURING: 'STRUCTURING',
  HIGH_RISK_COUNTRY: 'HIGH_RISK_COUNTRY',
  PEP_MATCH: 'PEP_MATCH',
  SANCTIONS_MATCH: 'SANCTIONS_MATCH',
  DORMANT_REACTIVATION: 'DORMANT_REACTIVATION',
} as const;
export type AmlAlertType = (typeof AmlAlertType)[keyof typeof AmlAlertType];

export interface AmlAlert {
  id: string;
  customerId: string;
  transactionId?: string;
  alertType: AmlAlertType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  // Details
  description: string;
  amount?: number;
  riskScore: number;
  matchedRules: string[];

  // Status
  status: 'OPEN' | 'INVESTIGATING' | 'ESCALATED' | 'CLOSED' | 'FALSE_POSITIVE';
  assignedTo?: string;
  resolution?: string;
  closedAt?: Date;

  // Audit
  createdAt: Date;
  updatedAt: Date;
}

// STR (Suspicious Transaction Report)
export interface SuspiciousTransactionReport {
  id: string;
  alertId: string;
  customerId: string;

  // Report details
  transactionDate: Date;
  amount: number;
  transactionType: string;

  // Customer details
  customerName: string;
  customerPan?: string;

  // Suspicion details
  suspicionReason: string;
  detailedNarrative: string;

  // Status
  status: 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED';
  submittedAt?: Date;
  fiuReference?: string;

  createdAt: Date;
}

// Regulatory reporting
export interface RegulatoryReport {
  id: string;
  reportType: 'CTR' | 'STR' | 'NTR' | 'CCRT'; // Cash, Suspicious, Non-profit, Counterfeit Currency
  periodStart: Date;
  periodEnd: Date;
  status: 'PENDING' | 'GENERATED' | 'SUBMITTED' | 'ACKNOWLEDGED';
  generatedAt?: Date;
  submittedAt?: Date;
  fiuReference?: string;
  recordCount: number;
  totalAmount?: number;
}

// Tax deduction (TDS)
export interface TdsCalculation {
  transactionType: string;
  section: string; // 194A, 194J, etc.
  grossAmount: number;
  tdsRate: number;
  tdsAmount: number;
  netAmount: number;
  panVerified: boolean;
  higherRateApplicable: boolean;
}

// GST for banking services
export interface GstCalculation {
  serviceType: string;
  baseAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  totalAmount: number;
  isInterstate: boolean;
  stateCode: string;
}

// Zod schemas
export const ConsentUpdateSchema = z.object({
  customerId: z.string().uuid(),
  consentType: z.nativeEnum(ConsentType),
  granted: z.boolean(),
  purpose: z.string().min(1).max(500),
  ipAddress: z.string().ip().optional(),
  channel: z.string().optional(),
  source: z.string().optional(),
});

export const DataSubjectRequestSchema = z.object({
  customerId: z.string().uuid(),
  requestType: z.nativeEnum(DataPrincipalRight),
  description: z.string().min(10).max(1000),
});

export const AmlAlertSchema = z.object({
  customerId: z.string().uuid(),
  transactionId: z.string().optional(),
  alertType: z.nativeEnum(AmlAlertType),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  description: z.string().min(1),
  amount: z.number().optional(),
  riskScore: z.number().min(0).max(1),
  matchedRules: z.array(z.string()),
});

export type ConsentUpdateInput = z.infer<typeof ConsentUpdateSchema>;
export type DataSubjectRequestInput = z.infer<typeof DataSubjectRequestSchema>;
export type AmlAlertInput = z.infer<typeof AmlAlertSchema>;
