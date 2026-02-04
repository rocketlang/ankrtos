/**
 * FDA Dispute Resolution GraphQL Schema
 * Phase 6: DA Desk & Port Agency
 */

import { builder } from '../builder.js';
import { prisma } from '../../lib/prisma.js';
import { fdaDisputeService } from '../../services/fda-dispute-service.js';

// ========================================
// OBJECT TYPES
// ========================================

const FdaDispute = builder.prismaObject('FdaDispute', {
  fields: (t) => ({
    id: t.exposeID('id'),
    disbursementAccountId: t.exposeString('disbursementAccountId'),
    disbursementAccount: t.relation('disbursementAccount'),
    lineItemId: t.exposeString('lineItemId', { nullable: true }),
    disputeType: t.exposeString('disputeType'),
    status: t.exposeString('status'),
    priority: t.exposeString('priority'),
    expectedAmount: t.exposeFloat('expectedAmount'),
    actualAmount: t.exposeFloat('actualAmount'),
    varianceAmount: t.exposeFloat('varianceAmount'),
    variancePercent: t.exposeFloat('variancePercent'),
    disputeReason: t.exposeString('disputeReason'),
    resolution: t.exposeString('resolution', { nullable: true }),
    resolvedAmount: t.exposeFloat('resolvedAmount', { nullable: true }),
    resolutionNotes: t.exposeString('resolutionNotes', { nullable: true }),
    resolvedBy: t.exposeString('resolvedBy', { nullable: true }),
    resolvedAt: t.expose('resolvedAt', { type: 'DateTime', nullable: true }),
    comments: t.relation('comments'),
    attachments: t.relation('attachments'),
    createdBy: t.exposeString('createdBy'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

const FdaDisputeComment = builder.prismaObject('FdaDisputeComment', {
  fields: (t) => ({
    id: t.exposeID('id'),
    disputeId: t.exposeString('disputeId'),
    dispute: t.relation('dispute'),
    userId: t.exposeString('userId'),
    role: t.exposeString('role'),
    comment: t.exposeString('comment'),
    isInternal: t.exposeBoolean('isInternal'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

const FdaDisputeAttachment = builder.prismaObject('FdaDisputeAttachment', {
  fields: (t) => ({
    id: t.exposeID('id'),
    disputeId: t.exposeString('disputeId'),
    dispute: t.relation('dispute'),
    fileName: t.exposeString('fileName'),
    fileUrl: t.exposeString('fileUrl'),
    fileType: t.exposeString('fileType'),
    uploadedBy: t.exposeString('uploadedBy'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

const DisputeSummary = builder.objectRef<{
  totalDisputes: number;
  openDisputes: number;
  resolvedDisputes: number;
  totalDisputedAmount: number;
  totalResolvedAmount: number;
  savingsAchieved: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  averageResolutionTime: number;
}>('DisputeSummary').implement({
  fields: (t) => ({
    totalDisputes: t.exposeInt('totalDisputes'),
    openDisputes: t.exposeInt('openDisputes'),
    resolvedDisputes: t.exposeInt('resolvedDisputes'),
    totalDisputedAmount: t.exposeFloat('totalDisputedAmount'),
    totalResolvedAmount: t.exposeFloat('totalResolvedAmount'),
    savingsAchieved: t.exposeFloat('savingsAchieved'),
    byType: t.field({ type: 'JSON', resolve: (parent) => parent.byType }),
    byStatus: t.field({ type: 'JSON', resolve: (parent) => parent.byStatus }),
    averageResolutionTime: t.exposeFloat('averageResolutionTime'),
  }),
});

// ========================================
// INPUT TYPES
// ========================================

const DisputeCreateInput = builder.inputType('DisputeCreateInput', {
  fields: (t) => ({
    disbursementAccountId: t.string({ required: true }),
    lineItemId: t.string(),
    disputeType: t.string({ required: true }),
    expectedAmount: t.float({ required: true }),
    actualAmount: t.float({ required: true }),
    disputeReason: t.string({ required: true }),
    priority: t.string(),
  }),
});

const DisputeResolutionInput = builder.inputType('DisputeResolutionInput', {
  fields: (t) => ({
    resolution: t.string({ required: true }),
    resolvedAmount: t.float({ required: true }),
    resolutionNotes: t.string({ required: true }),
  }),
});

const DisputeCommentInput = builder.inputType('DisputeCommentInput', {
  fields: (t) => ({
    disputeId: t.string({ required: true }),
    role: t.string({ required: true }),
    comment: t.string({ required: true }),
    isInternal: t.boolean({ defaultValue: false }),
  }),
});

const DisputeAttachmentInput = builder.inputType('DisputeAttachmentInput', {
  fields: (t) => ({
    disputeId: t.string({ required: true }),
    fileName: t.string({ required: true }),
    fileUrl: t.string({ required: true }),
    fileType: t.string({ required: true }),
  }),
});

// ========================================
// QUERIES
// ========================================

builder.queryFields((t) => ({
  fdaDispute: t.field({
    type: FdaDispute,
    nullable: true,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await fdaDisputeService.getDispute(args.id);
    },
  }),

  fdaDisputesForDA: t.field({
    type: [FdaDispute],
    args: {
      daId: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await fdaDisputeService.getDisputesForDA(args.daId);
    },
  }),

  fdaDisputeSummary: t.field({
    type: DisputeSummary,
    args: {
      timeframe: t.arg.string({ defaultValue: 'month' }),
    },
    resolve: async (root, args, ctx) => {
      const timeframe = args.timeframe as 'week' | 'month' | 'quarter' | 'year';
      return await fdaDisputeService.getDisputeSummary(
        ctx.user!.organizationId,
        timeframe
      );
    },
  }),

  allFdaDisputes: t.field({
    type: [FdaDispute],
    args: {
      status: t.arg.string(),
      priority: t.arg.string(),
      limit: t.arg.int({ defaultValue: 50 }),
    },
    resolve: async (root, args, ctx) => {
      const where: any = {
        disbursementAccount: {
          voyage: {
            vessel: {
              organizationId: ctx.user!.organizationId,
            },
          },
        },
      };

      if (args.status) where.status = args.status;
      if (args.priority) where.priority = args.priority;

      return await prisma.fdaDispute.findMany({
        where,
        take: args.limit,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          disbursementAccount: {
            include: {
              voyage: { include: { vessel: true } },
              port: true,
            },
          },
          comments: { take: 1, orderBy: { createdAt: 'desc' } },
        },
      });
    },
  }),
}));

// ========================================
// MUTATIONS
// ========================================

builder.mutationFields((t) => ({
  createFdaDispute: t.field({
    type: FdaDispute,
    authScopes: { operator: true },
    args: {
      input: t.arg({ type: DisputeCreateInput, required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await fdaDisputeService.createDispute(
        args.input as any,
        ctx.user!.id
      );
    },
  }),

  addDisputeComment: t.field({
    type: 'Boolean',
    args: {
      input: t.arg({ type: DisputeCommentInput, required: true }),
    },
    resolve: async (root, args, ctx) => {
      await fdaDisputeService.addComment(
        args.input.disputeId,
        ctx.user!.id,
        args.input.role as any,
        args.input.comment,
        args.input.isInternal
      );
      return true;
    },
  }),

  addDisputeAttachment: t.field({
    type: 'Boolean',
    args: {
      input: t.arg({ type: DisputeAttachmentInput, required: true }),
    },
    resolve: async (root, args, ctx) => {
      await fdaDisputeService.addAttachment(
        args.input.disputeId,
        args.input.fileName,
        args.input.fileUrl,
        args.input.fileType as any,
        ctx.user!.id
      );
      return true;
    },
  }),

  resolveFdaDispute: t.field({
    type: FdaDispute,
    authScopes: { manager: true },
    args: {
      id: t.arg.id({ required: true }),
      resolution: t.arg({ type: DisputeResolutionInput, required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await fdaDisputeService.resolveDispute(
        args.id,
        args.resolution as any,
        ctx.user!.id
      );
    },
  }),

  escalateFdaDispute: t.field({
    type: FdaDispute,
    authScopes: { operator: true },
    args: {
      id: t.arg.id({ required: true }),
      reason: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await fdaDisputeService.escalateDispute(
        args.id,
        args.reason,
        ctx.user!.id
      );
    },
  }),

  closeFdaDispute: t.field({
    type: FdaDispute,
    authScopes: { manager: true },
    args: {
      id: t.arg.id({ required: true }),
      reason: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await fdaDisputeService.closeDispute(
        args.id,
        args.reason,
        ctx.user!.id
      );
    },
  }),

  autoResolveFdaDisputes: t.field({
    type: 'Int',
    authScopes: { admin: true },
    resolve: async (root, args, ctx) => {
      return await fdaDisputeService.autoResolveDisputes(ctx.user!.organizationId);
    },
  }),
}));
