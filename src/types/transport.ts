// Transport types for ankrICD - Rail, Road, Waterfront

import type { UUID, AuditFields, TenantEntity, ContactInfo, Address } from './common';

// ============================================================================
// RAIL TRANSPORT
// ============================================================================

export type RailTrackType = 'main' | 'siding' | 'loading' | 'unloading' | 'staging';
export type RailTrackStatus = 'available' | 'occupied' | 'maintenance' | 'blocked';

export interface RailTrack extends AuditFields, TenantEntity {
  id: UUID;
  facilityId: UUID;
  trackNumber: string;
  name?: string;
  trackType: RailTrackType;
  status: RailTrackStatus;

  // Specifications
  length: number;              // meters
  wagonCapacity: number;       // max wagons
  electrified: boolean;
  gaugeType: 'broad' | 'standard' | 'narrow';  // Indian Railways uses broad gauge

  // Current state
  currentRakeId?: UUID;

  // Position in yard
  coordinates?: {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
  };
}

export type RakeStatus =
  | 'announced'
  | 'en_route'
  | 'arrived'
  | 'positioning'
  | 'unloading'
  | 'loading'
  | 'ready_for_departure'
  | 'departed'
  | 'cancelled';

export interface Rake extends AuditFields, TenantEntity {
  id: UUID;
  facilityId: UUID;
  rakeNumber: string;
  trainNumber: string;

  // Journey
  origin: string;              // Station code
  originName: string;
  destination: string;         // Station code
  destinationName: string;
  viaStations?: string[];

  // Schedule
  eta: Date;
  ata?: Date;                  // Actual Time of Arrival
  etd: Date;
  atd?: Date;                  // Actual Time of Departure

  // Assignment
  trackId?: UUID;
  trackNumber?: string;

  // Wagons
  wagons: Wagon[];
  totalWagons: number;
  totalTEU: number;

  // Cargo
  importContainers: number;
  exportContainers: number;
  emptyContainers: number;

  // Status
  status: RakeStatus;

  // Documents
  railwayReceipt?: string;     // RR Number
  indentNumber?: string;
  manifestNumber?: string;

  // Railway details
  locoNumber?: string;
  guardName?: string;
  driverName?: string;
}

// Indian Railways wagon types for container transport
export type IndianWagonType =
  | 'BLC'      // Bogie Low Platform Container wagon
  | 'BLCA'     // Modified BLC
  | 'BFKN'     // Bogie Flat wagon for containers
  | 'BFNS'     // High-speed flat wagon
  | 'BOXNHL'   // High-sided open wagon (converted)
  | 'BRN'      // Bogie Rail wagon
  | 'BOST'     // Bogie Open Stainless steel
  | 'NMG';     // New Modified Goods

export interface Wagon {
  id: UUID;
  rakeId: UUID;
  wagonNumber: string;
  wagonType: IndianWagonType;
  position: number;            // Position in rake (1-indexed)

  // Capacity
  maxLoadCapacity: number;     // tons
  maxContainers: number;       // Usually 1 or 2

  // Current load
  containers: WagonContainer[];
  currentLoad: number;         // tons

  // Tare
  tareWeight: number;          // kg

  // Condition
  condition: 'fit' | 'damaged' | 'under_repair';
}

export interface WagonContainer {
  slot: 'front' | 'rear' | 'single';
  containerId?: UUID;
  containerNumber?: string;
  isEmpty: boolean;
  weight?: number;
}

export interface RailManifest extends AuditFields, TenantEntity {
  id: UUID;
  facilityId: UUID;
  rakeId: UUID;
  manifestNumber: string;
  manifestType: 'import' | 'export';

  // Journey
  originStation: string;
  destinationStation: string;

  // Containers
  containers: RailManifestContainer[];
  totalContainers: number;
  totalTEU: number;
  totalWeight: number;

  // Status
  status: 'draft' | 'submitted' | 'acknowledged' | 'cleared';

  // Submission
  submittedAt?: Date;
  acknowledgedAt?: Date;
}

export interface RailManifestContainer {
  containerNumber: string;
  isoType: string;
  wagonNumber: string;
  wagonPosition: number;
  grossWeight: number;
  sealNumber?: string;
  blNumber?: string;
  consignee?: string;
  cargoDescription?: string;
}

