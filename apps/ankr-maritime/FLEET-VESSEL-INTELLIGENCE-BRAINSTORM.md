# Fleet Intelligence & Vessel Intelligence - Brainstorming

**Date**: February 2, 2026
**Purpose**: Explore intelligence features for owners/operators/ship management companies
**Data Available**: 3.9M+ AIS positions | 14,071 vessels | Real-time tracking

---

## 🚢 Fleet Intelligence

### Core Concept
**Dashboard for vessel owners/operators/ship management companies** showing:
- Fleet-wide analytics by ownership structure
- Comparative performance metrics
- Cost optimization opportunities
- Risk assessment

---

### 1. Fleet by Ownership Structure

#### A. Owner Intelligence
**Show all vessels owned by a company**

```
┌─────────────────────────────────────────────────┐
│ MAERSK LINE A/S                                 │
├─────────────────────────────────────────────────┤
│ Owned Vessels: 742                              │
│ Total DWT: 4,823,567 tonnes                     │
│ Average Age: 8.4 years                          │
│                                                  │
│ Fleet Status (Real-time):                       │
│  • At sea: 687 vessels (92.6%)                  │
│  • In port: 45 vessels (6.1%)                   │
│  • At anchor: 10 vessels (1.3%)                 │
│                                                  │
│ Fleet Distribution:                             │
│  • Container: 520 vessels                       │
│  • Tanker: 150 vessels                          │
│  • Bulk: 72 vessels                             │
│                                                  │
│ Geographic Heat Map:                            │
│  [Interactive map showing vessel clusters]      │
└─────────────────────────────────────────────────┘
```

**Data Sources**:
- `Vessel.owner` (company name)
- `VesselOwnership` table (beneficial owner, registered owner)
- IMO GISIS data (ownership verification)
- Real-time AIS positions

**Queries**:
```graphql
query FleetByOwner {
  ownerIntelligence(ownerName: "MAERSK LINE A/S") {
    totalVessels
    totalDWT
    averageAge
    fleetStatus {
      atSea
      inPort
      atAnchor
    }
    vessels {
      id
      name
      imo
      type
      dwt
      currentPosition {
        latitude
        longitude
        navigationStatus
        speed
      }
    }
  }
}
```

---

#### B. Operator Intelligence
**Show all vessels operated by a company (may differ from owner)**

```
┌─────────────────────────────────────────────────┐
│ V.SHIPS (Ship Management)                       │
├─────────────────────────────────────────────────┤
│ Operated Vessels: 1,250                         │
│ Client Owners: 48 companies                     │
│                                                  │
│ Performance Metrics:                            │
│  • Average speed efficiency: 94.2%              │
│  • On-time arrival rate: 89.5%                  │
│  • Fuel efficiency index: 0.87                  │
│  • Carbon intensity (CII): A rating - 320 vessels│
│                            B rating - 540 vessels│
│                            C rating - 390 vessels│
│                                                  │
│ Incidents (Last 12 months):                     │
│  • Port state detentions: 3                     │
│  • Groundings: 0                                │
│  • Collisions: 1                                │
│  • Environmental incidents: 0                   │
└─────────────────────────────────────────────────┘
```

**Data Sources**:
- `Vessel.operator` (operating company)
- `VesselOwnership.operator`
- Performance data from voyages
- Incident reports

---

#### C. Ship Management Company Intelligence
**3rd-party technical management**

```
┌─────────────────────────────────────────────────┐
│ ANGLO-EASTERN (Technical Manager)               │
├─────────────────────────────────────────────────┤
│ Managed Vessels: 680                            │
│                                                  │
│ Technical Performance:                          │
│  • Inspection score avg: 97.2%                  │
│  • Certificate compliance: 99.8%                │
│  • Dry dock on-time rate: 94%                   │
│  • Crew retention rate: 87%                     │
│                                                  │
│ Cost Analysis:                                  │
│  • Avg opex/day: $8,240                         │
│  • Maintenance cost trend: ↓ 3.2%               │
│  • Insurance claims: 2 (vs industry avg 4.5)    │
│                                                  │
│ Vessel Age Distribution:                        │
│  [Chart: 0-5yr: 120, 5-10yr: 280, >10yr: 280]  │
└─────────────────────────────────────────────────┘
```

