// cii-alert-service.ts — CII Rating Downgrade Alert System

import { PrismaClient } from '@prisma/client';
// import { sendEmail } from '@ankr/wire'; // TODO: Fix package import

const prisma = new PrismaClient();

interface CIIRatingChange {
  vesselId: string;
  vesselName: string;
  previousRating: string;
  currentRating: string;
  year: number;
  downgradeLevel: number; // 1 = one level (A→B), 2 = two levels (A→C), etc.
}

const RATING_ORDER = ['A', 'B', 'C', 'D', 'E'];

export class CIIAlertService {
  /**
   * Check all vessels for CII rating downgrades and send alerts
   */
  async checkAllVessels(organizationId: string): Promise<CIIRatingChange[]> {
    const currentYear = new Date().getFullYear();
    const downgrades: CIIRatingChange[] = [];

    // Get all vessels in organization
    const vessels = await prisma.vessel.findMany({
      where: { organizationId },
      include: {
        DCSReports: {
          where: { year: { in: [currentYear, currentYear - 1] } },
          orderBy: { year: 'desc' },
          take: 2,
        },
      },
    });

    for (const vessel of vessels) {
      if (vessel.DCSReports.length >= 2) {
        const [current, previous] = vessel.DCSReports;
        const downgrade = this.detectDowngrade(
          previous.ciiRating,
          current.ciiRating
        );

        if (downgrade > 0) {
          downgrades.push({
            vesselId: vessel.id,
            vesselName: vessel.name,
            previousRating: previous.ciiRating,
            currentRating: current.ciiRating,
            year: current.year,
            downgradeLevel: downgrade,
          });

          // Create alert
          await this.createAlert(vessel, previous.ciiRating, current.ciiRating, organizationId);

          // Send email notification
          await this.sendDowngradeEmail(
            vessel,
            previous.ciiRating,
            current.ciiRating,
            organizationId
          );
        }
      }
    }

    return downgrades;
  }

  /**
   * Detect if there's a downgrade and by how many levels
   */
  private detectDowngrade(previousRating: string, currentRating: string): number {
    const prevIndex = RATING_ORDER.indexOf(previousRating);
    const currIndex = RATING_ORDER.indexOf(currentRating);

    if (prevIndex === -1 || currIndex === -1) return 0;
    if (currIndex > prevIndex) {
      return currIndex - prevIndex; // Downgrade: higher index = worse rating
    }
    return 0; // No downgrade
  }

  /**
   * Create alert in database
   */
  private async createAlert(
    vessel: any,
    previousRating: string,
    currentRating: string,
    organizationId: string
  ) {
    const severity = this.getSeverity(previousRating, currentRating);
    const message = `Vessel ${vessel.name} CII rating downgraded from ${previousRating} to ${currentRating}`;

    await prisma.alert.create({
      data: {
        organizationId,
        type: 'cii_downgrade',
        severity,
        title: `CII Downgrade: ${vessel.name}`,
        message,
        metadata: {
          vesselId: vessel.id,
          vesselName: vessel.name,
          previousRating,
          currentRating,
          year: new Date().getFullYear(),
        },
        relatedEntityType: 'vessel',
        relatedEntityId: vessel.id,
        status: 'active',
      },
    });
  }

  /**
   * Get severity based on downgrade level
   */
  private getSeverity(previousRating: string, currentRating: string): string {
    const downgrade = this.detectDowngrade(previousRating, currentRating);

    if (downgrade >= 3) return 'critical'; // A→D or A→E
    if (downgrade === 2) return 'high';    // A→C or B→D
    if (downgrade === 1) return 'medium';  // A→B, B→C, etc.
    return 'low';
  }