// ============================================================================
// ROAD TRANSPORT
// ============================================================================

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'arrived'
  | 'check_in'
  | 'processing'
  | 'check_out'
  | 'completed'
  | 'no_show'
  | 'cancelled';

export interface TruckAppointment extends AuditFields, TenantEntity {
  id: UUID;
  facilityId: UUID;
  appointmentNumber: string;
  appointmentType: 'pickup' | 'delivery' | 'both';

  // Schedule
  scheduledTime: Date;
  windowStart: Date;
  windowEnd: Date;

  // Transporter
  transporterId: UUID;
  transporterName: string;
  truckNumber: string;
  trailerNumber?: string;

  // Driver
  driverName: string;
  driverLicense: string;
  driverPhone: string;
  driverPhoto?: string;

  // Cargo
  containers: AppointmentContainer[];
  totalContainers: number;

  // Documentation
  deliveryOrderId?: UUID;
  deliveryOrderNumber?: string;
  eWayBillNumber?: string;
  lrNumber?: string;           // Lorry Receipt

  // Status
  status: AppointmentStatus;

  // Actual times
  actualArrival?: Date;
  checkInTime?: Date;
  checkOutTime?: Date;

  // Notes
  instructions?: string;
  notes?: string;
}

export interface AppointmentContainer {
  containerId?: UUID;
  containerNumber: string;
  isoType: string;
  operation: 'pickup' | 'delivery';
  status: 'pending' | 'completed';
}

export interface Transporter extends AuditFields, TenantEntity {
  id: UUID;
  facilityId: UUID;
  code: string;
  name: string;
  legalName: string;

  // Registration
  gstin?: string;
  panNumber?: string;
  transporterId?: string;      // GST transport ID

  // Contact
  address: Address;
  contacts: ContactInfo[];
  email?: string;
  phone?: string;

  // Fleet
  fleetSize?: number;
  vehicleTypes?: string[];

  // Rating
  rating?: number;
  completedTrips?: number;
  onTimePercent?: number;

  // Status
  status: 'active' | 'inactive' | 'blacklisted';

  // Contracts
  contractStartDate?: Date;
  contractEndDate?: Date;
  creditLimit?: number;
  paymentTerms?: string;
}

export interface TruckVisit extends AuditFields, TenantEntity {
  id: UUID;
  facilityId: UUID;
  appointmentId?: UUID;

  // Vehicle
  truckNumber: string;
  trailerNumber?: string;
  vehicleType?: string;

  // Driver
  driverName: string;
  driverLicense: string;
  driverPhone: string;

  // Timing
  arrivalTime: Date;
  gateInTime?: Date;
  gateOutTime?: Date;
  totalDuration?: number;      // minutes

  // Containers handled
  containersDelivered: string[];
  containersPickedUp: string[];

  // Documents
  eWayBillNumber?: string;
  deliveryOrderNumber?: string;

  // Gate captures
  entryPhotos: string[];
  exitPhotos: string[];
  weighbridgeIn?: number;      // kg
  weighbridgeOut?: number;     // kg

  // Status
  status: 'at_gate' | 'inside' | 'departed';
}

// E-way Bill (GST)
export interface EWayBill extends AuditFields, TenantEntity {
  id: UUID;
  facilityId: UUID;
  eWayBillNumber: string;

  // Validity
  generatedAt: Date;
  validFrom: Date;
  validTo: Date;

  // Parties
  fromGstin: string;
  fromTradeName: string;
  fromAddress: Address;
  toGstin: string;
  toTradeName: string;
  toAddress: Address;

  // Transport
  transportMode: 'road' | 'rail' | 'ship' | 'air';
  transporterId?: string;
  transporterName?: string;
  vehicleNumber?: string;
  vehicleType?: string;

  // Document
  documentType: 'invoice' | 'bill_of_supply' | 'delivery_challan' | 'other';
  documentNumber: string;
  documentDate: Date;

  // Goods
  hsnCode: string;
  productDescription: string;
  quantity: number;
  unit: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalValue: number;

  // Status
  status: 'active' | 'cancelled' | 'expired';
  cancelledAt?: Date;
  cancelReason?: string;

  // Updates
  partBUpdates: EWayBillPartBUpdate[];
}

