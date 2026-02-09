// document-parser.ts — AI-Powered Document Parsing for Maritime Documents

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

export enum DocumentType {
  CHARTER_PARTY = 'charter_party',
  BILL_OF_LADING = 'bill_of_lading',
  EMAIL = 'email',
  MARKET_REPORT = 'market_report',
  SURVEY_REPORT = 'survey_report',
  INVOICE = 'invoice',
  STATEMENT_OF_FACTS = 'statement_of_facts',
  UNKNOWN = 'unknown',
}

interface ParsedDocument {
  type: DocumentType;
  confidence: number;
  metadata: {
    title?: string;
    date?: Date;
    parties?: string[];
    vesselNames?: string[];
    ports?: string[];
    references?: string[];
  };
  structuredData?: CharterPartyData | BOLData | InvoiceData | SOFData;
  extractedClauses?: Clause[];
  extractedTerms?: CommercialTerm[];
  summary?: string;
  errors?: string[];
}

interface CharterPartyData {
  partyType: 'GENCON' | 'NYPE' | 'BALTIME' | 'CUSTOM';
  owner: { name: string; address?: string };
  charterer: { name: string; address?: string };
  broker?: { name: string };
  vessel: {
    name: string;
    imo?: string;
    dwt?: number;
    flag?: string;
    built?: number;
  };
  commercial: {
    freightRate?: number;
    hireRate?: number;
    currency?: string;
    commissionAddress?: number;
    commissionBrokerage?: number;
  };
  voyage?: {
    loadPort?: string;
    dischargePort?: string;
    cargo?: string;
    quantity?: number;
    laycanFrom?: Date;
    laycanTo?: Date;
  };
  clauses: string[];
}

interface BOLData {
  bolNumber: string;
  type: 'master' | 'house' | 'seaway';
  shipper: { name: string; address?: string };
  consignee: { name: string; address?: string };
  notifyParty?: { name: string; address?: string };
  vessel: { name: string; voyage?: string };
  portOfLoading: string;
  portOfDischarge: string;
  cargo: {
    description: string;
    quantity?: number;
    weight?: number;
    measurement?: number;
    containers?: string[];
  };
  freightTerms: 'prepaid' | 'collect' | 'unknown';
  shippedDate?: Date;
  onBoardDate?: Date;
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate?: Date;
  seller: { name: string; address?: string };
  buyer: { name: string; address?: string };
  lineItems: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    amount: number;
  }>;
  totals: {
    subtotal: number;
    tax?: number;
    total: number;
    currency: string;
  };
  paymentTerms?: string;
}

interface SOFData {
  vesselName: string;
  voyage?: string;
  portName: string;
  events: Array<{
    timestamp: Date;
    event: string;
    description?: string;
  }>;
  laytime: {
    commenced?: Date;
    completed?: Date;
    timeUsed?: number;
    timeAllowed?: number;
  };
  weather?: string[];
}

interface Clause {
  title: string;
  text: string;
  category?: string;
  confidence: number;
}

interface CommercialTerm {
  term: string;
  value: string | number;
  unit?: string;
  context?: string;
}

export class DocumentParser {
  /**
   * Parse document content and extract structured data
   */
  async parseDocument(
    content: string,
    fileName?: string,
    mimeType?: string
  ): Promise<ParsedDocument> {
    // 1. Detect document type
    const detectedType = this.detectDocumentType(content, fileName);

    // 2. Extract metadata
    const metadata = this.extractMetadata(content);

    // 3. Parse based on type
    let structuredData: any;
    let extractedClauses: Clause[] = [];
    let extractedTerms: CommercialTerm[] = [];

    switch (detectedType.type) {
      case DocumentType.CHARTER_PARTY:
        structuredData = this.parseCharterParty(content);
        extractedClauses = this.extractClauses(content);
        break;

      case DocumentType.BILL_OF_LADING:
        structuredData = this.parseBOL(content);
        break;

      case DocumentType.INVOICE:
        structuredData = this.parseInvoice(content);
        break;

      case DocumentType.STATEMENT_OF_FACTS:
        structuredData = this.parseSOF(content);
        break;

      case DocumentType.EMAIL:
        extractedTerms = this.extractCommercialTerms(content);
        break;
    }

    // 4. Generate summary
    const summary = this.generateSummary(detectedType.type, structuredData, content);

    return {
      type: detectedType.type,
      confidence: detectedType.confidence,
      metadata,
      structuredData,
      extractedClauses,
      extractedTerms,
      summary,
    };
  }

