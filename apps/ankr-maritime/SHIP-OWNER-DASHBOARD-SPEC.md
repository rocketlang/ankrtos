# Ship Owner Dashboard - Technical Specification

**Date**: February 3, 2026
**Purpose**: Give vessel owners immediate visibility into their fleet's performance and savings
**Goal**: Make them say "WOW! This is valuable!" within 30 seconds of login

---

## 🎯 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  🚢 My Fleet - Owner Dashboard                   [Settings] [Help]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │  Active Vessels  │  │  Total Savings  │  │  Fleet Status   │    │
│  │      12          │  │   $47,250       │  │   11 Operating  │    │
│  │  🟢 11  🔴 1     │  │   This Month    │  │   1 In Port     │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  🗺️  Fleet Map (Real-Time)                                    │ │
│  │  [Interactive map showing all vessels with live positions]     │ │
│  │  Click any vessel → Quick view popup with key metrics          │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  💡 Smart Recommendations (AI-Powered)                          │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │  ⚡ MV Ocean Star - Optimized route available                  │ │
│  │     Save $3,500 fuel by using collaborative fleet route        │ │
│  │     [View Route] [Apply]                                       │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │  ⚠️  MV Pacific Queen - Port congestion detected              │ │
│  │     Delay arrival by 8 hours to save $12,000 waiting costs    │ │
│  │     [View Details] [Notify Master]                             │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │  🔧 MV Atlantic Pride - Maintenance alert                      │ │
│  │     Engine performance degraded 9% - Schedule inspection       │ │
│  │     [View Trends] [Schedule]                                   │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────┐  ┌──────────────────────────────┐ │
│  │  📊 Performance Summary      │  │  💰 Financial Overview       │ │
│  │  ─────────────────────────   │  │  ──────────────────────────  │ │
│  │  Avg Fuel Efficiency: 92%   │  │  Fuel Costs: $850,500        │ │
│  │  On-Time Performance: 88%   │  │  Port Costs: $125,000        │ │
│  │  Fleet Utilization: 94%     │  │  Revenue: $1,850,000         │ │
│  │  vs Industry Avg: +12%      │  │  Net Margin: 42% (+5% MoM)   │ │
│  └─────────────────────────────┘  └──────────────────────────────┘ │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  🚢 Vessel List                                                 │ │
│  ├──────────┬───────────┬──────────┬───────────┬─────────────────┤ │
│  │ Vessel   │ Status    │ Location │ Next Port │ Recommendations │ │
│  ├──────────┼───────────┼──────────┼───────────┼─────────────────┤ │
│  │ Ocean... │ 🟢 Sailing│ 14.5°N   │ Singapore │ Route opt avail │ │
│  │ Pacific..│ 🟢 Sailing│ 51.2°N   │ Rotterdam │ Port congestion │ │
│  │ Baltic...│ 🔴 In Port│ Hamburg  │ Antwerp   │ Fuel price opt  │ │
│  └──────────┴───────────┴──────────┴───────────┴─────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Components to Build

### 1. Fleet Summary Cards (Top Row)

**Three Cards:**

#### Card 1: Active Vessels
```typescript
interface FleetSummary {
  totalVessels: number;
  operating: number;  // 🟢 At sea
  inPort: number;     // 🔵 At port
  maintenance: number; // 🟡 In drydock
  offline: number;    // 🔴 No recent data
}
```

#### Card 2: Total Savings
```typescript
interface SavingsSummary {
  totalSavings: number;      // $ saved this month
  fuelSavings: number;       // From optimized routing
  portSavings: number;       // From congestion avoidance
  maintenanceSavings: number; // From predictive alerts
  period: 'day' | 'week' | 'month' | 'year';
}
```

#### Card 3: Fleet Status
```typescript
interface FleetStatus {
  operatingVessels: number;
  inPortVessels: number;
  activeVoyages: number;
  completedVoyagesThisMonth: number;
}
```

---

### 2. Fleet Map Component

