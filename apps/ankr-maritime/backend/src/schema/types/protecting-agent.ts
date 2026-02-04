/**
 * Protecting Agent GraphQL Schema
 * Phase 6: DA Desk & Port Agency
 */

import { builder } from '../builder.js';
import { protectingAgentService } from '../../services/protecting-agent-service.js';

// ========================================
// OBJECT TYPES
// ========================================

const ProtectingAgentDesignation = builder.objectRef<{
  id: string;
  agentId: string;
  portId: string;
  territory?: string;
  exclusivityStartDate: Date;
  exclusivityEndDate: Date;
  commissionRate: number;
  status: string;
  nominatedBy: string;
  approvedBy?: string;
  approvedAt?: Date;
}>('ProtectingAgentDesignation').implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    agentId: t.exposeString('agentId'),
    portId: t.exposeString('portId'),
    territory: t.exposeString('territory', { nullable: true }),
    exclusivityStartDate: t.expose('exclusivityStartDate', { type: 'DateTime' }),
    exclusivityEndDate: t.expose('exclusivityEndDate', { type: 'DateTime' }),
    commissionRate: t.exposeFloat('commissionRate'),
    status: t.exposeString('status'),
    nominatedBy: t.exposeString('nominatedBy'),
    approvedBy: t.exposeString('approvedBy', { nullable: true }),
    approvedAt: t.expose('approvedAt', { type: 'DateTime', nullable: true }),
  }),
});

const ProtectedCommission = builder.objectRef<{
  protectingAgent: any | null;
  commissionRate: number;
  baseAmount: number;
  commissionAmount: number;
  isProtected: boolean;
}>('ProtectedCommission').implement({
  fields: (t) => ({
    protectingAgent: t.field({ type: 'JSON', resolve: (p) => p.protectingAgent, nullable: true }),
    commissionRate: t.exposeFloat('commissionRate'),
    baseAmount: t.exposeFloat('baseAmount'),
    commissionAmount: t.exposeFloat('commissionAmount'),
    isProtected: t.exposeBoolean('isProtected'),
  }),
});

const AgentPerformance = builder.objectRef<{
  totalDesignations: number;
  activeDesignations: number;
  totalCommissionEarned: number;
  averageCommissionRate: number;
  portsCovered: number;
}>('AgentPerformance').implement({
  fields: (t) => ({
    totalDesignations: t.exposeInt('totalDesignations'),
    activeDesignations: t.exposeInt('activeDesignations'),
    totalCommissionEarned: t.exposeFloat('totalCommissionEarned'),
    averageCommissionRate: t.exposeFloat('averageCommissionRate'),
    portsCovered: t.exposeInt('portsCovered'),
  }),
});

// ========================================
// QUERIES
// ========================================

builder.queryFields((t) => ({
  protectingAgent: t.field({
    type: 'JSON',
    nullable: true,
    args: {
      portId: t.arg.string({ required: true }),
      territory: t.arg.string(),
    },
    resolve: async (root, args, ctx) => {
      return await protectingAgentService.getProtectingAgent(
        args.portId,
        args.territory || undefined
      );
    },
  }),

  protectedCommission: t.field({
    type: ProtectedCommission,
    args: {
      voyageId: t.arg.string({ required: true }),
      portId: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await protectingAgentService.calculateProtectedCommission(
        args.voyageId,
        args.portId
      );
    },
  }),

  expiringDesignations: t.field({
    type: 'JSON',
    args: {
      daysAhead: t.arg.int({ defaultValue: 60 }),
    },
    resolve: async (root, args, ctx) => {
      return await protectingAgentService.getExpiringDesignations(
        ctx.user!.organizationId,
        args.daysAhead
      );
    },
  }),

  designationHistory: t.field({
    type: 'JSON',
    args: {
      portId: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await protectingAgentService.getDesignationHistory(args.portId);
    },
  }),

  agentPerformance: t.field({
    type: AgentPerformance,
    args: {
      agentId: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await protectingAgentService.getAgentPerformance(
        args.agentId,
        ctx.user!.organizationId
      );
    },
  }),
}));

// ========================================
// MUTATIONS
// ========================================

builder.mutationFields((t) => ({
  nominateProtectingAgent: t.field({
    type: 'JSON',
    authScopes: { manager: true },
    args: {
      agentId: t.arg.string({ required: true }),
      portId: t.arg.string({ required: true }),
      exclusivityMonths: t.arg.int({ required: true }),
      commissionRate: t.arg.float({ required: true }),
      territory: t.arg.string(),
    },
    resolve: async (root, args, ctx) => {
      return await protectingAgentService.nominateProtectingAgent(
        args.agentId,
        args.portId,
        args.exclusivityMonths,
        args.commissionRate,
        args.territory || undefined,
        ctx.user!.id,
        ctx.user!.organizationId
      );
    },
  }),

  revokeDesignation: t.field({
    type: 'JSON',
    authScopes: { manager: true },
    args: {
      designationId: t.arg.string({ required: true }),
      reason: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await protectingAgentService.revokeDesignation(
        args.designationId,
        args.reason,
        ctx.user!.id
      );
    },
  }),

  createDesignationDispute: t.field({
    type: 'JSON',
    args: {
      designationId: t.arg.string({ required: true }),
      disputeReason: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await protectingAgentService.createDispute(
        args.designationId,
        args.disputeReason,
        ctx.user!.id
      );
    },
  }),
}));
