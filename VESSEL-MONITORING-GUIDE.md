# Vessel Monitoring Guide

**System:** ANKR Maritime / MARI8X
**Database:** ankr_maritime (3.4 GB after optimization)
**Last Updated:** 2026-02-13

---

## 📊 CURRENT STATUS

### Database Stats

| Metric | Count |
|--------|-------|
| Total Vessels | 54,962 |
| Vessels with Historical Data | 48,691 (hourly), 48,272 (daily) |
| Active Vessels (Last 24h) | 27,194 |
| Raw Position Records | 3.36 million (last 24 hours) |

### Data Retention

| Data Type | Retention | Records | Vessels |
|-----------|-----------|---------|---------|
| Raw positions | 24 hours | 3.36M | 27,194 |
| Minute aggregates | 7 days | Auto-populated | Going forward |
| Hourly aggregates | 90 days | 1.9M | 48,691 |
| Daily aggregates | 5 years | 199K | 48,272 |

---

## 🚢 MONITORING SCRIPT

Created: `/root/check-active-vessels.sh`

### Usage:

```bash
# Check vessels active in last 30 minutes
./check-active-vessels.sh 30

# Check last hour
./check-active-vessels.sh 60

# Check last 24 hours
./check-active-vessels.sh 1440

# Custom interval (in minutes)
./check-active-vessels.sh 360  # Last 6 hours
```

### What It Shows:

1. **Summary Statistics**
   - Number of active vessels in time period
   - Total position updates
   - Latest update timestamp
   - Data age

2. **Activity Breakdown**
   - Vessels by recency (0-5 min, 5-10 min, etc.)
   - Shows transmission patterns

3. **Top 10 Most Active Vessels**
   - Vessels transmitting most frequently
   - Useful for monitoring heavy transmitters

---

## 🔧 AUTOMATED MONITORING (Optional)

### Option 1: Cron Job (Every 30 Minutes)

```bash
# Edit crontab
crontab -e

# Add this line (runs every 30 minutes, saves to log)
*/30 * * * * /root/check-active-vessels.sh 30 >> /var/log/vessel-monitor.log 2>&1
```

### Option 2: Systemd Timer (More Reliable)

Create service file:
```bash
cat > /etc/systemd/system/vessel-monitor.service <<'EOF'
[Unit]
Description=Vessel Activity Monitor

[Service]
Type=oneshot
ExecStart=/root/check-active-vessels.sh 30
StandardOutput=append:/var/log/vessel-monitor.log
StandardError=append:/var/log/vessel-monitor.log
EOF

# Create timer
cat > /etc/systemd/system/vessel-monitor.timer <<'EOF'
[Unit]
Description=Run Vessel Monitor every 30 minutes

[Timer]
OnBootSec=5min
OnUnitActiveSec=30min

[Install]
WantedBy=timers.target
EOF

# Enable and start
systemctl daemon-reload
systemctl enable vessel-monitor.timer
systemctl start vessel-monitor.timer
```

---

## 📈 QUERY EXAMPLES

### Check Vessels Transmitting in Last 30 Minutes

```sql
SELECT
    COUNT(DISTINCT "vesselId") as active_vessels,
    COUNT(*) as position_updates
FROM vessel_positions
WHERE timestamp > NOW() - INTERVAL '30 minutes';
```

### Find Specific Vessel Activity

```sql
SELECT
    v.name,
    v.imo,
    COUNT(*) as positions,
    MAX(vp.timestamp) as last_seen
FROM vessel_positions vp
JOIN vessels v ON v.id = vp."vesselId"
WHERE vp.timestamp > NOW() - INTERVAL '30 minutes'
AND v.name ILIKE '%ship_name%'
GROUP BY v.id, v.name, v.imo;
```

### Vessels Not Transmitting (Silent Vessels)

```sql
-- Vessels with no position in last 30 minutes but had positions before
SELECT
    v.id,
    v.name,
    v.imo,
    MAX(vp.timestamp) as last_position
FROM vessels v
LEFT JOIN vessel_positions vp ON v.id = vp."vesselId"
WHERE v.id IN (
    SELECT DISTINCT "vesselId"
    FROM vessel_positions
    WHERE timestamp > NOW() - INTERVAL '24 hours'
)
AND v.id NOT IN (
    SELECT DISTINCT "vesselId"
    FROM vessel_positions
    WHERE timestamp > NOW() - INTERVAL '30 minutes'
)
GROUP BY v.id, v.name, v.imo
ORDER BY last_position DESC
LIMIT 20;
```