**Interactive Map Showing:**
- All vessels with real-time positions
- Color-coded by status (green=operating, blue=port, yellow=maintenance, red=offline)
- Vessel icons sized by vessel type/size
- Click vessel → popup with quick stats
- Voyage tracks (where they've been recently)
- Planned routes (where they're going)

**Tech Stack:**
- Leaflet + OpenSeaMap (already using this!)
- Real-time updates via GraphQL subscriptions (30-second polling)
- Cluster markers for vessels close together

**GraphQL Query:**
```graphql
query GetOwnerFleet($ownerId: String!) {
  ownerFleet(ownerId: $ownerId) {
    vessels {
      id
      name
      type
      status
      currentPosition {
        latitude
        longitude
        speed
        heading
        timestamp
      }
      currentVoyage {
        origin
        destination
        progress
        eta
      }
    }
  }
}
```

---

### 3. Smart Recommendations Panel

**AI-Powered Suggestions:**

```typescript
interface Recommendation {
  id: string;
  type: 'route_optimization' | 'port_congestion' | 'maintenance_alert' | 'fuel_price' | 'charter_opportunity';
  vesselId: string;
  vesselName: string;
  priority: 'high' | 'medium' | 'low';

  title: string;
  description: string;
  potentialSaving: number; // $ amount

  actionButtons: {
    label: string;
    action: string;
  }[];

  createdAt: Date;
}

// Examples:
{
  type: 'route_optimization',
  priority: 'high',
  title: 'MV Ocean Star - Optimized route available',
  description: 'Save $3,500 fuel by using collaborative fleet route',
  potentialSaving: 3500,
  actionButtons: [
    { label: 'View Route', action: '/fleet-routes?vessel=oceanstar' },
    { label: 'Apply', action: 'apply_route' }
  ]
}

{
  type: 'port_congestion',
  priority: 'high',
  title: 'MV Pacific Queen - Port congestion detected',
  description: 'Delay arrival by 8 hours to save $12,000 waiting costs',
  potentialSaving: 12000,
  actionButtons: [
    { label: 'View Details', action: '/port-congestion?port=singapore' },
    { label: 'Notify Master', action: 'send_notification' }
  ]
}

{
  type: 'maintenance_alert',
  priority: 'medium',
  title: 'MV Atlantic Pride - Maintenance alert',
  description: 'Engine performance degraded 9% - Schedule inspection',
  potentialSaving: 150000, // Prevented breakdown cost
  actionButtons: [
    { label: 'View Trends', action: '/vessel-performance/atlanticpride' },
    { label: 'Schedule', action: 'schedule_maintenance' }
  ]
}
```

**Recommendation Engine Logic:**
```typescript
async generateRecommendations(ownerId: string): Promise<Recommendation[]> {
  const recommendations = [];

  // 1. Check for route optimization opportunities
  for (const vessel of ownerVessels) {
    if (vessel.currentVoyage) {
      const optimizedRoute = await fleetCollaborativeLearner.findBetterRoute(vessel);
      if (optimizedRoute.savings > 2000) {
        recommendations.push({
          type: 'route_optimization',
          potentialSaving: optimizedRoute.savings,
          // ...
        });
      }
    }
  }

  // 2. Check for port congestion at destinations
  for (const vessel of ownerVessels) {
    const destPort = vessel.currentVoyage?.destination;
    if (destPort) {
      const congestion = await portCongestionService.getCongestion(destPort);
      if (congestion.level === 'HIGH') {
        recommendations.push({
          type: 'port_congestion',
          potentialSaving: calculateWaitingCostSavings(vessel, congestion),
          // ...
        });
      }
    }
  }

  // 3. Check for maintenance alerts
  for (const vessel of ownerVessels) {
    const performanceTrend = await analyzePerformance(vessel);
    if (performanceTrend.degradation > 8) {
      recommendations.push({
        type: 'maintenance_alert',
        priority: 'high',
        potentialSaving: 150000, // Prevented breakdown
        // ...
      });
    }
  }

  // Sort by potential savings (highest first)
  return recommendations.sort((a, b) => b.potentialSaving - a.potentialSaving);
}
```

---

### 4. Performance Summary Card

**Metrics:**
```typescript
interface PerformanceSummary {
  avgFuelEfficiency: number;     // % vs baseline
  onTimePerformance: number;     // % of voyages on time
  fleetUtilization: number;      // % of time operating
  vsIndustryAverage: number;     // % better/worse than peers

  period: 'day' | 'week' | 'month' | 'year';
}
```

**Visual:**
- Small charts/sparklines showing trends
- Green/red indicators for up/down
- Comparison to industry benchmarks

---

### 5. Financial Overview Card

**Metrics:**
```typescript
interface FinancialOverview {
  totalRevenue: number;
  totalCosts: {
    fuel: number;
    port: number;
    maintenance: number;
    crew: number;
    other: number;
  };
  netMargin: number;          // %
  marginChange: number;       // % change vs previous period

  period: 'day' | 'week' | 'month' | 'year';
}
```

---

### 6. Vessel List Table

**Columns:**
- Vessel name (with thumbnail photo?)
- Status (operating/port/maintenance/offline)
- Current location (lat/lng or port name)
- Next port (destination)
- ETA
- Active recommendations (count badge)
- Quick actions (view details, contact master, etc.)

**Interactive:**
- Click row → go to vessel detail page
- Sort by any column
- Filter by status
- Search by vessel name

---

## 🎨 UI/UX Principles

### 1. **Speed Matters**
- Dashboard loads in < 2 seconds
- Real-time updates without full reload
- Optimistic UI updates
- Loading skeletons, not spinners

### 2. **Visual Hierarchy**
- Most important info at top (summary cards)
- Map gives spatial awareness
- Recommendations demand attention (high value!)
- Details available on click, not cluttering

### 3. **Action-Oriented**
- Every insight has a clear action
- One-click to apply recommendations
- Direct links to relevant pages
- Mobile-responsive (masters use tablets)

### 4. **Data-Driven Trust**
- Show actual $ savings, not vague "improvements"
- Confidence scores for predictions
- Clear methodology explanations
- Sources for recommendations

---

## 🚀 Implementation Plan

### Phase 1: Core Dashboard (Week 1)
- [ ] Create Ship Owner Dashboard route (`/owner-dashboard`)
- [ ] Build Fleet Summary Cards component
- [ ] Build Fleet Map component (reuse FleetRouteVisualizer map!)
- [ ] Build Vessel List Table component
- [ ] Add GraphQL queries for owner fleet data

### Phase 2: Intelligence Layer (Week 2)
- [ ] Build Recommendations Engine service
- [ ] Implement route optimization detection
- [ ] Implement port congestion alerts
- [ ] Build Recommendations Panel component
- [ ] Add recommendation actions

### Phase 3: Analytics (Week 3)
- [ ] Build Performance Summary calculations
- [ ] Build Financial Overview calculations
- [ ] Add charts and trend visualizations
- [ ] Implement benchmarking (vs industry average)

### Phase 4: Polish (Week 4)
- [ ] Mobile responsive design
- [ ] Real-time updates via subscriptions
- [ ] Notification system (push alerts)
- [ ] Export reports (PDF/CSV)

---

## 📊 Success Metrics

**User Engagement:**
- Daily Active Owners (DAU): Target 80%+
- Time on dashboard: Target 5+ minutes/day
- Recommendation click-through rate: Target 40%+
- Recommendation application rate: Target 60%+

**Business Impact:**
- Average savings per vessel per month: Target $10,000+
- Owner NPS: Target 70+
- Upgrade to premium rate: Target 30%+ within 3 months
- Referral rate: Target 20%+ of owners refer others

---

## 🎯 Quick Win: MVP Dashboard (Today!)

**Minimum viable version we can build NOW:**

1. **Fleet Map** (reuse FleetRouteVisualizer!)
   - Query: vessels for current user
   - Show all vessels on map with status
   - Click vessel → show basic info

2. **Simple Recommendations** (manual seed initially)
   - "Your vessel ABC can save $X with optimized routing"
   - Link to fleet-routes page with pre-filled parameters

3. **Basic Fleet Stats**
   - Count of vessels
   - Count of active voyages
   - Simple status breakdown

**Time to build MVP: 4-6 hours**

This gives immediate value while we build the full dashboard!

---

## 💡 The "Aha!" Moment

**When vessel owner logs in and sees:**
1. Their entire fleet on a live map
2. Real-time recommendations: "Save $3,500 by optimizing route"
3. Concrete savings this month: "$47,250 saved"

**They think:** *"This platform is actually HELPING me make money!"*

That's when they become a loyal user! 🎯

---

**Should we build the MVP Ship Owner Dashboard first, or focus on something else?**
