import { builder } from '../builder.js';

// === EcaZone prisma object (static reference data — no org filter) ===
builder.prismaObject('EcaZone', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    code: t.exposeString('code'),
    type: t.exposeString('type'),
    fuelRequirement: t.exposeString('fuelRequirement', { nullable: true }),
    description: t.exposeString('description', { nullable: true }),
    polygon: t.expose('polygon', { type: 'JSON' }),
    active: t.exposeBoolean('active'),
    effectiveDate: t.expose('effectiveDate', { type: 'DateTime', nullable: true }),
    source: t.exposeString('source', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

// === Queries ===

builder.queryField('ecaZones', (t) =>
  t.prismaField({
    type: ['EcaZone'],
    args: {
      type: t.arg.string(),
    },
    resolve: (query, _root, args) => {
      const where: Record<string, unknown> = { active: true };
      if (args.type) where.type = args.type;
      return builder.options.prisma.client.ecaZone.findMany({
        ...query,
        where,
        orderBy: { name: 'asc' },
      });
    },
  }),
);

builder.queryField('ecaZone', (t) =>
  t.prismaField({
    type: 'EcaZone',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args) =>
      builder.options.prisma.client.ecaZone.findUnique({ ...query, where: { id: args.id } }),
  }),
);

// Custom object for ECA zone check result
const EcaZoneCheckResult = builder.objectRef<{
  latitude: number;
  longitude: number;
  inEcaZone: boolean;
  matchingZones: Array<{ id: string; name: string; code: string; type: string; fuelRequirement: string | null }>;
}>('EcaZoneCheckResult');

const EcaZoneMatch = builder.objectRef<{
  id: string;
  name: string;
  code: string;
  type: string;
  fuelRequirement: string | null;
}>('EcaZoneMatch');

EcaZoneMatch.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    code: t.exposeString('code'),
    type: t.exposeString('type'),
    fuelRequirement: t.exposeString('fuelRequirement', { nullable: true }),
  }),
});

EcaZoneCheckResult.implement({
  fields: (t) => ({
    latitude: t.exposeFloat('latitude'),
    longitude: t.exposeFloat('longitude'),
    inEcaZone: t.exposeBoolean('inEcaZone'),
    matchingZones: t.field({ type: [EcaZoneMatch], resolve: (parent) => parent.matchingZones }),
  }),
});

// Point-in-polygon ray-casting algorithm
function pointInPolygon(lat: number, lon: number, polygon: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > lon) !== (yj > lon)) &&
      (lat < (xj - xi) * (lon - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

builder.queryField('checkEcaZone', (t) =>
  t.field({
    type: EcaZoneCheckResult,
    args: {
      lat: t.arg.float({ required: true }),
      lon: t.arg.float({ required: true }),
    },
    resolve: async (_root, args) => {
      const zones = await builder.options.prisma.client.ecaZone.findMany({
        where: { active: true },
      });

      const matchingZones: Array<{ id: string; name: string; code: string; type: string; fuelRequirement: string | null }> = [];
      for (const zone of zones) {
        const polygon = zone.polygon as number[][];
        if (Array.isArray(polygon) && pointInPolygon(args.lat, args.lon, polygon)) {
          matchingZones.push({
            id: zone.id,
            name: zone.name,
            code: zone.code,
            type: zone.type,
            fuelRequirement: zone.fuelRequirement,
          });
        }
      }

      return {
        latitude: args.lat,
        longitude: args.lon,
        inEcaZone: matchingZones.length > 0,
        matchingZones,
      };
    },
  }),
);

// === Mutation (admin seed helper) ===

builder.mutationField('createEcaZone', (t) =>
  t.prismaField({
    type: 'EcaZone',
    args: {
      name: t.arg.string({ required: true }),
      code: t.arg.string({ required: true }),
      type: t.arg.string({ required: true }),
      fuelRequirement: t.arg.string(),
      description: t.arg.string(),
      polygon: t.arg({ type: 'JSON', required: true }),
      effectiveDate: t.arg({ type: 'DateTime' }),
      source: t.arg.string(),
    },
    resolve: (query, _root, args) =>
      builder.options.prisma.client.ecaZone.create({
        ...query,
        data: {
          name: args.name,
          code: args.code,
          type: args.type,
          fuelRequirement: args.fuelRequirement ?? undefined,
          description: args.description ?? undefined,
          polygon: args.polygon as object,
          effectiveDate: args.effectiveDate ?? undefined,
          source: args.source ?? undefined,
        },
      }),
  }),
);
