/**
 * GraphQL Schema for Map Visualization & Cargo Matching
 */

import { GraphQLObjectType, GraphQLList, GraphQLString, GraphQLFloat, GraphQLInt, GraphQLBoolean } from 'graphql';
import { prisma } from '../../lib/prisma.js';
import { DateTimeResolver } from 'graphql-scalars';

// ========== TYPES ==========

const VesselMapMarkerType = new GraphQLObjectType({
  name: 'VesselMapMarker',
  fields: () => ({
    vesselId: { type: GraphQLString },
    mmsi: { type: GraphQLString },
    imo: { type: GraphQLString },
    name: { type: GraphQLString },
    type: { type: GraphQLString },
    flag: { type: GraphQLString },
    latitude: { type: GraphQLFloat },
    longitude: { type: GraphQLFloat },
    speed: { type: GraphQLFloat },
    course: { type: GraphQLFloat },
    heading: { type: GraphQLFloat },
    status: { type: GraphQLString },
    lastUpdate: { type: DateTimeResolver },
    dwt: { type: GraphQLFloat },
    isAvailable: { type: GraphQLBoolean },
  }),
});

const CargoEnquiryMapMarkerType = new GraphQLObjectType({
  name: 'CargoEnquiryMapMarker',
  fields: () => ({
    enquiryId: { type: GraphQLString },
    cargoType: { type: GraphQLString },
    quantity: { type: GraphQLFloat },
    loadPortName: { type: GraphQLString },
    loadPortLatitude: { type: GraphQLFloat },
    loadPortLongitude: { type: GraphQLFloat },
    dischargePortName: { type: GraphQLString },
    dischargePortLatitude: { type: GraphQLFloat },
    dischargePortLongitude: { type: GraphQLFloat },
    laycanFrom: { type: DateTimeResolver },
    laycanTo: { type: DateTimeResolver },
    status: { type: GraphQLString },
  }),
});

const CargoMatchType = new GraphQLObjectType({
  name: 'CargoMatch',
  fields: () => ({
    enquiryId: { type: GraphQLString },
    vesselId: { type: GraphQLString },
    vesselName: { type: GraphQLString },
    score: { type: GraphQLFloat },
    distance: { type: GraphQLFloat }, // nautical miles
    eta: { type: GraphQLInt }, // days
    suitability: { type: GraphQLString },
    reason: { type: GraphQLString },
    vessel: { type: VesselMapMarkerType },
    cargo: { type: CargoEnquiryMapMarkerType },
  }),
});

// ========== QUERIES ==========

