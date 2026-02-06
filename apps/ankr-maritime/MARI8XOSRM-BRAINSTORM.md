# 🌊 Mari8XOSRM - OSRM for Maritime
**Building the World's First Open-Source Ocean Routing Engine**

Date: February 6, 2026
Based on: 46M+ AIS positions, 36K vessels, 12,714 ports

---

## 🎯 Vision

**Create an open-source maritime routing engine** like OSRM (Open Source Routing Machine) but for ocean routes, trained on real AIS data to provide:

1. **Accurate port-to-port distances** for chartering
2. **Vessel-type specific routing** (container, tanker, bulk, etc.)
3. **Real-time route optimization** using fleet intelligence
4. **Weather-aware routing** for safety and efficiency
5. **API-first design** for integration with chartering platforms

---

## 🏗️ Current Foundation (Already Built!)

###

 1. **Mari8X Route Engine** (`mari8x-route-engine.ts`)
- ✅ Uses 46M+ AIS positions for ML-powered routing
- ✅ Vessel position tracking and route extraction
- ✅ Traffic density analysis
- ✅ Route deviation detection

### 2. **Route Calculator** (`route-calculator.ts`)
- ✅ A* pathfinding algorithm
- ✅ Vessel constraint checking (draft, LOA, beam)
- ✅ Auto-learning from historical data
- ✅ Multi-criteria optimization (speed, fuel, safety)

### 3. **Historical Route Analyzer** (`historical-route-analyzer.ts`)
- ✅ Auto-learns from completed voyages
- ✅ Extracts route patterns from 12.6M+ positions
- ✅ Incremental learning (gets smarter over time)
- ✅ Route quality feedback loop

### 4. **Fleet Collaborative Learner** (`fleet-collaborative-learner.ts`)
- ✅ Real-time learning from active vessels
- ✅ "Ship A ahead, Ship B middle, Ship C behind" concept
- ✅ Merges fleet data for optimal routing
- ✅ Living routes that improve in real-time

---

## 🚀 Phase 1: Enhanced Training System (Weeks 1-4)

### Goal: Make distances **charterer-grade accurate** (±1% error)

### 1.1 AIS-Based Route Extraction

**Current:** Basic route extraction from positions
**Upgrade:**
```typescript
class AISRouteExtractor {
  /**
   * Extract high-quality routes from AIS data
   */
  async extractRoutes(options: {
    minPositions: number;        // e.g., 50 points minimum
    maxGapHours: number;         // e.g., 6 hours max gap
    speedFilter: {
      min: number;               // e.g., 3 knots (moving)
      max: number;               // e.g., 25 knots (realistic)
    };
    qualityThreshold: number;    // e.g., 0.7 (70% coverage)
  }): Promise<ExtractedRoute[]> {
    // 1. Filter vessels by movement patterns
    // 2. Identify port-to-port segments
    // 3. Clean outliers and gaps
    // 4. Validate route quality
    // 5. Calculate accurate distances
  }
}
```

**Key Features:**
- ✅ **Gap filling**: Interpolate missing positions (ships go dark in some areas)
- ✅ **Outlier detection**: Remove GPS errors and impossible speeds
- ✅ **Port detection**: Identify actual departure/arrival ports from dwell time
- ✅ **Route segmentation**: Split long voyages into port-to-port segments

### 1.2 Distance Accuracy Training

**Challenge:** Haversine (great circle) vs actual sailed distance
**Solution:** Train on actual AIS tracks

```typescript
interface DistanceModel {
  // Base great circle distance
  greatCircleNm: number;

  // Actual sailed distance (from AIS)
  actualSailedNm: number;

  // Distance factor (actual / great circle)
  distanceFactor: number;  // e.g., 1.15 means 15% longer

  // Factors affecting distance
  factors: {
    routeType: 'DIRECT' | 'VIA_CANAL' | 'COASTAL' | 'WEATHER_ROUTE';
    vesselType: string;
    season: string;
    viaPoints: string[];  // Suez, Panama, Gibraltar, etc.
  };

  // Confidence based on sample size
  sampleSize: number;
  confidence: number;
}
```

**Training Algorithm:**
```typescript
class DistanceTrainer {
  async train() {
    // For each port pair:
    // 1. Get all AIS tracks (e.g., 100+ voyages)
    // 2. Calculate actual sailed distance
    // 3. Calculate great circle distance
    // 4. Compute distance factor = actual / great_circle
    // 5. Identify common route patterns
    // 6. Store in PortPairDistance table
  }
}
```

