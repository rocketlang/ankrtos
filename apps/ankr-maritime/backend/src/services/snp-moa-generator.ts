/**
 * SNP MOA (Memorandum of Agreement) Generator Service
 * Generates standardized MOA documents for vessel sale transactions
 *
 * @module services/snp-moa-generator
 */

import { prisma } from '../schema/context.js';

export interface MOAClause {
  clauseNumber: string;
  title: string;
  content: string;
  isOptional: boolean;
}

export interface MOATerms {
  // Parties
  sellersName: string;
  sellersAddress: string;
  buyersName: string;
  buyersAddress: string;

  // Vessel
  vesselName: string;
  imo: string;
  flag: string;
  classificationSociety: string;
  yearBuilt: number;
  dwt: number;
  grt: number;

  // Commercial
  purchasePrice: number;
  currency: string;
  depositAmount: number;
  depositDueDate: Date;
  balancePaymentDate: Date;

  // Delivery
  deliveryPort: string;
  deliveryDateRange: {
    earliest: Date;
    latest: Date;
  };

  // Conditions
  subjectToInspection: boolean;
  inspectionDeadline?: Date;
  subjectToFinance: boolean;
  financeDeadline?: Date;
  subjectToBoardApproval: boolean;
  boardApprovalDeadline?: Date;

  // Special clauses
  includedItems: string[];
  excludedItems: string[];
  specialConditions: string[];

  // Legal
  governingLaw: string;
  arbitrationVenue: string;
}

export interface GeneratedMOA {
  moaId: string;
  documentTitle: string;
  generatedAt: Date;
  terms: MOATerms;
  clauses: MOAClause[];
  htmlContent: string;
  pdfUrl?: string;
  status: 'draft' | 'pending_signature' | 'signed' | 'completed';
}

class SNPMOAGeneratorService {
  /**
   * Standard MOA clauses (based on Saleform 2012)
   */
  private getStandardClauses(terms: MOATerms): MOAClause[] {
    return [
      {
        clauseNumber: '1',
        title: 'Purchase and Sale',
        content: `The Sellers agree to sell and the Buyers agree to purchase the Vessel "${terms.vesselName}" (IMO ${terms.imo}) on an "as is, where is" basis, free from all encumbrances and maritime liens, for the sum of ${terms.currency} ${terms.purchasePrice.toLocaleString()}.`,
        isOptional: false,
      },
      {
        clauseNumber: '2',
        title: 'Deposit',
        content: `The Buyers shall pay a deposit of ${terms.currency} ${terms.depositAmount.toLocaleString()} (${((terms.depositAmount / terms.purchasePrice) * 100).toFixed(0)}% of Purchase Price) within ${this.formatBusinessDays(terms.depositDueDate)} to the Sellers' nominated bank account. The deposit shall be held as security for the Buyers' performance and shall be applied towards the Purchase Price on Closing.`,
        isOptional: false,
      },
      {
        clauseNumber: '3',
        title: 'Payment',
        content: `The balance of the Purchase Price (${terms.currency} ${(terms.purchasePrice - terms.depositAmount).toLocaleString()}) shall be paid by the Buyers to the Sellers on or before ${terms.balancePaymentDate.toLocaleDateString()} by telegraphic transfer in immediately available funds to the Sellers' nominated bank account.`,
        isOptional: false,
      },
      {
        clauseNumber: '4',
        title: 'Delivery',
        content: `The Vessel shall be delivered and taken over by the Buyers at ${terms.deliveryPort} in the Vessel's current condition and position, between ${terms.deliveryDateRange.earliest.toLocaleDateString()} and ${terms.deliveryDateRange.latest.toLocaleDateString()}, both dates inclusive. The exact date and time of delivery shall be mutually agreed between the Parties at least 7 days prior to delivery.`,
        isOptional: false,
      },
      {
        clauseNumber: '5',
        title: 'Inspections',
        content: terms.subjectToInspection
          ? `The Buyers shall have the right to inspect the Vessel at their own expense prior to ${terms.inspectionDeadline?.toLocaleDateString()}. If the inspection reveals defects materially affecting the Vessel's class or seaworthiness, the Buyers may reject the Vessel by written notice to the Sellers within 3 business days of inspection completion.`
          : 'The Buyers acknowledge purchasing the Vessel without inspection and accept the Vessel in "as is" condition.',
        isOptional: false,
      },
      {
        clauseNumber: '6',
        title: 'Conditions Precedent',
        content: this.buildConditionsPrecedent(terms),
        isOptional: true,
      },
      {
        clauseNumber: '7',
        title: 'Documentation',
        content: `On delivery, the Sellers shall provide the Buyers with:
(a) Bill of Sale in a form acceptable for registry deletion
(b) Certificate of Registry deletion
(c) Class certificates
(d) Current survey reports
(e) Inventory of stores, bunkers, and spare parts
(f) All technical and operational manuals
(g) ${terms.includedItems.join(', ')}`,
        isOptional: false,
      },
      {
        clauseNumber: '8',
        title: 'Encumbrances',
        content: `The Sellers warrant that the Vessel shall be delivered free from all encumbrances, mortgages, maritime liens, and other charges. Any encumbrances existing at the time of delivery shall be discharged by the Sellers at their expense prior to or concurrent with delivery.`,
        isOptional: false,
      },
      {
        clauseNumber: '9',
        title: 'Condition on Delivery',
        content: `The Vessel shall be delivered in the same condition as inspected (if applicable) with class maintained and free of average damage affecting class. The Vessel's classification society is ${terms.classificationSociety}.`,
        isOptional: false,
      },
      {
        clauseNumber: '10',
        title: 'Name and Flag',
        content: `Upon delivery, the Buyers shall be entitled to change the name and flag of the Vessel. The Sellers shall cooperate in obtaining deletion certificates from the current flag state (${terms.flag}).`,
        isOptional: false,
      },
      {
        clauseNumber: '11',
        title: 'Default',
        content: `If the Buyers fail to pay the deposit or balance payment when due, the Sellers may terminate this Agreement and forfeit the deposit as liquidated damages. If the Sellers fail to deliver the Vessel, the Buyers may terminate this Agreement and claim return of the deposit plus interest.`,
        isOptional: false,
      },
      {
        clauseNumber: '12',
        title: 'Notices',
        content: `All notices shall be in writing and delivered by email or courier to:
Sellers: ${terms.sellersName}, ${terms.sellersAddress}
Buyers: ${terms.buyersName}, ${terms.buyersAddress}`,
        isOptional: false,
      },
      {
        clauseNumber: '13',
        title: 'Governing Law and Arbitration',
        content: `This Agreement shall be governed by ${terms.governingLaw}. Any disputes shall be referred to arbitration in ${terms.arbitrationVenue} in accordance with English law and the rules of the London Maritime Arbitrators Association (LMAA).`,
        isOptional: false,
      },
    ];
  }

