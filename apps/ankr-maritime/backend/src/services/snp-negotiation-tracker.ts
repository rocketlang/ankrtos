/**
 * SNP Price Negotiation Tracker Service
 * Tracks price negotiation history and counter-offers for S&P transactions
 *
 * @module services/snp-negotiation-tracker
 */

import { prisma } from '../schema/context.js';

export interface NegotiationOffer {
  id: string;
  transactionId: string;
  offerNumber: number;
  offerType: 'initial' | 'counter' | 'final' | 'best_and_final';
  offeredBy: 'seller' | 'buyer';
  offeredByName: string;
  offeredByUserId: string;

  // Price terms
  price: number;
  currency: string;
  depositPercentage: number;
  paymentTerms: string;

  // Non-price terms
  deliveryPort?: string;
  deliveryWindow?: {
    earliest: Date;
    latest: Date;
  };
  inspectionPeriod?: number; // days
  subjects?: string[]; // Subject to finance, inspection, etc.

  // Negotiation
  previousOfferId?: string;
  changeFromPrevious?: number; // Price change
  changePercentage?: number;
  justification?: string;
  validUntil: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired';

  // Metadata
  notes?: string;
  attachments?: string[];
  createdAt: Date;
  respondedAt?: Date;
}

export interface NegotiationTimeline {
  transactionId: string;
  vesselName: string;
  currentStatus: string;
  totalOffers: number;
  negotiationDuration: number; // days
  priceMovement: {
    initialOffer: number;
    currentOffer: number;
    totalChange: number;
    changePercentage: number;
  };
  offers: NegotiationOffer[];
  analytics: {
    averageResponseTime: number; // hours
    buyerConcessions: number;
    sellerConcessions: number;
    convergenceRate: number; // How fast they're meeting
  };
}

class SNPNegotiationTrackerService {
  /**
   * Create initial offer
   */
  async createInitialOffer(
    transactionId: string,
    offer: Omit<NegotiationOffer, 'id' | 'offerNumber' | 'createdAt' | 'status'>,
    organizationId: string
  ): Promise<NegotiationOffer> {
    // Validate transaction
    const transaction = await prisma.sNPTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error('S&P transaction not found');
    }

    const initialOffer: NegotiationOffer = {
      ...offer,
      id: `OFFER-${Date.now()}`,
      offerNumber: 1,
      offerType: 'initial',
      status: 'pending',
      createdAt: new Date(),
    };

    // Store in database (would use NegotiationOffer model)
    // await prisma.negotiationOffer.create({ data: initialOffer });

    // Send notification to other party
    // await this.notifyCounterparty(initialOffer);

