/**
 * SNP Delivery & Acceptance Documentation Service
 * Manages delivery protocols, acceptance procedures, and handover documentation
 *
 * @module services/snp-delivery-acceptance
 */

import { prisma } from '../schema/context.js';

export interface DeliveryProtocol {
  id: string;
  transactionId: string;
  vesselId: string;
  vesselName: string;

  // Location & Time
  deliveryPort: string;
  deliveryDate: Date;
  deliveryTime: string;
  timezone: string;

  // Parties Present
  sellerRepresentatives: PartyRepresentative[];
  buyerRepresentatives: PartyRepresentative[];
  witnesses?: PartyRepresentative[];

  // Vessel Condition
  vesselCondition: VesselConditionReport;

  // Handover Items
  documentsHandedOver: HandoverDocument[];
  physicalItems: PhysicalItem[];
  storesAndBunkers: StoresInventory;

  // Acceptance
  buyerAcceptance: {
    accepted: boolean;
    acceptedBy: string;
    acceptedAt: Date;
    conditions?: string[];
    reservations?: string[];
  };

  // Signatures
  sellerSignature?: SignatureData;
  buyerSignature?: SignatureData;

  // Protocol Document
  protocolDocumentUrl?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'disputed';
}

export interface PartyRepresentative {
  name: string;
  role: string;
  company: string;
  email: string;
  phone?: string;
  idType?: string;
  idNumber?: string;
}

export interface VesselConditionReport {
  overallCondition: 'excellent' | 'good' | 'fair' | 'poor';
  hullCondition: string;
  machineryCondition: string;
  accommodationCondition: string;
  safetyEquipmentStatus: string;
  navigationEquipmentStatus: string;
  defectsNoted: Defect[];
  surveyRequired: boolean;
  photos: string[];
}

export interface Defect {
  location: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  estimatedCost?: number;
  agreedResolution?: string;
}

export interface HandoverDocument {
  documentType: string;
  documentName: string;
  originalProvided: boolean;
  copyProvided: boolean;
  notes?: string;
}

export interface PhysicalItem {
  itemType: string;
  itemName: string;
  quantity: number;
  condition: string;
  handedOver: boolean;
  notes?: string;
}

export interface StoresInventory {
  fuelOil: { quantity: number; grade: string; price: number };
  dieselOil: { quantity: number; grade: string; price: number };
  lubricatingOil: { quantity: number; type: string; price: number };
  freshWater: { quantity: number; price: number };
  provisions: { estimatedValue: number; inventoryProvided: boolean };
  spares: { estimatedValue: number; inventoryProvided: boolean };
  totalValue: number;
  paymentMethod: 'included' | 'separate_invoice' | 'buyer_accepts';
}

export interface SignatureData {
  signedBy: string;
  signedAt: Date;
  signatureUrl?: string;
  ipAddress?: string;
}

class SNPDeliveryAcceptanceService {
  /**
   * Create delivery protocol
   */
  async createDeliveryProtocol(
    transactionId: string,
    vesselId: string,
    deliveryDetails: {
      deliveryPort: string;
      deliveryDate: Date;
      deliveryTime: string;
    },
    organizationId: string
  ): Promise<DeliveryProtocol> {
    const vessel = await prisma.vessel.findUnique({
      where: { id: vesselId },
    });

    if (!vessel) {
      throw new Error('Vessel not found');
    }

    const protocol: DeliveryProtocol = {
      id: `DELV-${Date.now()}`,
      transactionId,
      vesselId,
      vesselName: vessel.name,
      deliveryPort: deliveryDetails.deliveryPort,
      deliveryDate: deliveryDetails.deliveryDate,
      deliveryTime: deliveryDetails.deliveryTime,
      timezone: 'UTC',
      sellerRepresentatives: [],
      buyerRepresentatives: [],
      vesselCondition: this.initializeConditionReport(),
      documentsHandedOver: this.getStandardDocumentsList(),
      physicalItems: this.getStandardPhysicalItems(),
      storesAndBunkers: this.initializeStoresInventory(),
      buyerAcceptance: {
        accepted: false,
        acceptedBy: '',
        acceptedAt: new Date(),
      },
      status: 'draft',
    };

    return protocol;
  }

