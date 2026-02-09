/**
 * Auto-Matching Engine
 * AI-powered cargo-to-vessel matching (inspired by Fr8X Smart Matching)
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

export interface MatchingRequest {
  cargoEnquiryId: string;
  filters?: {
    vesselTypes?: string[];
    dwtMin?: number;
    dwtMax?: number;
    builtAfter?: number;
    geared?: boolean;
    maxDistance?: number; // nautical miles from load port
  };
  maxResults?: number;
}

export interface Match {
  matchId: string;
  cargoEnquiryId: string;
  vesselId: string;

  // Vessel details
  vesselName: string;
  vesselType: string;
  dwt: number;
  built: number;
  flag: string;
  geared: boolean;

  // Cargo details
  cargoType: string;
  loadPort: string;
  dischargePort: string;
  laycanStart: Date;
  laycanEnd: Date;
  quantity: number;

  // Matching scores (0-100)
  overallScore: number;
  physicalScore: number; // DWT, cubic, draft, gear
  geographicScore: number; // Ballast distance
  timingScore: number; // Open date vs laycan
  commercialScore: number; // Estimated TCE
  relationshipScore: number; // Past fixture history
  complianceScore: number; // Sanctions, vetting

  // Financial
  estimatedTCE: number; // USD/day
  ballastDistance: number; // nautical miles
  ballastDays: number;
  estimatedFreight: number; // USD

  // Status
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: Date;
  expiresAt: Date;
}

export interface MatchingJob {
  jobId: string;
  cargoEnquiryId: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  totalVesselsScanned: number;
  matchesFound: number;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface MatchFeedback {
  matchId: string;
  action: 'ACCEPTED' | 'REJECTED';
  reason?: string;
  userId: string;
}

export class AutoMatchingService {
  /**
   * Create matching job for cargo enquiry
   */
  async createMatchingJob(
    request: MatchingRequest,
    organizationId: string
  ): Promise<MatchingJob> {
    // Get cargo enquiry
    const cargo = await prisma.cargoEnquiry.findFirst({
      where: {
        id: request.cargoEnquiryId,
        organizationId,
      },
    });

    if (!cargo) {
      throw new Error('Cargo enquiry not found');
    }

    // Create matching job
    const job = await prisma.matchingJob.create({
      data: {
        cargoEnquiryId: request.cargoEnquiryId,
        status: 'QUEUED',
        organizationId,
        filters: request.filters as any,
        maxResults: request.maxResults || 20,
      },
    });

    // Execute matching asynchronously
    this.executeMatching(job.id, request, cargo, organizationId).catch((error) => {
      console.error(`Matching job ${job.id} failed:`, error);
      prisma.matchingJob.update({
        where: { id: job.id },
        data: { status: 'FAILED', errorMessage: error.message },
      });
    });

    return {
      jobId: job.id,
      cargoEnquiryId: request.cargoEnquiryId,
      status: 'QUEUED',
      totalVesselsScanned: 0,
      matchesFound: 0,
    };
  }

  /**
   * Get matching results
   */
  async getMatches(
    cargoEnquiryId: string,
    organizationId: string
  ): Promise<Match[]> {
    const matches = await prisma.match.findMany({
      where: {
        cargoEnquiryId,
        organizationId,
        status: { not: 'EXPIRED' },
      },
      include: {
        vessel: true,
        cargo: true,
      },
      orderBy: { overallScore: 'desc' },
    });

    return matches.map((m) => this.formatMatch(m));
  }

  /**
   * Submit feedback on match (accepted/rejected)
   */
  async submitFeedback(
    feedback: MatchFeedback,
    organizationId: string
  ): Promise<void> {
    // Update match status
    await prisma.match.update({
      where: {
        id: feedback.matchId,
        organizationId,
      },
      data: {
        status: feedback.action,
        rejectionReason: feedback.reason,
        feedbackAt: new Date(),
        feedbackById: feedback.userId,
      },
    });

    // Learn from feedback for future matching
    await this.learnFromFeedback(feedback, organizationId);
  }

  /**
   * Run batch matching overnight for all open cargo
   */
  async runBatchMatching(organizationId: string): Promise<void> {
    console.log('🔄 Running batch matching for all open cargo...');

    const openCargo = await prisma.cargoEnquiry.findMany({
      where: {
        organizationId,
        status: { in: ['NEW', 'WORKING'] },
      },
    });

    console.log(`   Found ${openCargo.length} open cargo enquiries`);

    for (const cargo of openCargo) {
      try {
        await this.createMatchingJob(
          { cargoEnquiryId: cargo.id, maxResults: 10 },
          organizationId
        );
      } catch (error) {
        console.error(`Failed to match cargo ${cargo.id}:`, error);
      }
    }

    console.log('✅ Batch matching completed');
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async executeMatching(
    jobId: string,
    request: MatchingRequest,
    cargo: any,
    organizationId: string
  ): Promise<void> {
    // Update job status
    await prisma.matchingJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', startedAt: new Date() },
    });

    // Get candidate vessels
    const vessels = await this.getCandidateVessels(cargo, request.filters, organizationId);

    console.log(`🔍 Scanning ${vessels.length} vessels for cargo ${cargo.id}`);

    const matches: Match[] = [];

    // Score each vessel
    for (const vessel of vessels) {
      const scores = await this.calculateMatchScores(cargo, vessel, organizationId);

      // Filter by minimum threshold
      if (scores.overallScore >= 50) {
        // 50% minimum
        const match = await this.createMatch(cargo, vessel, scores, organizationId);
        matches.push(match);
      }
    }

    // Sort by overall score
    matches.sort((a, b) => b.overallScore - a.overallScore);

    // Limit results
    const topMatches = matches.slice(0, request.maxResults || 20);

    // Update job status
    await prisma.matchingJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        totalVesselsScanned: vessels.length,
        matchesFound: topMatches.length,
      },
    });

    console.log(`✅ Found ${topMatches.length} matches for cargo ${cargo.id}`);
  }

  private async getCandidateVessels(
    cargo: any,
    filters: MatchingRequest['filters'],
    organizationId: string
  ): Promise<any[]> {
    const whereClause: any = {
      organizationId,
      status: 'OPEN', // Available for charter
    };

    // Apply filters
    if (filters?.vesselTypes && filters.vesselTypes.length > 0) {
      whereClause.type = { in: filters.vesselTypes };
    }

    if (filters?.dwtMin) {
      whereClause.dwt = { ...whereClause.dwt, gte: filters.dwtMin };
    }

    if (filters?.dwtMax) {
      whereClause.dwt = { ...whereClause.dwt, lte: filters.dwtMax };
    }

    if (filters?.builtAfter) {
      whereClause.built = { gte: filters.builtAfter };
    }

    if (filters?.geared !== undefined) {
      whereClause.geared = filters.geared;
    }

    // Get vessels
    const vessels = await prisma.vessel.findMany({
      where: whereClause,
      include: {
        owner: true,
        currentPosition: true,
      },
      take: 100, // Limit to prevent timeout
    });

    return vessels;
  }

  private async calculateMatchScores(
    cargo: any,
    vessel: any,
    organizationId: string
  ): Promise<{
    overallScore: number;
    physicalScore: number;
    geographicScore: number;
    timingScore: number;
    commercialScore: number;
    relationshipScore: number;
    complianceScore: number;
    estimatedTCE: number;
    ballastDistance: number;
    ballastDays: number;
  }> {
    // 1. Physical Suitability (25%)
    const physicalScore = this.calculatePhysicalScore(cargo, vessel);

    // 2. Geographic Proximity (20%)
    const ballastDistance = this.calculateDistance(
      vessel.openPort || 'SGSIN', // Default to Singapore
      cargo.loadPort
    );
    const geographicScore = this.calculateGeographicScore(ballastDistance);

    // 3. Timing Alignment (20%)
    const timingScore = this.calculateTimingScore(cargo, vessel);

    // 4. Commercial Viability (15%)
    const { estimatedTCE, commercialScore } = this.calculateCommercialScore(
      cargo,
      vessel,
      ballastDistance
    );

    // 5. Relationship History (10%)
    const relationshipScore = await this.calculateRelationshipScore(
      cargo.chartererId,
      vessel.ownerId,
      organizationId
    );

    // 6. Compliance (10%)
    const complianceScore = await this.calculateComplianceScore(vessel, cargo);

    // Calculate weighted overall score
    const overallScore =
      physicalScore * 0.25 +
      geographicScore * 0.2 +
      timingScore * 0.2 +
      commercialScore * 0.15 +
      relationshipScore * 0.1 +
      complianceScore * 0.1;

    const ballastDays = ballastDistance / (vessel.speed || 14) / 24;

    return {
      overallScore: Math.round(overallScore),
      physicalScore: Math.round(physicalScore),
      geographicScore: Math.round(geographicScore),
      timingScore: Math.round(timingScore),
      commercialScore: Math.round(commercialScore),
      relationshipScore: Math.round(relationshipScore),
      complianceScore: Math.round(complianceScore),
      estimatedTCE,
      ballastDistance: Math.round(ballastDistance),
      ballastDays: Math.round(ballastDays * 10) / 10,
    };
  }

  private calculatePhysicalScore(cargo: any, vessel: any): number {
    let score = 100;

    // DWT suitability
    const cargoQuantity = cargo.quantity || 0;
    const utilizationPercent = (cargoQuantity / vessel.dwt) * 100;

    if (utilizationPercent < 70) {
      score -= 20; // Under-utilization
    } else if (utilizationPercent > 100) {
      score -= 50; // Over-capacity
    }

    // Gear requirement
    if (cargo.requiresGear && !vessel.geared) {
      score -= 30; // Missing required gear
    }

    // Draft limitation
    // In production, check actual draft restrictions

    return Math.max(0, score);
  }

  private calculateGeographicScore(ballastDistance: number): number {
    // Closer = better
    if (ballastDistance <= 500) return 100;
    if (ballastDistance <= 1000) return 90;
    if (ballastDistance <= 2000) return 75;
    if (ballastDistance <= 3000) return 60;
    if (ballastDistance <= 5000) return 40;
    return 20;
  }

  private calculateTimingScore(cargo: any, vessel: any): number {
    if (!cargo.laycanStart || !vessel.openDate) return 50; // Unknown

    const laycanStart = new Date(cargo.laycanStart);
    const openDate = new Date(vessel.openDate);

    const daysDiff = (laycanStart.getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24);

    // Perfect if vessel opens 0-7 days before laycan
    if (daysDiff >= 0 && daysDiff <= 7) return 100;
    if (daysDiff >= -3 && daysDiff <= 14) return 85; // Within 2 weeks
    if (daysDiff >= -7 && daysDiff <= 21) return 70;
    if (daysDiff >= -14 && daysDiff <= 30) return 50;

    return 20; // Poor timing
  }

  private calculateCommercialScore(
    cargo: any,
    vessel: any,
    ballastDistance: number
  ): { estimatedTCE: number; commercialScore: number } {
    // Simple TCE estimation
    const voyageDistance = this.calculateDistance(cargo.loadPort, cargo.dischargePort);
    const totalDistance = ballastDistance + voyageDistance;

    const voyageDays = totalDistance / (vessel.speed || 14) / 24;
    const portDays = 5; // Estimate
    const totalDays = voyageDays + portDays;

    const freightRevenue = cargo.freightRate || 25000; // Assume $25k/day
    const bunkerCost = (vessel.fuelConsumption || 25) * 600 * voyageDays; // $600/MT
    const portCosts = 50000; // Estimate

    const netRevenue = freightRevenue - bunkerCost - portCosts;
    const estimatedTCE = netRevenue / totalDays;

    // Score based on TCE
    let commercialScore = 50;
    if (estimatedTCE > 15000) commercialScore = 100;
    else if (estimatedTCE > 10000) commercialScore = 85;
    else if (estimatedTCE > 7000) commercialScore = 70;
    else if (estimatedTCE > 5000) commercialScore = 50;
    else commercialScore = 30;

    return {
      estimatedTCE: Math.round(estimatedTCE),
      commercialScore,
    };
  }

  private async calculateRelationshipScore(
    chartererId: string,
    ownerId: string,
    organizationId: string
  ): Promise<number> {
    // Check past fixtures between these parties
    const pastFixtures = await prisma.charter.findMany({
      where: {
        organizationId,
        chartererId,
        vesselOwnerId: ownerId,
        status: 'FIXED',
      },
      take: 10,
    });

    if (pastFixtures.length === 0) return 50; // Neutral

    // Positive relationship history
    return Math.min(100, 50 + pastFixtures.length * 10);
  }

  private async calculateComplianceScore(vessel: any, cargo: any): Promise<number> {
    let score = 100;

    // Check sanctions
    // In production: integrate with sanctions screening API

    // Check vetting status
    if (!vessel.rightshipScore || vessel.rightshipScore < 3) {
      score -= 20; // Low vetting score
    }

    // Check age
    const age = new Date().getFullYear() - vessel.built;
    if (age > 20) score -= 15;

    return Math.max(0, score);
  }

  private async createMatch(
    cargo: any,
    vessel: any,
    scores: any,
    organizationId: string
  ): Promise<Match> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const match = await prisma.match.create({
      data: {
        cargoEnquiryId: cargo.id,
        vesselId: vessel.id,
        overallScore: scores.overallScore,
        physicalScore: scores.physicalScore,
        geographicScore: scores.geographicScore,
        timingScore: scores.timingScore,
        commercialScore: scores.commercialScore,
        relationshipScore: scores.relationshipScore,
        complianceScore: scores.complianceScore,
        estimatedTCE: scores.estimatedTCE,
        ballastDistance: scores.ballastDistance,
        ballastDays: scores.ballastDays,
        estimatedFreight: cargo.freightRate || 0,
        status: 'PENDING',
        expiresAt,
        organizationId,
      },
    });

    return this.formatMatch({ ...match, vessel, cargo });
  }

  private formatMatch(match: any): Match {
    return {
      matchId: match.id,
      cargoEnquiryId: match.cargoEnquiryId,
      vesselId: match.vesselId,
      vesselName: match.vessel.name,
      vesselType: match.vessel.type,
      dwt: match.vessel.dwt,
      built: match.vessel.built,
      flag: match.vessel.flag,
      geared: match.vessel.geared || false,
      cargoType: match.cargo.cargoType,
      loadPort: match.cargo.loadPort,
      dischargePort: match.cargo.dischargePort,
      laycanStart: match.cargo.laycanStart,
      laycanEnd: match.cargo.laycanEnd,
      quantity: match.cargo.quantity,
      overallScore: match.overallScore,
      physicalScore: match.physicalScore,
      geographicScore: match.geographicScore,
      timingScore: match.timingScore,
      commercialScore: match.commercialScore,
      relationshipScore: match.relationshipScore,
      complianceScore: match.complianceScore,
      estimatedTCE: match.estimatedTCE,
      ballastDistance: match.ballastDistance,
      ballastDays: match.ballastDays,
      estimatedFreight: match.estimatedFreight,
      status: match.status,
      createdAt: match.createdAt,
      expiresAt: match.expiresAt,
    };
  }

  private async learnFromFeedback(
    feedback: MatchFeedback,
    organizationId: string
  ): Promise<void> {
    // In production: Use feedback to improve ML model
    // Track which factors led to accepted/rejected matches
    // Adjust scoring weights based on historical performance

    console.log(`📊 Learning from feedback: ${feedback.action} for match ${feedback.matchId}`);
  }

  private calculateDistance(port1: string, port2: string): number {
    // In production: Use actual port coordinates and sea route calculation
    // For now, return mock distance
    return Math.random() * 3000 + 500; // 500-3500 nm
  }
}

export const autoMatchingService = new AutoMatchingService();