---

### 2. Comparative Analytics

#### Fleet Performance Benchmarking

```
┌─────────────────────────────────────────────────┐
│ Fleet Performance vs Industry                   │
├─────────────────────────────────────────────────┤
│                                                  │
│ Speed Efficiency:                               │
│  Your Fleet: ████████████████░░ 92%             │
│  Industry:   ████████████░░░░░░ 87%    ✅ +5%   │
│                                                  │
│ Fuel Consumption (kg/NM):                       │
│  Your Fleet: ████████████░░░░░░ 3.2             │
│  Industry:   ████████████████░░ 3.8    ✅ -16%  │
│                                                  │
│ Port Turnaround Time:                           │
│  Your Fleet: ████████████████████░ 2.1 days     │
│  Industry:   ████████████████░░░░░ 2.4 days ✅  │
│                                                  │
│ CII Rating Distribution:                        │
│  Your Fleet: A:45%, B:38%, C:15%, D:2%  ✅      │
│  Industry:   A:32%, B:41%, C:21%, D:6%          │
└─────────────────────────────────────────────────┘
```

**Implementation**:
```typescript
interface FleetBenchmark {
  metric: string;
  yourFleet: number;
  industryAvg: number;
  percentile: number; // Your fleet's percentile ranking
  trend: 'improving' | 'stable' | 'declining';
}

async function benchmarkFleet(ownerId: string): Promise<FleetBenchmark[]> {
  // Compare fleet metrics against industry averages
  const fleetMetrics = await calculateFleetMetrics(ownerId);
  const industryMetrics = await getIndustryBenchmarks();

  return [
    {
      metric: 'Speed Efficiency',
      yourFleet: fleetMetrics.speedEfficiency,
      industryAvg: industryMetrics.speedEfficiency,
      percentile: 78, // Top 22% of industry
      trend: 'improving'
    },
    // ... more metrics
  ];
}
```

---

### 3. Fleet Heat Map / Geographic Distribution

```
┌─────────────────────────────────────────────────┐
│ Fleet Geographic Distribution                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  [Interactive World Map]                        │
│                                                  │
│  🔵 North Atlantic: 142 vessels                 │
│  🔵 Mediterranean: 87 vessels                   │
│  🔵 Indian Ocean: 203 vessels                   │
│  🔵 South China Sea: 245 vessels (High density!)│
│  🔵 Pacific: 165 vessels                        │
│                                                  │
│  Click region for detailed view →               │
│                                                  │
│  Filters:                                       │
│  ☑ Show vessel types                            │
│  ☑ Show navigation status                       │
│  ☑ Show speed heatmap                           │
│  ☐ Show routes                                  │
└─────────────────────────────────────────────────┘
```

**Features**:
- Real-time vessel clustering
- Color-coded by:
  - Vessel type
  - Navigation status
  - Speed
  - Age
  - Performance rating
- Click vessel → Detailed information popup
- Time-lapse showing fleet movement over last 7 days

**Technology**:
- Mapbox GL JS / Leaflet
- Real-time WebSocket updates
- Clustering algorithm for dense areas

---

### 4. Fleet Utilization Analysis

