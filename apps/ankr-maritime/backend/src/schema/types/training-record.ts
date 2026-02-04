import { builder } from '../builder.js';

// ─── TrainingRecord PrismaObject ────────────────────────────────────────────

builder.prismaObject('TrainingRecord', {
  fields: (t) => ({
    id: t.exposeID('id'),
    employeeId: t.exposeString('employeeId', { nullable: true }),
    crewMemberId: t.exposeString('crewMemberId', { nullable: true }),
    employeeName: t.exposeString('employeeName'),
    trainingTitle: t.exposeString('trainingTitle'),
    category: t.exposeString('category'),
    provider: t.exposeString('provider', { nullable: true }),
    startDate: t.expose('startDate', { type: 'DateTime' }),
    endDate: t.expose('endDate', { type: 'DateTime', nullable: true }),
    duration: t.exposeFloat('duration', { nullable: true }),
    status: t.exposeString('status'),
    score: t.exposeFloat('score', { nullable: true }),
    passFail: t.exposeString('passFail', { nullable: true }),
    certificateRef: t.exposeString('certificateRef', { nullable: true }),
    expiresAt: t.expose('expiresAt', { type: 'DateTime', nullable: true }),
    cost: t.exposeFloat('cost', { nullable: true }),
    currency: t.exposeString('currency'),
    notes: t.exposeString('notes', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// ─── Custom Types: TrainingDashboard ────────────────────────────────────────

const TrainingCategoryCount = builder.objectRef<{
  category: string;
  count: number;
}>('TrainingCategoryCount');

TrainingCategoryCount.implement({
  fields: (t) => ({
    category: t.exposeString('category'),
    count: t.exposeInt('count'),
  }),
});

const TrainingDashboard = builder.objectRef<{
  totalTrainings: number;
  completedCount: number;
  upcomingCount: number;
  expiringSoon: number;
  byCategory: { category: string; count: number }[];
  complianceRate: number;
}>('TrainingDashboard');

TrainingDashboard.implement({
  fields: (t) => ({
    totalTrainings: t.exposeInt('totalTrainings'),
    completedCount: t.exposeInt('completedCount'),
    upcomingCount: t.exposeInt('upcomingCount'),
    expiringSoon: t.exposeInt('expiringSoon'),
    byCategory: t.field({
      type: [TrainingCategoryCount],
      resolve: (parent) => parent.byCategory,
    }),
    complianceRate: t.exposeFloat('complianceRate'),
  }),
});

// ─── Queries ────────────────────────────────────────────────────────────────

builder.queryField('trainingRecords', (t) =>
  t.prismaField({
    type: ['TrainingRecord'],
    args: {
      employeeId: t.arg.string(),
      category: t.arg.string(),
      status: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.trainingRecord.findMany({
        ...query,
        where: {
          ...ctx.orgFilter(),
          ...(args.employeeId ? { employeeId: args.employeeId } : {}),
          ...(args.category ? { category: args.category } : {}),
          ...(args.status ? { status: args.status } : {}),
        },
        orderBy: { startDate: 'desc' },
      }),
  }),
);

builder.queryField('trainingDashboard', (t) =>
  t.field({
    type: TrainingDashboard,
    resolve: async (_root, _args, ctx) => {
      const where = ctx.orgFilter();

      const allRecords = await ctx.prisma.trainingRecord.findMany({
        where,
        select: { category: true, status: true, expiresAt: true },
      });

      const totalTrainings = allRecords.length;
      const completedCount = allRecords.filter((r) => r.status === 'completed').length;
      const upcomingCount = allRecords.filter((r) => r.status === 'scheduled').length;

      // Expiring soon: completed records with expiresAt within 90 days
      const now = new Date();
      const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      const expiringSoon = allRecords.filter(
        (r) =>
          r.status === 'completed' &&
          r.expiresAt != null &&
          r.expiresAt >= now &&
          r.expiresAt <= ninetyDaysFromNow,
      ).length;

      // By category
      const categoryMap = new Map<string, number>();
      for (const r of allRecords) {
        categoryMap.set(r.category, (categoryMap.get(r.category) ?? 0) + 1);
      }
      const byCategory = Array.from(categoryMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      // Compliance rate: % of mandatory categories (SOLAS, MARPOL, ISM, ISPS, STCW, compliance) completed
      const mandatoryCategories = new Set(['SOLAS', 'MARPOL', 'ISM', 'ISPS', 'STCW', 'compliance']);
      const mandatoryRecords = allRecords.filter((r) => mandatoryCategories.has(r.category));
      const mandatoryCompleted = mandatoryRecords.filter((r) => r.status === 'completed').length;
      const complianceRate =
        mandatoryRecords.length > 0
          ? Math.round((mandatoryCompleted / mandatoryRecords.length) * 10000) / 100
          : 100;

      return {
        totalTrainings,
        completedCount,
        upcomingCount,
        expiringSoon,
        byCategory,
        complianceRate,
      };
    },
  }),
);

// ─── Mutations ──────────────────────────────────────────────────────────────

builder.mutationField('createTrainingRecord', (t) =>
  t.prismaField({
    type: 'TrainingRecord',
    args: {
      employeeId: t.arg.string(),
      crewMemberId: t.arg.string(),
      employeeName: t.arg.string({ required: true }),
      trainingTitle: t.arg.string({ required: true }),
      category: t.arg.string({ required: true }),
      provider: t.arg.string(),
      startDate: t.arg({ type: 'DateTime', required: true }),
      endDate: t.arg({ type: 'DateTime' }),
      duration: t.arg.float(),
      expiresAt: t.arg({ type: 'DateTime' }),
      cost: t.arg.float(),
      currency: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      return ctx.prisma.trainingRecord.create({
        ...query,
        data: {
          employeeId: args.employeeId ?? undefined,
          crewMemberId: args.crewMemberId ?? undefined,
          employeeName: args.employeeName,
          trainingTitle: args.trainingTitle,
          category: args.category,
          provider: args.provider ?? undefined,
          startDate: args.startDate,
          endDate: args.endDate ?? undefined,
          duration: args.duration ?? undefined,
          expiresAt: args.expiresAt ?? undefined,
          cost: args.cost ?? undefined,
          currency: args.currency ?? 'USD',
          notes: args.notes ?? undefined,
          organizationId: orgId,
        },
      });
    },
  }),
);

builder.mutationField('completeTraining', (t) =>
  t.prismaField({
    type: 'TrainingRecord',
    args: {
      id: t.arg.string({ required: true }),
      score: t.arg.float(),
      passFail: t.arg.string(),
      certificateRef: t.arg.string(),
      endDate: t.arg({ type: 'DateTime' }),
      expiresAt: t.arg({ type: 'DateTime' }),
      notes: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const record = await ctx.prisma.trainingRecord.findUniqueOrThrow({
        where: { id: args.id },
      });

      if (record.status === 'completed') {
        throw new Error('Training record is already completed');
      }

      if (record.status === 'cancelled') {
        throw new Error('Cannot complete a cancelled training record');
      }

      return ctx.prisma.trainingRecord.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'completed',
          score: args.score ?? undefined,
          passFail: args.passFail ?? undefined,
          certificateRef: args.certificateRef ?? undefined,
          endDate: args.endDate ?? new Date(),
          expiresAt: args.expiresAt ?? undefined,
          ...(args.notes ? { notes: args.notes } : {}),
        },
      });
    },
  }),
);

builder.mutationField('cancelTraining', (t) =>
  t.prismaField({
    type: 'TrainingRecord',
    args: {
      id: t.arg.string({ required: true }),
      reason: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const record = await ctx.prisma.trainingRecord.findUniqueOrThrow({
        where: { id: args.id },
      });

      if (record.status === 'completed') {
        throw new Error('Cannot cancel a completed training record');
      }

      if (record.status === 'cancelled') {
        throw new Error('Training record is already cancelled');
      }

      return ctx.prisma.trainingRecord.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'cancelled',
          notes: args.reason
            ? record.notes
              ? `${record.notes}\n[Cancelled] ${args.reason}`
              : `[Cancelled] ${args.reason}`
            : record.notes,
        },
      });
    },
  }),
);
