import { builder } from '../builder.js';
import { prisma } from '../context.js';

builder.prismaObject('PortCongestion', {
  fields: (t) => ({
    id: t.exposeID('id'),
    portId: t.exposeString('portId'),
    vesselsWaiting: t.exposeInt('vesselsWaiting'),
    vesselsAtBerth: t.exposeInt('vesselsAtBerth'),
    avgWaitHours: t.exposeFloat('avgWaitHours', { nullable: true }),
    berthUtilization: t.exposeFloat('berthUtilization', { nullable: true }),
    cargoType: t.exposeString('cargoType', { nullable: true }),
    source: t.exposeString('source'),
    notes: t.exposeString('notes', { nullable: true }),
    timestamp: t.expose('timestamp', { type: 'DateTime' }),
    port: t.relation('port'),
  }),
});

builder.queryField('portCongestion', (t) =>
  t.prismaField({
    type: ['PortCongestion'],
    args: {
      portId: t.arg.string({ required: true }),
      days: t.arg.int({ required: false }),
    },
    resolve: (query, _root, args) => {
      const daysBack = args.days ?? 30;
      const since = new Date();
      since.setDate(since.getDate() - daysBack);
      return prisma.portCongestion.findMany({
        ...query,
        where: {
          portId: args.portId,
          timestamp: { gte: since },
        },
        orderBy: { timestamp: 'desc' },
      });
    },
  }),
);

// Custom summary type for port congestion analytics
const PortCongestionSummaryRef = builder.objectRef<{
  avgWaitHours: number;
  currentVesselsWaiting: number;
  berthUtilization: number;
  trend: string;
}>('PortCongestionSummary');

PortCongestionSummaryRef.implement({
  fields: (t) => ({
    avgWaitHours: t.exposeFloat('avgWaitHours'),
    currentVesselsWaiting: t.exposeInt('currentVesselsWaiting'),
    berthUtilization: t.exposeFloat('berthUtilization'),
    trend: t.exposeString('trend'),
  }),
});

builder.queryField('portCongestionSummary', (t) =>
  t.field({
    type: PortCongestionSummaryRef,
    args: {
      portId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args) => {
      // Get last 7 days of records for average calculation
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentRecords = await prisma.portCongestion.findMany({
        where: {
          portId: args.portId,
          timestamp: { gte: sevenDaysAgo },
        },
        orderBy: { timestamp: 'desc' },
      });

      // Latest record for current values
      const latest = recentRecords[0] ?? null;

      // Average wait hours over last 7 days
      const withWait = recentRecords.filter((r) => r.avgWaitHours != null);
      const n = withWait.length || 1;
      const avgWaitHours =
        withWait.reduce((sum, r) => sum + (r.avgWaitHours ?? 0), 0) / n;

      // Determine trend: compare first half vs second half of the 7-day window
      let trend = 'stable';
      if (recentRecords.length >= 4) {
        const mid = Math.floor(recentRecords.length / 2);
        // recentRecords is desc, so first half = newer, second half = older
        const newerHalf = recentRecords.slice(0, mid);
        const olderHalf = recentRecords.slice(mid);
        const newerAvg =
          newerHalf.reduce((s, r) => s + r.vesselsWaiting, 0) / newerHalf.length;
        const olderAvg =
          olderHalf.reduce((s, r) => s + r.vesselsWaiting, 0) / olderHalf.length;
        if (newerAvg < olderAvg * 0.9) trend = 'improving';
        else if (newerAvg > olderAvg * 1.1) trend = 'worsening';
      }

      return {
        avgWaitHours,
        currentVesselsWaiting: latest?.vesselsWaiting ?? 0,
        berthUtilization: latest?.berthUtilization ?? 0,
        trend,
      };
    },
  }),
);

