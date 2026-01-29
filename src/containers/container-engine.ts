// Container Engine - Full Container Lifecycle Management

import { v4 as uuidv4 } from 'uuid';
import { emit, createCorrelationId } from '../core/event-bus';
import { getFacilityManager } from '../facility/facility-manager';
import type {
  Container,
  ContainerStatus,
  ContainerCondition,
  ContainerISOType,
  ContainerSize,
  ContainerHold,
  ContainerMovement,
  ContainerPhoto,
  HazmatInfo,
  ReeferInfo,
  OverGaugeInfo,
  HoldType,
  CustomsStatus,
} from '../types/container';
import {
  validateContainerNumber,
  parseISOType,
  getContainerTEU,
} from '../types/container';
import type { YardLocation } from '../types/facility';
import type { UUID, OperationResult, Attachment } from '../types/common';

// ============================================================================
// CONTAINER ENGINE
// ============================================================================

export class ContainerEngine {
  private containers: Map<UUID, Container> = new Map();
  private containerByNumber: Map<string, UUID> = new Map();
  private containersByFacility: Map<UUID, Set<UUID>> = new Map();
  private containersByStatus: Map<ContainerStatus, Set<UUID>> = new Map();
  private containersByLocation: Map<string, UUID> = new Map(); // barcode -> containerId

  constructor() {
    // Initialize status sets
    const statuses: ContainerStatus[] = [
      'announced', 'arrived', 'gated_in', 'grounded', 'picked',
      'gated_out', 'stuffing', 'destuffing', 'inspection', 'repair',
      'on_hold', 'departed'
    ];
    statuses.forEach(s => this.containersByStatus.set(s, new Set()));
  }

  // ===========================================================================
  // CONTAINER CRUD
  // ===========================================================================

  registerContainer(input: RegisterContainerInput): OperationResult<Container> {
    // Validate container number format
    if (!validateContainerNumber(input.containerNumber)) {
      return {
        success: false,
        error: `Invalid container number format: ${input.containerNumber}`,
        errorCode: 'INVALID_CONTAINER_NUMBER',
      };
    }

    // Check for duplicate
    if (this.containerByNumber.has(input.containerNumber)) {
      return {
        success: false,
        error: `Container ${input.containerNumber} already registered`,
        errorCode: 'DUPLICATE_CONTAINER',
      };
    }

    // Parse ISO type
    const { size, type, height } = parseISOType(input.isoType);

    const container: Container = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      containerNumber: input.containerNumber,
      isoType: input.isoType,
      size,
      type,
      height,
      status: 'announced',
      condition: input.condition ?? 'sound',
      owner: input.owner ?? 'UNKNOWN',
      ownerName: input.ownerName ?? input.owner ?? 'UNKNOWN',
      operator: input.operator,
      tareWeight: input.tareWeight ?? getDefaultTareWeight(size),
      grossWeight: input.grossWeight,
      maxPayload: input.maxPayload ?? getDefaultMaxPayload(size),
      vgmWeight: input.vgmWeight,
      sealNumbers: input.sealNumbers ?? [],
      cargoDescription: input.cargoDescription,
      harmonizedCode: input.harmonizedCode,
      packagesCount: input.packagesCount,
      packageType: input.packageType,
      hazmat: input.hazmat,
      reefer: input.reefer,
      oog: input.oog,
      previousLocations: [],
      bookingRef: input.bookingRef,
      blNumber: input.blNumber,
      deliveryOrderNumber: input.deliveryOrderNumber,
      vesselVoyage: input.vesselVoyage,
      portOfLoading: input.portOfLoading,
      portOfDischarge: input.portOfDischarge,
      finalDestination: input.finalDestination,
      eta: input.eta,
      customsStatus: input.customsStatus ?? 'pending',
      boeNumber: input.boeNumber,
      sbNumber: input.sbNumber,
      igmNumber: input.igmNumber,
      igmLineNumber: input.igmLineNumber,
      holds: [],
      movements: [],
      photos: [],
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.containers.set(container.id, container);
    this.containerByNumber.set(container.containerNumber, container.id);
    this.containersByStatus.get('announced')?.add(container.id);

    // Index by facility
    if (!this.containersByFacility.has(input.facilityId)) {
      this.containersByFacility.set(input.facilityId, new Set());
    }
    this.containersByFacility.get(input.facilityId)?.add(container.id);

    emit('container.registered', { container }, {
      facilityId: container.facilityId,
      tenantId: container.tenantId,
      source: 'ContainerEngine',
      correlationId: createCorrelationId(),
    });

    return { success: true, data: container };
  }

