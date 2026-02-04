# Mari8X Agent Wedge Strategy - Complete TODO

**Strategic Vision**: Transform Mari8X from "AIS position viewer" to "maritime decision intelligence layer"

**Core Thesis**:
> "Stop showing where the ship is. Start answering what will happen next, who must act, and what it will cost."

**Wedge Strategy**: Win Port Agents First → Leverage Network Effects → Expand to All Stakeholders

---

## 🎯 Strategic Overview

### Why Port Agents First?

**Network Effects Hub**:
```
Agents sit at the intersection:
├─ Vessel Masters (they coordinate)
├─ Ship Managers (they report to)
├─ Owners (they bill)
└─ Charterers (they serve)

Win agents → unlock all other stakeholders
```

**Competitive Advantages**:
- ✅ Underserved market (no good solutions exist)
- ✅ Clear pain point (2-4 hours manual work per arrival)
- ✅ Fast sales cycle (pragmatic buyers)
- ✅ Immediate ROI (visible time savings)
- ✅ Viral potential (agents talk to agents)
- ✅ Already have momentum (Agent Portal built Feb 3)

---

## 📊 Success Metrics & Targets

### 90-Day MVP Target
- ✅ Launch Pre-Arrival Intelligence Engine
- ✅ 10 beta agents actively using
- ✅ 5+ paying customers ($99/month)
- ✅ 90%+ accuracy on DA forecasts
- ✅ 2-4 hour time savings validated

### 18-Month Revenue Target
- **Agents**: 200 × $99/month = $19.8K MRR
- **Owners**: 50 × $999/month = $49.5K MRR
- **Brokers**: 50 × $499/month = $25K MRR
- **TOTAL**: $94.3K MRR = **$1.13M ARR**

---

## 🚀 PHASE 1: Pre-Arrival Intelligence Engine (Weeks 1-4)

### Overview
Build the core intelligence engine that transforms AIS data into actionable insights.

### 1.1 AIS Proximity Detection & ETA Calculation

**Goal**: Auto-detect vessels entering 200 NM radius and calculate realistic ETA

**Features**:
- [ ] Real-time AIS position monitoring via WebSocket
- [ ] 200 NM geofence trigger per destination port
- [ ] ETA calculation using:
  - Current position + speed
  - Historical speed patterns
  - Weather routing data
  - Port congestion delays
- [ ] ETA confidence scoring (high/medium/low)
- [ ] Arrival window prediction (best/likely/worst case)

**Technical Implementation**:
```typescript
interface ArrivalIntelligence {
  vesselId: string;
  portId: string;
  distance: number; // NM
  currentSpeed: number; // knots
  averageSpeed: number; // last 24h
  etaBestCase: Date;
  etaMostLikely: Date;
  etaWorstCase: Date;
  confidence: 'high' | 'medium' | 'low';
  factors: string[]; // weather, congestion, etc
}
```

**Database Schema**:
```prisma
model VesselArrival {
  id              String   @id @default(cuid())
  vesselId        String
  portId          String
  triggeredAt     DateTime @default(now())
  distance        Float    // NM
  etaBestCase     DateTime
  etaMostLikely   DateTime
  etaWorstCase    DateTime
  confidence      Confidence
  status          ArrivalStatus // approaching, in_port, departed

  vessel          Vessel   @relation(fields: [vesselId], references: [id])
  port            Port     @relation(fields: [portId], references: [id])

  @@index([vesselId, status])
  @@index([portId, triggeredAt])
}
```

**Success Criteria**:
- ✅ <5 min detection latency
- ✅ ETA accuracy within 6 hours for 80% of arrivals
- ✅ Handles 100+ simultaneous vessels

**Files to Create**:
- `backend/src/services/arrival-intelligence/proximity-detector.service.ts`
- `backend/src/services/arrival-intelligence/eta-calculator.service.ts`
- `backend/src/schema/types/arrival-intelligence.ts`

---

### 1.2 Document Status Checker & Missing Docs Detector

**Goal**: Identify missing pre-arrival documents and calculate deadlines

**Document Types**:
- [ ] FAL Forms (1-7): Crew list, passenger list, dangerous goods, etc.
- [ ] Ballast Water Management Declaration
- [ ] ISPS Ship Security Declaration
- [ ] Health Declaration
- [ ] Customs Declaration
- [ ] Crew Effects Declaration
- [ ] Ship's Stores Declaration
- [ ] Maritime Declaration of Health
- [ ] Waste Declaration

**Features**:
- [ ] Document requirement matrix per port
- [ ] Deadline calculation (24h, 48h, 72h before ETA)
- [ ] Status tracking (not_started, in_progress, submitted, approved)
- [ ] Priority scoring (critical, important, routine)
- [ ] Auto-reminders to master/agent

**Database Schema**:
```prisma
model DocumentRequirement {
  id          String   @id @default(cuid())
  portId      String
  documentType String
  deadline    Int      // hours before ETA
  mandatory   Boolean
  priority    Priority

  port        Port     @relation(fields: [portId], references: [id])

  @@unique([portId, documentType])
}

model VesselDocument {
  id              String    @id @default(cuid())
  vesselId        String
  arrivalId       String
  documentType    String
  status          DocStatus
  submittedAt     DateTime?
  approvedAt      DateTime?
  submittedBy     String?   // userId
  fileUrl         String?

  vessel          Vessel    @relation(fields: [vesselId], references: [id])
  arrival         VesselArrival @relation(fields: [arrivalId], references: [id])

  @@index([arrivalId, status])
}
```

