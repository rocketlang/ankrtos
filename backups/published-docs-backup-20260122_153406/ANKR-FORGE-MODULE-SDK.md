# AnkrForge - Module SDK Documentation

> Build custom product modules for the AnkrForge platform

---

## Overview

The AnkrForge Module SDK allows developers and partners to create **product modules** that transform 3D body scans into custom-fit product designs. Modules are self-contained units that plug into the AnkrForge platform.

```
┌────────────────────────────────────────────────────────────┐
│                    YOUR MODULE                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │   Input: ProcessedScan + Measurements + Options      │  │
│  │                         ↓                            │  │
│  │   Your Design Logic (the "secret sauce")             │  │
│  │                         ↓                            │  │
│  │   Output: CAD Model + Materials + Print Settings     │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Installation

```bash
# npm
npm install @ankrforge/module-sdk

# yarn
yarn add @ankrforge/module-sdk

# pnpm
pnpm add @ankrforge/module-sdk
```

### Quick Start

```typescript
import { ForgeModule, defineModule } from '@ankrforge/module-sdk';

const MyEarbudsModule = defineModule({
  id: 'my-custom-earbuds',
  name: 'My Custom Earbuds',
  version: '1.0.0',
  bodyPart: 'ear',

  products: [
    {
      id: 'basic-earbuds',
      name: 'Basic Custom Earbuds',
      basePrice: 2999,
      currency: 'INR'
    }
  ],

  async generateDesign(input) {
    // Your design logic here
    const shell = await generateEarbudShell(input.scan.mesh);

    return {
      cadModel: shell,
      materials: [{ type: 'silicone', color: input.customizations.color }],
      printSettings: { layer: 0.05, infill: 100 }
    };
  }
});

export default MyEarbudsModule;
```

---

## Module Structure

### Module Definition

```typescript
interface ModuleDefinition {
  // Unique identifier (lowercase, hyphens)
  id: string;

  // Display name
  name: string;

  // Semantic version
  version: string;

  // Target body part
  bodyPart: BodyPart;

  // Module description
  description?: string;

  // Products offered by this module
  products: ProductDefinition[];

  // Available customization options
  customizations?: CustomizationDefinition[];

  // Scan requirements
  scanRequirements?: ScanRequirements;

  // Design generation function
  generateDesign: (input: ModuleInput) => Promise<ModuleOutput>;

  // Price calculation (optional, default uses basePrice)
  calculatePrice?: (design: Design, customizations: Customizations) => Price;

  // Validation function (optional)
  validateInput?: (input: ModuleInput) => ValidationResult;

  // Manufacturing specifications
  manufacturingSpec: ManufacturingSpec;
}

type BodyPart = 'ear' | 'foot' | 'teeth' | 'hand' | 'head' | 'full-body';
```

### Product Definition

```typescript
interface ProductDefinition {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  currency: string;
  previewImages?: string[];
  variants?: ProductVariant[];

  // Product-specific customizations
  customizations?: CustomizationDefinition[];

  // Override default manufacturing spec
  manufacturingSpec?: Partial<ManufacturingSpec>;
}
```

### Customization Options

```typescript
interface CustomizationDefinition {
  id: string;
  name: string;
  type: 'select' | 'color' | 'number' | 'boolean' | 'text';
  required?: boolean;
  default?: any;

  // For 'select' type
  options?: CustomizationOption[];

  // For 'number' type
  min?: number;
  max?: number;
  step?: number;

  // For 'color' type
  palette?: string[];

  // Price modifier
  priceModifier?: (value: any) => number;
}

interface CustomizationOption {
  value: string;
  label: string;
  priceModifier?: number;
  previewImage?: string;
}
```

---

## Module Input

When your `generateDesign` function is called, it receives:

```typescript
interface ModuleInput {
  // The processed 3D scan
  scan: ProcessedScan;

  // Extracted measurements
  measurements: Measurements;

  // User-selected customizations
  customizations: Record<string, any>;

