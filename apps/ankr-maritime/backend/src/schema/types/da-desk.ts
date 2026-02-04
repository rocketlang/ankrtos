import { builder } from '../builder.js';

builder.prismaObject('DisbursementAccount', {
  fields: (t) => ({
    id: t.exposeID('id'),
    voyageId: t.exposeString('voyageId'),
    portId: t.exposeString('portId'),
    type: t.exposeString('type'),
    status: t.exposeString('status'),
    currency: t.exposeString('currency'),
    totalAmount: t.exposeFloat('totalAmount'),
    notes: t.exposeString('notes', { nullable: true }),
    version: t.exposeInt('version'),
    parentId: t.exposeString('parentId', { nullable: true }),
    fundingStatus: t.exposeString('fundingStatus'),
    fundingAmount: t.exposeFloat('fundingAmount', { nullable: true }),
    fundedAt: t.expose('fundedAt', { type: 'DateTime', nullable: true }),
    varianceThreshold: t.exposeFloat('varianceThreshold'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.prismaObject('DaLineItem', {
  fields: (t) => ({
    id: t.exposeID('id'),
    disbursementAccountId: t.exposeString('disbursementAccountId'),
    category: t.exposeString('category'),
    description: t.exposeString('description'),
    amount: t.exposeFloat('amount'),
    currency: t.exposeString('currency'),
    tariffReference: t.exposeString('tariffReference', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
  }),
});

builder.queryField('disbursementAccounts', (t) =>
  t.prismaField({
    type: ['DisbursementAccount'],
    args: { voyageId: t.arg.string() },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.user?.organizationId;
      const where: Record<string, unknown> = {};
      if (args.voyageId) where.voyageId = args.voyageId;
      if (orgId) where.voyage = { vessel: { organizationId: orgId } };
      return ctx.prisma.disbursementAccount.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  }),
);

builder.queryField('daLineItems', (t) =>
  t.prismaField({
    type: ['DaLineItem'],
    args: { disbursementAccountId: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.daLineItem.findMany({
        ...query,
        where: { disbursementAccountId: args.disbursementAccountId },
      }),
  }),
);

builder.mutationField('createDisbursementAccount', (t) =>
  t.prismaField({
    type: 'DisbursementAccount',
    args: {
      voyageId: t.arg.string({ required: true }),
      portId: t.arg.string({ required: true }),
      type: t.arg.string({ required: true }), // pda or fda
      currency: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.disbursementAccount.create({
        ...query,
        data: {
          voyageId: args.voyageId,
          portId: args.portId,
          type: args.type,
          currency: args.currency ?? 'USD',
          notes: args.notes ?? undefined,
        },
      }),
  }),
);

builder.mutationField('addDaLineItem', (t) =>
  t.prismaField({
    type: 'DaLineItem',
    args: {
      disbursementAccountId: t.arg.string({ required: true }),
      category: t.arg.string({ required: true }),
      description: t.arg.string({ required: true }),
      amount: t.arg.float({ required: true }),
      currency: t.arg.string(),
      tariffReference: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const item = await ctx.prisma.daLineItem.create({
        ...query,
        data: {
          disbursementAccountId: args.disbursementAccountId,
          category: args.category,
          description: args.description,
          amount: args.amount,
          currency: args.currency ?? 'USD',
          tariffReference: args.tariffReference ?? undefined,
          notes: args.notes ?? undefined,
        },
      });

      // Recalculate DA total
      const allItems = await ctx.prisma.daLineItem.findMany({
        where: { disbursementAccountId: args.disbursementAccountId },
      });
      const total = allItems.reduce((sum, i) => sum + i.amount, 0);
      await ctx.prisma.disbursementAccount.update({
        where: { id: args.disbursementAccountId },
        data: { totalAmount: total },
      });

      return item;
    },
  }),
);

builder.mutationField('updateDaStatus', (t) =>
  t.prismaField({
    type: 'DisbursementAccount',
    args: {
      id: t.arg.string({ required: true }),
      status: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.disbursementAccount.update({
        ...query,
        where: { id: args.id },
        data: { status: args.status },
      }),
  }),
);

// === DA Auto-Approve Result Type ===

const DaAutoApproveResult = builder.objectRef<{
  approved: boolean;
  variance: number;
  threshold: number;
}>('DaAutoApproveResult');

DaAutoApproveResult.implement({
  fields: (t) => ({
    approved: t.exposeBoolean('approved'),
    variance: t.exposeFloat('variance'),
    threshold: t.exposeFloat('threshold'),
  }),
});

// === DA Version Comparison Type ===

const DaVersionComparison = builder.objectRef<{
  currentTotal: number;
  previousTotal: number;
  difference: number;
  percentChange: number;
  addedItems: string[];
  removedItems: string[];
  changedItems: string[];
}>('DaVersionComparison');

DaVersionComparison.implement({
  fields: (t) => ({
    currentTotal: t.exposeFloat('currentTotal'),
    previousTotal: t.exposeFloat('previousTotal'),
    difference: t.exposeFloat('difference'),
    percentChange: t.exposeFloat('percentChange'),
    addedItems: t.exposeStringList('addedItems'),
    removedItems: t.exposeStringList('removedItems'),
    changedItems: t.exposeStringList('changedItems'),
  }),
});

// === PDA Versioning, Funding & Variance Mutations ===

builder.mutationField('createDaVersion', (t) =>
  t.prismaField({
    type: 'DisbursementAccount',
    args: {
      parentId: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const parent = await ctx.prisma.disbursementAccount.findUniqueOrThrow({
        where: { id: args.parentId },
        include: { lineItems: true },
      });

      const newDa = await ctx.prisma.disbursementAccount.create({
        ...query,
        data: {
          voyageId: parent.voyageId,
          portId: parent.portId,
          type: parent.type,
          currency: parent.currency,
          notes: parent.notes,
          version: parent.version + 1,
          parentId: parent.id,
          status: 'draft',
        },
      });

      // Copy all line items from parent to new DA
      for (const item of parent.lineItems) {
        await ctx.prisma.daLineItem.create({
          data: {
            disbursementAccountId: newDa.id,
            category: item.category,
            description: item.description,
            amount: item.amount,
            currency: item.currency,
            tariffReference: item.tariffReference ?? undefined,
            notes: item.notes ?? undefined,
          },
        });
      }

      // Update total on new DA
      const total = parent.lineItems.reduce((sum, i) => sum + i.amount, 0);
      await ctx.prisma.disbursementAccount.update({
        where: { id: newDa.id },
        data: { totalAmount: total },
      });

      return newDa;
    },
  }),
);

builder.mutationField('requestDaFunding', (t) =>
  t.prismaField({
    type: 'DisbursementAccount',
    args: {
      id: t.arg.string({ required: true }),
      amount: t.arg.float({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.disbursementAccount.update({
        ...query,
        where: { id: args.id },
        data: {
          fundingStatus: 'requested',
          fundingAmount: args.amount,
        },
      }),
  }),
);

builder.mutationField('confirmDaFunding', (t) =>
  t.prismaField({
    type: 'DisbursementAccount',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.disbursementAccount.update({
        ...query,
        where: { id: args.id },
        data: {
          fundingStatus: 'funded',
          fundedAt: new Date(),
        },
      }),
  }),
);

builder.mutationField('autoApproveFda', (t) =>
  t.field({
    type: DaAutoApproveResult,
    args: {
      pdaId: t.arg.string({ required: true }),
      fdaId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const pda = await ctx.prisma.disbursementAccount.findUniqueOrThrow({
        where: { id: args.pdaId },
      });
      const fda = await ctx.prisma.disbursementAccount.findUniqueOrThrow({
        where: { id: args.fdaId },
      });

      const variance = Math.abs(fda.totalAmount - pda.totalAmount) / pda.totalAmount * 100;

      if (variance <= pda.varianceThreshold) {
        await ctx.prisma.disbursementAccount.update({
          where: { id: fda.id },
          data: { status: 'approved' },
        });
        return { approved: true, variance, threshold: pda.varianceThreshold };
      }

      return { approved: false, variance, threshold: pda.varianceThreshold };
    },
  }),
);

builder.mutationField('compareDaVersions', (t) =>
  t.field({
    type: DaVersionComparison,
    args: {
      currentId: t.arg.string({ required: true }),
      previousId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const current = await ctx.prisma.disbursementAccount.findUniqueOrThrow({
        where: { id: args.currentId },
        include: { lineItems: true },
      });
      const previous = await ctx.prisma.disbursementAccount.findUniqueOrThrow({
        where: { id: args.previousId },
        include: { lineItems: true },
      });

      const currentTotal = current.totalAmount;
      const previousTotal = previous.totalAmount;
      const difference = currentTotal - previousTotal;
      const percentChange = previousTotal !== 0 ? (difference / previousTotal) * 100 : 0;

      const currentCategories = new Set(current.lineItems.map((i) => i.category));
      const previousCategories = new Set(previous.lineItems.map((i) => i.category));

      const addedItems: string[] = [];
      const removedItems: string[] = [];
      const changedItems: string[] = [];

      for (const cat of currentCategories) {
        if (!previousCategories.has(cat)) {
          addedItems.push(cat);
        }
      }

      for (const cat of previousCategories) {
        if (!currentCategories.has(cat)) {
          removedItems.push(cat);
        }
      }

      // Categories present in both but with different amounts
      const currentAmountByCategory = new Map<string, number>();
      for (const item of current.lineItems) {
        currentAmountByCategory.set(
          item.category,
          (currentAmountByCategory.get(item.category) ?? 0) + item.amount,
        );
      }
      const previousAmountByCategory = new Map<string, number>();
      for (const item of previous.lineItems) {
        previousAmountByCategory.set(
          item.category,
          (previousAmountByCategory.get(item.category) ?? 0) + item.amount,
        );
      }

      for (const cat of currentCategories) {
        if (previousCategories.has(cat)) {
          const curAmt = currentAmountByCategory.get(cat) ?? 0;
          const prevAmt = previousAmountByCategory.get(cat) ?? 0;
          if (curAmt !== prevAmt) {
            changedItems.push(cat);
          }
        }
      }

      return {
        currentTotal,
        previousTotal,
        difference,
        percentChange,
        addedItems,
        removedItems,
        changedItems,
      };
    },
  }),
);

// === DA Version History Query ===

builder.queryField('daVersionHistory', (t) =>
  t.prismaField({
    type: ['DisbursementAccount'],
    args: {
      voyageId: t.arg.string({ required: true }),
      portId: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.disbursementAccount.findMany({
        ...query,
        where: {
          voyageId: args.voyageId,
          portId: args.portId,
        },
        orderBy: { version: 'desc' },
      }),
  }),
);
