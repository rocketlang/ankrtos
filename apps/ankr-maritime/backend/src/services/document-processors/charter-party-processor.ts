export interface CharterPartyExtraction {
  fullText: string;
  section?: string;
  docType: string;

  // Parties
  owner?: string;
  charterer?: string;
  broker?: string;
  parties: string[];

  // Vessel details
  vesselName?: string;
  imo?: string;
  dwt?: string;
  flag?: string;
  builtYear?: string;
  vesselNames: string[];

  // Commercial terms
  freightRate?: string;
  hireRate?: string;
  commission?: string;
  laytimeAllowed?: string;
  demurrageRate?: string;
  despatchRate?: string;

  // Voyage details
  loadPorts: string[];
  dischargePorts: string[];
  portNames: string[];
  laycan?: string;
  cargoDescription?: string;
  cargoTypes: string[];

  // Metadata
  vesselId?: string;
  voyageId?: string;
  charterId?: string;
  importance: number;
  tags: string[];
}

export class CharterPartyProcessor {
  /**
   * Extract entities and metadata from Charter Party documents
   */
  async process(document: any): Promise<CharterPartyExtraction> {
    const content = document.notes || '';
    const fileName = document.fileName || '';

    // Extract parties
    const owner = this._extractOwner(content);
    const charterer = this._extractCharterer(content);
    const broker = this._extractBroker(content);

    const parties = [owner, charterer, broker].filter(Boolean) as string[];

    // Extract vessel details
    const vesselName = this._extractVesselName(content, fileName);
    const imo = this._extractIMO(content);
    const dwt = this._extractDWT(content);
    const flag = this._extractFlag(content);
    const builtYear = this._extractBuiltYear(content);

    const vesselNames = vesselName ? [vesselName] : [];

    // Extract commercial terms
    const freightRate = this._extractFreightRate(content);
    const hireRate = this._extractHireRate(content);
    const commission = this._extractCommission(content);
    const laytimeAllowed = this._extractLaytime(content);
    const demurrageRate = this._extractDemurrage(content);
    const despatchRate = this._extractDespatch(content);

    // Extract voyage details
    const loadPorts = this._extractLoadPorts(content);
    const dischargePorts = this._extractDischargePorts(content);
    const portNames = [...loadPorts, ...dischargePorts];
    const laycan = this._extractLaycan(content);
    const cargoDescription = this._extractCargo(content);
    const cargoTypes = this._extractCargoTypes(cargoDescription);

    // Calculate importance (higher for fixture docs with complete info)
    let importance = 0.5;
    if (freightRate || hireRate) importance += 0.2;
    if (vesselName) importance += 0.1;
    if (laycan) importance += 0.1;
    if (loadPorts.length > 0) importance += 0.1;

    // Generate tags
    const tags = this._generateTags(content);

    return {
      fullText: content,
      docType: 'charter_party',
      owner,
      charterer,
      broker,
      parties,
      vesselName,
      imo,
      dwt,
      flag,
      builtYear,
      vesselNames,
      freightRate,
      hireRate,
      commission,
      laytimeAllowed,
      demurrageRate,
      despatchRate,
      loadPorts,
      dischargePorts,
      portNames,
      laycan,
      cargoDescription,
      cargoTypes,
      importance: Math.min(importance, 1),
      tags,
    };
  }

