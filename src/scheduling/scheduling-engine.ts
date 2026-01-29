// Scheduling & Yard Operations Engine for ankrICD
// Dock scheduling, trailer/chassis management, empty container ops, stacking optimization

import { v4 as uuidv4 } from 'uuid';
import type { UUID, OperationResult } from '../types/common';
import type {
  DockSlot,
  DockSlotStatus,
  DockAppointment,
  DockAppointmentStatus,
  AppointmentPurpose,
  Trailer,
  TrailerStatus,
  TrailerType,
  EmptyContainer,
  EmptyContainerStatus,
  EmptyAllotment,
  StackingRule,
  StackingRecommendation,
  SegregationCategory,
  StackingStrategy,
  SchedulingStats,
} from '../types/scheduling';
import { emit } from '../core';

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface RegisterDockSlotInput {
  tenantId: string;
  facilityId: string;
  gateId: UUID;
  slotNumber: string;
  slotType: 'inbound' | 'outbound' | 'dual';
  operatingHoursStart: string;
  operatingHoursEnd: string;
  slotDurationMinutes: number;
  maxTrucksPerSlot: number;
  hasWeighbridge?: boolean;
  hasOCR?: boolean;
  notes?: string;
}

export interface CreateDockAppointmentInput {
  tenantId: string;
  facilityId: string;
  slotId: UUID;
  purpose: AppointmentPurpose;
  scheduledDate: Date;
  scheduledTimeStart: string;
  scheduledTimeEnd: string;
  truckNumber: string;
  driverName: string;
  driverPhone: string;
  driverLicense?: string;
  transporterId?: UUID;
  transporterName?: string;
  containerNumbers: string[];
  purpose_details?: string;
  cargoDescription?: string;
  estimatedWeight?: number;
}

export interface RegisterTrailerInput {
  tenantId: string;
  facilityId: string;
  trailerNumber: string;
  trailerType: TrailerType;
  owner: string;
  ownerType: 'icd' | 'shipping_line' | 'transporter';
  maxPayload: number;
  tareWeight: number;
  length: number;
  width: number;
  currentLocation?: string;
  parkingSlot?: string;
  lastInspectionDate?: Date;
  nextInspectionDue?: Date;
  notes?: string;
}

export interface ReceiveEmptyInput {
  tenantId: string;
  facilityId: string;
  containerNumber: string;
  isoType: string;
  shippingLine: string;
  receivedFrom: string;
  depotLocation?: string;
  yardSlot?: string;
  isReefer?: boolean;
  damages?: string[];
}

export interface CreateAllotmentInput {
  tenantId: string;
  facilityId: string;
  shippingLine: string;
  requestedBy: string;
  containerType: string;
  quantityRequested: number;
  expiryDate?: Date;
  notes?: string;
}

export interface AddStackingRuleInput {
  tenantId: string;
  facilityId: string;
  name: string;
  priority: number;
  ruleType: 'segregation' | 'weight' | 'departure' | 'shipping_line' | 'custom';
  conditions: {
    category?: SegregationCategory;
    maxStackHeight?: number;
    allowMixedCategories?: boolean;
    preferredBlocks?: string[];
    heavyOnBottom?: boolean;
    departureWindowHours?: number;
  };
}

// ============================================================================
// SCHEDULING ENGINE
// ============================================================================

export class SchedulingEngine {
  private static instance: SchedulingEngine | null = null;

  // Primary stores
  private dockSlots: Map<UUID, DockSlot> = new Map();
  private appointments: Map<UUID, DockAppointment> = new Map();
  private trailers: Map<UUID, Trailer> = new Map();
  private emptyContainers: Map<UUID, EmptyContainer> = new Map();
  private allotments: Map<UUID, EmptyAllotment> = new Map();
  private stackingRules: Map<UUID, StackingRule> = new Map();

  // Indexes
  private appointmentByNumber: Map<string, UUID> = new Map();
  private trailerByNumber: Map<string, UUID> = new Map();
  private slotsByFacility: Map<string, Set<UUID>> = new Map();
  private appointmentsByFacility: Map<string, Set<UUID>> = new Map();
  private allotmentsByTenant: Map<string, Set<UUID>> = new Map();

  // Sequential counters
  private appointmentCounter = 0;
  private trailerCounter = 0;
  private allotmentCounter = 0;
  private stackingRuleCounter = 0;

  private constructor() {}

  static getInstance(): SchedulingEngine {
    if (!SchedulingEngine.instance) {
      SchedulingEngine.instance = new SchedulingEngine();
    }
    return SchedulingEngine.instance;
  }

  static resetInstance(): void {
    SchedulingEngine.instance = null;
  }

  // ============================================================================
  // DOCK SLOT MANAGEMENT
  // ============================================================================