### Vessel Transmission Rate

```sql
-- Check how often vessels are transmitting
SELECT
    "vesselId",
    v.name,
    COUNT(*) as positions,
    ROUND(COUNT(*) / 30.0, 2) as positions_per_minute,
    MIN(timestamp) as first_position,
    MAX(timestamp) as last_position
FROM vessel_positions vp
JOIN vessels v ON v.id = vp."vesselId"
WHERE timestamp > NOW() - INTERVAL '30 minutes'
GROUP BY "vesselId", v.name
ORDER BY positions DESC
LIMIT 20;
```

---

## ⚠️ IMPORTANT NOTES

### AIS Data Ingestion Service

**Status:** The `ankr-wms-backend` service is currently **STOPPED** (crashed 598 times).

This service may handle AIS data ingestion. Last position update was **6 hours ago** (04:04:13).

**TODO:**
1. Investigate why `ankr-wms-backend` is crashing
2. Fix the service
3. Restart to resume AIS data ingestion

```bash
# Check why it's crashing
pm2 logs ankr-wms-backend --lines 100

# View error logs
cat /root/.pm2/logs/ankr-wms-backend-error.log
```

### Data Freshness

With the optimized system:
- **Real-time data:** Last 24 hours (raw, every few seconds)
- **Recent data:** 7 days (minute aggregates, 1 per vessel per minute)
- **Historical data:** 90 days (hourly), 5 years (daily)

### Query Performance

**For dashboards:**
- Last 24 hours → Query `vessel_positions` (raw data)
- Last 7 days → Query `vessel_positions_minute` (aggregates)
- Older than 7 days → Query `vessel_positions_hourly` or `vessel_positions_daily`

---

## 🎯 RECOMMENDED WORKFLOW

### Daily Monitoring (Automated)

1. **Every 30 minutes:** Run vessel monitor script
2. **Check:** Number of active vessels
3. **Alert if:**
   - Active vessels drop below threshold (e.g., < 5,000)
   - No new data for > 1 hour
   - Specific critical vessels go silent

### Weekly Review

1. **Check database size:** Should stay around 3-4 GB
2. **Verify retention:** Old data being auto-deleted
3. **Review transmission patterns:** Identify issues

### Monthly Analysis

1. **Vessel coverage:** How many unique vessels tracked
2. **Data quality:** Transmission frequency and gaps
3. **Storage optimization:** Adjust retention if needed

---

## 📞 TROUBLESHOOTING

### No New AIS Data

```bash
# 1. Check AIS ingestion service
pm2 list | grep -E "maritime|wms|ais"

# 2. Check latest data age
sudo -u postgres psql -d ankr_maritime -c "SELECT MAX(timestamp), NOW() - MAX(timestamp) as age FROM vessel_positions;"

# 3. Check service logs
pm2 logs ankr-wms-backend --lines 50

# 4. Restart if needed
pm2 restart ankr-wms-backend
```

### Database Growing Too Fast

```bash
# Check current size
sudo -u postgres psql -d ankr_maritime -c "SELECT pg_size_pretty(pg_database_size('ankr_maritime'));"

# Check retention policies
sudo -u postgres psql -d ankr_maritime -c "SELECT * FROM timescaledb_information.jobs WHERE proc_name = 'policy_retention';"

# Manually drop old chunks if needed
sudo -u postgres psql -d ankr_maritime -c "SELECT drop_chunks('vessel_positions', INTERVAL '24 hours');"
```

### Monitoring Script Not Working

```bash
# Make sure it's executable
chmod +x /root/check-active-vessels.sh

# Test manually
/root/check-active-vessels.sh 60

# Check PostgreSQL access
sudo -u postgres psql -d ankr_maritime -c "SELECT 1;"
```

---

## 📊 EXPECTED METRICS

Based on current data:

| Metric | Value | Notes |
|--------|-------|-------|
| Total vessels in system | ~55,000 | Master vessel database |
| Vessels with historical data | ~48,000 | In hourly/daily aggregates |
| Currently active vessels | ~27,000 | Transmitting in last 24h |
| Transmission rate | Variable | Some every 3s, others every 15min |
| Database size | 3-4 GB | After optimization |
| Daily growth | 1-2 GB | With 24h retention |

---

**Created:** 2026-02-13
**Purpose:** Monitor 30-minute vessel activity intervals as requested
**Related:** /root/AIS-OPTIMIZATION-SUCCESS-REPORT.md
