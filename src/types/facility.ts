// Facility types for ICD, CFS, Rail Terminal, Port

import type { UUID, Address, OperatingHours, AuditFields, Coordinates, ContactInfo } from './common';

export type FacilityType = 'ICD' | 'CFS' | 'PORT' | 'RAIL_TERMINAL' | 'DRY_PORT';
export type FacilityStatus = 'active' | 'inactive' | 'maintenance' | 'closed';

export interface Facility extends AuditFields {
  id: UUID;
  tenantId: string;
  code: string;               // Unique facility code (e.g., JNPT-ICD-01)
  name: string;
  type: FacilityType;
  status: FacilityStatus;

  // Location
  address: Address;
  coordinates?: Coordinates;
  portCode?: string;          // UN/LOCODE (e.g., INJNP)
  customsCode?: string;       // Customs station code

  // Capacity
  capacityTEU: number;        // Total TEU capacity
  currentUtilization?: number; // Percentage
  groundSlots: number;
  maxStackHeight: number;

  // Operations
  operatingHours: OperatingHours;
  timeZone: string;

  // Contacts
  contacts: FacilityContact[];

  // Features enabled
  features: FacilityFeatures;

  // Configuration
  config: FacilityConfig;
}

export interface FacilityContact {
  type: 'primary' | 'operations' | 'customs' | 'billing' | 'emergency';
  contact: ContactInfo;
}

export interface FacilityFeatures {
  // Container operations
  reeferHandling: boolean;
  hazmatHandling: boolean;
  overweightContainers: boolean;
  oversizeContainers: boolean;

  // Transport modes
  railConnected: boolean;
  roadAccess: boolean;
  waterfrontAccess: boolean;

  // Services
  stuffingDestuffing: boolean;
  lclConsolidation: boolean;
  customsBonded: boolean;
  freeTradeZone: boolean;

  // Technology
  automatedGate: boolean;
  rfidEnabled: boolean;
  gpsTracking: boolean;
  reeferMonitoring: boolean;
}

export interface FacilityConfig {
  // Yard settings
  defaultStackHeight: number;
  reeferStackHeight: number;
  hazmatStackHeight: number;
  groundSlotNaming: SlotNamingConvention;

  // Gate settings
  gateCount: number;
  lanesPerGate: number;
  appointmentRequired: boolean;
  appointmentWindowMinutes: number;

  // Rail settings
  railTrackCount?: number;
  maxWagonsPerTrack?: number;

  // Waterfront settings
  berthCount?: number;
  maxVesselLOA?: number;
  maxVesselDraft?: number;

  // Billing settings
  defaultCurrency: string;
  freeDaysImport: number;
  freeDaysExport: number;
  demurrageSlabs: DemurrageSlab[];

  // Customs settings
  icegateEnabled: boolean;
  customsStationCode?: string;
}

export interface SlotNamingConvention {
  pattern: string;         // e.g., "{block}-{row:02d}-{slot:02d}"
  separator: string;       // e.g., "-"
  blockPrefix?: string;
  includeCheckDigit: boolean;
}

export interface DemurrageSlab {
  fromDay: number;
  toDay: number | null;    // null = unlimited
  ratePerTEU: number;
  ratePerFEU?: number;
}

// Zone within a facility
export type ZoneType =
  | 'import'
  | 'export'
  | 'empty'
  | 'reefer'
  | 'hazmat'
  | 'imdg'
  | 'overflow'
  | 'examination'
  | 'bonded'
  | 'ftz'
  | 'repair'
  | 'staging';

export interface FacilityZone extends AuditFields {
  id: UUID;
  facilityId: UUID;
  code: string;
  name: string;
  type: ZoneType;
  status: 'active' | 'inactive' | 'maintenance';

  // Capacity
  blocks: number;
  totalSlots: number;
  maxStackHeight: number;

  // Restrictions
  allowedContainerTypes: string[];  // ISO types
  temperatureRange?: {
    min: number;
    max: number;
  };
  hazmatClasses?: string[];

  // Equipment
  assignedEquipment: UUID[];
}

// Block within a zone
export interface YardBlock extends AuditFields {
  id: UUID;
  facilityId: UUID;
  zoneId: UUID;
  code: string;
  name: string;
  type: ZoneType;
  status: 'active' | 'inactive' | 'maintenance';

  // Configuration
  rows: number;
  slotsPerRow: number;
  maxTiers: number;

  // Current state
  occupiedSlots: number;
  utilizationPercent: number;

  // Equipment
  assignedEquipment: UUID[];

  // Restrictions
  allowedContainerSizes: ('20' | '40' | '45')[];
  isReeferCapable: boolean;
  isHazmatCapable: boolean;
  maxGroundWeight?: number; // kg per TEU
}

// Ground slot configuration
export interface GroundSlot {
  id: UUID;
  blockId: UUID;
  row: number;
  slot: number;
  barcode: string;
  rfidTag?: string;

  // Configuration
  maxTiers: number;
  slotType: 'standard' | 'reefer' | 'hazmat' | 'overweight';
  reeferPlugs?: number;

  // Current state
  currentTiers: number;
  topContainer?: UUID;
  containers: StackedContainer[];

  // Status
  status: 'available' | 'occupied' | 'reserved' | 'blocked' | 'maintenance';
  blockedReason?: string;
  reservedFor?: {
    containerId?: UUID;
    bookingRef?: string;
    expiresAt: Date;
  };
}

export interface StackedContainer {
  containerId: UUID;
  containerNumber: string;
  tier: number;
  placedAt: Date;
  placedBy?: string;
}

// Yard location reference
export interface YardLocation {
  facilityId: UUID;
  zoneId?: UUID;
  blockId: UUID;
  row: number;
  slot: number;
  tier: number;
  barcode: string;
  fullPath: string;  // e.g., "ICD-01/IMPORT/A/01/05/3"
}

export function formatYardLocation(loc: YardLocation): string {
  return `${loc.blockId}-${String(loc.row).padStart(2, '0')}-${String(loc.slot).padStart(2, '0')}-${loc.tier}`;
}

export function parseYardLocation(barcode: string): Partial<YardLocation> | null {
  const parts = barcode.split('-');
  if (parts.length < 4) return null;

  const blockId = parts[0]!;
  const row = parseInt(parts[1]!, 10);
  const slot = parseInt(parts[2]!, 10);
  const tier = parseInt(parts[3]!, 10);

  if (isNaN(row) || isNaN(slot) || isNaN(tier)) return null;

  return { blockId, row, slot, tier, barcode };
}
