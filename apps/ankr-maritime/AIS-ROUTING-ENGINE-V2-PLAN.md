# AIS-Based Routing Engine V2

**Date**: February 1, 2026
**Concept**: Mine AIS data to create intelligent, data-driven route planning

---

## 🎯 Vision

Learn from **millions of actual vessel movements** captured by AIS (Automatic Identification System) to:

1. Discover real shipping routes (not theoretical great circles)
2. Understand seasonal variations
3. Identify traffic patterns and congestion
4. Predict ETA with real-world accuracy
5. Recommend optimal routes based on vessel type, size, and season

**Key Insight**: Ships don't follow perfect great circle routes. They follow established shipping lanes, avoid weather, consider traffic separation schemes, and optimize for currents. AIS data captures all of this!

---

## 📡 What is AIS Data?

### AIS Message Types

**AIS (Automatic Identification System)** broadcasts from every vessel over 300 GT:

**Position Reports (Message Types 1, 2, 3)**:
- MMSI (unique vessel ID)
- Latitude, Longitude
- Speed over ground (SOG)
- Course over ground (COG)
- Heading
- Navigation status (underway, at anchor, moored)
- Timestamp

**Static Data (Message Type 5)**:
- Vessel name
- IMO number
- Call sign
- Vessel type (cargo, tanker, container, etc.)
- Dimensions (length, beam, draft)
- Destination port

**Broadcast Frequency**:
- Underway: Every 2-10 seconds
- At anchor: Every 3 minutes
- Static data: Every 6 minutes

---

## 🗄️ AIS Data Sources

### Free Sources

