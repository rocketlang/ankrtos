# Mari8X Flow Canvas Implementation Plan

## Overview
Implement FreightBox-style Flow Canvas for Mari8X with 6 core workflows and dynamic flow creation.

## Architecture

### Frontend Components
```
/frontend/src/pages/FlowCanvas/
├── FlowCanvasPage.tsx          # Main page with flow selector
├── FlowLanes.tsx                # Kanban-style lanes
├── FlowKPIs.tsx                 # Top stats cards (clickable)
├── FlowEntityDrawer.tsx         # Side panel for entity details
└── FlowCustomizer.tsx           # Custom flow builder
```

### Backend API
```
/backend/src/api/flow-canvas.ts
- GET /api/flow/dashboard - Get all flows with KPIs
- GET /api/flow/:flowId - Get specific flow data
- POST /api/flow/custom - Save custom flow
- GET /api/flow/:flowId/:stageId - Get entities in stage
```

### GraphQL Schema
```graphql
type FlowDefinition {
  id: String!
  name: String!
  icon: String!
  color: String!
  stages: [FlowStage!]!
  kpis: [FlowKPI!]!
}

type FlowStage {
  id: String!
  name: String!
  order: Int!
  count: Int!
  alertCount: Int!
  entities: [FlowEntity!]!
}

type FlowKPI {
  label: String!
  value: String!
  trend: String # "up" | "down" | "stable"
  trendPercent: Float
  color: String
  onClick: String # Route to navigate on click
}

type FlowEntity {
  id: String!
  type: String! # "charter" | "voyage" | "da" | "agent"
  title: String!
  subtitle: String
  status: String!
  amount: Float
  date: DateTime
  alerts: Int!
}
```

## Mari8X Flow Definitions

### 1. Chartering Flow
**Stages**: Enquiry → Negotiations → On Subs → Fixed → CP Signed → Executed → Completed

**KPIs**:
- Active Charters: 24
- On Subs: 8
- Fixed This Month: 12
- Total Value: $2.4M

**Entity Card** (clickable):
```
┌─────────────────────────────┐
│ CHARTER-2024-001            │
│ MV Ocean Star - Mumbai      │
│ Status: On Subs             │
│ Amount: $125,000            │
│ ⚠ 2 alerts                  │
└─────────────────────────────┘
```

### 2. Voyage Flow
**Stages**: Planned → Nominated → Enroute → Loading → In Transit → Discharge → Complete

**KPIs**:
- Active Voyages: 18
- In Transit: 7
- Delayed: 2
- ETA Confidence: 94%

**Real-time AIS Integration**:
- Auto-move to "In Transit" when vessel departs
- Update ETA based on AIS positions
- Alert when vessel enters port area

### 3. DA Desk Flow
**Stages**: SOF Submitted → Laytime Calc → Review → Disputed → Agreed → Invoiced → Settled

**KPIs**:
- Open DAs: 15
- Disputed: 3
- Avg Resolution: 4.2 days
- Total at Risk: $340K

### 4. AIS Data Flow (Unique to Mari8X!)
**Stages**: Tracking → Voyage Detect → Route Extract → ETA Calc → Congestion → Complete

**KPIs**:
- Vessels Tracked: 41,043
- Voyages Detected: 1,247
- Routes Learned: 453
- Accuracy: 96.8%

**Auto-progression**:
- AIS positions flow through stages automatically
- ML algorithms trigger stage transitions
- No manual intervention needed

### 5. Agent Flow
**Stages**: Nominated → Confirmed → DA Received → Services → Invoiced → Paid

**KPIs**:
- Active Appointments: 28
- DAs Pending: 12
- Outstanding: $45K

### 6. Finance Flow
**Stages**: Draft → Approved → Sent → Partial → Paid → Overdue

**KPIs**:
- Open Invoices: 42
- Overdue: 8
- Collections This Month: $1.2M
- DSO: 32 days

## Dynamic Flow Creation

Users can create custom flows by:
1. Selecting base flow template
2. Adding/removing stages
3. Defining stage transitions
4. Mapping data sources
5. Setting KPIs and alerts

