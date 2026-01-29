// Equipment types for ankrICD

import type { UUID, AuditFields, TenantEntity, Coordinates } from './common';

export type EquipmentType =
  | 'RTG'                // Rubber Tired Gantry Crane
  | 'RMG'                // Rail Mounted Gantry Crane
  | 'REACH_STACKER'      // Reach Stacker
  | 'EMPTY_HANDLER'      // Empty Container Handler
  | 'FORKLIFT'           // Forklift (various capacities)
  | 'TRAILER'            // Trailer/Chassis
  | 'TERMINAL_TRACTOR'   // Terminal Tractor/Yard Truck
  | 'STRADDLE_CARRIER'   // Straddle Carrier
  | 'QUAY_CRANE'         // Ship-to-Shore Crane (STS)
  | 'MHC'                // Mobile Harbor Crane
  | 'SPREADER'           // Spreader attachment
  | 'WEIGHBRIDGE'        // Weighbridge
  | 'SCANNER'            // Cargo Scanner
  | 'GENSET'             // Generator Set for reefers
  | 'OTHER';

export type EquipmentStatus =
  | 'available'
  | 'in_use'
  | 'reserved'
  | 'maintenance'
  | 'breakdown'
  | 'charging'
  | 'refueling'
  | 'offline';

export type FuelType = 'diesel' | 'electric' | 'lpg' | 'hybrid';

export interface Equipment extends AuditFields, TenantEntity {
  id: UUID;
  facilityId: UUID;
  equipmentNumber: string;
  type: EquipmentType;
  status: EquipmentStatus;

  // Details
  make: string;
  model: string;
  yearOfManufacture: number;
  serialNumber?: string;
  registrationNumber?: string;

  // Capabilities
  liftCapacity: number;        // tons
  maxReach?: number;           // meters (for RTG/RMG/cranes)
  maxStack?: number;           // tiers
  maxLiftHeight?: number;      // meters
  spreaderType?: '20' | '40' | 'twin-20' | 'tandem' | 'telescopic';
  canHandleReefer: boolean;
  canHandleHazmat: boolean;
  canHandleOOG: boolean;

  // Power
  fuelType: FuelType;
  fuelCapacity?: number;       // liters or kWh
  currentFuelLevel?: number;   // percentage

  // Telematics
  telematics?: EquipmentTelematics;

  // Assignment
  assignedZone?: UUID;
  currentOperatorId?: UUID;
  currentWorkOrderId?: UUID;

  // Maintenance
  lastServiceDate?: Date;
  nextServiceDue?: Date;
  engineHours: number;
  odometer?: number;           // km
  maintenanceSchedule: MaintenanceScheduleItem[];

  // Certifications
  certifications: EquipmentCertification[];

  // Checklist
  lastPreTripInspection?: Date;
  preShiftChecklistRequired: boolean;

  // Notes
  notes?: string;
}

export interface EquipmentTelematics {
  deviceId: string;
  lastUpdate: Date;

  // Position
  position?: Coordinates;
  positionAccuracy?: number;   // meters
  heading?: number;            // degrees

  // Motion
  speed?: number;              // km/h
  isMoving: boolean;
  isEngineOn: boolean;

  // Fuel/Power
  fuelLevel?: number;          // percentage
  batteryLevel?: number;       // for electric
  fuelConsumption?: number;    // L/hr or kWh

  // Operations
  liftCount24h?: number;
  engineHoursToday?: number;
  idleTime24h?: number;        // minutes

  // Alerts
  alerts: TelematicsAlert[];
}

export interface TelematicsAlert {
  type: 'low_fuel' | 'low_battery' | 'over_speed' | 'geo_fence' | 'impact' | 'maintenance_due' | 'engine_fault';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
}

export interface EquipmentCertification {
  type: 'safety' | 'load_test' | 'electrical' | 'emissions' | 'operator';
  certNumber?: string;
  issuedBy: string;
  issuedDate: Date;
  expiryDate: Date;
  documentUrl?: string;
}

export interface MaintenanceScheduleItem {
  type: MaintenanceType;
  intervalHours?: number;
  intervalDays?: number;
  lastPerformed?: Date;
  nextDue: Date;
  estimatedCost?: number;
}

export type MaintenanceType =
  | 'daily_inspection'
  | 'weekly_inspection'
  | 'oil_change'
  | 'filter_change'
  | 'brake_service'
  | 'tire_service'
  | 'hydraulic_service'
  | 'electrical_service'
  | 'annual_inspection'
  | 'load_test'
  | 'certification_renewal';

