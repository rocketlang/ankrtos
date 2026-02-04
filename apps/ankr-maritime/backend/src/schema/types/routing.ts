import { builder } from '../builder.js';

/**
 * Sea Routing Engine — Great Circle + Haversine
 * Free First: no external API, pure math.
 */

interface RouteResult {
  distanceNm: number;
  distanceKm: number;
  estimatedDays: number;
  estimatedHours: number;
  speedKnots: number;
  fromPort: { unlocode: string; name: string; lat: number; lng: number };
  toPort: { unlocode: string; name: string; lat: number; lng: number };
  waypoints: Array<{ lat: number; lng: number }>;
}

const RouteResultType = builder.objectRef<RouteResult>('RouteResult');

const PortCoord = builder.objectRef<{ unlocode: string; name: string; lat: number; lng: number }>('PortCoord');

builder.objectType(PortCoord, {
  fields: (t) => ({
    unlocode: t.exposeString('unlocode'),
    name: t.exposeString('name'),
    lat: t.exposeFloat('lat'),
    lng: t.exposeFloat('lng'),
  }),
});

const Waypoint = builder.objectRef<{ lat: number; lng: number }>('Waypoint');

builder.objectType(Waypoint, {
  fields: (t) => ({
    lat: t.exposeFloat('lat'),
    lng: t.exposeFloat('lng'),
  }),
});

builder.objectType(RouteResultType, {
  fields: (t) => ({
    distanceNm: t.exposeFloat('distanceNm'),
    distanceKm: t.exposeFloat('distanceKm'),
    estimatedDays: t.exposeFloat('estimatedDays'),
    estimatedHours: t.exposeFloat('estimatedHours'),
    speedKnots: t.exposeFloat('speedKnots'),
    fromPort: t.field({ type: PortCoord, resolve: (p) => p.fromPort }),
    toPort: t.field({ type: PortCoord, resolve: (p) => p.toPort }),
    waypoints: t.field({ type: [Waypoint], resolve: (p) => p.waypoints }),
  }),
});

// Haversine formula
function haversineNm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3440.065; // Earth radius in nautical miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Generate great circle waypoints
function greatCircleWaypoints(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
  segments: number = 20,
): Array<{ lat: number; lng: number }> {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const points: Array<{ lat: number; lng: number }> = [];

  const phi1 = toRad(lat1), lambda1 = toRad(lng1);
  const phi2 = toRad(lat2), lambda2 = toRad(lng2);

  const d = 2 * Math.asin(
    Math.sqrt(
      Math.sin((phi2 - phi1) / 2) ** 2 +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin((lambda2 - lambda1) / 2) ** 2,
    ),
  );

  for (let i = 0; i <= segments; i++) {
    const f = i / segments;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(phi1) * Math.cos(lambda1) + B * Math.cos(phi2) * Math.cos(lambda2);
    const y = A * Math.cos(phi1) * Math.sin(lambda1) + B * Math.cos(phi2) * Math.sin(lambda2);
    const z = A * Math.sin(phi1) + B * Math.sin(phi2);
    const lat = toDeg(Math.atan2(z, Math.sqrt(x ** 2 + y ** 2)));
    const lng = toDeg(Math.atan2(y, x));
    points.push({ lat: Math.round(lat * 10000) / 10000, lng: Math.round(lng * 10000) / 10000 });
  }

  return points;
}

builder.queryField('calculateRoute', (t) =>
  t.field({
    type: RouteResultType,
    args: {
      fromUnlocode: t.arg.string({ required: true }),
      toUnlocode: t.arg.string({ required: true }),
      speedKnots: t.arg.float(), // default 12
    },
    resolve: async (_root, args, ctx) => {
      const from = await ctx.prisma.port.findUnique({ where: { unlocode: args.fromUnlocode } });
      const to = await ctx.prisma.port.findUnique({ where: { unlocode: args.toUnlocode } });

      if (!from || !to) throw new Error('Port not found');
      if (from.latitude == null || from.longitude == null) throw new Error(`No coordinates for ${from.unlocode}`);
      if (to.latitude == null || to.longitude == null) throw new Error(`No coordinates for ${to.unlocode}`);

      const speed = args.speedKnots ?? 12;
      const distanceNm = haversineNm(from.latitude, from.longitude, to.latitude, to.longitude);
      const distanceKm = distanceNm * 1.852;
      const estimatedHours = distanceNm / speed;
      const estimatedDays = estimatedHours / 24;
      const waypoints = greatCircleWaypoints(from.latitude, from.longitude, to.latitude, to.longitude);

      return {
        distanceNm: Math.round(distanceNm * 10) / 10,
        distanceKm: Math.round(distanceKm * 10) / 10,
        estimatedDays: Math.round(estimatedDays * 100) / 100,
        estimatedHours: Math.round(estimatedHours * 10) / 10,
        speedKnots: speed,
        fromPort: { unlocode: from.unlocode, name: from.name, lat: from.latitude, lng: from.longitude },
        toPort: { unlocode: to.unlocode, name: to.name, lat: to.latitude, lng: to.longitude },
        waypoints,
      };
    },
  }),
);
