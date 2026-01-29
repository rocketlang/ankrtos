// Waterfront Engine for ankrICD
// Comprehensive port/waterfront operations management - Berth, Vessel Visit, Quay Crane

import { v4 as uuidv4 } from 'uuid';
import type {
  UUID,
  OperationResult,
  PaginatedResult,
} from '../types/common';
import type {
  Berth,
  BerthStatus,
  VesselVisit,
  VesselStatus,
  QuayCrane,
  CraneType,
  VesselStowPlan,
  BayPlan,
} from '../types/transport';
import { emit } from '../core';

// ============================================================================
// WATERFRONT ENGINE
// ============================================================================

export class WaterfrontEngine {
  private static instance: WaterfrontEngine | null = null;

  // In-memory stores (would be database in production)
  private berths: Map<UUID, Berth> = new Map();
  private vesselVisits: Map<UUID, VesselVisit> = new Map();
  private cranes: Map<UUID, QuayCrane> = new Map();
  private stowPlans: Map<UUID, VesselStowPlan> = new Map();

  private constructor() {}

  static getInstance(): WaterfrontEngine {
    if (!WaterfrontEngine.instance) {
      WaterfrontEngine.instance = new WaterfrontEngine();
    }
    return WaterfrontEngine.instance;
  }

  // Reset for testing
  static resetInstance(): void {
    WaterfrontEngine.instance = null;
  }

  // ============================================================================
  // BERTH MANAGEMENT
  // ============================================================================

  /**
   * Register a new berth
   */
  registerBerth(input: RegisterBerthInput): OperationResult<Berth> {
    // Validate berth number uniqueness within tenant
    const existingBerth = Array.from(this.berths.values()).find(
      b => b.berthNumber === input.berthNumber && b.tenantId === input.tenantId
    );

    if (existingBerth) {
      return {
        success: false,
        error: `Berth ${input.berthNumber} already exists`,
        errorCode: 'DUPLICATE_BERTH',
      };
    }

    const berth: Berth = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      berthNumber: input.berthNumber,
      name: input.name,
      length: input.length,
      depth: input.depth,
      maxLOA: input.maxLOA,
      maxBeam: input.maxBeam,
      maxDraft: input.maxDraft,
      bollardPull: input.bollardPull,
      cranes: [],
      fenders: input.fenders,
      status: 'available',
      coordinates: input.coordinates,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.berths.set(berth.id, berth);

    emit('vessel.berth_requested', {
      berthId: berth.id,
      berthNumber: berth.berthNumber,
      length: berth.length,
      maxLOA: berth.maxLOA,
      maxDraft: berth.maxDraft,
    }, { tenantId: berth.tenantId });

    return { success: true, data: berth };
  }

  /**
   * Get berth by ID
   */
  getBerth(berthId: UUID): Berth | undefined {
    return this.berths.get(berthId);
  }

