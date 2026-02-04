/**
 * Protecting Agent Designation Service
 * Phase 6: DA Desk & Port Agency
 *
 * Features:
 * - Protecting agent nomination workflow
 * - Geographic territory management
 * - Exclusivity period tracking
 * - Commission protection tracking
 * - Conflict resolution for overlapping claims
 */

import { prisma } from '../lib/prisma.js';

export interface ProtectingAgentDesignation {
  id: string;
  agentId: string;
  portId: string;
  territory?: string;
  exclusivityStartDate: Date;
  exclusivityEndDate: Date;
  commissionRate: number;
  status: 'active' | 'expired' | 'revoked' | 'disputed';
  nominatedBy: string;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface TerritoryConflict {
  existingDesignation: ProtectingAgentDesignation;
  newNomination: any;
  conflictType: 'overlapping_territory' | 'overlapping_period' | 'duplicate_agent';
  resolution: string;
}

class ProtectingAgentService {
  /**
   * Nominate a protecting agent
   */
  async nominateProtectingAgent(
    agentId: string,
    portId: string,
    exclusivityMonths: number,
    commissionRate: number,
    territory: string | undefined,
    userId: string,
    organizationId: string
  ): Promise<any> {
    // Check for conflicts
    const conflicts = await this.checkConflicts(
      portId,
      territory,
      new Date(),
      new Date(Date.now() + exclusivityMonths * 30 * 24 * 60 * 60 * 1000)
    );

    if (conflicts.length > 0) {
      throw new Error(
        'Conflict detected: ' + conflicts[0].conflictType + '. ' + conflicts[0].resolution
      );
    }

    // Create designation (simplified - would need proper schema)
    const designation = {
      id: 'pa-' + Date.now(),
      agentId,
      portId,
      territory,
      exclusivityStartDate: new Date(),
      exclusivityEndDate: new Date(Date.now() + exclusivityMonths * 30 * 24 * 60 * 60 * 1000),
      commissionRate,
      status: 'active' as const,
      nominatedBy: userId,
      organizationId,
    };

    // In production, would save to database
    // await prisma.protectingAgentDesignation.create({ data: designation });

    return designation;
  }

