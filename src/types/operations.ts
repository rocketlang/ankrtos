// =============================================================================
// ankrICD - Operations Types
// =============================================================================
// Types for container stuffing/destuffing, LCL consolidation, FCL handling,
// cross-docking, and cargo inspection operations.
// =============================================================================

import type { UUID, Currency, TenantEntity } from './common';
import type { ContainerSize, ContainerType, ContainerISOType } from './container';
import type { YardLocation } from './facility';

// =============================================================================
// CARGO TYPES
// =============================================================================

export type CargoType = 'general' | 'hazardous' | 'perishable' | 'oversized' | 'fragile' | 'valuable' | 'liquid_bulk' | 'dry_bulk';

export type PackagingType = 'pallet' | 'crate' | 'drum' | 'bag' | 'bale' | 'bundle' | 'carton' | 'roll' | 'loose' | 'ibc' | 'other';

export type WeightUnit = 'kg' | 'mt' | 'lb';
export type DimensionUnit = 'cm' | 'm' | 'in' | 'ft';
export type VolumeUnit = 'cbm' | 'cft';

export interface CargoDimensions {
  length: number;
  width: number;
  height: number;
  unit: DimensionUnit;
}

export interface CargoItem {
  id: UUID;
  description: string;
  hsCode?: string;
  cargoType: CargoType;
  packagingType: PackagingType;
  quantity: number;
  grossWeight: number;
  netWeight?: number;
  weightUnit: WeightUnit;
  volume?: number;
  volumeUnit?: VolumeUnit;
  dimensions?: CargoDimensions;
  marks?: string;
  serialNumbers?: string[];
  batchNumber?: string;
  hazmat?: {
    unNumber: string;
    class: string;
    packingGroup: string;
    properShippingName: string;
    emergencyContact: string;
  };
  specialHandling?: string[];
  value?: number;
  currency?: Currency;
}

// =============================================================================
// STUFFING OPERATIONS
// =============================================================================

export type StuffingStatus = 'planned' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
export type StuffingType = 'full_stuffing' | 'partial_stuffing' | 'consolidation';

export interface StuffingOperation extends TenantEntity {
  id: UUID;
  operationNumber: string;
  facilityId: UUID;
  containerId: UUID;
  containerNumber: string;
  containerSize: ContainerSize;
  containerType: ContainerType;
  isoType: ContainerISOType;

  stuffingType: StuffingType;
  status: StuffingStatus;

  // Cargo
  cargoItems: CargoItem[];
  totalPackages: number;
  totalGrossWeight: number;
  totalNetWeight?: number;
  totalVolume?: number;
  volumeUtilization?: number; // 0-100%
  weightUtilization?: number; // 0-100%

  // Location
  warehouseId?: UUID;
  dockDoor?: string;
  yardLocation?: YardLocation;

  // References
  bookingRef?: string;
  blNumber?: string;
  shippingBillIds?: UUID[];
  deliveryOrderId?: string;
  customerId?: UUID;

  // Team
  supervisorId?: string;
  supervisorName?: string;
  labourGangId?: string;
  labourCount?: number;
  equipmentUsed?: string[];

  // Timeline
  plannedStartTime?: Date;
  plannedEndTime?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  pauseHistory?: { pausedAt: Date; resumedAt?: Date; reason: string }[];

  // Quality
  sealNumber?: string;
  photos?: { url: string; caption?: string; takenAt: Date }[];
  damageNotes?: string[];
  inspectionPassed?: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// DESTUFFING OPERATIONS
// =============================================================================

export type DestuffingStatus = 'planned' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
export type DestuffingType = 'full_destuffing' | 'partial_destuffing' | 'deconsolidation';

export interface DestuffingOperation extends TenantEntity {
  id: UUID;
  operationNumber: string;
  facilityId: UUID;
  containerId: UUID;
  containerNumber: string;
  containerSize: ContainerSize;

