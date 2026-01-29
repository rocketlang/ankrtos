// Equipment Engine for ankrICD
// Comprehensive equipment fleet management - CHE, Maintenance, Assignments, Telematics

import { v4 as uuidv4 } from 'uuid';
import type {
  UUID,
  OperationResult,
  PaginatedResult,
} from '../types/common';
import type {
  Equipment,
  EquipmentType,
  EquipmentStatus,
  MaintenanceRecord,
  MaintenanceType,
  EquipmentAssignment,
  PreShiftChecklist,
  ChecklistItem,
  EquipmentUtilization,
  FuelType,
} from '../types/equipment';
import { CHECKLIST_ITEMS } from '../types/equipment';
import { emit } from '../core';

// ============================================================================
// EQUIPMENT ENGINE
// ============================================================================

export class EquipmentEngine {
  private static instance: EquipmentEngine | null = null;

  // In-memory stores
  private equipment: Map<UUID, Equipment> = new Map();
  private maintenanceRecords: Map<UUID, MaintenanceRecord> = new Map();
  private assignments: Map<UUID, EquipmentAssignment> = new Map();
  private checklists: Map<UUID, PreShiftChecklist> = new Map();

  private constructor() {}

  static getInstance(): EquipmentEngine {
    if (!EquipmentEngine.instance) {
      EquipmentEngine.instance = new EquipmentEngine();
    }
    return EquipmentEngine.instance;
  }

  static resetInstance(): void {
    EquipmentEngine.instance = null;
  }

  // ============================================================================
  // EQUIPMENT REGISTRATION & MANAGEMENT
  // ============================================================================

  /**
   * Register new equipment
   */
  registerEquipment(input: RegisterEquipmentInput): OperationResult<Equipment> {
    // Validate equipment number uniqueness
    const existing = Array.from(this.equipment.values()).find(
      e => e.equipmentNumber === input.equipmentNumber && e.tenantId === input.tenantId
    );

    if (existing) {
      return {
        success: false,
        error: `Equipment ${input.equipmentNumber} already exists`,
        errorCode: 'DUPLICATE_EQUIPMENT',
      };
    }

    const equip: Equipment = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      equipmentNumber: input.equipmentNumber,
      type: input.type,
      status: 'available',

      // Details
      make: input.make,
      model: input.model,
      yearOfManufacture: input.yearOfManufacture,
      serialNumber: input.serialNumber,
      registrationNumber: input.registrationNumber,

      // Capabilities
      liftCapacity: input.liftCapacity,
      maxReach: input.maxReach,
      maxStack: input.maxStack,
      maxLiftHeight: input.maxLiftHeight,
      spreaderType: input.spreaderType,
      canHandleReefer: input.canHandleReefer ?? false,
      canHandleHazmat: input.canHandleHazmat ?? false,
      canHandleOOG: input.canHandleOOG ?? false,

      // Power
      fuelType: input.fuelType,
      fuelCapacity: input.fuelCapacity,
      currentFuelLevel: 100,

      // Maintenance
      engineHours: 0,
      odometer: 0,
      maintenanceSchedule: [],
      certifications: [],
      preShiftChecklistRequired: input.preShiftChecklistRequired ?? true,

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.equipment.set(equip.id, equip);

    emit('equipment.status_changed', {
      equipmentId: equip.id,
      equipmentNumber: equip.equipmentNumber,
      type: equip.type,
      newStatus: 'available',
    }, { tenantId: equip.tenantId });

    return { success: true, data: equip };
  }

  /**
   * Get equipment by ID
   */
  getEquipment(equipmentId: UUID): Equipment | undefined {
    return this.equipment.get(equipmentId);
  }

