# Mari8X Feature Activation Plan
**Date:** February 3, 2026
**Scope:** Activate 4 existing services with 11.6M live AIS data

---

## 🎯 OVERVIEW

You have **production-ready code** that's NOT running. Let's activate:

1. ✅ Route Engine (already coded, needs integration)
2. ✅ Automated Port Congestion (service exists, needs AIS pattern detection)
3. ✅ AIS Routing Visualization (components exist, needs assembly)
4. ✅ Deviation Alerts (detector coded, needs background job)

**Current Assets:**
- 11,613,893 AIS positions
- 17,229 vessels tracked
- 86.42% Priority 1 field coverage
- Real-time updates (last position: 2 min ago)

---

## 📋 TASK 1: ACTIVATE ROUTE ENGINE

### Current State
**File:** `/backend/src/services/routing/mari8x-route-engine.ts` (388 lines)
**Status:** ✅ Coded but NOT integrated into GraphQL API

### What It Does
- Historical route analysis (uses 11.6M positions)
- Route recommendations (learns from real vessel behavior)
- Deviation detection (50 NM threshold)
- Traffic density analysis (finds vessels near route)
- Current route monitoring (last 24h positions)

### Integration Steps

#### Step 1.1: Create GraphQL Schema (30 min)
**File:** `/backend/src/schema/types/mari8x-routing.ts` (NEW)

```typescript
import { builder } from '../builder.js';
import { Mari8XRouteEngine } from '../../services/routing/mari8x-route-engine.js';

const engine = new Mari8XRouteEngine();

// ========== INPUT TYPES ==========

const RouteRequestInput = builder.inputType('RouteRequestInput', {
  fields: (t) => ({
    fromUnlocode: t.string({ required: true }),
    toUnlocode: t.string({ required: true }),
    vesselType: t.string({ required: false }), // tanker, bulk, container
    speedKnots: t.float({ required: false }),
    departureDate: t.string({ required: false }),
  }),
});

// ========== OUTPUT TYPES ==========

const RouteWaypoint = builder.objectType('RouteWaypoint', {
  fields: (t) => ({
    latitude: t.float(),
    longitude: t.float(),
    segmentDistanceNm: t.float({ nullable: true }),
    cumulativeDistanceNm: t.float({ nullable: true }),
  }),
});

const RouteRecommendation = builder.objectType('RouteRecommendation', {
  fields: (t) => ({
    totalDistanceNm: t.float(),
    estimatedDays: t.float(),
    averageSpeedKnots: t.float(),
    waypoints: t.field({ type: [RouteWaypoint] }),
    confidence: t.float(), // 0-100%
    basedOnVesselCount: t.int(),
    seasonalFactor: t.string({ nullable: true }),
  }),
});

const DeviationInfo = builder.objectType('DeviationInfo', {
  fields: (t) => ({
    isDeviated: t.boolean(),
    deviationDistanceNm: t.float({ nullable: true }),
    deviationPercentage: t.float({ nullable: true }),
    severity: t.string({ nullable: true }), // low, medium, high, critical
  }),
});

const TrafficDensity = builder.objectType('TrafficDensity', {
  fields: (t) => ({
    vesselsNearRoute: t.int(),
    congestionLevel: t.string(), // low, moderate, high
    hotspots: t.field({
      type: [RouteWaypoint],
      nullable: true,
    }),
  }),
});

// ========== QUERIES ==========

builder.queryFields((t) => ({
  // Get recommended route based on historical AIS data
  recommendRoute: t.field({
    type: RouteRecommendation,
    args: {
      input: t.arg({ type: RouteRequestInput, required: true }),
    },
    resolve: async (_, { input }, ctx) => {
      const result = await engine.recommendRoute({
        fromUnlocode: input.fromUnlocode,
        toUnlocode: input.toUnlocode,
        vesselType: input.vesselType,
      });

      return {
        totalDistanceNm: result.distance,
        estimatedDays: result.duration / 24,
        averageSpeedKnots: result.averageSpeed,
        waypoints: result.waypoints.map((wp, i) => ({
          latitude: wp.lat,
          longitude: wp.lon,
          segmentDistanceNm: i > 0 ? wp.distance : null,
          cumulativeDistanceNm: wp.cumulativeDistance,
        })),
        confidence: result.confidence,
        basedOnVesselCount: result.sampleSize,
        seasonalFactor: result.seasonalFactor,
      };
    },
  }),

  // Check if vessel is deviating from planned route
  checkRouteDeviation: t.field({
    type: DeviationInfo,
    args: {
      vesselId: t.arg.string({ required: true }),
      voyageId: t.arg.string({ required: true }),
    },
    resolve: async (_, { vesselId, voyageId }, ctx) => {
      const deviation = await engine.detectRouteDeviation(voyageId);

      return {
        isDeviated: deviation.isDeviated,
        deviationDistanceNm: deviation.distanceFromRoute,
        deviationPercentage: deviation.percentage,
        severity: deviation.severity,
      };
    },
  }),

  // Get traffic density along a route
  routeTrafficDensity: t.field({
    type: TrafficDensity,
    args: {
      input: t.arg({ type: RouteRequestInput, required: true }),
      radiusNm: t.arg.float({ required: false, defaultValue: 50 }),
    },
    resolve: async (_, { input, radiusNm }, ctx) => {
      // First get recommended route
      const route = await engine.recommendRoute({
        fromUnlocode: input.fromUnlocode,
        toUnlocode: input.toUnlocode,
      });

      // Then find vessels near the route
      const nearbyVessels = await engine.getVesselsNearRoute(
        route.waypoints,
        radiusNm
      );

      return {
        vesselsNearRoute: nearbyVessels.length,
        congestionLevel:
          nearbyVessels.length < 10
            ? 'low'
            : nearbyVessels.length < 50
            ? 'moderate'
            : 'high',
        hotspots: [], // TODO: Cluster vessels into hotspots
      };
    },
  }),

  // Get current route for a vessel (last 24h)
  vesselCurrentRoute: t.field({
    type: RouteRecommendation,
    args: {
      vesselId: t.arg.string({ required: true }),
      hours: t.arg.int({ required: false, defaultValue: 24 }),
    },
    resolve: async (_, { vesselId, hours }, ctx) => {
      const route = await engine.getCurrentVesselRoute(vesselId, hours);

      return {
        totalDistanceNm: route.distance,
        estimatedDays: route.duration / 24,
        averageSpeedKnots: route.averageSpeed,
        waypoints: route.track.map((pos, i) => ({
          latitude: pos.latitude,
          longitude: pos.longitude,
          segmentDistanceNm: i > 0 ? pos.segmentDistance : null,
          cumulativeDistanceNm: pos.cumulativeDistance,
        })),
        confidence: 100, // Actual track, not prediction
        basedOnVesselCount: 1,
        seasonalFactor: null,
      };
    },
  }),
}));
```

