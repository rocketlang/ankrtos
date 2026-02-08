/**
 * Live Vessel Positions for Map Display
 * Returns recent positions of all active vessels
 */

import { builder } from '../builder.js';
import { prisma } from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';

// Vessel Position Type
const LiveVesselPosition = builder.objectRef<{
  vesselId: string;
  vesselName: string | null;
  vesselType: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  timestamp: Date;
}>('LiveVesselPosition').implement({
  fields: (t) => ({
    vesselId: t.exposeString('vesselId'),
    vesselName: t.exposeString('vesselName', { nullable: true }),
    vesselType: t.exposeString('vesselType'),
    latitude: t.exposeFloat('latitude'),
    longitude: t.exposeFloat('longitude'),
    speed: t.exposeFloat('speed', { nullable: true }),
    heading: t.exposeFloat('heading', { nullable: true }),
    timestamp: t.expose('timestamp', { type: 'DateTime' }),
  }),
});

// Query - get latest position for each vessel (with viewport bounds for region-based rendering)
builder.queryField('liveVesselPositions', (t) =>
  t.field({
    type: [LiveVesselPosition],
    description: 'Latest position for active vessels in viewport (region-based rendering)',
    args: {
      limit: t.arg.int({ required: false, defaultValue: 500 }),
      // Viewport bounds (optional - if not provided, returns global sample)
      minLat: t.arg.float({ required: false }),
      maxLat: t.arg.float({ required: false }),
      minLng: t.arg.float({ required: false }),
      maxLng: t.arg.float({ required: false }),
    },
    resolve: async (_root, args) => {
      const limit = Math.min(args.limit || 500, 2000); // Cap at 2000 max
      const { minLat, maxLat, minLng, maxLng } = args;

      // Build WHERE clause based on viewport bounds
      const boundsFilter = (minLat !== null && minLat !== undefined &&
                           maxLat !== null && maxLat !== undefined &&
                           minLng !== null && minLng !== undefined &&
                           maxLng !== null && maxLng !== undefined)
        ? `AND vp.latitude BETWEEN ${minLat} AND ${maxLat}
           AND vp.longitude BETWEEN ${minLng} AND ${maxLng}`
        : '';

      // Get latest position for each vessel from last 6 hours (with optional viewport filter)
      const positions = await prisma.$queryRaw<Array<{
        vessel_id: string;
        vessel_name: string | null;
        vessel_type: string;
        latitude: number;
        longitude: number;
        speed: number | null;
        heading: number | null;
        timestamp: Date;
      }>>`
        SELECT DISTINCT ON (vp."vesselId")
          vp."vesselId" as vessel_id,
          v.name as vessel_name,
          v.type as vessel_type,
          vp.latitude,
          vp.longitude,
          vp.speed,
          vp.heading,
          vp.timestamp
        FROM vessel_positions vp
        INNER JOIN vessels v ON vp."vesselId" = v.id
        WHERE vp.timestamp > NOW() - INTERVAL '6 hours'
        ${boundsFilter ? Prisma.raw(boundsFilter) : Prisma.empty}
        ORDER BY vp."vesselId", vp.timestamp DESC
        LIMIT ${limit}
      `;

      return positions.map(p => ({
        vesselId: p.vessel_id,
        vesselName: p.vessel_name,
        vesselType: p.vessel_type,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        speed: p.speed ? Number(p.speed) : null,
        heading: p.heading ? Number(p.heading) : null,
        timestamp: p.timestamp,
      }));
    },
  })
);
