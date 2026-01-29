import { describe, it, expect, beforeEach } from 'vitest';
import { CongestionEngine } from '../congestion/congestion-engine';
import type {
  RegisterCongestionZoneInput,
  RecordCongestionReadingInput,
  CreateTrafficActionInput,
} from '../congestion/congestion-engine';
import { uuid, TENANT_ID, FACILITY_ID } from './test-utils';

// ============================================================================
// Factories
// ============================================================================

let zoneCounter = 1;

function makeZoneInput(overrides: Partial<RegisterCongestionZoneInput> = {}): RegisterCongestionZoneInput {
  const n = zoneCounter++;
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    code: `CZ-${String(n).padStart(3, '0')}`,
    name: `Congestion Zone ${n}`,
    zoneType: 'yard_block',
    maxCapacity: 100,
    warningThreshold: 75,
    criticalThreshold: 90,
    ...overrides,
  };
}

function makeReadingInput(zoneId: string, overrides: Partial<RecordCongestionReadingInput> = {}): RecordCongestionReadingInput {
  return {
    zoneId,
    occupancy: 50,
    equipmentCount: 10,
    vehicleCount: 5,
    containerCount: 30,
    queueLength: 3,
    averageWaitMinutes: 12,
    ...overrides,
  };
}

function makeTrafficActionInput(zoneId: string, overrides: Partial<CreateTrafficActionInput> = {}): CreateTrafficActionInput {
  return {
    zoneId,
    actionType: 'redirect_equipment',
    description: 'Redirect equipment to alternate zone',
    isAutomatic: false,
    triggeredBy: 'operator-1',
    ...overrides,
  };
}

// ============================================================================
// Helper: register a zone and return the created zone object
// ============================================================================

function registerZone(engine: CongestionEngine, overrides: Partial<RegisterCongestionZoneInput> = {}) {
  const res = engine.registerZone(makeZoneInput(overrides));
  expect(res.success).toBe(true);
  return res.data!;
}

// ============================================================================
// Tests
// ============================================================================

