import { describe, it, expect, beforeEach } from 'vitest';
import { IoTManager } from '../iot/iot-manager';
import { uuid, TENANT_ID, FACILITY_ID } from './test-utils';

// =============================================================================
// HELPER FACTORIES
// =============================================================================

function makeSensorInput(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    sensorCode: 'TEMP-001',
    sensorType: 'temperature' as const,
    name: 'Reefer Temp Sensor 1',
    attachedToType: 'container' as const,
    attachedToId: uuid(),
    attachedTo: 'MSCU1234567',
    readingInterval: 300,
    alertThresholdMin: -25,
    alertThresholdMax: -18,
    unit: 'C',
    connectionType: 'lora' as const,
    ...overrides,
  };
}

function makeReeferProfileInput(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    containerId: uuid(),
    containerNumber: 'MSCU1234567',
    setTemperature: -22,
    minTemperature: -25,
    maxTemperature: -18,
    temperatureUnit: 'C' as const,
    monitoringInterval: 300,
    ...overrides,
  };
}

function makeGPSInput(overrides: Record<string, unknown> = {}) {
  return {
    entityType: 'equipment' as const,
    entityId: uuid(),
    entityNumber: 'RTG-001',
    facilityId: FACILITY_ID,
    position: {
      latitude: 19.076,
      longitude: 72.8777,
      altitude: 10,
      speed: 5.5,
      heading: 180,
      timestamp: new Date(),
    },
    ...overrides,
  };
}