  private _extractOwner(content: string): string | undefined {
    const patterns = [
      /owner[:\s]+([A-Z][A-Za-z\s&.,]+?)(?:\n|$)/i,
      /disponent owner[:\s]+([A-Z][A-Za-z\s&.,]+?)(?:\n|$)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1].trim();
    }
    return undefined;
  }

  private _extractCharterer(content: string): string | undefined {
    const patterns = [
      /charterer[:\s]+([A-Z][A-Za-z\s&.,]+?)(?:\n|$)/i,
      /time charterer[:\s]+([A-Z][A-Za-z\s&.,]+?)(?:\n|$)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1].trim();
    }
    return undefined;
  }

  private _extractBroker(content: string): string | undefined {
    const pattern = /broker[:\s]+([A-Z][A-Za-z\s&.,]+?)(?:\n|$)/i;
    const match = content.match(pattern);
    return match ? match[1].trim() : undefined;
  }

  private _extractVesselName(content: string, fileName: string): string | undefined {
    // Try to extract from content
    const patterns = [
      /vessel[:\s]+(?:M\/V|MV|MT)?\s*([A-Z][A-Za-z0-9\s-]+?)(?:\s+\(|,|\n|$)/i,
      /(?:M\/V|MV|MT)\s+([A-Z][A-Za-z0-9\s-]+?)(?:\s+\(|,|\n|$)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1].trim();
    }

    // Try to extract from filename
    const filePattern = /(?:M\/V|MV|MT)[-_\s]([A-Za-z0-9\s-]+)/i;
    const fileMatch = fileName.match(filePattern);
    if (fileMatch) return fileMatch[1].trim();

    return undefined;
  }

  private _extractIMO(content: string): string | undefined {
    const pattern = /IMO[:\s]*(\d{7})/i;
    const match = content.match(pattern);
    return match ? match[1] : undefined;
  }

  private _extractDWT(content: string): string | undefined {
    const patterns = [
      /(\d{1,3}(?:,\d{3})*)\s*(?:MT\s+)?DWT/i,
      /DWT[:\s]*(\d{1,3}(?:,\d{3})*)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1].replace(/,/g, '');
    }
    return undefined;
  }

  private _extractFlag(content: string): string | undefined {
    const pattern = /flag[:\s]+([A-Z][a-z]+)/i;
    const match = content.match(pattern);
    return match ? match[1] : undefined;
  }

  private _extractBuiltYear(content: string): string | undefined {
    const patterns = [
      /built[:\s]+(19\d{2}|20\d{2})/i,
      /year[:\s]+(19\d{2}|20\d{2})/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1];
    }
    return undefined;
  }

  private _extractFreightRate(content: string): string | undefined {
    const patterns = [
      /freight[:\s]+USD?\s*(\d+(?:\.\d{2})?)\s*(?:per|\/)\s*(?:MT|ton)/i,
      /rate[:\s]+USD?\s*(\d+(?:\.\d{2})?)\s*(?:per|\/)\s*(?:MT|ton)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return `USD ${match[1]} per MT`;
    }
    return undefined;
  }

  private _extractHireRate(content: string): string | undefined {
    const patterns = [
      /hire[:\s]+USD?\s*(\d{1,3}(?:,\d{3})*)\s*(?:per|\/)\s*day/i,
      /daily hire[:\s]+USD?\s*(\d{1,3}(?:,\d{3})*)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return `USD ${match[1].replace(/,/g, '')} per day`;
    }
    return undefined;
  }

  private _extractCommission(content: string): string | undefined {
    const pattern = /commission[:\s]+(\d+(?:\.\d+)?)\s*%/i;
    const match = content.match(pattern);
    return match ? `${match[1]}%` : undefined;
  }

  private _extractLaytime(content: string): string | undefined {
    const patterns = [
      /laytime[:\s]+(\d+)\s*(?:running\s+)?(?:hours|days)/i,
      /(\d+)\s*(?:running\s+)?(?:hours|days)\s+laytime/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[0];
    }
    return undefined;
  }

  private _extractDemurrage(content: string): string | undefined {
    const pattern = /demurrage[:\s]+USD?\s*(\d{1,3}(?:,\d{3})*)\s*(?:per|\/)\s*day/i;
    const match = content.match(pattern);
    return match ? `USD ${match[1].replace(/,/g, '')} per day` : undefined;
  }

  private _extractDespatch(content: string): string | undefined {
    const pattern = /despatch[:\s]+USD?\s*(\d{1,3}(?:,\d{3})*)\s*(?:per|\/)\s*day/i;
    const match = content.match(pattern);
    return match ? `USD ${match[1].replace(/,/g, '')} per day` : undefined;
  }

  private _extractLoadPorts(content: string): string[] {
    const ports: string[] = [];
    const patterns = [
      /load(?:ing)?\s+port[s]?[:\s]+([A-Z][A-Za-z\s,/]+?)(?:\n|discharge|laycan)/i,
      /load[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        const portList = match[1].split(/[,/]/).map(p => p.trim());
        ports.push(...portList);
      }
    }

    return [...new Set(ports)];
  }

  private _extractDischargePorts(content: string): string[] {
    const ports: string[] = [];
    const patterns = [
      /discharge\s+port[s]?[:\s]+([A-Z][A-Za-z\s,/]+?)(?:\n|laycan|cargo)/i,
      /discharge[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        const portList = match[1].split(/[,/]/).map(p => p.trim());
        ports.push(...portList);
      }
    }

    return [...new Set(ports)];
  }

  private _extractLaycan(content: string): string | undefined {
    const patterns = [
      /laycan[:\s]+([\d]{1,2}[-\/][\d]{1,2}\s+[A-Z][a-z]+\s+\d{4})/i,
      /laycan[:\s]+([\d]{1,2}[-\/][\d]{1,2}\s+[A-Z][a-z]+)/i,
      /([\d]{1,2}[-\/][\d]{1,2}\s+[A-Z][a-z]+\s+\d{4})\s+laycan/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1];
    }
    return undefined;
  }

  private _extractCargo(content: string): string | undefined {
    const patterns = [
      /cargo[:\s]+([A-Za-z\s,]+?)(?:\s+\d|quantity|laycan|\n)/i,
      /commodity[:\s]+([A-Za-z\s,]+?)(?:\s+\d|quantity|\n)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1].trim();
    }
    return undefined;
  }

  private _extractCargoTypes(cargoDescription?: string): string[] {
    if (!cargoDescription) return [];

    const cargo = cargoDescription.toLowerCase();
    const types: string[] = [];

    if (cargo.includes('coal')) types.push('coal');
    if (cargo.includes('grain') || cargo.includes('wheat') || cargo.includes('corn')) types.push('grain');
    if (cargo.includes('iron ore')) types.push('iron_ore');
    if (cargo.includes('steel')) types.push('steel');
    if (cargo.includes('crude') || cargo.includes('oil')) types.push('crude_oil');
    if (cargo.includes('container')) types.push('container');
    if (cargo.includes('lng') || cargo.includes('gas')) types.push('lng');

    return types;
  }

  private _generateTags(content: string): string[] {
    const tags: string[] = [];
    const contentLower = content.toLowerCase();

    // C/P type
    if (contentLower.includes('time charter')) tags.push('time_charter');
    if (contentLower.includes('voyage charter')) tags.push('voyage_charter');
    if (contentLower.includes('bareboat')) tags.push('bareboat');

    // Standard forms
    if (contentLower.includes('gencon')) tags.push('gencon');
    if (contentLower.includes('nype')) tags.push('nype');
    if (contentLower.includes('baltime')) tags.push('baltime');

    // Clauses
    if (contentLower.includes('ice clause')) tags.push('ice_clause');
    if (contentLower.includes('war clause')) tags.push('war_clause');
    if (contentLower.includes('substitution')) tags.push('substitution');
    if (contentLower.includes('lien')) tags.push('lien_clause');
    if (contentLower.includes('arbitration')) tags.push('arbitration');

    return tags;
  }
}
