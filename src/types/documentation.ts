// =============================================================================
// ankrICD - Documentation Types
// =============================================================================
// Types for Bill of Lading, Delivery Orders, EDI messages (COPARN, CODECO,
// BAPLIE), and manifest management.
// =============================================================================

import type { UUID, Currency, TenantEntity } from './common';

// =============================================================================
// BILL OF LADING (B/L)
// =============================================================================

export type BLType = 'original' | 'seaway' | 'express' | 'switch' | 'house' | 'master';
export type BLStatus = 'draft' | 'issued' | 'surrendered' | 'accomplished' | 'cancelled';
export type FreightTerms = 'prepaid' | 'collect' | 'elsewhere';

export interface BillOfLading extends TenantEntity {
  id: UUID;
  blNumber: string;
  blType: BLType;
  status: BLStatus;
  facilityId: UUID;

  // Parties
  shipperId: UUID;
  shipperName: string;
  shipperAddress: string;
  consigneeId?: UUID;
  consigneeName: string;
  consigneeAddress: string;
  notifyPartyName?: string;
  notifyPartyAddress?: string;

  // Voyage
  vesselName: string;
  voyageNumber: string;
  portOfLoading: string;
  portOfDischarge: string;
  placeOfReceipt?: string;
  placeOfDelivery?: string;
  transhipmentPort?: string;

  // Cargo
  containers: BLContainer[];
  totalPackages: number;
  totalGrossWeight: number;
  totalNetWeight?: number;
  totalVolume?: number;
  cargoDescription: string;
  marksAndNumbers?: string;
  hsCode?: string;

  // Freight
  freightTerms: FreightTerms;
  freightAmount?: number;
  freightCurrency?: Currency;

  // References
  bookingNumber?: string;
  shippingBillNumber?: string;
  masterBlNumber?: string; // for house BLs
  letterOfCreditNumber?: string;

  // Dates
  issuedDate?: Date;
  onBoardDate?: Date;
  surrenderedDate?: Date;
  numberOfOriginals?: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface BLContainer {
  containerNumber: string;
  sealNumber?: string;
  size: string;
  type: string;
  packages: number;
  grossWeight: number;
  measurement?: number;
  cargoDescription?: string;
}

// =============================================================================
// DELIVERY ORDER (D/O)
// =============================================================================

export type DOStatus = 'draft' | 'issued' | 'partially_delivered' | 'fully_delivered' | 'expired' | 'cancelled';
export type DOType = 'import' | 'export' | 'empty_pickup' | 'empty_return';

export interface DeliveryOrder extends TenantEntity {
  id: UUID;
  doNumber: string;
  doType: DOType;
  status: DOStatus;
  facilityId: UUID;

  // References
  blNumber: string;
  billOfEntryNumber?: string;
  iGMNumber?: string;
  iGMItemNumber?: string;

  // Parties
  issuedTo: string; // CHA / Importer
  issuedToId?: UUID;
  shippingLineAgent?: string;
  chaName?: string;
  chaLicenseNumber?: string;

  // Container
  containerNumber: string;
  containerSize: string;
  containerType: string;
  sealNumber?: string;

  // Cargo
  packages: number;
  grossWeight: number;
  cargoDescription: string;

  // Validity
  issuedDate: Date;
  validFrom: Date;
  validUntil: Date;

  // Payment
  chargesCleared: boolean;
  chargesClearedDate?: Date;
  customsCleared: boolean;
  customsClearedDate?: Date;

  // Delivery
  deliveredContainers?: string[];
  deliveryDate?: Date;
  receivedBy?: string;

  // Security
  pinCode?: string;
  qrCode?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// EDI MESSAGES
// =============================================================================

export type EDIMessageType =
  | 'COPARN'   // Container pre-arrival notification
  | 'CODECO'   // Container gate in/out
  | 'BAPLIE'   // Bay plan / stowage
  | 'COARRI'   // Container arrival message
  | 'IFTMIN'   // Instruction for forwarding
  | 'IFTMBF'   // Booking confirmation
  | 'CUSCAR'   // Customs cargo report
  | 'CUSRES'   // Customs response
  | 'IFTMCS'   // Instruction for transport - master
  | 'MOVINS';  // Stowage instruction

export type EDIDirection = 'inbound' | 'outbound';
export type EDIStatus = 'pending' | 'sent' | 'acknowledged' | 'rejected' | 'failed';

export interface EDIMessage extends TenantEntity {
  id: UUID;
  messageId: string;
  facilityId: UUID;
  messageType: EDIMessageType;
  direction: EDIDirection;
  status: EDIStatus;

