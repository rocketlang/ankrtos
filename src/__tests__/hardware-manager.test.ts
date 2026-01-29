import { describe, it, expect, beforeEach } from 'vitest';
import { HardwareManager } from '../hardware/hardware-manager';
import type {
  RegisterDeviceInput,
  RecordRFIDInput,
  RecordOCRInput,
  RecordWeighInput,
  RecordScanInput,
  CreatePrintJobInput,
} from '../hardware/hardware-manager';
import { uuid, TENANT_ID, FACILITY_ID } from './test-utils';

// =============================================================================
// Factories
// =============================================================================

function makeDeviceInput(overrides: Partial<RegisterDeviceInput> = {}): RegisterDeviceInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    deviceType: 'rfid_reader',
    deviceCode: `RFID-GATE-${uuid().slice(0, 6)}`,
    name: 'Gate 1 RFID Reader',
    ipAddress: '192.168.1.100',
    port: 8080,
    protocol: 'tcp',
    manufacturer: 'Impinj',
    model: 'R700',
    serialNumber: 'SN001',
    ...overrides,
  };
}

function registerDevice(mgr: HardwareManager, overrides: Partial<RegisterDeviceInput> = {}) {
  const res = mgr.registerDevice(makeDeviceInput(overrides));
  expect(res.success).toBe(true);
  return res.data!;
}

function registerPrinter(mgr: HardwareManager, overrides: Partial<RegisterDeviceInput> = {}) {
  return registerDevice(mgr, {
    deviceType: 'label_printer',
    deviceCode: `LBL-${uuid().slice(0, 6)}`,
    name: 'Label Printer 1',
    ...overrides,
  });
}

// =============================================================================
// Tests
// =============================================================================

