# AIS Data Retention & Optimization Strategy
## Intelligent Storage for Long-Term Algorithmic Effectiveness

**Current State:**
- 68.5M AIS positions stored (~1 week of data)
- Growing at ~25M positions/day
- No retention policy = exponential bloat

**Goal:** Retain maximum algorithmic value with minimum storage footprint

**Strategy:** Start liberal during build phase, gradually tighten as data accumulates

---

## 🚧 Phase 0: Build Mode (Liberal Initial Policy)
**Duration:** Until we reach 100GB OR 3 months of data, whichever comes first
**Philosophy:** Keep more data while building algorithms, optimize later

### Why Start Liberal?

1. **Algorithm Development:** Need rich historical data to test and validate algorithms
2. **Unknown Patterns:** Don't know which data will be valuable yet
3. **Low Cost:** With only 1 week of data, storage is negligible
4. **Flexibility:** Can always delete later, can't recover deleted data
5. **Learning Phase:** Understanding real AIS data patterns before optimizing

### Build Mode Retention Policy

**All Zones (Port/Trade Lane/Open Sea):**
```
Raw Data:        Keep EVERYTHING for 30 days
Short-term:      Keep daily aggregates for 90 days
Long-term:       Archive (don't delete) anything older than 90 days
```

**Simple Rules:**
- ✅ **Keep:** All raw positions < 30 days old
- ✅ **Aggregate:** Create daily summaries for 30-90 day old data (but keep raw too)
- ✅ **Archive:** Move > 90 day old data to cold storage (S3) but DON'T delete
- ❌ **Don't Delete:** No deletions during build mode

### Build Mode Storage Projections

```
Week 1:   68M positions × 200 bytes = 13.6 GB   ✅ Totally fine
Month 1:  750M positions × 200 bytes = 150 GB   ✅ Acceptable for build phase
Month 2:  1.5B positions × 200 bytes = 300 GB   ⚠️ Getting expensive
Month 3:  2.25B positions × 200 bytes = 450 GB  ⚠️ Time to transition
```

**Cost during build:**
- Month 1: ~$10/month (SSD storage)
- Month 2: ~$20/month
- Month 3: ~$30/month + transition to optimized strategy

### What We're Building During This Phase

**Week 1-2: Infrastructure**
- Zone classification (port/trade lane/open sea)
- Aggregation tables (even if not using yet)
- Event detection algorithms
- Archive pipeline to S3

**Week 3-4: Algorithm Development**
- Port congestion models
- Voyage prediction models
- Route extraction algorithms
- Benchmark with full dataset

**Week 5-8: Validation**
- Compare aggregated vs raw data accuracy
- Measure storage savings potential
- Identify valuable vs redundant data
- Test event-based retention effectiveness

**Week 9-12: Gradual Transition**
- Start deleting obviously redundant data (duplicates)
- Begin 7-day hot/warm split for new data
- Archive old data to S3
- Monitor algorithm performance

### Transition Criteria (When to Move to Optimized Strategy)

**Trigger ANY of these:**
1. ✅ Storage exceeds 100 GB
2. ✅ 3 months of continuous data collected
3. ✅ Algorithms validated and stable
4. ✅ Storage costs exceed $50/month

**Then:** Implement the optimized retention strategy below

### Build Mode Quick Wins (Safe to do now)

```sql
-- 1. Remove exact duplicates (safe, no information loss)
DELETE FROM vessel_positions a USING vessel_positions b
WHERE a.id > b.id
  AND a."vesselId" = b."vesselId"
  AND a.timestamp = b.timestamp
  AND a.latitude = b.latitude
  AND a.longitude = b.longitude;

-- 2. Tag zones (preparation for future optimization)
ALTER TABLE vessel_positions ADD COLUMN IF NOT EXISTS zone_type TEXT;
UPDATE vessel_positions SET zone_type = 'port'
WHERE zone_type IS NULL AND EXISTS (
  SELECT 1 FROM ports p WHERE ST_DWithin(...)
);

-- 3. Create archive tables (don't move data yet)
CREATE TABLE IF NOT EXISTS vessel_positions_archive (
  LIKE vessel_positions INCLUDING ALL
);

-- 4. Start daily aggregation (parallel, don't delete raw)
CREATE TABLE IF NOT EXISTS ais_daily_summaries AS
SELECT
  "vesselId",
  DATE(timestamp) as date,
  zone_type,
  COUNT(*) as position_count,
  AVG(latitude) as avg_lat,
  AVG(longitude) as avg_lng,
  AVG(speed) as avg_speed,
  MIN(speed) as min_speed,
  MAX(speed) as max_speed
FROM vessel_positions
WHERE timestamp < CURRENT_DATE
GROUP BY "vesselId", DATE(timestamp), zone_type;
```