**Output Format**:
```typescript
interface DocumentStatus {
  arrivalId: string;
  missingDocuments: {
    type: string;
    deadline: Date;
    hoursRemaining: number;
    priority: 'critical' | 'important' | 'routine';
    status: 'overdue' | 'urgent' | 'pending';
  }[];
  completedDocuments: string[];
  complianceScore: number; // 0-100
}
```

**Success Criteria**:
- ✅ 100% coverage for top 50 ports
- ✅ Zero false positives on requirements
- ✅ Accurate deadline calculation

**Files to Create**:
- `backend/src/services/arrival-intelligence/document-checker.service.ts`
- `backend/scripts/seed-document-requirements.ts`

---

### 1.3 DA Cost Forecaster with ML Model

**Goal**: Predict DA (Disbursement Account) costs with confidence ranges using ML

**Cost Components**:
- [ ] Port dues (by GT)
- [ ] Pilotage (in + out)
- [ ] Tugboats (number × rate)
- [ ] Mooring/unmooring
- [ ] Linesmen
- [ ] Agency fees
- [ ] Waste disposal
- [ ] Fresh water
- [ ] Miscellaneous services

**ML Pipeline**:
1. **Data Collection**:
   - [ ] Collect historical DA data (aim for 100+ per major port)
   - [ ] Extract features: vessel GT, LOA, draft, port, cargo type, season, dwell time
   - [ ] Normalize and clean data

2. **Model Training**:
   - [ ] Train regression model (XGBoost or LightGBM)
   - [ ] Cross-validation (80/20 split)
   - [ ] Hyperparameter tuning
   - [ ] Feature importance analysis

3. **Prediction Pipeline**:
   - [ ] Real-time prediction API
   - [ ] Confidence interval calculation
   - [ ] Breakdown by cost component
   - [ ] Historical comparison

**Technical Implementation**:
```typescript
interface DAForecast {
  portId: string;
  vesselId: string;
  estimatedTotal: number;
  confidenceRange: [number, number]; // [low, high]
  confidence: number; // 0-1
  breakdown: {
    portDues: number;
    pilotage: number;
    tugs: number;
    agency: number;
    other: number;
  };
  factors: string[]; // what drove the estimate
  historicalComparison: string; // vs similar vessels
}
```

**ML Model Service**:
```typescript
class DAForecastService {
  async predict(vessel: Vessel, port: Port): Promise<DAForecast> {
    const features = this.extractFeatures(vessel, port);
    const prediction = await this.mlModel.predict(features);
    const confidence = this.calculateConfidence(features);
    const breakdown = await this.breakdownCosts(vessel, port);

    return {
      estimatedTotal: prediction,
      confidenceRange: this.calculateRange(prediction, confidence),
      confidence,
      breakdown,
      factors: this.identifyFactors(features),
      historicalComparison: await this.compareHistorical(vessel, port)
    };
  }

  async improveModel(actual: DAActual): Promise<void> {
    // Feedback loop: retrain with actual data
    await this.mlFeedback.store(actual);
    // Retrain weekly
  }
}
```

**Success Criteria**:
- ✅ 85%+ of forecasts within 15% of actual
- ✅ Confidence scores calibrated (90% confidence = 90% accuracy)
- ✅ <2 second prediction time
- ✅ Weekly model retraining with new data

**Files to Create**:
- `backend/src/services/ml/da-forecast.service.ts`
- `backend/src/services/ml/ml-model.ts`
- `backend/scripts/train-da-model.py` (Python for ML training)

---

### 1.4 Port Congestion Analyzer & Readiness Score

**Goal**: Predict port wait times and generate readiness scores

**Features**:
1. **Real-Time Congestion Detection**:
   - [ ] Count vessels in port area (AIS-based)
   - [ ] Count vessels at anchorage
   - [ ] Identify vessels waiting for berth
   - [ ] Calculate average wait time (current)

2. **Historical Pattern Analysis**:
   - [ ] Average dwell time by vessel type
   - [ ] Seasonal patterns
   - [ ] Day-of-week patterns
   - [ ] Port efficiency trends

3. **Port Readiness Scoring**:
   - [ ] 🟢 Green (0-2h wait): Smooth operations
   - [ ] 🟡 Yellow (2-8h wait): Moderate delays
   - [ ] 🔴 Red (8+h wait): Congested

**Technical Implementation**:
```typescript
interface PortCongestionStatus {
  portId: string;
  timestamp: Date;
  vesselsInPort: number;
  vesselsAtAnchorage: number;
  averageWaitTime: number; // hours
  readinessScore: 'green' | 'yellow' | 'red';
  factors: string[]; // ["weather", "strike", "holiday"]
  prediction: {
    next6h: 'improving' | 'stable' | 'worsening';
    next24h: 'improving' | 'stable' | 'worsening';
  };
  recommendation?: string; // "Slow to 8kn to avoid anchorage"
}
```

**Database Schema**:
```prisma
model PortCongestionSnapshot {
  id                String   @id @default(cuid())
  portId            String
  timestamp         DateTime @default(now())
  vesselsInPort     Int
  vesselsAtAnchorage Int
  averageWaitTime   Float    // hours
  readinessScore    String   // green/yellow/red
  factors           String[] // ["weather", "strike", etc]

  port              Port     @relation(fields: [portId], references: [id])

  @@index([portId, timestamp])
}
```

**Success Criteria**:
- ✅ Wait time predictions within 25% accuracy
- ✅ Congestion detection <15 min lag from AIS
- ✅ Readiness score updates every 15 minutes

