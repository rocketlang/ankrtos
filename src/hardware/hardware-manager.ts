// =============================================================================
// ankrICD - Hardware Manager
// =============================================================================
// Manages RFID readers, OCR cameras, weighbridges, barcode/QR scanners,
// and label/document printers.
// =============================================================================

import type { UUID, OperationResult } from '../types/common';
import type {
  HardwareDevice,
  DeviceType,
  DeviceStatus,
  RFIDRead,
  RFIDTagRegistration,
  OCRRead,
  WeighbridgeRead,
  ScanRead,
  PrintJob,
  PrintJobType,
  HardwareStats,
} from '../types/hardware';
import { emit } from '../core/event-bus';

// =============================================================================
// INPUT TYPES
// =============================================================================

export interface RegisterDeviceInput {
  tenantId: string;
  facilityId: UUID;
  deviceType: DeviceType;
  deviceCode: string;
  name: string;
  locationId?: string;
  locationDescription?: string;
  gateId?: UUID;
  laneId?: UUID;
  ipAddress?: string;
  port?: number;
  protocol?: HardwareDevice['protocol'];
  serialPort?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
}

export interface RecordRFIDInput {
  deviceId: UUID;
  tagId: string;
  tagType: RFIDRead['tagType'];
  rssi?: number;
  antennaPort?: number;
  gateId?: UUID;
  laneId?: UUID;
  direction?: 'in' | 'out';
}

export interface RecordOCRInput {
  deviceId: UUID;
  captureType: OCRRead['captureType'];
  capturedText: string;
  confidence: number;
  imageUrl?: string;
  gateId?: UUID;
  laneId?: UUID;
  transactionId?: UUID;
}

export interface RecordWeighInput {
  deviceId: UUID;
  readType: WeighbridgeRead['readType'];
  weight: number;
  unit?: 'kg' | 'mt' | 'lb';
  vehicleNumber?: string;
  containerNumber?: string;
  transactionId?: UUID;
  gateId?: UUID;
  maxAllowed?: number;
}

export interface RecordScanInput {
  deviceId: UUID;
  scanType: ScanRead['scanType'];
  format?: ScanRead['format'];
  data: string;
  entityType?: string;
  entityId?: UUID;
  operationId?: UUID;
}

export interface CreatePrintJobInput {
  deviceId: UUID;
  jobType: PrintJobType;
  templateId?: string;
  data?: Record<string, unknown>;
  documentUrl?: string;
  copies?: number;
  pageSize?: string;
  orientation?: 'portrait' | 'landscape';
  printedBy?: string;
}

export interface DeviceQueryOptions {
  tenantId?: string;
  facilityId?: UUID;
  deviceType?: DeviceType;
  status?: DeviceStatus;
  gateId?: UUID;
}

// =============================================================================
// HELPERS
// =============================================================================

let counter = 0;
function nextId(): UUID {
  return `hw-${Date.now()}-${++counter}`;
}

// =============================================================================
// HARDWARE MANAGER
// =============================================================================

export class HardwareManager {
  private devices = new Map<UUID, HardwareDevice>();
  private rfidReads = new Map<UUID, RFIDRead>();
  private rfidTags = new Map<string, RFIDTagRegistration>();
  private ocrReads = new Map<UUID, OCRRead>();
  private weighbridgeReads = new Map<UUID, WeighbridgeRead>();
  private scanReads = new Map<UUID, ScanRead>();
  private printJobs = new Map<UUID, PrintJob>();

  // ===========================================================================
  // DEVICE MANAGEMENT
  // ===========================================================================

