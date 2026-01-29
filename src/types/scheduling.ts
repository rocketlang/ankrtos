// Scheduling types for ankrICD
// Dock scheduling, trailer/chassis management, empty container ops, stacking optimization

import type { UUID, AuditFields, TenantEntity } from './common';

// ============================================================================
// DOCK / GATE SCHEDULING
// ============================================================================

export type DockSlotStatus = 'available' | 'reserved' | 'occupied' | 'blocked' | 'maintenance';

export type AppointmentPurpose =
  | 'delivery_import'
  | 'pickup_export'
  | 'empty_return'
  | 'empty_pickup'
  | 'stuffing'
  | 'destuffing'
  | 'survey'
  | 'customs_exam';

export type DockAppointmentStatus =
  | 'requested'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'no_show'
  | 'cancelled'
  | 'rescheduled';

export interface DockSlot extends TenantEntity, AuditFields {
  id: UUID;
  gateId: UUID;
  slotNumber: string;
  slotType: 'inbound' | 'outbound' | 'dual';
  status: DockSlotStatus;
  operatingHoursStart: string; // HH:mm
  operatingHoursEnd: string;
  slotDurationMinutes: number;
  maxTrucksPerSlot: number;
  hasWeighbridge: boolean;
  hasOCR: boolean;
  notes?: string;
}

export interface DockAppointment extends TenantEntity, AuditFields {
  id: UUID;
  appointmentNumber: string;
  slotId: UUID;
  purpose: AppointmentPurpose;
  status: DockAppointmentStatus;
  scheduledDate: Date;
  scheduledTimeStart: string; // HH:mm
  scheduledTimeEnd: string;
  actualArrivalTime?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;

  // Truck/driver info
  truckNumber: string;
  driverName: string;
  driverPhone: string;
  driverLicense?: string;
  transporterId?: UUID;
  transporterName?: string;

  // Cargo info
  containerNumbers: string[];
  purpose_details?: string;
  cargoDescription?: string;
  estimatedWeight?: number;

  // Notification
  smsNotified: boolean;
  smsNotifiedAt?: Date;
  reminderSent: boolean;
  reminderSentAt?: Date;

  // Rescheduling
  originalDate?: Date;
  originalSlotId?: UUID;
  rescheduleReason?: string;
  rescheduledBy?: string;

  // Cancellation
  cancelReason?: string;
  cancelledBy?: string;
  cancelledAt?: Date;

  // Completion
  turnaroundMinutes?: number;
  waitTimeMinutes?: number;
}

// ============================================================================
// TRAILER & CHASSIS MANAGEMENT
// ============================================================================

export type TrailerType = '20ft_chassis' | '40ft_chassis' | '20ft_flatbed' | '40ft_flatbed' | 'skeletal' | 'lowbed' | 'other';
export type TrailerStatus = 'available' | 'in_use' | 'parked' | 'maintenance' | 'damaged' | 'retired';

export interface Trailer extends TenantEntity, AuditFields {
  id: UUID;
  trailerNumber: string;
  trailerType: TrailerType;
  status: TrailerStatus;
  owner: string; // shipping line or ICD
  ownerType: 'icd' | 'shipping_line' | 'transporter';
  maxPayload: number; // kg
  tareWeight: number;
  length: number; // meters
  width: number;

  // Location
  currentLocation?: string; // yard slot or external
  parkingSlot?: string;
  lastKnownGPS?: { lat: number; lng: number };

  // Assignment
  assignedContainerId?: UUID;
  assignedTruckNumber?: string;
  assignedAt?: Date;

  // Inspection
  lastInspectionDate?: Date;
  nextInspectionDue?: Date;
  inspectionStatus: 'valid' | 'due' | 'overdue' | 'failed';

  notes?: string;
}

// ============================================================================
// EMPTY CONTAINER MANAGEMENT
// ============================================================================

export type EmptyContainerStatus =
  | 'in_depot'
  | 'allotted'
  | 'survey_pending'
  | 'survey_passed'
  | 'survey_failed'
  | 'repair_pending'
  | 'released'
  | 'picked_up';