**Files to Create**:
- `backend/src/services/arrival-intelligence/port-congestion.service.ts`
- `backend/src/jobs/port-congestion-snapshot-cron.ts`

---

## 🖥️ PHASE 2: Agent Dashboard MVP (Weeks 3-6)

### Overview
Build the Port Agent Command Center dashboard that displays pre-arrival intelligence.

### 2.1 Active Vessels View (Main Dashboard)

**Goal**: Show agents all vessels they're handling with actionable intelligence

**Dashboard Sections**:

1. **Arriving Soon (next 48h)** - High priority:
   - [ ] Vessel card with ETA countdown
   - [ ] Missing documents alerts
   - [ ] DA cost forecast
   - [ ] Action buttons (Generate PDA, Alert Master)

2. **In Port (working)** - Active operations:
   - [ ] Progress indicators (loading/discharging)
   - [ ] Document status
   - [ ] FDA submission status
   - [ ] Days in port counter

3. **Approaching (7+ days)** - Monitoring:
   - [ ] ETA display
   - [ ] All ready status
   - [ ] Pre-planning actions

**Component Structure**:
```typescript
<AgentDashboard>
  <AlertBanner /> {/* Urgent actions */}
  <QuickStats /> {/* 12 active, 3 urgent, etc */}

  <section id="arriving-soon">
    <SectionHeader title="Arriving Soon (48h)" count={3} />
    {arrivals.map(arrival => (
      <VesselArrivalCard
        arrival={arrival}
        onGeneratePDA={() => ...}
        onAlertMaster={() => ...}
      />
    ))}
  </section>

  <section id="in-port">
    <SectionHeader title="In Port" count={8} />
    {inPort.map(vessel => (
      <InPortCard vessel={vessel} />
    ))}
  </section>

  <section id="approaching">
    <SectionHeader title="Approaching" count={12} />
    <VesselTable vessels={approaching} />
  </section>
</AgentDashboard>
```

**Success Criteria**:
- ✅ <2 second page load
- ✅ Real-time updates via GraphQL subscriptions
- ✅ Mobile responsive
- ✅ Intuitive (no training needed)

**Files to Create**:
- `frontend/src/pages/agent/AgentDashboard.tsx`
- `frontend/src/components/agent/VesselArrivalCard.tsx`
- `frontend/src/components/agent/InPortCard.tsx`
- `frontend/src/components/agent/AlertBanner.tsx`

---

### 2.2 Vessel Arrival Intelligence Card

**Goal**: Compact, scannable card showing all critical arrival info

**Card Layout**:
```
┌─────────────────────────────────────────────────┐
│ MV PACIFIC HARMONY          🔴 ETA: 36h 12m    │
│ IMO: 9123456 | Singapore → Rotterdam           │
├─────────────────────────────────────────────────┤
│ ⚠️ ACTIONS NEEDED (2)                          │
│  • Ballast water report missing (due: 12h)     │
│  • Crew list pending (due: 12h)                │
├─────────────────────────────────────────────────┤
│ 🎯 Pilot: Required 0400-0600 UTC               │
│ 💰 DA Estimate: $12,500 - $14,200              │
│ ⏱️ Expected Wait: 6-9 hours                    │
│ 🔴 Congestion: HIGH (12 vessels waiting)       │
├─────────────────────────────────────────────────┤
│ [Generate PDA] [Alert Master] [View Details]   │
└─────────────────────────────────────────────────┘
```

**Component Props**:
```typescript
interface VesselArrivalCardProps {
  arrival: {
    vessel: Vessel;
    port: Port;
    eta: Date;
    etaConfidence: 'high' | 'medium' | 'low';
    missingDocuments: Document[];
    daForecast: DAForecast;
    congestionStatus: CongestionStatus;
    pilotRequirement: PilotInfo;
  };
  onGeneratePDA: () => void;
  onAlertMaster: () => void;
  onViewDetails: () => void;
}
```

**Features**:
- [ ] Real-time ETA countdown
- [ ] Color-coded urgency (green/yellow/red)
- [ ] Expandable details on click
- [ ] Quick actions (PDA, alert, etc.)
- [ ] Status badges for documents
- [ ] Tooltips for complex info

**Success Criteria**:
- ✅ All key info visible without scrolling
- ✅ Color coding immediately understandable
- ✅ Actions are one click away

---

## 📱 PHASE 3: Master Alert Integration (Weeks 5-6)

### Overview
Build two-way communication system between agents and vessel masters.

### 3.1 Alert Triggers & Channels

**When to Alert Masters**:
- [ ] Vessel enters 200 NM radius
- [ ] Missing critical documents (24h before ETA)
- [ ] High congestion detected at destination
- [ ] DA cost significantly higher than expected
- [ ] Port readiness changes to RED
- [ ] ETA changed significantly (>6 hours)

**Alert Channels** (via `@ankr/wire`):
- [ ] Email (primary)
- [ ] SMS (urgent)
- [ ] WhatsApp (if opted in)
- [ ] In-app notification (if master has account)

**Alert Template**:
```
🚢 MV PACIFIC HARMONY - Arrival Alert

📍 Destination: Singapore Anchorage
⏰ ETA: 36 hours (Feb 5, 08:00 UTC)
🎯 Status: Action Required

⚠️ MISSING DOCUMENTS:
• Ballast Water Report (due in 12h)
• Crew List (due in 12h)

📋 REQUIRED ACTIONS:
1. Submit ballast water declaration via email
2. Update crew list in portal
3. Confirm pilot boarding time (0400-0600 UTC)

💰 ESTIMATED COSTS:
Port call DA: $12,500 - $14,200
Congestion: HIGH - expect 6-9h wait

🔗 View full checklist: [link]
📞 Your agent: John Smith (+65 9123 4567)

Reply READY when documents submitted.
```

