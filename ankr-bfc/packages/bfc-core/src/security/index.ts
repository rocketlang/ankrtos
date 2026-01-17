/**
 * BFC Security - Enterprise Integration
 *
 * Integrates with ANKR ecosystem packages:
 * - @ankr/iam - Identity & Access Management
 * - @ankr/security - Cybersecurity, zero-trust
 * - @ankr/oauth - OAuth 2.0 providers
 *
 * BFC-specific extensions for banking compliance
 */

// Re-export from existing auth.ts for types
export * from './auth.js';

// ============================================================================
// BFC ROLE EXTENSIONS (extends @ankr/iam roles)
// ============================================================================

export const BFC_ROLES = {
  // Banking-specific roles (extend @ankr/iam)
  CREDIT_OFFICER: 'BFC_CREDIT_OFFICER',
  CREDIT_MANAGER: 'BFC_CREDIT_MANAGER',
  CREDIT_HEAD: 'BFC_CREDIT_HEAD',
  COLLECTIONS_OFFICER: 'BFC_COLLECTIONS_OFFICER',
  COMPLIANCE_OFFICER: 'BFC_COMPLIANCE_OFFICER',
  KYC_OFFICER: 'BFC_KYC_OFFICER',
  TREASURY_OFFICER: 'BFC_TREASURY_OFFICER',
  CHANNEL_MANAGER: 'BFC_CHANNEL_MANAGER',
} as const;

export type BfcRole = (typeof BFC_ROLES)[keyof typeof BFC_ROLES];

// ============================================================================
// BFC PERMISSIONS (extends @ankr/iam permissions)
// ============================================================================

export const BFC_PERMISSIONS = {
  // Credit decisioning
  CREDIT_VIEW: 'bfc:credit:view',
  CREDIT_APPROVE_SMALL: 'bfc:credit:approve:small',    // Up to 10L
  CREDIT_APPROVE_MEDIUM: 'bfc:credit:approve:medium',  // Up to 50L
  CREDIT_APPROVE_LARGE: 'bfc:credit:approve:large',    // Up to 2Cr
  CREDIT_APPROVE_UNLIMITED: 'bfc:credit:approve:unlimited',
  CREDIT_OVERRIDE: 'bfc:credit:override',

  // KYC
  KYC_INITIATE: 'bfc:kyc:initiate',
  KYC_VERIFY: 'bfc:kyc:verify',
  KYC_APPROVE: 'bfc:kyc:approve',
  KYC_REJECT: 'bfc:kyc:reject',

  // Compliance
  CONSENT_VIEW: 'bfc:consent:view',
  CONSENT_MANAGE: 'bfc:consent:manage',
  AML_VIEW: 'bfc:aml:view',
  AML_RESOLVE: 'bfc:aml:resolve',
  STR_FILE: 'bfc:str:file',

  // Customer data
  CUSTOMER_PII_VIEW: 'bfc:customer:pii:view',
  CUSTOMER_PII_EXPORT: 'bfc:customer:pii:export',
  CUSTOMER_DELETE: 'bfc:customer:delete',

  // Campaigns
  CAMPAIGN_CREATE: 'bfc:campaign:create',
  CAMPAIGN_APPROVE: 'bfc:campaign:approve',
  CAMPAIGN_LAUNCH: 'bfc:campaign:launch',

  // Reports
  REPORT_GENERATE: 'bfc:report:generate',
  REPORT_RBI: 'bfc:report:rbi',
} as const;

export type BfcPermission = (typeof BFC_PERMISSIONS)[keyof typeof BFC_PERMISSIONS];

// ============================================================================
// BFC ROLE-PERMISSION MAPPING
// ============================================================================

