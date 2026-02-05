# Mari8X V2 — Game-Changer Implementation TODO
**Version**: 2.0  
**Start Date**: February 2026  
**Target Launch**: Q2 2026 (16 weeks)  
**Status**: Planning Phase → Development Ready

---

## 📊 OVERALL PROGRESS TRACKER

| Phase | Features | Tasks | Complete | % | ETA |
|-------|----------|-------|----------|---|-----|
| **Phase 1: Mobile Foundation** | 2 apps | 50 | 0 | 0% | Week 6 |
| **Phase 2: Predictive AI** | 3 systems | 45 | 0 | 0% | Week 12 |
| **Phase 3: Marketplaces** | 4 platforms | 60 | 0 | 0% | Week 20 |
| **Phase 4: Open Ecosystem** | 6 packages | 30 | 0 | 0% | Week 24 |
| **Phase 5: Network Effects** | 2 systems | 35 | 0 | 0% | Week 28 |
| **TOTAL** | **17 features** | **220** | **0** | **0%** | **Week 28** |

**Target**: $17.5M ARR Year 1 | $87.7M ARR Year 3

---

## 🎯 PRIORITY TIERS

### **P0 - Must Have (MVP)** — 120 tasks
- Master Mobile App (25 tasks)
- Agent Mobile App (25 tasks)
- Predictive Maintenance AI (30 tasks)
- Port Congestion Predictor (20 tasks)
- Carbon Optimization (20 tasks)

### **P1 - Should Have (Growth)** — 70 tasks
- FFA Trading Platform (20 tasks)
- Insurance Marketplace (15 tasks)
- Open Source Libraries (20 tasks)
- Reputation Network (15 tasks)

### **P2 - Nice to Have (Future)** — 30 tasks
- Benchmarking Consortium (15 tasks)
- Supplier Rating System (15 tasks)

---

# PHASE 1: MOBILE FOUNDATION (Weeks 1-6)
**Priority**: P0 | **Target**: Beta release to 70 users | **Revenue Impact**: $1.2M ARR Year 1

## Sprint 1: Core Mobile Infrastructure (Weeks 1-2)

### 1.1 React Native Setup ✅ P0
- [ ] Create Expo workspace in ankr-labs-nx monorepo
- [ ] Configure EAS Build for iOS + Android
- [ ] Set up TypeScript + ESLint for React Native
- [ ] Configure navigation (React Navigation v6)
- [ ] Set up environment variables (.env.dev, .env.prod)
- [ ] Configure app icons + splash screens
- [ ] Set up CodePush for OTA updates

**Estimate**: 3 days | **Owner**: Mobile Lead

---

### 1.2 Offline-First Architecture ✅ P0
- [ ] Install PouchDB for offline storage
- [ ] Design local schema (vessels, noon reports, FDAs)
- [ ] Implement sync manager (PouchDB → PostgreSQL)
- [ ] Handle conflict resolution (last-write-wins strategy)
- [ ] Queue mutations when offline (with retry logic)
- [ ] Test offline mode (airplane mode, slow network)
- [ ] Implement background sync (when app opens)

**Estimate**: 5 days | **Owner**: Mobile Lead + Backend

**Technical Design**:
```typescript
// Offline sync architecture
interface SyncManager {
  syncNoonReports(): Promise<void>;
  syncFDAs(): Promise<void>;
  queueMutation(mutation: Mutation): void;
  resolveConflicts(conflicts: Conflict[]): void;
}

// Example usage
const sync = new SyncManager();
await sync.queueMutation({
  type: 'CREATE_NOON_REPORT',
  payload: { vesselId, position, fuel },
  timestamp: Date.now(),
  retries: 0,
});
```

---

### 1.3 Push Notifications ✅ P0
- [ ] Set up Firebase Cloud Messaging (FCM)
- [ ] Configure iOS APNs certificates
- [ ] Implement device token registration
- [ ] Create notification service (backend)
- [ ] Handle notification taps (deep linking)
- [ ] Test notifications (local, remote, silent)
- [ ] Implement notification preferences (settings)

**Estimate**: 3 days | **Owner**: Mobile Lead

**Notification Types**:
- FDA approval/rejection (urgent)
- Certificate expiry (7/30/60 days)
- Incident alerts (emergency)
- Port congestion updates (info)
- System announcements (low priority)

---

### 1.4 Mobile GraphQL Client ✅ P0
- [ ] Set up Apollo Client for React Native
- [ ] Configure offline cache (apollo-cache-persist)
- [ ] Implement optimistic UI updates
- [ ] Add retry logic for failed mutations
- [ ] Set up error handling (network, GraphQL errors)
- [ ] Configure authentication (JWT in SecureStore)
- [ ] Test query/mutation performance

**Estimate**: 2 days | **Owner**: Mobile Lead

---

## Sprint 2: Master Mobile App MVP (Weeks 3-4)

### 2.1 Authentication & Profile ✅ P0
- [ ] Login screen (email/password, biometric)
- [ ] Store JWT in SecureStore (iOS Keychain, Android KeyStore)
- [ ] Auto-refresh token logic
- [ ] Profile screen (name, rank, vessel, photo)
- [ ] Change password flow
- [ ] Logout + clear local data
- [ ] "Remember me" option

**Estimate**: 2 days | **Owner**: Mobile Lead

---

### 2.2 Digital Noon Report ✅ P0
**Priority**: P0 — Core master workflow

- [ ] Noon report form (position, fuel, weather, engine)
- [ ] Auto-populate vessel data from context
- [ ] GPS auto-fill for position (with manual override)
- [ ] Photo attachments (bunker receipts, cargo holds)
- [ ] Voice-to-text for remarks field
- [ ] Offline submission (queue when no network)
- [ ] View past noon reports (list + detail)
- [ ] Edit draft reports (not yet submitted)

