# GFW + Port Intelligence Integration Guide

**Date:** 2026-02-09
**Status:** 🔧 READY FOR SETUP

---

## Overview

Integrate **Global Fishing Watch (GFW)** historical and real-time data with Mari8x port intelligence and congestion monitoring for comprehensive maritime insights.

## What GFW Provides

### 1. **Port Visit Events** 🚢
- Historical vessel port visits (last 5+ years available)
- Anchorage and berth times
- Visit duration and patterns
- Vessel identity (MMSI, IMO, name, flag)
- All vessel types (not just fishing)

### 2. **Fishing Events** 🎣
- Fishing activity locations
- Fishing gear types (longlining, trawling, purse seining)
- Duration and intensity
- EEZ and RFMO compliance

### 3. **Loitering Events** ⚓
- Potential transshipment activities
- Stationary or slow-moving vessels
- Suspicious activity detection

### 4. **Encounter Events** 🤝
- Vessel-to-vessel meetings
- Potential at-sea transfers
- Carrier/reefer encounters with fishing vessels

### 5. **Vessel Tracks** 📍
- Satellite AIS coverage (global)
- Fills terrestrial AIS gaps
- Historical position data

## Why Add GFW to Port Intelligence?

### Current System (AIS Only):
✅ Real-time congestion (10 days of data)
❌ Limited historical patterns
❌ No fishing vessel intelligence
❌ Terrestrial AIS gaps (satellites blind spots)
❌ Missing transshipment/IUU activity

### With GFW Integration:
✅ **Years of historical data**
✅ **Fishing fleet patterns**
✅ **Global satellite coverage**
✅ **IUU fishing detection**
✅ **Port visit statistics by vessel type**
✅ **Seasonal congestion trends**
✅ **Compliance monitoring**

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GFW API (External)                        │
│  • Port Visits API                                           │
│  • Fishing Events API                                        │
│  • Vessel Tracks API                                         │
└─────────────────────────┬───────────────────────────────────┘
                          │ Fetch & Sync
                          ↓
┌─────────────────────────────────────────────────────────────┐
│               Mari8x Backend (PostgreSQL)                    │
│                                                               │
│  Tables:                                                      │
│  • gfw_port_visits        ← Historical port activity         │
│  • gfw_fishing_events     ← Fishing activity near ports      │
│  • gfw_loitering_events   ← Suspicious activity              │
│  • gfw_encounter_events   ← Transshipment detection         │
│  • gfw_sync_status        ← Sync tracking                    │
│                                                               │
│  Joined with:                                                 │
│  • port_congestion_snapshots                                 │
│  • vessel_positions (AIS)                                    │
│  • ports, vessels                                            │
└─────────────────────────┬───────────────────────────────────┘
                          │ GraphQL API
                          ↓
┌─────────────────────────────────────────────────────────────┐
│            Frontend (Port Intelligence Pages)                 │
│  • Port Congestion Dashboard                                 │
│  • Port Intelligence (with GFW enrichment)                   │
│  • Fishing Activity Heatmaps                                 │
│  • IUU Compliance Monitoring                                 │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema (Already Added)

The following models have been added to `/root/apps/ankr-maritime/backend/prisma/schema.prisma`:

### GFWPortVisit
```prisma
- vesselId, mmsi, imo, vesselName, flag, vesselType
- portId, portName, portUnlocode, portLatitude, portLongitude
- startTime, endTime, duration
- visitType, confidence, intermediateAnchorage
- startLatitude, startLongitude, endLatitude, endLongitude
```

### GFWFishingEvent
```prisma
- vesselId, mmsi, imo, vesselName, flag
- startTime, endTime, duration
- latitude, longitude, regionMpa, regionRfmo, regionEez
- fishingType, confidence, distanceToShore
```

### GFWLoiteringEvent
```prisma
- vesselId, mmsi, imo, vesselName, flag, vesselType
- startTime, endTime, duration
- latitude, longitude, regionEez, distanceToShore
- loiteringType, confidence, totalDistance
```

### GFWEncounterEvent
```prisma
- vessel1Id, vessel1Mmsi, vessel1Name, vessel1Flag, vessel1Type
- vessel2Id, vessel2Mmsi, vessel2Name, vessel2Flag, vessel2Type
- startTime, endTime, duration
- latitude, longitude, regionEez, distanceToShore
- encounterType, confidence, medianDistance, medianSpeed
```

### GFWSyncStatus
```prisma
- eventType (port_visits, fishing_events, loitering_events, encounter_events)
- lastSyncTime, lastEventTime, eventsCount
- status, errorMessage
```

## Setup Instructions

### Step 1: Get GFW API Access

1. Visit https://globalfishingwatch.org
2. Sign up for an account
3. Request API access (free for research/non-commercial)
4. Get your API key from dashboard

### Step 2: Configure Environment

Add to `/root/apps/ankr-maritime/backend/.env`:

```bash
# Global Fishing Watch API
GFW_API_KEY=your_gfw_api_key_here
GFW_API_BASE_URL=https://gateway.api.globalfishingwatch.org/v3
```

