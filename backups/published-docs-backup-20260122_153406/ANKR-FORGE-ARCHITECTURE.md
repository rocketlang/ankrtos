# AnkrForge - Technical Architecture

> System design for the Custom-Fit-as-a-Service platform

---

## Architecture Overview

AnkrForge follows a **layered architecture** where the product module layer is swappable while all other layers remain constant.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT APPLICATIONS                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  iOS App    │  │ Android App │  │   Web App   │  │ Partner SDK │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Authentication │ Rate Limiting │ Routing │ Load Balancing      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐         ┌───────────────┐           ┌───────────────┐
│  SCAN SERVICE │         │ ORDER SERVICE │           │ USER SERVICE  │
│               │         │               │           │               │
│ • Capture     │         │ • Cart        │           │ • Auth        │
│ • Process     │         │ • Checkout    │           │ • Profiles    │
│ • Store       │         │ • Payments    │           │ • Body Scans  │
└───────────────┘         └───────────────┘           └───────────────┘
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     MODULE ORCHESTRATOR (Core)                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Module Registry │ Design Pipeline │ Validation │ Versioning    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
    ┌───────────────┬───────────────┼───────────────┬───────────────┐
    ▼               ▼               ▼               ▼               ▼
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│ FORGE   │   │ FORGE   │   │ FORGE   │   │ FORGE   │   │ FORGE   │
│ AUDIO   │   │ FOOT    │   │ DENTAL  │   │ GRIP    │   │ CUSTOM  │
│ MODULE  │   │ MODULE  │   │ MODULE  │   │ MODULE  │   │ MODULE  │
└─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘
    │               │               │               │               │
    └───────────────┴───────────────┼───────────────┴───────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      CAD GENERATION ENGINE                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Parametric Models │ STL/STEP Export │ Validation │ Optimization │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    MANUFACTURING NETWORK                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  3D Print   │  │  CNC Mill   │  │  Injection  │  │  Partner    │    │
│  │  Partners   │  │  Partners   │  │  Molding    │  │  Factories  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      FULFILLMENT & LOGISTICS                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  QC Verification │ Packaging │ Shipping │ Tracking │ Returns    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Layer Details

### Layer 1: Client Applications

#### Mobile SDK (iOS/Android)
```typescript
// AnkrForge Scan SDK
interface ForgeScanSDK {
  // Initialize scanner for specific body part
  initScanner(bodyPart: BodyPart): Promise<Scanner>;

  // Capture 3D scan using device sensors
  captureScan(options: ScanOptions): Promise<RawScan>;

  // Upload scan to processing pipeline
  uploadScan(scan: RawScan): Promise<ScanId>;

  // Get processed scan with measurements
  getScanResult(scanId: ScanId): Promise<ProcessedScan>;
}

type BodyPart = 'ear' | 'foot' | 'teeth' | 'hand' | 'head' | 'full-body';

interface ScanOptions {
  quality: 'fast' | 'standard' | 'high';
  guidance: boolean;  // Show AR guidance
  validation: boolean; // Real-time validation
}
```

#### Scanning Technology Support
| Method | Devices | Best For |
|--------|---------|----------|
| **LiDAR** | iPhone Pro, iPad Pro | High-precision scans |
| **Photogrammetry** | Any phone camera | Universal coverage |
| **Structured Light** | Partner hardware | Clinical-grade |
| **TrueDepth** | iPhone Face ID | Facial/ear scanning |

---

### Layer 2: API Gateway

#### Technology Stack
- **Gateway**: Kong / AWS API Gateway
- **Auth**: JWT + OAuth2 (supports Apple/Google Sign-in)
- **Rate Limiting**: Token bucket per user tier
- **Protocol**: REST + GraphQL + WebSocket (real-time updates)

#### Endpoints Structure
```
https://api.ankrforge.in/v1/
├── /auth           # Authentication
├── /users          # User management
├── /scans          # Scan capture & processing
├── /products       # Product catalog
├── /modules        # Available product modules
├── /designs        # Generated designs
├── /orders         # Order management
├── /manufacturing  # Manufacturing status
└── /webhooks       # Partner integrations
```

---

### Layer 3: Core Services

#### Scan Service
Handles capture, processing, and storage of 3D body scans.

