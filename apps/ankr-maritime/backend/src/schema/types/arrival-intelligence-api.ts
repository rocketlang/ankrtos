/**
 * Arrival Intelligence API - GraphQL Types & Resolvers
 *
 * Exposes the complete arrival intelligence system via GraphQL
 * for the Agent Dashboard frontend.
 */

import { builder } from '../builder';
import { prisma } from '../../lib/prisma.js';
import { ArrivalIntelligenceService } from '../../services/arrival-intelligence';
import { pubsub, PubSubEvent } from '../../services/pubsub.service';

// Initialize service
const intelligenceService = new ArrivalIntelligenceService(prisma);

/**
 * Enums
 */
const ArrivalStatusEnum = builder.enumType('ArrivalStatus', {
  values: ['APPROACHING', 'IN_ANCHORAGE', 'BERTHING', 'IN_PORT', 'DEPARTED'] as const
});

const DocumentStatusEnum = builder.enumType('DocumentStatus', {
  values: ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED', 'OVERDUE'] as const
});

const CongestionStatusEnum = builder.enumType('CongestionStatus', {
  values: ['GREEN', 'YELLOW', 'RED'] as const
});

const ETAConfidenceEnum = builder.enumType('ETAConfidence', {
  values: ['HIGH', 'MEDIUM', 'LOW'] as const
});

/**
 * Object Types
 */

// Basic vessel info
const VesselInfoType = builder.objectRef<{
  id: string;
  name: string;
  imo: string | null;
  type: string | null;
}>('VesselInfo').implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    imo: t.exposeString('imo', { nullable: true }),
    type: t.exposeString('type', { nullable: true })
  })
});

// Basic port info
const PortInfoType = builder.objectRef<{
  id: string;
  name: string;
  unlocode: string;
}>('PortInfo').implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    unlocode: t.exposeString('unlocode')
  })
});

// ETA details
const ETADetailsType = builder.objectRef<{
  bestCase: Date;
  mostLikely: Date;
  worstCase: Date;
  confidence: string;
  hoursRemaining: number;
}>('ETADetails').implement({
  fields: (t) => ({
    bestCase: t.field({
      type: 'DateTime',
      resolve: (parent) => parent.bestCase
    }),
    mostLikely: t.field({
      type: 'DateTime',
      resolve: (parent) => parent.mostLikely
    }),
    worstCase: t.field({
      type: 'DateTime',
      resolve: (parent) => parent.worstCase
    }),
    confidence: t.field({
      type: ETAConfidenceEnum,
      resolve: (parent) => parent.confidence as any
    }),
    hoursRemaining: t.exposeFloat('hoursRemaining')
  })
});

// Document intelligence
const UrgentDocumentType = builder.objectRef<{
  documentType: string;
  documentName: string;
  status: string;
  deadline: Date;
  hoursRemaining: number;
  priority: string;
}>('UrgentDocument').implement({
  fields: (t) => ({
    documentType: t.exposeString('documentType'),
    documentName: t.exposeString('documentName'),
    status: t.field({
      type: DocumentStatusEnum,
      resolve: (parent) => parent.status as any
    }),
    deadline: t.field({
      type: 'DateTime',
      resolve: (parent) => parent.deadline
    }),
    hoursRemaining: t.exposeFloat('hoursRemaining'),
    priority: t.exposeString('priority')
  })
});

const DocumentIntelligenceType = builder.objectRef<{
  required: number;
  missing: number;
  submitted: number;
  approved: number;
  complianceScore: number;
  criticalMissing: number;
  nextDeadline: Date | null;
  urgentDocuments: any[];
}>('DocumentIntelligence').implement({
  fields: (t) => ({
    required: t.exposeInt('required'),
    missing: t.exposeInt('missing'),
    submitted: t.exposeInt('submitted'),
    approved: t.exposeInt('approved'),
    complianceScore: t.exposeFloat('complianceScore'),
    criticalMissing: t.exposeInt('criticalMissing'),
    nextDeadline: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (parent) => parent.nextDeadline
    }),
    urgentDocuments: t.field({
      type: [UrgentDocumentType],
      resolve: (parent) => parent.urgentDocuments
    })
  })
});

