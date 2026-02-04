/**
 * Email Document Processor
 * Extracts structured data from maritime emails (fixture negotiations, operations updates, etc.)
 */

import { BaseProcessor, ExtractedData } from './base-processor';

export class EmailProcessor extends BaseProcessor {
  docType = 'email';

  async extract(content: string, metadata?: any): Promise<ExtractedData> {
    const category = this.detectCategory(content);
    const urgency = this.detectUrgency(content);
    const actionable = this.detectActionability(content);

    return {
      title: this.extractTitle(content),
      docType: this.docType,
      extractedAt: new Date(),
      vessels: this.extractVessels(content),
      parties: this.extractParties(content),
      ports: this.extractPorts(content),
      cargo: category === 'fixture' ? this.extractCargo(content) : undefined,
      rates: category === 'fixture' ? this.extractRates(content) : undefined,
      dates: this.extractDateInfo(content),
      fullText: this.cleanText(content),
      metadata: {
        category,
        urgency,
        actionable,
        references: this.extractReferences(content),
        ...(category === 'fixture' ? { fixtureTerms: this.extractFixtureTerms(content) } : {}),
        ...metadata,
      },
    };
  }

  private extractTitle(content: string): string {
    // Extract subject line
    const subjectMatch = content.match(/Subject:\s*(.+?)(?:\n|$)/i);
    if (subjectMatch) {
      return subjectMatch[1].trim();
    }

    // Fall back to first line
    const firstLine = content.split('\n')[0].trim();
    return firstLine.substring(0, 100) || 'Email';
  }

  private detectCategory(content: string): string {
    const lowerContent = content.toLowerCase();

    // Fixture negotiation
    if (
      lowerContent.includes('firm offer') ||
      lowerContent.includes('subjects') ||
      lowerContent.includes('fixture') ||
      lowerContent.includes('laycan') ||
      lowerContent.includes('freight rate')
    ) {
      return 'fixture';
    }

    // Operations
    if (
      lowerContent.includes('eta') ||
      lowerContent.includes('etd') ||
      lowerContent.includes('noon report') ||
      lowerContent.includes('bunkering') ||
      lowerContent.includes('port call')
    ) {
      return 'operations';
    }

    // Claims
    if (
      lowerContent.includes('claim') ||
      lowerContent.includes('demurrage') ||
      lowerContent.includes('laytime') ||
      lowerContent.includes('dispute')
    ) {
      return 'claims';
    }

    // Commercial
    if (
      lowerContent.includes('invoice') ||
      lowerContent.includes('payment') ||
      lowerContent.includes('hire statement') ||
      lowerContent.includes('commercial')
    ) {
      return 'commercial';
    }

    // Technical
    if (
      lowerContent.includes('repair') ||
      lowerContent.includes('maintenance') ||
      lowerContent.includes('breakdown') ||
      lowerContent.includes('technical')
    ) {
      return 'technical';
    }

    return 'general';
  }

  private detectUrgency(content: string): string {
    const lowerContent = content.toLowerCase();

    // Critical
    if (
      lowerContent.includes('urgent') ||
      lowerContent.includes('emergency') ||
      lowerContent.includes('asap') ||
      lowerContent.includes('immediately') ||
      lowerContent.includes('critical')
    ) {
      return 'critical';
    }

    // High priority
    if (
      lowerContent.includes('important') ||
      lowerContent.includes('priority') ||
      lowerContent.includes('time-sensitive') ||
      lowerContent.includes('deadline')
    ) {
      return 'high';
    }

    // Check for time constraints
    if (
      lowerContent.includes('today') ||
      lowerContent.includes('by eod') ||
      lowerContent.includes('within 24')
    ) {
      return 'high';
    }

    return 'medium';
  }

  private detectActionability(content: string): boolean {
    const lowerContent = content.toLowerCase();

    // Requires response
    if (
      lowerContent.includes('please confirm') ||
      lowerContent.includes('please advise') ||
      lowerContent.includes('please provide') ||
      lowerContent.includes('please send') ||
      lowerContent.includes('?') // Has questions
    ) {
      return true;
    }

    // Has deadline
    if (
      lowerContent.includes('by ') ||
      lowerContent.includes('deadline') ||
      lowerContent.includes('before ')
    ) {
      return true;
    }

    // Awaiting action
    if (
      lowerContent.includes('waiting') ||
      lowerContent.includes('pending') ||
      lowerContent.includes('require')
    ) {
      return true;
    }

    return false;
  }

