/**
 * Notification Service - BFC Platform
 */

import { EventEmitter } from 'events';
import {
  Notification,
  NotificationPayload,
  NotificationRecipient,
  NotificationStatus,
  NotificationChannel,
  NotificationCategory,
  NotificationPriority,
  NotificationTemplate,
  NotificationPreference,
  BulkNotificationRequest,
  NotificationAuditLog,
} from './types';
import { Role, rbacService } from './rbac';
import {
  ABACEngine,
  abacEngine,
  SubjectAttributes,
  ResourceAttributes,
  EnvironmentAttributes,
  ABACAction,
  PolicyDecision,
  isWithinBusinessHours,
} from './abac';

export interface NotificationServiceConfig {
  enableRBAC?: boolean;
  enableABAC?: boolean;
  enableRealtime?: boolean;
  defaultPriority?: NotificationPriority;
  retryAttempts?: number;
  batchSize?: number;
  rateLimitPerMinute?: number;
}

export interface SendResult {
  success: boolean;
  notificationId?: string;
  error?: string;
  policyDecision?: PolicyDecision;
}

export interface NotificationHandler {
  channel: NotificationChannel;
  send(notification: Notification): Promise<boolean>;
}

/**
 * Main Notification Service
 */
export class NotificationService extends EventEmitter {
  private config: Required<NotificationServiceConfig>;
  private handlers: Map<NotificationChannel, NotificationHandler> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private preferences: Map<string, NotificationPreference[]> = new Map();
  private pendingApprovals: Map<string, Notification> = new Map();
  private auditLogs: NotificationAuditLog[] = [];
  private rateLimitCounters: Map<string, { count: number; resetAt: Date }> = new Map();

  constructor(config: NotificationServiceConfig = {}) {
    super();
    this.config = {
      enableRBAC: config.enableRBAC ?? true,
      enableABAC: config.enableABAC ?? true,
      enableRealtime: config.enableRealtime ?? true,
      defaultPriority: config.defaultPriority ?? NotificationPriority.NORMAL,
      retryAttempts: config.retryAttempts ?? 3,
      batchSize: config.batchSize ?? 100,
      rateLimitPerMinute: config.rateLimitPerMinute ?? 60,
    };
  }

  /**
   * Register a channel handler
   */
  registerHandler(handler: NotificationHandler): void {
    this.handlers.set(handler.channel, handler);
  }