  /**
   * List berths with filtering
   */
  listBerths(options: BerthQueryOptions = {}): PaginatedResult<Berth> {
    let berths = Array.from(this.berths.values());

    if (options.tenantId) {
      berths = berths.filter(b => b.tenantId === options.tenantId);
    }
    if (options.facilityId) {
      berths = berths.filter(b => b.facilityId === options.facilityId);
    }
    if (options.status) {
      berths = berths.filter(b => b.status === options.status);
    }
    if (options.availableOnly) {
      berths = berths.filter(b => b.status === 'available');
    }
    if (options.minLength) {
      berths = berths.filter(b => b.length >= options.minLength!);
    }
    if (options.minDepth) {
      berths = berths.filter(b => b.depth >= options.minDepth!);
    }

    const total = berths.length;
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 50;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    berths = berths.slice(offset, offset + pageSize);

    return {
      data: berths,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Update berth status
   */
  updateBerthStatus(berthId: UUID, status: BerthStatus): OperationResult<Berth> {
    const berth = this.berths.get(berthId);
    if (!berth) {
      return { success: false, error: 'Berth not found', errorCode: 'NOT_FOUND' };
    }

    berth.status = status;
    berth.updatedAt = new Date();
    this.berths.set(berthId, berth);

    return { success: true, data: berth };
  }

  // ============================================================================
  // VESSEL VISIT MANAGEMENT
  // ============================================================================

  /**
   * Pre-advise / announce a vessel visit
   */
  announceVessel(input: AnnounceVesselInput): OperationResult<VesselVisit> {
    // Validate IMO number uniqueness for active visits
    const existingVisit = Array.from(this.vesselVisits.values()).find(
      v => v.imoNumber === input.imoNumber &&
           v.voyageNumber === input.voyageNumber &&
           v.tenantId === input.tenantId &&
           !['departed', 'cancelled'].includes(v.status)
    );

    if (existingVisit) {
      return {
        success: false,
        error: `Vessel ${input.vesselName} (IMO ${input.imoNumber}, Voyage ${input.voyageNumber}) already has an active visit`,
        errorCode: 'DUPLICATE_VISIT',
      };
    }

    const totalMoves = input.dischargeContainers + input.loadContainers +
      (input.shiftContainers ?? 0) + (input.restowContainers ?? 0);

    const visit: VesselVisit = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      vesselName: input.vesselName,
      imoNumber: input.imoNumber,
      callSign: input.callSign,
      flag: input.flag,
      vesselType: input.vesselType,
      voyageNumber: input.voyageNumber,
      shippingLine: input.shippingLine,
      service: input.service,
      loa: input.loa,
      beam: input.beam,
      draft: input.draft,
      eta: input.eta,
      etb: input.etb,
      etd: input.etd,
      berthSide: input.berthSide,
      dischargeContainers: input.dischargeContainers,
      loadContainers: input.loadContainers,
      shiftContainers: input.shiftContainers,
      restowContainers: input.restowContainers,
      totalMoves,
      dischargeDone: 0,
      loadDone: 0,
      status: 'announced',
      hasStowPlan: false,
      shippingAgent: input.shippingAgent,
      agentContact: input.agentContact,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.vesselVisits.set(visit.id, visit);

    emit('vessel.announced', {
      visitId: visit.id,
      vesselName: visit.vesselName,
      imoNumber: visit.imoNumber,
      voyageNumber: visit.voyageNumber,
      shippingLine: visit.shippingLine,
      eta: visit.eta,
      dischargeContainers: visit.dischargeContainers,
      loadContainers: visit.loadContainers,
      totalMoves: visit.totalMoves,
    }, { tenantId: visit.tenantId });

    return { success: true, data: visit };
  }

  /**
   * Get vessel visit by ID
   */
  getVesselVisit(visitId: UUID): VesselVisit | undefined {
    return this.vesselVisits.get(visitId);
  }

  /**
   * List vessel visits with filtering
   */
  listVesselVisits(options: VesselVisitQueryOptions = {}): PaginatedResult<VesselVisit> {
    let visits = Array.from(this.vesselVisits.values());

    if (options.tenantId) {
      visits = visits.filter(v => v.tenantId === options.tenantId);
    }
    if (options.facilityId) {
      visits = visits.filter(v => v.facilityId === options.facilityId);
    }
    if (options.status) {
      visits = visits.filter(v => v.status === options.status);
    }
    if (options.statuses) {
      visits = visits.filter(v => options.statuses!.includes(v.status));
    }
    if (options.shippingLine) {
      visits = visits.filter(v => v.shippingLine === options.shippingLine);
    }
    if (options.berthId) {
      visits = visits.filter(v => v.berthId === options.berthId);
    }
    if (options.fromDate) {
      visits = visits.filter(v => v.eta >= options.fromDate!);
    }
    if (options.toDate) {
      visits = visits.filter(v => v.eta <= options.toDate!);
    }

    // Sort by ETA by default
    visits.sort((a, b) => a.eta.getTime() - b.eta.getTime());

    const total = visits.length;
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 50;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    visits = visits.slice(offset, offset + pageSize);

    return {
      data: visits,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Assign a berth to a vessel visit
   */
  assignBerth(visitId: UUID, berthId: UUID): OperationResult<VesselVisit> {
    const visit = this.vesselVisits.get(visitId);
    if (!visit) {
      return { success: false, error: 'Vessel visit not found', errorCode: 'NOT_FOUND' };
    }

    const berth = this.berths.get(berthId);
    if (!berth) {
      return { success: false, error: 'Berth not found', errorCode: 'NOT_FOUND' };
    }

    if (berth.status !== 'available' && berth.status !== 'reserved') {
      return {
        success: false,
        error: `Berth ${berth.berthNumber} is not available (status: ${berth.status})`,
        errorCode: 'BERTH_NOT_AVAILABLE',
      };
    }

    if (visit.loa > berth.maxLOA) {
      return {
        success: false,
        error: `Vessel LOA (${visit.loa}m) exceeds berth max LOA (${berth.maxLOA}m)`,
        errorCode: 'LOA_EXCEEDED',
      };
    }

    if (visit.beam > berth.maxBeam) {
      return {
        success: false,
        error: `Vessel beam (${visit.beam}m) exceeds berth max beam (${berth.maxBeam}m)`,
        errorCode: 'BEAM_EXCEEDED',
      };
    }

    if (visit.draft > berth.maxDraft) {
      return {
        success: false,
        error: `Vessel draft (${visit.draft}m) exceeds berth max draft (${berth.maxDraft}m)`,
        errorCode: 'DRAFT_EXCEEDED',
      };
    }

    // Assign berth to visit
    visit.berthId = berthId;
    visit.berthNumber = berth.berthNumber;
    visit.updatedAt = new Date();
    this.vesselVisits.set(visitId, visit);

    // Reserve the berth
    berth.status = 'reserved';
    berth.currentVesselId = visitId;
    berth.updatedAt = new Date();
    this.berths.set(berthId, berth);

    emit('vessel.berth_assigned', {
      visitId: visit.id,
      vesselName: visit.vesselName,
      imoNumber: visit.imoNumber,
      berthId: berth.id,
      berthNumber: berth.berthNumber,
    }, { tenantId: visit.tenantId });

    return { success: true, data: visit };
  }

  /**
   * Record vessel arrival at anchorage (ATA)
   */
  recordArrival(visitId: UUID): OperationResult<VesselVisit> {
    const visit = this.vesselVisits.get(visitId);
    if (!visit) {
      return { success: false, error: 'Vessel visit not found', errorCode: 'NOT_FOUND' };
    }

    if (!['announced'].includes(visit.status)) {
      return {
        success: false,
        error: `Cannot record arrival from status ${visit.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    visit.ata = new Date();
    visit.status = 'at_anchorage';
    visit.updatedAt = new Date();
    this.vesselVisits.set(visitId, visit);

    emit('vessel.at_anchorage', {
      visitId: visit.id,
      vesselName: visit.vesselName,
      imoNumber: visit.imoNumber,
      arrivalTime: visit.ata,
      berthId: visit.berthId,
    }, { tenantId: visit.tenantId });

    return { success: true, data: visit };
  }

  /**
   * Record vessel berthing (ATB)
   */
  recordBerthing(visitId: UUID): OperationResult<VesselVisit> {
    const visit = this.vesselVisits.get(visitId);
    if (!visit) {
      return { success: false, error: 'Vessel visit not found', errorCode: 'NOT_FOUND' };
    }

    if (!visit.berthId) {
      return {
        success: false,
        error: 'Cannot record berthing - no berth assigned',
        errorCode: 'NO_BERTH_ASSIGNED',
      };
    }

    if (!['at_anchorage', 'announced'].includes(visit.status)) {
      return {
        success: false,
        error: `Cannot record berthing from status ${visit.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    visit.atb = new Date();
    if (!visit.ata) {
      visit.ata = new Date(); // Set ATA if not already set
    }
    visit.status = 'alongside';
    visit.updatedAt = new Date();
    this.vesselVisits.set(visitId, visit);

    // Update berth status to occupied
    const berth = this.berths.get(visit.berthId);
    if (berth) {
      berth.status = 'occupied';
      berth.currentVesselId = visitId;
      berth.updatedAt = new Date();
      this.berths.set(berth.id, berth);
    }

    emit('vessel.alongside', {
      visitId: visit.id,
      vesselName: visit.vesselName,
      imoNumber: visit.imoNumber,
      berthId: visit.berthId,
      berthNumber: visit.berthNumber,
      berthingTime: visit.atb,
    }, { tenantId: visit.tenantId });

    return { success: true, data: visit };
  }

  /**
   * Start discharge operations
   */
  startDischarge(visitId: UUID): OperationResult<VesselVisit> {
    const visit = this.vesselVisits.get(visitId);
    if (!visit) {
      return { success: false, error: 'Vessel visit not found', errorCode: 'NOT_FOUND' };
    }

    if (!['alongside'].includes(visit.status)) {
      return {
        success: false,
        error: `Cannot start discharge from status ${visit.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    visit.status = 'working';
    visit.updatedAt = new Date();
    this.vesselVisits.set(visitId, visit);

    emit('vessel.discharge_started', {
      visitId: visit.id,
      vesselName: visit.vesselName,
      imoNumber: visit.imoNumber,
      berthNumber: visit.berthNumber,
      totalDischarge: visit.dischargeContainers,
    }, { tenantId: visit.tenantId });

    return { success: true, data: visit };
  }

  /**
   * Complete discharge operations
   */
  completeDischarge(visitId: UUID): OperationResult<VesselVisit> {
    const visit = this.vesselVisits.get(visitId);
    if (!visit) {
      return { success: false, error: 'Vessel visit not found', errorCode: 'NOT_FOUND' };
    }

    if (visit.status !== 'working') {
      return {
        success: false,
        error: `Vessel is not in working status (current: ${visit.status})`,
        errorCode: 'INVALID_STATUS',
      };
    }

    visit.dischargeDone = visit.dischargeContainers;
    visit.updatedAt = new Date();
    this.vesselVisits.set(visitId, visit);

    emit('vessel.discharge_completed', {
      visitId: visit.id,
      vesselName: visit.vesselName,
      imoNumber: visit.imoNumber,
      containersDischarged: visit.dischargeDone,
    }, { tenantId: visit.tenantId });

    return { success: true, data: visit };
  }

  /**
   * Start loading operations
   */
  startLoading(visitId: UUID): OperationResult<VesselVisit> {
    const visit = this.vesselVisits.get(visitId);
    if (!visit) {
      return { success: false, error: 'Vessel visit not found', errorCode: 'NOT_FOUND' };
    }

    if (!['working', 'alongside'].includes(visit.status)) {
      return {
        success: false,
        error: `Cannot start loading from status ${visit.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    visit.status = 'working';
    visit.updatedAt = new Date();
    this.vesselVisits.set(visitId, visit);

    emit('vessel.loading_started', {
      visitId: visit.id,
      vesselName: visit.vesselName,
      imoNumber: visit.imoNumber,
      berthNumber: visit.berthNumber,
      totalLoad: visit.loadContainers,
    }, { tenantId: visit.tenantId });

    return { success: true, data: visit };
  }

  /**
   * Complete loading operations
   */
  completeLoading(visitId: UUID): OperationResult<VesselVisit> {
    const visit = this.vesselVisits.get(visitId);
    if (!visit) {
      return { success: false, error: 'Vessel visit not found', errorCode: 'NOT_FOUND' };
    }

    if (visit.status !== 'working') {
      return {
        success: false,
        error: `Vessel is not in working status (current: ${visit.status})`,
        errorCode: 'INVALID_STATUS',
      };
    }

    visit.loadDone = visit.loadContainers;
    visit.status = 'idle'; // Operations complete, awaiting departure
    visit.updatedAt = new Date();
    this.vesselVisits.set(visitId, visit);

    emit('vessel.loading_completed', {
      visitId: visit.id,
      vesselName: visit.vesselName,
      imoNumber: visit.imoNumber,
      containersLoaded: visit.loadDone,
      totalMoves: visit.totalMoves,
    }, { tenantId: visit.tenantId });

    return { success: true, data: visit };
  }

  /**
   * Record vessel departure (ATD), release berth and cranes
   */
  recordDeparture(visitId: UUID): OperationResult<VesselVisit> {
    const visit = this.vesselVisits.get(visitId);
    if (!visit) {
      return { success: false, error: 'Vessel visit not found', errorCode: 'NOT_FOUND' };
    }

    if (!['idle', 'working', 'alongside'].includes(visit.status)) {
      return {
        success: false,
        error: `Cannot record departure from status ${visit.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    const berthId = visit.berthId;
    visit.atd = new Date();
    visit.status = 'departed';
    visit.berthId = undefined;
    visit.berthNumber = undefined;
    visit.updatedAt = new Date();
    this.vesselVisits.set(visitId, visit);

    // Release the berth
    if (berthId) {
      const berth = this.berths.get(berthId);
      if (berth) {
        berth.status = 'available';
        berth.currentVesselId = undefined;
        berth.cranes = [];
        berth.updatedAt = new Date();
        this.berths.set(berth.id, berth);
      }
    }

    // Release all cranes assigned to this vessel
    for (const crane of this.cranes.values()) {
      if (crane.currentVesselId === visitId) {
        crane.currentVesselId = undefined;
        crane.currentBerthId = undefined;
        crane.currentBay = undefined;
        crane.status = 'available';
        crane.updatedAt = new Date();
        this.cranes.set(crane.id, crane);
      }
    }

    emit('vessel.departed', {
      visitId: visit.id,
      vesselName: visit.vesselName,
      imoNumber: visit.imoNumber,
      voyageNumber: visit.voyageNumber,
      departureTime: visit.atd,
      dischargeDone: visit.dischargeDone,
      loadDone: visit.loadDone,
      totalMoves: visit.totalMoves,
    }, { tenantId: visit.tenantId });

    return { success: true, data: visit };
  }

  // ============================================================================
  // CRANE MANAGEMENT
  // ============================================================================

  /**
   * Register a quay crane
   */
  registerCrane(input: RegisterCraneInput): OperationResult<QuayCrane> {
    // Validate crane number uniqueness
    const existingCrane = Array.from(this.cranes.values()).find(
      c => c.craneNumber === input.craneNumber && c.tenantId === input.tenantId
    );

    if (existingCrane) {
      return {
        success: false,
        error: `Crane ${input.craneNumber} already exists`,
        errorCode: 'DUPLICATE_CRANE',
      };
    }

    const crane: QuayCrane = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      craneName: input.craneName,
      craneNumber: input.craneNumber,
      craneType: input.craneType,
      outreach: input.outreach,
      backreach: input.backreach,
      liftCapacity: input.liftCapacity,
      liftHeight: input.liftHeight,
      hoisSpeed: input.hoisSpeed,
      trolleySpeed: input.trolleySpeed,
      gantrySpeed: input.gantrySpeed,
      spreaderType: input.spreaderType,
      status: 'available',
      movesPerHour: input.movesPerHour,
      movesToday: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.cranes.set(crane.id, crane);

    return { success: true, data: crane };
  }

  /**
   * Assign crane to a berth
   */
  assignCraneToBerth(craneId: UUID, berthId: UUID): OperationResult<QuayCrane> {
    const crane = this.cranes.get(craneId);
    if (!crane) {
      return { success: false, error: 'Crane not found', errorCode: 'NOT_FOUND' };
    }

    const berth = this.berths.get(berthId);
    if (!berth) {
      return { success: false, error: 'Berth not found', errorCode: 'NOT_FOUND' };
    }

    if (crane.status !== 'available') {
      return {
        success: false,
        error: `Crane ${crane.craneNumber} is not available (status: ${crane.status})`,
        errorCode: 'CRANE_NOT_AVAILABLE',
      };
    }

    crane.currentBerthId = berthId;
    crane.status = 'working';
    crane.updatedAt = new Date();
    this.cranes.set(craneId, crane);

    // Add crane to berth's crane list
    berth.cranes.push(crane);
    berth.updatedAt = new Date();
    this.berths.set(berthId, berth);

    return { success: true, data: crane };
  }

  /**
   * Assign crane to a vessel with optional bay
   */
  assignCraneToVessel(craneId: UUID, vesselId: UUID, bay?: number): OperationResult<QuayCrane> {
    const crane = this.cranes.get(craneId);
    if (!crane) {
      return { success: false, error: 'Crane not found', errorCode: 'NOT_FOUND' };
    }

    const visit = this.vesselVisits.get(vesselId);
    if (!visit) {
      return { success: false, error: 'Vessel visit not found', errorCode: 'NOT_FOUND' };
    }

    if (crane.status !== 'available' && crane.status !== 'working') {
      return {
        success: false,
        error: `Crane ${crane.craneNumber} is not available (status: ${crane.status})`,
        errorCode: 'CRANE_NOT_AVAILABLE',
      };
    }

    crane.currentVesselId = vesselId;
    crane.currentBay = bay;
    crane.status = 'working';
    crane.updatedAt = new Date();
    this.cranes.set(craneId, crane);

    emit('vessel.crane_assigned', {
      craneId: crane.id,
      craneNumber: crane.craneNumber,
      craneType: crane.craneType,
      visitId: visit.id,
      vesselName: visit.vesselName,
      bay,
    }, { tenantId: visit.tenantId });

    return { success: true, data: crane };
  }

  /**
   * Release crane from current assignment
   */
  releaseCrane(craneId: UUID): OperationResult<QuayCrane> {
    const crane = this.cranes.get(craneId);
    if (!crane) {
      return { success: false, error: 'Crane not found', errorCode: 'NOT_FOUND' };
    }

    const previousVesselId = crane.currentVesselId;
    const previousBerthId = crane.currentBerthId;

    // Remove crane from berth's crane list
    if (previousBerthId) {
      const berth = this.berths.get(previousBerthId);
      if (berth) {
        berth.cranes = berth.cranes.filter(c => c.id !== craneId);
        berth.updatedAt = new Date();
        this.berths.set(berth.id, berth);
      }
    }

    crane.currentVesselId = undefined;
    crane.currentBerthId = undefined;
    crane.currentBay = undefined;
    crane.status = 'available';
    crane.updatedAt = new Date();
    this.cranes.set(craneId, crane);

    if (previousVesselId) {
      const visit = this.vesselVisits.get(previousVesselId);
      emit('vessel.crane_released', {
        craneId: crane.id,
        craneNumber: crane.craneNumber,
        visitId: previousVesselId,
        vesselName: visit?.vesselName,
      }, { tenantId: crane.tenantId });
    }

    return { success: true, data: crane };
  }

  /**
   * Record crane moves for productivity tracking
   */
  recordCraneMoves(craneId: UUID, moves: number): OperationResult<QuayCrane> {
    const crane = this.cranes.get(craneId);
    if (!crane) {
      return { success: false, error: 'Crane not found', errorCode: 'NOT_FOUND' };
    }

    crane.movesToday = (crane.movesToday ?? 0) + moves;
    crane.updatedAt = new Date();
    this.cranes.set(craneId, crane);

    // Update vessel visit progress if assigned
    if (crane.currentVesselId) {
      const visit = this.vesselVisits.get(crane.currentVesselId);
      if (visit) {
        // Attribute moves: if discharge not complete, count towards discharge; otherwise loading
        if (visit.dischargeDone < visit.dischargeContainers) {
          visit.dischargeDone = Math.min(
            visit.dischargeDone + moves,
            visit.dischargeContainers
          );
        } else {
          visit.loadDone = Math.min(
            visit.loadDone + moves,
            visit.loadContainers
          );
        }
        visit.updatedAt = new Date();
        this.vesselVisits.set(visit.id, visit);
      }
    }

    return { success: true, data: crane };
  }

  // ============================================================================
  // STOW PLAN MANAGEMENT
  // ============================================================================

  /**
   * Create a vessel stow plan
   */
  createStowPlan(input: CreateStowPlanInput): OperationResult<VesselStowPlan> {
    const visit = this.vesselVisits.get(input.vesselVisitId);
    if (!visit) {
      return { success: false, error: 'Vessel visit not found', errorCode: 'NOT_FOUND' };
    }

    const plan: VesselStowPlan = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      vesselVisitId: input.vesselVisitId,
      version: input.version ?? 1,
      status: 'draft',
      totalDischarge: input.totalDischarge ?? visit.dischargeContainers,
      totalLoad: input.totalLoad ?? visit.loadContainers,
      totalRestow: input.totalRestow ?? (visit.restowContainers ?? 0),
      bays: input.bays ?? [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.stowPlans.set(plan.id, plan);

    // Link to vessel visit
    visit.hasStowPlan = true;
    visit.stowPlanId = plan.id;
    visit.updatedAt = new Date();
    this.vesselVisits.set(visit.id, visit);

    emit('vessel.stow_plan_received', {
      planId: plan.id,
      visitId: visit.id,
      vesselName: visit.vesselName,
      version: plan.version,
      totalDischarge: plan.totalDischarge,
      totalLoad: plan.totalLoad,
      totalRestow: plan.totalRestow,
    }, { tenantId: visit.tenantId });

    return { success: true, data: plan };
  }

  /**
   * Get stow plan by ID
   */
  getStowPlan(planId: UUID): VesselStowPlan | undefined {
    return this.stowPlans.get(planId);
  }

  /**
   * Approve a stow plan
   */
  approveStowPlan(planId: UUID, approvedBy: string): OperationResult<VesselStowPlan> {
    const plan = this.stowPlans.get(planId);
    if (!plan) {
      return { success: false, error: 'Stow plan not found', errorCode: 'NOT_FOUND' };
    }

    if (plan.status !== 'draft' && plan.status !== 'submitted') {
      return {
        success: false,
        error: `Cannot approve stow plan in status ${plan.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    plan.status = 'approved';
    plan.approvedAt = new Date();
    plan.approvedBy = approvedBy;
    plan.updatedAt = new Date();
    this.stowPlans.set(planId, plan);

    const visit = this.vesselVisits.get(plan.vesselVisitId);

    emit('vessel.stow_plan_approved', {
      planId: plan.id,
      visitId: plan.vesselVisitId,
      vesselName: visit?.vesselName,
      approvedBy,
    }, { tenantId: plan.tenantId });

    return { success: true, data: plan };
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get waterfront terminal statistics
   */
  getWaterfrontStats(tenantId: string): WaterfrontStats {
    const berths = Array.from(this.berths.values()).filter(b => b.tenantId === tenantId);
    const visits = Array.from(this.vesselVisits.values()).filter(v => v.tenantId === tenantId);
    const cranes = Array.from(this.cranes.values()).filter(c => c.tenantId === tenantId);

    const activeVisits = visits.filter(v => !['departed', 'cancelled'].includes(v.status));
    const today = new Date();
    const todayArrivals = visits.filter(v =>
      v.eta.toDateString() === today.toDateString()
    );
    const todayDepartures = visits.filter(v =>
      v.atd && v.atd.toDateString() === today.toDateString()
    );

    const vesselsAlongside = visits.filter(v =>
      ['alongside', 'working', 'idle'].includes(v.status)
    );
    const totalMovesToday = cranes.reduce((sum, c) => sum + (c.movesToday ?? 0), 0);

    return {
      totalBerths: berths.length,
      availableBerths: berths.filter(b => b.status === 'available').length,
      occupiedBerths: berths.filter(b => b.status === 'occupied').length,
      reservedBerths: berths.filter(b => b.status === 'reserved').length,
      totalCranes: cranes.length,
      workingCranes: cranes.filter(c => c.status === 'working').length,
      availableCranes: cranes.filter(c => c.status === 'available').length,
      activeVesselVisits: activeVisits.length,
      vesselsAtAnchorage: visits.filter(v => v.status === 'at_anchorage').length,
      vesselsAlongside: vesselsAlongside.length,
      vesselsWorking: visits.filter(v => v.status === 'working').length,
      todayExpectedArrivals: todayArrivals.length,
      todayDepartures: todayDepartures.length,
      totalMovesToday,
    };
  }
}

// ============================================================================
// SINGLETON ACCESS
// ============================================================================

let waterfrontEngineInstance: WaterfrontEngine | null = null;

export function getWaterfrontEngine(): WaterfrontEngine {
  if (!waterfrontEngineInstance) {
    waterfrontEngineInstance = WaterfrontEngine.getInstance();
  }
  return waterfrontEngineInstance;
}

export function setWaterfrontEngine(engine: WaterfrontEngine): void {
  waterfrontEngineInstance = engine;
}

// ============================================================================
// TYPES
// ============================================================================

export interface RegisterBerthInput {
  tenantId: string;
  facilityId: UUID;
  berthNumber: string;
  name?: string;
  length: number;
  depth: number;
  maxLOA: number;
  maxBeam: number;
  maxDraft: number;
  bollardPull?: number;
  fenders?: number;
  coordinates?: {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
  };
}

export interface BerthQueryOptions {
  tenantId?: string;
  facilityId?: UUID;
  status?: BerthStatus;
  availableOnly?: boolean;
  minLength?: number;
  minDepth?: number;
  page?: number;
  pageSize?: number;
}

export interface AnnounceVesselInput {
  tenantId: string;
  facilityId: UUID;
  vesselName: string;
  imoNumber: string;
  callSign?: string;
  flag: string;
  vesselType: 'container' | 'bulk' | 'tanker' | 'roro' | 'general';
  voyageNumber: string;
  shippingLine: string;
  service?: string;
  loa: number;
  beam: number;
  draft: number;
  eta: Date;
  etb?: Date;
  etd: Date;
  berthSide: 'port' | 'starboard';
  dischargeContainers: number;
  loadContainers: number;
  shiftContainers?: number;
  restowContainers?: number;
  shippingAgent?: string;
  agentContact?: {
    name: string;
    email?: string;
    phone?: string;
    mobile?: string;
    designation?: string;
  };
}

export interface VesselVisitQueryOptions {
  tenantId?: string;
  facilityId?: UUID;
  status?: VesselStatus;
  statuses?: VesselStatus[];
  shippingLine?: string;
  berthId?: UUID;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  pageSize?: number;
}

export interface RegisterCraneInput {
  tenantId: string;
  facilityId: UUID;
  craneName: string;
  craneNumber: string;
  craneType: CraneType;
  outreach: number;
  backreach?: number;
  liftCapacity: number;
  liftHeight: number;
  hoisSpeed: number;
  trolleySpeed: number;
  gantrySpeed?: number;
  spreaderType: 'single' | 'twin-lift' | 'tandem';
  movesPerHour?: number;
}

export interface CreateStowPlanInput {
  tenantId: string;
  facilityId: UUID;
  vesselVisitId: UUID;
  version?: number;
  totalDischarge?: number;
  totalLoad?: number;
  totalRestow?: number;
  bays?: BayPlan[];
}

export interface WaterfrontStats {
  totalBerths: number;
  availableBerths: number;
  occupiedBerths: number;
  reservedBerths: number;
  totalCranes: number;
  workingCranes: number;
  availableCranes: number;
  activeVesselVisits: number;
  vesselsAtAnchorage: number;
  vesselsAlongside: number;
  vesselsWorking: number;
  todayExpectedArrivals: number;
  todayDepartures: number;
  totalMovesToday: number;
}
