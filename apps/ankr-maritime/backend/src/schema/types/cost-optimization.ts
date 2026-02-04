/**
 * Cost Optimization GraphQL Schema
 * Phase 6: DA Desk & Port Agency
 */

import { builder } from '../builder.js';
import { costOptimizationService } from '../../services/cost-optimization-service.js';

// ========================================
// OBJECT TYPES
// ========================================

const OptimizationRecommendation = builder.objectRef<{
  type: string;
  title: string;
  description: string;
  currentCost: number;
  optimizedCost: number;
  savings: number;
  savingsPercent: number;
  confidence: number;
  priority: string;
  implementationSteps: string[];
  risks: string[];
  estimatedImplementationTime: string;
  details: any;
}>('OptimizationRecommendation').implement({
  fields: (t) => ({
    type: t.exposeString('type'),
    title: t.exposeString('title'),
    description: t.exposeString('description'),
    currentCost: t.exposeFloat('currentCost'),
    optimizedCost: t.exposeFloat('optimizedCost'),
    savings: t.exposeFloat('savings'),
    savingsPercent: t.exposeFloat('savingsPercent'),
    confidence: t.exposeFloat('confidence'),
    priority: t.exposeString('priority'),
    implementationSteps: t.exposeStringList('implementationSteps'),
    risks: t.exposeStringList('risks'),
    estimatedImplementationTime: t.exposeString('estimatedImplementationTime'),
    details: t.field({ type: 'JSON', resolve: (parent) => parent.details }),
  }),
});

const OptimizationReport = builder.objectRef<{
  voyageId?: string;
  portId?: string;
  totalCurrentCost: number;
  totalOptimizedCost: number;
  totalSavings: number;
  totalSavingsPercent: number;
  recommendations: any[];
  implementedRecommendations: number;
  actualSavingsAchieved: number;
}>('OptimizationReport').implement({
  fields: (t) => ({
    voyageId: t.exposeString('voyageId', { nullable: true }),
    portId: t.exposeString('portId', { nullable: true }),
    totalCurrentCost: t.exposeFloat('totalCurrentCost'),
    totalOptimizedCost: t.exposeFloat('totalOptimizedCost'),
    totalSavings: t.exposeFloat('totalSavings'),
    totalSavingsPercent: t.exposeFloat('totalSavingsPercent'),
    recommendations: t.field({
      type: [OptimizationRecommendation],
      resolve: (parent) => parent.recommendations,
    }),
    implementedRecommendations: t.exposeInt('implementedRecommendations'),
    actualSavingsAchieved: t.exposeFloat('actualSavingsAchieved'),
  }),
});

// ========================================
// QUERIES
// ========================================

builder.queryFields((t) => ({
  voyageOptimizations: t.field({
    type: OptimizationReport,
    args: {
      voyageId: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await costOptimizationService.generateVoyageOptimizations(
        args.voyageId,
        ctx.user!.organizationId
      );
    },
  }),

  portOptimizations: t.field({
    type: [OptimizationRecommendation],
    args: {
      portId: t.arg.string({ required: true }),
      vesselType: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await costOptimizationService.generatePortOptimizations(
        args.portId,
        args.vesselType,
        ctx.user!.organizationId
      );
    },
  }),
}));
