# Mari8X OSS vs Enterprise Strategy

**Date**: February 8, 2026
**Author**: ANKR Labs
**Status**: Brainstorming & Strategic Planning

---

## 🎯 Vision

Create **two versions** of Mari8X:

1. **Mari8X OSS** (Open Source) - Community-driven maritime platform
2. **Mari8X.com** (Enterprise) - Full-featured commercial SaaS

---

## ✅ Current Status

### Flow Canvas - COMPLETED ✓

**Location**: `/root/apps/ankr-maritime/frontend/src/pages/FlowCanvas/`

**Components**:
- `FlowCanvasPage.tsx` (11KB) - Main canvas interface
- `FlowEntityCard.tsx` - Entity cards
- `FlowEntityDrawer.tsx` - Entity details drawer
- `FlowKPIs.tsx` - KPI dashboard
- `FlowLanes.tsx` - Lane manager
- `FlowLane.tsx` - Individual lane component

**Route**: `/flow-canvas` (already in App.tsx)

**Status**: ✅ **IMPLEMENTED** and accessible in Mari8X

### UI/UX Simplifications - COMPLETED ✓

**Landing Page**:
- ✅ Streamlined stats (removed duplicates)
- ✅ Business-focused messaging (charterers, brokers, owners, agents)
- ✅ Technical landing page (separate for CTOs)
- ✅ ROI calculator added
- ✅ Pricing transparency
- ✅ FAQ section

**Maps**:
- ✅ Fixed vessel rendering (29K+ vessels)
- ✅ Switched to satellite tiles (ESRI World Imagery)
- ✅ OpenSeaMap nautical overlays
- ✅ 100% OSS mapping stack

**Backend**:
- ✅ TimescaleDB optimization (55M+ positions)
- ✅ Query performance <10ms
- ✅ Port 4051 dedicated
- ✅ ankr-ctl integration

---

## 🌊 Mari8X OSS (Open Source Edition)

### Core Philosophy

**"Maritime by the people, for the people"**

- 100% open source (MIT or Apache 2.0 license)
- Community-driven development
- Self-hosted by default
- No vendor lock-in
- API-first architecture

### Target Users

1. **Shipping Cooperatives** - Small shipowners pooling resources
2. **Port Communities** - Local port ecosystems
3. **Maritime Startups** - Building on top of Mari8X
4. **Research Institutions** - Maritime data analysis
5. **Developers** - Contributing to maritime tech
6. **NGOs** - Maritime safety, environment monitoring

### Core Features (OSS)

#### ✅ Included in OSS:

**1. Mari8X OSRM (Open Sea Route Management)**
- ⛵ Route planning & optimization
- 🗺️ Haversine & Great Circle calculations
- 📍 Port-to-port distance calculator
- 🌊 Weather routing (basic)
- 🧭 ETA predictions
- 📊 Fuel consumption estimates

**2. Vessel Tracking**
- 🚢 Basic vessel registry (name, IMO, type)
- 📍 Position tracking (manual entry)
- 🗓️ Voyage logging
- 📈 Basic voyage statistics

**3. Port Directory**
- 🏗️ UN/LOCODE port database
- 📍 Port locations & facilities
- ⚓ Berth information (basic)
- 🏷️ Port tariffs (community-contributed)

**4. Charter Management (Basic)**
- 📝 Fixture notes
- 🤝 Charter party templates (open templates only)
- 📊 Basic P&L calculator
- 📅 Laycan tracking

**5. Document Management**
- 📄 Document upload/storage
- 🏷️ Tagging & categorization
- 🔍 Search
- 📁 Folder structure

**6. Flow Canvas (Visual Workflow)**
- 🎨 Kanban-style boards
- 📦 Entity cards (vessels, cargoes, fixtures)
- 🔄 Drag & drop
- 📊 KPI widgets
- 🎯 Lane management

**7. Maps (100% OSS)**
- 🗺️ Leaflet + OpenStreetMap
- 🌊 OpenSeaMap nautical charts
- 🛰️ ESRI satellite imagery (free tier)
- 📍 Vessel plotting
- 🌍 Heatmaps

**8. Basic API**
- 🔷 GraphQL API (read-only in OSS)
- 📡 REST endpoints
- 📚 OpenAPI documentation
- 🔑 API key authentication

