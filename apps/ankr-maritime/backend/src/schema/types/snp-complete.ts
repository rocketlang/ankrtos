/**
 * GraphQL Schema for Complete S&P Module
 * Combines all S&P services into unified API
 *
 * @module schema/types/snp-complete
 */

import { builder } from '../builder.js';
import { GraphQLError } from 'graphql';
import { snpValuationModelsService } from '../../services/snp-valuation-models.js';
import { snpMOAGeneratorService } from '../../services/snp-moa-generator.js';
import { snpInspectionSchedulerService } from '../../services/snp-inspection-scheduler.js';
import { snpNegotiationTrackerService } from '../../services/snp-negotiation-tracker.js';
import { snpCommissionTrackerService } from '../../services/snp-commission-tracker.js';
import { snpTitleTransferService } from '../../services/snp-title-transfer.js';
import { snpDeliveryAcceptanceService } from '../../services/snp-delivery-acceptance.js';

// ========================================
// VALUATION TYPES
// ========================================

const ValuationReportType = builder.objectRef<any>('ValuationReport').implement({
  fields: (t) => ({
    vesselId: t.exposeString('vesselId'),
    vesselName: t.exposeString('vesselName'),
    imo: t.exposeString('imo'),
    scrapValuation: t.field({
      type: 'JSON',
      resolve: (parent) => parent.scrapValuation,
    }),
    marketValuation: t.field({
      type: 'JSON',
      resolve: (parent) => parent.marketValuation,
    }),
    navValuation: t.field({
      type: 'JSON',
      resolve: (parent) => parent.navValuation,
    }),
    recommendedValue: t.exposeFloat('recommendedValue'),
    valuationRange: t.field({
      type: 'JSON',
      resolve: (parent) => parent.valuationRange,
    }),
    methodology: t.exposeString('methodology'),
  }),
});

// ========================================
// MOA TYPES
// ========================================

const MOATermsInput = builder.inputType('MOATermsInput', {
  fields: (t) => ({
    sellersName: t.string({ required: true }),
    sellersAddress: t.string({ required: true }),
    buyersName: t.string({ required: true }),
    buyersAddress: t.string({ required: true }),
    vesselName: t.string({ required: true }),
    imo: t.string({ required: true }),
    flag: t.string({ required: true }),
    classificationSociety: t.string({ required: true }),
    yearBuilt: t.int({ required: true }),
    dwt: t.float({ required: true }),
    grt: t.float({ required: true }),
    purchasePrice: t.float({ required: true }),
    currency: t.string({ required: true }),
    depositAmount: t.float({ required: true }),
    depositDueDate: t.field({ type: 'DateTime', required: true }),
    balancePaymentDate: t.field({ type: 'DateTime', required: true }),
    deliveryPort: t.string({ required: true }),
    earliestDelivery: t.field({ type: 'DateTime', required: true }),
    latestDelivery: t.field({ type: 'DateTime', required: true }),
    subjectToInspection: t.boolean({ required: true }),
    governingLaw: t.string({ required: true }),
    arbitrationVenue: t.string({ required: true }),
  }),
});

const GeneratedMOAType = builder.objectRef<any>('GeneratedMOA').implement({
  fields: (t) => ({
    moaId: t.exposeString('moaId'),
    documentTitle: t.exposeString('documentTitle'),
    htmlContent: t.exposeString('htmlContent'),
    status: t.exposeString('status'),
  }),
});

// ========================================
// INSPECTION TYPES
// ========================================

const InspectionScheduleType = builder.objectRef<any>('InspectionSchedule').implement({
  fields: (t) => ({
    id: t.exposeString('id'),
    transactionId: t.exposeString('transactionId'),
    inspectionType: t.exposeString('inspectionType'),
    status: t.exposeString('status'),
    port: t.exposeString('port'),
    surveyorCompany: t.exposeString('surveyorCompany', { nullable: true }),
    estimatedCost: t.exposeFloat('estimatedCost', { nullable: true }),
  }),
});

// ========================================
// NEGOTIATION TYPES
// ========================================

const NegotiationTimelineType = builder.objectRef<any>('NegotiationTimeline').implement({
  fields: (t) => ({
    transactionId: t.exposeString('transactionId'),
    vesselName: t.exposeString('vesselName'),
    currentStatus: t.exposeString('currentStatus'),
    totalOffers: t.exposeInt('totalOffers'),
    negotiationDuration: t.exposeFloat('negotiationDuration'),
    priceMovement: t.field({
      type: 'JSON',
      resolve: (parent) => parent.priceMovement,
    }),
    offers: t.field({
      type: 'JSON',
      resolve: (parent) => parent.offers,
    }),
  }),
});

