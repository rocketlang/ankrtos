// =============================================================================
// ankrICD - Operations Engine
// =============================================================================
// Manages container stuffing/destuffing, LCL consolidation, FCL handling,
// cross-docking, and cargo inspection operations.
// =============================================================================

import type { UUID, OperationResult } from '../types/common';
import type {
  StuffingOperation,
  StuffingStatus,
  DestuffingOperation,
  DestuffingStatus,
  LCLConsolidation,
  ConsolidationStatus,
  LCLConsignment,
  FCLOperation,
  FCLStatus,
  FCLOperationType,
  CrossDockOperation,
  CrossDockStatus,
  CargoInspection,
  CargoInspectionStatus,
  CargoInspectionResult,
  CargoItem,
  OperationsStats,
} from '../types/operations';
import { emit } from '../core/event-bus';

// =============================================================================
// INPUT TYPES
// =============================================================================

export interface CreateStuffingInput {
  tenantId: string;
  facilityId: UUID;
  containerId: UUID;
  containerNumber: string;
  containerSize: '20' | '40' | '45';
  containerType: string;
  isoType: string;
  stuffingType?: 'full_stuffing' | 'partial_stuffing' | 'consolidation';
  cargoItems?: CargoItem[];
  bookingRef?: string;
  blNumber?: string;
  customerId?: UUID;
  warehouseId?: UUID;
  dockDoor?: string;
  plannedStartTime?: Date;
  plannedEndTime?: Date;
  supervisorId?: string;
  supervisorName?: string;
}

export interface CreateDestuffingInput {
  tenantId: string;
  facilityId: UUID;
  containerId: UUID;
  containerNumber: string;
  containerSize: '20' | '40' | '45';
  destuffingType?: 'full_destuffing' | 'partial_destuffing' | 'deconsolidation';
  totalPackagesExpected: number;
  totalGrossWeightExpected: number;
  blNumber?: string;
  billOfEntryId?: UUID;
  customerId?: UUID;
  warehouseId?: UUID;
  dockDoor?: string;
  plannedStartTime?: Date;
  plannedEndTime?: Date;
  supervisorId?: string;
  supervisorName?: string;
  originalSealNumber?: string;
}

export interface CreateConsolidationInput {
  tenantId: string;
  facilityId: UUID;
  containerSize: '20' | '40' | '45';
  containerType?: string;
  portOfLoading: string;
  portOfDischarge: string;
  finalDestination?: string;
  cutoffDate?: Date;
  maxWeight?: number;
  maxVolume?: number;
}

export interface AddConsignmentInput {
  consolidationId: UUID;
  consignmentNumber: string;
  shipperId: UUID;
  shipperName: string;
  consigneeName: string;
  cargoItems: CargoItem[];
  packages: number;
  grossWeight: number;
  volume: number;
  houseBlNumber?: string;
  shippingBillNumber?: string;
}

export interface CreateFCLOperationInput {
  tenantId: string;
  facilityId: UUID;
  containerId: UUID;
  containerNumber: string;
  containerSize: '20' | '40' | '45';
  operationType: FCLOperationType;
  fromLocation: string;
  toLocation: string;
  transportMode: 'road' | 'rail' | 'vessel';
  blNumber?: string;
  deliveryOrderId?: string;
  bookingRef?: string;
  customerId?: UUID;
  plannedDate?: Date;
}

export interface CreateCrossDockInput {
  tenantId: string;
  facilityId: UUID;
  inboundContainerNumber?: string;
  inboundTransportMode: 'road' | 'rail' | 'vessel';
  inboundRef?: string;
  outboundTransportMode: 'road' | 'rail' | 'vessel';
  outboundRef?: string;
  cargoItems?: CargoItem[];
  totalPackages?: number;
  totalWeight?: number;
  stagingArea?: string;
  plannedReceiveTime?: Date;
  plannedDispatchTime?: Date;
}

export interface CreateInspectionInput {
  tenantId: string;
  facilityId: UUID;
  inspectionType: CargoInspection['inspectionType'];
  containerId?: UUID;
  containerNumber?: string;
  operationId?: UUID;
  operationType?: 'stuffing' | 'destuffing' | 'cross_dock';
  inspectorId: string;
  inspectorName: string;
  inspectorOrganization?: string;
  scheduledDate?: Date;
  sealNumber?: string;
  declaredWeight?: number;
}

export interface StuffingQueryOptions {
  tenantId?: string;
  facilityId?: UUID;
  status?: StuffingStatus;
  containerId?: UUID;
  page?: number;
  pageSize?: number;
}

export interface DestuffingQueryOptions {
  tenantId?: string;
  facilityId?: UUID;
  status?: DestuffingStatus;
  containerId?: UUID;
  page?: number;
  pageSize?: number;
}