  private initializeConditionReport(): VesselConditionReport {
    return {
      overallCondition: 'good',
      hullCondition: 'To be inspected',
      machineryCondition: 'To be inspected',
      accommodationCondition: 'To be inspected',
      safetyEquipmentStatus: 'To be verified',
      navigationEquipmentStatus: 'To be verified',
      defectsNoted: [],
      surveyRequired: false,
      photos: [],
    };
  }

  private getStandardDocumentsList(): HandoverDocument[] {
    return [
      { documentType: 'registry', documentName: 'Certificate of Registry', originalProvided: false, copyProvided: false },
      { documentType: 'deletion', documentName: 'Deletion Certificate', originalProvided: false, copyProvided: false },
      { documentType: 'class', documentName: 'Class Certificates', originalProvided: false, copyProvided: false },
      { documentType: 'tonnage', documentName: 'Tonnage Certificate', originalProvided: false, copyProvided: false },
      { documentType: 'safety', documentName: 'Safety Equipment Certificate', originalProvided: false, copyProvided: false },
      { documentType: 'loadline', documentName: 'Load Line Certificate', originalProvided: false, copyProvided: false },
      { documentType: 'ism', documentName: 'ISM Certificate (DOC & SMC)', originalProvided: false, copyProvided: false },
      { documentType: 'isps', documentName: 'ISPS Certificate', originalProvided: false, copyProvided: false },
      { documentType: 'plans', documentName: 'General Arrangement Plans', originalProvided: false, copyProvided: false },
      { documentType: 'stability', documentName: 'Stability Booklet', originalProvided: false, copyProvided: false },
      { documentType: 'manuals', documentName: 'Machinery Manuals', originalProvided: false, copyProvided: false },
      { documentType: 'logbooks', documentName: 'Official Logbooks', originalProvided: false, copyProvided: false },
    ];
  }

  private getStandardPhysicalItems(): PhysicalItem[] {
    return [
      { itemType: 'flag', itemName: 'National Flag', quantity: 2, condition: '', handedOver: false },
      { itemType: 'seal', itemName: 'Ship Seal/Stamp', quantity: 1, condition: '', handedOver: false },
      { itemType: 'keys', itemName: 'Master Keys Set', quantity: 1, condition: '', handedOver: false },
      { itemType: 'safe', itemName: 'Safe Keys', quantity: 2, condition: '', handedOver: false },
      { itemType: 'equipment', itemName: 'Satellite Phone', quantity: 1, condition: '', handedOver: false },
      { itemType: 'equipment', itemName: 'VHF Radios (Portable)', quantity: 4, condition: '', handedOver: false },
    ];
  }

  private initializeStoresInventory(): StoresInventory {
    return {
      fuelOil: { quantity: 0, grade: 'IFO 380', price: 0 },
      dieselOil: { quantity: 0, grade: 'MGO', price: 0 },
      lubricatingOil: { quantity: 0, type: 'System Oil', price: 0 },
      freshWater: { quantity: 0, price: 0 },
      provisions: { estimatedValue: 0, inventoryProvided: false },
      spares: { estimatedValue: 0, inventoryProvided: false },
      totalValue: 0,
      paymentMethod: 'buyer_accepts',
    };
  }

  /**
   * Record vessel condition at delivery
   */
  async recordVesselCondition(
    protocolId: string,
    condition: VesselConditionReport,
    organizationId: string
  ): Promise<VesselConditionReport> {
    // Update protocol with condition report
    // In production, update database

    // If critical defects found, create alert
    const criticalDefects = condition.defectsNoted.filter(
      (d) => d.severity === 'critical'
    );

    if (criticalDefects.length > 0) {
      await prisma.alert.create({
        data: {
          type: 'delivery_critical_defects',
          severity: 'high',
          title: `Critical Defects Found at Delivery`,
          message: `${criticalDefects.length} critical defects discovered during vessel handover`,
          metadata: { protocolId, defects: criticalDefects },
          organizationId,
        },
      });
    }

    return condition;
  }

