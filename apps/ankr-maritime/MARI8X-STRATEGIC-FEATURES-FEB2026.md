# Mari8X Strategic Feature Roadmap - February 2026

**Document Type:** Strategic Planning & Feature Brainstorming
**Date:** February 1, 2026
**Status:** Comprehensive feature analysis across the entire Mari8X ecosystem
**Vision:** Build world-class maritime operations platform with AI-first approach

---

## 📧 Part 1: World-Class Email Intelligence Engine

### Current Reality: The Broker Email Problem

**Problem Statement:**
- Maritime brokers receive 500-2000 emails/day
- 80% are cargo enquiries, vessel positions, or fixture recaps
- Manual sorting takes 2-3 hours daily
- Critical fixtures lost in inbox noise
- No centralized intelligence from email conversations

### Mari8X EmailIntel™ - World-Class Solution

#### 🎯 Core Features

**1. Universal Email Integration**
```
┌─────────────────────────────────────────────┐
│         Mari8X EmailIntel Engine             │
├─────────────────────────────────────────────┤
│                                             │
│  Connectors:                                 │
│  ✅ Microsoft Exchange (EWS API)            │
│  ✅ Microsoft 365 (Graph API)               │
│  ✅ Google Workspace (Gmail API)            │
│  ✅ Generic IMAP/SMTP (all providers)       │
│  ✅ AWS SES (inbound mail)                  │
│  ✅ SendGrid (inbound parse webhook)        │
│                                             │
│  Authentication:                             │
│  ✅ OAuth 2.0 (MS, Google)                  │
│  ✅ Service accounts (domain-wide)          │
│  ✅ App passwords (legacy IMAP)             │
│  ✅ SSO integration (SAML, OIDC)            │
│                                             │
└─────────────────────────────────────────────┘
```

#### 📊 Email Classification (AI-Powered)

**13 Maritime Email Categories:**

1. **CARGO_ENQUIRY** - "Need vessel for 50k wheat USEC-Egypt"
2. **VESSEL_POSITION** - "MV Atlantic open Singapore Jan 15"
3. **FIXTURE_RECAP** - "Subjects lifted on..."
4. **RATE_INDICATION** - "WSI 50-55 for Panamax USEC"
5. **LAYCAN_EXTENSION** - "Request laycan push to..."
6. **DEMURRAGE_CLAIM** - "We claim 3 days demurrage..."
7. **INSPECTION_REPORT** - "Attached condition survey..."
8. **BUNKER_QUOTE** - "380CST HSFO @ $565 Rotterdam"
9. **CHARTER_PARTY** - "Attached C/P as agreed..."
10. **INVOICE** - "Please find attached invoice..."
11. **WEATHER_DELAY** - "Vessel delayed due to..."
12. **PORT_NOMINATION** - "Charterers nominate..."
13. **GENERAL** - Everything else

#### 🧠 Entity Extraction (NLP)

**Automatically Extract:**
- **Vessel names** - "MV ATLANTIC" → Link to vessel database
- **Port names** - "Singapore", "Rotterdam" → Geocode
- **Cargo types** - "50,000 MT wheat", "70k coal" → Standardize
- **Dates & Laycans** - "15-20 January" → Calendar events
- **Rates & Prices** - "$20,000 pdpr", "WSI 50" → Normalize to USD
- **Companies** - "Cargill", "Vitol" → Link to company records
- **People** - "John Smith" → Contact database
- **IMO numbers** - "9234567" → Vessel lookup

#### 🔄 Smart Actions (Automated Workflows)

```typescript
// Example: Auto-create cargo enquiry from email
When Email.category === 'CARGO_ENQUIRY':
  1. Extract entities (cargo, ports, laycan, quantity)
  2. Create CargoEnquiry record in database
  3. Match against available vessels
  4. Suggest 3 best vessels (AI ranking)
  5. Draft response email (pre-fill vessel details)
  6. Notify relevant brokers (Slack, Teams)
  7. Add to CRM pipeline

// Example: Auto-track fixture progress
When Email.category === 'FIXTURE_RECAP':
  1. Extract C/P terms
  2. Create or update Voyage
  3. Link Vessel, Charterer, Cargo
  4. Set up milestone tracking
  5. Schedule follow-up tasks
  6. Generate P&L estimate
```

#### 📈 Email Intelligence Dashboard

**Real-Time Metrics:**
- Emails processed today: 847
- Cargo enquiries: 123 (↑15%)
- Vessel positions: 89
- Active threads: 42
- Response time avg: 18 minutes
- AI confidence avg: 94%
- Manual review queue: 7 emails

**Insights:**
- Trending cargo types this week
- Most active charterers
- Busiest routes (cargo + vessel matches)
- Response time by broker
- Email→Fixture conversion rate

---

### 🛠️ Technical Implementation

#### Email Sync Architecture

```typescript
// Services to build:

1. /backend/src/services/email/
   ├── connectors/
   │   ├── microsoft-graph.ts      // MS 365 API
   │   ├── microsoft-exchange.ts   // Exchange EWS
   │   ├── google-gmail.ts         // Gmail API
   │   ├── generic-imap.ts         // IMAP4rev1
   │   └── sendgrid-inbound.ts     // Webhook receiver
   │
   ├── email-classifier.ts         // AI classification
   ├── entity-extractor.ts         // NLP entity extraction
   ├── email-sync-service.ts       // Sync orchestration
   ├── email-thread-manager.ts     // Thread tracking
   └── smart-actions.ts            // Workflow automation

2. /backend/prisma/schema.prisma
   model EmailAccount {
     id         String   @id
     userId     String
     provider   EmailProvider // MICROSOFT | GOOGLE | IMAP
     email      String
     authTokens Json     // Encrypted OAuth tokens
     syncStatus SyncStatus
     lastSync   DateTime
     settings   Json     // Folders to sync, filters
   }

   model EmailMessage {
     id           String   @id
     accountId    String
     messageId    String   // Email Message-ID header
     threadId     String
     from         String
     to           String[]
     cc           String[]
     subject      String
     body         String   // Plain text
     bodyHtml     String   // HTML
     receivedAt   DateTime

     // AI Classification
     category     EmailCategory
     confidence   Float
     priority     EmailPriority

     // Extracted Entities
     vessels      VesselMention[]
     ports        PortMention[]
     cargoes      CargoMention[]
     laycans      DateRange[]
     rates        RateMention[]
     companies    String[]
     contacts     String[]

     // Linked Records
     cargoEnquiryId   String?
     voyageId         String?
     charterPartyId   String?

     // Status
     processed    Boolean  @default(false)
     starred      Boolean  @default(false)
     archived     Boolean  @default(false)
     tags         String[]
   }

3. /backend/src/workers/
   ├── email-sync-worker.ts        // BullMQ job for syncing
   ├── email-classification-worker.ts // AI classification queue
   └── entity-extraction-worker.ts // NLP processing queue
```

