# OpenSeaMap Integration for Port Visualization

**Date**: February 1, 2026
**Purpose**: Integrate OpenSeaMap (OSM) for detailed port infrastructure visualization

---

## 🗺️ What is OpenSeaMap?

**OpenSeaMap** is an open-source nautical chart project built on top of OpenStreetMap data. It provides:

- **Nautical infrastructure**: Ports, harbors, marinas, anchorages
- **Navigation aids**: Buoys, lighthouses, beacons
- **Depth contours**: Water depth information
- **Shipping lanes**: Traffic separation schemes
- **Port facilities**: Berths, terminals, jetties, piers

**Website**: https://map.openseamap.org
**Data**: Free, open-source, crowdsourced

---

## 🎯 Integration Goals

### For Mari8X Platform

1. **Port Infrastructure Visualization**
   - Terminals, berths, jetties on interactive map
   - Anchorage zones with boundaries
   - Navigation channels and fairways
   - Port facilities (warehouses, tank farms, yards)

2. **Enhanced Voyage Planning**
   - Visual berth selection (see exact location)
   - Anchorage zone selection
   - Terminal proximity to facilities
   - Navigation routing within port

3. **Operational Intelligence**
   - Real-time vessel positions on port map (AIS overlay)
   - Berth occupancy visualization
   - Traffic density heat maps
   - Historical vessel tracks

4. **PDA/FDA Cost Estimation**
   - Click berth → Get terminal-specific tariffs
   - Visual distance calculations (berth to services)
   - Towage distance estimation

---

## 🏗️ Technical Architecture

### Data Flow

```
OpenStreetMap Database
         ↓
  Overpass API Query
         ↓
   OSM Data (JSON)
         ↓
  Data Transformation
         ↓
   Mari8X Database (PostGIS)
         ↓
   GraphQL API
         ↓
   Frontend Map (Leaflet/MapboxGL)
         ↓
   User Interaction
```

### Database Schema (PostGIS)

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Port Infrastructure Tables

CREATE TABLE osm_port_areas (
  id SERIAL PRIMARY KEY,
  port_id VARCHAR(30) REFERENCES ports(id),
  osm_id BIGINT UNIQUE,
  osm_type VARCHAR(10), -- node, way, relation
  name VARCHAR(200),
  name_en VARCHAR(200),
  port_function VARCHAR(100), -- harbor, marina, anchorage, terminal

  -- Geometry
  geometry GEOMETRY(GEOMETRY, 4326),
  center_lat DECIMAL(10, 7),
  center_lon DECIMAL(10, 7),

  -- Metadata
  source VARCHAR(50) DEFAULT 'OpenSeaMap',
  last_updated TIMESTAMP DEFAULT NOW(),

  -- Index for spatial queries
  CONSTRAINT valid_geometry CHECK (ST_IsValid(geometry))
);

CREATE INDEX idx_osm_port_areas_geom ON osm_port_areas USING GIST(geometry);
CREATE INDEX idx_osm_port_areas_port ON osm_port_areas(port_id);


