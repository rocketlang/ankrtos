# Maps & Deployment Fixes Summary

## 🗺️ Issue 1: Maps Showing Zero Vessels

### Root Cause:
1. **Query Mismatch**: Frontend was querying `liveShipsMap` but backend has `liveVesselPositions`
2. **Port Issue**: Mari8X not registered in ankr-ctl, backend running on inconsistent ports

### Database Status:
✅ **55.3M vessel positions** in database
✅ **43K unique vessels** tracked
✅ Data exists, just not being displayed

### Fix Applied:
- Updated `LiveShipsMap.tsx` to use correct `liveVesselPositions` query
- Changed field references from `pos.vessel.type` → `pos.vesselType`
- Frontend rebuilt and deployed

### Remaining Issue:
❌ Backend not on dedicated port (switching between 4051/4053)
❌ Mari8X not in ankr-ctl registry

---

## 🎯 Issue 2: Mari8X Needs Dedicated Port in ankr-ctl

### Current ankr-ctl Apps:
```
FreightBox:   Frontend 3001, Backend 4003
Fr8X:         Frontend 3006, Backend 4050
DODD ERP:     Frontend 3007, Backend 4007
BFC:          Frontend 3020, Backend 4020
EverPure:     Frontend 3005, Backend 4006
EON:          Backend 4005
Compliance:   Backend 4001
```

### Proposed Mari8X Allocation:
```
Mari8X OSRM:  Frontend 3008, Backend 4051, Domain mari8x.com
```

### Action Required:
Add Mari8X to `/usr/local/bin/ankr-ctl` configuration:
```bash
{
  "name": "Mari8X OSRM",
  "frontend_port": 3008,
  "backend_port": 4051,
  "db_port": 5433,  // Using Docker PostgreSQL (ankr_maritime)
  "domain": "mari8x.com",
  "status": "RUNNING"
}
```

### Environment Setup:
```bash
# backend/.env
PORT=4051
DATABASE_URL=postgresql://ankr:indrA@0612@localhost:6432/ankr_maritime

# Nginx already configured for port 4051 ✓
```

---

## 🗺️ Issue 3: Map Tiles - OSS Natural/Satellite Instead of Dark

### Current Tiles (All OSS ✓):
```typescript
// Dark theme (CartoDB)
url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
```

### Proposed OSS Tile Options:

#### Option 1: Natural Earth View (OpenStreetMap Standard)
```typescript
<TileLayer
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>
```

#### Option 2: Satellite Imagery (ESRI World Imagery - Free)
```typescript
<TileLayer
  attribution='Tiles &copy; Esri'
  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  maxZoom: 19
/>
```

#### Option 3: Humanitarian (HOT - Natural + High Contrast)
```typescript
<TileLayer
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
  url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
/>
```

#### Option 4: Terrain with Nautical (CyclOSM + OpenSeaMap)
```typescript
// Base layer: Terrain
<TileLayer
  url="https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png"
  attribution='&copy; OpenStreetMap contributors'
/>

// Overlay: Nautical charts
<TileLayer
  url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
  attribution='&copy; OpenSeaMap'
/>
```

#### Option 5: Light/Natural (CartoDB Voyager)
```typescript
<TileLayer
  attribution='&copy; OpenStreetMap contributors, &copy; CartoDB'
  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
/>
```

### Recommendation:
**Use Option 2 (Satellite) or Option 5 (Natural) with OpenSeaMap overlay**

```typescript
// Satellite base + nautical overlay
<TileLayer
  attribution='Tiles &copy; Esri'
  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
/>
<TileLayer
  url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
  attribution='&copy; OpenSeaMap'
/>
```

**All 100% Free, No API Keys Required!**

---

## 🚢 Issue 4: Render Vessels in AIS & Heatmaps

### Current Map Components:

#### A. LiveShipsMap.tsx (Fixed ✓)
- Shows vessel positions as markers
- Color-coded by vessel type
- Popup with vessel details

#### B. AISRealWorldMapDual.tsx
- Shows heatmap of vessel density
- Uses `aisHeatmapData` query

#### C. OpenSeaPortsMap.tsx
- Shows ports with OpenSeaMap overlay
- No vessels currently

### Proposed: Combined AIS Vessel + Heatmap View

```typescript
// New component: AISVesselsWithHeatmap.tsx
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import HeatmapLayer from 'react-leaflet-heatmap-layer';

const AIS_VESSELS_HEATMAP_QUERY = gql`
  query AISVesselsAndHeatmap {
    liveVesselPositions {
      vesselId
      vesselName
      vesselType
      latitude
      longitude
      speed
      heading
    }
    aisHeatmapData {
      points {
        lat
        lon
        intensity
      }
    }
  }
`;

export default function AISVesselsWithHeatmap() {
  const { data } = useQuery(AIS_VESSELS_HEATMAP_QUERY);

  return (
    <MapContainer center={[20, 0]} zoom={2}>
      {/* Satellite base layer */}
      <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />

      {/* Nautical overlay */}
      <TileLayer url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png" />

      {/* Heatmap layer (density) */}
      <HeatmapLayer
        points={data?.aisHeatmapData?.points || []}
        latitudeExtractor={(p) => p.lat}
        longitudeExtractor={(p) => p.lon}
        intensityExtractor={(p) => p.intensity}
        radius={15}
        blur={25}
        maxZoom={10}
      />

      {/* Individual vessels (visible at zoom > 6) */}
      {data?.liveVesselPositions.map((vessel) => (
        <CircleMarker
          key={vessel.vesselId}
          center={[vessel.latitude, vessel.longitude]}
          radius={4}
          fillColor={getVesselColor(vessel.vesselType)}
          fillOpacity={0.8}
        >
          <Popup>
            <strong>{vessel.vesselName}</strong>
            <br />Type: {vessel.vesselType}
            <br />Speed: {vessel.speed} knots
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
```