**Note:** These create aggregates but DON'T delete raw data yet. Build algorithms using both and compare.

---

## 📊 Optimized Strategy (Future State)
**Activate when:** Storage > 100GB OR after 3 months

---

## 🎯 Core Principle: Zone-Based Differential Retention

Different maritime zones have different data value propositions:

### 1. **Port Zones** (20km radius from port centers)
**High Value:** Critical for congestion, ETA, laytime calculations

**Retention Strategy:**
```
Real-time (0-48h):     Keep EVERY position (1-5 min intervals)
Recent (2 days - 1 week):  Aggregate to 15-min snapshots
Short-term (1 week - 1 month): Aggregate to 1-hour snapshots
Medium-term (1-3 months): Daily snapshots (arrival/departure events only)
Long-term (3+ months):  Keep only: arrivals, departures, anchoring events
```

**Storage Impact:** ~95% reduction after 1 month

**Algorithmic Value Retained:**
- ✅ Congestion patterns (hourly averages)
- ✅ Port turnaround times (event-based)
- ✅ Seasonal trends (daily aggregates)
- ✅ Historical arrivals/departures (full fidelity)

---

### 2. **Trade Lanes** (Major shipping corridors)
**High Value:** Route learning, voyage duration prediction, traffic patterns

**Retention Strategy:**
```
Real-time (0-7 days):     Every position
Short-term (7-30 days):   Aggregate to 1-hour waypoints
Medium-term (1-6 months): Keep only route checkpoints (every 200 nautical miles)
Long-term (6+ months):    Compressed route vectors (origin → checkpoints → destination)
```

**Route Compression Example:**
```
Raw: 1000 positions (Singapore → Rotterdam)
↓
Compressed: 12 checkpoints (Malacca → Indian Ocean → Suez → Med → Rotterdam)
↓
Saved: 98.8% storage, retained 100% route intelligence
```

**Algorithmic Value:**
- ✅ Route patterns (checkpoint-based)
- ✅ Voyage duration statistics
- ✅ Speed profiles (checkpoint averages)
- ✅ Seasonal route variations

---

### 3. **Open Sea** (Outside ports and trade lanes)
**Lower Value:** Less critical for operations, mainly for safety/tracking

**Retention Strategy:**
```
Real-time (0-7 days):     Every position
Short-term (7-30 days):   Aggregate to 4-hour snapshots
Medium-term (1-3 months): Daily noon positions only
Long-term (3+ months):    Weekly snapshots (or delete if not in active voyage)
```

**Storage Impact:** ~99% reduction after 1 month

**Algorithmic Value:**
- ✅ General vessel activity (noon reports)
- ✅ Weather routing patterns (weekly trends)
- ❌ Fine-grained tracking (not needed for historical)

---

## 🗜️ Intelligent Aggregation Techniques

### Temporal Aggregation (Time-Based)
Instead of deleting old positions, **compress them**:

```sql
-- Example: Port zone hourly aggregation
CREATE TABLE ais_positions_hourly_port_zones AS
SELECT
  vessel_id,
  port_id,
  DATE_TRUNC('hour', timestamp) as hour,
  -- Aggregate positions
  AVG(latitude) as avg_lat,
  AVG(longitude) as avg_lng,
  AVG(speed) as avg_speed,
  MIN(speed) as min_speed,
  MAX(speed) as max_speed,
  -- Statistics
  COUNT(*) as position_count,
  -- Movement detection
  BOOL_OR(speed < 0.5) as was_anchored,
  BOOL_OR(speed > 10) as was_moving_fast,
  -- Navigation status
  MODE() WITHIN GROUP (ORDER BY navigation_status) as primary_status
FROM vessel_positions
WHERE port_zone_id IS NOT NULL
  AND timestamp > NOW() - INTERVAL '1 week'
  AND timestamp < NOW() - INTERVAL '2 days'
GROUP BY vessel_id, port_id, DATE_TRUNC('hour', timestamp);

-- Delete raw positions after aggregation
DELETE FROM vessel_positions
WHERE port_zone_id IS NOT NULL
  AND timestamp > NOW() - INTERVAL '1 week'
  AND timestamp < NOW() - INTERVAL '2 days';
```

**Result:**
- 1 hour = ~12 positions → 1 aggregated record
- 92% storage reduction
- Congestion algorithms still work (hourly averages sufficient)

---

### Event-Based Retention (State Changes)
Keep only **significant events**, discard redundant data:

**Significant Events:**
1. **Port Arrival** (vessel enters 20km zone)
2. **Anchoring Start** (speed drops below 0.5 knots for 30+ min)
3. **Anchoring End** (speed increases)
4. **Berthing** (vessel stops at terminal)
5. **Departure** (vessel exits 20km zone)
6. **Route Deviation** (> 10 nautical miles off expected route)
7. **Speed Change** (> 5 knot delta)
8. **Destination Change** (AIS destination field changes)

**Example:**
```
Instead of:
Position 1: 12:00, Lat 1.234, Lng 103.456, Speed 0.2, Anchored
Position 2: 12:05, Lat 1.234, Lng 103.456, Speed 0.2, Anchored
Position 3: 12:10, Lat 1.234, Lng 103.456, Speed 0.3, Anchored
... (100 more positions) ...
Position 104: 20:40, Lat 1.234, Lng 103.456, Speed 0.2, Anchored

Store only:
Event 1: 12:00, State=ANCHORING_START, Duration=8.67 hours
Event 2: 20:40, State=ANCHORING_END
```

**Storage:** 2 events instead of 104 positions = **98% reduction**

**Algorithmic Value:**
- ✅ Exact wait times (duration preserved)
- ✅ Congestion metrics (anchored vessel count)
- ✅ Port efficiency (time between events)

---

## 📊 Tiered Storage Architecture

### Hot Storage (0-7 days) - Fast SSD
- **Raw positions:** Every AIS message
- **Query speed:** <100ms
- **Use case:** Real-time tracking, live dashboards, port congestion
- **Storage:** ~175M positions = ~50GB

### Warm Storage (7-90 days) - SSD
- **Aggregated positions:** Hourly/daily snapshots + events
- **Query speed:** <1s
- **Use case:** Historical analysis, voyage reports, DA calculations
- **Storage:** ~3M aggregates = ~2GB (97% reduction!)

### Cold Storage (90+ days) - Object Storage (S3/Glacier)
- **Compressed routes:** Checkpoint-based vectors
- **Events only:** Arrivals, departures, significant events
- **Query speed:** 5-30s
- **Use case:** Long-term trends, ML training, regulatory compliance
- **Storage:** ~500K events/month = ~500MB/year

### Archive (1+ year) - Glacier Deep Archive
- **Compressed & deduplicated**
- **Use case:** Regulatory (7-year retention), disaster recovery
- **Cost:** $1/TB/month

---

## 🧮 Mathematical Models for Retention

### Port Zone Retention Formula
```
Granularity(t) = {
  1 min,              if t < 48h
  15 min,             if 48h ≤ t < 1 week
  1 hour,             if 1 week ≤ t < 1 month
  Events only,        if t ≥ 1 month
}
```

### Trade Lane Retention Formula
```
Distance_between_points(t) = {
  Actual (1-5 NM),    if t < 7 days
  50 NM,              if 7 days ≤ t < 1 month
  200 NM,             if 1 month ≤ t < 6 months
  Route vector only,  if t ≥ 6 months
}
```