  /**
   * Detect document type from content
   */
  private detectDocumentType(
    content: string,
    fileName?: string
  ): { type: DocumentType; confidence: number } {
    const contentLower = content.toLowerCase();

    // Charter Party detection
    if (
      /\bcharter\s+party\b/i.test(content) ||
      /\b(gencon|nype|baltime|baltcon)\b/i.test(content) ||
      (contentLower.includes('owner') &&
        contentLower.includes('charterer') &&
        (contentLower.includes('freight') || contentLower.includes('hire')))
    ) {
      return { type: DocumentType.CHARTER_PARTY, confidence: 0.9 };
    }

    // Bill of Lading detection
    if (
      /\bbill\s+of\s+lading\b/i.test(content) ||
      /\bb\/l\b/i.test(content) ||
      (contentLower.includes('shipper') &&
        contentLower.includes('consignee') &&
        contentLower.includes('notify party'))
    ) {
      return { type: DocumentType.BILL_OF_LADING, confidence: 0.85 };
    }

    // Invoice detection
    if (
      /\binvoice\b/i.test(content) &&
      /\binvoice\s+(number|#|no\.?)\s*[:]\s*\w+/i.test(content) &&
      /\btotal\b/i.test(content)
    ) {
      return { type: DocumentType.INVOICE, confidence: 0.85 };
    }

    // Statement of Facts detection
    if (
      /\bstatement\s+of\s+facts\b/i.test(content) ||
      (/\bsof\b/i.test(content) &&
        (contentLower.includes('nor tendered') || contentLower.includes('commenced loading')))
    ) {
      return { type: DocumentType.STATEMENT_OF_FACTS, confidence: 0.8 };
    }

    // Market Report detection
    if (
      /\bmarket\s+(report|update|outlook|analysis)\b/i.test(content) ||
      (contentLower.includes('baltic') && contentLower.includes('index'))
    ) {
      return { type: DocumentType.MARKET_REPORT, confidence: 0.75 };
    }

    // Email detection (by file extension or headers)
    if (fileName?.endsWith('.eml') || fileName?.endsWith('.msg') || /^(from|to|subject):/im.test(content)) {
      return { type: DocumentType.EMAIL, confidence: 0.9 };
    }

    return { type: DocumentType.UNKNOWN, confidence: 0.3 };
  }

  /**
   * Extract general metadata
   */
  private extractMetadata(content: string): ParsedDocument['metadata'] {
    const metadata: ParsedDocument['metadata'] = {};

    // Extract title (first line or heading)
    const titleMatch = content.match(/^(.+?)(?:\n|$)/);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim().substring(0, 100);
    }

    // Extract dates
    const datePattern = /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/g;
    const dates = content.match(datePattern);
    if (dates && dates.length > 0) {
      try {
        metadata.date = new Date(dates[0]);
      } catch (e) {
        // Invalid date
      }
    }

    // Extract vessel names
    const vesselPattern = /\b(m\/?(v|t|s)|ss)\s+([\w\s-]{3,30})/gi;
    const vessels = [...content.matchAll(vesselPattern)];
    if (vessels.length > 0) {
      metadata.vesselNames = [...new Set(vessels.map((m) => m[0].trim()))].slice(0, 5);
    }

    // Extract ports (UN/LOCODE)
    const portPattern = /\b([A-Z]{5})\b/g;
    const ports = content.toUpperCase().match(portPattern);
    if (ports) {
      metadata.ports = [...new Set(ports)].slice(0, 10);
    }

    // Extract parties (companies)
    const partyPattern = /\b([A-Z][a-z]+\s+(?:[A-Z][a-z]+\s+)*(?:Ltd|Inc|Corp|GmbH|SA|BV|LLC|Limited)\.?)\b/g;
    const parties = [...content.matchAll(partyPattern)];
    if (parties.length > 0) {
      metadata.parties = [...new Set(parties.map((m) => m[0]))].slice(0, 5);
    }

    // Extract references (BOL, voyage, charter numbers)
    const refPattern = /\b(bol|b\/l|voyage|voy|charter|ref)[\s#:]*([A-Z0-9-]{4,20})/gi;
    const refs = [...content.matchAll(refPattern)];
    if (refs.length > 0) {
      metadata.references = [...new Set(refs.map((m) => `${m[1]}: ${m[2]}`))].slice(0, 5);
    }

    return metadata;
  }

  /**
   * Parse Charter Party document
   */
  private parseCharterParty(content: string): CharterPartyData {
    const data: Partial<CharterPartyData> = {
      clauses: [],
    };

    // Determine party type
    if (/\bgencon\b/i.test(content)) data.partyType = 'GENCON';
    else if (/\bnype\b/i.test(content)) data.partyType = 'NYPE';
    else if (/\bbaltime\b/i.test(content)) data.partyType = 'BALTIME';
    else data.partyType = 'CUSTOM';

    // Extract owner
    const ownerMatch = content.match(/owner[s]?[:\s]+([^\n]{5,100})/i);
    if (ownerMatch) {
      data.owner = { name: ownerMatch[1].trim() };
    }

    // Extract charterer
    const chartererMatch = content.match(/charterer[s]?[:\s]+([^\n]{5,100})/i);
    if (chartererMatch) {
      data.charterer = { name: chartererMatch[1].trim() };
    }

    // Extract vessel info
    const vesselMatch = content.match(/vessel[:\s]+([^\n]{5,100})/i);
    if (vesselMatch) {
      data.vessel = { name: vesselMatch[1].trim() };
    }

    const imoMatch = content.match(/imo[:\s#]*(\d{7})/i);
    if (imoMatch && data.vessel) {
      data.vessel.imo = imoMatch[1];
    }

    const dwtMatch = content.match(/dwt[:\s]*([\d,]+)/i);
    if (dwtMatch && data.vessel) {
      data.vessel.dwt = parseInt(dwtMatch[1].replace(/,/g, ''));
    }

    // Extract commercial terms
    const freightMatch = content.match(/freight[:\s]+(?:usd|eur|gbp)?\s*([\d.]+)/i);
    if (freightMatch) {
      data.commercial = data.commercial || {};
      data.commercial.freightRate = parseFloat(freightMatch[1]);
    }

    const hireMatch = content.match(/hire[:\s]+(?:usd|eur|gbp)?\s*([\d,]+)/i);
    if (hireMatch) {
      data.commercial = data.commercial || {};
      data.commercial.hireRate = parseFloat(hireMatch[1].replace(/,/g, ''));
    }

    // Extract voyage details
    const loadPortMatch = content.match(/load(?:ing)?\s+port[:\s]+([^\n]{3,50})/i);
    if (loadPortMatch) {
      data.voyage = data.voyage || {};
      data.voyage.loadPort = loadPortMatch[1].trim();
    }

    const dischargePortMatch = content.match(/discharge\s+port[:\s]+([^\n]{3,50})/i);
    if (dischargePortMatch) {
      data.voyage = data.voyage || {};
      data.voyage.dischargePort = dischargePortMatch[1].trim();
    }

    const cargoMatch = content.match(/cargo[:\s]+([^\n]{5,100})/i);
    if (cargoMatch) {
      data.voyage = data.voyage || {};
      data.voyage.cargo = cargoMatch[1].trim();
    }

    return data as CharterPartyData;
  }

  /**
   * Parse Bill of Lading
   */
  private parseBOL(content: string): BOLData {
    const data: Partial<BOLData> = {
      type: 'master',
    };

    // BOL number
    const bolNumMatch = content.match(/b\/l\s+(?:number|no\.?|#)[:\s]*(\w+[-]?\w*)/i);
    if (bolNumMatch) {
      data.bolNumber = bolNumMatch[1].toUpperCase();
    } else {
      data.bolNumber = 'UNKNOWN';
    }

    // Shipper
    const shipperMatch = content.match(/shipper[:\s]+([^\n]{5,150})/i);
    if (shipperMatch) {
      data.shipper = { name: shipperMatch[1].trim() };
    }

    // Consignee
    const consigneeMatch = content.match(/consignee[:\s]+([^\n]{5,150})/i);
    if (consigneeMatch) {
      data.consignee = { name: consigneeMatch[1].trim() };
    }

    // Notify party
    const notifyMatch = content.match(/notify\s+party[:\s]+([^\n]{5,150})/i);
    if (notifyMatch) {
      data.notifyParty = { name: notifyMatch[1].trim() };
    }

    // Vessel
    const vesselMatch = content.match(/vessel[:\s]+([^\n]{3,50})/i);
    if (vesselMatch) {
      data.vessel = { name: vesselMatch[1].trim() };
    }

    // Ports
    const loadPortMatch = content.match(/port\s+of\s+load(?:ing)?[:\s]+([^\n]{3,50})/i);
    if (loadPortMatch) {
      data.portOfLoading = loadPortMatch[1].trim();
    }

    const dischargePortMatch = content.match(/port\s+of\s+discharge[:\s]+([^\n]{3,50})/i);
    if (dischargePortMatch) {
      data.portOfDischarge = dischargePortMatch[1].trim();
    }

    // Cargo
    const cargoDescMatch = content.match(/description\s+of\s+(?:goods|cargo)[:\s]+([^\n]{5,200})/i);
    if (cargoDescMatch) {
      data.cargo = { description: cargoDescMatch[1].trim() };
    }

    // Freight terms
    if (/\bprepaid\b/i.test(content)) data.freightTerms = 'prepaid';
    else if (/\bcollect\b/i.test(content)) data.freightTerms = 'collect';
    else data.freightTerms = 'unknown';

    return data as BOLData;
  }

  /**
   * Parse Invoice
   */
  private parseInvoice(content: string): InvoiceData {
    const data: Partial<InvoiceData> = {
      lineItems: [],
    };

    // Invoice number
    const invoiceNumMatch = content.match(/invoice\s+(?:number|no\.?|#)[:\s]*(\w+[-\/]?\w*)/i);
    if (invoiceNumMatch) {
      data.invoiceNumber = invoiceNumMatch[1].toUpperCase();
    } else {
      data.invoiceNumber = 'UNKNOWN';
    }

    // Invoice date
    const dateMatch = content.match(/(?:invoice\s+)?date[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (dateMatch) {
      data.invoiceDate = new Date(dateMatch[1]);
    }

    // Total amount
    const totalMatch = content.match(/total[:\s]+(?:usd|eur|gbp)?\s*([\d,]+\.?\d*)/i);
    if (totalMatch) {
      const total = parseFloat(totalMatch[1].replace(/,/g, ''));
      data.totals = {
        subtotal: total,
        total,
        currency: 'USD',
      };
    }

    return data as InvoiceData;
  }

  /**
   * Parse Statement of Facts
   */
  private parseSOF(content: string): SOFData {
    const data: Partial<SOFData> = {
      events: [],
    };

    // Vessel name
    const vesselMatch = content.match(/vessel[:\s]+([^\n]{3,50})/i);
    if (vesselMatch) {
      data.vesselName = vesselMatch[1].trim();
    } else {
      data.vesselName = 'UNKNOWN';
    }

    // Port name
    const portMatch = content.match(/port[:\s]+([^\n]{3,50})/i);
    if (portMatch) {
      data.portName = portMatch[1].trim();
    }

    // Extract events (lines with dates/times)
    const eventPattern = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})\s+(\d{1,2}:\d{2})\s+([^\n]{10,200})/gi;
    const events = [...content.matchAll(eventPattern)];

    for (const event of events.slice(0, 20)) {
      // Limit to 20 events
      data.events!.push({
        timestamp: new Date(`${event[1]} ${event[2]}`),
        event: event[3].trim().substring(0, 100),
      });
    }

    return data as SOFData;
  }

  /**
   * Extract clauses from charter party
   */
  private extractClauses(content: string): Clause[] {
    const clauses: Clause[] = [];

    // Common clause patterns
    const clausePatterns = [
      { title: 'Ice Clause', pattern: /ice\s+clause[:\s]+([^]+?)(?=\n\n|\n[A-Z]|\d+\.)/i },
      { title: 'War Risks', pattern: /war\s+risks?[:\s]+([^]+?)(?=\n\n|\n[A-Z]|\d+\.)/i },
      { title: 'Arbitration', pattern: /arbitration[:\s]+([^]+?)(?=\n\n|\n[A-Z]|\d+\.)/i },
      { title: 'WWDSHEX', pattern: /wwdshex|weather\s+working\s+days[:\s]+([^]+?)(?=\n\n|\n[A-Z]|\d+\.)/i },
      { title: 'Lien', pattern: /lien\s+clause[:\s]+([^]+?)(?=\n\n|\n[A-Z]|\d+\.)/i },
    ];

    for (const { title, pattern } of clausePatterns) {
      const match = content.match(pattern);
      if (match) {
        clauses.push({
          title,
          text: (match[1] || match[0]).trim().substring(0, 500),
          category: this.categorizeClause(title),
          confidence: 0.8,
        });
      }
    }

    // Extract numbered clauses
    const numberedClausePattern = /(\d+)\.\s+([A-Z][^.\n]{5,50})[:\s]+([^]+?)(?=\n\d+\.|\n\n|$)/gi;
    const numbered = [...content.matchAll(numberedClausePattern)];

    for (const clause of numbered.slice(0, 10)) {
      // Limit to 10
      clauses.push({
        title: `Clause ${clause[1]}: ${clause[2].trim()}`,
        text: clause[3].trim().substring(0, 500),
        confidence: 0.7,
      });
    }

    return clauses;
  }

  /**
   * Extract commercial terms from content
   */
  private extractCommercialTerms(content: string): CommercialTerm[] {
    const terms: CommercialTerm[] = [];

    // Freight rate
    const freightMatch = content.match(/freight[:\s]+(?:usd|eur)?\s*([\d.]+)\s*(?:\/\s*)?(mt|ton)?/i);
    if (freightMatch) {
      terms.push({
        term: 'Freight Rate',
        value: parseFloat(freightMatch[1]),
        unit: freightMatch[2] ? `USD/${freightMatch[2].toUpperCase()}` : 'USD/MT',
      });
    }

    // Hire rate
    const hireMatch = content.match(/hire[:\s]+(?:usd|eur)?\s*([\d,]+)\s*(?:\/\s*)?(day|month)?/i);
    if (hireMatch) {
      terms.push({
        term: 'Hire Rate',
        value: parseFloat(hireMatch[1].replace(/,/g, '')),
        unit: hireMatch[2] ? `USD/${hireMatch[2]}` : 'USD/day',
      });
    }

    // Quantity
    const quantityMatch = content.match(/(\d{1,3}(?:,\d{3})*)\s*(mt|tons?)/i);
    if (quantityMatch) {
      terms.push({
        term: 'Cargo Quantity',
        value: parseFloat(quantityMatch[1].replace(/,/g, '')),
        unit: quantityMatch[2].toUpperCase(),
      });
    }

    // Laycan
    const laycanMatch = content.match(/laycan[:\s]+(\d{1,2}[-\/]\d{1,2})\s*[-–]\s*(\d{1,2}[-\/]\d{1,2})/i);
    if (laycanMatch) {
      terms.push({
        term: 'Laycan',
        value: `${laycanMatch[1]} - ${laycanMatch[2]}`,
      });
    }

    return terms;
  }

  /**
   * Categorize clause by title
   */
  private categorizeClause(title: string): string {
    const categories: Record<string, string[]> = {
      Navigation: ['ice', 'deviation', 'canal'],
      Safety: ['war', 'piracy', 'security'],
      Payment: ['lien', 'payment', 'commission'],
      Laytime: ['wwdshex', 'laytime', 'demurrage'],
      Legal: ['arbitration', 'law', 'jurisdiction'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((kw) => title.toLowerCase().includes(kw))) {
        return category;
      }
    }

    return 'General';
  }

  /**
   * Generate document summary
   */
  private generateSummary(type: DocumentType, structuredData: any, content: string): string {
    switch (type) {
      case DocumentType.CHARTER_PARTY:
        const cp = structuredData as CharterPartyData;
        return `${cp.partyType || 'Charter Party'} between ${cp.owner?.name || 'Owner'} and ${cp.charterer?.name || 'Charterer'}. Vessel: ${cp.vessel?.name || 'N/A'}. ${cp.voyage ? `Route: ${cp.voyage.loadPort} → ${cp.voyage.dischargePort}` : ''}`;

      case DocumentType.BILL_OF_LADING:
        const bol = structuredData as BOLData;
        return `BOL ${bol.bolNumber} from ${bol.shipper?.name || 'Shipper'} to ${bol.consignee?.name || 'Consignee'}. Vessel: ${bol.vessel?.name || 'N/A'}. Route: ${bol.portOfLoading} → ${bol.portOfDischarge}`;

      case DocumentType.INVOICE:
        const inv = structuredData as InvoiceData;
        return `Invoice ${inv.invoiceNumber} dated ${inv.invoiceDate?.toISOString().split('T')[0] || 'N/A'}. Total: ${inv.totals?.currency || 'USD'} ${inv.totals?.total?.toLocaleString() || '0'}`;

      case DocumentType.STATEMENT_OF_FACTS:
        const sof = structuredData as SOFData;
        return `SOF for ${sof.vesselName} at ${sof.portName || 'Port'}. ${sof.events?.length || 0} events recorded.`;

      default:
        return content.substring(0, 200).trim() + '...';
    }
  }

  /**
   * Batch parse multiple documents
   */
  async parseBatch(
    documents: Array<{ content: string; fileName?: string; mimeType?: string }>
  ): Promise<Map<string, ParsedDocument>> {
    const results = new Map<string, ParsedDocument>();

    for (const doc of documents) {
      const fileName = doc.fileName || `doc_${Date.now()}`;
      const parsed = await this.parseDocument(doc.content, doc.fileName, doc.mimeType);
      results.set(fileName, parsed);
    }

    return results;
  }
}

export const documentParser = new DocumentParser();
