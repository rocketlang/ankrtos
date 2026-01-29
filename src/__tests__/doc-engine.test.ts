/**
 * Documentation Engine Tests
 *
 * Comprehensive unit tests for the DocumentationEngine covering Bill of Lading,
 * Delivery Order, EDI messaging, Manifest management, and statistics.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentationEngine } from '../documentation/doc-engine';
import type { CreateBLInput, CreateDOInput, SendEDIInput, CreateManifestInput, AddManifestItemInput } from '../documentation/doc-engine';
import { TENANT_ID, FACILITY_ID, uuid } from './test-utils';

// =============================================================================
// INPUT FACTORIES
// =============================================================================

function makeBLInput(overrides: Partial<CreateBLInput> = {}): CreateBLInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    blType: 'original',
    shipperId: uuid(),
    shipperName: 'ABC Exports',
    shipperAddress: '123 Export St',
    consigneeName: 'XYZ Imports',
    consigneeAddress: '456 Import Ave',
    vesselName: 'MV Test',
    voyageNumber: 'V001',
    portOfLoading: 'INNSA',
    portOfDischarge: 'AEJEA',
    containers: [
      {
        containerNumber: 'MSCU1234567',
        size: '40',
        type: 'GP',
        packages: 100,
        grossWeight: 5000,
      },
    ],
    cargoDescription: 'Electronics',
    freightTerms: 'prepaid',
    ...overrides,
  };
}

function makeDOInput(overrides: Partial<CreateDOInput> = {}): CreateDOInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    doType: 'import',
    blNumber: 'BL-TEST-001',
    containerNumber: 'MSCU1234567',
    containerSize: '40',
    containerType: 'GP',
    issuedTo: 'ABC Importers',
    packages: 100,
    grossWeight: 5000,
    cargoDescription: 'Electronics',
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ...overrides,
  };
}

function makeEDIInput(overrides: Partial<SendEDIInput> = {}): SendEDIInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    messageType: 'COPARN',
    senderId: 'FACILITY-001',
    receiverId: 'SHIPPING-LINE-001',
    rawContent: '<EDI>test</EDI>',
    ...overrides,
  };
}

function makeManifestInput(overrides: Partial<CreateManifestInput> = {}): CreateManifestInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    manifestType: 'igm',
    vesselName: 'MV Test',
    voyageNumber: 'V001',
    portOfLoading: 'INNSA',
    portOfDischarge: 'AEJEA',
    ...overrides,
  };
}

function makeManifestItemInput(manifestId: string, overrides: Partial<AddManifestItemInput> = {}): AddManifestItemInput {
  return {
    manifestId,
    blNumber: 'BL-001',
    shipperName: 'ABC',
    consigneeName: 'XYZ',
    cargoDescription: 'Electronics',
    packages: 100,
    grossWeight: 5000,
    containerNumbers: ['MSCU1234567'],
    ...overrides,
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe('DocumentationEngine', () => {
  let engine: DocumentationEngine;

  beforeEach(() => {
    engine = new DocumentationEngine();
  });

  // ===========================================================================
  // BILL OF LADING
  // ===========================================================================

  describe('Bill of Lading', () => {
    it('should create a BL in draft status', () => {
      const result = engine.createBL(makeBLInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBeDefined();
      expect(result.data!.blNumber).toMatch(/^BL-/);
      expect(result.data!.status).toBe('draft');
      expect(result.data!.blType).toBe('original');
      expect(result.data!.shipperName).toBe('ABC Exports');
      expect(result.data!.consigneeName).toBe('XYZ Imports');
      expect(result.data!.vesselName).toBe('MV Test');
      expect(result.data!.freightTerms).toBe('prepaid');
    });

    it('should compute totals from containers', () => {
      const result = engine.createBL(makeBLInput({
        containers: [
          { containerNumber: 'MSCU1111111', size: '20', type: 'GP', packages: 50, grossWeight: 2000 },
          { containerNumber: 'MSCU2222222', size: '40', type: 'GP', packages: 80, grossWeight: 3500 },
        ],
      }));
      expect(result.success).toBe(true);
      expect(result.data!.totalPackages).toBe(130);
      expect(result.data!.totalGrossWeight).toBe(5500);
    });

    it('should default numberOfOriginals to 3', () => {
      const result = engine.createBL(makeBLInput());
      expect(result.data!.numberOfOriginals).toBe(3);
    });

    it('should get BL by ID', () => {
      const created = engine.createBL(makeBLInput());
      const bl = engine.getBL(created.data!.id);
      expect(bl).toBeDefined();
      expect(bl!.id).toBe(created.data!.id);
    });

    it('should return undefined for unknown BL ID', () => {
      const bl = engine.getBL('nonexistent-id');
      expect(bl).toBeUndefined();
    });

    it('should get BL by number', () => {
      const created = engine.createBL(makeBLInput());
      const bl = engine.getBLByNumber(created.data!.blNumber);
      expect(bl).toBeDefined();
      expect(bl!.id).toBe(created.data!.id);
    });

    it('should list BLs with filters', () => {
      engine.createBL(makeBLInput({ blType: 'original' }));
      engine.createBL(makeBLInput({ blType: 'house' }));
      engine.createBL(makeBLInput({ blType: 'original', tenantId: 'other-tenant' }));

      const originals = engine.listBLs({ blType: 'original', tenantId: TENANT_ID });
      expect(originals).toHaveLength(1);

      const allForTenant = engine.listBLs({ tenantId: TENANT_ID });
      expect(allForTenant).toHaveLength(2);
    });

    it('should issue a draft BL', () => {
      const created = engine.createBL(makeBLInput());
      const result = engine.issueBL(created.data!.id);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('issued');
      expect(result.data!.issuedDate).toBeInstanceOf(Date);
    });

    it('should fail to issue non-draft BL', () => {
      const created = engine.createBL(makeBLInput());
      engine.issueBL(created.data!.id);
      const result = engine.issueBL(created.data!.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail to issue non-existent BL', () => {
      const result = engine.issueBL('nonexistent-id');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should surrender an issued BL', () => {
      const created = engine.createBL(makeBLInput());
      engine.issueBL(created.data!.id);
      const result = engine.surrenderBL(created.data!.id);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('surrendered');
      expect(result.data!.surrenderedDate).toBeInstanceOf(Date);
    });

    it('should fail to surrender a draft BL', () => {
      const created = engine.createBL(makeBLInput());
      const result = engine.surrenderBL(created.data!.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail to surrender non-existent BL', () => {
      const result = engine.surrenderBL('nonexistent-id');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should accomplish a surrendered BL', () => {
      const created = engine.createBL(makeBLInput());
      engine.issueBL(created.data!.id);
      engine.surrenderBL(created.data!.id);
      const result = engine.accomplishBL(created.data!.id);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('accomplished');
    });

    it('should fail to accomplish a non-surrendered BL', () => {
      const created = engine.createBL(makeBLInput());
      engine.issueBL(created.data!.id);
      const result = engine.accomplishBL(created.data!.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail to accomplish non-existent BL', () => {
      const result = engine.accomplishBL('nonexistent-id');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should complete full BL lifecycle: draft -> issued -> surrendered -> accomplished', () => {
      const created = engine.createBL(makeBLInput());
      const id = created.data!.id;

      expect(engine.getBL(id)!.status).toBe('draft');

      engine.issueBL(id);
      expect(engine.getBL(id)!.status).toBe('issued');

      engine.surrenderBL(id);
      expect(engine.getBL(id)!.status).toBe('surrendered');

      engine.accomplishBL(id);
      expect(engine.getBL(id)!.status).toBe('accomplished');
    });
  });

  // ===========================================================================
  // DELIVERY ORDER
  // ===========================================================================

  describe('Delivery Order', () => {
    it('should create a DO in draft status', () => {
      const result = engine.createDO(makeDOInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBeDefined();
      expect(result.data!.doNumber).toMatch(/^DO-/);
      expect(result.data!.status).toBe('draft');
      expect(result.data!.doType).toBe('import');
      expect(result.data!.blNumber).toBe('BL-TEST-001');
      expect(result.data!.containerNumber).toBe('MSCU1234567');
      expect(result.data!.issuedTo).toBe('ABC Importers');
      expect(result.data!.chargesCleared).toBe(false);
      expect(result.data!.customsCleared).toBe(false);
      expect(result.data!.verified).toBe(false);
      expect(result.data!.pinCode).toBeDefined();
      expect(result.data!.pinCode).toHaveLength(6);
    });

    it('should get DO by ID', () => {
      const created = engine.createDO(makeDOInput());
      const d = engine.getDO(created.data!.id);
      expect(d).toBeDefined();
      expect(d!.id).toBe(created.data!.id);
    });

    it('should return undefined for unknown DO ID', () => {
      const d = engine.getDO('nonexistent-id');
      expect(d).toBeUndefined();
    });

    it('should get DO by number', () => {
      const created = engine.createDO(makeDOInput());
      const d = engine.getDOByNumber(created.data!.doNumber);
      expect(d).toBeDefined();
      expect(d!.id).toBe(created.data!.id);
    });

    it('should list DOs with filters', () => {
      engine.createDO(makeDOInput({ doType: 'import' }));
      engine.createDO(makeDOInput({ doType: 'export' }));
      engine.createDO(makeDOInput({ doType: 'import', tenantId: 'other-tenant' }));

      const imports = engine.listDOs({ doType: 'import', tenantId: TENANT_ID });
      expect(imports).toHaveLength(1);

      const allForTenant = engine.listDOs({ tenantId: TENANT_ID });
      expect(allForTenant).toHaveLength(2);
    });

    it('should issue a draft DO', () => {
      const created = engine.createDO(makeDOInput());
      const result = engine.issueDO(created.data!.id);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('issued');
      expect(result.data!.issuedDate).toBeInstanceOf(Date);
    });

    it('should fail to issue non-draft DO', () => {
      const created = engine.createDO(makeDOInput());
      engine.issueDO(created.data!.id);
      const result = engine.issueDO(created.data!.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail to issue non-existent DO', () => {
      const result = engine.issueDO('nonexistent-id');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should clear charges', () => {
      const created = engine.createDO(makeDOInput());
      const result = engine.clearCharges(created.data!.id);
      expect(result.success).toBe(true);
      expect(result.data!.chargesCleared).toBe(true);
      expect(result.data!.chargesClearedDate).toBeInstanceOf(Date);
    });

    it('should fail to clear charges for non-existent DO', () => {
      const result = engine.clearCharges('nonexistent-id');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should clear customs', () => {
      const created = engine.createDO(makeDOInput());
      const result = engine.clearCustoms(created.data!.id);
      expect(result.success).toBe(true);
      expect(result.data!.customsCleared).toBe(true);
      expect(result.data!.customsClearedDate).toBeInstanceOf(Date);
    });

    it('should fail to clear customs for non-existent DO', () => {
      const result = engine.clearCustoms('nonexistent-id');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should verify DO without pin', () => {
      const created = engine.createDO(makeDOInput());
      const result = engine.verifyDO(created.data!.id, 'Inspector Raj');
      expect(result.success).toBe(true);
      expect(result.data!.verified).toBe(true);
      expect(result.data!.verifiedBy).toBe('Inspector Raj');
      expect(result.data!.verifiedAt).toBeInstanceOf(Date);
    });

    it('should verify DO with correct pin', () => {
      const created = engine.createDO(makeDOInput());
      const pin = created.data!.pinCode!;
      const result = engine.verifyDO(created.data!.id, 'Inspector Raj', pin);
      expect(result.success).toBe(true);
      expect(result.data!.verified).toBe(true);
    });

    it('should reject verification with invalid pin', () => {
      const created = engine.createDO(makeDOInput());
      const result = engine.verifyDO(created.data!.id, 'Inspector Raj', '000000');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_PIN');
    });

    it('should fail to verify non-existent DO', () => {
      const result = engine.verifyDO('nonexistent-id', 'Inspector Raj');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should record delivery when charges and customs are cleared', () => {
      const created = engine.createDO(makeDOInput());
      const id = created.data!.id;
      engine.issueDO(id);
      engine.clearCharges(id);
      engine.clearCustoms(id);

      const result = engine.recordDelivery(id, 'Receiver Kumar');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('fully_delivered');
      expect(result.data!.deliveryDate).toBeInstanceOf(Date);
      expect(result.data!.receivedBy).toBe('Receiver Kumar');
      expect(result.data!.deliveredContainers).toContain('MSCU1234567');
    });

    it('should fail delivery when charges are not cleared', () => {
      const created = engine.createDO(makeDOInput());
      const id = created.data!.id;
      engine.issueDO(id);
      engine.clearCustoms(id);

      const result = engine.recordDelivery(id, 'Receiver Kumar');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_CLEARED');
    });

    it('should fail delivery when customs are not cleared', () => {
      const created = engine.createDO(makeDOInput());
      const id = created.data!.id;
      engine.issueDO(id);
      engine.clearCharges(id);

      const result = engine.recordDelivery(id, 'Receiver Kumar');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_CLEARED');
    });

    it('should fail delivery for non-existent DO', () => {
      const result = engine.recordDelivery('nonexistent-id', 'Receiver Kumar');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should complete full DO lifecycle: draft -> issued -> fully_delivered', () => {
      const created = engine.createDO(makeDOInput());
      const id = created.data!.id;

      expect(engine.getDO(id)!.status).toBe('draft');

      engine.issueDO(id);
      expect(engine.getDO(id)!.status).toBe('issued');

      engine.clearCharges(id);
      engine.clearCustoms(id);
      engine.verifyDO(id, 'Inspector Raj');
      engine.recordDelivery(id, 'Receiver Kumar');
      expect(engine.getDO(id)!.status).toBe('fully_delivered');
    });
  });

  // ===========================================================================
  // EDI MESSAGES
  // ===========================================================================

  describe('EDI Messages', () => {
    it('should send an EDI message', () => {
      const result = engine.sendEDI(makeEDIInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBeDefined();
      expect(result.data!.messageId).toMatch(/^EDI-/);
      expect(result.data!.direction).toBe('outbound');
      expect(result.data!.status).toBe('sent');
      expect(result.data!.messageType).toBe('COPARN');
      expect(result.data!.senderId).toBe('FACILITY-001');
      expect(result.data!.receiverId).toBe('SHIPPING-LINE-001');
      expect(result.data!.sentAt).toBeInstanceOf(Date);
      expect(result.data!.retryCount).toBe(0);
      expect(result.data!.maxRetries).toBe(3);
    });

    it('should receive an EDI message', () => {
      const result = engine.receiveEDI(makeEDIInput({ messageType: 'CODECO' }));
      expect(result.success).toBe(true);
      expect(result.data!.direction).toBe('inbound');
      expect(result.data!.status).toBe('acknowledged');
      expect(result.data!.messageType).toBe('CODECO');
      expect(result.data!.acknowledgedAt).toBeInstanceOf(Date);
    });

    it('should get EDI message by ID', () => {
      const sent = engine.sendEDI(makeEDIInput());
      const msg = engine.getEDIMessage(sent.data!.id);
      expect(msg).toBeDefined();
      expect(msg!.id).toBe(sent.data!.id);
    });

    it('should return undefined for unknown EDI ID', () => {
      const msg = engine.getEDIMessage('nonexistent-id');
      expect(msg).toBeUndefined();
    });

    it('should list EDI messages with filters', () => {
      engine.sendEDI(makeEDIInput({ messageType: 'COPARN' }));
      engine.sendEDI(makeEDIInput({ messageType: 'CODECO' }));
      engine.receiveEDI(makeEDIInput({ messageType: 'BAPLIE' }));

      const outbound = engine.listEDIMessages({ direction: 'outbound' });
      expect(outbound).toHaveLength(2);

      const coparn = engine.listEDIMessages({ messageType: 'COPARN' });
      expect(coparn).toHaveLength(1);

      const inbound = engine.listEDIMessages({ direction: 'inbound' });
      expect(inbound).toHaveLength(1);
    });

    it('should acknowledge an EDI message', () => {
      const sent = engine.sendEDI(makeEDIInput());
      const result = engine.acknowledgeEDI(sent.data!.id);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('acknowledged');
      expect(result.data!.acknowledgedAt).toBeInstanceOf(Date);
    });

    it('should fail to acknowledge non-existent EDI', () => {
      const result = engine.acknowledgeEDI('nonexistent-id');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should reject an EDI message with reason', () => {
      const sent = engine.sendEDI(makeEDIInput());
      const result = engine.rejectEDI(sent.data!.id, 'Invalid container number');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('rejected');
      expect(result.data!.rejectedAt).toBeInstanceOf(Date);
      expect(result.data!.rejectionReason).toBe('Invalid container number');
    });

    it('should fail to reject non-existent EDI', () => {
      const result = engine.rejectEDI('nonexistent-id', 'reason');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should send COPARN convenience message', () => {
      const coparnData = {
        messageFunction: 'original' as const,
        bookingReference: 'BK-001',
        shippingLine: 'MSC',
        vessel: 'MV COPARN Test',
        voyage: 'V100',
        portOfLoading: 'INNSA',
        portOfDischarge: 'AEJEA',
        containers: [
          { containerNumber: 'MSCU9999999', isoType: '42G1', grossWeight: 5000 },
        ],
      };

      const result = engine.sendCOPARN(TENANT_ID, FACILITY_ID, coparnData, 'RECV-001');
      expect(result.success).toBe(true);
      expect(result.data!.messageType).toBe('COPARN');
      expect(result.data!.direction).toBe('outbound');
      expect(result.data!.vesselName).toBe('MV COPARN Test');
      expect(result.data!.voyageNumber).toBe('V100');
      expect(result.data!.parsedData).toBeDefined();
    });

    it('should send CODECO convenience message', () => {
      const codecoData = {
        messageFunction: 'gate_in' as const,
        facilityCode: 'INNSA',
        shippingLine: 'MSC',
        containers: [
          {
            containerNumber: 'MSCU8888888',
            isoType: '42G1',
            fullEmpty: 'full' as const,
            grossWeight: 5000,
            gateDate: new Date(),
            transportMode: 'truck',
          },
        ],
      };

      const result = engine.sendCODECO(TENANT_ID, FACILITY_ID, codecoData, 'RECV-002');
      expect(result.success).toBe(true);
      expect(result.data!.messageType).toBe('CODECO');
      expect(result.data!.direction).toBe('outbound');
      expect(result.data!.containerNumber).toBe('MSCU8888888');
    });

    it('should send BAPLIE convenience message', () => {
      const baplieData = {
        vessel: 'MV BAPLIE Test',
        voyage: 'V200',
        port: 'INNSA',
        messageFunction: 'planned' as const,
        containers: [
          {
            containerNumber: 'MSCU7777777',
            isoType: '42G1',
            grossWeight: 5000,
            bayPosition: '010102',
            portOfLoading: 'INNSA',
            portOfDischarge: 'AEJEA',
            shippingLine: 'MSC',
          },
        ],
      };

      const result = engine.sendBAPLIE(TENANT_ID, FACILITY_ID, baplieData, 'RECV-003');
      expect(result.success).toBe(true);
      expect(result.data!.messageType).toBe('BAPLIE');
      expect(result.data!.direction).toBe('outbound');
      expect(result.data!.vesselName).toBe('MV BAPLIE Test');
      expect(result.data!.voyageNumber).toBe('V200');
    });
  });

  // ===========================================================================
  // MANIFEST
  // ===========================================================================

  describe('Manifest', () => {
    it('should create a manifest in draft status', () => {
      const result = engine.createManifest(makeManifestInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBeDefined();
      expect(result.data!.manifestNumber).toMatch(/^IGM-/);
      expect(result.data!.status).toBe('draft');
      expect(result.data!.manifestType).toBe('igm');
      expect(result.data!.vesselName).toBe('MV Test');
      expect(result.data!.items).toHaveLength(0);
      expect(result.data!.totalItems).toBe(0);
      expect(result.data!.totalPackages).toBe(0);
      expect(result.data!.totalWeight).toBe(0);
      expect(result.data!.totalContainers).toBe(0);
    });

    it('should generate EGM prefix for export manifest', () => {
      const result = engine.createManifest(makeManifestInput({ manifestType: 'egm' }));
      expect(result.data!.manifestNumber).toMatch(/^EGM-/);
    });

    it('should generate TSM prefix for transhipment manifest', () => {
      const result = engine.createManifest(makeManifestInput({ manifestType: 'transhipment' }));
      expect(result.data!.manifestNumber).toMatch(/^TSM-/);
    });

    it('should get manifest by ID', () => {
      const created = engine.createManifest(makeManifestInput());
      const manifest = engine.getManifest(created.data!.id);
      expect(manifest).toBeDefined();
      expect(manifest!.id).toBe(created.data!.id);
    });

    it('should return undefined for unknown manifest ID', () => {
      const manifest = engine.getManifest('nonexistent-id');
      expect(manifest).toBeUndefined();
    });

    it('should get manifest by number', () => {
      const created = engine.createManifest(makeManifestInput());
      const manifest = engine.getManifestByNumber(created.data!.manifestNumber);
      expect(manifest).toBeDefined();
      expect(manifest!.id).toBe(created.data!.id);
    });

    it('should list manifests with filters', () => {
      engine.createManifest(makeManifestInput({ manifestType: 'igm' }));
      engine.createManifest(makeManifestInput({ manifestType: 'egm' }));
      engine.createManifest(makeManifestInput({ manifestType: 'igm', tenantId: 'other-tenant' }));

      const igms = engine.listManifests({ manifestType: 'igm', tenantId: TENANT_ID });
      expect(igms).toHaveLength(1);

      const allForTenant = engine.listManifests({ tenantId: TENANT_ID });
      expect(allForTenant).toHaveLength(2);
    });

    it('should add an item to a manifest', () => {
      const created = engine.createManifest(makeManifestInput());
      const result = engine.addManifestItem(makeManifestItemInput(created.data!.id));
      expect(result.success).toBe(true);
      expect(result.data!.items).toHaveLength(1);
      expect(result.data!.totalItems).toBe(1);
      expect(result.data!.totalPackages).toBe(100);
      expect(result.data!.totalWeight).toBe(5000);
      expect(result.data!.totalContainers).toBe(1);

      const item = result.data!.items[0];
      expect(item.itemNumber).toBe(1);
      expect(item.blNumber).toBe('BL-001');
      expect(item.shipperName).toBe('ABC');
      expect(item.consigneeName).toBe('XYZ');
      expect(item.containerCount).toBe(1);
    });

    it('should accumulate totals for multiple manifest items', () => {
      const created = engine.createManifest(makeManifestInput());
      const manifestId = created.data!.id;

      engine.addManifestItem(makeManifestItemInput(manifestId, {
        blNumber: 'BL-001',
        packages: 100,
        grossWeight: 5000,
        containerNumbers: ['MSCU1111111'],
      }));
      engine.addManifestItem(makeManifestItemInput(manifestId, {
        blNumber: 'BL-002',
        packages: 200,
        grossWeight: 8000,
        containerNumbers: ['MSCU2222222', 'MSCU3333333'],
      }));

      const manifest = engine.getManifest(manifestId)!;
      expect(manifest.totalItems).toBe(2);
      expect(manifest.totalPackages).toBe(300);
      expect(manifest.totalWeight).toBe(13000);
      expect(manifest.totalContainers).toBe(3);
    });

    it('should fail to add item to non-existent manifest', () => {
      const result = engine.addManifestItem(makeManifestItemInput('nonexistent-id'));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail to add item to a filed manifest', () => {
      const created = engine.createManifest(makeManifestInput());
      const manifestId = created.data!.id;
      engine.addManifestItem(makeManifestItemInput(manifestId));
      engine.fileManifest(manifestId, 'Admin');

      const result = engine.addManifestItem(makeManifestItemInput(manifestId, { blNumber: 'BL-NEW' }));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should file a manifest with items', () => {
      const created = engine.createManifest(makeManifestInput());
      const manifestId = created.data!.id;
      engine.addManifestItem(makeManifestItemInput(manifestId));

      const result = engine.fileManifest(manifestId, 'Admin User', 'FIL-REF-001');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('filed');
      expect(result.data!.filedDate).toBeInstanceOf(Date);
      expect(result.data!.filedBy).toBe('Admin User');
      expect(result.data!.filingReference).toBe('FIL-REF-001');
    });

    it('should auto-generate filing reference if not provided', () => {
      const created = engine.createManifest(makeManifestInput());
      const manifestId = created.data!.id;
      engine.addManifestItem(makeManifestItemInput(manifestId));

      const result = engine.fileManifest(manifestId, 'Admin');
      expect(result.success).toBe(true);
      expect(result.data!.filingReference).toMatch(/^FIL-/);
    });

    it('should fail to file an empty manifest', () => {
      const created = engine.createManifest(makeManifestInput());
      const result = engine.fileManifest(created.data!.id, 'Admin');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('EMPTY');
    });

    it('should fail to file non-existent manifest', () => {
      const result = engine.fileManifest('nonexistent-id', 'Admin');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should amend a filed manifest', () => {
      const created = engine.createManifest(makeManifestInput());
      const manifestId = created.data!.id;
      engine.addManifestItem(makeManifestItemInput(manifestId));
      engine.fileManifest(manifestId, 'Admin');

      const result = engine.amendManifest(manifestId, 'Incorrect cargo weight');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('amended');
      expect(result.data!.amendmentNumber).toBe(1);
      expect(result.data!.amendmentReason).toBe('Incorrect cargo weight');
    });

    it('should fail to amend a draft manifest', () => {
      const created = engine.createManifest(makeManifestInput());
      const result = engine.amendManifest(created.data!.id, 'reason');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail to amend non-existent manifest', () => {
      const result = engine.amendManifest('nonexistent-id', 'reason');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should allow adding items to an amended manifest', () => {
      const created = engine.createManifest(makeManifestInput());
      const manifestId = created.data!.id;
      engine.addManifestItem(makeManifestItemInput(manifestId));
      engine.fileManifest(manifestId, 'Admin');
      engine.amendManifest(manifestId, 'Need to add items');

      const result = engine.addManifestItem(makeManifestItemInput(manifestId, { blNumber: 'BL-AMENDED' }));
      expect(result.success).toBe(true);
      expect(result.data!.items).toHaveLength(2);
    });

    it('should increment amendment number on successive amendments', () => {
      const created = engine.createManifest(makeManifestInput());
      const manifestId = created.data!.id;
      engine.addManifestItem(makeManifestItemInput(manifestId));
      engine.fileManifest(manifestId, 'Admin');

      engine.amendManifest(manifestId, 'First amendment');
      expect(engine.getManifest(manifestId)!.amendmentNumber).toBe(1);

      // Re-file then amend again
      engine.fileManifest(manifestId, 'Admin');
      engine.amendManifest(manifestId, 'Second amendment');
      expect(engine.getManifest(manifestId)!.amendmentNumber).toBe(2);
    });

    it('should close a manifest', () => {
      const created = engine.createManifest(makeManifestInput());
      const manifestId = created.data!.id;
      engine.addManifestItem(makeManifestItemInput(manifestId));
      engine.fileManifest(manifestId, 'Admin');

      const result = engine.closeManifest(manifestId);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('closed');
    });

    it('should fail to close non-existent manifest', () => {
      const result = engine.closeManifest('nonexistent-id');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should complete full manifest lifecycle: draft -> filed -> amended -> closed', () => {
      const created = engine.createManifest(makeManifestInput());
      const manifestId = created.data!.id;

      expect(engine.getManifest(manifestId)!.status).toBe('draft');

      engine.addManifestItem(makeManifestItemInput(manifestId));
      engine.fileManifest(manifestId, 'Admin');
      expect(engine.getManifest(manifestId)!.status).toBe('filed');

      engine.amendManifest(manifestId, 'Correction needed');
      expect(engine.getManifest(manifestId)!.status).toBe('amended');

      engine.closeManifest(manifestId);
      expect(engine.getManifest(manifestId)!.status).toBe('closed');
    });
  });

  // ===========================================================================
  // STATS
  // ===========================================================================

  describe('Documentation Stats', () => {
    it('should return zero stats for empty engine', () => {
      const stats = engine.getDocumentationStats(TENANT_ID);
      expect(stats.date).toBeInstanceOf(Date);
      expect(stats.billsOfLading.total).toBe(0);
      expect(stats.billsOfLading.draft).toBe(0);
      expect(stats.deliveryOrders.total).toBe(0);
      expect(stats.ediMessages.total).toBe(0);
      expect(stats.manifests.total).toBe(0);
    });

    it('should return correct aggregate stats across all sub-modules', () => {
      // Create BLs
      const bl1 = engine.createBL(makeBLInput({ blType: 'original' }));
      const bl2 = engine.createBL(makeBLInput({ blType: 'house' }));
      engine.issueBL(bl1.data!.id);
      engine.issueBL(bl2.data!.id);
      engine.surrenderBL(bl1.data!.id);
      engine.createBL(makeBLInput({ blType: 'original' })); // stays draft

      // Create DOs
      const do1 = engine.createDO(makeDOInput());
      engine.issueDO(do1.data!.id);
      engine.clearCharges(do1.data!.id);
      engine.clearCustoms(do1.data!.id);
      engine.recordDelivery(do1.data!.id, 'Receiver');
      engine.createDO(makeDOInput()); // stays draft

      // Send EDI
      engine.sendEDI(makeEDIInput({ messageType: 'COPARN' }));
      engine.sendEDI(makeEDIInput({ messageType: 'COPARN' }));
      const edi3 = engine.sendEDI(makeEDIInput({ messageType: 'CODECO' }));
      engine.rejectEDI(edi3.data!.id, 'bad data');

      // Create manifests
      const m1 = engine.createManifest(makeManifestInput());
      engine.addManifestItem(makeManifestItemInput(m1.data!.id));
      engine.fileManifest(m1.data!.id, 'Admin');
      engine.createManifest(makeManifestInput()); // stays draft

      const stats = engine.getDocumentationStats(TENANT_ID);

      // BL stats
      expect(stats.billsOfLading.total).toBe(3);
      expect(stats.billsOfLading.draft).toBe(1);
      expect(stats.billsOfLading.issued).toBe(1);
      expect(stats.billsOfLading.surrendered).toBe(1);
      expect(stats.billsOfLading.byType['original']).toBe(2);
      expect(stats.billsOfLading.byType['house']).toBe(1);

      // DO stats
      expect(stats.deliveryOrders.total).toBe(2);
      expect(stats.deliveryOrders.fullyDelivered).toBe(1);

      // EDI stats
      expect(stats.ediMessages.total).toBe(3);
      expect(stats.ediMessages.sent).toBe(2);
      expect(stats.ediMessages.rejected).toBe(1);
      expect(stats.ediMessages.byType['COPARN']).toBe(2);
      expect(stats.ediMessages.byType['CODECO']).toBe(1);

      // Manifest stats
      expect(stats.manifests.total).toBe(2);
      expect(stats.manifests.draft).toBe(1);
      expect(stats.manifests.filed).toBe(1);
    });

    it('should scope stats to tenant', () => {
      engine.createBL(makeBLInput({ tenantId: TENANT_ID }));
      engine.createBL(makeBLInput({ tenantId: 'other-tenant' }));

      const stats = engine.getDocumentationStats(TENANT_ID);
      expect(stats.billsOfLading.total).toBe(1);

      const otherStats = engine.getDocumentationStats('other-tenant');
      expect(otherStats.billsOfLading.total).toBe(1);
    });
  });
});
