// Container types for ankrICD

import type { UUID, AuditFields, TenantEntity, Attachment } from './common';
import type { YardLocation } from './facility';

// ISO 6346 Container Types
export type ContainerSize = '20' | '40' | '45';
export type ContainerHeight = 'standard' | 'high_cube';
export type ContainerType = 'GP' | 'HC' | 'RF' | 'OT' | 'FR' | 'TK' | 'BU' | 'PL' | 'VT';

// ISO Type codes (first 2 digits = size, next 2 = type)
export type ContainerISOType =
  | '22G0' | '22G1'  // 20ft General Purpose
  | '25G0' | '25G1'  // 20ft High Cube (rare)
  | '42G0' | '42G1'  // 40ft General Purpose
  | '45G0' | '45G1'  // 40ft High Cube
  | '22R0' | '22R1'  // 20ft Reefer
  | '45R0' | '45R1'  // 40ft Reefer High Cube
  | '22U0' | '22U1'  // 20ft Open Top
  | '42U0' | '42U1'  // 40ft Open Top
  | '22P0' | '22P1'  // 20ft Flat Rack
  | '42P0' | '42P1'  // 40ft Flat Rack
  | '22T0' | '22T1'  // 20ft Tank
  | '42T0' | '42T1'  // 40ft Tank
  | 'L5G0' | 'L5G1'  // 45ft High Cube
  | string;          // Other codes

export type ContainerStatus =
  | 'announced'      // Pre-advised but not arrived
  | 'arrived'        // At facility gate
  | 'gated_in'       // Passed gate, awaiting grounding
  | 'grounded'       // In yard
  | 'picked'         // Picked up from yard
  | 'gated_out'      // Exited facility
  | 'stuffing'       // Being stuffed (CFS)
  | 'destuffing'     // Being destuffed (CFS)
  | 'inspection'     // Under customs examination
  | 'repair'         // Under repair
  | 'on_hold'        // Hold placed
  | 'departed';      // Left facility

export type ContainerCondition =
  | 'sound'          // Good condition
  | 'damaged'        // Has damage
  | 'needs_repair'   // Requires repair
  | 'under_repair'   // Currently being repaired
  | 'rejected';      // Not accepted

export type CustomsStatus =
  | 'pending'        // Awaiting customs processing
  | 'under_assessment' // BOE/SB being assessed
  | 'duty_pending'   // Duty payment required
  | 'examination_ordered' // Customs exam ordered
  | 'under_examination' // Being examined
  | 'out_of_charge'  // Cleared by customs
  | 'let_export'     // Export permission granted
  | 'hold'           // Customs hold
  | 'seized';        // Seized by customs

export interface Container extends AuditFields, TenantEntity {
  id: UUID;
  containerNumber: string;    // ISO 6346 format: MSCU1234567
  isoType: ContainerISOType;
  size: ContainerSize;
  type: ContainerType;
  height: ContainerHeight;
  status: ContainerStatus;
  condition: ContainerCondition;

  // Ownership
  owner: string;              // Shipping line code
  ownerName: string;
  operator?: string;          // Operating carrier if different

  // Weights
  tareWeight: number;         // kg
  grossWeight?: number;       // kg
  maxPayload: number;         // kg
  vgmWeight?: number;         // Verified Gross Mass
  vgmCertifiedBy?: string;

  // Seals
  sealNumbers: string[];
  sealIntact?: boolean;

  // Cargo info
  cargoDescription?: string;
  harmonizedCode?: string;
  packagesCount?: number;
  packageType?: string;

  // Special handling
  hazmat?: HazmatInfo;
  reefer?: ReeferInfo;
  oog?: OverGaugeInfo;
  overweight?: OverweightInfo;

  // Location
  currentLocation?: YardLocation;
  previousLocations: YardLocation[];

  // Transport
  bookingRef?: string;
  blNumber?: string;          // Bill of Lading
  deliveryOrderNumber?: string;
  vesselVoyage?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  finalDestination?: string;

