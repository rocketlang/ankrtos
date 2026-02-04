# Kinara - Budget Breakdown

> Target: Under ₹10,00,000 for complete tech platform

---

## Philosophy: Frugal Engineering

- **Sweat Equity First** - Build ourselves before outsourcing
- **Open Source Stack** - No expensive licenses
- **Cloud-Smart** - Use free tiers, optimize costs
- **Prototype Fast** - Validate before investing
- **Modular Spending** - Pay as we grow

---

## Budget Summary

| Category | Allocated | Spent | Remaining |
|----------|-----------|-------|-----------|
| Cloud Infrastructure | ₹1,50,000 | ₹0 | ₹1,50,000 |
| Hardware Prototypes | ₹1,00,000 | ₹0 | ₹1,00,000 |
| Sensors & Components | ₹50,000 | ₹0 | ₹50,000 |
| Development Tools | ₹30,000 | ₹0 | ₹30,000 |
| Testing & QA | ₹50,000 | ₹0 | ₹50,000 |
| Documentation & Content | ₹20,000 | ₹0 | ₹20,000 |
| Legal & Compliance | ₹50,000 | ₹0 | ₹50,000 |
| Contingency (20%) | ₹1,00,000 | ₹0 | ₹1,00,000 |
| **TOTAL** | **₹5,50,000** | **₹0** | **₹5,50,000** |

**Buffer remaining:** ₹4,50,000 (under ₹10L target)

---

## Detailed Breakdown

### 1. Cloud Infrastructure (₹1,50,000/year)

| Service | Provider | Monthly | Annual | Notes |
|---------|----------|---------|--------|-------|
| API Server | Railway/Render | ₹1,500 | ₹18,000 | 2 instances |
| Database (PostgreSQL) | Supabase/Neon | ₹2,000 | ₹24,000 | 10GB + TimescaleDB |
| Redis Cache | Upstash | ₹500 | ₹6,000 | 10K commands/day free |
| Object Storage | Cloudflare R2 | ₹500 | ₹6,000 | 10GB |
| ML Inference | Replicate/Modal | ₹2,000 | ₹24,000 | Pay per inference |
| Monitoring | Grafana Cloud | Free | ₹0 | Free tier |
| Error Tracking | Sentry | Free | ₹0 | Free tier |
| CI/CD | GitHub Actions | Free | ₹0 | 2000 mins/month |
| DNS/CDN | Cloudflare | Free | ₹0 | Free tier |
| **Buffer** | - | - | ₹72,000 | Growth headroom |
| **Total** | | | **₹1,50,000** | |

#### Free Tier Maximization

| Service | Free Tier | Our Usage |
|---------|-----------|-----------|
| Supabase | 500MB DB, 1GB storage | Development |
| Neon | 0.5GB storage, 3GB transfer | Staging |
| Upstash Redis | 10K commands/day | Caching |
| Cloudflare R2 | 10GB storage | Assets |
| Vercel | 100GB bandwidth | Docs site |
| GitHub | Unlimited repos | Code |

### 2. Hardware Prototypes (₹1,00,000)

| Item | Quantity | Unit Cost | Total | Notes |
|------|----------|-----------|-------|-------|
| **Dev Boards** | | | | |
| Nordic nRF52840 DK | 2 | ₹4,000 | ₹8,000 | Main dev board |
| ESP32-C3 DevKit | 5 | ₹500 | ₹2,500 | Cheaper prototyping |
| Raspberry Pi 4 | 1 | ₹5,000 | ₹5,000 | Edge server testing |
| **PCB Prototypes** | | | | |
| Basic Temp Band PCB | 10 | ₹500 | ₹5,000 | JLCPCB |
| Multi-sensor PCB | 5 | ₹1,500 | ₹7,500 | JLCPCB + assembly |
| Revision iterations | 3 runs | ₹5,000 | ₹15,000 | Expect 3 revisions |
| **Enclosures** | | | | |
| 3D Printer filament | 5kg | ₹2,000 | ₹10,000 | PLA + TPU |
| 3D Printing service | 20 parts | ₹500 | ₹10,000 | If no printer |
| Silicone molds | 2 | ₹5,000 | ₹10,000 | For final proto |
| **Assembly** | | | | |
| Soldering station | 1 | ₹3,000 | ₹3,000 | If not owned |
| Tools & consumables | - | - | ₹5,000 | Wires, headers, etc. |
| **Testing Equipment** | | | | |
| Digital multimeter | 1 | ₹2,000 | ₹2,000 | |
| Logic analyzer | 1 | ₹3,000 | ₹3,000 | USB-based |
| Power monitor | 1 | ₹4,000 | ₹4,000 | For battery testing |
| **Buffer** | | | ₹10,000 | |
| **Total** | | | **₹1,00,000** | |

### 3. Sensors & Components (₹50,000)

