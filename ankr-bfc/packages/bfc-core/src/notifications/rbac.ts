/**
 * RBAC - Role-Based Access Control for Notifications
 */

import { NotificationCategory, NotificationChannel, NotificationPriority } from './types';

export enum Role {
  // Customer roles
  CUSTOMER = 'customer',
  PREMIUM_CUSTOMER = 'premium_customer',

  // Staff roles
  STAFF = 'staff',
  FIELD_AGENT = 'field_agent',
  KYC_OFFICER = 'kyc_officer',
  RELATIONSHIP_MANAGER = 'relationship_manager',

  // Manager roles
  BRANCH_MANAGER = 'branch_manager',
  REGIONAL_MANAGER = 'regional_manager',
  COMPLIANCE_MANAGER = 'compliance_manager',
  RISK_MANAGER = 'risk_manager',

  // Admin roles
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  SYSTEM = 'system',
}

export interface Permission {
  action: 'send' | 'receive' | 'approve' | 'schedule' | 'bulk_send' | 'view_audit';
  category?: NotificationCategory;
  channel?: NotificationChannel;
  priority?: NotificationPriority;
}

export interface RolePermissions {
  role: Role;
  permissions: Permission[];
  canDelegateToRoles?: Role[];
  maxBulkRecipients?: number;
  requiresApprovalFor?: NotificationCategory[];
}

/**
 * Role-Permission Matrix
 */
export const rolePermissions: RolePermissions[] = [
  // Customer
  {
    role: Role.CUSTOMER,
    permissions: [
      { action: 'receive', category: NotificationCategory.OFFER },
      { action: 'receive', category: NotificationCategory.ACCOUNT },
      { action: 'receive', category: NotificationCategory.TRANSACTION },
      { action: 'receive', category: NotificationCategory.KYC },
      { action: 'receive', category: NotificationCategory.LOAN },
      { action: 'receive', category: NotificationCategory.PAYMENT_REMINDER },
    ],
  },

  // Premium Customer - additional channels
  {
    role: Role.PREMIUM_CUSTOMER,
    permissions: [
      { action: 'receive', category: NotificationCategory.OFFER },
      { action: 'receive', category: NotificationCategory.ACCOUNT },
      { action: 'receive', category: NotificationCategory.TRANSACTION },
      { action: 'receive', category: NotificationCategory.KYC },
      { action: 'receive', category: NotificationCategory.LOAN },
      { action: 'receive', category: NotificationCategory.PAYMENT_REMINDER },
      { action: 'receive', channel: NotificationChannel.WHATSAPP },
    ],
  },

  // Staff
  {
    role: Role.STAFF,
    permissions: [
      { action: 'receive', category: NotificationCategory.TASK },
      { action: 'receive', category: NotificationCategory.ALERT },
      { action: 'receive', category: NotificationCategory.SYSTEM },
      { action: 'send', category: NotificationCategory.TASK, priority: NotificationPriority.NORMAL },
    ],
    maxBulkRecipients: 10,
  },

  // Field Agent
  {
    role: Role.FIELD_AGENT,
    permissions: [
      { action: 'receive', category: NotificationCategory.TASK },
      { action: 'receive', category: NotificationCategory.ALERT },
      { action: 'send', category: NotificationCategory.KYC },
      { action: 'send', category: NotificationCategory.TASK },
    ],
    maxBulkRecipients: 5,
  },

  // KYC Officer
  {
    role: Role.KYC_OFFICER,
    permissions: [
      { action: 'receive', category: NotificationCategory.TASK },
      { action: 'receive', category: NotificationCategory.APPROVAL },
      { action: 'receive', category: NotificationCategory.COMPLIANCE },
      { action: 'send', category: NotificationCategory.KYC },
      { action: 'send', category: NotificationCategory.APPROVAL },
      { action: 'approve', category: NotificationCategory.KYC },
    ],
    maxBulkRecipients: 50,
  },

  // Relationship Manager
  {
    role: Role.RELATIONSHIP_MANAGER,
    permissions: [
      { action: 'receive', category: NotificationCategory.TASK },
      { action: 'receive', category: NotificationCategory.APPROVAL },
      { action: 'send', category: NotificationCategory.OFFER },
      { action: 'send', category: NotificationCategory.ACCOUNT },
      { action: 'send', category: NotificationCategory.LOAN },
      { action: 'schedule' },
    ],
    maxBulkRecipients: 100,
    requiresApprovalFor: [NotificationCategory.OFFER],
  },

  // Branch Manager
  {
    role: Role.BRANCH_MANAGER,
    permissions: [
      { action: 'receive', category: NotificationCategory.TASK },
      { action: 'receive', category: NotificationCategory.APPROVAL },
      { action: 'receive', category: NotificationCategory.ALERT },
      { action: 'send', category: NotificationCategory.OFFER },
      { action: 'send', category: NotificationCategory.TASK },
      { action: 'send', category: NotificationCategory.ALERT, priority: NotificationPriority.HIGH },
      { action: 'approve', category: NotificationCategory.OFFER },
      { action: 'approve', category: NotificationCategory.KYC },
      { action: 'schedule' },
      { action: 'bulk_send' },
    ],
    canDelegateToRoles: [Role.STAFF, Role.FIELD_AGENT, Role.KYC_OFFICER],
    maxBulkRecipients: 500,
  },

  // Regional Manager
  {
    role: Role.REGIONAL_MANAGER,
    permissions: [
      { action: 'receive', category: NotificationCategory.APPROVAL },
      { action: 'receive', category: NotificationCategory.ALERT },
      { action: 'receive', category: NotificationCategory.RISK },
      { action: 'send', category: NotificationCategory.OFFER },
      { action: 'send', category: NotificationCategory.ALERT, priority: NotificationPriority.URGENT },
      { action: 'approve', category: NotificationCategory.OFFER },
      { action: 'approve', category: NotificationCategory.ALERT },
      { action: 'schedule' },
      { action: 'bulk_send' },
    ],
    canDelegateToRoles: [Role.BRANCH_MANAGER, Role.RELATIONSHIP_MANAGER],
    maxBulkRecipients: 5000,
  },

  // Compliance Manager
  {
    role: Role.COMPLIANCE_MANAGER,
    permissions: [
      { action: 'receive', category: NotificationCategory.COMPLIANCE },
      { action: 'receive', category: NotificationCategory.RISK },
      { action: 'receive', category: NotificationCategory.ALERT },
      { action: 'send', category: NotificationCategory.COMPLIANCE },
      { action: 'send', category: NotificationCategory.ALERT, priority: NotificationPriority.URGENT },
      { action: 'approve', category: NotificationCategory.COMPLIANCE },
      { action: 'view_audit' },
    ],
    maxBulkRecipients: 1000,
  },

  // Risk Manager
  {
    role: Role.RISK_MANAGER,
    permissions: [
      { action: 'receive', category: NotificationCategory.RISK },
      { action: 'receive', category: NotificationCategory.ALERT },
      { action: 'send', category: NotificationCategory.RISK },
      { action: 'send', category: NotificationCategory.ALERT, priority: NotificationPriority.URGENT },
      { action: 'approve', category: NotificationCategory.RISK },
      { action: 'view_audit' },
    ],
    maxBulkRecipients: 1000,
  },

  // Admin
  {
    role: Role.ADMIN,
    permissions: [
      { action: 'send' },
      { action: 'receive' },
      { action: 'approve' },
      { action: 'schedule' },
      { action: 'bulk_send' },
      { action: 'view_audit' },
    ],
    canDelegateToRoles: [
      Role.BRANCH_MANAGER,
      Role.REGIONAL_MANAGER,
      Role.COMPLIANCE_MANAGER,
      Role.RISK_MANAGER,
    ],
    maxBulkRecipients: 10000,
  },

  // Super Admin - full access
  {
    role: Role.SUPER_ADMIN,
    permissions: [
      { action: 'send' },
      { action: 'receive' },
      { action: 'approve' },
      { action: 'schedule' },
      { action: 'bulk_send' },
      { action: 'view_audit' },
    ],
    canDelegateToRoles: Object.values(Role),
    maxBulkRecipients: Infinity,
  },

  // System - automated notifications
  {
    role: Role.SYSTEM,
    permissions: [
      { action: 'send' },
      { action: 'bulk_send' },
      { action: 'schedule' },
    ],
    maxBulkRecipients: Infinity,
  },
];

