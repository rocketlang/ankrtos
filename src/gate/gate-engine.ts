// Gate Engine - Gate Operations Management for ankrICD

import { v4 as uuidv4 } from 'uuid';
import { emit } from '../core/event-bus';
import { getContainerEngine } from '../containers/container-engine';
import type {
  Gate,
  GateLane,
  GateTransaction,
  GateTransactionType,
  GateTransactionStatus,
  GateTransactionContainer,
  GatePhoto,
  OCRCapture,
  RFIDCapture,
  WeighbridgeCapture,
  InspectionResult,
  GateQueue,
  LaneQueue,
  QueueItem,
  GateMetrics,
} from '../types/gate';
import type { TruckAppointment, AppointmentStatus } from '../types/transport';
import type { ContainerCondition, ContainerSize, ContainerISOType } from '../types/container';
import type { UUID, OperationResult } from '../types/common';

// ============================================================================
// GATE ENGINE
// ============================================================================

export class GateEngine {
  // Storage
  private gates: Map<UUID, Gate> = new Map();
  private lanes: Map<UUID, GateLane> = new Map();
  private transactions: Map<UUID, GateTransaction> = new Map();
  private appointments: Map<UUID, TruckAppointment> = new Map();

  // Indexes
  private gatesByFacility: Map<UUID, Set<UUID>> = new Map();
  private lanesByGate: Map<UUID, Set<UUID>> = new Map();
  private transactionsByFacility: Map<UUID, Set<UUID>> = new Map();
  private appointmentsByFacility: Map<UUID, Set<UUID>> = new Map();
  private activeTransactionsByLane: Map<UUID, UUID> = new Map();
  private appointmentsByDate: Map<string, Set<UUID>> = new Map();

  // Counters
  private transactionCounter = 0;
  private appointmentCounter = 0;

  // ===========================================================================
  // GATE MANAGEMENT
  // ===========================================================================

