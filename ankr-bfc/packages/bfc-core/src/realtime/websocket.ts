/**
 * WebSocket Real-time Service - BFC Platform
 *
 * Real-time notifications, updates, and collaboration
 */

import { EventEmitter } from 'events';
import { logger } from '../observability/logger';
import { Role } from '../notifications/rbac';

// =============================================================================
// TYPES
// =============================================================================

export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: Date;
  correlationId?: string;
}

export interface ConnectionInfo {
  connectionId: string;
  userId: string;
  role: Role;
  deviceType: 'web' | 'mobile' | 'api';
  connectedAt: Date;
  lastActivityAt: Date;
  subscriptions: Set<string>;
  metadata?: Record<string, unknown>;
}

export interface PresenceInfo {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  activeConnections: number;
  currentScreen?: string;
}

export interface BroadcastOptions {
  channel?: string;
  roles?: Role[];
  userIds?: string[];
  excludeUserIds?: string[];
  branchCode?: string;
}

// Message types
export enum MessageType {
  // Connection
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  PING = 'ping',
  PONG = 'pong',

  // Subscriptions
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',

  // Notifications
  NOTIFICATION = 'notification',
  NOTIFICATION_READ = 'notification_read',

  // Presence
  PRESENCE_UPDATE = 'presence_update',
  PRESENCE_QUERY = 'presence_query',

  // Data updates
  CUSTOMER_UPDATE = 'customer_update',
  APPLICATION_UPDATE = 'application_update',
  OFFER_UPDATE = 'offer_update',
  TASK_UPDATE = 'task_update',
  ALERT = 'alert',

  // Collaboration
  SCREEN_SHARE_START = 'screen_share_start',
  SCREEN_SHARE_END = 'screen_share_end',
  CURSOR_POSITION = 'cursor_position',

  // Staff specific
  QUEUE_UPDATE = 'queue_update',
  ASSIGNMENT = 'assignment',
  APPROVAL_REQUEST = 'approval_request',
  APPROVAL_RESPONSE = 'approval_response',
}

// =============================================================================
// WEBSOCKET SERVICE
// =============================================================================

export class WebSocketService extends EventEmitter {
  private connections: Map<string, ConnectionInfo> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();
  private channels: Map<string, Set<string>> = new Map();
  private presence: Map<string, PresenceInfo> = new Map();

  // Mock WebSocket server (in production, use ws or socket.io)
  private mockClients: Map<string, { send: (data: string) => void }> = new Map();

  constructor() {
    super();
    this.setupHeartbeat();
  }

  /**
   * Handle new connection
   */
  handleConnection(
    connectionId: string,
    userId: string,
    role: Role,
    deviceType: 'web' | 'mobile' | 'api',
    client: { send: (data: string) => void },
    metadata?: Record<string, unknown>
  ): void {
    const info: ConnectionInfo = {
      connectionId,
      userId,
      role,
      deviceType,
      connectedAt: new Date(),
      lastActivityAt: new Date(),
      subscriptions: new Set(),
      metadata,
    };

    this.connections.set(connectionId, info);
    this.mockClients.set(connectionId, client);

    // Track user connections
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(connectionId);

    // Update presence
    this.updatePresence(userId, 'online');

    // Auto-subscribe to user channel
    this.subscribe(connectionId, `user:${userId}`);

    // Auto-subscribe to role channel
    this.subscribe(connectionId, `role:${role}`);

    logger.info('WebSocket connected', { connectionId, userId, role, deviceType });

    // Send welcome message
    this.sendToConnection(connectionId, {
      type: MessageType.CONNECT,
      payload: {
        connectionId,
        serverTime: new Date(),
        subscriptions: Array.from(info.subscriptions),
      },
      timestamp: new Date(),
    });

    this.emit('connection', info);
  }

  /**
   * Handle disconnection
   */
  handleDisconnection(connectionId: string): void {
    const info = this.connections.get(connectionId);
    if (!info) return;

    // Remove from channels
    for (const channel of info.subscriptions) {
      this.channels.get(channel)?.delete(connectionId);
    }

    // Remove from user connections
    this.userConnections.get(info.userId)?.delete(connectionId);

    // Update presence if no more connections
    if (this.userConnections.get(info.userId)?.size === 0) {
      this.updatePresence(info.userId, 'offline');
      this.userConnections.delete(info.userId);
    }

    this.connections.delete(connectionId);
    this.mockClients.delete(connectionId);

    logger.info('WebSocket disconnected', { connectionId, userId: info.userId });

    this.emit('disconnection', info);
  }

