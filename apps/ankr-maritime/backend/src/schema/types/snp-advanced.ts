/**
 * S&P Advanced Features GraphQL Schema
 * Phase 4: Ship Broking & S&P
 */

import { builder } from '../builder.js';
import { GraphQLError } from 'graphql';
import { snpSubjectResolutionService } from '../../services/snp-subject-resolution.js';
import { comparableSalesDBService } from '../../services/comparable-sales-db.js';
import { snpMarketingCircularService } from '../../services/snp-marketing-circular.js';
import {
  comparableValuation,
  dcfValuation,
  replacementCostValuation,
  scrapValuation,
  ensembleValuation,
  type VesselSpec,
  type ComparableSale,
  type TCParams
} from '../../services/snp-valuation.js';

// ========================================
// OBJECT TYPES
// ========================================

const Subject = builder.objectRef<{
  id: string;
  transactionId: string;
  type: string;
  description: string;
  party: string;
  deadline: Date;
  status: string;
  evidence?: string;
  releasedBy?: string;
  releasedAt?: Date;
  notes?: string;
  createdAt: Date;
}>('SNPSubject').implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    transactionId: t.exposeString('transactionId'),
    type: t.exposeString('type'),
    description: t.exposeString('description'),
    party: t.exposeString('party'),
    deadline: t.expose('deadline', { type: 'DateTime' }),
    status: t.exposeString('status'),
    evidence: t.exposeString('evidence', { nullable: true }),
    releasedBy: t.exposeString('releasedBy', { nullable: true }),
    releasedAt: t.expose('releasedAt', { type: 'DateTime', nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

const SubjectsSummary = builder.objectRef<{
  total: number;
  pending: number;
  satisfied: number;
  waived: number;
  failed: number;
  expired: number;
  nextDeadline?: Date;
  criticalSubjects: any[];
}>('SubjectsSummary').implement({
  fields: (t) => ({
    total: t.exposeInt('total'),
    pending: t.exposeInt('pending'),
    satisfied: t.exposeInt('satisfied'),
    waived: t.exposeInt('waived'),
    failed: t.exposeInt('failed'),
    expired: t.exposeInt('expired'),
    nextDeadline: t.expose('nextDeadline', { type: 'DateTime', nullable: true }),
    criticalSubjects: t.field({
      type: [Subject],
      resolve: (parent) => parent.criticalSubjects,
    }),
  }),
});

const ComparableSale = builder.objectRef<{
  id: string;
  vesselName: string;
  vesselType: string;
  dwt: number;
  built: number;
  flag: string;
  builder: string;
  salePrice: number;
  currency: string;
  saleDate: Date;
  deliveryDate?: Date;
  buyer?: string;
  seller?: string;
  source: string;
  verified: boolean;
  notes?: string;
  createdAt: Date;
}>('ComparableSale').implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    vesselName: t.exposeString('vesselName'),
    vesselType: t.exposeString('vesselType'),
    dwt: t.exposeInt('dwt'),
    built: t.exposeInt('built'),
    flag: t.exposeString('flag'),
    builder: t.exposeString('builder'),
    salePrice: t.exposeFloat('salePrice'),
    currency: t.exposeString('currency'),
    saleDate: t.expose('saleDate', { type: 'DateTime' }),
    deliveryDate: t.expose('deliveryDate', { type: 'DateTime', nullable: true }),
    buyer: t.exposeString('buyer', { nullable: true }),
    seller: t.exposeString('seller', { nullable: true }),
    source: t.exposeString('source'),
    verified: t.exposeBoolean('verified'),
    notes: t.exposeString('notes', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

const ComparableMatch = builder.objectRef<{
  sale: any;
  matchScore: number;
  matchFactors: any;
  adjustedPrice: number;
  adjustment: number;
}>('ComparableMatch').implement({
  fields: (t) => ({
    sale: t.field({ type: ComparableSale, resolve: (p) => p.sale }),
    matchScore: t.exposeFloat('matchScore'),
    matchFactors: t.field({ type: 'JSON', resolve: (p) => p.matchFactors }),
    adjustedPrice: t.exposeFloat('adjustedPrice'),
    adjustment: t.exposeFloat('adjustment'),
  }),
});

const MarketStatistics = builder.objectRef<{
  totalSales: number;
  averagePrice: number;
  priceRange: { min: number; max: number };
  avgAge: number;
  avgDwt: number;
  topBuyers: { name: string; count: number }[];
  priceByAge: { age: number; avgPrice: number }[];
}>('MarketStatistics').implement({
  fields: (t) => ({
    totalSales: t.exposeInt('totalSales'),
    averagePrice: t.exposeFloat('averagePrice'),
    priceRange: t.field({ type: 'JSON', resolve: (p) => p.priceRange }),
    avgAge: t.exposeFloat('avgAge'),
    avgDwt: t.exposeFloat('avgDwt'),
    topBuyers: t.field({ type: 'JSON', resolve: (p) => p.topBuyers }),
    priceByAge: t.field({ type: 'JSON', resolve: (p) => p.priceByAge }),
  }),
});

// ========================================
// QUERIES
// ========================================

builder.queryFields((t) => ({
  snpSubjects: t.field({
    type: [Subject],
    args: {
      transactionId: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await snpSubjectResolutionService.getSubjects(args.transactionId);
    },
  }),

  snpSubjectsSummary: t.field({
    type: SubjectsSummary,
    args: {
      transactionId: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await snpSubjectResolutionService.getSubjectsSummary(args.transactionId);
    },
  }),

  comparableSales: t.field({
    type: [ComparableMatch],
    args: {
      vesselType: t.arg.string({ required: true }),
      dwt: t.arg.int({ required: true }),
      built: t.arg.int({ required: true }),
      limit: t.arg.int({ defaultValue: 10 }),
    },
    resolve: async (root, args, ctx) => {
      return await comparableSalesDBService.findComparables(
        args.vesselType,
        args.dwt,
        args.built,
        args.limit
      );
    },
  }),

  snpMarketStatistics: t.field({
    type: MarketStatistics,
    args: {
      vesselType: t.arg.string({ required: true }),
      months: t.arg.int({ defaultValue: 12 }),
    },
    resolve: async (root, args, ctx) => {
      return await comparableSalesDBService.getMarketStatistics(
        args.vesselType,
        args.months
      );
    },
  }),

  // ========================================
  // VESSEL VALUATION ENDPOINTS (Pure Functions)
  // ========================================

  vesselComparableValuation: t.field({
    type: 'JSON',
    args: {
      vesselSpec: t.arg({ type: 'JSON', required: true }),
      comparables: t.arg({ type: 'JSON', required: true }),
    },
    resolve: async (root, args) => {
      try {
        return comparableValuation(
          args.vesselSpec as VesselSpec,
          args.comparables as ComparableSale[]
        );
      } catch (error: any) {
        throw new GraphQLError(`Comparable valuation failed: ${error.message}`);
      }
    },
  }),

  vesselDCFValuation: t.field({
    type: 'JSON',
    args: {
      vesselSpec: t.arg({ type: 'JSON', required: true }),
      dailyTCE: t.arg.float({ required: true }),
      opex: t.arg.float({ required: true }),
      remainingLifeYears: t.arg.float({ required: true }),
      discountRate: t.arg.float({ required: true }),
    },
    resolve: async (root, args) => {
      try {
        return dcfValuation(
          args.vesselSpec as VesselSpec,
          args.dailyTCE,
          args.opex,
          args.remainingLifeYears,
          args.discountRate
        );
      } catch (error: any) {
        throw new GraphQLError(`DCF valuation failed: ${error.message}`);
      }
    },
  }),

  vesselReplacementCostValuation: t.field({
    type: 'JSON',
    args: {
      vesselSpec: t.arg({ type: 'JSON', required: true }),
      newbuildPrice: t.arg.float({ required: true }),
      economicLife: t.arg.float(),
    },
    resolve: async (root, args) => {
      try {
        return replacementCostValuation(
          args.vesselSpec as VesselSpec,
          args.newbuildPrice,
          args.economicLife ?? undefined
        );
      } catch (error: any) {
        throw new GraphQLError(`Replacement cost valuation failed: ${error.message}`);
      }
    },
  }),

  vesselScrapValuation: t.field({
    type: 'JSON',
    args: {
      vesselSpec: t.arg({ type: 'JSON', required: true }),
      ldtPrice: t.arg.float({ required: true }),
    },
    resolve: async (root, args) => {
      try {
        return scrapValuation(
          args.vesselSpec as VesselSpec,
          args.ldtPrice
        );
      } catch (error: any) {
        throw new GraphQLError(`Scrap valuation failed: ${error.message}`);
      }
    },
  }),

  vesselEnsembleValuation: t.field({
    type: 'JSON',
    args: {
      vesselSpec: t.arg({ type: 'JSON', required: true }),
      comparables: t.arg({ type: 'JSON', required: true }),
      dailyTCE: t.arg.float({ required: true }),
      opex: t.arg.float({ required: true }),
      remainingLifeYears: t.arg.float({ required: true }),
      discountRate: t.arg.float({ required: true }),
      newbuildPrice: t.arg.float({ required: true }),
      ldtPrice: t.arg.float({ required: true }),
    },
    resolve: async (root, args) => {
      try {
        const tcParams: TCParams = {
          dailyTCE: args.dailyTCE,
          opex: args.opex,
          remainingLifeYears: args.remainingLifeYears,
          discountRate: args.discountRate,
        };

        return ensembleValuation(
          args.vesselSpec as VesselSpec,
          args.comparables as ComparableSale[],
          tcParams,
          args.newbuildPrice,
          args.ldtPrice
        );
      } catch (error: any) {
        throw new GraphQLError(`Ensemble valuation failed: ${error.message}`);
      }
    },
  }),
}));

// ========================================
// MUTATIONS
// ========================================

builder.mutationFields((t) => ({
  createSubject: t.field({
    type: Subject,
    authScopes: { operator: true },
    args: {
      transactionId: t.arg.string({ required: true }),
      type: t.arg.string({ required: true }),
      description: t.arg.string({ required: true }),
      party: t.arg.string({ required: true }),
      deadlineHours: t.arg.int({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await snpSubjectResolutionService.createSubject(
        args.transactionId,
        args.type,
        args.description,
        args.party,
        args.deadlineHours,
        ctx.user!.id
      );
    },
  }),

  releaseSubject: t.field({
    type: Subject,
    authScopes: { operator: true },
    args: {
      subjectId: t.arg.string({ required: true }),
      evidence: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await snpSubjectResolutionService.releaseSubject(
        args.subjectId,
        args.evidence,
        ctx.user!.id
      );
    },
  }),

  waiveSubject: t.field({
    type: Subject,
    authScopes: { operator: true },
    args: {
      subjectId: t.arg.string({ required: true }),
      reason: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await snpSubjectResolutionService.waiveSubject(
        args.subjectId,
        args.reason,
        ctx.user!.id
      );
    },
  }),

  failSubject: t.field({
    type: Subject,
    authScopes: { operator: true },
    args: {
      subjectId: t.arg.string({ required: true }),
      reason: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await snpSubjectResolutionService.failSubject(
        args.subjectId,
        args.reason,
        ctx.user!.id
      );
    },
  }),

  generateMarketingCircular: t.field({
    type: 'String',
    authScopes: { operator: true },
    args: {
      listingId: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      const circular = await snpMarketingCircularService.generateCircular(args.listingId);
      return await snpMarketingCircularService.generatePDF(circular);
    },
  }),

  distributeCircular: t.field({
    type: 'JSON',
    authScopes: { operator: true },
    args: {
      circularId: t.arg.string({ required: true }),
      recipients: t.arg.stringList({ required: true }),
      customMessage: t.arg.string(),
    },
    resolve: async (root, args, ctx) => {
      return await snpMarketingCircularService.distributeCircular(
        args.circularId,
        args.recipients,
        args.customMessage || undefined
      );
    },
  }),
}));