| Component | Quantity | Unit Cost | Total | Source |
|-----------|----------|-----------|-------|--------|
| **Temperature Sensors** | | | | |
| MAX30205 breakout | 10 | ₹800 | ₹8,000 | Robu.in/AliExpress |
| TMP117 (backup) | 5 | ₹600 | ₹3,000 | |
| **PPG/Heart Rate** | | | | |
| MAX30102 module | 10 | ₹400 | ₹4,000 | Common module |
| **IMU** | | | | |
| LSM6DSO breakout | 5 | ₹500 | ₹2,500 | |
| MPU6050 (cheaper) | 10 | ₹200 | ₹2,000 | For testing |
| **BLE Modules** | | | | |
| nRF52840 modules | 5 | ₹1,500 | ₹7,500 | Raytac MDBT50Q |
| ESP32-C3 modules | 10 | ₹300 | ₹3,000 | |
| **Power** | | | | |
| LiPo batteries (200mAh) | 20 | ₹200 | ₹4,000 | |
| Charging ICs (TP4056) | 20 | ₹50 | ₹1,000 | |
| **Misc** | | | | |
| Peltier cooler (mini) | 5 | ₹500 | ₹2,500 | For cooling proto |
| GSR electrodes | 10 | ₹200 | ₹2,000 | |
| Straps & bands | 20 | ₹100 | ₹2,000 | |
| Connectors, passives | - | - | ₹3,000 | |
| **Shipping** | | | ₹5,500 | Multiple orders |
| **Total** | | | **₹50,000** | |

### 4. Development Tools (₹30,000)

| Tool | Cost | Notes |
|------|------|-------|
| JetBrains IDE | ₹0 | Use VS Code |
| Figma | ₹0 | Free tier |
| Notion | ₹0 | Free tier |
| GitHub Pro | ₹0 | Free for open source |
| Postman | ₹0 | Free tier |
| **Paid Tools** | | |
| Anthropic API (Claude) | ₹10,000 | Development assistance |
| Domain names | ₹2,000 | kinara.health, etc. |
| SSL certificates | ₹0 | Let's Encrypt |
| KiCad | ₹0 | Open source |
| FreeCAD | ₹0 | Open source |
| **Testing Services** | | |
| BrowserStack | ₹5,000 | Mobile testing |
| Load testing tools | ₹3,000 | k6 cloud |
| **Buffer** | ₹10,000 | |
| **Total** | **₹30,000** | |

### 5. Testing & QA (₹50,000)

| Item | Cost | Notes |
|------|------|-------|
| User testing incentives | ₹15,000 | Gift cards for beta testers |
| Device testing (various phones) | ₹10,000 | Rent/borrow devices |
| Security audit (basic) | ₹15,000 | Freelance security review |
| Performance testing | ₹5,000 | Cloud resources for load test |
| Buffer | ₹5,000 | |
| **Total** | **₹50,000** | |

### 6. Documentation & Content (₹20,000)

| Item | Cost | Notes |
|------|------|-------|
| Technical writing | ₹0 | Self-authored |
| Illustrations/diagrams | ₹5,000 | Fiverr/freelance |
| Video tutorials | ₹5,000 | Basic equipment |
| Medical content review | ₹10,000 | Doctor consultation |
| **Total** | **₹20,000** | |

### 7. Legal & Compliance (₹50,000)

| Item | Cost | Notes |
|------|------|-------|
| Company registration | ₹10,000 | If needed |
| Privacy policy drafting | ₹10,000 | Template + lawyer review |
| Terms of service | ₹5,000 | |
| API agreements | ₹5,000 | |
| DPDP compliance review | ₹10,000 | |
| Trademark search | ₹5,000 | "Kinara" |
| Buffer | ₹5,000 | |
| **Total** | **₹50,000** | |

### 8. Contingency (₹1,00,000)

20% buffer for unexpected costs:
- Component price increases
- Additional cloud resources
- Hardware revisions
- Emergency fixes

---

## Cost Optimization Strategies

### 1. Cloud Optimization
```
Strategy                          Savings
─────────────────────────────────────────
Use serverless for variable load  ~40%
Implement caching aggressively    ~30%
Optimize database queries         ~20%
Use edge functions where possible ~15%
Reserved instances (later)        ~30%
```

### 2. Hardware Optimization
```
Strategy                          Savings
─────────────────────────────────────────
AliExpress for prototyping        ~60% vs local
JLCPCB for PCBs                   ~70% vs US fabs
Bulk order sensors                ~30%
Start with dev boards, not custom ~80%
```

### 3. Development Optimization
```
Strategy                          Savings
─────────────────────────────────────────
Open source everything            100% license cost
Claude for coding assistance      10x productivity
Reuse existing libraries          ~50% dev time
Template-based approach           ~30% dev time
```

---

## Revenue Targets to Break Even

| Milestone | Monthly Revenue | Customers | Timeline |
|-----------|-----------------|-----------|----------|
| Cover cloud costs | ₹12,500 | 5 @ ₹2,500 | Month 6 |
| Cover all OpEx | ₹50,000 | 10 @ ₹5,000 | Month 12 |
| Profitable | ₹1,50,000 | 20 @ ₹7,500 | Month 18 |

---

## Expense Tracking

### January 2025
| Date | Item | Category | Amount | Notes |
|------|------|----------|--------|-------|
| - | - | - | - | - |

### Running Total
| Month | Spent | Budget | Remaining |
|-------|-------|--------|-----------|
| Jan 2025 | ₹0 | ₹5,50,000 | ₹5,50,000 |

---

## Funding Sources (If Needed)

| Source | Amount | Likelihood | Notes |
|--------|--------|------------|-------|
| Self-funded | ₹5,00,000 | High | Current plan |
| Angel (friends/family) | ₹5,00,000 | Medium | If hardware scales |
| Grant (social impact) | ₹10,00,000 | Medium | BIRAC, Startup India |
| Pre-seed VC | ₹25,00,000+ | Low | Only after traction |

---

## Notes

- All amounts in INR
- Prices as of January 2025
- GST not included (claim input credit if registered)
- Currency fluctuation may affect import costs
- Review and update monthly
