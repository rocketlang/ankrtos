import { builder } from '../builder.js';
import {
  calculateCommencementTime,
  calculateExcludedHours,
  calculateLaytimeResult,
  calculateTimeBarDate,
  calculateReversibleLaytime,
} from '../../services/laytime-rules.js';

// === Laytime Calculation ===

builder.prismaObject('LaytimeCalculation', {
  fields: (t) => ({
    id: t.exposeID('id'),
    voyageId: t.exposeString('voyageId'),
    portId: t.exposeString('portId', { nullable: true }),
    type: t.exposeString('type'),
    allowedHours: t.exposeFloat('allowedHours'),
    usedHours: t.exposeFloat('usedHours'),
    demurrageRate: t.exposeFloat('demurrageRate', { nullable: true }),
    despatchRate: t.exposeFloat('despatchRate', { nullable: true }),
    currency: t.exposeString('currency'),
    result: t.exposeString('result'),
    amountDue: t.exposeFloat('amountDue'),
    norTendered: t.expose('norTendered', { type: 'DateTime', nullable: true }),
    norAccepted: t.expose('norAccepted', { type: 'DateTime', nullable: true }),
    commencedAt: t.expose('commencedAt', { type: 'DateTime', nullable: true }),
    completedAt: t.expose('completedAt', { type: 'DateTime', nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    commencementRule: t.exposeString('commencementRule'),
    exceptionRule: t.exposeString('exceptionRule'),
    reversible: t.exposeBoolean('reversible'),
    shiftingTimeIncluded: t.exposeBoolean('shiftingTimeIncluded'),
    noticeTimeHours: t.exposeFloat('noticeTimeHours'),
    timeBarDate: t.expose('timeBarDate', { type: 'DateTime', nullable: true }),
    timeBarDays: t.exposeInt('timeBarDays'),
    excludedHours: t.exposeFloat('excludedHours'),
    grossHours: t.exposeFloat('grossHours'),
    port: t.relation('port', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.prismaObject('StatementOfFactEntry', {
  fields: (t) => ({
    id: t.exposeID('id'),
    laytimeCalculationId: t.exposeString('laytimeCalculationId'),
    eventType: t.exposeString('eventType'),
    eventTime: t.expose('eventTime', { type: 'DateTime' }),
    timeUsed: t.exposeFloat('timeUsed'),
    excluded: t.exposeBoolean('excluded'),
    excludeReason: t.exposeString('excludeReason', { nullable: true }),
    remarks: t.exposeString('remarks', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

// === Queries ===

builder.queryField('laytimeCalculations', (t) =>
  t.prismaField({
    type: ['LaytimeCalculation'],
    args: { voyageId: t.arg.string() },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.laytimeCalculation.findMany({
        ...query,
        where: args.voyageId ? { voyageId: args.voyageId } : {},
        orderBy: { createdAt: 'desc' },
      }),
  }),
);

builder.queryField('laytimeCalculation', (t) =>
  t.prismaField({
    type: 'LaytimeCalculation',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.laytimeCalculation.findUnique({ ...query, where: { id: args.id } }),
  }),
);

builder.queryField('sofEntries', (t) =>
  t.prismaField({
    type: ['StatementOfFactEntry'],
    args: { laytimeCalculationId: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.statementOfFactEntry.findMany({
        ...query,
        where: { laytimeCalculationId: args.laytimeCalculationId },
        orderBy: { eventTime: 'asc' },
      }),
  }),
);

// === Mutations ===

builder.mutationField('createLaytimeCalculation', (t) =>
  t.prismaField({
    type: 'LaytimeCalculation',
    args: {
      voyageId: t.arg.string({ required: true }),
      portId: t.arg.string(),
      type: t.arg.string({ required: true }), // loading or discharging
      allowedHours: t.arg.float({ required: true }),
      demurrageRate: t.arg.float(),
      despatchRate: t.arg.float(),
      currency: t.arg.string(),
      commencementRule: t.arg.string(),
      exceptionRule: t.arg.string(),
      reversible: t.arg.boolean(),
      shiftingTimeIncluded: t.arg.boolean(),
      noticeTimeHours: t.arg.float(),
      timeBarDays: t.arg.int(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.laytimeCalculation.create({
        ...query,
        data: {
          voyageId: args.voyageId,
          portId: args.portId ?? undefined,
          type: args.type,
          allowedHours: args.allowedHours,
          demurrageRate: args.demurrageRate ?? undefined,
          despatchRate: args.despatchRate ?? undefined,
          currency: args.currency ?? 'USD',
          commencementRule: args.commencementRule ?? 'wibon',
          exceptionRule: args.exceptionRule ?? 'shinc',
          reversible: args.reversible ?? false,
          shiftingTimeIncluded: args.shiftingTimeIncluded ?? false,
          noticeTimeHours: args.noticeTimeHours ?? 6,
          timeBarDays: args.timeBarDays ?? 90,
        },
      }),
  }),
);

builder.mutationField('addSofEntry', (t) =>
  t.prismaField({
    type: 'StatementOfFactEntry',
    args: {
      laytimeCalculationId: t.arg.string({ required: true }),
      eventType: t.arg.string({ required: true }),
      eventTime: t.arg({ type: 'DateTime', required: true }),
      timeUsed: t.arg.float(),
      excluded: t.arg.boolean(),
      excludeReason: t.arg.string(),
      remarks: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const entry = await ctx.prisma.statementOfFactEntry.create({
        ...query,
        data: {
          laytimeCalculationId: args.laytimeCalculationId,
          eventType: args.eventType,
          eventTime: args.eventTime,
          timeUsed: args.timeUsed ?? 0,
          excluded: args.excluded ?? false,
          excludeReason: args.excludeReason ?? undefined,
          remarks: args.remarks ?? undefined,
        },
      });

      // Recalculate used hours & result
      await recalculateLaytime(ctx.prisma, args.laytimeCalculationId);

      return entry;
    },
  }),
);

builder.mutationField('updateLaytimeTimeline', (t) =>
  t.prismaField({
    type: 'LaytimeCalculation',
    args: {
      id: t.arg.string({ required: true }),
      norTendered: t.arg({ type: 'DateTime' }),
      norAccepted: t.arg({ type: 'DateTime' }),
      commencedAt: t.arg({ type: 'DateTime' }),
      completedAt: t.arg({ type: 'DateTime' }),
    },
    resolve: async (query, _root, args, ctx) => {
      const calc = await ctx.prisma.laytimeCalculation.update({
        ...query,
        where: { id: args.id },
        data: {
          norTendered: args.norTendered ?? undefined,
          norAccepted: args.norAccepted ?? undefined,
          commencedAt: args.commencedAt ?? undefined,
          completedAt: args.completedAt ?? undefined,
        },
      });

      // If we have commenced & completed, auto-calculate used hours
      if (calc.commencedAt && calc.completedAt) {
        const usedMs = calc.completedAt.getTime() - calc.commencedAt.getTime();
        const usedHours = usedMs / (1000 * 60 * 60);
        await recalculateLaytime(ctx.prisma, args.id, usedHours);
      }

      return ctx.prisma.laytimeCalculation.findUniqueOrThrow({ where: { id: args.id } });
    },
  }),
);

// === Apply Laytime Rules Mutation ===

builder.mutationField('applyLaytimeRules', (t) =>
  t.prismaField({
    type: 'LaytimeCalculation',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const calc = await ctx.prisma.laytimeCalculation.findUniqueOrThrow({
        where: { id: args.id },
      });

      if (!calc.norTendered || !calc.completedAt) {
        throw new Error('NOR tendered and completion times are required to apply rules');
      }

      // Calculate commencement
      const commencedAt = calculateCommencementTime(
        calc.norTendered,
        calc.commencementRule,
        calc.noticeTimeHours,
      );

      // Use commencedAt or actual if later
      const effectiveStart = calc.commencedAt && calc.commencedAt > commencedAt
        ? calc.commencedAt : commencedAt;

      // Calculate gross hours
      const grossMs = calc.completedAt.getTime() - effectiveStart.getTime();
      const grossHours = grossMs / (1000 * 60 * 60);

      // Get port holidays if port is set
      let portHolidays: { date: Date; affectsLaytime: boolean }[] = [];
      if (calc.portId) {
        portHolidays = await ctx.prisma.portHoliday.findMany({
          where: { portId: calc.portId },
        });
      }

      // Calculate excluded hours
      const { excludedHours } = calculateExcludedHours(
        effectiveStart,
        calc.completedAt,
        calc.exceptionRule,
        portHolidays,
      );

      // Calculate result
      const { usedHours, result, amountDue } = calculateLaytimeResult({
        allowedHours: calc.allowedHours,
        grossHours,
        excludedHours,
        demurrageRate: calc.demurrageRate,
        despatchRate: calc.despatchRate,
      });

      // Calculate time bar
      const timeBarDate = calculateTimeBarDate(calc.completedAt, calc.timeBarDays);

      return ctx.prisma.laytimeCalculation.update({
        ...query,
        where: { id: args.id },
        data: {
          commencedAt: effectiveStart,
          grossHours,
          excludedHours,
          usedHours,
          result,
          amountDue,
          timeBarDate,
        },
      });
    },
  }),
);

// === Reversible Laytime ===

const ReversibleLaytimeResultType = builder.objectRef<{
  totalAllowed: number;
  totalUsed: number;
  result: string;
  amountDue: number;
}>('ReversibleLaytimeResult');

builder.objectType(ReversibleLaytimeResultType, {
  fields: (t) => ({
    totalAllowed: t.exposeFloat('totalAllowed'),
    totalUsed: t.exposeFloat('totalUsed'),
    result: t.exposeString('result'),
    amountDue: t.exposeFloat('amountDue'),
  }),
});

builder.mutationField('calculateReversibleLaytimeForVoyage', (t) =>
  t.field({
    type: ReversibleLaytimeResultType,
    args: {
      voyageId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const calcs = await ctx.prisma.laytimeCalculation.findMany({
        where: { voyageId: args.voyageId, reversible: true },
      });
      return calculateReversibleLaytime(calcs.map((c) => ({
        allowedHours: c.allowedHours,
        usedHours: c.usedHours,
        demurrageRate: c.demurrageRate,
        despatchRate: c.despatchRate,
      })));
    },
  }),
);

// === Laytime Exclusions Query ===

const LaytimeExclusionType = builder.objectRef<{
  startTime: Date;
  endTime: Date;
  reason: string;
  hours: number;
}>('LaytimeExclusion');

builder.objectType(LaytimeExclusionType, {
  fields: (t) => ({
    startTime: t.expose('startTime', { type: 'DateTime' }),
    endTime: t.expose('endTime', { type: 'DateTime' }),
    reason: t.exposeString('reason'),
    hours: t.exposeFloat('hours'),
  }),
});

builder.queryField('laytimeExclusions', (t) =>
  t.field({
    type: [LaytimeExclusionType],
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const calc = await ctx.prisma.laytimeCalculation.findUniqueOrThrow({
        where: { id: args.id },
      });

      if (!calc.commencedAt || !calc.completedAt) {
        return [];
      }

      // Get port holidays if port is set
      let portHolidays: { date: Date; affectsLaytime: boolean }[] = [];
      if (calc.portId) {
        portHolidays = await ctx.prisma.portHoliday.findMany({
          where: { portId: calc.portId },
        });
      }

      const { details } = calculateExcludedHours(
        calc.commencedAt,
        calc.completedAt,
        calc.exceptionRule,
        portHolidays,
      );

      return details;
    },
  }),
);

// === Laytime recalculation engine ===

async function recalculateLaytime(
  prisma: import('@prisma/client').PrismaClient,
  calcId: string,
  overrideUsedHours?: number,
) {
  const calc = await prisma.laytimeCalculation.findUniqueOrThrow({ where: { id: calcId } });
  const entries = await prisma.statementOfFactEntry.findMany({
    where: { laytimeCalculationId: calcId },
    orderBy: { eventTime: 'asc' },
  });

  // If we have commencement and completion times plus rules, use the rules engine
  if (calc.commencedAt && calc.completedAt && !overrideUsedHours) {
    const grossMs = calc.completedAt.getTime() - calc.commencedAt.getTime();
    const grossHours = grossMs / (1000 * 60 * 60);

    // Get port holidays if port is set
    let portHolidays: { date: Date; affectsLaytime: boolean }[] = [];
    if (calc.portId) {
      portHolidays = await prisma.portHoliday.findMany({
        where: { portId: calc.portId },
      });
    }

    const { excludedHours } = calculateExcludedHours(
      calc.commencedAt,
      calc.completedAt,
      calc.exceptionRule,
      portHolidays,
    );

    const { usedHours, result, amountDue } = calculateLaytimeResult({
      allowedHours: calc.allowedHours,
      grossHours,
      excludedHours,
      demurrageRate: calc.demurrageRate,
      despatchRate: calc.despatchRate,
    });

    await prisma.laytimeCalculation.update({
      where: { id: calcId },
      data: { grossHours, excludedHours, usedHours, result, amountDue },
    });
    return;
  }

  // Fallback: Sum non-excluded time from SOF entries, or use override
  const usedHours = overrideUsedHours ?? entries
    .filter((e) => !e.excluded)
    .reduce((sum, e) => sum + e.timeUsed, 0);

  // Determine result using the rules engine
  const { result, amountDue } = calculateLaytimeResult({
    allowedHours: calc.allowedHours,
    grossHours: usedHours,
    excludedHours: 0,
    demurrageRate: calc.demurrageRate,
    despatchRate: calc.despatchRate,
  });

  await prisma.laytimeCalculation.update({
    where: { id: calcId },
    data: { usedHours, result, amountDue },
  });
}