  // Selected product ID
  productId: string;

  // User preferences (optional)
  userPreferences?: UserPreferences;
}

interface ProcessedScan {
  id: string;
  bodyPart: BodyPart;

  // 3D mesh data
  mesh: Mesh3D;

  // Quality metrics
  quality: {
    score: number;
    issues: string[];
  };

  // Detected landmarks
  landmarks: Landmark[];
}

interface Mesh3D {
  // Vertices as flat array [x1,y1,z1, x2,y2,z2, ...]
  vertices: Float32Array;

  // Triangle indices
  indices: Uint32Array;

  // Vertex normals (optional)
  normals?: Float32Array;

  // UV coordinates (optional)
  uvs?: Float32Array;

  // Bounding box
  bounds: BoundingBox;

  // Helper methods
  getVertex(index: number): Vector3;
  getTriangle(index: number): Triangle;
  clone(): Mesh3D;
}

interface Measurements {
  [key: string]: {
    value: number;
    unit: 'mm' | 'cm' | 'degrees';
    confidence: number;
  };
}

interface Landmark {
  id: string;
  name: string;
  position: Vector3;
  normal?: Vector3;
  confidence: number;
}
```

### Body Part Specific Measurements

#### Ear Measurements
```typescript
interface EarMeasurements extends Measurements {
  canal_length: Measurement;      // mm
  canal_diameter: Measurement;    // mm
  canal_bend_angle: Measurement;  // degrees
  concha_depth: Measurement;      // mm
  concha_width: Measurement;      // mm
  tragus_height: Measurement;     // mm
  helix_width: Measurement;       // mm
}
```

#### Foot Measurements
```typescript
interface FootMeasurements extends Measurements {
  length: Measurement;            // mm
  width_ball: Measurement;        // mm
  width_heel: Measurement;        // mm
  arch_height: Measurement;       // mm
  arch_length: Measurement;       // mm
  instep_height: Measurement;     // mm
  heel_width: Measurement;        // mm
  toe_angle: Measurement;         // degrees
}
```

#### Teeth Measurements
```typescript
interface TeethMeasurements extends Measurements {
  arch_width: Measurement;        // mm
  arch_depth: Measurement;        // mm
  bite_depth: Measurement;        // mm
  tooth_heights: Measurement[];   // per tooth
}
```

---

## Module Output

Your `generateDesign` function must return:

```typescript
interface ModuleOutput {
  // The generated CAD model
  cadModel: CADModel;

  // Materials specification
  materials: MaterialSpec[];

  // 3D printing settings
  printSettings: PrintSettings;

  // Metadata about the design
  metadata?: DesignMetadata;

  // Assembly instructions (if multi-part)
  assembly?: AssemblyInstructions;
}

interface CADModel {
  // Primary mesh
  mesh: Mesh3D;

  // Additional parts (for multi-part designs)
  parts?: NamedMesh[];

  // Design parameters used
  parameters?: Record<string, any>;
}

interface MaterialSpec {
  type: MaterialType;
  partName?: string;       // Which part uses this material
  color?: string;          // Hex color
  hardness?: string;       // e.g., "85A" for TPU
  grade?: 'standard' | 'medical' | 'food-safe';
  properties?: Record<string, any>;
}

type MaterialType =
  | 'silicone'
  | 'tpu'
  | 'pla'
  | 'resin'
  | 'nylon'
  | 'petg'
  | 'eva'
  | 'cork'
  | 'metal';

interface PrintSettings {
  process: PrintProcess;
  layer: number;           // Layer height in mm
  infill: number;          // Infill percentage
  pattern?: InfillPattern;
  supports?: boolean;
  orientation?: Orientation;
  postProcessing?: PostProcess[];
}

