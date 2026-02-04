/**
 * DA AI Intelligence Service
 * - AI-powered anomaly detection
 * - Cost optimization recommendations
 * - Protecting agent designation
 */

import { prisma } from '../lib/prisma.js';

export interface CostAnomaly {
  daLineItemId: string;
  description: string;
  actualAmount: number;
  expectedAmount: number;
  variance: number;
  variancePercent: number;
  anomalyScore: number; // 0-100 (100 = definite anomaly)
  reason: string;
  recommendations: string[];
}

export interface CostOptimization {
  portId: string;
  portName: string;
  category: string;
  currentAverage: number;
  suggestedAlternatives: Array<{
    option: string;
    estimatedCost: number;
    savings: number;
    savingsPercent: number;
  }>;
  totalPotentialSavings: number;
}

export class DAIntelligenceService {
  /**
   * Detect anomalies in DA costs using AI/ML
   */
  async detectAnomalies(daId: string): Promise<CostAnomaly[]> {
    const da = await prisma.disbursementAccount.findUnique({
      where: { id: daId },
      include: {
        lineItems: true,
        port: true,
        voyage: { include: { vessel: true } },
      },
    });

    if (!da) throw new Error('DA not found');

    const anomalies: CostAnomaly[] = [];

    for (const lineItem of da.lineItems) {
      // Get historical averages for this charge type at this port
      const historical = await this.getHistoricalAverage(
        da.portId,
        lineItem.category,
        da.voyage.vessel.grt || 0
      );

      if (!historical) continue;

      const variance = lineItem.amount - historical.average;
      const variancePercent = (variance / historical.average) * 100;

      // Calculate anomaly score based on statistical deviation
      const zScore = Math.abs((lineItem.amount - historical.average) / historical.stdDev);
      const anomalyScore = Math.min(zScore * 20, 100); // Convert z-score to 0-100

      // Flag as anomaly if > 2 standard deviations (95% confidence)
      if (zScore > 2 || Math.abs(variancePercent) > 25) {
        const recommendations = this.generateRecommendations(
          lineItem,
          historical,
          variancePercent
        );

        anomalies.push({
          daLineItemId: lineItem.id,
          description: lineItem.description,
          actualAmount: lineItem.amount,
          expectedAmount: historical.average,
          variance,
          variancePercent,
          anomalyScore,
          reason: this.generateAnomalyReason(variancePercent, zScore),
          recommendations,
        });
      }
    }

    // Create alerts for significant anomalies
    for (const anomaly of anomalies.filter((a) => a.anomalyScore > 70)) {
      await prisma.alert.create({
        data: {
          organizationId: da.organizationId,
          type: 'da_cost_anomaly',
          severity: anomaly.anomalyScore > 85 ? 'high' : 'medium',
          title: 'Cost Anomaly Detected',
          message: `${anomaly.description} at ${da.port.name} is ${Math.abs(anomaly.variancePercent).toFixed(1)}% ${anomaly.variancePercent > 0 ? 'higher' : 'lower'} than expected ($${anomaly.actualAmount.toLocaleString()} vs $${anomaly.expectedAmount.toLocaleString()})`,
          metadata: anomaly,
          relatedEntityType: 'disbursementAccount',
          relatedEntityId: daId,
          status: 'active',
          requiresAction: anomaly.anomalyScore > 85,
        },
      });
    }

    return anomalies;
  }

