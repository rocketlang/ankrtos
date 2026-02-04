# Vibecoding Tools - Enterprise Upgrade Plan

## Current State Analysis

### What Exists (v1.0.0)
| Component | Status | Notes |
|-----------|--------|-------|
| Vibe Analysis (3 tools) | Basic | vibe_analyze, vibe_score, vibe_compare |
| Code Generation (3 tools) | Basic | generate_component, generate_hook, generate_util |
| API Generation (2 tools) | Basic | generate_api_route, generate_crud_routes |
| Scaffolding (2 tools) | Basic | scaffold_project, scaffold_module |
| **Total Tools** | **10** | Functional but not enterprise-ready |

### Critical Gaps Identified

| Gap | Impact | Priority |
|-----|--------|----------|
| No ankr5 integration | Hardcoded ports (3000), no service discovery | P0 |
| No @ankr/config usage | Can't use ANKR port configuration | P0 |
| No RAG/Context | Scaffolds don't use existing codebase patterns | P1 |
| No EON memory | Can't learn from previous generations | P1 |
| No MCP orchestration | Doesn't leverage 255+ existing tools | P1 |
| No testing/validation | Generated code isn't validated | P2 |
| No enterprise patterns | Missing auth, logging, error handling | P2 |
| No CI/CD templates | No GitHub Actions, Docker support | P3 |

---

## Phase 1: ANKR Integration (Week 1)

### 1.1 Add ankr5 CLI Integration
```typescript
// NEW: src/integrations/ankr5.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getServicePort(service: string): Promise<number> {
  const { stdout } = await execAsync(`ankr5 ports get ${service}`);
  return parseInt(stdout.trim());
}

export async function getServiceUrl(service: string, path = ''): Promise<string> {
  const { stdout } = await execAsync(`ankr5 ports url ${service}`);
  return stdout.trim() + path;
}

export async function checkGatewayStatus(): Promise<Record<string, boolean>> {
  const { stdout } = await execAsync('ankr5 gateway status --json');
  return JSON.parse(stdout);
}
```

### 1.2 Add @ankr/config Integration
```typescript
// NEW: src/integrations/config.ts
import { PORTS, getBackendUrl, getAppPort } from '@ankr/config';

export function getPortConfig(service: string): number {
  return PORTS.backend[service] || PORTS.ai[service] || 3000;
}

export function getUrl(service: string, path = ''): string {
  return getBackendUrl(service, path);
}
```

### 1.3 Update package.json Dependencies
```json
{
  "dependencies": {
    "@ankr/config": "workspace:*",
    "@modelcontextprotocol/sdk": "^1.0.0"
  },
  "peerDependencies": {
    "@ankr/ai-router": ">=2.0.0",
    "@ankr/eon": ">=3.0.0"
  }
}
```

### 1.4 Update Scaffold to Use Dynamic Ports
```typescript
// scaffold.ts - Replace hardcoded port 3000
const port = await getServicePort(projectName) || 3000;
```

**Deliverables:**
- [ ] `src/integrations/ankr5.ts`
- [ ] `src/integrations/config.ts`
- [ ] Updated `scaffold.ts` with dynamic ports
- [ ] Updated `package.json`

---

## Phase 2: AI-Powered Generation (Week 2)

### 2.1 RAG Context Integration
```typescript
// NEW: src/integrations/rag.ts
export async function buildCodeContext(query: string, cwd: string): Promise<string> {
  // Use ankr5 context build
  const { stdout } = await execAsync(`ankr5 context build "${query}" --cwd ${cwd}`);
  return stdout;
}

export async function findSimilarPatterns(code: string): Promise<Pattern[]> {
  // Search existing codebase for similar patterns
  const context = await buildCodeContext(`similar code patterns: ${code.slice(0, 200)}`);
  return parsePatterns(context);
}
```

### 2.2 EON Memory Integration
```typescript
// NEW: src/integrations/eon.ts
export async function rememberGeneration(input: GenerationInput, output: GeneratedCode): Promise<void> {
  await execAsync(`ankr5 eon remember "${JSON.stringify({
    type: 'code_generation',
    input,
    output,
    timestamp: new Date().toISOString()
  })}"`);
}