1. **AISHub** (https://www.aishub.net/)
   - Free API with registration
   - Historical data available
   - Limited to non-commercial use

2. **MarineTraffic Free API**
   - Limited free tier
   - 100 API calls/month

3. **OpenAIS** (Community project)
   - Open-source AIS data collection
   - Global coverage from volunteers

### Commercial Sources

4. **MarineTraffic Commercial**
   - Full historical AIS data
   - Global coverage
   - ~$500-$2000/month

5. **ORBCOMM / Spire Maritime**
   - Satellite AIS (global coverage including oceanic)
   - ~$5,000-$20,000/month

6. **Kpler, Windward, VesselsValue**
   - AIS + Intelligence
   - $10,000+/month

### Our Own AIS Receiver (DIY)

**Hardware**: RTL-SDR USB dongle + Antenna
- **Cost**: $50-100
- **Range**: 30-50 nautical miles
- **Setup**: Raspberry Pi + AIS decoder software
- **Benefit**: Free, continuous data for local ports

---

## 🏗️ Architecture: Routing Engine V2

### Data Pipeline

```
AIS Data Sources
      ↓
  AIS Collector Service (Real-time + Historical)
      ↓
  AIS Message Parser & Validator
      ↓
  Vessel Track Builder (Connect position reports)
      ↓
  Track Storage (PostGIS with vessel tracks)
      ↓
  Route Mining Engine (ML/Analytics)
      ↓
  Common Route Discovery
      ↓
  Route Database (Lanes, waypoints, statistics)
      ↓
  Routing API V2 (Given A→B, suggest optimal route)
      ↓
  Frontend Route Visualization
```

---

## 🗄️ Database Schema

### AIS Position Reports

```sql
CREATE TABLE ais_positions (
  id BIGSERIAL PRIMARY KEY,
  mmsi BIGINT NOT NULL,
  imo VARCHAR(10),
  timestamp TIMESTAMP NOT NULL,

  -- Position
  lat DECIMAL(10, 7) NOT NULL,
  lon DECIMAL(10, 7) NOT NULL,
  location GEOGRAPHY(POINT, 4326), -- PostGIS for spatial queries

  -- Movement
  sog DECIMAL(5, 2), -- Speed Over Ground (knots)
  cog DECIMAL(5, 2), -- Course Over Ground (degrees)
  heading INT, -- 0-359 degrees
  nav_status VARCHAR(50), -- underway, at anchor, moored, etc.

  -- Metadata
  message_type INT,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Indexes
  CONSTRAINT valid_location CHECK (ST_Covers(ST_MakeEnvelope(-180, -90, 180, 90, 4326)::geography, location))
);

CREATE INDEX idx_ais_positions_mmsi ON ais_positions(mmsi);
CREATE INDEX idx_ais_positions_timestamp ON ais_positions(timestamp);
CREATE INDEX idx_ais_positions_location ON ais_positions USING GIST(location);
CREATE INDEX idx_ais_positions_mmsi_timestamp ON ais_positions(mmsi, timestamp DESC);
```

### Vessel Tracks (Simplified from AIS)

```sql
CREATE TABLE vessel_tracks (
  id BIGSERIAL PRIMARY KEY,
  mmsi BIGINT NOT NULL,
  imo VARCHAR(10),
  vessel_name VARCHAR(200),
  vessel_type VARCHAR(50),

  -- Journey
  departure_port VARCHAR(10), -- UNLOCODE
  arrival_port VARCHAR(10), -- UNLOCODE
  departed_at TIMESTAMP,
  arrived_at TIMESTAMP,
  duration_hours DECIMAL(8, 2),

  -- Track geometry (LineString of positions)
  track GEOGRAPHY(LINESTRING, 4326),
  distance_nm DECIMAL(10, 2), -- Nautical miles
  avg_speed DECIMAL(5, 2), -- knots

  -- Weather conditions (averaged)
  avg_wave_height DECIMAL(4, 2),
  avg_wind_speed DECIMAL(5, 2),

  -- Statistics
  position_count INT, -- Number of AIS positions in track
  data_quality DECIMAL(3, 2), -- 0-1 (1 = complete track, no gaps)

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vessel_tracks_mmsi ON vessel_tracks(mmsi);
CREATE INDEX idx_vessel_tracks_route ON vessel_tracks(departure_port, arrival_port);
CREATE INDEX idx_vessel_tracks_track ON vessel_tracks USING GIST(track);
CREATE INDEX idx_vessel_tracks_departed ON vessel_tracks(departed_at DESC);
```

### Common Routes (Discovered from AIS)

```sql
CREATE TABLE discovered_routes (
  id SERIAL PRIMARY KEY,
  route_code VARCHAR(20) UNIQUE, -- e.g., "INMUN-SGSIN-001"

  -- Route endpoints
  origin_unlocode VARCHAR(10),
  destination_unlocode VARCHAR(10),

  -- Route geometry (typical path)
  centerline GEOGRAPHY(LINESTRING, 4326),
  corridor_width DECIMAL(6, 2), -- Nautical miles (95% of vessels within this)

  -- Waypoints (key turning points)
  waypoints JSONB, -- [{lat, lon, name}, ...]

  -- Statistics (from historical tracks)
  total_transits INT, -- How many ships used this route
  avg_distance_nm DECIMAL(10, 2),
  avg_duration_hours DECIMAL(8, 2),
  avg_speed DECIMAL(5, 2),
  min_duration_hours DECIMAL(8, 2),
  max_duration_hours DECIMAL(8, 2),

  -- Vessel type suitability
  suitable_for JSONB, -- ["container", "bulk", "tanker"]
  min_vessel_size INT, -- DWT
  max_vessel_size INT,

  -- Seasonal variations
  best_season VARCHAR(20), -- summer, winter, monsoon
  seasonal_stats JSONB, -- Statistics by season

  -- Traffic density
  traffic_density VARCHAR(20), -- high, medium, low
  congestion_points JSONB, -- [{lat, lon, description}]

  -- Metadata
  last_updated TIMESTAMP DEFAULT NOW(),
  data_quality DECIMAL(3, 2)
);

CREATE INDEX idx_discovered_routes_origin_dest ON discovered_routes(origin_unlocode, destination_unlocode);
CREATE INDEX idx_discovered_routes_centerline ON discovered_routes USING GIST(centerline);
```

### Route Segments (Building blocks)

```sql
CREATE TABLE route_segments (
  id SERIAL PRIMARY KEY,
  segment_code VARCHAR(30) UNIQUE,

  -- Segment geometry
  start_lat DECIMAL(10, 7),
  start_lon DECIMAL(10, 7),
  end_lat DECIMAL(10, 7),
  end_lon DECIMAL(10, 7),
  geometry GEOGRAPHY(LINESTRING, 4326),

  -- Segment characteristics
  segment_type VARCHAR(50), -- coastal, ocean, canal, strait, TSS (traffic separation)
  distance_nm DECIMAL(8, 2),
  avg_traffic INT, -- vessels/day

  -- Usage statistics
  total_transits INT,
  avg_speed DECIMAL(5, 2),

  -- Conditions
  weather_risk VARCHAR(20), -- low, medium, high
  piracy_risk VARCHAR(20),
  traffic_congestion VARCHAR(20),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_route_segments_geometry ON route_segments USING GIST(geometry);
```

---

## 🔍 Route Discovery Algorithm

### Phase 1: Track Clustering

**Goal**: Group similar vessel tracks into common routes

```python
# Pseudocode for route discovery

def discover_routes(origin, destination, vessel_type):
    # 1. Get all historical tracks for this route
    tracks = get_vessel_tracks(
        departure_port=origin,
        arrival_port=destination,
        vessel_type=vessel_type,
        min_data_quality=0.8  # Only high-quality tracks
    )

    # 2. Cluster tracks using DBSCAN or similar
    clusters = cluster_tracks(tracks, epsilon=5_nm, min_samples=10)

    # 3. For each cluster, compute centerline
    routes = []
    for cluster in clusters:
        centerline = compute_centerline(cluster.tracks)
        corridor_width = compute_corridor_width(cluster.tracks, percentile=95)
        waypoints = detect_waypoints(cluster.tracks)

        route = {
            'centerline': centerline,
            'corridor_width': corridor_width,
            'waypoints': waypoints,
            'total_transits': len(cluster.tracks),
            'statistics': compute_statistics(cluster.tracks)
        }
        routes.append(route)

    return routes
```

### Phase 2: Waypoint Detection

**Waypoints** are key turning points where most vessels change course:

```python
def detect_waypoints(tracks):
    # 1. For each position along tracks, compute course change
    course_changes = []
    for track in tracks:
        for i in range(1, len(track.positions) - 1):
            prev_cog = track.positions[i-1].cog
            curr_cog = track.positions[i].cog
            next_cog = track.positions[i+1].cog

            course_change = abs(next_cog - prev_cog)
            if course_change > 180:
                course_change = 360 - course_change

            if course_change > 15:  # Significant turn
                course_changes.append({
                    'location': track.positions[i].location,
                    'course_change': course_change
                })

    # 2. Cluster turning points
    waypoint_clusters = cluster_positions(course_changes, epsilon=2_nm)

    # 3. Each cluster center is a waypoint
    waypoints = [cluster.center for cluster in waypoint_clusters]

    return waypoints
```

### Phase 3: Route Optimization

Once routes are discovered, optimize them:

```python
def optimize_route(route, optimization_criteria):
    # Criteria: speed, fuel, weather, piracy, cost

    if optimization_criteria == 'speed':
        # Prefer routes with higher avg speeds
        score = route.avg_speed / route.avg_distance_nm

    elif optimization_criteria == 'fuel':
        # Prefer shorter routes + favorable currents
        score = route.distance_nm * route.fuel_efficiency

    elif optimization_criteria == 'safety':
        # Avoid high piracy risk areas
        score = -route.piracy_risk_score

    return score
```

---

## 🚀 Routing API V2

### Endpoint: Get Route Suggestions

```graphql
query GetRouteRecommendations {
  routeRecommendations(
    origin: "INMUN"
    destination: "SGSIN"
    vesselType: "container"
    vesselSize: 50000  # DWT
    optimization: "speed"  # or "fuel", "safety", "cost"
    departureDate: "2026-02-15"
  ) {
    routes {
      id
      routeCode
      distance
      estimatedDuration
      averageSpeed
      waypoints {
        lat
        lon
        name
      }
      centerline {
        type  # GeoJSON
        coordinates
      }
      statistics {
        totalTransits
        avgSpeed
        minDuration
        maxDuration
      }
      trafficDensity
      weatherRisk
      piracyRisk
      seasonalAdvice
    }
  }
}
```

### Response

```json
{
  "routes": [
    {
      "id": "R001",
      "routeCode": "INMUN-SGSIN-MAIN",
      "distance": 2847,
      "estimatedDuration": 6.2,
      "averageSpeed": 14.5,
      "waypoints": [
        { "lat": 18.9388, "lon": 72.8354, "name": "Mumbai Port" },
        { "lat": 12.5, "lon": 75.0, "name": "West of Lakshadweep" },
        { "lat": 6.0, "lon": 80.0, "name": "South of Sri Lanka" },
        { "lat": 1.2897, "lon": 103.8501, "name": "Singapore Strait" }
      ],
      "centerline": {
        "type": "LineString",
        "coordinates": [[72.8354, 18.9388], [75.0, 12.5], ... ]
      },
      "statistics": {
        "totalTransits": 1247,
        "avgSpeed": 14.5,
        "minDuration": 5.8,
        "maxDuration": 7.2
      },
      "trafficDensity": "high",
      "weatherRisk": "low",
      "piracyRisk": "low",
      "seasonalAdvice": "Optimal for Feb-Apr. Monsoon Jun-Sep may add 0.5 days."
    },
    {
      "id": "R002",
      "routeCode": "INMUN-SGSIN-ALT",
      "distance": 2901,
      "estimatedDuration": 6.4,
      "comment": "Alternative route avoiding congestion off Colombo"
    }
  ]
}
```

---

## 🧠 Machine Learning Enhancements

### ETA Prediction Model

Train ML model on historical tracks:

```python
# Features
features = [
    'distance_nm',
    'vessel_type',
    'vessel_dwt',
    'season',
    'avg_wave_height',
    'avg_wind_speed',
    'traffic_density',
    'port_congestion_origin',
    'port_congestion_destination'
]

# Target
target = 'actual_duration_hours'

# Model
from sklearn.ensemble import GradientBoostingRegressor

model = GradientBoostingRegressor(n_estimators=200)
model.fit(X_train[features], y_train[target])

# Predict
predicted_eta = model.predict(new_voyage_features)
```

### Route Clustering (Unsupervised Learning)

```python
from sklearn.cluster import DBSCAN
import numpy as np

# Convert tracks to point clouds
points = []
for track in tracks:
    for pos in track.positions:
        points.append([pos.lat, pos.lon])

points = np.array(points)

# Cluster using DBSCAN
clustering = DBSCAN(eps=0.05, min_samples=50).fit(points)

# Each cluster represents a common lane
```

---

## 📊 Analytics & Insights

### Traffic Heatmaps

**Query**: Where are the busiest shipping lanes?

```sql
-- Count vessels passing through each 0.1° grid cell
SELECT
  FLOOR(lat / 0.1) * 0.1 as grid_lat,
  FLOOR(lon / 0.1) * 0.1 as grid_lon,
  COUNT(DISTINCT mmsi) as vessel_count,
  AVG(sog) as avg_speed
FROM ais_positions
WHERE timestamp > NOW() - INTERVAL '30 days'
  AND sog > 1  -- Only moving vessels
GROUP BY grid_lat, grid_lon
HAVING COUNT(DISTINCT mmsi) > 100
ORDER BY vessel_count DESC;
```

### Seasonal Variations

```sql
-- Compare route durations by season
SELECT
  departure_port,
  arrival_port,
  CASE
    WHEN EXTRACT(MONTH FROM departed_at) IN (12, 1, 2) THEN 'Winter'
    WHEN EXTRACT(MONTH FROM departed_at) IN (3, 4, 5) THEN 'Spring'
    WHEN EXTRACT(MONTH FROM departed_at) IN (6, 7, 8) THEN 'Summer'
    ELSE 'Fall'
  END as season,
  AVG(duration_hours) as avg_duration,
  MIN(duration_hours) as min_duration,
  MAX(duration_hours) as max_duration,
  COUNT(*) as voyage_count
FROM vessel_tracks
WHERE data_quality > 0.8
GROUP BY departure_port, arrival_port, season
ORDER BY departure_port, arrival_port, season;
```

### Port Congestion Detection

```sql
-- Detect anchorage congestion (vessels waiting outside port)
SELECT
  DATE(timestamp) as date,
  COUNT(DISTINCT mmsi) as vessels_at_anchor
FROM ais_positions
WHERE ST_Distance(
  location,
  ST_Point(72.85, 18.85)::geography  -- Mumbai outer anchorage
) < 10000  -- 10km radius
AND nav_status IN ('at anchor', 'moored')
GROUP BY DATE(timestamp)
ORDER BY date DESC;
```

---

## 🎯 Use Cases

### 1. Voyage Planning
- Show charterer 3 route options with ETAs
- Visual comparison of routes
- Historical performance of each route

### 2. ETA Prediction
- Real-time ETA updates based on current position
- Compare with planned route
- Alert if vessel deviating from common route

### 3. Port Call Optimization
- Identify best anchorage zones (from AIS patterns)
- Avoid congestion (real-time vessel counts)
- Predict berth availability

### 4. Market Intelligence
- Track competitor vessel movements
- Identify new trade lanes
- Cargo flow analysis

### 5. Benchmarking
- Compare your vessels' performance vs industry
- Optimize speed for fuel efficiency
- Identify underperforming vessels

---

## 🚀 Implementation Roadmap

### Phase 1: Data Collection (Week 1-2)
- [ ] Set up AIS receiver (if DIY) OR subscribe to AIS data provider
- [ ] Build AIS message parser
- [ ] Create database tables
- [ ] Start collecting position reports

### Phase 2: Track Building (Week 3-4)
- [ ] Build track builder (connect positions into voyages)
- [ ] Detect port calls (arrival/departure)
- [ ] Store complete vessel tracks

### Phase 3: Route Discovery (Week 5-6)
- [ ] Implement clustering algorithm
- [ ] Detect waypoints
- [ ] Create discovered_routes table
- [ ] Run for Mumbai → Singapore route (pilot)

### Phase 4: Routing API (Week 7-8)
- [ ] Build GraphQL API for route suggestions
- [ ] Implement route optimization logic
- [ ] Add ETA prediction

### Phase 5: Frontend (Week 9-10)
- [ ] Visual route comparison
- [ ] Interactive map with historical tracks
- [ ] Traffic heatmaps

---

## 💰 Cost Estimate

### Option 1: DIY AIS Receiver
- Hardware: $100 (one-time)
- Coverage: Local ports only (30-50nm)
- Data: Free
- **Total**: $100 (covers Mumbai, JNPT, nearby ports)

### Option 2: AISHub Free API
- Coverage: Global (limited)
- Calls: Reasonable for small scale
- **Total**: Free

### Option 3: MarineTraffic Commercial
- Coverage: Global, high quality
- Cost: ~$1,000/month
- **Total**: $12,000/year

### Option 4: Spire Maritime (Satellite AIS)
- Coverage: Global including oceanic
- Cost: ~$8,000/month
- **Total**: $96,000/year

**Recommended Start**: DIY receiver + AISHub free API, upgrade if successful.

---

## 📈 Expected Benefits

1. **More Accurate ETAs**: 15-20% improvement over great circle calculations
2. **Better Route Planning**: Real routes, not theoretical
3. **Seasonal Optimization**: Monsoon route vs summer route
4. **Traffic Avoidance**: Route around known congestion
5. **Competitive Intelligence**: See what others are doing

---

## 🎉 Success Metrics

- **Route Coverage**: Discover 50+ common routes within 6 months
- **ETA Accuracy**: Within 4 hours for 90% of predictions
- **Data Quality**: 1 million+ position reports per month
- **User Adoption**: 80% of users use AI-recommended routes

---

**Status**: Ready to implement
**Priority**: High (unique competitive advantage)
**Dependencies**: AIS data source, PostGIS, ML frameworks
