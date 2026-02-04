import { builder } from '../builder.js';
import { prisma } from '../context.js';

builder.prismaObject('CargoQuantityLog', {
  fields: (t) => ({
    id: t.exposeID('id'),
    voyageId: t.exposeString('voyageId'),
    portId: t.exposeString('portId', { nullable: true }),
    type: t.exposeString('type'),
    quantity: t.exposeFloat('quantity'),
    unit: t.exposeString('unit'),
    source: t.exposeString('source', { nullable: true }),
    remarks: t.exposeString('remarks', { nullable: true }),
    loggedAt: t.expose('loggedAt', { type: 'DateTime' }),
    loggedBy: t.exposeString('loggedBy', { nullable: true }),
    voyage: t.relation('voyage'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

builder.queryField('cargoQuantityLogs', (t) =>
  t.prismaField({
    type: ['CargoQuantityLog'],
    args: {
      voyageId: t.arg.string({ required: true }),
      type: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.cargoQuantityLog.findMany({
        ...query,
        where: {
          voyageId: args.voyageId,
          ...(args.type ? { type: args.type } : {}),
        },
        orderBy: { loggedAt: 'desc' },
      }),
  }),
);

// Custom type for cargo quantity variance analysis
const CargoQuantityVarianceRef = builder.objectRef<{
  blFigure: number;
  shipFigure: number;
  shoreFigure: number;
  variance: number;
  variancePercent: number;
}>('CargoQuantityVariance');

CargoQuantityVarianceRef.implement({
  fields: (t) => ({
    blFigure: t.exposeFloat('blFigure'),
    shipFigure: t.exposeFloat('shipFigure'),
    shoreFigure: t.exposeFloat('shoreFigure'),
    variance: t.exposeFloat('variance'),
    variancePercent: t.exposeFloat('variancePercent'),
  }),
});

builder.queryField('cargoQuantityVariance', (t) =>
  t.field({
    type: CargoQuantityVarianceRef,
    args: {
      voyageId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args) => {
      const logs = await prisma.cargoQuantityLog.findMany({
        where: { voyageId: args.voyageId },
        orderBy: { loggedAt: 'desc' },
      });

      // Take the latest entry for each type
      const latest = new Map<string, number>();
      for (const log of logs) {
        if (!latest.has(log.type)) {
          latest.set(log.type, log.quantity);
        }
      }

      const blFigure = latest.get('bl_figure') ?? 0;
      const shipFigure = latest.get('ship_figure') ?? 0;
      const shoreFigure = latest.get('shore_figure') ?? 0;

      // Variance: difference between B/L figure and shore figure
      const variance = blFigure - shoreFigure;
      const variancePercent = blFigure > 0 ? (variance / blFigure) * 100 : 0;

      return {
        blFigure,
        shipFigure,
        shoreFigure,
        variance,
        variancePercent,
      };
    },
  }),
);

builder.mutationField('logCargoQuantity', (t) =>
  t.prismaField({
    type: 'CargoQuantityLog',
    args: {
      voyageId: t.arg.string({ required: true }),
      type: t.arg.string({ required: true }),
      quantity: t.arg.float({ required: true }),
      unit: t.arg.string({ required: false }),
      portId: t.arg.string({ required: false }),
      source: t.arg.string({ required: false }),
      remarks: t.arg.string({ required: false }),
      loggedBy: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.cargoQuantityLog.create({
        ...query,
        data: {
          voyageId: args.voyageId,
          type: args.type,
          quantity: args.quantity,
          unit: args.unit ?? 'MT',
          portId: args.portId,
          source: args.source,
          remarks: args.remarks,
          loggedBy: args.loggedBy,
        },
      }),
  }),
);