### 1.3 Route Pattern Recognition

**Goal:** Identify common shipping lanes and waypoints

```typescript
interface RoutePattern {
  id: string;
  originPortId: string;
  destPortId: string;
  vesselType: string;

  // Common waypoints discovered from AIS
  commonWaypoints: Waypoint[];

  // Route variants (weather, season, etc.)
  variants: RouteVariant[];

  // Usage statistics
  observedVoyages: number;
  reliability: number;  // 0-1

  // Performance metrics
  avgDistanceNm: number;
  avgDurationHours: number;
  avgSpeedKnots: number;
  avgFuelMt: number;
}
```

**Pattern Discovery:**
- ✅ **Clustering**: Group similar tracks using DBSCAN
- ✅ **Waypoint extraction**: Identify common turning points
- ✅ **Route classification**: Direct, via canal, coastal, weather routes
- ✅ **Seasonal patterns**: Summer vs winter routes

---

## 🚀 Phase 2: Graph-Based Routing (Weeks 5-8)

### Goal: Build a **maritime graph** like OSRM's road network

### 2.1 Maritime Graph Structure

```typescript
interface MaritimeGraph {
  nodes: MaritimeNode[];
  edges: MaritimeEdge[];
}

interface MaritimeNode {
  id: string;
  type: 'PORT' | 'WAYPOINT' | 'CANAL' | 'STRAIT' | 'TSS' | 'JUNCTION';
  lat: number;
  lng: number;
  name?: string;

  // Node properties
  minDraft?: number;      // For canals/straits
  maxLOA?: number;
  maxBeam?: number;
  speedLimit?: number;    // For TSS zones

  // Connections
  connectedEdges: string[];
}

interface MaritimeEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;

  // Edge properties
  distanceNm: number;
  typicalSpeedKnots: number;
  typicalDurationHours: number;

  // Traffic and conditions
  trafficDensity: 'LOW' | 'MEDIUM' | 'HIGH';
  weatherExposure: 'SHELTERED' | 'MODERATE' | 'EXPOSED';
  piracyRisk: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';

  // Vessel restrictions
  minVesselSize?: number;
  maxVesselSize?: number;
  allowedVesselTypes?: string[];

  // Cost factors
  fuelCostFactor: number;
  timeCostFactor: number;
  riskFactor: number;

  // Learning data
  observedVoyages: number;
  confidence: number;
}
```

### 2.2 Graph Construction from AIS Data

**Step 1: Identify Maritime Nodes**
```typescript
async function buildMaritimeNodes(): Promise<MaritimeNode[]> {
  const nodes: MaritimeNode[] = [];

  // 1. Add all ports (12,714 ports)
  const ports = await prisma.port.findMany();
  nodes.push(...ports.map(p => ({
    id: `PORT_${p.id}`,
    type: 'PORT',
    lat: p.lat,
    lng: p.lng,
    name: p.name
  })));

  // 2. Add major waypoints (discovered from AIS clustering)
  const waypoints = await discoverCommonWaypoints();
  nodes.push(...waypoints);

  // 3. Add canal/strait entry/exit points
  const chokePoints = [
    { name: 'Suez North', lat: 31.2653, lng: 32.3019 },
    { name: 'Suez South', lat: 29.9668, lng: 32.5498 },
    { name: 'Panama Atlantic', lat: 9.3796, lng: -79.9200 },
    { name: 'Panama Pacific', lat: 8.8822, lng: -79.5199 },
    { name: 'Gibraltar', lat: 36.1410, lng: -5.3532 },
    { name: 'Malacca West', lat: 1.4370, lng: 103.3590 },
    { name: 'Malacca East', lat: 1.2303, lng: 104.1167 },
    // ... more
  ];
  nodes.push(...chokePoints.map((cp, i) => ({
    id: `CHOKE_${i}`,
    type: 'STRAIT',
    ...cp
  })));

  return nodes;
}
```

