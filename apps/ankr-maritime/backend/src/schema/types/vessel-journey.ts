/**
 * VESSEL JOURNEY TRACKING
 * Intelligent hybrid tracking with gap filling
 */

import { builder } from '../builder.js';
import { HybridVesselTracker } from '../../services/hybrid-vessel-tracker.js';

// Position type
const Position = builder.objectRef<{ lat: number; lon: number }>('Position').implement({
  fields: (t) => ({
    lat: t.exposeFloat('lat'),
    lon: t.exposeFloat('lon'),
  }),
});

// Vessel Status
const VesselStatusType = builder.objectRef<{
  status: string;
  position: { lat: number; lon: number } | null;
  speed: number | null;
  heading: number | null;
  timestamp: Date;
  source: string;
  quality: number;
  port?: { name: string; arrival: Date; departure?: Date };
  lastKnown?: { position: { lat: number; lon: number }; timestamp: Date; port?: string };
  estimated?: { position: { lat: number; lon: number }; confidence: number; method: string };
}>('VesselStatus').implement({
  fields: (t) => ({
    status: t.exposeString('status'),
    position: t.field({
      type: Position,
      nullable: true,
      resolve: (parent) => parent.position,
    }),
    speed: t.exposeFloat('speed', { nullable: true }),
    heading: t.exposeFloat('heading', { nullable: true }),
    timestamp: t.expose('timestamp', { type: 'DateTime' }),
    source: t.exposeString('source'),
    quality: t.exposeFloat('quality'),
    portName: t.string({
      nullable: true,
      resolve: (parent) => parent.port?.name || null,
    }),
    portArrival: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (parent) => parent.port?.arrival || null,
    }),
    lastKnownPosition: t.field({
      type: Position,
      nullable: true,
      resolve: (parent) => parent.lastKnown?.position || null,
    }),
    lastKnownTime: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (parent) => parent.lastKnown?.timestamp || null,
    }),
    estimatedPosition: t.field({
      type: Position,
      nullable: true,
      resolve: (parent) => parent.estimated?.position || null,
    }),
    estimatedConfidence: t.float({
      nullable: true,
      resolve: (parent) => parent.estimated?.confidence || null,
    }),
  }),
});

// Playback Waypoint (for journey animation)
const PlaybackWaypoint = builder.objectRef<{
  lat: number;
  lon: number;
  timestamp: Date;
  speed?: number;
  heading?: number;
}>('PlaybackWaypoint').implement({
  fields: (t) => ({
    lat: t.exposeFloat('lat'),
    lon: t.exposeFloat('lon'),
    timestamp: t.expose('timestamp', { type: 'DateTime' }),
    speed: t.exposeFloat('speed', { nullable: true }),
    heading: t.exposeFloat('heading', { nullable: true }),
  }),
});

// Journey Segment
const JourneySegment = builder.objectRef<{
  type: string;
  startTime: Date;
  endTime: Date;
  startPosition?: { lat: number; lon: number };
  endPosition?: { lat: number; lon: number };
  port?: string;
  positions?: Array<{ lat: number; lon: number; timestamp: Date }>;
  estimatedRoute?: Array<{ lat: number; lon: number }>;
}>('JourneySegment').implement({
  fields: (t) => ({
    type: t.exposeString('type'),
    startTime: t.expose('startTime', { type: 'DateTime' }),
    endTime: t.expose('endTime', { type: 'DateTime' }),
    startPosition: t.field({
      type: Position,
      nullable: true,
      resolve: (parent) => parent.startPosition || null,
    }),
    endPosition: t.field({
      type: Position,
      nullable: true,
      resolve: (parent) => parent.endPosition || null,
    }),
    port: t.exposeString('port', { nullable: true }),
    estimatedRoute: t.field({
      type: [Position],
      nullable: true,
      resolve: (parent) => parent.estimatedRoute || null,
    }),
    playbackWaypoints: t.field({
      type: [PlaybackWaypoint],
      nullable: true,
      resolve: (parent) => {
        // Generate 60 timestamped waypoints for smooth playback
        if (!parent.estimatedRoute || parent.estimatedRoute.length === 0) {
          return null;
        }
        return generateTimestampedWaypoints(
          parent.estimatedRoute,
          parent.startTime,
          parent.endTime,
          60
        );
      },
    }),
    duration: t.float({
      resolve: (parent) => {
        return (parent.endTime.getTime() - parent.startTime.getTime()) / (1000 * 60 * 60);
      },
    }),
  }),
});

