// Facility Manager - Multi-tenant ICD/CFS Facility Management

import { v4 as uuidv4 } from 'uuid';
import { emit } from '../core/event-bus';
import type {
  Facility,
  FacilityType,
  FacilityStatus,
  FacilityZone,
  YardBlock,
  GroundSlot,
  YardLocation,
  ZoneType,
  FacilityFeatures,
  FacilityConfig,
  DemurrageSlab,
} from '../types/facility';
import type { UUID, OperationResult, Address, OperatingHours } from '../types/common';

// ============================================================================
// FACILITY MANAGER
// ============================================================================

export class FacilityManager {
  private facilities: Map<UUID, Facility> = new Map();
  private zones: Map<UUID, FacilityZone> = new Map();
  private blocks: Map<UUID, YardBlock> = new Map();
  private slots: Map<UUID, GroundSlot> = new Map();

  // Indexes for fast lookup
  private facilityByCode: Map<string, UUID> = new Map();
  private zonesByFacility: Map<UUID, Set<UUID>> = new Map();
  private blocksByZone: Map<UUID, Set<UUID>> = new Map();
  private blocksByFacility: Map<UUID, Set<UUID>> = new Map();
  private slotsByBlock: Map<UUID, Set<UUID>> = new Map();
  private slotByBarcode: Map<string, UUID> = new Map();

  // ===========================================================================
  // FACILITY CRUD
  // ===========================================================================

