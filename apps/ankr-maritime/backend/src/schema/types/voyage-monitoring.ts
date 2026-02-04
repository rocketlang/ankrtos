/**
 * Voyage Monitoring GraphQL Schema
 * Phase 5: AIS & ETA Prediction
 */

import { builder } from '../builder.js';
import { aisIntegrationService } from '../../services/ais-integration.js';
import { etaPredictionEngine } from '../../services/eta-prediction-engine.js';
import { etaPredictionEngineML } from '../../services/ml/eta-prediction-engine-ml.js';
import { etaTrainer } from '../../services/ml/eta-trainer.js';
import { milestoneAutoDetector } from '../../services/voyage/milestone-auto-detector.js';
import { sofAutoPopulator } from '../../services/voyage/sof-auto-populator.js';

// ========================================
// OBJECT TYPES
// ========================================

const AISPosition = builder.objectRef<{
  mmsi: number;
  imo?: number;
  vesselName?: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  heading: number;
  status: number;
  timestamp: Date;
  source: string;
  accuracy: number;
}>('AISPosition').implement({
  fields: (t) => ({
    mmsi: t.exposeInt('mmsi'),
    imo: t.exposeInt('imo', { nullable: true }),
    vesselName: t.exposeString('vesselName', { nullable: true }),
    latitude: t.exposeFloat('latitude'),
    longitude: t.exposeFloat('longitude'),
    speed: t.exposeFloat('speed'),
    course: t.exposeFloat('course'),
    heading: t.exposeFloat('heading'),
    status: t.exposeInt('status'),
    timestamp: t.expose('timestamp', { type: 'DateTime' }),
    source: t.exposeString('source'),
    accuracy: t.exposeFloat('accuracy'),
  }),
});

const ETAPrediction = builder.objectRef<{
  voyageId: string;
  portId: string;
  predictedETA: Date;
  confidence: number;
  factors: any;
  range: { earliest: Date; latest: Date };
  lastUpdated: Date;
  modelVersion?: string;
}>('ETAPrediction').implement({
  fields: (t) => ({
    voyageId: t.exposeString('voyageId'),
    portId: t.exposeString('portId'),
    predictedETA: t.expose('predictedETA', { type: 'DateTime' }),
    confidence: t.exposeFloat('confidence'),
    factors: t.field({ type: 'JSON', resolve: (p) => p.factors }),
    range: t.field({ type: 'JSON', resolve: (p) => p.range }),
    lastUpdated: t.expose('lastUpdated', { type: 'DateTime' }),
    modelVersion: t.exposeString('modelVersion', { nullable: true }),
  }),
});

const DelayAnalysis = builder.objectRef<{
  voyageId: string;
  originalETA: Date;
  currentETA: Date;
  delayHours: number;
  delayReason: string[];
  impact: string;
  recommendations: string[];
}>('DelayAnalysis').implement({
  fields: (t) => ({
    voyageId: t.exposeString('voyageId'),
    originalETA: t.expose('originalETA', { type: 'DateTime' }),
    currentETA: t.expose('currentETA', { type: 'DateTime' }),
    delayHours: t.exposeFloat('delayHours'),
    delayReason: t.exposeStringList('delayReason'),
    impact: t.exposeString('impact'),
    recommendations: t.exposeStringList('recommendations'),
  }),
});

// ========================================
// QUERIES
// ========================================

