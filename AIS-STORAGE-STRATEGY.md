# AIS Data Storage Strategy - Seeding Phase (2-3 Months)

**Current Situation:**
- **Disk Usage:** 92% (170GB/187GB, 17GB free)
- **AIS Data:** 68.5M positions (~1 week)
- **Growth Rate:** 25M positions/day
- **Projection:** 150GB (Month 1) → 300GB (Month 2) → 450GB (Month 3)
- **Seeding Phase:** Need to collect liberally for 2-3 months

**Problem:** Main disk has only 17GB free, but you need 450GB over 3 months! ⚠️

---

## 🎯 Recommended Solution: Multi-Tier Storage Strategy

### Option 1: Move PostgreSQL to Mounted Storage (RECOMMENDED ✅)

**Best Option Because:**
- ✅ Uses existing 19GB free on /mnt/storage (can expand volume)
- ✅ PostgreSQL performs well on modern SSD/NVMe mounted volumes
- ✅ Transparent to applications
- ✅ No code changes needed
- ✅ Can expand volume as needed

**Steps:**

1. **Stop PostgreSQL**
2. **Move data directory to mounted storage**
3. **Create symlink for transparency**
4. **Restart PostgreSQL**
5. **Verify everything works**

**Space Gained:** All PostgreSQL growth goes to mounted storage
**Downtime:** ~5-10 minutes
**Risk:** Low (easily reversible)

---

### Option 2: Add New Storage Volume (BEST for Long-term ✅✅)

**Request from your cloud provider:**
- **Minimum:** 200GB SSD volume (for 3-month seeding)
- **Recommended:** 500GB SSD volume (for safety + 6 months)
- **Mount at:** `/mnt/ais-data`

**Cost Estimate (typical cloud):**
- 200GB SSD: ~$20-30/month
- 500GB SSD: ~$50-75/month

**Why this is ideal:**
- ✅ Dedicated storage for AIS data
- ✅ No competition with other apps
- ✅ Can optimize mount options for time-series data
- ✅ Easy to expand later
- ✅ Can use cheaper storage tier

---

### Option 3: Expand Existing Mounted Volume (QUICK WIN ✅)

**Current:** /mnt/storage = 92GB total, 19GB free
**Expand to:** 300-500GB

**Pros:**
- ✅ Quickest to implement
- ✅ No new mounts to configure
- ✅ Leverages existing structure

**Cons:**
- ⚠️ Shared with other data (verdaccio, docker, projects)

---

## 📊 Storage Breakdown & Optimization

### Current Storage Tiers

| Tier | Location | Size | Purpose | Cost/GB/mo |
|------|----------|------|---------|------------|
| **Hot** | Main Disk (SSD) | 187GB | Active apps, code | High ($0.10-0.15) |
| **Warm** | /mnt/storage | 92GB | Mounted SSD | Medium ($0.08) |
| **Cold** | S3/Object Storage | Unlimited | Archives | Low ($0.02-0.03) |

### Optimal AIS Data Placement

```
Hot (Main Disk):
├── PostgreSQL metadata & indexes
├── Last 7 days raw positions (most accessed)
└── Current day aggregations

Warm (/mnt/storage or new volume):
├── PostgreSQL data files (8-90 days)
├── Aggregated summaries (90 days+)
└── Compressed historical positions

Cold (S3/Object Storage):
├── Raw positions > 90 days old
├── Infrequently accessed archives
└── Backup snapshots
```

---

## 🚀 Implementation Plan (Immediate Action)

### Phase 1: Immediate (Today) - Move PostgreSQL

**Current PostgreSQL Location:**
```bash
# Check current location
psql -U ankr -c "SHOW data_directory;"
# Likely: /var/lib/postgresql/XX/main
```

**Migration Script:**
```bash
#!/bin/bash
# migrate-postgres-to-storage.sh

set -e

PGDATA="/var/lib/postgresql/14/main"  # Adjust version
NEW_LOCATION="/mnt/storage/postgresql"
BACKUP_DIR="/mnt/storage/postgres-backup-$(date +%Y%m%d)"

echo "1️⃣ Stopping PostgreSQL..."
sudo systemctl stop postgresql

echo "2️⃣ Backing up current data..."
sudo cp -a "$PGDATA" "$BACKUP_DIR"

echo "3️⃣ Moving PostgreSQL to mounted storage..."
sudo mkdir -p "$NEW_LOCATION"
sudo rsync -av --remove-source-files "$PGDATA/" "$NEW_LOCATION/"
find "$PGDATA" -type d -empty -delete

echo "4️⃣ Creating symlink..."
sudo ln -s "$NEW_LOCATION" "$PGDATA"

echo "5️⃣ Setting permissions..."
sudo chown -R postgres:postgres "$NEW_LOCATION"
sudo chmod 700 "$NEW_LOCATION"

echo "6️⃣ Starting PostgreSQL..."
sudo systemctl start postgresql

echo "7️⃣ Verifying..."
psql -U ankr -c "SELECT version();"
psql -U ankr -c "SHOW data_directory;"

echo "✅ Migration complete!"
echo "📊 Space freed on main disk:"
df -h /
echo ""
echo "📊 New location:"
df -h /mnt/storage
```

**Expected Space Freed:** 5-10GB immediately, all future growth to mounted storage

---

### Phase 2: Short-term (This Week) - Optimize Current Data

**1. Enable PostgreSQL Compression**

```sql
-- For VesselPosition table (TimescaleDB)
ALTER TABLE vessel_positions SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'vessel_id',
  timescaledb.compress_orderby = 'timestamp DESC'
);

-- Compress chunks older than 7 days
SELECT add_compression_policy('vessel_positions', INTERVAL '7 days');
```

