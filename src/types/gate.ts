// Gate Operations types for ankrICD

import type { UUID, AuditFields, TenantEntity } from './common';
import type { ContainerSize, ContainerISOType, ContainerCondition } from './container';

// ============================================================================
// GATE CONFIGURATION
// ============================================================================

export type GateType = 'main' | 'rail' | 'emergency' | 'vip';
export type GateLaneType = 'in' | 'out' | 'both';
export type GateLaneStatus = 'open' | 'closed' | 'maintenance';

export interface Gate extends AuditFields, TenantEntity {
  id: UUID;
  gateId: string;              // G01, G02, etc.
  name: string;
  gateType: GateType;

  // Location
  facilityId: UUID;
  coordinates?: {
    lat: number;
    lng: number;
  };

  // Configuration
  lanes: GateLane[];
  totalLanes: number;

  // Equipment
  hasWeighbridge: boolean;
  weighbridgeCapacity?: number;    // kg
  hasOCR: boolean;
  hasRFID: boolean;

  // Operating hours
  operatingHours: {
    weekdays: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };
  is24x7: boolean;

  status: 'active' | 'inactive';
}

export interface GateLane {
  id: UUID;
  gateId: UUID;
  laneNumber: string;          // L1, L2, etc.
  laneType: GateLaneType;
  status: GateLaneStatus;

  // Equipment
  hasOCR: boolean;
  hasRFID: boolean;
  hasWeighbridge: boolean;
  hasBoomBarrier: boolean;

  // Current state
  currentTransaction?: UUID;
  vehiclesInQueue: number;
  averageProcessingTime?: number;   // minutes
}

// ============================================================================
// GATE TRANSACTIONS
// ============================================================================

export type GateTransactionType = 'GATE_IN' | 'GATE_OUT';
export type GateTransactionStatus =
  | 'pending'
  | 'vehicle_at_gate'
  | 'document_check'
  | 'physical_inspection'
  | 'weighing'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled';

export interface GateTransaction extends AuditFields, TenantEntity {
  id: UUID;
  transactionNumber: string;
  transactionType: GateTransactionType;

  // Gate info
  facilityId: UUID;
  gateId: UUID;
  laneId: UUID;

  // Vehicle info
  truckNumber: string;
  trailerNumber?: string;

  // Driver info
  driverId?: UUID;
  driverName: string;
  driverLicense: string;
  driverPhone: string;
  driverPhoto?: string;

  // Container info (for single container transactions)
  containerId?: UUID;
  containerNumber?: string;
  containerSize?: ContainerSize;
  containerISOType?: ContainerISOType;

  // Multiple containers
  containers: GateTransactionContainer[];

  // Seal
  sealNumbers?: string[];
  sealCondition?: 'intact' | 'broken' | 'missing' | 'tampered';

  // Container condition (for gate-in)
  containerCondition?: ContainerCondition;
  damageNotes?: string;

  // Documentation
  appointmentId?: UUID;
  appointmentNumber?: string;
  deliveryOrderId?: UUID;
  deliveryOrderNumber?: string;
  eWayBillNumber?: string;
  lrNumber?: string;               // Lorry Receipt
  blNumber?: string;

  // Captures
  photos: GatePhoto[];
  ocrCapture?: OCRCapture;
  rfidCapture?: RFIDCapture;
  weighbridgeData?: WeighbridgeCapture;

  // Inspection
  inspectionResult?: InspectionResult;

  // Timing
  arrivalTime: Date;
  processStartTime?: Date;
  documentCheckTime?: Date;
  inspectionTime?: Date;
  weighingTime?: Date;
  approvalTime?: Date;
  completionTime?: Date;
  totalProcessingMinutes?: number;

  // Status
  status: GateTransactionStatus;
  statusHistory: GateStatusChange[];

  // Approval
  approvedBy?: string;
  rejectionReason?: string;

  // Notes
  remarks?: string;
}

export interface GateTransactionContainer {
  containerId?: UUID;
  containerNumber: string;
  containerSize: ContainerSize;
  operation: 'in' | 'out';
  status: 'pending' | 'processed' | 'rejected';
  sealNumber?: string;
  condition?: ContainerCondition;
}

export interface GateStatusChange {
  status: GateTransactionStatus;
  timestamp: Date;
  changedBy?: string;
  reason?: string;
}

// ============================================================================
// OCR INTEGRATION
// ============================================================================

export interface OCRCapture {
  id: UUID;
  transactionId: UUID;
  captureTime: Date;

  // License plate
  licensePlate?: string;
  licensePlateConfidence: number;    // 0-100
  licensePlateImageUrl?: string;

  // Container number
  containerNumber?: string;
  containerConfidence: number;       // 0-100
  containerImageUrl?: string;

  // ISO type
  isoType?: string;
  isoTypeConfidence?: number;

  // Additional
  sealNumber?: string;
  sealConfidence?: number;

  // Validation
  isValidated: boolean;
  validatedBy?: string;
  validationTime?: Date;
  corrections?: {
    field: string;
    original: string;
    corrected: string;
  }[];

  // Raw data
  rawResponse?: Record<string, unknown>;
}

export interface OCRDevice {
  id: UUID;
  deviceId: string;
  name: string;
  manufacturer: string;
  model: string;

  // Location
  gateId: UUID;
  laneId: UUID;
  position: 'entry' | 'exit' | 'overhead' | 'side';

  // Configuration
  captureMode: 'automatic' | 'manual' | 'both';
  recognitionTypes: ('license_plate' | 'container' | 'iso_code' | 'seal')[];

  // Performance
  averageConfidence?: number;
  capturesPerDay?: number;
  errorRate?: number;