export async function recallSimilarGenerations(context: string): Promise<Generation[]> {
  const { stdout } = await execAsync(`ankr5 eon search "code generation ${context}" --limit 5`);
  return JSON.parse(stdout);
}
```

### 2.3 Smart Generation with AI
```typescript
// NEW: src/tools/smart-generate.ts
export const smartGenerateTools: MCPTool[] = [
  {
    name: 'smart_scaffold',
    description: 'AI-powered scaffolding that learns from existing codebase patterns',
    handler: async (input) => {
      // 1. Build RAG context from existing code
      const context = await buildCodeContext(input.description, input.cwd);

      // 2. Recall similar generations
      const similar = await recallSimilarGenerations(input.type);

      // 3. Generate with AI using context
      const result = await aiGenerate({
        prompt: buildPrompt(input, context, similar),
        model: 'claude-3-sonnet',
      });

      // 4. Remember this generation
      await rememberGeneration(input, result);

      return result;
    }
  }
];
```

**Deliverables:**
- [ ] `src/integrations/rag.ts`
- [ ] `src/integrations/eon.ts`
- [ ] `src/tools/smart-generate.ts`
- [ ] Updated handlers to use AI context

---

## Phase 3: Enterprise Patterns (Week 3)

### 3.1 Enterprise Project Templates

| Template | Includes |
|----------|----------|
| `enterprise-api` | Auth, RBAC, logging, metrics, health checks, OpenAPI |
| `enterprise-frontend` | Auth flow, error boundaries, analytics, i18n |
| `enterprise-fullstack` | Both + shared types, monorepo structure |
| `microservice` | Docker, K8s manifests, service mesh ready |

### 3.2 Authentication Integration
```typescript
// Templates for @ankr/oauth integration
const authTemplate = {
  providers: ['google', 'github', 'microsoft'],
  rbac: true,
  mfa: 'optional',
};
```

### 3.3 Observability Integration
```typescript
// Templates for @ankr/pulse integration
const observabilityTemplate = {
  metrics: true,
  tracing: true,
  healthEndpoints: ['/health', '/ready', '/live'],
};
```

### 3.4 New Enterprise Tools

| Tool | Purpose |
|------|---------|
| `generate_auth_flow` | Complete OAuth + session flow |
| `generate_api_docs` | OpenAPI spec from code |
| `generate_docker` | Dockerfile + docker-compose |
| `generate_ci_pipeline` | GitHub Actions / GitLab CI |
| `generate_k8s_manifests` | Deployment, Service, Ingress |
| `generate_error_handling` | Error boundaries, handlers |
| `generate_logging` | Structured logging setup |
| `generate_tests` | Unit + Integration tests |

**Deliverables:**
- [ ] Enterprise template system
- [ ] 8 new enterprise tools
- [ ] Auth/Observability integration templates

---

## Phase 4: Validation & Quality (Week 4)

### 4.1 Generated Code Validation
```typescript
// NEW: src/validation/index.ts
export async function validateGenerated(code: GeneratedFile[]): Promise<ValidationResult> {
  const results = await Promise.all([
    validateTypeScript(code),    // tsc --noEmit
    validateESLint(code),        // eslint check
    validateSecurity(code),      // basic security scan
    validateImports(code),       // check imports resolve
  ]);
  return mergeResults(results);
}
```

### 4.2 Test Generation
```typescript
// Auto-generate tests for generated code
export async function generateTests(code: GeneratedFile[]): Promise<GeneratedFile[]> {
  return code.map(file => ({
    path: file.path.replace('.ts', '.test.ts'),
    content: generateTestFor(file),
  }));
}
```

### 4.3 Quality Metrics
```typescript
// Track generation quality over time
export interface GenerationMetrics {
  syntaxValid: boolean;
  typesValid: boolean;
  testsPass: boolean;
  securityIssues: number;
  codeQualityScore: number;
}
```

**Deliverables:**
- [ ] `src/validation/typescript.ts`
- [ ] `src/validation/eslint.ts`
- [ ] `src/validation/security.ts`
- [ ] `src/tools/generate-tests.ts`
- [ ] Quality metrics tracking

---

## Phase 5: MCP Orchestration (Week 5)

### 5.1 Leverage Existing MCP Tools
```typescript
// Orchestrate 255+ tools for complex generations
export async function orchestratedGeneration(input: ComplexInput): Promise<Result> {
  // Use ankr5 mcp call to leverage existing tools
  const steps = [
    { tool: 'gst_validate', input: input.gstNumber },  // Validate GST if needed
    { tool: 'eon_recall', input: input.context },       // Get memory context
    { tool: 'shipment_track', input: input.trackingId }, // Get logistics context
  ];

  const context = await Promise.all(steps.map(s => callMCPTool(s.tool, s.input)));
  return generateWithContext(input, context);
}
```

### 5.2 Domain-Specific Generators

| Domain | Tools |
|--------|-------|
| Logistics | `generate_shipment_ui`, `generate_tracking_api` |
| Compliance | `generate_gst_form`, `generate_invoice_template` |
| CRM | `generate_lead_form`, `generate_contact_ui` |
| ERP | `generate_inventory_ui`, `generate_order_flow` |

**Deliverables:**
- [ ] MCP tool orchestration layer
- [ ] 8 domain-specific generators
- [ ] Integration with 255+ existing tools

---

## Tool Count Progression

| Phase | New Tools | Total |
|-------|-----------|-------|
| Current | - | 10 |
| Phase 1 (ANKR Integration) | 2 | 12 |
| Phase 2 (AI-Powered) | 4 | 16 |
| Phase 3 (Enterprise) | 8 | 24 |
| Phase 4 (Validation) | 3 | 27 |
| Phase 5 (MCP) | 8 | **35** |

---

## Architecture After Upgrade

```
┌─────────────────────────────────────────────────────────────┐
│                  @ankr/vibecoding-tools v2.0                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Smart       │  │ Enterprise  │  │ Domain-Specific     │  │
│  │ Generation  │  │ Templates   │  │ Generators          │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│  ┌──────┴────────────────┴─────────────────────┴──────────┐  │
│  │                   Integrations Layer                   │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────────┐  │  │
│  │  │ ankr5  │ │ @ankr/ │ │  EON   │ │ RAG/Context    │  │  │
│  │  │  CLI   │ │ config │ │ Memory │ │ Building       │  │  │
│  │  └────────┘ └────────┘ └────────┘ └────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                  Validation Layer                      │  │
│  │  TypeScript │ ESLint │ Security │ Tests │ Metrics     │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              MCP Orchestration (255+ tools)            │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   AI-Proxy (:4444)            │
              │   EON Memory (:4005)          │
              │   ANKR Services               │
              └───────────────────────────────┘
```

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Tools | 10 | 35 |
| ANKR Integration | 0% | 100% |
| AI-Powered Generation | No | Yes |
| Enterprise Templates | 0 | 4 |
| Validation | None | Full |
| EON Memory | No | Yes |
| RAG Context | No | Yes |
| Test Coverage | 0% | 80% |

---

## Timeline

```
Week 1: ANKR Integration (ankr5 + @ankr/config)
Week 2: AI-Powered Generation (RAG + EON)
Week 3: Enterprise Patterns (Templates + Auth + Observability)
Week 4: Validation & Quality
Week 5: MCP Orchestration
```

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| ankr5 not in PATH | High | Add path detection, fallback to @ankr/config |
| AI-Proxy unavailable | Medium | Graceful degradation to static templates |
| EON memory full | Low | Implement pruning, pagination |
| Generated code bugs | Medium | Mandatory validation before output |

---

## Next Steps

1. **Immediate**: Add ankr5 to PATH or create symlink
2. **This Week**: Phase 1 - ANKR Integration
3. **Review**: After each phase, run doctor and validate

---

*Created: 2026-01-17*
*Author: ANKR Labs*
*Version: Draft 1.0*
