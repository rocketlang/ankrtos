/**
 * @ankr/notifications
 *
 * Multi-channel notification system with RBAC, ABAC, templates,
 * and delivery tracking.
 *
 * Channels: Push, Email, SMS, WhatsApp, In-App, Webhook
 *
 * @example
 * ```typescript
 * import { NotificationService } from '@ankr/notifications';
 *
 * const service = new NotificationService();
 *
 * await service.send({
 *   channel: 'PUSH',
 *   recipient: { userId: 'user-123', pushToken: 'xxx' },
 *   template: 'WELCOME',
 *   data: { name: 'John' }
 * });
 * ```
 *
 * @packageDocumentation
 */

import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Notification channel
 */
export type NotificationChannel = 'PUSH' | 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP' | 'WEBHOOK';

/**
 * Notification priority
 */
export type NotificationPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

/**
 * Notification status
 */
export type NotificationStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'CANCELLED';

/**
 * Notification recipient
 */
export interface NotificationRecipient {
  userId: string;
  email?: string;
  phone?: string;
  pushToken?: string;
  whatsappId?: string;
  webhookUrl?: string;
  preferences?: NotificationPreferences;
  metadata?: Record<string, any>;
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  channels: {
    [K in NotificationChannel]?: boolean;
  };
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
    timezone: string;
  };
  categories?: {
    [category: string]: boolean;
  };
}

/**
 * Notification template
 */
export interface NotificationTemplate {
  id: string;
  name: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  bodyHtml?: string;
  variables: string[];
  category?: string;
  metadata?: Record<string, any>;
}

/**
 * Notification request
 */
export interface NotificationRequest {
  channel: NotificationChannel;
  recipient: NotificationRecipient;
  template?: string;
  subject?: string;
  body?: string;
  bodyHtml?: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  category?: string;
  scheduledAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Notification result
 */
export interface NotificationResult {
  id: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  recipient: string;
  sentAt?: Date;
  deliveredAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Notification handler interface
 */
export interface NotificationHandler {
  channel: NotificationChannel;
  send(notification: ProcessedNotification): Promise<NotificationResult>;
  canSend?(recipient: NotificationRecipient): boolean;
}

/**
 * Processed notification (ready to send)
 */
export interface ProcessedNotification {
  id: string;
  channel: NotificationChannel;
  recipient: NotificationRecipient;
  subject?: string;
  body: string;
  bodyHtml?: string;
  priority: NotificationPriority;
  category?: string;
  metadata?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RBAC (Role-Based Access Control)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Role definition
 */
export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

/**
 * Permission definition
 */
export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete' | 'send')[];
}

/**
 * Default roles
 */
export const DEFAULT_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'Administrator',
    permissions: [
      { resource: 'notifications', actions: ['create', 'read', 'update', 'delete', 'send'] },
      { resource: 'templates', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'users', actions: ['read', 'update'] },
    ],
  },
  {
    id: 'operator',
    name: 'Operator',
    permissions: [
      { resource: 'notifications', actions: ['create', 'read', 'send'] },
      { resource: 'templates', actions: ['read'] },
    ],
  },
  {
    id: 'viewer',
    name: 'Viewer',
    permissions: [
      { resource: 'notifications', actions: ['read'] },
      { resource: 'templates', actions: ['read'] },
    ],
  },
];

/**
 * RBAC Engine
 */
export class RBACEngine {
  private roles: Map<string, Role> = new Map();

  constructor(roles?: Role[]) {
    for (const role of roles || DEFAULT_ROLES) {
      this.roles.set(role.id, role);
    }
  }

  /**
   * Check if a role has permission
   */
  hasPermission(roleId: string, resource: string, action: string): boolean {
    const role = this.roles.get(roleId);
    if (!role) return false;

    return role.permissions.some(
      p => p.resource === resource && p.actions.includes(action as any)
    );
  }

  /**
   * Add a role
   */
  addRole(role: Role): void {
    this.roles.set(role.id, role);
  }