function makeZoneInput(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    zoneName: 'Reefer Yard Zone A',
    zoneType: 'reefer_area' as const,
    temperatureMin: -30,
    temperatureMax: -15,
    humidityMin: 40,
    humidityMax: 80,
    ...overrides,
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe('IoTManager', () => {
  let manager: IoTManager;

  beforeEach(() => {
    manager = new IoTManager();
  });

  // ===========================================================================
  // SENSOR MANAGEMENT
  // ===========================================================================

  describe('Sensor Management', () => {
    describe('registerSensor', () => {
      it('should register a new sensor and return success', () => {
        const input = makeSensorInput();
        const result = manager.registerSensor(input);

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data!.sensorCode).toBe('TEMP-001');
        expect(result.data!.sensorType).toBe('temperature');
        expect(result.data!.name).toBe('Reefer Temp Sensor 1');
        expect(result.data!.status).toBe('inactive');
        expect(result.data!.connectionType).toBe('lora');
        expect(result.data!.unit).toBe('C');
        expect(result.data!.readingInterval).toBe(300);
        expect(result.data!.alertThresholdMin).toBe(-25);
        expect(result.data!.alertThresholdMax).toBe(-18);
      });

      it('should default readingInterval to 60 when not provided', () => {
        const input = makeSensorInput({ readingInterval: undefined });
        const result = manager.registerSensor(input);

        expect(result.success).toBe(true);
        expect(result.data!.readingInterval).toBe(60);
      });

      it('should assign a unique id and timestamps', () => {
        const r1 = manager.registerSensor(makeSensorInput({ sensorCode: 'S-001' }));
        const r2 = manager.registerSensor(makeSensorInput({ sensorCode: 'S-002' }));

        expect(r1.data!.id).not.toBe(r2.data!.id);
        expect(r1.data!.createdAt).toBeInstanceOf(Date);
        expect(r1.data!.updatedAt).toBeInstanceOf(Date);
      });
    });

    describe('getSensor', () => {
      it('should return a sensor by ID', () => {
        const reg = manager.registerSensor(makeSensorInput());
        const sensor = manager.getSensor(reg.data!.id);

        expect(sensor).toBeDefined();
        expect(sensor!.id).toBe(reg.data!.id);
        expect(sensor!.sensorCode).toBe('TEMP-001');
      });

      it('should return undefined for unknown ID', () => {
        expect(manager.getSensor(uuid())).toBeUndefined();
      });
    });

    describe('listSensors', () => {
      it('should list all sensors without filters', () => {
        manager.registerSensor(makeSensorInput({ sensorCode: 'S-001' }));
        manager.registerSensor(makeSensorInput({ sensorCode: 'S-002' }));

        const list = manager.listSensors();
        expect(list).toHaveLength(2);
      });

      it('should filter by tenantId', () => {
        manager.registerSensor(makeSensorInput({ sensorCode: 'S-001' }));
        manager.registerSensor(makeSensorInput({ sensorCode: 'S-002', tenantId: 'other-tenant' }));

        const list = manager.listSensors({ tenantId: TENANT_ID });
        expect(list).toHaveLength(1);
        expect(list[0].sensorCode).toBe('S-001');
      });

      it('should filter by sensorType', () => {
        manager.registerSensor(makeSensorInput({ sensorCode: 'T-001', sensorType: 'temperature' }));
        manager.registerSensor(makeSensorInput({ sensorCode: 'G-001', sensorType: 'gps' }));

        const list = manager.listSensors({ sensorType: 'gps' });
        expect(list).toHaveLength(1);
        expect(list[0].sensorCode).toBe('G-001');
      });

      it('should filter by status', () => {
        const r1 = manager.registerSensor(makeSensorInput({ sensorCode: 'S-001' }));
        manager.registerSensor(makeSensorInput({ sensorCode: 'S-002' }));
        manager.activateSensor(r1.data!.id);

        const list = manager.listSensors({ status: 'active' });
        expect(list).toHaveLength(1);
        expect(list[0].sensorCode).toBe('S-001');
      });

      it('should filter by facilityId', () => {
        const otherFacility = uuid();
        manager.registerSensor(makeSensorInput({ sensorCode: 'S-001' }));
        manager.registerSensor(makeSensorInput({ sensorCode: 'S-002', facilityId: otherFacility }));

        const list = manager.listSensors({ facilityId: FACILITY_ID });
        expect(list).toHaveLength(1);
      });
    });

    describe('activateSensor', () => {
      it('should transition sensor from inactive to active', () => {
        const reg = manager.registerSensor(makeSensorInput());
        expect(reg.data!.status).toBe('inactive');

        const result = manager.activateSensor(reg.data!.id);
        expect(result.success).toBe(true);
        expect(result.data!.status).toBe('active');
      });

      it('should return NOT_FOUND for unknown sensor', () => {
        const result = manager.activateSensor(uuid());
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });
    });

    describe('deactivateSensor', () => {
      it('should transition sensor from active to inactive', () => {
        const reg = manager.registerSensor(makeSensorInput());
        manager.activateSensor(reg.data!.id);

        const result = manager.deactivateSensor(reg.data!.id);
        expect(result.success).toBe(true);
        expect(result.data!.status).toBe('inactive');
      });

      it('should return NOT_FOUND for unknown sensor', () => {
        const result = manager.deactivateSensor(uuid());
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });
    });

    describe('updateBattery', () => {
      it('should update battery level and voltage', () => {
        const reg = manager.registerSensor(makeSensorInput());
        const result = manager.updateBattery(reg.data!.id, 85, 3.7);

        expect(result.success).toBe(true);
        expect(result.data!.batteryLevel).toBe(85);
        expect(result.data!.batteryVoltage).toBe(3.7);
      });

      it('should set status to low_battery when level drops below threshold', () => {
        const reg = manager.registerSensor(makeSensorInput());
        manager.activateSensor(reg.data!.id);

        const result = manager.updateBattery(reg.data!.id, 10);
        expect(result.success).toBe(true);
        expect(result.data!.status).toBe('low_battery');
      });

      it('should not set low_battery when level is above threshold', () => {
        const reg = manager.registerSensor(makeSensorInput());
        manager.activateSensor(reg.data!.id);

        const result = manager.updateBattery(reg.data!.id, 50);
        expect(result.success).toBe(true);
        expect(result.data!.status).toBe('active');
      });

      it('should return NOT_FOUND for unknown sensor', () => {
        const result = manager.updateBattery(uuid(), 50);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });
    });
  });

  // ===========================================================================
  // SENSOR READINGS
  // ===========================================================================

  describe('Sensor Readings', () => {
    describe('recordReading', () => {
      it('should record a normal reading without alert', () => {
        const reg = manager.registerSensor(makeSensorInput());
        const sensorId = reg.data!.id;

        const result = manager.recordReading({
          sensorId,
          value: -20.5,
          unit: 'C',
          quality: 'good',
        });

        expect(result.success).toBe(true);
        expect(result.data!.value).toBe(-20.5);
        expect(result.data!.unit).toBe('C');
        expect(result.data!.quality).toBe('good');
        expect(result.data!.isAlert).toBe(false);
        expect(result.data!.alertType).toBeUndefined();
      });

      it('should flag alert when value exceeds alertThresholdMax', () => {
        const reg = manager.registerSensor(makeSensorInput());
        const sensorId = reg.data!.id;

        const result = manager.recordReading({
          sensorId,
          value: -15.0,
          unit: 'C',
        });

        expect(result.success).toBe(true);
        expect(result.data!.isAlert).toBe(true);
        expect(result.data!.alertType).toBe('high');
        expect(result.data!.alertMessage).toContain('high');
        expect(result.data!.alertMessage).toContain('-15');
      });

      it('should flag alert when value drops below alertThresholdMin', () => {
        const reg = manager.registerSensor(makeSensorInput());
        const sensorId = reg.data!.id;

        const result = manager.recordReading({
          sensorId,
          value: -30.0,
          unit: 'C',
        });

        expect(result.success).toBe(true);
        expect(result.data!.isAlert).toBe(true);
        expect(result.data!.alertType).toBe('low');
      });

      it('should update lastReading and lastReadingTime on sensor', () => {
        const reg = manager.registerSensor(makeSensorInput());
        const sensorId = reg.data!.id;

        manager.recordReading({ sensorId, value: -21.0, unit: 'C' });

        const sensor = manager.getSensor(sensorId);
        expect(sensor!.lastReading).toBeDefined();
        expect(sensor!.lastReading!.value).toBe(-21.0);
        expect(sensor!.lastReadingTime).toBeInstanceOf(Date);
      });

      it('should default unit from sensor when not provided in input', () => {
        const reg = manager.registerSensor(makeSensorInput({ unit: 'F' }));
        const sensorId = reg.data!.id;

        const result = manager.recordReading({ sensorId, value: 32 });
        expect(result.data!.unit).toBe('F');
      });

      it('should return NOT_FOUND for unknown sensor', () => {
        const result = manager.recordReading({ sensorId: uuid(), value: 0 });
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });
    });

    describe('getReadings', () => {
      it('should return readings for a specific sensor', () => {
        const reg = manager.registerSensor(makeSensorInput());
        const sensorId = reg.data!.id;

        manager.recordReading({ sensorId, value: -20.0 });
        manager.recordReading({ sensorId, value: -21.0 });
        manager.recordReading({ sensorId, value: -19.5 });

        const readings = manager.getReadings(sensorId);
        expect(readings).toHaveLength(3);
      });

      it('should respect the limit parameter', () => {
        const reg = manager.registerSensor(makeSensorInput());
        const sensorId = reg.data!.id;

        for (let i = 0; i < 10; i++) {
          manager.recordReading({ sensorId, value: -20 + i });
        }

        const readings = manager.getReadings(sensorId, 5);
        expect(readings).toHaveLength(5);
      });

      it('should return readings sorted newest first', () => {
        const reg = manager.registerSensor(makeSensorInput());
        const sensorId = reg.data!.id;

        manager.recordReading({ sensorId, value: -20 });
        manager.recordReading({ sensorId, value: -21 });

        const readings = manager.getReadings(sensorId);
        expect(readings[0].timestamp.getTime()).toBeGreaterThanOrEqual(
          readings[1].timestamp.getTime()
        );
      });

      it('should return empty array for sensor with no readings', () => {
        const reg = manager.registerSensor(makeSensorInput());
        const readings = manager.getReadings(reg.data!.id);
        expect(readings).toHaveLength(0);
      });
    });

    describe('getAlerts', () => {
      it('should return only alert readings for a facility', () => {
        const reg = manager.registerSensor(makeSensorInput());
        const sensorId = reg.data!.id;

        // Normal reading
        manager.recordReading({ sensorId, value: -20.0 });
        // Alert reading (above max threshold of -18)
        manager.recordReading({ sensorId, value: -15.0 });
        // Alert reading (below min threshold of -25)
        manager.recordReading({ sensorId, value: -30.0 });

        const alerts = manager.getAlerts(FACILITY_ID);
        expect(alerts).toHaveLength(2);
        expect(alerts.every((a) => a.isAlert)).toBe(true);
      });

      it('should respect the limit parameter', () => {
        const reg = manager.registerSensor(makeSensorInput());
        const sensorId = reg.data!.id;

        // Create 5 alert readings
        for (let i = 0; i < 5; i++) {
          manager.recordReading({ sensorId, value: -10 + i });
        }

        const alerts = manager.getAlerts(FACILITY_ID, 3);
        expect(alerts).toHaveLength(3);
      });

      it('should return empty array when no alerts exist', () => {
        const reg = manager.registerSensor(makeSensorInput());
        manager.recordReading({ sensorId: reg.data!.id, value: -20 });

        const alerts = manager.getAlerts(FACILITY_ID);
        expect(alerts).toHaveLength(0);
      });
    });
  });

  // ===========================================================================
  // REEFER MONITORING
  // ===========================================================================

  describe('Reefer Monitoring', () => {
    describe('createReeferProfile', () => {
      it('should create a reefer monitoring profile', () => {
        const input = makeReeferProfileInput();
        const result = manager.createReeferProfile(input);

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data!.containerNumber).toBe('MSCU1234567');
        expect(result.data!.setTemperature).toBe(-22);
        expect(result.data!.temperatureUnit).toBe('C');
        expect(result.data!.minTemperature).toBe(-25);
        expect(result.data!.maxTemperature).toBe(-18);
        expect(result.data!.powerStatus).toBe('unplugged');
        expect(result.data!.compressorRunning).toBe(false);
        expect(result.data!.doorStatus).toBe('closed');
        expect(result.data!.alarms).toHaveLength(0);
        expect(result.data!.activeAlarmCount).toBe(0);
        expect(result.data!.excursionCount).toBe(0);
        expect(result.data!.monitoringInterval).toBe(300);
      });

      it('should default temperatureUnit to C when not provided', () => {
        const input = makeReeferProfileInput({ temperatureUnit: undefined });
        const result = manager.createReeferProfile(input);
        expect(result.data!.temperatureUnit).toBe('C');
      });

      it('should default monitoringInterval to 300 when not provided', () => {
        const input = makeReeferProfileInput({ monitoringInterval: undefined });
        const result = manager.createReeferProfile(input);
        expect(result.data!.monitoringInterval).toBe(300);
      });
    });

    describe('getReeferProfile', () => {
      it('should return a reefer profile by container ID', () => {
        const containerId = uuid();
        manager.createReeferProfile(makeReeferProfileInput({ containerId }));

        const profile = manager.getReeferProfile(containerId);
        expect(profile).toBeDefined();
        expect(profile!.containerId).toBe(containerId);
      });

      it('should return undefined for unknown container ID', () => {
        expect(manager.getReeferProfile(uuid())).toBeUndefined();
      });
    });

    describe('listReeferProfiles', () => {
      it('should list all reefer profiles', () => {
        manager.createReeferProfile(makeReeferProfileInput());
        manager.createReeferProfile(makeReeferProfileInput({ containerId: uuid() }));

        const list = manager.listReeferProfiles();
        expect(list).toHaveLength(2);
      });

      it('should filter by facilityId', () => {
        const otherFacility = uuid();
        manager.createReeferProfile(makeReeferProfileInput());
        manager.createReeferProfile(
          makeReeferProfileInput({ containerId: uuid(), facilityId: otherFacility })
        );

        const list = manager.listReeferProfiles(FACILITY_ID);
        expect(list).toHaveLength(1);
      });
    });

    describe('plugInReefer', () => {
      it('should plug in a reefer and start compressor', () => {
        const containerId = uuid();
        manager.createReeferProfile(makeReeferProfileInput({ containerId }));

        const result = manager.plugInReefer(containerId, 'shore_power');

        expect(result.success).toBe(true);
        expect(result.data!.powerStatus).toBe('plugged');
        expect(result.data!.powerSource).toBe('shore_power');
        expect(result.data!.compressorRunning).toBe(true);
        expect(result.data!.pluggedInAt).toBeInstanceOf(Date);
      });

      it('should return NOT_FOUND for unknown container', () => {
        const result = manager.plugInReefer(uuid());
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });
    });

    describe('unplugReefer', () => {
      it('should unplug a reefer and stop compressor', () => {
        const containerId = uuid();
        manager.createReeferProfile(makeReeferProfileInput({ containerId }));
        manager.plugInReefer(containerId, 'shore_power');

        const result = manager.unplugReefer(containerId);

        expect(result.success).toBe(true);
        expect(result.data!.powerStatus).toBe('unplugged');
        expect(result.data!.compressorRunning).toBe(false);
        expect(result.data!.unpluggedAt).toBeInstanceOf(Date);
      });

      it('should return NOT_FOUND for unknown container', () => {
        const result = manager.unplugReefer(uuid());
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });
    });

    describe('temperature excursion and alarm triggering', () => {
      it('should create a temperature_high alarm when reading exceeds maxTemperature', () => {
        const containerId = uuid();
        manager.createReeferProfile(makeReeferProfileInput({ containerId }));

        // Register a temperature sensor attached to this container
        const sensorReg = manager.registerSensor(
          makeSensorInput({
            sensorCode: 'TEMP-REEFER',
            sensorType: 'temperature',
            attachedToType: 'container',
            attachedToId: containerId,
            alertThresholdMin: -25,
            alertThresholdMax: -18,
          })
        );

        // Record a reading above the reefer profile maxTemperature (-18)
        manager.recordReading({
          sensorId: sensorReg.data!.id,
          value: -10,
          unit: 'C',
        });

        const profile = manager.getReeferProfile(containerId);
        expect(profile!.currentTemperature).toBe(-10);
        expect(profile!.excursionCount).toBe(1);
        expect(profile!.alarms).toHaveLength(1);
        expect(profile!.alarms[0].alarmType).toBe('temperature_high');
        expect(profile!.alarms[0].severity).toBe('critical');
        expect(profile!.alarms[0].isActive).toBe(true);
        expect(profile!.activeAlarmCount).toBe(1);
      });

      it('should create a temperature_low alarm when reading drops below minTemperature', () => {
        const containerId = uuid();
        manager.createReeferProfile(makeReeferProfileInput({ containerId }));

        const sensorReg = manager.registerSensor(
          makeSensorInput({
            sensorCode: 'TEMP-REEFER-LOW',
            sensorType: 'temperature',
            attachedToType: 'container',
            attachedToId: containerId,
          })
        );

        // Record a reading below the reefer profile minTemperature (-25)
        manager.recordReading({
          sensorId: sensorReg.data!.id,
          value: -30,
          unit: 'C',
        });

        const profile = manager.getReeferProfile(containerId);
        expect(profile!.excursionCount).toBe(1);
        expect(profile!.alarms).toHaveLength(1);
        expect(profile!.alarms[0].alarmType).toBe('temperature_low');
      });

      it('should not duplicate active alarm of the same type on subsequent excursion readings', () => {
        const containerId = uuid();
        manager.createReeferProfile(makeReeferProfileInput({ containerId }));

        const sensorReg = manager.registerSensor(
          makeSensorInput({
            sensorCode: 'TEMP-DUP',
            sensorType: 'temperature',
            attachedToType: 'container',
            attachedToId: containerId,
          })
        );
        const sensorId = sensorReg.data!.id;

        // Two consecutive high readings
        manager.recordReading({ sensorId, value: -10, unit: 'C' });
        manager.recordReading({ sensorId, value: -8, unit: 'C' });

        const profile = manager.getReeferProfile(containerId);
        // Should still only have one alarm because the existing one is still active
        expect(profile!.alarms).toHaveLength(1);
        // But excursion count should be 2
        expect(profile!.excursionCount).toBe(2);
      });

      it('should track temperature history on the reefer profile', () => {
        const containerId = uuid();
        manager.createReeferProfile(makeReeferProfileInput({ containerId }));

        const sensorReg = manager.registerSensor(
          makeSensorInput({
            sensorCode: 'TEMP-HIST',
            sensorType: 'temperature',
            attachedToType: 'container',
            attachedToId: containerId,
          })
        );
        const sensorId = sensorReg.data!.id;

        manager.recordReading({ sensorId, value: -20 });
        manager.recordReading({ sensorId, value: -21 });
        manager.recordReading({ sensorId, value: -22 });

        const profile = manager.getReeferProfile(containerId);
        expect(profile!.temperatureHistory).toHaveLength(3);
        expect(profile!.temperatureHistory[0].value).toBe(-20);
        expect(profile!.temperatureHistory[2].value).toBe(-22);
      });
    });

    describe('acknowledgeReeferAlarm', () => {
      it('should acknowledge an active alarm', () => {
        const containerId = uuid();
        manager.createReeferProfile(makeReeferProfileInput({ containerId }));

        const sensorReg = manager.registerSensor(
          makeSensorInput({
            sensorCode: 'TEMP-ACK',
            sensorType: 'temperature',
            attachedToType: 'container',
            attachedToId: containerId,
          })
        );

        manager.recordReading({ sensorId: sensorReg.data!.id, value: -10 });

        const profile = manager.getReeferProfile(containerId);
        const alarmId = profile!.alarms[0].id;

        const result = manager.acknowledgeReeferAlarm(containerId, alarmId, 'operator-1');

        expect(result.success).toBe(true);
        const alarm = result.data!.alarms.find((a) => a.id === alarmId);
        expect(alarm!.acknowledgedAt).toBeInstanceOf(Date);
        expect(alarm!.acknowledgedBy).toBe('operator-1');
        // Alarm should still be active after acknowledgment
        expect(alarm!.isActive).toBe(true);
      });

      it('should return NOT_FOUND for unknown container', () => {
        const result = manager.acknowledgeReeferAlarm(uuid(), uuid(), 'op');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });

      it('should return NOT_FOUND for unknown alarm', () => {
        const containerId = uuid();
        manager.createReeferProfile(makeReeferProfileInput({ containerId }));

        const result = manager.acknowledgeReeferAlarm(containerId, uuid(), 'op');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });
    });

    describe('resolveReeferAlarm', () => {
      it('should resolve an active alarm and decrement active count', () => {
        const containerId = uuid();
        manager.createReeferProfile(makeReeferProfileInput({ containerId }));

        const sensorReg = manager.registerSensor(
          makeSensorInput({
            sensorCode: 'TEMP-RES',
            sensorType: 'temperature',
            attachedToType: 'container',
            attachedToId: containerId,
          })
        );

        manager.recordReading({ sensorId: sensorReg.data!.id, value: -10 });

        const profile = manager.getReeferProfile(containerId);
        expect(profile!.activeAlarmCount).toBe(1);
        const alarmId = profile!.alarms[0].id;

        const result = manager.resolveReeferAlarm(containerId, alarmId, 'engineer-1');

        expect(result.success).toBe(true);
        const alarm = result.data!.alarms.find((a) => a.id === alarmId);
        expect(alarm!.isActive).toBe(false);
        expect(alarm!.resolvedAt).toBeInstanceOf(Date);
        expect(alarm!.resolvedBy).toBe('engineer-1');
        expect(result.data!.activeAlarmCount).toBe(0);
      });

      it('should return NOT_FOUND for unknown container', () => {
        const result = manager.resolveReeferAlarm(uuid(), uuid(), 'eng');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });

      it('should return NOT_FOUND for unknown alarm', () => {
        const containerId = uuid();
        manager.createReeferProfile(makeReeferProfileInput({ containerId }));

        const result = manager.resolveReeferAlarm(containerId, uuid(), 'eng');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });
    });
  });

  // ===========================================================================
  // GPS TRACKING
  // ===========================================================================

  describe('GPS Tracking', () => {
    describe('updateGPS', () => {
      it('should create a new GPS track on first update', () => {
        const input = makeGPSInput();
        const result = manager.updateGPS(input);

        expect(result.success).toBe(true);
        expect(result.data!.entityType).toBe('equipment');
        expect(result.data!.entityNumber).toBe('RTG-001');
        expect(result.data!.currentPosition.latitude).toBe(19.076);
        expect(result.data!.currentPosition.longitude).toBe(72.8777);
        expect(result.data!.totalDistance).toBe(0);
        expect(result.data!.trackHistory).toHaveLength(1);
        expect(result.data!.insideGeofence).toBe(true);
      });

      it('should update existing track and calculate distance on second update', () => {
        const entityId = uuid();
        const now = new Date();

        // First position: Mumbai (19.076, 72.8777)
        manager.updateGPS({
          entityType: 'equipment',
          entityId,
          entityNumber: 'RTG-001',
          facilityId: FACILITY_ID,
          position: {
            latitude: 19.076,
            longitude: 72.8777,
            altitude: 10,
            speed: 5.5,
            heading: 180,
            timestamp: now,
          },
        });

        // Second position: slightly different (moved ~1km)
        const result = manager.updateGPS({
          entityType: 'equipment',
          entityId,
          entityNumber: 'RTG-001',
          facilityId: FACILITY_ID,
          position: {
            latitude: 19.085,
            longitude: 72.8777,
            altitude: 10,
            speed: 8.0,
            heading: 0,
            timestamp: new Date(now.getTime() + 60000),
          },
        });

        expect(result.success).toBe(true);
        expect(result.data!.trackHistory).toHaveLength(2);
        expect(result.data!.totalDistance).toBeGreaterThan(0);
      });

      it('should accumulate idle time when speed is below 2', () => {
        const entityId = uuid();
        const now = new Date();

        manager.updateGPS({
          entityType: 'vehicle',
          entityId,
          entityNumber: 'TRK-001',
          facilityId: FACILITY_ID,
          position: {
            latitude: 19.076,
            longitude: 72.8777,
            speed: 0,
            timestamp: now,
          },
        });

        const result = manager.updateGPS({
          entityType: 'vehicle',
          entityId,
          entityNumber: 'TRK-001',
          facilityId: FACILITY_ID,
          position: {
            latitude: 19.076,
            longitude: 72.8777,
            speed: 1.5,
            timestamp: new Date(now.getTime() + 600000), // 10 minutes later
          },
        });

        expect(result.data!.idleTime).toBeGreaterThan(0);
        expect(result.data!.movingTime).toBe(0);
      });

      it('should accumulate moving time when speed is at or above 2', () => {
        const entityId = uuid();
        const now = new Date();

        manager.updateGPS({
          entityType: 'vehicle',
          entityId,
          entityNumber: 'TRK-002',
          facilityId: FACILITY_ID,
          position: {
            latitude: 19.076,
            longitude: 72.8777,
            speed: 5.0,
            timestamp: now,
          },
        });

        const result = manager.updateGPS({
          entityType: 'vehicle',
          entityId,
          entityNumber: 'TRK-002',
          facilityId: FACILITY_ID,
          position: {
            latitude: 19.085,
            longitude: 72.886,
            speed: 25.0,
            timestamp: new Date(now.getTime() + 300000), // 5 minutes later
          },
        });

        expect(result.data!.movingTime).toBeGreaterThan(0);
      });
    });

    describe('getGPSTrack', () => {
      it('should return a GPS track by entity type and ID', () => {
        const entityId = uuid();
        manager.updateGPS(makeGPSInput({ entityId }));

        const track = manager.getGPSTrack('equipment', entityId);
        expect(track).toBeDefined();
        expect(track!.entityId).toBe(entityId);
      });

      it('should return undefined for unknown entity', () => {
        expect(manager.getGPSTrack('equipment', uuid())).toBeUndefined();
      });
    });

    describe('listGPSTracks', () => {
      it('should list all GPS tracks', () => {
        manager.updateGPS(makeGPSInput({ entityId: uuid() }));
        manager.updateGPS(makeGPSInput({ entityId: uuid() }));

        const list = manager.listGPSTracks();
        expect(list).toHaveLength(2);
      });

      it('should filter by facilityId', () => {
        const otherFacility = uuid();
        manager.updateGPS(makeGPSInput({ entityId: uuid() }));
        manager.updateGPS(makeGPSInput({ entityId: uuid(), facilityId: otherFacility }));

        const list = manager.listGPSTracks(FACILITY_ID);
        expect(list).toHaveLength(1);
      });
    });

    describe('GPS tracking via sensor reading', () => {
      it('should auto-create GPS track when GPS sensor records a reading with coordinates', () => {
        const attachedToId = uuid();

        const sensorReg = manager.registerSensor(
          makeSensorInput({
            sensorCode: 'GPS-001',
            sensorType: 'gps',
            attachedToType: 'container',
            attachedToId,
            attachedTo: 'MSCU9999999',
            alertThresholdMin: undefined,
            alertThresholdMax: undefined,
          })
        );

        manager.recordReading({
          sensorId: sensorReg.data!.id,
          value: 0,
          latitude: 19.076,
          longitude: 72.8777,
          altitude: 10,
          speed: 5.5,
          heading: 180,
        });

        const track = manager.getGPSTrack('container', attachedToId);
        expect(track).toBeDefined();
        expect(track!.entityNumber).toBe('MSCU9999999');
        expect(track!.currentPosition.latitude).toBe(19.076);
      });
    });
  });

  // ===========================================================================
  // ENVIRONMENTAL ZONES
  // ===========================================================================

  describe('Environmental Zones', () => {
    describe('createEnvironmentalZone', () => {
      it('should create an environmental zone', () => {
        const result = manager.createEnvironmentalZone(makeZoneInput());

        expect(result.success).toBe(true);
        expect(result.data!.zoneName).toBe('Reefer Yard Zone A');
        expect(result.data!.zoneType).toBe('reefer_area');
        expect(result.data!.temperatureMin).toBe(-30);
        expect(result.data!.temperatureMax).toBe(-15);
        expect(result.data!.humidityMin).toBe(40);
        expect(result.data!.humidityMax).toBe(80);
        expect(result.data!.sensorIds).toHaveLength(0);
        expect(result.data!.activeAlerts).toBe(0);
      });
    });

    describe('getEnvironmentalZone', () => {
      it('should return a zone by ID', () => {
        const created = manager.createEnvironmentalZone(makeZoneInput());
        const zone = manager.getEnvironmentalZone(created.data!.id);

        expect(zone).toBeDefined();
        expect(zone!.id).toBe(created.data!.id);
      });

      it('should return undefined for unknown ID', () => {
        expect(manager.getEnvironmentalZone(uuid())).toBeUndefined();
      });
    });

    describe('listEnvironmentalZones', () => {
      it('should list all zones', () => {
        manager.createEnvironmentalZone(makeZoneInput({ zoneName: 'Zone A' }));
        manager.createEnvironmentalZone(makeZoneInput({ zoneName: 'Zone B' }));

        const list = manager.listEnvironmentalZones();
        expect(list).toHaveLength(2);
      });

      it('should filter by facilityId', () => {
        const otherFacility = uuid();
        manager.createEnvironmentalZone(makeZoneInput({ zoneName: 'Zone A' }));
        manager.createEnvironmentalZone(makeZoneInput({ zoneName: 'Zone B', facilityId: otherFacility }));

        const list = manager.listEnvironmentalZones(FACILITY_ID);
        expect(list).toHaveLength(1);
        expect(list[0].zoneName).toBe('Zone A');
      });
    });

    describe('attachSensorToZone', () => {
      it('should attach a sensor to a zone', () => {
        const zone = manager.createEnvironmentalZone(makeZoneInput());
        const sensor = manager.registerSensor(makeSensorInput());

        const result = manager.attachSensorToZone(zone.data!.id, sensor.data!.id);

        expect(result.success).toBe(true);
        expect(result.data!.sensorIds).toContain(sensor.data!.id);
        expect(result.data!.sensorIds).toHaveLength(1);
      });

      it('should not duplicate sensor ID when attaching the same sensor twice', () => {
        const zone = manager.createEnvironmentalZone(makeZoneInput());
        const sensor = manager.registerSensor(makeSensorInput());

        manager.attachSensorToZone(zone.data!.id, sensor.data!.id);
        manager.attachSensorToZone(zone.data!.id, sensor.data!.id);

        const retrieved = manager.getEnvironmentalZone(zone.data!.id);
        expect(retrieved!.sensorIds).toHaveLength(1);
      });

      it('should allow multiple sensors attached to a zone', () => {
        const zone = manager.createEnvironmentalZone(makeZoneInput());
        const s1 = manager.registerSensor(makeSensorInput({ sensorCode: 'S-001' }));
        const s2 = manager.registerSensor(makeSensorInput({ sensorCode: 'S-002' }));

        manager.attachSensorToZone(zone.data!.id, s1.data!.id);
        manager.attachSensorToZone(zone.data!.id, s2.data!.id);

        const retrieved = manager.getEnvironmentalZone(zone.data!.id);
        expect(retrieved!.sensorIds).toHaveLength(2);
      });

      it('should return NOT_FOUND for unknown zone', () => {
        const result = manager.attachSensorToZone(uuid(), uuid());
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });
    });
  });

  // ===========================================================================
  // STATS
  // ===========================================================================

  describe('Stats', () => {
    describe('getIoTStats', () => {
      it('should return complete stats for a tenant', () => {
        // Register sensors
        const s1 = manager.registerSensor(makeSensorInput({ sensorCode: 'S-001' }));
        const s2 = manager.registerSensor(
          makeSensorInput({ sensorCode: 'S-002', sensorType: 'humidity', unit: '%' })
        );
        manager.activateSensor(s1.data!.id);
        manager.updateBattery(s2.data!.id, 5); // triggers low_battery

        // Create reefer profiles
        const containerId1 = uuid();
        const containerId2 = uuid();
        manager.createReeferProfile(makeReeferProfileInput({ containerId: containerId1 }));
        manager.createReeferProfile(makeReeferProfileInput({ containerId: containerId2 }));
        manager.plugInReefer(containerId1, 'shore_power');

        // Create GPS track
        manager.updateGPS(makeGPSInput({ entityId: uuid() }));

        // Create environmental zone
        manager.createEnvironmentalZone(makeZoneInput());

        // Record some readings
        manager.recordReading({ sensorId: s1.data!.id, value: -20 });
        manager.recordReading({ sensorId: s1.data!.id, value: -10 }); // alert

        const stats = manager.getIoTStats(TENANT_ID);

        // Sensor stats
        expect(stats.sensors.total).toBe(2);
        expect(stats.sensors.active).toBe(1);
        expect(stats.sensors.lowBattery).toBe(1);
        expect(stats.sensors.byType['temperature']).toBe(1);
        expect(stats.sensors.byType['humidity']).toBe(1);

        // Reading stats
        expect(stats.readings.totalToday).toBeGreaterThanOrEqual(2);
        expect(stats.readings.alertsToday).toBeGreaterThanOrEqual(1);
        expect(stats.readings.avgReadingInterval).toBe(300); // (300 + 300) / 2

        // Reefer stats
        expect(stats.reefer.monitored).toBe(2);
        expect(stats.reefer.pluggedIn).toBe(1);
        expect(stats.reefer.unplugged).toBe(1);

        // GPS stats
        expect(stats.gps.trackedEntities).toBeGreaterThanOrEqual(1);

        // Environmental stats
        expect(stats.environmental.monitoredZones).toBe(1);
      });

      it('should return zeroed stats for tenant with no data', () => {
        const stats = manager.getIoTStats('empty-tenant');

        expect(stats.sensors.total).toBe(0);
        expect(stats.sensors.active).toBe(0);
        expect(stats.readings.totalToday).toBe(0);
        expect(stats.reefer.monitored).toBe(0);
        expect(stats.environmental.monitoredZones).toBe(0);
      });

      it('should include date in stats', () => {
        const stats = manager.getIoTStats(TENANT_ID);
        expect(stats.date).toBeInstanceOf(Date);
      });
    });
  });
});
