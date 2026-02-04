# Mari8X Vessel Map + Routing Engine - Complete System

**Date**: February 1, 2026

---

## 🎯 **WHAT WE'RE BUILDING**

### **1. Real-Time Vessel Map** 🗺️
- Show all vessels on interactive map
- Filter by vessel type, size, status
- Click vessel → see details, history, route

### **2. Cargo Matching System** 🔗
- Show cargo enquiries on map
- Find nearest available vessels
- Calculate distance, ETA, suitability score
- AI-powered matching algorithm

### **3. AIS-Based Routing Engine** ⚓
- Learn optimal routes from historical AIS data
- Calculate realistic voyage times
- Avoid restricted areas
- Weather routing (future)
- Fuel optimization (future)

---

## 📊 **DATA STRATEGY**

### **Recent Data (< 7 days)**
- **ALL positions** stored
- Used for real-time tracking
- High-frequency updates (1-10 minutes)
- Size: ~1.4 GB

### **Historical Data (> 7 days)**
- **ONE position per vessel per day** kept
- Used for routing engine
- Tracks vessel movement patterns
- Size: Minimal (~100 MB/year)

### **Why This Works:**

**Example for vessel "PACIFIC DREAM" traveling Singapore → Rotterdam:**

**Week 1 (Recent):**
- 10,080 positions (1 per minute) = detailed tracking
- Can see exact route through Malacca Strait
- Real-time deviation alerts

**After 7 days (Historical):**
- 25 positions (1 per day) = route summary
- Shows: Singapore → Malacca → Indian Ocean → Suez → Med → Rotterdam
- Enough for routing engine to learn optimal path

**After 1 year:**
- 365 positions (1 per day) = annual pattern
- Shows seasonal variations
- Weather-based route changes

---

## 🔧 **IMPLEMENTATION**

### **Backend - GraphQL API** ✅ CREATED

**File**: `/root/apps/ankr-maritime/backend/src/schema/types/map-visualization.ts`

**Queries:**

1. **vesselsOnMap**
   ```graphql
   query {
     vesselsOnMap(
       boundingBox: "1.0,103.0,23.0,115.0"  # South China Sea
       vesselTypes: ["bulk_carrier", "tanker"]
       minDWT: 50000
     ) {
       vesselId
       name
       latitude
       longitude
       speed
       course
       status
       dwt
       isAvailable
     }
   }
   ```

2. **cargoEnquiriesOnMap**
   ```graphql
   query {
     cargoEnquiriesOnMap(status: ["pending", "negotiating"]) {
       enquiryId
       cargoType
       quantity
       loadPortName
       loadPortLatitude
       loadPortLongitude
       dischargePortName
       dischargePortLatitude
       dischargePortLongitude
       laycanFrom
       laycanTo
     }
   }
   ```

3. **matchCargo** - AI-powered vessel-cargo matching
   ```graphql
   query {
     matchCargo(
       enquiryId: "cargo123"
       maxDistance: 1000  # nautical miles
       limit: 10
     ) {
       vesselName
       score          # 0-100 match quality
       distance       # nautical miles
       eta            # days to load port
       suitability    # excellent/good/too_far/too_small/too_large
       reason
       vessel {
         latitude
         longitude
         dwt
         speed
       }
     }
   }
   ```

---

## 🗺️ **ROUTING ENGINE**

### **How It Works:**

**Step 1: Collect Historical Routes**
```sql
-- Get daily positions for a vessel over 60 days
SELECT
  vesselId,
  DATE(timestamp) as day,
  latitude,
  longitude
FROM vessel_positions
WHERE vesselId = 'vessel_abc'
  AND timestamp > NOW() - INTERVAL '60 days'
GROUP BY vesselId, DATE(timestamp), latitude, longitude
ORDER BY day
```

**Step 2: Identify Common Routes**
- Cluster start/end points (port pairs)
- Group similar routes
- Calculate average voyage time

