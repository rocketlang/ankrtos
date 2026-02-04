export interface ClassificationResult {
  docType: string;
  category: string;
  confidence: number;
  tags: string[];
}

export class DocumentClassifier {
  /**
   * Auto-detect document type and category
   */
  async process(document: any): Promise<ClassificationResult> {
    const content = this._extractText(document);
    const contentLower = content.toLowerCase();

    // Initialize scores for each doc type
    const scores = {
      charter_party: 0,
      bol: 0,
      email: 0,
      market_report: 0,
      sop: 0,
      compliance: 0,
      invoice: 0,
    };

    // Charter Party detection
    if (this._matchHeader(contentLower, ['charter party', 'charterparty', 'time charter', 'voyage charter'])) {
      scores.charter_party += 50;
    }
    if (this._containsKeywords(contentLower, ['gencon', 'nype', 'baltime', 'barecon', 'shelltime'])) {
      scores.charter_party += 30;
    }
    if (this._containsKeywords(contentLower, ['hire', 'freight', 'demurrage', 'despatch', 'laycan', 'laytime'])) {
      scores.charter_party += 20;
    }

    // BOL detection
    if (this._matchHeader(contentLower, ['bill of lading', 'b/l', 'bl number', 'master b/l', 'house b/l'])) {
      scores.bol += 50;
    }
    if (this._containsKeywords(contentLower, ['shipper', 'consignee', 'notify party', 'shipped on board'])) {
      scores.bol += 30;
    }
    if (this._containsKeywords(contentLower, ['container no', 'seal no', 'freight prepaid', 'freight collect'])) {
      scores.bol += 20;
    }

    // Email detection
    if (this._matchHeader(contentLower, ['from:', 'to:', 'subject:', 'dear', 'regards'])) {
      scores.email += 40;
    }
    if (content.includes('@') && content.includes('.com')) {
      scores.email += 30;
    }

    // Market Report detection
    if (this._matchHeader(contentLower, ['market report', 'market analysis', 'freight market'])) {
      scores.market_report += 50;
    }
    if (this._containsKeywords(contentLower, ['bdi', 'baltic index', 'freight rates', 'market sentiment'])) {
      scores.market_report += 30;
    }

    // SOP detection
    if (this._matchHeader(contentLower, ['standard operating procedure', 'sop', 'procedure', 'workflow'])) {
      scores.sop += 50;
    }
    if (this._hasNumberedSections(content)) {
      scores.sop += 20;
    }

    // Compliance detection
    if (this._containsKeywords(contentLower, ['imo', 'solas', 'marpol', 'isps', 'ism code', 'regulation'])) {
      scores.compliance += 40;
    }

    // Invoice detection
    if (this._matchHeader(contentLower, ['invoice', 'proforma invoice', 'commercial invoice'])) {
      scores.invoice += 50;
    }
    if (this._containsKeywords(contentLower, ['invoice no', 'total amount', 'payment terms', 'bank details'])) {
      scores.invoice += 30;
    }

    // Find highest score
    let maxScore = 0;
    let detectedType = 'document';

    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedType = type;
      }
    }

    // Calculate confidence (0-1 scale)
    const confidence = Math.min(maxScore / 100, 1);

    // Determine category
    const category = this._determineCategory(detectedType, contentLower);

    // Generate auto-tags
    const tags = this._generateTags(detectedType, contentLower);

    return {
      docType: confidence > 0.5 ? detectedType : document.category || 'document',
      category,
      confidence,
      tags,
    };
  }

  /**
   * Extract text content from document
   */
  private _extractText(document: any): string {
    return (document.notes || document.fileName || '').toLowerCase();
  }

  /**
   * Match header patterns
   */
  private _matchHeader(content: string, patterns: string[]): boolean {
    const firstLines = content.slice(0, 500);
    return patterns.some((pattern) => firstLines.includes(pattern));
  }

  /**
   * Check if content contains keywords
   */
  private _containsKeywords(content: string, keywords: string[]): boolean {
    return keywords.some((keyword) => content.includes(keyword));
  }

  /**
   * Check if document has numbered sections
   */
  private _hasNumberedSections(content: string): boolean {
    const numberedPattern = /\n\s*\d+\.\s+[A-Z]/g;
    const matches = content.match(numberedPattern);
    return matches ? matches.length > 3 : false;
  }

  /**
   * Determine document category
   */
  private _determineCategory(docType: string, content: string): string {
    if (docType === 'charter_party') {
      if (content.includes('time charter')) return 'time_charter';
      if (content.includes('voyage charter')) return 'voyage_charter';
      if (content.includes('bareboat')) return 'bareboat_charter';
      return 'fixture';
    }

    if (docType === 'bol') {
      return 'operations';
    }

    if (docType === 'email') {
      if (this._containsKeywords(content, ['fixture', 'offer', 'counter', 'subjects'])) {
        return 'fixture';
      }
      if (this._containsKeywords(content, ['claim', 'dispute', 'damage'])) {
        return 'claims';
      }
      if (this._containsKeywords(content, ['eta', 'etd', 'berth', 'cargo operations'])) {
        return 'operations';
      }
      return 'commercial';
    }

    if (docType === 'compliance' || docType === 'sop') {
      return 'compliance';
    }

    if (docType === 'market_report') {
      return 'commercial';
    }

    if (docType === 'invoice') {
      return 'commercial';
    }

    return 'general';
  }

  /**
   * Generate auto-tags based on content
   */
  private _generateTags(docType: string, content: string): string[] {
    const tags: string[] = [];

    // Charter party specific tags
    if (docType === 'charter_party') {
      if (content.includes('gencon')) tags.push('gencon');
      if (content.includes('nype')) tags.push('nype');
      if (content.includes('baltime')) tags.push('baltime');
      if (content.includes('ice clause')) tags.push('ice_clause');
      if (content.includes('war clause')) tags.push('war_clause');
      if (content.includes('substitution')) tags.push('substitution');
      if (content.includes('lien')) tags.push('lien');
      if (content.includes('arbitration')) tags.push('arbitration');
    }

    // Cargo type tags
    if (content.includes('coal')) tags.push('coal');
    if (content.includes('grain')) tags.push('grain');
    if (content.includes('iron ore')) tags.push('iron_ore');
    if (content.includes('container')) tags.push('container');
    if (content.includes('crude oil') || content.includes('petroleum')) tags.push('crude_oil');

    // Urgency tags
    if (content.includes('urgent') || content.includes('asap')) tags.push('urgent');
    if (content.includes('critical')) tags.push('critical');

    // Trade route tags
    if (content.includes('atlantic')) tags.push('atlantic');
    if (content.includes('pacific')) tags.push('pacific');
    if (content.includes('far east')) tags.push('far_east');
    if (content.includes('middle east')) tags.push('middle_east');

    return tags;
  }
}
