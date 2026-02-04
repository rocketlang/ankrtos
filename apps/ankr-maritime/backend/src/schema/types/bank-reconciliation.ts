/**
 * Bank Reconciliation GraphQL Schema
 * Phase 6: DA Desk & Port Agency
 */

import { builder } from '../builder.js';
import { bankReconciliationService } from '../../services/bank-reconciliation-service.js';

// ========================================
// OBJECT TYPES
// ========================================

const BankTransaction = builder.objectRef<{
  date: Date;
  description: string;
  debit?: number;
  credit?: number;
  balance: number;
  reference?: string;
  currency: string;
}>('BankTransaction').implement({
  fields: (t) => ({
    date: t.expose('date', { type: 'DateTime' }),
    description: t.exposeString('description'),
    debit: t.exposeFloat('debit', { nullable: true }),
    credit: t.exposeFloat('credit', { nullable: true }),
    balance: t.exposeFloat('balance'),
    reference: t.exposeString('reference', { nullable: true }),
    currency: t.exposeString('currency'),
  }),
});

const ReconciliationMatch = builder.objectRef<{
  fdaLineItemId: string;
  transactionId: string;
  matchConfidence: number;
  matchType: string;
  variance: number;
  status: string;
}>('ReconciliationMatch').implement({
  fields: (t) => ({
    fdaLineItemId: t.exposeString('fdaLineItemId'),
    transactionId: t.exposeString('transactionId'),
    matchConfidence: t.exposeFloat('matchConfidence'),
    matchType: t.exposeString('matchType'),
    variance: t.exposeFloat('variance'),
    status: t.exposeString('status'),
  }),
});

const ReconciliationReport = builder.objectRef<{
  fdaId: string;
  totalFdaAmount: number;
  totalBankAmount: number;
  matchedAmount: number;
  unmatchedFdaItems: any[];
  unmatchedTransactions: any[];
  matches: any[];
  reconciliationStatus: string;
  varianceAmount: number;
  variancePercent: number;
}>('ReconciliationReport').implement({
  fields: (t) => ({
    fdaId: t.exposeString('fdaId'),
    totalFdaAmount: t.exposeFloat('totalFdaAmount'),
    totalBankAmount: t.exposeFloat('totalBankAmount'),
    matchedAmount: t.exposeFloat('matchedAmount'),
    unmatchedFdaItems: t.field({
      type: 'JSON',
      resolve: (parent) => parent.unmatchedFdaItems,
    }),
    unmatchedTransactions: t.field({
      type: [BankTransaction],
      resolve: (parent) => parent.unmatchedTransactions,
    }),
    matches: t.field({
      type: [ReconciliationMatch],
      resolve: (parent) => parent.matches,
    }),
    reconciliationStatus: t.exposeString('reconciliationStatus'),
    varianceAmount: t.exposeFloat('varianceAmount'),
    variancePercent: t.exposeFloat('variancePercent'),
  }),
});

const ReconciliationSummary = builder.objectRef<{
  totalFDAs: number;
  reconciledFDAs: number;
  partiallyReconciledFDAs: number;
  unreconciledFDAs: number;
  totalVariance: number;
  averageVariancePercent: number;
}>('ReconciliationSummary').implement({
  fields: (t) => ({
    totalFDAs: t.exposeInt('totalFDAs'),
    reconciledFDAs: t.exposeInt('reconciledFDAs'),
    partiallyReconciledFDAs: t.exposeInt('partiallyReconciledFDAs'),
    unreconciledFDAs: t.exposeInt('unreconciledFDAs'),
    totalVariance: t.exposeFloat('totalVariance'),
    averageVariancePercent: t.exposeFloat('averageVariancePercent'),
  }),
});

// ========================================
// INPUT TYPES
// ========================================

const BankTransactionInput = builder.inputType('BankTransactionInput', {
  fields: (t) => ({
    date: t.field({ type: 'DateTime', required: true }),
    description: t.string({ required: true }),
    debit: t.float(),
    credit: t.float(),
    balance: t.float({ required: true }),
    reference: t.string(),
    currency: t.string({ defaultValue: 'USD' }),
  }),
});

// ========================================
// QUERIES
// ========================================

builder.queryFields((t) => ({
  reconciliationSummary: t.field({
    type: ReconciliationSummary,
    args: {
      timeframe: t.arg.string({ defaultValue: 'month' }),
    },
    resolve: async (root, args, ctx) => {
      const timeframe = args.timeframe as 'week' | 'month' | 'quarter';
      return await bankReconciliationService.getReconciliationSummary(
        ctx.user!.organizationId,
        timeframe
      );
    },
  }),

  reconciliationHistory: t.field({
    type: 'JSON',
    args: {
      fdaId: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await bankReconciliationService.getReconciliationHistory(args.fdaId);
    },
  }),
}));

// ========================================
// MUTATIONS
// ========================================

builder.mutationFields((t) => ({
  reconcileFDA: t.field({
    type: ReconciliationReport,
    authScopes: { operator: true },
    args: {
      fdaId: t.arg.string({ required: true }),
      transactions: t.arg({ type: [BankTransactionInput], required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await bankReconciliationService.reconcileFDA(
        args.fdaId,
        args.transactions as any
      );
    },
  }),

  manualMatchTransaction: t.field({
    type: ReconciliationMatch,
    authScopes: { operator: true },
    args: {
      fdaLineItemId: t.arg.string({ required: true }),
      transactionId: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await bankReconciliationService.manualMatch(
        args.fdaLineItemId,
        args.transactionId,
        ctx.user!.id
      );
    },
  }),

  bulkReconcile: t.field({
    type: [ReconciliationReport],
    authScopes: { manager: true },
    args: {
      fdaIds: t.arg.stringList({ required: true }),
      transactions: t.arg({ type: [BankTransactionInput], required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await bankReconciliationService.bulkReconcile(
        args.fdaIds,
        args.transactions as any
      );
    },
  }),

  generateReconciliationReport: t.field({
    type: 'String',
    authScopes: { operator: true },
    args: {
      fdaId: t.arg.string({ required: true }),
      transactions: t.arg({ type: [BankTransactionInput], required: true }),
      format: t.arg.string({ defaultValue: 'pdf' }),
    },
    resolve: async (root, args, ctx) => {
      const reconciliation = await bankReconciliationService.reconcileFDA(
        args.fdaId,
        args.transactions as any
      );
      return await bankReconciliationService.generateReport(
        reconciliation,
        args.format as 'pdf' | 'excel'
      );
    },
  }),
}));