#### Email Sync Frequency

**Real-Time Push (Preferred):**
- Microsoft Graph: Webhooks (subscription-based)
- Gmail API: Push notifications (Cloud Pub/Sub)
- Latency: <5 seconds

**Polling (Fallback):**
- IMAP IDLE: Near real-time (30s-2min latency)
- IMAP poll: Every 5 minutes
- Exchange EWS: Every 2 minutes

#### AI Classification Pipeline

```
Incoming Email
     ↓
1. Text Preprocessing
   - Strip signatures, disclaimers
   - Extract plain text from HTML
   - Normalize whitespace
     ↓
2. Category Classification
   - Model: Fine-tuned BERT for maritime
   - Input: Subject + Body (first 2000 chars)
   - Output: Category + Confidence (0-1)
     ↓
3. Entity Extraction
   - Model: Named Entity Recognition (NER)
   - Entities: Vessels, Ports, Cargo, Dates, Rates
   - Tool: @ankr/eon (Maritime entity dictionary)
     ↓
4. Confidence Routing
   - If confidence ≥ 0.85: Auto-process
   - If 0.60 < confidence < 0.85: Suggest, ask user
   - If confidence < 0.60: Manual review queue
     ↓
5. Smart Actions
   - Auto-create records (CargoEnquiry, Voyage)
   - Link to existing records
   - Trigger notifications
   - Generate draft responses
```

#### Security & Compliance

**Data Protection:**
- All email content encrypted at rest (AES-256)
- OAuth tokens encrypted with separate key
- No plain-text passwords stored
- TLS 1.3 for all connections
- Email retention policies configurable (90 days default)

**Permissions:**
- User-level email access (not company-wide by default)
- Admin can enable company-wide search (with audit log)
- GDPR-compliant data deletion
- Audit log for all email access

**Compliance:**
- GDPR Article 6(1)(f) - Legitimate interest (contract execution)
- MiFID II - Record keeping for transactions
- ISO 27001 - Information security

---

### 📦 Email Engine MVP (4 weeks)

#### Week 1: Core Connectors
- Microsoft Graph API integration
- Google Gmail API integration
- Generic IMAP connector
- OAuth 2.0 flow (MS + Google)
- Database schema (EmailAccount, EmailMessage)

#### Week 2: Email Sync
- Sync orchestration service
- Real-time webhooks (MS Graph)
- Push notifications (Gmail)
- IMAP IDLE fallback
- BullMQ workers for background sync

#### Week 3: AI Classification
- Email classifier (13 categories)
- Entity extractor (vessels, ports, cargo)
- Confidence scoring
- Manual review queue
- Training data collection

#### Week 4: Smart Actions
- Auto-create CargoEnquiry from email
- Auto-link emails to voyages
- Draft response generator
- Email thread tracking
- Dashboard UI

---

## 🚢 Part 2: Routing Engine V2 - AIS-Powered

### Mari8X_RouteEngine™ Evolution

Based on existing docs (MARI8X-ROUTEENGINE-COMPLETE-SPEC.md, AIS-ROUTING-ENGINE-V2-PLAN.md), here's the V2 roadmap:

#### 🎯 Current State
- Basic great circle routing
- Static waypoints
- No vessel-type awareness
- No learning capability

#### 🚀 V2: Mean/Median Learning Routes

**Core Concept:**
Learn main shipping routes from millions of real AIS tracks, then provide **proven** routes based on **actual vessel behavior**.

### Architecture: Route Learning System

```
┌─────────────────────────────────────────────────────────────┐
│              Mari8X_RouteEngine V2 Architecture              │
└─────────────────────────────────────────────────────────────┘

1. AIS DATA INGESTION
   ├── Real-time AIS feed (AISHub, MarineTraffic API)
   ├── Historical AIS database (last 3 years)
   ├── Satellite AIS (oceanic coverage)
   └── Own AIS receivers (near major ports)
        ↓
2. TRACK PROCESSING
   ├── Clean tracks (remove noise, outliers)
   ├── Segment by voyage (A→B movements)
   ├── Categorize by vessel type (Tanker, Bulk, Container, etc.)
   ├── Store as PostGIS LineStrings
   └── Index by origin-destination pairs
        ↓
3. ROUTE DISCOVERY (Clustering)
   ├── For each O-D pair + vessel type:
   │   ├── Cluster tracks using DBSCAN/K-means
   │   ├── Extract "main routes" (densest clusters)
   │   ├── Compute mean/median route per cluster
   │   └── Rank routes by frequency (Route 1, 2, 3...)
   │
   └── Output: Learned Routes Database
        ↓
4. ROUTE FEATURES (Per Route)
   ├── Geometry: Polyline (waypoints every 50nm)
   ├── Distance: Actual distance (not great circle)
   ├── Depth profile: Min/mean/max depth along route
   ├── Traffic density: How many vessels use it
   ├── Seasonal patterns: Winter vs Summer usage
   ├── ETA statistics: Mean, P50, P95 transit times
   ├── Weather exposure: % in high-risk zones
   └── Vessel compatibility: Draft, type, size
        ↓
5. ROUTING API
   └── Input: Origin, Destination, Vessel (type, draft, speed)
      Output: Ranked routes with ETAs, distances, recommendations
```