  /**
   * Handle incoming message
   */
  handleMessage(connectionId: string, message: WebSocketMessage): void {
    const info = this.connections.get(connectionId);
    if (!info) return;

    info.lastActivityAt = new Date();

    switch (message.type) {
      case MessageType.PING:
        this.sendToConnection(connectionId, {
          type: MessageType.PONG,
          payload: { timestamp: new Date() },
          timestamp: new Date(),
        });
        break;

      case MessageType.SUBSCRIBE:
        const subscribeChannels = message.payload as string[];
        subscribeChannels.forEach((channel) => this.subscribe(connectionId, channel));
        break;

      case MessageType.UNSUBSCRIBE:
        const unsubscribeChannels = message.payload as string[];
        unsubscribeChannels.forEach((channel) => this.unsubscribe(connectionId, channel));
        break;

      case MessageType.PRESENCE_UPDATE:
        const presencePayload = message.payload as { status: PresenceInfo['status']; currentScreen?: string };
        this.updatePresence(info.userId, presencePayload.status, presencePayload.currentScreen);
        break;

      case MessageType.PRESENCE_QUERY:
        const queryUserIds = message.payload as string[];
        const presenceResults = queryUserIds.map((uid) => this.presence.get(uid)).filter(Boolean);
        this.sendToConnection(connectionId, {
          type: MessageType.PRESENCE_QUERY,
          payload: presenceResults,
          timestamp: new Date(),
          correlationId: message.correlationId,
        });
        break;

      case MessageType.NOTIFICATION_READ:
        this.emit('notification:read', { userId: info.userId, notificationId: message.payload });
        break;

      default:
        this.emit('message', { connectionId, userId: info.userId, message });
    }
  }

  /**
   * Subscribe to channel
   */
  subscribe(connectionId: string, channel: string): void {
    const info = this.connections.get(connectionId);
    if (!info) return;

    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }

    this.channels.get(channel)!.add(connectionId);
    info.subscriptions.add(channel);

