// Labor Management & Cost Allocation types for ankrICD
// Workers, shifts, gangs, productivity, cost centers, budgets

import type { UUID, AuditFields, TenantEntity, ContactInfo } from './common';

// ============================================================================
// WORKERS & STAFF
// ============================================================================

export type WorkerRole =
  | 'operator_rtg'
  | 'operator_reach_stacker'
  | 'operator_forklift'
  | 'operator_crane'
  | 'gate_officer'
  | 'yard_supervisor'
  | 'gang_leader'
  | 'laborer'
  | 'clerk'
  | 'customs_liaison'
  | 'safety_officer'
  | 'maintenance_tech'
  | 'driver'
  | 'security'
  | 'admin';

export type WorkerStatus = 'active' | 'on_leave' | 'suspended' | 'terminated' | 'inactive';

export interface Worker extends TenantEntity, AuditFields {
  id: UUID;
  employeeCode: string;
  name: string;
  contact?: ContactInfo;
  role: WorkerRole;
  status: WorkerStatus;

  // Employment
  department?: string;
  designation?: string;
  joiningDate: Date;
  terminationDate?: Date;

  // Certifications
  certifications: WorkerCertification[];
  primarySkills: string[];

  // Biometric / RFID
  rfidTagId?: string;
  biometricId?: string;

  // Current state
  currentShiftId?: UUID;
  currentGangId?: UUID;
  isOnDuty: boolean;
  lastClockIn?: Date;
  lastClockOut?: Date;

  // Cost
  hourlyRate?: number;
  overtimeRate?: number;
  costCenterId?: UUID;
}

export interface WorkerCertification {
  id: UUID;
  certificationType: string; // forklift_license, crane_operator, hazmat_handler, etc.
  certificationNumber?: string;
  issuedBy?: string;
  issuedDate: Date;
  expiryDate?: Date;
  isValid: boolean;
}

// ============================================================================
// SHIFTS
// ============================================================================

export type ShiftType = 'day' | 'night' | 'general' | 'overtime' | 'split';
export type ShiftStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

export interface Shift extends TenantEntity, AuditFields {
  id: UUID;
  shiftCode: string;
  shiftType: ShiftType;
  status: ShiftStatus;

  // Timing
  date: Date;
  scheduledStartTime: string; // HH:mm
  scheduledEndTime: string;   // HH:mm
  actualStartTime?: Date;
  actualEndTime?: Date;

  // Staff
  supervisorId?: UUID;
  supervisorName?: string;
  assignedWorkerIds: UUID[];
  presentWorkerIds: UUID[];
  absentWorkerIds: UUID[];

  // Handover
  handoverNotes?: string;
  previousShiftId?: UUID;
  nextShiftId?: UUID;

  // Stats
  totalTEUHandled: number;
  totalContainerMoves: number;
  totalGateTransactions: number;
  incidents: number;
}

// ============================================================================
// GANGS
// ============================================================================

export type GangType = 'stuffing' | 'destuffing' | 'loading' | 'unloading' | 'yard' | 'general';
export type GangStatus = 'available' | 'assigned' | 'working' | 'on_break' | 'disbanded';

export interface Gang extends TenantEntity, AuditFields {
  id: UUID;
  gangCode: string;
  gangType: GangType;
  status: GangStatus;

  // Members
  leaderId?: UUID;
  leaderName?: string;
  memberIds: UUID[];
  memberCount: number;
  maxMembers: number;

  // Assignment
  currentTaskId?: UUID;
  currentLocationZone?: string;
  assignedShiftId?: UUID;

  // Performance
  totalTasksCompleted: number;
  avgTaskDurationMinutes: number;
  productivityScore: number; // 0-100
}

// ============================================================================
// CLOCK IN/OUT
// ============================================================================

export type ClockEntryType = 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
export type ClockMethod = 'biometric' | 'rfid' | 'manual' | 'mobile_gps';

export interface ClockEntry extends TenantEntity, AuditFields {
  id: UUID;
  workerId: UUID;
  workerName: string;
  shiftId?: UUID;

  entryType: ClockEntryType;
  method: ClockMethod;
  timestamp: Date;

  // Location
  gateId?: string;
  deviceId?: string;
  gpsCoordinates?: { latitude: number; longitude: number };

  // Overtime
  isOvertime: boolean;
  overtimeMinutes: number;

  // Approval
  approvedBy?: string;
  approvalNotes?: string;
}