**Estimate**: 4 days | **Owner**: Mobile Lead

**UI Mockup**:
```
┌─────────────────────────────┐
│  📝 Noon Report              │
│  ───────────────────────────│
│  Vessel: MV EXAMPLE          │
│  Date: 2026-02-06 12:00 UTC │
│                              │
│  📍 Position                 │
│  Lat: [Auto] 35.1234°N      │
│  Lon: [Auto] 139.5678°E     │
│                              │
│  ⛽ Fuel ROB                 │
│  HFO: 450 MT                 │
│  MGO: 80 MT                  │
│                              │
│  🌊 Weather                  │
│  Wind: SW 15kts              │
│  Sea: Moderate               │
│                              │
│  📸 Attachments (2)          │
│  [+] Add Photo               │
│                              │
│  🎤 Voice Remarks            │
│  [Record]                    │
│                              │
│  [Submit Report]             │
└─────────────────────────────┘
```

---

### 2.3 FDA Pre-Approval Workflow ✅ P0
**Priority**: P0 — Biggest pain point for masters

- [ ] View pending FDA from agent
- [ ] Line-item detail view (port dues, pilotage, tugs)
- [ ] Approve/reject entire FDA or line items
- [ ] Add comment/dispute (text + photo)
- [ ] Push notification when FDA submitted
- [ ] Compare to budget/estimate
- [ ] View FDA history (all ports for voyage)

**Estimate**: 3 days | **Owner**: Mobile Lead + Backend

**Business Value**: Reduce FDA approval time from 48h → 2h

---

### 2.4 Incident Reporting ✅ P0
**Priority**: P0 — Safety critical

- [ ] Quick incident button (home screen)
- [ ] Incident type selector (collision, grounding, spill, injury, piracy)
- [ ] Auto-capture GPS coordinates + timestamp
- [ ] Photo attachments (damage, scene)
- [ ] Voice recording (master statement)
- [ ] Severity selection (low, medium, high, critical)
- [ ] Instant alert to office (push + email + SMS)
- [ ] Track incident status (reported, investigating, resolved)

**Estimate**: 3 days | **Owner**: Mobile Lead

**UI Flow**:
```
1. Tap "Report Incident" (red button, always visible)
2. Select type (6 icons: collision, grounding, etc.)
3. Auto-capture: GPS, timestamp, vessel details
4. Add photos (up to 10)
5. Voice statement (up to 5 minutes)
6. Confirm severity (color-coded)
7. Submit → Instant alert to office
```

---

### 2.5 Photo AI Integration ✅ P0
**Priority**: P1 — Differentiation

- [ ] Cargo hold damage detection (AI)
- [ ] Bunker receipt OCR (extract volume, price, supplier)
- [ ] Certificate OCR (extract expiry date)
- [ ] Photo compression (reduce upload size by 80%)
- [ ] Offline photo queue (upload when online)
- [ ] Photo watermark (GPS + timestamp)

**Estimate**: 3 days | **Owner**: ML Engineer + Mobile Lead

**Tech Stack**:
- GPT-4 Vision for damage detection
- @ankr/ocr for receipt/certificate extraction
- react-native-vision-camera for camera
- react-native-image-resizer for compression

---

### 2.6 Certificate Expiry Tracker ✅ P0
- [ ] List all personal certificates (COC, medical, passport, STCW)
- [ ] List vessel certificates (class, insurance, flag, ISM)
- [ ] Color-coded expiry status (green >90d, yellow 30-90d, red <30d)
- [ ] Push notifications (30/60/90 days before expiry)
- [ ] Photo upload for new certificates
- [ ] Renewal reminders
- [ ] Export certificate list (PDF)

**Estimate**: 2 days | **Owner**: Mobile Lead

---

### 2.7 Crew Welfare Features ✅ P1
- [ ] Internet usage tracker (Starlink, VSAT data consumption)
- [ ] Family chat (WhatsApp-like, encrypted)
- [ ] Shore leave planner (visa status, port restrictions)
- [ ] Crew welfare surveys (monthly)
- [ ] Mental health resources (articles, hotlines)

**Estimate**: 3 days | **Owner**: Mobile Lead

---

## Sprint 3: Agent Mobile App MVP (Weeks 5-6)

### 3.1 Multi-Vessel Dashboard ✅ P0
**Priority**: P0 — Agents handle 5-10 ships simultaneously

- [ ] Dashboard with 5-10 vessel cards
- [ ] Color-coded by stage (arriving, in-port, sailing, sailed)
- [ ] ETA countdown for arriving vessels
- [ ] Notifications (berth ready, customs issue, FDA due)
- [ ] Quick actions per vessel (call Master, view FDA, add expense)
- [ ] Filter by status, port, principal
- [ ] Sort by ETA, urgency, FDA status

**Estimate**: 3 days | **Owner**: Mobile Lead

**UI Mockup**:
```
┌─────────────────────────────┐
│  🚢 My Vessels (8)           │
│  ───────────────────────────│
│  🟢 MV ALPHA                 │
│  Arriving in 2h 30m          │
│  FDA: Pending approval       │
│  [Call Master] [View FDA]   │
│  ───────────────────────────│
│  🟡 MV BETA                  │
│  Discharging (Day 2/4)       │
│  FDA: $45K (58% paid)        │
│  [Add Expense] [View]        │
│  ───────────────────────────│
│  🔴 MV GAMMA                 │
│  Customs hold - URGENT       │
│  Waiting 6 hours             │
│  [Contact Customs] [Alert]   │
└─────────────────────────────┘
```

---

### 3.2 Smart FDA Management ✅ P0
**Priority**: P0 — Core agent workflow