**Step 2: Build Edges from AIS Tracks**
```typescript
async function buildMaritimeEdges(nodes: MaritimeNode[]): Promise<MaritimeEdge[]> {
  const edges: MaritimeEdge[] = [];

  // For each pair of nearby nodes, check if vessels sail between them
  for (const fromNode of nodes) {
    const nearbyNodes = findNodesWithin(nodes, fromNode, 500); // 500nm radius

    for (const toNode of nearbyNodes) {
      // Check AIS data for vessels sailing from -> to
      const tracks = await findAISTracksb
etween(fromNode, toNode);

      if (tracks.length >= 5) {  // Need at least 5 observations
        const avgDistance = tracks.reduce((s, t) => s + t.distance, 0) / tracks.length;
        const avgDuration = tracks.reduce((s, t) => s + t.duration, 0) / tracks.length;
        const avgSpeed = avgDistance / avgDuration;

        edges.push({
          id: `${fromNode.id}_${toNode.id}`,
          fromNodeId: fromNode.id,
          toNodeId: toNode.id,
          distanceNm: avgDistance,
          typicalSpeedKnots: avgSpeed,
          typicalDurationHours: avgDuration,
          trafficDensity: classifyTrafficDensity(tracks.length),
          observedVoyages: tracks.length,
          confidence: Math.min(1.0, tracks.length / 50),
          // ... other properties
        });
      }
    }
  }

  return edges;
}
```

### 2.3 Routing Algorithm: Maritime A*

**Enhancement over basic A*:**

```typescript
class MaritimeAStarRouter {
  /**
   * Find optimal route using maritime graph
   */
  async findRoute(request: {
    fromPortId: string;
    toPortId: string;
    vesselType: string;
    draft: number;
    loa: number;
    beam: number;
    optimizeFor: 'DISTANCE' | 'TIME' | 'FUEL' | 'COST' | 'SAFETY';
  }): Promise<MaritimeRoute> {

    const startNode = this.graph.getNode(`PORT_${request.fromPortId}`);
    const endNode = this.graph.getNode(`PORT_${request.toPortId}`);

    // A* with maritime-specific heuristic
    const openSet = new PriorityQueue<AStarNode>();
    const closedSet = new Set<string>();

    openSet.push({
      node: startNode,
      gScore: 0,  // Cost from start
      fScore: this.heuristic(startNode, endNode, request.optimizeFor),  // Estimated total cost
      parent: null,
      edgeTaken: null
    });

    while (!openSet.isEmpty()) {
      const current = openSet.pop();

      if (current.node.id === endNode.id) {
        return this.reconstructPath(current);
      }

      closedSet.add(current.node.id);

      // Explore neighbors
      for (const edge of this.graph.getEdgesFrom(current.node.id)) {
        // Check vessel constraints
        if (!this.canVesselUseEdge(edge, request)) {
          continue;  // Skip restricted edges
        }

        const neighbor = this.graph.getNode(edge.toNodeId);
        if (closedSet.has(neighbor.id)) {
          continue;
        }

        // Calculate cost based on optimization criteria
        const edgeCost = this.calculateEdgeCost(edge, request.optimizeFor);
        const tentativeGScore = current.gScore + edgeCost;

        // Add to open set
        openSet.push({
          node: neighbor,
          gScore: tentativeGScore,
          fScore: tentativeGScore + this.heuristic(neighbor, endNode, request.optimizeFor),
          parent: current,
          edgeTaken: edge
        });
      }
    }

    throw new Error('No route found');
  }

  /**
   * Maritime-specific heuristic (admissible!)
   */
  private heuristic(from: MaritimeNode, to: MaritimeNode, optimizeFor: string): number {
    const distance = haversineDistance(from.lat, from.lng, to.lat, to.lng);

    switch (optimizeFor) {
      case 'DISTANCE':
        return distance;
      case 'TIME':
        return distance / 14;  // Assume 14 knots
      case 'FUEL':
        return distance * 2.5;  // Rough fuel consumption
      case 'COST':
        return distance * 100;  // $100/nm rough estimate
      case 'SAFETY':
        return distance * 1.2;  // Prefer safer, slightly longer routes
      default:
        return distance;
    }
  }
}
```

---

## 🚀 Phase 3: OSRM-Style API (Weeks 9-12)

### Goal: Clean, fast API like OSRM

### 3.1 API Design

