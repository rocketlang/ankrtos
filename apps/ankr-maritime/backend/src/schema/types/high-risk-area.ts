import { builder } from '../builder.js';

// === HighRiskArea prisma object (static reference data — no org filter) ===
builder.prismaObject('HighRiskArea', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    code: t.exposeString('code'),
    riskType: t.exposeString('riskType'),
    riskLevel: t.exposeString('riskLevel'),
    description: t.exposeString('description', { nullable: true }),
    polygon: t.expose('polygon', { type: 'JSON' }),
    advisory: t.exposeString('advisory', { nullable: true }),
    insuranceSurcharge: t.exposeFloat('insuranceSurcharge', { nullable: true }),
    bmpRequired: t.exposeBoolean('bmpRequired'),
    armedGuards: t.exposeString('armedGuards', { nullable: true }),
    active: t.exposeBoolean('active'),
    lastUpdated: t.expose('lastUpdated', { type: 'DateTime' }),
    source: t.exposeString('source', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

// === Queries ===

builder.queryField('highRiskAreas', (t) =>
  t.prismaField({
    type: ['HighRiskArea'],
    args: {
      riskType: t.arg.string(),
      riskLevel: t.arg.string(),
    },
    resolve: (query, _root, args) => {
      const where: Record<string, unknown> = { active: true };
      if (args.riskType) where.riskType = args.riskType;
      if (args.riskLevel) where.riskLevel = args.riskLevel;
      return builder.options.prisma.client.highRiskArea.findMany({
        ...query,
        where,
        orderBy: { name: 'asc' },
      });
    },
  }),
);

builder.queryField('highRiskArea', (t) =>
  t.prismaField({
    type: 'HighRiskArea',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args) =>
      builder.options.prisma.client.highRiskArea.findUnique({ ...query, where: { id: args.id } }),
  }),
);

// Custom object for high risk area check result
const HighRiskAreaMatch = builder.objectRef<{
  id: string;
  name: string;
  code: string;
  riskType: string;
  riskLevel: string;
  advisory: string | null;
  insuranceSurcharge: number | null;
  bmpRequired: boolean;
  armedGuards: string | null;
}>('HighRiskAreaMatch');

HighRiskAreaMatch.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    code: t.exposeString('code'),
    riskType: t.exposeString('riskType'),
    riskLevel: t.exposeString('riskLevel'),
    advisory: t.exposeString('advisory', { nullable: true }),
    insuranceSurcharge: t.exposeFloat('insuranceSurcharge', { nullable: true }),
    bmpRequired: t.exposeBoolean('bmpRequired'),
    armedGuards: t.exposeString('armedGuards', { nullable: true }),
  }),
});

const HighRiskAreaCheckResult = builder.objectRef<{
  latitude: number;
  longitude: number;
  inHighRiskArea: boolean;
  highestRiskLevel: string | null;
  matchingAreas: Array<{
    id: string;
    name: string;
    code: string;
    riskType: string;
    riskLevel: string;
    advisory: string | null;
    insuranceSurcharge: number | null;
    bmpRequired: boolean;
    armedGuards: string | null;
  }>;
}>('HighRiskAreaCheckResult');

HighRiskAreaCheckResult.implement({
  fields: (t) => ({
    latitude: t.exposeFloat('latitude'),
    longitude: t.exposeFloat('longitude'),
    inHighRiskArea: t.exposeBoolean('inHighRiskArea'),
    highestRiskLevel: t.exposeString('highestRiskLevel', { nullable: true }),
    matchingAreas: t.field({ type: [HighRiskAreaMatch], resolve: (parent) => parent.matchingAreas }),
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

const RISK_LEVEL_ORDER: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

builder.queryField('checkHighRiskArea', (t) =>
  t.field({
    type: HighRiskAreaCheckResult,
    args: {
      lat: t.arg.float({ required: true }),
      lon: t.arg.float({ required: true }),
    },
    resolve: async (_root, args) => {
      const areas = await builder.options.prisma.client.highRiskArea.findMany({
        where: { active: true },
      });

      const matchingAreas: Array<{
        id: string;
        name: string;
        code: string;
        riskType: string;
        riskLevel: string;
        advisory: string | null;
        insuranceSurcharge: number | null;
        bmpRequired: boolean;
        armedGuards: string | null;
      }> = [];

      for (const area of areas) {
        const polygon = area.polygon as number[][];
        if (Array.isArray(polygon) && pointInPolygon(args.lat, args.lon, polygon)) {
          matchingAreas.push({
            id: area.id,
            name: area.name,
            code: area.code,
            riskType: area.riskType,
            riskLevel: area.riskLevel,
            advisory: area.advisory,
            insuranceSurcharge: area.insuranceSurcharge,
            bmpRequired: area.bmpRequired,
            armedGuards: area.armedGuards,
          });
        }
      }

      // Determine highest risk level among matching areas
      let highestRiskLevel: string | null = null;
      let highestOrder = 0;
      for (const area of matchingAreas) {
        const order = RISK_LEVEL_ORDER[area.riskLevel] ?? 0;
        if (order > highestOrder) {
          highestOrder = order;
          highestRiskLevel = area.riskLevel;
        }
      }

      return {
        latitude: args.lat,
        longitude: args.lon,
        inHighRiskArea: matchingAreas.length > 0,
        highestRiskLevel,
        matchingAreas,
      };
    },
  }),
);

// === Mutation (admin seed helper) ===

builder.mutationField('createHighRiskArea', (t) =>
  t.prismaField({
    type: 'HighRiskArea',
    args: {
      name: t.arg.string({ required: true }),
      code: t.arg.string({ required: true }),
      riskType: t.arg.string({ required: true }),
      riskLevel: t.arg.string({ required: true }),
      description: t.arg.string(),
      polygon: t.arg({ type: 'JSON', required: true }),
      advisory: t.arg.string(),
      insuranceSurcharge: t.arg.float(),
      bmpRequired: t.arg.boolean(),
      armedGuards: t.arg.string(),
      source: t.arg.string(),
    },
    resolve: (query, _root, args) =>
      builder.options.prisma.client.highRiskArea.create({
        ...query,
        data: {
          name: args.name,
          code: args.code,
          riskType: args.riskType,
          riskLevel: args.riskLevel,
          description: args.description ?? undefined,
          polygon: args.polygon as object,
          advisory: args.advisory ?? undefined,
          insuranceSurcharge: args.insuranceSurcharge ?? undefined,
          bmpRequired: args.bmpRequired ?? false,
          armedGuards: args.armedGuards ?? undefined,
          source: args.source ?? undefined,
        },
      }),
  }),
);