- [ ] Create new FDA for vessel arrival
- [ ] Photo invoice → AI OCR → Auto-add line item
- [ ] Manual line item entry (type, amount, currency)
- [ ] Multi-currency support with live FX rates
- [ ] Real-time sync with shipowner office
- [ ] Submit FDA for master approval
- [ ] Track approval status (pending, approved, disputed)
- [ ] Protecting agent collaboration (owner + agent edit same FDA)
- [ ] Duplicate detection (prevent double-billing)

**Estimate**: 5 days | **Owner**: Mobile Lead + Backend

**AI OCR Flow**:
```
1. Agent photos invoice (port dues, pilotage, etc.)
2. AI extracts: amount, date, supplier, category
3. Auto-add to FDA with 95% confidence
4. Agent reviews + confirms (or edits)
5. Sync to office + master app instantly
```

**Business Value**: 3x faster FDA processing (3 days → 8 hours)

---

### 3.3 Port Operations Checklist ✅ P0
- [ ] Pre-arrival checklist (pilot booked, berth assigned, customs)
- [ ] In-port checklist (water, bunkers, crew change, cargo ops)
- [ ] Departure checklist (port clearance, SOF signed)
- [ ] Auto-populate from port database
- [ ] Check off items as complete
- [ ] Add notes/photos per checklist item
- [ ] Share checklist with Master + office

**Estimate**: 2 days | **Owner**: Mobile Lead

---

### 3.4 Congestion Reporting (Crowd-Sourced Data) ✅ P0
**Priority**: P1 — Creates data network effect

- [ ] "Report Waiting Time" button (one-tap)
- [ ] Auto-capture: vessel, port, berth, arrival time
- [ ] Agent confirms: actual waiting time, reason
- [ ] Earn $10 credit per report (gamification)
- [ ] Leaderboard (top contributors)
- [ ] Data feeds back to Mari8X congestion predictor
- [ ] View global congestion map (agent contribution shown)

**Estimate**: 2 days | **Owner**: Mobile Lead + Backend

**Incentive Model**:
- $10 credit per congestion report
- Credits can be used for:
  - Premium features (FDA templates, analytics)
  - Mari8X marketplace purchases
  - Cash payout (min $100)

**Data Value**: Crowd-sourced congestion = competitive advantage over paid AIS feeds

---

### 3.5 Statement of Facts (SOF) ✅ P0
- [ ] Digital SOF form (arrival, berthing, operations, departure)
- [ ] GPS-verified timestamps (tamper-proof)
- [ ] Digital signatures (Master + Agent)
- [ ] Photo attachments (berth, cargo operations)
- [ ] Auto-generate laytime calculation
- [ ] Export as PDF (email to all parties)
- [ ] Blockchain hash (optional, for disputes)

**Estimate**: 3 days | **Owner**: Mobile Lead + Backend

---

### 3.6 Port Intelligence Features ✅ P1
- [ ] Local contacts database (surveyors, chandlers, repairers)
- [ ] Port restrictions + holidays (from Mari8X WPI)
- [ ] Berth availability heatmap
- [ ] Port news feed (congestion, strikes, closures)
- [ ] Weather forecast (7-day)
- [ ] Tide tables

**Estimate**: 2 days | **Owner**: Mobile Lead

---

## Phase 1 Deliverables & Metrics

### **Beta Launch** (Week 6)
- Master App: 50 beta testers (captains from friendly owners)
- Agent App: 20 beta testers (agents from key ports)
- App Store: Internal TestFlight (iOS) + Internal Testing (Android)
- Feedback: In-app survey + weekly calls

### **Success Metrics** (Week 12)
- Master app: 500+ active users (5% of target)
- Agent app: 100+ paid subscribers ($9.9K MRR)
- App Store rating: 4.5+ stars
- Daily active users: 60%+
- Noon report digital adoption: 80%+
- FDA approval time: <4 hours average

---

# PHASE 2: PREDICTIVE INTELLIGENCE (Weeks 7-12)
**Priority**: P0-P1 | **Target**: 100 vessels with AI features | **Revenue Impact**: $2.6M ARR Year 1

## Sprint 4: Data Pipeline & ML Infrastructure (Weeks 7-8)

### 4.1 TimescaleDB Setup ✅ P0
- [ ] Create TimescaleDB hypertable for sensor data
- [ ] Define schema (timestamp, vesselId, metric, value)
- [ ] Set up partitioning (by time + vesselId)
- [ ] Configure retention policy (2 years hot, 10 years cold)
- [ ] Create indexes for fast queries
- [ ] Set up automated backups
- [ ] Performance testing (1M+ rows/day)

**Estimate**: 2 days | **Owner**: Data Engineer

---

### 4.2 Noon Report Data Ingestion ✅ P0
- [ ] Extract 5+ years historical noon reports
- [ ] Clean data (outliers, missing values)
- [ ] Normalize units (MT, kts, °C)
- [ ] Feature engineering (fuel efficiency, speed loss)
- [ ] Load to TimescaleDB
- [ ] Create materialized views (daily/weekly aggregates)
- [ ] Data quality checks (Great Expectations)

**Estimate**: 3 days | **Owner**: Data Engineer + ML Engineer

**Data Volume**: 10,000 vessels × 365 days × 5 years = **18M noon reports**

---

### 4.3 ML Experiment Tracking ✅ P0
- [ ] Set up MLflow server
- [ ] Configure experiment tracking
- [ ] Log model parameters, metrics, artifacts
- [ ] Set up model registry
- [ ] Configure auto-tagging (staging, production)
- [ ] Create experiment comparison UI

**Estimate**: 1 day | **Owner**: ML Engineer

---