type PrintProcess = 'fdm' | 'sla' | 'sls' | 'mjf' | 'dlp';
type InfillPattern = 'grid' | 'honeycomb' | 'gyroid' | 'cubic' | 'lines';
type PostProcess = 'cure' | 'polish' | 'sand' | 'paint' | 'coat' | 'assemble';
```

---

## SDK Utilities

The SDK provides helper utilities for common operations.

### Mesh Operations

```typescript
import { MeshUtils } from '@ankrforge/module-sdk';

// Boolean operations
const unionMesh = MeshUtils.union(meshA, meshB);
const differenceMesh = MeshUtils.difference(meshA, meshB);
const intersectMesh = MeshUtils.intersect(meshA, meshB);

// Transformations
const scaled = MeshUtils.scale(mesh, 1.05);
const translated = MeshUtils.translate(mesh, { x: 0, y: 0, z: 5 });
const rotated = MeshUtils.rotate(mesh, { axis: 'z', angle: 45 });

// Offsetting (for shell thickness)
const shell = MeshUtils.offset(mesh, 2); // 2mm offset

// Smoothing
const smoothed = MeshUtils.smooth(mesh, { iterations: 3 });

// Hole filling
const filled = MeshUtils.fillHoles(mesh);

// Decimation (reduce poly count)
const simplified = MeshUtils.decimate(mesh, { targetFaces: 10000 });

// Subdivision
const detailed = MeshUtils.subdivide(mesh, { iterations: 2 });
```

### Geometry Generation

```typescript
import { Geometry } from '@ankrforge/module-sdk';

// Primitives
const sphere = Geometry.sphere({ radius: 5, segments: 32 });
const cylinder = Geometry.cylinder({ radius: 3, height: 10 });
const box = Geometry.box({ width: 10, height: 5, depth: 3 });
const cone = Geometry.cone({ radius: 5, height: 10 });

// Extrusion from path
const extruded = Geometry.extrude(path2D, { depth: 5 });

// Revolution
const revolved = Geometry.revolve(profile2D, { angle: 360, segments: 64 });

// Loft between profiles
const lofted = Geometry.loft([profile1, profile2, profile3]);

// Sweep along path
const swept = Geometry.sweep(crossSection, path3D);
```

### Measurement Helpers

```typescript
import { Measure } from '@ankrforge/module-sdk';

// Distance between points
const dist = Measure.distance(pointA, pointB);

// Angle between vectors
const angle = Measure.angle(vectorA, vectorB);

// Surface area
const area = Measure.surfaceArea(mesh);

// Volume
const volume = Measure.volume(mesh);

// Bounding box
const bbox = Measure.boundingBox(mesh);

// Center of mass
const center = Measure.centerOfMass(mesh);
```

### Body Part Utilities

```typescript
import { BodyParts } from '@ankrforge/module-sdk';

// Ear utilities
const earCanal = BodyParts.ear.extractCanal(scanMesh);
const concha = BodyParts.ear.extractConcha(scanMesh);
const earLandmarks = BodyParts.ear.detectLandmarks(scanMesh);

// Foot utilities
const archProfile = BodyParts.foot.extractArchProfile(scanMesh);
const pressureMap = BodyParts.foot.estimatePressure(scanMesh);
const footType = BodyParts.foot.classifyFootType(measurements);

// Teeth utilities
const archCurve = BodyParts.teeth.extractArchCurve(scanMesh);
const toothBounds = BodyParts.teeth.segmentTeeth(scanMesh);
```

---

## Example Modules

### Full Earbud Module

```typescript
import {
  defineModule,
  MeshUtils,
  Geometry,
  BodyParts,
  type ModuleInput,
  type ModuleOutput
} from '@ankrforge/module-sdk';