```typescript
/**
 * OSRM-style API for maritime routing
 * http://ocean-routing.mari8x.com/route/v1/{profile}/{coordinates}
 */

// GET /route/v1/container/103.8545,1.2897;139.6917,35.6895
// Returns: Singapore -> Tokyo route for container vessel

interface OceanRoutingAPI {
  /**
   * Calculate route between coordinates
   */
  route(request: {
    profile: 'container' | 'tanker' | 'bulk' | 'general' | 'roro';
    coordinates: Array<[lon, lat]>;  // [start, end] or [start, via1, via2, end]
    alternatives?: number;            // Number of alternative routes
    steps?: boolean;                  // Include turn-by-turn waypoints
    geometries?: 'polyline' | 'geojson';
    overview?: 'full' | 'simplified' | 'false';

    // Maritime-specific
    draft?: number;                   // Vessel draft in meters
    loa?: number;                     // Length overall in meters
    beam?: number;                    // Beam in meters
    speed?: number;                   // Service speed in knots
    optimize?: 'distance' | 'time' | 'fuel' | 'cost';
  }): Promise<RouteResponse>;

  /**
   * Calculate distance matrix
   */
  table(request: {
    profile: string;
    sources: Array<[lon, lat]>;
    destinations: Array<[lon, lat]>;
  }): Promise<TableResponse>;

  /**
   * Find nearest maritime node
   */
  nearest(request: {
    profile: string;
    coordinates: [lon, lat];
    number?: number;  // Number of results
  }): Promise<NearestResponse>;

  /**
   * Get isochrone (reachable area in X hours)
   */
  isochrone(request: {
    profile: string;
    coordinates: [lon, lat];
    contours: number[];  // [12, 24, 48] hours
  }): Promise<IsochroneResponse>;
}
```

### 3.2 Response Format (OSRM-compatible)

```json
{
  "code": "Ok",
  "routes": [{
    "geometry": "...",  // Encoded polyline or GeoJSON
    "legs": [{
      "distance": 6420.5,      // Nautical miles
      "duration": 458400,      // Seconds
      "steps": [{
        "distance": 245.2,
        "duration": 17500,
        "geometry": "...",
        "name": "Via Malacca Strait",
        "mode": "maritime",
        "maneuver": {
          "type": "waypoint",
          "location": [103.8545, 1.2897]
        },
        "maritime": {
          "speedLimit": null,
          "trafficDensity": "HIGH",
          "weatherConditions": "GOOD",
          "piracyRisk": "LOW"
        }
      }],
      "summary": "Singapore to Tokyo via Malacca and Luzon Straits",
      "weight": 6420.5
    }],
    "distance": 6420.5,
    "duration": 458400,
    "weight_name": "distance",
    "weight": 6420.5,
    "confidence": 0.92,

    // Maritime-specific
    "maritime_info": {
      "via_points": ["Malacca Strait", "Luzon Strait"],
      "eca_zones_crossed": ["Singapore ECA"],
      "estimated_fuel_mt": 420.5,
      "based_on_voyages": 1245,
      "seasonal_variant": "NORTHEAST_MONSOON",
      "alternative_routes_available": 2
    }
  }],
  "waypoints": [{
    "name": "Port of Singapore",
    "location": [103.8545, 1.2897],
    "hint": "..."
  }, {
    "name": "Port of Tokyo",
    "location": [139.6917, 35.6895],
    "hint": "..."
  }]
}
```

---

## 🚀 Phase 4: Advanced Features (Weeks 13-16)

### 4.1 Weather Routing Integration

**Current:** Basic weather awareness
**Upgrade:** Full weather optimization

```typescript
class WeatherAwareRouter {
  async optimizeForWeather(route: MaritimeRoute, departure: Date): Promise<MaritimeRoute> {
    // 1. Get weather forecast for route duration
    const forecast = await weatherService.getForecast(
      route.waypoints,
      departure,
      route.estimatedDuration
    );

    // 2. Identify problematic weather zones
    const hazards = forecast.filter(f =>
      f.waveHeight > 5 ||  // >5m waves
      f.windSpeed > 45 ||  // >45 knots wind
      f.visibility < 1000  // <1km visibility
    );

    // 3. Re-route around hazards
    if (hazards.length > 0) {
      return this.rerouteAroundWeather(route, hazards);
    }

    return route;
  }
}
```

### 4.2 Real-Time Fleet Intelligence

**Already built!** (`fleet-collaborative-learner.ts`)
**Enhancement:** Expose via API

```typescript
// GET /route/v1/container/103.8545,1.2897;139.6917,35.6895?fleet=true
{
  "route": { ... },
  "fleet_intelligence": {
    "active_vessels_on_route": 12,
    "vessels_ahead": 7,
    "vessels_behind": 5,
    "fleet_avg_speed": 14.2,
    "real_time_conditions": {
      "traffic_level": "MODERATE",
      "weather_conditions": "GOOD",
      "current_delays": []
    },
    "eta_confidence": 0.94,  // Higher with fleet data!
    "last_updated": "2026-02-06T10:00:00Z"
  }
}
```

