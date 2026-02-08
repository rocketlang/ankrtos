/**
 * VESSEL ALERTS & NOTIFICATIONS
 * Automated alerts for vessel status changes and issues
 */

import { builder } from '../builder.js';
import { prisma } from '../../lib/prisma.js';
import { HybridVesselTracker } from '../../services/hybrid-vessel-tracker.js';

// Alert Type Enum
const VesselAlertType = builder.enumType('VesselAlertType', {
  values: [
    'STATUS_CHANGE',
    'QUALITY_DROP',
    'AIS_DARK_ZONE',
    'PORT_ARRIVAL',
    'PORT_DEPARTURE',
    'ROUTE_DEVIATION',
    'SPEED_ANOMALY',
    'UNKNOWN_STATUS',
  ] as const,
});

// Alert Severity
const AlertSeverity = builder.enumType('AlertSeverity', {
  values: ['INFO', 'WARNING', 'CRITICAL'] as const,
});

// Vessel Alert
const VesselAlert = builder.objectRef<{
  id: string;
  mmsi: string;
  vesselName: string | null;
  type: string;
  severity: string;
  message: string;
  timestamp: Date;
  read: boolean;
  metadata?: any;
}>('VesselAlert').implement({
  fields: (t) => ({
    id: t.exposeString('id'),
    mmsi: t.exposeString('mmsi'),
    vesselName: t.exposeString('vesselName', { nullable: true }),
    type: t.expose('type', { type: VesselAlertType }),
    severity: t.expose('severity', { type: AlertSeverity }),
    message: t.exposeString('message'),
    timestamp: t.expose('timestamp', { type: 'DateTime' }),
    read: t.exposeBoolean('read'),
    metadata: t.field({
      type: 'JSON',
      nullable: true,
      resolve: (parent) => parent.metadata || null,
    }),
  }),
});

// Alert Statistics
const VesselAlertStats = builder.objectRef<{
  total: number;
  unread: number;
  critical: number;
  warning: number;
  info: number;
  byType: Record<string, number>;
}>('VesselAlertStats').implement({
  fields: (t) => ({
    total: t.exposeInt('total'),
    unread: t.exposeInt('unread'),
    critical: t.exposeInt('critical'),
    warning: t.exposeInt('warning'),
    info: t.exposeInt('info'),
    byType: t.field({
      type: 'JSON',
      resolve: (parent) => parent.byType,
    }),
  }),
});

// In-memory alert storage (in production, use database)
const alerts: Map<string, any> = new Map();
let alertIdCounter = 1;

// Helper to create alert
function createAlert(
  mmsi: string,
  vesselName: string | null,
  type: string,
  severity: string,
  message: string,
  metadata?: any
) {
  const alert = {
    id: `alert-${alertIdCounter++}`,
    mmsi,
    vesselName,
    type,
    severity,
    message,
    timestamp: new Date(),
    read: false,
    metadata,
  };
  alerts.set(alert.id, alert);
  console.log(`[Alert] ${severity}: ${message} (${mmsi})`);
  return alert;
}

/**
 * Get alerts for a specific vessel or all vessels
 */
builder.queryField('vesselAlerts', (t) =>
  t.field({
    type: [VesselAlert],
    description: 'Get vessel alerts',
    args: {
      mmsi: t.arg.string({ required: false }),
      type: t.arg({ type: VesselAlertType, required: false }),
      severity: t.arg({ type: AlertSeverity, required: false }),
      unreadOnly: t.arg.boolean({ required: false, defaultValue: false }),
      limit: t.arg.int({ required: false, defaultValue: 50 }),
    },
    resolve: async (_root, args) => {
      let filtered = Array.from(alerts.values());

      if (args.mmsi) {
        filtered = filtered.filter(a => a.mmsi === args.mmsi);
      }

      if (args.type) {
        filtered = filtered.filter(a => a.type === args.type);
      }

      if (args.severity) {
        filtered = filtered.filter(a => a.severity === args.severity);
      }

      if (args.unreadOnly) {
        filtered = filtered.filter(a => !a.read);
      }

      // Sort by timestamp descending
      filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return filtered.slice(0, args.limit);
    },
  })
);

/**
 * Get alert statistics
 */
