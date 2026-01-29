// =============================================================================
// ankrICD - Hardware Integration Types
// =============================================================================
// Types for RFID readers, OCR cameras, weighbridges, barcode/QR scanners,
// and label/document printers.
// =============================================================================

import type { UUID, TenantEntity } from './common';

// =============================================================================
// HARDWARE DEVICE (Base)
// =============================================================================

export type DeviceType = 'rfid_reader' | 'ocr_camera' | 'weighbridge' | 'barcode_scanner' | 'qr_scanner' | 'label_printer' | 'document_printer';
export type DeviceStatus = 'online' | 'offline' | 'error' | 'maintenance' | 'calibrating';

export interface HardwareDevice extends TenantEntity {
  id: UUID;
  deviceCode: string;
  deviceType: DeviceType;
  name: string;
  status: DeviceStatus;
  facilityId: UUID;

  // Location
  locationId?: string; // gate, yard block, etc.
  locationDescription?: string;
  gateId?: UUID;
  laneId?: UUID;

  // Connection
  ipAddress?: string;
  port?: number;
  protocol?: 'tcp' | 'udp' | 'http' | 'mqtt' | 'modbus' | 'serial';
  serialPort?: string;
  baudRate?: number;

  // Device info
  manufacturer?: string;
  model?: string;
  firmwareVersion?: string;
  serialNumber?: string;

  // Monitoring
  lastHeartbeat?: Date;
  lastReadTime?: Date;
  totalReads: number;
  errorCount: number;
  uptimePercent?: number;

  // Calibration
  lastCalibrationDate?: Date;
  nextCalibrationDue?: Date;
  calibrationCertificate?: string;

  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// RFID
// =============================================================================

export type RFIDTagType = 'container' | 'vehicle' | 'equipment' | 'personnel' | 'seal';
export type RFIDFrequency = 'lf' | 'hf' | 'uhf' | 'shf'; // 125kHz, 13.56MHz, 860-960MHz, 2.4GHz

export interface RFIDRead {
  id: UUID;
  deviceId: UUID;
  tagId: string;
  tagType: RFIDTagType;
  frequency?: RFIDFrequency;
  rssi?: number; // signal strength dBm
  antennaPort?: number;
  readTime: Date;

  // Resolved entity
  entityType?: 'container' | 'truck' | 'equipment' | 'person';
  entityId?: UUID;
  entityNumber?: string;

  // Gate context
  gateId?: UUID;
  laneId?: UUID;
  direction?: 'in' | 'out';

  metadata?: Record<string, unknown>;
}

export interface RFIDTagRegistration {
  tagId: string;
  tagType: RFIDTagType;
  entityType: string;
  entityId: UUID;
  entityNumber: string;
  isActive: boolean;
  registeredAt: Date;
}

// =============================================================================
// OCR (Optical Character Recognition)
// =============================================================================

export type OCRCaptureType = 'container_number' | 'license_plate' | 'iso_code' | 'seal_number' | 'chassis_number';

export interface OCRRead {
  id: UUID;
  deviceId: UUID;
  captureType: OCRCaptureType;
  capturedText: string;
  confidence: number; // 0-100
  readTime: Date;

  // Image
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  boundingBox?: { x: number; y: number; width: number; height: number };

  // Validation
  validated: boolean;
  validatedText?: string;
  validatedBy?: string;
  validatedAt?: Date;

  // Context
  gateId?: UUID;
  laneId?: UUID;
  transactionId?: UUID;

  metadata?: Record<string, unknown>;
}

// =============================================================================
// WEIGHBRIDGE
// =============================================================================

export type WeighbridgeReadType = 'gross' | 'tare' | 'net';

export interface WeighbridgeRead {
  id: UUID;
  deviceId: UUID;
  readType: WeighbridgeReadType;
  weight: number; // kg
  unit: 'kg' | 'mt' | 'lb';
  stable: boolean;
  readTime: Date;

  // Vehicle
  vehicleNumber?: string;
  containerNumber?: string;

  // Transaction
  transactionId?: UUID;
  gateId?: UUID;

  // Overweight check
  maxAllowed?: number;
  overweight: boolean;
  overweightAmount?: number;

  // Calibration
  calibrationValid: boolean;
  zeroDrift?: number;

  metadata?: Record<string, unknown>;
}

// =============================================================================
// BARCODE / QR SCANNER
// =============================================================================

export type ScanType = 'barcode_1d' | 'barcode_2d' | 'qr' | 'datamatrix';
export type BarcodeFormat = 'code128' | 'code39' | 'ean13' | 'upc' | 'itf' | 'qr' | 'datamatrix' | 'pdf417';

export interface ScanRead {
  id: UUID;
  deviceId: UUID;
  scanType: ScanType;
  format?: BarcodeFormat;
  data: string;
  readTime: Date;

  // Context
  entityType?: string;
  entityId?: UUID;
  operationId?: UUID;

  metadata?: Record<string, unknown>;
}

// =============================================================================
// PRINTER
// =============================================================================

export type PrintJobType = 'container_label' | 'gate_pass' | 'delivery_order' | 'invoice' | 'manifest' | 'tally_sheet' | 'seal_label' | 'yard_map' | 'other';
export type PrintJobStatus = 'queued' | 'printing' | 'completed' | 'failed' | 'cancelled';

export interface PrintJob {
  id: UUID;
  deviceId: UUID;
  jobType: PrintJobType;
  status: PrintJobStatus;

  // Content
  templateId?: string;
  data?: Record<string, unknown>;
  documentUrl?: string;

  // Output
  copies: number;
  pageSize?: string;
  orientation?: 'portrait' | 'landscape';

  // Status
  queuedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  printedBy?: string;

  metadata?: Record<string, unknown>;
}

// =============================================================================
// HARDWARE STATS
// =============================================================================

export interface HardwareStats {
  date: Date;
  totalDevices: number;
  online: number;
  offline: number;
  error: number;
  byType: Record<DeviceType, { total: number; online: number; offline: number }>;
  rfid: {
    totalReads: number;
    readRate: number; // reads per hour
    avgConfidence: number;
  };
  ocr: {
    totalCaptures: number;
    avgConfidence: number;
    validationRate: number;
  };
  weighbridge: {
    totalWeighs: number;
    overweightDetections: number;
  };
  printers: {
    totalJobs: number;
    completed: number;
    failed: number;
  };
}
