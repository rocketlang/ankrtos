---
title: EDIBOX-TODO_2026-02-13
category: project-plan
tags:
  - edibox
  - todo
  - baplie
  - ship-stability
  - maritime
  - edi
  - phase-1
date: '2026-02-13'
project: edibox
status: active
priority: high
---

# EDIBox Implementation Todo List
**Date**: 2026-02-13
**Project**: EDIBox - BAPLIE Viewer → Ship Stability App
**Current Phase**: Phase 1 - BAPLIE Viewer MVP (4-6 weeks)

---

## 📋 Phase 1: BAPLIE Viewer MVP

### Week 1-2: Core Setup & Backend Infrastructure

#### Project Structure Setup
- [ ] Create monorepo directories
  ```bash
  mkdir -p /root/ankr-labs-nx/packages/edibox-core/{src/{engine/parsers,types,validators},prisma,__tests__}
  mkdir -p /root/ankr-labs-nx/packages/edibox-ui/src/{components/{BayPlanViewer,StowageViewer3D,EDIEditor},hooks}
  mkdir -p /root/ankr-labs-nx/apps/edibox/backend/{src/{schema,services,loaders},prisma}
  mkdir -p /root/ankr-labs-nx/apps/edibox/frontend/src/{pages,graphql,stores}
  ```

#### Package: `@edibox/core` (Core EDI Engine)
- [ ] Copy EDI engine from `/root/src/edi/edi-engine.ts` → `packages/edibox-core/src/engine/edi-engine.ts`
- [ ] Copy EDI types from `/root/src/types/edi.ts` → `packages/edibox-core/src/types/edi.ts`
- [ ] Create `packages/edibox-core/package.json`:
  ```json
  {
    "name": "@edibox/core",
    "version": "0.1.0",
    "type": "module",
    "main": "src/index.ts",
    "dependencies": {
      "@ankr/dodd-mrp": "workspace:*",
      "uuid": "^9.0.0",
      "zod": "^3.23.0"
    }
  }
  ```
- [ ] Refactor EDI engine for standalone use (remove ankrICD dependencies)
- [ ] Add `packages/edibox-core/src/index.ts` (export all public APIs)

#### BAPLIE Parser Implementation
- [ ] Create `packages/edibox-core/src/types/maritime.ts`:
  ```typescript
  export interface BAPLIEMessage {
    id: string;
    vesselName: string;
    voyageNumber: string;
    terminal: string;
    maxBay: number;
    maxRow: number;
    maxTier: number;
    containers: ContainerPosition[];
  }

  export interface ContainerPosition {
    containerNumber: string;
    isoSize: string;
    isoType: string;
    weight: number;
    bay: number;
    row: number;
    tier: number;
    full: boolean;
  }

  export interface BayPlan {
    baplieId: string;
    maxBay: number;
    maxRow: number;
    maxTier: number;
    containers: ContainerPosition[];
  }
  ```

- [ ] Create `packages/edibox-core/src/engine/parsers/baplie-parser.ts`:
  ```typescript
  export class BAPLIEParser {
    parse(rawEDIFACT: string): BAPLIEMessage
    extractBayPlan(parsed: BAPLIEMessage): BayPlan
    validateSMDG(bayPlan: BayPlan): ValidationResult
  }
  ```

  **Key segments to parse**:
  - `UNH` - Message header
  - `BGM` - Beginning of message (document type)
  - `DTM` - Date/time/period
  - `TDT` - Transport details (vessel name, voyage)
  - `LOC+147` - Container position (bay, row, tier)
  - `EQD` - Equipment details (container number, ISO size/type)
  - `MEA` - Measurements (weight, dimensions)
  - `FTX` - Free text (remarks)
  - `UNT` - Message trailer

- [ ] Create `packages/edibox-core/src/validators/baplie-validator.ts`:
  ```typescript
  export class BAPLIEValidator {
    validateStructure(raw: string): ValidationResult
    validateSMDGRules(bayPlan: BayPlan): ValidationResult
    checkContainerOverlap(bayPlan: BayPlan): ValidationResult
  }
  ```

#### Prisma Schema Setup
- [ ] Create `packages/edibox-core/prisma/schema.prisma` (copy from plan)
- [ ] Initialize Prisma:
  ```bash
  cd packages/edibox-core
  npx prisma generate
  ```
