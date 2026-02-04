/**
 * Smart Recommendations Engine
 * Proactive suggestions for cost optimization, efficiency, and risk mitigation
 *
 * Purpose: Save money, improve operations, prevent issues
 */

import { prisma } from '../schema/context.js';

export interface Recommendation {
  id: string;
  category: 'cost_savings' | 'efficiency' | 'risk' | 'maintenance' | 'compliance';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  potentialSavings?: number;  // USD
  actionRequired: string;
  actionUrl?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export class SmartRecommendationsService {
  /**
   * Generate recommendations for a vessel
   */
  async generateRecommendations(vesselId: string): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Get vessel data
    const vessel = await prisma.vessel.findUnique({
      where: { id: vesselId },
      include: {
        positions: {
          take: 10,
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!vessel) return [];

    // Get active voyage
    const voyage = await prisma.voyage.findFirst({
      where: { vesselId, status: 'in_progress' },
      include: {
        departurePort: true,
        arrivalPort: true,
      },
    });

    // Generate recommendations
    recommendations.push(...await this.analyzeRouteOptimization(vessel, voyage));
    recommendations.push(...await this.analyzePortCongestion(vessel, voyage));
    recommendations.push(...await this.analyzeFuelEfficiency(vessel));
    recommendations.push(...await this.analyzeCertificateExpiry(vessel));
    recommendations.push(...await this.analyzeMaintenancePredictions(vessel));
    recommendations.push(...await this.analyzeDAApprovals(vesselId));
    recommendations.push(...await this.analyzeWeatherRisks(vessel, voyage));
    recommendations.push(...await this.analyzeBunkerOpportunities(vessel, voyage));

    // Sort by priority (high first)
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Route optimization recommendations
   */
  private async analyzeRouteOptimization(vessel: any, voyage: any): Promise<Recommendation[]> {
    const recs: Recommendation[] = [];

    if (!voyage) return recs;

    // Check if fleet collaborative routing is available
    const similarVessels = await prisma.vessel.count({
      where: {
        type: vessel.type,
        organizationId: vessel.organizationId,
      },
    });

    if (similarVessels >= 3) {
      // Potential savings from optimized routing
      const estimatedSavings = 3500; // Mock - would calculate from historical data

      recs.push({
        id: `route-opt-${vessel.id}`,
        category: 'cost_savings',
        priority: 'high',
        title: `Save $${estimatedSavings.toLocaleString()} with Optimized Route`,
        description: `Fleet collaborative routing suggests a more efficient path to ${voyage.arrivalPort?.name}. Expected fuel savings: 5-7%.`,
        potentialSavings: estimatedSavings,
        actionRequired: 'Review and apply optimized route',
        actionUrl: '/fleet-routes',
      });
    }

    return recs;
  }

  /**
   * Port congestion recommendations
   */
  private async analyzePortCongestion(vessel: any, voyage: any): Promise<Recommendation[]> {
    const recs: Recommendation[] = [];

    if (!voyage || !voyage.arrivalPort) return recs;

    // Check port congestion (mock - would query actual congestion data)
    const isCongested = Math.random() > 0.7; // 30% chance

    if (isCongested) {
      const delayHours = 8 + Math.floor(Math.random() * 16); // 8-24 hours

      recs.push({
        id: `port-congestion-${voyage.id}`,
        category: 'risk',
        priority: 'medium',
        title: `Port Congestion Alert: ${voyage.arrivalPort.name}`,
        description: `Current congestion level: HIGH. Expected delay: ${delayHours} hours. Consider adjusting speed to arrive after congestion clears.`,
        actionRequired: 'Review port congestion data and adjust ETA',
        actionUrl: '/port-congestion',
        metadata: { delayHours, portId: voyage.arrivalPort.id },
      });
    }

    return recs;
  }

  /**
   * Fuel efficiency recommendations
   */
  private async analyzeFuelEfficiency(vessel: any): Promise<Recommendation[]> {
    const recs: Recommendation[] = [];

    // Analyze recent positions for speed patterns
    const positions = vessel.positions || [];

    if (positions.length >= 3) {
      const avgSpeed = positions.reduce((sum: number, p: any) => sum + (p.speed || 0), 0) / positions.length;

      // Check if vessel is operating at optimal speed
      const optimalSpeed = 12; // Knots - would be vessel-specific
      const speedDiff = Math.abs(avgSpeed - optimalSpeed);

      if (speedDiff > 2) {
        const direction = avgSpeed > optimalSpeed ? 'reduce' : 'increase';
        const savingsPercentage = speedDiff * 2; // 2% per knot difference
        const estimatedSavings = 2000 * savingsPercentage; // Mock calculation

        recs.push({
          id: `fuel-efficiency-${vessel.id}`,
          category: 'cost_savings',
          priority: 'medium',
          title: `${direction === 'reduce' ? 'Slow Down' : 'Speed Up'} to Save Fuel`,
          description: `Current speed: ${avgSpeed.toFixed(1)} kts. Optimal: ${optimalSpeed} kts. ${direction === 'reduce' ? 'Reducing' : 'Increasing'} speed could save ~${savingsPercentage.toFixed(1)}% fuel.`,
          potentialSavings: Math.round(estimatedSavings),
          actionRequired: `Adjust speed to ~${optimalSpeed} knots`,
          metadata: { currentSpeed: avgSpeed, optimalSpeed, savingsPercentage },
        });
      }
    }

    return recs;
  }

  /**
   * Certificate expiry recommendations
   */
  private async analyzeCertificateExpiry(vessel: any): Promise<Recommendation[]> {
    const recs: Recommendation[] = [];

    // In production, would query VesselCertificate table
    // Mock: Assume some certificates expiring soon
    const hasExpiringCerts = Math.random() > 0.6; // 40% chance

    if (hasExpiringCerts) {
      const daysUntilExpiry = 15 + Math.floor(Math.random() * 45); // 15-60 days

      recs.push({
        id: `cert-expiry-${vessel.id}`,
        category: 'compliance',
        priority: daysUntilExpiry < 30 ? 'high' : 'medium',
        title: `Certificate Expiring in ${daysUntilExpiry} Days`,
        description: `Class Certificate expires on ${new Date(Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000).toLocaleDateString()}. Schedule renewal to avoid compliance issues.`,
        actionRequired: 'Contact classification society to schedule renewal',
        actionUrl: '/vessel-certificates',
        expiresAt: new Date(Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000),
      });
    }

    return recs;
  }

  /**
   * Predictive maintenance recommendations
   */
  private async analyzeMaintenancePredictions(vessel: any): Promise<Recommendation[]> {
    const recs: Recommendation[] = [];

    // Mock predictive maintenance based on vessel age/usage
    const yearBuilt = vessel.yearBuilt || 2010;
    const vesselAge = new Date().getFullYear() - yearBuilt;

    if (vesselAge > 10) {
      // Older vessels = more maintenance recommendations
      const maintenanceItems = [
        {
          component: 'Main Engine',
          daysUntil: 45,
          severity: 'medium',
          cost: 25000,
        },
        {
          component: 'Hull Coating',
          daysUntil: 90,
          severity: 'low',
          cost: 50000,
        },
      ];

      for (const item of maintenanceItems) {
        if (Math.random() > 0.5) {
          recs.push({
            id: `maintenance-${vessel.id}-${item.component}`,
            category: 'maintenance',
            priority: item.severity as 'high' | 'medium' | 'low',
            title: `Predictive Maintenance: ${item.component}`,
            description: `Based on usage patterns and vessel age, ${item.component} maintenance recommended within ${item.daysUntil} days. Estimated cost: $${item.cost.toLocaleString()}.`,
            actionRequired: 'Schedule maintenance during next port call',
            metadata: {
              component: item.component,
              daysUntil: item.daysUntil,
              estimatedCost: item.cost,
            },
          });
        }
      }
    }

    return recs;
  }

  /**
   * DA approval recommendations
   */
  private async analyzeDAApprovals(vesselId: string): Promise<Recommendation[]> {
    const recs: Recommendation[] = [];

    // Check for pending DA approvals
    const pendingDAs = await prisma.disbursementAccount.count({
      where: {
        voyage: { vesselId },
        status: 'pending_approval',
      },
    });

    if (pendingDAs > 0) {
      recs.push({
        id: `da-approval-${vesselId}`,
        category: 'efficiency',
        priority: 'medium',
        title: `${pendingDAs} DA Account${pendingDAs > 1 ? 's' : ''} Pending Approval`,
        description: `You have ${pendingDAs} disbursement account${pendingDAs > 1 ? 's' : ''} waiting for approval. Delays can cause port call issues.`,
        actionRequired: 'Review and approve pending DA accounts',
        actionUrl: '/da-desk',
      });
    }

    return recs;
  }

  /**
   * Weather risk recommendations
   */
  private async analyzeWeatherRisks(vessel: any, voyage: any): Promise<Recommendation[]> {
    const recs: Recommendation[] = [];

    if (!vessel.positions || vessel.positions.length === 0) return recs;

    const position = vessel.positions[0];

    // Mock weather risk analysis
    const hasWeatherRisk = Math.random() > 0.8; // 20% chance

    if (hasWeatherRisk) {
      recs.push({
        id: `weather-risk-${vessel.id}`,
        category: 'risk',
        priority: 'high',
        title: 'Severe Weather Alert on Route',
        description: `Storm system detected ahead on current route. Wind force 8-9 expected. Consider route deviation or speed adjustment.`,
        actionRequired: 'Review weather routing and adjust course',
        actionUrl: '/weather-routing',
        metadata: {
          position: { lat: position.latitude, lng: position.longitude },
          windForce: 8,
          riskLevel: 'high',
        },
      });
    }

    return recs;
  }

  /**
   * Bunker opportunity recommendations
   */
  private async analyzeBunkerOpportunities(vessel: any, voyage: any): Promise<Recommendation[]> {
    const recs: Recommendation[] = [];

    // Mock bunker price analysis
    const hasBunkerOpportunity = Math.random() > 0.7; // 30% chance

    if (hasBunkerOpportunity && voyage) {
      const savings = 5000 + Math.floor(Math.random() * 10000); // $5K-$15K

      recs.push({
        id: `bunker-opp-${vessel.id}`,
        category: 'cost_savings',
        priority: 'medium',
        title: `Bunker Price Opportunity at ${voyage.arrivalPort?.name || 'Next Port'}`,
        description: `Bunker prices are 8% below average at next port. Consider bunkering there instead of destination port to save ~$${savings.toLocaleString()}.`,
        potentialSavings: savings,
        actionRequired: 'Review bunker prices and adjust bunkering plan',
        actionUrl: '/bunkers',
      });
    }

    return recs;
  }

  /**
   * Get recommendations count by category
   */
  async getRecommendationStats(vesselId: string): Promise<Record<string, number>> {
    const recommendations = await this.generateRecommendations(vesselId);

    const stats: Record<string, number> = {
      total: recommendations.length,
      cost_savings: 0,
      efficiency: 0,
      risk: 0,
      maintenance: 0,
      compliance: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    for (const rec of recommendations) {
      stats[rec.category]++;
      stats[rec.priority]++;
    }

    return stats;
  }

  /**
   * Calculate total potential savings across all recommendations
   */
  async getTotalPotentialSavings(vesselId: string): Promise<number> {
    const recommendations = await this.generateRecommendations(vesselId);

    return recommendations.reduce((total, rec) => {
      return total + (rec.potentialSavings || 0);
    }, 0);
  }
}

export const smartRecommendationsService = new SmartRecommendationsService();