**Two-Way Responses**:
- [ ] "READY" → auto-update document status
- [ ] "DELAY" → agent notified, ETA adjusted
- [ ] Questions → forwarded to agent

**Files to Create**:
- `backend/src/services/alerts/master-alert.service.ts`
- `backend/src/services/alerts/reply-parser.service.ts`
- `backend/templates/email/master-arrival-alert.html`

---

## 🕒 PHASE 4: Event-Driven Maritime Timeline (Weeks 7-8)

### Overview
Build the single source of truth timeline showing all events for a voyage.

### 4.1 Event Capture System

**Event Types to Capture**:
- [ ] AIS events (departure, speed change, arrival)
- [ ] Document events (submitted, approved, rejected)
- [ ] Agent actions (PDA generated, service booked)
- [ ] Master actions (alert acknowledged, document uploaded)
- [ ] System events (congestion alert, ETA changed)
- [ ] Financial events (DA submitted, payment made)

**Event Schema**:
```prisma
model VoyageEvent {
  id          String    @id @default(cuid())
  voyageId    String
  timestamp   DateTime  @default(now())
  eventType   String
  actor       Actor     // system, master, agent, owner
  action      String
  metadata    Json
  impact      Impact?   // critical, important, info
  attachments String[]

  voyage      Voyage    @relation(fields: [voyageId], references: [id])

  @@index([voyageId, timestamp])
  @@index([eventType])
}

enum Actor {
  SYSTEM
  MASTER
  AGENT
  OWNER
  BROKER
}

enum Impact {
  CRITICAL
  IMPORTANT
  INFO
}
```

**Timeline View Features**:
- [ ] Chronological scroll view
- [ ] Filter by actor/type
- [ ] Search by keyword
- [ ] Export timeline (PDF report)
- [ ] Stakeholder-specific views

**GraphQL Subscription**:
```typescript
subscription VoyageTimeline($voyageId: String!) {
  voyageEvents(voyageId: $voyageId) {
    id
    timestamp
    eventType
    actor
    action
    metadata
    impact
  }
}
```

**Success Criteria**:
- ✅ 100% event capture rate
- ✅ <1 second event-to-display latency
- ✅ Complete audit trail

**Files to Create**:
- `backend/src/services/events/voyage-event.service.ts`
- `frontend/src/components/timeline/VoyageTimeline.tsx`

---

## 🧪 PHASE 5: Beta Launch (Weeks 9-12)

### Overview
Recruit 10 beta agents and validate the system with real operations.

### 5.1 Beta Agent Recruitment

**Target Beta Agents**:
- [ ] 3-4 agents in Singapore (highest traffic)
- [ ] 2-3 agents in Rotterdam/Hamburg (Europe)
- [ ] 2-3 agents in Houston/Long Beach (Americas)
- [ ] Mix of independent + large agency

**Recruitment Process**:
1. **Week 9**: Identify candidates
   - [ ] List existing contacts
   - [ ] LinkedIn outreach
   - [ ] Maritime association referrals
   - [ ] Create beta pitch deck

2. **Week 9**: Schedule demos
   - [ ] 1-on-1 demo calls (30 min)
   - [ ] Show live vessel arrival demo
   - [ ] Generate PDA in real-time
   - [ ] Q&A

3. **Week 10**: Onboard accepted agents
   - [ ] Create accounts
   - [ ] Link to their vessels
   - [ ] Configure ports
   - [ ] Training call (1 hour)

**Beta Program**:
- [ ] Free access to all Pro features (12 weeks)
- [ ] Dedicated Slack channel for support
- [ ] Weekly feedback sessions (1 hour video call)
- [ ] Bug fix priority (<24 hour response)
- [ ] Feature request tracking

### 5.2 Beta Metrics Tracking

**Usage Metrics**:
- [ ] Daily active users
- [ ] Vessels processed
- [ ] PDAs generated
- [ ] Documents submitted
- [ ] Alerts sent
- [ ] Timeline views

**Accuracy Metrics**:
- [ ] DA forecast accuracy (predicted vs actual)
- [ ] ETA prediction accuracy
- [ ] Document detection accuracy
- [ ] Congestion prediction accuracy

**Satisfaction Metrics**:
- [ ] Weekly NPS survey
- [ ] Feature satisfaction ratings
- [ ] Support ticket count
- [ ] Bug reports

**Target Metrics** (by end of beta):
- ✅ 8+ agents actively using (80% retention)
- ✅ 5+ daily active users
- ✅ 20+ vessel arrivals processed
- ✅ 50+ PDAs generated
- ✅ DA forecasts within 15% for 85%+ of arrivals
- ✅ NPS >50
- ✅ 7+ agents willing to pay

### 5.3 Feedback Loop & Iteration

**Weekly Feedback Session Agenda**:
1. What worked well this week?
2. What didn't work / caused friction?
3. What features are missing?
4. How accurate were predictions?
5. Time savings validation

**Iteration Process**:
- [ ] Fix critical bugs within 24h
- [ ] Prioritize feature requests
- [ ] Weekly product updates
- [ ] Monthly release with top requests

**Files to Create**:
- `docs/BETA_PROGRAM.md`
- `docs/BETA_PITCH_DECK.pdf`
- `docs/BETA_ONBOARDING_GUIDE.md`