  getContainer(id: UUID): Container | undefined {
    return this.containers.get(id);
  }

  getContainerByNumber(containerNumber: string): Container | undefined {
    const id = this.containerByNumber.get(containerNumber);
    return id ? this.containers.get(id) : undefined;
  }

  getContainersByFacility(facilityId: UUID, options?: ContainerQueryOptions): Container[] {
    const containerIds = this.containersByFacility.get(facilityId);
    if (!containerIds) return [];

    let containers = Array.from(containerIds)
      .map(id => this.containers.get(id)!)
      .filter(Boolean);

    if (options?.status) {
      containers = containers.filter(c => c.status === options.status);
    }
    if (options?.customsStatus) {
      containers = containers.filter(c => c.customsStatus === options.customsStatus);
    }
    if (options?.hasHold !== undefined) {
      containers = containers.filter(c => options.hasHold ? c.holds.length > 0 : c.holds.length === 0);
    }
    if (options?.isReefer !== undefined) {
      containers = containers.filter(c => options.isReefer ? !!c.reefer : !c.reefer);
    }
    if (options?.isHazmat !== undefined) {
      containers = containers.filter(c => options.isHazmat ? !!c.hazmat : !c.hazmat);
    }
    if (options?.owner) {
      containers = containers.filter(c => c.owner === options.owner);
    }
    if (options?.blNumber) {
      containers = containers.filter(c => c.blNumber === options.blNumber);
    }

    return containers;
  }

  getContainersByStatus(status: ContainerStatus): Container[] {
    const containerIds = this.containersByStatus.get(status);
    if (!containerIds) return [];
    return Array.from(containerIds).map(id => this.containers.get(id)!).filter(Boolean);
  }

  updateContainer(id: UUID, updates: Partial<Omit<Container, 'id' | 'tenantId' | 'facilityId' | 'containerNumber' | 'createdAt'>>): OperationResult<Container> {
    const container = this.containers.get(id);
    if (!container) {
      return { success: false, error: 'Container not found', errorCode: 'NOT_FOUND' };
    }

    const updated: Container = {
      ...container,
      ...updates,
      updatedAt: new Date(),
    };

    this.containers.set(id, updated);

    // Update status index if status changed
    if (updates.status && updates.status !== container.status) {
      this.containersByStatus.get(container.status)?.delete(id);
      this.containersByStatus.get(updates.status)?.add(id);
    }

    return { success: true, data: updated };
  }

  // ===========================================================================
  // STATUS TRANSITIONS
  // ===========================================================================

  gateIn(containerId: UUID, input: GateInInput): OperationResult<Container> {
    const container = this.containers.get(containerId);
    if (!container) {
      return { success: false, error: 'Container not found', errorCode: 'NOT_FOUND' };
    }

    if (!['announced', 'arrived'].includes(container.status)) {
      return {
        success: false,
        error: `Cannot gate in container with status: ${container.status}`,
        errorCode: 'INVALID_STATUS_TRANSITION',
      };
    }

    const correlationId = createCorrelationId();

    // Record movement
    const movement: ContainerMovement = {
      id: uuidv4(),
      containerId,
      movementType: 'gate_in',
      fromLocation: 'gate',
      toLocation: input.location ?? 'yard',
      equipmentId: input.equipmentId,
      operatorId: input.operatorId,
      movementTime: new Date(),
      notes: input.notes,
      metadata: {
        gateId: input.gateId,
        laneId: input.laneId,
        truckNumber: input.truckNumber,
        driverName: input.driverName,
        sealVerified: input.sealVerified,
      },
    };

    const result = this.updateContainer(containerId, {
      status: 'gated_in',
      gateInTime: new Date(),
      sealNumbers: input.newSealNumbers ?? container.sealNumbers,
      condition: input.condition ?? container.condition,
      movements: [...container.movements, movement],
    });

    if (result.success && result.data) {
      emit('container.gated_in', {
        container: result.data,
        movement,
        gateId: input.gateId,
        truckNumber: input.truckNumber,
      }, {
        facilityId: container.facilityId,
        tenantId: container.tenantId,
        source: 'ContainerEngine',
        correlationId,
      });
    }

    return result;
  }

