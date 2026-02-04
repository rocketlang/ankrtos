// clause-library.ts — Charter Party Clause Library with Search

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Clause {
  id: string;
  title: string;
  category: string;
  text: string;
  charterPartyType: string[]; // GENCON, NYPE, BALTIME, etc.
  tags: string[];
  isStandard: boolean;
  precedents: number; // Number of times used
  lastUsed?: Date;
  notes?: string;
}

interface ClauseSearchResult {
  clause: Clause;
  relevanceScore: number;
  matchReason: string;
}

const STANDARD_CLAUSES: Omit<Clause, 'id' | 'lastUsed'>[] = [
  {
    title: 'Ice Clause',
    category: 'Navigation',
    text: `The Vessel shall not be required to force ice. If on account of ice the loading or discharging port is inaccessible or if on account of ice the Vessel is unable to safely enter or leave the loading or discharging port, the Master or the Owners shall be entitled to sail to a safe and accessible substitute port.`,
    charterPartyType: ['GENCON', 'BALTIME'],
    tags: ['ice', 'navigation', 'winter', 'safety'],
    isStandard: true,
    precedents: 0,
    notes: 'Essential for voyages to northern ports during winter months',
  },
  {
    title: 'War Risks Clause',
    category: 'Safety/Security',
    text: `The Vessel shall not be required to proceed or continue to any port or place where she, her Cargo or Crew might reasonably be expected to be exposed to War Risks, unless the written consent of the Owners has first been obtained and the Charterers have agreed to pay the necessary additional insurance premium and any additional costs arising from the presence of such War Risks.`,
    charterPartyType: ['GENCON', 'NYPE', 'BALTIME'],
    tags: ['war', 'risks', 'security', 'insurance'],
    isStandard: true,
    precedents: 0,
    notes: 'Critical for voyages to conflict zones',
  },
  {
    title: 'Substitution Clause',
    category: 'Vessel',
    text: `The Owners shall have the right to substitute the Vessel for another vessel of similar size, type and class, provided that prior written notice is given to the Charterers and the substitute vessel is delivered at the same or nearby port within a reasonable time.`,
    charterPartyType: ['GENCON', 'BALTIME'],
    tags: ['substitution', 'vessel', 'flexibility'],
    isStandard: true,
    precedents: 0,
    notes: 'Provides flexibility for owners in case of vessel unavailability',
  },
  {
    title: 'Lien Clause',
    category: 'Payment',
    text: `The Owners shall have a lien on the cargo and on all sub-freights for freight, deadfreight, demurrage, claims for damages and for all other amounts due under this Charter Party. The Owners shall also have a lien on the cargo for general average contributions to the Owners.`,
    charterPartyType: ['GENCON', 'NYPE'],
    tags: ['lien', 'payment', 'security', 'freight'],
    isStandard: true,
    precedents: 0,
    notes: 'Protects owners right to payment',
  },
  {
    title: 'Arbitration Clause (London)',
    category: 'Dispute Resolution',
    text: `Any dispute arising out of or in connection with this Charter Party shall be referred to arbitration in London in accordance with the Arbitration Act 1996 or any statutory modification or re-enactment thereof. The arbitration shall be conducted in accordance with the LMAA Terms.`,
    charterPartyType: ['GENCON', 'NYPE', 'BALTIME'],
    tags: ['arbitration', 'dispute', 'london', 'lmaa'],
    isStandard: true,
    precedents: 0,
    notes: 'Standard London arbitration clause',
  },
  {
    title: 'WWDSHEX - Weather Working Days Sundays and Holidays Excepted',
    category: 'Laytime',
    text: `Laytime shall be calculated in Weather Working Days, Sundays and Holidays Excepted (WWDSHEX). Only time when weather permits loading/discharging operations to be carried out safely and effectively shall count as laytime. Sundays and local/national holidays shall be excluded unless used, in which case actual time used shall count.`,
    charterPartyType: ['GENCON', 'BALTIME'],
    tags: ['laytime', 'wwdshex', 'demurrage', 'weather'],
    isStandard: true,
    precedents: 0,
    notes: 'Common laytime calculation method',
  },
  {
    title: 'Deviation Clause',
    category: 'Navigation',
    text: `The Vessel shall have liberty to call at any port or ports in any order, to sail without pilots, to tow and to be towed, to assist vessels in all situations, and to deviate for the purpose of saving life and/or property.`,
    charterPartyType: ['GENCON', 'NYPE', 'BALTIME'],
    tags: ['deviation', 'navigation', 'liberty'],
    isStandard: true,
    precedents: 0,
    notes: 'Allows vessel to deviate from route when necessary',
  },
  {
    title: 'Bunker Clause',
    category: 'Bunkers/Fuel',
    text: `The Charterers shall provide and pay for all bunkers. The Vessel shall be redelivered with approximately the same quantity of bunkers on board as on delivery, fair wear and tear excepted. Any difference in quantity shall be settled at the current market price at the port of redelivery.`,
    charterPartyType: ['NYPE', 'BALTIME'],
    tags: ['bunkers', 'fuel', 'redelivery'],
    isStandard: true,
    precedents: 0,
    notes: 'Standard bunker redelivery provision',
  },
  {
    title: 'Seaworthiness Clause',
    category: 'Vessel',
    text: `The Owners shall exercise due diligence to ensure that the Vessel is seaworthy and in every way fitted for the intended voyage at the commencement of the voyage and throughout the voyage. This includes ensuring the Vessel is properly manned, equipped, and supplied.`,
    charterPartyType: ['GENCON', 'NYPE', 'BALTIME'],
    tags: ['seaworthiness', 'vessel', 'condition', 'warranty'],
    isStandard: true,
    precedents: 0,
    notes: 'Fundamental warranty of vessel condition',
  },
  {
    title: 'Off-Hire Clause',
    category: 'Time Charter',
    text: `In the event of loss of time from deficiency of men or stores, breakdown of machinery, damage to hull or other accident, either hindering or preventing the working of the Vessel and continuing for more than 24 consecutive hours, the payment of hire shall cease for the time thereby lost.`,
    charterPartyType: ['NYPE', 'BALTIME'],
    tags: ['off-hire', 'time charter', 'breakdown'],
    isStandard: true,
    precedents: 0,
    notes: 'Standard off-hire provision for time charters',
  },
];