// ========================================
// COMMISSION TYPES
// ========================================

const CommissionCalculationType = builder.objectRef<any>('CommissionCalculation').implement({
  fields: (t) => ({
    salePrice: t.exposeFloat('salePrice'),
    currency: t.exposeString('currency'),
    totalCommissionPercentage: t.exposeFloat('totalCommissionPercentage'),
    totalCommissionAmount: t.exposeFloat('totalCommissionAmount'),
    breakdown: t.field({
      type: 'JSON',
      resolve: (parent) => parent.breakdown,
    }),
    totalPayable: t.exposeFloat('totalPayable'),
  }),
});

// ========================================
// TITLE TRANSFER TYPES
// ========================================

const TitleTransferWorkflowType = builder.objectRef<any>('TitleTransferWorkflow').implement({
  fields: (t) => ({
    transactionId: t.exposeString('transactionId'),
    vesselName: t.exposeString('vesselName'),
    overallStatus: t.exposeString('overallStatus'),
    startDate: t.field({
      type: 'DateTime',
      resolve: (parent) => parent.startDate,
    }),
    targetCompletionDate: t.field({
      type: 'DateTime',
      resolve: (parent) => parent.targetCompletionDate,
    }),
    steps: t.field({
      type: 'JSON',
      resolve: (parent) => parent.steps,
    }),
  }),
});

// ========================================
// DELIVERY TYPES
// ========================================

const DeliveryProtocolType = builder.objectRef<any>('DeliveryProtocol').implement({
  fields: (t) => ({
    id: t.exposeString('id'),
    transactionId: t.exposeString('transactionId'),
    vesselName: t.exposeString('vesselName'),
    deliveryPort: t.exposeString('deliveryPort'),
    deliveryDate: t.field({
      type: 'DateTime',
      resolve: (parent) => parent.deliveryDate,
    }),
    status: t.exposeString('status'),
    vesselCondition: t.field({
      type: 'JSON',
      resolve: (parent) => parent.vesselCondition,
    }),
  }),
});

// ========================================
// QUERIES
// ========================================