#### Step 1.2: Register in Schema Index (5 min)
**File:** `/backend/src/schema/types/index.ts`

```typescript
// Add to imports
import './mari8x-routing.js';
```

#### Step 1.3: Test Queries (15 min)

```graphql
# Test 1: Get recommended route Mumbai → Singapore
query {
  recommendRoute(input: {
    fromUnlocode: "INMUN"
    toUnlocode: "SGSIN"
    vesselType: "container"
  }) {
    totalDistanceNm
    estimatedDays
    averageSpeedKnots
    confidence
    basedOnVesselCount
    waypoints {
      latitude
      longitude
      cumulativeDistanceNm
    }
  }
}

# Test 2: Check deviation for active voyage
query {
  checkRouteDeviation(
    vesselId: "clm0..."
    voyageId: "clm1..."
  ) {
    isDeviated
    deviationDistanceNm
    severity
  }
}

# Test 3: Traffic density Mumbai → Singapore
query {
  routeTrafficDensity(input: {
    fromUnlocode: "INMUN"
    toUnlocode: "SGSIN"
  }, radiusNm: 100) {
    vesselsNearRoute
    congestionLevel
  }
}
```

#### Step 1.4: Add to Frontend (30 min)
**File:** `/frontend/src/pages/RouteCalculator.tsx` (ENHANCE EXISTING)

```typescript
// Add new query for ML-powered route
const RECOMMEND_ROUTE = gql`
  query RecommendRoute($input: RouteRequestInput!) {
    recommendRoute(input: $input) {
      totalDistanceNm
      estimatedDays
      averageSpeedKnots
      confidence
      basedOnVesselCount
      waypoints {
        latitude
        longitude
        cumulativeDistanceNm
      }
    }
  }
