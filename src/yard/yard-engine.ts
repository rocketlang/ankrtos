// Yard Engine - Yard Planning and Slot Management

import { v4 as uuidv4 } from 'uuid';
import { emit } from '../core/event-bus';
import { getFacilityManager } from '../facility/facility-manager';
import { getContainerEngine } from '../containers/container-engine';
import type {
  YardWorkOrder,
  YardOccupancy,
  ZoneOccupancy,
  SlotRecommendation,
  PlacementStrategy,
  YardOperationType,
} from '../types/yard';
import type { YardLocation, GroundSlot, YardBlock, ZoneType } from '../types/facility';
import type { Container } from '../types/container';
import type { UUID, OperationResult } from '../types/common';

// ============================================================================
// YARD ENGINE
// ============================================================================

export class YardEngine {
  private workOrders: Map<UUID, YardWorkOrder> = new Map();

  // Indexes
  private workOrdersByFacility: Map<UUID, Set<UUID>> = new Map();
  private workOrdersByContainer: Map<UUID, Set<UUID>> = new Map();
  private pendingWorkOrders: Map<UUID, Set<UUID>> = new Map(); // by facility

  // Work order number counter
  private workOrderCounter = 0;

  // ===========================================================================
  // SLOT RECOMMENDATIONS
  // ===========================================================================

  recommendSlot(
    facilityId: UUID,
    container: Container,
    strategy: PlacementStrategy = 'minimize_rehandles',
    options?: SlotRecommendationOptions
  ): SlotRecommendation[] {
    const facilityManager = getFacilityManager();
    const availableSlots = facilityManager.getAvailableSlots(facilityId, {
      zoneType: options?.zoneType,
      blockId: options?.blockId,
      minTiers: 1,
      reeferRequired: !!container.reefer,
      hazmatRequired: !!container.hazmat,
    });

    if (availableSlots.length === 0) {
      return [];
    }

    // Score each slot based on strategy
    const scoredSlots: SlotRecommendation[] = availableSlots.map(slot => {
      const block = facilityManager.getBlock(slot.blockId);
      const location = this.slotToLocation(facilityId, slot, block!);
      const score = this.calculateSlotScore(slot, block!, container, strategy, options);
      const reasons = this.getPlacementReasons(slot, block!, container, strategy);
      const warnings = this.getPlacementWarnings(slot, block!, container);

      return {
        location,
        score,
        reasons,
        warnings: warnings.length > 0 ? warnings : undefined,
        rehandlesRequired: this.estimateRehandles(slot, container),
        distanceFromGate: this.estimateDistanceFromGate(slot, block!),
        stackHeight: slot.currentTiers + 1,
        groundPressure: this.calculateGroundPressure(slot, container.grossWeight ?? 0),
      };
    });

    // Sort by score (highest first)
    scoredSlots.sort((a, b) => b.score - a.score);

    // Return top recommendations
    return scoredSlots.slice(0, options?.maxRecommendations ?? 5);
  }

  private calculateSlotScore(
    slot: GroundSlot,
    _block: YardBlock,
    container: Container,
    strategy: PlacementStrategy,
    options?: SlotRecommendationOptions
  ): number {
    let score = 50; // Base score

    const availableTiers = slot.maxTiers - slot.currentTiers;

    switch (strategy) {
      case 'minimize_rehandles':
        // Prefer empty slots or slots where this container will be on top
        if (slot.currentTiers === 0) score += 30;
        else if (availableTiers >= 2) score += 20;
        // Prefer lower stacks
        score += (slot.maxTiers - slot.currentTiers) * 5;
        break;

      case 'optimize_dwell':
        // Prefer slots that allow FIFO (containers with earlier ETA at bottom)
        if (slot.currentTiers === 0) score += 25;
        // TODO: Check dwell time of existing containers
        break;

      case 'cluster_vessel':
        // Prefer slots with containers from same vessel
        if (options?.vesselVoyage) {
          // TODO: Check if existing containers are from same vessel
        }
        break;

      case 'cluster_destination':
        // Prefer slots with containers going to same destination
        if (options?.destination) {
          // TODO: Check destinations of existing containers
        }
        break;

      case 'weight_distribution':
        // Prefer slots with balanced weight distribution
        const pressure = this.calculateGroundPressure(slot, container.grossWeight ?? 0);
        if (pressure < 50) score += 20;
        else if (pressure < 75) score += 10;
        break;

      case 'equipment_efficiency':
        // Prefer slots closer to staging areas
        score += 30 - Math.min(30, slot.row * 2); // Prefer front rows
        break;
    }

    // Reefer bonus
    if (container.reefer && slot.slotType === 'reefer') {
      score += 20;
      if (slot.reeferPlugs && slot.reeferPlugs > 0) score += 10;
    }

    // Hazmat bonus
    if (container.hazmat && slot.slotType === 'hazmat') {
      score += 20;
    }

    // Penalize if slot type doesn't match
    if (container.reefer && slot.slotType !== 'reefer') score -= 30;
    if (container.hazmat && slot.slotType !== 'hazmat') score -= 30;

    return Math.max(0, Math.min(100, score));
  }