```typescript
interface ScanService {
  // Receive raw scan data
  ingestScan(userId: string, rawData: Buffer, bodyPart: BodyPart): Promise<Scan>;

  // Process scan through AI pipeline
  processScan(scanId: string): Promise<ProcessedScan>;

  // Extract measurements and landmarks
  extractMeasurements(scanId: string): Promise<Measurements>;

  // Store scan for future use
  storeScan(scanId: string, retention: RetentionPolicy): Promise<void>;
}

interface ProcessedScan {
  id: string;
  userId: string;
  bodyPart: BodyPart;
  mesh: Mesh3D;
  measurements: Measurements;
  landmarks: Landmark[];
  quality: QualityScore;
  createdAt: Date;
}

interface Measurements {
  // Dynamic based on body part
  [key: string]: {
    value: number;
    unit: 'mm' | 'cm' | 'degrees';
    confidence: number;
  };
}
```

#### AI Processing Pipeline
```
Raw Scan → Noise Reduction → Mesh Reconstruction →
Landmark Detection → Measurement Extraction →
Quality Validation → Processed Scan
```

**AI Models Used:**
- **PointNet++** - 3D point cloud processing
- **MeshCNN** - Mesh feature extraction
- **Custom Models** - Body part specific landmark detection

---

### Layer 4: Module Orchestrator

The **heart of AnkrForge** - manages product modules and design pipeline.

```typescript
interface ModuleOrchestrator {
  // Register a new product module
  registerModule(module: ProductModule): Promise<void>;

  // Get compatible modules for a scan
  getCompatibleModules(scanId: string): Promise<ProductModule[]>;

  // Generate design using specific module
  generateDesign(
    moduleId: string,
    scanId: string,
    customizations: Customizations
  ): Promise<Design>;

  // Validate design before manufacturing
  validateDesign(designId: string): Promise<ValidationResult>;
}

interface ProductModule {
  id: string;
  name: string;
  version: string;
  bodyPart: BodyPart;

  // Module capabilities
  capabilities: ModuleCapabilities;

  // Design generation function
  generateDesign: (input: ModuleInput) => Promise<ModuleOutput>;

  // Manufacturing requirements
  manufacturingSpec: ManufacturingSpec;

  // Pricing calculator
  calculatePrice: (design: Design) => Price;
}

interface ModuleInput {
  scan: ProcessedScan;
  measurements: Measurements;
  customizations: Customizations;
}

interface ModuleOutput {
  cadModel: CADModel;
  materials: Material[];
  printSettings: PrintSettings;
  metadata: DesignMetadata;
}
```

#### Module Lifecycle
```
Development → Testing → Review → Staging → Production
     ↓           ↓         ↓         ↓          ↓
  Local SDK   Sandbox   Ankr QA   Beta Users  Public
```

---

### Layer 5: Product Modules (Swappable)

Each module is a **self-contained unit** that transforms scans into product designs.

#### Module: ForgeAudio (Earbuds)
```typescript
const ForgeAudioModule: ProductModule = {
  id: 'forge-audio',
  name: 'ForgeAudio',
  version: '1.0.0',
  bodyPart: 'ear',

  capabilities: {
    products: ['earbuds', 'hearing-aids', 'ear-plugs', 'monitors'],
    materials: ['silicone', 'resin', 'tpu'],
    customizations: ['color', 'hardness', 'acoustic-tuning']
  },

  generateDesign: async (input) => {
    // 1. Extract ear canal geometry
    const earGeometry = extractEarCanal(input.scan.mesh);

    // 2. Apply acoustic modeling
    const acousticModel = calculateAcoustics(earGeometry, input.customizations);

    // 3. Generate earbud shell
    const shell = generateShell(earGeometry, acousticModel);

    // 4. Add driver cavity and ports
    const finalDesign = addComponents(shell, input.customizations);

    return {
      cadModel: finalDesign,
      materials: [{ type: 'silicone', grade: 'medical', color: input.customizations.color }],
      printSettings: { layer: 0.05, infill: 100, supports: true }
    };
  },

  manufacturingSpec: {
    process: '3d-print-sla',
    tolerance: 0.1, // mm
    postProcessing: ['cure', 'polish', 'assemble']
  },

  calculatePrice: (design) => ({
    base: 2999, // INR
    material: design.materials.reduce((sum, m) => sum + m.cost, 0),
    complexity: design.metadata.complexityScore * 500,
    currency: 'INR'
  })
};
```