  registerGate(input: RegisterGateInput): OperationResult<Gate> {
    const id = uuidv4();

    const gate: Gate = {
      id,
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      gateId: input.gateId,
      name: input.name,
      gateType: input.gateType ?? 'main',
      coordinates: input.coordinates,
      lanes: [],
      totalLanes: 0,
      hasWeighbridge: input.hasWeighbridge ?? false,
      weighbridgeCapacity: input.weighbridgeCapacity,
      hasOCR: input.hasOCR ?? false,
      hasRFID: input.hasRFID ?? false,
      operatingHours: input.operatingHours ?? {
        weekdays: { open: '06:00', close: '22:00' },
      },
      is24x7: input.is24x7 ?? false,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.gates.set(id, gate);

    // Index by facility
    if (!this.gatesByFacility.has(input.facilityId)) {
      this.gatesByFacility.set(input.facilityId, new Set());
    }
    this.gatesByFacility.get(input.facilityId)?.add(id);

    emit('gate.registered', { gate }, {
      facilityId: input.facilityId,
      tenantId: input.tenantId,
      source: 'GateEngine',
    });

    return { success: true, data: gate };
  }

  addLane(input: AddLaneInput): OperationResult<GateLane> {
    const gate = this.gates.get(input.gateId);
    if (!gate) {
      return { success: false, error: 'Gate not found', errorCode: 'GATE_NOT_FOUND' };
    }

    const id = uuidv4();

    const lane: GateLane = {
      id,
      gateId: input.gateId,
      laneNumber: input.laneNumber,
      laneType: input.laneType,
      status: 'open',
      hasOCR: input.hasOCR ?? gate.hasOCR,
      hasRFID: input.hasRFID ?? gate.hasRFID,
      hasWeighbridge: input.hasWeighbridge ?? false,
      hasBoomBarrier: input.hasBoomBarrier ?? true,
      vehiclesInQueue: 0,
    };

    this.lanes.set(id, lane);

    // Update gate
    gate.lanes.push(lane);
    gate.totalLanes = gate.lanes.length;
    gate.updatedAt = new Date();

    // Index
    if (!this.lanesByGate.has(input.gateId)) {
      this.lanesByGate.set(input.gateId, new Set());
    }
    this.lanesByGate.get(input.gateId)?.add(id);

    return { success: true, data: lane };
  }

  getGate(id: UUID): Gate | undefined {
    return this.gates.get(id);
  }

  getGatesByFacility(facilityId: UUID): Gate[] {
    const gateIds = this.gatesByFacility.get(facilityId);
    if (!gateIds) return [];
    return Array.from(gateIds).map(id => this.gates.get(id)!).filter(Boolean);
  }

  getLane(id: UUID): GateLane | undefined {
    return this.lanes.get(id);
  }

  getLanesByGate(gateId: UUID): GateLane[] {
    const laneIds = this.lanesByGate.get(gateId);
    if (!laneIds) return [];
    return Array.from(laneIds).map(id => this.lanes.get(id)!).filter(Boolean);
  }

  setLaneStatus(laneId: UUID, status: 'open' | 'closed' | 'maintenance'): OperationResult<GateLane> {
    const lane = this.lanes.get(laneId);
    if (!lane) {
      return { success: false, error: 'Lane not found', errorCode: 'LANE_NOT_FOUND' };
    }

    lane.status = status;

    emit('gate.lane_status_changed', { laneId, status }, {
      facilityId: this.gates.get(lane.gateId)?.facilityId ?? '',
      source: 'GateEngine',
    });

    return { success: true, data: lane };
  }

  // ===========================================================================
  // APPOINTMENTS
  // ===========================================================================

  createAppointment(input: CreateAppointmentInput): OperationResult<TruckAppointment> {
    this.appointmentCounter++;
    const appointmentNumber = `APT-${Date.now().toString(36).toUpperCase()}-${this.appointmentCounter.toString().padStart(5, '0')}`;

    const appointment: TruckAppointment = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      appointmentNumber,
      appointmentType: input.appointmentType,
      scheduledTime: input.scheduledTime,
      windowStart: input.windowStart ?? new Date(input.scheduledTime.getTime() - 30 * 60000),
      windowEnd: input.windowEnd ?? new Date(input.scheduledTime.getTime() + 60 * 60000),
      transporterId: input.transporterId,
      transporterName: input.transporterName,
      truckNumber: input.truckNumber,
      trailerNumber: input.trailerNumber,
      driverName: input.driverName,
      driverLicense: input.driverLicense,
      driverPhone: input.driverPhone,
      driverPhoto: input.driverPhoto,
      containers: (input.containers ?? []).map(c => ({
        ...c,
        status: 'pending' as const,
      })),
      totalContainers: input.containers?.length ?? 0,
      deliveryOrderId: input.deliveryOrderId,
      deliveryOrderNumber: input.deliveryOrderNumber,
      eWayBillNumber: input.eWayBillNumber,
      lrNumber: input.lrNumber,
      status: 'scheduled',
      instructions: input.instructions,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.appointments.set(appointment.id, appointment);

    // Index by facility
    if (!this.appointmentsByFacility.has(input.facilityId)) {
      this.appointmentsByFacility.set(input.facilityId, new Set());
    }
    this.appointmentsByFacility.get(input.facilityId)?.add(appointment.id);

    // Index by date
    const dateKey = input.scheduledTime.toISOString().split('T')[0] ?? '';
    if (dateKey && !this.appointmentsByDate.has(dateKey)) {
      this.appointmentsByDate.set(dateKey, new Set());
    }
    if (dateKey) {
      this.appointmentsByDate.get(dateKey)?.add(appointment.id);
    }

    emit('gate.appointment_created', { appointment }, {
      facilityId: input.facilityId,
      tenantId: input.tenantId,
      source: 'GateEngine',
    });

    return { success: true, data: appointment };
  }

  getAppointment(id: UUID): TruckAppointment | undefined {
    return this.appointments.get(id);
  }

  getAppointmentsByFacility(facilityId: UUID, date?: Date): TruckAppointment[] {
    if (date) {
      const dateKey = date.toISOString().split('T')[0] ?? '';
      const appointmentIds = dateKey ? this.appointmentsByDate.get(dateKey) : undefined;
      if (!appointmentIds) return [];

      return Array.from(appointmentIds)
        .map(id => this.appointments.get(id)!)
        .filter(a => a && a.facilityId === facilityId)
        .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
    }

    const appointmentIds = this.appointmentsByFacility.get(facilityId);
    if (!appointmentIds) return [];

    return Array.from(appointmentIds)
      .map(id => this.appointments.get(id)!)
      .filter(Boolean)
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }

  updateAppointmentStatus(id: UUID, status: AppointmentStatus): OperationResult<TruckAppointment> {
    const appointment = this.appointments.get(id);
    if (!appointment) {
      return { success: false, error: 'Appointment not found', errorCode: 'APPOINTMENT_NOT_FOUND' };
    }

    appointment.status = status;
    appointment.updatedAt = new Date();

    if (status === 'arrived') {
      appointment.actualArrival = new Date();
    } else if (status === 'check_in') {
      appointment.checkInTime = new Date();
    } else if (status === 'completed') {
      appointment.checkOutTime = new Date();
    }

    emit('gate.appointment_status_changed', { appointment, status }, {
      facilityId: appointment.facilityId,
      tenantId: appointment.tenantId,
      source: 'GateEngine',
    });

    return { success: true, data: appointment };
  }

  // ===========================================================================
  // GATE TRANSACTIONS
  // ===========================================================================

  startGateIn(input: StartGateInInput): OperationResult<GateTransaction> {
    const gate = this.gates.get(input.gateId);
    if (!gate) {
      return { success: false, error: 'Gate not found', errorCode: 'GATE_NOT_FOUND' };
    }

    const lane = this.lanes.get(input.laneId);
    if (!lane || lane.gateId !== input.gateId) {
      return { success: false, error: 'Lane not found', errorCode: 'LANE_NOT_FOUND' };
    }

    if (lane.status !== 'open') {
      return { success: false, error: 'Lane is not open', errorCode: 'LANE_CLOSED' };
    }

    this.transactionCounter++;
    const transactionNumber = `GI-${Date.now().toString(36).toUpperCase()}-${this.transactionCounter.toString().padStart(6, '0')}`;

    const transaction: GateTransaction = {
      id: uuidv4(),
      tenantId: gate.tenantId,
      facilityId: gate.facilityId,
      transactionNumber,
      transactionType: 'GATE_IN',
      gateId: input.gateId,
      laneId: input.laneId,
      truckNumber: input.truckNumber,
      trailerNumber: input.trailerNumber,
      driverName: input.driverName,
      driverLicense: input.driverLicense,
      driverPhone: input.driverPhone,
      driverPhoto: input.driverPhoto,
      containerNumber: input.containerNumber,
      containerSize: input.containerSize,
      containerISOType: input.containerISOType,
      containers: input.containers ?? [],
      sealNumbers: input.sealNumbers,
      containerCondition: input.containerCondition,
      appointmentId: input.appointmentId,
      deliveryOrderNumber: input.deliveryOrderNumber,
      eWayBillNumber: input.eWayBillNumber,
      lrNumber: input.lrNumber,
      photos: [],
      arrivalTime: new Date(),
      status: 'vehicle_at_gate',
      statusHistory: [
        { status: 'vehicle_at_gate', timestamp: new Date() },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.transactions.set(transaction.id, transaction);

    // Index
    if (!this.transactionsByFacility.has(gate.facilityId)) {
      this.transactionsByFacility.set(gate.facilityId, new Set());
    }
    this.transactionsByFacility.get(gate.facilityId)?.add(transaction.id);

    // Mark lane as busy
    this.activeTransactionsByLane.set(input.laneId, transaction.id);
    lane.currentTransaction = transaction.id;

    // Update appointment if linked
    if (input.appointmentId) {
      this.updateAppointmentStatus(input.appointmentId, 'arrived');
    }

    emit('gate.vehicle_arrived', {
      transactionId: transaction.id,
      truckNumber: input.truckNumber,
      containerNumber: input.containerNumber,
    }, {
      facilityId: gate.facilityId,
      tenantId: gate.tenantId,
      source: 'GateEngine',
    });

    return { success: true, data: transaction };
  }

  startGateOut(input: StartGateOutInput): OperationResult<GateTransaction> {
    const gate = this.gates.get(input.gateId);
    if (!gate) {
      return { success: false, error: 'Gate not found', errorCode: 'GATE_NOT_FOUND' };
    }

    const lane = this.lanes.get(input.laneId);
    if (!lane || lane.gateId !== input.gateId) {
      return { success: false, error: 'Lane not found', errorCode: 'LANE_NOT_FOUND' };
    }

    if (lane.status !== 'open') {
      return { success: false, error: 'Lane is not open', errorCode: 'LANE_CLOSED' };
    }

    // Validate container is at facility
    const containerEngine = getContainerEngine();
    const container = containerEngine.getContainerByNumber(input.containerNumber);
    if (!container) {
      return { success: false, error: 'Container not found', errorCode: 'CONTAINER_NOT_FOUND' };
    }

    if (container.facilityId !== gate.facilityId) {
      return { success: false, error: 'Container not at this facility', errorCode: 'CONTAINER_WRONG_FACILITY' };
    }

    // Check for holds (active holds are those without a releasedAt date)
    const activeHolds = container.holds?.filter(h => !h.releasedAt) ?? [];
    if (activeHolds.length > 0) {
      return {
        success: false,
        error: `Container has active holds: ${activeHolds.map(h => h.type).join(', ')}`,
        errorCode: 'CONTAINER_ON_HOLD',
      };
    }

    this.transactionCounter++;
    const transactionNumber = `GO-${Date.now().toString(36).toUpperCase()}-${this.transactionCounter.toString().padStart(6, '0')}`;

    const transaction: GateTransaction = {
      id: uuidv4(),
      tenantId: gate.tenantId,
      facilityId: gate.facilityId,
      transactionNumber,
      transactionType: 'GATE_OUT',
      gateId: input.gateId,
      laneId: input.laneId,
      truckNumber: input.truckNumber,
      trailerNumber: input.trailerNumber,
      driverName: input.driverName,
      driverLicense: input.driverLicense,
      driverPhone: input.driverPhone,
      containerId: container.id,
      containerNumber: container.containerNumber,
      containerSize: container.size,
      containerISOType: container.isoType as ContainerISOType,
      containers: [{
        containerId: container.id,
        containerNumber: container.containerNumber,
        containerSize: container.size,
        operation: 'out',
        status: 'pending',
      }],
      appointmentId: input.appointmentId,
      deliveryOrderNumber: input.deliveryOrderNumber,
      eWayBillNumber: input.eWayBillNumber,
      blNumber: input.blNumber,
      photos: [],
      arrivalTime: new Date(),
      status: 'vehicle_at_gate',
      statusHistory: [
        { status: 'vehicle_at_gate', timestamp: new Date() },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.transactions.set(transaction.id, transaction);

    // Index
    if (!this.transactionsByFacility.has(gate.facilityId)) {
      this.transactionsByFacility.set(gate.facilityId, new Set());
    }
    this.transactionsByFacility.get(gate.facilityId)?.add(transaction.id);

    // Mark lane as busy
    this.activeTransactionsByLane.set(input.laneId, transaction.id);
    lane.currentTransaction = transaction.id;

    emit('gate.gateout_started', {
      transactionId: transaction.id,
      containerId: container.id,
      containerNumber: container.containerNumber,
    }, {
      facilityId: gate.facilityId,
      tenantId: gate.tenantId,
      source: 'GateEngine',
    });

    return { success: true, data: transaction };
  }

  // Process document check
  processDocumentCheck(transactionId: UUID, passed: boolean, notes?: string): OperationResult<GateTransaction> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return { success: false, error: 'Transaction not found', errorCode: 'NOT_FOUND' };
    }

    transaction.documentCheckTime = new Date();
    transaction.status = passed ? 'physical_inspection' : 'rejected';
    transaction.statusHistory.push({
      status: transaction.status,
      timestamp: new Date(),
      reason: passed ? undefined : notes,
    });
    transaction.updatedAt = new Date();

    if (!passed) {
      transaction.rejectionReason = notes;
    }

    emit('gate.document_check_completed', {
      transactionId,
      passed,
      notes,
    }, {
      facilityId: transaction.facilityId,
      tenantId: transaction.tenantId,
      source: 'GateEngine',
    });

    return { success: true, data: transaction };
  }

  // Add OCR capture
  addOCRCapture(transactionId: UUID, capture: Omit<OCRCapture, 'id' | 'transactionId'>): OperationResult<GateTransaction> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return { success: false, error: 'Transaction not found', errorCode: 'NOT_FOUND' };
    }

    const ocrCapture: OCRCapture = {
      id: uuidv4(),
      transactionId,
      ...capture,
    };

    transaction.ocrCapture = ocrCapture;
    transaction.updatedAt = new Date();

    emit('gate.ocr_captured', {
      transactionId,
      licensePlate: capture.licensePlate,
      containerNumber: capture.containerNumber,
      confidence: {
        licensePlate: capture.licensePlateConfidence,
        container: capture.containerConfidence,
      },
    }, {
      facilityId: transaction.facilityId,
      tenantId: transaction.tenantId,
      source: 'GateEngine',
    });

    return { success: true, data: transaction };
  }

  // Add RFID capture
  addRFIDCapture(transactionId: UUID, capture: Omit<RFIDCapture, 'id' | 'transactionId'>): OperationResult<GateTransaction> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return { success: false, error: 'Transaction not found', errorCode: 'NOT_FOUND' };
    }