- [ ] Create PostgreSQL database:
  ```bash
  psql -U ankr -c "CREATE DATABASE edibox;"
  ```
- [ ] Push schema to database:
  ```bash
  DATABASE_URL="postgresql://ankr:indrA@0612@localhost:5432/edibox" npx prisma db push
  ```

#### Unit Tests
- [ ] Create `packages/edibox-core/src/__tests__/baplie-parser.test.ts`:
  ```typescript
  describe('BAPLIEParser', () => {
    it('should parse valid BAPLIE message')
    it('should extract bay plan with correct positions')
    it('should validate SMDG rules')
    it('should detect container overlap')
    it('should handle invalid EDIFACT gracefully')
  })
  ```
- [ ] Add test fixtures (sample BAPLIE files from Maersk, MSC, CMA CGM)
- [ ] Configure Vitest in `packages/edibox-core/vitest.config.ts`
- [ ] Run tests: `npm test` (expect 100% pass)

---

### Week 3-4: Frontend UI Development

#### Package: `@edibox/ui` (Reusable Components)

- [ ] Create `packages/edibox-ui/package.json`:
  ```json
  {
    "name": "@edibox/ui",
    "version": "0.1.0",
    "type": "module",
    "dependencies": {
      "react": "^19.2.4",
      "react-dom": "^19.2.4",
      "@react-three/fiber": "^8.15.0",
      "@react-three/drei": "^9.96.0",
      "three": "^0.160.0",
      "d3": "^7.9.0",
      "zustand": "^5.0.0"
    }
  }
  ```

#### 2D Bay Plan Viewer (SVG)
- [ ] Create `packages/edibox-ui/src/components/BayPlanViewer/BayPlanCanvas.tsx`:
  - SVG-based rendering
  - View modes: overhead, side, end
  - Container color coding (20ft, 40ft, reefer, dangerous goods)
  - Grid lines for bays/rows/tiers
  - Hover tooltips (container number, weight, position)

- [ ] Create `packages/edibox-ui/src/components/BayPlanViewer/ContainerCell.tsx`:
  - Single container SVG rect
  - Color by size/type
  - Click handler for details

- [ ] Create `packages/edibox-ui/src/components/BayPlanViewer/BayGrid.tsx`:
  - Grid lines
  - Bay/row/tier labels

- [ ] Create `packages/edibox-ui/src/components/BayPlanViewer/ContainerLegend.tsx`:
  - Color legend (20ft, 40ft, 40ft HC, reefer, etc.)

#### 3D Stowage Viewer (React Three Fiber)
- [ ] Create `packages/edibox-ui/src/components/StowageViewer3D/Scene.tsx`:
  ```tsx
  <Canvas camera={{ position: [50, 30, 50] }}>
    <ambientLight />
    <directionalLight />
    <Vessel3D />
    {containers.map(c => <Container3D key={c.id} {...c} />)}
    <OrbitControls />
  </Canvas>
  ```

- [ ] Create `packages/edibox-ui/src/components/StowageViewer3D/Container3D.tsx`:
  - 3D box mesh (Three.js BoxGeometry)
  - Dimensions from ISO 668 (via @ankr/dodd-mrp)
  - Color by type
  - Position from bay/row/tier coordinates

- [ ] Create `packages/edibox-ui/src/components/StowageViewer3D/Vessel3D.tsx`:
  - Simplified vessel hull (box or imported GLTF)
  - Deck outline

- [ ] Optimize for performance:
  - Instanced rendering for 1000+ containers
  - Level of Detail (LOD)
  - Frustum culling

#### Hooks
- [ ] Create `packages/edibox-ui/src/hooks/useBayPlan.ts`:
  ```typescript
  export const useBayPlan = (bayPlanId: string) => {
    // Fetch bay plan from GraphQL
    // Return { loading, error, bayPlan, refetch }
  }
  ```

- [ ] Create `packages/edibox-ui/src/hooks/useEDIParsing.ts`:
  ```typescript
  export const useEDIParsing = () => {
    // Upload file, trigger parsing, poll status
    // Return { uploadBAPLIE, parseStatus, result }
  }
  ```

#### Component Tests
- [ ] Test `BayPlanCanvas` renders all containers
- [ ] Test `ContainerCell` hover/click interactions
- [ ] Test `StowageViewer3D` renders 3D scene
- [ ] Test view mode switching (overhead → side → end)

---