```
┌─────────────────────────────────────────────────┐
│ Fleet Utilization (Last 30 Days)                │
├─────────────────────────────────────────────────┤
│                                                  │
│ Days at Sea vs Days in Port:                    │
│                                                  │
│  MV ALPHA:    ████████████████████░░ 23.5 days  │
│  MV BETA:     ████████████████░░░░░░ 19.2 days  │
│  MV GAMMA:    ██████████████████████ 26.8 days ✅│
│  MV DELTA:    ████████░░░░░░░░░░░░░░ 11.4 days ⚠│
│                                                  │
│ Underutilized Vessels (< 50% sea time):         │
│  • MV DELTA: 38% (12 days in port)              │
│  • MV ZETA: 42% (13 days at anchor)             │
│                                                  │
│ 💡 Optimization Opportunity: $124K/month        │
│    Reposition DELTA to high-demand route        │
└─────────────────────────────────────────────────┘
```

**Calculation**:
```typescript
async function calculateUtilization(vesselId: string, days: number) {
  const positions = await prisma.vesselPosition.findMany({
    where: {
      vesselId,
      timestamp: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
    },
    orderBy: { timestamp: 'asc' }
  });

  let daysAtSea = 0;
  let daysInPort = 0;
  let daysAtAnchor = 0;

  for (const pos of positions) {
    if (pos.navigationStatus === 0) daysAtSea++; // Underway
    if (pos.navigationStatus === 5) daysInPort++; // Moored
    if (pos.navigationStatus === 1) daysAtAnchor++; // At anchor
  }

  return {
    utilizationRate: (daysAtSea / days) * 100,
    daysAtSea,
    daysInPort,
    daysAtAnchor,
    recommendation: daysAtSea < days * 0.5 ? 'Underutilized - consider redeployment' : 'Normal'
  };
}
```

---

## 🔍 Vessel Intelligence

### Core Concept
**Individual vessel tracking with comprehensive situational awareness**
- Real-time position tracking
- Vessels in vicinity (collision avoidance)
- Route history and prediction
- Environmental conditions
- Performance metrics

---

### 1. Real-time Vessel Tracking

```
┌─────────────────────────────────────────────────┐
│ MV EVER GIVEN (IMO: 9811000)                    │
├─────────────────────────────────────────────────┤
│                                                  │
│ Current Position: 31.4532°N, 32.5834°E          │
│ Location: Suez Canal (Great Bitter Lake)        │
│                                                  │
│ Real-time Data (Updated: 2 sec ago):            │
│  • Speed: 8.2 knots                             │
│  • Course: 187° (S)                             │
│  • Heading: 185°                                │
│  • Draught: 15.7m                               │
│  • Rate of Turn: +2.3°/min (turning starboard)  │
│  • Navigation Status: Underway using engine     │
│                                                  │
│ Vessel Characteristics:                         │
│  • Length: 400m (Bow: 225m, Stern: 175m)        │
│  • Width: 59m (Port: 29m, Starboard: 30m)       │
│  • Type: Container Ship (Megamax-24 class)      │
│                                                  │
│ [Live Map showing vessel icon with heading]     │
└─────────────────────────────────────────────────┘
```

**Data Sources**:
- Real-time AIS (AISstream WebSocket)
- Priority 1 fields (rate of turn, draught, dimensions)
- Reverse geocoding (location name)

---

### 2. Vessels in Vicinity

```
┌─────────────────────────────────────────────────┐
│ Vessels Within 10 NM                            │
├─────────────────────────────────────────────────┤
│                                                  │
│ 🚢 14 vessels detected                          │
│                                                  │
│ ⚠️  COLLISION RISKS:                             │
│  • MV COSCO SHANGHAI                            │
│    Distance: 1.2 NM | CPA: 0.3 NM | TCPA: 8 min│
│    Speed: 14.2 knots | Course: 192°             │
│    ⚠️  Recommend: Reduce speed, monitor closely  │
│                                                  │
│ NEARBY VESSELS:                                 │
│                                                  │
│  1. MV MAERSK ESSEX (2.3 NM, 045°)              │
│     Container | 15.2 knots | Overtaking aft     │
│                                                  │
│  2. MT NORDIC AURORA (3.8 NM, 127°)             │
│     Tanker | 10.1 knots | Crossing port side    │
│                                                  │
│  3. SUEZ PILOT BOAT 12 (0.5 NM, 358°)           │
│     Pilot Vessel | 22.4 knots | Approaching bow │
│                                                  │
│ [Radar-style circular map showing all vessels]  │
└─────────────────────────────────────────────────┘
```