  registerDockSlot(input: RegisterDockSlotInput): OperationResult<DockSlot> {
    // Check for duplicate slot number within same gate
    for (const slot of this.dockSlots.values()) {
      if (slot.gateId === input.gateId && slot.slotNumber === input.slotNumber) {
        return { success: false, error: 'Slot number already exists for this gate', errorCode: 'DUPLICATE_SLOT' };
      }
    }

    const now = new Date();
    const slot: DockSlot = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      gateId: input.gateId,
      slotNumber: input.slotNumber,
      slotType: input.slotType,
      status: 'available',
      operatingHoursStart: input.operatingHoursStart,
      operatingHoursEnd: input.operatingHoursEnd,
      slotDurationMinutes: input.slotDurationMinutes,
      maxTrucksPerSlot: input.maxTrucksPerSlot,
      hasWeighbridge: input.hasWeighbridge ?? false,
      hasOCR: input.hasOCR ?? false,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    this.dockSlots.set(slot.id, slot);

    if (!this.slotsByFacility.has(input.facilityId)) {
      this.slotsByFacility.set(input.facilityId, new Set());
    }
    this.slotsByFacility.get(input.facilityId)!.add(slot.id);

    return { success: true, data: slot };
  }

  getDockSlot(id: UUID): DockSlot | undefined {
    return this.dockSlots.get(id);
  }

  listDockSlots(facilityId: string, gateId?: string): DockSlot[] {
    const slotIds = this.slotsByFacility.get(facilityId);
    if (!slotIds) return [];

    let slots = Array.from(slotIds)
      .map(id => this.dockSlots.get(id)!)
      .filter(Boolean);

    if (gateId) {
      slots = slots.filter(s => s.gateId === gateId);
    }

    return slots;
  }

  updateDockSlotStatus(id: UUID, status: DockSlotStatus): OperationResult<DockSlot> {
    const slot = this.dockSlots.get(id);
    if (!slot) return { success: false, error: 'Dock slot not found', errorCode: 'NOT_FOUND' };

    slot.status = status;
    slot.updatedAt = new Date();

    return { success: true, data: slot };
  }

  getAvailableSlots(facilityId: string, _date: Date, purpose: AppointmentPurpose): DockSlot[] {
    const allSlots = this.listDockSlots(facilityId);

    return allSlots.filter(slot => {
      if (slot.status !== 'available') return false;

      // Filter by slot type and purpose compatibility
      if (purpose === 'delivery_import' || purpose === 'empty_return') {
        return slot.slotType === 'inbound' || slot.slotType === 'dual';
      }
      if (purpose === 'pickup_export' || purpose === 'empty_pickup') {
        return slot.slotType === 'outbound' || slot.slotType === 'dual';
      }
      // For other purposes (stuffing, destuffing, survey, customs_exam), any dual slot works
      return slot.slotType === 'dual';
    });
  }

  // ============================================================================
  // DOCK APPOINTMENTS
  // ============================================================================

  createAppointment(input: CreateDockAppointmentInput): OperationResult<DockAppointment> {
    // Validate slot exists
    const slot = this.dockSlots.get(input.slotId);
    if (!slot) return { success: false, error: 'Dock slot not found', errorCode: 'SLOT_NOT_FOUND' };

    if (slot.status === 'blocked' || slot.status === 'maintenance') {
      return { success: false, error: 'Dock slot is not available', errorCode: 'SLOT_UNAVAILABLE' };
    }

    // Check for time conflicts on the same slot and date
    const conflict = this.findTimeConflict(
      input.slotId,
      input.scheduledDate,
      input.scheduledTimeStart,
      input.scheduledTimeEnd,
    );
    if (conflict) {
      return {
        success: false,
        error: `Time conflict with appointment ${conflict.appointmentNumber}`,
        errorCode: 'TIME_CONFLICT',
      };
    }

    const now = new Date();
    this.appointmentCounter++;
    const appointmentNumber = `APT-${String(this.appointmentCounter).padStart(3, '0')}`;

    const appointment: DockAppointment = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      appointmentNumber,
      slotId: input.slotId,
      purpose: input.purpose,
      status: 'requested',
      scheduledDate: input.scheduledDate,
      scheduledTimeStart: input.scheduledTimeStart,
      scheduledTimeEnd: input.scheduledTimeEnd,

      truckNumber: input.truckNumber,
      driverName: input.driverName,
      driverPhone: input.driverPhone,
      driverLicense: input.driverLicense,
      transporterId: input.transporterId,
      transporterName: input.transporterName,

      containerNumbers: input.containerNumbers,
      purpose_details: input.purpose_details,
      cargoDescription: input.cargoDescription,
      estimatedWeight: input.estimatedWeight,

      smsNotified: false,
      reminderSent: false,

      createdAt: now,
      updatedAt: now,
    };

    this.appointments.set(appointment.id, appointment);
    this.appointmentByNumber.set(appointmentNumber, appointment.id);

    if (!this.appointmentsByFacility.has(input.facilityId)) {
      this.appointmentsByFacility.set(input.facilityId, new Set());
    }
    this.appointmentsByFacility.get(input.facilityId)!.add(appointment.id);

    emit('scheduling.appointment_created', {
      appointmentId: appointment.id,
      appointmentNumber,
      slotId: input.slotId,
      purpose: input.purpose,
      scheduledDate: input.scheduledDate,
    }, { tenantId: input.tenantId });

