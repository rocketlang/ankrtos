// =============================================================================
// ankrICD - IoT Manager
// =============================================================================
// Manages IoT sensors, reefer container monitoring, GPS tracking, and
// environmental monitoring.
// =============================================================================

import type { UUID, OperationResult } from '../types/common';
import type {
  IoTSensor,
  SensorType,
  SensorStatus,
  SensorReading,
  ReeferMonitoringProfile,
  ReeferAlarm,
  ReeferAlarmType,
  GPSTrack,
  GPSPosition,
  EnvironmentalZone,
  IoTStats,
} from '../types/iot';
import { emit } from '../core/event-bus';

// =============================================================================
// INPUT TYPES
// =============================================================================

export interface RegisterSensorInput {
  tenantId: string;
  facilityId: UUID;
  sensorCode: string;
  sensorType: SensorType;
  name: string;
  attachedTo?: string;
  attachedToType?: IoTSensor['attachedToType'];
  attachedToId?: UUID;
  readingInterval?: number;
  alertThresholdMin?: number;
  alertThresholdMax?: number;
  unit?: string;
  connectionType?: IoTSensor['connectionType'];
  deviceEUI?: string;
}

export interface RecordReadingInput {
  sensorId: UUID;
  value: number;
  unit?: string;
  quality?: 'good' | 'fair' | 'poor';
  latitude?: number;
  longitude?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
}

export interface CreateReeferProfileInput {
  tenantId: string;
  facilityId: UUID;
  containerId: UUID;
  containerNumber: string;
  setTemperature: number;
  temperatureUnit?: 'C' | 'F';
  minTemperature: number;
  maxTemperature: number;
  setHumidity?: number;
  ventSetting?: number;
  monitoringInterval?: number;
}

export interface UpdateGPSInput {
  entityType: 'equipment' | 'vehicle' | 'container';
  entityId: UUID;
  entityNumber: string;
  facilityId: UUID;
  position: GPSPosition;
}

export interface CreateEnvironmentalZoneInput {
  tenantId: string;
  facilityId: UUID;
  zoneName: string;
  zoneType: EnvironmentalZone['zoneType'];
  temperatureMin?: number;
  temperatureMax?: number;
  humidityMin?: number;
  humidityMax?: number;
  co2Max?: number;
}

export interface SensorQueryOptions {
  tenantId?: string;
  facilityId?: UUID;
  sensorType?: SensorType;
  status?: SensorStatus;
  attachedToId?: UUID;
}

// =============================================================================
// HELPERS
// =============================================================================

let counter = 0;
function nextId(): UUID {
  return `iot-${Date.now()}-${++counter}`;
}

// =============================================================================
// IOT MANAGER
// =============================================================================

export class IoTManager {
  private sensors = new Map<UUID, IoTSensor>();
  private readings: SensorReading[] = [];
  private reeferProfiles = new Map<UUID, ReeferMonitoringProfile>();
  private gpsTracks = new Map<string, GPSTrack>(); // key: entityType:entityId
  private environmentalZones = new Map<UUID, EnvironmentalZone>();

  // ===========================================================================
  // SENSOR MANAGEMENT
  // ===========================================================================

