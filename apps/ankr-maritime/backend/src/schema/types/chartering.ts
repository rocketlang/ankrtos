/**
 * Chartering Desk GraphQL Schema (Phase 3)
 * Clean rewrite with modern Pothos patterns
 *
 * Services:
 * - freightCalculator: Freight & TCE calculations
 * - rateBenchmark: Market rates & benchmarking
 * - clauseLibrary: Charter party clause management
 * - fixtureApprovalWorkflow: Fixture approval workflows
 * - generateFixtureRecap: Fixture recap generation
 */

import { builder } from '../builder.js';
import { GraphQLError } from 'graphql';
import { freightCalculator } from '../../services/freight-calculator.js';
import { rateBenchmark } from '../../services/rate-benchmark.js';
import { clauseLibrary } from '../../services/clause-library.js';
import { fixtureApprovalWorkflow } from '../../services/fixture-approval-workflow.js';
import { generateFixtureRecap } from '../../services/fixture-recap.js';

// ========================================
// FREIGHT CALCULATOR TYPES
// ========================================

const TCEResult = builder.objectRef<{
  tce: number;
  grossFreight: number;
  netFreight: number;
  portCosts: number;
  bunkerCosts: number;
  otherCosts: number;
  totalCosts: number;
  seaDays: number;
  portDays: number;
  totalDays: number;
}>('TCEResult').implement({
  fields: (t) => ({
    tce: t.exposeFloat('tce'),
    grossFreight: t.exposeFloat('grossFreight'),
    netFreight: t.exposeFloat('netFreight'),
    portCosts: t.exposeFloat('portCosts'),
    bunkerCosts: t.exposeFloat('bunkerCosts'),
    otherCosts: t.exposeFloat('otherCosts'),
    totalCosts: t.exposeFloat('totalCosts'),
    seaDays: t.exposeFloat('seaDays'),
    portDays: t.exposeFloat('portDays'),
    totalDays: t.exposeFloat('totalDays'),
  }),
});

const CommissionBreakdown = builder.objectRef<{
  address: number;
  brokerage: number;
  total: number;
  netFreight: number;
}>('CommissionBreakdown').implement({
  fields: (t) => ({
    address: t.exposeFloat('address'),
    brokerage: t.exposeFloat('brokerage'),
    total: t.exposeFloat('total'),
    netFreight: t.exposeFloat('netFreight'),
  }),
});

// ========================================
// RATE BENCHMARK TYPES
// ========================================

const RateBenchmark = builder.objectRef<{
  averageRate: number;
  minRate: number;
  maxRate: number;
  sampleSize: number;
  lastUpdated: Date;
}>('RateBenchmark').implement({
  fields: (t) => ({
    averageRate: t.exposeFloat('averageRate'),
    minRate: t.exposeFloat('minRate'),
    maxRate: t.exposeFloat('maxRate'),
    sampleSize: t.exposeInt('sampleSize'),
    lastUpdated: t.expose('lastUpdated', { type: 'DateTime' }),
  }),
});

const RouteAnalysis = builder.objectRef<{
  route: string;
  averageRate: number;
  trendDirection: string;
  volatility: number;
  recommendations: string[];
}>('RouteAnalysis').implement({
  fields: (t) => ({
    route: t.exposeString('route'),
    averageRate: t.exposeFloat('averageRate'),
    trendDirection: t.exposeString('trendDirection'),
    volatility: t.exposeFloat('volatility'),
    recommendations: t.field({
      type: ['String'],
      resolve: (parent) => parent.recommendations,
    }),
  }),
});

// ========================================
// CLAUSE LIBRARY TYPES
// ========================================

const ClauseRecommendation = builder.objectRef<{
  clause: any;
  reason: string;
  priority: string;
}>('ClauseRecommendation').implement({
  fields: (t) => ({
    clause: t.field({ type: 'JSON', resolve: (p) => p.clause }),
    reason: t.exposeString('reason'),
    priority: t.exposeString('priority'),
  }),
});

// ========================================
// FIXTURE APPROVAL TYPES
// ========================================