  registerDevice(input: RegisterDeviceInput): OperationResult<HardwareDevice> {
    const existing = [...this.devices.values()].find(
      (d) => d.deviceCode === input.deviceCode && d.facilityId === input.facilityId,
    );
    if (existing) return { success: false, error: 'Device code already exists', errorCode: 'DUPLICATE' };

    const id = nextId();
    const device: HardwareDevice = {
      id,
      tenantId: input.tenantId,
      deviceCode: input.deviceCode,
      deviceType: input.deviceType,
      name: input.name,
      status: 'offline',
      facilityId: input.facilityId,
      locationId: input.locationId,
      locationDescription: input.locationDescription,
      gateId: input.gateId,
      laneId: input.laneId,
      ipAddress: input.ipAddress,
      port: input.port,
      protocol: input.protocol,
      serialPort: input.serialPort,
      manufacturer: input.manufacturer,
      model: input.model,
      serialNumber: input.serialNumber,
      totalReads: 0,
      errorCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.devices.set(id, device);
    return { success: true, data: device };
  }

  getDevice(id: UUID): HardwareDevice | undefined {
    return this.devices.get(id);
  }

  listDevices(options?: DeviceQueryOptions): HardwareDevice[] {
    let list = [...this.devices.values()];
    if (options?.tenantId) list = list.filter((d) => d.tenantId === options.tenantId);
    if (options?.facilityId) list = list.filter((d) => d.facilityId === options.facilityId);
    if (options?.deviceType) list = list.filter((d) => d.deviceType === options.deviceType);
    if (options?.status) list = list.filter((d) => d.status === options.status);
    if (options?.gateId) list = list.filter((d) => d.gateId === options.gateId);
    return list;
  }

  updateDeviceStatus(deviceId: UUID, status: DeviceStatus): OperationResult<HardwareDevice> {
    const device = this.devices.get(deviceId);
    if (!device) return { success: false, error: 'Device not found', errorCode: 'NOT_FOUND' };
    device.status = status;
    if (status === 'online') device.lastHeartbeat = new Date();
    device.updatedAt = new Date();
    return { success: true, data: device };
  }

  heartbeat(deviceId: UUID): OperationResult<HardwareDevice> {
    const device = this.devices.get(deviceId);
    if (!device) return { success: false, error: 'Device not found', errorCode: 'NOT_FOUND' };
    device.lastHeartbeat = new Date();
    if (device.status === 'offline') device.status = 'online';
    device.updatedAt = new Date();
    return { success: true, data: device };
  }

  // ===========================================================================
  // RFID
  // ===========================================================================

  registerRFIDTag(tagId: string, tagType: RFIDRead['tagType'], entityType: string, entityId: UUID, entityNumber: string): OperationResult<RFIDTagRegistration> {
    const reg: RFIDTagRegistration = {
      tagId,
      tagType,
      entityType,
      entityId,
      entityNumber,
      isActive: true,
      registeredAt: new Date(),
    };
    this.rfidTags.set(tagId, reg);
    return { success: true, data: reg };
  }

  recordRFIDRead(input: RecordRFIDInput): OperationResult<RFIDRead> {
    const device = this.devices.get(input.deviceId);
    if (!device) return { success: false, error: 'Device not found', errorCode: 'NOT_FOUND' };

    const tag = this.rfidTags.get(input.tagId);
    const id = nextId();
    const read: RFIDRead = {
      id,
      deviceId: input.deviceId,
      tagId: input.tagId,
      tagType: input.tagType,
      rssi: input.rssi,
      antennaPort: input.antennaPort,
      readTime: new Date(),
      entityType: tag?.entityType as any,
      entityId: tag?.entityId,
      entityNumber: tag?.entityNumber,
      gateId: input.gateId,
      laneId: input.laneId,
      direction: input.direction,
    };

    this.rfidReads.set(id, read);
    device.totalReads++;
    device.lastReadTime = new Date();

    emit(
      'gate.rfid_detected' as any,
      {
        deviceId: input.deviceId,
        tagId: input.tagId,
        entityNumber: tag?.entityNumber,
        direction: input.direction,
      },
      { tenantId: device.tenantId },
    );

    return { success: true, data: read };
  }

  getRecentRFIDReads(deviceId: UUID, limit?: number): RFIDRead[] {
    const reads = [...this.rfidReads.values()]
      .filter((r) => r.deviceId === deviceId)
      .sort((a, b) => b.readTime.getTime() - a.readTime.getTime());
    return reads.slice(0, limit ?? 50);
  }

  // ===========================================================================
  // OCR
  // ===========================================================================

  recordOCRRead(input: RecordOCRInput): OperationResult<OCRRead> {
    const device = this.devices.get(input.deviceId);
    if (!device) return { success: false, error: 'Device not found', errorCode: 'NOT_FOUND' };

    const id = nextId();
    const read: OCRRead = {
      id,
      deviceId: input.deviceId,
      captureType: input.captureType,
      capturedText: input.capturedText,
      confidence: input.confidence,
      readTime: new Date(),
      imageUrl: input.imageUrl,
      validated: false,
      gateId: input.gateId,
      laneId: input.laneId,
      transactionId: input.transactionId,
    };

    this.ocrReads.set(id, read);
    device.totalReads++;
    device.lastReadTime = new Date();

    emit(
      'gate.ocr_captured' as any,
      {
        deviceId: input.deviceId,
        captureType: input.captureType,
        capturedText: input.capturedText,
        confidence: input.confidence,
      },
      { tenantId: device.tenantId },
    );

    return { success: true, data: read };
  }

  validateOCR(readId: UUID, validatedText: string, validatedBy: string): OperationResult<OCRRead> {
    const read = this.ocrReads.get(readId);
    if (!read) return { success: false, error: 'OCR read not found', errorCode: 'NOT_FOUND' };
    read.validated = true;
    read.validatedText = validatedText;
    read.validatedBy = validatedBy;
    read.validatedAt = new Date();
    return { success: true, data: read };
  }

  // ===========================================================================
  // WEIGHBRIDGE
  // ===========================================================================

  recordWeigh(input: RecordWeighInput): OperationResult<WeighbridgeRead> {
    const device = this.devices.get(input.deviceId);
    if (!device) return { success: false, error: 'Device not found', errorCode: 'NOT_FOUND' };

    const id = nextId();
    const overweight = input.maxAllowed !== undefined && input.weight > input.maxAllowed;

    const read: WeighbridgeRead = {
      id,
      deviceId: input.deviceId,
      readType: input.readType,
      weight: input.weight,
      unit: input.unit ?? 'kg',
      stable: true,
      readTime: new Date(),
      vehicleNumber: input.vehicleNumber,
      containerNumber: input.containerNumber,
      transactionId: input.transactionId,
      gateId: input.gateId,
      maxAllowed: input.maxAllowed,
      overweight,
      overweightAmount: overweight ? input.weight - (input.maxAllowed ?? 0) : undefined,
      calibrationValid: true,
    };

    this.weighbridgeReads.set(id, read);
    device.totalReads++;
    device.lastReadTime = new Date();

    if (overweight) {
      emit(
        'gate.overweight_detected' as any,
        {
          deviceId: input.deviceId,
          vehicleNumber: input.vehicleNumber,
          weight: input.weight,
          maxAllowed: input.maxAllowed,
          excess: read.overweightAmount,
        },
        { tenantId: device.tenantId },
      );
    }

    return { success: true, data: read };
  }

  getWeighbridgeReads(deviceId: UUID, limit?: number): WeighbridgeRead[] {
    const reads = [...this.weighbridgeReads.values()]
      .filter((r) => r.deviceId === deviceId)
      .sort((a, b) => b.readTime.getTime() - a.readTime.getTime());
    return reads.slice(0, limit ?? 50);
  }

  // ===========================================================================
  // SCANNER
  // ===========================================================================

  recordScan(input: RecordScanInput): OperationResult<ScanRead> {
    const device = this.devices.get(input.deviceId);
    if (!device) return { success: false, error: 'Device not found', errorCode: 'NOT_FOUND' };

    const id = nextId();
    const read: ScanRead = {
      id,
      deviceId: input.deviceId,
      scanType: input.scanType,
      format: input.format,
      data: input.data,
      readTime: new Date(),
      entityType: input.entityType,
      entityId: input.entityId,
      operationId: input.operationId,
    };

    this.scanReads.set(id, read);
    device.totalReads++;
    device.lastReadTime = new Date();

    return { success: true, data: read };
  }

  // ===========================================================================
  // PRINTER
  // ===========================================================================

  createPrintJob(input: CreatePrintJobInput): OperationResult<PrintJob> {
    const device = this.devices.get(input.deviceId);
    if (!device) return { success: false, error: 'Printer not found', errorCode: 'NOT_FOUND' };
    if (device.deviceType !== 'label_printer' && device.deviceType !== 'document_printer') {
      return { success: false, error: 'Device is not a printer', errorCode: 'INVALID_DEVICE' };
    }

    const id = nextId();
    const job: PrintJob = {
      id,
      deviceId: input.deviceId,
      jobType: input.jobType,
      status: 'queued',
      templateId: input.templateId,
      data: input.data,
      documentUrl: input.documentUrl,
      copies: input.copies ?? 1,
      pageSize: input.pageSize,
      orientation: input.orientation,
      queuedAt: new Date(),
      printedBy: input.printedBy,
    };

    this.printJobs.set(id, job);

    // Simulate print completion
    job.status = 'completed';
    job.startedAt = new Date();
    job.completedAt = new Date();

    return { success: true, data: job };
  }

  getPrintJob(id: UUID): PrintJob | undefined {
    return this.printJobs.get(id);
  }

  // ===========================================================================
  // STATS
  // ===========================================================================

  getHardwareStats(tenantId: string): HardwareStats {
    const devices = [...this.devices.values()].filter((d) => d.tenantId === tenantId);

    const byType: Record<string, { total: number; online: number; offline: number }> = {};
    for (const d of devices) {
      if (!byType[d.deviceType]) byType[d.deviceType] = { total: 0, online: 0, offline: 0 };
      const entry = byType[d.deviceType]!;
      entry.total++;
      if (d.status === 'online') entry.online++;
      else entry.offline++;
    }

    const rfidReads = [...this.rfidReads.values()];
    const ocrReads = [...this.ocrReads.values()];
    const weighReads = [...this.weighbridgeReads.values()];
    const prints = [...this.printJobs.values()];

    const validatedOCR = ocrReads.filter((o) => o.validated);

    return {
      date: new Date(),
      totalDevices: devices.length,
      online: devices.filter((d) => d.status === 'online').length,
      offline: devices.filter((d) => d.status === 'offline').length,
      error: devices.filter((d) => d.status === 'error').length,
      byType: byType as any,
      rfid: {
        totalReads: rfidReads.length,
        readRate: rfidReads.length, // simplified
        avgConfidence: 0, // RFID doesn't have confidence
      },
      ocr: {
        totalCaptures: ocrReads.length,
        avgConfidence: ocrReads.length > 0
          ? Math.round(ocrReads.reduce((s, o) => s + o.confidence, 0) / ocrReads.length)
          : 0,
        validationRate: ocrReads.length > 0
          ? Math.round((validatedOCR.length / ocrReads.length) * 100)
          : 0,
      },
      weighbridge: {
        totalWeighs: weighReads.length,
        overweightDetections: weighReads.filter((w) => w.overweight).length,
      },
      printers: {
        totalJobs: prints.length,
        completed: prints.filter((p) => p.status === 'completed').length,
        failed: prints.filter((p) => p.status === 'failed').length,
      },
    };
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let instance: HardwareManager | null = null;

export function getHardwareManager(): HardwareManager {
  if (!instance) instance = new HardwareManager();
  return instance;
}

export function setHardwareManager(manager: HardwareManager): void {
  instance = manager;
}