builder.queryFields((t) => ({
  vesselPosition: t.field({
    type: AISPosition,
    nullable: true,
    args: {
      imo: t.arg.int({ required: true }),
      mmsi: t.arg.int(),
    },
    resolve: async (root, args) => {
      return await aisIntegrationService.getVesselPosition(args.imo, args.mmsi || undefined);
    },
  }),

  fleetPositions: t.field({
    type: [AISPosition],
    resolve: async (root, args, ctx) => {
      return await aisIntegrationService.getFleetPositions(ctx.user!.organizationId);
    },
  }),

  vesselTrack: t.field({
    type: 'JSON',
    args: {
      imo: t.arg.int({ required: true }),
      startDate: t.arg({ type: 'DateTime', required: true }),
      endDate: t.arg({ type: 'DateTime', required: true }),
    },
    resolve: async (root, args) => {
      return await aisIntegrationService.getVesselTrack(args.imo, args.startDate, args.endDate);
    },
  }),

  predictETA: t.field({
    type: ETAPrediction,
    args: {
      voyageId: t.arg.string({ required: true }),
      portId: t.arg.string({ required: true }),
    },
    resolve: async (root, args) => {
      return await etaPredictionEngine.predictETA(args.voyageId, args.portId);
    },
  }),

  analyzeDelay: t.field({
    type: DelayAnalysis,
    args: {
      voyageId: t.arg.string({ required: true }),
      portId: t.arg.string({ required: true }),
    },
    resolve: async (root, args) => {
      return await etaPredictionEngine.analyzeDelay(args.voyageId, args.portId);
    },
  }),

  aisDataQuality: t.field({
    type: 'JSON',
    resolve: async () => {
      return await aisIntegrationService.monitorDataQuality();
    },
  }),

  etaAccuracy: t.field({
    type: 'JSON',
    resolve: async () => {
      return await etaPredictionEngine.getAccuracyStats();
    },
  }),

  // ML-powered ETA prediction
  predictETAML: t.field({
    type: ETAPrediction,
    args: {
      voyageId: t.arg.string({ required: true }),
      portId: t.arg.string({ required: true }),
    },
    resolve: async (root, args) => {
      // Check if ML ETA is enabled
      const mlEnabled = process.env.ENABLE_ML_ETA === 'true';
      if (mlEnabled) {
        return await etaPredictionEngineML.predictETA(args.voyageId, args.portId);
      }
      // Fallback to rules-based
      return await etaPredictionEngine.predictETA(args.voyageId, args.portId);
    },
  }),

  // ML accuracy statistics
  etaAccuracyML: t.field({
    type: 'JSON',
    args: {
      dateFrom: t.arg({ type: 'DateTime' }),
      dateTo: t.arg({ type: 'DateTime' }),
    },
    resolve: async (root, args) => {
      return await etaPredictionEngineML.getAccuracyStats(args.dateFrom || undefined, args.dateTo || undefined);
    },
  }),

  // Train ML model
  trainETAModel: t.field({
    type: 'JSON',
    authScopes: { admin: true },
    args: {
      months: t.arg.int({ defaultValue: 6 }),
    },
    resolve: async (root, args) => {
      const data = await etaTrainer.extractHistoricalData(args.months);
      const model = await etaTrainer.trainModel(data);
      return {
        success: true,
        modelVersion: model.version,
        trainedAt: model.trainedAt,
        accuracy: model.accuracy,
      };
    },
  }),
}));

// ========================================
// MUTATIONS
// ========================================