**Expected Savings:** 50-70% on compressed data (35-50GB over 3 months)

**2. Remove Duplicate Positions**

```sql
-- Safe deduplication (no data loss)
DELETE FROM vessel_positions a USING vessel_positions b
WHERE a.id > b.id
  AND a."vesselId" = b."vesselId"
  AND a.timestamp = b.timestamp
  AND a.latitude = b.latitude
  AND a.longitude = b.longitude;
```

**Expected Savings:** 5-10% (2-5GB)

**3. Implement Partitioning** (if not already)

```sql
-- Partition by month for easier management
SELECT create_hypertable(
  'vessel_positions',
  'timestamp',
  chunk_time_interval => INTERVAL '7 days'
);
```

---

### Phase 3: Medium-term (Next 2 Weeks) - Add Cold Storage

**1. Set Up S3/Object Storage**

```bash
# Install s3cmd or rclone
sudo apt install rclone -y

# Configure for your cloud provider
rclone config
```

**2. Archive Old Data**

```bash
#!/bin/bash
# archive-old-ais-data.sh

# Export positions older than 90 days
psql -U ankr -d ankr_maritime -c "
  COPY (
    SELECT * FROM vessel_positions
    WHERE timestamp < NOW() - INTERVAL '90 days'
  ) TO '/tmp/ais-archive-$(date +%Y%m).csv.gz'
  WITH (FORMAT CSV, HEADER, COMPRESSION gzip);
"

# Upload to S3
rclone copy /tmp/ais-archive-*.csv.gz s3:ankr-ais-archives/

# Delete archived data from database
psql -U ankr -d ankr_maritime -c "
  DELETE FROM vessel_positions
  WHERE timestamp < NOW() - INTERVAL '90 days';
"
```

**Expected Savings:** 100-200GB after 3 months
**Cost:** $2-6/month for S3 storage

---

### Phase 4: Automation (Next Month)

**Cron Job for Automated Archival:**

```bash
# /root/.ankr/scripts/archive-ais-data.sh

0 2 * * 0 /root/.ankr/scripts/archive-ais-data.sh >> /var/log/ais-archival.log 2>&1
```

---

## 💰 Cost-Benefit Analysis

### Scenario A: Do Nothing
- **Month 1:** Disk full, app crashes
- **Cost:** $0 upfront, ∞ downtime cost

### Scenario B: Move PostgreSQL to Mounted Storage
- **Immediate:** Free up 5-10GB
- **3 Months:** All DB growth on mounted storage
- **Cost:** $0 (using existing volume)
- **Savings:** Prevents disk full

### Scenario C: Add New 500GB Volume
- **Immediate:** 500GB available for AIS data
- **3 Months:** 150GB used, 350GB free
- **Cost:** $50-75/month
- **Savings:** Peace of mind, room to grow

### Scenario D: Optimize + Archive (Full Strategy)
- **Compression:** 50% savings = 225GB instead of 450GB
- **Archival:** Move >90 days to S3 = 100GB saved
- **Net Growth:** ~125GB over 3 months
- **Cost:** $20-30/month (S3) + $0 (using existing volume)

---

## 🎯 Recommended Action Plan

**For Your Situation (2-3 Month Seeding Phase):**

### Immediate (Today/Tomorrow):
1. ✅ **Move PostgreSQL to /mnt/storage** (saves 5-10GB, future-proof)
2. ✅ **Enable TimescaleDB compression** (50% savings)
3. ✅ **Remove duplicates** (5-10% savings)

### This Week:
4. ✅ **Request 300-500GB volume from cloud provider** (if budget allows)
   - OR expand /mnt/storage to 300GB minimum
5. ✅ **Set up S3 archival pipeline**

### Next 2 Weeks:
6. ✅ **Test archival workflow** with old data
7. ✅ **Monitor growth rate** and adjust

### Monthly:
8. ✅ **Archive data >90 days** to S3
9. ✅ **Review storage usage** with `ankr-status`
10. ✅ **Compress older chunks** automatically

---

## 📈 3-Month Projection

### Without Optimization:
```
Month 1: 150GB → Disk full ❌
Month 2: Can't continue ❌
```

### With PostgreSQL Move + Compression:
```
Month 1: 75GB on mounted (compressed)
Month 2: 150GB on mounted (50% compressed)
Month 3: 225GB on mounted (50% compressed)
Total: 225GB needed
```

### With Full Strategy (Move + Compress + Archive):
```
Month 1: 75GB on mounted, 0GB archived
Month 2: 75GB on mounted, 75GB archived to S3
Month 3: 75GB on mounted, 150GB archived to S3
Total: 75GB on disk + 150GB on S3 = Fits easily!
```

---

## 🔧 Quick Decision Matrix

| Situation | Action | Cost | Timeline |
|-----------|--------|------|----------|
| **Budget flexible** | Add 500GB volume | $50-75/mo | 1-2 days |
| **Limited budget** | Move PostgreSQL + Compress | $0 | Today |
| **Quick fix** | Expand /mnt/storage | $20-40/mo | Hours |
| **Long-term** | Full strategy (all above) | $70-100/mo | 1 week |

---

## 🎬 Next Steps

**Tell me which approach you prefer:**

1. **Quick Fix:** Move PostgreSQL to mounted storage today (Free, 1 hour)
2. **Balanced:** Move PostgreSQL + Request new 300GB volume ($30/mo, 2 days)
3. **Premium:** New 500GB volume + Full optimization ($75/mo, 1 week setup)
4. **DIY:** I'll provide scripts and you handle cloud provider volume expansion

**I can help you:**
- ✅ Write migration scripts
- ✅ Set up compression and archival
- ✅ Create monitoring dashboards
- ✅ Estimate exact costs for your cloud provider

What's your budget and timeline preference?
