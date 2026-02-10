# GFW Already Integrated! ✅

**Date:** 2026-02-09
**Status:** ✅ READY TO USE

---

## Summary

GFW (Global Fishing Watch) is **already integrated** into Mari8x! The API key is configured and sync scripts exist.

## Current GFW Integration

### ✅ Already Available:

1. **API Key Configured**
   - Located in `.env` as `GFW_API_KEY`
   - Valid until 2035 (long-term token)

2. **GFW Services**
   - `src/services/global-fishing-watch-ais-fixed.ts` - GFW API client
   - `src/services/gfw-position-storage.ts` - Position storage
   - `src/services/gfw-data-ingestion.ts` - Data ingestion

3. **GraphQL API**
   - `src/schema/types/gfw-events.ts` - GFW events query
   - `src/schema/types/hybrid-ais-coverage.ts` - Hybrid AIS (terrestrial + GFW satellite)

4. **Sync Scripts**
   - `src/scripts/sync-gfw-positions.ts` - Main sync script
   - `src/scripts/enrich-vessels-gfw.ts` - Vessel enrichment
   - `scripts/run-gfw-sync.sh` - Shell wrapper

## How It Works (Current Implementation)

### Data Storage Strategy

**GFW data is stored in existing tables:**

```
vessel_positions table:
- Regular AIS positions (source = 'aisstream')
- GFW satellite positions (source = 'gfw_port_visit', 'gfw_fishing', 'gfw_loitering')
- All unified in one table with source field
```

**Benefits:**
✅ No separate tables needed
✅ Unified position queries
✅ Easy to query hybrid AIS+GFW data
✅ Simpler schema management

### GFW Data Types Available

1. **Port Visits** - Stored in vessel_positions with `source='gfw_port_visit'`
2. **Fishing Events** - Stored with `source='gfw_fishing'`
3. **Loitering Events** - Stored with `source='gfw_loitering'`

## Quick Start: Run GFW Sync

### Option 1: Run the Shell Script

```bash
cd /root/apps/ankr-maritime/backend
./scripts/run-gfw-sync.sh
```

### Option 2: Run TypeScript Directly

```bash
cd /root/apps/ankr-maritime/backend
npx tsx src/scripts/sync-gfw-positions.ts
```

This will:
- Fetch last 24 hours of GFW data
- Store port visits, fishing events, loitering events
- Create new vessels if needed
- Store positions in `vessel_positions` table

## Use with Port Congestion

### Query GFW Port Visits for Congestion Analysis

```sql
-- Get GFW port visit data for last 30 days
SELECT
  p.name as port_name,
  p.unlocode,
  COUNT(*) as gfw_visits,
  COUNT(DISTINCT vp."vesselId") as unique_vessels,
  AVG(EXTRACT(EPOCH FROM (lead(vp.timestamp) OVER (PARTITION BY vp."vesselId" ORDER BY vp.timestamp) - vp.timestamp)) / 3600) as avg_stay_hours
FROM vessel_positions vp
JOIN ports p ON ST_DWithin(
  ST_MakePoint(vp.longitude, vp.latitude)::geography,
  ST_MakePoint(p.longitude, p.latitude)::geography,
  50000  -- 50km radius
)
WHERE vp.source LIKE 'gfw_%'
  AND vp.timestamp >= NOW() - INTERVAL '30 days'
  AND vp."gfwEventType" = 'port_visit'
GROUP BY p.name, p.unlocode
ORDER BY gfw_visits DESC;
```

### Combine AIS + GFW for Complete Coverage

```sql
-- Total vessel activity (AIS + GFW) near port
WITH port_activity AS (
  SELECT
    vp."vesselId",
    vp.timestamp,
    vp.source,
    vp.latitude,
    vp.longitude,
    v.name as vessel_name,
    v.flag as vessel_flag
  FROM vessel_positions vp
  JOIN vessels v ON vp."vesselId" = v.id
  CROSS JOIN ports p
  WHERE p.unlocode = 'SGSIN'  -- Singapore
  AND ST_DWithin(
    ST_MakePoint(vp.longitude, vp.latitude)::geography,
    ST_MakePoint(p.longitude, p.latitude)::geography,
    50000
  )
  AND vp.timestamp >= NOW() - INTERVAL '7 days'
)
SELECT
  source,
  COUNT(*) as position_count,
  COUNT(DISTINCT "vesselId") as unique_vessels
FROM port_activity
GROUP BY source;
```

Result shows:
- `aisstream` positions (terrestrial AIS)
- `gfw_port_visit` positions (satellite + port visits)
- `gfw_fishing` positions (if any fishing near port)

## Enhance Port Congestion Script

You can enhance `/root/apps/ankr-maritime/backend/src/scripts/update-port-congestion.ts` to include GFW data:

