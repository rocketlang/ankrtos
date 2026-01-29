// Congestion Detection Engine for ankrICD
// Real-time zone congestion monitoring, alerting, and traffic control

import { v4 as uuidv4 } from 'uuid';
import type { UUID, OperationResult } from '../types/common';
import type {
  CongestionZone,
  CongestionZoneType,
  CongestionLevel,
  CongestionReading,
  CongestionAlert,
  CongestionAlertSeverity,
  TrafficAction,
  TrafficActionType,
  CongestionStats,
} from '../types/congestion';
import { emit } from '../core';

// ============================================================================
// CONGESTION ENGINE
// ============================================================================

export class CongestionEngine {
  private static instance: CongestionEngine | null = null;

  private zones: Map<UUID, CongestionZone> = new Map();
  private readings: Map<UUID, CongestionReading> = new Map();
  private alerts: Map<UUID, CongestionAlert> = new Map();
  private actions: Map<UUID, TrafficAction> = new Map();

  // Indexes
  private zoneByCode: Map<string, UUID> = new Map(); // facilityId:code → zoneId
  private readingsByZone: Map<UUID, UUID[]> = new Map();
  private alertsByZone: Map<UUID, UUID[]> = new Map();
  private actionsByZone: Map<UUID, UUID[]> = new Map();

  private constructor() {}

  static getInstance(): CongestionEngine {
    if (!CongestionEngine.instance) {
      CongestionEngine.instance = new CongestionEngine();
    }
    return CongestionEngine.instance;
  }

  static resetInstance(): void {
    CongestionEngine.instance = null;
  }

  // ============================================================================
  // ZONE MANAGEMENT
  // ============================================================================

  registerZone(input: RegisterCongestionZoneInput): OperationResult<CongestionZone> {
    const key = `${input.facilityId}:${input.code}`;
    if (this.zoneByCode.has(key)) {
      return { success: false, error: 'Zone code already exists in this facility', errorCode: 'DUPLICATE_CODE' };
    }

    const now = new Date();
    const zone: CongestionZone = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      code: input.code,
      name: input.name,
      zoneType: input.zoneType,
      referenceId: input.referenceId,

      warningThreshold: input.warningThreshold ?? 75,
      criticalThreshold: input.criticalThreshold ?? 90,
      maxCapacity: input.maxCapacity,

      currentOccupancy: 0,
      occupancyPercent: 0,
      congestionLevel: 'low',

      enabled: input.enabled ?? true,
      monitoringIntervalSec: input.monitoringIntervalSec ?? 300,

      createdAt: now,
      updatedAt: now,
    };

    this.zones.set(zone.id, zone);
    this.zoneByCode.set(key, zone.id);
    this.readingsByZone.set(zone.id, []);
    this.alertsByZone.set(zone.id, []);
    this.actionsByZone.set(zone.id, []);

