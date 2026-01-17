/**
 * Notifications Module - BFC Platform
 *
 * Enterprise notification system with RBAC and ABAC controls
 */

// Types
export * from './types';

// RBAC
export {
  Role,
  Permission,
  RolePermissions,
  rolePermissions,
  RBACService,
  rbacService,
} from './rbac';

// ABAC
export {
  SubjectAttributes,
  ResourceAttributes,
  EnvironmentAttributes,
  ABACAction,
  PolicyDecision,
  PolicyObligation,
  PolicyRule,
  defaultPolicies,
  ABACEngine,
  abacEngine,
  isWithinBusinessHours,
} from './abac';

// Service
export {
  NotificationService,
  NotificationServiceConfig,
  SendResult,
  NotificationHandler,
  notificationService,
} from './service';

// Handlers
export {
  PushNotificationHandler,
  InAppNotificationHandler,
  EmailNotificationHandler,
  SMSNotificationHandler,
  WhatsAppNotificationHandler,
  WebhookNotificationHandler,
  createDefaultHandlers,
} from './handlers';