  ground(containerId: UUID, location: YardLocation, input?: GroundInput): OperationResult<Container> {
    const container = this.containers.get(containerId);
    if (!container) {
      return { success: false, error: 'Container not found', errorCode: 'NOT_FOUND' };
    }

    if (!['gated_in', 'picked'].includes(container.status)) {
      return {
        success: false,
        error: `Cannot ground container with status: ${container.status}`,
        errorCode: 'INVALID_STATUS_TRANSITION',
      };
    }

    const correlationId = createCorrelationId();

    // Update slot in facility manager
    const facilityManager = getFacilityManager();
    const slot = facilityManager.getSlotByBarcode(location.barcode);
    if (slot) {
      facilityManager.updateSlot(slot.id, {
        currentTiers: slot.currentTiers + 1,
        topContainer: containerId,
        containers: [...slot.containers, {
          containerId,
          containerNumber: container.containerNumber,
          tier: location.tier,
          placedAt: new Date(),
          placedBy: input?.operatorId,
        }],
        status: 'occupied',
      });
    }

    // Record movement
    const movement: ContainerMovement = {
      id: uuidv4(),
      containerId,
      movementType: 'ground',
      fromLocation: container.currentLocation,
      toLocation: location,
      equipmentId: input?.equipmentId,
      operatorId: input?.operatorId,
      workOrderId: input?.workOrderId,
      movementTime: new Date(),
    };

    // Update location index
    if (container.currentLocation) {
      this.containersByLocation.delete(container.currentLocation.barcode);
    }
    this.containersByLocation.set(location.barcode, containerId);

    const result = this.updateContainer(containerId, {
      status: 'grounded',
      currentLocation: location,
      previousLocations: container.currentLocation
        ? [...container.previousLocations, container.currentLocation]
        : container.previousLocations,
      groundedTime: new Date(),
      movements: [...container.movements, movement],
    });

    if (result.success && result.data) {
      emit('container.grounded', {
        container: result.data,
        location,
        movement,
      }, {
        facilityId: container.facilityId,
        tenantId: container.tenantId,
        source: 'ContainerEngine',
        correlationId,
      });

      emit('yard.slot_occupied', {
        slotId: slot?.id,
        barcode: location.barcode,
        containerId,
        tier: location.tier,
      }, {
        facilityId: container.facilityId,
        tenantId: container.tenantId,
        source: 'ContainerEngine',
        correlationId,
      });
    }

    return result;
  }

