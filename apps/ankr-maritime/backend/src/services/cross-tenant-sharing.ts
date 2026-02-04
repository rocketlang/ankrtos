/**
 * Cross-Tenant Data Sharing Service
 * Enables sharing of market data, port info, and reference data across tenants
 * while keeping transactional data (deals, invoices, KYC) private
 */

import { prisma } from '../lib/prisma.js';

export type DataSharingScope = 'private' | 'organization' | 'public' | 'marketplace';

export interface DataSharingPolicy {
  dataType: string;
  scope: DataSharingScope;
  allowedOrganizations?: string[]; // For selective sharing
  shareWithMarketplace: boolean; // Share with all platform users
}

export class CrossTenantSharingService {
  /**
   * Define data sharing policies
   */
  private readonly sharingPolicies: Map<string, DataSharingPolicy> = new Map([
    // PUBLIC DATA - Shared across all tenants
    ['Port', { dataType: 'Port', scope: 'public', shareWithMarketplace: true }],
    ['Terminal', { dataType: 'Terminal', scope: 'public', shareWithMarketplace: true }],
    ['PortTariff', { dataType: 'PortTariff', scope: 'public', shareWithMarketplace: true }],
    ['PortCongestion', { dataType: 'PortCongestion', scope: 'public', shareWithMarketplace: true }],
    ['PortRestriction', { dataType: 'PortRestriction', scope: 'public', shareWithMarketplace: true }],
    ['MarketRate', { dataType: 'MarketRate', scope: 'public', shareWithMarketplace: true }],
    ['FreightIndex', { dataType: 'FreightIndex', scope: 'public', shareWithMarketplace: true }],
    ['EcaZone', { dataType: 'EcaZone', scope: 'public', shareWithMarketplace: true }],
    ['HighRiskArea', { dataType: 'HighRiskArea', scope: 'public', shareWithMarketplace: true }],
    ['CanalTransit', { dataType: 'CanalTransit', scope: 'public', shareWithMarketplace: true }],

    // MARKETPLACE DATA - Opt-in sharing for market matching
    ['Vessel', { dataType: 'Vessel', scope: 'marketplace', shareWithMarketplace: false }], // Owners can opt-in
    [
      'VesselPosition',
      { dataType: 'VesselPosition', scope: 'marketplace', shareWithMarketplace: false },
    ], // Only for open tonnage
    [
      'CargoEnquiry',
      { dataType: 'CargoEnquiry', scope: 'marketplace', shareWithMarketplace: false },
    ], // Charterers can share
    [
      'SaleListing',
      { dataType: 'SaleListing', scope: 'marketplace', shareWithMarketplace: true },
    ], // S&P public listings

    // ORGANIZATION-SCOPED DATA - Stay within organization
    [
      'Company',
      { dataType: 'Company', scope: 'organization', shareWithMarketplace: false },
    ], // Company directory is org-specific
    ['Contact', { dataType: 'Contact', scope: 'organization', shareWithMarketplace: false }],
    ['KYCRecord', { dataType: 'KYCRecord', scope: 'private', shareWithMarketplace: false }],
    [
      'SanctionScreening',
      { dataType: 'SanctionScreening', scope: 'private', shareWithMarketplace: false },
    ],

    // PRIVATE DATA - Never shared across tenants
    ['Charter', { dataType: 'Charter', scope: 'private', shareWithMarketplace: false }],
    ['CharterParty', { dataType: 'CharterParty', scope: 'private', shareWithMarketplace: false }],
    ['Voyage', { dataType: 'Voyage', scope: 'private', shareWithMarketplace: false }],
    ['Invoice', { dataType: 'Invoice', scope: 'private', shareWithMarketplace: false }],
    [
      'DisbursementAccount',
      { dataType: 'DisbursementAccount', scope: 'private', shareWithMarketplace: false },
    ],
    ['Claim', { dataType: 'Claim', scope: 'private', shareWithMarketplace: false }],
    ['TimeCharter', { dataType: 'TimeCharter', scope: 'private', shareWithMarketplace: false }],
    ['COA', { dataType: 'COA', scope: 'private', shareWithMarketplace: false }],
    ['Payment', { dataType: 'Payment', scope: 'private', shareWithMarketplace: false }],
    ['BunkerStem', { dataType: 'BunkerStem', scope: 'private', shareWithMarketplace: false }],
  ]);

  /**
   * Get data sharing policy for a model
   */
  getPolicy(dataType: string): DataSharingPolicy {
    const policy = this.sharingPolicies.get(dataType);

    if (!policy) {
      // Default: private if not explicitly defined
      return {
        dataType,
        scope: 'private',
        shareWithMarketplace: false,
      };
    }

    return policy;
  }

