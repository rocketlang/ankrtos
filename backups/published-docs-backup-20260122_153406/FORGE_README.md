# AnkrForge

> **"Forged For You"** - Custom-Fit-as-a-Service Platform

AnkrForge is a platform that enables the creation of perfectly personalized physical products through 3D scanning, AI-driven design, and on-demand manufacturing.

**Website**: ankrforge.in

---

## Vision

Make custom-fit products accessible to everyone, for everything.

```
3D Scan → AI Processing → Custom Design → 3D Print → Deliver
```

---

## Product Verticals

| Module | Body Part | Products |
|--------|-----------|----------|
| **ForgeAudio** | Ear | Custom earbuds, IEMs, ear plugs |
| **ForgeFoot** | Foot | Insoles, orthotics, sandals |
| **ForgeDental** | Teeth | Mouthguards, retainers |
| **ForgeGrip** | Hand | Tool grips, gaming grips |
| **ForgeSport** | Various | Protective gear |

---

## Documentation

| Document | Description |
|----------|-------------|
| [Vision](./docs/ANKR-FORGE-VISION.md) | Product vision, market opportunity |
| [Architecture](./docs/ANKR-FORGE-ARCHITECTURE.md) | Technical system design |
| [API Spec](./docs/ANKR-FORGE-API-SPEC.md) | REST & GraphQL API reference |
| [Module SDK](./docs/ANKR-FORGE-MODULE-SDK.md) | Build product modules |
| [Business Model](./docs/ANKR-FORGE-BUSINESS-MODEL.md) | Pricing, revenue, GTM strategy |
| [MVP Roadmap](./docs/ANKR-FORGE-MVP-ROADMAP.md) | Implementation timeline |

---

## Project Structure

```
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
│   ├── forge-audio/        # Audio products module
│   ├── forge-foot/         # Foot products module
│   └── forge-dental/       # Dental products module
├── docs/                   # Documentation
└── infrastructure/         # IaC (Terraform/Pulumi)
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Node.js, Fastify, GraphQL |
| **Database** | PostgreSQL, Redis |
| **AI/ML** | Python, PyTorch, Open3D |
| **Frontend** | React, Vite, TailwindCSS |
| **Mobile** | React Native |
| **3D** | Three.js, React Three Fiber |
| **Infrastructure** | Kubernetes, AWS |

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/ankr/ankr-forge.git
cd ankr-forge

# Install dependencies
pnpm install

# Start development
pnpm dev
```

---

## Key Features

- **Phone-based 3D Scanning** - LiDAR and photogrammetry support
- **AI Mesh Processing** - Automatic landmark detection and measurement
- **Pluggable Modules** - Add new product types easily
- **Manufacturing Network** - Distributed 3D printing partners
- **Real-time Tracking** - Order status and manufacturing progress

---

## Contact

- **Website**: ankrforge.in
- **Email**: hello@ankrforge.in
- **Developers**: developers@ankrforge.in

---

*Built with precision by Ankr*
