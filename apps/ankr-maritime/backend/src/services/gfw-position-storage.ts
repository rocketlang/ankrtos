/**
 * GFW Position Storage Service
 * Intelligent storage with deduplication and vessel correlation
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

export interface GFWVesselData {
  mmsi: string;
  ssvid?: string; // GFW vessel ID
  imo?: string;
  shipname?: string;
  name?: string;
  flag?: string;
  geartype?: string;
  vesselType?: string;
}

export interface GFWPositionData {
  latitude: number;
  longitude: number;
  timestamp: Date;
  source: string;
  speed?: number | null;
  course?: number | null;
  heading?: number | null;
  gfw_event_id?: string;
  gfw_event_type?: 'port_visit' | 'fishing' | 'encounter' | 'loitering';
  port_id?: string;
  confidence_score?: number;
}

/**
 * Check if a position already exists (deduplication)
 * Tolerance: ±5 minutes, ±0.001° (~100m)
 */
export async function isDuplicatePosition(
  vesselId: string,
  timestamp: Date,
  latitude: number,
  longitude: number
): Promise<boolean> {
  const timeWindow = 5 * 60 * 1000; // 5 minutes in milliseconds
  const spatialTolerance = 0.001; // ~100 meters

  const existing = await prisma.vesselPosition.findFirst({
    where: {
      vesselId,
      timestamp: {
        gte: new Date(timestamp.getTime() - timeWindow),
        lte: new Date(timestamp.getTime() + timeWindow)
      },
      latitude: {
        gte: latitude - spatialTolerance,
        lte: latitude + spatialTolerance
      },
      longitude: {
        gte: longitude - spatialTolerance,
        lte: longitude + spatialTolerance
      }
    },
    select: { id: true }
  });

  return !!existing;
}

/**
 * Map GFW gear type to vessel type
 */
function mapGFWGearTypeToVesselType(geartype?: string): string {
  if (!geartype) return 'Unknown';

  const mapping: Record<string, string> = {
    'trawlers': 'Fishing Vessel',
    'purse_seines': 'Fishing Vessel',
    'longliners': 'Fishing Vessel',
    'drifting_longlines': 'Fishing Vessel',
    'fixed_gear': 'Fishing Vessel',
    'trollers': 'Fishing Vessel',
    'cargo': 'Cargo',
    'tanker': 'Tanker',
    'passenger': 'Passenger',
    'fishing': 'Fishing Vessel',
    'tug': 'Tug',
    'other': 'Other'
  };

  const normalized = geartype.toLowerCase().replace(/\s+/g, '_');
  return mapping[normalized] || 'Unknown';
}

/**
 * Get or create default organization for GFW vessels
 */
async function getGFWOrganizationId(): Promise<string> {
  let org = await prisma.organization.findFirst({
    where: { code: 'GFW_SATELLITE' }
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'Global Fishing Watch (Satellite)',
        code: 'GFW_SATELLITE',
        type: 'system',
        country: 'GLOBAL'
      }
    });
    console.log(`✨ Created GFW organization: ${org.id}`);
  }

  return org.id;
}

/**
 * Find or create vessel from GFW data
 * Matches by: MMSI → IMO → Create New
 */
