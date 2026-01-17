/**
 * ABAC - Attribute-Based Access Control for Notifications
 */

import {
  NotificationCategory,
  NotificationChannel,
  NotificationPriority,
  NotificationPayload,
  NotificationRecipient,
} from './types';
import { Role } from './rbac';

/**
 * Subject Attributes - Who is performing the action
 */
export interface SubjectAttributes {
  userId: string;
  role: Role;
  department?: string;
  branchId?: string;
  regionId?: string;
  employeeId?: string;
  clearanceLevel?: number; // 1-5, higher = more access
  specialPermissions?: string[];
  isActive: boolean;
  lastLogin?: Date;
}

/**
 * Resource Attributes - The notification being accessed
 */
export interface ResourceAttributes {
  notificationId?: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  priority: NotificationPriority;
  recipientSegment?: string;
  containsSensitiveData?: boolean;
  targetBranchId?: string;
  targetRegionId?: string;
  templateId?: string;
  bulkSize?: number;
}

/**
 * Environment Attributes - Context of the request
 */
export interface EnvironmentAttributes {
  currentTime: Date;
  ipAddress?: string;
  deviceType?: 'mobile' | 'web' | 'api';
  isWithinBusinessHours: boolean;
  isMaintenance: boolean;
  geoLocation?: { lat: number; lng: number };
  riskScore?: number; // 0-1
}

/**
 * Action being performed
 */
export type ABACAction =
  | 'create'
  | 'send'
  | 'schedule'
  | 'cancel'
  | 'view'
  | 'approve'
  | 'reject'
  | 'bulk_send'
  | 'view_analytics'
  | 'export';

/**
 * Policy Decision
 */
export interface PolicyDecision {
  allowed: boolean;
  reason?: string;
  obligations?: PolicyObligation[];
  advisories?: string[];
}

/**
 * Obligations that must be fulfilled
 */
export interface PolicyObligation {
  type: 'log_audit' | 'require_mfa' | 'notify_supervisor' | 'rate_limit' | 'mask_data';
  params?: Record<string, unknown>;
}

/**
 * Policy Rule
 */
export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  priority: number; // Lower = higher priority
  effect: 'allow' | 'deny';
  condition: (
    subject: SubjectAttributes,
    resource: ResourceAttributes,
    environment: EnvironmentAttributes,
    action: ABACAction
  ) => boolean;
  obligations?: PolicyObligation[];
}

/**
 * Default Policy Rules
 */
export const defaultPolicies: PolicyRule[] = [
  // 1. Deny during maintenance (highest priority)
  {
    id: 'deny-maintenance',
    name: 'Deny During Maintenance',
    description: 'Block all notification operations during maintenance',
    priority: 1,
    effect: 'deny',
    condition: (_, __, env) => env.isMaintenance && !env.deviceType?.includes('api'),
  },

  // 2. Deny inactive users
  {
    id: 'deny-inactive',
    name: 'Deny Inactive Users',
    description: 'Block inactive user accounts',
    priority: 2,
    effect: 'deny',
    condition: (subject) => !subject.isActive,
  },

  // 3. Urgent notifications only during business hours (except system)
  {
    id: 'urgent-business-hours',
    name: 'Urgent Only in Business Hours',
    description: 'Non-system urgent notifications only during business hours',
    priority: 10,
    effect: 'deny',
    condition: (subject, resource, env) =>
      resource.priority === NotificationPriority.URGENT &&
      subject.role !== Role.SYSTEM &&
      !env.isWithinBusinessHours,
  },

  // 4. Branch restriction - can only send to own branch
  {
    id: 'branch-restriction',
    name: 'Branch Restriction',
    description: 'Staff can only send to their own branch',
    priority: 20,
    effect: 'deny',
    condition: (subject, resource) =>
      subject.role === Role.STAFF &&
      resource.targetBranchId !== undefined &&
      resource.targetBranchId !== subject.branchId,
  },

  // 5. Regional restriction - managers can only send to their region
  {
    id: 'region-restriction',
    name: 'Region Restriction',
    description: 'Branch managers can only send to their region',
    priority: 21,
    effect: 'deny',
    condition: (subject, resource) =>
      subject.role === Role.BRANCH_MANAGER &&
      resource.targetRegionId !== undefined &&
      resource.targetRegionId !== subject.regionId,
  },

  // 6. Bulk size limits
  {
    id: 'bulk-limit',
    name: 'Bulk Size Limit',
    description: 'Limit bulk notification size based on clearance',
    priority: 30,
    effect: 'deny',
    condition: (subject, resource, _, action) => {
      if (action !== 'bulk_send') return false;
      if (!resource.bulkSize) return false;

      const limits: Record<number, number> = {
        1: 10,
        2: 100,
        3: 1000,
        4: 10000,
        5: Infinity,
      };

      const maxAllowed = limits[subject.clearanceLevel ?? 1] ?? 10;
      return resource.bulkSize > maxAllowed;
    },
  },

  // 7. Sensitive data requires high clearance
  {
    id: 'sensitive-clearance',
    name: 'Sensitive Data Clearance',
    description: 'Sensitive notifications require clearance level 3+',
    priority: 40,
    effect: 'deny',
    condition: (subject, resource) =>
      resource.containsSensitiveData === true &&
      (subject.clearanceLevel ?? 1) < 3,
  },

  // 8. Compliance notifications require compliance role
  {
    id: 'compliance-role',
    name: 'Compliance Role Required',
    description: 'Only compliance roles can send compliance notifications',
    priority: 50,
    effect: 'deny',
    condition: (subject, resource, _, action) =>
      action === 'send' &&
      resource.category === NotificationCategory.COMPLIANCE &&
      ![Role.COMPLIANCE_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.SYSTEM].includes(subject.role),
  },

  // 9. Risk notifications require risk role
  {
    id: 'risk-role',
    name: 'Risk Role Required',
    description: 'Only risk roles can send risk notifications',
    priority: 51,
    effect: 'deny',
    condition: (subject, resource, _, action) =>
      action === 'send' &&
      resource.category === NotificationCategory.RISK &&
      ![Role.RISK_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.SYSTEM].includes(subject.role),
  },

  // 10. Rate limit based on risk score
  {
    id: 'risk-rate-limit',
    name: 'Risk-Based Rate Limit',
    description: 'High risk score triggers rate limiting',
    priority: 60,
    effect: 'allow',
    condition: (_, __, env) => (env.riskScore ?? 0) > 0.7,
    obligations: [
      { type: 'rate_limit', params: { maxPerMinute: 5 } },
      { type: 'log_audit', params: { level: 'warning' } },
    ],
  },

  // 11. Export requires supervisor notification
  {
    id: 'export-notify',
    name: 'Export Notification',
    description: 'Exporting notifications requires supervisor notification',
    priority: 70,
    effect: 'allow',
    condition: (subject, _, __, action) =>
      action === 'export' && subject.role !== Role.SUPER_ADMIN,
    obligations: [{ type: 'notify_supervisor' }],
  },

  // 12. Allow system role for all actions (lowest priority)
  {
    id: 'system-allow',
    name: 'System Allow All',
    description: 'System role can perform any action',
    priority: 1000,
    effect: 'allow',
    condition: (subject) => subject.role === Role.SYSTEM,
  },

  // 13. Allow super admin for all actions
  {
    id: 'super-admin-allow',
    name: 'Super Admin Allow All',
    description: 'Super admin can perform any action',
    priority: 1001,
    effect: 'allow',
    condition: (subject) => subject.role === Role.SUPER_ADMIN,
  },
];