// ============================================================================
// TASK ASSIGNMENT
// ============================================================================

export type LaborTaskStatus = 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type LaborTaskType =
  | 'stuffing'
  | 'destuffing'
  | 'loading_rail'
  | 'unloading_rail'
  | 'loading_vessel'
  | 'unloading_vessel'
  | 'yard_move'
  | 'gate_operation'
  | 'inspection'
  | 'maintenance'
  | 'housekeeping'
  | 'other';

export interface LaborTask extends TenantEntity, AuditFields {
  id: UUID;
  taskNumber: string;
  taskType: LaborTaskType;
  status: LaborTaskStatus;
  description: string;

  // Assignment
  assignedToWorkerId?: UUID;
  assignedToWorkerName?: string;
  assignedToGangId?: UUID;
  assignedToGangCode?: string;
  assignedBy?: string;
  assignedAt?: Date;

  // Timing
  scheduledStart?: Date;
  scheduledEnd?: Date;
  actualStart?: Date;
  actualEnd?: Date;
  durationMinutes?: number;

  // Target
  containerId?: UUID;
  containerNumber?: string;
  equipmentId?: UUID;
  locationZone?: string;

  // Result
  unitsCompleted?: number;
  errorCount?: number;
  qualityScore?: number; // 0-100
  remarks?: string;

  // Cost
  laborCost?: number;
  equipmentCost?: number;
  totalCost?: number;
}

// ============================================================================
// PRODUCTIVITY
// ============================================================================

export interface ProductivityRecord extends TenantEntity {
  id: UUID;
  workerId: UUID;
  workerName: string;
  shiftId: UUID;
  date: Date;

  // Volume
  teuHandled: number;
  containerMoves: number;
  gateTransactions: number;
  tasksCompleted: number;

  // Rates
  teuPerHour: number;
  movesPerHour: number;
  hoursWorked: number;
  overtimeHours: number;

  // Quality
  errorCount: number;
  accuracyPercent: number;

  // Ranking
  productivityScore: number; // 0-100
  rank?: number; // within shift/department
}

// ============================================================================
// COST CENTERS
// ============================================================================

export type CostCenterType = 'gate' | 'yard' | 'rail_siding' | 'cfs' | 'bonded_warehouse' | 'berth' | 'admin' | 'maintenance';

export interface CostCenter extends TenantEntity, AuditFields {
  id: UUID;
  code: string;
  name: string;
  type: CostCenterType;
  parentId?: UUID;
  isActive: boolean;

  // Budget
  annualBudget?: number;
  monthlyBudget?: number;
  ytdActual: number;
  mtdActual: number;

  // Rates
  defaultLaborRate?: number;
  defaultEquipmentRate?: number;
  overheadRate?: number;
}

// ============================================================================
// COST ALLOCATION
// ============================================================================

export type CostType = 'labor' | 'equipment' | 'overhead' | 'material' | 'external';

export interface CostAllocation extends TenantEntity, AuditFields {
  id: UUID;
  allocationNumber: string;
  date: Date;

  // Source
  costType: CostType;
  costCenterId: UUID;
  costCenterCode: string;
  taskId?: UUID;
  shiftId?: UUID;

  // Target
  containerId?: UUID;
  containerNumber?: string;
  customerId?: UUID;
  customerName?: string;

  // Amount
  amount: number;
  currency: string;
  units?: number;
  ratePerUnit?: number;
  description?: string;

  // Approval
  approvedBy?: string;
  approvedAt?: Date;
}

// ============================================================================
// STATS
// ============================================================================

export interface LaborStats {
  tenantId: string;

  // Workforce
  totalWorkers: number;
  activeWorkers: number;
  onDutyWorkers: number;
  onLeaveWorkers: number;

  // Shifts
  activeShifts: number;
  shiftsToday: number;
  totalOvertimeHoursToday: number;

  // Gangs
  totalGangs: number;
  availableGangs: number;
  workingGangs: number;

  // Tasks
  totalTasksToday: number;
  completedTasksToday: number;
  pendingTasksToday: number;
  avgTaskDurationMinutes: number;

  // Productivity
  avgTEUPerWorkerPerShift: number;
  avgAccuracyPercent: number;
  topPerformerScore: number;

  // Cost
  totalLaborCostMTD: number;
  totalEquipmentCostMTD: number;
  costPerTEU: number;
  budgetUtilizationPercent: number;
}