export interface EWayBillPartBUpdate {
  updateTime: Date;
  vehicleNumber: string;
  fromPlace: string;
  transDocNumber?: string;
  transDocDate?: Date;
}

// ============================================================================
// WATERFRONT / PORT
// ============================================================================

export type BerthStatus =
  | 'available'
  | 'occupied'
  | 'reserved'
  | 'maintenance'
  | 'weather_hold';

export interface Berth extends AuditFields, TenantEntity {
  id: UUID;
  facilityId: UUID;
  berthNumber: string;
  name?: string;

  // Specifications
  length: number;              // meters
  depth: number;               // draft in meters
  maxLOA: number;              // Length Overall
  maxBeam: number;             // Width
  maxDraft: number;            // meters
  bollardPull?: number;        // tons

  // Equipment
  cranes: QuayCrane[];
  fenders?: number;

  // Status
  status: BerthStatus;
  currentVesselId?: UUID;

  // Position
  coordinates?: {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
  };
}

export type VesselStatus =
  | 'announced'
  | 'at_anchorage'
  | 'berthing'
  | 'alongside'
  | 'working'
  | 'idle'
  | 'unberthing'
  | 'departed'
  | 'cancelled';

export interface VesselVisit extends AuditFields, TenantEntity {
  id: UUID;
  facilityId: UUID;

  // Vessel details
  vesselId?: UUID;
  vesselName: string;
  imoNumber: string;
  callSign?: string;
  flag: string;
  vesselType: 'container' | 'bulk' | 'tanker' | 'roro' | 'general';

  // Voyage
  voyageNumber: string;
  shippingLine: string;
  service?: string;            // Service name/route

  // Dimensions
  loa: number;                 // Length Overall
  beam: number;                // Width
  draft: number;               // Current draft

  // Schedule
  eta: Date;
  etb?: Date;                  // Estimated Time of Berthing
  ata?: Date;                  // Actual Time of Arrival
  atb?: Date;                  // Actual Time of Berthing
  etd: Date;
  atd?: Date;                  // Actual Time of Departure

  // Berth
  berthId?: UUID;
  berthNumber?: string;
  berthSide: 'port' | 'starboard';

  // Operations
  dischargeContainers: number;
  loadContainers: number;
  shiftContainers?: number;
  restowContainers?: number;
  totalMoves: number;

  // Progress
  dischargeDone: number;
  loadDone: number;

  // Status
  status: VesselStatus;

  // Stow plan
  hasStowPlan: boolean;
  stowPlanId?: UUID;

  // Agent
  shippingAgent?: string;
  agentContact?: ContactInfo;
}

export type CraneType = 'STS' | 'MHC' | 'RMQC';

export interface QuayCrane extends AuditFields, TenantEntity {
  id: UUID;
  facilityId: UUID;
  craneName: string;
  craneNumber: string;
  craneType: CraneType;

  // Specifications
  outreach: number;            // meters
  backreach?: number;          // meters
  liftCapacity: number;        // tons under spreader
  liftHeight: number;          // meters above quay
  hoisSpeed: number;           // m/min
  trolleySpeed: number;        // m/min
  gantrySpeed?: number;        // m/min

  // Spreader
  spreaderType: 'single' | 'twin-lift' | 'tandem';

  // Status
  status: 'available' | 'working' | 'breakdown' | 'maintenance';
  currentBerthId?: UUID;
  currentVesselId?: UUID;
  currentBay?: number;

  // Productivity
  movesPerHour?: number;
  movesToday?: number;
}

export interface VesselStowPlan extends AuditFields, TenantEntity {
  id: UUID;
  facilityId: UUID;
  vesselVisitId: UUID;
  version: number;
  status: 'draft' | 'submitted' | 'approved' | 'working' | 'completed';

  // Summary
  totalDischarge: number;
  totalLoad: number;
  totalRestow: number;

  // Plan data
  bays: BayPlan[];

  // Timing
  createdAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
}

export interface BayPlan {
  bayNumber: number;
  tier: number;
  row: number;
  containerId?: UUID;
  containerNumber?: string;
  isoType?: string;
  weight?: number;
  operation: 'discharge' | 'load' | 'restow' | 'remain';
  portOfDischarge?: string;
  hazmat?: boolean;
  reefer?: boolean;
  oog?: boolean;
}