export interface ConsolidationQueryOptions {
  tenantId?: string;
  facilityId?: UUID;
  status?: ConsolidationStatus;
  page?: number;
  pageSize?: number;
}

export interface FCLQueryOptions {
  tenantId?: string;
  facilityId?: UUID;
  status?: FCLStatus;
  operationType?: FCLOperationType;
  page?: number;
  pageSize?: number;
}

export interface CrossDockQueryOptions {
  tenantId?: string;
  facilityId?: UUID;
  status?: CrossDockStatus;
  page?: number;
  pageSize?: number;
}

export interface InspectionQueryOptions {
  tenantId?: string;
  facilityId?: UUID;
  status?: CargoInspectionStatus;
  inspectionType?: CargoInspection['inspectionType'];
  containerId?: UUID;
  page?: number;
  pageSize?: number;
}

// =============================================================================
// HELPERS
// =============================================================================

let counter = 0;
function nextId(): UUID {
  return `ops-${Date.now()}-${++counter}`;
}

function genNumber(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${(++counter).toString().padStart(4, '0')}`;
}

// Max payload capacities (metric tons)
const MAX_PAYLOAD: Record<string, number> = { '20': 21.8, '40': 26.6, '45': 27.6 };
// Internal volume CBM
const MAX_VOLUME: Record<string, number> = { '20': 33.2, '40': 67.7, '45': 76.3 };

// =============================================================================
// OPERATIONS ENGINE
// =============================================================================

export class OperationsEngine {
  private stuffingOps = new Map<UUID, StuffingOperation>();
  private destuffingOps = new Map<UUID, DestuffingOperation>();
  private consolidations = new Map<UUID, LCLConsolidation>();
  private fclOps = new Map<UUID, FCLOperation>();
  private crossDocks = new Map<UUID, CrossDockOperation>();
  private inspections = new Map<UUID, CargoInspection>();

  // ===========================================================================
  // STUFFING
  // ===========================================================================

  createStuffing(input: CreateStuffingInput): OperationResult<StuffingOperation> {
    const id = nextId();
    const op: StuffingOperation = {
      id,
      tenantId: input.tenantId,
      operationNumber: genNumber('STF'),
      facilityId: input.facilityId,
      containerId: input.containerId,
      containerNumber: input.containerNumber,
      containerSize: input.containerSize,
      containerType: input.containerType as any,
      isoType: input.isoType as any,
      stuffingType: input.stuffingType ?? 'full_stuffing',
      status: 'planned',
      cargoItems: input.cargoItems ?? [],
      totalPackages: 0,
      totalGrossWeight: 0,
      totalNetWeight: 0,
      totalVolume: 0,
      volumeUtilization: 0,
      weightUtilization: 0,
      warehouseId: input.warehouseId,
      dockDoor: input.dockDoor,
      bookingRef: input.bookingRef,
      blNumber: input.blNumber,
      customerId: input.customerId,
      supervisorId: input.supervisorId,
      supervisorName: input.supervisorName,
      plannedStartTime: input.plannedStartTime,
      plannedEndTime: input.plannedEndTime,
      pauseHistory: [],
      photos: [],
      damageNotes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.recalcStuffingTotals(op);
    this.stuffingOps.set(id, op);

    emit('container.stuffing_planned' as any, { operationId: id, containerId: input.containerId, containerNumber: input.containerNumber, timestamp: new Date() }, { tenantId: input.tenantId });

    return { success: true, data: op };
  }

  getStuffing(id: UUID): StuffingOperation | undefined {
    return this.stuffingOps.get(id);
  }

  listStuffingOps(options?: StuffingQueryOptions): StuffingOperation[] {
    let ops = [...this.stuffingOps.values()];
    if (options?.tenantId) ops = ops.filter((o) => o.tenantId === options.tenantId);
    if (options?.facilityId) ops = ops.filter((o) => o.facilityId === options.facilityId);
    if (options?.status) ops = ops.filter((o) => o.status === options.status);
    if (options?.containerId) ops = ops.filter((o) => o.containerId === options.containerId);
    return ops;
  }

  startStuffing(operationId: UUID): OperationResult<StuffingOperation> {
    const op = this.stuffingOps.get(operationId);
    if (!op) return { success: false, error: 'Stuffing operation not found', errorCode: 'NOT_FOUND' };
    if (op.status !== 'planned' && op.status !== 'paused') {
      return { success: false, error: `Cannot start stuffing in status: ${op.status}`, errorCode: 'INVALID_STATUS' };
    }
    op.status = 'in_progress';
    if (!op.actualStartTime) op.actualStartTime = new Date();
    op.updatedAt = new Date();

    emit('container.stuffing_started' as any, { operationId, containerId: op.containerId, timestamp: new Date() }, { tenantId: op.tenantId });

    return { success: true, data: op };
  }

  addCargoToStuffing(operationId: UUID, item: CargoItem): OperationResult<StuffingOperation> {
    const op = this.stuffingOps.get(operationId);
    if (!op) return { success: false, error: 'Stuffing operation not found', errorCode: 'NOT_FOUND' };
    if (op.status === 'completed' || op.status === 'cancelled') {
      return { success: false, error: 'Operation is closed', errorCode: 'INVALID_STATUS' };
    }
    op.cargoItems.push(item);
    this.recalcStuffingTotals(op);
    op.updatedAt = new Date();
    return { success: true, data: op };
  }

  completeStuffing(operationId: UUID, sealNumber?: string): OperationResult<StuffingOperation> {
    const op = this.stuffingOps.get(operationId);
    if (!op) return { success: false, error: 'Stuffing operation not found', errorCode: 'NOT_FOUND' };
    if (op.status !== 'in_progress') {
      return { success: false, error: `Cannot complete stuffing in status: ${op.status}`, errorCode: 'INVALID_STATUS' };
    }
    op.status = 'completed';
    op.actualEndTime = new Date();
    if (sealNumber) op.sealNumber = sealNumber;
    op.updatedAt = new Date();

    emit('container.stuffed' as any, { operationId, containerId: op.containerId, containerNumber: op.containerNumber, totalPackages: op.totalPackages, totalWeight: op.totalGrossWeight, sealNumber, timestamp: new Date() }, { tenantId: op.tenantId });

    return { success: true, data: op };
  }

  pauseStuffing(operationId: UUID, reason: string): OperationResult<StuffingOperation> {
    const op = this.stuffingOps.get(operationId);
    if (!op) return { success: false, error: 'Stuffing operation not found', errorCode: 'NOT_FOUND' };
    if (op.status !== 'in_progress') {
      return { success: false, error: 'Can only pause in-progress operations', errorCode: 'INVALID_STATUS' };
    }
    op.status = 'paused';
    op.pauseHistory = op.pauseHistory ?? [];
    op.pauseHistory.push({ pausedAt: new Date(), reason });
    op.updatedAt = new Date();
    return { success: true, data: op };
  }

  cancelStuffing(operationId: UUID, reason: string): OperationResult<StuffingOperation> {
    const op = this.stuffingOps.get(operationId);
    if (!op) return { success: false, error: 'Stuffing operation not found', errorCode: 'NOT_FOUND' };
    if (op.status === 'completed') {
      return { success: false, error: 'Cannot cancel completed operation', errorCode: 'INVALID_STATUS' };
    }
    op.status = 'cancelled';
    op.damageNotes = op.damageNotes ?? [];
    op.damageNotes.push(`Cancelled: ${reason}`);
    op.updatedAt = new Date();
    return { success: true, data: op };
  }

  private recalcStuffingTotals(op: StuffingOperation): void {
    op.totalPackages = op.cargoItems.reduce((sum, i) => sum + i.quantity, 0);
    op.totalGrossWeight = op.cargoItems.reduce((sum, i) => sum + i.grossWeight, 0);
    op.totalNetWeight = op.cargoItems.reduce((sum, i) => sum + (i.netWeight ?? 0), 0);
    op.totalVolume = op.cargoItems.reduce((sum, i) => sum + (i.volume ?? 0), 0);
    const maxWt = MAX_PAYLOAD[op.containerSize] ?? 21.8;
    const maxVol = MAX_VOLUME[op.containerSize] ?? 33.2;
    op.weightUtilization = maxWt > 0 ? Math.round((op.totalGrossWeight / 1000 / maxWt) * 100) : 0;
    op.volumeUtilization = maxVol > 0 ? Math.round((op.totalVolume / maxVol) * 100) : 0;
  }

  // ===========================================================================
  // DESTUFFING
  // ===========================================================================

  createDestuffing(input: CreateDestuffingInput): OperationResult<DestuffingOperation> {
    const id = nextId();
    const op: DestuffingOperation = {
      id,
      tenantId: input.tenantId,
      operationNumber: genNumber('DST'),
      facilityId: input.facilityId,
      containerId: input.containerId,
      containerNumber: input.containerNumber,
      containerSize: input.containerSize,
      destuffingType: input.destuffingType ?? 'full_destuffing',
      status: 'planned',
      cargoItems: [],
      totalPackagesExpected: input.totalPackagesExpected,
      totalPackagesReceived: 0,
      totalGrossWeightExpected: input.totalGrossWeightExpected,
      totalGrossWeightReceived: 0,
      shortages: [],
      excesses: [],
      damages: [],
      hasDiscrepancy: false,
      blNumber: input.blNumber,
      billOfEntryId: input.billOfEntryId,
      customerId: input.customerId,
      warehouseId: input.warehouseId,
      dockDoor: input.dockDoor,
      supervisorId: input.supervisorId,
      supervisorName: input.supervisorName,
      plannedStartTime: input.plannedStartTime,
      plannedEndTime: input.plannedEndTime,
      originalSealNumber: input.originalSealNumber,
      photos: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.destuffingOps.set(id, op);

    emit('container.destuffing_planned' as any, { operationId: id, containerId: input.containerId, containerNumber: input.containerNumber, timestamp: new Date() }, { tenantId: input.tenantId });

    return { success: true, data: op };
  }

  getDestuffing(id: UUID): DestuffingOperation | undefined {
    return this.destuffingOps.get(id);
  }

  listDestuffingOps(options?: DestuffingQueryOptions): DestuffingOperation[] {
    let ops = [...this.destuffingOps.values()];
    if (options?.tenantId) ops = ops.filter((o) => o.tenantId === options.tenantId);
    if (options?.facilityId) ops = ops.filter((o) => o.facilityId === options.facilityId);
    if (options?.status) ops = ops.filter((o) => o.status === options.status);
    if (options?.containerId) ops = ops.filter((o) => o.containerId === options.containerId);
    return ops;
  }

  startDestuffing(operationId: UUID, sealIntact?: boolean): OperationResult<DestuffingOperation> {
    const op = this.destuffingOps.get(operationId);
    if (!op) return { success: false, error: 'Destuffing operation not found', errorCode: 'NOT_FOUND' };
    if (op.status !== 'planned') {
      return { success: false, error: `Cannot start destuffing in status: ${op.status}`, errorCode: 'INVALID_STATUS' };
    }
    op.status = 'in_progress';
    op.actualStartTime = new Date();
    if (sealIntact !== undefined) {
      op.sealIntact = sealIntact;
      op.sealVerified = true;
    }
    op.updatedAt = new Date();

    emit('container.destuffing_started' as any, { operationId, containerId: op.containerId, sealIntact, timestamp: new Date() }, { tenantId: op.tenantId });

    return { success: true, data: op };
  }

  recordCargoReceived(operationId: UUID, item: CargoItem): OperationResult<DestuffingOperation> {
    const op = this.destuffingOps.get(operationId);
    if (!op) return { success: false, error: 'Destuffing operation not found', errorCode: 'NOT_FOUND' };
    if (op.status !== 'in_progress') {
      return { success: false, error: 'Operation must be in progress', errorCode: 'INVALID_STATUS' };
    }
    op.cargoItems.push(item);
    op.totalPackagesReceived = op.cargoItems.reduce((s, i) => s + i.quantity, 0);
    op.totalGrossWeightReceived = op.cargoItems.reduce((s, i) => s + i.grossWeight, 0);
    op.updatedAt = new Date();
    return { success: true, data: op };
  }

  completeDestuffing(operationId: UUID): OperationResult<DestuffingOperation> {
    const op = this.destuffingOps.get(operationId);
    if (!op) return { success: false, error: 'Destuffing operation not found', errorCode: 'NOT_FOUND' };
    if (op.status !== 'in_progress') {
      return { success: false, error: 'Must be in progress to complete', errorCode: 'INVALID_STATUS' };
    }

    op.status = 'completed';
    op.actualEndTime = new Date();

    // Detect discrepancies
    const pkgDiff = op.totalPackagesReceived - op.totalPackagesExpected;
    const wtDiff = op.totalGrossWeightReceived - op.totalGrossWeightExpected;
    op.hasDiscrepancy = pkgDiff !== 0 || Math.abs(wtDiff) > 0.5;

    if (pkgDiff < 0) {
      op.shortages.push({
        description: 'Package shortage',
        expectedQuantity: op.totalPackagesExpected,
        actualQuantity: op.totalPackagesReceived,
        difference: Math.abs(pkgDiff),
      });
    } else if (pkgDiff > 0) {
      op.excesses.push({
        description: 'Package excess',
        expectedQuantity: op.totalPackagesExpected,
        actualQuantity: op.totalPackagesReceived,
        difference: pkgDiff,
      });
    }
    op.updatedAt = new Date();

    emit('container.destuffed' as any, { operationId, containerId: op.containerId, containerNumber: op.containerNumber, packagesReceived: op.totalPackagesReceived, weightReceived: op.totalGrossWeightReceived, hasDiscrepancy: op.hasDiscrepancy, timestamp: new Date() }, { tenantId: op.tenantId });

    return { success: true, data: op };
  }

  // ===========================================================================
  // LCL CONSOLIDATION
  // ===========================================================================

  createConsolidation(input: CreateConsolidationInput): OperationResult<LCLConsolidation> {
    const id = nextId();
    const maxWt = input.maxWeight ?? (MAX_PAYLOAD[input.containerSize] ?? 21.8) * 1000;
    const maxVol = input.maxVolume ?? (MAX_VOLUME[input.containerSize] ?? 33.2);

    const consol: LCLConsolidation = {
      id,
      tenantId: input.tenantId,
      consolidationNumber: genNumber('LCL'),
      facilityId: input.facilityId,
      status: 'open',
      containerSize: input.containerSize,
      containerType: (input.containerType ?? 'GP') as any,
      consignments: [],
      totalConsignments: 0,
      totalPackages: 0,
      totalWeight: 0,
      totalVolume: 0,
      maxWeight: maxWt,
      maxVolume: maxVol,
      weightUtilization: 0,
      volumeUtilization: 0,
      portOfLoading: input.portOfLoading,
      portOfDischarge: input.portOfDischarge,
      finalDestination: input.finalDestination,
      cutoffDate: input.cutoffDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.consolidations.set(id, consol);
    return { success: true, data: consol };
  }

  getConsolidation(id: UUID): LCLConsolidation | undefined {
    return this.consolidations.get(id);
  }

  listConsolidations(options?: ConsolidationQueryOptions): LCLConsolidation[] {
    let list = [...this.consolidations.values()];
    if (options?.tenantId) list = list.filter((c) => c.tenantId === options.tenantId);
    if (options?.facilityId) list = list.filter((c) => c.facilityId === options.facilityId);
    if (options?.status) list = list.filter((c) => c.status === options.status);
    return list;
  }

  addConsignment(input: AddConsignmentInput): OperationResult<LCLConsolidation> {
    const consol = this.consolidations.get(input.consolidationId);
    if (!consol) return { success: false, error: 'Consolidation not found', errorCode: 'NOT_FOUND' };
    if (consol.status !== 'open' && consol.status !== 'in_progress') {
      return { success: false, error: 'Consolidation is not accepting consignments', errorCode: 'INVALID_STATUS' };
    }

    // Check capacity
    const newWeight = consol.totalWeight + input.grossWeight;
    const newVolume = consol.totalVolume + input.volume;
    if (newWeight > consol.maxWeight) {
      return { success: false, error: 'Weight exceeds container capacity', errorCode: 'OVER_WEIGHT' };
    }
    if (newVolume > consol.maxVolume) {
      return { success: false, error: 'Volume exceeds container capacity', errorCode: 'OVER_VOLUME' };
    }

    const consignment: LCLConsignment = {
      id: nextId(),
      consignmentNumber: input.consignmentNumber,
      shipperId: input.shipperId,
      shipperName: input.shipperName,
      consigneeName: input.consigneeName,
      cargoItems: input.cargoItems,
      packages: input.packages,
      grossWeight: input.grossWeight,
      volume: input.volume,
      houseBlNumber: input.houseBlNumber,
      shippingBillNumber: input.shippingBillNumber,
      receivedAt: new Date(),
    };

    consol.consignments.push(consignment);
    consol.totalConsignments = consol.consignments.length;
    consol.totalPackages = consol.consignments.reduce((s, c) => s + c.packages, 0);
    consol.totalWeight = consol.consignments.reduce((s, c) => s + c.grossWeight, 0);
    consol.totalVolume = consol.consignments.reduce((s, c) => s + c.volume, 0);
    consol.weightUtilization = consol.maxWeight > 0 ? Math.round((consol.totalWeight / consol.maxWeight) * 100) : 0;
    consol.volumeUtilization = consol.maxVolume > 0 ? Math.round((consol.totalVolume / consol.maxVolume) * 100) : 0;

    if (consol.status === 'open') consol.status = 'in_progress';
    consol.updatedAt = new Date();

    return { success: true, data: consol };
  }

  closeConsolidation(consolidationId: UUID, containerId: UUID, containerNumber: string, masterBlNumber?: string): OperationResult<LCLConsolidation> {
    const consol = this.consolidations.get(consolidationId);
    if (!consol) return { success: false, error: 'Consolidation not found', errorCode: 'NOT_FOUND' };
    if (consol.consignments.length === 0) {
      return { success: false, error: 'No consignments to consolidate', errorCode: 'EMPTY' };
    }

    consol.status = 'stuffed';
    consol.containerId = containerId;
    consol.containerNumber = containerNumber;
    consol.masterBlNumber = masterBlNumber;
    consol.stuffingDate = new Date();
    consol.updatedAt = new Date();

    for (const c of consol.consignments) {
      c.stuffedAt = new Date();
    }

    emit('container.lcl_consolidated' as any, { consolidationId, containerId, containerNumber, consignments: consol.totalConsignments, packages: consol.totalPackages, weightUtilization: consol.weightUtilization, volumeUtilization: consol.volumeUtilization, timestamp: new Date() }, { tenantId: consol.tenantId });

    return { success: true, data: consol };
  }

  // ===========================================================================
  // FCL OPERATIONS
  // ===========================================================================

  createFCLOperation(input: CreateFCLOperationInput): OperationResult<FCLOperation> {
    const id = nextId();
    const op: FCLOperation = {
      id,
      tenantId: input.tenantId,
      operationNumber: genNumber('FCL'),
      facilityId: input.facilityId,
      operationType: input.operationType,
      status: 'pending',
      containerId: input.containerId,
      containerNumber: input.containerNumber,
      containerSize: input.containerSize,
      fromLocation: input.fromLocation,
      toLocation: input.toLocation,
      transportMode: input.transportMode,
      blNumber: input.blNumber,
      deliveryOrderId: input.deliveryOrderId,
      bookingRef: input.bookingRef,
      customerId: input.customerId,
      plannedDate: input.plannedDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.fclOps.set(id, op);
    return { success: true, data: op };
  }

  getFCLOperation(id: UUID): FCLOperation | undefined {
    return this.fclOps.get(id);
  }

  listFCLOperations(options?: FCLQueryOptions): FCLOperation[] {
    let ops = [...this.fclOps.values()];
    if (options?.tenantId) ops = ops.filter((o) => o.tenantId === options.tenantId);
    if (options?.facilityId) ops = ops.filter((o) => o.facilityId === options.facilityId);
    if (options?.status) ops = ops.filter((o) => o.status === options.status);
    if (options?.operationType) ops = ops.filter((o) => o.operationType === options.operationType);
    return ops;
  }

  startFCLOperation(operationId: UUID): OperationResult<FCLOperation> {
    const op = this.fclOps.get(operationId);
    if (!op) return { success: false, error: 'FCL operation not found', errorCode: 'NOT_FOUND' };
    if (op.status !== 'pending') return { success: false, error: 'Invalid status', errorCode: 'INVALID_STATUS' };
    op.status = 'in_progress';
    op.updatedAt = new Date();
    return { success: true, data: op };
  }

  completeFCLOperation(operationId: UUID, remarks?: string): OperationResult<FCLOperation> {
    const op = this.fclOps.get(operationId);
    if (!op) return { success: false, error: 'FCL operation not found', errorCode: 'NOT_FOUND' };
    if (op.status !== 'in_progress') return { success: false, error: 'Must be in progress', errorCode: 'INVALID_STATUS' };
    op.status = 'completed';
    op.completedDate = new Date();
    if (remarks) op.remarks = remarks;
    op.updatedAt = new Date();
    return { success: true, data: op };
  }

  // ===========================================================================
  // CROSS-DOCKING
  // ===========================================================================

  createCrossDock(input: CreateCrossDockInput): OperationResult<CrossDockOperation> {
    const id = nextId();
    const op: CrossDockOperation = {
      id,
      tenantId: input.tenantId,
      operationNumber: genNumber('XDK'),
      facilityId: input.facilityId,
      status: 'planned',
      inboundContainerNumber: input.inboundContainerNumber,
      inboundTransportMode: input.inboundTransportMode,
      inboundRef: input.inboundRef,
      outboundTransportMode: input.outboundTransportMode,
      outboundRef: input.outboundRef,
      cargoItems: input.cargoItems ?? [],
      totalPackages: input.totalPackages ?? 0,
      totalWeight: input.totalWeight ?? 0,
      stagingArea: input.stagingArea,
      plannedReceiveTime: input.plannedReceiveTime,
      plannedDispatchTime: input.plannedDispatchTime,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.crossDocks.set(id, op);
    return { success: true, data: op };
  }

  getCrossDock(id: UUID): CrossDockOperation | undefined {
    return this.crossDocks.get(id);
  }

  listCrossDocks(options?: CrossDockQueryOptions): CrossDockOperation[] {
    let ops = [...this.crossDocks.values()];
    if (options?.tenantId) ops = ops.filter((o) => o.tenantId === options.tenantId);
    if (options?.facilityId) ops = ops.filter((o) => o.facilityId === options.facilityId);
    if (options?.status) ops = ops.filter((o) => o.status === options.status);
    return ops;
  }

  receiveCrossDock(operationId: UUID): OperationResult<CrossDockOperation> {
    const op = this.crossDocks.get(operationId);
    if (!op) return { success: false, error: 'Cross-dock operation not found', errorCode: 'NOT_FOUND' };
    op.status = 'receiving';
    op.receivedAt = new Date();
    op.updatedAt = new Date();
    return { success: true, data: op };
  }

  sortCrossDock(operationId: UUID): OperationResult<CrossDockOperation> {
    const op = this.crossDocks.get(operationId);
    if (!op) return { success: false, error: 'Cross-dock operation not found', errorCode: 'NOT_FOUND' };
    op.status = 'sorting';
    op.sortedAt = new Date();
    op.updatedAt = new Date();
    return { success: true, data: op };
  }

  dispatchCrossDock(operationId: UUID, outboundContainerNumber?: string): OperationResult<CrossDockOperation> {
    const op = this.crossDocks.get(operationId);
    if (!op) return { success: false, error: 'Cross-dock operation not found', errorCode: 'NOT_FOUND' };
    op.status = 'completed';
    op.dispatchedAt = new Date();
    if (outboundContainerNumber) op.outboundContainerNumber = outboundContainerNumber;
    if (op.receivedAt) {
      op.dwellTimeMinutes = Math.round((Date.now() - op.receivedAt.getTime()) / 60000);
    }
    op.updatedAt = new Date();
    return { success: true, data: op };
  }

  // ===========================================================================
  // CARGO INSPECTION
  // ===========================================================================

  createInspection(input: CreateInspectionInput): OperationResult<CargoInspection> {
    const id = nextId();
    const insp: CargoInspection = {
      id,
      tenantId: input.tenantId,
      inspectionNumber: genNumber('INS'),
      facilityId: input.facilityId,
      inspectionType: input.inspectionType,
      status: 'scheduled',
      result: 'pending',
      containerId: input.containerId,
      containerNumber: input.containerNumber,
      operationId: input.operationId,
      operationType: input.operationType,
      inspectorId: input.inspectorId,
      inspectorName: input.inspectorName,
      inspectorOrganization: input.inspectorOrganization,
      checklistItems: [],
      totalItems: 0,
      passedItems: 0,
      failedItems: 0,
      findings: '',
      photos: [],
      documents: [],
      sealNumber: input.sealNumber,
      declaredWeight: input.declaredWeight,
      scheduledDate: input.scheduledDate ?? new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.inspections.set(id, insp);
    return { success: true, data: insp };
  }

  getInspection(id: UUID): CargoInspection | undefined {
    return this.inspections.get(id);
  }

  listInspections(options?: InspectionQueryOptions): CargoInspection[] {
    let list = [...this.inspections.values()];
    if (options?.tenantId) list = list.filter((i) => i.tenantId === options.tenantId);
    if (options?.facilityId) list = list.filter((i) => i.facilityId === options.facilityId);
    if (options?.status) list = list.filter((i) => i.status === options.status);
    if (options?.inspectionType) list = list.filter((i) => i.inspectionType === options.inspectionType);
    if (options?.containerId) list = list.filter((i) => i.containerId === options.containerId);
    return list;
  }

  startInspection(inspectionId: UUID): OperationResult<CargoInspection> {
    const insp = this.inspections.get(inspectionId);
    if (!insp) return { success: false, error: 'Inspection not found', errorCode: 'NOT_FOUND' };
    if (insp.status !== 'scheduled') {
      return { success: false, error: 'Invalid status', errorCode: 'INVALID_STATUS' };
    }
    insp.status = 'in_progress';
    insp.startedAt = new Date();
    insp.updatedAt = new Date();
    return { success: true, data: insp };
  }

  completeInspection(inspectionId: UUID, result: CargoInspectionResult, findings: string, actualWeight?: number): OperationResult<CargoInspection> {
    const insp = this.inspections.get(inspectionId);
    if (!insp) return { success: false, error: 'Inspection not found', errorCode: 'NOT_FOUND' };
    if (insp.status !== 'in_progress') {
      return { success: false, error: 'Must be in progress', errorCode: 'INVALID_STATUS' };
    }

    insp.status = 'completed';
    insp.result = result;
    insp.findings = findings;
    insp.completedAt = new Date();
    if (actualWeight !== undefined) {
      insp.actualWeight = actualWeight;
      if (insp.declaredWeight) {
        insp.weightVariance = Math.round((actualWeight - insp.declaredWeight) * 100) / 100;
      }
    }

    // Recalc checklist pass/fail
    insp.passedItems = insp.checklistItems.filter((i) => i.result === 'pass').length;
    insp.failedItems = insp.checklistItems.filter((i) => i.result === 'fail').length;
    insp.updatedAt = new Date();

    emit('container.inspected' as any, { inspectionId, containerId: insp.containerId, result, inspectionType: insp.inspectionType, timestamp: new Date() }, { tenantId: insp.tenantId });

    return { success: true, data: insp };
  }

  addChecklistItem(inspectionId: UUID, item: CargoInspection['checklistItems'][number]): OperationResult<CargoInspection> {
    const insp = this.inspections.get(inspectionId);
    if (!insp) return { success: false, error: 'Inspection not found', errorCode: 'NOT_FOUND' };
    insp.checklistItems.push(item);
    insp.totalItems = insp.checklistItems.length;
    insp.passedItems = insp.checklistItems.filter((i) => i.result === 'pass').length;
    insp.failedItems = insp.checklistItems.filter((i) => i.result === 'fail').length;
    insp.updatedAt = new Date();
    return { success: true, data: insp };
  }

  // ===========================================================================
  // STATS
  // ===========================================================================

  getOperationsStats(tenantId: string): OperationsStats {
    const stuffings = [...this.stuffingOps.values()].filter((o) => o.tenantId === tenantId);
    const destuffings = [...this.destuffingOps.values()].filter((o) => o.tenantId === tenantId);
    const consolidations = [...this.consolidations.values()].filter((o) => o.tenantId === tenantId);
    const fcls = [...this.fclOps.values()].filter((o) => o.tenantId === tenantId);
    const crossDocks = [...this.crossDocks.values()].filter((o) => o.tenantId === tenantId);
    const inspectionsList = [...this.inspections.values()].filter((o) => o.tenantId === tenantId);

    const completedStuffings = stuffings.filter((s) => s.status === 'completed' && s.actualStartTime && s.actualEndTime);
    const avgStuffDur = completedStuffings.length > 0
      ? completedStuffings.reduce((s, o) => s + ((o.actualEndTime!.getTime() - o.actualStartTime!.getTime()) / 60000), 0) / completedStuffings.length
      : 0;
    const avgVolUtil = completedStuffings.length > 0
      ? completedStuffings.reduce((s, o) => s + (o.volumeUtilization ?? 0), 0) / completedStuffings.length
      : 0;

    const completedDestuffings = destuffings.filter((d) => d.status === 'completed');
    const avgDestDur = completedDestuffings.length > 0 && completedDestuffings[0]?.actualStartTime && completedDestuffings[0]?.actualEndTime
      ? completedDestuffings.reduce((s, o) => s + (((o.actualEndTime?.getTime() ?? 0) - (o.actualStartTime?.getTime() ?? 0)) / 60000), 0) / completedDestuffings.length
      : 0;
    const discrepancyCount = completedDestuffings.filter((d) => d.hasDiscrepancy).length;

    const completedInsp = inspectionsList.filter((i) => i.status === 'completed');
    const passCount = completedInsp.filter((i) => i.result === 'pass' || i.result === 'conditional_pass').length;
    const failCount = completedInsp.filter((i) => i.result === 'fail').length;

    const fclByType: Record<string, number> = {};
    for (const f of fcls) {
      fclByType[f.operationType] = (fclByType[f.operationType] ?? 0) + 1;
    }

    const activeCross = crossDocks.filter((c) => c.status !== 'completed' && c.status !== 'cancelled');
    const completedCross = crossDocks.filter((c) => c.status === 'completed');
    const avgDwell = completedCross.length > 0
      ? completedCross.reduce((s, c) => s + (c.dwellTimeMinutes ?? 0), 0) / completedCross.length
      : 0;

    return {
      date: new Date(),
      stuffing: {
        planned: stuffings.filter((s) => s.status === 'planned').length,
        inProgress: stuffings.filter((s) => s.status === 'in_progress').length,
        completed: completedStuffings.length,
        cancelled: stuffings.filter((s) => s.status === 'cancelled').length,
        avgDurationMinutes: Math.round(avgStuffDur),
        avgVolumeUtilization: Math.round(avgVolUtil),
      },
      destuffing: {
        planned: destuffings.filter((d) => d.status === 'planned').length,
        inProgress: destuffings.filter((d) => d.status === 'in_progress').length,
        completed: completedDestuffings.length,
        cancelled: destuffings.filter((d) => d.status === 'cancelled').length,
        avgDurationMinutes: Math.round(avgDestDur),
        discrepancyRate: completedDestuffings.length > 0 ? Math.round((discrepancyCount / completedDestuffings.length) * 100) : 0,
      },
      lcl: {
        openConsolidations: consolidations.filter((c) => c.status === 'open' || c.status === 'in_progress').length,
        consignmentsReceived: consolidations.reduce((s, c) => s + c.totalConsignments, 0),
        containersStuffed: consolidations.filter((c) => c.status === 'stuffed' || c.status === 'closed').length,
        avgUtilization: consolidations.length > 0
          ? Math.round(consolidations.reduce((s, c) => s + c.volumeUtilization, 0) / consolidations.length)
          : 0,
      },
      fcl: {
        pending: fcls.filter((f) => f.status === 'pending').length,
        completed: fcls.filter((f) => f.status === 'completed').length,
        byType: fclByType as any,
      },
      crossDock: {
        active: activeCross.length,
        completed: completedCross.length,
        avgDwellMinutes: Math.round(avgDwell),
      },
      inspections: {
        scheduled: inspectionsList.filter((i) => i.status === 'scheduled').length,
        completed: completedInsp.length,
        passRate: completedInsp.length > 0 ? Math.round((passCount / completedInsp.length) * 100) : 0,
        failRate: completedInsp.length > 0 ? Math.round((failCount / completedInsp.length) * 100) : 0,
      },
    };
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let instance: OperationsEngine | null = null;

export function getOperationsEngine(): OperationsEngine {
  if (!instance) instance = new OperationsEngine();
  return instance;
}

export function setOperationsEngine(engine: OperationsEngine): void {
  instance = engine;
}
