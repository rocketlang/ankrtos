// Labor Management & Cost Allocation Engine for ankrICD
// Workers, shifts, gangs, clock in/out, task assignment, cost centers, cost allocation

import { v4 as uuidv4 } from 'uuid';
import type { UUID, OperationResult } from '../types/common';
import type {
  Worker,
  WorkerRole,
  WorkerStatus,
  WorkerCertification,
  Shift,
  ShiftType,
  ShiftStatus,
  Gang,
  GangType,
  GangStatus,
  ClockEntry,
  ClockEntryType,
  ClockMethod,
  LaborTask,
  LaborTaskStatus,
  LaborTaskType,
  ProductivityRecord,
  CostCenter,
  CostCenterType,
  CostAllocation,
  CostType,
  LaborStats,
} from '../types/labor';
import { emit } from '../core';

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface RegisterWorkerInput {
  tenantId: string;
  facilityId: string;
  employeeCode: string;
  name: string;
  role: WorkerRole;
  contact?: { name: string; email?: string; phone?: string; mobile?: string; designation?: string };
  department?: string;
  joiningDate: Date;
  hourlyRate?: number;
  overtimeRate?: number;
  primarySkills?: string[];
  certifications?: Array<{
    certificationType: string;
    certificationNumber?: string;
    issuedBy?: string;
    issuedDate: Date;
    expiryDate?: Date;
  }>;
  rfidTagId?: string;
}

export interface CreateShiftInput {
  tenantId: string;
  facilityId: string;
  shiftType: ShiftType;
  date: Date;
  scheduledStartTime: string;
  scheduledEndTime: string;
  supervisorId?: UUID;
  supervisorName?: string;
  assignedWorkerIds: UUID[];
}

export interface CreateGangInput {
  tenantId: string;
  facilityId: string;
  gangType: GangType;
  gangCode: string;
  leaderId?: UUID;
  leaderName?: string;
  memberIds: UUID[];
  maxMembers: number;
}

export interface RecordClockInput {
  tenantId: string;
  facilityId: string;
  workerId: UUID;
  workerName: string;
  entryType: ClockEntryType;
  method: ClockMethod;
  shiftId?: UUID;
  gateId?: string;
  deviceId?: string;
}

export interface AssignLaborTaskInput {
  tenantId: string;
  facilityId: string;
  taskType: LaborTaskType;
  description: string;
  assignedToWorkerId?: UUID;
  assignedToWorkerName?: string;
  assignedToGangId?: UUID;
  assignedToGangCode?: string;
  containerId?: UUID;
  containerNumber?: string;
  equipmentId?: UUID;
  locationZone?: string;
  scheduledStart?: Date;
  scheduledEnd?: Date;
}

export interface CreateCostCenterInput {
  tenantId: string;
  facilityId: string;
  code: string;
  name: string;
  type: CostCenterType;
  parentId?: UUID;
  annualBudget?: number;
  monthlyBudget?: number;
  defaultLaborRate?: number;
  defaultEquipmentRate?: number;
  overheadRate?: number;
}

export interface AllocateCostInput {
  tenantId: string;
  facilityId: string;
  costType: CostType;
  costCenterId: UUID;
  costCenterCode: string;
  taskId?: UUID;
  shiftId?: UUID;
  containerId?: UUID;
  containerNumber?: string;
  customerId?: UUID;
  customerName?: string;
  amount: number;
  currency: string;
  units?: number;
  ratePerUnit?: number;
  description?: string;
}

// ============================================================================
// LABOR ENGINE
// ============================================================================

export class LaborEngine {
  private static instance: LaborEngine | null = null;

  // Primary stores
  private workers: Map<UUID, Worker> = new Map();
  private shifts: Map<UUID, Shift> = new Map();
  private gangs: Map<UUID, Gang> = new Map();
  private clockEntries: Map<UUID, ClockEntry> = new Map();
  private tasks: Map<UUID, LaborTask> = new Map();
  private productivityRecords: Map<UUID, ProductivityRecord> = new Map();
  private costCenters: Map<UUID, CostCenter> = new Map();
  private costAllocations: Map<UUID, CostAllocation> = new Map();

  // Secondary indexes
  private workerByCode: Map<string, UUID> = new Map(); // tenantId:employeeCode -> workerId
  private shiftByCode: Map<string, UUID> = new Map();
  private gangByCode: Map<string, UUID> = new Map(); // tenantId:gangCode -> gangId
  private taskByNumber: Map<string, UUID> = new Map();
  private costCenterByCode: Map<string, UUID> = new Map(); // tenantId:code -> costCenterId
  private allocationByNumber: Map<string, UUID> = new Map();
  private clockEntriesByWorker: Map<UUID, UUID[]> = new Map();
  private clockEntriesByShift: Map<UUID, UUID[]> = new Map();

  // Sequential counters
  private shiftCounter = 0;
  private taskCounter = 0;
  private allocationCounter = 0;

  private constructor() {}

  static getInstance(): LaborEngine {
    if (!LaborEngine.instance) {
      LaborEngine.instance = new LaborEngine();
    }
    return LaborEngine.instance;
  }

  static resetInstance(): void {
    LaborEngine.instance = null;
  }

  // ============================================================================
  // 1. WORKER MANAGEMENT
  // ============================================================================

  registerWorker(input: RegisterWorkerInput): OperationResult<Worker> {
    const compositeKey = `${input.tenantId}:${input.employeeCode}`;
    if (this.workerByCode.has(compositeKey)) {
      return { success: false, error: 'Employee code already exists for this tenant', errorCode: 'DUPLICATE_EMPLOYEE_CODE' };
    }

    const now = new Date();

    const certifications: WorkerCertification[] = (input.certifications ?? []).map(cert => ({
      id: uuidv4(),
      certificationType: cert.certificationType,
      certificationNumber: cert.certificationNumber,
      issuedBy: cert.issuedBy,
      issuedDate: cert.issuedDate,
      expiryDate: cert.expiryDate,
      isValid: cert.expiryDate ? cert.expiryDate > now : true,
    }));

    const worker: Worker = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      employeeCode: input.employeeCode,
      name: input.name,
      role: input.role,
      status: 'active',
      contact: input.contact,
      department: input.department,
      joiningDate: input.joiningDate,
      certifications,
      primarySkills: input.primarySkills ?? [],
      rfidTagId: input.rfidTagId,
      isOnDuty: false,
      hourlyRate: input.hourlyRate,
      overtimeRate: input.overtimeRate,
      createdAt: now,
      updatedAt: now,
    };

