import { builder } from '../builder.js';

// === Voyage P&L Report ===

const VoyagePnLLineItem = builder.objectRef<{
  category: string;
  description: string;
  amount: number;
  currency: string;
}>('VoyagePnLLineItem');

VoyagePnLLineItem.implement({
  fields: (t) => ({
    category: t.exposeString('category'),
    description: t.exposeString('description'),
    amount: t.exposeFloat('amount'),
    currency: t.exposeString('currency'),
  }),
});

const VoyagePnL = builder.objectRef<{
  voyageId: string;
  voyageNumber: string;
  vesselName: string;
  status: string;
  revenue: number;
  daCosts: number;
  demurrage: number;
  despatch: number;
  netResult: number;
  currency: string;
  revenueItems: { category: string; description: string; amount: number; currency: string }[];
  costItems: { category: string; description: string; amount: number; currency: string }[];
}>('VoyagePnL');

VoyagePnL.implement({
  fields: (t) => ({
    voyageId: t.exposeString('voyageId'),
    voyageNumber: t.exposeString('voyageNumber'),
    vesselName: t.exposeString('vesselName'),
    status: t.exposeString('status'),
    revenue: t.exposeFloat('revenue'),
    daCosts: t.exposeFloat('daCosts'),
    demurrage: t.exposeFloat('demurrage'),
    despatch: t.exposeFloat('despatch'),
    netResult: t.exposeFloat('netResult'),
    currency: t.exposeString('currency'),
    revenueItems: t.field({
      type: [VoyagePnLLineItem],
      resolve: (parent) => parent.revenueItems,
    }),
    costItems: t.field({
      type: [VoyagePnLLineItem],
      resolve: (parent) => parent.costItems,
    }),
  }),
});

const FleetSummary = builder.objectRef<{
  totalVoyages: number;
  completedVoyages: number;
  activeVoyages: number;
  totalRevenue: number;
  totalCosts: number;
  totalDemurrage: number;
  totalDespatch: number;
  netProfit: number;
  currency: string;
}>('FleetSummary');

FleetSummary.implement({
  fields: (t) => ({
    totalVoyages: t.exposeInt('totalVoyages'),
    completedVoyages: t.exposeInt('completedVoyages'),
    activeVoyages: t.exposeInt('activeVoyages'),
    totalRevenue: t.exposeFloat('totalRevenue'),
    totalCosts: t.exposeFloat('totalCosts'),
    totalDemurrage: t.exposeFloat('totalDemurrage'),
    totalDespatch: t.exposeFloat('totalDespatch'),
    netProfit: t.exposeFloat('netProfit'),
    currency: t.exposeString('currency'),
  }),
});

builder.queryField('voyagePnL', (t) =>
  t.field({
    type: VoyagePnL,
    nullable: true,
    args: { voyageId: t.arg.string({ required: true }) },
    resolve: async (_root, args, ctx) => {
      const voyage = await ctx.prisma.voyage.findUnique({
        where: { id: args.voyageId },
        include: {
          vessel: true,
          charter: true,
          cargo: true,
          disbursementAccounts: { include: { lineItems: true } },
          laytimeCalculations: true,
        },
      });
      if (!voyage) return null;

      // Revenue: lumpsum or freight rate * cargo quantity
      let revenue = 0;
      const revenueItems: { category: string; description: string; amount: number; currency: string }[] = [];
      if (voyage.charter?.freightRate && voyage.charter.freightUnit === 'lumpsum') {
        revenue = voyage.charter.freightRate;
        revenueItems.push({
          category: 'freight',
          description: `Lumpsum freight`,
          amount: voyage.charter.freightRate,
          currency: voyage.charter.currency,
        });
      } else if (voyage.charter?.freightRate && voyage.cargo?.quantity) {
        const freightRevenue = voyage.charter.freightRate * voyage.cargo.quantity;
        revenue = freightRevenue;
        revenueItems.push({
          category: 'freight',
          description: `${voyage.cargo.commodity} - ${voyage.cargo.quantity} MT @ ${voyage.charter.freightRate}/${voyage.charter.freightUnit ?? 'MT'}`,
          amount: freightRevenue,
          currency: voyage.charter.currency,
        });
      }

      // Costs: DA line items
      let daCosts = 0;
      const costItems: { category: string; description: string; amount: number; currency: string }[] = [];
      for (const da of voyage.disbursementAccounts) {
        for (const item of da.lineItems) {
          daCosts += item.amount;
          costItems.push({
            category: item.category,
            description: item.description,
            amount: item.amount,
            currency: item.currency,
          });
        }
      }

      // Laytime: demurrage (+) and despatch (-)
      let demurrage = 0;
      let despatch = 0;
      for (const lt of voyage.laytimeCalculations) {
        if (lt.result === 'on_demurrage' && lt.amountDue > 0) {
          demurrage += lt.amountDue;
          costItems.push({
            category: 'demurrage',
            description: `${lt.type} demurrage`,
            amount: lt.amountDue,
            currency: lt.currency,
          });
        } else if (lt.result === 'on_despatch' && lt.amountDue < 0) {
          despatch += Math.abs(lt.amountDue);
          revenueItems.push({
            category: 'despatch',
            description: `${lt.type} despatch earned`,
            amount: Math.abs(lt.amountDue),
            currency: lt.currency,
          });
        }
      }

      const netResult = revenue + despatch - daCosts - demurrage;

      return {
        voyageId: voyage.id,
        voyageNumber: voyage.voyageNumber,
        vesselName: voyage.vessel.name,
        status: voyage.status,
        revenue,
        daCosts,
        demurrage,
        despatch,
        netResult,
        currency: voyage.charter?.currency ?? 'USD',
        revenueItems,
        costItems,
      };
    },
  }),
);

builder.queryField('fleetSummary', (t) =>
  t.field({
    type: FleetSummary,
    resolve: async (_root, _args, ctx) => {
      const orgId = ctx.user?.organizationId;
      const voyages = await ctx.prisma.voyage.findMany({
        where: orgId ? { vessel: { organizationId: orgId } } : {},
        include: {
          charter: true,
          cargo: true,
          disbursementAccounts: { include: { lineItems: true } },
          laytimeCalculations: true,
        },
      });

      let totalRevenue = 0;
      let totalCosts = 0;
      let totalDemurrage = 0;
      let totalDespatch = 0;
      let completedVoyages = 0;
      let activeVoyages = 0;

      for (const v of voyages) {
        if (v.status === 'completed') completedVoyages++;
        if (v.status === 'in_progress') activeVoyages++;

        // Revenue
        if (v.charter?.freightRate && v.charter.freightUnit === 'lumpsum') {
          totalRevenue += v.charter.freightRate;
        } else if (v.charter?.freightRate && v.cargo?.quantity) {
          totalRevenue += v.charter.freightRate * v.cargo.quantity;
        }

        // DA costs
        for (const da of v.disbursementAccounts) {
          for (const item of da.lineItems) {
            totalCosts += item.amount;
          }
        }

        // Laytime
        for (const lt of v.laytimeCalculations) {
          if (lt.result === 'on_demurrage' && lt.amountDue > 0) totalDemurrage += lt.amountDue;
          if (lt.result === 'on_despatch' && lt.amountDue < 0) totalDespatch += Math.abs(lt.amountDue);
        }
      }

      return {
        totalVoyages: voyages.length,
        completedVoyages,
        activeVoyages,
        totalRevenue,
        totalCosts,
        totalDemurrage,
        totalDespatch,
        netProfit: totalRevenue + totalDespatch - totalCosts - totalDemurrage,
        currency: 'USD',
      };
    },
  }),
);
