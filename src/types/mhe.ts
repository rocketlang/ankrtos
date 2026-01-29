// Advanced Equipment & MHE (Material Handling Equipment) types for ankrICD
// Telematics, operator certs, safety, charging, enhanced maintenance

import type { UUID, AuditFields, TenantEntity, Coordinates, Attachment } from './common';

// ============================================================================
// TELEMATICS
// ============================================================================

export type TelematicsStatus = 'online' | 'offline' | 'idle' | 'moving' | 'error';

export interface TelematicsRecord extends TenantEntity {
  id: UUID;
  equipmentId: UUID;
  equipmentCode: string;
  timestamp: Date;

  // Position
  position?: Coordinates;
  speed?: number; // km/h
  heading?: number; // degrees 0-360
  altitude?: number;

  // Status
  status: TelematicsStatus;
  engineRunning: boolean;
  engineHours: number;
  odometer?: number; // km

  // Fuel / Battery
  fuelLevelPercent?: number;
  fuelConsumptionRate?: number; // liters/hour
  batteryLevelPercent?: number;
  batteryVoltage?: number;
  isCharging: boolean;

  // Alerts
  isOverSpeed: boolean;
  isIdling: boolean;
  idleDurationMinutes: number;
  isOutOfGeofence: boolean;
  impactDetected: boolean;
  impactSeverity?: 'light' | 'moderate' | 'severe';
}

export interface GeofenceZone extends TenantEntity, AuditFields {
  id: UUID;
  name: string;
  zoneType: 'operating_area' | 'restricted' | 'charging_area' | 'parking' | 'maintenance';

  // Boundary (simplified as bounding box)
  centerPoint: Coordinates;
  radiusMeters: number;

  // Speed limits
  maxSpeedKmh?: number;

  // Rules
  allowedEquipmentTypes?: string[];
  isActive: boolean;
  alertOnEntry: boolean;
  alertOnExit: boolean;
  alertOnOverspeed: boolean;
}

// ============================================================================
// OPERATOR CERTIFICATION
// ============================================================================

export type CertificationType =
  | 'forklift_license'
  | 'rtg_operator'
  | 'reach_stacker'
  | 'crane_operator'
  | 'hazmat_handler'
  | 'first_aid'
  | 'fire_safety'
  | 'heavy_vehicle'
  | 'reefer_tech'
  | 'electrical_safety';

export type CertificationStatus = 'valid' | 'expiring_soon' | 'expired' | 'suspended' | 'revoked';

export interface OperatorCertification extends TenantEntity, AuditFields {
  id: UUID;
  operatorId: UUID;
  operatorName: string;

  // Certificate
  certType: CertificationType;
  certNumber: string;
  issuedBy: string;
  issuedDate: Date;
  expiryDate: Date;
  status: CertificationStatus;

  // Training
  trainingProvider?: string;
  trainingDate?: Date;
  trainingHours?: number;
  examScore?: number;

  // Renewal
  renewalReminderDays: number; // 30, 15, 7 day warnings
  lastReminderSent?: Date;
  renewalRequestedAt?: Date;
  renewedCertId?: UUID; // link to renewal cert

  // Documents
  certDocument?: Attachment;
  trainingDocument?: Attachment;
}

export interface TrainingRecord extends TenantEntity, AuditFields {
  id: UUID;
  operatorId: UUID;
  operatorName: string;

  // Training
  trainingType: string;
  trainingName: string;
  provider: string;
  startDate: Date;
  endDate?: Date;
  durationHours: number;

  // Result
  completed: boolean;
  examPassed?: boolean;
  examScore?: number;
  certificationIssued?: UUID;

  remarks?: string;
  documents: Attachment[];
}

// ============================================================================
// SAFETY & INCIDENT MANAGEMENT
// ============================================================================

export type IncidentType =
  | 'collision'
  | 'tip_over'
  | 'falling_load'
  | 'pedestrian_strike'
  | 'property_damage'
  | 'equipment_failure'
  | 'electrical'
  | 'fire'
  | 'hazmat_spill'
  | 'near_miss'
  | 'injury'
  | 'other';

export type IncidentSeverity = 'minor' | 'moderate' | 'major' | 'critical' | 'fatal';
export type IncidentStatus = 'reported' | 'investigating' | 'action_taken' | 'closed' | 'reopened';

export interface SafetyIncident extends TenantEntity, AuditFields {
  id: UUID;
  incidentNumber: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;

  // When/Where
  occurredAt: Date;
  reportedAt: Date;
  locationZone?: string;
  locationDescription?: string;
  coordinates?: Coordinates;

  // What happened
  description: string;
  equipmentId?: UUID;
  equipmentCode?: string;
  operatorId?: UUID;
  operatorName?: string;

  // Involved parties
  involvedWorkerIds: UUID[];
  witnessIds: UUID[];
  injuriesReported: boolean;
  injuryDescription?: string;
  propertyDamage: boolean;
  damageEstimate?: number;

  // Investigation
  rootCause?: string;
  investigatorId?: UUID;
  investigationNotes?: string;
  investigationCompletedAt?: Date;

  // Actions
  correctiveActions?: string;
  preventiveActions?: string;
  actionDeadline?: Date;
  actionCompletedAt?: Date;

  // Documents
  photos: Attachment[];
  reportPdf?: Attachment;
}

export interface PreShiftSafetyCheck extends TenantEntity, AuditFields {
  id: UUID;
  checkNumber: string;
  equipmentId: UUID;
  equipmentCode: string;
  operatorId: UUID;
  operatorName: string;
  shiftId?: UUID;

