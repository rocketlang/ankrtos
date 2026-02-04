/**
 * GraphQL Subscriptions for Real-Time Features
 * - AIS position updates
 * - Voyage alerts
 * - Notifications
 * - Port congestion updates
 */

import { builder } from './builder.js';
import { Repeater } from '@repeaterjs/repeater';
import { EventEmitter } from 'events';

// Global event bus for real-time events
export const realtimeEvents = new EventEmitter();
realtimeEvents.setMaxListeners(100); // Support many concurrent subscriptions

// ============================================================================
// SUBSCRIPTION: Vessel Position Updates
// ============================================================================

builder.subscriptionField('vesselPositionUpdates', (t) =>
  t.field({
    type: 'VesselPosition',
    args: {
      vesselId: t.arg.string({ required: false }),
      imo: t.arg.string({ required: false }),
    },
    description: 'Subscribe to real-time vessel position updates from AIS feed',
    subscribe: (_root, args) => {
      return new Repeater(async (push, stop) => {
        const handler = (position: any) => {
          // Filter by vessel if specified
          if (args.vesselId && position.vesselId !== args.vesselId) return;
          if (args.imo && position.imo !== args.imo) return;

          push(position);
        };

        realtimeEvents.on('vessel:position', handler);
        await stop;
        realtimeEvents.off('vessel:position', handler);
      });
    },
    resolve: (position) => position,
  })
);

// ============================================================================
// SUBSCRIPTION: Fleet Position Updates
// ============================================================================

builder.subscriptionField('fleetPositionUpdates', (t) =>
  t.field({
    type: ['VesselPosition'],
    args: {
      organizationId: t.arg.string({ required: false }),
      vesselType: t.arg.string({ required: false }),
    },
    description: 'Subscribe to position updates for all vessels in fleet',
    subscribe: (_root, args) => {
      return new Repeater(async (push, stop) => {
        const batchBuffer: any[] = [];
        let batchTimeout: NodeJS.Timeout | null = null;

        const handler = (position: any) => {
          // Filter by organization if specified
          if (args.organizationId && position.organizationId !== args.organizationId) return;
          if (args.vesselType && position.vesselType !== args.vesselType) return;

          // Batch positions to reduce network traffic
          batchBuffer.push(position);

          if (!batchTimeout) {
            batchTimeout = setTimeout(() => {
              if (batchBuffer.length > 0) {
                push([...batchBuffer]);
                batchBuffer.length = 0;
              }
              batchTimeout = null;
            }, 2000); // Send batch every 2 seconds
          }
        };

        realtimeEvents.on('vessel:position', handler);
        await stop;
        if (batchTimeout) clearTimeout(batchTimeout);
        realtimeEvents.off('vessel:position', handler);
      });
    },
    resolve: (positions) => positions,
  })
);

// ============================================================================
// SUBSCRIPTION: Voyage Alerts
// ============================================================================

builder.subscriptionField('voyageAlerts', (t) =>
  t.field({
    type: 'DelayAlert',
    args: {
      voyageId: t.arg.string({ required: false }),
      severity: t.arg.string({ required: false }),
    },
    description: 'Subscribe to real-time voyage alerts (delays, deviations, congestion)',
    subscribe: (_root, args) => {
      return new Repeater(async (push, stop) => {
        const handler = (alert: any) => {
          if (args.voyageId && alert.voyageId !== args.voyageId) return;
          if (args.severity && alert.severity !== args.severity) return;

          push(alert);
        };

        realtimeEvents.on('voyage:alert', handler);
        await stop;
        realtimeEvents.off('voyage:alert', handler);
      });
    },
    resolve: (alert) => alert,
  })
);

// ============================================================================
// SUBSCRIPTION: Notifications
// ============================================================================

builder.subscriptionField('notifications', (t) =>
  t.field({
    type: 'Notification',
    args: {
      userId: t.arg.string({ required: true }),
      priority: t.arg.string({ required: false }),
    },
    description: 'Subscribe to real-time user notifications',
    subscribe: (_root, args) => {
      return new Repeater(async (push, stop) => {
        const handler = (notification: any) => {
          if (notification.userId !== args.userId) return;
          if (args.priority && notification.priority !== args.priority) return;

          push(notification);
        };

        realtimeEvents.on('notification:new', handler);
        await stop;
        realtimeEvents.off('notification:new', handler);
      });
    },
    resolve: (notification) => notification,
  })
);

// ============================================================================
// SUBSCRIPTION: Port Congestion Updates
// ============================================================================

builder.subscriptionField('portCongestionUpdates', (t) =>
  t.field({
    type: 'PortCongestion',
    args: {
      portId: t.arg.string({ required: false }),
      minWaitHours: t.arg.float({ required: false }),
    },
    description: 'Subscribe to real-time port congestion updates',
    subscribe: (_root, args) => {
      return new Repeater(async (push, stop) => {
        const handler = (congestion: any) => {
          if (args.portId && congestion.portId !== args.portId) return;
          if (args.minWaitHours && congestion.avgWaitHours < args.minWaitHours) return;

          push(congestion);
        };

        realtimeEvents.on('port:congestion', handler);
        await stop;
        realtimeEvents.off('port:congestion', handler);
      });
    },
    resolve: (congestion) => congestion,
  })
);

// ============================================================================
// SUBSCRIPTION: Geofence Alerts
// ============================================================================

builder.subscriptionField('geofenceAlerts', (t) =>
  t.field({
    type: 'GeofenceAlert',
    args: {
      vesselId: t.arg.string({ required: false }),
      geofenceId: t.arg.string({ required: false }),
    },
    description: 'Subscribe to real-time geofence entry/exit alerts',
    subscribe: (_root, args) => {
      return new Repeater(async (push, stop) => {
        const handler = (alert: any) => {
          if (args.vesselId && alert.vesselId !== args.vesselId) return;
          if (args.geofenceId && alert.geofenceId !== args.geofenceId) return;

          push(alert);
        };

        realtimeEvents.on('geofence:alert', handler);
        await stop;
        realtimeEvents.off('geofence:alert', handler);
      });
    },
    resolve: (alert) => alert,
  })
);

// ============================================================================
// Helper Functions to Publish Events
// ============================================================================

export function publishVesselPosition(position: any) {
  realtimeEvents.emit('vessel:position', position);
}

export function publishVoyageAlert(alert: any) {
  realtimeEvents.emit('voyage:alert', alert);
}

export function publishNotification(notification: any) {
  realtimeEvents.emit('notification:new', notification);
}

export function publishPortCongestion(congestion: any) {
  realtimeEvents.emit('port:congestion', congestion);
}

export function publishGeofenceAlert(alert: any) {
  realtimeEvents.emit('geofence:alert', alert);
}
