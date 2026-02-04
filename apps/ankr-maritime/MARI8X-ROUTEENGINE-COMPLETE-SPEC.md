# Mari8X_RouteEngine™

**The World's First AIS-Powered, Vessel-Type-Aware, Self-Learning Maritime Routing Engine**

**Status**: Ready for Development
**Timeline**: 6 months to production
**Competitive Advantage**: Unique in the industry

---

## 🎯 Vision Statement

**Mari8X_RouteEngine learns from millions of real vessel movements to provide intelligent, vessel-type-specific routing recommendations that improve over time.**

**Tagline**: *"Routes learned from reality, not theory"*

---

## 🚀 What Makes Mari8X_RouteEngine Unique

### Traditional Routing Engines
```
Point A → Great Circle → Point B
(Same route for everyone)
```

### Mari8X_RouteEngine
```
Point A →
  → Deep Draft Tanker Route (offshore, 45m depth)
  → Container Ship Route (fast, direct, 25m depth)
  → Coastal Bulk Route (follows shore, 15m depth)
→ Point B

(Different routes for different vessel types, learned from 1000s of real transits)
```

### Key Differentiators

1. **Vessel-Type Awareness** ⭐⭐⭐⭐⭐
   - Tankers follow deep water routes
   - Containers take fastest routes
   - Bulk carriers use coastal shortcuts
   - Each vessel type has optimized routes

2. **Real Movement Learning** ⭐⭐⭐⭐⭐
   - Based on actual AIS tracks from real vessels
   - Not theoretical - REAL patterns
   - Discovers routes humans know but aren't documented

3. **Self-Improving** ⭐⭐⭐⭐⭐
   - Gets smarter every week
   - More data = better routes
   - Seasonal patterns emerge naturally

