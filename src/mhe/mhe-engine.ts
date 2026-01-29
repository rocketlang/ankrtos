// Advanced Equipment & MHE (Material Handling Equipment) Engine for ankrICD
// Telematics, geofence, operator certification, safety/incidents, charging/battery,
// enhanced maintenance, equipment lifecycle, and comprehensive stats

import { v4 as uuidv4 } from 'uuid';
import type { UUID, OperationResult, Coordinates } from '../types/common';
import type {
  TelematicsRecord,
  TelematicsStatus,
  GeofenceZone,
  OperatorCertification,
  CertificationType,
  CertificationStatus,
  TrainingRecord,
  SafetyIncident,
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
  PreShiftSafetyCheck,
  SafetyCheckItem,
  ChargingDock,
  ChargingDockStatus,
  ChargingSession,
  BatterySwap,
  MaintenanceWorkOrder,
  MaintenanceWorkOrderStatus,
  MaintenanceWorkOrderPriority,
  EquipmentLifecycle,
  MHEStats,
} from '../types/mhe';
import { emit } from '../core';

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface RecordTelematicsInput {
  tenantId: string;
  facilityId: string;
  equipmentId: UUID;
  equipmentCode: string;
  position?: Coordinates;
  speed?: number;
  heading?: number;
  engineRunning: boolean;
  engineHours: number;
  fuelLevelPercent?: number;
  batteryLevelPercent?: number;
  batteryVoltage?: number;
  isCharging?: boolean;
}

export interface CreateGeofenceInput {
  tenantId: string;
  facilityId: string;
  name: string;
  zoneType: 'operating_area' | 'restricted' | 'charging_area' | 'parking' | 'maintenance';
  centerPoint: Coordinates;
  radiusMeters: number;
  maxSpeedKmh?: number;
  allowedEquipmentTypes?: string[];
  alertOnEntry?: boolean;
  alertOnExit?: boolean;
  alertOnOverspeed?: boolean;
}

export interface RegisterCertificationInput {
  tenantId: string;
  facilityId: string;
  operatorId: UUID;
  operatorName: string;
  certType: CertificationType;
  certNumber: string;
  issuedBy: string;
  issuedDate: Date;
  expiryDate: Date;
  trainingProvider?: string;
  trainingDate?: Date;
  trainingHours?: number;
  examScore?: number;
  renewalReminderDays?: number;
}

export interface RecordTrainingInput {
  tenantId: string;
  facilityId: string;
  operatorId: UUID;
  operatorName: string;
  trainingType: string;
  trainingName: string;
  provider: string;
  startDate: Date;
  endDate?: Date;
  durationHours: number;
  completed: boolean;
  examPassed?: boolean;
  examScore?: number;
}

export interface ReportIncidentInput {
  tenantId: string;
  facilityId: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  occurredAt: Date;
  locationZone?: string;
  locationDescription?: string;
  description: string;
  equipmentId?: UUID;
  equipmentCode?: string;
  operatorId?: UUID;
  operatorName?: string;
  involvedWorkerIds?: UUID[];
  witnessIds?: UUID[];
  injuriesReported?: boolean;
  injuryDescription?: string;
  propertyDamage?: boolean;
  damageEstimate?: number;
}

export interface SubmitSafetyCheckInput {
  tenantId: string;
  facilityId: string;
  equipmentId: UUID;
  equipmentCode: string;
  operatorId: UUID;
  operatorName: string;
  shiftId?: UUID;
  items: SafetyCheckItem[];
}

export interface RegisterChargingDockInput {
  tenantId: string;
  facilityId: string;
  dockCode: string;
  location: string;
  chargerType: 'standard' | 'fast' | 'ultra_fast';
  powerRatingKW: number;
  compatibleEquipmentTypes: string[];
}

export interface StartChargingInput {
  tenantId: string;
  facilityId: string;
  dockId: UUID;
  equipmentId: UUID;
  equipmentCode: string;
  startBatteryPercent: number;
}

export interface RecordBatterySwapInput {
  tenantId: string;
  facilityId: string;
  equipmentId: UUID;
  equipmentCode: string;
  oldBatteryId: string;
  newBatteryId: string;
  oldBatteryPercent: number;
  newBatteryPercent: number;
  swappedBy: string;
  durationMinutes?: number;
}

export interface CreateWorkOrderInput {
  tenantId: string;
  facilityId: string;
  equipmentId: UUID;
  equipmentCode: string;
  equipmentType: string;
  priority: MaintenanceWorkOrderPriority;
  title: string;
  description: string;
  isPreventive?: boolean;
  isCorrective?: boolean;
  isEmergency?: boolean;
  failureDescription?: string;
  requestedBy: string;
  scheduledDate?: Date;
  assignedTechId?: UUID;
  assignedTechName?: string;
  vendorId?: UUID;
  vendorName?: string;
}

export interface RegisterLifecycleInput {
  tenantId: string;
  facilityId: string;
  equipmentId: UUID;
  equipmentCode: string;
  purchaseDate: Date;
  purchasePrice: number;
  vendorName?: string;
  warrantyExpiryDate?: Date;
  depreciationMethod: 'straight_line' | 'declining_balance' | 'units_of_production';
  usefulLifeYears: number;
  salvageValue: number;
}

// ============================================================================
// MHE ENGINE
// ============================================================================

export class MHEEngine {
  private static instance: MHEEngine | null = null;

  // Primary storage
  private telematicsRecords: Map<UUID, TelematicsRecord> = new Map();
  private geofenceZones: Map<UUID, GeofenceZone> = new Map();
  private certifications: Map<UUID, OperatorCertification> = new Map();
  private trainingRecords: Map<UUID, TrainingRecord> = new Map();
  private incidents: Map<UUID, SafetyIncident> = new Map();
  private safetyChecks: Map<UUID, PreShiftSafetyCheck> = new Map();
  private chargingDocks: Map<UUID, ChargingDock> = new Map();
  private chargingSessions: Map<UUID, ChargingSession> = new Map();
  private batterySwaps: Map<UUID, BatterySwap> = new Map();
  private workOrders: Map<UUID, MaintenanceWorkOrder> = new Map();
  private lifecycles: Map<UUID, EquipmentLifecycle> = new Map();

  // Secondary indexes
  private latestTelematicsByEquipment: Map<UUID, UUID> = new Map();
  private telematicsByEquipment: Map<UUID, UUID[]> = new Map();
  private geofenceByName: Map<string, UUID> = new Map(); // "facilityId:name" -> id
  private certsByOperator: Map<UUID, UUID[]> = new Map();
  private incidentByNumber: Map<string, UUID> = new Map();
  private safetyChecksByEquipment: Map<UUID, UUID[]> = new Map();
  private chargingDockByCode: Map<string, UUID> = new Map(); // "facilityId:code" -> id
  private sessionsByDock: Map<UUID, UUID[]> = new Map();
  private sessionsByEquipment: Map<UUID, UUID[]> = new Map();
  private workOrderByNumber: Map<string, UUID> = new Map();
  private workOrdersByEquipment: Map<UUID, UUID[]> = new Map();
  private lifecycleByEquipment: Map<UUID, UUID> = new Map();