### 4.4 Feature Engineering Pipeline ✅ P0
- [ ] Create feature extraction service
- [ ] Time-series features (rolling averages, trends)
- [ ] Degradation curves (performance over time)
- [ ] Anomaly scores (Z-score, isolation forest)
- [ ] Vessel similarity features (same engine, age, route)
- [ ] Store features in feature store (Redis)

**Estimate**: 4 days | **Owner**: ML Engineer

---

## Sprint 5: Predictive Maintenance AI (Weeks 9-10)

### 5.1 Failure Prediction Models ✅ P0
**Priority**: P0 — Highest ROI AI feature

**Target Predictions**:
1. Main engine failure (30-90 days ahead)
2. Auxiliary engine failure (30-60 days)
3. Pump failures (15-30 days)
4. Boiler performance degradation
5. Propeller fouling (speed loss >5%)

**Model Development**:
- [ ] Split data (70% train, 15% validation, 15% test)
- [ ] Train XGBoost model (classification: will fail in 30/60/90 days?)
- [ ] Train LSTM model (time-series patterns)
- [ ] Ensemble models (voting, stacking)
- [ ] Validate accuracy (target: 80%+ precision, 70%+ recall)
- [ ] Tune hyperparameters (Optuna)
- [ ] Create SHAP explainability (why did model predict failure?)

**Estimate**: 7 days | **Owner**: ML Engineer

**Validation Strategy**:
- Backtest on 2024-2025 data (did we predict actual failures?)
- Precision: Of predicted failures, how many actually happened?
- Recall: Of actual failures, how many did we predict?
- Lead time: How many days ahead did we predict correctly?

---

### 5.2 Real-Time Prediction API ✅ P0
- [ ] FastAPI service for model serving
- [ ] Load model from MLflow registry
- [ ] /predict endpoint (vessel ID → failure predictions)
- [ ] Batch prediction (all fleet daily)
- [ ] Cache predictions (Redis, 24h TTL)
- [ ] API authentication (JWT)
- [ ] Rate limiting (100 req/min)
- [ ] Monitoring (Prometheus metrics)

**Estimate**: 2 days | **Owner**: ML Engineer + Backend

---

### 5.3 Maintenance Alert UI ✅ P0
- [ ] Predictive maintenance dashboard
- [ ] List of high-risk vessels (sorted by failure probability)
- [ ] Detail view (which component, confidence, recommended action)
- [ ] Historical performance chart (degradation curve)
- [ ] Maintenance scheduling UI (plan repairs)
- [ ] Email/push alerts (urgent: >80% failure probability)
- [ ] Export report (PDF for superintendent)

**Estimate**: 3 days | **Owner**: Frontend

**UI Mockup**:
```
┌─────────────────────────────────────────────┐
│  🔧 Predictive Maintenance                   │
│  ─────────────────────────────────────────── │
│  🔴 MV ALPHA - Main Engine                  │
│  Failure risk: 85% (High)                   │
│  Predicted failure: Feb 20-28, 2026         │
│  Recommended: Inspect crank pin bearings    │
│  [Schedule Maintenance]                     │
│  ─────────────────────────────────────────── │
│  🟡 MV BETA - Auxiliary Generator           │
│  Failure risk: 65% (Medium)                 │
│  Predicted failure: Mar 10-20, 2026         │
│  [View Details]                             │
└─────────────────────────────────────────────┘
```

---

### 5.4 Fleet Benchmarking ✅ P1
- [ ] Compare vessel performance to fleet average
- [ ] Fuel efficiency ranking (top/middle/bottom quartile)
- [ ] Speed loss tracking (vs baseline)
- [ ] Off-hire days comparison
- [ ] Maintenance cost benchmarking
- [ ] Best practice recommendations (top performers)

**Estimate**: 2 days | **Owner**: Frontend + Data Engineer

---

## Sprint 6: Port Congestion Predictor (Weeks 11-12)

### 6.1 AIS Stream Processing ✅ P0
- [ ] Set up Kafka cluster (3 brokers)
- [ ] Ingest AIS data stream (Spire, MarineTraffic)
- [ ] Parse AIS messages (Types 1, 5, 18, 24)
- [ ] Filter vessels within 50nm of ports
- [ ] Calculate port approach patterns
- [ ] Store in TimescaleDB (vessel positions)
- [ ] Real-time dashboard (vessels approaching each port)

**Estimate**: 4 days | **Owner**: Data Engineer

**Data Volume**: 300K vessels × 10 positions/day = **3M AIS messages/day**

---

### 6.2 Congestion Prediction Models ✅ P0
**Prediction Horizons**:
- 7-day forecast: 85-90% accuracy
- 14-day forecast: 75-80% accuracy
- 30-day forecast: 60-70% accuracy

**Features**:
- Vessels approaching (within 50nm, destination = port)
- Berth capacity (from WPI database)
- Historical waiting times (agent reports)
- Seasonal patterns (monsoon, ice, harvest)
- Cargo volumes (grain, coal, iron ore)

**Model Training**:
- [ ] Collect 2+ years historical congestion data
- [ ] Feature engineering (vessel count, berth occupancy, seasonality)
- [ ] Train Random Forest model (regression: waiting time in hours)
- [ ] Train LSTM model (sequential patterns)
- [ ] Ensemble models
- [ ] Validate accuracy (RMSE, MAE metrics)

**Estimate**: 5 days | **Owner**: ML Engineer

---

### 6.3 Global Congestion Heatmap ✅ P0
- [ ] MapLibre GL map with port markers
- [ ] Color-coded by congestion level (green/yellow/red)
- [ ] Hover: Show waiting time + vessel count
- [ ] Click: Open port detail modal (forecast, historical)
- [ ] Filter by region, cargo type
- [ ] Time slider (show 7/14/30-day forecast)
- [ ] Export map (PNG for reports)

