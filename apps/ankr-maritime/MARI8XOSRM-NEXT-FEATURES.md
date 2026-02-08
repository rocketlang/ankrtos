# Mari8XOSRM - Suggested Next Features

**What to Build Next: Production-Ready Features**

---

## 🚀 **IMMEDIATE (Week 4) - Production API**

### 1. **GraphQL/REST API Endpoints** ⭐ HIGH PRIORITY
```graphql
# Already created in routing-api.ts!

query FindRoute {
  findRoute(
    originUnlocode: "NOSVG"
    destUnlocode: "NOBGO"
    vesselType: "general_cargo"
  ) {
    totalDistanceNm
    avgConfidence
    waypoints
    segments {
      distanceNm
      confidence
    }
  }
}

query PredictDistance {
  predictDistance(
    originUnlocode: "SGSIN"
    destUnlocode: "NLRTM"
    vesselType: "container"
  ) {
    predictedNm
    confidence
    source
  }
}
```

**Why**: Make Mari8XOSRM usable by other systems

### 2. **Auto-Extract Daily Routes** ⭐ HIGH PRIORITY
```bash
# Cron job: Run every 24 hours
0 0 * * * npx tsx extract-ferry-routes.ts
```

**Features:**
- Extract new routes from last 24h AIS data
- Auto-enhance learning map
- Update graph edges
- Send alerts on confidence improvements

**Why**: System gets smarter automatically

### 3. **Confidence Monitoring Dashboard**
```
Current Confidence: 10-18%
Target: 40-60%
Routes needed: 38 more

[=========>          ] 11/50 routes
```

**Why**: Track progress toward production-ready accuracy

---

## 📊 **SHORT-TERM (Week 5-8) - Scale & Accuracy**

### 4. **Multi-Vessel Type Support**
Currently: Only ferries
Target: All vessel types

```typescript
vesselTypes = [
  'container',    // High priority (major trade)
  'bulk_carrier', // High priority (dry cargo)
  'tanker',       // High priority (oil/chemicals)
  'general_cargo',// Current (ferries)
  'roro',         // Medium priority
  'lng_carrier',  // High value routes
]
```

**Why**: Different vessels follow different routes

### 5. **Weather Routing Integration** 🌊
```typescript
interface WeatherRoute {
  baseRoute: RoutePlan;
  weatherAdjusted: RoutePlan;
  conditions: {
    waveHeight: number;
    windSpeed: number;
    avoidanceZones: string[];
  };
  delayEstimate: number; // hours
}
```

**Why**: Weather affects actual distances by 5-15%

### 6. **Seasonal Learning**
```typescript
seasonalFactors = {
  winter: 1.65x,  // Storms, longer routes
  spring: 1.58x,
  summer: 1.52x,  // Best conditions
  fall: 1.60x,
}
```

**Why**: Same route differs by season

### 7. **Chokepoint Intelligence**
```typescript
chokepoints = {
  suez: { avgDelay: 12h, factor: 1.05x },
  panama: { avgDelay: 8h, factor: 1.03x },
  malacca: { avgDelay: 4h, factor: 1.02x },
  gibraltar: { avgDelay: 2h, factor: 1.01x },
}
```

**Why**: Canals/straits add delays & distance

---

## 🎯 **MEDIUM-TERM (Week 9-12) - Intelligence**

### 8. **Speed Optimization**
```typescript
interface SpeedRoute {
  slow: { speed: 10kt, fuel: 20t, time: 10d, cost: $100k },
  eco: { speed: 12kt, fuel: 30t, time: 8d, cost: $120k },
  fast: { speed: 15kt, fuel: 50t, time: 6.5d, cost: $180k },
}
```

**Why**: Charterers optimize cost vs time

### 9. **Multi-Path Routing**
```
Singapore → Rotterdam

Option 1 (Suez): 5,800nm, 19d, $280k
Option 2 (Cape): 7,200nm, 25d, $310k
Option 3 (Panama): 11,000nm, 35d, $450k

Recommend: Option 1 (fastest, cheapest)
```

**Why**: Multiple routes exist, need best choice

### 10. **Port Congestion Avoidance**
```typescript
if (port.congestion > 0.7) {
  alternativePort = findNearbyPort(port, radiusNm: 100);
  routeAdjustment = recalculate(alternativePort);
}
```

**Why**: Avoid 5-10 day delays at congested ports

### 11. **Fuel Consumption Prediction**
```typescript
fuelModel = {
  baseConsumption: 0.15 tons/nm,
  speedFactor: speed^3 / 1000,
  weatherPenalty: waveHeight * 0.02,
  loadFactor: dwt_used / dwt_total * 1.2,
}
```

**Why**: Critical for voyage planning & costs

---

## 🌐 **LONG-TERM (Week 13-20) - Global Scale**

### 12. **Real-Time Fleet Intelligence**
```typescript
interface FleetIntelligence {
  liveVessels: 5000+,
  routesLearning: 100+ per day,
  globalCoverage: 95%,
  avgConfidence: 98%,
}
```

**Why**: Crowdsourced intelligence from all ships

### 13. **ML-Based Optimization**
Replace linear regression with:
```python
# Gradient Boosting or Neural Network
model = XGBoost(
  features=[
    'great_circle_distance',
    'vessel_type',
    'season',
    'weather_forecast',
    'port_congestion',
    'fuel_price',
  ]
)
```