  registerSensor(input: RegisterSensorInput): OperationResult<IoTSensor> {
    const id = nextId();
    const sensor: IoTSensor = {
      id,
      tenantId: input.tenantId,
      sensorCode: input.sensorCode,
      sensorType: input.sensorType,
      name: input.name,
      status: 'inactive',
      facilityId: input.facilityId,
      attachedTo: input.attachedTo,
      attachedToType: input.attachedToType,
      attachedToId: input.attachedToId,
      readingInterval: input.readingInterval ?? 60,
      alertThresholdMin: input.alertThresholdMin,
      alertThresholdMax: input.alertThresholdMax,
      unit: input.unit,
      connectionType: input.connectionType,
      deviceEUI: input.deviceEUI,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sensors.set(id, sensor);
    return { success: true, data: sensor };
  }

  getSensor(id: UUID): IoTSensor | undefined {
    return this.sensors.get(id);
  }

  listSensors(options?: SensorQueryOptions): IoTSensor[] {
    let list = [...this.sensors.values()];
    if (options?.tenantId) list = list.filter((s) => s.tenantId === options.tenantId);
    if (options?.facilityId) list = list.filter((s) => s.facilityId === options.facilityId);
    if (options?.sensorType) list = list.filter((s) => s.sensorType === options.sensorType);
    if (options?.status) list = list.filter((s) => s.status === options.status);
    if (options?.attachedToId) list = list.filter((s) => s.attachedToId === options.attachedToId);
    return list;
  }

  activateSensor(sensorId: UUID): OperationResult<IoTSensor> {
    const sensor = this.sensors.get(sensorId);
    if (!sensor) return { success: false, error: 'Sensor not found', errorCode: 'NOT_FOUND' };
    sensor.status = 'active';
    sensor.updatedAt = new Date();
    return { success: true, data: sensor };
  }

  deactivateSensor(sensorId: UUID): OperationResult<IoTSensor> {
    const sensor = this.sensors.get(sensorId);
    if (!sensor) return { success: false, error: 'Sensor not found', errorCode: 'NOT_FOUND' };
    sensor.status = 'inactive';
    sensor.updatedAt = new Date();
    return { success: true, data: sensor };
  }

  updateBattery(sensorId: UUID, level: number, voltage?: number): OperationResult<IoTSensor> {
    const sensor = this.sensors.get(sensorId);
    if (!sensor) return { success: false, error: 'Sensor not found', errorCode: 'NOT_FOUND' };
    sensor.batteryLevel = level;
    sensor.batteryVoltage = voltage;
    if (level < (sensor.lowBatteryThreshold ?? 20)) {
      sensor.status = 'low_battery';
    }
    sensor.updatedAt = new Date();
    return { success: true, data: sensor };
  }

  // ===========================================================================
  // SENSOR READINGS
  // ===========================================================================

  recordReading(input: RecordReadingInput): OperationResult<SensorReading> {
    const sensor = this.sensors.get(input.sensorId);
    if (!sensor) return { success: false, error: 'Sensor not found', errorCode: 'NOT_FOUND' };

    const isAlert =
      (sensor.alertThresholdMin !== undefined && input.value < sensor.alertThresholdMin) ||
      (sensor.alertThresholdMax !== undefined && input.value > sensor.alertThresholdMax);

    let alertType: SensorReading['alertType'];
    if (isAlert) {
      alertType = sensor.alertThresholdMax !== undefined && input.value > sensor.alertThresholdMax ? 'high' : 'low';
    }

    const id = nextId();
    const reading: SensorReading = {
      id,
      sensorId: input.sensorId,
      sensorType: sensor.sensorType,
      value: input.value,
      unit: input.unit ?? sensor.unit ?? '',
      timestamp: new Date(),
      quality: input.quality,
      isAlert,
      alertType,
      alertMessage: isAlert ? `${sensor.sensorType} ${alertType}: ${input.value} ${sensor.unit ?? ''}` : undefined,
      facilityId: sensor.facilityId,
      attachedToId: sensor.attachedToId,
      attachedToType: sensor.attachedToType,
      latitude: input.latitude,
      longitude: input.longitude,
      altitude: input.altitude,
      speed: input.speed,
      heading: input.heading,
    };

    this.readings.push(reading);
    // Keep last 10000 readings in memory
    if (this.readings.length > 10000) {
      this.readings = this.readings.slice(-10000);
    }

    sensor.lastReading = reading;
    sensor.lastReadingTime = new Date();
    sensor.updatedAt = new Date();

    if (isAlert) {
      emit('iot.sensor_alert' as any, {
        sensorId: sensor.id,
        sensorType: sensor.sensorType,
        value: input.value,
        alertType,
        attachedTo: sensor.attachedTo,
        timestamp: new Date(),
      }, { tenantId: sensor.tenantId });
    }

    // Update reefer profile if applicable
    if (sensor.attachedToType === 'container' && sensor.sensorType === 'temperature' && sensor.attachedToId) {
      this.updateReeferTemperature(sensor.attachedToId, input.value);
    }

    // Update GPS track if applicable
    if (sensor.sensorType === 'gps' && input.latitude !== undefined && input.longitude !== undefined) {
      this.updateGPSFromSensor(sensor, input);
    }

    return { success: true, data: reading };
  }

  getReadings(sensorId: UUID, limit?: number): SensorReading[] {
    return this.readings
      .filter((r) => r.sensorId === sensorId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit ?? 100);
  }

  getAlerts(facilityId: UUID, limit?: number): SensorReading[] {
    return this.readings
      .filter((r) => r.facilityId === facilityId && r.isAlert)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit ?? 50);
  }