    this.workers.set(worker.id, worker);
    this.workerByCode.set(compositeKey, worker.id);
    this.clockEntriesByWorker.set(worker.id, []);

    emit('labor.worker_registered', {
      workerId: worker.id,
      employeeCode: worker.employeeCode,
      name: worker.name,
      role: worker.role,
    }, { tenantId: worker.tenantId });

    return { success: true, data: worker };
  }

  getWorker(id: UUID): Worker | undefined {
    return this.workers.get(id);
  }

  getWorkerByCode(tenantId: string, employeeCode: string): Worker | undefined {
    const compositeKey = `${tenantId}:${employeeCode}`;
    const id = this.workerByCode.get(compositeKey);
    return id ? this.workers.get(id) : undefined;
  }

  listWorkers(
    tenantId?: string,
    filters?: { role?: WorkerRole; status?: WorkerStatus; isOnDuty?: boolean }
  ): Worker[] {
    let workers = Array.from(this.workers.values());
    if (tenantId) workers = workers.filter(w => w.tenantId === tenantId);
    if (filters?.role) workers = workers.filter(w => w.role === filters.role);
    if (filters?.status) workers = workers.filter(w => w.status === filters.status);
    if (filters?.isOnDuty !== undefined) workers = workers.filter(w => w.isOnDuty === filters.isOnDuty);
    return workers;
  }

  updateWorkerStatus(workerId: UUID, status: WorkerStatus, reason?: string): OperationResult<Worker> {
    const worker = this.workers.get(workerId);
    if (!worker) return { success: false, error: 'Worker not found', errorCode: 'NOT_FOUND' };

    if (worker.status === 'terminated') {
      return { success: false, error: 'Cannot update terminated worker', errorCode: 'INVALID_STATUS' };
    }

    const previousStatus = worker.status;
    worker.status = status;
    worker.updatedAt = new Date();

    if (status === 'terminated') {
      worker.terminationDate = new Date();
      worker.isOnDuty = false;
    }

    emit('labor.worker_status_changed', {
      workerId: worker.id,
      employeeCode: worker.employeeCode,
      previousStatus,
      newStatus: status,
      reason,
    }, { tenantId: worker.tenantId });

    return { success: true, data: worker };
  }

  addWorkerCertification(
    workerId: UUID,
    certification: {
      certificationType: string;
      certificationNumber?: string;
      issuedBy?: string;
      issuedDate: Date;
      expiryDate?: Date;
    }
  ): OperationResult<Worker> {
    const worker = this.workers.get(workerId);
    if (!worker) return { success: false, error: 'Worker not found', errorCode: 'NOT_FOUND' };

    const now = new Date();
    const cert: WorkerCertification = {
      id: uuidv4(),
      certificationType: certification.certificationType,
      certificationNumber: certification.certificationNumber,
      issuedBy: certification.issuedBy,
      issuedDate: certification.issuedDate,
      expiryDate: certification.expiryDate,
      isValid: certification.expiryDate ? certification.expiryDate > now : true,
    };

    worker.certifications.push(cert);
    worker.updatedAt = now;

    return { success: true, data: worker };
  }

  getAvailableWorkers(
    tenantId: string,
    filters?: { role?: WorkerRole; isOnDuty?: boolean }
  ): Worker[] {
    return Array.from(this.workers.values()).filter(w => {
      if (w.tenantId !== tenantId) return false;
      if (w.status !== 'active') return false;
      if (filters?.role && w.role !== filters.role) return false;
      if (filters?.isOnDuty !== undefined && w.isOnDuty !== filters.isOnDuty) return false;
      // Available means not currently assigned to a task
      if (w.currentGangId) return false;
      return true;
    });
  }

  refreshCertificationValidity(): void {
    const now = new Date();
    for (const worker of this.workers.values()) {
      for (const cert of worker.certifications) {
        cert.isValid = cert.expiryDate ? cert.expiryDate > now : true;
      }
    }
  }

  getWorkersWithExpiringCertifications(tenantId: string, withinDays: number = 30): Worker[] {
    const now = new Date();
    const threshold = new Date(now.getTime() + withinDays * 86400000);
    return Array.from(this.workers.values()).filter(w => {
      if (w.tenantId !== tenantId) return false;
      if (w.status !== 'active') return false;
      return w.certifications.some(cert =>
        cert.expiryDate && cert.expiryDate <= threshold && cert.expiryDate > now
      );
    });
  }

  // ============================================================================
  // 2. SHIFT MANAGEMENT
  // ============================================================================

  createShift(input: CreateShiftInput): OperationResult<Shift> {
    // Validate all assigned workers exist
    for (const workerId of input.assignedWorkerIds) {
      const worker = this.workers.get(workerId);
      if (!worker) {
        return { success: false, error: `Worker ${workerId} not found`, errorCode: 'WORKER_NOT_FOUND' };
      }
      if (worker.tenantId !== input.tenantId) {
        return { success: false, error: `Worker ${workerId} belongs to a different tenant`, errorCode: 'TENANT_MISMATCH' };
      }
    }

    const now = new Date();
    this.shiftCounter++;
    const dateStr = input.date.toISOString().slice(0, 10).replace(/-/g, '');
    const shiftCode = `SHF-${dateStr}-${String(this.shiftCounter).padStart(3, '0')}`;

    const shift: Shift = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      shiftCode,
      shiftType: input.shiftType,
      status: 'scheduled',
      date: input.date,
      scheduledStartTime: input.scheduledStartTime,
      scheduledEndTime: input.scheduledEndTime,
      supervisorId: input.supervisorId,
      supervisorName: input.supervisorName,
      assignedWorkerIds: input.assignedWorkerIds,
      presentWorkerIds: [],
      absentWorkerIds: [],
      totalTEUHandled: 0,
      totalContainerMoves: 0,
      totalGateTransactions: 0,
      incidents: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.shifts.set(shift.id, shift);
    this.shiftByCode.set(shiftCode, shift.id);
    this.clockEntriesByShift.set(shift.id, []);

    return { success: true, data: shift };
  }

  getShift(id: UUID): Shift | undefined {
    return this.shifts.get(id);
  }

  getShiftByCode(shiftCode: string): Shift | undefined {
    const id = this.shiftByCode.get(shiftCode);
    return id ? this.shifts.get(id) : undefined;
  }

  listShifts(
    tenantId?: string,
    filters?: { date?: Date; shiftType?: ShiftType; status?: ShiftStatus }
  ): Shift[] {
    let shifts = Array.from(this.shifts.values());
    if (tenantId) shifts = shifts.filter(s => s.tenantId === tenantId);
    if (filters?.date) {
      const filterDateStr = filters.date.toISOString().slice(0, 10);
      shifts = shifts.filter(s => s.date.toISOString().slice(0, 10) === filterDateStr);
    }
    if (filters?.shiftType) shifts = shifts.filter(s => s.shiftType === filters.shiftType);
    if (filters?.status) shifts = shifts.filter(s => s.status === filters.status);
    return shifts;
  }

  startShift(shiftId: UUID): OperationResult<Shift> {
    const shift = this.shifts.get(shiftId);
    if (!shift) return { success: false, error: 'Shift not found', errorCode: 'NOT_FOUND' };

    if (shift.status !== 'scheduled') {
      return { success: false, error: 'Shift can only be started from scheduled status', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    shift.status = 'active';
    shift.actualStartTime = now;
    shift.updatedAt = now;

    // Set currentShiftId for all assigned workers
    for (const workerId of shift.assignedWorkerIds) {
      const worker = this.workers.get(workerId);
      if (worker) {
        worker.currentShiftId = shift.id;
        worker.updatedAt = now;
      }
    }

    emit('labor.shift_started', {
      shiftId: shift.id,
      shiftCode: shift.shiftCode,
      shiftType: shift.shiftType,
      workerCount: shift.assignedWorkerIds.length,
    }, { tenantId: shift.tenantId });

    return { success: true, data: shift };
  }

  endShift(shiftId: UUID): OperationResult<Shift> {
    const shift = this.shifts.get(shiftId);
    if (!shift) return { success: false, error: 'Shift not found', errorCode: 'NOT_FOUND' };

    if (shift.status !== 'active') {
      return { success: false, error: 'Shift can only be ended from active status', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    shift.status = 'completed';
    shift.actualEndTime = now;
    shift.updatedAt = now;

    // Determine present/absent workers based on clock entries
    const shiftClockIds = this.clockEntriesByShift.get(shift.id) ?? [];
    const workersClockedIn = new Set<UUID>();
    for (const entryId of shiftClockIds) {
      const entry = this.clockEntries.get(entryId);
      if (entry && entry.entryType === 'clock_in') {
        workersClockedIn.add(entry.workerId);
      }
    }

    shift.presentWorkerIds = shift.assignedWorkerIds.filter(wid => workersClockedIn.has(wid));
    shift.absentWorkerIds = shift.assignedWorkerIds.filter(wid => !workersClockedIn.has(wid));

    // Calculate stats: count tasks completed during this shift
    const shiftTasks = Array.from(this.tasks.values()).filter(
      t => t.tenantId === shift.tenantId && t.status === 'completed' &&
        t.actualEnd && shift.actualStartTime &&
        t.actualEnd >= shift.actualStartTime && t.actualEnd <= now
    );
    shift.totalContainerMoves = shiftTasks.filter(
      t => t.containerId !== undefined
    ).length;

    // Clear currentShiftId for all assigned workers
    for (const workerId of shift.assignedWorkerIds) {
      const worker = this.workers.get(workerId);
      if (worker && worker.currentShiftId === shift.id) {
        worker.currentShiftId = undefined;
        worker.updatedAt = now;
      }
    }

    emit('labor.shift_completed', {
      shiftId: shift.id,
      shiftCode: shift.shiftCode,
      presentCount: shift.presentWorkerIds.length,
      absentCount: shift.absentWorkerIds.length,
      totalContainerMoves: shift.totalContainerMoves,
    }, { tenantId: shift.tenantId });

    return { success: true, data: shift };
  }

  recordHandover(
    outgoingShiftId: UUID,
    incomingShiftId: UUID,
    notes: string
  ): OperationResult<Shift> {
    const outgoing = this.shifts.get(outgoingShiftId);
    if (!outgoing) return { success: false, error: 'Outgoing shift not found', errorCode: 'OUTGOING_NOT_FOUND' };

    const incoming = this.shifts.get(incomingShiftId);
    if (!incoming) return { success: false, error: 'Incoming shift not found', errorCode: 'INCOMING_NOT_FOUND' };

    const now = new Date();
    outgoing.nextShiftId = incomingShiftId;
    outgoing.handoverNotes = notes;
    outgoing.updatedAt = now;

    incoming.previousShiftId = outgoingShiftId;
    incoming.updatedAt = now;

    return { success: true, data: outgoing };
  }

  // ============================================================================
  // 3. GANG MANAGEMENT
  // ============================================================================

  createGang(input: CreateGangInput): OperationResult<Gang> {
    const compositeKey = `${input.tenantId}:${input.gangCode}`;
    if (this.gangByCode.has(compositeKey)) {
      return { success: false, error: 'Gang code already exists for this tenant', errorCode: 'DUPLICATE_GANG_CODE' };
    }

    // Validate members exist
    for (const memberId of input.memberIds) {
      const worker = this.workers.get(memberId);
      if (!worker) {
        return { success: false, error: `Worker ${memberId} not found`, errorCode: 'WORKER_NOT_FOUND' };
      }
    }

    if (input.memberIds.length > input.maxMembers) {
      return { success: false, error: 'Member count exceeds maxMembers', errorCode: 'MAX_MEMBERS_EXCEEDED' };
    }

    const now = new Date();
    const gang: Gang = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      gangCode: input.gangCode,
      gangType: input.gangType,
      status: 'available',
      leaderId: input.leaderId,
      leaderName: input.leaderName,
      memberIds: input.memberIds,
      memberCount: input.memberIds.length,
      maxMembers: input.maxMembers,
      totalTasksCompleted: 0,
      avgTaskDurationMinutes: 0,
      productivityScore: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.gangs.set(gang.id, gang);
    this.gangByCode.set(compositeKey, gang.id);

    // Set currentGangId for all members
    for (const memberId of input.memberIds) {
      const worker = this.workers.get(memberId);
      if (worker) {
        worker.currentGangId = gang.id;
        worker.updatedAt = now;
      }
    }

    emit('labor.gang_created', {
      gangId: gang.id,
      gangCode: gang.gangCode,
      gangType: gang.gangType,
      memberCount: gang.memberCount,
    }, { tenantId: gang.tenantId });

    return { success: true, data: gang };
  }

  getGang(id: UUID): Gang | undefined {
    return this.gangs.get(id);
  }

  getGangByCode(tenantId: string, gangCode: string): Gang | undefined {
    const compositeKey = `${tenantId}:${gangCode}`;
    const id = this.gangByCode.get(compositeKey);
    return id ? this.gangs.get(id) : undefined;
  }

  listGangs(
    tenantId?: string,
    filters?: { gangType?: GangType; status?: GangStatus }
  ): Gang[] {
    let gangs = Array.from(this.gangs.values());
    if (tenantId) gangs = gangs.filter(g => g.tenantId === tenantId);
    if (filters?.gangType) gangs = gangs.filter(g => g.gangType === filters.gangType);
    if (filters?.status) gangs = gangs.filter(g => g.status === filters.status);
    return gangs;
  }

  assignGang(gangId: UUID, taskId: UUID, locationZone: string): OperationResult<Gang> {
    const gang = this.gangs.get(gangId);
    if (!gang) return { success: false, error: 'Gang not found', errorCode: 'NOT_FOUND' };

    if (gang.status !== 'available') {
      return { success: false, error: 'Gang is not available for assignment', errorCode: 'NOT_AVAILABLE' };
    }

    const now = new Date();
    gang.status = 'assigned';
    gang.currentTaskId = taskId;
    gang.currentLocationZone = locationZone;
    gang.updatedAt = now;

    emit('labor.gang_assigned', {
      gangId: gang.id,
      gangCode: gang.gangCode,
      taskId,
      locationZone,
    }, { tenantId: gang.tenantId });

    return { success: true, data: gang };
  }

  releaseGang(gangId: UUID): OperationResult<Gang> {
    const gang = this.gangs.get(gangId);
    if (!gang) return { success: false, error: 'Gang not found', errorCode: 'NOT_FOUND' };

    if (gang.status !== 'assigned' && gang.status !== 'working') {
      return { success: false, error: 'Gang is not in assigned or working status', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    gang.status = 'available';
    gang.currentTaskId = undefined;
    gang.currentLocationZone = undefined;
    gang.updatedAt = now;

    return { success: true, data: gang };
  }

  disbandGang(gangId: UUID): OperationResult<Gang> {
    const gang = this.gangs.get(gangId);
    if (!gang) return { success: false, error: 'Gang not found', errorCode: 'NOT_FOUND' };

    if (gang.status === 'disbanded') {
      return { success: false, error: 'Gang is already disbanded', errorCode: 'ALREADY_DISBANDED' };
    }

    const now = new Date();
    gang.status = 'disbanded';
    gang.currentTaskId = undefined;
    gang.currentLocationZone = undefined;
    gang.updatedAt = now;

    // Clear currentGangId for all members
    for (const memberId of gang.memberIds) {
      const worker = this.workers.get(memberId);
      if (worker && worker.currentGangId === gang.id) {
        worker.currentGangId = undefined;
        worker.updatedAt = now;
      }
    }

    emit('labor.gang_disbanded', {
      gangId: gang.id,
      gangCode: gang.gangCode,
    }, { tenantId: gang.tenantId });

    return { success: true, data: gang };
  }

  // ============================================================================
  // 4. CLOCK IN/OUT
  // ============================================================================

  recordClock(input: RecordClockInput): OperationResult<ClockEntry> {
    const worker = this.workers.get(input.workerId);
    if (!worker) return { success: false, error: 'Worker not found', errorCode: 'WORKER_NOT_FOUND' };

    if (worker.status !== 'active') {
      return { success: false, error: 'Worker is not active', errorCode: 'WORKER_NOT_ACTIVE' };
    }

    const now = new Date();

    // Determine overtime: check if worker has been on duty for >8 hours today
    let isOvertime = false;
    let overtimeMinutes = 0;

    if (input.entryType === 'clock_out' || input.entryType === 'break_start') {
      const hoursToday = this.calculateWorkerHoursForDate(input.workerId, now);
      if (hoursToday > 8) {
        isOvertime = true;
        overtimeMinutes = Math.round((hoursToday - 8) * 60);
      }
    }

    const entry: ClockEntry = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      workerId: input.workerId,
      workerName: input.workerName,
      shiftId: input.shiftId,
      entryType: input.entryType,
      method: input.method,
      timestamp: now,
      gateId: input.gateId,
      deviceId: input.deviceId,
      isOvertime,
      overtimeMinutes,
      createdAt: now,
      updatedAt: now,
    };

    this.clockEntries.set(entry.id, entry);

    // Index by worker
    const workerEntries = this.clockEntriesByWorker.get(input.workerId);
    if (workerEntries) {
      workerEntries.push(entry.id);
    } else {
      this.clockEntriesByWorker.set(input.workerId, [entry.id]);
    }

    // Index by shift
    if (input.shiftId) {
      const shiftEntries = this.clockEntriesByShift.get(input.shiftId);
      if (shiftEntries) {
        shiftEntries.push(entry.id);
      } else {
        this.clockEntriesByShift.set(input.shiftId, [entry.id]);
      }
    }

    // Update worker state
    if (input.entryType === 'clock_in') {
      worker.isOnDuty = true;
      worker.lastClockIn = now;
      worker.updatedAt = now;

      emit('labor.clock_in', {
        workerId: worker.id,
        employeeCode: worker.employeeCode,
        workerName: input.workerName,
        method: input.method,
        shiftId: input.shiftId,
      }, { tenantId: input.tenantId });

    } else if (input.entryType === 'clock_out') {
      worker.isOnDuty = false;
      worker.lastClockOut = now;
      worker.updatedAt = now;

      emit('labor.clock_out', {
        workerId: worker.id,
        employeeCode: worker.employeeCode,
        workerName: input.workerName,
        method: input.method,
        shiftId: input.shiftId,
        isOvertime,
        overtimeMinutes,
      }, { tenantId: input.tenantId });

      // Emit overtime alert if applicable
      if (isOvertime) {
        emit('labor.overtime_alert', {
          workerId: worker.id,
          employeeCode: worker.employeeCode,
          workerName: input.workerName,
          overtimeMinutes,
        }, { tenantId: input.tenantId });
      }
    }

    return { success: true, data: entry };
  }

  getClockEntries(
    filters: { workerId?: UUID; shiftId?: UUID; dateFrom?: Date; dateTo?: Date }
  ): ClockEntry[] {
    let entries: ClockEntry[];

    if (filters.workerId) {
      const ids = this.clockEntriesByWorker.get(filters.workerId) ?? [];
      entries = ids.map(id => this.clockEntries.get(id)).filter((e): e is ClockEntry => e !== undefined);
    } else if (filters.shiftId) {
      const ids = this.clockEntriesByShift.get(filters.shiftId) ?? [];
      entries = ids.map(id => this.clockEntries.get(id)).filter((e): e is ClockEntry => e !== undefined);
    } else {
      entries = Array.from(this.clockEntries.values());
    }

    if (filters.dateFrom) {
      entries = entries.filter(e => e.timestamp >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      entries = entries.filter(e => e.timestamp <= filters.dateTo!);
    }

    return entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  getWorkerHoursToday(workerId: UUID): number {
    const now = new Date();
    return this.calculateWorkerHoursForDate(workerId, now);
  }

  calculateOvertime(workerId: UUID, dateFrom: Date, dateTo: Date): { totalHours: number; overtimeHours: number; regularHours: number } {
    const entries = this.getClockEntries({ workerId, dateFrom, dateTo });

    let totalHours = 0;
    let clockInTime: Date | null = null;

    for (const entry of entries) {
      if (entry.entryType === 'clock_in') {
        clockInTime = entry.timestamp;
      } else if (entry.entryType === 'clock_out' && clockInTime) {
        const hours = (entry.timestamp.getTime() - clockInTime.getTime()) / 3600000;
        totalHours += hours;
        clockInTime = null;
      }
    }

    // If still clocked in, count until dateTo
    if (clockInTime) {
      const hours = (dateTo.getTime() - clockInTime.getTime()) / 3600000;
      totalHours += hours;
    }

    // Group by day to compute daily overtime
    const dayMap = new Map<string, number>();
    let tempClockIn: Date | null = null;

    for (const entry of entries) {
      if (entry.entryType === 'clock_in') {
        tempClockIn = entry.timestamp;
      } else if (entry.entryType === 'clock_out' && tempClockIn) {
        const dayKey = tempClockIn.toISOString().slice(0, 10);
        const hours = (entry.timestamp.getTime() - tempClockIn.getTime()) / 3600000;
        dayMap.set(dayKey, (dayMap.get(dayKey) ?? 0) + hours);
        tempClockIn = null;
      }
    }

    let overtimeHours = 0;
    for (const dailyHours of dayMap.values()) {
      if (dailyHours > 8) {
        overtimeHours += dailyHours - 8;
      }
    }

    const regularHours = totalHours - overtimeHours;

    return { totalHours, overtimeHours, regularHours };
  }

  private calculateWorkerHoursForDate(workerId: UUID, date: Date): number {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 86400000);

    const entries = this.getClockEntries({ workerId, dateFrom: dayStart, dateTo: dayEnd });

    let totalHours = 0;
    let clockInTime: Date | null = null;

    for (const entry of entries) {
      if (entry.entryType === 'clock_in') {
        clockInTime = entry.timestamp;
      } else if (entry.entryType === 'clock_out' && clockInTime) {
        totalHours += (entry.timestamp.getTime() - clockInTime.getTime()) / 3600000;
        clockInTime = null;
      }
    }

    // If still clocked in, count until now
    if (clockInTime) {
      totalHours += (date.getTime() - clockInTime.getTime()) / 3600000;
    }

    return totalHours;
  }

  // ============================================================================
  // 5. TASK ASSIGNMENT
  // ============================================================================

  assignTask(input: AssignLaborTaskInput): OperationResult<LaborTask> {
    // Validate assigned worker exists if specified
    if (input.assignedToWorkerId) {
      const worker = this.workers.get(input.assignedToWorkerId);
      if (!worker) {
        return { success: false, error: 'Assigned worker not found', errorCode: 'WORKER_NOT_FOUND' };
      }
    }

    // Validate assigned gang exists if specified
    if (input.assignedToGangId) {
      const gang = this.gangs.get(input.assignedToGangId);
      if (!gang) {
        return { success: false, error: 'Assigned gang not found', errorCode: 'GANG_NOT_FOUND' };
      }
    }

    const now = new Date();
    this.taskCounter++;
    const taskNumber = `TSK-${String(this.taskCounter).padStart(3, '0')}`;

    const task: LaborTask = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      taskNumber,
      taskType: input.taskType,
      status: 'assigned',
      description: input.description,
      assignedToWorkerId: input.assignedToWorkerId,
      assignedToWorkerName: input.assignedToWorkerName,
      assignedToGangId: input.assignedToGangId,
      assignedToGangCode: input.assignedToGangCode,
      assignedAt: now,
      scheduledStart: input.scheduledStart,
      scheduledEnd: input.scheduledEnd,
      containerId: input.containerId,
      containerNumber: input.containerNumber,
      equipmentId: input.equipmentId,
      locationZone: input.locationZone,
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.set(task.id, task);
    this.taskByNumber.set(taskNumber, task.id);

    emit('labor.task_assigned', {
      taskId: task.id,
      taskNumber: task.taskNumber,
      taskType: task.taskType,
      assignedToWorkerId: task.assignedToWorkerId,
      assignedToGangId: task.assignedToGangId,
      containerId: task.containerId,
    }, { tenantId: task.tenantId });

    return { success: true, data: task };
  }

  getTask(id: UUID): LaborTask | undefined {
    return this.tasks.get(id);
  }

  getTaskByNumber(taskNumber: string): LaborTask | undefined {
    const id = this.taskByNumber.get(taskNumber);
    return id ? this.tasks.get(id) : undefined;
  }

  listTasks(
    tenantId?: string,
    filters?: {
      status?: LaborTaskStatus;
      taskType?: LaborTaskType;
      workerId?: UUID;
      gangId?: UUID;
    }
  ): LaborTask[] {
    let tasks = Array.from(this.tasks.values());
    if (tenantId) tasks = tasks.filter(t => t.tenantId === tenantId);
    if (filters?.status) tasks = tasks.filter(t => t.status === filters.status);
    if (filters?.taskType) tasks = tasks.filter(t => t.taskType === filters.taskType);
    if (filters?.workerId) tasks = tasks.filter(t => t.assignedToWorkerId === filters.workerId);
    if (filters?.gangId) tasks = tasks.filter(t => t.assignedToGangId === filters.gangId);
    return tasks;
  }

  startTask(taskId: UUID): OperationResult<LaborTask> {
    const task = this.tasks.get(taskId);
    if (!task) return { success: false, error: 'Task not found', errorCode: 'NOT_FOUND' };

    if (task.status !== 'assigned' && task.status !== 'accepted') {
      return { success: false, error: 'Task can only be started from assigned or accepted status', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    task.status = 'in_progress';
    task.actualStart = now;
    task.updatedAt = now;

    // If gang is assigned, set gang status to working
    if (task.assignedToGangId) {
      const gang = this.gangs.get(task.assignedToGangId);
      if (gang && (gang.status === 'assigned' || gang.status === 'available')) {
        gang.status = 'working';
        gang.currentTaskId = task.id;
        gang.updatedAt = now;
      }
    }

    emit('labor.task_started', {
      taskId: task.id,
      taskNumber: task.taskNumber,
      taskType: task.taskType,
      assignedToWorkerId: task.assignedToWorkerId,
      assignedToGangId: task.assignedToGangId,
    }, { tenantId: task.tenantId });

    return { success: true, data: task };
  }

  completeTask(
    taskId: UUID,
    result?: { unitsCompleted?: number; errorCount?: number; qualityScore?: number; remarks?: string }
  ): OperationResult<LaborTask> {
    const task = this.tasks.get(taskId);
    if (!task) return { success: false, error: 'Task not found', errorCode: 'NOT_FOUND' };

    if (task.status !== 'in_progress') {
      return { success: false, error: 'Task can only be completed from in_progress status', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    task.status = 'completed';
    task.actualEnd = now;
    task.updatedAt = now;

    // Calculate duration
    if (task.actualStart) {
      task.durationMinutes = Math.round((now.getTime() - task.actualStart.getTime()) / 60000);
    }

    // Set result fields
    if (result) {
      task.unitsCompleted = result.unitsCompleted;
      task.errorCount = result.errorCount;
      task.qualityScore = result.qualityScore;
      task.remarks = result.remarks;
    }

    // Calculate cost based on duration and worker rate
    if (task.durationMinutes && task.assignedToWorkerId) {
      const worker = this.workers.get(task.assignedToWorkerId);
      if (worker?.hourlyRate) {
        task.laborCost = (task.durationMinutes / 60) * worker.hourlyRate;
        task.totalCost = task.laborCost + (task.equipmentCost ?? 0);
      }
    }

    // Release gang if assigned
    if (task.assignedToGangId) {
      const gang = this.gangs.get(task.assignedToGangId);
      if (gang && gang.currentTaskId === task.id) {
        gang.status = 'available';
        gang.currentTaskId = undefined;
        gang.currentLocationZone = undefined;
        gang.totalTasksCompleted++;
        // Update rolling average task duration
        if (task.durationMinutes) {
          const totalTasks = gang.totalTasksCompleted;
          gang.avgTaskDurationMinutes =
            ((gang.avgTaskDurationMinutes * (totalTasks - 1)) + task.durationMinutes) / totalTasks;
        }
        gang.updatedAt = now;
      }
    }

    emit('labor.task_completed', {
      taskId: task.id,
      taskNumber: task.taskNumber,
      taskType: task.taskType,
      durationMinutes: task.durationMinutes,
      unitsCompleted: task.unitsCompleted,
      laborCost: task.laborCost,
    }, { tenantId: task.tenantId });

    return { success: true, data: task };
  }

  cancelTask(taskId: UUID, reason?: string): OperationResult<LaborTask> {
    const task = this.tasks.get(taskId);
    if (!task) return { success: false, error: 'Task not found', errorCode: 'NOT_FOUND' };

    if (task.status === 'completed') {
      return { success: false, error: 'Cannot cancel a completed task', errorCode: 'ALREADY_COMPLETED' };
    }

    if (task.status === 'cancelled') {
      return { success: false, error: 'Task is already cancelled', errorCode: 'ALREADY_CANCELLED' };
    }

    const now = new Date();
    task.status = 'cancelled';
    task.remarks = reason;
    task.updatedAt = now;

    // Release gang if assigned
    if (task.assignedToGangId) {
      const gang = this.gangs.get(task.assignedToGangId);
      if (gang && gang.currentTaskId === task.id) {
        gang.status = 'available';
        gang.currentTaskId = undefined;
        gang.currentLocationZone = undefined;
        gang.updatedAt = now;
      }
    }

    return { success: true, data: task };
  }

  recordProductivity(
    workerId: UUID,
    shiftId: UUID,
    data: {
      teuHandled: number;
      containerMoves: number;
      gateTransactions: number;
      tasksCompleted: number;
      hoursWorked: number;
      overtimeHours: number;
      errorCount: number;
    }
  ): OperationResult<ProductivityRecord> {
    const worker = this.workers.get(workerId);
    if (!worker) return { success: false, error: 'Worker not found', errorCode: 'WORKER_NOT_FOUND' };

    const shift = this.shifts.get(shiftId);
    if (!shift) return { success: false, error: 'Shift not found', errorCode: 'SHIFT_NOT_FOUND' };

    const teuPerHour = data.hoursWorked > 0 ? data.teuHandled / data.hoursWorked : 0;
    const movesPerHour = data.hoursWorked > 0 ? data.containerMoves / data.hoursWorked : 0;

    const totalActions = data.containerMoves + data.gateTransactions + data.tasksCompleted;
    const accuracyPercent = totalActions > 0
      ? Math.round(((totalActions - data.errorCount) / totalActions) * 10000) / 100
      : 100;

    // Productivity score: weighted combination of throughput, accuracy, and utilization
    const throughputScore = Math.min(teuPerHour * 10, 40); // max 40 points
    const accuracyScore = (accuracyPercent / 100) * 40; // max 40 points
    const utilizationScore = Math.min((data.hoursWorked / 8) * 20, 20); // max 20 points
    const productivityScore = Math.round(throughputScore + accuracyScore + utilizationScore);

    const record: ProductivityRecord = {
      id: uuidv4(),
      tenantId: worker.tenantId,
      facilityId: worker.facilityId,
      workerId,
      workerName: worker.name,
      shiftId,
      date: shift.date,
      teuHandled: data.teuHandled,
      containerMoves: data.containerMoves,
      gateTransactions: data.gateTransactions,
      tasksCompleted: data.tasksCompleted,
      teuPerHour,
      movesPerHour,
      hoursWorked: data.hoursWorked,
      overtimeHours: data.overtimeHours,
      errorCount: data.errorCount,
      accuracyPercent,
      productivityScore,
    };

    this.productivityRecords.set(record.id, record);

    emit('labor.productivity_recorded', {
      workerId: record.workerId,
      workerName: record.workerName,
      shiftId: record.shiftId,
      productivityScore: record.productivityScore,
      teuHandled: record.teuHandled,
    }, { tenantId: record.tenantId });

    return { success: true, data: record };
  }

  // ============================================================================
  // 6. COST CENTERS
  // ============================================================================

  createCostCenter(input: CreateCostCenterInput): OperationResult<CostCenter> {
    const compositeKey = `${input.tenantId}:${input.code}`;
    if (this.costCenterByCode.has(compositeKey)) {
      return { success: false, error: 'Cost center code already exists for this tenant', errorCode: 'DUPLICATE_COST_CENTER_CODE' };
    }

    if (input.parentId) {
      const parent = this.costCenters.get(input.parentId);
      if (!parent) {
        return { success: false, error: 'Parent cost center not found', errorCode: 'PARENT_NOT_FOUND' };
      }
    }

    const now = new Date();
    const costCenter: CostCenter = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      code: input.code,
      name: input.name,
      type: input.type,
      parentId: input.parentId,
      isActive: true,
      annualBudget: input.annualBudget,
      monthlyBudget: input.monthlyBudget,
      ytdActual: 0,
      mtdActual: 0,
      defaultLaborRate: input.defaultLaborRate,
      defaultEquipmentRate: input.defaultEquipmentRate,
      overheadRate: input.overheadRate,
      createdAt: now,
      updatedAt: now,
    };

    this.costCenters.set(costCenter.id, costCenter);
    this.costCenterByCode.set(compositeKey, costCenter.id);

    return { success: true, data: costCenter };
  }

  getCostCenter(id: UUID): CostCenter | undefined {
    return this.costCenters.get(id);
  }

  getCostCenterByCode(tenantId: string, code: string): CostCenter | undefined {
    const compositeKey = `${tenantId}:${code}`;
    const id = this.costCenterByCode.get(compositeKey);
    return id ? this.costCenters.get(id) : undefined;
  }

  listCostCenters(
    tenantId?: string,
    filters?: { type?: CostCenterType; isActive?: boolean }
  ): CostCenter[] {
    let centers = Array.from(this.costCenters.values());
    if (tenantId) centers = centers.filter(c => c.tenantId === tenantId);
    if (filters?.type) centers = centers.filter(c => c.type === filters.type);
    if (filters?.isActive !== undefined) centers = centers.filter(c => c.isActive === filters.isActive);
    return centers;
  }

  updateBudget(
    costCenterId: UUID,
    budget: { annualBudget?: number; monthlyBudget?: number }
  ): OperationResult<CostCenter> {
    const center = this.costCenters.get(costCenterId);
    if (!center) return { success: false, error: 'Cost center not found', errorCode: 'NOT_FOUND' };

    if (budget.annualBudget !== undefined) center.annualBudget = budget.annualBudget;
    if (budget.monthlyBudget !== undefined) center.monthlyBudget = budget.monthlyBudget;
    center.updatedAt = new Date();

    return { success: true, data: center };
  }

  // ============================================================================
  // 7. COST ALLOCATION
  // ============================================================================

  allocateCost(input: AllocateCostInput): OperationResult<CostAllocation> {
    const costCenter = this.costCenters.get(input.costCenterId);
    if (!costCenter) {
      return { success: false, error: 'Cost center not found', errorCode: 'COST_CENTER_NOT_FOUND' };
    }

    if (!costCenter.isActive) {
      return { success: false, error: 'Cost center is not active', errorCode: 'COST_CENTER_INACTIVE' };
    }

    // Validate task if specified
    if (input.taskId) {
      const task = this.tasks.get(input.taskId);
      if (!task) {
        return { success: false, error: 'Task not found', errorCode: 'TASK_NOT_FOUND' };
      }
    }

    // Validate shift if specified
    if (input.shiftId) {
      const shift = this.shifts.get(input.shiftId);
      if (!shift) {
        return { success: false, error: 'Shift not found', errorCode: 'SHIFT_NOT_FOUND' };
      }
    }

    const now = new Date();
    this.allocationCounter++;
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const allocationNumber = `COST-${dateStr}-${String(this.allocationCounter).padStart(4, '0')}`;

    const allocation: CostAllocation = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      allocationNumber,
      date: now,
      costType: input.costType,
      costCenterId: input.costCenterId,
      costCenterCode: input.costCenterCode,
      taskId: input.taskId,
      shiftId: input.shiftId,
      containerId: input.containerId,
      containerNumber: input.containerNumber,
      customerId: input.customerId,
      customerName: input.customerName,
      amount: input.amount,
      currency: input.currency,
      units: input.units,
      ratePerUnit: input.ratePerUnit,
      description: input.description,
      createdAt: now,
      updatedAt: now,
    };

    this.costAllocations.set(allocation.id, allocation);
    this.allocationByNumber.set(allocationNumber, allocation.id);

    // Update cost center actuals
    costCenter.mtdActual += input.amount;
    costCenter.ytdActual += input.amount;
    costCenter.updatedAt = now;

    emit('labor.cost_allocated', {
      allocationId: allocation.id,
      allocationNumber: allocation.allocationNumber,
      costType: allocation.costType,
      costCenterId: allocation.costCenterId,
      amount: allocation.amount,
      currency: allocation.currency,
      containerId: allocation.containerId,
      customerId: allocation.customerId,
    }, { tenantId: allocation.tenantId });

    return { success: true, data: allocation };
  }

  getCostAllocation(id: UUID): CostAllocation | undefined {
    return this.costAllocations.get(id);
  }

  getCostAllocationByNumber(allocationNumber: string): CostAllocation | undefined {
    const id = this.allocationByNumber.get(allocationNumber);
    return id ? this.costAllocations.get(id) : undefined;
  }

  listCostAllocations(
    tenantId?: string,
    filters?: {
      costCenterId?: UUID;
      containerId?: UUID;
      customerId?: UUID;
      dateFrom?: Date;
      dateTo?: Date;
      costType?: CostType;
    }
  ): CostAllocation[] {
    let allocations = Array.from(this.costAllocations.values());
    if (tenantId) allocations = allocations.filter(a => a.tenantId === tenantId);
    if (filters?.costCenterId) allocations = allocations.filter(a => a.costCenterId === filters.costCenterId);
    if (filters?.containerId) allocations = allocations.filter(a => a.containerId === filters.containerId);
    if (filters?.customerId) allocations = allocations.filter(a => a.customerId === filters.customerId);
    if (filters?.costType) allocations = allocations.filter(a => a.costType === filters.costType);
    if (filters?.dateFrom) allocations = allocations.filter(a => a.date >= filters.dateFrom!);
    if (filters?.dateTo) allocations = allocations.filter(a => a.date <= filters.dateTo!);
    return allocations;
  }

  getCostPerTEU(tenantId: string, dateFrom: Date, dateTo: Date): { costPerTEU: number; totalCost: number; totalTEU: number } {
    // Sum all cost allocations in the period
    const allocations = this.listCostAllocations(tenantId, { dateFrom, dateTo });
    const totalCost = allocations.reduce((sum, a) => sum + a.amount, 0);

    // Sum TEU handled from completed tasks in the period
    const completedTasks = Array.from(this.tasks.values()).filter(t =>
      t.tenantId === tenantId &&
      t.status === 'completed' &&
      t.actualEnd &&
      t.actualEnd >= dateFrom &&
      t.actualEnd <= dateTo &&
      t.containerId !== undefined
    );

    // Each container task counts as 1 TEU for simplicity; use productivity records for better accuracy
    const productivityInRange = Array.from(this.productivityRecords.values()).filter(r =>
      r.tenantId === tenantId &&
      r.date >= dateFrom &&
      r.date <= dateTo
    );

    let totalTEU = productivityInRange.reduce((sum, r) => sum + r.teuHandled, 0);

    // Fallback to task count if no productivity records
    if (totalTEU === 0) {
      totalTEU = completedTasks.length;
    }

    const costPerTEU = totalTEU > 0 ? totalCost / totalTEU : 0;

    return { costPerTEU, totalCost, totalTEU };
  }

  // ============================================================================
  // 8. STATS
  // ============================================================================

  getLaborStats(tenantId: string): LaborStats {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Workers
    const allWorkers = Array.from(this.workers.values()).filter(w => w.tenantId === tenantId);
    const activeWorkers = allWorkers.filter(w => w.status === 'active');
    const onDutyWorkers = allWorkers.filter(w => w.isOnDuty);
    const onLeaveWorkers = allWorkers.filter(w => w.status === 'on_leave');

    // Shifts
    const allShifts = Array.from(this.shifts.values()).filter(s => s.tenantId === tenantId);
    const activeShifts = allShifts.filter(s => s.status === 'active');
    const todayDateStr = todayStart.toISOString().slice(0, 10);
    const shiftsToday = allShifts.filter(s => s.date.toISOString().slice(0, 10) === todayDateStr);

    // Calculate overtime hours today from clock entries
    let totalOvertimeHoursToday = 0;
    const todayEntries = Array.from(this.clockEntries.values()).filter(
      e => e.tenantId === tenantId && e.timestamp >= todayStart && e.isOvertime
    );
    totalOvertimeHoursToday = todayEntries.reduce((sum, e) => sum + (e.overtimeMinutes / 60), 0);

    // Gangs
    const allGangs = Array.from(this.gangs.values()).filter(g => g.tenantId === tenantId && g.status !== 'disbanded');
    const availableGangs = allGangs.filter(g => g.status === 'available');
    const workingGangs = allGangs.filter(g => g.status === 'working' || g.status === 'assigned');

    // Tasks today
    const allTasks = Array.from(this.tasks.values()).filter(t => t.tenantId === tenantId);
    const tasksToday = allTasks.filter(t => t.createdAt >= todayStart);
    const completedTasksToday = tasksToday.filter(t => t.status === 'completed');
    const pendingTasksToday = tasksToday.filter(
      t => t.status === 'assigned' || t.status === 'accepted' || t.status === 'in_progress'
    );

    const completedDurations = completedTasksToday
      .filter(t => t.durationMinutes !== undefined)
      .map(t => t.durationMinutes!);
    const avgTaskDurationMinutes = completedDurations.length > 0
      ? completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length
      : 0;

    // Productivity
    const allProductivity = Array.from(this.productivityRecords.values()).filter(
      r => r.tenantId === tenantId
    );
    const recentProductivity = allProductivity.filter(r => r.date >= todayStart);

    const avgTEUPerWorkerPerShift = recentProductivity.length > 0
      ? recentProductivity.reduce((sum, r) => sum + r.teuHandled, 0) / recentProductivity.length
      : 0;

    const avgAccuracyPercent = recentProductivity.length > 0
      ? recentProductivity.reduce((sum, r) => sum + r.accuracyPercent, 0) / recentProductivity.length
      : 0;

    const topPerformerScore = recentProductivity.length > 0
      ? Math.max(...recentProductivity.map(r => r.productivityScore))
      : 0;

    // Cost MTD
    const mtdAllocations = Array.from(this.costAllocations.values()).filter(
      a => a.tenantId === tenantId && a.date >= monthStart
    );
    const totalLaborCostMTD = mtdAllocations
      .filter(a => a.costType === 'labor')
      .reduce((sum, a) => sum + a.amount, 0);
    const totalEquipmentCostMTD = mtdAllocations
      .filter(a => a.costType === 'equipment')
      .reduce((sum, a) => sum + a.amount, 0);

    // Cost per TEU MTD
    const mtdProductivity = allProductivity.filter(r => r.date >= monthStart);
    const totalTEU_MTD = mtdProductivity.reduce((sum, r) => sum + r.teuHandled, 0);
    const totalCostMTD = mtdAllocations.reduce((sum, a) => sum + a.amount, 0);
    const costPerTEU = totalTEU_MTD > 0 ? totalCostMTD / totalTEU_MTD : 0;

    // Budget utilization
    const activeCostCenters = Array.from(this.costCenters.values()).filter(
      c => c.tenantId === tenantId && c.isActive
    );
    const totalMonthlyBudget = activeCostCenters.reduce((sum, c) => sum + (c.monthlyBudget ?? 0), 0);
    const totalMTDActual = activeCostCenters.reduce((sum, c) => sum + c.mtdActual, 0);
    const budgetUtilizationPercent = totalMonthlyBudget > 0
      ? (totalMTDActual / totalMonthlyBudget) * 100
      : 0;

    return {
      tenantId,
      totalWorkers: allWorkers.length,
      activeWorkers: activeWorkers.length,
      onDutyWorkers: onDutyWorkers.length,
      onLeaveWorkers: onLeaveWorkers.length,
      activeShifts: activeShifts.length,
      shiftsToday: shiftsToday.length,
      totalOvertimeHoursToday,
      totalGangs: allGangs.length,
      availableGangs: availableGangs.length,
      workingGangs: workingGangs.length,
      totalTasksToday: tasksToday.length,
      completedTasksToday: completedTasksToday.length,
      pendingTasksToday: pendingTasksToday.length,
      avgTaskDurationMinutes,
      avgTEUPerWorkerPerShift,
      avgAccuracyPercent,
      topPerformerScore,
      totalLaborCostMTD,
      totalEquipmentCostMTD,
      costPerTEU,
      budgetUtilizationPercent,
    };
  }
}

// ============================================================================
// SINGLETON ACCESSORS
// ============================================================================

let _laborEngine: LaborEngine | null = null;

export function getLaborEngine(): LaborEngine {
  if (!_laborEngine) {
    _laborEngine = LaborEngine.getInstance();
  }
  return _laborEngine;
}

export function setLaborEngine(engine: LaborEngine): void {
  _laborEngine = engine;
}