  status: 'online' | 'offline' | 'error' | 'maintenance';
  lastCaptureTime?: Date;
  lastHealthCheck?: Date;
}

// ============================================================================
// RFID INTEGRATION
// ============================================================================

export interface RFIDCapture {
  id: UUID;
  transactionId: UUID;
  captureTime: Date;

  // Tag data
  tagId: string;
  tagType: 'vehicle' | 'container' | 'driver' | 'seal';
  epcData?: string;                  // Electronic Product Code

  // Association
  vehicleNumber?: string;
  containerNumber?: string;
  driverId?: string;

  // Reader info
  readerId: string;
  readerLocation: string;
  antennaId?: string;

  // Signal
  signalStrength?: number;           // dBm
  readCount?: number;

  // Validation
  isRegistered: boolean;
  isValid: boolean;
  validationMessage?: string;
}

export interface RFIDReader {
  id: UUID;
  readerId: string;
  name: string;
  manufacturer: string;
  model: string;

  // Location
  gateId: UUID;
  laneId?: UUID;
  position: 'portal' | 'handheld' | 'fixed';

  // Configuration
  frequency: string;                 // UHF, HF
  readRange: number;                 // meters
  antennaCount: number;

  // Status
  status: 'online' | 'offline' | 'error' | 'maintenance';
  lastReadTime?: Date;
  lastHealthCheck?: Date;

  readsPerDay?: number;
}

// ============================================================================
// WEIGHBRIDGE
// ============================================================================

export interface WeighbridgeCapture {
  id: UUID;
  transactionId: UUID;
  captureTime: Date;

  // Weight readings
  grossWeight: number;               // kg
  tareWeight?: number;               // kg
  netWeight?: number;                // kg

  // Readings
  firstReading: number;
  secondReading?: number;
  finalReading: number;

  // Stability
  isStable: boolean;
  stabilizationTime?: number;        // seconds

  // Weighbridge info
  weighbridgeId: string;
  weighbridgeName: string;
  calibrationDate?: Date;
  maxCapacity: number;               // kg

  // Ticket
  ticketNumber?: string;
  ticketPrinted: boolean;

  // Validation
  isWithinTolerance: boolean;
  tolerancePercent?: number;

  // Operator
  operatorId?: string;
  operatorName?: string;
}

// ============================================================================
// PHOTOS
// ============================================================================

export type GatePhotoType =
  | 'front'
  | 'rear'
  | 'left'
  | 'right'
  | 'container_front'
  | 'container_rear'
  | 'seal'
  | 'damage'
  | 'license_plate'
  | 'driver'
  | 'documents'
  | 'other';

export interface GatePhoto {
  id: UUID;
  transactionId: UUID;
  photoType: GatePhotoType;
  captureTime: Date;

  // Image
  imageUrl: string;
  thumbnailUrl?: string;

  // Metadata
  cameraId?: string;
  cameraLocation?: string;

  // Annotations
  annotations?: string[];

  // Auto captured vs manual
  isAutoCapture: boolean;
}

// ============================================================================
// INSPECTION
// ============================================================================

export type InspectionType =
  | 'visual'
  | 'document'
  | 'seal'
  | 'damage'
  | 'customs'
  | 'security';

export interface InspectionResult {
  inspectedAt: Date;
  inspectedBy: string;
  inspectionType: InspectionType[];

  // Results
  passed: boolean;
  failureReasons?: string[];

  // Checklist
  checklist: InspectionCheckItem[];

  // Damage
  damageFound: boolean;
  damageDetails?: {
    location: string;
    type: string;
    severity: 'minor' | 'moderate' | 'severe';
    photos?: string[];
  }[];

  // Notes
  remarks?: string;
}

export interface InspectionCheckItem {
  item: string;
  category: string;
  result: 'pass' | 'fail' | 'na';
  notes?: string;
}

// ============================================================================
// QUEUE MANAGEMENT
// ============================================================================

export interface GateQueue {
  gateId: UUID;
  timestamp: Date;

  // Summary
  totalVehicles: number;
  averageWaitTime: number;           // minutes
  estimatedThroughput: number;       // vehicles per hour

  // By lane
  laneQueues: LaneQueue[];

  // Alerts
  isHighVolume: boolean;
  isCongested: boolean;
}

export interface LaneQueue {
  laneId: UUID;
  laneNumber: string;
  laneType: GateLaneType;

  vehiclesWaiting: number;
  averageWaitMinutes: number;
  currentProcessingTime?: number;

  // Queue items
  queue: QueueItem[];
}

export interface QueueItem {
  transactionId?: UUID;
  appointmentId?: UUID;
  truckNumber: string;
  driverName?: string;
  containerNumber?: string;
  arrivalTime: Date;
  waitingMinutes: number;
  priority: number;
  hasAppointment: boolean;
}

// ============================================================================
// GATE METRICS
// ============================================================================

export interface GateMetrics {
  gateId: UUID;
  date: Date;

  // Volume
  totalTransactions: number;
  gateInCount: number;
  gateOutCount: number;
  peakHourVolume: number;
  peakHour: number;                  // 0-23

  // Timing
  averageProcessingMinutes: number;
  minProcessingMinutes: number;
  maxProcessingMinutes: number;

  // Queue
  averageQueueLength: number;
  maxQueueLength: number;
  averageWaitMinutes: number;
  maxWaitMinutes: number;

  // Appointments
  appointmentCount: number;
  appointmentOnTimePercent: number;
  noShowCount: number;

  // Issues
  rejectedCount: number;
  rejectionReasons: Record<string, number>;

  // OCR
  ocrCaptureCount: number;
  ocrSuccessRate: number;

  // By hour
  hourlyVolume: Record<number, number>;
}
