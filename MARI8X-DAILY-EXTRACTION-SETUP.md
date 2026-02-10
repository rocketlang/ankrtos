# Mari8X OSRM - Daily Route Extraction Setup

**Date:** 2026-02-09
**Status:** ✅ ACTIVE

---

## Overview

Automated daily extraction of vessel routes from AIS position data for Mari8x OSRM routing engine.

## Schedule

```
Time:     4:00 AM daily
After:    GFW sync (3:00 AM)
Duration: 5-15 minutes expected
Day:      Every day
```

## Components

### 1. Extraction Script

**Location:** `/root/apps/ankr-maritime/backend/scripts/run-daily-route-extraction.sh`

**What it does:**
- Locks to prevent concurrent runs
- Counts routes before extraction
- Runs trajectory-based route extraction (Method 1)
- Counts routes after extraction
- Reports statistics by vessel type
- Auto-triggers OSRM re-export if 50+ new routes
- Logs everything with timestamps

**Exit codes:**
- `0` = Success
- `1` = Lock file exists (another process running)
- Other = Extraction failed (check logs)

### 2. Cron Job

**Schedule:** `0 4 * * *`

**Full command:**
```bash
/root/apps/ankr-maritime/backend/scripts/run-daily-route-extraction.sh \
  >> /root/logs/mari8x/route-extraction-cron.log 2>&1
```

**Crontab entry:**
```cron
# Mari8x OSRM - Daily Route Extraction (4:00 AM)
# Runs after GFW sync (3:00 AM) to extract vessel routes from AIS data
# Expected duration: 5-15 minutes
# Logs: /root/logs/mari8x/route-extraction.log
0 4 * * * /root/apps/ankr-maritime/backend/scripts/run-daily-route-extraction.sh >> /root/logs/mari8x/route-extraction-cron.log 2>&1
```

### 3. Logs

**Main log:** `/root/logs/mari8x/route-extraction.log`
- Timestamped extraction runs
- Before/after route counts
- Statistics by vessel type
- Success/failure status

**Cron log:** `/root/logs/mari8x/route-extraction-cron.log`
- Cron execution output
- Any stderr messages
- Script-level errors

## Monitoring

### Check Last Run Status
```bash
tail -50 /root/logs/mari8x/route-extraction.log
```

### Check Current Route Count
```bash
sudo -u postgres psql -d ankr_maritime -c "
  SELECT COUNT(*) as total_routes FROM extracted_ais_routes;
"
```

### View Extraction History
```bash
grep "New routes extracted:" /root/logs/mari8x/route-extraction.log | tail -10
```

### Check for Errors
```bash
grep -i "error\|failed" /root/logs/mari8x/route-extraction.log | tail -20
```

### Monitor Real-time (during run)
```bash
tail -f /root/logs/mari8x/route-extraction.log
```

## Expected Growth

Based on 10 days of data producing 102 routes:

| Day | Expected Routes | Daily Growth | Cumulative |
|-----|----------------|--------------|------------|
| 10  | 102            | -            | Baseline   |
| 20  | ~250           | ~15/day      | +148       |
| 30  | ~500           | ~25/day      | +250       |
| 60  | ~1,500         | ~30/day      | +1,000     |
| 90  | ~3,000         | ~50/day      | +1,500     |

**Growth factors:**
- More vessels complete port-to-port voyages
- Pattern confidence increases with repetition
- Geographic coverage expands
- More vessel types included

## Auto OSRM Re-export

**Trigger:** 50+ new routes in single extraction

**Actions:**
1. Runs `osrm-json-to-osm.ts` automatically
2. Exports updated routes to OSM format
3. Logs success/failure

**Manual steps required:**
```bash
cd /root/apps/ankr-maritime/backend

# 1. Extract
docker run -t -v $(pwd):/data osrm/osrm-backend \
  osrm-extract -p /opt/car.lua /data/osrm-full-graph.osm

# 2. Partition
docker run -t -v $(pwd):/data osrm/osrm-backend \
  osrm-partition /data/osrm-full-graph.osrm

# 3. Customize
docker run -t -v $(pwd):/data osrm/osrm-backend \
  osrm-customize /data/osrm-full-graph.osrm

# 4. Restart server
docker stop mari8x-osrm && docker rm mari8x-osrm
docker run -d --name mari8x-osrm -p 5000:5000 \
  -v $(pwd):/data osrm/osrm-backend \
  osrm-routed --algorithm mld /data/osrm-full-graph.osrm
```

## Manual Execution

### Run Extraction Now (test)
```bash
/root/apps/ankr-maritime/backend/scripts/run-daily-route-extraction.sh
```

### Check if Running
```bash
ps aux | grep route-extraction
ls -la /tmp/route-extraction.lock 2>/dev/null
```

### Force Run (remove lock)
```bash
rm -f /tmp/route-extraction.lock
/root/apps/ankr-maritime/backend/scripts/run-daily-route-extraction.sh
```

## Troubleshooting

### Extraction Not Running

**Check cron service:**
```bash
systemctl status cron
```

**Check crontab:**
```bash
crontab -l | grep route-extraction
```

