// fixture-matcher.ts — AI-Powered Fixture Matching Engine

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CargoEnquiry {
  id: string;
  cargoType: string;
  quantity: number;
  quantityUnit: string;
  loadPort: string;
  dischargePort: string;
  laycanFrom: Date;
  laycanTo: Date;
  freightBudget?: number;
  specialRequirements?: string[];
  organizationId: string;
}

interface VesselAvailability {
  vesselId: string;
  vesselName: string;
  imo: string;
  type: string;
  dwt: number;
  flag: string;
  yearBuilt: number;
  openPort: string;
  openDate: Date;
  status: string;
  speed?: number;
  consumption?: number;
  organizationId: string;
}

interface FixtureMatch {
  vesselId: string;
  vesselName: string;
  matchScore: number;            // 0-100
  confidence: number;            // 0-1
  reasons: string[];             // Why this vessel matches
  concerns: string[];            // Potential issues
  distance: {
    ballastNM: number;
    ballastDays: number;
    ladenNM: number;
    ladenDays: number;
  };
  economics: {
    estimatedTCE: number;
    estimatedRevenue: number;
    estimatedCosts: number;
    estimatedDays: number;
    profitMargin: number;
  };
  suitability: {
    cargoCompatibility: number;  // 0-100
    timingMatch: number;         // 0-100
    geographyMatch: number;      // 0-100
    economicViability: number;   // 0-100
  };
  recommendation: 'excellent' | 'good' | 'fair' | 'poor';
}

interface MatchingCriteria {
  maxBallastDistance?: number;   // Nautical miles
  minDWT?: number;
  maxDWT?: number;
  minTCE?: number;
  requiredFlags?: string[];
  excludedFlags?: string[];
  minYearBuilt?: number;
  maxVesselAge?: number;
}

export class FixtureMatcher {
  /**
   * Find best vessel matches for a cargo enquiry
   */
  async findMatches(
    enquiry: CargoEnquiry,
    criteria?: MatchingCriteria,
    limit: number = 10
  ): Promise<FixtureMatch[]> {
    // 1. Get available vessels
    const vessels = await this.getAvailableVessels(enquiry.organizationId, enquiry.laycanFrom);

    // 2. Filter by criteria
    const filteredVessels = this.filterVessels(vessels, enquiry, criteria);

    // 3. Calculate match scores for each vessel
    const matches: FixtureMatch[] = [];
    for (const vessel of filteredVessels) {
      const match = await this.calculateMatch(vessel, enquiry);
      if (match.matchScore >= 30) {
        // Only include matches with score >= 30
        matches.push(match);
      }
    }

    // 4. Sort by match score (highest first)
    matches.sort((a, b) => b.matchScore - a.matchScore);

    // 5. Return top N matches
    return matches.slice(0, limit);
  }

  /**
   * Get available vessels around laycan period
   */
  private async getAvailableVessels(
    organizationId: string,
    laycanFrom: Date
  ): Promise<VesselAvailability[]> {
    // Get vessels that will be open within 30 days of laycan start
    const searchWindowStart = new Date(laycanFrom.getTime() - 30 * 24 * 60 * 60 * 1000);
    const searchWindowEnd = new Date(laycanFrom.getTime() + 30 * 24 * 60 * 60 * 1000);

    const vessels = await prisma.vessel.findMany({
      where: {
        organizationId,
        status: { in: ['active', 'spot', 'available'] },
      },
      include: {
        voyages: {
          where: {
            status: { in: ['in_progress', 'planned'] },
          },
          orderBy: { etaDischarge: 'desc' },
          take: 1,
        },
      },
    });

    const availability: VesselAvailability[] = [];

    for (const vessel of vessels) {
      const lastVoyage = vessel.voyages[0];

      // Determine open port and date
      let openPort = 'Unknown';
      let openDate = new Date();

      if (lastVoyage) {
        openPort = lastVoyage.dischargePort || 'Unknown';
        openDate = lastVoyage.etaDischarge || new Date();
      }

      // Check if vessel will be open in search window
      if (openDate >= searchWindowStart && openDate <= searchWindowEnd) {
        availability.push({
          vesselId: vessel.id,
          vesselName: vessel.name,
          imo: vessel.imo,
          type: vessel.type,
          dwt: vessel.dwt,
          flag: vessel.flag,
          yearBuilt: vessel.yearBuilt,
          openPort,
          openDate,
          status: vessel.status,
          speed: vessel.speed,
          consumption: vessel.consumption,
          organizationId: vessel.organizationId,
        });
      }
    }

    return availability;
  }

