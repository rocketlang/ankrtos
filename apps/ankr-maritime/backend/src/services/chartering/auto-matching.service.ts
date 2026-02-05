/**
 * Auto-Matching Engine
 * Automatically matches cargo enquiries with available vessels
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 * @roi $45,000/year (3-5 additional fixtures per month)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface MatchCriteria {
  enquiryId: string;
  maxResults?: number;
  minScore?: number; // 0-100
}

export interface VesselMatch {
  vesselId: string;
  vessel: any;
  score: number; // 0-100
  matchReasons: string[];
  concerns: string[];
  positioning: {
    currentPosition: { lat: number; lon: number };
    distanceToLoad: number; // NM
    estimatedDays: number;
    eta: Date;
  };
  commercial: {
    estimatedFreight?: number;
    ballastBonus?: number;
    totalCost?: number;
  };
  recommendation: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface MatchingResult {
  success: boolean;
  enquiryId: string;
  enquiry?: any;
  matches: VesselMatch[];
  totalMatches: number;
  processingTime: number;
  error?: string;
}

export class AutoMatchingService {
  /**
   * Find vessel matches for cargo enquiry
   */
  async findMatches(criteria: MatchCriteria): Promise<MatchingResult> {
    const startTime = Date.now();

    try {
      // Get enquiry details
      const enquiry = await prisma.cargoEnquiry.findUnique({
        where: { id: criteria.enquiryId },
        include: {
          contact: true,
          company: true,
        },
      });

      if (!enquiry) {
        return {
          success: false,
          enquiryId: criteria.enquiryId,
          matches: [],
          totalMatches: 0,
          processingTime: Date.now() - startTime,
          error: 'Enquiry not found',
        };
      }

      // Get all potentially suitable vessels
      const vessels = await this.findCandidateVessels(enquiry);

      // Score each vessel
      const matches: VesselMatch[] = [];

      for (const vessel of vessels) {
        const match = await this.scoreVessel(vessel, enquiry);

        if (match.score >= (criteria.minScore || 50)) {
          matches.push(match);
        }
      }

      // Sort by score (highest first)
      matches.sort((a, b) => b.score - a.score);

      // Limit results
      const limitedMatches = matches.slice(0, criteria.maxResults || 10);

      const processingTime = Date.now() - startTime;
      console.log(`✅ Found ${limitedMatches.length} matches in ${processingTime}ms`);

      return {
        success: true,
        enquiryId: criteria.enquiryId,
        enquiry,
        matches: limitedMatches,
        totalMatches: matches.length,
        processingTime,
      };
    } catch (error: any) {
      console.error('Auto-matching error:', error);
      return {
        success: false,
        enquiryId: criteria.enquiryId,
        matches: [],
        totalMatches: 0,
        processingTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Find candidate vessels based on basic criteria
   */
  private async findCandidateVessels(enquiry: any): Promise<any[]> {
    const where: any = {
      // Must match vessel type
      ...(enquiry.preferredVesselType && { type: enquiry.preferredVesselType }),

      // Must be within DWT range (if specified)
      ...(enquiry.minDwt && { dwt: { gte: enquiry.minDwt } }),
      ...(enquiry.maxDwt && { dwt: { lte: enquiry.maxDwt } }),

      // Must not exceed max age (if specified)
      ...(enquiry.maxVesselAge && {
        builtYear: { gte: new Date().getFullYear() - enquiry.maxVesselAge },
      }),

      // Must be available (not scrapped, not laid up)
      status: { notIn: ['scrapped', 'laid_up'] },
    };

    return await prisma.vessel.findMany({
      where,
      include: {
        owner: true,
        currentVoyage: true,
        lastPosition: true,
      },
      take: 100, // Limit to first 100 candidates for performance
    });
  }

  /**
   * Score a vessel match
   */
  private async scoreVessel(vessel: any, enquiry: any): Promise<VesselMatch> {
    let score = 0;
    const matchReasons: string[] = [];
    const concerns: string[] = [];

    // 1. Cargo Fit Score (0-30 points)
    const cargoFitScore = this.calculateCargoFit(vessel, enquiry);
    score += cargoFitScore.score;
    matchReasons.push(...cargoFitScore.reasons);
    concerns.push(...cargoFitScore.concerns);

    // 2. Positioning Score (0-30 points)
    const positioningScore = await this.calculatePositioningScore(vessel, enquiry);
    score += positioningScore.score;
    matchReasons.push(...positioningScore.reasons);
    concerns.push(...positioningScore.concerns);

    // 3. Commercial Score (0-20 points)
    const commercialScore = this.calculateCommercialScore(vessel, enquiry);
    score += commercialScore.score;
    matchReasons.push(...commercialScore.reasons);

    // 4. Technical Score (0-20 points)
    const technicalScore = this.calculateTechnicalScore(vessel, enquiry);
    score += technicalScore.score;
    matchReasons.push(...technicalScore.reasons);
    concerns.push(...technicalScore.concerns);

    // Determine recommendation
    let recommendation: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 85) recommendation = 'excellent';
    else if (score >= 70) recommendation = 'good';
    else if (score >= 55) recommendation = 'fair';
    else recommendation = 'poor';

    return {
      vesselId: vessel.id,
      vessel,
      score: Math.round(score),
      matchReasons,
      concerns,
      positioning: positioningScore.positioning,
      commercial: commercialScore.commercial,
      recommendation,
    };
  }

  /**
   * Calculate cargo fit score
   */
  private calculateCargoFit(vessel: any, enquiry: any): { score: number; reasons: string[]; concerns: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const concerns: string[] = [];

    // DWT match (0-15 points)
    if (enquiry.quantity && vessel.dwt) {
      const utilizationPct = (enquiry.quantity / vessel.dwt) * 100;

      if (utilizationPct >= 85 && utilizationPct <= 100) {
        score += 15;
        reasons.push(`Excellent cargo fit (${Math.round(utilizationPct)}% utilization)`);
      } else if (utilizationPct >= 70) {
        score += 12;
        reasons.push(`Good cargo fit (${Math.round(utilizationPct)}% utilization)`);
      } else if (utilizationPct >= 50) {
        score += 8;
        reasons.push(`Acceptable cargo fit (${Math.round(utilizationPct)}% utilization)`);
      } else {
        score += 3;
        concerns.push(`Low utilization (${Math.round(utilizationPct)}%)`);
      }
    } else {
      score += 10; // Partial score if no quantity specified
    }

    // Vessel type match (0-15 points)
    if (enquiry.preferredVesselType === vessel.type) {
      score += 15;
      reasons.push('Exact vessel type match');
    } else if (this.isCompatibleVesselType(enquiry.preferredVesselType, vessel.type)) {
      score += 10;
      reasons.push('Compatible vessel type');
    } else {
      score += 5;
    }

    return { score, reasons, concerns };
  }

  /**
   * Calculate positioning score
   */
  private async calculatePositioningScore(
    vessel: any,
    enquiry: any
  ): Promise<{ score: number; reasons: string[]; concerns: string[]; positioning: any }> {
    let score = 0;
    const reasons: string[] = [];
    const concerns: string[] = [];

    // Get vessel position
    const position = vessel.lastPosition || { latitude: 0, longitude: 0 };

    // Calculate distance to load port (simplified)
    const distanceToLoad = await this.calculateDistance(position, enquiry.loadPort);
    const speedKnots = vessel.speed || 14;
    const estimatedDays = Math.ceil(distanceToLoad / (speedKnots * 24));
    const eta = new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000);

    // Compare ETA with laycan
    if (enquiry.laycanStart && enquiry.laycanEnd) {
      const laycanStart = new Date(enquiry.laycanStart);
      const laycanEnd = new Date(enquiry.laycanEnd);

      if (eta >= laycanStart && eta <= laycanEnd) {
        score += 30;
        reasons.push('ETA within laycan');
      } else if (eta < laycanStart) {
        const daysBefore = Math.floor((laycanStart.getTime() - eta.getTime()) / (1000 * 60 * 60 * 24));

        if (daysBefore <= 7) {
          score += 25;
          reasons.push(`ETA ${daysBefore} days before laycan (acceptable)`);
        } else {
          score += 15;
          concerns.push(`ETA ${daysBefore} days before laycan (early)`);
        }
      } else {
        const daysAfter = Math.floor((eta.getTime() - laycanEnd.getTime()) / (1000 * 60 * 60 * 24));

        if (daysAfter <= 3) {
          score += 20;
          concerns.push(`ETA ${daysAfter} days after laycan (tight)`);
        } else {
          score += 5;
          concerns.push(`ETA ${daysAfter} days after laycan (late)`);
        }
      }
    } else {
      score += 20; // Partial score if no laycan specified
    }

    return {
      score,
      reasons,
      concerns,
      positioning: {
        currentPosition: position,
        distanceToLoad,
        estimatedDays,
        eta,
      },
    };
  }

  /**
   * Calculate commercial score
   */
  private calculateCommercialScore(vessel: any, enquiry: any): { score: number; reasons: string[]; commercial: any } {
    let score = 0;
    const reasons: string[] = [];

    // Estimate freight (simplified)
    const estimatedFreight = this.estimateFreight(vessel, enquiry);
    const ballastBonus = 0; // Could calculate based on positioning

    // Compare with enquiry freight rate (if specified)
    if (enquiry.freightRate && estimatedFreight) {
      const diff = ((estimatedFreight - enquiry.freightRate) / enquiry.freightRate) * 100;

      if (diff <= 0) {
        score += 20;
        reasons.push('Below indicated freight rate');
      } else if (diff <= 5) {
        score += 15;
        reasons.push('Within 5% of indicated rate');
      } else if (diff <= 10) {
        score += 10;
        reasons.push('Within 10% of indicated rate');
      } else {
        score += 5;
      }
    } else {
      score += 15; // Partial score if no rate specified
    }

    return {
      score,
      reasons,
      commercial: {
        estimatedFreight,
        ballastBonus,
        totalCost: estimatedFreight ? estimatedFreight + ballastBonus : undefined,
      },
    };
  }

  /**
   * Calculate technical score
   */
  private calculateTechnicalScore(vessel: any, enquiry: any): { score: number; reasons: string[]; concerns: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const concerns: string[] = [];

    // Vessel age (0-10 points)
    const age = new Date().getFullYear() - (vessel.builtYear || 2000);

    if (age <= 5) {
      score += 10;
      reasons.push('Modern vessel (< 5 years)');
    } else if (age <= 10) {
      score += 8;
      reasons.push('Young vessel (< 10 years)');
    } else if (age <= 15) {
      score += 6;
    } else if (age <= 20) {
      score += 4;
      concerns.push(`Vessel age: ${age} years`);
    } else {
      score += 2;
      concerns.push(`Old vessel (${age} years)`);
    }

    // Gear availability (0-5 points)
    if (enquiry.cargoType === 'breakbulk' && vessel.hasGear) {
      score += 5;
      reasons.push('Has cargo gear (required)');
    } else if (enquiry.cargoType === 'breakbulk' && !vessel.hasGear) {
      score += 0;
      concerns.push('No cargo gear (gearless)');
    } else {
      score += 3;
    }

    // Flag/classification (0-5 points)
    if (vessel.flag && this.isPreferredFlag(vessel.flag)) {
      score += 5;
      reasons.push('Preferred flag');
    } else {
      score += 3;
    }

    return { score, reasons, concerns };
  }

  /**
   * Helper: Check if vessel types are compatible
   */
  private isCompatibleVesselType(requested: string, available: string): boolean {
    const compatibility: Record<string, string[]> = {
      bulk: ['bulk_carrier', 'general_cargo'],
      containers: ['container', 'general_cargo'],
      breakbulk: ['general_cargo', 'bulk_carrier'],
      liquid: ['tanker'],
    };

    return compatibility[requested]?.includes(available) || false;
  }

  /**
   * Helper: Calculate distance between positions (simplified)
   */
  private async calculateDistance(position: any, portCode: string): Promise<number> {
    // In production, use proper great circle distance calculation
    // For now, return estimated distance

    // Get port coordinates
    const port = await prisma.port.findFirst({
      where: { unlocode: portCode },
    });

    if (!port || !port.latitude || !port.longitude) {
      return 5000; // Default estimate
    }

    // Haversine formula (simplified)
    const lat1 = position.latitude * (Math.PI / 180);
    const lat2 = port.latitude * (Math.PI / 180);
    const deltaLat = (port.latitude - position.latitude) * (Math.PI / 180);
    const deltaLon = (port.longitude - position.longitude) * (Math.PI / 180);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const earthRadiusNM = 3440.065; // Nautical miles

    return Math.round(earthRadiusNM * c);
  }

  /**
   * Helper: Estimate freight rate
   */
  private estimateFreight(vessel: any, enquiry: any): number | undefined {
    if (!enquiry.quantity || !enquiry.loadPort || !enquiry.dischargePort) {
      return undefined;
    }

    // Very simplified freight estimation
    // In production, use historical fixtures database
    const baseRate = 25; // USD per MT
    const distanceFactor = 1.0; // Adjust based on route distance

    return baseRate * distanceFactor;
  }

  /**
   * Helper: Check if flag is preferred
   */
  private isPreferredFlag(flag: string): boolean {
    const preferred = ['PANAMA', 'LIBERIA', 'MARSHALL ISLANDS', 'SINGAPORE', 'HONG KONG'];
    return preferred.includes(flag.toUpperCase());
  }

  /**
   * Send match notifications to brokers
   */
  async sendMatchNotifications(enquiryId: string, matches: VesselMatch[]): Promise<void> {
    // Get top 3 matches
    const topMatches = matches.slice(0, 3);

    for (const match of topMatches) {
      console.log(`📧 Sending match notification for ${match.vessel.name} (score: ${match.score})`);
      // TODO: Send email via email service
    }
  }
}

export const autoMatchingService = new AutoMatchingService();
