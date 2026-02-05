/**
 * Bunker Optimization GraphQL Schema
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { builder } from '../builder';
import { bunkerOptimizationService } from '../../services/analytics/bunker-optimization.service';

// ============================================================================
// Input Types
// ============================================================================

const BunkerOptimizationInputType = builder.inputType('BunkerOptimizationInput', {
  fields: (t) => ({
    vesselId: t.string({ required: true }),
    voyageId: t.string(),
    currentPosition: t.field({
      type: PositionInputType,
      required: true,
    }),
    destinationPort: t.string({ required: true }),
    remainingDistance: t.float({ required: true }),
    estimatedSpeed: t.float({ required: true }),
    currentROB: t.float({ required: true }),
    fuelType: t.string({ required: true }),
  }),
});

const PositionInputType = builder.inputType('PositionInput', {
  fields: (t) => ({
    lat: t.float({ required: true }),
    lon: t.float({ required: true }),
  }),
});

// ============================================================================
// Object Types
// ============================================================================

const BunkerPortType = builder.objectType('BunkerPort', {
  fields: (t) => ({
    portId: t.exposeString('portId'),
    portName: t.exposeString('portName'),
    unlocode: t.exposeString('unlocode'),
    location: t.expose('location', { type: LocationType }),
    distanceFromRoute: t.exposeFloat('distanceFromRoute'),
    deviationTime: t.exposeFloat('deviationTime'),
    deviationCost: t.exposeFloat('deviationCost'),
    fuelPrice: t.exposeFloat('fuelPrice'),
    availability: t.exposeBoolean('availability'),
    minQuantity: t.exposeFloat('minQuantity'),
    maxQuantity: t.exposeFloat('maxQuantity'),
    leadTime: t.exposeFloat('leadTime'),
    suppliers: t.exposeInt('suppliers'),
    reputationScore: t.exposeFloat('reputationScore'),
  }),
});

const LocationType = builder.objectType('Location', {
  fields: (t) => ({
    lat: t.exposeFloat('lat'),
    lon: t.exposeFloat('lon'),
  }),
});

const BunkerPlanType = builder.objectType('BunkerPlan', {
  fields: (t) => ({
    port: t.expose('port', { type: BunkerPortType }),
    quantity: t.exposeFloat('quantity'),
    cost: t.exposeFloat('cost'),
    timing: t.expose('timing', { type: 'Date' }),
    priority: t.exposeString('priority'),
  }),
});

const RiskType = builder.objectType('BunkerRisk', {
  fields: (t) => ({
    type: t.exposeString('type'),
    severity: t.exposeString('severity'),
    description: t.exposeString('description'),
    mitigation: t.exposeString('mitigation'),
  }),
});

const SpeedOptimizationType = builder.objectType('SpeedOptimization', {
  fields: (t) => ({
    recommendedSpeed: t.exposeFloat('recommendedSpeed'),
    currentSpeed: t.exposeFloat('currentSpeed'),
    fuelSavings: t.exposeFloat('fuelSavings'),
    costSavings: t.exposeFloat('costSavings'),
    timeImpact: t.exposeFloat('timeImpact'),
  }),
});

const OptimizationRecommendationType = builder.objectType('OptimizationRecommendation', {
  fields: (t) => ({
    strategy: t.exposeString('strategy'),
    totalCost: t.exposeFloat('totalCost'),
    savings: t.exposeFloat('savings'),
    savingsPercent: t.exposeFloat('savingsPercent'),
    confidence: t.exposeFloat('confidence'),
    bunkerPorts: t.expose('bunkerPorts', { type: [BunkerPlanType] }),
    risks: t.expose('risks', { type: [RiskType] }),
    speedOptimization: t.expose('speedOptimization', {
      type: SpeedOptimizationType,
      nullable: true,
    }),
  }),
});

const BunkerMarketDataType = builder.objectType('BunkerMarketData', {
  fields: (t) => ({
    portId: t.exposeString('portId'),
    fuelType: t.exposeString('fuelType'),
    price: t.exposeFloat('price'),
    date: t.expose('date', { type: 'Date' }),
    priceChange24h: t.exposeFloat('priceChange24h'),
    priceChange7d: t.exposeFloat('priceChange7d'),
    volatility: t.exposeFloat('volatility'),
    trend: t.exposeString('trend'),
  }),
});

const BunkerPriceForecastType = builder.objectType('BunkerPriceForecast', {
  fields: (t) => ({
    date: t.expose('date', { type: 'Date' }),
    predictedPrice: t.exposeFloat('predictedPrice'),
    confidence: t.exposeFloat('confidence'),
  }),
});

const BunkerCostComparisonType = builder.objectType('BunkerCostComparison', {
  fields: (t) => ({
    portId: t.exposeString('portId'),
    portName: t.exposeString('portName'),
    price: t.exposeFloat('price'),
    totalCost: t.exposeFloat('totalCost'),
    priceRank: t.exposeInt('priceRank'),
    qualityRating: t.exposeFloat('qualityRating'),
    availability: t.exposeBoolean('availability'),
  }),
});

// ============================================================================
// Queries
// ============================================================================

builder.queryField('optimizeBunkerProcurement', (t) =>
  t.field({
    type: OptimizationRecommendationType,
    args: {
      input: t.arg({ type: BunkerOptimizationInputType, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) throw new Error('Unauthorized');
      return bunkerOptimizationService.optimizeBunkerProcurement(
        args.input,
        ctx.user.organizationId
      );
    },
  })
);

builder.queryField('getBunkerPrices', (t) =>
  t.field({
    type: [BunkerMarketDataType],
    args: {
      portIds: t.stringList({ required: true }),
      fuelType: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) throw new Error('Unauthorized');
      return bunkerOptimizationService.getBunkerPrices(args.portIds, args.fuelType);
    },
  })
);

builder.queryField('forecastBunkerPrice', (t) =>
  t.field({
    type: [BunkerPriceForecastType],
    args: {
      portId: t.arg.string({ required: true }),
      fuelType: t.arg.string({ required: true }),
      daysAhead: t.arg.int({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) throw new Error('Unauthorized');
      return bunkerOptimizationService.forecastBunkerPrice(
        args.portId,
        args.fuelType,
        args.daysAhead
      );
    },
  })
);

builder.queryField('compareBunkerCosts', (t) =>
  t.field({
    type: [BunkerCostComparisonType],
    args: {
      portIds: t.stringList({ required: true }),
      fuelType: t.arg.string({ required: true }),
      quantity: t.arg.float({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) throw new Error('Unauthorized');
      return bunkerOptimizationService.compareBunkerCosts(
        args.portIds,
        args.fuelType,
        args.quantity
      );
    },
  })
);
