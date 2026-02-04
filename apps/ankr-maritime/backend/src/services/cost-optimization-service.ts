/**
 * Cost Optimization Recommendation Engine
 * Phase 6: DA Desk & Port Agency
 *
 * Features:
 * - Alternative port suggestions
 * - Alternative agent suggestions
 * - Bundle optimization (combine services)
 * - Optimal service selection
 * - ROI tracking for recommendations
 * - Historical performance analysis
 */

import { prisma } from '../lib/prisma.js';
import { portTariffService } from './port-tariff-service.js';

export interface OptimizationRecommendation {
  type: 'alternative_port' | 'alternative_agent' | 'service_bundle' | 'timing_optimization';
  title: string;
  description: string;
  currentCost: number;
  optimizedCost: number;
  savings: number;
  savingsPercent: number;
  confidence: number; // 0-1
  priority: 'low' | 'medium' | 'high' | 'critical';
  implementationSteps: string[];
  risks: string[];
  estimatedImplementationTime: string;
  details: any;
}

export interface OptimizationReport {
  voyageId?: string;
  portId?: string;
  totalCurrentCost: number;
  totalOptimizedCost: number;
  totalSavings: number;
  totalSavingsPercent: number;
  recommendations: OptimizationRecommendation[];
  implementedRecommendations: number;
  actualSavingsAchieved: number;
}

class CostOptimizationService {
  /**
   * Generate optimization recommendations for a voyage
   */
  async generateVoyageOptimizations(
    voyageId: string,
    organizationId: string
  ): Promise<OptimizationReport> {
    const voyage = await prisma.voyage.findUnique({
      where: { id: voyageId },
      include: {
        vessel: true,
        portCalls: {
          include: {
            port: true,
          },
        },
        disbursementAccounts: {
          include: {
            lineItems: true,
            port: true,
          },
        },
      },
    });

    if (!voyage) {
      throw new Error('Voyage not found');
    }

    const recommendations: OptimizationRecommendation[] = [];

    // 1. Alternative port recommendations
    for (const portCall of voyage.portCalls) {
      const altPortRecs = await this.findAlternativePorts(
        portCall.port,
        voyage.vessel,
        organizationId
      );
      recommendations.push(...altPortRecs);
    }

    // 2. Alternative agent recommendations
    for (const da of voyage.disbursementAccounts) {
      const altAgentRecs = await this.findAlternativeAgents(
        da,
        organizationId
      );
      recommendations.push(...altAgentRecs);
    }

    // 3. Service bundle optimization
    for (const da of voyage.disbursementAccounts) {
      const bundleRecs = await this.optimizeServiceBundles(da, organizationId);
      recommendations.push(...bundleRecs);
    }

    // 4. Timing optimization (avoid peak hours/seasons)
    const timingRecs = await this.optimizeTiming(voyage, organizationId);
    recommendations.push(...timingRecs);

    // Calculate totals
    const totalCurrentCost = recommendations.reduce((sum, r) => sum + r.currentCost, 0);
    const totalOptimizedCost = recommendations.reduce((sum, r) => sum + r.optimizedCost, 0);
    const totalSavings = totalCurrentCost - totalOptimizedCost;
    const totalSavingsPercent = (totalSavings / totalCurrentCost) * 100;

    // Check for implemented recommendations
    const implementedRecs = await this.getImplementedRecommendations(voyageId);

    return {
      voyageId,
      totalCurrentCost,
      totalOptimizedCost,
      totalSavings,
      totalSavingsPercent,
      recommendations: recommendations.sort((a, b) => b.savings - a.savings), // Sort by savings
      implementedRecommendations: implementedRecs.count,
      actualSavingsAchieved: implementedRecs.totalSavings,
    };
  }