// Helper function to generate timestamped waypoints for playback
function generateTimestampedWaypoints(
  route: Array<{ lat: number; lon: number }>,
  startTime: Date,
  endTime: Date,
  numPoints: number
): Array<{ lat: number; lon: number; timestamp: Date }> {
  const waypoints = [];
  const totalDuration = endTime.getTime() - startTime.getTime();

  for (let i = 0; i < numPoints; i++) {
    const progress = i / (numPoints - 1);
    const routeIndex = Math.floor(progress * (route.length - 1));
    const nextIndex = Math.min(routeIndex + 1, route.length - 1);
    const localProgress = (progress * (route.length - 1)) % 1;

    // Interpolate position
    const lat = route[routeIndex].lat +
                (route[nextIndex].lat - route[routeIndex].lat) * localProgress;
    const lon = route[routeIndex].lon +
                (route[nextIndex].lon - route[routeIndex].lon) * localProgress;

    // Calculate timestamp
    const timestamp = new Date(startTime.getTime() + totalDuration * progress);

    waypoints.push({ lat, lon, timestamp });
  }

  return waypoints;
}

// Port Visit
const PortVisit = builder.objectRef<{
  port: string;
  arrival: Date;
  departure: Date;
  duration: number;
  position: { lat: number; lon: number };
}>('PortVisit').implement({
  fields: (t) => ({
    port: t.exposeString('port'),
    arrival: t.expose('arrival', { type: 'DateTime' }),
    departure: t.expose('departure', { type: 'DateTime' }),
    duration: t.exposeFloat('duration'),
    position: t.field({
      type: Position,
      resolve: (parent) => parent.position,
    }),
  }),
});

// Journey Stats
const JourneyStats = builder.objectRef<{
  totalDistance: number;
  totalDuration: number;
  portStops: number;
  aisGaps: number;
}>('JourneyStats').implement({
  fields: (t) => ({
    totalDistance: t.exposeFloat('totalDistance'),
    totalDuration: t.exposeFloat('totalDuration'),
    portStops: t.exposeInt('portStops'),
    aisGaps: t.exposeInt('aisGaps'),
  }),
});

// Vessel Journey
const VesselJourney = builder.objectRef<{
  vessel: { mmsi: string; name: string | null; type: string };
  currentStatus: any;
  segments: any[];
  portVisits: any[];
  stats: any;
}>('VesselJourney').implement({
  fields: (t) => ({
    vesselMmsi: t.string({
      resolve: (parent) => parent.vessel.mmsi,
    }),
    vesselName: t.string({
      nullable: true,
      resolve: (parent) => parent.vessel.name,
    }),
    vesselType: t.string({
      resolve: (parent) => parent.vessel.type,
    }),
    currentStatus: t.field({
      type: VesselStatusType,
      resolve: (parent) => parent.currentStatus,
    }),
    segments: t.field({
      type: [JourneySegment],
      resolve: (parent) => parent.segments,
    }),
    portVisits: t.field({
      type: [PortVisit],
      resolve: (parent) => parent.portVisits,
    }),
    stats: t.field({
      type: JourneyStats,
      resolve: (parent) => parent.stats,
    }),
  }),
});

/**
 * Get vessel status with intelligent source switching
 */
builder.queryField('vesselStatus', (t) =>
  t.field({
    type: VesselStatusType,
    description: 'Get vessel status with intelligent AIS/GFW switching',
    args: {
      mmsi: t.arg.string({ required: true }),
    },
    resolve: async (_root, args) => {
      const tracker = new HybridVesselTracker();
      return await tracker.getVesselStatus(args.mmsi);
    },
  })
);

/**
 * Get complete vessel journey with gap filling
 */
builder.queryField('vesselJourney', (t) =>
  t.field({
    type: VesselJourney,
    nullable: true,
    description: 'Get complete vessel journey with AIS gaps filled by GFW port visits',
    args: {
      mmsi: t.arg.string({ required: true }),
      daysBack: t.arg.int({ required: false, defaultValue: 30 }),
    },
    resolve: async (_root, args) => {
      const tracker = new HybridVesselTracker();
      return await tracker.getVesselJourney(args.mmsi, args.daysBack);
    },
  })
);
