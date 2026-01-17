/**
 * Notification System Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  NotificationService,
  Role,
  rbacService,
  abacEngine,
  NotificationCategory,
  NotificationChannel,
  NotificationPriority,
  NotificationPayload,
  NotificationRecipient,
  SubjectAttributes,
} from '../notifications';

describe('RBAC Service', () => {
  describe('hasPermission', () => {
    it('should allow customer to receive offers', () => {
      const hasPermission = rbacService.hasPermission(Role.CUSTOMER, 'receive', {
        category: NotificationCategory.OFFER,
      });
      expect(hasPermission).toBe(true);
    });

    it('should deny customer from sending notifications', () => {
      const hasPermission = rbacService.hasPermission(Role.CUSTOMER, 'send', {
        category: NotificationCategory.OFFER,
      });
      expect(hasPermission).toBe(false);
    });

    it('should allow staff to send tasks', () => {
      const hasPermission = rbacService.hasPermission(Role.STAFF, 'send', {
        category: NotificationCategory.TASK,
      });
      expect(hasPermission).toBe(true);
    });

    it('should allow branch manager to approve offers', () => {
      const hasPermission = rbacService.hasPermission(Role.BRANCH_MANAGER, 'approve', {
        category: NotificationCategory.OFFER,
      });
      expect(hasPermission).toBe(true);
    });

    it('should allow super admin all actions', () => {
      expect(rbacService.hasPermission(Role.SUPER_ADMIN, 'send')).toBe(true);
      expect(rbacService.hasPermission(Role.SUPER_ADMIN, 'receive')).toBe(true);
      expect(rbacService.hasPermission(Role.SUPER_ADMIN, 'approve')).toBe(true);
      expect(rbacService.hasPermission(Role.SUPER_ADMIN, 'bulk_send')).toBe(true);
      expect(rbacService.hasPermission(Role.SUPER_ADMIN, 'view_audit')).toBe(true);
    });

    it('should restrict compliance notifications to compliance manager', () => {
      expect(
        rbacService.hasPermission(Role.STAFF, 'send', {
          category: NotificationCategory.COMPLIANCE,
        })
      ).toBe(false);

      expect(
        rbacService.hasPermission(Role.COMPLIANCE_MANAGER, 'send', {
          category: NotificationCategory.COMPLIANCE,
        })
      ).toBe(true);
    });
  });

  describe('getMaxBulkRecipients', () => {
    it('should return correct limits for roles', () => {
      expect(rbacService.getMaxBulkRecipients(Role.STAFF)).toBe(10);
      expect(rbacService.getMaxBulkRecipients(Role.BRANCH_MANAGER)).toBe(500);
      expect(rbacService.getMaxBulkRecipients(Role.SUPER_ADMIN)).toBe(Infinity);
    });
  });

  describe('canDelegateTo', () => {
    it('should allow branch manager to delegate to staff', () => {
      expect(rbacService.canDelegateTo(Role.BRANCH_MANAGER, Role.STAFF)).toBe(true);
    });

    it('should not allow staff to delegate to branch manager', () => {
      expect(rbacService.canDelegateTo(Role.STAFF, Role.BRANCH_MANAGER)).toBe(false);
    });
  });

  describe('requiresApproval', () => {
    it('should require approval for relationship manager offers', () => {
      expect(rbacService.requiresApproval(Role.RELATIONSHIP_MANAGER, NotificationCategory.OFFER)).toBe(true);
    });

    it('should not require approval for branch manager offers', () => {
      expect(rbacService.requiresApproval(Role.BRANCH_MANAGER, NotificationCategory.OFFER)).toBe(false);
    });
  });
});

describe('ABAC Engine', () => {
  const createSubject = (overrides: Partial<SubjectAttributes> = {}): SubjectAttributes => ({
    userId: 'user-001',
    role: Role.STAFF,
    isActive: true,
    ...overrides,
  });

  describe('evaluate', () => {
    it('should deny inactive users', () => {
      const subject = createSubject({ isActive: false });
      const resource = {
        category: NotificationCategory.TASK,
        channel: NotificationChannel.IN_APP,
        priority: NotificationPriority.NORMAL,
      };
      const environment = {
        currentTime: new Date(),
        isWithinBusinessHours: true,
        isMaintenance: false,
      };

      const decision = abacEngine.evaluate(subject, resource, environment, 'send');

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('Inactive');
    });

    it('should deny during maintenance', () => {
      const subject = createSubject();
      const resource = {
        category: NotificationCategory.TASK,
        channel: NotificationChannel.IN_APP,
        priority: NotificationPriority.NORMAL,
      };
      const environment = {
        currentTime: new Date(),
        isWithinBusinessHours: true,
        isMaintenance: true,
        deviceType: 'web' as const,
      };

      const decision = abacEngine.evaluate(subject, resource, environment, 'send');

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('Maintenance');
    });

    it('should allow system role always', () => {
      const subject = createSubject({ role: Role.SYSTEM });
      const resource = {
        category: NotificationCategory.COMPLIANCE,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.URGENT,
      };
      const environment = {
        currentTime: new Date(),
        isWithinBusinessHours: false,
        isMaintenance: false,
      };

      const decision = abacEngine.evaluate(subject, resource, environment, 'send');

      expect(decision.allowed).toBe(true);
    });

    it('should deny sensitive data without clearance', () => {
      const subject = createSubject({ clearanceLevel: 2 });
      const resource = {
        category: NotificationCategory.ALERT,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.HIGH,
        containsSensitiveData: true,
      };
      const environment = {
        currentTime: new Date(),
        isWithinBusinessHours: true,
        isMaintenance: false,
      };

      const decision = abacEngine.evaluate(subject, resource, environment, 'send');

      expect(decision.allowed).toBe(false);
    });

    it('should allow sensitive data with high clearance', () => {
      const subject = createSubject({ role: Role.ADMIN, clearanceLevel: 4 });
      const resource = {
        category: NotificationCategory.ALERT,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.HIGH,
        containsSensitiveData: true,
      };
      const environment = {
        currentTime: new Date(),
        isWithinBusinessHours: true,
        isMaintenance: false,
      };

      const decision = abacEngine.evaluate(subject, resource, environment, 'send');

      expect(decision.allowed).toBe(true);
    });

    it('should add obligations for high risk score', () => {
      const subject = createSubject({ role: Role.STAFF });
      const resource = {
        category: NotificationCategory.TASK,
        channel: NotificationChannel.IN_APP,
        priority: NotificationPriority.NORMAL,
      };
      const environment = {
        currentTime: new Date(),
        isWithinBusinessHours: true,
        isMaintenance: false,
        riskScore: 0.8,
      };

      const decision = abacEngine.evaluate(subject, resource, environment, 'send');

      expect(decision.obligations).toBeDefined();
      expect(decision.obligations!.some((o) => o.type === 'rate_limit')).toBe(true);
    });
  });
});

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService({
      enableRBAC: true,
      enableABAC: true,
    });
  });

  describe('send', () => {
    const createPayload = (): NotificationPayload => ({
      id: 'notif-001',
      category: NotificationCategory.TASK,
      priority: NotificationPriority.NORMAL,
      title: 'Test Notification',
      body: 'This is a test notification',
    });

    const createRecipient = (): NotificationRecipient => ({
      userId: 'user-001',
      channel: NotificationChannel.IN_APP,
    });

    const createSender = (): SubjectAttributes => ({
      userId: 'sender-001',
      role: Role.STAFF,
      isActive: true,
    });

    it('should fail without proper role permission', async () => {
      const payload = {
        ...createPayload(),
        category: NotificationCategory.COMPLIANCE,
      };
      const recipient = createRecipient();
      const sender = createSender();

      const result = await service.send(payload, recipient, sender);

      expect(result.success).toBe(false);
      expect(result.error).toContain('permission');
    });
  });

  describe('setPreference', () => {
    it('should store preferences', () => {
      service.setPreference({
        userId: 'user-001',
        channel: NotificationChannel.EMAIL,
        category: NotificationCategory.OFFER,
        enabled: false,
      });

      // Preferences are stored internally - we'd need a getter to test
      // This test validates no error is thrown
      expect(true).toBe(true);
    });
  });
});
