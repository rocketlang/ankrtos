// nl-query-engine.ts — Natural Language Query Engine for Maritime Operations

import { PrismaClient } from '@prisma/client';
import { fixtureMatcher } from './fixture-matcher.js';
import { pricePredictor } from './price-predictor.js';

const prisma = new PrismaClient();

export enum QueryIntent {
  FIND_VESSEL = 'find_vessel',               // "Find vessel for Houston grain"
  PREDICT_RATE = 'predict_rate',             // "What's the rate for USG-WMED grain?"
  VESSEL_INFO = 'vessel_info',               // "Tell me about MV Ocean Trader"
  PORT_INFO = 'port_info',                   // "What's the status of Houston port?"
  MARKET_TREND = 'market_trend',             // "How's the grain market trending?"
  VOYAGE_STATUS = 'voyage_status',           // "Where is voyage VOY123?"
  COMPARE_RATES = 'compare_rates',           // "Compare rates for grain vs coal"
  LAYTIME_CALC = 'laytime_calc',             // "Calculate laytime for 70k MT at 10k/day"
  UNKNOWN = 'unknown',
}

interface NLQueryResult {
  intent: QueryIntent;
  confidence: number;
  entities: {
    vessels?: string[];
    ports?: string[];
    cargos?: string[];
    routes?: string[];
    dates?: string[];
    quantities?: number[];
  };
  parsedQuery: {
    action?: string;
    subject?: string;
    filters?: Record<string, any>;
  };
  response: string;
  data?: any;
  suggestions?: string[];
}

interface VesselSearchCriteria {
  cargoType?: string;
  loadPort?: string;
  dischargePort?: string;
  quantity?: number;
  laycan?: Date;
}

export class NLQueryEngine {
  /**
   * Process natural language query
   */
  async processQuery(query: string, organizationId: string, userId?: string): Promise<NLQueryResult> {
    // 1. Normalize query
    const normalizedQuery = query.toLowerCase().trim();

    // 2. Detect intent
    const intent = this.detectIntent(normalizedQuery);

    // 3. Extract entities
    const entities = this.extractEntities(normalizedQuery);

    // 4. Parse query structure
    const parsedQuery = this.parseQuery(normalizedQuery, intent, entities);

    // 5. Execute query based on intent
    const { response, data } = await this.executeQuery(
      intent,
      parsedQuery,
      entities,
      organizationId,
      userId
    );

    // 6. Generate follow-up suggestions
    const suggestions = this.generateSuggestions(intent, entities);

    return {
      intent,
      confidence: this.calculateIntentConfidence(normalizedQuery, intent),
      entities,
      parsedQuery,
      response,
      data,
      suggestions,
    };
  }