  // Counters
  private incidentCounter = 0;
  private safetyCheckCounter = 0;
  private workOrderCounter = 0;

  private constructor() {}

  static getInstance(): MHEEngine {
    if (!MHEEngine.instance) {
      MHEEngine.instance = new MHEEngine();
    }
    return MHEEngine.instance;
  }

  static resetInstance(): void {
    MHEEngine.instance = null;
  }

  // ============================================================================
  // 1. TELEMATICS
  // ============================================================================

  recordTelematics(input: RecordTelematicsInput): OperationResult<TelematicsRecord> {
    const now = new Date();

    // Determine status
    let status: TelematicsStatus = 'offline';
    if (input.engineRunning) {
      if (input.speed !== undefined && input.speed > 0) {
        status = 'moving';
      } else {
        status = 'idle';
      }
    } else {
      status = 'offline';
    }

    // Detect idle (engine running, speed 0 or undefined, check previous records for >10 min)
    let isIdling = false;
    let idleDurationMinutes = 0;
    if (input.engineRunning && (input.speed === undefined || input.speed === 0)) {
      // Check history for continuous idle
      const prevRecordIds = this.telematicsByEquipment.get(input.equipmentId);
      if (prevRecordIds && prevRecordIds.length > 0) {
        const lastRecordId = prevRecordIds[prevRecordIds.length - 1];
        const lastRecord = lastRecordId ? this.telematicsRecords.get(lastRecordId) : undefined;
        if (lastRecord && lastRecord.isIdling) {
          idleDurationMinutes = lastRecord.idleDurationMinutes + Math.round((now.getTime() - lastRecord.timestamp.getTime()) / 60000);
        } else if (lastRecord && lastRecord.engineRunning && (lastRecord.speed === undefined || lastRecord.speed === 0)) {
          idleDurationMinutes = Math.round((now.getTime() - lastRecord.timestamp.getTime()) / 60000);
        }
      }
      isIdling = idleDurationMinutes >= 10;
      if (isIdling) {
        status = 'idle';
      }
    }

    // Check speed vs geofences for overspeed
    let isOverSpeed = false;
    let isOutOfGeofence = false;

    if (input.position) {
      for (const zone of this.geofenceZones.values()) {
        if (zone.facilityId !== input.facilityId || !zone.isActive) continue;

        const isInsideZone = this.isInsideGeofence(input.position, zone.centerPoint, zone.radiusMeters);

        // Overspeed detection within zones that have a speed limit
        if (isInsideZone && zone.maxSpeedKmh !== undefined && input.speed !== undefined && input.speed > zone.maxSpeedKmh) {
          isOverSpeed = true;
        }

        // Geofence violation: equipment is outside all operating areas
        if (zone.zoneType === 'operating_area' && !isInsideZone) {
          isOutOfGeofence = true;
        }

        // Restricted zone violation: equipment is inside a restricted zone
        if (zone.zoneType === 'restricted' && isInsideZone) {
          isOutOfGeofence = true;
        }
      }
    }

    const record: TelematicsRecord = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      equipmentId: input.equipmentId,
      equipmentCode: input.equipmentCode,
      timestamp: now,

      position: input.position,
      speed: input.speed,
      heading: input.heading,

      status,
      engineRunning: input.engineRunning,
      engineHours: input.engineHours,

      fuelLevelPercent: input.fuelLevelPercent,
      batteryLevelPercent: input.batteryLevelPercent,
      batteryVoltage: input.batteryVoltage,
      isCharging: input.isCharging ?? false,

      isOverSpeed,
      isIdling,
      idleDurationMinutes,
      isOutOfGeofence,
      impactDetected: false,
    };

    // Store
    this.telematicsRecords.set(record.id, record);
    this.latestTelematicsByEquipment.set(input.equipmentId, record.id);
    if (!this.telematicsByEquipment.has(input.equipmentId)) {
      this.telematicsByEquipment.set(input.equipmentId, []);
    }
    this.telematicsByEquipment.get(input.equipmentId)!.push(record.id);

    // Emit base event
    emit('mhe.telematics_received', {
      equipmentId: input.equipmentId,
      equipmentCode: input.equipmentCode,
      status,
    }, { tenantId: input.tenantId });

    // Emit alert events
    if (isOverSpeed) {
      emit('mhe.overspeed_alert', {
        equipmentId: input.equipmentId,
        equipmentCode: input.equipmentCode,
        speed: input.speed,
      }, { tenantId: input.tenantId });
    }

    if (isOutOfGeofence) {
      emit('mhe.geofence_violation', {
        equipmentId: input.equipmentId,
        equipmentCode: input.equipmentCode,
        position: input.position,
      }, { tenantId: input.tenantId });
    }

    if (isIdling && idleDurationMinutes >= 10) {
      emit('mhe.idle_alert', {
        equipmentId: input.equipmentId,
        equipmentCode: input.equipmentCode,
        idleDurationMinutes,
      }, { tenantId: input.tenantId });
    }

