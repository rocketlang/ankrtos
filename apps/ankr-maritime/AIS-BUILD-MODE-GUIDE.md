# AIS Data Retention - Build Mode Guide

## 🚧 Current Phase: Build Mode (Liberal Retention)

**Philosophy:** Keep more data while building algorithms, optimize later

### Why Build Mode?

- **Current data:** Only 1 week old (~68M positions, ~14GB)
- **Storage cost:** Negligible during build phase ($10-30/month)
- **Flexibility:** Can't recover deleted data, can always delete later
- **Algorithm development:** Need rich historical data to test and validate
- **Learning phase:** Understanding real AIS patterns before optimizing

### Build Mode Retention Policy

```
✅ Keep:      All raw positions for 30+ days
✅ Aggregate: Create daily summaries (parallel, don't delete raw)
✅ Tag:       Classify zones (port/trade lane/open sea)
✅ Remove:    Only exact duplicates (100% safe)
❌ Don't:     Delete any valuable position data yet
```

## 🚀 Quick Start

### Step 1: Run Initial Setup (One-Time)

```bash
cd /root/apps/ankr-maritime/backend
tsx src/scripts/implement-build-mode-retention.ts
```

**What it does:**
1. ✅ Adds `zone_type` column to vessel_positions
2. ✅ Removes exact duplicates (safe, no information loss)
3. ✅ Tags port zones (20km radius around ports)
4. ✅ Tags open sea positions
5. ✅ Creates `ais_daily_summaries` table
6. ✅ Generates initial daily summaries (last 7 days)
7. ✅ Shows storage statistics and transition timeline

**Expected output:**
```
🚧 AIS Build Mode Retention - Safe Implementation
================================================

Step 1: Adding zone_type column...
✅ zone_type column added

Step 2: Removing exact duplicates...
✅ Removed 3,421 exact duplicate positions

Step 3: Tagging port zones...
✅ Tagged 12,345,678 positions as 'port' zone

Step 4: Tagging open sea positions...
✅ Tagged 56,123,456 positions as 'open_sea'

📊 Current AIS Data Statistics
==============================

Zone: port
  Positions: 12,345,678
  Vessels: 3,210
  Avg positions/vessel: 3,845.67
  Time range: 2026-01-31 → 2026-02-07

Zone: open_sea
  Positions: 56,123,456
  Vessels: 8,932
  Avg positions/vessel: 6,285.12
  Time range: 2026-01-31 → 2026-02-07

💾 Storage Estimation
=====================

Raw positions: 68,469,134 (~12.76 GB)
Daily summaries: 4,521 (~0.00 GB)
Total: ~12.76 GB

📅 Transition Planning
=====================

Current storage: 12.76 GB
Growing at: ~4.66 GB/day
Days until 100GB: ~18 days
Estimated transition date: 2026-02-25
```

### Step 2: Set Up Daily Automation (Optional)

```bash
# Add to crontab
crontab -e

# Add this line (runs at 3 AM daily):
0 3 * * * /root/apps/ankr-maritime/backend/src/scripts/daily-ais-summary-build-mode.sh
```

**What the daily script does:**
1. Tags any new positions with zones
2. Removes exact duplicates
3. Generates yesterday's daily summaries
4. Checks storage status (warns if approaching 100GB)
5. Does NOT delete any raw data (build mode)

## 📊 Monitoring Storage Growth

### Check Current Status

```bash
# Quick storage check
cd /root/apps/ankr-maritime/backend
tsx src/scripts/implement-build-mode-retention.ts
```

### Watch for Transition Triggers

**Transition to aggressive retention when ANY of these occur:**

1. ✅ Storage exceeds 100 GB
2. ✅ 3 months of continuous data
3. ✅ Algorithms validated with aggregated data
4. ✅ Storage costs exceed $50/month

### Manual Storage Check

```sql
-- Total positions and estimated storage
SELECT
  COUNT(*) as total_positions,
  ROUND(COUNT(*) * 200.0 / 1024 / 1024 / 1024, 2) as storage_gb
FROM vessel_positions;

-- Breakdown by zone
SELECT
  zone_type,
  COUNT(*) as positions,
  ROUND(COUNT(*) * 200.0 / 1024 / 1024 / 1024, 2) as storage_gb,
  COUNT(DISTINCT "vesselId") as vessels
FROM vessel_positions
GROUP BY zone_type
ORDER BY positions DESC;
```

## 🎯 What Gets Kept vs Deleted

### ✅ Currently Keeping (Build Mode)

- **All raw positions** < 30 days old
- **All raw positions** even if > 30 days (for now)
- **Daily summaries** (parallel to raw data)
- **Zone classifications** (metadata only)

### ❌ Currently Removing (Safe Only)

- **Exact duplicates:** 100% identical positions (same vessel, timestamp, location, speed)
- **Nothing else:** No deletions during build mode

### ⏭️ Future Deletions (After Transition)

When storage > 100GB, will start deleting:
- Raw positions > 7 days old (keep aggregates)
- Open sea positions > 30 days old
- Port zone positions > 7 days old (keep events)

## 📈 Storage Projections