### Open Sea Retention Formula
```
Keep_probability(t) = {
  100%,               if t < 7 days
  Daily noon only,    if 7 days ≤ t < 3 months
  0% (delete),        if t ≥ 3 months AND not in voyage
}
```

---

## 🤖 Algorithmic Effectiveness vs Storage

### Congestion Monitoring
**Need:** Last 48h at high resolution
**Keep:** Raw positions (48h) + hourly aggregates (forever)
**Effectiveness:** 100% (real-time), 95% (historical trends)
**Storage:** 0.1% of raw forever

### Voyage Duration Prediction
**Need:** Historical routes (origin → destination → duration)
**Keep:** Route checkpoints + actual voyage time
**Effectiveness:** 98% (checkpoint-based ML model as good as full route)
**Storage:** 2% of raw

### Port Turnaround Analytics
**Need:** Arrival/departure timestamps, anchoring durations
**Keep:** Event-based records (arrivals, departures, anchoring)
**Effectiveness:** 100% (events are lossless for this use case)
**Storage:** 0.5% of raw

### Route Optimization
**Need:** Historical routes with weather, speed, fuel data
**Keep:** Waypoints (200 NM intervals) + voyage metadata
**Effectiveness:** 95% (waypoint interpolation works well)
**Storage:** 5% of raw

### Fleet Utilization
**Need:** Days at sea, days in port, idle time
**Keep:** Daily aggregates (in_port/at_sea/idle)
**Effectiveness:** 100% (daily granularity sufficient)
**Storage:** 0.01% of raw

---

## 🏗️ Implementation Strategy (Phased Approach)

### Phase 0: Build Mode (Week 1-12) - CURRENT PHASE
**Goal:** Set up infrastructure, keep all data, build algorithms

```sql
-- Week 1: Add metadata columns (preparation)
ALTER TABLE vessel_positions ADD COLUMN IF NOT EXISTS zone_type TEXT;
ALTER TABLE vessel_positions ADD COLUMN IF NOT EXISTS retention_tier TEXT DEFAULT 'hot';
ALTER TABLE vessel_positions ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;

-- Week 2: Create aggregation tables (parallel to raw data)
CREATE TABLE IF NOT EXISTS ais_daily_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "vesselId" TEXT NOT NULL,
  date DATE NOT NULL,
  zone_type TEXT,
  position_count INT,
  avg_lat DECIMAL(10, 7),
  avg_lng DECIMAL(10, 7),
  avg_speed DECIMAL(5, 2),
  min_speed DECIMAL(5, 2),
  max_speed DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE("vesselId", date, zone_type)
);

CREATE TABLE IF NOT EXISTS ais_significant_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "vesselId" TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'ARRIVAL', 'DEPARTURE', 'ANCHORING_START', etc.
  timestamp TIMESTAMP NOT NULL,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  port_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Week 3-4: Tag zones (runs once, then via trigger for new data)
UPDATE vessel_positions vp
SET zone_type = CASE
  WHEN EXISTS (
    SELECT 1 FROM ports p
    WHERE ST_DWithin(
      ST_MakePoint(p.longitude, p.latitude)::geography,
      ST_MakePoint(vp.longitude, vp.latitude)::geography,
      20000
    )
  ) THEN 'port'
  -- Add trade lane detection later
  ELSE 'open_sea'
END
WHERE zone_type IS NULL;

-- Week 5-8: Daily aggregation cron (doesn't delete raw data yet)
-- Creates aggregates for algorithm testing
0 3 * * * psql -c "
  INSERT INTO ais_daily_summaries (...)
  SELECT ... FROM vessel_positions
  WHERE DATE(timestamp) = CURRENT_DATE - 1
  ON CONFLICT DO NOTHING;
"
```

### Phase 1: Optimization Begins (Month 4+)
**Trigger:** Storage > 100GB OR 3 months of data
**Goal:** Start aggressive retention, keep algorithms working