CREATE TABLE osm_berths (
  id SERIAL PRIMARY KEY,
  port_id VARCHAR(30) REFERENCES ports(id),
  terminal_id VARCHAR(30), -- Reference to our Terminal table
  osm_id BIGINT UNIQUE,
  osm_type VARCHAR(10),

  -- Berth Info
  berth_number VARCHAR(50),
  berth_name VARCHAR(200),
  berth_type VARCHAR(50), -- container, ro-ro, bulk, liquid, general

  -- Specifications from OSM
  max_length DECIMAL(6, 2), -- meters
  max_draft DECIMAL(5, 2), -- meters
  max_width DECIMAL(6, 2), -- meters

  -- Geometry
  geometry GEOMETRY(LINESTRING, 4326), -- Berth is typically a line
  lat DECIMAL(10, 7),
  lon DECIMAL(10, 7),

  -- Metadata
  source VARCHAR(50) DEFAULT 'OpenSeaMap',
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_osm_berths_geom ON osm_berths USING GIST(geometry);
CREATE INDEX idx_osm_berths_port ON osm_berths(port_id);


CREATE TABLE osm_anchorages (
  id SERIAL PRIMARY KEY,
  port_id VARCHAR(30) REFERENCES ports(id),
  osm_id BIGINT UNIQUE,
  osm_type VARCHAR(10),

  -- Anchorage Info
  name VARCHAR(200),
  anchorage_type VARCHAR(50), -- general, quarantine, waiting, sts

  -- Specifications
  max_depth DECIMAL(5, 2), -- meters
  min_depth DECIMAL(5, 2), -- meters
  capacity INT, -- number of vessels

  -- Geometry (usually polygon)
  geometry GEOMETRY(POLYGON, 4326),
  center_lat DECIMAL(10, 7),
  center_lon DECIMAL(10, 7),

  -- Metadata
  source VARCHAR(50) DEFAULT 'OpenSeaMap',
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_osm_anchorages_geom ON osm_anchorages USING GIST(geometry);


CREATE TABLE osm_navigation_aids (
  id SERIAL PRIMARY KEY,
  osm_id BIGINT UNIQUE,
  osm_type VARCHAR(10),

  -- Aid Info
  name VARCHAR(200),
  aid_type VARCHAR(50), -- lighthouse, buoy, beacon, light_float
  light_character VARCHAR(100), -- Fl(2)W 10s (flashing pattern)
  color VARCHAR(50),
  shape VARCHAR(50),

  -- Position
  lat DECIMAL(10, 7),
  lon DECIMAL(10, 7),

  -- Metadata
  source VARCHAR(50) DEFAULT 'OpenSeaMap',
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_osm_nav_aids_location ON osm_navigation_aids(lat, lon);


CREATE TABLE osm_shipping_lanes (
  id SERIAL PRIMARY KEY,
  osm_id BIGINT UNIQUE,
  osm_type VARCHAR(10),

  -- Lane Info
  name VARCHAR(200),
  lane_type VARCHAR(50), -- fairway, channel, tss (traffic separation scheme)
  direction VARCHAR(20), -- inbound, outbound, two-way
  depth DECIMAL(5, 2), -- meters

  -- Geometry (line or polygon)
  geometry GEOMETRY(GEOMETRY, 4326),

  -- Metadata
  source VARCHAR(50) DEFAULT 'OpenSeaMap',
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_osm_shipping_lanes_geom ON osm_shipping_lanes USING GIST(geometry);
```

---

## 📡 Data Acquisition

### Overpass API Queries

**Overpass API** allows querying OpenStreetMap data by location and type.

#### Query 1: Get All Port Infrastructure for Mumbai

```overpass
[out:json][timeout:60];
// Define bounding box around Mumbai Port (18.85°N to 19.05°N, 72.75°E to 73.0°E)
(
  // Harbors and ports
  node["seamark:type"="harbour"](18.85,72.75,19.05,73.0);
  way["seamark:type"="harbour"](18.85,72.75,19.05,73.0);
  relation["seamark:type"="harbour"](18.85,72.75,19.05,73.0);

  // Berths
  node["seamark:type"="berth"](18.85,72.75,19.05,73.0);
  way["seamark:type"="berth"](18.85,72.75,19.05,73.0);

  // Anchorages
  node["seamark:type"="anchorage"](18.85,72.75,19.05,73.0);
  way["seamark:type"="anchorage"](18.85,72.75,19.05,73.0);
  relation["seamark:type"="anchorage"](18.85,72.75,19.05,73.0);

  // Terminals
  node["seamark:type"="terminal"](18.85,72.75,19.05,73.0);
  way["seamark:type"="terminal"](18.85,72.75,19.05,73.0);

  // Navigation aids
  node["seamark:type"="light"](18.85,72.75,19.05,73.0);
  node["seamark:type"="buoy"](18.85,72.75,19.05,73.0);
  node["seamark:type"="beacon"](18.85,72.75,19.05,73.0);

  // Fairways and channels
  way["seamark:type"="fairway"](18.85,72.75,19.05,73.0);
  way["seamark:type"="channel"](18.85,72.75,19.05,73.0);
);
out body;
>;
out skel qt;
```

#### Query 2: Get Specific Berth Information

```overpass
[out:json];
way["seamark:type"="berth"]["seamark:berth:category"="container"]
  (around:5000,18.9388,72.8354); // 5km around Mumbai port
out body;
>;
out skel qt;
```

### Implementation Script

```typescript
// services/openseamap/overpass-fetcher.ts

import axios from 'axios';

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

interface OverpassElement {
  type: string; // node, way, relation
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  geometry?: Array<{ lat: number; lon: number }>;
}

export class OverpassFetcher {
  async fetchPortInfrastructure(
    portUnlocode: string,
    lat: number,
    lon: number,
    radiusKm: number = 10
  ): Promise<OverpassElement[]> {
    const radiusMeters = radiusKm * 1000;

    const query = `
      [out:json][timeout:60];
      (
        node["seamark:type"~"harbour|berth|anchorage|terminal"](around:${radiusMeters},${lat},${lon});
        way["seamark:type"~"harbour|berth|anchorage|terminal|fairway"](around:${radiusMeters},${lat},${lon});
        relation["seamark:type"~"harbour|anchorage"](around:${radiusMeters},${lat},${lon});
      );
      out body;
      >;
      out skel qt;
    `;

    const response = await axios.post(OVERPASS_API, query, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return response.data.elements;
  }

  async transformAndStore(portId: string, elements: OverpassElement[]) {
    for (const element of elements) {
      const seamarkType = element.tags?.['seamark:type'];

      if (seamarkType === 'berth') {
        await this.storeBerth(portId, element);
      } else if (seamarkType === 'anchorage') {
        await this.storeAnchorage(portId, element);
      } else if (seamarkType === 'harbour' || seamarkType === 'terminal') {
        await this.storePortArea(portId, element);
      }
      // ... handle other types
    }
  }

  private async storeBerth(portId: string, element: OverpassElement) {
    const berthNumber = element.tags?.['seamark:berth:number'];
    const berthType = element.tags?.['seamark:berth:category'];
    const maxLength = parseFloat(element.tags?.['seamark:berth:max_length'] || '0');
    const maxDraft = parseFloat(element.tags?.['seamark:berth:max_draft'] || '0');

    // Create geometry (LineString for berth)
    const geometry = this.createLineString(element.geometry);

    await prisma.$executeRaw`
      INSERT INTO osm_berths (port_id, osm_id, osm_type, berth_number, berth_type, max_length, max_draft, geometry, lat, lon)
      VALUES (${portId}, ${element.id}, ${element.type}, ${berthNumber}, ${berthType}, ${maxLength}, ${maxDraft},
              ST_GeomFromGeoJSON(${geometry}), ${element.lat}, ${element.lon})
      ON CONFLICT (osm_id) DO UPDATE SET
        berth_number = EXCLUDED.berth_number,
        last_updated = NOW()
    `;
  }

  private createLineString(coordinates?: Array<{ lat: number; lon: number }>): string {
    if (!coordinates || coordinates.length === 0) return null;

    const coords = coordinates.map(c => [c.lon, c.lat]);
    return JSON.stringify({
      type: 'LineString',
      coordinates: coords
    });
  }
}
```

---

## 🎨 Frontend Visualization

### Technology Stack

**Option 1: Leaflet** (Recommended - Lightweight)
- Open-source JavaScript library
- Easy to use
- Good performance
- Large plugin ecosystem

**Option 2: MapboxGL JS** (Advanced features)
- Vector tiles (faster rendering)
- 3D capabilities
- Better styling control
- Requires Mapbox account (free tier available)

### React Component

```typescript
// components/PortMap.tsx

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface PortMapProps {
  portUnlocode: string;
  showBerths?: boolean;
  showAnchorages?: boolean;
  showNavigationAids?: boolean;
  onBerthClick?: (berthId: string) => void;
}

export const PortMap: React.FC<PortMapProps> = ({
  portUnlocode,
  showBerths = true,
  showAnchorages = true,
  showNavigationAids = false,
  onBerthClick
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize map
    const map = L.map(containerRef.current);
    mapRef.current = map;

    // Base layer: OpenSeaMap
    const osmLayer = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
      attribution: 'Map data: &copy; OpenSeaMap contributors',
      maxZoom: 18
    });

    // Base layer: OpenStreetMap
    const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    });

    baseLayer.addTo(map);
    osmLayer.addTo(map);

    // Load port data
    loadPortData();

    return () => {
      map.remove();
    };
  }, []);

  const loadPortData = async () => {
    const response = await fetch(`/api/ports/${portUnlocode}/osm-data`);
    const data = await response.json();

    const { port, berths, anchorages, navAids } = data;

    // Center map on port
    mapRef.current?.setView([port.latitude, port.longitude], 13);

    // Add berths
    if (showBerths && berths) {
      berths.forEach(berth => {
        const berthLayer = L.geoJSON(berth.geometry, {
          style: {
            color: '#FF6B6B',
            weight: 4
          }
        });

        berthLayer.bindPopup(`
          <strong>${berth.berth_name || berth.berth_number}</strong><br/>
          Type: ${berth.berth_type}<br/>
          Max Length: ${berth.max_length}m<br/>
          Max Draft: ${berth.max_draft}m
        `);

        berthLayer.on('click', () => {
          if (onBerthClick) onBerthClick(berth.id);
        });

        berthLayer.addTo(mapRef.current!);
      });
    }

    // Add anchorages
    if (showAnchorages && anchorages) {
      anchorages.forEach(anchorage => {
        const anchorageLayer = L.geoJSON(anchorage.geometry, {
          style: {
            color: '#4ECDC4',
            fillColor: '#4ECDC4',
            fillOpacity: 0.2
          }
        });

        anchorageLayer.bindPopup(`
          <strong>${anchorage.name}</strong><br/>
          Type: ${anchorage.anchorage_type}<br/>
          Capacity: ${anchorage.capacity} vessels
        `);

        anchorageLayer.addTo(mapRef.current!);
      });
    }

    // Add navigation aids
    if (showNavigationAids && navAids) {
      navAids.forEach(aid => {
        const marker = L.marker([aid.lat, aid.lon], {
          icon: getNavigationAidIcon(aid.aid_type)
        });

        marker.bindPopup(`
          <strong>${aid.name}</strong><br/>
          Type: ${aid.aid_type}<br/>
          ${aid.light_character ? `Light: ${aid.light_character}` : ''}
        `);

        marker.addTo(mapRef.current!);
      });
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '600px' }} />
  );
};
```

---

## 🔄 Data Update Strategy

### Initial Import
1. Run Overpass queries for all 58 Indian ports
2. Store OSM data in PostGIS tables
3. Link OSM berths to our Terminal/Berth system

### Incremental Updates
- **Weekly**: Re-fetch OSM data for major ports (data changes infrequently)
- **On-demand**: Fetch when user views port map
- **Cache**: Store for 7 days, refresh weekly

### Data Quality
- OpenSeaMap data varies by port
- Major ports (Mumbai, JNPT, Chennai) have good coverage
- Minor ports may have incomplete data
- Option to manually add/correct data

---

## 🎯 Implementation Roadmap

### Week 1: Setup
- [ ] Add PostGIS extension to database
- [ ] Create OSM tables (berths, anchorages, nav aids)
- [ ] Build Overpass API fetcher service

### Week 2: Data Import
- [ ] Fetch OSM data for top 12 major ports
- [ ] Transform and store in database
- [ ] Link OSM berths to existing terminals

### Week 3: Frontend
- [ ] Build PortMap component (Leaflet)
- [ ] Add berth/anchorage layers
- [ ] Implement click handlers for tariff lookup

### Week 4: Integration
- [ ] Add AIS vessel overlay on port maps
- [ ] Connect to voyage planning (berth selection)
- [ ] Integrate with PDA/FDA calculator

---

## 📊 Expected Data Availability

### Major Ports (Good Coverage)
- Mumbai, JNPT, Chennai, Vizag: ⭐⭐⭐⭐⭐
- Kochi, Kolkata, Paradip: ⭐⭐⭐⭐
- Others: ⭐⭐⭐

### Gujarat Ports (Variable)
- Mundra, Kandla: ⭐⭐⭐⭐
- Pipavav, Dahej: ⭐⭐⭐
- Minor ports: ⭐⭐

### Improvement Plan
- Contribute missing data back to OpenSeaMap
- Manually digitize major terminals if needed
- Partner with port authorities for accurate data

---

## 🚀 Benefits

1. **Visual Berth Selection**: Users can see exact berth location
2. **Better Cost Estimation**: Distance-based calculations
3. **Operational Planning**: Visual understanding of port layout
4. **Training**: New users understand port structure
5. **Free Data**: No licensing costs

---

**Status**: Ready to implement
**Priority**: High (enhances user experience significantly)
**Dependencies**: PostGIS, Frontend map library
