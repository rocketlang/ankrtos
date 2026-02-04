export interface EmailExtraction {
  fullText: string;
  section?: string;
  docType: string;

  // Email metadata
  from?: string;
  to?: string;
  subject?: string;
  date?: string;

  // Classification
  category: string; // fixture, operations, claims, commercial, technical
  urgency: string; // critical, high, medium, low
  actionable: boolean;
  hasDeadline: boolean;

  // Entity extraction
  vesselNames: string[];
  portNames: string[];
  cargoTypes: string[];
  parties: string[];

  // References
  references: string[]; // voyage numbers, BOL numbers, C/P references

  // Deal terms (for fixture emails)
  dealTerms?: {
    vessel?: string;
    cargo?: string;
    route?: string;
    rate?: string;
    laycan?: string;
  };

  // Metadata
  vesselId?: string;
  voyageId?: string;
  importance: number;
  tags: string[];
}

export class EmailProcessor {
  /**
   * Process and classify email documents
   */
  async process(document: any): Promise<EmailExtraction> {
    const content = document.notes || '';
    const fileName = document.fileName || '';

    // Extract email metadata
    const from = this._extractFrom(content);
    const to = this._extractTo(content);
    const subject = this._extractSubject(content, fileName);
    const date = this._extractDate(content);

    // Classify email
    const category = this._classifyCategory(content, subject);
    const urgency = this._detectUrgency(content, subject);
    const actionable = this._detectActionable(content);
    const hasDeadline = this._detectDeadline(content);

    // Extract entities
    const vesselNames = this._extractVesselNames(content);
    const portNames = this._extractPortNames(content);
    const cargoTypes = this._extractCargoTypes(content);
    const parties = this._extractParties(content, from, to);

    // Extract references
    const references = this._extractReferences(content);

    // Extract deal terms (for fixture emails)
    const dealTerms = category === 'fixture' ? this._extractDealTerms(content) : undefined;

    // Calculate importance
    let importance = 0.4; // Base importance for emails
    if (urgency === 'critical') importance += 0.3;
    else if (urgency === 'high') importance += 0.2;
    if (actionable) importance += 0.1;
    if (hasDeadline) importance += 0.1;
    if (category === 'fixture') importance += 0.1;

    // Generate tags
    const tags = this._generateTags(content, category, urgency);

    return {
      fullText: content,
      docType: 'email',
      from,
      to,
      subject,
      date,
      category,
      urgency,
      actionable,
      hasDeadline,
      vesselNames,
      portNames,
      cargoTypes,
      parties,
      references,
      dealTerms,
      importance: Math.min(importance, 1),
      tags,
    };
  }

  private _extractFrom(content: string): string | undefined {
    const pattern = /^from[:\s]+(.+?)$/im;
    const match = content.match(pattern);
    return match ? match[1].trim() : undefined;
  }

  private _extractTo(content: string): string | undefined {
    const pattern = /^to[:\s]+(.+?)$/im;
    const match = content.match(pattern);
    return match ? match[1].trim() : undefined;
  }

  private _extractSubject(content: string, fileName: string): string | undefined {
    const pattern = /^subject[:\s]+(.+?)$/im;
    const match = content.match(pattern);
    if (match) return match[1].trim();

    // Try filename
    const filePattern = /(.+)\.(?:eml|msg|txt)/i;
    const fileMatch = fileName.match(filePattern);
    return fileMatch ? fileMatch[1] : undefined;
  }

