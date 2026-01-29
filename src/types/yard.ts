// Yard management types for ankrICD

import type { UUID, AuditFields, TenantEntity } from './common';
import type { YardLocation } from './facility';
import type { ContainerSize, ContainerType } from './container';

// Yard planning strategies
export type PlacementStrategy =
  | 'minimize_rehandles'     // Minimize container shuffling for retrieval
  | 'optimize_dwell'         // FIFO placement for faster turnover
  | 'cluster_vessel'         // Group by vessel/voyage
  | 'cluster_destination'    // Group by final destination
  | 'weight_distribution'    // Balance ground pressure
  | 'equipment_efficiency'   // Minimize equipment travel distance
  | 'reefer_proximity'       // Keep reefers near power points
  | 'hazmat_isolation'       // Segregate hazmat per IMDG
  | 'custom';                // Custom rules

export type YardOperationType =
  | 'ground'
  | 'pick'
  | 'restack'
  | 'shuffle'
  | 'transfer'
  | 'inspection_move'
  | 'reefer_move'
  | 'housekeeping';

export interface YardPlan {
  id: UUID;
  facilityId: UUID;
  planType: 'daily' | 'vessel_discharge' | 'vessel_load' | 'rail_unload' | 'rail_load' | 'restack';
  status: 'draft' | 'approved' | 'in_progress' | 'completed' | 'cancelled';

  // Reference
  vesselVisitId?: UUID;
  rakeId?: UUID;

  // Plan details
  plannedMoves: PlannedMove[];
  totalMoves: number;
  estimatedDuration: number;    // minutes

  // Timing
  plannedStart: Date;
  plannedEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;

  // Resources
  requiredEquipment: UUID[];
  requiredOperators: number;

  // Metrics
  executedMoves: number;
  restackCount: number;
  efficiency?: number;          // percentage

  createdAt: Date;
  createdBy: string;
  approvedAt?: Date;
  approvedBy?: string;
}

export interface PlannedMove {
  id: UUID;
  sequence: number;
  containerId: UUID;
  containerNumber: string;
  operationType: YardOperationType;

  fromLocation: YardLocation | 'rail' | 'truck' | 'vessel' | 'gate';
  toLocation: YardLocation | 'rail' | 'truck' | 'vessel' | 'gate';

  // Constraints
  priority: number;
  mustStartAfter?: UUID;       // Depends on another move
  mustCompleteBefore?: Date;

  // Equipment
  preferredEquipment?: UUID;
  assignedEquipment?: UUID;

  // Status
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
}

export interface SlotRecommendation {
  location: YardLocation;
  score: number;               // 0-100, higher is better
  reasons: string[];
  warnings?: string[];

  // Metrics
  rehandlesRequired: number;
  distanceFromGate: number;    // meters
  stackHeight: number;
  groundPressure?: number;     // kg/sqm
}

export interface YardOccupancy {
  facilityId: UUID;
  timestamp: Date;

  // Overall stats
  totalSlots: number;
  occupiedSlots: number;
  availableSlots: number;
  utilizationPercent: number;
  totalTEU: number;

  // By container type
  bySize: {
    '20': number;
    '40': number;
    '45': number;
  };
  byType: Partial<Record<ContainerType, number>>;
  byStatus: Record<string, number>;

  // By zone
  byZone: ZoneOccupancy[];

  // Special categories
  reeferCount: number;
  reeferPluggedIn: number;
  hazmatCount: number;
  overdueCount: number;        // Past free time
  longStayCount: number;       // > 7 days
}

export interface ZoneOccupancy {
  zoneId: UUID;
  zoneName: string;
  zoneType: string;
  totalSlots: number;
  occupiedSlots: number;
  utilizationPercent: number;
  teuCount: number;
}

export interface RestackPlan {
  id: UUID;
  facilityId: UUID;
  blockId: UUID;
  status: 'draft' | 'approved' | 'in_progress' | 'completed' | 'cancelled';

  // Reason
  reason: RestackReason;
  targetContainer?: UUID;      // If restacking to access a specific container

  // Plan
  moves: RestackMove[];
  totalMoves: number;
  estimatedDuration: number;   // minutes

