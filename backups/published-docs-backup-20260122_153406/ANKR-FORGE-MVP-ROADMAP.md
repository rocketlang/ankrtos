# AnkrForge - MVP Roadmap

> Phased implementation plan from concept to scale

---

## Roadmap Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ANKRFORGE ROADMAP                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PHASE 0        PHASE 1        PHASE 2        PHASE 3        PHASE 4   │
│  Foundation     MVP            Growth         Platform       Scale      │
│                                                                          │
│  Weeks 1-4      Weeks 5-12     Weeks 13-24    Weeks 25-40   Week 40+   │
│                                                                          │
│  • Research     • Core API     • ForgeAudio   • Module SDK   • Global  │
│  • Architecture • Scan Engine  • ForgeFoot    • Marketplace  • B2B     │
│  • Team Setup   • Basic Web    • Mobile App   • Enterprise   • IPO?    │
│  • Partners     • 1 Module     • 10K Users    • 100K Users   • 1M+     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 0: Foundation (Weeks 1-4)

### Objectives
- Validate technical feasibility
- Set up development infrastructure
- Secure initial manufacturing partners
- Define MVP scope

### Week 1-2: Research & Validation

#### Technical Validation
| Task | Owner | Deliverable |
|------|-------|-------------|
| Test phone LiDAR scanning accuracy | ML Lead | Accuracy report |
| Evaluate 3D processing libraries | Tech Lead | Tech stack decision |
| Test 3D printing materials | Ops Lead | Material specs |
| Research existing solutions | PM | Competitive analysis |

#### Market Validation
| Task | Owner | Deliverable |
|------|-------|-------------|
| Survey 100 potential users | PM | User research report |
| Interview 10 audio enthusiasts | PM | Pain point analysis |
| Map manufacturing ecosystem | Ops | Partner list |
| Pricing sensitivity testing | PM | Pricing recommendation |

### Week 3-4: Setup & Architecture

#### Development Setup
```
Repository Structure:
ankr-forge/
├── apps/
│   ├── forge-api/          # Main API service
│   ├── forge-web/          # Web application
│   ├── forge-mobile/       # React Native app
│   └── forge-admin/        # Admin dashboard
├── packages/
│   ├── forge-core/         # Shared business logic
│   ├── forge-scan/         # Scan processing
│   ├── forge-cad/          # CAD generation
│   └── forge-module-sdk/   # Module SDK
├── modules/
│   └── forge-audio/        # First product module
├── docs/                   # Documentation
└── infrastructure/         # IaC (Terraform/Pulumi)
```

#### Infrastructure Setup
| Component | Technology | Status |
|-----------|------------|--------|
| Cloud Provider | AWS / GCP | To decide |
| Container Orchestration | Kubernetes | To setup |
| CI/CD | GitHub Actions | To setup |
| Monitoring | Prometheus + Grafana | To setup |
| Database | PostgreSQL + Redis | To setup |
| Object Storage | S3 / MinIO | To setup |

#### Partner Onboarding
- [ ] Sign LOI with 2 3D printing partners
- [ ] Identify shipping partner (Delhivery/Shiprocket)
- [ ] Set up payment gateway (Razorpay)

### Phase 0 Deliverables
- [ ] Technical architecture document
- [ ] Development environment ready
- [ ] 2 manufacturing partners signed
- [ ] Team of 5 hired
- [ ] MVP scope finalized

---

## Phase 1: MVP (Weeks 5-12)

### Objectives
- Build core platform infrastructure
- Launch single product (custom ear tips)
- Acquire first 500 paying customers
- Validate end-to-end flow

### Sprint 1-2 (Weeks 5-6): Core Infrastructure

#### Backend Development
```typescript
// Priority API endpoints
[
  'POST /auth/register',
  'POST /auth/login',
  'POST /scans/upload',
  'GET /scans/{id}',
  'GET /products',
  'POST /designs/generate',
  'POST /orders',
  'GET /orders/{id}'
]
```