  private getPlacementReasons(
    slot: GroundSlot,
    _block: YardBlock,
    container: Container,
    strategy: PlacementStrategy
  ): string[] {
    const reasons: string[] = [];

    if (slot.currentTiers === 0) {
      reasons.push('Empty slot - no rehandles needed');
    }

    if (container.reefer && slot.slotType === 'reefer') {
      reasons.push('Reefer-capable slot with power connection');
    }

    if (container.hazmat && slot.slotType === 'hazmat') {
      reasons.push('Hazmat-designated area');
    }

    if (strategy === 'minimize_rehandles' && slot.currentTiers < 2) {
      reasons.push('Low stack height minimizes future rehandles');
    }

    return reasons;
  }

  private getPlacementWarnings(
    slot: GroundSlot,
    _block: YardBlock,
    container: Container
  ): string[] {
    const warnings: string[] = [];

    if (slot.currentTiers >= slot.maxTiers - 1) {
      warnings.push('Slot nearly at maximum height');
    }

    if (container.reefer && slot.slotType !== 'reefer') {
      warnings.push('Not a reefer slot - power may not be available');
    }

    if (container.hazmat && slot.slotType !== 'hazmat') {
      warnings.push('Not in hazmat zone - may require special handling');
    }

    return warnings;
  }

  private estimateRehandles(slot: GroundSlot, _container: Container): number {
    // Simple estimation: if not empty, may need rehandles later
    return slot.currentTiers > 0 ? Math.floor(slot.currentTiers / 2) : 0;
  }

  private estimateDistanceFromGate(slot: GroundSlot, _block: YardBlock): number {
    // Simplified calculation - rows closer to front are closer to gate
    const rowFactor = slot.row * 10; // 10 meters per row
    const slotFactor = slot.slot * 3;  // 3 meters per slot
    return rowFactor + slotFactor;
  }

  private calculateGroundPressure(slot: GroundSlot, additionalWeight: number): number {
    // Estimate current weight and add new container
    const existingWeight = slot.currentTiers * 25000; // ~25 tons per container average
    const totalWeight = existingWeight + additionalWeight;

    // Assume 20ft slot area: 6m x 2.5m = 15 sqm
    const slotArea = 15;
    const pressureKgPerSqm = totalWeight / slotArea;

    // Return as percentage of typical max (5000 kg/sqm)
    return (pressureKgPerSqm / 5000) * 100;
  }

  private slotToLocation(facilityId: UUID, slot: GroundSlot, block: YardBlock): YardLocation {
    return {
      facilityId,
      zoneId: block.zoneId,
      blockId: block.id,
      row: slot.row,
      slot: slot.slot,
      tier: slot.currentTiers + 1,
      barcode: slot.barcode,
      fullPath: `${block.code}-${String(slot.row).padStart(2, '0')}-${String(slot.slot).padStart(2, '0')}-${slot.currentTiers + 1}`,
    };
  }

  // ===========================================================================
  // WORK ORDERS
  // ===========================================================================

  createWorkOrder(input: CreateWorkOrderInput): OperationResult<YardWorkOrder> {
    const containerEngine = getContainerEngine();

    const container = containerEngine.getContainer(input.containerId);
    if (!container) {
      return { success: false, error: 'Container not found', errorCode: 'CONTAINER_NOT_FOUND' };
    }

    this.workOrderCounter++;
    const workOrderNumber = `WO-${Date.now().toString(36).toUpperCase()}-${this.workOrderCounter.toString().padStart(5, '0')}`;

    const workOrder: YardWorkOrder = {
      id: uuidv4(),
      tenantId: container.tenantId,
      facilityId: container.facilityId,
      workOrderNumber,
      orderType: input.orderType,
      containerId: input.containerId,
      containerNumber: container.containerNumber,
      containerSize: container.size,
      fromLocation: input.fromLocation,
      toLocation: input.toLocation,
      priority: input.priority ?? 5,
      isUrgent: input.isUrgent ?? false,
      assignedEquipmentId: input.assignedEquipmentId,
      assignedOperatorId: input.assignedOperatorId,
      parentPlanId: input.parentPlanId,
      parentSequence: input.parentSequence,
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
      }],
      instructions: input.instructions,
      estimatedDuration: input.estimatedDuration,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.workOrders.set(workOrder.id, workOrder);

