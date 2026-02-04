import { builder } from '../builder.js';

// === CriticalPathItem prisma object ===
builder.prismaObject('CriticalPathItem', {
  fields: (t) => ({
    id: t.exposeID('id'),
    voyageId: t.exposeString('voyageId'),
    milestoneId: t.exposeString('milestoneId', { nullable: true }),
    name: t.exposeString('name'),
    category: t.exposeString('category'),
    plannedStart: t.expose('plannedStart', { type: 'DateTime', nullable: true }),
    plannedEnd: t.expose('plannedEnd', { type: 'DateTime', nullable: true }),
    actualStart: t.expose('actualStart', { type: 'DateTime', nullable: true }),
    actualEnd: t.expose('actualEnd', { type: 'DateTime', nullable: true }),
    duration: t.exposeFloat('duration', { nullable: true }),
    actualDuration: t.exposeFloat('actualDuration', { nullable: true }),
    slack: t.exposeFloat('slack', { nullable: true }),
    isCritical: t.exposeBoolean('isCritical'),
    dependsOn: t.exposeStringList('dependsOn'),
    status: t.exposeString('status'),
    delayReason: t.exposeString('delayReason', { nullable: true }),
    delayHours: t.exposeFloat('delayHours', { nullable: true }),
    voyage: t.relation('voyage'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// === Queries ===

builder.queryField('criticalPath', (t) =>
  t.prismaField({
    type: ['CriticalPathItem'],
    args: {
      voyageId: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.criticalPathItem.findMany({
        ...query,
        where: { voyageId: args.voyageId },
        orderBy: { plannedStart: 'asc' },
      }),
  }),
);

// Critical Path Analysis — aggregate summary
const CriticalPathAnalysis = builder.objectRef<{
  voyageId: string;
  totalItems: number;
  completedItems: number;
  criticalItems: number;
  totalSlack: number;
  estimatedDelay: number;
  completionPercent: number;
}>('CriticalPathAnalysis');

CriticalPathAnalysis.implement({
  fields: (t) => ({
    voyageId: t.exposeString('voyageId'),
    totalItems: t.exposeInt('totalItems'),
    completedItems: t.exposeInt('completedItems'),
    criticalItems: t.exposeInt('criticalItems'),
    totalSlack: t.exposeFloat('totalSlack'),
    estimatedDelay: t.exposeFloat('estimatedDelay'),
    completionPercent: t.exposeFloat('completionPercent'),
  }),
});

builder.queryField('criticalPathAnalysis', (t) =>
  t.field({
    type: CriticalPathAnalysis,
    args: {
      voyageId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const items = await ctx.prisma.criticalPathItem.findMany({
        where: { voyageId: args.voyageId },
      });

      const totalItems = items.length;
      const completedItems = items.filter((i) => i.status === 'completed').length;
      const criticalItems = items.filter((i) => i.isCritical).length;
      const totalSlack = items.reduce((s, i) => s + (i.slack ?? 0), 0);
      const estimatedDelay = items
        .filter((i) => i.isCritical && i.delayHours && i.delayHours > 0)
        .reduce((s, i) => s + (i.delayHours ?? 0), 0);
      const completionPercent = totalItems > 0
        ? Math.round((completedItems / totalItems) * 10000) / 100
        : 0;

      return {
        voyageId: args.voyageId,
        totalItems,
        completedItems,
        criticalItems,
        totalSlack,
        estimatedDelay,
        completionPercent,
      };
    },
  }),
);

// === Mutations ===

builder.mutationField('addCriticalPathItem', (t) =>
  t.prismaField({
    type: 'CriticalPathItem',
    args: {
      voyageId: t.arg.string({ required: true }),
      name: t.arg.string({ required: true }),
      category: t.arg.string({ required: true }),
      plannedStart: t.arg({ type: 'DateTime', required: true }),
      plannedEnd: t.arg({ type: 'DateTime', required: true }),
      dependsOn: t.arg.stringList({ required: false }),
      milestoneId: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const plannedStart = new Date(args.plannedStart);
      const plannedEnd = new Date(args.plannedEnd);
      const duration = (plannedEnd.getTime() - plannedStart.getTime()) / (1000 * 60 * 60); // hours

      // Determine isCritical: items with no slack (depends on nothing or is head of chain)
      // Simple heuristic: if dependsOn is empty, it's potentially critical; recalculate later
      const dependsOn = args.dependsOn ?? [];
      const isCritical = dependsOn.length === 0;

      return ctx.prisma.criticalPathItem.create({
        ...query,
        data: {
          voyageId: args.voyageId,
          name: args.name,
          category: args.category,
          plannedStart,
          plannedEnd,
          duration,
          dependsOn,
          isCritical,
          slack: 0,
          milestoneId: args.milestoneId ?? undefined,
          status: 'pending',
        },
      });
    },
  }),
);

builder.mutationField('updateCriticalPathProgress', (t) =>
  t.prismaField({
    type: 'CriticalPathItem',
    args: {
      id: t.arg.string({ required: true }),
      actualStart: t.arg({ type: 'DateTime' }),
      actualEnd: t.arg({ type: 'DateTime' }),
      status: t.arg.string(),
      delayReason: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const item = await ctx.prisma.criticalPathItem.findUnique({ where: { id: args.id } });
      if (!item) throw new Error('Critical path item not found');

      const data: Record<string, unknown> = {};
      if (args.actualStart) data.actualStart = new Date(args.actualStart);
      if (args.actualEnd) data.actualEnd = new Date(args.actualEnd);
      if (args.status) data.status = args.status;
      if (args.delayReason) data.delayReason = args.delayReason;

      // Auto-calc actualDuration if both actualStart and actualEnd are available
      const actualStart = args.actualStart ? new Date(args.actualStart) : item.actualStart;
      const actualEnd = args.actualEnd ? new Date(args.actualEnd) : item.actualEnd;
      if (actualStart && actualEnd) {
        const actualDuration = (actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60);
        data.actualDuration = actualDuration;

        // Auto-calc delayHours: difference between actual and planned duration
        if (item.duration != null) {
          const delayHours = actualDuration - item.duration;
          data.delayHours = delayHours > 0 ? delayHours : 0;
        }
      }

      return ctx.prisma.criticalPathItem.update({
        ...query,
        where: { id: args.id },
        data,
      });
    },
  }),
);

builder.mutationField('recalculateCriticalPath', (t) =>
  t.field({
    type: [CriticalPathAnalysis],
    args: {
      voyageId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const items = await ctx.prisma.criticalPathItem.findMany({
        where: { voyageId: args.voyageId },
        orderBy: { plannedStart: 'asc' },
      });

      if (items.length === 0) {
        return [{
          voyageId: args.voyageId,
          totalItems: 0,
          completedItems: 0,
          criticalItems: 0,
          totalSlack: 0,
          estimatedDelay: 0,
          completionPercent: 0,
        }];
      }

      // Build dependency map and compute earliest/latest start times
      const itemMap = new Map(items.map((i) => [i.id, i]));

      // Forward pass: compute earliest finish times
      const earliestFinish = new Map<string, number>();
      for (const item of items) {
        let earliestStart = item.plannedStart?.getTime() ?? 0;
        for (const depId of item.dependsOn) {
          const depFinish = earliestFinish.get(depId);
          if (depFinish && depFinish > earliestStart) {
            earliestStart = depFinish;
          }
        }
        const duration = (item.duration ?? 0) * 60 * 60 * 1000; // hours to ms
        earliestFinish.set(item.id, earliestStart + duration);
      }

      // Find project end (latest earliest finish)
      const projectEnd = Math.max(...earliestFinish.values());

      // Backward pass: compute latest start times
      const latestStart = new Map<string, number>();
      // Build reverse dependency map
      const reverseDeps = new Map<string, string[]>();
      for (const item of items) {
        for (const depId of item.dependsOn) {
          const existing = reverseDeps.get(depId) ?? [];
          existing.push(item.id);
          reverseDeps.set(depId, existing);
        }
      }

      // Process in reverse order
      for (let idx = items.length - 1; idx >= 0; idx--) {
        const item = items[idx];
        const successors = reverseDeps.get(item.id) ?? [];
        const duration = (item.duration ?? 0) * 60 * 60 * 1000;

        if (successors.length === 0) {
          // Terminal item: latest finish = project end
          latestStart.set(item.id, projectEnd - duration);
        } else {
          // Latest start = min(latest start of successors) - duration
          let minSuccessorStart = Infinity;
          for (const succId of successors) {
            const succStart = latestStart.get(succId);
            if (succStart !== undefined && succStart < minSuccessorStart) {
              minSuccessorStart = succStart;
            }
          }
          if (minSuccessorStart === Infinity) {
            latestStart.set(item.id, projectEnd - duration);
          } else {
            latestStart.set(item.id, minSuccessorStart - duration);
          }
        }
      }

      // Compute slack and isCritical for each item, then update
      for (const item of items) {
        const es = item.plannedStart?.getTime() ?? 0;
        const ls = latestStart.get(item.id) ?? es;
        const slack = Math.max(0, (ls - es) / (1000 * 60 * 60)); // ms to hours
        const isCritical = slack < 0.01; // effectively zero

        await ctx.prisma.criticalPathItem.update({
          where: { id: item.id },
          data: { slack, isCritical },
        });
      }

      // Return updated analysis
      const updated = await ctx.prisma.criticalPathItem.findMany({
        where: { voyageId: args.voyageId },
      });
      const totalItems = updated.length;
      const completedItems = updated.filter((i) => i.status === 'completed').length;
      const criticalItems = updated.filter((i) => i.isCritical).length;
      const totalSlack = updated.reduce((s, i) => s + (i.slack ?? 0), 0);
      const estimatedDelay = updated
        .filter((i) => i.isCritical && i.delayHours && i.delayHours > 0)
        .reduce((s, i) => s + (i.delayHours ?? 0), 0);
      const completionPercent = totalItems > 0
        ? Math.round((completedItems / totalItems) * 10000) / 100
        : 0;

      return [{
        voyageId: args.voyageId,
        totalItems,
        completedItems,
        criticalItems,
        totalSlack,
        estimatedDelay,
        completionPercent,
      }];
    },
  }),
);
