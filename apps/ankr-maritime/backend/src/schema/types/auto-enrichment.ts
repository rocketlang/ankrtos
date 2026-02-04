/**
 * GraphQL Schema for Auto-Enrichment
 */

import { builder } from '../builder.js';
import { autoEnrichmentService } from '../../services/auto-enrichment.service.js';
import { emailVesselParserService } from '../../services/email-vessel-parser.service.js';
import { aisEnrichmentTrigger } from '../../workers/ais-enrichment-trigger.ts';

// Types

const EnrichmentQueueStatus = builder.objectRef<{
  queueLength: number;
  processing: boolean;
  itemsByPriority: Record<string, number>;
  itemsBySource: Record<string, number>;
}>('EnrichmentQueueStatus').implement({
  fields: (t) => ({
    queueLength: t.exposeInt('queueLength'),
    processing: t.exposeBoolean('processing'),
    itemsByPriority: t.field({
      type: 'JSON',
      resolve: (parent) => parent.itemsByPriority,
    }),
    itemsBySource: t.field({
      type: 'JSON',
      resolve: (parent) => parent.itemsBySource,
    }),
  }),
});

const ParsedVesselMention = builder.objectRef<{
  imoNumber?: string;
  mmsi?: string;
  vesselName?: string;
  context: string;
  confidence: string;
}>('ParsedVesselMention').implement({
  fields: (t) => ({
    imoNumber: t.exposeString('imoNumber', { nullable: true }),
    mmsi: t.exposeString('mmsi', { nullable: true }),
    vesselName: t.exposeString('vesselName', { nullable: true }),
    context: t.exposeString('context'),
    confidence: t.exposeString('confidence'),
  }),
});

const EmailParseResult = builder.objectRef<{
  vessels: any[];
  enrichmentTriggered: number;
}>('EmailParseResult').implement({
  fields: (t) => ({
    vessels: t.field({
      type: [ParsedVesselMention],
      resolve: (parent) => parent.vessels,
    }),
    enrichmentTriggered: t.exposeInt('enrichmentTriggered'),
  }),
});

const AISEnrichmentStats = builder.objectRef<{
  newVesselsDetected: number;
  enrichmentTriggered: number;
  alreadyEnriched: number;
  errors: number;
}>('AISEnrichmentStats').implement({
  fields: (t) => ({
    newVesselsDetected: t.exposeInt('newVesselsDetected'),
    enrichmentTriggered: t.exposeInt('enrichmentTriggered'),
    alreadyEnriched: t.exposeInt('alreadyEnriched'),
    errors: t.exposeInt('errors'),
  }),
});

// Queries

builder.queryField('enrichmentQueueStatus', (t) =>
  t.field({
    type: EnrichmentQueueStatus,
    description: 'Get current status of the enrichment queue',
    resolve: async () => {
      return autoEnrichmentService.getQueueStatus();
    },
  })
);

// Mutations

builder.mutationField('triggerVesselEnrichment', (t) =>
  t.boolean({
    description: 'Manually trigger enrichment for a vessel (e.g., from user query)',
    args: {
      imoNumber: t.arg.string({ required: false }),
      vesselId: t.arg.string({ required: false }),
      priority: t.arg.string({ required: false }), // 'low' | 'medium' | 'high' | 'urgent'
    },
    resolve: async (_, { imoNumber, vesselId, priority }) => {
      await autoEnrichmentService.queueEnrichment({
        source: 'user_query',
        imoNumber: imoNumber || undefined,
        vesselId: vesselId || undefined,
        priority: (priority as any) || 'high',
      });
      return true;
    },
  })
);

builder.mutationField('parseEmailForVessels', (t) =>
  t.field({
    type: EmailParseResult,
    description: 'Parse email content and extract vessel mentions',
    args: {
      subject: t.arg.string({ required: false }),
      body: t.arg.string({ required: true }),
    },
    resolve: async (_, { subject, body }) => {
      return await emailVesselParserService.parseEmail(body, subject || undefined);
    },
  })
);

builder.mutationField('enrichTopActiveVessels', (t) =>
  t.field({
    type: AISEnrichmentStats,
    description: 'Enrich top N vessels by recent AIS activity',
    args: {
      limit: t.arg.int({ required: false }),
    },
    resolve: async (_, { limit }) => {
      await autoEnrichmentService.enrichTopActiveVessels(limit || 100);
      return await aisEnrichmentTrigger.enrichRecentlyActiveVessels();
    },
  })
);

builder.mutationField('triggerAISEnrichmentCheck', (t) =>
  t.field({
    type: AISEnrichmentStats,
    description: 'Check recently active vessels and trigger enrichment',
    resolve: async () => {
      return await aisEnrichmentTrigger.enrichRecentlyActiveVessels();
    },
  })
);