  /**
   * Build Prisma filter for data access based on sharing policy
   */
  async buildSharingFilter(
    dataType: string,
    userId: string,
    includeMarketplace: boolean = false
  ): Promise<any> {
    const policy = this.getPolicy(dataType);

    // PUBLIC DATA - No filter needed (accessible to all)
    if (policy.scope === 'public') {
      return {};
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: { select: { name: true } } },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // PRIVATE DATA - Only user's organization
    if (policy.scope === 'private') {
      return { organizationId: user.organizationId };
    }

    // ORGANIZATION-SCOPED DATA - Same as private but can be extended
    if (policy.scope === 'organization') {
      return { organizationId: user.organizationId };
    }

    // MARKETPLACE DATA - Own org + opted-in marketplace data
    if (policy.scope === 'marketplace' && includeMarketplace) {
      // Check if user has marketplace access
      const hasMarketplaceAccess = await this.hasMarketplaceAccess(userId);

      if (hasMarketplaceAccess) {
        return {
          OR: [
            { organizationId: user.organizationId }, // Own data
            { isPublicListing: true }, // Public marketplace listings
          ],
        };
      }
    }

    // Default: only user's organization
    return { organizationId: user.organizationId };
  }

  /**
   * Check if user has marketplace access
   */
  async hasMarketplaceAccess(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          select: {
            subscriptionTier: true,
            marketplaceEnabled: true,
          },
        },
      },
    });

    if (!user || !user.organization) return false;

    // Marketplace access for Pro/Enterprise tiers
    const allowedTiers = ['professional', 'enterprise'];
    return (
      allowedTiers.includes(user.organization.subscriptionTier) &&
      user.organization.marketplaceEnabled === true
    );
  }

  /**
   * Publish entity to marketplace
   */
  async publishToMarketplace(
    dataType: string,
    entityId: string,
    userId: string
  ): Promise<boolean> {
    const policy = this.getPolicy(dataType);

    // Only marketplace-enabled types can be published
    if (policy.scope !== 'marketplace') {
      throw new Error(`${dataType} cannot be published to marketplace`);
    }

    // Check user has marketplace access
    const hasAccess = await this.hasMarketplaceAccess(userId);
    if (!hasAccess) {
      throw new Error('User does not have marketplace access');
    }

    // Update entity to mark as public listing
    const modelName = dataType.toLowerCase();

    try {
      await (prisma as any)[modelName].update({
        where: { id: entityId },
        data: { isPublicListing: true, publishedAt: new Date() },
      });

      return true;
    } catch (error) {
      console.error(`Failed to publish ${dataType} to marketplace:`, error);
      return false;
    }
  }

  /**
   * Unpublish entity from marketplace
   */
  async unpublishFromMarketplace(dataType: string, entityId: string): Promise<boolean> {
    const modelName = dataType.toLowerCase();

    try {
      await (prisma as any)[modelName].update({
        where: { id: entityId },
        data: { isPublicListing: false, publishedAt: null },
      });

      return true;
    } catch (error) {
      console.error(`Failed to unpublish ${dataType} from marketplace:`, error);
      return false;
    }
  }

  /**
   * Get marketplace statistics
   */
  async getMarketplaceStats(): Promise<{
    totalListings: number;
    activeVessels: number;
    cargoEnquiries: number;
    saleListings: number;
  }> {
    const [vessels, cargos, sales] = await Promise.all([
      prisma.vessel.count({ where: { isPublicListing: true } }),
      prisma.cargoEnquiry.count({ where: { isPublicListing: true } }),
      prisma.saleListing.count({ where: { isPublicListing: true } }),
    ]);

    return {
      totalListings: vessels + cargos + sales,
      activeVessels: vessels,
      cargoEnquiries: cargos,
      saleListings: sales,
    };
  }

  /**
   * Check if user can access a specific entity
   */
  async canAccessEntity(
    dataType: string,
    entityId: string,
    userId: string
  ): Promise<boolean> {
    const policy = this.getPolicy(dataType);

    // PUBLIC DATA - Always accessible
    if (policy.scope === 'public') return true;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user) return false;

    const modelName = dataType.toLowerCase();
    const entity = await (prisma as any)[modelName].findUnique({
      where: { id: entityId },
      select: { organizationId: true, isPublicListing: true },
    });

    if (!entity) return false;

    // Own organization - always accessible
    if (entity.organizationId === user.organizationId) return true;

    // MARKETPLACE DATA - Check if public listing
    if (policy.scope === 'marketplace' && entity.isPublicListing) {
      const hasAccess = await this.hasMarketplaceAccess(userId);
      return hasAccess;
    }

    return false;
  }
}

export const crossTenantSharingService = new CrossTenantSharingService();
