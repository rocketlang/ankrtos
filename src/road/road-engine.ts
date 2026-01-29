// Road Transport Engine for ankrICD
// Truck appointments, E-way bill integration, Transporter management

import { v4 as uuidv4 } from 'uuid';
import type {
  UUID,
  OperationResult,
  PaginatedResult,
  Address,
} from '../types/common';
import type {
  TruckAppointment,
  AppointmentStatus,
  Transporter,
  TruckVisit,
  EWayBill,
  EWayBillPartBUpdate,
} from '../types/transport';
import { emit } from '../core';

// ============================================================================
// ROAD ENGINE
// ============================================================================

export class RoadEngine {
  private static instance: RoadEngine | null = null;

  // In-memory stores (would be database in production)
  private transporters: Map<UUID, Transporter> = new Map();
  private appointments: Map<UUID, TruckAppointment> = new Map();
  private visits: Map<UUID, TruckVisit> = new Map();
  private eWayBills: Map<UUID, EWayBill> = new Map();

  private constructor() {}

  static getInstance(): RoadEngine {
    if (!RoadEngine.instance) {
      RoadEngine.instance = new RoadEngine();
    }
    return RoadEngine.instance;
  }

  // Reset for testing
  static resetInstance(): void {
    RoadEngine.instance = null;
  }

  // ============================================================================
  // TRANSPORTER MANAGEMENT
  // ============================================================================

  /**
   * Register a new transporter
   */
  registerTransporter(input: RegisterTransporterInput): OperationResult<Transporter> {
    // Check for duplicate code
    const existing = Array.from(this.transporters.values()).find(
      t => t.code === input.code && t.tenantId === input.tenantId
    );

    if (existing) {
      return {
        success: false,
        error: `Transporter with code ${input.code} already exists`,
        errorCode: 'DUPLICATE_TRANSPORTER',
      };
    }

    const transporter: Transporter = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      code: input.code,
      name: input.name,
      legalName: input.legalName ?? input.name,
      gstin: input.gstin,
      panNumber: input.panNumber,
      transporterId: input.transporterId,
      address: input.address,
      contacts: input.contacts ?? [],
      email: input.email,
      phone: input.phone,
      fleetSize: input.fleetSize,
      vehicleTypes: input.vehicleTypes,
      rating: 0,
      completedTrips: 0,
      onTimePercent: 100,
      status: 'active',
      contractStartDate: input.contractStartDate,
      contractEndDate: input.contractEndDate,
      creditLimit: input.creditLimit,
      paymentTerms: input.paymentTerms,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.transporters.set(transporter.id, transporter);

    emit('road.transporter_registered', {
      transporterId: transporter.id,
      code: transporter.code,
      name: transporter.name,
    }, { tenantId: transporter.tenantId });

    return { success: true, data: transporter };
  }

  /**
   * Get transporter by ID
   */
  getTransporter(transporterId: UUID): Transporter | undefined {
    return this.transporters.get(transporterId);
  }

  /**
   * Get transporter by code
   */
  getTransporterByCode(code: string, tenantId: string): Transporter | undefined {
    return Array.from(this.transporters.values()).find(
      t => t.code === code && t.tenantId === tenantId
    );
  }

