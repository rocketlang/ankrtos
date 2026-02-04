import { builder } from '../builder.js';
import { prisma } from '../context.js';
import { routeDeviationDetector } from '../../services/voyage/route-deviation-detector.js';
import { portCongestionAlerter } from '../../services/voyage/port-congestion-alerter.js';

// NOTE: DelayAlert type is defined in delay-alert.ts
// NOTE: PortCongestion type is defined in port-congestion.ts

// Custom types for detection results
const RouteDeviationResult = builder.objectRef<{
  hasDeviation: boolean;
  deviationNM?: number;
  voyageId: string;
  voyageNumber?: string;
}>('RouteDeviationResult').implement({
  fields: (t) => ({
    hasDeviation: t.exposeBoolean('hasDeviation'),
    deviationNM: t.exposeFloat('deviationNM', { nullable: true }),
    voyageId: t.exposeString('voyageId'),
    voyageNumber: t.exposeString('voyageNumber', { nullable: true }),
  }),
});

const CongestionCheckResult = builder.objectRef<{
  checked: number;
  congestedPorts: number;
}>('CongestionCheckResult').implement({
  fields: (t) => ({
    checked: t.exposeInt('checked'),
    congestedPorts: t.exposeInt('congestedPorts'),
  }),
});

const DeviationCheckResult = builder.objectRef<{
  checked: number;
  deviations: number;
}>('DeviationCheckResult').implement({
  fields: (t) => ({
    checked: t.exposeInt('checked'),
    deviations: t.exposeInt('deviations'),
  }),
});

// Queries

// Get all alerts for a voyage
builder.queryField('voyageAlerts', (t) =>
  t.prismaField({
    type: ['DelayAlert'],
    args: {
      voyageId: t.arg.string({ required: true }),
      includeResolved: t.arg.boolean({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.delayAlert.findMany({
        ...query,
        where: {
          voyageId: args.voyageId,
          ...(args.includeResolved ? {} : { resolvedAt: null }),
        },
        orderBy: { createdAt: 'desc' },
      }),
  })
);

// Get all unresolved alerts across all voyages
builder.queryField('unresolvedAlerts', (t) =>
  t.prismaField({
    type: ['DelayAlert'],
    args: {
      limit: t.arg.int({ required: false }),
    },
    resolve: (query, _root, args, ctx) =>
      prisma.delayAlert.findMany({
        ...query,
        where: {
          resolvedAt: null,
          voyage: ctx.user?.organizationId
            ? {
                vessel: {
                  organizationId: ctx.user.organizationId,
                },
              }
            : {},
        },
        orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
        take: args.limit || 50,
      }),
  })
);

// Get latest port congestion data
builder.queryField('portCongestionData', (t) =>
  t.prismaField({
    type: ['PortCongestion'],
    args: {
      portId: t.arg.string({ required: false }),
      limit: t.arg.int({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.portCongestion.findMany({
        ...query,
        where: args.portId ? { portId: args.portId } : {},
        orderBy: { timestamp: 'desc' },
        take: args.limit || 20,
      }),
  })
);

// Check route deviation for specific voyage
builder.queryField('checkRouteDeviation', (t) =>
  t.field({
    type: RouteDeviationResult,
    args: {
      voyageId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args) => {
      const result = await routeDeviationDetector.checkVoyageDeviation(args.voyageId);

      const voyage = await prisma.voyage.findUnique({
        where: { id: args.voyageId },
        select: { voyageNumber: true },
      });

      return {
        ...result,
        voyageId: args.voyageId,
        voyageNumber: voyage?.voyageNumber,
      };
    },
  })
);

// Mutations

// Manually run congestion check
builder.mutationField('checkPortCongestion', (t) =>
  t.field({
    type: CongestionCheckResult,
    resolve: async () => {
      return await portCongestionAlerter.checkAllVoyages();
    },
  })
);

// Manually run deviation check
builder.mutationField('checkRouteDeviations', (t) =>
  t.field({
    type: DeviationCheckResult,
    resolve: async () => {
      return await routeDeviationDetector.checkAllVoyages();
    },
  })
);

// Resolve alert
builder.mutationField('resolveAlert', (t) =>
  t.prismaField({
    type: 'DelayAlert',
    args: {
      alertId: t.arg.string({ required: true }),
      notes: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args, ctx) =>
      prisma.delayAlert.update({
        ...query,
        where: { id: args.alertId },
        data: {
          resolvedAt: new Date(),
          resolvedBy: ctx.user?.id,
          notes: args.notes || undefined,
        },
      }),
  })
);

// Create manual port congestion entry
builder.mutationField('recordPortCongestion', (t) =>
  t.prismaField({
    type: 'PortCongestion',
    args: {
      portId: t.arg.string({ required: true }),
      vesselsWaiting: t.arg.int({ required: true }),
      vesselsAtBerth: t.arg.int({ required: true }),
      avgWaitHours: t.arg.float({ required: false }),
      berthUtilization: t.arg.float({ required: false }),
      cargoType: t.arg.string({ required: false }),
      notes: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.portCongestion.create({
        ...query,
        data: {
          portId: args.portId,
          vesselsWaiting: args.vesselsWaiting,
          vesselsAtBerth: args.vesselsAtBerth,
          avgWaitHours: args.avgWaitHours || undefined,
          berthUtilization: args.berthUtilization || undefined,
          cargoType: args.cargoType || undefined,
          notes: args.notes || undefined,
          source: 'manual',
        },
      }),
  })
);
