# Indian Ports Enhancement Plan

**Date**: February 1, 2026
**Focus**: Enhanced Indian port coverage with terminal details, OpenStreetMap integration, and PDA/FDA documentation

---

## 🎯 Objectives

1. **Enhanced Terminal Coverage**: Add detailed terminal, berth, and anchorage tariffs for all major Indian ports
2. **OpenStreetMap Integration**: Map visualization of port terminals, berths, and anchorages
3. **PDA/FDA Documentation**: Port Disbursement Account and Final Disbursement Account training materials
4. **Priority**: Indian ports first, then expand globally

---

## 🇮🇳 Major Indian Ports (12 Ports)

### Phase 1: Already Scraped (4 ports)
1. ✅ **Mumbai Port Trust (INMUN)**
   - Terminals: Victoria Dock, Princes Dock, Alexandra Dock, Indira Dock, Butcher Island, Pir Pau
   - Status: Enhanced with 21 tariff variations

2. ✅ **JNPT - Nhava Sheva (INNSA)**
   - Terminals: JNPCT, NSICT (APM), NSIGT (DP World), GTI
   - Berths: CB1-CB9, LB1-LB4
   - Anchorages: SWA, DWA
   - Status: Enhanced with 21 tariff variations

3. ✅ **Kandla / Deendayal Port (INKDL)**
   - Status: Basic tariffs (5), needs terminal enhancement

4. ✅ **Mundra (INMUN1)**
   - Terminals: Multiple Adani terminals
   - Status: Basic tariffs (4), needs terminal enhancement

### Phase 2: To Add (8 major ports)

5. **Chennai (INMAA)**
   - Terminals: Chennai Container Terminal (CCT), Chennai Port Limited
   - Berths: 24 berths including container, coal, iron ore

6. **Visakhapatnam (INVTZ)**
   - Terminals: Visakha Container Terminal, Gangavaram Port
   - Berths: Outer Harbour, Inner Harbour

7. **Kochi / Cochin (INCOK)**
   - Terminals: Rajiv Gandhi Container Terminal, International Container Transshipment Terminal (ICTT)
   - Berths: Multiple berths for containers, bulk, oil

8. **Kolkata / Haldia (INHAL)**
   - Two locations: Kolkata Dock System & Haldia Dock Complex
   - Berths: 50+ berths combined

9. **Tuticorin / V.O. Chidambaranar (INTUT)**
   - Terminals: Container Terminal, Thermal Coal Berth
   - Berths: 11 berths

10. **Paradip (INPBD)**
    - Terminals: Modern mechanized port
    - Berths: Iron ore, coal, containers

11. **New Mangalore (INMAA1)**
    - Terminals: Container Terminal, POL Berth
    - Berths: 18 berths

12. **Ennore (INENN)**
    - Terminals: Kamarajar Port Limited
    - Berths: Coal, container, liquid cargo

---

## 🗺️ OpenStreetMap Integration

### Port Terminal Mapping Features

#### Data to Visualize
1. **Port Boundaries** - Polygon showing port limits
2. **Terminals** - Points/polygons for each terminal
3. **Berths** - Individual berth locations with numbers
4. **Anchorages** - Polygon zones for anchorage areas
5. **Channels** - Navigation channels and fairways
6. **Facilities** - Warehouses, container yards, tank farms