export default defineModule({
  id: 'forge-audio-pro',
  name: 'Forge Audio Pro',
  version: '1.0.0',
  bodyPart: 'ear',
  description: 'Professional-grade custom earbuds with acoustic optimization',

  products: [
    {
      id: 'earbuds-pro',
      name: 'Pro Custom Earbuds',
      description: 'Premium wireless earbuds with perfect fit',
      basePrice: 5999,
      currency: 'INR',
      previewImages: ['/images/earbuds-pro-1.jpg', '/images/earbuds-pro-2.jpg']
    },
    {
      id: 'ear-monitors',
      name: 'In-Ear Monitors',
      description: 'Professional IEMs for musicians',
      basePrice: 8999,
      currency: 'INR'
    },
    {
      id: 'sleep-plugs',
      name: 'Sleep Ear Plugs',
      description: 'Ultra-comfortable sleep plugs',
      basePrice: 1999,
      currency: 'INR'
    }
  ],

  customizations: [
    {
      id: 'color',
      name: 'Shell Color',
      type: 'select',
      required: true,
      default: 'black',
      options: [
        { value: 'black', label: 'Midnight Black' },
        { value: 'white', label: 'Pearl White' },
        { value: 'navy', label: 'Ocean Navy', priceModifier: 200 },
        { value: 'coral', label: 'Sunset Coral', priceModifier: 200 },
        { value: 'transparent', label: 'Crystal Clear', priceModifier: 500 }
      ]
    },
    {
      id: 'material',
      name: 'Material',
      type: 'select',
      required: true,
      default: 'silicone-soft',
      options: [
        { value: 'silicone-soft', label: 'Soft Silicone' },
        { value: 'silicone-firm', label: 'Firm Silicone' },
        { value: 'medical', label: 'Medical Grade', priceModifier: 800 }
      ]
    },
    {
      id: 'acoustic_profile',
      name: 'Sound Profile',
      type: 'select',
      default: 'balanced',
      options: [
        { value: 'balanced', label: 'Balanced' },
        { value: 'bass', label: 'Bass Boost' },
        { value: 'clarity', label: 'Vocal Clarity' },
        { value: 'flat', label: 'Studio Flat' }
      ]
    },
    {
      id: 'left_right',
      name: 'Ear Side',
      type: 'select',
      required: true,
      default: 'both',
      options: [
        { value: 'both', label: 'Both Ears' },
        { value: 'left', label: 'Left Only', priceModifier: -2000 },
        { value: 'right', label: 'Right Only', priceModifier: -2000 }
      ]
    }
  ],

  scanRequirements: {
    minQuality: 0.7,
    requiredLandmarks: ['canal_entrance', 'tragus', 'concha_floor'],
    preferredResolution: 0.1 // mm
  },

  manufacturingSpec: {
    process: 'sla',
    tolerance: 0.1,
    postProcessing: ['cure', 'polish']
  },

  async generateDesign(input: ModuleInput): Promise<ModuleOutput> {
    const { scan, measurements, customizations, productId } = input;

    // 1. Extract ear canal geometry
    const canalMesh = BodyParts.ear.extractCanal(scan.mesh);
    const conchaRegion = BodyParts.ear.extractConcha(scan.mesh);

    // 2. Create base shell from ear geometry
    let shell = MeshUtils.offset(canalMesh, -0.3); // Slight inset for comfort

    // 3. Add acoustic chamber based on profile
    const acousticChamber = createAcousticChamber(
      customizations.acoustic_profile,
      measurements
    );
    shell = MeshUtils.union(shell, acousticChamber);

    // 4. Add driver cavity
    const driverCavity = Geometry.cylinder({
      radius: 4,
      height: 3,
      position: getDriverPosition(scan.landmarks)
    });
    shell = MeshUtils.difference(shell, driverCavity);

    // 5. Add sound port
    const soundPort = Geometry.cylinder({ radius: 1, height: 5 });
    shell = MeshUtils.difference(shell, soundPort);

    // 6. Add electronics cavity for wireless components
    if (productId === 'earbuds-pro') {
      const electronicsCavity = createElectronicsCavity();
      shell = MeshUtils.union(shell, electronicsCavity);
    }

    // 7. Smooth and optimize for printing
    shell = MeshUtils.smooth(shell, { iterations: 2 });
    shell = MeshUtils.decimate(shell, { targetFaces: 50000 });

    // 8. Determine material properties
    const materialHardness = customizations.material === 'silicone-soft' ? '40A' : '60A';

    return {
      cadModel: {
        mesh: shell,
        parameters: {
          canalDepth: measurements.canal_length.value,
          conchaFit: 'snug'
        }
      },
      materials: [
        {
          type: 'silicone',
          color: customizations.color,
          hardness: materialHardness,
          grade: customizations.material === 'medical' ? 'medical' : 'standard'
        }
      ],
      printSettings: {
        process: 'sla',
        layer: 0.05,
        infill: 100,
        supports: true,
        orientation: { x: 45, y: 0, z: 0 },
        postProcessing: ['cure', 'polish']
      },
      metadata: {
        fitScore: calculateFitScore(shell, scan.mesh),
        acousticResponse: simulateAcoustics(shell, customizations.acoustic_profile)
      }
    };
  },

  calculatePrice(design, customizations) {
    let price = 5999; // Base price

    // Add customization modifiers
    if (customizations.color === 'transparent') price += 500;
    if (customizations.material === 'medical') price += 800;
    if (customizations.left_right !== 'both') price -= 2000;

    // Complexity modifier based on design
    const complexity = design.metadata?.fitScore || 1;
    price += Math.round(complexity * 200);

    return { amount: price, currency: 'INR' };
  }
});