  pick(containerId: UUID, input?: PickInput): OperationResult<Container> {
    const container = this.containers.get(containerId);
    if (!container) {
      return { success: false, error: 'Container not found', errorCode: 'NOT_FOUND' };
    }

    if (container.status !== 'grounded') {
      return {
        success: false,
        error: `Cannot pick container with status: ${container.status}`,
        errorCode: 'INVALID_STATUS_TRANSITION',
      };
    }

    const correlationId = createCorrelationId();
    const previousLocation = container.currentLocation;

    // Update slot
    if (previousLocation) {
      const facilityManager = getFacilityManager();
      const slot = facilityManager.getSlotByBarcode(previousLocation.barcode);
      if (slot) {
        const updatedContainers = slot.containers.filter(c => c.containerId !== containerId);
        facilityManager.updateSlot(slot.id, {
          currentTiers: Math.max(0, slot.currentTiers - 1),
          topContainer: updatedContainers.length > 0
            ? updatedContainers[updatedContainers.length - 1]!.containerId
            : undefined,
          containers: updatedContainers,
          status: updatedContainers.length === 0 ? 'available' : 'occupied',
        });
      }
      this.containersByLocation.delete(previousLocation.barcode);
    }

    // Record movement
    const movement: ContainerMovement = {
      id: uuidv4(),
      containerId,
      movementType: 'pick',
      fromLocation: previousLocation,
      toLocation: input?.destination ?? 'staging',
      equipmentId: input?.equipmentId,
      operatorId: input?.operatorId,
      workOrderId: input?.workOrderId,
      movementTime: new Date(),
    };

    const result = this.updateContainer(containerId, {
      status: 'picked',
      currentLocation: undefined,
      previousLocations: previousLocation
        ? [...container.previousLocations, previousLocation]
        : container.previousLocations,
      movements: [...container.movements, movement],
    });

    if (result.success && result.data) {
      emit('container.picked', {
        container: result.data,
        fromLocation: previousLocation,
        movement,
      }, {
        facilityId: container.facilityId,
        tenantId: container.tenantId,
        source: 'ContainerEngine',
        correlationId,
      });

      if (previousLocation) {
        emit('yard.slot_vacated', {
          barcode: previousLocation.barcode,
          containerId,
        }, {
          facilityId: container.facilityId,
          tenantId: container.tenantId,
          source: 'ContainerEngine',
          correlationId,
        });
      }
    }

    return result;
  }

  gateOut(containerId: UUID, input: GateOutInput): OperationResult<Container> {
    const container = this.containers.get(containerId);
    if (!container) {
      return { success: false, error: 'Container not found', errorCode: 'NOT_FOUND' };
    }

    if (!['picked', 'grounded'].includes(container.status)) {
      return {
        success: false,
        error: `Cannot gate out container with status: ${container.status}`,
        errorCode: 'INVALID_STATUS_TRANSITION',
      };
    }

    // Check for holds
    const activeHolds = container.holds.filter(h => !h.releasedAt);
    if (activeHolds.length > 0 && !input.overrideHolds) {
      return {
        success: false,
        error: `Container has ${activeHolds.length} active hold(s)`,
        errorCode: 'CONTAINER_ON_HOLD',
      };
    }

    const correlationId = createCorrelationId();

    // Record movement
    const movement: ContainerMovement = {
      id: uuidv4(),
      containerId,
      movementType: 'gate_out',
      fromLocation: container.currentLocation ?? 'yard',
      toLocation: 'gate',
      equipmentId: input.equipmentId,
      operatorId: input.operatorId,
      movementTime: new Date(),
      metadata: {
        gateId: input.gateId,
        truckNumber: input.truckNumber,
        driverName: input.driverName,
        deliveryOrderNumber: input.deliveryOrderNumber,
      },
    };

    const result = this.updateContainer(containerId, {
      status: 'gated_out',
      gateOutTime: new Date(),
      movements: [...container.movements, movement],
    });

    if (result.success && result.data) {
      emit('container.gated_out', {
        container: result.data,
        movement,
        gateId: input.gateId,
        truckNumber: input.truckNumber,
      }, {
        facilityId: container.facilityId,
        tenantId: container.tenantId,
        source: 'ContainerEngine',
        correlationId,
      });
    }

    return result;
  }

  // ===========================================================================
  // HOLDS MANAGEMENT
  // ===========================================================================

  placeHold(containerId: UUID, input: PlaceHoldInput): OperationResult<Container> {
    const container = this.containers.get(containerId);
    if (!container) {
      return { success: false, error: 'Container not found', errorCode: 'NOT_FOUND' };
    }

    const hold: ContainerHold = {
      id: uuidv4(),
      type: input.type,
      reason: input.reason,
      placedAt: new Date(),
      placedBy: input.placedBy,
      reference: input.reference,
      autoRelease: input.autoRelease,
      priority: input.priority ?? 'medium',
    };

    const result = this.updateContainer(containerId, {
      holds: [...container.holds, hold],
      status: 'on_hold',
    });

    if (result.success && result.data) {
      emit('container.hold_placed', {
        container: result.data,
        hold,
      }, {
        facilityId: container.facilityId,
        tenantId: container.tenantId,
        source: 'ContainerEngine',
      });
    }

    return result;
  }