**Implementation**:
```typescript
interface VesselProximity {
  vessel: Vessel;
  distance: number; // Nautical miles
  bearing: number; // Degrees (0-360)
  cpa: number; // Closest Point of Approach (NM)
  tcpa: number; // Time to CPA (minutes)
  riskLevel: 'critical' | 'warning' | 'safe';
  relativeMotion: 'overtaking' | 'crossing' | 'head-on' | 'diverging';
}

async function getVesselsInVicinity(
  vesselId: string,
  radiusNM: number = 10
): Promise<VesselProximity[]> {
  // Get current vessel position
  const myPosition = await prisma.vesselPosition.findFirst({
    where: { vesselId },
    orderBy: { timestamp: 'desc' }
  });

  if (!myPosition) return [];

  // PostGIS query: Find vessels within radius
  const nearbyVessels = await prisma.$queryRaw`
    SELECT v.*, vp.*,
           ST_Distance(
             ST_Point(${myPosition.longitude}, ${myPosition.latitude})::geography,
             ST_Point(vp.longitude, vp.latitude)::geography
           ) / 1852 AS distance_nm
    FROM vessels v
    JOIN vessel_positions vp ON v.id = vp."vesselId"
    WHERE vp.timestamp > NOW() - INTERVAL '10 minutes'
      AND v.id != ${vesselId}
      AND ST_DWithin(
        ST_Point(vp.longitude, vp.latitude)::geography,
        ST_Point(${myPosition.longitude}, ${myPosition.latitude})::geography,
        ${radiusNM * 1852}
      )
    ORDER BY distance_nm ASC
  `;

  // Calculate CPA (Closest Point of Approach) and TCPA
  return nearbyVessels.map(v => {
    const { cpa, tcpa } = calculateCPA(
      myPosition,
      v,
      myPosition.speed || 0,
      myPosition.course || 0,
      v.speed || 0,
      v.course || 0
    );

    return {
      vessel: v,
      distance: v.distance_nm,
      bearing: calculateBearing(myPosition, v),
      cpa,
      tcpa,
      riskLevel: cpa < 0.5 ? 'critical' : cpa < 2 ? 'warning' : 'safe',
      relativeMotion: determineRelativeMotion(myPosition, v)
    };
  });
}

function calculateCPA(pos1, pos2, speed1, course1, speed2, course2) {
  // Vector math for collision prediction
  // Returns: { cpa: distance in NM, tcpa: time in minutes }
  // ... implementation
}
```

---

### 3. Route History & Prediction

```
┌─────────────────────────────────────────────────┐
│ Route Analysis - Last 7 Days                    │
├─────────────────────────────────────────────────┤
│                                                  │
│ [Map showing vessel track with waypoints]       │
│                                                  │
│ Departed: Singapore (SGSIN) - Jan 26, 14:30     │
│ Arrived:  Port Said (EGPSD) - Feb 2, 08:15      │
│ Duration: 6 days 17 hours 45 minutes            │
│ Distance: 3,842 NM                              │
│ Avg Speed: 23.8 knots                           │
│                                                  │
│ Route Segments:                                 │
│  • Singapore → Colombo:   1,548 NM (2.7 days)   │
│  • Colombo → Aden:        1,382 NM (2.4 days)   │
│  • Aden → Suez:             912 NM (1.6 days)   │
│                                                  │
│ 🔮 Predicted Next Destination:                  │
│  • Rotterdam (NLRTM)                            │
│  • ETA: Feb 8, 16:00 (6.3 days)                 │
│  • Confidence: 94% (based on schedule pattern)  │
│                                                  │
│ [Speed profile graph showing variations]        │
└─────────────────────────────────────────────────┘
```