// Helper functions
function createAcousticChamber(profile: string, measurements: any) {
  // ... acoustic chamber generation logic
}

function getDriverPosition(landmarks: any[]) {
  // ... calculate optimal driver position
}

function createElectronicsCavity() {
  // ... create cavity for battery, chip, etc.
}

function calculateFitScore(shell: any, scanMesh: any) {
  // ... calculate how well the shell fits
}

function simulateAcoustics(shell: any, profile: string) {
  // ... simulate acoustic response
}
```

### Insole Module

```typescript
import { defineModule, BodyParts, MeshUtils } from '@ankrforge/module-sdk';

export default defineModule({
  id: 'forge-foot-comfort',
  name: 'Forge Foot Comfort',
  version: '1.0.0',
  bodyPart: 'foot',

  products: [
    {
      id: 'daily-insole',
      name: 'Daily Comfort Insole',
      basePrice: 2499,
      currency: 'INR'
    },
    {
      id: 'sport-insole',
      name: 'Sport Performance Insole',
      basePrice: 3499,
      currency: 'INR'
    },
    {
      id: 'ortho-insole',
      name: 'Orthopedic Insole',
      basePrice: 4999,
      currency: 'INR'
    }
  ],

  customizations: [
    {
      id: 'arch_support',
      name: 'Arch Support Level',
      type: 'select',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'custom', label: 'AI Recommended' }
      ]
    },
    {
      id: 'cushioning',
      name: 'Cushioning',
      type: 'select',
      options: [
        { value: 'firm', label: 'Firm' },
        { value: 'balanced', label: 'Balanced' },
        { value: 'soft', label: 'Soft' }
      ]
    },
    {
      id: 'activity',
      name: 'Primary Activity',
      type: 'select',
      options: [
        { value: 'daily', label: 'Daily Walking' },
        { value: 'running', label: 'Running' },
        { value: 'standing', label: 'Standing Work' },
        { value: 'sports', label: 'Sports' }
      ]
    },
    {
      id: 'shoe_size',
      name: 'Shoe Size (EU)',
      type: 'number',
      min: 35,
      max: 48,
      required: true
    }
  ],

  manufacturingSpec: {
    process: 'fdm',
    tolerance: 0.3,
    postProcessing: ['smooth']
  },

  async generateDesign(input) {
    const { scan, measurements, customizations } = input;

    // Analyze foot structure
    const footType = BodyParts.foot.classifyFootType(measurements);
    const archProfile = BodyParts.foot.extractArchProfile(scan.mesh);
    const pressureMap = BodyParts.foot.estimatePressure(scan.mesh);

    // Determine arch support
    let archSupportLevel = customizations.arch_support;
    if (archSupportLevel === 'custom') {
      archSupportLevel = footType.recommendedSupport;
    }

    // Generate base insole from foot scan
    let insole = generateInsoleBase(scan.mesh, customizations.shoe_size);

    // Add arch support structure
    const archSupport = generateArchSupport(archProfile, archSupportLevel);
    insole = MeshUtils.union(insole, archSupport);

    // Add cushioning zones based on pressure map
    const cushionZones = generateCushionZones(pressureMap, customizations.cushioning);
    insole = MeshUtils.union(insole, cushionZones);

    // Activity-specific modifications
    if (customizations.activity === 'running') {
      insole = addHeelCup(insole, measurements);
      insole = addMetatarsalPad(insole, pressureMap);
    }

    // Material based on cushioning preference
    const materialHardness = {
      firm: '95A',
      balanced: '85A',
      soft: '75A'
    }[customizations.cushioning];

    return {
      cadModel: { mesh: insole },
      materials: [
        {
          type: 'tpu',
          hardness: materialHardness,
          color: '#333333'
        }
      ],
      printSettings: {
        process: 'fdm',
        layer: 0.2,
        infill: 30,
        pattern: 'gyroid',
        supports: false
      },
      metadata: {
        footType: footType.classification,
        archIndex: footType.archIndex,
        pressureDistribution: pressureMap.summary
      }
    };
  }
});
```

---

## Testing Your Module

### Local Testing

```bash
# Install CLI
npm install -g @ankrforge/cli