`;

// Add toggle to switch between great-circle and ML route
const [routeMode, setRouteMode] = useState<'simple' | 'ml'>('simple');

// Show comparison
{routeMode === 'ml' && (
  <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
    <h3 className="font-semibold text-blue-900">
      🧠 ML-Powered Route (Based on {data.recommendRoute.basedOnVesselCount} real vessels)
    </h3>
    <p className="text-sm text-blue-700 mt-1">
      Confidence: {data.recommendRoute.confidence.toFixed(1)}%
    </p>
  </div>
)}
```

**Estimated Time:** 1.5 hours
**Status After:** ✅ Route engine accessible via GraphQL & UI

---

## 📋 TASK 2: AUTOMATED PORT CONGESTION MONITORING

### Current State
**Service:** `/backend/src/services/voyage/port-congestion-alerter.ts` (exists)
**Problem:** Only 6 manual congestion records, need automation

### Strategy: AIS Pattern Detection

**Key Insight:** Vessels moving <3 knots within 10 NM of port = waiting at anchor

### Implementation Steps

#### Step 2.1: Create AIS Congestion Detector (60 min)
**File:** `/backend/src/services/port/ais-congestion-detector.ts` (NEW)

```typescript
import { prisma } from '../../lib/prisma.js';
import { haversineDistance } from '../../lib/geo-utils.js';

interface CongestionSnapshot {
  portId: string;
  vesselsWaiting: number;
  vesselsAtBerth: number;
  avgWaitHours: number | null;
  berthUtilization: number | null;
  source: string;
  timestamp: Date;
}

export class AISCongestionDetector {
  /**
   * Detect port congestion from AIS data
   * Method: Count vessels <3 knots within 10 NM of port
   */
  async detectPortCongestion(portUnlocode: string): Promise<CongestionSnapshot> {
    // Get port coordinates
    const port = await prisma.port.findUnique({
      where: { unlocode: portUnlocode },
      select: { id: true, lat: true, lng: true, name: true },
    });

    if (!port || !port.lat || !port.lng) {
      throw new Error(`Port ${portUnlocode} not found or missing coordinates`);
    }

    // Get all recent vessel positions (last 2 hours)
    const recentPositions = await prisma.vesselPosition.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      },
      include: {
        vessel: {
          select: { id: true, name: true, imo: true, type: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Find vessels near this port
    const vesselsNearPort = recentPositions
      .filter((pos) => {
        const distance = haversineDistance(
          port.lat!,
          port.lng!,
          pos.latitude,
          pos.longitude
        );
        return distance <= 10; // Within 10 NM
      })
      // De-duplicate (take latest position per vessel)
      .reduce((acc, pos) => {
        if (!acc.find((p) => p.vesselId === pos.vesselId)) {
          acc.push(pos);
        }
        return acc;
      }, [] as typeof recentPositions);

    // Classify: Waiting vs At Berth
    const waiting = vesselsNearPort.filter((pos) => {
      const speed = pos.speed || 0;
      const navStatus = pos.navigationStatus;

      // Waiting criteria:
      // - Speed < 3 knots AND (nav status = 1 (at anchor) OR 5-10 NM from port)
      if (speed < 3) {
        if (navStatus === 1) return true; // At anchor
        const distance = haversineDistance(
          port.lat!,
          port.lng!,
          pos.latitude,
          pos.longitude
        );
        return distance > 2 && distance <= 10; // Anchorage zone
      }
      return false;
    });

    const atBerth = vesselsNearPort.filter((pos) => {
      const speed = pos.speed || 0;
      const navStatus = pos.navigationStatus;
      const distance = haversineDistance(
        port.lat!,
        port.lng!,
        pos.latitude,
        pos.longitude
      );

      // At berth criteria:
      // - Speed < 1 knot AND within 2 NM AND (nav status = 5 (moored) OR very close)
      return (
        speed < 1 &&
        distance <= 2 &&
        (navStatus === 5 || navStatus === 0 || distance < 0.5)
      );
    });

    // Estimate average wait time
    // Look for vessels that were waiting in previous snapshots
    const avgWaitHours = await this.estimateAverageWaitTime(
      port.id,
      waiting.map((v) => v.vesselId)
    );

    // Estimate berth utilization (assuming port has X berths)
    // TODO: Get actual berth count from port data
    const estimatedBerthCount = this.estimateBerthCount(port.name, atBerth.length);
    const berthUtilization = (atBerth.length / estimatedBerthCount) * 100;

    return {
      portId: port.id,
      vesselsWaiting: waiting.length,
      vesselsAtBerth: atBerth.length,
      avgWaitHours,
      berthUtilization: Math.min(berthUtilization, 100), // Cap at 100%
      source: 'ais_derived',
      timestamp: new Date(),
    };
  }

  /**
   * Estimate average wait time by checking how long vessels have been at anchor
   */
  private async estimateAverageWaitTime(
    portId: string,
    vesselIds: string[]
  ): Promise<number | null> {
    if (vesselIds.length === 0) return null;

    const waitTimes: number[] = [];

    for (const vesselId of vesselIds) {
      // Get vessel's position history for last 7 days
      const history = await prisma.vesselPosition.findMany({
        where: {
          vesselId,
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { timestamp: 'asc' },
      });

      // Find when vessel first arrived near port (speed dropped <3 knots)
      const arrivalTime = history.find(
        (pos) => (pos.speed || 0) < 3 && pos.navigationStatus === 1
      )?.timestamp;

      if (arrivalTime) {
        const hoursWaiting =
          (Date.now() - arrivalTime.getTime()) / (1000 * 60 * 60);
        waitTimes.push(hoursWaiting);
      }
    }

    if (waitTimes.length === 0) return null;

    return waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;
  }

  /**
   * Estimate berth count based on port size
   */
  private estimateBerthCount(portName: string, currentOccupancy: number): number {
    // Major ports
    const majorPorts = [
      'Singapore',
      'Shanghai',
      'Rotterdam',
      'Antwerp',
      'Hamburg',
      'Dubai',
      'Mumbai',
      'Chennai',
    ];

    if (majorPorts.some((p) => portName.includes(p))) {
      return Math.max(20, currentOccupancy); // At least 20 berths
    }

    // Medium ports
    return Math.max(10, currentOccupancy);
  }

  /**
   * Save congestion snapshot to database
   */
  async saveCongestionSnapshot(snapshot: CongestionSnapshot): Promise<void> {
    await prisma.portCongestion.create({
      data: {
        portId: snapshot.portId,
        vesselsWaiting: snapshot.vesselsWaiting,
        vesselsAtBerth: snapshot.vesselsAtBerth,
        avgWaitHours: snapshot.avgWaitHours,
        berthUtilization: snapshot.berthUtilization,
        source: snapshot.source,
        timestamp: snapshot.timestamp,
        cargoType: null, // TODO: Infer from vessel types
        notes: `Auto-detected from ${
          snapshot.vesselsWaiting + snapshot.vesselsAtBerth
        } vessels near port`,
      },
    });
  }

  /**
   * Run congestion detection for all major ports
   */
  async detectAllPorts(): Promise<void> {
    // Get top 100 ports by traffic
    const majorPorts = await prisma.port.findMany({
      where: {
        lat: { not: null },
        lng: { not: null },
      },
      take: 100,
      orderBy: { name: 'asc' }, // TODO: Order by actual traffic volume
    });

    console.log(`🔍 Detecting congestion for ${majorPorts.length} ports...`);

    let detected = 0;
    for (const port of majorPorts) {
      try {
        const snapshot = await this.detectPortCongestion(port.unlocode);

        // Only save if there's actual congestion (>2 vessels waiting)
        if (snapshot.vesselsWaiting > 2 || snapshot.vesselsAtBerth > 0) {
          await this.saveCongestionSnapshot(snapshot);
          detected++;
          console.log(
            `✅ ${port.name}: ${snapshot.vesselsWaiting} waiting, ${snapshot.vesselsAtBerth} at berth`
          );
        }
      } catch (error) {
        console.error(`❌ Error detecting congestion for ${port.name}:`, error);
      }
    }

    console.log(`\n🎉 Detected congestion at ${detected} ports`);
  }
}
```

