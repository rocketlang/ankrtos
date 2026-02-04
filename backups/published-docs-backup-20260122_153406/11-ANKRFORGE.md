# AnkrForge - Custom-Fit Manufacturing Platform

> **Custom-Fit-as-a-Service (CFaaS) for Personalized Products**

**Platform:** AnkrForge
**Category:** Custom Manufacturing / D2C
**Status:** Architecture Complete
**Estimated Value:** $8-12M

---

## Executive Summary

AnkrForge is a **Custom-Fit-as-a-Service (CFaaS)** platform where product modules are swappable plugins while core infrastructure (scanning, design, manufacturing, fulfillment) remains constant. It enables mass customization for earbuds, insoles, dental devices, and more.

---

## Platform Vision: "Forged For You"

### Problem Statement
- Custom-fit products are expensive, slow, and fragmented
- Each vertical builds separate infrastructure
- Mass customization requires expertise across 3D scanning, AI, CAD, manufacturing

### Solution
AnkrForge provides unified infrastructure for all custom-fit products with swappable modules per vertical.

---

## Market Opportunity (TAM: $180B+)

| Vertical | Market Size | CAGR | Products |
|----------|-------------|------|----------|
| Custom Earbuds/Hearing | $15B | 8.2% | IEMs, hearing aids |
| Orthotics & Insoles | $4.5B | 6.1% | Medical orthotics |
| Dental Devices | $8.2B | 7.5% | Mouthguards, retainers |
| Sports Protection | $2.1B | 5.8% | Custom shin guards |
| Custom Eyewear | $140B | 8.0% | Frames, lenses |
| Prosthetics | $12B | 4.5% | Limbs, dental |

---

## Platform Architecture

```
┌─────────────────────────────────────────────────────┐
│  CLIENT APPLICATIONS                                 │
│  iOS App | Android App | Web App | Partner SDK      │
└─────────────────────────┬───────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│  API GATEWAY                                         │
│  Auth | Rate Limit | Routing | Load Balancing       │
└─────────────────────────┬───────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│  CORE SERVICES                                       │
│  Scan Service | Order Service | User Service        │
└─────────────────────────┬───────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│  MODULE ORCHESTRATOR (The Secret Sauce)             │
│  Registry | Design Pipeline | Validation            │
└─────────────────────────┬───────────────────────────┘
          ↓
┌──────────┬──────────┬──────────┬──────────┬─────────┐
│ForgeAudio│ForgeFoot │ForgeDental│ForgeGrip│Custom   │
│(Earbuds) │(Insoles) │(Teeth)    │(Grips)  │Modules  │
└──────────┴──────────┴──────────┴──────────┴─────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│  CAD GENERATION ENGINE                               │
│  Parametric Models | STL/STEP Export | Validation   │
└─────────────────────────┬───────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│  MANUFACTURING NETWORK                               │
│  3D Print | CNC | Injection | Partner Factories     │
└─────────────────────────┬───────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│  FULFILLMENT & LOGISTICS                             │
│  QC | Packaging | Shipping | Tracking | Returns     │
└─────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Backend
- **Framework:** Node.js + Fastify
- **API:** GraphQL
- **ORM:** Prisma
- **Database:** PostgreSQL + TimescaleDB

### 3D Processing
- **Mesh Operations:** Open3D + PyTorch3D
- **CAD Export:** Trimesh (STL/STEP)
- **ML Inference:** TensorRT

### Frontend
- **Web:** React + Three.js (3D visualization)
- **Mobile:** React Native + ARKit/ARCore (phone scanning)

### Storage
- **Files:** AWS S3 / MinIO
- **Formats:** PLY, GLB, STL, 3MF

---

## Module System

### Module Definition (SDK)
```typescript
interface ModuleDefinition {
  id: string;                    // 'forge-audio'
  name: string;                  // 'ForgeAudio'
  version: string;               // '1.0.0'
  bodyPart: BodyPart;            // 'ear'
  products: ProductDefinition[];
  customizations: Customization[];
  scanRequirements: ScanRequirements;
  generateDesign: (input) => Promise<Output>;
  calculatePrice: (design) => Price;
  manufacturingSpec: ManufacturingSpec;
}
```

### Current Production Modules

**ForgeAudio (Custom Earbuds)**
- Products: Earbuds, IEMs, Hearing Aids, Sleep Plugs
- Inputs: Ear canal geometry, acoustic preferences
- Materials: Silicone (soft/firm), medical-grade
- Manufacturing: SLA 3D printing, 0.1mm tolerance

**ForgeFoot (Custom Insoles)**
- Products: Insoles, Orthotics, Sandal Bases
- Inputs: Foot pressure map, arch analysis
- Materials: TPU (multiple hardness), cork composite
- Manufacturing: FDM 3D printing, gyroid infill

**ForgeDental (Dental Devices)**
- Products: Mouthguards, Retainers, Whitening Trays
- Inputs: Tooth arch curve, bite depth
- Materials: Medical-grade resin, clear options
- Manufacturing: SLA 3D printing, 0.05mm layers

---

## Customization Engine

### Supported Types

| Type | Examples | Price Impact |
|------|----------|--------------|
| **Select** | Colors, materials, support level | Fixed (₹200-800) |
| **Color** | Palette selection | Material-specific |
| **Number** | Arch support height (0-100) | Linear |
| **Boolean** | Electronics cavity, padding | On/off |
| **Text** | Custom engraving | Dynamic |

---

## 3D Mesh Utilities (SDK)

```typescript
// Boolean operations
MeshUtils.union(meshA, meshB)
MeshUtils.difference(meshA, meshB)
MeshUtils.intersect(meshA, meshB)