### Database Schema: Learned Routes

```sql
-- Learned main routes (mean/median from AIS clusters)
CREATE TABLE learned_routes (
  id                UUID PRIMARY KEY,
  origin_port       VARCHAR(50),      -- e.g., 'SGSIN'
  destination_port  VARCHAR(50),      -- e.g., 'USNYC'
  vessel_type       VARCHAR(50),      -- 'TANKER', 'BULK_CARRIER', 'CONTAINER'
  route_rank        INTEGER,          -- 1 = most popular, 2 = second most, etc.

  -- Geometry
  route_geometry    GEOMETRY(LINESTRING, 4326), -- PostGIS
  waypoints         JSONB,            -- [{lat, lng, name}]

  -- Statistics from AIS data
  sample_size       INTEGER,          -- How many actual transits in this cluster
  distance_nm       NUMERIC(10,2),    -- Actual distance (not GC)

  -- Depth & Safety
  min_depth_m       NUMERIC(8,2),     -- Shallowest point on route
  mean_depth_m      NUMERIC(8,2),
  max_draft         NUMERIC(6,2),     -- Safe for vessels up to this draft

  -- Transit Time Statistics
  eta_mean_hours    NUMERIC(8,2),
  eta_p50_hours     NUMERIC(8,2),     -- Median
  eta_p95_hours     NUMERIC(8,2),     -- 95th percentile (worst case)
  speed_mean_knots  NUMERIC(5,2),

  -- Seasonal Adjustments
  winter_eta_adj    NUMERIC(5,2),     -- +10% in winter (weather)
  summer_eta_adj    NUMERIC(5,2),     -- -5% in summer

  -- Traffic & Popularity
  traffic_density   INTEGER,          -- Transits/month
  last_observed     TIMESTAMP,        -- When we last saw a vessel on this route

  -- Metadata
  created_at        TIMESTAMP,
  updated_at        TIMESTAMP,
  data_version      VARCHAR(20)       -- Track when routes were last learned
);

CREATE INDEX idx_learned_routes_od ON learned_routes (origin_port, destination_port);
CREATE INDEX idx_learned_routes_type ON learned_routes (vessel_type);
CREATE INDEX idx_learned_routes_geom ON learned_routes USING GIST (route_geometry);

-- Original AIS tracks (raw data for learning)
CREATE TABLE ais_tracks (
  id                UUID PRIMARY KEY,
  mmsi              VARCHAR(15),
  imo               VARCHAR(10),
  vessel_type       VARCHAR(50),
  vessel_name       VARCHAR(255),
  draft             NUMERIC(5,2),

  -- Track segment (one voyage A→B)
  origin_port       VARCHAR(50),
  destination_port  VARCHAR(50),
  departure_time    TIMESTAMP,
  arrival_time      TIMESTAMP,

  -- Geometry (full track)
  track_geometry    GEOMETRY(LINESTRING, 4326),
  track_points      JSONB,          -- [{lat, lng, sog, cog, timestamp}]

  -- Computed metrics
  distance_sailed   NUMERIC(10,2),  -- nm
  avg_speed         NUMERIC(5,2),   -- knots
  transit_hours     NUMERIC(8,2),

  -- Data source
  source            VARCHAR(50),    -- 'AISHUB', 'MARINETRAFFIC', 'SPIRE'
  quality_score     NUMERIC(3,2),   -- 0-1 (data completeness)

  created_at        TIMESTAMP
);

CREATE INDEX idx_ais_tracks_od ON ais_tracks (origin_port, destination_port);
CREATE INDEX idx_ais_tracks_vessel_type ON ais_tracks (vessel_type);
CREATE INDEX idx_ais_tracks_geom ON ais_tracks USING GIST (track_geometry);

-- Route waypoints (for navigation display)
CREATE TABLE route_waypoints (
  id                UUID PRIMARY KEY,
  learned_route_id  UUID REFERENCES learned_routes(id),
  sequence          INTEGER,        -- Order in route
  latitude          NUMERIC(10,7),
  longitude         NUMERIC(10,7),
  name              VARCHAR(100),   -- Optional (e.g., "Suez Canal", "Cape of Good Hope")
  type              VARCHAR(50),    -- 'WAYPOINT', 'TSS_ENTRY', 'CANAL', 'PILOT_STATION'
  mandatory         BOOLEAN,        -- Must pass through this point?
  eta_from_start    NUMERIC(8,2)    -- Hours from route start
);

-- Seasonal route adjustments
CREATE TABLE route_seasonal_stats (
  id                UUID PRIMARY KEY,
  learned_route_id  UUID REFERENCES learned_routes(id),
  season            VARCHAR(20),    -- 'WINTER', 'SUMMER', 'MONSOON'
  month_start       INTEGER,        -- 1-12
  month_end         INTEGER,

  eta_adjustment    NUMERIC(5,2),   -- % faster/slower
  traffic_change    NUMERIC(5,2),   -- % more/less traffic
  risk_level        VARCHAR(20),    -- 'LOW', 'MEDIUM', 'HIGH'
  notes             TEXT            -- "Monsoon season in Indian Ocean"
);
```

### Route Learning Algorithm (Python/SQL)