**Estimate**: 3 days | **Owner**: Frontend

---

### 6.4 Delay Alert System ✅ P0
- [ ] Monitor congestion changes (delta from yesterday)
- [ ] Trigger alerts (congestion increased >2 days)
- [ ] Send push notification (to affected vessels)
- [ ] Send email (to charterer, broker)
- [ ] Suggest alternative ports (nearby, lower congestion)
- [ ] Alert history (log all sent alerts)

**Estimate**: 2 days | **Owner**: Backend

---

### 6.5 Carbon Optimization Engine ✅ P0

#### 6.5.1 EU ETS Calculator
- [ ] Calculate CO2 emissions per voyage (fuel × emission factor)
- [ ] Apply EU ETS rule (50% of emissions in EU ports from 2024)
- [ ] Calculate carbon cost (emissions × €80-100/ton)
- [ ] Forecast annual ETS cost (all voyages)
- [ ] Dashboard: Total emissions, cost, compliance status

**Estimate**: 3 days | **Owner**: Backend + Frontend

---

#### 6.5.2 CII Rating Optimizer
- [ ] Calculate current CII rating (A-E bands per IMO formula)
- [ ] Simulate scenarios (reduce speed, change route)
- [ ] Recommend optimal speed for target CII band
- [ ] Track CII over time (historical + forecast)
- [ ] Alert if approaching D/E rating (3 months ahead)

**Estimate**: 3 days | **Owner**: Backend + ML Engineer

---

#### 6.5.3 Route/Fuel Optimization for Carbon
- [ ] Integrate with weather routing engine
- [ ] Multi-objective optimization (time, fuel, carbon)
- [ ] VLSFO vs LSMGO cost-benefit analysis
- [ ] LNG feasibility (if vessel equipped)
- [ ] Show carbon savings vs baseline route

**Estimate**: 4 days | **Owner**: Backend

---

## Phase 2 Deliverables & Metrics

### **AI Features Launch** (Week 12)
- Predictive maintenance: Live for 100 vessels
- Congestion predictor: 500+ ports covered
- Carbon optimizer: Live for all vessels

### **Success Metrics** (Week 16)
- Model accuracy: 80%+ for maintenance, 85%+ for congestion
- Prevented failures: 10+ in first 3 months
- Cost savings: $500K+ total (documented)
- Carbon cost avoided: $200K+ (optimized routes)
- Paid subscribers: 50 vessels × $500/month = $25K MRR

---

# PHASE 3: MARKETPLACES (Weeks 13-20)
**Priority**: P1-P2 | **Target**: $1M+ transaction volume | **Revenue Impact**: $6.4M ARR Year 1

## Sprint 7: Carbon Optimization (Weeks 13-14)

[ALREADY COVERED IN PHASE 2 - SPRINT 6.5]

---

## Sprint 8: Carbon Credit Marketplace (Weeks 15-16)

### 8.1 Blockchain Smart Contracts ✅ P1
**Priority**: P1 — New revenue stream

- [ ] Deploy to Ethereum L2 (zkSync or Optimism)
- [ ] Write ERC-1155 smart contract (carbon credits as tokens)
- [ ] Escrow contract (buy/sell with escrow)
- [ ] Fee collection (1-2% to Mari8X treasury)
- [ ] Ownership verification (only shipowners can list)
- [ ] Audit smart contracts (Trail of Bits)

**Estimate**: 5 days | **Owner**: Blockchain Developer

**Smart Contract Functions**:
```solidity
// Carbon Credit NFT (ERC-1155)
function mint(address owner, uint256 amount, uint256 year) external;
function transfer(address to, uint256 tokenId, uint256 amount) external;

// Marketplace
function listForSale(uint256 tokenId, uint256 price) external;
function buy(uint256 listingId) external payable;
function cancelListing(uint256 listingId) external;
```

---

### 8.2 Carbon Trading Interface ✅ P1
- [ ] Marketplace UI (buy/sell credits)
- [ ] Wallet integration (MetaMask, WalletConnect)
- [ ] List credits for sale (price, quantity, year)
- [ ] Buy credits (escrow → transfer on confirmation)
- [ ] Order book (all active listings)
- [ ] Transaction history (my trades)
- [ ] Fee display (1-2% Mari8X fee)

**Estimate**: 4 days | **Owner**: Frontend + Blockchain Dev

**UI Mockup**:
```
┌─────────────────────────────────────────────┐
│  💰 Carbon Credit Marketplace                │
│  ─────────────────────────────────────────── │
│  Buy Credits | Sell Credits | My Portfolio  │
│                                              │
│  Available Listings (23)                     │
│  ─────────────────────────────────────────── │
│  🟢 500 tons CO2 (2026 vintage)             │
│  €85/ton | Seller: Owner_0x4f2a...          │
│  Total: €42,500                              │
│  [Buy Now]                                   │
│  ─────────────────────────────────────────── │
│  🟢 1,000 tons CO2 (2026 vintage)           │
│  €82/ton | Seller: Owner_0x8d1b...          │
│  Total: €82,000                              │
│  [Buy Now]                                   │
└─────────────────────────────────────────────┘
```

---

### 8.3 Regulatory Compliance ✅ P1
- [ ] EU ETS registry integration (track official credits)
- [ ] KYC for sellers (verify shipowner identity)
- [ ] Transaction limits (prevent manipulation)
- [ ] Audit trail (all trades logged)
- [ ] Legal terms (T&Cs for marketplace)

**Estimate**: 3 days | **Owner**: Backend + Legal

---

## Sprint 9: FFA Trading Platform (Weeks 17-18)