  // Sender/Receiver
  senderId: string;
  senderName?: string;
  receiverId: string;
  receiverName?: string;

  // Content
  rawContent: string;
  parsedData?: Record<string, unknown>;

  // References
  vesselName?: string;
  voyageNumber?: string;
  containerNumber?: string;
  blNumber?: string;
  bookingNumber?: string;

  // Processing
  sentAt?: Date;
  acknowledgedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;

  // Audit
  processedBy?: string;
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

// COPARN - Container Pre-Arrival
export interface COPARNData {
  messageFunction: 'original' | 'replacement' | 'cancellation';
  bookingReference: string;
  shippingLine: string;
  vessel: string;
  voyage: string;
  portOfLoading: string;
  portOfDischarge: string;
  containers: {
    containerNumber: string;
    isoType: string;
    grossWeight?: number;
    sealNumber?: string;
    specialHandling?: string[];
  }[];
}

// CODECO - Container Gate In/Out
export interface CODECOData {
  messageFunction: 'gate_in' | 'gate_out';
  facilityCode: string;
  shippingLine: string;
  containers: {
    containerNumber: string;
    isoType: string;
    fullEmpty: 'full' | 'empty';
    grossWeight?: number;
    sealNumber?: string;
    damageCode?: string;
    gateDate: Date;
    transportMode: string;
    vehicleId?: string;
    bookingReference?: string;
    blNumber?: string;
  }[];
}

// BAPLIE - Bay Plan
export interface BAPLIEData {
  vessel: string;
  voyage: string;
  port: string;
  messageFunction: 'actual' | 'planned';
  containers: {
    containerNumber: string;
    isoType: string;
    grossWeight: number;
    bayPosition: string; // Bay-Row-Tier
    portOfLoading: string;
    portOfDischarge: string;
    shippingLine: string;
    sealNumber?: string;
    hazmat?: { unNumber: string; class: string };
    reefer?: { temperature: number; unit: 'C' | 'F' };
    overDimensions?: { overHeight?: number; overWidth?: number; overLength?: number };
  }[];
}

// =============================================================================
// MANIFEST
// =============================================================================

export type ManifestType = 'igm' | 'egm' | 'transhipment';
export type ManifestStatus = 'draft' | 'submitted' | 'filed' | 'amended' | 'closed';

export interface Manifest extends TenantEntity {
  id: UUID;
  manifestNumber: string;
  manifestType: ManifestType;
  status: ManifestStatus;
  facilityId: UUID;

  // Vessel
  vesselName: string;
  voyageNumber: string;
  imoNumber?: string;
  vesselFlag?: string;

  // Port
  portOfLoading: string;
  portOfDischarge: string;
  lastPort?: string;
  nextPort?: string;

  // Schedule
  eta?: Date;
  ata?: Date;
  etd?: Date;
  atd?: Date;

  // Manifest items
  items: ManifestItem[];
  totalItems: number;
  totalPackages: number;
  totalWeight: number;
  totalContainers: number;

  // Filing
  filedDate?: Date;
  filedBy?: string;
  filingReference?: string;
  amendmentNumber?: number;
  amendmentReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface ManifestItem {
  id: UUID;
  itemNumber: number;
  blNumber: string;
  blType?: string;

  // Parties
  shipperName: string;
  consigneeName: string;
  notifyParty?: string;

  // Cargo
  cargoDescription: string;
  packages: number;
  packageType?: string;
  grossWeight: number;
  netWeight?: number;
  volume?: number;
  marksAndNumbers?: string;
  hsCode?: string;

  // Container
  containerNumbers: string[];
  containerCount: number;

  // Origin/Destination
  origin?: string;
  destination?: string;

  // Customs
  igmItemNumber?: string;
  customsStatus?: string;
}

// =============================================================================
// DOCUMENTATION STATS
// =============================================================================

export interface DocumentationStats {
  date: Date;
  billsOfLading: {
    total: number;
    draft: number;
    issued: number;
    surrendered: number;
    byType: Record<BLType, number>;
  };
  deliveryOrders: {
    total: number;
    issued: number;
    partiallyDelivered: number;
    fullyDelivered: number;
    expired: number;
  };
  ediMessages: {
    total: number;
    sent: number;
    acknowledged: number;
    rejected: number;
    failed: number;
    byType: Record<string, number>;
  };
  manifests: {
    total: number;
    draft: number;
    filed: number;
    closed: number;
  };
}
