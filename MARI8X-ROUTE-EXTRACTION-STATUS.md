# Mari8X OSRM Route Extraction Status

**Date:** 2026-02-09
**Status:** 🔄 IN PROGRESS

---

## Overview

Extracting vessel routes from **78.2M AIS positions** using dual-method approach for Mari8x OSRM maritime routing engine.

## System Components

### 1. OSRM Backend
- **Container:** `mari8x-osrm` ✅ Running
- **Port:** 5000 (internal Docker)
- **Status:** Responding to routing requests
- **Test:** Mumbai → Singapore routing = `Ok`

### 2. AIS Data Source
- **Total Positions:** 78,229,646
- **Vessels Tracked:** 49,333
- **Data Range:** 2012-01-01 to 2026-02-09 (14 years)
- **Latest Update:** 6 hours ago (real-time)

### 3. Dual-Method Extraction

#### Method 1: Trajectory Segmentation (AISRouteExtractor)
**How it works:**
- Splits vessel tracks into port-to-port segments
- Analyzes 20-50 active vessels per type
- Filters by speed range (vessel-type specific)
- Calculates quality scores and distance factors
- Direct route analysis from position data

**Parameters:**
- Min positions: 20
- Max time gap: 3 hours
- Min distance: 5 nm
- Speed filters by vessel type

#### Method 2: Pattern Learning (IncrementalLearner)
**How it works:**
- Builds learning base from historical patterns
- Calculates confidence scores from repeated observations
- Identifies reliable route patterns across fleet
- Requires minimum trip observations

**Parameters:**
- Time window: 14 days
- Min confidence: 0.6
- Min observations: 3-20 (by vessel type)

## Vessel Types Being Processed

| Vessel Type | Min Speed | Max Speed | Min Trips | Description |
|-------------|-----------|-----------|-----------|-------------|
| Container | 8 kts | 25 kts | 3 | Container Ships |
| Tanker | 6 kts | 18 kts | 3 | Oil/Chemical Tankers |
| Bulk Carrier | 7 kts | 16 kts | 3 | Bulk Carriers |
| General Cargo | 6 kts | 18 kts | 5 | General Cargo |
| Passenger | 10 kts | 30 kts | 10 | Passenger Ships |
| Ferry | 8 kts | 25 kts | 20 | Ferries |
| Fishing | 3 kts | 12 kts | 5 | Fishing Vessels |
| Tug | 4 kts | 12 kts | 10 | Tugs & Service Vessels |

## Extraction Process

### Current Run
```bash
# Started: 2026-02-09 22:10
npx tsx src/scripts/extract-all-routes-dual-method.ts

# Monitoring:
tail -f /tmp/route-extraction.log
```

### Expected Output
- Routes extracted per vessel type
- Quality scores and confidence ratings
- Distance factors (actual vs great circle)
- Top routes identified
- Total processing time

## Storage Schema

**Table:** `extracted_ais_routes`

**Key Fields:**
- Vessel information (ID, name, type, IMO)
- Origin/destination ports (ID, name, coordinates, timestamps)
- Route metrics (positions, distances, duration, speed)
- Quality metrics (score, coverage, gaps)
- Route classification (direct, via canal, coastal)
- Via points (e.g., Suez Canal, Malacca Strait)

## Integration with Mari8x OSRM

### 1. Route Export to OSM Format
```bash
# Convert extracted routes to OpenStreetMap format
npx tsx src/scripts/osrm-json-to-osm.ts
```

### 2. OSRM Processing Pipeline
```bash
# Extract routes
docker run osrm/osrm-backend osrm-extract -p /data/maritime.lua /data/ocean-routes.osm

# Partition graph
docker run osrm/osrm-backend osrm-partition /data/ocean-routes.osrm

# Customize for routing
docker run osrm/osrm-backend osrm-customize /data/ocean-routes.osrm

# Start routing server
docker run -p 5000:5000 osrm/osrm-backend osrm-routed /data/ocean-routes.osrm
```

### 3. Query Routes
```bash
# Direct API call
curl "http://localhost:5000/route/v1/driving/72.8452,18.9388;103.8198,1.3521?overview=full&geometries=geojson"

# Via GraphQL
query {
  routesByVesselType(type: "container") {
    id
    originPort { name }
    destPort { name }
    actualSailedNm
    distanceFactor
    qualityScore
  }
}
```

## Benefits of Dual-Method Approach

### Method 1 Advantages
✅ Direct analysis of actual vessel behavior
✅ Captures vessel-specific routing preferences
✅ High detail from individual trajectories
✅ Identifies outliers and quality issues

### Method 2 Advantages
✅ Learns from fleet-wide patterns
✅ Builds confidence from repeated observations
✅ Filters out one-off anomalies
✅ Identifies reliable, commonly-used routes

### Combined Power
🎯 **Best of both worlds**: Individual precision + Fleet wisdom
🎯 **Higher confidence**: Routes validated by both methods
🎯 **Better coverage**: Fills gaps in sparse data
🎯 **Quality assurance**: Cross-validation between methods

## Next Steps

### 1. After Extraction Completes
- [ ] Verify route quality scores
- [ ] Check distance factors (expect 1.1-1.5x great circle)
- [ ] Review top routes per vessel type
- [ ] Export to OSM format for OSRM

### 2. OSRM Integration
- [ ] Generate maritime.lua profile (canal restrictions, depth limits)
- [ ] Process OSM data through OSRM pipeline
- [ ] Test routing queries
- [ ] Benchmark performance

### 3. Frontend Integration
- [ ] Add route visualization on maps
- [ ] Show actual vs optimal routes
- [ ] Display route statistics
- [ ] Enable route planning interface

### 4. Optimization
- [ ] Add weather routing integration
- [ ] Consider fuel efficiency factors
- [ ] Include port congestion data
- [ ] Implement canal scheduling

## Monitoring Commands

```bash
# Check extraction progress
tail -f /tmp/route-extraction.log

# Query extracted routes
sudo -u postgres psql -d ankr_maritime -c "
  SELECT
    vessel_type,
    COUNT(*) as routes,
    ROUND(AVG(quality_score)::numeric, 2) as avg_quality,
    ROUND(AVG(distance_factor)::numeric, 2) as avg_factor
  FROM extracted_ais_routes
  GROUP BY vessel_type;
"

# Check OSRM status
docker logs mari8x-osrm --tail 20

# Test routing
curl "http://localhost:5000/route/v1/driving/0,60;10,60?overview=full&geometries=geojson"
```

## Performance Expectations

**Processing Time:** ~10-30 minutes (depends on vessel count)
**Routes Expected:** 500-2,000 high-quality routes
**Coverage:** Major trade lanes globally
**Quality:** 80%+ with score >0.7

## Status Updates

### 2026-02-09 22:10
- ✅ OSRM container restarted and responding
- ✅ Dual-method extraction script launched
- 🔄 Processing 8 vessel types
- 🔄 Using 78.2M AIS positions
- ⏳ Estimated completion: 22:20-22:40

---

**Next Update:** Check after 10 minutes for completion status
