/**
 * VESSEL ETA PREDICTIONS
 * Smart arrival time predictions based on journey data
 */

import { builder } from '../builder.js';
import { prisma } from '../../lib/prisma.js';
import { HybridVesselTracker } from '../../services/hybrid-vessel-tracker.js';

// ETA Prediction
const VesselETAPrediction = builder.objectRef<{
  mmsi: string;
  vesselName: string | null;
  currentPosition: { lat: number; lon: number } | null;
  destination: { lat: number; lon: number; port?: string } | null;
  estimatedArrival: Date;
  confidence: number;
  distanceRemaining: number; // nautical miles
  estimatedDuration: number; // hours
  averageSpeed: number; // knots
  qualityImpact: string;
  method: string;
}>('VesselETAPrediction').implement({
  fields: (t) => ({
    mmsi: t.exposeString('mmsi'),
    vesselName: t.exposeString('vesselName', { nullable: true }),
    currentPosition: t.field({
      type: builder.objectRef<{ lat: number; lon: number }>('VesselETAPosition').implement({
        fields: (t) => ({
          lat: t.exposeFloat('lat'),
          lon: t.exposeFloat('lon'),
        }),
      }),
      nullable: true,
      resolve: (parent) => parent.currentPosition,
    }),
    destination: t.field({
      type: builder.objectRef<{ lat: number; lon: number; port?: string }>('VesselETADestination').implement({
        fields: (t) => ({
          lat: t.exposeFloat('lat'),
          lon: t.exposeFloat('lon'),
          port: t.exposeString('port', { nullable: true }),
        }),
      }),
      nullable: true,
      resolve: (parent) => parent.destination,
    }),
    estimatedArrival: t.expose('estimatedArrival', { type: 'DateTime' }),
    confidence: t.exposeFloat('confidence'),
    distanceRemaining: t.exposeFloat('distanceRemaining'),
    estimatedDuration: t.exposeFloat('estimatedDuration'),
    averageSpeed: t.exposeFloat('averageSpeed'),
    qualityImpact: t.exposeString('qualityImpact'),
    method: t.exposeString('method'),
  }),
});

// Helper: Calculate distance between two points (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper: Get average speed for vessel type
function getAverageSpeedForType(type: string): number {
  const speeds: Record<string, number> = {
    'container': 20,
    'tanker': 14,
    'bulk_carrier': 13,
    'general_cargo': 12,
    'vehicle_carrier': 18,
    'passenger': 22,
    'reefer': 19,
  };

  const normalizedType = type.toLowerCase().replace(/\s+/g, '_');
  for (const [key, speed] of Object.entries(speeds)) {
    if (normalizedType.includes(key)) {
      return speed;
    }
  }

  return 15; // Default speed
}

/**
 * Calculate ETA for a vessel
 */