/**
 * ABAC Policy Engine
 */
export class ABACEngine {
  private policies: PolicyRule[];

  constructor(customPolicies?: PolicyRule[]) {
    this.policies = [...defaultPolicies, ...(customPolicies ?? [])].sort(
      (a, b) => a.priority - b.priority
    );
  }

  /**
   * Evaluate access request
   */
  evaluate(
    subject: SubjectAttributes,
    resource: ResourceAttributes,
    environment: EnvironmentAttributes,
    action: ABACAction
  ): PolicyDecision {
    const obligations: PolicyObligation[] = [];
    const advisories: string[] = [];

    // Always add audit logging
    obligations.push({ type: 'log_audit' });

    // Evaluate policies in priority order
    for (const policy of this.policies) {
      const matches = policy.condition(subject, resource, environment, action);

      if (matches) {
        if (policy.effect === 'deny') {
          return {
            allowed: false,
            reason: `Denied by policy: ${policy.name}`,
            obligations,
            advisories,
          };
        }

        // Allow with obligations
        if (policy.effect === 'allow') {
          if (policy.obligations) {
            obligations.push(...policy.obligations);
          }

          // Continue checking other policies for additional obligations
          advisories.push(`Allowed by policy: ${policy.name}`);
        }
      }
    }

    // Default: allow if no deny policies matched
    return {
      allowed: true,
      reason: 'No denying policy matched',
      obligations,
      advisories,
    };
  }

  /**
   * Add custom policy
   */
  addPolicy(policy: PolicyRule): void {
    this.policies.push(policy);
    this.policies.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Remove policy by ID
   */
  removePolicy(policyId: string): boolean {
    const index = this.policies.findIndex((p) => p.id === policyId);
    if (index >= 0) {
      this.policies.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get all policies
   */
  getPolicies(): PolicyRule[] {
    return [...this.policies];
  }
}

/**
 * Helper to check business hours (9 AM - 6 PM IST)
 */
export function isWithinBusinessHours(date: Date = new Date()): boolean {
  const istOffset = 5.5 * 60; // IST is UTC+5:30
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  const istMinutes = utcMinutes + istOffset;
  const istHour = Math.floor((istMinutes % 1440) / 60);

  const dayOfWeek = new Date(
    date.getTime() + istOffset * 60 * 1000
  ).getUTCDay();

  // Monday-Saturday, 9 AM - 6 PM
  return dayOfWeek >= 1 && dayOfWeek <= 6 && istHour >= 9 && istHour < 18;
}

export const abacEngine = new ABACEngine();
