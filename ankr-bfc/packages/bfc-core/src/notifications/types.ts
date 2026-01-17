/**
 * Notification Types - BFC Platform
 */

export enum NotificationChannel {
  PUSH = 'push',
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
  WEBHOOK = 'webhook',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationCategory {
  // Customer facing
  OFFER = 'offer',
  ACCOUNT = 'account',
  TRANSACTION = 'transaction',
  KYC = 'kyc',
  LOAN = 'loan',
  PAYMENT_REMINDER = 'payment_reminder',

  // Staff facing
  TASK = 'task',
  APPROVAL = 'approval',
  ALERT = 'alert',
  COMPLIANCE = 'compliance',
  RISK = 'risk',
  SYSTEM = 'system',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

export interface NotificationRecipient {
  userId: string;
  role?: string;
  channel: NotificationChannel;
  address?: string; // email, phone, device token
  metadata?: Record<string, unknown>;
}

export interface NotificationPayload {
  id: string;
  templateId?: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  imageUrl?: string;
  actionUrl?: string;
  actions?: NotificationAction[];
  expiresAt?: Date;
  scheduledAt?: Date;
}

export interface NotificationAction {
  id: string;
  label: string;
  url?: string;
  primary?: boolean;
}

export interface Notification extends NotificationPayload {
  recipientId: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedReason?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  category: NotificationCategory;
  channels: NotificationChannel[];
  titleTemplate: string;
  bodyTemplate: string;
  variables: string[];
  requiredPermission?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreference {
  userId: string;
  channel: NotificationChannel;
  category: NotificationCategory;
  enabled: boolean;
  quietHoursStart?: string; // HH:mm
  quietHoursEnd?: string;
}

export interface BulkNotificationRequest {
  templateId: string;
  recipients: NotificationRecipient[];
  variables: Record<string, unknown>;
  scheduledAt?: Date;
  priority?: NotificationPriority;
}

export interface NotificationAuditLog {
  id: string;
  notificationId: string;
  action: 'created' | 'sent' | 'delivered' | 'read' | 'failed' | 'retried';
  actorId: string;
  actorRole: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  ipAddress?: string;
}