  destuffingType: DestuffingType;
  status: DestuffingStatus;

  // Cargo out
  cargoItems: CargoItem[];
  totalPackagesExpected: number;
  totalPackagesReceived: number;
  totalGrossWeightExpected: number;
  totalGrossWeightReceived: number;

  // Discrepancies
  shortages: CargoDiscrepancy[];
  excesses: CargoDiscrepancy[];
  damages: CargoDamage[];
  hasDiscrepancy: boolean;

  // Location
  warehouseId?: UUID;
  dockDoor?: string;

  // References
  blNumber?: string;
  billOfEntryId?: UUID;
  customerId?: UUID;

  // Team
  supervisorId?: string;
  supervisorName?: string;
  labourGangId?: string;
  labourCount?: number;
  equipmentUsed?: string[];

  // Tallying
  tallySheetId?: string;
  tallyClerkId?: string;
  tallyClerkName?: string;

  // Timeline
  plannedStartTime?: Date;
  plannedEndTime?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;

  // Quality
  sealIntact?: boolean;
  sealVerified?: boolean;
  originalSealNumber?: string;
  photos?: { url: string; caption?: string; takenAt: Date }[];

  createdAt: Date;
  updatedAt: Date;
}

export interface CargoDiscrepancy {
  cargoItemId?: UUID;
  description: string;
  expectedQuantity: number;
  actualQuantity: number;
  difference: number;
  remarks?: string;
}

export interface CargoDamage {
  cargoItemId?: UUID;
  description: string;
  damageType: 'wet' | 'crushed' | 'broken' | 'torn' | 'contaminated' | 'pilfered' | 'other';
  severity: 'minor' | 'moderate' | 'severe';
  quantity: number;
  photos?: string[];
  remarks?: string;
}

// =============================================================================
// LCL CONSOLIDATION
// =============================================================================

export type ConsolidationStatus = 'open' | 'in_progress' | 'stuffed' | 'closed' | 'cancelled';

export interface LCLConsolidation extends TenantEntity {
  id: UUID;
  consolidationNumber: string;
  facilityId: UUID;
  status: ConsolidationStatus;

  // Container assignment
  containerId?: UUID;
  containerNumber?: string;
  containerSize: ContainerSize;
  containerType: ContainerType;

  // Consignments
  consignments: LCLConsignment[];
  totalConsignments: number;
  totalPackages: number;
  totalWeight: number;
  totalVolume: number;

  // Utilization
  maxWeight: number;       // container payload capacity
  maxVolume: number;       // container cubic capacity
  weightUtilization: number;
  volumeUtilization: number;

  // Route
  portOfLoading: string;
  portOfDischarge: string;
  finalDestination?: string;

  // References
  masterBlNumber?: string;
  vesselName?: string;
  voyageNumber?: string;