```python
# /backend/scripts/learn-routes-from-ais.py

import pandas as pd
import geopandas as gpd
from sklearn.cluster import DBSCAN
from shapely.geometry import LineString, Point
import psycopg2

def learn_routes_for_od_pair(origin, destination, vessel_type):
    """
    Learn main routes from AIS tracks for a given O-D pair.

    Steps:
    1. Fetch all AIS tracks for this O-D pair + vessel type (last 3 years)
    2. Normalize tracks (interpolate to same # of points)
    3. Cluster tracks using DBSCAN (epsilon = 50nm)
    4. For each cluster, compute mean/median route
    5. Rank routes by cluster size (frequency)
    6. Save to learned_routes table
    """

    # 1. Fetch tracks from database
    tracks = fetch_ais_tracks(origin, destination, vessel_type)
    # tracks = List[{geometry: LineString, transit_hours: float, ...}]

    if len(tracks) < 10:
        print(f"Not enough data for {origin}-{destination} ({vessel_type}): {len(tracks)} tracks")
        return None

    # 2. Normalize tracks (interpolate to 100 points each)
    normalized = []
    for track in tracks:
        points = interpolate_linestring(track['geometry'], num_points=100)
        normalized.append(points)  # [[lat, lng], [lat, lng], ...]

    # 3. Cluster tracks using DBSCAN
    # Convert to feature matrix: [track1_point1_lat, track1_point1_lng, ..., track1_point100_lng]
    X = np.array([np.array(points).flatten() for points in normalized])

    # DBSCAN clustering (epsilon=distance threshold, min_samples=3)
    clustering = DBSCAN(eps=0.5, min_samples=3).fit(X)
    labels = clustering.labels_

    # 4. For each cluster, compute mean route
    unique_labels = set(labels) - {-1}  # -1 = noise
    learned_routes = []

    for label in unique_labels:
        cluster_tracks = [normalized[i] for i in range(len(normalized)) if labels[i] == label]

        # Compute mean route (average each point)
        mean_route = []
        for point_idx in range(100):
            lats = [track[point_idx][0] for track in cluster_tracks]
            lngs = [track[point_idx][1] for track in cluster_tracks]
            mean_route.append([np.mean(lats), np.mean(lngs)])

        # Convert to LineString
        route_geom = LineString([(p[1], p[0]) for p in mean_route])  # (lng, lat) for PostGIS

        # Compute statistics
        sample_tracks = [tracks[i] for i in range(len(tracks)) if labels[i] == label]
        distance_nm = np.mean([t['distance_sailed'] for t in sample_tracks])
        eta_mean = np.mean([t['transit_hours'] for t in sample_tracks])
        eta_p50 = np.percentile([t['transit_hours'] for t in sample_tracks], 50)
        eta_p95 = np.percentile([t['transit_hours'] for t in sample_tracks], 95)

        learned_routes.append({
            'route_rank': len(learned_routes) + 1,
            'geometry': route_geom,
            'sample_size': len(sample_tracks),
            'distance_nm': distance_nm,
            'eta_mean_hours': eta_mean,
            'eta_p50_hours': eta_p50,
            'eta_p95_hours': eta_p95,
            'traffic_density': len(sample_tracks)  # Transits in dataset
        })

    # 5. Rank routes by sample size (most popular first)
    learned_routes.sort(key=lambda r: r['sample_size'], reverse=True)
    for i, route in enumerate(learned_routes):
        route['route_rank'] = i + 1

    # 6. Save to database
    save_learned_routes(origin, destination, vessel_type, learned_routes)

    return learned_routes

def save_learned_routes(origin, destination, vessel_type, routes):
    """Save learned routes to database."""
    conn = psycopg2.connect("...")
    cur = conn.cursor()

    for route in routes:
        cur.execute("""
            INSERT INTO learned_routes (
                id, origin_port, destination_port, vessel_type, route_rank,
                route_geometry, sample_size, distance_nm,
                eta_mean_hours, eta_p50_hours, eta_p95_hours, traffic_density,
                created_at, updated_at
            ) VALUES (
                gen_random_uuid(), %s, %s, %s, %s,
                ST_GeomFromText(%s, 4326), %s, %s,
                %s, %s, %s, %s,
                NOW(), NOW()
            )
        """, (
            origin, destination, vessel_type, route['route_rank'],
            route['geometry'].wkt, route['sample_size'], route['distance_nm'],
            route['eta_mean_hours'], route['eta_p50_hours'], route['eta_p95_hours'],
            route['traffic_density']
        ))

    conn.commit()
    cur.close()
    conn.close()

# Run learning for all O-D pairs
if __name__ == '__main__':
    # Major routes
    od_pairs = [
        ('SGSIN', 'USNYC'),  # Singapore → New York
        ('GBSOU', 'SGSIN'),  # Southampton → Singapore
        ('AEDXB', 'INMUN'),  # Dubai → Mumbai
        # ... 500+ major routes
    ]

    vessel_types = ['TANKER', 'BULK_CARRIER', 'CONTAINER', 'GENERAL_CARGO']

    for origin, destination in od_pairs:
        for vessel_type in vessel_types:
            print(f"Learning routes: {origin} → {destination} ({vessel_type})")
            learn_routes_for_od_pair(origin, destination, vessel_type)
```

### GraphQL API: Route Recommendation

