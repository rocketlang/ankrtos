# AIS Stream Data Optimization - I/O & Storage Solution

**Issue:** AIS streaming data causing massive I/O load and disk usage
**Current State:** Raw vessel positions stored every few seconds
**Goal:** Streamline to store only aggregated data (every few minutes)

---

## 🔴 CURRENT PROBLEM

### Database Analysis

```
ankr_maritime Database: 164 GB total

TimescaleDB Hypertables:
├─ vessel_positions (raw AIS stream)  → 164 GB  ⚠️
│  ├─ Feb 6: 50 GB  (1 day!)
│  ├─ Feb 5: 37 GB
│  ├─ Feb 9: 23 GB
│  ├─ Feb 7: 22 GB
│  └─ Feb 8: 22 GB
│  Retention: 6 months
│  Frequency: EVERY FEW SECONDS
│
├─ vessel_positions_hourly           → Small
│  Retention: 90 days
│
└─ vessel_positions_daily            → Small
   Retention: 1825 days (5 years)
```

### Impact:

1. **Storage:** ~30-50 GB/day growth rate
2. **Write I/O:** Continuous writes every few seconds
3. **Backup I/O:** R1Soft backing up 164GB → system hangs
4. **Query Performance:** Slow due to massive dataset

---

## 💡 SOLUTION: Multi-Tier AIS Data Strategy

### Tier 1: Real-Time Buffer (5 minutes)
- Store raw AIS ticks for **5 minutes only**
- Auto-delete after aggregation
- For real-time dashboard only

### Tier 2: Minute Aggregates (7 days)
- Aggregate to **1-minute intervals**
- Keep for 7 days
- For recent tracking and playback

### Tier 3: Hourly Aggregates (90 days)
- Already exists: `vessel_positions_hourly`
- Keep for 90 days
- For historical analysis

### Tier 4: Daily Aggregates (5 years)
- Already exists: `vessel_positions_daily`
- Keep for 5 years
- For long-term trends

---

## 🛠️ IMPLEMENTATION

### Option A: **Aggressive Cleanup** (Immediate Relief) ⚡

**Impact:** Reduce database from 164GB → ~20GB

```sql
-- Connect to database
sudo -u postgres psql -d ankr_maritime

-- 1. Drop old raw data (keep only last 7 days)
SELECT drop_chunks('vessel_positions', INTERVAL '7 days');

-- 2. Shorten retention to 7 days (was 6 months)
SELECT remove_retention_policy('vessel_positions');
SELECT add_retention_policy('vessel_positions', INTERVAL '7 days');

-- 3. Compress old chunks (if needed)
ALTER TABLE vessel_positions SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'vesselId'
);

SELECT add_compression_policy('vessel_positions', INTERVAL '1 day');

-- 4. Vacuum to reclaim space
VACUUM FULL vessel_positions;
```

**Expected Result:**
- Database size: 164GB → ~20GB (saves 144GB)
- Backup time: Much faster
- I/O load: 80% reduction

---

### Option B: **Create Minute Aggregates** (Better Long-term) 🎯

#### Step 1: Create minute-aggregated materialized view

```sql
-- Connect to database
sudo -u postgres psql -d ankr_maritime

-- Create continuous aggregate for 1-minute intervals
CREATE MATERIALIZED VIEW vessel_positions_minute
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 minute', timestamp) AS minute,
    vesselId,
    -- Use last value for each minute (most recent position)
    LAST(latitude, timestamp) AS latitude,
    LAST(longitude, timestamp) AS longitude,
    LAST(speed, timestamp) AS speed,
    LAST(heading, timestamp) AS heading,
    LAST(course, timestamp) AS course,
    LAST(status, timestamp) AS status,
    LAST(destination, timestamp) AS destination,
    LAST(source, timestamp) AS source,
    -- Keep stats
    COUNT(*) AS tick_count,
    AVG(speed) AS avg_speed,
    MAX(speed) AS max_speed
FROM vessel_positions
GROUP BY minute, vesselId;

-- Add retention policy (keep 7 days)
SELECT add_retention_policy('vessel_positions_minute', INTERVAL '7 days');

-- Refresh policy (update every 5 minutes)
SELECT add_continuous_aggregate_policy('vessel_positions_minute',
    start_offset => INTERVAL '10 minutes',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '5 minutes');
```

#### Step 2: Modify AIS ingestion to reduce write frequency

Edit `/root/apps/ankr-maritime/backend/src/services/aisstream-service.ts`:

```typescript
// Add aggregation buffer
const positionBuffer = new Map<string, VesselPosition>();
const BUFFER_INTERVAL = 60000; // 1 minute

// Instead of writing every tick, buffer and write every minute
function bufferPosition(position: VesselPosition) {
  const key = position.vesselId;
  const existing = positionBuffer.get(key);

  // Keep only the latest position per vessel per minute
  if (!existing || position.timestamp > existing.timestamp) {
    positionBuffer.set(key, position);
  }
}

// Flush buffer every minute
setInterval(async () => {
  const positions = Array.from(positionBuffer.values());
  if (positions.length > 0) {
    await batchInsertPositions(positions);
    positionBuffer.clear();
  }
}, BUFFER_INTERVAL);
```

#### Step 3: Update application queries

Change queries from `vessel_positions` → `vessel_positions_minute`:

```typescript
// OLD (queries raw data every second)
const positions = await db.vessel_positions.findMany({
  where: { vesselId, timestamp: { gte: lastHour } }
});

// NEW (queries minute aggregates)
const positions = await db.vessel_positions_minute.findMany({
  where: { vesselId, minute: { gte: lastHour } }
});
```

