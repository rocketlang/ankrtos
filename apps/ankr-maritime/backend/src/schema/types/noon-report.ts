import { builder } from '../builder.js';
import { prisma } from '../context.js';

builder.prismaObject('NoonReport', {
  fields: (t) => ({
    id: t.exposeID('id'),
    vesselId: t.exposeString('vesselId'),
    voyageId: t.exposeString('voyageId', { nullable: true }),
    reportDate: t.expose('reportDate', { type: 'DateTime' }),
    reportType: t.exposeString('reportType'),
    latitude: t.exposeFloat('latitude', { nullable: true }),
    longitude: t.exposeFloat('longitude', { nullable: true }),
    course: t.exposeFloat('course', { nullable: true }),
    speedOrdered: t.exposeFloat('speedOrdered', { nullable: true }),
    speedActual: t.exposeFloat('speedActual', { nullable: true }),
    distanceSailed: t.exposeFloat('distanceSailed', { nullable: true }),
    distanceToGo: t.exposeFloat('distanceToGo', { nullable: true }),
    foConsumed: t.exposeFloat('foConsumed', { nullable: true }),
    doConsumed: t.exposeFloat('doConsumed', { nullable: true }),
    lsfoConsumed: t.exposeFloat('lsfoConsumed', { nullable: true }),
    mgoConsumed: t.exposeFloat('mgoConsumed', { nullable: true }),
    foROB: t.exposeFloat('foROB', { nullable: true }),
    doROB: t.exposeFloat('doROB', { nullable: true }),
    lsfoROB: t.exposeFloat('lsfoROB', { nullable: true }),
    mgoROB: t.exposeFloat('mgoROB', { nullable: true }),
    fwROB: t.exposeFloat('fwROB', { nullable: true }),
    windForce: t.exposeInt('windForce', { nullable: true }),
    windDirection: t.exposeString('windDirection', { nullable: true }),
    seaState: t.exposeInt('seaState', { nullable: true }),
    swellHeight: t.exposeFloat('swellHeight', { nullable: true }),
    meRPM: t.exposeFloat('meRPM', { nullable: true }),
    mePower: t.exposeFloat('mePower', { nullable: true }),
    slipPercentage: t.exposeFloat('slipPercentage', { nullable: true }),
    remarks: t.exposeString('remarks', { nullable: true }),
    vessel: t.relation('vessel'),
    voyage: t.relation('voyage', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

builder.queryField('noonReports', (t) =>
  t.prismaField({
    type: ['NoonReport'],
    args: {
      vesselId: t.arg.string({ required: false }),
      voyageId: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.noonReport.findMany({
        ...query,
        where: {
          ...(args.vesselId ? { vesselId: args.vesselId } : {}),
          ...(args.voyageId ? { voyageId: args.voyageId } : {}),
        },
        orderBy: { reportDate: 'desc' },
        take: 100,
      }),
  }),
);

// Performance summary for a vessel over a voyage
const VesselPerformanceSummaryRef = builder.objectRef<{
  vesselId: string;
  voyageId: string | null;
  totalReports: number;
  avgSpeed: number;
  totalDistanceSailed: number;
  totalFoConsumed: number;
  totalDoConsumed: number;
  avgWindForce: number;
}>('VesselPerformanceSummary');

VesselPerformanceSummaryRef.implement({
  fields: (t) => ({
    vesselId: t.exposeString('vesselId'),
    voyageId: t.exposeString('voyageId', { nullable: true }),
    totalReports: t.exposeInt('totalReports'),
    avgSpeed: t.exposeFloat('avgSpeed'),
    totalDistanceSailed: t.exposeFloat('totalDistanceSailed'),
    totalFoConsumed: t.exposeFloat('totalFoConsumed'),
    totalDoConsumed: t.exposeFloat('totalDoConsumed'),
    avgWindForce: t.exposeFloat('avgWindForce'),
  }),
});

builder.queryField('vesselPerformanceSummary', (t) =>
  t.field({
    type: VesselPerformanceSummaryRef,
    args: {
      vesselId: t.arg.string({ required: true }),
      voyageId: t.arg.string({ required: false }),
    },
    resolve: async (_root, args) => {
      const reports = await prisma.noonReport.findMany({
        where: {
          vesselId: args.vesselId,
          ...(args.voyageId ? { voyageId: args.voyageId } : {}),
        },
      });
      const n = reports.length || 1;
      return {
        vesselId: args.vesselId,
        voyageId: args.voyageId ?? null,
        totalReports: reports.length,
        avgSpeed: reports.reduce((s, r) => s + (r.speedActual ?? 0), 0) / n,
        totalDistanceSailed: reports.reduce((s, r) => s + (r.distanceSailed ?? 0), 0),
        totalFoConsumed: reports.reduce((s, r) => s + (r.foConsumed ?? 0), 0),
        totalDoConsumed: reports.reduce((s, r) => s + (r.doConsumed ?? 0), 0),
        avgWindForce: reports.reduce((s, r) => s + (r.windForce ?? 0), 0) / n,
      };
    },
  }),
);

builder.mutationField('createNoonReport', (t) =>
  t.prismaField({
    type: 'NoonReport',
    args: {
      vesselId: t.arg.string({ required: true }),
      voyageId: t.arg.string({ required: false }),
      reportDate: t.arg.string({ required: true }),
      reportType: t.arg.string({ required: false }),
      latitude: t.arg.float({ required: false }),
      longitude: t.arg.float({ required: false }),
      course: t.arg.float({ required: false }),
      speedOrdered: t.arg.float({ required: false }),
      speedActual: t.arg.float({ required: false }),
      distanceSailed: t.arg.float({ required: false }),
      distanceToGo: t.arg.float({ required: false }),
      foConsumed: t.arg.float({ required: false }),
      doConsumed: t.arg.float({ required: false }),
      lsfoConsumed: t.arg.float({ required: false }),
      mgoConsumed: t.arg.float({ required: false }),
      foROB: t.arg.float({ required: false }),
      doROB: t.arg.float({ required: false }),
      lsfoROB: t.arg.float({ required: false }),
      mgoROB: t.arg.float({ required: false }),
      fwROB: t.arg.float({ required: false }),
      windForce: t.arg.int({ required: false }),
      windDirection: t.arg.string({ required: false }),
      seaState: t.arg.int({ required: false }),
      swellHeight: t.arg.float({ required: false }),
      meRPM: t.arg.float({ required: false }),
      mePower: t.arg.float({ required: false }),
      slipPercentage: t.arg.float({ required: false }),
      remarks: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.noonReport.create({
        ...query,
        data: {
          vesselId: args.vesselId,
          voyageId: args.voyageId,
          reportDate: new Date(args.reportDate),
          reportType: args.reportType ?? 'noon',
          latitude: args.latitude, longitude: args.longitude, course: args.course,
          speedOrdered: args.speedOrdered, speedActual: args.speedActual,
          distanceSailed: args.distanceSailed, distanceToGo: args.distanceToGo,
          foConsumed: args.foConsumed, doConsumed: args.doConsumed,
          lsfoConsumed: args.lsfoConsumed, mgoConsumed: args.mgoConsumed,
          foROB: args.foROB, doROB: args.doROB, lsfoROB: args.lsfoROB,
          mgoROB: args.mgoROB, fwROB: args.fwROB,
          windForce: args.windForce, windDirection: args.windDirection,
          seaState: args.seaState, swellHeight: args.swellHeight,
          meRPM: args.meRPM, mePower: args.mePower, slipPercentage: args.slipPercentage,
          remarks: args.remarks,
        },
      }),
  }),
);