```graphql
# Query: Get recommended routes
query {
  recommendRoutes(
    origin: "SGSIN"              # Singapore
    destination: "NLRTM"         # Rotterdam
    vesselType: CONTAINER
    vesselDraft: 12.5            # meters
    vesselSpeed: 22              # knots
    departureDate: "2026-02-15"
    options: {
      includeAlternatives: true  # Show top 3 routes
      optimizeFor: FASTEST       # FASTEST | SHORTEST | SAFEST
      avoidHighRisk: true        # Avoid piracy zones
    }
  ) {
    routes {
      routeRank                  # 1 = most popular
      routeName                  # "Main Suez Route"
      distanceNm                 # 8,350 nm
      estimatedDays              # 15.8 days
      confidence                 # 0.95 (based on sample size)

      waypointCount              # 47
      waypoints {
        lat
        lng
        name                     # "Suez Canal", "Bab-el-Mandeb"
        etaFromStart             # Hours from departure
      }

      routeFeatures {
        minDepth                 # 18.5m (safe for 12.5m draft)
        trafficDensity           # "HIGH" (150 transits/month)
        weatherRisk              # "LOW"
        piracyRisk               # "MEDIUM" (Gulf of Aden)
        fuelConsumption          # Estimated MT
      }

      historicalPerformance {
        sampleSize               # 847 actual transits
        meanTransitDays          # 15.8
        p50TransitDays           # 15.2 (median)
        p95TransitDays           # 18.5 (worst case)
        seasonalAdjustment       # "+10% in winter monsoon"
      }

      alternativeRoutes {
        name                     # "Cape of Good Hope Route"
        distanceDifference       # "+3,500 nm"
        timeDifference           # "+7 days"
        reason                   # "Avoids Suez Canal fees, lower piracy risk"
      }
    }
  }
}
```

---

## 🌟 Part 3: Feature Brainstorming - Whole System

Now that I've reviewed the entire Mari8X platform, here are 50+ world-class features we can build:

### Category 1: AI & Automation (10 features)

**1. AI-Powered Fixture Matching**
- Auto-match cargo enquiries with available vessels
- ML ranking algorithm (distance, timing, vessel suitability, price)
- "Tinder for shipping" - swipe through matches

**2. Smart Charter Party Generator**
- Input: Basic terms (laycan, ports, rate)
- Output: Complete NYPE/Gencon/BIMCO C/P with all clauses
- Legal AI trained on 10,000+ actual charter parties

**3. Predictive Demurrage Alerts**
- Analyze laytime consumption real-time
- Alert: "65% laytime used, on track for 2 days demurrage"
- Suggest actions to avoid demurrage

**4. Dynamic Pricing Engine**
- ML model predicting freight rates 7-30 days ahead
- Based on: Baltic Index, fuel prices, port congestion, seasonality
- Confidence bands (P10, P50, P90 rates)

**5. Cargo Documentation AI**
- Upload scanned B/L, invoice, packing list (PDF/image)
- Auto-extract all fields → database
- Flag discrepancies (quantity mismatch, wrong shipper, etc.)

**6. Vessel Performance Anomaly Detection**
- Monitor fuel consumption, speed, emissions
- Alert if vessel performing 10% worse than baseline
- "MV Atlantic consuming 15% more fuel than usual - possible hull fouling"

**7. Port Congestion Predictor**
- Analyze AIS data → predict port wait times
- "Singapore container terminal: 2-day wait expected next week"
- Suggest alternative ports or delay departure

**8. Bunker Optimization Advisor**
- Given voyage route, suggest optimal bunkering ports
- Consider: Fuel price, deviation, availability, quality
- "Bunker in Singapore ($585/MT) vs Fujairah ($605/MT) saves $12,000"

**9. Weather Routing + ETA Updates**
- Integrate weather forecasts with AIS position
- Auto-update ETA if vessel deviates or slows due to weather
- Proactive notifications to charterers

**10. Compliance Risk Scoring**
- Analyze vessel, owner, flag, class → risk score (0-100)
- Check sanctions lists (OFAC, EU, UN)
- "Warning: This vessel flagged in Panama Papers, high vetting risk"

---

### Category 2: Communication & Collaboration (8 features)

**11. Unified Maritime Inbox** (Described above)
- MS Exchange, Google, IMAP integration
- AI categorization + entity extraction
- Smart actions (auto-create enquiries)

**12. Real-Time Chat (Internal Teams)**
- Slack/Teams-like interface inside Mari8X
- Channels: #fixtures, #operations, #snp
- Tag vessels, cargoes, voyages in messages
- Search entire conversation history

**13. Broker Network (B2B Marketplace)**
- Connect with other shipbrokers globally
- Share vessel positions, cargo leads
- Reputation system (ratings, reviews)
- "Tinder for Brokers" - match complementary needs

**14. Video Calls + Screen Sharing**
- WebRTC-based calls
- Screen share for reviewing C/Ps, invoices
- Record important negotiations

**15. Document Collaboration**
- Google Docs-style editing for C/Ps
- Track changes, version history
- Multi-party editing (owner, charterer, broker)

**16. Email Templates Library**
- Pre-built templates for common scenarios
- "Cargo Enquiry Response", "Laycan Extension Request"
- Personalize with vessel/cargo details (1-click)

**17. WhatsApp/Telegram Integration**
- Send voyage updates via WhatsApp
- Chatbot: "What's the ETA for MV Atlantic?" → Bot replies
- Alert notifications (high-priority fixtures)

**18. Voice-to-Text Transcription**
- Record phone calls with brokers/charterers
- Auto-transcribe + extract action items
- "John agreed to $21k per day" → Update fixture

---

### Category 3: Chartering & Operations (12 features)

**19. Voyage Estimator Pro**
- Advanced P&L with 50+ cost items
- Sensitivity analysis (what-if scenarios)
- Compare voyage vs time charter equivalent

**20. Laytime Calculator**
- Real-time laytime tracking
- Upload SOF/NOR → auto-calculate
- Demurrage/despatch calculation
- Export laytime statement (PDF)

**21. Hire Statement Generator**
- Auto-generate monthly hire statements
- Bunker on/off accounts
- Deductions (off-hire, commissions)
- Email to charterers (automated)

**22. Port Cost Estimator**
- Estimate port costs for 800+ ports
- Line items: Pilotage, tugs, berth, agency, dues
- Based on vessel size, cargo type
- Compare ports: "Mombasa vs Dar es Salaam"

**23. Cargo Compatibility Matrix**
- "Can I load palm oil after coal?"
- Database of 500+ cargo types
- Previous cargo restrictions
- Required tank cleaning procedures

**24. Canal Transit Planner**
- Suez, Panama, Kiel Canal
- Booking system integration (API)
- Cost calculator
- Transit time estimates