**Example Custom Flow**: "Mumbai Operation Flow"
```
Vessel ETA → Agent Nomination → DA Prep → Berthing → Cargo Ops → Sailing → DA Finalization
```

## Clickable Stats Integration

When user clicks on any KPI card:
```typescript
// Example: Click "On Subs: 8"
onClick: () => {
  // Opens FlowEntityDrawer
  // Shows list of 8 charters on subs
  // Click charter → opens charter detail page WITHIN drawer
  // User stays in flow context
}
```

**Flow Window Concept**:
- Main flow canvas remains visible (left 60%)
- Drawer slides in (right 40%)
- Drawer content can navigate between pages
- User can return to flow or expand drawer to full screen

## Implementation Timeline

### Week 1: Foundation
- [ ] Install `@ankr/flow-canvas` package
- [ ] Create FlowCanvas page structure
- [ ] Define 6 flow schemas
- [ ] Setup GraphQL types

### Week 2: Backend
- [ ] Implement flow-canvas.bff.ts for Mari8X
- [ ] Create API endpoints
- [ ] Write flow data aggregation queries
- [ ] Add GraphQL resolvers

### Week 3: Frontend
- [ ] Build FlowLanes component
- [ ] Implement FlowKPIs with click handlers
- [ ] Create FlowEntityDrawer
- [ ] Add drag-and-drop for stage transitions

### Week 4: Advanced Features
- [ ] AIS flow auto-progression
- [ ] Custom flow builder
- [ ] Flow analytics
- [ ] User preferences (default flow)

## Technical Requirements

### Dependencies
```json
{
  "@ankr/flow-canvas": "^1.0.0",
  "react-beautiful-dnd": "^13.1.0",
  "recharts": "^2.5.0",
  "framer-motion": "^10.16.0"
}
```

### Database Schema
```prisma
model UserFlowPreference {
  id          String   @id @default(cuid())
  userId      String
  defaultFlow String   // "chartering" | "voyage" | "custom-123"
  customFlows Json[]   // Array of custom flow definitions
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model FlowEntity {
  id         String   @id @default(cuid())
  flowType   String
  stageId    String
  entityType String   // "charter" | "voyage" | "da" | etc.
  entityId   String
  metadata   Json
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([flowType, stageId])
  @@index([entityType, entityId])
}
```

## Example Use Cases

### Use Case 1: Charterer Managing Fixtures
1. Opens Chartering Flow
2. Sees 8 charters "On Subs" (KPI card)
3. Clicks card → drawer shows 8 charters
4. Clicks "CHARTER-2024-001" → charter details open in drawer
5. Reviews terms, adds comment
6. Drags charter to "Fixed" stage
7. System updates charter status, sends notifications

### Use Case 2: Operations Team Tracking Voyage
1. Opens Voyage Flow
2. Sees MV Ocean Star in "In Transit" stage
3. Click opens real-time AIS map in drawer
4. Watches vessel approach Mumbai
5. AIS system auto-moves to "Discharge" when vessel enters port zone
6. Operations team receives alert

### Use Case 3: DA Desk Processing Claims
1. Opens DA Desk Flow
2. Sees 3 DAs in "Disputed" stage (red alert)
3. Clicks disputed card
4. Reviews laytime calculations in drawer
5. Adds supporting documents
6. Drags to "Agreed" stage
7. System generates invoice automatically

## Benefits vs Traditional Navigation

### Traditional (137 Pages)
```
User thinks: "I need to check charters on subs"
User actions:
1. Go to sidebar
2. Find "Chartering" section
3. Click "Charter Management"
4. Filter by status = "on_subs"
5. Wait for page load
Total: 4 clicks, 2 page loads, ~10 seconds
```

### Flow Canvas
```
User actions:
1. Open Chartering Flow (already default)
2. Look at "On Subs" lane
Total: 0 clicks, instant, ~0.5 seconds
```

**10x faster!**

## Next Steps

1. Review this plan
2. Approve flow definitions
3. Start Week 1 implementation
4. Build incrementally with user feedback

---

**Status**: Ready for implementation
**Priority**: High (complements existing AI search)
**Effort**: 4 weeks (1 developer)
**Impact**: 10x faster operations for power users