const FixtureWorkflowStatus = builder.objectRef<{
  workflowId: string;
  status: string;
  currentStep: number;
  totalSteps: number;
  pendingApprovers: string[];
  completedSteps: any[];
}>('FixtureWorkflowStatus').implement({
  fields: (t) => ({
    workflowId: t.exposeString('workflowId'),
    status: t.exposeString('status'),
    currentStep: t.exposeInt('currentStep'),
    totalSteps: t.exposeInt('totalSteps'),
    pendingApprovers: t.field({
      type: ['String'],
      resolve: (p) => p.pendingApprovers,
    }),
    completedSteps: t.field({
      type: 'JSON',
      resolve: (p) => p.completedSteps,
    }),
  }),
});

// ========================================
// QUERIES
// ========================================

builder.queryFields((t) => ({
  // ===== FREIGHT CALCULATOR =====

  calculateTCE: t.field({
    type: 'JSON',
    args: {
      voyageParams: t.arg({ type: 'JSON', required: true }),
    },
    resolve: async (root, args) => {
      try {
        return freightCalculator.calculateTCE(args.voyageParams as any);
      } catch (error: any) {
        throw new GraphQLError(`TCE calculation failed: ${error.message}`);
      }
    },
  }),

  calculateCommissions: t.field({
    type: 'JSON',
    args: {
      grossAmount: t.arg.float({ required: true }),
      addressCommission: t.arg.float({ defaultValue: 1.25 }),
      brokerageCommission: t.arg.float({ defaultValue: 1.25 }),
    },
    resolve: async (root, args) => {
      try {
        return freightCalculator.calculateCommissions({
          grossAmount: args.grossAmount,
          addressCommissionRate: args.addressCommission ?? 1.25,
          brokerageCommissionRate: args.brokerageCommission ?? 1.25,
        });
      } catch (error: any) {
        throw new GraphQLError(`Commission calculation failed: ${error.message}`);
      }
    },
  }),

  calculateBallastBonus: t.field({
    type: 'JSON',
    args: {
      ballastParams: t.arg({ type: 'JSON', required: true }),
    },
    resolve: async (root, args) => {
      try {
        return freightCalculator.calculateBallastBonus(args.ballastParams as any);
      } catch (error: any) {
        throw new GraphQLError(`Ballast bonus calculation failed: ${error.message}`);
      }
    },
  }),

  compareVoyages: t.field({
    type: 'JSON',
    args: {
      voyages: t.arg({ type: 'JSON', required: true }),
    },
    resolve: async (root, args) => {
      try {
        return freightCalculator.compareVoyages(args.voyages as any[]);
      } catch (error: any) {
        throw new GraphQLError(`Voyage comparison failed: ${error.message}`);
      }
    },
  }),

  // ===== RATE BENCHMARK =====

  getRateBenchmark: t.field({
    type: 'JSON',
    args: {
      route: t.arg.string({ required: true }),
      vesselType: t.arg.string({ required: true }),
      cargoType: t.arg.string({ required: true }),
      period: t.arg.string({ defaultValue: '30d' }),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      try {
        return await rateBenchmark.getBenchmark({
          route: args.route,
          vesselType: args.vesselType,
          cargoType: args.cargoType,
          period: args.period ?? '30d',
        });
      } catch (error: any) {
        throw new GraphQLError(`Benchmark retrieval failed: ${error.message}`);
      }
    },
  }),

  analyzeRoute: t.field({
    type: RouteAnalysis,
    args: {
      route: t.arg.string({ required: true }),
    },
    resolve: async (root, args) => {
      try {
        return await rateBenchmark.analyzeRoute(args.route);
      } catch (error: any) {
        throw new GraphQLError(`Route analysis failed: ${error.message}`);
      }
    },
  }),

  compareRateToMarket: t.field({
    type: 'JSON',
    args: {
      route: t.arg.string({ required: true }),
      vesselType: t.arg.string({ required: true }),
      cargoType: t.arg.string({ required: true }),
      proposedRate: t.arg.float({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      try {
        return await rateBenchmark.compareToMarket({
          route: args.route,
          vesselType: args.vesselType,
          cargoType: args.cargoType,
          proposedRate: args.proposedRate,
          organizationId: ctx.user.organizationId,
        });
      } catch (error: any) {
        throw new GraphQLError(`Market comparison failed: ${error.message}`);
      }
    },
  }),

  getMarketSummary: t.field({
    type: 'JSON',
    args: {
      vesselType: t.arg.string({ required: true }),
      timeframe: t.arg.string({ defaultValue: '30d' }),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      try {
        return await rateBenchmark.getMarketSummary({
          vesselType: args.vesselType,
          timeframe: args.timeframe,
          organizationId: ctx.user.organizationId,
        });
      } catch (error: any) {
        throw new GraphQLError(`Market summary retrieval failed: ${error.message}`);
      }
    },
  }),

  // ===== CLAUSE LIBRARY =====

  searchClauses: t.field({
    type: 'JSON',
    args: {
      searchTerm: t.arg.string({ required: true }),
      category: t.arg.string(),
      limit: t.arg.int({ defaultValue: 20 }),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      try {
        return await clauseLibrary.searchClauses({
          searchTerm: args.searchTerm,
          category: args.category ?? undefined,
          organizationId: ctx.user.organizationId,
          limit: args.limit,
        });
      } catch (error: any) {
        throw new GraphQLError(`Clause search failed: ${error.message}`);
      }
    },
  }),

  getClauseRecommendations: t.field({
    type: [ClauseRecommendation],
    args: {
      charterType: t.arg.string({ required: true }),
      cargoType: t.arg.string({ required: true }),
      route: t.arg.string(),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      try {
        return await clauseLibrary.getRecommendations({
          charterType: args.charterType,
          cargoType: args.cargoType,
          route: args.route ?? undefined,
          organizationId: ctx.user.organizationId,
        });
      } catch (error: any) {
        throw new GraphQLError(`Clause recommendations failed: ${error.message}`);
      }
    },
  }),

  getClausesByCategory: t.field({
    type: 'JSON',
    args: {
      category: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      try {
        return await clauseLibrary.getByCategory(
          args.category,
          ctx.user.organizationId
        );
      } catch (error: any) {
        throw new GraphQLError(`Clause retrieval failed: ${error.message}`);
      }
    },
  }),

  getMostUsedClauses: t.field({
    type: 'JSON',
    args: {
      limit: t.arg.int({ defaultValue: 10 }),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      try {
        return await clauseLibrary.getMostUsed(ctx.user.organizationId, args.limit);
      } catch (error: any) {
        throw new GraphQLError(`Most used clauses retrieval failed: ${error.message}`);
      }
    },
  }),

  getClauseCategories: t.field({
    type: ['String'],
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      try {
        return await clauseLibrary.getCategories(ctx.user.organizationId);
      } catch (error: any) {
        throw new GraphQLError(`Categories retrieval failed: ${error.message}`);
      }
    },
  }),

  // ===== FIXTURE APPROVAL WORKFLOW =====

  getFixtureWorkflowStatus: t.field({
    type: 'JSON',
    args: {
      workflowId: t.arg.string({ required: true }),
    },
    resolve: async (root, args) => {
      try {
        return await fixtureApprovalWorkflow.getWorkflowStatus(args.workflowId);
      } catch (error: any) {
        throw new GraphQLError(`Workflow status retrieval failed: ${error.message}`);
      }
    },
  }),

  getPendingFixtureApprovals: t.field({
    type: 'JSON',
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      try {
        return await fixtureApprovalWorkflow.getPendingApprovals(
          ctx.user.id,
          ctx.user.organizationId
        );
      } catch (error: any) {
        throw new GraphQLError(`Pending approvals retrieval failed: ${error.message}`);
      }
    },
  }),
}));