**Features**:
- Historical track playback (time-lapse)
- Speed variations analysis
- Port calls detection (auto-detected from speed < 3 knots)
- Route prediction using ML (destination, ETA)
- Weather impact analysis

---

### 4. Environmental Conditions

```
┌─────────────────────────────────────────────────┐
│ Environmental Conditions at Vessel Position     │
├─────────────────────────────────────────────────┤
│                                                  │
│ Weather (Current):                              │
│  • Temperature: 28°C                            │
│  • Wind: 15 knots from NE (045°)                │
│  • Sea State: 3 (Slight - 0.5-1.25m waves)      │
│  • Visibility: 8 NM (Good)                      │
│  • Barometric Pressure: 1013 hPa                │
│                                                  │
│ Forecast (Next 24h):                            │
│  • Wind increasing to 22 knots                  │
│  • Sea State 4 (Moderate - 1.25-2.5m)           │
│  ⚠️  Weather Advisory: Moderate seas expected    │
│                                                  │
│ Marine Zones:                                   │
│  ✅ NOT in ECA (Emission Control Area)          │
│  ✅ NOT in High Risk Area (piracy)              │
│  ✅ Safe depth: 50m (UKC: 34.3m)                │
│                                                  │
│ [Weather map overlay on vessel position]        │
└─────────────────────────────────────────────────┘
```

**Data Integration**:
- Weather API (OpenWeatherMap, Weather.gov)
- ECA zone database
- High-risk area database (piracy, war zones)
- Bathymetric data (sea depth)
- Calculate under-keel clearance (UKC = depth - draught)

---

### 5. Performance Metrics

```
┌─────────────────────────────────────────────────┐
│ Vessel Performance Metrics                      │
├─────────────────────────────────────────────────┤
│                                                  │
│ Efficiency (Last 30 Days):                      │
│  • Fuel consumption: 87.3 tonnes/day            │
│  • Speed/consumption ratio: 2.34 (Good)         │
│  • Carbon intensity: 4.2 gCO2/t-nm ✅           │
│  • CII Rating: B (Expected: A by next review)   │
│                                                  │
│ Operational:                                    │
│  • Days at sea: 23.5 (78.3%)                    │
│  • Port calls: 4                                │
│  • Avg port turnaround: 1.8 days                │
│  • Distance covered: 5,240 NM                   │
│                                                  │
│ Maintenance:                                    │
│  • Days since last dry dock: 342                │
│  • Next dry dock due: Apr 15, 2026 (73 days)    │
│  • Certificate expiry alerts: 2 pending         │
│  • Inspection score: 96% (Last PSC: Jan 12)     │
│                                                  │
│ [Performance trends graph over time]            │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Key Features Summary

### Fleet Intelligence
1. **Ownership Structure**
   - Owner dashboard
   - Operator dashboard
   - Ship management company dashboard

2. **Comparative Analytics**
   - Performance benchmarking
   - Industry comparisons
   - Trend analysis

3. **Geographic Distribution**
   - Heat maps
   - Clustering
   - Regional analysis

4. **Utilization Analysis**
   - Days at sea vs port
   - Underutilization detection
   - Optimization recommendations

### Vessel Intelligence
1. **Real-time Tracking**
   - Live position
   - Navigation dynamics
   - Vessel characteristics

2. **Proximity Awareness**
   - Vessels in vicinity (10 NM)
   - Collision risk calculation (CPA/TCPA)
   - Radar-style display

3. **Route Intelligence**
   - Historical tracks
   - Route prediction
   - Speed analysis

4. **Environmental Context**
   - Weather conditions
   - Marine zones (ECA, high-risk)
   - Under-keel clearance

5. **Performance Monitoring**
   - Efficiency metrics
   - Carbon intensity
   - Maintenance tracking

---

## 💻 Implementation Architecture

### Frontend Components

```typescript
// Fleet Intelligence Dashboard
<FleetDashboard>
  <OwnershipOverview />
  <FleetMap />           // Heat map with clustering
  <PerformanceBenchmark />
  <UtilizationChart />
  <FleetStatus />        // Real-time status breakdown