    return { success: true, data: record };
  }

  getLatestTelematics(equipmentId: UUID): TelematicsRecord | undefined {
    const recordId = this.latestTelematicsByEquipment.get(equipmentId);
    return recordId ? this.telematicsRecords.get(recordId) : undefined;
  }

  getTelematicsHistory(equipmentId: UUID, from?: Date, to?: Date): TelematicsRecord[] {
    const ids = this.telematicsByEquipment.get(equipmentId);
    if (!ids) return [];
    let records = ids
      .map(id => this.telematicsRecords.get(id))
      .filter((r): r is TelematicsRecord => r !== undefined);
    if (from) {
      records = records.filter(r => r.timestamp >= from);
    }
    if (to) {
      records = records.filter(r => r.timestamp <= to);
    }
    return records;
  }

  getFleetPositions(tenantId: string): TelematicsRecord[] {
    const result: TelematicsRecord[] = [];
    for (const [_equipmentId, recordId] of this.latestTelematicsByEquipment) {
      const record = this.telematicsRecords.get(recordId);
      if (record && record.tenantId === tenantId) {
        result.push(record);
      }
    }
    return result;
  }

  getIdlingEquipment(tenantId: string): TelematicsRecord[] {
    return this.getFleetPositions(tenantId).filter(r => r.isIdling);
  }

  getOverspeedEvents(tenantId: string, limit: number = 50): TelematicsRecord[] {
    return Array.from(this.telematicsRecords.values())
      .filter(r => r.tenantId === tenantId && r.isOverSpeed)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // ============================================================================
  // 2. GEOFENCE MANAGEMENT
  // ============================================================================

  createGeofence(input: CreateGeofenceInput): OperationResult<GeofenceZone> {
    // Validate unique name per facility
    const key = `${input.facilityId}:${input.name}`;
    if (this.geofenceByName.has(key)) {
      return { success: false, error: 'Geofence name already exists for this facility', errorCode: 'DUPLICATE_NAME' };
    }

    const now = new Date();
    const zone: GeofenceZone = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      name: input.name,
      zoneType: input.zoneType,
      centerPoint: input.centerPoint,
      radiusMeters: input.radiusMeters,
      maxSpeedKmh: input.maxSpeedKmh,
      allowedEquipmentTypes: input.allowedEquipmentTypes,
      isActive: true,
      alertOnEntry: input.alertOnEntry ?? true,
      alertOnExit: input.alertOnExit ?? true,
      alertOnOverspeed: input.alertOnOverspeed ?? true,
      createdAt: now,
      updatedAt: now,
    };

    this.geofenceZones.set(zone.id, zone);
    this.geofenceByName.set(key, zone.id);

    return { success: true, data: zone };
  }

  getGeofence(id: UUID): GeofenceZone | undefined {
    return this.geofenceZones.get(id);
  }

  listGeofences(facilityId?: string, zoneType?: GeofenceZone['zoneType'], isActive?: boolean): GeofenceZone[] {
    let zones = Array.from(this.geofenceZones.values());
    if (facilityId) zones = zones.filter(z => z.facilityId === facilityId);
    if (zoneType) zones = zones.filter(z => z.zoneType === zoneType);
    if (isActive !== undefined) zones = zones.filter(z => z.isActive === isActive);
    return zones;
  }

  updateGeofence(
    id: UUID,
    updates: { radiusMeters?: number; maxSpeedKmh?: number; alertOnEntry?: boolean; alertOnExit?: boolean; alertOnOverspeed?: boolean; allowedEquipmentTypes?: string[] },
  ): OperationResult<GeofenceZone> {
    const zone = this.geofenceZones.get(id);
    if (!zone) return { success: false, error: 'Geofence not found', errorCode: 'NOT_FOUND' };

    if (updates.radiusMeters !== undefined) zone.radiusMeters = updates.radiusMeters;
    if (updates.maxSpeedKmh !== undefined) zone.maxSpeedKmh = updates.maxSpeedKmh;
    if (updates.alertOnEntry !== undefined) zone.alertOnEntry = updates.alertOnEntry;
    if (updates.alertOnExit !== undefined) zone.alertOnExit = updates.alertOnExit;
    if (updates.alertOnOverspeed !== undefined) zone.alertOnOverspeed = updates.alertOnOverspeed;
    if (updates.allowedEquipmentTypes !== undefined) zone.allowedEquipmentTypes = updates.allowedEquipmentTypes;
    zone.updatedAt = new Date();

    return { success: true, data: zone };
  }

  toggleGeofence(id: UUID, isActive: boolean): OperationResult<GeofenceZone> {
    const zone = this.geofenceZones.get(id);
    if (!zone) return { success: false, error: 'Geofence not found', errorCode: 'NOT_FOUND' };

    zone.isActive = isActive;
    zone.updatedAt = new Date();

    return { success: true, data: zone };
  }

  private isInsideGeofence(position: Coordinates, center: Coordinates, radiusMeters: number): boolean {
    // Haversine distance approximation
    const R = 6371000; // Earth radius in meters
    const dLat = (position.latitude - center.latitude) * (Math.PI / 180);
    const dLon = (position.longitude - center.longitude) * (Math.PI / 180);
    const lat1 = center.latitude * (Math.PI / 180);
    const lat2 = position.latitude * (Math.PI / 180);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= radiusMeters;
  }

  // ============================================================================
  // 3. OPERATOR CERTIFICATION
  // ============================================================================

  registerCertification(input: RegisterCertificationInput): OperationResult<OperatorCertification> {
    const now = new Date();

    // Calculate status from expiry date
    const daysToExpiry = (input.expiryDate.getTime() - now.getTime()) / 86400000;
    let status: CertificationStatus;
    if (daysToExpiry <= 0) {
      status = 'expired';
    } else if (daysToExpiry <= (input.renewalReminderDays ?? 30)) {
      status = 'expiring_soon';
    } else {
      status = 'valid';
    }

    const cert: OperatorCertification = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      operatorId: input.operatorId,
      operatorName: input.operatorName,

      certType: input.certType,
      certNumber: input.certNumber,
      issuedBy: input.issuedBy,
      issuedDate: input.issuedDate,
      expiryDate: input.expiryDate,
      status,

      trainingProvider: input.trainingProvider,
      trainingDate: input.trainingDate,
      trainingHours: input.trainingHours,
      examScore: input.examScore,

      renewalReminderDays: input.renewalReminderDays ?? 30,

      createdAt: now,
      updatedAt: now,
    };

    this.certifications.set(cert.id, cert);
    if (!this.certsByOperator.has(input.operatorId)) {
      this.certsByOperator.set(input.operatorId, []);
    }
    this.certsByOperator.get(input.operatorId)!.push(cert.id);

    // Emit alerts for expiring/expired
    if (status === 'expiring_soon') {
      emit('mhe.certification_expiring', {
        certId: cert.id,
        operatorId: input.operatorId,
        operatorName: input.operatorName,
        certType: input.certType,
        expiryDate: input.expiryDate,
      }, { tenantId: input.tenantId });
    }
    if (status === 'expired') {
      emit('mhe.certification_expired', {
        certId: cert.id,
        operatorId: input.operatorId,
        operatorName: input.operatorName,
        certType: input.certType,
        expiryDate: input.expiryDate,
      }, { tenantId: input.tenantId });
    }

    return { success: true, data: cert };
  }

  getCertification(id: UUID): OperatorCertification | undefined {
    return this.certifications.get(id);
  }

  listCertifications(
    tenantId?: string,
    operatorId?: UUID,
    certType?: CertificationType,
    status?: CertificationStatus,
  ): OperatorCertification[] {
    let certs = Array.from(this.certifications.values());
    if (tenantId) certs = certs.filter(c => c.tenantId === tenantId);
    if (operatorId) certs = certs.filter(c => c.operatorId === operatorId);
    if (certType) certs = certs.filter(c => c.certType === certType);
    if (status) certs = certs.filter(c => c.status === status);
    return certs;
  }

  renewCertification(
    oldCertId: UUID,
    newInput: RegisterCertificationInput,
  ): OperationResult<OperatorCertification> {
    const oldCert = this.certifications.get(oldCertId);
    if (!oldCert) return { success: false, error: 'Certification not found', errorCode: 'NOT_FOUND' };

    if (oldCert.status === 'revoked') {
      return { success: false, error: 'Cannot renew a revoked certification', errorCode: 'INVALID_STATUS' };
    }

    // Register the new certification
    const result = this.registerCertification(newInput);
    if (!result.success || !result.data) {
      return result;
    }

    // Link old cert to new cert
    oldCert.renewedCertId = result.data.id;
    oldCert.renewalRequestedAt = new Date();
    oldCert.status = 'expired'; // Mark old as expired since renewed
    oldCert.updatedAt = new Date();

    return { success: true, data: result.data };
  }

  getExpiringCertifications(tenantId: string, withinDays: number = 30): OperatorCertification[] {
    const now = new Date();
    const threshold = new Date(now.getTime() + withinDays * 86400000);
    return Array.from(this.certifications.values())
      .filter(c =>
        c.tenantId === tenantId &&
        (c.status === 'valid' || c.status === 'expiring_soon') &&
        c.expiryDate <= threshold &&
        c.expiryDate > now
      );
  }

  checkOperatorEligibility(operatorId: UUID, certType: CertificationType): OperationResult<OperatorCertification> {
    const certIds = this.certsByOperator.get(operatorId);
    if (!certIds || certIds.length === 0) {
      return { success: false, error: 'No certifications found for operator', errorCode: 'NO_CERTIFICATION' };
    }

    // Find a valid cert of the required type
    const validCert = certIds
      .map(id => this.certifications.get(id))
      .filter((c): c is OperatorCertification => c !== undefined)
      .find(c => c.certType === certType && c.status === 'valid');

    if (!validCert) {
      // Check if there's an expiring one
      const expiringCert = certIds
        .map(id => this.certifications.get(id))
        .filter((c): c is OperatorCertification => c !== undefined)
        .find(c => c.certType === certType && c.status === 'expiring_soon');

      if (expiringCert) {
        return {
          success: true,
          data: expiringCert,
          warnings: ['Certification is expiring soon, please renew'],
        };
      }

      return { success: false, error: 'No valid certification found for this type', errorCode: 'INVALID_CERTIFICATION' };
    }

    return { success: true, data: validCert };
  }

  recordTraining(input: RecordTrainingInput): OperationResult<TrainingRecord> {
    const now = new Date();

    const record: TrainingRecord = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      operatorId: input.operatorId,
      operatorName: input.operatorName,

      trainingType: input.trainingType,
      trainingName: input.trainingName,
      provider: input.provider,
      startDate: input.startDate,
      endDate: input.endDate,
      durationHours: input.durationHours,

      completed: input.completed,
      examPassed: input.examPassed,
      examScore: input.examScore,

      documents: [],

      createdAt: now,
      updatedAt: now,
    };

    this.trainingRecords.set(record.id, record);

    return { success: true, data: record };
  }

  // ============================================================================
  // 4. SAFETY & INCIDENTS
  // ============================================================================

  reportIncident(input: ReportIncidentInput): OperationResult<SafetyIncident> {
    const now = new Date();
    this.incidentCounter++;
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const incidentNumber = `INC-${dateStr}-${String(this.incidentCounter).padStart(3, '0')}`;

    const incident: SafetyIncident = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      incidentNumber,
      incidentType: input.incidentType,
      severity: input.severity,
      status: 'reported',

      occurredAt: input.occurredAt,
      reportedAt: now,
      locationZone: input.locationZone,
      locationDescription: input.locationDescription,

      description: input.description,
      equipmentId: input.equipmentId,
      equipmentCode: input.equipmentCode,
      operatorId: input.operatorId,
      operatorName: input.operatorName,

      involvedWorkerIds: input.involvedWorkerIds ?? [],
      witnessIds: input.witnessIds ?? [],
      injuriesReported: input.injuriesReported ?? false,
      injuryDescription: input.injuryDescription,
      propertyDamage: input.propertyDamage ?? false,
      damageEstimate: input.damageEstimate,

      photos: [],

      createdAt: now,
      updatedAt: now,
    };

    this.incidents.set(incident.id, incident);
    this.incidentByNumber.set(incidentNumber, incident.id);

    emit('mhe.incident_reported', {
      incidentId: incident.id,
      incidentNumber,
      incidentType: input.incidentType,
      severity: input.severity,
    }, { tenantId: input.tenantId });

    return { success: true, data: incident };
  }

  getIncident(id: UUID): SafetyIncident | undefined {
    return this.incidents.get(id);
  }

  getIncidentByNumber(incidentNumber: string): SafetyIncident | undefined {
    const id = this.incidentByNumber.get(incidentNumber);
    return id ? this.incidents.get(id) : undefined;
  }

  listIncidents(
    tenantId?: string,
    incidentType?: IncidentType,
    severity?: IncidentSeverity,
    status?: IncidentStatus,
    equipmentId?: UUID,
  ): SafetyIncident[] {
    let results = Array.from(this.incidents.values());
    if (tenantId) results = results.filter(i => i.tenantId === tenantId);
    if (incidentType) results = results.filter(i => i.incidentType === incidentType);
    if (severity) results = results.filter(i => i.severity === severity);
    if (status) results = results.filter(i => i.status === status);
    if (equipmentId) results = results.filter(i => i.equipmentId === equipmentId);
    return results.sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime());
  }

  updateIncidentStatus(
    id: UUID,
    newStatus: IncidentStatus,
    updates?: {
      rootCause?: string;
      investigationNotes?: string;
      correctiveActions?: string;
      preventiveActions?: string;
      investigatorId?: UUID;
    },
  ): OperationResult<SafetyIncident> {
    const incident = this.incidents.get(id);
    if (!incident) return { success: false, error: 'Incident not found', errorCode: 'NOT_FOUND' };

    // Validate status transitions
    const validTransitions: Record<IncidentStatus, IncidentStatus[]> = {
      reported: ['investigating', 'closed'],
      investigating: ['action_taken', 'closed'],
      action_taken: ['closed'],
      closed: ['reopened'],
      reopened: ['investigating', 'closed'],
    };

    const allowed = validTransitions[incident.status];
    if (!allowed || !allowed.includes(newStatus)) {
      return { success: false, error: `Cannot transition from ${incident.status} to ${newStatus}`, errorCode: 'INVALID_STATUS_TRANSITION' };
    }

    const now = new Date();
    incident.status = newStatus;
    incident.updatedAt = now;

    if (updates) {
      if (updates.rootCause !== undefined) incident.rootCause = updates.rootCause;
      if (updates.investigationNotes !== undefined) incident.investigationNotes = updates.investigationNotes;
      if (updates.correctiveActions !== undefined) incident.correctiveActions = updates.correctiveActions;
      if (updates.preventiveActions !== undefined) incident.preventiveActions = updates.preventiveActions;
      if (updates.investigatorId !== undefined) incident.investigatorId = updates.investigatorId;
    }

    if (newStatus === 'investigating') {
      // investigationCompletedAt is set when moving OUT of investigating, not here
    }

    if (newStatus === 'action_taken') {
      incident.investigationCompletedAt = now;
    }

    if (newStatus === 'closed') {
      incident.actionCompletedAt = now;
      emit('mhe.incident_closed', {
        incidentId: incident.id,
        incidentNumber: incident.incidentNumber,
        incidentType: incident.incidentType,
        severity: incident.severity,
      }, { tenantId: incident.tenantId });
    }

    return { success: true, data: incident };
  }

  submitSafetyCheck(input: SubmitSafetyCheckInput): OperationResult<PreShiftSafetyCheck> {
    const now = new Date();
    this.safetyCheckCounter++;
    const checkNumber = `CHK-${String(this.safetyCheckCounter).padStart(3, '0')}`;

    // Determine overall result
    const hasDefect = input.items.some(item => item.result === 'defect');
    const allOk = input.items.every(item => item.result === 'ok' || item.result === 'na');
    let overallResult: 'pass' | 'fail' | 'conditional';
    if (hasDefect) {
      overallResult = 'fail';
    } else if (allOk) {
      overallResult = 'pass';
    } else {
      overallResult = 'conditional';
    }

    const check: PreShiftSafetyCheck = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      checkNumber,
      equipmentId: input.equipmentId,
      equipmentCode: input.equipmentCode,
      operatorId: input.operatorId,
      operatorName: input.operatorName,
      shiftId: input.shiftId,

      checkDate: now,
      checkTime: now.toTimeString().slice(0, 5),

      items: input.items,
      overallResult,

      equipmentTakenOutOfService: overallResult === 'fail',
      failureReason: hasDefect
        ? input.items.filter(item => item.result === 'defect').map(item => item.itemName).join(', ')
        : undefined,

      createdAt: now,
      updatedAt: now,
    };

    this.safetyChecks.set(check.id, check);
    if (!this.safetyChecksByEquipment.has(input.equipmentId)) {
      this.safetyChecksByEquipment.set(input.equipmentId, []);
    }
    this.safetyChecksByEquipment.get(input.equipmentId)!.push(check.id);

    if (overallResult === 'fail') {
      emit('mhe.safety_check_failed', {
        checkId: check.id,
        checkNumber,
        equipmentId: input.equipmentId,
        equipmentCode: input.equipmentCode,
        failureReason: check.failureReason,
      }, { tenantId: input.tenantId });
    } else {
      emit('mhe.safety_check_completed', {
        checkId: check.id,
        checkNumber,
        equipmentId: input.equipmentId,
        equipmentCode: input.equipmentCode,
        result: overallResult,
      }, { tenantId: input.tenantId });
    }

    return { success: true, data: check };
  }

  getSafetyChecksForEquipment(equipmentId: UUID): PreShiftSafetyCheck[] {
    const ids = this.safetyChecksByEquipment.get(equipmentId);
    if (!ids) return [];
    return ids
      .map(id => this.safetyChecks.get(id))
      .filter((c): c is PreShiftSafetyCheck => c !== undefined)
      .sort((a, b) => b.checkDate.getTime() - a.checkDate.getTime());
  }

  getOpenIncidents(tenantId: string): SafetyIncident[] {
    return Array.from(this.incidents.values())
      .filter(i =>
        i.tenantId === tenantId &&
        i.status !== 'closed'
      )
      .sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime());
  }

  // ============================================================================
  // 5. CHARGING & BATTERY
  // ============================================================================

  registerChargingDock(input: RegisterChargingDockInput): OperationResult<ChargingDock> {
    // Validate unique dockCode per facility
    const key = `${input.facilityId}:${input.dockCode}`;
    if (this.chargingDockByCode.has(key)) {
      return { success: false, error: 'Charging dock code already exists for this facility', errorCode: 'DUPLICATE_DOCK_CODE' };
    }

    const now = new Date();
    const dock: ChargingDock = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      dockCode: input.dockCode,
      location: input.location,
      status: 'available',

      chargerType: input.chargerType,
      powerRatingKW: input.powerRatingKW,
      compatibleEquipmentTypes: input.compatibleEquipmentTypes,

      totalSessionsToday: 0,
      totalKwhDeliveredToday: 0,
      averageSessionMinutes: 0,

      createdAt: now,
      updatedAt: now,
    };

    this.chargingDocks.set(dock.id, dock);
    this.chargingDockByCode.set(key, dock.id);
    this.sessionsByDock.set(dock.id, []);

    return { success: true, data: dock };
  }

  getChargingDock(id: UUID): ChargingDock | undefined {
    return this.chargingDocks.get(id);
  }

  listChargingDocks(facilityId?: string, status?: ChargingDockStatus, chargerType?: ChargingDock['chargerType']): ChargingDock[] {
    let docks = Array.from(this.chargingDocks.values());
    if (facilityId) docks = docks.filter(d => d.facilityId === facilityId);
    if (status) docks = docks.filter(d => d.status === status);
    if (chargerType) docks = docks.filter(d => d.chargerType === chargerType);
    return docks;
  }

  startCharging(input: StartChargingInput): OperationResult<ChargingSession> {
    const dock = this.chargingDocks.get(input.dockId);
    if (!dock) return { success: false, error: 'Charging dock not found', errorCode: 'NOT_FOUND' };

    if (dock.status !== 'available') {
      return { success: false, error: `Charging dock is not available (current status: ${dock.status})`, errorCode: 'DOCK_NOT_AVAILABLE' };
    }

    const now = new Date();

    // Create session
    const session: ChargingSession = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      dockId: input.dockId,
      dockCode: dock.dockCode,
      equipmentId: input.equipmentId,
      equipmentCode: input.equipmentCode,

      startTime: now,
      startBatteryPercent: input.startBatteryPercent,

      completed: false,

      createdAt: now,
      updatedAt: now,
    };

    this.chargingSessions.set(session.id, session);
    if (!this.sessionsByDock.has(input.dockId)) {
      this.sessionsByDock.set(input.dockId, []);
    }
    this.sessionsByDock.get(input.dockId)!.push(session.id);
    if (!this.sessionsByEquipment.has(input.equipmentId)) {
      this.sessionsByEquipment.set(input.equipmentId, []);
    }
    this.sessionsByEquipment.get(input.equipmentId)!.push(session.id);

    // Update dock status
    dock.status = 'occupied';
    dock.currentEquipmentId = input.equipmentId;
    dock.currentEquipmentCode = input.equipmentCode;
    dock.sessionStartTime = now;
    dock.updatedAt = now;

    emit('mhe.charging_started', {
      sessionId: session.id,
      dockId: dock.id,
      dockCode: dock.dockCode,
      equipmentId: input.equipmentId,
      equipmentCode: input.equipmentCode,
      startBatteryPercent: input.startBatteryPercent,
    }, { tenantId: input.tenantId });

    return { success: true, data: session };
  }

  completeCharging(
    sessionId: UUID,
    endBatteryPercent: number,
    costPerKwh?: number,
  ): OperationResult<ChargingSession> {
    const session = this.chargingSessions.get(sessionId);
    if (!session) return { success: false, error: 'Charging session not found', errorCode: 'NOT_FOUND' };

    if (session.completed) {
      return { success: false, error: 'Charging session already completed', errorCode: 'ALREADY_COMPLETED' };
    }

    const now = new Date();
    const durationMinutes = Math.round((now.getTime() - session.startTime.getTime()) / 60000);

    // Retrieve dock for power rating
    const dock = this.chargingDocks.get(session.dockId);
    const durationHours = durationMinutes / 60;
    const kwhDelivered = dock ? dock.powerRatingKW * durationHours : 0;

    session.endTime = now;
    session.durationMinutes = durationMinutes;
    session.endBatteryPercent = endBatteryPercent;
    session.kwhDelivered = Math.round(kwhDelivered * 100) / 100;
    session.completed = true;
    session.updatedAt = now;

    if (costPerKwh !== undefined) {
      session.costPerKwh = costPerKwh;
      session.totalCost = Math.round(kwhDelivered * costPerKwh * 100) / 100;
    }

    // Update dock
    if (dock) {
      dock.status = 'available';
      dock.currentEquipmentId = undefined;
      dock.currentEquipmentCode = undefined;
      dock.sessionStartTime = undefined;
      dock.estimatedCompleteTime = undefined;
      dock.totalSessionsToday++;
      dock.totalKwhDeliveredToday += session.kwhDelivered;

      // Update average session minutes
      const totalSessions = dock.totalSessionsToday;
      dock.averageSessionMinutes = totalSessions > 0
        ? Math.round(((dock.averageSessionMinutes * (totalSessions - 1)) + durationMinutes) / totalSessions)
        : durationMinutes;
      dock.updatedAt = now;
    }

    emit('mhe.charging_completed', {
      sessionId: session.id,
      dockId: session.dockId,
      dockCode: session.dockCode,
      equipmentId: session.equipmentId,
      equipmentCode: session.equipmentCode,
      durationMinutes,
      kwhDelivered: session.kwhDelivered,
      endBatteryPercent,
    }, { tenantId: session.tenantId });

    return { success: true, data: session };
  }

  recordBatterySwap(input: RecordBatterySwapInput): OperationResult<BatterySwap> {
    const now = new Date();

    const swap: BatterySwap = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      equipmentId: input.equipmentId,
      equipmentCode: input.equipmentCode,

      swapDate: now,
      oldBatteryId: input.oldBatteryId,
      newBatteryId: input.newBatteryId,
      oldBatteryPercent: input.oldBatteryPercent,
      newBatteryPercent: input.newBatteryPercent,

      swappedBy: input.swappedBy,
      durationMinutes: input.durationMinutes,

      createdAt: now,
      updatedAt: now,
    };

    this.batterySwaps.set(swap.id, swap);

    emit('mhe.battery_swapped', {
      swapId: swap.id,
      equipmentId: input.equipmentId,
      equipmentCode: input.equipmentCode,
      oldBatteryId: input.oldBatteryId,
      newBatteryId: input.newBatteryId,
    }, { tenantId: input.tenantId });

    return { success: true, data: swap };
  }

  getChargingSessions(
    equipmentId?: UUID,
    dockId?: UUID,
    from?: Date,
    to?: Date,
  ): ChargingSession[] {
    let sessions: ChargingSession[];

    if (equipmentId) {
      const ids = this.sessionsByEquipment.get(equipmentId);
      if (!ids) return [];
      sessions = ids
        .map(id => this.chargingSessions.get(id))
        .filter((s): s is ChargingSession => s !== undefined);
    } else if (dockId) {
      const ids = this.sessionsByDock.get(dockId);
      if (!ids) return [];
      sessions = ids
        .map(id => this.chargingSessions.get(id))
        .filter((s): s is ChargingSession => s !== undefined);
    } else {
      sessions = Array.from(this.chargingSessions.values());
    }

    if (from) sessions = sessions.filter(s => s.startTime >= from);
    if (to) sessions = sessions.filter(s => s.startTime <= to);

    return sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  // ============================================================================
  // 6. ENHANCED MAINTENANCE
  // ============================================================================

  createWorkOrder(input: CreateWorkOrderInput): OperationResult<MaintenanceWorkOrder> {
    const now = new Date();
    this.workOrderCounter++;
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const workOrderNumber = `WO-${dateStr}-${String(this.workOrderCounter).padStart(3, '0')}`;

    const wo: MaintenanceWorkOrder = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      workOrderNumber,
      status: 'planned',
      priority: input.priority,

      equipmentId: input.equipmentId,
      equipmentCode: input.equipmentCode,
      equipmentType: input.equipmentType,

      isPreventive: input.isPreventive ?? false,
      isCorrective: input.isCorrective ?? false,
      isEmergency: input.isEmergency ?? false,

      title: input.title,
      description: input.description,
      failureDescription: input.failureDescription,

      requestedDate: now,
      requestedBy: input.requestedBy,
      scheduledDate: input.scheduledDate,

      assignedTechId: input.assignedTechId,
      assignedTechName: input.assignedTechName,
      vendorId: input.vendorId,
      vendorName: input.vendorName,

      partsUsed: [],
      partsCost: 0,
      laborCost: 0,
      totalCost: 0,

      documents: [],

      createdAt: now,
      updatedAt: now,
    };

    this.workOrders.set(wo.id, wo);
    this.workOrderByNumber.set(workOrderNumber, wo.id);
    if (!this.workOrdersByEquipment.has(input.equipmentId)) {
      this.workOrdersByEquipment.set(input.equipmentId, []);
    }
    this.workOrdersByEquipment.get(input.equipmentId)!.push(wo.id);

    emit('mhe.work_order_created', {
      workOrderId: wo.id,
      workOrderNumber,
      equipmentId: input.equipmentId,
      equipmentCode: input.equipmentCode,
      priority: input.priority,
      isEmergency: wo.isEmergency,
    }, { tenantId: input.tenantId });

    return { success: true, data: wo };
  }

  getWorkOrder(id: UUID): MaintenanceWorkOrder | undefined {
    return this.workOrders.get(id);
  }

  getWorkOrderByNumber(workOrderNumber: string): MaintenanceWorkOrder | undefined {
    const id = this.workOrderByNumber.get(workOrderNumber);
    return id ? this.workOrders.get(id) : undefined;
  }

  listWorkOrders(
    tenantId?: string,
    status?: MaintenanceWorkOrderStatus,
    priority?: MaintenanceWorkOrderPriority,
    equipmentId?: UUID,
  ): MaintenanceWorkOrder[] {
    let results = Array.from(this.workOrders.values());
    if (tenantId) results = results.filter(w => w.tenantId === tenantId);
    if (status) results = results.filter(w => w.status === status);
    if (priority) results = results.filter(w => w.priority === priority);
    if (equipmentId) results = results.filter(w => w.equipmentId === equipmentId);
    return results.sort((a, b) => b.requestedDate.getTime() - a.requestedDate.getTime());
  }

  scheduleWorkOrder(
    id: UUID,
    scheduledDate: Date,
    scheduledEndDate?: Date,
    assignedTechId?: UUID,
    assignedTechName?: string,
  ): OperationResult<MaintenanceWorkOrder> {
    const wo = this.workOrders.get(id);
    if (!wo) return { success: false, error: 'Work order not found', errorCode: 'NOT_FOUND' };

    if (wo.status !== 'planned' && wo.status !== 'on_hold') {
      return { success: false, error: `Cannot schedule work order in ${wo.status} status`, errorCode: 'INVALID_STATUS' };
    }

    wo.status = 'scheduled';
    wo.scheduledDate = scheduledDate;
    if (scheduledEndDate) wo.scheduledEndDate = scheduledEndDate;
    if (assignedTechId) wo.assignedTechId = assignedTechId;
    if (assignedTechName) wo.assignedTechName = assignedTechName;
    wo.updatedAt = new Date();

    return { success: true, data: wo };
  }

  startWorkOrder(id: UUID): OperationResult<MaintenanceWorkOrder> {
    const wo = this.workOrders.get(id);
    if (!wo) return { success: false, error: 'Work order not found', errorCode: 'NOT_FOUND' };

    if (wo.status !== 'scheduled') {
      return { success: false, error: `Cannot start work order in ${wo.status} status`, errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    wo.status = 'in_progress';
    wo.actualStartDate = now;
    wo.updatedAt = now;

    return { success: true, data: wo };
  }

  completeWorkOrder(
    id: UUID,
    completion: {
      actionTaken: string;
      rootCause?: string;
      recommendations?: string;
      partsCost?: number;
      laborCost?: number;
      equipmentDowntimeHours?: number;
    },
  ): OperationResult<MaintenanceWorkOrder> {
    const wo = this.workOrders.get(id);
    if (!wo) return { success: false, error: 'Work order not found', errorCode: 'NOT_FOUND' };

    if (wo.status !== 'in_progress') {
      return { success: false, error: `Cannot complete work order in ${wo.status} status`, errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    wo.status = 'completed';
    wo.actualEndDate = now;
    wo.actionTaken = completion.actionTaken;
    wo.updatedAt = now;

    if (completion.rootCause !== undefined) wo.rootCause = completion.rootCause;
    if (completion.recommendations !== undefined) wo.recommendations = completion.recommendations;
    if (completion.equipmentDowntimeHours !== undefined) wo.equipmentDowntimeHours = completion.equipmentDowntimeHours;

    // Calculate duration
    if (wo.actualStartDate) {
      wo.durationHours = Math.round(((now.getTime() - wo.actualStartDate.getTime()) / 3600000) * 100) / 100;
    }

    // Calculate costs
    wo.partsCost = completion.partsCost ?? 0;
    wo.laborCost = completion.laborCost ?? 0;
    wo.totalCost = wo.partsCost + wo.laborCost;

    emit('mhe.work_order_completed', {
      workOrderId: wo.id,
      workOrderNumber: wo.workOrderNumber,
      equipmentId: wo.equipmentId,
      equipmentCode: wo.equipmentCode,
      durationHours: wo.durationHours,
      totalCost: wo.totalCost,
    }, { tenantId: wo.tenantId });

    return { success: true, data: wo };
  }

  cancelWorkOrder(id: UUID, reason: string): OperationResult<MaintenanceWorkOrder> {
    const wo = this.workOrders.get(id);
    if (!wo) return { success: false, error: 'Work order not found', errorCode: 'NOT_FOUND' };

    if (wo.status === 'completed') {
      return { success: false, error: 'Cannot cancel a completed work order', errorCode: 'INVALID_STATUS' };
    }

    if (wo.status === 'cancelled') {
      return { success: false, error: 'Work order is already cancelled', errorCode: 'ALREADY_CANCELLED' };
    }

    wo.status = 'cancelled';
    wo.actionTaken = `Cancelled: ${reason}`;
    wo.updatedAt = new Date();

    return { success: true, data: wo };
  }

  // ============================================================================
  // 7. EQUIPMENT LIFECYCLE
  // ============================================================================

  registerLifecycle(input: RegisterLifecycleInput): OperationResult<EquipmentLifecycle> {
    // Check if lifecycle already exists for this equipment
    if (this.lifecycleByEquipment.has(input.equipmentId)) {
      return { success: false, error: 'Lifecycle record already exists for this equipment', errorCode: 'DUPLICATE_LIFECYCLE' };
    }

    const now = new Date();

    // Calculate depreciation
    let annualDepreciation = 0;
    if (input.depreciationMethod === 'straight_line') {
      annualDepreciation = input.usefulLifeYears > 0
        ? (input.purchasePrice - input.salvageValue) / input.usefulLifeYears
        : 0;
    } else if (input.depreciationMethod === 'declining_balance') {
      // Double declining balance rate
      const rate = input.usefulLifeYears > 0 ? 2 / input.usefulLifeYears : 0;
      annualDepreciation = input.purchasePrice * rate;
    } else {
      // units_of_production: start with straight line estimate
      annualDepreciation = input.usefulLifeYears > 0
        ? (input.purchasePrice - input.salvageValue) / input.usefulLifeYears
        : 0;
    }

    // Calculate current book value based on time elapsed
    const yearsElapsed = (now.getTime() - input.purchaseDate.getTime()) / (365.25 * 86400000);
    const accumulatedDepreciation = Math.min(
      annualDepreciation * yearsElapsed,
      input.purchasePrice - input.salvageValue,
    );
    const currentBookValue = Math.max(input.purchasePrice - accumulatedDepreciation, input.salvageValue);

    // Calculate replacement due date
    const replacementDueDate = new Date(
      input.purchaseDate.getTime() + input.usefulLifeYears * 365.25 * 86400000,
    );

    const lifecycle: EquipmentLifecycle = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      equipmentId: input.equipmentId,
      equipmentCode: input.equipmentCode,

      purchaseDate: input.purchaseDate,
      purchasePrice: input.purchasePrice,
      vendorName: input.vendorName,
      warrantyExpiryDate: input.warrantyExpiryDate,

      depreciationMethod: input.depreciationMethod,
      usefulLifeYears: input.usefulLifeYears,
      salvageValue: input.salvageValue,
      currentBookValue: Math.round(currentBookValue * 100) / 100,
      annualDepreciation: Math.round(annualDepreciation * 100) / 100,
      accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,

      totalEngineHours: 0,
      totalKmDriven: 0,
      totalMoves: 0,

      replacementDueDate,

      createdAt: now,
      updatedAt: now,
    };

    this.lifecycles.set(lifecycle.id, lifecycle);
    this.lifecycleByEquipment.set(input.equipmentId, lifecycle.id);

    return { success: true, data: lifecycle };
  }

  getLifecycle(id: UUID): EquipmentLifecycle | undefined {
    return this.lifecycles.get(id);
  }

  listLifecycles(tenantId: string): EquipmentLifecycle[] {
    return Array.from(this.lifecycles.values())
      .filter(l => l.tenantId === tenantId);
  }

  updateUtilization(
    equipmentId: UUID,
    updates: { engineHours?: number; kmDriven?: number; moves?: number },
  ): OperationResult<EquipmentLifecycle> {
    const lcId = this.lifecycleByEquipment.get(equipmentId);
    if (!lcId) return { success: false, error: 'Lifecycle record not found for equipment', errorCode: 'NOT_FOUND' };

    const lc = this.lifecycles.get(lcId);
    if (!lc) return { success: false, error: 'Lifecycle record not found', errorCode: 'NOT_FOUND' };

    if (updates.engineHours !== undefined) lc.totalEngineHours = updates.engineHours;
    if (updates.kmDriven !== undefined) lc.totalKmDriven = updates.kmDriven;
    if (updates.moves !== undefined) lc.totalMoves = updates.moves;

    // Recalculate book value based on current date
    const now = new Date();
    const yearsElapsed = (now.getTime() - lc.purchaseDate.getTime()) / (365.25 * 86400000);
    const accumulatedDepreciation = Math.min(
      lc.annualDepreciation * yearsElapsed,
      lc.purchasePrice - lc.salvageValue,
    );
    lc.accumulatedDepreciation = Math.round(accumulatedDepreciation * 100) / 100;
    lc.currentBookValue = Math.max(
      Math.round((lc.purchasePrice - accumulatedDepreciation) * 100) / 100,
      lc.salvageValue,
    );
    lc.updatedAt = now;

    return { success: true, data: lc };
  }

  getReplacementDue(tenantId: string): EquipmentLifecycle[] {
    const now = new Date();
    return Array.from(this.lifecycles.values())
      .filter(lc =>
        lc.tenantId === tenantId &&
        lc.replacementDueDate !== undefined &&
        lc.replacementDueDate <= now
      );
  }

  // ============================================================================
  // 8. STATS
  // ============================================================================

  getMHEStats(tenantId: string): MHEStats {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // --- Telematics ---
    const fleetPositions = this.getFleetPositions(tenantId);
    const totalTrackedEquipment = fleetPositions.length;
    const onlineEquipment = fleetPositions.filter(r =>
      r.status === 'moving' || r.status === 'idle' || r.status === 'online'
    ).length;
    const idlingEquipment = fleetPositions.filter(r => r.isIdling).length;
    const movingEquipment = fleetPositions.filter(r => r.status === 'moving').length;

    const allTelematics = Array.from(this.telematicsRecords.values())
      .filter(r => r.tenantId === tenantId);
    const todayTelematics = allTelematics.filter(r => r.timestamp >= todayStart);
    const overspeedAlerts = todayTelematics.filter(r => r.isOverSpeed).length;
    const geofenceViolations = todayTelematics.filter(r => r.isOutOfGeofence).length;

    // --- Certifications ---
    const tenantCerts = Array.from(this.certifications.values())
      .filter(c => c.tenantId === tenantId);
    const uniqueOperators = new Set(tenantCerts.map(c => c.operatorId));
    const totalOperators = uniqueOperators.size;
    const validCertifications = tenantCerts.filter(c => c.status === 'valid').length;
    const expiringSoonCertifications = tenantCerts.filter(c => c.status === 'expiring_soon').length;
    const expiredCertifications = tenantCerts.filter(c => c.status === 'expired').length;

    // --- Safety ---
    const tenantIncidents = Array.from(this.incidents.values())
      .filter(i => i.tenantId === tenantId);
    const monthIncidents = tenantIncidents.filter(i => i.reportedAt >= monthStart);
    const totalIncidentsThisMonth = monthIncidents.length;
    const openIncidents = tenantIncidents.filter(i => i.status !== 'closed').length;
    const nearMissesThisMonth = monthIncidents.filter(i => i.incidentType === 'near_miss').length;

    const tenantChecks = Array.from(this.safetyChecks.values())
      .filter(c => c.tenantId === tenantId);
    const todayChecks = tenantChecks.filter(c => c.checkDate >= todayStart);
    const safetyChecksToday = todayChecks.length;
    const failedChecksToday = todayChecks.filter(c => c.overallResult === 'fail').length;
    const safetyCheckFailRate = safetyChecksToday > 0
      ? Math.round((failedChecksToday / safetyChecksToday) * 10000) / 100
      : 0;

    // --- Charging ---
    const tenantDocks = Array.from(this.chargingDocks.values())
      .filter(d => d.tenantId === tenantId);
    const totalChargingDocks = tenantDocks.length;
    const availableChargingDocks = tenantDocks.filter(d => d.status === 'available').length;

    const tenantSessions = Array.from(this.chargingSessions.values())
      .filter(s => s.tenantId === tenantId);
    const activeChargingSessions = tenantSessions.filter(s => !s.completed).length;
    const todaySessions = tenantSessions.filter(s => s.startTime >= todayStart);
    const totalKwhToday = todaySessions
      .filter(s => s.completed && s.kwhDelivered !== undefined)
      .reduce((sum, s) => sum + (s.kwhDelivered ?? 0), 0);

    // --- Maintenance ---
    const tenantWOs = Array.from(this.workOrders.values())
      .filter(w => w.tenantId === tenantId);
    const openWorkOrders = tenantWOs.filter(w =>
      w.status !== 'completed' && w.status !== 'cancelled'
    ).length;
    const overdueWorkOrders = tenantWOs.filter(w =>
      w.status === 'scheduled' &&
      w.scheduledDate !== undefined &&
      w.scheduledDate < now
    ).length;

    const completedWOs = tenantWOs.filter(w => w.status === 'completed' && w.durationHours !== undefined);
    const avgRepairTimeHours = completedWOs.length > 0
      ? Math.round((completedWOs.reduce((s, w) => s + (w.durationHours ?? 0), 0) / completedWOs.length) * 100) / 100
      : 0;

    const monthWOs = tenantWOs.filter(w =>
      w.status === 'completed' &&
      w.actualEndDate !== undefined &&
      w.actualEndDate >= monthStart
    );
    const maintenanceCostMTD = monthWOs.reduce((s, w) => s + w.totalCost, 0);

    // Equipment availability: tracked equipment minus those with open work orders
    const equipmentWithOpenWO = new Set(
      tenantWOs
        .filter(w => w.status === 'in_progress' || w.status === 'scheduled')
        .map(w => w.equipmentId)
    );
    const equipmentAvailabilityPercent = totalTrackedEquipment > 0
      ? Math.round(((totalTrackedEquipment - equipmentWithOpenWO.size) / totalTrackedEquipment) * 10000) / 100
      : 100;

    return {
      tenantId,

      totalTrackedEquipment,
      onlineEquipment,
      idlingEquipment,
      movingEquipment,
      overspeedAlerts,
      geofenceViolations,

      totalOperators,
      validCertifications,
      expiringSoonCertifications,
      expiredCertifications,

      totalIncidentsThisMonth,
      openIncidents,
      nearMissesThisMonth,
      safetyChecksToday,
      safetyCheckFailRate,

      totalChargingDocks,
      availableChargingDocks,
      activeChargingSessions,
      totalKwhToday: Math.round(totalKwhToday * 100) / 100,

      openWorkOrders,
      overdueWorkOrders,
      avgRepairTimeHours,
      maintenanceCostMTD: Math.round(maintenanceCostMTD * 100) / 100,
      equipmentAvailabilityPercent,
    };
  }
}

// ============================================================================
// SINGLETON ACCESSORS
// ============================================================================

let _mheEngine: MHEEngine | null = null;

export function getMHEEngine(): MHEEngine {
  if (!_mheEngine) {
    _mheEngine = MHEEngine.getInstance();
  }
  return _mheEngine;
}

export function setMHEEngine(engine: MHEEngine): void {
  _mheEngine = engine;
}