#### Step 2.2: Create Background Job (30 min)
**File:** `/backend/src/jobs/detect-port-congestion.ts` (NEW)

```typescript
import { AISCongestionDetector } from '../services/port/ais-congestion-detector.js';

const detector = new AISCongestionDetector();

/**
 * Cron job: Run every 2 hours
 * Detects port congestion from AIS data
 */
async function main() {
  console.log('🚢 Starting automated port congestion detection...\n');

  try {
    await detector.detectAllPorts();
    console.log('\n✅ Port congestion detection complete');
  } catch (error) {
    console.error('❌ Error in congestion detection:', error);
    process.exit(1);
  }
}

main();
```

#### Step 2.3: Add to Cron Scheduler (15 min)
**File:** `/backend/src/main.ts` (MODIFY)

```typescript
import cron from 'node-cron';
import { exec } from 'child_process';

// Run port congestion detection every 2 hours
cron.schedule('0 */2 * * *', () => {
  console.log('⏰ Running port congestion detection...');
  exec('tsx src/jobs/detect-port-congestion.ts', (error, stdout, stderr) => {
    if (error) {
      console.error(`Port congestion detection error: ${error.message}`);
      return;
    }
    console.log(stdout);
  });
});

console.log('✅ Port congestion detection scheduled (every 2 hours)');
```