  /**
   * List equipment with filtering
   */
  listEquipment(options: EquipmentQueryOptions = {}): PaginatedResult<Equipment> {
    let items = Array.from(this.equipment.values());

    if (options.tenantId) {
      items = items.filter(e => e.tenantId === options.tenantId);
    }
    if (options.facilityId) {
      items = items.filter(e => e.facilityId === options.facilityId);
    }
    if (options.type) {
      items = items.filter(e => e.type === options.type);
    }
    if (options.types) {
      items = items.filter(e => options.types!.includes(e.type));
    }
    if (options.status) {
      items = items.filter(e => e.status === options.status);
    }
    if (options.statuses) {
      items = items.filter(e => options.statuses!.includes(e.status));
    }
    if (options.availableOnly) {
      items = items.filter(e => e.status === 'available');
    }
    if (options.canHandleReefer !== undefined) {
      items = items.filter(e => e.canHandleReefer === options.canHandleReefer);
    }
    if (options.canHandleHazmat !== undefined) {
      items = items.filter(e => e.canHandleHazmat === options.canHandleHazmat);
    }
    if (options.canHandleOOG !== undefined) {
      items = items.filter(e => e.canHandleOOG === options.canHandleOOG);
    }
    if (options.minLiftCapacity) {
      items = items.filter(e => e.liftCapacity >= options.minLiftCapacity!);
    }
    if (options.zoneId) {
      items = items.filter(e => e.assignedZone === options.zoneId);
    }

    const total = items.length;
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 50;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    items = items.slice(offset, offset + pageSize);

    return {
      data: items,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Update equipment status
   */
  updateStatus(equipmentId: UUID, status: EquipmentStatus, reason?: string): OperationResult<Equipment> {
    const equip = this.equipment.get(equipmentId);
    if (!equip) {
      return { success: false, error: 'Equipment not found', errorCode: 'NOT_FOUND' };
    }

    const previousStatus = equip.status;
    equip.status = status;
    equip.updatedAt = new Date();
    this.equipment.set(equipmentId, equip);

    emit('equipment.status_changed', {
      equipmentId: equip.id,
      equipmentNumber: equip.equipmentNumber,
      type: equip.type,
      previousStatus,
      newStatus: status,
      reason,
    }, { tenantId: equip.tenantId });

    // Emit specific events for critical status changes
    if (status === 'breakdown') {
      emit('equipment.breakdown', {
        equipmentId: equip.id,
        equipmentNumber: equip.equipmentNumber,
        type: equip.type,
        reason,
      }, { tenantId: equip.tenantId });
    }

    if (previousStatus === 'breakdown' && status !== 'breakdown') {
      emit('equipment.breakdown_resolved', {
        equipmentId: equip.id,
        equipmentNumber: equip.equipmentNumber,
        type: equip.type,
      }, { tenantId: equip.tenantId });
    }

    return { success: true, data: equip };
  }

  /**
   * Assign equipment to a zone
   */
  assignToZone(equipmentId: UUID, zoneId: UUID): OperationResult<Equipment> {
    const equip = this.equipment.get(equipmentId);
    if (!equip) {
      return { success: false, error: 'Equipment not found', errorCode: 'NOT_FOUND' };
    }

    equip.assignedZone = zoneId;
    equip.updatedAt = new Date();
    this.equipment.set(equipmentId, equip);

    return { success: true, data: equip };
  }

  /**
   * Update fuel/battery level
   */
  updateFuelLevel(equipmentId: UUID, level: number): OperationResult<Equipment> {
    const equip = this.equipment.get(equipmentId);
    if (!equip) {
      return { success: false, error: 'Equipment not found', errorCode: 'NOT_FOUND' };
    }

    equip.currentFuelLevel = Math.max(0, Math.min(100, level));
    equip.updatedAt = new Date();
    this.equipment.set(equipmentId, equip);

    // Alert on low fuel/battery
    if (level <= 15) {
      const eventType = equip.fuelType === 'electric' ? 'equipment.battery_low' : 'equipment.fuel_low';
      emit(eventType as any, {
        equipmentId: equip.id,
        equipmentNumber: equip.equipmentNumber,
        type: equip.type,
        level,
        fuelType: equip.fuelType,
      }, { tenantId: equip.tenantId });
    }

    return { success: true, data: equip };
  }

  /**
   * Update engine hours
   */
  updateEngineHours(equipmentId: UUID, hours: number): OperationResult<Equipment> {
    const equip = this.equipment.get(equipmentId);
    if (!equip) {
      return { success: false, error: 'Equipment not found', errorCode: 'NOT_FOUND' };
    }

    equip.engineHours = hours;
    equip.updatedAt = new Date();

    // Check if maintenance is due
    for (const schedule of equip.maintenanceSchedule) {
      if (schedule.intervalHours && hours >= (schedule.lastPerformed ? hours : 0) + schedule.intervalHours) {
        emit('equipment.maintenance_due', {
          equipmentId: equip.id,
          equipmentNumber: equip.equipmentNumber,
          maintenanceType: schedule.type,
          engineHours: hours,
          nextDue: schedule.nextDue,
        }, { tenantId: equip.tenantId });
      }
    }

    this.equipment.set(equipmentId, equip);
    return { success: true, data: equip };
  }

  // ============================================================================
  // EQUIPMENT ASSIGNMENT
  // ============================================================================

  /**
   * Assign equipment to a work order or operator
   */
  assignEquipment(input: AssignEquipmentInput): OperationResult<EquipmentAssignment> {
    const equip = this.equipment.get(input.equipmentId);
    if (!equip) {
      return { success: false, error: 'Equipment not found', errorCode: 'NOT_FOUND' };
    }

    if (equip.status !== 'available' && equip.status !== 'reserved') {
      return {
        success: false,
        error: `Equipment ${equip.equipmentNumber} is not available (status: ${equip.status})`,
        errorCode: 'EQUIPMENT_NOT_AVAILABLE',
      };
    }

    // Check pre-shift checklist requirement
    if (equip.preShiftChecklistRequired) {
      const today = new Date().toDateString();
      const hasChecklist = Array.from(this.checklists.values()).some(
        c => c.equipmentId === input.equipmentId &&
             c.completedAt.toDateString() === today &&
             c.passed
      );
      if (!hasChecklist && input.assignmentType !== 'reservation') {
        return {
          success: false,
          error: `Pre-shift checklist required for ${equip.equipmentNumber} before assignment`,
          errorCode: 'CHECKLIST_REQUIRED',
        };
      }
    }

    const assignment: EquipmentAssignment = {
      id: uuidv4(),
      equipmentId: input.equipmentId,
      workOrderId: input.workOrderId,
      operatorId: input.operatorId,
      assignmentType: input.assignmentType,
      referenceId: input.referenceId,
      startTime: new Date(),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.assignments.set(assignment.id, assignment);

    // Update equipment status
    equip.status = input.assignmentType === 'reservation' ? 'reserved' : 'in_use';
    equip.currentOperatorId = input.operatorId;
    equip.currentWorkOrderId = input.workOrderId;
    equip.updatedAt = new Date();
    this.equipment.set(equip.id, equip);

    emit('equipment.assigned', {
      assignmentId: assignment.id,
      equipmentId: equip.id,
      equipmentNumber: equip.equipmentNumber,
      type: equip.type,
      assignmentType: input.assignmentType,
      operatorId: input.operatorId,
      workOrderId: input.workOrderId,
    }, { tenantId: equip.tenantId });

    return { success: true, data: assignment };
  }

  /**
   * Release equipment from current assignment
   */
  releaseEquipment(assignmentId: UUID, movesCompleted?: number): OperationResult<EquipmentAssignment> {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) {
      return { success: false, error: 'Assignment not found', errorCode: 'NOT_FOUND' };
    }

    if (assignment.status !== 'active') {
      return {
        success: false,
        error: `Assignment is not active (status: ${assignment.status})`,
        errorCode: 'INVALID_STATUS',
      };
    }

    assignment.endTime = new Date();
    assignment.status = 'completed';
    assignment.movesCompleted = movesCompleted;

    const startMs = assignment.startTime.getTime();
    const endMs = assignment.endTime.getTime();
    assignment.hoursWorked = (endMs - startMs) / (1000 * 60 * 60);
    assignment.updatedAt = new Date();
    this.assignments.set(assignmentId, assignment);

    // Release equipment
    const equip = this.equipment.get(assignment.equipmentId);
    if (equip) {
      equip.status = 'available';
      equip.currentOperatorId = undefined;
      equip.currentWorkOrderId = undefined;
      equip.updatedAt = new Date();
      this.equipment.set(equip.id, equip);

      emit('equipment.released', {
        assignmentId: assignment.id,
        equipmentId: equip.id,
        equipmentNumber: equip.equipmentNumber,
        type: equip.type,
        hoursWorked: assignment.hoursWorked,
        movesCompleted,
      }, { tenantId: equip.tenantId });
    }

    return { success: true, data: assignment };
  }

  /**
   * Get active assignments for equipment
   */
  getActiveAssignments(equipmentId: UUID): EquipmentAssignment[] {
    return Array.from(this.assignments.values()).filter(
      a => a.equipmentId === equipmentId && a.status === 'active'
    );
  }

  /**
   * List assignments
   */
  listAssignments(options: AssignmentQueryOptions = {}): PaginatedResult<EquipmentAssignment> {
    let items = Array.from(this.assignments.values());

    if (options.equipmentId) {
      items = items.filter(a => a.equipmentId === options.equipmentId);
    }
    if (options.operatorId) {
      items = items.filter(a => a.operatorId === options.operatorId);
    }
    if (options.workOrderId) {
      items = items.filter(a => a.workOrderId === options.workOrderId);
    }
    if (options.status) {
      items = items.filter(a => a.status === options.status);
    }
    if (options.activeOnly) {
      items = items.filter(a => a.status === 'active');
    }

    // Sort by start time descending
    items.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    const total = items.length;
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 50;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    items = items.slice(offset, offset + pageSize);

    return {
      data: items,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  // ============================================================================
  // MAINTENANCE MANAGEMENT
  // ============================================================================

  /**
   * Schedule maintenance
   */
  scheduleMaintenance(input: ScheduleMaintenanceInput): OperationResult<MaintenanceRecord> {
    const equip = this.equipment.get(input.equipmentId);
    if (!equip) {
      return { success: false, error: 'Equipment not found', errorCode: 'NOT_FOUND' };
    }

    const record: MaintenanceRecord = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: equip.facilityId,
      equipmentId: input.equipmentId,
      type: input.type,
      maintenanceType: input.maintenanceType,
      status: 'scheduled',
      scheduledDate: input.scheduledDate,
      estimatedDuration: input.estimatedDuration,
      description: input.description,
      performedBy: input.performedBy,
      workOrderNumber: input.workOrderNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.maintenanceRecords.set(record.id, record);

    return { success: true, data: record };
  }

  /**
   * Start maintenance
   */
  startMaintenance(recordId: UUID): OperationResult<MaintenanceRecord> {
    const record = this.maintenanceRecords.get(recordId);
    if (!record) {
      return { success: false, error: 'Maintenance record not found', errorCode: 'NOT_FOUND' };
    }

    if (record.status !== 'scheduled') {
      return {
        success: false,
        error: `Cannot start maintenance from status ${record.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    record.status = 'in_progress';
    record.startedAt = new Date();
    record.updatedAt = new Date();
    this.maintenanceRecords.set(recordId, record);

    // Update equipment status
    const equip = this.equipment.get(record.equipmentId);
    if (equip) {
      equip.status = 'maintenance';
      equip.updatedAt = new Date();
      this.equipment.set(equip.id, equip);

      emit('equipment.maintenance_started', {
        recordId: record.id,
        equipmentId: equip.id,
        equipmentNumber: equip.equipmentNumber,
        type: equip.type,
        maintenanceType: record.maintenanceType,
      }, { tenantId: equip.tenantId });
    }

    return { success: true, data: record };
  }

  /**
   * Complete maintenance
   */
  completeMaintenance(input: CompleteMaintenanceInput): OperationResult<MaintenanceRecord> {
    const record = this.maintenanceRecords.get(input.recordId);
    if (!record) {
      return { success: false, error: 'Maintenance record not found', errorCode: 'NOT_FOUND' };
    }

    if (record.status !== 'in_progress') {
      return {
        success: false,
        error: `Cannot complete maintenance from status ${record.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    record.status = 'completed';
    record.completedAt = new Date();
    record.workPerformed = input.workPerformed;
    record.partsReplaced = input.partsReplaced;
    record.laborCost = input.laborCost;
    record.partsCost = input.partsCost;
    record.totalCost = (input.laborCost ?? 0) + (input.partsCost ?? 0);
    record.vendorInvoice = input.vendorInvoice;

    if (record.startedAt) {
      record.actualDuration = (record.completedAt.getTime() - record.startedAt.getTime()) / (1000 * 60 * 60);
    }

    // Record metrics at service
    const equip = this.equipment.get(record.equipmentId);
    if (equip) {
      record.engineHoursAtService = equip.engineHours;
      record.odometerAtService = equip.odometer;

      // Update equipment
      equip.status = 'available';
      equip.lastServiceDate = record.completedAt;

      // Update maintenance schedule
      const scheduleItem = equip.maintenanceSchedule.find(
        s => s.type === record.maintenanceType
      );
      if (scheduleItem) {
        scheduleItem.lastPerformed = record.completedAt;
        if (scheduleItem.intervalDays) {
          const next = new Date(record.completedAt);
          next.setDate(next.getDate() + scheduleItem.intervalDays);
          scheduleItem.nextDue = next;
        }
        if (scheduleItem.intervalHours) {
          // Will be checked by engine hours update
          scheduleItem.nextDue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // estimated
        }
      }

      equip.updatedAt = new Date();
      this.equipment.set(equip.id, equip);

      emit('equipment.maintenance_completed', {
        recordId: record.id,
        equipmentId: equip.id,
        equipmentNumber: equip.equipmentNumber,
        type: equip.type,
        maintenanceType: record.maintenanceType,
        duration: record.actualDuration,
        totalCost: record.totalCost,
      }, { tenantId: equip.tenantId });
    }

    record.updatedAt = new Date();
    this.maintenanceRecords.set(record.id, record);

    return { success: true, data: record };
  }

  /**
   * List maintenance records
   */
  listMaintenanceRecords(options: MaintenanceQueryOptions = {}): PaginatedResult<MaintenanceRecord> {
    let items = Array.from(this.maintenanceRecords.values());

    if (options.tenantId) {
      items = items.filter(r => r.tenantId === options.tenantId);
    }
    if (options.equipmentId) {
      items = items.filter(r => r.equipmentId === options.equipmentId);
    }
    if (options.status) {
      items = items.filter(r => r.status === options.status);
    }
    if (options.type) {
      items = items.filter(r => r.type === options.type);
    }
    if (options.maintenanceType) {
      items = items.filter(r => r.maintenanceType === options.maintenanceType);
    }

    // Sort by scheduled date descending
    items.sort((a, b) => b.scheduledDate.getTime() - a.scheduledDate.getTime());

    const total = items.length;
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 50;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    items = items.slice(offset, offset + pageSize);

    return {
      data: items,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Get overdue maintenance
   */
  getOverdueMaintenance(tenantId: string): MaintenanceRecord[] {
    const now = new Date();
    return Array.from(this.maintenanceRecords.values()).filter(
      r => r.tenantId === tenantId &&
           r.status === 'scheduled' &&
           r.scheduledDate < now
    );
  }

  // ============================================================================
  // PRE-SHIFT CHECKLIST
  // ============================================================================

  /**
   * Submit a pre-shift checklist
   */
  submitChecklist(input: SubmitChecklistInput): OperationResult<PreShiftChecklist> {
    const equip = this.equipment.get(input.equipmentId);
    if (!equip) {
      return { success: false, error: 'Equipment not found', errorCode: 'NOT_FOUND' };
    }

    const defects = input.items
      .filter(i => i.status === 'defect')
      .map(i => `${i.category}: ${i.item} - ${i.notes ?? 'defect found'}`);

    const passed = defects.length === 0;

    const checklist: PreShiftChecklist = {
      id: uuidv4(),
      equipmentId: input.equipmentId,
      operatorId: input.operatorId,
      shiftDate: input.shiftDate ?? new Date(),
      shiftType: input.shiftType,
      items: input.items,
      passed,
      defectsFound: defects,
      operatorSignature: input.operatorSignature,
      completedAt: new Date(),
    };

    this.checklists.set(checklist.id, checklist);

    // Update equipment
    equip.lastPreTripInspection = checklist.completedAt;
    equip.updatedAt = new Date();
    this.equipment.set(equip.id, equip);

    if (passed) {
      emit('equipment.checklist_completed', {
        checklistId: checklist.id,
        equipmentId: equip.id,
        equipmentNumber: equip.equipmentNumber,
        operatorId: input.operatorId,
        shiftType: input.shiftType,
        passed: true,
      }, { tenantId: equip.tenantId });
    } else {
      emit('equipment.checklist_failed', {
        checklistId: checklist.id,
        equipmentId: equip.id,
        equipmentNumber: equip.equipmentNumber,
        operatorId: input.operatorId,
        shiftType: input.shiftType,
        passed: false,
        defectsCount: defects.length,
        defects,
      }, { tenantId: equip.tenantId });
    }

    return { success: true, data: checklist };
  }

  /**
   * Get standard checklist items for equipment type
   */
  getChecklistTemplate(equipmentType: EquipmentType): string[] {
    return CHECKLIST_ITEMS[equipmentType] ?? [];
  }

  /**
   * Get latest checklist for equipment
   */
  getLatestChecklist(equipmentId: UUID): PreShiftChecklist | undefined {
    const checklists = Array.from(this.checklists.values())
      .filter(c => c.equipmentId === equipmentId)
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
    return checklists[0];
  }

  // ============================================================================
  // TELEMATICS
  // ============================================================================

  /**
   * Update equipment telematics data
   */
  updateTelematics(equipmentId: UUID, data: TelematicsUpdate): OperationResult<Equipment> {
    const equip = this.equipment.get(equipmentId);
    if (!equip) {
      return { success: false, error: 'Equipment not found', errorCode: 'NOT_FOUND' };
    }

    equip.telematics = {
      deviceId: data.deviceId ?? equip.telematics?.deviceId ?? equipmentId,
      lastUpdate: new Date(),
      position: data.position ? { latitude: data.position.lat, longitude: data.position.lng } : undefined,
      positionAccuracy: data.positionAccuracy,
      heading: data.heading,
      speed: data.speed,
      isMoving: data.isMoving ?? (data.speed ? data.speed > 0 : false),
      isEngineOn: data.isEngineOn ?? true,
      fuelLevel: data.fuelLevel,
      batteryLevel: data.batteryLevel,
      fuelConsumption: data.fuelConsumption,
      liftCount24h: data.liftCount24h,
      engineHoursToday: data.engineHoursToday,
      idleTime24h: data.idleTime24h,
      alerts: data.alerts ?? equip.telematics?.alerts ?? [],
    };

    // Update fuel level from telematics
    if (data.fuelLevel !== undefined) {
      equip.currentFuelLevel = data.fuelLevel;
    }
    if (data.batteryLevel !== undefined) {
      equip.currentFuelLevel = data.batteryLevel;
    }

    equip.updatedAt = new Date();
    this.equipment.set(equipmentId, equip);

    emit('equipment.location_updated', {
      equipmentId: equip.id,
      equipmentNumber: equip.equipmentNumber,
      position: data.position,
      speed: data.speed,
      isMoving: equip.telematics!.isMoving,
    }, { tenantId: equip.tenantId });

    // Speed alert
    if (data.speed && data.speed > 25) { // 25 km/h terminal speed limit
      emit('equipment.over_speed', {
        equipmentId: equip.id,
        equipmentNumber: equip.equipmentNumber,
        speed: data.speed,
        limit: 25,
      }, { tenantId: equip.tenantId });
    }

    return { success: true, data: equip };
  }

  // ============================================================================
  // UTILIZATION & STATISTICS
  // ============================================================================

  /**
   * Calculate equipment utilization
   */
  calculateUtilization(equipmentId: UUID, from: Date, to: Date): OperationResult<EquipmentUtilization> {
    const equip = this.equipment.get(equipmentId);
    if (!equip) {
      return { success: false, error: 'Equipment not found', errorCode: 'NOT_FOUND' };
    }

    // Get assignments in period
    const periodAssignments = Array.from(this.assignments.values()).filter(
      a => a.equipmentId === equipmentId &&
           a.startTime >= from &&
           (a.endTime ? a.endTime <= to : true)
    );

    // Get maintenance records in period
    const periodMaintenance = Array.from(this.maintenanceRecords.values()).filter(
      r => r.equipmentId === equipmentId &&
           r.scheduledDate >= from &&
           r.scheduledDate <= to
    );

    const totalHours = (to.getTime() - from.getTime()) / (1000 * 60 * 60);
    const operatingHours = periodAssignments.reduce(
      (sum, a) => sum + (a.hoursWorked ?? 0), 0
    );
    const maintenanceHours = periodMaintenance
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.actualDuration ?? 0), 0);
    const breakdownHours = periodMaintenance
      .filter(r => r.type === 'breakdown' && r.status === 'completed')
      .reduce((sum, r) => sum + (r.actualDuration ?? 0), 0);
    const idleHours = totalHours - operatingHours - maintenanceHours;

    const totalMoves = periodAssignments.reduce(
      (sum, a) => sum + (a.movesCompleted ?? 0), 0
    );

    const utilization: EquipmentUtilization = {
      equipmentId,
      period: { from, to },
      availableHours: totalHours - maintenanceHours,
      operatingHours,
      idleHours: Math.max(0, idleHours),
      maintenanceHours,
      breakdownHours,
      utilizationPercent: totalHours > 0 ? (operatingHours / totalHours) * 100 : 0,
      availabilityPercent: totalHours > 0 ? ((totalHours - maintenanceHours) / totalHours) * 100 : 0,
      movesCompleted: totalMoves,
      movesPerHour: operatingHours > 0 ? totalMoves / operatingHours : 0,
    };

    return { success: true, data: utilization };
  }

  /**
   * Get fleet statistics
   */
  getFleetStats(tenantId: string): EquipmentFleetStats {
    const items = Array.from(this.equipment.values()).filter(
      e => e.tenantId === tenantId
    );

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const equip of items) {
      byType[equip.type] = (byType[equip.type] ?? 0) + 1;
      byStatus[equip.status] = (byStatus[equip.status] ?? 0) + 1;
    }

    const activeAssignments = Array.from(this.assignments.values()).filter(
      a => a.status === 'active' &&
           items.some(e => e.id === a.equipmentId)
    );

    const pendingMaintenance = Array.from(this.maintenanceRecords.values()).filter(
      r => r.tenantId === tenantId && r.status === 'scheduled'
    );

    const overdueMaintenance = this.getOverdueMaintenance(tenantId);

    return {
      totalEquipment: items.length,
      available: byStatus['available'] ?? 0,
      inUse: byStatus['in_use'] ?? 0,
      reserved: byStatus['reserved'] ?? 0,
      maintenance: byStatus['maintenance'] ?? 0,
      breakdown: byStatus['breakdown'] ?? 0,
      charging: byStatus['charging'] ?? 0,
      offline: byStatus['offline'] ?? 0,
      byType,
      activeAssignments: activeAssignments.length,
      pendingMaintenance: pendingMaintenance.length,
      overdueMaintenance: overdueMaintenance.length,
    };
  }
}

// ============================================================================
// SINGLETON ACCESS
// ============================================================================

let equipmentEngineInstance: EquipmentEngine | null = null;

export function getEquipmentEngine(): EquipmentEngine {
  if (!equipmentEngineInstance) {
    equipmentEngineInstance = EquipmentEngine.getInstance();
  }
  return equipmentEngineInstance;
}

export function setEquipmentEngine(engine: EquipmentEngine): void {
  equipmentEngineInstance = engine;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface RegisterEquipmentInput {
  tenantId: string;
  facilityId: UUID;
  equipmentNumber: string;
  type: EquipmentType;

  // Details
  make: string;
  model: string;
  yearOfManufacture: number;
  serialNumber?: string;
  registrationNumber?: string;

  // Capabilities
  liftCapacity: number;
  maxReach?: number;
  maxStack?: number;
  maxLiftHeight?: number;
  spreaderType?: '20' | '40' | 'twin-20' | 'tandem' | 'telescopic';
  canHandleReefer?: boolean;
  canHandleHazmat?: boolean;
  canHandleOOG?: boolean;

  // Power
  fuelType: FuelType;
  fuelCapacity?: number;

  // Options
  preShiftChecklistRequired?: boolean;
}

export interface EquipmentQueryOptions {
  tenantId?: string;
  facilityId?: UUID;
  type?: EquipmentType;
  types?: EquipmentType[];
  status?: EquipmentStatus;
  statuses?: EquipmentStatus[];
  availableOnly?: boolean;
  canHandleReefer?: boolean;
  canHandleHazmat?: boolean;
  canHandleOOG?: boolean;
  minLiftCapacity?: number;
  zoneId?: UUID;
  page?: number;
  pageSize?: number;
}

export interface AssignEquipmentInput {
  equipmentId: UUID;
  workOrderId?: UUID;
  operatorId?: UUID;
  assignmentType: 'work_order' | 'zone' | 'operator' | 'reservation';
  referenceId?: UUID;
}

export interface AssignmentQueryOptions {
  equipmentId?: UUID;
  operatorId?: UUID;
  workOrderId?: UUID;
  status?: 'active' | 'completed' | 'cancelled';
  activeOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ScheduleMaintenanceInput {
  tenantId: string;
  equipmentId: UUID;
  type: 'preventive' | 'corrective' | 'breakdown' | 'inspection';
  maintenanceType: MaintenanceType;
  scheduledDate: Date;
  estimatedDuration?: number;
  description: string;
  performedBy?: string;
  workOrderNumber?: string;
}

export interface CompleteMaintenanceInput {
  recordId: UUID;
  workPerformed?: string;
  partsReplaced?: { partNumber: string; partName: string; quantity: number; unitCost: number }[];
  laborCost?: number;
  partsCost?: number;
  vendorInvoice?: string;
}

export interface MaintenanceQueryOptions {
  tenantId?: string;
  equipmentId?: UUID;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  type?: 'preventive' | 'corrective' | 'breakdown' | 'inspection';
  maintenanceType?: MaintenanceType;
  page?: number;
  pageSize?: number;
}

export interface SubmitChecklistInput {
  equipmentId: UUID;
  operatorId: UUID;
  shiftDate?: Date;
  shiftType: 'morning' | 'afternoon' | 'night';
  items: ChecklistItem[];
  operatorSignature?: string;
}

export interface TelematicsUpdate {
  deviceId?: string;
  position?: { lat: number; lng: number };
  positionAccuracy?: number;
  heading?: number;
  speed?: number;
  isMoving?: boolean;
  isEngineOn?: boolean;
  fuelLevel?: number;
  batteryLevel?: number;
  fuelConsumption?: number;
  liftCount24h?: number;
  engineHoursToday?: number;
  idleTime24h?: number;
  alerts?: any[];
}

export interface EquipmentFleetStats {
  totalEquipment: number;
  available: number;
  inUse: number;
  reserved: number;
  maintenance: number;
  breakdown: number;
  charging: number;
  offline: number;
  byType: Record<string, number>;
  activeAssignments: number;
  pendingMaintenance: number;
  overdueMaintenance: number;
}
