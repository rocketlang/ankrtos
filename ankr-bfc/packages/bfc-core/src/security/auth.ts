/**
 * Enterprise Authentication & Authorization
 *
 * Features:
 * - JWT with refresh tokens
 * - Role-based access control (RBAC)
 * - API key authentication
 * - MFA support
 * - Session management
 */

import { z } from 'zod';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',     // Full system access
  ADMIN: 'ADMIN',                  // Bank admin
  BRANCH_MANAGER: 'BRANCH_MANAGER',
  RELATIONSHIP_MANAGER: 'RELATIONSHIP_MANAGER',
  STAFF: 'STAFF',                  // Bank staff
  AUDITOR: 'AUDITOR',              // Read-only compliance access
  API_SERVICE: 'API_SERVICE',      // Service-to-service
  CUSTOMER: 'CUSTOMER',            // End customer
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const Permission = {
  // Customer permissions
  CUSTOMER_READ: 'customer:read',
  CUSTOMER_WRITE: 'customer:write',
  CUSTOMER_DELETE: 'customer:delete',
  CUSTOMER_PII_READ: 'customer:pii:read',

  // Credit permissions
  CREDIT_READ: 'credit:read',
  CREDIT_APPROVE: 'credit:approve',
  CREDIT_REJECT: 'credit:reject',
  CREDIT_OVERRIDE: 'credit:override',

  // Offer permissions
  OFFER_READ: 'offer:read',
  OFFER_CREATE: 'offer:create',
  OFFER_APPROVE: 'offer:approve',

  // Campaign permissions
  CAMPAIGN_READ: 'campaign:read',
  CAMPAIGN_WRITE: 'campaign:write',
  CAMPAIGN_LAUNCH: 'campaign:launch',

  // Compliance permissions
  COMPLIANCE_READ: 'compliance:read',
  COMPLIANCE_WRITE: 'compliance:write',
  AUDIT_READ: 'audit:read',
  AUDIT_EXPORT: 'audit:export',

  // Admin permissions
  USER_MANAGE: 'user:manage',
  ROLE_MANAGE: 'role:manage',
  SYSTEM_CONFIG: 'system:config',
  BRANCH_MANAGE: 'branch:manage',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

// Role to permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: Object.values(Permission),

  ADMIN: [
    Permission.CUSTOMER_READ, Permission.CUSTOMER_WRITE, Permission.CUSTOMER_PII_READ,
    Permission.CREDIT_READ, Permission.CREDIT_APPROVE, Permission.CREDIT_REJECT,
    Permission.OFFER_READ, Permission.OFFER_CREATE, Permission.OFFER_APPROVE,
    Permission.CAMPAIGN_READ, Permission.CAMPAIGN_WRITE, Permission.CAMPAIGN_LAUNCH,
    Permission.COMPLIANCE_READ, Permission.AUDIT_READ,
    Permission.USER_MANAGE, Permission.BRANCH_MANAGE,
  ],

  BRANCH_MANAGER: [
    Permission.CUSTOMER_READ, Permission.CUSTOMER_WRITE, Permission.CUSTOMER_PII_READ,
    Permission.CREDIT_READ, Permission.CREDIT_APPROVE,
    Permission.OFFER_READ, Permission.OFFER_CREATE,
    Permission.CAMPAIGN_READ,
    Permission.COMPLIANCE_READ,
  ],

  RELATIONSHIP_MANAGER: [
    Permission.CUSTOMER_READ, Permission.CUSTOMER_WRITE,
    Permission.CREDIT_READ,
    Permission.OFFER_READ, Permission.OFFER_CREATE,
    Permission.CAMPAIGN_READ,
  ],

  STAFF: [
    Permission.CUSTOMER_READ,
    Permission.CREDIT_READ,
    Permission.OFFER_READ,
  ],

  AUDITOR: [
    Permission.CUSTOMER_READ,
    Permission.CREDIT_READ,
    Permission.COMPLIANCE_READ,
    Permission.AUDIT_READ, Permission.AUDIT_EXPORT,
  ],

  API_SERVICE: [
    Permission.CUSTOMER_READ, Permission.CUSTOMER_WRITE,
    Permission.CREDIT_READ,
    Permission.OFFER_READ, Permission.OFFER_CREATE,
  ],

  CUSTOMER: [
    // Customers have limited, self-scoped access
  ],
};