  releaseHold(containerId: UUID, holdId: UUID, releasedBy: string): OperationResult<Container> {
    const container = this.containers.get(containerId);
    if (!container) {
      return { success: false, error: 'Container not found', errorCode: 'NOT_FOUND' };
    }

    const holdIndex = container.holds.findIndex(h => h.id === holdId);
    if (holdIndex === -1) {
      return { success: false, error: 'Hold not found', errorCode: 'HOLD_NOT_FOUND' };
    }

    const updatedHolds = [...container.holds];
    updatedHolds[holdIndex] = {
      ...updatedHolds[holdIndex]!,
      releasedAt: new Date(),
      releasedBy,
    };

    // Check if any active holds remain
    const activeHolds = updatedHolds.filter(h => !h.releasedAt);
    const newStatus = activeHolds.length === 0 ? 'grounded' : 'on_hold';

    const result = this.updateContainer(containerId, {
      holds: updatedHolds,
      status: newStatus,
    });

    if (result.success && result.data) {
      emit('container.hold_released', {
        container: result.data,
        holdId,
        releasedBy,
      }, {
        facilityId: container.facilityId,
        tenantId: container.tenantId,
        source: 'ContainerEngine',
      });
    }

    return result;
  }

  // ===========================================================================
  // REEFER MANAGEMENT
  // ===========================================================================

  plugInReefer(containerId: UUID, input: PlugReeferInput): OperationResult<Container> {
    const container = this.containers.get(containerId);
    if (!container) {
      return { success: false, error: 'Container not found', errorCode: 'NOT_FOUND' };
    }

    if (!container.reefer) {
      return { success: false, error: 'Container is not a reefer', errorCode: 'NOT_REEFER' };
    }

    const updatedReefer: ReeferInfo = {
      ...container.reefer,
      pluggedIn: true,
      pluggedInAt: new Date(),
    };

    const movement: ContainerMovement = {
      id: uuidv4(),
      containerId,
      movementType: 'plug_reefer',
      fromLocation: container.currentLocation,
      toLocation: container.currentLocation,
      movementTime: new Date(),
      metadata: { plugId: input.plugId },
    };

    const result = this.updateContainer(containerId, {
      reefer: updatedReefer,
      movements: [...container.movements, movement],
    });

    if (result.success && result.data) {
      emit('container.reefer_plugged', {
        container: result.data,
        plugId: input.plugId,
      }, {
        facilityId: container.facilityId,
        tenantId: container.tenantId,
        source: 'ContainerEngine',
      });
    }

    return result;
  }

  unplugReefer(containerId: UUID): OperationResult<Container> {
    const container = this.containers.get(containerId);
    if (!container) {
      return { success: false, error: 'Container not found', errorCode: 'NOT_FOUND' };
    }

    if (!container.reefer) {
      return { success: false, error: 'Container is not a reefer', errorCode: 'NOT_REEFER' };
    }

    const updatedReefer: ReeferInfo = {
      ...container.reefer,
      pluggedIn: false,
    };

    const movement: ContainerMovement = {
      id: uuidv4(),
      containerId,
      movementType: 'unplug_reefer',
      fromLocation: container.currentLocation,
      toLocation: container.currentLocation,
      movementTime: new Date(),
    };

    const result = this.updateContainer(containerId, {
      reefer: updatedReefer,
      movements: [...container.movements, movement],
    });

    if (result.success && result.data) {
      emit('container.reefer_unplugged', { container: result.data }, {
        facilityId: container.facilityId,
        tenantId: container.tenantId,
        source: 'ContainerEngine',
      });
    }

    return result;
  }