---

### Option C: **Hybrid Approach** (Recommended) 🏆

**Combine both approaches:**

1. **Enable minute aggregates** (Option B)
2. **Drop old raw data** (Option A - keep only 24 hours)
3. **Reduce write frequency** to 1-minute intervals

```sql
-- 1. Create minute aggregates
-- (Run Option B Step 1 queries)

-- 2. Set aggressive retention for raw data (24 hours only)
SELECT remove_retention_policy('vessel_positions');
SELECT add_retention_policy('vessel_positions', INTERVAL '24 hours');

-- 3. Drop old chunks immediately
SELECT drop_chunks('vessel_positions', INTERVAL '24 hours');

-- 4. Enable compression
ALTER TABLE vessel_positions SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'vesselId',
  timescaledb.compress_orderby = 'timestamp DESC'
);

SELECT add_compression_policy('vessel_positions', INTERVAL '2 hours');
```

**Expected Result:**
- Raw data: Only 24 hours (~30-50GB → ~1-2GB)
- Minute data: 7 days (~2-3GB)
- Hourly data: 90 days (~500MB)
- Daily data: 5 years (~100MB)
- **Total: ~6GB instead of 164GB**
- **I/O reduction: 95%+**

---

## 📊 COMPARISON

| Metric | Current | Option A | Option B | Option C |
|--------|---------|----------|----------|----------|
| Database Size | 164 GB | 20 GB | 40 GB | 6 GB ✅ |
| Daily Growth | 30-50 GB | 4-7 GB | 10-15 GB | 1-2 GB ✅ |
| Write I/O | Very High | High | Medium | Low ✅ |
| Backup Time | 2-3 hours | 30 min | 1 hour | 15 min ✅ |
| Query Speed | Slow | Medium | Fast | Fast ✅ |
| Data Granularity | Seconds | Seconds (7d) | Minutes | Best ✅ |

---

## 🚀 RECOMMENDED ACTION PLAN

### Phase 1: Immediate Relief (Today)

```bash
# 1. Create minute aggregates
sudo -u postgres psql -d ankr_maritime -f /root/create-minute-aggregates.sql

# 2. Drop old raw data (keep 24 hours)
sudo -u postgres psql -d ankr_maritime <<EOF
SELECT drop_chunks('vessel_positions', INTERVAL '24 hours');
SELECT remove_retention_policy('vessel_positions');
SELECT add_retention_policy('vessel_positions', INTERVAL '24 hours');
VACUUM FULL vessel_positions;
EOF

# 3. Restart maritime services
pm2 restart ankr-maritime-watcher
```

### Phase 2: Modify AIS Ingestion (This Week)

1. Edit `aisstream-service.ts` to buffer writes (1-minute intervals)
2. Test with sample vessels
3. Deploy to production
4. Monitor I/O reduction

### Phase 3: Update Application (Next Week)

1. Update all queries to use `vessel_positions_minute`
2. Keep real-time dashboard using `vessel_positions` (24h only)
3. Historical views use minute/hourly/daily aggregates
4. Remove old code paths

---

## 📈 MONITORING

### Check database size reduction:

```bash
# Before
sudo -u postgres psql -d ankr_maritime -c "SELECT pg_size_pretty(pg_database_size('ankr_maritime'));"

# After cleanup (should see immediate reduction)
sudo -u postgres psql -d ankr_maritime -c "SELECT pg_size_pretty(pg_database_size('ankr_maritime'));"

# Check chunk sizes
sudo -u postgres psql -d ankr_maritime -c "
SELECT
  format('%I.%I', chunk_schema, chunk_name)::regclass as chunk,
  pg_size_pretty(pg_total_relation_size(format('%I.%I', chunk_schema, chunk_name)::regclass)) as size,
  range_start,
  range_end
FROM timescaledb_information.chunks
WHERE hypertable_name = 'vessel_positions'
ORDER BY range_start DESC
LIMIT 10;
"
```

### Monitor I/O:

```bash
# Watch disk I/O
iostat -x 5

# Check PostgreSQL write activity
sudo -u postgres psql -d ankr_maritime -c "
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  n_tup_ins as inserts,
  n_tup_upd as updates
FROM pg_stat_user_tables
WHERE tablename LIKE 'vessel%'
ORDER BY n_tup_ins DESC;
"
```

---

## ✅ EXPECTED RESULTS

**After implementing Option C (Hybrid):**

1. **Disk Usage:**
   - ankr_maritime: 164GB → 6GB (97% reduction)
   - Daily growth: 30-50GB → 1-2GB (95% reduction)

2. **I/O Performance:**
   - Write I/O: 95% reduction (fewer writes per minute)
   - Backup I/O: 97% reduction (6GB vs 164GB)
   - **Server should NOT hang during backup**

3. **Query Performance:**
   - Faster queries (smaller dataset)
   - Better indexes on aggregated views

4. **Cost Savings:**
   - Backup completes in 15 min vs 2-3 hours
   - Less disk wear
   - Room for more data

---

## 🎯 NEXT STEPS

**Choose one:**

- [ ] **Option A**: Quick cleanup (20 min, 85% reduction)
- [ ] **Option B**: Minute aggregates (2 hours, better architecture)
- [x] **Option C**: Hybrid (3 hours, 97% reduction) ← **RECOMMENDED**

**Need help?** Reply with:
- Which option to implement?
- Should I create the SQL scripts?
- Want me to modify the AIS ingestion code?

---

**Generated:** 2026-02-13 09:25 IST
**Related:** /root/SERVER-HANG-DIAGNOSIS-AND-FIX.md
