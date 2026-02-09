// ebl-blockchain.ts — Blockchain-based Electronic Bill of Lading (eBL)

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

export enum EBLStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  ENDORSED = 'endorsed',
  SURRENDERED = 'surrendered',
  ACCOMPLISHED = 'accomplished',
  CANCELLED = 'cancelled',
}

export enum EBLType {
  MASTER = 'master',
  HOUSE = 'house',
  SEAWAY = 'seaway',
}

interface EBLData {
  bolNumber: string;
  type: EBLType;
  issuer: {
    name: string;
    address: string;
    organizationId: string;
  };
  shipper: {
    name: string;
    address: string;
    contact?: string;
  };
  consignee: {
    name: string;
    address: string;
    contact?: string;
  };
  notifyParty?: {
    name: string;
    address: string;
    contact?: string;
  };
  vessel: {
    name: string;
    imo?: string;
    voyage?: string;
  };
  portOfLoading: {
    name: string;
    locode: string;
    country: string;
  };
  portOfDischarge: {
    name: string;
    locode: string;
    country: string;
  };
  cargo: {
    description: string;
    quantity: number;
    unit: string;
    weight: number;
    weightUnit: string;
    marks?: string;
    containers?: string[];
  };
  freightTerms: 'prepaid' | 'collect';
  freightAmount?: number;
  currency?: string;
  numberOfOriginals: number;
  shippedOnBoardDate: Date;
  placeOfIssue: string;
  dateOfIssue: Date;
}

interface BlockchainRecord {
  blockHash: string;
  previousHash: string;
  timestamp: Date;
  action: string;
  actor: string;
  data: any;
  signature: string;
}

interface EBLTransferRequest {
  eblId: string;
  fromParty: string;
  toParty: string;
  transferType: 'endorsement' | 'surrender';
  signature: string;
  timestamp: Date;
}

export class EBLBlockchainService {
  private readonly GENESIS_HASH = '0'.repeat(64);

  /**
   * Issue new eBL (create blockchain record)
   */
  async issueEBL(
    data: EBLData,
    issuerUserId: string,
    issuerPrivateKey: string
  ): Promise<{ eblId: string; blockHash: string }> {
    // 1. Validate eBL data
    this.validateEBLData(data);

    // 2. Create eBL record in database
    const ebl = await prisma.eBL.create({
      data: {
        bolNumber: data.bolNumber,
        type: data.type,
        status: EBLStatus.ISSUED,
        organizationId: data.issuer.organizationId,
        issuerUserId,

        // Party data (stored as JSON)
        shipper: data.shipper as any,
        consignee: data.consignee as any,
        notifyParty: data.notifyParty as any,

        // Vessel data
        vesselName: data.vessel.name,
        vesselImo: data.vessel.imo,
        voyageNumber: data.vessel.voyage,

        // Port data
        portOfLoading: data.portOfLoading.locode,
        portOfDischarge: data.portOfDischarge.locode,

        // Cargo data
        cargoDescription: data.cargo.description,
        cargoQuantity: data.cargo.quantity,
        cargoUnit: data.cargo.unit,
        cargoWeight: data.cargo.weight,
        cargoWeightUnit: data.cargo.weightUnit,
        cargoMarks: data.cargo.marks,
        containers: data.cargo.containers,

        // Commercial terms
        freightTerms: data.freightTerms,
        freightAmount: data.freightAmount,
        currency: data.currency,

        // Dates
        shippedOnBoardDate: data.shippedOnBoardDate,
        dateOfIssue: data.dateOfIssue,
        placeOfIssue: data.placeOfIssue,

        numberOfOriginals: data.numberOfOriginals,

        // Blockchain
        blockchainRecords: [],
        currentHolder: data.shipper.name,
      },
    });

    // 3. Create genesis block (issuance)
    const genesisBlock = await this.createBlock(
      ebl.id,
      this.GENESIS_HASH,
      'ISSUED',
      issuerUserId,
      data,
      issuerPrivateKey
    );

    // 4. Store blockchain record
    await prisma.eBL.update({
      where: { id: ebl.id },
      data: {
        blockchainRecords: [genesisBlock] as any,
        latestBlockHash: genesisBlock.blockHash,
      },
    });

    // 5. Create activity log
    await prisma.activityLog.create({
      data: {
        organizationId: data.issuer.organizationId,
        userId: issuerUserId,
        action: 'ebl_issued',
        entityType: 'ebl',
        entityId: ebl.id,
        metadata: {
          bolNumber: data.bolNumber,
          shipper: data.shipper.name,
          consignee: data.consignee.name,
          blockHash: genesisBlock.blockHash,
        },
      },
    });

    return {
      eblId: ebl.id,
      blockHash: genesisBlock.blockHash,
    };
  }