**Check logs for errors:**
```bash
tail -100 /root/logs/mari8x/route-extraction-cron.log
```

### Lock File Stuck

**Check if process actually running:**
```bash
ps aux | grep tsx | grep extract
```

**Remove lock if stuck:**
```bash
rm -f /tmp/route-extraction.lock
```

### No New Routes Extracted

**Check AIS data freshness:**
```bash
sudo -u postgres psql -d ankr_maritime -c "
  SELECT
    MAX(timestamp) as latest_position,
    COUNT(*) as positions_last_24h
  FROM vessel_positions
  WHERE timestamp >= NOW() - INTERVAL '24 hours';
"
```

**Check vessel completions:**
```bash
sudo -u postgres psql -d ankr_maritime -c "
  SELECT
    \"vesselId\",
    COUNT(*) as position_count,
    MIN(timestamp) as first_seen,
    MAX(timestamp) as last_seen
  FROM vessel_positions
  WHERE timestamp >= NOW() - INTERVAL '24 hours'
  GROUP BY \"vesselId\"
  HAVING COUNT(*) > 50
  LIMIT 10;
"
```

### Extraction Taking Too Long

**Normal duration:** 5-15 minutes
**Check progress:**
```bash
tail -f /root/logs/mari8x/route-extraction.log
```

**If stuck > 30 minutes:**
```bash
# Find process
ps aux | grep "extract-all-vessel-routes"

# Kill if needed
pkill -f "extract-all-vessel-routes"
rm -f /tmp/route-extraction.lock
```

## Performance Metrics

### Current Baseline (Day 10)
```
Routes:           102
Quality Score:    0.94-0.97
Distance Factor:  1.38x
Vessel Types:     2 (container, general_cargo)
```

### Success Criteria
- ✅ Extraction completes in <15 minutes
- ✅ Quality scores remain >0.7
- ✅ Distance factors stay 1.1-2.0x
- ✅ No extraction failures for 7+ days
- ✅ New routes added daily

## Integration Points

### GraphQL API
Routes available via:
```graphql
query {
  extractedRoutes(vesselType: "container") {
    id
    vesselType
    originPortId
    destPortId
    actualSailedNm
    qualityScore
    distanceFactor
  }
}
```

### OSRM Routing API
Routes processed through OSRM:
```bash
curl "http://localhost:5000/route/v1/driving/LON1,LAT1;LON2,LAT2"
```

### Database Direct
```sql
SELECT * FROM extracted_ais_routes
WHERE "extractedAt" >= NOW() - INTERVAL '24 hours'
ORDER BY "qualityScore" DESC;
```

## Maintenance

### Weekly Check (Recommended)
```bash
# 1. Check growth rate
grep "New routes extracted:" /root/logs/mari8x/route-extraction.log | tail -7

# 2. Check errors
grep -i "error\|failed" /root/logs/mari8x/route-extraction.log | tail -20

# 3. Check route quality
sudo -u postgres psql -d ankr_maritime -c "
  SELECT
    \"vesselType\",
    COUNT(*) as routes,
    ROUND(AVG(\"qualityScore\")::numeric, 2) as quality,
    ROUND(AVG(\"distanceFactor\")::numeric, 2) as factor
  FROM extracted_ais_routes
  GROUP BY \"vesselType\";
"
```

### Monthly Tasks
- Review route coverage (geographic distribution)
- Check for new vessel types to add
- Optimize extraction parameters if needed
- Archive old logs (rotate)
- Update OSRM data if 500+ new routes

### Log Rotation
```bash
# Add to /etc/logrotate.d/mari8x-osrm
/root/logs/mari8x/*.log {
    weekly
    rotate 8
    compress
    delaycompress
    missingok
    notifempty
}
```

## Future Enhancements

### Planned
- [ ] Add Method 2 (Pattern Learning) after schema fix
- [ ] Vessel type expansion (tankers, bulk carriers)
- [ ] Geographic expansion beyond Europe/North Sea
- [ ] Canal/strait waypoint detection
- [ ] Weather routing integration
- [ ] Slack/email notifications on failures
- [ ] Prometheus metrics export
- [ ] Auto OSRM reprocessing (not just export)

### Under Consideration
- [ ] Real-time route extraction (hourly)
- [ ] ML-based route prediction
- [ ] Dynamic route optimization
- [ ] Fleet coordination analysis
- [ ] Fuel efficiency scoring

---

## Quick Reference

**Status:** `tail -50 /root/logs/mari8x/route-extraction.log`
**Manual run:** `/root/apps/ankr-maritime/backend/scripts/run-daily-route-extraction.sh`
**Check cron:** `crontab -l | grep route-extraction`
**View routes:** `sudo -u postgres psql -d ankr_maritime -c "SELECT COUNT(*) FROM extracted_ais_routes;"`
**Monitor live:** `tail -f /root/logs/mari8x/route-extraction.log`

---

**Setup Date:** 2026-02-09
**First Run:** Tomorrow at 4:00 AM
**Status:** ✅ ACTIVE AND SCHEDULED