| Task | Story Points | Priority |
|------|--------------|----------|
| User authentication (JWT) | 5 | P0 |
| Scan upload & storage | 8 | P0 |
| Order management | 5 | P0 |
| Payment integration (Razorpay) | 5 | P0 |
| Admin dashboard (basic) | 8 | P1 |

#### Database Schema
```sql
-- Core tables for MVP
- users
- scans
- products
- designs
- orders
- payments
- manufacturing_jobs
```

### Sprint 3-4 (Weeks 7-8): Scan Processing

#### AI/ML Pipeline
| Component | Technology | Complexity |
|-----------|------------|------------|
| Point cloud processing | Open3D | Medium |
| Mesh reconstruction | PyMesh | High |
| Ear landmark detection | Custom CNN | High |
| Measurement extraction | Geometric algorithms | Medium |

```python
# Scan processing pipeline
class ScanProcessor:
    def process(self, raw_scan: bytes) -> ProcessedScan:
        # 1. Load point cloud
        pcd = self.load_pointcloud(raw_scan)

        # 2. Clean and filter
        pcd = self.remove_outliers(pcd)
        pcd = self.denoise(pcd)

        # 3. Reconstruct mesh
        mesh = self.reconstruct_mesh(pcd)

        # 4. Detect landmarks
        landmarks = self.detect_landmarks(mesh)

        # 5. Extract measurements
        measurements = self.extract_measurements(mesh, landmarks)

        return ProcessedScan(mesh, landmarks, measurements)
```

### Sprint 5-6 (Weeks 9-10): First Module - ForgeAudio Lite

#### MVP Product: Custom Ear Tips
- Simple silicone ear tips (not full earbuds)
- Works with existing earbuds (AirPods, etc.)
- Lower price point (₹999-1499)
- Easier to manufacture

| Feature | MVP | V2 |
|---------|-----|-----|
| Custom fit from scan | Yes | Yes |
| Color options | 3 | 10+ |
| Material options | 1 | 3 |
| Full earbuds | No | Yes |
| Acoustic optimization | No | Yes |

#### Module Implementation
```typescript
const ForgeAudioLite = defineModule({
  id: 'forge-audio-lite',
  name: 'Custom Ear Tips',
  version: '0.1.0',
  bodyPart: 'ear',

  products: [{
    id: 'ear-tips-basic',
    name: 'Custom Ear Tips',
    basePrice: 999,
    currency: 'INR'
  }],

  async generateDesign(input) {
    // Simplified design for ear tips only
    const earCanal = extractEarCanal(input.scan.mesh);
    const tipMesh = generateEarTip(earCanal, input.customizations);

    return {
      cadModel: { mesh: tipMesh },
      materials: [{ type: 'silicone', color: input.customizations.color }],
      printSettings: { process: 'sla', layer: 0.05 }
    };
  }
});
```

### Sprint 7-8 (Weeks 11-12): Web App & Launch

#### Web Application
| Page | Features |
|------|----------|
| Landing | Hero, How it works, Pricing |
| Scan | Instructions, Upload, Status |
| Product | Customization, Preview, Pricing |
| Checkout | Address, Payment, Confirmation |
| Orders | List, Detail, Tracking |
| Profile | Account, Scans, History |

#### Tech Stack
- React 18 + Vite
- TailwindCSS
- React Query
- Three.js (3D preview)
- Zustand (state)

#### Launch Checklist
- [ ] Web app deployed to ankrforge.in
- [ ] Scan processing working end-to-end
- [ ] Payment flow tested
- [ ] Manufacturing partner ready
- [ ] Shipping integrated
- [ ] Support email/chat ready
- [ ] Analytics (Mixpanel/Amplitude)
- [ ] Error monitoring (Sentry)

### Phase 1 Deliverables
- [ ] Working web app at ankrforge.in
- [ ] Scan upload and processing
- [ ] Custom ear tips product live
- [ ] 500 orders processed
- [ ] <5% return rate
- [ ] 4+ star rating