  /**
   * Get historical average for a charge type
   */
  private async getHistoricalAverage(
    portId: string,
    category: string,
    vesselGRT: number
  ): Promise<{ average: number; stdDev: number; count: number } | null> {
    // Get last 50 similar DAs
    const historicalItems = await prisma.daLineItem.findMany({
      where: {
        category,
        disbursementAccount: {
          portId,
          voyage: {
            vessel: {
              grt: {
                gte: vesselGRT * 0.8,
                lte: vesselGRT * 1.2,
              },
            },
          },
        },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    if (historicalItems.length < 5) return null;

    const amounts = historicalItems.map((item) => item.amount);
    const average = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;

    // Calculate standard deviation
    const squaredDiffs = amounts.map((amt) => Math.pow(amt - average, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    return { average, stdDev, count: amounts.length };
  }

  /**
   * Generate anomaly reason
   */
  private generateAnomalyReason(variancePercent: number, zScore: number): string {
    if (zScore > 3) {
      return `Extreme outlier (${zScore.toFixed(1)}σ from mean)`;
    } else if (Math.abs(variancePercent) > 50) {
      return `Cost is ${Math.abs(variancePercent).toFixed(0)}% ${variancePercent > 0 ? 'above' : 'below'} normal range`;
    } else if (zScore > 2) {
      return `Statistically significant deviation from historical average`;
    } else {
      return `Moderate deviation detected`;
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    lineItem: any,
    historical: { average: number },
    variancePercent: number
  ): string[] {
    const recommendations: string[] = [];

    if (variancePercent > 25) {
      recommendations.push('Request detailed invoice breakdown from agent');
      recommendations.push(`Expected amount: $${historical.average.toLocaleString()}`);

      if (variancePercent > 50) {
        recommendations.push('Consider raising formal dispute');
        recommendations.push('Request comparative quotes from other agents');
      }
    } else if (variancePercent < -25) {
      recommendations.push('Verify if service was actually provided');
      recommendations.push('Confirm no hidden fees will appear in FDA');
    }

    recommendations.push('Check for recent tariff changes at this port');

    return recommendations;
  }

  /**
   * Generate cost optimization recommendations
   */
  async generateCostOptimizations(
    organizationId: string,
    periodDays: number = 90
  ): Promise<CostOptimization[]> {
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    // Get all DAs for organization in period
    const das = await prisma.disbursementAccount.findMany({
      where: {
        organizationId,
        createdAt: { gte: since },
      },
      include: {
        lineItems: true,
        port: true,
        voyage: { include: { vessel: true } },
      },
    });

    const optimizations: CostOptimization[] = [];

    // Group by port and category
    const groupedCosts = new Map<string, any[]>();

    for (const da of das) {
      for (const item of da.lineItems) {
        const key = `${da.portId}-${item.category}`;
        if (!groupedCosts.has(key)) {
          groupedCosts.set(key, []);
        }
        groupedCosts.get(key)!.push({
          ...item,
          portName: da.port.name,
          vesselGRT: da.voyage.vessel.grt,
        });
      }
    }

    // Analyze each group for optimization opportunities
    for (const [key, items] of groupedCosts.entries()) {
      if (items.length < 3) continue;

      const [portId, category] = key.split('-');
      const portName = items[0].portName;

      const average = items.reduce((sum, item) => sum + item.amount, 0) / items.length;

      // Get alternative options
      const alternatives = await this.findAlternatives(portId, category, average);

      if (alternatives.length > 0) {
        const totalPotentialSavings = alternatives.reduce((sum, alt) => sum + alt.savings, 0);

        optimizations.push({
          portId,
          portName,
          category,
          currentAverage: average,
          suggestedAlternatives: alternatives,
          totalPotentialSavings,
        });
      }
    }

    // Sort by potential savings (highest first)
    return optimizations.sort((a, b) => b.totalPotentialSavings - a.totalPotentialSavings);
  }

  /**
   * Find alternative cost-saving options
   */
  private async findAlternatives(
    portId: string,
    category: string,
    currentAverage: number
  ): Promise<
    Array<{
      option: string;
      estimatedCost: number;
      savings: number;
      savingsPercent: number;
    }>
  > {
    const alternatives: any[] = [];

    // Strategy 1: Negotiate better rates with current agent
    alternatives.push({
      option: 'Negotiate volume discount with current agent',
      estimatedCost: currentAverage * 0.9, // 10% discount
      savings: currentAverage * 0.1,
      savingsPercent: 10,
    });

    // Strategy 2: Compare with other agents
    const otherAgents = await prisma.portAgent.findMany({
      where: { portId, status: 'active' },
      take: 3,
    });

    if (otherAgents.length > 1) {
      alternatives.push({
        option: `Compare quotes from ${otherAgents.length} alternative agents`,
        estimatedCost: currentAverage * 0.85, // Estimated 15% savings
        savings: currentAverage * 0.15,
        savingsPercent: 15,
      });
    }

    // Strategy 3: Self-handle certain services
    if (category === 'fresh_water' || category === 'garbage') {
      alternatives.push({
        option: 'Direct procurement (bypass agent)',
        estimatedCost: currentAverage * 0.75, // 25% savings
        savings: currentAverage * 0.25,
        savingsPercent: 25,
      });
    }

    return alternatives.filter((alt) => alt.savings > 0);
  }

  /**
   * Designate protecting agent
   */
  async designateProtectingAgent(data: {
    agentId: string;
    organizationId: string;
    regionOrPorts: string[]; // Port IDs or region name
    commissionRate: number;
    exclusivityPeriod?: number; // months
    userId: string;
  }): Promise<void> {
    const agent = await prisma.portAgent.findUnique({
      where: { id: data.agentId },
    });

    if (!agent) throw new Error('Agent not found');

    // Create protecting agent agreement
    await prisma.protectingAgentAgreement.create({
      data: {
        agentId: data.agentId,
        organizationId: data.organizationId,
        region: data.regionOrPorts.length > 10 ? data.regionOrPorts[0] : null, // If many ports, it's a region
        portIds: data.regionOrPorts.length <= 10 ? data.regionOrPorts : [],
        commissionRate: data.commissionRate,
        exclusivityPeriod: data.exclusivityPeriod,
        effectiveDate: new Date(),
        expiryDate: data.exclusivityPeriod
          ? new Date(Date.now() + data.exclusivityPeriod * 30 * 24 * 60 * 60 * 1000)
          : null,
        status: 'active',
        designatedBy: data.userId,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        action: 'protecting_agent_designated',
        entityType: 'portAgent',
        entityId: data.agentId,
        metadata: {
          agentName: agent.name,
          commissionRate: data.commissionRate,
          regionOrPorts: data.regionOrPorts.length,
        },
        timestamp: new Date(),
      },
    });
  }
}

export const daIntelligenceService = new DAIntelligenceService();