    // Index by facility
    if (!this.workOrdersByFacility.has(container.facilityId)) {
      this.workOrdersByFacility.set(container.facilityId, new Set());
    }
    this.workOrdersByFacility.get(container.facilityId)?.add(workOrder.id);

    // Index by container
    if (!this.workOrdersByContainer.has(input.containerId)) {
      this.workOrdersByContainer.set(input.containerId, new Set());
    }
    this.workOrdersByContainer.get(input.containerId)?.add(workOrder.id);

    // Index pending
    if (!this.pendingWorkOrders.has(container.facilityId)) {
      this.pendingWorkOrders.set(container.facilityId, new Set());
    }
    this.pendingWorkOrders.get(container.facilityId)?.add(workOrder.id);

    emit('yard.work_order_created', { workOrder }, {
      facilityId: container.facilityId,
      tenantId: container.tenantId,
      source: 'YardEngine',
    });

    return { success: true, data: workOrder };
  }

  getWorkOrder(id: UUID): YardWorkOrder | undefined {
    return this.workOrders.get(id);
  }

  getWorkOrdersByFacility(facilityId: UUID, status?: string): YardWorkOrder[] {
    const workOrderIds = this.workOrdersByFacility.get(facilityId);
    if (!workOrderIds) return [];

    let workOrders = Array.from(workOrderIds)
      .map(id => this.workOrders.get(id)!)
      .filter(Boolean);

    if (status) {
      workOrders = workOrders.filter(wo => wo.status === status);
    }

    return workOrders.sort((a, b) => b.priority - a.priority);
  }

  getPendingWorkOrders(facilityId: UUID): YardWorkOrder[] {
    const pendingIds = this.pendingWorkOrders.get(facilityId);
    if (!pendingIds) return [];

    return Array.from(pendingIds)
      .map(id => this.workOrders.get(id)!)
      .filter(Boolean)
      .sort((a, b) => {
        // Urgent first, then by priority
        if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
        return b.priority - a.priority;
      });
  }

  assignWorkOrder(workOrderId: UUID, equipmentId: UUID, operatorId?: UUID): OperationResult<YardWorkOrder> {
    const workOrder = this.workOrders.get(workOrderId);
    if (!workOrder) {
      return { success: false, error: 'Work order not found', errorCode: 'NOT_FOUND' };
    }

    if (workOrder.status !== 'pending') {
      return { success: false, error: 'Work order not in pending status', errorCode: 'INVALID_STATUS' };
    }

    const updated: YardWorkOrder = {
      ...workOrder,
      assignedEquipmentId: equipmentId,
      assignedOperatorId: operatorId,
      status: 'assigned',
      assignedAt: new Date(),
      updatedAt: new Date(),
      statusHistory: [...workOrder.statusHistory, {
        status: 'assigned',
        timestamp: new Date(),
      }],
    };

    this.workOrders.set(workOrderId, updated);
    this.pendingWorkOrders.get(workOrder.facilityId)?.delete(workOrderId);

    emit('yard.work_order_assigned', {
      workOrder: updated,
      equipmentId,
      operatorId,
    }, {
      facilityId: workOrder.facilityId,
      tenantId: workOrder.tenantId,
      source: 'YardEngine',
    });

    return { success: true, data: updated };
  }

  startWorkOrder(workOrderId: UUID): OperationResult<YardWorkOrder> {
    const workOrder = this.workOrders.get(workOrderId);
    if (!workOrder) {
      return { success: false, error: 'Work order not found', errorCode: 'NOT_FOUND' };
    }

    if (workOrder.status !== 'assigned') {
      return { success: false, error: 'Work order not assigned', errorCode: 'INVALID_STATUS' };
    }

    const updated: YardWorkOrder = {
      ...workOrder,
      status: 'in_progress',
      startedAt: new Date(),
      updatedAt: new Date(),
      statusHistory: [...workOrder.statusHistory, {
        status: 'in_progress',
        timestamp: new Date(),
      }],
    };

    this.workOrders.set(workOrderId, updated);

    emit('yard.work_order_started', { workOrder: updated }, {
      facilityId: workOrder.facilityId,
      tenantId: workOrder.tenantId,
      source: 'YardEngine',
    });

    return { success: true, data: updated };
  }

  completeWorkOrder(workOrderId: UUID, completionNotes?: string): OperationResult<YardWorkOrder> {
    const workOrder = this.workOrders.get(workOrderId);
    if (!workOrder) {
      return { success: false, error: 'Work order not found', errorCode: 'NOT_FOUND' };
    }

    if (workOrder.status !== 'in_progress') {
      return { success: false, error: 'Work order not in progress', errorCode: 'INVALID_STATUS' };
    }

    const completedAt = new Date();
    const actualDuration = workOrder.startedAt
      ? Math.round((completedAt.getTime() - workOrder.startedAt.getTime()) / 60000)
      : undefined;

    const updated: YardWorkOrder = {
      ...workOrder,
      status: 'completed',
      completedAt,
      actualDuration,
      completionNotes,
      updatedAt: new Date(),
      statusHistory: [...workOrder.statusHistory, {
        status: 'completed',
        timestamp: completedAt,
      }],
    };

    this.workOrders.set(workOrderId, updated);

    emit('yard.work_order_completed', { workOrder: updated }, {
      facilityId: workOrder.facilityId,
      tenantId: workOrder.tenantId,
      source: 'YardEngine',
    });

    return { success: true, data: updated };
  }

  cancelWorkOrder(workOrderId: UUID, reason: string): OperationResult<YardWorkOrder> {
    const workOrder = this.workOrders.get(workOrderId);
    if (!workOrder) {
      return { success: false, error: 'Work order not found', errorCode: 'NOT_FOUND' };
    }

    if (['completed', 'cancelled'].includes(workOrder.status)) {
      return { success: false, error: 'Work order already completed or cancelled', errorCode: 'INVALID_STATUS' };
    }

    const updated: YardWorkOrder = {
      ...workOrder,
      status: 'cancelled',
      cancelledAt: new Date(),
      failureReason: reason,
      updatedAt: new Date(),
      statusHistory: [...workOrder.statusHistory, {
        status: 'cancelled',
        timestamp: new Date(),
        reason,
      }],
    };

    this.workOrders.set(workOrderId, updated);
    this.pendingWorkOrders.get(workOrder.facilityId)?.delete(workOrderId);

    emit('yard.work_order_cancelled', { workOrder: updated, reason }, {
      facilityId: workOrder.facilityId,
      tenantId: workOrder.tenantId,
      source: 'YardEngine',
    });

    return { success: true, data: updated };
  }

  // ===========================================================================
  // YARD OCCUPANCY
  // ===========================================================================

  getYardOccupancy(facilityId: UUID): YardOccupancy {
    const facilityManager = getFacilityManager();
    const containerEngine = getContainerEngine();

    const containers = containerEngine.getContainersByFacility(facilityId);
    const blocks = facilityManager.getBlocksByFacility(facilityId);

    const occupancy: YardOccupancy = {
      facilityId,
      timestamp: new Date(),
      totalSlots: 0,
      occupiedSlots: 0,
      availableSlots: 0,
      utilizationPercent: 0,
      totalTEU: 0,
      bySize: { '20': 0, '40': 0, '45': 0 },
      byType: {},
      byStatus: {},
      byZone: [],
      reeferCount: 0,
      reeferPluggedIn: 0,
      hazmatCount: 0,
      overdueCount: 0,
      longStayCount: 0,
    };

    // Aggregate block data
    const zoneOccupancy: Map<UUID, ZoneOccupancy> = new Map();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const block of blocks) {
      const slots = facilityManager.getSlotsByBlock(block.id);
      const zone = facilityManager.getZone(block.zoneId);

      for (const slot of slots) {
        occupancy.totalSlots++;
        if (slot.currentTiers > 0) {
          occupancy.occupiedSlots++;
        }
      }

      // Aggregate zone data
      if (zone && !zoneOccupancy.has(zone.id)) {
        zoneOccupancy.set(zone.id, {
          zoneId: zone.id,
          zoneName: zone.name,
          zoneType: zone.type,
          totalSlots: 0,
          occupiedSlots: 0,
          utilizationPercent: 0,
          teuCount: 0,
        });
      }

      if (zone) {
        const zo = zoneOccupancy.get(zone.id)!;
        const blockSlots = facilityManager.getSlotsByBlock(block.id);
        zo.totalSlots += blockSlots.length;
        zo.occupiedSlots += blockSlots.filter(s => s.currentTiers > 0).length;
      }
    }

    // Container-level statistics
    for (const container of containers) {
      if (container.status === 'grounded') {
        const teu = container.size === '20' ? 1 : 2;
        occupancy.totalTEU += teu;
        occupancy.bySize[container.size]++;
        occupancy.byType[container.type] = (occupancy.byType[container.type] ?? 0) + 1;

        if (container.reefer) {
          occupancy.reeferCount++;
          if (container.reefer.pluggedIn) {
            occupancy.reeferPluggedIn++;
          }
        }

        if (container.hazmat) {
          occupancy.hazmatCount++;
        }

        if (container.freeTimeExpiry && container.freeTimeExpiry < now) {
          occupancy.overdueCount++;
        }

        if (container.groundedTime && container.groundedTime < sevenDaysAgo) {
          occupancy.longStayCount++;
        }

        // Update zone TEU
        if (container.currentLocation) {
          const zone = zoneOccupancy.get(container.currentLocation.zoneId!);
          if (zone) {
            zone.teuCount += teu;
          }
        }
      }

      occupancy.byStatus[container.status] = (occupancy.byStatus[container.status] ?? 0) + 1;
    }

    // Calculate utilization percentages
    occupancy.availableSlots = occupancy.totalSlots - occupancy.occupiedSlots;
    occupancy.utilizationPercent = occupancy.totalSlots > 0
      ? (occupancy.occupiedSlots / occupancy.totalSlots) * 100
      : 0;

    // Finalize zone occupancy
    for (const zo of zoneOccupancy.values()) {
      zo.utilizationPercent = zo.totalSlots > 0
        ? (zo.occupiedSlots / zo.totalSlots) * 100
        : 0;
      occupancy.byZone.push(zo);
    }

    return occupancy;
  }

  // ===========================================================================
  // CAPACITY ALERTS
  // ===========================================================================

  checkCapacityAlerts(facilityId: UUID): void {
    const occupancy = this.getYardOccupancy(facilityId);
    const facilityManager = getFacilityManager();
    const facility = facilityManager.getFacility(facilityId);

    if (!facility) return;

    const eventContext = {
      facilityId,
      tenantId: facility.tenantId,
      source: 'YardEngine',
    };

    // Overall capacity alerts
    if (occupancy.utilizationPercent >= 95) {
      emit('yard.capacity_critical', {
        facilityId,
        utilization: occupancy.utilizationPercent,
        availableSlots: occupancy.availableSlots,
      }, eventContext);
    } else if (occupancy.utilizationPercent >= 85) {
      emit('yard.capacity_warning', {
        facilityId,
        utilization: occupancy.utilizationPercent,
        availableSlots: occupancy.availableSlots,
      }, eventContext);
    }

    // Zone-level alerts
    for (const zone of occupancy.byZone) {
      if (zone.utilizationPercent >= 95) {
        emit('yard.congestion_alert', {
          facilityId,
          zoneId: zone.zoneId,
          zoneName: zone.zoneName,
          utilization: zone.utilizationPercent,
        }, eventContext);
      }
    }
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface SlotRecommendationOptions {
  zoneType?: ZoneType;
  blockId?: UUID;
  vesselVoyage?: string;
  destination?: string;
  maxRecommendations?: number;
}

export interface CreateWorkOrderInput {
  containerId: UUID;
  orderType: YardOperationType;
  fromLocation: YardLocation | 'rail' | 'truck' | 'vessel' | 'gate';
  toLocation: YardLocation | 'rail' | 'truck' | 'vessel' | 'gate';
  priority?: number;
  isUrgent?: boolean;
  assignedEquipmentId?: UUID;
  assignedOperatorId?: UUID;
  parentPlanId?: UUID;
  parentSequence?: number;
  instructions?: string;
  estimatedDuration?: number;
}

// ============================================================================
// SINGLETON
// ============================================================================

let yardEngineInstance: YardEngine | null = null;

export function getYardEngine(): YardEngine {
  if (!yardEngineInstance) {
    yardEngineInstance = new YardEngine();
  }
  return yardEngineInstance;
}

export function setYardEngine(engine: YardEngine): void {
  yardEngineInstance = engine;
}
