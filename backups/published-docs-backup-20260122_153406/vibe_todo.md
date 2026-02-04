# Vibecoding Tools - TODO

## Overview
Transform @ankr/vibecoding-tools from a basic 10-tool package to an enterprise-grade 35-tool suite fully integrated with the ANKR ecosystem.

---

## Phase 1: ANKR Integration (Priority: P0) - COMPLETED

### Completed: 18th January 2026

- [x] **Add ankr5 to PATH**
  - Created symlink: `/usr/local/bin/ankr5` -> `/root/ankr-labs-nx/.ankr/cli/bin/ankr5`
  - Verified: `which ankr5` returns `/usr/local/bin/ankr5`

- [x] **Create `src/integrations/ankr5.ts`** (Already existed, comprehensive)
  - `getServicePort(service)` - Dynamic port lookup
  - `getServiceUrl(service)` - URL construction
  - `getGatewayStatus()` - Service health check
  - `buildContext(query, cwd)` - RAG context building
  - `rememberGeneration(data)` - EON memory storage
  - `recallGenerations(query)` - EON memory recall
  - `getAICompletion(prompt)` - AI completions
  - `callMCPTool(name, input)` - MCP tool invocation
  - `getSmartContext(options)` - High-level context aggregation

- [x] **Create `src/integrations/config.ts`** (NEW)
  - `getPort(service, category)` - Port lookup with @ankr/config fallback
  - `getUrl(service, path)` - URL construction
  - `getGraphQLUrl(service)` - GraphQL endpoint URLs
  - `getWsUrl(service)` - WebSocket URLs
  - `getAllPorts()` - All port configuration
  - `findAvailablePort(start)` - Next available port
  - `getConfigStatus()` - Configuration diagnostics

- [x] **Update `package.json`**
  - Version bumped to 1.2.0
  - Added `@ankr/config` as optional dependency
  - Added peer dependencies: `@ankr/ai-router`, `@ankr/eon`
  - Added `check` script for TypeScript validation

- [x] **Fix hardcoded port in `scaffold.ts`**
  - Already used dynamic ports via `getNextAvailablePort(4100)`
  - Port 3000 is only fallback when ankr5 unavailable
  - Scaffold result shows "Port auto-assigned via ankr5"

---

## Phase 2: AI-Powered Generation (Priority: P1)

### Week 2 Tasks

- [ ] **Create `src/integrations/rag.ts`**
  - `buildCodeContext(query, cwd)` - Use ankr5 context build
  - `findSimilarPatterns(code)` - Search codebase for patterns

- [ ] **Create `src/integrations/eon.ts`**
  - `rememberGeneration(input, output)` - Store generation history
  - `recallSimilarGenerations(context)` - Retrieve past generations

- [ ] **Create `src/tools/smart-generate.ts`**
  - `smart_scaffold` - AI-powered scaffolding with RAG
  - `smart_component` - Context-aware component generation
  - `smart_api` - Pattern-learning API generation
  - `smart_refactor` - Codebase-aware refactoring

---

## Phase 3: Enterprise Templates (Priority: P1)

### Week 3 Tasks

- [ ] **Create enterprise project templates**
  | Template | Features |
  |----------|----------|
  | `enterprise-api` | Auth, RBAC, logging, metrics, OpenAPI |
  | `enterprise-frontend` | Auth flow, error boundaries, i18n |
  | `enterprise-fullstack` | Shared types, monorepo structure |
  | `microservice` | Docker, K8s, service mesh |

- [ ] **Add 8 new enterprise tools**
  - `generate_auth_flow`
  - `generate_api_docs`
  - `generate_docker`
  - `generate_ci_pipeline`
  - `generate_k8s_manifests`
  - `generate_error_handling`
  - `generate_logging`
  - `generate_tests`

- [ ] **Integrate @ankr/oauth**
  - Support 9 OAuth providers
  - RBAC templates
  - MFA configuration

- [ ] **Integrate @ankr/pulse**
  - Metrics endpoints
  - Health check templates
  - Tracing setup

---

## Phase 4: Validation & Quality (Priority: P2)

### Week 4 Tasks

- [ ] **Create `src/validation/` module**
  - `typescript.ts` - tsc --noEmit validation
  - `eslint.ts` - ESLint check
  - `security.ts` - Basic security scan
  - `imports.ts` - Import resolution check

- [ ] **Create `src/tools/generate-tests.ts`**
  - Auto-generate unit tests for components
  - Auto-generate integration tests for APIs

- [ ] **Add quality metrics tracking**
  ```typescript
  interface GenerationMetrics {
    syntaxValid: boolean;
    typesValid: boolean;
    testsPass: boolean;
    securityIssues: number;
    codeQualityScore: number;
  }
  ```

---

## Phase 5: MCP Orchestration (Priority: P2)

### Week 5 Tasks

- [ ] **Create MCP orchestration layer**
  - Call multiple MCP tools in sequence
  - Aggregate results for complex generations

- [ ] **Add domain-specific generators**
  | Domain | Tools |
  |--------|-------|
  | Logistics | `generate_shipment_ui`, `generate_tracking_api` |
  | Compliance | `generate_gst_form`, `generate_invoice_template` |
  | CRM | `generate_lead_form`, `generate_contact_ui` |
  | ERP | `generate_inventory_ui`, `generate_order_flow` |

- [ ] **Integrate with 255+ existing MCP tools**
  - Use `ankr5 mcp call` for tool invocation
  - Build context from tool results

---

## Quick Wins - COMPLETED

1. ~~**Add ankr5 to PATH**~~ - DONE
2. ~~**Fix hardcoded port**~~ - Already dynamic
3. ~~**Update package.json**~~ - DONE (v1.2.0)

---

## Progress Tracker

| Phase | Status | Tools | Completion |
|-------|--------|-------|------------|
| Current State | Done | 11 | 100% |
| Phase 1 - ANKR Integration | **COMPLETE** | +0 (integrated) | 100% |
| Phase 2 - AI-Powered | Not Started | +4 | 0% |
| Phase 3 - Enterprise | Not Started | +8 | 0% |
| Phase 4 - Validation | Not Started | +3 | 0% |
| Phase 5 - MCP | Not Started | +8 | 0% |
| **Total** | | **35** | **34%** |

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @ankr/config | workspace:* | Port configuration |
| @ankr/ai-router | >=2.0.0 | AI completions |
| @ankr/eon | >=3.0.0 | Memory system |
| @modelcontextprotocol/sdk | ^1.0.0 | MCP protocol |

---

## Testing Checklist

- [x] `pnpm build` succeeds (v1.2.0)
- [x] `ankr5` in PATH and available
- [x] `scaffold_project` uses dynamic ports (4100 via ankr5)
- [ ] `ankr5 doctor` shows all services healthy
- [ ] Generated code passes TypeScript check
- [ ] Generated tests pass

---

## Related Documents

- [ENTERPRISE-UPGRADE-PLAN.md](./ENTERPRISE-UPGRADE-PLAN.md) - Full upgrade plan
- [ANKR5-INTEGRATION-GAPS.md](./ANKR5-INTEGRATION-GAPS.md) - Gap analysis
- [ANKRCODE-ECOSYSTEM.md](/root/ankrcode-project/ANKRCODE-ECOSYSTEM.md) - Ecosystem overview
- [AICODE-VIBECODE-DISCOVERY-18JAN2026.md](/root/AICODE-VIBECODE-DISCOVERY-18JAN2026.md) - Discovery document

---

*Created: 2026-01-17*
*Updated: 2026-01-18*
*Owner: ANKR Labs*
*Status: Phase 1 Complete - Proceeding to Phase 2*