  /**
   * Send email notification to fleet managers
   */
  private async sendDowngradeEmail(
    vessel: any,
    previousRating: string,
    currentRating: string,
    organizationId: string
  ) {
    // Get fleet managers for this organization
    const managers = await prisma.user.findMany({
      where: {
        organizationId,
        role: { in: ['company_admin', 'chartering_manager', 'operator'] },
      },
    });

    const emailAddresses = managers.map((m) => m.email);

    if (emailAddresses.length === 0) return;

    const downgrade = this.detectDowngrade(previousRating, currentRating);
    const subject = `⚠️ CII Rating Downgrade Alert: ${vessel.name}`;

    const body = `
      <h2>CII Rating Downgrade Detected</h2>
      <p><strong>Vessel:</strong> ${vessel.name} (IMO: ${vessel.imo})</p>
      <p><strong>Previous Rating:</strong> <span style="color: #22c55e; font-size: 24px; font-weight: bold;">${previousRating}</span></p>
      <p><strong>Current Rating:</strong> <span style="color: #ef4444; font-size: 24px; font-weight: bold;">${currentRating}</span></p>
      <p><strong>Downgrade Level:</strong> ${downgrade} level${downgrade > 1 ? 's' : ''}</p>
      <p><strong>Year:</strong> ${new Date().getFullYear()}</p>

      <h3>Impact:</h3>
      <ul>
        ${this.getImpactList(currentRating)}
      </ul>

      <h3>Recommended Actions:</h3>
      <ul>
        <li>Review vessel operational profile and fuel consumption</li>
        <li>Implement fuel efficiency measures (hull cleaning, slow steaming, etc.)</li>
        <li>Consult with technical team on optimization strategies</li>
        ${currentRating === 'E' ? '<li><strong style="color: #ef4444;">URGENT: Rating E may face port restrictions and additional costs</strong></li>' : ''}
      </ul>

      <p>View full details in <a href="${process.env.FRONTEND_URL}/vessels/${vessel.id}">Mari8X Dashboard</a></p>
    `;

    try {
      // TODO: Fix @ankr/wire package import
      // await sendEmail({
      //   to: emailAddresses,
      //   subject,
      //   html: body,
      //   tags: ['cii-alert', 'compliance'],
      // });
      console.log(`CII alert email would be sent to: ${emailAddresses.join(', ')}`);
    } catch (error) {
      console.error('Failed to send CII downgrade email:', error);
    }
  }

  /**
   * Get impact list based on rating
   */
  private getImpactList(rating: string): string {
    const impacts: Record<string, string[]> = {
      E: [
        'Potential port restrictions in EU and other jurisdictions',
        'Additional scrutiny during PSC inspections',
        'May require corrective action plan submission to flag state',
        'Increased insurance premiums possible',
        'Charter party implications (some charterers exclude D/E rated vessels)',
      ],
      D: [
        'Subject to corrective action plan requirements',
        'Increased operational monitoring required',
        'May affect charter party negotiations',
        'PSC inspection focus on energy efficiency',
      ],
      C: [
        'Moderate improvement needed to reach compliance targets',
        'Consider operational efficiency measures',
        'Monitor fuel consumption trends closely',
      ],
      B: [
        'Good performance, minor optimization opportunities',
        'Continue monitoring to maintain rating',
      ],
      A: [
        'Excellent performance, best-in-class efficiency',
      ],
    };

    return (impacts[rating] || []).map((item) => `<li>${item}</li>`).join('');
  }

  /**
   * Manual check for a specific vessel
   */
  async checkVessel(vesselId: string, organizationId: string): Promise<CIIRatingChange | null> {
    const vessel = await prisma.vessel.findFirst({
      where: { id: vesselId, organizationId },
      include: {
        DCSReports: {
          orderBy: { year: 'desc' },
          take: 2,
        },
      },
    });

    if (!vessel || vessel.DCSReports.length < 2) return null;

    const [current, previous] = vessel.DCSReports;
    const downgrade = this.detectDowngrade(previous.ciiRating, current.ciiRating);

    if (downgrade > 0) {
      await this.createAlert(vessel, previous.ciiRating, current.ciiRating, organizationId);
      await this.sendDowngradeEmail(vessel, previous.ciiRating, current.ciiRating, organizationId);

      return {
        vesselId: vessel.id,
        vesselName: vessel.name,
        previousRating: previous.ciiRating,
        currentRating: current.ciiRating,
        year: current.year,
        downgradeLevel: downgrade,
      };
    }

    return null;
  }

  /**
   * Get CII downgrade statistics for dashboard
   */
  async getDowngradeStats(organizationId: string) {
    const currentYear = new Date().getFullYear();

    const vessels = await prisma.vessel.findMany({
      where: { organizationId },
      include: {
        DCSReports: {
          where: { year: { in: [currentYear, currentYear - 1] } },
          orderBy: { year: 'desc' },
        },
      },
    });

    let totalVessels = 0;
    let vesselsWithDowngrade = 0;
    let criticalDowngrades = 0; // 3+ levels
    const ratingDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };

    for (const vessel of vessels) {
      if (vessel.DCSReports.length >= 2) {
        totalVessels++;
        const [current, previous] = vessel.DCSReports;
        const downgrade = this.detectDowngrade(previous.ciiRating, current.ciiRating);

        if (downgrade > 0) {
          vesselsWithDowngrade++;
          if (downgrade >= 3) criticalDowngrades++;
        }

        ratingDistribution[current.ciiRating] = (ratingDistribution[current.ciiRating] || 0) + 1;
      }
    }

    return {
      totalVessels,
      vesselsWithDowngrade,
      criticalDowngrades,
      downgradeRate: totalVessels > 0 ? (vesselsWithDowngrade / totalVessels) * 100 : 0,
      ratingDistribution,
    };
  }
}

export const ciiAlertService = new CIIAlertService();