### MVP Success Metrics
| Metric | Target |
|--------|--------|
| Orders | 500 |
| Conversion Rate | 5% |
| Avg Order Value | ₹1,200 |
| NPS | 40+ |
| Return Rate | <5% |
| Processing Time | <48 hours |

---

## Phase 2: Growth (Weeks 13-24)

### Objectives
- Launch full ForgeAudio (custom earbuds)
- Add ForgeFoot (insoles)
- Launch mobile app
- Scale to 10,000 customers

### Weeks 13-16: ForgeAudio Full

#### Full Earbud Product
| Component | Status |
|-----------|--------|
| Custom shell design | Build |
| Driver integration | Partner |
| Electronics (BT/battery) | Partner |
| Acoustic tuning | Build |
| Assembly process | Setup |

#### New Features
- Multiple material options
- Acoustic profile customization
- Left/right individual pricing
- AR try-on preview

### Weeks 17-20: ForgeFoot Module

#### Insole Product
| Component | Development |
|-----------|-------------|
| Foot scanning workflow | New AR guidance |
| Pressure analysis | ML model |
| Arch classification | Algorithm |
| Insole generation | CAD logic |

#### Manufacturing Partner
- Partner with existing insole manufacturer
- Quality certification for foot products

### Weeks 21-24: Mobile App

#### React Native App
| Feature | Priority |
|---------|----------|
| Scan capture (LiDAR) | P0 |
| Scan review & upload | P0 |
| Product browsing | P0 |
| Order management | P0 |
| Push notifications | P1 |
| AR preview | P1 |

#### Platform Support
- iOS (with LiDAR): Full feature
- iOS (without LiDAR): Photogrammetry
- Android: Photogrammetry + ARCore

### Phase 2 Deliverables
- [ ] ForgeAudio full earbuds live
- [ ] ForgeFoot insoles live
- [ ] iOS app launched
- [ ] Android app launched
- [ ] 10,000 customers
- [ ] ₹5Cr revenue run-rate

---

## Phase 3: Platform (Weeks 25-40)

### Objectives
- Open Module SDK to developers
- Launch module marketplace
- Enterprise/B2B offering
- Scale to 100,000 customers

### Weeks 25-30: Module SDK & Marketplace

#### SDK Development
| Component | Description |
|-----------|-------------|
| @ankrforge/module-sdk | NPM package |
| CLI tools | forge create, test, submit |
| Sandbox environment | Testing scans |
| Documentation | Developer docs |

#### Marketplace Features
- Module discovery & search
- Developer profiles
- Revenue dashboard
- Review system
- Version management

#### Developer Program
- ₹1Cr developer fund
- Hackathon (Q3)
- Featured module program
- Certification program

### Weeks 31-36: Enterprise Features

#### B2B Platform
| Feature | Description |
|---------|-------------|
| White-label | Custom branding |
| API access | Direct integration |
| Bulk orders | Volume discounts |
| Custom modules | Exclusive products |
| Analytics | Business insights |

#### Target Verticals
- Audio brands (custom IEMs)
- Footwear brands (custom insoles)
- Healthcare (orthotics)
- Sports (protective gear)

### Weeks 37-40: ForgeDental & More

#### New Modules
- ForgeDental: Mouthguards, retainers
- ForgeGrip: Tool handles, gaming grips
- ForgeSport: Shin guards, padding

### Phase 3 Deliverables
- [ ] Module SDK launched
- [ ] 10+ third-party modules
- [ ] 5 enterprise customers
- [ ] 100,000 total customers
- [ ] ₹25Cr revenue run-rate

---

## Phase 4: Scale (Week 40+)

### Objectives
- International expansion
- Vertical integration
- Market leadership
- Profitability

### Key Initiatives

#### International Expansion
| Market | Timeline | Strategy |
|--------|----------|----------|
| UAE | Q4 Y1 | Partner-led |
| Singapore | Q1 Y2 | Direct |
| USA | Q2 Y2 | Partner-led |
| Europe | Q3 Y2 | Direct |

#### Vertical Integration
- Own manufacturing facility (Y2)
- In-house driver production (audio)
- Material R&D lab

