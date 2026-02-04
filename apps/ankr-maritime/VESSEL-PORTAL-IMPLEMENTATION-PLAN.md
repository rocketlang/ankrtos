# Vessel Operations Portal - Implementation Plan

**Date**: February 3, 2026
**Status**: Building on existing DA Desk foundation

---

## ✅ What's Already Built (Excellent Foundation!)

### 1. **DA Desk** (Fully Functional!)
**Location**: `/da-desk`

**Features:**
- ✅ Create Disbursement Accounts (PDA/FDA)
- ✅ Add line items (port dues, pilotage, towage, etc.)
- ✅ Track status (draft → submitted → approved → settled)
- ✅ Multiple currency support
- ✅ Tariff reference linking
- ✅ Approval workflow
- ✅ Version control

**GraphQL API:**
```graphql
query {
  disbursementAccounts(voyageId: "...")
  daLineItems(disbursementAccountId: "...")
}

mutation {
  createDisbursementAccount(voyageId, portId, type)
  addDaLineItem(disbursementAccountId, category, description, amount)
  updateDaStatus(id, status)
}
```

---

### 2. **Cash to Master** (Fully Functional!)
**Location**: `/cash-to-master`

**Features:**
- ✅ Request cash (port charges, crew wages, provisions, etc.)
- ✅ Approval workflow (requested → approved → disbursed → settled)
- ✅ Multi-currency support (USD, EUR, GBP, SGD, AED, INR, JPY, CNY)
- ✅ Purpose tracking
- ✅ Summary totals
- ✅ Voyage filtering

**GraphQL API:**
```graphql
query {
  cashToMasterList(voyageId: "...")
  cashToMasterSummary(voyageId: "...")
}

mutation {
  createCashToMaster(voyageId, port, purpose, currency, amount)
  approveCashToMaster(id)
  disburseCashToMaster(id)
  settleCashToMaster(id)
}
```

---

### 3. **Related Features** (Also Built!)
- ✅ Port Intelligence (`/port-intelligence`)
- ✅ Port Congestion Dashboard (`/port-congestion`)
- ✅ Fleet Collaborative Routing (`/fleet-routes`)
- ✅ Voyages Management (`/voyages`)
- ✅ Vessel Tracking (`/vessel-positions`)
- ✅ Weather Routing (integrated in routing)
- ✅ Document Vault (`/documents`)
- ✅ Alerts System (`/alerts`)

---

## 🚀 What We Need to Add (The "Sweetener"!)

### Priority 1: **Vessel Portal Dashboard** (NEW)

Create a **unified view** specifically for Masters/Officers:

```
/vessel-portal

┌─────────────────────────────────────────────────────────┐
│  🚢 MV Ocean Star - Vessel Operations                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Current Voyage: Mumbai → Singapore                     │
│  ETA: 2026-02-10 14:30 UTC (6d 14h)                    │
│  Status: 🟢 En Route                                    │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Quick Reports│  │  Next Port   │  │ DA Status    │ │
│  │              │  │  Intelligence│  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  💡 Smart Recommendations:                              │
│  ├─ Optimized route available (Save $3,500)            │
│  ├─ Port congestion detected (Consider delay)          │
│  └─ DA approval pending for next port                  │
│                                                          │
│  📋 Quick Actions:                                      │
│  ├─ [Submit Noon Report]                                │
│  ├─ [Request Cash to Master]                            │
│  ├─ [View Voyage Orders]                                │
│  └─ [Check Weather]                                     │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**
```typescript
// New page: /frontend/src/pages/VesselPortal.tsx

import { useQuery, gql } from '@apollo/client';
import { Link } from 'react-router-dom';

const VESSEL_PORTAL_QUERY = gql`
  query VesselPortal($vesselId: String!) {
    vessel(id: $vesselId) {
      id
      name
      currentVoyage {
        id
        voyageNumber
        origin { name }
        destination { name }
        etd
        eta
        status
      }
      currentPosition {
        latitude
        longitude
        speed
        heading
        timestamp
      }
    }

    # Next port intelligence
    portIntelligence(portId: $destinationPortId) {
      congestionStatus
      averageWaitTime
      weatherForecast
      restrictions
    }

    # DA status for current voyage
    disbursementAccounts(voyageId: $voyageId) {
      id
      type
      status
      totalAmount
      currency
    }

    # Pending CTM requests
    cashToMasterList(voyageId: $voyageId) {
      id
      status
      amount
      currency
      purpose
    }

    # Smart recommendations
    vesselRecommendations(vesselId: $vesselId) {
      type
      priority
      title
      description
      potentialSaving
      actionUrl
    }
  }
`;

