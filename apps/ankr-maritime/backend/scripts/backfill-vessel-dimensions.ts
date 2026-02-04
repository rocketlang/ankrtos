/**
 * Backfill Vessel Dimensions from Position Records
 *
 * Extracts LOA, Beam, and Draft from existing VesselPosition records
 * and updates the Vessel table with this data.
 */

import { prisma } from '../src/lib/prisma.js';

async function backfillVesselDimensions() {
  console.log('🔄 Starting vessel dimensions backfill...\n');
  console.log('='.repeat(70));

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  try {
    // Find all vessels that have position records with dimension data
    const vesselsWithDimensions = await prisma.vesselPosition.findMany({
      where: {
        OR: [
          { dimensionToBow: { not: null } },
          { dimensionToPort: { not: null } },
          { draught: { not: null } }
        ]
      },
      select: {
        vesselId: true,
        dimensionToBow: true,
        dimensionToStern: true,
        dimensionToPort: true,
        dimensionToStarboard: true,
        draught: true,
      },
      // Get most recent position with dimensions for each vessel
      orderBy: {
        timestamp: 'desc'
      }
    });

    console.log(`\n📦 Found ${vesselsWithDimensions.length.toLocaleString()} position records with dimension data`);

    // Group by vesselId and take the first (most recent) record
    const vesselDimensionMap = new Map<string, {
      loa?: number;
      beam?: number;
      draft?: number;
    }>();

    for (const position of vesselsWithDimensions) {
      if (vesselDimensionMap.has(position.vesselId)) {
        continue; // Already have most recent data for this vessel
      }

      let loa: number | undefined;
      let beam: number | undefined;
      let draft: number | undefined;

      // Calculate LOA from bow + stern
      if (position.dimensionToBow !== null && position.dimensionToStern !== null) {
        loa = position.dimensionToBow + position.dimensionToStern;
      }

      // Calculate Beam from port + starboard
      if (position.dimensionToPort !== null && position.dimensionToStarboard !== null) {
        beam = position.dimensionToPort + position.dimensionToStarboard;
      }

      // Draft (already in meters)
      if (position.draught !== null) {
        draft = position.draught;
      }

      // Only add if we have at least one dimension
      if (loa !== undefined || beam !== undefined || draft !== undefined) {
        vesselDimensionMap.set(position.vesselId, { loa, beam, draft });
      }
    }

    console.log(`\n🎯 Processing ${vesselDimensionMap.size.toLocaleString()} unique vessels...\n`);

    // Update vessels in batches
    let processed = 0;
    for (const [vesselId, dimensions] of vesselDimensionMap.entries()) {
      try {
        // Check if vessel already has dimensions (don't overwrite newer data)
        const vessel = await prisma.vessel.findUnique({
          where: { id: vesselId },
          select: { loa: true, beam: true, draft: true, name: true }
        });

        if (!vessel) {
          skippedCount++;
          continue;
        }

        // Build update object only for missing fields
        const updateData: any = {};
        if (dimensions.loa !== undefined && vessel.loa === null) {
          updateData.loa = dimensions.loa;
        }
        if (dimensions.beam !== undefined && vessel.beam === null) {
          updateData.beam = dimensions.beam;
        }
        if (dimensions.draft !== undefined && vessel.draft === null) {
          updateData.draft = dimensions.draft;
        }

        // Skip if no fields to update
        if (Object.keys(updateData).length === 0) {
          skippedCount++;
          continue;
        }

        // Update vessel
        await prisma.vessel.update({
          where: { id: vesselId },
          data: updateData
        });

        updatedCount++;
        processed++;

        // Log progress every 100 vessels
        if (processed % 100 === 0) {
          const dims = [];
          if (updateData.loa) dims.push(`LOA=${updateData.loa.toFixed(1)}m`);
          if (updateData.beam) dims.push(`Beam=${updateData.beam.toFixed(1)}m`);
          if (updateData.draft) dims.push(`Draft=${updateData.draft.toFixed(1)}m`);
          console.log(`✅ [${processed}/${vesselDimensionMap.size}] ${vessel.name}: ${dims.join(', ')}`);
        }
      } catch (error: any) {
        errorCount++;
        if (errorCount < 10) {
          console.error(`❌ Error updating vessel ${vesselId}: ${error.message}`);
        }
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n📊 BACKFILL COMPLETE\n');
    console.log(`✅ Updated: ${updatedCount.toLocaleString()} vessels`);
    console.log(`⏭️  Skipped: ${skippedCount.toLocaleString()} vessels (already had data)`);
    console.log(`❌ Errors: ${errorCount.toLocaleString()} vessels`);
    console.log('');

    // Verify results
    const vesselsWithLOA = await prisma.vessel.count({ where: { loa: { not: null } } });
    const vesselsWithBeam = await prisma.vessel.count({ where: { beam: { not: null } } });
    const vesselsWithDraft = await prisma.vessel.count({ where: { draft: { not: null } } });

    console.log('📈 FINAL STATS:');
    console.log(`   Vessels with LOA: ${vesselsWithLOA.toLocaleString()}`);
    console.log(`   Vessels with Beam: ${vesselsWithBeam.toLocaleString()}`);
    console.log(`   Vessels with Draft: ${vesselsWithDraft.toLocaleString()}\n`);

  } catch (error: any) {
    console.error('\n❌ Backfill failed:', error.message);
    throw error;
  }
}

// Run backfill
backfillVesselDimensions()
  .finally(() => prisma.$disconnect());