    return { success: true, data: zone };
  }

  getZone(id: UUID): CongestionZone | undefined {
    return this.zones.get(id);
  }

  getZoneByCode(facilityId: string, code: string): CongestionZone | undefined {
    const id = this.zoneByCode.get(`${facilityId}:${code}`);
    return id ? this.zones.get(id) : undefined;
  }

  listZones(tenantId?: string, zoneType?: CongestionZoneType): CongestionZone[] {
    let zones = Array.from(this.zones.values());
    if (tenantId) zones = zones.filter(z => z.tenantId === tenantId);
    if (zoneType) zones = zones.filter(z => z.zoneType === zoneType);
    return zones;
  }

  updateZoneThresholds(zoneId: UUID, warning: number, critical: number): OperationResult<CongestionZone> {
    const zone = this.zones.get(zoneId);
    if (!zone) return { success: false, error: 'Zone not found', errorCode: 'NOT_FOUND' };

    if (warning >= critical) {
      return { success: false, error: 'Warning threshold must be less than critical', errorCode: 'INVALID_THRESHOLDS' };
    }

    zone.warningThreshold = warning;
    zone.criticalThreshold = critical;
    zone.updatedAt = new Date();

    return { success: true, data: zone };
  }

  setZoneEnabled(zoneId: UUID, enabled: boolean): OperationResult<CongestionZone> {
    const zone = this.zones.get(zoneId);
    if (!zone) return { success: false, error: 'Zone not found', errorCode: 'NOT_FOUND' };

    zone.enabled = enabled;
    zone.updatedAt = new Date();

    return { success: true, data: zone };
  }

  // ============================================================================
  // OCCUPANCY READINGS
  // ============================================================================

  recordReading(input: RecordCongestionReadingInput): OperationResult<CongestionReading> {
    const zone = this.zones.get(input.zoneId);
    if (!zone) return { success: false, error: 'Zone not found', errorCode: 'NOT_FOUND' };

    if (!zone.enabled) {
      return { success: false, error: 'Zone monitoring is disabled', errorCode: 'ZONE_DISABLED' };
    }

    const now = new Date();
    const occupancyPercent = zone.maxCapacity > 0
      ? (input.occupancy / zone.maxCapacity) * 100
      : 0;
    const congestionLevel = this.calculateLevel(occupancyPercent, zone);

    const reading: CongestionReading = {
      id: uuidv4(),
      tenantId: zone.tenantId,
      facilityId: zone.facilityId,
      zoneId: zone.id,
      timestamp: now,
      occupancy: input.occupancy,
      occupancyPercent,
      congestionLevel,
      equipmentCount: input.equipmentCount,
      vehicleCount: input.vehicleCount,
      containerCount: input.containerCount,
      queueLength: input.queueLength,
      averageWaitMinutes: input.averageWaitMinutes,
    };

    this.readings.set(reading.id, reading);
    this.readingsByZone.get(zone.id)!.push(reading.id);

    // Update zone state
    const previousLevel = zone.congestionLevel;
    zone.currentOccupancy = input.occupancy;
    zone.occupancyPercent = occupancyPercent;
    zone.congestionLevel = congestionLevel;
    zone.lastReadingAt = now;
    zone.updatedAt = now;

    // Check if we need to trigger or resolve alerts
    this.evaluateAlerts(zone, occupancyPercent, previousLevel, congestionLevel);

    return { success: true, data: reading };
  }

  getReadingsByZone(zoneId: UUID, limit?: number): CongestionReading[] {
    const ids = this.readingsByZone.get(zoneId);
    if (!ids) return [];
    const readings = ids.map(id => this.readings.get(id)!).filter(Boolean);
    // Return newest first
    readings.reverse();
    return limit ? readings.slice(0, limit) : readings;
  }

  // ============================================================================
  // ALERTS
  // ============================================================================

  getAlert(id: UUID): CongestionAlert | undefined {
    return this.alerts.get(id);
  }

  getAlertsByZone(zoneId: UUID): CongestionAlert[] {
    const ids = this.alertsByZone.get(zoneId);
    if (!ids) return [];
    return ids.map(id => this.alerts.get(id)!).filter(Boolean);
  }

  getActiveAlerts(tenantId: string): CongestionAlert[] {
    return Array.from(this.alerts.values())
      .filter(a => a.tenantId === tenantId && !a.resolved);
  }

  getUnacknowledgedAlerts(tenantId: string): CongestionAlert[] {
    return Array.from(this.alerts.values())
      .filter(a => a.tenantId === tenantId && !a.acknowledged && !a.resolved);
  }

  acknowledgeAlert(alertId: UUID, acknowledgedBy: string): OperationResult<CongestionAlert> {
    const alert = this.alerts.get(alertId);
    if (!alert) return { success: false, error: 'Alert not found', errorCode: 'NOT_FOUND' };

    if (alert.acknowledged) {
      return { success: false, error: 'Alert already acknowledged', errorCode: 'ALREADY_ACKNOWLEDGED' };
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();
    alert.updatedAt = new Date();

    return { success: true, data: alert };
  }

  resolveAlert(alertId: UUID, resolvedBy: string, notes?: string): OperationResult<CongestionAlert> {
    const alert = this.alerts.get(alertId);
    if (!alert) return { success: false, error: 'Alert not found', errorCode: 'NOT_FOUND' };

    if (alert.resolved) {
      return { success: false, error: 'Alert already resolved', errorCode: 'ALREADY_RESOLVED' };
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;
    alert.resolutionNotes = notes;
    alert.updatedAt = new Date();

    return { success: true, data: alert };
  }

  // ============================================================================
  // TRAFFIC ACTIONS
  // ============================================================================

  createTrafficAction(input: CreateTrafficActionInput): OperationResult<TrafficAction> {
    const zone = this.zones.get(input.zoneId);
    if (!zone) return { success: false, error: 'Zone not found', errorCode: 'NOT_FOUND' };

    const now = new Date();
    const action: TrafficAction = {
      id: uuidv4(),
      tenantId: zone.tenantId,
      facilityId: zone.facilityId,
      zoneId: input.zoneId,
      actionType: input.actionType,
      description: input.description,
      status: 'pending',
      isAutomatic: input.isAutomatic ?? false,
      triggeredBy: input.triggeredBy,
      createdAt: now,
      updatedAt: now,
    };

    this.actions.set(action.id, action);
    this.actionsByZone.get(zone.id)?.push(action.id);

    emit('congestion.action_created', {
      actionId: action.id,
      zoneId: zone.id,
      actionType: input.actionType,
    }, { tenantId: zone.tenantId });

    return { success: true, data: action };
  }

  executeTrafficAction(actionId: UUID, executedBy: string): OperationResult<TrafficAction> {
    const action = this.actions.get(actionId);
    if (!action) return { success: false, error: 'Action not found', errorCode: 'NOT_FOUND' };

    if (action.status !== 'pending') {
      return { success: false, error: 'Action is not pending', errorCode: 'INVALID_STATUS' };
    }

    action.status = 'active';
    action.executedBy = executedBy;
    action.startedAt = new Date();
    action.updatedAt = new Date();

    return { success: true, data: action };
  }

  completeTrafficAction(actionId: UUID, effectivenessScore?: number): OperationResult<TrafficAction> {
    const action = this.actions.get(actionId);
    if (!action) return { success: false, error: 'Action not found', errorCode: 'NOT_FOUND' };

    if (action.status !== 'active') {
      return { success: false, error: 'Action is not active', errorCode: 'INVALID_STATUS' };
    }

    action.status = 'completed';
    action.completedAt = new Date();
    action.effectivenessScore = effectivenessScore;
    action.updatedAt = new Date();

    return { success: true, data: action };
  }

  getTrafficActionsByZone(zoneId: UUID, status?: string): TrafficAction[] {
    const ids = this.actionsByZone.get(zoneId);
    if (!ids) return [];
    let actions = ids.map(id => this.actions.get(id)!).filter(Boolean);
    if (status) actions = actions.filter(a => a.status === status);
    return actions;
  }

  // ============================================================================
  // CONGESTION MAP (All zones for a facility)
  // ============================================================================

  getCongestionMap(facilityId: string): CongestionZone[] {
    return Array.from(this.zones.values())
      .filter(z => z.facilityId === facilityId && z.enabled);
  }

  getHotspots(facilityId: string): CongestionZone[] {
    return this.getCongestionMap(facilityId)
      .filter(z => z.congestionLevel === 'high' || z.congestionLevel === 'critical')
      .sort((a, b) => b.occupancyPercent - a.occupancyPercent);
  }

  // ============================================================================
  // STATS
  // ============================================================================

  getCongestionStats(tenantId: string): CongestionStats {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const zones = Array.from(this.zones.values()).filter(z => z.tenantId === tenantId);
    const enabledZones = zones.filter(z => z.enabled);
    const alerts = Array.from(this.alerts.values()).filter(a => a.tenantId === tenantId);
    const actions = Array.from(this.actions.values()).filter(a => a.tenantId === tenantId);

    const occupancies = enabledZones.map(z => z.occupancyPercent);
    const avgOccupancy = occupancies.length > 0
      ? occupancies.reduce((a, b) => a + b, 0) / occupancies.length : 0;
    const peakOccupancy = occupancies.length > 0 ? Math.max(...occupancies) : 0;
    const peakZone = enabledZones.find(z => z.occupancyPercent === peakOccupancy);

    return {
      tenantId,
      date: now,

      totalZones: zones.length,
      monitoredZones: enabledZones.length,
      zonesAtWarning: enabledZones.filter(z => z.congestionLevel === 'high').length,
      zonesAtCritical: enabledZones.filter(z => z.congestionLevel === 'critical').length,
      zonesNormal: enabledZones.filter(z => z.congestionLevel === 'low' || z.congestionLevel === 'moderate').length,

      activeAlerts: alerts.filter(a => !a.resolved).length,
      unacknowledgedAlerts: alerts.filter(a => !a.acknowledged && !a.resolved).length,
      alertsToday: alerts.filter(a => a.createdAt >= todayStart).length,
      alertsResolved: alerts.filter(a => a.resolved).length,

      averageOccupancyPercent: avgOccupancy,
      peakOccupancyPercent: peakOccupancy,
      peakZoneName: peakZone?.name,

      activeTrafficActions: actions.filter(a => a.status === 'active').length,
      actionsToday: actions.filter(a => a.createdAt >= todayStart).length,
    };
  }

  // ============================================================================
  // INTERNAL
  // ============================================================================

  private calculateLevel(percent: number, zone: CongestionZone): CongestionLevel {
    if (percent >= zone.criticalThreshold) return 'critical';
    if (percent >= zone.warningThreshold) return 'high';
    if (percent >= 50) return 'moderate';
    return 'low';
  }

  private evaluateAlerts(
    zone: CongestionZone,
    occupancyPercent: number,
    _previousLevel: CongestionLevel,
    currentLevel: CongestionLevel,
  ): void {
    const now = new Date();

    // Auto-resolve existing alerts if congestion dropped
    if (currentLevel === 'low' || currentLevel === 'moderate') {
      const activeAlerts = this.getAlertsByZone(zone.id).filter(a => !a.resolved);
      for (const alert of activeAlerts) {
        alert.resolved = true;
        alert.resolvedAt = now;
        alert.resolvedBy = 'system';
        alert.resolutionNotes = 'Congestion level returned to normal';
        alert.updatedAt = now;
      }
      return;
    }

    // Check if we already have an unresolved alert for this zone at this severity
    const existingAlerts = this.getAlertsByZone(zone.id).filter(a => !a.resolved);
    const alreadyAlerted = existingAlerts.some(a =>
      (currentLevel === 'critical' && a.severity === 'critical') ||
      (currentLevel === 'high' && a.severity === 'warning')
    );

    if (alreadyAlerted) return;

    // Create new alert
    const severity: CongestionAlertSeverity = currentLevel === 'critical' ? 'critical' : 'warning';
    const threshold = currentLevel === 'critical' ? zone.criticalThreshold : zone.warningThreshold;

    const alert: CongestionAlert = {
      id: uuidv4(),
      tenantId: zone.tenantId,
      facilityId: zone.facilityId,
      zoneId: zone.id,
      zoneName: zone.name,
      zoneType: zone.zoneType,
      severity,
      occupancyPercent,
      threshold,
      message: `Zone "${zone.name}" is at ${occupancyPercent.toFixed(1)}% occupancy (${severity} threshold: ${threshold}%)`,
      acknowledged: false,
      resolved: false,
      createdAt: now,
      updatedAt: now,
    };

    this.alerts.set(alert.id, alert);
    this.alertsByZone.get(zone.id)!.push(alert.id);

    emit('congestion.alert_triggered', {
      alertId: alert.id,
      zoneId: zone.id,
      zoneName: zone.name,
      severity,
      occupancyPercent,
    }, { tenantId: zone.tenantId });
  }
}

// ============================================================================
// SINGLETON ACCESSORS
// ============================================================================

let _congestionEngine: CongestionEngine | null = null;

export function getCongestionEngine(): CongestionEngine {
  if (!_congestionEngine) {
    _congestionEngine = CongestionEngine.getInstance();
  }
  return _congestionEngine;
}

export function setCongestionEngine(engine: CongestionEngine): void {
  _congestionEngine = engine;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface RegisterCongestionZoneInput {
  tenantId: string;
  facilityId: string;
  code: string;
  name: string;
  zoneType: CongestionZoneType;
  referenceId?: UUID;
  warningThreshold?: number;
  criticalThreshold?: number;
  maxCapacity: number;
  enabled?: boolean;
  monitoringIntervalSec?: number;
}

export interface RecordCongestionReadingInput {
  zoneId: UUID;
  occupancy: number;
  equipmentCount?: number;
  vehicleCount?: number;
  containerCount?: number;
  queueLength?: number;
  averageWaitMinutes?: number;
}

export interface CreateTrafficActionInput {
  zoneId: UUID;
  actionType: TrafficActionType;
  description: string;
  isAutomatic?: boolean;
  triggeredBy?: string;
}