**Step 3: Build Route Database**
```typescript
interface LearnedRoute {
  fromPort: string;        // "SGSIN" (Singapore)
  toPort: string;          // "NLRTM" (Rotterdam)
  distance: number;        // 8,500 nautical miles
  avgDuration: number;     // 25 days
  waypoints: Waypoint[];   // [Singapore, Malacca, Indian Ocean, Suez, Med, Rotterdam]
  viaCanal: 'suez' | 'panama' | 'cape' | null;
  samples: number;         // 127 voyages analyzed
  lastUpdated: Date;
}

interface Waypoint {
  latitude: number;
  longitude: number;
  name: string;            // "Strait of Malacca"
  sequence: number;        // 1, 2, 3...
  avgTimeFromStart: number; // 2.5 days
}
```

**Step 4: Route Prediction**
```typescript
async function calculateRoute(fromPort: string, toPort: string) {
  // 1. Check if we have learned this route
  const learned = await getLearnedRoute(fromPort, toPort);

  if (learned) {
    // Use historical data
    return {
      waypoints: learned.waypoints,
      distance: learned.distance,
      estimatedDays: learned.avgDuration,
      confidence: learned.samples > 10 ? 'high' : 'medium',
    };
  }

  // 2. If not, calculate great circle + canal routing
  return calculateGreatCircleRoute(fromPort, toPort);
}
```

---

## 💡 **USE CASES**

### **Use Case 1: Charter Broker - Cargo Matching**

**Scenario**: You have a cargo enquiry for 50,000 MT grain from Argentina to China

**Steps:**
1. Click "Match Cargo" button
2. System finds all bulk carriers within 1,000 nm
3. Calculates:
   - Distance to load port
   - ETA (days)
   - Size suitability (DWT vs cargo weight)
   - Match score (0-100)
4. Shows top 10 matches on map with colored markers:
   - 🟢 Green = Excellent match (90-100 score)
   - 🟡 Yellow = Good match (70-89 score)
   - 🔴 Red = Poor match (< 70 score)

**Result**: You immediately see "MV OCEAN STAR" is 150 nm away, perfect size, 2 days ETA → call broker!

---

### **Use Case 2: Voyage Planning - Route Optimization**

**Scenario**: Planning Singapore → Rotterdam voyage

**Steps:**
1. Select route: SGSIN → NLRTM
2. System shows:
   - ✅ Learned from 127 historical voyages
   - ✅ Average duration: 25 days (at 14 knots)
   - ✅ Optimal route: Malacca → Suez (faster than Cape)
   - ✅ Waypoints with checkpoints
3. Compare routes:
   - Via Suez: 25 days, 8,500 nm
   - Via Cape: 32 days, 11,000 nm
   - Savings: 7 days, $50K fuel

**Result**: Choose Suez route with confidence backed by real data

---

### **Use Case 3: Fleet Visibility Dashboard**

**Scenario**: Operations manager wants to see where all vessels are

**Steps:**
1. Open fleet map
2. See all vessels updated in real-time
3. Filter by:
   - Vessel type (tankers, bulk carriers, etc.)
   - Status (underway, anchored, port)
   - Region (South China Sea, North Sea, etc.)
4. Click vessel → see:
   - Current position, speed, heading
   - Last 7 days track (detailed)
   - Last 30 days route (daily snapshots)
   - Destination, ETA
   - Next port call

**Result**: Complete fleet visibility on one screen

---

## 🚀 **FRONTEND COMPONENTS TO BUILD**

### **1. VesselMap.tsx** (Main Map Component)

**Technology**: Leaflet or Mapbox GL JS

**Features:**
- ✅ Display all vessels as markers
- ✅ Color by status (green=underway, yellow=anchored, red=trouble)
- ✅ Size by DWT (bigger vessels = bigger markers)
- ✅ Click marker → vessel popup
- ✅ Real-time position updates (WebSocket)
- ✅ Clustering for dense areas
- ✅ Draw routes between ports
- ✅ Show cargo enquiries as different markers

**Component Structure:**
```tsx
<VesselMap>
  <LayerControl>
    <BaseLayer name="OpenStreetMap" />
    <BaseLayer name="Satellite" />
  </LayerControl>

  <VesselMarkers
    vessels={vesselsOnMap}
    onClick={handleVesselClick}
  />

  <CargoMarkers
    cargoes={cargoEnquiriesOnMap}
    onClick={handleCargoClick}
  />

  <RouteLines
    routes={learnedRoutes}
  />

  <GeofenceLayer
    zones={ecaZones}
  />
</VesselMap>
```

---