// DA Forecast
const DAForecastType = builder.objectRef<{
  min: number | null;
  max: number | null;
  mostLikely: number | null;
  confidence: number | null;
  breakdown: any;
}>('DAForecast').implement({
  fields: (t) => ({
    min: t.exposeFloat('min', { nullable: true }),
    max: t.exposeFloat('max', { nullable: true }),
    mostLikely: t.exposeFloat('mostLikely', { nullable: true }),
    confidence: t.exposeFloat('confidence', { nullable: true }),
    breakdown: t.field({
      type: 'JSON',
      nullable: true,
      resolve: (parent) => parent.breakdown
    })
  })
});

// Congestion analysis
const CongestionAnalysisType = builder.objectRef<{
  status: string;
  waitTimeMin: number | null;
  waitTimeMax: number | null;
  vesselsInPort: number | null;
  vesselsAtAnchorage: number | null;
}>('CongestionAnalysis').implement({
  fields: (t) => ({
    status: t.field({
      type: CongestionStatusEnum,
      resolve: (parent) => parent.status as any
    }),
    waitTimeMin: t.exposeFloat('waitTimeMin', { nullable: true }),
    waitTimeMax: t.exposeFloat('waitTimeMax', { nullable: true }),
    vesselsInPort: t.exposeInt('vesselsInPort', { nullable: true }),
    vesselsAtAnchorage: t.exposeInt('vesselsAtAnchorage', { nullable: true })
  })
});

// Port readiness
const PortReadinessType = builder.objectRef<{
  score: string | null;
  berthAvailability: string | null;
  pilotAvailability: string | null;
}>('PortReadiness').implement({
  fields: (t) => ({
    score: t.exposeString('score', { nullable: true }),
    berthAvailability: t.exposeString('berthAvailability', { nullable: true }),
    pilotAvailability: t.exposeString('pilotAvailability', { nullable: true })
  })
});

// Complete intelligence summary
const ArrivalIntelligenceSummaryType = builder.objectRef<{
  vessel: any;
  port: any;
  distance: number;
  eta: any;
  documents: any;
  daForecast: any;
  congestion: any;
  portReadiness: any;
  recommendations: any;
  status: string;
  lastUpdated: Date;
}>('ArrivalIntelligenceSummary').implement({
  fields: (t) => ({
    vessel: t.field({
      type: VesselInfoType,
      resolve: (parent) => parent.vessel
    }),
    port: t.field({
      type: PortInfoType,
      resolve: (parent) => parent.port
    }),
    distance: t.exposeFloat('distance'),
    eta: t.field({
      type: ETADetailsType,
      resolve: (parent) => parent.eta
    }),
    documents: t.field({
      type: DocumentIntelligenceType,
      resolve: (parent) => parent.documents
    }),
    daForecast: t.field({
      type: DAForecastType,
      resolve: (parent) => parent.daForecast
    }),
    congestion: t.field({
      type: CongestionAnalysisType,
      resolve: (parent) => parent.congestion
    }),
    portReadiness: t.field({
      type: PortReadinessType,
      resolve: (parent) => parent.portReadiness
    }),
    recommendations: t.field({
      type: 'JSON',
      nullable: true,
      resolve: (parent) => parent.recommendations
    }),
    status: t.field({
      type: ArrivalStatusEnum,
      resolve: (parent) => parent.status as any
    }),
    lastUpdated: t.field({
      type: 'DateTime',
      resolve: (parent) => parent.lastUpdated
    })
  })
});

// Active arrival (lightweight for list view)
const ActiveArrivalType = builder.objectRef<{
  arrivalId: string;
  vessel: any;
  port: any;
  distance: number;
  eta: Date;
  etaConfidence: string;
  status: string;
  intelligence: any;
  urgentActions: number;
}>('ActiveArrival').implement({
  fields: (t) => ({
    arrivalId: t.exposeID('arrivalId'),
    vessel: t.field({
      type: VesselInfoType,
      resolve: (parent) => parent.vessel
    }),
    port: t.field({
      type: PortInfoType,
      resolve: (parent) => parent.port
    }),
    distance: t.exposeFloat('distance'),
    eta: t.field({
      type: 'DateTime',
      resolve: (parent) => parent.eta
    }),
    etaConfidence: t.field({
      type: ETAConfidenceEnum,
      resolve: (parent) => parent.etaConfidence as any
    }),
    status: t.field({
      type: ArrivalStatusEnum,
      resolve: (parent) => parent.status as any
    }),
    intelligence: t.field({
      type: 'JSON',
      nullable: true,
      resolve: (parent) => parent.intelligence
    }),
    urgentActions: t.exposeInt('urgentActions')
  })
});

