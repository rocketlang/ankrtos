// =============================================================================
// ankrICD - Documentation Engine
// =============================================================================
// Manages Bill of Lading, Delivery Orders, EDI messaging (COPARN, CODECO,
// BAPLIE), and manifest management.
// =============================================================================

import type { UUID, OperationResult } from '../types/common';
import type {
  BillOfLading,
  BLStatus,
  BLType,
  DeliveryOrder,
  DOStatus,
  DOType,
  EDIMessage,
  EDIMessageType,
  EDIDirection,
  EDIStatus,
  COPARNData,
  CODECOData,
  BAPLIEData,
  Manifest,
  ManifestType,
  ManifestStatus,
  ManifestItem,
  DocumentationStats,
} from '../types/documentation';
import { emit } from '../core/event-bus';

// =============================================================================
// INPUT TYPES
// =============================================================================

export interface CreateBLInput {
  tenantId: string;
  facilityId: UUID;
  blType: BLType;
  // Parties
  shipperId: UUID;
  shipperName: string;
  shipperAddress: string;
  consigneeName: string;
  consigneeAddress: string;
  consigneeId?: UUID;
  notifyPartyName?: string;
  notifyPartyAddress?: string;
  // Voyage
  vesselName: string;
  voyageNumber: string;
  portOfLoading: string;
  portOfDischarge: string;
  placeOfReceipt?: string;
  placeOfDelivery?: string;
  // Cargo
  containers: BillOfLading['containers'];
  cargoDescription: string;
  marksAndNumbers?: string;
  hsCode?: string;
  // Freight
  freightTerms: BillOfLading['freightTerms'];
  freightAmount?: number;
  freightCurrency?: string;
  // Refs
  bookingNumber?: string;
  masterBlNumber?: string;
  numberOfOriginals?: number;
}

export interface CreateDOInput {
  tenantId: string;
  facilityId: UUID;
  doType: DOType;
  blNumber: string;
  containerNumber: string;
  containerSize: string;
  containerType: string;
  issuedTo: string;
  issuedToId?: UUID;
  packages: number;
  grossWeight: number;
  cargoDescription: string;
  validFrom?: Date;
  validUntil: Date;
  billOfEntryNumber?: string;
  iGMNumber?: string;
  iGMItemNumber?: string;
  shippingLineAgent?: string;
  chaName?: string;
  chaLicenseNumber?: string;
  sealNumber?: string;
}

export interface SendEDIInput {
  tenantId: string;
  facilityId: UUID;
  messageType: EDIMessageType;
  senderId: string;
  senderName?: string;
  receiverId: string;
  receiverName?: string;
  rawContent: string;
  parsedData?: Record<string, unknown>;
  vesselName?: string;
  voyageNumber?: string;
  containerNumber?: string;
  blNumber?: string;
  bookingNumber?: string;
}

export interface CreateManifestInput {
  tenantId: string;
  facilityId: UUID;
  manifestType: ManifestType;
  vesselName: string;
  voyageNumber: string;
  imoNumber?: string;
  vesselFlag?: string;
  portOfLoading: string;
  portOfDischarge: string;
  lastPort?: string;
  nextPort?: string;
  eta?: Date;
  etd?: Date;
}

export interface AddManifestItemInput {
  manifestId: UUID;
  blNumber: string;
  blType?: string;
  shipperName: string;
  consigneeName: string;
  notifyParty?: string;
  cargoDescription: string;
  packages: number;
  packageType?: string;
  grossWeight: number;
  netWeight?: number;
  volume?: number;
  marksAndNumbers?: string;
  hsCode?: string;
  containerNumbers: string[];
  origin?: string;
  destination?: string;
}

export interface BLQueryOptions {
  tenantId?: string;
  facilityId?: UUID;
  status?: BLStatus;
  blType?: BLType;
  vesselName?: string;
  voyageNumber?: string;
  page?: number;
  pageSize?: number;
}

export interface DOQueryOptions {
  tenantId?: string;
  facilityId?: UUID;
  status?: DOStatus;
  doType?: DOType;
  blNumber?: string;
  containerNumber?: string;
  page?: number;
  pageSize?: number;
}