#### ❌ NOT in OSS (Enterprise Only):

1. **AIS Integration** - Real-time AIS data (55M+ positions)
2. **AI/ML Features** - Route predictions, anomaly detection
3. **Advanced Analytics** - Business intelligence dashboards
4. **Multi-tenancy** - SaaS features
5. **White-label** - Custom branding
6. **Premium Integrations** - Equasis, IHS Markit, Clarksons
7. **Compliance Automation** - ISPS, sanctions screening
8. **24/7 Support** - Enterprise support SLA
9. **Mobile Apps** - Native iOS/Android apps
10. **Advanced Workflows** - Approval chains, audit trails
11. **S&P Desk** - Sale & Purchase module
12. **Financial Suite** - P&L, FX, derivatives
13. **CRM & Marketing** - Customer management
14. **HR & Crew Management** - Crew tracking, certifications
15. **Claims Management** - Dispute resolution

---

## 🏢 Mari8X.com (Enterprise Edition)

### Value Proposition

**"Everything in OSS + Enterprise-grade features"**

### Pricing Tiers

#### Starter: $99/month
- OSS features + AIS (10K positions/month)
- 5 users
- Basic support (email)
- Community templates

#### Professional: $499/month (Most Popular)
- OSS features + AIS (Unlimited)
- 25 users
- Priority support (24/5)
- Advanced analytics
- API rate: 10K req/hour
- White-label option

#### Enterprise: Custom
- Everything in Pro
- Unlimited users
- 24/7 support + dedicated CSM
- Custom integrations
- SLA: 99.9% uptime
- On-premise deployment option
- Training & onboarding

---

## 🔄 Migration Path (OSS → Enterprise)

### Seamless Upgrade

Users can start with OSS and upgrade to Enterprise without data migration:

```
OSS Self-Hosted → Mari8X.com Cloud → Enterprise Custom
     (Free)           ($99-499/mo)        (Custom)
```

**Data Portability**:
- Export all data from OSS (JSON, CSV)
- Import to mari8x.com (one-click)
- Sync back to OSS (if downgrading)

---

## 🛠️ Technical Architecture

### OSS Stack (100% Free)

```yaml
Frontend:
  - React 18 + Vite
  - TailwindCSS
  - Apollo Client (GraphQL)
  - Leaflet + OpenStreetMap

Backend:
  - Node.js + Fastify
  - GraphQL (Pothos)
  - PostgreSQL 16
  - Prisma ORM

Maps:
  - OpenStreetMap (OSS)
  - OpenSeaMap (OSS)
  - Leaflet (MIT)

Deployment:
  - Docker + Docker Compose
  - Self-hosted (any VPS)
  - One-command deploy

License:
  - MIT or Apache 2.0 (TBD)
```

### Enterprise Additions

```yaml
Frontend:
  + Mobile apps (React Native)
  + Advanced charts (Recharts Pro)
  + Real-time subscriptions

Backend:
  + TimescaleDB (AIS data)
  + Redis (caching)
  + AI Proxy (ML features)
  + EON Memory (learning)

Integrations:
  + AIS providers (MarineTraffic, VesselFinder)
  + Equasis API
  + Sanctions lists (OFAC, EU)
  + Payment gateways (Razorpay, Stripe)

Infrastructure:
  + Multi-region deployment
  + CDN (CloudFlare)
  + DDoS protection
  + Auto-scaling
```

---

## 📦 Repository Structure

### Proposed GitHub Org: `mari8x-oss`

```
mari8x-oss/
├── mari8x-core/          # Main OSS platform
├── mari8x-osrm/          # Open Sea Route Management
├── mari8x-flow-canvas/   # Visual workflow builder
├── mari8x-docs/          # Documentation
├── mari8x-templates/     # Charter party templates
├── mari8x-plugins/       # Plugin system
└── mari8x-mobile/        # Mobile app (OSS basic version)
```

### mari8x-core Structure

```
mari8x-core/
├── apps/
│   ├── frontend/         # React app
│   ├── backend/          # Fastify API
│   └── docs/             # VitePress docs site
├── packages/
│   ├── osrm/             # Route management lib
│   ├── ui/               # Shared UI components
│   ├── types/            # TypeScript types
│   └── utils/            # Utilities
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── scripts/
│   └── one-click-deploy.sh
├── LICENSE (MIT)
├── CONTRIBUTING.md
└── README.md
```