# Initialize test environment
forge init-test

# Run module with sample scan
forge test ./my-module.ts --scan ./samples/ear-scan.ply

# View generated design
forge preview ./output/design.stl
```

### Test Suite

```typescript
import { createTestHarness } from '@ankrforge/module-sdk/testing';
import MyModule from './my-module';

const harness = createTestHarness(MyModule);

describe('MyModule', () => {
  it('generates valid design from scan', async () => {
    const result = await harness.generateDesign({
      scanFile: './fixtures/ear-scan.ply',
      customizations: { color: 'black' }
    });

    expect(result.cadModel.mesh).toBeDefined();
    expect(result.cadModel.mesh.vertices.length).toBeGreaterThan(0);
  });

  it('produces watertight mesh', async () => {
    const result = await harness.generateDesign({ ... });
    const validation = harness.validateMesh(result.cadModel.mesh);

    expect(validation.isWatertight).toBe(true);
    expect(validation.hasNoSelfIntersections).toBe(true);
  });

  it('respects manufacturing tolerances', async () => {
    const result = await harness.generateDesign({ ... });

    expect(result.printSettings.layer).toBeLessThanOrEqual(0.1);
    expect(harness.checkMinimumWallThickness(result.cadModel.mesh, 0.8)).toBe(true);
  });
});
```

---

## Publishing Your Module

### 1. Validate Module
```bash
forge validate ./my-module.ts
```

### 2. Submit for Review
```bash
forge submit ./my-module.ts
```

### 3. Review Process
1. **Automated Tests**: Mesh validation, API compliance
2. **QA Review**: Design quality, manufacturability
3. **Business Review**: Pricing, market fit
4. **Approval**: Module goes live

### 4. Module Lifecycle
```
Development → Submitted → In Review → Staging → Production
                                         ↓
                                    Beta Testing
```

---

## Revenue Sharing

| Tier | Revenue Share | Requirements |
|------|---------------|--------------|
| **Standard** | 70% to developer | Basic module |
| **Premium** | 75% to developer | High quality, good reviews |
| **Partner** | 80% to developer | Exclusive, high volume |

---

## Support & Resources

- **Documentation**: https://docs.ankrforge.in/modules
- **Sample Modules**: https://github.com/ankrforge/module-examples
- **Discord**: https://discord.gg/ankrforge
- **Email**: developers@ankrforge.in

---

*Last Updated: January 2026*
*Version: 1.0*
