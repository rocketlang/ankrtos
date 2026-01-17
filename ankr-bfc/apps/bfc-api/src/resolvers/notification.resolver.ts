/**
 * Notification Resolver - BFC API
 */

import {
  NotificationService,
  notificationService,
  createDefaultHandlers,
  Role,
  SubjectAttributes,
  NotificationChannel,
  NotificationCategory,
  NotificationPriority,
  NotificationPayload,
  NotificationRecipient,
  NotificationTemplate,
  NotificationPreference,
  rbacService,
} from '@bfc/core';

// Initialize handlers
const handlers = createDefaultHandlers();
handlers.forEach((handler) => notificationService.registerHandler(handler));

// Register some default templates
notificationService.registerTemplate({
  id: 'offer-new',
  name: 'New Offer Notification',
  category: NotificationCategory.OFFER,
  channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP, NotificationChannel.EMAIL],
  titleTemplate: 'New Offer: {{offerTitle}}',
  bodyTemplate: 'Hi {{customerName}}, we have a special offer for you! {{offerDescription}}',
  variables: ['offerTitle', 'customerName', 'offerDescription'],
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

notificationService.registerTemplate({
  id: 'kyc-reminder',
  name: 'KYC Reminder',
  category: NotificationCategory.KYC,
  channels: [NotificationChannel.PUSH, NotificationChannel.SMS],
  titleTemplate: 'KYC Reminder',
  bodyTemplate: 'Hi {{customerName}}, your KYC documents are pending. Please update by {{dueDate}}.',
  variables: ['customerName', 'dueDate'],
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

notificationService.registerTemplate({
  id: 'payment-reminder',
  name: 'Payment Reminder',
  category: NotificationCategory.PAYMENT_REMINDER,
  channels: [NotificationChannel.PUSH, NotificationChannel.SMS, NotificationChannel.EMAIL],
  titleTemplate: 'Payment Due: {{amount}}',
  bodyTemplate: 'Hi {{customerName}}, your {{productType}} payment of {{amount}} is due on {{dueDate}}.',
  variables: ['customerName', 'productType', 'amount', 'dueDate'],
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

notificationService.registerTemplate({
  id: 'task-assigned',
  name: 'Task Assigned',
  category: NotificationCategory.TASK,
  channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
  titleTemplate: 'New Task: {{taskTitle}}',
  bodyTemplate: 'You have been assigned a new task: {{taskDescription}}. Priority: {{priority}}',
  variables: ['taskTitle', 'taskDescription', 'priority'],
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

notificationService.registerTemplate({
  id: 'compliance-alert',
  name: 'Compliance Alert',
  category: NotificationCategory.COMPLIANCE,
  channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
  titleTemplate: 'Compliance Alert: {{alertType}}',
  bodyTemplate: 'A compliance issue has been detected: {{description}}. Customer: {{customerId}}',
  variables: ['alertType', 'description', 'customerId'],
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

notificationService.registerTemplate({
  id: 'risk-alert',
  name: 'Risk Alert',
  category: NotificationCategory.RISK,
  channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH],
  titleTemplate: 'Risk Alert: {{riskLevel}}',
  bodyTemplate: 'Risk detected for {{entityType}} {{entityId}}: {{description}}',
  variables: ['riskLevel', 'entityType', 'entityId', 'description'],
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Helper to extract subject from context
function getSubjectFromContext(context: any): SubjectAttributes {
  const user = context.user || {};
  return {
    userId: user.id || 'anonymous',
    role: user.role || Role.STAFF,
    department: user.department,
    branchId: user.branchId,
    regionId: user.regionId,
    employeeId: user.employeeId,
    clearanceLevel: user.clearanceLevel || 1,
    specialPermissions: user.permissions || [],
    isActive: user.isActive !== false,
    lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
  };
}

export const notificationResolvers = {
  Query: {
    // Get user's notifications
    notifications: async (
      _: unknown,
      args: { limit?: number; offset?: number; category?: string; status?: string },
      context: any
    ) => {
      const subject = getSubjectFromContext(context);

      // In production, fetch from database
      return {
        items: [],
        total: 0,
        hasMore: false,
      };
    },

    // Get unread count
    notificationUnreadCount: async (_: unknown, __: unknown, context: any) => {
      const subject = getSubjectFromContext(context);
      // In production, fetch from database
      return 0;
    },

    // Get notification preferences
    notificationPreferences: async (_: unknown, __: unknown, context: any) => {
      const subject = getSubjectFromContext(context);
      // In production, fetch from database
      return [];
    },

    // Get notification templates (admin)
    notificationTemplates: async (
      _: unknown,
      args: { category?: string },
      context: any
    ) => {
      const subject = getSubjectFromContext(context);

      // Check admin permission
      if (![Role.ADMIN, Role.SUPER_ADMIN].includes(subject.role)) {
        throw new Error('Unauthorized: Admin access required');
      }

      // In production, fetch from database
      return [];
    },

    // Get audit logs (compliance)
    notificationAuditLogs: async (
      _: unknown,
      args: { userId?: string; startDate?: string; endDate?: string; limit?: number },
      context: any
    ) => {
      const subject = getSubjectFromContext(context);

      // Check audit permission
      if (!rbacService.hasPermission(subject.role, 'view_audit')) {
        throw new Error('Unauthorized: Audit access required');
      }

      return notificationService.getAuditLogs(
        {
          userId: args.userId,
          startDate: args.startDate ? new Date(args.startDate) : undefined,
          endDate: args.endDate ? new Date(args.endDate) : undefined,
        },
        subject
      );
    },

    // Get pending approvals
    pendingNotificationApprovals: async (_: unknown, __: unknown, context: any) => {
      const subject = getSubjectFromContext(context);

      // Check approve permission
      if (!rbacService.hasPermission(subject.role, 'approve')) {
        throw new Error('Unauthorized: Approval access required');
      }

      // In production, fetch from database
      return [];
    },
  },

  Mutation: {
    // Send notification
    sendNotification: async (
      _: unknown,
      args: {
        recipientId: string;
        channel: string;
        category: string;
        priority?: string;
        title: string;
        body: string;
        data?: Record<string, unknown>;
        actionUrl?: string;
      },
      context: any
    ) => {
      const subject = getSubjectFromContext(context);

      const payload: NotificationPayload = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        category: args.category as NotificationCategory,
        priority: (args.priority as NotificationPriority) || NotificationPriority.NORMAL,
        title: args.title,
        body: args.body,
        data: args.data,
        actionUrl: args.actionUrl,
      };

      const recipient: NotificationRecipient = {
        userId: args.recipientId,
        channel: args.channel as NotificationChannel,
      };

      const result = await notificationService.send(payload, recipient, subject);

      return {
        success: result.success,
        notificationId: result.notificationId,
        error: result.error,
      };
    },

    // Send bulk notifications
    sendBulkNotification: async (
      _: unknown,
      args: {
        templateId: string;
        recipientIds: string[];
        channel: string;
        variables: Record<string, unknown>;
        scheduledAt?: string;
      },
      context: any
    ) => {
      const subject = getSubjectFromContext(context);

      const recipients: NotificationRecipient[] = args.recipientIds.map((id) => ({
        userId: id,
        channel: args.channel as NotificationChannel,
      }));

      const result = await notificationService.sendBulk(
        {
          templateId: args.templateId,
          recipients,
          variables: args.variables,
          scheduledAt: args.scheduledAt ? new Date(args.scheduledAt) : undefined,
        },
        subject
      );

      return result;
    },

    // Mark notification as read
    markNotificationRead: async (
      _: unknown,
      args: { notificationId: string },
      context: any
    ) => {
      const subject = getSubjectFromContext(context);
      // In production, update database
      return true;
    },

    // Mark all notifications as read
    markAllNotificationsRead: async (_: unknown, __: unknown, context: any) => {
      const subject = getSubjectFromContext(context);
      // In production, update database
      return true;
    },

    // Update notification preferences
    updateNotificationPreference: async (
      _: unknown,
      args: {
        channel: string;
        category: string;
        enabled: boolean;
        quietHoursStart?: string;
        quietHoursEnd?: string;
      },
      context: any
    ) => {
      const subject = getSubjectFromContext(context);

      const preference: NotificationPreference = {
        userId: subject.userId,
        channel: args.channel as NotificationChannel,
        category: args.category as NotificationCategory,
        enabled: args.enabled,
        quietHoursStart: args.quietHoursStart,
        quietHoursEnd: args.quietHoursEnd,
      };

      notificationService.setPreference(preference);

      return preference;
    },

    // Approve pending notification (for managers)
    approveNotification: async (
      _: unknown,
      args: { notificationId: string },
      context: any
    ) => {
      const subject = getSubjectFromContext(context);

      const result = await notificationService.approve(args.notificationId, subject);

      return {
        success: result.success,
        error: result.error,
      };
    },

    // Reject pending notification
    rejectNotification: async (
      _: unknown,
      args: { notificationId: string; reason?: string },
      context: any
    ) => {
      const subject = getSubjectFromContext(context);

      const success = notificationService.reject(
        args.notificationId,
        subject,
        args.reason
      );

      return { success };
    },

    // Create notification template (admin)
    createNotificationTemplate: async (
      _: unknown,
      args: {
        id: string;
        name: string;
        category: string;
        channels: string[];
        titleTemplate: string;
        bodyTemplate: string;
        variables: string[];
      },
      context: any
    ) => {
      const subject = getSubjectFromContext(context);

      if (![Role.ADMIN, Role.SUPER_ADMIN].includes(subject.role)) {
        throw new Error('Unauthorized: Admin access required');
      }

      const template: NotificationTemplate = {
        id: args.id,
        name: args.name,
        category: args.category as NotificationCategory,
        channels: args.channels as NotificationChannel[],
        titleTemplate: args.titleTemplate,
        bodyTemplate: args.bodyTemplate,
        variables: args.variables,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      notificationService.registerTemplate(template);

      return template;
    },
  },

  Subscription: {
    // Real-time notification subscription
    notificationReceived: {
      subscribe: (_: unknown, __: unknown, context: any) => {
        const subject = getSubjectFromContext(context);

        // Return async iterator for real-time notifications
        // In production, use Redis pub/sub or similar
        return {
          [Symbol.asyncIterator]() {
            return {
              next() {
                return new Promise((resolve) => {
                  // Wait for new notification
                  notificationService.once('notification:sent', (notification) => {
                    if (notification.recipientId === subject.userId) {
                      resolve({ value: { notificationReceived: notification }, done: false });
                    }
                  });
                });
              },
            };
          },
        };
      },
    },
  },
};

// GraphQL type definitions for notifications
export const notificationTypeDefs = `
  enum NotificationChannel {
    PUSH
    IN_APP
    EMAIL
    SMS
    WHATSAPP
    WEBHOOK
  }

  enum NotificationCategory {
    OFFER
    ACCOUNT
    TRANSACTION
    KYC
    LOAN
    PAYMENT_REMINDER
    TASK
    APPROVAL
    ALERT
    COMPLIANCE
    RISK
    SYSTEM
  }

  enum NotificationPriority {
    LOW
    NORMAL
    HIGH
    URGENT
  }

  enum NotificationStatus {
    PENDING
    SENT
    DELIVERED
    READ
    FAILED
    EXPIRED
  }

  type Notification {
    id: ID!
    category: NotificationCategory!
    priority: NotificationPriority!
    title: String!
    body: String!
    data: JSON
    actionUrl: String
    status: NotificationStatus!
    channel: NotificationChannel!
    sentAt: DateTime
    readAt: DateTime
    createdAt: DateTime!
  }

  type NotificationResult {
    items: [Notification!]!
    total: Int!
    hasMore: Boolean!
  }

  type SendNotificationResult {
    success: Boolean!
    notificationId: ID
    error: String
  }

  type BulkNotificationResult {
    total: Int!
    sent: Int!
    failed: Int!
    errors: [String!]!
  }

  type NotificationPreference {
    userId: ID!
    channel: NotificationChannel!
    category: NotificationCategory!
    enabled: Boolean!
    quietHoursStart: String
    quietHoursEnd: String
  }

  type NotificationTemplate {
    id: ID!
    name: String!
    category: NotificationCategory!
    channels: [NotificationChannel!]!
    titleTemplate: String!
    bodyTemplate: String!
    variables: [String!]!
    active: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type NotificationAuditLog {
    id: ID!
    notificationId: ID!
    action: String!
    actorId: ID!
    actorRole: String!
    details: JSON
    timestamp: DateTime!
  }

  extend type Query {
    notifications(limit: Int, offset: Int, category: NotificationCategory, status: NotificationStatus): NotificationResult!
    notificationUnreadCount: Int!
    notificationPreferences: [NotificationPreference!]!
    notificationTemplates(category: NotificationCategory): [NotificationTemplate!]!
    notificationAuditLogs(userId: ID, startDate: DateTime, endDate: DateTime, limit: Int): [NotificationAuditLog!]!
    pendingNotificationApprovals: [Notification!]!
  }

  extend type Mutation {
    sendNotification(
      recipientId: ID!
      channel: NotificationChannel!
      category: NotificationCategory!
      priority: NotificationPriority
      title: String!
      body: String!
      data: JSON
      actionUrl: String
    ): SendNotificationResult!

    sendBulkNotification(
      templateId: ID!
      recipientIds: [ID!]!
      channel: NotificationChannel!
      variables: JSON!
      scheduledAt: DateTime
    ): BulkNotificationResult!

    markNotificationRead(notificationId: ID!): Boolean!
    markAllNotificationsRead: Boolean!

    updateNotificationPreference(
      channel: NotificationChannel!
      category: NotificationCategory!
      enabled: Boolean!
      quietHoursStart: String
      quietHoursEnd: String
    ): NotificationPreference!

    approveNotification(notificationId: ID!): SendNotificationResult!
    rejectNotification(notificationId: ID!, reason: String): SendNotificationResult!

    createNotificationTemplate(
      id: ID!
      name: String!
      category: NotificationCategory!
      channels: [NotificationChannel!]!
      titleTemplate: String!
      bodyTemplate: String!
      variables: [String!]!
    ): NotificationTemplate!
  }

  extend type Subscription {
    notificationReceived: Notification!
  }
`;
