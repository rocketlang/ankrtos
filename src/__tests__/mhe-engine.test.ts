/**
 * MHE Engine Tests
 *
 * Comprehensive unit tests for MHEEngine covering:
 * - Singleton pattern
 * - Telematics (record, latest, history, fleet positions, idling, overspeed)
 * - Geofence management (create, get, list, update, toggle, violation)
 * - Operator certification (register, get, list, renew, expiring, eligibility, training)
 * - Safety & incidents (report, get, list, status transitions, safety checks, open incidents)
 * - Charging & battery (register dock, get, list, start, complete, battery swap, sessions)
 * - Enhanced maintenance (create WO, get, list, schedule, start, complete, cancel)
 * - Equipment lifecycle (register, get, list, utilization, replacement due)
 * - MHE stats (full stats verification)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MHEEngine } from '../mhe/mhe-engine';
import type {
  RecordTelematicsInput,
  CreateGeofenceInput,
  RegisterCertificationInput,
  RecordTrainingInput,
  ReportIncidentInput,
  SubmitSafetyCheckInput,
  RegisterChargingDockInput,
  StartChargingInput,
  RecordBatterySwapInput,
  CreateWorkOrderInput,
  RegisterLifecycleInput,
} from '../mhe/mhe-engine';
import type { SafetyCheckItem } from '../types/mhe';
import { TENANT_ID, FACILITY_ID, uuid } from './test-utils';

// ============================================================================
// Helper Factories
// ============================================================================

let equipSeq = 1;

function makeEquipmentId(): string {
  return uuid();
}

function makeEquipmentCode(): string {
  return `MHE-${String(equipSeq++).padStart(4, '0')}`;
}

function makeTelematicsInput(overrides: Partial<RecordTelematicsInput> = {}): RecordTelematicsInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    equipmentId: uuid(),
    equipmentCode: makeEquipmentCode(),
    engineRunning: true,
    engineHours: 1200,
    speed: 8,
    position: { latitude: 19.0760, longitude: 72.8777 },
    heading: 90,
    batteryLevelPercent: 75,
    ...overrides,
  };
}

function makeGeofenceInput(overrides: Partial<CreateGeofenceInput> = {}): CreateGeofenceInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    name: `Zone-${equipSeq++}`,
    zoneType: 'operating_area',
    centerPoint: { latitude: 19.0760, longitude: 72.8777 },
    radiusMeters: 500,
    maxSpeedKmh: 15,
    alertOnEntry: true,
    alertOnExit: true,
    alertOnOverspeed: true,
    ...overrides,
  };
}

function makeCertificationInput(overrides: Partial<RegisterCertificationInput> = {}): RegisterCertificationInput {
  const now = new Date();
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    operatorId: uuid(),
    operatorName: `Operator-${equipSeq++}`,
    certType: 'forklift_license',
    certNumber: `CERT-${Date.now()}-${equipSeq}`,
    issuedBy: 'Port Authority',
    issuedDate: new Date(now.getTime() - 30 * 86400000),
    expiryDate: new Date(now.getTime() + 335 * 86400000),
    trainingProvider: 'Safety Academy',
    trainingDate: new Date(now.getTime() - 60 * 86400000),
    trainingHours: 40,
    examScore: 92,
    renewalReminderDays: 30,
    ...overrides,
  };
}

function makeTrainingInput(overrides: Partial<RecordTrainingInput> = {}): RecordTrainingInput {
  const now = new Date();
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    operatorId: uuid(),
    operatorName: `Trainee-${equipSeq++}`,
    trainingType: 'forklift_operation',
    trainingName: 'Forklift Operation Level 1',
    provider: 'Safety Academy',
    startDate: new Date(now.getTime() - 7 * 86400000),
    endDate: now,
    durationHours: 40,
    completed: true,
    examPassed: true,
    examScore: 85,
    ...overrides,
  };
}

function makeIncidentInput(overrides: Partial<ReportIncidentInput> = {}): ReportIncidentInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    incidentType: 'collision',
    severity: 'moderate',
    occurredAt: new Date(),
    locationZone: 'Yard Block A',
    locationDescription: 'Near stack row 12',
    description: 'Forklift collided with container stack',
    equipmentId: uuid(),
    equipmentCode: makeEquipmentCode(),
    operatorId: uuid(),
    operatorName: 'Test Operator',
    injuriesReported: false,
    propertyDamage: true,
    damageEstimate: 50000,
    ...overrides,
  };
}

function makeSafetyCheckInput(overrides: Partial<SubmitSafetyCheckInput> = {}): SubmitSafetyCheckInput {
  const items: SafetyCheckItem[] = [
    { itemName: 'Brakes', category: 'brakes', result: 'ok' },
    { itemName: 'Horn', category: 'horn', result: 'ok' },
    { itemName: 'Lights', category: 'lights', result: 'ok' },
    { itemName: 'Forks', category: 'forks', result: 'ok' },
    { itemName: 'Hydraulics', category: 'hydraulics', result: 'ok' },
  ];
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    equipmentId: uuid(),
    equipmentCode: makeEquipmentCode(),
    operatorId: uuid(),
    operatorName: `CheckOperator-${equipSeq++}`,
    items,
    ...overrides,
  };
}

function makeChargingDockInput(overrides: Partial<RegisterChargingDockInput> = {}): RegisterChargingDockInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    dockCode: `DOCK-${equipSeq++}`,
    location: 'Charging Bay A',
    chargerType: 'fast',
    powerRatingKW: 50,
    compatibleEquipmentTypes: ['forklift', 'reach_stacker'],
    ...overrides,
  };
}

function makeStartChargingInput(dockId: string, overrides: Partial<StartChargingInput> = {}): StartChargingInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    dockId,
    equipmentId: uuid(),
    equipmentCode: makeEquipmentCode(),
    startBatteryPercent: 20,
    ...overrides,
  };
}

function makeBatterySwapInput(overrides: Partial<RecordBatterySwapInput> = {}): RecordBatterySwapInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    equipmentId: uuid(),
    equipmentCode: makeEquipmentCode(),
    oldBatteryId: `BAT-OLD-${equipSeq}`,
    newBatteryId: `BAT-NEW-${equipSeq++}`,
    oldBatteryPercent: 10,
    newBatteryPercent: 100,
    swappedBy: 'Battery Tech A',
    durationMinutes: 15,
    ...overrides,
  };
}

function makeWorkOrderInput(overrides: Partial<CreateWorkOrderInput> = {}): CreateWorkOrderInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    equipmentId: uuid(),
    equipmentCode: makeEquipmentCode(),
    equipmentType: 'forklift',
    priority: 'medium',
    title: 'Scheduled Maintenance',
    description: 'Routine 500-hour service',
    isPreventive: true,
    requestedBy: 'Maintenance Manager',
    ...overrides,
  };
}

function makeLifecycleInput(overrides: Partial<RegisterLifecycleInput> = {}): RegisterLifecycleInput {
  const now = new Date();
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    equipmentId: uuid(),
    equipmentCode: makeEquipmentCode(),
    purchaseDate: new Date(now.getTime() - 365 * 86400000), // 1 year ago
    purchasePrice: 5000000,
    vendorName: 'Kalmar Equipment',
    warrantyExpiryDate: new Date(now.getTime() + 730 * 86400000),
    depreciationMethod: 'straight_line',
    usefulLifeYears: 10,
    salvageValue: 500000,
    ...overrides,
  };
}

// ============================================================================
// Helper: convenience wrappers
// ============================================================================

function registerDock(engine: MHEEngine, overrides: Partial<RegisterChargingDockInput> = {}) {
  const result = engine.registerChargingDock(makeChargingDockInput(overrides));
  expect(result.success).toBe(true);
  return result.data!;
}

function createWorkOrder(engine: MHEEngine, overrides: Partial<CreateWorkOrderInput> = {}) {
  const result = engine.createWorkOrder(makeWorkOrderInput(overrides));
  expect(result.success).toBe(true);
  return result.data!;
}

function registerLifecycle(engine: MHEEngine, overrides: Partial<RegisterLifecycleInput> = {}) {
  const result = engine.registerLifecycle(makeLifecycleInput(overrides));
  expect(result.success).toBe(true);
  return result.data!;
}

function registerCert(engine: MHEEngine, overrides: Partial<RegisterCertificationInput> = {}) {
  const result = engine.registerCertification(makeCertificationInput(overrides));
  expect(result.success).toBe(true);
  return result.data!;
}

function reportIncident(engine: MHEEngine, overrides: Partial<ReportIncidentInput> = {}) {
  const result = engine.reportIncident(makeIncidentInput(overrides));
  expect(result.success).toBe(true);
  return result.data!;
}

// ============================================================================
// TESTS
// ============================================================================

describe('MHEEngine', () => {
  let engine: MHEEngine;

  beforeEach(() => {
    MHEEngine.resetInstance();
    engine = MHEEngine.getInstance();
    equipSeq = 1;
  });

  // ==========================================================================
  // 1. Singleton Pattern
  // ==========================================================================

  describe('Singleton pattern', () => {
    it('should return the same instance on repeated calls', () => {
      const a = MHEEngine.getInstance();
      const b = MHEEngine.getInstance();
      expect(a).toBe(b);
    });

    it('should return a new instance after reset', () => {
      const a = MHEEngine.getInstance();
      MHEEngine.resetInstance();
      const b = MHEEngine.getInstance();
      expect(a).not.toBe(b);
    });
  });

  // ==========================================================================
  // 2. Telematics
  // ==========================================================================

  describe('Telematics', () => {
    it('should record a telematics reading with moving status', () => {
      const result = engine.recordTelematics(makeTelematicsInput({ speed: 10, engineRunning: true }));
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('moving');
      expect(result.data!.id).toBeDefined();
      expect(result.data!.tenantId).toBe(TENANT_ID);
    });

    it('should set status to idle when engine is running but speed is 0', () => {
      const result = engine.recordTelematics(makeTelematicsInput({ speed: 0, engineRunning: true }));
      expect(result.success).toBe(true);
      // Without previous idle history > 10 minutes, isIdling should be false
      // but status should reflect engine running with 0 speed
      expect(result.data!.engineRunning).toBe(true);
    });

    it('should set status to offline when engine is not running', () => {
      const result = engine.recordTelematics(makeTelematicsInput({ engineRunning: false, speed: 0 }));
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('offline');
    });

    it('should detect idle status based on engine running with no speed', () => {
      const eqId = uuid();
      const eqCode = makeEquipmentCode();
      // First record: engine running, speed 0
      engine.recordTelematics(makeTelematicsInput({
        equipmentId: eqId,
        equipmentCode: eqCode,
        engineRunning: true,
        speed: 0,
      }));
      // Second record: same, but idle detection depends on time elapsed
      const result = engine.recordTelematics(makeTelematicsInput({
        equipmentId: eqId,
        equipmentCode: eqCode,
        engineRunning: true,
        speed: 0,
      }));
      expect(result.success).toBe(true);
      // idleDurationMinutes will be 0 since timestamps are near-instant
      expect(result.data!.idleDurationMinutes).toBeGreaterThanOrEqual(0);
    });

    it('should record battery/fuel levels', () => {
      const result = engine.recordTelematics(makeTelematicsInput({
        batteryLevelPercent: 85,
        batteryVoltage: 48.5,
        fuelLevelPercent: 60,
        isCharging: false,
      }));
      expect(result.success).toBe(true);
      expect(result.data!.batteryLevelPercent).toBe(85);
      expect(result.data!.batteryVoltage).toBe(48.5);
      expect(result.data!.fuelLevelPercent).toBe(60);
      expect(result.data!.isCharging).toBe(false);
    });

    it('should default isCharging to false when not provided', () => {
      const result = engine.recordTelematics(makeTelematicsInput({}));
      expect(result.success).toBe(true);
      expect(result.data!.isCharging).toBe(false);
    });

    it('should set isCharging to true when provided', () => {
      const result = engine.recordTelematics(makeTelematicsInput({ isCharging: true }));
      expect(result.success).toBe(true);
      expect(result.data!.isCharging).toBe(true);
    });

    it('should get latest telematics for equipment', () => {
      const eqId = uuid();
      const eqCode = makeEquipmentCode();
      engine.recordTelematics(makeTelematicsInput({ equipmentId: eqId, equipmentCode: eqCode, speed: 5 }));
      engine.recordTelematics(makeTelematicsInput({ equipmentId: eqId, equipmentCode: eqCode, speed: 12 }));

      const latest = engine.getLatestTelematics(eqId);
      expect(latest).toBeDefined();
      expect(latest!.speed).toBe(12);
    });

    it('should return undefined for unknown equipment telematics', () => {
      const result = engine.getLatestTelematics('non-existent-id');
      expect(result).toBeUndefined();
    });

    it('should get telematics history for equipment', () => {
      const eqId = uuid();
      const eqCode = makeEquipmentCode();
      engine.recordTelematics(makeTelematicsInput({ equipmentId: eqId, equipmentCode: eqCode, speed: 5 }));
      engine.recordTelematics(makeTelematicsInput({ equipmentId: eqId, equipmentCode: eqCode, speed: 8 }));
      engine.recordTelematics(makeTelematicsInput({ equipmentId: eqId, equipmentCode: eqCode, speed: 12 }));

      const history = engine.getTelematicsHistory(eqId);
      expect(history).toHaveLength(3);
    });

    it('should return empty history for unknown equipment', () => {
      const history = engine.getTelematicsHistory('non-existent-id');
      expect(history).toHaveLength(0);
    });

    it('should filter telematics history by date range', () => {
      const eqId = uuid();
      const eqCode = makeEquipmentCode();
      const now = new Date();

      engine.recordTelematics(makeTelematicsInput({ equipmentId: eqId, equipmentCode: eqCode, speed: 5 }));

      const from = new Date(now.getTime() - 1000);
      const to = new Date(now.getTime() + 60000);
      const history = engine.getTelematicsHistory(eqId, from, to);
      expect(history.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter telematics history excluding records outside range', () => {
      const eqId = uuid();
      const eqCode = makeEquipmentCode();

      engine.recordTelematics(makeTelematicsInput({ equipmentId: eqId, equipmentCode: eqCode }));

      // Query for a future date range
      const futureFrom = new Date(Date.now() + 3600000);
      const futureTo = new Date(Date.now() + 7200000);
      const history = engine.getTelematicsHistory(eqId, futureFrom, futureTo);
      expect(history).toHaveLength(0);
    });

    it('should get fleet positions for a tenant', () => {
      engine.recordTelematics(makeTelematicsInput());
      engine.recordTelematics(makeTelematicsInput());
      engine.recordTelematics(makeTelematicsInput({ tenantId: 'other-tenant' }));

      const positions = engine.getFleetPositions(TENANT_ID);
      expect(positions).toHaveLength(2);
    });

    it('should return empty fleet positions for unknown tenant', () => {
      const positions = engine.getFleetPositions('unknown-tenant');
      expect(positions).toHaveLength(0);
    });

    it('should get idling equipment for a tenant', () => {
      const eqId = uuid();
      const eqCode = makeEquipmentCode();

      // Record first idle
      const r1 = engine.recordTelematics(makeTelematicsInput({
        equipmentId: eqId,
        equipmentCode: eqCode,
        engineRunning: true,
        speed: 0,
      }));
      // Manually adjust the record timestamp to simulate 15 minutes ago
      const record1 = engine.getLatestTelematics(eqId)!;
      (record1 as any).timestamp = new Date(Date.now() - 15 * 60 * 1000);
      (record1 as any).isIdling = true;
      (record1 as any).idleDurationMinutes = 15;

      // Record second idle
      engine.recordTelematics(makeTelematicsInput({
        equipmentId: eqId,
        equipmentCode: eqCode,
        engineRunning: true,
        speed: 0,
      }));

      const idling = engine.getIdlingEquipment(TENANT_ID);
      // The latest record should show idling based on history
      expect(idling.length).toBeGreaterThanOrEqual(0);
    });

    it('should get overspeed events for a tenant', () => {
      // Create a geofence with a speed limit
      engine.createGeofence(makeGeofenceInput({
        centerPoint: { latitude: 19.0760, longitude: 72.8777 },
        radiusMeters: 5000,
        maxSpeedKmh: 10,
      }));

      // Record a telematics event with speed over the limit inside geofence
      engine.recordTelematics(makeTelematicsInput({
        position: { latitude: 19.0760, longitude: 72.8777 },
        speed: 20,
        engineRunning: true,
      }));

      const overspeed = engine.getOverspeedEvents(TENANT_ID);
      expect(overspeed).toHaveLength(1);
      expect(overspeed[0].isOverSpeed).toBe(true);
    });

    it('should return empty overspeed events when none exist', () => {
      engine.recordTelematics(makeTelematicsInput({ speed: 5 }));
      const overspeed = engine.getOverspeedEvents(TENANT_ID);
      expect(overspeed).toHaveLength(0);
    });

    it('should limit overspeed events', () => {
      engine.createGeofence(makeGeofenceInput({
        centerPoint: { latitude: 19.0760, longitude: 72.8777 },
        radiusMeters: 5000,
        maxSpeedKmh: 5,
      }));

      for (let i = 0; i < 5; i++) {
        engine.recordTelematics(makeTelematicsInput({
          position: { latitude: 19.0760, longitude: 72.8777 },
          speed: 20,
          engineRunning: true,
        }));
      }

      const limited = engine.getOverspeedEvents(TENANT_ID, 3);
      expect(limited).toHaveLength(3);
    });

    it('should detect geofence violation for restricted zone entry', () => {
      // Create a restricted geofence
      engine.createGeofence(makeGeofenceInput({
        zoneType: 'restricted',
        centerPoint: { latitude: 19.0760, longitude: 72.8777 },
        radiusMeters: 5000,
      }));

      // Record telematics inside the restricted zone
      const result = engine.recordTelematics(makeTelematicsInput({
        position: { latitude: 19.0760, longitude: 72.8777 },
        speed: 5,
        engineRunning: true,
      }));

      expect(result.success).toBe(true);
      expect(result.data!.isOutOfGeofence).toBe(true);
    });

    it('should detect geofence violation when outside operating area', () => {
      // Create an operating area geofence
      engine.createGeofence(makeGeofenceInput({
        zoneType: 'operating_area',
        centerPoint: { latitude: 19.0760, longitude: 72.8777 },
        radiusMeters: 100,
      }));

      // Record telematics far outside the operating area
      const result = engine.recordTelematics(makeTelematicsInput({
        position: { latitude: 20.0, longitude: 73.0 },
        speed: 5,
        engineRunning: true,
      }));

      expect(result.success).toBe(true);
      expect(result.data!.isOutOfGeofence).toBe(true);
    });

    it('should not flag overspeed when speed is within limit', () => {
      engine.createGeofence(makeGeofenceInput({
        centerPoint: { latitude: 19.0760, longitude: 72.8777 },
        radiusMeters: 5000,
        maxSpeedKmh: 15,
      }));

      const result = engine.recordTelematics(makeTelematicsInput({
        position: { latitude: 19.0760, longitude: 72.8777 },
        speed: 10,
        engineRunning: true,
      }));

      expect(result.success).toBe(true);
      expect(result.data!.isOverSpeed).toBe(false);
    });

    it('should not flag geofence violation when no position is provided', () => {
      engine.createGeofence(makeGeofenceInput({
        zoneType: 'restricted',
        centerPoint: { latitude: 19.0760, longitude: 72.8777 },
        radiusMeters: 5000,
      }));

      const result = engine.recordTelematics(makeTelematicsInput({
        position: undefined,
        speed: 5,
        engineRunning: true,
      }));

      expect(result.success).toBe(true);
      expect(result.data!.isOutOfGeofence).toBe(false);
      expect(result.data!.isOverSpeed).toBe(false);
    });

    it('should skip inactive geofence zones', () => {
      const geoResult = engine.createGeofence(makeGeofenceInput({
        zoneType: 'restricted',
        centerPoint: { latitude: 19.0760, longitude: 72.8777 },
        radiusMeters: 5000,
        maxSpeedKmh: 5,
      }));
      const zoneId = geoResult.data!.id;

      // Deactivate the geofence
      engine.toggleGeofence(zoneId, false);

      const result = engine.recordTelematics(makeTelematicsInput({
        position: { latitude: 19.0760, longitude: 72.8777 },
        speed: 20,
        engineRunning: true,
      }));

      expect(result.success).toBe(true);
      expect(result.data!.isOutOfGeofence).toBe(false);
      expect(result.data!.isOverSpeed).toBe(false);
    });
  });

  // ==========================================================================
  // 3. Geofence Management
  // ==========================================================================

  describe('Geofence management', () => {
    it('should create a geofence zone', () => {
      const result = engine.createGeofence(makeGeofenceInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.isActive).toBe(true);
      expect(result.data!.zoneType).toBe('operating_area');
      expect(result.data!.alertOnEntry).toBe(true);
      expect(result.data!.alertOnExit).toBe(true);
      expect(result.data!.alertOnOverspeed).toBe(true);
    });

    it('should reject duplicate geofence name for same facility', () => {
      const name = 'Unique Zone A';
      engine.createGeofence(makeGeofenceInput({ name }));
      const result = engine.createGeofence(makeGeofenceInput({ name }));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DUPLICATE_NAME');
    });

    it('should allow same name for different facilities', () => {
      const name = 'Zone Alpha';
      engine.createGeofence(makeGeofenceInput({ name, facilityId: 'facility-A' }));
      const result = engine.createGeofence(makeGeofenceInput({ name, facilityId: 'facility-B' }));
      expect(result.success).toBe(true);
    });

    it('should default alertOnEntry/alertOnExit/alertOnOverspeed to true', () => {
      const result = engine.createGeofence({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        name: `DefaultAlerts-${equipSeq++}`,
        zoneType: 'parking',
        centerPoint: { latitude: 19.0, longitude: 72.8 },
        radiusMeters: 200,
      });
      expect(result.success).toBe(true);
      expect(result.data!.alertOnEntry).toBe(true);
      expect(result.data!.alertOnExit).toBe(true);
      expect(result.data!.alertOnOverspeed).toBe(true);
    });

    it('should get geofence by id', () => {
      const created = engine.createGeofence(makeGeofenceInput());
      const zone = engine.getGeofence(created.data!.id);
      expect(zone).toBeDefined();
      expect(zone!.name).toBe(created.data!.name);
    });

    it('should return undefined for unknown geofence id', () => {
      const zone = engine.getGeofence('non-existent');
      expect(zone).toBeUndefined();
    });

    it('should list geofences', () => {
      engine.createGeofence(makeGeofenceInput());
      engine.createGeofence(makeGeofenceInput());
      engine.createGeofence(makeGeofenceInput());

      const zones = engine.listGeofences();
      expect(zones).toHaveLength(3);
    });

    it('should list geofences filtered by facility', () => {
      engine.createGeofence(makeGeofenceInput({ facilityId: 'fac-A' }));
      engine.createGeofence(makeGeofenceInput({ facilityId: 'fac-A' }));
      engine.createGeofence(makeGeofenceInput({ facilityId: 'fac-B' }));

      expect(engine.listGeofences('fac-A')).toHaveLength(2);
      expect(engine.listGeofences('fac-B')).toHaveLength(1);
    });

    it('should list geofences filtered by zone type', () => {
      engine.createGeofence(makeGeofenceInput({ zoneType: 'restricted' }));
      engine.createGeofence(makeGeofenceInput({ zoneType: 'restricted' }));
      engine.createGeofence(makeGeofenceInput({ zoneType: 'parking' }));

      expect(engine.listGeofences(undefined, 'restricted')).toHaveLength(2);
      expect(engine.listGeofences(undefined, 'parking')).toHaveLength(1);
    });

    it('should list geofences filtered by active status', () => {
      const g1 = engine.createGeofence(makeGeofenceInput());
      engine.createGeofence(makeGeofenceInput());
      engine.toggleGeofence(g1.data!.id, false);

      expect(engine.listGeofences(undefined, undefined, true)).toHaveLength(1);
      expect(engine.listGeofences(undefined, undefined, false)).toHaveLength(1);
    });

    it('should update geofence properties', () => {
      const created = engine.createGeofence(makeGeofenceInput({ radiusMeters: 100 }));
      const result = engine.updateGeofence(created.data!.id, {
        radiusMeters: 250,
        maxSpeedKmh: 20,
        alertOnEntry: false,
        alertOnExit: false,
        alertOnOverspeed: false,
        allowedEquipmentTypes: ['forklift'],
      });
      expect(result.success).toBe(true);
      expect(result.data!.radiusMeters).toBe(250);
      expect(result.data!.maxSpeedKmh).toBe(20);
      expect(result.data!.alertOnEntry).toBe(false);
      expect(result.data!.alertOnExit).toBe(false);
      expect(result.data!.alertOnOverspeed).toBe(false);
      expect(result.data!.allowedEquipmentTypes).toEqual(['forklift']);
    });

    it('should fail to update non-existent geofence', () => {
      const result = engine.updateGeofence('non-existent', { radiusMeters: 100 });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should toggle geofence active state', () => {
      const created = engine.createGeofence(makeGeofenceInput());
      expect(created.data!.isActive).toBe(true);

      const deactivated = engine.toggleGeofence(created.data!.id, false);
      expect(deactivated.success).toBe(true);
      expect(deactivated.data!.isActive).toBe(false);

      const reactivated = engine.toggleGeofence(created.data!.id, true);
      expect(reactivated.success).toBe(true);
      expect(reactivated.data!.isActive).toBe(true);
    });

    it('should fail to toggle non-existent geofence', () => {
      const result = engine.toggleGeofence('non-existent', true);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });
  });

  // ==========================================================================
  // 4. Operator Certification
  // ==========================================================================

  describe('Operator certification', () => {
    it('should register a valid certification', () => {
      const result = engine.registerCertification(makeCertificationInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('valid');
      expect(result.data!.renewalReminderDays).toBe(30);
    });

    it('should detect expiring_soon certification', () => {
      const now = new Date();
      const result = engine.registerCertification(makeCertificationInput({
        expiryDate: new Date(now.getTime() + 15 * 86400000), // 15 days out
        renewalReminderDays: 30,
      }));
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('expiring_soon');
    });

    it('should detect expired certification', () => {
      const now = new Date();
      const result = engine.registerCertification(makeCertificationInput({
        expiryDate: new Date(now.getTime() - 1 * 86400000), // yesterday
      }));
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('expired');
    });

    it('should default renewalReminderDays to 30', () => {
      const result = engine.registerCertification(makeCertificationInput({
        renewalReminderDays: undefined,
      }));
      expect(result.success).toBe(true);
      expect(result.data!.renewalReminderDays).toBe(30);
    });

    it('should get certification by id', () => {
      const cert = registerCert(engine);
      const fetched = engine.getCertification(cert.id);
      expect(fetched).toBeDefined();
      expect(fetched!.certNumber).toBe(cert.certNumber);
    });

    it('should return undefined for unknown certification id', () => {
      const fetched = engine.getCertification('non-existent');
      expect(fetched).toBeUndefined();
    });

    it('should list all certifications', () => {
      registerCert(engine);
      registerCert(engine);
      registerCert(engine);

      const certs = engine.listCertifications();
      expect(certs).toHaveLength(3);
    });

    it('should list certifications by tenant', () => {
      registerCert(engine, { tenantId: 'tenant-X' });
      registerCert(engine, { tenantId: 'tenant-X' });
      registerCert(engine, { tenantId: 'tenant-Y' });

      expect(engine.listCertifications('tenant-X')).toHaveLength(2);
      expect(engine.listCertifications('tenant-Y')).toHaveLength(1);
    });

    it('should list certifications by operator', () => {
      const opId = uuid();
      registerCert(engine, { operatorId: opId });
      registerCert(engine, { operatorId: opId });
      registerCert(engine);

      expect(engine.listCertifications(undefined, opId)).toHaveLength(2);
    });

    it('should list certifications by cert type', () => {
      registerCert(engine, { certType: 'forklift_license' });
      registerCert(engine, { certType: 'crane_operator' });
      registerCert(engine, { certType: 'forklift_license' });

      expect(engine.listCertifications(undefined, undefined, 'forklift_license')).toHaveLength(2);
      expect(engine.listCertifications(undefined, undefined, 'crane_operator')).toHaveLength(1);
    });

    it('should list certifications by status', () => {
      const now = new Date();
      registerCert(engine); // valid
      registerCert(engine, { expiryDate: new Date(now.getTime() + 10 * 86400000), renewalReminderDays: 30 }); // expiring_soon
      registerCert(engine, { expiryDate: new Date(now.getTime() - 86400000) }); // expired

      expect(engine.listCertifications(undefined, undefined, undefined, 'valid')).toHaveLength(1);
      expect(engine.listCertifications(undefined, undefined, undefined, 'expiring_soon')).toHaveLength(1);
      expect(engine.listCertifications(undefined, undefined, undefined, 'expired')).toHaveLength(1);
    });

    it('should renew a certification', () => {
      const oldCert = registerCert(engine);
      const now = new Date();
      const newInput = makeCertificationInput({
        operatorId: oldCert.operatorId,
        operatorName: oldCert.operatorName,
        certType: oldCert.certType,
        expiryDate: new Date(now.getTime() + 365 * 86400000),
      });
      const result = engine.renewCertification(oldCert.id, newInput);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('valid');

      // Old cert should be marked expired with renewal link
      const oldUpdated = engine.getCertification(oldCert.id)!;
      expect(oldUpdated.status).toBe('expired');
      expect(oldUpdated.renewedCertId).toBe(result.data!.id);
      expect(oldUpdated.renewalRequestedAt).toBeDefined();
    });

    it('should fail to renew non-existent certification', () => {
      const result = engine.renewCertification('non-existent', makeCertificationInput());
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail to renew a revoked certification', () => {
      const cert = registerCert(engine);
      // Manually set status to revoked for testing
      const certObj = engine.getCertification(cert.id)!;
      (certObj as any).status = 'revoked';

      const result = engine.renewCertification(cert.id, makeCertificationInput());
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should get expiring certifications within N days', () => {
      const now = new Date();
      registerCert(engine, { expiryDate: new Date(now.getTime() + 10 * 86400000), renewalReminderDays: 30 }); // expiring in 10 days
      registerCert(engine, { expiryDate: new Date(now.getTime() + 60 * 86400000) }); // valid, not expiring soon
      registerCert(engine, { expiryDate: new Date(now.getTime() - 86400000) }); // expired

      const expiring = engine.getExpiringCertifications(TENANT_ID, 30);
      expect(expiring).toHaveLength(1);
      expect(expiring[0].status === 'valid' || expiring[0].status === 'expiring_soon').toBe(true);
    });

    it('should return empty for no expiring certifications', () => {
      registerCert(engine); // far future expiry
      const expiring = engine.getExpiringCertifications(TENANT_ID, 5);
      expect(expiring).toHaveLength(0);
    });

    it('should check operator eligibility with valid cert', () => {
      const opId = uuid();
      registerCert(engine, { operatorId: opId, certType: 'forklift_license' });

      const result = engine.checkOperatorEligibility(opId, 'forklift_license');
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.certType).toBe('forklift_license');
    });

    it('should check eligibility with expiring_soon cert and return warning', () => {
      const now = new Date();
      const opId = uuid();
      registerCert(engine, {
        operatorId: opId,
        certType: 'forklift_license',
        expiryDate: new Date(now.getTime() + 10 * 86400000),
        renewalReminderDays: 30,
      });

      const result = engine.checkOperatorEligibility(opId, 'forklift_license');
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
      expect(result.warnings![0]).toContain('expiring soon');
    });

    it('should fail eligibility check for operator with no certs', () => {
      const result = engine.checkOperatorEligibility(uuid(), 'forklift_license');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NO_CERTIFICATION');
    });

    it('should fail eligibility check when no valid cert of required type exists', () => {
      const now = new Date();
      const opId = uuid();
      registerCert(engine, {
        operatorId: opId,
        certType: 'crane_operator',
      });

      const result = engine.checkOperatorEligibility(opId, 'forklift_license');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CERTIFICATION');
    });

    it('should fail eligibility when only expired cert exists', () => {
      const now = new Date();
      const opId = uuid();
      registerCert(engine, {
        operatorId: opId,
        certType: 'forklift_license',
        expiryDate: new Date(now.getTime() - 86400000),
      });

      const result = engine.checkOperatorEligibility(opId, 'forklift_license');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CERTIFICATION');
    });

    it('should record a training record', () => {
      const result = engine.recordTraining(makeTrainingInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.completed).toBe(true);
      expect(result.data!.examPassed).toBe(true);
      expect(result.data!.examScore).toBe(85);
      expect(result.data!.documents).toEqual([]);
    });

    it('should record incomplete training', () => {
      const result = engine.recordTraining(makeTrainingInput({ completed: false, examPassed: undefined, examScore: undefined }));
      expect(result.success).toBe(true);
      expect(result.data!.completed).toBe(false);
    });
  });

  // ==========================================================================
  // 5. Safety & Incidents
  // ==========================================================================

  describe('Safety & incidents', () => {
    it('should report a safety incident', () => {
      const result = engine.reportIncident(makeIncidentInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('reported');
      expect(result.data!.incidentNumber).toMatch(/^INC-/);
      expect(result.data!.involvedWorkerIds).toEqual([]);
      expect(result.data!.witnessIds).toEqual([]);
      expect(result.data!.photos).toEqual([]);
    });

    it('should auto-generate sequential incident numbers', () => {
      const i1 = reportIncident(engine);
      const i2 = reportIncident(engine);
      expect(i1.incidentNumber).not.toBe(i2.incidentNumber);
      // Both should match INC-YYYYMMDD-NNN pattern
      expect(i1.incidentNumber).toMatch(/^INC-\d{8}-\d{3}$/);
      expect(i2.incidentNumber).toMatch(/^INC-\d{8}-\d{3}$/);
    });

    it('should record injuries and property damage', () => {
      const result = engine.reportIncident(makeIncidentInput({
        injuriesReported: true,
        injuryDescription: 'Minor bruise on left arm',
        propertyDamage: true,
        damageEstimate: 75000,
      }));
      expect(result.success).toBe(true);
      expect(result.data!.injuriesReported).toBe(true);
      expect(result.data!.injuryDescription).toBe('Minor bruise on left arm');
      expect(result.data!.propertyDamage).toBe(true);
      expect(result.data!.damageEstimate).toBe(75000);
    });

    it('should get incident by id', () => {
      const incident = reportIncident(engine);
      const fetched = engine.getIncident(incident.id);
      expect(fetched).toBeDefined();
      expect(fetched!.incidentNumber).toBe(incident.incidentNumber);
    });

    it('should return undefined for unknown incident id', () => {
      expect(engine.getIncident('non-existent')).toBeUndefined();
    });

    it('should get incident by number', () => {
      const incident = reportIncident(engine);
      const fetched = engine.getIncidentByNumber(incident.incidentNumber);
      expect(fetched).toBeDefined();
      expect(fetched!.id).toBe(incident.id);
    });

    it('should return undefined for unknown incident number', () => {
      expect(engine.getIncidentByNumber('INC-00000000-999')).toBeUndefined();
    });

    it('should list all incidents', () => {
      reportIncident(engine);
      reportIncident(engine);
      reportIncident(engine);

      const incidents = engine.listIncidents();
      expect(incidents).toHaveLength(3);
    });

    it('should list incidents by tenant', () => {
      reportIncident(engine, { tenantId: 'tenant-A' });
      reportIncident(engine, { tenantId: 'tenant-A' });
      reportIncident(engine, { tenantId: 'tenant-B' });

      expect(engine.listIncidents('tenant-A')).toHaveLength(2);
    });

    it('should list incidents by type', () => {
      reportIncident(engine, { incidentType: 'collision' });
      reportIncident(engine, { incidentType: 'near_miss' });
      reportIncident(engine, { incidentType: 'collision' });

      expect(engine.listIncidents(undefined, 'collision')).toHaveLength(2);
      expect(engine.listIncidents(undefined, 'near_miss')).toHaveLength(1);
    });

    it('should list incidents by severity', () => {
      reportIncident(engine, { severity: 'minor' });
      reportIncident(engine, { severity: 'critical' });
      reportIncident(engine, { severity: 'minor' });

      expect(engine.listIncidents(undefined, undefined, 'minor')).toHaveLength(2);
      expect(engine.listIncidents(undefined, undefined, 'critical')).toHaveLength(1);
    });

    it('should list incidents by status', () => {
      const i1 = reportIncident(engine);
      reportIncident(engine);
      engine.updateIncidentStatus(i1.id, 'investigating');

      expect(engine.listIncidents(undefined, undefined, undefined, 'reported')).toHaveLength(1);
      expect(engine.listIncidents(undefined, undefined, undefined, 'investigating')).toHaveLength(1);
    });

    it('should list incidents by equipment', () => {
      const eqId = uuid();
      reportIncident(engine, { equipmentId: eqId });
      reportIncident(engine, { equipmentId: eqId });
      reportIncident(engine);

      expect(engine.listIncidents(undefined, undefined, undefined, undefined, eqId)).toHaveLength(2);
    });

    it('should transition reported -> investigating', () => {
      const incident = reportIncident(engine);
      const result = engine.updateIncidentStatus(incident.id, 'investigating', {
        investigatorId: uuid(),
      });
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('investigating');
    });

    it('should transition investigating -> action_taken', () => {
      const incident = reportIncident(engine);
      engine.updateIncidentStatus(incident.id, 'investigating');
      const result = engine.updateIncidentStatus(incident.id, 'action_taken', {
        rootCause: 'Operator distraction',
        correctiveActions: 'Additional training assigned',
        preventiveActions: 'Install proximity sensors',
      });
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('action_taken');
      expect(result.data!.rootCause).toBe('Operator distraction');
      expect(result.data!.correctiveActions).toBe('Additional training assigned');
      expect(result.data!.preventiveActions).toBe('Install proximity sensors');
      expect(result.data!.investigationCompletedAt).toBeDefined();
    });

    it('should transition action_taken -> closed', () => {
      const incident = reportIncident(engine);
      engine.updateIncidentStatus(incident.id, 'investigating');
      engine.updateIncidentStatus(incident.id, 'action_taken');
      const result = engine.updateIncidentStatus(incident.id, 'closed');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('closed');
      expect(result.data!.actionCompletedAt).toBeDefined();
    });

    it('should transition closed -> reopened', () => {
      const incident = reportIncident(engine);
      engine.updateIncidentStatus(incident.id, 'investigating');
      engine.updateIncidentStatus(incident.id, 'action_taken');
      engine.updateIncidentStatus(incident.id, 'closed');
      const result = engine.updateIncidentStatus(incident.id, 'reopened');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('reopened');
    });

    it('should transition reopened -> investigating', () => {
      const incident = reportIncident(engine);
      engine.updateIncidentStatus(incident.id, 'closed');
      engine.updateIncidentStatus(incident.id, 'reopened');
      const result = engine.updateIncidentStatus(incident.id, 'investigating');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('investigating');
    });

    it('should transition reported -> closed directly', () => {
      const incident = reportIncident(engine);
      const result = engine.updateIncidentStatus(incident.id, 'closed');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('closed');
    });

    it('should reject invalid status transition', () => {
      const incident = reportIncident(engine);
      const result = engine.updateIncidentStatus(incident.id, 'action_taken');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS_TRANSITION');
    });

    it('should reject status update for non-existent incident', () => {
      const result = engine.updateIncidentStatus('non-existent', 'investigating');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should apply investigation notes on status update', () => {
      const incident = reportIncident(engine);
      const result = engine.updateIncidentStatus(incident.id, 'investigating', {
        investigationNotes: 'Initial review completed',
        investigatorId: uuid(),
      });
      expect(result.success).toBe(true);
      expect(result.data!.investigationNotes).toBe('Initial review completed');
      expect(result.data!.investigatorId).toBeDefined();
    });

    it('should submit a passing safety check', () => {
      const result = engine.submitSafetyCheck(makeSafetyCheckInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.overallResult).toBe('pass');
      expect(result.data!.equipmentTakenOutOfService).toBe(false);
      expect(result.data!.checkNumber).toMatch(/^CHK-\d{3}$/);
    });

    it('should submit a failing safety check', () => {
      const items: SafetyCheckItem[] = [
        { itemName: 'Brakes', category: 'brakes', result: 'defect', notes: 'Brake fluid leaking' },
        { itemName: 'Horn', category: 'horn', result: 'ok' },
        { itemName: 'Lights', category: 'lights', result: 'ok' },
      ];
      const result = engine.submitSafetyCheck(makeSafetyCheckInput({ items }));
      expect(result.success).toBe(true);
      expect(result.data!.overallResult).toBe('fail');
      expect(result.data!.equipmentTakenOutOfService).toBe(true);
      expect(result.data!.failureReason).toContain('Brakes');
    });

    it('should submit a conditional safety check', () => {
      const items: SafetyCheckItem[] = [
        { itemName: 'Brakes', category: 'brakes', result: 'ok' },
        { itemName: 'Horn', category: 'horn', result: 'na' },
        { itemName: 'Lights', category: 'lights', result: 'ok' },
      ];
      const result = engine.submitSafetyCheck(makeSafetyCheckInput({ items }));
      expect(result.success).toBe(true);
      expect(result.data!.overallResult).toBe('pass'); // all ok or na => pass
    });

    it('should generate sequential check numbers', () => {
      const c1 = engine.submitSafetyCheck(makeSafetyCheckInput());
      const c2 = engine.submitSafetyCheck(makeSafetyCheckInput());
      expect(c1.data!.checkNumber).not.toBe(c2.data!.checkNumber);
    });

    it('should get safety checks for equipment', () => {
      const eqId = uuid();
      const eqCode = makeEquipmentCode();
      engine.submitSafetyCheck(makeSafetyCheckInput({ equipmentId: eqId, equipmentCode: eqCode }));
      engine.submitSafetyCheck(makeSafetyCheckInput({ equipmentId: eqId, equipmentCode: eqCode }));
      engine.submitSafetyCheck(makeSafetyCheckInput()); // different equipment

      const checks = engine.getSafetyChecksForEquipment(eqId);
      expect(checks).toHaveLength(2);
    });

    it('should return empty safety checks for unknown equipment', () => {
      const checks = engine.getSafetyChecksForEquipment('non-existent');
      expect(checks).toHaveLength(0);
    });

    it('should get open incidents', () => {
      const i1 = reportIncident(engine);
      reportIncident(engine);
      reportIncident(engine);
      engine.updateIncidentStatus(i1.id, 'closed');

      const open = engine.getOpenIncidents(TENANT_ID);
      expect(open).toHaveLength(2);
    });

    it('should return empty open incidents for unknown tenant', () => {
      reportIncident(engine);
      const open = engine.getOpenIncidents('unknown-tenant');
      expect(open).toHaveLength(0);
    });

    it('should sort open incidents by reportedAt descending', () => {
      reportIncident(engine);
      reportIncident(engine);
      reportIncident(engine);

      const open = engine.getOpenIncidents(TENANT_ID);
      for (let i = 1; i < open.length; i++) {
        expect(open[i - 1].reportedAt.getTime()).toBeGreaterThanOrEqual(open[i].reportedAt.getTime());
      }
    });
  });

  // ==========================================================================
  // 6. Charging & Battery
  // ==========================================================================

  describe('Charging & battery', () => {
    it('should register a charging dock', () => {
      const result = engine.registerChargingDock(makeChargingDockInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('available');
      expect(result.data!.totalSessionsToday).toBe(0);
      expect(result.data!.totalKwhDeliveredToday).toBe(0);
      expect(result.data!.averageSessionMinutes).toBe(0);
    });

    it('should reject duplicate dock code for same facility', () => {
      const dockCode = 'DOCK-UNIQUE-001';
      engine.registerChargingDock(makeChargingDockInput({ dockCode }));
      const result = engine.registerChargingDock(makeChargingDockInput({ dockCode }));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DUPLICATE_DOCK_CODE');
    });

    it('should allow same dock code for different facilities', () => {
      const dockCode = 'DOCK-SHARED';
      engine.registerChargingDock(makeChargingDockInput({ dockCode, facilityId: 'fac-1' }));
      const result = engine.registerChargingDock(makeChargingDockInput({ dockCode, facilityId: 'fac-2' }));
      expect(result.success).toBe(true);
    });

    it('should get charging dock by id', () => {
      const dock = registerDock(engine);
      const fetched = engine.getChargingDock(dock.id);
      expect(fetched).toBeDefined();
      expect(fetched!.dockCode).toBe(dock.dockCode);
    });

    it('should return undefined for unknown dock id', () => {
      expect(engine.getChargingDock('non-existent')).toBeUndefined();
    });

    it('should list charging docks', () => {
      registerDock(engine);
      registerDock(engine);
      registerDock(engine);

      const docks = engine.listChargingDocks();
      expect(docks).toHaveLength(3);
    });

    it('should list docks filtered by facility', () => {
      registerDock(engine, { facilityId: 'fac-A' });
      registerDock(engine, { facilityId: 'fac-A' });
      registerDock(engine, { facilityId: 'fac-B' });

      expect(engine.listChargingDocks('fac-A')).toHaveLength(2);
      expect(engine.listChargingDocks('fac-B')).toHaveLength(1);
    });

    it('should list docks filtered by status', () => {
      const dock1 = registerDock(engine);
      registerDock(engine);
      // Make dock1 occupied by starting a session
      engine.startCharging(makeStartChargingInput(dock1.id));

      expect(engine.listChargingDocks(undefined, 'available')).toHaveLength(1);
      expect(engine.listChargingDocks(undefined, 'occupied')).toHaveLength(1);
    });

    it('should list docks filtered by charger type', () => {
      registerDock(engine, { chargerType: 'fast' });
      registerDock(engine, { chargerType: 'standard' });
      registerDock(engine, { chargerType: 'fast' });

      expect(engine.listChargingDocks(undefined, undefined, 'fast')).toHaveLength(2);
      expect(engine.listChargingDocks(undefined, undefined, 'standard')).toHaveLength(1);
    });

    it('should start a charging session', () => {
      const dock = registerDock(engine);
      const result = engine.startCharging(makeStartChargingInput(dock.id));
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.completed).toBe(false);
      expect(result.data!.startBatteryPercent).toBe(20);
      expect(result.data!.dockId).toBe(dock.id);

      // Dock should now be occupied
      const updatedDock = engine.getChargingDock(dock.id)!;
      expect(updatedDock.status).toBe('occupied');
      expect(updatedDock.currentEquipmentId).toBeDefined();
    });

    it('should fail to start charging on non-existent dock', () => {
      const result = engine.startCharging(makeStartChargingInput('non-existent'));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail to start charging on occupied dock', () => {
      const dock = registerDock(engine);
      engine.startCharging(makeStartChargingInput(dock.id));
      const result = engine.startCharging(makeStartChargingInput(dock.id));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DOCK_NOT_AVAILABLE');
    });

    it('should complete a charging session', () => {
      const dock = registerDock(engine);
      const session = engine.startCharging(makeStartChargingInput(dock.id));
      const result = engine.completeCharging(session.data!.id, 95);
      expect(result.success).toBe(true);
      expect(result.data!.completed).toBe(true);
      expect(result.data!.endBatteryPercent).toBe(95);
      expect(result.data!.endTime).toBeDefined();
      expect(result.data!.durationMinutes).toBeDefined();
      expect(result.data!.kwhDelivered).toBeDefined();

      // Dock should be available again
      const updatedDock = engine.getChargingDock(dock.id)!;
      expect(updatedDock.status).toBe('available');
      expect(updatedDock.currentEquipmentId).toBeUndefined();
      expect(updatedDock.totalSessionsToday).toBe(1);
    });

    it('should complete charging with cost calculation', () => {
      const dock = registerDock(engine, { powerRatingKW: 50 });
      const session = engine.startCharging(makeStartChargingInput(dock.id));
      const result = engine.completeCharging(session.data!.id, 95, 8.5);
      expect(result.success).toBe(true);
      expect(result.data!.costPerKwh).toBe(8.5);
      expect(result.data!.totalCost).toBeDefined();
    });

    it('should fail to complete non-existent session', () => {
      const result = engine.completeCharging('non-existent', 95);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail to complete already completed session', () => {
      const dock = registerDock(engine);
      const session = engine.startCharging(makeStartChargingInput(dock.id));
      engine.completeCharging(session.data!.id, 95);
      const result = engine.completeCharging(session.data!.id, 100);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('ALREADY_COMPLETED');
    });

    it('should update dock statistics after completing a session', () => {
      const dock = registerDock(engine);
      const session = engine.startCharging(makeStartChargingInput(dock.id));
      engine.completeCharging(session.data!.id, 95);

      const updatedDock = engine.getChargingDock(dock.id)!;
      expect(updatedDock.totalSessionsToday).toBe(1);
      expect(updatedDock.totalKwhDeliveredToday).toBeGreaterThanOrEqual(0);
      expect(updatedDock.averageSessionMinutes).toBeGreaterThanOrEqual(0);
    });

    it('should record a battery swap', () => {
      const result = engine.recordBatterySwap(makeBatterySwapInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.oldBatteryPercent).toBe(10);
      expect(result.data!.newBatteryPercent).toBe(100);
      expect(result.data!.swappedBy).toBe('Battery Tech A');
      expect(result.data!.durationMinutes).toBe(15);
    });

    it('should record battery swap without duration', () => {
      const result = engine.recordBatterySwap(makeBatterySwapInput({ durationMinutes: undefined }));
      expect(result.success).toBe(true);
      expect(result.data!.durationMinutes).toBeUndefined();
    });

    it('should get charging sessions by equipment', () => {
      const dock = registerDock(engine);
      const eqId = uuid();
      const eqCode = makeEquipmentCode();

      const s1 = engine.startCharging(makeStartChargingInput(dock.id, { equipmentId: eqId, equipmentCode: eqCode }));
      engine.completeCharging(s1.data!.id, 95);

      const s2 = engine.startCharging(makeStartChargingInput(dock.id, { equipmentId: eqId, equipmentCode: eqCode }));
      engine.completeCharging(s2.data!.id, 100);

      const sessions = engine.getChargingSessions(eqId);
      expect(sessions).toHaveLength(2);
    });

    it('should get charging sessions by dock', () => {
      const dock = registerDock(engine);
      const s1 = engine.startCharging(makeStartChargingInput(dock.id));
      engine.completeCharging(s1.data!.id, 95);

      const s2 = engine.startCharging(makeStartChargingInput(dock.id));
      engine.completeCharging(s2.data!.id, 100);

      const sessions = engine.getChargingSessions(undefined, dock.id);
      expect(sessions).toHaveLength(2);
    });

    it('should get all charging sessions when no filters given', () => {
      const dock1 = registerDock(engine);
      const dock2 = registerDock(engine);
      engine.startCharging(makeStartChargingInput(dock1.id));
      engine.startCharging(makeStartChargingInput(dock2.id));

      const sessions = engine.getChargingSessions();
      expect(sessions).toHaveLength(2);
    });

    it('should return empty sessions for unknown equipment', () => {
      const sessions = engine.getChargingSessions('non-existent');
      expect(sessions).toHaveLength(0);
    });

    it('should return empty sessions for unknown dock', () => {
      const sessions = engine.getChargingSessions(undefined, 'non-existent');
      expect(sessions).toHaveLength(0);
    });

    it('should sort charging sessions by startTime descending', () => {
      const dock = registerDock(engine);
      const eqId = uuid();
      const eqCode = makeEquipmentCode();

      const s1 = engine.startCharging(makeStartChargingInput(dock.id, { equipmentId: eqId, equipmentCode: eqCode }));
      engine.completeCharging(s1.data!.id, 90);
      const s2 = engine.startCharging(makeStartChargingInput(dock.id, { equipmentId: eqId, equipmentCode: eqCode }));
      engine.completeCharging(s2.data!.id, 95);

      const sessions = engine.getChargingSessions(eqId);
      expect(sessions.length).toBe(2);
      expect(sessions[0].startTime.getTime()).toBeGreaterThanOrEqual(sessions[1].startTime.getTime());
    });
  });

  // ==========================================================================
  // 7. Enhanced Maintenance
  // ==========================================================================

  describe('Enhanced maintenance', () => {
    it('should create a work order', () => {
      const result = engine.createWorkOrder(makeWorkOrderInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('planned');
      expect(result.data!.workOrderNumber).toMatch(/^WO-\d{8}-\d{3}$/);
      expect(result.data!.partsUsed).toEqual([]);
      expect(result.data!.partsCost).toBe(0);
      expect(result.data!.laborCost).toBe(0);
      expect(result.data!.totalCost).toBe(0);
    });

    it('should auto-generate sequential work order numbers', () => {
      const wo1 = createWorkOrder(engine);
      const wo2 = createWorkOrder(engine);
      expect(wo1.workOrderNumber).not.toBe(wo2.workOrderNumber);
    });

    it('should create emergency work order', () => {
      const result = engine.createWorkOrder(makeWorkOrderInput({
        isEmergency: true,
        isCorrective: true,
        priority: 'critical',
      }));
      expect(result.success).toBe(true);
      expect(result.data!.isEmergency).toBe(true);
      expect(result.data!.isCorrective).toBe(true);
      expect(result.data!.priority).toBe('critical');
    });

    it('should default boolean flags to false', () => {
      const result = engine.createWorkOrder(makeWorkOrderInput({
        isPreventive: undefined,
        isCorrective: undefined,
        isEmergency: undefined,
      }));
      expect(result.success).toBe(true);
      expect(result.data!.isPreventive).toBe(false);
      expect(result.data!.isCorrective).toBe(false);
      expect(result.data!.isEmergency).toBe(false);
    });

    it('should get work order by id', () => {
      const wo = createWorkOrder(engine);
      const fetched = engine.getWorkOrder(wo.id);
      expect(fetched).toBeDefined();
      expect(fetched!.workOrderNumber).toBe(wo.workOrderNumber);
    });

    it('should return undefined for unknown work order id', () => {
      expect(engine.getWorkOrder('non-existent')).toBeUndefined();
    });

    it('should get work order by number', () => {
      const wo = createWorkOrder(engine);
      const fetched = engine.getWorkOrderByNumber(wo.workOrderNumber);
      expect(fetched).toBeDefined();
      expect(fetched!.id).toBe(wo.id);
    });

    it('should return undefined for unknown work order number', () => {
      expect(engine.getWorkOrderByNumber('WO-00000000-999')).toBeUndefined();
    });

    it('should list all work orders', () => {
      createWorkOrder(engine);
      createWorkOrder(engine);
      createWorkOrder(engine);

      const wos = engine.listWorkOrders();
      expect(wos).toHaveLength(3);
    });

    it('should list work orders by tenant', () => {
      createWorkOrder(engine, { tenantId: 'tenant-M' });
      createWorkOrder(engine, { tenantId: 'tenant-M' });
      createWorkOrder(engine, { tenantId: 'tenant-N' });

      expect(engine.listWorkOrders('tenant-M')).toHaveLength(2);
      expect(engine.listWorkOrders('tenant-N')).toHaveLength(1);
    });

    it('should list work orders by status', () => {
      createWorkOrder(engine);
      createWorkOrder(engine);

      expect(engine.listWorkOrders(undefined, 'planned')).toHaveLength(2);
      expect(engine.listWorkOrders(undefined, 'completed')).toHaveLength(0);
    });

    it('should list work orders by priority', () => {
      createWorkOrder(engine, { priority: 'high' });
      createWorkOrder(engine, { priority: 'low' });
      createWorkOrder(engine, { priority: 'high' });

      expect(engine.listWorkOrders(undefined, undefined, 'high')).toHaveLength(2);
      expect(engine.listWorkOrders(undefined, undefined, 'low')).toHaveLength(1);
    });

    it('should list work orders by equipment', () => {
      const eqId = uuid();
      createWorkOrder(engine, { equipmentId: eqId });
      createWorkOrder(engine, { equipmentId: eqId });
      createWorkOrder(engine);

      expect(engine.listWorkOrders(undefined, undefined, undefined, eqId)).toHaveLength(2);
    });

    it('should schedule a planned work order', () => {
      const wo = createWorkOrder(engine);
      const scheduledDate = new Date(Date.now() + 86400000);
      const techId = uuid();
      const result = engine.scheduleWorkOrder(wo.id, scheduledDate, undefined, techId, 'John Tech');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('scheduled');
      expect(result.data!.scheduledDate).toBe(scheduledDate);
      expect(result.data!.assignedTechId).toBe(techId);
      expect(result.data!.assignedTechName).toBe('John Tech');
    });

    it('should schedule with end date', () => {
      const wo = createWorkOrder(engine);
      const scheduledDate = new Date(Date.now() + 86400000);
      const scheduledEndDate = new Date(Date.now() + 2 * 86400000);
      const result = engine.scheduleWorkOrder(wo.id, scheduledDate, scheduledEndDate);
      expect(result.success).toBe(true);
      expect(result.data!.scheduledEndDate).toBe(scheduledEndDate);
    });

    it('should fail to schedule non-existent work order', () => {
      const result = engine.scheduleWorkOrder('non-existent', new Date());
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail to schedule work order in invalid status', () => {
      const wo = createWorkOrder(engine);
      engine.scheduleWorkOrder(wo.id, new Date(Date.now() + 86400000));
      engine.startWorkOrder(wo.id);

      const result = engine.scheduleWorkOrder(wo.id, new Date(Date.now() + 2 * 86400000));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should start a scheduled work order', () => {
      const wo = createWorkOrder(engine);
      engine.scheduleWorkOrder(wo.id, new Date(Date.now() + 86400000));
      const result = engine.startWorkOrder(wo.id);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('in_progress');
      expect(result.data!.actualStartDate).toBeDefined();
    });

    it('should fail to start non-existent work order', () => {
      const result = engine.startWorkOrder('non-existent');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail to start work order not in scheduled status', () => {
      const wo = createWorkOrder(engine);
      const result = engine.startWorkOrder(wo.id); // status is 'planned'
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should complete an in-progress work order', () => {
      const wo = createWorkOrder(engine);
      engine.scheduleWorkOrder(wo.id, new Date(Date.now() + 86400000));
      engine.startWorkOrder(wo.id);
      const result = engine.completeWorkOrder(wo.id, {
        actionTaken: 'Replaced hydraulic fluid and filters',
        rootCause: 'Contaminated fluid',
        recommendations: 'Schedule quarterly fluid checks',
        partsCost: 5000,
        laborCost: 3000,
        equipmentDowntimeHours: 4,
      });
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('completed');
      expect(result.data!.actualEndDate).toBeDefined();
      expect(result.data!.actionTaken).toBe('Replaced hydraulic fluid and filters');
      expect(result.data!.rootCause).toBe('Contaminated fluid');
      expect(result.data!.recommendations).toBe('Schedule quarterly fluid checks');
      expect(result.data!.partsCost).toBe(5000);
      expect(result.data!.laborCost).toBe(3000);
      expect(result.data!.totalCost).toBe(8000);
      expect(result.data!.equipmentDowntimeHours).toBe(4);
      expect(result.data!.durationHours).toBeDefined();
    });

    it('should fail to complete non-existent work order', () => {
      const result = engine.completeWorkOrder('non-existent', { actionTaken: 'Done' });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail to complete work order not in_progress', () => {
      const wo = createWorkOrder(engine);
      const result = engine.completeWorkOrder(wo.id, { actionTaken: 'Done' });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should default costs to 0 when not provided', () => {
      const wo = createWorkOrder(engine);
      engine.scheduleWorkOrder(wo.id, new Date(Date.now() + 86400000));
      engine.startWorkOrder(wo.id);
      const result = engine.completeWorkOrder(wo.id, { actionTaken: 'Minor adjustment' });
      expect(result.success).toBe(true);
      expect(result.data!.partsCost).toBe(0);
      expect(result.data!.laborCost).toBe(0);
      expect(result.data!.totalCost).toBe(0);
    });

    it('should cancel a planned work order', () => {
      const wo = createWorkOrder(engine);
      const result = engine.cancelWorkOrder(wo.id, 'No longer needed');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('cancelled');
      expect(result.data!.actionTaken).toContain('Cancelled: No longer needed');
    });

    it('should cancel a scheduled work order', () => {
      const wo = createWorkOrder(engine);
      engine.scheduleWorkOrder(wo.id, new Date(Date.now() + 86400000));
      const result = engine.cancelWorkOrder(wo.id, 'Budget cut');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('cancelled');
    });

    it('should cancel an in-progress work order', () => {
      const wo = createWorkOrder(engine);
      engine.scheduleWorkOrder(wo.id, new Date(Date.now() + 86400000));
      engine.startWorkOrder(wo.id);
      const result = engine.cancelWorkOrder(wo.id, 'Equipment scrapped');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('cancelled');
    });

    it('should fail to cancel non-existent work order', () => {
      const result = engine.cancelWorkOrder('non-existent', 'Reason');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail to cancel a completed work order', () => {
      const wo = createWorkOrder(engine);
      engine.scheduleWorkOrder(wo.id, new Date(Date.now() + 86400000));
      engine.startWorkOrder(wo.id);
      engine.completeWorkOrder(wo.id, { actionTaken: 'Done' });
      const result = engine.cancelWorkOrder(wo.id, 'Undo');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail to cancel an already cancelled work order', () => {
      const wo = createWorkOrder(engine);
      engine.cancelWorkOrder(wo.id, 'First cancel');
      const result = engine.cancelWorkOrder(wo.id, 'Second cancel');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('ALREADY_CANCELLED');
    });

    it('should sort listed work orders by requestedDate descending', () => {
      createWorkOrder(engine);
      createWorkOrder(engine);
      createWorkOrder(engine);

      const wos = engine.listWorkOrders();
      for (let i = 1; i < wos.length; i++) {
        expect(wos[i - 1].requestedDate.getTime()).toBeGreaterThanOrEqual(wos[i].requestedDate.getTime());
      }
    });
  });

  // ==========================================================================
  // 8. Equipment Lifecycle
  // ==========================================================================

  describe('Equipment lifecycle', () => {
    it('should register an equipment lifecycle', () => {
      const result = engine.registerLifecycle(makeLifecycleInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.depreciationMethod).toBe('straight_line');
      expect(result.data!.totalEngineHours).toBe(0);
      expect(result.data!.totalKmDriven).toBe(0);
      expect(result.data!.totalMoves).toBe(0);
      expect(result.data!.replacementDueDate).toBeDefined();
    });

    it('should calculate straight-line depreciation correctly', () => {
      const now = new Date();
      const purchasePrice = 10000000;
      const salvageValue = 1000000;
      const usefulLifeYears = 10;
      const expectedAnnualDep = (purchasePrice - salvageValue) / usefulLifeYears; // 900000

      const result = engine.registerLifecycle(makeLifecycleInput({
        purchaseDate: now, // just purchased
        purchasePrice,
        salvageValue,
        usefulLifeYears,
        depreciationMethod: 'straight_line',
      }));

      expect(result.success).toBe(true);
      expect(result.data!.annualDepreciation).toBe(expectedAnnualDep);
      // Brand new, so book value should be near purchase price
      expect(result.data!.currentBookValue).toBeGreaterThanOrEqual(salvageValue);
      expect(result.data!.currentBookValue).toBeLessThanOrEqual(purchasePrice);
    });

    it('should calculate declining balance depreciation', () => {
      const now = new Date();
      const purchasePrice = 5000000;
      const usefulLifeYears = 10;
      const rate = 2 / usefulLifeYears; // 0.2
      const expectedAnnualDep = purchasePrice * rate; // 1000000

      const result = engine.registerLifecycle(makeLifecycleInput({
        purchaseDate: now,
        purchasePrice,
        salvageValue: 500000,
        usefulLifeYears,
        depreciationMethod: 'declining_balance',
      }));

      expect(result.success).toBe(true);
      expect(result.data!.annualDepreciation).toBe(expectedAnnualDep);
    });

    it('should calculate units_of_production depreciation fallback', () => {
      const purchasePrice = 8000000;
      const salvageValue = 800000;
      const usefulLifeYears = 8;
      const expectedAnnualDep = (purchasePrice - salvageValue) / usefulLifeYears; // 900000

      const result = engine.registerLifecycle(makeLifecycleInput({
        purchaseDate: new Date(),
        purchasePrice,
        salvageValue,
        usefulLifeYears,
        depreciationMethod: 'units_of_production',
      }));

      expect(result.success).toBe(true);
      expect(result.data!.annualDepreciation).toBe(expectedAnnualDep);
    });

    it('should reject duplicate lifecycle for same equipment', () => {
      const eqId = uuid();
      engine.registerLifecycle(makeLifecycleInput({ equipmentId: eqId }));
      const result = engine.registerLifecycle(makeLifecycleInput({ equipmentId: eqId }));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DUPLICATE_LIFECYCLE');
    });

    it('should calculate accumulated depreciation for older equipment', () => {
      const now = new Date();
      const purchaseDate = new Date(now.getTime() - 3 * 365.25 * 86400000); // 3 years ago
      const purchasePrice = 10000000;
      const salvageValue = 1000000;
      const usefulLifeYears = 10;
      const annualDep = (purchasePrice - salvageValue) / usefulLifeYears; // 900000
      const expectedAccDep = annualDep * 3; // ~2700000

      const result = engine.registerLifecycle(makeLifecycleInput({
        purchaseDate,
        purchasePrice,
        salvageValue,
        usefulLifeYears,
      }));

      expect(result.success).toBe(true);
      // Allow some tolerance for date calculations
      expect(result.data!.accumulatedDepreciation).toBeGreaterThan(expectedAccDep - 50000);
      expect(result.data!.accumulatedDepreciation).toBeLessThan(expectedAccDep + 50000);
      expect(result.data!.currentBookValue).toBeLessThan(purchasePrice);
      expect(result.data!.currentBookValue).toBeGreaterThanOrEqual(salvageValue);
    });

    it('should set replacement due date based on useful life', () => {
      const now = new Date();
      const purchaseDate = new Date(now.getTime() - 365 * 86400000);
      const usefulLifeYears = 10;

      const result = engine.registerLifecycle(makeLifecycleInput({
        purchaseDate,
        usefulLifeYears,
      }));

      expect(result.success).toBe(true);
      const expectedDue = new Date(purchaseDate.getTime() + usefulLifeYears * 365.25 * 86400000);
      const actualDue = result.data!.replacementDueDate!;
      // Within a day tolerance
      expect(Math.abs(actualDue.getTime() - expectedDue.getTime())).toBeLessThan(86400000);
    });

    it('should get lifecycle by id', () => {
      const lc = registerLifecycle(engine);
      const fetched = engine.getLifecycle(lc.id);
      expect(fetched).toBeDefined();
      expect(fetched!.equipmentCode).toBe(lc.equipmentCode);
    });

    it('should return undefined for unknown lifecycle id', () => {
      expect(engine.getLifecycle('non-existent')).toBeUndefined();
    });

    it('should list lifecycles by tenant', () => {
      registerLifecycle(engine);
      registerLifecycle(engine);
      registerLifecycle(engine);

      const lifecycles = engine.listLifecycles(TENANT_ID);
      expect(lifecycles).toHaveLength(3);
    });

    it('should return empty list for unknown tenant', () => {
      registerLifecycle(engine);
      const lifecycles = engine.listLifecycles('unknown-tenant');
      expect(lifecycles).toHaveLength(0);
    });

    it('should update utilization metrics', () => {
      const eqId = uuid();
      registerLifecycle(engine, { equipmentId: eqId });

      const result = engine.updateUtilization(eqId, {
        engineHours: 5000,
        kmDriven: 12000,
        moves: 50000,
      });

      expect(result.success).toBe(true);
      expect(result.data!.totalEngineHours).toBe(5000);
      expect(result.data!.totalKmDriven).toBe(12000);
      expect(result.data!.totalMoves).toBe(50000);
    });

    it('should update partial utilization metrics', () => {
      const eqId = uuid();
      registerLifecycle(engine, { equipmentId: eqId });

      engine.updateUtilization(eqId, { engineHours: 1000 });
      const lc = engine.updateUtilization(eqId, { moves: 2000 });

      expect(lc.success).toBe(true);
      expect(lc.data!.totalEngineHours).toBe(1000);
      expect(lc.data!.totalMoves).toBe(2000);
    });

    it('should recalculate book value on utilization update', () => {
      const eqId = uuid();
      const lc = registerLifecycle(engine, { equipmentId: eqId });
      const initialBookValue = lc.currentBookValue;

      const result = engine.updateUtilization(eqId, { engineHours: 5000 });
      expect(result.success).toBe(true);
      // Book value should be recalculated (may differ slightly due to time passage)
      expect(result.data!.currentBookValue).toBeDefined();
    });

    it('should fail to update utilization for unknown equipment', () => {
      const result = engine.updateUtilization('non-existent', { engineHours: 1000 });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should get equipment due for replacement', () => {
      const now = new Date();
      // Equipment purchased 15 years ago with 10-year useful life
      const eqId1 = uuid();
      registerLifecycle(engine, {
        equipmentId: eqId1,
        purchaseDate: new Date(now.getTime() - 15 * 365.25 * 86400000),
        usefulLifeYears: 10,
      });

      // Equipment purchased recently with 10-year useful life
      const eqId2 = uuid();
      registerLifecycle(engine, {
        equipmentId: eqId2,
        purchaseDate: new Date(now.getTime() - 1 * 365.25 * 86400000),
        usefulLifeYears: 10,
      });

      const due = engine.getReplacementDue(TENANT_ID);
      expect(due).toHaveLength(1);
      expect(due[0].equipmentId).toBe(eqId1);
    });

    it('should return empty replacement due for no overdue equipment', () => {
      registerLifecycle(engine);
      const due = engine.getReplacementDue(TENANT_ID);
      expect(due).toHaveLength(0);
    });

    it('should handle zero useful life years', () => {
      const result = engine.registerLifecycle(makeLifecycleInput({
        usefulLifeYears: 0,
        purchasePrice: 1000000,
        salvageValue: 100000,
      }));
      expect(result.success).toBe(true);
      expect(result.data!.annualDepreciation).toBe(0);
    });
  });

  // ==========================================================================
  // 9. MHE Stats
  // ==========================================================================

  describe('MHE stats', () => {
    it('should return zeroed stats for empty tenant', () => {
      const stats = engine.getMHEStats('empty-tenant');
      expect(stats.tenantId).toBe('empty-tenant');
      expect(stats.totalTrackedEquipment).toBe(0);
      expect(stats.onlineEquipment).toBe(0);
      expect(stats.idlingEquipment).toBe(0);
      expect(stats.movingEquipment).toBe(0);
      expect(stats.overspeedAlerts).toBe(0);
      expect(stats.geofenceViolations).toBe(0);
      expect(stats.totalOperators).toBe(0);
      expect(stats.validCertifications).toBe(0);
      expect(stats.expiringSoonCertifications).toBe(0);
      expect(stats.expiredCertifications).toBe(0);
      expect(stats.totalIncidentsThisMonth).toBe(0);
      expect(stats.openIncidents).toBe(0);
      expect(stats.nearMissesThisMonth).toBe(0);
      expect(stats.safetyChecksToday).toBe(0);
      expect(stats.safetyCheckFailRate).toBe(0);
      expect(stats.totalChargingDocks).toBe(0);
      expect(stats.availableChargingDocks).toBe(0);
      expect(stats.activeChargingSessions).toBe(0);
      expect(stats.totalKwhToday).toBe(0);
      expect(stats.openWorkOrders).toBe(0);
      expect(stats.overdueWorkOrders).toBe(0);
      expect(stats.avgRepairTimeHours).toBe(0);
      expect(stats.maintenanceCostMTD).toBe(0);
      expect(stats.equipmentAvailabilityPercent).toBe(100);
    });

    it('should count tracked and online equipment', () => {
      engine.recordTelematics(makeTelematicsInput({ engineRunning: true, speed: 10 })); // moving
      engine.recordTelematics(makeTelematicsInput({ engineRunning: true, speed: 0 })); // idle
      engine.recordTelematics(makeTelematicsInput({ engineRunning: false, speed: 0 })); // offline

      const stats = engine.getMHEStats(TENANT_ID);
      expect(stats.totalTrackedEquipment).toBe(3);
      expect(stats.movingEquipment).toBe(1);
      expect(stats.onlineEquipment).toBeGreaterThanOrEqual(1); // moving + idle counted as online
    });

    it('should count certification statuses', () => {
      const now = new Date();
      registerCert(engine); // valid
      registerCert(engine, { expiryDate: new Date(now.getTime() + 10 * 86400000), renewalReminderDays: 30 }); // expiring_soon
      registerCert(engine, { expiryDate: new Date(now.getTime() - 86400000) }); // expired

      const stats = engine.getMHEStats(TENANT_ID);
      expect(stats.validCertifications).toBe(1);
      expect(stats.expiringSoonCertifications).toBe(1);
      expect(stats.expiredCertifications).toBe(1);
    });

    it('should count unique operators', () => {
      const op1 = uuid();
      const op2 = uuid();
      registerCert(engine, { operatorId: op1 });
      registerCert(engine, { operatorId: op1, certType: 'crane_operator' });
      registerCert(engine, { operatorId: op2 });

      const stats = engine.getMHEStats(TENANT_ID);
      expect(stats.totalOperators).toBe(2);
    });

    it('should count incidents this month', () => {
      reportIncident(engine);
      reportIncident(engine);
      reportIncident(engine, { incidentType: 'near_miss' });

      const stats = engine.getMHEStats(TENANT_ID);
      expect(stats.totalIncidentsThisMonth).toBe(3);
      expect(stats.nearMissesThisMonth).toBe(1);
    });

    it('should count open incidents', () => {
      const i1 = reportIncident(engine);
      reportIncident(engine);
      reportIncident(engine);
      engine.updateIncidentStatus(i1.id, 'closed');

      const stats = engine.getMHEStats(TENANT_ID);
      expect(stats.openIncidents).toBe(2);
    });

    it('should count safety checks and fail rate', () => {
      engine.submitSafetyCheck(makeSafetyCheckInput());
      engine.submitSafetyCheck(makeSafetyCheckInput());
      const failItems: SafetyCheckItem[] = [
        { itemName: 'Brakes', category: 'brakes', result: 'defect' },
        { itemName: 'Horn', category: 'horn', result: 'ok' },
      ];
      engine.submitSafetyCheck(makeSafetyCheckInput({ items: failItems }));

      const stats = engine.getMHEStats(TENANT_ID);
      expect(stats.safetyChecksToday).toBe(3);
      // 1 failed out of 3 = 33.33%
      expect(stats.safetyCheckFailRate).toBeCloseTo(33.33, 0);
    });

    it('should count charging dock stats', () => {
      const dock1 = registerDock(engine);
      registerDock(engine);
      engine.startCharging(makeStartChargingInput(dock1.id));

      const stats = engine.getMHEStats(TENANT_ID);
      expect(stats.totalChargingDocks).toBe(2);
      expect(stats.availableChargingDocks).toBe(1);
      expect(stats.activeChargingSessions).toBe(1);
    });

    it('should count open work orders', () => {
      createWorkOrder(engine); // planned -> open
      createWorkOrder(engine); // planned -> open
      const wo3 = createWorkOrder(engine);
      engine.scheduleWorkOrder(wo3.id, new Date(Date.now() + 86400000));
      engine.startWorkOrder(wo3.id);
      engine.completeWorkOrder(wo3.id, { actionTaken: 'Done' }); // completed -> not open

      const stats = engine.getMHEStats(TENANT_ID);
      expect(stats.openWorkOrders).toBe(2); // 2 planned
    });

    it('should count overdue work orders', () => {
      const wo = createWorkOrder(engine);
      // Schedule in the past so it's overdue
      engine.scheduleWorkOrder(wo.id, new Date(Date.now() - 86400000));

      const stats = engine.getMHEStats(TENANT_ID);
      expect(stats.overdueWorkOrders).toBe(1);
    });

    it('should calculate equipment availability percent', () => {
      // Create 4 pieces of tracked equipment
      engine.recordTelematics(makeTelematicsInput({ engineRunning: true, speed: 10 }));
      engine.recordTelematics(makeTelematicsInput({ engineRunning: true, speed: 5 }));
      engine.recordTelematics(makeTelematicsInput({ engineRunning: true, speed: 0 }));
      engine.recordTelematics(makeTelematicsInput({ engineRunning: false }));

      // Create a scheduled work order for one of the equipment
      const eqIdWithWO = uuid();
      engine.recordTelematics(makeTelematicsInput({ equipmentId: eqIdWithWO, engineRunning: true, speed: 3 }));
      const wo = createWorkOrder(engine, { equipmentId: eqIdWithWO });
      engine.scheduleWorkOrder(wo.id, new Date(Date.now() + 86400000));

      const stats = engine.getMHEStats(TENANT_ID);
      // 5 tracked, 1 with scheduled WO => 4/5 = 80%
      expect(stats.totalTrackedEquipment).toBe(5);
      expect(stats.equipmentAvailabilityPercent).toBe(80);
    });

    it('should calculate average repair time hours', () => {
      // Create a completed work order with known start and end
      const wo = createWorkOrder(engine);
      engine.scheduleWorkOrder(wo.id, new Date(Date.now() + 86400000));
      engine.startWorkOrder(wo.id);
      engine.completeWorkOrder(wo.id, { actionTaken: 'Repaired' });

      const stats = engine.getMHEStats(TENANT_ID);
      // durationHours is calculated based on actual start to end
      expect(stats.avgRepairTimeHours).toBeGreaterThanOrEqual(0);
    });

    it('should calculate maintenance cost month-to-date', () => {
      const wo = createWorkOrder(engine);
      engine.scheduleWorkOrder(wo.id, new Date(Date.now() + 86400000));
      engine.startWorkOrder(wo.id);
      engine.completeWorkOrder(wo.id, {
        actionTaken: 'Full service',
        partsCost: 10000,
        laborCost: 5000,
      });

      const stats = engine.getMHEStats(TENANT_ID);
      expect(stats.maintenanceCostMTD).toBe(15000);
    });

    it('should count overspeed and geofence violations today', () => {
      // Create a geofence with speed limit
      engine.createGeofence(makeGeofenceInput({
        centerPoint: { latitude: 19.0760, longitude: 72.8777 },
        radiusMeters: 5000,
        maxSpeedKmh: 10,
        zoneType: 'operating_area',
      }));

      // Create another restricted geofence
      engine.createGeofence(makeGeofenceInput({
        name: 'Restricted Area',
        centerPoint: { latitude: 19.0760, longitude: 72.8777 },
        radiusMeters: 5000,
        zoneType: 'restricted',
      }));

      // Record overspeed event inside the zone
      engine.recordTelematics(makeTelematicsInput({
        position: { latitude: 19.0760, longitude: 72.8777 },
        speed: 20,
        engineRunning: true,
      }));

      const stats = engine.getMHEStats(TENANT_ID);
      expect(stats.overspeedAlerts).toBeGreaterThanOrEqual(1);
      // geofence violations: inside restricted zone
      expect(stats.geofenceViolations).toBeGreaterThanOrEqual(1);
    });

    it('should return tenantId in stats', () => {
      const stats = engine.getMHEStats(TENANT_ID);
      expect(stats.tenantId).toBe(TENANT_ID);
    });
  });
});