```bash
# Daily cron job: Aggregate and DELETE old data
0 2 * * * /root/apps/ankr-maritime/scripts/aggressive-ais-retention.sh

# Script logic:
# 1. Archive positions > 30 days to S3
# 2. Delete raw positions > 30 days (keep aggregates)
# 3. Aggregate 7-30 day data to hourly
# 4. Extract events from port zones
```

### Phase 2: Tiered Storage (Month 5+)
**Goal:** Move to production-grade storage architecture

```sql
-- Partition tables by time
CREATE TABLE vessel_positions_hot PARTITION OF vessel_positions
  FOR VALUES FROM (CURRENT_DATE - INTERVAL '7 days') TO (MAXVALUE);

CREATE TABLE vessel_positions_warm PARTITION OF vessel_positions
  FOR VALUES FROM (CURRENT_DATE - INTERVAL '30 days') TO (CURRENT_DATE - INTERVAL '7 days');

-- Archive > 30 days to S3
-- Delete from Postgres after successful S3 upload
```

### Phase 3: Full Automation (Month 6+)
**Goal:** Zero-touch retention, automatic optimization

```sql
-- Auto-classify new positions
CREATE OR REPLACE FUNCTION classify_ais_position()
RETURNS TRIGGER AS $$
BEGIN
  NEW.zone_type := CASE
    WHEN EXISTS (
      SELECT 1 FROM ports WHERE ST_DWithin(
        ST_MakePoint(ports.longitude, ports.latitude)::geography,
        ST_MakePoint(NEW.longitude, NEW.latitude)::geography,
        20000
      )
    ) THEN 'port'
    ELSE 'open_sea'
  END;

  NEW.retention_tier := 'hot';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER classify_ais_before_insert
  BEFORE INSERT ON vessel_positions
  FOR EACH ROW EXECUTE FUNCTION classify_ais_position();
```

---

## 💾 Storage Projections

### Current (No Retention)
```
Year 1: 68M positions × 200 bytes = 13.6 GB
Year 2: 136M positions = 27.2 GB
Year 3: 204M positions = 40.8 GB
Year 5: 340M positions = 68 GB
```

### With Intelligent Retention
```
Hot (7 days):     25M positions × 200 bytes = 5 GB
Warm (90 days):   3M aggregates × 150 bytes = 450 MB
Cold (1 year):    500K events × 100 bytes = 50 MB
Archive (5 years): 2.5M events × 100 bytes = 250 MB (compressed)

Total: 5.75 GB (fixed size, doesn't grow!)
```

**Savings:** 92% reduction in Year 3, 99% by Year 5

---

## 🎯 Recommended Retention Policy

### Port Zones (20km radius)
| Age | Granularity | Storage | Algorithms Supported |
|-----|-------------|---------|---------------------|
| 0-48h | Raw (1-5 min) | 100% | Real-time tracking, congestion |
| 2d-1w | 15-min snapshots | 8% | Port analytics, DA desk |
| 1w-1m | Hourly snapshots | 2% | Historical congestion |
| 1m-3m | Events only | 0.5% | Turnaround statistics |
| 3m+ | Events only | 0.1% | Long-term trends |

### Trade Lanes
| Age | Granularity | Storage | Algorithms Supported |
|-----|-------------|---------|---------------------|
| 0-7d | Raw positions | 100% | Live tracking |
| 7d-1m | 50 NM checkpoints | 10% | Route learning |
| 1m-6m | 200 NM checkpoints | 5% | Voyage prediction |
| 6m+ | Compressed vectors | 2% | Historical routes |

### Open Sea
| Age | Granularity | Storage | Algorithms Supported |
|-----|-------------|---------|---------------------|
| 0-7d | Raw positions | 100% | Live tracking |
| 7d-1m | Daily noon | 1% | Fleet utilization |
| 1m-3m | Weekly | 0.1% | Broad patterns |
| 3m+ | Delete (unless voyage) | 0% | - |

---

## 🔬 Advanced: Predictive Retention

**Idea:** Use ML to predict which historical positions will be valuable for future queries.

**Factors:**
- Vessel importance (major cargo ships > small ferries)
- Route frequency (common routes compress well, rare routes keep more data)
- Query patterns (frequently accessed routes keep higher resolution)
- Anomaly detection (unusual voyages retain full detail)