  // Timeline
  cutoffDate?: Date;
  stuffingDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface LCLConsignment {
  id: UUID;
  consignmentNumber: string;
  shipperId: UUID;
  shipperName: string;
  consigneeId?: UUID;
  consigneeName: string;

  // Cargo
  cargoItems: CargoItem[];
  packages: number;
  grossWeight: number;
  volume: number;

  // References
  houseBlNumber?: string;
  shippingBillNumber?: string;
  invoiceNumber?: string;

  // Status
  receivedAt?: Date;
  stuffedAt?: Date;
  position?: string; // Position within container
}

// =============================================================================
// FCL OPERATIONS
// =============================================================================

export type FCLOperationType = 'import_delivery' | 'export_stuffing' | 'transshipment' | 'repo_in' | 'repo_out';
export type FCLStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface FCLOperation extends TenantEntity {
  id: UUID;
  operationNumber: string;
  facilityId: UUID;
  operationType: FCLOperationType;
  status: FCLStatus;

  containerId: UUID;
  containerNumber: string;
  containerSize: ContainerSize;

  // Movement
  fromLocation: string;
  toLocation: string;
  transportMode: 'road' | 'rail' | 'vessel';

  // Documentation
  blNumber?: string;
  deliveryOrderId?: string;
  bookingRef?: string;
  customerId?: UUID;

  // Timeline
  plannedDate?: Date;
  completedDate?: Date;
  remarks?: string;

  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// CROSS-DOCKING
// =============================================================================

export type CrossDockStatus = 'planned' | 'receiving' | 'sorting' | 'dispatching' | 'completed' | 'cancelled';

export interface CrossDockOperation extends TenantEntity {
  id: UUID;
  operationNumber: string;
  facilityId: UUID;
  status: CrossDockStatus;

  // Inbound
  inboundContainerId?: UUID;
  inboundContainerNumber?: string;
  inboundTransportMode: 'road' | 'rail' | 'vessel';
  inboundRef?: string;
  receivedAt?: Date;

  // Outbound
  outboundContainerId?: UUID;
  outboundContainerNumber?: string;
  outboundTransportMode: 'road' | 'rail' | 'vessel';
  outboundRef?: string;
  dispatchedAt?: Date;

  // Cargo
  cargoItems: CargoItem[];
  totalPackages: number;
  totalWeight: number;

  // Staging
  stagingArea?: string;
  sortedAt?: Date;

  // Timeline
  plannedReceiveTime?: Date;
  plannedDispatchTime?: Date;
  dwellTimeMinutes?: number;

  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// CARGO INSPECTION
// =============================================================================

export type CargoInspectionType = 'pre_stuffing' | 'post_destuffing' | 'customs' | 'quality_check' | 'damage_survey' | 'tally_verification' | 'seal_check' | 'weight_check';
export type CargoInspectionStatus = 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type CargoInspectionResult = 'pass' | 'fail' | 'conditional_pass' | 'pending';

export interface CargoInspection extends TenantEntity {
  id: UUID;
  inspectionNumber: string;
  facilityId: UUID;
  inspectionType: CargoInspectionType;
  status: CargoInspectionStatus;
  result: CargoInspectionResult;

  // Subject
  containerId?: UUID;
  containerNumber?: string;
  operationId?: UUID;
  operationType?: 'stuffing' | 'destuffing' | 'cross_dock';

  // Inspector
  inspectorId: string;
  inspectorName: string;
  inspectorOrganization?: string;

  // Checklist
  checklistItems: InspectionChecklistItem[];
  totalItems: number;
  passedItems: number;
  failedItems: number;

  // Findings
  findings: string;
  recommendations?: string;
  photos?: { url: string; caption?: string; takenAt: Date }[];
  documents?: { name: string; url: string }[];

  // Seal
  sealNumber?: string;
  sealIntact?: boolean;
  newSealNumber?: string;

  // Weight
  declaredWeight?: number;
  actualWeight?: number;
  weightVariance?: number;

  // Timeline
  scheduledDate?: Date;
  startedAt?: Date;
  completedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface InspectionChecklistItem {
  id: UUID;
  category: string;
  description: string;
  result: 'pass' | 'fail' | 'na';
  remarks?: string;
  photo?: string;
}

// =============================================================================
// OPERATIONS STATS
// =============================================================================

export interface OperationsStats {
  date: Date;
  stuffing: {
    planned: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    avgDurationMinutes: number;
    avgVolumeUtilization: number;
  };
  destuffing: {
    planned: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    avgDurationMinutes: number;
    discrepancyRate: number;
  };
  lcl: {
    openConsolidations: number;
    consignmentsReceived: number;
    containersStuffed: number;
    avgUtilization: number;
  };
  fcl: {
    pending: number;
    completed: number;
    byType: Record<FCLOperationType, number>;
  };
  crossDock: {
    active: number;
    completed: number;
    avgDwellMinutes: number;
  };
  inspections: {
    scheduled: number;
    completed: number;
    passRate: number;
    failRate: number;
  };
}