#### Module: ForgeFoot (Insoles)
```typescript
const ForgeFootModule: ProductModule = {
  id: 'forge-foot',
  name: 'ForgeFoot',
  version: '1.0.0',
  bodyPart: 'foot',

  capabilities: {
    products: ['insoles', 'orthotics', 'sandal-base', 'arch-supports'],
    materials: ['eva', 'tpu', 'cork-composite'],
    customizations: ['arch-support-level', 'cushioning', 'activity-type']
  },

  generateDesign: async (input) => {
    // 1. Analyze foot pressure points
    const pressureMap = analyzePressure(input.scan.mesh);

    // 2. Detect arch type and issues
    const archAnalysis = analyzeArch(input.measurements);

    // 3. Generate corrective geometry
    const correction = generateCorrection(archAnalysis, input.customizations);

    // 4. Build insole with zones
    const insole = buildInsole(pressureMap, correction);

    return {
      cadModel: insole,
      materials: [{ type: 'tpu', hardness: '85A', zones: true }],
      printSettings: { layer: 0.2, infill: 30, pattern: 'gyroid' }
    };
  },

  manufacturingSpec: {
    process: '3d-print-fdm',
    tolerance: 0.3,
    postProcessing: ['smooth', 'apply-top-layer']
  }
};
```

---

### Layer 6: CAD Generation Engine

Converts module output to manufacturing-ready files.

```typescript
interface CADEngine {
  // Convert parametric design to mesh
  generateMesh(design: Design): Promise<Mesh3D>;

  // Export to various formats
  exportSTL(mesh: Mesh3D): Promise<Buffer>;
  exportSTEP(mesh: Mesh3D): Promise<Buffer>;
  export3MF(mesh: Mesh3D, metadata: PrintMetadata): Promise<Buffer>;

  // Validate printability
  validatePrintability(mesh: Mesh3D, spec: ManufacturingSpec): Promise<ValidationResult>;

  // Optimize for printing
  optimizeMesh(mesh: Mesh3D, options: OptimizeOptions): Promise<Mesh3D>;
}
```

#### Supported Output Formats
| Format | Use Case |
|--------|----------|
| **STL** | Universal 3D printing |
| **STEP** | CNC and professional manufacturing |
| **3MF** | Rich metadata, multi-material |
| **OBJ** | Visualization and review |
| **G-code** | Direct printer control |

---

### Layer 7: Manufacturing Network

Distributed network of manufacturing partners.

```typescript
interface ManufacturingService {
  // Find best manufacturer for job
  findManufacturer(
    design: Design,
    location: GeoLocation,
    urgency: 'standard' | 'express'
  ): Promise<Manufacturer[]>;

  // Submit job to manufacturer
  submitJob(manufacturerId: string, design: Design): Promise<Job>;

  // Track job status
  trackJob(jobId: string): Promise<JobStatus>;

  // Quality control verification
  submitQC(jobId: string, qcData: QCData): Promise<QCResult>;
}

interface Manufacturer {
  id: string;
  name: string;
  location: GeoLocation;
  capabilities: {
    processes: ManufacturingProcess[];
    materials: Material[];
    maxSize: Dimensions;
    tolerance: number;
  };
  pricing: PricingTier;
  rating: number;
  leadTime: Duration;
}

type ManufacturingProcess =
  | 'fdm' | 'sla' | 'sls' | 'mjf'
  | 'cnc' | 'injection' | 'casting';
```

#### Manufacturing Partner Tiers
| Tier | Volume | Quality | Lead Time |
|------|--------|---------|-----------|
| **Tier 1** | High volume | Standard | 5-7 days |
| **Tier 2** | Medium volume | Premium | 3-5 days |
| **Tier 3** | Low volume | Clinical | 7-14 days |
| **Express** | Any | Standard | 1-2 days |

---

### Layer 8: Fulfillment & Logistics

End-to-end delivery management.

```typescript
interface FulfillmentService {
  // Create shipment
  createShipment(orderId: string, address: Address): Promise<Shipment>;

  // Track shipment
  trackShipment(shipmentId: string): Promise<TrackingInfo>;

  // Handle returns
  initiateReturn(orderId: string, reason: ReturnReason): Promise<Return>;

  // Quality guarantee
  handleQualityIssue(orderId: string, issue: QualityIssue): Promise<Resolution>;
}
```

#### Logistics Integrations
- **India**: Delhivery, BlueDart, DTDC, Shiprocket
- **International**: DHL, FedEx, UPS
- **Tracking**: ULIP integration for unified tracking