**25. Fuel Consumption Tracker**
- Log daily fuel consumption (ballast, laden)
- Compare vs vessel specs
- Chart: Consumption vs speed curve
- Bunker procurement recommendations

**26. Weather Delay Documentation**
- Record weather delays with photos, reports
- Link to weather API (historical proof)
- Export for charterer notification
- Support demurrage/off-hire claims

**27. Cargo Claims Manager**
- Track cargo shortage/damage claims
- Document evidence (photos, surveys)
- Calculate claim amount
- Generate claim letter

**28. Vessel Vetting Checklist**
- SIRE inspection tracker
- RightShip rating monitor
- Expiry alerts (P&I, H&M, Class)
- Generate vetting questionnaire (Q88)

**29. Fixture Comparison Tool**
- Compare 5 fixture offers side-by-side
- Normalize terms (worldscale → $/MT)
- Rank by profitability
- "Best fixture: Offer #3 ($850k profit vs $720k)"

**30. Nomination Tracker**
- Track charterer nominations (port, berth, agents)
- Deadline reminders
- History: "Last 3 voyages → always Port A"

---

### Category 4: S&P (Sale & Purchase) (8 features)

**31. Vessel Valuation Dashboard**
- Live market valuations (VesselsValue, Clarksons)
- Compare 5 valuation methods
- Price trend chart (last 12 months)
- Alert: "MV Atlantic value up 12% this quarter"

**32. Vessel Comparison Tool**
- Compare 10 vessels side-by-side
- Specs: DWT, built, engine, consumption
- Commercial: Market value, charter rates
- Technical: Class, P&I, survey dates

**33. MOA (Memorandum of Agreement) Generator**
- Template library (NSF 2012, Saleform, etc.)
- Fill in vessel details, price, terms
- Auto-generate PDF with signature fields
- Track negotiation versions

**34. Inspection Report Database**
- Upload condition surveys, photos
- Tag findings by category (hull, M&E, deck)
- Search: "Show all Panamax with good hull condition"
- Share with buyers/banks

**35. Ship Finance Calculator**
- Loan repayment schedule
- Interest rates, balloon payments
- Cash flow projections
- Compare lease vs purchase

**36. Scrap Value Calculator**
- LDT (lightweight tonnage) estimate
- Steel scrap price ($/LDT)
- Demolition yard quotes (India, Bangladesh)
- "MV Atlantic scrap value: $4.2M"

**37. Fleet Portfolio Manager**
- Track owned/managed vessels
- Market value vs book value
- Cash flow: Income (TC), Opex, Capex
- Sell recommendations

**38. Buyer/Seller Network**
- List vessels for sale (marketplace)
- Confidential listings (blind broker)
- Inquiry management
- Deal pipeline (leads → negotiations → closed)

---

### Category 5: Compliance & Reporting (8 features)

**39. Sanctions Screening**
- Real-time OFAC, EU, UN sanctions check
- Screen vessels, owners, charterers, ports
- Alert if any party added to sanctions list
- Audit trail for compliance

**40. Carbon Footprint Tracker**
- Calculate CO2 emissions per voyage
- CII (Carbon Intensity Indicator) rating
- EU ETS (Emissions Trading System) cost
- Offset recommendations

**41. MRV/DCS Reporting**
- EU MRV (Monitoring, Reporting, Verification)
- IMO DCS (Data Collection System)
- Auto-generate quarterly/annual reports
- Submit to authorities (API integration)

**42. BSEE/Ballast Water Compliance**
- Track ballast water exchange/treatment
- Port state requirements database
- Generate BWM log entries
- Alert: "US-bound vessel - USCG inspection likely"

**43. Crew License & Certificate Tracker**
- Expiry alerts (STCW, COC, medical)
- Seafarer database
- Training records
- Manning agency integration

**44. Insurance Expiry Dashboard**
- P&I, H&M, war risks, FD&D
- Renewal reminders (90/60/30 days)
- Claims history
- Broker contact info

**45. Port State Control (PSC) Tracker**
- Log PSC inspections
- Deficiency tracking
- Target vessel risk score
- Stats: Detention rate by flag/class

**46. ISPS Code Compliance**
- Ship Security Plan (SSP) version control
- Security drills log
- ISSC (International Ship Security Certificate) expiry
- Port facility security coordination

---

### Category 6: Financial & Analytics (8 features)

**47. Real-Time P&L Dashboard**
- Live profit/loss across all voyages
- Voyage P&L, Time Charter P&L
- Drill down: Vessel → Voyage → Line items
- Compare actual vs budget

**48. Invoice Management**
- Create invoices (freight, demurrage, commissions)
- Track payment status
- Payment reminders (auto-email)
- Integrate with accounting (QuickBooks, Xero)

**49. Bank Guarantee Tracker**
- Track performance bonds, LCs, guarantees
- Expiry alerts
- Claim/release process
- Link to voyages/contracts

**50. Multi-Currency Support**
- Support 50+ currencies
- Live FX rates (XE.com API)
- Auto-convert: All reports in USD (or user currency)
- Hedge recommendations

**51. Commission Calculator**
- Address commission (charterer, owner)
- Brokerage commission (broker %)
- Auto-split multi-broker deals
- Generate commission invoices

**52. KPI Dashboard (Executive View)**
- Key metrics: Fleet utilization, avg TC rate, profit margin
- Compare: This month vs last month vs last year
- Charts: Revenue trend, cost breakdown
- Export: PDF report for investors/banks

**53. Benchmark Reports**
- Compare your performance vs market
- "Your Panamax TC rate: $18k/day, Market avg: $17.2k/day"
- Identify underperforming vessels
- Best practices from top performers

**54. Cash Flow Forecasting**
- Project cash inflows (freight, TC hire)
- Project cash outflows (bunkers, port costs, opex)
- 90-day cash flow forecast
- Alert: "Cash shortfall expected in March"

