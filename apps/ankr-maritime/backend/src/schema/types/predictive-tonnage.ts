/**
 * Predictive Tonnage Intelligence GraphQL Schema
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { builder } from '../builder';
import { predictiveTonnageService } from '../../services/intelligence/predictive-tonnage.service';

// ============================================================================
// Object Types
// ============================================================================

const CurrentPositionType = builder.objectType('CurrentPosition', {
  fields: (t) => ({
    lat: t.exposeFloat('lat'),
    lon: t.exposeFloat('lon'),
    timestamp: t.expose('timestamp', { type: 'Date' }),
  }),
});

const PredictedOpenVesselType = builder.objectType('PredictedOpenVessel', {
  fields: (t) => ({
    vesselId: t.exposeString('vesselId'),
    vesselName: t.exposeString('vesselName'),
    imo: t.exposeString('imo'),
    type: t.exposeString('type'),
    dwt: t.exposeFloat('dwt'),
    built: t.exposeInt('built'),
    flag: t.exposeString('flag'),
    geared: t.exposeBoolean('geared'),
    currentVoyageId: t.exposeString('currentVoyageId', { nullable: true }),
    currentStatus: t.exposeString('currentStatus'),
    currentPosition: t.expose('currentPosition', { type: CurrentPositionType }),
    currentPort: t.exposeString('currentPort', { nullable: true }),
    destinationPort: t.exposeString('destinationPort'),
    predictedArrivalDate: t.expose('predictedArrivalDate', { type: 'Date' }),
    predictedDischargeComplete: t.expose('predictedDischargeComplete', { type: 'Date' }),
    predictedOpenDate: t.expose('predictedOpenDate', { type: 'Date' }),
    predictedOpenPort: t.exposeString('predictedOpenPort'),
    predictedOpenRegion: t.exposeString('predictedOpenRegion'),
    daysUntilOpen: t.exposeInt('daysUntilOpen'),
    confidence: t.exposeFloat('confidence'),
    predictionMethod: t.exposeString('predictionMethod'),
    lastCargo: t.exposeString('lastCargo', { nullable: true }),
    lastLoadPort: t.exposeString('lastLoadPort', { nullable: true }),
    lastDischargePort: t.exposeString('lastDischargePort', { nullable: true }),
    ownerName: t.exposeString('ownerName'),
    brokerName: t.exposeString('brokerName', { nullable: true }),
    brokerContact: t.exposeString('brokerContact', { nullable: true }),
  }),
});

const RegionalTonnageReportType = builder.objectType('RegionalTonnageReport', {
  fields: (t) => ({
    region: t.exposeString('region'),
    reportDate: t.expose('reportDate', { type: 'Date' }),
    totalVessels: t.exposeInt('totalVessels'),
    openNow: t.expose('openNow', { type: [PredictedOpenVesselType] }),
    opening1_7Days: t.expose('opening1_7Days', { type: [PredictedOpenVesselType] }),
    opening8_14Days: t.expose('opening8_14Days', { type: [PredictedOpenVesselType] }),
    opening15_30Days: t.expose('opening15_30Days', { type: [PredictedOpenVesselType] }),
    opening31_60Days: t.expose('opening31_60Days', { type: [PredictedOpenVesselType] }),
    byType: t.expose('byType', { type: 'JSON' }),
    avgDWT: t.exposeFloat('avgDWT'),
    avgAge: t.exposeFloat('avgAge'),
    gearPercentage: t.exposeFloat('gearPercentage'),
    insights: t.exposeStringList('insights'),
  }),
});

const EmergingOpportunityType = builder.objectType('EmergingOpportunity', {
  fields: (t) => ({
    region: t.exposeString('region'),
    vesselCount: t.exposeInt('vesselCount'),
    avgDaysUntilOpen: t.exposeFloat('avgDaysUntilOpen'),
    reason: t.exposeString('reason'),
  }),
});

const SupplyTrendType = builder.objectType('SupplyTrend', {
  fields: (t) => ({
    region: t.exposeString('region'),
    trend: t.exposeString('trend'),
    changePercent: t.exposeFloat('changePercent'),
  }),
});

const PremiumIntelligenceReportType = builder.objectType('PremiumIntelligenceReport', {
  fields: (t) => ({
    title: t.exposeString('title'),
    reportDate: t.expose('reportDate', { type: 'Date' }),
    regions: t.expose('regions', { type: [RegionalTonnageReportType] }),
    tightestRegions: t.exposeStringList('tightestRegions'),
    looseRegions: t.exposeStringList('looseRegions'),
    emergingOpportunities: t.expose('emergingOpportunities', {
      type: [EmergingOpportunityType],
    }),
    supplyTrends: t.expose('supplyTrends', { type: [SupplyTrendType] }),
  }),
});

// ============================================================================
// Queries
// ============================================================================

builder.queryField('getRegionalTonnageReport', (t) =>
  t.field({
    type: RegionalTonnageReportType,
    args: {
      region: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) throw new Error('Unauthorized');
      return predictiveTonnageService.generateRegionalReport(
        args.region,
        ctx.user.organizationId
      );
    },
  })
);

builder.queryField('getPremiumIntelligenceReport', (t) =>
  t.field({
    type: PremiumIntelligenceReportType,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) throw new Error('Unauthorized');

      // Check if user has premium access
      // In production: verify subscription tier
      // if (ctx.user.organization.tier !== 'PREMIUM') {
      //   throw new Error('Premium subscription required');
      // }

      return predictiveTonnageService.generatePremiumReport(ctx.user.organizationId);
    },
  })
);

builder.queryField('getPredictedOpenVessels', (t) =>
  t.field({
    type: [PredictedOpenVesselType],
    args: {
      region: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) throw new Error('Unauthorized');
      return predictiveTonnageService.getPredictedOpenVessels(
        args.region,
        ctx.user.organizationId
      );
    },
  })
);

builder.queryField('getPremiumReportHTML', (t) =>
  t.field({
    type: 'String',
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) throw new Error('Unauthorized');
      const report = await predictiveTonnageService.generatePremiumReport(
        ctx.user.organizationId
      );
      return predictiveTonnageService.generatePremiumReportHTML(report);
    },
  })
);