  private extractReferences(content: string): string[] {
    const references: string[] = [];

    // Voyage numbers
    const voyageMatches = content.match(/V(?:OY)?[#\s]?(\d{2,4})/gi);
    if (voyageMatches) {
      references.push(...voyageMatches.map(m => m.trim()));
    }

    // BOL numbers
    const bolMatches = content.match(/B\/L\s*(?:#|No\.?)?\s*([A-Z0-9-]+)/gi);
    if (bolMatches) {
      references.push(...bolMatches.map(m => m.trim()));
    }

    // Charter party references
    const cpMatches = content.match(/C\/P\s*(?:#|No\.?)?\s*([A-Z0-9-]+)/gi);
    if (cpMatches) {
      references.push(...cpMatches.map(m => m.trim()));
    }

    // Invoice numbers
    const invMatches = content.match(/INV(?:OICE)?\s*(?:#|No\.?)?\s*([A-Z0-9-]+)/gi);
    if (invMatches) {
      references.push(...invMatches.map(m => m.trim()));
    }

    return [...new Set(references)]; // Deduplicate
  }

  private extractFixtureTerms(content: string): any {
    return {
      cargo: this.extractCargo(content)?.[0]?.description,
      quantity: this.extractCargo(content)?.[0]?.quantity,
      loadPort: this.extractPorts(content)?.find(p => p.type === 'loading')?.name,
      dischargePort: this.extractPorts(content)?.find(p => p.type === 'discharge')?.name,
      laycan: this.extractLaycan(content),
      freight: this.extractRates(content)?.[0],
    };
  }

  private extractVessels(content: string): ExtractedData['vessels'] {
    const vessels: ExtractedData['vessels'] = [];

    // Vessel name patterns
    const namePatterns = [
      /(?:M\/V|MV|MT|S\/S)\s+([A-Z][A-Z\s]+?)(?:\n|,|\.|\s+IMO|\s+\d)/i,
      /Vessel:\s*([A-Z][A-Z\s]+?)(?:\n|,|$)/i,
    ];

    for (const pattern of namePatterns) {
      const match = content.match(pattern);
      if (match) {
        vessels.push({
          name: match[1].trim(),
        });
        break;
      }
    }

    return vessels.length > 0 ? vessels : undefined;
  }

  private extractParties(content: string): ExtractedData['parties'] {
    const parties: ExtractedData['parties'] = [];

    // Extract From/To from email headers
    const fromMatch = content.match(/From:\s*(.+?)(?:\n|<)/i);
    if (fromMatch) {
      parties.push({
        role: 'sender',
        name: fromMatch[1].trim(),
      });
    }

    const toMatch = content.match(/To:\s*(.+?)(?:\n|<)/i);
    if (toMatch) {
      parties.push({
        role: 'recipient',
        name: toMatch[1].trim(),
      });
    }

    return parties.length > 0 ? parties : undefined;
  }

  private extractPorts(content: string): ExtractedData['ports'] {
    const ports: ExtractedData['ports'] = [];

    // Loading port patterns
    const loadingPatterns = [
      /(?:Load(?:ing)?|POL):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
      /from\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+to/i,
    ];

    for (const pattern of loadingPatterns) {
      const match = content.match(pattern);
      if (match) {
        ports.push({
          name: match[1].trim(),
          type: 'loading',
        });
        break;
      }
    }

    // Discharge port patterns
    const dischargePatterns = [
      /(?:Disch(?:arge)?|POD):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
      /to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    ];

    for (const pattern of dischargePatterns) {
      const match = content.match(pattern);
      if (match && !ports.find(p => p.name === match[1].trim())) {
        ports.push({
          name: match[1].trim(),
          type: 'discharge',
        });
        break;
      }
    }

    return ports.length > 0 ? ports : undefined;
  }

  private extractCargo(content: string): ExtractedData['cargo'] {
    const cargoMatch = content.match(/Cargo:\s*(.+?)(?:\n|Quantity|,)/i);
    const quantityMatch = content.match(/([\d,]+)\s*(?:MT|tons?|TEU)/i);

    if (cargoMatch) {
      return [{
        description: cargoMatch[1].trim(),
        quantity: quantityMatch ? parseInt(quantityMatch[1].replace(/,/g, '')) : undefined,
        unit: quantityMatch?.[0].match(/MT|tons?|TEU/i)?.[0],
      }];
    }
  }

  private extractRates(content: string): ExtractedData['rates'] {
    const rates: ExtractedData['rates'] = [];

    // Freight rate
    const freightMatch = content.match(/Freight:?\s*(?:USD|EUR|GBP)?\s*([\d,]+(?:\.\d{2})?)\s*(?:per\s+(?:MT|ton))?/i);
    if (freightMatch) {
      const currency = content.match(/(?:USD|EUR|GBP)/i)?.[0] || 'USD';
      rates.push({
        type: 'freight',
        amount: parseFloat(freightMatch[1].replace(/,/g, '')),
        currency,
        unit: content.match(/per\s+(MT|ton)/i)?.[1],
      });
    }

    return rates.length > 0 ? rates : undefined;
  }

  private extractLaycan(content: string): string | undefined {
    const laycanMatch = content.match(/Laycan[:\s]+([\d-/]+)\s*(?:to|-)?\s*([\d-/]+)?/i);
    if (laycanMatch) {
      return laycanMatch[2]
        ? `${laycanMatch[1]} - ${laycanMatch[2]}`
        : laycanMatch[1];
    }
  }

  private extractDateInfo(content: string): ExtractedData['dates'] {
    const dateInfo: ExtractedData['dates'] = [];

    // Email date
    const emailDateMatch = content.match(/Date:\s*(.+?)(?:\n|$)/i);
    if (emailDateMatch) {
      dateInfo.push({
        type: 'email_date',
        date: emailDateMatch[1].trim(),
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
