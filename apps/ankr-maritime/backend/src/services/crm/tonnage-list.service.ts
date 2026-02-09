/**
 * Tonnage List Distribution Service
 * Generate and distribute daily position lists
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

export interface TonnageListFilters {
  vesselTypes?: string[]; // BULK_CARRIER, CONTAINER, TANKER, etc.
  dwtMin?: number;
  dwtMax?: number;
  openArea?: string; // Port or region
  openDateFrom?: Date;
  openDateTo?: Date;
  flags?: string[];
  ageMax?: number;
}

export interface TonnageListVessel {
  vesselId: string;
  name: string;
  imo: string;
  type: string;
  dwt: number;
  built: number;
  flag: string;
  gear: boolean;
  cranes?: number;
  grabCapacity?: number;

  // Position info
  openPort: string;
  openDate: Date;
  lastCargoDescription?: string;

  // Performance
  consumption?: number; // MT/day
  speed?: number; // knots

  // Contact
  ownerName: string;
  brokerName?: string;
  brokerContact?: string;
}

export interface TonnageListTemplate {
  id: string;
  name: string;
  filters: TonnageListFilters;
  recipients: string[]; // Email addresses
  frequency: 'DAILY' | 'WEEKLY' | 'ON_DEMAND';
  format: 'EMAIL_HTML' | 'EMAIL_PDF' | 'EXCEL';
}

export class TonnageListService {
  /**
   * Generate tonnage list based on filters
   */
  async generateTonnageList(
    filters: TonnageListFilters,
    organizationId: string
  ): Promise<TonnageListVessel[]> {
    const whereClause: any = {
      organizationId,
      status: 'OPEN', // Available for charter
    };

    // Apply filters
    if (filters.vesselTypes && filters.vesselTypes.length > 0) {
      whereClause.type = { in: filters.vesselTypes };
    }

    if (filters.dwtMin) {
      whereClause.dwt = { ...whereClause.dwt, gte: filters.dwtMin };
    }

    if (filters.dwtMax) {
      whereClause.dwt = { ...whereClause.dwt, lte: filters.dwtMax };
    }

    if (filters.flags && filters.flags.length > 0) {
      whereClause.flag = { in: filters.flags };
    }

    if (filters.ageMax) {
      const minBuiltYear = new Date().getFullYear() - filters.ageMax;
      whereClause.built = { gte: minBuiltYear };
    }

    // Get vessels
    const vessels = await prisma.vessel.findMany({
      where: whereClause,
      include: {
        owner: true,
        currentPosition: true,
      },
      orderBy: [
        { openDate: 'asc' },
        { name: 'asc' },
      ],
    });

    // Filter by open date range
    let filteredVessels = vessels;
    if (filters.openDateFrom || filters.openDateTo) {
      filteredVessels = vessels.filter((v) => {
        if (!v.openDate) return false;
        if (filters.openDateFrom && v.openDate < filters.openDateFrom) return false;
        if (filters.openDateTo && v.openDate > filters.openDateTo) return false;
        return true;
      });
    }

    // Filter by open area (if specified)
    if (filters.openArea) {
      filteredVessels = filteredVessels.filter((v) => {
        return v.openPort?.includes(filters.openArea!) || false;
      });
    }

    // Transform to tonnage list format
    return filteredVessels.map((v) => ({
      vesselId: v.id,
      name: v.name,
      imo: v.imo,
      type: v.type,
      dwt: v.dwt,
      built: v.built,
      flag: v.flag,
      gear: v.geared || false,
      cranes: v.cranes || undefined,
      grabCapacity: v.grabCapacity || undefined,
      openPort: v.openPort || 'TBN',
      openDate: v.openDate || new Date(),
      lastCargoDescription: v.lastCargo || undefined,
      consumption: v.fuelConsumption || undefined,
      speed: v.speed || undefined,
      ownerName: v.owner?.name || 'Unknown',
      brokerName: v.brokerName || undefined,
      brokerContact: v.brokerContact || undefined,
    }));
  }

  /**
   * Generate HTML email for tonnage list
   */
  async generateTonnageListEmail(
    vessels: TonnageListVessel[],
    organizationId: string
  ): Promise<string> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    const todayStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; }
    h1 { color: #0066cc; font-size: 18px; }
    h2 { color: #333; font-size: 14px; margin-top: 20px; }
    table { border-collapse: collapse; width: 100%; margin-top: 10px; }
    th { background-color: #0066cc; color: white; padding: 8px; text-align: left; font-size: 11px; }
    td { border: 1px solid #ddd; padding: 6px; font-size: 11px; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .footer { margin-top: 30px; font-size: 10px; color: #666; }
  </style>
</head>
<body>
  <h1>${org?.name || 'Mari8X'} - Open Tonnage List</h1>
  <p><strong>Date:</strong> ${todayStr}</p>
  <p><strong>Total Vessels:</strong> ${vessels.length}</p>
`;

    // Group by vessel type
    const grouped = this.groupByType(vessels);

    for (const [type, typeVessels] of Object.entries(grouped)) {
      html += `
  <h2>${type.replace('_', ' ')} (${typeVessels.length})</h2>
  <table>
    <thead>
      <tr>
        <th>Vessel Name</th>
        <th>Built</th>
        <th>DWT</th>
        <th>Flag</th>
        <th>Gear</th>
        <th>Open Port</th>
        <th>Open Date</th>
        <th>Last Cargo</th>
        <th>Owner</th>
        <th>Broker</th>
      </tr>
    </thead>
    <tbody>
`;

      typeVessels.forEach((v) => {
        html += `
      <tr>
        <td><strong>${v.name}</strong></td>
        <td>${v.built}</td>
        <td>${v.dwt.toLocaleString()}</td>
        <td>${v.flag}</td>
        <td>${v.gear ? 'Geared' : 'Gearless'}</td>
        <td>${v.openPort}</td>
        <td>${v.openDate.toLocaleDateString()}</td>
        <td>${v.lastCargoDescription || '-'}</td>
        <td>${v.ownerName}</td>
        <td>${v.brokerContact || v.brokerName || '-'}</td>
      </tr>
`;
      });

      html += `
    </tbody>
  </table>
`;
    }

    html += `
  <div class="footer">
    <p>This tonnage list is generated automatically by Mari8X.</p>
    <p>For inquiries, please contact your broker or reach out to ${org?.name || 'us'}.</p>
    <p><em>Confidential - Not for redistribution</em></p>
  </div>
</body>
</html>
`;

    return html;
  }

  /**
   * Send tonnage list via email
   */
  async sendTonnageList(
    filters: TonnageListFilters,
    recipients: string[],
    organizationId: string
  ): Promise<void> {
    const vessels = await this.generateTonnageList(filters, organizationId);
    const html = await this.generateTonnageListEmail(vessels, organizationId);

    // In production, use @ankr/wire for email sending
    console.log(`📧 Sending tonnage list to ${recipients.join(', ')}`);
    console.log(`   ${vessels.length} vessels included`);

    // TODO: Integrate with @ankr/wire email service
    // await wireService.sendEmail({
    //   to: recipients,
    //   subject: `Tonnage List - ${new Date().toLocaleDateString()}`,
    //   html,
    // });
  }

  /**
   * Create tonnage list template
   */
  async createTemplate(
    template: Omit<TonnageListTemplate, 'id'>,
    organizationId: string
  ): Promise<TonnageListTemplate> {
    const created = await prisma.tonnageListTemplate.create({
      data: {
        ...template,
        filters: template.filters as any,
        organizationId,
      },
    });

    return {
      id: created.id,
      name: created.name,
      filters: created.filters as TonnageListFilters,
      recipients: created.recipients,
      frequency: created.frequency as any,
      format: created.format as any,
    };
  }

  /**
   * Execute scheduled tonnage list distributions
   */
  async executeScheduledDistributions(): Promise<void> {
    const today = new Date().getDay(); // 0=Sunday, 1=Monday, etc.

    const templates = await prisma.tonnageListTemplate.findMany({
      where: {
        OR: [
          { frequency: 'DAILY' },
          { frequency: 'WEEKLY', lastSentAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        ],
      },
    });

    console.log(`📋 Executing ${templates.length} scheduled tonnage list distributions`);

    for (const template of templates) {
      try {
        await this.sendTonnageList(
          template.filters as TonnageListFilters,
          template.recipients,
          template.organizationId
        );

        await prisma.tonnageListTemplate.update({
          where: { id: template.id },
          data: { lastSentAt: new Date() },
        });
      } catch (error) {
        console.error(`Failed to send tonnage list ${template.id}:`, error);
      }
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private groupByType(
    vessels: TonnageListVessel[]
  ): Record<string, TonnageListVessel[]> {
    const groups: Record<string, TonnageListVessel[]> = {};

    vessels.forEach((v) => {
      if (!groups[v.type]) {
        groups[v.type] = [];
      }
      groups[v.type].push(v);
    });

    return groups;
  }
}

export const tonnageListService = new TonnageListService();
