# Command Center - Intelligent Integration Strategy

**Challenge**: ankr-universe has 1M+ LOC, 270+ tools, 111 packages
**Solution**: Smart mapping + priority-based integration

---

## Discovery Summary

From exploration agent (agentId: a9a55f5):

```
✅ 270+ MCP Tools (14 categories)
✅ 111 @ankr/* packages
✅ 25+ running services on known ports
✅ Standardized tool registry
✅ Clear invocation patterns
```

---

## Intelligent Mapping: Command Center → ankr-universe

### Level 1: Direct Tool Invocation (HIGHEST PRIORITY)

**Pattern**: Command Center task → Single MCP tool call

| Task Type | MCP Tool | Category | Invocation |
|-----------|---------|----------|------------|
| "Verify GST" | `gst_verify` | Compliance | `registry.get('gst_verify').handler()` |
| "Create invoice" | `invoice_create` | ERP | `registry.get('invoice_create').handler()` |
| "Track shipment" | `shipment_track` | Logistics | `registry.get('shipment_track').handler()` |
| "Add contact" | `contact_create` | CRM | `registry.get('contact_create').handler()` |
| "Calculate EMI" | `emi_calculator` | Finance | `registry.get('emi_calculator').handler()` |

**Implementation**:
```typescript
// Simple executor that maps to MCP tools
class MCPToolExecutor extends BaseExecutor {
  private registry = getToolRegistry(); // From @ankr/mcp

  async execute(task: Task) {
    const toolName = this.mapTaskToTool(task);
    const tool = this.registry.get(toolName);
    return await tool.handler(task.input);
  }
}
```

---

### Level 2: Orchestrated Workflows (MEDIUM PRIORITY)

**Pattern**: Command Center task → Pipeline of MCP tools

| Task Type | Pipeline | Tools Used |
|-----------|---------|------------|
| "Create GST invoice" | GST Invoice Workflow | `gst_verify` → `invoice_create` → `einvoice_generate` |
| "Onboard customer" | CRM Onboarding | `contact_create` → `lead_create` → `opportunity_create` |
| "Book shipment" | Logistics Booking | `route_optimize` → `cost_estimate` → `shipment_create` |

**Implementation**:
```typescript
import { orchestrate } from '@ankr/mcp/orchestration';

class WorkflowExecutor extends BaseExecutor {
  async execute(task: Task) {
    const workflowName = this.mapTaskToWorkflow(task);
    return await orchestrate(workflowName, task.input);
  }
}
```

---

### Level 3: Package Integration (CODE GENERATION)

**Pattern**: Command Center task → Use @ankr/* package

| Task Type | Package | Usage |
|-----------|---------|-------|
| "Generate Prisma schema" | `@ankr/backend-generator` | Domain generation |
| "Add OAuth login" | `@ankr/oauth` | 9-provider auth |
| "Setup compliance" | `@ankr/compliance-engine` | GST/TDS automation |
| "Add voice commands" | `@ankr/voice-ai` | Hindi/multilingual |
| "Track memory" | `@ankr/eon` | Episodic memory |

**Implementation**:
```typescript
import { BackendGenerator } from '@ankr/backend-generator';

class PackageExecutor extends BaseExecutor {
  async execute(task: Task) {
    const packageName = this.selectPackage(task);
    const pkg = await import(packageName);
    return await pkg.execute(task.input);
  }
}
```

---

### Level 4: Service Calls (BACKEND INTEGRATION)

**Pattern**: Command Center task → GraphQL/REST service

| Task Type | Service | Port | Endpoint |
|-----------|---------|------|----------|
| "Get shipment status" | WowTruck TMS | 4000 | `/graphql` |
| "Create CRM lead" | CRM Backend | 4010 | `/graphql` |
| "Run compliance check" | Compliance API | 4001 | `/graphql` |
| "Store memory" | EON | 4005 | `/graphql` |

**Implementation**:
```typescript
import { getPort, getUrl } from '@ankr/ports';

class ServiceExecutor extends BaseExecutor {
  async execute(task: Task) {
    const service = this.mapTaskToService(task);
    const url = getUrl('backend', service, '/graphql');

    return await axios.post(url, {
      query: task.graphqlQuery,
      variables: task.input
    });
  }
}
```

---

## Smart Executor Architecture

```typescript
/**
 * Intelligent executor that routes to the right integration level
 */