---

### Category 7: Ports & Terminals (6 features)

**55. Port Intelligence Dashboard** (Already exists, enhance)
- Real-time port congestion
- Berth availability
- Tariff comparisons
- Weather conditions
- Agent recommendations

**56. Terminal Performance Ratings**
- User reviews of terminals
- Loading/discharge rates
- Demurrage risk score
- "Terminal X: 95% on-time, low demurrage risk"

**57. Port Agent Network**
- Database of 5,000+ port agents globally
- Ratings, contact info, services
- Request quotes (DA, proforma)
- Track agent performance

**58. Pilotage & Tugs Booking**
- API integration with pilot stations
- Book pilots/tugs online
- ETA updates → auto-reschedule
- Cost transparency

**59. Cargo Handling Planner**
- Stowage plan for bulk/containers
- Loading sequence optimization
- Trim/stability calculator
- Share with terminal/stevedores

**60. Port Restriction Database**
- Max LOA, draft, air draft
- Tide tables (tidal ports)
- Seasonal restrictions (ice, monsoon)
- "This vessel can't enter at low tide"

---

### Category 8: Data & Integrations (6 features)

**61. API Marketplace**
- Open GraphQL API for Mari8X data
- Webhooks for real-time events
- API key management
- Usage analytics

**62. Third-Party Integrations**
- VesselsValue (valuations)
- MarineTraffic (AIS)
- IHS Markit (fleet data)
- Clarksons (market intelligence)
- Bloomberg (bunker prices)

**63. Excel Import/Export**
- Import vessels, voyages from Excel
- Export reports to Excel
- Template library (pre-formatted)

**64. Data Lake (Advanced)**
- Store all historical data
- SQL query interface
- Custom reports (BI tools: Tableau, Power BI)
- Data science playground

**65. Blockchain Integration (Optional)**
- Tokenize vessel ownership (fractional)
- Smart contracts for C/Ps
- Immutable cargo tracking (B/L)

**66. IoT Sensor Integration**
- Real-time vessel data (fuel, engine, GPS)
- Shore-based monitoring dashboard
- Predictive maintenance alerts

---

## 🎯 Part 4: Routing Engine V2 TODO

### Comprehensive TODO for Mari8X Routing Engine V2