### Layers:
1. **Base**: Satellite imagery (ESRI)
2. **Overlay 1**: OpenSeaMap nautical charts
3. **Overlay 2**: AIS heatmap (density visualization)
4. **Overlay 3**: Individual vessel markers (zoom-dependent)

---

## 📄 Issue 5: Landing Pages Showing Repeated Data

### Current Duplication on Mari8xLanding.tsx:

#### Repeated Stats:
- Vessel count appears 3 times (hero, stats widget, fun facts)
- Port count appears 2 times
- Coverage stats repeated

### Proposed Streamlined Structure:

```typescript
// Mari8xLanding.tsx - Streamlined Version

1. Hero Section (ONE live stat only)
   - Primary CTA
   - Single most important metric (52M+ positions)

2. Live Stats Widget (4 metrics, NO duplication)
   - Unique vessels (43K)
   - Ports covered (5,421)
   - OpenSeaMap coverage (99.9%)
   - Real-time updates

3. Business Workflows (Commercial focus)
   - Charterers
   - Brokers
   - Ship Owners
   - Port Agents

4. AIS Fun Facts (Unique insights only)
   - Fastest vessel
   - Most traveled ship
   - Busiest route
   - (NO basic counts - already shown above)

5. Global Heatmap (Visual, no text stats)
   - Just the map visualization
   - Remove stat callouts

6. ROI Calculator
   - Keep as-is ✓

7. Pricing
   - Keep as-is ✓

8. FAQ
   - Keep as-is ✓

9. CTA
   - Keep as-is ✓
```

### Deduplicate Stats:
```typescript
// BEFORE: Showing vessel count 3 times
Hero: "52M+ positions tracked"
Stats: "55,309,446 Positions"
Fun Facts: "Data Scale: 52M positions"

// AFTER: Show once only
Hero: "FOR CHARTERERS • BROKERS • SHIP OWNERS • PORT AGENTS"
      "Close More Fixtures. Faster Operations."
      (NO numbers)

Live Stats Widget:
  - 52.8M Positions Tracked
  - 43K Unique Vessels
  - 5,421 Ports Covered
  - 99.9% Global Coverage

Fun Facts:
  - Fastest vessel: WICOMICO at 102.3 knots
  - Longest voyage: ...
  - Busiest port: ...
  (NO basic counts)
```

---

## 🚀 Implementation Plan

### Phase 1: Fix Backend Port (Immediate)
1. Stop all mari8x backend processes
2. Set PORT=4051 in backend/.env
3. Restart backend: `PORT=4051 npm run dev`
4. Add Mari8X to ankr-ctl registry
5. Verify nginx proxy working

### Phase 2: Update Map Tiles (30 min)
1. Replace dark tiles with satellite/natural tiles
2. Keep OpenSeaMap overlay
3. Test all map components
4. Deploy frontend

### Phase 3: Vessel Rendering (1 hour)
1. Verify `liveVesselPositions` query working
2. Test LiveShipsMap component
3. Create combined AIS + Heatmap component
4. Deploy and test

### Phase 4: Deduplicate Landing Page (30 min)
1. Remove repeated stats from hero
2. Consolidate all metrics in Live Stats Widget
3. Make Fun Facts truly "fun" (no basic counts)
4. Remove redundant text from heatmap section
5. Deploy

---

## 📋 Quick Commands

### Restart Backend on Correct Port:
```bash
cd /root/apps/ankr-maritime/backend
killall -9 node  # Kill old processes
PORT=4051 npm run dev > /tmp/mari8x-backend.log 2>&1 &
```

### Test Backend:
```bash
curl http://localhost:4051/graphiql
```

### Test GraphQL Query:
```bash
curl -X POST http://localhost:4051/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ liveVesselPositions { vesselId vesselName latitude longitude } }"}'
```

### Rebuild Frontend:
```bash
cd /root/apps/ankr-maritime/frontend
npm run build
sudo systemctl reload nginx
```

---

## ✅ Summary

| Issue | Status | Action |
|-------|--------|--------|
| Maps showing zero vessels | 🟡 Partial | Fix backend port, register in ankr-ctl |
| Dedicated port in ankr-ctl | ❌ Needed | Add Mari8X to ankr-ctl config |
| OSS satellite/natural tiles | ⏳ Ready | Replace dark tiles with ESRI satellite |
| Render vessels + heatmap | 🟡 Partial | LiveShipsMap fixed, combine with heatmap |
| Landing page duplication | ⏳ Ready | Remove repeated stats |

### Next Steps:
1. **Stop all mari8x backend processes**
2. **Start backend on PORT=4051**
3. **Register Mari8X in ankr-ctl** (Frontend: 3008, Backend: 4051)
4. **Switch to satellite/natural tiles**
5. **Test vessel rendering**
6. **Streamline landing page stats**