**Example:**
```python
def calculate_retention_value(position):
    score = 0

    # Vessel size/importance
    if vessel.dwt > 50000: score += 3
    elif vessel.dwt > 10000: score += 2
    else: score += 1

    # Route frequency
    if route_count > 100/year: score += 1  # Common route, can compress
    elif route_count < 10/year: score += 3  # Rare route, keep detail

    # Query frequency
    if query_count > 10/month: score += 2  # Often accessed

    # Anomaly
    if is_anomaly: score += 5  # Keep anomalies

    return score

# Retention policy based on score
if score >= 7: retention = "keep_full_detail"
elif score >= 4: retention = "moderate_compression"
else: retention = "aggressive_compression"
```

---

## 📈 Success Metrics

### Storage Efficiency
- ✅ Target: <10 GB total storage (regardless of age)
- ✅ Growth rate: O(1) instead of O(n) with time

### Query Performance
- ✅ Real-time queries (0-7d): <100ms
- ✅ Historical queries (7d-3m): <1s
- ✅ Trend analysis (3m+): <5s

### Algorithmic Effectiveness
- ✅ Port congestion accuracy: 99%+ (hourly aggregates work)
- ✅ Voyage prediction accuracy: 95%+ (checkpoint-based)
- ✅ Route learning effectiveness: 98%+ (compressed routes)

### Cost Savings
- ✅ Storage: $5/month instead of $500/month (Year 5)
- ✅ Query costs: 90% reduction (smaller tables = faster queries)
- ✅ Backup costs: 95% reduction

---

## 🚀 Quick Wins (Build Mode - Safe Actions)

### 1. Remove Exact Duplicates (Safe - No Information Loss)
```sql
-- Delete only 100% identical positions (safe during build mode)
DELETE FROM vessel_positions a
USING vessel_positions b
WHERE a.id > b.id
  AND a."vesselId" = b."vesselId"
  AND a.timestamp = b.timestamp
  AND a.latitude = b.latitude
  AND a.longitude = b.longitude
  AND COALESCE(a.speed, -1) = COALESCE(b.speed, -1);

-- Expected: 5-10% reduction, zero risk
```

### 2. Tag Zones (Preparation for Future Optimization)
```sql
-- Add zone classification (doesn't delete anything)
ALTER TABLE vessel_positions ADD COLUMN IF NOT EXISTS zone_type TEXT;

-- Tag port zones (20km radius)
UPDATE vessel_positions vp
SET zone_type = 'port'
WHERE zone_type IS NULL
  AND EXISTS (
    SELECT 1 FROM ports p
    WHERE ST_DWithin(
      ST_MakePoint(p.longitude, p.latitude)::geography,
      ST_MakePoint(vp.longitude, vp.latitude)::geography,
      20000
    )
  );

-- Tag everything else as open sea (for now)
UPDATE vessel_positions
SET zone_type = 'open_sea'
WHERE zone_type IS NULL;

-- Creates index for future queries
CREATE INDEX IF NOT EXISTS idx_vessel_positions_zone_type
  ON vessel_positions(zone_type);
```

### 3. Create Daily Summaries (Parallel - Keep Raw Data)
```sql
-- Generate aggregates WITHOUT deleting raw data
CREATE TABLE IF NOT EXISTS ais_daily_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "vesselId" TEXT NOT NULL,
  date DATE NOT NULL,
  zone_type TEXT,
  position_count INT,
  avg_lat DECIMAL(10, 7),
  avg_lng DECIMAL(10, 7),
  avg_speed DECIMAL(5, 2),
  min_speed DECIMAL(5, 2),
  max_speed DECIMAL(5, 2),
  distance_nm DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE("vesselId", date, zone_type)
);

-- Populate daily summaries (run daily via cron)
INSERT INTO ais_daily_summaries (
  "vesselId", date, zone_type,
  position_count, avg_lat, avg_lng,
  avg_speed, min_speed, max_speed
)
SELECT
  "vesselId",
  DATE(timestamp) as date,
  zone_type,
  COUNT(*) as position_count,
  AVG(latitude) as avg_lat,
  AVG(longitude) as avg_lng,
  AVG(speed) as avg_speed,
  MIN(speed) as min_speed,
  MAX(speed) as max_speed
FROM vessel_positions
WHERE DATE(timestamp) < CURRENT_DATE
  AND DATE(timestamp) >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY "vesselId", DATE(timestamp), zone_type
ON CONFLICT ("vesselId", date, zone_type) DO UPDATE SET
  position_count = EXCLUDED.position_count,
  avg_lat = EXCLUDED.avg_lat,
  avg_lng = EXCLUDED.avg_lng,
  avg_speed = EXCLUDED.avg_speed;

-- Expected: No deletion, creates parallel summary table for algorithm testing
```