// JWT payload
export interface JWTPayload {
  sub: string;           // User ID
  email: string;
  role: UserRole;
  permissions: Permission[];
  branchCode?: string;   // For branch-scoped access
  customerId?: string;   // For customer portal
  sessionId: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

// Refresh token payload
export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
  familyId: string;     // For refresh token rotation detection
  iat: number;
  exp: number;
}

// API Key
export interface ApiKey {
  id: string;
  key: string;          // Hashed
  name: string;
  role: UserRole;
  permissions: Permission[];
  rateLimit: number;    // Requests per minute
  allowedIps?: string[];
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdBy: string;
  isActive: boolean;
}

// Session
export interface Session {
  id: string;
  userId: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    deviceId?: string;
  };
  mfaVerified: boolean;
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
  isActive: boolean;
}

// MFA
export interface MFAConfig {
  userId: string;
  method: 'TOTP' | 'SMS' | 'EMAIL';
  secret?: string;      // For TOTP, encrypted
  phone?: string;       // For SMS
  email?: string;       // For EMAIL
  backupCodes: string[]; // Hashed
  isEnabled: boolean;
  verifiedAt?: Date;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  mfaCode: z.string().length(6).optional(),
  deviceId: z.string().optional(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const ApiKeyCreateSchema = z.object({
  name: z.string().min(3).max(100),
  role: z.nativeEnum(UserRole),
  permissions: z.array(z.nativeEnum(Permission)).optional(),
  rateLimit: z.number().min(1).max(10000).default(100),
  allowedIps: z.array(z.string().ip()).optional(),
  expiresAt: z.coerce.date().optional(),
});

// ============================================================================
// AUTH CONTEXT
// ============================================================================

export interface AuthContext {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    permissions: Permission[];
    branchCode?: string;
    customerId?: string;
  };
  session?: Session;
  apiKey?: ApiKey;
  isAuthenticated: boolean;
  isService: boolean;    // API key auth
}

// ============================================================================
// PERMISSION CHECKING
// ============================================================================

export function hasPermission(
  context: AuthContext,
  permission: Permission
): boolean {
  if (!context.isAuthenticated) return false;

  const permissions = context.user?.permissions || context.apiKey?.permissions || [];
  return permissions.includes(permission);
}

export function hasAllPermissions(
  context: AuthContext,
  permissions: Permission[]
): boolean {
  return permissions.every(p => hasPermission(context, p));
}

export function hasAnyPermission(
  context: AuthContext,
  permissions: Permission[]
): boolean {
  return permissions.some(p => hasPermission(context, p));
}

export function requirePermission(
  context: AuthContext,
  permission: Permission,
  errorMessage?: string
): void {
  if (!hasPermission(context, permission)) {
    throw new AuthorizationError(
      errorMessage || `Missing permission: ${permission}`
    );
  }
}

// ============================================================================
// SCOPE CHECKING (Branch/Customer level)
// ============================================================================

export function canAccessBranch(
  context: AuthContext,
  branchCode: string
): boolean {
  if (!context.isAuthenticated) return false;

  // Super admin and admin can access all branches
  if (['SUPER_ADMIN', 'ADMIN'].includes(context.user?.role || '')) {
    return true;
  }

  // Branch-scoped users can only access their branch
  return context.user?.branchCode === branchCode;
}

export function canAccessCustomer(
  context: AuthContext,
  customerId: string,
  customerBranchCode?: string
): boolean {
  if (!context.isAuthenticated) return false;

  // Customer can only access their own data
  if (context.user?.role === 'CUSTOMER') {
    return context.user.customerId === customerId;
  }

  // Staff access based on branch
  if (customerBranchCode) {
    return canAccessBranch(context, customerBranchCode);
  }

  // Default to permission check
  return hasPermission(context, Permission.CUSTOMER_READ);
}

// ============================================================================
// ERRORS
// ============================================================================

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class SessionExpiredError extends Error {
  constructor(message: string = 'Session expired') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

export class MFARequiredError extends Error {
  constructor(message: string = 'MFA verification required') {
    super(message);
    this.name = 'MFARequiredError';
  }
}
