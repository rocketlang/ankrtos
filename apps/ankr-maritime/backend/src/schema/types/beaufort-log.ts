import { builder } from '../builder.js';

// === BeaufortLog prisma object ===
builder.prismaObject('BeaufortLog', {
  fields: (t) => ({
    id: t.exposeID('id'),
    voyageId: t.exposeString('voyageId'),
    vesselId: t.exposeString('vesselId'),
    reportDate: t.expose('reportDate', { type: 'DateTime' }),
    latitude: t.exposeFloat('latitude', { nullable: true }),
    longitude: t.exposeFloat('longitude', { nullable: true }),
    beaufortScale: t.exposeInt('beaufortScale'),
    windSpeed: t.exposeFloat('windSpeed', { nullable: true }),
    windDirection: t.exposeFloat('windDirection', { nullable: true }),
    waveHeight: t.exposeFloat('waveHeight', { nullable: true }),
    swellHeight: t.exposeFloat('swellHeight', { nullable: true }),
    swellDirection: t.exposeFloat('swellDirection', { nullable: true }),
    seaState: t.exposeString('seaState', { nullable: true }),
    visibility: t.exposeFloat('visibility', { nullable: true }),
    barometer: t.exposeFloat('barometer', { nullable: true }),
    airTemp: t.exposeFloat('airTemp', { nullable: true }),
    seaTemp: t.exposeFloat('seaTemp', { nullable: true }),
    currentSpeed: t.exposeFloat('currentSpeed', { nullable: true }),
    currentDirection: t.exposeFloat('currentDirection', { nullable: true }),
    warrantySpeed: t.exposeFloat('warrantySpeed', { nullable: true }),
    actualSpeed: t.exposeFloat('actualSpeed', { nullable: true }),
    warrantyConsumption: t.exposeFloat('warrantyConsumption', { nullable: true }),
    actualConsumption: t.exposeFloat('actualConsumption', { nullable: true }),
    withinWarranty: t.exposeBoolean('withinWarranty'),
    remarks: t.exposeString('remarks', { nullable: true }),
    voyage: t.relation('voyage'),
    vessel: t.relation('vessel'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

// === Queries ===

builder.queryField('beaufortLogs', (t) =>
  t.prismaField({
    type: ['BeaufortLog'],
    args: {
      voyageId: t.arg.string({ required: true }),
      vesselId: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { voyageId: args.voyageId };
      if (args.vesselId) where.vesselId = args.vesselId;
      return ctx.prisma.beaufortLog.findMany({
        ...query,
        where,
        orderBy: { reportDate: 'desc' },
      });
    },
  }),
);

// Beaufort Summary — weather performance analytics
const BeaufortSummary = builder.objectRef<{
  voyageId: string;
  avgBeaufortScale: number;
  maxBeaufortScale: number;
  avgWindSpeed: number;
  avgWaveHeight: number;
  daysAboveWarranty: number;
  totalDays: number;
  warrantyCompliancePercent: number;
}>('BeaufortSummary');

BeaufortSummary.implement({
  fields: (t) => ({
    voyageId: t.exposeString('voyageId'),
    avgBeaufortScale: t.exposeFloat('avgBeaufortScale'),
    maxBeaufortScale: t.exposeInt('maxBeaufortScale'),
    avgWindSpeed: t.exposeFloat('avgWindSpeed'),
    avgWaveHeight: t.exposeFloat('avgWaveHeight'),
    daysAboveWarranty: t.exposeInt('daysAboveWarranty'),
    totalDays: t.exposeInt('totalDays'),
    warrantyCompliancePercent: t.exposeFloat('warrantyCompliancePercent'),
  }),
});

builder.queryField('beaufortSummary', (t) =>
  t.field({
    type: BeaufortSummary,
    args: {
      voyageId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const logs = await ctx.prisma.beaufortLog.findMany({
        where: { voyageId: args.voyageId },
        orderBy: { reportDate: 'asc' },
      });

      const n = logs.length || 1;

      const avgBeaufortScale = logs.reduce((s, l) => s + l.beaufortScale, 0) / n;
      const maxBeaufortScale = logs.reduce((max, l) => Math.max(max, l.beaufortScale), 0);
      const avgWindSpeed = logs.reduce((s, l) => s + (l.windSpeed ?? 0), 0) / n;
      const avgWaveHeight = logs.reduce((s, l) => s + (l.waveHeight ?? 0), 0) / n;

      // Days above warranty: logs where withinWarranty is false
      const daysAboveWarranty = logs.filter((l) => !l.withinWarranty).length;
      const totalDays = logs.length;
      const warrantyCompliancePercent = totalDays > 0
        ? Math.round(((totalDays - daysAboveWarranty) / totalDays) * 10000) / 100
        : 100;

      return {
        voyageId: args.voyageId,
        avgBeaufortScale: Math.round(avgBeaufortScale * 100) / 100,
        maxBeaufortScale,
        avgWindSpeed: Math.round(avgWindSpeed * 100) / 100,
        avgWaveHeight: Math.round(avgWaveHeight * 100) / 100,
        daysAboveWarranty,
        totalDays,
        warrantyCompliancePercent,
      };
    },
  }),
);

// === Helpers ===

/** Derive sea state description from Beaufort scale number */
function beaufortToSeaState(scale: number): string {
  if (scale <= 1) return 'calm';
  if (scale <= 3) return 'slight';
  if (scale === 4) return 'moderate';
  if (scale <= 6) return 'rough';
  if (scale === 7) return 'very_rough';
  if (scale <= 9) return 'high';
  return 'phenomenal'; // 10-12
}

/** Determine if vessel is within warranty conditions */
function checkWithinWarranty(warrantySpeed: number | null | undefined, actualSpeed: number | null | undefined): boolean {
  // If warrantySpeed is not set, assume within warranty
  if (warrantySpeed == null) return true;
  // If actualSpeed is not set, cannot determine — assume within
  if (actualSpeed == null) return true;
  // Within warranty if actual speed meets or exceeds warranty speed
  return actualSpeed >= warrantySpeed;
}

// === Mutations ===

builder.mutationField('logBeaufort', (t) =>
  t.prismaField({
    type: 'BeaufortLog',
    args: {
      voyageId: t.arg.string({ required: true }),
      vesselId: t.arg.string({ required: true }),
      reportDate: t.arg({ type: 'DateTime', required: true }),
      beaufortScale: t.arg.int({ required: true }),
      latitude: t.arg.float(),
      longitude: t.arg.float(),
      windSpeed: t.arg.float(),
      windDirection: t.arg.float(),
      waveHeight: t.arg.float(),
      swellHeight: t.arg.float(),
      swellDirection: t.arg.float(),
      visibility: t.arg.float(),
      barometer: t.arg.float(),
      airTemp: t.arg.float(),
      seaTemp: t.arg.float(),
      currentSpeed: t.arg.float(),
      currentDirection: t.arg.float(),
      warrantySpeed: t.arg.float(),
      actualSpeed: t.arg.float(),
      warrantyConsumption: t.arg.float(),
      actualConsumption: t.arg.float(),
      remarks: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      // Auto-set seaState based on beaufort scale
      const seaState = beaufortToSeaState(args.beaufortScale);

      // Auto-set withinWarranty based on speed comparison
      const withinWarranty = checkWithinWarranty(args.warrantySpeed, args.actualSpeed);

      return ctx.prisma.beaufortLog.create({
        ...query,
        data: {
          voyageId: args.voyageId,
          vesselId: args.vesselId,
          reportDate: new Date(args.reportDate),
          beaufortScale: args.beaufortScale,
          latitude: args.latitude ?? undefined,
          longitude: args.longitude ?? undefined,
          windSpeed: args.windSpeed ?? undefined,
          windDirection: args.windDirection ?? undefined,
          waveHeight: args.waveHeight ?? undefined,
          swellHeight: args.swellHeight ?? undefined,
          swellDirection: args.swellDirection ?? undefined,
          seaState,
          visibility: args.visibility ?? undefined,
          barometer: args.barometer ?? undefined,
          airTemp: args.airTemp ?? undefined,
          seaTemp: args.seaTemp ?? undefined,
          currentSpeed: args.currentSpeed ?? undefined,
          currentDirection: args.currentDirection ?? undefined,
          warrantySpeed: args.warrantySpeed ?? undefined,
          actualSpeed: args.actualSpeed ?? undefined,
          warrantyConsumption: args.warrantyConsumption ?? undefined,
          actualConsumption: args.actualConsumption ?? undefined,
          withinWarranty,
          remarks: args.remarks ?? undefined,
        },
      });
    },
  }),
);