#### Database Schema Addition
```sql
-- Add to Port model
CREATE TABLE port_terminals (
  id VARCHAR(30) PRIMARY KEY,
  port_id VARCHAR(30) NOT NULL REFERENCES ports(id),
  name VARCHAR(200) NOT NULL,
  terminal_type VARCHAR(50), -- container, bulk, oil, general
  operator VARCHAR(200),

  -- OpenStreetMap data
  osm_type VARCHAR(20), -- node, way, relation
  osm_id BIGINT,
  geometry GEOMETRY(GEOMETRY, 4326), -- PostGIS geometry

  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),

  -- Capacity
  berth_count INTEGER,
  max_vessel_size INTEGER, -- GRT
  draft_meters DECIMAL(5, 2),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE port_berths (
  id VARCHAR(30) PRIMARY KEY,
  terminal_id VARCHAR(30) REFERENCES port_terminals(id),
  port_id VARCHAR(30) NOT NULL REFERENCES ports(id),
  berth_number VARCHAR(50) NOT NULL,
  berth_type VARCHAR(50), -- container, ro-ro, bulk, liquid

  -- OpenStreetMap
  osm_type VARCHAR(20),
  osm_id BIGINT,
  geometry GEOMETRY(POINT, 4326),

  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,

  -- Specifications
  length_meters DECIMAL(6, 2),
  draft_meters DECIMAL(5, 2),
  bollard_pull INTEGER,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE port_anchorages (
  id VARCHAR(30) PRIMARY KEY,
  port_id VARCHAR(30) NOT NULL REFERENCES ports(id),
  name VARCHAR(200) NOT NULL,
  anchorage_type VARCHAR(50), -- shallow, deep, quarantine, waiting

  -- OpenStreetMap
  osm_type VARCHAR(20),
  osm_id BIGINT,
  geometry GEOMETRY(POLYGON, 4326),

  center_latitude DECIMAL(10, 7),
  center_longitude DECIMAL(10, 7),

  -- Specifications
  max_depth_meters DECIMAL(5, 2),
  capacity_vessels INTEGER,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### OpenStreetMap Data Sources

1. **Overpass API** - Query OSM data for ports
```
[out:json][timeout:25];
(
  node["seamark:type"="harbour"](around:5000,18.9388,72.8354);
  way["seamark:type"="harbour"](around:5000,18.9388,72.8354);
  relation["seamark:type"="harbour"](around:5000,18.9388,72.8354);
  node["seamark:type"="berth"](around:5000,18.9388,72.8354);
  node["seamark:type"="anchorage"](around:5000,18.9388,72.8354);
);
out body;
>;
out skel qt;
```

2. **OpenSeaMap** - Maritime specific OSM data

3. **Manual Digitization** - For missing data

#### Frontend Components

**Port Map View** (using Leaflet or Mapbox GL JS):
```typescript
interface PortMapProps {
  portUnlocode: string;
  showTerminals?: boolean;
  showBerths?: boolean;
  showAnchorages?: boolean;
  showChannels?: boolean;
}

// Features:
// - Cluster berths when zoomed out
// - Show berth numbers when zoomed in
// - Color-code by terminal operator
// - Click berth to see tariffs
// - Vessel positions overlay (from AIS)
```

---

## 📄 PDA/FDA Documentation System

### What are PDA and FDA?

**PDA (Port Disbursement Account)** - Detailed breakdown of port-related expenses before vessel departure:
- Port charges (dues, pilotage, towage, berth hire)
- Agency fees
- Services (water, garbage, provisions)
- Documentation fees
- Miscellaneous expenses

**FDA (Final Disbursement Account)** - Final accounting after all services rendered and bills received:
- All PDA items confirmed
- Additional charges discovered
- Final payments to vendors
- Currency conversions
- Bank charges
- Agent's commission

### Documentation Structure

```
/backend/src/knowledge-base/pda-fda/
├── general/
│   ├── pda-guide.md
│   ├── fda-guide.md
│   ├── sample-pda-mumbai.pdf
│   └── sample-fda-mumbai.pdf
├── ports/
│   ├── INMUN-mumbai/
│   │   ├── typical-charges.md
│   │   ├── pda-template.xlsx
│   │   ├── fda-template.xlsx
│   │   └── vendor-list.md
│   ├── INNSA-jnpt/
│   │   ├── typical-charges.md
│   │   ├── terminal-specific-charges.md
│   │   └── pda-template.xlsx
│   └── [other ports]/
├── training/
│   ├── pda-preparation-guide.md
│   ├── fda-preparation-guide.md
│   ├── common-errors.md
│   └── best-practices.md
└── templates/
    ├── pda-template-general.xlsx
    └── fda-template-general.xlsx
```

### PDA/FDA Knowledge Base Content

#### 1. General Guides

**PDA Preparation Guide** (`pda-guide.md`):
- What is a PDA
- When to prepare
- Components of PDA
- Step-by-step preparation
- Common charge types
- Currency handling
- Agent responsibilities

**FDA Preparation Guide** (`fda-guide.md`):
- PDA vs FDA differences
- When to issue FDA
- Additional charges to watch for
- Reconciliation process
- Dispute handling
- Documentation requirements

#### 2. Port-Specific Guides

For each Indian port:

**Mumbai Port PDA Guide** (`INMUN-mumbai/typical-charges.md`):
```markdown
# Mumbai Port Trust - PDA/FDA Guide