export const BFC_ROLE_PERMISSIONS: Record<BfcRole, BfcPermission[]> = {
  BFC_CREDIT_OFFICER: [
    BFC_PERMISSIONS.CREDIT_VIEW,
    BFC_PERMISSIONS.CREDIT_APPROVE_SMALL,
    BFC_PERMISSIONS.KYC_VIEW,
    BFC_PERMISSIONS.CUSTOMER_PII_VIEW,
  ],

  BFC_CREDIT_MANAGER: [
    BFC_PERMISSIONS.CREDIT_VIEW,
    BFC_PERMISSIONS.CREDIT_APPROVE_SMALL,
    BFC_PERMISSIONS.CREDIT_APPROVE_MEDIUM,
    BFC_PERMISSIONS.KYC_VIEW,
    BFC_PERMISSIONS.KYC_APPROVE,
    BFC_PERMISSIONS.CUSTOMER_PII_VIEW,
  ],

  BFC_CREDIT_HEAD: [
    BFC_PERMISSIONS.CREDIT_VIEW,
    BFC_PERMISSIONS.CREDIT_APPROVE_SMALL,
    BFC_PERMISSIONS.CREDIT_APPROVE_MEDIUM,
    BFC_PERMISSIONS.CREDIT_APPROVE_LARGE,
    BFC_PERMISSIONS.CREDIT_OVERRIDE,
    BFC_PERMISSIONS.KYC_VIEW,
    BFC_PERMISSIONS.KYC_APPROVE,
    BFC_PERMISSIONS.CUSTOMER_PII_VIEW,
    BFC_PERMISSIONS.REPORT_GENERATE,
  ],

  BFC_COLLECTIONS_OFFICER: [
    BFC_PERMISSIONS.CREDIT_VIEW,
    BFC_PERMISSIONS.CUSTOMER_PII_VIEW,
  ],

  BFC_COMPLIANCE_OFFICER: [
    BFC_PERMISSIONS.CONSENT_VIEW,
    BFC_PERMISSIONS.CONSENT_MANAGE,
    BFC_PERMISSIONS.AML_VIEW,
    BFC_PERMISSIONS.AML_RESOLVE,
    BFC_PERMISSIONS.STR_FILE,
    BFC_PERMISSIONS.CUSTOMER_PII_VIEW,
    BFC_PERMISSIONS.REPORT_GENERATE,
    BFC_PERMISSIONS.REPORT_RBI,
  ],

  BFC_KYC_OFFICER: [
    BFC_PERMISSIONS.KYC_INITIATE,
    BFC_PERMISSIONS.KYC_VERIFY,
    BFC_PERMISSIONS.CUSTOMER_PII_VIEW,
  ],

  BFC_TREASURY_OFFICER: [
    BFC_PERMISSIONS.CREDIT_VIEW,
    BFC_PERMISSIONS.REPORT_GENERATE,
  ],

  BFC_CHANNEL_MANAGER: [
    BFC_PERMISSIONS.CAMPAIGN_CREATE,
    BFC_PERMISSIONS.CAMPAIGN_APPROVE,
    BFC_PERMISSIONS.CAMPAIGN_LAUNCH,
    BFC_PERMISSIONS.CUSTOMER_PII_VIEW,
    BFC_PERMISSIONS.REPORT_GENERATE,
  ],
};

// ============================================================================
// CREDIT APPROVAL LIMITS
// ============================================================================

export interface CreditApprovalLimit {
  maxAmount: number;
  maxTenureMonths: number;
  requiresCoApproval: boolean;
  escalateTo?: BfcRole;
}

export const CREDIT_APPROVAL_LIMITS: Record<string, CreditApprovalLimit> = {
  [BFC_PERMISSIONS.CREDIT_APPROVE_SMALL]: {
    maxAmount: 1000000,      // 10L
    maxTenureMonths: 60,
    requiresCoApproval: false,
  },
  [BFC_PERMISSIONS.CREDIT_APPROVE_MEDIUM]: {
    maxAmount: 5000000,      // 50L
    maxTenureMonths: 180,
    requiresCoApproval: true,
    escalateTo: BFC_ROLES.CREDIT_HEAD,
  },
  [BFC_PERMISSIONS.CREDIT_APPROVE_LARGE]: {
    maxAmount: 20000000,     // 2Cr
    maxTenureMonths: 360,
    requiresCoApproval: true,
    escalateTo: BFC_ROLES.CREDIT_HEAD,
  },
  [BFC_PERMISSIONS.CREDIT_APPROVE_UNLIMITED]: {
    maxAmount: Infinity,
    maxTenureMonths: 360,
    requiresCoApproval: true,
  },
};

// ============================================================================
// INTEGRATION HELPER
// ============================================================================

/**
 * Create BFC IAM config to extend @ankr/iam
 *
 * Usage:
 * ```typescript
 * import { IAMService } from '@ankr/iam';
 * import { createBfcIamConfig } from '@ankr-bfc/core/security';
 *
 * const iam = new IAMService({
 *   ...createBfcIamConfig(),
 *   // Additional config...
 * });
 * ```
 */
export function createBfcIamConfig() {
  return {
    roles: {
      ...BFC_ROLES,
    },
    permissions: {
      ...BFC_PERMISSIONS,
    },
    rolePermissions: BFC_ROLE_PERMISSIONS,
    creditLimits: CREDIT_APPROVAL_LIMITS,
  };
}