---

## 💰 PHASE 6: Monetization (Weeks 11-12)

### Overview
Implement pricing tiers and convert beta users to paying customers.

### 6.1 Pricing Implementation

**Pricing Tiers**:

| Tier | Price | Features | Target |
|------|-------|----------|---------|
| **FREE** | $0 | 5 vessels/month, basic intelligence, email alerts | Hook for trial |
| **PRO** | $99/month | Unlimited vessels, auto PDA, multi-channel alerts, DA forecasting | Individual agents |
| **AGENCY** | $499/month | Multi-user (5), white-label, API, custom tariffs | Agent firms |
| **ENTERPRISE** | $2,000/month | Unlimited users, owner portal, integrations, SLA | Large agencies |

**Technical Implementation**:
- [ ] Integrate Stripe for payments
- [ ] Subscription management via Stripe Customer Portal
- [ ] Usage tracking (vessel count per billing cycle)
- [ ] Feature gating based on tier
- [ ] Upgrade/downgrade flows

**Feature Gating**:
```typescript
class FeatureGate {
  canGenerateAutoPDA(user: User): boolean {
    return user.tier !== 'FREE';
  }

  canAccessAPI(user: User): boolean {
    return ['AGENCY', 'ENTERPRISE'].includes(user.tier);
  }

  getVesselLimit(user: User): number {
    return user.tier === 'FREE' ? 5 : Infinity;
  }

  canSendWhatsAppAlerts(user: User): boolean {
    return user.tier !== 'FREE';
  }
}
```

**Database Schema**:
```prisma
model Subscription {
  id                  String   @id @default(cuid())
  userId              String   @unique
  tier                Tier
  stripeCustomerId    String?
  stripeSubscriptionId String?
  status              SubStatus
  currentPeriodStart  DateTime
  currentPeriodEnd    DateTime
  cancelAtPeriodEnd   Boolean  @default(false)

  user                User     @relation(fields: [userId], references: [id])
}

enum Tier {
  FREE
  PRO
  AGENCY
  ENTERPRISE
}

enum SubStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  TRIALING
}

model UsageRecord {
  id            String   @id @default(cuid())
  userId        String
  month         String   // YYYY-MM
  vessels       Int      @default(0)
  pdasGenerated Int      @default(0)
  apiCalls      Int      @default(0)

  @@unique([userId, month])
}
```

### 6.2 Beta-to-Paid Conversion

**Conversion Strategy**:
1. **Week 11**: Announce pricing
   - [ ] Email to beta users
   - [ ] Present launch promotion (50% off 6 months)
   - [ ] Show value delivered (time saved, accuracy achieved)

2. **Week 11**: 1-on-1 calls
   - [ ] Schedule with each beta user
   - [ ] Review their usage + ROI
   - [ ] Discuss which tier fits
   - [ ] Answer pricing questions

3. **Week 12**: Launch promotion
   - [ ] First 100 customers: 50% off for 6 months
   - [ ] Annual plan: 20% discount
   - [ ] Referral: 1 month free for both parties

4. **Week 12**: Payment setup
   - [ ] Send payment links
   - [ ] Assist with Stripe setup
   - [ ] Confirm subscriptions active

**Target Conversion**:
- ✅ 5+ paying customers (50%+ conversion rate)
- ✅ 2+ Agency tier ($499/month)
- ✅ 3+ Pro tier ($99/month)
- ✅ $1,500+ MRR by end of week 12

**Files to Create**:
- `frontend/src/pages/pricing/PricingPage.tsx`
- `frontend/src/pages/billing/BillingPortal.tsx`
- `backend/src/services/billing/stripe.service.ts`

---

## 📣 PHASE 7: Marketing & Growth (Month 4-6)

### Overview
Scale from 5 paying customers to 50+ through content, outreach, and referrals.

### 7.1 Content Marketing

**Blog Posts** (2 per week):
- [ ] "How AI is Transforming Port Agency Operations"
- [ ] "The Hidden Costs of Manual PDA Generation"
- [ ] "Case Study: Agent X Saves 3 Hours Per Arrival"
- [ ] "5 Ways to Predict Port Congestion"
- [ ] "The Future of Maritime Intelligence"
- [ ] "DA Forecasting: How We Achieved 90% Accuracy"
- [ ] "Port Agent Efficiency: A Data-Driven Approach"
- [ ] "Why Vessel Masters Love Pre-Arrival Alerts"

**Webinars** (monthly):
- [ ] Month 4: "Live Demo: Pre-Arrival Intelligence in Action"
- [ ] Month 5: "How to Cut Port Call Costs 15%"
- [ ] Month 6: "The Complete Guide to Maritime Automation"

**E-book**:
- [ ] "The Modern Port Agent's Playbook"
  - 50+ pages
  - Free download (email gate)
  - Covers automation, AI, best practices

**SEO Strategy**:
- [ ] Target keywords: "port agency software", "DA automation", "maritime intelligence"
- [ ] Rank #1 for "pre-arrival port documents"
- [ ] Backlinks from maritime associations

### 7.2 Direct Outreach

**LinkedIn Campaign**:
- [ ] Identify 500+ port agents on LinkedIn
- [ ] Personalized connection requests
- [ ] Share valuable content
- [ ] Direct message with demo offer
- [ ] Target: 50 demos booked per month

**Cold Email**:
- [ ] Build list of 1,000+ port agents
- [ ] Segment by port (Singapore, Rotterdam, Houston, etc.)
- [ ] Personalized emails per port
- [ ] Follow-up sequence (5 emails)
- [ ] Target: 5% response rate

