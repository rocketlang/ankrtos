/**
 * Document Processors
 * Factory and exports for all document processors
 */

import { BaseProcessor } from './base-processor';
import { CharterPartyProcessor } from './charter-party-processor';
import { BOLProcessor } from './bol-processor';
import { EmailProcessor } from './email-processor';

// Export all processors
export { BaseProcessor, type ExtractedData } from './base-processor';
export { CharterPartyProcessor } from './charter-party-processor';
export { BOLProcessor } from './bol-processor';
export { EmailProcessor } from './email-processor';

/**
 * Generic processor for unknown document types
 */
export class GenericProcessor extends BaseProcessor {
  docType = 'generic';

  async extract(content: string, metadata?: any): Promise<any> {
    return {
      title: this.extractGenericTitle(content),
      docType: this.docType,
      extractedAt: new Date(),
      vessels: this.extractVessels(content),
      parties: this.extractParties(content),
      ports: this.extractPorts(content),
      dates: this.extractDateInfo(content),
      fullText: this.cleanText(content),
      metadata,
    };
  }

  private extractGenericTitle(content: string): string {
    // Try to get first non-empty line
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    if (lines.length > 0) {
      return lines[0].substring(0, 100).trim();
    }
    return 'Document';
  }

  private extractVessels(content: string): any {
    const nameMatch = content.match(/(?:M\/V|MV|MT|S\/S)\s+([A-Z][A-Z\s]+?)(?:\n|,|\.)/i);
    if (nameMatch) {
      return [{ name: nameMatch[1].trim() }];
    }
  }

  private extractParties(content: string): any {
    // Generic party extraction (just look for common roles)
    const parties: any[] = [];

    const ownerMatch = content.match(/Owner[s]?:\s*(.+?)(?:\n|,)/i);
    if (ownerMatch) parties.push({ role: 'owner', name: ownerMatch[1].trim() });

    const chartererMatch = content.match(/Charterer[s]?:\s*(.+?)(?:\n|,)/i);
    if (chartererMatch) parties.push({ role: 'charterer', name: chartererMatch[1].trim() });

    return parties.length > 0 ? parties : undefined;
  }

  private extractPorts(content: string): any {
    const ports: any[] = [];

    const loadMatch = content.match(/(?:Load|POL):\s*([A-Z][a-z]+)/i);
    if (loadMatch) ports.push({ name: loadMatch[1].trim(), type: 'loading' });

    const dischMatch = content.match(/(?:Disch|POD):\s*([A-Z][a-z]+)/i);
    if (dischMatch) ports.push({ name: dischMatch[1].trim(), type: 'discharge' });

    return ports.length > 0 ? ports : undefined;
  }

  private extractDateInfo(content: string): any {
    const dates = this.extractDates(content);
    if (dates.length > 0) {
      return dates.map(d => ({ type: 'general', date: d }));
    }
  }
}

/**
 * Document type detection
 */
export function detectDocumentType(content: string, filename?: string): string {
  const lowerContent = content.toLowerCase();
  const lowerFilename = filename?.toLowerCase() || '';

  // Charter Party
  if (
    lowerContent.includes('charter party') ||
    lowerContent.includes('gencon') ||
    lowerContent.includes('nype') ||
    lowerContent.includes('time charter') ||
    lowerContent.includes('voyage charter') ||
    lowerFilename.includes('charter') ||
    lowerFilename.includes('c/p')
  ) {
    return 'charter_party';
  }

  // Bill of Lading
  if (
    lowerContent.includes('bill of lading') ||
    lowerContent.includes('b/l number') ||
    lowerContent.includes('shipper:') ||
    lowerContent.includes('consignee:') ||
    lowerFilename.includes('bol') ||
    lowerFilename.includes('b/l')
  ) {
    return 'bol';
  }

  // Email
  if (
    lowerContent.includes('from:') ||
    lowerContent.includes('to:') ||
    lowerContent.includes('subject:') ||
    lowerContent.includes('date:') ||
    lowerFilename.includes('email') ||
    lowerFilename.includes('eml')
  ) {
    return 'email';
  }

  // Market Report
  if (
    lowerContent.includes('market report') ||
    lowerContent.includes('freight rates') ||
    lowerContent.includes('baltic index') ||
    lowerFilename.includes('market')
  ) {
    return 'market_report';
  }

  // Compliance/Regulation
  if (
    lowerContent.includes('regulation') ||
    lowerContent.includes('compliance') ||
    lowerContent.includes('imo ') ||
    lowerContent.includes('solas') ||
    lowerContent.includes('marpol') ||
    lowerFilename.includes('compliance')
  ) {
    return 'compliance';
  }

  // Invoice
  if (
    lowerContent.includes('invoice') ||
    lowerContent.includes('invoice number') ||
    lowerContent.includes('amount due') ||
    lowerFilename.includes('invoice') ||
    lowerFilename.includes('inv')
  ) {
    return 'invoice';
  }

  // Port Notice
  if (
    lowerContent.includes('port notice') ||
    lowerContent.includes('port advisory') ||
    lowerContent.includes('berthing') ||
    lowerFilename.includes('port')
  ) {
    return 'port_notice';
  }

  // Default
  return 'generic';
}

/**
 * Get appropriate processor for document type
 */
export function getProcessor(docType: string): BaseProcessor {
  switch (docType) {
    case 'charter_party':
      return new CharterPartyProcessor();
    case 'bol':
      return new BOLProcessor();
    case 'email':
      return new EmailProcessor();
    default:
      return new GenericProcessor();
  }
}

/**
 * Process a document with auto-detection
 */
export async function processDocument(content: string, filename?: string, metadata?: any) {
  // Detect document type
  const docType = detectDocumentType(content, filename);

  // Get appropriate processor
  const processor = getProcessor(docType);

  // Extract structured data
  const extracted = await processor.extract(content, metadata);

  return {
    ...extracted,
    detectedType: docType,
  };
}
