/**
 * Charter Party Clause Recommendation Service
 * AI-powered C/P clause recommendations using RAG
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import maritimeRAG from '../rag/maritime-rag.js';

const prisma = new PrismaClient();

export interface ClauseRecommendationRequest {
  cargoType: string;
  cargoQuantity?: number;
  loadPort: string;
  dischargePort: string;
  vesselType?: string;
  vesselDwt?: number;
  laycanStart?: Date;
  laycanEnd?: Date;
  additionalRequirements?: string;
}

export interface RecommendedClause {
  clauseType: string;
  title: string;
  text: string;
  reasoning: string;
  confidence: number;
  precedents: {
    documentId: string;
    title: string;
    excerpt: string;
  }[];
  tags: string[];
}

export interface ClauseRecommendationResult {
  recommendations: RecommendedClause[];
  totalRecommendations: number;
  queryContext: string;
  timestamp: Date;
}

export class CPClauseRecommenderService {
  /**
   * Recommend charter party clauses based on voyage requirements
   */
  async recommendClauses(
    request: ClauseRecommendationRequest,
    organizationId: string
  ): Promise<ClauseRecommendationResult> {
    // Build query context
    const queryContext = this.buildQueryContext(request);

    // Search for relevant charter party clauses using RAG
    const ragResults = await maritimeRAG.search(
      queryContext,
      {
        limit: 20,
        docTypes: ['charter_party', 'fixture_note'],
        rerank: true,
      },
      organizationId
    );

    // Analyze results and extract clause recommendations
    const recommendations = await this.extractClauseRecommendations(
      ragResults,
      request,
      organizationId
    );

    return {
      recommendations,
      totalRecommendations: recommendations.length,
      queryContext,
      timestamp: new Date(),
    };
  }

  /**
   * Get clause recommendation by specific clause type
   */
  async getClauseByType(
    clauseType: string,
    request: ClauseRecommendationRequest,
    organizationId: string
  ): Promise<RecommendedClause | null> {
    const query = `${clauseType} clause for ${request.cargoType} cargo from ${request.loadPort} to ${request.dischargePort}`;

    const ragResults = await maritimeRAG.search(
      query,
      {
        limit: 5,
        docTypes: ['charter_party'],
        rerank: true,
      },
      organizationId
    );

    if (ragResults.length === 0) {
      return null;
    }

    return this.buildClauseRecommendation(clauseType, ragResults, request);
  }

  /**
   * Save recommended clauses to template library
   */
  async saveToTemplateLibrary(
    clauseId: string,
    templateName: string,
    organizationId: string,
    userId: string
  ): Promise<{ success: boolean; templateId: string }> {
    // In production, save to database
    const template = await prisma.clauseTemplate.create({
      data: {
        name: templateName,
        clauseId,
        organizationId,
        createdById: userId,
      },
    });

    return {
      success: true,
      templateId: template.id,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private buildQueryContext(request: ClauseRecommendationRequest): string {
    let context = `Charter party clauses for ${request.cargoType} cargo`;

    if (request.cargoQuantity) {
      context += ` (${request.cargoQuantity.toLocaleString()} MT)`;
    }

    context += ` from ${request.loadPort} to ${request.dischargePort}`;

    if (request.vesselType) {
      context += `, vessel type: ${request.vesselType}`;
    }

    if (request.vesselDwt) {
      context += ` (${request.vesselDwt.toLocaleString()} DWT)`;
    }

    if (request.laycanStart && request.laycanEnd) {
      context += `, laycan: ${request.laycanStart.toLocaleDateString()} - ${request.laycanEnd.toLocaleDateString()}`;
    }

    if (request.additionalRequirements) {
      context += `. Additional: ${request.additionalRequirements}`;
    }

    return context;
  }

  private async extractClauseRecommendations(
    ragResults: any[],
    request: ClauseRecommendationRequest,
    organizationId: string
  ): Promise<RecommendedClause[]> {
    const clauseTypes = [
      'freight',
      'laytime',
      'demurrage',
      'loading_discharging',
      'ice_clause',
      'war_risk',
      'piracy',
      'lien',
      'general_average',
      'both_to_blame',
      'paramount_clause',
    ];

    const recommendations: RecommendedClause[] = [];

    // Determine which clauses are relevant
    const relevantClauses = this.determineRelevantClauses(request, clauseTypes);

    for (const clauseType of relevantClauses) {
      const clause = await this.buildClauseRecommendation(
        clauseType,
        ragResults,
        request
      );

      if (clause) {
        recommendations.push(clause);
      }
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  private determineRelevantClauses(
    request: ClauseRecommendationRequest,
    allClauseTypes: string[]
  ): string[] {
    const relevant = new Set<string>();

    // Always include these
    relevant.add('freight');
    relevant.add('laytime');
    relevant.add('demurrage');
    relevant.add('loading_discharging');
    relevant.add('lien');

    // Cargo-specific
    if (request.cargoType.toLowerCase().includes('grain')) {
      relevant.add('general_average');
      relevant.add('both_to_blame');
    }

    if (request.cargoType.toLowerCase().includes('dangerous')) {
      relevant.add('paramount_clause');
    }

    // Route-specific
    const winterPorts = ['murmansk', 'arkhangelsk', 'st petersburg', 'vladivostok'];
    if (
      winterPorts.some(
        (port) =>
          request.loadPort.toLowerCase().includes(port) ||
          request.dischargePort.toLowerCase().includes(port)
      )
    ) {
      relevant.add('ice_clause');
    }

    const highRiskAreas = [
      'gulf of aden',
      'somalia',
      'persian gulf',
      'west africa',
      'malacca',
    ];
    if (
      highRiskAreas.some(
        (area) =>
          request.loadPort.toLowerCase().includes(area) ||
          request.dischargePort.toLowerCase().includes(area)
      )
    ) {
      relevant.add('piracy');
      relevant.add('war_risk');
    }

    return Array.from(relevant);
  }

  private buildClauseRecommendation(
    clauseType: string,
    ragResults: any[],
    request: ClauseRecommendationRequest
  ): RecommendedClause | null {
    // Find relevant results for this clause type
    const relevantResults = ragResults.filter((result) =>
      result.content.toLowerCase().includes(clauseType.replace('_', ' '))
    );

    if (relevantResults.length === 0) {
      return null;
    }

    // Extract clause text from best result
    const bestResult = relevantResults[0];
    const clauseText = this.extractClauseText(bestResult.content, clauseType);

    // Build reasoning
    const reasoning = this.buildReasoning(clauseType, request, relevantResults);

    // Calculate confidence
    const confidence = this.calculateConfidence(relevantResults);

    return {
      clauseType,
      title: this.formatClauseTitle(clauseType),
      text: clauseText,
      reasoning,
      confidence,
      precedents: relevantResults.slice(0, 3).map((r) => ({
        documentId: r.documentId,
        title: r.title,
        excerpt: r.excerpt,
      })),
      tags: this.extractTags(clauseType, request),
    };
  }

  private extractClauseText(content: string, clauseType: string): string {
    // Simple extraction - in production, use more sophisticated NLP
    const clausePattern = new RegExp(
      `(${clauseType.replace('_', '\\s+')}.*?)(?=\\n\\n|$)`,
      'is'
    );
    const match = content.match(clausePattern);

    if (match) {
      return match[1].trim();
    }

    // Fallback to excerpt
    return `Standard ${this.formatClauseTitle(clauseType)} clause as per industry practice.`;
  }

  private buildReasoning(
    clauseType: string,
    request: ClauseRecommendationRequest,
    results: any[]
  ): string {
    const reasons: string[] = [];

    reasons.push(
      `Recommended based on ${results.length} similar charter parties for ${request.cargoType} cargo.`
    );

    if (clauseType === 'ice_clause') {
      reasons.push('Winter route requires ice clause protection.');
    }

    if (clauseType === 'piracy') {
      reasons.push('High-risk area transit requires piracy protection.');
    }

    if (clauseType === 'freight') {
      reasons.push('Standard freight payment terms for this trade.');
    }

    if (clauseType === 'laytime') {
      reasons.push(
        `Typical laytime terms for ${request.cargoType} at these ports.`
      );
    }

    return reasons.join(' ');
  }

  private calculateConfidence(results: any[]): number {
    if (results.length === 0) return 0;

    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const countBonus = Math.min(results.length / 10, 0.2);

    return Math.min((avgScore + countBonus) * 100, 95);
  }

  private formatClauseTitle(clauseType: string): string {
    return clauseType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private extractTags(
    clauseType: string,
    request: ClauseRecommendationRequest
  ): string[] {
    const tags = [clauseType, request.cargoType.toLowerCase()];

    if (request.vesselType) {
      tags.push(request.vesselType.toLowerCase());
    }

    return tags;
  }
}

export const cpClauseRecommenderService = new CPClauseRecommenderService();