builder.queryFields((t) => ({
  // Valuation
  vesselValuation: t.field({
    type: ValuationReportType,
    args: {
      vesselId: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return await snpValuationModelsService.generateValuationReport(
        args.vesselId,
        ctx.user.organizationId
      );
    },
  }),

  fleetValuation: t.field({
    type: 'JSON',
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return await snpValuationModelsService.valuateFleet(ctx.user.organizationId);
    },
  }),

  // Negotiation
  negotiationTimeline: t.field({
    type: NegotiationTimelineType,
    args: {
      transactionId: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return await snpNegotiationTrackerService.getNegotiationTimeline(
        args.transactionId,
        ctx.user.organizationId
      );
    },
  }),

  // Commission
  commissionCalculation: t.field({
    type: CommissionCalculationType,
    args: {
      transactionId: t.arg.string({ required: true }),
      salePrice: t.arg.float({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return await snpCommissionTrackerService.calculateCommission(
        args.transactionId,
        args.salePrice,
        ctx.user.organizationId
      );
    },
  }),

  standardCommissionRate: t.float({
    args: {
      vesselType: t.arg.string({ required: true }),
      salePrice: t.arg.float({ required: true }),
    },
    resolve: async (root, args) => {
      return snpCommissionTrackerService.getStandardCommissionRate(
        args.vesselType,
        args.salePrice
      );
    },
  }),

  // Title Transfer
  titleTransferWorkflow: t.field({
    type: TitleTransferWorkflowType,
    args: {
      transactionId: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      // Would fetch from database in production
      return {
        transactionId: args.transactionId,
        vesselName: 'MV Example',
        overallStatus: 'in_progress',
        startDate: new Date(),
        targetCompletionDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        steps: [],
      };
    },
  }),

  // Inspection
  findSurveyors: t.field({
    type: 'JSON',
    args: {
      port: t.arg.string({ required: true }),
      inspectionType: t.arg.string({ required: true }),
    },
    resolve: async (root, args) => {
      return await snpInspectionSchedulerService.findSurveyors(
        args.port,
        args.inspectionType
      );
    },
  }),
}));

// ========================================
// MUTATIONS
// ========================================

builder.mutationFields((t) => ({
  // MOA Generation
  generateMOA: t.field({
    type: GeneratedMOAType,
    args: {
      transactionId: t.arg.string({ required: true }),
      terms: t.arg({ type: MOATermsInput, required: true }),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');

      // Convert input to MOATerms
      const terms: any = {
        ...args.terms,
        deliveryDateRange: {
          earliest: args.terms.earliestDelivery,
          latest: args.terms.latestDelivery,
        },
        includedItems: [],
        excludedItems: [],
        specialConditions: [],
      };

      return await snpMOAGeneratorService.generateMOA(
        args.transactionId,
        terms,
        ctx.user.organizationId
      );
    },
  }),

  // Inspection
  createInspectionRequest: t.field({
    type: InspectionScheduleType,
    args: {
      transactionId: t.arg.string({ required: true }),
      inspectionType: t.arg.string({ required: true }),
      port: t.arg.string({ required: true }),
      preferredDate: t.arg({ type: 'DateTime', required: true }),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return await snpInspectionSchedulerService.createInspectionRequest(
        {
          transactionId: args.transactionId,
          inspectionType: args.inspectionType as any,
          preferredDates: [args.preferredDate],
          port: args.port,
          country: '',
          estimatedDuration: 8,
        },
        ctx.user.organizationId
      );
    },
  }),

  // Negotiation
  submitCounterOffer: t.field({
    type: 'JSON',
    args: {
      previousOfferId: t.arg.string({ required: true }),
      price: t.arg.float({ required: true }),
      justification: t.arg.string(),
      validUntil: t.arg({ type: 'DateTime', required: true }),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return await snpNegotiationTrackerService.submitCounterOffer(
        args.previousOfferId,
        {
          price: args.price,
          currency: 'USD',
          justification: args.justification,
          validUntil: args.validUntil,
          offeredBy: 'buyer',
          offeredByName: 'Current User',
          offeredByUserId: ctx.user.id,
        },
        ctx.user.organizationId
      );
    },
  }),

  acceptOffer: t.field({
    type: 'JSON',
    args: {
      offerId: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return await snpNegotiationTrackerService.acceptOffer(
        args.offerId,
        ctx.user.id,
        ctx.user.organizationId
      );
    },
  }),

  // Commission
  generateCommissionInvoice: t.string({
    args: {
      transactionId: t.arg.string({ required: true }),
      partyName: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return await snpCommissionTrackerService.generateCommissionInvoice(
        args.transactionId,
        args.partyName,
        ctx.user.organizationId
      );
    },
  }),

  // Title Transfer
  initializeTitleTransfer: t.field({
    type: TitleTransferWorkflowType,
    args: {
      transactionId: t.arg.string({ required: true }),
      vesselId: t.arg.string({ required: true }),
      currentOwner: t.arg.string({ required: true }),
      newOwner: t.arg.string({ required: true }),
      currentFlag: t.arg.string({ required: true }),
      newFlag: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return await snpTitleTransferService.initializeTitleTransfer(
        args.transactionId,
        args.vesselId,
        args.currentOwner,
        args.newOwner,
        args.currentFlag,
        args.newFlag,
        ctx.user.organizationId
      );
    },
  }),

  updateTitleTransferStep: t.field({
    type: 'JSON',
    args: {
      transactionId: t.arg.string({ required: true }),
      stepNumber: t.arg.int({ required: true }),
      status: t.arg.string({ required: true }),
      notes: t.arg.string(),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return await snpTitleTransferService.updateStepStatus(
        args.transactionId,
        args.stepNumber,
        args.status as any,
        args.notes,
        undefined,
        ctx.user.organizationId
      );
    },
  }),

  // Delivery
  createDeliveryProtocol: t.field({
    type: DeliveryProtocolType,
    args: {
      transactionId: t.arg.string({ required: true }),
      vesselId: t.arg.string({ required: true }),
      deliveryPort: t.arg.string({ required: true }),
      deliveryDate: t.arg({ type: 'DateTime', required: true }),
      deliveryTime: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return await snpDeliveryAcceptanceService.createDeliveryProtocol(
        args.transactionId,
        args.vesselId,
        {
          deliveryPort: args.deliveryPort,
          deliveryDate: args.deliveryDate,
          deliveryTime: args.deliveryTime,
        },
        ctx.user.organizationId
      );
    },
  }),

  recordBuyerAcceptance: t.boolean({
    args: {
      protocolId: t.arg.string({ required: true }),
      accepted: t.arg.boolean({ required: true }),
      conditions: t.arg.stringList(),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return await snpDeliveryAcceptanceService.recordBuyerAcceptance(
        args.protocolId,
        {
          accepted: args.accepted,
          acceptedBy: ctx.user.id,
          conditions: args.conditions || [],
        },
        ctx.user.organizationId
      );
    },
  }),

  generateProtocolDocument: t.string({
    args: {
      protocolId: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return await snpDeliveryAcceptanceService.generateProtocolDocument(
        args.protocolId,
        ctx.user.organizationId
      );
    },
  }),
}));