  createFacility(input: CreateFacilityInput): OperationResult<Facility> {
    // Validate code uniqueness
    if (this.facilityByCode.has(input.code)) {
      return {
        success: false,
        error: `Facility with code ${input.code} already exists`,
        errorCode: 'DUPLICATE_CODE',
      };
    }

    const facility: Facility = {
      id: uuidv4(),
      tenantId: input.tenantId,
      code: input.code,
      name: input.name,
      type: input.type,
      status: 'active',
      address: input.address,
      coordinates: input.coordinates,
      portCode: input.portCode,
      customsCode: input.customsCode,
      capacityTEU: input.capacityTEU ?? 1000,
      groundSlots: input.groundSlots ?? 500,
      maxStackHeight: input.maxStackHeight ?? 5,
      operatingHours: input.operatingHours ?? getDefaultOperatingHours(),
      timeZone: input.timeZone ?? 'Asia/Kolkata',
      contacts: input.contacts ?? [],
      features: input.features ?? getDefaultFeatures(input.type),
      config: input.config ?? getDefaultConfig(input.type),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.facilities.set(facility.id, facility);
    this.facilityByCode.set(facility.code, facility.id);
    this.zonesByFacility.set(facility.id, new Set());
    this.blocksByFacility.set(facility.id, new Set());

    emit('system.facility_opened', { facility }, {
      facilityId: facility.id,
      tenantId: facility.tenantId,
      source: 'FacilityManager',
    });

    return { success: true, data: facility };
  }

  getFacility(id: UUID): Facility | undefined {
    return this.facilities.get(id);
  }

  getFacilityByCode(code: string): Facility | undefined {
    const id = this.facilityByCode.get(code);
    return id ? this.facilities.get(id) : undefined;
  }

  getAllFacilities(tenantId?: string): Facility[] {
    const facilities = Array.from(this.facilities.values());
    if (tenantId) {
      return facilities.filter(f => f.tenantId === tenantId);
    }
    return facilities;
  }

  updateFacility(id: UUID, updates: Partial<Omit<Facility, 'id' | 'tenantId' | 'createdAt'>>): OperationResult<Facility> {
    const facility = this.facilities.get(id);
    if (!facility) {
      return { success: false, error: 'Facility not found', errorCode: 'NOT_FOUND' };
    }

    // Handle code change
    if (updates.code && updates.code !== facility.code) {
      if (this.facilityByCode.has(updates.code)) {
        return { success: false, error: 'Code already in use', errorCode: 'DUPLICATE_CODE' };
      }
      this.facilityByCode.delete(facility.code);
      this.facilityByCode.set(updates.code, id);
    }

    const updated: Facility = {
      ...facility,
      ...updates,
      updatedAt: new Date(),
    };

    this.facilities.set(id, updated);
    return { success: true, data: updated };
  }

  updateFacilityStatus(id: UUID, status: FacilityStatus): OperationResult<Facility> {
    const result = this.updateFacility(id, { status });
    if (result.success && result.data) {
      if (status === 'closed') {
        emit('system.facility_closed', { facility: result.data }, {
          facilityId: id,
          tenantId: result.data.tenantId,
          source: 'FacilityManager',
        });
      }
    }
    return result;
  }

  // ===========================================================================
  // ZONE MANAGEMENT
  // ===========================================================================

  createZone(input: CreateZoneInput): OperationResult<FacilityZone> {
    const facility = this.facilities.get(input.facilityId);
    if (!facility) {
      return { success: false, error: 'Facility not found', errorCode: 'FACILITY_NOT_FOUND' };
    }

    // Check code uniqueness within facility
    const existingZones = this.getZonesByFacility(input.facilityId);
    if (existingZones.some(z => z.code === input.code)) {
      return { success: false, error: 'Zone code already exists in facility', errorCode: 'DUPLICATE_CODE' };
    }

    const zone: FacilityZone = {
      id: uuidv4(),
      facilityId: input.facilityId,
      code: input.code,
      name: input.name,
      type: input.type,
      status: 'active',
      blocks: 0,
      totalSlots: 0,
      maxStackHeight: input.maxStackHeight ?? facility.maxStackHeight,
      allowedContainerTypes: input.allowedContainerTypes ?? [],
      temperatureRange: input.temperatureRange,
      hazmatClasses: input.hazmatClasses,
      assignedEquipment: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.zones.set(zone.id, zone);
    this.zonesByFacility.get(input.facilityId)?.add(zone.id);
    this.blocksByZone.set(zone.id, new Set());

    return { success: true, data: zone };
  }

  getZone(id: UUID): FacilityZone | undefined {
    return this.zones.get(id);
  }

  getZonesByFacility(facilityId: UUID): FacilityZone[] {
    const zoneIds = this.zonesByFacility.get(facilityId);
    if (!zoneIds) return [];
    return Array.from(zoneIds).map(id => this.zones.get(id)!).filter(Boolean);
  }

  updateZone(id: UUID, updates: Partial<Omit<FacilityZone, 'id' | 'facilityId' | 'createdAt'>>): OperationResult<FacilityZone> {
    const zone = this.zones.get(id);
    if (!zone) {
      return { success: false, error: 'Zone not found', errorCode: 'NOT_FOUND' };
    }

    const updated: FacilityZone = {
      ...zone,
      ...updates,
      updatedAt: new Date(),
    };

    this.zones.set(id, updated);
    return { success: true, data: updated };
  }

  // ===========================================================================
  // BLOCK MANAGEMENT
  // ===========================================================================

  createBlock(input: CreateBlockInput): OperationResult<YardBlock> {
    const zone = this.zones.get(input.zoneId);
    if (!zone) {
      return { success: false, error: 'Zone not found', errorCode: 'ZONE_NOT_FOUND' };
    }

    const facility = this.facilities.get(zone.facilityId);
    if (!facility) {
      return { success: false, error: 'Facility not found', errorCode: 'FACILITY_NOT_FOUND' };
    }

    // Check code uniqueness within facility
    const existingBlocks = this.getBlocksByFacility(zone.facilityId);
    if (existingBlocks.some(b => b.code === input.code)) {
      return { success: false, error: 'Block code already exists in facility', errorCode: 'DUPLICATE_CODE' };
    }

    const totalSlots = input.rows * input.slotsPerRow;

    const block: YardBlock = {
      id: uuidv4(),
      facilityId: zone.facilityId,
      zoneId: input.zoneId,
      code: input.code,
      name: input.name,
      type: zone.type,
      status: 'active',
      rows: input.rows,
      slotsPerRow: input.slotsPerRow,
      maxTiers: input.maxTiers ?? zone.maxStackHeight,
      occupiedSlots: 0,
      utilizationPercent: 0,
      assignedEquipment: [],
      allowedContainerSizes: input.allowedContainerSizes ?? ['20', '40', '45'],
      isReeferCapable: input.isReeferCapable ?? (zone.type === 'reefer'),
      isHazmatCapable: input.isHazmatCapable ?? (zone.type === 'hazmat'),
      maxGroundWeight: input.maxGroundWeight,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.blocks.set(block.id, block);
    this.blocksByZone.get(input.zoneId)?.add(block.id);
    this.blocksByFacility.get(zone.facilityId)?.add(block.id);
    this.slotsByBlock.set(block.id, new Set());

    // Update zone stats
    this.updateZone(zone.id, {
      blocks: zone.blocks + 1,
      totalSlots: zone.totalSlots + totalSlots,
    });

    // Auto-create ground slots
    if (input.autoCreateSlots !== false) {
      this.createSlotsForBlock(block);
    }

    return { success: true, data: block };
  }

  getBlock(id: UUID): YardBlock | undefined {
    return this.blocks.get(id);
  }

  getBlockByCode(facilityId: UUID, code: string): YardBlock | undefined {
    const blocks = this.getBlocksByFacility(facilityId);
    return blocks.find(b => b.code === code);
  }

  getBlocksByFacility(facilityId: UUID): YardBlock[] {
    const blockIds = this.blocksByFacility.get(facilityId);
    if (!blockIds) return [];
    return Array.from(blockIds).map(id => this.blocks.get(id)!).filter(Boolean);
  }

  getBlocksByZone(zoneId: UUID): YardBlock[] {
    const blockIds = this.blocksByZone.get(zoneId);
    if (!blockIds) return [];
    return Array.from(blockIds).map(id => this.blocks.get(id)!).filter(Boolean);
  }

  updateBlock(id: UUID, updates: Partial<Omit<YardBlock, 'id' | 'facilityId' | 'zoneId' | 'createdAt'>>): OperationResult<YardBlock> {
    const block = this.blocks.get(id);
    if (!block) {
      return { success: false, error: 'Block not found', errorCode: 'NOT_FOUND' };
    }

    const updated: YardBlock = {
      ...block,
      ...updates,
      updatedAt: new Date(),
    };

    this.blocks.set(id, updated);
    return { success: true, data: updated };
  }

  // ===========================================================================
  // SLOT MANAGEMENT
  // ===========================================================================

  private createSlotsForBlock(block: YardBlock): void {
    for (let row = 1; row <= block.rows; row++) {
      for (let slot = 1; slot <= block.slotsPerRow; slot++) {
        const barcode = this.generateSlotBarcode(block, row, slot);
        const groundSlot: GroundSlot = {
          id: uuidv4(),
          blockId: block.id,
          row,
          slot,
          barcode,
          maxTiers: block.maxTiers,
          slotType: block.isReeferCapable ? 'reefer' : (block.isHazmatCapable ? 'hazmat' : 'standard'),
          reeferPlugs: block.isReeferCapable ? 1 : undefined,
          currentTiers: 0,
          containers: [],
          status: 'available',
        };

        this.slots.set(groundSlot.id, groundSlot);
        this.slotsByBlock.get(block.id)?.add(groundSlot.id);
        this.slotByBarcode.set(barcode, groundSlot.id);
      }
    }
  }

  private generateSlotBarcode(block: YardBlock, row: number, slot: number): string {
    const rowStr = String(row).padStart(2, '0');
    const slotStr = String(slot).padStart(2, '0');
    return `${block.code}-${rowStr}-${slotStr}`;
  }

  getSlot(id: UUID): GroundSlot | undefined {
    return this.slots.get(id);
  }

  getSlotByBarcode(barcode: string): GroundSlot | undefined {
    const id = this.slotByBarcode.get(barcode);
    return id ? this.slots.get(id) : undefined;
  }

  getSlotsByBlock(blockId: UUID): GroundSlot[] {
    const slotIds = this.slotsByBlock.get(blockId);
    if (!slotIds) return [];
    return Array.from(slotIds).map(id => this.slots.get(id)!).filter(Boolean);
  }

  getSlotByPosition(blockId: UUID, row: number, slot: number): GroundSlot | undefined {
    const slots = this.getSlotsByBlock(blockId);
    return slots.find(s => s.row === row && s.slot === slot);
  }

  updateSlot(id: UUID, updates: Partial<Omit<GroundSlot, 'id' | 'blockId' | 'row' | 'slot' | 'barcode'>>): OperationResult<GroundSlot> {
    const groundSlot = this.slots.get(id);
    if (!groundSlot) {
      return { success: false, error: 'Slot not found', errorCode: 'NOT_FOUND' };
    }

    const updated: GroundSlot = {
      ...groundSlot,
      ...updates,
    };

    this.slots.set(id, updated);
    return { success: true, data: updated };
  }

  // ===========================================================================
  // LOCATION HELPERS
  // ===========================================================================

  resolveLocation(facilityId: UUID, barcode: string): YardLocation | null {
    // Parse barcode format: BLOCK-ROW-SLOT or BLOCK-ROW-SLOT-TIER
    const parts = barcode.split('-');
    if (parts.length < 3) return null;

    const blockCode = parts[0]!;
    const row = parseInt(parts[1]!, 10);
    const slot = parseInt(parts[2]!, 10);
    const tier = parts.length > 3 ? parseInt(parts[3]!, 10) : 1;

    if (isNaN(row) || isNaN(slot) || isNaN(tier)) return null;

    const block = this.getBlockByCode(facilityId, blockCode);
    if (!block) return null;

    const zone = this.zones.get(block.zoneId);
    if (!zone) return null;

    return {
      facilityId,
      zoneId: zone.id,
      blockId: block.id,
      row,
      slot,
      tier,
      barcode: `${blockCode}-${String(row).padStart(2, '0')}-${String(slot).padStart(2, '0')}`,
      fullPath: `${this.facilities.get(facilityId)?.code}/${zone.code}/${blockCode}/${row}/${slot}/${tier}`,
    };
  }

  getAvailableSlots(facilityId: UUID, options?: {
    zoneType?: ZoneType;
    blockId?: UUID;
    minTiers?: number;
    reeferRequired?: boolean;
    hazmatRequired?: boolean;
  }): GroundSlot[] {
    let blocks = this.getBlocksByFacility(facilityId);

    if (options?.zoneType) {
      blocks = blocks.filter(b => b.type === options.zoneType);
    }
    if (options?.blockId) {
      blocks = blocks.filter(b => b.id === options.blockId);
    }
    if (options?.reeferRequired) {
      blocks = blocks.filter(b => b.isReeferCapable);
    }
    if (options?.hazmatRequired) {
      blocks = blocks.filter(b => b.isHazmatCapable);
    }

    const availableSlots: GroundSlot[] = [];

    for (const block of blocks) {
      const slots = this.getSlotsByBlock(block.id);
      for (const slot of slots) {
        if (slot.status !== 'available') continue;
        const availableTiers = slot.maxTiers - slot.currentTiers;
        if (options?.minTiers && availableTiers < options.minTiers) continue;
        availableSlots.push(slot);
      }
    }

    return availableSlots;
  }

  // ===========================================================================
  // STATISTICS
  // ===========================================================================

  getFacilityStats(facilityId: UUID): FacilityStats | null {
    const facility = this.facilities.get(facilityId);
    if (!facility) return null;

    const blocks = this.getBlocksByFacility(facilityId);
    let totalSlots = 0;
    let occupiedSlots = 0;
    let totalTEU = 0;

    for (const block of blocks) {
      const slots = this.getSlotsByBlock(block.id);
      for (const slot of slots) {
        totalSlots++;
        if (slot.currentTiers > 0) {
          occupiedSlots++;
          // Approximate TEU (would need container data for exact count)
          totalTEU += slot.currentTiers;
        }
      }
    }

    return {
      facilityId,
      totalBlocks: blocks.length,
      totalSlots,
      occupiedSlots,
      availableSlots: totalSlots - occupiedSlots,
      utilizationPercent: totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0,
      estimatedTEU: totalTEU,
      capacityTEU: facility.capacityTEU,
      capacityUtilization: facility.capacityTEU > 0 ? (totalTEU / facility.capacityTEU) * 100 : 0,
    };
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface CreateFacilityInput {
  tenantId: string;
  code: string;
  name: string;
  type: FacilityType;
  address: Address;
  coordinates?: { latitude: number; longitude: number };
  portCode?: string;
  customsCode?: string;
  capacityTEU?: number;
  groundSlots?: number;
  maxStackHeight?: number;
  operatingHours?: OperatingHours;
  timeZone?: string;
  contacts?: Facility['contacts'];
  features?: FacilityFeatures;
  config?: FacilityConfig;
}

export interface CreateZoneInput {
  facilityId: UUID;
  code: string;
  name: string;
  type: ZoneType;
  maxStackHeight?: number;
  allowedContainerTypes?: string[];
  temperatureRange?: { min: number; max: number };
  hazmatClasses?: string[];
}

export interface CreateBlockInput {
  zoneId: UUID;
  code: string;
  name: string;
  rows: number;
  slotsPerRow: number;
  maxTiers?: number;
  allowedContainerSizes?: ('20' | '40' | '45')[];
  isReeferCapable?: boolean;
  isHazmatCapable?: boolean;
  maxGroundWeight?: number;
  autoCreateSlots?: boolean;
}

export interface FacilityStats {
  facilityId: UUID;
  totalBlocks: number;
  totalSlots: number;
  occupiedSlots: number;
  availableSlots: number;
  utilizationPercent: number;
  estimatedTEU: number;
  capacityTEU: number;
  capacityUtilization: number;
}

// ============================================================================
// HELPERS
// ============================================================================

function getDefaultOperatingHours(): OperatingHours {
  const defaultWindow = { startTime: '06:00', endTime: '22:00' };
  return {
    monday: defaultWindow,
    tuesday: defaultWindow,
    wednesday: defaultWindow,
    thursday: defaultWindow,
    friday: defaultWindow,
    saturday: defaultWindow,
    sunday: { startTime: '08:00', endTime: '18:00' },
  };
}

function getDefaultFeatures(type: FacilityType): FacilityFeatures {
  const base: FacilityFeatures = {
    reeferHandling: true,
    hazmatHandling: true,
    overweightContainers: true,
    oversizeContainers: false,
    railConnected: type === 'ICD' || type === 'RAIL_TERMINAL' || type === 'DRY_PORT',
    roadAccess: true,
    waterfrontAccess: type === 'PORT',
    stuffingDestuffing: type === 'CFS' || type === 'ICD',
    lclConsolidation: type === 'CFS',
    customsBonded: true,
    freeTradeZone: false,
    automatedGate: false,
    rfidEnabled: false,
    gpsTracking: true,
    reeferMonitoring: true,
  };
  return base;
}

function getDefaultConfig(type: FacilityType): FacilityConfig {
  const demurrageSlabs: DemurrageSlab[] = [
    { fromDay: 1, toDay: 3, ratePerTEU: 0 },      // Free days
    { fromDay: 4, toDay: 7, ratePerTEU: 500 },
    { fromDay: 8, toDay: 15, ratePerTEU: 1000 },
    { fromDay: 16, toDay: null, ratePerTEU: 1500 },
  ];

  return {
    defaultStackHeight: 5,
    reeferStackHeight: 3,
    hazmatStackHeight: 2,
    groundSlotNaming: {
      pattern: '{block}-{row:02d}-{slot:02d}',
      separator: '-',
      includeCheckDigit: false,
    },
    gateCount: 2,
    lanesPerGate: 2,
    appointmentRequired: true,
    appointmentWindowMinutes: 60,
    railTrackCount: type === 'ICD' || type === 'RAIL_TERMINAL' ? 4 : undefined,
    maxWagonsPerTrack: type === 'ICD' || type === 'RAIL_TERMINAL' ? 45 : undefined,
    berthCount: type === 'PORT' ? 2 : undefined,
    maxVesselLOA: type === 'PORT' ? 300 : undefined,
    maxVesselDraft: type === 'PORT' ? 14 : undefined,
    defaultCurrency: 'INR',
    freeDaysImport: 3,
    freeDaysExport: 7,
    demurrageSlabs,
    icegateEnabled: true,
    customsStationCode: undefined,
  };
}

// ============================================================================
// SINGLETON
// ============================================================================

let facilityManagerInstance: FacilityManager | null = null;

export function getFacilityManager(): FacilityManager {
  if (!facilityManagerInstance) {
    facilityManagerInstance = new FacilityManager();
  }
  return facilityManagerInstance;
}

export function setFacilityManager(manager: FacilityManager): void {
  facilityManagerInstance = manager;
}