  /**
   * Calculate stores and bunkers value
   */
  async calculateStoresValue(
    protocolId: string,
    bunkerPrices: {
      fuelOil: number;
      dieselOil: number;
      lubOil: number;
      water: number;
    },
    organizationId: string
  ): Promise<StoresInventory> {
    // Get protocol
    // const protocol = await this.getProtocol(protocolId);

    // Mock for now
    const stores: StoresInventory = {
      fuelOil: { quantity: 250, grade: 'IFO 380', price: 250 * bunkerPrices.fuelOil },
      dieselOil: { quantity: 50, grade: 'MGO', price: 50 * bunkerPrices.dieselOil },
      lubricatingOil: { quantity: 5, type: 'System Oil', price: 5 * bunkerPrices.lubOil },
      freshWater: { quantity: 100, price: 100 * bunkerPrices.water },
      provisions: { estimatedValue: 10000, inventoryProvided: true },
      spares: { estimatedValue: 25000, inventoryProvided: true },
      totalValue: 0,
      paymentMethod: 'separate_invoice',
    };

    stores.totalValue =
      stores.fuelOil.price +
      stores.dieselOil.price +
      stores.lubricatingOil.price +
      stores.freshWater.price +
      stores.provisions.estimatedValue +
      stores.spares.estimatedValue;

    return stores;
  }

  /**
   * Record buyer acceptance
   */
  async recordBuyerAcceptance(
    protocolId: string,
    acceptance: {
      accepted: boolean;
      acceptedBy: string;
      conditions?: string[];
      reservations?: string[];
    },
    organizationId: string
  ): Promise<boolean> {
    // Update protocol
    // await prisma.deliveryProtocol.update({
    //   where: { id: protocolId },
    //   data: {
    //     buyerAcceptance: {
    //       ...acceptance,
    //       acceptedAt: new Date()
    //     },
    //     status: acceptance.accepted ? 'completed' : 'disputed'
    //   }
    // });

    // If accepted, update transaction status
    // if (acceptance.accepted) {
    //   await prisma.sNPTransaction.update({
    //     where: { id: protocol.transactionId },
    //     data: { status: 'completed', deliveryDate: new Date() }
    //   });
    // }

    return acceptance.accepted;
  }