```typescript
// Add GFW port visits to congestion analysis
const gfwVisits = await prisma.vesselPosition.groupBy({
  by: ['vesselId'],
  where: {
    source: { startsWith: 'gfw_' },
    latitude: { gte: latMin, lte: latMax },
    longitude: { gte: lonMin, lte: lonMax },
    timestamp: { gte: oneHourAgo },
  },
  _count: true
});

console.log(`   GFW satellite data: ${gfwVisits.length} vessels`);
```

## GraphQL Queries

### Get GFW Events for Region

```graphql
query GFWEvents($startDate: DateTime!, $endDate: DateTime!, $regionBounds: RegionBoundsInput!) {
  gfwEvents(startDate: $startDate, endDate: $endDate, regionBounds: $regionBounds) {
    events {
      id
      type
      start
      end
      position {
        lat
        lon
      }
      vessel {
        ssvid
        name
        flag
      }
      portName
    }
    total
    stats {
      fishing
      portVisits
      loitering
      encounters
    }
  }
}
```

### Get Hybrid AIS Coverage (AIS + GFW)

```graphql
query HybridAISCoverage($regionBounds: RegionBoundsInput!, $includeSatellite: Boolean!) {
  hybridAISCoverage(regionBounds: $regionBounds, includeSatellite: $includeSatellite) {
    terrestrialCount
    satelliteCount
    totalUnique
    vessels {
      id
      mmsi
      name
      position {
        lat
        lon
      }
      source  # 'terrestrial' or 'satellite'
    }
  }
}
```

## Scheduled Sync

### Current Schedule

Check if GFW sync is already scheduled:

```bash
crontab -l | grep gfw
```

### Add Daily Sync (if not scheduled)

```bash
# Add to crontab
crontab -e

# Add line:
# GFW Sync - Daily at 3:00 AM (after AIS at 2:00 AM)
0 3 * * * cd /root/apps/ankr-maritime/backend && ./scripts/run-gfw-sync.sh >> /root/logs/mari8x/gfw-sync.log 2>&1
```

## Benefits for Port Intelligence

### 1. Historical Coverage
- GFW provides satellite AIS data going back years
- Fill gaps in terrestrial AIS coverage
- Understand long-term port congestion patterns

### 2. Global Coverage
- Satellite coverage in areas without terrestrial AIS
- Ocean traffic, remote ports
- Fishing fleet movements

### 3. Vessel Identification
- GFW enriches vessel data with IMO, name, flag
- Automatic vessel creation from MMSI
- Better vessel identity database

### 4. Port Visit Intelligence
- Automated port visit detection
- Visit duration statistics
- Flag state analysis
- Seasonal patterns

## Next Steps

### 1. Run Initial Sync

```bash
cd /root/apps/ankr-maritime/backend
npx tsx src/scripts/sync-gfw-positions.ts
```

### 2. Check Data

```bash
sudo -u postgres psql -d ankr_maritime -c "
  SELECT
    source,
    \"gfwEventType\",
    COUNT(*) as count,
    MIN(timestamp) as earliest,
    MAX(timestamp) as latest
  FROM vessel_positions
  WHERE source LIKE 'gfw_%'
  GROUP BY source, \"gfwEventType\"
  ORDER BY count DESC;
"
```

### 3. Integrate with Port Congestion

Update port congestion monitoring to include GFW data:
- Add GFW vessel counts to snapshots
- Show terrestrial vs satellite coverage
- Identify fishing fleet activity near ports
- Historical comparison (GFW provides years of data)

### 4. Frontend Display

Add indicators showing:
- 🛰️ Satellite coverage available
- 🎣 Fishing fleet activity
- 📊 Historical patterns (GFW data)
- 📡 Hybrid AIS status (terrestrial + satellite)

## Documentation

- **GFW API:** https://globalfishingwatch.org/our-apis/documentation
- **Existing Code:**
  - `src/services/global-fishing-watch-ais-fixed.ts`
  - `src/schema/types/gfw-events.ts`
  - `src/schema/types/hybrid-ais-coverage.ts`

## Files Reference

```
GFW Integration Files:
├── src/services/
│   ├── global-fishing-watch-ais-fixed.ts  (GFW API client)
│   ├── gfw-position-storage.ts            (Store positions)
│   └── gfw-data-ingestion.ts              (Data processing)
├── src/schema/types/
│   ├── gfw-events.ts                      (GraphQL queries)
│   └── hybrid-ais-coverage.ts             (Hybrid AIS+GFW)
├── src/scripts/
│   ├── sync-gfw-positions.ts              (Main sync script)
│   └── enrich-vessels-gfw.ts              (Vessel enrichment)
└── scripts/
    └── run-gfw-sync.sh                    (Shell wrapper)
```

---

**Status:** ✅ FULLY INTEGRATED
**API Key:** ✅ CONFIGURED
**Ready to Use:** ✅ YES
**Next Action:** Run `npx tsx src/scripts/sync-gfw-positions.ts`