builder.mutationField('reportPortCongestion', (t) =>
  t.prismaField({
    type: 'PortCongestion',
    args: {
      portId: t.arg.string({ required: true }),
      vesselsWaiting: t.arg.int({ required: true }),
      vesselsAtBerth: t.arg.int({ required: false }),
      avgWaitHours: t.arg.float({ required: false }),
      berthUtilization: t.arg.float({ required: false }),
      cargoType: t.arg.string({ required: false }),
      source: t.arg.string({ required: false }),
      notes: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.portCongestion.create({
        ...query,
        data: {
          portId: args.portId,
          vesselsWaiting: args.vesselsWaiting,
          vesselsAtBerth: args.vesselsAtBerth ?? 0,
          avgWaitHours: args.avgWaitHours,
          berthUtilization: args.berthUtilization,
          cargoType: args.cargoType,
          source: args.source ?? 'manual',
          notes: args.notes,
        },
      }),
  }),
);

// ===============================
// ADVANCED PORT CONGESTION MONITORING
// ===============================

// Port Congestion Zone
builder.prismaObject('PortCongestionZone', {
  fields: (t) => ({
    id: t.exposeID('id'),
    portId: t.exposeString('portId'),
    port: t.relation('port'),
    zoneType: t.exposeString('zoneType'),
    zoneName: t.exposeString('zoneName'),
    boundaryGeoJson: t.expose('boundaryGeoJson', { type: 'JSON' }),
    normalCapacity: t.exposeInt('normalCapacity'),
    highCapacity: t.exposeInt('highCapacity'),
    criticalCapacity: t.exposeInt('criticalCapacity'),
    isActive: t.exposeBoolean('isActive'),
    priority: t.exposeInt('priority'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    detections: t.relation('detections'),
    snapshots: t.relation('snapshots'),
    alerts: t.relation('alerts'),
  }),
});

// Port Congestion Detection
builder.prismaObject('PortCongestionDetection', {
  fields: (t) => ({
    id: t.exposeID('id'),
    vesselId: t.exposeString('vesselId'),
    portId: t.exposeString('portId'),
    zoneId: t.exposeString('zoneId', { nullable: true }),
    detectedAt: t.expose('detectedAt', { type: 'DateTime' }),
    navigationStatus: t.exposeString('navigationStatus'),
    latitude: t.exposeFloat('latitude'),
    longitude: t.exposeFloat('longitude'),
    arrivalTime: t.expose('arrivalTime', { type: 'DateTime' }),
    departureTime: t.expose('departureTime', { type: 'DateTime', nullable: true }),
    waitTimeHours: t.exposeFloat('waitTimeHours', { nullable: true }),
    vesselCountAtArrival: t.exposeInt('vesselCountAtArrival'),
    congestionLevel: t.exposeString('congestionLevel'),
    estimatedDetentionCost: t.exposeFloat('estimatedDetentionCost', { nullable: true }),
    isActive: t.exposeBoolean('isActive'),
    vessel: t.relation('vessel'),
    port: t.relation('port'),
    zone: t.relation('zone', { nullable: true }),
  }),
});

// Port Congestion Snapshot
builder.prismaObject('PortCongestionSnapshot', {
  fields: (t) => ({
    id: t.exposeID('id'),
    portId: t.exposeString('portId'),
    zoneId: t.exposeString('zoneId', { nullable: true }),
    timestamp: t.expose('timestamp', { type: 'DateTime' }),
    vesselCount: t.exposeInt('vesselCount'),
    anchoredCount: t.exposeInt('anchoredCount'),
    mooredCount: t.exposeInt('mooredCount'),
    cargoCount: t.exposeInt('cargoCount'),
    tankerCount: t.exposeInt('tankerCount'),
    containerCount: t.exposeInt('containerCount'),
    bulkCarrierCount: t.exposeInt('bulkCarrierCount'),
    avgWaitTimeHours: t.exposeFloat('avgWaitTimeHours', { nullable: true }),
    maxWaitTimeHours: t.exposeFloat('maxWaitTimeHours', { nullable: true }),
    medianWaitTimeHours: t.exposeFloat('medianWaitTimeHours', { nullable: true }),
    congestionLevel: t.exposeString('congestionLevel'),
    capacityPercent: t.exposeFloat('capacityPercent'),
    trend: t.exposeString('trend'),
    changePercent: t.exposeFloat('changePercent', { nullable: true }),
    port: t.relation('port'),
    zone: t.relation('zone', { nullable: true }),
  }),
});

// Port Congestion Alert
builder.prismaObject('PortCongestionAlert', {
  fields: (t) => ({
    id: t.exposeID('id'),
    portId: t.exposeString('portId'),
    zoneId: t.exposeString('zoneId', { nullable: true }),
    vesselId: t.exposeString('vesselId', { nullable: true }),
    alertType: t.exposeString('alertType'),
    severity: t.exposeString('severity'),
    title: t.exposeString('title'),
    message: t.exposeString('message'),
    triggeredAt: t.expose('triggeredAt', { type: 'DateTime' }),
    triggerValue: t.exposeFloat('triggerValue', { nullable: true }),
    threshold: t.exposeFloat('threshold', { nullable: true }),
    status: t.exposeString('status'),
    acknowledgedAt: t.expose('acknowledgedAt', { type: 'DateTime', nullable: true }),
    acknowledgedBy: t.exposeString('acknowledgedBy', { nullable: true }),
    resolvedAt: t.expose('resolvedAt', { type: 'DateTime', nullable: true }),
    emailSent: t.exposeBoolean('emailSent'),
    smsSent: t.exposeBoolean('smsSent'),
    webhookSent: t.exposeBoolean('webhookSent'),
    port: t.relation('port'),
    zone: t.relation('zone', { nullable: true }),
    vessel: t.relation('vessel', { nullable: true }),
  }),
});

// ===============================
// QUERIES
// ===============================

// Get current congestion status for a port
builder.queryField('portCongestionStatus', (t) =>
  t.prismaField({
    type: ['PortCongestionSnapshot'],
    args: {
      portId: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args) => {
      const latestTimestamp = await prisma.portCongestionSnapshot.findFirst({
        where: { portId: args.portId },
        orderBy: { timestamp: 'desc' },
        select: { timestamp: true },
      });

      if (!latestTimestamp) return [];

      return prisma.portCongestionSnapshot.findMany({
        ...query,
        where: {
          portId: args.portId,
          timestamp: latestTimestamp.timestamp,
        },
      });
    },
  }),
);

// Get historical congestion trends
builder.queryField('portCongestionHistory', (t) =>
  t.prismaField({
    type: ['PortCongestionSnapshot'],
    args: {
      portId: t.arg.string({ required: true }),
      zoneId: t.arg.string({ required: false }),
      fromDate: t.arg({ type: 'DateTime', required: true }),
      toDate: t.arg({ type: 'DateTime', required: true }),
    },
    resolve: async (query, _root, args) => {
      return prisma.portCongestionSnapshot.findMany({
        ...query,
        where: {
          portId: args.portId,
          ...(args.zoneId && { zoneId: args.zoneId }),
          timestamp: {
            gte: args.fromDate,
            lte: args.toDate,
          },
        },
        orderBy: { timestamp: 'asc' },
      });
    },
  }),
);

// Get active detections (vessels currently waiting)
builder.queryField('activeCongestionDetections', (t) =>
  t.prismaField({
    type: ['PortCongestionDetection'],
    args: {
      portId: t.arg.string({ required: false }),
      zoneId: t.arg.string({ required: false }),
      congestionLevel: t.arg.string({ required: false }),
    },
    resolve: async (query, _root, args) => {
      return prisma.portCongestionDetection.findMany({
        ...query,
        where: {
          ...(args.portId && { portId: args.portId }),
          ...(args.zoneId && { zoneId: args.zoneId }),
          ...(args.congestionLevel && { congestionLevel: args.congestionLevel }),
          isActive: true,
        },
        orderBy: { arrivalTime: 'asc' },
      });
    },
  }),
);

// Get active alerts
builder.queryField('portCongestionAlerts', (t) =>
  t.prismaField({
    type: ['PortCongestionAlert'],
    args: {
      portId: t.arg.string({ required: false }),
      severity: t.arg.string({ required: false }),
      status: t.arg.string({ required: false }),
    },
    resolve: async (query, _root, args) => {
      return prisma.portCongestionAlert.findMany({
        ...query,
        where: {
          ...(args.portId && { portId: args.portId }),
          ...(args.severity && { severity: args.severity }),
          status: args.status || 'ACTIVE',
        },
        orderBy: { triggeredAt: 'desc' },
      });
    },
  }),
);

// Get all congestion zones for a port
builder.queryField('portCongestionZones', (t) =>
  t.prismaField({
    type: ['PortCongestionZone'],
    args: {
      portId: t.arg.string({ required: true }),
      isActive: t.arg.boolean({ required: false }),
    },
    resolve: async (query, _root, args) => {
      return prisma.portCongestionZone.findMany({
        ...query,
        where: {
          portId: args.portId,
          ...(args.isActive !== undefined && { isActive: args.isActive }),
        },
        orderBy: { priority: 'desc' },
      });
    },
  }),
);

// ===============================
// MUTATIONS
// ===============================

// Acknowledge alert
builder.mutationField('acknowledgePortCongestionAlert', (t) =>
  t.prismaField({
    type: 'PortCongestionAlert',
    args: {
      alertId: t.arg.string({ required: true }),
      userId: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args) => {
      return prisma.portCongestionAlert.update({
        ...query,
        where: { id: args.alertId },
        data: {
          status: 'ACKNOWLEDGED',
          acknowledgedAt: new Date(),
          acknowledgedBy: args.userId,
        },
      });
    },
  }),
);

// Resolve alert
builder.mutationField('resolvePortCongestionAlert', (t) =>
  t.prismaField({
    type: 'PortCongestionAlert',
    args: {
      alertId: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args) => {
      return prisma.portCongestionAlert.update({
        ...query,
        where: { id: args.alertId },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
        },
      });
    },
  }),
);