**Trade Shows**:
- [ ] Posidonia 2026 (Athens, June)
- [ ] SMM 2026 (Hamburg, September)
- [ ] Nor-Shipping 2026 (Oslo, June)
- [ ] Booth + demos
- [ ] Target: 100+ leads per show

### 7.3 Referral Program

**Program Structure**:
- [ ] Agent refers another agent
- [ ] Both get 1 month free
- [ ] Unlimited referrals
- [ ] Top referrer each month: $500 bonus

**Referral Tracking**:
```prisma
model Referral {
  id            String   @id @default(cuid())
  referrerId    String
  referredId    String
  status        ReferralStatus
  rewardClaimed Boolean  @default(false)
  createdAt     DateTime @default(now())

  referrer      User     @relation("Referrer", fields: [referrerId], references: [id])
  referred      User     @relation("Referred", fields: [referredId], references: [id])
}
```

**Target**:
- ✅ 20+ referrals by month 6
- ✅ 30%+ of new customers from referrals

### 7.4 Partnerships

**Ship Management Companies**:
- [ ] Identify top 50 ship managers
- [ ] Offer free integration for their fleet
- [ ] Co-marketing opportunities
- [ ] Target: 3+ partnerships by month 6

**P&I Clubs**:
- [ ] Approach top P&I clubs
- [ ] Offer risk reduction tools
- [ ] Become recommended solution
- [ ] Target: 1+ P&I partnership

**Maritime Associations**:
- [ ] FONASBA (Federation of National Associations of Ship Brokers and Agents)
- [ ] BIMCO (Baltic and International Maritime Council)
- [ ] Sponsorships + speaking opportunities

**Success Metrics**:
- ✅ 50+ paying customers by month 6
- ✅ $5,000+ MRR
- ✅ 1,000+ website visits/month
- ✅ 100+ leads/month
- ✅ <5% churn rate

---

## 📱 PHASE 8: Master Mobile App (Month 7-10)

### Overview
Build the Master companion app to create pull demand and viral growth.

### 8.1 React Native MVP

**Core Features**:
- [ ] Pre-arrival checklist (receive at 200 NM)
- [ ] Document upload via camera (with OCR)
- [ ] Agent communication (direct messaging)
- [ ] Voyage timeline view
- [ ] Offline-first architecture
- [ ] Push notifications

**Technical Stack**:
- [ ] React Native + Expo
- [ ] Offline: AsyncStorage + Redux Persist
- [ ] Camera: expo-camera + expo-image-picker
- [ ] OCR: Tesseract.js (on-device)
- [ ] Sync: Delta sync with conflict resolution
- [ ] Push: expo-notifications

**User Flow**:
```
1. Master gets SMS: "MV PACIFIC HARMONY arriving in 36h"
2. Master opens Mari8X app (or clicks link)
3. Sees checklist: "2 documents missing"
4. Takes photos of crew list + ballast report
5. OCR extracts data, master confirms
6. Submits → Agent sees in real-time
7. Master gets confirmation: "All docs received"
```

### 8.2 Viral Loop Strategy

**Why Masters Drive Agent Adoption**:
1. Master uses Mari8X (via their current agent)
2. Master loves the experience (no 3am scrambles)
3. Master talks to other masters at conferences
4. Other masters want the same experience
5. Other masters pressure their agents: "Why don't you use Mari8X?"
6. Agents adopt to win/keep business
7. **VIRAL LOOP ACTIVATED**

**Launch Plan**:
- [ ] Beta with 20 masters (whose agents already use Mari8X)
- [ ] Gather feedback + testimonials
- [ ] Public launch on iOS + Android
- [ ] Promote through maritime forums (gCaptain, Chief-Engineer.com)
- [ ] App Store optimization

**Success Metrics**:
- ✅ 100+ master downloads in first 3 months
- ✅ 60%+ monthly active usage
- ✅ 4.5+ stars on App Store/Play Store
- ✅ 30%+ of masters request agents use Mari8X
- ✅ Agent adoption accelerates 50%+

**Files to Create**:
- `mobile/src/screens/MasterDashboard.tsx`
- `mobile/src/screens/DocumentUpload.tsx`
- `mobile/src/services/offline-sync.service.ts`

---

## 🏢 PHASE 9: Owner Portal (Month 11-14)

### Overview
Complete the three-sided marketplace with owner/fleet manager portal.

### 9.1 Fleet Management Dashboard

**Owner Features**:
- [ ] Fleet dashboard (all vessels at a glance)
- [ ] Real-time positions (AIS map)
- [ ] Voyage monitoring (per-voyage timeline)
- [ ] Financial transparency (DA forecasts, FDA variance)
- [ ] Agent management (performance scores)
- [ ] Analytics & insights (fleet utilization, port efficiency)
- [ ] Smart recommendations (cost optimization)

**Value Propositions**:
- Complete visibility across fleet
- Cost control (DA variance detection)
- Agent accountability
- Performance benchmarking
- Risk mitigation

**Pricing for Owners**:
- $499/month: 1-5 vessels
- $999/month: 6-10 vessels
- $1,999/month: 11-25 vessels
- $4,999/month: 26+ vessels (enterprise)

### 9.2 Owner Adoption Strategy

**Launch Plan**:
1. **Month 11**: Beta with 5 ship owners
   - [ ] Whose agents already use Mari8X
   - [ ] Demonstrate cost savings (DA variance)
   - [ ] Show agent performance comparison
   - [ ] Gather testimonials