### 9.1 Baltic Exchange Integration ✅ P1
- [ ] Subscribe to Baltic Exchange API (FFA data feed)
- [ ] Ingest routes (C3, C5, P3A, P4, S4A, S10)
- [ ] Real-time price updates (bid/ask)
- [ ] Historical price charts (1Y, 3Y, 5Y)
- [ ] Store FFA prices in database (TimescaleDB)

**Estimate**: 2 days | **Owner**: Backend

**Cost**: $5K-10K/year for Baltic Exchange data feed

---

### 9.2 FFA Trading Interface ✅ P1
- [ ] Trading UI (buy/sell FFAs)
- [ ] Route selector (dropdown: C3, C5, etc.)
- [ ] Settlement period selector (Q1 2026, Q2 2026, Cal 2027)
- [ ] Order entry (quantity, price, duration)
- [ ] Order confirmation (review before submit)
- [ ] Position dashboard (open positions, P&L)
- [ ] MTM valuation (daily mark-to-market)

**Estimate**: 5 days | **Owner**: Frontend

---

### 9.3 Risk Management Dashboard ✅ P1
- [ ] Portfolio VaR (Value at Risk)
- [ ] Sensitivity analysis (delta, gamma)
- [ ] Margin requirements (initial + variation)
- [ ] Margin call alerts (below threshold)
- [ ] Exposure limits (per route, total)

**Estimate**: 3 days | **Owner**: Frontend + Backend

---

