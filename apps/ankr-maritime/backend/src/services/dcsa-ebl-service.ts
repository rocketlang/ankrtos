/**
 * DCSA eBL 3.0 Service
 * Phase 33: Document Management System
 *
 * Implements Digital Container Shipping Association (DCSA) Electronic Bill of Lading 3.0 standard
 *
 * Features:
 * - Electronic Bill of Lading (eBL) creation
 * - Digital endorsement chain
 * - Multi-party workflow (shipper → consignee → notify party)
 * - Title transfer tracking
 * - DCSA-compliant data structure
 * - Blockchain anchoring for immutability
 * - Electronic signature support
 * - Surrender/amendment flow
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

// DCSA eBL 3.0 Types
interface DCSAeBL {
  eblNumber: string; // Unique eBL reference
  blNumber: string; // Bill of Lading number (from paper BL)
  status: 'draft' | 'issued' | 'surrendered' | 'accomplished' | 'void';
  carrierBookingReference: string;

  // Parties
  shipper: DCSAParty;
  consignee: DCSAParty;
  notifyParties: DCSAParty[];
  carrier: DCSAParty;

  // Cargo
  cargoDescription: string;
  cargoItems: DCSACargoItem[];
  totalGrossWeight: number;
  totalVolume: number;

  // Transport
  portOfLoading: DCSALocation;
  portOfDischarge: DCSALocation;
  placeOfReceipt?: DCSALocation;
  placeOfDelivery?: DCSALocation;
  vesselName: string;
  vesselIMO: string;
  voyageNumber: string;

  // Dates
  shippedOnBoardDate?: Date;
  receivedForShipmentDate?: Date;
  expectedDeliveryDate?: Date;

  // Terms
  freightPaymentTerms: 'prepaid' | 'collect';
  numberOfOriginalsIssued: number;

  // Digital properties
  isElectronic: true;
  electronicSignatures: DCSASignature[];
  endorsementChain: DCSAEndorsement[];
  titleHolder: string; // Current title holder ID

  // Metadata
  issueDate: Date;
  issuedBy: string; // User ID
  lastModifiedAt: Date;
  documentHash: string;
  blockchainTxHash?: string;
}

interface DCSAParty {
  partyName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateRegion?: string;
  postalCode?: string;
  countryCode: string; // ISO 3166-1 alpha-2
  taxReference?: string;
  eoriNumber?: string;
  publicKey?: string; // For electronic signatures
}

interface DCSACargoItem {
  descriptionOfGoods: string;
  hsCode?: string;
  numberOfPackages: number;
  packageCode: string; // UN/CEFACT code
  weight: number;
  weightUnit: 'kg' | 'lbs';
  volume?: number;
  volumeUnit?: 'cbm' | 'cft';
  marksAndNumbers?: string;
}

interface DCSALocation {
  locationName: string;
  UNLocationCode: string; // UN/LOCODE
  facilityCode?: string;
  facilityCodeProvider?: string;
}

interface DCSASignature {
  signerId: string;
  signerName: string;
  signatureType: 'carrier' | 'shipper' | 'consignee' | 'endorser';
  signatureValue: string; // Encrypted signature
  signedAt: Date;
  algorithm: 'RSA' | 'ECDSA' | 'EdDSA';
  publicKey: string;
  certificateChain?: string[];
}

interface DCSAEndorsement {
  endorsementId: string;
  fromParty: string; // Party ID
  toParty: string; // Party ID
  endorsedAt: Date;
  endorsementType: 'transfer' | 'surrender' | 'amendment';
  signature: DCSASignature;
  previousTitleHolder: string;
  newTitleHolder: string;
  blockchainTxHash?: string;
}

export class DCSAeBLService {
  /**
   * Create new DCSA eBL from traditional BOL
   */
  async createeBL(
    documentId: string,
    bolData: Partial<DCSAeBL>,
    userId: string,
    organizationId: string
  ): Promise<DCSAeBL> {
    // Generate unique eBL number
    const eblNumber = this.generateEBLNumber(bolData.carrier.partyName);

    // Calculate document hash
    const documentHash = this.calculateDocumentHash(bolData);

    // Create eBL record
    const ebl: DCSAeBL = {
      eblNumber,
      blNumber: bolData.blNumber || '',
      status: 'draft',
      carrierBookingReference: bolData.carrierBookingReference || '',
      shipper: bolData.shipper!,
      consignee: bolData.consignee!,
      notifyParties: bolData.notifyParties || [],
      carrier: bolData.carrier!,
      cargoDescription: bolData.cargoDescription || '',
      cargoItems: bolData.cargoItems || [],
      totalGrossWeight: bolData.totalGrossWeight || 0,
      totalVolume: bolData.totalVolume || 0,
      portOfLoading: bolData.portOfLoading!,
      portOfDischarge: bolData.portOfDischarge!,
      placeOfReceipt: bolData.placeOfReceipt,
      placeOfDelivery: bolData.placeOfDelivery,
      vesselName: bolData.vesselName || '',
      vesselIMO: bolData.vesselIMO || '',
      voyageNumber: bolData.voyageNumber || '',
      shippedOnBoardDate: bolData.shippedOnBoardDate,
      receivedForShipmentDate: bolData.receivedForShipmentDate,
      expectedDeliveryDate: bolData.expectedDeliveryDate,
      freightPaymentTerms: bolData.freightPaymentTerms || 'collect',
      numberOfOriginalsIssued: bolData.numberOfOriginalsIssued || 3,
      isElectronic: true,
      electronicSignatures: [],
      endorsementChain: [],
      titleHolder: userId, // Initial title holder is the issuer
      issueDate: new Date(),
      issuedBy: userId,
      lastModifiedAt: new Date(),
      documentHash,
    };

    // Store in database
    await prisma.document.update({
      where: { id: documentId },
      data: {
        metadata: {
          dcsa_ebl: ebl,
          ebl_version: '3.0.0',
        },
      },
    });

    console.log(`[DCSAeBL] Created eBL ${eblNumber} for document ${documentId}`);

    return ebl;
  }

  /**
   * Issue eBL (change status from draft to issued)
   * Requires carrier signature
   */
  async issueeBL(
    documentId: string,
    carrierSignature: DCSASignature,
    userId: string
  ): Promise<DCSAeBL> {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!doc || !doc.metadata || !(doc.metadata as any).dcsa_ebl) {
      throw new Error('eBL not found');
    }

    const ebl = (doc.metadata as any).dcsa_ebl as DCSAeBL;

    if (ebl.status !== 'draft') {
      throw new Error(`eBL cannot be issued. Current status: ${ebl.status}`);
    }

    // Add carrier signature
    ebl.electronicSignatures.push({
      ...carrierSignature,
      signatureType: 'carrier',
      signedAt: new Date(),
    });

    // Update status
    ebl.status = 'issued';
    ebl.lastModifiedAt = new Date();

    // Recalculate hash
    ebl.documentHash = this.calculateDocumentHash(ebl);

    // Submit to blockchain for immutability
    const txHash = await this.submitToBlockchain(ebl);
    ebl.blockchainTxHash = txHash;

    // Update database
    await prisma.document.update({
      where: { id: documentId },
      data: {
        metadata: {
          dcsa_ebl: ebl,
        },
      },
    });

    // Create blockchain verification record
    await prisma.blockchainVerification.create({
      data: {
        documentId,
        fileHash: ebl.documentHash,
        blockchainType: 'ethereum',
        status: 'submitted',
        transactionHash: txHash,
        submittedAt: new Date(),
        createdById: userId,
      },
    });

    console.log(`[DCSAeBL] Issued eBL ${ebl.eblNumber} with tx ${txHash}`);

    return ebl;
  }

  /**
   * Endorse eBL (transfer title)
   */
  async endorseeBL(
    documentId: string,
    fromPartyId: string,
    toPartyId: string,
    signature: DCSASignature,
    endorsementType: 'transfer' | 'surrender' | 'amendment',
    userId: string
  ): Promise<DCSAeBL> {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!doc || !doc.metadata || !(doc.metadata as any).dcsa_ebl) {
      throw new Error('eBL not found');
    }

    const ebl = (doc.metadata as any).dcsa_ebl as DCSAeBL;

    if (ebl.status !== 'issued') {
      throw new Error(`eBL cannot be endorsed. Current status: ${ebl.status}`);
    }

    // Verify current title holder
    if (ebl.titleHolder !== fromPartyId) {
      throw new Error('Only current title holder can endorse eBL');
    }

    // Create endorsement record
    const endorsement: DCSAEndorsement = {
      endorsementId: crypto.randomBytes(16).toString('hex'),
      fromParty: fromPartyId,
      toParty: toPartyId,
      endorsedAt: new Date(),
      endorsementType,
      signature,
      previousTitleHolder: ebl.titleHolder,
      newTitleHolder: toPartyId,
    };

    // Submit endorsement to blockchain
    const txHash = await this.submitEndorsementToBlockchain(endorsement);
    endorsement.blockchainTxHash = txHash;

    // Add endorsement to chain
    ebl.endorsementChain.push(endorsement);

    // Update title holder
    ebl.titleHolder = toPartyId;
    ebl.lastModifiedAt = new Date();

    // Recalculate hash
    ebl.documentHash = this.calculateDocumentHash(ebl);

    // Update database
    await prisma.document.update({
      where: { id: documentId },
      data: {
        metadata: {
          dcsa_ebl: ebl,
        },
      },
    });

    // Log endorsement event
    await prisma.auditLog.create({
      data: {
        action: 'ebl_endorsed',
        entityType: 'document',
        entityId: documentId,
        userId,
        metadata: {
          endorsementId: endorsement.endorsementId,
          fromParty: fromPartyId,
          toParty: toPartyId,
          endorsementType,
          blockchainTxHash: txHash,
        },
      },
    });

    console.log(`[DCSAeBL] Endorsed eBL ${ebl.eblNumber} from ${fromPartyId} to ${toPartyId}`);

    return ebl;
  }

  /**
   * Surrender eBL (return to carrier, release cargo)
   */
  async surrendereBL(
    documentId: string,
    currentHolderId: string,
    signature: DCSASignature,
    userId: string
  ): Promise<DCSAeBL> {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!doc || !doc.metadata || !(doc.metadata as any).dcsa_ebl) {
      throw new Error('eBL not found');
    }

    const ebl = (doc.metadata as any).dcsa_ebl as DCSAeBL;

    if (ebl.status !== 'issued') {
      throw new Error(`eBL cannot be surrendered. Current status: ${ebl.status}`);
    }

    // Verify current title holder
    if (ebl.titleHolder !== currentHolderId) {
      throw new Error('Only current title holder can surrender eBL');
    }

    // Create surrender endorsement
    const surrenderEndorsement: DCSAEndorsement = {
      endorsementId: crypto.randomBytes(16).toString('hex'),
      fromParty: currentHolderId,
      toParty: ebl.carrier.partyName, // Surrender to carrier
      endorsedAt: new Date(),
      endorsementType: 'surrender',
      signature,
      previousTitleHolder: ebl.titleHolder,
      newTitleHolder: ebl.carrier.partyName,
    };

    // Submit to blockchain
    const txHash = await this.submitEndorsementToBlockchain(surrenderEndorsement);
    surrenderEndorsement.blockchainTxHash = txHash;

    // Add to endorsement chain
    ebl.endorsementChain.push(surrenderEndorsement);

    // Update status to surrendered
    ebl.status = 'surrendered';
    ebl.titleHolder = ebl.carrier.partyName;
    ebl.lastModifiedAt = new Date();

    // Recalculate hash
    ebl.documentHash = this.calculateDocumentHash(ebl);

    // Update database
    await prisma.document.update({
      where: { id: documentId },
      data: {
        metadata: {
          dcsa_ebl: ebl,
        },
      },
    });

    // Log surrender event
    await prisma.auditLog.create({
      data: {
        action: 'ebl_surrendered',
        entityType: 'document',
        entityId: documentId,
        userId,
        metadata: {
          endorsementId: surrenderEndorsement.endorsementId,
          surrenderedBy: currentHolderId,
          blockchainTxHash: txHash,
        },
      },
    });

    console.log(`[DCSAeBL] Surrendered eBL ${ebl.eblNumber}`);

    return ebl;
  }

  /**
   * Mark eBL as accomplished (cargo delivered)
   */
  async accomplisheBL(
    documentId: string,
    userId: string
  ): Promise<DCSAeBL> {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!doc || !doc.metadata || !(doc.metadata as any).dcsa_ebl) {
      throw new Error('eBL not found');
    }

    const ebl = (doc.metadata as any).dcsa_ebl as DCSAeBL;

    if (ebl.status !== 'surrendered') {
      throw new Error(`eBL must be surrendered before accomplishment. Current status: ${ebl.status}`);
    }

    // Update status
    ebl.status = 'accomplished';
    ebl.lastModifiedAt = new Date();

    // Update database
    await prisma.document.update({
      where: { id: documentId },
      data: {
        metadata: {
          dcsa_ebl: ebl,
        },
      },
    });

    // Log accomplishment
    await prisma.auditLog.create({
      data: {
        action: 'ebl_accomplished',
        entityType: 'document',
        entityId: documentId,
        userId,
      },
    });

    console.log(`[DCSAeBL] Accomplished eBL ${ebl.eblNumber}`);

    return ebl;
  }

  /**
   * Get endorsement history
   */
  async getEndorsementHistory(documentId: string): Promise<DCSAEndorsement[]> {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!doc || !doc.metadata || !(doc.metadata as any).dcsa_ebl) {
      throw new Error('eBL not found');
    }

    const ebl = (doc.metadata as any).dcsa_ebl as DCSAeBL;

    return ebl.endorsementChain;
  }

  /**
   * Verify eBL integrity
   */
  async verifyeBLIntegrity(documentId: string): Promise<boolean> {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!doc || !doc.metadata || !(doc.metadata as any).dcsa_ebl) {
      throw new Error('eBL not found');
    }

    const ebl = (doc.metadata as any).dcsa_ebl as DCSAeBL;
    const storedHash = ebl.documentHash;

    // Recalculate hash
    const calculatedHash = this.calculateDocumentHash(ebl);

    return storedHash === calculatedHash;
  }

  /**
   * Generate unique eBL number
   */
  private generateEBLNumber(carrierName: string): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    const carrierPrefix = carrierName.substring(0, 3).toUpperCase();

    return `${carrierPrefix}-EBL-${timestamp}-${random}`;
  }

  /**
   * Calculate document hash
   */
  private calculateDocumentHash(ebl: Partial<DCSAeBL>): string {
    // Create deterministic string representation
    const hashInput = JSON.stringify({
      eblNumber: ebl.eblNumber,
      blNumber: ebl.blNumber,
      carrierBookingReference: ebl.carrierBookingReference,
      shipper: ebl.shipper,
      consignee: ebl.consignee,
      notifyParties: ebl.notifyParties,
      carrier: ebl.carrier,
      cargoDescription: ebl.cargoDescription,
      cargoItems: ebl.cargoItems,
      portOfLoading: ebl.portOfLoading,
      portOfDischarge: ebl.portOfDischarge,
      vesselName: ebl.vesselName,
      vesselIMO: ebl.vesselIMO,
      voyageNumber: ebl.voyageNumber,
      freightPaymentTerms: ebl.freightPaymentTerms,
    });

    return crypto.createHash('sha256').update(hashInput).digest('hex');
  }

  /**
   * Submit eBL to blockchain
   */
  private async submitToBlockchain(ebl: DCSAeBL): Promise<string> {
    // TODO: Implement actual blockchain submission
    // For now, return mock transaction hash
    const mockTxHash = '0x' + crypto.randomBytes(32).toString('hex');

    console.log(`[DCSAeBL] Submitting eBL ${ebl.eblNumber} to blockchain`);
    console.log(`[DCSAeBL] Transaction hash: ${mockTxHash}`);

    return mockTxHash;
  }

  /**
   * Submit endorsement to blockchain
   */
  private async submitEndorsementToBlockchain(endorsement: DCSAEndorsement): Promise<string> {
    // TODO: Implement actual blockchain submission
    // For now, return mock transaction hash
    const mockTxHash = '0x' + crypto.randomBytes(32).toString('hex');

    console.log(`[DCSAeBL] Submitting endorsement ${endorsement.endorsementId} to blockchain`);
    console.log(`[DCSAeBL] Transaction hash: ${mockTxHash}`);

    return mockTxHash;
  }

  /**
   * Export eBL to DCSA JSON format
   */
  exportToDCSAJSON(ebl: DCSAeBL): string {
    return JSON.stringify({
      dcsaVersion: '3.0.0',
      documentType: 'transportDocument',
      transportDocumentTypeCode: 'BOL',
      isElectronic: true,
      ...ebl,
    }, null, 2);
  }

  /**
   * Import eBL from DCSA JSON format
   */
  importFromDCSAJSON(json: string): DCSAeBL {
    const data = JSON.parse(json);

    if (data.dcsaVersion !== '3.0.0') {
      throw new Error('Unsupported DCSA version');
    }

    if (data.documentType !== 'transportDocument') {
      throw new Error('Invalid document type');
    }

    return data as DCSAeBL;
  }
}

// Singleton instance
export const dcsaEBLService = new DCSAeBLService();