## Typical Vessel Call Costs (10,000 GRT Container Vessel)

### Compulsory Charges
1. Port Dues: INR 26,500 (2.65 × 10,000)
2. Pilotage: INR 15,000 (inward + outward = 30,000)
3. Berth Hire: INR 37,500 (3.75 × 10,000 × 1 day)
4. Towage: INR 12,000 (inward + outward = 24,000)
5. Mooring: INR 5,000 (× 2 = 10,000)
6. Light Dues: INR 7,500
7. Conservancy: INR 4,000

**Subtotal Compulsory**: INR 145,500

### Optional Services
8. Shore power: INR 5,000/day
9. Fresh water: INR 300/ton
10. Garbage disposal: INR 2,000
11. Line handling: INR 3,000

### Agency Fees
12. Husbandry fee: $500
13. Documentation: INR 3,000

### Terminal Specific (Indira Dock)
14. Container terminal charges: Per TEU
15. Documentation fees
16. Gate charges

## Terminal Variations

### Victoria Dock / Princes Dock
- Lower berth hire (INR 3.50)
- General cargo handling

### Indira Dock (Container Terminal)
- Standard berth hire (INR 3.75)
- Container-specific charges

### Butcher Island (Oil Terminal)
- Higher berth hire (INR 4.20)
- Oil handling charges
- Pollution prevention fees

## Common PDA Items Checklist
- [ ] Port dues calculated correctly
- [ ] Pilotage (inward + outward)
- [ ] Berth hire (correct terminal)
- [ ] Towage (number of tugs)
- [ ] Mooring charges
- [ ] Light dues & conservancy
- [ ] Agency fees
- [ ] Services rendered
- [ ] Currency correctly stated
```

**JNPT PDA Guide** (`INNSA-jnpt/terminal-specific-charges.md`):
```markdown
# JNPT Terminal-Specific PDA Guide

## Terminal Selection Impact

### JNPCT (Public Terminal)
- Berth hire: INR 3.80/GRT/day
- Generally lower overall costs
- Standard service levels

### NSICT (APM Terminals)
- Berth hire: INR 4.00/GRT/day
- Premium service
- Faster turnaround

### NSIGT (DP World)
- Berth hire: INR 4.10/GRT/day
- Premium service
- Modern infrastructure

### GTI (Gateway Terminals India)
- Berth hire: INR 3.95/GRT/day
- Competitive pricing

## Anchorage Costs

### Shallow Water Anchorage (SWA)
- INR 1.20/GRT/day
- Typically used for waiting vessels
- Lower cost option

### Deep Water Anchorage (DWA)
- INR 1.50/GRT/day
- For larger vessels
- Better holding ground

## Sample PDA: 25,000 GRT Container Vessel at NSICT

1. Port dues: INR 65,000 (2.60 × 25,000)
2. Pilotage: INR 25,000 (15k-30k GRT bracket)
3. Berth hire: INR 100,000 (4.00 × 25,000 × 1 day) @ NSICT
4. Towage: INR 14,000 (15k-30k GRT)
5. Mooring: INR 5,500
6. Light dues: INR 20,000
7. Channel dues: INR 12,500

**Total**: INR 242,000 + agency fees + services
```

#### 3. Training Materials

**Common PDA Errors** (`training/common-errors.md`):
```markdown
# Common PDA/FDA Errors to Avoid

## 1. Wrong Berth Hire Rate
❌ Using general port rate instead of terminal-specific rate
✅ Check which terminal vessel actually berthed at
   Example: JNPT - NSICT charges INR 4.00, not the general INR 3.80

## 2. Pilotage Calculation Errors
❌ Using one-way pilotage
✅ Always include inward + outward = 2× base rate
   Exception: Vessel shifted anchorage only

## 3. Wrong GRT
❌ Using DWT or LOA instead of GRT
✅ Always use Gross Registered Tonnage for per-GRT charges

## 4. Terminal Charges Not Included
❌ Only including port authority charges
✅ Include terminal operator charges (NSICT, DP World charges)