#### Step 2.4: Test Manually (15 min)

```bash
# Run congestion detection now
npx tsx src/jobs/detect-port-congestion.ts

# Check results
psql -h localhost -p 6432 -U ankr -d ankr_maritime -c "
  SELECT p.name, pc.vessels_waiting, pc.vessels_at_berth,
         pc.avg_wait_hours, pc.berth_utilization, pc.timestamp
  FROM port_congestion pc
  JOIN ports p ON p.id = pc.port_id
  WHERE pc.source = 'ais_derived'
  ORDER BY pc.timestamp DESC
  LIMIT 20;
"
```

**Estimated Time:** 2 hours
**Status After:** ✅ Automated congestion detection running every 2 hours

---

## 📋 TASK 3: AIS ROUTING VISUALIZATION

### Current State
- Route Calculator page exists (`/frontend/src/pages/RouteCalculator.tsx`)
- Map component exists (MapLibre GL)
- Missing: Overlay of live vessels + recommended route

### Implementation Steps

#### Step 3.1: Enhance Map Component (45 min)
**File:** `/frontend/src/pages/RouteCalculator.tsx` (ENHANCE)

```typescript
import { useEffect, useState, useRef } from 'react';
import { gql, useQuery } from '@apollo/client';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Add query for live vessel positions
const GET_VESSELS_NEAR_ROUTE = gql`
  query GetVesselsNearRoute($input: RouteRequestInput!, $radiusNm: Float!) {
    recommendRoute(input: $input) {
      waypoints {
        latitude
        longitude
      }
    }
    routeTrafficDensity(input: $input, radiusNm: $radiusNm) {
      vesselsNearRoute
      congestionLevel
    }
  }
`;

const GET_FLEET_POSITIONS = gql`
  query GetFleetPositions {
    vessels(take: 1000) {
      id
      name
      imo
      positions(take: 1, orderBy: { timestamp: desc }) {
        latitude
        longitude
        speed
        course
        heading
        timestamp
      }
    }
  }