---

## 🎨 Flow Canvas → Sidecar Integration

### What is Sidecar?

**Sidecar** is part of the EON Memory System (ANKR's learning infrastructure).

**Database**: `ankr_eon` (shared with EON Memory and DevBrain)

**Purpose**: Knowledge extraction, pattern recognition, workflow learning

### Flow Canvas Seeding to Sidecar

#### Objective:

**Learn from maritime workflows to improve automation**

#### What to Seed:

1. **Workflow Patterns**
   - Common fixture flow: Enquiry → Negotiation → Fixed → Executed
   - Typical voyage stages: Loading → Transit → Discharge
   - DA claim patterns: Delay → Notice → Calculation → Dispute/Agreement

2. **Entity Relationships**
   - Vessel ↔ Charter Party
   - Port ↔ Cargo
   - Shipowner ↔ Charterer
   - Agent ↔ Principal

3. **Timing Patterns**
   - Average time in each workflow stage
   - Bottlenecks (stages taking too long)
   - Success rates (% reaching completion)

4. **User Interactions**
   - Which transitions users manually trigger
   - Which fields users frequently update
   - Which entities users link together

#### Implementation:

```typescript
// backend/src/services/flow-canvas-sidecar.ts

import { EONClient } from '@ankr/eon-client';

class FlowCanvasSidecar {
  private eon: EONClient;

  constructor() {
    this.eon = new EONClient('http://localhost:4005');
  }

  async seedWorkflow(workflowId: string, data: WorkflowData) {
    // Extract pattern
    const pattern = {
      type: 'maritime_workflow',
      workflow_id: workflowId,
      entities: data.entities.map(e => ({
        type: e.type,  // 'vessel', 'charter', 'cargo'
        id: e.id,
        stage: e.stage,
        timestamp: e.updatedAt
      })),
      transitions: data.transitions.map(t => ({
        from: t.fromStage,
        to: t.toStage,
        duration: t.durationMs,
        user_action: t.action
      })),
      success: data.completed,
      metadata: {
        user_id: data.userId,
        charter_type: data.charterType,
        vessel_type: data.vesselType
      }
    };

    // Send to EON/Sidecar
    await this.eon.ingest('maritime_workflows', pattern);
  }

  async getWorkflowSuggestions(currentStage: string, entityType: string) {
    // Query EON for learned patterns
    const suggestions = await this.eon.query({
      collection: 'maritime_workflows',
      filters: {
        current_stage: currentStage,
        entity_type: entityType
      },
      aggregations: ['next_stage_frequency', 'avg_duration']
    });

    return suggestions;
  }
}
```

#### Schema for Sidecar/EON:

```prisma
// sidecar/prisma/schema.prisma (extends ankr_eon)

model MaritimeWorkflowPattern {
  id              String   @id @default(uuid())
  workflowType    String   // 'fixture', 'voyage', 'da_claim'
  entityType      String   // 'vessel', 'charter', 'cargo'

  stageSequence   Json     // [stage1, stage2, ...]
  avgDurations    Json     // {stage1: 120000, stage2: 300000}

  transitions     Json     // {stage1_to_stage2: {count: 45, avg_duration: 150000}}

  successRate     Float    // % of workflows reaching completion
  userActions     Json     // Frequent user actions

  learnedFrom     Int      // Number of workflows this pattern learned from
  confidence      Float    // Confidence score (0-1)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model WorkflowSuggestion {
  id              String   @id @default(uuid())
  patternId       String
  pattern         MaritimeWorkflowPattern @relation(fields: [patternId], references: [id])

  currentStage    String
  suggestedNext   String
  confidence      Float
  reasoning       String

  createdAt       DateTime @default(now())
}
```

---

## 🚀 Roadmap

### Phase 1: Extract OSS Core (Weeks 1-4)

**Week 1-2: Repository Setup**
- [ ] Create `mari8x-oss` GitHub organization
- [ ] Extract OSS-only features from current codebase
- [ ] Remove enterprise-only code (AIS, ML, etc.)
- [ ] Set up CI/CD (GitHub Actions)
- [ ] Write CONTRIBUTING.md

**Week 3-4: Documentation**
- [ ] Write comprehensive README
- [ ] API documentation (GraphQL schema)
- [ ] Self-hosting guide (Docker Compose)
- [ ] Developer guide

### Phase 2: Mari8X OSRM Module (Weeks 5-8)

**Week 5-6: OSRM Core**
- [ ] Extract route calculation engine
- [ ] Port distance calculator
- [ ] Weather routing (basic)
- [ ] Fuel consumption estimator

**Week 7-8: Integration & Testing**
- [ ] Integrate OSRM into OSS core
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests
- [ ] Performance benchmarks

### Phase 3: Flow Canvas Integration (Weeks 9-10)

**Week 9: Move Flow Canvas to OSS**
- [ ] Verify Flow Canvas works without enterprise features
- [ ] Add to OSS repository
- [ ] Document usage

**Week 10: Sidecar Integration**
- [ ] Implement FlowCanvasSidecar service
- [ ] Create workflow pattern learning
- [ ] Build suggestion engine
- [ ] Connect to EON Memory

### Phase 4: Community Launch (Week 11-12)

**Week 11: Polish & Prepare**
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] Security audit
- [ ] License headers