  /**
   * Filter vessels by criteria
   */
  private filterVessels(
    vessels: VesselAvailability[],
    enquiry: CargoEnquiry,
    criteria?: MatchingCriteria
  ): VesselAvailability[] {
    let filtered = vessels;

    // DWT filters
    if (criteria?.minDWT) {
      filtered = filtered.filter((v) => v.dwt >= criteria.minDWT!);
    }
    if (criteria?.maxDWT) {
      filtered = filtered.filter((v) => v.dwt <= criteria.maxDWT!);
    }

    // Flag filters
    if (criteria?.requiredFlags && criteria.requiredFlags.length > 0) {
      filtered = filtered.filter((v) => criteria.requiredFlags!.includes(v.flag));
    }
    if (criteria?.excludedFlags && criteria.excludedFlags.length > 0) {
      filtered = filtered.filter((v) => !criteria.excludedFlags!.includes(v.flag));
    }

    // Age filters
    const currentYear = new Date().getFullYear();
    if (criteria?.minYearBuilt) {
      filtered = filtered.filter((v) => v.yearBuilt >= criteria.minYearBuilt!);
    }
    if (criteria?.maxVesselAge) {
      filtered = filtered.filter((v) => currentYear - v.yearBuilt <= criteria.maxVesselAge!);
    }

    // Ballast distance filter (rough estimate)
    if (criteria?.maxBallastDistance) {
      filtered = filtered.filter((v) => {
        const distance = this.estimateDistance(v.openPort, enquiry.loadPort);
        return distance <= criteria.maxBallastDistance!;
      });
    }

    return filtered;
  }

  /**
   * Calculate match score for a vessel-enquiry pair
   */
  private async calculateMatch(
    vessel: VesselAvailability,
    enquiry: CargoEnquiry
  ): Promise<FixtureMatch> {
    // 1. Cargo Compatibility (0-100)
    const cargoCompatibility = this.scoreCargoCompatibility(vessel, enquiry);

    // 2. Timing Match (0-100)
    const timingMatch = this.scoreTimingMatch(vessel, enquiry);

    // 3. Geography Match (0-100)
    const ballastDistance = this.estimateDistance(vessel.openPort, enquiry.loadPort);
    const ladenDistance = this.estimateDistance(enquiry.loadPort, enquiry.dischargePort);
    const geographyMatch = this.scoreGeography(ballastDistance, ladenDistance);

    // 4. Economic Viability (0-100)
    const economics = this.calculateEconomics(vessel, enquiry, ballastDistance, ladenDistance);
    const economicViability = this.scoreEconomics(economics, enquiry.freightBudget);

    // 5. Overall Match Score (weighted average)
    const matchScore = Math.round(
      cargoCompatibility * 0.3 +
        timingMatch * 0.25 +
        geographyMatch * 0.25 +
        economicViability * 0.2
    );

    // 6. Confidence (based on data completeness)
    const confidence = this.calculateConfidence(vessel, enquiry);

    // 7. Reasons and Concerns
    const { reasons, concerns } = this.generateReasoningAndConcerns(
      vessel,
      enquiry,
      {
        cargoCompatibility,
        timingMatch,
        geographyMatch,
        economicViability,
      },
      ballastDistance
    );

    // 8. Recommendation
    const recommendation = this.getRecommendation(matchScore);

    // 9. Distance breakdown
    const ballastDays = vessel.speed
      ? ballastDistance / (vessel.speed * 24)
      : ballastDistance / (14 * 24);
    const ladenDays = vessel.speed
      ? ladenDistance / (vessel.speed * 24)
      : ladenDistance / (14 * 24);

    return {
      vesselId: vessel.vesselId,
      vesselName: vessel.vesselName,
      matchScore,
      confidence,
      reasons,
      concerns,
      distance: {
        ballastNM: Math.round(ballastDistance),
        ballastDays: Math.round(ballastDays * 10) / 10,
        ladenNM: Math.round(ladenDistance),
        ladenDays: Math.round(ladenDays * 10) / 10,
      },
      economics,
      suitability: {
        cargoCompatibility,
        timingMatch,
        geographyMatch,
        economicViability,
      },
      recommendation,
    };
  }