builder.queryField('vesselAlertStats', (t) =>
  t.field({
    type: VesselAlertStats,
    description: 'Get vessel alert statistics',
    resolve: async (_root) => {
      const allAlerts = Array.from(alerts.values());

      const stats = {
        total: allAlerts.length,
        unread: allAlerts.filter(a => !a.read).length,
        critical: allAlerts.filter(a => a.severity === 'CRITICAL').length,
        warning: allAlerts.filter(a => a.severity === 'WARNING').length,
        info: allAlerts.filter(a => a.severity === 'INFO').length,
        byType: {} as Record<string, number>,
      };

      // Count by type
      allAlerts.forEach(alert => {
        stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
      });

      return stats;
    },
  })
);

/**
 * Mark alert as read
 */
builder.mutationField('markAlertRead', (t) =>
  t.field({
    type: VesselAlert,
    args: {
      alertId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args) => {
      const alert = alerts.get(args.alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }
      alert.read = true;
      return alert;
    },
  })
);

/**
 * Mark all alerts as read
 */
builder.mutationField('markAllAlertsRead', (t) =>
  t.field({
    type: 'Int',
    resolve: async (_root) => {
      let count = 0;
      alerts.forEach(alert => {
        if (!alert.read) {
          alert.read = true;
          count++;
        }
      });
      return count;
    },
  })
);

/**
 * Check vessel status and generate alerts
 * This would be called periodically (e.g., via cron job)
 */
builder.mutationField('checkVesselAlerts', (t) =>
  t.field({
    type: [VesselAlert],
    description: 'Check vessels and generate alerts for status changes',
    args: {
      mmsi: t.arg.string({ required: false }),
    },
    resolve: async (_root, args) => {
      const newAlerts: any[] = [];
      const tracker = new HybridVesselTracker();

      // Get vessels to check
      const vessels = await prisma.vessel.findMany({
        where: args.mmsi ? { mmsi: args.mmsi } : {},
        take: args.mmsi ? 1 : 20, // Limit to avoid overwhelming system
        select: { mmsi: true, name: true },
      });

      for (const vessel of vessels) {
        try {
          const status = await tracker.getVesselStatus(vessel.mmsi);

          // Check for UNKNOWN status
          if (status.status === 'UNKNOWN') {
            const alert = createAlert(
              vessel.mmsi,
              vessel.name,
              'UNKNOWN_STATUS',
              'WARNING',
              `Vessel ${vessel.name || vessel.mmsi} has unknown status - no recent tracking data`,
              { quality: status.quality }
            );
            newAlerts.push(alert);
          }

          // Check for quality drop
          if (status.quality < 0.5 && status.quality > 0) {
            const alert = createAlert(
              vessel.mmsi,
              vessel.name,
              'QUALITY_DROP',
              'WARNING',
              `Vessel ${vessel.name || vessel.mmsi} tracking quality dropped to ${(status.quality * 100).toFixed(0)}%`,
              { quality: status.quality, source: status.source }
            );
            newAlerts.push(alert);
          }

          // Check for AIS dark zone (IN_TRANSIT with estimated position)
          if (status.status === 'IN_TRANSIT' && status.source === 'ESTIMATED') {
            const alert = createAlert(
              vessel.mmsi,
              vessel.name,
              'AIS_DARK_ZONE',
              'INFO',
              `Vessel ${vessel.name || vessel.mmsi} is in AIS dark zone - using estimated position`,
              {
                estimatedPosition: status.estimated?.position,
                confidence: status.estimated?.confidence
              }
            );
            newAlerts.push(alert);
          }

          // Check for port arrival
          if (status.status === 'AT_PORT' && status.port) {
            const alert = createAlert(
              vessel.mmsi,
              vessel.name,
              'PORT_ARRIVAL',
              'INFO',
              `Vessel ${vessel.name || vessel.mmsi} arrived at ${status.port.name}`,
              {
                port: status.port.name,
                arrival: status.port.arrival
              }
            );
            newAlerts.push(alert);
          }

          // Small delay to avoid overwhelming system
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.error(`[Alert Check] Error checking ${vessel.mmsi}:`, error);
        }
      }

      console.log(`[Alert Check] Generated ${newAlerts.length} new alerts`);
      return newAlerts;
    },
  })
);

/**
 * Clear old alerts
 */
builder.mutationField('clearOldAlerts', (t) =>
  t.field({
    type: 'Int',
    description: 'Clear alerts older than specified days',
    args: {
      days: t.arg.int({ required: false, defaultValue: 7 }),
    },
    resolve: async (_root, args) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - args.days);

      let count = 0;
      alerts.forEach((alert, id) => {
        if (alert.timestamp < cutoffDate) {
          alerts.delete(id);
          count++;
        }
      });

      console.log(`[Alerts] Cleared ${count} old alerts (older than ${args.days} days)`);
      return count;
    },
  })
);