    const rfidCapture: RFIDCapture = {
      id: uuidv4(),
      transactionId,
      ...capture,
    };

    transaction.rfidCapture = rfidCapture;
    transaction.updatedAt = new Date();

    emit('gate.rfid_detected', {
      transactionId,
      tagId: capture.tagId,
      tagType: capture.tagType,
      vehicleNumber: capture.vehicleNumber,
    }, {
      facilityId: transaction.facilityId,
      tenantId: transaction.tenantId,
      source: 'GateEngine',
    });

    return { success: true, data: transaction };
  }

  // Add weighbridge data
  addWeighbridgeData(transactionId: UUID, data: Omit<WeighbridgeCapture, 'id' | 'transactionId'>): OperationResult<GateTransaction> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return { success: false, error: 'Transaction not found', errorCode: 'NOT_FOUND' };
    }

    const weighbridgeData: WeighbridgeCapture = {
      id: uuidv4(),
      transactionId,
      ...data,
    };

    transaction.weighbridgeData = weighbridgeData;
    transaction.weighingTime = new Date();
    transaction.updatedAt = new Date();

    emit('gate.weighed', {
      transactionId,
      grossWeight: data.grossWeight,
      netWeight: data.netWeight,
    }, {
      facilityId: transaction.facilityId,
      tenantId: transaction.tenantId,
      source: 'GateEngine',
    });

    return { success: true, data: transaction };
  }

  // Add photo
  addPhoto(transactionId: UUID, photo: Omit<GatePhoto, 'id' | 'transactionId'>): OperationResult<GateTransaction> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return { success: false, error: 'Transaction not found', errorCode: 'NOT_FOUND' };
    }

    const gatePhoto: GatePhoto = {
      id: uuidv4(),
      transactionId,
      ...photo,
    };

    transaction.photos.push(gatePhoto);
    transaction.updatedAt = new Date();

    return { success: true, data: transaction };
  }

  // Record inspection
  recordInspection(transactionId: UUID, result: InspectionResult): OperationResult<GateTransaction> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return { success: false, error: 'Transaction not found', errorCode: 'NOT_FOUND' };
    }

    transaction.inspectionResult = result;
    transaction.inspectionTime = new Date();
    transaction.status = result.passed ? 'approved' : 'rejected';
    transaction.statusHistory.push({
      status: transaction.status,
      timestamp: new Date(),
      reason: result.passed ? undefined : result.failureReasons?.join(', '),
    });
    transaction.updatedAt = new Date();

    if (!result.passed) {
      transaction.rejectionReason = result.failureReasons?.join(', ');
    }

    emit('gate.inspection_completed', {
      transactionId,
      passed: result.passed,
      damageFound: result.damageFound,
    }, {
      facilityId: transaction.facilityId,
      tenantId: transaction.tenantId,
      source: 'GateEngine',
    });

    return { success: true, data: transaction };
  }

  // Complete gate-in
  completeGateIn(transactionId: UUID, operatorId?: string): OperationResult<GateTransaction> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return { success: false, error: 'Transaction not found', errorCode: 'NOT_FOUND' };
    }

    if (transaction.transactionType !== 'GATE_IN') {
      return { success: false, error: 'Not a gate-in transaction', errorCode: 'INVALID_TYPE' };
    }

    if (!['approved', 'physical_inspection'].includes(transaction.status)) {
      return { success: false, error: 'Transaction not ready for completion', errorCode: 'INVALID_STATUS' };
    }

    // Process the container gate-in
    const containerEngine = getContainerEngine();

    if (transaction.containerNumber) {
      // First check if container exists, if not register it
      let container = containerEngine.getContainerByNumber(transaction.containerNumber);

      if (!container) {
        // Register the container first
        const registerResult = containerEngine.registerContainer({
          containerNumber: transaction.containerNumber,
          isoType: (transaction.containerISOType ?? '22G1') as ContainerISOType,
          facilityId: transaction.facilityId,
          tenantId: transaction.tenantId,
          owner: transaction.containerNumber.substring(0, 4).toUpperCase(), // Owner code from container number
          sealNumbers: transaction.sealNumbers,
          grossWeight: transaction.weighbridgeData?.netWeight,
        });

        if (!registerResult.success) {
          return { success: false, error: registerResult.error, errorCode: registerResult.errorCode };
        }

        container = registerResult.data!;
      }

      // Now gate in the container
      const gateInResult = containerEngine.gateIn(container.id, {
        gateId: transaction.gateId,
        laneId: transaction.laneId,
        truckNumber: transaction.truckNumber,
        driverName: transaction.driverName,
        driverLicense: transaction.driverLicense,
        driverPhone: transaction.driverPhone,
        condition: transaction.containerCondition ?? 'sound',
        deliveryOrderNumber: transaction.deliveryOrderNumber,
        eWayBillNumber: transaction.eWayBillNumber,
      });

      if (!gateInResult.success) {
        return { success: false, error: gateInResult.error, errorCode: gateInResult.errorCode };
      }

      transaction.containerId = container.id;
    }

    // Complete the transaction
    transaction.status = 'completed';
    transaction.completionTime = new Date();
    transaction.totalProcessingMinutes = Math.round(
      (transaction.completionTime.getTime() - transaction.arrivalTime.getTime()) / 60000
    );
    transaction.approvedBy = operatorId;
    transaction.statusHistory.push({
      status: 'completed',
      timestamp: new Date(),
      changedBy: operatorId,
    });
    transaction.updatedAt = new Date();

    // Update containers
    for (const c of transaction.containers) {
      c.status = 'processed';
    }

    // Free up lane
    const lane = this.lanes.get(transaction.laneId);
    if (lane) {
      lane.currentTransaction = undefined;
      this.activeTransactionsByLane.delete(transaction.laneId);
    }

    // Update appointment
    if (transaction.appointmentId) {
      this.updateAppointmentStatus(transaction.appointmentId, 'check_in');
    }

    emit('gate.gatein_completed', {
      transactionId: transaction.id,
      containerId: transaction.containerId,
      containerNumber: transaction.containerNumber,
      processingMinutes: transaction.totalProcessingMinutes,
    }, {
      facilityId: transaction.facilityId,
      tenantId: transaction.tenantId,
      source: 'GateEngine',
    });

    return { success: true, data: transaction };
  }

  // Complete gate-out
  completeGateOut(transactionId: UUID, operatorId?: string): OperationResult<GateTransaction> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return { success: false, error: 'Transaction not found', errorCode: 'NOT_FOUND' };
    }

    if (transaction.transactionType !== 'GATE_OUT') {
      return { success: false, error: 'Not a gate-out transaction', errorCode: 'INVALID_TYPE' };
    }

    if (!['approved', 'physical_inspection', 'weighing'].includes(transaction.status)) {
      return { success: false, error: 'Transaction not ready for completion', errorCode: 'INVALID_STATUS' };
    }

    // Process the container gate-out
    const containerEngine = getContainerEngine();

    if (transaction.containerId) {
      const result = containerEngine.gateOut(transaction.containerId, {
        gateId: transaction.gateId,
        laneId: transaction.laneId,
        truckNumber: transaction.truckNumber,
        driverName: transaction.driverName,
        driverLicense: transaction.driverLicense,
        driverPhone: transaction.driverPhone,
        deliveryOrderNumber: transaction.deliveryOrderNumber,
        eWayBillNumber: transaction.eWayBillNumber,
      });

      if (!result.success) {
        return { success: false, error: result.error, errorCode: result.errorCode };
      }
    }

    // Complete the transaction
    transaction.status = 'completed';
    transaction.completionTime = new Date();
    transaction.totalProcessingMinutes = Math.round(
      (transaction.completionTime.getTime() - transaction.arrivalTime.getTime()) / 60000
    );
    transaction.approvedBy = operatorId;
    transaction.statusHistory.push({
      status: 'completed',
      timestamp: new Date(),
      changedBy: operatorId,
    });
    transaction.updatedAt = new Date();

    // Update containers
    for (const c of transaction.containers) {
      c.status = 'processed';
    }

    // Free up lane
    const lane = this.lanes.get(transaction.laneId);
    if (lane) {
      lane.currentTransaction = undefined;
      this.activeTransactionsByLane.delete(transaction.laneId);
    }

    // Update appointment
    if (transaction.appointmentId) {
      this.updateAppointmentStatus(transaction.appointmentId, 'completed');
    }

    emit('gate.gateout_completed', {
      transactionId: transaction.id,
      containerId: transaction.containerId,
      containerNumber: transaction.containerNumber,
      processingMinutes: transaction.totalProcessingMinutes,
    }, {
      facilityId: transaction.facilityId,
      tenantId: transaction.tenantId,
      source: 'GateEngine',
    });

    return { success: true, data: transaction };
  }

  // Cancel transaction
  cancelTransaction(transactionId: UUID, reason: string): OperationResult<GateTransaction> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return { success: false, error: 'Transaction not found', errorCode: 'NOT_FOUND' };
    }

    if (transaction.status === 'completed') {
      return { success: false, error: 'Cannot cancel completed transaction', errorCode: 'INVALID_STATUS' };
    }

    transaction.status = 'cancelled';
    transaction.rejectionReason = reason;
    transaction.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      reason,
    });
    transaction.updatedAt = new Date();

    // Free up lane
    const lane = this.lanes.get(transaction.laneId);
    if (lane) {
      lane.currentTransaction = undefined;
      this.activeTransactionsByLane.delete(transaction.laneId);
    }

    emit('gate.transaction_cancelled', {
      transactionId: transaction.id,
      reason,
    }, {
      facilityId: transaction.facilityId,
      tenantId: transaction.tenantId,
      source: 'GateEngine',
    });

    return { success: true, data: transaction };
  }

  // ===========================================================================
  // QUERIES
  // ===========================================================================

  getTransaction(id: UUID): GateTransaction | undefined {
    return this.transactions.get(id);
  }

  getTransactionsByFacility(facilityId: UUID, options?: TransactionQueryOptions): GateTransaction[] {
    const transactionIds = this.transactionsByFacility.get(facilityId);
    if (!transactionIds) return [];

    let transactions = Array.from(transactionIds)
      .map(id => this.transactions.get(id)!)
      .filter(Boolean);

    if (options?.type) {
      transactions = transactions.filter(t => t.transactionType === options.type);
    }

    if (options?.status) {
      transactions = transactions.filter(t => t.status === options.status);
    }

    if (options?.fromDate) {
      transactions = transactions.filter(t => t.arrivalTime >= options.fromDate!);
    }

    if (options?.toDate) {
      transactions = transactions.filter(t => t.arrivalTime <= options.toDate!);
    }

    return transactions.sort((a, b) => b.arrivalTime.getTime() - a.arrivalTime.getTime());
  }

  getActiveTransactions(facilityId: UUID): GateTransaction[] {
    return this.getTransactionsByFacility(facilityId, {})
      .filter(t => !['completed', 'cancelled', 'rejected'].includes(t.status));
  }

  // ===========================================================================
  // QUEUE MANAGEMENT
  // ===========================================================================

  getGateQueue(gateId: UUID): GateQueue | undefined {
    const gate = this.gates.get(gateId);
    if (!gate) return undefined;

    const lanes = this.getLanesByGate(gateId);
    let totalVehicles = 0;
    let totalWaitMinutes = 0;
    let vehicleCount = 0;

    const laneQueues: LaneQueue[] = lanes.map(lane => {
      const activeTransactionId = this.activeTransactionsByLane.get(lane.id);
      const activeTransaction = activeTransactionId ? this.transactions.get(activeTransactionId) : undefined;

      const queueItems: QueueItem[] = [];

      if (activeTransaction) {
        const waitingMinutes = Math.round(
          (Date.now() - activeTransaction.arrivalTime.getTime()) / 60000
        );
        queueItems.push({
          transactionId: activeTransaction.id,
          appointmentId: activeTransaction.appointmentId,
          truckNumber: activeTransaction.truckNumber,
          driverName: activeTransaction.driverName,
          containerNumber: activeTransaction.containerNumber,
          arrivalTime: activeTransaction.arrivalTime,
          waitingMinutes,
          priority: activeTransaction.appointmentId ? 10 : 5,
          hasAppointment: !!activeTransaction.appointmentId,
        });
        totalVehicles++;
        totalWaitMinutes += waitingMinutes;
        vehicleCount++;
      }

      return {
        laneId: lane.id,
        laneNumber: lane.laneNumber,
        laneType: lane.laneType,
        vehiclesWaiting: queueItems.length,
        averageWaitMinutes: queueItems.length > 0
          ? queueItems.reduce((sum, q) => sum + q.waitingMinutes, 0) / queueItems.length
          : 0,
        currentProcessingTime: activeTransaction
          ? Math.round((Date.now() - activeTransaction.arrivalTime.getTime()) / 60000)
          : undefined,
        queue: queueItems,
      };
    });

    return {
      gateId,
      timestamp: new Date(),
      totalVehicles,
      averageWaitTime: vehicleCount > 0 ? totalWaitMinutes / vehicleCount : 0,
      estimatedThroughput: lanes.filter(l => l.status === 'open').length * 4, // ~4 per hour per lane
      laneQueues,
      isHighVolume: totalVehicles > lanes.length * 2,
      isCongested: totalVehicles > lanes.length * 3,
    };
  }

  // ===========================================================================
  // METRICS
  // ===========================================================================

  getGateMetrics(gateId: UUID, date: Date): GateMetrics {
    const gate = this.gates.get(gateId);
    if (!gate) {
      return this.emptyMetrics(gateId, date);
    }

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const transactions = this.getTransactionsByFacility(gate.facilityId, {
      fromDate: dayStart,
      toDate: dayEnd,
    }).filter(t => t.gateId === gateId && t.status === 'completed');

    const gateInCount = transactions.filter(t => t.transactionType === 'GATE_IN').length;
    const gateOutCount = transactions.filter(t => t.transactionType === 'GATE_OUT').length;

    const processingTimes = transactions
      .filter(t => t.totalProcessingMinutes)
      .map(t => t.totalProcessingMinutes!);

    const hourlyVolume: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourlyVolume[i] = 0;

    for (const t of transactions) {
      const hour = t.arrivalTime.getHours();
      hourlyVolume[hour] = (hourlyVolume[hour] || 0) + 1;
    }

    const peakHour = Object.entries(hourlyVolume)
      .sort((a, b) => b[1] - a[1])[0];

    const rejectedTransactions = this.getTransactionsByFacility(gate.facilityId, {
      fromDate: dayStart,
      toDate: dayEnd,
    }).filter(t => t.gateId === gateId && t.status === 'rejected');

    const rejectionReasons: Record<string, number> = {};
    for (const t of rejectedTransactions) {
      const reason = t.rejectionReason || 'unknown';
      rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1;
    }

    const ocrCaptures = transactions.filter(t => t.ocrCapture).length;
    const ocrSuccessful = transactions
      .filter(t => t.ocrCapture && t.ocrCapture.containerConfidence >= 90)
      .length;

    const appointmentTransactions = transactions.filter(t => t.appointmentId);

    return {
      gateId,
      date,
      totalTransactions: transactions.length,
      gateInCount,
      gateOutCount,
      peakHourVolume: peakHour ? Number(peakHour[1]) : 0,
      peakHour: peakHour ? Number(peakHour[0]) : 0,
      averageProcessingMinutes: processingTimes.length > 0
        ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
        : 0,
      minProcessingMinutes: processingTimes.length > 0 ? Math.min(...processingTimes) : 0,
      maxProcessingMinutes: processingTimes.length > 0 ? Math.max(...processingTimes) : 0,
      averageQueueLength: 0, // Would need historical queue data
      maxQueueLength: 0,
      averageWaitMinutes: 0,
      maxWaitMinutes: 0,
      appointmentCount: appointmentTransactions.length,
      appointmentOnTimePercent: 0, // Would need appointment timing analysis
      noShowCount: 0,
      rejectedCount: rejectedTransactions.length,
      rejectionReasons,
      ocrCaptureCount: ocrCaptures,
      ocrSuccessRate: ocrCaptures > 0 ? (ocrSuccessful / ocrCaptures) * 100 : 0,
      hourlyVolume,
    };
  }

  private emptyMetrics(gateId: UUID, date: Date): GateMetrics {
    return {
      gateId,
      date,
      totalTransactions: 0,
      gateInCount: 0,
      gateOutCount: 0,
      peakHourVolume: 0,
      peakHour: 0,
      averageProcessingMinutes: 0,
      minProcessingMinutes: 0,
      maxProcessingMinutes: 0,
      averageQueueLength: 0,
      maxQueueLength: 0,
      averageWaitMinutes: 0,
      maxWaitMinutes: 0,
      appointmentCount: 0,
      appointmentOnTimePercent: 0,
      noShowCount: 0,
      rejectedCount: 0,
      rejectionReasons: {},
      ocrCaptureCount: 0,
      ocrSuccessRate: 0,
      hourlyVolume: {},
    };
  }
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface RegisterGateInput {
  tenantId: string;
  facilityId: UUID;
  gateId: string;
  name: string;
  gateType?: 'main' | 'rail' | 'emergency' | 'vip';
  coordinates?: { lat: number; lng: number };
  hasWeighbridge?: boolean;
  weighbridgeCapacity?: number;
  hasOCR?: boolean;
  hasRFID?: boolean;
  operatingHours?: Gate['operatingHours'];
  is24x7?: boolean;
}

