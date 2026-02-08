/**
 * VOYAGE COST ESTIMATOR
 * Calculate voyage costs from journey data (fuel, ports, total P&L)
 */

import { builder } from '../builder.js';
import { VoyageCostEstimatorService } from '../../services/voyage-cost-estimator.service.js';

// Position type (reuse from vessel-journey)
const CostPosition = builder.objectRef<{ lat: number; lon: number }>('CostPosition').implement({
  fields: (t) => ({
    lat: t.exposeFloat('lat'),
    lon: t.exposeFloat('lon'),
  }),
});

// Cost breakdown details
const CostBreakdown = builder.objectRef<{
  bunker: {
    seaIfo: number;
    portIfo: number;
    mgo: number;
  };
  ports: number;
  canals: number;
}>('CostBreakdown').implement({
  fields: (t) => ({
    bunkerSeaIfo: t.float({
      resolve: (parent) => parent.bunker.seaIfo,
    }),
    bunkerPortIfo: t.float({
      resolve: (parent) => parent.bunker.portIfo,
    }),
    bunkerMgo: t.float({
      resolve: (parent) => parent.bunker.mgo,
    }),
    ports: t.exposeFloat('ports'),
    canals: t.exposeFloat('canals'),
  }),
});

// Voyage cost estimate
const VoyageCostEstimate = builder.objectRef<{
  journeyId: string;
  vessel: { mmsi: string; name: string | null; type: string; dwt: number | null };
  totalDistanceNm: number;
  totalDurationHrs: number;
  seaDaysAtSpeed: number;
  portDays: number;
  bunkerCostUsd: number;
  portCostsUsd: number;
  canalFeesUsd: number;
  totalCostsUsd: number;
  breakdown: any;
}>('VoyageCostEstimate').implement({
  fields: (t) => ({
    journeyId: t.exposeString('journeyId'),
    vesselMmsi: t.string({
      resolve: (parent) => parent.vessel.mmsi,
    }),
    vesselName: t.string({
      nullable: true,
      resolve: (parent) => parent.vessel.name,
    }),
    vesselType: t.string({
      resolve: (parent) => parent.vessel.type,
    }),
    vesselDwt: t.float({
      nullable: true,
      resolve: (parent) => parent.vessel.dwt || null,
    }),
    totalDistanceNm: t.exposeFloat('totalDistanceNm'),
    totalDurationHrs: t.exposeFloat('totalDurationHrs'),
    seaDaysAtSpeed: t.exposeFloat('seaDaysAtSpeed'),
    portDays: t.exposeFloat('portDays'),
    bunkerCostUsd: t.exposeFloat('bunkerCostUsd'),
    portCostsUsd: t.exposeFloat('portCostsUsd'),
    canalFeesUsd: t.exposeFloat('canalFeesUsd'),
    totalCostsUsd: t.exposeFloat('totalCostsUsd'),
    costPerNm: t.float({
      resolve: (parent) =>
        parent.totalDistanceNm > 0 ? parent.totalCostsUsd / parent.totalDistanceNm : 0,
    }),
    costPerDay: t.float({
      resolve: (parent) => {
        const totalDays = parent.totalDurationHrs / 24;
        return totalDays > 0 ? parent.totalCostsUsd / totalDays : 0;
      },
    }),
    breakdown: t.field({
      type: CostBreakdown,
      resolve: (parent) => parent.breakdown,
    }),
  }),
});

/**
 * Estimate voyage cost from journey data
 */
builder.queryField('estimateVoyageCost', (t) =>
  t.field({
    type: VoyageCostEstimate,
    nullable: true,
    description: 'Calculate voyage costs from journey data (fuel, ports, total P&L)',
    args: {
      mmsi: t.arg.string({ required: true }),
      daysBack: t.arg.int({ defaultValue: 30 }),
      bunkerPriceIfo: t.arg.float({ defaultValue: 450 }), // USD/MT
      bunkerPriceMgo: t.arg.float({ defaultValue: 850 }), // USD/MT
    },
    resolve: async (_root, args) => {
      const estimator = new VoyageCostEstimatorService();
      return await estimator.estimateFromJourney(args.mmsi, args.daysBack, {
        bunkerPriceIfo: args.bunkerPriceIfo,
        bunkerPriceMgo: args.bunkerPriceMgo,
      });
    },
  })
);