2. **Month 12**: Public launch
   - [ ] Landing page for owners
   - [ ] Case studies
   - [ ] Webinar: "Fleet Visibility in Real-Time"

3. **Month 13-14**: Scale
   - [ ] Target ship management companies
   - [ ] 10-50 vessel fleets
   - [ ] Enterprise sales process
   - [ ] Upsell from agent users

**Revenue Model**:
```
Agents: $99/month × 100 agents = $9,900/month
Owners: $999/month × 30 fleets = $29,970/month
Total: $39,870/month = $478,440/year
```

**Success Metrics**:
- ✅ 20+ owner signups in first 3 months
- ✅ $30K+ MRR from owners by month 14
- ✅ 85%+ owner retention
- ✅ NPS >60

---

## 📊 PHASE 10: Broker Intelligence (Month 15-18)

### Overview
Add broker/charterer intelligence layer for market insights.

### 10.1 Live Market Intelligence

**Broker Features**:
- [ ] Live tonnage positioning (where vessels actually are)
- [ ] Vessel reliability scores (on-time arrival rate)
- [ ] Laycan confidence meter (will vessel make it?)
- [ ] Cargo-vessel matching
- [ ] Market intelligence reports (weekly)

**Why Brokers Pay**:
- Better fixtures (reliable vessels)
- Negotiation leverage (laycan confidence)
- Market timing (live tonnage pulse)
- Competitive edge (data-driven)

**Pricing**:
- $499/month: Individual broker
- $1,999/month: Brokerage team (5 users)
- $4,999/month: Full desk (20+ users)

**Revenue Target**:
- 50 brokers × $499/month = $25K/month
- 10 desks × $1,999/month = $20K/month
- Total: $45K/month = $540K/year additional

**Success Metrics**:
- ✅ 95%+ accuracy on laycan confidence
- ✅ 90%+ accuracy on vessel reliability scores
- ✅ NPS >55
- ✅ Retention >80%

---

## 📚 MILESTONE: Documentation

### Overview
Create comprehensive docs to support adoption and reduce support burden.

### Documentation Deliverables

**Quick Start Guides**:
- [ ] For Agents: "Your First Vessel Arrival" (5 min read)
- [ ] For Masters: "Submitting Pre-Arrival Documents" (5 min)
- [ ] For Owners: "Monitoring Your Fleet" (5 min)
- [ ] For Brokers: "Using Vessel Reliability Scores" (5 min)

**User Manuals**:
- [ ] Agent Portal User Guide (comprehensive)
- [ ] Master Mobile App Guide
- [ ] Owner Dashboard Guide
- [ ] Broker Intelligence Guide
- [ ] API Documentation

**Video Tutorials** (3-5 min each):
- [ ] "How to Generate a PDA in 2 Minutes"
- [ ] "Understanding DA Forecasts"
- [ ] "Setting Up Pre-Arrival Alerts"
- [ ] "Reading Port Congestion Status"
- [ ] "Using the Voyage Timeline"

**Knowledge Base**:
- [ ] 50+ FAQs
- [ ] Troubleshooting guides
- [ ] Feature explanations
- [ ] Integration guides
- [ ] Best practices

**Case Studies**:
- [ ] "How Agent X Saved 3 Hours Per Arrival"
- [ ] "Owner Y Cut Port Costs 15% in 6 Months"
- [ ] "Broker Z Improved Fixture Quality 20%"

**Documentation Platform**:
- [ ] Hosted on docs.mari8x.com
- [ ] Built with Docusaurus
- [ ] Searchable
- [ ] Multi-language support (future)

---

## 📊 MILESTONE: Analytics & Monitoring

### Overview
Build analytics to track product performance, user behavior, and business metrics.

### Analytics Implementation

**Product Analytics** (Mixpanel/Amplitude):
- [ ] User behavior tracking
- [ ] Feature usage
- [ ] User flows
- [ ] Drop-off points
- [ ] Retention cohorts

**Business Metrics Dashboard**:
- [ ] MRR (Monthly Recurring Revenue)
- [ ] ARR (Annual Recurring Revenue)
- [ ] Churn Rate
- [ ] CAC (Customer Acquisition Cost)
- [ ] LTV (Lifetime Value)
- [ ] LTV/CAC Ratio
- [ ] Active Users (DAU, WAU, MAU)
- [ ] Trial-to-Paid Conversion
- [ ] NPS Score

**System Performance**:
- [ ] API response times (p50, p95, p99)
- [ ] Error rates by endpoint
- [ ] Database query performance
- [ ] AIS ingestion latency
- [ ] ML prediction accuracy
- [ ] Alert delivery success rate

**Intelligence Accuracy Tracking**:
- [ ] DA forecast accuracy (predicted vs actual)
- [ ] ETA prediction accuracy
- [ ] Congestion prediction accuracy
- [ ] Document detection accuracy
- [ ] Port readiness score accuracy

**ML Feedback Loop**:
```typescript
// When FDA is submitted, compare to PDA forecast
const accuracy = calculateAccuracy(pda.forecast, fda.actual);

// Store for ML model improvement
await mlFeedback.store({
  prediction: pda.forecast,
  actual: fda.actual,
  accuracy: accuracy,
  factors: [/* what influenced the variance */]
});

// Retrain model weekly with new data
await mlModel.retrain();
```

**Success Metrics**:
- ✅ 100% event coverage
- ✅ <1 hour lag for business metrics
- ✅ <5 min lag for system alerts
- ✅ Weekly ML model retraining
- ✅ Monthly accuracy improvement (1-2%)

---

