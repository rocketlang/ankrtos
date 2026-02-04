# FORGE_TODO - AnkrForge Master Task List

> **"Forged For You"** - Custom-Fit-as-a-Service Platform
>
> Domain: ankrforge.in | Status: Planning

---

## Quick Links

| Document | Description |
|----------|-------------|
| [FORGE_README](./FORGE_README.md) | Project overview |
| [ANKR-FORGE-VISION](./ANKR-FORGE-VISION.md) | Vision & market opportunity |
| [ANKR-FORGE-ARCHITECTURE](./ANKR-FORGE-ARCHITECTURE.md) | Technical system design |
| [ANKR-FORGE-API-SPEC](./ANKR-FORGE-API-SPEC.md) | API specifications |
| [ANKR-FORGE-MODULE-SDK](./ANKR-FORGE-MODULE-SDK.md) | Module development guide |
| [ANKR-FORGE-BUSINESS-MODEL](./ANKR-FORGE-BUSINESS-MODEL.md) | Revenue & GTM |
| [ANKR-FORGE-MVP-ROADMAP](./ANKR-FORGE-MVP-ROADMAP.md) | Implementation timeline |

---

## Project Status Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  ANKRFORGE STATUS                          January 2026     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phase: 0 - Foundation                    Progress: 15%     │
│  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                  │
│                                                             │
│  Documentation:  ████████████████████ 100%  ✓ Complete     │
│  Infrastructure: ███░░░░░░░░░░░░░░░░░  15%  In Progress    │
│  Backend API:    ░░░░░░░░░░░░░░░░░░░░   0%  Not Started    │
│  Scan Engine:    ░░░░░░░░░░░░░░░░░░░░   0%  Not Started    │
│  First Module:   ░░░░░░░░░░░░░░░░░░░░   0%  Not Started    │
│  Web App:        ░░░░░░░░░░░░░░░░░░░░   0%  Not Started    │
│  Mobile App:     ░░░░░░░░░░░░░░░░░░░░   0%  Not Started    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 0: Foundation (Weeks 1-4)

### Documentation ✅
- [x] Product vision document
- [x] Technical architecture
- [x] API specification
- [x] Module SDK documentation
- [x] Business model
- [x] MVP roadmap
- [x] Project README

### Infrastructure Setup
- [ ] **Domain & DNS**
  - [ ] Register ankrforge.in
  - [ ] Configure DNS (CloudFlare)
  - [ ] SSL certificates
  - [ ] Email setup (hello@, developers@, support@)

- [ ] **Cloud Infrastructure**
  - [ ] AWS/GCP account setup
  - [ ] VPC and networking
  - [ ] Kubernetes cluster
  - [ ] Container registry
  - [ ] S3/GCS buckets for scans

- [ ] **Development Environment**
  - [ ] GitHub organization
  - [ ] Monorepo setup (Turborepo/Nx)
  - [ ] CI/CD pipelines (GitHub Actions)
  - [ ] Development, staging, production environments
  - [ ] Secrets management (Vault/AWS Secrets)

- [ ] **Monitoring & Observability**
  - [ ] Prometheus + Grafana
  - [ ] ELK stack for logs
  - [ ] Sentry for error tracking
  - [ ] Uptime monitoring

### Partner Onboarding
- [ ] **Manufacturing Partners**
  - [ ] Identify 5 potential 3D printing partners
  - [ ] Site visits and capability assessment
  - [ ] Sign LOI with 2 partners
  - [ ] Define quality standards
  - [ ] Set up order API integration

- [ ] **Payment Gateway**
  - [ ] Razorpay account setup
  - [ ] UPI integration
  - [ ] Payment webhook handling
  - [ ] Refund flow design

- [ ] **Shipping Partners**
  - [ ] Delhivery integration
  - [ ] Shiprocket as backup
  - [ ] Tracking webhook setup

### Team Building
- [ ] Hire Tech Lead / CTO
- [ ] Hire 2 Backend Engineers
- [ ] Hire 2 ML/AI Engineers
- [ ] Hire 1 Frontend Engineer
- [ ] Hire 1 Product Manager
- [ ] Hire 1 Operations Lead

---

## Phase 1: MVP (Weeks 5-12)

### Backend API Development
- [ ] **Core Services**
  - [ ] User authentication (JWT + OAuth)
  - [ ] User profile management
  - [ ] Scan upload endpoint
  - [ ] Scan status tracking
  - [ ] Order management
  - [ ] Payment processing
  - [ ] Webhook handlers

- [ ] **Database**
  - [ ] PostgreSQL schema design
  - [ ] Prisma/Drizzle ORM setup
  - [ ] Migrations system
  - [ ] Seed data
  - [ ] Redis cache layer