`;

export default function RouteCalculator() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [showVessels, setShowVessels] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);

  // ... existing state ...

  const { data: fleetData } = useQuery(GET_FLEET_POSITIONS, {
    pollInterval: 60000, // Refresh every minute
    skip: !showVessels,
  });

  // Add vessel markers to map
  useEffect(() => {
    if (!map.current || !fleetData || !showVessels) return;

    // Clear existing vessel markers
    const existingMarkers = document.querySelectorAll('.vessel-marker');
    existingMarkers.forEach((m) => m.remove());

    // Add new vessel markers
    fleetData.vessels.forEach((vessel) => {
      if (!vessel.positions[0]) return;

      const pos = vessel.positions[0];
      const el = document.createElement('div');
      el.className = 'vessel-marker';
      el.innerHTML = '🚢';
      el.style.fontSize = '20px';
      el.style.cursor = 'pointer';
      el.title = `${vessel.name} (${vessel.imo})\nSpeed: ${pos.speed || 0} knots\nCourse: ${pos.course || 0}°`;

      // Rotate ship icon based on heading
      if (pos.heading) {
        el.style.transform = `rotate(${pos.heading}deg)`;
      }

      new maplibregl.Marker({ element: el })
        .setLngLat([pos.longitude, pos.latitude])
        .addTo(map.current!);
    });
  }, [fleetData, showVessels]);

  // Add route line with traffic density heatmap
  useEffect(() => {
    if (!map.current || !routeData) return;

    const waypoints = routeData.recommendRoute.waypoints;

    // Draw route line
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: waypoints.map((wp) => [wp.longitude, wp.latitude]),
        },
      },
    });

    map.current.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#0080ff',
        'line-width': 4,
        'line-dasharray': [2, 2],
      },
    });

    // Add waypoint markers
    waypoints.forEach((wp, i) => {
      if (i % 5 === 0 || i === waypoints.length - 1) {
        // Every 5th waypoint
        new maplibregl.Marker({ color: '#0080ff', scale: 0.8 })
          .setLngLat([wp.longitude, wp.latitude])
          .setPopup(
            new maplibregl.Popup().setHTML(
              `<strong>Waypoint ${i + 1}</strong><br/>${wp.cumulativeDistanceNm?.toFixed(1)} NM`
            )
          )
          .addTo(map.current!);
      }
    });
  }, [routeData]);

  return (
    <div className="flex flex-col h-screen">
      {/* Controls */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex gap-4 items-center">
          {/* ... existing controls ... */}

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showVessels}
              onChange={(e) => setShowVessels(e.target.checked)}
            />
            <span className="text-sm">Show Live Vessels</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showTraffic}
              onChange={(e) => setShowTraffic(e.target.checked)}
            />
            <span className="text-sm">Show Traffic Density</span>
          </label>
        </div>
      </div>

      {/* Map */}
      <div ref={mapContainer} className="flex-1" />

      {/* Traffic Stats Overlay */}
      {showTraffic && trafficData && (
        <div className="absolute top-20 right-4 bg-white rounded-lg shadow-lg p-4 w-64">
          <h3 className="font-semibold mb-2">Route Traffic</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Vessels Nearby:</span>
              <span className="font-semibold">
                {trafficData.routeTrafficDensity.vesselsNearRoute}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Congestion Level:</span>
              <span
                className={`font-semibold ${
                  trafficData.routeTrafficDensity.congestionLevel === 'low'
                    ? 'text-green-600'
                    : trafficData.routeTrafficDensity.congestionLevel === 'moderate'
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              >
                {trafficData.routeTrafficDensity.congestionLevel.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### Step 3.2: Add Route Comparison View (30 min)

```typescript
// Show side-by-side comparison: Great Circle vs ML Route
const [comparison, setComparison] = useState<{
  simple: Route;
  ml: Route;
} | null>(null);

// Calculate savings
const savings = comparison
  ? {
      distanceNm: comparison.simple.totalDistanceNm - comparison.ml.totalDistanceNm,
      days: comparison.simple.estimatedDays - comparison.ml.estimatedDays,
      fuelSavings:
        (comparison.simple.totalDistanceNm - comparison.ml.totalDistanceNm) * 0.5, // Rough estimate
    }
  : null;

// Display
{comparison && (
  <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 mb-4">
    <h3 className="text-lg font-semibold mb-4">Route Comparison</h3>
    <div className="grid grid-cols-2 gap-6">
      <div>
        <h4 className="font-semibold text-gray-700 mb-2">Great Circle (Simple)</h4>
        <div className="space-y-1 text-sm">
          <div>Distance: {comparison.simple.totalDistanceNm.toFixed(1)} NM</div>
          <div>Duration: {comparison.simple.estimatedDays.toFixed(1)} days</div>
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-blue-700 mb-2">
          ML-Optimized (11.6M AIS positions)
        </h4>
        <div className="space-y-1 text-sm">
          <div>Distance: {comparison.ml.totalDistanceNm.toFixed(1)} NM</div>
          <div>Duration: {comparison.ml.estimatedDays.toFixed(1)} days</div>
          <div className="text-green-600 font-semibold mt-2">
            ✓ Saves {Math.abs(savings.distanceNm).toFixed(1)} NM
          </div>
          <div className="text-green-600 font-semibold">
            ✓ Saves {Math.abs(savings.days).toFixed(1)} days
          </div>
        </div>
      </div>
    </div>
  </div>
)}
```

**Estimated Time:** 1.5 hours
**Status After:** ✅ Interactive map with live vessels + optimized routes

---

## 📋 TASK 4: DEVIATION ALERT SYSTEM

### Current State
**Service:** `/backend/src/services/voyage/route-deviation-detector.ts` (exists)
**Problem:** Not integrated, no background monitoring

### Implementation Steps

#### Step 4.1: Create Monitoring Job (30 min)
**File:** `/backend/src/jobs/monitor-route-deviations.ts` (NEW)

```typescript
import { prisma } from '../lib/prisma.js';
import { RouteDeviationDetector } from '../services/voyage/route-deviation-detector.js';

const detector = new RouteDeviationDetector();

async function main() {
  console.log('🔍 Checking route deviations for active voyages...\n');

  // Get all active voyages
  const activeVoyages = await prisma.voyage.findMany({
    where: {
      status: 'in_progress',
    },
    include: {
      vessel: {
        select: { id: true, name: true, imo: true },
      },
      departurePort: {
        select: { name: true, unlocode: true },
      },
      arrivalPort: {
        select: { name: true, unlocode: true },
      },
    },
  });

  console.log(`Found ${activeVoyages.length} active voyages\n`);

  let deviations = 0;

  for (const voyage of activeVoyages) {
    try {
      const result = await detector.checkVoyageDeviation(voyage.id);

      if (result.isDeviated) {
        console.log(
          `⚠️  DEVIATION: ${voyage.vessel.name} (${voyage.vessel.imo})`
        );
        console.log(
          `   Route: ${voyage.departurePort?.name} → ${voyage.arrivalPort?.name}`
        );
        console.log(
          `   Deviation: ${result.distanceFromRoute.toFixed(1)} NM (${result.percentage.toFixed(1)}%)`
        );
        console.log(`   Severity: ${result.severity}\n`);

        // Create alert
        await detector.createDeviationAlert(voyage.id, result);
        deviations++;
      }
    } catch (error) {
      console.error(`Error checking ${voyage.vessel.name}:`, error);
    }
  }

  console.log(`\n✅ Complete. ${deviations} deviations detected.`);
}

main();
```

#### Step 4.2: Schedule Background Job (15 min)
**File:** `/backend/src/main.ts` (ADD TO EXISTING CRON)

```typescript
// Run deviation monitoring every 15 minutes
cron.schedule('*/15 * * * *', () => {
  console.log('⏰ Monitoring route deviations...');
  exec('tsx src/jobs/monitor-route-deviations.ts', (error, stdout, stderr) => {
    if (error) {
      console.error(`Deviation monitoring error: ${error.message}`);
      return;
    }
    console.log(stdout);
  });
});

console.log('✅ Route deviation monitoring scheduled (every 15 minutes)');
```

#### Step 4.3: Create Frontend Alert Panel (45 min)
**File:** `/frontend/src/pages/VoyageAlertsPanel.tsx` (ENHANCE)

```typescript
import { gql, useQuery } from '@apollo/client';
import { useState } from 'react';

const GET_DEVIATION_ALERTS = gql`
  query GetDeviationAlerts {
    delayAlerts(
      where: { type: "route_deviation", status: "active" }
      orderBy: { createdAt: desc }
    ) {
      id
      voyageId
      severity
      estimatedDelayHours
      reason
      createdAt
      voyage {
        voyageNumber
        vessel {
          name
          imo
        }
        departurePort {
          name
        }
        arrivalPort {
          name
        }
      }
    }
  }
`;

export default function VoyageAlertsPanel() {
  const { data, loading } = useQuery(GET_DEVIATION_ALERTS, {
    pollInterval: 60000, // Refresh every minute
  });

  if (loading) return <div>Loading alerts...</div>;

  const alerts = data?.delayAlerts || [];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Route Deviation Alerts</h2>
        <p className="text-sm text-gray-600">
          Vessels that have deviated >50 NM from planned route
        </p>
      </div>

      <div className="divide-y">
        {alerts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            ✅ All vessels on course
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 hover:bg-gray-50 ${
                alert.severity === 'critical' ? 'bg-red-50' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        alert.severity === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="font-semibold">
                      {alert.voyage.vessel.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({alert.voyage.vessel.imo})
                    </span>
                  </div>

                  <div className="mt-2 text-sm text-gray-700">
                    <div>
                      Route: {alert.voyage.departurePort?.name} →{' '}
                      {alert.voyage.arrivalPort?.name}
                    </div>
                    <div className="mt-1 text-red-600 font-medium">
                      {alert.reason}
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    Detected{' '}
                    {new Date(alert.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                <button className="text-sm text-blue-600 hover:text-blue-800">
                  View Details →
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

#### Step 4.4: Add to Dashboard (15 min)
**File:** `/frontend/src/pages/Dashboard.tsx` (ADD)

```typescript
import VoyageAlertsPanel from './VoyageAlertsPanel';

// Add to dashboard layout
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
  {/* Existing widgets */}

  {/* NEW: Deviation Alerts */}
  <VoyageAlertsPanel />
</div>
```

**Estimated Time:** 1.5 hours
**Status After:** ✅ Automated deviation detection + real-time alerts

---

## 📊 TESTING & VALIDATION

### Test Plan

#### Test 1: Route Engine
```bash
# Query recommended route
curl -X POST http://localhost:4001/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { recommendRoute(input: { fromUnlocode: \"INMUN\", toUnlocode: \"SGSIN\" }) { totalDistanceNm estimatedDays confidence basedOnVesselCount } }"
  }'

# Expected: ~2100 NM, ~7 days, 70-90% confidence, 100+ vessels
```

#### Test 2: Port Congestion
```bash
# Run manual detection
npx tsx src/jobs/detect-port-congestion.ts

# Check database
psql -d ankr_maritime -c "
  SELECT COUNT(*) FROM port_congestion WHERE source = 'ais_derived';
"

# Expected: 20-50 ports with congestion detected
```

#### Test 3: Route Visualization
```
1. Open http://localhost:5173/route-calculator
2. Select Mumbai → Singapore
3. Toggle "Show Live Vessels" - should see 100+ vessel markers
4. Toggle "Show Traffic Density" - should see congestion level
5. Switch to "ML Route" - should show comparison with savings
```

#### Test 4: Deviation Alerts
```bash
# Create test voyage with deviation
# (Manually insert voyage with route far from vessel position)

# Run monitor
npx tsx src/jobs/monitor-route-deviations.ts

# Check alerts
psql -d ankr_maritime -c "
  SELECT * FROM delay_alerts WHERE type = 'route_deviation';
"

# Expected: Alert created with severity and distance
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Test all 4 features locally
- [ ] Verify cron jobs run successfully
- [ ] Check database performance (11.6M positions should query <500ms)
- [ ] Ensure AIS ingestion is still running
- [ ] Test GraphQL queries with realistic load

### Deployment Steps
1. [ ] Merge feature branches to `main`
2. [ ] Run migrations (if any schema changes)
3. [ ] Deploy backend with cron jobs
4. [ ] Deploy frontend with new components
5. [ ] Verify cron jobs started on server
6. [ ] Monitor logs for first 2 hours

### Post-Deployment
- [ ] Check congestion detection ran successfully (2h after deploy)
- [ ] Verify deviation monitoring ran (15min after deploy)
- [ ] Test route engine queries from UI
- [ ] Monitor database load (should be <50% CPU)
- [ ] Check AIS position growth (should continue at 5.7M/day)

---

## 📈 SUCCESS METRICS

After activation, you should see:

**Route Engine:**
- ✅ 100+ route recommendations/day
- ✅ 70-90% confidence scores
- ✅ <300ms query time
- ✅ Based on 1000+ real vessels per route

**Port Congestion:**
- ✅ 50-100 ports with auto-detected congestion
- ✅ Updates every 2 hours
- ✅ 85%+ accuracy vs manual reports
- ✅ Alerts sent for high congestion (>10 vessels waiting)

**Route Visualization:**
- ✅ 100+ live vessels visible on map
- ✅ Real-time position updates (1min refresh)
- ✅ Traffic density heatmap
- ✅ Side-by-side route comparison

**Deviation Alerts:**
- ✅ Checks run every 15 minutes
- ✅ <50ms per voyage check
- ✅ Alerts created within 30min of deviation
- ✅ 95%+ accuracy (no false positives)

---

## ⏱️ TOTAL TIME ESTIMATE

| Task | Time |
|------|------|
| 1. Activate Route Engine | 1.5 hours |
| 2. Automated Congestion | 2.0 hours |
| 3. Route Visualization | 1.5 hours |
| 4. Deviation Alerts | 1.5 hours |
| **TOTAL** | **6.5 hours** |

**Realistic Schedule:** 1 day (with testing & debugging)

---

## 🎯 NEXT STEPS

After completing these 4 tasks, you'll have:
- ✅ Production-ready AIS routing intelligence
- ✅ Automated port congestion monitoring
- ✅ Beautiful visualizations
- ✅ Real-time deviation alerts

**Then proceed to:**
- Open source strategy implementation (see MARI8X-OPENSOURCE-ENTERPRISE-STRATEGY.md)
- Community edition split
- Launch preparation

Ready to start? Let's begin with **Task 1: Activate Route Engine**! 🚀
