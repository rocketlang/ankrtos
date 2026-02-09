#!/usr/bin/env tsx
/**
 * GFW Position Sync - Nightly Job
 * 
 * Runs at 3 AM (after AIS stats at 2 AM)
 * Syncs port visits, fishing events, and other GFW data
 */

import { GlobalFishingWatchClient } from '../services/global-fishing-watch-ais-fixed.js';
import {
  findOrCreateVessel,
  storeGFWPositionIfNew,
  disconnectPrisma,
  type GFWVesselData,
  type GFWPositionData
} from '../services/gfw-position-storage.js';

interface SyncStats {
  portVisits: number;
  fishingEvents: number;
  loiteringEvents: number;
  newVessels: number;
  positionsAdded: number;
  duplicatesSkipped: number;
  errors: number;
}

async function syncGFWPositions(hoursBack: number = 24): Promise<SyncStats> {
  console.log('🌊 Starting GFW position sync...');
  console.log(`📅 Syncing last ${hoursBack} hours of data`);
  const startTime = Date.now();

  const gfwClient = new GlobalFishingWatchClient();
  const stats: SyncStats = {
    portVisits: 0,
    fishingEvents: 0,
    loiteringEvents: 0,
    newVessels: 0,
    positionsAdded: 0,
    duplicatesSkipped: 0,
    errors: 0
  };

  try {
    const startDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const endDate = new Date();

    // 1. Sync Port Visits
    console.log('\n📍 Step 1/3: Syncing port visits...');
    try {
      const portVisits = await gfwClient.getPortVisits({
        startDate,
        endDate,
        limit: 1000
      });

      console.log(`   Found ${portVisits.length} port visits from GFW`);

      for (const visit of portVisits) {
        try {
          // Find or create vessel
          const vessel = await findOrCreateVessel({
            mmsi: visit.vessel.ssvid,
            ssvid: visit.vessel.ssvid,
            shipname: visit.vessel.name,
            flag: visit.vessel.flag
          });

          if (vessel.isNew) stats.newVessels++;

          // Store arrival position
          const arrivalResult = await storeGFWPositionIfNew(vessel.id, {
            latitude: visit.position.lat,
            longitude: visit.position.lon,
            timestamp: new Date(visit.start),
            source: 'gfw_port_visit',
            gfw_event_id: visit.id,
            gfw_event_type: 'port_visit',
            port_id: visit.port?.id,
            confidence_score: 0.9
          });

          if (arrivalResult.stored) stats.positionsAdded++;
          else stats.duplicatesSkipped++;

          // Store departure position
          const departureResult = await storeGFWPositionIfNew(vessel.id, {
            latitude: visit.position.lat,
            longitude: visit.position.lon,
            timestamp: new Date(visit.end),
            source: 'gfw_port_visit',
            gfw_event_id: visit.id,
            gfw_event_type: 'port_visit',
            port_id: visit.port?.id,
            confidence_score: 0.9
          });

          if (departureResult.stored) stats.positionsAdded++;
          else stats.duplicatesSkipped++;

          stats.portVisits++;
        } catch (error) {
          console.error(`   ❌ Error processing port visit:`, error);
          stats.errors++;
        }
      }

      console.log(`   ✓ Processed ${stats.portVisits} port visits`);
    } catch (error) {
      console.error('   ❌ Failed to fetch port visits:', error);
      stats.errors++;
    }

    // 2. Sync Fishing Events
    console.log('\n🎣 Step 2/3: Syncing fishing events...');
    try {
      const fishingEvents = await gfwClient.getFishingEvents({
        startDate,
        endDate,
        limit: 500
      });

      console.log(`   Found ${fishingEvents.length} fishing events from GFW`);

      for (const event of fishingEvents) {
        try {
          // Find or create vessel
          const vessel = await findOrCreateVessel({
            mmsi: event.vessel.ssvid,
            ssvid: event.vessel.ssvid,
            shipname: event.vessel.name,
            flag: event.vessel.flag
          });

          if (vessel.isNew) stats.newVessels++;

          // Store fishing event position
          const result = await storeGFWPositionIfNew(vessel.id, {
            latitude: event.position.lat,
            longitude: event.position.lon,
            timestamp: new Date(event.start),
            source: 'gfw_fishing',
            gfw_event_id: event.id,
            gfw_event_type: 'fishing',
            confidence_score: 0.85
          });

          if (result.stored) stats.positionsAdded++;
          else stats.duplicatesSkipped++;

          stats.fishingEvents++;
        } catch (error) {
          console.error(`   ❌ Error processing fishing event:`, error);
          stats.errors++;
        }
      }

      console.log(`   ✓ Processed ${stats.fishingEvents} fishing events`);
    } catch (error) {
      console.error('   ❌ Failed to fetch fishing events:', error);
      stats.errors++;
    }

    // 3. Sync Loitering Events
    console.log('\n🔄 Step 3/3: Syncing loitering events...');
    try {
      const loiteringEvents = await gfwClient.getLoiteringEvents({
        startDate,
        endDate,
        limit: 500
      });

      console.log(`   Found ${loiteringEvents.length} loitering events from GFW`);

      for (const event of loiteringEvents) {
        try {
          // Find or create vessel
          const vessel = await findOrCreateVessel({
            mmsi: event.vessel.ssvid,
            ssvid: event.vessel.ssvid,
            shipname: event.vessel.name,
            flag: event.vessel.flag
          });

          if (vessel.isNew) stats.newVessels++;

          // Store loitering event position
          const result = await storeGFWPositionIfNew(vessel.id, {
            latitude: event.position.lat,
            longitude: event.position.lon,
            timestamp: new Date(event.start),
            source: 'gfw_loitering',
            gfw_event_id: event.id,
            gfw_event_type: 'loitering',
            confidence_score: 0.8
          });

          if (result.stored) stats.positionsAdded++;
          else stats.duplicatesSkipped++;

          stats.loiteringEvents++;
        } catch (error) {
          console.error(`   ❌ Error processing loitering event:`, error);
          stats.errors++;
        }
      }

      console.log(`   ✓ Processed ${stats.loiteringEvents} loitering events`);
    } catch (error) {
      console.error('   ❌ Failed to fetch loitering events:', error);
      stats.errors++;
    }

    // Summary
    const duration = Date.now() - startTime;
    console.log('\n' + '='.repeat(60));
    console.log('✅ GFW sync complete!');
    console.log('='.repeat(60));
    console.log(`📊 Statistics:`);
    console.log(`   Port visits processed:    ${stats.portVisits}`);
    console.log(`   Fishing events processed: ${stats.fishingEvents}`);
    console.log(`   Loitering events:         ${stats.loiteringEvents}`);
    console.log(`   New vessels created:      ${stats.newVessels}`);
    console.log(`   Positions added:          ${stats.positionsAdded}`);
    console.log(`   Duplicates skipped:       ${stats.duplicatesSkipped}`);
    console.log(`   Errors:                   ${stats.errors}`);
    console.log(`   Duration:                 ${(duration / 1000).toFixed(1)}s`);
    console.log('='.repeat(60));

    return stats;
  } catch (error) {
    console.error('\n❌ GFW sync failed:', error);
    throw error;
  } finally {
    await disconnectPrisma();
    console.log('🔌 Database connection closed');
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const hoursBack = parseInt(process.argv[2]) || 24;
  
  syncGFWPositions(hoursBack)
    .then((stats) => {
      console.log('\n✅ Script completed successfully');
      process.exit(stats.errors > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

export { syncGFWPositions };