export interface AddLaneInput {
  gateId: UUID;
  laneNumber: string;
  laneType: 'in' | 'out' | 'both';
  hasOCR?: boolean;
  hasRFID?: boolean;
  hasWeighbridge?: boolean;
  hasBoomBarrier?: boolean;
}

export interface CreateAppointmentInput {
  tenantId: string;
  facilityId: UUID;
  appointmentType: 'pickup' | 'delivery' | 'both';
  scheduledTime: Date;
  windowStart?: Date;
  windowEnd?: Date;
  transporterId: UUID;
  transporterName: string;
  truckNumber: string;
  trailerNumber?: string;
  driverName: string;
  driverLicense: string;
  driverPhone: string;
  driverPhoto?: string;
  containers?: { containerNumber: string; isoType: string; operation: 'pickup' | 'delivery' }[];
  deliveryOrderId?: UUID;
  deliveryOrderNumber?: string;
  eWayBillNumber?: string;
  lrNumber?: string;
  instructions?: string;
}

export interface StartGateInInput {
  gateId: UUID;
  laneId: UUID;
  truckNumber: string;
  trailerNumber?: string;
  driverName: string;
  driverLicense: string;
  driverPhone: string;
  driverPhoto?: string;
  containerNumber?: string;
  containerSize?: ContainerSize;
  containerISOType?: ContainerISOType;
  containers?: GateTransactionContainer[];
  sealNumbers?: string[];
  containerCondition?: ContainerCondition;
  appointmentId?: UUID;
  deliveryOrderNumber?: string;
  eWayBillNumber?: string;
  lrNumber?: string;
}

export interface StartGateOutInput {
  gateId: UUID;
  laneId: UUID;
  truckNumber: string;
  trailerNumber?: string;
  driverName: string;
  driverLicense: string;
  driverPhone: string;
  containerNumber: string;
  appointmentId?: UUID;
  deliveryOrderNumber?: string;
  eWayBillNumber?: string;
  blNumber?: string;
}

export interface TransactionQueryOptions {
  type?: GateTransactionType;
  status?: GateTransactionStatus;
  fromDate?: Date;
  toDate?: Date;
}

// ============================================================================
// SINGLETON
// ============================================================================

let gateEngineInstance: GateEngine | null = null;

export function getGateEngine(): GateEngine {
  if (!gateEngineInstance) {
    gateEngineInstance = new GateEngine();
  }
  return gateEngineInstance;
}

export function setGateEngine(engine: GateEngine): void {
  gateEngineInstance = engine;
}