  /**
   * List transporters
   */
  listTransporters(options: TransporterQueryOptions = {}): PaginatedResult<Transporter> {
    let transporters = Array.from(this.transporters.values());

    if (options.tenantId) {
      transporters = transporters.filter(t => t.tenantId === options.tenantId);
    }
    if (options.status) {
      transporters = transporters.filter(t => t.status === options.status);
    }
    if (options.search) {
      const search = options.search.toLowerCase();
      transporters = transporters.filter(t =>
        t.name.toLowerCase().includes(search) ||
        t.code.toLowerCase().includes(search)
      );
    }

    const total = transporters.length;
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 50;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    transporters = transporters.slice(offset, offset + pageSize);

    return {
      data: transporters,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Update transporter status
   */
  updateTransporterStatus(
    transporterId: UUID,
    status: 'active' | 'inactive' | 'blacklisted'
  ): OperationResult<Transporter> {
    const transporter = this.transporters.get(transporterId);
    if (!transporter) {
      return { success: false, error: 'Transporter not found', errorCode: 'NOT_FOUND' };
    }

    transporter.status = status;
    transporter.updatedAt = new Date();
    this.transporters.set(transporterId, transporter);

    return { success: true, data: transporter };
  }

  /**
   * Update transporter rating after a trip
   */
  updateTransporterRating(transporterId: UUID, tripRating: number, onTime: boolean): OperationResult<Transporter> {
    const transporter = this.transporters.get(transporterId);
    if (!transporter) {
      return { success: false, error: 'Transporter not found', errorCode: 'NOT_FOUND' };
    }

    // Calculate new average rating
    const totalTrips = (transporter.completedTrips ?? 0) + 1;
    const currentRating = transporter.rating ?? 0;
    const newRating = ((currentRating * (totalTrips - 1)) + tripRating) / totalTrips;

    // Calculate on-time percentage
    const onTimeTrips = Math.round(((transporter.onTimePercent ?? 100) / 100) * (totalTrips - 1)) + (onTime ? 1 : 0);
    const newOnTimePercent = (onTimeTrips / totalTrips) * 100;

    transporter.rating = Math.round(newRating * 10) / 10;
    transporter.completedTrips = totalTrips;
    transporter.onTimePercent = Math.round(newOnTimePercent * 10) / 10;
    transporter.updatedAt = new Date();

    this.transporters.set(transporterId, transporter);

    return { success: true, data: transporter };
  }

  // ============================================================================
  // APPOINTMENT MANAGEMENT
  // ============================================================================

  /**
   * Create a truck appointment
   */
  createAppointment(input: CreateTruckAppointmentInput): OperationResult<TruckAppointment> {
    // Validate transporter
    const transporter = this.transporters.get(input.transporterId);
    if (!transporter) {
      return { success: false, error: 'Transporter not found', errorCode: 'TRANSPORTER_NOT_FOUND' };
    }

    if (transporter.status !== 'active') {
      return {
        success: false,
        error: `Transporter ${transporter.name} is ${transporter.status}`,
        errorCode: 'TRANSPORTER_INACTIVE',
      };
    }

    // Generate appointment number
    const appointmentNumber = generateAppointmentNumber(input.facilityId);

    // Calculate time window (default 2 hours)
    const windowMinutes = input.windowMinutes ?? 120;
    const windowStart = new Date(input.scheduledTime.getTime() - (windowMinutes / 2) * 60000);
    const windowEnd = new Date(input.scheduledTime.getTime() + (windowMinutes / 2) * 60000);

    const appointment: TruckAppointment = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      appointmentNumber,
      appointmentType: input.appointmentType,
      scheduledTime: input.scheduledTime,
      windowStart,
      windowEnd,
      transporterId: input.transporterId,
      transporterName: transporter.name,
      truckNumber: input.truckNumber,
      trailerNumber: input.trailerNumber,
      driverName: input.driverName,
      driverLicense: input.driverLicense,
      driverPhone: input.driverPhone,
      driverPhoto: input.driverPhoto,
      containers: input.containers.map(c => ({
        ...c,
        status: 'pending' as const,
      })),
      totalContainers: input.containers.length,
      deliveryOrderId: input.deliveryOrderId,
      deliveryOrderNumber: input.deliveryOrderNumber,
      eWayBillNumber: input.eWayBillNumber,
      lrNumber: input.lrNumber,
      status: 'scheduled',
      instructions: input.instructions,
      notes: input.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.appointments.set(appointment.id, appointment);

    emit('road.appointment_created', {
      appointmentId: appointment.id,
      appointmentNumber: appointment.appointmentNumber,
      appointmentType: appointment.appointmentType,
      scheduledTime: appointment.scheduledTime,
      transporterName: appointment.transporterName,
      truckNumber: appointment.truckNumber,
      containers: appointment.totalContainers,
    }, { tenantId: appointment.tenantId });

    return { success: true, data: appointment };
  }

  /**
   * Get appointment by ID
   */
  getAppointment(appointmentId: UUID): TruckAppointment | undefined {
    return this.appointments.get(appointmentId);
  }

  /**
   * Get appointment by number
   */
  getAppointmentByNumber(appointmentNumber: string, tenantId: string): TruckAppointment | undefined {
    return Array.from(this.appointments.values()).find(
      a => a.appointmentNumber === appointmentNumber && a.tenantId === tenantId
    );
  }

  /**
   * List appointments
   */
  listAppointments(options: AppointmentQueryOptions = {}): PaginatedResult<TruckAppointment> {
    let appointments = Array.from(this.appointments.values());

    if (options.tenantId) {
      appointments = appointments.filter(a => a.tenantId === options.tenantId);
    }
    if (options.status) {
      appointments = appointments.filter(a => a.status === options.status);
    }
    if (options.statuses) {
      appointments = appointments.filter(a => options.statuses!.includes(a.status));
    }
    if (options.appointmentType) {
      appointments = appointments.filter(a => a.appointmentType === options.appointmentType);
    }
    if (options.transporterId) {
      appointments = appointments.filter(a => a.transporterId === options.transporterId);
    }
    if (options.truckNumber) {
      appointments = appointments.filter(a => a.truckNumber === options.truckNumber);
    }
    if (options.date) {
      appointments = appointments.filter(a =>
        a.scheduledTime.toDateString() === options.date!.toDateString()
      );
    }
    if (options.fromDate) {
      appointments = appointments.filter(a => a.scheduledTime >= options.fromDate!);
    }
    if (options.toDate) {
      appointments = appointments.filter(a => a.scheduledTime <= options.toDate!);
    }

    // Sort by scheduled time
    appointments.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());

    const total = appointments.length;
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 50;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    appointments = appointments.slice(offset, offset + pageSize);

    return {
      data: appointments,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Confirm an appointment
   */
  confirmAppointment(appointmentId: UUID): OperationResult<TruckAppointment> {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) {
      return { success: false, error: 'Appointment not found', errorCode: 'NOT_FOUND' };
    }

    if (appointment.status !== 'scheduled') {
      return {
        success: false,
        error: `Cannot confirm appointment in status ${appointment.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    appointment.status = 'confirmed';
    appointment.updatedAt = new Date();
    this.appointments.set(appointmentId, appointment);

    emit('road.appointment_confirmed', {
      appointmentId: appointment.id,
      appointmentNumber: appointment.appointmentNumber,
    }, { tenantId: appointment.tenantId });

    return { success: true, data: appointment };
  }

  /**
   * Record truck arrival
   */
  recordArrival(appointmentId: UUID): OperationResult<TruckAppointment> {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) {
      return { success: false, error: 'Appointment not found', errorCode: 'NOT_FOUND' };
    }

    if (!['scheduled', 'confirmed'].includes(appointment.status)) {
      return {
        success: false,
        error: `Cannot record arrival for appointment in status ${appointment.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    appointment.status = 'arrived';
    appointment.actualArrival = new Date();
    appointment.updatedAt = new Date();
    this.appointments.set(appointmentId, appointment);

    // Check if arrival is within window
    const isOnTime = appointment.actualArrival >= appointment.windowStart &&
                     appointment.actualArrival <= appointment.windowEnd;

    emit('road.truck_arrived', {
      appointmentId: appointment.id,
      appointmentNumber: appointment.appointmentNumber,
      truckNumber: appointment.truckNumber,
      arrivalTime: appointment.actualArrival,
      isOnTime,
    }, { tenantId: appointment.tenantId });

    return { success: true, data: appointment };
  }

  /**
   * Start check-in process
   */
  startCheckIn(appointmentId: UUID): OperationResult<TruckAppointment> {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) {
      return { success: false, error: 'Appointment not found', errorCode: 'NOT_FOUND' };
    }

    if (appointment.status !== 'arrived') {
      return {
        success: false,
        error: `Cannot start check-in for appointment in status ${appointment.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    appointment.status = 'check_in';
    appointment.checkInTime = new Date();
    appointment.updatedAt = new Date();
    this.appointments.set(appointmentId, appointment);

    return { success: true, data: appointment };
  }

  /**
   * Complete processing
   */
  completeProcessing(appointmentId: UUID): OperationResult<TruckAppointment> {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) {
      return { success: false, error: 'Appointment not found', errorCode: 'NOT_FOUND' };
    }

    if (!['check_in', 'processing'].includes(appointment.status)) {
      return {
        success: false,
        error: `Cannot complete processing for appointment in status ${appointment.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    // Mark all containers as completed
    appointment.containers = appointment.containers.map(c => ({
      ...c,
      status: 'completed' as const,
    }));

    appointment.status = 'check_out';
    appointment.checkOutTime = new Date();
    appointment.updatedAt = new Date();
    this.appointments.set(appointmentId, appointment);

    return { success: true, data: appointment };
  }

  /**
   * Complete appointment (truck departed)
   */
  completeAppointment(appointmentId: UUID): OperationResult<TruckAppointment> {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) {
      return { success: false, error: 'Appointment not found', errorCode: 'NOT_FOUND' };
    }

    if (appointment.status !== 'check_out') {
      return {
        success: false,
        error: `Cannot complete appointment in status ${appointment.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    appointment.status = 'completed';
    appointment.updatedAt = new Date();
    this.appointments.set(appointmentId, appointment);

    // Update transporter rating
    const isOnTime = appointment.actualArrival !== undefined &&
                     appointment.actualArrival >= appointment.windowStart &&
                     appointment.actualArrival <= appointment.windowEnd;

    this.updateTransporterRating(appointment.transporterId, 5, isOnTime);

    emit('road.appointment_completed', {
      appointmentId: appointment.id,
      appointmentNumber: appointment.appointmentNumber,
      truckNumber: appointment.truckNumber,
      containersProcessed: appointment.totalContainers,
    }, { tenantId: appointment.tenantId });

    return { success: true, data: appointment };
  }

  /**
   * Cancel appointment
   */
  cancelAppointment(appointmentId: UUID, reason: string): OperationResult<TruckAppointment> {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) {
      return { success: false, error: 'Appointment not found', errorCode: 'NOT_FOUND' };
    }

    if (['completed', 'cancelled'].includes(appointment.status)) {
      return {
        success: false,
        error: `Cannot cancel appointment in status ${appointment.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    appointment.status = 'cancelled';
    appointment.notes = (appointment.notes ? appointment.notes + '\n' : '') + `Cancelled: ${reason}`;
    appointment.updatedAt = new Date();
    this.appointments.set(appointmentId, appointment);

    emit('road.appointment_cancelled', {
      appointmentId: appointment.id,
      appointmentNumber: appointment.appointmentNumber,
      reason,
    }, { tenantId: appointment.tenantId });

    return { success: true, data: appointment };
  }

  /**
   * Mark as no-show
   */
  markNoShow(appointmentId: UUID): OperationResult<TruckAppointment> {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) {
      return { success: false, error: 'Appointment not found', errorCode: 'NOT_FOUND' };
    }

    if (!['scheduled', 'confirmed'].includes(appointment.status)) {
      return {
        success: false,
        error: `Cannot mark no-show for appointment in status ${appointment.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    appointment.status = 'no_show';
    appointment.updatedAt = new Date();
    this.appointments.set(appointmentId, appointment);

    // Negative impact on transporter rating
    this.updateTransporterRating(appointment.transporterId, 1, false);

    emit('road.appointment_no_show', {
      appointmentId: appointment.id,
      appointmentNumber: appointment.appointmentNumber,
      transporterId: appointment.transporterId,
    }, { tenantId: appointment.tenantId });

    return { success: true, data: appointment };
  }

  // ============================================================================
  // E-WAY BILL MANAGEMENT
  // ============================================================================

  /**
   * Register an E-way bill
   */
  registerEWayBill(input: RegisterEWayBillInput): OperationResult<EWayBill> {
    // Check for duplicates
    const existing = Array.from(this.eWayBills.values()).find(
      e => e.eWayBillNumber === input.eWayBillNumber && e.tenantId === input.tenantId
    );

    if (existing) {
      return {
        success: false,
        error: `E-way bill ${input.eWayBillNumber} already registered`,
        errorCode: 'DUPLICATE_EWAY_BILL',
      };
    }

    const eWayBill: EWayBill = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      eWayBillNumber: input.eWayBillNumber,
      generatedAt: input.generatedAt ?? new Date(),
      validFrom: input.validFrom,
      validTo: input.validTo,
      fromGstin: input.fromGstin,
      fromTradeName: input.fromTradeName,
      fromAddress: input.fromAddress,
      toGstin: input.toGstin,
      toTradeName: input.toTradeName,
      toAddress: input.toAddress,
      transportMode: input.transportMode,
      transporterId: input.transporterId,
      transporterName: input.transporterName,
      vehicleNumber: input.vehicleNumber,
      vehicleType: input.vehicleType,
      documentType: input.documentType,
      documentNumber: input.documentNumber,
      documentDate: input.documentDate,
      hsnCode: input.hsnCode,
      productDescription: input.productDescription,
      quantity: input.quantity,
      unit: input.unit,
      taxableValue: input.taxableValue,
      cgst: input.cgst ?? 0,
      sgst: input.sgst ?? 0,
      igst: input.igst ?? 0,
      totalValue: input.totalValue,
      status: 'active',
      partBUpdates: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.eWayBills.set(eWayBill.id, eWayBill);

    emit('road.eway_bill_registered', {
      eWayBillId: eWayBill.id,
      eWayBillNumber: eWayBill.eWayBillNumber,
      validFrom: eWayBill.validFrom,
      validTo: eWayBill.validTo,
      vehicleNumber: eWayBill.vehicleNumber,
    }, { tenantId: eWayBill.tenantId });

    return { success: true, data: eWayBill };
  }

  /**
   * Get E-way bill by ID
   */
  getEWayBill(eWayBillId: UUID): EWayBill | undefined {
    return this.eWayBills.get(eWayBillId);
  }

  /**
   * Get E-way bill by number
   */
  getEWayBillByNumber(eWayBillNumber: string, tenantId: string): EWayBill | undefined {
    return Array.from(this.eWayBills.values()).find(
      e => e.eWayBillNumber === eWayBillNumber && e.tenantId === tenantId
    );
  }

  /**
   * List E-way bills
   */
  listEWayBills(options: EWayBillQueryOptions = {}): PaginatedResult<EWayBill> {
    let eWayBills = Array.from(this.eWayBills.values());

    if (options.tenantId) {
      eWayBills = eWayBills.filter(e => e.tenantId === options.tenantId);
    }
    if (options.status) {
      eWayBills = eWayBills.filter(e => e.status === options.status);
    }
    if (options.vehicleNumber) {
      eWayBills = eWayBills.filter(e => e.vehicleNumber === options.vehicleNumber);
    }
    if (options.transportMode) {
      eWayBills = eWayBills.filter(e => e.transportMode === options.transportMode);
    }
    if (options.fromGstin) {
      eWayBills = eWayBills.filter(e => e.fromGstin === options.fromGstin);
    }
    if (options.toGstin) {
      eWayBills = eWayBills.filter(e => e.toGstin === options.toGstin);
    }
    if (options.activeOnly) {
      const now = new Date();
      eWayBills = eWayBills.filter(e => e.status === 'active' && e.validTo > now);
    }

    const total = eWayBills.length;
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 50;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    eWayBills = eWayBills.slice(offset, offset + pageSize);

    return {
      data: eWayBills,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Update E-way bill Part B (vehicle update)
   */
  updateEWayBillPartB(eWayBillId: UUID, update: PartBUpdateInput): OperationResult<EWayBill> {
    const eWayBill = this.eWayBills.get(eWayBillId);
    if (!eWayBill) {
      return { success: false, error: 'E-way bill not found', errorCode: 'NOT_FOUND' };
    }

    if (eWayBill.status !== 'active') {
      return {
        success: false,
        error: `Cannot update E-way bill in status ${eWayBill.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    // Check if still valid
    if (eWayBill.validTo < new Date()) {
      eWayBill.status = 'expired';
      this.eWayBills.set(eWayBillId, eWayBill);
      return {
        success: false,
        error: 'E-way bill has expired',
        errorCode: 'EXPIRED',
      };
    }

    const partBUpdate: EWayBillPartBUpdate = {
      updateTime: new Date(),
      vehicleNumber: update.vehicleNumber,
      fromPlace: update.fromPlace,
      transDocNumber: update.transDocNumber,
      transDocDate: update.transDocDate,
    };

    eWayBill.vehicleNumber = update.vehicleNumber;
    eWayBill.partBUpdates.push(partBUpdate);
    eWayBill.updatedAt = new Date();

    this.eWayBills.set(eWayBillId, eWayBill);

    emit('road.eway_bill_updated', {
      eWayBillId: eWayBill.id,
      eWayBillNumber: eWayBill.eWayBillNumber,
      newVehicleNumber: update.vehicleNumber,
    }, { tenantId: eWayBill.tenantId });

    return { success: true, data: eWayBill };
  }

  /**
   * Cancel E-way bill
   */
  cancelEWayBill(eWayBillId: UUID, reason: string): OperationResult<EWayBill> {
    const eWayBill = this.eWayBills.get(eWayBillId);
    if (!eWayBill) {
      return { success: false, error: 'E-way bill not found', errorCode: 'NOT_FOUND' };
    }

    if (eWayBill.status !== 'active') {
      return {
        success: false,
        error: `Cannot cancel E-way bill in status ${eWayBill.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    eWayBill.status = 'cancelled';
    eWayBill.cancelledAt = new Date();
    eWayBill.cancelReason = reason;
    eWayBill.updatedAt = new Date();

    this.eWayBills.set(eWayBillId, eWayBill);

    emit('road.eway_bill_cancelled', {
      eWayBillId: eWayBill.id,
      eWayBillNumber: eWayBill.eWayBillNumber,
      reason,
    }, { tenantId: eWayBill.tenantId });

    return { success: true, data: eWayBill };
  }

  /**
   * Validate E-way bill for gate entry
   */
  validateEWayBillForEntry(eWayBillNumber: string, vehicleNumber: string, tenantId: string): EWayBillValidationResult {
    const eWayBill = this.getEWayBillByNumber(eWayBillNumber, tenantId);

    if (!eWayBill) {
      return {
        valid: false,
        reason: 'E-way bill not found',
        errorCode: 'NOT_FOUND',
      };
    }

    if (eWayBill.status !== 'active') {
      return {
        valid: false,
        reason: `E-way bill is ${eWayBill.status}`,
        errorCode: 'INVALID_STATUS',
        eWayBill,
      };
    }

    const now = new Date();
    if (now < eWayBill.validFrom) {
      return {
        valid: false,
        reason: 'E-way bill is not yet valid',
        errorCode: 'NOT_YET_VALID',
        eWayBill,
      };
    }

    if (now > eWayBill.validTo) {
      return {
        valid: false,
        reason: 'E-way bill has expired',
        errorCode: 'EXPIRED',
        eWayBill,
      };
    }

    if (eWayBill.vehicleNumber && eWayBill.vehicleNumber !== vehicleNumber) {
      return {
        valid: false,
        reason: `Vehicle mismatch: E-way bill is for ${eWayBill.vehicleNumber}`,
        errorCode: 'VEHICLE_MISMATCH',
        eWayBill,
      };
    }

    return {
      valid: true,
      eWayBill,
    };
  }

  // ============================================================================
  // TRUCK VISIT TRACKING
  // ============================================================================

  /**
   * Record truck visit (for walk-in trucks without appointment)
   */
  recordTruckVisit(input: RecordTruckVisitInput): OperationResult<TruckVisit> {
    const visit: TruckVisit = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      appointmentId: input.appointmentId,
      truckNumber: input.truckNumber,
      trailerNumber: input.trailerNumber,
      vehicleType: input.vehicleType,
      driverName: input.driverName,
      driverLicense: input.driverLicense,
      driverPhone: input.driverPhone,
      arrivalTime: new Date(),
      containersDelivered: [],
      containersPickedUp: [],
      eWayBillNumber: input.eWayBillNumber,
      deliveryOrderNumber: input.deliveryOrderNumber,
      entryPhotos: [],
      exitPhotos: [],
      weighbridgeIn: input.weighbridgeIn,
      status: 'at_gate',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.visits.set(visit.id, visit);

    return { success: true, data: visit };
  }

  /**
   * Update visit - truck entered facility
   */
  truckEntered(visitId: UUID): OperationResult<TruckVisit> {
    const visit = this.visits.get(visitId);
    if (!visit) {
      return { success: false, error: 'Visit not found', errorCode: 'NOT_FOUND' };
    }

    visit.gateInTime = new Date();
    visit.status = 'inside';
    visit.updatedAt = new Date();

    this.visits.set(visitId, visit);

    return { success: true, data: visit };
  }

  /**
   * Update visit - truck departed
   */
  truckDeparted(visitId: UUID, weighbridgeOut?: number): OperationResult<TruckVisit> {
    const visit = this.visits.get(visitId);
    if (!visit) {
      return { success: false, error: 'Visit not found', errorCode: 'NOT_FOUND' };
    }

    visit.gateOutTime = new Date();
    visit.weighbridgeOut = weighbridgeOut;
    visit.status = 'departed';

    // Calculate total duration
    if (visit.gateInTime) {
      visit.totalDuration = Math.round((visit.gateOutTime.getTime() - visit.gateInTime.getTime()) / 60000);
    }

    visit.updatedAt = new Date();
    this.visits.set(visitId, visit);

    return { success: true, data: visit };
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get road transport statistics
   */
  getStats(tenantId: string, date?: Date): RoadTransportStats {
    const targetDate = date ?? new Date();
    const appointments = Array.from(this.appointments.values()).filter(a =>
      a.tenantId === tenantId &&
      a.scheduledTime.toDateString() === targetDate.toDateString()
    );

    const completed = appointments.filter(a => a.status === 'completed');
    const noShows = appointments.filter(a => a.status === 'no_show');
    const cancelled = appointments.filter(a => a.status === 'cancelled');
    const pending = appointments.filter(a =>
      ['scheduled', 'confirmed'].includes(a.status)
    );
    const inProgress = appointments.filter(a =>
      ['arrived', 'check_in', 'processing', 'check_out'].includes(a.status)
    );

    // Calculate on-time arrivals
    const onTimeArrivals = completed.filter(a =>
      a.actualArrival !== undefined &&
      a.actualArrival >= a.windowStart &&
      a.actualArrival <= a.windowEnd
    ).length;

    // E-way bill stats
    const eWayBills = Array.from(this.eWayBills.values()).filter(e =>
      e.tenantId === tenantId
    );
    const activeEWayBills = eWayBills.filter(e =>
      e.status === 'active' && e.validTo > new Date()
    );
    const expiringToday = eWayBills.filter(e =>
      e.status === 'active' &&
      e.validTo.toDateString() === targetDate.toDateString()
    );

    return {
      date: targetDate,
      totalAppointments: appointments.length,
      completed: completed.length,
      pending: pending.length,
      inProgress: inProgress.length,
      noShows: noShows.length,
      cancelled: cancelled.length,
      onTimePercent: completed.length > 0
        ? Math.round((onTimeArrivals / completed.length) * 100)
        : 100,
      pickupAppointments: appointments.filter(a => a.appointmentType === 'pickup').length,
      deliveryAppointments: appointments.filter(a => a.appointmentType === 'delivery').length,
      activeEWayBills: activeEWayBills.length,
      expiringEWayBillsToday: expiringToday.length,
    };
  }

  /**
   * Get available time slots for a date
   */
  getAvailableSlots(
    tenantId: string,
    date: Date,
    slotDurationMinutes: number = 60,
    maxAppointmentsPerSlot: number = 5
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];

    // Operating hours: 6 AM to 10 PM
    const startHour = 6;
    const endHour = 22;

    const appointments = Array.from(this.appointments.values()).filter(a =>
      a.tenantId === tenantId &&
      a.scheduledTime.toDateString() === date.toDateString() &&
      !['cancelled', 'no_show'].includes(a.status)
    );

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDurationMinutes) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, minute, 0, 0);

        const slotEnd = new Date(slotStart.getTime() + slotDurationMinutes * 60000);

        const slotAppointments = appointments.filter(a =>
          a.scheduledTime >= slotStart && a.scheduledTime < slotEnd
        );

        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          booked: slotAppointments.length,
          available: maxAppointmentsPerSlot - slotAppointments.length,
          isAvailable: slotAppointments.length < maxAppointmentsPerSlot,
        });
      }
    }

    return slots;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateAppointmentNumber(_facilityId: UUID): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `APT-${dateStr}-${random}`;
}

// ============================================================================
// SINGLETON ACCESS
// ============================================================================

let roadEngineInstance: RoadEngine | null = null;

export function getRoadEngine(): RoadEngine {
  if (!roadEngineInstance) {
    roadEngineInstance = RoadEngine.getInstance();
  }
  return roadEngineInstance;
}

export function setRoadEngine(engine: RoadEngine): void {
  roadEngineInstance = engine;
}

// ============================================================================
// TYPES
// ============================================================================

export interface RegisterTransporterInput {
  tenantId: string;
  facilityId: UUID;
  code: string;
  name: string;
  legalName?: string;
  gstin?: string;
  panNumber?: string;
  transporterId?: string;
  address: Address;
  contacts?: Array<{ name: string; phone: string; email?: string; role?: string }>;
  email?: string;
  phone?: string;
  fleetSize?: number;
  vehicleTypes?: string[];
  contractStartDate?: Date;
  contractEndDate?: Date;
  creditLimit?: number;
  paymentTerms?: string;
}

export interface TransporterQueryOptions {
  tenantId?: string;
  status?: 'active' | 'inactive' | 'blacklisted';
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateTruckAppointmentInput {
  tenantId: string;
  facilityId: UUID;
  appointmentType: 'pickup' | 'delivery' | 'both';
  scheduledTime: Date;
  windowMinutes?: number;
  transporterId: UUID;
  truckNumber: string;
  trailerNumber?: string;
  driverName: string;
  driverLicense: string;
  driverPhone: string;
  driverPhoto?: string;
  containers: Array<{
    containerId?: UUID;
    containerNumber: string;
    isoType: string;
    operation: 'pickup' | 'delivery';
  }>;
  deliveryOrderId?: UUID;
  deliveryOrderNumber?: string;
  eWayBillNumber?: string;
  lrNumber?: string;
  instructions?: string;
  notes?: string;
}

export interface AppointmentQueryOptions {
  tenantId?: string;
  status?: AppointmentStatus;
  statuses?: AppointmentStatus[];
  appointmentType?: 'pickup' | 'delivery' | 'both';
  transporterId?: UUID;
  truckNumber?: string;
  date?: Date;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  pageSize?: number;
}

export interface RegisterEWayBillInput {
  tenantId: string;
  facilityId: UUID;
  eWayBillNumber: string;
  generatedAt?: Date;
  validFrom: Date;
  validTo: Date;
  fromGstin: string;
  fromTradeName: string;
  fromAddress: Address;
  toGstin: string;
  toTradeName: string;
  toAddress: Address;
  transportMode: 'road' | 'rail' | 'ship' | 'air';
  transporterId?: string;
  transporterName?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  documentType: 'invoice' | 'bill_of_supply' | 'delivery_challan' | 'other';
  documentNumber: string;
  documentDate: Date;
  hsnCode: string;
  productDescription: string;
  quantity: number;
  unit: string;
  taxableValue: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  totalValue: number;
}

export interface EWayBillQueryOptions {
  tenantId?: string;
  status?: 'active' | 'cancelled' | 'expired';
  vehicleNumber?: string;
  transportMode?: 'road' | 'rail' | 'ship' | 'air';
  fromGstin?: string;
  toGstin?: string;
  activeOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PartBUpdateInput {
  vehicleNumber: string;
  fromPlace: string;
  transDocNumber?: string;
  transDocDate?: Date;
}

export interface EWayBillValidationResult {
  valid: boolean;
  reason?: string;
  errorCode?: string;
  eWayBill?: EWayBill;
}

export interface RecordTruckVisitInput {
  tenantId: string;
  facilityId: UUID;
  appointmentId?: UUID;
  truckNumber: string;
  trailerNumber?: string;
  vehicleType?: string;
  driverName: string;
  driverLicense: string;
  driverPhone: string;
  eWayBillNumber?: string;
  deliveryOrderNumber?: string;
  weighbridgeIn?: number;
}

export interface RoadTransportStats {
  date: Date;
  totalAppointments: number;
  completed: number;
  pending: number;
  inProgress: number;
  noShows: number;
  cancelled: number;
  onTimePercent: number;
  pickupAppointments: number;
  deliveryAppointments: number;
  activeEWayBills: number;
  expiringEWayBillsToday: number;
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  booked: number;
  available: number;
  isAvailable: boolean;
}