- [ ] **API Gateway**
  - [ ] Rate limiting
  - [ ] Request validation
  - [ ] API versioning
  - [ ] Documentation (OpenAPI/Swagger)

### Scan Processing Engine
- [ ] **Point Cloud Processing**
  - [ ] PLY/OBJ file parser
  - [ ] Noise reduction algorithm
  - [ ] Outlier removal
  - [ ] Point cloud alignment

- [ ] **Mesh Reconstruction**
  - [ ] Poisson surface reconstruction
  - [ ] Mesh cleanup and repair
  - [ ] Hole filling
  - [ ] Mesh simplification

- [ ] **AI/ML Models**
  - [ ] Ear landmark detection model
  - [ ] Measurement extraction
  - [ ] Quality scoring
  - [ ] Model serving (Triton/TensorRT)

- [ ] **Processing Pipeline**
  - [ ] Job queue (BullMQ)
  - [ ] Worker scaling
  - [ ] Progress tracking
  - [ ] Error handling and retries

### First Module: ForgeAudio Lite
- [ ] **Product Definition**
  - [ ] Custom ear tips (not full earbuds)
  - [ ] 3 color options
  - [ ] 1 material (silicone)
  - [ ] Pricing: ₹999-1499

- [ ] **Design Generation**
  - [ ] Ear canal extraction
  - [ ] Tip geometry generation
  - [ ] STL export
  - [ ] Preview rendering

- [ ] **Manufacturing Integration**
  - [ ] Job submission to partner
  - [ ] Status tracking
  - [ ] QC verification
  - [ ] Packaging specs

### Web Application
- [ ] **Landing Page**
  - [ ] Hero section with value prop
  - [ ] How it works (3 steps)
  - [ ] Product showcase
  - [ ] Pricing section
  - [ ] FAQ
  - [ ] Footer with links

- [ ] **User Authentication**
  - [ ] Sign up / Sign in
  - [ ] Google/Apple OAuth
  - [ ] Password reset
  - [ ] Email verification

- [ ] **Scan Flow**
  - [ ] Instructions page
  - [ ] File upload UI
  - [ ] Processing status
  - [ ] Quality feedback
  - [ ] Scan library

- [ ] **Product & Checkout**
  - [ ] Product selection
  - [ ] Customization UI
  - [ ] 3D preview (Three.js)
  - [ ] Cart
  - [ ] Address form
  - [ ] Payment (Razorpay)
  - [ ] Order confirmation

- [ ] **User Dashboard**
  - [ ] Order history
  - [ ] Order tracking
  - [ ] Scan management
  - [ ] Profile settings

### Launch Preparation
- [ ] **Testing**
  - [ ] Unit tests (80% coverage)
  - [ ] Integration tests
  - [ ] E2E tests (Playwright)
  - [ ] Load testing
  - [ ] Security audit

- [ ] **Content**
  - [ ] Product photos
  - [ ] Demo videos
  - [ ] Help documentation
  - [ ] Terms & privacy policy

- [ ] **Marketing**
  - [ ] Waitlist landing page
  - [ ] Social media accounts
  - [ ] Influencer outreach list
  - [ ] Launch PR plan

---

## Phase 2: Growth (Weeks 13-24)

### ForgeAudio Full (Custom Earbuds)
- [ ] Driver integration partnership
- [ ] Electronics sourcing (BT chip, battery)
- [ ] Acoustic chamber design
- [ ] Sound profile customization
- [ ] Assembly process setup
- [ ] Full product launch

### ForgeFoot Module (Insoles)
- [ ] Foot scanning workflow
- [ ] Foot landmark detection model
- [ ] Pressure analysis algorithm
- [ ] Arch classification
- [ ] Insole generation logic
- [ ] Manufacturing partner for foot
- [ ] Product launch

### Mobile Application
- [ ] **iOS App**
  - [ ] LiDAR scanning (iPhone Pro)
  - [ ] Photogrammetry fallback
  - [ ] AR guidance overlay
  - [ ] Scan review & upload
  - [ ] Full app features

- [ ] **Android App**
  - [ ] ARCore integration
  - [ ] Photogrammetry scanning
  - [ ] Feature parity with iOS

- [ ] **App Store**
  - [ ] App Store submission
  - [ ] Play Store submission
  - [ ] ASO optimization

### Platform Enhancements
- [ ] Subscription tiers (Forge+, Forge Pro)
- [ ] Referral program
- [ ] Loyalty points
- [ ] Multi-language support
- [ ] Accessibility improvements

---

## Phase 3: Platform (Weeks 25-40)

### Module SDK & Marketplace
- [ ] **SDK Development**
  - [ ] @ankrforge/module-sdk NPM package
  - [ ] CLI tools (forge create, test, submit)
  - [ ] Sandbox environment
  - [ ] Developer documentation
  - [ ] Sample modules