builder.queryField('calculateETA', (t) =>
  t.field({
    type: VesselETAPrediction,
    nullable: true,
    description: 'Calculate ETA for a vessel to a destination',
    args: {
      mmsi: t.arg.string({ required: true }),
      destinationLat: t.arg.float({ required: true }),
      destinationLon: t.arg.float({ required: true }),
      destinationPort: t.arg.string({ required: false }),
    },
    resolve: async (_root, args) => {
      const tracker = new HybridVesselTracker();

      // Get vessel info
      const vessel = await prisma.vessel.findFirst({
        where: { mmsi: args.mmsi },
        select: { mmsi: true, name: true, type: true },
      });

      if (!vessel) {
        return null;
      }

      // Get current status
      const status = await tracker.getVesselStatus(args.mmsi);

      // Determine current position
      let currentPosition = status.position;
      if (!currentPosition && status.lastKnown?.position) {
        currentPosition = status.lastKnown.position;
      }
      if (!currentPosition && status.estimated?.position) {
        currentPosition = status.estimated.position;
      }

      if (!currentPosition) {
        console.log(`[ETA] No position available for ${args.mmsi}`);
        return null;
      }

      // Calculate distance
      const distance = calculateDistance(
        currentPosition.lat,
        currentPosition.lon,
        args.destinationLat,
        args.destinationLon
      );

      // Determine speed to use
      let speed: number;
      let method: string;
      let confidence: number;

      if (status.speed && status.speed > 0) {
        // Use current speed if available
        speed = status.speed;
        method = 'current_speed';
        confidence = status.quality;
      } else {
        // Use average speed for vessel type
        speed = getAverageSpeedForType(vessel.type);
        method = 'vessel_type_average';
        confidence = 0.6; // Lower confidence when using average
      }

      // Adjust confidence based on data quality
      if (status.quality < 0.5) {
        confidence = confidence * 0.7; // Reduce confidence for low quality data
      }

      // Calculate duration and ETA
      const durationHours = distance / speed;
      const estimatedArrival = new Date(Date.now() + durationHours * 60 * 60 * 1000);

      // Determine quality impact message
      let qualityImpact: string;
      if (status.quality >= 0.8) {
        qualityImpact = 'High quality tracking - reliable ETA';
      } else if (status.quality >= 0.5) {
        qualityImpact = 'Medium quality - ETA may vary';
      } else if (status.quality > 0) {
        qualityImpact = 'Low quality - ETA is rough estimate';
      } else {
        qualityImpact = 'No recent data - ETA based on vessel type average';
      }

      console.log(`[ETA] ${vessel.name || args.mmsi}: ${distance.toFixed(0)}nm @ ${speed.toFixed(1)}kn = ${durationHours.toFixed(1)}h (confidence: ${(confidence * 100).toFixed(0)}%)`);

      return {
        mmsi: args.mmsi,
        vesselName: vessel.name,
        currentPosition,
        destination: {
          lat: args.destinationLat,
          lon: args.destinationLon,
          port: args.destinationPort || undefined,
        },
        estimatedArrival,
        confidence,
        distanceRemaining: distance,
        estimatedDuration: durationHours,
        averageSpeed: speed,
        qualityImpact,
        method,
      };
    },
  })
);

/**
 * Get ETA for next port based on journey history
 */
builder.queryField('predictNextPort', (t) =>
  t.field({
    type: VesselETAPrediction,
    nullable: true,
    description: 'Predict next port and ETA based on vessel journey history',
    args: {
      mmsi: t.arg.string({ required: true }),
    },
    resolve: async (_root, args) => {
      const tracker = new HybridVesselTracker();

      // Get vessel journey to find recent ports
      const journey = await tracker.getVesselJourney(args.mmsi, 90);

      if (!journey || journey.portVisits.length === 0) {
        console.log(`[Next Port] No port visit history for ${args.mmsi}`);
        return null;
      }

      // Get the most recent port as potential next destination
      // In a real system, you'd use ML or routing data to predict the actual next port
      const recentPorts = journey.portVisits.slice(0, 3);
      const lastPort = recentPorts[0];

      // For demo, use the second most recent port as "next port"
      const nextPort = recentPorts.length > 1 ? recentPorts[1] : lastPort;

      // Calculate ETA to this port
      const vessel = await prisma.vessel.findFirst({
        where: { mmsi: args.mmsi },
      });

      if (!vessel) return null;

      const status = await tracker.getVesselStatus(args.mmsi);
      const currentPosition = status.position || status.lastKnown?.position || status.estimated?.position;

      if (!currentPosition) return null;

      const distance = calculateDistance(
        currentPosition.lat,
        currentPosition.lon,
        nextPort.position.lat,
        nextPort.position.lon
      );

      const speed = status.speed || getAverageSpeedForType(vessel.type);
      const durationHours = distance / speed;
      const estimatedArrival = new Date(Date.now() + durationHours * 60 * 60 * 1000);

      return {
        mmsi: args.mmsi,
        vesselName: vessel.name,
        currentPosition,
        destination: {
          lat: nextPort.position.lat,
          lon: nextPort.position.lon,
          port: nextPort.port,
        },
        estimatedArrival,
        confidence: status.quality * 0.7, // Lower confidence for predicted port
        distanceRemaining: distance,
        estimatedDuration: durationHours,
        averageSpeed: speed,
        qualityImpact: 'Predicted based on recent port pattern',
        method: 'historical_pattern',
      };
    },
  })
);