  // Execution
  executedMoves: number;
  startedAt?: Date;
  completedAt?: Date;

  createdAt: Date;
  createdBy: string;
}

export type RestackReason =
  | 'container_retrieval'      // Need to access a buried container
  | 'vessel_loading'           // Arrange for vessel load sequence
  | 'rail_loading'             // Arrange for rail load sequence
  | 'housekeeping'             // General yard cleanup
  | 'weight_balancing'         // Ground pressure issues
  | 'reefer_access'            // Need reefer plug access
  | 'examination'              // Customs examination access
  | 'repair'                   // Move to/from repair area
  | 'overflow';                // Block nearing capacity

export interface RestackMove {
  sequence: number;
  containerId: UUID;
  containerNumber: string;
  fromSlot: { row: number; slot: number; tier: number };
  toSlot: { row: number; slot: number; tier: number };
  isTemporary: boolean;        // Will be moved again
}

// Heat map data for yard visualization
export interface YardHeatMap {
  facilityId: UUID;
  blockId: UUID;
  timestamp: Date;
  type: 'occupancy' | 'dwell_time' | 'reefer' | 'hazmat' | 'activity';

  cells: HeatMapCell[];
  legend: {
    min: number;
    max: number;
    unit: string;
    colorScale: string[];
  };
}

export interface HeatMapCell {
  row: number;
  slot: number;
  value: number;
  label?: string;
  containerId?: UUID;
}

// Dwell time analysis
export interface DwellTimeAnalysis {
  facilityId: UUID;
  period: { from: Date; to: Date };

  averageDwellDays: number;
  medianDwellDays: number;

  distribution: {
    lessThan3Days: number;
    days3to7: number;
    days7to14: number;
    days14to30: number;
    moreThan30Days: number;
  };

  // Long-stay containers
  longStayContainers: {
    containerId: UUID;
    containerNumber: string;
    dwellDays: number;
    reason?: string;
  }[];
}

// Ground pressure calculation
export interface GroundPressureCheck {
  slotId: UUID;
  row: number;
  slot: number;

  containers: {
    tier: number;
    containerId: UUID;
    grossWeight: number;
  }[];

  totalWeight: number;         // kg
  slotArea: number;            // sqm
  pressure: number;            // kg/sqm
  maxAllowed: number;          // kg/sqm
  withinLimit: boolean;
  utilizationPercent: number;
}

// Slot reservation
export interface SlotReservation extends AuditFields, TenantEntity {
  id: UUID;
  slotId: UUID;
  blockId: UUID;
  row: number;
  slot: number;

  reservationType: 'container' | 'vessel' | 'rail' | 'booking' | 'manual';
  referenceId?: UUID;          // Container, vessel, rake, or booking ID
  referenceNumber?: string;

  reservedAt: Date;
  expiresAt: Date;
  releasedAt?: Date;

  status: 'active' | 'expired' | 'released' | 'used';
}

// Yard work order
export interface YardWorkOrder extends AuditFields, TenantEntity {
  id: UUID;
  workOrderNumber: string;
  orderType: YardOperationType;

  containerId: UUID;
  containerNumber: string;
  containerSize: ContainerSize;

  fromLocation: YardLocation | 'rail' | 'truck' | 'vessel' | 'gate';
  toLocation: YardLocation | 'rail' | 'truck' | 'vessel' | 'gate';

  priority: number;            // 1-10, 10 is highest
  isUrgent: boolean;

  // Assignment
  assignedEquipmentId?: UUID;
  assignedOperatorId?: UUID;

  // Parent reference
  parentPlanId?: UUID;
  parentSequence?: number;

  // Status
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
  statusHistory: WorkOrderStatusChange[];

  // Timing
  scheduledAt?: Date;
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;

  // Metrics
  estimatedDuration?: number;  // minutes
  actualDuration?: number;     // minutes

  // Notes
  instructions?: string;
  completionNotes?: string;
  failureReason?: string;
}

export interface WorkOrderStatusChange {
  status: string;
  timestamp: Date;
  changedBy?: string;
  reason?: string;
}
