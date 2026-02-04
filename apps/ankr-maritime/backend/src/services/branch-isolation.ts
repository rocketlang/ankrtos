/**
 * Branch/Office-Level Isolation Service
 * Multi-location organizational structure with data isolation
 */

import { prisma } from '../lib/prisma.js';

export interface BranchOffice {
  id: string;
  name: string;
  code: string; // LDN, SIN, MUM, ATH
  city: string;
  country: string;
  timezone: string;
  organizationId: string;
  parentBranchId?: string | null; // For hierarchical structure
  isolationLevel: 'full' | 'partial' | 'none';
}

export interface BranchIsolationPolicy {
  canViewOtherBranches: boolean;
  canEditOtherBranches: boolean;
  sharedDataTypes: string[]; // e.g., ['ports', 'vessels', 'marketRates']
  privateDataTypes: string[]; // e.g., ['charters', 'invoices', 'kycRecords']
}

export class BranchIsolationService {
  /**
   * Create a new branch/office
   */
  async createBranch(data: {
    name: string;
    code: string;
    city: string;
    country: string;
    timezone: string;
    organizationId: string;
    parentBranchId?: string;
    isolationLevel?: 'full' | 'partial' | 'none';
  }): Promise<BranchOffice> {
    const branch = await prisma.branch.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        city: data.city,
        country: data.country,
        timezone: data.timezone,
        organizationId: data.organizationId,
        parentBranchId: data.parentBranchId,
        isolationLevel: data.isolationLevel || 'partial',
        status: 'active',
      },
    });

    return branch as BranchOffice;
  }

  /**
   * Get all branches for an organization
   */
  async getBranchesByOrganization(organizationId: string): Promise<BranchOffice[]> {
    const branches = await prisma.branch.findMany({
      where: { organizationId, status: 'active' },
      orderBy: { name: 'asc' },
    });

    return branches as BranchOffice[];
  }

  /**
   * Check if user has access to a specific branch
   */
  async canAccessBranch(userId: string, branchId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        branch: true,
        role: true,
      },
    });

    if (!user) return false;

    // Super admins can access all branches
    if (user.role?.name === 'super_admin') return true;

    // Company admins can access all branches in their organization
    if (user.role?.name === 'company_admin') {
      const targetBranch = await prisma.branch.findUnique({
        where: { id: branchId },
      });
      return user.organizationId === targetBranch?.organizationId;
    }

    // Regular users can only access their own branch
    return user.branchId === branchId;
  }

  /**
   * Get accessible branches for a user
   */
  async getAccessibleBranches(userId: string): Promise<BranchOffice[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        branch: true,
        role: true,
      },
    });

    if (!user) return [];

    // Super admins see all branches across all organizations
    if (user.role?.name === 'super_admin') {
      return this.getBranchesByOrganization(user.organizationId);
    }

    // Company admins see all branches in their organization
    if (user.role?.name === 'company_admin') {
      return this.getBranchesByOrganization(user.organizationId);
    }

    // Regular users see only their branch
    if (user.branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: user.branchId },
      });
      return branch ? [branch as BranchOffice] : [];
    }

    return [];
  }

  /**
   * Apply branch filter to Prisma query
   */
  async getBranchFilter(userId: string, dataType: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        branch: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Super admins see everything
    if (user.role?.name === 'super_admin') {
      return {}; // No filter
    }

    // Company admins see all branches in their organization
    if (user.role?.name === 'company_admin') {
      const branches = await this.getBranchesByOrganization(user.organizationId);
      return {
        branchId: {
          in: branches.map((b) => b.id),
        },
      };
    }

    // Check isolation policy for this data type
    const policy = this.getIsolationPolicy(user.branch?.isolationLevel || 'partial');

    // If data type is shared, user can see across branches
    if (policy.sharedDataTypes.includes(dataType)) {
      const branches = await this.getBranchesByOrganization(user.organizationId);
      return {
        branchId: {
          in: branches.map((b) => b.id),
        },
      };
    }

    // Otherwise, only their branch
    return {
      branchId: user.branchId,
    };
  }

  /**
   * Get isolation policy based on isolation level
   */
  private getIsolationPolicy(isolationLevel: string): BranchIsolationPolicy {
    switch (isolationLevel) {
      case 'full':
        // Full isolation - users can only see their branch
        return {
          canViewOtherBranches: false,
          canEditOtherBranches: false,
          sharedDataTypes: [], // Nothing shared
          privateDataTypes: [
            'charters',
            'voyages',
            'invoices',
            'kycRecords',
            'disbursementAccounts',
            'claims',
            'contacts',
          ],
        };

      case 'partial':
        // Partial isolation - reference data shared, transactional data private
        return {
          canViewOtherBranches: true,
          canEditOtherBranches: false,
          sharedDataTypes: [
            'vessels',
            'ports',
            'companies',
            'marketRates',
            'portTariffs',
            'portAgents',
            'vesselPositions',
          ],
          privateDataTypes: ['charters', 'voyages', 'invoices', 'kycRecords', 'claims'],
        };

      case 'none':
        // No isolation - full access across branches
        return {
          canViewOtherBranches: true,
          canEditOtherBranches: true,
          sharedDataTypes: ['*'], // Everything shared
          privateDataTypes: [],
        };

      default:
        return this.getIsolationPolicy('partial');
    }
  }

  /**
   * Get branch hierarchy (for multi-level organizations)
   */
  async getBranchHierarchy(branchId: string): Promise<BranchOffice[]> {
    const hierarchy: BranchOffice[] = [];

    let currentBranchId: string | null = branchId;

    while (currentBranchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: currentBranchId },
      });

      if (!branch) break;

      hierarchy.unshift(branch as BranchOffice);
      currentBranchId = branch.parentBranchId;
    }

    return hierarchy;
  }

  /**
   * Get child branches (for hierarchical view)
   */
  async getChildBranches(branchId: string): Promise<BranchOffice[]> {
    const branches = await prisma.branch.findMany({
      where: { parentBranchId: branchId, status: 'active' },
      orderBy: { name: 'asc' },
    });

    return branches as BranchOffice[];
  }

  /**
   * Seed default branches for new organization
   */
  async seedDefaultBranches(organizationId: string): Promise<void> {
    const defaultBranches = [
      { name: 'London Office', code: 'LDN', city: 'London', country: 'UK', timezone: 'Europe/London' },
      {
        name: 'Singapore Office',
        code: 'SIN',
        city: 'Singapore',
        country: 'Singapore',
        timezone: 'Asia/Singapore',
      },
      { name: 'Mumbai Office', code: 'MUM', city: 'Mumbai', country: 'India', timezone: 'Asia/Kolkata' },
      { name: 'Athens Office', code: 'ATH', city: 'Athens', country: 'Greece', timezone: 'Europe/Athens' },
    ];

    for (const branch of defaultBranches) {
      await this.createBranch({
        ...branch,
        organizationId,
        isolationLevel: 'partial',
      });
    }
  }
}

export const branchIsolationService = new BranchIsolationService();