export interface EDIQueryOptions {
  tenantId?: string;
  facilityId?: UUID;
  messageType?: EDIMessageType;
  direction?: EDIDirection;
  status?: EDIStatus;
  page?: number;
  pageSize?: number;
}

export interface ManifestQueryOptions {
  tenantId?: string;
  facilityId?: UUID;
  manifestType?: ManifestType;
  status?: ManifestStatus;
  vesselName?: string;
  page?: number;
  pageSize?: number;
}

// =============================================================================
// HELPERS
// =============================================================================

let counter = 0;
function nextId(): UUID {
  return `doc-${Date.now()}-${++counter}`;
}

function genNumber(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${(++counter).toString().padStart(4, '0')}`;
}

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// =============================================================================
// DOCUMENTATION ENGINE
// =============================================================================

export class DocumentationEngine {
  private bls = new Map<UUID, BillOfLading>();
  private dos = new Map<UUID, DeliveryOrder>();
  private ediMessages = new Map<UUID, EDIMessage>();
  private manifests = new Map<UUID, Manifest>();

  // ===========================================================================
  // BILL OF LADING
  // ===========================================================================

  createBL(input: CreateBLInput): OperationResult<BillOfLading> {
    const id = nextId();
    const totalPackages = input.containers.reduce((s, c) => s + c.packages, 0);
    const totalWeight = input.containers.reduce((s, c) => s + c.grossWeight, 0);
    const totalVolume = input.containers.reduce((s, c) => s + (c.measurement ?? 0), 0);

    const bl: BillOfLading = {
      id,
      tenantId: input.tenantId,
      blNumber: genNumber('BL'),
      blType: input.blType,
      status: 'draft',
      facilityId: input.facilityId,
      shipperId: input.shipperId,
      shipperName: input.shipperName,
      shipperAddress: input.shipperAddress,
      consigneeId: input.consigneeId,
      consigneeName: input.consigneeName,
      consigneeAddress: input.consigneeAddress,
      notifyPartyName: input.notifyPartyName,
      notifyPartyAddress: input.notifyPartyAddress,
      vesselName: input.vesselName,
      voyageNumber: input.voyageNumber,
      portOfLoading: input.portOfLoading,
      portOfDischarge: input.portOfDischarge,
      placeOfReceipt: input.placeOfReceipt,
      placeOfDelivery: input.placeOfDelivery,
      containers: input.containers,
      totalPackages,
      totalGrossWeight: totalWeight,
      totalVolume: totalVolume > 0 ? totalVolume : undefined,
      cargoDescription: input.cargoDescription,
      marksAndNumbers: input.marksAndNumbers,
      hsCode: input.hsCode,
      freightTerms: input.freightTerms,
      freightAmount: input.freightAmount,
      freightCurrency: input.freightCurrency as any,
      bookingNumber: input.bookingNumber,
      masterBlNumber: input.masterBlNumber,
      numberOfOriginals: input.numberOfOriginals ?? 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.bls.set(id, bl);
    return { success: true, data: bl };
  }

  getBL(id: UUID): BillOfLading | undefined {
    return this.bls.get(id);
  }

  getBLByNumber(blNumber: string): BillOfLading | undefined {
    return [...this.bls.values()].find((bl) => bl.blNumber === blNumber);
  }

  listBLs(options?: BLQueryOptions): BillOfLading[] {
    let list = [...this.bls.values()];
    if (options?.tenantId) list = list.filter((bl) => bl.tenantId === options.tenantId);
    if (options?.facilityId) list = list.filter((bl) => bl.facilityId === options.facilityId);
    if (options?.status) list = list.filter((bl) => bl.status === options.status);
    if (options?.blType) list = list.filter((bl) => bl.blType === options.blType);
    if (options?.vesselName) list = list.filter((bl) => bl.vesselName === options.vesselName);
    if (options?.voyageNumber) list = list.filter((bl) => bl.voyageNumber === options.voyageNumber);
    return list;
  }

  issueBL(blId: UUID): OperationResult<BillOfLading> {
    const bl = this.bls.get(blId);
    if (!bl) return { success: false, error: 'Bill of Lading not found', errorCode: 'NOT_FOUND' };
    if (bl.status !== 'draft') return { success: false, error: 'Can only issue draft BLs', errorCode: 'INVALID_STATUS' };
    bl.status = 'issued';
    bl.issuedDate = new Date();
    bl.updatedAt = new Date();

    emit('documentation.bl_issued' as any, { blId, blNumber: bl.blNumber, blType: bl.blType }, { tenantId: bl.tenantId });

    return { success: true, data: bl };
  }

  surrenderBL(blId: UUID): OperationResult<BillOfLading> {
    const bl = this.bls.get(blId);
    if (!bl) return { success: false, error: 'Bill of Lading not found', errorCode: 'NOT_FOUND' };
    if (bl.status !== 'issued') return { success: false, error: 'Can only surrender issued BLs', errorCode: 'INVALID_STATUS' };
    bl.status = 'surrendered';
    bl.surrenderedDate = new Date();
    bl.updatedAt = new Date();
    return { success: true, data: bl };
  }

  accomplishBL(blId: UUID): OperationResult<BillOfLading> {
    const bl = this.bls.get(blId);
    if (!bl) return { success: false, error: 'Bill of Lading not found', errorCode: 'NOT_FOUND' };
    if (bl.status !== 'surrendered') return { success: false, error: 'Must be surrendered first', errorCode: 'INVALID_STATUS' };
    bl.status = 'accomplished';
    bl.updatedAt = new Date();
    return { success: true, data: bl };
  }

  // ===========================================================================
  // DELIVERY ORDER
  // ===========================================================================

  createDO(input: CreateDOInput): OperationResult<DeliveryOrder> {
    const id = nextId();
    const deliveryOrder: DeliveryOrder = {
      id,
      tenantId: input.tenantId,
      doNumber: genNumber('DO'),
      doType: input.doType,
      status: 'draft',
      facilityId: input.facilityId,
      blNumber: input.blNumber,
      billOfEntryNumber: input.billOfEntryNumber,
      iGMNumber: input.iGMNumber,
      iGMItemNumber: input.iGMItemNumber,
      issuedTo: input.issuedTo,
      issuedToId: input.issuedToId,
      shippingLineAgent: input.shippingLineAgent,
      chaName: input.chaName,
      chaLicenseNumber: input.chaLicenseNumber,
      containerNumber: input.containerNumber,
      containerSize: input.containerSize,
      containerType: input.containerType,
      sealNumber: input.sealNumber,
      packages: input.packages,
      grossWeight: input.grossWeight,
      cargoDescription: input.cargoDescription,
      issuedDate: new Date(),
      validFrom: input.validFrom ?? new Date(),
      validUntil: input.validUntil,
      chargesCleared: false,
      customsCleared: false,
      verified: false,
      pinCode: generatePin(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.dos.set(id, deliveryOrder);
    return { success: true, data: deliveryOrder };
  }

  getDO(id: UUID): DeliveryOrder | undefined {
    return this.dos.get(id);
  }

  getDOByNumber(doNumber: string): DeliveryOrder | undefined {
    return [...this.dos.values()].find((d) => d.doNumber === doNumber);
  }

  listDOs(options?: DOQueryOptions): DeliveryOrder[] {
    let list = [...this.dos.values()];
    if (options?.tenantId) list = list.filter((d) => d.tenantId === options.tenantId);
    if (options?.facilityId) list = list.filter((d) => d.facilityId === options.facilityId);
    if (options?.status) list = list.filter((d) => d.status === options.status);
    if (options?.doType) list = list.filter((d) => d.doType === options.doType);
    if (options?.blNumber) list = list.filter((d) => d.blNumber === options.blNumber);
    if (options?.containerNumber) list = list.filter((d) => d.containerNumber === options.containerNumber);
    return list;
  }

  issueDO(doId: UUID): OperationResult<DeliveryOrder> {
    const d = this.dos.get(doId);
    if (!d) return { success: false, error: 'Delivery Order not found', errorCode: 'NOT_FOUND' };
    if (d.status !== 'draft') return { success: false, error: 'Can only issue draft DOs', errorCode: 'INVALID_STATUS' };
    d.status = 'issued';
    d.issuedDate = new Date();
    d.updatedAt = new Date();

    emit('documentation.do_issued' as any, { doId, doNumber: d.doNumber, containerNumber: d.containerNumber, blNumber: d.blNumber }, { tenantId: d.tenantId });

    return { success: true, data: d };
  }

  clearCharges(doId: UUID): OperationResult<DeliveryOrder> {
    const d = this.dos.get(doId);
    if (!d) return { success: false, error: 'Delivery Order not found', errorCode: 'NOT_FOUND' };
    d.chargesCleared = true;
    d.chargesClearedDate = new Date();
    d.updatedAt = new Date();
    return { success: true, data: d };
  }

  clearCustoms(doId: UUID): OperationResult<DeliveryOrder> {
    const d = this.dos.get(doId);
    if (!d) return { success: false, error: 'Delivery Order not found', errorCode: 'NOT_FOUND' };
    d.customsCleared = true;
    d.customsClearedDate = new Date();
    d.updatedAt = new Date();
    return { success: true, data: d };
  }

  verifyDO(doId: UUID, verifiedBy: string, pinCode?: string): OperationResult<DeliveryOrder> {
    const d = this.dos.get(doId);
    if (!d) return { success: false, error: 'Delivery Order not found', errorCode: 'NOT_FOUND' };
    if (pinCode && d.pinCode !== pinCode) {
      return { success: false, error: 'Invalid PIN code', errorCode: 'INVALID_PIN' };
    }
    d.verified = true;
    d.verifiedBy = verifiedBy;
    d.verifiedAt = new Date();
    d.updatedAt = new Date();
    return { success: true, data: d };
  }

  recordDelivery(doId: UUID, receivedBy: string): OperationResult<DeliveryOrder> {
    const d = this.dos.get(doId);
    if (!d) return { success: false, error: 'Delivery Order not found', errorCode: 'NOT_FOUND' };
    if (d.status === 'expired' || d.status === 'cancelled') {
      return { success: false, error: 'DO is expired or cancelled', errorCode: 'INVALID_STATUS' };
    }
    if (!d.chargesCleared || !d.customsCleared) {
      return { success: false, error: 'Charges and customs must be cleared first', errorCode: 'NOT_CLEARED' };
    }
    d.status = 'fully_delivered';
    d.deliveryDate = new Date();
    d.receivedBy = receivedBy;
    d.deliveredContainers = d.deliveredContainers ?? [];
    d.deliveredContainers.push(d.containerNumber);
    d.updatedAt = new Date();

    emit('documentation.do_delivered' as any, { doId, doNumber: d.doNumber, containerNumber: d.containerNumber }, { tenantId: d.tenantId });

    return { success: true, data: d };
  }

  // ===========================================================================
  // EDI MESSAGES
  // ===========================================================================

  sendEDI(input: SendEDIInput): OperationResult<EDIMessage> {
    const id = nextId();
    const msg: EDIMessage = {
      id,
      tenantId: input.tenantId,
      messageId: genNumber('EDI'),
      facilityId: input.facilityId,
      messageType: input.messageType,
      direction: 'outbound',
      status: 'pending',
      senderId: input.senderId,
      senderName: input.senderName,
      receiverId: input.receiverId,
      receiverName: input.receiverName,
      rawContent: input.rawContent,
      parsedData: input.parsedData,
      vesselName: input.vesselName,
      voyageNumber: input.voyageNumber,
      containerNumber: input.containerNumber,
      blNumber: input.blNumber,
      bookingNumber: input.bookingNumber,
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.ediMessages.set(id, msg);

    // Simulate sending
    msg.status = 'sent';
    msg.sentAt = new Date();

    emit('documentation.edi_sent' as any, { messageId: msg.messageId, messageType: input.messageType, receiverId: input.receiverId }, { tenantId: input.tenantId });

    return { success: true, data: msg };
  }

  receiveEDI(input: SendEDIInput): OperationResult<EDIMessage> {
    const id = nextId();
    const msg: EDIMessage = {
      id,
      tenantId: input.tenantId,
      messageId: genNumber('EDI'),
      facilityId: input.facilityId,
      messageType: input.messageType,
      direction: 'inbound',
      status: 'acknowledged',
      senderId: input.senderId,
      senderName: input.senderName,
      receiverId: input.receiverId,
      receiverName: input.receiverName,
      rawContent: input.rawContent,
      parsedData: input.parsedData,
      vesselName: input.vesselName,
      voyageNumber: input.voyageNumber,
      containerNumber: input.containerNumber,
      blNumber: input.blNumber,
      bookingNumber: input.bookingNumber,
      retryCount: 0,
      maxRetries: 3,
      acknowledgedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.ediMessages.set(id, msg);

    emit('documentation.edi_received' as any, { messageId: msg.messageId, messageType: input.messageType, senderId: input.senderId }, { tenantId: input.tenantId });

    return { success: true, data: msg };
  }

  getEDIMessage(id: UUID): EDIMessage | undefined {
    return this.ediMessages.get(id);
  }

  listEDIMessages(options?: EDIQueryOptions): EDIMessage[] {
    let list = [...this.ediMessages.values()];
    if (options?.tenantId) list = list.filter((m) => m.tenantId === options.tenantId);
    if (options?.facilityId) list = list.filter((m) => m.facilityId === options.facilityId);
    if (options?.messageType) list = list.filter((m) => m.messageType === options.messageType);
    if (options?.direction) list = list.filter((m) => m.direction === options.direction);
    if (options?.status) list = list.filter((m) => m.status === options.status);
    return list;
  }

  acknowledgeEDI(messageId: UUID): OperationResult<EDIMessage> {
    const msg = this.ediMessages.get(messageId);
    if (!msg) return { success: false, error: 'EDI message not found', errorCode: 'NOT_FOUND' };
    msg.status = 'acknowledged';
    msg.acknowledgedAt = new Date();
    msg.updatedAt = new Date();
    return { success: true, data: msg };
  }

  rejectEDI(messageId: UUID, reason: string): OperationResult<EDIMessage> {
    const msg = this.ediMessages.get(messageId);
    if (!msg) return { success: false, error: 'EDI message not found', errorCode: 'NOT_FOUND' };
    msg.status = 'rejected';
    msg.rejectedAt = new Date();
    msg.rejectionReason = reason;
    msg.updatedAt = new Date();
    return { success: true, data: msg };
  }

  // Convenience: build and send COPARN
  sendCOPARN(tenantId: string, facilityId: UUID, data: COPARNData, receiverId: string): OperationResult<EDIMessage> {
    const raw = JSON.stringify(data); // In production, would be UN/EDIFACT format
    return this.sendEDI({
      tenantId,
      facilityId,
      messageType: 'COPARN',
      senderId: facilityId,
      receiverId,
      rawContent: raw,
      parsedData: data as any,
      vesselName: data.vessel,
      voyageNumber: data.voyage,
    });
  }

  // Convenience: build and send CODECO
  sendCODECO(tenantId: string, facilityId: UUID, data: CODECOData, receiverId: string): OperationResult<EDIMessage> {
    const raw = JSON.stringify(data);
    return this.sendEDI({
      tenantId,
      facilityId,
      messageType: 'CODECO',
      senderId: facilityId,
      receiverId,
      rawContent: raw,
      parsedData: data as any,
      containerNumber: data.containers[0]?.containerNumber,
    });
  }

  // Convenience: build and send BAPLIE
  sendBAPLIE(tenantId: string, facilityId: UUID, data: BAPLIEData, receiverId: string): OperationResult<EDIMessage> {
    const raw = JSON.stringify(data);
    return this.sendEDI({
      tenantId,
      facilityId,
      messageType: 'BAPLIE',
      senderId: facilityId,
      receiverId,
      rawContent: raw,
      parsedData: data as any,
      vesselName: data.vessel,
      voyageNumber: data.voyage,
    });
  }

  // ===========================================================================
  // MANIFEST
  // ===========================================================================

  createManifest(input: CreateManifestInput): OperationResult<Manifest> {
    const id = nextId();
    const manifest: Manifest = {
      id,
      tenantId: input.tenantId,
      manifestNumber: genNumber(input.manifestType === 'igm' ? 'IGM' : input.manifestType === 'egm' ? 'EGM' : 'TSM'),
      manifestType: input.manifestType,
      status: 'draft',
      facilityId: input.facilityId,
      vesselName: input.vesselName,
      voyageNumber: input.voyageNumber,
      imoNumber: input.imoNumber,
      vesselFlag: input.vesselFlag,
      portOfLoading: input.portOfLoading,
      portOfDischarge: input.portOfDischarge,
      lastPort: input.lastPort,
      nextPort: input.nextPort,
      eta: input.eta,
      etd: input.etd,
      items: [],
      totalItems: 0,
      totalPackages: 0,
      totalWeight: 0,
      totalContainers: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.manifests.set(id, manifest);
    return { success: true, data: manifest };
  }

  getManifest(id: UUID): Manifest | undefined {
    return this.manifests.get(id);
  }

  getManifestByNumber(manifestNumber: string): Manifest | undefined {
    return [...this.manifests.values()].find((m) => m.manifestNumber === manifestNumber);
  }

  listManifests(options?: ManifestQueryOptions): Manifest[] {
    let list = [...this.manifests.values()];
    if (options?.tenantId) list = list.filter((m) => m.tenantId === options.tenantId);
    if (options?.facilityId) list = list.filter((m) => m.facilityId === options.facilityId);
    if (options?.manifestType) list = list.filter((m) => m.manifestType === options.manifestType);
    if (options?.status) list = list.filter((m) => m.status === options.status);
    if (options?.vesselName) list = list.filter((m) => m.vesselName === options.vesselName);
    return list;
  }

  addManifestItem(input: AddManifestItemInput): OperationResult<Manifest> {
    const manifest = this.manifests.get(input.manifestId);
    if (!manifest) return { success: false, error: 'Manifest not found', errorCode: 'NOT_FOUND' };
    if (manifest.status !== 'draft' && manifest.status !== 'amended') {
      return { success: false, error: 'Manifest is not editable', errorCode: 'INVALID_STATUS' };
    }

    const itemNumber = manifest.items.length + 1;
    const item: ManifestItem = {
      id: nextId(),
      itemNumber,
      blNumber: input.blNumber,
      blType: input.blType,
      shipperName: input.shipperName,
      consigneeName: input.consigneeName,
      notifyParty: input.notifyParty,
      cargoDescription: input.cargoDescription,
      packages: input.packages,
      packageType: input.packageType,
      grossWeight: input.grossWeight,
      netWeight: input.netWeight,
      volume: input.volume,
      marksAndNumbers: input.marksAndNumbers,
      hsCode: input.hsCode,
      containerNumbers: input.containerNumbers,
      containerCount: input.containerNumbers.length,
      origin: input.origin,
      destination: input.destination,
    };

    manifest.items.push(item);
    this.recalcManifestTotals(manifest);
    manifest.updatedAt = new Date();

    return { success: true, data: manifest };
  }

  fileManifest(manifestId: UUID, filedBy: string, filingReference?: string): OperationResult<Manifest> {
    const manifest = this.manifests.get(manifestId);
    if (!manifest) return { success: false, error: 'Manifest not found', errorCode: 'NOT_FOUND' };
    if (manifest.items.length === 0) {
      return { success: false, error: 'Manifest has no items', errorCode: 'EMPTY' };
    }

    manifest.status = 'filed';
    manifest.filedDate = new Date();
    manifest.filedBy = filedBy;
    manifest.filingReference = filingReference ?? genNumber('FIL');
    manifest.updatedAt = new Date();

    emit('documentation.manifest_filed' as any, {
      manifestId,
      manifestNumber: manifest.manifestNumber,
      manifestType: manifest.manifestType,
      vesselName: manifest.vesselName,
      items: manifest.totalItems,
    }, { tenantId: manifest.tenantId });

    return { success: true, data: manifest };
  }

  amendManifest(manifestId: UUID, reason: string): OperationResult<Manifest> {
    const manifest = this.manifests.get(manifestId);
    if (!manifest) return { success: false, error: 'Manifest not found', errorCode: 'NOT_FOUND' };
    if (manifest.status !== 'filed' && manifest.status !== 'submitted') {
      return { success: false, error: 'Can only amend filed/submitted manifests', errorCode: 'INVALID_STATUS' };
    }
    manifest.status = 'amended';
    manifest.amendmentNumber = (manifest.amendmentNumber ?? 0) + 1;
    manifest.amendmentReason = reason;
    manifest.updatedAt = new Date();
    return { success: true, data: manifest };
  }

  closeManifest(manifestId: UUID): OperationResult<Manifest> {
    const manifest = this.manifests.get(manifestId);
    if (!manifest) return { success: false, error: 'Manifest not found', errorCode: 'NOT_FOUND' };
    manifest.status = 'closed';
    manifest.updatedAt = new Date();
    return { success: true, data: manifest };
  }

  private recalcManifestTotals(manifest: Manifest): void {
    manifest.totalItems = manifest.items.length;
    manifest.totalPackages = manifest.items.reduce((s, i) => s + i.packages, 0);
    manifest.totalWeight = manifest.items.reduce((s, i) => s + i.grossWeight, 0);
    const containerSet = new Set<string>();
    for (const item of manifest.items) {
      for (const cn of item.containerNumbers) {
        containerSet.add(cn);
      }
    }
    manifest.totalContainers = containerSet.size;
  }

  // ===========================================================================
  // STATS
  // ===========================================================================

  getDocumentationStats(tenantId: string): DocumentationStats {
    const bls = [...this.bls.values()].filter((b) => b.tenantId === tenantId);
    const dos = [...this.dos.values()].filter((d) => d.tenantId === tenantId);
    const edis = [...this.ediMessages.values()].filter((m) => m.tenantId === tenantId);
    const mans = [...this.manifests.values()].filter((m) => m.tenantId === tenantId);

    const blByType: Record<string, number> = {};
    for (const bl of bls) {
      blByType[bl.blType] = (blByType[bl.blType] ?? 0) + 1;
    }

    const ediByType: Record<string, number> = {};
    for (const m of edis) {
      ediByType[m.messageType] = (ediByType[m.messageType] ?? 0) + 1;
    }

    return {
      date: new Date(),
      billsOfLading: {
        total: bls.length,
        draft: bls.filter((b) => b.status === 'draft').length,
        issued: bls.filter((b) => b.status === 'issued').length,
        surrendered: bls.filter((b) => b.status === 'surrendered').length,
        byType: blByType as any,
      },
      deliveryOrders: {
        total: dos.length,
        issued: dos.filter((d) => d.status === 'issued').length,
        partiallyDelivered: dos.filter((d) => d.status === 'partially_delivered').length,
        fullyDelivered: dos.filter((d) => d.status === 'fully_delivered').length,
        expired: dos.filter((d) => d.status === 'expired').length,
      },
      ediMessages: {
        total: edis.length,
        sent: edis.filter((m) => m.status === 'sent').length,
        acknowledged: edis.filter((m) => m.status === 'acknowledged').length,
        rejected: edis.filter((m) => m.status === 'rejected').length,
        failed: edis.filter((m) => m.status === 'failed').length,
        byType: ediByType,
      },
      manifests: {
        total: mans.length,
        draft: mans.filter((m) => m.status === 'draft').length,
        filed: mans.filter((m) => m.status === 'filed').length,
        closed: mans.filter((m) => m.status === 'closed').length,
      },
    };
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let instance: DocumentationEngine | null = null;

export function getDocumentationEngine(): DocumentationEngine {
  if (!instance) instance = new DocumentationEngine();
  return instance;
}

export function setDocumentationEngine(engine: DocumentationEngine): void {
  instance = engine;
}