export type EmptyAllotmentStatus = 'requested' | 'approved' | 'allotted' | 'picked_up' | 'cancelled' | 'expired';

export interface EmptyContainer extends TenantEntity, AuditFields {
  id: UUID;
  containerNumber: string;
  isoType: string;
  shippingLine: string;
  status: EmptyContainerStatus;

  // Depot info
  depotLocation?: string;
  yardSlot?: string;
  receivedDate: Date;
  receivedFrom: string;

  // Survey
  surveyDate?: Date;
  surveyResult?: 'pass' | 'fail';
  surveyRemarks?: string;
  damages?: string[];

  // Allotment
  allotmentId?: UUID;
  allottedTo?: string;
  allottedDate?: Date;
  pickupDeadline?: Date;

  // Release
  deliveryOrderId?: UUID;
  releaseDate?: Date;
  releasedTo?: string;

  // Reefer PTI
  isReefer: boolean;
  ptiDate?: Date;
  ptiResult?: 'pass' | 'fail';
  ptiRemarks?: string;
  setTemperature?: number;
}

export interface EmptyAllotment extends TenantEntity, AuditFields {
  id: UUID;
  allotmentNumber: string;
  status: EmptyAllotmentStatus;
  shippingLine: string;
  requestedBy: string; // exporter/CHA
  requestedDate: Date;

  // Quantities
  containerType: string; // e.g., '40HC'
  quantityRequested: number;
  quantityAllotted: number;
  quantityPickedUp: number;

  // Approval
  approvedBy?: string;
  approvedDate?: Date;
  expiryDate?: Date;

  // Containers
  containerIds: UUID[];

  notes?: string;
}

// ============================================================================
// STACKING OPTIMIZATION
// ============================================================================

export type StackingStrategy =
  | 'minimize_rehandles'
  | 'departure_based'
  | 'weight_based'
  | 'segregation_based'
  | 'balanced';

export type SegregationCategory =
  | 'import'
  | 'export'
  | 'empty'
  | 'hazmat'
  | 'reefer'
  | 'oversize'
  | 'out_of_gauge'
  | 'bonded'
  | 'customs_hold';

export interface StackingRule extends TenantEntity, AuditFields {
  id: UUID;
  name: string;
  priority: number;
  enabled: boolean;
  ruleType: 'segregation' | 'weight' | 'departure' | 'shipping_line' | 'custom';
  conditions: {
    category?: SegregationCategory;
    maxStackHeight?: number;
    allowMixedCategories?: boolean;
    preferredBlocks?: string[];
    heavyOnBottom?: boolean;
    departureWindowHours?: number;
  };
}

export interface StackingRecommendation {
  containerId: UUID;
  containerNumber: string;
  recommendedBlock: string;
  recommendedBay: string;
  recommendedRow: string;
  recommendedTier: number;
  score: number; // 0-100 recommendation quality
  reasons: string[];
  alternativeLocations: Array<{
    block: string;
    bay: string;
    row: string;
    tier: number;
    score: number;
  }>;
  rehandlesNeeded: number;
  strategy: StackingStrategy;
}

// ============================================================================
// STATS
// ============================================================================

export interface SchedulingStats {
  tenantId: string;

  // Appointments
  totalAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  noShowAppointments: number;
  cancelledAppointments: number;
  appointmentsToday: number;
  averageTurnaroundMinutes: number;
  averageWaitTimeMinutes: number;

  // Dock slots
  totalDockSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  utilizationPercent: number;

  // Trailers
  totalTrailers: number;
  availableTrailers: number;
  inUseTrailers: number;
  maintenanceTrailers: number;

  // Empty containers
  totalEmptyContainers: number;
  emptyInDepot: number;
  emptyAllotted: number;
  emptyPendingSurvey: number;
  pendingAllotments: number;

  // Stacking
  totalStackingRules: number;
  activeStackingRules: number;
}