  /**
   * Endorse eBL (transfer to new party)
   */
  async endorseEBL(
    eblId: string,
    endorsement: {
      fromParty: string;
      toParty: string;
      toPartyAddress: string;
      endorsedBy: string;
      endorsedByUserId: string;
      signature: string;
    }
  ): Promise<{ blockHash: string }> {
    // 1. Get current eBL
    const ebl = await prisma.eBL.findUnique({
      where: { id: eblId },
    });

    if (!ebl) throw new Error('eBL not found');
    if (ebl.status === EBLStatus.SURRENDERED) throw new Error('eBL already surrendered');
    if (ebl.status === EBLStatus.ACCOMPLISHED) throw new Error('eBL already accomplished');
    if (ebl.status === EBLStatus.CANCELLED) throw new Error('eBL cancelled');

    // 2. Verify current holder
    if (ebl.currentHolder !== endorsement.fromParty) {
      throw new Error(`Current holder is ${ebl.currentHolder}, not ${endorsement.fromParty}`);
    }

    // 3. Verify signature
    const isValid = this.verifySignature(
      {
        eblId,
        fromParty: endorsement.fromParty,
        toParty: endorsement.toParty,
        action: 'ENDORSE',
      },
      endorsement.signature
    );

    if (!isValid) throw new Error('Invalid signature');

    // 4. Create endorsement block
    const previousHash = ebl.latestBlockHash || this.GENESIS_HASH;
    const endorsementBlock = await this.createBlock(
      eblId,
      previousHash,
      'ENDORSED',
      endorsement.endorsedByUserId,
      {
        fromParty: endorsement.fromParty,
        toParty: endorsement.toParty,
        toPartyAddress: endorsement.toPartyAddress,
        endorsedBy: endorsement.endorsedBy,
      },
      endorsement.signature
    );

    // 5. Update eBL
    const updatedRecords = [...(ebl.blockchainRecords as BlockchainRecord[]), endorsementBlock];

    await prisma.eBL.update({
      where: { id: eblId },
      data: {
        status: EBLStatus.ENDORSED,
        currentHolder: endorsement.toParty,
        blockchainRecords: updatedRecords as any,
        latestBlockHash: endorsementBlock.blockHash,
      },
    });

    // 6. Create activity log
    await prisma.activityLog.create({
      data: {
        organizationId: ebl.organizationId,
        userId: endorsement.endorsedByUserId,
        action: 'ebl_endorsed',
        entityType: 'ebl',
        entityId: eblId,
        metadata: {
          bolNumber: ebl.bolNumber,
          fromParty: endorsement.fromParty,
          toParty: endorsement.toParty,
          blockHash: endorsementBlock.blockHash,
        },
      },
    });

    return {
      blockHash: endorsementBlock.blockHash,
    };
  }

  /**
   * Surrender eBL (consignee takes delivery)
   */
  async surrenderEBL(
    eblId: string,
    surrender: {
      surrenderedBy: string;
      surrenderedByUserId: string;
      deliveryLocation: string;
      signature: string;
    }
  ): Promise<{ blockHash: string }> {
    // 1. Get current eBL
    const ebl = await prisma.eBL.findUnique({
      where: { id: eblId },
    });

    if (!ebl) throw new Error('eBL not found');
    if (ebl.status === EBLStatus.SURRENDERED) throw new Error('eBL already surrendered');
    if (ebl.status === EBLStatus.ACCOMPLISHED) throw new Error('eBL already accomplished');

    // 2. Verify current holder
    if (ebl.currentHolder !== surrender.surrenderedBy) {
      throw new Error(`Current holder is ${ebl.currentHolder}, not ${surrender.surrenderedBy}`);
    }

    // 3. Verify signature
    const isValid = this.verifySignature(
      {
        eblId,
        surrenderedBy: surrender.surrenderedBy,
        action: 'SURRENDER',
      },
      surrender.signature
    );

    if (!isValid) throw new Error('Invalid signature');

    // 4. Create surrender block
    const previousHash = ebl.latestBlockHash || this.GENESIS_HASH;
    const surrenderBlock = await this.createBlock(
      eblId,
      previousHash,
      'SURRENDERED',
      surrender.surrenderedByUserId,
      {
        surrenderedBy: surrender.surrenderedBy,
        deliveryLocation: surrender.deliveryLocation,
        surrenderedAt: new Date(),
      },
      surrender.signature
    );

    // 5. Update eBL
    const updatedRecords = [...(ebl.blockchainRecords as BlockchainRecord[]), surrenderBlock];

    await prisma.eBL.update({
      where: { id: eblId },
      data: {
        status: EBLStatus.SURRENDERED,
        blockchainRecords: updatedRecords as any,
        latestBlockHash: surrenderBlock.blockHash,
        surrenderedAt: new Date(),
      },
    });

    // 6. Create activity log
    await prisma.activityLog.create({
      data: {
        organizationId: ebl.organizationId,
        userId: surrender.surrenderedByUserId,
        action: 'ebl_surrendered',
        entityType: 'ebl',
        entityId: eblId,
        metadata: {
          bolNumber: ebl.bolNumber,
          surrenderedBy: surrender.surrenderedBy,
          deliveryLocation: surrender.deliveryLocation,
          blockHash: surrenderBlock.blockHash,
        },
      },
    });

    return {
      blockHash: surrenderBlock.blockHash,
    };
  }