  checkDate: Date;
  checkTime: string;

  // Items
  items: SafetyCheckItem[];
  overallResult: 'pass' | 'fail' | 'conditional';

  // If fail
  failureReason?: string;
  equipmentTakenOutOfService: boolean;
  maintenanceRequestId?: UUID;

  supervisorReview?: boolean;
  supervisorId?: string;
  supervisorRemarks?: string;
}

export interface SafetyCheckItem {
  itemName: string;
  category: string; // brakes, hydraulics, tires, horn, lights, forks, mast, cabin, etc.
  result: 'ok' | 'defect' | 'na';
  notes?: string;
}

// ============================================================================
// CHARGING & BATTERY MANAGEMENT
// ============================================================================

export type ChargingDockStatus = 'available' | 'occupied' | 'out_of_order' | 'reserved';

export interface ChargingDock extends TenantEntity, AuditFields {
  id: UUID;
  dockCode: string;
  location: string;
  status: ChargingDockStatus;

  // Specs
  chargerType: 'standard' | 'fast' | 'ultra_fast';
  powerRatingKW: number;
  compatibleEquipmentTypes: string[];

  // Current session
  currentEquipmentId?: UUID;
  currentEquipmentCode?: string;
  sessionStartTime?: Date;
  estimatedCompleteTime?: Date;

  // Stats
  totalSessionsToday: number;
  totalKwhDeliveredToday: number;
  averageSessionMinutes: number;
}

export interface ChargingSession extends TenantEntity, AuditFields {
  id: UUID;
  dockId: UUID;
  dockCode: string;
  equipmentId: UUID;
  equipmentCode: string;

  // Timing
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;

  // Battery
  startBatteryPercent: number;
  endBatteryPercent?: number;
  kwhDelivered?: number;

  // Cost
  costPerKwh?: number;
  totalCost?: number;

  // Status
  completed: boolean;
  interruptedReason?: string;
}

export interface BatterySwap extends TenantEntity, AuditFields {
  id: UUID;
  equipmentId: UUID;
  equipmentCode: string;

  swapDate: Date;
  oldBatteryId: string;
  newBatteryId: string;
  oldBatteryPercent: number;
  newBatteryPercent: number;

  swappedBy: string;
  durationMinutes?: number;
  remarks?: string;
}

// ============================================================================
// ENHANCED MAINTENANCE
// ============================================================================

export type MaintenanceWorkOrderStatus = 'planned' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
export type MaintenanceWorkOrderPriority = 'low' | 'medium' | 'high' | 'critical';

export interface MaintenanceWorkOrder extends TenantEntity, AuditFields {
  id: UUID;
  workOrderNumber: string;
  status: MaintenanceWorkOrderStatus;
  priority: MaintenanceWorkOrderPriority;

  // Equipment
  equipmentId: UUID;
  equipmentCode: string;
  equipmentType: string;

  // Type
  isPreventive: boolean;
  isCorrective: boolean;
  isEmergency: boolean;

  // Description
  title: string;
  description: string;
  failureDescription?: string;

  // Scheduling
  requestedDate: Date;
  requestedBy: string;
  scheduledDate?: Date;
  scheduledEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  durationHours?: number;

  // Assignment
  assignedTechId?: UUID;
  assignedTechName?: string;
  vendorId?: UUID;
  vendorName?: string;

  // Parts
  partsUsed: SparePart[];
  partsCost: number;
  laborCost: number;
  totalCost: number;

  // Result
  rootCause?: string;
  actionTaken?: string;
  recommendations?: string;
  equipmentDowntimeHours?: number;

  documents: Attachment[];
}

export interface SparePart {
  partId: string;
  partNumber: string;
  partName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface EquipmentLifecycle extends TenantEntity, AuditFields {
  id: UUID;
  equipmentId: UUID;
  equipmentCode: string;

  // Acquisition
  purchaseDate: Date;
  purchasePrice: number;
  vendorName?: string;
  warrantyExpiryDate?: Date;

  // Depreciation
  depreciationMethod: 'straight_line' | 'declining_balance' | 'units_of_production';
  usefulLifeYears: number;
  salvageValue: number;
  currentBookValue: number;
  annualDepreciation: number;
  accumulatedDepreciation: number;

  // Utilization
  totalEngineHours: number;
  totalKmDriven?: number;
  totalMoves?: number;

  // Replacement
  replacementDueDate?: Date;
  replacementBudget?: number;
  replacementApproved?: boolean;
}

// ============================================================================
// STATS
// ============================================================================

export interface MHEStats {
  tenantId: string;

  // Telematics
  totalTrackedEquipment: number;
  onlineEquipment: number;
  idlingEquipment: number;
  movingEquipment: number;
  overspeedAlerts: number;
  geofenceViolations: number;

  // Certifications
  totalOperators: number;
  validCertifications: number;
  expiringSoonCertifications: number;
  expiredCertifications: number;

  // Safety
  totalIncidentsThisMonth: number;
  openIncidents: number;
  nearMissesThisMonth: number;
  safetyChecksToday: number;
  safetyCheckFailRate: number;

  // Charging
  totalChargingDocks: number;
  availableChargingDocks: number;
  activeChargingSessions: number;
  totalKwhToday: number;

  // Maintenance
  openWorkOrders: number;
  overdueWorkOrders: number;
  avgRepairTimeHours: number;
  maintenanceCostMTD: number;
  equipmentAvailabilityPercent: number;
}