### 9.4 Clearing & Settlement ✅ P1
**Options**:
1. **Partner with broker** (Clarkson's, SSY) — they handle clearing
2. **Self-clearing** (requires financial license + margin management)

**Recommended**: Partner with broker (Year 1), self-clearing (Year 2+)

- [ ] Integrate with broker API (Clarkson's)
- [ ] Order routing (Mari8X → broker → clearing house)
- [ ] Trade confirmations (email + in-app)
- [ ] Settlement tracking (payment due dates)

**Estimate**: 4 days | **Owner**: Backend + Partnerships

---

## Sprint 10: Insurance Marketplace (Weeks 19-20)

### 10.1 P&I Club Integrations ✅ P2
- [ ] API integrations (Skuld, Gard, UK Club)
- [ ] Fetch policy data (premium, coverage, deductible)
- [ ] Claims data (history, status)
- [ ] Renewal quotes (auto-fetch 60 days before expiry)

**Estimate**: 4 days | **Owner**: Backend

**Challenge**: P&I clubs may not have APIs → manual data entry alternative

---

### 10.2 Premium Comparison Engine ✅ P2
- [ ] Compare multiple P&I club quotes
- [ ] Normalize coverage (apples-to-apples)
- [ ] Calculate total cost (premium + deductible)
- [ ] Rank by value (coverage / cost)
- [ ] Show historical claims (club track record)

**Estimate**: 3 days | **Owner**: Frontend

---

### 10.3 Parametric Insurance Products ✅ P2
**Example Product**: Suez Canal Delay Insurance
- Trigger: Vessel delayed >5 days in Suez congestion
- Payout: $50K automatic
- Premium: $5K/voyage

- [ ] Define parametric triggers (delay, piracy, weather)
- [ ] Oracle integration (Chainlink for delay data)
- [ ] Smart contract (auto-payout on trigger)
- [ ] Product catalog (list all parametric products)
- [ ] Purchase flow (select product, pay premium)

**Estimate**: 5 days | **Owner**: Blockchain Dev + Backend

---

### 10.4 Claims Analytics ✅ P2
- [ ] Claims dashboard (total, pending, settled)
- [ ] Claims by type (cargo damage, crew injury, pollution)
- [ ] Time to settlement (average days)
- [ ] Claims vs premium ratio (loss ratio)
- [ ] Predictions (likely claims based on vessel/route)

**Estimate**: 2 days | **Owner**: Frontend + ML Engineer

---

## Phase 3 Deliverables & Metrics

### **Marketplaces Launch** (Week 20)
- Carbon credits: 50 tons traded in first month
- FFA trading: $10M notional in first quarter
- Insurance: 20 quote comparisons, 5 policies sold

### **Success Metrics** (Week 24)
- Carbon marketplace: $1M+ volume, $10K-20K fees
- FFA trading: $50M+ notional, $125K fees
- Insurance: 100 leads, 20 policies, $40K commissions
- Total transaction fees: $175K in Q1

---

# PHASE 4: OPEN ECOSYSTEM (Weeks 21-24)
**Priority**: P1 | **Target**: 100K npm downloads | **Strategic**: Brand building

## Sprint 11: OSS Package Development (Weeks 21-22)

### 11.1 @mari8x/ais-decoder ✅ P1
**Purpose**: Parse AIS messages (Types 1-27)

- [ ] Create npm package (TypeScript)
- [ ] Implement AIS message parsers (1-27)
- [ ] Decode AIVDM/AIVDO sentences
- [ ] Unit tests (100% coverage)
- [ ] Documentation + examples
- [ ] Publish to npm
- [ ] README with usage examples

**Estimate**: 3 days | **Owner**: Backend

**Example Usage**:
```typescript
import { decodeAIS } from '@mari8x/ais-decoder';

const ais = decodeAIS('!AIVDM,1,1,,A,13aEOK?P00PD2wVMdLDRhgvL089D,0*26');
// { type: 1, mmsi: 244060799, position: { lat: 51.8, lon: 3.9 }, ... }
```

---

### 11.2 @mari8x/fixtures-parser ✅ P1
**Purpose**: Extract fixture data from email recaps

- [ ] NLP model (GPT-4 fine-tuned on 10K+ fixture emails)
- [ ] Extract: cargo, vessel, rate, laycan, load/discharge ports
- [ ] Structured JSON output
- [ ] CLI tool (`npx mari8x-parse-fixture email.txt`)
- [ ] Publish to npm

**Estimate**: 4 days | **Owner**: ML Engineer

**Example Usage**:
```typescript
import { parseFixture } from '@mari8x/fixtures-parser';

const email = `MV EXAMPLE fixed for 50,000mt wheat 
from NOLA to Rotterdam, $25/mt, laycan 10-15 Mar`;

const fixture = parseFixture(email);
// { cargo: 'wheat', quantity: 50000, rate: 25, ... }
```

---

### 11.3 @mari8x/laytime-calculator ✅ P1
**Purpose**: Calculate laytime/demurrage per BIMCO terms

- [ ] Implement BIMCO terms (WWD, SHEX, FHEX, UU, TT)
- [ ] Weather exclusions (force majeure)
- [ ] Time bar calculations
- [ ] Despatch/demurrage rates
- [ ] Unit tests (100+ test cases)
- [ ] Publish to npm

**Estimate**: 4 days | **Owner**: Backend

**Example Usage**:
```typescript
import { calculateLaytime } from '@mari8x/laytime-calculator';

const result = calculateLaytime({
  allowedTime: 72, // hours
  actualTime: 90,
  demurrageRate: 10000, // $/day
  terms: 'SHEX', // Sundays and holidays excluded
});
// { demurrage: 7500, status: 'ON_DEMURRAGE' }
```

---

### 11.4 @mari8x/port-distances ✅ P1
**Purpose**: Calculate sea distances with SECA avoidance

- [ ] Great circle distance formula
- [ ] Suez/Panama canal routing
- [ ] SECA zone avoidance
- [ ] 13,000+ port database (lat/lon from WPI)
- [ ] CLI tool (`mari8x-distance SGSIN USNYC`)
- [ ] Publish to npm

**Estimate**: 3 days | **Owner**: Backend

---

### 11.5 @mari8x/marine-casualties ✅ P2
**Purpose**: Open dataset of marine casualties

- [ ] Scrape casualty data (IHS, IMO, flag states)
- [ ] Structure data (date, vessel, type, casualties, cause)
- [ ] API endpoint (public, no auth required)
- [ ] CSV export (for researchers)
- [ ] Publish dataset to GitHub

**Estimate**: 3 days | **Owner**: Backend

---

### 11.6 @mari8x/edifact-parser ✅ P2
**Purpose**: Parse EDI messages (BAPLIE, IFTDGN, IFTMBF)

- [ ] Implement EDIFACT parsers
- [ ] BAPLIE (container bay plan)
- [ ] IFTDGN (dangerous goods)
- [ ] IFTMBF (booking confirmation)
- [ ] Unit tests
- [ ] Publish to npm

**Estimate**: 4 days | **Owner**: Backend

---

## Sprint 12: Community Building (Weeks 23-24)

### 12.1 Developer Documentation Site ✅ P1
- [ ] Create docs site (Docusaurus)
- [ ] Getting started guides (all 6 packages)
- [ ] API reference (auto-generated from TypeScript)
- [ ] Code examples (real-world use cases)
- [ ] Migration guides (from competitors)
- [ ] FAQ section
- [ ] Deploy to mari8x.dev

**Estimate**: 3 days | **Owner**: Frontend + Technical Writer

---

### 12.2 OSS Marketing Push ✅ P1
- [ ] Launch blog post (why we open-sourced)
- [ ] Post to Hacker News, Reddit (r/programming)
- [ ] Tweet thread (with examples)
- [ ] LinkedIn post (target maritime devs)
- [ ] Product Hunt launch (all 6 packages)
- [ ] Email to maritime tech newsletters

**Estimate**: 2 days | **Owner**: Marketing + Engineering

---

### 12.3 GitHub Community Management ✅ P1
- [ ] Set up issue templates (bug, feature request)
- [ ] Code of conduct (contributor covenant)
- [ ] Contributing guidelines (how to submit PR)
- [ ] First-timers-only issues (label for beginners)
- [ ] GitHub Discussions (Q&A forum)
- [ ] Monitor issues/PRs (respond within 24h)

**Estimate**: 1 day | **Owner**: Engineering Manager

---

## Phase 4 Deliverables & Metrics

### **OSS Launch** (Week 24)
- 6 packages published to npm
- Developer docs live at mari8x.dev
- GitHub repos public with stars

### **Success Metrics** (Week 28)
- Total npm downloads: 100K+
- GitHub stars: 2,000+ (across all repos)
- External contributors: 50+
- Conversion: 5-10% OSS users → paid platform (500-1,000 signups)

---

# PHASE 5: NETWORK EFFECTS (Weeks 25-28)
**Priority**: P2 | **Target**: 100 consortium members | **Revenue Impact**: $7.3M ARR Year 1

## Sprint 13: Reputation System (Weeks 25-26)

### 13.1 Blockchain Reputation Contracts ✅ P2
- [ ] Smart contract for reputation events (on Ethereum L2)
- [ ] Event types (payment, performance, dispute, review)
- [ ] Reputation score calculation (0-100 scale)
- [ ] Reputation badges (verified, top-rated, etc.)
- [ ] Immutable event log (all reputation changes on-chain)

**Estimate**: 4 days | **Owner**: Blockchain Developer

---

### 13.2 Zero-Knowledge Proof Integration ✅ P2
**Privacy**: Anonymous reviews without revealing reviewer identity

- [ ] Research ZK libraries (snarkjs, circom)
- [ ] Implement ZK proof for anonymous reviews
- [ ] Verifier contract (on-chain verification)
- [ ] UI for submitting anonymous reviews

**Estimate**: 5 days | **Owner**: Blockchain Developer

**Note**: This is cutting-edge tech, may need external consultant

---

### 13.3 Trust Score Algorithm ✅ P2
**Factors** (weighted average):
- Payment history (40%): On-time hire payments, no defaults
- Operational performance (30%): Honor laycan, cargo quality
- Dispute rate (20%): Arbitration frequency
- Credit rating (10%): S&P, Moody's for public companies

- [ ] Implement scoring algorithm
- [ ] Weight calibration (A/B test)
- [ ] Real-time score updates (on new events)
- [ ] Historical score tracking (over time)

**Estimate**: 2 days | **Owner**: Backend

---

### 13.4 Reputation Dashboard ✅ P2
- [ ] My reputation score (with breakdown)
- [ ] Score history chart (6 months)
- [ ] Recent events (payments, reviews)
- [ ] Peer comparison (vs industry average)
- [ ] Reputation badge (display on profile)

**Estimate**: 2 days | **Owner**: Frontend

---

### 13.5 Anonymous Review System ✅ P2
- [ ] Submit review (after fixture completion)
- [ ] Rating (1-5 stars) + written feedback
- [ ] Category tags (payment, communication, operations)
- [ ] ZK proof generation (prove you did deal without revealing identity)
- [ ] Review moderation (flag abusive reviews)
- [ ] View reviews (aggregate only, no individual reviews shown)

**Estimate**: 3 days | **Owner**: Frontend + Blockchain Dev

---

## Sprint 14: Benchmarking Consortium (Weeks 27-28)

### 14.1 Anonymous Data Aggregation ✅ P2
**Privacy-First**: No company names, aggregate only

- [ ] Data submission pipeline (encrypted uploads)
- [ ] Anonymization service (remove identifiers)
- [ ] Aggregation by quartile (top 25%, median, bottom 25%)
- [ ] Minimum pool size (require 10+ companies before showing data)
- [ ] Opt-out option (delete my data)

**Estimate**: 4 days | **Owner**: Backend + Data Engineer

---

### 14.2 Benchmarking Dashboard ✅ P2
**Metrics**:
- Operational: Fuel efficiency, speed loss, off-hire days
- Financial: DA cost/port, bunker cost/ton, crew wages
- Safety: Incidents/year, PSC detentions
- Commercial: TCE, fixture days

- [ ] My fleet vs peers (quartile charts)
- [ ] Trend analysis (performance over time)
- [ ] Metric deep-dive (drill down by vessel, route)
- [ ] Export report (PDF for management)

**Estimate**: 3 days | **Owner**: Frontend

---

### 14.3 Best Practice Library ✅ P2
**Content**:
- Case studies (top performers share strategies)
- Whitepapers (fuel efficiency, crew retention)
- Webinars (quarterly expert sessions)
- Forum discussions (Q&A between members)

- [ ] Content management system (CMS for articles)
- [ ] Member forum (discussion threads)
- [ ] Video hosting (webinar recordings)
- [ ] Search + tagging (find relevant content)

**Estimate**: 3 days | **Owner**: Frontend + Content

---

### 14.4 Membership Onboarding ✅ P2
- [ ] Membership tiers (Silver $5K, Gold $25K, Platinum $50K)
- [ ] Application form (company info, fleet size)
- [ ] KYC verification (prove you own ships)
- [ ] Data submission (initial upload of metrics)
- [ ] Onboarding call (explain how to use platform)
- [ ] Member directory (optional, opt-in)

**Estimate**: 2 days | **Owner**: Backend + Sales

---

### 14.5 Supplier Rating System ✅ P2
**Supplier Categories**:
- Bunker suppliers (quality, delivery, disputes)
- Port agents (responsiveness, FDA accuracy)
- Surveyors (thoroughness, turnaround time)
- Ship chandlers (product quality, pricing)
- Repair yards (quality, schedule, cost overruns)

- [ ] Supplier profiles (company info, services, ports)
- [ ] Submit rating (after transaction)
- [ ] Aggregate ratings (average score, # reviews)
- [ ] Verified transactions (only rate if you did business)
- [ ] Supplier dashboard (for suppliers to see their ratings)
- [ ] Certified Supplier program ($99-499/month for badge)

**Estimate**: 4 days | **Owner**: Frontend + Backend

---

## Phase 5 Deliverables & Metrics

### **Network Features Launch** (Week 28)
- Reputation system: 500 companies rated
- Benchmarking: 20 founding members
- Supplier ratings: 500 suppliers, 2,000 reviews

### **Success Metrics** (Week 32)
- Reputation scores: 5,000+ companies
- Benchmarking members: 100+ (target: 50 Gold, 10 Platinum)
- Supplier ratings: 10,000+ suppliers
- Network revenue: $1.5M ARR (benchmarking + supplier fees)

---

# 🎯 TOTAL V2 DELIVERABLES

## Features Summary
| Tier | Features | Tasks | Revenue (Y1 ARR) |
|------|----------|-------|------------------|
| **Tier 1: Mobile** | 2 apps | 50 | $1.2M |
| **Tier 2: AI/ML** | 3 systems | 45 | $2.6M |
| **Tier 3: Marketplaces** | 4 platforms | 60 | $6.4M |
| **Tier 4: OSS** | 6 packages | 30 | $0 (strategic) |
| **Tier 5: Network** | 2 systems | 35 | $7.3M |
| **TOTAL** | **17 features** | **220 tasks** | **$17.5M** |

---

## Next Steps
1. ✅ Review V2 roadmap with stakeholders
2. ✅ Secure funding ($5-10M seed round)
3. ✅ Start hiring (mobile lead, ML engineer, blockchain dev)
4. ✅ Begin Phase 1 (mobile apps) - Week 1

**Status**: Ready to begin V2 development 🚀

---

**Document Owner**: ANKR Labs Engineering  
**Last Updated**: February 6, 2026  
**Next Review**: Weekly sprint retrospectives
