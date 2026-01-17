/**
 * ankrBFC Blockchain Module
 *
 * Uses existing @ankr/docchain packages for blockchain integration.
 * Provides BFC-specific wrappers for banking document anchoring.
 */

// Re-export from @ankr/docchain packages
// The actual implementations are in ankr-labs-nx/packages/ankr-docchain/

export {
  AuditChain,
  initializeAuditChain,
  getAuditChain,
  type AuditEntry,
  type AuditBlock,
  type AuditEntityType,
  type AuditAction,
  type BlockchainConfig,
} from './audit-chain.js';

// Document types extended for BFC
export const BFC_DOC_TYPES = {
  // Existing from docchain
  UNKNOWN: 0,
  POD: 1,
  LR: 2,
  INVOICE: 3,
  GATE_PASS: 4,
  EWAY_BILL: 5,
  CONTRACT: 6,
  BILL_OF_LADING: 7,
  RC_BOOK: 8,
  DRIVING_LICENSE: 9,
  AADHAAR: 10,
  PAN: 11,
  GST_CERTIFICATE: 12,

  // BFC-specific document types (starting at 100)
  LOAN_APPLICATION: 100,
  LOAN_SANCTION: 101,
  LOAN_AGREEMENT: 102,
  CREDIT_DECISION: 103,
  KYC_VERIFICATION: 104,
  CONSENT_RECORD: 105,
  ACCOUNT_STATEMENT: 106,
  TDS_CERTIFICATE: 107,
  FD_RECEIPT: 108,
  INSURANCE_POLICY: 109,
  CREDIT_REPORT: 110,
  SALARY_SLIP: 111,
  ITR_DOCUMENT: 112,
  PROPERTY_VALUATION: 113,
  DISBURSAL_MEMO: 114,
} as const;

export type BfcDocType = keyof typeof BFC_DOC_TYPES;

/**
 * BFC-specific document anchoring configuration
 */
export interface BfcAnchorConfig {
  // Which document types to auto-anchor
  autoAnchor: {
    loanApplication: boolean;
    creditDecision: boolean;
    kycVerification: boolean;
    consentRecord: boolean;
    accountStatement: boolean;
  };

  // Signature requirements
  signatureRequired: {
    loanAgreement: 'aadhaar' | 'otp' | 'none';
    creditDecision: 'none';
    consentRecord: 'otp' | 'none';
  };

  // Batching configuration
  batchEnabled: boolean;
  batchSize: number;
  batchIntervalMinutes: number;
}

export const DEFAULT_BFC_ANCHOR_CONFIG: BfcAnchorConfig = {
  autoAnchor: {
    loanApplication: true,
    creditDecision: true,
    kycVerification: true,
    consentRecord: true,  // DPDP requirement
    accountStatement: false,  // Too many
  },
  signatureRequired: {
    loanAgreement: 'aadhaar',
    creditDecision: 'none',
    consentRecord: 'otp',
  },
  batchEnabled: true,
  batchSize: 50,
  batchIntervalMinutes: 5,
};

/**
 * BFC Document anchor events
 */
export interface BfcAnchorEvent {
  documentId: string;
  documentType: BfcDocType;
  customerId: string;
  documentHash: string;
  event: 'creation' | 'approval' | 'signature' | 'verification';
  metadata?: Record<string, unknown>;
}

/**
 * Integration with @ankr/docchain
 *
 * Usage:
 * ```typescript
 * import { DocChainService } from '@ankr/docchain-core';
 * // or from wowtruck backend
 * import { docChainService } from '@apps/wowtruck/backend/services/docchain-blockchain.service';
 *
 * // Anchor a credit decision
 * const hash = docChainService.createHash(JSON.stringify(creditDecision));
 * const result = await docChainService.anchorDocument(hash, 'contract'); // Use 'contract' for credit docs
 * ```
 *
 * For auto-anchoring, use the AutoAnchorService from @ankr/docchain-auto-anchor
 */

/**
 * Map BFC document types to docchain document types
 */
export function mapBfcToDocchainType(bfcType: BfcDocType): string {
  const mapping: Record<BfcDocType, string> = {
    UNKNOWN: 'unknown',
    POD: 'pod',
    LR: 'lr',
    INVOICE: 'invoice',
    GATE_PASS: 'gate_pass',
    EWAY_BILL: 'eway_bill',
    CONTRACT: 'contract',
    BILL_OF_LADING: 'bill_of_lading',
    RC_BOOK: 'rc_book',
    DRIVING_LICENSE: 'driving_license',
    AADHAAR: 'aadhaar',
    PAN: 'pan',
    GST_CERTIFICATE: 'gst_certificate',
    // BFC-specific types map to 'contract' for now (can be extended in docchain)
    LOAN_APPLICATION: 'contract',
    LOAN_SANCTION: 'contract',
    LOAN_AGREEMENT: 'contract',
    CREDIT_DECISION: 'document',
    KYC_VERIFICATION: 'document',
    CONSENT_RECORD: 'document',
    ACCOUNT_STATEMENT: 'document',
    TDS_CERTIFICATE: 'document',
    FD_RECEIPT: 'document',
    INSURANCE_POLICY: 'insurance',
    CREDIT_REPORT: 'document',
    SALARY_SLIP: 'document',
    ITR_DOCUMENT: 'document',
    PROPERTY_VALUATION: 'document',
    DISBURSAL_MEMO: 'document',
  };

  return mapping[bfcType] || 'document';
}
