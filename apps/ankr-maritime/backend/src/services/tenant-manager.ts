// tenant-manager.ts — Multi-Tenant Organization Management

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface BranchConfig {
  id: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  currency: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface TenantBranding {
  logo?: string; // URL to logo
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  companyName: string;
  domain?: string; // Custom domain (e.g., shipping.mari8x.com)
  favicon?: string;
}

interface ModuleConfig {
  chartering: boolean;
  operations: boolean;
  snp: boolean; // Ship Sale & Purchase
  agency: boolean;
  bunkers: boolean;
  claims: boolean;
  compliance: boolean;
  finance: boolean;
  crm: boolean;
  hr: boolean;
  analytics: boolean;
  carbon: boolean;
}

interface TenantConfig {
  organizationId: string;
  branding: TenantBranding;
  modules: ModuleConfig;
  branches: BranchConfig[];
  settings: {
    multiCurrency: boolean;
    defaultCurrency: string;
    dateFormat: string;
    timeFormat: string;
    weekStart: string; // 'monday' | 'sunday'
    fiscalYearStart: string; // 'jan' | 'apr' | etc.
  };
}

const DEFAULT_BRANDING: TenantBranding = {
  primaryColor: '#0369a1', // Maritime blue
  secondaryColor: '#0c4a6e',
  accentColor: '#38bdf8',
  companyName: 'Shipping Company',
};

const DEFAULT_MODULES: ModuleConfig = {
  chartering: true,
  operations: true,
  snp: false,
  agency: false,
  bunkers: true,
  claims: true,
  compliance: true,
  finance: true,
  crm: true,
  hr: false,
  analytics: true,
  carbon: true,
};

export class TenantManager {
  /**
   * Create new organization with default config
   */
  async createOrganization(
    name: string,
    email: string,
    branding?: Partial<TenantBranding>,
    modules?: Partial<ModuleConfig>
  ): Promise<string> {
    const org = await prisma.organization.create({
      data: {
        name,
        email,
        tenantConfig: {
          branding: { ...DEFAULT_BRANDING, companyName: name, ...branding },
          modules: { ...DEFAULT_MODULES, ...modules },
          branches: [],
          settings: {
            multiCurrency: false,
            defaultCurrency: 'USD',
            dateFormat: 'DD/MM/YYYY',
            timeFormat: '24h',
            weekStart: 'monday',
            fiscalYearStart: 'jan',
          },
        },
      },
    });

    return org.id;
  }

  /**
   * Get tenant configuration
   */
  async getTenantConfig(organizationId: string): Promise<TenantConfig | null> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { tenantConfig: true },
    });

    if (!org || !org.tenantConfig) return null;

    return org.tenantConfig as TenantConfig;
  }

  /**
   * Update tenant branding
   */
  async updateBranding(
    organizationId: string,
    branding: Partial<TenantBranding>
  ): Promise<void> {
    const config = await this.getTenantConfig(organizationId);
    if (!config) throw new Error('Organization not found');

    config.branding = { ...config.branding, ...branding };

    await prisma.organization.update({
      where: { id: organizationId },
      data: { tenantConfig: config },
    });

    // Create audit log
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: 'system',
        action: 'branding_updated',
        entityType: 'organization',
        entityId: organizationId,
        metadata: { changes: branding },
      },
    });
  }

  /**
   * Update enabled modules
   */
  async updateModules(
    organizationId: string,
    modules: Partial<ModuleConfig>
  ): Promise<void> {
    const config = await this.getTenantConfig(organizationId);
    if (!config) throw new Error('Organization not found');

    config.modules = { ...config.modules, ...modules };

    await prisma.organization.update({
      where: { id: organizationId },
      data: { tenantConfig: config },
    });

    // Create audit log
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: 'system',
        action: 'modules_updated',
        entityType: 'organization',
        entityId: organizationId,
        metadata: { changes: modules },
      },
    });
  }

  /**
   * Add branch/office
   */
  async addBranch(organizationId: string, branch: BranchConfig): Promise<void> {
    const config = await this.getTenantConfig(organizationId);
    if (!config) throw new Error('Organization not found');

    // Check for duplicate branch ID
    if (config.branches.some((b) => b.id === branch.id)) {
      throw new Error('Branch ID already exists');
    }

    config.branches.push(branch);

    await prisma.organization.update({
      where: { id: organizationId },
      data: { tenantConfig: config },
    });

    // Create audit log
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: 'system',
        action: 'branch_added',
        entityType: 'organization',
        entityId: organizationId,
        metadata: { branch },
      },
    });
  }

  /**
   * Update branch
   */
  async updateBranch(
    organizationId: string,
    branchId: string,
    updates: Partial<BranchConfig>
  ): Promise<void> {
    const config = await this.getTenantConfig(organizationId);
    if (!config) throw new Error('Organization not found');

    const branchIndex = config.branches.findIndex((b) => b.id === branchId);
    if (branchIndex === -1) throw new Error('Branch not found');

    config.branches[branchIndex] = { ...config.branches[branchIndex], ...updates };

    await prisma.organization.update({
      where: { id: organizationId },
      data: { tenantConfig: config },
    });
  }

  /**
   * Remove branch
   */
  async removeBranch(organizationId: string, branchId: string): Promise<void> {
    const config = await this.getTenantConfig(organizationId);
    if (!config) throw new Error('Organization not found');

    // Check if any users are assigned to this branch
    const usersInBranch = await prisma.user.count({
      where: { organizationId, branchId },
    });

    if (usersInBranch > 0) {
      throw new Error(
        `Cannot remove branch with ${usersInBranch} active users. Reassign users first.`
      );
    }

    config.branches = config.branches.filter((b) => b.id !== branchId);

    await prisma.organization.update({
      where: { id: organizationId },
      data: { tenantConfig: config },
    });

    // Create audit log
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: 'system',
        action: 'branch_removed',
        entityType: 'organization',
        entityId: organizationId,
        metadata: { branchId },
      },
    });
  }

  /**
   * Get users by branch
   */
  async getUsersByBranch(organizationId: string, branchId: string) {
    return prisma.user.findMany({
      where: { organizationId, branchId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });
  }

  /**
   * Assign user to branch
   */
  async assignUserToBranch(userId: string, branchId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user) throw new Error('User not found');

    // Verify branch exists
    const config = await this.getTenantConfig(user.organizationId);
    if (!config) throw new Error('Organization not found');

    const branch = config.branches.find((b) => b.id === branchId);
    if (!branch) throw new Error('Branch not found');

    await prisma.user.update({
      where: { id: userId },
      data: { branchId },
    });

    // Create audit log
    await prisma.activityLog.create({
      data: {
        organizationId: user.organizationId,
        userId: userId,
        action: 'user_branch_assigned',
        entityType: 'user',
        entityId: userId,
        metadata: { branchId, branchName: branch.name },
      },
    });
  }

  /**
   * Filter data by branch access
   */
  getBranchFilter(userId: string, userBranchId?: string) {
    // If user has no branch assigned, they can see all organization data
    if (!userBranchId) {
      return {};
    }

    // If user is assigned to a branch, filter to that branch only
    return { branchId: userBranchId };
  }

  /**
   * Check if user has access to branch
   */
  async canAccessBranch(userId: string, branchId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { branchId: true, role: true },
    });

    if (!user) return false;

    // Super admins and company admins can access all branches
    if (['super_admin', 'company_admin'].includes(user.role)) {
      return true;
    }

    // If user has no branch assigned, they can access all branches
    if (!user.branchId) return true;

    // Otherwise, can only access own branch
    return user.branchId === branchId;
  }

  /**
   * Get tenant statistics
   */
  async getTenantStats(organizationId: string) {
    const [userCount, vesselCount, voyageCount, config] = await Promise.all([
      prisma.user.count({ where: { organizationId } }),
      prisma.vessel.count({ where: { organizationId } }),
      prisma.voyage.count({ where: { organizationId } }),
      this.getTenantConfig(organizationId),
    ]);

    const branchCount = config?.branches.length || 0;
    const enabledModules = config
      ? Object.entries(config.modules).filter(([_, enabled]) => enabled).length
      : 0;

    return {
      users: userCount,
      vessels: vesselCount,
      voyages: voyageCount,
      branches: branchCount,
      enabledModules,
    };
  }

  /**
   * Get module access for user
   */
  async getModuleAccess(userId: string): Promise<ModuleConfig> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user) throw new Error('User not found');

    const config = await this.getTenantConfig(user.organizationId);
    if (!config) return DEFAULT_MODULES;

    return config.modules;
  }

  /**
   * Check if module is enabled for organization
   */
  async isModuleEnabled(organizationId: string, moduleName: keyof ModuleConfig): Promise<boolean> {
    const config = await this.getTenantConfig(organizationId);
    if (!config) return false;

    return config.modules[moduleName] ?? false;
  }

  /**
   * Generate CSS variables for tenant branding
   */
  getBrandingCSS(branding: TenantBranding): string {
    return `
      :root {
        --brand-primary: ${branding.primaryColor};
        --brand-secondary: ${branding.secondaryColor};
        --brand-accent: ${branding.accentColor};
      }
    `;
  }

  /**
   * Get tenant by custom domain
   */
  async getTenantByDomain(domain: string): Promise<string | null> {
    const orgs = await prisma.organization.findMany({
      select: { id: true, tenantConfig: true },
    });

    for (const org of orgs) {
      const config = org.tenantConfig as TenantConfig | null;
      if (config?.branding.domain === domain) {
        return org.id;
      }
    }

    return null;
  }

  /**
   * Validate tenant limits (for tier-based restrictions)
   */
  async validateTenantLimits(organizationId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { tier: true },
    });

    const stats = await this.getTenantStats(organizationId);

    const limits: Record<string, { users: number; vessels: number; branches: number }> = {
      starter: { users: 5, vessels: 10, branches: 1 },
      pro: { users: 25, vessels: 50, branches: 5 },
      enterprise: { users: -1, vessels: -1, branches: -1 }, // unlimited
    };

    const tierLimits = limits[org?.tier || 'starter'];

    return {
      users: {
        current: stats.users,
        limit: tierLimits.users,
        exceeded: tierLimits.users !== -1 && stats.users >= tierLimits.users,
      },
      vessels: {
        current: stats.vessels,
        limit: tierLimits.vessels,
        exceeded: tierLimits.vessels !== -1 && stats.vessels >= tierLimits.vessels,
      },
      branches: {
        current: stats.branches,
        limit: tierLimits.branches,
        exceeded: tierLimits.branches !== -1 && stats.branches >= tierLimits.branches,
      },
    };
  }
}

export const tenantManager = new TenantManager();