    logger.debug('Subscribed to channel', { connectionId, channel });
  }

  /**
   * Unsubscribe from channel
   */
  unsubscribe(connectionId: string, channel: string): void {
    const info = this.connections.get(connectionId);
    if (!info) return;

    this.channels.get(channel)?.delete(connectionId);
    info.subscriptions.delete(channel);

    logger.debug('Unsubscribed from channel', { connectionId, channel });
  }

  /**
   * Send to specific connection
   */
  sendToConnection(connectionId: string, message: WebSocketMessage): boolean {
    const client = this.mockClients.get(connectionId);
    if (!client) return false;

    try {
      client.send(JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error('Failed to send to connection', { connectionId, error });
      return false;
    }
  }

  /**
   * Send to specific user (all connections)
   */
  sendToUser(userId: string, message: WebSocketMessage): number {
    const connectionIds = this.userConnections.get(userId);
    if (!connectionIds) return 0;

    let sent = 0;
    for (const connectionId of connectionIds) {
      if (this.sendToConnection(connectionId, message)) {
        sent++;
      }
    }

    return sent;
  }

  /**
   * Broadcast to channel
   */
  broadcastToChannel(channel: string, message: WebSocketMessage): number {
    const connectionIds = this.channels.get(channel);
    if (!connectionIds) return 0;

    let sent = 0;
    for (const connectionId of connectionIds) {
      if (this.sendToConnection(connectionId, message)) {
        sent++;
      }
    }

    logger.debug('Broadcast to channel', { channel, sent, total: connectionIds.size });
    return sent;
  }

  /**
   * Broadcast with options
   */
  broadcast(message: WebSocketMessage, options: BroadcastOptions = {}): number {
    let targetConnections = new Set<string>();

    // Channel filter
    if (options.channel) {
      const channelConnections = this.channels.get(options.channel);
      if (channelConnections) {
        channelConnections.forEach((c) => targetConnections.add(c));
      }
    } else {
      // All connections
      this.connections.forEach((_, connectionId) => targetConnections.add(connectionId));
    }

    // Role filter
    if (options.roles && options.roles.length > 0) {
      targetConnections = new Set(
        Array.from(targetConnections).filter((connectionId) => {
          const info = this.connections.get(connectionId);
          return info && options.roles!.includes(info.role);
        })
      );
    }

    // User filter
    if (options.userIds && options.userIds.length > 0) {
      targetConnections = new Set(
        Array.from(targetConnections).filter((connectionId) => {
          const info = this.connections.get(connectionId);
          return info && options.userIds!.includes(info.userId);
        })
      );
    }

    // Exclude users
    if (options.excludeUserIds && options.excludeUserIds.length > 0) {
      targetConnections = new Set(
        Array.from(targetConnections).filter((connectionId) => {
          const info = this.connections.get(connectionId);
          return info && !options.excludeUserIds!.includes(info.userId);
        })
      );
    }

    // Branch filter
    if (options.branchCode) {
      targetConnections = new Set(
        Array.from(targetConnections).filter((connectionId) => {
          const info = this.connections.get(connectionId);
          return info && info.metadata?.branchCode === options.branchCode;
        })
      );
    }

    let sent = 0;
    for (const connectionId of targetConnections) {
      if (this.sendToConnection(connectionId, message)) {
        sent++;
      }
    }

    return sent;
  }

  // ===========================================================================
  // NOTIFICATION HELPERS
  // ===========================================================================

  /**
   * Send notification to user
   */
  sendNotification(
    userId: string,
    notification: {
      id: string;
      title: string;
      body: string;
      category: string;
      priority: string;
      data?: Record<string, unknown>;
      actionUrl?: string;
    }
  ): number {
    return this.sendToUser(userId, {
      type: MessageType.NOTIFICATION,
      payload: notification,
      timestamp: new Date(),
    });
  }

  /**
   * Send alert to roles
   */
  sendAlert(
    alert: {
      id: string;
      type: string;
      severity: string;
      title: string;
      description: string;
      entityType?: string;
      entityId?: string;
    },
    roles: Role[]
  ): number {
    return this.broadcast(
      {
        type: MessageType.ALERT,
        payload: alert,
        timestamp: new Date(),
      },
      { roles }
    );
  }

  /**
   * Send customer update
   */
  sendCustomerUpdate(
    customerId: string,
    update: Record<string, unknown>,
    subscribedUserIds?: string[]
  ): number {
    return this.broadcastToChannel(`customer:${customerId}`, {
      type: MessageType.CUSTOMER_UPDATE,
      payload: { customerId, ...update },
      timestamp: new Date(),
    });
  }

  /**
   * Send task update
   */
  sendTaskUpdate(
    assigneeId: string,
    task: {
      id: string;
      type: string;
      status: string;
      title: string;
      priority: string;
    }
  ): number {
    return this.sendToUser(assigneeId, {
      type: MessageType.TASK_UPDATE,
      payload: task,
      timestamp: new Date(),
    });
  }

  /**
   * Send approval request
   */
  sendApprovalRequest(
    approverId: string,
    request: {
      id: string;
      type: string;
      title: string;
      requesterId: string;
      requesterName: string;
      details: Record<string, unknown>;
    }
  ): number {
    return this.sendToUser(approverId, {
      type: MessageType.APPROVAL_REQUEST,
      payload: request,
      timestamp: new Date(),
    });
  }

  // ===========================================================================
  // PRESENCE
  // ===========================================================================

  /**
   * Update user presence
   */
  updatePresence(userId: string, status: PresenceInfo['status'], currentScreen?: string): void {
    const existing = this.presence.get(userId);
    const connectionCount = this.userConnections.get(userId)?.size || 0;

    const info: PresenceInfo = {
      userId,
      status: connectionCount > 0 ? status : 'offline',
      lastSeen: new Date(),
      activeConnections: connectionCount,
      currentScreen: currentScreen || existing?.currentScreen,
    };

    this.presence.set(userId, info);

    // Broadcast presence update to interested parties
    this.broadcastToChannel(`presence:${userId}`, {
      type: MessageType.PRESENCE_UPDATE,
      payload: info,
      timestamp: new Date(),
    });
  }

  /**
   * Get user presence
   */
  getPresence(userId: string): PresenceInfo | undefined {
    return this.presence.get(userId);
  }

  /**
   * Get online users
   */
  getOnlineUsers(options?: { role?: Role; branchCode?: string }): PresenceInfo[] {
    const online: PresenceInfo[] = [];

    for (const [userId, info] of this.presence) {
      if (info.status === 'offline') continue;

      if (options?.role) {
        // Check if any connection has the role
        const userConnections = this.userConnections.get(userId);
        if (!userConnections) continue;

        let hasRole = false;
        for (const connId of userConnections) {
          const connInfo = this.connections.get(connId);
          if (connInfo?.role === options.role) {
            hasRole = true;
            break;
          }
        }
        if (!hasRole) continue;
      }

      if (options?.branchCode) {
        const userConnections = this.userConnections.get(userId);
        if (!userConnections) continue;

        let hasBranch = false;
        for (const connId of userConnections) {
          const connInfo = this.connections.get(connId);
          if (connInfo?.metadata?.branchCode === options.branchCode) {
            hasBranch = true;
            break;
          }
        }
        if (!hasBranch) continue;
      }

      online.push(info);
    }

    return online;
  }

  // ===========================================================================
  // STATS
  // ===========================================================================

  /**
   * Get connection stats
   */
  getStats(): {
    totalConnections: number;
    uniqueUsers: number;
    byDeviceType: Record<string, number>;
    byRole: Record<string, number>;
    channels: number;
  } {
    const byDeviceType: Record<string, number> = {};
    const byRole: Record<string, number> = {};

    for (const info of this.connections.values()) {
      byDeviceType[info.deviceType] = (byDeviceType[info.deviceType] || 0) + 1;
      byRole[info.role] = (byRole[info.role] || 0) + 1;
    }

    return {
      totalConnections: this.connections.size,
      uniqueUsers: this.userConnections.size,
      byDeviceType,
      byRole,
      channels: this.channels.size,
    };
  }

  // ===========================================================================
  // PRIVATE
  // ===========================================================================

  /**
   * Setup heartbeat to clean stale connections
   */
  private setupHeartbeat(): void {
    setInterval(() => {
      const now = Date.now();
      const staleThreshold = 60000; // 1 minute

      for (const [connectionId, info] of this.connections) {
        if (now - info.lastActivityAt.getTime() > staleThreshold) {
          logger.warn('Removing stale connection', { connectionId, userId: info.userId });
          this.handleDisconnection(connectionId);
        }
      }
    }, 30000); // Check every 30 seconds
  }
}

// Export singleton
export const wsService = new WebSocketService();