---

## Data Architecture

### Database Schema (PostgreSQL)
```sql
-- Users and authentication
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Body scans storage
CREATE TABLE scans (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  body_part VARCHAR(50),
  raw_data_url TEXT,
  processed_mesh_url TEXT,
  measurements JSONB,
  quality_score DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Product modules registry
CREATE TABLE modules (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255),
  version VARCHAR(20),
  body_part VARCHAR(50),
  capabilities JSONB,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Generated designs
CREATE TABLE designs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  scan_id UUID REFERENCES scans(id),
  module_id VARCHAR(100) REFERENCES modules(id),
  cad_file_url TEXT,
  customizations JSONB,
  price JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  design_id UUID REFERENCES designs(id),
  status VARCHAR(50),
  manufacturer_id VARCHAR(100),
  shipping_address JSONB,
  payment_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Manufacturing jobs
CREATE TABLE manufacturing_jobs (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  manufacturer_id VARCHAR(100),
  status VARCHAR(50),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  qc_data JSONB
);
```

### Object Storage (S3/MinIO)
```
ankrforge-storage/
├── scans/
│   ├── raw/{user_id}/{scan_id}.ply
│   └── processed/{user_id}/{scan_id}.glb
├── designs/
│   ├── preview/{design_id}.png
│   ├── cad/{design_id}.stl
│   └── print/{design_id}.3mf
└── qc/
    └── photos/{job_id}/*.jpg
```

### Cache Layer (Redis)
- Session management
- Scan processing status
- Real-time job tracking
- Rate limiting counters

---

## Technology Stack

### Backend
| Component | Technology |
|-----------|------------|
| **API** | Node.js + Fastify / Python + FastAPI |
| **GraphQL** | Apollo Server |
| **Database** | PostgreSQL + TimescaleDB |
| **Cache** | Redis Cluster |
| **Queue** | BullMQ / RabbitMQ |
| **Storage** | AWS S3 / MinIO |

### AI/ML
| Component | Technology |
|-----------|------------|
| **3D Processing** | Open3D, PyTorch3D |
| **Mesh Operations** | Trimesh, PyMesh |
| **ML Inference** | TensorRT, ONNX |
| **Model Serving** | Triton Inference Server |

### Frontend
| Component | Technology |
|-----------|------------|
| **Web** | React + Vite + TailwindCSS |
| **Mobile** | React Native / Flutter |
| **3D Viewer** | Three.js, React Three Fiber |
| **AR** | ARKit (iOS), ARCore (Android) |

### Infrastructure
| Component | Technology |
|-----------|------------|
| **Orchestration** | Kubernetes |
| **CI/CD** | GitHub Actions |
| **Monitoring** | Prometheus + Grafana |
| **Logging** | ELK Stack |
| **CDN** | CloudFlare |

---

## Security Architecture

### Data Protection
- **Encryption at Rest**: AES-256 for all stored data
- **Encryption in Transit**: TLS 1.3
- **PII Handling**: Body scan data anonymized where possible
- **Data Retention**: User-controlled, GDPR compliant

### Access Control
```typescript
interface AccessControl {
  // Role-based access
  roles: ['user', 'partner', 'manufacturer', 'admin'];

  // Resource permissions
  permissions: {
    'scans:read': ['owner', 'admin'],
    'scans:delete': ['owner', 'admin'],
    'designs:create': ['owner', 'partner'],
    'orders:fulfill': ['manufacturer', 'admin'],
    'modules:publish': ['partner', 'admin']
  };
}
```

### Compliance
- **GDPR**: EU data protection
- **HIPAA**: Medical device data (where applicable)
- **SOC 2**: Security controls
- **ISO 27001**: Information security

---

## Scalability Considerations

### Horizontal Scaling
- Stateless API services
- Distributed scan processing
- Multi-region deployment
- Read replicas for database

### Performance Targets
| Metric | Target |
|--------|--------|
| API Latency (p95) | < 200ms |
| Scan Processing | < 60s |
| Design Generation | < 30s |
| Concurrent Users | 100K+ |
| Daily Orders | 50K+ |

---

## Document References
- [API Specification](./ANKR-FORGE-API-SPEC.md)
- [Module SDK](./ANKR-FORGE-MODULE-SDK.md)
- [MVP Roadmap](./ANKR-FORGE-MVP-ROADMAP.md)

---

*Last Updated: January 2026*
*Version: 1.0*