export default function VesselPortal() {
  // Dashboard implementation
}
```

---

### Priority 2: **One-Tap Reports** (NEW)

Make reporting **ridiculously easy** for Masters:

```
/reports/noon-report (NEW)

┌─────────────────────────────────────────────────────────┐
│  Noon Report - February 3, 2026                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ✅ All data pre-filled! Just verify and submit.       │
│                                                          │
│  Position: 14.5°N, 88.2°E (Auto from GPS)              │
│  Date/Time: 2026-02-03 12:00 UTC (Auto)                │
│  Course: 095° (Auto from AIS)                           │
│  Speed: 14.2 knots (Auto from AIS)                      │
│  Distance: 340 nm (Auto calculated)                     │
│                                                          │
│  Weather:                                                │
│  Wind: SW 12 knots (Auto from weather API)             │
│  Sea: Slight, 1-2m waves (Auto)                         │
│  Visibility: Good >10nm (Auto)                           │
│  Barometer: 1012 mb (Auto)                              │
│                                                          │
│  Fuel Status:                                            │
│  ROB Fuel Oil: 420 MT (From last report + consumption) │
│  Consumption: 28 MT (Auto calculated)                   │
│                                                          │
│  Remarks: [Optional - add any remarks]                  │
│                                                          │
│  [Submit Noon Report]                                   │
│                                                          │
│  Time to complete: <3 minutes! ⚡                       │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**
```typescript
// New component: /frontend/src/components/QuickReports.tsx

interface NoonReportData {
  position: { lat: number; lng: number };
  course: number;
  speed: number;
  distance: number;
  weather: {
    windSpeed: number;
    windDirection: string;
    seaState: string;
    visibility: string;
    pressure: number;
  };
  fuel: {
    robFO: number;
    consumption: number;
  };
}

async function generateNoonReport(vesselId: string): Promise<NoonReportData> {
  // Auto-fill from:
  // - Latest vessel position (GPS/AIS)
  // - Weather API
  // - Last fuel report + standard consumption
  // - Calculated distance from last report
}
```

---

### Priority 3: **Mobile-Optimized Views** (ENHANCEMENT)

Make existing features work beautifully on tablets (used on bridge):

**Changes needed:**
- Responsive layouts for DA Desk
- Responsive layouts for Cash to Master
- Touch-friendly buttons (bigger tap targets)
- Offline capability (PWA)
- Compressed data transfer

---

### Priority 4: **Smart Notifications** (NEW)

Proactive alerts for Masters:

```typescript
// New service: /backend/src/services/vessel-notifications.ts

interface VesselNotification {
  vesselId: string;
  type: 'alert' | 'recommendation' | 'reminder';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  actionUrl?: string;
  createdAt: Date;
}

async function generateVesselNotifications(vesselId: string): Promise<VesselNotification[]> {
  const notifications = [];

  // Port congestion alerts
  if (portCongestion > threshold) {
    notifications.push({
      type: 'alert',
      priority: 'high',
      title: 'Port Congestion Detected',
      message: 'Consider delaying arrival by 8 hours to avoid $12,000 waiting costs',
      actionUrl: '/port-congestion'
    });
  }

  // Certificate expiry
  if (certificateExpiresIn < 30days) {
    notifications.push({
      type: 'reminder',
      priority: 'medium',
      title: 'Certificate Expiring Soon',
      message: 'Ship safety certificate expires in 20 days',
      actionUrl: '/vessel-certificates'
    });
  }

  // DA approval
  if (daApproved) {
    notifications.push({
      type: 'reminder',
      priority: 'medium',
      title: 'DA Approved',
      message: 'Disbursement account for Singapore approved',
      actionUrl: '/da-desk'
    });
  }

  // Route optimization
  if (betterRouteAvailable) {
    notifications.push({
      type: 'recommendation',
      priority: 'high',
      title: 'Optimized Route Available',
      message: 'Fleet collaborative route can save $3,500 in fuel',
      actionUrl: '/fleet-routes'
    });
  }

  return notifications;
}
```

---

## 🎯 Integration Points (Connect Everything!)

### Vessel Portal connects to:

```
Vessel Portal (Hub)
├─→ DA Desk (existing) - View/manage port expenses
├─→ Cash to Master (existing) - Request/track cash
├─→ Fleet Routes (existing) - Get optimized routing
├─→ Port Intelligence (existing) - Next port info
├─→ Port Congestion (existing) - Avoid delays
├─→ Voyages (existing) - Current voyage details
├─→ Documents (existing) - Voyage orders, certificates
├─→ Alerts (existing) - Important notifications
├─→ Weather (existing) - Forecast and routing
└─→ Quick Reports (NEW) - Fast reporting
```

**Key Principle:** Don't rebuild - **connect and enhance** what's already there!

---

## 📱 Mobile Experience (Critical!)

### Progressive Web App (PWA) Features:
```
Offline Capability:
├─ Cache all essential data locally
├─ Work without internet connection
├─ Sync when connection available
└─ Smart background sync

Compressed Data:
├─ Optimize images/documents
├─ Text compression
├─ Delta sync (only changes)
└─ Save satellite bandwidth ($$)

Touch-Optimized:
├─ Large buttons (50px+ tap targets)
├─ Swipe gestures
├─ One-handed operation
└─ Works with gloves!

Performance:
├─ Fast load (<2 seconds)
├─ Instant interactions
├─ Optimistic UI updates
└─ Loading skeletons (not spinners)
```

---

## 🚀 Implementation Roadmap

### Week 1: Vessel Portal Dashboard
- [ ] Create `/vessel-portal` page
- [ ] Build dashboard layout (current voyage, quick actions, recommendations)
- [ ] Integrate with existing features (DA Desk, CTM, Port Intelligence)
- [ ] Add vessel-specific GraphQL queries
- [ ] Mobile-responsive design

### Week 2: Quick Reports
- [ ] Build noon report auto-fill logic
- [ ] Create port arrival/departure report templates
- [ ] Integrate with weather APIs
- [ ] Integrate with vessel position data
- [ ] Add photo/document upload

### Week 3: Smart Notifications
- [ ] Build notification generation service
- [ ] Create notification UI component
- [ ] Add push notification support (PWA)
- [ ] Email/SMS fallback
- [ ] Notification preferences

### Week 4: Mobile Optimization
- [ ] Convert to PWA (offline capability)
- [ ] Implement data compression
- [ ] Touch-friendly UI enhancements
- [ ] Performance optimization
- [ ] Testing on tablets

---

## 💡 The Winning Formula

```
Vessel Owner Gets:
├─ DA Desk ✅ (track all port costs)
├─ Fleet Overview ✅ (all vessels on map)
├─ Financial Analytics (ROI)
└─ Business Intelligence

        +

Vessel/Master Gets:
├─ Quick Reports (save time)
├─ Smart Recommendations (avoid mistakes)
├─ Easy DA/CTM requests (less hassle)
├─ Port Intelligence (better planning)
└─ Operational Support (make job easier)

        =

BOTH WIN! → High adoption → Sticky platform! 🎯
```

---

## 📊 Success Metrics

### For Vessels/Masters:
- Noon report time: Target <3 minutes (currently 15-20 min)
- DA request time: Target <2 minutes (currently 10-15 min)
- Daily time saved: Target 3-4 hours
- User satisfaction: Target 9/10
- Daily active usage: Target 100%

### For Platform:
- Vessel adoption rate: Target 80%+
- Feature usage: Target 5+ features/vessel/day
- Retention: Target 95%+
- Referrals: Target word-of-mouth growth

---

## 🎯 Next Steps

**Option A: Build Vessel Portal Dashboard** (High impact, connects everything)
- Time: 1 week
- Impact: Immediate "aha!" moment for Masters
- Leverages existing features

**Option B: Build Quick Reports** (High value, saves time daily)
- Time: 1-2 weeks
- Impact: 3-4 hours saved per day
- Strong "sweetener"

**Option C: Mobile Optimization** (Make everything better)
- Time: 1-2 weeks
- Impact: Better usability, lower satellite costs
- Foundation for adoption

**Recommended: Start with Option A (Vessel Portal Dashboard)**
- It ties everything together
- Shows immediate value
- Builds on DA Desk foundation
- Can iterate quickly

---

## 💬 Your Insight Validated

> *"DA desk may be already built or in plan, do check"*

**Yes! DA Desk is fully built and excellent!** ✅

We don't need to rebuild - we need to:
1. **Connect** it to a vessel-centric view
2. **Enhance** with smart recommendations
3. **Optimize** for mobile/tablet usage
4. **Integrate** with other features (routing, port intel, etc.)

The foundation is solid. Now we build the vessel experience layer on top! 🚢

---

**Should we start with the Vessel Portal Dashboard?**
**It's the quickest way to show value to Masters while leveraging what's already built!**