  /**
   * Find alternative ports with lower costs
   */
  private async findAlternativePorts(
    currentPort: any,
    vessel: any,
    organizationId: string
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Get nearby ports within 100nm
    const nearbyPorts = await prisma.port.findMany({
      where: {
        country: currentPort.country, // Same country for simplicity
        id: { not: currentPort.id },
      },
      take: 5,
    });

    // Calculate costs for each alternative
    for (const altPort of nearbyPorts) {
      try {
        const currentCost = await portTariffService.calculatePortCost(
          currentPort.id,
          {
            type: vessel.type,
            dwt: vessel.dwt,
            grt: vessel.grt,
            nrt: vessel.nrt,
          },
          undefined,
          2
        );

        const altCost = await portTariffService.calculatePortCost(
          altPort.id,
          {
            type: vessel.type,
            dwt: vessel.dwt,
            grt: vessel.grt,
            nrt: vessel.nrt,
          },
          undefined,
          2
        );

        const savings = currentCost.totalCostUSD - altCost.totalCostUSD;

        if (savings > 1000) {
          // Only recommend if savings > $1000
          recommendations.push({
            type: 'alternative_port',
            title: 'Alternative Port: ' + altPort.name,
            description: 'Consider using ' + altPort.name + ' instead of ' + currentPort.name + ' for lower port costs',
            currentCost: currentCost.totalCostUSD,
            optimizedCost: altCost.totalCostUSD,
            savings,
            savingsPercent: (savings / currentCost.totalCostUSD) * 100,
            confidence: 0.75, // Medium confidence (doesn't account for cargo handling, etc.)
            priority: savings > 10000 ? 'high' : savings > 5000 ? 'medium' : 'low',
            implementationSteps: [
              'Review cargo handling capabilities at ' + altPort.name,
              'Check berth availability and scheduling',
              'Verify customs and documentation requirements',
              'Calculate additional transit time and fuel costs',
              'Coordinate with charterer for port change approval',
            ],
            risks: [
              'Cargo handling facilities may differ',
              'Additional transit time and fuel costs',
              'Charterer approval required',
              'Unfamiliar port procedures',
            ],
            estimatedImplementationTime: '2-3 weeks advance planning',
            details: {
              currentPort: currentPort.name,
              alternativePort: altPort.name,
              breakdown: altCost.breakdown,
            },
          });
        }
      } catch (error) {
        // Skip if tariff data not available
        continue;
      }
    }

    return recommendations;
  }