  /**
   * Detect query intent using keyword matching
   */
  private detectIntent(query: string): QueryIntent {
    // Find vessel patterns
    if (
      /\b(find|search|looking for|need|available|open)\s+(vessel|ship|tonnage)/i.test(query) ||
      /\b(best|suitable|matching)\s+(vessel|ship)/i.test(query) ||
      /\bvessels?\s+(for|available)/i.test(query)
    ) {
      return QueryIntent.FIND_VESSEL;
    }

    // Rate prediction patterns
    if (
      /\b(what('s| is)?|predict|forecast|expect(ed)?)\s+(the\s+)?(freight\s+)?(rate|price)/i.test(query) ||
      /\b(rate|price)\s+(for|of)/i.test(query) ||
      /\bhow much\b/i.test(query)
    ) {
      return QueryIntent.PREDICT_RATE;
    }

    // Vessel info patterns
    if (
      /\b(tell me about|info|information|details|status of)\s+(m\/?(v|t)|vessel|ship)/i.test(query) ||
      /\bwhere is\s+(m\/?(v|t)|vessel|ship)/i.test(query)
    ) {
      return QueryIntent.VESSEL_INFO;
    }

    // Port info patterns
    if (
      /\b(port|terminal)\s+(status|info|condition|congestion)/i.test(query) ||
      /\bwhat('s| is)\s+(the\s+)?(status|condition)\s+(of|at|in)\s+\w+\s+port/i.test(query)
    ) {
      return QueryIntent.PORT_INFO;
    }

    // Market trend patterns
    if (
      /\b(trend|trending|market|outlook|forecast|sentiment)/i.test(query) ||
      /\bhow('s| is)\s+the\s+market/i.test(query) ||
      /\b(bullish|bearish|strong|weak)\s+market/i.test(query)
    ) {
      return QueryIntent.MARKET_TREND;
    }

    // Voyage status patterns
    if (
      /\b(where is|status of|eta|position)\s+(voyage|voy)/i.test(query) ||
      /\bvoyage\s+\w+/i.test(query)
    ) {
      return QueryIntent.VOYAGE_STATUS;
    }

    // Compare rates patterns
    if (/\bcompare\s+(rates?|price)/i.test(query) || /\brates?\s+for\s+\w+\s+(vs|versus|and)/i.test(query)) {
      return QueryIntent.COMPARE_RATES;
    }

    // Laytime calculation patterns
    if (
      /\bcalculate\s+laytime/i.test(query) ||
      /\blaytime\s+(for|calculation)/i.test(query) ||
      /\bdemurrage|despatch/i.test(query)
    ) {
      return QueryIntent.LAYTIME_CALC;
    }

    return QueryIntent.UNKNOWN;
  }

  /**
   * Extract entities from query
   */
  private extractEntities(query: string): NLQueryResult['entities'] {
    const entities: NLQueryResult['entities'] = {};

    // Extract vessel names (MV/MT/SS prefix)
    const vesselPattern = /\b(m\/?(v|t)|ss)\s+([\w\s-]+?)(?=\s|,|$|\?)/gi;
    const vesselMatches = [...query.matchAll(vesselPattern)];
    if (vesselMatches.length > 0) {
      entities.vessels = vesselMatches.map((m) => m[0].trim());
    }

    // Extract ports (common port names or UN/LOCODE)
    const portKeywords = [
      'singapore',
      'rotterdam',
      'houston',
      'new york',
      'hamburg',
      'antwerp',
      'shanghai',
      'tokyo',
      'dubai',
      'santos',
      'mumbai',
      'chennai',
    ];
    const foundPorts = portKeywords.filter((port) => query.includes(port));
    if (foundPorts.length > 0) {
      entities.ports = foundPorts.map((p) => p.charAt(0).toUpperCase() + p.slice(1));
    }

    // Extract UN/LOCODE
    const locodePattern = /\b([A-Z]{5})\b/g;
    const locodeMatches = query.toUpperCase().match(locodePattern);
    if (locodeMatches) {
      entities.ports = [...(entities.ports || []), ...locodeMatches];
    }

    // Extract cargo types
    const cargoKeywords = [
      'grain',
      'coal',
      'iron ore',
      'fertilizer',
      'wheat',
      'corn',
      'soya',
      'crude',
      'oil',
      'lpg',
      'lng',
      'container',
      'steel',
    ];
    const foundCargos = cargoKeywords.filter((cargo) => query.includes(cargo));
    if (foundCargos.length > 0) {
      entities.cargos = foundCargos;
    }

    // Extract routes (e.g., "USG-WMED", "Houston-Rotterdam")
    const routePattern = /\b([A-Z]{3,5})\s*-\s*([A-Z]{3,5})\b/g;
    const routeMatches = [...query.toUpperCase().matchAll(routePattern)];
    if (routeMatches.length > 0) {
      entities.routes = routeMatches.map((m) => `${m[1]}-${m[2]}`);
    }

    // Port-to-port routes
    if (entities.ports && entities.ports.length >= 2) {
      if (!entities.routes) entities.routes = [];
      entities.routes.push(`${entities.ports[0]}-${entities.ports[1]}`);
    }

    // Extract quantities (e.g., "70k MT", "50,000 tons")
    const quantityPattern = /(\d{1,3}(?:,\d{3})*|\d+k?)\s*(mt|tons?|cbm)/i;
    const quantityMatch = query.match(quantityPattern);
    if (quantityMatch) {
      let qty = quantityMatch[1].replace(/,/g, '');
      if (qty.endsWith('k')) {
        qty = qty.slice(0, -1) + '000';
      }
      entities.quantities = [parseInt(qty)];
    }

    // Extract dates (simple patterns)
    const datePattern = /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2})/gi;
    const dateMatches = query.match(datePattern);
    if (dateMatches) {
      entities.dates = dateMatches;
    }

    return entities;
  }

  /**
   * Parse query into structured format
   */
  private parseQuery(
    query: string,
    intent: QueryIntent,
    entities: NLQueryResult['entities']
  ): NLQueryResult['parsedQuery'] {
    const parsed: NLQueryResult['parsedQuery'] = {};

    switch (intent) {
      case QueryIntent.FIND_VESSEL:
        parsed.action = 'find';
        parsed.subject = 'vessel';
        parsed.filters = {
          cargoType: entities.cargos?.[0],
          loadPort: entities.ports?.[0],
          dischargePort: entities.ports?.[1],
          quantity: entities.quantities?.[0],
        };
        break;

      case QueryIntent.PREDICT_RATE:
        parsed.action = 'predict';
        parsed.subject = 'rate';
        parsed.filters = {
          route: entities.routes?.[0],
          cargoType: entities.cargos?.[0],
          loadPort: entities.ports?.[0],
          dischargePort: entities.ports?.[1],
        };
        break;

      case QueryIntent.VESSEL_INFO:
        parsed.action = 'get';
        parsed.subject = 'vessel';
        parsed.filters = {
          vesselName: entities.vessels?.[0],
        };
        break;

      case QueryIntent.PORT_INFO:
        parsed.action = 'get';
        parsed.subject = 'port';
        parsed.filters = {
          portName: entities.ports?.[0],
        };
        break;

      case QueryIntent.MARKET_TREND:
        parsed.action = 'analyze';
        parsed.subject = 'trend';
        parsed.filters = {
          cargoType: entities.cargos?.[0],
          route: entities.routes?.[0],
        };
        break;

      case QueryIntent.COMPARE_RATES:
        parsed.action = 'compare';
        parsed.subject = 'rates';
        parsed.filters = {
          cargos: entities.cargos,
          routes: entities.routes,
        };
        break;
    }

    return parsed;
  }

  /**
   * Execute query based on intent
   */
  private async executeQuery(
    intent: QueryIntent,
    parsedQuery: NLQueryResult['parsedQuery'],
    entities: NLQueryResult['entities'],
    organizationId: string,
    userId?: string
  ): Promise<{ response: string; data?: any }> {
    switch (intent) {
      case QueryIntent.FIND_VESSEL:
        return await this.handleFindVessel(parsedQuery.filters!, organizationId);

      case QueryIntent.PREDICT_RATE:
        return await this.handlePredictRate(parsedQuery.filters!, organizationId);

      case QueryIntent.VESSEL_INFO:
        return await this.handleVesselInfo(parsedQuery.filters!, organizationId);

      case QueryIntent.PORT_INFO:
        return await this.handlePortInfo(parsedQuery.filters!, organizationId);

      case QueryIntent.MARKET_TREND:
        return await this.handleMarketTrend(parsedQuery.filters!, organizationId);

      case QueryIntent.VOYAGE_STATUS:
        return await this.handleVoyageStatus(parsedQuery.filters!, organizationId);

      case QueryIntent.COMPARE_RATES:
        return await this.handleCompareRates(parsedQuery.filters!, organizationId);

      default:
        return {
          response:
            "I'm not sure I understand. Try asking about vessels, rates, market trends, or port status.",
          data: null,
        };
    }
  }

  /**
   * Handle FIND_VESSEL intent
   */
  private async handleFindVessel(
    filters: Record<string, any>,
    organizationId: string
  ): Promise<{ response: string; data?: any }> {
    const enquiry = {
      id: 'nl_query',
      cargoType: filters.cargoType || 'general cargo',
      quantity: filters.quantity || 50000,
      quantityUnit: 'MT',
      loadPort: filters.loadPort || 'Unknown',
      dischargePort: filters.dischargePort || 'Unknown',
      laycanFrom: filters.laycanFrom || new Date(),
      laycanTo: filters.laycanTo || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      organizationId,
    };

    const matches = await fixtureMatcher.findMatches(enquiry, undefined, 5);

    if (matches.length === 0) {
      return {
        response: `No suitable vessels found for ${filters.cargoType || 'cargo'} from ${filters.loadPort || 'unknown port'} to ${filters.dischargePort || 'unknown port'}.`,
        data: { matches: [] },
      };
    }

    const topMatch = matches[0];
    let response = `Found ${matches.length} suitable vessel${matches.length > 1 ? 's' : ''}.\n\n`;
    response += `**Top Match:** ${topMatch.vesselName}\n`;
    response += `- Match Score: ${topMatch.matchScore}/100 (${topMatch.recommendation})\n`;
    response += `- Estimated TCE: $${topMatch.economics.estimatedTCE.toLocaleString()}/day\n`;
    response += `- Ballast: ${topMatch.distance.ballastNM} NM (${topMatch.distance.ballastDays} days)\n`;
    response += `- Reasons: ${topMatch.reasons.join(', ')}\n`;

    if (topMatch.concerns.length > 0) {
      response += `- Concerns: ${topMatch.concerns.join(', ')}\n`;
    }

    if (matches.length > 1) {
      response += `\nOther options: ${matches
        .slice(1, 3)
        .map((m) => `${m.vesselName} (${m.matchScore}/100)`)
        .join(', ')}`;
    }

    return { response, data: { matches } };
  }

  /**
   * Handle PREDICT_RATE intent
   */
  private async handlePredictRate(
    filters: Record<string, any>,
    organizationId: string
  ): Promise<{ response: string; data?: any }> {
    const prediction = await pricePredictor.predictRate({
      route: filters.route,
      cargoType: filters.cargoType,
      loadPort: filters.loadPort,
      dischargePort: filters.dischargePort,
      organizationId,
    });

    let response = `**Freight Rate Prediction:**\n\n`;
    response += `Predicted Rate: **$${prediction.predictedRate}/MT**\n`;
    response += `Range: $${prediction.range.low} - $${prediction.range.high}/MT\n`;
    response += `Confidence: ${(prediction.confidence * 100).toFixed(0)}%\n`;
    response += `Trend: ${prediction.trend === 'bullish' ? '📈 Bullish' : prediction.trend === 'bearish' ? '📉 Bearish' : '➡️ Stable'}\n\n`;

    response += `**Market Conditions:**\n`;
    response += `- Supply/Demand: ${prediction.marketConditions.supplyDemand}\n`;
    response += `- Sentiment: ${prediction.marketConditions.sentiment}\n`;
    response += `- Volatility: ${prediction.marketConditions.volatility}\n\n`;

    if (prediction.recommendations.length > 0) {
      response += `**Recommendations:**\n${prediction.recommendations.map((r) => `• ${r}`).join('\n')}`;
    }

    return { response, data: prediction };
  }

  /**
   * Handle VESSEL_INFO intent
   */
  private async handleVesselInfo(
    filters: Record<string, any>,
    organizationId: string
  ): Promise<{ response: string; data?: any }> {
    const vessel = await prisma.vessel.findFirst({
      where: {
        organizationId,
        name: { contains: filters.vesselName, mode: 'insensitive' },
      },
      include: {
        voyages: {
          where: { status: { in: ['in_progress', 'planned'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!vessel) {
      return {
        response: `Vessel "${filters.vesselName}" not found in your fleet.`,
        data: null,
      };
    }

    let response = `**${vessel.name}** (IMO: ${vessel.imo})\n\n`;
    response += `- Type: ${vessel.type}\n`;
    response += `- DWT: ${vessel.dwt.toLocaleString()} MT\n`;
    response += `- Flag: ${vessel.flag}\n`;
    response += `- Built: ${vessel.yearBuilt}\n`;
    response += `- Status: ${vessel.status}\n`;

    if (vessel.voyages.length > 0) {
      const voyage = vessel.voyages[0];
      response += `\n**Current/Next Voyage:**\n`;
      response += `- Route: ${voyage.loadPort} → ${voyage.dischargePort}\n`;
      response += `- Status: ${voyage.status}\n`;
      if (voyage.etaLoad) response += `- ETA Load: ${voyage.etaLoad.toISOString().split('T')[0]}\n`;
    }

    return { response, data: vessel };
  }

  /**
   * Handle PORT_INFO intent
   */
  private async handlePortInfo(
    filters: Record<string, any>,
    organizationId: string
  ): Promise<{ response: string; data?: any }> {
    const port = await prisma.port.findFirst({
      where: {
        organizationId,
        name: { contains: filters.portName, mode: 'insensitive' },
      },
    });

    if (!port) {
      return {
        response: `Port "${filters.portName}" not found in database.`,
        data: null,
      };
    }

    let response = `**${port.name}** (${port.locode})\n\n`;
    response += `- Country: ${port.country}\n`;
    response += `- Timezone: ${port.timezone || 'N/A'}\n`;

    // Get congestion data if available
    const congestion = await prisma.portCongestion?.findFirst({
      where: { portId: port.id },
      orderBy: { date: 'desc' },
    });

    if (congestion) {
      response += `\n**Current Congestion:**\n`;
      response += `- Vessels Waiting: ${congestion.vesselsWaiting || 0}\n`;
      response += `- Avg Wait Time: ${congestion.avgWaitTimeDays || 'N/A'} days\n`;
    }

    return { response, data: { port, congestion } };
  }

  /**
   * Handle MARKET_TREND intent
   */
  private async handleMarketTrend(
    filters: Record<string, any>,
    organizationId: string
  ): Promise<{ response: string; data?: any }> {
    const prediction = await pricePredictor.predictRate({
      cargoType: filters.cargoType,
      route: filters.route,
      organizationId,
    });

    let response = `**Market Trend Analysis**\n\n`;
    response += `Cargo: ${filters.cargoType || 'General'}\n`;
    response += `Route: ${filters.route || 'Global'}\n\n`;

    response += `Trend: ${prediction.trend === 'bullish' ? '📈 **BULLISH**' : prediction.trend === 'bearish' ? '📉 **BEARISH**' : '➡️ **STABLE**'}\n\n`;

    response += `**Historical Data:**\n`;
    response += `- Average Rate: $${prediction.historicalData.avgRate}/MT\n`;
    response += `- Range: $${prediction.historicalData.minRate} - $${prediction.historicalData.maxRate}/MT\n`;
    response += `- Sample Size: ${prediction.historicalData.samples} fixtures\n\n`;

    response += `**Market Conditions:**\n`;
    response += `- Supply/Demand: ${prediction.marketConditions.supplyDemand}\n`;
    response += `- Sentiment: ${prediction.marketConditions.sentiment}\n`;
    response += `- Volatility: ${prediction.marketConditions.volatility}\n`;

    return { response, data: prediction };
  }

  /**
   * Handle VOYAGE_STATUS intent
   */
  private async handleVoyageStatus(
    filters: Record<string, any>,
    organizationId: string
  ): Promise<{ response: string; data?: any }> {
    // Extract voyage number from query
    const voyageNumber = filters.voyageNumber;

    if (!voyageNumber) {
      return {
        response: 'Please specify a voyage number (e.g., "VOY123").',
        data: null,
      };
    }

    const voyage = await prisma.voyage.findFirst({
      where: {
        organizationId,
        voyageNumber: { contains: voyageNumber, mode: 'insensitive' },
      },
      include: { vessel: true },
    });

    if (!voyage) {
      return {
        response: `Voyage "${voyageNumber}" not found.`,
        data: null,
      };
    }

    let response = `**Voyage ${voyage.voyageNumber}**\n\n`;
    response += `- Vessel: ${voyage.vessel?.name || 'N/A'}\n`;
    response += `- Status: ${voyage.status}\n`;
    response += `- Route: ${voyage.loadPort} → ${voyage.dischargePort}\n`;
    if (voyage.etaLoad) response += `- ETA Load: ${voyage.etaLoad.toISOString().split('T')[0]}\n`;
    if (voyage.etaDischarge) response += `- ETA Discharge: ${voyage.etaDischarge.toISOString().split('T')[0]}\n`;

    return { response, data: voyage };
  }

  /**
   * Handle COMPARE_RATES intent
   */
  private async handleCompareRates(
    filters: Record<string, any>,
    organizationId: string
  ): Promise<{ response: string; data?: any }> {
    const cargos = filters.cargos || ['grain', 'coal'];
    const predictions: any[] = [];

    for (const cargo of cargos) {
      const prediction = await pricePredictor.predictRate({
        cargoType: cargo,
        route: filters.route,
        organizationId,
      });
      predictions.push({ cargo, prediction });
    }

    let response = `**Rate Comparison**\n\n`;

    for (const { cargo, prediction } of predictions) {
      response += `**${cargo.toUpperCase()}:**\n`;
      response += `- Rate: $${prediction.predictedRate}/MT\n`;
      response += `- Trend: ${prediction.trend}\n`;
      response += `- Samples: ${prediction.historicalData.samples}\n\n`;
    }

    return { response, data: predictions };
  }

  /**
   * Calculate intent confidence
   */
  private calculateIntentConfidence(query: string, intent: QueryIntent): number {
    // Simple confidence based on keyword matches
    if (intent === QueryIntent.UNKNOWN) return 0.3;

    // Count how many domain keywords are present
    const maritimeKeywords = [
      'vessel',
      'ship',
      'cargo',
      'port',
      'freight',
      'rate',
      'voyage',
      'charter',
      'laytime',
    ];
    const matchCount = maritimeKeywords.filter((kw) => query.includes(kw)).length;

    return Math.min(0.95, 0.6 + matchCount * 0.05);
  }

  /**
   * Generate follow-up suggestions
   */
  private generateSuggestions(intent: QueryIntent, entities: NLQueryResult['entities']): string[] {
    const suggestions: string[] = [];

    switch (intent) {
      case QueryIntent.FIND_VESSEL:
        suggestions.push('Show me the economics for this vessel');
        suggestions.push('What are alternative vessels?');
        if (entities.cargos?.[0]) {
          suggestions.push(`What's the rate trend for ${entities.cargos[0]}?`);
        }
        break;

      case QueryIntent.PREDICT_RATE:
        suggestions.push('Find vessels for this cargo');
        suggestions.push('Show market trend analysis');
        suggestions.push('Compare with other cargo types');
        break;

      case QueryIntent.VESSEL_INFO:
        if (entities.vessels?.[0]) {
          suggestions.push(`Find cargos for ${entities.vessels[0]}`);
          suggestions.push(`Show voyage history for ${entities.vessels[0]}`);
        }
        break;

      case QueryIntent.MARKET_TREND:
        suggestions.push('Predict rate for next month');
        suggestions.push('Compare with historical average');
        break;
    }

    return suggestions;
  }
}

export const nlQueryEngine = new NLQueryEngine();