export const mapQueries = {
  vesselsOnMap: {
    type: new GraphQLList(VesselMapMarkerType),
    args: {
      boundingBox: { type: GraphQLString }, // "lat1,lon1,lat2,lon2"
      vesselTypes: { type: new GraphQLList(GraphQLString) },
      minDWT: { type: GraphQLFloat },
      maxDWT: { type: GraphQLFloat },
      status: { type: new GraphQLList(GraphQLString) },
    },
    resolve: async (_: any, args: any, context: any) => {
      // Parse bounding box
      let bounds;
      if (args.boundingBox) {
        const [lat1, lon1, lat2, lon2] = args.boundingBox.split(',').map(Number);
        bounds = { lat1, lon1, lat2, lon2 };
      }

      // Get latest position for each vessel
      const latestPositions = await prisma.$queryRaw<Array<{
        vesselId: string;
        latitude: number;
        longitude: number;
        speed: number | null;
        course: number | null;
        heading: number | null;
        status: string | null;
        timestamp: Date;
      }>>`
        WITH latest_positions AS (
          SELECT DISTINCT ON (vesselId)
            vesselId,
            latitude,
            longitude,
            speed,
            course,
            heading,
            status,
            timestamp
          FROM vessel_positions
          WHERE timestamp > NOW() - INTERVAL '24 hours'
          ORDER BY vesselId, timestamp DESC
        )
        SELECT * FROM latest_positions
        ${bounds ? prisma.$queryRawUnsafe`
          WHERE latitude BETWEEN ${Math.min(bounds.lat1, bounds.lat2)} AND ${Math.max(bounds.lat1, bounds.lat2)}
            AND longitude BETWEEN ${Math.min(bounds.lon1, bounds.lon2)} AND ${Math.max(bounds.lon1, bounds.lon2)}
        ` : ''}
        LIMIT 1000
      `;

      // Get vessel details
      const vesselIds = latestPositions.map(p => p.vesselId);
      const vessels = await prisma.vessel.findMany({
        where: {
          id: { in: vesselIds },
          ...(args.vesselTypes?.length > 0 && { type: { in: args.vesselTypes } }),
          ...(args.minDWT && { dwt: { gte: args.minDWT } }),
          ...(args.maxDWT && { dwt: { lte: args.maxDWT } }),
        },
      });

      // Merge vessel data with positions
      return vessels.map(vessel => {
        const position = latestPositions.find(p => p.vesselId === vessel.id);
        return {
          vesselId: vessel.id,
          mmsi: vessel.mmsi,
          imo: vessel.imo,
          name: vessel.name,
          type: vessel.type,
          flag: vessel.flag,
          latitude: position?.latitude,
          longitude: position?.longitude,
          speed: position?.speed,
          course: position?.course,
          heading: position?.heading,
          status: position?.status,
          lastUpdate: position?.timestamp,
          dwt: vessel.dwt,
          isAvailable: vessel.status === 'active', // Check availability logic
        };
      });
    },
  },

  cargoEnquiriesOnMap: {
    type: new GraphQLList(CargoEnquiryMapMarkerType),
    args: {
      status: { type: new GraphQLList(GraphQLString) },
    },
    resolve: async (_: any, args: any, context: any) => {
      const enquiries = await prisma.$queryRaw<Array<{
        id: string;
        cargoType: string;
        quantity: number;
        loadPortId: string;
        dischargePortId: string;
        laycanFrom: Date;
        laycanTo: Date;
        status: string;
      }>>`
        SELECT
          ce.id,
          ce."cargoType",
          ce.quantity,
          ce."loadPortId",
          ce."dischargePortId",
          ce."laycanFrom",
          ce."laycanTo",
          ce.status
        FROM cargo_enquiries ce
        WHERE ce."loadPortId" IS NOT NULL
          AND ce."dischargePortId" IS NOT NULL
          ${args.status?.length > 0 ? prisma.$queryRawUnsafe`AND ce.status = ANY(ARRAY[${args.status}]::text[])` : ''}
        LIMIT 100
      `;

      // Get port coordinates
      const portIds = [
        ...new Set(enquiries.flatMap(e => [e.loadPortId, e.dischargePortId])),
      ];
      const ports = await prisma.port.findMany({
        where: { id: { in: portIds } },
        select: { id: true, name: true, latitude: true, longitude: true },
      });

      const portMap = new Map(ports.map(p => [p.id, p]));

      return enquiries.map(enquiry => {
        const loadPort = portMap.get(enquiry.loadPortId);
        const dischargePort = portMap.get(enquiry.dischargePortId);

        return {
          enquiryId: enquiry.id,
          cargoType: enquiry.cargoType,
          quantity: enquiry.quantity,
          loadPortName: loadPort?.name,
          loadPortLatitude: loadPort?.latitude,
          loadPortLongitude: loadPort?.longitude,
          dischargePortName: dischargePort?.name,
          dischargePortLatitude: dischargePort?.latitude,
          dischargePortLongitude: dischargePort?.longitude,
          laycanFrom: enquiry.laycanFrom,
          laycanTo: enquiry.laycanTo,
          status: enquiry.status,
        };
      });
    },
  },

  matchCargo: {
    type: new GraphQLList(CargoMatchType),
    args: {
      enquiryId: { type: GraphQLString },
      maxDistance: { type: GraphQLFloat }, // nautical miles
      limit: { type: GraphQLInt },
    },
    resolve: async (_: any, args: any, context: any) => {
      const { enquiryId, maxDistance = 1000, limit = 10 } = args;

      // Get cargo enquiry
      const enquiry = await prisma.$queryRawUnsafe<Array<any>>(`
        SELECT
          ce.id,
          ce."cargoType",
          ce.quantity,
          ce."loadPortId",
          ce."laycanFrom",
          ce."laycanTo",
          lp.latitude as load_lat,
          lp.longitude as load_lon,
          lp.name as load_port_name,
          dp.latitude as discharge_lat,
          dp.longitude as discharge_lon,
          dp.name as discharge_port_name
        FROM cargo_enquiries ce
        LEFT JOIN ports lp ON ce."loadPortId" = lp.id
        LEFT JOIN ports dp ON ce."dischargePortId" = dp.id
        WHERE ce.id = $1
      `, enquiryId);

      if (enquiry.length === 0) {
        return [];
      }

      const cargo = enquiry[0];

      // Get vessels with recent positions
      const vessels = await prisma.$queryRaw<Array<any>>`
        WITH latest_positions AS (
          SELECT DISTINCT ON (vesselId)
            vesselId,
            latitude,
            longitude,
            speed,
            course,
            heading,
            status,
            timestamp
          FROM vessel_positions
          WHERE timestamp > NOW() - INTERVAL '24 hours'
          ORDER BY vesselId, timestamp DESC
        )
        SELECT
          v.id as vessel_id,
          v.name as vessel_name,
          v.type as vessel_type,
          v.dwt,
          v.flag,
          lp.latitude,
          lp.longitude,
          lp.speed,
          lp.status,
          lp.timestamp
        FROM vessels v
        INNER JOIN latest_positions lp ON v.id = lp.vesselId
        WHERE v.status = 'active'
          AND v.type IN ('bulk_carrier', 'general_cargo', 'container', 'tanker')
        LIMIT 500
      `;

      // Calculate distances and match scores
      const matches = vessels.map(vessel => {
        const distance = calculateDistance(
          vessel.latitude,
          vessel.longitude,
          cargo.load_lat,
          cargo.load_lon
        );

        const score = calculateMatchScore(vessel, cargo, distance);
        const eta = Math.ceil(distance / (vessel.speed || 12) / 24); // days

        let suitability = 'excellent';
        let reason = '';

        if (distance > maxDistance) {
          suitability = 'too_far';
          reason = `${Math.round(distance)} nm away`;
        } else if (!vessel.dwt || vessel.dwt < cargo.quantity * 0.8) {
          suitability = 'too_small';
          reason = `DWT ${vessel.dwt} < cargo ${cargo.quantity}`;
        } else if (vessel.dwt > cargo.quantity * 2) {
          suitability = 'too_large';
          reason = 'Vessel oversized for cargo';
        }

        return {
          enquiryId: cargo.id,
          vesselId: vessel.vessel_id,
          vesselName: vessel.vessel_name,
          score,
          distance: Math.round(distance),
          eta,
          suitability,
          reason,
          vessel: {
            vesselId: vessel.vessel_id,
            name: vessel.vessel_name,
            type: vessel.vessel_type,
            flag: vessel.flag,
            latitude: vessel.latitude,
            longitude: vessel.longitude,
            speed: vessel.speed,
            status: vessel.status,
            lastUpdate: vessel.timestamp,
            dwt: vessel.dwt,
          },
          cargo: {
            enquiryId: cargo.id,
            cargoType: cargo.cargoType,
            quantity: cargo.quantity,
            loadPortName: cargo.load_port_name,
            loadPortLatitude: cargo.load_lat,
            loadPortLongitude: cargo.load_lon,
            dischargePortName: cargo.discharge_port_name,
            dischargePortLatitude: cargo.discharge_lat,
            dischargePortLongitude: cargo.discharge_lon,
            laycanFrom: cargo.laycanFrom,
            laycanTo: cargo.laycanTo,
          },
        };
      });

      // Sort by score and return top matches
      return matches
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    },
  },
};

// ========== HELPER FUNCTIONS ==========

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Haversine formula for distance in nautical miles
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function calculateMatchScore(vessel: any, cargo: any, distance: number): number {
  let score = 100;

  // Distance penalty (closer is better)
  if (distance > 2000) score -= 50;
  else if (distance > 1000) score -= 30;
  else if (distance > 500) score -= 15;
  else if (distance > 200) score -= 5;

  // Size matching
  const sizeRatio = vessel.dwt / cargo.quantity;
  if (sizeRatio < 0.8) score -= 40; // Too small
  else if (sizeRatio > 2.0) score -= 20; // Too large
  else if (sizeRatio >= 0.9 && sizeRatio <= 1.2) score += 10; // Perfect match

  // Speed bonus (faster vessels get slight bonus)
  if (vessel.speed > 15) score += 5;

  // Status bonus (underway vs anchored)
  if (vessel.status === 'at_anchor') score += 10; // Anchored = available

  return Math.max(0, Math.min(100, score));
}