### Step 3: Create Database Tables

Run Prisma migration to create GFW tables:

```bash
cd /root/apps/ankr-maritime/backend
npx prisma migrate dev --name add_gfw_events
```

This creates:
- `gfw_port_visits`
- `gfw_fishing_events`
- `gfw_loitering_events`
- `gfw_encounter_events`
- `gfw_sync_status`

### Step 4: Initial Data Sync

Fetch historical port visit data (last 30 days):

```bash
cd /root/apps/ankr-maritime/backend
npx tsx src/scripts/integrate-gfw-port-visits.ts
```

For custom date range, modify the script or create parameters.

### Step 5: Schedule Automated Syncs

Add to crontab for daily updates:

```bash
# GFW Port Visits Sync - Daily at 5:00 AM (after AIS update at 4:00 AM)
0 5 * * * cd /root/apps/ankr-maritime/backend && npx tsx src/scripts/integrate-gfw-port-visits.ts >> /root/logs/mari8x/gfw-sync.log 2>&1
```

## Use Cases & Queries

### 1. Port Congestion with Historical Context

**Query:** Find ports with unusual congestion compared to historical patterns

```sql
WITH historical_baseline AS (
  SELECT
    "portUnlocode",
    AVG(duration) as avg_visit_duration,
    COUNT(*) as historical_visits
  FROM gfw_port_visits
  WHERE "startTime" >= NOW() - INTERVAL '90 days'
  GROUP BY "portUnlocode"
),
current_congestion AS (
  SELECT
    "portId",
    "vesselCount",
    "avgWaitTimeHours",
    "congestionLevel"
  FROM port_congestion_snapshots
  WHERE timestamp = (SELECT MAX(timestamp) FROM port_congestion_snapshots)
)
SELECT
  p.unlocode,
  p.name,
  cc."vesselCount" as current_vessels,
  cc."avgWaitTimeHours" as current_wait,
  cc."congestionLevel",
  hb.avg_visit_duration as historical_avg_duration,
  hb.historical_visits as visits_last_90d
FROM ports p
LEFT JOIN current_congestion cc ON cc."portId" = p.id
LEFT JOIN historical_baseline hb ON hb."portUnlocode" = p.unlocode
WHERE cc."congestionLevel" IN ('HIGH', 'CRITICAL')
ORDER BY cc."vesselCount" DESC;
```

### 2. Fishing Fleet Activity Near Ports

**Query:** Identify fishing vessels loitering near monitored ports

```sql
SELECT
  p.name as port_name,
  p.unlocode,
  COUNT(DISTINCT gfl."vesselId") as loitering_vessels,
  AVG(gfl.duration) as avg_loiter_hours,
  STRING_AGG(DISTINCT gfl.flag, ', ') as flags
FROM gfw_loitering_events gfl
CROSS JOIN ports p
WHERE ST_DWithin(
  ST_MakePoint(gfl.longitude, gfl.latitude)::geography,
  ST_MakePoint(p.longitude, p.latitude)::geography,
  50000  -- Within 50km
)
AND gfl."startTime" >= NOW() - INTERVAL '7 days'
GROUP BY p.name, p.unlocode
HAVING COUNT(DISTINCT gfl."vesselId") > 5
ORDER BY loitering_vessels DESC;
```

### 3. Port Visit Statistics by Flag State

**Query:** Analyze port visits by vessel flag for trade intelligence

```sql
SELECT
  p.name as port_name,
  gfpv.flag,
  COUNT(*) as visit_count,
  AVG(gfpv.duration) as avg_duration_hours,
  MIN(gfpv."startTime") as first_visit,
  MAX(gfpv."endTime") as last_visit
FROM gfw_port_visits gfpv
JOIN ports p ON gfpv."portId" = p.id
WHERE gfpv."startTime" >= NOW() - INTERVAL '30 days'
GROUP BY p.name, gfpv.flag
HAVING COUNT(*) >= 3
ORDER BY p.name, visit_count DESC;
```

### 4. Seasonal Congestion Patterns

**Query:** Historical congestion by month for capacity planning

```sql
SELECT
  "portUnlocode",
  EXTRACT(MONTH FROM "startTime") as month,
  COUNT(*) as visits,
  AVG(duration) as avg_duration,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration) as median_duration
FROM gfw_port_visits
WHERE "startTime" >= NOW() - INTERVAL '1 year'
GROUP BY "portUnlocode", EXTRACT(MONTH FROM "startTime")
ORDER BY "portUnlocode", month;
```

### 5. IUU Compliance Monitoring

**Query:** Detect vessels with suspicious encounter patterns near ports