/**
 * Input Types
 */
const ActiveArrivalsFilterInput = builder.inputType('ActiveArrivalsFilterInput', {
  fields: (t) => ({
    status: t.stringList({ required: false }),
    portId: t.string({ required: false }),
    hoursToETA: t.int({ required: false })
  })
});

/**
 * Queries
 */
builder.queryFields((t) => ({
  // Get complete intelligence for a specific arrival
  arrivalIntelligence: t.field({
    type: ArrivalIntelligenceSummaryType,
    nullable: true,
    args: {
      arrivalId: t.arg.string({ required: true })
    },
    resolve: async (_, { arrivalId }) => {
      return await intelligenceService.getIntelligenceSummary(arrivalId);
    }
  }),

  // Get all active arrivals (for dashboard list)
  activeArrivals: t.field({
    type: [ActiveArrivalType],
    args: {
      filters: t.arg({ type: ActiveArrivalsFilterInput, required: false })
    },
    resolve: async (_, { filters }) => {
      return await intelligenceService.getActiveArrivals(filters || undefined);
    }
  }),

  // Get arrivals arriving soon (next 48h) with urgent alerts
  arrivalsArrivingSoon: t.field({
    type: [ActiveArrivalType],
    resolve: async () => {
      return await intelligenceService.getActiveArrivals({
        status: ['APPROACHING'],
        hoursToETA: 48
      });
    }
  }),

  // Get arrivals currently in port
  arrivalsInPort: t.field({
    type: [ActiveArrivalType],
    resolve: async () => {
      return await intelligenceService.getActiveArrivals({
        status: ['IN_PORT', 'BERTHING']
      });
    }
  })
}));

/**
 * Subscriptions
 */
builder.subscriptionFields((t) => ({
  // Subscribe to intelligence updates for a specific arrival
  arrivalIntelligenceUpdated: t.field({
    type: ArrivalIntelligenceSummaryType,
    nullable: true,
    args: {
      arrivalId: t.arg.string({ required: true })
    },
    subscribe: (_, { arrivalId }) => {
      console.log(`[Subscription] Client subscribed to arrival intelligence: ${arrivalId}`);
      return pubsub.subscribe(
        PubSubEvent.ARRIVAL_INTELLIGENCE_UPDATED,
        (payload) => payload.arrivalId === arrivalId
      );
    },
    resolve: async (payload) => {
      // Fetch fresh intelligence data
      if (payload?.arrivalId) {
        return await intelligenceService.getIntelligenceSummary(payload.arrivalId);
      }
      return null;
    }
  }),

  // Subscribe to new arrivals detected
  newArrivalDetected: t.field({
    type: ActiveArrivalType,
    subscribe: () => {
      console.log('[Subscription] Client subscribed to new arrivals');
      return pubsub.subscribe(PubSubEvent.NEW_ARRIVAL_DETECTED);
    },
    resolve: (payload) => payload
  }),

  // Subscribe to document status changes
  documentStatusChanged: t.field({
    type: 'JSON',
    args: {
      arrivalId: t.arg.string({ required: true })
    },
    subscribe: (_, { arrivalId }) => {
      console.log(`[Subscription] Client subscribed to document changes: ${arrivalId}`);
      return pubsub.subscribe(
        PubSubEvent.DOCUMENT_STATUS_CHANGED,
        (payload) => payload.arrivalId === arrivalId
      );
    },
    resolve: (payload) => payload
  }),

  // Subscribe to ETA changes
  etaChanged: t.field({
    type: 'JSON',
    args: {
      arrivalId: t.arg.string({ required: true })
    },
    subscribe: (_, { arrivalId }) => {
      console.log(`[Subscription] Client subscribed to ETA changes: ${arrivalId}`);
      return pubsub.subscribe(
        PubSubEvent.ETA_CHANGED,
        (payload) => payload.arrivalId === arrivalId
      );
    },
    resolve: (payload) => payload
  })
}));

