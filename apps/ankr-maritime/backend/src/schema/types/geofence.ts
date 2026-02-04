import { builder } from '../builder.js'

// ── Prisma Objects ───────────────────────────────────────────

builder.prismaObject('Geofence', {
  fields: (t) => ({
    id: t.exposeID('id'),
    organizationId: t.exposeString('organizationId'),
    name: t.exposeString('name'),
    description: t.exposeString('description', { nullable: true }),
    centerLat: t.exposeFloat('centerLat'),
    centerLon: t.exposeFloat('centerLon'),
    radiusNm: t.exposeFloat('radiusNm'),
    polygonCoords: t.expose('polygonCoords', { type: 'JSON', nullable: true }),
    fenceType: t.exposeString('fenceType'),
    vesselIds: t.exposeStringList('vesselIds'),
    alertOnEntry: t.exposeBoolean('alertOnEntry'),
    alertOnExit: t.exposeBoolean('alertOnExit'),
    alertOnDwell: t.exposeBoolean('alertOnDwell'),
    dwellThresholdHrs: t.exposeFloat('dwellThresholdHrs'),
    active: t.exposeBoolean('active'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    alerts: t.relation('alerts'),
  }),
})

builder.prismaObject('GeofenceAlert', {
  fields: (t) => ({
    id: t.exposeID('id'),
    geofenceId: t.exposeString('geofenceId'),
    vesselId: t.exposeString('vesselId'),
    voyageId: t.exposeString('voyageId', { nullable: true }),
    eventType: t.exposeString('eventType'),
    latitude: t.exposeFloat('latitude'),
    longitude: t.exposeFloat('longitude'),
    speed: t.exposeFloat('speed', { nullable: true }),
    heading: t.exposeFloat('heading', { nullable: true }),
    acknowledged: t.exposeBoolean('acknowledged'),
    acknowledgedBy: t.exposeString('acknowledgedBy', { nullable: true }),
    acknowledgedAt: t.expose('acknowledgedAt', { type: 'DateTime', nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    geofence: t.relation('geofence'),
    vessel: t.relation('vessel'),
  }),
})

// ── Queries ──────────────────────────────────────────────────

builder.queryField('geofences', (t) =>
  t.prismaField({
    type: ['Geofence'],
    resolve: (query, _root, _args, ctx) =>
      ctx.prisma.geofence.findMany({
        ...query,
        where: ctx.orgFilter(),
        orderBy: { createdAt: 'desc' },
      }),
  }),
)

builder.queryField('geofenceAlerts', (t) =>
  t.prismaField({
    type: ['GeofenceAlert'],
    args: {
      vesselId: t.arg.string({ required: false }),
      acknowledged: t.arg.boolean({ required: false }),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.user?.organizationId
      return ctx.prisma.geofenceAlert.findMany({
        ...query,
        where: {
          ...(orgId && { geofence: { organizationId: orgId } }),
          ...(args.vesselId && { vesselId: args.vesselId }),
          ...(args.acknowledged != null && { acknowledged: args.acknowledged }),
        },
        orderBy: { createdAt: 'desc' },
      })
    },
  }),
)

builder.queryField('activeGeofences', (t) =>
  t.prismaField({
    type: ['Geofence'],
    resolve: (query, _root, _args, ctx) =>
      ctx.prisma.geofence.findMany({
        ...query,
        where: { ...ctx.orgFilter(), active: true },
        orderBy: { name: 'asc' },
      }),
  }),
)

// ── Mutations ────────────────────────────────────────────────

builder.mutationField('createGeofence', (t) =>
  t.prismaField({
    type: 'Geofence',
    args: {
      name: t.arg.string({ required: true }),
      centerLat: t.arg.float({ required: true }),
      centerLon: t.arg.float({ required: true }),
      radiusNm: t.arg.float({ required: true }),
      fenceType: t.arg.string({ required: false }),
      vesselIds: t.arg.stringList({ required: false }),
      alertOnEntry: t.arg.boolean({ required: false }),
      alertOnExit: t.arg.boolean({ required: false }),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId()
      return ctx.prisma.geofence.create({
        ...query,
        data: {
          organizationId: orgId,
          name: args.name,
          centerLat: args.centerLat,
          centerLon: args.centerLon,
          radiusNm: args.radiusNm,
          fenceType: args.fenceType ?? 'circle',
          vesselIds: args.vesselIds ?? [],
          alertOnEntry: args.alertOnEntry ?? true,
          alertOnExit: args.alertOnExit ?? true,
        },
      })
    },
  }),
)

builder.mutationField('updateGeofence', (t) =>
  t.prismaField({
    type: 'Geofence',
    args: {
      id: t.arg.string({ required: true }),
      name: t.arg.string(),
      centerLat: t.arg.float(),
      centerLon: t.arg.float(),
      radiusNm: t.arg.float(),
      fenceType: t.arg.string(),
      vesselIds: t.arg.stringList({ required: false }),
      alertOnEntry: t.arg.boolean(),
      alertOnExit: t.arg.boolean(),
      active: t.arg.boolean(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.geofence.update({
        ...query,
        where: { id: args.id },
        data: {
          ...(args.name && { name: args.name }),
          ...(args.centerLat != null && { centerLat: args.centerLat }),
          ...(args.centerLon != null && { centerLon: args.centerLon }),
          ...(args.radiusNm != null && { radiusNm: args.radiusNm }),
          ...(args.fenceType && { fenceType: args.fenceType }),
          ...(args.vesselIds && { vesselIds: args.vesselIds }),
          ...(args.alertOnEntry != null && { alertOnEntry: args.alertOnEntry }),
          ...(args.alertOnExit != null && { alertOnExit: args.alertOnExit }),
          ...(args.active != null && { active: args.active }),
        },
      }),
  }),
)

builder.mutationField('deleteGeofence', (t) =>
  t.prismaField({
    type: 'Geofence',
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.geofence.delete({ ...query, where: { id: args.id } }),
  }),
)

builder.mutationField('triggerGeofenceAlert', (t) =>
  t.prismaField({
    type: 'GeofenceAlert',
    args: {
      geofenceId: t.arg.string({ required: true }),
      vesselId: t.arg.string({ required: true }),
      eventType: t.arg.string({ required: true }),
      latitude: t.arg.float({ required: true }),
      longitude: t.arg.float({ required: true }),
      speed: t.arg.float(),
      heading: t.arg.float(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.geofenceAlert.create({
        ...query,
        data: {
          geofenceId: args.geofenceId,
          vesselId: args.vesselId,
          eventType: args.eventType,
          latitude: args.latitude,
          longitude: args.longitude,
          speed: args.speed ?? undefined,
          heading: args.heading ?? undefined,
        },
      }),
  }),
)

builder.mutationField('acknowledgeGeofenceAlert', (t) =>
  t.prismaField({
    type: 'GeofenceAlert',
    args: {
      id: t.arg.string({ required: true }),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const userName = ctx.user?.name ?? 'Unknown'
      return ctx.prisma.geofenceAlert.update({
        ...query,
        where: { id: args.id },
        data: {
          acknowledged: true,
          acknowledgedBy: userName,
          acknowledgedAt: new Date(),
          notes: args.notes ?? undefined,
        },
      })
    },
  }),
)