```sql
SELECT
  gfe."vessel1Mmsi",
  gfe."vessel1Name",
  gfe."vessel1Flag",
  p.name as nearest_port,
  COUNT(*) as encounter_count,
  AVG(gfe.duration) as avg_encounter_duration,
  STRING_AGG(DISTINCT gfe."vessel2Flag", ', ') as encountered_flags
FROM gfw_encounter_events gfe
CROSS JOIN LATERAL (
  SELECT id, name, latitude, longitude
  FROM ports
  ORDER BY ST_Distance(
    ST_MakePoint(gfe.longitude, gfe.latitude)::geography,
    ST_MakePoint(ports.longitude, ports.latitude)::geography
  )
  LIMIT 1
) p
WHERE gfe."startTime" >= NOW() - INTERVAL '30 days'
AND gfe."encounterType" = 'carrier_encounter'
GROUP BY gfe."vessel1Mmsi", gfe."vessel1Name", gfe."vessel1Flag", p.name
HAVING COUNT(*) >= 3
ORDER BY encounter_count DESC;
```

## GraphQL API Extensions

Add these resolvers to expose GFW data:

### Query: GFW Port Visit History

```graphql
type GFWPortVisit {
  id: ID!
  mmsi: String!
  vesselName: String
  flag: String
  vesselType: String
  portName: String
  startTime: DateTime!
  endTime: DateTime!
  duration: Float!
  visitType: String
  confidence: Float
}

type Query {
  gfwPortVisits(
    portId: String
    portUnlocode: String
    startDate: DateTime!
    endDate: DateTime!
  ): [GFWPortVisit!]!

  gfwPortVisitStats(
    portId: String!
    days: Int = 30
  ): GFWPortVisitStats!
}

type GFWPortVisitStats {
  totalVisits: Int!
  uniqueVessels: Int!
  avgDuration: Float!
  byFlag: [FlagStats!]!
  byVesselType: [VesselTypeStats!]!
  trend: String! # INCREASING, DECREASING, STABLE
}
```

## Frontend Enhancements

### Port Intelligence Page

Add new tab: **"GFW Intelligence"**

Features:
- Historical port visit trends (last 30/90/365 days)
- Vessel type breakdown (fishing, cargo, tanker)
- Flag state analysis
- Seasonal patterns chart
- Fishing activity heatmap near port
- IUU compliance alerts

### Port Congestion Dashboard

Enrich existing dashboard:
- Show historical congestion baseline
- "Unusual congestion" alerts when current > historical avg by 50%+
- Fishing fleet activity overlay on map
- Port visit timeline with GFW + AIS combined

### New Page: Fishing Activity Monitor

**URL:** `/fishing-activity`

Features:
- Global fishing activity heatmap (GFW 4Wings)
- Fishing events near ports (last 7 days)
- Loitering detection alerts
- Encounter events (potential transshipment)
- IUU risk scoring

## Cost & Limits

### GFW API (Free Tier)
- **Cost:** FREE for research/non-commercial
- **Rate Limits:**
  - 60 requests/minute
  - 10,000 requests/day
- **Data Retention:** Up to 5 years historical
- **Coverage:** Global (all vessels with AIS)

### Commercial Use
For commercial applications (Mari8x production):
- Contact GFW for enterprise licensing
- Higher rate limits
- SLA guarantees
- Custom datasets

## Benefits Summary

| Metric | Before (AIS Only) | After (AIS + GFW) |
|--------|------------------|-------------------|
| **Historical Data** | 10 days | 5+ years |
| **Vessel Coverage** | Terrestrial AIS only | Global (satellite + terrestrial) |
| **Fishing Intelligence** | None | Full coverage |
| **IUU Detection** | None | Yes |
| **Congestion Patterns** | Limited | Seasonal trends |
| **Port Visit Stats** | Manual entry | Automated historical |
| **Data Gaps** | Yes (satellite blind spots) | Minimal |

## Next Steps

1. ✅ **Schema Added** - GFW tables defined in Prisma schema
2. ⏳ **Get API Key** - Sign up at globalfishingwatch.org
3. ⏳ **Run Migration** - Create GFW tables in database
4. ⏳ **Initial Sync** - Fetch 30 days historical data
5. ⏳ **Schedule Cron** - Automate daily updates
6. ⏳ **Add GraphQL** - Expose GFW data via API
7. ⏳ **Frontend Updates** - Add GFW intelligence tabs
8. ⏳ **Testing** - Verify data quality and coverage

## Files Created/Modified

1. ✅ `/root/apps/ankr-maritime/backend/prisma/schema.prisma` - Added GFW models
2. ✅ `/root/apps/ankr-maritime/backend/src/scripts/integrate-gfw-port-visits.ts` - Integration script
3. ✅ `/root/GFW-PORT-INTELLIGENCE-INTEGRATION.md` - This documentation

## Support & Resources

- **GFW Documentation:** https://globalfishingwatch.org/our-apis/documentation
- **GFW API Explorer:** https://gateway.api.globalfishingwatch.org/docs
- **GFW Data Dictionary:** https://globalfishingwatch.org/datasets-and-code
- **Community Forum:** https://globalfishingwatch.org/community

---

**Status:** 📋 READY FOR IMPLEMENTATION
**Estimated Setup Time:** 2-4 hours
**Prerequisites:** GFW API key, Prisma migration access