**Why**: Capture complex non-linear patterns

### 14. **Piracy Risk Zones**
```typescript
riskZones = {
  gulf_of_aden: { risk: 0.8, detour: +200nm },
  gulf_of_guinea: { risk: 0.7, detour: +150nm },
  malacca_strait: { risk: 0.3, detour: +50nm },
}
```

**Why**: Safety first, avoid high-risk areas

### 15. **ECA (Emission Control Area) Routing**
```typescript
ecaZones = {
  baltic_sea: { sulfur: 0.1%, speed_limit: 10kt },
  north_sea: { sulfur: 0.1%, speed_limit: 12kt },
  us_coast: { sulfur: 0.1%, speed_limit: 12kt },
}
```

**Why**: Compliance with environmental regulations

### 16. **Carbon Footprint Optimization**
```typescript
interface GreenRoute {
  distance: 5800nm,
  co2Emissions: 1200 tons,
  carbonOffset: $36k,
  esgRating: 'A',
}
```

**Why**: Sustainability is becoming mandatory

---

## 💰 **BUSINESS FEATURES**

### 17. **Pricing API** 💎
```typescript
POST /api/quote
{
  origin: "SGSIN",
  dest: "NLRTM",
  vesselType: "container",
  cargoWeight: 50000
}

Response:
{
  distance: 5800nm,
  duration: 19days,
  fuelCost: $280k,
  portFees: $50k,
  totalCost: $330k,
  confidence: 95%
}
```

**Why**: Monetize the accuracy

### 18. **Subscription Tiers**
```
Free:     10 queries/day, basic routes
Pro:      1000 queries/day, confidence scores
Business: Unlimited, weather routing, ML optimization
Enterprise: Custom ML, dedicated support
```

### 19. **SLA Guarantees**
```
Gold SLA: ±1% accuracy or money back
Silver SLA: ±2% accuracy guarantee
Bronze SLA: ±5% accuracy
```

**Why**: Build trust with charterers

---

## 🛠️ **TECHNICAL FEATURES**

### 20. **Caching & Performance**
```typescript
// Cache frequently queried routes
redis.setex(
  'route:SGSIN-NLRTM:container',
  3600, // 1 hour TTL
  routeData
);
```

### 21. **Rate Limiting**
```typescript
rateLimit = {
  free: 10 req/day,
  pro: 1000 req/day,
  business: 10000 req/day,
}
```

### 22. **WebSocket Live Updates**
```typescript
ws.on('route_update', (data) => {
  console.log(`Route ${data.id} confidence improved: ${data.confidence}%`);
});
```

### 23. **Batch Processing**
```graphql
mutation CalculateMultipleRoutes {
  routes: [
    { origin: "SGSIN", dest: "NLRTM" },
    { origin: "USNYC", dest: "GBLGP" },
    # ... 100 more routes
  ]
}
```

---

## 📱 **USER EXPERIENCE**

### 24. **Interactive Map UI**
- Leaflet/Mapbox visualization
- Draw routes on map
- Show confidence heatmap
- Animate ship movements

### 25. **Comparison Tool**
```
Your Estimate: 6,000nm
Mari8XOSRM: 5,800nm (3.3% more accurate)
Savings: $20,000 per voyage
```

### 26. **Historical Route Viewer**
```
View all vessels that sailed:
SGSIN → NLRTM in last 30 days

Average: 5,785nm (±50nm)
Fastest: 5,720nm
Slowest: 5,920nm
```

---

## 🎯 **RECOMMENDED PRIORITY**

### **Must-Have (Next 2 Weeks):**
1. ✅ Production API (already created!)
2. 🔄 Auto-daily extraction (cron job)
3. 📊 Confidence monitoring
4. 🚢 Multi-vessel type support

### **Should-Have (Month 2):**
5. 🌊 Weather routing
6. 📅 Seasonal learning
7. ⚓ Chokepoint intelligence
8. 🎚️ Speed optimization

### **Nice-to-Have (Month 3+):**
9. 🤖 ML optimization
10. 🌍 Real-time fleet intelligence
11. 💰 Pricing API
12. 🗺️ Interactive map UI

---

## 💡 **MY TOP 3 RECOMMENDATIONS**

### **#1: Auto-Daily Extraction** 🏆
**Why**: Every day you wait, you lose learning opportunities
**Impact**: 11 → 50 routes in 2 weeks
**Effort**: 1 hour to set up cron job
**ROI**: Confidence goes 10% → 40%+

### **#2: Multi-Vessel Type Support** 🏆
**Why**: Different ships = different routes = more revenue
**Impact**: Expand from ferries to containers/tankers
**Effort**: Modify existing extraction script
**ROI**: 10x more routes available

### #3: Production API** ✅ (Already done!)
**Why**: Make it usable by other systems
**Impact**: Can integrate with booking platforms
**Effort**: Done!
**ROI**: Path to monetization

---

## 🚢 **THE VISION**

**Short-term (1 month):**
- 50+ routes, 40-60% confidence
- All major vessel types
- Production API live

**Medium-term (3 months):**
- 200+ routes, 70-90% confidence
- Weather & seasonal routing
- Paying customers

**Long-term (6 months):**
- 1000+ routes, 95%+ confidence
- Global fleet intelligence
- Industry standard for maritime routing

---

**What should we build first?** 🚀