builder.mutationFields((t) => ({
  startAISStream: t.field({
    type: 'Boolean',
    authScopes: { admin: true },
    args: {
      vesselIds: t.arg.stringList({ required: true }),
    },
    resolve: async (root, args) => {
      await aisIntegrationService.startWebSocketStream(args.vesselIds);
      return true;
    },
  }),

  batchUpdateETAs: t.field({
    type: 'JSON',
    authScopes: { operator: true },
    resolve: async (root, args, ctx) => {
      return await etaPredictionEngine.batchUpdateETAs(ctx.user!.organizationId);
    },
  }),

  recordActualArrival: t.field({
    type: 'Boolean',
    authScopes: { operator: true },
    args: {
      voyageId: t.arg.string({ required: true }),
      portId: t.arg.string({ required: true }),
      actualArrival: t.arg({ type: 'DateTime', required: true }),
    },
    resolve: async (root, args) => {
      // Record for both legacy and ML systems
      await etaPredictionEngine.recordActualArrival(
        args.voyageId,
        args.portId,
        args.actualArrival
      );

      // Also record for ML learning if enabled
      if (process.env.ENABLE_ML_ETA === 'true') {
        await etaPredictionEngineML.recordActualArrival(
          args.voyageId,
          args.portId,
          args.actualArrival
        );
      }

      return true;
    },
  }),

  // Batch update ETAs with ML
  batchUpdateETAsML: t.field({
    type: 'JSON',
    authScopes: { operator: true },
    resolve: async (root, args, ctx) => {
      const updates = await etaPredictionEngineML.batchUpdateETAs(ctx.user!.organizationId);
      return {
        success: true,
        updatesCount: updates.length,
        updates: updates.map(u => ({
          voyageId: u.voyageId,
          portId: u.portId,
          changeMinutes: u.changeMinutes,
          severity: u.severity,
          reason: u.reason,
        })),
      };
    },
  }),

  // ========================================
  // VOYAGE AUTOMATION - Phase 5 TIER 2
  // ========================================

  // Enable automatic milestone detection for a voyage
  enableAutoMilestones: t.field({
    type: 'JSON',
    authScopes: { operator: true },
    args: {
      voyageId: t.arg.string({ required: true }),
    },
    resolve: async (root, args) => {
      const config = await milestoneAutoDetector.enableAutoMilestones(args.voyageId);
      return {
        success: true,
        voyageId: config.voyageId,
        enabled: config.enabled,
        settings: config.settings,
        message: 'Auto-milestone detection enabled. Vessel will be monitored every 5 minutes.',
      };
    },
  }),

  // Disable automatic milestone detection for a voyage
  disableAutoMilestones: t.field({
    type: 'Boolean',
    authScopes: { operator: true },
    args: {
      voyageId: t.arg.string({ required: true }),
    },
    resolve: async (root, args) => {
      await milestoneAutoDetector.disableAutoMilestones(args.voyageId);
      return true;
    },
  }),

  // Generate Statement of Facts from AIS data
  generateSOFFromAIS: t.field({
    type: 'JSON',
    authScopes: { operator: true },
    args: {
      voyageId: t.arg.string({ required: true }),
      portCallId: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      const sof = await sofAutoPopulator.generateSOF(args.voyageId, args.portCallId);
      const documentId = await sofAutoPopulator.saveSOFDraft(sof, ctx.user!.organizationId);

      return {
        success: true,
        documentId,
        portCallId: sof.portCallId,
        vesselName: sof.vesselName,
        portName: sof.portName,
        eventsCount: sof.events.length,
        weatherEntriesCount: sof.weatherLog.length,
        delaysCount: sof.delays.length,
        draft: sof.draft,
        generatedAt: sof.generatedAt,
        notes: sof.notes,
        preview: sofAutoPopulator.formatSOFAsText(sof),
      };
    },
  }),

  // Get auto-detected milestones for a voyage
  getAutoDetectedMilestones: t.field({
    type: 'JSON',
    authScopes: { operator: true },
    args: {
      voyageId: t.arg.string({ required: true }),
    },
    resolve: async (root, args) => {
      const milestones = await milestoneAutoDetector.getAutoDetectedMilestones(args.voyageId);
      return {
        voyageId: args.voyageId,
        count: milestones.length,
        milestones: milestones.map(m => ({
          id: m.id,
          type: m.type,
          timestamp: m.timestamp,
          location: m.location,
          autoDetected: m.autoDetected,
          notes: m.notes,
        })),
      };
    },
  }),

  // Batch process all active voyages for milestone detection
  batchProcessMilestones: t.field({
    type: 'JSON',
    authScopes: { admin: true },
    resolve: async (root, args, ctx) => {
      const result = await milestoneAutoDetector.batchProcessActiveVoyages(ctx.user!.organizationId);
      return {
        success: true,
        processed: result.processed,
        eventsDetected: result.eventsDetected,
        events: result.events.map(e => ({
          voyageId: e.voyageId,
          type: e.type,
          portId: e.portId,
          detectedAt: e.detectedAt,
          confidence: e.confidence,
          source: e.source,
        })),
      };
    },
  }),
}));