export class ClauseLibraryService {
  /**
   * Initialize clause library with standard clauses
   */
  async initializeStandardClauses(organizationId: string): Promise<number> {
    let count = 0;

    for (const clause of STANDARD_CLAUSES) {
      const existing = await prisma.clause?.findFirst({
        where: {
          organizationId,
          title: clause.title,
        },
      });

      if (!existing) {
        await prisma.clause?.create({
          data: {
            ...clause,
            organizationId,
          },
        });
        count++;
      }
    }

    return count;
  }

  /**
   * Search clauses by keyword
   */
  async searchClauses(params: {
    query: string;
    organizationId: string;
    category?: string;
    charterPartyType?: string;
    limit?: number;
  }): Promise<ClauseSearchResult[]> {
    const { query, organizationId, category, charterPartyType, limit = 10 } = params;

    const where: any = { organizationId };
    if (category) where.category = category;

    let clauses = await prisma.clause?.findMany({ where });

    if (!clauses || clauses.length === 0) {
      return [];
    }

    // Filter by charter party type if specified
    if (charterPartyType) {
      clauses = clauses.filter((c: any) =>
        c.charterPartyType?.includes(charterPartyType)
      );
    }

    // Score and rank clauses
    const results: ClauseSearchResult[] = clauses
      .map((clause: any) => {
        let score = 0;
        let matchReason = '';

        const queryLower = query.toLowerCase();

        // Title match (highest weight)
        if (clause.title.toLowerCase().includes(queryLower)) {
          score += 100;
          matchReason = 'Title match';
        }

        // Tag match (high weight)
        if (clause.tags?.some((tag: string) => tag.toLowerCase().includes(queryLower))) {
          score += 50;
          matchReason = matchReason || 'Tag match';
        }

        // Text content match (medium weight)
        if (clause.text.toLowerCase().includes(queryLower)) {
          score += 30;
          matchReason = matchReason || 'Content match';
        }

        // Precedent boost (more used = more relevant)
        score += Math.min(clause.precedents * 2, 20);

        // Standard clause boost
        if (clause.isStandard) {
          score += 10;
        }

        return {
          clause,
          relevanceScore: score,
          matchReason: matchReason || 'General relevance',
        };
      })
      .filter((r) => r.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    return results;
  }

  /**
   * Get clause recommendations based on charter party type and route
   */
  async getRecommendations(params: {
    charterPartyType: string;
    route?: string;
    cargoType?: string;
    season?: string;
    organizationId: string;
  }): Promise<Clause[]> {
    const { charterPartyType, route, cargoType, season, organizationId } = params;

    const clauses = await prisma.clause?.findMany({
      where: { organizationId },
    });

    if (!clauses || clauses.length === 0) {
      return [];
    }

    const recommended: Array<{ clause: any; score: number }> = [];

    clauses.forEach((clause: any) => {
      let score = 0;

      // Must match charter party type
      if (!clause.charterPartyType?.includes(charterPartyType)) {
        return;
      }

      score += 10; // Base score for matching C/P type

      // Route-specific recommendations
      if (route) {
        if (route.includes('Russia') || route.includes('Finland') || route.includes('Baltic')) {
          if (clause.tags?.includes('ice')) score += 50;
        }

        if (
          route.includes('Middle East') ||
          route.includes('Gulf') ||
          route.includes('Red Sea')
        ) {
          if (clause.tags?.includes('war')) score += 50;
        }

        if (route.includes('Panama') || route.includes('Suez')) {
          if (clause.title.includes('Canal')) score += 30;
        }
      }

      // Season-specific
      if (season === 'winter' && clause.tags?.includes('ice')) {
        score += 40;
      }

      // Cargo-specific
      if (cargoType) {
        if (cargoType.includes('grain') && clause.tags?.includes('grain')) {
          score += 30;
        }
        if (cargoType.includes('oil') && clause.tags?.includes('oil')) {
          score += 30;
        }
      }

      // Precedent boost
      score += Math.min(clause.precedents * 2, 20);

      // Standard clause boost
      if (clause.isStandard) score += 15;

      if (score > 10) {
        recommended.push({ clause, score });
      }
    });

    // Sort by score and return top 10
    return recommended
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((r) => r.clause);
  }

  /**
   * Add custom clause
   */
  async addClause(
    clause: Omit<Clause, 'id' | 'precedents' | 'lastUsed'>,
    organizationId: string
  ): Promise<string> {
    const created = await prisma.clause?.create({
      data: {
        ...clause,
        precedents: 0,
        organizationId,
      },
    });

    return created.id;
  }

  /**
   * Update clause
   */
  async updateClause(
    clauseId: string,
    updates: Partial<Clause>,
    organizationId: string
  ): Promise<void> {
    await prisma.clause?.update({
      where: {
        id: clauseId,
        organizationId, // Ensure tenant isolation
      },
      data: updates,
    });
  }

  /**
   * Mark clause as used (increment precedent count)
   */
  async markClauseUsed(clauseId: string, organizationId: string): Promise<void> {
    const clause = await prisma.clause?.findFirst({
      where: { id: clauseId, organizationId },
    });

    if (clause) {
      await prisma.clause?.update({
        where: { id: clauseId },
        data: {
          precedents: (clause.precedents || 0) + 1,
          lastUsed: new Date(),
        },
      });
    }
  }

  /**
   * Get clause by category
   */
  async getByCategory(
    category: string,
    organizationId: string
  ): Promise<Clause[]> {
    const clauses = await prisma.clause?.findMany({
      where: {
        category,
        organizationId,
      },
      orderBy: [{ isStandard: 'desc' }, { precedents: 'desc' }],
    });

    return clauses || [];
  }

  /**
   * Get all categories
   */
  async getCategories(organizationId: string): Promise<string[]> {
    const clauses = await prisma.clause?.findMany({
      where: { organizationId },
      select: { category: true },
      distinct: ['category'],
    });

    return clauses?.map((c: any) => c.category) || [];
  }

  /**
   * Get most used clauses
   */
  async getMostUsed(organizationId: string, limit: number = 10): Promise<Clause[]> {
    const clauses = await prisma.clause?.findMany({
      where: { organizationId },
      orderBy: { precedents: 'desc' },
      take: limit,
    });

    return clauses || [];
  }

  /**
   * Compare two clauses
   */
  compareClauses(clause1: Clause, clause2: Clause): {
    similarities: string[];
    differences: string[];
    recommendation: string;
  } {
    const similarities: string[] = [];
    const differences: string[] = [];

    // Category comparison
    if (clause1.category === clause2.category) {
      similarities.push(`Both are ${clause1.category} clauses`);
    } else {
      differences.push(
        `Different categories: ${clause1.category} vs ${clause2.category}`
      );
    }

    // Charter party type comparison
    const commonTypes = clause1.charterPartyType.filter((t) =>
      clause2.charterPartyType.includes(t)
    );
    if (commonTypes.length > 0) {
      similarities.push(`Compatible with: ${commonTypes.join(', ')}`);
    }

    // Tag comparison
    const commonTags = clause1.tags.filter((t) => clause2.tags.includes(t));
    if (commonTags.length > 0) {
      similarities.push(`Common tags: ${commonTags.join(', ')}`);
    }

    // Precedent comparison
    if (clause1.precedents > clause2.precedents) {
      differences.push(
        `${clause1.title} has been used more often (${clause1.precedents} vs ${clause2.precedents} times)`
      );
    } else if (clause2.precedents > clause1.precedents) {
      differences.push(
        `${clause2.title} has been used more often (${clause2.precedents} vs ${clause1.precedents} times)`
      );
    }

    // Generate recommendation
    let recommendation: string;
    if (clause1.isStandard && !clause2.isStandard) {
      recommendation = `Recommend ${clause1.title} (standard clause with proven track record)`;
    } else if (!clause1.isStandard && clause2.isStandard) {
      recommendation = `Recommend ${clause2.title} (standard clause with proven track record)`;
    } else if (clause1.precedents > clause2.precedents * 2) {
      recommendation = `Recommend ${clause1.title} (used ${clause1.precedents} times vs ${clause2.precedents})`;
    } else if (clause2.precedents > clause1.precedents * 2) {
      recommendation = `Recommend ${clause2.title} (used ${clause2.precedents} times vs ${clause1.precedents})`;
    } else {
      recommendation = 'Both clauses are suitable. Choose based on specific requirements.';
    }

    return {
      similarities,
      differences,
      recommendation,
    };
  }
}

export const clauseLibrary = new ClauseLibraryService();
