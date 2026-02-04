/**
 * P&I (Protection & Indemnity) Club Integration
 * - LOC (Letter of Undertaking) requests
 * - Claims submission and tracking
 * - Coverage verification
 */

import { prisma } from '../lib/prisma.js';

export interface PIClub {
  id: string;
  name: string;
  igGroup: boolean; // International Group member
  apiEndpoint?: string;
  apiKey?: string;
}

export interface LOCRequest {
  id: string;
  vesselId: string;
  clubId: string;
  type: 'wreck_removal' | 'cargo_claim' | 'pollution' | 'crew_injury' | 'other';
  amount: number;
  currency: string;
  beneficiary: string;
  reason: string;
  status: 'draft' | 'submitted' | 'issued' | 'rejected' | 'expired';
  requestDate: Date;
  issuedDate?: Date;
  expiryDate?: Date;
  locNumber?: string;
}

export interface PIClaim {
  id: string;
  vesselId: string;
  clubId: string;
  type: 'cargo' | 'collision' | 'pollution' | 'wreck' | 'crew' | 'third_party';
  incidentDate: Date;
  reportedDate: Date;
  estimatedValue: number;
  status: 'reported' | 'investigating' | 'approved' | 'denied' | 'settled';
  claimNumber?: string;
}

export class PIClubIntegration {
  /**
   * Get P&I club for vessel
   */
  async getVesselPIClub(vesselId: string): Promise<PIClub | null> {
    const vessel = await prisma.vessel.findUnique({
      where: { id: vesselId },
      include: {
        insurancePolicies: {
          where: {
            type: 'pi',
            status: 'active',
            validUntil: { gte: new Date() },
          },
        },
      },
    });

    if (!vessel || !vessel.insurancePolicies.length) return null;

    const policy = vessel.insurancePolicies[0];

    // TODO: Integrate with actual P&I club database
    return {
      id: policy.insurerId || 'unknown',
      name: policy.insurer,
      igGroup: this.isIGClub(policy.insurer),
    };
  }

  /**
   * Check if club is International Group member
   */
  private isIGClub(clubName: string): boolean {
    const igClubs = [
      'American Club',
      'Britannia',
      'Gard',
      'Japan Club',
      'North of England',
      'Shipowners Club',
      'Skuld',
      'Standard Club',
      'Swedish Club',
      'UK Club',
      'West of England',
      'London P&I',
      'Steamship Mutual',
    ];

    return igClubs.some((ig) => clubName.toLowerCase().includes(ig.toLowerCase()));
  }

  /**
   * Request LOC (Letter of Undertaking)
   */
  async requestLOC(data: {
    vesselId: string;
    type: LOCRequest['type'];
    amount: number;
    currency: string;
    beneficiary: string;
    reason: string;
    userId: string;
  }): Promise<LOCRequest> {
    const vessel = await prisma.vessel.findUnique({
      where: { id: data.vesselId },
    });

    if (!vessel) {
      throw new Error('Vessel not found');
    }

    const club = await this.getVesselPIClub(data.vesselId);
    if (!club) {
      throw new Error('No active P&I coverage found for vessel');
    }

    // Create LOC request
    const locRequest = await prisma.lOCRequest.create({
      data: {
        vesselId: data.vesselId,
        clubId: club.id,
        type: data.type,
        amount: data.amount,
        currency: data.currency,
        beneficiary: data.beneficiary,
        reason: data.reason,
        status: 'draft',
        requestDate: new Date(),
        requestedBy: data.userId,
        organizationId: vessel.organizationId,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: vessel.organizationId,
        userId: data.userId,
        action: 'loc_requested',
        entityType: 'locRequest',
        entityId: locRequest.id,
        metadata: {
          vesselName: vessel.name,
          imo: vessel.imo,
          type: data.type,
          amount: data.amount,
          currency: data.currency,
        },
        timestamp: new Date(),
      },
    });

    return locRequest as any;
  }

