/**
 * Maritime Regulation Lookup Service
 * Q&A interface for maritime regulations (SOLAS, MARPOL, MLC, ISM)
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import maritimeRAG from '../rag/maritime-rag.js';

export interface RegulationQuery {
  question: string;
  category?:
    | 'SOLAS'
    | 'MARPOL'
    | 'MLC'
    | 'ISM'
    | 'ISPS'
    | 'STCW'
    | 'COLREG'
    | 'general';
  vesselType?: string;
  flagState?: string;
}

export interface RegulationAnswer {
  question: string;
  answer: string;
  category: string;
  sources: {
    regulation: string;
    article: string;
    text: string;
    url?: string;
  }[];
  relatedQuestions: string[];
  confidence: number;
  timestamp: Date;
}

export class RegulationLookupService {
  /**
   * Answer maritime regulation questions using RAG
   */
  async answerQuestion(
    query: RegulationQuery,
    organizationId: string
  ): Promise<RegulationAnswer> {
    // Build search query
    const searchQuery = this.buildSearchQuery(query);

    // Use RAG to find answer
    const ragAnswer = await maritimeRAG.ask(
      searchQuery,
      {
        limit: 5,
        docTypes: ['regulation', 'compliance'],
      },
      organizationId
    );

    // Extract regulation sources
    const sources = this.extractRegulationSources(ragAnswer.sources);

    // Generate related questions
    const relatedQuestions = this.generateRelatedQuestions(query);

    return {
      question: query.question,
      answer: ragAnswer.answer,
      category: query.category || 'general',
      sources,
      relatedQuestions,
      confidence: ragAnswer.confidence,
      timestamp: new Date(),
    };
  }

  /**
   * Get regulation by specific article/section
   */
  async getRegulationArticle(
    regulation: string,
    article: string,
    organizationId: string
  ): Promise<{
    regulation: string;
    article: string;
    title: string;
    text: string;
    effective: Date;
  } | null> {
    const query = `${regulation} ${article}`;

    const results = await maritimeRAG.search(
      query,
      {
        limit: 5,
        docTypes: ['regulation'],
        rerank: true,
      },
      organizationId
    );

    if (results.length === 0) {
      return null;
    }

    const bestResult = results[0];

    return {
      regulation,
      article,
      title: bestResult.title,
      text: bestResult.content || bestResult.excerpt,
      effective: bestResult.createdAt,
    };
  }

  /**
   * Search regulations by keyword
   */
  async searchRegulations(
    keyword: string,
    category: string | undefined,
    organizationId: string
  ): Promise<
    {
      id: string;
      regulation: string;
      title: string;
      excerpt: string;
      relevance: number;
    }[]
  > {
    const query = category ? `${category} ${keyword}` : keyword;

    const results = await maritimeRAG.search(
      query,
      {
        limit: 20,
        docTypes: ['regulation', 'compliance'],
        rerank: true,
      },
      organizationId
    );

    return results.map((r) => ({
      id: r.id,
      regulation: this.identifyRegulation(r.title),
      title: r.title,
      excerpt: r.excerpt,
      relevance: r.score,
    }));
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private buildSearchQuery(query: RegulationQuery): string {
    let searchQuery = query.question;

    if (query.category && query.category !== 'general') {
      searchQuery = `${query.category} - ${searchQuery}`;
    }

    if (query.vesselType) {
      searchQuery += ` (vessel type: ${query.vesselType})`;
    }

    if (query.flagState) {
      searchQuery += ` (flag: ${query.flagState})`;
    }

    return searchQuery;
  }

  private extractRegulationSources(ragSources: any[]): any[] {
    return ragSources.map((source) => {
      const regulation = this.identifyRegulation(source.title);
      const article = this.extractArticleNumber(source.excerpt);

      return {
        regulation,
        article,
        text: source.excerpt,
        url: this.getRegulationUrl(regulation, article),
      };
    });
  }

  private identifyRegulation(title: string): string {
    const regulations = [
      'SOLAS',
      'MARPOL',
      'MLC',
      'ISM',
      'ISPS',
      'STCW',
      'COLREG',
      'ILO',
      'IMO',
    ];

    for (const reg of regulations) {
      if (title.toUpperCase().includes(reg)) {
        return reg;
      }
    }

    return 'IMO Convention';
  }

  private extractArticleNumber(text: string): string {
    // Try to extract article/chapter/regulation numbers
    const patterns = [
      /Article\s+(\d+)/i,
      /Chapter\s+([IVX]+)/i,
      /Regulation\s+(\d+)/i,
      /Section\s+(\d+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return 'General';
  }

  private getRegulationUrl(regulation: string, article: string): string | undefined {
    const baseUrls: Record<string, string> = {
      SOLAS: 'https://www.imo.org/en/About/Conventions/Pages/International-Convention-for-the-Safety-of-Life-at-Sea-(SOLAS),-1974.aspx',
      MARPOL: 'https://www.imo.org/en/About/Conventions/Pages/International-Convention-for-the-Prevention-of-Pollution-from-Ships-(MARPOL).aspx',
      MLC: 'https://www.ilo.org/global/standards/subjects-covered-by-international-labour-standards/seafarers/lang--en/index.htm',
      ISM: 'https://www.imo.org/en/OurWork/HumanElement/Pages/ISMCode.aspx',
      ISPS: 'https://www.imo.org/en/OurWork/Security/Pages/ISPS-Code.aspx',
      STCW: 'https://www.imo.org/en/About/Conventions/Pages/International-Convention-on-Standards-of-Training,-Certification-and-Watchkeeping-for-Seafarers-(STCW).aspx',
      COLREG: 'https://www.imo.org/en/About/Conventions/Pages/COLREG.aspx',
    };

    return baseUrls[regulation];
  }

  private generateRelatedQuestions(query: RegulationQuery): string[] {
    const related: string[] = [];

    if (query.category === 'SOLAS') {
      related.push(
        'What are the life-saving equipment requirements under SOLAS?',
        'What are SOLAS fire safety regulations?',
        'What is SOLAS Chapter V about?'
      );
    } else if (query.category === 'MARPOL') {
      related.push(
        'What are MARPOL Annex VI SOx limits?',
        'What is required for MARPOL compliance?',
        'What are the oil discharge regulations?'
      );
    } else if (query.category === 'MLC') {
      related.push(
        'What are seafarer working hour limits?',
        'What are MLC accommodation requirements?',
        'What is required for MLC certification?'
      );
    } else if (query.category === 'ISM') {
      related.push(
        'What is the ISM Code safety management system?',
        'Who is responsible for ISM compliance?',
        'What are ISM documentation requirements?'
      );
    } else {
      related.push(
        'What are the main IMO conventions?',
        'What are flag state requirements?',
        'What are port state control inspection criteria?'
      );
    }

    return related.slice(0, 5);
  }
}

export const regulationLookupService = new RegulationLookupService();