  private _extractDate(content: string): string | undefined {
    const patterns = [
      /^date[:\s]+(.*?)$/im,
      /^sent[:\s]+(.*?)$/im,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1].trim();
    }
    return undefined;
  }

  private _classifyCategory(content: string, subject?: string): string {
    const text = (content + ' ' + (subject || '')).toLowerCase();

    // Fixture detection
    const fixtureKeywords = ['offer', 'counter', 'subjects', 'firm', 'cargo stem', 'fixture', 'spot market'];
    if (fixtureKeywords.some(k => text.includes(k))) return 'fixture';

    // Operations detection
    const opsKeywords = ['eta', 'etd', 'berth', 'cargo operations', 'loading', 'discharge', 'stowage'];
    if (opsKeywords.some(k => text.includes(k))) return 'operations';

    // Claims detection
    const claimsKeywords = ['claim', 'dispute', 'damage', 'shortage', 'loss', 'demurrage claim'];
    if (claimsKeywords.some(k => text.includes(k))) return 'claims';

    // Technical detection
    const techKeywords = ['breakdown', 'repair', 'maintenance', 'defect', 'survey', 'class'];
    if (techKeywords.some(k => text.includes(k))) return 'technical';

    // Default to commercial
    return 'commercial';
  }

  private _detectUrgency(content: string, subject?: string): string {
    const text = (content + ' ' + (subject || '')).toLowerCase();

    // Critical urgency
    const criticalKeywords = ['emergency', 'critical', 'immediate attention', 'asap', 'urgent!!!'];
    if (criticalKeywords.some(k => text.includes(k))) return 'critical';

    // High urgency
    const highKeywords = ['urgent', 'priority', 'time sensitive', 'deadline today'];
    if (highKeywords.some(k => text.includes(k))) return 'high';

    // Low urgency
    const lowKeywords = ['fyi', 'for your information', 'no rush', 'when you have time'];
    if (lowKeywords.some(k => text.includes(k))) return 'low';

    // Default to medium
    return 'medium';
  }

  private _detectActionable(content: string): boolean {
    const contentLower = content.toLowerCase();
    const actionKeywords = [
      'please', 'kindly', 'request', 'could you', 'can you', 'would you',
      'action required', 'respond', 'confirm', 'approve', 'review',
    ];

    return actionKeywords.some(k => contentLower.includes(k));
  }

  private _detectDeadline(content: string): boolean {
    const contentLower = content.toLowerCase();
    const deadlineKeywords = [
      'deadline', 'by end of day', 'by eod', 'by cob', 'before',
      'due date', 'expires', 'must be', 'no later than',
    ];

    return deadlineKeywords.some(k => contentLower.includes(k));
  }

  private _extractVesselNames(content: string): string[] {
    const vessels: string[] = [];
    const patterns = [
      /(?:M\/V|MV|MT)\s+([A-Z][A-Za-z0-9\s-]+?)(?:\s|,|\.|\n|$)/gi,
      /vessel[:\s]+([A-Z][A-Za-z0-9\s-]+?)(?:\s|,|\.|\n|$)/gi,
    ];

    for (const pattern of patterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        vessels.push(match[1].trim());
      }
    }

    return [...new Set(vessels)];
  }

  private _extractPortNames(content: string): string[] {
    const ports: string[] = [];
    const commonPorts = [
      'Singapore', 'Rotterdam', 'Shanghai', 'Hong Kong', 'Busan', 'Dubai',
      'Los Angeles', 'Hamburg', 'Antwerp', 'Mumbai', 'Jebel Ali',
    ];

    for (const port of commonPorts) {
      if (content.includes(port)) {
        ports.push(port);
      }
    }

    return [...new Set(ports)];
  }

  private _extractCargoTypes(content: string): string[] {
    const cargo: string[] = [];
    const contentLower = content.toLowerCase();
    const cargoTypes = [
      'coal', 'iron ore', 'grain', 'wheat', 'corn', 'steel', 'crude oil',
      'containers', 'lng', 'lpg', 'fertilizer', 'cement',
    ];

    for (const type of cargoTypes) {
      if (contentLower.includes(type)) {
        cargo.push(type.replace(/\s+/g, '_'));
      }
    }

    return cargo;
  }

  private _extractParties(content: string, from?: string, to?: string): string[] {
    const parties: string[] = [];

    if (from) {
      const fromMatch = from.match(/([A-Z][A-Za-z\s&]+?)(?:\s*<|$)/);
      if (fromMatch) parties.push(fromMatch[1].trim());
    }

    if (to) {
      const toMatch = to.match(/([A-Z][A-Za-z\s&]+?)(?:\s*<|$)/);
      if (toMatch) parties.push(toMatch[1].trim());
    }

    return [...new Set(parties)];
  }

  private _extractReferences(content: string): string[] {
    const references: string[] = [];

    // Voyage numbers
    const voyagePattern = /voyage[:\s]+([A-Z0-9-]+)/gi;
    const voyageMatches = content.matchAll(voyagePattern);
    for (const match of voyageMatches) {
      references.push(`VOY-${match[1]}`);
    }

    // BOL numbers
    const bolPattern = /B\/L[:\s]+([A-Z0-9-]+)/gi;
    const bolMatches = content.matchAll(bolPattern);
    for (const match of bolMatches) {
      references.push(`BOL-${match[1]}`);
    }

    // C/P references
    const cpPattern = /C\/P[:\s]+([A-Z0-9-]+)/gi;
    const cpMatches = content.matchAll(cpPattern);
    for (const match of cpMatches) {
      references.push(`CP-${match[1]}`);
    }

    return [...new Set(references)];
  }

  private _extractDealTerms(content: string): any {
    const terms: any = {};

    // Vessel
    const vesselPattern = /(?:M\/V|MV|MT)\s+([A-Z][A-Za-z0-9\s-]+?)(?:\s|,|\n)/i;
    const vesselMatch = content.match(vesselPattern);
    if (vesselMatch) terms.vessel = vesselMatch[1].trim();

    // Cargo
    const cargoPattern = /cargo[:\s]+([A-Za-z\s]+?)(?:\s+\d|,|\n)/i;
    const cargoMatch = content.match(cargoPattern);
    if (cargoMatch) terms.cargo = cargoMatch[1].trim();

    // Route
    const routePattern = /([A-Z][a-z]+)\s*[-/]\s*([A-Z][a-z]+)/;
    const routeMatch = content.match(routePattern);
    if (routeMatch) terms.route = `${routeMatch[1]}-${routeMatch[2]}`;

    // Rate
    const ratePattern = /(?:rate|freight)[:\s]+USD?\s*(\d+(?:\.\d{2})?)/i;
    const rateMatch = content.match(ratePattern);
    if (rateMatch) terms.rate = `USD ${rateMatch[1]}`;

    // Laycan
    const laycanPattern = /laycan[:\s]+([\d]{1,2}[-\/][\d]{1,2}\s+[A-Z][a-z]+)/i;
    const laycanMatch = content.match(laycanPattern);
    if (laycanMatch) terms.laycan = laycanMatch[1];

    return Object.keys(terms).length > 0 ? terms : undefined;
  }

  private _generateTags(content: string, category: string, urgency: string): string[] {
    const tags: string[] = [category];

    if (urgency !== 'medium') tags.push(urgency);

    const contentLower = content.toLowerCase();

    // Fixture-specific tags
    if (category === 'fixture') {
      if (contentLower.includes('firm')) tags.push('firm_offer');
      if (contentLower.includes('subjects')) tags.push('subjects');
      if (contentLower.includes('counter')) tags.push('counter_offer');
    }

    // Operations-specific tags
    if (category === 'operations') {
      if (contentLower.includes('loading')) tags.push('loading');
      if (contentLower.includes('discharge')) tags.push('discharge');
      if (contentLower.includes('delay')) tags.push('delay');
    }

    return tags;
  }
}