  /**
   * Submit LOC request to P&I club
   */
  async submitLOC(locRequestId: string): Promise<void> {
    const locRequest = await prisma.lOCRequest.findUnique({
      where: { id: locRequestId },
      include: { vessel: true },
    });

    if (!locRequest) {
      throw new Error('LOC request not found');
    }

    // TODO: Integrate with P&I club API
    // For now, mark as submitted and simulate response

    const locNumber = `LOC-${Date.now()}-${locRequest.vesselId.substring(0, 8).toUpperCase()}`;

    await prisma.lOCRequest.update({
      where: { id: locRequestId },
      data: {
        status: 'submitted',
        locNumber,
        submittedAt: new Date(),
      },
    });

    // Create alert for follow-up
    await prisma.alert.create({
      data: {
        organizationId: locRequest.organizationId,
        type: 'loc_submitted',
        severity: 'low',
        title: 'LOC Request Submitted',
        message: `LOC request ${locNumber} for ${locRequest.vessel.name} has been submitted to P&I club. Awaiting response.`,
        metadata: {
          locRequestId,
          vesselName: locRequest.vessel.name,
          amount: locRequest.amount,
          currency: locRequest.currency,
        },
        relatedEntityType: 'locRequest',
        relatedEntityId: locRequestId,
        status: 'active',
      },
    });
  }

  /**
   * Report claim to P&I club
   */
  async reportClaim(data: {
    vesselId: string;
    type: PIClaim['type'];
    incidentDate: Date;
    estimatedValue: number;
    description: string;
    userId: string;
  }): Promise<PIClaim> {
    const vessel = await prisma.vessel.findUnique({
      where: { id: data.vesselId },
    });

    if (!vessel) {
      throw new Error('Vessel not found');
    }

    const club = await this.getVesselPIClub(data.vesselId);
    if (!club) {
      throw new Error('No active P&I coverage found for vessel');
    }

    const claimNumber = `PI-${Date.now()}-${data.vesselId.substring(0, 8).toUpperCase()}`;

    // Create claim record
    const claim = await prisma.pIClaim.create({
      data: {
        vesselId: data.vesselId,
        clubId: club.id,
        type: data.type,
        incidentDate: data.incidentDate,
        reportedDate: new Date(),
        estimatedValue: data.estimatedValue,
        description: data.description,
        status: 'reported',
        claimNumber,
        reportedBy: data.userId,
        organizationId: vessel.organizationId,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: vessel.organizationId,
        userId: data.userId,
        action: 'pi_claim_reported',
        entityType: 'piClaim',
        entityId: claim.id,
        metadata: {
          vesselName: vessel.name,
          imo: vessel.imo,
          type: data.type,
          estimatedValue: data.estimatedValue,
          claimNumber,
        },
        timestamp: new Date(),
      },
    });

    // Create high-priority alert
    await prisma.alert.create({
      data: {
        organizationId: vessel.organizationId,
        type: 'pi_claim_reported',
        severity: 'high',
        title: 'P&I Claim Reported',
        message: `${data.type.toUpperCase()} claim ${claimNumber} reported for ${vessel.name}. Estimated value: $${data.estimatedValue.toLocaleString()}`,
        metadata: {
          claimId: claim.id,
          vesselName: vessel.name,
          type: data.type,
          estimatedValue: data.estimatedValue,
        },
        relatedEntityType: 'piClaim',
        relatedEntityId: claim.id,
        status: 'active',
        requiresAction: true,
      },
    });

    return claim as any;
  }

  /**
   * Update claim status
   */
  async updateClaimStatus(
    claimId: string,
    status: PIClaim['status'],
    notes?: string
  ): Promise<void> {
    await prisma.pIClaim.update({
      where: { id: claimId },
      data: {
        status,
        updatedAt: new Date(),
        ...(notes && { notes }),
      },
    });
  }

  /**
   * Get LOC requests for vessel
   */
  async getVesselLOCs(vesselId: string): Promise<LOCRequest[]> {
    const requests = await prisma.lOCRequest.findMany({
      where: { vesselId },
      orderBy: { requestDate: 'desc' },
    });

    return requests as any[];
  }

  /**
   * Get claims for vessel
   */
  async getVesselClaims(vesselId: string): Promise<PIClaim[]> {
    const claims = await prisma.pIClaim.findMany({
      where: { vesselId },
      orderBy: { reportedDate: 'desc' },
    });

    return claims as any[];
  }

  /**
   * Verify P&I coverage
   */
  async verifyCoverage(vesselId: string, coverageType: string): Promise<{
    covered: boolean;
    policyNumber?: string;
    validUntil?: Date;
    limit?: number;
  }> {
    const policy = await prisma.insurancePolicy.findFirst({
      where: {
        vesselId,
        type: 'pi',
        status: 'active',
        validUntil: { gte: new Date() },
      },
    });

    if (!policy) {
      return { covered: false };
    }

    // TODO: Check specific coverage types against policy terms
    return {
      covered: true,
      policyNumber: policy.policyNumber,
      validUntil: policy.validUntil,
      limit: policy.limit,
    };
  }
}

export const piClubIntegration = new PIClubIntegration();