  updateReeferTemperature(containerId: UUID, temperature: number): OperationResult<Container> {
    const container = this.containers.get(containerId);
    if (!container || !container.reefer) {
      return { success: false, error: 'Reefer container not found', errorCode: 'NOT_FOUND' };
    }

    const setTemp = container.reefer.setTemperature;
    const deviation = Math.abs(temperature - setTemp);
    const isAlert = deviation > 3; // 3 degree deviation threshold

    const updatedReefer: ReeferInfo = {
      ...container.reefer,
      currentTemperature: temperature,
      lastTempReading: new Date(),
      tempAlerts: isAlert
        ? [...container.reefer.tempAlerts, {
            timestamp: new Date(),
            actualTemp: temperature,
            setTemp,
            deviation,
            acknowledged: false,
          }]
        : container.reefer.tempAlerts,
    };

    const result = this.updateContainer(containerId, { reefer: updatedReefer });

    if (result.success && result.data && isAlert) {
      emit('container.reefer_temp_alert', {
        container: result.data,
        actualTemp: temperature,
        setTemp,
        deviation,
      }, {
        facilityId: container.facilityId,
        tenantId: container.tenantId,
        source: 'ContainerEngine',
      });
    }

    return result;
  }

  // ===========================================================================
  // PHOTOS & DOCUMENTS
  // ===========================================================================

  addPhoto(containerId: UUID, photo: Omit<ContainerPhoto, 'id'>): OperationResult<Container> {
    const container = this.containers.get(containerId);
    if (!container) {
      return { success: false, error: 'Container not found', errorCode: 'NOT_FOUND' };
    }

    const newPhoto: ContainerPhoto = {
      ...photo,
      id: uuidv4(),
    };

    return this.updateContainer(containerId, {
      photos: [...container.photos, newPhoto],
    });
  }

  addDocument(containerId: UUID, document: Attachment): OperationResult<Container> {
    const container = this.containers.get(containerId);
    if (!container) {
      return { success: false, error: 'Container not found', errorCode: 'NOT_FOUND' };
    }

    return this.updateContainer(containerId, {
      documents: [...container.documents, document],
    });
  }

  // ===========================================================================
  // CUSTOMS STATUS
  // ===========================================================================

  updateCustomsStatus(containerId: UUID, status: CustomsStatus, reference?: string): OperationResult<Container> {
    const container = this.containers.get(containerId);
    if (!container) {
      return { success: false, error: 'Container not found', errorCode: 'NOT_FOUND' };
    }

    const updates: Partial<Container> = { customsStatus: status };
    if (reference) {
      if (status === 'out_of_charge') {
        updates.boeNumber = reference;
      } else if (status === 'let_export') {
        updates.sbNumber = reference;
      }
    }

    const result = this.updateContainer(containerId, updates);

    if (result.success && result.data) {
      emit('customs.out_of_charge', {
        container: result.data,
        status,
        reference,
      }, {
        facilityId: container.facilityId,
        tenantId: container.tenantId,
        source: 'ContainerEngine',
      });
    }

    return result;
  }

  // ===========================================================================
  // STATISTICS
  // ===========================================================================