  // ===========================================================================
  // REEFER MONITORING
  // ===========================================================================

  createReeferProfile(input: CreateReeferProfileInput): OperationResult<ReeferMonitoringProfile> {
    const id = nextId();
    const profile: ReeferMonitoringProfile = {
      id,
      tenantId: input.tenantId,
      containerId: input.containerId,
      containerNumber: input.containerNumber,
      facilityId: input.facilityId,
      setTemperature: input.setTemperature,
      temperatureUnit: input.temperatureUnit ?? 'C',
      minTemperature: input.minTemperature,
      maxTemperature: input.maxTemperature,
      setHumidity: input.setHumidity,
      ventSetting: input.ventSetting,
      powerStatus: 'unplugged',
      compressorRunning: false,
      defrostMode: false,
      doorStatus: 'closed',
      alarms: [],
      activeAlarmCount: 0,
      sensorIds: [],
      temperatureHistory: [],
      humidityHistory: [],
      monitoringInterval: input.monitoringInterval ?? 300,
      excursionCount: 0,
      totalExcursionMinutes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.reeferProfiles.set(input.containerId, profile);
    return { success: true, data: profile };
  }

  getReeferProfile(containerId: UUID): ReeferMonitoringProfile | undefined {
    return this.reeferProfiles.get(containerId);
  }

  listReeferProfiles(facilityId?: UUID): ReeferMonitoringProfile[] {
    let list = [...this.reeferProfiles.values()];
    if (facilityId) list = list.filter((p) => p.facilityId === facilityId);
    return list;
  }

  plugInReefer(containerId: UUID, powerSource?: string): OperationResult<ReeferMonitoringProfile> {
    const profile = this.reeferProfiles.get(containerId);
    if (!profile) return { success: false, error: 'Reefer profile not found', errorCode: 'NOT_FOUND' };
    profile.powerStatus = 'plugged';
    profile.powerSource = powerSource;
    profile.pluggedInAt = new Date();
    profile.compressorRunning = true;
    profile.updatedAt = new Date();

    emit('container.reefer_plugged' as any, {
      containerId,
      containerNumber: profile.containerNumber,
      timestamp: new Date(),
    }, { tenantId: profile.tenantId });

    return { success: true, data: profile };
  }

  unplugReefer(containerId: UUID): OperationResult<ReeferMonitoringProfile> {
    const profile = this.reeferProfiles.get(containerId);
    if (!profile) return { success: false, error: 'Reefer profile not found', errorCode: 'NOT_FOUND' };
    profile.powerStatus = 'unplugged';
    profile.unpluggedAt = new Date();
    profile.compressorRunning = false;
    profile.updatedAt = new Date();

    emit('container.reefer_unplugged' as any, {
      containerId,
      containerNumber: profile.containerNumber,
      timestamp: new Date(),
    }, { tenantId: profile.tenantId });

    return { success: true, data: profile };
  }

  private updateReeferTemperature(containerId: UUID, temperature: number): void {
    const profile = this.reeferProfiles.get(containerId);
    if (!profile) return;

    profile.currentTemperature = temperature;
    profile.lastCheckedAt = new Date();
    profile.temperatureHistory.push({ timestamp: new Date(), value: temperature });
    if (profile.temperatureHistory.length > 288) { // ~24h at 5min intervals
      profile.temperatureHistory = profile.temperatureHistory.slice(-288);
    }

    // Check excursion
    if (temperature < profile.minTemperature || temperature > profile.maxTemperature) {
      profile.excursionCount++;
      const alarmType: ReeferAlarmType = temperature > profile.maxTemperature ? 'temperature_high' : 'temperature_low';
      const existingAlarm = profile.alarms.find((a) => a.alarmType === alarmType && a.isActive);
      if (!existingAlarm) {
        const alarm: ReeferAlarm = {
          id: nextId(),
          alarmType,
          severity: 'critical',
          message: `Temperature ${alarmType === 'temperature_high' ? 'above' : 'below'} threshold: ${temperature}${profile.temperatureUnit}`,
          value: temperature,
          threshold: alarmType === 'temperature_high' ? profile.maxTemperature : profile.minTemperature,
          triggeredAt: new Date(),
          isActive: true,
        };
        profile.alarms.push(alarm);
        profile.activeAlarmCount = profile.alarms.filter((a) => a.isActive).length;

        emit('iot.reefer_alarm' as any, {
          containerId,
          containerNumber: profile.containerNumber,
          alarmType,
          temperature,
          threshold: alarm.threshold,
          timestamp: new Date(),
        }, { tenantId: profile.tenantId });
      }
    }
    profile.updatedAt = new Date();
  }

  acknowledgeReeferAlarm(containerId: UUID, alarmId: UUID, acknowledgedBy: string): OperationResult<ReeferMonitoringProfile> {
    const profile = this.reeferProfiles.get(containerId);
    if (!profile) return { success: false, error: 'Reefer profile not found', errorCode: 'NOT_FOUND' };
    const alarm = profile.alarms.find((a) => a.id === alarmId);
    if (!alarm) return { success: false, error: 'Alarm not found', errorCode: 'NOT_FOUND' };
    alarm.acknowledgedAt = new Date();
    alarm.acknowledgedBy = acknowledgedBy;
    profile.updatedAt = new Date();
    return { success: true, data: profile };
  }

  resolveReeferAlarm(containerId: UUID, alarmId: UUID, resolvedBy: string): OperationResult<ReeferMonitoringProfile> {
    const profile = this.reeferProfiles.get(containerId);
    if (!profile) return { success: false, error: 'Reefer profile not found', errorCode: 'NOT_FOUND' };
    const alarm = profile.alarms.find((a) => a.id === alarmId);
    if (!alarm) return { success: false, error: 'Alarm not found', errorCode: 'NOT_FOUND' };
    alarm.isActive = false;
    alarm.resolvedAt = new Date();
    alarm.resolvedBy = resolvedBy;
    profile.activeAlarmCount = profile.alarms.filter((a) => a.isActive).length;
    profile.updatedAt = new Date();
    return { success: true, data: profile };
  }

  // ===========================================================================
  // GPS TRACKING
  // ===========================================================================

  updateGPS(input: UpdateGPSInput): OperationResult<GPSTrack> {
    const key = `${input.entityType}:${input.entityId}`;
    let track = this.gpsTracks.get(key);

    if (!track) {
      track = {
        id: nextId(),
        entityType: input.entityType,
        entityId: input.entityId,
        entityNumber: input.entityNumber,
        facilityId: input.facilityId,
        currentPosition: input.position,
        lastUpdated: new Date(),
        insideGeofence: true,
        geofenceViolations: [],
        trackHistory: [],
        totalDistance: 0,
        idleTime: 0,
        movingTime: 0,
        createdAt: new Date(),
      };
      this.gpsTracks.set(key, track);
    }

    // Calculate distance from last point
    if (track.trackHistory.length > 0) {
      const last = track.trackHistory[track.trackHistory.length - 1]!;
      const dist = this.haversineDistance(
        last.latitude, last.longitude,
        input.position.latitude, input.position.longitude,
      );
      track.totalDistance += dist;

      // Idle/moving
      const timeDiff = (input.position.timestamp.getTime() - last.timestamp.getTime()) / 60000;
      if ((input.position.speed ?? 0) < 2) {
        track.idleTime += timeDiff;
      } else {
        track.movingTime += timeDiff;
      }
    }

    track.trackHistory.push(input.position);
    if (track.trackHistory.length > 500) {
      track.trackHistory = track.trackHistory.slice(-500);
    }

    track.currentPosition = input.position;
    track.lastUpdated = new Date();

    return { success: true, data: track };
  }

  getGPSTrack(entityType: string, entityId: UUID): GPSTrack | undefined {
    return this.gpsTracks.get(`${entityType}:${entityId}`);
  }

  listGPSTracks(facilityId?: UUID): GPSTrack[] {
    let list = [...this.gpsTracks.values()];
    if (facilityId) list = list.filter((t) => t.facilityId === facilityId);
    return list;
  }

  private updateGPSFromSensor(sensor: IoTSensor, input: RecordReadingInput): void {
    if (!sensor.attachedToId || !sensor.attachedToType || !input.latitude || !input.longitude) return;

    this.updateGPS({
      entityType: sensor.attachedToType as any,
      entityId: sensor.attachedToId,
      entityNumber: sensor.attachedTo ?? sensor.attachedToId,
      facilityId: sensor.facilityId,
      position: {
        latitude: input.latitude,
        longitude: input.longitude,
        altitude: input.altitude,
        speed: input.speed,
        heading: input.heading,
        timestamp: new Date(),
      },
    });
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // ===========================================================================
  // ENVIRONMENTAL MONITORING
  // ===========================================================================

  createEnvironmentalZone(input: CreateEnvironmentalZoneInput): OperationResult<EnvironmentalZone> {
    const id = nextId();
    const zone: EnvironmentalZone = {
      id,
      tenantId: input.tenantId,
      zoneName: input.zoneName,
      zoneType: input.zoneType,
      facilityId: input.facilityId,
      temperatureMin: input.temperatureMin,
      temperatureMax: input.temperatureMax,
      humidityMin: input.humidityMin,
      humidityMax: input.humidityMax,
      co2Max: input.co2Max,
      sensorIds: [],
      activeAlerts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.environmentalZones.set(id, zone);
    return { success: true, data: zone };
  }

  getEnvironmentalZone(id: UUID): EnvironmentalZone | undefined {
    return this.environmentalZones.get(id);
  }

  listEnvironmentalZones(facilityId?: UUID): EnvironmentalZone[] {
    let list = [...this.environmentalZones.values()];
    if (facilityId) list = list.filter((z) => z.facilityId === facilityId);
    return list;
  }

  attachSensorToZone(zoneId: UUID, sensorId: UUID): OperationResult<EnvironmentalZone> {
    const zone = this.environmentalZones.get(zoneId);
    if (!zone) return { success: false, error: 'Zone not found', errorCode: 'NOT_FOUND' };
    if (!zone.sensorIds.includes(sensorId)) zone.sensorIds.push(sensorId);
    zone.updatedAt = new Date();
    return { success: true, data: zone };
  }

  // ===========================================================================
  // STATS
  // ===========================================================================

  getIoTStats(tenantId: string): IoTStats {
    const sensors = [...this.sensors.values()].filter((s) => s.tenantId === tenantId);
    const profiles = [...this.reeferProfiles.values()].filter((p) => p.tenantId === tenantId);
    const tracks = [...this.gpsTracks.values()];
    const zones = [...this.environmentalZones.values()].filter((z) => z.tenantId === tenantId);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayReadings = this.readings.filter((r) => r.timestamp >= todayStart);
    const todayAlerts = todayReadings.filter((r) => r.isAlert);

    const byType: Record<string, number> = {};
    for (const s of sensors) {
      byType[s.sensorType] = (byType[s.sensorType] ?? 0) + 1;
    }

    const pluggedIn = profiles.filter((p) => p.powerStatus === 'plugged');
    const activeAlarms = profiles.reduce((s, p) => s + p.activeAlarmCount, 0);
    const avgTemp = pluggedIn.length > 0
      ? pluggedIn.reduce((s, p) => s + (p.currentTemperature ?? 0), 0) / pluggedIn.length
      : 0;

    return {
      date: new Date(),
      sensors: {
        total: sensors.length,
        active: sensors.filter((s) => s.status === 'active').length,
        lowBattery: sensors.filter((s) => s.status === 'low_battery').length,
        error: sensors.filter((s) => s.status === 'error').length,
        disconnected: sensors.filter((s) => s.status === 'disconnected').length,
        byType,
      },
      readings: {
        totalToday: todayReadings.length,
        alertsToday: todayAlerts.length,
        avgReadingInterval: sensors.length > 0
          ? Math.round(sensors.reduce((s, sensor) => s + sensor.readingInterval, 0) / sensors.length)
          : 0,
      },
      reefer: {
        monitored: profiles.length,
        pluggedIn: pluggedIn.length,
        unplugged: profiles.filter((p) => p.powerStatus === 'unplugged').length,
        activeAlarms,
        excursions: profiles.reduce((s, p) => s + p.excursionCount, 0),
        avgTemperature: Math.round(avgTemp * 10) / 10,
      },
      gps: {
        trackedEntities: tracks.length,
        geofenceViolations: tracks.reduce((s, t) => s + t.geofenceViolations.length, 0),
        totalDistanceKm: Math.round(tracks.reduce((s, t) => s + t.totalDistance, 0) * 10) / 10,
      },
      environmental: {
        monitoredZones: zones.length,
        alertsActive: zones.reduce((s, z) => s + z.activeAlerts, 0),
      },
    };
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let instance: IoTManager | null = null;

export function getIoTManager(): IoTManager {
  if (!instance) instance = new IoTManager();
  return instance;
}

export function setIoTManager(manager: IoTManager): void {
  instance = manager;
}
