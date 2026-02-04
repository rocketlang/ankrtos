export interface BOLExtraction {
  fullText: string;
  section?: string;
  docType: string;

  // BOL details
  bolNumber?: string;
  bolType?: string; // master, house, seaway

  // Parties
  shipper?: string;
  consignee?: string;
  notifyParty?: string;
  parties: string[];

  // Vessel details
  vesselName?: string;
  imo?: string;
  voyageNumber?: string;
  vesselNames: string[];

  // Ports
  portOfLoading?: string;
  portOfDischarge?: string;
  portOfReceipt?: string;
  portOfDelivery?: string;
  portNames: string[];

  // Cargo details
  cargoDescription?: string;
  quantity?: string;
  weight?: string;
  measurement?: string;
  containerNumbers: string[];
  cargoTypes: string[];

  // Dates
  shippedDate?: string;
  onBoardDate?: string;

  // Freight
  freightTerms?: string; // prepaid, collect

  // Metadata
  vesselId?: string;
  voyageId?: string;
  importance: number;
  tags: string[];
}

export class BOLProcessor {
  /**
   * Extract entities and metadata from Bill of Lading documents
   */
  async process(document: any): Promise<BOLExtraction> {
    const content = document.notes || '';
    const fileName = document.fileName || '';

    // Extract BOL details
    const bolNumber = this._extractBOLNumber(content, fileName);
    const bolType = this._extractBOLType(content);

    // Extract parties
    const shipper = this._extractShipper(content);
    const consignee = this._extractConsignee(content);
    const notifyParty = this._extractNotifyParty(content);
    const parties = [shipper, consignee, notifyParty].filter(Boolean) as string[];

    // Extract vessel details
    const vesselName = this._extractVesselName(content);
    const imo = this._extractIMO(content);
    const voyageNumber = this._extractVoyageNumber(content);
    const vesselNames = vesselName ? [vesselName] : [];

    // Extract ports
    const portOfLoading = this._extractPort(content, 'loading');
    const portOfDischarge = this._extractPort(content, 'discharge');
    const portOfReceipt = this._extractPort(content, 'receipt');
    const portOfDelivery = this._extractPort(content, 'delivery');
    const portNames = [portOfLoading, portOfDischarge, portOfReceipt, portOfDelivery]
      .filter(Boolean) as string[];

    // Extract cargo details
    const cargoDescription = this._extractCargoDescription(content);
    const quantity = this._extractQuantity(content);
    const weight = this._extractWeight(content);
    const measurement = this._extractMeasurement(content);
    const containerNumbers = this._extractContainerNumbers(content);
    const cargoTypes = this._extractCargoTypes(cargoDescription);

    // Extract dates
    const shippedDate = this._extractShippedDate(content);
    const onBoardDate = this._extractOnBoardDate(content);

    // Extract freight terms
    const freightTerms = this._extractFreightTerms(content);

    // Calculate importance
    let importance = 0.6; // BOLs are important operational documents
    if (bolNumber) importance += 0.1;
    if (vesselName) importance += 0.1;
    if (containerNumbers.length > 0) importance += 0.1;

    // Generate tags
    const tags = this._generateTags(content, bolType);

    return {
      fullText: content,
      docType: 'bol',
      bolNumber,
      bolType,
      shipper,
      consignee,
      notifyParty,
      parties,
      vesselName,
      imo,
      voyageNumber,
      vesselNames,
      portOfLoading,
      portOfDischarge,
      portOfReceipt,
      portOfDelivery,
      portNames,
      cargoDescription,
      quantity,
      weight,
      measurement,
      containerNumbers,
      cargoTypes,
      shippedDate,
      onBoardDate,
      freightTerms,
      importance: Math.min(importance, 1),
      tags,
    };
  }