```markdown
# Mari8X Routing Engine V2 - Complete TODO

## Phase 1: Data Foundation (4 weeks)

### Week 1: AIS Data Pipeline
- [ ] Set up AIS data sources
  - [ ] Register for AISHub free API
  - [ ] Register for MarineTraffic free tier
  - [ ] Evaluate OpenAIS community data
  - [ ] (Optional) Purchase historical AIS data (3 years)
- [ ] Create database schema (ais_tracks, learned_routes)
- [ ] Build AIS ingestion service
  - [ ] Real-time feed processor
  - [ ] Historical batch importer
  - [ ] Data quality validation
- [ ] Store tracks in PostgreSQL + PostGIS
- [ ] Index by origin-destination pairs

### Week 2: Track Processing
- [ ] Clean AIS tracks (remove noise, outliers)
- [ ] Segment tracks by voyage (A→B detection)
- [ ] Categorize by vessel type (from AIS vessel type code)
- [ ] Store as PostGIS LineStrings
- [ ] Quality scoring (completeness, sampling rate)

### Week 3: Route Discovery Engine
- [ ] Implement clustering algorithm (DBSCAN)
  - [ ] Track normalization (interpolate to 100 points)
  - [ ] Feature extraction (lat/lng matrix)
  - [ ] Hyperparameter tuning (epsilon, min_samples)
- [ ] Extract main routes from clusters
- [ ] Compute mean/median route per cluster
- [ ] Rank routes by frequency

### Week 4: Route Feature Extraction
- [ ] Compute distance (actual vs great circle)
- [ ] Extract depth profile (integrate bathymetry data)
- [ ] Calculate ETA statistics (mean, P50, P95)
- [ ] Identify seasonal patterns (winter vs summer)
- [ ] Traffic density (transits/month)

---

## Phase 2: Routing Intelligence (6 weeks)

### Week 5-6: Route Database
- [ ] Learn routes for 100 major O-D pairs
  - [ ] SGSIN → USNYC (Singapore → New York)
  - [ ] GBSOU → SGSIN (Southampton → Singapore)
  - [ ] AEDXB → INMUN (Dubai → Mumbai)
  - [ ] ... (97 more pairs)
- [ ] Vessel type variations (Tanker, Bulk, Container, General)
- [ ] Save to learned_routes table

### Week 7-8: ETA Prediction Model
- [ ] Feature engineering (distance, speed, vessel type, season)
- [ ] Train ML model (XGBoost/LightGBM)
- [ ] Validation (compare predicted vs actual ETA)
- [ ] Deploy model as microservice

### Week 9-10: Weather & Seasonal Adjustments
- [ ] Integrate historical weather data
- [ ] Identify weather-sensitive routes
- [ ] Compute seasonal ETA adjustments
- [ ] Store in route_seasonal_stats table

### Week 11-12: Depth & Safety Features
- [ ] Integrate bathymetry database (GEBCO, NOAA)
- [ ] Compute min/mean depth along routes
- [ ] Flag shallow areas (safety alerts)
- [ ] Max draft compatibility

---

## Phase 3: GraphQL API & UI (4 weeks)

### Week 13-14: GraphQL API
- [ ] recommendRoutes query
  - [ ] Input: origin, destination, vessel (type, draft, speed)
  - [ ] Output: Ranked routes with ETAs, distances
- [ ] Route ranking logic (optimize for fastest/shortest/safest)
- [ ] Alternative routes (show top 3)
- [ ] Confidence scoring (based on sample size)

### Week 15-16: Frontend UI
- [ ] Route visualization (map with polylines)
- [ ] Interactive waypoints
- [ ] Route comparison table
- [ ] ETA breakdown (by leg)
- [ ] Historical performance charts

---

## Phase 4: Self-Learning & Updates (4 weeks)

### Week 17-18: Continuous Learning
- [ ] Weekly route updates (re-learn from new AIS data)
- [ ] Detect route changes (new clusters emerging)
- [ ] Deprecate old routes (no longer used)
- [ ] Version tracking (route data version)

### Week 19-20: Advanced Features
- [ ] Real-time route updates (based on current weather)
- [ ] Port congestion integration
- [ ] Piracy risk zones (flag high-risk areas)
- [ ] Canal transit integration (Suez, Panama)

---

## Phase 5: Production & Scale (4 weeks)

### Week 21-22: Performance Optimization
- [ ] PostGIS spatial indexing
- [ ] Query optimization (<500ms response time)
- [ ] Caching layer (Redis)
- [ ] API rate limiting

### Week 23-24: Deployment & Monitoring
- [ ] Production deployment (Docker + Kubernetes)
- [ ] Monitoring dashboard (Grafana)
- [ ] Alert system (route learning failures)
- [ ] User feedback collection

---

## Total Timeline: 6 months (24 weeks)

---

## Success Metrics

### Data Quality
- [ ] 1 million+ AIS tracks processed
- [ ] 500+ learned routes (O-D pairs × vessel types)
- [ ] 90%+ route coverage for major trade lanes
- [ ] <5% outlier/noise tracks

### Routing Accuracy
- [ ] ETA prediction error: <10% (vs actual)
- [ ] Route distance: <2% error vs actual sailed
- [ ] User satisfaction: >4.5/5 stars
- [ ] Adoption: 80%+ of users prefer learned routes over great circle

### Performance
- [ ] API response time: <500ms (P95)
- [ ] Route learning: <1 hour per 100 O-D pairs
- [ ] Weekly updates: <4 hours compute time
- [ ] Uptime: 99.9%

---

## Dependencies

### Data Sources
- AISHub API (free tier) - READY
- MarineTraffic API (free tier) - READY
- Bathymetry data (GEBCO) - FREE
- Historical weather (NOAA) - FREE

### Technical Stack
- PostgreSQL 15 + PostGIS 3.3 - ✅ INSTALLED
- Python 3.10 (for ML pipeline) - ✅ INSTALLED
- Scikit-learn, GeoPandas - TO INSTALL
- XGBoost/LightGBM - TO INSTALL

### Team
- 1 Data Engineer (AIS pipeline, clustering)
- 1 ML Engineer (ETA prediction model)
- 1 Backend Engineer (GraphQL API)
- 1 Frontend Engineer (route visualization)

---

## Risk Mitigation

**Data Availability Risk:**
- Mitigation: Start with free sources (AISHub), upgrade if needed

**Clustering Quality Risk:**
- Mitigation: Manual validation of first 50 routes, iterative tuning

**Performance Risk:**
- Mitigation: Early load testing, PostGIS optimization

**User Adoption Risk:**
- Mitigation: Pilot with 10 key users, iterate based on feedback

---

## Budget Estimate

### Data Costs (Optional)
- Historical AIS data (3 years): $5,000 one-time
- Real-time AIS feed: $500-2,000/month (if free tier insufficient)

### Infrastructure
- PostgreSQL/PostGIS server: $200/month
- ML training (GPU): $500/month (first 3 months)
- API servers: $300/month

**Total 6-month budget:** ~$15,000 (if purchasing data)
**Minimal budget (free data):** ~$5,000 (infrastructure only)

---

## Next Steps (Immediate)

1. ✅ Create this TODO document
2. ⏳ Register for AISHub + MarineTraffic APIs (Week 1 Day 1)
3. ⏳ Set up PostgreSQL + PostGIS (Week 1 Day 1)
4. ⏳ Download sample AIS data (1 week, 1 route) (Week 1 Day 2)
5. ⏳ Prototype clustering algorithm (Week 1 Day 3-5)
6. ⏳ Validate results with maritime expert (Week 2)

---

**Document Created:** February 1, 2026
**Owner:** Mari8X Development Team
**Review Frequency:** Weekly
**Status:** READY TO START

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## 📊 Summary: What We Can Build

### Immediate (Next 3 Months)
1. ✅ **Email Intelligence Engine** - 4 weeks MVP
2. ✅ **Routing Engine V2 (Phase 1-2)** - 10 weeks foundation + intelligence
3. **Voice-to-Text Transcription** - 2 weeks
4. **Predictive Demurrage Alerts** - 3 weeks
5. **Smart Charter Party Generator** - 4 weeks

### Medium-term (3-6 Months)
6. **AI Fixture Matching** - 5 weeks
7. **Dynamic Pricing Engine** - 6 weeks
8. **Port Congestion Predictor** - 4 weeks
9. **Routing Engine V2 (Phase 3-5)** - Complete
10. **Real-Time P&L Dashboard** - 3 weeks

### Long-term (6-12 Months)
11. **Broker Network (B2B Marketplace)**
12. **Blockchain Integration**
13. **IoT Sensor Integration**
14. **Full Compliance Suite (MRV/DCS/BSEE)**
15. **Data Lake + Custom BI**

---

## 🎯 Strategic Priorities

**Tier 1 (Must Have):**
1. Email Intelligence Engine
2. Routing Engine V2
3. AI Fixture Matching

**Tier 2 (High Value):**
4. Smart C/P Generator
5. Predictive Demurrage
6. Dynamic Pricing
7. Real-Time P&L

**Tier 3 (Differentiators):**
8. Port Congestion Predictor
9. Broker Network
10. Voice-to-Text

---

**Document Created:** February 1, 2026 23:20 UTC
**Total Features Brainstormed:** 66
**Actionable TODOs:** 100+
**Estimated Development:** 12-18 months for complete suite

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