    return initialOffer;
  }

  /**
   * Submit counter-offer
   */
  async submitCounterOffer(
    previousOfferId: string,
    counterOffer: {
      price: number;
      currency: string;
      depositPercentage?: number;
      paymentTerms?: string;
      deliveryPort?: string;
      deliveryWindow?: { earliest: Date; latest: Date };
      justification?: string;
      validUntil: Date;
      offeredBy: 'seller' | 'buyer';
      offeredByName: string;
      offeredByUserId: string;
    },
    organizationId: string
  ): Promise<NegotiationOffer> {
    // Get previous offer
    // const previousOffer = await prisma.negotiationOffer.findUnique({ where: { id: previousOfferId } });

    // Mock previous offer for now
    const previousOffer: NegotiationOffer = {
      id: previousOfferId,
      transactionId: '',
      offerNumber: 1,
      offerType: 'initial',
      offeredBy: 'seller',
      offeredByName: '',
      offeredByUserId: '',
      price: 15000000,
      currency: 'USD',
      depositPercentage: 10,
      paymentTerms: 'Standard',
      validUntil: new Date(),
      status: 'pending',
      createdAt: new Date(),
    };

    // Calculate changes
    const priceChange = counterOffer.price - previousOffer.price;
    const changePercentage = (priceChange / previousOffer.price) * 100;

    const newOffer: NegotiationOffer = {
      id: `OFFER-${Date.now()}`,
      transactionId: previousOffer.transactionId,
      offerNumber: previousOffer.offerNumber + 1,
      offerType:
        counterOffer.justification?.toLowerCase().includes('final')
          ? 'best_and_final'
          : 'counter',
      offeredBy: counterOffer.offeredBy,
      offeredByName: counterOffer.offeredByName,
      offeredByUserId: counterOffer.offeredByUserId,
      price: counterOffer.price,
      currency: counterOffer.currency,
      depositPercentage:
        counterOffer.depositPercentage || previousOffer.depositPercentage,
      paymentTerms: counterOffer.paymentTerms || previousOffer.paymentTerms,
      deliveryPort: counterOffer.deliveryPort || previousOffer.deliveryPort,
      deliveryWindow: counterOffer.deliveryWindow || previousOffer.deliveryWindow,
      previousOfferId,
      changeFromPrevious: priceChange,
      changePercentage,
      justification: counterOffer.justification,
      validUntil: counterOffer.validUntil,
      status: 'pending',
      createdAt: new Date(),
    };

    // Mark previous offer as countered
    // await prisma.negotiationOffer.update({
    //   where: { id: previousOfferId },
    //   data: { status: 'countered', respondedAt: new Date() }
    // });

    // Send notification
    // await this.notifyCounterparty(newOffer);

    return newOffer;
  }

  /**
   * Accept offer
   */
  async acceptOffer(
    offerId: string,
    acceptedBy: string,
    organizationId: string
  ): Promise<{ success: boolean; message: string }> {
    // Update offer status
    // await prisma.negotiationOffer.update({
    //   where: { id: offerId },
    //   data: { status: 'accepted', respondedAt: new Date() }
    // });

    // Update transaction status
    // await prisma.sNPTransaction.update({
    //   where: { id: offer.transactionId },
    //   data: { status: 'subjects_pending', agreedPrice: offer.price }
    // });

    // Send congratulations email to both parties
    // await this.sendAcceptanceNotification(offer);

    return {
      success: true,
      message: 'Offer accepted. Proceeding to subjects clearance phase.',
    };
  }

  /**
   * Reject offer
   */
  async rejectOffer(
    offerId: string,
    reason: string,
    rejectedBy: string,
    organizationId: string
  ): Promise<{ success: boolean; message: string }> {
    // Update offer status
    // await prisma.negotiationOffer.update({
    //   where: { id: offerId },
    //   data: { status: 'rejected', respondedAt: new Date(), notes: reason }
    // });

    return {
      success: true,
      message: 'Offer rejected.',
    };
  }

  /**
   * Get negotiation timeline
   */
  async getNegotiationTimeline(
    transactionId: string,
    organizationId: string
  ): Promise<NegotiationTimeline> {
    // Get all offers for transaction
    // const offers = await prisma.negotiationOffer.findMany({
    //   where: { transactionId },
    //   orderBy: { offerNumber: 'asc' }
    // });

    // Mock offers for now
    const offers: NegotiationOffer[] = [
      {
        id: 'OFFER-1',
        transactionId,
        offerNumber: 1,
        offerType: 'initial',
        offeredBy: 'seller',
        offeredByName: 'Global Shipping Inc.',
        offeredByUserId: 'user-1',
        price: 15000000,
        currency: 'USD',
        depositPercentage: 10,
        paymentTerms: 'Standard terms',
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'countered',
        createdAt: new Date('2026-01-15'),
        respondedAt: new Date('2026-01-17'),
      },
      {
        id: 'OFFER-2',
        transactionId,
        offerNumber: 2,
        offerType: 'counter',
        offeredBy: 'buyer',
        offeredByName: 'Ocean Bulk Carriers',
        offeredByUserId: 'user-2',
        price: 13500000,
        currency: 'USD',
        depositPercentage: 10,
        paymentTerms: 'Standard terms',
        previousOfferId: 'OFFER-1',
        changeFromPrevious: -1500000,
        changePercentage: -10,
        justification: 'Comparable sales indicate lower market value',
        validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'countered',
        createdAt: new Date('2026-01-17'),
        respondedAt: new Date('2026-01-19'),
      },
      {
        id: 'OFFER-3',
        transactionId,
        offerNumber: 3,
        offerType: 'counter',
        offeredBy: 'seller',
        offeredByName: 'Global Shipping Inc.',
        offeredByUserId: 'user-1',
        price: 14500000,
        currency: 'USD',
        depositPercentage: 10,
        paymentTerms: 'Standard terms',
        previousOfferId: 'OFFER-2',
        changeFromPrevious: 1000000,
        changePercentage: 7.4,
        justification: 'Vessel recently dry-docked, class renewed',
        validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'pending',
        createdAt: new Date('2026-01-19'),
      },
    ];

    const initialOffer = offers[0];
    const currentOffer = offers[offers.length - 1];
    const priceChange = currentOffer.price - initialOffer.price;
    const changePercentage = (priceChange / initialOffer.price) * 100;

    // Calculate analytics
    const responseTimes = offers
      .filter((o) => o.respondedAt)
      .map(
        (o) =>
          (o.respondedAt!.getTime() - o.createdAt.getTime()) /
          (1000 * 60 * 60)
      );
    const avgResponseTime =
      responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;

    const buyerOffers = offers.filter((o) => o.offeredBy === 'buyer');
    const sellerOffers = offers.filter((o) => o.offeredBy === 'seller');

    const buyerConcessions =
      buyerOffers.length > 1
        ? buyerOffers[buyerOffers.length - 1].price - buyerOffers[0].price
        : 0;

    const sellerConcessions =
      sellerOffers.length > 1
        ? sellerOffers[0].price - sellerOffers[sellerOffers.length - 1].price
        : 0;

    const convergenceRate =
      offers.length > 2
        ? Math.abs(offers[offers.length - 1].changeFromPrevious || 0) /
          Math.abs(offers[1].changeFromPrevious || 1)
        : 0;

    const negotiationDuration =
      (currentOffer.createdAt.getTime() - initialOffer.createdAt.getTime()) /
      (1000 * 60 * 60 * 24);

    return {
      transactionId,
      vesselName: 'MV Example', // Would get from transaction
      currentStatus: currentOffer.status,
      totalOffers: offers.length,
      negotiationDuration,
      priceMovement: {
        initialOffer: initialOffer.price,
        currentOffer: currentOffer.price,
        totalChange: priceChange,
        changePercentage,
      },
      offers,
      analytics: {
        averageResponseTime: avgResponseTime,
        buyerConcessions,
        sellerConcessions,
        convergenceRate,
      },
    };
  }

  /**
   * Generate negotiation report
   */
  async generateNegotiationReport(
    transactionId: string,
    organizationId: string
  ): Promise<string> {
    const timeline = await this.getNegotiationTimeline(
      transactionId,
      organizationId
    );

    return `
# Negotiation Report - ${timeline.vesselName}

## Summary
- **Total Offers:** ${timeline.totalOffers}
- **Duration:** ${timeline.negotiationDuration.toFixed(1)} days
- **Status:** ${timeline.currentStatus}

## Price Movement
- **Initial Offer:** ${timeline.priceMovement.initialOffer.toLocaleString()} USD
- **Current Offer:** ${timeline.priceMovement.currentOffer.toLocaleString()} USD
- **Change:** ${timeline.priceMovement.totalChange.toLocaleString()} USD (${timeline.priceMovement.changePercentage.toFixed(2)}%)

## Analytics
- **Average Response Time:** ${timeline.analytics.averageResponseTime.toFixed(1)} hours
- **Buyer Concessions:** ${timeline.analytics.buyerConcessions.toLocaleString()} USD
- **Seller Concessions:** ${timeline.analytics.sellerConcessions.toLocaleString()} USD
- **Convergence Rate:** ${(timeline.analytics.convergenceRate * 100).toFixed(1)}%

## Offer History
${timeline.offers
  .map(
    (o) => `
### Offer #${o.offerNumber} - ${o.offerType.toUpperCase()}
- **By:** ${o.offeredByName} (${o.offeredBy})
- **Price:** ${o.price.toLocaleString()} ${o.currency}
- **Change:** ${o.changeFromPrevious ? o.changeFromPrevious.toLocaleString() : 'N/A'} (${o.changePercentage?.toFixed(2) || 'N/A'}%)
- **Status:** ${o.status}
- **Date:** ${o.createdAt.toLocaleDateString()}
${o.justification ? `- **Justification:** ${o.justification}` : ''}
`
  )
  .join('\n')}

## Recommendation
${this.generateRecommendation(timeline)}
    `.trim();
  }

  private generateRecommendation(timeline: NegotiationTimeline): string {
    const gap =
      Math.abs(timeline.priceMovement.totalChange) /
      timeline.priceMovement.initialOffer;

    if (gap < 0.05) {
      return 'Parties are very close to agreement (< 5% gap). Recommend splitting the difference to close the deal.';
    } else if (gap < 0.1) {
      return 'Negotiation is progressing well (< 10% gap). One more round of offers should close the deal.';
    } else if (gap < 0.2) {
      return 'Significant gap remains (10-20%). Both parties need to make concessions. Consider bringing in brokers to mediate.';
    } else {
      return 'Large gap remains (> 20%). May need to revisit valuation assumptions or consider walking away.';
    }
  }
}

export const snpNegotiationTrackerService = new SNPNegotiationTrackerService();
