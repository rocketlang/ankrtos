/**
 * Document AI Service
 * AI-powered extraction from maritime documents
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

export interface CharterPartyExtraction {
  // Parties
  owner: string;
  charterer: string;
  broker?: string;
  
  // Vessel
  vesselName: string;
  vesselType?: string;
  dwt?: number;
  built?: number;
  flag?: string;
  
  // Cargo
  cargoDescription: string;
  quantity?: number;
  quantityTolerance?: string; // "10% MOLOO"
  
  // Voyage
  loadPort: string;
  dischargePort: string;
  laycan?: { start: Date; end: Date };
  
  // Commercial
  freightRate?: number;
  freightCurrency?: string;
  freightBasis?: string; // "per MT", "lumpsum"
  demurrageRate?: number;
  despatchRate?: number;
  
  // Laytime
  laytime?: string; // "72 hours"
  laytimeTerms?: string; // "SHINC", "SHEX"
  
  // Key clauses
  clauses: Array<{
    clauseTitle: string;
    clauseText: string;
    category: string;
  }>;
  
  confidence: number; // 0-1
}

export interface BillOfLadingExtraction {
  blNumber: string;
  blType: 'MASTER' | 'HOUSE' | 'SEAWAY';
  
  // Parties
  shipper: string;
  consignee: string;
  notifyParty?: string;
  
  // Vessel
  vesselName: string;
  voyageNumber?: string;
  
  // Cargo
  cargoDescription: string;
  quantity: number;
  quantityUnit: string;
  weight?: number;
  weightUnit?: string;
  marks?: string;
  
  // Voyage
  loadPort: string;
  loadDate?: Date;
  dischargePort: string;
  
  // Freight
  freightPayableAt?: string;
  freightAmount?: number;
  freightPrepaid?: boolean;
  
  // Container info (if applicable)
  containers?: Array<{
    containerNumber: string;
    sealNumber?: string;
    type?: string;
  }>;
  
  confidence: number;
}

export class DocumentAIService {
  /**
   * Extract data from Charter Party PDF
   */
  async extractCharterParty(
    pdfBuffer: Buffer,
    organizationId: string
  ): Promise<CharterPartyExtraction> {
    // In production: Use @ankr/ocr + Claude/GPT-4V for extraction
    const text = await this.extractTextFromPDF(pdfBuffer);
    
    // Use LLM to extract structured data
    const extraction = await this.extractCPData(text);
    
    // Save extraction for audit trail
    await prisma.documentExtraction.create({
      data: {
        type: 'CHARTER_PARTY',
        extractedData: extraction as any,
        confidence: extraction.confidence,
        organizationId,
      },
    });
    
    return extraction;
  }

  /**
   * Extract data from Bill of Lading PDF
   */
  async extractBillOfLading(
    pdfBuffer: Buffer,
    organizationId: string
  ): Promise<BillOfLadingExtraction> {
    const text = await this.extractTextFromPDF(pdfBuffer);
    const extraction = await this.extractBLData(text);
    
    await prisma.documentExtraction.create({
      data: {
        type: 'BILL_OF_LADING',
        extractedData: extraction as any,
        confidence: extraction.confidence,
        organizationId,
      },
    });
    
    return extraction;
  }

  /**
   * Compare two C/P versions (redline)
   */
  async compareCharterParties(
    originalPDF: Buffer,
    revisedPDF: Buffer
  ): Promise<{
    changes: Array<{
      type: 'ADDED' | 'REMOVED' | 'MODIFIED';
      section: string;
      original?: string;
      revised?: string;
    }>;
    summary: string;
  }> {
    const originalText = await this.extractTextFromPDF(originalPDF);
    const revisedText = await this.extractTextFromPDF(revisedPDF);
    
    // Simple diff (in production, use proper diff algorithm)
    const changes = this.generateDiff(originalText, revisedText);
    
    return {
      changes,
      summary: `${changes.length} changes detected`,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async extractTextFromPDF(buffer: Buffer): Promise<string> {
    // In production: Use pdf-parse or @ankr/ocr
    // Mock extraction for now
    return `
CHARTER PARTY
Owner: Pacific Shipping Lines
Charterer: Global Trading Corp
Broker: Maritime Brokers Ltd

Vessel: MV OCEAN VICTORY
Type: Bulk Carrier
DWT: 75,000
Built: 2015
Flag: Panama

Cargo: Coal in bulk, approx 70,000 MT +/- 10% MOLOO
Load Port: Newcastle, Australia
Discharge Port: Qingdao, China
Laycan: 15-20 May 2026

Freight Rate: USD 25.50 per MT
Demurrage: USD 12,500 per day
Despatch: USD 6,250 per day

Laytime: 72 hours SHINC (Sundays and Holidays Included)
    `.trim();
  }

  private async extractCPData(text: string): Promise<CharterPartyExtraction> {
    // In production: Use Claude/GPT-4 with structured output
    // For now, simple regex-based extraction
    
    const owner = this.extractField(text, /Owner:\s*(.+)/i);
    const charterer = this.extractField(text, /Charterer:\s*(.+)/i);
    const vesselName = this.extractField(text, /Vessel:\s*(.+)/i);
    const loadPort = this.extractField(text, /Load Port:\s*(.+)/i);
    const dischargePort = this.extractField(text, /Discharge Port:\s*(.+)/i);
    const cargoDescription = this.extractField(text, /Cargo:\s*(.+)/i);
    
    return {
      owner: owner || 'Unknown',
      charterer: charterer || 'Unknown',
      vesselName: vesselName || 'Unknown',
      loadPort: loadPort || 'Unknown',
      dischargePort: dischargePort || 'Unknown',
      cargoDescription: cargoDescription || 'Unknown',
      clauses: [],
      confidence: 0.85,
    };
  }

  private async extractBLData(text: string): Promise<BillOfLadingExtraction> {
    // Similar to C/P extraction
    return {
      blNumber: this.extractField(text, /B\/L No:\s*(.+)/i) || 'Unknown',
      blType: 'MASTER',
      shipper: this.extractField(text, /Shipper:\s*(.+)/i) || 'Unknown',
      consignee: this.extractField(text, /Consignee:\s*(.+)/i) || 'Unknown',
      vesselName: this.extractField(text, /Vessel:\s*(.+)/i) || 'Unknown',
      cargoDescription: this.extractField(text, /Description:\s*(.+)/i) || 'Unknown',
      quantity: 0,
      quantityUnit: 'MT',
      loadPort: this.extractField(text, /Port of Loading:\s*(.+)/i) || 'Unknown',
      dischargePort: this.extractField(text, /Port of Discharge:\s*(.+)/i) || 'Unknown',
      confidence: 0.80,
    };
  }

  private extractField(text: string, pattern: RegExp): string | undefined {
    const match = text.match(pattern);
    return match ? match[1].trim() : undefined;
  }

  private generateDiff(
    original: string,
    revised: string
  ): Array<{
    type: 'ADDED' | 'REMOVED' | 'MODIFIED';
    section: string;
    original?: string;
    revised?: string;
  }> {
    // Simple diff - in production, use proper diff library
    const changes = [];
    
    if (original.length < revised.length) {
      changes.push({
        type: 'ADDED' as const,
        section: 'Document',
        revised: 'Additional text added',
      });
    }
    
    return changes;
  }
}

export const documentAIService = new DocumentAIService();