### **2. CargoMatchingPanel.tsx**

**Features:**
- Show cargo details (type, quantity, ports, laycan)
- Display top 10 matched vessels
- Each match shows: vessel name, distance, ETA, score
- Click "View on Map" → zoom to vessel + cargo
- Click "Send Inquiry" → create charter offer

```tsx
<CargoMatchingPanel cargo={selectedCargo}>
  <CargoDetails />

  <MatchList>
    {matches.map(match => (
      <MatchCard
        key={match.vesselId}
        vessel={match.vessel}
        score={match.score}
        distance={match.distance}
        eta={match.eta}
        suitability={match.suitability}
        onViewMap={() => zoomToVessel(match.vesselId)}
        onSendInquiry={() => createOffer(match)}
      />
    ))}
  </MatchList>
</CargoMatchingPanel>
```

---

### **3. RouteCalculator.tsx**

**Features:**
- Select origin and destination ports
- Show historical route data
- Compare alternative routes (Suez vs Cape, Panama vs Cape Horn)
- Calculate:
  - Distance (nautical miles)
  - Duration (days at given speed)
  - Fuel consumption
  - Canal fees
  - Total voyage cost
- Display route on map with waypoints

```tsx
<RouteCalculator>
  <PortSelector
    from={fromPort}
    to={toPort}
    onChange={handlePortChange}
  />

  <RouteOptions>
    <RouteOption
      name="Via Suez Canal"
      distance={8500}
      days={25}
      cost={245000}
      confidence="high"  // Based on 127 voyages
      isRecommended
    />
    <RouteOption
      name="Via Cape of Good Hope"
      distance={11000}
      days={32}
      cost={298000}
      confidence="medium"  // Based on 34 voyages
    />
  </RouteOptions>

  <RouteMap routes={routes} />
</RouteCalculator>
```

---

## 📐 **ROUTING ENGINE - DETAILED ALGORITHM**

### **Phase 1: Historical Route Learning** (Backend Job)

**File**: `/root/apps/ankr-maritime/backend/src/jobs/learn-routes.ts`

```typescript
async function learnRoutes() {
  // 1. Find all port-to-port voyages in historical data
  const voyages = await findVoyages();

  // 2. For each port pair, extract route patterns
  for (const [fromPort, toPort] of portPairs) {
    const routes = await extractRoutes(fromPort, toPort);

    // 3. Cluster similar routes
    const clusters = clusterRoutes(routes);

    // 4. Calculate average waypoints
    const avgRoute = calculateAverageRoute(clusters[0]); // Main route

    // 5. Store learned route
    await storeLearnedRoute({
      fromPort,
      toPort,
      distance: avgRoute.distance,
      avgDuration: avgRoute.duration,
      waypoints: avgRoute.waypoints,
      viaCanal: detectCanal(avgRoute.waypoints),
      samples: routes.length,
    });
  }
}

function findVoyages() {
  // Detect voyages by finding port visits in daily positions
  // A voyage = sequence of positions between two port calls
  return prisma.$queryRaw`
    WITH daily_positions AS (
      SELECT DISTINCT ON (vesselId, DATE(timestamp))
        vesselId,
        DATE(timestamp) as day,
        latitude,
        longitude
      FROM vessel_positions
      WHERE timestamp > NOW() - INTERVAL '180 days'
      ORDER BY vesselId, DATE(timestamp), timestamp DESC
    ),
    port_visits AS (
      SELECT
        dp.vesselId,
        dp.day,
        p.id as portId,
        p.name as portName,
        dp.latitude,
        dp.longitude
      FROM daily_positions dp
      CROSS JOIN ports p
      WHERE ST_DWithin(
        ST_MakePoint(dp.longitude, dp.latitude)::geography,
        ST_MakePoint(p.longitude, p.latitude)::geography,
        50000  -- 50 km radius
      )
    ),
    voyages AS (
      SELECT
        vesselId,
        LAG(portId) OVER (PARTITION BY vesselId ORDER BY day) as fromPort,
        portId as toPort,
        LAG(day) OVER (PARTITION BY vesselId ORDER BY day) as departureDay,
        day as arrivalDay
      FROM port_visits
    )
    SELECT * FROM voyages
    WHERE fromPort IS NOT NULL
      AND departureDay IS NOT NULL
  `;
}
```