// Transformations
MeshUtils.scale(mesh, 1.05)
MeshUtils.offset(mesh, 2)
MeshUtils.smooth(mesh, { iterations: 3 })
MeshUtils.decimate(mesh, { targetFaces: 10000 })

// Geometry generation
Geometry.sphere({ radius: 5, segments: 32 })
Geometry.cylinder({ radius: 3, height: 10 })
Geometry.extrude(path2D, { depth: 5 })
Geometry.loft([profile1, profile2, profile3])
```

---

## Manufacturing Specification

| Process | Speed | Quality | Cost | Best For |
|---------|-------|---------|------|----------|
| **FDM** | Fast | Medium | Low | Insoles, prototypes |
| **SLA** | Medium | High | Medium | Earbuds, dental |
| **SLS** | Medium | High | Medium | Complex, no supports |
| **MJF** | Fast | High | High | Production volume |
| **DLP** | Slow | Very High | High | Precision dental |

---

## Data Architecture

### Database Schema
```sql
CREATE TABLE modules (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255),
  version VARCHAR(20),
  body_part VARCHAR(50),
  capabilities JSONB,
  status VARCHAR(20)
);

CREATE TABLE designs (
  id UUID PRIMARY KEY,
  user_id UUID,
  scan_id UUID,
  module_id VARCHAR(100),
  cad_file_url TEXT,
  customizations JSONB,
  price JSONB
);

CREATE TABLE orders (
  id UUID PRIMARY KEY,
  design_id UUID,
  status VARCHAR(50),
  manufacturer_id VARCHAR(100),
  shipping_address JSONB
);
```

### Storage Structure
```
ankrforge-storage/
├── scans/raw/{user_id}/{scan_id}.ply
├── scans/processed/{user_id}/{scan_id}.glb
├── designs/preview/{design_id}.png
├── designs/cad/{design_id}.stl
├── designs/print/{design_id}.3mf
└── qc/photos/{job_id}/*.jpg
```

---

## Package Generation Service

### Capabilities
1. **Template Storage** - Save reusable code templates
2. **Auto-Generation** - Generate npm packages from templates
3. **Semantic Search** - Find packages by content
4. **Batch Publishing** - Multiple packages at once

### Use Cases
- Domain-specific validators
- React hooks from backend APIs
- Reusable component libraries
- Client SDKs from API specs

---

## Revenue Model

### Marketplace Commission
- 20% on product sales
- 15% on manufacturing services
- **CAC:** ₹500-1000 per scan
- **LTV:** ₹50,000+ per active user

### Financial Projections

| Year | Users | Products | Revenue |
|------|-------|----------|---------|
| Year 1 | 50K | 100K | $600K-1.2M |
| Year 3 | 500K | 2M | $6-12M |
| Year 5 | 5M | 25M | $36-60M |

---

## Competitive Advantages

### Platform vs Product
- Competitors build one vertical (e.g., UE Fits for earbuds only)
- AnkrForge builds once, deploys to any vertical
- Network effects: More modules → More users → More manufacturers

### India Advantage
- Manufacturing ecosystem relationships
- ULIP logistics integration
- Cost-effective operations
- 1.4B population market

---

## Investment Highlights

1. **Platform Model:** Build once, deploy to any custom-fit vertical
2. **$180B+ TAM:** Multiple addressable markets
3. **Network Effects:** Modules → Users → Manufacturers cycle
4. **India-First:** Manufacturing and logistics advantages
5. **Tech Moat:** 3D processing + AI + manufacturing integration

---

*Document Classification: Investor Confidential*
*Last Updated: 19 Jan 2026*
*Source: /root/ankr-forge/*