    return { success: true, data: appointment };
  }

  getAppointment(id: UUID): DockAppointment | undefined {
    return this.appointments.get(id);
  }

  getAppointmentByNumber(num: string): DockAppointment | undefined {
    const id = this.appointmentByNumber.get(num);
    return id ? this.appointments.get(id) : undefined;
  }

  listAppointments(facilityId: string, date?: Date, status?: DockAppointmentStatus): DockAppointment[] {
    const ids = this.appointmentsByFacility.get(facilityId);
    if (!ids) return [];

    let appointments = Array.from(ids)
      .map(id => this.appointments.get(id)!)
      .filter(Boolean);

    if (date) {
      const dateStr = date.toISOString().slice(0, 10);
      appointments = appointments.filter(a => a.scheduledDate.toISOString().slice(0, 10) === dateStr);
    }

    if (status) {
      appointments = appointments.filter(a => a.status === status);
    }

    return appointments;
  }

  confirmAppointment(id: UUID): OperationResult<DockAppointment> {
    const appointment = this.appointments.get(id);
    if (!appointment) return { success: false, error: 'Appointment not found', errorCode: 'NOT_FOUND' };

    if (appointment.status !== 'requested') {
      return { success: false, error: 'Appointment can only be confirmed from requested status', errorCode: 'INVALID_STATUS' };
    }

    appointment.status = 'confirmed';
    appointment.updatedAt = new Date();

    emit('scheduling.appointment_confirmed', {
      appointmentId: appointment.id,
      appointmentNumber: appointment.appointmentNumber,
    }, { tenantId: appointment.tenantId });

    return { success: true, data: appointment };
  }

  checkInAppointment(id: UUID): OperationResult<DockAppointment> {
    const appointment = this.appointments.get(id);
    if (!appointment) return { success: false, error: 'Appointment not found', errorCode: 'NOT_FOUND' };

    if (appointment.status !== 'confirmed' && appointment.status !== 'requested') {
      return { success: false, error: 'Appointment must be confirmed or requested to check in', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    appointment.status = 'checked_in';
    appointment.actualArrivalTime = now;
    appointment.updatedAt = now;

    // Calculate wait time: difference between scheduled start and actual arrival
    const scheduledParts = appointment.scheduledTimeStart.split(':');
    const scheduledHours = parseInt(scheduledParts[0] ?? '0', 10);
    const scheduledMins = parseInt(scheduledParts[1] ?? '0', 10);
    const scheduledStart = new Date(appointment.scheduledDate);
    scheduledStart.setHours(scheduledHours, scheduledMins, 0, 0);

    if (now.getTime() > scheduledStart.getTime()) {
      appointment.waitTimeMinutes = Math.round((now.getTime() - scheduledStart.getTime()) / 60000);
    } else {
      appointment.waitTimeMinutes = 0;
    }

    return { success: true, data: appointment };
  }

  completeAppointment(id: UUID): OperationResult<DockAppointment> {
    const appointment = this.appointments.get(id);
    if (!appointment) return { success: false, error: 'Appointment not found', errorCode: 'NOT_FOUND' };

    if (appointment.status !== 'checked_in' && appointment.status !== 'in_progress') {
      return { success: false, error: 'Appointment must be checked in or in progress to complete', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    appointment.status = 'completed';
    appointment.actualEndTime = now;
    appointment.updatedAt = now;

    // Calculate turnaround time from actual arrival to completion
    if (appointment.actualArrivalTime) {
      appointment.turnaroundMinutes = Math.round(
        (now.getTime() - appointment.actualArrivalTime.getTime()) / 60000
      );
    }

    emit('scheduling.appointment_completed', {
      appointmentId: appointment.id,
      appointmentNumber: appointment.appointmentNumber,
      turnaroundMinutes: appointment.turnaroundMinutes,
    }, { tenantId: appointment.tenantId });

    return { success: true, data: appointment };
  }

  cancelAppointment(id: UUID, reason: string, cancelledBy: string): OperationResult<DockAppointment> {
    const appointment = this.appointments.get(id);
    if (!appointment) return { success: false, error: 'Appointment not found', errorCode: 'NOT_FOUND' };

    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return { success: false, error: 'Cannot cancel a completed or already cancelled appointment', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    appointment.status = 'cancelled';
    appointment.cancelReason = reason;
    appointment.cancelledBy = cancelledBy;
    appointment.cancelledAt = now;
    appointment.updatedAt = now;

    emit('scheduling.appointment_cancelled', {
      appointmentId: appointment.id,
      appointmentNumber: appointment.appointmentNumber,
      reason,
      cancelledBy,
    }, { tenantId: appointment.tenantId });

    return { success: true, data: appointment };
  }

  rescheduleAppointment(
    id: UUID,
    newDate: Date,
    newSlotId: UUID,
    reason: string,
    by: string,
  ): OperationResult<DockAppointment> {
    const appointment = this.appointments.get(id);
    if (!appointment) return { success: false, error: 'Appointment not found', errorCode: 'NOT_FOUND' };

    if (appointment.status === 'completed' || appointment.status === 'cancelled' || appointment.status === 'no_show') {
      return { success: false, error: 'Cannot reschedule a completed, cancelled, or no-show appointment', errorCode: 'INVALID_STATUS' };
    }

    const newSlot = this.dockSlots.get(newSlotId);
    if (!newSlot) return { success: false, error: 'New dock slot not found', errorCode: 'SLOT_NOT_FOUND' };

    // Check for time conflicts on the new slot
    const conflict = this.findTimeConflict(
      newSlotId,
      newDate,
      appointment.scheduledTimeStart,
      appointment.scheduledTimeEnd,
      appointment.id,
    );
    if (conflict) {
      return {
        success: false,
        error: `Time conflict with appointment ${conflict.appointmentNumber} on new slot`,
        errorCode: 'TIME_CONFLICT',
      };
    }

    const now = new Date();
    appointment.originalDate = appointment.originalDate ?? appointment.scheduledDate;
    appointment.originalSlotId = appointment.originalSlotId ?? appointment.slotId;
    appointment.scheduledDate = newDate;
    appointment.slotId = newSlotId;
    appointment.status = 'rescheduled';
    appointment.rescheduleReason = reason;
    appointment.rescheduledBy = by;
    appointment.updatedAt = now;

    return { success: true, data: appointment };
  }

  markNoShow(id: UUID): OperationResult<DockAppointment> {
    const appointment = this.appointments.get(id);
    if (!appointment) return { success: false, error: 'Appointment not found', errorCode: 'NOT_FOUND' };

    if (appointment.status === 'completed' || appointment.status === 'cancelled' || appointment.status === 'no_show') {
      return { success: false, error: 'Cannot mark no-show for completed, cancelled, or already no-show appointment', errorCode: 'INVALID_STATUS' };
    }

    appointment.status = 'no_show';
    appointment.updatedAt = new Date();

    emit('scheduling.appointment_no_show', {
      appointmentId: appointment.id,
      appointmentNumber: appointment.appointmentNumber,
      scheduledDate: appointment.scheduledDate,
    }, { tenantId: appointment.tenantId });

    return { success: true, data: appointment };
  }

  // ============================================================================
  // TRAILER & CHASSIS MANAGEMENT
  // ============================================================================

  registerTrailer(input: RegisterTrailerInput): OperationResult<Trailer> {
    // Check for duplicate trailer number
    if (this.trailerByNumber.has(input.trailerNumber)) {
      return { success: false, error: 'Trailer number already exists', errorCode: 'DUPLICATE_TRAILER' };
    }

    const now = new Date();
    this.trailerCounter++;

    const inspectionStatus = this.computeInspectionStatus(input.lastInspectionDate, input.nextInspectionDue);

    const trailer: Trailer = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      trailerNumber: input.trailerNumber,
      trailerType: input.trailerType,
      status: 'available',
      owner: input.owner,
      ownerType: input.ownerType,
      maxPayload: input.maxPayload,
      tareWeight: input.tareWeight,
      length: input.length,
      width: input.width,
      currentLocation: input.currentLocation,
      parkingSlot: input.parkingSlot,
      lastInspectionDate: input.lastInspectionDate,
      nextInspectionDue: input.nextInspectionDue,
      inspectionStatus,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    this.trailers.set(trailer.id, trailer);
    this.trailerByNumber.set(trailer.trailerNumber, trailer.id);

    return { success: true, data: trailer };
  }

  getTrailer(id: UUID): Trailer | undefined {
    return this.trailers.get(id);
  }

  getTrailerByNumber(num: string): Trailer | undefined {
    const id = this.trailerByNumber.get(num);
    return id ? this.trailers.get(id) : undefined;
  }

  listTrailers(tenantId: string, status?: TrailerStatus, type?: TrailerType): Trailer[] {
    let trailers = Array.from(this.trailers.values()).filter(t => t.tenantId === tenantId);
    if (status) trailers = trailers.filter(t => t.status === status);
    if (type) trailers = trailers.filter(t => t.trailerType === type);
    return trailers;
  }

  assignTrailer(id: UUID, containerId: UUID, truckNumber: string): OperationResult<Trailer> {
    const trailer = this.trailers.get(id);
    if (!trailer) return { success: false, error: 'Trailer not found', errorCode: 'NOT_FOUND' };

    if (trailer.status !== 'available' && trailer.status !== 'parked') {
      return { success: false, error: 'Trailer is not available for assignment', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    trailer.status = 'in_use';
    trailer.assignedContainerId = containerId;
    trailer.assignedTruckNumber = truckNumber;
    trailer.assignedAt = now;
    trailer.updatedAt = now;

    emit('scheduling.trailer_assigned', {
      trailerId: trailer.id,
      trailerNumber: trailer.trailerNumber,
      containerId,
      truckNumber,
    }, { tenantId: trailer.tenantId });

    return { success: true, data: trailer };
  }

  releaseTrailer(id: UUID): OperationResult<Trailer> {
    const trailer = this.trailers.get(id);
    if (!trailer) return { success: false, error: 'Trailer not found', errorCode: 'NOT_FOUND' };

    if (trailer.status !== 'in_use') {
      return { success: false, error: 'Trailer is not currently in use', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    trailer.status = 'available';
    trailer.assignedContainerId = undefined;
    trailer.assignedTruckNumber = undefined;
    trailer.assignedAt = undefined;
    trailer.updatedAt = now;

    emit('scheduling.trailer_released', {
      trailerId: trailer.id,
      trailerNumber: trailer.trailerNumber,
    }, { tenantId: trailer.tenantId });

    return { success: true, data: trailer };
  }

  parkTrailer(id: UUID, parkingSlot: string): OperationResult<Trailer> {
    const trailer = this.trailers.get(id);
    if (!trailer) return { success: false, error: 'Trailer not found', errorCode: 'NOT_FOUND' };

    if (trailer.status === 'retired' || trailer.status === 'damaged') {
      return { success: false, error: 'Cannot park a retired or damaged trailer', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    trailer.status = 'parked';
    trailer.parkingSlot = parkingSlot;
    trailer.currentLocation = parkingSlot;
    trailer.updatedAt = now;

    return { success: true, data: trailer };
  }

  updateTrailerStatus(id: UUID, status: TrailerStatus): OperationResult<Trailer> {
    const trailer = this.trailers.get(id);
    if (!trailer) return { success: false, error: 'Trailer not found', errorCode: 'NOT_FOUND' };

    trailer.status = status;
    trailer.updatedAt = new Date();

    return { success: true, data: trailer };
  }

  // ============================================================================
  // EMPTY CONTAINER MANAGEMENT
  // ============================================================================

  receiveEmptyContainer(input: ReceiveEmptyInput): OperationResult<EmptyContainer> {
    const now = new Date();

    const container: EmptyContainer = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      containerNumber: input.containerNumber,
      isoType: input.isoType,
      shippingLine: input.shippingLine,
      status: 'in_depot',
      depotLocation: input.depotLocation,
      yardSlot: input.yardSlot,
      receivedDate: now,
      receivedFrom: input.receivedFrom,
      damages: input.damages,
      isReefer: input.isReefer ?? false,
      createdAt: now,
      updatedAt: now,
    };

    this.emptyContainers.set(container.id, container);

    emit('scheduling.empty_received', {
      containerId: container.id,
      containerNumber: container.containerNumber,
      shippingLine: container.shippingLine,
    }, { tenantId: input.tenantId });

    return { success: true, data: container };
  }

  getEmptyContainer(id: UUID): EmptyContainer | undefined {
    return this.emptyContainers.get(id);
  }

  listEmptyContainers(tenantId: string, status?: EmptyContainerStatus, shippingLine?: string): EmptyContainer[] {
    let containers = Array.from(this.emptyContainers.values()).filter(c => c.tenantId === tenantId);
    if (status) containers = containers.filter(c => c.status === status);
    if (shippingLine) containers = containers.filter(c => c.shippingLine === shippingLine);
    return containers;
  }

  recordSurveyResult(id: UUID, result: 'pass' | 'fail', remarks?: string): OperationResult<EmptyContainer> {
    const container = this.emptyContainers.get(id);
    if (!container) return { success: false, error: 'Empty container not found', errorCode: 'NOT_FOUND' };

    if (container.status !== 'in_depot' && container.status !== 'survey_pending') {
      return { success: false, error: 'Container is not pending survey', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    container.surveyDate = now;
    container.surveyResult = result;
    container.surveyRemarks = remarks;
    container.status = result === 'pass' ? 'survey_passed' : 'survey_failed';
    container.updatedAt = now;

    return { success: true, data: container };
  }

  recordPTIResult(
    id: UUID,
    result: 'pass' | 'fail',
    temperature?: number,
    remarks?: string,
  ): OperationResult<EmptyContainer> {
    const container = this.emptyContainers.get(id);
    if (!container) return { success: false, error: 'Empty container not found', errorCode: 'NOT_FOUND' };

    if (!container.isReefer) {
      return { success: false, error: 'PTI only applicable to reefer containers', errorCode: 'NOT_REEFER' };
    }

    const now = new Date();
    container.ptiDate = now;
    container.ptiResult = result;
    container.ptiRemarks = remarks;
    if (temperature !== undefined) {
      container.setTemperature = temperature;
    }
    container.updatedAt = now;

    return { success: true, data: container };
  }

  createAllotment(input: CreateAllotmentInput): OperationResult<EmptyAllotment> {
    const now = new Date();
    this.allotmentCounter++;
    const allotmentNumber = `ALT-${String(this.allotmentCounter).padStart(3, '0')}`;

    const allotment: EmptyAllotment = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      allotmentNumber,
      status: 'requested',
      shippingLine: input.shippingLine,
      requestedBy: input.requestedBy,
      requestedDate: now,
      containerType: input.containerType,
      quantityRequested: input.quantityRequested,
      quantityAllotted: 0,
      quantityPickedUp: 0,
      expiryDate: input.expiryDate,
      containerIds: [],
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    this.allotments.set(allotment.id, allotment);

    if (!this.allotmentsByTenant.has(input.tenantId)) {
      this.allotmentsByTenant.set(input.tenantId, new Set());
    }
    this.allotmentsByTenant.get(input.tenantId)!.add(allotment.id);

    emit('scheduling.empty_allotted', {
      allotmentId: allotment.id,
      allotmentNumber,
      shippingLine: input.shippingLine,
      quantityRequested: input.quantityRequested,
    }, { tenantId: input.tenantId });

    return { success: true, data: allotment };
  }

  approveAllotment(id: UUID, approvedBy: string): OperationResult<EmptyAllotment> {
    const allotment = this.allotments.get(id);
    if (!allotment) return { success: false, error: 'Allotment not found', errorCode: 'NOT_FOUND' };

    if (allotment.status !== 'requested') {
      return { success: false, error: 'Allotment can only be approved from requested status', errorCode: 'INVALID_STATUS' };
    }

    // Find available empty containers matching the shipping line and container type
    const availableContainers = Array.from(this.emptyContainers.values()).filter(c =>
      c.tenantId === allotment.tenantId &&
      c.shippingLine === allotment.shippingLine &&
      (c.status === 'in_depot' || c.status === 'survey_passed') &&
      c.isoType === allotment.containerType
    );

    const toAllot = availableContainers.slice(0, allotment.quantityRequested);

    const now = new Date();
    allotment.status = 'approved';
    allotment.approvedBy = approvedBy;
    allotment.approvedDate = now;
    allotment.quantityAllotted = toAllot.length;
    allotment.containerIds = toAllot.map(c => c.id);
    allotment.updatedAt = now;

    // Update container statuses
    for (const container of toAllot) {
      container.status = 'allotted';
      container.allotmentId = allotment.id;
      container.allottedTo = allotment.requestedBy;
      container.allottedDate = now;
      container.updatedAt = now;
    }

    return { success: true, data: allotment };
  }

  recordPickup(allotmentId: UUID, containerNumber: string): OperationResult<EmptyAllotment> {
    const allotment = this.allotments.get(allotmentId);
    if (!allotment) return { success: false, error: 'Allotment not found', errorCode: 'NOT_FOUND' };

    if (allotment.status !== 'approved' && allotment.status !== 'allotted') {
      return { success: false, error: 'Allotment is not in approved or allotted status', errorCode: 'INVALID_STATUS' };
    }

    // Find the container by number within the allotment
    const container = Array.from(this.emptyContainers.values()).find(
      c => c.containerNumber === containerNumber && allotment.containerIds.includes(c.id)
    );

    if (!container) {
      return { success: false, error: 'Container not found in this allotment', errorCode: 'CONTAINER_NOT_FOUND' };
    }

    const now = new Date();
    container.status = 'picked_up';
    container.releaseDate = now;
    container.releasedTo = allotment.requestedBy;
    container.updatedAt = now;

    allotment.quantityPickedUp++;
    allotment.status = 'allotted';
    allotment.updatedAt = now;

    // If all containers picked up, mark allotment as picked_up
    if (allotment.quantityPickedUp >= allotment.quantityAllotted) {
      allotment.status = 'picked_up';
    }

    emit('scheduling.empty_released', {
      allotmentId: allotment.id,
      containerNumber,
      containerId: container.id,
    }, { tenantId: allotment.tenantId });

    return { success: true, data: allotment };
  }

  getEmptyContainerStats(tenantId: string): {
    totalInDepot: number;
    pendingSurvey: number;
    allotted: number;
    byShippingLine: Record<string, number>;
  } {
    const containers = Array.from(this.emptyContainers.values()).filter(c => c.tenantId === tenantId);

    const byShippingLine: Record<string, number> = {};
    for (const c of containers) {
      if (c.status !== 'picked_up' && c.status !== 'released') {
        byShippingLine[c.shippingLine] = (byShippingLine[c.shippingLine] || 0) + 1;
      }
    }

    return {
      totalInDepot: containers.filter(c => c.status === 'in_depot' || c.status === 'survey_passed' || c.status === 'survey_pending').length,
      pendingSurvey: containers.filter(c => c.status === 'in_depot' || c.status === 'survey_pending').length,
      allotted: containers.filter(c => c.status === 'allotted').length,
      byShippingLine,
    };
  }

  // ============================================================================
  // STACKING RULES
  // ============================================================================

  addStackingRule(input: AddStackingRuleInput): OperationResult<StackingRule> {
    const now = new Date();
    this.stackingRuleCounter++;

    const rule: StackingRule = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      name: input.name,
      priority: input.priority,
      enabled: true,
      ruleType: input.ruleType,
      conditions: input.conditions,
      createdAt: now,
      updatedAt: now,
    };

    this.stackingRules.set(rule.id, rule);

    emit('scheduling.stacking_rule_added', {
      ruleId: rule.id,
      name: rule.name,
      ruleType: rule.ruleType,
      priority: rule.priority,
    }, { tenantId: input.tenantId });

    return { success: true, data: rule };
  }

  getStackingRule(id: UUID): StackingRule | undefined {
    return this.stackingRules.get(id);
  }

  listStackingRules(tenantId: string, enabled?: boolean): StackingRule[] {
    let rules = Array.from(this.stackingRules.values()).filter(r => r.tenantId === tenantId);
    if (enabled !== undefined) rules = rules.filter(r => r.enabled === enabled);
    return rules.sort((a, b) => b.priority - a.priority);
  }

  toggleStackingRule(id: UUID, enabled: boolean): OperationResult<StackingRule> {
    const rule = this.stackingRules.get(id);
    if (!rule) return { success: false, error: 'Stacking rule not found', errorCode: 'NOT_FOUND' };

    rule.enabled = enabled;
    rule.updatedAt = new Date();

    return { success: true, data: rule };
  }

  getStackingRecommendation(
    containerId: UUID,
    containerNumber: string,
    category: SegregationCategory,
    weight: number,
    departureDate?: Date,
  ): StackingRecommendation {
    // Collect all enabled rules, sorted by priority descending
    const activeRules = Array.from(this.stackingRules.values())
      .filter(r => r.enabled)
      .sort((a, b) => b.priority - a.priority);

    const reasons: string[] = [];
    let recommendedBlock = 'A';
    let recommendedBay = '01';
    let recommendedRow = 'A';
    let recommendedTier = 1;
    let score = 50; // Base score
    let strategy: StackingStrategy = 'balanced';
    let rehandlesNeeded = 0;

    for (const rule of activeRules) {
      switch (rule.ruleType) {
        case 'segregation': {
          if (rule.conditions.category === category) {
            const preferred = rule.conditions.preferredBlocks;
            if (preferred && preferred.length > 0 && preferred[0] !== undefined) {
              recommendedBlock = preferred[0];
              reasons.push(`Segregation rule: ${category} containers go to block ${recommendedBlock}`);
              score += 15;
            }
            if (!rule.conditions.allowMixedCategories) {
              reasons.push(`No mixed categories allowed in this block`);
              score += 5;
            }
          }
          strategy = 'segregation_based';
          break;
        }

        case 'weight': {
          if (rule.conditions.heavyOnBottom && weight > 20000) {
            recommendedTier = 1;
            reasons.push('Heavy container placed on bottom tier (weight-based rule)');
            score += 10;
          } else if (weight <= 10000) {
            recommendedTier = Math.min(rule.conditions.maxStackHeight ?? 4, 3);
            reasons.push('Light container placed on upper tier');
            score += 5;
          } else {
            recommendedTier = 2;
            reasons.push('Medium-weight container placed on middle tier');
            score += 5;
          }
          strategy = 'weight_based';
          break;
        }

        case 'departure': {
          if (departureDate && rule.conditions.departureWindowHours) {
            const hoursUntilDeparture = (departureDate.getTime() - Date.now()) / 3600000;
            if (hoursUntilDeparture <= rule.conditions.departureWindowHours) {
              // Near departure: place on top/easily accessible
              recommendedTier = Math.min(rule.conditions.maxStackHeight ?? 4, 4);
              reasons.push(`Near departure (${Math.round(hoursUntilDeparture)}h): placed on top for easy retrieval`);
              score += 20;
              rehandlesNeeded = 0;
            } else {
              // Far from departure: can be placed lower
              recommendedTier = 1;
              reasons.push(`Departure in ${Math.round(hoursUntilDeparture)}h: can be stacked lower`);
              score += 10;
              rehandlesNeeded = Math.min(recommendedTier - 1, 3);
            }
          }
          strategy = 'departure_based';
          break;
        }

        case 'shipping_line': {
          // Group by shipping line: assign blocks
          const preferred = rule.conditions.preferredBlocks;
          if (preferred && preferred.length > 0 && preferred[0] !== undefined) {
            recommendedBlock = preferred[0];
            reasons.push(`Shipping line grouping: assigned to block ${recommendedBlock}`);
            score += 10;
          }
          break;
        }

        case 'custom': {
          if (rule.conditions.maxStackHeight) {
            recommendedTier = Math.min(recommendedTier, rule.conditions.maxStackHeight);
            reasons.push(`Custom rule: max stack height ${rule.conditions.maxStackHeight}`);
          }
          if (rule.conditions.preferredBlocks && rule.conditions.preferredBlocks.length > 0 && rule.conditions.preferredBlocks[0] !== undefined) {
            recommendedBlock = rule.conditions.preferredBlocks[0];
            reasons.push(`Custom rule: preferred block ${recommendedBlock}`);
          }
          score += 5;
          break;
        }
      }
    }

    // Ensure score is capped at 100
    score = Math.min(score, 100);

    // If no rules applied, provide default reasoning
    if (reasons.length === 0) {
      reasons.push('Default placement: no active stacking rules matched');
      strategy = 'balanced';
    }

    // Generate alternative locations
    const alternativeLocations = this.generateAlternativeLocations(
      recommendedBlock,
      recommendedBay,
      recommendedRow,
      recommendedTier,
      score,
    );

    return {
      containerId,
      containerNumber,
      recommendedBlock,
      recommendedBay,
      recommendedRow,
      recommendedTier,
      score,
      reasons,
      alternativeLocations,
      rehandlesNeeded,
      strategy,
    };
  }

  // ============================================================================
  // STATS
  // ============================================================================

  getSchedulingStats(tenantId: string): SchedulingStats {
    const allAppointments = Array.from(this.appointments.values()).filter(a => a.tenantId === tenantId);
    const allSlots = Array.from(this.dockSlots.values()).filter(s => s.tenantId === tenantId);
    const allTrailers = Array.from(this.trailers.values()).filter(t => t.tenantId === tenantId);
    const allEmpty = Array.from(this.emptyContainers.values()).filter(c => c.tenantId === tenantId);
    const allAllotments = Array.from(this.allotments.values()).filter(a => a.tenantId === tenantId);
    const allRules = Array.from(this.stackingRules.values()).filter(r => r.tenantId === tenantId);

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const appointmentsToday = allAppointments.filter(
      a => a.scheduledDate.toISOString().slice(0, 10) === todayStr
    );

    const completedAppointments = allAppointments.filter(a => a.status === 'completed');
    const turnaroundValues = completedAppointments
      .map(a => a.turnaroundMinutes)
      .filter((v): v is number => v !== undefined);
    const averageTurnaroundMinutes = turnaroundValues.length > 0
      ? turnaroundValues.reduce((sum, v) => sum + v, 0) / turnaroundValues.length
      : 0;

    const waitTimeValues = allAppointments
      .map(a => a.waitTimeMinutes)
      .filter((v): v is number => v !== undefined);
    const averageWaitTimeMinutes = waitTimeValues.length > 0
      ? waitTimeValues.reduce((sum, v) => sum + v, 0) / waitTimeValues.length
      : 0;

    const availableSlots = allSlots.filter(s => s.status === 'available').length;
    const occupiedSlots = allSlots.filter(s => s.status === 'occupied' || s.status === 'reserved').length;
    const totalDockSlots = allSlots.length;

    const pendingAllotments = allAllotments.filter(
      a => a.status === 'requested' || a.status === 'approved'
    ).length;

    return {
      tenantId,

      // Appointments
      totalAppointments: allAppointments.length,
      confirmedAppointments: allAppointments.filter(a => a.status === 'confirmed').length,
      completedAppointments: completedAppointments.length,
      noShowAppointments: allAppointments.filter(a => a.status === 'no_show').length,
      cancelledAppointments: allAppointments.filter(a => a.status === 'cancelled').length,
      appointmentsToday: appointmentsToday.length,
      averageTurnaroundMinutes,
      averageWaitTimeMinutes,

      // Dock slots
      totalDockSlots,
      availableSlots,
      occupiedSlots,
      utilizationPercent: totalDockSlots > 0 ? (occupiedSlots / totalDockSlots) * 100 : 0,

      // Trailers
      totalTrailers: allTrailers.length,
      availableTrailers: allTrailers.filter(t => t.status === 'available').length,
      inUseTrailers: allTrailers.filter(t => t.status === 'in_use').length,
      maintenanceTrailers: allTrailers.filter(t => t.status === 'maintenance').length,

      // Empty containers
      totalEmptyContainers: allEmpty.length,
      emptyInDepot: allEmpty.filter(c => c.status === 'in_depot' || c.status === 'survey_passed').length,
      emptyAllotted: allEmpty.filter(c => c.status === 'allotted').length,
      emptyPendingSurvey: allEmpty.filter(c => c.status === 'in_depot' || c.status === 'survey_pending').length,
      pendingAllotments,

      // Stacking
      totalStackingRules: allRules.length,
      activeStackingRules: allRules.filter(r => r.enabled).length,
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private findTimeConflict(
    slotId: UUID,
    date: Date,
    timeStart: string,
    timeEnd: string,
    excludeId?: UUID,
  ): DockAppointment | undefined {
    const dateStr = date.toISOString().slice(0, 10);

    for (const appointment of this.appointments.values()) {
      if (appointment.slotId !== slotId) continue;
      if (excludeId && appointment.id === excludeId) continue;
      if (appointment.status === 'cancelled' || appointment.status === 'no_show') continue;

      const aptDateStr = appointment.scheduledDate.toISOString().slice(0, 10);
      if (aptDateStr !== dateStr) continue;

      // Check time overlap
      if (this.timesOverlap(timeStart, timeEnd, appointment.scheduledTimeStart, appointment.scheduledTimeEnd)) {
        return appointment;
      }
    }

    return undefined;
  }

  private timesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string,
  ): boolean {
    const toMinutes = (t: string): number => {
      const parts = t.split(':').map(Number);
      const h = parts[0] ?? 0;
      const m = parts[1] ?? 0;
      return h * 60 + m;
    };

    const s1 = toMinutes(start1);
    const e1 = toMinutes(end1);
    const s2 = toMinutes(start2);
    const e2 = toMinutes(end2);

    return s1 < e2 && s2 < e1;
  }

  private computeInspectionStatus(
    lastInspection?: Date,
    nextDue?: Date,
  ): 'valid' | 'due' | 'overdue' | 'failed' {
    if (!lastInspection) return 'due';
    if (!nextDue) return 'valid';

    const now = new Date();
    if (now > nextDue) return 'overdue';

    // Due within 7 days
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 86400000);
    if (nextDue <= sevenDaysFromNow) return 'due';

    return 'valid';
  }

  private generateAlternativeLocations(
    primaryBlock: string,
    primaryBay: string,
    primaryRow: string,
    primaryTier: number,
    primaryScore: number,
  ): Array<{ block: string; bay: string; row: string; tier: number; score: number }> {
    const alternatives: Array<{ block: string; bay: string; row: string; tier: number; score: number }> = [];
    const blocks = ['A', 'B', 'C', 'D', 'E'];
    const bays = ['01', '02', '03', '04'];
    const rows = ['A', 'B', 'C', 'D'];

    for (const block of blocks) {
      if (block === primaryBlock) continue;
      if (alternatives.length >= 3) break;

      const bayIdx = Math.min(bays.indexOf(primaryBay) + 1, bays.length - 1);
      const rowIdx = Math.min(rows.indexOf(primaryRow), rows.length - 1);

      alternatives.push({
        block,
        bay: bays[bayIdx] ?? primaryBay,
        row: rows[rowIdx] ?? primaryRow,
        tier: primaryTier,
        score: Math.max(primaryScore - (alternatives.length + 1) * 10, 10),
      });
    }

    return alternatives;
  }
}

// ============================================================================
// SINGLETON ACCESSORS
// ============================================================================

let _schedulingEngine: SchedulingEngine | null = null;

export function getSchedulingEngine(): SchedulingEngine {
  if (!_schedulingEngine) {
    _schedulingEngine = SchedulingEngine.getInstance();
  }
  return _schedulingEngine;
}

export function setSchedulingEngine(engine: SchedulingEngine): void {
  _schedulingEngine = engine;
}