  /**
   * Get a role
   */
  getRole(roleId: string): Role | undefined {
    return this.roles.get(roleId);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ABAC (Attribute-Based Access Control)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ABAC Policy
 */
export interface ABACPolicy {
  id: string;
  name: string;
  description?: string;
  condition: (context: ABACContext) => boolean;
  effect: 'ALLOW' | 'DENY';
}

/**
 * ABAC Context
 */
export interface ABACContext {
  subject: {
    userId: string;
    roles: string[];
    attributes: Record<string, any>;
  };
  resource: {
    type: string;
    id?: string;
    attributes: Record<string, any>;
  };
  action: string;
  environment: {
    time: Date;
    ip?: string;
    location?: string;
  };
}

/**
 * ABAC Engine
 */
export class ABACEngine {
  private policies: ABACPolicy[] = [];

  constructor(policies?: ABACPolicy[]) {
    this.policies = policies || [];
  }

  /**
   * Add a policy
   */
  addPolicy(policy: ABACPolicy): void {
    this.policies.push(policy);
  }

  /**
   * Evaluate policies
   */
  evaluate(context: ABACContext): { allowed: boolean; matchedPolicies: string[] } {
    const matchedPolicies: string[] = [];
    let hasAllow = false;
    let hasDeny = false;

    for (const policy of this.policies) {
      try {
        if (policy.condition(context)) {
          matchedPolicies.push(policy.id);
          if (policy.effect === 'ALLOW') hasAllow = true;
          if (policy.effect === 'DENY') hasDeny = true;
        }
      } catch {
        // Skip policies that error
      }
    }

    // Deny takes precedence
    return {
      allowed: hasDeny ? false : hasAllow,
      matchedPolicies,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Template Engine
 */
export class TemplateEngine {
  private templates: Map<string, NotificationTemplate> = new Map();

  /**
   * Register a template
   */
  register(template: NotificationTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get a template
   */
  get(templateId: string): NotificationTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Render a template
   */
  render(templateId: string, data: Record<string, any>): { subject?: string; body: string; bodyHtml?: string } {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const subject = template.subject ? this.interpolate(template.subject, data) : undefined;
    const body = this.interpolate(template.body, data);
    const bodyHtml = template.bodyHtml ? this.interpolate(template.bodyHtml, data) : undefined;

    return { subject, body, bodyHtml };
  }

  /**
   * Interpolate variables in a string
   */
  private interpolate(text: string, data: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }

  /**
   * Get all templates
   */
  getAll(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Console handler (for testing)
 */
export class ConsoleHandler implements NotificationHandler {
  channel: NotificationChannel = 'IN_APP';

  async send(notification: ProcessedNotification): Promise<NotificationResult> {
    console.log(`[Notification] ${notification.channel} to ${notification.recipient.userId}:`);
    console.log(`  Subject: ${notification.subject || 'N/A'}`);
    console.log(`  Body: ${notification.body}`);

    return {
      id: notification.id,
      channel: notification.channel,
      status: 'SENT',
      recipient: notification.recipient.userId,
      sentAt: new Date(),
    };
  }
}

/**
 * Webhook handler
 */
export class WebhookHandler implements NotificationHandler {
  channel: NotificationChannel = 'WEBHOOK';

  async send(notification: ProcessedNotification): Promise<NotificationResult> {
    const url = notification.recipient.webhookUrl;
    if (!url) {
      return {
        id: notification.id,
        channel: notification.channel,
        status: 'FAILED',
        recipient: notification.recipient.userId,
        error: 'No webhook URL provided',
      };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: notification.id,
          channel: notification.channel,
          subject: notification.subject,
          body: notification.body,
          priority: notification.priority,
          metadata: notification.metadata,
        }),
      });

      return {
        id: notification.id,
        channel: notification.channel,
        status: response.ok ? 'SENT' : 'FAILED',
        recipient: notification.recipient.userId,
        sentAt: new Date(),
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        id: notification.id,
        channel: notification.channel,
        status: 'FAILED',
        recipient: notification.recipient.userId,
        error: (error as Error).message,
      };
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Notification service configuration
 */
export interface NotificationServiceConfig {
  handlers?: NotificationHandler[];
  templates?: NotificationTemplate[];
  rbac?: RBACEngine;
  abac?: ABACEngine;
  defaultPriority?: NotificationPriority;
  enableQuietHours?: boolean;
  rateLimits?: {
    perUser?: { count: number; windowMs: number };
    global?: { count: number; windowMs: number };
  };
}

/**
 * Notification Service
 *
 * Main service for sending notifications across multiple channels.
 */
export class NotificationService extends EventEmitter {
  private handlers: Map<NotificationChannel, NotificationHandler> = new Map();
  private templateEngine: TemplateEngine;
  private rbac?: RBACEngine;
  private abac?: ABACEngine;
  private config: NotificationServiceConfig;
  private rateLimitStore: Map<string, { count: number; resetAt: number }> = new Map();

  constructor(config: NotificationServiceConfig = {}) {
    super();
    this.config = {
      defaultPriority: 'NORMAL',
      enableQuietHours: true,
      ...config,
    };

    this.templateEngine = new TemplateEngine();
    this.rbac = config.rbac;
    this.abac = config.abac;

    // Register default handlers
    this.registerHandler(new ConsoleHandler());
    this.registerHandler(new WebhookHandler());

    // Register custom handlers
    for (const handler of config.handlers || []) {
      this.registerHandler(handler);
    }

    // Register templates
    for (const template of config.templates || []) {
      this.templateEngine.register(template);
    }
  }

  /**
   * Register a notification handler
   */
  registerHandler(handler: NotificationHandler): void {
    this.handlers.set(handler.channel, handler);
  }

  /**
   * Register a template
   */
  registerTemplate(template: NotificationTemplate): void {
    this.templateEngine.register(template);
  }

  /**
   * Send a notification
   */
  async send(request: NotificationRequest): Promise<NotificationResult> {
    const id = this.generateId();

    // Check quiet hours
    if (this.config.enableQuietHours && this.isQuietHours(request.recipient)) {
      if (request.priority !== 'CRITICAL') {
        return {
          id,
          channel: request.channel,
          status: 'CANCELLED',
          recipient: request.recipient.userId,
          error: 'Quiet hours',
        };
      }
    }

    // Check user preferences
    if (!this.checkPreferences(request)) {
      return {
        id,
        channel: request.channel,
        status: 'CANCELLED',
        recipient: request.recipient.userId,
        error: 'User has disabled this channel/category',
      };
    }

    // Check rate limits
    if (this.config.rateLimits?.perUser) {
      if (!this.checkRateLimit(`user:${request.recipient.userId}`, this.config.rateLimits.perUser)) {
        return {
          id,
          channel: request.channel,
          status: 'FAILED',
          recipient: request.recipient.userId,
          error: 'Rate limited',
        };
      }
    }

    // Get handler
    const handler = this.handlers.get(request.channel);
    if (!handler) {
      return {
        id,
        channel: request.channel,
        status: 'FAILED',
        recipient: request.recipient.userId,
        error: `No handler for channel: ${request.channel}`,
      };
    }

    // Check if handler can send
    if (handler.canSend && !handler.canSend(request.recipient)) {
      return {
        id,
        channel: request.channel,
        status: 'FAILED',
        recipient: request.recipient.userId,
        error: 'Handler cannot send to this recipient',
      };
    }

    // Process template if provided
    let subject = request.subject;
    let body = request.body || '';
    let bodyHtml = request.bodyHtml;

    if (request.template) {
      const rendered = this.templateEngine.render(request.template, request.data || {});
      subject = subject || rendered.subject;
      body = rendered.body;
      bodyHtml = rendered.bodyHtml;
    }

    // Build processed notification
    const notification: ProcessedNotification = {
      id,
      channel: request.channel,
      recipient: request.recipient,
      subject,
      body,
      bodyHtml,
      priority: request.priority || this.config.defaultPriority!,
      category: request.category,
      metadata: request.metadata,
    };

    // Emit before send
    this.emit('beforeSend', notification);

    // Send
    try {
      const result = await handler.send(notification);
      this.emit('sent', result);
      return result;
    } catch (error) {
      const result: NotificationResult = {
        id,
        channel: request.channel,
        status: 'FAILED',
        recipient: request.recipient.userId,
        error: (error as Error).message,
      };
      this.emit('error', result);
      return result;
    }
  }

  /**
   * Send to multiple recipients
   */
  async sendBulk(
    requests: NotificationRequest[]
  ): Promise<NotificationResult[]> {
    return Promise.all(requests.map(r => this.send(r)));
  }

  /**
   * Check if it's quiet hours for a recipient
   */
  private isQuietHours(recipient: NotificationRecipient): boolean {
    const qh = recipient.preferences?.quietHours;
    if (!qh?.enabled) return false;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    return currentTime >= qh.start && currentTime <= qh.end;
  }

  /**
   * Check user preferences
   */
  private checkPreferences(request: NotificationRequest): boolean {
    const prefs = request.recipient.preferences;
    if (!prefs) return true;

    // Check channel preference
    if (prefs.channels[request.channel] === false) {
      return false;
    }

    // Check category preference
    if (request.category && prefs.categories?.[request.category] === false) {
      return false;
    }

    return true;
  }

  /**
   * Check rate limit
   */
  private checkRateLimit(key: string, limit: { count: number; windowMs: number }): boolean {
    const now = Date.now();
    const entry = this.rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
      this.rateLimitStore.set(key, { count: 1, resetAt: now + limit.windowMs });
      return true;
    }

    if (entry.count >= limit.count) {
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Generate notification ID
   */
  private generateId(): string {
    return `notif_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Get template engine
   */
  getTemplateEngine(): TemplateEngine {
    return this.templateEngine;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

let defaultService: NotificationService | undefined;

/**
 * Get or create default notification service
 */
export function getNotificationService(config?: NotificationServiceConfig): NotificationService {
  if (!defaultService) {
    defaultService = new NotificationService(config);
  }
  return defaultService;
}

/**
 * Create a new notification service
 */
export function createNotificationService(config?: NotificationServiceConfig): NotificationService {
  return new NotificationService(config);
}