/**
 * Mutations
 */
builder.mutationFields((t) => ({
  // Trigger manual intelligence update (for testing/debugging)
  updateArrivalIntelligence: t.field({
    type: 'Boolean',
    args: {
      arrivalId: t.arg.string({ required: true })
    },
    resolve: async (_, { arrivalId }) => {
      await intelligenceService.updateIntelligence(arrivalId);
      return true;
    }
  }),

  // Submit a document for approval
  submitDocument: t.field({
    type: 'Boolean',
    args: {
      arrivalId: t.arg.string({ required: true }),
      documentType: t.arg.string({ required: true }),
      fileUrl: t.arg.string({ required: true }),
      submittedBy: t.arg.string({ required: true }),
      notes: t.arg.string({ required: false })
    },
    resolve: async (_, { arrivalId, documentType, fileUrl, submittedBy, notes }) => {
      const documentChecker = new (await import('../../services/arrival-intelligence')).DocumentCheckerService(prisma);
      await documentChecker.submitDocument(arrivalId, documentType, submittedBy, fileUrl, notes);

      // Update intelligence metrics
      await intelligenceService.updateIntelligence(arrivalId);

      // Publish real-time updates
      pubsub.publishDocumentStatusChange(arrivalId, documentType, 'SUBMITTED');
      pubsub.publishArrivalUpdate(arrivalId, null); // Will trigger intelligence refetch

      return true;
    }
  }),

  // Approve a submitted document
  approveDocument: t.field({
    type: 'Boolean',
    args: {
      arrivalId: t.arg.string({ required: true }),
      documentType: t.arg.string({ required: true }),
      approvedBy: t.arg.string({ required: true }),
      notes: t.arg.string({ required: false })
    },
    resolve: async (_, { arrivalId, documentType, approvedBy, notes }) => {
      const documentChecker = new (await import('../../services/arrival-intelligence')).DocumentCheckerService(prisma);
      await documentChecker.approveDocument(arrivalId, documentType, approvedBy, notes);

      // Update intelligence metrics
      await intelligenceService.updateIntelligence(arrivalId);

      // Publish real-time updates
      pubsub.publishDocumentStatusChange(arrivalId, documentType, 'APPROVED');
      pubsub.publishArrivalUpdate(arrivalId, null);

      return true;
    }
  }),

  // Reject a submitted document
  rejectDocument: t.field({
    type: 'Boolean',
    args: {
      arrivalId: t.arg.string({ required: true }),
      documentType: t.arg.string({ required: true }),
      rejectedBy: t.arg.string({ required: true }),
      reason: t.arg.string({ required: true })
    },
    resolve: async (_, { arrivalId, documentType, rejectedBy, reason }) => {
      // Update document status to REJECTED
      await prisma.documentStatus.updateMany({
        where: {
          arrivalId,
          documentType
        },
        data: {
          status: 'REJECTED',
          updatedAt: new Date()
        }
      });

      // Log timeline event
      await prisma.arrivalTimelineEvent.create({
        data: {
          arrivalId,
          eventType: 'DOCUMENT_REJECTED',
          actor: rejectedBy,
          action: `Document rejected: ${documentType}`,
          impact: 'IMPORTANT',
          metadata: {
            documentType,
            reason
          }
        }
      });

      // Update intelligence metrics
      await intelligenceService.updateIntelligence(arrivalId);
      return true;
    }
  }),

  // Get all document statuses for an arrival
  documentStatuses: t.field({
    type: 'JSON',
    args: {
      arrivalId: t.arg.string({ required: true })
    },
    resolve: async (_, { arrivalId }) => {
      const documents = await prisma.documentStatus.findMany({
        where: { arrivalId },
        orderBy: { deadline: 'asc' }
      });
      return documents;
    }
  })
}));