export interface MaintenanceRecord extends AuditFields, TenantEntity {
  id: UUID;
  facilityId: UUID;
  equipmentId: UUID;
  type: 'preventive' | 'corrective' | 'breakdown' | 'inspection';
  maintenanceType: MaintenanceType;

  // Status
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

  // Timing
  scheduledDate: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedDuration?: number;  // hours
  actualDuration?: number;     // hours

  // Work performed
  description: string;
  workPerformed?: string;
  partsReplaced?: PartReplacement[];

  // Metrics at service
  engineHoursAtService?: number;
  odometerAtService?: number;

  // Costs
  laborCost?: number;
  partsCost?: number;
  totalCost?: number;

  // Vendor
  performedBy?: string;        // Internal or vendor name
  vendorInvoice?: string;

  // Documents
  workOrderNumber?: string;
  documents?: string[];
}

export interface PartReplacement {
  partNumber: string;
  partName: string;
  quantity: number;
  unitCost: number;
}

export interface EquipmentAssignment extends AuditFields {
  id: UUID;
  equipmentId: UUID;
  workOrderId?: UUID;
  operatorId?: UUID;

  assignmentType: 'work_order' | 'zone' | 'operator' | 'reservation';
  referenceId?: UUID;

  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'cancelled';

  // Metrics
  movesCompleted?: number;
  hoursWorked?: number;
}

export interface PreShiftChecklist {
  id: UUID;
  equipmentId: UUID;
  operatorId: UUID;
  shiftDate: Date;
  shiftType: 'morning' | 'afternoon' | 'night';

  // Check items
  items: ChecklistItem[];

  // Overall result
  passed: boolean;
  defectsFound: string[];

  // Sign-off
  operatorSignature?: string;
  supervisorApproval?: boolean;
  supervisorId?: string;

  completedAt: Date;
}

export interface ChecklistItem {
  category: string;
  item: string;
  status: 'ok' | 'defect' | 'na';
  notes?: string;
}

// Standard checklist items by equipment type
export const CHECKLIST_ITEMS: Record<EquipmentType, string[]> = {
  RTG: [
    'Brakes functioning properly',
    'All tires in good condition',
    'Spreader locks working',
    'Lights and signals working',
    'Fire extinguisher present',
    'Horn functioning',
    'Cabin cleanliness',
    'Hydraulic fluid level',
    'Fuel/charge level',
    'Safety belt working',
    'Emergency stop working',
    'Load charts visible',
    'Anti-collision sensors working',
  ],
  REACH_STACKER: [
    'Brakes functioning properly',
    'All tires in good condition',
    'Spreader locks working',
    'Mast and boom condition',
    'Lights and signals working',
    'Fire extinguisher present',
    'Horn functioning',
    'Cabin cleanliness',
    'Hydraulic fluid level',
    'Fuel level adequate',
    'Safety belt working',
    'Rear-view mirrors',
    'Load charts visible',
  ],
  FORKLIFT: [
    'Brakes functioning properly',
    'Tires in good condition',
    'Forks not bent/cracked',
    'Mast chains condition',
    'Lights and signals working',
    'Fire extinguisher present',
    'Horn functioning',
    'Hydraulic fluid level',
    'Fuel/charge level',
    'Safety belt working',
    'Overhead guard secure',
    'Load backrest secure',
  ],
  TERMINAL_TRACTOR: [
    'Brakes functioning properly',
    'Tires in good condition',
    'Fifth wheel lubricated',
    'Lights and signals working',
    'Fire extinguisher present',
    'Horn functioning',
    'Mirrors adjusted',
    'Fuel level adequate',
    'Air brake system',
    'Coupling mechanism',
  ],
  RMG: [],
  EMPTY_HANDLER: [],
  TRAILER: [],
  STRADDLE_CARRIER: [],
  QUAY_CRANE: [],
  MHC: [],
  SPREADER: [],
  WEIGHBRIDGE: [],
  SCANNER: [],
  GENSET: [],
  OTHER: [],
};

// Equipment utilization metrics
export interface EquipmentUtilization {
  equipmentId: UUID;
  period: { from: Date; to: Date };

  availableHours: number;
  operatingHours: number;
  idleHours: number;
  maintenanceHours: number;
  breakdownHours: number;

  utilizationPercent: number;
  availabilityPercent: number;

  movesCompleted: number;
  movesPerHour: number;

  fuelConsumed?: number;
  fuelEfficiency?: number;     // moves per liter or kWh
}