**Week 12: Launch! 🚀**
- [ ] Publish to GitHub
- [ ] Blog post announcement
- [ ] Product Hunt launch
- [ ] Hacker News post
- [ ] Reddit (r/opensource, r/maritime)
- [ ] LinkedIn announcement

---

## 💰 Business Model

### OSS (Free Forever)

**Revenue**: $0
**Cost**: Community support
**Goal**: Adoption, brand awareness, developer goodwill

### Enterprise (SaaS)

**Revenue Model**:
- Subscription: $99-499/month (predictable)
- Enterprise: $5K-50K/year (custom)
- Upsells: White-label, on-premise, training

**Target**:
- Year 1: 100 paying customers = $60K-600K ARR
- Year 2: 500 paying customers = $300K-3M ARR
- Year 3: 2000 paying customers = $1.2M-12M ARR

### Freemium Funnel

```
OSS Users (10,000) → Free Trial (1,000) → Paid (100) = 1% conversion
```

**Key**: Make OSS great enough to attract users, but enterprise valuable enough to convert.

---

## 🎯 Success Metrics

### OSS Success:

- ⭐ GitHub Stars: 1K in Year 1
- 🍴 Forks: 200 in Year 1
- 👥 Contributors: 50 in Year 1
- 📦 NPM Downloads: 10K/month by Year 2
- 🌐 Self-hosted Instances: 500 by Year 1

### Enterprise Success:

- 💰 ARR: $600K by Year 1
- 👤 Paying Customers: 100 by Year 1
- 📈 MRR Growth: 15% month-over-month
- 🔄 Churn: <5% monthly
- 💵 LTV/CAC: >3x

---

## 🤝 Community Building

### OSS Community:

1. **Discord Server** - Real-time chat, support, feature requests
2. **GitHub Discussions** - Async forum, Q&A, showcases
3. **Monthly Community Call** - Video call with core team
4. **Contributor Rewards** - Swag, credits, recognition
5. **Showcase Gallery** - User implementations

### Enterprise Community:

1. **Slack Connect** - Direct line to enterprise customers
2. **Quarterly Business Reviews** - Account management
3. **Beta Program** - Early access to new features
4. **User Conference** - Annual maritime tech conference
5. **Partner Program** - Resellers, integrators

---

## ⚠️ Risks & Mitigation

### Risk 1: OSS Cannibalizes Enterprise

**Mitigation**:
- Make enterprise features genuinely valuable (AIS, ML, support)
- Self-hosting requires technical expertise
- Cloud convenience worth paying for

### Risk 2: Slow OSS Adoption

**Mitigation**:
- Excellent documentation
- One-click deploy
- Active community engagement
- Regular releases

### Risk 3: Competition Forks OSS

**Mitigation**:
- Strong brand (Mari8X)
- Network effects (community)
- Pace of innovation (stay ahead)
- Patent OSRM algorithms (defensive)

### Risk 4: Maintenance Burden

**Mitigation**:
- Automated testing
- Good documentation
- Community contributors
- Enterprise revenue funds OSS development

---

## 📋 Decision Points

### Decisions Needed:

1. **License**: MIT vs Apache 2.0 vs AGPL?
2. **Branding**: "Mari8X OSS" vs "OpenMaritime" vs new name?
3. **Hosting**: GitHub vs GitLab vs self-hosted?
4. **OSS Features**: Exactly which features to include?
5. **Launch Date**: When to announce publicly?
6. **CLA**: Contributor License Agreement required?
7. **Governance**: BDFL vs Committee vs Foundation?

### Recommendations:

1. **License**: **MIT** (most permissive, attracts most contributors)
2. **Branding**: **Mari8X OSS** (leverage existing brand)
3. **Hosting**: **GitHub** (largest community)
4. **OSS Features**: Start minimal (OSRM + basic tracking), add based on demand
5. **Launch Date**: **Q2 2026** (after 12-week roadmap)
6. **CLA**: **No CLA** (lower barrier to contribution)
7. **Governance**: **BDFL** (you) with advisory board after Year 1

---

## 🎬 Next Steps

### Immediate (This Week):

1. ✅ **Flow Canvas Status**: Confirmed implemented, accessible at `/flow-canvas`
2. ✅ **UI/UX Simplifications**: Completed (landing page, maps, satellite tiles)
3. ⏳ **Sidecar Integration**: Design FlowCanvasSidecar service (this document)
4. ⏳ **OSS Strategy**: Document created (this file)

### Short-term (Next 2 Weeks):

1. [ ] **Extract OSRM Module**: Create standalone Mari8X OSRM package
2. [ ] **Implement FlowCanvasSidecar**: Connect Flow Canvas to EON/Sidecar
3. [ ] **Define OSS Scope**: Finalize exact feature list for OSS version
4. [ ] **Create OSS Roadmap**: Detailed 12-week plan

### Medium-term (Next 3 Months):

1. [ ] **Build OSS Core**: Extract and clean up OSS-only codebase
2. [ ] **Documentation**: Write comprehensive docs
3. [ ] **Community Setup**: Discord, GitHub, website
4. [ ] **Launch**: Public announcement

---

## 💭 Brainstorming Questions

### For Discussion:

1. **Should Mari8X OSRM be a separate repo or part of mari8x-core?**
   - Separate = More modular, easier to contribute to specific parts
   - Integrated = Simpler for users, one install

2. **Should we have OSS mobile apps?**
   - Pro: Wider adoption, better UX
   - Con: Maintenance burden, platform-specific issues

3. **What should be the minimum viable OSS feature set?**
   - Current thinking: OSRM + vessel tracking + port directory + basic charter

4. **Should we build a marketplace for plugins/templates?**
   - OSS marketplace (free)
   - Enterprise marketplace (paid)

5. **How to handle data security in OSS?**
   - Self-hosted = user's responsibility
   - Provide security best practices guide

---

## 📚 References

### Successful OSS → Enterprise Models:

1. **GitLab**: OSS core, Enterprise for advanced features
2. **Mattermost**: OSS chat, Enterprise for compliance/SSO
3. **Grafana**: OSS dashboards, Enterprise for teams
4. **Sentry**: OSS error tracking, Cloud for convenience
5. **n8n**: OSS automation, Cloud for managed hosting

### Key Learnings:

- Make OSS genuinely useful (not a demo)
- Enterprise features should be "nice to have" not "must have"
- Cloud convenience is worth paying for
- Support is a key differentiator
- Community is an asset, not a cost

---

## ✅ Summary

### What We Know:

- ✅ Flow Canvas is implemented and working
- ✅ UI/UX simplifications are complete
- ✅ Mari8X is production-ready on mari8x.com
- ✅ Technical foundation is solid (TimescaleDB, GraphQL, OSS maps)

### What We're Building:

- 🌊 **Mari8X OSS**: Open-source maritime platform
- ⛵ **Mari8X OSRM**: Open Sea Route Management (part of OSS)
- 🎨 **Flow Canvas**: Already done, will be seeded to Sidecar
- 🏢 **Mari8X.com**: Enterprise SaaS with premium features

### What We Need to Decide:

- License type (MIT recommended)
- Exact OSS feature set
- Launch timeline (Q2 2026 recommended)
- Repository structure

---

**Ready to proceed with OSS extraction?** 🚀

Let's discuss the brainstorming questions above and make the key decisions before we start implementation.