describe('HardwareManager', () => {
  let mgr: HardwareManager;

  beforeEach(() => {
    mgr = new HardwareManager();
  });

  // ===========================================================================
  // 1. Device Management
  // ===========================================================================

  describe('Device Management', () => {
    it('registers a device successfully', () => {
      const res = mgr.registerDevice(makeDeviceInput());
      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      expect(res.data!.deviceType).toBe('rfid_reader');
      expect(res.data!.status).toBe('offline');
      expect(res.data!.totalReads).toBe(0);
      expect(res.data!.errorCount).toBe(0);
    });

    it('assigns correct metadata on registration', () => {
      const device = registerDevice(mgr);
      expect(device.tenantId).toBe(TENANT_ID);
      expect(device.facilityId).toBe(FACILITY_ID);
      expect(device.manufacturer).toBe('Impinj');
      expect(device.model).toBe('R700');
      expect(device.serialNumber).toBe('SN001');
      expect(device.ipAddress).toBe('192.168.1.100');
      expect(device.port).toBe(8080);
      expect(device.protocol).toBe('tcp');
      expect(device.createdAt).toBeInstanceOf(Date);
      expect(device.updatedAt).toBeInstanceOf(Date);
    });

    it('retrieves a device by id', () => {
      const device = registerDevice(mgr);
      const found = mgr.getDevice(device.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(device.id);
      expect(found!.name).toBe('Gate 1 RFID Reader');
    });

    it('returns undefined for unknown device id', () => {
      expect(mgr.getDevice(uuid())).toBeUndefined();
    });

    it('rejects duplicate device codes within the same facility', () => {
      const code = `DUP-${uuid().slice(0, 6)}`;
      mgr.registerDevice(makeDeviceInput({ deviceCode: code }));
      const dup = mgr.registerDevice(makeDeviceInput({ deviceCode: code }));
      expect(dup.success).toBe(false);
      expect(dup.errorCode).toBe('DUPLICATE');
    });

    it('allows same device code in different facilities', () => {
      const code = 'SHARED-CODE-01';
      const r1 = mgr.registerDevice(makeDeviceInput({ deviceCode: code, facilityId: uuid() }));
      const r2 = mgr.registerDevice(makeDeviceInput({ deviceCode: code, facilityId: uuid() }));
      expect(r1.success).toBe(true);
      expect(r2.success).toBe(true);
    });

    it('lists devices with no filter', () => {
      registerDevice(mgr);
      registerDevice(mgr);
      const list = mgr.listDevices();
      expect(list.length).toBeGreaterThanOrEqual(2);
    });

    it('filters devices by tenantId', () => {
      registerDevice(mgr, { tenantId: 'tenant-A' });
      registerDevice(mgr, { tenantId: 'tenant-B' });
      expect(mgr.listDevices({ tenantId: 'tenant-A' }).length).toBe(1);
    });

    it('filters devices by deviceType', () => {
      registerDevice(mgr, { deviceType: 'rfid_reader' });
      registerDevice(mgr, { deviceType: 'ocr_camera' });
      registerDevice(mgr, { deviceType: 'rfid_reader' });
      expect(mgr.listDevices({ deviceType: 'rfid_reader' }).length).toBe(2);
    });

    it('filters devices by status', () => {
      const d = registerDevice(mgr);
      mgr.updateDeviceStatus(d.id, 'online');
      registerDevice(mgr); // stays offline
      expect(mgr.listDevices({ status: 'online' }).length).toBe(1);
    });

    it('filters devices by facilityId', () => {
      const fid = uuid();
      registerDevice(mgr, { facilityId: fid });
      registerDevice(mgr); // default FACILITY_ID
      expect(mgr.listDevices({ facilityId: fid }).length).toBe(1);
    });

    it('updates device status successfully', () => {
      const device = registerDevice(mgr);
      const res = mgr.updateDeviceStatus(device.id, 'online');
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('online');
      expect(res.data!.lastHeartbeat).toBeInstanceOf(Date);
    });

    it('sets lastHeartbeat when status goes online', () => {
      const device = registerDevice(mgr);
      expect(device.lastHeartbeat).toBeUndefined();
      mgr.updateDeviceStatus(device.id, 'online');
      expect(mgr.getDevice(device.id)!.lastHeartbeat).toBeInstanceOf(Date);
    });

    it('does not set lastHeartbeat when status goes to error', () => {
      const device = registerDevice(mgr);
      mgr.updateDeviceStatus(device.id, 'error');
      expect(mgr.getDevice(device.id)!.lastHeartbeat).toBeUndefined();
    });

    it('returns NOT_FOUND when updating unknown device status', () => {
      const res = mgr.updateDeviceStatus(uuid(), 'online');
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('NOT_FOUND');
    });

    it('records heartbeat and brings offline device online', () => {
      const device = registerDevice(mgr);
      expect(device.status).toBe('offline');
      const res = mgr.heartbeat(device.id);
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('online');
      expect(res.data!.lastHeartbeat).toBeInstanceOf(Date);
    });

    it('heartbeat keeps an already-online device online', () => {
      const device = registerDevice(mgr);
      mgr.updateDeviceStatus(device.id, 'online');
      const res = mgr.heartbeat(device.id);
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('online');
    });

    it('returns NOT_FOUND for heartbeat on unknown device', () => {
      const res = mgr.heartbeat(uuid());
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('NOT_FOUND');
    });
  });

  // ===========================================================================
  // 2. RFID
  // ===========================================================================

  describe('RFID', () => {
    it('registers an RFID tag successfully', () => {
      const tagId = 'E20068060000001234567890';
      const res = mgr.registerRFIDTag(tagId, 'container', 'container', uuid(), 'MSCU1234567');
      expect(res.success).toBe(true);
      expect(res.data!.tagId).toBe(tagId);
      expect(res.data!.tagType).toBe('container');
      expect(res.data!.isActive).toBe(true);
      expect(res.data!.registeredAt).toBeInstanceOf(Date);
    });

    it('records an RFID read with entity resolution from registered tag', () => {
      const device = registerDevice(mgr, { deviceType: 'rfid_reader' });
      const entityId = uuid();
      const tagId = 'E20068060000001234567890';
      mgr.registerRFIDTag(tagId, 'container', 'container', entityId, 'MSCU1234567');

      const res = mgr.recordRFIDRead({
        deviceId: device.id,
        tagId,
        tagType: 'container',
        rssi: -45,
        antennaPort: 1,
        direction: 'in',
      });

      expect(res.success).toBe(true);
      expect(res.data!.tagId).toBe(tagId);
      expect(res.data!.entityType).toBe('container');
      expect(res.data!.entityId).toBe(entityId);
      expect(res.data!.entityNumber).toBe('MSCU1234567');
      expect(res.data!.rssi).toBe(-45);
      expect(res.data!.antennaPort).toBe(1);
      expect(res.data!.direction).toBe('in');
    });

    it('records an RFID read without tag registration (no entity resolution)', () => {
      const device = registerDevice(mgr, { deviceType: 'rfid_reader' });
      const res = mgr.recordRFIDRead({
        deviceId: device.id,
        tagId: 'UNKNOWN-TAG-XYZ',
        tagType: 'vehicle',
      });

      expect(res.success).toBe(true);
      expect(res.data!.entityType).toBeUndefined();
      expect(res.data!.entityId).toBeUndefined();
      expect(res.data!.entityNumber).toBeUndefined();
    });

    it('increments totalReads on the device after RFID read', () => {
      const device = registerDevice(mgr);
      mgr.recordRFIDRead({ deviceId: device.id, tagId: 'TAG-001', tagType: 'container' });
      mgr.recordRFIDRead({ deviceId: device.id, tagId: 'TAG-002', tagType: 'vehicle' });
      expect(mgr.getDevice(device.id)!.totalReads).toBe(2);
    });

    it('sets lastReadTime on the device after RFID read', () => {
      const device = registerDevice(mgr);
      expect(device.lastReadTime).toBeUndefined();
      mgr.recordRFIDRead({ deviceId: device.id, tagId: 'TAG-001', tagType: 'container' });
      expect(mgr.getDevice(device.id)!.lastReadTime).toBeInstanceOf(Date);
    });

    it('returns NOT_FOUND when recording RFID read for unknown device', () => {
      const res = mgr.recordRFIDRead({
        deviceId: uuid(),
        tagId: 'TAG-001',
        tagType: 'container',
      });
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('NOT_FOUND');
    });

    it('retrieves recent RFID reads for a device', () => {
      const device = registerDevice(mgr);
      mgr.recordRFIDRead({ deviceId: device.id, tagId: 'TAG-A', tagType: 'container' });
      mgr.recordRFIDRead({ deviceId: device.id, tagId: 'TAG-B', tagType: 'vehicle' });
      mgr.recordRFIDRead({ deviceId: device.id, tagId: 'TAG-C', tagType: 'equipment' });

      const reads = mgr.getRecentRFIDReads(device.id);
      expect(reads.length).toBe(3);
    });

    it('limits recent RFID reads with limit parameter', () => {
      const device = registerDevice(mgr);
      for (let i = 0; i < 10; i++) {
        mgr.recordRFIDRead({ deviceId: device.id, tagId: `TAG-${i}`, tagType: 'container' });
      }

      const reads = mgr.getRecentRFIDReads(device.id, 3);
      expect(reads.length).toBe(3);
    });

    it('returns only reads for the specified device', () => {
      const d1 = registerDevice(mgr);
      const d2 = registerDevice(mgr);
      mgr.recordRFIDRead({ deviceId: d1.id, tagId: 'TAG-D1', tagType: 'container' });
      mgr.recordRFIDRead({ deviceId: d2.id, tagId: 'TAG-D2', tagType: 'container' });

      const reads = mgr.getRecentRFIDReads(d1.id);
      expect(reads.length).toBe(1);
      expect(reads[0].tagId).toBe('TAG-D1');
    });
  });

  // ===========================================================================
  // 3. OCR
  // ===========================================================================

  describe('OCR', () => {
    it('records an OCR read successfully', () => {
      const device = registerDevice(mgr, { deviceType: 'ocr_camera' });
      const res = mgr.recordOCRRead({
        deviceId: device.id,
        captureType: 'container_number',
        capturedText: 'MSCU1234567',
        confidence: 95.5,
        imageUrl: 'https://example.com/capture.jpg',
      });

      expect(res.success).toBe(true);
      expect(res.data!.capturedText).toBe('MSCU1234567');
      expect(res.data!.confidence).toBe(95.5);
      expect(res.data!.imageUrl).toBe('https://example.com/capture.jpg');
      expect(res.data!.validated).toBe(false);
      expect(res.data!.readTime).toBeInstanceOf(Date);
    });

    it('increments totalReads on device after OCR read', () => {
      const device = registerDevice(mgr, { deviceType: 'ocr_camera' });
      mgr.recordOCRRead({ deviceId: device.id, captureType: 'license_plate', capturedText: 'MH04AB1234', confidence: 88 });
      expect(mgr.getDevice(device.id)!.totalReads).toBe(1);
    });

    it('returns NOT_FOUND when recording OCR for unknown device', () => {
      const res = mgr.recordOCRRead({
        deviceId: uuid(),
        captureType: 'container_number',
        capturedText: 'MSCU1234567',
        confidence: 90,
      });
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('NOT_FOUND');
    });

    it('validates an OCR read successfully', () => {
      const device = registerDevice(mgr, { deviceType: 'ocr_camera' });
      const read = mgr.recordOCRRead({
        deviceId: device.id,
        captureType: 'container_number',
        capturedText: 'MSCU123456',
        confidence: 78,
      }).data!;

      const res = mgr.validateOCR(read.id, 'MSCU1234567', 'operator-01');
      expect(res.success).toBe(true);
      expect(res.data!.validated).toBe(true);
      expect(res.data!.validatedText).toBe('MSCU1234567');
      expect(res.data!.validatedBy).toBe('operator-01');
      expect(res.data!.validatedAt).toBeInstanceOf(Date);
    });

    it('returns NOT_FOUND when validating unknown OCR read', () => {
      const res = mgr.validateOCR(uuid(), 'TEXT', 'operator');
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('NOT_FOUND');
    });
  });

  // ===========================================================================
  // 4. Weighbridge
  // ===========================================================================

  describe('Weighbridge', () => {
    it('records a weigh read successfully', () => {
      const device = registerDevice(mgr, { deviceType: 'weighbridge' });
      const res = mgr.recordWeigh({
        deviceId: device.id,
        readType: 'gross',
        weight: 32500,
        unit: 'kg',
        vehicleNumber: 'MH04AB1234',
        containerNumber: 'MSCU1234567',
      });

      expect(res.success).toBe(true);
      expect(res.data!.weight).toBe(32500);
      expect(res.data!.unit).toBe('kg');
      expect(res.data!.readType).toBe('gross');
      expect(res.data!.vehicleNumber).toBe('MH04AB1234');
      expect(res.data!.containerNumber).toBe('MSCU1234567');
      expect(res.data!.stable).toBe(true);
      expect(res.data!.calibrationValid).toBe(true);
      expect(res.data!.overweight).toBe(false);
    });

    it('defaults unit to kg when not specified', () => {
      const device = registerDevice(mgr, { deviceType: 'weighbridge' });
      const res = mgr.recordWeigh({ deviceId: device.id, readType: 'tare', weight: 8000 });
      expect(res.data!.unit).toBe('kg');
    });

    it('detects overweight when weight exceeds maxAllowed', () => {
      const device = registerDevice(mgr, { deviceType: 'weighbridge' });
      const res = mgr.recordWeigh({
        deviceId: device.id,
        readType: 'gross',
        weight: 32500,
        unit: 'kg',
        vehicleNumber: 'MH04AB1234',
        containerNumber: 'MSCU1234567',
        maxAllowed: 30000,
      });

      expect(res.success).toBe(true);
      expect(res.data!.overweight).toBe(true);
      expect(res.data!.overweightAmount).toBe(2500);
      expect(res.data!.maxAllowed).toBe(30000);
    });

    it('does not flag overweight when weight is within limits', () => {
      const device = registerDevice(mgr, { deviceType: 'weighbridge' });
      const res = mgr.recordWeigh({
        deviceId: device.id,
        readType: 'gross',
        weight: 28000,
        maxAllowed: 30000,
      });

      expect(res.data!.overweight).toBe(false);
      expect(res.data!.overweightAmount).toBeUndefined();
    });

    it('does not flag overweight when maxAllowed is not specified', () => {
      const device = registerDevice(mgr, { deviceType: 'weighbridge' });
      const res = mgr.recordWeigh({
        deviceId: device.id,
        readType: 'gross',
        weight: 50000,
      });

      expect(res.data!.overweight).toBe(false);
    });

    it('returns NOT_FOUND when recording weigh for unknown device', () => {
      const res = mgr.recordWeigh({
        deviceId: uuid(),
        readType: 'gross',
        weight: 10000,
      });
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('NOT_FOUND');
    });

    it('retrieves weighbridge reads for a device', () => {
      const device = registerDevice(mgr, { deviceType: 'weighbridge' });
      mgr.recordWeigh({ deviceId: device.id, readType: 'tare', weight: 8000 });
      mgr.recordWeigh({ deviceId: device.id, readType: 'gross', weight: 32500 });

      const reads = mgr.getWeighbridgeReads(device.id);
      expect(reads.length).toBe(2);
    });

    it('limits weighbridge reads with limit parameter', () => {
      const device = registerDevice(mgr, { deviceType: 'weighbridge' });
      for (let i = 0; i < 10; i++) {
        mgr.recordWeigh({ deviceId: device.id, readType: 'gross', weight: 20000 + i * 100 });
      }

      const reads = mgr.getWeighbridgeReads(device.id, 5);
      expect(reads.length).toBe(5);
    });

    it('returns only reads for the specified weighbridge device', () => {
      const wb1 = registerDevice(mgr, { deviceType: 'weighbridge' });
      const wb2 = registerDevice(mgr, { deviceType: 'weighbridge' });
      mgr.recordWeigh({ deviceId: wb1.id, readType: 'gross', weight: 30000 });
      mgr.recordWeigh({ deviceId: wb2.id, readType: 'gross', weight: 25000 });

      const reads = mgr.getWeighbridgeReads(wb1.id);
      expect(reads.length).toBe(1);
      expect(reads[0].weight).toBe(30000);
    });

    it('increments totalReads on device after weigh', () => {
      const device = registerDevice(mgr, { deviceType: 'weighbridge' });
      mgr.recordWeigh({ deviceId: device.id, readType: 'gross', weight: 30000 });
      mgr.recordWeigh({ deviceId: device.id, readType: 'tare', weight: 8000 });
      expect(mgr.getDevice(device.id)!.totalReads).toBe(2);
    });
  });

  // ===========================================================================
  // 5. Scanner
  // ===========================================================================

  describe('Scanner', () => {
    it('records a QR scan successfully', () => {
      const device = registerDevice(mgr, { deviceType: 'qr_scanner' });
      const res = mgr.recordScan({
        deviceId: device.id,
        scanType: 'qr',
        data: 'CTR-MSCU1234567-2026',
        entityType: 'container',
      });

      expect(res.success).toBe(true);
      expect(res.data!.scanType).toBe('qr');
      expect(res.data!.data).toBe('CTR-MSCU1234567-2026');
      expect(res.data!.entityType).toBe('container');
      expect(res.data!.readTime).toBeInstanceOf(Date);
    });

    it('records a barcode scan with format', () => {
      const device = registerDevice(mgr, { deviceType: 'barcode_scanner' });
      const res = mgr.recordScan({
        deviceId: device.id,
        scanType: 'barcode_1d',
        format: 'code128',
        data: '123456789012',
        entityType: 'container',
        entityId: uuid(),
      });

      expect(res.success).toBe(true);
      expect(res.data!.format).toBe('code128');
    });

    it('increments totalReads on device after scan', () => {
      const device = registerDevice(mgr, { deviceType: 'barcode_scanner' });
      mgr.recordScan({ deviceId: device.id, scanType: 'barcode_1d', data: 'DATA-1' });
      mgr.recordScan({ deviceId: device.id, scanType: 'qr', data: 'DATA-2' });
      expect(mgr.getDevice(device.id)!.totalReads).toBe(2);
    });

    it('returns NOT_FOUND when recording scan for unknown device', () => {
      const res = mgr.recordScan({
        deviceId: uuid(),
        scanType: 'qr',
        data: 'DATA',
      });
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('NOT_FOUND');
    });
  });

  // ===========================================================================
  // 6. Printer
  // ===========================================================================

  describe('Printer', () => {
    it('creates a print job successfully on a label printer', () => {
      const printer = registerPrinter(mgr);
      const res = mgr.createPrintJob({
        deviceId: printer.id,
        jobType: 'container_label',
        templateId: 'CTR-LABEL-V2',
        data: { containerNumber: 'MSCU1234567' },
        copies: 2,
      });

      expect(res.success).toBe(true);
      expect(res.data!.jobType).toBe('container_label');
      expect(res.data!.templateId).toBe('CTR-LABEL-V2');
      expect(res.data!.copies).toBe(2);
      expect(res.data!.status).toBe('completed');
      expect(res.data!.queuedAt).toBeInstanceOf(Date);
      expect(res.data!.completedAt).toBeInstanceOf(Date);
    });

    it('creates a print job on a document printer', () => {
      const printer = registerDevice(mgr, {
        deviceType: 'document_printer',
        deviceCode: `DOC-${uuid().slice(0, 6)}`,
        name: 'Document Printer',
      });
      const res = mgr.createPrintJob({
        deviceId: printer.id,
        jobType: 'gate_pass',
        copies: 1,
      });
      expect(res.success).toBe(true);
      expect(res.data!.jobType).toBe('gate_pass');
    });

    it('defaults copies to 1 when not specified', () => {
      const printer = registerPrinter(mgr);
      const res = mgr.createPrintJob({
        deviceId: printer.id,
        jobType: 'seal_label',
      });
      expect(res.data!.copies).toBe(1);
    });

    it('rejects print job on non-printer device (INVALID_DEVICE)', () => {
      const rfid = registerDevice(mgr, { deviceType: 'rfid_reader' });
      const res = mgr.createPrintJob({
        deviceId: rfid.id,
        jobType: 'container_label',
      });
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('INVALID_DEVICE');
      expect(res.error).toContain('not a printer');
    });

    it('rejects print job on weighbridge device', () => {
      const wb = registerDevice(mgr, { deviceType: 'weighbridge' });
      const res = mgr.createPrintJob({ deviceId: wb.id, jobType: 'invoice' });
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('INVALID_DEVICE');
    });

    it('returns NOT_FOUND for print job on unknown device', () => {
      const res = mgr.createPrintJob({
        deviceId: uuid(),
        jobType: 'container_label',
      });
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('NOT_FOUND');
    });

    it('retrieves a print job by id', () => {
      const printer = registerPrinter(mgr);
      const job = mgr.createPrintJob({
        deviceId: printer.id,
        jobType: 'manifest',
        templateId: 'MANIFEST-V1',
        data: { voyageNumber: 'V-001' },
        copies: 3,
      }).data!;

      const found = mgr.getPrintJob(job.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(job.id);
      expect(found!.copies).toBe(3);
      expect(found!.templateId).toBe('MANIFEST-V1');
    });

    it('returns undefined for unknown print job id', () => {
      expect(mgr.getPrintJob(uuid())).toBeUndefined();
    });
  });

  // ===========================================================================
  // 7. Stats
  // ===========================================================================

  describe('Stats', () => {
    it('returns baseline stats for empty manager', () => {
      const stats = mgr.getHardwareStats(TENANT_ID);
      expect(stats.totalDevices).toBe(0);
      expect(stats.online).toBe(0);
      expect(stats.offline).toBe(0);
      expect(stats.error).toBe(0);
      expect(stats.rfid.totalReads).toBe(0);
      expect(stats.ocr.totalCaptures).toBe(0);
      expect(stats.ocr.avgConfidence).toBe(0);
      expect(stats.ocr.validationRate).toBe(0);
      expect(stats.weighbridge.totalWeighs).toBe(0);
      expect(stats.weighbridge.overweightDetections).toBe(0);
      expect(stats.printers.totalJobs).toBe(0);
      expect(stats.printers.completed).toBe(0);
      expect(stats.printers.failed).toBe(0);
    });

    it('counts devices by status', () => {
      const d1 = registerDevice(mgr);
      const d2 = registerDevice(mgr);
      const d3 = registerDevice(mgr);
      mgr.updateDeviceStatus(d1.id, 'online');
      mgr.updateDeviceStatus(d2.id, 'error');
      // d3 stays offline

      const stats = mgr.getHardwareStats(TENANT_ID);
      expect(stats.totalDevices).toBe(3);
      expect(stats.online).toBe(1);
      expect(stats.offline).toBe(1);
      expect(stats.error).toBe(1);
    });

    it('groups devices by type', () => {
      registerDevice(mgr, { deviceType: 'rfid_reader' });
      registerDevice(mgr, { deviceType: 'rfid_reader' });
      registerDevice(mgr, { deviceType: 'ocr_camera' });
      registerDevice(mgr, { deviceType: 'weighbridge' });

      const stats = mgr.getHardwareStats(TENANT_ID);
      expect(stats.byType['rfid_reader'].total).toBe(2);
      expect(stats.byType['ocr_camera'].total).toBe(1);
      expect(stats.byType['weighbridge'].total).toBe(1);
    });

    it('includes RFID read counts in stats', () => {
      const device = registerDevice(mgr);
      mgr.recordRFIDRead({ deviceId: device.id, tagId: 'TAG-1', tagType: 'container' });
      mgr.recordRFIDRead({ deviceId: device.id, tagId: 'TAG-2', tagType: 'vehicle' });

      const stats = mgr.getHardwareStats(TENANT_ID);
      expect(stats.rfid.totalReads).toBe(2);
    });

    it('includes OCR stats with average confidence', () => {
      const device = registerDevice(mgr, { deviceType: 'ocr_camera' });
      mgr.recordOCRRead({ deviceId: device.id, captureType: 'container_number', capturedText: 'MSCU1234567', confidence: 90 });
      mgr.recordOCRRead({ deviceId: device.id, captureType: 'license_plate', capturedText: 'MH04AB1234', confidence: 80 });

      const stats = mgr.getHardwareStats(TENANT_ID);
      expect(stats.ocr.totalCaptures).toBe(2);
      expect(stats.ocr.avgConfidence).toBe(85); // (90 + 80) / 2 rounded
    });

    it('includes OCR validation rate in stats', () => {
      const device = registerDevice(mgr, { deviceType: 'ocr_camera' });
      const r1 = mgr.recordOCRRead({ deviceId: device.id, captureType: 'container_number', capturedText: 'A', confidence: 90 }).data!;
      mgr.recordOCRRead({ deviceId: device.id, captureType: 'license_plate', capturedText: 'B', confidence: 80 });
      mgr.validateOCR(r1.id, 'A-VALIDATED', 'operator');

      const stats = mgr.getHardwareStats(TENANT_ID);
      expect(stats.ocr.validationRate).toBe(50); // 1 out of 2
    });

    it('includes weighbridge stats with overweight count', () => {
      const device = registerDevice(mgr, { deviceType: 'weighbridge' });
      mgr.recordWeigh({ deviceId: device.id, readType: 'gross', weight: 32500, maxAllowed: 30000 });
      mgr.recordWeigh({ deviceId: device.id, readType: 'gross', weight: 28000, maxAllowed: 30000 });
      mgr.recordWeigh({ deviceId: device.id, readType: 'tare', weight: 8000 });

      const stats = mgr.getHardwareStats(TENANT_ID);
      expect(stats.weighbridge.totalWeighs).toBe(3);
      expect(stats.weighbridge.overweightDetections).toBe(1);
    });

    it('includes printer stats', () => {
      const printer = registerPrinter(mgr);
      mgr.createPrintJob({ deviceId: printer.id, jobType: 'container_label' });
      mgr.createPrintJob({ deviceId: printer.id, jobType: 'gate_pass', copies: 2 });

      const stats = mgr.getHardwareStats(TENANT_ID);
      expect(stats.printers.totalJobs).toBe(2);
      expect(stats.printers.completed).toBe(2); // simulated completion
      expect(stats.printers.failed).toBe(0);
    });

    it('filters stats by tenantId (excludes other tenants)', () => {
      registerDevice(mgr, { tenantId: 'other-tenant' });
      registerDevice(mgr, { tenantId: TENANT_ID });

      const stats = mgr.getHardwareStats(TENANT_ID);
      expect(stats.totalDevices).toBe(1);
    });

    it('stats date is a valid Date object', () => {
      const stats = mgr.getHardwareStats(TENANT_ID);
      expect(stats.date).toBeInstanceOf(Date);
    });
  });
});