// ========================================
// MUTATIONS
// ========================================

builder.mutationFields((t) => ({
  // ===== FREIGHT CALCULATOR =====

  convertFreight: t.field({
    type: 'JSON',
    args: {
      amount: t.arg.float({ required: true }),
      fromCurrency: t.arg.string({ required: true }),
      toCurrency: t.arg.string({ required: true }),
    },
    resolve: async (root, args) => {
      try {
        return await freightCalculator.convertFreight({
          amount: args.amount,
          fromCurrency: args.fromCurrency,
          toCurrency: args.toCurrency,
        });
      } catch (error: any) {
        throw new GraphQLError(`Currency conversion failed: ${error.message}`);
      }
    },
  }),

  // ===== RATE BENCHMARK =====

  recordMarketRate: t.field({
    type: 'String',
    args: {
      route: t.arg.string({ required: true }),
      vesselType: t.arg.string({ required: true }),
      cargoType: t.arg.string({ required: true }),
      rate: t.arg.float({ required: true }),
      laycan: t.arg({ type: 'DateTime', required: true }),
      source: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      try {
        return await rateBenchmark.recordRate({
          route: args.route,
          vesselType: args.vesselType,
          cargoType: args.cargoType,
          rate: args.rate,
          laycan: args.laycan,
          source: args.source,
          organizationId: ctx.user.organizationId,
          recordedAt: new Date(),
        });
      } catch (error: any) {
        throw new GraphQLError(`Rate recording failed: ${error.message}`);
      }
    },
  }),

  // ===== CLAUSE LIBRARY =====

  initializeStandardClauses: t.field({
    type: 'Int',
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      try {
        return await clauseLibrary.initializeStandardClauses(ctx.user.organizationId);
      } catch (error: any) {
        throw new GraphQLError(`Clause initialization failed: ${error.message}`);
      }
    },
  }),

  addCustomClause: t.field({
    type: 'JSON',
    args: {
      title: t.arg.string({ required: true }),
      text: t.arg.string({ required: true }),
      category: t.arg.string({ required: true }),
      description: t.arg.string(),
      tags: t.arg.stringList(),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      try {
        return await clauseLibrary.addClause(
          {
            title: args.title,
            text: args.text,
            category: args.category,
            description: args.description ?? undefined,
            tags: args.tags ?? [],
            isStandard: false,
          },
          ctx.user.organizationId
        );
      } catch (error: any) {
        throw new GraphQLError(`Clause addition failed: ${error.message}`);
      }
    },
  }),

  updateClause: t.field({
    type: 'JSON',
    args: {
      clauseId: t.arg.string({ required: true }),
      updates: t.arg({ type: 'JSON', required: true }),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      try {
        return await clauseLibrary.updateClause(
          args.clauseId,
          args.updates as any,
          ctx.user.organizationId
        );
      } catch (error: any) {
        throw new GraphQLError(`Clause update failed: ${error.message}`);
      }
    },
  }),

  markClauseUsed: t.field({
    type: 'Boolean',
    args: {
      clauseId: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      try {
        await clauseLibrary.markClauseUsed(args.clauseId, ctx.user.organizationId);
        return true;
      } catch (error: any) {
        throw new GraphQLError(`Clause marking failed: ${error.message}`);
      }
    },
  }),

  // ===== FIXTURE APPROVAL WORKFLOW =====

  createFixtureWorkflow: t.field({
    type: 'String',
    args: {
      fixtureId: t.arg.string({ required: true }),
      amount: t.arg.float({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      try {
        return await fixtureApprovalWorkflow.createWorkflow(
          args.fixtureId,
          args.amount,
          ctx.user.id,
          ctx.user.organizationId
        );
      } catch (error: any) {
        throw new GraphQLError(`Workflow creation failed: ${error.message}`);
      }
    },
  }),

  approveFixtureStep: t.field({
    type: 'JSON',
    args: {
      workflowId: t.arg.string({ required: true }),
      stepNumber: t.arg.int({ required: true }),
      comments: t.arg.string(),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      try {
        return await fixtureApprovalWorkflow.approveStep(
          args.workflowId,
          args.stepNumber,
          ctx.user.id,
          args.comments ?? undefined
        );
      } catch (error: any) {
        throw new GraphQLError(`Fixture approval failed: ${error.message}`);
      }
    },
  }),

  rejectFixture: t.field({
    type: 'JSON',
    args: {
      workflowId: t.arg.string({ required: true }),
      reason: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      try {
        return await fixtureApprovalWorkflow.rejectFixture(
          args.workflowId,
          ctx.user.id,
          args.reason
        );
      } catch (error: any) {
        throw new GraphQLError(`Fixture rejection failed: ${error.message}`);
      }
    },
  }),

  generateCharterParty: t.field({
    type: 'String',
    args: {
      workflowId: t.arg.string({ required: true }),
      template: t.arg.string({ required: true }),
      data: t.arg({ type: 'JSON', required: true }),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      try {
        return await fixtureApprovalWorkflow.generateCharterParty(
          args.workflowId,
          args.template,
          args.data as any,
          ctx.user.organizationId
        );
      } catch (error: any) {
        throw new GraphQLError(`Charter party generation failed: ${error.message}`);
      }
    },
  }),

  // ===== FIXTURE RECAP =====

  generateFixtureRecap: t.field({
    type: 'JSON',
    args: {
      fixtureData: t.arg({ type: 'JSON', required: true }),
    },
    resolve: async (root, args) => {
      try {
        return generateFixtureRecap(args.fixtureData as any);
      } catch (error: any) {
        throw new GraphQLError(`Fixture recap generation failed: ${error.message}`);
      }
    },
  }),
}));
