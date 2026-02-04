# Kinara

**Modular Women's Health Tech Platform**

> *"Kinara"* (किनारा) - Hindi for "shore" or "edge" - symbolizing support during life's transitions

---

## Vision

Empower women navigating menopause and hormonal health transitions through technology that **predicts, monitors, and mitigates** symptoms - affordably and accessibly.

## What is Kinara?

Kinara is a **plug-and-play tech platform** that enables:

- **Healthcare providers** to monitor patients remotely
- **Wellness brands** to build data-driven products
- **Hardware makers** to add women's health features
- **Corporates** to support employee wellness

```
┌─────────────────────────────────────────────────────────────┐
│                     KINARA PLATFORM                          │
│                                                              │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│   │  Sensor  │  │   Data   │  │   ML     │  │  White   │   │
│   │   SDK    │  │   APIs   │  │  Models  │  │  Label   │   │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│   Modular • Plug-and-Play • Frugal • India-First            │
└─────────────────────────────────────────────────────────────┘
```

## Core Principles

1. **Frugal Engineering** - Under ₹10L total platform cost
2. **Modular Architecture** - Add sensors/features without rewrite
3. **India-First** - Local demographics, languages, Ayurveda integration
4. **Open Standards** - No vendor lock-in, standard data formats
5. **Privacy by Design** - User owns their data

## Platform Components

| Component | Description | Status |
|-----------|-------------|--------|
| [Sensor SDK](docs/SENSOR-SDK.md) | Universal sensor abstraction layer | 🔲 Planned |
| [Data APIs](docs/API-SPEC.md) | REST/GraphQL APIs for health data | 🔲 Planned |
| [ML Models](docs/ML-MODELS.md) | Hot flash prediction, pattern detection | 🔲 Planned |
| [Data Models](docs/DATA-MODELS.md) | Standardized health data schemas | 🔲 Planned |
| [Hardware Ref](docs/HARDWARE-REFERENCE.md) | Reference designs for wearables | 🔲 Planned |

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/kinara-platform.git
cd kinara-platform

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test
```

## Project Structure

```
kinara-platform/
├── README.md                 # This file
├── TODO.md                   # Technical roadmap and tasks
├── BUDGET.md                 # Cost breakdown
├── docs/
│   ├── ARCHITECTURE.md       # System architecture
│   ├── API-SPEC.md           # API specifications
│   ├── SENSOR-SDK.md         # Sensor integration guide
│   ├── DATA-MODELS.md        # Data schemas
│   ├── ML-MODELS.md          # ML model documentation
│   ├── HARDWARE-REFERENCE.md # Hardware designs
│   ├── DEPLOYMENT.md         # Deployment guide
│   └── ROADMAP.md            # Product roadmap
├── src/
│   ├── api/                  # API server
│   ├── sdk/                  # Sensor SDKs
│   ├── ml/                   # ML models and training
│   └── services/             # Microservices
├── hardware/                 # Hardware schematics, BOM
└── scripts/                  # Utility scripts
```

## Target Use Cases

### 1. Hot Flash Management
- Predict hot flashes 60-90 seconds before onset
- Trigger cooling devices or alerts
- Track patterns and identify triggers

### 2. Sleep Quality Monitoring
- Track temperature fluctuations during sleep
- Correlate with sleep stages
- Provide actionable insights

### 3. Symptom Tracking & Insights
- Log symptoms (mood, energy, pain)
- AI-powered pattern recognition
- Personalized recommendations

### 4. Clinical Decision Support
- Doctor-shareable reports
- Population health analytics
- Treatment efficacy tracking

## Future Modules (Post-MVP)

- 🌿 **Organic Remedies** - Ayurveda/naturopathy recommendations
- 🍎 **Nutrition** - Prakriti-based meal planning
- 🧘 **Mind-Body** - Guided interventions (yoga, breathwork)
- 👥 **Community** - Peer support circles

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| API | Node.js + Fastify | Fast, low overhead |
| Database | PostgreSQL + TimescaleDB | Time-series optimized |
| Cache | Redis | Real-time performance |
| ML | Python + ONNX | Portable models |
| Mobile SDK | React Native | Cross-platform |
| Embedded SDK | C/Zephyr RTOS | Low-power devices |
| Infra | Docker + Railway/Fly.io | Frugal cloud |

## Budget Summary

**Target: Under ₹10,00,000**

| Category | Allocation |
|----------|------------|
| Development (you + Claude) | ₹0 (sweat equity) |
| Cloud Infrastructure (Year 1) | ₹1,50,000 |
| Hardware Prototypes | ₹1,00,000 |
| Sensors & Components | ₹50,000 |
| Testing & Certification | ₹2,00,000 |
| Contingency | ₹50,000 |
| **Total** | **₹5,50,000** |

See [BUDGET.md](BUDGET.md) for detailed breakdown.

## Contributing

This is currently a private project. Contribution guidelines will be added when we open-source.

## License

Proprietary - All rights reserved (for now)

---

**Built with 💜 for women's health**

*Kinara Platform - Where technology meets care*