  /**
   * Verify eBL blockchain integrity
   */
  async verifyBlockchain(eblId: string): Promise<{
    isValid: boolean;
    errors: string[];
    blockCount: number;
  }> {
    const ebl = await prisma.eBL.findUnique({
      where: { id: eblId },
    });

    if (!ebl) throw new Error('eBL not found');

    const records = ebl.blockchainRecords as BlockchainRecord[];
    const errors: string[] = [];

    // 1. Verify chain continuity
    for (let i = 0; i < records.length; i++) {
      const block = records[i];

      // Verify previous hash
      if (i === 0) {
        if (block.previousHash !== this.GENESIS_HASH) {
          errors.push(`Block 0: Invalid genesis hash`);
        }
      } else {
        const previousBlock = records[i - 1];
        if (block.previousHash !== previousBlock.blockHash) {
          errors.push(`Block ${i}: Previous hash mismatch`);
        }
      }

      // Verify block hash
      const calculatedHash = this.calculateBlockHash(
        block.previousHash,
        block.timestamp,
        block.action,
        block.actor,
        block.data
      );

      if (calculatedHash !== block.blockHash) {
        errors.push(`Block ${i}: Hash mismatch (tampered?)`);
      }

      // Verify signature
      const isValidSignature = this.verifySignature(
        {
          eblId,
          action: block.action,
          data: block.data,
        },
        block.signature
      );

      if (!isValidSignature) {
        errors.push(`Block ${i}: Invalid signature`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      blockCount: records.length,
    };
  }

  /**
   * Get eBL history (blockchain audit trail)
   */
  async getEBLHistory(eblId: string): Promise<{
    bolNumber: string;
    currentStatus: EBLStatus;
    currentHolder: string;
    history: Array<{
      blockNumber: number;
      action: string;
      actor: string;
      timestamp: Date;
      data: any;
      blockHash: string;
    }>;
  }> {
    const ebl = await prisma.eBL.findUnique({
      where: { id: eblId },
    });

    if (!ebl) throw new Error('eBL not found');

    const records = ebl.blockchainRecords as BlockchainRecord[];

    const history = records.map((record, index) => ({
      blockNumber: index,
      action: record.action,
      actor: record.actor,
      timestamp: record.timestamp,
      data: record.data,
      blockHash: record.blockHash,
    }));

    return {
      bolNumber: ebl.bolNumber,
      currentStatus: ebl.status as EBLStatus,
      currentHolder: ebl.currentHolder || 'N/A',
      history,
    };
  }

  /**
   * Create blockchain block
   */
  private async createBlock(
    eblId: string,
    previousHash: string,
    action: string,
    actorUserId: string,
    data: any,
    signature: string
  ): Promise<BlockchainRecord> {
    const timestamp = new Date();

    const blockHash = this.calculateBlockHash(previousHash, timestamp, action, actorUserId, data);

    return {
      blockHash,
      previousHash,
      timestamp,
      action,
      actor: actorUserId,
      data,
      signature,
    };
  }

  /**
   * Calculate block hash (SHA-256)
   */
  private calculateBlockHash(
    previousHash: string,
    timestamp: Date,
    action: string,
    actor: string,
    data: any
  ): string {
    const content = JSON.stringify({
      previousHash,
      timestamp: timestamp.toISOString(),
      action,
      actor,
      data,
    });

    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Verify digital signature
   */
  private verifySignature(data: any, signature: string): boolean {
    // In production, use proper public/private key cryptography (RSA, ECDSA)
    // For now, simulate signature verification

    const expectedSignature = crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')
      .substring(0, 32);

    return signature.startsWith(expectedSignature.substring(0, 16));
  }

  /**
   * Validate eBL data
   */
  private validateEBLData(data: EBLData): void {
    if (!data.bolNumber) throw new Error('BOL number required');
    if (!data.shipper?.name) throw new Error('Shipper name required');
    if (!data.consignee?.name) throw new Error('Consignee name required');
    if (!data.vessel?.name) throw new Error('Vessel name required');
    if (!data.portOfLoading?.locode) throw new Error('Port of loading required');
    if (!data.portOfDischarge?.locode) throw new Error('Port of discharge required');
    if (!data.cargo?.description) throw new Error('Cargo description required');
    if (!data.shippedOnBoardDate) throw new Error('Shipped on board date required');
    if (!data.dateOfIssue) throw new Error('Date of issue required');
  }

  /**
   * Generate digital signature (helper for clients)
   */
  generateSignature(data: any, privateKey: string): string {
    // In production, use proper private key signing (RSA, ECDSA)
    // For now, simulate signature generation

    const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');

    // Simulate signing with private key
    const signature = crypto
      .createHash('sha256')
      .update(hash + privateKey)
      .digest('hex')
      .substring(0, 32);

    return signature;
  }

  /**
   * Export eBL to PDF (for printing/archival)
   */
  async exportToPDF(eblId: string): Promise<string> {
    const ebl = await prisma.eBL.findUnique({
      where: { id: eblId },
    });

    if (!ebl) throw new Error('eBL not found');

    // Generate PDF content (Markdown format - convert to PDF with external tool)
    const pdfContent = `
# ELECTRONIC BILL OF LADING

**B/L Number:** ${ebl.bolNumber}
**Type:** ${ebl.type.toUpperCase()}
**Status:** ${ebl.status.toUpperCase()}

---

## PARTIES

**Shipper:**
${(ebl.shipper as any)?.name || 'N/A'}
${(ebl.shipper as any)?.address || ''}

**Consignee:**
${(ebl.consignee as any)?.name || 'N/A'}
${(ebl.consignee as any)?.address || ''}

**Notify Party:**
${(ebl.notifyParty as any)?.name || 'N/A'}

---

## VESSEL & VOYAGE

**Vessel:** ${ebl.vesselName}
${ebl.vesselImo ? `**IMO:** ${ebl.vesselImo}` : ''}
${ebl.voyageNumber ? `**Voyage:** ${ebl.voyageNumber}` : ''}

---

## PORTS

**Port of Loading:** ${ebl.portOfLoading}
**Port of Discharge:** ${ebl.portOfDischarge}

---

## CARGO

**Description:** ${ebl.cargoDescription}
**Quantity:** ${ebl.cargoQuantity} ${ebl.cargoUnit}
**Weight:** ${ebl.cargoWeight} ${ebl.cargoWeightUnit}
${ebl.cargoMarks ? `**Marks:** ${ebl.cargoMarks}` : ''}

---

## FREIGHT

**Terms:** ${ebl.freightTerms.toUpperCase()}
${ebl.freightAmount ? `**Amount:** ${ebl.currency || 'USD'} ${ebl.freightAmount}` : ''}

---

## DATES

**Shipped on Board:** ${ebl.shippedOnBoardDate.toISOString().split('T')[0]}
**Date of Issue:** ${ebl.dateOfIssue.toISOString().split('T')[0]}
**Place of Issue:** ${ebl.placeOfIssue}

---

## BLOCKCHAIN VERIFICATION

**Latest Block Hash:** ${ebl.latestBlockHash}
**Number of Blocks:** ${(ebl.blockchainRecords as any[])?.length || 0}
**Current Holder:** ${ebl.currentHolder}

---

**This is an electronically issued Bill of Lading secured by blockchain technology.**
**Verify authenticity at: https://mari8x.com/verify/${ebl.id}**

_Issued by Mari8X Platform on ${new Date().toISOString()}_
`;

    return pdfContent;
  }
}

export const eblBlockchain = new EBLBlockchainService();