### Week 5-6: Backend API & Integration

#### App: `edibox/backend` (Fastify + GraphQL)

- [ ] Create `apps/edibox/backend/package.json`:
  ```json
  {
    "name": "@ankr/edibox-backend",
    "dependencies": {
      "fastify": "^4.28.0",
      "mercurius": "^14.0.0",
      "@prisma/client": "^5.22.0",
      "@edibox/core": "workspace:*",
      "@ankr/config": "workspace:*",
      "zod": "^3.23.0"
    }
  }
  ```

- [ ] Create `apps/edibox/backend/src/main.ts`:
  ```typescript
  import Fastify from 'fastify';
  import mercurius from 'mercurius';
  import { getAppPort } from '@ankr/config';

  const app = Fastify({ logger: true });
  const port = getAppPort('edibox-backend') || 4080;

  await app.register(mercurius, {
    schema: graphqlSchema,
    resolvers: graphqlResolvers,
    context: () => ({ prisma, ediService, baplieService })
  });

  app.get('/health', () => ({ status: 'ok' }));

  await app.listen({ port, host: '0.0.0.0' });
  console.log(`🚀 EDIBox API running on http://localhost:${port}/graphql`);
  ```

#### GraphQL Schema
- [ ] Create `apps/edibox/backend/src/schema/builder.ts`:
  ```typescript
  import SchemaBuilder from '@pothos/core';
  export const builder = new SchemaBuilder({});
  ```

- [ ] Create `apps/edibox/backend/src/schema/edi.schema.ts`:
  ```graphql
  type Query {
    listTransactions(filter: TransactionFilter): [EDITransaction!]!
    getTransaction(id: ID!): EDITransaction
  }

  type Mutation {
    uploadEDI(file: Upload!, type: EDITransactionType!): EDITransaction!
  }
  ```

- [ ] Create `apps/edibox/backend/src/schema/baplie.schema.ts`:
  ```graphql
  type Query {
    getBayPlan(transactionId: ID!): BayPlan
    listBayPlans(limit: Int, offset: Int): [BayPlan!]!
  }

  type Mutation {
    uploadBAPLIE(file: Upload!): BAPLIEUploadResult!
    parseBAPLIE(transactionId: ID!): BAPLIEMessage!
  }

  type BAPLIEUploadResult {
    transactionId: ID!
    status: String!
    bayPlan: BayPlan
  }
  ```

#### Services Layer
- [ ] Create `apps/edibox/backend/src/services/edi-service.ts`:
  ```typescript
  export class EDIService {
    constructor(private prisma: PrismaClient) {}

    async processInbound(file: File, type: EDITransactionType)
    async getTransaction(id: string)
    async listTransactions(filter: TransactionFilter)
  }
  ```

- [ ] Create `apps/edibox/backend/src/services/baplie-service.ts`:
  ```typescript
  import { BAPLIEParser } from '@edibox/core';

  export class BAPLIEService {
    constructor(
      private prisma: PrismaClient,
      private parser: BAPLIEParser
    ) {}

    async parse(transactionId: string): Promise<BAPLIEMessage>
    async getBayPlan(transactionId: string): Promise<BayPlan>
    async saveBayPlan(bayPlan: BayPlan): Promise<void>
  }
  ```

#### App: `edibox/frontend` (React + Vite)

- [ ] Initialize Vite app:
  ```bash
  cd apps/edibox
  npm create vite@latest frontend -- --template react-ts
  cd frontend
  ```

- [ ] Install dependencies:
  ```bash
  npm install @apollo/client @react-three/fiber @react-three/drei three d3 zustand tailwindcss @edibox/ui
  ```

- [ ] Create `apps/edibox/frontend/src/graphql/client.ts`:
  ```typescript
  import { ApolloClient, InMemoryCache } from '@apollo/client';
  import { getBackendUrl } from '@ankr/config';

  export const client = new ApolloClient({
    uri: getBackendUrl('edibox', '/graphql'),
    cache: new InMemoryCache()
  });
  ```

- [ ] Create GraphQL queries/mutations:
  ```typescript
  // src/graphql/queries.ts
  export const GET_BAY_PLAN = gql`
    query GetBayPlan($transactionId: ID!) {
      getBayPlan(transactionId: $transactionId) {
        baplieId
        maxBay
        maxRow
        maxTier
        containers { ... }
      }
    }
  `;

  // src/graphql/mutations.ts
  export const UPLOAD_BAPLIE = gql`
    mutation UploadBAPLIE($file: Upload!) {
      uploadBAPLIE(file: $file) {
        transactionId
        status
        bayPlan { ... }
      }
    }
  `;
  ```

#### Pages
- [ ] Create `apps/edibox/frontend/src/pages/Dashboard.tsx`:
  - Landing page
  - Recent transactions list
  - Upload button

- [ ] Create `apps/edibox/frontend/src/pages/BaplieViewer.tsx`:
  ```tsx
  export const BaplieViewer = () => {
    const [uploadBAPLIE] = useMutation(UPLOAD_BAPLIE);
    const [bayPlan, setBayPlan] = useState<BayPlan | null>(null);
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

    const handleUpload = async (file: File) => {
      const { data } = await uploadBAPLIE({ variables: { file } });
      setBayPlan(data.uploadBAPLIE.bayPlan);
    };

    return (
      <div>
        <FileUpload onUpload={handleUpload} />
        <ViewToggle mode={viewMode} onChange={setViewMode} />

        {bayPlan && viewMode === '2d' && <BayPlanCanvas bayPlan={bayPlan} />}
        {bayPlan && viewMode === '3d' && <StowageViewer3D bayPlan={bayPlan} />}

        <ExportButton bayPlan={bayPlan} format="pdf" />
      </div>
    );
  };
  ```

- [ ] Create `apps/edibox/frontend/src/pages/EDITransactions.tsx`:
  - List of all EDI transactions
  - Filter by type, status, date
  - Click to view details

#### State Management (Zustand)
- [ ] Create `apps/edibox/frontend/src/stores/edi-store.ts`:
  ```typescript
  export const useEDIStore = create<EDIStore>((set) => ({
    transactions: [],
    currentTransaction: null,
    setCurrentTransaction: (tx) => set({ currentTransaction: tx })
  }));
  ```

- [ ] Create `apps/edibox/frontend/src/stores/bayplan-store.ts`:
  ```typescript
  export const useBayPlanStore = create<BayPlanStore>((set) => ({
    bayPlan: null,
    viewMode: '2d',
    selectedContainer: null,
    setBayPlan: (bp) => set({ bayPlan: bp }),
    setViewMode: (mode) => set({ viewMode: mode })
  }));
  ```

#### Service Registration
- [ ] Add to `/root/.ankr/config/services.json`:
  ```json
  {
    "edibox-backend": {
      "portPath": "backend.edibox",
      "path": "/root/ankr-labs-nx/apps/edibox/backend",
      "command": "npx tsx src/main.ts",
      "description": "EDIBox Backend API (BAPLIE + Stability)",
      "healthEndpoint": "/health",
      "enabled": true,
      "env": {
        "DATABASE_URL": "postgresql://ankr:indrA@0612@localhost:5432/edibox"
      }
    },
    "edibox-frontend": {
      "portPath": "frontend.edibox",
      "path": "/root/ankr-labs-nx/apps/edibox/frontend",
      "command": "npm run dev",
      "description": "EDIBox Frontend (React + Vite)",
      "enabled": true
    }
  }
  ```

- [ ] Add to `/root/.ankr/config/ports.json`:
  ```json
  {
    "backend": {
      "edibox": 4080
    },
    "frontend": {
      "edibox": 3080
    }
  }
  ```

#### Deployment & Testing
- [ ] Start backend:
  ```bash
  ankr-ctl start edibox-backend
  ```
- [ ] Start frontend:
  ```bash
  ankr-ctl start edibox-frontend
  ```
- [ ] Health check:
  ```bash
  curl http://localhost:4080/health
  ```
- [ ] Open browser: http://localhost:3080
- [ ] Upload sample BAPLIE file
- [ ] Verify 2D bay plan renders correctly
- [ ] Switch to 3D view
- [ ] Export to PDF

#### E2E Tests (Playwright)
- [ ] Create `apps/edibox/e2e/baplie-viewer.spec.ts`:
  ```typescript
  test('BAPLIE upload and visualization', async ({ page }) => {
    await page.goto('http://localhost:3080');

    // Upload BAPLIE
    await page.setInputFiles('input[type="file"]', 'fixtures/baplie-maersk.edi');

    // Wait for parsing
    await page.waitForSelector('[data-testid="bay-plan-canvas"]');

    // Verify container count
    const containers = await page.locator('.container-cell').count();
    expect(containers).toBeGreaterThan(100);

    // Switch to 3D
    await page.click('[data-testid="view-3d"]');
    await page.waitForSelector('canvas');

    // Export PDF
    await page.click('[data-testid="export-pdf"]');
  });
  ```

---

## 📊 Phase 1 Completion Criteria

### Functionality
- [x] Parse BAPLIE from Maersk, MSC, CMA CGM (>95% success rate)
- [x] Render 1000+ container bay plans in <2s
- [x] 2D/3D view switching works smoothly
- [x] Export bay plan to PDF
- [x] Health check endpoint responds

### Code Quality
- [x] All unit tests pass (100%)
- [x] E2E tests pass
- [x] TypeScript strict mode (no errors)
- [x] ESLint passes
- [x] Code coverage >80%

### Documentation
- [x] API documentation (GraphQL schema)
- [x] README with setup instructions
- [x] Component documentation (Storybook optional)

### Deployment
- [x] Services registered in ankr-ctl
- [x] Ports configured in ports.json
- [x] Database initialized
- [x] PM2 process running stable

---

## 🚀 Phase 2: Full EDIBox Platform (Backlog)

### EDI Format Expansion
- [ ] Add COPARN parser (container pre-announcement)
- [ ] Add IFTDGN parser (dangerous goods declaration)
- [ ] Add X12 parsers (850, 856, ORDERS, INVOIC)
- [ ] EDI validation engine (SMDG rules)
- [ ] EDI generation (BayPlan → BAPLIE EDIFACT)

### Platform Features
- [ ] Trading partner management UI
- [ ] EDI transaction history
- [ ] Validation rule configurator
- [ ] Field mapping UI
- [ ] Multi-tenancy (organizations, users)
- [ ] Authentication (OAuth via @ankr/oauth)
- [ ] RBAC (via @ankr/iam)

### Integrations
- [ ] SFTP transport
- [ ] AS2 transport
- [ ] HTTP webhook support
- [ ] Email integration

---

## ⚓ Phase 3: Ship Stability App (Future)

### Stability Calculations
- [ ] Package: `@edibox/stability`
- [ ] GM calculator (metacentric height)
- [ ] Trim calculator (longitudinal stability)
- [ ] List calculator (transverse stability)
- [ ] Shear force calculator
- [ ] Bending moment calculator
- [ ] IMO compliance validator

### Database & Models
- [ ] Hydrostatic curves database (100+ vessel types)
- [ ] Vessel geometry modeler
- [ ] Buoyancy calculator
- [ ] Tank soundings integration

### UI Components
- [ ] Stability dashboard (GM gauge, trim indicator)
- [ ] Shear force diagram
- [ ] Bending moment curve
- [ ] Load planning wizard
- [ ] Cargo surveyor checklist

### Advanced Features
- [ ] AI load plan optimizer (via @ankr/ai-router)
- [ ] Real-time stability monitoring (WebSocket)
- [ ] What-if analysis (add/remove containers)
- [ ] AIS integration (real-time vessel position)
- [ ] Export to Navis format

---

## 📝 Notes & References

### Sample BAPLIE Sources
- Maersk: https://www.maersk.com/edi-standards
- MSC: https://www.msc.com/edi
- CMA CGM: https://www.cma-cgm.com/edi

### Standards Documentation
- SMDG BAPLIE: https://smdg.org/documents/smdg-recommendations/
- IMO Stability: IMO Resolution MSC.267(85)
- ISO 668: ISO 668:2020 (Container dimensions)
- ISO 6346: ISO 6346:2022 (Container codes)

### Related ANKR Files
- EDI Engine: `/root/src/edi/edi-engine.ts`
- EDI Types: `/root/src/types/edi.ts`
- ISO Standards: `/root/ankr-labs-nx/packages/dodd/packages/dodd-mrp/src/profiles/container/iso-standards.ts`
- Maritime Schema: `/root/apps/ankr-maritime/backend/prisma/schema.prisma`
- FreightBox Schema: `/root/ankr-labs-nx/apps/freightbox/backend/prisma/schema.prisma`

---

**Last Updated**: 2026-02-13
**Status**: 🔵 Phase 1 Ready to Start
**Next Milestone**: Week 1-2 Core Setup (Due: 2026-02-27)