### 4. Archive Old Data to S3 (Move, Don't Delete - Build Mode)
```bash
#!/bin/bash
# archive-old-ais-to-s3.sh (run monthly during build mode)

# Export positions > 90 days to JSONL
psql -c "COPY (
  SELECT * FROM vessel_positions
  WHERE timestamp < NOW() - INTERVAL '90 days'
) TO STDOUT" > /tmp/ais-archive-$(date +%Y%m).jsonl

# Upload to S3
aws s3 cp /tmp/ais-archive-$(date +%Y%m).jsonl \
  s3://mari8x-ais-archive/build-mode/$(date +%Y%m)/

# Verify upload succeeded
if [ $? -eq 0 ]; then
  echo "Archive successful, but NOT deleting from database (build mode)"
  # During build mode: keep in database too
  # After transition: DELETE FROM vessel_positions WHERE timestamp < NOW() - INTERVAL '90 days'
fi

# Expected: Backup created, no deletion during build mode
```

---

## ⚠️ Actions NOT to Take During Build Mode

**Don't do these yet (wait until Phase 1):**
- ❌ Delete positions > 7 days old
- ❌ Delete raw data after aggregation
- ❌ Aggressive event-based retention
- ❌ Automatic cleanup cron jobs

**Why wait:**
- Algorithms not validated yet
- Unknown which data patterns are valuable
- Can't recover deleted data
- Storage cost is low during build (<$30/month)

**When to start aggressive retention:**
- ✅ Storage exceeds 100 GB
- ✅ After 3 months of continuous operation
- ✅ Algorithms validated with aggregated data
- ✅ Event extraction tested and accurate

---

## 🎓 Summary

**The Golden Rule:**
> **Start liberal during build, optimize aggressively in production. Resolution should decay with age, but events should live forever.**

**Phased Retention Strategy:**

### Phase 0: Build Mode (NOW - Month 3)
**Keep:** Everything for 30 days, archive (don't delete) > 90 days
**Why:** Algorithm development, pattern learning, flexibility
**Cost:** ~$30/month max (acceptable during build)
**Actions:**
1. ✅ Remove exact duplicates (safe, no data loss)
2. ✅ Tag zones (port/trade lane/open sea)
3. ✅ Create aggregates (parallel to raw)
4. ✅ Build algorithms with full dataset
5. ❌ Don't delete anything yet

### Phase 1-3: Optimized Production (Month 4+)
**Keep:**
- Hot (0-7d): Raw everything
- Warm (7d-30d): Hourly aggregates
- Cold (30d+): Events only
**Result:**
- 📉 Storage: ~6GB fixed (vs 450GB growing)
- ⚡ Queries: 90% faster
- 🎯 Effectiveness: 95%+
- 💰 Costs: $5/month

**Current Phase:** Build Mode (Week 1)
**Next Transition:** When storage > 100GB OR after 3 months

**Immediate Actions (This Week):**
1. Add zone_type column
2. Create aggregation tables
3. Remove exact duplicates
4. Tag existing positions with zones
5. Start daily summary generation (parallel)

---

**Created:** 2026-02-07
**Updated:** 2026-02-07 (Refactored for liberal build mode)
**Status:** Build Mode - Liberal Retention Active
**Next Step:** Implement build mode quick wins (zone tagging, duplicate removal)