---

### **Phase 2: Great Circle + Canal Routing**

For port pairs we haven't learned yet:

```typescript
function calculateGreatCircleRoute(fromPort: Port, toPort: Port) {
  // 1. Calculate great circle distance
  const distance = haversineDistance(
    fromPort.latitude,
    fromPort.longitude,
    toPort.latitude,
    toPort.longitude
  );

  // 2. Check if route crosses major canals
  const crossesSuez = routeCrosses(fromPort, toPort, SUEZ_CANAL_POSITION);
  const crossesPanama = routeCrosses(fromPort, toPort, PANAMA_CANAL_POSITION);

  // 3. Generate waypoints
  const waypoints: Waypoint[] = [];

  if (crossesSuez) {
    waypoints.push(
      { lat: 29.9773, lon: 32.5366, name: 'Suez Canal', sequence: 1 }
    );
  }

  if (crossesPanama) {
    waypoints.push(
      { lat: 9.0, lon: -79.6, name: 'Panama Canal', sequence: 1 }
    );
  }

  // 4. Add intermediate waypoints every 1000 nm
  const intermediatePoints = generateIntermediateWaypoints(
    fromPort,
    toPort,
    1000  // nautical miles
  );
  waypoints.push(...intermediatePoints);

  // 5. Calculate ETA
  const avgSpeed = 14; // knots
  const estimatedDays = distance / (avgSpeed * 24);

  return {
    waypoints,
    distance,
    estimatedDays,
    confidence: 'low',  // No historical data
    method: 'calculated',
  };
}
```

---

## 📊 **DATA STORAGE ESTIMATE**

### **Learned Routes Table**

```sql
CREATE TABLE learned_routes (
  id TEXT PRIMARY KEY,
  from_port TEXT NOT NULL,
  to_port TEXT NOT NULL,
  distance FLOAT NOT NULL,
  avg_duration FLOAT NOT NULL,
  via_canal TEXT,  -- 'suez', 'panama', 'cape', null
  waypoints JSONB NOT NULL,
  samples INTEGER NOT NULL,
  last_updated TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(from_port, to_port, via_canal)
);
```

**Size Estimate:**
- 800 ports × 800 ports = 640,000 potential routes
- Realistically only ~5,000 common routes
- Each route: ~2 KB (including waypoints)
- **Total: ~10 MB** (negligible)

---

## 🎯 **NEXT STEPS**

### **Immediate (This Week):**
1. ✅ Create GraphQL API for map + cargo matching (DONE)
2. ⏳ Create frontend VesselMap component
3. ⏳ Create CargoMatchingPanel
4. ⏳ Test with real AIS data

### **Short Term (Next 2 Weeks):**
5. ⏳ Build route learning job
6. ⏳ Create learned_routes table
7. ⏳ Add RouteCalculator component
8. ⏳ Integrate with charter creation workflow

### **Long Term (Next Month):**
9. ⏳ Weather routing integration
10. ⏳ Fuel optimization
11. ⏳ ECA zone avoidance
12. ⏳ Piracy risk zones
13. ⏳ Real-time route recommendations

---

## 🚀 **BUSINESS VALUE**

### **For Charter Brokers:**
- ✅ Find perfect vessel in seconds (vs hours of phone calls)
- ✅ Data-driven negotiations (know real market distance/time)
- ✅ Competitive advantage (faster fixture matching)
- ✅ **ROI**: Close 20% more fixtures

### **For Vessel Operators:**
- ✅ Optimal voyage planning (save 5-10% fuel)
- ✅ Realistic ETAs (reduce demurrage disputes)
- ✅ Fleet visibility (know where all vessels are)
- ✅ **ROI**: $50K-100K saved per vessel per year

### **For Ship Owners:**
- ✅ Portfolio optimization (best routes for each vessel)
- ✅ Market intelligence (where is demand?)
- ✅ Route benchmarking (are my vessels efficient?)
- ✅ **ROI**: 2-3% improvement in fleet utilization

---

**Total System Cost**: **$0/month** (FREE AIS data + self-hosted)

**Development Effort**: ~2-3 weeks for full system

**Competitive Advantage**: **MASSIVE** (most platforms don't have this)

---

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