### Build Mode (Current)

```
Week 1:  ~14 GB   ✅ Fine
Week 2:  ~47 GB   ✅ Fine
Week 3:  ~80 GB   ⚠️  Approaching transition
Week 4:  ~113 GB  🚨 Time to transition!
```

### After Transition (Aggressive Retention)

```
Month 1: ~150 GB (raw) → ~6 GB (optimized)  💾 96% reduction
Month 3: ~450 GB (raw) → ~6 GB (optimized)  💾 99% reduction
Year 1:  ~5.4 TB (raw) → ~6 GB (optimized)  💾 99.9% reduction
```

Fixed size ~6GB regardless of age!

## 🔬 Algorithm Development Tips

### Use Both Raw + Summary Data

During build mode, you have access to:
1. **Raw positions:** Full fidelity, all fields
2. **Daily summaries:** Aggregated, faster queries

**Recommended approach:**
```sql
-- Test with raw data (accurate but slow)
SELECT AVG(speed) FROM vessel_positions
WHERE "vesselId" = 'ABC123'
  AND DATE(timestamp) = '2026-02-06';

-- Test with summary data (fast but aggregated)
SELECT avg_speed FROM ais_daily_summaries
WHERE "vesselId" = 'ABC123'
  AND date = '2026-02-06';

-- Compare results!
-- If summary is 95%+ accurate → you can delete raw later
-- If summary loses important info → keep raw longer
```

### Validate Event Extraction

Before deleting port zone data, validate event extraction:
```sql
-- Build event-based table (test)
CREATE TEMP TABLE test_port_events AS
SELECT
  "vesselId",
  timestamp,
  latitude,
  longitude,
  speed,
  LAG(zone_type) OVER (PARTITION BY "vesselId" ORDER BY timestamp) as prev_zone,
  zone_type,
  CASE
    WHEN LAG(zone_type) OVER (PARTITION BY "vesselId" ORDER BY timestamp) = 'open_sea'
         AND zone_type = 'port' THEN 'ARRIVAL'
    WHEN LAG(zone_type) OVER (PARTITION BY "vesselId" ORDER BY timestamp) = 'port'
         AND zone_type = 'open_sea' THEN 'DEPARTURE'
    WHEN speed < 0.5 AND LAG(speed) OVER (PARTITION BY "vesselId" ORDER BY timestamp) >= 0.5
         THEN 'ANCHORING_START'
    WHEN speed >= 0.5 AND LAG(speed) OVER (PARTITION BY "vesselId" ORDER BY timestamp) < 0.5
         THEN 'ANCHORING_END'
  END as event_type
FROM vessel_positions
WHERE zone_type = 'port'
  AND timestamp > NOW() - INTERVAL '7 days';

-- Check: Does this capture all important events?
SELECT event_type, COUNT(*) FROM test_port_events
WHERE event_type IS NOT NULL
GROUP BY event_type;
```

## 🚨 When to Transition to Aggressive Retention

### Transition Checklist

Before transitioning, ensure:

- [ ] Algorithms tested with aggregated data
- [ ] Event extraction validated (arrivals/departures work)
- [ ] Storage exceeds 100GB OR 3 months passed
- [ ] Backup of raw data to S3 completed
- [ ] Team alignment on transition timing

### Transition Steps

1. **Backup everything to S3**
   ```bash
   # Export all positions > 30 days
   pg_dump -t vessel_positions > /tmp/ais-backup-$(date +%Y%m%d).sql
   aws s3 cp /tmp/ais-backup-$(date +%Y%m%d).sql s3://mari8x-ais-archive/
   ```

2. **Switch to aggressive retention script**
   ```bash
   # Stop build mode cron
   crontab -e
   # Comment out: # 0 3 * * * .../daily-ais-summary-build-mode.sh

   # Enable aggressive retention (see AIS-DATA-RETENTION-STRATEGY.md Phase 1)
   # 0 2 * * * .../aggressive-ais-retention.sh
   ```

3. **Monitor algorithm performance**
   - Check that port congestion dashboard still works
   - Verify voyage predictions maintain accuracy
   - Ensure route extraction doesn't degrade

## 📚 Related Documents

- **Strategy:** `/root/apps/ankr-maritime/AIS-DATA-RETENTION-STRATEGY.md`
  - Comprehensive retention strategy (all phases)
  - Mathematical models and projections
  - Event-based retention techniques

- **Scripts:**
  - `/backend/src/scripts/implement-build-mode-retention.ts` - Initial setup
  - `/backend/src/scripts/daily-ais-summary-build-mode.sh` - Daily automation

## 💡 Key Principles

1. **Start liberal:** Keep everything during build (1 week of data = negligible cost)
2. **Build in parallel:** Create aggregates WITHOUT deleting raw
3. **Validate first:** Test algorithms with aggregates before deleting raw
4. **Transition gradually:** Move to aggressive retention when storage > 100GB
5. **No regrets:** Can't recover deleted data, can always delete later

---

**Current Phase:** Build Mode (Week 1)
**Next Transition:** When storage > 100GB (~18 days at current growth rate)
**Last Updated:** 2026-02-07