  /**
   * Generate Protocol of Delivery document
   */
  async generateProtocolDocument(
    protocolId: string,
    organizationId: string
  ): Promise<string> {
    // Get protocol
    // const protocol = await this.getProtocol(protocolId);

    // Mock protocol
    const protocol: Partial<DeliveryProtocol> = {
      vesselName: 'MV Example',
      deliveryPort: 'Singapore',
      deliveryDate: new Date(),
      deliveryTime: '14:00',
    };

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Protocol of Delivery and Acceptance</title>
  <style>
    body { font-family: 'Times New Roman', serif; max-width: 210mm; margin: 0 auto; padding: 20mm; }
    h1 { text-align: center; font-size: 18pt; }
    h2 { font-size: 14pt; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    td, th { padding: 8px; border: 1px solid #000; }
    .signature-block { margin-top: 60px; }
    .signature-line { border-top: 1px solid black; width: 200px; display: inline-block; }
  </style>
</head>
<body>
  <h1>PROTOCOL OF DELIVERY AND ACCEPTANCE</h1>

  <p><strong>Vessel:</strong> ${protocol.vesselName}</p>
  <p><strong>Location:</strong> ${protocol.deliveryPort}</p>
  <p><strong>Date:</strong> ${protocol.deliveryDate?.toLocaleDateString()}</p>
  <p><strong>Time:</strong> ${protocol.deliveryTime} (Local Time)</p>

  <h2>PARTIES PRESENT</h2>
  <p><strong>On behalf of the Sellers:</strong></p>
  <ul>
    <li>Name, Title, Company</li>
  </ul>

  <p><strong>On behalf of the Buyers:</strong></p>
  <ul>
    <li>Name, Title, Company</li>
  </ul>

  <h2>VESSEL CONDITION</h2>
  <p>The vessel was inspected and found to be in <strong>GOOD</strong> condition, suitable for immediate operation.</p>

  <h2>DOCUMENTS HANDED OVER</h2>
  <table>
    <tr><th>Document</th><th>Original</th><th>Copy</th></tr>
    <tr><td>Certificate of Registry</td><td>✓</td><td>✓</td></tr>
    <tr><td>Class Certificates</td><td>✓</td><td>✓</td></tr>
    <tr><td>Safety Equipment Certificate</td><td>✓</td><td></td></tr>
    <!-- More rows -->
  </table>

  <h2>PHYSICAL ITEMS TRANSFERRED</h2>
  <ul>
    <li>National Flags (2 sets)</li>
    <li>Ship Seal and Stamp</li>
    <li>Master Keys</li>
    <li>Safe Keys</li>
  </ul>

  <h2>STORES AND BUNKERS</h2>
  <p>Fuel Oil: XXX MT at $XXX/MT = $XXX,XXX</p>
  <p>Diesel Oil: XXX MT at $XXX/MT = $XXX,XXX</p>
  <p>Total Value: $XXX,XXX</p>

  <h2>ACCEPTANCE</h2>
  <p>The Buyers hereby accept delivery of the vessel in her present condition.</p>

  <div class="signature-block">
    <table style="border: none;">
      <tr>
        <td style="border: none; width: 50%;">
          <p><strong>FOR THE SELLERS:</strong></p>
          <p style="margin-top: 60px;">
            <span class="signature-line"></span><br>
            <small>Name & Title</small><br>
            <small>Date: ${new Date().toLocaleDateString()}</small>
          </p>
        </td>
        <td style="border: none; width: 50%;">
          <p><strong>FOR THE BUYERS:</strong></p>
          <p style="margin-top: 60px;">
            <span class="signature-line"></span><br>
            <small>Name & Title</small><br>
            <small>Date: ${new Date().toLocaleDateString()}</small>
          </p>
        </td>
      </tr>
    </table>
  </div>

  <p style="text-align: center; margin-top: 60px; font-size: 10pt;">
    This document was generated by Mari8X Platform
  </p>
</body>
</html>
    `.trim();

    return html;
  }

  /**
   * Generate handover checklist
   */
  generateHandoverChecklist(): string {
    return `
# Vessel Handover Checklist

## Pre-Delivery (1 day before)
- [ ] Confirm delivery time and location
- [ ] All parties notified and confirmed attendance
- [ ] Payment confirmed received in full
- [ ] All subjects cleared
- [ ] Deletion certificate obtained
- [ ] Bill of Sale prepared and ready
- [ ] Vessel clean and ready for inspection

## At Delivery
### Documentation Check
- [ ] Original registry certificate
- [ ] Deletion certificate from old flag
- [ ] Class certificates (all current)
- [ ] Safety equipment certificate
- [ ] Load line certificate
- [ ] Tonnage certificate
- [ ] ISM certificates (DOC & SMC)
- [ ] ISPS certificate
- [ ] All survey reports
- [ ] Stability booklet
- [ ] Damage stability booklet
- [ ] General arrangement plans
- [ ] Machinery manuals
- [ ] Logbooks (official, engine, oil record, garbage)

### Physical Inspection
- [ ] Hull exterior condition
- [ ] Main engine condition and test
- [ ] Auxiliary engines test
- [ ] Generators test
- [ ] Steering gear test
- [ ] Anchors and windlass test
- [ ] Cargo gear operation
- [ ] Navigation equipment test
- [ ] Communication equipment test
- [ ] Safety equipment inspection
- [ ] Firefighting equipment inspection
- [ ] Accommodation inspection
- [ ] Galley and provisions
- [ ] Fresh water tanks
- [ ] Fuel tanks and bunkers
- [ ] Lube oil tanks

### Items Handover
- [ ] National flags
- [ ] Ship seal/stamp
- [ ] Master keys (all sets)
- [ ] Safe keys
- [ ] Important equipment keys
- [ ] Satellite phone
- [ ] Portable VHF radios
- [ ] EPIRB and SART
- [ ] Immersion suits (correct quantity)
- [ ] Liferaft service certificates

### Stores & Bunkers
- [ ] Fuel oil ROB (record quantity and quality)
- [ ] Diesel oil ROB
- [ ] Lube oil inventory
- [ ] Fresh water ROB
- [ ] Provisions inventory
- [ ] Bonded stores inventory
- [ ] Spare parts inventory
- [ ] Chemicals and paints inventory

### Signatures
- [ ] Protocol of Delivery signed by both parties
- [ ] Bill of Sale signed by both parties
- [ ] Delivery photos taken
- [ ] All handover documents photocopied

## Post-Delivery (Same Day)
- [ ] Notify P&I club of delivery
- [ ] Notify H&M underwriters
- [ ] Notify class society
- [ ] Apply for provisional registry certificate
- [ ] Update AIS information
- [ ] Change vessel name (if applicable)
- [ ] Brief master on new ownership
- [ ] Update crew contracts
    `.trim();
  }
}

export const snpDeliveryAcceptanceService = new SNPDeliveryAcceptanceService();