  /**
   * Score cargo compatibility (vessel type vs cargo type)
   */
  private scoreCargoCompatibility(vessel: VesselAvailability, enquiry: CargoEnquiry): number {
    const cargoType = enquiry.cargoType.toLowerCase();
    const vesselType = vessel.type.toLowerCase();

    // Perfect matches
    if (
      (vesselType === 'bulk_carrier' && this.isBulkCargo(cargoType)) ||
      (vesselType === 'tanker' && this.isLiquidCargo(cargoType)) ||
      (vesselType === 'container' && cargoType.includes('container')) ||
      (vesselType === 'general_cargo' && this.isGeneralCargo(cargoType))
    ) {
      return 100;
    }

    // Partial matches
    if (vesselType === 'general_cargo' && this.isBulkCargo(cargoType)) {
      return 70; // General cargo can carry some bulk
    }

    // Incompatible
    if (
      (vesselType === 'tanker' && !this.isLiquidCargo(cargoType)) ||
      (vesselType === 'bulk_carrier' && this.isLiquidCargo(cargoType))
    ) {
      return 0;
    }

    // Unknown/uncertain
    return 50;
  }

  /**
   * Score timing match (vessel open date vs laycan)
   */
  private scoreTimingMatch(vessel: VesselAvailability, enquiry: CargoEnquiry): number {
    const openTime = vessel.openDate.getTime();
    const laycanStart = enquiry.laycanFrom.getTime();
    const laycanEnd = enquiry.laycanTo.getTime();

    // Vessel opens within laycan window
    if (openTime >= laycanStart && openTime <= laycanEnd) {
      return 100;
    }

    // Vessel opens before laycan (ideal for ballast voyage)
    if (openTime < laycanStart) {
      const daysBefore = (laycanStart - openTime) / (24 * 60 * 60 * 1000);
      if (daysBefore <= 7) return 95;
      if (daysBefore <= 14) return 85;
      if (daysBefore <= 21) return 70;
      if (daysBefore <= 30) return 50;
      return 30; // Too early
    }

    // Vessel opens after laycan (might miss loading)
    const daysAfter = (openTime - laycanEnd) / (24 * 60 * 60 * 1000);
    if (daysAfter <= 3) return 60;
    if (daysAfter <= 7) return 40;
    return 20; // Too late
  }