class SmartExecutor extends BaseExecutor {
  async execute(task: Task) {
    // Level 1: Check if direct MCP tool exists
    const toolName = this.findMCPTool(task);
    if (toolName) {
      return await this.invokeMCPTool(toolName, task.input);
    }

    // Level 2: Check if workflow exists
    const workflow = this.findWorkflow(task);
    if (workflow) {
      return await this.invokeWorkflow(workflow, task.input);
    }

    // Level 3: Check if package can handle it
    const package = this.findPackage(task);
    if (package) {
      return await this.invokePackage(package, task.input);
    }

    // Level 4: Call service directly
    const service = this.findService(task);
    if (service) {
      return await this.invokeService(service, task.input);
    }

    // Fallback: Use AI to generate code
    return await this.generateCode(task);
  }
}
```

---

## Priority Integration Matrix

### Phase 3A (Week 1) - Core Tools
**Goal**: 80% of common tasks work end-to-end

| Priority | Capability | Integration Level | Effort | Impact |
|----------|-----------|------------------|--------|--------|
| **P0** | MCP Tool Registry | Level 1 | 2 days | HIGH |
| **P0** | Workflow Orchestration | Level 2 | 2 days | HIGH |
| **P0** | Port/URL Resolution | All levels | 1 day | HIGH |
| **P1** | Backend Generator | Level 3 | 2 days | MEDIUM |
| **P1** | PM2 Deployment | Level 4 | 1 day | MEDIUM |

### Phase 3B (Week 2) - Advanced Capabilities
**Goal**: Support complex multi-step tasks

| Priority | Capability | Integration Level | Effort | Impact |
|----------|-----------|------------------|--------|--------|
| **P1** | EON Memory | Level 4 | 2 days | MEDIUM |
| **P1** | Voice AI | Level 3 | 2 days | MEDIUM |
| **P2** | Compliance Engine | Level 3 | 1 day | LOW |
| **P2** | GraphQL Federation | Level 4 | 2 days | LOW |

### Phase 3C (Week 3) - Polish
**Goal**: Production-ready, error handling, monitoring

| Priority | Task | Effort |
|----------|------|--------|
| **P0** | Error recovery & retry | 2 days |
| **P0** | Health checks | 1 day |
| **P1** | Cost tracking | 1 day |
| **P1** | Performance optimization | 2 days |
| **P2** | Documentation | 1 day |

---

## Implementation: SmartExecutor

**File**: `apps/command-center-backend/src/executors/SmartExecutor.ts`

```typescript
import { getToolRegistry } from '@ankr/mcp';
import { orchestrate } from '@ankr/mcp/orchestration';
import { getPort, getUrl } from '@ankr/ports';
import axios from 'axios';

export class SmartExecutor extends BaseExecutor {
  name = 'smart';
  private registry = getToolRegistry();

  async execute(task: Task): Promise<any> {
    this.start(task);

    try {
      // Strategy 1: MCP Tool (fastest)
      const result = await this.tryMCPTool(task);
      if (result) return result;

      // Strategy 2: Workflow
      const workflowResult = await this.tryWorkflow(task);
      if (workflowResult) return workflowResult;

      // Strategy 3: Package
      const packageResult = await this.tryPackage(task);
      if (packageResult) return packageResult;

      // Strategy 4: Service
      const serviceResult = await this.tryService(task);
      if (serviceResult) return serviceResult;

      throw new Error('No integration found for task');
    } catch (error: any) {
      this.fail(task, error.message);
      throw error;
    }
  }

  private async tryMCPTool(task: Task): Promise<any> {
    const toolName = this.detectTool(task);
    if (!toolName) return null;

    this.updateProgress(task, 30, `Using MCP tool: ${toolName}`);

    const tool = this.registry.get(toolName);
    if (!tool) return null;

    const result = await tool.handler(task.input);
    this.complete(task, result);
    return result;
  }

  private async tryWorkflow(task: Task): Promise<any> {
    const workflowName = this.detectWorkflow(task);
    if (!workflowName) return null;

    this.updateProgress(task, 30, `Using workflow: ${workflowName}`);

    const result = await orchestrate(workflowName, task.input);
    this.complete(task, result);
    return result;
  }

  private detectTool(task: Task): string | null {
    // Pattern matching
    const description = task.description.toLowerCase();

    if (description.includes('verify') && description.includes('gst')) {
      return 'gst_verify';
    }
    if (description.includes('create') && description.includes('invoice')) {
      return 'invoice_create';
    }
    if (description.includes('track') && description.includes('shipment')) {
      return 'shipment_track';
    }
    // ... 270+ more patterns

    return null;
  }

  private detectWorkflow(task: Task): string | null {
    const description = task.description.toLowerCase();

    if (description.includes('gst invoice')) {
      return 'invoice_compliance_workflow';
    }
    if (description.includes('onboard customer')) {
      return 'crm_onboarding_workflow';
    }

    return null;
  }
}
```

---

## Task Mapping Intelligence

### Keyword → Tool Mapping

```typescript
const TOOL_MAPPINGS = {
  // Compliance
  'verify.*gst': 'gst_verify',
  'calculate.*gst': 'gst_calc',
  'hsn.*code': 'hsn_lookup',
  'file.*gstr': 'gstr_file',
  'e-invoice': 'einvoice_generate',

  // ERP
  'create.*invoice': 'invoice_create',
  'stock.*check': 'inventory_check',
  'purchase.*order': 'po_create',
  'sales.*order': 'so_create',

  // CRM
  'add.*contact': 'contact_create',
  'create.*lead': 'lead_create',
  'track.*opportunity': 'opportunity_track',

  // Logistics
  'track.*shipment': 'shipment_track',
  'optimize.*route': 'route_optimize',
  'calculate.*cost': 'voyage_cost_estimate',

  // Finance
  'calculate.*emi': 'emi_calculator',
  'upi.*payment': 'upi_create_link',
  'pay.*bill': 'bbps_payment',
};

