/**
 * Baltic Index GraphQL Schema
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { builder } from '../builder';
import { balticIndexService } from '../../services/analytics/baltic-index.service';

// ============================================================================
// Enums
// ============================================================================

const BalticIndexTypeEnum = builder.enumType('BalticIndexType', {
  values: ['BDI', 'BCI', 'BPI', 'BSI', 'BHSI'] as const,
});

const MarketSentimentEnum = builder.enumType('MarketSentiment', {
  values: ['STRONG_BULL', 'BULL', 'NEUTRAL', 'BEAR', 'STRONG_BEAR'] as const,
});

const TrendEnum = builder.enumType('Trend', {
  values: ['UP', 'DOWN', 'FLAT', 'BULLISH', 'BEARISH', 'SIDEWAYS'] as const,
});

const VolatilityEnum = builder.enumType('Volatility', {
  values: ['LOW', 'MEDIUM', 'HIGH'] as const,
});

const SeasonalityEnum = builder.enumType('Seasonality', {
  values: ['FAVORABLE', 'UNFAVORABLE', 'NEUTRAL'] as const,
});

const SignalTypeEnum = builder.enumType('SignalType', {
  values: ['BUY', 'SELL', 'HOLD'] as const,
});

const SignalStrengthEnum = builder.enumType('SignalStrength', {
  values: ['STRONG', 'WEAK'] as const,
});

const RouteRecommendationEnum = builder.enumType('RouteRecommendation', {
  values: ['FAVORABLE', 'UNFAVORABLE', 'NEUTRAL'] as const,
});

// ============================================================================
// Object Types
// ============================================================================

const BalticIndexDataType = builder.objectType('BalticIndexData', {
  fields: (t) => ({
    indexType: t.expose('indexType', { type: BalticIndexTypeEnum }),
    date: t.expose('date', { type: 'Date' }),
    value: t.exposeFloat('value'),
    change: t.exposeFloat('change'),
    changePercent: t.exposeFloat('changePercent'),
    high52Week: t.exposeFloat('high52Week'),
    low52Week: t.exposeFloat('low52Week'),
    average52Week: t.exposeFloat('average52Week'),
  }),
});

const IndexDataPointType = builder.objectType('IndexDataPoint', {
  fields: (t) => ({
    date: t.expose('date', { type: 'Date' }),
    value: t.exposeFloat('value'),
  }),
});

const IndexStatsType = builder.objectType('IndexStats', {
  fields: (t) => ({
    min: t.exposeFloat('min'),
    max: t.exposeFloat('max'),
    average: t.exposeFloat('average'),
    volatility: t.exposeFloat('volatility'),
    trend: t.exposeString('trend'),
  }),
});

const IndexHistoricalDataType = builder.objectType('IndexHistoricalData', {
  fields: (t) => ({
    indexType: t.expose('indexType', { type: BalticIndexTypeEnum }),
    data: t.expose('data', { type: [IndexDataPointType] }),
    stats: t.expose('stats', { type: IndexStatsType }),
  }),
});

const MarketIndicatorsType = builder.objectType('MarketIndicators', {
  fields: (t) => ({
    bdiTrend: t.exposeString('bdiTrend'),
    volatility: t.exposeString('volatility'),
    momentum: t.exposeFloat('momentum'),
    seasonality: t.exposeString('seasonality'),
  }),
});

const MarketSignalType = builder.objectType('MarketSignal', {
  fields: (t) => ({
    type: t.exposeString('type'),
    strength: t.exposeString('strength'),
    reason: t.exposeString('reason'),
  }),
});

const MarketSentimentType = builder.objectType('MarketSentimentData', {
  fields: (t) => ({
    overall: t.exposeString('overall'),
    score: t.exposeFloat('score'),
    indicators: t.expose('indicators', { type: MarketIndicatorsType }),
    signals: t.expose('signals', { type: [MarketSignalType] }),
  }),
});

const RouteComparisonType = builder.objectType('RouteComparison', {
  fields: (t) => ({
    routeName: t.exposeString('routeName'),
    indexType: t.expose('indexType', { type: BalticIndexTypeEnum }),
    currentRate: t.exposeFloat('currentRate'),
    historicalAverage: t.exposeFloat('historicalAverage'),
    deviation: t.exposeFloat('deviation'),
    recommendation: t.exposeString('recommendation'),
  }),
});

const IndexCorrelationType = builder.objectType('IndexCorrelation', {
  fields: (t) => ({
    index1: t.exposeString('index1'),
    index2: t.exposeString('index2'),
    correlation: t.exposeFloat('correlation'),
  }),
});

// ============================================================================
// Queries
// ============================================================================

builder.queryField('getCurrentBalticIndices', (t) =>
  t.field({
    type: [BalticIndexDataType],
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) throw new Error('Unauthorized');
      return balticIndexService.getCurrentIndices();
    },
  })
);

builder.queryField('getBalticIndexHistory', (t) =>
  t.field({
    type: IndexHistoricalDataType,
    args: {
      indexType: t.arg({ type: BalticIndexTypeEnum, required: true }),
      days: t.arg.int({ defaultValue: 365 }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) throw new Error('Unauthorized');
      return balticIndexService.getHistoricalData(args.indexType, args.days);
    },
  })
);

builder.queryField('analyzeMarketSentiment', (t) =>
  t.field({
    type: MarketSentimentType,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) throw new Error('Unauthorized');
      return balticIndexService.analyzeMarketSentiment();
    },
  })
);

builder.queryField('compareRoutesToIndices', (t) =>
  t.field({
    type: [RouteComparisonType],
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) throw new Error('Unauthorized');
      return balticIndexService.compareRoutesToIndices();
    },
  })
);

builder.queryField('getIndexCorrelations', (t) =>
  t.field({
    type: 'JSON',
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) throw new Error('Unauthorized');
      return balticIndexService.getIndexCorrelations();
    },
  })
);

// ============================================================================
// Mutations
// ============================================================================

builder.mutationField('seedBalticData', (t) =>
  t.field({
    type: 'Boolean',
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) throw new Error('Unauthorized');
      await balticIndexService.seedBalticData();
      return true;
    },
  })
);