  /**
   * Score geography (ballast and laden distances)
   */
  private scoreGeography(ballastNM: number, ladenNM: number): number {
    // Ideal ballast distance: < 2000 NM
    let score = 100;

    if (ballastNM > 2000) {
      score -= (ballastNM - 2000) / 100; // Penalty for long ballast
    }

    // Bonus for long laden voyage (more profitable)
    if (ladenNM > 5000) {
      score += 10;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate voyage economics
   */
  private calculateEconomics(
    vessel: VesselAvailability,
    enquiry: CargoEnquiry,
    ballastNM: number,
    ladenNM: number
  ): FixtureMatch['economics'] {
    const speed = vessel.speed || 14; // Default 14 knots
    const consumption = vessel.consumption || 28; // Default 28 MT/day
    const bunkerPrice = 650; // USD/MT (approximate)
    const portCosts = 50000; // USD per port call
    const defaultFreight = 30; // USD/MT (if not provided)

    // Time calculations
    const ballastDays = ballastNM / (speed * 24);
    const ladenDays = ladenNM / (speed * 24);
    const loadingDays = enquiry.quantity / 10000; // Assume 10k MT/day
    const dischargeDays = enquiry.quantity / 12000; // Assume 12k MT/day
    const totalDays = ballastDays + loadingDays + ladenDays + dischargeDays;

    // Revenue
    const freightRate = enquiry.freightBudget || defaultFreight;
    const grossFreight = enquiry.quantity * freightRate;
    const commissions = grossFreight * 0.025; // 2.5% total
    const estimatedRevenue = grossFreight - commissions;

    // Costs
    const bunkerCost =
      ballastDays * consumption * bunkerPrice +
      ladenDays * consumption * bunkerPrice +
      (loadingDays + dischargeDays) * 3 * bunkerPrice; // 3 MT/day in port
    const estimatedCosts = bunkerCost + portCosts * 2;

    // TCE
    const voyageProfit = estimatedRevenue - estimatedCosts;
    const estimatedTCE = voyageProfit / totalDays;

    // Profit margin
    const profitMargin = (voyageProfit / estimatedRevenue) * 100;

    return {
      estimatedTCE: Math.round(estimatedTCE),
      estimatedRevenue: Math.round(estimatedRevenue),
      estimatedCosts: Math.round(estimatedCosts),
      estimatedDays: Math.round(totalDays * 10) / 10,
      profitMargin: Math.round(profitMargin * 10) / 10,
    };
  }

  /**
   * Score economic viability
   */
  private scoreEconomics(
    economics: FixtureMatch['economics'],
    freightBudget?: number
  ): number {
    // Minimum acceptable TCE
    const minTCE = 10000; // USD/day
    const idealTCE = 15000; // USD/day

    if (economics.estimatedTCE >= idealTCE) return 100;
    if (economics.estimatedTCE >= minTCE) {
      const range = idealTCE - minTCE;
      const aboveMin = economics.estimatedTCE - minTCE;
      return 50 + (aboveMin / range) * 50;
    }
    if (economics.estimatedTCE > 0) {
      return Math.max(20, (economics.estimatedTCE / minTCE) * 50);
    }

    return 0; // Unprofitable
  }

  /**
   * Calculate confidence based on data completeness
   */
  private calculateConfidence(vessel: VesselAvailability, enquiry: CargoEnquiry): number {
    let score = 0.5; // Base confidence

    // Vessel data completeness
    if (vessel.speed) score += 0.1;
    if (vessel.consumption) score += 0.1;
    if (vessel.openPort !== 'Unknown') score += 0.1;

    // Enquiry data completeness
    if (enquiry.freightBudget) score += 0.1;
    if (enquiry.specialRequirements) score += 0.05;
    if (enquiry.quantityUnit) score += 0.05;

    return Math.min(1.0, Math.round(score * 100) / 100);
  }

  /**
   * Generate reasoning and concerns
   */
  private generateReasoningAndConcerns(
    vessel: VesselAvailability,
    enquiry: CargoEnquiry,
    scores: {
      cargoCompatibility: number;
      timingMatch: number;
      geographyMatch: number;
      economicViability: number;
    },
    ballastDistance: number
  ): { reasons: string[]; concerns: string[] } {
    const reasons: string[] = [];
    const concerns: string[] = [];

    // Cargo compatibility
    if (scores.cargoCompatibility >= 80) {
      reasons.push(`Excellent cargo fit (${vessel.type} for ${enquiry.cargoType})`);
    } else if (scores.cargoCompatibility < 50) {
      concerns.push(`Questionable cargo compatibility`);
    }

    // Timing
    if (scores.timingMatch >= 90) {
      reasons.push(`Perfect timing - vessel opens on laycan`);
    } else if (scores.timingMatch < 50) {
      concerns.push(`Timing mismatch - vessel may miss laycan`);
    }

    // Geography
    if (ballastDistance < 1000) {
      reasons.push(`Short ballast distance (${Math.round(ballastDistance)} NM)`);
    } else if (ballastDistance > 3000) {
      concerns.push(`Long ballast voyage (${Math.round(ballastDistance)} NM)`);
    }

    // Economics
    if (scores.economicViability >= 80) {
      reasons.push(`Highly profitable voyage (excellent TCE)`);
    } else if (scores.economicViability < 40) {
      concerns.push(`Marginal economics - low TCE expected`);
    }

    // Vessel age
    const currentYear = new Date().getFullYear();
    const age = currentYear - vessel.yearBuilt;
    if (age > 20) {
      concerns.push(`Vessel age ${age} years (may face restrictions)`);
    } else if (age < 5) {
      reasons.push(`Modern vessel (${age} years old)`);
    }

    // DWT vs cargo quantity
    const utilization = (enquiry.quantity / vessel.dwt) * 100;
    if (utilization >= 85 && utilization <= 95) {
      reasons.push(`Optimal cargo utilization (${Math.round(utilization)}%)`);
    } else if (utilization < 70) {
      concerns.push(`Low utilization (${Math.round(utilization)}%) - consider smaller vessel`);
    } else if (utilization > 100) {
      concerns.push(`Cargo exceeds DWT - vessel too small`);
    }

    return { reasons, concerns };
  }

  /**
   * Get recommendation level
   */
  private getRecommendation(matchScore: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (matchScore >= 80) return 'excellent';
    if (matchScore >= 65) return 'good';
    if (matchScore >= 45) return 'fair';
    return 'poor';
  }

  /**
   * Estimate distance between two ports (simplified)
   */
  private estimateDistance(port1: string, port2: string): number {
    // In production, use actual route distance API (e.g., Sea-distances.org)
    // For now, use simplified regional distance estimation

    const portRegion = (port: string): string => {
      const p = port.toUpperCase();
      if (p.includes('SINGAPORE') || p.includes('SGSIN')) return 'SE_ASIA';
      if (p.includes('ROTTERDAM') || p.includes('NLRTM') || p.includes('HAMBURG')) return 'N_EUROPE';
      if (p.includes('HOUSTON') || p.includes('NEW ORLEANS') || p.includes('USHOU')) return 'USG';
      if (p.includes('NEW YORK') || p.includes('USNYC')) return 'USEC';
      if (p.includes('CHINA') || p.includes('CN')) return 'FAR_EAST';
      if (p.includes('JAPAN') || p.includes('JP')) return 'FAR_EAST';
      if (p.includes('MIDDLE EAST') || p.includes('DUBAI')) return 'ME';
      if (p.includes('BRAZIL') || p.includes('BR')) return 'S_AMERICA';
      return 'UNKNOWN';
    };

    const region1 = portRegion(port1);
    const region2 = portRegion(port2);

    // Regional distance matrix (nautical miles)
    const distances: Record<string, Record<string, number>> = {
      SE_ASIA: { SE_ASIA: 500, N_EUROPE: 11000, USG: 12000, USEC: 13000, FAR_EAST: 2000, ME: 4000, S_AMERICA: 14000 },
      N_EUROPE: { SE_ASIA: 11000, N_EUROPE: 500, USG: 4500, USEC: 3500, FAR_EAST: 11500, ME: 5500, S_AMERICA: 5500 },
      USG: { SE_ASIA: 12000, N_EUROPE: 4500, USG: 500, USEC: 2000, FAR_EAST: 12500, ME: 9000, S_AMERICA: 4500 },
      USEC: { SE_ASIA: 13000, N_EUROPE: 3500, USG: 2000, USEC: 500, FAR_EAST: 13500, ME: 8000, S_AMERICA: 4000 },
      FAR_EAST: { SE_ASIA: 2000, N_EUROPE: 11500, USG: 12500, USEC: 13500, FAR_EAST: 500, ME: 6000, S_AMERICA: 14500 },
      ME: { SE_ASIA: 4000, N_EUROPE: 5500, USG: 9000, USEC: 8000, FAR_EAST: 6000, ME: 500, S_AMERICA: 9500 },
      S_AMERICA: { SE_ASIA: 14000, N_EUROPE: 5500, USG: 4500, USEC: 4000, FAR_EAST: 14500, ME: 9500, S_AMERICA: 500 },
    };

    return distances[region1]?.[region2] || 5000; // Default 5000 NM if unknown
  }

  /**
   * Helper: Check if cargo is bulk
   */
  private isBulkCargo(cargoType: string): boolean {
    const bulkKeywords = ['grain', 'coal', 'iron ore', 'fertilizer', 'wheat', 'corn', 'soya', 'bauxite', 'alumina'];
    return bulkKeywords.some((keyword) => cargoType.includes(keyword));
  }

  /**
   * Helper: Check if cargo is liquid
   */
  private isLiquidCargo(cargoType: string): boolean {
    const liquidKeywords = ['oil', 'crude', 'lpg', 'lng', 'chemical', 'petroleum', 'fuel', 'diesel', 'gasoline'];
    return liquidKeywords.some((keyword) => cargoType.includes(keyword));
  }

  /**
   * Helper: Check if cargo is general
   */
  private isGeneralCargo(cargoType: string): boolean {
    const generalKeywords = ['steel', 'machinery', 'equipment', 'project cargo', 'bags', 'pallets'];
    return generalKeywords.some((keyword) => cargoType.includes(keyword));
  }

  /**
   * Get market statistics for similar fixtures
   */
  async getMarketComparison(
    enquiry: CargoEnquiry
  ): Promise<{
    avgFreightRate: number;
    minFreightRate: number;
    maxFreightRate: number;
    sampleSize: number;
    trending: string;
  }> {
    // Get historical fixtures with similar cargo/route
    const historicalFixtures = await prisma.charter.findMany({
      where: {
        organizationId: enquiry.organizationId,
        cargoType: { contains: enquiry.cargoType, mode: 'insensitive' },
        loadPort: enquiry.loadPort,
        dischargePort: enquiry.dischargePort,
        laycanFrom: {
          gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // Last 180 days
        },
      },
      select: { freightRate: true, laycanFrom: true },
    });

    if (historicalFixtures.length === 0) {
      return {
        avgFreightRate: 0,
        minFreightRate: 0,
        maxFreightRate: 0,
        sampleSize: 0,
        trending: 'unknown',
      };
    }

    const rates = historicalFixtures
      .map((f) => f.freightRate)
      .filter((r): r is number => r !== null && r !== undefined);

    const avgFreightRate = rates.reduce((a, b) => a + b, 0) / rates.length;
    const minFreightRate = Math.min(...rates);
    const maxFreightRate = Math.max(...rates);

    // Simple trend: compare last 30 days vs previous 150 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentRates = historicalFixtures
      .filter((f) => f.laycanFrom && f.laycanFrom.getTime() >= thirtyDaysAgo)
      .map((f) => f.freightRate)
      .filter((r): r is number => r !== null && r !== undefined);

    const recentAvg =
      recentRates.length > 0 ? recentRates.reduce((a, b) => a + b, 0) / recentRates.length : avgFreightRate;

    const trending =
      recentAvg > avgFreightRate * 1.05 ? 'bullish' : recentAvg < avgFreightRate * 0.95 ? 'bearish' : 'stable';

    return {
      avgFreightRate: Math.round(avgFreightRate * 100) / 100,
      minFreightRate: Math.round(minFreightRate * 100) / 100,
      maxFreightRate: Math.round(maxFreightRate * 100) / 100,
      sampleSize: rates.length,
      trending,
    };
  }
}

export const fixtureMatcher = new FixtureMatcher();
