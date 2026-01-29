// =============================================================================
// ankrICD - IoT Types
// =============================================================================
// Types for reefer container monitoring, GPS equipment tracking,
// environmental sensors, and IoT telemetry.
// =============================================================================

import type { UUID, TenantEntity } from './common';

// =============================================================================
// IOT SENSOR (Base)
// =============================================================================

export type SensorType =
  | 'temperature'
  | 'humidity'
  | 'gps'
  | 'fuel_level'
  | 'door_status'
  | 'motion'
  | 'vibration'
  | 'pressure'
  | 'light'
  | 'power'
  | 'weight'
  | 'tilt'
  | 'co2'
  | 'smoke'
  | 'water_level';

export type SensorStatus = 'active' | 'inactive' | 'low_battery' | 'error' | 'disconnected';

export interface IoTSensor extends TenantEntity {
  id: UUID;
  sensorCode: string;
  sensorType: SensorType;
  name: string;
  status: SensorStatus;
  facilityId: UUID;

  // Attachment
  attachedTo?: string;        // container number, equipment ID, etc.
  attachedToType?: 'container' | 'equipment' | 'vehicle' | 'facility' | 'zone';
  attachedToId?: UUID;

  // Configuration
  readingInterval: number;    // seconds between readings
  alertThresholdMin?: number;
  alertThresholdMax?: number;
  unit?: string;              // C, %, psi, etc.

  // Battery
  batteryLevel?: number;      // 0-100
  batteryVoltage?: number;
  lowBatteryThreshold?: number;

  // Connection
  connectionType?: 'wifi' | 'lora' | 'nb_iot' | 'lte_m' | 'bluetooth' | 'zigbee' | 'satellite';
  deviceEUI?: string;         // LoRaWAN EUI
  imei?: string;              // Cellular IMEI

  // Last reading
  lastReading?: SensorReading;
  lastReadingTime?: Date;

  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// SENSOR READINGS
// =============================================================================

export interface SensorReading {
  id: UUID;
  sensorId: UUID;
  sensorType: SensorType;
  value: number;
  unit: string;
  timestamp: Date;

  // Quality
  quality?: 'good' | 'fair' | 'poor';
  raw?: number;
  calibrated?: boolean;

  // Alert
  isAlert: boolean;
  alertType?: 'high' | 'low' | 'out_of_range' | 'rate_of_change';
  alertMessage?: string;

  // Context
  facilityId: UUID;
  attachedToId?: UUID;
  attachedToType?: string;

  // GPS specific
  latitude?: number;
  longitude?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  hdop?: number; // GPS accuracy

  metadata?: Record<string, unknown>;
}

// =============================================================================
// REEFER MONITORING
// =============================================================================

export type ReeferAlarmType =
  | 'temperature_high'
  | 'temperature_low'
  | 'defrost_failure'
  | 'power_failure'
  | 'door_open'
  | 'compressor_fault'
  | 'fan_fault'
  | 'sensor_fault'
  | 'humidity_high'
  | 'co2_high';

export interface ReeferMonitoringProfile extends TenantEntity {
  id: UUID;
  containerId: UUID;
  containerNumber: string;
  facilityId: UUID;

  // Set points
  setTemperature: number;     // Celsius
  temperatureUnit: 'C' | 'F';
  minTemperature: number;
  maxTemperature: number;
  setHumidity?: number;       // %
  ventSetting?: number;       // % open

  // Current readings
  currentTemperature?: number;
  currentHumidity?: number;
  returnAirTemperature?: number;
  supplyAirTemperature?: number;

  // Power
  powerStatus: 'plugged' | 'unplugged' | 'generator';
  powerSource?: string;
  pluggedInAt?: Date;
  unpluggedAt?: Date;

  // Status
  compressorRunning: boolean;
  defrostMode: boolean;
  doorStatus: 'closed' | 'open';
  alarms: ReeferAlarm[];
  activeAlarmCount: number;

  // Sensors
  sensorIds: UUID[];

  // History
  temperatureHistory: { timestamp: Date; value: number }[];
  humidityHistory: { timestamp: Date; value: number }[];

  // Monitoring
  monitoringInterval: number; // seconds
  lastCheckedAt?: Date;
  nextCheckDue?: Date;
  excursionCount: number;     // temp out of range events
  totalExcursionMinutes: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface ReeferAlarm {
  id: UUID;
  alarmType: ReeferAlarmType;
  severity: 'warning' | 'critical';
  message: string;
  value?: number;
  threshold?: number;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  isActive: boolean;
}

// =============================================================================
// GPS TRACKING
// =============================================================================

export interface GPSPosition {
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number;            // km/h
  heading?: number;          // degrees
  accuracy?: number;         // meters
  timestamp: Date;
}

export interface GPSTrack {
  id: UUID;
  entityType: 'equipment' | 'vehicle' | 'container';
  entityId: UUID;
  entityNumber: string;
  facilityId: UUID;

  // Current
  currentPosition: GPSPosition;
  lastUpdated: Date;

  // Geofence
  insideGeofence: boolean;
  currentZone?: string;
  geofenceViolations: {
    exitedAt: Date;
    returnedAt?: Date;
    zone: string;
  }[];

  // Track history (last N points)
  trackHistory: GPSPosition[];
  totalDistance: number;      // km
  idleTime: number;           // minutes
  movingTime: number;         // minutes

  createdAt: Date;
}

// =============================================================================
// ENVIRONMENTAL MONITORING
// =============================================================================

export interface EnvironmentalZone extends TenantEntity {
  id: UUID;
  zoneName: string;
  zoneType: 'warehouse' | 'yard' | 'reefer_area' | 'hazmat_area' | 'office' | 'cold_storage';
  facilityId: UUID;

  // Thresholds
  temperatureMin?: number;
  temperatureMax?: number;
  humidityMin?: number;
  humidityMax?: number;
  co2Max?: number;

  // Current conditions
  currentTemperature?: number;
  currentHumidity?: number;
  currentCO2?: number;

  // Sensors
  sensorIds: UUID[];

  // Alerts
  activeAlerts: number;

  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// IOT STATS
// =============================================================================

export interface IoTStats {
  date: Date;
  sensors: {
    total: number;
    active: number;
    lowBattery: number;
    error: number;
    disconnected: number;
    byType: Record<string, number>;
  };
  readings: {
    totalToday: number;
    alertsToday: number;
    avgReadingInterval: number;
  };
  reefer: {
    monitored: number;
    pluggedIn: number;
    unplugged: number;
    activeAlarms: number;
    excursions: number;
    avgTemperature: number;
  };
  gps: {
    trackedEntities: number;
    geofenceViolations: number;
    totalDistanceKm: number;
  };
  environmental: {
    monitoredZones: number;
    alertsActive: number;
  };
}