  // Timing
  eta?: Date;                 // Expected arrival
  gateInTime?: Date;
  groundedTime?: Date;
  gateOutTime?: Date;
  freeTimeExpiry?: Date;

  // Customs
  customsStatus: CustomsStatus;
  boeNumber?: string;
  sbNumber?: string;
  igmNumber?: string;
  igmLineNumber?: number;

  // Holds
  holds: ContainerHold[];

  // Movements history
  movements: ContainerMovement[];

  // Photos and documents
  photos: ContainerPhoto[];
  documents: Attachment[];

  // Linked containers (for combined shipments)
  linkedContainers?: UUID[];
}

export interface HazmatInfo {
  unNumber: string;           // UN Number (e.g., UN1234)
  properShippingName: string;
  class: HazmatClass;
  subsidiaryRisk?: HazmatClass[];
  packingGroup?: 'I' | 'II' | 'III';
  flashPoint?: number;        // Celsius
  marinePollutant: boolean;
  limitedQuantity: boolean;
  emergencyContact?: string;
  emergencyPhone?: string;
  dgDeclaration?: Attachment;
}

export type HazmatClass =
  | '1'    // Explosives
  | '1.1' | '1.2' | '1.3' | '1.4' | '1.5' | '1.6'
  | '2.1'  // Flammable gases
  | '2.2'  // Non-flammable gases
  | '2.3'  // Toxic gases
  | '3'    // Flammable liquids
  | '4.1'  // Flammable solids
  | '4.2'  // Spontaneously combustible
  | '4.3'  // Dangerous when wet
  | '5.1'  // Oxidizers
  | '5.2'  // Organic peroxides
  | '6.1'  // Toxic substances
  | '6.2'  // Infectious substances
  | '7'    // Radioactive
  | '8'    // Corrosives
  | '9';   // Miscellaneous

export interface ReeferInfo {
  setTemperature: number;     // Celsius
  currentTemperature?: number;
  humidity?: number;          // Percentage
  ventilation?: 'open' | 'closed' | 'partial';
  ventilationSetting?: number; // CBM/hr
  o2Level?: number;           // Percentage
  co2Level?: number;          // Percentage
  fuelType?: 'diesel' | 'electric';
  fuelLevel?: number;         // Percentage
  gensetHours?: number;
  pluggedIn: boolean;
  pluggedInAt?: Date;
  lastTempReading?: Date;
  tempAlerts: ReeferTempAlert[];
  preTripInspected: boolean;
  ptiDate?: Date;
}

export interface ReeferTempAlert {
  timestamp: Date;
  actualTemp: number;
  setTemp: number;
  deviation: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
}

export interface OverGaugeInfo {
  overLength: boolean;
  overWidth: boolean;
  overHeight: boolean;
  frontOverhang?: number;     // cm
  rearOverhang?: number;      // cm
  leftOverhang?: number;      // cm
  rightOverhang?: number;     // cm
  topOverhang?: number;       // cm
  specialEquipmentRequired: boolean;
  equipmentNotes?: string;
}

export interface OverweightInfo {
  actualWeight: number;       // kg
  permitNumber?: string;
  permitValidUntil?: Date;
  specialHandlingRequired: boolean;
  handlingNotes?: string;
}

export type HoldType =
  | 'customs'        // Customs hold
  | 'shipping_line'  // Shipping line hold
  | 'damage'         // Damage hold
  | 'payment'        // Payment pending
  | 'documentation'  // Document issue
  | 'examination'    // Examination required
  | 'legal'          // Legal/court order
  | 'other';

