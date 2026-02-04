/**
 * Test AIS-Powered Route Engine
 */

import { aisRouteEngine } from '../src/services/routing/ais-route-engine.js';
import { prisma } from '../src/lib/prisma.js';

async function main() {
  console.log('🛰️  Testing AIS-Powered Route Engine\n');

  // Get a vessel with recent position data
  const vessel = await prisma.vessel.findFirst({
    where: {
      positions: {
        some: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }
    },
    include: {
      positions: {
        take: 1,
        orderBy: { timestamp: 'desc' }
      }
    }
  });

  if (!vessel) {
    console.log('❌ No vessels with recent position data found');
    return;
  }

  console.log(`✅ Found vessel: ${vessel.name} (${vessel.imo})`);
  console.log(`   Type: ${vessel.type || 'Unknown'}`);
  console.log(`   Flag: ${vessel.flag || 'Unknown'}\n`);

  // Test 1: Get current route (last 24 hours)
  console.log('📍 Test 1: Get Current Route (last 24 hours)\n');
  const currentRoute = await aisRouteEngine.getCurrentVesselRoute(vessel.id);

  if (currentRoute) {
    console.log(`   Origin: ${currentRoute.origin.lat.toFixed(4)}°, ${currentRoute.origin.lng.toFixed(4)}°`);
    console.log(`   Destination: ${currentRoute.destination.lat.toFixed(4)}°, ${currentRoute.destination.lng.toFixed(4)}°`);
    console.log(`   Distance: ${currentRoute.distance.toFixed(2)} NM`);
    console.log(`   Duration: ${currentRoute.duration.toFixed(2)} hours`);
    console.log(`   Average Speed: ${currentRoute.averageSpeed.toFixed(2)} knots`);
    console.log(`   Status: ${currentRoute.status}`);
    console.log(`   Track points: ${currentRoute.track.length}`);
  } else {
    console.log('   No route data available');
  }

  // Test 2: Recommend route between two ports
  console.log('\n📊 Test 2: Recommend Route (Singapore to Mumbai)\n');

  // Singapore (SGSIN): 1.27°N, 103.85°E
  // Mumbai (INMUN): 18.98°N, 72.83°E
  const recommendation = await aisRouteEngine.recommendRoute(
    1.27, 103.85,  // Singapore
    18.98, 72.83,  // Mumbai
    vessel.type || undefined
  );

  console.log(`   Distance: ${recommendation.distance.toFixed(2)} NM`);
  console.log(`   Estimated Duration: ${recommendation.estimatedDuration.toFixed(2)} hours (${(recommendation.estimatedDuration / 24).toFixed(2)} days)`);
  console.log(`   Average Speed: ${recommendation.averageSpeed.toFixed(2)} knots`);
  console.log(`   Based on ${recommendation.basedOnVessels} vessels`);
  console.log(`   Confidence: ${(recommendation.confidence * 100).toFixed(1)}%`);
  console.log(`   Waypoints: ${recommendation.waypoints.length} points`);

  // Test 3: Detect route deviation
  if (currentRoute && currentRoute.track.length > 2) {
    console.log('\n🎯 Test 3: Detect Route Deviation\n');

    // Use first half of track as "planned route"
    const plannedWaypoints = currentRoute.track
      .slice(0, Math.floor(currentRoute.track.length / 2))
      .map(p => ({ lat: p.lat, lng: p.lng }));

    const deviation = await aisRouteEngine.detectRouteDeviation(
      vessel.id,
      plannedWaypoints,
      50 // 50 NM max deviation
    );

    console.log(`   Is Deviating: ${deviation.isDeviating ? '⚠️  YES' : '✅ NO'}`);
    if (deviation.currentPosition) {
      console.log(`   Current Position: ${deviation.currentPosition.lat.toFixed(4)}°, ${deviation.currentPosition.lng.toFixed(4)}°`);
    }
    if (deviation.nearestWaypoint) {
      console.log(`   Nearest Waypoint: #${deviation.nearestWaypoint.index} at ${deviation.nearestWaypoint.lat.toFixed(4)}°, ${deviation.nearestWaypoint.lng.toFixed(4)}°`);
    }
    if (deviation.deviationDistance !== null) {
      console.log(`   Deviation Distance: ${deviation.deviationDistance.toFixed(2)} NM`);
    }
  }

  // Test 4: Find vessels near a route
  console.log('\n🚢 Test 4: Find Vessels Near Route (Singapore-Mumbai)\n');

  const nearbyVessels = await aisRouteEngine.getVesselsNearRoute(
    recommendation.waypoints.slice(0, 5), // First 5 waypoints
    100 // 100 NM radius
  );

  console.log(`   Found ${nearbyVessels.length} vessels near route:`);
  nearbyVessels.slice(0, 10).forEach((v, i) => {
    console.log(`   ${i + 1}. ${v.name} - ${v.distance.toFixed(2)} NM away`);
  });

  console.log('\n✅ AIS Route Engine tests complete!\n');

  await prisma.$disconnect();
}

main();