## 🎯 Revenue Milestones

### 18-Month Revenue Roadmap

| Month | Agents | Owners | Brokers | MRR | ARR |
|-------|--------|--------|---------|-----|-----|
| 3 (Beta) | 5 ($99) | 0 | 0 | $495 | $5,940 |
| 6 | 20 | 5 ($999) | 0 | $6,975 | $83,700 |
| 9 | 50 | 15 | 0 | $19,935 | $239,220 |
| 12 | 100 | 30 | 10 ($499) | $39,840 | $478,080 |
| 15 | 150 | 40 | 30 | $69,795 | $837,540 |
| 18 | 200 | 50 | 50 | $94,350 | $1,132,200 |

**Key Assumptions**:
- Agent tier: $99/month
- Owner tier: $999/month (avg 8 vessels)
- Broker tier: $499/month
- 5% monthly churn
- 20-30% month-over-month growth

**Path to $1M ARR**: Month 17

---

## 🚀 Critical Success Factors

### What Must Be True for This to Work

1. **Accuracy is King**:
   - DA forecasts must be within 15% accuracy (85%+ of time)
   - ETA predictions within 6 hours (80%+ of time)
   - One bad prediction can kill trust

2. **Time Savings Must Be Real**:
   - Agents must genuinely save 2-4 hours per arrival
   - Masters must avoid last-minute scrambles
   - Owners must see cost reductions

3. **UX Must Be Intuitive**:
   - No training needed (learn by using)
   - Mobile responsive (agents on the go)
   - Fast (<2 second page loads)

4. **Data Quality**:
   - AIS data must be real-time (<5 min lag)
   - Port tariff data must be current
   - Historical data must be comprehensive

5. **Network Effects**:
   - Agents bring masters
   - Masters bring more agents
   - Agents bring owners
   - Viral loop must activate

6. **Support Must Be Responsive**:
   - <24 hour response time (beta)
   - <2 hour response time (paid)
   - Proactive issue resolution

---

## 📋 Task List Summary

### Phase 1: Intelligence Engine (Weeks 1-4)
- [ ] AIS Proximity Detection & ETA Calculation
- [ ] Document Status Checker
- [ ] DA Cost Forecaster with ML
- [ ] Port Congestion Analyzer

### Phase 2: Agent Dashboard (Weeks 3-6)
- [ ] Active Vessels View
- [ ] Vessel Arrival Intelligence Card
- [ ] Action Timeline Component
- [ ] Alert Banner

### Phase 3: Master Alerts (Weeks 5-6)
- [ ] Alert triggers & channels
- [ ] Two-way communication
- [ ] Reply parsing

### Phase 4: Timeline (Weeks 7-8)
- [ ] Event capture system
- [ ] Timeline view component
- [ ] Stakeholder filters

### Phase 5: Beta Launch (Weeks 9-12)
- [ ] Recruit 10 beta agents
- [ ] Track metrics
- [ ] Iterate based on feedback
- [ ] Validate time savings

### Phase 6: Monetization (Weeks 11-12)
- [ ] Implement pricing tiers
- [ ] Stripe integration
- [ ] Convert 5+ beta users to paying

### Phase 7: Marketing (Month 4-6)
- [ ] Content marketing (blog, webinars)
- [ ] Direct outreach (LinkedIn, email)
- [ ] Referral program
- [ ] Partnerships

### Phase 8: Master App (Month 7-10)
- [ ] React Native MVP
- [ ] Offline-first architecture
- [ ] Document upload with OCR
- [ ] Viral loop activation

### Phase 9: Owner Portal (Month 11-14)
- [ ] Fleet dashboard
- [ ] Financial transparency
- [ ] Agent management
- [ ] Analytics

### Phase 10: Broker Intelligence (Month 15-18)
- [ ] Live market pulse
- [ ] Vessel reliability scores
- [ ] Laycan confidence meter
- [ ] Market reports

### Milestones
- [ ] Documentation (ongoing)
- [ ] Analytics & monitoring (ongoing)

---

## 🎉 Success Definition

**Mari8X is successful when:**

1. **10+ beta agents** are using it daily and willing to pay
2. **90%+ accuracy** on DA forecasts (validated with real FDAs)
3. **2-4 hours saved** per arrival (validated by agents)
4. **5+ paying customers** by end of 90-day MVP ($500+ MRR)
5. **Viral loop activated**: Masters requesting agents use Mari8X
6. **$1M+ ARR** within 18 months
7. **<5% churn rate** (agents stay because it's valuable)

---

## 📞 Next Steps (This Week)

1. **Review & Approve Strategy**:
   - [ ] Read this entire document
   - [ ] Discuss any concerns
   - [ ] Approve to proceed

2. **Start Phase 1.1**:
   - [ ] Set up AIS proximity detection
   - [ ] Build ETA calculator
   - [ ] Test with live AIS data

3. **Identify Beta Candidates**:
   - [ ] List 20 potential beta agents
   - [ ] Prioritize top 10
   - [ ] Draft outreach message

4. **Set Up Infrastructure**:
   - [ ] Ensure TimescaleDB is ready
   - [ ] Verify AIS stream is working
   - [ ] Set up development environment

**Ready to build the future of maritime intelligence?** 🚢⚓🌊

---

**Created**: February 3, 2026
**Status**: Ready to Execute
**Strategic Vision**: Transform Mari8X from AIS viewer to maritime brain
**90-Day Goal**: 10 beta agents, 5 paying customers, $500+ MRR
**18-Month Goal**: $1M+ ARR, complete three-sided marketplace