  private _extractBOLNumber(content: string, fileName: string): string | undefined {
    const patterns = [
      /B\/L\s+(?:No|Number)[:\s]+([A-Z0-9-]+)/i,
      /Bill of Lading\s+(?:No|Number)[:\s]+([A-Z0-9-]+)/i,
      /BOL[:\s]+([A-Z0-9-]+)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1];
    }

    // Try filename
    const filePattern = /BOL[-_]([A-Z0-9-]+)/i;
    const fileMatch = fileName.match(filePattern);
    if (fileMatch) return fileMatch[1];

    return undefined;
  }

  private _extractBOLType(content: string): string | undefined {
    const contentLower = content.toLowerCase();
    if (contentLower.includes('master b/l') || contentLower.includes('master bill')) return 'master';
    if (contentLower.includes('house b/l') || contentLower.includes('house bill')) return 'house';
    if (contentLower.includes('seaway bill')) return 'seaway';
    return 'master'; // default
  }

  private _extractShipper(content: string): string | undefined {
    const pattern = /shipper[:\s]+([A-Z][A-Za-z\s&.,]+?)(?:\n\n|consignee|notify)/i;
    const match = content.match(pattern);
    return match ? match[1].trim() : undefined;
  }

  private _extractConsignee(content: string): string | undefined {
    const pattern = /consignee[:\s]+([A-Z][A-Za-z\s&.,]+?)(?:\n\n|notify|vessel)/i;
    const match = content.match(pattern);
    return match ? match[1].trim() : undefined;
  }

  private _extractNotifyParty(content: string): string | undefined {
    const pattern = /notify\s+party[:\s]+([A-Z][A-Za-z\s&.,]+?)(?:\n\n|vessel|port)/i;
    const match = content.match(pattern);
    return match ? match[1].trim() : undefined;
  }

  private _extractVesselName(content: string): string | undefined {
    const patterns = [
      /vessel[:\s]+(?:M\/V|MV|MT)?\s*([A-Z][A-Za-z0-9\s-]+?)(?:\s+\(|,|\n|$)/i,
      /(?:M\/V|MV|MT)\s+([A-Z][A-Za-z0-9\s-]+?)(?:\s+\(|,|\n|voyage)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1].trim();
    }
    return undefined;
  }

  private _extractIMO(content: string): string | undefined {
    const pattern = /IMO[:\s]*(\d{7})/i;
    const match = content.match(pattern);
    return match ? match[1] : undefined;
  }

  private _extractVoyageNumber(content: string): string | undefined {
    const patterns = [
      /voyage[:\s]+([A-Z0-9-]+)/i,
      /voy[:\s]+([A-Z0-9-]+)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1];
    }
    return undefined;
  }

  private _extractPort(content: string, type: string): string | undefined {
    const patterns: { [key: string]: RegExp[] } = {
      loading: [
        /port\s+of\s+loading[:\s]+([A-Z][A-Za-z\s]+?)(?:,|\n|$)/i,
        /POL[:\s]+([A-Z][A-Za-z\s]+?)(?:,|\n|$)/i,
      ],
      discharge: [
        /port\s+of\s+discharge[:\s]+([A-Z][A-Za-z\s]+?)(?:,|\n|$)/i,
        /POD[:\s]+([A-Z][A-Za-z\s]+?)(?:,|\n|$)/i,
      ],
      receipt: [
        /place\s+of\s+receipt[:\s]+([A-Z][A-Za-z\s]+?)(?:,|\n|$)/i,
        /POR[:\s]+([A-Z][A-Za-z\s]+?)(?:,|\n|$)/i,
      ],
      delivery: [
        /place\s+of\s+delivery[:\s]+([A-Z][A-Za-z\s]+?)(?:,|\n|$)/i,
      ],
    };

    const typePatterns = patterns[type] || [];
    for (const pattern of typePatterns) {
      const match = content.match(pattern);
      if (match) return match[1].trim();
    }
    return undefined;
  }

  private _extractCargoDescription(content: string): string | undefined {
    const patterns = [
      /description\s+of\s+goods[:\s]+([A-Za-z0-9\s,.-]+?)(?:\n\n|quantity|container)/i,
      /cargo[:\s]+([A-Za-z0-9\s,.-]+?)(?:\n|quantity|weight)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1].trim();
    }
    return undefined;
  }

  private _extractQuantity(content: string): string | undefined {
    const patterns = [
      /quantity[:\s]+(\d+(?:\.\d+)?)\s*([A-Z]+)/i,
      /(\d+(?:\.\d+)?)\s+(packages|cartons|bags|containers)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return `${match[1]} ${match[2]}`;
    }
    return undefined;
  }

  private _extractWeight(content: string): string | undefined {
    const patterns = [
      /gross\s+weight[:\s]+(\d+(?:,\d{3})*(?:\.\d+)?)\s*(KG|MT|LBS)/i,
      /weight[:\s]+(\d+(?:,\d{3})*(?:\.\d+)?)\s*(KG|MT|LBS)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return `${match[1].replace(/,/g, '')} ${match[2]}`;
    }
    return undefined;
  }

  private _extractMeasurement(content: string): string | undefined {
    const pattern = /measurement[:\s]+(\d+(?:\.\d+)?)\s*(CBM|M3)/i;
    const match = content.match(pattern);
    return match ? `${match[1]} ${match[2]}` : undefined;
  }

  private _extractContainerNumbers(content: string): string[] {
    // Container numbers follow ISO 6346 format: 4 letters + 7 digits
    const pattern = /([A-Z]{4}\d{7})/g;
    const matches = content.match(pattern);
    return matches ? [...new Set(matches)] : [];
  }

  private _extractCargoTypes(cargoDescription?: string): string[] {
    if (!cargoDescription) return [];

    const cargo = cargoDescription.toLowerCase();
    const types: string[] = [];

    if (cargo.includes('container')) types.push('container');
    if (cargo.includes('bulk')) types.push('bulk');
    if (cargo.includes('general cargo')) types.push('general_cargo');
    if (cargo.includes('dangerous') || cargo.includes('hazardous')) types.push('dangerous_goods');
    if (cargo.includes('reefer') || cargo.includes('refrigerated')) types.push('reefer');

    return types;
  }

  private _extractShippedDate(content: string): string | undefined {
    const patterns = [
      /shipped\s+(?:on\s+)?(?:board\s+)?date[:\s]+([\d]{1,2}[-\/][\d]{1,2}[-\/][\d]{4})/i,
      /date\s+of\s+shipment[:\s]+([\d]{1,2}[-\/][\d]{1,2}[-\/][\d]{4})/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1];
    }
    return undefined;
  }

  private _extractOnBoardDate(content: string): string | undefined {
    const pattern = /on\s+board\s+date[:\s]+([\d]{1,2}[-\/][\d]{1,2}[-\/][\d]{4})/i;
    const match = content.match(pattern);
    return match ? match[1] : undefined;
  }

  private _extractFreightTerms(content: string): string | undefined {
    const contentLower = content.toLowerCase();
    if (contentLower.includes('freight prepaid')) return 'prepaid';
    if (contentLower.includes('freight collect')) return 'collect';
    if (contentLower.includes('prepaid')) return 'prepaid';
    if (contentLower.includes('collect')) return 'collect';
    return undefined;
  }

  private _generateTags(content: string, bolType?: string): string[] {
    const tags: string[] = [];
    const contentLower = content.toLowerCase();

    if (bolType) tags.push(bolType);

    if (contentLower.includes('container')) tags.push('containerized');
    if (contentLower.includes('bulk')) tags.push('bulk');
    if (contentLower.includes('dangerous goods') || contentLower.includes('hazardous')) {
      tags.push('dangerous_goods');
    }
    if (contentLower.includes('reefer')) tags.push('reefer');
    if (contentLower.includes('lcl')) tags.push('lcl');
    if (contentLower.includes('fcl')) tags.push('fcl');

    return tags;
  }
}