  /**
   * Register notification template
   */
  registerTemplate(template: NotificationTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Send notification to a single recipient
   */
  async send(
    payload: NotificationPayload,
    recipient: NotificationRecipient,
    sender: SubjectAttributes
  ): Promise<SendResult> {
    // Build resource attributes
    const resource: ResourceAttributes = {
      notificationId: payload.id,
      category: payload.category,
      channel: recipient.channel,
      priority: payload.priority,
    };

    // Build environment
    const environment: EnvironmentAttributes = {
      currentTime: new Date(),
      isWithinBusinessHours: isWithinBusinessHours(),
      isMaintenance: false,
    };

    // RBAC check
    if (this.config.enableRBAC) {
      const hasPermission = rbacService.hasPermission(sender.role, 'send', {
        category: payload.category,
        channel: recipient.channel,
        priority: payload.priority,
      });

      if (!hasPermission) {
        this.logAudit(payload.id, 'failed', sender, {
          reason: 'RBAC denied',
          role: sender.role,
        });
        return {
          success: false,
          error: `Role ${sender.role} does not have permission to send ${payload.category} notifications`,
        };
      }
    }

    // ABAC check
    if (this.config.enableABAC) {
      const decision = abacEngine.evaluate(sender, resource, environment, 'send');

      if (!decision.allowed) {
        this.logAudit(payload.id, 'failed', sender, {
          reason: 'ABAC denied',
          policyReason: decision.reason,
        });
        return {
          success: false,
          error: decision.reason,
          policyDecision: decision,
        };
      }

      // Execute obligations
      await this.executeObligations(decision, payload.id, sender);
    }

    // Check if approval is required
    if (rbacService.requiresApproval(sender.role, payload.category)) {
      return this.submitForApproval(payload, recipient, sender);
    }

    // Rate limit check
    if (!this.checkRateLimit(sender.userId)) {
      return {
        success: false,
        error: 'Rate limit exceeded',
      };
    }

    // Create notification record
    const notification: Notification = {
      ...payload,
      recipientId: recipient.userId,
      channel: recipient.channel,
      status: NotificationStatus.PENDING,
      retryCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: sender.userId,
    };

    // Check user preferences
    if (!this.checkPreferences(recipient.userId, recipient.channel, payload.category)) {
      notification.status = NotificationStatus.EXPIRED;
      this.logAudit(notification.id, 'failed', sender, { reason: 'User preference disabled' });
      return {
        success: false,
        notificationId: notification.id,
        error: 'User has disabled this notification type',
      };
    }

    // Send via channel handler
    const handler = this.handlers.get(recipient.channel);
    if (!handler) {
      notification.status = NotificationStatus.FAILED;
      notification.failedReason = `No handler for channel: ${recipient.channel}`;
      this.logAudit(notification.id, 'failed', sender, { reason: notification.failedReason });
      return {
        success: false,
        notificationId: notification.id,
        error: notification.failedReason,
      };
    }

    try {
      const sent = await handler.send(notification);
      if (sent) {
        notification.status = NotificationStatus.SENT;
        notification.sentAt = new Date();
        this.logAudit(notification.id, 'sent', sender);
        this.emit('notification:sent', notification);
        return { success: true, notificationId: notification.id };
      } else {
        throw new Error('Handler returned false');
      }
    } catch (error) {
      notification.status = NotificationStatus.FAILED;
      notification.failedReason = error instanceof Error ? error.message : 'Unknown error';
      notification.retryCount++;
      this.logAudit(notification.id, 'failed', sender, { error: notification.failedReason });
      return {
        success: false,
        notificationId: notification.id,
        error: notification.failedReason,
      };
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulk(
    request: BulkNotificationRequest,
    sender: SubjectAttributes
  ): Promise<{ total: number; sent: number; failed: number; errors: string[] }> {
    const results = { total: request.recipients.length, sent: 0, failed: 0, errors: [] as string[] };

    // RBAC bulk check
    if (this.config.enableRBAC) {
      const maxRecipients = rbacService.getMaxBulkRecipients(sender.role);
      if (request.recipients.length > maxRecipients) {
        results.errors.push(
          `Role ${sender.role} can only send to ${maxRecipients} recipients at once`
        );
        results.failed = results.total;
        return results;
      }
    }

    // Get template
    const template = this.templates.get(request.templateId);
    if (!template) {
      results.errors.push(`Template ${request.templateId} not found`);
      results.failed = results.total;
      return results;
    }

    // Process in batches
    for (let i = 0; i < request.recipients.length; i += this.config.batchSize) {
      const batch = request.recipients.slice(i, i + this.config.batchSize);

      const batchPromises = batch.map(async (recipient) => {
        const payload = this.renderTemplate(template, request.variables, recipient);

        if (request.scheduledAt && request.scheduledAt > new Date()) {
          // Schedule for later
          return this.schedule(payload, recipient, sender, request.scheduledAt);
        }

        return this.send(payload, recipient, sender);
      });

      const batchResults = await Promise.all(batchPromises);

      for (const result of batchResults) {
        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          if (result.error) results.errors.push(result.error);
        }
      }
    }

    this.emit('bulk:completed', results);
    return results;
  }

  /**
   * Schedule notification for later
   */
  async schedule(
    payload: NotificationPayload,
    recipient: NotificationRecipient,
    sender: SubjectAttributes,
    scheduledAt: Date
  ): Promise<SendResult> {
    // RBAC check for scheduling
    if (this.config.enableRBAC) {
      const hasPermission = rbacService.hasPermission(sender.role, 'schedule');
      if (!hasPermission) {
        return {
          success: false,
          error: `Role ${sender.role} cannot schedule notifications`,
        };
      }
    }

    payload.scheduledAt = scheduledAt;

    const notification: Notification = {
      ...payload,
      recipientId: recipient.userId,
      channel: recipient.channel,
      status: NotificationStatus.PENDING,
      retryCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: sender.userId,
    };

    this.logAudit(notification.id, 'created', sender, { scheduledAt });
    this.emit('notification:scheduled', notification);

    return { success: true, notificationId: notification.id };
  }

  /**
   * Approve pending notification
   */
  async approve(
    notificationId: string,
    approver: SubjectAttributes
  ): Promise<SendResult> {
    const notification = this.pendingApprovals.get(notificationId);
    if (!notification) {
      return { success: false, error: 'Notification not found or already processed' };
    }

    // Check approval permission
    if (this.config.enableRBAC) {
      const hasPermission = rbacService.hasPermission(approver.role, 'approve', {
        category: notification.category,
      });
      if (!hasPermission) {
        return { success: false, error: `Role ${approver.role} cannot approve this notification` };
      }
    }

    this.pendingApprovals.delete(notificationId);
    this.logAudit(notificationId, 'created', approver, { action: 'approved' });

    // Re-send as approver
    return this.send(
      notification,
      { userId: notification.recipientId, channel: notification.channel },
      approver
    );
  }

  /**
   * Reject pending notification
   */
  reject(notificationId: string, approver: SubjectAttributes, reason?: string): boolean {
    const notification = this.pendingApprovals.get(notificationId);
    if (!notification) return false;

    this.pendingApprovals.delete(notificationId);
    this.logAudit(notificationId, 'failed', approver, { action: 'rejected', reason });
    this.emit('notification:rejected', { notificationId, reason });

    return true;
  }

  /**
   * Set user preferences
   */
  setPreference(preference: NotificationPreference): void {
    const key = preference.userId;
    const existing = this.preferences.get(key) ?? [];
    const index = existing.findIndex(
      (p) => p.channel === preference.channel && p.category === preference.category
    );

    if (index >= 0) {
      existing[index] = preference;
    } else {
      existing.push(preference);
    }

    this.preferences.set(key, existing);
  }

  /**
   * Get audit logs
   */
  getAuditLogs(
    filter?: { userId?: string; notificationId?: string; startDate?: Date; endDate?: Date },
    requester?: SubjectAttributes
  ): NotificationAuditLog[] {
    // Check permission
    if (requester && this.config.enableRBAC) {
      const hasPermission = rbacService.hasPermission(requester.role, 'view_audit');
      if (!hasPermission) return [];
    }

    let logs = [...this.auditLogs];

    if (filter?.userId) {
      logs = logs.filter((l) => l.actorId === filter.userId);
    }
    if (filter?.notificationId) {
      logs = logs.filter((l) => l.notificationId === filter.notificationId);
    }
    if (filter?.startDate) {
      logs = logs.filter((l) => l.timestamp >= filter.startDate!);
    }
    if (filter?.endDate) {
      logs = logs.filter((l) => l.timestamp <= filter.endDate!);
    }

    return logs;
  }

  /**
   * Private: Submit for approval
   */
  private submitForApproval(
    payload: NotificationPayload,
    recipient: NotificationRecipient,
    sender: SubjectAttributes
  ): SendResult {
    const notification: Notification = {
      ...payload,
      recipientId: recipient.userId,
      channel: recipient.channel,
      status: NotificationStatus.PENDING,
      retryCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: sender.userId,
    };

    this.pendingApprovals.set(notification.id, notification);
    this.logAudit(notification.id, 'created', sender, { status: 'pending_approval' });

    // Notify approvers
    const approverRoles = rbacService.getApproverRoles(payload.category);
    this.emit('approval:required', { notification, approverRoles });

    return {
      success: true,
      notificationId: notification.id,
      error: 'Notification submitted for approval',
    };
  }

  /**
   * Private: Check user preferences
   */
  private checkPreferences(
    userId: string,
    channel: NotificationChannel,
    category: NotificationCategory
  ): boolean {
    const prefs = this.preferences.get(userId);
    if (!prefs) return true; // Default to enabled

    const pref = prefs.find((p) => p.channel === channel && p.category === category);
    if (!pref) return true;

    if (!pref.enabled) return false;

    // Check quiet hours
    if (pref.quietHoursStart && pref.quietHoursEnd) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

      if (currentTime >= pref.quietHoursStart && currentTime <= pref.quietHoursEnd) {
        return false;
      }
    }

    return true;
  }

  /**
   * Private: Check rate limit
   */
  private checkRateLimit(userId: string): boolean {
    const now = new Date();
    const counter = this.rateLimitCounters.get(userId);

    if (!counter || counter.resetAt < now) {
      this.rateLimitCounters.set(userId, {
        count: 1,
        resetAt: new Date(now.getTime() + 60000), // Reset in 1 minute
      });
      return true;
    }

    if (counter.count >= this.config.rateLimitPerMinute) {
      return false;
    }

    counter.count++;
    return true;
  }

  /**
   * Private: Execute policy obligations
   */
  private async executeObligations(
    decision: PolicyDecision,
    notificationId: string,
    sender: SubjectAttributes
  ): Promise<void> {
    for (const obligation of decision.obligations ?? []) {
      switch (obligation.type) {
        case 'log_audit':
          // Already handled
          break;

        case 'require_mfa':
          // Emit event for MFA verification
          this.emit('mfa:required', { sender, notificationId });
          break;

        case 'notify_supervisor':
          this.emit('supervisor:notify', { sender, notificationId });
          break;

        case 'rate_limit':
          const limit = (obligation.params?.maxPerMinute as number) ?? 5;
          this.config.rateLimitPerMinute = Math.min(this.config.rateLimitPerMinute, limit);
          break;

        case 'mask_data':
          // Handled during template rendering
          break;
      }
    }
  }

  /**
   * Private: Render template
   */
  private renderTemplate(
    template: NotificationTemplate,
    variables: Record<string, unknown>,
    recipient: NotificationRecipient
  ): NotificationPayload {
    let title = template.titleTemplate;
    let body = template.bodyTemplate;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      title = title.replace(new RegExp(placeholder, 'g'), String(value));
      body = body.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return {
      id: `${template.id}-${recipient.userId}-${Date.now()}`,
      templateId: template.id,
      category: template.category,
      priority: NotificationPriority.NORMAL,
      title,
      body,
    };
  }

  /**
   * Private: Log audit
   */
  private logAudit(
    notificationId: string,
    action: NotificationAuditLog['action'],
    actor: SubjectAttributes,
    details?: Record<string, unknown>
  ): void {
    const log: NotificationAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      notificationId,
      action,
      actorId: actor.userId,
      actorRole: actor.role,
      details,
      timestamp: new Date(),
    };

    this.auditLogs.push(log);
    this.emit('audit:log', log);
  }
}

export const notificationService = new NotificationService();