### 4.3 Machine Learning Enhancements

```typescript
class MLRouteOptimizer {
  /**
   * Predict best route using ML model trained on:
   * - Historical voyage performance
   * - Weather patterns
   * - Seasonal variations
   * - Fuel consumption
   * - Port congestion
   */
  async predictOptimalRoute(request: RouteRequest): Promise<MLPrediction> {
    const features = this.extractFeatures(request);
    const prediction = await this.model.predict(features);

    return {
      recommendedRoute: prediction.route,
      estimatedFuelSaving: prediction.fuelSavingMt,
      estimatedTimeSaving: prediction.timeSavingHours,
      confidence: prediction.confidence,
      reasoning: prediction.explanation
    };
  }

  private extractFeatures(request: RouteRequest) {
    return {
      distance: haversineDistance(...),
      vesselType: oneHotEncode(request.vesselType),
      season: getCurrentSeason(),
      weatherForecast: await getWeatherFeatures(),
      historicalPerformance: await getHistoricalFeatures(),
      portCongestion: await getPortCongestionFeatures(),
      fuelPrices: await getFuelPriceFeatures()
    };
  }
}
```

---

## 🌐 Phase 5: Open Source Release (Weeks 17-20)

### 5.1 OSS Package Structure

```
mari8xosrm/
├── core/
│   ├── graph/              # Maritime graph construction
│   ├── routing/            # A* and routing algorithms
│   ├── learning/           # ML and training
│   └── api/                # HTTP API server
├── data/
│   ├── extractors/         # AIS data extraction
│   ├── trainers/           # Model training
│   └── loaders/            # Data loading utilities
├── clients/
│   ├── javascript/         # JS/TS client
│   ├── python/             # Python client
│   └── go/                 # Go client
├── examples/
│   ├── basic-routing/
│   ├── fleet-tracking/
│   └── weather-optimization/
├── docs/
│   ├── api-reference.md
│   ├── training-guide.md
│   └── deployment.md
└── datasets/
    ├── sample-ais-data/    # Anonymized AIS samples
    ├── port-locations/     # 12,714 ports
    └── trained-models/     # Pre-trained routing models
```

### 5.2 Training Data Package

```typescript
/**
 * Provide anonymized, aggregated AIS data for community training
 */
interface TrainingDataset {
  // Anonymized vessel tracks
  routes: AnonymizedRoute[];

  // Port-to-port aggregates
  portPairs: PortPairStatistics[];

  // Common waypoints
  waypoints: DiscoveredWaypoint[];

  // Graph structure
  maritimeGraph: {
    nodes: MaritimeNode[];
    edges: MaritimeEdge[];
  };

  metadata: {
    dateRange: [Date, Date];
    vesselCount: number;
    positionCount: number;
    portCount: number;
    coverage: string;  // "Global" or specific regions
  };
}
```

### 5.3 Pre-trained Models

Ship with ready-to-use models:
- ✅ **Global routing model** (all oceans)
- ✅ **Regional models** (Asia-Pacific, Atlantic, etc.)
- ✅ **Vessel-specific models** (container, tanker, bulk)
- ✅ **Distance prediction model** (charterer-grade accuracy)

---

## 📊 Accuracy Targets

### Distance Accuracy
- **Current:** Haversine (great circle) - can be 10-30% off
- **Target Phase 1:** ±5% error (good enough for most uses)
- **Target Phase 2:** ±2% error (charterer-grade)
- **Target Phase 3:** ±1% error (OSRM-level accuracy)

### ETA Prediction
- **Current:** Simple distance/speed - 10-20% error
- **Target Phase 1:** ±8% error (with historical data)
- **Target Phase 2:** ±5% error (with fleet intelligence)
- **Target Phase 3:** ±3% error (with weather + ML)

### Coverage
- **Current:** 12,714 ports, 46M+ positions
- **Target Phase 1:** Top 500 port pairs (80% of traffic)
- **Target Phase 2:** Top 5,000 port pairs (95% of traffic)
- **Target Phase 3:** All 12,714 ports (100% coverage)

---

## 🎯 Use Cases for Chartering