#### Technology Evolution
- Real-time scan processing
- AI design optimization
- Predictive quality control
- Automated QC inspection

---

## Technical Milestones

### Performance Targets

| Milestone | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|-----------|---------|---------|---------|---------|
| Scan Processing Time | 60s | 30s | 15s | 5s |
| Design Generation | 30s | 15s | 10s | 5s |
| API Latency (p95) | 500ms | 200ms | 100ms | 50ms |
| Uptime | 99% | 99.5% | 99.9% | 99.95% |
| Concurrent Users | 100 | 1K | 10K | 100K |

### Infrastructure Evolution

#### Phase 1: Simple
```
User → Load Balancer → API Server → PostgreSQL
                                  → S3 Storage
                                  → Processing Queue
```

#### Phase 2: Scaled
```
User → CDN → Load Balancer → API Cluster (K8s)
                           → PostgreSQL (Primary + Replica)
                           → Redis Cluster
                           → ML Inference Service
                           → Manufacturing API
```

#### Phase 3+: Global
```
User → CloudFlare → Regional Load Balancer
                  → Regional K8s Cluster
                  → Global PostgreSQL (CockroachDB)
                  → Global Redis
                  → Regional ML Inference
                  → Manufacturing Network API
```

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Scan accuracy issues | Medium | High | Extensive testing, fallback to manual |
| Manufacturing delays | Medium | High | Multiple partners, buffer inventory |
| Low conversion | Medium | Medium | A/B testing, user research |
| Competition | Low | Medium | Move fast, build moat |
| Regulatory (medical) | Low | High | Avoid medical claims initially |
| Team scaling | Medium | Medium | Strong culture, good comp |

---

## Resource Requirements

### Phase 1 Team (9 people)
| Role | Count | Monthly Cost (₹L) |
|------|-------|-------------------|
| Tech Lead | 1 | 4 |
| Backend Engineers | 2 | 5 |
| ML Engineer | 2 | 6 |
| Frontend Engineer | 1 | 2.5 |
| Product Manager | 1 | 3 |
| Operations | 1 | 2 |
| Design | 1 | 2 |
| **Total** | **9** | **24.5** |

### Phase 2 Team (+12 = 21 people)
| Role | Additional | Monthly Cost (₹L) |
|------|------------|-------------------|
| Engineers | +6 | +15 |
| ML/AI | +2 | +6 |
| Product | +1 | +3 |
| Operations | +2 | +4 |
| Marketing | +1 | +2.5 |
| **Total** | **+12** | **+30.5** |

### Monthly Burn Rate

| Phase | Team | Infra | Marketing | Other | Total (₹L) |
|-------|------|-------|-----------|-------|------------|
| Phase 1 | 25 | 5 | 10 | 5 | 45 |
| Phase 2 | 55 | 15 | 25 | 10 | 105 |
| Phase 3 | 100 | 30 | 50 | 20 | 200 |

---

## Decision Log

| Decision | Date | Rationale | Owner |
|----------|------|-----------|-------|
| Start with ear tips, not full earbuds | - | Lower complexity, faster validation | PM |
| Use React Native for mobile | - | Code sharing, team expertise | Tech Lead |
| PostgreSQL over MongoDB | - | Relational data, ACID compliance | Tech Lead |
| Razorpay for payments | - | Best UPI support, Indian focus | Ops |
| AWS over GCP | - | Team familiarity, ecosystem | Tech Lead |

---

## Appendix: Sprint Template

```markdown
## Sprint [N] (Week X-Y)

### Goals
1. Goal 1
2. Goal 2

### Stories
| ID | Story | Points | Owner | Status |
|----|-------|--------|-------|--------|
| S-001 | As a user... | 5 | Dev1 | Done |

### Blockers
- Blocker 1: Resolution

### Retro Notes
- What went well
- What to improve

### Metrics
- Velocity: X points
- Bugs: Y
- Tech debt: Z hours
```

---

*Last Updated: January 2026*
*Version: 1.0*