  private buildConditionsPrecedent(terms: MOATerms): string {
    const conditions: string[] = [];

    if (terms.subjectToInspection && terms.inspectionDeadline) {
      conditions.push(
        `(a) Satisfactory inspection to be completed by ${terms.inspectionDeadline.toLocaleDateString()}`
      );
    }

    if (terms.subjectToFinance && terms.financeDeadline) {
      conditions.push(
        `(b) Buyers obtaining financing approval by ${terms.financeDeadline.toLocaleDateString()}`
      );
    }

    if (terms.subjectToBoardApproval && terms.boardApprovalDeadline) {
      conditions.push(
        `(c) Buyers' board of directors approval by ${terms.boardApprovalDeadline.toLocaleDateString()}`
      );
    }

    terms.specialConditions.forEach((cond, idx) => {
      const letter = String.fromCharCode(97 + conditions.length); // a, b, c, etc.
      conditions.push(`(${letter}) ${cond}`);
    });

    if (conditions.length === 0) {
      return 'This Agreement is not subject to any conditions precedent.';
    }

    return `This Agreement is subject to the following conditions precedent:\n${conditions.join('\n')}\n\nIf any condition is not satisfied by its deadline, either party may terminate this Agreement by written notice.`;
  }

  private formatBusinessDays(date: Date): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return `${diffDays} business days`;
  }

  /**
   * Generate HTML content for MOA
   */
  private generateHTML(terms: MOATerms, clauses: MOAClause[]): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Memorandum of Agreement - ${terms.vesselName}</title>
  <style>
    body { font-family: 'Times New Roman', serif; max-width: 210mm; margin: 0 auto; padding: 20mm; }
    h1 { text-align: center; font-size: 18pt; margin-bottom: 30px; }
    h2 { font-size: 14pt; margin-top: 20px; }
    p { text-align: justify; line-height: 1.6; }
    .clause { margin-bottom: 20px; page-break-inside: avoid; }
    .clause-number { font-weight: bold; }
    .signature-block { margin-top: 60px; }
    .signature-line { border-top: 1px solid black; width: 200px; display: inline-block; margin-right: 50px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    td { padding: 8px; border: 1px solid #ccc; }
    .vessel-details { background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>MEMORANDUM OF AGREEMENT</h1>

  <p style="text-align: center; margin-bottom: 30px;">
    <strong>FOR THE SALE AND PURCHASE OF</strong><br>
    <strong style="font-size: 16pt;">"${terms.vesselName.toUpperCase()}"</strong><br>
    IMO Number: ${terms.imo}
  </p>

  <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>

  <p><strong>BETWEEN:</strong></p>
  <p style="margin-left: 40px;">
    <strong>${terms.sellersName}</strong><br>
    ${terms.sellersAddress}<br>
    (hereinafter called "the Sellers")
  </p>

  <p><strong>AND:</strong></p>
  <p style="margin-left: 40px;">
    <strong>${terms.buyersName}</strong><br>
    ${terms.buyersAddress}<br>
    (hereinafter called "the Buyers")
  </p>

  <h2>VESSEL PARTICULARS</h2>
  <table class="vessel-details">
    <tr><td><strong>Vessel Name:</strong></td><td>${terms.vesselName}</td></tr>
    <tr><td><strong>IMO Number:</strong></td><td>${terms.imo}</td></tr>
    <tr><td><strong>Flag:</strong></td><td>${terms.flag}</td></tr>
    <tr><td><strong>Classification:</strong></td><td>${terms.classificationSociety}</td></tr>
    <tr><td><strong>Year Built:</strong></td><td>${terms.yearBuilt}</td></tr>
    <tr><td><strong>DWT:</strong></td><td>${terms.dwt.toLocaleString()} MT</td></tr>
    <tr><td><strong>GRT:</strong></td><td>${terms.grt.toLocaleString()}</td></tr>
  </table>

  <h2>PURCHASE PRICE</h2>
  <p style="font-size: 14pt; text-align: center; background: #f0f0f0; padding: 15px; margin: 20px 0;">
    <strong>${terms.currency} ${terms.purchasePrice.toLocaleString()}</strong><br>
    <span style="font-size: 10pt;">(${this.numberToWords(terms.purchasePrice)} ${terms.currency})</span>
  </p>

  <h2>TERMS AND CONDITIONS</h2>

  ${clauses
    .map(
      (clause) => `
    <div class="clause">
      <p>
        <span class="clause-number">${clause.clauseNumber}. ${clause.title}</span><br>
        ${clause.content}
      </p>
    </div>
  `
    )
    .join('\n')}

  <div class="signature-block">
    <p><strong>IN WITNESS WHEREOF</strong>, the Parties have executed this Agreement on the date first written above.</p>

    <table style="border: none; margin-top: 40px;">
      <tr style="border: none;">
        <td style="border: none; width: 50%;">
          <p><strong>FOR THE SELLERS:</strong></p>
          <p style="margin-top: 60px;">
            <span class="signature-line"></span><br>
            <small>Authorized Signatory</small><br>
            <small>${terms.sellersName}</small>
          </p>
          <p style="margin-top: 40px;">
            Date: ___________________
          </p>
        </td>
        <td style="border: none; width: 50%;">
          <p><strong>FOR THE BUYERS:</strong></p>
          <p style="margin-top: 60px;">
            <span class="signature-line"></span><br>
            <small>Authorized Signatory</small><br>
            <small>${terms.buyersName}</small>
          </p>
          <p style="margin-top: 40px;">
            Date: ___________________
          </p>
        </td>
      </tr>
    </table>
  </div>

  <p style="text-align: center; margin-top: 60px; font-size: 9pt; color: #666;">
    This Memorandum of Agreement is generated by Mari8X and is subject to legal review.<br>
    Consult with maritime lawyers before execution.
  </p>
</body>
</html>
    `.trim();
  }

  private numberToWords(num: number): string {
    // Simplified - would use a proper library in production
    const millions = Math.floor(num / 1000000);
    if (millions > 0) {
      return `${millions} Million`;
    }
    const thousands = Math.floor(num / 1000);
    if (thousands > 0) {
      return `${thousands} Thousand`;
    }
    return num.toString();
  }

  /**
   * Generate MOA document
   */
  async generateMOA(
    transactionId: string,
    terms: MOATerms,
    organizationId: string
  ): Promise<GeneratedMOA> {
    // Validate transaction exists
    const transaction = await prisma.sNPTransaction.findUnique({
      where: { id: transactionId },
      include: {
        listing: {
          include: {
            vessel: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new Error('S&P transaction not found');
    }

    // Generate clauses
    const clauses = this.getStandardClauses(terms);

    // Generate HTML
    const htmlContent = this.generateHTML(terms, clauses);

    // Create MOA ID
    const moaId = `MOA-${transaction.listing.vessel.imo}-${Date.now()}`;

    // TODO: Generate PDF using puppeteer or similar
    // const pdfUrl = await this.generatePDF(htmlContent);

    return {
      moaId,
      documentTitle: `MOA - ${terms.vesselName} - ${terms.sellersName} to ${terms.buyersName}`,
      generatedAt: new Date(),
      terms,
      clauses,
      htmlContent,
      pdfUrl: undefined, // Would be populated after PDF generation
      status: 'draft',
    };
  }

  /**
   * Save MOA to database
   */
  async saveMOA(
    transactionId: string,
    generatedMOA: GeneratedMOA,
    organizationId: string
  ): Promise<any> {
    // Store in Document table
    const document = await prisma.document.create({
      data: {
        organizationId,
        title: generatedMOA.documentTitle,
        category: 'moa',
        fileUrl: generatedMOA.pdfUrl || '',
        uploadedBy: 'system', // Would be actual user ID
        status: 'draft',
        metadata: {
          moaId: generatedMOA.moaId,
          transactionId,
          terms: generatedMOA.terms,
          generatedAt: generatedMOA.generatedAt,
        },
      },
    });

    return document;
  }
}

export const snpMOAGeneratorService = new SNPMOAGeneratorService();