</FleetDashboard>

// Vessel Intelligence Dashboard
<VesselDashboard vesselId="...">
  <VesselHeader />       // Name, position, status
  <LiveMap />            // Vessel + vicinity
  <ProximityRadar />     // Nearby vessels
  <RouteHistory />       // Track playback
  <EnvironmentalInfo />  // Weather, zones
  <PerformanceMetrics /> // Efficiency data
</VesselDashboard>
```

---

### Backend GraphQL Schema

```graphql
# Fleet Intelligence
type FleetIntelligence {
  owner: String!
  totalVessels: Int!
  totalDWT: Float!
  averageAge: Float!
  fleetStatus: FleetStatus!
  vessels: [VesselSummary!]!
  performanceBenchmark: [Benchmark!]!
  geographicDistribution: [VesselCluster!]!
  utilizationAnalysis: [VesselUtilization!]!
}

# Vessel Intelligence
type VesselIntelligence {
  vessel: Vessel!
  currentPosition: VesselPosition!
  vesselsInVicinity(radiusNM: Float = 10): [VesselProximity!]!
  routeHistory(days: Int = 7): RouteHistory!
  environmentalConditions: EnvironmentalData!
  performanceMetrics(days: Int = 30): PerformanceMetrics!
}

# Queries
type Query {
  fleetIntelligence(ownerId: String!): FleetIntelligence!
  vesselIntelligence(vesselId: String!): VesselIntelligence!
  compareFleets(ownerIds: [String!]!): FleetComparison!
}
```

---

## 🚀 Implementation Timeline

### Week 1: Fleet Intelligence Core
- [ ] Owner/operator data model
- [ ] Fleet status aggregation
- [ ] Geographic clustering
- [ ] Basic dashboard

### Week 2: Vessel Intelligence Core
- [ ] Real-time tracking UI
- [ ] Proximity detection (CPA/TCPA)
- [ ] Route history playback
- [ ] Radar-style visualization

### Week 3: Advanced Features
- [ ] Performance benchmarking
- [ ] Weather integration
- [ ] ML-based route prediction
- [ ] Utilization optimization

### Week 4: Polish & Testing
- [ ] Interactive maps
- [ ] Real-time WebSocket updates
- [ ] Mobile responsive
- [ ] Performance optimization

---

## 💰 Business Value

### Fleet Intelligence
| Feature | Value to Customer | Revenue Potential |
|---------|-------------------|-------------------|
| Performance benchmarking | Identify underperforming vessels | $20K/year (premium feature) |
| Utilization optimization | Reduce idle time by 10-15% | $50K/year savings per customer |
| Fleet heat maps | Better deployment decisions | $15K/year (enterprise tier) |

### Vessel Intelligence
| Feature | Value to Customer | Revenue Potential |
|---------|-------------------|-------------------|
| Collision avoidance (CPA/TCPA) | Prevent accidents | $25K/year (safety premium) |
| Environmental awareness | Avoid ECA violations | $10K/year savings |
| Performance monitoring | Early maintenance detection | $30K/year savings |

**Total Annual Value per Customer**: $150K (savings + revenue)

---

## 🎯 Next Steps

1. **User Research**: Interview 3-5 ship owners/operators about priorities
2. **Design Mockups**: Create high-fidelity UI designs
3. **Database Schema**: Extend vessel ownership model
4. **API Development**: Build GraphQL resolvers
5. **Frontend Development**: React components
6. **Beta Testing**: Limited rollout to 2-3 customers

---

**Status**: 📝 **BRAINSTORMING COMPLETE**
**Ready for**: Design & user research phase
**Timeline**: 4 weeks to MVP