### 1. Freight Rate Quotes
```typescript
// Charterer needs freight rate for Rotterdam -> Shanghai
const route = await oceanRouter.route({
  from: 'NLRTM',
  to: 'CNSHA',
  vessel: 'container',
  draft: 12.5
});

// Accurate distance = accurate freight quote
const freightRate = route.distance * ratePerNm;
```

### 2. Bunker Planning
```typescript
const route = await oceanRouter.route({
  from: 'SGSIN',
  to: 'USHOU',
  optimize: 'fuel'
});

// Know exactly how much fuel needed
console.log(`Estimated fuel: ${route.fuelEstimateMt} MT`);
```

### 3. Voyage Comparison
```typescript
// Compare Suez vs Cape of Good Hope
const viaSuez = await oceanRouter.route({
  from: 'NLRTM',
  to: 'CNSHA',
  via: ['Suez Canal']
});

const viaCape = await oceanRouter.route({
  from: 'NLRTM',
  to: 'CNSHA',
  via: ['Cape of Good Hope']
});

// Make data-driven decision
const savings = viaSuez.duration - viaCape.duration;
const costDiff = viaSuez.cost - viaCape.cost;
```

### 4. Fleet Optimization
```typescript
// Find best vessel-route-cargo combination
const optimization = await fleetOptimizer.optimize({
  cargos: availableCargos,
  vessels: availableVessels,
  constraints: {
    maxDetourNm: 500,
    minUtilization: 0.85
  }
});
```

---

## 🔧 Technical Implementation

### Database Schema Additions

```prisma
// Port-to-port trained distances
model PortPairDistance {
  id                String   @id @default(cuid())
  originPortId      String
  destPortId        String
  vesselType        String

  // Learned from AIS
  greatCircleNm     Float
  actualSailedNm    Float
  distanceFactor    Float    // actual / great_circle

  // Common route info
  viaPoints         String[] // ["Suez", "Malacca"]
  routeType         String   // DIRECT, VIA_CANAL, COASTAL

  // Training metrics
  sampleSize        Int
  confidence        Float
  lastTrainedAt     DateTime

  // Seasonal variants
  summerDistanceNm  Float?
  winterDistanceNm  Float?

  @@unique([originPortId, destPortId, vesselType])
  @@index([originPortId, destPortId])
}

// Maritime graph nodes
model MaritimeGraphNode {
  id                String   @id @default(cuid())
  nodeType          String   // PORT, WAYPOINT, CANAL, STRAIT
  lat               Float
  lng               Float
  name              String?

  // Constraints
  minDraft          Float?
  maxLOA            Float?
  maxBeam           Float?
  speedLimit        Float?

  // Edges
  outgoingEdges     MaritimeGraphEdge[] @relation("FromNode")
  incomingEdges     MaritimeGraphEdge[] @relation("ToNode")

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// Maritime graph edges
model MaritimeGraphEdge {
  id                String   @id @default(cuid())
  fromNodeId        String
  toNodeId          String

  fromNode          MaritimeGraphNode @relation("FromNode", fields: [fromNodeId], references: [id])
  toNode            MaritimeGraphNode @relation("ToNode", fields: [toNodeId], references: [id])

  // Edge properties
  distanceNm        Float
  typicalSpeedKnots Float
  typicalDurationHours Float

  // Traffic and conditions
  trafficDensity    String   // LOW, MEDIUM, HIGH
  weatherExposure   String
  piracyRisk        String

  // Costs
  fuelCostFactor    Float
  timeCostFactor    Float
  riskFactor        Float

  // Learning
  observedVoyages   Int
  confidence        Float

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([fromNodeId, toNodeId])
  @@index([fromNodeId])
  @@index([toNodeId])
}
```

---

## 🚢 Training Pipeline