4. **Safety-First** ⭐⭐⭐⭐⭐
   - Depth-aware (won't suggest 18m draft vessel use 15m route)
   - Distance from shore computed
   - Weather patterns learned from historical tracks

5. **Industry-Leading ETA** ⭐⭐⭐⭐⭐
   - ML-based prediction from real performance
   - Vessel-type-specific speed profiles
   - Seasonal adjustments automatic

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Mari8X_RouteEngine                      │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌──────────────┐   ┌──────────────┐
│  AIS Data     │   │  Vessel      │   │   Route      │
│  Collector    │   │  Categorizer │   │  Discovery   │
│               │   │              │   │   Engine     │
│ - Real-time   │   │ - Type       │   │              │
│ - Historical  │   │ - Draft      │   │ - Clustering │
│ - Satellite   │   │ - Size       │   │ - Waypoints  │
└───────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                    ┌──────────────┐
                    │  PostgreSQL  │
                    │  + PostGIS   │
                    │              │
                    │ - Tracks     │
                    │ - Routes     │
                    │ - Vessels    │
                    └──────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌──────────────┐   ┌──────────────┐
│  ML Engine    │   │  GraphQL API │   │  Frontend    │
│               │   │              │   │              │
│ - ETA Model   │   │ - Route      │   │ - Map View   │
│ - Clustering  │   │   Query      │   │ - Compare    │
│ - Training    │   │ - Stats      │   │ - Analytics  │
└───────────────┘   └──────────────┘   └──────────────┘
```

---

## 📊 Core Components

### 1. AIS Data Collector

**Purpose**: Ingest real-time and historical AIS position reports

**Sources**:
- **Primary**: AISHub Free API (global, free tier)
- **Secondary**: DIY AIS receiver (local ports, $100 hardware)
- **Future**: Spire Maritime satellite AIS (global oceanic coverage)

**Data Flow**:
```
AIS Message → Parse → Validate → Categorize → Store
```

**Metrics**:
- Target: 1M+ positions per month
- Coverage: Indian Ocean, Southeast Asia (Phase 1)
- Update Frequency: Real-time (2-10 second intervals)

### 2. Vessel Categorizer

**Purpose**: Classify vessels into route categories

**Categories**:
```typescript
enum RouteCategory {
  DEEP_DRAFT_TANKER = 'deep_draft_tanker',      // VLCC, Suezmax (draft >15m)
  MEDIUM_DRAFT_TANKER = 'medium_draft_tanker',  // Aframax, MR (draft 10-15m)
  ULTRA_LARGE_CONTAINER = 'ultra_large_container', // ULCV (length >300m)
  LARGE_CONTAINER = 'large_container',           // Post-Panamax (250-300m)
  FEEDER_CONTAINER = 'feeder_container',        // Feeder (length <250m)
  CAPESIZE_BULK = 'capesize_bulk',              // Capesize (draft >14m)
  PANAMAX_BULK = 'panamax_bulk',                // Panamax (draft 10-14m)
  HANDYSIZE_BULK = 'handysize_bulk',            // Handysize (draft <10m)
  COASTAL_TRADER = 'coastal_trader',            // Small cargo (length <100m)
  GENERAL_CARGO = 'general_cargo'               // General purpose
}
```

**Classification Logic**:
- Input: AIS Type 5 (static data) + vessel dimensions
- Output: Route category + suitable depth + speed profile

### 3. Route Discovery Engine

**Purpose**: Cluster real vessel tracks into common routes

**Algorithm**:
```python
for each route (origin → destination):
    for each vessel_category:
        tracks = get_all_tracks(origin, destination, vessel_category)

        if len(tracks) < 10:
            continue  # Not enough data

        # Spatial clustering (DBSCAN)
        clusters = cluster_by_geography(tracks, epsilon=2_nm)

        for cluster in clusters:
            centerline = compute_median_path(cluster.tracks)
            corridor_width = compute_95_percentile_width(cluster.tracks)
            waypoints = detect_common_turning_points(cluster.tracks)
            depth_profile = compute_min_depth_along_route(centerline)

            store_discovered_route({
                'origin': origin,
                'destination': destination,
                'vessel_category': vessel_category,
                'centerline': centerline,
                'corridor_width': corridor_width,
                'waypoints': waypoints,
                'depth_profile': depth_profile,
                'total_transits': len(cluster.tracks),
                'statistics': compute_statistics(cluster.tracks)
            })
```

**Output**: Database of discovered routes, organized by vessel type

### 4. ML Engine

**Purpose**: Predict ETAs and optimize routes using machine learning

**Models**:

**A. ETA Prediction Model**
```python
from sklearn.ensemble import GradientBoostingRegressor

features = [
    'distance_nm',
    'vessel_category',
    'vessel_dwt',
    'vessel_length',
    'season',
    'departure_port_congestion',
    'arrival_port_congestion',
    'avg_wave_height_forecast',
    'avg_wind_speed_forecast',
    'historical_avg_speed_this_route',
    'cargo_type',
    'route_traffic_density'
]

target = 'actual_duration_hours'

model = GradientBoostingRegressor(
    n_estimators=500,
    learning_rate=0.05,
    max_depth=5
)

model.fit(X_train, y_train)

# Prediction
predicted_eta = model.predict(voyage_features)
confidence_interval = model.predict_quantiles([0.05, 0.95])
```

**B. Route Clustering Model**
```python
from sklearn.cluster import DBSCAN
import numpy as np

# Convert tracks to point cloud
points = np.array([
    [pos.lat, pos.lon]
    for track in tracks
    for pos in track.positions
])

# Cluster (epsilon = ~2 nautical miles)
clustering = DBSCAN(
    eps=0.033,  # ~2nm in degrees
    min_samples=50,
    metric='haversine'
).fit(np.radians(points))

# Each cluster = one common route variant
```

**C. Continuous Learning**
- Retrains weekly with new AIS data
- Routes evolve and improve over time
- Seasonal patterns discovered automatically

---

## 🎨 User Interface

### Route Selection Screen

```
┌─────────────────────────────────────────────────────────────┐
│  Mari8X_RouteEngine                        Your Vessel: MV   │
│  Mumbai (INMUN) → Singapore (SGSIN)        VLCC Tanker       │
│                                            Draft: 18.5m      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [MAP VIEW]                                                  │
│                                                               │
│  ╔═══════════════════════════════════════════════════════╗  │
│  ║                                                         ║  │
│  ║    Mumbai ●────────────────────────────┐               ║  │
│  ║            ╲                           │               ║  │
│  ║             ╲ (Your Route)             │ (Container)   ║  │
│  ║              ╲ Deep Draft              │  Fast Route   ║  │
│  ║               ╲ Tanker Route           │               ║  │
│  ║                ╲                      ╱                ║  │
│  ║                 ● Waypoint 1        ╱                  ║  │
│  ║                  ╲                ╱                     ║  │
│  ║                   ╲             ╱                       ║  │
│  ║                    ╲          ╱                         ║  │
│  ║                     ●────────●                          ║  │
│  ║                    Waypoint 2                           ║  │
│  ║                        │                                ║  │
│  ║                        │                                ║  │
│  ║                   Singapore ●                           ║  │
│  ║                                                         ║  │
│  ╚═══════════════════════════════════════════════════════╝  │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  Recommended Route: Deep Draft Tanker Route (Ocean)          │
├─────────────────────────────────────────────────────────────┤
│  Distance:        2,921 nm                                   │
│  Est. Duration:   9.7 days   ⓘ Based on 847 real transits   │
│  Avg Speed:       12.5 knots                                 │
│  Min Depth:       45m        ✓ Safe for your draft (18.5m)  │
│  Traffic:         Medium (2.3 vessels/day)                   │
│  Safety:          ★★★★★ (Excellent)                          │
│                                                               │
│  ⚠️ Container Route NOT suitable: Min depth 25m <18.5m draft │
│                                                               │
│  [View Depth Profile] [Weather Forecast] [Select Route]     │
└─────────────────────────────────────────────────────────────┘
```

### Comparison View

```
┌─────────────────────────────────────────────────────────────┐
│  Route Comparison: Mumbai → Singapore                        │
├─────────────────────────────────────────────────────────────┤
│  Route Type         │Distance│Duration│Speed │Min    │Safe  │
│                     │        │        │      │Depth  │For You│
├─────────────────────┼────────┼────────┼──────┼───────┼──────┤
│ ✓ Deep Draft Tanker │2,921nm │9.7 days│12.5kt│45m    │  ✓   │
│   (Recommended)     │        │        │      │       │      │
├─────────────────────┼────────┼────────┼──────┼───────┼──────┤
│   Container Ship    │2,847nm │6.4 days│18.5kt│25m    │  ✗   │
│   (Too shallow!)    │        │        │      │       │      │
├─────────────────────┼────────┼────────┼──────┼───────┼──────┤
│   Coastal Bulk      │3,102nm │11.8days│11.0kt│35m    │  ✓   │
│   (Slower, safer)   │        │        │      │       │      │
└─────────────────────────────────────────────────────────────┘

Based on 2,328 real vessel transits analyzed
Last updated: 2 days ago
Routes improve weekly with new AIS data
```

---

## 📊 Sample API Queries

### Query 1: Get Route Recommendation

```graphql
query GetRoute {
  mari8xRoute(
    origin: "INMUN"
    destination: "SGSIN"
    vessel: {
      type: "tanker"
      draft: 18.5
      length: 320
      dwt: 280000
    }
    departureDate: "2026-02-15"
  ) {
    recommended {
      routeCode         # "INMUN-SGSIN-DEEP-TANKER-001"
      category          # "deep_draft_tanker"

      geometry {
        type            # "LineString"
        coordinates     # [[72.84, 18.94], ...]
      }

      distance          # 2921
      estimatedDuration # 9.7 (days)
      averageSpeed      # 12.5 (knots)

      safety {
        minDepth        # 45 (meters)
        safeForDraft    # true
        avgDistFromShore # 180 (nm)
        rating          # 5.0 (out of 5)
      }

      waypoints {
        lat
        lon
        name
        reason
      }

      intelligence {
        totalTransits   # 847
        dataQuality     # 0.95
        lastUpdated     # "2026-01-30"
        confidenceLevel # "high"
      }

      seasonalAdvice  # "Optimal year-round. Monsoon adds ~0.5 days."
    }

    alternatives {
      routeCode
      reason          # "20nm longer but avoids Singapore Strait congestion"
    }

    unsuitable {
      category        # "large_container"
      reason          # "Min depth 25m insufficient for 18.5m draft"
    }
  }
}
```

### Query 2: Route Evolution Over Time

```graphql
query RouteEvolution {
  mari8xRouteHistory(
    routeCode: "INMUN-SGSIN-DEEP-TANKER-001"
  ) {
    timeline {
      month
      transitsAnalyzed
      avgDuration
      avgSpeed
      centerlineShift  # How much route moved
      insights
    }
  }
}
```

**Response**:
```json
{
  "timeline": [
    {
      "month": "2025-08",
      "transitsAnalyzed": 89,
      "avgDuration": 9.9,
      "avgSpeed": 12.3,
      "centerlineShift": null,
      "insights": "Route first discovered"
    },
    {
      "month": "2025-09",
      "transitsAnalyzed": 94,
      "avgDuration": 9.6,
      "avgSpeed": 12.7,
      "centerlineShift": 2.3,
      "insights": "Route optimizing - vessels learning better path"
    },
    {
      "month": "2025-10",
      "transitsAnalyzed": 112,
      "avgDuration": 9.5,
      "avgSpeed": 12.8,
      "centerlineShift": 1.1,
      "insights": "Route stabilizing"
    },
    {
      "month": "2025-11",
      "transitsAnalyzed": 98,
      "avgDuration": 10.3,
      "avgSpeed": 11.8,
      "centerlineShift": 3.7,
      "insights": "Monsoon impact - vessels taking safer offshore route"
    },
    {
      "month": "2026-01",
      "transitsAnalyzed": 103,
      "avgDuration": 9.7,
      "avgSpeed": 12.5,
      "centerlineShift": 0.8,
      "insights": "Route highly optimized - minimal variation"
    }
  ]
}
```

---

## 🎯 Go-To-Market Strategy

### Product Positioning

**Brand Name**: Mari8X_RouteEngine™
**Tagline**: *Routes learned from reality, not theory*

**Unique Selling Points**:
1. **Only routing engine learning from real AIS data**
2. **Vessel-type-aware** (tankers ≠ containers ≠ bulk)
3. **Self-improving** (gets smarter every week)
4. **Depth-safe** (won't sink your ship!)
5. **Industry-leading ETA accuracy**

### Target Customers

**Tier 1: Ship Operators**
- Need accurate ETAs
- Want fuel optimization
- Safety-first mindset
- Value: Reduce fuel costs 3-5% with optimal routing

**Tier 2: Charterers**
- Need to compare vessel options
- Want cost estimates
- Require ETA accuracy
- Value: Better voyage estimates = better negotiations

**Tier 3: Ship Brokers**
- Quote voyage costs
- Recommend routes
- Need credibility
- Value: Mari8X brand = trusted routes

### Pricing Model

**Freemium**:
- Free: Basic routes (great circle + single AIS route)
- Pro ($99/month): All vessel-type routes + ETA predictions
- Enterprise ($999/month): API access + historical analysis + custom routes

**Per-Query**:
- $1 per route query
- $5 per detailed analysis (depth profile, seasonal comparison)

---

## 📈 Success Metrics

### Phase 1 (Months 1-3): Data Collection
- ✅ 100,000+ AIS positions collected
- ✅ 1,000+ vessels categorized
- ✅ 500+ complete tracks (Mumbai-Singapore)

### Phase 2 (Months 4-6): Route Discovery
- ✅ 10+ routes discovered (different vessel types)
- ✅ 5+ major routes (Mumbai-Singapore, Mumbai-Dubai, Chennai-Singapore, etc.)
- ✅ Depth profiles for all routes
- ✅ ML model accuracy >85%

### Phase 3 (Months 7-12): Production
- ✅ 100+ users
- ✅ 1,000+ route queries/month
- ✅ ETA accuracy within 4 hours (90% of voyages)
- ✅ 50+ route pairs covered

### Phase 4 (Year 2): Scale
- ✅ 1,000+ users
- ✅ 10,000+ route queries/month
- ✅ Global coverage (Atlantic, Pacific, Indian Ocean)
- ✅ API customers

---

## 🏆 Competitive Advantage Summary

| Feature | Mari8X_RouteEngine | Competitors |
|---------|-------------------|-------------|
| Vessel-type awareness | ✅ Different routes per type | ❌ One route for all |
| Real AIS data | ✅ Millions of real tracks | ❌ Theoretical |
| Self-improving | ✅ Weekly retraining | ❌ Static |
| Depth-aware | ✅ Full depth profiles | ⚠️ Basic |
| ETA accuracy | ✅ ML-based, 90%+ | ⚠️ 70-80% |
| Seasonal routes | ✅ Automatic discovery | ❌ Manual |
| Traffic intelligence | ✅ Real-time density | ⚠️ Basic |

---

## 📚 Documentation Structure

```
/docs/mari8x-routeengine/
├── README.md (Overview)
├── getting-started.md
├── api-reference.md
├── vessel-categories.md
├── route-discovery-algorithm.md
├── machine-learning-models.md
├── data-sources.md
├── faq.md
└── examples/
    ├── tanker-routing.md
    ├── container-routing.md
    └── coastal-routing.md
```

---

## 🎉 Launch Checklist

**Technical**:
- [ ] AIS data source selected and configured
- [ ] PostgreSQL + PostGIS database set up
- [ ] Vessel categorizer implemented
- [ ] Route discovery algorithm running
- [ ] ML models trained
- [ ] GraphQL API live
- [ ] Frontend map view built

**Data**:
- [ ] 6 months of AIS data collected
- [ ] 50+ routes discovered
- [ ] Depth profiles complete
- [ ] Seasonal patterns identified

**Business**:
- [ ] Pricing model finalized
- [ ] Landing page live
- [ ] Documentation complete
- [ ] Beta users recruited (10)

**Marketing**:
- [ ] Brand assets (logo, colors)
- [ ] Case studies (3)
- [ ] Blog posts (5)
- [ ] Social media presence

---

## 🚀 Ready to Build

**Mari8X_RouteEngine** is ready for development!

**Next Step**: Begin AIS data collection (Month 1)

**Contact**: Ready to start implementing when you are!

---

**Mari8X_RouteEngine™**
*The smartest way to route your voyage*
*Powered by real vessel movements, not guesswork*