- [ ] **Marketplace**
  - [ ] Module discovery UI
  - [ ] Developer registration
  - [ ] Module submission flow
  - [ ] Review process
  - [ ] Revenue dashboard
  - [ ] Version management

- [ ] **Developer Program**
  - [ ] Developer portal
  - [ ] API keys management
  - [ ] Usage analytics
  - [ ] Support ticketing

### Enterprise Features
- [ ] White-label solution
- [ ] Bulk order API
- [ ] Custom module development
- [ ] Dedicated support
- [ ] SLA agreements
- [ ] Analytics dashboard

### Additional Modules
- [ ] ForgeDental (mouthguards)
- [ ] ForgeGrip (tool handles)
- [ ] ForgeSport (protective gear)

---

## Phase 4: Scale (Week 40+)

### International Expansion
- [ ] UAE market entry
- [ ] Singapore pilot
- [ ] US partnership
- [ ] Europe launch

### Advanced Features
- [ ] Real-time scan processing
- [ ] AI design optimization
- [ ] Predictive quality control
- [ ] Automated QC inspection

### Manufacturing Scale
- [ ] Own manufacturing facility
- [ ] Material R&D lab
- [ ] Vertical integration

---

## Technical Debt & Improvements

### Performance
- [ ] Scan processing < 30s
- [ ] API latency p95 < 200ms
- [ ] 99.9% uptime

### Security
- [ ] SOC 2 compliance
- [ ] GDPR compliance
- [ ] Penetration testing
- [ ] Bug bounty program

### Developer Experience
- [ ] API documentation site
- [ ] SDK examples repository
- [ ] Video tutorials
- [ ] Community Discord

---

## Metrics to Track

### North Star
- **Custom Products Delivered Per Month**

### Weekly Metrics
| Metric | Target W1 | Target W4 | Target W12 |
|--------|-----------|-----------|------------|
| Waitlist signups | 500 | 5,000 | 15,000 |
| Scans processed | 10 | 200 | 2,000 |
| Orders placed | 5 | 100 | 500 |
| Revenue (₹) | 5K | 1L | 6L |

### Health Metrics
| Metric | Target |
|--------|--------|
| Scan success rate | > 90% |
| Order conversion | > 5% |
| Return rate | < 5% |
| NPS score | > 40 |
| Support response | < 4 hours |

---

## Risk Register

| Risk | Status | Mitigation |
|------|--------|------------|
| Scan accuracy issues | 🟡 Monitor | Extensive testing, manual fallback |
| Manufacturing delays | 🟡 Monitor | Multiple partners, buffer |
| Low conversion | 🟡 Monitor | A/B testing, user research |
| Competition | 🟢 Low | Move fast, build moat |
| Regulatory | 🟢 Low | Avoid medical claims |

---

## Decision Log

| Date | Decision | Rationale | Owner |
|------|----------|-----------|-------|
| Jan 2026 | Product name: AnkrForge | Strong, memorable, "forged for you" | Team |
| Jan 2026 | Start with ear tips MVP | Lower complexity, faster validation | PM |
| Jan 2026 | Domain: ankrforge.in | Available, matches brand | Team |
| - | Tech stack: Node + React | Team expertise, ecosystem | Tech |
| - | Cloud: AWS | Familiarity, services | Tech |

---

## Meeting Notes

### Kickoff Meeting - TBD
- [ ] Schedule kickoff
- [ ] Align on Phase 0 priorities
- [ ] Assign owners to tasks
- [ ] Set up weekly sync

---

## Resources

### Documentation
- [Product Vision](./ANKR-FORGE-VISION.md)
- [Architecture](./ANKR-FORGE-ARCHITECTURE.md)
- [API Spec](./ANKR-FORGE-API-SPEC.md)
- [Module SDK](./ANKR-FORGE-MODULE-SDK.md)
- [Business Model](./ANKR-FORGE-BUSINESS-MODEL.md)
- [MVP Roadmap](./ANKR-FORGE-MVP-ROADMAP.md)

### External References
- [ZeroBrush](https://www.zerobrush.com/) - Inspiration (dental)
- [Lantos Technologies](https://lantostechnologies.com/) - Ear scanning
- [Wiivv](https://wiivv.com/) - Custom insoles

### Tools
- Figma - Design
- Linear - Project management
- Notion - Documentation
- Slack - Communication
- GitHub - Code

---

## Changelog

| Date | Update |
|------|--------|
| 2026-01-19 | Initial TODO created |
| 2026-01-19 | Documentation complete |

---

*Last Updated: January 19, 2026*
*Next Review: January 26, 2026*