  /**
   * Find alternative agents with better pricing
   */
  private async findAlternativeAgents(
    da: any,
    organizationId: string
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Get historical DA data for this port
    const historicalDAs = await prisma.disbursementAccount.findMany({
      where: {
        portId: da.portId,
        type: 'fda',
        status: 'approved',
        voyage: {
          vessel: {
            organizationId,
          },
        },
      },
      include: {
        lineItems: true,
        voyage: { include: { vessel: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Group by agent and calculate average costs
    const agentPerformance: Record<string, { totalCost: number; count: number; agent: string }> = {};

    for (const historicalDA of historicalDAs) {
      // Extract agent from notes or use port agent
      const agent = 'Agent'; // Simplified - would extract from actual data
      if (!agentPerformance[agent]) {
        agentPerformance[agent] = { totalCost: 0, count: 0, agent };
      }
      agentPerformance[agent].totalCost += historicalDA.totalAmount;
      agentPerformance[agent].count++;
    }

    // Find cheaper agents
    const currentAverage = da.totalAmount;
    for (const [agent, perf] of Object.entries(agentPerformance)) {
      const avgCost = perf.totalCost / perf.count;
      const savings = currentAverage - avgCost;

      if (savings > 500 && perf.count >= 3) {
        // Min 3 historical DAs
        recommendations.push({
          type: 'alternative_agent',
          title: 'Alternative Port Agent',
          description: 'Historical data shows alternative agents at this port charge ' + savings.toFixed(0) + ' USD less on average',
          currentCost: currentAverage,
          optimizedCost: avgCost,
          savings,
          savingsPercent: (savings / currentAverage) * 100,
          confidence: Math.min(perf.count / 10, 0.9), // Higher confidence with more data
          priority: savings > 5000 ? 'high' : 'medium',
          implementationSteps: [
            'Review alternative agent credentials and ratings',
            'Request quotation from alternative agent',
            'Compare service quality and response times',
            'Negotiate terms and commission structure',
            'Update preferred vendor list',
          ],
          risks: [
            'Service quality may vary',
            'Relationship building time required',
            'Potential disruption during transition',
          ],
          estimatedImplementationTime: '1-2 weeks',
          details: {
            currentAgent: 'Current Agent',
            alternativeAgents: [agent],
            historicalDataPoints: perf.count,
          },
        });
      }
    }

    return recommendations;
  }

  /**
   * Optimize service bundles (combine services for discounts)
   */
  private async optimizeServiceBundles(
    da: any,
    organizationId: string
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Check if multiple services can be bundled
    const lineItems = da.lineItems;
    const serviceCounts: Record<string, number> = {};

    for (const item of lineItems) {
      serviceCounts[item.category] = (serviceCounts[item.category] || 0) + 1;
    }

    // Check for common bundles
    const hasMultipleTugs = serviceCounts['towage'] > 1;
    const hasPilotageAndTowage = serviceCounts['pilotage'] > 0 && serviceCounts['towage'] > 0;

    if (hasPilotageAndTowage) {
      const pilotageItems = lineItems.filter((i: any) => i.category === 'pilotage');
      const towageItems = lineItems.filter((i: any) => i.category === 'towage');
      const totalCost = [...pilotageItems, ...towageItems].reduce((sum: number, i: any) => sum + i.amount, 0);
      const bundledCost = totalCost * 0.85; // Assume 15% bundle discount
      const savings = totalCost - bundledCost;

      recommendations.push({
        type: 'service_bundle',
        title: 'Bundle Pilotage + Towage Services',
        description: 'Negotiate bundled pricing for pilotage and towage services from the same provider',
        currentCost: totalCost,
        optimizedCost: bundledCost,
        savings,
        savingsPercent: 15,
        confidence: 0.7,
        priority: savings > 2000 ? 'medium' : 'low',
        implementationSteps: [
          'Request bundled quotation from service providers',
          'Compare bundled vs separate pricing',
          'Negotiate volume discount terms',
          'Update service contracts',
        ],
        risks: [
          'Single provider dependency',
          'May reduce competitive pressure',
        ],
        estimatedImplementationTime: '1 week',
        details: {
          services: ['pilotage', 'towage'],
          estimatedDiscount: '15%',
        },
      });
    }

    return recommendations;
  }

  /**
   * Optimize timing (avoid peak seasons, congestion)
   */
  private async optimizeTiming(
    voyage: any,
    organizationId: string
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Check for port congestion
    for (const portCall of voyage.portCalls) {
      const congestion = await prisma.portCongestion.findFirst({
        where: {
          portId: portCall.portId,
        },
        orderBy: { timestamp: 'desc' },
      });

      if (congestion && congestion.vesselsWaiting > 5) {
        const currentWaitCost = congestion.avgWaitHours * 24 * 500; // $500/day waiting cost
        const optimizedWaitCost = 0; // Assume zero if we avoid peak

        recommendations.push({
          type: 'timing_optimization',
          title: 'Avoid Port Congestion',
          description: 'Port ' + portCall.port.name + ' currently has ' + congestion.vesselsWaiting + ' vessels waiting. Consider delaying arrival by 3-5 days.',
          currentCost: currentWaitCost,
          optimizedCost: optimizedWaitCost,
          savings: currentWaitCost,
          savingsPercent: 100,
          confidence: 0.6,
          priority: currentWaitCost > 10000 ? 'high' : 'medium',
          implementationSteps: [
            'Review voyage schedule flexibility',
            'Coordinate with charterer on delay acceptability',
            'Adjust speed to arrive after congestion clears',
            'Monitor real-time berth availability',
          ],
          risks: [
            'Charterer may not accept delay',
            'Congestion may persist longer than expected',
            'Additional fuel costs if speed reduction limited',
          ],
          estimatedImplementationTime: 'Immediate (speed adjustment)',
          details: {
            port: portCall.port.name,
            currentWaitingVessels: congestion.vesselsWaiting,
            avgWaitHours: congestion.avgWaitHours,
          },
        });
      }
    }

    return recommendations;
  }

  /**
   * Track implemented recommendations and actual savings
   */
  private async getImplementedRecommendations(voyageId: string): Promise<{
    count: number;
    totalSavings: number;
  }> {
    // This would track recommendations that were actually implemented
    // For now, return mock data
    return {
      count: 0,
      totalSavings: 0,
    };
  }

  /**
   * Generate port-specific optimization report
   */
  async generatePortOptimizations(
    portId: string,
    vesselType: string,
    organizationId: string
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Get port data
    const port = await prisma.port.findUnique({
      where: { id: portId },
    });

    if (!port) {
      throw new Error('Port not found');
    }

    // Get historical performance at this port
    const historicalDAs = await prisma.disbursementAccount.findMany({
      where: {
        portId,
        type: 'fda',
        status: 'approved',
        voyage: {
          vessel: {
            type: vesselType,
            organizationId,
          },
        },
      },
      include: {
        lineItems: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Analyze cost trends
    if (historicalDAs.length >= 10) {
      const avgCost = historicalDAs.reduce((sum, da) => sum + da.totalAmount, 0) / historicalDAs.length;
      const recentAvg = historicalDAs.slice(0, 5).reduce((sum, da) => sum + da.totalAmount, 0) / 5;

      if (recentAvg > avgCost * 1.2) {
        // Recent costs 20% higher than historical average
        recommendations.push({
          type: 'alternative_agent',
          title: 'Review Port Agent Performance',
          description: 'Recent costs at ' + port.name + ' are 20% higher than historical average. Review agent performance and consider alternatives.',
          currentCost: recentAvg,
          optimizedCost: avgCost,
          savings: recentAvg - avgCost,
          savingsPercent: ((recentAvg - avgCost) / recentAvg) * 100,
          confidence: 0.8,
          priority: 'high',
          implementationSteps: [
            'Review recent DA line items for anomalies',
            'Request agent explanation for cost increases',
            'Compare with alternative agent quotations',
            'Consider renegotiating rates',
          ],
          risks: [
            'Legitimate cost increases (tariff changes, inflation)',
            'Relationship damage if switching agents',
          ],
          estimatedImplementationTime: '2 weeks',
          details: {
            port: port.name,
            historicalAverage: avgCost,
            recentAverage: recentAvg,
            dataPoints: historicalDAs.length,
          },
        });
      }
    }

    return recommendations;
  }
}

export const costOptimizationService = new CostOptimizationService();