/**
 * RBAC Service
 */
export class RBACService {
  private permissionsMap: Map<Role, RolePermissions>;

  constructor() {
    this.permissionsMap = new Map(
      rolePermissions.map((rp) => [rp.role, rp])
    );
  }

  /**
   * Check if role has permission
   */
  hasPermission(
    role: Role,
    action: Permission['action'],
    options?: {
      category?: NotificationCategory;
      channel?: NotificationChannel;
      priority?: NotificationPriority;
    }
  ): boolean {
    const roleConfig = this.permissionsMap.get(role);
    if (!roleConfig) return false;

    return roleConfig.permissions.some((p) => {
      // Match action
      if (p.action !== action) return false;

      // If permission has no restrictions, it's a wildcard
      if (!p.category && !p.channel && !p.priority) return true;

      // Check specific restrictions
      if (options?.category && p.category && p.category !== options.category) return false;
      if (options?.channel && p.channel && p.channel !== options.channel) return false;
      if (options?.priority && p.priority && p.priority !== options.priority) return false;

      return true;
    });
  }

  /**
   * Get max bulk recipients for role
   */
  getMaxBulkRecipients(role: Role): number {
    return this.permissionsMap.get(role)?.maxBulkRecipients ?? 0;
  }

  /**
   * Check if role can delegate to another role
   */
  canDelegateTo(fromRole: Role, toRole: Role): boolean {
    const roleConfig = this.permissionsMap.get(fromRole);
    return roleConfig?.canDelegateToRoles?.includes(toRole) ?? false;
  }

  /**
   * Check if notification requires approval
   */
  requiresApproval(role: Role, category: NotificationCategory): boolean {
    const roleConfig = this.permissionsMap.get(role);
    return roleConfig?.requiresApprovalFor?.includes(category) ?? false;
  }

  /**
   * Get all permissions for a role
   */
  getPermissions(role: Role): Permission[] {
    return this.permissionsMap.get(role)?.permissions ?? [];
  }

  /**
   * Get roles that can approve a category
   */
  getApproverRoles(category: NotificationCategory): Role[] {
    const approvers: Role[] = [];

    for (const [role, config] of this.permissionsMap) {
      const canApprove = config.permissions.some(
        (p) =>
          p.action === 'approve' &&
          (!p.category || p.category === category)
      );
      if (canApprove) approvers.push(role);
    }

    return approvers;
  }
}

export const rbacService = new RBACService();