export async function findOrCreateVessel(gfwVessel: GFWVesselData): Promise<{
  id: string;
  mmsi: string;
  name: string | null;
  isNew: boolean;
}> {
  const mmsi = gfwVessel.mmsi || gfwVessel.ssvid;
  
  if (!mmsi) {
    throw new Error('MMSI or SSVID required to find/create vessel');
  }

  // 1. Try MMSI match (primary)
  let vessel = await prisma.vessel.findFirst({
    where: { mmsi }
  });

  if (vessel) {
    return { ...vessel, isNew: false };
  }

  // 2. Try IMO match (if available)
  if (gfwVessel.imo) {
    vessel = await prisma.vessel.findFirst({
      where: { imo: gfwVessel.imo }
    });

    if (vessel) {
      // Update MMSI if found by IMO
      vessel = await prisma.vessel.update({
        where: { id: vessel.id },
        data: { mmsi }
      });
      console.log(`✓ Updated vessel MMSI: ${vessel.name} (${mmsi})`);
      return { ...vessel, isNew: false };
    }
  }

  // 3. Create new vessel
  const orgId = await getGFWOrganizationId();
  const vesselName = gfwVessel.shipname || gfwVessel.name || `Unknown ${mmsi}`;

  // Generate IMO if not available (GFW vessels without IMO)
  // Use format: GFW{MMSI} to make it unique and identifiable
  const imoNumber = gfwVessel.imo || `GFW${mmsi}`;

  vessel = await prisma.vessel.create({
    data: {
      mmsi,
      imo: imoNumber,
      name: vesselName,
      flag: gfwVessel.flag || 'Unknown',
      type: mapGFWGearTypeToVesselType(gfwVessel.geartype || gfwVessel.vesselType),
      organizationId: orgId  // Use organizationId field directly
      // Note: enrichmentSource field not added to schema yet
    }
  });

  console.log(`✨ Created vessel from GFW: ${vessel.name} (${mmsi})`);
  return { ...vessel, isNew: true };
}

/**
 * Store GFW position if not duplicate
 */
export async function storeGFWPositionIfNew(
  vesselId: string,
  position: GFWPositionData
): Promise<{ stored: boolean; id?: string }> {
  // Check for duplicate
  const isDupe = await isDuplicatePosition(
    vesselId,
    position.timestamp,
    position.latitude,
    position.longitude
  );

  if (isDupe) {
    return { stored: false };
  }

  // Store new position
  const stored = await prisma.vesselPosition.create({
    data: {
      vesselId,
      latitude: position.latitude,
      longitude: position.longitude,
      timestamp: position.timestamp,
      source: position.source,
      speed: position.speed,
      course: position.course,
      heading: position.heading,
      gfw_event_id: position.gfw_event_id,
      gfw_event_type: position.gfw_event_type,
      port_id: position.port_id,
      confidence_score: position.confidence_score || 0.85
    }
  });

  return { stored: true, id: stored.id };
}

/**
 * Batch store positions with deduplication
 */
export async function batchStoreGFWPositions(
  vesselId: string,
  positions: GFWPositionData[]
): Promise<{ stored: number; skipped: number }> {
  let stored = 0;
  let skipped = 0;

  for (const position of positions) {
    const result = await storeGFWPositionIfNew(vesselId, position);
    if (result.stored) {
      stored++;
    } else {
      skipped++;
    }
  }

  return { stored, skipped };
}

/**
 * Get best available position for a vessel at given time
 * Prefers: terrestrial > satellite > port visit
 */
export async function getBestPosition(
  mmsi: string,
  timestamp: Date
): Promise<any | null> {
  const vessel = await prisma.vessel.findFirst({
    where: { mmsi }
  });

  if (!vessel) return null;

  const timeWindow = 5 * 60 * 1000; // 5 minutes

  const position = await prisma.$queryRaw`
    SELECT *
    FROM vessel_positions
    WHERE "vesselId" = ${vessel.id}
      AND timestamp >= ${new Date(timestamp.getTime() - timeWindow)}
      AND timestamp <= ${new Date(timestamp.getTime() + timeWindow)}
    ORDER BY
      CASE source
        WHEN 'ais_terrestrial' THEN 1
        WHEN 'ais_satellite_gfw' THEN 2
        WHEN 'AISstream' THEN 3
        WHEN 'gfw_port_visit' THEN 4
        WHEN 'gfw_fishing' THEN 5
        ELSE 6
      END,
      ABS(EXTRACT(EPOCH FROM (timestamp - ${timestamp})))
    LIMIT 1
  `;

  return position[0] || null;
}

/**
 * Clean disconnect
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}

export { prisma };
