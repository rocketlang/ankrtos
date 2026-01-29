// Congestion & Hotspot types for ankrICD
// Real-time congestion detection and traffic management

import type { UUID, AuditFields, TenantEntity } from './common';

// ============================================================================
// CONGESTION ZONE
// ============================================================================

export type CongestionZoneType =
  | 'yard_block'
  | 'gate'
  | 'rail_siding'
  | 'berth'
  | 'cfs_area'
  | 'equipment_staging'
  | 'truck_parking'
  | 'customs_area';

export type CongestionLevel =
  | 'low'            // 0–50% utilization
  | 'moderate'       // 50–75%
  | 'high'           // 75–90%
  | 'critical';      // >90%

export interface CongestionZone extends AuditFields, TenantEntity {
  id: UUID;
  code: string;
  name: string;
  zoneType: CongestionZoneType;
  referenceId?: UUID;              // Link to YardBlock, Gate, Track, Berth, etc.

  // Thresholds
  warningThreshold: number;        // % at which warning triggers (default 75)
  criticalThreshold: number;       // % at which critical triggers (default 90)
  maxCapacity: number;             // Max units (TEU, vehicles, etc.)

  // Current state
  currentOccupancy: number;
  occupancyPercent: number;
  congestionLevel: CongestionLevel;
  lastReadingAt?: Date;

  // Configuration
  enabled: boolean;
  monitoringIntervalSec: number;   // How often to check (default 300)
}

// ============================================================================
// CONGESTION READING (Time-series data)
// ============================================================================

export interface CongestionReading extends TenantEntity {
  id: UUID;
  zoneId: UUID;
  timestamp: Date;
  occupancy: number;
  occupancyPercent: number;
  congestionLevel: CongestionLevel;

  // Context
  equipmentCount?: number;         // Equipment in the zone
  vehicleCount?: number;           // Vehicles in the zone
  containerCount?: number;         // Containers in the zone
  queueLength?: number;            // For gate zones
  averageWaitMinutes?: number;     // For gate/rail zones
}

// ============================================================================
// CONGESTION ALERT
// ============================================================================

export type CongestionAlertSeverity = 'warning' | 'critical' | 'resolved';

export interface CongestionAlert extends AuditFields, TenantEntity {
  id: UUID;
  zoneId: UUID;
  zoneName: string;
  zoneType: CongestionZoneType;
  severity: CongestionAlertSeverity;

  occupancyPercent: number;
  threshold: number;               // The threshold that was breached
  message: string;

  // Acknowledgement
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;

  // Resolution
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
}

// ============================================================================
// TRAFFIC CONTROL
// ============================================================================

export type TrafficActionType =
  | 'redirect_equipment'
  | 'balance_gate_lanes'
  | 'throttle_operations'
  | 'priority_queue'
  | 'manual_override';

export interface TrafficAction extends AuditFields, TenantEntity {
  id: UUID;
  zoneId: UUID;
  actionType: TrafficActionType;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';

  // Auto vs manual
  isAutomatic: boolean;
  triggeredBy?: string;            // Alert ID or user ID
  executedBy?: string;

  // Effect
  startedAt?: Date;
  completedAt?: Date;
  effectivenessScore?: number;     // 0-100 how effective the action was
}

// ============================================================================
// CONGESTION STATS
// ============================================================================

export interface CongestionStats {
  tenantId: string;
  date: Date;

  totalZones: number;
  monitoredZones: number;
  zonesAtWarning: number;
  zonesAtCritical: number;
  zonesNormal: number;

  activeAlerts: number;
  unacknowledgedAlerts: number;
  alertsToday: number;
  alertsResolved: number;

  averageOccupancyPercent: number;
  peakOccupancyPercent: number;
  peakZoneName?: string;

  activeTrafficActions: number;
  actionsToday: number;
}
