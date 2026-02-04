/**
 * Charter Party Document Processor
 * Extracts structured data from charter party documents (GENCON, NYPE, etc.)
 */

import { BaseProcessor, ExtractedData } from './base-processor';

export class CharterPartyProcessor extends BaseProcessor {
  docType = 'charter_party';

  async extract(content: string, metadata?: any): Promise<ExtractedData> {
    const data: ExtractedData = {
      title: this.extractTitle(content),
      docType: this.docType,
      extractedAt: new Date(),
      vessels: this.extractVessels(content),
      parties: this.extractParties(content),
      ports: this.extractPorts(content),
      cargo: this.extractCargo(content),
      rates: this.extractRates(content),
      dates: this.extractDateInfo(content),
      fullText: this.cleanText(content),
      metadata: {
        cpType: this.detectCPType(content),
        ...metadata,
      },
    };

    return data;
  }

  private extractTitle(content: string): string {
    // Try to find charter party title
    const patterns = [
      /^(.+?CHARTER.+?)$/im,
      /CHARTER PARTY.*?-\s*(.+?)$/im,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return 'Charter Party Document';
  }

  private detectCPType(content: string): string {
    if (content.includes('GENCON')) return 'GENCON';
    if (content.includes('NYPE')) return 'NYPE';
    if (content.includes('TIME CHARTER')) return 'TIME_CHARTER';
    if (content.includes('VOYAGE CHARTER')) return 'VOYAGE_CHARTER';
    if (content.includes('BAREBOAT')) return 'BAREBOAT';
    return 'UNKNOWN';
  }

  private extractVessels(content: string): ExtractedData['vessels'] {
    const vessels: ExtractedData['vessels'] = [];

    // Extract vessel name
    const namePatterns = [
      /(?:M\/V|MV|MT|S\/S)\s+([A-Z\s]+?)(?:\n|,|IMO)/i,
      /Vessel(?:\s+Name)?:\s*([A-Z\s]+?)(?:\n|,|$)/i,
    ];

    for (const pattern of namePatterns) {
      const match = content.match(pattern);
      if (match) {
        const name = match[1].trim();

        // Extract additional details
        const imoMatch = content.match(/IMO\s*:?\s*(\d{7})/i);
        const dwtMatch = content.match(/(\d{1,3}(?:,\d{3})*)\s*(?:DWT|MT|tons?)/i);
        const flagMatch = content.match(/Flag:\s*([A-Z][a-z]+)/i);
        const builtMatch = content.match(/(?:Built|Year):\s*(\d{4})/i);

        vessels.push({
          name,
          imo: imoMatch?.[1],
          dwt: dwtMatch ? parseInt(dwtMatch[1].replace(/,/g, '')) : undefined,
          flag: flagMatch?.[1],
          built: builtMatch ? parseInt(builtMatch[1]) : undefined,
        });

        break;
      }
    }

    return vessels.length > 0 ? vessels : undefined;
  }

  private extractParties(content: string): ExtractedData['parties'] {
    const parties: ExtractedData['parties'] = [];

    // Extract owner
    const ownerMatch = content.match(/Owner[s]?:\s*(.+?)(?:\n|Address)/i);
    if (ownerMatch) {
      parties.push({
        role: 'owner',
        name: ownerMatch[1].trim(),
      });
    }

    // Extract charterer
    const chartererMatch = content.match(/Charterer[s]?:\s*(.+?)(?:\n|Address)/i);
    if (chartererMatch) {
      parties.push({
        role: 'charterer',
        name: chartererMatch[1].trim(),
      });
    }

    // Extract broker
    const brokerMatch = content.match(/Broker[s]?:\s*(.+?)(?:\n|$)/i);
    if (brokerMatch) {
      parties.push({
        role: 'broker',
        name: brokerMatch[1].trim(),
      });
    }

    return parties.length > 0 ? parties : undefined;
  }

  private extractPorts(content: string): ExtractedData['ports'] {
    const ports: ExtractedData['ports'] = [];

    // Loading port
    const loadingMatch = content.match(/(?:Loading Port|POL|Load):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (loadingMatch) {
      ports.push({
        name: loadingMatch[1].trim(),
        type: 'loading',
      });
    }

    // Discharge port
    const dischargeMatch = content.match(/(?:Discharge Port|POD|Discharge):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (dischargeMatch) {
      ports.push({
        name: dischargeMatch[1].trim(),
        type: 'discharge',
      });
    }

    // Port codes (SGSIN, USNYC, etc.)
    const portCodes = content.match(/[A-Z]{5}/g);
    if (portCodes) {
      portCodes.forEach(code => {
        if (!ports.find(p => p.code === code)) {
          ports.push({
            name: code,
            code,
          });
        }
      });
    }

    return ports.length > 0 ? ports : undefined;
  }

  private extractCargo(content: string): ExtractedData['cargo'] {
    const cargo: ExtractedData['cargo'] = [];

    // Cargo description
    const cargoMatch = content.match(/Cargo:\s*(.+?)(?:\n|Quantity)/i);
    if (cargoMatch) {
      const description = cargoMatch[1].trim();

      // Extract quantity
      const quantityMatch = content.match(/(\d{1,3}(?:,\d{3})*)\s*(?:MT|tons?|TEU)/i);

      cargo.push({
        description,
        quantity: quantityMatch ? parseInt(quantityMatch[1].replace(/,/g, '')) : undefined,
        unit: quantityMatch?.[0].match(/MT|tons?|TEU/i)?.[0],
      });
    }

    return cargo.length > 0 ? cargo : undefined;
  }

  private extractRates(content: string): ExtractedData['rates'] {
    const rates: ExtractedData['rates'] = [];

    // Freight rate
    const freightMatch = content.match(/Freight:?\s*(?:USD|EUR|GBP)?\s*([\d,]+(?:\.\d{2})?)\s*(?:per\s+(?:MT|ton|day))?/i);
    if (freightMatch) {
      const amounts = this.extractAmounts(content);
      const freightAmount = amounts.find(a => content.includes('Freight'));

      if (freightAmount) {
        rates.push({
          type: 'freight',
          amount: freightAmount.amount,
          currency: freightAmount.currency,
          unit: content.match(/per\s+(MT|ton|day)/i)?.[1],
        });
      }
    }

    // Hire rate (for time charters)
    const hireMatch = content.match(/Hire[:\s]+(?:USD|EUR|GBP)?\s*([\d,]+(?:\.\d{2})?)\s*per\s+day/i);
    if (hireMatch) {
      const amount = parseFloat(hireMatch[1].replace(/,/g, ''));
      rates.push({
        type: 'hire',
        amount,
        currency: content.match(/USD|EUR|GBP/i)?.[0] || 'USD',
        unit: 'per day',
      });
    }

    // Demurrage rate
    const demurrageMatch = content.match(/Demurrage[:\s]+(?:USD|EUR|GBP)?\s*([\d,]+(?:\.\d{2})?)\s*per\s+day/i);
    if (demurrageMatch) {
      const amount = parseFloat(demurrageMatch[1].replace(/,/g, ''));
      rates.push({
        type: 'demurrage',
        amount,
        currency: content.match(/USD|EUR|GBP/i)?.[0] || 'USD',
        unit: 'per day',
      });
    }

    return rates.length > 0 ? rates : undefined;
  }

  private extractDateInfo(content: string): ExtractedData['dates'] {
    const dateInfo: ExtractedData['dates'] = [];

    // Laycan
    const laycanMatch = content.match(/Laycan[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{4})\s*(?:to|-)\s*(\d{1,2}[/-]\d{1,2}[/-]\d{4})/i);
    if (laycanMatch) {
      dateInfo.push({
        type: 'laycan_start',
        date: laycanMatch[1],
      });
      dateInfo.push({
        type: 'laycan_end',
        date: laycanMatch[2],
      });
    }

    // Extract all dates
    const dates = this.extractDates(content);
    dates.forEach(date => {
      dateInfo.push({
        type: 'general',
        date,
      });
    });

    return dateInfo.length > 0 ? dateInfo : undefined;
  }
}