  getContainerStats(facilityId: UUID): ContainerStats {
    const containers = this.getContainersByFacility(facilityId);

    const stats: ContainerStats = {
      total: containers.length,
      byStatus: {},
      bySize: { '20': 0, '40': 0, '45': 0 },
      byType: {},
      totalTEU: 0,
      reeferCount: 0,
      reeferPluggedIn: 0,
      hazmatCount: 0,
      onHoldCount: 0,
      overdueCount: 0,
    };

    const now = new Date();

    for (const container of containers) {
      // By status
      stats.byStatus[container.status] = (stats.byStatus[container.status] ?? 0) + 1;

      // By size
      stats.bySize[container.size] = (stats.bySize[container.size] ?? 0) + 1;

      // By type
      stats.byType[container.type] = (stats.byType[container.type] ?? 0) + 1;

      // TEU
      stats.totalTEU += getContainerTEU(container.size);

      // Reefer
      if (container.reefer) {
        stats.reeferCount++;
        if (container.reefer.pluggedIn) {
          stats.reeferPluggedIn++;
        }
      }

      // Hazmat
      if (container.hazmat) {
        stats.hazmatCount++;
      }

      // On hold
      if (container.holds.some(h => !h.releasedAt)) {
        stats.onHoldCount++;
      }

      // Overdue (past free time)
      if (container.freeTimeExpiry && container.freeTimeExpiry < now) {
        stats.overdueCount++;
      }
    }

    return stats;
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface RegisterContainerInput {
  tenantId: string;
  facilityId: UUID;
  containerNumber: string;
  isoType: ContainerISOType;
  owner?: string;
  ownerName?: string;
  operator?: string;
  tareWeight?: number;
  grossWeight?: number;
  maxPayload?: number;
  vgmWeight?: number;
  vgmCertifiedBy?: string;
  sealNumbers?: string[];
  cargoDescription?: string;
  harmonizedCode?: string;
  packagesCount?: number;
  packageType?: string;
  hazmat?: HazmatInfo;
  reefer?: ReeferInfo;
  oog?: OverGaugeInfo;
  condition?: ContainerCondition;
  bookingRef?: string;
  blNumber?: string;
  deliveryOrderNumber?: string;
  vesselVoyage?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  finalDestination?: string;
  eta?: Date;
  customsStatus?: CustomsStatus;
  boeNumber?: string;
  sbNumber?: string;
  igmNumber?: string;
  igmLineNumber?: number;
}

export interface ContainerQueryOptions {
  status?: ContainerStatus;
  customsStatus?: CustomsStatus;
  hasHold?: boolean;
  isReefer?: boolean;
  isHazmat?: boolean;
  owner?: string;
  blNumber?: string;
}

export interface GateInInput {
  gateId: string;
  laneId?: string;
  truckNumber: string;
  driverName?: string;
  driverLicense?: string;
  driverPhone?: string;
  location?: YardLocation;
  sealVerified?: boolean;
  newSealNumbers?: string[];
  condition?: ContainerCondition;
  deliveryOrderNumber?: string;
  eWayBillNumber?: string;
  equipmentId?: UUID;
  operatorId?: UUID;
  notes?: string;
}

export interface GroundInput {
  equipmentId?: UUID;
  operatorId?: UUID;
  workOrderId?: UUID;
}

export interface PickInput {
  destination?: string;
  equipmentId?: UUID;
  operatorId?: UUID;
  workOrderId?: UUID;
}

export interface GateOutInput {
  gateId: string;
  laneId?: string;
  truckNumber: string;
  driverName?: string;
  driverLicense?: string;
  driverPhone?: string;
  deliveryOrderNumber?: string;
  eWayBillNumber?: string;
  equipmentId?: UUID;
  operatorId?: UUID;
  overrideHolds?: boolean;
}

export interface PlaceHoldInput {
  type: HoldType;
  reason: string;
  placedBy: string;
  reference?: string;
  autoRelease?: Date;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface PlugReeferInput {
  plugId?: string;
}

export interface ContainerStats {
  total: number;
  byStatus: Record<string, number>;
  bySize: Record<ContainerSize, number>;
  byType: Record<string, number>;
  totalTEU: number;
  reeferCount: number;
  reeferPluggedIn: number;
  hazmatCount: number;
  onHoldCount: number;
  overdueCount: number;
}

// ============================================================================
// HELPERS
// ============================================================================

function getDefaultTareWeight(size: ContainerSize): number {
  switch (size) {
    case '20': return 2200;
    case '40': return 3800;
    case '45': return 4200;
    default: return 2200;
  }
}

function getDefaultMaxPayload(size: ContainerSize): number {
  switch (size) {
    case '20': return 28000;
    case '40': return 26500;
    case '45': return 25500;
    default: return 28000;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let containerEngineInstance: ContainerEngine | null = null;

export function getContainerEngine(): ContainerEngine {
  if (!containerEngineInstance) {
    containerEngineInstance = new ContainerEngine();
  }
  return containerEngineInstance;
}

export function setContainerEngine(engine: ContainerEngine): void {
  containerEngineInstance = engine;
}
