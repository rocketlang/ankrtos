/**
 * Bill of Lading Processor
 * Extracts structured data from BOL documents
 */

import { BaseProcessor, ExtractedData } from './base-processor';

export class BOLProcessor extends BaseProcessor {
  docType = 'bol';

  async extract(content: string, metadata?: any): Promise<ExtractedData> {
    return {
      title: this.extractTitle(content),
      docType: this.docType,
      extractedAt: new Date(),
      vessels: this.extractVessels(content),
      parties: this.extractParties(content),
      ports: this.extractPorts(content),
      cargo: this.extractCargo(content),
      dates: this.extractDateInfo(content),
      fullText: this.cleanText(content),
      metadata: {
        bolNumber: this.extractBOLNumber(content),
        ...metadata,
      },
    };
  }

  private extractTitle(content: string): string {
    const match = content.match(/BILL OF LADING.*?-\s*(.+?)$/im);
    return match ? match[1].trim() : 'Bill of Lading';
  }

  private extractBOLNumber(content: string): string | undefined {
    const match = content.match(/B\/L\s+Number:\s*([A-Z0-9-]+)/i);
    return match?.[1];
  }

  private extractVessels(content: string): ExtractedData['vessels'] {
    const nameMatch = content.match(/Vessel(?:\s+Name)?:\s*([A-Z\s]+)/i);
    const imoMatch = content.match(/IMO:\s*(\d{7})/i);

    if (nameMatch) {
      return [{
        name: nameMatch[1].trim(),
        imo: imoMatch?.[1],
      }];
    }
  }

  private extractParties(content: string): ExtractedData['parties'] {
    const parties: ExtractedData['parties'] = [];

    const shipperMatch = content.match(/SHIPPER:\s*(.+?)(?:\n|Address)/i);
    if (shipperMatch) parties.push({ role: 'shipper', name: shipperMatch[1].trim() });

    const consigneeMatch = content.match(/CONSIGNEE:\s*(.+?)(?:\n|Address)/i);
    if (consigneeMatch) parties.push({ role: 'consignee', name: consigneeMatch[1].trim() });

    return parties.length > 0 ? parties : undefined;
  }

  private extractPorts(content: string): ExtractedData['ports'] {
    const ports: ExtractedData['ports'] = [];

    const loadingMatch = content.match(/PORT OF LOADING:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (loadingMatch) ports.push({ name: loadingMatch[1].trim(), type: 'loading' });

    const dischargeMatch = content.match(/PORT OF DISCHARGE:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (dischargeMatch) ports.push({ name: dischargeMatch[1].trim(), type: 'discharge' });

    return ports.length > 0 ? ports : undefined;
  }

  private extractCargo(content: string): ExtractedData['cargo'] {
    const cargoMatch = content.match(/Description of Goods:\s*(.+?)(?:\n|Packaging)/i);
    const weightMatch = content.match(/Gross Weight:\s*([\d,]+)\s*(KGS?|MT)/i);

    if (cargoMatch) {
      return [{
        description: cargoMatch[1].trim(),
        weight: weightMatch ? parseInt(weightMatch[1].replace(/,/g, '')) : undefined,
        unit: weightMatch?.[2],
      }];
    }
  }

  private extractDateInfo(content: string): ExtractedData['dates'] {
    const dateInfo: ExtractedData['dates'] = [];

    const shipedMatch = content.match(/Shipped on Board:\s*(.+?)$/im);
    if (shipedMatch) dateInfo.push({ type: 'shipped', date: shipedMatch[1].trim() });

    return dateInfo.length > 0 ? dateInfo : undefined;
  }
}