describe('CongestionEngine', () => {
  let engine: CongestionEngine;

  beforeEach(() => {
    CongestionEngine.resetInstance();
    engine = CongestionEngine.getInstance();
    zoneCounter = 1; // reset factory counter for predictable codes
  });

  // ==========================================================================
  // 1. Singleton
  // ==========================================================================

  describe('Singleton', () => {
    it('returns the same instance on subsequent calls', () => {
      const a = CongestionEngine.getInstance();
      const b = CongestionEngine.getInstance();
      expect(a).toBe(b);
    });

    it('returns a new instance after resetInstance()', () => {
      const first = CongestionEngine.getInstance();
      CongestionEngine.resetInstance();
      const second = CongestionEngine.getInstance();
      expect(first).not.toBe(second);
    });
  });

  // ==========================================================================
  // 2. Zone Management
  // ==========================================================================

  describe('Zone management', () => {
    it('registers a zone successfully', () => {
      const res = engine.registerZone(makeZoneInput());
      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      expect(res.data!.code).toBe('CZ-001');
      expect(res.data!.name).toBe('Congestion Zone 1');
      expect(res.data!.zoneType).toBe('yard_block');
      expect(res.data!.maxCapacity).toBe(100);
      expect(res.data!.currentOccupancy).toBe(0);
      expect(res.data!.occupancyPercent).toBe(0);
      expect(res.data!.congestionLevel).toBe('low');
      expect(res.data!.enabled).toBe(true);
    });

    it('rejects duplicate zone code within the same facility', () => {
      engine.registerZone(makeZoneInput({ code: 'DUP-01' }));
      const res = engine.registerZone(makeZoneInput({ code: 'DUP-01' }));
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('DUPLICATE_CODE');
    });

    it('allows the same code in different facilities', () => {
      const r1 = engine.registerZone(makeZoneInput({ code: 'SHARED', facilityId: 'facility-A' }));
      const r2 = engine.registerZone(makeZoneInput({ code: 'SHARED', facilityId: 'facility-B' }));
      expect(r1.success).toBe(true);
      expect(r2.success).toBe(true);
    });

    it('retrieves a zone by id', () => {
      const zone = registerZone(engine);
      const found = engine.getZone(zone.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(zone.id);
    });

    it('retrieves a zone by facility + code', () => {
      const zone = registerZone(engine, { code: 'LOOKUP-01' });
      const found = engine.getZoneByCode(FACILITY_ID, 'LOOKUP-01');
      expect(found).toBeDefined();
      expect(found!.id).toBe(zone.id);
    });

    it('returns undefined for unknown zone by code', () => {
      expect(engine.getZoneByCode(FACILITY_ID, 'NONEXISTENT')).toBeUndefined();
    });

    it('lists all zones and filters by tenant', () => {
      registerZone(engine);
      registerZone(engine);
      registerZone(engine, { tenantId: 'other-tenant' });

      expect(engine.listZones().length).toBe(3);
      expect(engine.listZones(TENANT_ID).length).toBe(2);
      expect(engine.listZones('other-tenant').length).toBe(1);
    });

    it('lists zones by type', () => {
      registerZone(engine, { zoneType: 'gate' });
      registerZone(engine, { zoneType: 'gate' });
      registerZone(engine, { zoneType: 'berth' });

      expect(engine.listZones(undefined, 'gate').length).toBe(2);
      expect(engine.listZones(undefined, 'berth').length).toBe(1);
      expect(engine.listZones(undefined, 'rail_siding').length).toBe(0);
    });

    it('updates zone thresholds', () => {
      const zone = registerZone(engine);
      const res = engine.updateZoneThresholds(zone.id, 60, 85);
      expect(res.success).toBe(true);
      expect(res.data!.warningThreshold).toBe(60);
      expect(res.data!.criticalThreshold).toBe(85);
    });

    it('rejects invalid thresholds where warning >= critical', () => {
      const zone = registerZone(engine);
      const res = engine.updateZoneThresholds(zone.id, 90, 80);
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('INVALID_THRESHOLDS');

      // equal values should also fail
      const res2 = engine.updateZoneThresholds(zone.id, 80, 80);
      expect(res2.success).toBe(false);
      expect(res2.errorCode).toBe('INVALID_THRESHOLDS');
    });

    it('enables and disables a zone', () => {
      const zone = registerZone(engine);
      expect(zone.enabled).toBe(true);

      const r1 = engine.setZoneEnabled(zone.id, false);
      expect(r1.success).toBe(true);
      expect(r1.data!.enabled).toBe(false);

      const r2 = engine.setZoneEnabled(zone.id, true);
      expect(r2.success).toBe(true);
      expect(r2.data!.enabled).toBe(true);
    });

    it('returns NOT_FOUND when enabling unknown zone', () => {
      const res = engine.setZoneEnabled(uuid(), true);
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('NOT_FOUND');
    });
  });

  // ==========================================================================
  // 3. Readings
  // ==========================================================================

  describe('Readings', () => {
    it('records a reading and updates zone state', () => {
      const zone = registerZone(engine, { maxCapacity: 100 });
      const res = engine.recordReading(makeReadingInput(zone.id, { occupancy: 40 }));
      expect(res.success).toBe(true);
      expect(res.data!.occupancy).toBe(40);
      expect(res.data!.occupancyPercent).toBe(40);
      expect(res.data!.congestionLevel).toBe('low');

      // Zone state should be updated
      const updated = engine.getZone(zone.id)!;
      expect(updated.currentOccupancy).toBe(40);
      expect(updated.occupancyPercent).toBe(40);
      expect(updated.congestionLevel).toBe('low');
      expect(updated.lastReadingAt).toBeDefined();
    });

    it('returns NOT_FOUND for unknown zone', () => {
      const res = engine.recordReading(makeReadingInput(uuid()));
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('NOT_FOUND');
    });

    it('rejects reading on disabled zone', () => {
      const zone = registerZone(engine);
      engine.setZoneEnabled(zone.id, false);
      const res = engine.recordReading(makeReadingInput(zone.id));
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('ZONE_DISABLED');
    });

    it('calculates congestion level correctly', () => {
      const zone = registerZone(engine, {
        maxCapacity: 100,
        warningThreshold: 75,
        criticalThreshold: 90,
      });

      // low: < 50%
      engine.recordReading(makeReadingInput(zone.id, { occupancy: 30 }));
      expect(engine.getZone(zone.id)!.congestionLevel).toBe('low');

      // moderate: 50-74%
      engine.recordReading(makeReadingInput(zone.id, { occupancy: 60 }));
      expect(engine.getZone(zone.id)!.congestionLevel).toBe('moderate');

      // high: 75-89%
      engine.recordReading(makeReadingInput(zone.id, { occupancy: 80 }));
      expect(engine.getZone(zone.id)!.congestionLevel).toBe('high');

      // critical: >= 90%
      engine.recordReading(makeReadingInput(zone.id, { occupancy: 95 }));
      expect(engine.getZone(zone.id)!.congestionLevel).toBe('critical');
    });

    it('retrieves readings by zone', () => {
      const zone = registerZone(engine);
      engine.recordReading(makeReadingInput(zone.id, { occupancy: 10 }));
      engine.recordReading(makeReadingInput(zone.id, { occupancy: 20 }));
      engine.recordReading(makeReadingInput(zone.id, { occupancy: 30 }));

      const readings = engine.getReadingsByZone(zone.id);
      expect(readings.length).toBe(3);
    });

    it('returns readings newest first and respects limit', () => {
      const zone = registerZone(engine);
      engine.recordReading(makeReadingInput(zone.id, { occupancy: 10 }));
      engine.recordReading(makeReadingInput(zone.id, { occupancy: 20 }));
      engine.recordReading(makeReadingInput(zone.id, { occupancy: 30 }));

      const readings = engine.getReadingsByZone(zone.id);
      // Newest first: last recorded (30) should be first
      expect(readings[0]!.occupancy).toBe(30);
      expect(readings[2]!.occupancy).toBe(10);

      // With limit
      const limited = engine.getReadingsByZone(zone.id, 2);
      expect(limited.length).toBe(2);
      expect(limited[0]!.occupancy).toBe(30);
    });
  });

  // ==========================================================================
  // 4. Alert Triggering
  // ==========================================================================

  describe('Alert triggering', () => {
    it('triggers a warning alert when occupancy reaches high level', () => {
      const zone = registerZone(engine, {
        maxCapacity: 100,
        warningThreshold: 75,
        criticalThreshold: 90,
      });

      engine.recordReading(makeReadingInput(zone.id, { occupancy: 80 }));

      const alerts = engine.getAlertsByZone(zone.id);
      expect(alerts.length).toBe(1);
      expect(alerts[0]!.severity).toBe('warning');
      expect(alerts[0]!.acknowledged).toBe(false);
      expect(alerts[0]!.resolved).toBe(false);
    });

    it('triggers a critical alert when occupancy reaches critical level', () => {
      const zone = registerZone(engine, {
        maxCapacity: 100,
        warningThreshold: 75,
        criticalThreshold: 90,
      });

      engine.recordReading(makeReadingInput(zone.id, { occupancy: 95 }));

      const alerts = engine.getAlertsByZone(zone.id);
      expect(alerts.length).toBe(1);
      expect(alerts[0]!.severity).toBe('critical');
      expect(alerts[0]!.occupancyPercent).toBe(95);
      expect(alerts[0]!.threshold).toBe(90);
    });

    it('does not create duplicate alerts for the same severity level', () => {
      const zone = registerZone(engine, {
        maxCapacity: 100,
        warningThreshold: 75,
        criticalThreshold: 90,
      });

      // Two readings at high level should produce only one warning alert
      engine.recordReading(makeReadingInput(zone.id, { occupancy: 80 }));
      engine.recordReading(makeReadingInput(zone.id, { occupancy: 85 }));

      const alerts = engine.getAlertsByZone(zone.id);
      const warningAlerts = alerts.filter(a => a.severity === 'warning' && !a.resolved);
      expect(warningAlerts.length).toBe(1);
    });

    it('auto-resolves active alerts when congestion drops to normal', () => {
      const zone = registerZone(engine, {
        maxCapacity: 100,
        warningThreshold: 75,
        criticalThreshold: 90,
      });

      // Trigger a warning alert
      engine.recordReading(makeReadingInput(zone.id, { occupancy: 80 }));
      expect(engine.getAlertsByZone(zone.id).filter(a => !a.resolved).length).toBe(1);

      // Drop to low level
      engine.recordReading(makeReadingInput(zone.id, { occupancy: 20 }));

      const alerts = engine.getAlertsByZone(zone.id);
      expect(alerts.length).toBe(1);
      expect(alerts[0]!.resolved).toBe(true);
      expect(alerts[0]!.resolvedBy).toBe('system');
      expect(alerts[0]!.resolutionNotes).toBe('Congestion level returned to normal');
    });

    it('generates correct alert message format', () => {
      const zone = registerZone(engine, {
        name: 'Yard Block A',
        maxCapacity: 200,
        warningThreshold: 75,
        criticalThreshold: 90,
      });

      engine.recordReading(makeReadingInput(zone.id, { occupancy: 160 }));

      const alerts = engine.getAlertsByZone(zone.id);
      expect(alerts.length).toBe(1);
      // occupancy = 160/200 = 80%, which is 'high' => 'warning' severity
      expect(alerts[0]!.message).toBe(
        'Zone "Yard Block A" is at 80.0% occupancy (warning threshold: 75%)'
      );
    });

    it('returns active and unacknowledged alerts for a tenant', () => {
      const z1 = registerZone(engine, { maxCapacity: 100, warningThreshold: 75, criticalThreshold: 90 });
      const z2 = registerZone(engine, { maxCapacity: 100, warningThreshold: 75, criticalThreshold: 90 });

      // Trigger alerts on two zones
      engine.recordReading(makeReadingInput(z1.id, { occupancy: 80 }));
      engine.recordReading(makeReadingInput(z2.id, { occupancy: 95 }));

      const active = engine.getActiveAlerts(TENANT_ID);
      expect(active.length).toBe(2);

      const unacked = engine.getUnacknowledgedAlerts(TENANT_ID);
      expect(unacked.length).toBe(2);

      // Acknowledge one
      const alertId = active[0]!.id;
      engine.acknowledgeAlert(alertId, 'operator-1');

      expect(engine.getActiveAlerts(TENANT_ID).length).toBe(2); // still active (not resolved)
      expect(engine.getUnacknowledgedAlerts(TENANT_ID).length).toBe(1);
    });
  });

  // ==========================================================================
  // 5. Alert Lifecycle
  // ==========================================================================

  describe('Alert lifecycle', () => {
    function createAlertedZone() {
      const zone = registerZone(engine, {
        maxCapacity: 100,
        warningThreshold: 75,
        criticalThreshold: 90,
      });
      engine.recordReading(makeReadingInput(zone.id, { occupancy: 80 }));
      const alerts = engine.getAlertsByZone(zone.id);
      return { zone, alert: alerts[0]! };
    }

    it('acknowledges an alert', () => {
      const { alert } = createAlertedZone();
      const res = engine.acknowledgeAlert(alert.id, 'operator-1');
      expect(res.success).toBe(true);
      expect(res.data!.acknowledged).toBe(true);
      expect(res.data!.acknowledgedBy).toBe('operator-1');
      expect(res.data!.acknowledgedAt).toBeDefined();
    });

    it('rejects acknowledging an already acknowledged alert', () => {
      const { alert } = createAlertedZone();
      engine.acknowledgeAlert(alert.id, 'operator-1');
      const res = engine.acknowledgeAlert(alert.id, 'operator-2');
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('ALREADY_ACKNOWLEDGED');
    });

    it('resolves an alert manually', () => {
      const { alert } = createAlertedZone();
      const res = engine.resolveAlert(alert.id, 'supervisor-1', 'Redirected trucks');
      expect(res.success).toBe(true);
      expect(res.data!.resolved).toBe(true);
      expect(res.data!.resolvedBy).toBe('supervisor-1');
      expect(res.data!.resolutionNotes).toBe('Redirected trucks');
      expect(res.data!.resolvedAt).toBeDefined();
    });

    it('rejects resolving an already resolved alert', () => {
      const { alert } = createAlertedZone();
      engine.resolveAlert(alert.id, 'supervisor-1');
      const res = engine.resolveAlert(alert.id, 'supervisor-2');
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('ALREADY_RESOLVED');
    });

    it('returns NOT_FOUND for unknown alert id', () => {
      const ackRes = engine.acknowledgeAlert(uuid(), 'operator-1');
      expect(ackRes.success).toBe(false);
      expect(ackRes.errorCode).toBe('NOT_FOUND');

      const resRes = engine.resolveAlert(uuid(), 'supervisor-1');
      expect(resRes.success).toBe(false);
      expect(resRes.errorCode).toBe('NOT_FOUND');
    });
  });

  // ==========================================================================
  // 6. Traffic Actions
  // ==========================================================================

  describe('Traffic actions', () => {
    it('creates a traffic action', () => {
      const zone = registerZone(engine);
      const res = engine.createTrafficAction(makeTrafficActionInput(zone.id));
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('pending');
      expect(res.data!.actionType).toBe('redirect_equipment');
      expect(res.data!.zoneId).toBe(zone.id);
      expect(res.data!.isAutomatic).toBe(false);
      expect(res.data!.triggeredBy).toBe('operator-1');
    });

    it('returns NOT_FOUND for traffic action on unknown zone', () => {
      const res = engine.createTrafficAction(makeTrafficActionInput(uuid()));
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('NOT_FOUND');
    });

    it('executes a pending traffic action', () => {
      const zone = registerZone(engine);
      const action = engine.createTrafficAction(makeTrafficActionInput(zone.id)).data!;

      const res = engine.executeTrafficAction(action.id, 'operator-2');
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('active');
      expect(res.data!.executedBy).toBe('operator-2');
      expect(res.data!.startedAt).toBeDefined();
    });

    it('completes an active traffic action', () => {
      const zone = registerZone(engine);
      const action = engine.createTrafficAction(makeTrafficActionInput(zone.id)).data!;
      engine.executeTrafficAction(action.id, 'operator-2');

      const res = engine.completeTrafficAction(action.id, 85);
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('completed');
      expect(res.data!.completedAt).toBeDefined();
      expect(res.data!.effectivenessScore).toBe(85);
    });

    it('rejects completing a non-active action', () => {
      const zone = registerZone(engine);
      const action = engine.createTrafficAction(makeTrafficActionInput(zone.id)).data!;

      // Action is still 'pending', not 'active'
      const res = engine.completeTrafficAction(action.id);
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('INVALID_STATUS');
    });

    it('rejects executing a non-pending action', () => {
      const zone = registerZone(engine);
      const action = engine.createTrafficAction(makeTrafficActionInput(zone.id)).data!;
      engine.executeTrafficAction(action.id, 'operator-2');

      // Action is now 'active', not 'pending'
      const res = engine.executeTrafficAction(action.id, 'operator-3');
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('INVALID_STATUS');
    });

    it('lists actions by zone with status filter', () => {
      const zone = registerZone(engine);
      const a1 = engine.createTrafficAction(makeTrafficActionInput(zone.id)).data!;
      const a2 = engine.createTrafficAction(makeTrafficActionInput(zone.id, {
        actionType: 'throttle_operations',
        description: 'Throttle operations',
      })).data!;

      // Execute a1 but leave a2 pending
      engine.executeTrafficAction(a1.id, 'operator-2');

      // All actions for zone
      expect(engine.getTrafficActionsByZone(zone.id).length).toBe(2);

      // Filtered by status
      expect(engine.getTrafficActionsByZone(zone.id, 'pending').length).toBe(1);
      expect(engine.getTrafficActionsByZone(zone.id, 'active').length).toBe(1);
      expect(engine.getTrafficActionsByZone(zone.id, 'completed').length).toBe(0);

      // Complete a1
      engine.completeTrafficAction(a1.id, 90);
      expect(engine.getTrafficActionsByZone(zone.id, 'completed').length).toBe(1);
      expect(engine.getTrafficActionsByZone(zone.id, 'active').length).toBe(0);
    });
  });

  // ==========================================================================
  // 7. Congestion Map
  // ==========================================================================

  describe('Congestion map', () => {
    it('returns all enabled zones for a facility', () => {
      registerZone(engine, { facilityId: 'FAC-A' });
      registerZone(engine, { facilityId: 'FAC-A' });
      registerZone(engine, { facilityId: 'FAC-B' });

      const mapA = engine.getCongestionMap('FAC-A');
      expect(mapA.length).toBe(2);

      const mapB = engine.getCongestionMap('FAC-B');
      expect(mapB.length).toBe(1);
    });

    it('returns hotspots sorted by occupancy descending', () => {
      const facilityId = 'FAC-HOTSPOT';
      const z1 = registerZone(engine, {
        facilityId,
        maxCapacity: 100,
        warningThreshold: 75,
        criticalThreshold: 90,
      });
      const z2 = registerZone(engine, {
        facilityId,
        maxCapacity: 100,
        warningThreshold: 75,
        criticalThreshold: 90,
      });
      const z3 = registerZone(engine, {
        facilityId,
        maxCapacity: 100,
        warningThreshold: 75,
        criticalThreshold: 90,
      });

      // z1 = moderate (60%), z2 = critical (95%), z3 = high (80%)
      engine.recordReading(makeReadingInput(z1.id, { occupancy: 60 }));
      engine.recordReading(makeReadingInput(z2.id, { occupancy: 95 }));
      engine.recordReading(makeReadingInput(z3.id, { occupancy: 80 }));

      const hotspots = engine.getHotspots(facilityId);
      // Only high + critical zones: z2 (95%) and z3 (80%), not z1 (moderate)
      expect(hotspots.length).toBe(2);
      expect(hotspots[0]!.id).toBe(z2.id); // 95% first
      expect(hotspots[1]!.id).toBe(z3.id); // 80% second
    });

    it('returns empty array for facility with no zones', () => {
      expect(engine.getCongestionMap('NONEXISTENT').length).toBe(0);
      expect(engine.getHotspots('NONEXISTENT').length).toBe(0);
    });
  });

  // ==========================================================================
  // 8. Stats
  // ==========================================================================

  describe('Stats', () => {
    it('returns full stats for a tenant', () => {
      const z1 = registerZone(engine, { maxCapacity: 100, warningThreshold: 75, criticalThreshold: 90 });
      const z2 = registerZone(engine, { maxCapacity: 100, warningThreshold: 75, criticalThreshold: 90 });
      const z3 = registerZone(engine, { maxCapacity: 100, warningThreshold: 75, criticalThreshold: 90, enabled: false });

      // z1 = high (80%), z2 = critical (95%), z3 disabled
      engine.recordReading(makeReadingInput(z1.id, { occupancy: 80 }));
      engine.recordReading(makeReadingInput(z2.id, { occupancy: 95 }));

      // Create and execute a traffic action
      const action = engine.createTrafficAction(makeTrafficActionInput(z1.id)).data!;
      engine.executeTrafficAction(action.id, 'operator-1');

      const stats = engine.getCongestionStats(TENANT_ID);

      expect(stats.tenantId).toBe(TENANT_ID);
      expect(stats.totalZones).toBe(3);
      expect(stats.monitoredZones).toBe(2); // z3 disabled
      expect(stats.zonesAtWarning).toBe(1); // z1 is 'high' (maps to warning count)
      expect(stats.zonesAtCritical).toBe(1); // z2 is 'critical'
      expect(stats.zonesNormal).toBe(0); // none at low/moderate

      // Alerts: z1 warning + z2 critical = 2 active
      expect(stats.activeAlerts).toBe(2);
      expect(stats.unacknowledgedAlerts).toBe(2);
      expect(stats.alertsToday).toBe(2);
      expect(stats.alertsResolved).toBe(0);

      // Occupancy: avg of 80 and 95 = 87.5
      expect(stats.averageOccupancyPercent).toBe(87.5);
      expect(stats.peakOccupancyPercent).toBe(95);
      expect(stats.peakZoneName).toBe(z2.name);

      // Traffic actions
      expect(stats.activeTrafficActions).toBe(1);
      expect(stats.actionsToday).toBe(1);
    });

    it('returns empty stats for a tenant with no data', () => {
      const stats = engine.getCongestionStats('empty-tenant');

      expect(stats.totalZones).toBe(0);
      expect(stats.monitoredZones).toBe(0);
      expect(stats.zonesAtWarning).toBe(0);
      expect(stats.zonesAtCritical).toBe(0);
      expect(stats.zonesNormal).toBe(0);
      expect(stats.activeAlerts).toBe(0);
      expect(stats.unacknowledgedAlerts).toBe(0);
      expect(stats.alertsResolved).toBe(0);
      expect(stats.averageOccupancyPercent).toBe(0);
      expect(stats.peakOccupancyPercent).toBe(0);
      expect(stats.peakZoneName).toBeUndefined();
      expect(stats.activeTrafficActions).toBe(0);
      expect(stats.actionsToday).toBe(0);
    });

    it('tracks correct counts after alerts are resolved', () => {
      const z1 = registerZone(engine, { maxCapacity: 100, warningThreshold: 75, criticalThreshold: 90 });
      const z2 = registerZone(engine, { maxCapacity: 100, warningThreshold: 75, criticalThreshold: 90 });

      // Trigger alerts
      engine.recordReading(makeReadingInput(z1.id, { occupancy: 80 }));
      engine.recordReading(makeReadingInput(z2.id, { occupancy: 95 }));

      // Resolve z1 alert by dropping occupancy
      engine.recordReading(makeReadingInput(z1.id, { occupancy: 20 }));

      const stats = engine.getCongestionStats(TENANT_ID);

      // z1 now low, z2 still critical
      expect(stats.zonesNormal).toBe(1);
      expect(stats.zonesAtCritical).toBe(1);

      // z1 alert auto-resolved, z2 alert still active
      expect(stats.activeAlerts).toBe(1);
      expect(stats.alertsResolved).toBe(1);
      expect(stats.unacknowledgedAlerts).toBe(1);
    });
  });
});