```typescript
/**
 * Automated training pipeline
 * Run nightly to improve routing accuracy
 */
class OceanRoutingTrainingPipeline {
  async run() {
    console.log('🚀 Starting Ocean Routing training pipeline');

    // Step 1: Extract new AIS routes
    console.log('Step 1: Extracting AIS routes...');
    const newRoutes = await aisExtractor.extractRoutes({
      since: lastTrainingDate,
      minQuality: 0.7
    });
    console.log(`  ✅ Extracted ${newRoutes.length} routes`);

    // Step 2: Train port-to-port distances
    console.log('Step 2: Training distances...');
    await distanceTrainer.train(newRoutes);
    console.log(`  ✅ Updated distances for ${newRoutes.length} port pairs`);

    // Step 3: Update maritime graph
    console.log('Step 3: Updating maritime graph...');
    await graphBuilder.update(newRoutes);
    console.log(`  ✅ Graph updated`);

    // Step 4: Train ML models
    console.log('Step 4: Training ML models...');
    await mlTrainer.train();
    console.log(`  ✅ Models trained`);

    // Step 5: Validate accuracy
    console.log('Step 5: Validating accuracy...');
    const validation = await validator.validate();
    console.log(`  ✅ Accuracy: ${validation.accuracy}%, Error: ±${validation.error}%`);

    // Step 6: Export for OSS
    console.log('Step 6: Exporting OSS package...');
    await ossExporter.export();
    console.log(`  ✅ OSS package ready`);

    console.log('✅ Training pipeline complete!');
  }
}
```

---

## 🌟 Competitive Advantages

### vs Existing Solutions

**Sea-distances.org:**
- ❌ Static, pre-calculated distances
- ❌ No real-time updates
- ❌ Limited route options
- ❌ No API
- ✅ Mari8X: Live AIS data, 46M+ positions, API-first

**Commercial Routing Software:**
- ❌ Expensive ($$$$)
- ❌ Closed source
- ❌ Limited vessel types
- ❌ No fleet intelligence
- ✅ Mari8X: Open source, all vessel types, fleet collaboration

**OSRM (for roads):**
- ❌ Not designed for maritime
- ❌ No ocean-specific features
- ❌ No vessel constraints
- ✅ Mari8X: Built for ocean routing from day 1

---

## 📈 Success Metrics

### Technical
- ✅ Distance accuracy: ±1%
- ✅ ETA accuracy: ±3%
- ✅ API latency: <100ms
- ✅ Coverage: 12,714 ports
- ✅ Graph size: 50K+ nodes, 500K+ edges

### Adoption
- ✅ 1,000+ users in first year
- ✅ 1M+ API calls/month
- ✅ 100+ GitHub stars
- ✅ 10+ contributors
- ✅ Integration with major chartering platforms

### Business Impact
- ✅ 20% reduction in voyage planning time
- ✅ 5% fuel savings from optimal routing
- ✅ 90% accuracy in freight rate quotes
- ✅ Become the "Google Maps of the ocean"

---

## 🎯 Next Steps

### Immediate (This Week)
1. ✅ Review existing routing code
2. ✅ Brainstorm OSS architecture (this document!)
3. ⏳ Design distance training algorithm
4. ⏳ Set up training pipeline

### Short Term (Month 1)
1. Build AIS route extractor
2. Train on 46M+ positions
3. Achieve ±5% distance accuracy
4. Create maritime graph (top 500 port pairs)

### Medium Term (Months 2-3)
1. Implement A* routing
2. Add weather routing
3. Build REST API
4. Achieve ±2% distance accuracy

### Long Term (Months 4-6)
1. OSS release
2. Community building
3. Integration with chartering platforms
4. Become industry standard

---

## 💡 Key Insights

### From Your Existing Code

1. **You already have the data** - 46M+ AIS positions is gold!
2. **Learning systems work** - Historical route analyzer proves it
3. **Fleet intelligence is unique** - No one else does real-time fleet learning
4. **Graph structure is ready** - Just needs AIS-based training

### What Makes This Special

1. **Real data beats algorithms** - Your 46M positions > any pathfinding
2. **Continuous learning** - Gets better every day automatically
3. **Fleet collaboration** - Living routes from active vessels
4. **Open source** - Community makes it better

### Why This Wins

1. **Accuracy** - AIS-trained distances are charterer-grade
2. **Coverage** - 12,714 ports vs competitors' hundreds
3. **Intelligence** - Fleet learning + ML optimization
4. **Access** - Open source vs $$$ commercial software
5. **Modern** - API-first, cloud-native, scalable

---

## 🚀 Let's Build It!

**You have everything you need:**
- ✅ 46M+ AIS positions
- ✅ 12,714 ports
- ✅ Working ML systems
- ✅ Fleet intelligence
- ✅ Auto-learning pipeline

**Just need to:**
1. Train on your data
2. Build the graph
3. Create the API
4. Release as OSS

**Result:** The world's first open-source, AIS-trained, fleet-intelligent ocean routing engine! 🌊

---

**Let's make chartering data-driven and open!** 🚢📊