export interface ContainerHold {
  id: UUID;
  type: HoldType;
  reason: string;
  placedAt: Date;
  placedBy: string;
  releasedAt?: Date;
  releasedBy?: string;
  reference?: string;
  autoRelease?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export type MovementType =
  | 'gate_in'
  | 'gate_out'
  | 'ground'
  | 'pick'
  | 'restack'
  | 'transfer_zone'
  | 'load_truck'
  | 'unload_truck'
  | 'load_rail'
  | 'unload_rail'
  | 'load_vessel'
  | 'unload_vessel'
  | 'plug_reefer'
  | 'unplug_reefer'
  | 'inspection_start'
  | 'inspection_end'
  | 'repair_start'
  | 'repair_end';

export interface ContainerMovement {
  id: UUID;
  containerId: UUID;
  movementType: MovementType;
  fromLocation?: YardLocation | string;
  toLocation?: YardLocation | string;
  equipmentId?: UUID;
  operatorId?: UUID;
  workOrderId?: UUID;
  movementTime: Date;
  duration?: number;          // minutes
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface ContainerPhoto {
  id: UUID;
  type: 'front' | 'rear' | 'left' | 'right' | 'top' | 'damage' | 'seal' | 'other';
  url: string;
  thumbnailUrl?: string;
  capturedAt: Date;
  capturedBy?: string;
  location?: 'gate' | 'yard' | 'examination';
  notes?: string;
}

// Container validation (ISO 6346)
export function validateContainerNumber(containerNumber: string): boolean {
  if (!containerNumber || containerNumber.length !== 11) return false;

  const ownerCode = containerNumber.substring(0, 3);
  const categoryId = containerNumber.charAt(3);
  const serial = containerNumber.substring(4, 10);
  const checkDigit = containerNumber.charAt(10);

  // Owner code must be letters
  if (!/^[A-Z]{3}$/.test(ownerCode)) return false;

  // Category must be U, J, or Z
  if (!['U', 'J', 'Z'].includes(categoryId)) return false;

  // Serial must be digits
  if (!/^\d{6}$/.test(serial)) return false;

  // Validate check digit
  const calculated = calculateCheckDigit(containerNumber.substring(0, 10));
  return calculated === parseInt(checkDigit, 10);
}

function calculateCheckDigit(containerWithoutCheck: string): number {
  const values: Record<string, number> = {
    'A': 10, 'B': 12, 'C': 13, 'D': 14, 'E': 15, 'F': 16, 'G': 17, 'H': 18, 'I': 19,
    'J': 20, 'K': 21, 'L': 23, 'M': 24, 'N': 25, 'O': 26, 'P': 27, 'Q': 28, 'R': 29,
    'S': 30, 'T': 31, 'U': 32, 'V': 34, 'W': 35, 'X': 36, 'Y': 37, 'Z': 38,
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
  };

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const char = containerWithoutCheck.charAt(i);
    const value = values[char];
    if (value === undefined) return -1;
    sum += value * Math.pow(2, i);
  }

  return sum % 11 % 10;
}

// Get container size in TEU
export function getContainerTEU(size: ContainerSize): number {
  switch (size) {
    case '20': return 1;
    case '40': return 2;
    case '45': return 2.25;
    default: return 1;
  }
}

// Parse ISO type code
export function parseISOType(isoType: ContainerISOType): {
  size: ContainerSize;
  type: ContainerType;
  height: ContainerHeight;
} {
  const sizeCode = isoType.substring(0, 2);
  const typeCode = isoType.substring(2, 4);

  let size: ContainerSize = '20';
  let height: ContainerHeight = 'standard';

  switch (sizeCode) {
    case '22':
    case '2':
      size = '20';
      break;
    case '42':
    case '4':
      size = '40';
      break;
    case '45':
    case 'L5':
      size = '45';
      height = 'high_cube';
      break;
    case '25':
      size = '20';
      height = 'high_cube';
      break;
  }

  let type: ContainerType = 'GP';
  const typeChar = typeCode.charAt(0);
  switch (typeChar) {
    case 'G': type = 'GP'; break;
    case 'R': type = 'RF'; break;
    case 'U': type = 'OT'; break;
    case 'P': type = 'PL'; break;
    case 'T': type = 'TK'; break;
    case 'B': type = 'BU'; break;
    case 'V': type = 'VT'; break;
  }

  // Check for high cube based on type code variations
  if (sizeCode === '45' || sizeCode === 'L5' || sizeCode === '25') {
    height = 'high_cube';
  }

  return { size, type, height };
}