function detectTool(description: string): string | null {
  for (const [pattern, toolName] of Object.entries(TOOL_MAPPINGS)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(description)) {
      return toolName;
    }
  }
  return null;
}
```

---

## Example: End-to-End Integration

### User Request: "Create a GST invoice for customer ABC"

**Command Center Flow**:

```
1. User types: "Create a GST invoice for customer ABC"
   ↓
2. PlanBuilder creates tasks:
   - Task 1: Verify customer GSTIN
   - Task 2: Create invoice
   - Task 3: Generate E-Invoice
   ↓
3. SmartExecutor routes each task:

   Task 1: "Verify customer GSTIN"
   → detectTool() → "gst_verify"
   → registry.get('gst_verify')
   → MCP tool invocation
   → Result: { valid: true, businessName: "ABC Corp" }

   Task 2: "Create invoice"
   → detectTool() → "invoice_create"
   → registry.get('invoice_create')
   → MCP tool invocation
   → Result: { invoiceId: "INV-001", total: 11800 }

   Task 3: "Generate E-Invoice"
   → detectTool() → "einvoice_generate"
   → registry.get('einvoice_generate')
   → MCP tool invocation
   → Result: { irn: "...", qrCode: "..." }
   ↓
4. Orchestrator aggregates results
   ↓
5. DeliveryResult:
   {
     urls: { invoice: "http://localhost:4001/invoice/INV-001" },
     packages: ["@ankr/compliance-engine"],
     files: [{ path: "invoices/INV-001.pdf" }],
     metrics: { time: "2.3s", cost: "$0.01" }
   }
```

**ZERO CODE GENERATION** - Uses existing 270+ tools!

---

## Benefits of This Approach

### ✅ Advantages

1. **No code duplication** - Reuses 270+ existing tools
2. **Fast execution** - Direct tool calls (10-500ms)
3. **Reliable** - Production-tested tools
4. **Maintainable** - Single source of truth (MCP registry)
5. **Extensible** - New tools auto-discovered

### ⚠️ Trade-offs

1. **Limited to existing tools** - Can't generate new capabilities on-the-fly
2. **Requires mapping** - Must maintain task → tool mappings
3. **Service dependencies** - Relies on 25+ services being up

### 🔄 Hybrid Solution

```typescript
// Try existing tools first, generate code as fallback
async execute(task: Task) {
  // 1. Try MCP tools (fast, reliable)
  const mcpResult = await this.tryMCPTool(task);
  if (mcpResult) return mcpResult;

  // 2. Try workflows
  const workflowResult = await this.tryWorkflow(task);
  if (workflowResult) return workflowResult;

  // 3. Fallback: Generate code with AIguru
  return await this.generateCode(task);
}
```

---

## Implementation Checklist

### Week 1: Core Integration
- [ ] Create SmartExecutor class
- [ ] Integrate @ankr/mcp tool registry
- [ ] Add tool detection patterns (50 common tools)
- [ ] Integrate @ankr/ports for service discovery
- [ ] Test: "Verify GST" → Working result
- [ ] Test: "Create invoice" → Working result

### Week 2: Workflow Integration
- [ ] Integrate orchestration engine
- [ ] Add workflow detection
- [ ] Test complex workflows (3+ steps)
- [ ] Add error recovery
- [ ] Test: "Create GST invoice" → End-to-end

### Week 3: Production Polish
- [ ] Health checks for all services
- [ ] Fallback to code generation
- [ ] Cost tracking
- [ ] Performance optimization
- [ ] Load testing (100 concurrent tasks)

---

## Success Metrics

| Metric | Target | How |
|--------|--------|-----|
| **Tool Coverage** | 80% | 50+ common tasks use MCP tools |
| **Response Time** | <1s | Direct tool calls |
| **Reliability** | 95%+ | Error recovery + fallbacks |
| **Code Reuse** | 90%+ | Use existing tools, minimal generation |
| **Cost** | <$0.01/task | Local tools = FREE |

---

## Next Steps

1. **Read tool registry code** - `/root/ankr-labs-nx/packages/ankr-mcp/`
2. **Implement SmartExecutor** - Use registry, not code generation
3. **Add tool mappings** - 50 most common patterns
4. **Test integration** - "Verify GST" → Real GSTIN validation
5. **Iterate** - Add more tools as needed

**Intelligence over brute force** - Leverage 270+ tools, don't rebuild! 🧠