  /**
   * Check for territorial conflicts
   */
  async checkConflicts(
    portId: string,
    territory: string | undefined,
    startDate: Date,
    endDate: Date
  ): Promise<TerritoryConflict[]> {
    const conflicts: TerritoryConflict[] = [];

    // Get existing designations for this port
    // In production: const existingDesignations = await prisma.protectingAgentDesignation.findMany(...)
    const existingDesignations: any[] = [];

    for (const existing of existingDesignations) {
      // Check for overlapping periods
      const periodsOverlap =
        (startDate >= existing.exclusivityStartDate && startDate <= existing.exclusivityEndDate) ||
        (endDate >= existing.exclusivityStartDate && endDate <= existing.exclusivityEndDate) ||
        (startDate <= existing.exclusivityStartDate && endDate >= existing.exclusivityEndDate);

      if (periodsOverlap) {
        // Check for territory overlap
        const territoriesOverlap = !territory || !existing.territory || territory === existing.territory;

        if (territoriesOverlap) {
          conflicts.push({
            existingDesignation: existing,
            newNomination: { portId, territory, startDate, endDate },
            conflictType: 'overlapping_period',
            resolution: 'Adjust exclusivity period or revoke existing designation',
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Get active protecting agent for port/territory
   */
  async getProtectingAgent(
    portId: string,
    territory: string | undefined,
    date: Date = new Date()
  ): Promise<any | null> {
    // In production: query database for active designation
    // const designation = await prisma.protectingAgentDesignation.findFirst({
    //   where: {
    //     portId,
    //     territory: territory || null,
    //     status: 'active',
    //     exclusivityStartDate: { lte: date },
    //     exclusivityEndDate: { gte: date },
    //   },
    //   include: { agent: true },
    // });

    return null;
  }

  /**
   * Calculate commission owed to protecting agent
   */
  async calculateProtectedCommission(
    voyageId: string,
    portId: string
  ): Promise<{
    protectingAgent: any | null;
    commissionRate: number;
    baseAmount: number;
    commissionAmount: number;
    isProtected: boolean;
  }> {
    const voyage = await prisma.voyage.findUnique({
      where: { id: voyageId },
      include: {
        disbursementAccounts: {
          where: { portId },
        },
      },
    });

    if (!voyage) {
      throw new Error('Voyage not found');
    }

    // Get protecting agent for this port
    const protectingAgent = await this.getProtectingAgent(portId, undefined, voyage.startDate);

    if (!protectingAgent) {
      return {
        protectingAgent: null,
        commissionRate: 0,
        baseAmount: 0,
        commissionAmount: 0,
        isProtected: false,
      };
    }

    // Calculate commission based on DA total
    const baseAmount = voyage.disbursementAccounts.reduce((sum, da) => sum + da.totalAmount, 0);
    const commissionAmount = baseAmount * (protectingAgent.commissionRate / 100);

    return {
      protectingAgent,
      commissionRate: protectingAgent.commissionRate,
      baseAmount,
      commissionAmount,
      isProtected: true,
    };
  }

  /**
   * Revoke protecting agent designation
   */
  async revokeDesignation(
    designationId: string,
    reason: string,
    userId: string
  ): Promise<any> {
    // In production:
    // return await prisma.protectingAgentDesignation.update({
    //   where: { id: designationId },
    //   data: {
    //     status: 'revoked',
    //     revokedBy: userId,
    //     revokedAt: new Date(),
    //     revocationReason: reason,
    //   },
    // });

    return {
      id: designationId,
      status: 'revoked',
      revokedBy: userId,
      revokedAt: new Date(),
      revocationReason: reason,
    };
  }

  /**
   * Get expiring designations (renewal alerts)
   */
  async getExpiringDesignations(
    organizationId: string,
    daysAhead: number = 60
  ): Promise<any[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    // In production:
    // return await prisma.protectingAgentDesignation.findMany({
    //   where: {
    //     organizationId,
    //     status: 'active',
    //     exclusivityEndDate: {
    //       gte: new Date(),
    //       lte: futureDate,
    //     },
    //   },
    //   include: {
    //     agent: true,
    //     port: true,
    //   },
    //   orderBy: { exclusivityEndDate: 'asc' },
    // });

    return [];
  }

  /**
   * Get designation history for port
   */
  async getDesignationHistory(portId: string): Promise<any[]> {
    // In production:
    // return await prisma.protectingAgentDesignation.findMany({
    //   where: { portId },
    //   include: { agent: true },
    //   orderBy: { exclusivityStartDate: 'desc' },
    // });

    return [];
  }

  /**
   * Dispute resolution workflow
   */
  async createDispute(
    designationId: string,
    disputeReason: string,
    disputedBy: string
  ): Promise<any> {
    // Update designation status
    // In production:
    // await prisma.protectingAgentDesignation.update({
    //   where: { id: designationId },
    //   data: { status: 'disputed' },
    // });

    // Create dispute record
    // return await prisma.protectingAgentDispute.create({
    //   data: {
    //     designationId,
    //     disputeReason,
    //     disputedBy,
    //     status: 'open',
    //   },
    // });

    return {
      id: 'dispute-' + Date.now(),
      designationId,
      disputeReason,
      disputedBy,
      status: 'open',
      createdAt: new Date(),
    };
  }

  /**
   * Get protecting agent performance metrics
   */
  async getAgentPerformance(
    agentId: string,
    organizationId: string
  ): Promise<{
    totalDesignations: number;
    activeDesignations: number;
    totalCommissionEarned: number;
    averageCommissionRate: number;
    portsCovered: number;
  }> {
    // In production: query actual data
    return {
      totalDesignations: 0,
      activeDesignations: 0,
      totalCommissionEarned: 0,
      averageCommissionRate: 0,
      portsCovered: 0,
    };
  }
}

export const protectingAgentService = new ProtectingAgentService();