## 5. Anchorage Days Miscalculated
❌ Counting from arrival to berth
✅ Only charge for days actually at anchorage
```

#### 4. RAG Integration

Ingest all PDA/FDA documents into Knowledge Engine:

```typescript
// Ingest PDA/FDA documents
await knowledgeEngine.ingestDocument({
  title: 'Mumbai Port PDA Guide',
  content: readFileSync('pda-fda/INMUN-mumbai/typical-charges.md'),
  category: 'pda-fda',
  tags: ['pda', 'mumbai', 'INMUN', 'port-charges'],
  portUnlocode: 'INMUN',
});

// Query examples:
// "What are typical PDA costs for Mumbai?"
// "JNPT berth hire charges for container vessels"
// "Difference between NSICT and JNPCT charges"
```

### Frontend Features

**PDA/FDA Calculator**:
```typescript
interface PDACalculatorInput {
  portUnlocode: string;
  terminalId?: string;
  vesselGRT: number;
  vesselType: 'container' | 'bulk' | 'tanker' | 'general';
  daysAtBerth: number;
  daysAtAnchorage?: number;
  anchorageType?: 'shallow' | 'deep';
  services: string[]; // water, garbage, etc
}

// Returns:
// - Estimated total cost
// - Breakdown by charge type
// - Terminal comparison (if multiple)
// - Similar vessel historical costs
```

**PDA/FDA Assistant (AI)**:
- Natural language queries
- "Calculate PDA for 15,000 GRT at Mumbai Victoria Dock"
- "Compare costs between JNPT terminals"
- "What's missing from this PDA?"

---

## 🏗️ Implementation Roadmap

### Week 1: Enhanced Indian Port Scrapers
- [x] Mumbai Port Trust - 21 tariff variations
- [x] JNPT - 21 tariff variations
- [ ] Enhance Kandla - terminals & berths
- [ ] Enhance Mundra - Adani terminals
- [ ] Add Chennai
- [ ] Add Visakhapatnam

### Week 2: OpenStreetMap Integration
- [ ] Add PostGIS extension to database
- [ ] Create terminal/berth/anchorage tables
- [ ] Build Overpass API scraper
- [ ] Import OSM data for Indian ports
- [ ] Create port map visualization component
- [ ] Add berth selection to voyage planning

### Week 3: PDA/FDA Documentation
- [ ] Create directory structure
- [ ] Write general PDA/FDA guides
- [ ] Create port-specific guides (Mumbai, JNPT, Kandla, Mundra)
- [ ] Develop Excel templates
- [ ] Create training materials
- [ ] Ingest into RAG knowledge engine

### Week 4: Frontend Features
- [ ] Port map view with terminals
- [ ] Berth selection in chartering
- [ ] PDA/FDA calculator
- [ ] PDA/FDA AI assistant
- [ ] Historical cost comparison

---

## 📊 Success Metrics

1. **Coverage**: All 12 major Indian ports with terminal-level detail
2. **Accuracy**: Terminal-specific tariffs verified
3. **Usability**: Users can select specific berth and get accurate costs
4. **Training**: PDA/FDA guides reduce errors by 50%
5. **Visualization**: 100% of major terminals mapped on OpenStreetMap

---

## 🎯 Next Immediate Actions

1. **Enhance Kandla & Mundra** scrapers with terminal details
2. **Add Chennai & Visakhapatnam** as next priority ports
3. **Start PDA/FDA guide** for Mumbai (most complex)
4. **Research OpenStreetMap data** availability for Indian ports
5. **Create database migration** for terminal/berth tables

---

## 📚 Resources Needed

1. **Port Authority Websites**:
   - Mumbai Port Trust: https://www.mumbaiport.gov.in
   - JNPT: https://www.jnport.gov.in
   - Kandla: https://www.deendayalport.gov.in
   - Chennai: https://www.chennaiport.gov.in
   - V.O. Chidambaranar: https://www.vocport.gov.in

2. **OpenStreetMap Tools**:
   - Overpass Turbo: https://overpass-turbo.eu
   - OpenSeaMap: https://map.openseamap.org
   - OSM Wiki: https://wiki.openstreetmap.org/wiki/Seamark

3. **Industry Documents**:
   - Sample PDA/FDA forms
   - Port tariff books
   - Agency fee schedules
   - Terminal operator rate cards

---

**Status**: Phase 1 (Mumbai & JNPT) Enhanced ✅
**Next**: Kandla, Mundra, Chennai, Visakhapatnam
